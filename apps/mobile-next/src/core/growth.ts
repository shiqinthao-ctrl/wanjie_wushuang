import heroData from '../data/heroes.json';
import gearData from '../data/gear.json';
import runePetData from '../data/runePets.json';
import talentData from '../data/talents.json';
import type { GameSave, GearInstance } from './saveTypes';

export const bonusKeys = ['atkPct', 'hpPct', 'defPct', 'crit', 'critDmg', 'cdr', 'area', 'move', 'bossDmg', 'eliteDmg', 'fireDmg', 'lightningDmg', 'shadowDmg', 'kiDmg', 'summonDmg', 'lifesteal', 'allDamage', 'allElement', 'evoFusionDmg', 'physicalDmg', 'shieldDmg', 'lowHpDR', 'xpPct', 'goldPct', 'dropPct', 'masteryPct', 'accountXpPct'] as const;
export type BonusKey = typeof bonusKeys[number];
export type Bonus = Partial<Record<BonusKey, number>> & { virtual?: Record<string, number> };
interface Hero { name: string; hp: number; atk: number; def: number; move: number; aspd: number; crit: number }
interface GearTemplate { name: string; score: number; slot: string; rarity: string; set: string; exclusive?: string }
interface Rune { name: string; type: string; bonus?: Bonus; virtual?: Record<string, number> }
const heroes: Record<string, Hero> = heroData;
const catalog: Record<string, GearTemplate> = gearData.catalog;
const sets: Record<string, { bonus2: Bonus; bonus3: Bonus }> = gearData.sets;
const runes: Record<string, Rune> = runePetData.runes;
const pets: Record<string, { bonus: Bonus }> = runePetData.pets;
const talents: Record<string, { bonus?: Bonus; virtual?: Record<string, number> }> = talentData;
const gearKeys: BonusKey[] = ['atkPct', 'hpPct', 'defPct', 'crit', 'critDmg', 'cdr', 'area', 'move', 'bossDmg', 'eliteDmg', 'fireDmg', 'lightningDmg', 'shadowDmg', 'kiDmg', 'summonDmg', 'lifesteal', 'allDamage', 'allElement', 'evoFusionDmg', 'physicalDmg', 'shieldDmg'];
const runeKeys: BonusKey[] = ['atkPct', 'bossDmg', 'eliteDmg', 'critDmg', 'allDamage', 'cdr', 'area', 'lifesteal', 'fireDmg', 'lightningDmg', 'move', 'goldPct', 'xpPct', 'dropPct'];
const talentKeys: BonusKey[] = ['atkPct', 'crit', 'bossDmg', 'eliteDmg', 'allDamage', 'hpPct', 'defPct', 'lifesteal', 'move', 'lowHpDR', 'xpPct', 'goldPct', 'dropPct', 'masteryPct', 'accountXpPct', 'area', 'cdr', 'evoFusionDmg'];
function zeros(keys: BonusKey[]): Bonus { return { virtual: {}, ...Object.fromEntries(keys.map(key => [key, 0])) }; }
export function bonusValue(bonus: Bonus, key: BonusKey): number { return bonus[key] || 0; }
export function mergeBonus(target: Bonus, source: Bonus): Bonus {
  for (const key of bonusKeys) if (source[key] !== undefined) target[key] = bonusValue(target, key) + source[key];
  for (const [key, value] of Object.entries(source.virtual || {})) {
    target.virtual ??= {}; target.virtual[key] = (target.virtual[key] || 0) + value;
  }
  return target;
}
export function equipped(save: GameSave): GearInstance[] {
  return ['weapon', 'armor', 'accessory'].flatMap(slot => {
    const instance = save.inventory.gearInstances.find(item => item.uid === save.equipInst[slot]);
    return instance ? [instance] : [];
  });
}
export function instanceScore(item: GearInstance, hero: string): number {
  const template = catalog[item.templateId];
  let score = template?.score || item.score || 0;
  for (const affix of item.affixes) score += Math.round(affix.value * 600);
  if (item.rarity === 'mythic') score += 90;
  if (template?.exclusive === hero) score += 45;
  return Math.round(score);
}
export function gearBonuses(save: GameSave): Bonus {
  const bonus = zeros(gearKeys), counts: Record<string, number> = {};
  for (const item of equipped(save)) {
    const template = catalog[item.templateId];
    for (const affix of item.affixes) {
      if (!bonusKeys.includes(affix.key as BonusKey)) throw new Error(`Unsupported gear affix: ${affix.key}`);
      mergeBonus(bonus, { [affix.key]: affix.value });
    }
    if (template?.exclusive === save.hero) mergeBonus(bonus, { atkPct: .08, crit: .025 });
    const intrinsic: Record<string, Bonus> = {
      EQW001: { fireDmg: .08 }, EQW002: { virtual: { P023: 1 } }, EQW003: { summonDmg: .12, virtual: { P039: 1 } },
      EQW004: { area: .10 }, EQW005: { virtual: { P022: 1 } }, EQW006: { virtual: { P022: 1 }, kiDmg: .08 },
      EQX002: { virtual: { P023: 1 } }, EQX003: { virtual: { P036: 1 } }, EQX004: { area: .08 }, EQX005: { virtual: { P024: 1 } }, EQX006: { area: .08 },
    };
    mergeBonus(bonus, intrinsic[item.templateId] || {});
    if (template?.set) counts[template.set] = (counts[template.set] || 0) + 1;
  }
  for (const [id, count] of Object.entries(counts)) {
    const set = sets[id];
    if (set && count >= 2) mergeBonus(bonus, set.bonus2);
    if (set && count >= 3) mergeBonus(bonus, set.bonus3);
  }
  return bonus;
}
export function resonanceBonus(ids: string[]): Bonus {
  const counts: Record<string, number> = {};
  for (const id of ids) { const type = runes[id]?.type; if (type) counts[type] = (counts[type] || 0) + 1; }
  const triple = Object.keys(counts).find(type => counts[type]! >= 3);
  const pair = Object.keys(counts).find(type => counts[type]! >= 2);
  const triples: Record<string, Bonus> = { offense: { atkPct: .08, crit: .04 }, shape: { area: .10, cdr: .05 }, survival: { hpPct: .12, lifesteal: .01 }, element: { allElement: .12 }, economy: { goldPct: .12, xpPct: .12, dropPct: .08 } };
  const pairs: Record<string, Bonus> = { offense: { allDamage: .06 }, shape: { area: .06 }, survival: { hpPct: .06 }, element: { allElement: .07 }, economy: { goldPct: .06, xpPct: .06 } };
  return triple ? triples[triple] || {} : pair ? pairs[pair] || {} : { allDamage: .04 };
}
export function runePetBonuses(save: GameSave): Bonus {
  const bonus = zeros(runeKeys);
  for (const id of save.runes) {
    const rune = runes[id];
    if (rune) { mergeBonus(bonus, rune.bonus || {}); mergeBonus(bonus, { virtual: rune.virtual }); }
  }
  mergeBonus(bonus, pets[save.pet]?.bonus || {});
  return mergeBonus(bonus, resonanceBonus(save.runes));
}
export function talentBonuses(save: GameSave): Bonus {
  const result = zeros(talentKeys);
  for (const [id, talent] of Object.entries(talents)) {
    const level = save.talents[id] || 0;
    for (const key of bonusKeys) if (talent.bonus?.[key] !== undefined) result[key] = bonusValue(result, key) + talent.bonus[key] * level;
    for (const [key, value] of Object.entries(talent.virtual || {})) {
      result.virtual![key] = (result.virtual![key] || 0) + Math.floor(value * level);
    }
  }
  return result;
}
export function heroGrowth(save: GameSave) {
  const progress = save.heroes[save.hero];
  if (!progress) throw new Error('Selected hero progress is missing');
  const tier = [50, 120, 220, 350, 500].filter(value => progress.mastery >= value).length;
  return { hpPct: (progress.star - 1) * .035 + (tier >= 1 ? .03 : 0), atkPct: (progress.star - 1) * .045 + (tier >= 1 ? .03 : 0), defPct: (progress.star - 1) * .025, skillDmg: tier >= 2 ? .05 : 0, heroCdr: tier >= 3 ? .05 : 0, resourceEff: tier >= 5 ? .15 : 0, awakened: progress.awakened };
}
export function awakenBonus(save: GameSave): Record<string, number> {
  const values: Record<string, Record<string, number>> = {
    H001: { fireDmg: .18, resourceMax: 120, ultDmg: .25 }, H002: { lightningDmg: .15, resourceMax: 120, chainPlus: 1, ultDmg: .22 },
    H007: { summonDmg: .20, resourceMax: 120, clonePlus: 2, giantPlus: 3 }, H010: { fireDmg: .15, resourceMax: 120, area: .15 },
    H012: { shadowDmg: .18, resourceMax: 120, piercePlus: 1 }, H019: { kiDmg: .18, resourceMax: 120, chargeSpeed: .20, beamPlus: .22 },
  };
  return save.heroes[save.hero]?.awakened ? values[save.hero] || {} : {};
}
export function calculateStartup(save: GameSave) {
  const hero = heroes[save.hero], progress = save.heroes[save.hero];
  if (!hero || !progress) throw new Error('Selected hero is not supported');
  const talent = talentBonuses(save), growth = heroGrowth(save), gear = gearBonuses(save), runePet = runePetBonuses(save);
  const stats = {
    hp: Math.round(Math.round(hero.hp * (1 + (progress.level - 1) * .03)) * (1 + growth.hpPct + bonusValue(talent, 'hpPct'))),
    atk: Math.round(Math.round(hero.atk * (1 + (progress.level - 1) * .04)) * (1 + growth.atkPct + bonusValue(talent, 'atkPct'))),
    def: Math.round(Math.round(hero.def * (1 + (progress.level - 1) * .02)) * (1 + growth.defPct + bonusValue(talent, 'defPct'))),
    move: hero.move * (1 + bonusValue(talent, 'move')), aspd: hero.aspd, crit: hero.crit + bonusValue(talent, 'crit') * 100,
  };
  const gearScore = equipped(save).reduce((sum, item) => sum + instanceScore(item, save.hero), 0);
  const player = { maxHp: stats.hp, hp: stats.hp, atk: stats.atk * (1 + gearScore / 5000), speed: hero.move * 50, aspd: hero.aspd, crit: hero.crit / 100 };
  // Legacy startup reapplies talents after rounded sheet stats. Keep that order
  // (including the three distinct crit caps) until a separate balance change.
  for (const [index, bonus] of [gear, runePet, talent].entries()) {
    player.maxHp *= 1 + bonusValue(bonus, 'hpPct'); player.hp = player.maxHp;
    player.atk *= 1 + bonusValue(bonus, 'atkPct'); player.speed *= 1 + bonusValue(bonus, 'move');
    player.crit = Math.min([.65, .7, .75][index]!, player.crit + bonusValue(bonus, 'crit'));
  }
  const skills: Record<string, number> = {}, passives: Record<string, number> = {};
  for (const id of save.build.active.slice(0, 2)) skills[id] = 1;
  for (const id of save.build.passive.slice(0, 1)) passives[id] = 1;
  return { stats, gearScore, gear, runePet, talent, growth, awaken: awakenBonus(save), player, skills, passives };
}
