/**
 * Gate 01, characters. Rejects three classes of character that keep creeping back
 * into a corpus: currency signs that should be spelled as a code (configurable),
 * decorative pictographs and emoji in body copy, and typographic em and en dashes.
 * With --fix it rewrites currency signs and pictographs; dashes stay for a human.
 *
 * Pictographs are judged in body copy only. Inside a fenced code block the same
 * characters are content rather than decoration: an ASCII decision tree drawn with
 * box characters is a diagram, and deleting its lines would destroy the drawing.
 * Currency and dashes are still checked everywhere, because those are our own prose
 * wherever they appear.
 */
import { writeFileSync } from 'node:fs';
import { result } from '../report.mjs';

const KEEP = new Set([...'✓✗✔✘✕→←↑↓↔★☆☐☑☒•·−≈≠≤≥±°₽$€£¥§№']);
const PICTO = /[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}\u{2460}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;

function fixCurrency(text, sign, code) {
  const s = sign.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  let t = text;
  t = t.replace(new RegExp(`${s}[  ]?(\\d[\\d\\s.,  ]*\\d|\\d)[  ]?(-|–|—|to)[  ]?${s}[  ]?(\\d[\\d\\s.,  ]*\\d|\\d)(?:[  ]?(m|k|bn|млн|тыс\\.|тыс|млрд))?`, 'gu'),
    (_m, a, dash, b, unit) => `${a.trim()} ${dash} ${b.trim()}${unit ? ' ' + unit : ''} ${code}`);
  t = t.replace(new RegExp(`${s}[  ]?(\\d[\\d\\s.,  ]*\\d|\\d)(?:[  ]?(m|k|bn|млн|тыс\\.|тыс|млрд))?`, 'gu'),
    (_m, num, unit) => `${num.trim()}${unit ? ' ' + unit : ''} ${code}`);
  t = t.replace(new RegExp(`[  ]?${s}`, 'gu'), ` ${code}`);
  return t.replace(new RegExp(`${code}[  ]+${code}`, 'g'), code).replace(/\|[  ]{2,}/g, '| ');
}

/** Строка, открывающая или закрывающая блок кода: ``` или ~~~ с любым языком после. */
const FENCE = /^\s{0,3}(```|~~~)/;

function fixPicto(text) {
  let inFence = false;
  return text.split('\n').map((line) => {
    if (FENCE.test(line)) { inFence = !inFence; return line; }
    if (inFence) return line;
    let t = line.replace(/✅/g, '✓').replace(/❌/g, '✗');
    t = t.replace(PICTO, (ch) => (KEEP.has(ch) ? ch : ''));
    return t.replace(/[ \t]{2,}/g, ' ').replace(/\|[ \t]{2,}/g, '| ').replace(/[ \t]+$/, '');
  }).join('\n');
}

export const id = 1;
export const name = 'characters';

export async function run({ cfg, corpus, flags }) {
  const findings = [];
  let fixed = 0;
  const signs = cfg.currency || [];
  let currencyLines = 0, pictoLines = 0, dashLines = 0;
  for (const f of corpus) {
    const lines = f.raw.split('\n');
    let touched = false;
    let inFence = false;
    lines.forEach((line, i) => {
      if (FENCE.test(line)) inFence = !inFence;
      for (const c of signs) if (line.includes(c.sign)) { currencyLines++; touched = true; findings.push({ file: f.rel, line: i + 1, message: `currency sign ${c.sign}: spell it ${c.code}` }); }
      if (/[\u2014\u2013]/.test(line)) { dashLines++; findings.push({ file: f.rel, line: i + 1, message: 'em or en dash: use a comma, a colon, parentheses or a hyphen in ranges' }); }
      const bad = inFence ? [] : [...line.matchAll(PICTO)].map((m) => m[0]).filter((ch) => !KEEP.has(ch) && ch !== '\uFE0F' && ch !== '\u200D');
      if (bad.length) { pictoLines++; touched = true; findings.push({ file: f.rel, line: i + 1, message: `decorative pictograph ${[...new Set(bad)].join(' ')}` }); }
    });
    if (flags.fix && touched) {
      let out = f.raw;
      for (const c of signs) out = fixCurrency(out, c.sign, c.code);
      out = fixPicto(out);
      if (out !== f.raw) { writeFileSync(f.path, out); fixed++; }
    }
  }
  const total = currencyLines + pictoLines + dashLines;
  const summary = total ? `${currencyLines} currency, ${pictoLines} pictograph, ${dashLines} dash line(s)${fixed ? `, fixed ${fixed} file(s)` : ''}` : 'corpus clean';
  return result(id, name, { status: total ? 'fail' : 'pass', summary, findings, stats: { currencyLines, pictoLines, dashLines, fixed } });
}
