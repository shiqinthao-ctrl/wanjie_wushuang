import type { GameSave } from '../core/saveTypes';
import { CHAPTER_ID, CHAPTER_RULESET, chapterBonds, chapterCharms, chapterError, chapterHeroes, chapterRouteGroups, chapterStages, number, object, strings, text } from './catalog';
import type { ChapterHeroId } from './catalog';

interface Discovery { discovered: boolean; awakened: boolean; cleared: boolean; [key: string]: unknown }
export interface ChapterReport {
  runId: string; ruleset: typeof CHAPTER_RULESET; chapterId: string; stageId: string; heroId: string; seed: number;
  endReason: 'victory' | 'defeat' | 'timeout'; stars: number; time: number; level: number; kills: number;
  formId: string | null; awakened: boolean; routes: string[]; bonds: string[];
  damageBy: Record<string, number>; damageTakenBy: Record<string, number>;
  [key: string]: unknown;
}
export interface ChapterProgress {
  version: 1;
  chapters: Record<string, { stars: Record<string, number>; clears: Record<string, number>; [key: string]: unknown }>;
  discoveries: Record<string, Discovery>;
  charms: { unlocked: string[]; equipped: string | null; [key: string]: unknown };
  reports: ChapterReport[];
  [key: string]: unknown;
}
export function freshChapterProgress(): ChapterProgress {
  const empty = () => Object.fromEntries(chapterStages.map(stage => [stage.id, 0]));
  return { version: 1, chapters: { [CHAPTER_ID]: { stars: empty(), clears: empty() } }, discoveries: {},
    charms: { unlocked: chapterCharms.slice(0, 3), equipped: null }, reports: [] };
}
export function validateDamage(value: unknown, field: string): void {
  for (const [id, damage] of Object.entries(object(value, field))) { text(id, field); number(damage, field); }
}
function validateReport(value: unknown): void {
  const report = object(value, '战报');
  for (const field of ['runId', 'ruleset', 'chapterId', 'stageId', 'heroId']) text(report[field], `战报.${field}`);
  const stage = chapterStages.find(stage => stage.id === report.stageId);
  if (report.ruleset !== CHAPTER_RULESET || report.chapterId !== CHAPTER_ID || !stage ||
    !Object.hasOwn(chapterHeroes, String(report.heroId))) return chapterError('战报规则/章节/英雄');
  if (!['victory', 'defeat', 'timeout'].includes(String(report.endReason))) chapterError('战报结果');
  number(report.stars, '战报星级', 3, true); number(report.seed, '战报种子', 0xffffffff, true);
  number(report.time, '战报时间', stage.duration); number(report.level, '战报等级', 1000, true, 1); number(report.kills, '战报击杀', undefined, true);
  if (report.endReason !== 'victory' && report.stars !== 0) chapterError('失败星级');
  if (report.formId !== null) {
    text(report.formId, '战报形态');
    if (report.level < 3 || !(chapterHeroes[report.heroId as ChapterHeroId].forms as readonly string[]).includes(report.formId)) chapterError('战报形态归属');
  }
  if (typeof report.awakened !== 'boolean' || (report.awakened && (report.formId === null || report.level < 8))) chapterError('战报觉醒');
  strings(report.routes, '战报路线', 4); strings(report.bonds, '战报羁绊', 8);
  const routes = report.routes;
  if (routes.some(id => !(chapterRouteGroups.flat() as readonly string[]).includes(id)) ||
    chapterRouteGroups.some(group => routes.filter(id => (group as readonly string[]).includes(id)).length > 1)) chapterError('战报互斥路线');
  if (report.bonds.some(id => !(chapterBonds as readonly string[]).includes(id))) chapterError('战报羁绊');
  validateDamage(report.damageBy, '输出来源'); validateDamage(report.damageTakenBy, '受伤来源');
}
/** Imports may carry a future version unchanged. Only known v1 fields are validated. */
export function validateMobileChapter(value: unknown): void {
  const progress = object(value, 'mobileChapter'); number(progress.version, '版本', undefined, true, 1);
  if (progress.version > 1) return;
  const chapters = object(progress.chapters, '章节');
  for (const stage of chapterStages) {
    const chapter = object(chapters[CHAPTER_ID], CHAPTER_ID);
    number(object(chapter.stars, '星级')[stage.id], `${stage.id}.stars`, 3, true);
    number(object(chapter.clears, '通关')[stage.id], `${stage.id}.clears`, undefined, true);
  }
  for (const value of Object.values(object(progress.discoveries, '发现'))) {
    const discovery = object(value, '发现');
    for (const key of ['discovered', 'awakened', 'cleared']) if (typeof discovery[key] !== 'boolean') chapterError(`发现.${key}`);
    if ((discovery.awakened || discovery.cleared) && !discovery.discovered) chapterError('未发现的形态');
  }
  const charms = object(progress.charms, '护符'); strings(charms.unlocked, '护符解锁', 100);
  if (charms.equipped !== null) { text(charms.equipped, '装备护符'); if (!charms.unlocked.includes(charms.equipped)) chapterError('未解锁护符'); }
  if (!Array.isArray(progress.reports) || progress.reports.length > 20) return chapterError('战报上限');
  const ids = new Set<string>();
  for (const report of progress.reports) {
    validateReport(report); const id = String(report.runId);
    if (ids.has(id)) chapterError('重复战报'); ids.add(id);
  }
}
export function readChapterProgress(save: GameSave): ChapterProgress {
  if (!Object.hasOwn(save, 'mobileChapter')) return freshChapterProgress();
  validateMobileChapter(save.mobileChapter);
  if (object(save.mobileChapter, 'mobileChapter').version !== 1) throw new Error('精品首章存档版本较新，请升级游戏后继续。');
  return structuredClone(save.mobileChapter) as ChapterProgress;
}
