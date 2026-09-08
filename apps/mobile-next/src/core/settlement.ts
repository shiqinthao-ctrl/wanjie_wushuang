import type { GameSave, GearInstance } from './saveTypes';
import { runePetBonuses, talentBonuses } from './growth';
import { difficultyFor, firstStage } from './spawnRules';
import { parseSchema30 } from '../storage/schema30';
import { isStarter } from './evolutionCatalog';
import type { EvolutionSnapshot } from './RunEvolution';

export interface FinalRun {
  readonly journey?: EvolutionSnapshot;
  readonly heroId: string; readonly chapter: string; readonly stageId: string; readonly modeId: string; readonly difficultyId: string;
  readonly endReason: 'victory' | 'defeat' | 'timeout'; readonly reason: string;
  readonly hp: number; readonly maxHp: number; readonly time: number; readonly level: number;
  readonly kills: number; readonly eliteKills: number; readonly maxCombo: number; readonly modeScore: number; readonly modeBosses: number;
  readonly interactionsUsed: number; readonly mapGold: number; readonly bossPhaseMax: number;
  readonly petGold: number; readonly petDamage: number; readonly petHeals: number;
  readonly damageBy: Readonly<Record<string, number>>;
  readonly evolved: readonly string[]; readonly fused: readonly string[]; readonly drops: readonly GearInstance[];
  readonly build: { readonly active: readonly string[]; readonly passive: readonly string[] };
  readonly timedRewards: readonly { readonly id: string; readonly index: number; readonly at: number; readonly state: string }[];
  readonly encounterEvidence?: unknown;
}
function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); }
  return value;
}
export const freezeRun = (run: FinalRun): FinalRun => freeze(structuredClone(run));

/** Pure result calculation. The caller commits this copy and its receipt together. */
export function settleRun(source: GameSave, run: FinalRun) {
  const supportedHero = run.journey ? isStarter(run.heroId) && run.journey.heroId === run.heroId : run.heroId === 'H001';
  if (run.modeId !== 'story' || !supportedHero || run.chapter !== 'ST001' || run.stageId !== 'ST001-01' || run.difficultyId !== 'normal') throw new Error('尚未支持此关卡、英雄、模式或难度的结算。');
  if (source.hero !== run.heroId || source.mode !== run.modeId || source.selectedStage !== run.stageId || source.selectedChapter !== run.chapter || String(source.difficulty || 'normal') !== run.difficultyId) throw new Error('存档出征配置已变化，请返回大厅重新载入。');
  for (const key of ['hp', 'maxHp', 'time', 'level', 'kills', 'eliteKills', 'maxCombo', 'modeScore', 'modeBosses', 'interactionsUsed', 'mapGold', 'bossPhaseMax', 'petGold', 'petDamage', 'petHeals'] as const) {
    if (!Number.isFinite(run[key]) || run[key] < 0) throw new Error('本局记录无效，未写入存档。');
  }
  if (run.maxHp <= 0 || !['victory', 'defeat', 'timeout'].includes(run.endReason)) throw new Error('本局记录无效，未写入存档。');
  const save = parseSchema30(JSON.stringify(source)), victory = run.endReason === 'victory';
  const chapter = save.chapters[run.chapter], hero = save.heroes[run.heroId], mode = save.modeStats.story;
  if (!chapter || chapter.stars[run.stageId] === undefined || !hero || !mode) throw new Error('存档缺少本关进度，未写入存档。');
  const old = chapter.stars[run.stageId]!, stars = victory ? run.hp / run.maxHp > firstStage.storyContract.stars.masteryHp ? 3 : 2 : 0;
  const newStars = Math.max(old, stars), baseGoldAward = victory ? 260 : Math.floor(260 * .35), starGoldAward = victory ? stars * 100 : 0;
  const base = baseGoldAward + starGoldAward, diff = difficultyFor(run.difficultyId);
  const tuned = Math.round(base * diff.gold * Math.min(1.35, .85 + run.maxCombo / 300 + run.eliteKills * .015));
  const runePetGold = Math.round(run.petGold + 260 * (runePetBonuses(save).goldPct || 0));
  const bonusGold = run.mapGold + runePetGold, gold = tuned + bonusGold;
  const talent = talentBonuses(save), masteryGain = Math.max(5, Math.round(run.time / 30 + run.kills * .04));
  const accountXpGain = Math.round(Math.round(180 + run.time * .08 + run.kills * .14 + (victory ? 160 : 0) + run.eliteKills * 8) * (1 + (talent.accountXpPct || 0)));
  const masteryMetaGain = Math.round((8 + run.kills * .018 + (victory ? 12 : 0)) * (1 + (talent.masteryPct || 0)));
  const modeTokens = victory ? firstStage.tokens : Math.floor(firstStage.tokens * .35);
  chapter.stars[run.stageId] = newStars; save.gold += gold; hero.mastery += masteryGain + masteryMetaGain;
  save.stats.runs++; save.stats.kills += run.kills; if (victory) save.stats.bossKills++;
  save.accountXp += accountXpGain;
  let accountLevelUps = 0;
  while (save.accountLv < 200 && save.accountXp >= 500 + save.accountLv * 120) {
    save.accountXp -= 500 + save.accountLv * 120; save.accountLv++; save.talentPoints++; accountLevelUps++;
  }
  save.modeTokens += modeTokens; mode.runs++; if (victory) mode.wins++;
  mode.bestKills = Math.max(mode.bestKills, run.kills); mode.bestScore = Math.max(mode.bestScore, run.modeScore);
  if (victory && (mode.bestTime === 0 || run.time < mode.bestTime)) mode.bestTime = run.time;
  for (const drop of run.drops) {
    if (!save.inventory.gearInstances.some(item => item.uid === drop.uid)) save.inventory.gearInstances.push(structuredClone(drop));
    if (!save.inventory.gear.includes(drop.templateId)) save.inventory.gear.push(drop.templateId);
  }
  const objective = (id: string, kind: string, label: string, actual: number, target: number) => ({ id, kind, label, current: Math.min(target, actual), target, state: actual >= target ? 'complete' : 'active' });
  const result = freeze({
    ...(run.journey ? { journey: structuredClone(run.journey) } : {}),
    victory, reason: run.reason, stage: ['ST001-01', '边境清剿', true, 260, 'B001', structuredClone(firstStage.storyContract)], chapter: run.chapter,
    time: run.time, level: run.level, kills: run.kills, stars, gold, old, newStars, baseGoldAward, starGoldAward, storyReward: true, masteryGain,
    drops: structuredClone(run.drops), evo: run.evolved.length, fusion: run.fused.length, maxCombo: run.maxCombo, damageBy: { ...run.damageBy }, eliteKills: run.eliteKills,
    objectives: [objective('primary', 'boss', '取得 Boss 战利品', run.drops.filter(drop => drop.source === 'boss').length, 1), objective('side-kills', 'kills', '清理沿途敌群', run.kills, 60), objective('side-interaction', 'interaction', '使用一次地图互动', run.interactionsUsed, 1)],
    timedRewards: structuredClone(run.timedRewards), heroId: run.heroId, build: structuredClone(run.build),
    directorGoldDelta: tuned - base, difficulty: diff.name, directorScore: Math.round(run.maxCombo * 1.2 + run.eliteKills * 65 + run.kills * .18),
    interactionsUsed: run.interactionsUsed, bonusGold, bossPhaseMax: run.bossPhaseMax, runePetGold, petDamage: run.petDamage, petHeals: run.petHeals,
    accountXpGain, masteryMetaGain, accountLevelUps, modeId: run.modeId, modeName: firstStage.name, modeRewardMult: firstStage.reward,
    modeExtraGold: 0, modeTokens, modeScore: run.modeScore, modeBosses: run.modeBosses, encounterEvidence: structuredClone(run.encounterEvidence),
  });
  return { save: parseSchema30(JSON.stringify(save)), result };
}
export type RunResult = ReturnType<typeof settleRun>['result'];
