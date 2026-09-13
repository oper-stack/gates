/**
 * Fixture test. Runs every gate on test/fixtures (a small fictional site, "Isla Verde",
 * with one deliberate defect per gate and one page that must pass everything) and checks:
 *   1. each gate reports the status and the finding it is built to catch,
 *   2. the clean page is never mentioned by any gate (no false positives),
 *   3. allowed boilerplate and same-shaped tables are not reported as duplication,
 *   4. --fix rewrites currency signs and pictographs on a temporary copy.
 */
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadConfig } from '../src/config.mjs';
import { runGates } from '../src/runner.mjs';
import { isExampleUrl, inPlaceholder } from '../src/gates/12-images.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixtures = resolve(here, 'fixtures');

// [gate id, expected status, substrings that must appear in at least one finding]
const EXPECT = [
  [1, 'fail', ['bad-characters.mdx', 'currency sign ₡', 'decorative pictograph', 'em or en dash']],
  [2, 'fail', ['bad-mdx.mdx', 'closing tag']],
  [3, 'fail', ['missing frontmatter "author"', 'title length 17', 'ends on a stop word', 'Unsplash', 'relatedSlug "ghost-slug" does not exist', 'duplicate import']],
  [4, 'fail', ['bad-structure.mdx', 'banned phrase', 'AI filler', 'H1 in body', 'heading level skip H2 to H4', 'without trailing slash', 'draft or source marker', 'missing answer-first block']],
  [5, 'fail', ['dup-a.mdx', 'the first 50 metres from the high tide line', 'template with swapped numbers']],
  [6, 'fail', ['3x sentence', 'every lease longer than three years']],
  [7, 'fail', ['empty section "What the charge covers"', 'holds only shared filler', 'restating its heading', 'start above 1', 'holding only a comma', 'templated FAQ answer']],
  [8, 'fail', ['/guides/does-not-exist/']],
  [9, 'warn', ['anchor names playa norte but link goes to playa sur', 'index number in anchor text', 'entity name but links elsewhere', 'links to itself', 'linked 4 times on one page']],
  [10, 'warn', ['title repeats the year', 'title repeats "guide"']],
  [11, 'warn', ['bad-readability.mdx', 'sentences over 45 words']],
  [12, 'fail', ['local image missing', '/images/missing-hero.jpg']],
  [13, 'fail', ['cycle: /old-a -> /old-b -> /old-a', 'chain of 3', 'live page /guides/bad-meta/ is redirected away']],
  [14, 'fail', ['does not exist: /guides/ghost-page/', 'lists noindex page /guides/draft-page/', 'missing from the index: /guides/bad-structure/']],
  [15, 'fail', ['7.5% net yield', '$140 per night']],
  // Гейт 16: карточка агента на месте, а markdown есть ровно у одной страницы. Значит приём
  // применён, и отсутствие у остальных это поломка, а не осознанный выбор.
  [16, 'fail', ['has no markdown rendition']],
];
// substrings that must NOT appear in any finding of the given gate
const FORBID = [
  [5, ['| field | value |']],
  [6, ['this card records what the developer published']],
];

let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };
const ok = (msg) => console.log(`  ok   ${msg}`);

const cfg = loadConfig(join(fixtures, 'gates.config.json'));
const { results } = await runGates(cfg, { offline: true });
const byId = new Map(results.map((r) => [r.id, r]));
const text = (r) => r.findings.map((f) => `${f.file || ''} ${f.message}`);

for (const [id, status, needles] of EXPECT) {
  const r = byId.get(id);
  if (!r) { fail(`gate ${id} did not run`); continue; }
  if (r.status !== status) fail(`gate ${id} ${r.name}: status ${r.status}, expected ${status}`);
  const lines = text(r);
  for (const n of needles) {
    if (!lines.some((l) => l.includes(n))) fail(`gate ${id} ${r.name}: no finding contains "${n}"`);
  }
  if (r.status === status && needles.every((n) => lines.some((l) => l.includes(n)))) ok(`gate ${String(id).padStart(2, '0')} ${r.name}: ${status}, ${needles.length} expected finding(s) present`);
}
for (const [id, needles] of FORBID) {
  const lines = text(byId.get(id));
  for (const n of needles) {
    if (lines.some((l) => l.includes(n))) fail(`gate ${id}: finding contains allowed boilerplate "${n}"`); else ok(`gate ${String(id).padStart(2, '0')}: allowed pattern "${n.slice(0, 40)}" not reported`);
  }
}
const cleanHits = results.flatMap((r) => r.findings.filter((f) => `${f.file || ''} ${f.message}`.includes('clean-guide.mdx')).map((f) => `gate ${r.id}: ${f.message}`));
if (cleanHits.length) { for (const h of cleanHits) fail(`clean page flagged: ${h}`); } else ok('clean-guide.mdx passes all 16 gates');

// Гейт 12 не должен ходить по примерам: подсказка в поле ввода и домены из RFC 2606
// не существуют намеренно, а раньше давали ложный провал на живом сайте.
const ph = 'placeholder="https://your-site.com/logo.svg"';
if (!inPlaceholder(ph, ph.indexOf('https://'))) fail('gate 12: адрес внутри placeholder не распознан');
else ok('gate 12: подсказка в поле ввода не считается картинкой');
if (inPlaceholder('<img src="https://cdn.example.net/a.png">', 10)) fail('gate 12: обычный src принят за placeholder');
else ok('gate 12: обычный src по-прежнему проверяется');
for (const u of ['https://your-site.com/logo.svg', 'https://example.com/a.png', 'https://cdn.example.org/b.jpg', 'https://foo.test/c.png']) {
  if (!isExampleUrl(u)) fail(`gate 12: пример ${u} не распознан как пример`);
}
ok('gate 12: домены-примеры не проверяются');
if (isExampleUrl('https://res.cloudinary.com/demo/image/upload/a.jpg')) fail('gate 12: настоящий адрес принят за пример');
else ok('gate 12: настоящие адреса по-прежнему проверяются');

// И то же самое через сам гейт, а не через предикаты. Ожидаемое число считаем по самим
// фикстурам, чтобы проверка не ломалась от каждой новой картинки: в них должно быть
// столько собранных адресов, сколько там не-примеров.
{
  const isImg = (u) => /\.(jpe?g|png|webp|gif|svg|avif)(\?|$)/i.test(u) || /cloudinary\.com\/.+\/image\/upload\//.test(u) || /wikimedia|unsplash/.test(u);
  const walkAll = (dir, out = []) => {
    for (const n of readdirSync(dir)) {
      if (n === 'node_modules' || n.startsWith('.')) continue;
      const fp = join(dir, n);
      if (statSync(fp).isDirectory()) walkAll(fp, out);
      else if (/\.(astro|mdx|md|ts|tsx|js|mjs|json)$/.test(n)) out.push(fp);
    }
    return out;
  };
  let expected = 0; let examples = 0;
  for (const fp of walkAll(join(fixtures, 'src'))) {
    const t = readFileSync(fp, 'utf8');
    for (const m of t.matchAll(/https?:\/\/[^\s"'`)>\]]+/g)) {
      const u = m[0].replace(/[.,;]+$/, '');
      if (!isImg(u) || u.includes('${')) continue;
      if (isExampleUrl(u) || inPlaceholder(t, m.index)) examples += 1; else expected += 1;
    }
  }
  const remote = byId.get(12)?.stats?.remote;
  if (examples < 2) fail(`gate 12: в фикстурах не осталось примеров для проверки (нашли ${examples})`);
  else if (remote !== expected) fail(`gate 12: гейт собрал ${remote} адрес(ов), а не-примеров в фикстурах ${expected}`);
  else ok(`gate 12: собрано ${remote} настоящих адрес(ов), ${examples} примера отсеяно`);
}

// --fix on a temporary copy
const tmp = mkdtempSync(join(tmpdir(), 'gates-fix-'));
try {
  cpSync(fixtures, tmp, { recursive: true });
  const cfg2 = loadConfig(join(tmp, 'gates.config.json'));
  await runGates(cfg2, { offline: true, fix: true, only: '1' });
  const fixed = readFileSync(join(tmp, 'src/content/guides/bad-characters.mdx'), 'utf8');
  if (fixed.includes('₡')) fail('--fix left a currency sign in place'); else ok('--fix replaced currency signs with the code');
  if (/1,200 CRC/.test(fixed) && /2,400 CRC/.test(fixed)) ok('--fix kept the numbers and appended CRC'); else fail(`--fix produced unexpected text: ${fixed.match(/.*1,200.*/)?.[0]}`);
  if (fixed.includes('🏝')) fail('--fix left a pictograph in place'); else ok('--fix removed the pictograph');
  if (!fixed.includes('—')) fail('--fix must leave dashes to a human, but the dash is gone'); else ok('--fix left the dash for a human');
  const again = await runGates(cfg2, { offline: true, only: '1' });
  const g1 = again.results.find((r) => r.id === 1);
  if (g1.stats.currencyLines || g1.stats.pictoLines) fail('gate 01 still reports currency or pictographs after --fix'); else ok('gate 01 reports only the dash after --fix');
} finally { rmSync(tmp, { recursive: true, force: true }); }

console.log(failures ? `\n${failures} check(s) failed` : '\nall checks passed');
process.exit(failures ? 1 : 0);
