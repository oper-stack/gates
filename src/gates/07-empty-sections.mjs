/**
 * Gate 07, hollow sections. An H2 with no body, an H2 whose only body is shared filler
 * (configurable patterns), a section that opens by restating its heading, headings that
 * say "placeholder", orphan markers, numbered lists starting above 1, table cells holding
 * only a comma, heading markup buried inside a line, bold left open across paragraphs,
 * and templated FAQ answers (configurable patterns).
 */
import { result } from '../report.mjs';
import { h2Sections, wordCount, toPlainText } from '../corpus.mjs';

export const id = 7;
export const name = 'hollow-sections';

export async function run({ cfg, corpus }) {
  const fillers = (cfg.fillerPatterns || []).map((p) => new RegExp(p, 'i'));
  const faqTemplates = (cfg.faqTemplates || []).map((p) => new RegExp(p, 'i'));
  const findings = [];
  let hollow = 0;
  for (const f of corpus) {
    if (f.noindex) continue;
    const push = (m, line) => findings.push({ file: f.rel, line, message: m });
    h2Sections(f.body).forEach((s) => {
      const raw = wordCount(toPlainText(s.content));
      const kept = wordCount(toPlainText(s.content.split('\n').filter((l) => !fillers.some((re) => re.test(l))).join('\n')));
      if (raw === 0) { hollow++; push(`empty section "${s.heading.slice(0, 60)}"`); }
      else if (kept === 0) { hollow++; push(`section "${s.heading.slice(0, 60)}" holds only shared filler`); }
      const key = s.heading.replace(/\?$/, '').trim();
      const first = s.content.split('\n').find((l) => l.trim())?.trim() ?? '';
      if (key.length > 12 && first.toLowerCase().startsWith(key.slice(0, 45).toLowerCase())) push(`section "${s.heading.slice(0, 50)}" opens by restating its heading`);
      if (/placeholder/i.test(s.heading)) push(`heading says placeholder: "${s.heading.slice(0, 60)}"`);
    });
    const blocks = f.raw.split(/\n{2,}/).map((b) => b.trim());
    blocks.forEach((b, i) => {
      if (!/^\{\/\*[^*]*\*\/\}$/.test(b)) return;
      const next = blocks[i + 1] ?? '';
      if (next === '' || next.startsWith('#') || /^\{\/\*.*\*\/\}$/.test(next)) push('orphan comment marker with no content after it');
    });
    const steps = [...f.body.matchAll(/\*\*Step (\d+)[,:]/g)].map((m) => Number(m[1]));
    const numbered = [...f.body.matchAll(/^\*\*(\d+)\.\s/gm)].map((m) => Number(m[1]));
    if ((steps.length && Math.min(...steps) > 1) || (numbered.length > 1 && Math.min(...numbered) > 1)) push('numbered list or steps start above 1');
    const commaCells = (f.body.match(/\|\s*,\s*\|/g) || []).length;
    if (commaCells) push(`${commaCells} table cell(s) holding only a comma`);
    const inline = (f.body.match(/[^\s#][ \t]*#{2,4} [A-Z]/g) || []).length;
    if (inline) push(`${inline} heading marker(s) buried inside a line`);
    for (const b of f.body.split(/\n{2,}/)) if (((b.match(/\*\*/g) || []).length) % 2 === 1) { push('bold ** left open across a paragraph break'); break; }
    let templated = 0;
    for (const t of faqTemplates) templated += (f.body.match(new RegExp(t.source, 'gim')) || []).length;
    if (templated) push(`${templated} templated FAQ answer(s) that render on the page`);
  }
  return result(id, name, { status: findings.length ? (hollow ? 'fail' : 'warn') : 'pass', summary: findings.length ? `${hollow} hollow section(s), ${findings.length} finding(s)` : 'no hollow sections', findings, stats: { hollow } });
}
