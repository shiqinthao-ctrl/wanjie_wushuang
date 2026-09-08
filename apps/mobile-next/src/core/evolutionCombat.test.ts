import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { CombatSimulation } from './CombatSimulation';
import type { Enemy } from './spawnRules';
import { heroForms } from './evolutionCatalog';

const target = (x = 1860): Enemy => ({ id: 'EN001', name: 'target', ai: 'melee', x, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 0, color: '#fff', flash: 0 });
function simulation(hero = 'H001', skills = { A011: 1 } as Record<string, number>) {
  const journey = new RunEvolution(hero), save = { ...structuredClone(fresh), hero };
  const p = new Progression(evolutionBuild(hero), skills, {}, () => .8, journey);
  const sim = new CombatSimulation(save, p, () => .8);
  return { sim, journey };
}
describe('evolution combat mechanics', () => {
  for (const form of heroForms) it(`${form.name} has a distinct attack, ability and awakening`, () => {
    const { sim, journey } = simulation(form.hero); sim.enemies.push(target());
    expect(journey.pick(3, {}, 'hero', form.id)).toBe(true);
    const hp = sim.player.hp, cd = sim.player.skillCd;
    expect(journey.pick(8, { A011: 3 }, 'hero', 'awaken')).toBe(true);
    expect(sim.player.hp).toBe(hp); expect(sim.player.skillCd).toBe(cd);
    sim.basic(); expect(sim.action('skill')).toBe(true); expect(sim.action('skill')).toBe(false);
    sim.player.ult = 100; expect(sim.action('ultimate')).toBe(true);
    sim.updateOuter(.034);
    const render = sim.renderState();
    if (form.id === 'legion') expect(render.summons.length).toBeGreaterThan(0);
    if (form.id === 'void') expect(render.vortices.length).toBeGreaterThan(0);
    if (form.id === 'phoenix') expect(render.projectiles.length).toBeGreaterThanOrEqual(5);
    if (form.id === 'bulwark') { expect(sim.player.shield).toBeGreaterThan(0); expect(render.fields.length).toBeGreaterThan(0); }
    if (form.id === 'dragon' || form.id === 'reaper') expect(sim.enemies[0]!.hp).toBeLessThan(100000);
    sim.destroy(); expect(sim.renderState().summons).toEqual([]);
  });
  it('fireball routes change projectile count, speed and blast radius', () => {
    const volley = simulation(), nova = simulation();
    volley.journey.pick(2, { A011: 3 }, 'route', 'volley'); nova.journey.pick(2, { A011: 3 }, 'route', 'nova');
    volley.sim.cast('A011'); nova.sim.cast('A011');
    expect(volley.sim.projectiles).toHaveLength(3); expect(nova.sim.projectiles).toHaveLength(1);
    expect(nova.sim.projectiles[0]!.explode).toBeGreaterThan(volley.sim.projectiles[0]!.explode);
    expect(nova.sim.projectiles[0]!.vx).toBeLessThan(volley.sim.projectiles[1]!.vx);
  });
  it('orbit follows the player while roaming moves forward', () => {
    const orbit = simulation(), roaming = simulation();
    orbit.journey.pick(2, { A026: 3 }, 'route', 'orbit'); roaming.journey.pick(2, { A026: 3 }, 'route', 'roaming');
    orbit.sim.cast('A026'); roaming.sim.cast('A026');
    orbit.sim.player.x += 100; roaming.sim.player.x += 100;
    orbit.sim.updateOuter(.034); roaming.sim.updateOuter(.034);
    expect(orbit.sim.vortices[0]!.x).toBeGreaterThan(roaming.sim.vortices[0]!.x + 100);
  });
  it('three bonds change actual hit targets, vortex damage and dodge fields', () => {
    const plain = simulation('H001', { A013: 1 }), bonded = simulation('H001', { A013: 1, A015: 1, A026: 1, A011: 1 });
    for (const { sim } of [plain, bonded]) sim.enemies.push(target(1860), target(1930), target(2000), target(2070));
    plain.sim.cast('A013'); bonded.sim.cast('A013');
    expect(bonded.sim.enemies.filter(e => e.hp < 100000).length).toBe(plain.sim.enemies.filter(e => e.hp < 100000).length + 1);
    bonded.sim.action('dodge'); expect(bonded.sim.fields.some(field => field.id === 'H010_BOND')).toBe(true);
    const count = bonded.sim.fields.length; bonded.sim.action('dodge'); expect(bonded.sim.fields).toHaveLength(count);
    const base = simulation('H001', { A026: 1 }), fire = simulation('H001', { A026: 1, A011: 1 });
    for (const { sim } of [base, fire]) { sim.enemies.push(target()); sim.cast('A026'); sim.updateOuter(.01); }
    expect(fire.sim.damageBy.H010_WILDFIRE).toBeGreaterThan(0);
    expect(base.sim.damageBy.H010_WILDFIRE).toBeUndefined();
  });
  it('piercing journey shots cannot repeatedly damage the same target', () => {
    const { sim } = simulation('H012', { A015: 1 }); sim.enemies.push(target(1800));
    sim.projectile('A015', sim.player, 0, 0, 1, 10, { pierce: 4 });
    sim.updateOuter(.01); const hp = sim.enemies[0]!.hp;
    sim.cool.A015 = 10; sim.updateOuter(.01); expect(sim.enemies[0]!.hp).toBe(hp);
  });
  it('guard clones stay at their post, hunter clones follow, and both expire within a bounded budget', () => {
    for (const route of ['guard', 'hunter']) {
      const { sim, journey } = simulation('H012', { S001: 3 }); journey.pick(2, { S001: 3 }, 'route', route);
      sim.cast('S001'); const initial = sim.renderState().summons[0]!;
      sim.player.x += 200; sim.enemies.push(target(initial.x)); sim.cool.S001 = 100;
      sim.updateOuter(.1); const next = sim.renderState().summons[0]!;
      expect(next.x === initial.x).toBe(route === 'guard');
      if (route === 'guard') expect(sim.damageBy.S001).toBeGreaterThan(0);
      else expect(sim.projectiles.some(shot => shot.id === 'S001')).toBe(true);
      for (let i = 0; i < 20; i++) sim.cast('S001'); expect(sim.renderState().summons).toHaveLength(8);
      sim.updateOuter(10); expect(sim.renderState().summons).toHaveLength(0);
    }
  });
  it('lightning can chain through a boss exactly once and cannot jump out of range', () => {
    const { sim } = simulation('H012', { A013: 1, A015: 1 }); sim.time = 270; sim.bossEncounter.updateObjective();
    const boss = sim.boss!; expect(boss).toBeDefined(); boss.x = 1910; boss.y = 1200; boss.shield = 0;
    sim.enemies.push(target(1850), target(1990), target(2500)); const hp = boss.hp;
    sim.cast('A013'); expect(boss.hp).toBeLessThan(hp); expect(sim.enemies[0]!.hp).toBeLessThan(100000); expect(sim.enemies[1]!.hp).toBeLessThan(100000); expect(sim.enemies[2]!.hp).toBe(100000);
  });
  it('awakening increases flame blade count while shields refresh without stacking', () => {
    const { sim, journey } = simulation(); sim.enemies.push(target()); journey.pick(3, {}, 'hero', 'dragon');
    sim.basic(); expect(sim.projectiles).toHaveLength(1); sim.projectiles.length = 0;
    journey.pick(8, { A011: 3 }, 'hero', 'awaken'); sim.basic(); expect(sim.projectiles).toHaveLength(3);
    const guard = simulation(); guard.journey.pick(3, {}, 'hero', 'bulwark');
    guard.sim.action('skill'); const shield = guard.sim.player.shield;
    for (let i = 0; i < 10; i++) { guard.sim.player.skillCd = 0; guard.sim.action('skill'); }
    expect(guard.sim.player.shield).toBe(shield); expect(shield).toBeCloseTo(guard.sim.player.maxHp * .16);
  });
});
