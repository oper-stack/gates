# The sixteen gates, one by one

Each gate below has the same four parts: the failure it was written for, what it checks, an example finding from the fixture site, and the fix. The examples come from "Isla Verde", a fictional island market that ships with the package. Every number in it is invented.

The order is the order the gates run. It is also roughly the order of cost: the first gates are cheap and deterministic, the last ones need judgement.

---

## 01 characters

**The failure.** A writer pastes a price table from a spreadsheet. The currency sign in the cells renders fine in the editor and as a question mark in the search snippet. Somebody else adds an emoji to a heading because it "looks friendly". A third person's editor auto-corrects two hyphens into an em dash on every line. None of it fails the build.

**What it checks.** Every line of every file for currency signs listed in `currency`, decorative pictographs and emoji outside a small keep list (check marks, arrows, degree, section, currency symbols that are standard), and em and en dashes.

**Example.**

```
src/content/guides/bad-characters.mdx:8   currency sign ₡: spell it CRC
src/content/guides/bad-characters.mdx:8   em or en dash: use a comma, a colon, parentheses or a hyphen in ranges
src/content/guides/bad-characters.mdx:8   decorative pictograph 🏝
```

**The fix.** `gates --fix` rewrites `₡1,200` to `1,200 CRC`, `₡1,200 to ₡2,400` to `1,200 to 2,400 CRC`, and removes pictographs. Dashes stay: the right replacement depends on the sentence, and a person spends two seconds on each.

**Config.** `currency: [{ "sign": "฿", "code": "THB" }]`.

---

## 02 mdx-compile

**The failure.** The build takes eleven minutes and fails on file 1,214 because of a double quote inside a JSX string. The writer fixes it, pushes, waits eleven minutes, and finds file 1,380.

**What it checks.** Compiles every file with the same MDX compiler the build uses, frontmatter stripped so line numbers match, and reports every failure at once with the line.

**Example.**

```
src/content/guides/bad-mdx.mdx   Expected a closing tag for `<Callout>` (10:1-10:22)
src/content/guides/bad-frontmatter.mdx:9   Could not parse import/exports with acorn
```

**The fix.** Open the line. The usual causes: an unclosed component tag, a `{` in prose that is not an expression, a `<` followed by a digit, a duplicate import.

---

## 03 frontmatter

**The failure.** A template generated 361 titles with a brand suffix and cut them at 60 characters. Half of them ended on "the" or "for". The description field on a third of the pages ended in an ellipsis. Twenty pages had a hero image on a stock photo host that changed its hotlink policy.

**What it checks.** Required fields per collection; title and description length; titles and descriptions that end on a stop word or an ellipsis; duplicate titles and descriptions across the corpus; hero image hosts outside `imageHosts`; Unsplash anywhere; duplicate import lines; `relatedSlugs` that point at missing or noindex pages; word count below the collection minimum.

**Example.**

```
src/content/guides/bad-frontmatter.mdx   missing frontmatter "author"
src/content/guides/bad-frontmatter.mdx   title length 17, expected 40 to 60
src/content/guides/bad-frontmatter.mdx   description ends on a stop word (cut)
src/content/guides/bad-frontmatter.mdx   heroImage uses Unsplash (licence and hotlink risk)
src/content/guides/bad-frontmatter.mdx   relatedSlug "ghost-slug" does not exist
```

**The fix.** Rewrite the field. For cut titles, drop the brand suffix instead of shortening the promise.

**Config.** `requiredFrontmatter`, `title`, `description`, `imageHosts`, per-collection `minWords`.

---

## 04 structure

**The failure.** A commercial page that reads well and answers nothing: no direct answer at the top, one table, two H2s, no risks, no pros and cons, four numbers in two thousand words. Answer engines skip it because there is nothing to quote. Buyers skip it because there is nothing to decide with.

**What it checks.** On every page: draft markers (`[VERIFY]`, `TODO`, `source needed`), banned marketing phrases, AI filler ("moreover", "delve into", "a testament to"), unclosed bold, text glued to a table row, `<` before a digit, an H1 in the body, heading level skips, placeholder related links, internal links without a trailing slash. On commercial pages additionally: an answer-first block, at least four H2s, at least six table rows, the FAQ count the collection requires, pros and cons, a risks or checklist block, scenarios or a decision framework, numeric fact density scaled to the word count, at most 35 bold spans, at least five internal links.

**Example.**

```
src/content/guides/bad-structure.mdx   draft or source marker left in text ([VERIFY], TODO, source needed)
src/content/guides/bad-structure.mdx   banned phrase: "Future outlook"
src/content/guides/bad-structure.mdx   AI filler phrase (moreover, furthermore, delve into, unlock the potential)
src/content/guides/bad-structure.mdx   markdown H1 in body, the layout renders the title as H1
src/content/guides/bad-structure.mdx   heading level skip H2 to H4 at line 12
src/content/guides/bad-structure.mdx   internal links without trailing slash: /guides/clean-guide
src/content/guides/bad-structure.mdx   missing answer-first block (Quick answer or TL;DR)
```

**The fix.** Add what is missing. The answer-first block is two sentences with the number the reader came for. Fact density is the one people argue with; the threshold is three numbers per 500 words, which any page with a price table clears.

**Config.** `structure: { minH2, minTableRows, maxBold, minInternalLinks, minFacts }`, per-collection `commercial`, `faq`, `kind`.

---

## 05 duplication

**The failure.** A generator wrote 121 project cards with the same closing paragraph and different numbers. Google's spam policy names this pattern. The site's own duplicate checker never saw it, because it compared exact strings and the numbers differed.

**What it checks.** Every paragraph of twelve words or more, three ways: the same paragraph on two or more indexable pages; the same paragraph with digits masked (catches templates with swapped figures); the same paragraph twice inside one page. Tables with the same headers are not counted as near-duplicates, because that is structure, not copied prose. Text matching `boilerplate` patterns is skipped. Collections with `dedupe: false` are skipped.

**Example.**

```
2 pages share: "the first 50 metres from the high tide line belong to the state and cannot be sold to anyo" (dup-a.mdx, dup-b.mdx)
2 pages share a template with swapped numbers: "median asking price per sqm in #is #crc, based on the registry's first half figu"
```

**The fix.** One page keeps the paragraph, the others link to it. For templates with swapped numbers, the honest fix is to write the sentence from the specific fact, not from the template.

**Config.** `duplication: { minBlockWords, minPages }`, `boilerplate`, per-collection `dedupe`.

---

## 06 shared-sentences

**The failure.** The block-level check passed. The corpus still read as machine-written because one sentence, "Every lease longer than three years must be registered within 30 days", appeared inside different paragraphs on 454 pages.

**What it checks.** Sentences of ten words or more and list items or table cells of eight words or more, normalised, counted across indexable pages. Three or more pages is a finding.

**Example.**

```
3x sentence: "every lease longer than three years must be registered at the land registry within 30 days"
```

**The fix.** Same as gate 05, one level down. Legal notices and method statements that must repeat go into `boilerplate`.

**Config.** `duplication: { sentenceMinWords, fragmentMinWords, sentenceMinPages }`, `boilerplate`.

---

## 07 hollow-sections

**The failure.** An outline was generated with twelve H2s and the writer filled nine. The other three rendered as a heading with the next heading directly below it. On another page, every section opened by restating its own heading. On a third, the FAQ answers were the same "Yes, in most cases. Contact our team" eleven times.

**What it checks.** H2 with no body; H2 whose only body matches `fillerPatterns`; a section that opens by restating its heading; a heading that says "placeholder"; an orphan comment marker with nothing after it; numbered steps that start above 1; table cells holding only a comma; heading markup buried inside a line; bold left open across a paragraph break; FAQ answers matching `faqTemplates`.

**Example.**

```
src/content/guides/hollow.mdx   empty section "What the charge covers"
src/content/guides/hollow.mdx   section "How the charge is set" holds only shared filler
src/content/guides/hollow.mdx   section "How to dispute the charge" opens by restating its heading
src/content/guides/hollow.mdx   numbered list or steps start above 1
src/content/guides/hollow.mdx   1 table cell(s) holding only a comma
src/content/guides/hollow.mdx   1 templated FAQ answer(s) that render on the page
```

**The fix.** Write the section or delete the heading. A heading that promises a section and delivers nothing costs more than no heading.

**Config.** `fillerPatterns`, `faqTemplates`.

---

## 08 internal-links

**The failure.** Two content waves were merged on separate branches. Neither branch had a broken link. The merged site had forty, because each wave linked to pages the other wave had renamed.

**What it checks.** With a build directory present: every `href`, `src` and `action` in every built HTML file resolves to a file in the build or to a redirect source. Absolute links to `siteUrl` are treated as internal. Without a build: every source link into a collection points at an existing, indexable page.

**Example.**

```
/guides/does-not-exist/ (1 page(s), e.g. index.html)
```

**The fix.** Repoint or add a redirect. Run this gate on the merged branch, not on each branch.

**Config.** `buildDir`, `redirectsFile`, `siteUrl`.

---

## 09 link-semantics

**The failure.** An anchor read "Playa Norte overview" and linked to the Playa Sur page. Another anchor was a project name and linked to a generic guide instead of the project's own page. A third page linked the same pillar guide four times in one screen.

**What it checks.** Anchor text naming one place from `placeNames` while the href names another; anchor text equal to an entity page's name while the href goes elsewhere; index numbers leaked into anchors ("#3 on our list"); a page linking to itself; one URL linked three or more times on a page.

**Example.**

```
src/content/guides/bad-links.mdx   anchor names playa norte but link goes to playa sur: [Playa Norte overview](/areas/playa-sur/)
src/content/guides/bad-links.mdx   anchor is an entity name but links elsewhere: [Marina Towers](/guides/clean-guide/), expected /projects/marina-towers/
src/content/guides/bad-links.mdx   /guides/clean-guide/ linked 4 times on one page
```

**The fix.** Make the anchor say where the link goes. Entities link to their own page.

**Config.** `placeNames`, `links: { maxRepeatsPerPage }`, collections with `kind: "entity"`.

---

## 10 meta

**The failure.** "Isla Verde Condo Guide 2025 vs 2026: Buyer Guide". The year twice, the format word twice, forty per cent of the title spent on nothing.

**What it checks.** A year appearing twice in a title; a `brandWords` entry appearing twice; older titles frozen into "Read next" blocks in the body after the page was renamed.

**Example.**

```
src/content/guides/bad-meta.mdx   title repeats the year: "Isla Verde Condo Guide 2025 vs 2026: Buyer Guide"
src/content/guides/bad-meta.mdx   title repeats "guide": "Isla Verde Condo Guide 2025 vs 2026: Buyer Guide"
```

**The fix.** One year, one format word, and the promise in the remaining characters.

**Config.** `brandWords`.

---

## 11 readability

**The failure.** A page that passed every structural gate and still read as generated: a dash every second line, four "Scenario A to D" blocks, sentences of sixty words.

**What it checks.** Typographic dashes per 500 words; "Scenario A to D" lines; numbered steps with a dash after the label; corpus uniquify stamps left in the text; five or more sentences over 45 words; three or more paragraphs over 170 words.

**Example.**

```
src/content/guides/bad-readability.mdx   5 sentences over 45 words
```

**The fix.** Split the sentences. This gate warns rather than fails because a legal page can legitimately carry long sentences.

**Config.** `readability: { emDashPer500, longSentence, longSentenceCount, longParagraph, longParagraphCount }`.

---

## 12 images

**The failure.** A CDN account was migrated. 2,300 hero images kept their URLs in the frontmatter and returned 404 for nine days. Nobody noticed because the pages still built.

**What it checks.** Every image URL referenced anywhere under `src/` (frontmatter, inline markdown, components, data files) returns HTTP 200 on a HEAD request, twelve in parallel with one retry. Every local image path exists in `publicDir`. With `--offline`, only the local check runs.

**Example.**

```
src/content/guides/bad-images.mdx   local image missing in public: /images/missing-hero.jpg
```

**The fix.** Re-upload or repoint. Run this gate on a schedule, not only on commits: images break between deploys.

**Config.** `publicDir`.

---

## 13 redirects

**The failure.** A page was merged into another, then that page was merged into a third. The redirects file said A to B and B to C. Search engines follow two hops grudgingly and three not at all. Separately, a source file that still existed was redirected away, so the page built, was linked, and sent every visitor elsewhere.

**What it checks.** Cycles; chains of three or more; any redirect whose source is a page that still exists and is indexable.

**Example.**

```
cycle: /old-a -> /old-b -> /old-a
chain of 3: /x1 -> /x2 -> /x3 (point the first source at the final target)
live page /guides/bad-meta/ is redirected away
```

**The fix.** Point every source at the final target. Delete or noindex the source file of a redirected page.

**Config.** `redirectsFile` (Vercel format).

---

## 14 ai-index

**The failure.** The `llms.txt` file was generated once. Over the next month, four pages were merged away, one was set to noindex and two collections were added. Answer engines kept reading the old file and citing pages that redirected.

**What it checks.** Every URL the index advertises against the corpus: listed but noindex, listed but does not exist, indexable but not listed.

**Example.**

```
index lists a page that does not exist: /guides/ghost-page/
index lists noindex page /guides/draft-page/
src/content/guides/bad-structure.mdx   indexable page missing from the index: /guides/bad-structure/
```

**The fix.** Regenerate the index from the corpus in the build, and run this gate after the build.

**Config.** `agentIndex`.

---

## 15 claims

**The failure.** "A coastal one-bedroom earns a 7.5% net yield with 82% occupancy." No source, no method, on 70 pages. Quality raters call this unsupported claims. Buyers who did the maths called it something shorter.

**What it checks.** In every paragraph: yield and ROI percentages, occupancy percentages, nightly rates, income per period ("generates 21,000 a year"), appreciation per year. A paragraph passes when it names a source from `allowedSources`, uses a sourcing phrase ("according to", "reported by", "data from"), or frames the figure as an example ("assume", "illustrative", "if you", "worked example").

**Example.**

```
src/content/guides/bad-claims.mdx   yield or ROI figure without a source: "7.5% net yield"
src/content/guides/bad-claims.mdx   nightly rate without a source: "$140 per night"
```

**The fix.** Name the source in the same paragraph, or turn the figure into a worked example with its assumptions, or delete it.

**Config.** `claims: { enabled, allowedSources }`.

---

## 16 agent-surface

**The failure.** An agent directory asks what this site is and finds nothing. An assistant asks for the text of a page and gets HTML with a navigation menu inside it. Both files existed once; a rename or a deploy quietly dropped them, and nobody noticed, because no human ever opens those addresses.

**What it checks.** Two things. The agent card at `/.well-known/agent.json`: that it is there, that it is valid JSON, and that it names the site, describes it and gives its address. And whether pages offer a markdown rendition of themselves. Missing is a warning, because both standards are early and optional. Broken is a failure: a card that will not parse, a card without its basic fields, or a corpus where some pages have markdown and others have lost it.

**Example.**

```
.well-known/agent.json              agent card is missing description, url
src/content/guides/new-guide.mdx    page has no markdown rendition while 312 other page(s) do
```

**The fix.** Publish the card into the build output rather than into a folder that never ships. Generate the markdown copies in the same step that builds the pages, so a new page cannot arrive without one.

**Config.** Nothing to set: the gate reads the build directory, then `public`.

---

## Reading the report

- `fail` means the corpus should not ship. `warn` means a person should look. `skip` means the gate had nothing to work with (no build, no redirects file, offline).
- The terminal shows the first eight findings per gate. `.gates/gates-report.md` shows up to 200 per gate, `.gates/gates-report.json` shows all of them.
- Fix in order. Gates 01 to 03 are mechanical and take minutes. Gates 05 to 07 are where the corpus debt lives. Gates 13, 14 and 16 are usually one config change or one build step. Gate 15 is editorial work and the one that takes days.
