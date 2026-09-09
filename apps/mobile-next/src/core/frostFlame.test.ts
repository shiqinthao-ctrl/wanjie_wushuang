import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { damageMultiplier, enemyHit, skillModifier, sourceElement } from './combatMath';
import type { Enemy } from './spawnRules';
import { bondRequirements, choiceAdvice, routeAdvice } from '../ui/buildAdvice';

const enemy = (x = 1860, elite = false): Enemy => ({ id: 'EN001', name: 'target', ai: 'melee', x, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite, affixes: [], attack: 0, skill: 0, damage: 10, speed: 100, color: '#fff', flash: 0 });
function setup(skills: Record<string, number> = {}, passives: Record<string, number> = {}, classic = false) {
  const journey = classic ? undefined : new RunEvolution('H001');
  const progression = new Progression(evolutionBuild('H001'), skills, passives, () => .8, journey);
  const sim = new CombatSimulation(structuredClone(fresh), progression, () => .8);
  return { journey, progression, sim };
}
function form(awaken = false, skills = { G2_FROST: 3, A011: 3 }) {
  const run = setup(skills);
  expect(run.journey!.pick(3, skills, 'hero', 'frostflame')).toBe(true);
  if (awaken) expect(run.journey!.pick(8, skills, 'hero', 'awaken')).toBe(true);
  return run;
}

describe('G5 frost-flame evolution', () => {
  it('gates H001 form and awakening and guides a paid frost skill without granting it', () => {
    const { journey: j, progression: p } = setup({ A011: 1 });
    expect(j!.pick(2, {}, 'hero', 'frostflame')).toBe(false);
    expect(new RunEvolution('H010').pick(3, {}, 'hero', 'frostflame')).toBe(false);
    expect(j!.special(3, {}).map(o => o.id)).toEqual(['dragon', 'bulwark', 'frostlord', 'frostflame']);
    expect(j!.pick(3, {}, 'hero', 'frostflame')).toBe(true);
    expect(j!.snapshot({ A011: 1 }).bonds.find(b => b.id === 'thermalshock')!.active).toBe(false);
    expect(j!.snapshot({}).skill).toBe('霜焰剑域'); expect(j!.snapshot({}).ult).toBe('冰火天倾');
    expect(p.snapshot().skills.G2_FROST).toBeUndefined();
    p.gain(26); p.checkLevel(); const choice = p.snapshot().choice!;
    expect(choice.options.some(o => o.id === 'G2_FROST')).toBe(true);
    expect(p.pick(choice.token, 'active', 'G2_FROST')).toBe(true);
    expect(p.snapshot().skills.G2_FROST).toBe(1);
    expect(j!.signature({ G2_FROST: 2 })).toBe('G2_FROST');
    expect(j!.signature({ G2_FROST: 3 })).toBeUndefined();
    expect(j!.pick(7, { A011: 3 }, 'hero', 'awaken')).toBe(false);
    expect(j!.pick(8, { A011: 2 }, 'hero', 'awaken')).toBe(false);
    expect(j!.pick(8, { A011: 3 }, 'hero', 'awaken')).toBe(true);
  });
  it.each([false, true])('basic chills nearby enemies before firing one flame blade, awakened=%s', awakened => {
    const { sim } = form(awakened);
    const near = enemy(), edge = enemy(1940), far = enemy(1960); sim.enemies.push(near, edge, far);
    sim.basic();
    expect(near.chilledUntil).toBe(1.2);
    expect(Boolean(edge.chilledUntil)).toBe(awakened); expect(far.chilledUntil).toBeUndefined();
    expect(sim.damageBy.G5_FROST_BASIC).toBeGreaterThan(0);
    expect(sim.projectiles).toHaveLength(1);
    expect(sim.projectiles[0]).toMatchObject({ id: 'G5_FIRE_BASIC', dmg: sim.player.atk * .8, pierce: awakened ? 3 : 1, vx: 440, vy: 0, color: '#ffae78' });
    const empty = form(awakened).sim; empty.basic(); expect(empty.projectiles).toHaveLength(0);
  });
  it.each([false, true])('skill chills then leaves a fixed flame field and honors cooldown, awakened=%s', awakened => {
    const { sim } = form(awakened); const target = enemy(2000); sim.enemies.push(target);
    const expectedCd = 6 * Math.max(.55, 1 - (sim.context.gear.cdr || 0));
    expect(sim.action('skill')).toBe(true); expect(sim.player.skillCd).toBe(expectedCd);
    expect(Boolean(target.chilledUntil)).toBe(awakened);
    expect(sim.fields).toHaveLength(1);
    expect(sim.fields[0]).toMatchObject({ id: 'G5_FIRE_E', x: 1800, y: 1200, r: awakened ? 180 : 130, life: awakened ? 5 : 3, dmg: sim.player.atk * .3, follow: false });
    expect(sim.action('skill')).toBe(false); expect(sim.fields).toHaveLength(1);
    sim.player.x += 100; sim.updateOuter(.01); expect(sim.fields.find(f => f.id === 'G5_FIRE_E')!.x).toBe(1800);
  });
  it('ultimate spends exactly 100 gauge, chills before fire, and cannot repeat', () => {
    const { sim } = form(); const target = enemy(); sim.enemies.push(target);
    sim.player.ult = 99; expect(sim.action('ultimate')).toBe(false); expect(target.hp).toBe(target.maxHp);
    sim.player.ult = 100; expect(sim.action('ultimate')).toBe(true); expect(sim.player.ult).toBe(0);
    expect(target.chilledUntil).toBe(3);
    const expectedFire = enemyHit(sim.context, sim.state(), 'G5_FIRE_R', sim.player.atk * 4 * 1.3, false, false, true).damage;
    expect(sim.damageBy.G5_FIRE_R).toBeCloseTo(expectedFire);
    expect(sim.takeEvents().filter(e => e.type === 'ring').map(e => e.source)).toEqual(['G5_FROST_R', 'G5_FIRE_R']);
    expect(sim.action('ultimate')).toBe(false);
  });
  it('offers three exclusive fireball routes and emits eight evenly spaced scaled projectiles', () => {
    const skills = { A011: 3 }, run = setup(skills, { P024: 1, P016: 2 });
    expect(run.journey!.special(2, skills).map(o => o.id)).toEqual(['volley', 'nova', 'ringfire']);
    expect(run.journey!.pick(2, { A011: 2 }, 'route', 'ringfire')).toBe(false);
    expect(run.journey!.pick(2, skills, 'route', 'ringfire')).toBe(true);
    expect(run.journey!.pick(2, skills, 'route', 'nova')).toBe(false);
    run.sim.cast('A011'); expect(run.sim.projectiles).toHaveLength(8);
    const modifier = skillModifier(run.sim.context, run.sim.state(), 'A011');
    run.sim.projectiles.forEach((shot, index) => {
      expect(shot).toMatchObject({ id: 'A011', r: 9, split: 1, pierce: 0 });
      expect(shot.dmg).toBeCloseTo(run.sim.player.atk * .95 * .45);
      expect(shot.explode).toBeCloseTo(28 * modifier.range);
      expect(shot.vx).toBeCloseTo(Math.cos(index * Math.PI / 4) * 300);
      expect(shot.vy).toBeCloseTo(Math.sin(index * Math.PI / 4) * 300);
    });
    run.sim.evolved.E011 = true; run.sim.projectiles.length = 0; run.sim.cast('A011');
    expect(run.sim.projectiles[0]!.explode).toBeCloseTo(28 * modifier.range * 1.25);
    const plain = setup({ A011: 3 }); plain.sim.cast('A011');
    expect(plain.sim.projectiles).toHaveLength(1);
  });
  it.each([false, true])('thermal shock affects only fire during live chill, elite=%s', elite => {
    const { sim } = setup({ G2_FROST: 1, A011: 1 }); const target = enemy(1860, elite); target.chilledUntil = 2; sim.enemies.push(target);
    for (const source of ['A011', 'H001_SLASH', 'G5_FIRE_E', 'G5_FROST_E', 'A013', 'A015']) {
      const base = 100 * (sourceElement(source) === 'fire' ? 1.3 : 1);
      sim.hit(target, 100, source, true, true);
      expect(sim.damageBy[source]).toBeCloseTo(enemyHit(sim.context, sim.state(), source, base, elite, true, true).damage);
      expect(target.chilledUntil).toBe(2);
    }
    sim.time = 2; const previous = sim.damageBy.A011!; sim.hit(target, 100, 'A011', false, true);
    expect(sim.damageBy.A011! - previous).toBeCloseTo(enemyHit(sim.context, sim.state(), 'A011', 100, elite, false, true).damage);
    sim.time = 3; sim.hit(target, 100, 'A011'); expect(target.chilledUntil).toBe(2);
  });
  it('requires owned positive-level ice and fire; classic and bosses never get the bonus', () => {
    const j = new RunEvolution('H001');
    for (const skills of [{}, { G2_FROST: 0, A011: 1 }, { G2_FROST: 1, A011: 0 }, { G2_FROST: 1, A013: 1 }]) expect(j.bond('thermalshock', skills)).toBe(false);
    for (const id of ['A003', 'A011', 'A021', 'A027', 'A054']) expect(j.bond('thermalshock', { G2_FROST: 1, [id]: 1 })).toBe(true);
    const runs = [setup({ A011: 1 }), setup({ G2_FROST: 1, A011: 1 }), setup({ G2_FROST: 1, A011: 1 }, {}, true)];
    for (const { sim } of runs) {
      const target = enemy(); target.chilledUntil = 1000; sim.enemies.push(target); sim.hit(target, 100, 'A011', false, true);
      sim.time = 270; sim.bossEncounter.updateObjective(); const boss = sim.boss!;
      boss.x = 1850; boss.y = 1200; boss.shield = 0; sim.hitBoss(100, 'A011', true);
      expect(boss).not.toHaveProperty('chilledUntil'); expect(boss.x).toBe(1850);
    }
    expect(runs[1]!.sim.damageBy.A011! - runs[0]!.sim.damageBy.A011!).toBeGreaterThan(0);
    expect(runs[2]!.sim.damageBy.A011).toBe(runs[0]!.sim.damageBy.A011);
    const fire = runs[0]!.sim.boss!.hp; expect(runs[1]!.sim.boss!.hp).toBe(fire);
  });
  it('keeps fire and frost modifiers distinct without inheriting H001 fire buffs on frost', () => {
    const { sim } = setup({}, { P026: 2 });
    for (const suffix of ['BASIC', 'E', 'R']) {
      expect(sourceElement(`G5_FROST_${suffix}`)).toBe('frost'); expect(sourceElement(`G5_FIRE_${suffix}`)).toBe('fire');
      expect(skillModifier(sim.context, sim.state(), `G5_FIRE_${suffix}`).dmg).toBeCloseTo(1.18);
      expect(skillModifier(sim.context, sim.state(), `G5_FROST_${suffix}`).dmg).toBe(1);
    }
    const fireGear = { ...sim.context, gear: { ...sim.context.gear, fireDmg: 10 } };
    expect(damageMultiplier(fireGear, sim.state(), 'G5_FROST_E')).toBe(damageMultiplier(sim.context, sim.state(), 'G5_FROST_E'));
    expect(damageMultiplier(fireGear, sim.state(), 'G5_FIRE_E')).toBeGreaterThan(damageMultiplier(sim.context, sim.state(), 'G5_FIRE_E'));
  });
  it('preserves field/projectile budgets, expiry and destruction without stale effects', () => {
    const { sim, journey } = form(); journey!.pick(4, { A011: 3 }, 'route', 'ringfire');
    for (let i = 0; i < 200; i++) { sim.player.skillCd = 0; sim.action('skill'); sim.cast('A011'); }
    expect(sim.fields).toHaveLength(22); expect(sim.projectiles).toHaveLength(260);
    for (const id of ['A011', 'G2_FROST']) sim.cool[id] = 100;
    sim.updateOuter(6); expect(sim.fields).toHaveLength(0); expect(sim.projectiles).toHaveLength(0);
    sim.player.skillCd = 0; sim.action('skill'); sim.cast('A011'); sim.destroy();
    expect(sim.fields).toHaveLength(0); expect(sim.projectiles).toHaveLength(0);
  });
  it('explains all route alternatives and the missing owned skill for the new bond', () => {
    expect(routeAdvice('ringfire')).toMatchObject({ name: '八方焰轮', alternative: '连珠火球 / 爆星火球' });
    expect(routeAdvice('volley')!.alternative).toContain('八方焰轮');
    expect(routeAdvice('nova')!.alternative).toContain('八方焰轮');
    const j = new RunEvolution('H001'), skills = { A011: 1 };
    expect(choiceAdvice({ kind: 'active', id: 'G2_FROST', label: '寒霜环' }, j.snapshot(skills), skills).bonds).toContainEqual({ name: '霜火淬炼', completes: true });
    expect(bondRequirements(['冰', '炎'], skills).map(r => r.met)).toEqual([false, true]);
  });
});
