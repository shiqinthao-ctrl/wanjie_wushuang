import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/**
 * Probe residue, checked by a command instead of by memory.
 *
 * Three slices in a row shipped a scratch probe (`__probe_routes.test.ts`, and twice an inline
 * `describe('PROBE ...')` block inside `formPressure.test.ts`) and the full suite was then measured
 * on a tree that still contained it. The number that came back was always **one or two higher** than
 * the slice's own `it` count, and the only thing that ever caught it was a human noticing
 * "`+N` != the tests I wrote". A probe that survives costs a 28-minute rerun every time, and - worse
 * - it makes the reported total describe a tree nobody shipped.
 *
 * The failure mode is silent by construction: a leftover test file still passes. So this guard is
 * the one test whose job is to look at the tree rather than at the game:
 *
 *   1. No `*.test.ts` under `src/` may be named like a probe (`__probe*`, `*probe*`).
 *   2. No file under `src/` may carry the inline probe markers used by the ad-hoc blocks.
 *
 * The markers are assembled from pieces so that this file does not match itself; the self-skip below
 * is belt and braces for the same reason.
 */
const SRC = resolve(process.cwd(), 'src');
const SELF = 'treeHygiene.test.ts';
const MARKERS = ['TEMP' + ' PROBE', 'describe(' + "'" + 'PROBE'];
const slash = (p: string): string => p.split(sep).join('/');

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, acc);
    else acc.push(path);
  }
  return acc;
}

describe('tree hygiene', () => {
  it('carries no probe files and no probe markers', () => {
    const files = walk(SRC);
    const named = files.filter(path => /probe/i.test(relative(SRC, path))).map(path => slash(relative(SRC, path)));
    const marked: string[] = [];
    for (const path of files) {
      if (path.endsWith(SELF) || !/\.(ts|vue)$/.test(path)) continue;
      const text = readFileSync(path, 'utf8');
      if (MARKERS.some(marker => text.includes(marker))) marked.push(slash(relative(SRC, path)));
    }
    expect(named, 'probe file left in the tree - delete it before measuring the suite').toEqual([]);
    expect(marked, 'inline probe block left in the tree - delete it before measuring the suite').toEqual([]);
  });
});
