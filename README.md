# @operstack/gates

Fifteen automated quality gates for content sites. One command, one config file, one report.

<a href="https://www.producthunt.com/posts/operstack-gates?utm_source=badge-featured&utm_medium=badge" target="_blank"><img src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1247096&theme=dark" alt="OperStack Gates on Product Hunt" width="250" height="54" /></a>

```
npx @operstack/gates
```

```
  OperStack Gates
  ------------------------------------------------------------------------
  OK    01 characters             corpus clean
  OK    02 mdx-compile            1660 file(s) compile
  FAIL  03 frontmatter            59 issue(s)
  FAIL  04 structure              12 structural issue(s)
  FAIL  05 duplication            9 shared block(s) on 64 page(s), 30 near-duplicate
  FAIL  06 shared-sentences       27 sentence(s) and 4 fragment(s) on 3+ pages
  FAIL  07 hollow-sections        1 hollow section(s), 23 finding(s)
  FAIL  08 internal-links         1 broken internal URL(s) in 1760 built pages
  WARN  09 link-semantics         205 anchor(s) disagree with their target
  WARN  10 meta                   1 meta issue(s)
  WARN  11 readability            646 readability flag(s)
  OK    12 images                 2390 image URL(s) return 200
  FAIL  13 redirects              4 redirect problem(s) in 268 rules
  FAIL  14 ai-index               4 disagreement(s) between public/llms.txt and the site
  FAIL  15 claims                 156 unsourced figure(s)
  ------------------------------------------------------------------------
  pass 3  warn 3  fail 9  skip 0
```

That run is real: 1,660 MDX files, 1,760 built pages, 13 seconds on a laptop.

## Why this exists

Every content site that grows past a few hundred pages accumulates the same debt, and none of it shows up in a build log:

- a currency sign pasted into a table that a search snippet renders as a question mark,
- a title cut off on the last stop word because a template truncated it,
- the same paragraph on 121 pages with the numbers swapped,
- an H2 with nothing under it,
- a link whose anchor says one district and whose href goes to another,
- a page that was merged away six weeks ago and is still advertised in `llms.txt`,
- a "7.5% net yield" that nobody ever sourced.

Search engines call the third one scaled content abuse. Answer engines quietly stop citing you after the sixth. Buyers leave after the seventh.

These gates were built while running a pipeline that publishes to eleven content sites. Every check exists because that specific failure shipped at least once. The package extracts the checks, drops every site-specific string into a config file, and gives you the same fifteen gates in one command.

## Quick start

1. Install into an Astro, Next or any MDX-based project (Node 20 or newer):

   ```
   npm install --save-dev @operstack/gates
   ```

2. Copy `gates.config.example.json` to `gates.config.json` in the project root and edit the collections and the site URL:

   ```json
   {
     "siteUrl": "https://example.com",
     "contentDir": "src/content",
     "collections": {
       "guides":   { "url": "/guides/",   "minWords": 2000, "faq": 5, "commercial": true },
       "projects": { "url": "/projects/", "minWords": 400,  "kind": "entity" },
       "news":     { "url": "/news/",     "minWords": 60,   "kind": "news" }
     },
     "currency": [{ "sign": "฿", "code": "THB" }]
   }
   ```

   No config at all also works: the tool finds `src/content/*` and treats every folder as a collection with default thresholds.

3. Run:

   ```
   npx gates
   ```

   The terminal shows the table and the first eight findings per gate. The full list goes to `.gates/gates-report.md` and `.gates/gates-report.json`.

4. Try it on the bundled demo site first if you want to see every gate fire:

   ```
   npx @operstack/gates --demo
   ```

## The fifteen gates

| # | Gate | What it catches | Level |
|---|---|---|---|
| 01 | characters | currency signs that should be codes, pictographs and emoji in copy, em and en dashes | fail |
| 02 | mdx-compile | files the build will reject, reported in seconds with the line number | fail |
| 03 | frontmatter | missing fields, title and description length, titles cut mid-phrase, duplicate titles, hero images on hosts you do not control, dead related slugs, word count under the collection minimum | fail |
| 04 | structure | answer-first block, H2 count, tables, FAQ count, pros and cons, risks, scenarios, fact density, over-bolding, banned phrases, AI filler, draft markers, H1 in body, heading skips, links without a trailing slash | fail |
| 05 | duplication | a paragraph on two or more pages, the same paragraph with swapped numbers, a paragraph repeated inside one page | fail |
| 06 | shared-sentences | one sentence copied across three or more pages, list items and table cells shared across pages | fail |
| 07 | hollow-sections | H2 with no body, H2 holding only shared filler, sections that restate their heading, orphan markers, numbered steps that start at 2, table cells holding only a comma, templated FAQ answers | fail |
| 08 | internal-links | every href in the built HTML resolves to a file or a redirect; without a build, every source link points at an existing indexable page | fail |
| 09 | link-semantics | anchor names place A, href goes to place B; anchor is an entity name, href goes elsewhere; index numbers in anchors; self links; one URL linked three or more times on a page | warn |
| 10 | meta | a title that repeats the year or a brand word, stale titles frozen into the body | warn |
| 11 | readability | dash density, "Scenario A to D" templates, corpus stamps, sentences over 45 words, paragraphs over 170 words | warn |
| 12 | images | every image URL in the source returns HTTP 200, every local path exists in `public/` | fail |
| 13 | redirects | cycles, chains of three or more, live pages redirected away | fail |
| 14 | ai-index | `llms.txt` lists a noindex page, lists a page that does not exist, or misses an indexable page | fail |
| 15 | claims | yields, ROI, occupancy, nightly rates, income per period and appreciation figures with no named source and no example framing in the same paragraph | fail |

`docs/GATES.md` (shipped with the package) explains each gate: the failure it was written for, an example finding, and the fix.

## Configuration

Every key is optional. Paths are relative to the config file.

| Key | Default | Meaning |
|---|---|---|
| `root` | config directory | project root when the config lives elsewhere |
| `siteUrl` | `""` | absolute site origin; used to recognise absolute internal links |
| `contentDir` | `src/content` | folder with one subfolder per collection |
| `buildDir` | `dist/client` | built HTML; gate 08 uses it when present |
| `publicDir` | `public` | static files; gate 12 checks local image paths here |
| `redirectsFile` | `vercel.json` | redirects in Vercel format (`{ "redirects": [{ "source", "destination" }] }`) |
| `agentIndex` | `public/llms.txt` | the agent index gate 14 compares with the corpus |
| `reportDir` | `.gates` | where the reports are written |
| `collections` | auto | per collection: `url`, `minWords`, `faq`, `commercial`, `kind` (`article`, `entity`, `news`), `dedupe`, `requiredFrontmatter` |
| `requiredFrontmatter` | title, description, pubDate, updatedDate, author, tags | fields every page must carry |
| `title` | `{ "min": 40, "max": 60 }` | title length in characters |
| `description` | `{ "min": 70, "max": 160 }` | description length in characters |
| `currency` | `[]` | signs to reject and the code to spell instead, e.g. `{ "sign": "฿", "code": "THB" }` |
| `brandWords` | guide, review | words a title may use once |
| `placeNames` | `[]` | place names gate 09 uses to compare anchor text with the href |
| `fillerPatterns` | `[]` | regexes for shared filler lines that do not count as section content |
| `faqTemplates` | `[]` | regexes for templated FAQ answers |
| `boilerplate` | `[]` | regexes for text that may legitimately repeat across pages (disclaimers, method notes) |
| `imageHosts` | `[]` | hosts a hero image may live on; empty means no host check |
| `claims` | `{ "enabled": true, "allowedSources": [] }` | sources that make a figure acceptable when named in the same paragraph |
| `readability` | 8 dashes per 500 words, 45-word sentences, 170-word paragraphs | thresholds for gate 11 |
| `duplication` | 12-word blocks on 2 pages, 10-word sentences on 3 pages | thresholds for gates 05 and 06 |
| `links` | `{ "maxRepeatsPerPage": 3 }` | gate 09 repeat threshold |
| `structure` | 4 H2, 6 table rows, 35 bold spans, 5 internal links, 8 facts | thresholds for gate 04 on commercial pages |
| `failOn` | `fail` | `warn` makes warnings fail the run |

Pages with `noindex: true` or `draft: true` in frontmatter are loaded but excluded from cross-page checks. A `route:` field overrides the URL derived from the collection and the file name.

## CLI

```
gates [--config path] [--only 1,4,15] [--fix] [--json] [--offline] [--fail-on warn|fail] [--top N]
```

- `--only` runs a subset by gate number.
- `--fix` rewrites currency signs and pictographs in place (gate 01). Dashes are left for a person, because the right replacement depends on the sentence.
- `--json` prints the full report as JSON instead of the table.
- `--offline` skips remote image checks; local paths are still verified.
- `--fail-on warn` makes the exit code non-zero on warnings as well as failures.
- `--top` changes how many findings per gate the terminal shows (default 8).
- `--demo` runs the gates on the bundled fictional site, Isla Verde, where every gate has one deliberate defect to catch.

Exit code is 1 when any gate fails (or warns, with `--fail-on warn`), 2 when no collections are found, 0 otherwise.

## In CI

```yaml
# .github/workflows/gates.yml
name: content gates
on: [pull_request]
jobs:
  gates:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - run: npm ci
      - run: npm run build
      - run: npx gates --fail-on warn
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: gates-report, path: .gates/ }
```

Run the build first so gate 08 checks the real HTML. Without a build the gate falls back to source links and says so.

As a pre-commit hook, run the fast subset: `npx gates --only 1,2,3,4,7 --offline`.

## Programmatic use

```js
import { loadConfig, runGates } from '@operstack/gates';

const cfg = loadConfig('./gates.config.json');
const { results, exitCode } = await runGates(cfg, { offline: true });
for (const r of results) console.log(r.id, r.name, r.status, r.summary);
```

Each result is `{ id, name, status, summary, findings: [{ file?, line?, message }], stats }`.

## What it does not do

- It does not measure rankings, traffic or citations. It measures the corpus you are about to publish.
- It does not rewrite prose. `--fix` touches characters only.
- It does not parse every YAML feature. Frontmatter is read as flat keys, inline arrays and simple lists, which covers Astro content collections in practice.
- Gate 08 needs a static build to be exact. Server-rendered routes fall back to the source check.

## Development

```
npm test      # runs every gate on the Isla Verde fixture site and checks 23 expectations
npm run demo  # same as npx gates --demo
```

The fixture site is fictional. Every number in it is invented for the test.

## License

MIT. Built by OperStack.

## Gate 16, the agent surface

**In plain words.** Assistants are starting to read two small files to work out what a site is: an
agent card at `/.well-known/agent.json`, and a markdown copy of each page for when HTML gets in the
way. Both are easy to add once and easy to lose without noticing, because no human ever opens those
URLs. This gate opens them for you on every build.

**What it does.** Missing entirely is a warning: the standards are early and optional. Broken is a
failure: a card that is not valid JSON or is missing its name, description or URL, and pages with no
markdown rendition **while other pages have one**, which means the thing worked and quietly stopped.

It found real drift the day it was written: a 1,350-page site had markdown for almost every page and
none for five, and another had it for twenty pages and none for its services section.
