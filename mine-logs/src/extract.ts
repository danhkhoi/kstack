import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import Anthropic from '@anthropic-ai/sdk';
import { projectLogDir, cwdToProjectKey } from './project-path';
import { parseTranscript } from './transcript';
import { findBugFixWindows, findCorrectionWindows, findFalseCompletionWindows, findRepeatedPatterns } from './heuristics';
import type { CandidateWindow } from './heuristics';
import { extractLesson, type Lesson } from './llm';
import { writeCandidates } from './candidates';
import { titleToSlug, dedupAgainstMemory } from './dedup';

export async function runExtract(cwd: string = process.cwd()): Promise<void> {
  const logDir = projectLogDir(cwd);

  let sessionFiles: string[];
  try {
    const names = await fs.readdir(logDir);
    sessionFiles = names
      .filter(n => n.endsWith('.jsonl'))
      .map(n => path.join(logDir, n));
  } catch {
    console.error(`No logs found at ${logDir}`);
    console.error(`Is your current directory a Claude Code project? (cwd: ${cwd})`);
    process.exit(1);
  }

  if (sessionFiles.length === 0) {
    console.log(`No session files found in ${logDir}. Nothing to extract.`);
    return;
  }

  console.log(`Scanning ${sessionFiles.length} sessions from ${logDir}...`);

  const perSession: { sessionId: string; entries: Awaited<ReturnType<typeof parseTranscript>> }[] = [];
  const allWindows: { sessionId: string; window: CandidateWindow }[] = [];

  for (const file of sessionFiles) {
    const sessionId = path.basename(file, '.jsonl');
    const entries = await parseTranscript(file);
    perSession.push({ sessionId, entries });
    for (const w of [
      ...findBugFixWindows(entries),
      ...findCorrectionWindows(entries),
      ...findFalseCompletionWindows(entries),
    ]) {
      allWindows.push({ sessionId, window: w });
    }
  }

  const repeatedPatterns = findRepeatedPatterns(perSession);
  console.log(`Heuristic stage: ${allWindows.length} windows + ${repeatedPatterns.length} cross-session repeated patterns`);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set. Set it and re-run.');
    process.exit(1);
  }
  const client = new Anthropic({ apiKey });

  const lessons: Lesson[] = [];
  for (const { sessionId, window } of allWindows) {
    process.stdout.write('.');
    const lesson = await extractLesson(client, window);
    if (lesson) {
      lesson.sourceSessionIds = [sessionId];
      lessons.push(lesson);
    }
  }
  process.stdout.write('\n');
  console.log(`LLM stage: ${lessons.length}/${allWindows.length} windows produced a lesson`);

  // Dedup against existing memory dir
  const projectKey = cwdToProjectKey(cwd);
  const memDir = path.join(os.homedir(), '.claude', 'projects', projectKey, 'memory');
  let existingSlugs = new Set<string>();
  try {
    const memFiles = await fs.readdir(memDir);
    existingSlugs = new Set(
      memFiles.filter(f => f.endsWith('.md') && f !== 'MEMORY.md').map(f => f.replace(/\.md$/, ''))
    );
  } catch { /* memory dir may not exist yet */ }

  const deduped = dedupAgainstMemory(lessons, existingSlugs);
  if (lessons.length !== deduped.length) {
    console.log(`Dedup: skipped ${lessons.length - deduped.length} lesson(s) already in memory`);
  }

  const outPath = path.join(cwd, 'LESSON_CANDIDATES.md');
  await writeCandidates(outPath, deduped, { totalSessions: sessionFiles.length });
  console.log(`\n✓ Wrote ${deduped.length} candidate(s) to ${outPath}`);
  console.log(`  Tick [x] next to keepers, then run: /kstack-mine-logs promote`);
}
