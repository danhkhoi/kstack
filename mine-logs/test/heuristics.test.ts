import { describe, test, expect } from 'bun:test';
import { findBugFixWindows } from '../src/heuristics';
import { parseTranscript } from '../src/transcript';
import * as path from 'path';

describe('heuristics: bug-fix windows', () => {
  test('flags windows: tool_result error followed by 3+ tool_use calls before next user message', async () => {
    const entries = await parseTranscript(path.join(import.meta.dir, 'fixtures', 'bugfix-session.jsonl'));
    const windows = findBugFixWindows(entries);
    expect(windows.length).toBe(1);
    expect(windows[0].kind).toBe('bug-fix');
    expect(windows[0].startIdx).toBeGreaterThanOrEqual(0);
    expect(windows[0].endIdx).toBeGreaterThan(windows[0].startIdx);
  });

  test('does NOT flag when fewer than 3 tool calls after the error', async () => {
    const entries = [
      { role: 'user', kind: 'text', text: 'do thing' },
      { role: 'assistant', kind: 'tool_use', toolName: 'Read' },
      { role: 'user', kind: 'tool_result', isError: true },
      { role: 'assistant', kind: 'tool_use', toolName: 'Read' },
      { role: 'assistant', kind: 'tool_use', toolName: 'Edit' },
      { role: 'user', kind: 'text', text: 'ok' },
    ] as any;
    const windows = findBugFixWindows(entries);
    expect(windows.length).toBe(0);
  });

  test('returns empty array on empty input', () => {
    expect(findBugFixWindows([])).toEqual([]);
  });
});
