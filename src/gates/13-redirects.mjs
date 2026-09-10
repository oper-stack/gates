/**
 * Gate 13, redirects. Static redirects must not form chains or cycles, and no content page
 * that still exists may be redirected away. Reads the redirects file (Vercel format by default).
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { result } from '../report.mjs';

export const id = 13;
export const name = 'redirects';

const normalize = (v) => (typeof v === 'string' && v.startsWith('/') && !/[:*()]/.test(v)) ? (v.replace(/\{\/\}\?$/, '').replace(/\/+$/, '') || '/') : null;

export async function run({ cfg, corpus }) {
  const p = resolve(cfg.root, cfg.redirectsFile);
  if (!existsSync(p)) return result(id, name, { status: 'skip', summary: `no ${cfg.redirectsFile}` });
  let json; try { json = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { return result(id, name, { status: 'fail', summary: `${cfg.redirectsFile} is not valid JSON`, findings: [{ message: e.message }] }); }
  const graph = new Map();
  for (const r of json.redirects ?? []) { const s = normalize(r.source); const d = normalize(r.destination); if (s && d) graph.set(s, d); }
  const findings = [];
  const checked = new Set();
  for (const start of graph.keys()) {
    if (checked.has(start)) continue;
    const chain = []; const pos = new Map(); let cur = start;
    while (graph.has(cur)) {
      if (pos.has(cur)) { findings.push({ message: `cycle: ${[...chain.slice(pos.get(cur)), cur].join(' -> ')}` }); break; }
      if (checked.has(cur)) break;
      pos.set(cur, chain.length); chain.push(cur); cur = graph.get(cur);
    }
    if (chain.length >= 3) findings.push({ message: `chain of ${chain.length}: ${chain.join(' -> ')} (point the first source at the final target)` });
    for (const c of chain) checked.add(c);
  }
  const live = new Set(corpus.filter((f) => !f.noindex).map((f) => f.url.replace(/\/$/, '')));
  for (const s of graph.keys()) if (live.has(s)) findings.push({ message: `live page ${s}/ is redirected away` });
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} redirect problem(s) in ${graph.size} rules` : `${graph.size} redirects, no cycles or chains`, findings, stats: { rules: graph.size } });
}
