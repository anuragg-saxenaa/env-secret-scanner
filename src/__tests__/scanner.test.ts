import { describe, it, expect } from 'vitest';
import { detectSecrets } from '../detector.js';
import { parseEnv } from '../example-generator.js';

describe('detector', () => {
  it('detects AWS access key', () => {
    const hits = detectSecrets({ AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE' });
    expect(hits.some(h => h.reason === 'AWS access key')).toBe(true);
  });

  it('detects OpenAI key', () => {
    const hits = detectSecrets({ OPENAI_API_KEY: 'sk-test-1234567890abcdefghijk' });
    expect(hits.some(h => h.reason === 'OpenAI-like key')).toBe(true);
  });

  it('detects Stripe secret key', () => {
    const hits = detectSecrets({ STRIPE_SECRET_KEY: 'sk_live_abc123def456ghi789jkl' });
    expect(hits.some(h => h.reason === 'Stripe secret key')).toBe(true);
  });

  it('detects sensitive variable name', () => {
    const hits = detectSecrets({ DATABASE_PASSWORD: 'secret123' });
    expect(hits.some(h => h.key === 'DATABASE_PASSWORD')).toBe(true);
  });

  it('ignores safe variables', () => {
    const hits = detectSecrets({ PUBLIC_VAR: 'hello', NODE_ENV: 'production' });
    expect(hits.length).toBe(0);
  });
});

describe('parseEnv', () => {
  it('parses key=value pairs', () => {
    const entries = parseEnv('FOO=bar\nBAZ=qux');
    expect(entries.FOO).toBe('bar');
    expect(entries.BAZ).toBe('qux');
  });

  it('skips comments and empty lines', () => {
    const entries = parseEnv('# comment\nFOO=bar\n\nBAR=baz');
    expect(entries.FOO).toBe('bar');
    expect(entries.BAR).toBe('baz');
  });
});
