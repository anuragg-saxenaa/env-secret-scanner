export type SecretHit = { key: string; valuePreview: string; reason: string };

const riskyKey = /(password|passwd|token|secret|api[_-]?key|private[_-]?key|access[_-]?key|client[_-]?secret)/i;
const valuePatterns: Array<[RegExp, string]> = [
  [/^sk-[A-Za-z0-9\-_]{20,}$/, 'OpenAI-like key'],
  [/^gh[pousr]_[A-Za-z0-9]{20,}$/, 'GitHub token'],
  [/^AKIA[0-9A-Z]{16}$/, 'AWS access key'],
  [/^AIza[0-9A-Za-z\-_]{20,}$/, 'Google API key'],
  [/^xox[baprs]-[A-Za-z0-9-]{10,}$/, 'Slack token'],
  [/^pk_live_[A-Za-z0-9]{20,}$/, 'Stripe public key'],
  [/^sk_live_[A-Za-z0-9]{20,}$/, 'Stripe secret key'],
  [/^eyJ[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/, 'JWT token'],
  [/^AIzaSy[A-Za-z0-9\-_]{20,}$/, 'Google service token'],
  [/^[A-Za-z0-9\/+]{32,}={0,2}$/, 'High entropy token-like value']
];

export function detectSecrets(entries: Record<string, string>): SecretHit[] {
  const hits: SecretHit[] = [];
  for (const [key, valueRaw] of Object.entries(entries)) {
    const value = valueRaw.trim();
    if (!value) continue;
    if (riskyKey.test(key)) hits.push({ key, valuePreview: preview(value), reason: 'Sensitive variable name' });
    for (const [rx, reason] of valuePatterns) {
      if (rx.test(value)) hits.push({ key, valuePreview: preview(value), reason });
    }
  }
  return dedupe(hits);
}

function preview(v: string): string {
  return v.length <= 10 ? '<REDACTED>' : `${v.slice(0, 4)}...${v.slice(-4)}`;
}

function dedupe(hits: SecretHit[]): SecretHit[] {
  const seen = new Set<string>();
  return hits.filter((h) => {
    const k = `${h.key}:${h.reason}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}
