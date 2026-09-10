/**
 * Gate 05, duplication. Repeated prose blocks two ways: a block on 2+ indexable pages
 * (exact, and with numbers masked to catch templates with swapped figures) and a block
 * repeated inside one page.
 */
import { result } from '../report.mjs';
import { toPlainText, wordCount } from '../corpus.mjs';

export const id = 5;
export const name = 'duplication';
export async function run({ cfg, corpus }) {
  const MIN_BLOCK_WORDS = cfg.duplication.minBlockWords; const MIN_PAGES = cfg.duplication.minPages;
  const allowed = (t) => cfg.boilerplate.some((re) => re.test(t));
  const exact = new Map(); const masked = new Map(); const inPage = [];
  for (const f of corpus) {
    const seen = new Map();
    const dedupe = cfg.collections[f.coll]?.dedupe !== false;
    for (const rawBlock of f.body.split(/\n{2,}/)) {
      const t = rawBlock.trim();
      if (!t || t.startsWith('import ')) continue;
      const text = toPlainText(t).toLowerCase().replace(/\s+/g, ' ').trim();
      if (wordCount(text) < MIN_BLOCK_WORDS || allowed(text)) continue;
      seen.set(text, (seen.get(text) || 0) + 1);
      if (f.noindex || !dedupe) continue;
      (exact.get(text) || exact.set(text, new Set()).get(text)).add(f.rel);
      if (t.startsWith('|')) continue; // tables with the same headers are structure, not copied prose
      const mk = text.replace(/[\d][\d,.\s]*/g, '#');
      (masked.get(mk) || masked.set(mk, new Set()).get(mk)).add(f.rel);
    }
    for (const [block, count] of seen) if (count > 1) inPage.push({ file: f.rel, count, block });
  }
  const cross = [...exact].filter(([, s]) => s.size >= MIN_PAGES).sort((a, b) => b[1].size - a[1].size);
  const near = [...masked].filter(([b, s]) => s.size >= MIN_PAGES && !exact.has(b)).sort((a, b) => b[1].size - a[1].size);
  const findings = [
    ...cross.map(([b, s]) => ({ message: `${s.size} pages share: "${b.slice(0, 90)}" (${[...s].slice(0, 3).join(', ')})` })),
    ...near.map(([b, s]) => ({ message: `${s.size} pages share a template with swapped numbers: "${b.slice(0, 80)}"` })),
    ...inPage.map((h) => ({ file: h.file, message: `block repeated ${h.count}x inside the page: "${h.block.slice(0, 70)}"` })),
  ];
  const pagesAffected = new Set(cross.flatMap(([, s]) => [...s])).size;
  const status = cross.length || inPage.length ? 'fail' : near.length ? 'warn' : 'pass';
  return result(id, name, { status, summary: `${cross.length} shared block(s) on ${pagesAffected} page(s), ${near.length} near-duplicate, ${inPage.length} in-page repeat(s)`, findings, stats: { cross: cross.length, near: near.length, inPage: inPage.length, pagesAffected } });
}
