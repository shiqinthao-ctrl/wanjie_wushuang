export interface HeroProgress {
  unlocked: boolean; level: number; mastery: number; star: number; awakened: boolean;
  [key: string]: unknown;
}
export interface GearInstance {
  uid: string; templateId: string; slot: string; rarity: string; score: number;
  affixes: { key: string; value: number }[];
  [key: string]: unknown;
}
/** Unknown Schema30 fields survive copy/import/export unchanged. */
export interface GameSave {
  schemaVersion: number;
  gold: number; accountLv: number; accountXp: number; talentPoints: number; modeTokens: number;
  stats: { runs: number; kills: number; bossKills: number; [key: string]: unknown };
  modeStats: Record<string, { runs: number; wins: number; bestTime: number; bestKills: number; bestScore: number; [key: string]: unknown }>;
  chapters: Record<string, { stars: Record<string, number>; [key: string]: unknown }>;
  hero: string;
  heroes: Record<string, HeroProgress>;
  inventory: { gear: string[]; gearInstances: GearInstance[]; [key: string]: unknown };
  equipInst: Partial<Record<string, string>>;
  runes: string[];
  pet: string;
  talents: Partial<Record<string, number>>;
  build: { active: string[]; passive: string[] };
  [key: string]: unknown;
}
