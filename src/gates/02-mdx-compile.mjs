/**
 * Gate 02, MDX compile. Compiles every file with the same parser the build uses and
 * reports exactly what the build would report, in seconds instead of minutes.
 * A double quote inside a double-quoted JSX string is the usual cause.
 */
import { result } from '../report.mjs';

export const id = 2;
export const name = 'mdx-compile';

const stripFrontmatter = (raw) =>
  raw.startsWith('---') ? raw.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, (m) => '\n'.repeat(m.split('\n').length - 1)) : raw;

export async function run({ corpus }) {
  let compile;
  try { ({ compile } = await import('@mdx-js/mdx')); }
  catch { return result(id, name, { status: 'skip', summary: '@mdx-js/mdx not installed' }); }
  const findings = [];
  for (const f of corpus) {
    try { await compile(stripFrontmatter(f.raw), { jsx: true }); }
    catch (err) {
      const start = (err.place && err.place.start) || err.place || null;
      const line = err.line || (start && start.line) || (err.cause && err.cause.loc && err.cause.loc.line);
      findings.push({ file: f.rel, line, message: (err.reason || err.message || 'compile error').split('\n')[0] });
    }
  }
  return result(id, name, {
    status: findings.length ? 'fail' : 'pass',
    summary: findings.length ? `${findings.length} file(s) will not compile` : `${corpus.length} file(s) compile`,
    findings, stats: { files: corpus.length, failing: findings.length },
  });
}
