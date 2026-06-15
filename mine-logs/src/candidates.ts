import * as fs from 'fs/promises';
import type { Lesson } from './llm';

export type ParsedCandidate = Lesson & { ticked: boolean; idx: number };

export async function writeCandidates(
  filePath: string,
  lessons: Lesson[],
  meta: { totalSessions: number; date?: string }
): Promise<void> {
  const date = meta.date ?? new Date().toISOString().slice(0, 10);
  const lines: string[] = [];
  lines.push(`# Lesson candidates — extracted ${date}`);
  lines.push('');
  lines.push(`${lessons.length} candidates from ${meta.totalSessions} sessions. Tick \`[x]\` to keep, then run \`/kstack-mine-logs promote\`.`);
  lines.push('');
  lines.push('---');
  lines.push('');
  lessons.forEach((l, i) => {
    lines.push(`## ${i + 1}. ${l.title}`);
    lines.push(`- [ ] keep`);
    lines.push(`**Type:** ${l.type}  **Confidence:** ${l.confidence}`);
    lines.push(`**Sources:** ${l.sourceSessionIds.join(', ')}`);
    lines.push(`**What happened:** ${l.context}`);
    lines.push(`**Lesson:** ${l.lesson}`);
    lines.push('');
  });
  await fs.writeFile(filePath, lines.join('\n'), 'utf8');
}

export function parseCandidates(content: string): ParsedCandidate[] {
  if (!content.trim()) return [];
  // Split on "## N. Title" headers
  const blocks = content.split(/\n(?=## \d+\. )/);
  const out: ParsedCandidate[] = [];
  let idx = 0;
  for (const block of blocks) {
    // Only process blocks that start with a numbered header
    const headerMatch = block.match(/^## \d+\. (.+)/);
    if (!headerMatch) continue;
    const title = headerMatch[1].trim();
    const ticked = /- \[x\] keep/i.test(block);
    const typeMatch = block.match(/\*\*Type:\*\*\s*(\S+)/);
    const confMatch = block.match(/\*\*Confidence:\*\*\s*([0-9.]+)/);
    const sourcesMatch = block.match(/\*\*Sources:\*\*\s*(.*)/);
    const ctxMatch = block.match(/\*\*What happened:\*\*\s*(.*)/);
    const lessonMatch = block.match(/\*\*Lesson:\*\*\s*(.*)/);
    out.push({
      idx,
      ticked,
      title,
      type: typeMatch?.[1] ?? '',
      confidence: parseFloat(confMatch?.[1] ?? '0'),
      sourceSessionIds: (sourcesMatch?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean),
      context: ctxMatch?.[1]?.trim() ?? '',
      lesson: lessonMatch?.[1]?.trim() ?? '',
    });
    idx++;
  }
  return out;
}
