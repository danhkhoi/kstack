import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as readline from 'readline/promises';
import { parseCandidates } from './candidates';
import { titleToSlug } from './dedup';
import { cwdToProjectKey } from './project-path';
import type { Lesson } from './llm';

const LESSON_TYPE_TO_MEMORY_TYPE: Record<string, string> = {
  'bug-fix-recipe': 'project',
  'tool-correction': 'feedback',
  'approach-redirect': 'feedback',
  'env-gotcha': 'project',
  'domain-rule': 'project',
  'anti-pattern': 'feedback',
  'verification-failure': 'feedback',
};

export async function writeLessonToMemory(memoryDir: string, lesson: Lesson): Promise<string | null> {
  await fs.mkdir(memoryDir, { recursive: true });
  const slug = titleToSlug(lesson.title);
  const filePath = path.join(memoryDir, `${slug}.md`);

  // Idempotent: skip if already exists
  try {
    await fs.access(filePath);
    return null;
  } catch { /* not present, continue */ }

  const memoryType = LESSON_TYPE_TO_MEMORY_TYPE[lesson.type] ?? 'feedback';
  const nameSlug = slug.replace(/^lesson_/, '');
  const body = [
    '---',
    `name: ${nameSlug}`,
    `description: ${oneLine(lesson.lesson)}`,
    'metadata:',
    `  type: ${memoryType}`,
    '---',
    '',
    lesson.lesson,
    '',
    `**Why:** ${lesson.context}`,
    '',
    `**Sources:** ${lesson.sourceSessionIds.join(', ')}`,
    '',
  ].join('\n');

  await fs.writeFile(filePath, body, 'utf8');

  // Append to MEMORY.md index
  const indexPath = path.join(memoryDir, 'MEMORY.md');
  const indexLine = `- [${lesson.title}](${slug}.md) — ${oneLine(lesson.lesson).slice(0, 100)}\n`;
  await fs.appendFile(indexPath, indexLine, 'utf8');

  return filePath;
}

async function appendLessonsToFile(filePath: string, lessons: Lesson[]): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const lines = [`\n## Lessons learned (mined ${date})\n`];
  for (const l of lessons) {
    lines.push(`### ${l.title}`);
    lines.push(`*Type: ${l.type} · Confidence: ${l.confidence}*`);
    lines.push('');
    lines.push(`**Context:** ${l.context}`);
    lines.push('');
    lines.push(`**Lesson:** ${l.lesson}`);
    lines.push('');
  }
  await fs.appendFile(filePath, lines.join('\n'), 'utf8');
}

function oneLine(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

export async function runPromote(cwd: string = process.cwd()): Promise<void> {
  const candPath = path.join(cwd, 'LESSON_CANDIDATES.md');
  let content: string;
  try {
    content = await fs.readFile(candPath, 'utf8');
  } catch {
    console.error(`No LESSON_CANDIDATES.md found in ${cwd}.`);
    console.error(`Run '/kstack-mine-logs extract' first.`);
    process.exit(1);
  }

  const parsed = parseCandidates(content);
  const ticked = parsed.filter(c => c.ticked);

  if (ticked.length === 0) {
    console.log(`No ticked lessons found.`);
    console.log(`Edit ${candPath} and change '- [ ] keep' to '- [x] keep' for lessons to save.`);
    return;
  }

  console.log(`Found ${ticked.length} ticked lesson(s).`);
  console.log('Where should they go?');
  console.log('  1. Auto-memory (~/.claude/projects/<proj>/memory/)');
  console.log('  2. A markdown file in this repo');
  console.log('  3. Cancel');

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = (await rl.question('> ')).trim();

  if (answer === '1') {
    const projectKey = cwdToProjectKey(cwd);
    const memoryDir = path.join(os.homedir(), '.claude', 'projects', projectKey, 'memory');
    let written = 0;
    let skipped = 0;
    for (const lesson of ticked) {
      const result = await writeLessonToMemory(memoryDir, lesson);
      if (result) {
        console.log(`✓ ${path.basename(result)}`);
        written++;
      } else {
        console.log(`  (skipped — already exists: ${lesson.title})`);
        skipped++;
      }
    }
    console.log(`\nDone. ${written} written, ${skipped} skipped.`);
  } else if (answer === '2') {
    const targetRaw = (await rl.question('File path (default: LESSONS.md): ')).trim();
    const target = path.join(cwd, targetRaw || 'LESSONS.md');
    await appendLessonsToFile(target, ticked);
    console.log(`✓ Appended ${ticked.length} lesson(s) to ${target}`);
  } else {
    console.log('Cancelled.');
  }

  rl.close();
}
