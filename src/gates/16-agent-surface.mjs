/**
 * Gate 16, agent surface. The files an AI agent reads to learn what this site is and what can be
 * called on it: the agent card at /.well-known/agent.json, and a markdown rendition of the pages.
 *
 * Why this is a gate and not advice. Both are easy to add once and easy to lose silently: a card
 * that stops being deployed, a markdown file that is not regenerated after a rename. Nobody
 * notices, because no human opens those URLs. A gate does.
 *
 * These standards are early and optional, so a missing file is a warning, never a failure. A card
 * that exists but is broken JSON, or markdown that has gone stale against the corpus, is a failure:
 * that is not an early standard, that is something that used to work and quietly stopped.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { result } from '../report.mjs';

export const id = 16;
export const name = 'agent-surface';

/** Где обычно лежит то, что отдаётся по адресу: сначала собранный сайт, потом public. */
const candidates = (cfg, rel) => [
  cfg.buildDir ? resolve(cfg.root, cfg.buildDir, rel) : null,
  resolve(cfg.root, 'dist', rel),
  resolve(cfg.root, 'public', rel),
].filter(Boolean);

const findFile = (cfg, rel) => candidates(cfg, rel).find((p) => existsSync(p)) || null;

export async function run({ cfg, corpus }) {
  const findings = [];
  let status = 'pass';
  const stats = {};

  // 1. Карточка агента.
  const cardPath = findFile(cfg, '.well-known/agent.json');
  if (!cardPath) {
    status = 'warn';
    findings.push({ message: 'no .well-known/agent.json: an agent directory has nothing to read about this site. Early and optional, but cheap' });
  } else {
    stats.agentCard = true;
    try {
      const card = JSON.parse(readFileSync(cardPath, 'utf8'));
      const missing = ['name', 'description', 'url'].filter((k) => !card[k] && !card.provider?.[k]);
      if (missing.length) { status = 'fail'; findings.push({ file: '.well-known/agent.json', message: `agent card is missing ${missing.join(', ')}` }); }
    } catch (e) {
      status = 'fail';
      findings.push({ file: '.well-known/agent.json', message: `agent card is not valid JSON: ${e.message}` });
    }
  }

  // 2. Markdown-версии страниц. Проверяем по корпусу: если хоть одна есть, значит приём применён,
  //    и тогда отсутствие остальных это поломка, а не выбор.
  const withMd = [];
  const withoutMd = [];
  for (const f of corpus) {
    if (f.noindex) continue;
    const rel = `${f.url.replace(/^\//, '').replace(/\/$/, '')}.md`;
    const relIndex = `${f.url.replace(/^\//, '')}index.md`;
    (findFile(cfg, rel) || findFile(cfg, relIndex) ? withMd : withoutMd).push(f);
  }
  stats.markdownPages = withMd.length;
  if (withMd.length && withoutMd.length) {
    status = 'fail';
    for (const f of withoutMd.slice(0, 20)) findings.push({ file: f.rel, message: `page has no markdown rendition while ${withMd.length} other page(s) do: an agent asking for text/markdown gets HTML here` });
    if (withoutMd.length > 20) findings.push({ message: `and ${withoutMd.length - 20} more page(s) without a markdown rendition` });
  } else if (!withMd.length && corpus.length) {
    if (status === 'pass') status = 'warn';
    findings.push({ message: 'no page offers a markdown rendition: an agent that asks for text/markdown has to strip HTML and guess' });
  }

  const summary = status === 'pass'
    ? `agent card present, ${withMd.length} page(s) offer markdown`
    : status === 'fail'
      ? `${findings.length} problem(s) in the agent surface`
      : 'the agent surface is not set up yet (early standard, optional)';
  return result(id, name, { status, summary, findings, stats });
}
