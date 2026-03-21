import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';

const execFileAsync = promisify(execFile);

export type GitExposure = { tracked: boolean; staged: boolean };

export async function checkGitExposure(filePath: string): Promise<GitExposure> {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath);
  try {
    const { stdout: trackedOut } = await execFileAsync('git', ['ls-files', '--', base], { cwd: dir });
    const { stdout: stagedOut } = await execFileAsync('git', ['diff', '--cached', '--name-only', '--', base], { cwd: dir });
    return { tracked: trackedOut.trim().length > 0, staged: stagedOut.trim().length > 0 };
  } catch {
    return { tracked: false, staged: false };
  }
}
