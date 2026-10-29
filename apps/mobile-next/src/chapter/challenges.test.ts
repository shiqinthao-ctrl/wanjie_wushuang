import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { parseSchema30 } from '../storage/schema30';
import { chapterCharms, chapterStars } from './catalog';
import { challengeIds, challengeRow, challengeViews, chapterChallenges, earnedCharms } from './challenges';
import type { ChallengeFacts } from './challenges';
import { charmRow } from './charms';
import { prepareChapterRun } from './prepare';
import { freshChapterProgress, readChapterProgress } from './progress';
import { settleChapterRun, starsFor } from './settlement';
import type { ChapterFinalRun } from './settlement';

/**
 * R3-P04 - three challenges and the star that is not a stat. Scope 0 (D31) answered the four
 * questions with commands:
 *
 * 1. `chapters.stars` and `chapters.clears` had **zero** production readers. The writer is
 *    `settlement.ts`, the validator touches them, and `contracts.test.ts` reads them - that is all.
 * 2. Replaying a stage granted no permanent numeric gain, and the line that made that true is
 *    `prepare.ts:43`: the player's stats come from the `chapterHeroes` table, never from progress.
 *    An absence with no owner is a coincidence, so this file pins it as a strong claim below.
 * 3. No new save field was needed. The three earnable charms were already stored in
 *    `charms.unlocked`; what was missing was a table saying *what* earns them.
 * 4. The GDD promised a three-star rating (P1-3). The `stars` slot already admitted `0..3` in both
 *    `progress.ts` and `schema30.ts` - the writer just wrote `victory ? 1 : 0` into it.
 */
const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 42 } as const;
const save = () => parseSchema30(JSON.stringify(fresh));
const final = (change: Partial<ChapterFinalRun> = {}): ChapterFinalRun => ({
  ...options, endReason: 'victory', time: 310, hp: 200, maxHp: 620, level: 8, kills: 150,
  formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire', 'shadowfire'],
  damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: true, bossLootClaimed: true,
  sealsHeld: 0, elitesChecked: 0, ...change,
});
const settle = (source = save(), run = final(), id = 'run-1') => settleChapterRun(source, prepareChapterRun(source, options), run, id);
/** A run that meets nothing: no win, no awakening, no bonds. */
const bare = () => final({ endReason: 'defeat', hp: 0, time: 128, awakened: false, bonds: [],
  bossDefeated: false, bossLootClaimed: false, formId: null, coreSkillLevel: 0, routes: [] });

describe('the three rows', () => {
  it('has three rows with unique ids and unique rewards', () => {
    expect(chapterChallenges).toHaveLength(3);
    expect(new Set(challengeIds).size).toBe(3);
    expect(new Set(chapterChallenges.map(row => row.reward)).size).toBe(3);
  });
  it('pays a charm and never a starting charm', () => {
    // The starting kit is `chapterCharms.slice(0, 3)` in `freshChapterProgress`. A challenge that
    // paid one of those would pay nothing - the player already has it - and it would look fine.
    const starting = new Set<string>(chapterCharms.slice(0, 3));
    for (const row of chapterChallenges) {
      expect(chapterCharms as readonly string[]).toContain(row.reward);
      expect(starting.has(row.reward)).toBe(false);
      // The payout is a real effect: a charm with `factor: 1` would be a reward that does nothing.
      expect(charmRow(row.reward).factor).not.toBe(1);
    }
  });
  it('every reward is one of the three charms the old magic indexes paid', () => {
    // Regression against the line this replaced:
    //   [victory ? chapterCharms[3] : null, run.awakened ? chapterCharms[4] : null,
    //    run.bonds.length >= 2 ? chapterCharms[5] : null]
    expect(chapterChallenges.map(row => row.reward)).toEqual(['MC_SURVIVAL', 'MC_CYCLE', 'MC_MOVE']);
  });
  it('reads only the three facts it declares, and nothing else', () => {
    // A predicate that quietly read `time` or `stars` would be a challenge that changes meaning
    // when a stage is retuned. The proxy names every property touched, so a new field is visible.
    const touched = new Set<string>();
    const probe = new Proxy<ChallengeFacts>({ endReason: 'victory', awakened: true, bonds: ['a', 'b'] }, {
      get(target, key, receiver) { if (typeof key === 'string') touched.add(key); return Reflect.get(target, key, receiver); },
    });
    for (const row of chapterChallenges) row.met(probe);
    expect([...touched].sort()).toEqual(['awakened', 'bonds', 'endReason']);
  });
  it.each([
    ['clear', { endReason: 'victory' as const, awakened: false, bonds: [] }, true],
    ['clear', { endReason: 'defeat' as const, awakened: false, bonds: [] }, false],
    ['awakened', { endReason: 'victory' as const, awakened: true, bonds: [] }, true],
    ['awakened', { endReason: 'victory' as const, awakened: false, bonds: [] }, false],
    ['bonds', { endReason: 'victory' as const, awakened: false, bonds: ['a', 'b'] }, true],
    ['bonds', { endReason: 'victory' as const, awakened: false, bonds: ['a'] }, false],
    // The threshold is two, not "some": one bond is a bond, and it does not pay.
    ['bonds', { endReason: 'timeout' as const, awakened: false, bonds: ['a', 'b', 'c'] }, true],
  ])('%s on %j is %s', (id, facts, expected) => {
    expect(challengeRow(id).met(facts)).toBe(expected);
  });
  it('refuses an id it cannot name instead of rendering a blank row', () => {
    expect(() => challengeRow('nope')).toThrow(/nope/);
  });
});

describe('who gets paid, and how often', () => {
  it('pays nothing for a run that meets nothing', () => {
    const settledBare = settle(save(), bare());
    expect(settledBare.result.unlockedCharms).toEqual([]);
    expect(readChapterProgress(settledBare.save).charms.unlocked).toHaveLength(3);
  });
  it('pays each met row exactly once, even across many runs', () => {
    const first = settle(save());
    expect(first.result.unlockedCharms).toEqual(['MC_SURVIVAL', 'MC_CYCLE', 'MC_MOVE']);
    const progress = readChapterProgress(first.save);
    expect(progress.charms.unlocked).toHaveLength(6);
    // The same three conditions again: nothing left to pay, and the list does not grow.
    const again = settle(first.save, final(), 'run-2');
    expect(again.result.unlockedCharms).toEqual([]);
    expect(readChapterProgress(again.save).charms.unlocked).toHaveLength(6);
  });
  it('does not re-pay a charm the save already owns', () => {
    const source = save(), progress = freshChapterProgress();
    progress.charms.unlocked.push('MC_SURVIVAL');
    source.mobileChapter = progress;
    expect(earnedCharms(readChapterProgress(source), final())).toEqual(['MC_CYCLE', 'MC_MOVE']);
  });
  it('tells the page which rows are already paid', () => {
    const paid = challengeViews(readChapterProgress(settle(save()).save));
    expect(paid.map(row => row.paid)).toEqual([true, true, true]);
    const fresh_ = challengeViews(readChapterProgress(save()));
    expect(fresh_.map(row => row.paid)).toEqual([false, false, false]);
  });
});

describe('the star is a record, not a claim on the next run', () => {
  it('is 0 for a loss, 2 for a win, 3 above the mastery threshold', () => {
    expect(starsFor({ endReason: 'defeat', hp: 0, maxHp: 620 })).toBe(0);
    expect(starsFor({ endReason: 'timeout', hp: 620, maxHp: 620 })).toBe(0);
    expect(starsFor({ endReason: 'victory', hp: 200, maxHp: 620 })).toBe(chapterStars.clear);
    expect(starsFor({ endReason: 'victory', hp: 620, maxHp: 620 })).toBe(chapterStars.mastery);
  });
  it('treats exactly the threshold as a clear, not a mastery', () => {
    // `>` and not `>=`, copied from `core/settlement.ts:40` rather than re-decided here: 0.55 of 620
    // is 341, and a run that ends on the line has not beaten it.
    expect(starsFor({ endReason: 'victory', hp: 341, maxHp: 620 })).toBe(chapterStars.clear);
    expect(starsFor({ endReason: 'victory', hp: 342, maxHp: 620 })).toBe(chapterStars.mastery);
  });
  it('writes the star into the save and into the report, and never lowers the best', () => {
    const three = settle(save(), final({ hp: 620 }), 'run-3');
    expect(three.result.stars).toBe(3);
    expect(three.result.report.stars).toBe(3);
    const two = settle(three.save, final(), 'run-2');
    expect(two.result.stars).toBe(2);
    expect(two.result.report.stars).toBe(2);
    // The best score survives a worse run: `Math.max` on a field that is now a range, not a flag.
    expect(readChapterProgress(two.save).chapters.CH001!.stars['CH001-01']).toBe(3);
  });
});

describe('no permanent numeric crushing', () => {
  it('prepares the same run whatever the star and clear counts say', () => {
    // The strong form of "replaying grants nothing". A save with three stars on every stage and 999
    // clears prepares byte-identically to a fresh one - so if anyone ever wires `clears` into a stat,
    // this goes red. (`toEqual` on a frozen object compares values, which is what "byte-identical"
    // means for a preparation: there are no functions in it.)
    const zero = save(), maxed = save();
    const progress = freshChapterProgress();
    zero.mobileChapter = progress;
    maxed.mobileChapter = {
      ...structuredClone(progress),
      chapters: { CH001: {
        stars: { 'CH001-01': 3, 'CH001-02': 3, 'CH001-03': 3 },
        clears: { 'CH001-01': 999, 'CH001-02': 999, 'CH001-03': 999 },
      } },
    };
    for (const stageId of ['CH001-01', 'CH001-02', 'CH001-03'] as const) {
      expect(prepareChapterRun(maxed, { ...options, stageId })).toEqual(prepareChapterRun(zero, { ...options, stageId }));
    }
  });
  it('pays a charm and leaves gold, mastery, level and account xp untouched', () => {
    const source = save();
    source.gold = 7; source.accountXp = 11; source.accountLv = 3;
    source.heroes.H001!.mastery = 13; source.heroes.H001!.level = 9;
    const { save: after, result } = settle(source);
    expect(result.unlockedCharms).toHaveLength(3);
    expect(after.gold).toBe(7);
    expect(after.accountXp).toBe(11);
    expect(after.accountLv).toBe(3);
    expect(after.heroes.H001!.mastery).toBe(13);
    expect(after.heroes.H001!.level).toBe(9);
  });
  it('does not add a second progress field: the state is `charms.unlocked`', () => {
    // TASK's out-of-scope list forbids a second progress field. The three paid rows are read back
    // from the charm list the save already had, so `readChapterProgress(...)` has no `challenges` key.
    const progress = readChapterProgress(settle(save()).save) as unknown as Record<string, unknown>;
    expect(progress).not.toHaveProperty('challenges');
    expect(Object.keys(progress).sort()).toEqual(['chapters', 'charms', 'discoveries', 'reports', 'version']);
  });
});

describe('reachable from the lobby', () => {
  it('has a union member, an import, a lobby button and a branch in App.vue', () => {
    const app = readFileSync(resolve(process.cwd(), 'src/App.vue'), 'utf8');
    expect(app).toMatch(/page = ref<[^>]*'challenges'/);
    expect(app).toMatch(/import ChallengesPanel from '\.\/ui\/ChallengesPanel\.vue';/);
    expect(app).toMatch(/@click="page = 'challenges'"/);
    expect(app).toMatch(/<ChallengesPanel v-else-if="page === 'challenges'/);
  });
});
