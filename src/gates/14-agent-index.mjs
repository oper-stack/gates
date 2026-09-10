/**
 * Gate 14, AI index. The agent index (llms.txt) is what answer engines read instead of
 * crawling. It drifts silently: a page merged away stays advertised, a page added later never
 * appears, a noindex page is listed. Fails on any disagreement between the index and the site.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { result } from '../report.mjs';

export const id = 14;
export const name = 'ai-index';

export async function run({ cfg, corpus }) {
  const p = resolve(cfg.root, cfg.agentIndex);
  if (!existsSync(p)) return result(id, name, { status: 'warn', summary: `${cfg.agentIndex} not found, answer engines get nothing to read`, findings: [{ message: `create ${cfg.agentIndex} (llms.txt) listing every indexable page` }] });
  const index = readFileSync(p, 'utf8');
  const site = (cfg.siteUrl || '').replace(/\/$/, '');
  const advertised = new Set();
  for (const m of index.matchAll(/\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g)) {
    let u = m[1].replace(/\.md$/, '');
    if (site && u.startsWith(site)) u = u.slice(site.length);
    if (!u.startsWith('/')) continue;
    advertised.add(u.endsWith('/') ? u : `${u}/`);
  }
  const live = new Map(corpus.map((f) => [f.url, f]));
  const findings = [];
  for (const u of advertised) {
    const f = live.get(u);
    if (f && f.noindex) findings.push({ message: `index lists noindex page ${u}` });
    else if (!f && Object.values(cfg.collections).some((c) => u.startsWith(c.url))) findings.push({ message: `index lists a page that does not exist: ${u}` });
  }
  for (const f of corpus) if (!f.noindex && !advertised.has(f.url)) findings.push({ file: f.rel, message: `indexable page missing from the index: ${f.url}` });
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} disagreement(s) between ${cfg.agentIndex} and the site` : `${advertised.size} entries match the site`, findings, stats: { advertised: advertised.size } });
}
