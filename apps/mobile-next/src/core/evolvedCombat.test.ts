import { describe, expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/chests-oracle.json';
import fresh from '../data/freshSave.json';
import { calculateStartup } from './growth';
import { Progression } from './progression';
import { CombatSimulation } from './CombatSimulation';
import { skillModifier } from './combatMath';
import type { Enemy } from './spawnRules';

const seeded = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
const target = (): Enemy => ({ id: 'EN001', name: 'fixture', ai: 'melee', x: 1860, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 0, color: '#fff', flash: 0 });
function close(actual: unknown, expected: unknown) {
  if (typeof expected === 'number') expect(actual).toBeCloseTo(expected, 8);
  else expect(actual).toEqual(expected);
}
function entities(sim: CombatSimulation, legacy: typeof oracle.fusions[number]['initial']) {
  for (const key of ['projectiles', 'fields', 'vortices', 'meteors'] as const) {
    expect(sim[key]).toHaveLength(legacy[key].length);
    for (const [index, item] of sim[key].entries()) for (const [name, value] of Object.entries(item)) {
      const old = (legacy[key][index] as Record<string, unknown>)[name];
      if (old !== undefined) close(value, old);
    }
  }
}
describe('evolved attacks and supported fusions against legacy oracle', () => {
  it.each(oracle.skills)('$evo changes actual $id attacks', fixture => {
    const start = calculateStartup(fresh), progression = new Progression(fresh.build, { ...start.skills, [fixture.id]: 5 }, { ...start.passives, [fixture.passive]: 5 });
    const sim = new CombatSimulation(fresh, progression, seeded(fixture.seed)), enemy = target();
    sim.evolved[fixture.evo] = true; sim.enemies.push(enemy); sim.cast(fixture.id);
    const modifier = skillModifier(sim.context, sim.state(), fixture.id);
    for (const [key, value] of Object.entries(modifier)) close(value, (fixture.modifier as Record<string, unknown>)[key]);
    entities(sim, fixture.runtime); close(100000 - enemy.hp, fixture.damage);
  });
  it.each(oracle.fusions)('$id emits the same attacks and first-tick damage', fixture => {
    const start = calculateStartup(fresh), progression = new Progression(fresh.build, {}, start.passives);
    const sim = new CombatSimulation(fresh, progression, seeded(fixture.seed)), enemy = target();
    sim.fused[fixture.id] = true; sim.enemies.push(enemy);
    sim.updateOuter(.02); entities(sim, fixture.initial);
    sim.updateOuter(.02); entities(sim, fixture.after); close(100000 - enemy.hp, fixture.damage);
  });
  it('fusion cadence advances without acquired fusions and resets at the original 3.4s interval', () => {
    const sim = new CombatSimulation(fresh, new Progression(fresh.build, {}, {}), () => .9);
    sim.updateOuter(.02); sim.fused.F001 = true;
    sim.updateOuter(3); expect(sim.vortices).toHaveLength(0);
    sim.updateOuter(.39); expect(sim.vortices).toHaveLength(0);
    sim.updateOuter(.02); expect(sim.vortices).toHaveLength(1);
    expect(sim.directorState().fused).toBe(1);
  });
  it('F001 trail applies to an existing ordinary vortex before removal', () => {
    const sim = new CombatSimulation(fresh, new Progression(fresh.build, {}, {}), () => .2);
    sim.fused.F001 = true;
    sim.vortices.push({ id: 'A026', x: 1800, y: 1200, vx: 85, vy: 0, dmg: 100, r: 82, life: .001, max: 1, tick: .04, follow: false, color: '#82d6b7' });
    sim.updateOuter(.01);
    expect(sim.fields[0]).toMatchObject({ id: 'F001', x: 1800.85, y: 1200, r: 55, life: 1.2 });
    expect(sim.fields[0]!.dmg).toBeCloseTo(55, 10);
    expect(sim.vortices.every(vortex => vortex.id === 'F001')).toBe(true);
  });
});
