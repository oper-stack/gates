/**
 * Gate 15, unsourced claims. Yields, ROI, occupancy, nightly rates and "earns X per year"
 * figures that no body publishes are the fastest way to lose trust with buyers and with
 * search quality raters. A claim passes only when a recognised source (configurable) is
 * named in the same paragraph, or the sentence is framed as an example or assumption.
 */
import { result } from '../report.mjs';

export const id = 15;
export const name = 'claims';

const PATTERNS = [
  { re: /\b\d{1,2}(?:\.\d)?\s*(?:%|percent)\s*(?:to\s*\d{1,2}(?:\.\d)?\s*%)?\s*(?:gross|net|annual|rental)?\s*(?:yield|return|roi|cap rate)/gi, label: 'yield or ROI figure' },
  { re: /\b(?:yield|return|roi)s?\s*(?:of|at|around|about)?\s*\d{1,2}(?:\.\d)?\s*(?:%|percent)/gi, label: 'yield or ROI figure' },
  { re: /\b\d{2,3}\s*%\s*occupancy/gi, label: 'occupancy figure' },
  { re: /\boccupancy\s*(?:of|at|around|above|below)?\s*\d{2,3}\s*%/gi, label: 'occupancy figure' },
  { re: /(?:\$|€|£)\s?\d[\d,]*(?:\s*(?:to|-)\s*(?:\$|€|£)?\s?\d[\d,]*)?\s*(?:per|a|\/)\s*night/gi, label: 'nightly rate' },
  { re: /\d[\d,]*\s*[A-Z]{3}\s*(?:per|a|\/)\s*night/g, label: 'nightly rate' },
  { re: /\b(?:generates?|earns?|delivers?|produces?|makes?|yields?|nets|grosses)\s+(?:approximately\s+|around\s+|about\s+|up\s+to\s+)?(?:\$|€|£)?[\d,]{4,}(?:\s*[A-Z]{3})?\s*(?:in\s+)?(?:gross|net)?\s*(?:rental\s+income|income|rent)?\s*(?:per|a|each)\s+(?:year|annum|month)/gi, label: 'income per period' },
  { re: /\b(?:capital\s+)?(?:appreciation|price\s+growth|value\s+growth)\s*(?:of|at|around)?\s*\d{1,2}(?:\.\d)?\s*%\s*(?:per\s+year|a\s+year|annually|p\.a\.)/gi, label: 'appreciation figure' },
];
const FRAMING = /\b(assume|assuming|assumption|example|illustrative|hypothetical|for instance|if you|suppose|model|scenario|worked example)\b/i;

export async function run({ cfg, corpus }) {
  if (!cfg.claims.enabled) return result(id, name, { status: 'skip', summary: 'disabled in config' });
  const sources = (cfg.claims.allowedSources || []).map((s) => s.toLowerCase());
  const findings = [];
  for (const f of corpus) {
    if (f.noindex) continue;
    for (const para of f.body.split(/\n{2,}/)) {
      if (/^\s*(import|<|\{)/.test(para)) continue;
      const low = para.toLowerCase();
      const sourced = sources.some((s) => low.includes(s)) || /\b(according to|reported by|published by|source:|data from|per the|as reported)\b/i.test(para);
      if (sourced || FRAMING.test(para)) continue;
      for (const { re, label } of PATTERNS) {
        re.lastIndex = 0;
        const m = re.exec(para);
        if (m) { findings.push({ file: f.rel, message: `${label} without a source: "${m[0].trim().slice(0, 60)}"` }); break; }
      }
    }
  }
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} unsourced figure(s)` : 'every figure is sourced or framed as an example', findings });
}
