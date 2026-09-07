import { expect, it } from 'vitest';
import oracle from '../../../../tasks/mobile-modernization/baseline/first-map-oracle.json';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { calculateStartup } from './growth';
import { Progression } from './progression';
import { GameCore } from './GameCore';

function simulation() {
  const initial = calculateStartup(fresh);
  const sim = new CombatSimulation(fresh, new Progression(fresh.build, initial.skills, initial.passives, () => .5), () => .5);
  sim.player.hp = 100;
  return sim;
}
it('preserves the six named legacy map positions', () => {
  expect(simulation().map.renderState().interactables).toEqual(oracle.layout);
});
for (const fixture of oracle.interactions) it(`legacy ${fixture.type} at XP ${fixture.xp}`, () => {
  const sim = simulation(), item = sim.map.renderState().interactables.find(item => item.type === fixture.type)!;
  sim.player.x = item.x; sim.player.y = item.y;
  sim.enemies.push(...structuredClone(fixture.targets)); sim.progression.gain(fixture.xp);
  expect(sim.map.useNearest()).toBe(true);
  for (const key of ['hp', 'maxHp', 'atk'] as const) expect(sim.player[key]).toBeCloseTo(fixture.player[key], 8);
  sim.enemies.forEach((enemy, index) => expect(100000 - enemy.hp).toBeCloseTo(fixture.damages[index]!, 8));
  expect(sim.map.snapshot()).toMatchObject({ used: fixture.used, bonusGold: fixture.bonusGold, hazardSuppress: fixture.hazardSuppress });
  const { level, xp, xpNeed, choice } = sim.progression.snapshot();
  expect({ level, xp, xpNeed, choosing: !!choice }).toEqual(fixture.progression);
  expect(sim.map.useNearest()).toBe(false);
  expect(sim.map.snapshot().used).toBe(1);
});
for (const fixture of oracle.hazards) it(`fireline at ${fixture.time} suppression ${fixture.suppress}`, () => {
  const sim = simulation(); sim.time = fixture.time;
  if (fixture.suppress) {
    const mechanism = sim.map.renderState().interactables.find(item => item.type === 'mechanism')!;
    sim.player.x = mechanism.x; sim.player.y = mechanism.y; sim.map.useNearest();
    sim.map.advanceHazards(25 - fixture.suppress);
    sim.player.x = 1800; sim.player.y = 1200;
  }
  sim.map.advanceHazards(fixture.dt);
  expect(sim.player.hp).toBeCloseTo(fixture.hp, 8); expect(sim.player.inv).toBeCloseTo(fixture.inv, 8);
  expect(sim.map.snapshot().hazardSuppress).toBeCloseTo(fixture.suppressAfter, 8);
  const actual = sim.map.renderState().hazards;
  expect(actual).toHaveLength(fixture.hazards.length);
  fixture.hazards.forEach((expected, index) => {
    for (const [key, value] of Object.entries(expected)) {
      const got = actual[index]![key as keyof typeof expected];
      if (typeof value === 'number') expect(got).toBeCloseTo(value, 8); else expect(got).toEqual(value);
    }
  });
});
it('uses each timed recovery once and caps HP', () => {
  const sim = simulation();
  for (const fixture of oracle.recoveries) {
    sim.time = fixture.time; expect(sim.map.recover()).toBe(fixture.fired); expect(sim.player.hp).toBeCloseTo(fixture.hp, 8);
  }
});
it('handles overdue recoveries one per update', () => {
  const sim = simulation(); sim.time = 330;
  for (let i = 0; i < 5; i++) expect(sim.map.recover()).toBe(true);
  expect(sim.map.recover()).toBe(false); expect(sim.player.hp).toBe(sim.player.maxHp);
});
it('accepts the exact 74-unit interaction boundary and rejects 74.01', () => {
  const sim = simulation(), item = sim.map.renderState().interactables[0]!;
  sim.player.x = item.x + 74.01; sim.player.y = item.y; expect(sim.map.useNearest()).toBe(false);
  sim.player.x = item.x + 74; expect(sim.map.useNearest()).toBe(true);
});
it('mechanism clears a live fireline, then suppression skips the expiry frame', () => {
  const sim = simulation(); sim.time = 26.01; sim.map.advanceHazards(.02);
  expect(sim.map.renderState().hazards).toHaveLength(1);
  const item = sim.map.renderState().interactables.find(item => item.type === 'mechanism')!;
  sim.player.x = item.x; sim.player.y = item.y; sim.map.useNearest();
  expect(sim.map.renderState().hazards).toHaveLength(0);
  sim.time = 52.01; sim.map.advanceHazards(25); expect(sim.map.renderState().hazards).toHaveLength(0);
});
it('does not expose mutable map authority and clears map entities on destroy', () => {
  const sim = simulation(), item = sim.map.renderState().interactables[0]!;
  expect(Object.isFrozen(item)).toBe(true); sim.destroy();
  expect(sim.map.renderState()).toEqual({ interactables: [], hazards: [] });
});
it('core rejects interactions before start, while paused or after destroy', () => {
  expect(new GameCore().interact()).toBe(false);
  const core = new GameCore(); core.start(); core.pause();
  expect(core.interact()).toBe(false); const before = core.snapshot(); core.advance(.034);
  expect(core.snapshot()).toEqual(before); core.destroy(); expect(core.interact()).toBe(false);
});
it('core supply interaction opens a choice and blocks duplicate actions until it resumes', () => {
  const core = new GameCore(); core.start();
  // Synthetic unit boundary fixture; browser tests use only visible movement/input.
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  const supply = sim.map.renderState().interactables.find(item => item.type === 'supply')!;
  sim.player.x = supply.x; sim.player.y = supply.y; sim.progression.gain(10);
  expect(core.snapshot().map.target?.type).toBe('supply');
  expect(core.interact()).toBe(true); expect(core.snapshot().map.bonusGold).toBe(180);
  expect(core.interact()).toBe(false);
  expect(core.snapshot().status).toBe('choosing');
  const before = core.snapshot(), choice = before.choice!, option = choice.options[0]!;
  core.advance(.034); expect(core.snapshot()).toEqual(before);
  core.pause(); core.resume(); expect(core.snapshot().status).toBe('choosing');
  expect(core.choose(choice.token, option.kind, option.id)).toBe(true);
  expect(core.snapshot().status).toBe('running');
});
it('core checks lethal damage before timed recovery and rejects ended actions', () => {
  const core = new GameCore(); core.start();
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  sim.time = 74.99; sim.player.hp = 0; core.advance(.02);
  expect(core.snapshot().status).toBe('ended'); expect(core.snapshot().hp).toBe(0);
  expect(core.interact()).toBe(false); expect(core.snapshot().map.notice).toBe('');
});
it('a fireline applies its final frame before it expires', () => {
  const sim = simulation(); sim.time = 26.01; sim.map.advanceHazards(.02);
  sim.time = 30.01; sim.player.inv = 0; const before = sim.player.hp;
  sim.map.advanceHazards(4);
  expect(sim.map.renderState().hazards).toHaveLength(0); expect(sim.player.hp).toBeLessThan(before);
});
