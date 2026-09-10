/**
 * Gate 06, shared sentences. Sentence and fragment level duplication: a single sentence
 * of ten words or more copied across pages, and list items or table cells of eight words
 * or more repeated across pages. This is the pattern block-level detectors miss.
 */
import { result } from '../report.mjs';

export const id = 6;
export const name = 'shared-sentences';

const norm = (s) => s.toLowerCase().replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean).join(' ');
const keepLabel = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
const dropLinks = (s) => s.replace(/\[[^\]]*\]\([^)]*\)/g, ' ');

function units(body, PROSE_MIN, FRAG_MIN) {
  const prose = []; const fragments = []; const proseLines = [];
  const clean = body.replace(/^import\s.+$/gm, ' ').replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ').replace(/<[^>]+>/g, ' ');
  for (const line of clean.split('\n')) {
    const table = line.match(/^\s*\|(.*)\|\s*$/);
    if (table) {
      if (/^[\s|:-]+$/.test(line)) continue;
      for (const cell of table[1].split('|')) { const n = norm(keepLabel(cell)); if (n.split(' ').length >= FRAG_MIN) fragments.push(n); }
      continue;
    }
    const item = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.*)$/);
    if (item) { const n = norm(dropLinks(item[1])); if (n.split(' ').length >= FRAG_MIN) fragments.push(n); continue; }
    if (/^\s*#{1,6}\s/.test(line)) { proseLines.push(''); continue; }
    proseLines.push(line);
  }
  for (const s of proseLines.join('\n').split(/(?<=[.!?])\s+/)) { const n = norm(keepLabel(s)); if (n.split(' ').length >= PROSE_MIN) prose.push(n); }
  return { prose, fragments };
}

export async function run({ cfg, corpus }) {
  const MIN_PAGES = cfg.duplication.sentenceMinPages;
  const allowed = (t) => cfg.boilerplate.some((re) => re.test(t));
  const proseBy = new Map(); const fragBy = new Map();
  for (const f of corpus) {
    if (f.noindex || cfg.collections[f.coll]?.dedupe === false) continue;
    const u = units(f.body, cfg.duplication.sentenceMinWords, cfg.duplication.fragmentMinWords);
    const prose = u.prose.filter((s) => !allowed(s)); const fragments = u.fragments.filter((s) => !allowed(s));
    for (const s of new Set(prose)) (proseBy.get(s) || proseBy.set(s, new Set()).get(s)).add(f.rel);
    for (const s of new Set(fragments)) (fragBy.get(s) || fragBy.set(s, new Set()).get(s)).add(f.rel);
  }
  const rows = (m) => [...m].filter(([, v]) => v.size >= MIN_PAGES).sort((a, b) => b[1].size - a[1].size);
  const p = rows(proseBy); const fr = rows(fragBy);
  const findings = [...p.map(([s, v]) => ({ message: `${v.size}x sentence: "${s.slice(0, 90)}"` })), ...fr.map(([s, v]) => ({ message: `${v.size}x list or cell: "${s.slice(0, 90)}"` }))];
  return result(id, name, { status: p.length ? 'fail' : fr.length ? 'warn' : 'pass', summary: `${p.length} sentence(s) and ${fr.length} fragment(s) on ${MIN_PAGES}+ pages`, findings, stats: { sentences: p.length, fragments: fr.length } });
}
