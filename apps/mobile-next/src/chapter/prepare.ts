import type { GameSave } from '../core/saveTypes';
import { CHAPTER_ID, CHAPTER_RULESET, chapterError, chapterHeroes, chapterStages, freeze, number, object } from './catalog';
import { difficultyIds } from '../core/spawnRules';
import type { DifficultyId } from '../core/spawnRules';
import type { ChapterHeroId, ChapterStageId, SealRule } from './catalog';
import { readChapterProgress } from './progress';
import { equippedCharm } from './charms';
import type { EquippedCharm } from './charms';

/**
 * Which stages may be entered. The type `ChapterStageId` describes the data (three rows); this
 * list is the *policy*, and it is one visible line instead of a narrowed literal type.
 *
 * `CH001-03` is here because it can be finished: D27 made `stage.boss.id` a lookup (`CH001_ALTAR`
 * is a real row), and `altar.test.ts` plays the stage from the first frame to a settled victory.
 * Opening it was the last step of the slice, not the first - the row had to be playable first.
 */
export const OPEN_STAGES: readonly ChapterStageId[] = ['CH001-01', 'CH001-02', 'CH001-03'];
/**
 * What a stage asks for, in one line, derived from its own data.
 *
 * The objective is not a second field: a stage with seals is won by holding them, one with elite
 * checks by clearing them first, and one with a Boss by beating it. Reading it off the same three
 * fields `validateChapterFinal` reads means the lobby cannot promise an objective the settlement
 * would reject.
 */
export function stageObjective(stage: (typeof chapterStages)[number]): string {
  const seals = stage.seals as readonly SealRule[];
  if (seals.length) return `镇守 ${seals.length} 处界碑`;
  if (stage.eliteChecks > 0) return `先破 ${stage.eliteChecks} 名精英，再击败首领`;
  return '击败首领并领取战利品';
}

export interface ChapterRunOptions {
  ruleset: typeof CHAPTER_RULESET; chapterId: typeof CHAPTER_ID; stageId: ChapterStageId;
  heroId: ChapterHeroId; mode: 'story'; difficulty: DifficultyId; seed: number;
}
export function validateChapterOptions(value: unknown): asserts value is ChapterRunOptions {
  const options = object(value, '出战配置');
  if (options.ruleset !== CHAPTER_RULESET || options.chapterId !== CHAPTER_ID) chapterError('规则版本/章节');
  if (typeof options.stageId !== 'string' || !OPEN_STAGES.includes(options.stageId as ChapterStageId)) throw new Error('此精品关卡尚未开放。');
  if (typeof options.heroId !== 'string' || !Object.hasOwn(chapterHeroes, options.heroId)) chapterError('初始英雄');
  // D38: the door. Two lines used to stand here - the type literal above and a `!== 'normal'`
  // comparison - and together they refused three quarters of a table whose coefficients were
  // already being read on this path. The check is now "is this one of the ids the data declares",
  // not "is this the one we ship": an unknown string would otherwise fall through
  // `difficultyFor`'s `|| difficulties.normal` and silently play as normal.
  if (options.mode !== 'story') chapterError('模式');
  if (typeof options.difficulty !== 'string' || !(difficultyIds as readonly string[]).includes(options.difficulty)) chapterError('难度');
  number(options.seed, '随机种子', 0xffffffff, true);
}
export function prepareChapterRun(save: GameSave, options: unknown) {
  validateChapterOptions(options);
  const progress = readChapterProgress(save);
  // D30: the charm rides on the preparation instead of being baked into `player`. `CombatSimulation`
  // reads it at each lever's single read site and multiplies by 1 when it is absent, so a run with
  // nothing equipped is byte-identical to a run from before this feature existed.
  const charm: EquippedCharm | null = equippedCharm(progress);
  const hero = chapterHeroes[options.heroId];
  // Never call legacy calculateStartup: even an empty rune list has a legacy bonus.
  return freeze({ ruleset: options.ruleset, chapterId: options.chapterId, stageId: options.stageId,
    heroId: options.heroId, mode: options.mode, difficulty: options.difficulty, seed: options.seed,
    // Indexed by id, not by position: cloning `chapterStages[0]` was the second lock on the door.
    stage: structuredClone(chapterStages.find(stage => stage.id === options.stageId)!),
    player: { hp: hero.hp, maxHp: hero.hp, atk: hero.atk, speed: hero.speed, aspd: hero.aspd, crit: hero.crit },
    charm,
    skills: { [hero.skill]: 1 }, passives: {} as Record<string, number>, slots: { auto: 4, passive: 4 },
  });
}
export type ChapterPreparation = ReturnType<typeof prepareChapterRun>;
