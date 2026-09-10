/**
 * Corpus loader: every MDX file in every configured collection, frontmatter split from body,
 * with the fields the gates need. One loader means every gate counts the same files.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export function splitFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { fm: m[1], body: m[2] } : { fm: '', body: raw };
}

export function fmString(fm, key) {
  const m = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'));
  if (!m) return '';
  return m[1].trim().replace(/^["']|["']$/g, '');
}

/** Minimal YAML reader for flat frontmatter: scalars, inline arrays and simple lists. */
export function parseFrontmatter(fm) {
  const data = {};
  let currentArray = null;
  for (const line of fm.split('\n')) {
    if (/^\s/.test(line)) {
      if (currentArray && line.trim().startsWith('- ')) {
        const item = line.trim().slice(2).trim().replace(/^['"]|['"]$/g, '');
        if (!item.includes(':')) data[currentArray].push(item);
      }
      continue;
    }
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const kv = trimmed.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!kv) continue;
    currentArray = null;
    const [, key, value] = kv;
    if (value === '') { data[key] = []; currentArray = key; }
    else if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
    } else data[key] = value.replace(/^['"]|['"]$/g, '');
  }
  return data;
}

export function loadCorpus(cfg, { collections } = {}) {
  const files = [];
  for (const coll of collections ?? Object.keys(cfg.collections)) {
    const dir = join(cfg.contentPath, coll);
    if (!existsSync(dir)) continue;
    const c = cfg.collections[coll] || { url: `/${coll}/` };
    for (const name of readdirSync(dir).filter((n) => n.endsWith('.mdx') || n.endsWith('.md')).sort()) {
      const path = join(dir, name);
      const raw = readFileSync(path, 'utf8');
      const { fm, body } = splitFrontmatter(raw);
      const slug = name.replace(/\.mdx?$/, '');
      const data = parseFrontmatter(fm);
      const route = typeof data.route === 'string' && data.route.startsWith('/') ? data.route : `${c.url}${slug}/`;
      files.push({
        coll, slug, id: `${coll}/${slug}`, url: route, path, rel: `${cfg.contentDir}/${coll}/${name}`,
        raw, fm, body, data,
        noindex: /^noindex:\s*true\s*$/m.test(fm) || /^draft:\s*true\s*$/m.test(fm),
        title: fmString(fm, 'title'),
        description: fmString(fm, 'description'),
      });
    }
  }
  return files;
}

export function toPlainText(body) {
  return body
    .replace(/^import\s.+$/gm, ' ')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(text) {
  return (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) || []).length;
}

export function h2Sections(body) {
  const parts = body.split(/^(##\s+.+)$/m);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    out.push({ heading: parts[i].replace(/^##\s+/, '').trim(), content: parts[i + 1] ?? '' });
  }
  return out;
}

export function internalLinks(body) {
  const links = new Set();
  for (const pattern of [/\]\((\/[^)#\s]+\/?)\)/g, /href=["'](\/[^"'#\s]+\/?)["']/g]) {
    for (const m of body.matchAll(pattern)) {
      if (!m[1].startsWith('/api/') && !m[1].startsWith('/_')) links.add(m[1]);
    }
  }
  return [...links];
}
