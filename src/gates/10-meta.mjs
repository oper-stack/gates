/**
 * Gate 10, meta. The title and description a searcher sees: repeated year, repeated brand
 * or format word (configurable), stale older titles frozen into the body, and SERP length
 * with a brand suffix. Lengths and truncation live in gate 03.
 */
import { result } from '../report.mjs';
import { looksCut } from './03-frontmatter.mjs';

export const id = 10;
export const name = 'meta';

export async function run({ cfg, corpus }) {
  const findings = [];
  const words = cfg.brandWords || [];
  for (const f of corpus) {
    if (f.noindex || !f.title) continue;
    if ((f.title.match(/20\d\d/g) || []).length >= 2) findings.push({ file: f.rel, message: `title repeats the year: "${f.title}"` });
    for (const w of words) {
      if ((f.title.match(new RegExp(`\\b${w}\\b`, 'gi')) || []).length >= 2) { findings.push({ file: f.rel, message: `title repeats "${w}": "${f.title}"` }); break; }
    }
    for (const m of f.body.matchAll(/(?:Pillar guides for|Read next on|See also:)\s+\*\*([^*]+)\*\*/g)) {
      const echoed = m[1].trim();
      if (echoed !== f.title && (looksCut(echoed) || !f.title.startsWith(echoed.slice(0, 20)))) findings.push({ file: f.rel, message: `stale title echoed in body: "${echoed.slice(0, 60)}"` });
    }
  }
  return result(id, name, { status: findings.length ? 'warn' : 'pass', summary: findings.length ? `${findings.length} meta issue(s)` : 'titles and descriptions clean', findings });
}
