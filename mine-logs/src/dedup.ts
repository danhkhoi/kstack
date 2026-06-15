import type { Lesson } from './llm';

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function titleToSlug(title: string): string {
  return 'lesson_' + normalizeTitle(title).replace(/\s+/g, '_').slice(0, 80);
}

export function dedupAgainstMemory(lessons: Lesson[], existingSlugs: Set<string>): Lesson[] {
  return lessons.filter(l => !existingSlugs.has(titleToSlug(l.title)));
}
