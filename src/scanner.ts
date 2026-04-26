import fg from 'fast-glob';

export interface EnvFile {
  path: string;
  relativePath: string;
  content?: string;
}

export async function scan(dir: string): Promise<EnvFile[]> {
  const patterns = [
    '**/.env*',
    '**/secrets*',
    '**/config*secrets*',
  ];

  const files = await fg(patterns, {
    cwd: dir,
    absolute: false,
    onlyFiles: true,
    ignore: [
      '**/node_modules/**',
      '**/.git/**',
      '**/dist/**',
      '**/*.example*',
    ],
  });

  return files.map((path) => ({
    path,
    relativePath: path,
  }));
}
