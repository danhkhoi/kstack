import { describe, test, expect } from 'bun:test';
import { parseTranscript } from '../src/transcript';
import * as path from 'path';

const FIXTURE = path.join(import.meta.dir, 'fixtures', 'sample-session.jsonl');

describe('transcript parser', () => {
  test('parses every conversation entry and skips metadata + malformed lines', async () => {
    const entries = await parseTranscript(FIXTURE);
    // Should have only the 4 real conversation entries (1 user text, 1 assistant mixed, 1 user tool_result, 1 final assistant)
    expect(entries.length).toBe(4);
    // No undefined roles
    expect(entries.every(e => e.role === 'user' || e.role === 'assistant')).toBe(true);
  });

  test('extracts text content for user text messages', async () => {
    const entries = await parseTranscript(FIXTURE);
    const userText = entries.find(e => e.role === 'user' && e.kind === 'text');
    expect(userText).toBeDefined();
    expect(userText!.text).toContain('please fix');
  });

  test('flags tool results with is_error', async () => {
    const entries = await parseTranscript(FIXTURE);
    const errors = entries.filter(e => e.kind === 'tool_result' && e.isError);
    expect(errors.length).toBe(1);
  });

  test('extracts tool_use entries from assistant messages', async () => {
    const entries = await parseTranscript(FIXTURE);
    const toolUses = entries.filter(e => e.kind === 'tool_use');
    expect(toolUses.length).toBeGreaterThanOrEqual(1);
    expect(toolUses[0].toolName).toBeDefined();
  });

  test('preserves order via timestamp / file order', async () => {
    const entries = await parseTranscript(FIXTURE);
    // first conversation entry should be the user "please fix"
    expect(entries[0].role).toBe('user');
    expect(entries[0].kind).toBe('text');
  });
});
