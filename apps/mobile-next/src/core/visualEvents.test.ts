import { expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import type { Enemy } from './spawnRules';
import { EffectTimeline } from '../game/EffectTimeline';

function setup() {
  const journey = new RunEvolution('H010');
  const skills = { A013: 3, G2_FROST: 3, S001: 3 };
  const progression = new Progression(evolutionBuild('H010'), skills, {}, () => .8, journey);
  journey.pick(2, skills, 'route', 'relay');
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero: 'H010' }, progression, () => .8);
  for (const x of [1860, 1930, 2000]) sim.enemies.push({ id: 'EN001', name: 'target', ai: 'melee', x, y: 1200, hp: 100, maxHp: 100, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 100, color: '#fff', flash: 0 } as Enemy);
  return sim;
}

it('copies real chain order even when hit targets die and coordinates later change', () => {
  const sim = setup();
  const first = sim.enemies[0]!;
  sim.cast('A013');
  const chain = sim.takeEvents().find(event => event.type === 'lightning');
  expect(chain?.type).toBe('lightning');
  if (chain?.type !== 'lightning') throw new Error('Missing chain');
  expect(chain.points.map(point => point.x)).toEqual([1800, 1860, 1930, 2000]);
  first.x = 900; sim.player.x = 500;
  expect(chain.points.map(point => point.x)).toEqual([1800, 1860, 1930, 2000]);
  expect(Object.isFrozen(chain.points)).toBe(true);
  expect(chain.points.every(Object.isFrozen)).toBe(true);
});

it('emits no chain on a miss or an area-only thunderstrike', () => {
  const sim = setup(); sim.enemies.length = 0; sim.cast('A013');
  expect(sim.takeEvents().some(event => event.type === 'lightning')).toBe(false);
  const journey = new RunEvolution('H010'); journey.pick(2, { A013: 3 }, 'route', 'thunderstrike');
  const strike = new CombatSimulation({ ...structuredClone(fresh), hero: 'H010' }, new Progression(evolutionBuild('H010'), { A013: 3 }, {}, () => .8, journey), () => .8);
  strike.enemies.push(...setup().enemies); strike.cast('A013');
  expect(strike.takeEvents().some(event => event.type === 'lightning')).toBe(false);
});

it('enabled, disabled and unconsumed effects give identical damage, slow, drops and state', () => {
  const runs = [setup(), setup(), setup()], views = [new EffectTimeline(), new EffectTimeline()];
  views[1]!.setEnabled(false);
  for (let frame = 0; frame < 20; frame++) for (const [index, sim] of runs.entries()) {
    sim.cast('G2_FROST'); sim.cast('A013'); sim.cast('S001'); sim.beginFrame(.01); sim.updateOuter(.01);
    views[index]?.advance(sim.takeEvents(), .01);
  }
  for (const other of runs.slice(1)) {
    expect(other.renderState()).toEqual(runs[0]!.renderState());
    expect(other.damageBy).toEqual(runs[0]!.damageBy);
    expect(other.kills).toBe(runs[0]!.kills);
  }
});
