import { describe, expect, it } from 'vitest';
import fixture from '../../../../tasks/mobile-modernization/baseline/combat-math-oracle.json';
import fresh from '../data/freshSave.json';
import type { GameSave } from './saveTypes';
import { combatContext, sourceElement, passiveLevel, skillModifier, damageMultiplier, enemyHit, bossHit, incomingHit } from './combatMath';

describe('final legacy combat math', () => {
  it('preserves elemental source classification including pets, map and fusion fallbacks', () => {
    for (const [id, expected] of Object.entries(fixture.sources)) expect(sourceElement(id), id).toBe(expected);
  });
  for (const profile of fixture.profiles) {
    const save: GameSave = structuredClone({ ...fresh, ...profile.patch });
    const context = combatContext(save);
    for (const item of profile.cases) {
      it(`${profile.name} level ${item.level}: full modifiers, virtual levels and target multipliers`, () => {
        for (const [id, expected] of Object.entries(item.passiveLevels)) expect(passiveLevel(context, item.state, id), id).toBe(expected);
        for (const [id, expected] of Object.entries(item.modifiers)) expect(skillModifier(context, item.state, id), id).toEqual(expected);
        for (const [id, targets] of Object.entries(item.multipliers)) {
          for (const target of ['normal', 'elite', 'boss'] as const) expect(damageMultiplier(context, item.state, id, target), `${id}/${target}`).toBe(targets[target]);
        }
      });
      it(`${profile.name} level ${item.level}: enemy skill/crit/healing and boss shields`, () => {
        for (const hit of item.hits) {
          const actual = enemyHit(context, item.state, hit.skill ? 'A011' : 'H001_SLASH', 137, hit.elite, hit.critical, hit.skill);
          expect(actual.damage).toBeCloseTo(hit.damage, 8);
          expect(actual.hp).toBe(hit.hp);
        }
        for (const hit of item.bossHits) {
          expect(bossHit(context, item.state, hit.skill ? 'A011' : 'H001_R', 137, { hp: 100000, shield: hit.initialShield }, hit.skill)).toMatchObject({ hp: hit.hp, shield: hit.shield });
        }
      });
    }
    for (const [index, hit] of profile.incoming.entries()) {
      it(`${profile.name} incoming boundary ${index}`, () => {
        expect(incomingHit(context, hit.initial, 40)).toEqual(hit.expected);
      });
    }
  }
});
