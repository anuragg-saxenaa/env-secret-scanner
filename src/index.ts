#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { Command } from 'commander';
import { findEnvFiles } from './scanner.js';
import { parseEnv, writeExample } from './example-generator.js';
import { detectSecrets } from './detector.js';
import { checkGitExposure } from './git-check.js';

const program = new Command();
program.name('env-secret-scanner').option('-d, --dir <path>', 'directory to scan', process.cwd()).parse();

const opts = program.opts<{ dir: string }>();
const root = path.resolve(opts.dir);
const envFiles = await findEnvFiles(root);
if (envFiles.length === 0) {
  console.log(chalk.yellow('No .env* files found.'));
  process.exit(0);
}

let trackedSecretFound = false;
for (const file of envFiles) {
  const entries = parseEnv(fs.readFileSync(file, 'utf8'));
  const hits = detectSecrets(entries);
  const git = await checkGitExposure(file);
  if (hits.length === 0) {
    console.log(chalk.green(`✓ ${path.relative(root, file)}: no obvious secrets`));
    continue;
  }
  for (const h of hits) {
    const exposure = git.tracked || git.staged ? chalk.red('tracked/staged in git!') : chalk.cyan('not tracked');
    console.log(chalk.red(`⚠ SECRET FOUND: ${h.key} in ${path.relative(root, file)} (${h.reason}, ${exposure})`));
  }
  if (git.tracked || git.staged) trackedSecretFound = true;
  const examplePath = writeExample(file, entries);
  console.log(chalk.blue(`→ Generated ${path.relative(root, examplePath)}`));
}

process.exit(trackedSecretFound ? 1 : 0);
