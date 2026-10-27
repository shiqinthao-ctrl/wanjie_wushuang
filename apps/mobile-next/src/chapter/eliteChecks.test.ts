import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { GameCore } from '../core/GameCore';
import { CombatSimulation } from '../core/CombatSimulation';
import { chapterStages } from './catalog';
import { prepareChapterRun } from './prepare';
import { createChapterProgression } from './growth';
import { validateChapterFinal } from './settlement';
import type { ChapterFinalRun } from './settlement';

/**
 * R3-E01..07c: "two elites", the thing `CH001-03`'s `eliteChecks: 2` never said.
 *
 * The decision (D26) is **two scripted two-affix elites at two fixed times**, counted by the
 * stage rather than by the director. Three things have to hold and each has its own describe:
 *
 *   - spawnable  - `eliteAt` puts exactly one `checked` elite on the field per entry, with two
 *                  affixes, and the cursor is monotonic so walking away cannot dodge a check;
 *   - observable - `eliteCheckState()` is what `renderState()` publishes and what `GameCore`
 *                  snapshots, so the renderer's number is the asserted number;
 *   - countable  - `checkedElites` moves only for scripted elites; the 150 s wave and the
 *                  director's random rolls move `eliteKills` and must not move this one.
 *
 * The run is built through `CombatSimulation` rather than `GameCore` because the mechanic lives
 * one layer below the objective: `GameCore` would also advance the arena, and the schedule is not
 * a question about survival. (`CH001-03` was shut when this file was written - D27 opened it once
 * `stage.boss.id` became a lookup - so the layer choice is also the one that did not change.)
 */
const FRAME = 1 / 60;
const SEAL = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-02', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
const FIRST = { ...SEAL, stageId: 'CH001-01' } as const;
const stage = chapterStages[2]!;
const at = stage.eliteAt as readonly number[];
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
/** Filled by the tests, read by the report - every number in the file was measured here. */
const MEASURED: Record<string, unknown> = {};

/** A legal preparation with only the row swapped, so hero/slots/ruleset stay what ships. */
function altar() {
  const base = prepareChapterRun(fresh, SEAL);
  return { ...base, stageId: 'CH001-03' as const, stage: structuredClone(stage) };
}
function simOfAltar() {
  const preparation = altar();
  const sim = new CombatSimulation(fresh, createChapterProgression(preparation, () => .8), () => .8, [], Date.now, preparation);
  // A probe body: no damage output, no attack speed, so nothing dies unless a test says so.
  sim.player.atk = 0; sim.player.aspd = 0; sim.player.hp = 1e9; sim.player.maxHp = 1e9;
  return sim;
}
/** One production frame, in the order `GameCore.advance` uses. */
const step = (sim: CombatSimulation) => { sim.beginFrame(FRAME); sim.finishBaseFrame(FRAME); };
/** One full-circle sweep. `arc` is the production damage path, so the kill counter is the real one. */
const sweep = (sim: CombatSimulation) => sim.arc(9999, 1e9, 'TEST', Math.PI * 2);
const checked = (sim: CombatSimulation) => sim.enemies.filter(enemy => enemy.checked);

describe('the count and the schedule cannot drift apart', () => {
  it('keeps eliteChecks equal to the number of scheduled times, in order, before the Boss', () => {
    for (const row of chapterStages) {
      const times = row.eliteAt as readonly number[];
      expect(row.eliteChecks, row.id).toBe(times.length);
      for (let index = 1; index < times.length; index++) expect(times[index]!, `${row.id} #${index}`).toBeGreaterThan(times[index - 1]!);
      for (const time of times) {
        expect(time, row.id).toBeGreaterThan(0);
        expect(time, row.id).toBeLessThan(row.duration);
        // A check that arrives after the Boss cannot gate it.
        if (row.boss) expect(time, row.id).toBeLessThan(row.boss.spawnAt);
      }
    }
    // The one stage that has checks is the one that declares two, and it is the only one.
    expect(chapterStages.filter(row => row.eliteChecks > 0).map(row => row.id)).toEqual(['CH001-03']);
    expect(at).toEqual([120, 300]);
  });
});

describe('spawnable: one scripted elite per scheduled time, and no way to dodge it', () => {
  it('puts nothing on the field before the first time and one two-affix elite at it', () => {
    const sim = simOfAltar();
    sim.time = at[0]! - 1;
    step(sim);
    expect(checked(sim)).toHaveLength(0);
    sim.time = at[0]!;
    step(sim);
    const first = checked(sim);
    expect(first).toHaveLength(1);
    expect(first[0]!.elite).toBe(true);
    // Two affixes, not one: the clock-based second affix needs time > 960 and this stage is 480 s,
    // so a two-affix elite can only exist because the stage asked for one.
    expect(first[0]!.affixes).toHaveLength(2);
    expect(sim.eliteCheckState()).toEqual({ required: 2, defeated: 0, at: [120, 300] });
    MEASURED.firstCheck = { at: at[0], affixes: first[0]!.affixes, hp: Math.round(first[0]!.hp), radius: first[0]!.r };
  });
  it('catches up rather than skipping when a whole interval is jumped over', () => {
    // The cursor is monotonic on purpose: a check the player was nowhere near still arrives, so
    // "run to the Boss and ignore the elites" is not a strategy the schedule allows.
    const sim = simOfAltar();
    sim.time = 300;
    step(sim);
    expect(checked(sim)).toHaveLength(2);
    expect(sim.eliteCheckState().defeated).toBe(0);
    MEASURED.jump = { spawned: checked(sim).length, defeated: sim.eliteCheckState().defeated };
  });
  it('does not re-spawn on later frames', () => {
    const sim = simOfAltar();
    sim.time = 300;
    step(sim);
    const first = checked(sim).length;
    for (let frame = 0; frame < 5; frame++) { sim.time = 300 + frame * FRAME; step(sim); }
    expect(checked(sim).length).toBe(first);
    expect(first).toBe(2);
  });
});

describe('countable: only the scripted ones count', () => {
  it('moves checkedElites for a scripted elite and leaves eliteKills to the horde', () => {
    const sim = simOfAltar();
    sim.time = 120;
    step(sim);
    expect(checked(sim)).toHaveLength(1);
    sweep(sim);
    expect(sim.checkedElites).toBe(1);
    expect(sim.eliteKills).toBe(1);
    sim.time = 300;
    step(sim);
    expect(checked(sim)).toHaveLength(1);
    sweep(sim);
    expect(sim.checkedElites).toBe(2);
    MEASURED.afterBoth = { checkedElites: sim.checkedElites, eliteKills: sim.eliteKills };
  });
  it('does not count the 150 s wave elite, which is an elite but not a check', () => {
    // `finishBaseFrame` reads `waveAt(this.time)` for every run, chapter or not, so every chapter
    // stage inherits the first stage's 150 s `type: 'elite'` wave. It is a real elite - it just is
    // not one of the two a stage scheduled, and the two counters must not be the same number.
    // Measured on `CH001-01`, whose schedule is empty, so nothing can be a scripted check.
    const first = prepareChapterRun(fresh, FIRST);
    const plain = new CombatSimulation(fresh, createChapterProgression(first, () => .8), () => .8, [], Date.now, first);
    plain.player.atk = 0; plain.player.aspd = 0; plain.player.hp = 1e9; plain.player.maxHp = 1e9;
    plain.time = 150;
    step(plain);
    const waveElites = plain.enemies.filter(enemy => enemy.elite && !enemy.checked);
    expect(waveElites.length).toBeGreaterThanOrEqual(1);
    expect(waveElites.every(enemy => enemy.affixes.length === 1)).toBe(true);
    sweep(plain);
    expect(plain.eliteKills).toBeGreaterThanOrEqual(1);
    expect(plain.checkedElites).toBe(0);
    MEASURED.waveElite = { eliteKills: plain.eliteKills, checkedElites: plain.checkedElites, waveAffixes: waveElites.map(enemy => enemy.affixes.length) };
  });
  it('never marks an elite on a stage with no schedule', () => {
    const first = prepareChapterRun(fresh, FIRST);
    const plain = new CombatSimulation(fresh, createChapterProgression(first, () => .8), () => .8, [], Date.now, first);
    plain.time = 150;
    step(plain);
    expect(plain.enemies.every(enemy => enemy.checked === undefined)).toBe(true);
    expect(plain.eliteCheckState()).toEqual({ required: 0, defeated: 0, at: [] });
  });
});

describe('observable: the renderer reads the asserted field', () => {
  it('publishes one object from eliteCheckState and renderState', () => {
    const sim = simOfAltar();
    sim.time = 120;
    step(sim);
    const state = sim.eliteCheckState();
    expect(sim.renderState().eliteChecks).toEqual(state);
    expect(state.required).toBe(2);
    expect(state.defeated).toBe(0);
    sweep(sim);
    expect(sim.renderState().eliteChecks.defeated).toBe(1);
    // Two readings of the same object at two times: `before` is the pre-kill snapshot the UI
    // would have painted, `after` is what `renderState()` publishes on the next frame.
    MEASURED.readability = { before: state, after: sim.renderState().eliteChecks };
  });
  it('carries the same object through GameCore.snapshot on a stage that is open', () => {
    // `CH001-03` is shut, so the UI path is proved on `CH001-02` - the point here is that
    // `snapshot()` forwards the field at all, not that the numbers are non-zero.
    const run = new GameCore(fresh, () => .8, 'classic', SEAL); run.start();
    const sim = (run as unknown as { combat: CombatSimulation }).combat;
    expect(run.snapshot().eliteChecks).toEqual(sim.eliteCheckState());
    expect(run.snapshot().eliteChecks).toEqual({ required: 0, defeated: 0, at: [] });
    run.destroy();
  });
});

describe('the Boss is gated by the checks, not merely annotated by them', () => {
  it('does not field the Boss while a check is outstanding, and fields it once both are done', () => {
    // `spawn()` is the only door: it reads `bossAt()`, which returns `undefined` while a check is
    // outstanding. Driving it directly keeps the assertion about the gate and not about when the
    // frame loop happens to call it (`updateObjective` is the caller in a real run).
    const sim = simOfAltar();
    sim.time = stage.boss!.spawnAt;
    expect(sim.bossEncounter.spawn()).toBe(false);
    expect(sim.bossEncounter.active).toBeUndefined();
    expect(sim.bossEncounter.snapshot().phase).toBe('advance');
    sim.time = 120; step(sim); sweep(sim);
    sim.time = 300; step(sim); sweep(sim);
    expect(sim.checkedElites).toBe(2);
    sim.time = stage.boss!.spawnAt;
    expect(sim.bossEncounter.spawn()).toBe(true);
    expect(sim.bossEncounter.active).toBeDefined();
    MEASURED.gate = { spawnAt: stage.boss!.spawnAt, spawnBefore: false, spawnAfter: true, bossAfter: sim.bossEncounter.active?.id };
  });
});

describe('settlement: the half that is reachable today', () => {
  const final = (change: Partial<ChapterFinalRun> = {}): ChapterFinalRun => ({
    ...FIRST, endReason: 'victory', time: 300, hp: 200, maxHp: 620, level: 8, kills: 150,
    formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire'],
    damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: true, bossLootClaimed: true,
    sealsHeld: 0, elitesChecked: 0, ...change,
  });
  it('admits 0 on a stage with no checks and refuses a claimed check it never scheduled', () => {
    // This is the strong form. "0 is accepted" alone would be vacuous - a stage with
    // `eliteChecks: 0` also accepts 0 if the validator ignores the field entirely. The assertion
    // that can fail is the ceiling: a report cannot claim a check the stage never scheduled.
    const first = prepareChapterRun(fresh, FIRST);
    expect(() => validateChapterFinal(first, final())).not.toThrow();
    expect(() => validateChapterFinal(first, final({ elitesChecked: 1 }))).toThrow();
    MEASURED.settlement = { ceilingOnFirstStage: 0, claimedOne: 'rejected' };
  });
  it('requires both checks for a victory on the stage that has them', () => {
    // D26 recorded this half as **unreachable**: `validateChapterFinal` begins with
    // `validateChapterOptions`, which is the `OPEN_STAGES` policy, and `CH001-03` was closed. D27
    // opened it, so the branch that was shipped untested is asserted here - the same report is
    // refused at one check and accepted at two.
    const altar = prepareChapterRun(fresh, { ...SEAL, stageId: 'CH001-03' });
    const report = (change: Partial<ChapterFinalRun> = {}): ChapterFinalRun => ({
      ...SEAL, stageId: 'CH001-03', endReason: 'victory', time: 400, hp: 200, maxHp: 620, level: 20, kills: 600,
      formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire'],
      damageBy: { A003: 1000 }, damageTakenBy: { CH001_ALTAR: 420 }, bossDefeated: true, bossLootClaimed: true,
      sealsHeld: 0, elitesChecked: 2, ...change,
    });
    expect(() => validateChapterFinal(altar, report())).not.toThrow();
    expect(() => validateChapterFinal(altar, report({ elitesChecked: 1 }))).toThrow('胜利目标');
    expect(() => validateChapterFinal(altar, report({ elitesChecked: 3 }))).toThrow('精英检验');
    MEASURED.requirement = { stage: 'CH001-03', at: 2, one: 'rejected', three: 'rejected as a ceiling' };
  });
});

describe('report', () => {
  it('writes what was measured', () => {
    const directory = resolve(EVIDENCE_ROOT, 'R3-E');
    mkdirSync(directory, { recursive: true });
    writeFileSync(resolve(directory, 'elite-report.json'), `${JSON.stringify({
      slice: 'R3-E01..07c',
      decision: 'two scripted two-affix elites at eliteAt, counted by checkedElites',
      stage: { id: stage.id, duration: stage.duration, eliteChecks: stage.eliteChecks, eliteAt: at, bossSpawnAt: stage.boss?.spawnAt ?? null },
      measured: MEASURED,
    }, null, 2)}\n`);
    expect(Object.keys(MEASURED).length).toBeGreaterThan(0);
  });
});
