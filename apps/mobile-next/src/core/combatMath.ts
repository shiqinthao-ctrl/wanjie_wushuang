import forms from '../data/skillForms.json';
import evolution from '../data/evolution.json';
import heroes from '../data/heroes.json';
import { bonusValue as value, calculateStartup } from './growth';
import type { GameSave } from './saveTypes';
import type { SkillLevels } from './progression';

export type TargetKind = 'normal' | 'elite' | 'boss';
type Element = 'physical' | 'fire' | 'lightning' | 'wind' | 'ki' | 'shadow' | 'frost';
export interface CombatState {
  readonly skills: SkillLevels; readonly passives: SkillLevels;
  readonly evolved: Readonly<Partial<Record<string, boolean>>>;
  readonly hp: number; readonly maxHp: number; readonly crit: number;
  readonly killBuff: number; readonly mode?: string;
  readonly daily?: { readonly lightning?: number; readonly boss?: number };
}
export function combatContext(save: GameSave, startup = calculateStartup(save)) {
  return { gear: startup.gear, runePet: startup.runePet, talent: startup.talent,
    growth: startup.growth, awaken: startup.awaken, runes: [...save.runes],
    baseDef: (heroes as Record<string, { def: number }>)[save.hero]!.def };
}
export type CombatContext = ReturnType<typeof combatContext>;
const descriptions: Record<string, string[]> = forms.descriptions;
const elementPassives: Partial<Record<Element, string>> = forms.elementPassives;

export function sourceElement(source: string): Element {
  if (source.startsWith('G5_FROST')) return 'frost';
  if (source.startsWith('G5_FIRE')) return 'fire';
  if (source.startsWith('G4_WIND')) return 'wind';
  if (source === 'G4_SHADOW_BOND') return 'shadow';
  if (source.startsWith('G2_FROST')) return 'frost';
  if (source.startsWith('G2_LIGHTNING')) return 'lightning';
  if (descriptions[source]) return descriptions[source][0] as Element;
  if (source.startsWith('F')) {
    if (['F005', 'F006'].includes(source)) return 'lightning';
    if (['F020', 'F021'].includes(source)) return 'ki';
    if (source === 'F026') return 'shadow';
    if (source === 'F033') return 'physical';
    return 'fire';
  }
  for (const [prefix, element] of [['H001', 'fire'], ['H010', 'fire'], ['H002', 'lightning'], ['H012', 'shadow'], ['H019', 'ki']] as const) {
    if (source.startsWith(prefix)) return element;
  }
  return 'physical';
}
export function passiveLevel(context: CombatContext, state: Pick<CombatState, 'passives'>, id: string): number {
  let level = (state.passives[id] || 0) + (context.gear.virtual?.[id] || 0) + (context.runePet.virtual?.[id] || 0) + (context.talent.virtual?.[id] || 0);
  const awakening = { P023: 'chainPlus', P039: 'clonePlus', P022: 'piercePlus' }[id];
  if (awakening) level += context.awaken[awakening] || 0;
  return level;
}
export function skillModifier(context: CombatContext, state: CombatState, id: string) {
  const level = state.skills[id === 'G4_SHADOW_BOND' ? 'A026' : id] || 1, p = (key: string) => passiveLevel(context, state, key);
  // Skill modifiers use the skill-form element, which differs from damage source fallback.
  const element = (id.startsWith('G4_') || id.startsWith('G5_') ? sourceElement(id) : descriptions[id]?.[0] || 'physical') as Element;
  let dmg = 1 + (level - 1) * .20, range = 1, duration = 1, cd = 1, count = 1;
  if (p('P019')) dmg *= 1 + p('P019') * .08;
  if (p('P016')) range *= 1 + p('P016') * .07;
  if (p('P017')) duration *= 1 + p('P017') * .08;
  if (p('P018')) cd *= Math.max(.55, 1 - p('P018') * .06);
  const elemental = elementPassives[element];
  if (elemental && p(elemental)) dmg *= 1 + p(elemental) * .09;
  if (id.startsWith('S') && p('P036')) dmg *= 1 + p('P036') * .11;
  if (id.startsWith('S') && p('P039')) count += Math.floor((p('P039') + 1) / 2);
  const evo = Object.entries(evolution).find(([key, entry]) => entry[1] === id && state.evolved[key])?.[0] ?? null;
  if (evo) { dmg *= 1.55; range *= 1.25; count++; duration *= 1.20; }
  range *= 1 + value(context.gear, 'area'); cd *= Math.max(.55, 1 - value(context.gear, 'cdr'));
  range *= 1 + value(context.runePet, 'area'); cd *= Math.max(.5, 1 - value(context.runePet, 'cdr'));
  range *= 1 + value(context.talent, 'area') + (context.awaken.area || 0); cd *= Math.max(.45, 1 - value(context.talent, 'cdr'));
  return { lv: level, dmg, range, duration, cd, count, crit: state.crit || .05, evo };
}
export function damageMultiplier(context: CombatContext, state: CombatState, source: string, target: TargetKind = 'normal'): number {
  const { gear, runePet, talent, growth, awaken } = context, element = sourceElement(source);
  const summon = source.startsWith('S') || source.includes('CLONE'), evolved = source.startsWith('E') || source.startsWith('F');
  let multiplier = 1 + value(gear, 'allDamage') + value(gear, 'allElement');
  const elementKey = { fire: 'fireDmg', lightning: 'lightningDmg', shadow: 'shadowDmg', ki: 'kiDmg', physical: 'physicalDmg' } as const;
  if (element !== 'wind' && element !== 'frost') multiplier += value(gear, elementKey[element]);
  if (summon) multiplier += value(gear, 'summonDmg');
  if (evolved) multiplier += value(gear, 'evoFusionDmg');
  if (target === 'boss') multiplier += value(gear, 'bossDmg');
  if (target === 'elite') multiplier += value(gear, 'eliteDmg');
  multiplier = Math.max(.5, multiplier);
  multiplier *= 1 + value(runePet, 'allDamage') + value(runePet, 'allElement');
  if (element === 'fire') multiplier *= 1 + value(runePet, 'fireDmg');
  if (element === 'lightning') multiplier *= 1 + value(runePet, 'lightningDmg');
  if (target === 'boss') multiplier *= 1 + value(runePet, 'bossDmg');
  if (target === 'elite') multiplier *= 1 + value(runePet, 'eliteDmg');
  if (state.killBuff > 0) multiplier *= 1.12;
  if (context.runes.includes('R001') && state.hp / state.maxHp < .4) multiplier *= 1.10;
  multiplier *= 1 + value(talent, 'allDamage') + growth.skillDmg;
  if (target === 'boss') multiplier *= 1 + value(talent, 'bossDmg');
  if (target === 'elite') multiplier *= 1 + value(talent, 'eliteDmg');
  if (evolved && talent.evoFusionDmg) multiplier *= 1 + talent.evoFusionDmg;
  if (['fire', 'lightning', 'shadow', 'ki'].includes(element)) multiplier *= 1 + (awaken[element + 'Dmg'] || 0);
  if (source.includes('_R')) multiplier *= 1 + (awaken.ultDmg || 0);
  if (summon && awaken.summonDmg) multiplier *= 1 + awaken.summonDmg;
  if (source === 'H019_R' && awaken.beamPlus) multiplier *= 1 + awaken.beamPlus;
  if (state.mode === 'daily') {
    if (element === 'lightning' && state.daily?.lightning) multiplier *= 1 + state.daily.lightning;
    if (target === 'boss' && state.daily?.boss) multiplier *= 1 + state.daily.boss;
  }
  return multiplier;
}
export function enemyHit(context: CombatContext, state: CombatState, source: string, base: number, elite = false, critical = false, skill = false) {
  let damage = base;
  if (skill) {
    damage *= skillModifier(context, state, source).dmg;
    if (critical && passiveLevel(context, state, 'P007')) damage *= 1 + passiveLevel(context, state, 'P007') * .08;
  }
  const multiplier = damageMultiplier(context, state, source, elite ? 'elite' : 'normal');
  let hp = state.hp;
  if (context.gear.lifesteal && damage > 0) hp = Math.min(state.maxHp, hp + damage * multiplier * context.gear.lifesteal * .08);
  if (skill && passiveLevel(context, state, 'P043')) hp = Math.min(state.maxHp, hp + damage * .0025 * passiveLevel(context, state, 'P043'));
  return { damage: damage * multiplier, hp };
}
export function bossHit(context: CombatContext, state: CombatState, source: string, base: number, boss: { hp: number; shield: number }, skill = false) {
  let damage = base;
  if (skill) {
    damage *= skillModifier(context, state, source).dmg;
    if (passiveLevel(context, state, 'P003')) damage *= 1 + passiveLevel(context, state, 'P003') * .08;
  }
  const multiplier = damageMultiplier(context, state, source, 'boss') * (boss.shield > 0 ? 1 + value(context.gear, 'shieldDmg') : 1);
  damage *= multiplier;
  // A shield-breaking hit does not carry excess damage into Boss HP in the legacy rules.
  return boss.shield > 0 ? { hp: boss.hp, shield: Math.max(0, boss.shield - damage), damage: Math.min(boss.shield, damage) }
    : { hp: boss.hp - damage, shield: boss.shield, damage };
}
export function incomingHit(context: CombatContext, player: { hp: number; maxHp: number; shield: number; inv: number; dodgeBuff: number; incoming?: number }, base: number) {
  let damage = base, shield = player.shield;
  if (Number.isFinite(player.incoming)) damage *= player.incoming!;
  if (player.hp / player.maxHp < .35) damage *= Math.max(.55, 1 - value(context.talent, 'lowHpDR'));
  if (shield > 0) {
    const blocked = Math.min(shield, damage); shield -= blocked; damage -= blocked;
    if (damage <= 0) return { hp: player.hp, shield, inv: player.inv };
  }
  if (player.dodgeBuff > 0) damage *= .72;
  // Shield absorption intentionally happens before the base invulnerability check.
  if (player.inv > 0) return { hp: player.hp, shield, inv: player.inv };
  return { hp: player.hp - Math.max(1, damage - context.baseDef * .08), shield, inv: .28 };
}
