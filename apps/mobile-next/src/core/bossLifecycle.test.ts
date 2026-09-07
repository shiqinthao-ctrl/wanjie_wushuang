import { expect, it } from 'vitest';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import type { FirstStageEvents } from './firstEvents';

// Synthetic rule fixtures only; no production state injection API.
function setup(time = 269.99) {
  const core = new GameCore(undefined, () => .8); core.start();
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  const encounters = (core as unknown as { encounters: FirstStageEvents }).encounters;
  while (encounters.open(360)) encounters.resolve(encounters.snapshot().offer!.token, 'skip', { affordable: true, gold: 6000 });
  sim.time = time; sim.player.inv = 100; core.advance(.02);
  return { core, sim };
}
function loot() {
  const fixture = setup(); fixture.sim.hitBoss(1e9, 'MAP_BARREL');
  for (let i = 0; i < 10; i++) fixture.core.advance(.02);
  return fixture;
}
it('spawns after outer updates, exposes immutable Boss and telegraph snapshots', () => {
  const { core, sim } = setup();
  expect(core.snapshot().boss.boss?.id).toBe('B001');
  expect(Object.isFrozen(core.renderState().boss)).toBe(true);
  sim.boss!.castCd = 0; sim.boss!.castLock = 0; core.advance(.02);
  expect(core.renderState().telegraphs).toHaveLength(1);
  expect(Object.isFrozen(core.renderState().telegraphs[0])).toBe(true);
});
it('blocks chest claims immediately at death and freezes delayed loot while paused', () => {
  const { core, sim } = setup(); sim.hitBoss(1e9, 'MAP_BARREL');
  expect(core.claimChest(0)).toBe(false); expect(core.snapshot().encounter.gearCount).toBe(1);
  core.pause(); for (let i = 0; i < 20; i++) core.advance(.034);
  expect(core.snapshot().boss.offer).toBeUndefined(); core.resume();
  for (let i = 0; i < 10; i++) core.advance(.02);
  expect(core.snapshot().status).toBe('boss-loot');
  expect(core.snapshot().boss.offer).toHaveLength(3);
});
it('restores the same paused loot, rejects stale or duplicate picks, then completes once', () => {
  const { core } = loot(), offer = core.snapshot().boss.offer!, uid = offer[0]!.uid!;
  expect(core.pickBossLoot('invalid')).toBe(false);
  core.pause(); expect(core.pickBossLoot(uid)).toBe(false); core.resume();
  expect(core.snapshot().status).toBe('boss-loot'); expect(core.snapshot().boss.offer).toEqual(offer);
  expect(core.pickBossLoot(uid)).toBe(true); expect(core.pickBossLoot(uid)).toBe(false);
  expect(core.snapshot().encounter.gearCount).toBe(2);
  for (let i = 0; i < 60; i++) core.advance(.02);
  expect(core.snapshot()).toMatchObject({ status: 'ended', endReason: 'victory' });
  const snapshot = core.snapshot(); core.advance(.02); core.resume(); expect(core.snapshot()).toEqual(snapshot);
});
it('death beats any pending loot; time alone cannot defeat a Boss already killed', () => {
  const { core, sim } = setup(359.97); sim.hitBoss(1e9, 'MAP_BARREL');
  core.advance(.034); expect(core.snapshot().status).toBe('running');
  sim.player.hp = 0; core.advance(.02);
  expect(core.snapshot()).toMatchObject({ status: 'ended', endReason: 'defeat' });
  expect(core.pickBossLoot('anything')).toBe(false);
  const timeout = setup(359.99); expect(timeout.core.snapshot()).toMatchObject({ status: 'ended', endReason: 'timeout' });
});
it('destroy removes Boss, pending warnings and offers without rewards or later resurrection', () => {
  const { core, sim } = loot(), uid = core.snapshot().boss.offer![0]!.uid!;
  core.destroy(); expect(core.pickBossLoot(uid)).toBe(false);
  sim.bossEncounter.updateObjective(); expect(sim.bossEncounter.spawn()).toBe(false);
  expect(core.renderState().telegraphs).toHaveLength(0); expect(core.snapshot().boss.offer).toBeUndefined();
  expect(core.snapshot().encounter.gearCount).toBe(1);
});
it('Boss tactics guide prioritizes a nearby usable object, then ready barrel, then mechanism', () => {
  const { core, sim } = setup(), objects = sim.map.renderState().interactables;
  const barrel = objects.find(item => item.type === 'barrel')!, mechanism = objects.find(item => item.type === 'mechanism')!;
  Object.assign(sim.boss!, { x: barrel.x, y: barrel.y });
  expect(core.snapshot().map.target?.id).toBe(barrel.id);
  Object.assign(sim.player, { x: mechanism.x, y: mechanism.y });
  expect(core.snapshot().map.target?.id).toBe(mechanism.id); expect(core.interact()).toBe(true);
  Object.assign(sim.player, { x: barrel.x, y: barrel.y }); expect(core.interact()).toBe(true);
  sim.player.x = 1800; sim.player.y = 1200;
  expect(core.snapshot().map.target?.type).toBe('barrel');
});
