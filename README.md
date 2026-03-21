# env-secret-scanner

CLI to detect exposed secrets in `.env*` files, check git exposure, and generate a safe `.env.example`.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run scanner:
   ```bash
   npm start -- --dir .
   ```

## Usage example
```bash
npx tsx src/index.ts --dir /path/to/project
```

Sample output:
```text
⚠ SECRET FOUND: OPENAI_API_KEY in .env (Sensitive variable name, tracked/staged in git!)
→ Generated .env.example
```

Exit code is `1` when secrets are found in git-tracked/staged env files (CI-friendly).
