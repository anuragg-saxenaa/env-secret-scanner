# env-secret-scanner

## Problem
AI coding agents (Claude Code, Codex, Gemini) routinely commit or leak secrets from .env files—developers using `--dangerously-skip-permissions` or similar bypass flags are especially vulnerable to credential exfiltration.

## Source
https://www.helpnetsecurity.com/2026/03/13/claude-code-openai-codex-google-gemini-ai-coding-agent-security/

## Solution
CLI tool that scans a directory for .env files, detects exposed secrets (API keys, tokens, passwords), warns if they're tracked by git, and generates a safe `.env.example` with redacted values.

## Stack
Node.js (CLI with commander, fast startup)

## Files
1. `src/index.ts` — CLI entry point, argument parsing
2. `src/scanner.ts` — recursive .env file discovery
3. `src/detector.ts` — regex patterns for secret detection (API keys, passwords, tokens)
4. `src/git-check.ts` — check if .env files are tracked or staged
5. `src/example-generator.ts` — generate .env.example with `<REDACTED>` placeholders
6. `package.json` — deps: commander, chalk, fast-glob
7. `README.md` — usage docs

## Core Logic
```pseudo
1. Scan cwd (or --dir) for files matching .env*
2. For each file:
   a. Parse key=value pairs
   b. Run detector patterns on values (AWS_*, OPENAI_*, password, token, secret, key)
   c. Check git status (tracked? staged?)
3. Output warnings:
   - "⚠️ SECRET FOUND: AWS_SECRET_ACCESS_KEY in .env (tracked by git!)"
   - "✓ .env.local is gitignored"
4. Generate .env.example with: KEY=<REDACTED>
5. Exit 1 if any secret is tracked by git (for CI integration)
```

## Success Criteria
- `npx env-secret-scanner` runs in <2 seconds on typical project
- Detects 10+ common secret patterns (AWS, OpenAI, Stripe, GitHub, etc.)
- CI-friendly exit codes
