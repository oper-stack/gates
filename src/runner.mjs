import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadCorpus } from './corpus.mjs';
import { toMarkdown, STATUS_ORDER } from './report.mjs';

export const GATES = [
  '01-characters', '02-mdx-compile', '03-frontmatter', '04-structure', '05-duplication',
  '06-shared-sentences', '07-empty-sections', '08-internal-links', '09-link-semantics', '10-meta',
  '11-readability', '12-images', '13-redirects', '14-agent-index', '15-claims',
];

export async function runGates(cfg, flags = {}) {
  const corpus = loadCorpus(cfg);
  const only = flags.only ? new Set(flags.only.split(',').map((n) => Number(n))) : null;
  const results = [];
  for (const file of GATES) {
    const mod = await import(`./gates/${file}.mjs`);
    if (only && !only.has(mod.id)) continue;
    try {
      results.push(await mod.run({ cfg, corpus, flags }));
    } catch (e) {
      results.push({ id: mod.id, name: mod.name, status: 'fail', summary: `gate crashed: ${e.message}`, findings: [{ message: String(e.stack || e).slice(0, 300) }], stats: {} });
    }
  }
  results.sort((a, b) => a.id - b.id);
  const meta = { generatedAt: new Date().toISOString(), siteUrl: cfg.siteUrl, files: corpus.length };
  const dir = resolve(cfg.root, cfg.reportDir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'gates-report.json'), JSON.stringify({ meta, results }, null, 2));
  writeFileSync(resolve(dir, 'gates-report.md'), toMarkdown(results, meta));
  const worst = results.reduce((w, r) => Math.min(w, STATUS_ORDER[r.status]), 9);
  const failOn = flags.failOn || cfg.failOn || 'fail';
  const exitCode = worst === 0 || (failOn === 'warn' && worst === 1) ? 1 : 0;
  return { results, meta, exitCode, reportDir: dir };
}
