import { describe, expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/boss-oracle.json';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { calculateStartup } from './growth';
import type { GearInstance } from './saveTypes';

function simulation(difficulty = 'normal') {
  const save = { ...fresh, difficulty }, start = calculateStartup(save);
  return new CombatSimulation(save, new Progression(save.build, start.skills, start.passives), () => .8, [] as GearInstance[], () => oracle.clock);
}
function close(actual: unknown, expected: unknown) {
  if (typeof expected === 'number') expect(actual).toBeCloseTo(expected, 8);
  else if (expected && typeof expected === 'object') for (const [key, value] of Object.entries(expected)) close((actual as Record<string, unknown>)[key], value);
  else expect(actual).toEqual(expected);
}

describe('B001 effective legacy oracle', () => {
  for (const item of oracle.spawns) it(`spawn ${item.difficulty} at ${item.width}`, () => {
    const sim = simulation(item.difficulty); sim.resize(item.width, item.height);
    sim.time = 269.99; expect(sim.bossEncounter.spawn()).toBe(false);
    sim.time = 270; expect(sim.bossEncounter.spawn()).toBe(true);
    const old = item.boss;
    close(sim.boss, { id: old.id, hp: old.hp, maxHp: old.maxHp, x: old.x, y: old.y, r: old.r, phase: old.phase, castCd: old.v25CastCd, castLock: old.castLock, shield: old.shield, skillIndex: old.v25SkillIndex });
    expect(sim.bossEncounter.spawn()).toBe(false);
  });
  for (const phase of [1, 2, 3]) it(`phase ${phase}, three attacks, actual hit geometry and charge endpoint`, () => {
    const sim = simulation(); sim.time = 270; sim.bossEncounter.spawn();
    sim.boss!.hp = sim.boss!.maxHp * [0, 1, .7, .35][phase]!;
    sim.bossEncounter.updateAI(.02);
    expect(sim.enemies.map(enemy => ({ elite: enemy.elite }))).toEqual(oracle.casts.find(item => item.phase === phase)!.transition.enemies);
    for (const fixture of oracle.casts.filter(item => item.phase === phase)) {
      sim.boss!.castCd = 0; sim.boss!.castLock = 0; sim.bossEncounter.updateAI(.02);
      close(sim.bossEncounter.telegraphs[0], fixture.warning);
      const before = sim.player.hp; sim.bossEncounter.updateTelegraphs(fixture.warning.life);
      close(before - sim.player.hp, fixture.hpLoss);
      close(sim.boss, { x: fixture.after.x, y: fixture.after.y, castLock: fixture.after.castLock, castCd: fixture.after.v25CastCd });
      expect(sim.bossEncounter.telegraphs).toHaveLength(0); sim.player.inv = 0;
    }
  });
  for (const fixture of oracle.hits) it(`damage ${fixture.source}, shield=${fixture.shield}`, () => {
    const sim = simulation(); sim.time = 270; sim.bossEncounter.spawn(); sim.boss!.shield = fixture.shield;
    const before = sim.boss!.hp; sim.hitBoss(100, fixture.source, fixture.source === 'A011');
    close(before - sim.boss!.hp, fixture.hpLoss); close(sim.boss!.shield, fixture.shieldAfter);
  });
});

it('Boss loot waits for a selection, gives two items once, and never respawns', () => {
  const sim = simulation(); sim.time = 359.99; sim.bossEncounter.spawn();
  sim.hitBoss(1e9, 'MAP_BARREL'); sim.hitBoss(1e9, 'MAP_BARREL');
  expect(sim.drops).toHaveLength(1); expect(sim.bossEncounter.snapshot().lootShown).toBe(true);
  expect(sim.bossEncounter.updateObjective()).toBeUndefined();
  sim.time += .17; sim.bossEncounter.updateObjective(); expect(sim.bossEncounter.snapshot().offer).toBeUndefined();
  sim.time += .02; expect(sim.bossEncounter.updateObjective()).toBeUndefined();
  const offer = sim.bossEncounter.snapshot().offer!; expect(offer).toHaveLength(3);
  expect(sim.bossEncounter.pick('invalid')).toBe(false);
  expect(sim.bossEncounter.pick(offer[1]!.uid!)).toBe(true);
  expect(sim.bossEncounter.pick(offer[1]!.uid!)).toBe(false); expect(sim.drops).toHaveLength(2);
  const time = sim.time; expect(sim.bossEncounter.updateObjective()).toBeUndefined();
  sim.time = time + .74; expect(sim.bossEncounter.updateObjective()).toBeUndefined();
  sim.time = time + .76; expect(sim.bossEncounter.updateObjective()).toBeUndefined();
  sim.time += .26; expect(sim.bossEncounter.updateObjective()).toBe('victory');
  expect(sim.bossEncounter.spawn()).toBe(false);
});
it('times out with a living Boss; missing loot cannot accidentally complete', () => {
  const sim = simulation(); sim.time = 360;
  expect(sim.bossEncounter.updateObjective()).toBe('timeout');
  sim.hitBoss(1e9, 'MAP_BARREL'); sim.time += .2; sim.bossEncounter.updateObjective();
  sim.bossEncounter.pick(sim.bossEncounter.snapshot().offer![0]!.uid!); sim.drops.length = 0;
  sim.time += 10; expect(sim.bossEncounter.updateObjective()).toBeUndefined();
});
