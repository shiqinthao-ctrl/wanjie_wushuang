import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import fresh from '../data/freshSave.json';
import bossData from '../data/firstBoss.json';
import { GameCore } from '../core/GameCore';
import { CombatSimulation } from '../core/CombatSimulation';
import { bossRow, insideTelegraph } from '../core/FirstBoss';
import { firstStage } from '../core/spawnRules';
import { chapterStages } from './catalog';
import { prepareChapterRun } from './prepare';
import { createChapterProgression } from './growth';
import { validateChapterFinal } from './settlement';

/**
 * R3-M03 / D27: the altar lord, and the Boss id that had no reader.
 *
 * `CH001-03` declared `boss: { id: 'CH001_ALTAR' }` while `FirstBoss.spawn()` hardcoded `B001`, so
 * the stage fielded the brute. Three things are asserted here and each has its own describe:
 *
 *   - resolvable - the id a stage writes is the key of a row, a missing id throws at construction,
 *                  and the shipped path's id comes from `firstStage.bossId` (data that already said
 *                  `B001` while the code ignored it);
 *   - parametric - phase thresholds, per-phase costs and phase-3 adds come from the row, measured
 *                  on both Bosses so the altar's numbers cannot be the code's numbers;
 *   - finishable - a reference player wins the stage, and `validateChapterFinal` accepts the report.
 *
 * The instrument is a **calibrated** bot: the same policy wins `CH001-01` (the stage that already
 * ships) on all three seeds. Without that control, "the altar is too hard" and "the bot is bad"
 * are the same measurement - and an earlier version of this file reported the second as the first.
 */
const ALTAR = { ruleset: 'chapter1-v1', chapterId: 'CH001', stageId: 'CH001-03', heroId: 'H001', mode: 'story', difficulty: 'normal', seed: 15 } as const;
const FRAME = 1 / 60;
const SEEDS = [15, 7, 99] as const;
const stage = chapterStages[2]!;
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const round = (value: number, digits = 4) => Math.round(value * 10 ** digits) / 10 ** digits;
const simOf = (core: GameCore) => (core as unknown as { combat: CombatSimulation }).combat;
const MEASURED: Record<string, unknown> = {};

/** A bare simulation with the Boss on the field and the elite gate already satisfied. */
function bossSim(stageId: 'CH001-01' | 'CH001-03') {
  const preparation = prepareChapterRun(fresh, { ...ALTAR, stageId });
  const sim = new CombatSimulation(fresh, createChapterProgression(preparation, () => .8), () => .8, [], Date.now, preparation);
  // A probe body: no damage output, no attack speed, and enough health that nothing here is a
  // survival test - the rule under measurement is the Boss's, not the arena's.
  sim.player.atk = 0; sim.player.aspd = 0; sim.player.hp = 1e9; sim.player.maxHp = 1e9;
  sim.checkedElites = preparation.stage.eliteChecks;
  sim.time = preparation.stage.boss!.spawnAt;
  expect(sim.bossEncounter.spawn()).toBe(true);
  return sim;
}
/**
 * One cast, forced, in a chosen phase and table slot. `slot` is the index into
 * `mechanics.skills` the cast must resolve to: `updateAI` increments `skillIndex` and then reads
 * `(skillIndex + phase - 1) % 3`, so the pre-cast value that lands on `slot` is `(slot - phase)`.
 */
function castAt(sim: CombatSimulation, phase: 1 | 2 | 3, slot: 0 | 1 | 2) {
  const boss = sim.bossEncounter.active!;
  const thresholds = bossRow(sim.bossEncounter.id).mechanics.thresholds;
  const ratio = phase === 1 ? (thresholds[0]! + 1) / 2 : phase === 2 ? (thresholds[0]! + thresholds[1]!) / 2 : thresholds[1]! / 2;
  boss.hp = boss.maxHp * ratio;
  boss.castCd = 0; boss.castLock = 0; boss.sweepPhase = undefined; boss.sweepFacing = undefined;
  sim.bossEncounter.updateAI(FRAME);
  expect(boss.phase, `phase ${phase} should be reached at ${round(ratio, 4)} hp`).toBe(phase);
  boss.castCd = 0; boss.castLock = 0; boss.sweepPhase = undefined; boss.sweepFacing = undefined;
  boss.skillIndex = (slot - phase + 3) % 3;
  sim.bossEncounter.telegraphs.length = 0;
  sim.bossEncounter.updateAI(FRAME);
  return sim.bossEncounter.telegraphs.at(-1)!;
}

describe('the lookup: the id a stage writes is the Boss that arrives', () => {
  it('holds a row per id, and refuses an id nobody wrote', () => {
    expect(Object.keys(bossData.bosses).sort()).toEqual(['B001', 'CH001_ALTAR']);
    expect(bossRow('CH001_ALTAR').boss.name).toBe('祭坛术主');
    expect(() => bossRow('CH001_ALTAR_LORD')).toThrow('未知首领');
    // Every id a stage names, and the shipped path's default, must resolve. A stage that names a
    // Boss nobody wrote is an error at construction, not a silent fallback to the brute.
    for (const row of chapterStages) if (row.boss) expect(() => bossRow(row.boss.id)).not.toThrow();
    expect(() => bossRow(firstStage.bossId)).not.toThrow();
    MEASURED.rows = Object.keys(bossData.bosses);
  });
  it('fields the stage\'s own Boss, not the brute', () => {
    const altar = bossSim('CH001-03'), first = bossSim('CH001-01');
    expect(altar.bossEncounter.id).toBe('CH001_ALTAR');
    expect(first.bossEncounter.id).toBe('B001');
    expect(altar.bossEncounter.active).toMatchObject({ id: 'CH001_ALTAR', name: '祭坛术主', r: 36 });
    expect(first.bossEncounter.active).toMatchObject({ id: 'B001', name: '黄巾巨将', r: 42 });
    // The budget is the row's hp times the clock, and the two differ only because they arrive at
    // different times - `spawn()` prices the Boss at the minute it walks in, not at the row.
    const budget = (hp: number, at: number) => { const m = at / 60; return hp * 1 * (.85 + (1 + .07 * m + .012 * m * m) * .22) * firstStage.bossHp; };
    expect(altar.bossEncounter.active!.hp).toBeCloseTo(budget(7000, 360), 6);
    expect(first.bossEncounter.active!.hp).toBeCloseTo(budget(7000, 270), 6);
    expect(altar.bossEncounter.active!.hp).toBeGreaterThan(first.bossEncounter.active!.hp);
    MEASURED.spawn = {
      altar: { id: altar.bossEncounter.id, name: altar.bossEncounter.active!.name, r: altar.bossEncounter.active!.r, hp: round(altar.bossEncounter.active!.hp, 1) },
      first: { id: first.bossEncounter.id, name: first.bossEncounter.active!.name, r: first.bossEncounter.active!.r, hp: round(first.bossEncounter.active!.hp, 1) },
    };
  });
  it('keeps the shipped default in data, so a non-chapter run is unchanged', () => {
    // `firstStage.rule.bossId` said `B001` all along with zero readers. The default is now that
    // field, not a literal in `spawn()` - a legacy run must still be the brute, byte for byte.
    expect(firstStage.bossId).toBe('B001');
    const core = new GameCore(fresh, () => .8);
    const sim = simOf(core);
    expect(sim.chapter).toBeUndefined();
    expect(sim.bossEncounter.id).toBe('B001');
    core.destroy();
  });
  it('does not field a Boss for the stage that has none, whatever id the fallback would pick', () => {
    const preparation = prepareChapterRun(fresh, { ...ALTAR, stageId: 'CH001-02' });
    const sim = new CombatSimulation(fresh, createChapterProgression(preparation, () => .8), () => .8, [], Date.now, preparation);
    sim.time = 300;
    expect(sim.bossEncounter.spawn()).toBe(false);
    expect(sim.bossEncounter.active).toBeUndefined();
    // The row still resolves - construction needs one - but nothing uses it.
    expect(sim.bossEncounter.id).toBe('B001');
  });
});

describe('the three phases: thresholds, costs and adds come from the row', () => {
  it('flips phases at the row\'s thresholds, and the two rows differ', () => {
    const altar = bossRow('CH001_ALTAR').mechanics.thresholds, brute = bossRow('B001').mechanics.thresholds;
    expect(altar).toEqual([.66, .33]);
    expect(brute).toEqual([.7, .35]);
    // Measured, not read back: at .67 hp the altar lord is still in phase 1 while the brute is
    // already in phase 2, so the number in the file is the number the rule uses.
    for (const [id, stageId, expected] of [['CH001_ALTAR', 'CH001-03', 1], ['B001', 'CH001-01', 2]] as const) {
      const sim = bossSim(stageId), boss = sim.bossEncounter.active!;
      boss.hp = boss.maxHp * .67;
      sim.bossEncounter.updateAI(FRAME);
      expect(boss.phase, id).toBe(expected);
    }
    MEASURED.thresholds = { altar, brute, at067: { altar: 1, brute: 2 } };
  });
  it('pays each phase the row\'s price, not the code\'s', () => {
    const sim = bossSim('CH001-03'), m = bossRow('CH001_ALTAR').mechanics;
    const rows = ([1, 2, 3] as const).map(phase => {
      const warning = castAt(sim, phase, 0);
      const skill = m.curve.skill.base + phase * m.curve.skill.perPhase;
      expect(warning.name).toBe('血雨');
      expect(warning.type).toBe('circle');
      expect(warning.damage).toBeCloseTo(skill * 1.25, 9);
      const radius = warning.type === 'circle' ? warning.r : null;
      if (radius !== null) expect(radius).toBe(m.radius[phase - 1]);
      return { phase, skill, telegraph: round(warning.damage, 4), radius, name: sim.bossEncounter.snapshot().boss!.phaseName };
    });
    expect(rows.map(row => row.skill)).toEqual([20, 25, 30]);
    expect(rows.map(row => row.radius)).toEqual([64, 64, 80]);
    expect(rows.map(row => row.name)).toEqual(['血祭初式', '焚坛再式', '术主终式']);
    MEASURED.phases = rows;
  });
  it('takes width, range and arc from the row as well', () => {
    const sim = bossSim('CH001-03'), m = bossRow('CH001_ALTAR').mechanics;
    const line = castAt(sim, 3, 1);
    expect(line.type).toBe('line');
    expect(line.name).toBe('祭火');
    if (line.type === 'line') expect(line.width).toBe(m.width[2]);
    const cone = castAt(sim, 3, 2);
    expect(cone.type).toBe('cone');
    expect(cone.name).toBe('断魂');
    if (cone.type === 'cone') {
      expect(cone.range).toBe(m.curve.cone.base + 3 * m.curve.cone.perPhase);
      expect(cone.arc).toBeCloseTo(Math.PI * m.arc[2]!, 12);
    }
    MEASURED.shapes = { lineWidth: line.type === 'line' ? line.width : null, coneRange: cone.type === 'cone' ? cone.range : null, coneArc: cone.type === 'cone' ? round(cone.arc / Math.PI, 4) : null };
  });
  it('summons what the phase says: two adds for the altar, three for the brute', () => {
    for (const [stageId, expected] of [['CH001-03', 2], ['CH001-01', 3]] as const) {
      const sim = bossSim(stageId), boss = sim.bossEncounter.active!;
      const before = sim.enemies.length;
      boss.hp = boss.maxHp * .2;
      sim.bossEncounter.updateAI(FRAME);
      expect(boss.phase).toBe(3);
      expect(sim.enemies.length - before, stageId).toBe(expected);
      // The first add is the elite one, in both rows - `adds` counts bodies, not elites.
      expect(sim.enemies.filter(enemy => enemy.elite).length).toBe(1);
    }
    MEASURED.adds = { altar: 2, brute: 3 };
  });
});

/** A run of one stage, driven to its end or to the frame cap. */
function play(stageId: 'CH001-01' | 'CH001-03', seed: number, anchor: 'hunt' | 'corner' = 'hunt') {
  const core = new GameCore(fresh, () => .8, 'classic', { ...ALTAR, stageId, seed });
  core.start(390, 844);
  const sim = simOf(core);
  let dodges = 0, ultimates = 0, spawnedAt = -1, killedAt = -1, hpAtSpawn = 0;
  for (let frame = 0; frame < 500 * 60; frame++) {
    const snapshot = core.snapshot();
    if (snapshot.status === 'ended') break;
    if (snapshot.status === 'choosing') {
      const choice = snapshot.choice!, hurt = sim.player.hp < sim.player.maxHp * .55;
      const pick = (hurt ? choice.options.find(option => option.kind === 'recovery') : undefined)
        ?? choice.options.find(option => option.kind === 'active') ?? choice.options[0]!;
      core.choose(choice.token, pick.kind, pick.id);
      continue;
    }
    if (snapshot.status === 'boss-loot') { expect(core.pickChapterLoot(), 'chapter loot must be claimable').toBe(true); continue; }
    const boss = sim.bossEncounter.active;
    let dx = 0, dy = 0;
    if (boss) {
      if (spawnedAt < 0) { spawnedAt = sim.time; hpAtSpawn = boss.hp; }
      const ox = sim.player.x - boss.x, oy = sim.player.y - boss.y, gap = Math.hypot(ox, oy) || 1;
      // Orbit at 136 px - inside the 105-140 px auto-attack radius, outside body contact.
      if (gap > 136) { dx = -ox / gap; dy = -oy / gap; } else { dx = -oy / gap; dy = ox / gap; }
    } else {
      // `hunt` walks at the first scripted check; `corner` holds the world fraction `CH001-02`'s
      // first seal uses. The two are compared below: the stage is the same, the player is not.
      const spot = anchor === 'corner'
        ? { x: sim.world.width * .5, y: sim.world.height * .23 }
        : (sim.enemies.find(enemy => enemy.checked) ?? sim.enemies[0] ?? { x: sim.world.width / 2, y: sim.world.height / 2 });
      const ox = sim.player.x - spot.x, oy = sim.player.y - spot.y, gap = Math.hypot(ox, oy) || 1;
      if (gap > 136) { dx = -ox / gap; dy = -oy / gap; } else { dx = -oy / gap; dy = ox / gap; }
    }
    // Reading the telegraph is the skill the Boss is built around, so the reference player does it.
    const incoming = sim.bossEncounter.telegraphs.find(warning => !warning.resolved && warning.life < .5 && insideTelegraph(sim.player, warning));
    if (incoming) { const away = Math.hypot(sim.player.x - incoming.x, sim.player.y - incoming.y) || 1; dx = (sim.player.x - incoming.x) / away; dy = (sim.player.y - incoming.y) / away; }
    core.move(dx, dy);
    const close = sim.enemies.filter(enemy => Math.hypot(enemy.x - sim.player.x, enemy.y - sim.player.y) < 70).length;
    if (snapshot.dodgeCd <= 0 && (close >= 2 || incoming) && core.action('dodge')) dodges++;
    if (snapshot.ult >= 100 && close >= 1 && core.action('ultimate')) ultimates++;
    const before = sim.bossEncounter.active?.hp ?? 0;
    core.advance(FRAME);
    if (before > 0 && !sim.bossEncounter.active) killedAt = sim.time;
  }
  const run = {
    stageId, seed, endReason: core.snapshot().endReason, at: round(sim.time, 2), hp: round(sim.player.hp, 1),
    level: core.snapshot().level, kills: sim.kills, dodges, ultimates, spawnedAt: round(spawnedAt, 2),
    hpAtSpawn: Math.round(hpAtSpawn), killedAt: round(killedAt, 2), checked: sim.checkedElites,
    bossId: sim.bossEncounter.id, final: core.chapterFinalRun(),
  };
  core.destroy();
  return run;
}

describe('the objective: the altar can be finished, and the elite gate is in the way', () => {
  it('calibrates the player on the stage that already ships', () => {
    // Without this control, "the altar is too hard" and "the bot is weak" measure the same thing.
    const wins = SEEDS.map(seed => play('CH001-01', seed));
    MEASURED.calibration = wins.map(({ final: _final, ...rest }) => rest);
    for (const win of wins) {
      expect(win.endReason, `CH001-01 seed ${win.seed}`).toBe('victory');
      expect(win.hp, `CH001-01 seed ${win.seed}: finished standing`).toBeGreaterThan(0);
      expect(win.bossId).toBe('B001');
    }
  }, 900_000);
  it('wins CH001-03 on the same three seeds', () => {
    const wins = SEEDS.map(seed => play('CH001-03', seed));
    MEASURED.wins = wins.map(({ final: _final, ...rest }) => rest);
    for (const win of wins) {
      expect(win.endReason, `CH001-03 seed ${win.seed}`).toBe('victory');
      expect(win.bossId, `CH001-03 seed ${win.seed}`).toBe('CH001_ALTAR');
      expect(win.checked, `CH001-03 seed ${win.seed}: both checks cleared`).toBe(2);
      expect(win.hp, `CH001-03 seed ${win.seed}: finished standing`).toBeGreaterThan(0);
      // The Boss cannot arrive before 360, and the win cannot precede the kill.
      expect(win.spawnedAt).toBeGreaterThanOrEqual(360);
      expect(win.killedAt).toBeGreaterThanOrEqual(360);
      expect(win.at).toBeGreaterThan(win.killedAt);
      // The report the run hands to settlement is accepted by settlement.
      expect(() => validateChapterFinal(prepareChapterRun(fresh, { ...ALTAR, seed: win.seed }), win.final!), `seed ${win.seed}`).not.toThrow();
      expect(win.final).toMatchObject({ endReason: 'victory', bossDefeated: true, bossLootClaimed: true, elitesChecked: 2 });
    }
  }, 900_000);
  it('wins strictly more often than a policy that holds a corner', () => {
    // The number that decides "is this stage finishable" is the *pair* of arms, not either one.
    // An earlier version of this file used only the corner policy and read 1/3 as "the altar is
    // too hard" - the same 3 seeds, a different way of moving, and the shipped stage fails too.
    const corner = SEEDS.map(seed => play('CH001-03', seed, 'corner'));
    const hunt = SEEDS.map(seed => play('CH001-03', seed));
    MEASURED.corner = corner.map(({ final: _final, ...rest }) => rest);
    for (const run of corner) expect(['victory', 'defeat']).toContain(run.endReason);
    const won = (runs: ReturnType<typeof play>[]) => runs.filter(run => run.endReason === 'victory').length;
    expect(won(hunt), `hunt ${won(hunt)}/3 vs corner ${won(corner)}/3`).toBeGreaterThan(won(corner));
    MEASURED.policy = { hunt: won(hunt), corner: won(corner), seeds: SEEDS.length };
  }, 900_000);
  it('withholds the Boss until both checks are cleared, and the run times out at its duration', () => {
    const core = new GameCore(fresh, () => .8, 'classic', ALTAR); core.start();
    const sim = simOf(core);
    // Past `spawnAt` with nothing cleared: the gate, not the clock, is what withholds the Boss.
    sim.time = stage.boss!.spawnAt + 60;
    expect(sim.bossEncounter.spawn()).toBe(false);
    expect(sim.bossEncounter.active).toBeUndefined();
    // Driven to the last frame instead of played for 480 s: a bot that must survive eight minutes
    // to demonstrate a deadline is measuring the arena, not the deadline.
    sim.time = stage.duration - FRAME;
    core.advance(FRAME);
    expect(core.snapshot().endReason).toBe('timeout');
    const final = core.chapterFinalRun()!;
    expect(final).toMatchObject({ endReason: 'timeout', bossDefeated: false, bossLootClaimed: false, elitesChecked: 0, sealsHeld: 0 });
    expect(final.time).toBeCloseTo(stage.duration, 6);
    expect(() => validateChapterFinal(prepareChapterRun(fresh, ALTAR), final)).not.toThrow();
    MEASURED.timeout = { endReason: final.endReason, time: final.time, elitesChecked: final.elitesChecked };
    core.destroy();
  });
});

it('writes the report', () => {
  const report = {
    slice: 'R3-M03',
    instrument: 'GameCore(chapter1-v1) driven by the same reference player that wins CH001-01; CombatSimulation for the phase table',
    stage: { ...stage },
    rows: MEASURED.rows,
    spawn: MEASURED.spawn,
    thresholds: MEASURED.thresholds,
    phases: MEASURED.phases,
    shapes: MEASURED.shapes,
    adds: MEASURED.adds,
    calibration: MEASURED.calibration,
    wins: MEASURED.wins,
    corner: MEASURED.corner,
    policy: MEASURED.policy,
    timeout: MEASURED.timeout,
  };
  const dir = resolve(EVIDENCE_ROOT, 'R3-E');
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'altar-report.json'), JSON.stringify(report, null, 2));
  expect(report.wins).toHaveLength(3);
});
