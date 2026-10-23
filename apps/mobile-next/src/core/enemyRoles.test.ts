import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CombatSimulation } from './CombatSimulation';
import { Progression } from './progression';
import { RunEvolution, evolutionBuild } from './RunEvolution';
import { createEnemy, firstStage } from './spawnRules';
import type { DirectorState, Enemy } from './spawnRules';
import fresh from '../data/freshSave.json';
import stage from '../data/firstStage.json';

/**
 * R3-E01..07, Scope 0: does each `ST001` enemy have a job the rules implement, and a warning the
 * player can see?
 *
 * The queue row says "其余五普通敌人、两精英逐个完善 - 职责、预警、独立外观". This file answers the
 * first two halves by **measuring behaviour**, not by grepping for the `ai` literal: a string that
 * appears in a branch is not the same as a branch that changes what the enemy does. Every number
 * below is one enemy walking toward a stationary player for a fixed window, read from the position
 * it actually moved to.
 *
 * Instrument: `createEnemy` (the production constructor, so `ai`/`r`/`speed` are the shipped ones),
 * `threat-v2` is **not** used here on purpose. After `R3-E01..07a` this file is the **legacy
 * reference** arm: it pins that `charge`/`aoe_ranged` stay inert when no threat model is selected,
 * which is what keeps `combat-math-oracle.json` and every legacy reading byte-identical. The
 * `threat-v2` behaviour of the same two strings lives in `enemyWarnings.test.ts`. Player parked, no
 * skills owned, pet off, 20 frames at 1/60 s.
 */
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const FRAME = 1 / 60;
const ST001 = ['EN001', 'EN002', 'EN003', 'EN004', 'EN005', 'EN006'] as const;
const STATE: DirectorState = { time: 0, kills: 0, dps: 0, level: 1, evolved: 0, fused: 0 };
const PLAYER = { x: 1800, y: 1200, hp: 1000, maxHp: 1000, atk: 100 };
const WORLD = { width: 3600, height: 2400 };
const VIEWPORT = { width: 390, height: 844 };

/** One `ST001` enemy built by the production constructor, then parked at `gap` px to the right. */
function build(id: string, gap: number): Enemy {
  const enemy = createEnemy(STATE, PLAYER, VIEWPORT, WORLD, 'normal', () => .8, { id });
  enemy.x = PLAYER.x + gap; enemy.y = PLAYER.y;
  return enemy;
}
/** A sim with nothing that can kill: no skills owned, no pet, no boss. */
function field() {
  const journey = new RunEvolution('H001');
  const progression = new Progression(evolutionBuild('H001'), {}, {}, () => .8, journey);
  const sim = new CombatSimulation({ ...structuredClone(fresh), hero: 'H001' }, progression, () => .8);
  sim.pet.enabled = false;
  sim.player.x = PLAYER.x; sim.player.y = PLAYER.y;
  return sim;
}
/**
 * Walk one enemy for `frames` and report the signed displacement toward the player, per unit speed.
 *
 * `enemyAI` runs inside `beginFrame`, not `updateOuter` - and `beginFrame` also runs the spawner and
 * the player's basic attack. Both are silenced here (`atk = 0`, and the spawned enemies are dropped
 * after every frame) so the probe enemy is the only body on the field and nothing can kill it. The
 * normalised displacement (`moved / speed`) is what makes enemies with different `speed` comparable:
 * it is exactly the `move` multiplier `enemyAI` chose.
 */
function walk(id: string, gap: number, frames = 20) {
  const sim = field(), enemy = build(id, gap);
  sim.player.atk = 0;
  sim.enemies.push(enemy);
  // Positive = approaching the player, so `perSpeed` reads as the `move` multiplier directly.
  const steps: number[] = [];
  for (let i = 0; i < frames; i++) {
    const before = enemy.x;
    sim.beginFrame(FRAME);
    steps.push(before - enemy.x);
    sim.enemies.length = 0; sim.enemies.push(enemy);
  }
  const moved = steps.reduce((sum, step) => sum + step, 0);
  return { moved, perSpeed: moved / (enemy.speed * FRAME * frames), steps, shots: sim.enemyShots.length, enemy, sim };
}

describe('R3-E Scope 0: the six ST001 enemies', () => {
  it('fields all six ST001 rows, and the declared set is exactly the fielded set', () => {
    // R3-E01..07 measured this pool as three rows (D22); R3-E01..07a added the other three at
    // weight 1 each, leaving the original 5/3/1 untouched. The two sets are now equal, which is the
    // assertion that stops a row from going dead again without a test noticing.
    const table = firstStage.storyEncounter.enemies as [string, number][];
    expect(table).toEqual([['EN001', 5], ['EN002', 3], ['EN003', 1], ['EN004', 1], ['EN005', 1], ['EN006', 1]]);
    const enemies = stage.enemies as Record<string, { map: string }>;
    const claimed = Object.entries(enemies).filter(([, row]) => row.map === 'ST001').map(([id]) => id);
    expect(claimed).toEqual([...ST001]);
    const fielded = table.map(([id]) => id);
    expect(fielded, 'declared for ST001 and fielded').toEqual(claimed);
    // "两精英" has no row referent: all twenty rows are ordinary enemies and `elite` is a flag.
    const rows = Object.entries(stage.enemies as Record<string, Record<string, unknown>>);
    expect(rows).toHaveLength(20);
    expect(rows.filter(([, row]) => 'elite' in row || 'affixes' in row)).toEqual([]);
    // The only two-ness in the data: an elite carries one affix, or two after 960 s.
    expect((stage as unknown as { affixes: string[] }).affixes).toHaveLength(6);
  });

  it('pins the kiting profile: only `ranged` has one', () => {
    const far = walk('EN002', 350), near = walk('EN002', 250), close = walk('EN002', 150);
    // 300/190 are the two thresholds in `enemyAI`; the three arms sit outside each of them.
    expect(far.perSpeed, 'closes from 350').toBeCloseTo(.6, 2);
    expect(near.perSpeed, 'holds at 250').toBeCloseTo(0, 6);
    expect(close.perSpeed, 'backs off from 150').toBeCloseTo(-.5, 2);
    // And it is the only one: every other enemy that does not have its own multiplier below walks
    // straight in at 250. (`EN003` is the shield and is pinned at .65 in the next test.)
    for (const id of ['EN001', 'EN004', 'EN005', 'EN006']) {
      expect(walk(id, 250).perSpeed, `${id} closes at 250`).toBeCloseTo(1, 2);
    }
  });

  it('pins the shield slow and the two radii', () => {
    expect(walk('EN003', 250).perSpeed, 'shield moves at .65').toBeCloseTo(.65, 2);
    const radius = Object.fromEntries(ST001.map(id => [id, build(id, 250).r]));
    expect(radius).toEqual({ EN001: 10, EN002: 10, EN003: 14, EN004: 10, EN005: 10, EN006: 14 });
  });

  it('pins that `charge`, `aoe_ranged` and `brute` are inert without a threat model', () => {
    // Legacy reference arm. Same normalised displacement as a melee enemy: under `legacy` the `ai`
    // string changes nothing about how they move, which is the guarantee `R3-E01..07a` had to keep.
    // `brute` differs only by its radius (14 vs 10, pinned above), and it stays that way in both
    // models - `TASK.md` forbids inventing a job for it to make the name look implemented.
    const base = walk('EN001', 250).perSpeed;
    for (const id of ['EN004', 'EN005', 'EN006']) {
      expect(walk(id, 250).perSpeed, `${id} moves exactly like melee`).toBeCloseTo(base, 3);
    }
  });

  it('pins that 火箭兵 fires nothing and 弓手 does, under `legacy`', () => {
    // 5 seconds at 200 px, well inside its own name's implied range. The `threat-v2` lob is in
    // `enemyWarnings.test.ts`; this arm is the frozen reference.
    const rocket = walk('EN005', 200, 300), archer = walk('EN002', 200, 300);
    expect(archer.shots, 'the archer shoots').toBeGreaterThan(0);
    expect(rocket.shots, 'the rocket trooper has no branch and therefore no shot').toBe(0);
    // `charge` has no dash here either: every frame is the same step. A dash would show up as one
    // frame whose step is a multiple of the walk, so the assertion is on the per-frame spread, not
    // the sum - and the same shape is asserted *positively* in `enemyWarnings.test.ts`.
    const charge = walk('EN004', 250, 20);
    const ratios = charge.steps.map(step => step / (charge.enemy.speed * FRAME));
    expect(Math.max(...ratios) - Math.min(...ratios), 'no frame is a burst').toBeLessThan(1e-9);
    expect(ratios[0]).toBeCloseTo(1, 6);
  });

  it('pushes nothing onto the enemy warning channel without a threat model', () => {
    // The channel itself is `sim.warnings` (`Telegraph[]`, shared with the Boss on purpose). Under
    // `legacy` it must stay empty - that is the half of "no second source of truth" a legacy run can
    // still prove. The Boss channel is a different list and is also empty with only enemies around.
    const sim = field();
    sim.enemies.push(build('EN004', 250));
    for (let i = 0; i < 120; i++) sim.beginFrame(FRAME);
    expect(sim.warnings).toHaveLength(0);
    expect(sim.bossEncounter.telegraphs).toHaveLength(0);
  });

  it('pins what an elite is: a flag, one affix, and two after 960 s', () => {
    const elite = createEnemy(STATE, PLAYER, VIEWPORT, WORLD, 'normal', () => .8, { id: 'EN001', elite: true });
    const plain = createEnemy(STATE, PLAYER, VIEWPORT, WORLD, 'normal', () => .8, { id: 'EN001' });
    expect(elite.affixes).toHaveLength(1);
    expect(elite.color).toBe('#d5a254');
    expect(elite.r).toBeCloseTo(plain.r * 1.25, 6);
    expect(elite.hp / plain.hp).toBeCloseTo(3.25, 6);
    expect(elite.damage / plain.damage).toBeCloseTo(1.38, 6);
    const late = createEnemy({ ...STATE, time: 1000 }, PLAYER, VIEWPORT, WORLD, 'normal', () => .8, { id: 'EN001', elite: true });
    expect(late.affixes, 'two affixes after 960 s - the only "two elites" reading the data supports').toHaveLength(2);
  });

  it('writes the report', () => {
    const pool = (firstStage.storyEncounter.enemies as [string, number][]).map(([id]) => id);
    const rows = ST001.map(id => {
      const probe = walk(id, 250);
      return {
        id, name: probe.enemy.name, ai: probe.enemy.ai, r: probe.enemy.r,
        fielded: pool.includes(id),
        weight: (firstStage.storyEncounter.enemies as [string, number][]).find(([key]) => key === id)?.[1] ?? 0,
        speedPerFrame: Math.round(probe.enemy.speed * FRAME * 10000) / 10000,
        movedPerSpeed: Math.round(probe.perSpeed * 10000) / 10000,
        shotsIn5s: walk(id, 200, 300).shots,
      };
    });
    const report = {
      slice: 'R3-E',
      harness: 'src/core/enemyRoles.test.ts',
      instrument: 'createEnemy (production ctor), player parked, no skills, pet off, 20 frames at 1/60 s, updateOuter',
      roster: rows,
      jobs: {
        fieldedAndImplemented: [
          'EN001 melee (weight 5; walks at 1.0, renderer reads the string for alpha only)',
          'EN002 ranged (weight 3; kites .6/0/-.5 at 300/190, fires when attack > 1.8)',
          'EN003 shield (weight 1; moves at .65, r 14)',
        ],
        declaredButNeverFielded: [
          'EN004 charge (map ST001, in no wave, and no production branch reads the string)',
          'EN005 aoe_ranged (map ST001, in no wave, no branch: measured 0 shots in 5 s at 200 px)',
          'EN006 brute (map ST001, in no wave; the string only buys r 14)',
        ],
      },
      telegraphs: { enemyFields: 0, bossChannel: 'sim.bossEncounter.telegraphs (empty with enemies only)' },
      elites: { rows: 0, flag: true, affixes: 1, affixesAfter960s: 2, color: '#d5a254' },
    };
    const dir = resolve(EVIDENCE_ROOT, 'R3-E');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'ai-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    expect(report.roster).toHaveLength(6);
  }, 60_000);
});
