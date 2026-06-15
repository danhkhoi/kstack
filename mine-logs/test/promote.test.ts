import { describe, test, expect } from 'bun:test';
import { writeLessonToMemory } from '../src/promote';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import type { Lesson } from '../src/llm';

const lesson: Lesson = {
  title: 'Use bun test',
  type: 'tool-correction',
  context: 'Claude ran npm test; user corrected.',
  lesson: 'In kstack, always use `bun test`.',
  confidence: 0.9,
  sourceSessionIds: ['abc'],
};

describe('promote: memory route', () => {
  test('writeLessonToMemory creates a .md file with frontmatter', async () => {
    const tmpDir = path.join(os.tmpdir(), `mem-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    const written = await writeLessonToMemory(tmpDir, lesson);

    expect(written).not.toBeNull();
    const content = await fs.readFile(written!, 'utf8');
    expect(content).toMatch(/^---\nname:/m);
    expect(content).toContain('type: feedback');
    expect(content).toContain('use `bun test`');

    await fs.rm(tmpDir, { recursive: true });
  });

  test('writeLessonToMemory updates MEMORY.md index', async () => {
    const tmpDir = path.join(os.tmpdir(), `mem-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    await writeLessonToMemory(tmpDir, lesson);
    const index = await fs.readFile(path.join(tmpDir, 'MEMORY.md'), 'utf8');
    expect(index).toContain('lesson_use_bun_test.md');

    await fs.rm(tmpDir, { recursive: true });
  });

  test('writeLessonToMemory returns null if slug already exists (idempotent)', async () => {
    const tmpDir = path.join(os.tmpdir(), `mem-${Date.now()}`);
    await fs.mkdir(tmpDir, { recursive: true });

    await writeLessonToMemory(tmpDir, lesson);
    const result = await writeLessonToMemory(tmpDir, lesson); // second call

    expect(result).toBeNull();
    await fs.rm(tmpDir, { recursive: true });
  });
});
