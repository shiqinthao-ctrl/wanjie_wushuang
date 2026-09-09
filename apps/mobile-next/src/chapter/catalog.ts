/** Frozen chapter-v1 identities; balance values are sample baselines, not playtest results. */
export const CHAPTER_RULESET = 'chapter1-v1' as const;
export const CHAPTER_ID = 'CH001' as const;
export const chapterHeroes = {
  H001: { hp: 620, atk: 108, speed: 240, aspd: .95, crit: .05, skill: 'A003', forms: ['dragon', 'bulwark', 'frostlord', 'frostflame'] },
  H010: { hp: 440, atk: 116, speed: 265, aspd: 1, crit: .06, skill: 'A011', forms: ['phoenix', 'legion', 'thunderlord'] },
  H012: { hp: 430, atk: 106, speed: 280, aspd: 1.2, crit: .12, skill: 'A015', forms: ['void', 'reaper', 'beastlord', 'windwarden'] },
} as const;
export type ChapterHeroId = keyof typeof chapterHeroes;
export const chapterStages = [
  { id: 'CH001-01', name: '边境破围', duration: 360, boss: { id: 'B001', spawnAt: 270 }, seals: [], eliteChecks: 0 },
  { id: 'CH001-02', name: '荒原镇界', duration: 420, boss: null, seals: [{ opensAt: 90, dwell: 20 }, { opensAt: 180, dwell: 20 }, { opensAt: 270, dwell: 20 }], eliteChecks: 0 },
  { id: 'CH001-03', name: '祭坛决战', duration: 480, boss: { id: 'CH001_ALTAR', spawnAt: 360 }, seals: [], eliteChecks: 2 },
] as const;
export const chapterRouteGroups = [ ['volley', 'nova', 'ringfire'], ['roaming', 'orbit', 'ambush'], ['hunter', 'guard'], ['glacier', 'shatter'], ['relay', 'thunderstrike'] ] as const;
export const chapterBonds = ['wildfire', 'stormhunt', 'shadowfire', 'superconduct', 'winterlegion', 'thunderlegion', 'galephantom', 'thermalshock'] as const;
export const chapterCharms = ['MC_DODGE', 'MC_ELITE', 'MC_PICKUP', 'MC_SURVIVAL', 'MC_CYCLE', 'MC_MOVE'] as const;
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
freeze(chapterHeroes); freeze(chapterStages); freeze(chapterRouteGroups); freeze(chapterBonds); freeze(chapterCharms);
export const chapterCoreSkills = Object.freeze({ dragon: 'A003', bulwark: 'A021', frostlord: 'G2_FROST', frostflame: 'G2_FROST', phoenix: 'A054', legion: 'S001', thunderlord: 'A013', void: 'A026', reaper: 'A015', beastlord: 'S001', windwarden: 'A026' } as const);
