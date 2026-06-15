import { describe, test, expect } from 'bun:test';
import { findBugFixWindows, findCorrectionWindows, findFalseCompletionWindows, findRepeatedPatterns } from '../src/heuristics';
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

describe('heuristics: false completions', () => {
  test('flags when Claude claims done and user rebuts within 2 turns', async () => {
    const entries = await parseTranscript(path.join(import.meta.dir, 'fixtures', 'false-completion-session.jsonl'));
    const windows = findFalseCompletionWindows(entries);
    expect(windows.length).toBe(1);
    expect(windows[0].kind).toBe('false-completion');
  });

  test('flags common completion claim phrases', () => {
    const phrases = ['all done', 'tests pass', 'complete', 'finished', 'works now', 'fixed'];
    for (const phrase of phrases) {
      const entries = [
        { role: 'assistant', kind: 'text', text: `I've ${phrase}` },
        { role: 'user', kind: 'text', text: "actually that's not right" },
      ] as any;
      expect(findFalseCompletionWindows(entries).length).toBe(1);
    }
  });

  test('does NOT flag when user turn is not a rebuttal', () => {
    const entries = [
      { role: 'assistant', kind: 'text', text: 'All done and fixed!' },
      { role: 'user', kind: 'text', text: 'Great, thank you!' },
    ] as any;
    expect(findFalseCompletionWindows(entries).length).toBe(0);
  });

  test('does NOT flag completion claim without following rebuttal', () => {
    const entries = [
      { role: 'assistant', kind: 'text', text: 'All done!' },
      { role: 'assistant', kind: 'text', text: 'Let me also add tests.' },
    ] as any;
    expect(findFalseCompletionWindows(entries).length).toBe(0);
  });
});

describe('heuristics: repeated patterns', () => {
  test('finds phrases repeated in 2+ distinct sessions', async () => {
    const a = await parseTranscript(path.join(import.meta.dir, 'fixtures', 'repeat-a.jsonl'));
    const b = await parseTranscript(path.join(import.meta.dir, 'fixtures', 'repeat-b.jsonl'));
    const repeats = findRepeatedPatterns([
      { sessionId: 'session-a', entries: a },
      { sessionId: 'session-b', entries: b },
    ]);
    expect(repeats.length).toBeGreaterThanOrEqual(1);
    expect(repeats[0].sessions.length).toBe(2);
  });

  test('does NOT flag phrases that appear in only one session', async () => {
    const a = await parseTranscript(path.join(import.meta.dir, 'fixtures', 'repeat-a.jsonl'));
    const repeats = findRepeatedPatterns([{ sessionId: 'session-a', entries: a }]);
    expect(repeats.length).toBe(0);
  });

  test('counts distinct sessions not total occurrences', () => {
    // Same phrase twice in same session should NOT count as repeated
    const entries = [
      { role: 'user', kind: 'text', text: 'stop using npm test' },
      { role: 'user', kind: 'text', text: 'stop using npm test' },
    ] as any;
    const repeats = findRepeatedPatterns([{ sessionId: 'only-session', entries }]);
    expect(repeats.length).toBe(0);
  });

  test('returns empty array when no correction phrases exist', () => {
    const entries = [{ role: 'user', kind: 'text', text: 'looks good thanks' }] as any;
    const repeats = findRepeatedPatterns([
      { sessionId: 'a', entries },
      { sessionId: 'b', entries },
    ]);
    expect(repeats.length).toBe(0);
  });
});
