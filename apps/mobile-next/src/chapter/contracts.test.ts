import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { parseSchema30 } from '../storage/schema30';
import { chapterStages } from './catalog';
import { prepareChapterRun } from './prepare';
import { freshChapterProgress, readChapterProgress } from './progress';
import { settleChapterRun } from './settlement';
import type { ChapterFinalRun } from './settlement';

const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 42 } as const;
const save = () => parseSchema30(JSON.stringify(fresh));
const final = (change: Partial<ChapterFinalRun> = {}): ChapterFinalRun => ({
  ...options, endReason: 'victory', time: 310, hp: 200, maxHp: 620, level: 8, kills: 150,
  formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire', 'shadowfire'],
  damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: true, bossLootClaimed: true, ...change,
});
const settle = (source = save(), run = final(), id = 'run-1') => settleChapterRun(source, prepareChapterRun(source, options), run, id);

describe('chapter preparation and copy boundary', () => {
  it('reads a fresh independent zero-star chapter without writing legacy data', () => {
    const source = save(), before = structuredClone(source), progress = readChapterProgress(source);
    expect(source).toEqual(before); expect(source).not.toHaveProperty('mobileChapter');
    expect(progress.chapters.CH001!.stars).toEqual({ 'CH001-01': 0, 'CH001-02': 0, 'CH001-03': 0 });
    expect(progress.charms.unlocked).toHaveLength(3); expect(progress.reports).toEqual([]);
    progress.charms.unlocked.push('test'); expect(readChapterProgress(source).charms.unlocked).toHaveLength(3);
  });
  it.each(['H001', 'H010', 'H012'] as const)('ignores legacy growth, gear, unlocks and selected mode for %s', heroId => {
    const low = save(), high = save();
    low.heroes[heroId] = { unlocked: false, level: 1, mastery: 0, star: 1, awakened: false };
    high.heroes[heroId] = { unlocked: true, level: 30, mastery: 999999, star: 6, awakened: true };
    high.gold = 999999; high.talents = { T001: 999 }; high.runes = ['FUTURE']; high.pet = 'FUTURE';
    high.inventory.gearInstances.forEach(item => { item.score = 999999; item.affixes = [{ key: 'atkPct', value: 99 }]; });
    high.mode = 'endless'; high.selectedChapter = 'ST012'; high.hero = 'H019';
    const a = prepareChapterRun(low, { ...options, heroId }), b = prepareChapterRun(high, { ...options, heroId });
    expect(a).toEqual(b); expect(Object.keys(a.skills)).toHaveLength(1); expect(a.passives).toEqual({});
    expect(a.slots).toEqual({ auto: 4, passive: 4 }); expect(a.player.hp).toBe(a.player.maxHp);
    expect(Object.isFrozen(a.player)).toBe(true);
  });
  it('records all three stage objectives but keeps unimplemented stages unavailable', () => {
    expect(chapterStages.map(stage => stage.duration)).toEqual([360, 420, 480]);
    expect(chapterStages[0]!.boss?.spawnAt).toBe(270); expect(chapterStages[1]!.boss).toBeNull();
    expect(chapterStages[1]!.seals).toEqual([{ opensAt: 90, dwell: 20 }, { opensAt: 180, dwell: 20 }, { opensAt: 270, dwell: 20 }]);
    expect(chapterStages[2]!.boss?.spawnAt).toBe(360);
  });
  it.each([
    { ruleset: 'preview-g5' }, { chapterId: 'ST001' }, { stageId: 'ST001-01' },
    { heroId: 'H002' }, { mode: 'endless' }, { difficulty: 'hard' }, { seed: -1 },
    { seed: 1.5 }, { seed: 2 ** 32 }, { stageId: 'CH001-02' }, { stageId: 'CH001-03' },
  ])('rejects incompatible preparation %j', change => {
    expect(() => prepareChapterRun(save(), { ...options, ...change })).toThrow();
  });
  it('preserves unknown fields at every extension level across parsing and settlement', () => {
    const source = save(), progress = freshChapterProgress();
    progress.future = { untouched: [1, 2] }; progress.chapters.CH001!.future = { x: 1 };
    progress.charms.future = 'keep'; progress.discoveries.dragon = { discovered: true, awakened: false, cleared: false, future: 7 };
    source.mobileChapter = progress; source.futureSave = { x: true };
    const parsed = parseSchema30(JSON.stringify(source)), result = settle(parsed);
    expect(readChapterProgress(result.save)).toMatchObject({ future: { untouched: [1, 2] }, chapters: { CH001: { future: { x: 1 } } }, charms: { future: 'keep' }, discoveries: { dragon: { future: 7 } } });
    expect(result.save.futureSave).toEqual({ x: true }); expect(source.mobileChapter).toEqual(progress);
  });
  it('copies future extensions intact but refuses new chapter reads and writes', () => {
    const source = { ...fresh, mobileChapter: { version: 2, future: ['opaque', { x: 1 }] } };
    const parsed = parseSchema30(JSON.stringify(source)); expect(parsed).toEqual(source);
    expect(() => readChapterProgress(parsed)).toThrow(/版本/); expect(() => settle(parsed)).toThrow(/版本/);
  });
  it.each([
    { ruleset: 'preview-g5' }, { chapterId: 'ST001' }, { stageId: 'ST001-01' },
    { heroId: 'H002' }, { heroId: 'H010' }, { formId: 'unknown' },
    { level: 7 }, { level: 2, awakened: false }, { time: 361 },
    { routes: ['volley', 'nova'] }, { routes: ['unknown'] }, { bonds: ['unknown'] },
  ])('rejects inconsistent known-version imported reports %j', change => {
    const source = settle().save, progress = readChapterProgress(source);
    Object.assign(progress.reports[0]!, change); source.mobileChapter = progress;
    expect(() => parseSchema30(JSON.stringify(source))).toThrow();
  });
  it('preserves extra report fields and recognizes catalog stages beyond the current launch slice', () => {
    const source = settle().save, progress = readChapterProgress(source);
    Object.assign(progress.reports[0]!, { stageId: 'CH001-03', time: 470, futureDetail: { x: 1 } });
    source.mobileChapter = progress;
    expect(readChapterProgress(parseSchema30(JSON.stringify(source))).reports[0]).toMatchObject({
      stageId: 'CH001-03', time: 470, futureDetail: { x: 1 },
    });
  });
  it.each([null, {}, { version: 0 }, { version: 1 }, { ...freshChapterProgress(), reports: {} },
    { ...freshChapterProgress(), charms: { unlocked: [], equipped: 'MC_DODGE' } },
    { ...freshChapterProgress(), chapters: { CH001: { stars: { 'CH001-01': -1 }, clears: {} } } },
    { ...freshChapterProgress(), reports: Array(21).fill({}) },
  ])('rejects malformed known extension without silently replacing it: %j', mobileChapter => {
    expect(() => parseSchema30(JSON.stringify({ ...fresh, mobileChapter }))).toThrow();
  });
});

describe('independent first chapter settlement', () => {
  it('changes only mobileChapter, records provenance and actual unlocks', () => {
    const source = save(), before = structuredClone(source), { save: after, result } = settle(source);
    const { mobileChapter: _chapter, ...legacy } = after;
    expect(legacy).toEqual(source); expect(source).toEqual(before);
    expect(result.stars).toBe(1); expect(result.unlockedCharms).toHaveLength(3);
    const progress = readChapterProgress(after);
    expect(progress.chapters.CH001!.clears['CH001-01']).toBe(1);
    expect(progress.discoveries.dragon).toEqual({ discovered: true, awakened: true, cleared: true });
    expect(progress.reports[0]).toMatchObject({ runId: 'run-1', seed: 42, ruleset: 'chapter1-v1', formId: 'dragon', endReason: 'victory', damageTakenBy: { EN001: 420 } });
    expect(settle(after, final(), 'run-2').result.unlockedCharms).toEqual([]);
  });
  it('awards zero stars for defeat/timeout without erasing earned chapter stars', () => {
    const won = settle().save;
    for (const endReason of ['defeat', 'timeout'] as const) {
      const run = final({ endReason, hp: endReason === 'defeat' ? 0 : 1, time: 360, bossDefeated: false, bossLootClaimed: false, formId: null, awakened: false, coreSkillLevel: 0, routes: [], bonds: [] });
      expect(settle(save(), run).result.stars).toBe(0);
      const again = settle(won, run, endReason); expect(again.result.stars).toBe(0);
      expect(readChapterProgress(again.save).chapters.CH001!.stars['CH001-01']).toBe(1);
    }
  });
  it.each([
    { mode: 'endless' }, { heroId: 'H010' }, { seed: 43 }, { ruleset: 'preview-g5' },
    { stageId: 'ST001-01' }, { formId: 'void' }, { bossLootClaimed: false },
    { bossDefeated: false }, { time: 269 }, { hp: 0 }, { level: 7 }, { coreSkillLevel: 2 },
    { kills: -1 }, { damageBy: { bad: -1 } }, { bonds: ['wildfire', 'wildfire'] }, { routes: ['volley', 'nova'] },
    { endReason: 'timeout', time: 100 }, { formId: null },
  ])('rejects inconsistent final facts %j', change => {
    expect(() => settle(save(), final(change as Partial<ChapterFinalRun>))).toThrow();
  });
  it('keeps only the most recent 20 reports without losing discovery and clear totals', () => {
    let source = save();
    for (let i = 0; i < 25; i++) source = settle(source, final(), `run-${i}`).save;
    const progress = readChapterProgress(source);
    expect(progress.reports).toHaveLength(20); expect(progress.reports[0]!.runId).toBe('run-24');
    expect(progress.reports[19]!.runId).toBe('run-5'); expect(progress.chapters.CH001!.clears['CH001-01']).toBe(25);
    expect(progress.charms.unlocked).toHaveLength(6);
  });
});
