import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { EnvFile } from './scanner.js';

export async function generateExample(envFiles: EnvFile[], cwd: string): Promise<string | null> {
  if (envFiles.length === 0) return null;

  const lines: string[] = [
    '# =======================================',
    '# Auto-generated .env.example',
    '# DO NOT commit secrets — use this as a template',
    '# =======================================',
    '',
  ];

  for (const file of envFiles) {
    try {
      const fullPath = resolve(cwd, file.relativePath);
      const content = readFileSync(fullPath, 'utf8');
      const fileLines = content.split('\n');

      lines.push(`# === ${file.relativePath} ===`);

      for (const line of fileLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
          lines.push(trimmed);
          continue;
        }

        const eqIdx = trimmed.indexOf('=');
        if (eqIdx === -1) {
          lines.push(trimmed);
          continue;
        }

        const key = trimmed.slice(0, eqIdx).trim();
        const value = trimmed.slice(eqIdx + 1).trim();

        // Strip quotes from value
        const cleanValue = (value.startsWith('"') && value.endsWith('"')) ||
                          (value.startsWith("'") && value.endsWith("'"))
          ? value.slice(1, -1)
          : value;

        lines.push(`${key}=${cleanValue ? '<REDACTED>' : ''}`);
      }
      lines.push('');
    } catch {
      // Skip unreadable files
    }
  }

  const output = lines.join('\n');
  const examplePath = resolve(cwd, '.env.example');

  try {
    writeFileSync(examplePath, output, 'utf8');
  } catch {
    // Write failed — just return the content for display
  }

  return output;
}
