/**
 * Gate 14, AI index. The agent index (llms.txt) is what answer engines read instead of
 * crawling. It drifts silently: a page merged away stays advertised, a page added later never
 * appears, a noindex page is listed. Fails on any disagreement between the index and the site.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { result } from '../report.mjs';

export const id = 14;
export const name = 'ai-index';

export async function run({ cfg, corpus }) {
  const p = resolve(cfg.root, cfg.agentIndex);
  if (!existsSync(p)) return result(id, name, { status: 'warn', summary: `${cfg.agentIndex} not found, answer engines get nothing to read`, findings: [{ message: `create ${cfg.agentIndex} (llms.txt) listing every indexable page` }] });
  const index = readFileSync(p, 'utf8');
  const found = [...index.matchAll(/\((\/[^)\s]+|https?:\/\/[^)\s]+)\)/g)].map((m) => m[1].replace(/\.md$/, ''));

  // Свой адрес сайта. Настроенный siteUrl главнее всего, но без него карту с абсолютными адресами
  // раньше нельзя было прочитать вовсе: ни одна ссылка не начиналась со слэша, и гейт сообщал, что
  // в индексе нет ни одной страницы. Поэтому в отсутствие настройки берём хост, который встречается
  // в файле чаще прочих: чужие ссылки в карте бывают, но своих всегда больше.
  let site = (cfg.siteUrl || '').replace(/\/$/, '');
  if (!site) {
    const hosts = new Map();
    for (const u of found) {
      const m = /^(https?:\/\/[^/]+)/.exec(u);
      if (m) hosts.set(m[1], (hosts.get(m[1]) || 0) + 1);
    }
    site = [...hosts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
  }

  const advertised = new Set();
  for (const raw of found) {
    let u = raw;
    if (site && u.startsWith(site)) u = u.slice(site.length) || '/';
    if (!u.startsWith('/')) continue;
    advertised.add(u.endsWith('/') ? u : `${u}/`);
  }
  const live = new Map(corpus.map((f) => [f.url, f]));
  const findings = [];
  for (const u of advertised) {
    const f = live.get(u);
    if (f && f.noindex) findings.push({ message: `index lists noindex page ${u}` });
    // Корень раздела это настоящая страница со списком, просто не запись корпуса. Пока гейт этого
    // не знал, он требовал убрать из карты /guides/, то есть ровно ту страницу, с которой читателю
    // и надо начинать.
    else if (!f && Object.values(cfg.collections).some((c) => u.startsWith(c.url)) && !Object.values(cfg.collections).some((c) => u === c.url || u === `${c.url}/`)) {
      findings.push({ message: `index lists a page that does not exist: ${u}` });
    }
  }
  for (const f of corpus) if (!f.noindex && !advertised.has(f.url)) findings.push({ file: f.rel, message: `indexable page missing from the index: ${f.url}` });
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} disagreement(s) between ${cfg.agentIndex} and the site` : `${advertised.size} entries match the site`, findings, stats: { advertised: advertised.size } });
}
