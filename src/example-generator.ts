import fs from 'node:fs';
import path from 'node:path';

export function parseEnv(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of content.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    const value = line.slice(i + 1).trim();
    if (key) out[key] = value;
  }
  return out;
}

export function writeExample(envPath: string, entries: Record<string, string>): string {
  const lines = Object.keys(entries).sort().map((k) => `${k}=<REDACTED>`);
  const outPath = path.join(path.dirname(envPath), '.env.example');
  fs.writeFileSync(outPath, `${lines.join('\n')}\n`, 'utf8');
  return outPath;
}
