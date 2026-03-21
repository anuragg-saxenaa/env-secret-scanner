import fg from 'fast-glob';
import path from 'node:path';

export async function findEnvFiles(rootDir: string): Promise<string[]> {
  const files = await fg(['**/.env*'], {
    cwd: rootDir,
    onlyFiles: true,
    dot: true,
    ignore: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/build/**']
  });
  return files.map((f) => path.join(rootDir, f)).sort();
}
