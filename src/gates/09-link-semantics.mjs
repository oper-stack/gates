/**
 * Gate 09, link semantics. Does the target match what the anchor promises?
 * place-mismatch (anchor names place A, href goes to place B), entity-mismatch (anchor is an
 * entity name, href goes elsewhere), index numbers leaked into anchors, self links, and one
 * URL linked three or more times on a page.
 */
import { result } from '../report.mjs';

export const id = 9;
export const name = 'link-semantics';

export async function run({ cfg, corpus }) {
  const places = [...(cfg.placeNames || [])].map((p) => p.toLowerCase()).sort((a, b) => b.length - a.length);
  const slugForm = (p) => p.replace(/ /g, '-');
  const entityNames = new Map();
  for (const f of corpus) if (cfg.collections[f.coll]?.kind === 'entity' || f.coll === 'projects') entityNames.set(f.slug.replace(/-/g, ' '), f.url);
  const findings = [];
  for (const f of corpus) {
    const counts = new Map();
    for (const m of f.body.matchAll(/\[([^\]]{2,160})\]\((\/[A-Za-z0-9\-/]*)\)/g)) {
      const text = m[1].trim(); const href = m[2].endsWith('/') ? m[2] : `${m[2]}/`;
      const lt = text.toLowerCase(); const lh = href.toLowerCase();
      counts.set(href, (counts.get(href) || 0) + 1);
      if (href === f.url) findings.push({ file: f.rel, message: `page links to itself: [${text}]` });
      if (/(^|\s)#\d+\b/.test(text)) findings.push({ file: f.rel, message: `index number in anchor text: [${text}]` });
      const ta = places.filter((p) => lt.includes(p)); const ha = places.filter((p) => lh.includes(slugForm(p)));
      if (ta.length && ha.length && !ta.some((p) => ha.includes(p))) findings.push({ file: f.rel, message: `anchor names ${ta[0]} but link goes to ${ha[0]}: [${text}](${href})` });
      const named = entityNames.get(lt.replace(/[^\p{L}\p{N}]+/gu, ' ').trim());
      if (named && href !== named) findings.push({ file: f.rel, message: `anchor is an entity name but links elsewhere: [${text}](${href}), expected ${named}` });
    }
    for (const [href, n] of counts) if (n >= cfg.links.maxRepeatsPerPage) findings.push({ file: f.rel, message: `${href} linked ${n} times on one page` });
  }
  return result(id, name, { status: findings.length ? 'warn' : 'pass', summary: findings.length ? `${findings.length} anchor(s) disagree with their target` : 'anchors match targets', findings });
}
