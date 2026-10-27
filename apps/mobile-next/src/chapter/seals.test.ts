import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import { GameCore } from '../core/GameCore';
import { CombatSimulation } from '../core/CombatSimulation';
import { chapterStages } from './catalog';
import { prepareChapterRun } from './prepare';
import { createChapterProgression } from './growth';
import { validateChapterFinal } from './settlement';
import type { ChapterFinalRun } from './settlement';
import { SEAL_RADIUS } from './Seals';

/**
 * R3-M02: `CH001-02` 荒原镇界 - the three seals.
 *
 * Instrument: `GameCore` for the objective (victory/timeout live there) and a bare
 * `CombatSimulation` for the dwell rule (so a test can pin the player's position instead of
 * steering). Both read `sim.seals`, which is the same object `renderState()` publishes.
 *
 * The dwell rule shipped is **continuous**: leaving resets to zero. The alternative
 * ("累计驻守，离开不清零") is not a second code path - it is recomputed here from the same
 * trajectory, and its price is in the report.
 */
const SEAL = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-02', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
const FIRST = { ...SEAL, stageId: 'CH001-01' } as const;
const FRAME = 1 / 60;
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const stage = chapterStages[1]!;
const round = (value: number, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits;
const simOf = (core: GameCore) => (core as unknown as { combat: CombatSimulation }).combat;
/** Filled by the tests, read by the report - every number in the file was measured here. */
const MEASURED: Record<string, unknown> = {};

function field() {
  const preparation = prepareChapterRun(fresh, SEAL);
  const sim = new CombatSimulation(fresh, createChapterProgression(preparation, () => .8), () => .8, [], Date.now, preparation);
  sim.player.atk = 0; sim.player.aspd = 0; sim.player.hp = 1e9; sim.player.maxHp = 1e9;
  return sim;
}
/** Park the player (when `at` is given), tick one production frame, and keep the arena empty. */
function tick(sim: CombatSimulation, seconds: number, at?: { x: number; y: number }) {
  for (let elapsed = 0; elapsed < seconds - 1e-9;) {
    const dt = Math.min(FRAME, seconds - elapsed);
    sim.clearInput();
    if (at) { sim.player.x = at.x; sim.player.y = at.y; }
    sim.beginFrame(dt); sim.enemies.length = 0; sim.finishBaseFrame(dt);
    elapsed += dt;
  }
}
const sealAt = (sim: CombatSimulation, index: number) => sim.seals!.renderState()[index]!;

describe('the door: CH001-02 is enterable and has no Boss', () => {
  it('prepares the seal row itself, not the first stage, and reports it to the HUD', () => {
    const core = new GameCore(fresh, () => .8, 'classic', SEAL); core.start();
    expect(core.chapter!.stage.id).toBe('CH001-02');
    // D27 added the result screen's two words to the stage identity, so the row is compared field
    // by field against the catalog instead of against a literal that would drift with it.
    expect(core.snapshot().stage).toEqual({ id: 'CH001-02', name: '荒原镇界', duration: 420, hasBoss: false, clear: '镇界完成', timeout: '镇界超时' });
    expect(core.snapshot().seals).toMatchObject({ rule: 'continuous', held: 0, total: 3 });
    expect(core.snapshot().seals!.rows.map(row => row.state)).toEqual(['locked', 'locked', 'locked']);
    core.destroy();
  });
  it('never spawns a Boss, and never announces one either', () => {
    // The old `snapshot().phase` said 'warning' from t=250 on every stage; on a stage with
    // `boss: null` that promised a Boss that the data does not contain.
    const core = new GameCore(fresh, () => .8, 'classic', SEAL); core.start();
    const sim = simOf(core);
    for (const at of [240, 250, 300, 419]) {
      sim.time = at;
      expect(core.snapshot().boss.phase, `t=${at}`).toBe('advance');
      expect(core.snapshot().boss.boss, `t=${at}`).toBeUndefined();
    }
    sim.time = 270; expect(sim.bossEncounter.spawn()).toBe(false);
    expect(sim.bossEncounter.active).toBeUndefined();
    core.destroy();
  });
  it('opens CH001-03 too, and it is not this stage: it has a Boss and no seals', () => {
    // D27 opened it. The assertion stays in this file because it is what makes the seal rule the
    // stage's: the stage next door declares `seals: []` and a Boss, and gets no seal panel.
    const altar = prepareChapterRun(fresh, { ...SEAL, stageId: 'CH001-03' });
    expect(altar.stage.seals).toEqual([]);
    expect(altar.stage.boss).toEqual({ id: 'CH001_ALTAR', spawnAt: 360 });
  });
});

describe('the seal: when it opens, and what leaving costs', () => {
  it('a seal is shut until its opensAt, whatever the player does', () => {
    const sim = field(), seal = sealAt(sim, 0);
    sim.time = 0; tick(sim, 89, { x: seal.x, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]).toMatchObject({ state: 'locked', progress: 0 });
    expect(sim.seals!.snapshot().rows[0]!.opensIn).toBeCloseTo(1, 6);
    tick(sim, 1.5, { x: seal.x, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]!.state).toBe('holding');
    // 89 + 1.5 = 90.5, so only half a second of it was inside an open seal. The gate is the
    // seal's, not the player's: 89 s of standing on a shut seal buys nothing.
    expect(sim.seals!.snapshot().rows[0]!.progress).toBeCloseTo(.5, 3);
  });
  it('twenty seconds inside holds it - and 19.9 s then out is worth nothing', () => {
    const sim = field(), seal = sealAt(sim, 0);
    sim.time = 90;
    tick(sim, 19.9, { x: seal.x, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]!.progress).toBeCloseTo(19.9, 3);
    expect(sim.seals!.snapshot().rows[0]!.state).toBe('holding');
    // One frame outside: the continuous rule throws the 19.9 s away.
    tick(sim, 2 * FRAME, { x: seal.x + SEAL_RADIUS + 1, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]).toMatchObject({ state: 'open', progress: 0 });
    expect(sim.seals!.snapshot().notice).toContain('镇守中断');
    // Back inside, it needs the full twenty again: the counterfactual cumulative rule would
    // have finished here instead (19.9 + 0.1 = 20.0 s inside), which is the price of the choice.
    tick(sim, 19.9, { x: seal.x, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]!.state).toBe('holding');
    tick(sim, .2, { x: seal.x, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]!.state).toBe('held');
    MEASURED.boundary = { insideBeforeLeaving: 19.9, outside: round(2 * FRAME, 4), totalToHold: round(19.9 + 2 * FRAME + 19.9 + .2, 4), cumulativeWouldBe: 20 };
  });
  it('the radius is the boundary, not the centre: 84 px is inside and 85 is not', () => {
    const sim = field(), seal = sealAt(sim, 0);
    sim.time = 90;
    tick(sim, .5, { x: seal.x + SEAL_RADIUS - .5, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]!.progress).toBeGreaterThan(0);
    const before = sim.seals!.snapshot().rows[0]!.progress;
    tick(sim, .5, { x: seal.x + SEAL_RADIUS + .5, y: seal.y });
    expect(sim.seals!.snapshot().rows[0]!.progress).toBe(0);
    expect(before).toBeGreaterThan(0);
  });
  it('the three seals open in order and each holds only itself', () => {
    const sim = field(), seals = sim.seals!.renderState();
    sim.time = 180;
    tick(sim, 20.2, { x: seals[1]!.x, y: seals[1]!.y });
    const rows = sim.seals!.snapshot().rows;
    expect(rows.map(row => row.state)).toEqual(['open', 'held', 'locked']);
    expect(rows[0]!.progress).toBe(0);
  });
});

describe('the objective: three seals is a victory, the duration is a timeout', () => {
  it('three seeds win at the earliest possible second', () => {
    const wins = [15, 7, 99].map(seed => playSealStage(seed));
    // Recorded before the assertions: a report that only exists when the test passes is not a
    // measurement, it is a receipt.
    MEASURED.wins = wins;
    for (const win of wins) {
      expect(win.endReason, `seed ${win.seed}: the bot walks to each seal and holds`).toBe('victory');
      // The last seal opens at 270 and needs 20 s, so 290 is the earliest any run can win.
      expect(win.at, `seed ${win.seed}`).toBeCloseTo(290, 1);
      expect(win.held, `seed ${win.seed}`).toBe(3);
      // A win has to leave a body behind: if this ever reads 0, the victory was not earned.
      expect(win.hp, `seed ${win.seed}: finished standing`).toBeGreaterThan(0);
    }
  }, 900_000);
  it('the run ends at the stage duration when the seals are not held', () => {
    // Driven to the last frame instead of played for 420 s: a bot that has to survive seven
    // minutes to demonstrate a deadline is measuring the arena, not the deadline.
    const core = new GameCore(fresh, () => .8, 'classic', SEAL); core.start();
    const sim = simOf(core);
    sim.time = stage.duration - FRAME;
    core.advance(FRAME);
    expect(core.snapshot().endReason).toBe('timeout');
    const final = core.chapterFinalRun()!;
    expect(final).toMatchObject({ endReason: 'timeout', sealsHeld: 0, bossDefeated: false, bossLootClaimed: false });
    expect(final.time).toBeCloseTo(stage.duration, 6);
    expect(() => validateChapterFinal(prepareChapterRun(fresh, SEAL), final)).not.toThrow();
    MEASURED.timeout = { endReason: final.endReason, time: final.time, sealsHeld: final.sealsHeld };
    core.destroy();
  });
  it('settlement refuses a seal victory that has not had time to happen', () => {
    const preparation = prepareChapterRun(fresh, SEAL);
    const final = (change: Partial<ChapterFinalRun>): ChapterFinalRun => ({
      ...SEAL, endReason: 'victory', time: 300, hp: 200, maxHp: 620, level: 8, kills: 150,
      formId: 'dragon', awakened: true, coreSkillLevel: 3, routes: ['volley'], bonds: ['wildfire'],
      damageBy: { A003: 1000 }, damageTakenBy: { EN001: 420 }, bossDefeated: false, bossLootClaimed: false,
      sealsHeld: 3, elitesChecked: 0, ...change,
    });
    expect(() => validateChapterFinal(preparation, final({}))).not.toThrow();
    // 289 s is one second before the third seal could possibly be held.
    expect(() => validateChapterFinal(preparation, final({ time: 289 }))).toThrow('界碑时限');
    // Two seals is not the objective, however long the run lasted.
    expect(() => validateChapterFinal(preparation, final({ sealsHeld: 2 }))).toThrow('胜利目标');
    // And a bossless stage cannot claim a Boss kill.
    expect(() => validateChapterFinal(preparation, final({ bossDefeated: true, time: 400 }))).toThrow('首领');
    // The Boss stage keeps its own objective: seals do not win CH001-01.
    const boss = prepareChapterRun(fresh, FIRST);
    expect(() => validateChapterFinal(boss, { ...final({ sealsHeld: 0 }), ...FIRST, stageId: 'CH001-01' })).toThrow('胜利目标');
  });
});

describe('readability: the renderer reads the fields the snapshot reports', () => {
  it('every drawn seal carries the state and ratio the HUD prints', () => {
    const sim = field(), seals = sim.seals!.renderState();
    sim.time = 90;
    tick(sim, 5, { x: seals[0]!.x, y: seals[0]!.y });
    const drawn = sim.seals!.renderState(), rows = sim.seals!.snapshot().rows;
    expect(drawn).toHaveLength(3);
    for (const [index, seal] of drawn.entries()) {
      expect(seal.state).toBe(rows[index]!.state);
      expect(seal.ratio).toBeCloseTo(rows[index]!.progress / rows[index]!.dwell, 6);
      expect(seal.r).toBe(SEAL_RADIUS);
    }
    expect(drawn[0]!.state).toBe('holding');
    expect(drawn[1]!.state).toBe('locked');
    // The state the HUD prints is the state the map draws - one field, two readers.
    expect(rows[0]!.state).toBe('holding');
    MEASURED.readability = { states: drawn.map(seal => seal.state), ratios: drawn.map(seal => round(seal.ratio, 4)) };
  });
  it('the next seal is the first one not held, and it knows the distance and the compass', () => {
    const core = new GameCore(fresh, () => .8, 'classic', SEAL); core.start(390, 844);
    const seals = core.snapshot().seals!;
    expect(seals.next!.index).toBe(0);
    expect(seals.rows[0]!.distance).toBeGreaterThan(0);
    expect(['东', '东南', '南', '西南', '西', '西北', '北', '东北']).toContain(seals.rows[0]!.direction);
    expect(seals.rows[0]!.opensIn).toBeCloseTo(90, 6);
    core.destroy();
  });
});

/**
 * A reference player, not a cripple: it circles the inside of the seal (standing still is not a
 * player - a body that never moves measures the arena, not the objective), dodges when two bodies
 * are within 70 px, spends the ultimate when it is up, and takes a recovery offer when it is
 * below 55% health. Anything weaker under-reports what the stage allows; anything stronger
 * (perfect kiting, frame-perfect dodges) would not be a floor a human can meet.
 */
function playSealStage(seed: number) {
  const core = new GameCore(fresh, () => .8, 'classic', { ...SEAL, seed });
  core.start(390, 844);
  const sim = simOf(core), seals = sim.seals!;
  const hpAtHold: { held: number; at: number; hp: number }[] = [];
  let held = -1, dodges = 0, ultimates = 0;
  for (let frame = 0; frame < 460 * 60; frame++) {
    const snapshot = core.snapshot();
    if (snapshot.status === 'ended') break;
    if (snapshot.status === 'choosing') {
      const choice = snapshot.choice!, hurt = sim.player.hp < sim.player.maxHp * .55;
      const pick = (hurt ? choice.options.find(option => option.kind === 'recovery') : undefined)
        ?? choice.options.find(option => option.kind === 'active') ?? choice.options[0]!;
      core.choose(choice.token, pick.kind, pick.id);
      continue;
    }
    const target = seals.renderState().find(seal => seal.state !== 'held')!;
    const dx = target.x - sim.player.x, dy = target.y - sim.player.y, gap = Math.hypot(dx, dy);
    if (gap > SEAL_RADIUS * .85) core.move(dx, dy); else core.move(-dy, dx);
    const close = sim.enemies.filter(enemy => Math.hypot(enemy.x - sim.player.x, enemy.y - sim.player.y) < 70).length;
    if (snapshot.dodgeCd <= 0 && close >= 2 && core.action('dodge')) dodges++;
    if (snapshot.ult >= 100 && close >= 1 && core.action('ultimate')) ultimates++;
    core.advance(FRAME);
    const now = seals.snapshot().held;
    if (now !== held) { held = now; hpAtHold.push({ held: now, at: round(sim.time, 2), hp: round(sim.player.hp, 1) }); }
  }
  const result = {
    seed, endReason: core.snapshot().endReason, at: round(sim.time, 2), held: seals.snapshot().held,
    hp: round(sim.player.hp, 1), level: core.snapshot().level, kills: sim.kills, dodges, ultimates, hpAtHold,
  };
  core.destroy();
  return result;
}

it('writes the report', () => {
  const sim = field();
  const report = {
    slice: 'R3-M02',
    instrument: 'GameCore(chapter1-v1, seed 15) for the objective; CombatSimulation for the dwell rule',
    stage: { ...stage, seals: stage.seals },
    layout: sim.seals!.renderState().map(seal => ({ index: seal.index, x: seal.x, y: seal.y, r: seal.r })),
    world: sim.world,
    rule: sim.seals!.snapshot().rule,
    boundary: MEASURED.boundary,
    wins: MEASURED.wins,
    timeout: MEASURED.timeout,
    readability: MEASURED.readability,
  };
  const dir = resolve(EVIDENCE_ROOT, 'R3-M');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'seal-report.json'), JSON.stringify(report, null, 2));
  expect(report.rule).toBe('continuous');
});
