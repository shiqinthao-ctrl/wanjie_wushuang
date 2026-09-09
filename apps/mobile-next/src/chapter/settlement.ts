import type { GameSave } from '../core/saveTypes';
import { parseSchema30 } from '../storage/schema30';
import { CHAPTER_ID, chapterBonds, chapterCharms, chapterError, chapterHeroes, chapterRouteGroups, freeze, number, strings, text } from './catalog';
import { validateChapterOptions } from './prepare';
import type { ChapterPreparation, ChapterRunOptions } from './prepare';
import { readChapterProgress, validateDamage } from './progress';
import type { ChapterReport } from './progress';

export interface ChapterFinalRun extends ChapterRunOptions {
  endReason: 'victory' | 'defeat' | 'timeout'; time: number; hp: number; maxHp: number; level: number; kills: number;
  formId: string | null; awakened: boolean; coreSkillLevel: number; routes: string[]; bonds: string[];
  damageBy: Record<string, number>; damageTakenBy: Record<string, number>;
  bossDefeated: boolean; bossLootClaimed: boolean;
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
  if (typeof run.bossDefeated !== 'boolean' || typeof run.bossLootClaimed !== 'boolean' ||
    (run.bossLootClaimed && !run.bossDefeated) || (run.bossDefeated && run.time < preparation.stage.boss.spawnAt)) chapterError('首领/战利品');
  const completed = run.bossDefeated && run.bossLootClaimed;
  if (run.endReason === 'victory') { if (run.hp <= 0 || !completed) chapterError('胜利目标'); }
  else if (run.endReason === 'defeat') { if (run.hp !== 0) chapterError('生命耗尽'); }
  else if (run.endReason === 'timeout') {
    if (run.hp <= 0 || run.time !== preparation.stage.duration || run.bossDefeated) chapterError('超时目标/战利品优先');
  } else chapterError('结束原因');
}
/** Pure reducer. Persist this result and its receipt through the repository adapter. */
export function settleChapterRun(source: GameSave, preparation: ChapterPreparation, run: ChapterFinalRun, runId: string) {
  text(runId, '本局编号'); validateChapterFinal(preparation, run);
  const save = parseSchema30(JSON.stringify(source)), progress = readChapterProgress(save);
  if (progress.reports.some(report => report.runId === runId)) chapterError('本局已有战报，请读取结算凭证');
  const victory = run.endReason === 'victory', stars = victory ? 1 : 0;
  const chapter = progress.chapters[CHAPTER_ID]!;
  if (victory) {
    chapter.stars[run.stageId] = Math.max(chapter.stars[run.stageId]!, stars);
    chapter.clears[run.stageId] = chapter.clears[run.stageId]! + 1;
  }
  if (run.formId) {
    const previous = progress.discoveries[run.formId];
    progress.discoveries[run.formId] = { ...previous, discovered: true, awakened: !!previous?.awakened || run.awakened, cleared: !!previous?.cleared || victory };
  }
  const earned = [victory ? chapterCharms[3] : null, run.awakened ? chapterCharms[4] : null, run.bonds.length >= 2 ? chapterCharms[5] : null].filter((id): id is NonNullable<typeof id> => id !== null);
  const unlockedCharms = earned.filter(id => !progress.charms.unlocked.includes(id));
  progress.charms.unlocked.push(...unlockedCharms);
  const report: ChapterReport = { runId, ruleset: run.ruleset, chapterId: run.chapterId, stageId: run.stageId, heroId: run.heroId, seed: run.seed,
    endReason: run.endReason, stars, time: run.time, level: run.level, kills: run.kills, formId: run.formId, awakened: run.awakened,
    routes: [...run.routes], bonds: [...run.bonds], damageBy: { ...run.damageBy }, damageTakenBy: { ...run.damageTakenBy } };
  progress.reports.unshift(report); progress.reports = progress.reports.slice(0, 20);
  save.mobileChapter = progress;
  return { save: parseSchema30(JSON.stringify(save)), result: freeze({ report: structuredClone(report), stars, unlockedCharms }) };
}
export type ChapterResult = ReturnType<typeof settleChapterRun>['result'];
