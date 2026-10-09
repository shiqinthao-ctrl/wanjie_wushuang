/**
 * The byte ledger, generated and verified by a command instead of by hand.
 *
 * Why this file exists: `evidence/R2-F-CAP/cap10-md5.txt` was a 248-line md5 list written once by
 * hand (`find -print0 | xargs -0 md5sum | sort -k2`). Its coverage claim - "the evidence tree" - was
 * never re-derived, so when later slices added eleven reports and changed one report's schema, the
 * ledger kept its old numbers and said nothing. A ledger that lists a subset of what it claims to
 * cover is worse than no ledger: it reads as proof of work nobody re-checked.
 *
 * What it does now:
 *   1. Enumerates **every** `*.json` under `evidence/` (minus `test-results/` and `.baseline/`)
 *      with one filesystem walk - the list is produced, never typed.
 *   2. Classifies each file as ROLLING (a harness in `apps/mobile-next/src/**` writes it on every
 *      run, so its hash legitimately moves) or FROZEN (no writer: a probe snapshot, a `.bak`, or a
 *      data file). The classification is derived by scanning the harness sources for
 *      `writeFileSync(resolve(<dir>, '<name>'))`, not by inspection.
 *   3. In `--write` mode, rewrites the ledger. In verify mode (default), re-hashes the tree and
 *      reports three counts that must each be zero: missing, extra, and (rolling-only) changed.
 *
 * The report's `slice` field names the slice that owns the question; the directory names the tree
 * the numbers were measured on. Neither is a coverage claim - this script is.
 *
 * Usage:
 *   node tasks/game-remediation/byte-ledger.mjs                 # verify against the ledger
 *   node tasks/game-remediation/byte-ledger.mjs --write         # regenerate the ledger
 *   node tasks/game-remediation/byte-ledger.mjs --coverage      # print the classification only
 *   node tasks/game-remediation/byte-ledger.mjs --json          # machine-readable summary
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, join, sep } from 'node:path';
import { createHash } from 'node:crypto';

const HERE = resolve(new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const REPO = resolve(HERE, '..', '..');
const EVIDENCE = join(HERE, 'evidence');
const LEDGER = join(EVIDENCE, 'R2-F-CAP', 'cap10-md5.txt');
const HARNESS_ROOT = join(REPO, 'apps', 'mobile-next', 'src');

const args = process.argv.slice(2);
const MODE = args.includes('--write') ? 'write' : args.includes('--coverage') ? 'coverage' : 'verify';
const AS_JSON = args.includes('--json');

// --- 1. One walk. The coverage list is produced, never hand-copied. -------------------------
const SKIP_DIRS = new Set(['test-results', '.baseline']);
function walk(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) {
      if (SKIP_DIRS.has(e.name)) continue;
      walk(p, acc);
    } else if (e.name.endsWith('.json')) {
      acc.push(p);
    }
  }
  return acc;
}
const slash = (p) => p.split(sep).join('/');
const tree = walk(EVIDENCE)
  .map((p) => slash(p.slice(EVIDENCE.length + 1)))
  .sort();

// --- 2. Derive the rolling set from the harness sources. -------------------------------------
// A writer looks like `writeFileSync(resolve(DIR, 'name.json')` where DIR is a const bound to an
// evidence directory, or `writeFileSync(resolve(spec.evidence, spec.report)` (formPressure's loop).
function harnessFiles(dir, acc = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) harnessFiles(p, acc);
    else if (/\.(test|spec)\.ts$/.test(e.name)) acc.push(p);
  }
  return acc;
}
const rolling = new Set();
const writerSites = [];
for (const f of harnessFiles(HARNESS_ROOT)) {
  const src = readFileSync(f, 'utf8');
  // const <CONST> = resolve(..., '<evidence-dir>');  ->  map const -> dir basename
  const dirConsts = new Map();
  for (const m of src.matchAll(/const\s+(\w+)\s*=\s*resolve\([^;]*?evidence[/\\]([^'"]+)['"]\s*\)/g)) {
    dirConsts.set(m[1], m[2]);
  }
  for (const line of src.split('\n')) {
    const w = line.match(/writeFileSync\(resolve\(([^,)]+?),\s*(?:'([^']+)'|([A-Za-z_$][\w$]*\.\w+))/);
    if (!w) continue;
    const dirArg = w[1].trim();
    let name = w[2];
    if (!name) name = '*(dynamic)*';
    const dir = dirConsts.get(dirArg) ?? null;
    writerSites.push({ file: slash(f.slice(REPO.length + 1)), dirArg, dir, name });
    if (name !== '*(dynamic)*') rolling.add(name);
  }
  // formPressure's table-driven loop: every `report: 'x.json'` is written via spec.evidence.
  const specLoop = /writeFileSync\(resolve\(spec\.evidence,\s*spec\.report\)/.test(src);
  if (specLoop) {
    for (const m of src.matchAll(/report:\s*'([^']+\.json)'/g)) rolling.add(m[1]);
    writerSites.push({ file: slash(f.slice(REPO.length + 1)), dirArg: 'spec.evidence', dir: '*(per-form)*', name: '*(spec.report loop)*' });
  }
}

// --- 3. Read the ledger and compare. ---------------------------------------------------------
function readLedger() {
  if (!existsSync(LEDGER)) return new Map();
  const out = new Map();
  for (const line of readFileSync(LEDGER, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    const m = line.match(/^([0-9a-f]{32})\s+\*(.+)$/);
    if (m) out.set(m[2].replace(/^\.\//, ''), m[1]);
  }
  return out;
}
const ledger = readLedger();
const md5 = (rel) => createHash('md5').update(readFileSync(join(EVIDENCE, rel))).digest('hex');

const missing = [];   // in the tree, absent from the ledger
const stale = [];      // in both, hash moved on a ROLLING file (legitimate) -> refresh
const moved = [];      // in both, hash moved on a FROZEN file (a finding)
const extra = [];      // in the ledger, absent from the tree
for (const rel of tree) {
  const now = md5(rel);
  const name = rel.split('/').pop();
  if (!ledger.has(rel)) {
    missing.push({ rel, rolling: rolling.has(name), md5: now });
  } else if (ledger.get(rel) !== now) {
    (rolling.has(name) ? stale : moved).push({ rel, was: ledger.get(rel), now });
  }
}
for (const rel of ledger.keys()) if (!tree.includes(rel)) extra.push(rel);

const summary = {
  tree: tree.length,
  ledger: ledger.size,
  rollingWriters: rolling.size,
  writerSites: writerSites.length,
  missing: missing.length,
  stale: stale.length,
  moved: moved.length,
  extra: extra.length,
};

if (AS_JSON) {
  console.log(JSON.stringify({ summary, missing, stale, moved, extra, rolling: [...rolling].sort() }, null, 2));
} else if (MODE === 'coverage') {
  console.log(`rolling reports (written by a harness on every run): ${rolling.size}`);
  for (const n of [...rolling].sort()) console.log(`  R ${n}`);
  console.log(`\nevidence tree: ${tree.length} json | ledger: ${ledger.size} lines`);
  console.log(`writer sites found: ${writerSites.length}`);
} else if (MODE === 'write') {
  const lines = tree.map((rel) => `${md5(rel)} *./${rel}`).join('\n') + '\n';
  writeFileSync(LEDGER, lines);
  console.log(`wrote ${tree.length} lines to ${slash(LEDGER.slice(REPO.length + 1))}`);
} else {
  console.log(`evidence tree = ${summary.tree} json | ledger = ${summary.ledger} lines | rolling writers = ${summary.rollingWriters}`);
  console.log(`missing ${summary.missing} | stale(rolling) ${summary.stale} | moved(frozen) ${summary.moved} | extra ${summary.extra}`);
  for (const m of missing) console.log(`  MISSING  ${m.rel}${m.rolling ? '  (rolling)' : ''}`);
  for (const m of stale) console.log(`  STALE    ${m.rel}  ${m.was} -> ${m.now}  (rolling: refresh)`);
  for (const m of moved) console.log(`  MOVED    ${m.rel}  ${m.was} -> ${m.now}  (FROZEN: finding)`);
  for (const m of extra) console.log(`  EXTRA    ${m}  (in ledger, not on disk)`);
  if (!summary.missing && !summary.stale && !summary.moved && !summary.extra) console.log('LEDGER OK');
}
// A missing file is a coverage hole (the failure this script exists to prevent), so it fails too.
process.exit(summary.missing || summary.extra || summary.moved ? 1 : 0);
