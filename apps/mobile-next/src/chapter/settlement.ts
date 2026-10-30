import type { GameSave } from '../core/saveTypes';
import { parseSchema30 } from '../storage/schema30';
import { CHAPTER_ID, chapterBonds, chapterError, chapterHeroes, chapterRouteGroups, chapterStars, freeze, number, strings, text } from './catalog';
import type { SealRule } from './catalog';
import { validateChapterOptions } from './prepare';
import type { ChapterPreparation, ChapterRunOptions } from './prepare';
import { earnedCharms } from './challenges';
import { readChapterProgress, validateDamage } from './progress';
import type { ChapterReport } from './progress';

export interface ChapterFinalRun extends ChapterRunOptions {
  endReason: 'victory' | 'defeat' | 'timeout'; time: number; hp: number; maxHp: number; level: number; kills: number;
  formId: string | null; awakened: boolean; coreSkillLevel: number; routes: string[]; bonds: string[];
  damageBy: Record<string, number>; damageTakenBy: Record<string, number>;
  bossDefeated: boolean; bossLootClaimed: boolean;
  /** How many of this stage's seals were held when the run ended. 0 on a stage with no seals. */
  sealsHeld: number;
  /**
   * How many of this stage's *scripted* elites (`stage.eliteAt`) were killed. 0 on a stage with
   * no checks. Not `eliteKills`: the 150 s wave and the director's random rolls are elites too,
   * and the stage's requirement is about the two it scheduled.
   */
  elitesChecked: number;
}
export function validateChapterFinal(preparation: ChapterPreparation, run: ChapterFinalRun): void {
  validateChapterOptions(run);
  for (const key of ['ruleset', 'chapterId', 'stageId', 'heroId', 'mode', 'difficulty', 'seed'] as const) {
    if (run[key] !== preparation[key]) chapterError(`本局配置.${key}`);
  }
  number(run.time, '时间', preparation.stage.duration); number(run.maxHp, '最大生命', undefined, false, 1);
  number(run.hp, '生命', run.maxHp); number(run.level, '等级', 1000, true, 1); number(run.kills, '击杀', undefined, true);
  number(run.coreSkillLevel, '核心等级', 5, true);
  if (run.formId !== null && !(chapterHeroes[run.heroId].forms as readonly string[]).includes(run.formId)) chapterError('形态归属');
  if (typeof run.awakened !== 'boolean' || (run.awakened && (!run.formId || run.level < 8 || run.coreSkillLevel < 3))) chapterError('觉醒条件');
  if (run.formId !== null && run.level < 3) chapterError('进化条件');
  strings(run.routes, '路线', 4); strings(run.bonds, '羁绊', 8);
  if (run.routes.some(id => !(chapterRouteGroups.flat() as readonly string[]).includes(id)) ||
    chapterRouteGroups.some(group => run.routes.filter(id => (group as readonly string[]).includes(id)).length > 1)) chapterError('互斥路线');
  if (run.bonds.some(id => !(chapterBonds as readonly string[]).includes(id))) chapterError('羁绊');
  validateDamage(run.damageBy, '输出'); validateDamage(run.damageTakenBy, '受伤');
  const stage = preparation.stage, seals = stage.seals as readonly SealRule[];
  if (typeof run.bossDefeated !== 'boolean' || typeof run.bossLootClaimed !== 'boolean' ||
    (run.bossLootClaimed && !run.bossDefeated) ||
    // A stage with no Boss can neither field one nor beat one - and reading `.spawnAt` off `null`
    // is what made `CH001-02` unconstructible rather than merely unopenable.
    (run.bossDefeated && (!stage.boss || run.time < stage.boss.spawnAt))) chapterError('首领/战利品');
  number(run.sealsHeld, '界碑', seals.length, true);
  // The ceiling is the requirement itself: a stage with no checks admits only 0, so a forged
  // report cannot claim to have cleared elites the stage never scheduled.
  number(run.elitesChecked, '精英检验', stage.eliteChecks, true);
  // The objective belongs to the stage, not to the run: a seal stage is won by holding seals and
  // a Boss stage by beating the Boss. One field each, no third way to win.
  const completed = (seals.length ? run.sealsHeld === seals.length : run.bossDefeated && run.bossLootClaimed) &&
    run.elitesChecked >= stage.eliteChecks;
  if (run.endReason === 'victory') {
    if (run.hp <= 0 || !completed) chapterError('胜利目标');
    // The last seal cannot be held before it has opened and been held for its dwell.
    if (seals.length && run.time < Math.max(...seals.map(seal => seal.opensAt + seal.dwell))) chapterError('界碑时限');
  }
  else if (run.endReason === 'defeat') { if (run.hp !== 0) chapterError('生命耗尽'); }
  else if (run.endReason === 'timeout') {
    if (run.hp <= 0 || run.time !== preparation.stage.duration || run.bossDefeated) chapterError('超时目标/战利品优先');
  } else chapterError('结束原因');
}
/**
 * D31: how many stars a settled run is worth, 0..3.
 *
 * The same arithmetic the legacy path has used since before the chapter existed
 * (`core/settlement.ts:40`: `victory ? hp/maxHp > masteryHp ? 3 : 2 : 0`), read off
 * `chapterStars` instead of a literal. Chapter-line settlement used to write `victory ? 1 : 0`,
 * which left the `stars` slot at one third of the range the validator and `schema30` both admit
 * (`number(..., 3, true)` / `integer(star, ..., 0, 3)`) - a three-star field that could only ever
 * hold a boolean.
 *
 * What this deliberately does **not** do: it pays nothing. The legacy path also adds gold,
 * mastery and account XP on the same line (`stars * 100` among them); that is the shape of the
 * "permanent numeric crushing" the queue forbids, and none of it is copied here. A star is a
 * record of a run, not a claim on the next one - `challenges.test.ts` asserts that by replaying a
 * save with `stars` at 0 and at 3 through `prepareChapterRun` and requiring identical bytes.
 */
export function starsFor(run: { endReason: 'victory' | 'defeat' | 'timeout'; hp: number; maxHp: number }): number {
  if (run.endReason !== 'victory') return 0;
  return run.hp / run.maxHp > chapterStars.masteryHp ? chapterStars.mastery : chapterStars.clear;
}
/** Pure reducer. Persist this result and its receipt through the repository adapter. */
export function settleChapterRun(source: GameSave, preparation: ChapterPreparation, run: ChapterFinalRun, runId: string) {
  text(runId, '本局编号'); validateChapterFinal(preparation, run);
  const save = parseSchema30(JSON.stringify(source)), progress = readChapterProgress(save);
  if (progress.reports.some(report => report.runId === runId)) chapterError('本局已有战报，请读取结算凭证');
  const victory = run.endReason === 'victory', stars = starsFor(run);
  const chapter = progress.chapters[CHAPTER_ID]!;
  if (victory) {
    chapter.stars[run.stageId] = Math.max(chapter.stars[run.stageId]!, stars);
    chapter.clears[run.stageId] = chapter.clears[run.stageId]! + 1;
  }
  if (run.formId) {
    const previous = progress.discoveries[run.formId];
    progress.discoveries[run.formId] = { ...previous, discovered: true, awakened: !!previous?.awakened || run.awakened, cleared: !!previous?.cleared || victory };
  }
  // D31: the three earnable charms come from the challenge table, not from three magic indexes.
  const unlockedCharms = earnedCharms(progress, run);
  progress.charms.unlocked.push(...unlockedCharms);
  // D38: the run record carries the tier. Without it a `nightmare` loss and a `normal` loss are the
  // same row, and the report page (D29) would be describing a game the player did not play. The
  // tier comes from the *preparation*, not from a default here - `validateChapterFinal` has already
  // required `run.difficulty === preparation.difficulty`, so the two cannot disagree.
  const report: ChapterReport = { runId, ruleset: run.ruleset, chapterId: run.chapterId, stageId: run.stageId, heroId: run.heroId, seed: run.seed,
    difficulty: preparation.difficulty,
    endReason: run.endReason, stars, time: run.time, level: run.level, kills: run.kills, formId: run.formId, awakened: run.awakened,
    routes: [...run.routes], bonds: [...run.bonds], damageBy: { ...run.damageBy }, damageTakenBy: { ...run.damageTakenBy } };
  progress.reports.unshift(report); progress.reports = progress.reports.slice(0, 20);
  save.mobileChapter = progress;
  return { save: parseSchema30(JSON.stringify(save)), result: freeze({ report: structuredClone(report), stars, unlockedCharms }) };
}
export type ChapterResult = ReturnType<typeof settleChapterRun>['result'];
