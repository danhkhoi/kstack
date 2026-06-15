import { describe, test, expect } from 'bun:test';
import { normalizeTitle, titleToSlug, dedupAgainstMemory } from '../src/dedup';
import type { Lesson } from '../src/llm';

const makeLesson = (title: string): Lesson => ({
  title,
  type: 'tool-correction',
  context: 'ctx',
  lesson: 'lesson',
  confidence: 0.9,
  sourceSessionIds: [],
});

describe('dedup', () => {
  test('normalizeTitle lowercases and strips punctuation/backticks', () => {
    // Punctuation and backticks become spaces; spaces are then collapsed
    expect(normalizeTitle('Use `bun test`, not npm test!')).toBe('use bun test not npm test');
  });

  test('titleToSlug produces lesson_ prefixed slug', () => {
    const slug = titleToSlug('Use bun test');
    expect(slug).toMatch(/^lesson_use_bun_test/);
    expect(slug.length).toBeLessThanOrEqual(80 + 'lesson_'.length);
  });

  test('dedupAgainstMemory filters lessons whose slug is in existingSlugs', () => {
    const lessons = [
      makeLesson('Use bun test'),
      makeLesson('Avoid mocks'),
    ];
    const existingSlugs = new Set(['lesson_use_bun_test']);
    const filtered = dedupAgainstMemory(lessons, existingSlugs);
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toBe('Avoid mocks');
  });

  test('dedupAgainstMemory returns all lessons when no slugs match', () => {
    const lessons = [makeLesson('Lesson A'), makeLesson('Lesson B')];
    const filtered = dedupAgainstMemory(lessons, new Set());
    expect(filtered.length).toBe(2);
  });

  test('dedupAgainstMemory returns empty array for empty input', () => {
    expect(dedupAgainstMemory([], new Set(['lesson_x']))).toEqual([]);
  });
});
