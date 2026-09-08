import { expect, it } from 'vitest';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import type { FirstStageEvents } from './firstEvents';
import fresh from '../data/freshSave.json';

// Synthetic frame-order fixtures; natural browser tests never inject these inputs.
function setup() {
  const save = structuredClone(fresh), core = new GameCore(save, () => .8); core.start();
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  const encounters = (core as unknown as { encounters: FirstStageEvents }).encounters;
  return { save, core, sim, encounters };
}
it('captures once before destruction, detached from preparation, damage and drops', () => {
  const { save, core, sim } = setup();
  expect(core.finalRun()).toBeUndefined();
  save.build.active.length = 0;
  sim.drops.push({ ...structuredClone(fresh.inventory.gearInstances[0]!), mystery: { keep: 7 } });
  sim.player.hp = 0; core.advance(.02);
  const result = core.finalRun()!;
  expect(result.endReason).toBe('defeat'); expect(result.build).toEqual(fresh.build);
  expect(result.drops).toHaveLength(1); expect(Object.isFrozen(result.drops[0]!.mystery)).toBe(true);
  sim.drops[0]!.uid = 'changed'; sim.kills = 999; core.destroy(); core.advance(.02);
  expect(core.finalRun()).toBe(result); expect(result.drops[0]!.uid).not.toBe('changed');
  expect(result.kills).toBe(0);
});
it('death uses prior score; event opening skips the bottom-of-frame score update', () => {
  const { core, sim } = setup(); core.advance(.02);
  sim.time = 44.99; sim.kills = 20; core.advance(.02);
  expect(core.snapshot().status).toBe('encounter');
  core.resolveEvent(1, 'skip', { affordable: true, gold: 6000 });
  sim.player.hp = 0; core.advance(.02);
  expect(core.finalRun()).toMatchObject({ kills: 20, modeScore: 0 });
});
it('loot and completion guards freeze score while counting a defeated Boss', () => {
  const { core, sim, encounters } = setup();
  while (encounters.open(360)) encounters.resolve(encounters.snapshot().offer!.token, 'skip', { affordable: true, gold: 6000 });
  sim.time = 269.99; core.advance(.02); sim.hitBoss(1e9, 'MAP_BARREL');
  for (let i = 0; i < 10; i++) core.advance(.02);
  core.pickBossLoot(core.snapshot().boss.offer![0]!.uid);
  for (let i = 0; i < 60; i++) core.advance(.02);
  expect(core.finalRun()).toMatchObject({ endReason: 'victory', modeBosses: 1, modeScore: 41 });
  expect(core.finalRun()!.damageBy.MAP_BARREL).toBeGreaterThan(0);
  expect(core.finalRun()!.drops).toHaveLength(2);
});
it('damage records the actual computed hit without an extra RNG call', () => {
  const { sim } = setup(); sim.spawn(); const enemy = sim.enemies[0]!, hp = enemy.hp;
  sim.hit(enemy, 1, 'H001_SLASH');
  expect(sim.damageBy.H001_SLASH).toBeCloseTo(hp - enemy.hp, 10);
});
it('leaving a live run produces no settlement record', () => {
  const { core } = setup(); core.advance(.02); core.destroy(); expect(core.finalRun()).toBeUndefined();
});
