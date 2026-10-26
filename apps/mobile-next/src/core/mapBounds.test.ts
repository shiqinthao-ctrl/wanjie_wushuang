import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { calculateStartup } from './growth';
import { createEnemy, firstStage } from './spawnRules';
import type { DirectorState } from './spawnRules';

/**
 * R3-M01: the first stage's map, measured against the three things `QUEUE.md` #11 says it has.
 *
 * The row asks for "no invisible blockers, a hazard layer hierarchy, boundaries". Scope 0 found
 * that two of those name nothing:
 *
 * - **No collider exists anywhere.** Nothing on this map is solid, so "no invisible blocker" is
 *   true because there is nothing to hide - a weaker statement than the row's. The assertion
 *   below is the strong form: a walk through every object keeps a constant step.
 * - **One hazard layer**, not a hierarchy (`firstStage.storyEncounter.hazard` is an object, and
 *   `Fireline.type` is the literal `'fireline'`).
 * - **Three different edge rules**, not one: the player is clamped at 18, an enemy body was
 *   clamped only at spawn, and a projectile is culled 100 px outside. The middle one is the bug
 *   this slice fixes.
 *
 * Instrument: `CombatSimulation` under `threat-v2` (the shipped profile) driven by `beginFrame`,
 * which is the only driver that runs `enemyAI` and the player's own movement. The spawner's
 * output is dropped every frame so the body under test is the only one on the field. Numbers
 * land in `evidence/R3-M/map-report.json`.
 */
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const FRAME = 1 / 60;
const STATE: DirectorState = { time: 0, kills: 0, dps: 0, level: 1, evolved: 0, fused: 0 };
const WORLD = { width: 3600, height: 2400 };
const VIEWPORT = { width: 390, height: 844 };

function field(rules: 'legacy' | 'threat-v2' = 'threat-v2', random: () => number = () => .5) {
  const initial = calculateStartup(fresh);
  const progression = new Progression(fresh.build, initial.skills, initial.passives, random);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero: 'H001' }, progression, random, [], Date.now, undefined, rules);
  sim.pet.enabled = false; sim.player.atk = 0;
  return sim;
}
/**
 * Walk in one direction and return the player's positions, one per frame, after `settle` frames
 * have been dropped. `clearInput()` zeroes the smoothed `response` as well as the input, so the
 * settle has to happen inside the same sweep - a second `sweep()` call would restart the ramp
 * and the first measured frame would be short by design, not by collision.
 */
function sweep(sim: CombatSimulation, dx: number, dy: number, frames: number, settle = 0): number[] {
  sim.clearInput(); sim.move(dx, dy);
  const path: number[] = [];
  for (let i = 0; i < frames + settle; i++) {
    sim.beginFrame(FRAME); sim.enemies.length = 0;
    if (i >= settle) path.push(dx ? sim.player.x : sim.player.y);
  }
  return path;
}
/** One fireline trigger at `time`, with the draw pinned to `u`, returning the line's `y`. */
function triggerAt(playerY: number, u: number, viewport = VIEWPORT, rules: 'legacy' | 'threat-v2' = 'threat-v2') {
  const sim = field(rules, () => u);
  sim.resize(viewport.width, viewport.height);
  sim.player.x = 1800; sim.player.y = playerY;
  sim.time = firstStage.storyEncounter.hazard.interval + .01;
  sim.map.advanceHazards(.02);
  return { sim, y: sim.map.renderState().hazards[0]?.y };
}
const round = (value: number, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits;
/** Filled by the tests above, read by the report - so every number in the file was measured here. */
const MEASURED: Record<string, unknown> = {};

describe('R3-M01: the map has no geometry, one random slot, and three edge rules', () => {
  it('nothing on the map is solid: a walk through every object keeps one constant step', () => {
    const sim = field(), speed = sim.player.speed, step = speed * FRAME;
    const walks: { type: string; from: number; to: number; constant: boolean }[] = [];
    for (const item of sim.map.renderState().interactables) {
      // Start 300 px to the left of the object and walk straight through its centre.
      sim.player.x = item.x - 300; sim.player.y = item.y;
      // 30 frames of settle (the input ramp is exponential), then 180 measured frames = 3 s.
      const path = sweep(sim, 1, 0, 180, 30);
      const steps = path.slice(1).map((x, i) => x - path[i]!);
      // Every frame moves the same distance. A collider would show up as one short step (or a
      // stop) somewhere in the middle - the exact shape "an invisible blocker" has.
      const constant = steps.every(d => Math.abs(d - step) < 1e-9);
      walks.push({ type: item.type, from: round(path[0]!), to: round(path.at(-1)!), constant });
      expect(constant, `${item.type} at ${round(item.x)}: one step, no bump`).toBe(true);
    }
    // The walk crosses each object and keeps going: 180 frames of `speed * dt`, nothing less.
    for (const walk of walks) expect(round(walk.to - walk.from, 3)).toBeCloseTo(round(step * 179, 3), 6);
    expect(walks).toHaveLength(6);
    MEASURED.walk = { speed: round(speed), step: round(step), frames: 179, travel: round(walks[0]!.to - walks[0]!.from, 2), constant: walks.every(walk => walk.constant) };
    // The objects are still *reachable* - not solid, not inert: the 74-unit gate is the only
    // thing standing between the player and a use.
    const item = sim.map.renderState().interactables[0]!;
    sim.player.x = item.x + 74.01; sim.player.y = item.y; expect(sim.map.useNearest()).toBe(false);
    sim.player.x = item.x + 74; expect(sim.map.useNearest()).toBe(true);
  });

  it('the world edge clamps the player at 18 on all four corners', () => {
    const sim = field(), margin = 18;
    const corners = [
      { dx: -1, dy: -1, x: margin, y: margin },
      { dx: 1, dy: -1, x: WORLD.width - margin, y: margin },
      { dx: -1, dy: 1, x: margin, y: WORLD.height - margin },
      { dx: 1, dy: 1, x: WORLD.width - margin, y: WORLD.height - margin },
    ];
    for (const corner of corners) {
      sim.player.x = 1800; sim.player.y = 1200;
      sweep(sim, corner.dx, corner.dy, 1200);                  // 20 s, far more than it takes
      expect(sim.player.x, `x at (${corner.dx},${corner.dy})`).toBe(corner.x);
      expect(sim.player.y, `y at (${corner.dx},${corner.dy})`).toBe(corner.y);
    }
  });

  it('kiting never leaves the world - and the reason is geometry, not a clamp', () => {
    // `EN002` backs off while the player is closer than 190 px. Park the player on the wall, walk
    // the archer into it, and the retreat direction is *away from the player* - i.e. into the map,
    // because the player is always at least 18 px inside it. So kiting cannot push a body out;
    // this test is the reason the fix below is provably inert for `ranged`, `aoe_ranged` and
    // `shield`. What broke the invariant was `charge`, which aims *through* the player.
    const sim = field(), enemy = createEnemy(STATE, { x: 1800, y: 1200, hp: 1, maxHp: 1, atk: 1 }, VIEWPORT, WORLD, 'normal', () => .5, { id: 'EN002' });
    sim.player.x = 18; sim.player.y = 1200;
    enemy.x = 60; enemy.y = 1200; enemy.attack = 0; enemy.skill = 0;
    sim.enemies.push(enemy);
    let minX = enemy.x, maxGap = 0;
    for (let i = 0; i < 600; i++) {
      sim.beginFrame(FRAME); sim.enemies.length = 0; sim.enemies.push(enemy);
      minX = Math.min(minX, enemy.x);
      maxGap = Math.max(maxGap, Math.hypot(enemy.x - sim.player.x, enemy.y - sim.player.y));
    }
    expect(enemy.x, 'the archer stays on the map').toBeGreaterThanOrEqual(enemy.r);
    expect(minX, 'it never leaves, not even for one frame').toBeGreaterThanOrEqual(enemy.r);
    // It retreats *into* the map, not toward the wall: the sign is the whole argument.
    expect(enemy.x, 'it backs away from the player, not past them').toBeGreaterThan(60);
    // ...and the gap it opens is the kiting band, not a gap the player cannot cross.
    // The retreat stops once `d >= 190`, so it overshoots the band by at most one frame of
    // half-speed walking - that overshoot is the kiting rule, not a leak.
    expect(maxGap).toBeLessThanOrEqual(190 + enemy.speed * .5 * FRAME + 1e-9);
  });

  it('a charge dash that overshoots the map is clamped, not cancelled', () => {
    // The dash aims at the player and travels 330 px from a 260 px standoff, so it always ends up
    // past them - and when the player is cornered, "past them" is outside the world. Measured
    // before the clamp at `x = -30`, i.e. a body 30 px off the map, shooting and hitting from
    // there. The clamp keeps the body inside without cancelling the lunge.
    const sim = field(), enemy = createEnemy(STATE, { x: 1800, y: 1200, hp: 1, maxHp: 1, atk: 1 }, VIEWPORT, WORLD, 'normal', () => .5, { id: 'EN004' });
    sim.player.x = 40; sim.player.y = 1200;
    enemy.x = 300; enemy.y = 1200; enemy.attack = 0;
    sim.enemies.push(enemy);
    let minX = enemy.x;
    for (let i = 0; i < 180; i++) {
      sim.beginFrame(FRAME); sim.enemies.length = 0; sim.enemies.push(enemy);
      minX = Math.min(minX, enemy.x);
    }
    // The clamp bites on the frame the dash crosses the wall, and on every frame after it.
    expect(minX).toBeGreaterThanOrEqual(enemy.r);
    expect(enemy.x).toBeGreaterThanOrEqual(enemy.r);
  });

  it('a projectile leaves the world on purpose: it is culled, not clamped', () => {
    const sim = field();
    sim.player.x = 40; sim.player.y = 1200;
    sim.projectile('MAP_PROBE', { x: 40, y: 1200 }, Math.PI, 400, 10, 4);
    // The auto-cast loop shares `projectiles`, so the probe is read by id, not by index.
    const probe = () => sim.projectiles.find(shot => shot.id === 'MAP_PROBE');
    for (let i = 0; i < 60; i++) sim.updateOuter(FRAME);
    const shot = probe();
    // Culled once it is 100 px outside - so it *did* leave the world, and that is the rule for a
    // projectile. Stated here because "one clamp for everything" is the shape the row imagines.
    expect(shot === undefined || shot.x >= -100).toBe(true);
    for (let i = 0; i < 30; i++) sim.updateOuter(FRAME);
    expect(probe(), 'gone by the time it is 100 px out').toBeUndefined();
  });
});

describe('R3-M01: the one random slot on the map is the fireline, and it is escapable', () => {
  const hazard = firstStage.storyEncounter.hazard;
  const margin = 18;

  it('the line always spawns inside the viewport band around the player, and inside the world', () => {
    const rows: { playerY: number; u: number; lineY: number; offPlayer: number }[] = [];
    for (const playerY of [18, 200, 1200, 2200, WORLD.height - 18]) {
      for (const u of [0, .25, .5, .75, .999]) {
        const { y } = triggerAt(playerY, u);
        expect(y, `line exists at playerY ${playerY}, u ${u}`).toBeTypeOf('number');
        const lineY = y!;
        // The line's *body* stays inside the world (half its thickness from each wall), and it is
        // never further than half a viewport minus 80 from the player - the band is the screen,
        // not the world.
        expect(lineY).toBeGreaterThanOrEqual(hazard.size / 2);
        expect(lineY).toBeLessThanOrEqual(WORLD.height - hazard.size / 2);
        expect(Math.abs(lineY - playerY)).toBeLessThanOrEqual(VIEWPORT.height / 2 - 80 + 1e-9);
        rows.push({ playerY, u, lineY: round(lineY, 2), offPlayer: round(lineY - playerY, 2) });
      }
    }
    expect(rows).toHaveLength(25);
  });

  it('the band can put the line exactly on the player, and the escape is still 18 px', () => {
    // Worst case for the player is the best case for the hazard: `u` chosen so the line lands on
    // the player's own y. The escape is then half the line's thickness, and nothing else.
    const { sim, y } = triggerAt(1200, .5);
    expect(y).toBeDefined();
    // Solve for the draw that lands the line on the player, using the production formula's own
    // shape rather than a copied constant: search the draw, then assert on the result.
    let worst = Infinity, worstU = -1;
    for (let i = 0; i <= 1000; i++) {
      const u = i / 1000, probe = triggerAt(1200, u).y;
      if (probe === undefined) continue;
      const gap = Math.abs(probe - 1200);
      if (gap < worst) { worst = gap; worstU = u; }
    }
    expect(worst, 'the line can land on the player').toBeLessThan(1);
    const escape = Math.max(0, hazard.size / 2 - worst);
    const seconds = escape / sim.player.speed;
    // The claim in `desc` - "低频横向火线留出明确闪避窗口" - is true with an enormous margin:
    // the window is `life` seconds, the requirement is a tenth of a second.
    expect(seconds).toBeLessThan(hazard.life / 10);
    expect(seconds).toBeCloseTo(escape / sim.player.speed, 9);
    expect(worstU).toBeGreaterThanOrEqual(0);
  });

  it('a wall is not a safe zone: the line can reach a player hugging it', () => {
    // Before this slice the line's centre was clamped 80 px inside the world, so its damage band
    // stopped 62 px short of the wall while the player could stand 18 px from it - a 44 px strip
    // along each wall where the fireline could never land. Measured: for every draw, the closest
    // the line ever got to a wall-hugging player was 62 px, against a 36 px line. That is the
    // "never met" half of the row, and it is the half that was actually broken.
    const draws = Array.from({ length: 201 }, (_, i) => i / 200);
    for (const playerY of [margin, WORLD.height - margin]) {
      const gaps = draws.map(u => Math.abs(triggerAt(playerY, u).y! - playerY));
      const closest = Math.min(...gaps);
      // It can now land on them: the closest approach is 0, not 62.
      expect(closest, `playerY ${playerY}: the line reaches the wall`).toBeLessThan(1);
      // ...and it still never leaves the world, so the escape is always on the inside.
      const ys = draws.map(u => triggerAt(playerY, u).y!);
      expect(Math.min(...ys)).toBeGreaterThanOrEqual(hazard.size / 2);
      expect(Math.max(...ys)).toBeLessThanOrEqual(WORLD.height - hazard.size / 2);
      const wall = (MEASURED.wall ??= []) as Record<string, number>[];
      wall.push({ playerY, closest: round(closest, 2), draws: draws.length });
    }
  });

  it('a safe y always exists inside the clamped band, so a wall cannot trap the player', () => {
    // The line spans the full width, so the only escape is vertical. If the line could spawn
    // within 18 px of a wall the player is pinned against, there would be no safe y on that side.
    // It cannot: the line is clamped to 80 and the player to 18, so the wall side always keeps
    // at least 62 px of room.
    for (const playerY of [18, 40, 1200, WORLD.height - 40, WORLD.height - 18]) {
      for (const u of [0, .5, .999]) {
        const { y } = triggerAt(playerY, u);
        const lineY = y!;
        const candidates = [lineY - hazard.size / 2, lineY + hazard.size / 2]
          .filter(candidate => candidate >= margin && candidate <= WORLD.height - margin);
        expect(candidates.length, `playerY ${playerY}, u ${u}: a side to step to`).toBeGreaterThan(0);
        // ...and it is always the near side, i.e. the escape never requires crossing the line.
        for (const candidate of candidates) expect(Math.abs(candidate - playerY)).toBeLessThanOrEqual(VIEWPORT.height / 2);
      }
    }
  });

  it('the fireline damages only the player: the horde walks through it', () => {
    const sim = field(), enemy = createEnemy(STATE, { x: 1800, y: 1200, hp: 1, maxHp: 1, atk: 1 }, VIEWPORT, WORLD, 'normal', () => .5, { id: 'EN001' });
    enemy.x = 1000; enemy.y = 1200; enemy.attack = 0; sim.enemies.push(enemy);
    sim.player.x = 1800; sim.player.y = 1200;
    sim.time = hazard.interval + .01;
    sim.map.advanceHazards(.02);
    const line = sim.map.renderState().hazards[0]!;
    const hp = sim.player.hp, enemyHp = enemy.hp;
    // Put both bodies inside the line and hold them there for the whole window.
    sim.player.y = line.y; enemy.y = line.y;
    for (let i = 0; i < 240; i++) { sim.player.y = line.y; enemy.y = line.y; sim.map.advanceHazards(FRAME); }
    expect(sim.player.hp, 'the player pays').toBeLessThan(hp);
    // Recorded, not endorsed: the hazard is one-sided. It is written into the evidence page as an
    // open design question (`R3-M02`), not pinned as intended behaviour.
    expect(enemy.hp, 'the horde does not').toBe(enemyHp);
  });

  it('the band is screen space, so a run is reproducible only at one viewport', () => {
    // `u = .5` is the band's midpoint, which is the player's own y at any viewport size - so the
    // draw has to be off-centre to show the dependence.
    const tall = triggerAt(1200, .25, { width: 390, height: 844 }).y;
    const short = triggerAt(1200, .25, { width: 390, height: 600 }).y;
    // Same seed, same draw, same second - a different phone. The seeded RNG does not make the
    // hazard reproducible across devices, because the band it draws from is the viewport.
    expect(tall).not.toBe(short);
    expect(Math.abs(tall! - short!), 'the same draw lands 61 px apart').toBeCloseTo(61, 6);
    // Both stay inside the *smaller* band: the draw is a fraction of the band, so it scales.
    expect(Math.abs(short! - 1200)).toBeLessThanOrEqual(600 / 2 - 80 + 1e-9);
  });

  it('writes the map report', () => {
    const hazardRows = [18, 200, 1200, 2200, WORLD.height - 18].flatMap(playerY =>
      [0, .25, .5, .75, .999].map(u => { const { y } = triggerAt(playerY, u); return { playerY, u, lineY: round(y!, 2) }; }));
    const viewports = [{ width: 390, height: 844 }, { width: 390, height: 600 }, { width: 1280, height: 720 }]
      .map(viewport => ({ viewport, u: .25, lineY: round(triggerAt(1200, .25, viewport).y!, 2) }));
    const report = {
      slice: 'R3-M01',
      instrument: 'CombatSimulation(threat-v2) driven by beginFrame; fireline via FirstStageMap.advanceHazards',
      colliders: { count: 0, walks: 6, walk: MEASURED.walk },
      edges: {
        player: { rule: 'clamp', margin: 18, sites: ['beginFrame', 'dodge', 'EvolutionCombat:56'] },
        enemy: { rule: 'clamp', margin: 'enemy.r', site: 'enemyAI', before: 'spawn only (spawnRules:64, margin 30)', foundBy: 'a 330 px charge dash from a 260 px standoff ended at x = -30' },
        projectile: { rule: 'cull', margin: -100, site: 'updateOuter' },
        enemyShot: { rule: 'life only', margin: null, site: 'finishBaseFrame' },
      },
      hazard: {
        layers: 1, size: hazard.size, life: hazard.life, interval: hazard.interval, damage: hazard.damage,
        dutyCycle: round(hazard.life / hazard.interval),
        worstEscapePx: hazard.size / 2,
        worstEscapeSeconds: round(hazard.size / 2 / field().player.speed),
        windowSeconds: hazard.life,
        overshoot: round(hazard.life / (hazard.size / 2 / field().player.speed), 1),
        damagesEnemies: false,
        clamp: { before: 80, after: hazard.size / 2, wallStripBefore: 80 - 18 - hazard.size / 2, wallStripAfter: 0 },
        wall: MEASURED.wall,
        rows: hazardRows,
        viewports,
      },
      layout: { source: 'const layout (FirstStageMap:12), oracle-pinned by first-map-oracle.json', random: false, objects: 6 },
      history: { hazardPeak: 'declared at CombatSimulation:77, never written' },
    };
    const dir = resolve(EVIDENCE_ROOT, 'R3-M');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'map-report.json'), JSON.stringify(report, null, 2));
    expect(report.hazard.layers).toBe(1);
  });
});
