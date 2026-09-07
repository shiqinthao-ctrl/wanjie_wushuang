import { expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { bossHit } from './combatMath';
import { insideTelegraph } from './FirstBoss';
import type { Telegraph } from './FirstBoss';

function simulation(random = () => .8) {
  const sim = new CombatSimulation(fresh, new Progression(fresh.build, {}, {}), random);
  sim.time = 270; sim.bossEncounter.spawn(); sim.boss!.x = 1900; sim.boss!.y = 1200; sim.pet.cd = 100;
  return sim;
}
function expected(sim: CombatSimulation, damage: number, source: string, skill = false) { return bossHit(sim.context, sim.state(), source, damage, sim.boss!, skill).damage; }
it('hero targets Boss ahead of a nearer ordinary enemy, without changing nearest for skill forms', () => {
  const sim = simulation(); sim.spawn(); Object.assign(sim.enemies[0]!, { x: 1790, y: 1200, hp: 1e6 });
  const before = sim.boss!.hp; sim.basic();
  expect(sim.boss!.hp).toBeLessThan(before); expect(sim.enemies[0]!.hp).toBe(1e6);
  sim.action('skill'); expect(sim.player.x).toBe(1950);
  sim.player.x = 1800; sim.cast('A011'); expect(sim.projectiles[0]!.vx).toBeLessThan(0);
});
it('hero basic works with Boss alone; the Boss arc ignores cone angle and Boss radius', () => {
  const sim = simulation(); sim.boss!.x = 1700; const before = sim.boss!.hp;
  sim.basic(); expect(sim.boss!.hp).toBeLessThan(before);
  sim.boss!.x = 1920; const far = sim.boss!.hp; sim.arc(100, 100, 'H001_SLASH', .01);
  expect(sim.boss!.hp).toBe(far);
});
for (const kind of ['bomb', 'projectile', 'field', 'vortex', 'meteor'] as const) it(`${kind} applies its original Boss-specific damage/radius`, () => {
  const sim = simulation(), boss = sim.boss!, before = boss.hp, point = { x: boss.x + 25, y: boss.y };
  let damage = 0;
  if (kind === 'bomb') { sim.bombs.push({ ...point, r: 1, life: 0, max: .2, dmg: 100, color: '#fff' }); damage = expected(sim, 100, 'H010_BOMB'); }
  if (kind === 'projectile') { sim.projectiles.push({ ...point, id: 'A011', vx: 0, vy: 0, r: 1, life: 2, dmg: 100, pierce: 0, split: 0, explode: 50, color: '#fff' }); damage = expected(sim, 100, 'A011', true) + expected(sim, 65, 'A011', true); }
  if (kind === 'field') { sim.fields.push({ ...point, id: 'A021', r: 1, life: 2, max: 2, tick: 0, follow: false, dmg: 100, color: '#fff' }); damage = expected(sim, 80, 'A021', true); }
  if (kind === 'vortex') { sim.vortices.push({ ...point, id: 'A026', r: 1, life: 2, max: 2, tick: 0, follow: false, dmg: 100, color: '#fff', vx: 0, vy: 0 }); damage = expected(sim, 100, 'A026', true); }
  if (kind === 'meteor') { sim.meteors.push({ ...point, id: 'A027', r: 1, life: 0, max: 2, dmg: 100, color: '#fff' }); damage = expected(sim, 100, 'A027', true); }
  sim.updateOuter(.02); expect(before - boss.hp).toBeCloseTo(damage, 8);
});
it('a non-piercing ordinary projectile hit is consumed before the Boss hit test', () => {
  const sim = simulation(); sim.spawn(); Object.assign(sim.enemies[0]!, sim.boss, { hp: 1e6 });
  sim.projectiles.push({ ...sim.boss!, id: 'A011', vx: 0, vy: 0, r: 1, life: 2, dmg: 100, pierce: 0, split: 0, explode: 0, color: '#fff' });
  const hp = sim.boss!.hp; sim.updateOuter(.02); expect(sim.boss!.hp).toBe(hp); expect(sim.projectiles).toHaveLength(0);
});
it('barrel radius is strict; mechanism hits Boss without deleting cast telegraphs', () => {
  const sim = simulation(), barrel = sim.map.renderState().interactables.find(item => item.type === 'barrel')!;
  Object.assign(sim.player, { x: barrel.x, y: barrel.y }); Object.assign(sim.boss!, { x: barrel.x + 204, y: barrel.y });
  const before = sim.boss!.hp, amount = expected(sim, sim.player.atk * 9.5, 'MAP_BARREL');
  sim.map.useNearest(); expect(before - sim.boss!.hp).toBeCloseTo(amount, 8);
  sim.boss!.castCd = 0; sim.boss!.castLock = 0; sim.bossEncounter.updateAI(.02);
  const warning = structuredClone(sim.bossEncounter.telegraphs), mechanism = sim.map.renderState().interactables.find(item => item.type === 'mechanism')!;
  Object.assign(sim.player, { x: mechanism.x, y: mechanism.y }); const hp = sim.boss!.hp;
  sim.map.useNearest(); expect(hp - sim.boss!.hp).toBeCloseTo(expected(sim, sim.player.atk * 4, 'MAP_MECHANISM'), 8);
  expect(sim.bossEncounter.telegraphs).toEqual(warning);
});
it('elite kill gear uses < .45 and duplicate damage cannot repeat the drop', () => {
  for (const roll of [.449, .45]) {
    const sim = simulation(() => roll); sim.spawn({ elite: true }); const enemy = sim.enemies[0]!; enemy.hp = 1;
    sim.hit(enemy, 1e6, 'H001_SLASH'); sim.hit(enemy, 1e6, 'H001_SLASH');
    expect(sim.drops).toHaveLength(roll < .45 ? 1 : 0); if (sim.drops[0]) expect(sim.drops[0]).toMatchObject({ source: 'elite', rarity: 'purple' });
  }
});
it('line uses clamped segment; cone wraps angles; circles include the boundary', () => {
  const base = { x: 0, y: 0, name: 'fixture', life: 1, max: 1, damage: 20, color: '#fff', resolved: false };
  const line: Telegraph = { ...base, type: 'line', x2: 10, y2: 0, width: 4, moveBoss: true };
  expect(insideTelegraph({ x: 13, y: 0 }, line)).toBe(false); expect(insideTelegraph({ x: 5, y: 2 }, line)).toBe(true);
  expect(insideTelegraph({ x: -5, y: -.01 }, { ...base, type: 'cone', angle: Math.PI - .01, range: 10, arc: .2 })).toBe(true);
  expect(insideTelegraph({ x: 3, y: 4 }, { ...base, type: 'circle', r: 5 })).toBe(true);
});
