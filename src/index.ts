import { Command } from 'commander';
import { scan } from './scanner.js';
import { checkGitStatus } from './git-check.js';
import { detectSecrets } from './detector.js';
import { generateExample } from './example-generator.js';
import chalk from 'chalk';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

const program = new Command();

program
  .name('env-secret-scanner')
  .description('Detect secrets AI agents leak from .env files — prevents credential exfiltration')
  .version(pkg.version)
  .option('-d, --dir <path>', 'Directory to scan', process.cwd())
  .option('-v, --verbose', 'Show detailed output')
  .option('--no-fail', 'Exit with 0 even if tracked secrets are found (CI mode)')
  .option('--json', 'Output machine-readable JSON')
  .parse(process.argv);

const opts = program.opts();

async function main() {
  const cwd = opts.dir ?? process.cwd();
  const envFiles = await scan(cwd);

  if (envFiles.length === 0) {
    if (opts.json) {
      console.log(JSON.stringify({ files: [], secrets: 0 }));
    } else {
      console.log(chalk.green('✓ No .env files found.'));
    }
    process.exit(0);
  }

  let hasTrackedSecret = false;
  const findings: Array<{
    file: string;
    key: string;
    pattern: string;
    tracked: boolean;
    staged: boolean;
  }> = [];

  for (const file of envFiles) {
    const secrets = await detectSecrets(file, cwd);
    const gitInfo = await checkGitStatus(file, cwd);

    for (const secret of secrets) {
      findings.push({
        file: file.path,
        key: secret.key,
        pattern: secret.pattern,
        tracked: gitInfo.tracked,
        staged: gitInfo.staged,
      });
      if (gitInfo.tracked) hasTrackedSecret = true;
    }
  }

  if (opts.json) {
    console.log(JSON.stringify({ files: envFiles.map(f => f.path), secrets: findings.length, findings }));
    process.exit(hasTrackedSecret ? 1 : 0);
    return;
  }

  if (findings.length > 0) {
    for (const f of findings) {
      const icon = f.tracked ? chalk.red('🔴') : chalk.yellow('🟡');
      const tag = f.tracked ? 'TRACKED' : 'UNTRACKED';
      console.log(`${icon} ${f.file} — ${f.pattern} (${f.key}) [${tag}]`);
    }
    console.log(chalk.cyan(`\nTotal: ${findings.length} secret(s) in ${envFiles.length} file(s)`));
  } else {
    console.log(chalk.green('✓ No secrets detected.'));
  }

  await generateExample(envFiles, cwd);

  process.exit(hasTrackedSecret ? 1 : 0);
}

main().catch((err) => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(2);
});
