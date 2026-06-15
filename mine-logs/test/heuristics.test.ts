import { describe, test, expect } from 'bun:test';
import { findBugFixWindows, findCorrectionWindows } from '../src/heuristics';
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

describe('heuristics: corrections', () => {
  test('flags user correction phrases', async () => {
    const entries = await parseTranscript(path.join(import.meta.dir, 'fixtures', 'correction-session.jsonl'));
    const windows = findCorrectionWindows(entries);
    expect(windows.length).toBeGreaterThanOrEqual(1);
    expect(windows[0].kind).toBe('correction');
  });

  test('matches no/don\'t/stop/instead/actually as leading words (case-insensitive)', () => {
    const cases = ['No really', "Don't do that", 'Stop using X', 'Instead of that', 'Actually wait'];
    for (const text of cases) {
      const entries = [
        { role: 'assistant', kind: 'text', text: 'did thing' },
        { role: 'user', kind: 'text', text },
      ] as any;
      expect(findCorrectionWindows(entries).length).toBe(1);
    }
  });

  test('does NOT flag user messages without correction phrases', () => {
    const entries = [
      { role: 'assistant', kind: 'text', text: 'did thing' },
      { role: 'user', kind: 'text', text: 'looks good, thanks' },
    ] as any;
    expect(findCorrectionWindows(entries).length).toBe(0);
  });

  test('does NOT flag tool_result entries (only user-text)', () => {
    const entries = [
      { role: 'user', kind: 'tool_result', isError: false, toolResultContent: 'no stop' },
    ] as any;
    expect(findCorrectionWindows(entries).length).toBe(0);
  });
});
