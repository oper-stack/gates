/**
 * Gate 11, readability. Human signals that mark machine-written text: typographic dash
 * density per 500 words, "Scenario A to D" spam, numbered steps with dashes, bold left
 * open, corpus stamps, sentences over 45 words, and paragraphs over 170 words.
 */
import { result } from '../report.mjs';
import { toPlainText, wordCount } from '../corpus.mjs';

export const id = 11;
export const name = 'readability';

export async function run({ cfg, corpus }) {
  const limit = cfg.readability.emDashPer500 ?? 8; const R = cfg.readability;
  const findings = [];
  for (const f of corpus) {
    if (f.noindex) continue;
    const body = f.body; const words = wordCount(toPlainText(body));
    if (words < 80) continue;
    const push = (m) => findings.push({ file: f.rel, message: m });
    const dashes = (body.match(/[—–]/g) || []).length; const per500 = (dashes / words) * 500;
    if (per500 > limit) push(`${dashes} typographic dashes (${per500.toFixed(1)} per 500 words, limit ${limit})`);
    const scenarios = (body.match(/^Scenario [A-D]\s*[—:-]/gm) || []).length;
    if (scenarios >= 4) push(`${scenarios} "Scenario A to D" lines, reads as a template`);
    const dashSteps = (body.match(/^\d+\. [^\n]+ — /gm) || []).length;
    if (dashSteps >= 6) push(`${dashSteps} numbered steps with a dash after the label`);
    if (/\{\/\* corpus:/.test(body)) push('corpus uniquify stamp left in text');
    const prose = toPlainText(body);
    const longSentences = prose.split(/(?<=[.!?])\s+/).filter((s) => wordCount(s) > R.longSentence).length;
    if (longSentences >= R.longSentenceCount) push(`${longSentences} sentences over ${R.longSentence} words`);
    const longParas = body.split(/\n{2,}/).filter((p) => !/^\s*[|<{#-]/.test(p) && wordCount(toPlainText(p)) > R.longParagraph).length;
    if (longParas >= R.longParagraphCount) push(`${longParas} paragraphs over ${R.longParagraph} words`);
  }
  return result(id, name, { status: findings.length ? 'warn' : 'pass', summary: findings.length ? `${findings.length} readability flag(s)` : 'reads like a person wrote it', findings });
}
