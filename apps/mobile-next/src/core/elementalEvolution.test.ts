import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression, skillName } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { damageMultiplier, sourceElement } from './combatMath';
import type { Enemy } from './spawnRules';

const target = (x = 1860): Enemy => ({ id: 'EN001', name: 'target', ai: 'melee', x, y: 1200, hp: 100000, maxHp: 100000, r: 10, elite: false, affixes: [], attack: 0, skill: 0, damage: 10, speed: 100, color: '#fff', flash: 0 });
function setup(hero = 'H001', skills: Record<string, number> = {}) {
  const journey = new RunEvolution(hero);
  const progression = new Progression(evolutionBuild(hero), skills, {}, () => .8, journey);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero }, progression, () => .8);
  return { journey, progression, sim };
}

describe('G2 elemental evolution', () => {
  it.each([['H001', 'frostlord', 'G2_FROST'], ['H010', 'thunderlord', 'A013'], ['H012', 'beastlord', 'S001']])('offers a paid signature growth path for %s', (hero, form, signature) => {
    const { journey, progression } = setup(hero, { A011: 1 });
    expect(journey.special(3, {})).toHaveLength(3);
    expect(journey.pick(3, {}, 'hero', form)).toBe(true);
    expect(progression.snapshot().skills[signature]).toBeUndefined();
    progression.gain(26); progression.checkLevel();
    const offer = progression.snapshot().choice!;
    expect(offer.options.some(o => o.id === signature)).toBe(true);
    expect(offer.options.some(o => o.id === 'A011')).toBe(true);
    expect(progression.pick(offer.token, 'active', signature)).toBe(true);
    expect(progression.snapshot().skills[signature]).toBe(1);
    const full = new Progression(evolutionBuild(hero), { A011: 5, A003: 5, A021: 5, A026: 5, A027: 5, A054: 5 }, {}, () => .8, journey);
    expect(full.validOptions().some(o => o.kind === 'active')).toBe(false);
  });
  it('slows movement temporarily without mutating base speed or accumulating multipliers', () => {
    const { sim } = setup('H001', { G2_FROST: 1 });
    const enemy = target(); sim.enemies.push(enemy);
    sim.cast('G2_FROST'); sim.cast('G2_FROST');
    expect(enemy.hp).toBeLessThan(enemy.maxHp);
    expect(enemy.speed).toBe(100);
    const x = enemy.x; sim.beginFrame(.01);
    expect(x - enemy.x).toBeCloseTo(.55);
    sim.time = 2; const later = enemy.x; sim.beginFrame(.01);
    expect(later - enemy.x).toBeCloseTo(1);
    expect(enemy.speed).toBe(100);
  });
  it('frost routes create persistent control or a larger instant burst, with exclusive choices', () => {
    const domain = setup('H001', { G2_FROST: 3 }), shatter = setup('H001', { G2_FROST: 3 });
    expect(domain.journey.pick(2, { G2_FROST: 3 }, 'route', 'glacier')).toBe(true);
    expect(domain.journey.pick(2, { G2_FROST: 3 }, 'route', 'shatter')).toBe(false);
    shatter.journey.pick(2, { G2_FROST: 3 }, 'route', 'shatter');
    for (const { sim } of [domain, shatter]) { sim.enemies.push(target(1980)); sim.cast('G2_FROST'); }
    expect(domain.sim.fields).toHaveLength(1); expect(domain.sim.enemies[0]!.hp).toBe(100000);
    expect(shatter.sim.fields).toHaveLength(0); expect(shatter.sim.enemies[0]!.hp).toBeLessThan(100000);
    domain.sim.cool.G2_FROST = 100; domain.sim.updateOuter(4); expect(domain.sim.fields.filter(f => f.id === 'G2_FROST')).toHaveLength(0);
    expect(skillName('G2_FROST')).toBe('寒霜环');
  });
  it('automatically casts frost on its cooldown and increases damage with skill level', () => {
    const low = setup('H001', { G2_FROST: 1 }), high = setup('H001', { G2_FROST: 5 });
    for (const { sim } of [low, high]) { sim.enemies.push(target()); sim.updateOuter(.01); }
    expect(low.sim.damageBy.G2_FROST).toBeGreaterThan(0);
    expect(high.sim.damageBy.G2_FROST! / low.sim.damageBy.G2_FROST!).toBeCloseTo(1.8);
    const damage = low.sim.damageBy.G2_FROST; low.sim.updateOuter(.01); expect(low.sim.damageBy.G2_FROST).toBe(damage);
  });
  it('chain route trades individual damage for reach while thunderstrike hits nearby targets once', () => {
    const chain = setup('H010', { A013: 3 }), strike = setup('H010', { A013: 3 });
    chain.journey.pick(2, { A013: 3 }, 'route', 'relay'); strike.journey.pick(2, { A013: 3 }, 'route', 'thunderstrike');
    for (const { sim } of [chain, strike]) { sim.enemies.push(target(1860), target(1930), target(2000), target(2070), target(2800)); sim.cast('A013'); }
    expect(chain.sim.enemies.filter(e => e.hp < e.maxHp)).toHaveLength(4);
    expect(strike.sim.enemies.filter(e => e.hp < e.maxHp)).toHaveLength(2);
    expect(strike.sim.enemies[0]!.hp).toBe(strike.sim.enemies[1]!.hp);
    expect(strike.sim.enemies[0]!.hp).toBeLessThan(chain.sim.enemies[0]!.hp);
  });
  it.each(['relay', 'thunderstrike'])('superconductivity increases %s damage only while chilled', route => {
    const plain = setup('H010', { A013: 3 }), bonded = setup('H010', { A013: 3, G2_FROST: 1 });
    for (const run of [plain, bonded]) {
      run.journey.pick(2, { A013: 3 }, 'route', route); run.sim.enemies.push(target()); run.sim.cast('G2_FROST'); run.sim.cast('A013');
    }
    expect(bonded.sim.damageBy.A013! / plain.sim.damageBy.A013!).toBeCloseTo(1.35);
    const prior = bonded.sim.damageBy.A013!; bonded.sim.time = 3; bonded.sim.cast('A013');
    expect(bonded.sim.damageBy.A013! - prior).toBeCloseTo(plain.sim.damageBy.A013!);
  });
  it('summon bonds require summons, emit frost damage, and shorten the attack interval', () => {
    const run = new RunEvolution('H012');
    expect(run.snapshot({ G2_FROST: 1, A013: 1, A015: 1 }).bonds.filter(b => b.active).map(b => b.id)).not.toContain('winterlegion');
    expect(run.snapshot({ G2_FROST: 1, A013: 1, S001: 1 }).bonds.filter(b => b.active).map(b => b.id)).toEqual(['stormhunt', 'superconduct', 'winterlegion', 'thunderlegion']);
    const plain = setup('H012', { S001: 1 }), bonded = setup('H012', { S001: 1, G2_FROST: 1, A013: 1 });
    for (const { sim } of [plain, bonded]) {
      sim.enemies.push(target(1870)); sim.cast('S001');
      for (const id of ['S001', 'G2_FROST', 'A013']) sim.cool[id] = 100;
      sim.updateOuter(.01);
    }
    expect(bonded.sim.damageBy.G2_FROST_CLONE).toBeGreaterThan(0);
    expect(plain.sim.damageBy.G2_FROST_CLONE).toBeUndefined();
    expect(bonded.sim.renderState().summons[0]!.tick).toBe(.6);
    expect(plain.sim.renderState().summons[0]!.tick).toBe(.8);
  });
  it('new forms have distinct mechanics and awakening, with bounded summons and no boss slow', () => {
    const frost = setup(), thunder = setup('H010'), beast = setup('H012');
    for (const [run, form] of [[frost, 'frostlord'], [thunder, 'thunderlord'], [beast, 'beastlord']] as const) {
      run.journey.pick(3, {}, 'hero', form); run.sim.enemies.push(target());
      run.sim.basic(); run.sim.action('skill'); run.journey.pick(8, { A011: 3 }, 'hero', 'awaken');
      run.sim.player.skillCd = 0; run.sim.action('skill');
    }
    expect(frost.sim.fields.some(f => f.id === 'G2_FROST_E')).toBe(true);
    expect(thunder.sim.damageBy.G2_LIGHTNING_E).toBeGreaterThan(0);
    expect(beast.sim.renderState().summons.filter(s => s.guard)).toHaveLength(7);
    for (let i = 0; i < 5; i++) { beast.sim.player.skillCd = 0; beast.sim.action('skill'); }
    expect(beast.sim.renderState().summons).toHaveLength(8);
    beast.sim.destroy(); expect(beast.sim.renderState().summons).toHaveLength(0);
    frost.sim.time = 270; frost.sim.bossEncounter.updateObjective(); const boss = frost.sim.boss!;
    boss.x = 1850; boss.y = 1200; boss.shield = 0; const hp = boss.hp;
    frost.sim.cast('G2_FROST'); expect(boss.hp).toBeLessThan(hp); expect(boss).not.toHaveProperty('chilledUntil');
  });
  it('frost damage does not inherit starter fire bonuses', () => {
    const { sim } = setup();
    expect(sourceElement('G2_FROST_E')).toBe('frost'); expect(sourceElement('G2_LIGHTNING_E')).toBe('lightning');
    const context = { ...sim.context, gear: { ...sim.context.gear, fireDmg: 10 } };
    expect(damageMultiplier(context, sim.state(), 'G2_FROST_E')).toBe(damageMultiplier(sim.context, sim.state(), 'G2_FROST_E'));
  });
});
