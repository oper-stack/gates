# Changelog

## 0.1.0 (2026-09-10)

First public release.

- Fifteen gates: characters, mdx-compile, frontmatter, structure, duplication, shared-sentences, hollow-sections, internal-links, link-semantics, meta, readability, images, redirects, ai-index, claims.
- One config file, every site-specific string configurable: currency signs, brand words, place names, filler and FAQ template patterns, boilerplate allow-list, image hosts, allowed claim sources, all thresholds.
- Zero-config mode: collections auto-detected from `src/content`.
- Terminal table, Markdown and JSON reports, CI-friendly exit codes.
- `--fix` for currency signs and pictographs.
- Fixture site "Isla Verde" with one deliberate defect per gate and a page that passes all fifteen; `npm test` checks 23 expectations.
