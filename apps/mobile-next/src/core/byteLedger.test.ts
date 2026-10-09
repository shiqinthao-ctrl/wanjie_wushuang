import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { createHash } from 'node:crypto';

/**
 * The byte ledger, checked by a command instead of by hand.
 *
 * `evidence/R2-F-CAP/cap10-md5.txt` was a 248-line md5 list written once by hand
 * (`find -print0 | xargs -0 md5sum | sort -k2`). Its subtitle claimed "the evidence tree", but the
 * list was never re-derived, so when eleven later slices added reports and one grew a field, the
 * ledger kept its old numbers and its old length and said nothing. **A missing item does not fail;
 * it goes silent** - and a ledger that lists a subset of what it claims to cover is worse than no
 * ledger, because it reads as proof of work nobody re-checked.
 *
 * This test makes the coverage claim executable:
 *
 *   1. It walks `evidence/` itself. The list of files is **produced**, never typed.
 *   2. It reads the generator's classification from `tasks/game-remediation/byte-ledger.mjs` - no,
 *      better: it re-derives it here, so the test does not depend on the tool agreeing with itself.
 *      A file is ROLLING if a harness in this package writes it on every run (`writeFileSync` with
 *      that basename); otherwise it is FROZEN.
 *   3. It asserts the ledger names every file on disk, and that every hash matches - **with the one
 *      legitimate exception**: a rolling report may differ, because the ledger was snapshotted at a
 *      different moment than now. Those are reported, not asserted away.
 *
 * The report's `slice` field names the slice that owns the question; the directory names the tree
 * the numbers were measured on. Neither is a coverage claim. This test is.
 */
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const LEDGER = join(EVIDENCE_ROOT, 'R2-F-CAP', 'cap10-md5.txt');
const HARNESS_ROOT = resolve(process.cwd(), 'src');

const slash = (p: string): string => p.split(sep).join('/');

/** Every `*.json` under `evidence/`, minus the two directories the ledger excludes by definition. */
function walkEvidence(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'test-results' || entry.name === '.baseline') continue;
      walkEvidence(path, acc);
    } else if (entry.name.endsWith('.json')) {
      acc.push(slash(relative(EVIDENCE_ROOT, path)));
    }
  }
  return acc;
}

/** The basenames a harness writes on every run - derived from the sources, not from a list. */
function rollingReports(): Set<string> {
  const names = new Set<string>();
  const scan = (dir: string): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) { scan(path); continue; }
      if (!/\.(test|spec)\.ts$/.test(entry.name)) continue;
      const source = readFileSync(path, 'utf8');
      for (const match of source.matchAll(/writeFileSync\(resolve\([^,]+,\s*'([^']+\.json)'/g)) {
        names.add(match[1]!);
      }
      // `formPressure.test.ts` writes through a table: `writeFileSync(resolve(spec.evidence, spec.report))`.
      if (/writeFileSync\(resolve\(spec\.evidence,\s*spec\.report\)/.test(source)) {
        for (const match of source.matchAll(/report:\s*'([^']+\.json)'/g)) names.add(match[1]!);
      }
    }
  };
  scan(HARNESS_ROOT);
  return names;
}

const md5 = (rel: string): string =>
  createHash('md5').update(readFileSync(join(EVIDENCE_ROOT, rel))).digest('hex');

describe('R2-F-HORDE-LEDGER - the byte ledger covers the tree it claims to cover', () => {
  const tree = walkEvidence(EVIDENCE_ROOT).sort();
  const rolling = rollingReports();
  const ledger = new Map<string, string>(
    readFileSync(LEDGER, 'utf8')
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const match = line.match(/^([0-9a-f]{32})\s+\*(.+)$/);
        if (!match) throw new Error(`ledger line is not md5 + path: ${line}`);
        return [match[2]!.replace(/^\.\//, ''), match[1]!] as const;
      }),
  );

  it('names every report on disk - the failure mode is a hole, not a wrong number', () => {
    const uncovered = tree.filter((rel) => !ledger.has(rel));
    // When this fails it prints exactly which files the ledger forgot, so the fix is a command.
    expect(uncovered).toEqual([]);
  });

  it('lists nothing that is not on disk', () => {
    const phantom = [...ledger.keys()].filter((rel) => !tree.includes(rel));
    expect(phantom).toEqual([]);
  });

  it('classifies rolling reports from their writers, and the classification is not empty', () => {
    // If the scanner silently matched nothing, every file would look frozen and a rolling file
    // whose hash moved would read as a finding. Guard the guard.
    expect(rolling.size).toBeGreaterThanOrEqual(10);
    expect(rolling.has('manual-report.json')).toBe(true);
    expect(rolling.has('horde-report.json')).toBe(true);
  });

  it('matches every hash, and every mismatch is a ROLLING report (a refresh, not a finding)', () => {
    const drifted = tree
      .filter((rel) => ledger.has(rel))
      .map((rel) => ({ rel, was: ledger.get(rel)!, now: md5(rel) }))
      .filter(({ was, now }) => was !== now);

    // A frozen report whose bytes moved is a finding about a slice that changed it - fail loudly.
    const frozenDrift = drifted.filter(({ rel }) => !rolling.has(rel.split('/').pop()!));
    expect(frozenDrift).toEqual([]);

    // Rolling drift is expected between a snapshot and now; it is reported, not hidden.
    expect(drifted.length).toBeLessThanOrEqual(rolling.size);
  });

  it('the ledger is the size it claims to be - one line per report, no truncation', () => {
    expect(ledger.size).toBe(tree.length);
    expect(existsSync(LEDGER)).toBe(true);
  });
});
