import type { CombatContext } from '../core/combatMath';

/** Explicit neutral rules context; an empty legacy loadout still has bonuses. */
export function chapterCombatContext(): CombatContext {
  // `threat: undefined` keeps the first chapter on the legacy reference model.
  return { gear: {}, runePet: {}, talent: {}, awaken: {}, runes: [], baseDef: 0, threat: undefined,
    growth: { hpPct: 0, atkPct: 0, defPct: 0, skillDmg: 0, heroCdr: 0, resourceEff: 0, awakened: false } };
}
