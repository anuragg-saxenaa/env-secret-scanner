import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

export interface GitInfo {
  tracked: boolean;
  staged: boolean;
  status: string;
}

export async function checkGitStatus(file: { relativePath: string }, cwd: string): Promise<GitInfo> {
  const fullPath = resolve(cwd, file.relativePath);

  try {
    // Check git status for this specific file
    const status = execSync(
      `git status --porcelain "${fullPath}" 2>/dev/null`,
      { cwd, encoding: 'utf8', timeout: 5000 }
    ).trim();

    if (!status) {
      return { tracked: true, staged: false, status: 'clean (tracked, unchanged)' };
    }

    const firstChar = status[0] ?? '';
    const secondChar = status[1] ?? ' ';
    const tracked = firstChar !== '?' && firstChar !== '!';
    const staged = firstChar !== '?' && firstChar !== ' ' && firstChar !== '?';

    return {
      tracked,
      staged,
      status: status || 'untracked',
    };
  } catch {
    // Not a git repo
    return { tracked: false, staged: false, status: 'not a git repo' };
  }
}
