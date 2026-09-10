# GitHub repository

**Repository name:** operstack/gates

**Description (350 chars):** Fifteen automated quality gates for MDX content sites: characters, compile, frontmatter, structure, duplication, shared sentences, hollow sections, internal links, link semantics, meta, readability, images, redirects, llms.txt, unsourced claims. One config, one command, CI-ready.

**Topics:** seo, aeo, geo, astro, mdx, content-quality, programmatic-seo, llms-txt, site-audit, static-site, cli

**Social preview text:** 15 gates. 1 command. 13 seconds on 1,660 pages.

**Release note for v0.1.0:** copy CHANGELOG.md.

---

# Show HN

**Title:** Show HN: Fifteen quality gates for MDX content sites (finds copied paragraphs with swapped numbers)

**Text:**

I publish to eleven content sites from one pipeline. Over two years the same defects kept shipping past the build: titles cut on a stop word, an H2 with nothing under it, one paragraph on 121 pages with different numbers, llms.txt advertising pages that redirect, yield figures nobody sourced.

This package is the fifteen checks I ended up writing, with every site-specific string moved into one JSON config. It runs on 1,660 MDX files in about 13 seconds. The interesting parts are gate 05 (paragraph comparison with digits masked, which is how templated content gets caught), gate 08 (every href in the built HTML resolved against the build and the redirects file) and gate 15 (figures without a named source or example framing in the same paragraph).

MIT. `npx @operstack/gates`. There is a fictional fixture site in the repo so you can see every gate fire before pointing it at your own content.

What I would like to know: which thresholds are wrong for your corpus, and which check you have that I do not.

---

# X thread

1/ Your content site has defects the build log will never show you. I wrote 15 checks to catch them. Free, one command. Thread.

2/ The one that hurt most: 121 pages sharing one paragraph with the numbers swapped. Exact-match dedupe never saw it. Google's spam policy has a name for it. Gate 05 masks the digits before comparing.

3/ Builds that fail on file 1,214 after 11 minutes: gate 02 compiles every MDX file up front and lists every failure with the line.

4/ llms.txt was generated once. A month later four pages had been merged away and were still advertised. Gate 14 compares the index with the corpus on every run.

5/ "7.5% net yield" on 70 pages, no source. Gate 15 flags any yield, occupancy, nightly rate or income figure with no source or example framing in the same paragraph.

6/ 1,660 files, 1,760 built pages, 13 seconds. MIT. `npx @operstack/gates`. Ships with a fictional demo site so every gate fires on first run.

7/ The package includes a rules file for Cursor and Claude Code. Tell the model what the gate will reject and it stops producing it.

---

# LinkedIn post

I run a pipeline that publishes to eleven content sites. For two years the same defects shipped past the build log: cut titles, empty sections, one paragraph on 121 pages with the numbers swapped, an AI index advertising pages that no longer existed.

I turned the checks that caught them into a free tool. Fifteen gates, one config file, one command. It runs on 1,660 pages in 13 seconds and tells you what must not ship.

It is open source under MIT. If you generate content at scale, with or without a model, run it before your next deploy: npx @operstack/gates

The thresholds are in one JSON file. I would rather hear which ones are wrong for your corpus than defend them.

---

# Reddit (r/SEO, r/TechSEO, r/astrojs, r/webdev)

**Title:** I open-sourced the 15 checks that catch what my content pipeline kept shipping (copied paragraphs with swapped numbers, stale llms.txt, cut titles)

**Body:** Short version of the Show HN text, no marketing tone, end with the question about thresholds. Post in r/astrojs with the Astro angle (content collections auto-detected), in r/TechSEO with the gate 05 and gate 14 angle.

---

# Dev.to / Hashnode article outline

**Title:** Fifteen gates: what I check before a content site ships, and why each one exists

1. The seven silent failures (one paragraph each, with the real anonymised story).
2. Why exact-match dedupe is not enough (gate 05, digits masked; gate 06, sentence level).
3. The AI index drifts (gate 14) and redirects rot (gate 13).
4. Unsourced figures are a trust problem before they are a ranking problem (gate 15).
5. How the config works, the zero-config mode, CI snippet.
6. The rules file: telling the model before the gate tells you.
7. What I would change: thresholds, and the sixteenth gate.
