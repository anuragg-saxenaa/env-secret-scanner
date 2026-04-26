import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface SecretMatch {
  key: string;
  value: string;
  pattern: string;
  line: number;
}

// Comprehensive secret patterns for AI coding agent environments
const SECRET_PATTERNS: Array<{
  pattern: string;
  regex: RegExp;
  description: string;
}> = [
  { pattern: 'AWS Access Key', regex: /AWS_ACCESS_KEY_ID|aws_access_key/i, description: 'AWS_ACCESS_KEY_ID' },
  { pattern: 'AWS Secret', regex: /AWS_SECRET_ACCESS_KEY|aws_secret/i, description: 'AWS_SECRET_ACCESS_KEY' },
  { pattern: 'OpenAI', regex: /OPENAI_API_KEY|openai_api_key|sk-[a-zA-Z0-9]{20,}/i, description: 'OPENAI_API_KEY' },
  { pattern: 'Anthropic', regex: /ANTHROPIC_API_KEY|anthropic_api_key/i, description: 'ANTHROPIC_API_KEY' },
  { pattern: 'GitHub Token', regex: /GITHUB_TOKEN|github_token|ghp_[a-zA-Z0-9]{36}/i, description: 'GITHUB_TOKEN' },
  { pattern: 'Stripe Key', regex: /STRIPE_SECRET_KEY|stripe.*key/i, description: 'STRIPE_SECRET_KEY' },
  { pattern: 'Database URL', regex: /DATABASE_URL|DB_PASSWORD|POSTGRES_PASSWORD|MYSQL_PASSWORD/i, description: 'DB_PASSWORD' },
  { pattern: 'Private Key', regex: /PRIVATE_KEY|--BEGIN.*PRIVATE KEY--/i, description: 'PRIVATE_KEY' },
  { pattern: 'JWT Secret', regex: /JWT_SECRET|JWT_SECRET_KEY/i, description: 'JWT_SECRET' },
  { pattern: 'Slack Token', regex: /SLACK_BOT_TOKEN|SLACK_TOKEN|slack_[a-zA-Z0-9]{29}/i, description: 'SLACK_TOKEN' },
  { pattern: 'SendGrid', regex: /SENDGRID_API_KEY|sg\.[a-zA-Z0-9]{22,}/i, description: 'SENDGRID_API_KEY' },
  { pattern: 'Twilio', regex: /TWILIO.*KEY|twilio_[a-zA-Z0-9]{32}/i, description: 'TWILIO_KEY' },
  { pattern: 'Google Cloud', regex: /GOOGLE_.*KEY|gcp.*credential/i, description: 'GOOGLE_API_KEY' },
  { pattern: 'Azure', regex: /AZURE.*KEY|AZURE.*SECRET/i, description: 'AZURE_KEY' },
  { pattern: 'Heroku', regex: /HEROKU.*KEY|heroku_[a-zA-Z0-9]{32}/i, description: 'HEROKU_KEY' },
  { pattern: 'NPM Token', regex: /NPM_TOKEN|npm_[a-zA-Z0-9]{36}/i, description: 'NPM_TOKEN' },
  { pattern: 'Generic Token', regex: /TOKEN|PASSWORD|PASSWD|SECRET|API_KEY|APIKEY|CREDENTIAL/i, description: 'SENSITIVE_VALUE' },
];

// Values that are safe / placeholder
const SAFE_VALUES = new Set([
  '', 'null', 'undefined', 'your_key_here', 'replace_me',
  '<your-key>', '<placeholder>', 'CHANGE_ME', 'CHANGEME',
  'example', 'test', 'dev', 'localhost', '0.0.0.0', '127.0.0.1',
  'postgres://localhost', 'sqlite://', '.env.local', '.env.example',
]);

function isLikelySecret(key: string, value: string): boolean {
  if (SAFE_VALUES.has(value.toLowerCase())) return false;
  if (value.length < 4) return false;
  // Placeholder patterns
  if (/^(xxx+|###+|CHANGE_ME|PLEASE_FILL|PROD_|STAGING_)/i.test(value)) return false;
  return true;
}

export async function detectSecrets(file: { path: string; relativePath: string }, cwd?: string): Promise<SecretMatch[]> {
  const baseDir = cwd ?? process.cwd();
  const matches: SecretMatch[] = [];

  try {
    const fullPath = resolve(baseDir, file.relativePath);
    const content = readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith('#')) continue;

      // Parse key=value (handles quoted values)
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;

      const key = line.slice(0, eqIdx).trim();
      let value = line.slice(eqIdx + 1).trim();

      // Strip quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      for (const { pattern, regex, description } of SECRET_PATTERNS) {
        if (regex.test(key) && isLikelySecret(key, value)) {
          matches.push({
            key,
            value: value.length > 40 ? value.slice(0, 40) + '...' : value,
            pattern: description,
            line: i + 1,
          });
          break; // one match per line
        }
      }
    }
  } catch {
    // File unreadable — skip
  }

  return matches;
}
