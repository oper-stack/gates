# Product Hunt listing

**Name:** OperStack Gates

**Tagline (60 chars max):** 15 quality gates for content sites, one command, free

**Description (260 chars max):**
Fifteen automated checks for MDX content sites: cut titles, copied paragraphs with swapped numbers, hollow sections, dead links, stale llms.txt, unsourced figures. One config file, 13 seconds on 1,660 pages. MIT, no account, npx and go.

**Topics:** SEO, Developer Tools, Open Source, Writing, Marketing

**First comment (maker):**

Hi everyone. I run a pipeline that publishes to eleven content sites, some of them past a thousand pages. Every one of these fifteen checks exists because that exact defect shipped at least once and the build log said nothing.

The one that hurt most: 121 pages sharing a closing paragraph with the numbers swapped. My duplicate checker compared exact strings, so it never saw it. Google's spam policy has a name for that pattern.

So the gates compare paragraphs with the digits masked. They also compile every MDX file up front (eleven-minute builds that fail on file 1,214 are not a workflow), check that llms.txt still matches the site, and flag any yield, occupancy or nightly-rate figure that has no source in the same paragraph.

It is free and MIT. `npx @operstack/gates` in any Astro or MDX project. The package ships with a fictional demo site so you can see every gate fire before you point it at your own corpus.

Happy to answer anything about the checks or the thresholds. The thresholds are all in one JSON file, and I would rather hear which ones are wrong than defend them.

**Gallery captions:**
1. The terminal table after one run on a 1,660-file corpus.
2. Gate 05: the same paragraph on two pages with the numbers swapped.
3. Gate 14: llms.txt advertising a page that redirects.
4. gates.config.json: every site-specific string in one place.
5. The rules file for Cursor and Claude Code, so the model stops producing what the gates reject.
