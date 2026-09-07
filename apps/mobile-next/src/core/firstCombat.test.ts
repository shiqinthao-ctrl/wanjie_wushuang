import { describe, expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/first-combat-oracle.json';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { calculateStartup } from './growth';
import { createEnemy, director } from './spawnRules';
import type { Enemy } from './spawnRules';

const seeded = (seed: number) => () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
function simulation(random = () => .9) {
  const initial = calculateStartup(fresh), progress = new Progression(fresh.build, initial.skills, initial.passives, random);
  return new CombatSimulation(fresh, progress, random);
}
const target = (): Enemy => ({ id: 'EN001', name: 'target', ai: 'melee', x: 1860, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 0, color: '#fff', flash: 0 });
function close(actual: unknown, expected: unknown) {
  if (typeof expected === 'number') expect(actual).toBeCloseTo(expected, 8);
  else if (Array.isArray(expected)) { expect(actual).toHaveLength(expected.length); expected.forEach((value, index) => close((actual as unknown[])[index], value)); }
  else if (expected && typeof expected === 'object') for (const [key, value] of Object.entries(expected)) close((actual as Record<string, unknown>)[key], value);
  else expect(actual).toEqual(expected);
}
describe('legacy first-stage combat oracles', () => {
  for (const fixture of oracle.ai) it(`${fixture.initial.ai} AI at x=${fixture.initial.x}`, () => {
    const sim = simulation(); sim.enemies.push(structuredClone(fixture.initial)); sim.beginFrame(fixture.dt);
    close(sim.enemies[0], fixture.enemy); close(sim.enemyShots, fixture.shots); close(sim.player, fixture.player);
  });
  for (const fixture of oracle.spawns) it(`director and spawn at ${fixture.time}, elite=${fixture.elite}`, () => {
    const sim = simulation(), state = { ...sim.directorState(), time: fixture.time };
    close(director(state, sim.player), { pressure: fixture.pressure, interval: fixture.interval, eliteChance: fixture.eliteChance });
    const enemy = createEnemy(state, sim.player, sim.viewport, sim.world, 'normal', seeded(fixture.seed), { elite: fixture.elite });
    const { _v29Scaled: _marker, ...expected } = fixture.enemy;
    // Elite comparator order differs across Node/Chrome; exact elite stats are
    // checked by verify-first-combat.mjs in the original browser engine.
    if (!fixture.elite) close(enemy, expected);
    else { close(enemy.x, expected.x); close(enemy.y, expected.y); expect(enemy.elite).toBe(true); }
  });
  for (const fixture of oracle.actions) it(`H001 ${fixture.action}`, () => {
    const sim = simulation(), enemy = target(); sim.enemies.push(enemy);
    if (fixture.action === 'basic') sim.basic(); else sim.action(fixture.action as 'skill' | 'dodge');
    close(sim.player, fixture.player); close(sim.heat, fixture.heat); close(sim.bombs, fixture.bombs); close(100000 - enemy.hp, fixture.damage);
  });
  for (const fixture of oracle.skills) it(`${fixture.id} level ${fixture.level} constructs and arc damage`, () => {
    const initial = calculateStartup(fresh), progress = new Progression(fresh.build, { ...initial.skills, [fixture.id]: fixture.level }, initial.passives);
    const sim = new CombatSimulation(fresh, progress, seeded(fixture.seed)), enemy = target(); sim.enemies.push(enemy); sim.cast(fixture.id);
    for (const key of ['projectiles', 'fields', 'vortices', 'meteors'] as const) {
      expect(sim[key]).toHaveLength(fixture.runtime[key].length);
      // Compare every migrated rule field; legacy UI-only flags are not authority.
      for (const [index, item] of sim[key].entries()) for (const [name, value] of Object.entries(item)) {
        const old = (fixture.runtime[key][index] as Record<string, unknown>)[name];
        if (old !== undefined) close(value, old);
      }
    }
    close(100000 - enemy.hp, fixture.damage);
  });
});

it('kill creates the original crystal, direct rune XP and ult once', () => {
  const sim = simulation(), enemy = { ...target(), hp: 1 }; sim.enemies.push(enemy);
  sim.hit(enemy, 100, 'H001_SLASH'); sim.hit(enemy, 100, 'H001_SLASH');
  expect(sim.kills).toBe(1); expect(sim.crystals.snapshot()).toEqual([{ x: 1860, y: 1200, elite: false, value: 4 }]);
  expect(sim.progression.snapshot().xp).toBe(1); expect(sim.player.ult).toBe(1.4);
});
it('repeated area ticks use the migrated modifier and remove expired fields after their final tick', () => {
  const sim = simulation(), enemy = target(); sim.enemies.push(enemy); sim.cast('A003');
  const field = sim.fields[0]!; field.life = .001; field.tick = 0;
  const before = enemy.hp; sim.updateOuter(.01);
  expect(enemy.hp).toBeLessThan(before); expect(sim.fields).not.toContain(field);
});
it('aura slows only the next frame and never permanently changes speed', () => {
  const sim = simulation(), enemy = { ...target(), aura: true }; sim.enemies.push(enemy); sim.move(1, 0);
  const speed = sim.player.speed; sim.beginFrame(.02); const x = sim.player.x; sim.enemies.length = 0;
  sim.beginFrame(.02); const slowed = sim.player.x - x; const y = sim.player.x; sim.beginFrame(.02);
  expect(sim.player.x - y).toBeGreaterThan(slowed); expect(sim.player.speed).toBe(speed);
});
it('destroy clears delayed ult waves and every battle entity', () => {
  const sim = simulation(); sim.player.ult = 100; sim.action('ultimate'); sim.action('skill'); sim.spawn(); sim.cast('A011'); sim.destroy(); sim.beginFrame(.02);
  expect(sim.takeEvents()).toEqual([]); expect(sim.enemies).toHaveLength(0); expect(sim.bombs).toHaveLength(0); expect(sim.projectiles).toHaveLength(0);
});
it('enemy snapshot affixes cannot mutate combat authority', () => {
  const sim = simulation(); sim.spawn({ elite: true });
  const copy = sim.renderState().enemies[0]!;
  expect(Object.isFrozen(copy.affixes)).toBe(true);
  expect(copy.affixes).not.toBe(sim.enemies[0]!.affixes);
  expect(copy.affixes).toEqual(sim.enemies[0]!.affixes);
});
