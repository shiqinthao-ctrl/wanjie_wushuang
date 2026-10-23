import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import { seededRandom } from '../chapter/growth';
import { chapterCoreSkills } from '../chapter/catalog';
import { activeSkills, heroForms as formTable, passiveSkills, skillRoutes, starters } from './evolutionCatalog';
import { evolutionBuild } from './RunEvolution';
import { firstStage } from './spawnRules';
import type { GameSave } from './saveTypes';
import fresh from '../data/freshSave.json';
import evolutionTable from '../data/evolution.json';
import fusionTable from '../data/fusions.json';

/**
 * R2-D: the 200-seed build report, per hero.
 *
 * Three slices measured *reachability* on one hero (H001) and reported 9 evolutions / 4 fusions
 * out of 20 rows. That number is a property of the **pool**, and the pool is `evolutionBuild(hero)`,
 * which differs per hero only through `starter(hero).active` (two actives, in table order) and
 * `starter(hero).passive`. So the structural count is hero-invariant by construction - this harness
 * asserts that instead of assuming it, and then measures what *is* per-hero: what a run actually
 * reaches. `F026` (`SE001` + `E015`) is the motivating case: both parents are H012's starter
 * actives, so a H012 run starts holding half the recipe while a H001 run has to buy both.
 *
 * ## The instrument (declared in the same breath as the numbers)
 *
 * - **Seeds**: `1..200`, fixed, the same set for every hero. Written into the report.
 * - **Driver**: `fusionReachability.test.ts`'s rules-only player, unchanged - 390x844,
 *   `threat-v2`, `evolution` journey, press `skill`+`ultimate` every second (and every frame while
 *   a Boss is up), the HUD dodge cue, `f` interact, and chest/encounter/boss-loot resolved through
 *   the public `GameCore` methods. `tests/settlement.spec.ts` is the browser twin of this rule.
 * - **Level-up policy**: the front option (`options[0]`), i.e. the same natural player
 *   `settlement.spec.ts` is.
 * - **One steering exception, and it is declared**: the *form* pick is `options[seed % options.length]`.
 *   The journey path does not shuffle the form offer (`RunEvolution.special` returns the table
 *   order when `!ruleset`), so the front-option player would only ever be offered one form per hero
 *   and the report would describe one of eleven forms. Rotating by seed gives every form 50-67
 *   seeds, which is the "at least 33 per cell" floor in `TASK.md`. Every other choice is untouched.
 */
const EVIDENCE_ROOT = resolve(process.cwd(), '../../tasks/game-remediation/evidence');
const FRAME = 1 / 60;
/** 200 fixed seeds, identical for every hero. */
const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);
const HEROES: readonly string[] = starters.map(hero => hero.id);
const ACTIVE = new Set<string>(activeSkills);
const PASSIVE = new Set<string>(passiveSkills);
const evolutions = Object.entries(evolutionTable as Record<string, string[]>);
const fusions = Object.entries(fusionTable as Record<string, string[]>);
/**
 * The same reachability filter every sibling harness uses: **both** parts must live in a levellable
 * pool. Derived here from `activeSkills`/`passiveSkills`, then re-checked per hero against
 * `evolutionBuild(hero)` in the first test.
 */
const reachable = new Set(evolutions.filter(([, [, skill, passive]]) => ACTIVE.has(skill!) && PASSIVE.has(passive!)).map(([id]) => id));
const reachableFusions = new Set(fusions.filter(([, [, a, b]]) => reachable.has(a!) && reachable.has(b!)).map(([id]) => id));
const routeSkill = new Map<string, string>(skillRoutes.map(route => [route.id, route.skill]));
/** `special` filters by `form.hero === this.hero`, so the offered set is the hero's own rows. */
const formsOf = (hero: string): string[] => formTable.filter(form => form.hero === hero).map(form => form.id);
/**
 * Measured on the current tree, pinned so a data or rule change has to move them on purpose.
 * The two halves are the finding: `F001`/`F004` want `A003`+`A054`, which only H001 and H010 can
 * afford to buy, while `F026` wants `SE001`+`E015` - both H012's *starter* actives. A H001 or H010
 * run never takes `F026` and a H012 run never takes the other two, so the four structurally
 * reachable fusions are not four reachable fusions *for any one hero*.
 */
const REACHED_FUSIONS: Record<string, readonly string[]> = { H001: ['F001', 'F004'], H010: ['F001', 'F004'], H012: ['F026'] };
/** The first `skillRoutes` row whose skill is one of the hero's starters - the route `special()` hands out. */
const FORCED_ROUTE: Record<string, string> = Object.fromEntries(HEROES.map(hero => {
  const owned = starterOf(hero);
  return [hero, skillRoutes.find(route => owned.includes(route.skill))!.id];
}));
function starterOf(hero: string): readonly string[] {
  return starters.find(row => row.id === hero)!.active;
}

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

interface OfferTrace {
  readonly level: number;
  /** Options `validOptions()` would have produced, re-derived from the snapshot (see `eligible`). */
  readonly eligible: number;
  readonly shown: number;
  readonly kinds: readonly string[];
  readonly picked: string;
  /** The pick bought a *new* skill rather than levelling one the run already owned. */
  readonly unlock: boolean;
  /** The offered set was `special` (form / awakening / route), not the normal skill pool. */
  readonly special: boolean;
}
interface ChestTrace { readonly at: number; readonly options: readonly string[]; readonly index: number }
interface Sample {
  readonly hero: string;
  readonly seed: number;
  readonly seconds: number;
  readonly endReason: string | undefined;
  readonly level: number;
  readonly skills: Readonly<Record<string, number>>;
  readonly passives: Readonly<Record<string, number>>;
  readonly evolved: readonly string[];
  readonly fused: readonly string[];
  readonly formId: string | undefined;
  readonly awakened: boolean;
  readonly routes: readonly string[];
  readonly core: string | undefined;
  readonly coreLevel: number;
  readonly maxActive: number;
  readonly ownedActives: number;
  readonly ownedPassives: number;
  readonly offers: readonly OfferTrace[];
  readonly chests: readonly ChestTrace[];
  /** Every candidate that the production rules should never have offered. Empty is the assertion. */
  readonly illegal: readonly string[];
}
/**
 * `Progression.validOptions()` shuffles with the run's own RNG, so calling it from a harness would
 * perturb the run it is measuring. The *count* is RNG-free, so it is re-derived here from the same
 * snapshot the offer was made against - and `shown === min(3, eligible)` is asserted on every
 * normal offer, which is what makes this derivation falsifiable rather than a restatement.
 */
function eligible(build: { active: readonly string[]; passive: readonly string[] }, kind: 'active' | 'passive', levels: Readonly<Record<string, number | undefined>>): number {
  const owned = Object.keys(levels).filter(id => (levels[id] || 0) > 0).length;
  let count = 0;
  for (const id of build[kind]) {
    const level = levels[id] || 0;
    if (level > 0 && level < 5) count++;
    else if (level === 0 && owned < 6) count++;
  }
  return count;
}
function run(hero: string, seed: number): Sample {
  const save: GameSave = { ...structuredClone(fresh), hero };
  const core = new GameCore(save, seededRandom(seed), 'evolution', undefined, 'threat-v2');
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  core.start(390, 844);
  const build = evolutionBuild(hero);
  const sight: HudSight = { next: '', until: -1 };
  const offers: OfferTrace[] = [], chests: ChestTrace[] = [], illegal: string[] = [];
  const forms = formsOf(hero);
  let lastPress = -1;
  for (let frame = 0; frame < Math.ceil(400 / FRAME); frame++) {
    const state = core.snapshot();
    if (state.status === 'ended') break;
    if (state.status === 'choosing') {
      const options = state.choice!.options;
      const special = options.some(option => option.kind === 'hero' || option.kind === 'route' || option.kind === 'recovery');
      for (const option of options) {
        if (option.kind === 'active' || option.kind === 'passive') {
          if (!(build[option.kind] as readonly string[]).includes(option.id)) illegal.push(`level ${state.level}: ${option.kind} ${option.id} not in the pool`);
        } else if (option.kind === 'hero') {
          if (option.id !== 'awaken' && !forms.includes(option.id)) illegal.push(`level ${state.level}: form ${option.id} is not ${hero}'s`);
        } else if (option.kind === 'route') {
          const skill = routeSkill.get(option.id);
          if (!skill || (state.skills[skill] || 0) < 3) illegal.push(`level ${state.level}: route ${option.id} without ${String(skill)} at Lv.3`);
          const routed: readonly string[] = Object.values(state.journey?.routes ?? {}).filter((id): id is NonNullable<typeof id> => id !== undefined);
          if (routed.includes(option.id)) illegal.push(`level ${state.level}: route ${option.id} offered twice`);
        } else illegal.push(`level ${state.level}: ${option.kind} in a journey run (that fallback is chapter-only)`);
      }
      const normal = !special;
      const eligibleCount = normal ? eligible(build, 'active', state.skills) + eligible(build, 'passive', state.passives) : -1;
      if (normal && options.length !== Math.min(3, eligibleCount)) illegal.push(`level ${state.level}: ${options.length} shown of ${eligibleCount} eligible`);
      // Declared steering: the form pick rotates with the seed, everything else takes the front option.
      const pick = options.find(option => option.kind === 'hero' && option.id !== 'awaken' && forms.length > 1)
        ? options.filter(option => option.kind === 'hero' && option.id !== 'awaken')[seed % forms.length]!
        : options[0]!;
      // `?? 0`: an unowned skill is *absent* from the record, not zero. Comparing `undefined === 0`
      // reported `unlocks: 0` for 600 runs in the first pass of this harness - the same trap
      // `D20` hit with `!(undefined > 0)` in the cooldown fixture.
      const level = (pick.kind === 'active' ? state.skills[pick.id] : pick.kind === 'passive' ? state.passives[pick.id] : undefined) ?? 0;
      const unlock = level === 0;
      offers.push({ level: state.level, eligible: eligibleCount, shown: options.length, kinds: options.map(option => option.kind), picked: `${pick.kind}:${pick.id}`, unlock, special });
      if (!core.choose(state.choice!.token, pick.kind, pick.id)) { illegal.push(`level ${state.level}: choose refused ${pick.kind}:${pick.id}`); break; }
      continue;
    }
    if (state.status === 'encounter') {
      if (!core.resolveEvent(state.encounter.offer!.token, 'skip', { affordable: true, gold: 6000 })) break;
      continue;
    }
    if (state.status === 'chest') {
      const options = state.chests.offer!.options;
      for (const option of options) {
        if (option.type === 'evo' && !reachable.has(option.id!)) illegal.push(`chest ${state.time.toFixed(1)}: evo ${option.id} outside the reachable subset`);
        if (option.type === 'fusion' && !reachableFusions.has(option.id!)) illegal.push(`chest ${state.time.toFixed(1)}: fusion ${option.id} outside the reachable subset`);
      }
      const index = 0;
      chests.push({ at: Math.round(state.time * 10) / 10, options: options.map(option => `${option.type}${option.id ? `:${option.id}` : ''}`), index });
      if (!core.pickChest(state.chests.offer!.token, index)) break;
      continue;
    }
    if (state.status === 'boss-loot') {
      const uid = state.boss.offer?.[0]?.uid;
      if (!(uid ? core.pickBossLoot(uid) : core.pickChapterLoot())) break;
      continue;
    }
    const due = state.chests.rewards.find(reward => reward.state === 'ready');
    if (due && core.claimChest(due.index)) continue;
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
  }
  const end = core.snapshot();
  const formId = end.journey?.formId ?? undefined;
  const core_ = formId ? chapterCoreSkills[formId as keyof typeof chapterCoreSkills] : undefined;
  const skills = Object.fromEntries(Object.entries(end.skills).map(([id, level]) => [id, level || 0]));
  const passives = Object.fromEntries(Object.entries(end.passives).map(([id, level]) => [id, level || 0]));
  const result: Sample = {
    hero, seed, seconds: Math.round(end.time * 10) / 10, endReason: end.endReason,
    level: end.level, skills, passives,
    evolved: [...end.chests.evolved], fused: [...end.chests.fused],
    formId, awakened: end.journey?.rank === 2,
    routes: Object.values(end.journey?.routes ?? {}).filter((id): id is NonNullable<typeof id> => id !== undefined).map(String),
    core: core_, coreLevel: core_ ? (end.skills[core_] || 0) : 0,
    maxActive: Math.max(0, ...Object.values(end.skills).map(level => level || 0)),
    ownedActives: Object.values(end.skills).filter(level => (level || 0) > 0).length,
    ownedPassives: Object.values(end.passives).filter(level => (level || 0) > 0).length,
    offers, chests, illegal,
  };
  core.destroy();
  return result;
}

/** Memoised per hero: the report test reads what the three per-hero tests already measured. */
const cache = new Map<string, Sample[]>();
function samples(hero: string): Sample[] {
  let value = cache.get(hero);
  if (!value) { value = SEEDS.map(seed => run(hero, seed)); cache.set(hero, value); }
  return value;
}
const ratio = (part: number, whole: number): number => whole > 0 ? Math.round(part / whole * 10000) / 10000 : 0;
function median(values: readonly number[]): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}
function tally(values: readonly string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const value of values) out[value] = (out[value] ?? 0) + 1;
  return Object.fromEntries(Object.entries(out).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}
function summarise(hero: string) {
  const runs = samples(hero);
  const offers = runs.flatMap(sample => sample.offers);
  const normal = offers.filter(offer => !offer.special);
  const chests = runs.flatMap(sample => sample.chests);
  const chestOptions = chests.flatMap(chest => chest.options);
  const reached = [...new Set(runs.flatMap(sample => sample.evolved))].sort();
  const fused = [...new Set(runs.flatMap(sample => sample.fused))].sort();
  return {
    hero,
    seeds: SEEDS.length,
    forms: tally(runs.map(sample => sample.formId ?? 'none')),
    evolutionsReached: reached,
    evolutionsPerRun: Math.round(runs.reduce((sum, sample) => sum + sample.evolved.length, 0) / runs.length * 100) / 100,
    fusionsReached: fused,
    runsWithFusion: runs.filter(sample => sample.fused.length > 0).length,
    runsWithEvolution: runs.filter(sample => sample.evolved.length > 0).length,
    levelMedian: median(runs.map(sample => sample.level)),
    levelMax: Math.max(...runs.map(sample => sample.level)),
    secondsMedian: median(runs.map(sample => sample.seconds)),
    endReasons: tally(runs.map(sample => sample.endReason ?? 'still running')),
    /** Scope 2 rows. */
    awakened: runs.filter(sample => sample.awakened).length,
    awakenedRate: ratio(runs.filter(sample => sample.awakened).length, runs.length),
    coreAtThree: runs.filter(sample => sample.coreLevel >= 3).length,
    coreLevelMedian: median(runs.map(sample => sample.coreLevel)),
    maxActiveMedian: median(runs.map(sample => sample.maxActive)),
    routesPerRun: Math.round(runs.reduce((sum, sample) => sum + sample.routes.length, 0) / runs.length * 100) / 100,
    routeIds: tally(runs.flatMap(sample => sample.routes)),
    slotSaturated: runs.filter(sample => sample.ownedActives >= 6).length,
    ownedActivesMedian: median(runs.map(sample => sample.ownedActives)),
    ownedPassivesMedian: median(runs.map(sample => sample.ownedPassives)),
    levelUps: normal.length,
    eligibleMedian: median(normal.map(offer => offer.eligible)),
    eligibleMax: normal.length ? Math.max(...normal.map(offer => offer.eligible)) : 0,
    shownMedian: median(normal.map(offer => offer.shown)),
    hiddenShare: ratio(normal.reduce((sum, offer) => sum + Math.max(0, offer.eligible - offer.shown), 0), normal.reduce((sum, offer) => sum + Math.max(0, offer.eligible), 0)),
    /** `1 - hiddenShare`: the chance a given eligible option is on screen at a level-up. */
    visibility: ratio(normal.reduce((sum, offer) => sum + offer.shown, 0), normal.reduce((sum, offer) => sum + offer.eligible, 0)),
    unlocks: normal.filter(offer => offer.unlock).length,
    unlockShare: ratio(normal.filter(offer => offer.unlock).length, normal.length),
    pickTally: tally(normal.map(offer => offer.picked)),
    chests: chests.length,
    chestEvoOffers: chestOptions.filter(option => option.startsWith('evo')).length,
    chestFusionOffers: chestOptions.filter(option => option.startsWith('fusion')).length,
    chestFiller: chestOptions.filter(option => option.startsWith('upgrade') || option.startsWith('gear')).length,
    illegal: runs.flatMap(sample => sample.illegal),
  };
}

describe('R2-D build report', () => {
  it('Scope 0: re-derives the reachable subset and shows it is hero-invariant', () => {
    const rows = evolutions.length;
    const perHero = HEROES.map(hero => {
      const build = evolutionBuild(hero);
      const active = new Set<string>(build.active), passive = new Set<string>(build.passive);
      const ids = new Set(evolutions.filter(([, [, skill, ps]]) => active.has(skill!) && passive.has(ps!)).map(([id]) => id));
      return { hero, ids: [...ids].sort(), actives: build.active.length, passives: build.passive.length };
    });
    // TASK.md says 20 / 9 / 4; this file counts rather than trusts, and pins the count so a data
    // change (a new row, a new active skill) has to move the number on purpose.
    expect(rows).toBe(20);
    expect(reachable.size).toBe(9);
    expect(reachableFusions.size).toBe(4);
    for (const hero of perHero) {
      expect(hero.ids, `${hero.hero}'s reachable rows are the structural set`).toEqual([...reachable].sort());
      expect(hero.actives).toBe(10);
      expect(hero.passives).toBe(11);
    }
    // The pool is identical in membership and differs only in *order* and in which passive starts owned.
    const pools = new Set(perHero.map(hero => evolutionBuild(hero.hero).active.join(',')));
    expect(pools.size, 'the actives pool is one list, reordered per hero').toBeGreaterThan(1);
    console.log('[R2-D scope 0]', JSON.stringify({ rows, reachable: [...reachable].sort(), fusions: [...reachableFusions].sort(), perHero: perHero.map(hero => ({ hero: hero.hero, first: evolutionBuild(hero.hero).active.slice(0, 2) })) }));
  });

  for (const hero of HEROES) {
    it(`${hero}: 200 fixed seeds`, () => {
      const runs = samples(hero);
      expect(runs).toHaveLength(200);
      const summary = summarise(hero);
      console.log(`[R2-D ${hero}]`, JSON.stringify({
        forms: summary.forms, evolutionsReached: summary.evolutionsReached, fusions: summary.fusionsReached,
        runsWithFusion: summary.runsWithFusion, levelMedian: summary.levelMedian, awakened: summary.awakened,
        coreAtThree: summary.coreAtThree, routes: summary.routeIds, slotSaturated: summary.slotSaturated,
        levelUps: summary.levelUps, eligibleMedian: summary.eligibleMedian, eligibleMax: summary.eligibleMax,
        hiddenShare: summary.hiddenShare, visibility: summary.visibility, unlocks: summary.unlocks,
        unlockShare: summary.unlockShare, pickTally: summary.pickTally, chests: summary.chests, chestEvoOffers: summary.chestEvoOffers,
        chestFusionOffers: summary.chestFusionOffers, illegal: summary.illegal.slice(0, 5),
      }));
      // "Invalid candidate = 0", judged against the reachable subset (TASK.md Scope 2).
      expect(summary.illegal, 'no candidate outside the reachable subset was ever offered').toEqual([]);
      expect(summary.levelUps, 'the 200 seeds produced level-ups to measure').toBeGreaterThan(200);
      expect(summary.chests, 'and chests').toBeGreaterThan(200);
      // Scope 1: every reachable row is reached by *some* run of *every* hero. Structural
      // reachability is hero-invariant (Scope 0); this is the half that had to be measured.
      expect(summary.evolutionsReached, `${hero} reaches every reachable evolution`).toEqual([...reachable].sort());
      // Scope 1, the per-hero column: the fusion *set* is partitioned by hero, not shared.
      expect(summary.fusionsReached, `${hero}'s fusion set`).toEqual(REACHED_FUSIONS[hero]!);
      // Scope 2: the six-slot cap never binds - growth stops at four actives, which is the
      // front-option pin doing the limiting (`validOptions` unshifts the first owned active).
      expect(summary.slotSaturated, 'no run fills the six active slots').toBe(0);
      expect(summary.ownedActivesMedian).toBe(4);
      // Scope 2: the route the run takes first is the first row in `skillRoutes` whose skill the
      // hero already owns - so it is the same route in 200 of 200 runs.
      expect(summary.routeIds[FORCED_ROUTE[hero]!], 'the starter skill route is forced').toBe(200);
      // Scope 2, the G7 deviation: a given eligible level-up option is on screen in ~15% of offers,
      // and ~23% of picks buy a skill the run did not own. Both are bounded, not point-equal:
      // they are the shape of the pool, and a seed-set change may move them a little.
      expect(summary.visibility).toBeGreaterThan(.1);
      expect(summary.visibility).toBeLessThan(.2);
      expect(summary.unlockShare).toBeGreaterThan(.2);
      expect(summary.unlockShare).toBeLessThan(.3);
    }, 900_000);
  }

  it('writes the report', () => {
    const heroes = HEROES.map(hero => summarise(hero));
    const report = {
      slice: 'R2-D',
      base: 'R2-B01..08 (D20)',
      harness: 'src/core/buildReport.test.ts',
      frameHz: 60,
      viewport: { width: 390, height: 844 },
      rules: 'threat-v2',
      journey: 'evolution',
      seeds: SEEDS,
      seedsPerHero: SEEDS.length,
      policy: 'front option at every level-up; form = options[seed % options.length] (declared steering, see the file header)',
      structural: {
        evolutionRows: evolutions.length,
        reachableEvolutions: [...reachable].sort(),
        reachableFusions: [...reachableFusions].sort(),
        note: 'membership is hero-invariant: evolutionBuild(hero) reorders the same 10 actives and 11 passives',
      },
      heroes,
      /** Scope 3: the numbers the G7 ruling rests on, computed here rather than quoted. */
      g7: {
        question: 'D4: a run still fuses about once; the chest pool is not the bottleneck, the level-up pool is',
        fusionsPerRun: ratio(heroes.reduce((sum, hero) => sum + hero.runsWithFusion, 0), heroes.reduce((sum, hero) => sum + hero.seeds, 0)),
        byHero: Object.fromEntries(heroes.map(hero => [hero.hero, ratio(hero.runsWithFusion, hero.seeds)])),
        chestsPerRun: Math.round(heroes.reduce((sum, hero) => sum + hero.chests, 0) / heroes.reduce((sum, hero) => sum + hero.seeds, 0) * 100) / 100,
        fusionOffersInChests: heroes.reduce((sum, hero) => sum + hero.chestFusionOffers, 0),
        /** A given eligible level-up option is on screen in this share of offers. */
        visibility: Math.round(heroes.reduce((sum, hero) => sum + hero.visibility, 0) / heroes.length * 10000) / 10000,
        unlockShare: Math.round(heroes.reduce((sum, hero) => sum + hero.unlockShare, 0) / heroes.length * 10000) / 10000,
        ownedActivesMedian: heroes.map(hero => hero.ownedActivesMedian),
        slotSaturated: heroes.reduce((sum, hero) => sum + hero.slotSaturated, 0),
        levelMedian: heroes.map(hero => hero.levelMedian),
        ruling: 'B (display the recipe) belongs to R3-P01; A (weight the level-up pool) is priced in DECISIONS.md D21 and not built',
      },
      totals: {
        runs: heroes.reduce((sum, hero) => sum + hero.seeds, 0),
        illegal: heroes.reduce((sum, hero) => sum + hero.illegal.length, 0),
        runsWithFusion: heroes.reduce((sum, hero) => sum + hero.runsWithFusion, 0),
        runsWithEvolution: heroes.reduce((sum, hero) => sum + hero.runsWithEvolution, 0),
        levelUps: heroes.reduce((sum, hero) => sum + hero.levelUps, 0),
        chests: heroes.reduce((sum, hero) => sum + hero.chests, 0),
      },
    };
    const dir = resolve(EVIDENCE_ROOT, 'R2-D');
    mkdirSync(dir, { recursive: true });
    writeFileSync(resolve(dir, 'build-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    expect(report.totals.runs).toBe(600);
  }, 60_000);
});
