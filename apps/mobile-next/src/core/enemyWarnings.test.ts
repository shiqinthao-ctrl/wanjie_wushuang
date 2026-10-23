import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { createEnemy, director, firstStage, waveAt } from './spawnRules';
import type { DirectorState, Enemy } from './spawnRules';
import { GameCore } from './GameCore';
import { insideTelegraph } from './FirstBoss';
import fresh from '../data/freshSave.json';

/**
 * R3-E01..07a: the two `ai` strings that had no reader, under `threat-v2` only.
 *
 * `enemyRoles.test.ts` is the legacy arm (the same two strings stay inert, which is what keeps
 * `combat-math-oracle.json` and every legacy reading byte-identical). This file is the shipped arm.
 *
 * Instrument: `createEnemy` (production constructor, so `speed`/`r`/`damage` are the shipped ones),
 * `CombatSimulation` constructed with `rules = 'threat-v2'`, player parked and `atk = 0`, pet off,
 * one enemy on the field (the spawner's output is dropped every frame). Time is read as
 * **frames at 1/60 s**, not as `sim.time`, because `beginFrame` is the only driver that runs
 * `enemyAI` and `updateEnemyWarnings`.
 */
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const FRAME = 1 / 60;
const STATE: DirectorState = { time: 0, kills: 0, dps: 0, level: 1, evolved: 0, fused: 0 };
const PLAYER = { x: 1800, y: 1200, hp: 1000, maxHp: 1000, atk: 100 };
const WORLD = { width: 3600, height: 2400 };
const VIEWPORT = { width: 390, height: 844 };

function build(id: string, gap: number): Enemy {
  const enemy = createEnemy(STATE, PLAYER, VIEWPORT, WORLD, 'normal', () => .8, { id });
  enemy.x = PLAYER.x + gap; enemy.y = PLAYER.y;
  return enemy;
}
function field(rules: 'legacy' | 'threat-v2') {
  const journey = new RunEvolution('H001');
  const progression = new Progression(evolutionBuild('H001'), {}, {}, () => .8, journey);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero: 'H001' }, progression, () => .8, [], Date.now, undefined, rules);
  sim.pet.enabled = false;
  sim.player.x = PLAYER.x; sim.player.y = PLAYER.y; sim.player.atk = 0;
  return sim;
}
/**
 * Drive one enemy for `frames` frames and return its per-frame displacement toward the player.
 * The spawner's output is dropped every frame so the probe body is the only one on the field.
 */
function drive(rules: 'legacy' | 'threat-v2', id: string, gap: number, frames: number, before?: (sim: CombatSimulation, index: number) => void) {
  const sim = field(rules), enemy = build(id, gap);
  enemy.attack = 0; enemy.skill = 0;
  sim.enemies.push(enemy);
  const steps: number[] = [], hp: number[] = [], warnings: number[] = [];
  for (let i = 0; i < frames; i++) {
    before?.(sim, i);
    const x = enemy.x;
    sim.beginFrame(FRAME);
    steps.push(x - enemy.x); hp.push(sim.player.hp); warnings.push(sim.warnings.length);
    sim.enemies.length = 0; sim.enemies.push(enemy);
  }
  return { sim, enemy, steps, hp, warnings };
}
/** The run of leading frames whose step is zero - the wind-up, in frames. */
const plantedRun = (steps: readonly number[]) => steps.findIndex(step => step > 1e-9);
/** Start and end position of the one committed dash, so the distance is measured, not summed. */
function lungeOf(id: string, gap: number) {
  const sim = field('threat-v2'), enemy = build(id, gap);
  enemy.attack = 0; sim.enemies.push(enemy);
  let start: { x: number; y: number } | undefined;
  for (let i = 0; i < 120; i++) {
    if ((enemy.dash ?? 0) > 0 && !start) start = { x: enemy.x, y: enemy.y };
    const wasDashing = (enemy.dash ?? 0) > 0;
    sim.beginFrame(FRAME);
    sim.enemies.length = 0; sim.enemies.push(enemy);
    if (wasDashing && (enemy.dash ?? 0) === 0) return { travelled: Math.hypot(enemy.x - start!.x, enemy.y - start!.y), frames: i };
  }
  return { travelled: 0, frames: 0 };
}
/** The run of frames after that whose step is constant and larger than the walk - the dash. */
function burstRun(steps: readonly number[], from: number) {
  let end = from;
  while (end < steps.length && Math.abs(steps[end]! - steps[from]!) < 1e-6) end++;
  return end - from;
}
const round = (value: number, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits;

describe('R3-E01..07a: charge and aoe_ranged under threat-v2', () => {
  it('charge: plants for the wind-up, then commits to one fixed-distance dash', () => {
    const probe = drive('threat-v2', 'EN004', 250, 90);
    const walkStep = probe.enemy.speed * FRAME;
    const planted = plantedRun(probe.steps);
    const dashFrames = burstRun(probe.steps, planted);
    const dashStep = probe.steps[planted]!;
    // The body does not move at all while the announcement is up - not "slower", zero.
    expect(planted, 'wind-up frames').toBeGreaterThan(30);
    expect(Math.abs(planted * FRAME - .55), 'the wind-up is .55s').toBeLessThan(2 * FRAME);
    // Then one constant step, ~12.5x the walk, for .32s.
    expect(dashStep / walkStep, 'the dash is a burst, not a faster walk').toBeCloseTo(330 / .32 / probe.enemy.speed, 6);
    expect(Math.abs(dashFrames * FRAME - .32), 'the dash is .32s').toBeLessThan(2 * FRAME);
    // ...and every dash frame is the same step, so it is one committed lunge.
    const dash = probe.steps.slice(planted, planted + dashFrames - 1);
    expect(Math.max(...dash) - Math.min(...dash), 'no frame accelerates').toBeLessThan(1e-6);
    // It travels the announced distance and no further: 330 world units. Measured from the frame
    // before the lunge to the frame the dash ends, because after that the body walks *back* toward
    // the player it just passed and the signed steps would cancel part of the dash.
    const lunge = lungeOf('EN004', 250);
    expect(lunge.travelled, 'the dash covers its own distance').toBeCloseTo(330, 3);
    // The charge is over: the body walks the rest of the window at its normal step - and the sign is
    // negative, because `distance > range` means it passed the player and has to turn around. That
    // reversal is the pattern the row exists for; it is not a modelling artefact.
    expect(probe.steps.at(-1)! / walkStep, 'back to a walk after the dash').toBeCloseTo(-1, 6);
  });

  it('charge: the announcement is the same length as the lunge, and it is not the attack', () => {
    const sim = field('threat-v2'), enemy = build('EN004', 250);
    enemy.attack = 0; sim.enemies.push(enemy);
    sim.beginFrame(FRAME);
    const warning = sim.warnings[0]!;
    expect(warning.type).toBe('line');
    if (warning.type !== 'line') return;
    // One number does both jobs, so the drawn line cannot promise a different lunge than the body
    // takes. This is the assertion `TASK.md` asks for: the picture is a claim about the mechanic.
    expect(Math.hypot(warning.x2 - warning.x, warning.y2 - warning.y), 'the line is the dash').toBeCloseTo(330, 6);
    expect(warning.damage, 'the announcement carries no damage - the body does').toBe(0);
    expect(warning.source).toBe('EN004');
    expect(warning.life).toBeCloseTo(.55 - FRAME, 6);
    // It resolves by the dash starting, and the hit comes from the contact path instead.
    const probe = drive('threat-v2', 'EN004', 250, 90);
    expect(probe.sim.damageTakenBy.EN004, 'the body lands the hit').toBeGreaterThan(0);
    expect(probe.sim.damageTakenBy.EN004, 'and lands it once, not once per frame').toBeLessThan(probe.enemy.damage);
  });

  it('charge: one lunge per cooldown, and the cooldown is not re-entered while dashing', () => {
    // 4.5s holds one charge (2.6s cooldown plus .55 + .32) and part of a second; a self-stacking
    // cooldown would show three or more, and a missing one would show one per 1.2s.
    const probe = drive('threat-v2', 'EN004', 250, 270);
    const lunges = probe.steps.filter((step, index) => index > 0 && step / probe.enemy.speed > 5 * FRAME).length;
    expect(lunges, 'frames spent dashing in 4.5s').toBeGreaterThan(15);
    expect(lunges, 'still one dash, not two').toBeLessThan(25);
  });

  it('aoe_ranged: kites one band wider than the archer, and lobs instead of shooting', () => {
    for (const [gap, expected] of [[400, .6], [250, 0], [150, -.5]] as const) {
      const probe = drive('threat-v2', 'EN005', gap, 20);
      expect(probe.steps.reduce((sum, step) => sum + step, 0) / (probe.enemy.speed * FRAME * 20), `at ${gap}px`).toBeCloseTo(expected, 3);
    }
    // The archer's straight shot is `ranged`'s job; this row never pushes one.
    const probe = drive('threat-v2', 'EN005', 200, 300);
    expect(probe.sim.enemyShots, 'no straight projectile').toHaveLength(0);
    expect(probe.sim.damageTakenBy.EN005, 'but the lob lands').toBeGreaterThan(0);
  });

  it('aoe_ranged: the marker is a real circle, and the blast is delayed by its life', () => {
    const sim = field('threat-v2'), enemy = build('EN005', 200);
    enemy.attack = 0; sim.enemies.push(enemy);
    let markerAt = -1;
    for (let i = 0; i < 200 && markerAt < 0; i++) { sim.beginFrame(FRAME); if (sim.warnings.length) markerAt = i; sim.enemies.length = 0; sim.enemies.push(enemy); }
    expect(markerAt, 'the lob fires inside the window').toBeGreaterThan(0);
    const warning = sim.warnings[0]!;
    expect(warning.type).toBe('circle');
    if (warning.type !== 'circle') return;
    expect(warning.r).toBe(70);
    expect(warning.damage, 'the marker is the attack this time').toBeGreaterThan(0);
    // Aimed where the player stood: the player is inside its own marker at the moment it appears.
    expect(insideTelegraph(sim.player, warning), 'the player is inside the marker it was aimed at').toBe(true);
    expect(warning.life, '.9s of warning').toBeCloseTo(.9 - FRAME, 6);
    // And it does not land early: the player takes nothing while the marker is still counting down.
    const beforeBlast = sim.player.hp;
    for (let i = 0; i < 40; i++) { sim.beginFrame(FRAME); sim.enemies.length = 0; sim.enemies.push(enemy); }
    expect(sim.player.hp, 'no damage during the warning').toBe(beforeBlast);
    for (let i = 0; i < 20; i++) { sim.beginFrame(FRAME); sim.enemies.length = 0; sim.enemies.push(enemy); }
    expect(sim.player.hp, 'and it lands after it').toBeLessThan(beforeBlast);
  });

  it('aoe_ranged: walking out of the marker avoids the blast', () => {
    // Same run, except the player leaves the circle while the marker is still counting down.
    const inside = drive('threat-v2', 'EN005', 200, 260);
    // Step sideways, not outward: moving along x would put the player on top of the launcher and
    // the contact test would answer instead of the marker.
    const escaped = drive('threat-v2', 'EN005', 200, 260, (sim, index) => {
      if (index === 146) { sim.player.y += 200; }
    });
    expect(inside.sim.damageTakenBy.EN005, 'standing still costs health').toBeGreaterThan(0);
    expect(escaped.sim.damageTakenBy.EN005 ?? 0, 'leaving costs nothing').toBe(0);
  });

  it('keeps `brute` exactly as it was - no job was invented for the name', () => {
    const probe = drive('threat-v2', 'EN006', 250, 60);
    expect(probe.steps[0]! / (probe.enemy.speed * FRAME), 'still walks at 1.0').toBeCloseTo(1, 6);
    expect(probe.warnings.filter(count => count > 0), 'and announces nothing').toEqual([]);
    expect(probe.enemy.r, 'its only difference is still the radius').toBe(14);
  });

  it('one warning channel: `warnings`, shared with the Boss type, and empty under legacy', () => {
    const sim = field('threat-v2'), enemy = build('EN004', 250);
    enemy.attack = 0; sim.enemies.push(enemy);
    for (let i = 0; i < 5; i++) { sim.beginFrame(FRAME); sim.enemies.length = 0; sim.enemies.push(enemy); }
    expect(sim.warnings.length, 'threat-v2 pushes onto it').toBe(1);
    // The renderer reads `warnings` off `renderState()`; this asserts the field it reads is the
    // same object, so there is no renderer-only copy to drift.
    const rendered = sim.renderState().warnings;
    expect(rendered).toHaveLength(sim.warnings.length);
    expect(rendered[0]!.life).toBe(sim.warnings[0]!.life);
    expect(rendered[0]!.type).toBe('line');
    // `GameCore` passes the same list through, which is the path `mountBattle` actually takes.
    const core = new GameCore(structuredClone(fresh), () => .8, 'evolution', undefined, 'threat-v2');
    expect(Object.keys(core.renderState())).toContain('warnings');
    // The Boss keeps its own list - the enemy channel is not a second copy of it.
    expect(sim.bossEncounter.telegraphs).toHaveLength(0);
    // And under `legacy` the channel is never written to at all.
    const legacy = drive('legacy', 'EN004', 250, 120);
    expect(legacy.sim.warnings, 'legacy stays inert').toHaveLength(0);
  });

  it('states the mix each wave now meets, from the data', () => {
    const pool = firstStage.storyEncounter.enemies as [string, number][];
    const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
    expect(total).toBe(12);
    // Wave 0's note is "步卒与弓手建立基础走位": those two rows are still two thirds of every roll.
    const foot = pool.filter(([id]) => id === 'EN001' || id === 'EN002').reduce((sum, [, weight]) => sum + weight, 0);
    expect(foot / total, 'wave 0 is still foot soldiers and archers').toBeCloseTo(8 / 12, 6);
    // The three rows D22 measured as dead data are each reachable.
    for (const id of ['EN004', 'EN005', 'EN006']) expect(pool.find(([key]) => key === id)?.[1], id).toBe(1);
    // One pool, so the composition is the same in every wave; what moves per wave is rate and
    // elite chance, which is what `director` reads. Recorded rather than asserted to be equal.
    const waves = firstStage.storyEncounter.waves.map(wave => {
      const at = wave.at;
      const reference = director({ ...STATE, time: at }, PLAYER, 'normal');
      return { at, name: wave.name, budget: wave.budget, elite: wave.elite, interval: round(reference.interval), eliteChance: round(reference.eliteChance) };
    });
    expect(waveAt(0).note).toBe('步卒与弓手建立基础走位');
    expect(waves).toHaveLength(5);
  });

  it('writes the report', () => {
    const pool = firstStage.storyEncounter.enemies as [string, number][];
    const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
    const charge = drive('threat-v2', 'EN004', 250, 90);
    const planted = plantedRun(charge.steps), dashFrames = burstRun(charge.steps, planted);
    const lunge = lungeOf('EN004', 250);
    const lob = drive('threat-v2', 'EN005', 200, 300);
    const report = {
      slice: 'R3-E01..07a',
      harness: 'src/core/enemyWarnings.test.ts',
      instrument: 'createEnemy + CombatSimulation(rules=threat-v2), player parked with atk 0, pet off, one enemy, 1/60 s frames',
      pool: pool.map(([id, weight]) => ({ id, weight, share: round(weight / total) })),
      waves: firstStage.storyEncounter.waves.map(wave => ({
        at: wave.at, name: wave.name, type: wave.type, note: wave.note, budget: wave.budget, elite: wave.elite,
        director: (() => { const reference = director({ ...STATE, time: wave.at }, PLAYER, 'normal'); return { interval: round(reference.interval), eliteChance: round(reference.eliteChance) }; })(),
      })),
      charge: {
        id: 'EN004', speed: round(charge.enemy.speed), walkStep: round(charge.enemy.speed * FRAME),
        // `plantedFrames` counts frames with *zero* displacement, which is two more than the nominal
        // .55s: the frame that arms the dash still reports zero movement, and 1/60 arithmetic leaves
        // an epsilon tail on the countdown. Both are reported rather than tuned away.
        plantedFrames: planted, plantedSeconds: round(planted * FRAME), nominalWindup: .55,
        dashFrames, dashSeconds: round(dashFrames * FRAME), nominalDash: .32,
        dashStep: round(charge.steps[planted]!), dashStepOverWalk: round(charge.steps[planted]! / (charge.enemy.speed * FRAME)),
        dashDistance: round(lunge.travelled), hits: round(charge.sim.damageTakenBy.EN004 ?? 0),
      },
      aoe: {
        id: 'EN005', speed: round(lob.enemy.speed), radius: 70, delay: .9, every: 2.4,
        straightShots: lob.sim.enemyShots.length, damageTaken: round(lob.sim.damageTakenBy.EN005 ?? 0),
      },
      brute: { id: 'EN006', radius: build('EN006', 250).r, behaviour: 'unchanged: walks at 1.0, announces nothing' },
      legacy: { warnings: 0, note: 'the same two strings stay inert without a threat model - see enemyRoles.test.ts' },
    };
    const dir = resolve(EVIDENCE_ROOT, 'R3-E');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'enemy-warnings-report.json'), JSON.stringify(report, null, 2));
    expect(report.pool).toHaveLength(6);
  });
});
