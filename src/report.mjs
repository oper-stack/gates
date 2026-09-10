/** Result helpers and terminal, markdown and JSON reporting. */
export function result(id, name, { status = 'pass', summary = '', findings = [], stats = {} } = {}) {
  return { id, name, status, summary, findings, stats };
}

export const STATUS_ORDER = { fail: 0, warn: 1, pass: 2, skip: 3 };
const ICON = { pass: 'OK  ', warn: 'WARN', fail: 'FAIL', skip: 'SKIP' };

export function printTerminal(results, { top = 8 } = {}) {
  console.log('');
  console.log('  OperStack Gates');
  console.log('  ' + '-'.repeat(72));
  for (const r of results) {
    console.log(`  ${ICON[r.status]}  ${String(r.id).padStart(2, '0')} ${r.name.padEnd(22)} ${r.summary}`);
  }
  console.log('  ' + '-'.repeat(72));
  const counts = { pass: 0, warn: 0, fail: 0, skip: 0 };
  for (const r of results) counts[r.status]++;
  console.log(`  pass ${counts.pass}  warn ${counts.warn}  fail ${counts.fail}  skip ${counts.skip}`);
  for (const r of results.filter((x) => x.status === 'fail' || x.status === 'warn')) {
    if (!r.findings.length) continue;
    console.log(`\n  ${String(r.id).padStart(2, '0')} ${r.name}: first ${Math.min(top, r.findings.length)} of ${r.findings.length}`);
    for (const f of r.findings.slice(0, top)) {
      const where = f.file ? `${f.file}${f.line ? ':' + f.line : ''}` : '';
      console.log(`     ${where ? where + '  ' : ''}${f.message}`);
    }
  }
  console.log('');
}

export function toMarkdown(results, meta) {
  const lines = [`# Gates report`, ``, `Site: ${meta.siteUrl || '(not set)'}  `, `Run: ${meta.generatedAt}  `, `Files: ${meta.files}`, ``, `| # | Gate | Status | Summary |`, `|---|---|---|---|`];
  for (const r of results) lines.push(`| ${r.id} | ${r.name} | ${r.status} | ${r.summary.replace(/\|/g, '\\|')} |`);
  for (const r of results.filter((x) => x.findings.length)) {
    lines.push(``, `## ${r.id}. ${r.name} (${r.findings.length})`, ``);
    for (const f of r.findings.slice(0, 200)) {
      lines.push(`- ${f.file ? `\`${f.file}${f.line ? ':' + f.line : ''}\` ` : ''}${f.message}`);
    }
    if (r.findings.length > 200) lines.push(`- ... ${r.findings.length - 200} more`);
  }
  return lines.join('\n') + '\n';
}
