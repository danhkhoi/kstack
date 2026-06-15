import type { TranscriptEntry } from './transcript';

export type CandidateWindow = {
  kind: 'bug-fix' | 'correction' | 'env-domain' | 'false-completion' | 'repeated';
  startIdx: number;
  endIdx: number;
  entries: TranscriptEntry[];
};

const MIN_TOOL_CALLS_AFTER_ERROR = 3;

export function findBugFixWindows(entries: TranscriptEntry[]): CandidateWindow[] {
  const out: CandidateWindow[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.kind !== 'tool_result' || !e.isError) continue;

    // Count tool_use entries after i, stopping at the next user text message (new turn)
    let toolCallsAfter = 0;
    let j = i + 1;
    while (j < entries.length) {
      const next = entries[j];
      if (next.role === 'user' && next.kind === 'text') break;
      if (next.kind === 'tool_use') toolCallsAfter++;
      j++;
    }
    if (toolCallsAfter >= MIN_TOOL_CALLS_AFTER_ERROR) {
      out.push({
        kind: 'bug-fix',
        startIdx: i,
        endIdx: j,
        entries: entries.slice(i, j),
      });
    }
  }
  return out;
}
