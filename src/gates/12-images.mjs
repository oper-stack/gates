/**
 * Gate 12, images. Every image URL referenced in the source (frontmatter heroes, inline
 * markdown images, components, data files) must return HTTP 200, and local paths must exist
 * in the public directory. Batched HEAD requests with one retry.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { result } from '../report.mjs';

export const id = 12;
export const name = 'images';

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name.startsWith('.')) continue;
    const p = join(dir, name); const st = statSync(p);
    if (st.isDirectory()) walk(p, out); else if (/\.(astro|mdx|md|ts|tsx|js|mjs|json)$/.test(name)) out.push(p);
  }
  return out;
}

const isImageUrl = (u) => /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i.test(u) || /cloudinary\.com\/.+\/image\/upload\//.test(u) || /wikimedia|unsplash/.test(u);

async function head(url) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 12000);
  try { const r = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: c.signal }); return r.status; }
  catch { return 0; } finally { clearTimeout(t); }
}

export async function run({ cfg, corpus, flags }) {
  const src = resolve(cfg.root, 'src');
  const map = new Map();
  const files = existsSync(src) ? walk(src) : corpus.map((f) => f.path);
  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/https?:\/\/[^\s"'`)>\]]+/g)) {
      const u = m[0].replace(/[.,;]+$/, '');
      if (!isImageUrl(u) || u.includes('${')) continue;
      (map.get(u) || map.set(u, new Set()).get(u)).add(file.replace(cfg.root + '/', ''));
    }
    for (const m of text.matchAll(/(?:heroImage|image|src):\s*["'](\/[^"']+\.(?:jpe?g|png|webp|gif|svg|avif))["']/g)) {
      const local = resolve(cfg.root, cfg.publicDir, m[1].replace(/^\//, ''));
      if (!existsSync(local)) (map.get(m[1]) || map.set(m[1], new Set()).get(m[1])).add(file.replace(cfg.root + '/', ''));
    }
  }
  const findings = [];
  const urls = [...map.keys()];
  let ok = 0;
  const remote = urls.filter((u) => /^https?:/.test(u));
  for (const u of urls.filter((u) => u.startsWith('/'))) findings.push({ file: [...map.get(u)][0], message: `local image missing in ${cfg.publicDir}: ${u}` });
  if (flags.offline) {
    return result(id, name, { status: findings.length ? 'fail' : 'skip', summary: findings.length ? `${findings.length} local image(s) missing, ${remote.length} remote URL(s) not checked (offline)` : `${remote.length} remote URL(s) not checked (offline), local paths ok`, findings, stats: { remote: remote.length, localMissing: findings.length } });
  }
  let i = 0;
  const workers = Array.from({ length: Math.min(12, remote.length) }, async () => {
    while (i < remote.length) {
      const u = remote[i++]; let s = await head(u); if (s === 0) s = await head(u);
      if (s === 200) ok++; else findings.push({ file: [...map.get(u)][0], message: `HTTP ${s || 'ERR'} ${u}` });
    }
  });
  await Promise.all(workers);
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} of ${urls.length} image(s) unreachable` : `${ok} image URL(s) return 200`, findings, stats: { checked: urls.length, ok } });
}
