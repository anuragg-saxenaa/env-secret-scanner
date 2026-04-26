# env-secret-scanner

**Detect secrets AI agents leak from `.env` files — before they become incidents.**

AI coding agents (Claude Code, Codex, Gemini) routinely commit or leak secrets from `.env` files — especially when developers use `--dangerously-skip-permissions` or similar bypass flags.

`env-secret-scanner` finds those leaks before they leave your machine.

## Install

```bash
npm install -g env-secret-scanner
# or
npx env-secret-scanner
```

## Usage

```bash
# Scan current directory
env-secret-scanner

# Scan a specific directory
env-secret-scanner --dir /path/to/project

# Verbose output
env-secret-scanner -v

# CI mode: exit 0 even if tracked secrets found (for dry runs)
env-secret-scanner --no-fail

# JSON output for scripts
env-secret-scanner --json
```

## How it works

1. **Scans** for `.env*` files (`.env`, `.env.local`, `.env.production`, etc.)
2. **Detects** secret patterns: AWS keys, OpenAI tokens, GitHub tokens, Stripe keys, DB passwords, private keys, JWT secrets, and more
3. **Checks git status** — warns if a secret is in a git-tracked file (🔥) or staged file (🟡)
4. **Generates** a safe `.env.example` with all values replaced by `<REDACTED>`
5. **Exits 1** if any secret is git-tracked (blocks CI if you want it to)

## Exit codes

| Code | Meaning |
|------|---------|
| 0 | No secrets found, or `--no-fail` mode |
| 1 | Secret(s) found in git-tracked file |
| 2 | Error |

## Patterns detected

- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`
- `GITHUB_TOKEN`, `ghp_*` tokens
- `STRIPE_SECRET_KEY`
- `DATABASE_URL`, `DB_PASSWORD`, `POSTGRES_PASSWORD`
- `PRIVATE_KEY`, `--BEGIN PRIVATE KEY--`
- `JWT_SECRET`
- `SLACK_BOT_TOKEN`
- `SENDGRID_API_KEY`
- `TWILIO_*KEY`
- `GOOGLE_*KEY`, `AZURE_*KEY`
- `HEROKU_*KEY`, `NPM_TOKEN`
- Generic: `PASSWORD`, `SECRET`, `API_KEY`, `CREDENTIAL`

## Example output

```
🔍 env-secret-scanner — scanning /home/user/project

🟡 .env — OPENAI_API_KEY (OPENAI_API_KEY) [UNTRACKED]
🔴 .env.production — AWS_SECRET_ACCESS_KEY (AWS_SECRET_ACCESS_KEY) [TRACKED]

Total: 2 secret(s) in 2 file(s)

❌ FATAL: Secrets found in git-tracked files. Fix before committing!
```

## CI integration

Add to your GitHub Actions workflow:

```yaml
- name: Check for leaked secrets
  run: npx env-secret-scanner --no-fail || true
```

Or use strict mode:

```yaml
- name: Block leaked secrets
  run: npx env-secret-scanner
```

## License

MIT
