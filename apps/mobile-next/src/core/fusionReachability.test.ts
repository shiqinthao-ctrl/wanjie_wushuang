import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import { seededRandom } from '../chapter/growth';
import { calculateStartup } from './growth';
import { pacingProfile } from './RunEvolution';
import fresh from '../data/freshSave.json';
import evolutionTable from '../data/evolution.json';
import fusionTable from '../data/fusions.json';
import { activeSkills, passiveSkills } from './evolutionCatalog';
import { firstStage } from './spawnRules';
import { Progression } from './progression';
import { TimedChests } from './timedChests';
import type { GearInstance } from './saveTypes';

const FRAME = 1 / 60;
/**
 * Output is isolated per slice. This harness owns exactly one question - "was a fusion on
 * offer, and if not, why not" - so its report keeps `slice: 'R1g-8'`. But R1g-12 re-ran it after
 * recalibrating the horde contact table and the attribution changed shape (which runs end early,
 * and whether the two miss mechanisms are disjoint), so the file lives in R1g-12's directory: the
 * *directory* names the tree the numbers were measured on, the `slice` field names the slice that
 * owns the question. R1g-8's quoted numbers stay valid as *R1g-8's* measurements; they are
 * reproduced inline in `evidence/R1g-8/IMPLEMENTATION.md`, not read back from the file.
 */
const EVIDENCE = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R1g-12');
/** TASK.md R1g-8 Scope 3 asks for 33 seeds; the GDD §4 targets are stated per run. */
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
/** `growthPacing.test.ts`'s smaller set. `focus` runs on it so its number maps onto that file's. */
const SENSITIVITY_SEEDS = [1, 2, 3, 5, 7, 11, 13, 15, 21, 25, 33];

const ACTIVE = new Set<string>(activeSkills);
const PASSIVE = new Set<string>(passiveSkills);
/**
 * The chest schedule the `paced` profile ships, read from the profile rather than typed in, so a
 * schedule change moves this harness's attribution with it. A fusion can only be offered at a
 * chest that opens *after* both parents are evolved, so the second parent's gate has to be met by
 * the second-to-last chest for the last one to carry the offer.
 */
const CHEST_AT = pacingProfile('paced').chestAt;
const SECOND_TO_LAST_CHEST = CHEST_AT[CHEST_AT.length - 2]!;
const evolutions = Object.entries(evolutionTable as Record<string, string[]>);
const fusions = Object.entries(fusionTable as Record<string, string[]>);
/** Same reachability filter every sibling harness uses: both parts must live in a levellable pool. */
const reachableIds = new Set(evolutions.filter(([, [, a, p]]) => ACTIVE.has(a!) && PASSIVE.has(p!)).map(([id]) => id));
const reachableFusions = fusions.filter(([, [, x, y]]) => reachableIds.has(x!) && reachableIds.has(y!));

/**
 * The cheapest *legal* fusion recipe, derived from the tables rather than hard-coded, so a data
 * change moves the target instead of silently invalidating the run. Cheapest = fewest distinct
 * passives, because the chest gate is per-row and a shared passive is one pick for two rows.
 * `F004 = E003(A003+P026) + E054(A054+P026)` is the unique winner: its two parents share `P026`,
 * which `calculateStartup` already grants at Lv.1, so the whole recipe costs two actives at Lv.5.
 */
const RECIPES = reachableFusions
  .map(([id, [, x, y]]) => {
    const parents = [x!, y!].map(parent => (evolutionTable as Record<string, string[]>)[parent]!);
    return { id, parents: [x!, y!], skills: parents.map(parent => parent[1]!), passives: [...new Set(parents.map(parent => parent[2]!))] };
  })
  .sort((a, b) => a.passives.length - b.passives.length || a.skills.join().localeCompare(b.skills.join()));
const RECIPE = RECIPES[0]!;

type Driver = 'first' | 'focus' | 'fusion';
interface ChestTrace {
  readonly at: number;
  /** Was a fusion's two parents *both already evolved* when this chest was claimed? */
  readonly precondition: boolean;
  readonly options: readonly string[];
  readonly index: number;
}
interface Sample {
  readonly seed: number;
  readonly driver: Driver;
  readonly seconds: number;
  readonly endReason: string | undefined;
  readonly evolved: readonly string[];
  readonly fused: readonly string[];
  readonly chests: readonly ChestTrace[];
  readonly chestsOpened: number;
  readonly ttk: number;
  /** First second at which *each* recipe parent's gate (`Lv.5` skill + the paced passive gate) held. */
  readonly parentGateAt: Readonly<Record<string, number | undefined>>;
  /** The second the whole recipe became evolvable, i.e. both parents' gates held. `undefined` if never. */
  readonly recipeReadyAt: number | undefined;
  /** Recipe skill levels at the end, so "was the second parent ever ready in time" is a number. */
  readonly recipeLevels: Readonly<Record<string, number>>;
  /** Owned actives at the end - the `validOptions` unlock cap is 6, so this can crowd a recipe out. */
  readonly ownedActives: number;
}

/** The same unit-level chest construction `timedChests.test.ts` uses, minus the oracle. */
function offer(ready: string[], evolved: string[], random: () => number) {
  const start = calculateStartup(fresh), skills: Record<string, number> = { ...start.skills }, passives: Record<string, number> = { ...start.passives };
  for (const id of ready) { const [, skill, passive] = (evolutionTable as Record<string, string[]>)[id]!; skills[skill!] = 5; passives[passive!] = 5; }
  const forms = { evolved: Object.fromEntries(evolved.map(id => [id, true])), fused: {} as Record<string, boolean> };
  const progression = new Progression(fresh.build, skills, passives, random), drops: GearInstance[] = [];
  const chests = new TimedChests(progression, forms, 'H001', drops, random, () => 1);
  chests.claim(0, 90);
  return chests.snapshot(90).offer!.options;
}
/** A deterministic-but-distinct RNG stream, so "the offer does not read randomness" is testable. */
const stream = (seed: number) => { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };

/**
 * Rules-only driver. The **twin of `tests/settlement.spec.ts`**: `browser` press cadence, the `f`
 * key, the `首领招式` readout, the 闪避 button, 390x844, `threat-v2`. Before R1g-11 this was declared
 * "the fixed instrument D5 named" - a player who never dodges - so its readings were of a different
 * player than the one the shipped build is judged on; the declaration is what changed, not the
 * number of seeds. Every number here is comparable with `manual-report.json`'s `browser` rows, which
 * run the same rule.
 *
 * Three level-up policies, because "was a fusion offered" is a different question for each:
 * `first` is natural play (`tests/settlement.spec.ts` takes the front option), `focus` is
 * `growthPacing.test.ts`'s G6/G7 policy (commit to one reachable row), and `fusion` is a player
 * who *knows a recipe* and steers for it. `focus` is not the G7 ceiling and never was: it commits
 * to the first owned reachable row, which is not a fusion pair, so measuring G7 with it measures
 * the policy rather than the rule.
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
function run(driver: Driver, seed: number): Sample {
  const core = new GameCore(structuredClone(fresh), seededRandom(seed), 'evolution', undefined, 'threat-v2');
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  core.start(390, 844);
  /** The HUD rule's memory. Starts blank, so the Boss's spawn readout (`'准备攻击'`) arms nothing. */
  const sight: HudSight = { next: '', until: -1 };
  const chests: ChestTrace[] = [];
  const parentGateAt: Record<string, number | undefined> = {};
  const gate = pacingProfile('paced').passiveGate;
  let target: readonly [string, string] | undefined;
  let stalled = 0, chestsOpened = 0, spawnAt = 0, killAt = 0, lastPress = -1;
  for (let frame = 0; frame < Math.ceil(400 / FRAME); frame++) {
    const state = core.snapshot();
    if (state.status === 'ended') break;
    // A gate, once met, stays met (levels only rise), so "first second" is also "from this second on".
    for (const parent of RECIPE.parents) {
      const [, skill, passive] = (evolutionTable as Record<string, string[]>)[parent]!;
      if (parentGateAt[parent] === undefined && (state.skills[skill!] || 0) >= 5 && (state.passives[passive!] || 0) >= gate) {
        parentGateAt[parent] = Math.round(state.time * 10) / 10;
      }
    }
    if (state.status === 'choosing') {
      const options = state.choice!.options;
      if (!target) {
        const owned = evolutions.filter(([id, [, a]]) => reachableIds.has(id) && (state.skills[a!] || 0) > 0)[0];
        target = owned ? [owned[1][1]!, owned[1][2]!] : undefined;
      }
      const preferred = driver === 'fusion'
        // Steer the two recipe actives; the shared passive is already owned at Lv.1.
        ? options.find(option => RECIPE.skills.includes(option.id))
          ?? options.find(option => RECIPE.passives.includes(option.id) && (state.passives[option.id] || 0) === 0)
        : driver === 'focus'
          ? options.find(option => option.id === target?.[0]) ?? options.find(option => option.id === target?.[1])
          : undefined;
      const pick = preferred ?? options[0]!;
      if (!core.choose(state.choice!.token, pick.kind, pick.id) && ++stalled > 120) break;
      stalled = 0; continue;
    }
    if (state.status === 'encounter') { if (!core.resolveEvent(state.encounter.offer!.token, 'skip', { affordable: true, gold: 6000 }) && ++stalled > 120) break; stalled = 0; continue; }
    if (state.status === 'chest') {
      const options = state.chests.offer!.options;
      const evolved = state.chests.evolved, fused = state.chests.fused;
      // Read the *same* set `TimedChests.claim` builds the offer from, including the
      // `!forms.fused[id]` guard: a run that already took its fusion correctly stops offering it,
      // so omitting that clause invents nine phantom violations (measured, first pass of this test).
      const precondition = reachableFusions.some(([id, [, x, y]]) => !fused.includes(id) && evolved.includes(x!) && evolved.includes(y!));
      const fusion = options.findIndex(option => option.type === 'fusion');
      const recipeEvo = options.findIndex(option => option.type === 'evo' && RECIPE.parents.includes(option.id!));
      // A deliberate player does not burn a chest on an unrelated row: it takes the filler instead.
      const filler = options.findIndex(option => option.type !== 'evo' && option.type !== 'fusion');
      const index = driver === 'fusion'
        ? fusion >= 0 ? fusion : recipeEvo >= 0 ? recipeEvo : Math.max(0, filler)
        : driver === 'focus' ? (fusion >= 0 ? fusion : Math.max(0, options.findIndex(option => option.type === 'evo'))) : 0;
      chests.push({
        at: Math.round(state.time * 10) / 10, precondition, index,
        options: options.map(option => `${option.type}${option.id ? `:${option.id}` : ''}`),
      });
      if (!core.pickChest(state.chests.offer!.token, index) && ++stalled > 120) break;
      stalled = 0; continue;
    }
    if (state.status === 'boss-loot') { const uid = state.boss.offer?.[0]?.uid; const picked = uid ? core.pickBossLoot(uid) : core.pickChapterLoot(); if (!picked && ++stalled > 120) break; stalled = 0; continue; }
    const due = state.chests.rewards.find(reward => reward.state === 'ready');
    if (due && core.claimChest(due.index)) { chestsOpened++; continue; }
    if (state.map.target?.canUse && core.interact()) continue;
    const boss = state.boss.boss;
    if (boss) {
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
    const pressNow = !!boss || state.time - lastPress >= 1;
    if (pressNow) { lastPress = state.time; core.action('skill'); core.action('ultimate'); }
    core.advance(FRAME);
    const now = core.snapshot();
    if (now.boss.boss && !spawnAt) spawnAt = now.time;
    if (now.boss.lootShown && !killAt) killAt = now.time;
  }
  const end = core.snapshot();
  const recipeLevels = Object.fromEntries(RECIPE.skills.map(id => [id, end.skills[id] || 0]));
  const gates = RECIPE.parents.map(parent => parentGateAt[parent]);
  const result: Sample = {
    seed, driver, seconds: Math.round(end.time * 10) / 10, endReason: end.endReason,
    evolved: [...end.chests.evolved], fused: [...end.chests.fused], chests, chestsOpened,
    ttk: spawnAt && killAt ? Math.round((killAt - spawnAt) * 10) / 10 : 0,
    parentGateAt, recipeReadyAt: gates.every(at => at !== undefined) ? Math.max(...(gates as number[])) : undefined,
    recipeLevels, ownedActives: Object.values(end.skills).filter(level => (level || 0) > 0).length,
  };
  core.destroy();
  return result;
}

const DRIVERS: readonly Driver[] = ['first', 'focus', 'fusion'];
/**
 * The seed set per policy, declared rather than shared: `first` and `fusion` answer Scope 3's
 * acceptance question and get the full 33, while `focus` only has to be comparable with
 * `growthPacing.test.ts`'s own `focus` cells, which run on the sensitivity set.
 */
const SEEDS_BY_DRIVER: Record<Driver, readonly number[]> = { first: SEEDS, focus: SENSITIVITY_SEEDS, fusion: SEEDS };
const cache = new Map<string, Sample[]>();
function samples(driver: Driver): Sample[] {
  let value = cache.get(driver);
  if (!value) { value = SEEDS_BY_DRIVER[driver].map(seed => run(driver, seed)); cache.set(driver, value); }
  return value;
}
const all = (): Sample[] => DRIVERS.flatMap(driver => samples(driver));
const ratio = (part: number, whole: number): number => whole > 0 ? Math.round(part / whole * 10000) / 10000 : 0;
const median = (values: readonly number[]): number => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; };
/** A run that never saw a fusion on offer, with the reason the recipe was not ready in time. */
const missesOf = (runs: readonly Sample[]) => runs.filter(run => !run.chests.some(chest => chest.options.some(option => option.startsWith('fusion'))));
interface Summary {
  runs: number; seeds: readonly number[]; offeredRuns: number; offeredRate: number; preconditionRuns: number;
  achievedRuns: number; achievedRate: number; chests: number; preconditionChests: number;
  preconditionChestsWithoutFusion: number; fusedIds: string[];
}
function summarise(runs: readonly Sample[]): Summary {
  const chests = runs.flatMap(run => run.chests);
  const preconditionChests = chests.filter(chest => chest.precondition);
  return {
    runs: runs.length,
    seeds: runs.map(run => run.seed),
    offeredRuns: runs.filter(run => run.chests.some(chest => chest.options.some(option => option.startsWith('fusion')))).length,
    offeredRate: ratio(runs.filter(run => run.chests.some(chest => chest.options.some(option => option.startsWith('fusion')))).length, runs.length),
    preconditionRuns: runs.filter(run => run.chests.some(chest => chest.precondition)).length,
    achievedRuns: runs.filter(run => run.fused.length > 0).length,
    achievedRate: ratio(runs.filter(run => run.fused.length > 0).length, runs.length),
    chests: chests.length,
    preconditionChests: preconditionChests.length,
    preconditionChestsWithoutFusion: preconditionChests.filter(chest => !chest.options.some(option => option.startsWith('fusion'))).length,
    fusedIds: [...new Set(runs.flatMap(run => run.fused))].sort(),
  };
}

describe('Fusion reachability (R1g-8)', () => {
  it('pins the premise: the offer is ordered, never drawn', () => {
    // R1g-8 was filed on "TimedChests picks a fusion candidate by uniform draw over the eligible
    // pool". It does not, and never did: `claim` pushes every eligible fusion *first*, then every
    // eligible evolution, then filler, and truncates to three. The offer therefore cannot depend
    // on randomness at all - and if it does not, the ordering fix the slice asked for is a no-op.
    const base = offer([], ['E011', 'E026'], stream(1));
    expect(base.map(option => `${option.type}${option.id ? `:${option.id}` : ''}`)).toEqual(['fusion:F001', 'upgrade', 'gear']);
    for (const seed of [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31]) {
      const other = offer([], ['E011', 'E026'], stream(seed));
      expect(other, `rng stream ${seed} changed the offer`).toEqual(base);
    }
    // Same for a pool with an eligible evolution next to the fusion: the fusion keeps index 0.
    // `E054` is the row used because `E011`/`E026` are already evolved above, and an evolved row
    // is correctly excluded from the evolution candidates (`!this.forms.evolved[id]`).
    const mixed = offer(['E054'], ['E011', 'E026'], stream(9));
    expect(mixed.map(option => `${option.type}${option.id ? `:${option.id}` : ''}`)).toEqual(['fusion:F001', 'evo:E054', 'gear']);
  });

  it('pins the consequence: three eligible fusions crowd every evolution out of the offer', () => {
    // The legacy oracle (`tasks/mobile-modernization/baseline/chests-oracle.json`, last selection
    // case) already fixes this priority - six evolved rows produce `焚天龙卷 / 天火炼狱 / 炎龙乱舞`
    // and no evolution - so this is migrated legacy behaviour, not something R1g-8 introduced or
    // needs to introduce. It is recorded here because it is the load-bearing fact for G7: the
    // offer is *not* a place where the fusion can be lost.
    const parents = [...new Set(reachableFusions.flatMap(([, [, x, y]]) => [x!, y!]))].slice(0, 6);
    const crowded = offer(parents, parents, stream(4));
    expect(crowded).toHaveLength(3);
    expect(crowded.every(option => option.type === 'fusion')).toBe(true);
  });

  it('attributes the gap: whenever both parents are evolved, the fusion is on the chest', () => {
    // The rule, stated exactly: the precondition is "some reachable fusion's two parents are both
    // already evolved when the chest is claimed", and under that precondition the offer must carry
    // a fusion. This is an equality, not a rate - the offer has no randomness to lose with.
    const violations = all().flatMap(run => run.chests
      .filter(chest => chest.precondition && !chest.options.some(option => option.startsWith('fusion')))
      .map(chest => `${run.driver}/${run.seed}@${chest.at}: ${chest.options.join(', ')}`));
    expect(violations).toEqual([]);
    // And the precondition is not vacuous - it is reached by real runs on this tree.
    expect(all().filter(run => run.chests.some(chest => chest.precondition)).length).toBeGreaterThan(0);
  }, 300_000);

  it('measures the G7 rate under three policies, and names the bottleneck', () => {
    const natural = summarise(samples('first'));
    const focused = summarise(samples('focus'));
    const deliberate = summarise(samples('fusion'));
    // The instrument is not the ceiling: `focus` commits to the first owned reachable row, which
    // is not a fusion pair, so its rate is a property of the policy. A player who steers for a
    // recipe does strictly better, which is the honest reading of "熟练玩家单局可达成 1 个融合".
    expect(deliberate.offeredRate).toBeGreaterThan(focused.offeredRate);
    expect(deliberate.offeredRate).toBeGreaterThan(natural.offeredRate);
    // A deliberate player is not left holding the offer: every run that saw a fusion took it.
    expect(deliberate.achievedRate).toBe(deliberate.offeredRate);
    // Scope 3's acceptance is "a fusion candidate was offered at least once in 100% of runs".
    // It is **not met**, and this pins the shortfall rather than hiding it: measured 20/33 =
    // 60.6% for the deliberate policy, 3/33 = 9.1% for natural play. The cause is *not* the
    // offer - see the attribution below and `evidence/R1g-8/IMPLEMENTATION.md` §3.
    //
    // R1g-11: 20 -> 18 (54.5%). The bottleneck R1g-8 named is the *level-up* pool - `A054` has to
    // reach Lv.5 before a fusion is reachable - so a harder Boss, which ends runs earlier and levels
    // the player less, moves it. The floor is pinned to the measurement so the shortfall stays
    // visible; the target is still 33/33 and still belongs to R2-D.
    //
    // R1g-12 re-ran this on the recalibrated horde table and the deliberate count did *not* move
    // (18/33 = 54.5%); what moved is the natural policy, 3/33 -> **2/33** (6.1%), and the run that
    // ends early. So the floor stays where R1g-11 put it - it is a floor, and a floor that follows
    // every balance change down is not one.
    expect(deliberate.offeredRuns).toBeGreaterThanOrEqual(18);
    expect(deliberate.offeredRate).toBeLessThan(1);
    expect(natural.offeredRate).toBeLessThan(deliberate.offeredRate);
    for (const summary of [natural, focused, deliberate]) {
      // Every chest that had the precondition carries a fusion - the per-chest form of the rule.
      expect(summary.preconditionChestsWithoutFusion).toBe(0);
    }
    // The bottleneck, as a number rather than a story: a fusion can only be *offered* at a chest
    // that opens after both parents are evolved, so the recipe has to be ready strictly *before*
    // the second-to-last chest (240s) for the last one to carry the offer.
    const misses = missesOf(samples('fusion'));
    // Two mechanisms, and R1g-11 added the second one. Both are outside the offer rule's control -
    // which is the claim being tested - but they are not the same defect:
    //
    // (a) the gate arrived too late: the second parent's skill never reached Lv.5, or did so at or
    //     after the second-to-last chest, leaving no chest behind it. 13 runs on this tree (9 never
    //     reached `A054` Lv.5 at all; 4 did, but only at the 240s chest itself).
    // (b) there was no last chest at all: the run ended before the 300s chest, so a fusion whose
    //     precondition first became true *at* the 240s chest had nowhere left to appear. R1g-11's
    //     shorter Boss fight is what made this reachable - a run now ends ~63s after the Boss spawns
    //     instead of ~80s. This one is a *pacing* defect and belongs with `CHEST_AT` (R2-D), not
    //     with the chest rule.
    //
    // R1g-12 had to state the partition properly, and the reason is worth keeping. R1g-8 counted
    // (a) and (b) as disjoint and passed - but they overlap by construction: a run with no last
    // chest also has no chest behind its gate, so "late" is true of it too whenever its gate was
    // not ready. R1g-8 got away with it only because the two runs that ended early (26, 28) both
    // had their gate ready *before* 240s. R1g-12's horde table moved which runs end early
    // (26, 28 -> 4, 30) and seed 4 is *both* defects at once, so the sum overshot the miss count by
    // one. (a) is therefore counted only over runs that had a last chest.
    const late = misses.filter(run => run.chests.length === CHEST_AT.length
      && (run.recipeReadyAt === undefined || run.recipeReadyAt >= SECOND_TO_LAST_CHEST));
    const noLastChest = misses.filter(run => run.chests.length < CHEST_AT.length);
    expect(misses.length).toBeGreaterThan(0);
    expect(late.length + noLastChest.length).toBe(misses.length);
    expect(noLastChest.map(run => run.seed)).toEqual([4, 30]);
    // Seed 30 is the clean case of (b) and the one that makes it a *pacing* claim rather than a
    // restatement of (a): its gate was ready at 165s, a full chest before the second-to-last one,
    // and the run still ended without a 300s chest. Seed 4 is the overlap case (gate never ready
    // *and* no last chest), which is why (a) excludes incomplete runs.
    expect(noLastChest.find(run => run.seed === 30)!.recipeReadyAt).toBeLessThan(SECOND_TO_LAST_CHEST);
  }, 300_000);

  it('writes the evidence report', () => {
    const report = {
      slice: 'R1g-8',
      base: 'R1g-7',
      harness: 'src/core/fusionReachability.test.ts',
      instrument: {
        journey: 'evolution', rules: 'threat-v2', press: 'browser (skill/ultimate every second, every frame during the Boss)',
        interact: true, viewport: [390, 844], chestAt: CHEST_AT,
        seeds: Object.fromEntries(DRIVERS.map(driver => [driver, SEEDS_BY_DRIVER[driver]])),
      },
      premise: {
        asked: 'TimedChests picks a fusion candidate by uniform draw over the eligible pool',
        verdict: 'false - claim() pushes eligible fusions first, then evolutions, then filler, and truncates to three; the offer is a pure function of the eligible pool',
        evidence: 'chests-oracle.json selection case 8 (six evolved rows -> 焚天龙卷/天火炼狱/炎龙乱舞, zero evolutions) already pins the priority as migrated legacy behaviour',
      },
      table: {
        reachableEvolutions: reachableIds.size,
        reachableFusions: reachableFusions.map(([id, [, x, y]]) => `${id}:${x}+${y}`),
        achievedFusions: [...new Set(all().flatMap(run => run.fused))].sort(),
      },
      recipe: RECIPE,
      drivers: Object.fromEntries(DRIVERS.map(driver => [driver, summarise(samples(driver))])),
      /**
       * Why the runs that missed missed. The claim being tested is that the offer is not the
       * bottleneck, so the misses have to be attributed to something the offer cannot control:
       * the second parent's gate arriving after the last chest that could have carried the offer.
       */
      attribution: Object.fromEntries(DRIVERS.map(driver => {
        const runs = samples(driver), misses = missesOf(runs);
        return [driver, {
          recipeReadyAtMedian: median(runs.map(run => run.recipeReadyAt).filter((value): value is number => value !== undefined)),
          recipeReadyBeforeSecondToLastChest: runs.filter(run => run.recipeReadyAt !== undefined && run.recipeReadyAt < SECOND_TO_LAST_CHEST).length,
          /** How many misses never got the second parent's *skill* to Lv.5 at all. */
          missesWhereSecondSkillNeverLevelled: misses.filter(run => (run.recipeLevels[RECIPE.skills[1]!] ?? 0) < 5).length,
          /**
           * How many misses *did* level it (R1g-11: the old label said "only at or after the
           * second-to-last chest", which the predicate never checked - it only tested `>= 5`).
           */
          missesWhereSecondSkillDidLevel: misses.filter(run => (run.recipeLevels[RECIPE.skills[1]!] ?? 0) >= 5).length,
          /** Of those, how many levelled it at or after the second-to-last chest - i.e. too late. */
          missesWhereSecondSkillLevelledTooLate: misses.filter(run => run.recipeReadyAt === undefined || run.recipeReadyAt >= SECOND_TO_LAST_CHEST).length,
          /**
           * R1g-11's second mechanism: runs whose last chest never happened, so a fusion whose
           * precondition became true at the 240s chest had nowhere to appear. Pacing, not the rule.
           */
          missesWhereTheLastChestNeverHappened: misses.filter(run => run.chests.length < CHEST_AT.length).map(run => run.seed),
          ownedActivesMedian: median(runs.map(run => run.ownedActives)),
          recipeLevelsMedian: Object.fromEntries(RECIPE.skills.map(id => [id, median(runs.map(run => run.recipeLevels[id] ?? 0))])),
          misses: misses.map(run => ({ seed: run.seed, recipeReadyAt: run.recipeReadyAt, recipeLevels: run.recipeLevels, evolved: run.evolved, ownedActives: run.ownedActives })),
        }];
      })),
      pooled: summarise(all()),
      trace: all().map(run => ({ seed: run.seed, driver: run.driver, fused: run.fused, evolved: run.evolved, chests: run.chests })),
    };
    try {
      mkdirSync(EVIDENCE, { recursive: true });
      writeFileSync(resolve(EVIDENCE, 'fusion-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.drivers).toHaveProperty('fusion');
  }, 300_000);
});
