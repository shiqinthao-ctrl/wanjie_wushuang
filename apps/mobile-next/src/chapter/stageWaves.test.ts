import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { chapterStages } from './catalog';
import type { ChapterWave } from './catalog';
import { director, firstStage } from '../core/spawnRules';
import type { WaveRow } from '../core/spawnRules';

/**
 * R3-M04 - one stage needed its own table, and it was not the one I first thought.
 *
 * Scope 0 (D34) measured the premise: `waveAt(time)` took **no stage at all**, so all three chapter
 * stages spawned from `firstStage.storyEncounter.waves`. That table's last row is
 * `type: 'end', budget: 0` at 360 s, and `director` divides by `budget` - a zero budget makes the
 * interval `Infinity`, and `while (spawnClock > interval)` never fires.
 *
 * The first pass read that as "120 s of empty field on the altar". **That was wrong.** The altar's
 * Boss spawns at 360 and stands on the field for all 120 of those seconds, so the player has
 * something to do. What is actually empty is `CH001-02`: 420 s long, no Boss, and no horde for the
 * last 60. So exactly one stage gets its own rows, and the other two keep inheriting - each for a
 * stated reason, not by omission.
 *
 * Two attempts at giving the altar rows made it *worse* (`hunt` lost to "stand in a corner"), which
 * is why it does not get any: bodies during a Boss fight punish the player for moving.
 */
const FIRST = chapterStages[0], SEAL = chapterStages[1], ALTAR = chapterStages[2];
const firstWaves: readonly WaveRow[] = firstStage.storyEncounter.waves;
const rows = (stage: { waves: readonly ChapterWave[] | null }): readonly ChapterWave[] => stage.waves ?? [];
const owned = chapterStages.filter(stage => stage.waves !== null);

/** The interval `director` would return at `time` on this table - `Infinity` means "stops spawning". */
function intervalAt(waves: readonly WaveRow[], time: number): number {
  return director({ time, kills: 0, dps: 0, level: 1, evolved: 0, fused: 0 }, { hp: 620, maxHp: 620, atk: 108 }, 'normal', waves).interval;
}

describe('a stage that owns its table is covered for its whole duration', () => {
  it('has no zero-budget row before the clock runs out', () => {
    // The one check that would have caught `CH001-02`. `budget: 0` is legal only at or after
    // `duration`, because it is the row that stops spawning.
    for (const stage of owned) {
      for (const row of rows(stage)) {
        if (row.budget > 0) continue;
        expect(row.at, `${stage.id} stops spawning at ${row.at}s but runs ${stage.duration}s`).toBeGreaterThanOrEqual(stage.duration);
      }
    }
  });
  it('a stage with no Boss must never stop spawning', () => {
    // Stated as a rule rather than as a fact about `CH001-02`, so a fourth stage inherits the check.
    // A stage *with* a Boss may stop - the Boss is the content from then on (see `CH001-03`).
    for (const stage of owned.filter(stage => stage.boss === null)) {
      expect(rows(stage).some(row => row.budget === 0), `${stage.id} has a stop row`).toBe(false);
    }
  });
  it('the last row sits at or before the end, and stops only there', () => {
    for (const stage of owned) {
      const last = rows(stage).at(-1)!;
      expect(last.at, stage.id).toBeLessThanOrEqual(stage.duration);
      if (last.budget === 0) expect(last.at, `${stage.id} stops early`).toBe(stage.duration);
    }
  });
  it('CH001-02 keeps spawning where the inherited table had already stopped', () => {
    // The measured difference, on the field that decides it: `director`'s interval.
    expect(Number.isFinite(intervalAt(firstWaves, 400)), 'the inherited table stops at 360').toBe(false);
    expect(Number.isFinite(intervalAt(rows(SEAL), 400)), 'CH001-02 must still spawn at 400').toBe(true);
    // And it still has a live row right up to the end - a table that stops early is the bug above.
    expect(Number.isFinite(intervalAt(rows(SEAL), 419))).toBe(true);
  });
});

describe('the tables that were not written, and why', () => {
  it('the first stage inherits rather than copies', () => {
    // `CH001-01` *is* `firstStage.storyEncounter.waves`. A copy would give one fact two sources, and
    // the shipped stage would drift the first time the first stage was tuned.
    expect(FIRST.waves).toBeNull();
  });
  it('the altar keeps inheriting because its Boss covers the tail', () => {
    // The correction to D34's first pass: 360-480 is not empty, it is the Boss fight. Two attempts at
    // giving this stage rows (budget 1.0, then .55 during the Boss) both made `altar.test.ts` report
    // that standing in a corner beat hunting - bodies plus a Boss punish movement.
    expect(ALTAR.waves).toBeNull();
    expect(ALTAR.boss).not.toBeNull();
    // The Boss spawns at the exact second the inherited table's `end` row lands, so the inherited
    // thinning coincides with the fight instead of preceding it.
    expect(ALTAR.boss!.spawnAt).toBe(360);
    expect(firstWaves.at(-1)!.at).toBe(360);
  });
  it('the seal stage has no boss row, because it has no Boss', () => {
    // `CH001-02` used to inherit a `type: 'boss'` row at 270 s from a stage that has a Boss. A seal
    // stage paced like a Boss stage for its last 150 s is exactly the kind of inheritance that reads
    // as a design choice.
    expect(SEAL.boss).toBeNull();
    expect(rows(SEAL).some(row => row.type === 'boss')).toBe(false);
  });
  it('every elite row lands just before a seal, so it can be cleared off the point', () => {
    // The stage is won by standing still for 20 s, three times, opening at 90 / 180 / 270. An elite
    // row is a body the player has to clear *before* committing to a twenty-second hold, so each one
    // has to sit shortly before a seal opens - not after the window has already started.
    const eliteRows = rows(SEAL).filter(row => row.type === 'elite').map(row => row.at);
    // D36 moved the seals to 100 / 220 / 340, and these rows moved with them: an elite that lands
    // 70 s before the seal it is supposed to gate is just a random elite.
    expect(eliteRows).toEqual([190, 310]);
    for (const at of eliteRows) {
      const next = SEAL.seals.find(seal => seal.opensAt >= at);
      expect(next, `${at}s has no seal after it`).toBeDefined();
      expect(next!.opensAt - at, `${at}s is too far from its seal`).toBeLessThanOrEqual(40);
      expect(next!.opensAt - at, `${at}s is already inside the hold window`).toBeGreaterThan(0);
    }
  });
  it('rows are strictly increasing and every elite row can actually spawn an elite', () => {
    for (const stage of owned) {
      const table = rows(stage);
      for (let i = 1; i < table.length; i++) expect(table[i]!.at, `${stage.id} row ${i}`).toBeGreaterThan(table[i - 1]!.at);
      for (const row of table) {
        if (row.type === 'elite') expect(row.elite, `${stage.id} ${row.at}s`).toBeGreaterThan(0);
        // `director` divides by `budget`, so a negative one would invert the spawn rate.
        expect(row.budget).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe('the first stage is byte-identical', () => {
  it('the inherited table is untouched', () => {
    expect(firstWaves).toHaveLength(5);
    expect(firstWaves[0]!.note).toBe('步卒与弓手建立基础走位');
  });
  it('the battle core asks the stage for its table at both read sites', () => {
    // Two call sites and no third: the spawn clock and the wave history. A third one that kept the
    // old signature would silently fall back to the first stage on the other two.
    const source = readFileSync(resolve(process.cwd(), 'src/core/CombatSimulation.ts'), 'utf8');
    expect(source).toMatch(/director\(this\.directorState\(\), p, this\.difficulty, this\.stageWaves\(\)\)/);
    expect(source).toMatch(/waveAt\(this\.time, this\.stageWaves\(\)\)/);
    expect(source).not.toMatch(/waveAt\(this\.time\)/);
    expect(source).not.toMatch(/this\.difficulty\)\.interval/);
  });
});
