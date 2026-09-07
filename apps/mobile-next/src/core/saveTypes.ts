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
  hero: string;
  heroes: Record<string, HeroProgress>;
  inventory: { gearInstances: GearInstance[]; [key: string]: unknown };
  equipInst: Partial<Record<string, string>>;
  runes: string[];
  pet: string;
  talents: Partial<Record<string, number>>;
  build: { active: string[]; passive: string[] };
  [key: string]: unknown;
}
