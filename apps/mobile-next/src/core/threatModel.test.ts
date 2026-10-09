import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import { seededRandom } from '../chapter/growth';
import { combatContext, incomingHit } from './combatMath';
import { threatV2 } from './threatModel';
import type { RunRules } from './threatModel';
import { firstStage } from './spawnRules';
import { chapterCombatContext } from '../chapter/combat';
import fresh from '../data/freshSave.json';

const FRAME = 1 / 60;
// R1g-1's own report is frozen at `evidence/R1g-1/harness-report.json`. This
// harness keeps writing on every run, so from R1g-2 on it targets the current
// slice's directory instead of rewriting the frozen one.
//
// R1g-5 moved it from `evidence/R1g-3` to `evidence/R1g-5`, for the same reason `bossBudget.test.ts`
// did: R1g-5 changed this harness (the `claimChest` fidelity step below), so numbers it writes are
// no longer R1g-3's. The old path was a *rolling* artifact - every full-suite run since R1g-3 had
// been rewriting it - which is exactly how it drifted out of date without anyone noticing.
//
// R1g-12 moved it again, to `evidence/R1g-12`, for exactly that reason: this slice re-calibrated
// `enemyDamage`, so every floor in the report is R1g-12's, not R1g-5's. `evidence/R1g-5/` keeps a
// pointer note. Read the report next to the `IMPLEMENTATION.md` of the slice whose directory holds
// it, never next to the slice named in its `slice` field.
const EVIDENCE = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R1g-12');
type Journey = 'classic' | 'evolution';
type Strategy = 'stationary' | 'active';

export interface RunTrace {
  readonly rules: RunRules;
  readonly journey: Journey;
  readonly strategy: Strategy;
  readonly seed: number;
  readonly endReason: 'defeat' | 'victory' | 'timeout' | undefined;
  readonly seconds: number;
  readonly hp: number;
  readonly maxHp: number;
  readonly minHpRatio: number;
  readonly minHpAt: number;
  readonly kills: number;
  readonly level: number;
  readonly bossSpawned: boolean;
  readonly bossDefeated: boolean;
  readonly bossSpawnAt: number;
  readonly bossDamage: number;
  readonly damageTaken: number;
  readonly damageTakenBy: Record<string, number>;
  readonly incoming: number;
}

/**
 * Rules-only full-run driver. No DOM, no browser, no clocks: it consumes the same
 * `GameCore.advance` loop Phaser drives, so a trace here is the same rule state a
 * player would reach. Only player-visible actions are issued.
 *
 * `active` mirrors `tests/settlement.spec.ts` natural play: one-second square legs
 * with skill and ultimate presses, switching to a Boss charge that stops 65px away
 * once the Boss is up. (R1g-1 claimed the Boss's 155px stand-off put the player's
 * basic attack out of reach; R1g-2 measured that stopping at 155px still killed
 * the Boss, just 20% slower, so that reasoning is withdrawn. R1g-3 later moved
 * the Boss HP budget, which is why the Boss now takes 60-90s instead of 15s.)
 *
 * Instrument note (R1g-11). `active` is the **twin of `tests/settlement.spec.ts`**, which means it
 * has to match that bot in all three of the things the bot does - and until R1g-11 it matched one:
 *
 * - the HUD rule: it reads the rendered `首领招式` readout and presses 闪避 (added in R1g-11 Scope 0b,
 *   because the shipped UI names the Boss's next move and the fixed bot pressed neither);
 * - the `f` key: `settlement.spec.ts:222` presses `f` every step, and `interact()` is what opens
 *   map objects, so a driver that never presses it is a strictly weaker player;
 * - the press rate: the bot presses `e`/`r`/`f` every step, and a step is 180ms while the Boss is
 *   up (1000ms otherwise). One press per second is the *pre-Boss* rate.
 *
 * Measured cost of the two missing terms, `hud`-rule held constant (33 seeds x 2 journeys): the
 * weaker driver reads hpMin 0.237 / 51 wins, the twin reads 0.264 / 48. Reading the floor off the
 * weaker driver is not conservative, it is simply a different player - and it hid the per-journey
 * split that §7 of `evidence/R1g-11/IMPLEMENTATION.md` records.
 *
 * The rules-level original of this rule is `bossThreat.test.ts`'s `hud` arm, whose 66-run summary
 * the twin reproduces to the digit (`hpMinMedian` 0.264, 48 wins); `bossBudget.test.ts`,
 * `skillCadence.test.ts` and `manualDamage.test.ts` carry the same copy.
 */
const HUD_CUES = ['离开红圈', '横向闪避', '绕至侧后'] as const;
interface HudSight { next: string; until: number }
function hudCue(next: string, sim: CombatSimulation, sight: HudSight): { x: number; y: number; fresh: boolean } | undefined {
  const boss = sim.boss; if (!boss) return undefined;
  let fresh = false;
  if (next !== sight.next) {
    sight.next = next;
    fresh = HUD_CUES.some(cue => next.includes(cue));
    if (fresh) sight.until = sim.time + Math.max(.55, .95 - boss.phase * .08) * firstStage.telegraphScale;
  }
  if (sim.time >= sight.until) return undefined;
  const dx = sim.player.x - boss.x, dy = sim.player.y - boss.y, gap = Math.hypot(dx, dy) || 1;
  return next.includes('离开红圈') ? { x: dx / gap, y: dy / gap, fresh } : { x: -dy / gap, y: dx / gap, fresh };
}

function runHeadless(options: { rules?: RunRules; journey?: Journey; strategy?: Strategy; seed?: number; maxSeconds?: number; hordeScale?: number } = {}): RunTrace {
  const { rules = 'legacy', journey = 'classic', strategy = 'stationary', seed = 15, maxSeconds = 400, hordeScale = 1 } = options;
  const core = new GameCore(structuredClone(fresh), seededRandom(seed), journey, undefined, rules);
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  // The horde's only knob, in both of its uses. `0` is the single-switch counterfactual behind the
  // per-journey split (see the `attributes the floor` test); any other value is R1g-12's calibration
  // sweep. Scaling the *live* table is the same thing as editing the JSON, because `createEnemy`
  // reads `threat.enemyDamage[id]` on every spawn - so a row read here is a reading of the shipped
  // rule rather than a harness approximation. Guarded on `sim.threat`, since a `legacy` run has none
  // and spreading an undefined threat would silently switch it on.
  if (hordeScale !== 1 && sim.threat) (sim as unknown as { threat: object }).threat = {
    ...sim.threat,
    enemyDamage: Object.fromEntries(Object.entries(threatV2.enemyDamage).map(([id, value]) => [id, value * hordeScale])),
  };
  core.start(390, 844);
  let minHpRatio = 1, minHpAt = 0, bossSpawned = false, bossDefeated = false, stalled = 0, lastPress = -1;
  /** The HUD rule's memory. Starts blank, so the Boss's spawn readout (`'准备攻击'`) arms nothing. */
  const sight: HudSight = { next: '', until: -1 };
  let bossSpawnAt = 0, bossMaxHp = 0, bossDamage = 0;
  for (let frame = 0; frame < Math.ceil(maxSeconds / FRAME); frame++) {
    const state = core.snapshot();
    if (state.status === 'ended') break;
    // Status prompts are answered before advancing; a run never advances while a
    // dialog is open, so each branch must make progress or bail out.
    if (state.status === 'choosing') {
      const choice = state.choice!;
      // settlement.spec.ts:105 takes `offered[0]` for natural play (the priority
      // list only applies to its inset-contact variant), so the harness must too:
      // picking the first *active* option models a stronger player than the one
      // the browser suite actually drives.
      const option = strategy === 'active' ? choice.options[0]!
        : choice.options.find(item => item.kind === 'active') ?? choice.options[0]!;
      if (!core.choose(choice.token, option.kind, option.id) && ++stalled > 120) break;
      stalled = 0; continue;
    }
    if (state.status === 'encounter') {
      if (!core.resolveEvent(state.encounter.offer!.token, 'skip', { affordable: true, gold: 6000 }) && ++stalled > 120) break;
      stalled = 0; continue;
    }
    if (state.status === 'chest') {
      if (!core.pickChest(state.chests.offer!.token, 0) && ++stalled > 120) break;
      stalled = 0; continue;
    }
    if (state.status === 'boss-loot') {
      const uid = state.boss.offer?.[0]?.uid;
      const picked = uid ? core.pickBossLoot(uid) : core.pickChapterLoot();
      if (!picked && ++stalled > 120) break;
      stalled = 0; continue;
    }
    // Fidelity (R1g-5). The same defect `bossBudget.test.ts` carried until R1g-5: `status` only
    // becomes 'chest' once the *caller* claims a due reward (`GameCore.claimChest`, which requires
    // `status === 'running'`), so reacting to `'chest'` alone opens zero timed chests - while the
    // browser bot clicks 宝箱 领取 every run. See `bossBudget.test.ts` for the measured cost.
    const due = state.chests.rewards.find(reward => reward.state === 'ready');
    if (due && core.claimChest(due.index)) continue;
    // `settlement.spec.ts:222` presses `f` on every step. Without it this driver never opens a map
    // object, which is a strictly weaker player than the bot it claims to be.
    if (strategy === 'active' && state.map.target?.canUse && core.interact()) continue;
    if (strategy === 'active') {
      const boss = state.boss.boss;
      if (boss) {
        // R1g-11 Scope 0b: the same HUD rule `tests/settlement.spec.ts` now runs, because this
        // strategy declares itself that bot's twin and the bot reads 首领招式 and presses 闪避.
        const cue = hudCue(boss.next, sim, sight);
        if (cue) { core.move(cue.x, cue.y); if (cue.fresh) core.action('dodge'); }
        else {
          const dx = boss.x - sim.player.x, dy = boss.y - sim.player.y, gap = Math.hypot(dx, dy);
          if (gap < 65) core.move(0, 0); else core.move(dx, dy);
        }
      } else {
        const leg = Math.floor(state.time) % 4;
        core.move([1, 0, -1, 0][leg]!, [0, 1, 0, -1][leg]!);
      }
      // The bot presses once per step, and a step is 180ms while the Boss is up against 1000ms
      // before it (`settlement.spec.ts:149/156`). Pressing once a second through the Boss phase is
      // the pre-Boss rate applied where it does not belong, so the Boss phase presses every frame -
      // which is the same thing as pressing every 180ms once the cooldowns saturate.
      if (!!boss || state.time - lastPress >= 1) { lastPress = state.time; core.action('skill'); core.action('ultimate'); }
    }
    core.advance(FRAME);
    const now = core.snapshot();
    if (now.boss.boss) {
      if (!bossSpawned) { bossSpawned = true; bossSpawnAt = now.time; bossMaxHp = now.boss.boss.maxHp; }
      const dealt = bossMaxHp - now.boss.boss.hp;
      if (dealt > bossDamage) bossDamage = dealt;
    }
    if (now.boss.lootShown) bossDefeated = true;
    const ratio = now.maxHp > 0 ? now.hp / now.maxHp : 1;
    if (ratio < minHpRatio) { minHpRatio = ratio; minHpAt = now.time; }
  }
  const end = core.snapshot();
  const damageTakenBy = { ...sim.damageTakenBy };
  const damageTaken = Object.values(damageTakenBy).reduce((sum, value) => sum + value, 0);
  const trace: RunTrace = {
    rules: core.rules, journey, strategy, seed, endReason: end.endReason,
    seconds: Math.round(end.time * 10) / 10, hp: Math.round(end.hp), maxHp: Math.round(end.maxHp),
    minHpRatio: Math.round(minHpRatio * 1000) / 1000, minHpAt: Math.round(minHpAt * 10) / 10,
    kills: end.kills, level: end.level, bossSpawned, bossDefeated,
    bossSpawnAt: Math.round(bossSpawnAt * 10) / 10, bossDamage: Math.round(bossDamage),
    damageTaken: Math.round(damageTaken * 10) / 10, damageTakenBy,
    incoming: sim.player.incoming!,
  };
  core.destroy();
  return trace;
}

// Each configuration is simulated once and shared by the assertions below, so the
// harness costs one full run per configuration rather than one per expectation.
const cache = new Map<string, RunTrace>();
function trace(options: Parameters<typeof runHeadless>[0]): RunTrace {
  const key = JSON.stringify(options);
  let value = cache.get(key);
  if (!value) { value = runHeadless(options); cache.set(key, value); }
  return value;
}
const CANONICAL = { seed: 15 } as const;
const SWEEP_SEEDS = [3, 5, 7, 21, 33] as const;
/**
 * The distribution set. `SWEEP_SEEDS` is 6 seeds, which is fine for a median and useless for a rate:
 * R1g-11 measured the twin at 28/33 classic and 20/33 evolution, and on the 6-seed set that reads
 * 3/6 and 2/6 - the same player, but a rate whose error bar is wider than the number. A claim about
 * "how often does this win" is a claim about a distribution, so it is read on the project's own
 * standard seed count (R1g-5: balance numbers need at least 33 seeds).
 */
const DISTRIBUTION_SEEDS = Array.from({ length: 33 }, (_, index) => index + 1);

describe('threat-v2 rules harness', () => {
  describe('frozen legacy reference (base 72a2860)', () => {
    it('lets a stationary player survive the whole stage', () => {
      const result = trace({ rules: 'legacy', journey: 'classic', strategy: 'stationary', maxSeconds: 370 });
      expect(result.endReason).toBe('timeout');
      expect(result.bossDefeated).toBe(false);
      expect(result.hp / result.maxHp).toBeGreaterThan(.8);
      expect(result.incoming).toBe(.44);
    });
    it('lets a stationary player win outright on the evolution journey', () => {
      const result = trace({ rules: 'legacy', journey: 'evolution', strategy: 'stationary', maxSeconds: 370 });
      expect(result.endReason).toBe('victory');
      expect(result.bossDefeated).toBe(true);
    });
    it('barely pressures an active player', () => {
      const result = trace({ rules: 'legacy', journey: 'classic', strategy: 'active', ...CANONICAL });
      expect(result.endReason).toBe('victory');
      expect(result.minHpRatio).toBeGreaterThan(.7);
    });
  });

  describe('threat-v2 design targets', () => {
    it('defeats a stationary player inside 120 seconds on both journeys', () => {
      for (const journey of ['classic', 'evolution'] as const) {
        const result = trace({ rules: 'threat-v2', journey, strategy: 'stationary', maxSeconds: 370 });
        expect(result.endReason, journey).toBe('defeat');
        expect(result.seconds, journey).toBeLessThan(120);
        // Lethal, not attrition: the run had to out-damage the full health pool.
        expect(result.damageTaken, journey).toBeGreaterThan(result.maxHp);
        expect(result.incoming, journey).toBe(1);
      }
    });
    it('leaves an active player a 25%-60% health floor', () => {
      // Read on `active`, which is the browser bot's twin (see the instrument note on `runHeadless`).
      // G2's band is a property of a player who *survives* the fight, so a run that dies enters this
      // distribution as 0 - which is why the band is asserted on the median and the per-run tail is
      // `bossBudget.test.ts`'s business.
      //
      // Read on the standard 33 seeds rather than on `SWEEP_SEEDS`. R1g-12 is what proved that
      // matters: the 6-seed median ({15,3,5,7,21,33}) reads 0.611 against the 33-seed 0.455 - a
      // spread wider than the band's own half-width, i.e. a 6-sample median is noise, the same defect
      // R1g-5 and R1g-11 recorded. The seeds are unchanged and the band is unchanged; only the sample
      // grew, so this is a tighter instrument, not a looser assertion.
      const floors = DISTRIBUTION_SEEDS
        .map(seed => trace({ rules: 'threat-v2', journey: 'classic', strategy: 'active', seed }).minHpRatio)
        .sort((a, b) => a - b);
      const median = floors[Math.floor(floors.length / 2)]!;
      const legacy = trace({ rules: 'legacy', journey: 'classic', strategy: 'active', ...CANONICAL });
      expect(median).toBeGreaterThanOrEqual(.25);
      expect(median).toBeLessThanOrEqual(.6);
      // The band only means something if the model actually moved the experience.
      expect(median).toBeLessThan(legacy.minHpRatio - .2);
    }, 600_000);
    it('reaches the Boss in every run and defeats it in most of them', () => {
      // The winnability claim, stated as a distribution. It used to be asserted per seed on
      // `CANONICAL`, which R1g-11 broke: with the cadence landed the Boss finally fights back, so a
      // canonical seed can now lose. That is not a rules failure - it is a fight - and the honest
      // form of "the run is winnable" is "the Boss is reachable every time and beaten most times".
      // The measured rates are 28/33 classic and 20/33 evolution; the thresholds below leave room.
      const runs = (['classic', 'evolution'] as const).flatMap(journey =>
        DISTRIBUTION_SEEDS.map(seed => trace({ rules: 'threat-v2', journey, strategy: 'active', seed })));
      // Reachable: the Boss spawns at 270s in every single run, on both journeys.
      expect(runs.filter(run => !run.bossSpawned)).toEqual([]);
      expect([...new Set(runs.map(run => run.bossSpawnAt))]).toEqual([270]);
      const wins = (journey: Journey) => runs.filter(run => run.journey === journey && run.bossDefeated).length;
      expect(wins('classic')).toBeGreaterThanOrEqual(25);
      expect(wins('evolution')).toBeGreaterThanOrEqual(16);
      // Defeatable means the Boss actually dies, not that the clock ran out with it alive.
      expect(runs.filter(run => run.bossDefeated).length).toBeGreaterThanOrEqual(40);
      // And every run ends for a reason the rules recognise.
      expect(runs.filter(run => run.endReason === undefined)).toEqual([]);
    }, 600_000);
    it('attributes the evolution health floor to the horde, not to the Boss', () => {
      // R1g-11 pinned its one open regression here, as an attribution instead of as a threshold: the
      // cadence landing cut the Boss's casts from 35 a run to 2 and the hud arm's escape travel from
      // 319px to 148px, so a player who no longer flees 35 times a fight stands in the horde instead
      // (`lostToHordeMedian` 694 -> 1178). The per-journey split is what the aggregate hid: classic
      // kept 0.280 while evolution fell to 0.147, under G2's 0.25.
      //
      // R1g-12 closed it by re-sweeping `enemyDamage` - R1g-1's contact table, the only horde knob
      // `threat-v2` has, and the one R1g-1 had calibrated on a driver R1g-11 showed to be weaker than
      // the shipped bot. The Boss was never the cause and cannot be the fix: `bossCastCooldown` /
      // `bossSkillDamage` / `bossHp` / `bossContactDamage` all move the Boss, which at 0.8 contact is
      // ~10% of the damage taken.
      //
      // Both halves are asserted, and the second is not decoration: a band that passes while the
      // horde contributes nothing would mean the model stopped pressuring anyone at all.
      const shipped = (journey: Journey) => DISTRIBUTION_SEEDS.map(seed =>
        trace({ rules: 'threat-v2', journey, strategy: 'active', seed }));
      const floor = (journey: Journey) => {
        const list = shipped(journey).map(run => run.minHpRatio).sort((a, b) => a - b);
        return list[Math.floor(list.length / 2)]!;
      };
      // G2's band, read per journey and never pooled. R1g-11's pooled 0.264 passed while evolution
      // sat at 0.147 - which is precisely the reading this test exists to prevent.
      for (const journey of ['classic', 'evolution'] as const) {
        expect(floor(journey), journey).toBeGreaterThanOrEqual(.25);
        expect(floor(journey), journey).toBeLessThanOrEqual(.6);
      }
      const withoutHorde = (journey: Journey) => {
        const list = DISTRIBUTION_SEEDS.map(seed => trace({ rules: 'threat-v2', journey, strategy: 'active', seed, hordeScale: 0 }));
        const floors = list.map(run => run.minHpRatio).sort((a, b) => a - b);
        return { floor: floors[Math.floor(floors.length / 2)]!, wins: list.filter(run => run.bossDefeated).length };
      };
      // Same player, same seeds, one switch: the horde's contact damage. Still the owner of both
      // floors - removing it lifts them past 0.7 and wins almost every run.
      expect(withoutHorde('evolution').floor).toBeGreaterThanOrEqual(.7);
      expect(withoutHorde('evolution').wins).toBeGreaterThanOrEqual(30);
      expect(withoutHorde('classic').floor).toBeGreaterThanOrEqual(.7);
    }, 600_000);
  });

  describe('rules switch isolation', () => {
    it('keeps the legacy formula byte-identical when no threat is configured', () => {
      const save = structuredClone(fresh);
      const legacy = combatContext(save), next = combatContext(save, undefined, threatV2);
      expect(legacy.threat).toBeUndefined();
      expect(next.threat).toBe(threatV2);
      const player = { hp: 700, maxHp: 1000, shield: 0, inv: 0, dodgeBuff: 0, incoming: 1 };
      // threat-v2: 40 raw, def 28, softCap 60 -> 40 * (1 - 28/88), and no global i-frame.
      expect(incomingHit(next, player, 40)).toEqual({ hp: 700 - 40 * (1 - 28 / 88), shield: 0, inv: 0 });
      // Legacy reference keeps the flat def*0.08 term and re-arms the global 0.28s i-frame.
      expect(incomingHit(legacy, { ...player, incoming: .44 }, 40)).toEqual({ hp: 700 - (40 * .44 - 28 * .08), shield: 0, inv: .28 });
    });
    it('soft-caps defence instead of subtracting a flat amount', () => {
      const context = combatContext(structuredClone(fresh), undefined, threatV2);
      const player = { hp: 1e6, maxHp: 1e6, shield: 0, inv: 0, dodgeBuff: 0, incoming: 1 };
      const lost = (def: number) => {
        const scaled = { ...context, baseDef: def };
        return 1e6 - incomingHit(scaled, player, 100).hp;
      };
      expect(lost(0)).toBeCloseTo(100, 6);
      expect(lost(28)).toBeCloseTo(100 * (1 - 28 / 88), 6);
      expect(lost(120)).toBeCloseTo(100 * (1 - 120 / 180), 6);
      // Monotonic and strictly bounded, never a flat subtraction that can go negative.
      expect(lost(0)).toBeGreaterThan(lost(28));
      expect(lost(28)).toBeGreaterThan(lost(120));
      expect(lost(1e6)).toBeGreaterThan(0);
    });
    it('leaves the shared stage data and the chapter path on the legacy model', () => {
      expect(firstStage.incoming).toBe(.44);
      expect(firstStage.dmg).toBe(.82);
      expect(chapterCombatContext().threat).toBeUndefined();
      expect(new GameCore().rules).toBe('legacy');
      expect(threatV2.version).toBe('threat-v2');
    });
    it('covers every spawnable enemy in the override table', () => {
      const pool = firstStage.storyEncounter.enemies as [string, number][];
      expect(pool.length).toBeGreaterThan(0);
      for (const [id] of pool) expect(threatV2.enemyDamage[id], id).toBeGreaterThan(0);
      for (const damage of Object.values(threatV2.enemyDamage)) expect(damage).toBeGreaterThan(0);
    });
  });

  it('writes the evidence report', () => {
    const configurations = [
      { rules: 'legacy' as const, journey: 'classic' as const, strategy: 'stationary' as const, maxSeconds: 370 },
      { rules: 'legacy' as const, journey: 'classic' as const, strategy: 'active' as const, ...CANONICAL },
      { rules: 'legacy' as const, journey: 'evolution' as const, strategy: 'stationary' as const, maxSeconds: 370 },
      { rules: 'threat-v2' as const, journey: 'classic' as const, strategy: 'stationary' as const, maxSeconds: 370 },
      { rules: 'threat-v2' as const, journey: 'classic' as const, strategy: 'active' as const, ...CANONICAL },
      { rules: 'threat-v2' as const, journey: 'evolution' as const, strategy: 'stationary' as const, maxSeconds: 370 },
      { rules: 'threat-v2' as const, journey: 'evolution' as const, strategy: 'active' as const, ...CANONICAL },
      ...SWEEP_SEEDS.map(seed => ({ rules: 'threat-v2' as const, journey: 'classic' as const, strategy: 'active' as const, seed })),
    ];
    const report = {
      slice: 'R1g-12',
      base: 'R1g-11',
      harness: 'src/core/threatModel.test.ts',
      frameHz: 1 / FRAME,
      viewport: { width: 390, height: 844 },
      seed: 15,
      sweepSeeds: [...SWEEP_SEEDS],
      threatV2,
      /**
       * The instrument, named because it changed in R1g-11: `active` is the twin of
       * `tests/settlement.spec.ts` (HUD rule + `f` + a press per step, 180ms while the Boss is up).
       * Readings taken before R1g-11 on the same arm were taken on a strictly weaker player.
       */
      instrument: 'active = twin of tests/settlement.spec.ts (reads 首领招式, presses 闪避 and f, one press per step; 180ms steps while the Boss is up)',
      traces: configurations.map(configuration => trace(configuration)),
      /**
       * The distribution, per journey - which is the whole point, because R1g-11's pooled median
       * (0.264) cleared G2 while evolution alone sat at 0.147. R1g-12 re-swept `enemyDamage` and
       * both journeys are now inside the band. `hordeOff` is the attribution half and it still
       * holds: zeroing the table lifts evolution past 0.7 with 33 of 33 wins.
       */
      distribution: (['classic', 'evolution'] as const).map(journey => {
        const list = DISTRIBUTION_SEEDS.map(seed => trace({ rules: 'threat-v2' as const, journey, strategy: 'active' as const, seed }));
        const floors = list.map(run => run.minHpRatio).sort((a, b) => a - b);
        const noHorde = DISTRIBUTION_SEEDS.map(seed => trace({ rules: 'threat-v2' as const, journey, strategy: 'active' as const, seed, hordeScale: 0 }));
        return {
          journey, runs: list.length, wins: list.filter(run => run.bossDefeated).length,
          hpMinMedian: floors[Math.floor(floors.length / 2)],
          lostToBossMedian: Math.round(list.map(run => Object.entries(run.damageTakenBy).filter(([source]) => source.startsWith('B001')).reduce((sum, [, value]) => sum + value, 0)).sort((a, b) => a - b)[Math.floor(list.length / 2)]!),
          hordeOff: { hpMinMedian: noHorde.map(run => run.minHpRatio).sort((a, b) => a - b)[Math.floor(noHorde.length / 2)], wins: noHorde.filter(run => run.bossDefeated).length },
        };
      }),
    };
    try {
      mkdirSync(EVIDENCE, { recursive: true });
      writeFileSync(resolve(EVIDENCE, 'threat-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.traces).toHaveLength(configurations.length);
  }, 600_000);
});
