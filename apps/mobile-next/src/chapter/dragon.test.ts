import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from '../core/CombatSimulation';
import { prepareChapterRun } from './prepare';
import { createChapterProgression } from './growth';
import type { Enemy } from '../core/spawnRules';
import { inDragonSector, segmentContact } from './DragonCombat';
import { GameCore } from '../core/GameCore';
import { EffectTimeline } from '../game/EffectTimeline';

const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
function battle(awakened = false) {
  const prep = prepareChapterRun(fresh, options), random = () => .8, progression = createChapterProgression(prep, random);
  expect(progression.journey!.pick(3, {}, 'hero', 'dragon')).toBe(true);
  if (awakened) expect(progression.journey!.pick(8, { A003: 3 }, 'hero', 'awaken')).toBe(true);
  const sim = new CombatSimulation(fresh, progression, random, [], Date.now, prep);
  sim.cool.A003 = 999; sim.move(1, 0);
  return sim;
}
function enemy(sim: CombatSimulation, x: number, y = 0, elite = false): Enemy {
  const unit: Enemy = { id: elite ? 'elite' : 'EN001', name: 'target', x: sim.player.x + x, y: sim.player.y + y, hp: 10000, maxHp: 10000, r: 10, ai: 'melee', elite, affixes: [], speed: 0, damage: 10, attack: 0, skill: 0, flash: 0, color: '#fff' };
  sim.enemies.push(unit); return unit;
}
function advance(sim: CombatSimulation, seconds: number) {
  for (let t = 0; t < seconds - 1e-8;) { const dt = Math.min(.01, seconds - t); sim.time += dt; sim.updateOuter(dt); t += dt; }
}
describe('chapter dragon directional rules', () => {
  it('crowd: windup deals no damage; frontal slash excludes side/rear and locks direction', () => {
    const sim = battle(), front = enemy(sim, 80), side = enemy(sim, 0, 80), rear = enemy(sim, -80);
    sim.basic(); advance(sim, .10); expect(front.hp).toBe(10000);
    sim.move(0, 1); advance(sim, .03);
    expect(front.hp).toBeLessThan(10000); expect(side.hp).toBe(10000); expect(rear.hp).toBe(10000);
    expect(sim.takeEvents().some(event => event.type === 'dragon-slash')).toBe(true);
  });
  it('ranged: core pierces aligned targets once, not the flanks, and makes no follow field', () => {
    const sim = battle(), targets = [enemy(sim, 100), enemy(sim, 200), enemy(sim, 320)], side = enemy(sim, 180, 55);
    sim.cast('A003'); advance(sim, .85);
    for (const target of targets) expect(target.hp).toBeCloseTo(10000 - 108 * 1.15);
    expect(side.hp).toBe(10000); expect(sim.fields).toHaveLength(0);
  });
  it('elite: awakening adds a delayed follow-up that can turn without hitting the rear', () => {
    const sim = battle(true), front = enemy(sim, 80, 0, true), side = enemy(sim, 0, 80, true), rear = enemy(sim, -80, 0, true);
    sim.basic(); advance(sim, .13); const firstHp = front.hp;
    expect(firstHp).toBeLessThan(10000); expect(side.hp).toBe(10000);
    sim.move(0, 1); advance(sim, .4);
    expect(side.hp).toBeLessThan(10000); expect(front.hp).toBe(firstHp); expect(rear.hp).toBe(10000);
  });
  it('Boss: angular checks apply to its body, and frontal core + manual attacks damage a lone Boss', () => {
    const sim = battle(); sim.time = 270; sim.bossEncounter.spawn();
    const boss = sim.boss!; boss.x = sim.player.x - 100; boss.y = sim.player.y; boss.shield = 0;
    const hp = boss.hp; sim.basic(); advance(sim, .14); expect(boss.hp).toBe(hp);
    sim.move(-1, 0); sim.cast('A003'); expect(sim.action('skill')).toBe(true); advance(sim, .7);
    expect(boss.hp).toBeLessThan(hp); expect(sim.damageBy.A003).toBeGreaterThan(0); expect(sim.damageBy.H001_DRAGON_E).toBeGreaterThan(0);
  });
  it('dodge cancels unreleased damage without refunding skill cooldown or ultimate charge', () => {
    const sim = battle(), target = enemy(sim, 80); sim.action('skill'); expect(sim.action('skill')).toBe(false);
    sim.action('dodge'); advance(sim, .7); expect(target.hp).toBe(10000); expect(sim.player.skillCd).toBe(6);
    sim.player.ult = 100; expect(sim.action('ultimate')).toBe(true); expect(sim.player.ult).toBe(0);
    sim.player.dodgeCd = 0; sim.action('dodge'); advance(sim, 2); expect(target.hp).toBe(10000);
  });
  it.each([false, true])('ultimate has separated attacks with limited frontal coverage (awakened=%s)', awakened => {
    const sim = battle(awakened); enemy(sim, 100); const rear = enemy(sim, -100); sim.player.ult = 100;
    expect(sim.action('ultimate')).toBe(true); advance(sim, 3);
    const events = sim.takeEvents().filter(e => e.type === 'dragon-slash' && e.source === 'H001_DRAGON_R');
    expect(events).toHaveLength(awakened ? 5 : 3); expect(rear.hp).toBe(10000);
  });
});

describe('chapter dragon boundaries and lifecycle', () => {
  it('evolution lets the previously cast field expire, and all later core casts are blades', () => {
    const prep = prepareChapterRun(fresh, options), random = () => .8;
    const progression = createChapterProgression(prep, random);
    const sim = new CombatSimulation(fresh, progression, random, [], Date.now, prep);
    sim.cool.A003 = 999; sim.cast('A003');
    expect(sim.fields).toHaveLength(1);
    const field = sim.fields[0]!, life = field.life;
    expect(progression.journey!.pick(3, { A003: 1 }, 'hero', 'dragon')).toBe(true);
    sim.cast('A003'); advance(sim, .11);
    expect(sim.fields).toEqual([field]); expect(field.life).toBeLessThan(life);
    expect(sim.renderState().dragon!.blades).toHaveLength(1);
    advance(sim, life + .1); expect(sim.fields).toHaveLength(0);
    sim.cast('A003'); advance(sim, .11); expect(sim.fields).toHaveLength(0);
    expect(sim.renderState().dragon!.blades).toHaveLength(1);
  });
  it.each([
    [138, 0, true], [138.01, 0, false], [-11, 0, false], [0, 0, true],
    [70, 110, true], [70, 125, false], [0, 30, false], [80, -80, true],
  ])('sector circle at (%s,%s) is %s', (x, y, expected) => {
    expect(inDragonSector({ x: 0, y: 0 }, 0, 128, { x, y, r: 10 })).toBe(expected);
  });
  it('swept collision includes tangent and segment end, excludes behind and beyond', () => {
    const a = { x: 0, y: 0 }, b = { x: 100, y: 0 };
    expect(segmentContact(a, b, { x: 50, y: 10, r: 10 })).toBe(.5);
    expect(segmentContact(a, b, { x: 110, y: 0, r: 10 })).toBe(1);
    expect(segmentContact(a, b, { x: 111, y: 0, r: 10 })).toBeUndefined();
    expect(segmentContact(a, b, { x: -11, y: 0, r: 10 })).toBeUndefined();
  });
  it('pierce cap follows first contact order despite reversed enemy storage and large steps', () => {
    const sim = battle(), targets = [40, 80, 120, 160, 200, 240].map(x => enemy(sim, x));
    sim.enemies.reverse(); sim.cast('A003'); advance(sim, .11);
    sim.time += .6; sim.updateOuter(.6);
    expect(targets.map(t => t.hp < 10000)).toEqual([true, true, true, true, true, false]);
    expect(sim.renderState().dragon!.blades).toHaveLength(0);
  });
  it('core applies level scaling once and cannot hit beyond the end cap', () => {
    const sim = battle(); sim.progression.upgradeOwned(); sim.progression.upgradeOwned();
    expect(sim.state().skills.A003).toBe(3);
    const target = enemy(sim, 400), outside = enemy(sim, 440);
    sim.cast('A003'); advance(sim, 2);
    expect(target.hp).toBeCloseTo(10000 - 108 * 1.15 * 1.4); expect(outside.hp).toBe(10000);
  });
  it('Boss body edge counts, but shield absorbs one blade only with no HP overflow', () => {
    const sim = battle(); sim.time = 270; sim.bossEncounter.spawn(); const boss = sim.boss!;
    boss.x = sim.player.x + 128 + boss.r; boss.y = sim.player.y; boss.shield = 0;
    const hp = boss.hp; sim.basic(); advance(sim, .13); expect(boss.hp).toBeLessThan(hp);
    boss.shield = 1; const shieldHp = boss.hp; sim.cast('A003'); advance(sim, 1);
    expect(boss.shield).toBe(0); expect(boss.hp).toBe(shieldHp);
  });
  it('windup locks origin while idle retains the last input facing', () => {
    const sim = battle(), oldTarget = enemy(sim, 80); sim.basic(); sim.player.x += 400;
    sim.move(0, 1); sim.clearInput(); expect(sim.movementFacing()).toBe(Math.PI / 2);
    advance(sim, .13); expect(oldTarget.hp).toBeLessThan(10000);
    expect(sim.renderState().dragon!.poses[0]!.x).toBe(sim.player.x - 400);
  });
  it('manual commands cannot spend charge during another manual attack or its recovery', () => {
    const sim = battle(); sim.player.ult = 100;
    sim.action('skill'); expect(sim.action('ultimate')).toBe(false); expect(sim.player.ult).toBe(100);
    advance(sim, .23); expect(sim.action('ultimate')).toBe(false);
    advance(sim, .21); expect(sim.action('ultimate')).toBe(true);
  });
  it('dodge keeps released blades, cancels remaining awakened swings, and destruction clears both', () => {
    const sim = battle(true), target = enemy(sim, 320); sim.action('skill'); advance(sim, .23);
    sim.action('dodge'); advance(sim, .6);
    expect(target.hp).toBeLessThan(10000);
    expect(sim.takeEvents().filter(e => e.type === 'dragon-slash')).toHaveLength(1);
    sim.cast('A003'); sim.destroy(); advance(sim, 2); sim.basic();
    expect(sim.renderState().dragon).toMatchObject({ poses: [], blades: [] }); expect(sim.takeEvents()).toEqual([]);
  });
  it.each(['pause', 'choice'] as const)('%s freezes the windup clock and resume preserves its lock', mode => {
    const sim = battle(), core = new GameCore(fresh, Math.random, 'classic', options);
    Object.assign(core, { combat: sim, progression: sim.progression }); core.start();
    const target = enemy(sim, 100); sim.basic();
    if (mode === 'pause') core.pause();
    else { sim.progression.gain(26); core.advance(.01); }
    const before = core.renderState().dragon;
    for (let i = 0; i < 100; i++) core.advance(.034);
    expect(core.renderState().dragon).toEqual(before); expect(target.hp).toBe(10000);
    if (mode === 'pause') core.resume();
    else { const choice = core.snapshot().choice!; const option = choice.options[0]!; core.choose(choice.token, option.kind, option.id); }
    for (let i = 0; i < 5; i++) core.advance(.034);
    expect(target.hp).toBeLessThan(10000); core.destroy();
  });
  it('effects off/on leaves identical damage, targets, drops, state and immutable telegraphs', () => {
    const results = [true, false].map(enabled => {
      const sim = battle(true), effects = new EffectTimeline(); effects.setEnabled(enabled);
      [70, 150, 220].forEach(x => enemy(sim, x)); sim.player.ult = 100; sim.action('ultimate'); sim.cast('A003');
      const before = sim.renderState().dragon!; expect(Object.isFrozen(before.poses[0])).toBe(true);
      for (let i = 0; i < 220; i++) { advance(sim, .01); effects.advance(sim.takeEvents(), .01); }
      expect(before.poses[0]!.phase).toBe('windup');
      return { render: sim.renderState(), damage: sim.damageBy, drops: sim.drops, progression: sim.progression.snapshot() };
    });
    expect(results[0]).toEqual(results[1]);
  });
});
