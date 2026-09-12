# Changelog

## 0.2.3 (2026-09-12)

- Gate 01 no longer calls an ASCII diagram decoration. Pictographs are judged in body copy only: inside a fenced code block the same characters are content, and a decision tree drawn with box characters is a drawing, not an emoji. Currency signs and dashes are still checked everywhere, and `--fix` leaves fenced blocks alone too.

## 0.2.2 (2026-09-12)

- Gate 14 called every page missing when the AI index listed absolute URLs. The index is now compared on paths, and the site origin is derived from the index itself when `siteUrl` is unset.

## 0.2.1 (2026-09-11)

- Gate 08 treats server-rendered Astro routes as existing rather than broken.
- Gate 15 counts percent words, units and currency codes as figures that need a source.

## 0.2.0 (2026-09-11)

- Sixteenth gate: agent surface. Checks the agent card and the markdown renditions an assistant reads.

## 0.1.0 (2026-09-10)

First public release.

- Fifteen gates: characters, mdx-compile, frontmatter, structure, duplication, shared-sentences, hollow-sections, internal-links, link-semantics, meta, readability, images, redirects, ai-index, claims.
- One config file, every site-specific string configurable: currency signs, brand words, place names, filler and FAQ template patterns, boilerplate allow-list, image hosts, allowed claim sources, all thresholds.
- Zero-config mode: collections auto-detected from `src/content`.
- Terminal table, Markdown and JSON reports, CI-friendly exit codes.
- `--fix` for currency signs and pictographs.
- Fixture site "Isla Verde" with one deliberate defect per gate and a page that passes all fifteen; `npm test` checks 23 expectations.
