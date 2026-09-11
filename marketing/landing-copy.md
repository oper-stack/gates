# oper-stack.com/gates: landing page copy

Working title of the page: **Fifteen gates**

## Hero

**Eyebrow:** Free, open source, one command

**Headline:** Your content site has defects the build log will never show you.

**Subhead:** Fifteen automated gates for MDX content sites: cut titles, copied paragraphs, hollow sections, dead links, stale AI index, unsourced figures. One command, one config file, thirteen seconds on 1,660 pages.

**Primary button:** `npx @operstack/gates`  (copies the command)

**Secondary button:** Get the 8-page PDF (email)

**Under the buttons:** MIT licence. No account. Works with Astro, Next and any MDX content folder.

## Proof strip

- Built on a pipeline that publishes to 11 content sites
- 1,660 files, 1,760 built pages, 13 seconds
- Leads confirmed from ChatGPT, Perplexity and Copilot referrals on sites that pass these gates
- Every gate exists because that exact failure shipped once

## The seven silent failures (section)

**Heading:** What ships when nobody checks

1. A currency sign that renders as a question mark in the search snippet.
2. A title cut on the last stop word by a template.
3. The same paragraph on 121 pages with the numbers swapped. Google calls this scaled content abuse.
4. An H2 with nothing under it.
5. An anchor that names one district and links to another.
6. A page merged away six weeks ago, still advertised in llms.txt.
7. "7.5% net yield" that nobody ever sourced.

**Closing line:** None of these fail a build. All of them fail a reader.

## How it works (section)

**Heading:** Three steps, no setup ceremony

1. **Install.** `npm i -D @operstack/gates`, Node 20 or newer.
2. **Describe your site.** One JSON file: collections, word minimums, currency codes, place names, allowed sources. Or skip it and let the tool detect `src/content/*`.
3. **Run.** `npx gates`. Terminal table, Markdown report, JSON for CI. Exit code 1 when something must not ship.

## The fifteen gates (section)

Four groups, in the order they run.

**Mechanical (minutes to fix):** 01 characters, 02 MDX compile, 03 frontmatter, 04 structure.

**Corpus debt (where the real work is):** 05 duplication, 06 shared sentences, 07 hollow sections.

**Links and routing (usually one config change):** 08 internal links, 09 link semantics, 10 meta, 13 redirects, 14 AI index.

**Trust (editorial work):** 11 readability, 12 images, 15 unsourced claims.

Link: "What each gate checks and why" (docs/GATES.md)

## Sample output (section)

Show the real terminal block from the README, monospace, dark panel.

## Who it is for (section)

- **Solo publishers and programmatic SEO builders** who generate hundreds of pages and cannot read them all.
- **Agencies** that ship content for clients and need a gate before the client sees it.
- **Teams using Cursor or Claude Code** to write content: the rules file tells the model what the gates will reject, so the model stops producing it.

## The rules file (section)

**Heading:** Tell the model before the gate tells you

One Markdown file, drop it into `.cursor/rules/` or `CLAUDE.md`. It states every rule the gates enforce in the language a model follows. Included in the package, free.

## Ladder (section)

**Heading:** When the gates find more than you can fix

- **Fifteen gates and the rules file.** Free. This page.
- **The 8-page PDF.** Free for an email: each gate, the failure it was written for, the fix.
- **Site Kit, 79 USD.** The full pipeline the gates came from: Astro templates, page generator, indexing, AI index, image handling, a demo market, and the gates wired in.
- **SEO, AEO and GEO audit, 149 USD for the first ten, then 249.** Forty checks across six areas, every score computed from the checks and printed with the count behind it. With read-only access to your own free Search Console it is 199 USD. Twelve-page PDF. Afterwards: Fix at 249 USD against a list agreed before payment, or Foundation from 500 USD.

## FAQ (section)

**Does it rewrite my content?** No. `--fix` replaces currency signs and pictographs. Everything else is a report.

**Will it work on a non-Astro site?** Any folder of MDX or Markdown with frontmatter. Gate 08 needs a static build for the exact check; otherwise it checks source links.

**Is the fixture data real?** No. The demo site "Isla Verde" is fictional; every number is invented for the tests. Run it with `npx @operstack/gates --demo`.

**Why fifteen?** Because the sixteenth failure has not shipped yet.

## Footer CTA

**Headline:** Run it before your next deploy.

`npx @operstack/gates`
