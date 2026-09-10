/**
 * Gate 08, internal links. Two modes. With a build directory present it scans every built
 * HTML file and checks that each internal href resolves to a file (honouring redirects).
 * Without a build it checks source links against the content index: every link into a
 * collection must point at an existing, indexable page.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';
import { result } from '../report.mjs';
import { internalLinks } from '../corpus.mjs';

export const id = 8;
export const name = 'internal-links';

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else if (e.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function loadRedirects(cfg) {
  const p = resolve(cfg.root, cfg.redirectsFile);
  if (!existsSync(p)) return new Set();
  try {
    const json = JSON.parse(readFileSync(p, 'utf8'));
    return new Set((json.redirects || []).flatMap((r) => { const s = String(r.source || '').replace(/\{\/\}\?$/, '').replace(/\/$/, ''); return s ? [s, s + '/'] : []; }));
  } catch { return new Set(); }
}

/** Routes rendered on the server (Astro `prerender = false`) have no file in the build but exist at runtime. */
function serverRoutes(cfg) {
  const pages = resolve(cfg.root, 'src/pages');
  if (!existsSync(pages)) return new Set();
  const out = new Set();
  const walkPages = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) { walkPages(p); continue; }
      if (!/\.(astro|ts|js|mjs)$/.test(e.name)) continue;
      let text; try { text = readFileSync(p, 'utf8'); } catch { continue; }
      if (!/export\s+const\s+prerender\s*=\s*false/.test(text)) continue;
      let route = '/' + relative(pages, p).replace(/\\/g, '/').replace(/\.(astro|ts|js|mjs)$/, '').replace(/(^|\/)index$/, '');
      if (/\[/.test(route)) continue; // dynamic server routes cannot be enumerated
      out.add(route.endsWith('/') ? route : `${route}/`);
    }
  };
  walkPages(pages);
  return out;
}

export async function run({ cfg, corpus }) {
  const findings = [];
  const dist = resolve(cfg.root, cfg.buildDir);
  const redirects = loadRedirects(cfg);
  const ssr = serverRoutes(cfg);
  const site = (cfg.siteUrl || '').replace(/\/$/, '');
  if (existsSync(dist)) {
    const files = walk(dist);
    const broken = new Map();
    const skipExt = /\.(png|jpe?g|gif|webp|svg|ico|css|js|mjs|json|xml|txt|pdf|mp4|webm|woff2?|ttf)(\?|$)/i;
    const exists = (u) => {
      const clean = u.split('#')[0].split('?')[0];
      if (!clean || clean === '/') return existsSync(join(dist, 'index.html'));
      return [join(dist, clean), join(dist, clean, 'index.html'), join(dist, clean.replace(/\/$/, '') + '.html'), join(dist, clean.replace(/\/$/, '') + '/index.html')].some((p) => existsSync(p));
    };
    for (const file of files) {
      const html = readFileSync(file, 'utf8');
      for (const m of html.matchAll(/\b(?:href|src|action)\s*=\s*["']([^"']+)["']/gi)) {
        let href = m[1].trim();
        if (!href || /^(#|mailto:|tel:|javascript:|data:)/.test(href)) continue;
        if (/^https?:\/\//i.test(href)) { if (!site || !href.startsWith(site)) continue; href = href.slice(site.length) || '/'; }
        if (!href.startsWith('/') || skipExt.test(href)) continue;
        const clean = href.split('#')[0].split('?')[0];
        if (!exists(href) && !redirects.has(clean) && !redirects.has(clean.replace(/\/$/, '')) && !ssr.has(clean.endsWith('/') ? clean : `${clean}/`)) {
          (broken.get(href) || broken.set(href, new Set()).get(href)).add(relative(dist, file));
        }
      }
    }
    for (const [url, sources] of [...broken].sort((a, b) => b[1].size - a[1].size)) findings.push({ message: `${url} (${sources.size} page(s), e.g. ${[...sources][0]})` });
    return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${broken.size} broken internal URL(s) in ${files.length} built pages` : `no broken links in ${files.length} built pages`, findings, stats: { mode: 'build', pages: files.length, broken: broken.size } });
  }
  const urls = new Set(['/']); const noindex = new Set();
  for (const c of Object.values(cfg.collections)) urls.add(c.url);
  for (const f of corpus) { urls.add(f.url); if (f.noindex) noindex.add(f.url); }
  const prefixes = Object.values(cfg.collections).map((c) => c.url);
  for (const f of corpus) {
    for (const link of internalLinks(f.body)) {
      const norm = link.endsWith('/') ? link : `${link}/`;
      if (!prefixes.some((p) => norm.startsWith(p))) continue;
      if (!urls.has(norm)) findings.push({ file: f.rel, message: `link to missing page ${norm}` });
      else if (noindex.has(norm)) findings.push({ file: f.rel, message: `link to noindex page ${norm}` });
    }
  }
  return result(id, name, { status: findings.length ? 'fail' : 'pass', summary: findings.length ? `${findings.length} bad source link(s); build the site for the full check` : `source links resolve (build the site for the full check)`, findings, stats: { mode: 'source' } });
}
