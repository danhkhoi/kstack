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

const CORRECTION_RE = /^\s*(no\b|don't\b|do not\b|stop\b|instead\b|actually\b|use\s+\S+\s+not\b|that's wrong\b|that is wrong\b)/i;

export function extractText(e: TranscriptEntry): string {
  if (e.kind === 'text' && typeof e.text === 'string') return e.text;
  return '';
}

export function findCorrectionWindows(entries: TranscriptEntry[]): CandidateWindow[] {
  const out: CandidateWindow[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.role !== 'user' || e.kind !== 'text') continue;
    const text = extractText(e);
    if (!CORRECTION_RE.test(text)) continue;
    const start = Math.max(0, i - 2);
    const end = Math.min(entries.length, i + 3);
    out.push({
      kind: 'correction',
      startIdx: start,
      endIdx: end,
      entries: entries.slice(start, end),
    });
  }
  return out;
}

const COMPLETION_CLAIM_RE = /\b(all done|tests pass|complete|finished|works now|fixed)\b/i;
const REBUTTAL_RE = /\b(actually|didn't|wrong|still broken|you didn't|no it|not really)\b/i;

export function findFalseCompletionWindows(entries: TranscriptEntry[]): CandidateWindow[] {
  const out: CandidateWindow[] = [];
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    if (e.role !== 'assistant' || e.kind !== 'text') continue;
    if (!COMPLETION_CLAIM_RE.test(extractText(e))) continue;
    // Look for rebuttal in next 1-2 user-text entries
    for (let j = i + 1; j <= Math.min(i + 2, entries.length - 1); j++) {
      if (entries[j].role === 'user' && entries[j].kind === 'text' && REBUTTAL_RE.test(extractText(entries[j]))) {
        out.push({
          kind: 'false-completion',
          startIdx: i,
          endIdx: j,
          entries: entries.slice(i, j + 1),
        });
        break;
      }
    }
  }
  return out;
}
