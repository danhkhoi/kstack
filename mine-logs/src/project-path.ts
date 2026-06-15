import * as path from 'path';
import * as os from 'os';

export function cwdToProjectKey(cwd: string): string {
  return cwd.replace(/\//g, '-');
}

export function projectLogDir(cwd: string = process.cwd()): string {
  return path.join(os.homedir(), '.claude', 'projects', cwdToProjectKey(cwd));
}
