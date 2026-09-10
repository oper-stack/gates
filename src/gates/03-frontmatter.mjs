/**
 * Gate 03, frontmatter. Required fields per collection, title and description lengths,
 * titles cut mid-phrase, duplicate imports, duplicate titles and descriptions across the corpus,
 * hero images pointing at hosts you do not control, and related slugs that do not exist.
 */
import { result } from '../report.mjs';
import { wordCount } from '../corpus.mjs';

export const id = 3;
export const name = 'frontmatter';

const STOP = new Set(['a','an','the','and','or','for','to','in','on','of','with','at','by','from','as','is','are','what','how','your','you','that','this','it','not','but','if','when','before','after','into','per','vs','why','which','was','were','be']);
const lastWord = (t) => t.replace(/[.!?"'’)\]]+$/, '').split(/\s+/).pop()?.toLowerCase() ?? '';
export const looksCut = (t) => !/[?!]["'’)\]]*$/.test(t.trim()) && STOP.has(lastWord(t));

export async function run({ cfg, corpus }) {
  const findings = [];
  const titles = new Map(); const descs = new Map();
  const slugs = new Set(corpus.map((f) => f.slug));
  const noindexSlugs = new Set(corpus.filter((f) => f.noindex).map((f) => f.slug));
  for (const f of corpus) {
    if (f.noindex) continue;
    const c = cfg.collections[f.coll];
    for (const key of c.requiredFrontmatter) {
      if (f.data[key] === undefined || f.data[key] === '' || (Array.isArray(f.data[key]) && !f.data[key].length)) findings.push({ file: f.rel, message: `missing frontmatter "${key}"` });
    }
    if (f.title) {
      if (looksCut(f.title)) findings.push({ file: f.rel, message: `title ends mid-phrase: "${f.title}"` });
      if (f.title.length < cfg.title.min || f.title.length > cfg.title.max) findings.push({ file: f.rel, message: `title length ${f.title.length}, expected ${cfg.title.min} to ${cfg.title.max}` });
      const k = f.title.toLowerCase().replace(/\W+/g, ' ').trim();
      titles.set(k, [...(titles.get(k) || []), f.rel]);
    }
    if (f.description) {
      if (f.description.length < cfg.description.min || f.description.length > cfg.description.max) findings.push({ file: f.rel, message: `description length ${f.description.length}, expected ${cfg.description.min} to ${cfg.description.max}` });
      if (/(\.\.\.|…)$/.test(f.description)) findings.push({ file: f.rel, message: 'description ends in an ellipsis' });
      else if (looksCut(f.description)) findings.push({ file: f.rel, message: 'description ends on a stop word (cut)' });
      const k = f.description.toLowerCase().replace(/\W+/g, ' ').trim();
      descs.set(k, [...(descs.get(k) || []), f.rel]);
    }
    const hero = f.data.heroImage;
    if (hero && /^https?:\/\//.test(hero) && cfg.imageHosts.length) {
      const host = new URL(hero).hostname;
      if (!cfg.imageHosts.some((h) => host === h || host.endsWith('.' + h))) findings.push({ file: f.rel, message: `heroImage host ${host} is not in imageHosts` });
    }
    if (hero && /unsplash\.com/i.test(hero)) findings.push({ file: f.rel, message: 'heroImage uses Unsplash (licence and hotlink risk)' });
    const imports = f.body.match(/^import\s+.+$/gm) || [];
    for (const dup of new Set(imports.filter((l, i) => imports.indexOf(l) !== i))) findings.push({ file: f.rel, message: `duplicate import: ${dup}` });
    for (const s of Array.isArray(f.data.relatedSlugs) ? f.data.relatedSlugs : []) {
      if (!slugs.has(s)) findings.push({ file: f.rel, message: `relatedSlug "${s}" does not exist` });
      else if (noindexSlugs.has(s)) findings.push({ file: f.rel, message: `relatedSlug "${s}" points to noindex content` });
    }
    const words = wordCount(f.body.replace(/^import\s.+$/gm, ' ').replace(/<[^>]+>/g, ' ').replace(/\{[\s\S]*?\}/g, ' '));
    if (words < c.minWords) findings.push({ file: f.rel, message: `word count ${words} below ${f.coll} minimum ${c.minWords}` });
  }
  for (const [k, list] of titles) if (list.length > 1) findings.push({ message: `duplicate title "${k.slice(0, 60)}" in ${list.join(', ')}` });
  for (const [k, list] of descs) if (list.length > 1) findings.push({ message: `duplicate description "${k.slice(0, 60)}" in ${list.join(', ')}` });
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} issue(s)` : 'all fields present, lengths in range', findings });
}
