import { describe, test, expect } from 'bun:test';
import { writeCandidates, parseCandidates } from '../src/candidates';
import type { Lesson } from '../src/llm';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

const sampleLesson: Lesson = {
  title: 'Use bun test not npm test',
  type: 'tool-correction',
  context: 'Claude ran npm test; user corrected.',
  lesson: 'In kstack, always use `bun test`.',
  confidence: 0.9,
  sourceSessionIds: ['abc123'],
};

describe('candidates file', () => {
  test('writeCandidates produces parseable markdown with checkboxes', async () => {
    const tmp = path.join(os.tmpdir(), `cand-${Date.now()}.md`);
    await writeCandidates(tmp, [sampleLesson], { totalSessions: 5 });

    const content = await fs.readFile(tmp, 'utf8');
    expect(content).toContain('- [ ] keep');
    expect(content).toContain('Use bun test not npm test');
    expect(content).toContain('**Confidence:** 0.9');

    const parsed = parseCandidates(content);
    expect(parsed.length).toBe(1);
    expect(parsed[0].ticked).toBe(false);
    expect(parsed[0].title).toBe('Use bun test not npm test');

    await fs.unlink(tmp);
  });

  test('parseCandidates round-trips tick state', async () => {
    const tmp = path.join(os.tmpdir(), `cand2-${Date.now()}.md`);
    await writeCandidates(tmp, [
      { ...sampleLesson, title: 'Lesson A' },
      { ...sampleLesson, title: 'Lesson B' },
    ], { totalSessions: 1 });

    let txt = await fs.readFile(tmp, 'utf8');
    // Tick the first lesson by replacing its specific checkbox
    txt = txt.replace('## 1. Lesson A\n- [ ] keep', '## 1. Lesson A\n- [x] keep');

    const parsed = parseCandidates(txt);
    expect(parsed[0].ticked).toBe(true);
    expect(parsed[1].ticked).toBe(false);

    await fs.unlink(tmp);
  });

  test('parseCandidates handles empty file gracefully', () => {
    const parsed = parseCandidates('');
    expect(parsed).toEqual([]);
  });

  test('parseCandidates handles file with no candidates', () => {
    const parsed = parseCandidates('# Lesson candidates\n\nNo candidates found.');
    expect(parsed).toEqual([]);
  });
});
