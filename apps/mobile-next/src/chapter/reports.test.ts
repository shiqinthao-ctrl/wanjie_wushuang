import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { parseSchema30 } from '../storage/schema30';
import { prepareChapterRun } from './prepare';
import { readChapterProgress } from './progress';
import { settleChapterRun } from './settlement';
import type { ChapterFinalRun } from './settlement';
import { REPORT_CAP, RATE_MIN_RUNS, clock, reportRows } from './reports';

/**
 * R3-P02 - the run record. Scope 0 (D29) measured the storage before this page existed:
 *
 * - `progress.reports` had exactly one reader (a `runId` de-dupe) and no renderer at all;
 * - the twenty-run cap is enforced **twice** with different semantics - the writer truncates
 *   silently, the validator refuses the whole save - so `<= 20` is safe and `=== 20` is not;
 * - `stars` was written as `victory ? 1 : 0` while the validator admits `0..3`. D31 filled the range
 *   (2 for a win, 3 above 55% hp), so this file now pins `{0, 2, 3}` - and still pins that the row
 *   carries a *count*, because a three-slot layout assumes a value is reachable;
 * - `sealsHeld` / `elitesChecked` reach the final run and are **dropped** at the report boundary,
 *   which is asserted here so that widening the report later is a deliberate act.
 */
const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 42 } as const;
const save = () => parseSchema30(JSON.stringify(fresh));
const final = (change: Partial<ChapterFinalRun> = {}): ChapterFinalRun => ({
  ...options, endReason: 'victory', time: 310, hp: 200, maxHp: 620, level: 8, kills: 150,
  formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire', 'shadowfire'],
  damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: true, bossLootClaimed: true,
  sealsHeld: 0, elitesChecked: 0, ...change,
});
const optionsOf = (run: ChapterFinalRun) => ({
  ruleset: run.ruleset, chapterId: run.chapterId, stageId: run.stageId, heroId: run.heroId,
  mode: run.mode, difficulty: run.difficulty, seed: run.seed,
});
/** Settles the runs in order, so the last one handed in is the newest row. */
function settled(runs: readonly ChapterFinalRun[], source = save()) {
  return runs.reduce((acc, run, index) => {
    const prepared = prepareChapterRun(acc, optionsOf(run));
    return settleChapterRun(acc, prepared, run, `run-${index + 1}`).save;
  }, source);
}
const defeat = final({ endReason: 'defeat', hp: 0, time: 128, bossDefeated: false, bossLootClaimed: false, awakened: false });
const timeout = final({ endReason: 'timeout', time: 360, bossDefeated: false, bossLootClaimed: false, awakened: false });

describe('one row per run, newest first, and a loss reads like a win', () => {
  it('puts the newest run first and gives each outcome its own word', () => {
    const reports = reportRows(settled([final(), defeat, timeout]));
    expect(reports.rows.map(row => row.runId)).toEqual(['run-3', 'run-2', 'run-1']);
    expect(reports.rows.map(row => row.outcome)).toEqual(['timeout', 'defeat', 'victory']);
    // The words come from the stage, not from a switch in the template - the same words the result
    // screen shows, so the list and the screen cannot disagree about what happened.
    expect(reports.rows.map(row => row.outcomeLabel)).toEqual(['破围超时', '本局生命耗尽', '破围成功']);
  });
  it('gives a loss exactly the fields a win has - the list is a record, not a trophy case', () => {
    const reports = reportRows(settled([final(), defeat]));
    const [lost, won] = [reports.rows[0]!, reports.rows[1]!];
    expect(Object.keys(lost).sort()).toEqual(Object.keys(won).sort());
    expect(lost.kills).toBe(150);
    expect(lost.level).toBe(8);
    // The loss carries its own clock - it is not a win row with the word swapped out.
    expect(lost.clock).toBe('02:08');
  });
  it('carries the nine fields the brief asks for, resolved to names', () => {
    const row = reportRows(settled([final()])).rows[0]!;
    expect(row.stageId).toBe('CH001-01'); expect(row.stageName).toBe('边境破围');
    expect(row.heroId).toBe('H001'); expect(row.heroName).toBe('赤焰战神');
    expect(row.formId).toBe('dragon'); expect(row.formName).toBe('赤龙武圣');
    expect(row.outcome).toBe('victory');
    expect(row.time).toBe(310); expect(row.clock).toBe('05:10');
    expect(row.level).toBe(8); expect(row.kills).toBe(150);
    expect(row.stars).toBe(2); expect(row.seed).toBe(42);
  });
  it('uses the stage own clear word, so the altar does not claim 破围成功', () => {
    // D27 gave each stage its own two words precisely so a shared template branch could not
    // mislabel a stage; this is the first list that would have shown the mistake.
    const altar = final({ stageId: 'CH001-03', time: 410, level: 20, kills: 620, awakened: true, elitesChecked: 2 });
    const row = reportRows(settled([altar])).rows[0]!;
    expect(row.stageName).toBe('祭坛决战');
    expect(row.outcomeLabel).toBe('祭坛告破');
  });
  it('says "no form" rather than rendering an empty cell', () => {
    const row = reportRows(settled([final({ formId: null, awakened: false, level: 5 })])).rows[0]!;
    expect(row.formId).toBeNull();
    expect(row.formName).toBeNull();
  });
});

describe('the cap, enforced twice with two different meanings', () => {
  it(`keeps the newest ${REPORT_CAP} and drops the oldest without a word`, () => {
    const runs = Array.from({ length: 21 }, (_, index) => final({ time: 300 + index, kills: 100 + index }));
    const reports = reportRows(settled(runs));
    expect(reports.rows).toHaveLength(REPORT_CAP);
    expect(reports.rows[0]!.runId).toBe('run-21');
    expect(reports.rows[REPORT_CAP - 1]!.runId).toBe('run-2');
    // The one that fell off is the oldest, not a random one.
    expect(reports.rows.some(row => row.runId === 'run-1')).toBe(false);
    expect(reports.summary.runs).toBe(REPORT_CAP);
  });
  it('refuses a twenty-first row on read instead of truncating it', () => {
    // The writer truncates; the validator does not. A save that somehow holds 21 rows is a save
    // the page cannot see at all, and saying so beats showing twenty of twenty-one.
    const source = settled(Array.from({ length: 20 }, (_, index) => final({ time: 300 + index })));
    const progress = readChapterProgress(source);
    expect(progress.reports).toHaveLength(REPORT_CAP);
    progress.reports.push({ ...progress.reports[0]!, runId: 'run-21' });
    source.mobileChapter = progress;
    expect(reportRows(source).progressError).toMatch(/战报上限/);
    expect(reportRows(source).rows).toEqual([]);
  });
});

describe('no percentage without a denominator', () => {
  it(`refuses a rate under ${RATE_MIN_RUNS} runs and says how many it wants`, () => {
    const reports = reportRows(settled([final(), final(), defeat, timeout]));
    expect(reports.summary.runs).toBe(4);
    expect(reports.summary.victory).toBe(2);
    expect(reports.summary.defeat).toBe(1);
    expect(reports.summary.timeout).toBe(1);
    expect(reports.summary.winRate).toBeNull();
    expect(reports.summary.rateNeeds).toBe(RATE_MIN_RUNS);
  });
  it('gives a rate at the threshold, and the denominator travels with it', () => {
    const reports = reportRows(settled([final(), final(), defeat, defeat, timeout]));
    expect(reports.summary.winRate).toBe(0.4);
    // The number the page prints beside the rate is the same one the rate was taken over.
    expect(reports.summary.winRate).toBeCloseTo(reports.summary.victory / reports.summary.runs, 10);
  });
  it('takes the median over victories only, so the clock cannot drag it', () => {
    // Two wins at 300 and 340, one timeout pinned to the 360 s limit. The median of all three
    // would be 340 - a win's number wearing the timeout's arrival, by coincidence rather than by
    // arithmetic. The victory median is 320, and the count says which runs it was taken over.
    const reports = reportRows(settled([final({ time: 300 }), final({ time: 340 }), timeout]));
    expect(reports.summary.victoryMedian).toBe(320);
    expect(reports.summary.victoryCount).toBe(2);
    expect(reports.summary.victoryCount).not.toBe(reports.summary.runs);
  });
  it('reports no median at all when nothing was won', () => {
    const reports = reportRows(settled([defeat, timeout]));
    expect(reports.summary.victoryMedian).toBeNull();
    expect(reports.summary.victoryCount).toBe(0);
  });
});

describe('the fields that are narrower than their declared range', () => {
  it('now spans the whole three-star range, and still reports a count rather than three slots', () => {
    // Before D31 the writer emitted `victory ? 1 : 0` into a field the validator admits `0..3`, so
    // the observed set was `{0, 1}` and three slots would have read "1/3" on every win. Both halves
    // are pinned: the range is reachable now, and the row is still a number.
    const full = final({ hp: 620 });
    const reports = reportRows(settled([full, final(), defeat]));
    const stars = reports.rows.map(row => row.stars);
    expect(stars).toEqual([0, 2, 3]);
    expect(new Set(stars)).toEqual(new Set([0, 2, 3]));
    expect(typeof reports.rows[0]!.stars).toBe('number');
  });
  it('carries no seal count and no elite count, because the report does not hold them', () => {
    // `sealsHeld` / `elitesChecked` exist on the final run and stop at the storage boundary (D29).
    // Asserted so that adding them later is a visible change, not a silent one.
    const seals = final({ stageId: 'CH001-02', endReason: 'victory', time: 300, hp: 200, level: 5,
      formId: null, awakened: false, coreSkillLevel: 0, bossDefeated: false, bossLootClaimed: false, sealsHeld: 3 });
    const row = reportRows(settled([seals])).rows[0]!;
    expect(row).not.toHaveProperty('sealsHeld');
    expect(row).not.toHaveProperty('elitesChecked');
    expect(row.outcomeLabel).toBe('镇界完成');
  });
  it('floors the clock instead of rounding it', () => {
    // `Math.round` would print 06:00 for 359.6 s - a clock that overstates how long you lasted.
    expect(clock(359.6)).toBe('05:59');
    expect(clock(360)).toBe('06:00');
    expect(clock(480)).toBe('08:00');
    expect(clock(410.25)).toBe('06:50');
    expect(clock(0)).toBe('00:00');
    expect(clock(-5)).toBe('00:00');
  });
});

describe('read-only, honest about absence, and reachable from the lobby', () => {
  it('does not touch the save it is handed', () => {
    const source = settled([final(), defeat]);
    const before = structuredClone(source);
    reportRows(source);
    expect(source).toEqual(before);
  });
  it('distinguishes "never played" from "cannot read the record"', () => {
    const empty = reportRows(save());
    expect(empty.progressError).toBeNull();
    expect(empty.rows).toEqual([]);
    expect(empty.summary.runs).toBe(0);
    expect(empty.summary.winRate).toBeNull();

    const future = save();
    future.mobileChapter = { version: 2 };
    const unreadable = reportRows(future);
    expect(unreadable.progressError).toBeTruthy();
    expect(unreadable.rows).toEqual([]);
  });
  it('is routed from the lobby: the union member and the button both exist', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
    expect(app).toMatch(/page = ref<[^>]*'reports'/);
    expect(app).toMatch(/import ReportsPanel from '\.\/ui\/ReportsPanel\.vue';/);
    expect(app).toMatch(/@click="page = 'reports'"/);
    expect(app).toMatch(/<ReportsPanel v-else-if="page === 'reports'/);
  });
});
