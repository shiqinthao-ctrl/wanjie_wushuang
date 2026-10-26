import type { GameSave } from '../core/saveTypes';
import { CHAPTER_ID, CHAPTER_RULESET, chapterError, chapterHeroes, chapterStages, freeze, number, object } from './catalog';
import type { ChapterHeroId, ChapterStageId } from './catalog';
import { readChapterProgress } from './progress';

/**
 * Which stages may be entered. The type `ChapterStageId` describes the data (three rows); this
 * list is the *policy*, and it is one visible line instead of a narrowed literal type. `CH001-03`
 * stays shut because its two elites are still undefined (`R3-E01..07c`) and `CH001_ALTAR` has no
 * Boss config - opening it would trade a clear error for a stage that cannot be finished.
 */
const OPEN_STAGES: readonly ChapterStageId[] = ['CH001-01', 'CH001-02'];

export interface ChapterRunOptions {
  ruleset: typeof CHAPTER_RULESET; chapterId: typeof CHAPTER_ID; stageId: ChapterStageId;
  heroId: ChapterHeroId; mode: 'story'; difficulty: 'normal'; seed: number;
}
export function validateChapterOptions(value: unknown): asserts value is ChapterRunOptions {
  const options = object(value, '出战配置');
  if (options.ruleset !== CHAPTER_RULESET || options.chapterId !== CHAPTER_ID) chapterError('规则版本/章节');
  if (typeof options.stageId !== 'string' || !OPEN_STAGES.includes(options.stageId as ChapterStageId)) throw new Error('此精品关卡尚未开放。');
  if (typeof options.heroId !== 'string' || !Object.hasOwn(chapterHeroes, options.heroId)) chapterError('初始英雄');
  if (options.mode !== 'story' || options.difficulty !== 'normal') chapterError('模式/难度');
  number(options.seed, '随机种子', 0xffffffff, true);
}
export function prepareChapterRun(save: GameSave, options: unknown) {
  validateChapterOptions(options);
  const progress = readChapterProgress(save);
  if (progress.charms.equipped !== null) throw new Error('战备护符效果尚未接入，请保留存档，等待对应版本。');
  const hero = chapterHeroes[options.heroId];
  // Never call legacy calculateStartup: even an empty rune list has a legacy bonus.
  return freeze({ ruleset: options.ruleset, chapterId: options.chapterId, stageId: options.stageId,
    heroId: options.heroId, mode: options.mode, difficulty: options.difficulty, seed: options.seed,
    // Indexed by id, not by position: cloning `chapterStages[0]` was the second lock on the door.
    stage: structuredClone(chapterStages.find(stage => stage.id === options.stageId)!),
    player: { hp: hero.hp, maxHp: hero.hp, atk: hero.atk, speed: hero.speed, aspd: hero.aspd, crit: hero.crit },
    skills: { [hero.skill]: 1 }, passives: {} as Record<string, number>, slots: { auto: 4, passive: 4 },
  });
}
export type ChapterPreparation = ReturnType<typeof prepareChapterRun>;
