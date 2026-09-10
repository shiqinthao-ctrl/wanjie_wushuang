import { describe, expect, it } from 'vitest';
import fresh from '../data/freshSave.json';
import { GameCore } from '../core/GameCore';
import { CombatSimulation } from '../core/CombatSimulation';
import { Progression } from '../core/progression';
import type { Enemy } from '../core/spawnRules';
import { insideTelegraph } from '../core/FirstBoss';
import { prepareChapterRun } from './prepare';
import { createChapterProgression } from './growth';
import { EffectTimeline } from '../game/EffectTimeline';
import { EnemyView } from '../game/EnemyView';
import type Phaser from 'phaser';

const options = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-01', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
function battle(chapter = true) {
  const prep = prepareChapterRun(fresh, options);
  const sim = new CombatSimulation(fresh, chapter ? createChapterProgression(prep, () => .8) : new Progression(fresh.build, {}, {}, () => .8), () => .8, [], Date.now, chapter ? prep : undefined);
  sim.player.aspd = 0; sim.cool.A003 = 999;
  return sim;
}
function soldier(sim: CombatSimulation, elite = false) {
  const unit: Enemy = { id: 'EN001', name: '步卒', ai: 'melee', x: sim.player.x - 30, y: sim.player.y, r: 10, hp: 1000, maxHp: 1000, speed: 0, damage: 20, attack: 0, skill: 0, elite, affixes: [], flash: 0, color: '#fff' };
  sim.enemies.push(unit); return unit;
}
function tick(sim: CombatSimulation, seconds: number) {
  for (let t = 0; t < seconds - 1e-8;) { const dt = Math.min(.01, seconds - t); sim.beginFrame(dt); t += dt; }
}
function cone(sim: CombatSimulation, phase = 1) {
  sim.time = 270; sim.bossEncounter.spawn(); const boss = sim.boss!;
  Object.assign(boss, { x: sim.player.x - 160, y: sim.player.y, hp: boss.maxHp * [1, 1, .6, .3][phase]!, phase, castCd: 0, castLock: 0, skillIndex: (5 - phase) % 3 });
  sim.bossEncounter.updateAI(.01);
  return { boss, warning: sim.bossEncounter.telegraphs[0]! };
}

describe('chapter soldier readable attack', () => {
  it('locks a visible windup before one strike and does not deal contact damage', () => {
    const sim = battle(), unit = soldier(sim), hp = sim.player.hp;
    tick(sim, .01); const pose = sim.renderState().enemies[0]!.soldier!;
    expect(pose.phase).toBe('windup'); expect(pose.facing).toBe(0);
    sim.player.y += 10; tick(sim, .58);
    expect(sim.player.hp).toBe(hp); expect(unit.x).toBe(pose.x);
    expect(sim.renderState().enemies[0]!.soldier!.facing).toBe(0);
    tick(sim, .03); expect(sim.player.hp).toBeLessThan(hp);
    const hitHp = sim.player.hp; tick(sim, .70); expect(sim.player.hp).toBe(hitHp);
    expect(sim.takeEvents().filter(e => e.type === 'enemy-strike')).toHaveLength(1);
  });
  it.each([[62, 0, true], [62.01, 0, false], [30, 40, false], [-20, 0, false], [20, 20, true]])('strike center (%s,%s), hit=%s', (x, y, hit) => {
    const sim = battle(), unit = soldier(sim); tick(sim, .01); const hp = sim.player.hp;
    sim.player.x = unit.x + x; sim.player.y = unit.y + y;
    tick(sim, .61); expect(sim.player.hp < hp).toBe(hit);
  });
  it('a dodge during the release avoids damage', () => {
    const sim = battle(); soldier(sim); tick(sim, .50); const hp = sim.player.hp;
    sim.move(0, -1); expect(sim.action('dodge')).toBe(true); sim.clearInput();
    tick(sim, .2); expect(sim.player.hp).toBe(hp);
  });
  it('nonlethal hits signal reaction without stunlock; death cancels and emits one corpse', () => {
    const sim = battle(), unit = soldier(sim); tick(sim, .01);
    sim.hit(unit, 1, 'test'); expect(sim.renderState().enemies[0]!.soldier!.phase).toBe('windup');
    sim.hit(unit, 1e5, 'test'); sim.hit(unit, 1e5, 'test'); const hp = sim.player.hp;
    tick(sim, .8); expect(sim.player.hp).toBe(hp);
    const events = sim.takeEvents();
    expect(events.filter(e => e.type === 'soldier-death')).toHaveLength(1);
    expect(events.filter(e => e.type === 'enemy-strike')).toHaveLength(0);
  });
  it('forced movement cancels the locked strike instead of hitting at an abandoned origin', () => {
    const sim = battle(), unit = soldier(sim); tick(sim, .2); unit.x -= 20;
    const hp = sim.player.hp; tick(sim, .5); expect(sim.player.hp).toBe(hp);
    expect(sim.takeEvents().filter(e => e.type === 'enemy-strike')).toHaveLength(0);
  });
  it.each([false, true])('keeps old contact damage for legacy or elite (elite=%s)', elite => {
    const sim = battle(elite), unit = soldier(sim, elite); unit.x = sim.player.x - 20;
    const hp = sim.player.hp; tick(sim, .01); expect(sim.player.hp).toBeLessThan(hp);
    expect(sim.renderState().enemies[0]!.soldier).toBeUndefined();
  });
});

describe('chapter B001 cone commitment and response', () => {
  it.each([1, 2, 3])('phase %s uses 1.10s locked windup with a single impact and .85s safe recovery', phase => {
    const sim = battle(), { boss, warning } = cone(sim, phase), hp = sim.player.hp;
    expect(warning.type).toBe('cone'); expect(warning.max).toBe(1.1);
    sim.bossEncounter.updateTelegraphs(1.09); expect(sim.player.hp).toBe(hp);
    sim.bossEncounter.updateTelegraphs(.02); expect(sim.player.hp).toBeLessThan(hp);
    const hitHp = sim.player.hp; sim.player.x = boss.x; sim.player.y = boss.y;
    for (let i = 0; i < 80; i++) { sim.player.inv = 0; sim.bossEncounter.updateAI(.01); sim.bossEncounter.updateTelegraphs(.01); }
    expect(sim.player.hp).toBe(hitHp); expect(boss.sweepPhase).toBe('recovery');
    expect(sim.bossEncounter.telegraphs).toHaveLength(0);
    expect(sim.takeEvents().filter(e => e.type === 'enemy-strike')).toHaveLength(1);
  });
  it('moving behind avoids the locked cone, and damage can still hit the recovering Boss', () => {
    const sim = battle(), { boss, warning } = cone(sim), hp = sim.player.hp;
    sim.player.x = boss.x - 70; sim.bossEncounter.updateAI(.5);
    expect(boss.x).toBe(warning.x); expect(boss.y).toBe(warning.y);
    sim.bossEncounter.updateTelegraphs(1.11); expect(sim.player.hp).toBe(hp);
    const bossHp = boss.hp; sim.hitBoss(100, 'test'); expect(boss.hp).toBeLessThan(bossHp);
  });
  it('defeat cancels pending warnings and cannot cause posthumous damage', () => {
    const sim = battle(); cone(sim); const hp = sim.player.hp;
    sim.bossEncounter.defeat(); expect(sim.bossEncounter.telegraphs).toHaveLength(0);
    sim.bossEncounter.updateTelegraphs(2); expect(sim.player.hp).toBe(hp);
    expect(sim.bossEncounter.snapshot().lootShown).toBe(true);
  });
  it('phase transition cancels a previous cone without an invisible hit', () => {
    const sim = battle(), { boss } = cone(sim); boss.hp = boss.maxHp * .6;
    sim.bossEncounter.updateAI(.01); expect(sim.bossEncounter.telegraphs).toHaveLength(0);
    expect(boss.sweepPhase).toBeUndefined(); const hp = sim.player.hp;
    sim.bossEncounter.updateTelegraphs(2); expect(sim.player.hp).toBe(hp);
  });
  it('legacy cone timing and immediate removal stay unchanged', () => {
    const sim = battle(false), { warning, boss } = cone(sim);
    expect(warning.max).not.toBe(1.1); expect(boss.sweepPhase).toBeUndefined();
    sim.bossEncounter.updateTelegraphs(warning.max + .01);
    expect(sim.bossEncounter.telegraphs).toHaveLength(0);
  });
  it('cone edge matches the drawn sector with player center as the hit point', () => {
    const sim = battle(), { warning } = cone(sim);
    if (warning.type !== 'cone') throw new Error('expected cone');
    const point = (r: number, a: number) => ({ x: warning.x + r * Math.cos(a), y: warning.y + r * Math.sin(a) });
    expect(insideTelegraph(point(warning.range, warning.angle), warning)).toBe(true);
    expect(insideTelegraph(point(warning.range + .01, warning.angle), warning)).toBe(false);
    expect(insideTelegraph(point(100, warning.angle + warning.arc / 2 + .01), warning)).toBe(false);
  });
});

it('GameCore pause freezes both attacks, snapshots cannot change rules, destroy clears them', () => {
  const core = new GameCore(fresh, () => .8, 'classic', options); core.start();
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  sim.cool.A003 = 999; soldier(sim); core.advance(.01); cone(sim);
  core.pause(); const before = core.renderState(); core.advance(5);
  expect(core.renderState()).toEqual(before);
  expect(Object.isFrozen(before.enemies[0]!.soldier)).toBe(true);
  expect(Object.isFrozen(before.telegraphs[0])).toBe(true);
  core.destroy(); core.advance(5);
  expect(core.renderState().enemies).toHaveLength(0); expect(core.renderState().telegraphs).toHaveLength(0);
});

it('rendering essential reactions and toggling decoration cannot change damage, drops or random progression', () => {
  const results = [true, false].map(enabled => {
    const core = new GameCore(fresh, () => .8, 'classic', options); core.start();
    const sim = (core as unknown as { combat: CombatSimulation }).combat;
    sim.cool.A003 = 999; sim.player.aspd = 0; soldier(sim); cone(sim);
    const effects = new EffectTimeline(); effects.setEnabled(enabled);
    const graphic: unknown = new Proxy({}, { get: () => () => graphic });
    const scene = { add: { graphics: () => graphic } } as unknown as Phaser.Scene;
    const view = new EnemyView(scene);
    for (let i = 0; i < 140; i++) {
      core.advance(.01); const events = core.takeEvents(), state = core.renderState();
      effects.advance(events, .01); view.draw(state.enemies, events, .01, sim.time);
    }
    return { render: core.renderState(), damage: sim.damageTakenBy, drops: sim.drops, growth: sim.progression.snapshot() };
  });
  expect(results[0]).toEqual(results[1]);
});
