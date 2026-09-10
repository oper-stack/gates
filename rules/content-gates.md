# Content gates: rules for the editor and the model

Use this file as a Cursor rule (`.cursor/rules/content-gates.mdc`, alwaysApply for content folders) or as a section of `CLAUDE.md`. It states what every page must satisfy before `npx gates` is run, so the gates confirm rather than discover.

## Characters

- Spell currencies as codes: `1,200 THB`, `450,000 USD`, never a sign in tables or prose unless the style guide keeps `$`, `€`, `£`.
- No emoji or pictographs in body copy, headings, tables or FAQ. Check marks (✓ ✗) are allowed in comparison tables.
- No em or en dashes. Use a comma, a colon, parentheses, or "to" in ranges (`2,400 to 2,600`).

## Frontmatter

- Every page carries the fields the collection requires (title, description, pubDate, updatedDate, author, tags by default).
- Title 40 to 60 characters, ends on a content word, one year at most, a format word ("guide", "review") at most once. Drop the brand suffix before shortening the promise.
- Description 70 to 160 characters, a complete sentence, no ellipsis, no ending on a stop word.
- Hero images only on the project's own image hosts. Never Unsplash.
- `relatedSlugs` only point at pages that exist and are indexable.

## Structure of a commercial page

- Open with an answer-first block: two or three sentences carrying the number the reader came for.
- At least four H2 sections, each with real body text. Never leave a heading with nothing under it, and never open a section by restating the heading.
- At least one table, at least six table rows across the page. A cell never holds only a comma.
- The FAQ count the collection requires. Each answer is specific to the question; no templated answers.
- Pros and cons, a risks or checklist block, and scenarios or a decision framework.
- Numeric facts: at least three per 500 words.
- At most 35 bold spans. Bold marks the one number or term the reader must not miss.
- At least five internal links, every internal link with a trailing slash.
- No H1 in the body. Heading levels never skip (H2 to H4).
- No draft markers: `[VERIFY]`, `TODO`, `source needed`, knowledge-base references.
- No AI filler: moreover, furthermore, in conclusion, it is important to note, delve into, unlock the potential, a testament to, "not just X but Y".
- Numbered steps start at 1.

## Uniqueness

- A paragraph belongs to one page. If two pages need the same explanation, one page explains and the other links to it.
- Never generate a paragraph from a template and swap the numbers. Write the sentence from the fact.
- One sentence may not appear on three pages. Disclaimers and method notes that must repeat go into the `boilerplate` list of the gates config, and nowhere else.

## Links

- The anchor says where the link goes. An anchor that names a place links to that place. An anchor that is an entity name links to the entity's own page.
- No "#3 on our list" in anchors. No self links. One URL at most twice per page.

## Readability

- Sentences under 45 words. Paragraphs under 170 words.
- No "Scenario A / Scenario B / Scenario C / Scenario D" blocks. Name the scenarios by who they are for.

## Figures

- Every yield, ROI, occupancy, nightly rate, income per period or appreciation figure names its source in the same paragraph, or is framed as a worked example with stated assumptions.
- Never invent a figure to fill a table.

## Redirects and the agent index

- A redirected page has no source file, or its source is `noindex: true`.
- Redirects point at the final target. No chains, no cycles.
- `llms.txt` is generated from the corpus in the build, never edited by hand.

## Before opening a pull request

```
npm run build && npx gates --fail-on warn
```

A failing gate is a finding, not an opinion. Fix the page, do not edit the threshold.
