/** Frozen chapter-v1 identities; balance values are sample baselines, not playtest results. */
export const CHAPTER_RULESET = 'chapter1-v1' as const;
export const CHAPTER_ID = 'CH001' as const;
export const chapterHeroes = {
  H001: { hp: 620, atk: 108, speed: 240, aspd: .95, crit: .05, skill: 'A003', forms: ['dragon', 'bulwark', 'frostlord', 'frostflame'] },
  H010: { hp: 440, atk: 116, speed: 265, aspd: 1, crit: .06, skill: 'A011', forms: ['phoenix', 'legion', 'thunderlord'] },
  H012: { hp: 430, atk: 106, speed: 280, aspd: 1.2, crit: .12, skill: 'A015', forms: ['void', 'reaper', 'beastlord', 'windwarden'] },
} as const;
export type ChapterHeroId = keyof typeof chapterHeroes;
/**
 * `clear` / `timeout` are the result screen's two words. They live here because they are the
 * stage's, not the chapter's: "破围成功" is right for a stage called 边境破围 and wrong for one
 * called 祭坛决战, and a template branch on `seals` could not tell those apart.
 */
export const chapterStages = [
  { id: 'CH001-01', name: '边境破围', duration: 360, boss: { id: 'B001', spawnAt: 270 }, seals: [], eliteChecks: 0, eliteAt: [], clear: '破围成功', timeout: '破围超时' },
  { id: 'CH001-02', name: '荒原镇界', duration: 420, boss: null, seals: [{ opensAt: 90, dwell: 20 }, { opensAt: 180, dwell: 20 }, { opensAt: 270, dwell: 20 }], eliteChecks: 0, eliteAt: [], clear: '镇界完成', timeout: '镇界超时' },
  { id: 'CH001-03', name: '祭坛决战', duration: 480, boss: { id: 'CH001_ALTAR', spawnAt: 360 }, seals: [], eliteChecks: 2, eliteAt: [120, 300], clear: '祭坛告破', timeout: '决战超时' },
] as const;
/**
 * The id union the *data* admits, not the subset that is open. `prepare.ts` owns the policy
 * (`OPEN_STAGES`); typing this as the literal `'CH001-01'` is what let `stage` below be typed as
 * `typeof chapterStages[0]` - i.e. it let the compiler claim every stage has a non-null boss and
 * an empty `seals` tuple, which is false for two of the three rows.
 */
export type ChapterStageId = (typeof chapterStages)[number]['id'];
/** One seal: it opens at `opensAt` seconds and needs `dwell` seconds of standing inside. */
export interface SealRule { readonly opensAt: number; readonly dwell: number }
/**
 * `eliteChecks` is how many elites a stage demands; `eliteAt` is *when* they arrive. Two fields
 * because they answer different questions, but they are not independent: the number is the
 * length, and `eliteChecks.test.ts` pins that so neither can drift alone. `eliteAt` is a
 * schedule, not a second elite format - the body still comes from `createEnemy`, which is the
 * only place `elite` means anything.
 */
export const chapterRouteGroups = [ ['volley', 'nova', 'ringfire'], ['roaming', 'orbit', 'ambush'], ['hunter', 'guard'], ['glacier', 'shatter'], ['relay', 'thunderstrike'] ] as const;
export const chapterBonds = ['wildfire', 'stormhunt', 'shadowfire', 'superconduct', 'winterlegion', 'thunderlegion', 'galephantom', 'thermalshock'] as const;
export const chapterCharms = ['MC_DODGE', 'MC_ELITE', 'MC_PICKUP', 'MC_SURVIVAL', 'MC_CYCLE', 'MC_MOVE'] as const;
/**
 * D31: the three-star contract, taken from the legacy stage's `storyContract.stars` verbatim
 * (`clear: 2`, `mastery: 3`, `masteryHp: .55`) and from `core/settlement.ts`'s arithmetic.
 *
 * The GDD's prose says "通关 1 / 无伤 2 / 剩余≥55% 3" and that cannot be built as written: "无伤"
 * (hp == maxHp) is strictly stronger than "剩余≥55%", so under a `Math.max` best-score the two
 * upper tiers collapse into one and the middle tier is unreachable. The *data* never said that -
 * `clear: 2` says a win is two stars - so this follows the data and records the prose as wrong.
 *
 * Chapter-level, not per-stage: all three stages are graded by the same contract, and three copies
 * of `0.55` would drift the moment one was tuned.
 */
export const chapterStars = { clear: 2, mastery: 3, masteryHp: .55 } as const;
export const chapterError = (field: string): never => { throw new Error(`精品首章数据无效：${field}。原存档未被覆盖。`); };
export function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return chapterError(field);
  return value as Record<string, unknown>;
}
export function number(value: unknown, field: string, max = Number.MAX_SAFE_INTEGER, integer = false, min = 0): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isSafeInteger(value))) chapterError(field);
}
export function text(value: unknown, field: string, max = 128): asserts value is string {
  if (typeof value !== 'string' || !value.trim() || value.length > max) chapterError(field);
}
export function strings(value: unknown, field: string, max: number): asserts value is string[] {
  if (!Array.isArray(value) || value.length > max || new Set(value).size !== value.length) return chapterError(field);
  for (const entry of value) text(entry, field);
}
export function freeze<T>(value: T): T {
  if (value && typeof value === 'object') { for (const item of Object.values(value)) freeze(item); Object.freeze(value); }
  return value;
}
freeze(chapterHeroes); freeze(chapterStages); freeze(chapterRouteGroups); freeze(chapterBonds); freeze(chapterCharms); freeze(chapterStars);
export const chapterCoreSkills = Object.freeze({ dragon: 'A003', bulwark: 'A021', frostlord: 'G2_FROST', frostflame: 'G2_FROST', phoenix: 'A054', legion: 'S001', thunderlord: 'A013', void: 'A026', reaper: 'A015', beastlord: 'S001', windwarden: 'A026' } as const);
