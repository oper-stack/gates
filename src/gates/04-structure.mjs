/**
 * Gate 04, structure. What an answer engine and a buyer need on a commercial page:
 * an answer-first block, enough H2 sections, tables, FAQ, pros and cons, risks, scenarios,
 * numeric facts, no over-bolding, no banned AI phrases, no draft markers, no H1 in body,
 * no heading level skips, internal links with trailing slashes.
 */
import { result } from '../report.mjs';

export const id = 4;
export const name = 'structure';

export const BANNED_PHRASES = ['Regional diversification', 'Advanced investment strategies', 'Operational excellence', 'Comprehensive framework', 'Future outlook', "in today's evolving landscape", "in today's rapidly evolving"];
export const AI_FLUFF_RE = /\b(moreover|furthermore|in conclusion|it is important to note|unlock the potential|delve into|a testament to|not just .{1,40} but)\b/i;
export const DRAFT_MARKERS_RE = /\[VERIFY\b|\*\*VERIFY:\*\*|Knowledge base|KB §|\bTODO\b|source needed|lorem ipsum/i;

/**
 * A numeric fact is a number with a unit a reader can act on: a price, a percentage,
 * a year, a distance, a duration, an amount in a currency code. Bare numbers are not counted.
 */
export function countNumericFacts(body, currencyCodes = []) {
  const codes = ['USD', 'EUR', 'GBP', ...currencyCodes.map((c) => c.toUpperCase())].filter((c, i, a) => a.indexOf(c) === i).join('|');
  const re = new RegExp(
    String.raw`[$€£]\s?\d[\d,]*(?:\.\d+)?` +
      String.raw`|\d{1,3}(?:,\d{3})*(?:\.\d+)?\s*(?:%|percent|per cent)` +
      String.raw`|\b(?:19|20)\d{2}\b` +
      String.raw`|\d+(?:\.\d+)?\s*(?:m²|sqm|sq\s?m|sq ft|ha|km|metres?|meters?|min|minutes?|hours?|days?|nights?|weeks?|months?|years?)\b` +
      String.raw`|\d[\d,]*(?:\.\d+)?\s*(?:${codes})\b` +
      String.raw`|\d{1,3}(?:,\d{3})+(?:\.\d+)?`,
    'gi',
  );
  return (body.match(re) || []).length;
}

function headingSkip(body) {
  let prev = 0; let line = 0;
  for (const l of body.split('\n')) {
    line++;
    const m = l.match(/^(#{2,6})\s+(.+)$/);
    if (!m) continue;
    const level = m[1].length;
    if (prev && level > prev + 1) return { from: prev, to: level, line, text: m[2] };
    prev = level;
  }
  return null;
}

export async function run({ cfg, corpus }) {
  const findings = [];
  for (const f of corpus) {
    if (f.noindex) continue;
    const c = cfg.collections[f.coll];
    const body = f.body; const text = f.raw;
    const push = (m) => findings.push({ file: f.rel, message: m });
    if (DRAFT_MARKERS_RE.test(text)) push('draft or source marker left in text ([VERIFY], TODO, source needed)');
    for (const p of BANNED_PHRASES) if (body.includes(p)) push(`banned phrase: "${p}"`);
    if (AI_FLUFF_RE.test(body)) push('AI filler phrase (moreover, furthermore, delve into, unlock the potential)');
    if ((body.match(/\*\*/g) || []).length % 2 !== 0) push('unclosed ** bold, breaks rendering below the typo');
    if (/^[^\n|]+ — \| /m.test(body)) push('text glued to a markdown table row');
    if (/[<>][0-9]/.test(text)) push('angle bracket followed by a digit, MDX reads it as a tag');
    if (/^#\s+/m.test(body)) push('markdown H1 in body, the layout renders the title as H1');
    const skip = headingSkip(body);
    if (skip) push(`heading level skip H${skip.from} to H${skip.to} at line ${skip.line}`);
    if (/Related guide [1-9]/i.test(body)) push('placeholder related-guide links');
    const noSlash = [...body.matchAll(/\]\((\/[^)#\s]+)\)/g)].map((m) => m[1]).filter((l) => !l.endsWith('/') && !l.includes('.'));
    if (noSlash.length) push(`internal links without trailing slash: ${noSlash.slice(0, 3).join(', ')}`);
    if (c.commercial && c.kind !== 'news') {
      if (!/(Quick answer|Short answer|TL;DR|Короткий ответ|<TldrBlock)/i.test(body)) push('missing answer-first block (Quick answer or TL;DR)');
      const S = cfg.structure;
      const h2 = (body.match(/^##\s+/gm) || []).length;
      if (h2 < S.minH2) push(`fewer than ${S.minH2} H2 sections (${h2})`);
      const rows = (body.match(/^\|[^|\n]+\|/gm) || []).length;
      if (rows < S.minTableRows) push(`too few table rows (${rows}, need ${S.minTableRows})`);
      const faqCount = Math.max((f.fm.match(/^\s*-\s*question:/gm) || []).length, (body.match(/question\s*:/g) || []).length, (body.match(/\*\*Q:/g) || []).length);
      if (c.faq > 0 && faqCount < c.faq) push(`fewer than ${c.faq} FAQ questions (${faqCount})`);
      if (!/(pros|cons|advantages|disadvantages|плюс|минус|vorteile|nachteile|avantages|inconvénients)/i.test(body)) push('missing pros and cons');
      if (!/(risk|red flag|checklist|what to check|insider tip|риск|чеклист|risque|risiko)/i.test(body)) push('missing risks or checklist block');
      if (!/(scenario|who this is for|buyer profile|decision framework|сценари|для инвестор|szenario|profil)/i.test(body)) push('missing scenarios or decision framework');
      const nums = countNumericFacts(body, (cfg.currency || []).map((c) => c.code));
      const minNums = Math.max(S.minFacts, Math.floor((c.minWords || 2000) / 500) * 3);
      if (nums < minNums) push(`low fact density: ${nums} numeric facts, need ${minNums}`);
      const bold = (body.match(/\*\*[^*]+\*\*/g) || []).length;
      if (bold > S.maxBold) push(`over-bold: ${bold} bold spans (max ${S.maxBold})`);
      const links = new Set([...body.matchAll(/\]\((\/[^)#\s]+)\)/g)].map((m) => m[1]));
      if (links.size < S.minInternalLinks) push(`fewer than ${S.minInternalLinks} internal links (${links.size})`);
    }
  }
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} structural issue(s)` : 'structure complete on every page', findings });
}
