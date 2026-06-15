import { describe, test, expect } from 'bun:test';
import { cwdToProjectKey, projectLogDir } from '../src/project-path';
import * as path from 'path';
import * as os from 'os';

describe('project-path', () => {
  test('cwdToProjectKey replaces / with - and prefixes with -', () => {
    expect(cwdToProjectKey('/Users/khoinguyen/project/kstack')).toBe('-Users-khoinguyen-project-kstack');
  });

  test('projectLogDir resolves under ~/.claude/projects', () => {
    const dir = projectLogDir('/Users/khoinguyen/project/kstack');
    expect(dir).toBe(path.join(os.homedir(), '.claude', 'projects', '-Users-khoinguyen-project-kstack'));
  });
});
