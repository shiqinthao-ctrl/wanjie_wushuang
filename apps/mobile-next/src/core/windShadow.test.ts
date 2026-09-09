import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { damageMultiplier, skillModifier, sourceElement } from './combatMath';
import type { Enemy } from './spawnRules';

const target = (x = 1960): Enemy => ({ id: 'EN001', name: 'target', ai: 'melee', x, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 0, color: '#fff', flash: 0 });
function setup(skills: Record<string, number> = {}, classic = false) {
  const journey = new RunEvolution('H012');
  const progression = new Progression(evolutionBuild('H012'), skills, {}, () => .8, classic ? undefined : journey);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero: classic ? 'H001' : 'H012' }, progression, () => .8);
  for (const id of Object.keys(skills)) sim.cool[id] = 100;
  return { journey, progression, sim };
}
const blades = (sim: CombatSimulation) => sim.projectiles.filter(s => s.id === 'G4_SHADOW_BOND');

describe('G4 wind-shadow build', () => {
  it('gates the fourth H012 form and spends an upgrade on its signature', () => {
    const { journey, progression } = setup({ A015: 1, S001: 1 });
    expect(journey.special(2, {})).toEqual([]);
    expect(journey.special(3, {}).map(o => o.id)).toEqual(['void', 'reaper', 'beastlord', 'windwarden']);
    expect(new RunEvolution('H001').pick(3, {}, 'hero', 'windwarden')).toBe(false);
    expect(journey.pick(3, {}, 'hero', 'windwarden')).toBe(true);
    expect(progression.snapshot().skills.A026).toBeUndefined();
    progression.gain(26); progression.checkLevel(); const offer = progression.snapshot().choice!;
    expect(offer.options.some(o => o.id === 'A026')).toBe(true);
    expect(progression.pick(offer.token, 'active', 'A026')).toBe(true);
    expect(progression.snapshot().skills.A026).toBe(1);
    expect(journey.signature({ A026: 3 })).toBeUndefined();
    expect(journey.pick(8, { A026: 2 }, 'hero', 'awaken')).toBe(false);
  });
  it('locks all three tornado branches after a valid Lv.3 choice', () => {
    const { journey } = setup();
    expect(journey.pick(2, { A026: 2 }, 'route', 'ambush')).toBe(false);
    expect(journey.special(2, { A026: 3 }).map(o => o.id)).toEqual(['roaming', 'orbit', 'ambush']);
    expect(journey.pick(2, { A026: 3 }, 'route', 'ambush')).toBe(true);
    for (const id of ['roaming', 'orbit', 'ambush']) expect(journey.pick(2, { A026: 5 }, 'route', id)).toBe(false);
  });
  it('plants a weaker wider tornado on the target and leaves it when moving', () => {
    const ambush = setup({ A026: 3 }), roaming = setup({ A026: 3 });
    ambush.journey.pick(2, { A026: 3 }, 'route', 'ambush');
    for (const { sim } of [ambush, roaming]) { sim.enemies.push(target()); sim.cast('A026'); }
    const field = ambush.sim.vortices[0]!, plain = roaming.sim.vortices[0]!;
    expect(field).toMatchObject({ x: 1960, y: 1200, vx: 0, vy: 0, follow: false });
    expect(field.r / plain.r).toBeCloseTo(110 / 82); expect(field.dmg / plain.dmg).toBeCloseTo(.8);
    expect(field.life).toBe(plain.life);
    ambush.sim.player.x -= 300; ambush.sim.updateOuter(.1); expect(field.x).toBe(1960);
  });
  it('bounds target placement by reach and empty placement by world edges', () => {
    const { sim, journey } = setup({ A026: 3 }); journey.pick(2, { A026: 3 }, 'route', 'ambush');
    sim.enemies.push(target(2900)); sim.cast('A026'); expect(sim.vortices[0]!.x).toBe(2020);
    sim.enemies.length = 0; sim.player.x = 3590; sim.cast('A026');
    expect(sim.vortices[1]!.x).toBeLessThanOrEqual(3582); expect(sim.vortices[1]!.y).toBeGreaterThanOrEqual(18);
  });
  it('awakens piercing blades and the fixed skill without resetting cooldown', () => {
    const { sim, journey } = setup(); journey.pick(3, {}, 'hero', 'windwarden'); sim.enemies.push(target());
    sim.basic(); expect(sim.projectiles).toHaveLength(3); expect(sim.projectiles.every(s => s.pierce === 1)).toBe(true);
    sim.action('skill'); const cooldown = sim.player.skillCd;
    expect(sim.vortices[0]).toMatchObject({ x: 1960, r: 120, life: 4, follow: false, vx: 0 });
    expect(journey.pick(8, { A026: 3 }, 'hero', 'awaken')).toBe(true);
    expect(sim.player.skillCd).toBe(cooldown); expect(sim.action('skill')).toBe(false);
    sim.projectiles.length = 0; sim.basic(); expect(sim.projectiles.every(s => s.pierce === 3)).toBe(true);
    sim.player.skillCd = 0; sim.action('skill'); expect(sim.vortices[1]).toMatchObject({ r: 160, life: 6 });
    sim.player.ult = 100; expect(sim.action('ultimate')).toBe(true); expect(sim.action('ultimate')).toBe(false);
    expect(sim.vortices[2]).toMatchObject({ r: 200, life: 6, vx: 0 }); expect(sim.renderState().summons).toHaveLength(5);
  });
  it('requires actual positive-level wind and shadow skills', () => {
    const { journey } = setup(); journey.pick(3, {}, 'hero', 'windwarden');
    for (const skills of [{ A026: 1 }, { A015: 1 }, { A026: 1, S001: 0 }]) expect(journey.bond('galephantom', skills)).toBe(false);
    expect(journey.bond('galephantom', { A026: 1, A015: 1 })).toBe(true);
    expect(journey.bond('galephantom', { A026: 1, S001: 1 })).toBe(true);
  });
  it('fires once per live pulse and deals actual shadow damage', () => {
    const { sim, journey } = setup({ A026: 3, A015: 1 }); journey.pick(2, { A026: 3 }, 'route', 'ambush');
    sim.enemies.push(target(), target(2030)); sim.cast('A026'); sim.updateOuter(.01);
    expect(blades(sim)).toHaveLength(1); expect(blades(sim)[0]!.pierce).toBe(1);
    expect(blades(sim)[0]!.dmg).toBeCloseTo(sim.vortices[0]!.dmg * .75);
    sim.updateOuter(.01); expect(sim.damageBy.G4_SHADOW_BOND).toBeGreaterThan(0);
    const first = blades(sim)[0]; sim.updateOuter(.27); expect(blades(sim).filter(s => s !== first)).toHaveLength(1);
  });
  it('does not fire out of range, after expiry or in classic combat', () => {
    for (const classic of [false, true]) {
      const { sim } = setup({ A026: 1, A015: 1 }, classic); sim.enemies.push(target(2700)); sim.cast('A026'); sim.updateOuter(.01);
      expect(blades(sim)).toHaveLength(0);
      sim.enemies[0]!.x = 1860; sim.vortices[0]!.life = .001; sim.vortices[0]!.tick = 0; sim.updateOuter(.01);
      expect(blades(sim)).toHaveLength(0);
      if (classic) { sim.cast('A026'); sim.updateOuter(.01); expect(blades(sim)).toHaveLength(0); }
    }
  });
  it('targets a Boss without pulling it and obeys the 300-unit search radius', () => {
    const { sim, journey } = setup({ A026: 3, S001: 1 }); journey.pick(2, { A026: 3 }, 'route', 'ambush');
    sim.time = 270; sim.bossEncounter.updateObjective(); const boss = sim.boss!;
    boss.x = 2020; boss.y = 1200; boss.shield = 0; sim.cast('A026'); sim.updateOuter(.01);
    expect(blades(sim)).toHaveLength(1); sim.updateOuter(.01); expect(sim.damageBy.G4_SHADOW_BOND).toBeGreaterThan(0);
    expect(boss.x).toBe(2020); expect(boss.y).toBe(1200);
    sim.projectiles.length = 0; boss.x = 2321; sim.vortices[0]!.tick = 0; sim.updateOuter(.01); expect(blades(sim)).toHaveLength(0);
  });
  it('keeps wind and shadow scaling distinct from starter bonuses', () => {
    const { sim } = setup({ A026: 3 }); const state = sim.state();
    expect(sourceElement('G4_WIND_E')).toBe('wind'); expect(sourceElement('G4_SHADOW_BOND')).toBe('shadow');
    expect(skillModifier(sim.context, { ...state, passives: { P030: 2, P033: 5 } }, 'G4_WIND_E').dmg).toBeCloseTo(1.18);
    expect(skillModifier(sim.context, { ...state, passives: { P030: 5, P033: 2 } }, 'G4_SHADOW_BOND').dmg).toBeCloseTo(1.4 * 1.18);
    const context = { ...sim.context, gear: { ...sim.context.gear, shadowDmg: 10 } };
    expect(damageMultiplier(context, state, 'G4_WIND_E')).toBe(damageMultiplier(sim.context, state, 'G4_WIND_E'));
    expect(damageMultiplier(context, state, 'G4_SHADOW_BOND')).toBeGreaterThan(damageMultiplier(sim.context, state, 'G4_SHADOW_BOND'));
  });
  it('caps repeated casts and clears every new effect on destruction', () => {
    const { sim, journey } = setup({ A026: 3, A015: 1 }); journey.pick(3, {}, 'hero', 'windwarden'); sim.enemies.push(target());
    for (let i = 0; i < 30; i++) { sim.player.skillCd = 0; sim.action('skill'); }
    expect(sim.vortices).toHaveLength(10); sim.updateOuter(.01); expect(blades(sim)).toHaveLength(10);
    sim.destroy(); expect(sim.vortices).toEqual([]); expect(sim.projectiles).toEqual([]); expect(sim.renderState().summons).toEqual([]);
  });
});
