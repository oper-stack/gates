#!/usr/bin/env node
/**
 * OperStack Gates: 15 automated quality checks for content sites.
 *
 *   npx @operstack/gates                 run all gates, print table, write .gates/gates-report.md
 *   npx @operstack/gates --only 1,4,15   run a subset
 *   npx @operstack/gates --fix           rewrite currency signs and pictographs (gate 01)
 *   npx @operstack/gates --json          machine-readable output
 *   npx @operstack/gates --offline       skip network checks (gate 12)
 *   npx @operstack/gates --fail-on warn  non-zero exit on warnings too
 *   npx @operstack/gates --config path   explicit config file
 *   npx @operstack/gates --demo          run on the bundled fictional site (every gate fires)
 */
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.mjs';
import { runGates } from '../src/runner.mjs';
import { printTerminal } from '../src/report.mjs';

const args = process.argv.slice(2);
const val = (k) => { const i = args.indexOf(k); return i === -1 ? undefined : args[i + 1]; };
const demo = args.includes('--demo');
const flags = {
  only: val('--only'),
  fix: args.includes('--fix') && !demo,
  json: args.includes('--json'),
  offline: args.includes('--offline') || demo,
  failOn: val('--fail-on'),
  top: Number(val('--top') || 8),
};
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: gates [--config gates.config.json] [--only 1,4] [--fix] [--json] [--offline] [--fail-on warn|fail] [--top N] [--demo]');
  process.exit(0);
}
const demoConfig = resolve(dirname(fileURLToPath(import.meta.url)), '../test/fixtures/gates.config.json');
const cfg = loadConfig(demo ? demoConfig : val('--config'));
if (demo) console.log('\n  Demo: the fictional Isla Verde site, one deliberate defect per gate. Every number is invented.');
if (!Object.keys(cfg.collections).length) {
  console.error(`No content collections found under ${cfg.contentPath}. Create gates.config.json or run from the site root.`);
  process.exit(2);
}
const { results, meta, exitCode, reportDir } = await runGates(cfg, flags);
if (flags.json) console.log(JSON.stringify({ meta, results }, null, 2));
else { printTerminal(results, { top: flags.top }); console.log(`  Report: ${reportDir.replace(cfg.root + '/', '')}/gates-report.md\n`); }
process.exit(exitCode);
