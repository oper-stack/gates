/**
 * Configuration loader. Reads gates.config.json from the project root (or --config path),
 * fills defaults, auto-detects collections from the content directory when none are given.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';

export const DEFAULTS = {
  siteUrl: '',
  contentDir: 'src/content',
  buildDir: 'dist/client',
  publicDir: 'public',
  redirectsFile: 'vercel.json',
  agentIndex: 'public/llms.txt',
  reportDir: '.gates',
  collections: {},
  requiredFrontmatter: ['title', 'description', 'pubDate', 'updatedDate', 'author', 'tags'],
  title: { min: 40, max: 60 },
  description: { min: 70, max: 160 },
  currency: [],
  brandWords: ['guide', 'review'],
  placeNames: [],
  fillerPatterns: [],
  faqTemplates: [],
  imageHosts: [],
  claims: { enabled: true, allowedSources: [] },
  readability: { emDashPer500: 8, longSentence: 45, longSentenceCount: 5, longParagraph: 170, longParagraphCount: 3 },
  duplication: { minBlockWords: 12, minPages: 2, sentenceMinWords: 10, fragmentMinWords: 8, sentenceMinPages: 3 },
  links: { maxRepeatsPerPage: 3 },
  structure: { minH2: 4, minTableRows: 6, maxBold: 35, minInternalLinks: 5, minFacts: 8 },
  boilerplate: [],
  failOn: 'fail',
};

export function findConfigPath(explicit) {
  if (explicit) return resolve(explicit);
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, 'gates.config.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export function loadConfig(explicitPath) {
  const path = findConfigPath(explicitPath);
  const raw = path ? JSON.parse(readFileSync(path, 'utf8')) : {};
  const root = raw.root ? resolve(path ? dirname(path) : process.cwd(), raw.root) : (path ? dirname(path) : process.cwd());
  const cfg = { ...DEFAULTS, ...raw, root, configPath: path };
  cfg.title = { ...DEFAULTS.title, ...(raw.title || {}) };
  cfg.description = { ...DEFAULTS.description, ...(raw.description || {}) };
  cfg.claims = { ...DEFAULTS.claims, ...(raw.claims || {}) };
  cfg.readability = { ...DEFAULTS.readability, ...(raw.readability || {}) };
  cfg.duplication = { ...DEFAULTS.duplication, ...(raw.duplication || {}) };
  cfg.links = { ...DEFAULTS.links, ...(raw.links || {}) };
  cfg.structure = { ...DEFAULTS.structure, ...(raw.structure || {}) };
  cfg.boilerplate = (raw.boilerplate || []).map((x) => new RegExp(x, 'i'));
  cfg.contentPath = resolve(root, cfg.contentDir);

  if (!Object.keys(cfg.collections).length && existsSync(cfg.contentPath)) {
    for (const name of readdirSync(cfg.contentPath)) {
      const p = join(cfg.contentPath, name);
      if (statSync(p).isDirectory()) cfg.collections[name] = { url: `/${name}/` };
    }
  }
  for (const [name, c] of Object.entries(cfg.collections)) {
    cfg.collections[name] = {
      url: c.url || `/${name}/`,
      minWords: c.minWords ?? 1200,
      faq: c.faq ?? 0,
      commercial: c.commercial ?? false,
      kind: c.kind || 'article',
      dedupe: c.dedupe ?? true,
      requiredFrontmatter: c.requiredFrontmatter || cfg.requiredFrontmatter,
    };
  }
  return cfg;
}
