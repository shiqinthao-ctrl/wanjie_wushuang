import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GameCore } from './GameCore';
import type { CombatSimulation } from './CombatSimulation';
import { insideTelegraph } from './FirstBoss';
import type { Telegraph } from './FirstBoss';
import { threatV2 } from './threatModel';
import { difficultyFor, firstStage } from './spawnRules';
import { calculateStartup } from './growth';
import { seededRandom } from '../chapter/growth';
import fresh from '../data/freshSave.json';
import firstBoss from '../data/firstBoss.json';

const FRAME = 1 / 60;
/**
 * The design denominator: `calculateStartup`'s max HP for the fixed instrument, i.e. 763 - the
 * number GDD §4's "4.2%" was measured against, and the one a per-hit *target* has to be stated in.
 * Every run's own `maxHp` can be lower, because `FirstStageMap`'s altar trades 10% of it for 22%
 * attack and the browser arm presses `f` on whatever is nearest. Fractions that describe a single
 * hit use this; fractions that describe observed hits use the hit's own denominator.
 */
const STARTUP_MAX_HP = Math.round(calculateStartup(structuredClone(fresh)).player.maxHp);
/**
 * Output is isolated per slice - and the *directory* names the tree the numbers were measured on,
 * while each report's own `slice` field names the slice that *owns the question*. R1g-12 re-ran
 * this harness on its recalibrated horde table and moved every floor in it, so all three artifacts
 * moved here from `evidence/R1g-9/`, `evidence/R1g-10/` and `evidence/R1g-11/`; those directories
 * now carry a pointer. This file owns G4.
 */
const EVIDENCE = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R1g-12');
/** R1g-10 owns the cadence lever. Same directory, different artifact - see the note above. */
const CADENCE_EVIDENCE = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R1g-12');
/** R1g-11 owns the `hud` arm (Scope 0) and the landed numbers (Scope 1). Same directory. */
const HUD_EVIDENCE = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R1g-12');
/** R1g-5's canonical set, so every fraction here is comparable with `boss-report.json`. */
const SEEDS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33];
/**
 * `growthPacing.test.ts`'s smaller set, used only for the sweep's intermediate points. The two
 * decision points (the shipped value and the multiple G4 needs) are read on all 33, because at
 * n=11 a 21pp win-rate difference between two instruments was measured to be pure quantile noise.
 */
const SENSITIVITY_SEEDS = [1, 2, 3, 5, 7, 11, 13, 15, 21, 25, 33];
/** GDD `docs/design/GDD-可玩性提升设计-v2.md` §4. */
const TARGET = { skillFraction: .15, floor: .25, window: { min: 60, max: 90 } } as const;
/**
 * GDD §5 P0-4's own per-shape bases: `strikeDamage(base) = maxHp * base * difficultyFor().dmg`.
 * That is the mechanism the design document prescribes, and it is **not** a multiplier on
 * `bossDamage` - which is this slice's whole finding. Recorded here so the alternative is
 * priced in the same units as the shipped chain rather than left as prose.
 */
const GDD_BASE = { circle: .18, line: .22, cone: .26 } as const;

type Journey = 'classic' | 'evolution';
type Policy = 'browser' | 'dodge' | 'hud';
type Shape = 'circle' | 'line' | 'cone' | 'contact';
const SHAPES: readonly Shape[] = ['circle', 'line', 'cone', 'contact'];
/** `FirstBoss.updateAI`'s per-shape multipliers on `13 + phase * 4`. */
const SHAPE_FACTOR = { circle: 1.25, line: 1.15, cone: 1.22 } as const;
/**
 * `firstBoss.json` `bosses.B001.mechanics.skills`: shape name -> skill name. The rules read it the
 * same way. Addressed by id since D27 - the file holds a row per Boss, and `rawOf` below is now a
 * check that B001's row still equals the shipped chain it was measured against.
 */
const SKILL_SHAPE = Object.fromEntries((firstBoss.bosses.B001.mechanics.skills as unknown as readonly (readonly [string, string])[])
  .map(([type, name]) => [name, type as 'circle' | 'line' | 'cone'])) as Readonly<Record<string, 'circle' | 'line' | 'cone'>>;

/** Pre-mitigation damage `FirstBoss` hands to `sim.hurt`, per the shipped chain. */
function rawOf(shape: Shape, phase: number, diffDmg: number, bossDamage: number, skill = 1, contact = 1): number {
  const scale = bossDamage * (shape === 'contact' ? contact : skill);
  if (shape === 'contact') return (11 + phase * 3) * diffDmg * scale;
  return (13 + phase * 4) * SHAPE_FACTOR[shape] * diffDmg * scale;
}
/** `incomingHit`'s threat-v2 path: soft-capped defence, no flat term, no global i-frame. */
const mitigate = (raw: number, def: number, softCap: number): number => raw * (1 - def / (def + softCap));
/**
 * The phase a hit's `raw` was computed at, read back out of the damage. `FirstBoss` bakes the
 * phase in at *cast* time, so a warning that resolves after the Boss crosses 70% or 35% carries
 * the old phase - measured, 2% of hits do. Validating the chain against the Boss's *current*
 * phase therefore fails on exactly those hits, which is how this was found; the damage itself is
 * the only witness to which phase it was built from.
 */
function phaseOfRaw(shape: Shape, raw: number, diffDmg: number, bossDamage: number, skill = 1, contact = 1): number {
  if (shape === 'contact') return (raw / (diffDmg * bossDamage * contact) - 11) / 3;
  return (raw / (SHAPE_FACTOR[shape] * diffDmg * bossDamage * skill) - 13) / 4;
}

interface Hit {
  readonly shape: Shape;
  readonly source: string;
  /** The Boss's phase when the hit landed. Informational - see `phaseFromRaw`. */
  readonly phaseAtHit: number;
  /** The phase the damage was built from, i.e. the phase at cast time. */
  readonly phaseFromRaw: number;
  /** What `hurt` received: pre-mitigation, post-`bossDamage`. */
  readonly raw: number;
  /** HP actually lost, i.e. after `incomingHit`. Zero when a shield or an i-frame ate it. */
  readonly lost: number;
  readonly maxHp: number;
  readonly hpBefore: number;
  /** `hpBefore / maxHp`, so a hit taken below 35% is identifiable (`lowHpDR`'s gate). */
  readonly hpRatio: number;
  readonly shielded: boolean;
  readonly invulnerable: boolean;
}

/**
 * R2-F-CADENCE: one Boss cast, as the player experiences it. Opt-in - `run(..., log: true)` - so the
 * four rolling reports keep their exact schema when the flag is off. `JSON.stringify` drops an
 * `undefined` key, so an un-logged run still serialises byte-identically to before this slice.
 */
interface CastEvent {
  /** Seconds since the Boss spawned (`firstStage.bossAt`), so the cadence is readable on its own. */
  readonly t: number;
  readonly phase: number;
  /** `boss.next` at cast time - the 首领招式 cue the `hud` arm reads. */
  readonly cue: string;
  /** The shape the cue names, via `SKILL_SHAPE`. */
  readonly shape: string;
  /** The telegraph's own `life`: the window the player has to leave it. */
  readonly life: number;
  /** The player's HP as a fraction of max, at the moment the cue appears. */
  readonly hpFrac: number;
  /** Whether the 闪避 button was off cooldown. A window the player cannot act in is not one. */
  readonly dodgeReady: boolean;
  /** Live telegraphs at this cast, this one included. `> 1` means two shapes are on screen. */
  readonly live: number;
}

/**
 * R2-F-CIRCLE: one `circle` telegraph (`震地斩`), from cast to resolve. Opt-in exactly like
 * `CastEvent`, so the rolling reports keep their schema when the flag is off.
 *
 * The move is the only one whose escape is "leave the ring you are standing in the middle of", so
 * the numbers that matter are geometric: where the ring's centre came from, how far the player had
 * to travel to be outside it, and whether they made it. `distAtCast` is carried rather than assumed
 * - the whole coverage question in the queue rests on a claim about it.
 */
interface CircleEvent {
  /** Seconds since the Boss spawned. */
  readonly t: number;
  readonly phase: number;
  /** The telegraph's radius: `phase === 3 ? 86 : 70` (`FirstBoss.ts:111`). */
  readonly r: number;
  /** The player's distance from the ring's centre **at cast time**. */
  readonly distAtCast: number;
  /** The player's distance from the Boss at cast time - the cell's standoff. */
  readonly standoff: number;
  /** How far the player travelled between the cast and the resolve. */
  readonly travel: number;
  /** Whether the player was still inside the ring when it fired. */
  readonly landed: boolean;
  /** The window the player had to leave it. */
  readonly life: number;
  /** The player's HP as a fraction of max, at cast time. */
  readonly hpFrac: number;
}

interface ThreatRun {
  readonly journey: Journey;
  readonly seed: number;
  readonly policy: Policy;
  readonly bossDamage: number;
  /** R1g-10's lever, echoed from the production fields the run executed under. */
  readonly castCdMultiplier: number;
  readonly skillScale: number;
  /** Scope 2's re-sweep: multiplier on `threatV2.bossHp` for both journeys. */
  readonly hpScale: number;
  /** R1g-11: `threatV2.bossContactDamage` the run executed under. 1 unless swept. */
  readonly contactScale: number;
  readonly endReason: string | undefined;
  readonly win: boolean;
  readonly seconds: number;
  readonly maxHp: number;
  readonly def: number;
  readonly diffDmg: number;
  readonly bossSpawnAt: number;
  readonly bossKillAt: number;
  readonly ttk: number;
  readonly minHpRatio: number;
  /** Telegraphs the Boss cast. `FirstBoss.updateAI` calls `feedback('boss-warning')` once per cast. */
  readonly casts: number;
  /** Telegraphs that resolved with the player inside them. */
  readonly landed: number;
  /** `casts - landed - unresolvedAtEnd`: warnings the player was outside of when they resolved. */
  readonly avoided: number;
  readonly unresolvedAtEnd: number;
  readonly invulnerableHits: number;
  readonly shieldedHits: number;
  /** Hits whose warning was cast before a phase change and resolved after it. */
  readonly crossedPhase: number;
  /**
   * `hud` arm only: fresh `首领招式` instructions it saw. `casts` is the number the Boss actually
   * made, so `hudCues === casts` is the assertion that a text-only player missed nothing - which
   * holds only because consecutive casts never repeat a suffix (see `HUD_CUE`).
   */
  readonly hudCues: number;
  readonly hits: readonly Hit[];
  /** B001 sources outside the shape table. Empty by construction; carried so it is asserted. */
  readonly unclassified: readonly string[];
  readonly lostToBoss: number;
  readonly lostToHorde: number;
  readonly lostTotal: number;
  /** Boss moves over all incoming damage - the aggregate version of what G4 asks per hit. */
  readonly bossShare: number;
  /** Body contact's share of the Boss's own damage. It rides the same `bossDamage` knob. */
  readonly contactShareOfBoss: number;
  /** The single largest incoming source, and its share. `damageTakenBy` is the shipped telemetry. */
  readonly topSource: string;
  readonly topSourceShare: number;
  /** Distance the player moved between a warning being cast and it resolving, escaped vs landed. */
  readonly travelEscaped: readonly number[];
  readonly travelLanded: readonly number[];
  /** R2-F-CADENCE, opt-in: the cast timeline. Absent unless `run(..., log: true)`. */
  readonly castLog?: readonly CastEvent[];
  /** R2-F-CIRCLE, opt-in: every `circle` telegraph, cast to resolve. Same flag. */
  readonly circleLog?: readonly CircleEvent[];
}

/**
 * Where to run when a live warning contains the player. Each shape is exited the way its
 * geometry makes cheapest, which is what a player reading the warning does:
 *
 * - `circle` is centred on the player's position at cast time, so "away from the centre" is
 *   degenerate; fleeing the Boss both leaves the ring and breaks body contact.
 * - `line` is 44-54px wide, so the exit is perpendicular to it.
 * - `cone` is a 99-130 degree wedge of radius 255-305, so the exit is sideways off its axis.
 */
function escapeDirection(sim: CombatSimulation, warning: Telegraph): { x: number; y: number } {
  const p = sim.player;
  if (warning.type === 'circle') {
    const dx = p.x - warning.x, dy = p.y - warning.y;
    if (Math.hypot(dx, dy) > 8) return { x: dx, y: dy };
    const boss = sim.boss;
    if (boss && Math.hypot(p.x - boss.x, p.y - boss.y) > 8) return { x: p.x - boss.x, y: p.y - boss.y };
    return { x: 1, y: 0 };
  }
  if (warning.type === 'line') {
    const vx = warning.x2 - warning.x, vy = warning.y2 - warning.y;
    const side = (p.x - warning.x) * -vy + (p.y - warning.y) * vx;
    const sign = side >= 0 ? 1 : -1;
    return { x: -vy * sign, y: vx * sign };
  }
  const toPlayer = Math.atan2(p.y - warning.y, p.x - warning.x);
  const delta = Math.atan2(Math.sin(toPlayer - warning.angle), Math.cos(toPlayer - warning.angle));
  const exit = warning.angle + (delta >= 0 ? 1 : -1) * Math.PI / 2;
  return { x: Math.cos(exit), y: Math.sin(exit) };
}

/**
 * `FirstBoss` writes a player-facing instruction into `boss.next` at cast time, and `BattleView`
 * renders it under `aria-label="首领招式"`: `<name> · 离开红圈` / `横向闪避` / `绕至侧后`. The three
 * suffixes are one per shape and - because `skillIndex` advances every cast and the shape index is
 * `(skillIndex + phase - 1) % 3` - **consecutive casts never repeat a suffix**, which is what makes
 * "the HUD changed" a sound trigger. That claim is asserted against `casts`, not assumed.
 */
const HUD_CUE = ['离开红圈', '横向闪避', '绕至侧后'] as const;
/** What the `hud` arm remembers between frames: the last instruction read, and the reaction window. */
interface HudSight { next: string; until: number }
/**
 * The `hud` arm: the same player, restricted to what the shipped UI puts on screen - the
 * `首领招式` readout, the hero's and the Boss' rendered positions, and the 闪避 button. It never
 * touches `telegraphs`, which is the whole point: `tests/settlement.spec.ts` can run this rule
 * against real pixels and a real button, so what this arm measures is what the browser suite would
 * measure. It is the twin, not a third instrument.
 *
 * It differs from `dodge` in two ways that are both *losses* of information: it learns about a move
 * from a text label rather than from the shape's geometry, and it reacts for a fixed window instead
 * of knowing exactly when the shape is gone. If it reads worse than `dodge`, that is the price of
 * the real UI and it is the number the balance has to be shipped against.
 */
function hudEscape(sim: CombatSimulation, sight: HudSight): { x: number; y: number; fresh: boolean } | undefined {
  const boss = sim.boss; if (!boss) return undefined;
  const next = boss.next;
  let fresh = false;
  if (next !== sight.next) {
    sight.next = next;
    fresh = HUD_CUE.some(cue => next.includes(cue));
    // The instruction is shown for exactly as long as the shape it names is on the ground:
    // `max(.55, .95 - phase * .08) * telegraphScale`. A player does not read that number, but the
    // shape is visible for it, so reacting for the window is what watching the shape means. `'准备攻击'`
    // carries no suffix, so the idle readout never arms a reaction.
    if (fresh) sight.until = sim.time + Math.max(.55, .95 - boss.phase * .08) * firstStage.telegraphScale;
  }
  if (sim.time >= sight.until) return undefined;
  const dx = sim.player.x - boss.x, dy = sim.player.y - boss.y, gap = Math.hypot(dx, dy) || 1;
  // `离开红圈` is the circle, which `FirstBoss` centres on the *player* at cast time: every bearing
  // leaves it, and the Boss bearing is the one that also breaks body contact. The charge and the
  // sweep are both centred on the Boss->player ray, so their exit is perpendicular to it - either
  // sign, since both shapes are symmetric about that ray and the player is standing on it.
  return next.includes('离开红圈') ? { x: dx / gap, y: dy / gap, fresh } : { x: -dy / gap, y: dx / gap, fresh };
}

/**
 * Rules-only driver for G4. Deliberately the same player as the declared fixed instrument
 * (`manualDamage.test.ts`'s `browser`: `options[0]`, one press per step, the `f` key, a 65px
 * standoff), plus one extra arm:
 *
 * - `browser`: exactly that instrument. Its movement rule has no warning term at all - `core.move`
 *   receives either `(0,0)` or the bearing to the Boss - and `tests/settlement.spec.ts` has no
 *   telegraph reference either (grep-verified). It therefore cannot dodge; any warning it leaves,
 *   it leaves by walking.
 * - `dodge`: the same player, except it leaves any live warning it is inside. Movement only - the
 *   dodge button's 0.35s i-frame (4.5s cd) is never pressed, so this arm is a **lower bound** on a
 *   competent player's avoidance, not a ceiling.
 *
 * `bossDamage` is the production knob, swapped on `sim.threat` the way `manualDamage.test.ts`
 * swaps `bossHp`: `FirstBoss.damageScale` reads it per hit, so the run measures the real rule at
 * that setting rather than a counterfactual.
 */
/**
 * R1g-10's lever, in the only two units that describe it: how much less often the Boss casts
 * (`threatV2.bossCastCooldown`) and how much bigger each move is (`threatV2.bossSkillDamage`). The
 * diagonal `castCd = skill = k` is "the same aggregate paid in k times fewer moves" - D7's path A.
 * `skill` deliberately leaves `bossContactDamage` alone: R1g-10 split that knob precisely so the
 * diagonal could be measured without body contact riding it.
 *
 * Both are **production fields**, so a row is a reading of the shipped rule rather than a harness
 * counterfactual. That also makes the wiring testable: the observed per-hit fraction only tracks the
 * design value if `bossSkillDamage` is actually read, and body contact only stays flat if
 * `bossContactDamage` is not.
 */
interface Cadence { readonly castCd: number; readonly skill: number; readonly hp: number; readonly contact?: number; readonly reference?: boolean }
/** No overrides at all: the run executes `threatV2.json` exactly as it ships. */
const NO_CADENCE: Cadence = { castCd: 1, skill: 1, hp: 1 };
/**
 * The configuration R1g-9 and R1g-10 were measured on, named explicitly. R1g-11 landed a cadence
 * into `threatV2.json`, so "the shipped value" now means something else and every claim those two
 * slices wrote - "no move is legible", "the ceiling is 1.5x", "the diagonal goes 35 casts -> 2" -
 * is a claim about *this* table, not about the current one. Pinning it keeps them reproducible
 * instead of quietly re-baselining them; the new shipped reading is R1g-11's own test.
 */
const REFERENCE: Cadence = { castCd: 1, skill: 1, hp: 1, contact: 1, reference: true };

function run(journey: Journey, seed: number, bossDamage: number, policy: Policy, cadence: Cadence = NO_CADENCE, log = false): ThreatRun {
  const { castCd: castCdMultiplier, skill: skillScale, hp: hpScale, contact: contactSetting } = cadence;
  const core = new GameCore(structuredClone(fresh), seededRandom(seed), journey, undefined, 'threat-v2');
  const sim = (core as unknown as { combat: CombatSimulation }).combat;
  if (bossDamage !== threatV2.bossDamage) (sim as unknown as { threat: object }).threat = { ...sim.threat!, bossDamage };
  // Order matters, and it is: pinned base first, then the arguments *relative to it*.
  //
  // R1g-11's table ships the cadence (`bossCastCooldown`/`bossSkillDamage` 14.31, `bossContactDamage`
  // 0.8), so `castCd`/`skill`/`hp` are multipliers on whatever base is in place rather than absolute
  // assignments - that is what lets one `cadence(k, k)` express "G4's multiple" against either the
  // shipped table or the reference. `contact` is absolute, because "undo the shipped 0.8" would be
  // `1 / 0.8`, which is not exact in binary.
  //
  // The pinned base is absolute for the same reason: `19.95 / 1.14` is not exactly `17.5`, and a
  // reference that is off by an ulp is not a reference. Applying it *before* the multipliers is what
  // keeps the 2x/4x/8x rows of the cadence curve from silently collapsing onto 1x.
  if (cadence.reference) (sim as unknown as { threat: object }).threat = { ...sim.threat!, bossCastCooldown: 1, bossSkillDamage: 1, bossContactDamage: 1, bossHp: { classic: 17.5, evolution: 47.5 } };
  const live = () => sim.threat as unknown as { bossCastCooldown: number; bossSkillDamage: number; bossHp: { classic: number; evolution: number } };
  if (castCdMultiplier !== 1 || skillScale !== 1) (sim as unknown as { threat: object }).threat = { ...sim.threat!, bossCastCooldown: live().bossCastCooldown * castCdMultiplier, bossSkillDamage: live().bossSkillDamage * skillScale };
  // Scope 2's re-sweep: concentrating the same aggregate shortens the fight (fewer warnings to leave
  // means more time on the Boss), so the HP budget is what puts G3's 60s floor back. Both journeys
  // scale together, the way the shipped table is written.
  if (hpScale !== 1) (sim as unknown as { threat: object }).threat = { ...sim.threat!, bossHp: { classic: live().bossHp.classic * hpScale, evolution: live().bossHp.evolution * hpScale } };
  // R1g-11: `bossContactDamage` is R1g-10's reserve lever, held at 1 through the whole cadence
  // sweep so the diagonal could be read without body contact riding it. Once the cadence lands,
  // contact is all the Boss has left for a player who dodges (every move is avoided), so it is the
  // lever that buys G2's floor back without moving `bossSkillDamage` off G4's 15%. `undefined` means
  // "leave the table alone", which is what makes the sweep able to name an absolute 1.
  if (contactSetting !== undefined) (sim as unknown as { threat: object }).threat = { ...sim.threat!, bossContactDamage: contactSetting };
  const def = sim.context.baseDef, diffDmg = difficultyFor((sim as unknown as { difficulty: string }).difficulty).dmg;
  // Read back from the production field the run is actually executing under, never from the cadence
  // argument: a pinned reference overrides it, and R1g-11's landed table sets it without any cadence
  // argument at all. Reading the argument instead is how this harness reported `phase 57.57` - the
  // damage carried the shipped 14.31 while the reverse-solve divided by 1.
  const contactScale = (sim.threat as { bossContactDamage?: number } | undefined)?.bossContactDamage ?? 1;
  const effectiveSkill = (sim.threat as { bossSkillDamage?: number } | undefined)?.bossSkillDamage ?? 1;

  const hits: Hit[] = [];
  /** B001 sources the shape table does not know. Must stay empty - see the first test. */
  const unclassified = new Set<string>();
  let invulnerableHits = 0, shieldedHits = 0, casts = 0, landed = 0, crossedPhase = 0, hudCues = 0;
  let lostToBoss = 0, lostToHorde = 0;
  const originalHurt = sim.hurt.bind(sim);
  sim.hurt = (damage: number, source = 'unknown') => {
    const hpBefore = Math.max(0, sim.player.hp), maxHp = sim.player.maxHp, shield = sim.player.shield, inv = sim.player.inv;
    const phaseAtHit = sim.boss?.phase ?? 0;
    originalHurt(damage, source);
    const lost = Math.max(0, hpBefore - Math.max(0, sim.player.hp));
    // The partition is total and closed on purpose. The first version of this harness pushed
    // *every* source into `hits` and let `SKILL_SHAPE[...] ?? 'contact'` swallow the horde's
    // `hostile-projectile` into the contact bucket: that inflated the contact count 7x and pinned
    // its fraction at 1 HP (the `Math.max(1, ...)` floor), i.e. it made the Boss look like it dealt
    // 220 body hits a run when it deals 35. Nothing outside B001 belongs in `hits`, and anything
    // inside it that the shape table does not know is a harness failure, not a new bucket.
    if (!source.startsWith('B001')) { lostToHorde += lost; return; }
    lostToBoss += lost;
    const shape: Shape | undefined = source === 'B001-contact' ? 'contact' : SKILL_SHAPE[source.slice(5)];
    if (!shape) unclassified.add(source);
    else if (shape !== 'contact') landed++;
    if (inv > 0) invulnerableHits++;
    if (shield > 0) shieldedHits++;
    const phaseFromRaw = phaseOfRaw(shape ?? 'contact', damage, diffDmg, bossDamage, effectiveSkill, contactScale);
    // `phaseFromRaw` comes back as a float (`11.73 / 0.69` is not exactly 17), so compare rounded
    // values. Comparing them raw counts almost every hit as a phase change, which is how this was
    // caught: the first version of this counter read 807 "cross-phase" hits out of 3301.
    if (Math.round(phaseFromRaw) !== phaseAtHit) crossedPhase++;
    hits.push({ shape: shape ?? 'contact', source, phaseAtHit, phaseFromRaw, raw: damage, lost, maxHp, hpBefore, hpRatio: maxHp > 0 ? hpBefore / maxHp : 1, shielded: shield > 0, invulnerable: inv > 0 });
  };
  // `FirstBoss.updateAI` calls `feedback('boss-warning', name)` once per cast, immediately after
  // pushing the telegraph, so the tail of the live list is the warning that was just created.
  // `feedback` is a no-op body outside chapter runs, so this counts casts and stamps each
  // warning's origin without touching the rules.
  const travelEscaped: number[] = [], travelLanded: number[] = [];
  /** R2-F-CADENCE: populated only when `log` is set, and attached only then, so it is opt-in. */
  const castLog: CastEvent[] = [];
  /** R2-F-CIRCLE: same flag, same reason. Keyed by telegraph identity so cast and resolve join. */
  const circleLog: CircleEvent[] = [];
  const circleCast = new WeakMap<object, { t: number; phase: number; r: number; distAtCast: number; standoff: number; life: number; hpFrac: number }>();
  const origins = new WeakMap<object, { x: number; y: number }>();
  const originalFeedback = sim.feedback.bind(sim);
  sim.feedback = (kind, source) => {
    if (kind === 'boss-warning') {
      casts++;
      const fresh = sim.bossEncounter.telegraphs.at(-1);
      if (fresh) origins.set(fresh, { x: sim.player.x, y: sim.player.y });
      // R2-F-CIRCLE: the ring's centre is `player.x/y` *at cast* (`FirstBoss.ts:111`), so
      // `distAtCast` is the number the queue's "90px > r = 70, so it can never hit" claim is
      // about. Measured here rather than reasoned about, because the claim compares the player's
      // distance from the **Boss** to the ring's radius, and those are not the same distance.
      if (log && fresh && fresh.type === 'circle') circleCast.set(fresh, {
        t: Math.round((sim.time - firstStage.bossAt) * 1000) / 1000,
        phase: sim.boss?.phase ?? 0,
        r: fresh.r ?? 0,
        distAtCast: Math.round(Math.hypot(sim.player.x - fresh.x, sim.player.y - fresh.y) * 1000) / 1000,
        standoff: sim.boss ? Math.round(Math.hypot(sim.player.x - sim.boss.x, sim.player.y - sim.boss.y) * 1000) / 1000 : 0,
        life: Math.round((fresh.life ?? 0) * 1000) / 1000,
        hpFrac: Math.round(Math.max(0, sim.player.hp) / Math.max(1, sim.player.maxHp) * 10000) / 10000,
      });
      if (log && sim.boss) castLog.push({
        t: Math.round((sim.time - firstStage.bossAt) * 1000) / 1000,
        phase: sim.boss.phase,
        cue: sim.boss.next,
        shape: SKILL_SHAPE[source] ?? '?',
        life: Math.round((fresh?.life ?? 0) * 1000) / 1000,
        hpFrac: Math.round(Math.max(0, sim.player.hp) / Math.max(1, sim.player.maxHp) * 10000) / 10000,
        dodgeReady: sim.player.dodgeCd <= 0,
        live: sim.bossEncounter.telegraphs.filter(warning => !warning.resolved).length,
      });
    }
    return originalFeedback(kind, source);
  };
  // Wrap the resolver so every warning is attributed at the moment it fires: did the player stand
  // in it, and how far had the player travelled since it was cast? `telegraphs` holds the live
  // objects (only `renderState()` copies), so identity is stable here.
  const encounter = sim.bossEncounter;
  const originalResolve = encounter.updateTelegraphs.bind(encounter);
  encounter.updateTelegraphs = (dt: number) => {
    const live = encounter.telegraphs.filter(warning => !warning.resolved);
    const inside = new Map(live.map(warning => [warning, insideTelegraph(sim.player, warning)]));
    const origin = new Map(live.map(warning => [warning, origins.get(warning)]));
    originalResolve(dt);
    const survivors = new Set<object>(encounter.telegraphs);
    const resolved = live.filter(warning => !survivors.has(warning));
    // R2-F-CIRCLE: recorded for every resolved ring, not just the single-warning case the travel
    // arrays below are restricted to - a ring that shares its frame with another shape still has a
    // geometry, and that geometry is the whole question.
    if (log) for (const warning of resolved) {
      if (warning.type !== 'circle') continue;
      const cast = circleCast.get(warning);
      if (!cast) continue;
      const from = origin.get(warning);
      const moved = from ? Math.hypot(sim.player.x - from.x, sim.player.y - from.y) : 0;
      circleLog.push({ ...cast, travel: Math.round(moved * 10) / 10, landed: !!inside.get(warning) });
    }
    if (resolved.length !== 1) return;
    const warning = resolved[0]!, start = origin.get(warning);
    const travel = start ? Math.hypot(sim.player.x - start.x, sim.player.y - start.y) : 0;
    (inside.get(warning) ? travelLanded : travelEscaped).push(Math.round(travel * 10) / 10);
  };
  // R1g-10's cadence lever needs no wrapper here: `bossCastCooldown` is a production field that
  // `FirstBoss` applies to every fresh `castCd` assignment, so the sweep below reads the real rule.
  // The first version of this slice did scale `castCd` from the harness, by classifying each frame
  // as untouched / decremented / freshly assigned - which worked, but could not separate a fresh
  // assignment that happened to land exactly on `before - dt`, and it could not be reused by the
  // browser suite. The wiring is instead tested from the outside, by what the runs report: casts per
  // run only fall if `bossCastCooldown` is read, the observed per-hit only tracks the design value if
  // `bossSkillDamage` is read, and body contact only stays flat if `bossContactDamage` is not.

  /** The `hud` arm's memory. Starts blank, so the Boss's spawn readout (`'准备攻击'`) arms nothing. */
  const sight: HudSight = { next: '', until: -1 };
  core.start(390, 844);
  let lastPress = -1, stalled = 0, spawnAt = 0, killAt = 0, minHpRatio = 1;
  for (let frame = 0; frame < Math.ceil(400 / FRAME); frame++) {
    const state = core.snapshot();
    if (state.status === 'ended') break;
    if (state.status === 'choosing') { if (!core.choose(state.choice!.token, state.choice!.options[0]!.kind, state.choice!.options[0]!.id) && ++stalled > 120) break; stalled = 0; continue; }
    if (state.status === 'encounter') { if (!core.resolveEvent(state.encounter.offer!.token, 'skip', { affordable: true, gold: 6000 }) && ++stalled > 120) break; stalled = 0; continue; }
    if (state.status === 'chest') { if (!core.pickChest(state.chests.offer!.token, 0) && ++stalled > 120) break; stalled = 0; continue; }
    if (state.status === 'boss-loot') { const uid = state.boss.offer?.[0]?.uid; const picked = uid ? core.pickBossLoot(uid) : core.pickChapterLoot(); if (!picked && ++stalled > 120) break; stalled = 0; continue; }
    const due = state.chests.rewards.find(reward => reward.state === 'ready');
    if (due && core.claimChest(due.index)) continue;
    if (state.map.target?.canUse && core.interact()) continue;
    const boss = state.boss.boss;
    const live = policy === 'dodge' ? core.renderState().telegraphs.find(warning => !warning.resolved && insideTelegraph(sim.player, warning)) : undefined;
    const hud = policy === 'hud' ? hudEscape(sim, sight) : undefined;
    if (live) {
      const escape = escapeDirection(sim, live);
      core.move(escape.x, escape.y);
    } else if (hud) {
      core.move(hud.x, hud.y);
      // The 闪避 button is on screen (`aria-label="闪避"`, Space on desktop, 0.35s i-frame, 4.5s cd,
      // a ~51px dash) and the declared fixed instrument never presses it. A player does. The dash is
      // what buys the distance; the i-frame is spent long before the shape resolves, which is why
      // this arm is still a floor rather than a ceiling.
      // Whether the dash actually fires is the 4.5s cooldown's business, not the player's. At the
      // *pre-R1g-10* cadence (`bossCastCooldown` 1, so `2.62s` between casts) some cues arrived with
      // the button still grey; at the shipped 14.31 the gap is `2.62 * 14.31` = 37.5s, so it never
      // is - measured in `R2-F-CADENCE`'s timeline, `blockedByCooldown` is 0 even at 0.25x.
      if (hud.fresh) { core.action('dodge'); hudCues++; }
    } else if (boss) {
      const dx = boss.x - sim.player.x, dy = boss.y - sim.player.y, gap = Math.hypot(dx, dy);
      if (gap < 65) core.move(0, 0); else core.move(dx, dy);
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
    const ratio = now.maxHp > 0 ? now.hp / now.maxHp : 1;
    if (ratio < minHpRatio) minHpRatio = ratio;
  }
  const end = core.snapshot();
  const unresolvedAtEnd = encounter.telegraphs.filter(warning => !warning.resolved).length;
  const lostTotal = lostToBoss + lostToHorde;
  const contactLost = hits.filter(hit => hit.shape === 'contact').reduce((sum, hit) => sum + hit.lost, 0);
  // `damageTakenBy` is the game's own telemetry (`GameCore.captureFinal` writes it into the run
  // report), so naming the top incoming source is reading shipped data, not adding a channel.
  const top = Object.entries(sim.damageTakenBy).sort((a, b) => b[1] - a[1])[0];
  const result: ThreatRun = {
    journey, seed, policy, bossDamage, castCdMultiplier, skillScale, hpScale, contactScale,
    endReason: end.endReason, win: end.endReason === 'victory', seconds: Math.round(end.time * 10) / 10,
    maxHp: Math.round(sim.player.maxHp), def, diffDmg,
    bossSpawnAt: Math.round(spawnAt * 10) / 10, bossKillAt: Math.round(killAt * 10) / 10,
    ttk: spawnAt && killAt ? Math.round((killAt - spawnAt) * 10) / 10 : 0,
    minHpRatio: Math.round(minHpRatio * 1000) / 1000,
    casts, landed, avoided: casts - landed - unresolvedAtEnd, unresolvedAtEnd, invulnerableHits, shieldedHits, crossedPhase, hudCues,
    hits, unclassified: [...unclassified], lostToBoss: Math.round(lostToBoss), lostToHorde: Math.round(lostToHorde),
    lostTotal: Math.round(lostTotal), bossShare: lostTotal > 0 ? Math.round(lostToBoss / lostTotal * 10000) / 10000 : 0,
    contactShareOfBoss: lostToBoss > 0 ? Math.round(contactLost / lostToBoss * 10000) / 10000 : 0,
    topSource: top?.[0] ?? 'none', topSourceShare: top && lostTotal > 0 ? Math.round(top[1] / lostTotal * 10000) / 10000 : 0,
    travelEscaped, travelLanded,
    // Opt-in: absent unless `log` is set, so every existing report keeps its schema byte for byte.
    ...(log ? { castLog, circleLog } : {}),
  };
  core.destroy();
  return result;
}

const cache = new Map<string, ThreatRun[]>();
function runs(journey: Journey, bossDamage: number, policy: Policy, seeds: readonly number[], cadence: Cadence = NO_CADENCE, log = false): ThreatRun[] {
  const key = JSON.stringify([journey, bossDamage, policy, seeds, cadence, log]);
  let value = cache.get(key);
  if (!value) { value = seeds.map(seed => run(journey, seed, bossDamage, policy, cadence, log)); cache.set(key, value); }
  return value;
}
const JOURNEYS: readonly Journey[] = ['classic', 'evolution'];
const both = (bossDamage: number, policy: Policy, seeds: readonly number[], cadence: Cadence = NO_CADENCE): ThreatRun[] => JOURNEYS.flatMap(journey => runs(journey, bossDamage, policy, seeds, cadence));
const median = (values: readonly number[]): number => { const sorted = [...values].sort((a, b) => a - b); return sorted[Math.floor(sorted.length / 2)] ?? 0; };
const winRate = (list: readonly ThreatRun[]): number => list.length ? Math.round(list.filter(run => run.win).length / list.length * 10000) / 10000 : 0;
const ttkMedian = (list: readonly ThreatRun[]): number => median(list.filter(run => run.win).map(run => run.ttk));
/** `1 - landed / resolved`, pooled. The share of casts the player was not standing in. */
const avoidRate = (list: readonly ThreatRun[]): number => {
  const resolved = list.reduce((sum, item) => sum + item.casts - item.unresolvedAtEnd, 0);
  return resolved ? Math.round((1 - list.reduce((sum, item) => sum + item.landed, 0) / resolved) * 10000) / 10000 : 0;
};

/** The shipped value, i.e. what the game does today. Read once and reused by every test. */
const BASE = (): ThreatRun[] => both(threatV2.bossDamage, 'browser', SEEDS, REFERENCE);

/**
 * What `bossDamage` would have to become for each move to cost `TARGET.skillFraction` of max HP.
 * Read at **phase 1** for every shape, because that is each move's weakest instance and G4 asks
 * for every move, so the weakest one binds. `cone@3` is carried separately: it is the cheapest
 * instance in the game, i.e. the lowest multiple that reaches the target for *any* move.
 */
function multiples() {
  const base = BASE()[0]!;
  const fraction = (shape: Shape, phase: number): number => mitigate(rawOf(shape, phase, base.diffDmg, threatV2.bossDamage), base.def, threatV2.softCap) / STARTUP_MAX_HP;
  const round = (value: number): number => Math.round(value * 10000) / 10000;
  const at = (shape: Shape, phase: number) => ({ shape, phase, fraction: round(fraction(shape, phase)), multiple: Math.round(TARGET.skillFraction / fraction(shape, phase) * 100) / 100 });
  return {
    perShape: (['circle', 'line', 'cone'] as const).map(shape => at(shape, 1)),
    coneAtPeak: at('cone', 3),
    /** GDD §5 P0-4's mechanism, in the same units: `base` as a share of max HP. */
    gdd: GDD_BASE,
    required: Math.max(...(['circle', 'line', 'cone'] as const).map(shape => Math.round(TARGET.skillFraction / fraction(shape, 1) * 100) / 100)),
    cheapest: Math.round(TARGET.skillFraction / fraction('cone', 3) * 100) / 100,
  };
}

/** One row of the trade-off curve. Shared by the tests and the report so they cannot drift. */
function summarise(bossDamage: number, policy: Policy, seeds: readonly number[], cadence: Cadence = NO_CADENCE) {
  const list = both(bossDamage, policy, seeds, cadence);
  const round = (value: number): number => Math.round(value * 10000) / 10000;
  return {
    bossDamage, policy, seeds: seeds.length, runs: list.length,
    /** R1g-10's axes, echoed from the runs so a row cannot be mislabelled. */
    castCdMultiplier: list[0]?.castCdMultiplier ?? cadence.castCd,
    skillScale: list[0]?.skillScale ?? cadence.skill,
    hpScale: list[0]?.hpScale ?? cadence.hp,
    contactScale: list[0]?.contactScale ?? cadence.contact ?? 1,
    wins: list.filter(item => item.win).length, winRate: winRate(list),
    hpMinMedian: median(list.map(item => item.minHpRatio)),
    ttkMedian: ttkMedian(list),
    losses: list.filter(item => !item.win).reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.endReason ?? 'none']: (acc[item.endReason ?? 'none'] ?? 0) + 1 }), {}),
    castsMedian: median(list.map(item => item.casts)),
    /** `hud` arm: instructions seen, against `castsMedian`. Equal means no move went unnamed. */
    hudCuesMedian: median(list.map(item => item.hudCues)),
    landedPerRunMedian: median(list.map(item => item.landed)),
    avoidRate: avoidRate(list),
    /** Warnings cast before a phase change and resolved after it. */
    crossedPhaseHits: list.reduce((sum, item) => sum + item.crossedPhase, 0),
    travelEscapedMedian: median(list.flatMap(item => item.travelEscaped)),
    travelLandedMedian: median(list.flatMap(item => item.travelLanded)),
    lostToBossMedian: median(list.map(item => item.lostToBoss)),
    lostToHordeMedian: median(list.map(item => item.lostToHorde)),
    bossShareMedian: median(list.map(item => item.bossShare)),
    contactShareOfBossMedian: median(list.map(item => item.contactShareOfBoss)),
    /**
     * The aggregate the cadence diagonal is meant to preserve, read directly off the hits: moves
     * only, body contact excluded. It is the quantity `casts x per-hit x land rate` approximates,
     * and it is the check that says the sweep measured a concentration rather than a damage change.
     */
    moveLostMedian: median(list.map(item => item.hits.filter(hit => hit.shape !== 'contact').reduce((sum, hit) => sum + hit.lost, 0))),
    contactLostMedian: median(list.map(item => item.hits.filter(hit => hit.shape === 'contact').reduce((sum, hit) => sum + hit.lost, 0))),
    /** The shipped telemetry's largest single incoming source, by how often it is the largest. */
    topSources: Object.entries(list.reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.topSource]: (acc[item.topSource] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]),
    /** The per-hit cost this multiple actually buys, as a share of max HP. */
    fractionMedian: round(median(list.flatMap(item => item.hits.filter(hit => hit.shape !== 'contact' && !hit.shielded && !hit.invulnerable).map(hit => hit.lost / hit.maxHp)))),
    perShape: SHAPES.map(shape => {
      const all = list.flatMap(item => item.hits.filter(hit => hit.shape === shape && !hit.shielded && !hit.invulnerable));
      return { shape, hits: all.length, fractionMedian: all.length ? round(median(all.map(hit => hit.lost / hit.maxHp))) : 0 };
    }),
  };
}

/**
 * R1g-10's curve. The diagonal `castCd = skill = k` is "the same aggregate paid in k times fewer
 * moves" - D7's path A. The two off-diagonal rows at the same `k` decompose it: cadence alone makes
 * the fight easier (same size moves, fewer of them) while size alone is R1g-9's dead end. Read
 * together they say which half of the lever a given change is actually paying for.
 */
function cadenceCurve() {
  const k = multiples().required;
  // Every row here is pinned to the reference, including the `shipped` one: the curve is a claim
  // about what the lever does to *that* table, and R1g-11 has since moved the table.
  const cadence = (castCd: number, skill: number, hp = 1, contact?: number): Cadence => ({ castCd, skill, hp, contact, reference: true });
  const sweep = [
    { label: 'shipped', castCd: 1, skill: 1, seeds: SEEDS },
    { label: '2x', castCd: 2, skill: 2, seeds: SEEDS },
    { label: '4x', castCd: 4, skill: 4, seeds: SEEDS },
    // The curve has already collapsed by 8x, so it is read on the smaller set as an interpolation
    // point. Every row that carries a verdict is read on all 33: n=11 was measured to be quantile
    // noise, and each of these rows is a balance reading.
    { label: '8x', castCd: 8, skill: 8, seeds: SENSITIVITY_SEEDS },
    { label: 'G4 15% per move', castCd: k, skill: k, seeds: SEEDS },
  ].map(row => ({
    label: row.label, castCdMultiplier: row.castCd, skillScale: row.skill, seeds: row.seeds.length,
    browser: summarise(threatV2.bossDamage, 'browser', row.seeds, cadence(row.castCd, row.skill)),
    dodge: summarise(threatV2.bossDamage, 'dodge', row.seeds, cadence(row.castCd, row.skill)),
  }));
  /** One axis at a time, at the multiple G4 needs, on the arm that reads warnings. */
  const isolated = [
    { label: 'cadence only', castCd: k, skill: 1 },
    { label: 'size only', castCd: 1, skill: k },
  ].map(row => ({
    label: row.label, castCdMultiplier: row.castCd, skillScale: row.skill, seeds: SENSITIVITY_SEEDS.length,
    dodge: summarise(threatV2.bossDamage, 'dodge', SENSITIVITY_SEEDS, cadence(row.castCd, row.skill)),
  }));
  /**
   * Scope 2's re-sweep, on the arm that reads warnings and at the multiple G4 needs. Concentrating
   * the aggregate shortens the fight - fewer warnings to leave means more time on the Boss - so the
   * HP budget is the knob that puts G3's 60s floor back, and it is the only one left: G2's floor
   * already holds at the shipped `bossHp`.
   */
  const hpSweep = [1, 1.1, 1.2].map(hp => ({
    hpScale: hp, seeds: SEEDS.length,
    dodge: summarise(threatV2.bossDamage, 'dodge', SEEDS, cadence(k, k, hp)),
  }));
  return { k, sweep, isolated, hpSweep };
}

describe('Boss move threat (R1g-9)', () => {
  it('pins the damage chain every number below is read on', () => {
    const list = BASE();
    // The chain is `base x shape x difficulty x bossDamage`, then `incomingHit`'s soft cap.
    // `def` is H001's and `diffDmg` is `normal`'s, so the analytic value is exact rather than
    // fitted: `rawOf` has to reproduce every hit below to the digit, not approximately.
    expect(threatV2.bossDamage).toBe(.6);
    expect(threatV2.softCap).toBe(60);
    expect(firstStage.telegraphScale).toBe(1.65);
    expect(list[0]!.def).toBe(28);
    expect(list[0]!.diffDmg).toBe(1);
    let checked = 0;
    const mismatches: string[] = [];
    // maxHp is **not** a constant, which is why the fractions below are computed against each
    // hit's own denominator. `FirstStageMap`'s altar trades 10% max HP for 22% attack (`.90` at
    // `useNearest`), the browser arm presses `f` on whatever is nearest, and 763 * .9 = 687 - the
    // only two values the base run produces. Pin the band and the fact that the trade fires, not a
    // single number: a hardcoded 763 makes seed 28 fail, which is how this was found.
    const maxHps = [...new Set(list.flatMap(item => [item.maxHp, ...item.hits.map(hit => hit.maxHp)]))].sort((a, b) => a - b);
    for (const maxHp of maxHps) { expect(maxHp).toBeGreaterThan(600); expect(maxHp).toBeLessThanOrEqual(800); }
    expect(maxHps.length).toBeGreaterThan(1);
    for (const item of list) {
      // The partition has to be total: a B001 source outside the shape table would be silently
      // folded into `contact` and deflate or inflate every fraction below.
      expect(item.unclassified, `${item.journey} seed ${item.seed}`).toEqual([]);
      for (const hit of item.hits) {
        checked++;
        // `raw` has to be *exactly* one of the three legal values for its shape - not
        // approximately, and not checked against the Boss's current phase (2% of warnings resolve
        // after a phase change and carry the phase they were cast in).
        const legal = [1, 2, 3].map(phase => rawOf(hit.shape, phase, item.diffDmg, item.bossDamage));
        if (!legal.some(value => Math.abs(value - hit.raw) < 1e-9)) mismatches.push(`${item.journey}/${item.seed} ${hit.source} raw=${hit.raw}`);
        const nearest = Math.round(hit.phaseFromRaw);
        expect(Math.abs(hit.phaseFromRaw - nearest), `${hit.source} phase ${hit.phaseFromRaw}`).toBeLessThan(1e-9);
        expect(nearest).toBeGreaterThanOrEqual(1);
        expect(nearest).toBeLessThanOrEqual(3);
        // A shield and an i-frame are the only two things between `raw` and `lost`, and the only
        // other cap is death: a lethal hit takes the remaining HP and no more, so the expected
        // loss is `min(hpBefore, mitigated)`. Every Boss hit is >= 5.7 raw here, i.e. above
        // `Math.max(1, ...)`, so the floor never applies.
        if (!hit.shielded && !hit.invulnerable) {
          expect(hit.lost, `${hit.source} phase ${hit.phaseFromRaw} seed ${item.seed}`).toBeCloseTo(Math.min(hit.hpBefore, mitigate(hit.raw, item.def, threatV2.softCap)), 9);
        }
      }
    }
    expect(mismatches).toEqual([]);
    expect(checked).toBeGreaterThan(100);
    // The cross-phase case is rare but real, so it is counted rather than assumed away.
    expect(list.reduce((sum, item) => sum + item.crossedPhase, 0)).toBeGreaterThan(0);
  }, 120_000);

  it('measures what one move costs today, and corrects G4\'s 4.2% premise', () => {
    const list = BASE();
    const multiplesAt = multiples();
    const byShape = SHAPES.map(shape => {
      const all = list.flatMap(item => item.hits.filter(hit => hit.shape === shape));
      const taken = all.filter(hit => !hit.shielded && !hit.invulnerable);
      return {
        shape,
        hits: all.length,
        // The observed mix: every phase, and each hit's own maxHp (see the altar note above).
        fractionMedian: median(taken.map(hit => hit.lost / hit.maxHp)),
        // The design number: one hit of each shape at each phase, as a share of the *startup*
        // max HP (763, i.e. before any altar). The two are not the same quantity - the median
        // sits above the phase-1 row because most hits land in phases 2-3.
        fractionAtPhase: [1, 2, 3].map(phase => mitigate(rawOf(shape, phase, list[0]!.diffDmg, threatV2.bossDamage), list[0]!.def, threatV2.softCap) / STARTUP_MAX_HP),
      };
    });
    // G4's premise, restated: no single move is legible. Pinned as a ceiling on today's number,
    // because the target is what this slice is trying to establish and it is not met.
    for (const entry of byShape.filter(entry => entry.shape !== 'contact')) {
      for (const fraction of entry.fractionAtPhase) expect(fraction, `${entry.shape} today`).toBeLessThan(.05);
    }
    expect(multiplesAt.perShape.find(entry => entry.shape === 'line')!.fraction).toBeLessThan(.02);
    // The other half of the premise is stale, and this is the correction: GDD §4's "4.2%" was
    // measured on the legacy path (`incoming 0.44`, a flat `def * .08` term and a global 0.28s
    // i-frame). threat-v2 has none of those, so the Boss's *aggregate* is now over half the
    // player's health bar and a third of all incoming damage - while each individual move stays
    // invisible. The problem is legibility, not lethality.
    expect(median(list.map(item => item.lostToBoss)) / STARTUP_MAX_HP).toBeGreaterThan(.4);
    expect(median(list.map(item => item.bossShare))).toBeGreaterThan(.25);
    // Body contact rides the same knob and is a large part of that aggregate, which is why the
    // multiple in the next test cannot be paid by dodging the moves alone.
    expect(median(list.map(item => item.contactShareOfBoss))).toBeGreaterThan(.2);
  }, 120_000);

  it('names the instrument: the browser arm never reads a warning', () => {
    const browser = BASE();
    const dodging = both(threatV2.bossDamage, 'dodge', SEEDS, REFERENCE);
    const browserAvoid = avoidRate(browser), dodgeAvoid = avoidRate(dodging);
    // The browser arm's movement rule has no warning term, so it cannot dodge - but it does not
    // stand still either, and that is the trap this test exists to close. `tests/settlement.spec.ts`
    // spends the Boss phase walking at the Boss, which charges 776px away (`chargeRange`) and then
    // walks back at 45-59px/s; for the ~15s in transit the player is covering 240px/s, and a 70px
    // ring cast on a moving player is simply left behind. So the arm avoids a fifth of the cast
    // list *by accident*, and any damage number read on it is read on a player who is not dodging.
    expect(browserAvoid).toBeGreaterThan(.05);
    expect(browserAvoid).toBeLessThan(.35);
    // And the escapes are movement, not reading: every warning it leaves is one it walked out of,
    // so the distance travelled during an escaped warning exceeds the distance during a landed one
    // (a landed warning at the 65px standoff is taken standing still).
    expect(median(browser.flatMap(item => item.travelEscaped))).toBeGreaterThan(20);
    expect(median(browser.flatMap(item => item.travelEscaped))).toBeGreaterThan(median(browser.flatMap(item => item.travelLanded)));
    // One policy switch, same rules and seeds: the avoidance more than doubles, which is what
    // separates "the Boss is too lethal" from "the instrument is not playing the game".
    expect(dodgeAvoid).toBeGreaterThan(.6);
    expect(dodgeAvoid).toBeGreaterThan(browserAvoid * 2);
    expect(median(dodging.map(item => item.minHpRatio))).toBeGreaterThan(median(browser.map(item => item.minHpRatio)));
  }, 300_000);

  it('computes the multiple G4 needs, and the price `bossDamage` cannot pay', () => {
    const base = BASE();
    const needed = multiples();
    // G4 asks for every move, so the weakest instance binds: 蛮王冲锋 at phase 1, 21 x 1.15.
    expect(needed.required).toBeGreaterThan(8);
    expect(needed.required).toBeGreaterThan(needed.cheapest);
    // At that multiple the browser instrument eats the same cast list it eats today, so its HP
    // floor is not merely breached - the run ends long before the Boss does.
    const atTarget = both(threatV2.bossDamage * needed.required, 'browser', SENSITIVITY_SEEDS, REFERENCE);
    expect(median(atTarget.map(item => item.minHpRatio))).toBe(0);
    expect(winRate(atTarget)).toBeLessThan(.1);
    // And there is no headroom to spend: a 1.67x increase already breaks G2's floor on the
    // instrument every sibling harness reads, while the current value sits at 0.363 pooled.
    expect(median(base.map(item => item.minHpRatio))).toBeGreaterThan(TARGET.floor);
    expect(median(both(1, 'browser', SENSITIVITY_SEEDS, REFERENCE).map(item => item.minHpRatio))).toBeLessThan(TARGET.floor);
    // The knob is shared with body contact (`FirstBoss.damageScale` covers both), and contact is
    // the Boss's main source, so the multiple cannot be paid even by a player who dodges every
    // move: contact alone becomes a five-percent-per-second bleed.
    const contactPerSecond = mitigate(rawOf('contact', 1, base[0]!.diffDmg, threatV2.bossDamage * needed.required), base[0]!.def, threatV2.softCap) / STARTUP_MAX_HP / threatV2.bossContactInterval;
    expect(contactPerSecond).toBeGreaterThan(.05);
  }, 300_000);

  it('measures the ceiling: how much per-hit cost G2 can actually pay for', () => {
    const dodging = (bossDamage: number, seeds: readonly number[] = SENSITIVITY_SEEDS): ThreatRun[] => both(bossDamage, 'dodge', seeds, REFERENCE);
    const needed = multiples();
    const rows = [
      { label: 'shipped', damage: threatV2.bossDamage, list: both(threatV2.bossDamage, 'dodge', SEEDS, REFERENCE) },
      { label: '1.5x', damage: 1.5, list: dodging(1.5, SEEDS) },
      { label: '2.0x', damage: 2, list: dodging(2) },
      { label: '2.5x', damage: 2.5, list: dodging(2.5) },
      { label: 'cone 15%', damage: needed.cheapest, list: dodging(needed.cheapest) },
      { label: 'all 15%', damage: needed.required, list: dodging(needed.required) },
    ];
    // The dodging arm is the most favourable instrument this project has: a player who reads every
    // warning and leaves it. Even there the ceiling is close, because 31 casts a run and a 15% hit
    // is 465% of the health bar, so surviving requires avoiding ~84% of the cast list.
    for (const row of rows.slice(1)) expect(row.damage).toBeGreaterThan(rows[0]!.damage);
    expect(median(rows[0]!.list.map(item => item.minHpRatio))).toBeGreaterThan(.4);
    expect(median(rows[2]!.list.map(item => item.minHpRatio))).toBeLessThan(TARGET.floor);
    expect(median(rows[3]!.list.map(item => item.minHpRatio))).toBe(0);
    expect(median(rows[5]!.list.map(item => item.minHpRatio))).toBe(0);
    expect(winRate(rows[5]!.list)).toBe(0);
    // What the floor does buy: between 1.5x and 2.0x. That is the reachable per-hit cost, and it
    // is a fifth of what G4 asks for.
    const reachable = mitigate(rawOf('line', 1, rows[0]!.list[0]!.diffDmg, rows[1]!.damage), rows[0]!.list[0]!.def, threatV2.softCap) / STARTUP_MAX_HP;
    expect(reachable).toBeGreaterThan(.01);
    expect(reachable).toBeLessThan(TARGET.skillFraction / 3);
  }, 600_000);

  it('writes the evidence report', () => {
    const needed = multiples();
    const sweep: readonly (readonly [number, Policy, readonly number[]])[] = [
      [threatV2.bossDamage, 'browser', SEEDS],
      [1, 'browser', SENSITIVITY_SEEDS],
      [needed.required, 'browser', SENSITIVITY_SEEDS],
      [threatV2.bossDamage, 'dodge', SEEDS],
      [1.5, 'dodge', SEEDS],
      [2, 'dodge', SEEDS],
      [2.5, 'dodge', SENSITIVITY_SEEDS],
      [needed.cheapest, 'dodge', SENSITIVITY_SEEDS],
      [needed.required, 'dodge', SENSITIVITY_SEEDS],
    ];
    const rows = sweep.map(([bossDamage, policy, seeds]) => summarise(bossDamage, policy, seeds, REFERENCE));
    const base = rows[0]!;
    const report = {
      slice: 'R1g-9',
      base: 'R1g-8',
      harness: 'src/core/bossThreat.test.ts',
      frameHz: 1 / FRAME,
      instrument: {
        primary: 'browser (manualDamage.test.ts): options[0], one press per step, the f key, a 65px standoff',
        added: 'dodge: the same player, except it leaves any live warning it is inside. Movement only - the dodge button (0.35s i-frame, 4.5s cd) is never pressed, so this is a lower bound.',
        browserCanDodge: false,
        note: 'tests/settlement.spec.ts has no telegraph reference (grep-verified); the browser arm avoids by walking, not by reading.',
        viewport: [390, 844],
        rules: 'threat-v2',
      },
      target: { ...TARGET, gddBase: GDD_BASE },
      chain: {
        base: '13 + phase * 4', contact: '11 + phase * 3',
        shapeFactor: SHAPE_FACTOR, difficulty: { id: 'normal', dmg: BASE()[0]!.diffDmg },
        def: BASE()[0]!.def, softCap: threatV2.softCap,
        maxHpStartup: STARTUP_MAX_HP,
        /** The altar's `maxHp *= .90` moves the denominator; both values are observed. */
        maxHpObserved: [...new Set(BASE().flatMap(item => [item.maxHp, ...item.hits.map(hit => hit.maxHp)]).map(value => Math.round(value)))].sort((a, b) => a - b),
        bossDamage: threatV2.bossDamage, bossContactInterval: threatV2.bossContactInterval,
        telegraphScale: firstStage.telegraphScale,
        telegraphDelay: [1, 2, 3].map(phase => Math.round(Math.max(.55, .95 - phase * .08) * firstStage.telegraphScale * 10000) / 10000),
        castCooldown: [1, 2, 3].map(phase => Math.round(Math.max(.9, (3 - phase * .38) / BASE()[0]!.diffDmg) * 100) / 100),
      },
      needed,
      sweep: rows,
      /** The two claims the curve is read for, in one place, derived rather than restated. */
      conclusion: {
        perHitToday: { weakest: needed.perShape.find(entry => entry.shape === 'line')!.fraction, strongest: needed.coneAtPeak.fraction },
        multipleForG4: needed.required,
        multipleForCone: needed.cheapest,
        /** Multiples where G2's floor still holds, per instrument. */
        browserFloorHolds: rows.filter(row => row.policy === 'browser' && row.hpMinMedian >= TARGET.floor).map(row => row.bossDamage),
        dodgeFloorHolds: rows.filter(row => row.policy === 'dodge' && row.hpMinMedian >= TARGET.floor).map(row => row.bossDamage),
        avoidance: { browser: base.avoidRate, dodge: rows[3]!.avoidRate },
        castsPerRun: base.castsMedian,
      },
      totalRuns: sweep.reduce((sum, entry) => sum + entry[2].length * 2, 0),
    };
    try {
      mkdirSync(EVIDENCE, { recursive: true });
      writeFileSync(resolve(EVIDENCE, 'boss-threat-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.sweep).toHaveLength(sweep.length);
  }, 600_000);

  it('measures the cadence lever: the same aggregate in fewer, bigger moves', () => {
    const { sweep, isolated, hpSweep } = cadenceCurve();
    // The shipped row has to be the untouched reference. A row that quietly engaged a multiplier on
    // the shipped value would invalidate every R1g-9 number in this file, so the base row is pinned
    // to both axes at 1 and every swept row has to be above them.
    expect(sweep[0]!.browser.castCdMultiplier).toBe(1);
    expect(sweep[0]!.browser.skillScale).toBe(1);
    expect(sweep[0]!.dodge.castCdMultiplier).toBe(1);
    expect(sweep[0]!.dodge.skillScale).toBe(1);
    for (const row of sweep.slice(1)) {
      expect(row.dodge.castCdMultiplier, `${row.label} cadence`).toBeGreaterThan(1);
      expect(row.dodge.skillScale, `${row.label} skill`).toBeGreaterThan(1);
    }
    // The diagonal has to move both axes: fewer casts, each a bigger share of the health bar.
    const casts = sweep.map(row => row.dodge.castsMedian);
    for (let i = 1; i < sweep.length; i++) expect(casts[i]!, `casts at ${sweep[i]!.label}`).toBeLessThan(casts[i - 1]!);
    // The per-hit fraction is asserted from the chain, not from the sample: a row can legitimately
    // land no move at all (8x on the dodging arm landed 0 hits in 66 runs) and `median([])` reads 0,
    // which is a property of the sample rather than of the lever. `skillScale` on the weakest move
    // has to reach G4's 15% at the last row, and that is the definition of `required`.
    const base = BASE()[0]!;
    const design = sweep.map(row => mitigate(rawOf('line', 1, base.diffDmg, threatV2.bossDamage), base.def, threatV2.softCap) * row.skillScale / STARTUP_MAX_HP);
    for (let i = 1; i < design.length; i++) expect(design[i]!, `design per-hit at ${sweep[i]!.label}`).toBeGreaterThan(design[i - 1]!);
    expect(design[design.length - 1]!).toBeCloseTo(TARGET.skillFraction, 3);
    // Where the sample does land moves, the observed median is that design value times the phase
    // mix (most landed moves are phase 2-3 cones), measured at 1.5-1.6x on every row that has one.
    for (let i = 0; i < sweep.length; i++) {
      if (sweep[i]!.dodge.landedPerRunMedian === 0) continue;
      expect(sweep[i]!.dodge.fractionMedian / design[i]!, `observed/design at ${sweep[i]!.label}`).toBeGreaterThan(1.2);
      expect(sweep[i]!.dodge.fractionMedian / design[i]!, `observed/design at ${sweep[i]!.label}`).toBeLessThan(2.5);
    }
    // Recorded rather than assumed, and this is the slice's finding: the diagonal preserves the
    // *design* aggregate, not the damage the player actually takes. On the arm that reads warnings,
    // move damage per run falls from 94.7 HP to 0 as k goes 1 -> 14.31, because rare casts are also
    // avoidable ones - the player is at the Boss instead of chasing it after a 776px charge, so the
    // exit is short. The fight gets *easier* as it gets more legible, which is why G2's floor and
    // G3's 60s are the terms this lever has to be traded against, not the per-hit number.
    const moveLost = sweep.map(row => row.dodge.moveLostMedian);
    expect(moveLost[moveLost.length - 1]!).toBeLessThan(moveLost[0]!);
    expect(moveLost[0]!).toBeGreaterThan(0);
    // And the split holds: body contact is *not* on the diagonal. Its per-run cost has to stay flat
    // across k. If `bossContactDamage` were being scaled by `bossSkillDamage` - which is what a
    // `startsWith('B001-')` prefix test does, since `'B001-contact'` starts with `'B001-'` - this
    // is the assertion that catches it: at 14.31x, contact alone is 82 HP every 1.1s and the run
    // ends before the Boss's first cast.
    const contactLost = sweep.map(row => row.dodge.contactLostMedian);
    for (const value of contactLost) {
      expect(value / contactLost[0]!).toBeGreaterThan(.5);
      expect(value / contactLost[0]!).toBeLessThan(2);
    }
    // The G4 row's price, measured. On the arm that reads warnings the floor **holds** - 0.272
    // against G2's 0.25 - and the only constraint that gives way is G3's 60s floor: the fight gets
    // easier as it gets more legible, so the remaining work is the HP budget and not the damage. On
    // the arm that cannot dodge the same row costs four fifths of the health bar, which is why
    // Scope 3 is a prerequisite rather than a follow-up: shipping this against a bot that stands in
    // every warning would red the browser suite for an instrument reason, not a balance one.
    const atG4 = sweep[sweep.length - 1]!;
    expect(atG4.dodge.hpMinMedian).toBeGreaterThan(TARGET.floor);
    expect(atG4.dodge.ttkMedian).toBeLessThan(TARGET.window.min);
    expect(atG4.dodge.winRate).toBeGreaterThan(.5);
    // The non-dodging arm's price, re-derived. R1g-11 read `< .1` (it was 0.0-ish: the horde alone
    // killed a player who stands in every warning). R1g-12's horde table is 20% weaker, so the same
    // arm now finishes with **0.165** of its health bar - still under G2's 0.25 floor, which is the
    // claim, but no longer zero. The statement that survives is the one that was doing the work:
    // standing in every warning costs you G2, it does not (any more) cost you the run on the spot.
    expect(atG4.browser.hpMinMedian).toBeLessThan(TARGET.floor);
    // Scope 2's re-sweep, and the answer to the one broken constraint: raising `bossHp` lengthens
    // the fight. Only the direction is asserted - a longer budget cannot make the Boss die sooner -
    // and whether a value inside this range puts TTK back over 60s is carried in the report rather
    // than required, because a range that misses means the next slice extends the range, not the
    // claim.
    expect(hpSweep[hpSweep.length - 1]!.dodge.ttkMedian).toBeGreaterThan(hpSweep[0]!.dodge.ttkMedian);
    // And the two halves of the lever are not interchangeable, which is the whole point of reading
    // the diagonal: size alone is R1g-9's dead end (no run survives), cadence alone is not a threat
    // at all (the Boss casts once and the player is never in it). Only the pair is a fight.
    const byLabel = Object.fromEntries(isolated.map(row => [row.label, row.dodge]));
    // Size alone is R1g-9's dead end, and R1g-12 re-derived the bar without changing the claim. It
    // used to be an outright `0` - no run survived - and on the weaker horde table **1 run of 22**
    // now does (winRate 0.0455), while the floor is still exactly **0**. So the bar becomes "loses
    // almost every run" at `.1`, which is the statement that was doing the work, and the floor is
    // still asserted at zero because that one is unchanged.
    expect(byLabel['size only']!.winRate).toBeLessThan(.1);
    expect(byLabel['size only']!.hpMinMedian).toBe(0);
    expect(byLabel['cadence only']!.castsMedian).toBeLessThan(3);
    expect(byLabel['cadence only']!.winRate).toBeGreaterThan(.5);
  }, 900_000);

  it('writes the cadence curve', () => {
    const { k, sweep, isolated, hpSweep } = cadenceCurve();
    const last = sweep[sweep.length - 1]!, anchor = BASE()[0]!;
    const designAt = (skill: number): number => mitigate(rawOf('line', 1, anchor.diffDmg, threatV2.bossDamage), anchor.def, threatV2.softCap) * skill / STARTUP_MAX_HP;
    const report = {
      slice: 'R1g-10',
      base: 'R1g-9',
      harness: 'src/core/bossThreat.test.ts',
      frameHz: 1 / FRAME,
      instrument: {
        primary: 'browser (manualDamage.test.ts): options[0], one press per step, the f key, a 65px standoff',
        added: 'dodge: the same player, except it leaves any live warning it is inside. Movement only - the dodge button (0.35s i-frame, 4.5s cd) is never pressed, so this is a lower bound.',
        browserCanDodge: false,
        note: 'tests/settlement.spec.ts has no telegraph reference (grep-verified); the browser arm avoids by walking, not by reading.',
        viewport: [390, 844],
        rules: 'threat-v2',
      },
      target: { ...TARGET, gddBase: GDD_BASE },
      lever: {
        castCdMultiplier: '`threatV2.bossCastCooldown`: multiplies every fresh `castCd` assignment - spawn 1.7, phase change 1.2, recurring Math.max(.9, (3 - phase * .38) / speed) = 2.62 / 2.24 / 1.86',
        skillScale: '`threatV2.bossSkillDamage`: multiplies `B001-<skill>` damage only. Body contact is `threatV2.bossContactDamage`, which stays at 1 across this whole sweep - that split is R1g-10 Scope 1.',
        diagonal: 'castCd = skill = k, i.e. the same aggregate paid in k times fewer moves (DECISIONS D7 path A)',
        requiredMultiple: k,
      },
      sweep,
      isolated,
      hpSweep,
      /** Derived from the rows, so the prose cannot drift from the numbers. */
      conclusion: {
        perHitToday: sweep[0]!.dodge.fractionMedian,
        perHitAtG4: sweep[sweep.length - 1]!.dodge.fractionMedian,
        castsPerRun: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.castsMedian, dodge: row.dodge.castsMedian })),
        landedPerRun: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.landedPerRunMedian, dodge: row.dodge.landedPerRunMedian })),
        /** The quantity the diagonal should hold constant, and its other half (body contact). */
        moveLostPerRun: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.moveLostMedian, dodge: row.dodge.moveLostMedian })),
        contactLostPerRun: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.contactLostMedian, dodge: row.dodge.contactLostMedian })),
        winRate: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.winRate, dodge: row.dodge.winRate })),
        hpMinMedian: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.hpMinMedian, dodge: row.dodge.hpMinMedian })),
        ttkMedian: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.ttkMedian, dodge: row.dodge.ttkMedian })),
        losses: sweep.map(row => ({ k: row.castCdMultiplier, browser: row.browser.losses, dodge: row.dodge.losses })),
        isolated: isolated.map(row => ({ label: row.label, hpMin: row.dodge.hpMinMedian, winRate: row.dodge.winRate, ttk: row.dodge.ttkMedian })),
        /**
         * The verdict, derived rather than restated. G4 is met when the *design* per-hit fraction of
         * the weakest move reaches 15%; G2 holds when the dodging arm's HP floor stays above 25%;
         * G3 holds when the fight stays inside 60-90s. The three are read off the same row, so the
         * report cannot claim the target was reached while the floor or the window gave way.
         */
        design: {
          perHitToday: designAt(1),
          perHitAtG4: designAt(last.skillScale),
          g4Met: designAt(last.skillScale) >= TARGET.skillFraction * .99,
        },
        atG4: {
          dodge: { hpMin: last.dodge.hpMinMedian, ttk: last.dodge.ttkMedian, winRate: last.dodge.winRate },
          browser: { hpMin: last.browser.hpMinMedian, ttk: last.browser.ttkMedian, winRate: last.browser.winRate },
        },
        /** Which constraints the G4 row breaks, per arm. Empty means the target ships as measured. */
        g4Breaks: {
          dodge: [last.dodge.hpMinMedian < TARGET.floor ? 'G2 floor' : undefined, last.dodge.ttkMedian < TARGET.window.min || last.dodge.ttkMedian > TARGET.window.max ? 'G3 window' : undefined].filter(Boolean),
          browser: [last.browser.hpMinMedian < TARGET.floor ? 'G2 floor' : undefined, last.browser.ttkMedian < TARGET.window.min || last.browser.ttkMedian > TARGET.window.max ? 'G3 window' : undefined].filter(Boolean),
        },
        /**
         * Scope 2's answer: the lowest `bossHp` multiple inside this range that puts the dodging arm
         * back inside G3, and what it costs the floor. `undefined` means the range was too narrow -
         * R1g-11 extends the range, not the claim.
         */
        g3ClosedAt: hpSweep.filter(row => row.dodge.ttkMedian >= TARGET.window.min && row.dodge.ttkMedian <= TARGET.window.max)
          .map(row => ({ bossHp: row.hpScale, ttk: row.dodge.ttkMedian, hpMin: row.dodge.hpMinMedian, winRate: row.dodge.winRate }))[0],
      },
      totalRuns: sweep.reduce((sum, row) => sum + row.seeds * 4, 0) + isolated.reduce((sum, row) => sum + row.seeds * 2, 0) + hpSweep.reduce((sum, row) => sum + row.seeds * 2, 0),
    };
    try {
      mkdirSync(CADENCE_EVIDENCE, { recursive: true });
      writeFileSync(resolve(CADENCE_EVIDENCE, 'boss-cadence-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.sweep).toHaveLength(sweep.length);
    // G4 itself is reachable: the weakest move does reach 15% at the multiple the chain implies.
    // What that row costs is carried by `g4Breaks` and asserted in the measurement test above.
    expect(report.conclusion.design.g4Met).toBe(true);
  }, 900_000);

  /**
   * Scope 0. The `hud` arm is the twin of the browser bot with the two things that bot is missing:
   * it reads `首领招式` and it presses 闪避. Both are on screen in the shipped UI, so what this arm
   * measures is what `tests/settlement.spec.ts` will measure once it runs the same rule. Report
   * first, verdict second - the numbers below are read, not guessed.
   */
  it('measures the HUD arm against the two arms that bracket it', () => {
    const k = multiples().required;
    const block = (cadence: Cadence) => ({
      browser: summarise(threatV2.bossDamage, 'browser', SEEDS, cadence),
      dodge: summarise(threatV2.bossDamage, 'dodge', SEEDS, cadence),
      hud: summarise(threatV2.bossDamage, 'hud', SEEDS, cadence),
    });
    /**
     * `before` is R1g-10's table: the cadence lever at 1 and the R1g-7 HP budget. `after` is
     * `threatV2.json` as R1g-11 ships it - and since the cadence now lives *in* the table,
     * `NO_CADENCE` ("no overrides") is exactly the landed configuration. The old spelling of this
     * test expressed the landing as `{ castCd: k, skill: k, hp: 1.1 }`, which after landing would
     * have multiplied the shipped 14.31 by 14.31 a second time.
     */
    const before = block(REFERENCE), after = block(NO_CADENCE);
    /**
     * R1g-10's reserve lever, named absolutely. Once the cadence lands every move is avoided by a
     * player who reads the HUD, so body contact is the Boss's entire remaining damage - and at 1.0
     * it is what puts that player's floor at 0.240, under G2's 0.25. The sweep runs against the
     * shipped table, which is why its 0.8 row reproduces `after.hud` exactly - and why 0.8 is the
     * row that ships: at the shipped HP even 0.9 lands at 0.248, still under the floor. (R1g-11's
     * evidence doc §4 quotes the same sweep at `hp x 1.1`, where 0.9 reads 0.262 and does clear.)
     *
     * R1g-12 re-read the same sweep on the recalibrated horde table and the *reason* 0.8 ships no
     * longer holds: every row is now inside G2 (1.0 -> 0.414, 0.9 -> 0.438, 0.8 -> 0.449). The
     * shipped value is unchanged because every Boss knob is out of this slice's scope, and the
     * assertion below is re-derived to the ordering that survives. See `QUEUE.md` R1g-13.
     */
    const contactSweep = [1, .9, .8].map(contact => ({
      bossContactDamage: contact, seeds: SEEDS.length,
      hud: summarise(threatV2.bossDamage, 'hud', SEEDS, { castCd: 1, skill: 1, hp: 1, contact }),
    }));
    /**
     * Report first, verdict second - and here that means *write* first. A tripped guard must not
     * delete the numbers needed to re-derive it, and R1g-12 is the slice that learned it twice: its
     * first run of this test tripped `after.browser.hpMinMedian` and the full report below was never
     * reached, so the arm readings that had moved were unreadable. The summaries go to disk before
     * the first assertion.
     */
    try {
      mkdirSync(HUD_EVIDENCE, { recursive: true });
      writeFileSync(resolve(HUD_EVIDENCE, 'boss-hud-arms.json'),
        `${JSON.stringify({ slice: 'R1g-11', measuredOn: 'R1g-12', base: 'R1g-10', k, before, after, contactSweep }, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    // A text-only player has to see every move. This is structural, not a distribution, so it is
    // asserted outright: `HUD_CUE`'s suffixes cannot repeat between consecutive casts.
    const hudRuns = both(threatV2.bossDamage, 'hud', SENSITIVITY_SEEDS, REFERENCE);
    // At most one cast per run can go unnamed, and only for a structural reason: a cast made on the
    // run's final frame is announced after the loop has already broken on `status === 'ended'`, so
    // no player - real or simulated - could have read it. More than one would mean two consecutive
    // casts shared a cue suffix, which `skillIndex`'s cycle rules out (`(skillIndex + phase - 1) % 3`
    // advances by 1 or 2, never 0). The boundary is therefore `casts - hudCues <= 1`, inclusive.
    for (const item of hudRuns) expect(item.casts - item.hudCues, `${item.journey}/${item.seed}`).toBeGreaterThanOrEqual(0);
    const overNamed = hudRuns.filter(item => item.casts - item.hudCues > 1)
      .map(item => `${item.journey}/${item.seed} cues=${item.hudCues} casts=${item.casts}`);
    expect(overNamed).toEqual([]);
    const cueRate = hudRuns.reduce((sum, item) => sum + item.hudCues, 0) / hudRuns.reduce((sum, item) => sum + item.casts, 0);
    expect(cueRate).toBeGreaterThan(.95);
    // Read off the numbers below, not guessed. The shipped cadence is the headline: a player who
    // respects every telegraph for its whole window takes almost no Boss damage (38 HP a run
    // against the fixed instrument's 432) and is never in danger (hpMin 0.761) - and loses 64 of 66
    // runs, all to the clock. **Today, reacting to the Boss's moves costs you the run.** That is the
    // design defect R1g-9 named as "legibility", stated as an outcome instead of as a damage share.
    expect(before.hud.winRate).toBeLessThan(.15);
    expect(before.hud.losses.timeout ?? 0).toBeGreaterThan(40);
    expect(before.hud.lostToBossMedian).toBeLessThan(before.browser.lostToBossMedian / 5);
    expect(before.hud.hpMinMedian).toBeGreaterThan(before.browser.hpMinMedian);
    expect(before.hud.avoidRate).toBeGreaterThan(before.dodge.avoidRate);
    expect(before.hud.hudCuesMedian).toBe(before.hud.castsMedian);
    // The landed table, read on the arm that ships. Both targets hold - and the floor does not hold
    // on its own: at `bossContactDamage` 1.0 it is 0.240, under G2's 0.25. It misses for a specific
    // reason: once every move is avoided, body contact is the Boss's *entire* damage (contactShare
    // 1.0) and the run is long enough for the horde to grind the floor down. `bossDamage` cannot fix
    // it without undoing G4 and `bossHp` cannot without breaking G3, so the lever is the one R1g-10
    // reserved - which is why the shipped table carries 0.8 and not 1.
    //
    // R1g-11 caveat, and it is the reason `hpMinMedian` below is not the whole story: this median is
    // pooled over both journeys, and the two did not agree. Split on the R1g-11 tree, classic read
    // 0.280 and evolution **0.147** - under G2. The cause was the horde, not the Boss (zeroing
    // `enemyDamage` lifted evolution to 0.839), so `threatModel.test.ts`'s `attributes the evolution
    // health floor` test owned it and R1g-12 fixed it there.
    //
    // R1g-12 re-measured this arm after recalibrating that table: the pooled median is **0.449**, the
    // split is classic 0.455 / evolution 0.364, and the shipped TTK is **62.6s** with **2** casts a
    // fight. Both halves are inside G2 now. The lesson survives the fix and is why the split is
    // still quoted here: a pooled median that passes is exactly the shape of reading that hid the
    // 0.147, so do not re-pool without reading the split.
    expect(after.hud.ttkMedian).toBeGreaterThanOrEqual(TARGET.window.min);
    expect(after.hud.ttkMedian).toBeLessThanOrEqual(TARGET.window.max);
    expect(after.hud.hpMinMedian).toBeGreaterThanOrEqual(TARGET.floor);
    expect(after.hud.landedPerRunMedian).toBe(0);
    expect(after.hud.winRate).toBeGreaterThan(.6);
    // The two bracketing arms, recorded rather than assumed: `dodge` clears the floor too, and
    // `browser` - the arm that never presses 闪避 - misses it, which is the cost of not dodging and
    // the reason every harness that claims to be the browser bot's twin now runs the HUD rule.
    //
    // R1g-12 re-derived this bar, and the direction is worth stating plainly: the browser arm's
    // floor rose from **0** to **0.202** when the horde table came down 20%. It no longer dies
    // outright, but it still ends under G2's 0.25 - so the claim the assertion makes ("not dodging
    // costs you G2") is unchanged while the claim R1g-11 was making ("not dodging kills you") is
    // weaker than it was. That is a real design consequence of this slice's knob, not an artefact:
    // it is recorded in `evidence/R1g-12/IMPLEMENTATION.md` and carried as a question for the G4
    // wording, because the only lever that would restore the old sharpness is a Boss knob, and every
    // Boss knob is out of scope here.
    expect(after.dodge.hpMinMedian).toBeGreaterThanOrEqual(TARGET.floor);
    expect(after.browser.hpMinMedian).toBeLessThan(TARGET.floor);
    // ...and it is measurably worse than *both* arms that do dodge, which is the claim the old
    // absolute `< .5` was standing in for. R1g-12 measured the non-dodging arm at **71.2% wins** (it
    // was ~41% before the horde table came down 20%), so the absolute bar is gone. An ordering is
    // the right form: it says "not dodging costs you runs" without asserting a level that a legal
    // balance move can move out from under it - which is exactly what just happened to `< .5`.
    expect(after.browser.winRate).toBeLessThan(after.hud.winRate);
    expect(after.browser.winRate).toBeLessThan(after.dodge.winRate);
    // The contact sweep, and R1g-12 changed what it says. R1g-11 shipped 0.8 because it was the
    // *only* row inside G2 - at 1.0 the floor read 0.240, under 0.25. With the horde table weaker
    // every row clears: 1.0 -> **0.414**, 0.9 -> 0.438, 0.8 -> **0.449**. So 0.8 is no longer the
    // least change that clears; it is a retained margin. Re-deciding it is a Boss knob and therefore
    // out of this slice's scope, so what is asserted here is what still holds: the lever is
    // monotone in the direction it should be, and every row is inside G2. The re-decision is
    // carried to `QUEUE.md`'s R1g-13 with these three numbers.
    const contactFloors = contactSweep.map(row => row.hud.hpMinMedian);
    expect(contactFloors[2]!).toBeGreaterThan(contactFloors[1]!);
    expect(contactFloors[1]!).toBeGreaterThan(contactFloors[0]!);
    for (const row of contactSweep) {
      expect(row.hud.hpMinMedian, `bossContactDamage ${row.bossContactDamage}`).toBeGreaterThanOrEqual(TARGET.floor);
    }
    expect(threatV2.bossContactDamage).toBe(.8);
    const report = {
      slice: 'R1g-11',
      base: 'R1g-10',
      harness: 'src/core/bossThreat.test.ts',
      frameHz: 1 / FRAME,
      /**
       * The arm list, and which one each reading belongs to. `browser` is the declared fixed
       * instrument; `dodge` reads telegraph geometry (a ceiling on a player's information); `hud`
       * reads only what the shipped UI renders, so it is the arm the browser suite is a twin of.
       */
      instrument: {
        browser: 'the fixed instrument: options[0], one press per step, the f key, a 65px standoff, no warning term and no dodge button',
        dodge: 'the same player, except it leaves any live telegraph it is inside. Reads geometry; never presses 闪避, so it is a lower bound',
        hud: 'NEW. Reads `boss.next` (rendered as `aria-label="首领招式"`) and presses 闪避. Never touches `telegraphs` - this is the twin of tests/settlement.spec.ts',
        browserCanDodge: false,
        hudCanDodge: true,
        note: 'the 闪避 button ships at aria-label="闪避" / Space: 0.35s i-frame, 4.5s cd, a ~51px dash. The fixed instrument never presses it, which is the instrument gap this slice closes.',
        viewport: [390, 844],
        rules: 'threat-v2',
      },
      target: { ...TARGET },
      /** `k` is the multiple G4's chain implies; the table is what actually ships it. */
      multiple: k,
      shippedTable: { bossCastCooldown: threatV2.bossCastCooldown, bossSkillDamage: threatV2.bossSkillDamage, bossContactDamage: threatV2.bossContactDamage, bossHp: { ...threatV2.bossHp } },
      /** R1g-10's table, for the "before" column. */
      before,
      after,
      contactSweep,
      /** Which constraints each arm breaks on the shipped table. Empty means it ships as measured. */
      breaks: (Object.keys(after) as readonly Policy[]).reduce<Record<string, string[]>>((acc, policy) => {
        const row = after[policy];
        acc[policy] = [row.hpMinMedian < TARGET.floor ? 'G2 floor' : undefined, row.ttkMedian < TARGET.window.min || row.ttkMedian > TARGET.window.max ? 'G3 window' : undefined].filter((value): value is string => !!value);
        return acc;
      }, {}),
      /**
       * The verdict, derived. `hud` is the instrument of record: it is the twin of the browser
       * suite, so a value that only clears on `dodge` would ship a build the acceptance test
       * cannot reproduce. The answer is the *highest* contact scale (i.e. the least change) that
       * puts `hud` inside both G2 and G3; `undefined` means the sweep has to be extended.
       */
      conclusion: {
        /**
         * What reacting to the telegraphs cost *before* the cadence landed: the hud arm times out,
         * it does not die. 3.03% wins with 64 of 66 runs ending on the clock, against 38 HP of Boss
         * damage. This is the slice's headline and it is the reason G4 is worth landing at all.
         */
        beforeHud: { winRate: before.hud.winRate, losses: before.hud.losses, hpMin: before.hud.hpMinMedian, bossDamage: before.hud.lostToBossMedian },
        afterHud: { hpMin: after.hud.hpMinMedian, ttk: after.hud.ttkMedian, winRate: after.hud.winRate },
        /**
         * The verdict, derived. `hud` is the instrument of record: it is the twin of the browser
         * suite, so a value that only clears on `dodge` would ship a build the acceptance test
         * cannot reproduce. These are the contact settings that put `hud` inside both G2 and G3;
         * the shipped table takes the highest one (the least reduction).
         */
        contactClearsG2: contactSweep.filter(row => row.hud.hpMinMedian >= TARGET.floor && row.hud.ttkMedian >= TARGET.window.min && row.hud.ttkMedian <= TARGET.window.max)
          .map(row => ({ bossContactDamage: row.bossContactDamage, hpMin: row.hud.hpMinMedian, ttk: row.hud.ttkMedian, winRate: row.hud.winRate })),
      },
      /**
       * `before` + `after` = 12 arm-runs x 33. The sweep adds 3 rows x 2 journeys and hits no cache
       * entry: it writes `contact` explicitly where `after` omits it, so even its 0.8 row - which
       * reproduces `after.hud`'s numbers - is recomputed rather than served. Plus the cue check.
       */
      totalRuns: 12 * SEEDS.length + 3 * 2 * SEEDS.length + SENSITIVITY_SEEDS.length * 2,
    };
    try {
      mkdirSync(HUD_EVIDENCE, { recursive: true });
      writeFileSync(resolve(HUD_EVIDENCE, 'boss-hud-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.after.hud.runs).toBeGreaterThan(0);
  }, 1_800_000);
});

/**
 * ## R2-F-CADENCE - how many dodge decisions a Boss fight should contain
 *
 * `R1g-10` bought G2/G3/G4 by trading cadence for per-hit weight. `threatV2.bossCastCooldown` and
 * `bossSkillDamage` both hold 14.31, so `skillScale / castCdScale` = `0.6 * 14.31 / 14.31` =
 * `bossDamage` = 0.6 is unchanged - the same aggregate arrives in ~1/14th as many moves. The cost
 * was recorded as "total x0.6" and accepted. What was never asked is what that does to the
 * **player's** side of the fight: the encounter holds **two** casts, so the 闪避 button gets two
 * decisions. `R2-F-INST` measured the two-cast count; this block states the design question and
 * prices the candidates.
 *
 * **This block lands nothing.** It sweeps two arms of the same lever - `cadence only` (the cooldown
 * shortens, each move keeps its weight, so G2 pays) and `constant aggregate` (both scale, so G4
 * pays). G4 has no headroom: `R1g-12/boss-cadence-report.json`'s `requiredMultiple` is 14.31, which
 * is exactly the shipped `bossSkillDamage`, i.e. the weakest move already sits on 15.00%. The
 * options and their re-calibration bills live in `evidence/R2-F-CADENCE/IMPLEMENTATION.md`; the
 * choice belongs to the design owner, not to a harness.
 */
describe('Boss cadence, and the dodge budget it sets (R2-F-CADENCE)', () => {
  const EVIDENCE2 = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R2-F-CADENCE');
  /**
   * Every arm x multiple x policy. `scaleSkill` is the whole difference between the two arms:
   * `false` holds `bossSkillDamage` (G4 keeps its 15% and the extra moves are extra damage), `true`
   * scales it with the cooldown so `skillScale / castCdScale` stays `bossDamage` (the total is held
   * and every move gets weaker). At `m = 1` the two arms *are* the shipped table, so it is carried
   * once, as the control. Both policies are read because the two arms pay on different arms: a
   * shorter cooldown at full weight is invisible to a player who dodges everything and lands in full
   * on one who never does.
   */
  const ROWS: { label: string; m: number; scaleSkill: boolean; policy: Policy }[] =
    (['hud', 'browser'] as const).flatMap(policy => [
      { label: 'cadence only', m: .5, scaleSkill: false, policy },
      { label: 'cadence only', m: .75, scaleSkill: false, policy },
      { label: 'constant aggregate', m: .5, scaleSkill: true, policy },
      { label: 'constant aggregate', m: .75, scaleSkill: true, policy },
      { label: 'constant aggregate', m: 1, scaleSkill: true, policy },
    ]);
  /** The timeline adds the extreme point, where the lever's shape is clearest, and logs it. */
  const TIMELINE_MULTIPLES = [.25, .5, .75, 1] as const;
  const TIMELINE_SEEDS = [1, 5, 11, 21, 33];
  const round4 = (value: number): number => Math.round(value * 10000) / 10000;
  const round1 = (value: number): number => Math.round(value * 10) / 10;
  const tally = (list: readonly ThreatRun[]): Record<string, number> =>
    list.filter(item => !item.win).reduce<Record<string, number>>((acc, item) => ({ ...acc, [item.endReason ?? 'none']: (acc[item.endReason ?? 'none'] ?? 0) + 1 }), {});

  /** One row of one arm, **split by journey** - a pool is exactly what hid R1g-11's 0.147. */
  const rowFor = (row: { label: string; m: number; scaleSkill: boolean; policy: Policy }) => {
    const skill = row.scaleSkill ? row.m : 1;
    return {
      arm: row.label, policy: row.policy, castCdMultiplier: row.m, skillScale: skill,
      perJourney: JOURNEYS.map(journey => {
        const list = runs(journey, threatV2.bossDamage, row.policy, SEEDS, { castCd: row.m, skill, hp: 1 });
        const perShape = (['circle', 'line', 'cone'] as const).map(shape => {
          const all = list.flatMap(item => item.hits.filter(hit => hit.shape === shape && !hit.shielded && !hit.invulnerable));
          return { shape, hits: all.length, fractionMedian: all.length ? round4(median(all.map(hit => hit.lost / hit.maxHp))) : 0 };
        });
        const fractions = perShape.filter(shape => shape.hits > 0).map(shape => shape.fractionMedian);
        // G4 reads each move's **phase-1** instance (that is the weakest one, so it binds), so the
        // measured phase-1 hit is the number the acceptance is actually about. Read off `phaseFromRaw`
        // because the Boss bakes the phase in at cast time; a warning that resolves after a phase
        // change carries the phase it was cast in.
        const phase1 = list.flatMap(item => item.hits.filter(hit => hit.shape !== 'contact' && Math.round(hit.phaseFromRaw) === 1 && !hit.shielded && !hit.invulnerable));
        const phase1Fraction = phase1.length ? round4(median(phase1.map(hit => hit.lost / hit.maxHp))) : 0;
        const hpMin = round4(median(list.map(item => item.minHpRatio)));
        const ttk = round1(ttkMedian(list));
        return {
          journey, runs: list.length,
          /** Dodge decisions per fight. `hudCuesMedian === castsMedian` is asserted, so it is both. */
          castsMedian: median(list.map(item => item.casts)),
          castsMin: Math.min(...list.map(item => item.casts)),
          castsMax: Math.max(...list.map(item => item.casts)),
          cuesMedian: median(list.map(item => item.hudCues)),
          /** G2's band is `.25-.60`. */
          hpMinMedian: hpMin,
          /** G3's window is `60-90s`. */
          ttkMedian: ttk,
          winRate: winRate(list),
          avoidRate: avoidRate(list),
          losses: tally(list),
          /** G4, on the measured post-mitigation cost rather than the analytic one. */
          perShape,
          cheapestMove: fractions.length ? Math.min(...fractions) : 0,
          heaviestMove: fractions.length ? Math.max(...fractions) : 0,
          phase1Hits: phase1.length,
          phase1Fraction,
          /** The verdicts, derived from the numbers above rather than from the target's prose. */
          g2: hpMin >= TARGET.floor && hpMin <= .60,
          g3: ttk >= TARGET.window.min && ttk <= TARGET.window.max,
          g4: phase1.length ? phase1Fraction >= TARGET.skillFraction : null,
        };
      }),
    };
  };

  /**
   * The cast timeline, logged. `t` is seconds after the Boss spawns, `life` is the window the player
   * has to leave the shape, and `dodgeReady` is whether the 闪避 button was off cooldown when the
   * cue appeared. **A window the player cannot act in is not an opportunity**, so both are counted
   * separately rather than folded into the cast count.
   */
  const timeline = () => TIMELINE_MULTIPLES.map(m => ({
    castCdMultiplier: m, skillScale: m, seeds: TIMELINE_SEEDS.length,
    perJourney: JOURNEYS.map(journey => {
      const list = TIMELINE_SEEDS.map(seed => run(journey, seed, threatV2.bossDamage, 'hud', { castCd: m, skill: m, hp: 1 }, true));
      const events = list.flatMap(item => item.castLog ?? []);
      const byPhase = [...new Set(events.map(event => event.phase))].sort().map(phase => {
        const inPhase = events.filter(event => event.phase === phase);
        return {
          phase, casts: inPhase.length,
          shapes: inPhase.reduce<Record<string, number>>((acc, event) => ({ ...acc, [event.shape]: (acc[event.shape] ?? 0) + 1 }), {}),
        };
      });
      return {
        journey, runs: list.length, casts: events.length,
        castsMedian: median(list.map(item => item.casts)),
        shapes: events.reduce<Record<string, number>>((acc, event) => ({ ...acc, [event.shape]: (acc[event.shape] ?? 0) + 1 }), {}),
        byPhase,
        /** `1` means every cast was a decision the player could actually make. */
        actionableShare: events.length ? round4(events.filter(event => event.dodgeReady && event.live === 1).length / events.length) : 0,
        windowsMedian: events.length ? round4(median(events.map(event => event.life))) : 0,
        hpFracMedian: events.length ? round4(median(events.map(event => event.hpFrac))) : 0,
        hpFracMin: events.length ? round4(Math.min(...events.map(event => event.hpFrac))) : 0,
        /** Casts where the button was still grey, or two shapes shared the screen. */
        blockedByCooldown: events.filter(event => !event.dodgeReady).length,
        blockedByOverlap: events.filter(event => event.live > 1).length,
        /** Seconds after spawn of the first `circle` cast, or `null` if the fight never reaches it. */
        firstCircleAt: events.find(event => event.shape === 'circle')?.t ?? null,
      };
    }),
  }));

  let sweepCache: ReturnType<typeof rowFor>[] | undefined;
  let timelineCache: ReturnType<typeof timeline> | undefined;
  const sweep = () => (sweepCache ??= ROWS.map(rowFor));
  const timelineOnce = () => (timelineCache ??= timeline());

  it('records what the fight offers, cast by cast, and where a window stops being an opportunity', () => {
    const rows = timelineOnce();
    const control = rows.find(row => row.castCdMultiplier === 1)!;
    for (const journey of control.perJourney) {
      // Two casts a fight, and both are decisions the player can actually make: the 4.5s cooldown is
      // spent long before the next cue, and no two shapes share the screen. That is what makes the
      // sweep's `castsMedian` mean "dodge decisions" *here*; the rows below say where it stops.
      expect(journey.castsMedian, `${journey.journey}: casts per shipped fight`).toBe(2);
      expect(journey.actionableShare, `${journey.journey}: shipped windows are actionable`).toBe(1);
      expect(journey.blockedByCooldown + journey.blockedByOverlap, `${journey.journey}: nothing is blocked`).toBe(0);
      // Two casts sample the three-skill cycle at two points, so at most two moves can be named - and
      // which two is a function of the phase the Boss is in at cast time, i.e. of the player's own
      // DPS. Recorded rather than asserted: `byPhase` is the receipt.
      expect(Object.keys(journey.shapes).length, `${journey.journey}: two casts name at most two moves`).toBeLessThanOrEqual(2);
    }
    // The shipped fight never reaches the circle move - the one the player must react to. That is
    // structural at this cadence, not luck: the third cast is scheduled at 99.32s, past the 90s the
    // stage allows, and the phase the Boss reaches by cast time does not land on the circle's slot.
    expect(control.perJourney.every(journey => journey.firstCircleAt === null), 'the shipped fight never reaches 震地斩').toBe(true);
    // The lever: a shorter cooldown buys casts, and with them the move the shipped fight never shows.
    const shortest = rows.find(row => row.castCdMultiplier === .25)!;
    for (const journey of shortest.perJourney) {
      const shipped = control.perJourney.find(row => row.journey === journey.journey)!;
      expect(journey.casts / journey.runs, `${journey.journey}: a shorter cadence buys casts`)
        .toBeGreaterThan(shipped.casts / shipped.runs);
      expect(journey.firstCircleAt, `${journey.journey}: 震地斩 arrives`).not.toBeNull();
    }
  }, 1_800_000);

  it('sweeps both arms of the cadence lever, split by journey', () => {
    // The shipped calibration itself, pinned. Nothing else in the suite asserts these two: `bossBudget`
    // pins `spawnRadius` / `chargeRange` / `bossDamage` / `bossHp` / `bossPhaseSpawnInterval` and
    // stops. Since this slice is *about* that knob, the value it is measured on is recorded here, so a
    // future change has to come through this line instead of drifting.
    expect(threatV2.bossCastCooldown).toBe(14.31);
    expect(threatV2.bossSkillDamage).toBe(14.31);
    for (const row of sweep()) {
      for (const journey of row.perJourney) {
        // Every cast is named, so the cast count *is* the cue count - the thing G9's press count would
        // move with. Only the `hud` arm has this readout: the `browser` arm never reads a cue, so its
        // `hudCues` is 0 by construction and the equality is not a fact about the Boss.
        if (row.policy === 'hud') {
          expect(journey.cuesMedian, `${row.arm} m=${row.castCdMultiplier} ${journey.journey}: every cast is named`)
            .toBe(journey.castsMedian);
        }
        expect(journey.runs, `${row.arm} m=${row.castCdMultiplier} ${row.policy} ${journey.journey}: verdict rows run on all 33`).toBe(SEEDS.length);
      }
    }
    // The control is the shipped table on the instrument of record, and it is R2-F-INST's reading:
    // two casts a fight, inside both G2 and G3 on both journeys. The candidate rows are *recorded*,
    // not asserted to a chosen value.
    const control = sweep().find(row => row.policy === 'hud' && row.castCdMultiplier === 1)!;
    for (const journey of control.perJourney) {
      expect(journey.castsMedian, `${journey.journey}: the shipped cadence is two decisions`).toBe(2);
      expect(journey.g2, `${journey.journey}: the shipped table is inside G2`).toBe(true);
      expect(journey.g3, `${journey.journey}: the shipped table is inside G3`).toBe(true);
    }
    // The lever moves the headline on both journeys, which is what makes it a lever at all.
    const halved = sweep().find(row => row.policy === 'hud' && row.arm === 'constant aggregate' && row.castCdMultiplier === .5)!;
    for (const journey of halved.perJourney) {
      expect(journey.castsMedian, `${journey.journey}: halving the cooldown buys casts`)
        .toBeGreaterThan(control.perJourney.find(item => item.journey === journey.journey)!.castsMedian);
    }
    // And the control reproduces the ordering R1g-11 established between the two arms: a player who
    // never presses 闪避 ends under G2 while the one who does stays inside it. If this ever inverts,
    // the "not dodging costs you G2" claim the whole slice rests on has stopped being true.
    const browser = sweep().find(row => row.policy === 'browser' && row.castCdMultiplier === 1)!;
    for (const journey of browser.perJourney) {
      expect(journey.hpMinMedian, `${journey.journey}: not dodging ends under G2`)
        .toBeLessThan(control.perJourney.find(item => item.journey === journey.journey)!.hpMinMedian);
    }
    // G4 is the only acceptance that separates the two arms, and it is the binding one: the shipped
    // table sits exactly on its 15% floor (R1g-10's `requiredMultiple` is the shipped 14.31), so
    // holding the total by scaling the weight down must miss it, while holding the weight and
    // shortening the cooldown must not. Read on the arm that actually takes hits - the `hud` arm
    // dodges 93-100% of them away, so it barely has a per-hit reading at all.
    let compared = 0;
    for (const m of [.5, .75]) {
      const held = sweep().find(row => row.policy === 'browser' && row.arm === 'cadence only' && row.castCdMultiplier === m)!;
      const scaled = sweep().find(row => row.policy === 'browser' && row.arm === 'constant aggregate' && row.castCdMultiplier === m)!;
      for (const journey of held.perJourney) {
        const other = scaled.perJourney.find(item => item.journey === journey.journey)!;
        if (!journey.phase1Hits || !other.phase1Hits) continue;
        expect(journey.phase1Fraction, `${journey.journey} m=${m}: holding the weight keeps G4, scaling it does not`)
          .toBeGreaterThan(other.phase1Fraction);
        compared++;
      }
    }
    expect(compared, 'the G4 comparison ran on the arm that takes hits').toBeGreaterThanOrEqual(2);
  }, 1_800_000);

  it('writes the evidence report', () => {
    const schedule = {
      spawn: round1(1.7 * threatV2.bossCastCooldown),
      recurringPhase1: round1(Math.max(.9, 3 - 1 * .38) * threatV2.bossCastCooldown),
      recurringPhase3: round1(Math.max(.9, 3 - 3 * .38) * threatV2.bossCastCooldown),
      thirdCastAtPhase1: round1((1.7 + 2 * Math.max(.9, 3 - .38)) * threatV2.bossCastCooldown),
      window: firstStage.duration - firstStage.bossAt,
    };
    const report = {
      slice: 'R2-F-CADENCE', base: 'R2-F-SUFFIX',
      question: 'How many dodge decisions should a 90s Boss fight contain, and what does each cadence cost in G2/G3/G4?',
      /** The shipped constants every row is a multiplier on, read from the table rather than retyped. */
      shipped: {
        bossCastCooldown: threatV2.bossCastCooldown, bossSkillDamage: threatV2.bossSkillDamage,
        bossDamage: threatV2.bossDamage, bossContactDamage: threatV2.bossContactDamage, bossHp: { ...threatV2.bossHp },
      },
      /** The schedule the sweep is read against, in seconds after spawn, at the shipped table. */
      schedule,
      /** GDD §4. `window` is G3, `floor` is G2, `skillFraction` is G4's legibility floor. */
      target: TARGET,
      /**
       * Both arms are read. `hud` is G2's instrument of record (the browser suite's twin); `browser`
       * never presses 闪避 and is what "not dodging costs you" is measured on. A cadence change is
       * nearly invisible on the first and lands in full on the second.
       */
      policies: ['hud', 'browser'],
      /**
       * G4's headroom, quoted from R1g-10's own report rather than recomputed here: the multiple
       * `bossSkillDamage` needs so the weakest move costs 15% of max HP is exactly the shipped 14.31,
       * so the arm that shortens the cooldown *and* the weight cannot preserve G4. The damage chain
       * lives in that report; this is the number that says there is no room under it.
       */
      g4Headroom: { requiredMultiple: 14.31, shippedSkillDamage: threatV2.bossSkillDamage, headroom: round4(threatV2.bossSkillDamage / 14.31) },
      /** 10 rows x 33 seeds x 2 journeys on the `hud` arm, split by journey. */
      rows: sweep(),
      /** The constant-aggregate arm at four multiples, logged on five seeds - the window receipt. */
      timeline: timelineOnce(),
      /** Named so a reader does not mistake a measurement for a choice: nothing here is landed. */
      note: 'Measurements on the hud arm (the browser suite\'s twin). No cadence is chosen by this slice.',
      runs: { rows: ROWS.length * 2 * SEEDS.length, timeline: TIMELINE_MULTIPLES.length * 2 * TIMELINE_SEEDS.length },
    };
    try {
      mkdirSync(EVIDENCE2, { recursive: true });
      writeFileSync(resolve(EVIDENCE2, 'cadence-sweep.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.rows).toHaveLength(ROWS.length);
    expect(report.schedule.window).toBe(90);
    expect(report.g4Headroom.headroom).toBe(1);
  }, 1_800_000);
});

/**
 * R2-F-CIRCLE: `震地斩` is the ring move - the Boss telegraphs a disc and the answer is "leave
 * where you are standing". The queue records it as unmeasurable for two independent reasons: it
 * needs a third cast, and it "cannot hit the boss cell's player even if it arrived" because the
 * cell stands the player ~90px out and the radius is 70. This block measures both claims instead of
 * restating them. Nothing is landed: the geometry is already in the shipped rule, so the only
 * question the slice has to answer is which cell can show it and what the G4 row it carries is
 * worth. The 33-seed reach rows reuse R2-F-CADENCE's cached runs; only the per-cast geometry, which
 * is a property of one telegraph rather than a balance number, runs on the smaller seed set.
 */
describe('The ring move, and the coverage it carries (R2-F-CIRCLE)', () => {
  const EVIDENCE3 = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R2-F-CIRCLE');
  const round4 = (value: number): number => Math.round(value * 10000) / 10000;
  const round1 = (value: number): number => Math.round(value * 10) / 10;
  const ARMS: readonly { label: string; cadence: Cadence }[] = [
    { label: 'shipped', cadence: { castCd: 1, skill: 1, hp: 1 } },
    { label: 'cadence .75', cadence: { castCd: .75, skill: 1, hp: 1 } },
  ];

  /** (a) Is the ring reachable at all? Read off `hits`, so no `log` is needed. */
  const reach = () => ARMS.map(arm => ({
    arm: arm.label, castCdMultiplier: arm.cadence.castCd,
    perPolicy: (['browser', 'hud'] as const).map(policy => ({
      policy,
      perJourney: JOURNEYS.map(journey => {
        const list = runs(journey, threatV2.bossDamage, policy, SEEDS, arm.cadence);
        const circles = list.flatMap(item => item.hits.filter(hit => hit.shape === 'circle' && !hit.shielded && !hit.invulnerable));
        return {
          journey, runs: list.length, circleHits: circles.length,
          phases: [...new Set(circles.map(hit => Math.round(hit.phaseFromRaw)))].sort((a, b) => a - b),
          phase1CircleHits: circles.filter(hit => Math.round(hit.phaseFromRaw) === 1).length,
          fractionMedian: circles.length ? round4(median(circles.map(hit => hit.lost / hit.maxHp))) : 0,
        };
      }),
    })),
  }));

  /** (b) Where the ring's centre is, and what leaving it costs. Opt-in log, one row per cast. */
  const geometry = () => ARMS.map(arm => ({
    arm: arm.label, castCdMultiplier: arm.cadence.castCd,
    perPolicy: (['browser', 'hud', 'dodge'] as const).map(policy => ({
      policy,
      perJourney: JOURNEYS.map(journey => {
        const list = runs(journey, threatV2.bossDamage, policy, SENSITIVITY_SEEDS, arm.cadence, true);
        const events = list.flatMap(item => item.circleLog ?? []);
        const landed = events.filter(event => event.landed), escaped = events.filter(event => !event.landed);
        return {
          journey, runs: list.length, circles: events.length,
          hits: list.reduce((sum, item) => sum + item.hits.filter(hit => hit.shape === 'circle').length, 0),
          rValues: [...new Set(events.map(event => event.r))].sort((a, b) => a - b),
          /** The claim under test: "the cell stands the player 90px away, and `90 > r = 70`". */
          distAtCastMax: events.length ? round4(Math.max(...events.map(event => event.distAtCast))) : null,
          standoffMin: events.length ? round1(Math.min(...events.map(event => event.standoff))) : null,
          standoffMax: events.length ? round1(Math.max(...events.map(event => event.standoff))) : null,
          travelLandedMedian: landed.length ? round1(median(landed.map(event => event.travel))) : null,
          travelEscapedMedian: escaped.length ? round1(median(escaped.map(event => event.travel))) : null,
          /** Seconds after spawn; `null` when the fight never reaches the move. */
          firstCircleAt: events.length ? round1(Math.min(...events.map(event => event.t))) : null,
          byPhase: [...new Set(events.map(event => event.phase))].sort((a, b) => a - b).map(phase => ({
            phase, casts: events.filter(event => event.phase === phase).length,
            landed: events.filter(event => event.phase === phase && event.landed).length,
          })),
        };
      }),
    })),
  }));

  let reachCache: ReturnType<typeof reach> | undefined;
  let geometryCache: ReturnType<typeof geometry> | undefined;
  const reachOnce = () => (reachCache ??= reach());
  const geometryOnce = () => (geometryCache ??= geometry());

  it('shows the ring lands in an existing cell, and that its centre is the player', () => {
    const rows = reachOnce();
    // Claim (b), refuted: the queue says the ring "cannot hit the boss cell's player even if it
    // arrived". The `browser` arm - the declared fixed instrument - already records rings at the
    // shipped cadence, because which slot of the three-skill cycle a cast lands on is a function of
    // the phase, and the phase at cast time is a function of the player's own DPS (R2-F-BOSSPHASE).
    const shipped = rows.find(row => row.castCdMultiplier === 1)!;
    const browser = shipped.perPolicy.find(row => row.policy === 'browser')!;
    // It is not reachable on *every* journey at the shipped cadence - `evolution` records none on
    // these 33 seeds - which is itself the finding: whether the move arrives is a function of the
    // phase at cast time, and the phase is a function of the player's own DPS (R2-F-BOSSPHASE), not
    // of the cell's geometry. What the assertion has to carry is that the cell *can* show it.
    expect(browser.perJourney.reduce((sum, journey) => sum + journey.circleHits, 0),
      'shipped/browser: the ring does land in an existing cell').toBeGreaterThan(0);
    // The `hud` arm (G2's instrument of record) never sees it at the shipped cadence: the fight ends
    // after two casts, and two casts sample two slots of a three-slot cycle.
    const hud = shipped.perPolicy.find(row => row.policy === 'hud')!;
    for (const journey of hud.perJourney) {
      expect(journey.circleHits, `shipped/hud/${journey.journey}: two casts miss the ring`).toBe(0);
    }
    // Shortening the cooldown alone - the weight is untouched, so this is R2-F-CADENCE's O2 - puts
    // the move back on the field, which is the coverage answer: the cell needs the move to arrive,
    // not a different standoff.
    const geo = geometryOnce().find(row => row.castCdMultiplier === .75)!;
    // "Arrives" is read from the cast log, not from `hits`. The two are not the same measurement:
    // the `hud` arm is the arm that *leaves*, so on it a ring that arrives is a ring that misses.
    // Conflating them is how this assertion was first written, and it failed on `hud` for exactly
    // that reason - a red that was the finding, not a bug.
    for (const policy of geo.perPolicy) {
      expect(policy.perJourney.reduce((sum, journey) => sum + journey.circles, 0),
        `${geo.arm}/${policy.policy}: the ring arrives`).toBeGreaterThan(0);
    }
    // And on the arm that never reads a warning it lands: the reachability answer at .75.
    const short = rows.find(row => row.castCdMultiplier === .75)!;
    const shortBrowser = short.perPolicy.find(row => row.policy === 'browser')!;
    expect(shortBrowser.perJourney.reduce((sum, journey) => sum + journey.circleHits, 0),
      'cadence .75/browser: and it lands').toBeGreaterThan(0);

    let seen = 0;
    const standoffs: number[] = [];
    for (const policy of geo.perPolicy) for (const journey of policy.perJourney) {
      if (!journey.circles) continue;
      seen += journey.circles;
      // The measured refutation: the ring is centred on the player's position at cast time, so the
      // player's distance from its centre is **0**, not the 90px the queue compares to `r`. The 90px
      // is the distance from the **Boss** - a different distance, and one the ring never reads.
      expect(journey.distAtCastMax, `${geo.arm}/${policy.policy}/${journey.journey}: centred on the player`).toBe(0);
      standoffs.push(journey.standoffMin!, journey.standoffMax!);
      expect(journey.firstCircleAt!, `${policy.policy}/${journey.journey}: inside the 90s window`).toBeLessThan(90);
    }
    expect(seen, 'the geometry is measured on real rings, not reasoned about').toBeGreaterThan(0);
    // And the standoff is a **different distance from a different point**. It is measured non-zero,
    // and it straddles `r` rather than sitting outside it: on this instrument the player hovers
    // 65-90px from the Boss while `r` is 70 (86 in phase 3), so "standoff > r" is true about half the
    // time. That is the whole reason the queue's claim proves nothing - the ring's hit test reads
    // `distAtCast`, which is 0, and never reads the standoff at all.
    expect(Math.min(...standoffs), 'the player does stand off the Boss').toBeGreaterThan(0);
    expect(Math.max(...standoffs), 'and the standoff straddles the radius instead of clearing it').toBeLessThan(86);
    // The `dodge` arm reaches it too, and it is the arm that can actually leave: recorded, not
    // asserted to a value, because how many rings a fight reaches is the Boss's business.
    const dodged = geo.perPolicy.find(row => row.policy === 'dodge')!;
    expect(dodged.perJourney.some(journey => journey.circles > 0), 'the dodge arm sees rings too').toBe(true);
  }, 1_800_000);

  it('prices what the unobserved move carries, and the row that silently drops it', () => {
    const needed = multiples();
    const circle = needed.perShape.find(entry => entry.shape === 'circle')!;
    const line = needed.perShape.find(entry => entry.shape === 'line')!;
    const cone = needed.perShape.find(entry => entry.shape === 'cone')!;
    // G4 asks for *every* move, so the weakest one binds. The ring is the heaviest (`1.25` against
    // `1.15` / `1.22`), so it needs the **smallest** multiple: the move the shipped 90s reading
    // never sees is not the move that sets the bar. The coverage gap is on the loose side of G4.
    expect(circle.multiple, 'the heaviest move needs the least').toBeLessThan(line.multiple);
    expect(circle.multiple).toBeLessThan(cone.multiple);
    expect(needed.required, 'and the line is what binds').toBe(line.multiple);
    expect(needed.required).toBe(14.31);
    // The row that drops it: `perShape` is filtered to `hits > 0` before `cheapestMove` /
    // `heaviestMove` are read, so a shape with no observed hit is silently absent from the G4
    // reading rather than reported as missing. On the shipped `hud` arm the ring is that shape - and
    // it is not the only one: the observed row set is *smaller* than the three moves G4 asks about,
    // so the acceptance's measured half is carried by fewer moves than its analytic half.
    const perShape = (['circle', 'line', 'cone'] as const).map(shape => {
      const all = JOURNEYS.flatMap(journey => runs(journey, threatV2.bossDamage, 'hud', SEEDS, NO_CADENCE))
        .flatMap(item => item.hits.filter(hit => hit.shape === shape && !hit.shielded && !hit.invulnerable));
      return { shape, hits: all.length };
    });
    expect(perShape.find(entry => entry.shape === 'circle')!.hits, 'absent from the shipped hud reading').toBe(0);
    const observed = perShape.filter(entry => entry.hits > 0);
    expect(observed.length, 'the G4 row set is smaller than the three moves G4 asks about').toBeLessThan(3);
    expect(observed.map(entry => entry.shape), 'and the ring is one of the moves it drops').not.toContain('circle');
  }, 1_200_000);

  it('writes the evidence report', () => {
    const report = {
      slice: 'R2-F-CIRCLE', base: 'R2-F-CADENCE',
      question: 'Is the ring move reachable at all, and what does the G4 row nobody has observed actually carry?',
      /** The rule the geometry is read from, quoted from the tree rather than retyped. */
      rule: {
        centre: 'player.x/y at cast time (FirstBoss.ts:111)',
        radius: { otherwise: 70, phase3: 86 },
        slot: 'mechanics.skills[(skillIndex + phase - 1) % 3] (FirstBoss.ts:106)',
        circleSlot: 'skills[0] = 震地斩',
        castCooldown: threatV2.bossCastCooldown, window: firstStage.duration - firstStage.bossAt,
      },
      target: TARGET,
      /** The shipped 90s fight's slot arithmetic, so the absence is derivable, not asserted. */
      schedule: { firstCastSlot: (1 + 2 - 1) % 3, secondCastSlot: (2 + 3 - 1) % 3, circleSlot: 0 },
      /** (a) reachability on 33 seeds, read off `hits`. */
      reach: reachOnce(),
      /** (b) per-cast geometry on 11 seeds, opt-in `circleLog`. */
      geometry: geometryOnce(),
      /** (c) the G4 multiple each move needs at phase 1; the ring needs the least. */
      g4: {
        required: multiples().required,
        perShape: multiples().perShape.map(entry => ({ shape: entry.shape, multiple: entry.multiple, fraction: entry.fraction })),
        /** The shipped `hud` reading's observed rows: what `cheapestMove` / `heaviestMove` see. */
        observedRows: (['circle', 'line', 'cone'] as const).map(shape => ({
          shape,
          hits: JOURNEYS.flatMap(journey => runs(journey, threatV2.bossDamage, 'hud', SEEDS, NO_CADENCE))
            .flatMap(item => item.hits.filter(hit => hit.shape === shape && !hit.shielded && !hit.invulnerable)).length,
        })),
        /** The filter that makes a zero-hit shape invisible to `cheapestMove` / `heaviestMove`. */
        dropFilter: 'perShape.filter(shape => shape.hits > 0) (bossThreat.test.ts:1338; R2-F-G4ROWS owns what it drops)',
      },
      note: 'Measurements only. The ring needs no new geometry - only a cell where the move arrives.',
      runs: { reach: 2 * 2 * SEEDS.length, geometry: 2 * 3 * 2 * SENSITIVITY_SEEDS.length },
    };
    try {
      mkdirSync(EVIDENCE3, { recursive: true });
      writeFileSync(resolve(EVIDENCE3, 'circle-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    expect(report.rule.radius.otherwise).toBe(70);
    expect(report.g4.required).toBe(14.31);
    expect(report.reach).toHaveLength(2);
  }, 1_800_000);
});

/**
 * ## R2-F-G4ROWS - two ways G4's measured half drops rows, and one of them returns `null`
 *
 * R2-F-CIRCLE measured that `perShape` is filtered to `hits > 0` (`:1338`) before
 * `cheapestMove` / `heaviestMove` are read. This block asks what is left when the filter has run,
 * and what the sibling ternary at `:1370` can return.
 *
 * **The filter, measured.** On the shipped `hud` arm the G4 row set is **one row**: of the three
 * moves G4 asks about (`circle` / `line` / `cone`), only `line` is ever observed - 2 hits on
 * `classic`, 3 on `evolution` - so `filter(hits > 0)` leaves a one-element array and
 * `cheapestMove` and `heaviestMove` are **the same number** (`0.2206`). The "spread" G4's measured
 * half is supposed to describe has collapsed to a single value, and nothing in the row says a move
 * was dropped. The dropped rows are not merely unobserved: **no cast of those moves lands in the
 * shipped window at all**, which is the same fact R2-F-CIRCLE found from the geometry side.
 *
 * **The ternary, measured.** `g4: phase1.length ? ... : null` cannot return `false` on this tree,
 * and not for a boring reason: **every non-contact hit derives phase 3**
 * (`phaseOfRaw`, `:79-82` - the phase is read back out of the damage, not off the encounter, so it
 * is a property of the number, not of the fight). `phase1` is therefore always empty, and
 * `g4: null` is the only value this line ever produces. A reader comparing `g4 === false` - the
 * obvious way to read "G4 was measured and failed" - is answered by `null` instead, which is the
 * same input the "not measured" case would give.
 */
describe('R2-F-G4ROWS - the rows G4 never sees, and the verdict that is only ever null', () => {
  /**
   * One journey -> the two readings G4's measured half is built from. Memoised: both `it`s below and
   * the mechanism checks all read the same arm, and a cold journey is 33 full encounters, so running
   * it more than once per journey only buys the suite wall-clock. `runs` already caches per key; this
   * cache is for the *derivation* on top of it.
   */
  const cache = new Map<Journey, ReturnType<typeof derive>>();
  function derive(journey: Journey) {
    // Exactly the shipped configuration the `control` row uses: `NO_CADENCE` is "no overrides".
    const list = runs(journey, threatV2.bossDamage, 'hud', SEEDS, NO_CADENCE);
    const perShape = (['circle', 'line', 'cone'] as const).map(shape => {
      const all = list.flatMap(item => item.hits.filter(hit => hit.shape === shape && !hit.shielded && !hit.invulnerable));
      return { shape, hits: all.length, fractionMedian: all.length ? Math.round(median(all.map(hit => hit.lost / hit.maxHp)) * 10000) / 10000 : 0 };
    });
    const kept = perShape.filter(shape => shape.hits > 0).map(shape => shape.fractionMedian);
    const moves = list.flatMap(item => item.hits.filter(hit => hit.shape !== 'contact' && !hit.shielded && !hit.invulnerable));
    const contact = list.flatMap(item => item.hits.filter(hit => hit.shape === 'contact' && !hit.shielded && !hit.invulnerable));
    const phase1 = moves.filter(hit => Math.round(hit.phaseFromRaw) === 1);
    const phase1Fraction = phase1.length ? Math.round(median(phase1.map(hit => hit.lost / hit.maxHp)) * 10000) / 10000 : 0;
    return {
      perShape, kept, phase1, phase1Fraction, contact,
      /** Every phase a non-contact move hit derives, off its own damage - never off the encounter. */
      derivedMovePhases: [...new Set(moves.map(hit => Math.round(hit.phaseFromRaw)))].sort((a, b) => a - b),
      /** The same for `contact`, which is *not* what the filter and the ternary are about. */
      derivedContactPhases: [...new Set(contact.map(hit => Math.round(hit.phaseFromRaw)))].sort((a, b) => a - b),
      cheapestMove: kept.length ? Math.min(...kept) : 0,
      heaviestMove: kept.length ? Math.max(...kept) : 0,
      /** Byte-for-byte the shape of `:1370`: `phase1.length ? phase1Fraction >= TARGET.skillFraction : null`. */
      g4: phase1.length ? phase1Fraction >= TARGET.skillFraction : null,
    };
  }
  const g4Rows = (journey: Journey) => {
    let value = cache.get(journey);
    if (!value) { value = derive(journey); cache.set(journey, value); }
    return value;
  };

  it('drops two of three rows, so its two readings are one number, and returns null and never false', () => {
    const EVIDENCE4 = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R2-F-G4ROWS');
    const rows = JOURNEYS.map(journey => {
      const row = g4Rows(journey);
      return {
        journey,
        perShape: row.perShape,
        kept: row.kept,
        cheapestMove: row.cheapestMove,
        heaviestMove: row.heaviestMove,
        phase1Hits: row.phase1.length,
        g4: row.g4,
        derivedMovePhases: row.derivedMovePhases,
        derivedContactPhases: row.derivedContactPhases,
      };
    });
    const report = {
      slice: 'R2-F-G4ROWS',
      question: "What is left of G4's measured half after `filter(hits > 0)`, and what can the sibling ternary return?",
      arm: { policy: 'hud', bossDamage: threatV2.bossDamage, seeds: SEEDS.length, cadence: 'NO_CADENCE (no overrides = the shipped table)' },
      /** What the filter keeps, per journey: one row, so the two readings collapse to one number. */
      filter: {
        site: 'bossThreat.test.ts:1338 -> const fractions = perShape.filter(shape => shape.hits > 0).map(shape => shape.fractionMedian);',
        asked: ['circle', 'line', 'cone'],
        rows,
      },
      /** What the ternary can return. `null` is the only value this line produces on this tree. */
      ternary: {
        site: 'bossThreat.test.ts:1370 -> g4: phase1.length ? phase1Fraction >= TARGET.skillFraction : null,',
        possible: ['null'],
        impossible: ['true', 'false'],
        reason: 'phaseOfRaw (bossThreat.test.ts:79-82) recovers the phase from the damage, not the encounter; every non-contact hit derives phase 3, so `phase1` is always empty.',
        consumers: ['report.g4.required (bossThreat.test.ts:1764) - the measured field `g4` itself has no reader in the suite'],
      },
      note: 'Zero production changes. Instrument only.',
      runs: { journeys: JOURNEYS.length, encountersPerJourney: SEEDS.length },
    };
    try {
      mkdirSync(EVIDENCE4, { recursive: true });
      writeFileSync(resolve(EVIDENCE4, 'g4rows-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }

    for (const journey of JOURNEYS) {
      const row = g4Rows(journey);
      // --- The filter (`:1338`): what is left when it has run. ---
      const zero = row.perShape.filter(entry => entry.hits === 0).map(entry => entry.shape);
      expect(row.perShape, `${journey}: G4 asks about three moves`).toHaveLength(3);
      // R3-E01..07a: classic still observes exactly one shape (`cone`, 0.234) and never the other
      // two; the evolution arm now observes **none** of the three. The harder horde ends its runs
      // before a G4 row lands, so `kept` is empty there and the two readings below are equal for the
      // trivial reason (both are 0). Both halves are recorded rather than averaged: the empty arm is
      // a *new* defect in the instrument's reach, and it is in `handoff/STATE.md` as an unresolved risk.
      const observed = journey === 'classic' ? ['cone'] : [];
      expect(zero, `${journey}: what this arm never observes`)
        .toEqual(['circle', 'line', 'cone'].filter(shape => !observed.includes(shape)));
      expect(row.kept, `${journey}: the filter keeps what was observed`).toHaveLength(observed.length);
      // The whole point: two readings that are supposed to bracket a spread are the same value.
      expect(row.cheapestMove, `${journey}: "cheapest" and "heaviest" are the same number`).toBe(row.heaviestMove);
      // And the survivor is the *heaviest* move in the analytic table (R2-F-CIRCLE's `multiple`
      // ordering), so the one reading carries G4 through its loosest member - when there is one.
      if (observed.length) expect(row.kept[0], `${journey}: the survivor is a real fraction`).toBeGreaterThan(TARGET.skillFraction);

      // --- The ternary (`:1370`): what it can return. ---
      expect(row.phase1, `${journey}: no non-contact hit derives phase 1`).toHaveLength(0);
      expect(row.g4, `${journey}: so the ternary can only produce null`).toBeNull();
      // The mechanism, asserted where it lives: the phase is recovered from the damage, so the
      // encounter's own phase never enters. Every observed move hit derives phase 3.
      expect(row.derivedMovePhases, `${journey}: a non-contact hit is a phase-3 hit, read off its damage`)
        .toEqual(journey === 'classic' ? [3] : []);
      // `contact` hits *do* reach phase 1 - which is why "no phase 1 anywhere" would be the wrong
      // story. The blind spot is specific to the shape rows, not to the encounter.
      expect(row.derivedContactPhases, `${journey}: contact hits do derive phase 1`).toContain(1);
    }
    // Pin the serialised report to what was just verified, so the evidence page cannot drift from
    // the assertions: the shape of the numbers above *is* the row set, and the verdict is `null`.
    for (const row of report.filter.rows) {
      // R3-E01..07a: the classic arm still carries one row, the evolution arm carries none (it
      // observes no G4 row at all now) - so the report is pinned to the same set the loop above
      // verified, per journey, instead of to a count that only classic can meet.
      expect(row.kept, `${row.journey}: the report carries the same row set`).toHaveLength(row.journey === 'classic' ? 1 : 0);
      expect(row.cheapestMove, `${row.journey}: the report carries the collapsed reading`).toBe(row.heaviestMove);
      expect(row.g4, `${row.journey}: the report carries the only verdict the line can produce`).toBeNull();
    }
    expect(report.ternary.possible, 'the report names one possible verdict').toEqual(['null']);
    // The survivor is exactly the reading both fields carry - i.e. `kept[0]` *is* `cheapestMove`,
    // which is what makes "spread" a single value rather than a bracket.
    // R3-E01..07a: the evolution arm now has **no** survivor, so that sentence has no subject there.
    // What it does have is the empty filter's own output, and that is asserted instead: 0, not
    // `undefined`. The distinction is the point - `undefined === 0` is false, so an unguarded
    // `kept[0] === cheapestMove` would be the only thing standing between "the filter kept nothing"
    // and "the reading is missing", and it cannot stand there once the arm is empty.
    for (const row of report.filter.rows) {
      if (row.kept.length) expect(row.kept[0], `${row.journey}: survivor === the reading`).toBe(row.cheapestMove);
      else expect(row.cheapestMove, `${row.journey}: an empty filter reads 0, not undefined`).toBe(0);
    }
  }, 1_200_000);
});

/**
 * ## R2-F-BOSSPHASE - which move a cast becomes is a function of the player's DPS
 *
 * `FirstBoss.ts:106` picks the shape out of the three-move table as
 * `skills[(boss.skillIndex + boss.phase - 1) % 3]`, and `boss.phase` is
 * `ratio <= .35 ? 3 : ratio <= .70 ? 2 : 1` (`:70`) - i.e. it advances with the Boss's
 * **remaining HP**, which is to say with **how much damage the player has already dealt**.
 * `boss.skillIndex` on its own (`:105`, `(skillIndex + 1) % 3`) is a clean, learnable
 * cycle; adding the phase term means the *same* cast index resolves to a *different* move
 * depending on the run's HP trajectory.
 *
 * **Measured on the shipped `hud` arm** (33 seeds, `NO_CADENCE`): every run casts a median
 * of 2 times. The two-cast shape pair is `2:cone -> 3:line` on **24/33** `classic` and
 * **28/33** `evolution` runs - and the deviations are exactly the runs whose DPS differs:
 * `classic` seeds 19/27/29 are still in **phase 1** at their first cast (`hpFrac` 0.40 /
 * 0.50 / 0.75) and see `1:line -> 2:circle -> 3:cone` (three *different* moves), while seed
 * 20 reaches its only cast in **phase 3** and sees `circle` where the modal run's phase-3
 * cast is `line`.
 *
 * **Counterfactual, measured.** Forcing the phase to 1 for every cast - i.e. reading the
 * table as a plain `skillIndex` cycle - changes the resolved shape on **58/61** casts
 * (`classic`) and **59/59** (`evolution`). The phase term is not a rounding detail: it
 * decides almost every move the player ever sees.
 *
 * **What the phase term is for, and what it is not for.** `phase` has a legitimate,
 * load-bearing job: it scales the move's damage (`:107`), the telegraph's size and delay
 * (`:111` / `:118` / `:121`), the Boss's move speed (`:97`), the cooldown (`:124`) and body
 * contact (`:103`). That is "the fight gets harder". Nothing in the GDD asks it to also
 * choose **which** move - G3 (`GDD:325`) wants the three *phases* reached inside a 60-90s
 * window, not a DPS-dependent move order. The index term is the part with no owner.
 *
 * **The early calibration this touches.** `formPressure.test.ts:1616-1617` (and its two
 * sibling copies) assert that `B001-蛮王冲锋` and `B001-旋风断军` both land in the boss
 * cell, and R2-F-INST's comment at `:1613` states the reason: *"two casts, the charge then
 * the cone, both at phase 1"* - slots 1 and 2 of `(skillIndex + phase - 1) % 3`. Rewriting
 * the index to `skillIndex % 3` rotates **every** slot by one (slot 1 -> `震地斩`, slot 2 ->
 * `蛮王冲锋`), so those three assertions would move. This block does **not** make that
 * change; it pins what the current rule decides so the change can be priced.
 */
describe('R2-F-BOSSPHASE - the move index depends on the phase, so it depends on your DPS', () => {
  /** `FirstBoss.ts:106`, exactly: which table slot a cast at `(skillIndex, phase)` resolves to. */
  const slotOf = (skillIndex: number, phase: number): number => (skillIndex + phase - 1) % 3;
  /**
   * The move names, in table order (`firstBoss.json.mechanics.skills`), and their shape keys.
   * `castLog` records `event.shape` (the key), so the counterfactual compares keys - the names are
   * carried because they are what the player-facing cue shows.
   */
  const MOVES = ['震地斩', '蛮王冲锋', '旋风断军'] as const;
  const KEYS = ['circle', 'line', 'cone'] as const;
  const shapeOf = (skillIndex: number, phase: number): string => KEYS[slotOf(skillIndex, phase)]!;
  const moveOf = (skillIndex: number, phase: number): string => MOVES[slotOf(skillIndex, phase)]!;

  /** One run's observed cast sequence, each tagged with the phase it was cast in. */
  const sequences = (journey: Journey) =>
    runs(journey, threatV2.bossDamage, 'hud', SEEDS, NO_CADENCE, true)
      .map(item => ({ seed: item.seed, casts: item.casts, seq: (item.castLog ?? []).map(event => `${event.phase}:${event.shape}`) }));

  it('reads the move off the phase, and the phase off the Boss HP - so the run decides the move', () => {
    // --- The rule itself, read off `:106` and `:70`. Three slots, three moves, per phase. ---
    expect(([1, 2, 3] as const).map(si => [1, 2, 3].map(ph => moveOf(si, ph))), 'the whole table')
      .toEqual([['蛮王冲锋', '旋风断军', '震地斩'], ['旋风断军', '震地斩', '蛮王冲锋'], ['震地斩', '蛮王冲锋', '旋风断军']]);
    // The same table in shape keys (`castLog`'s vocabulary, what the counterfactual compares).
    expect(([1, 2, 3] as const).map(si => [1, 2, 3].map(ph => shapeOf(si, ph))), 'the same table, as shape keys')
      .toEqual([['line', 'cone', 'circle'], ['cone', 'circle', 'line'], ['circle', 'line', 'cone']]);
    // The first cast (`skillIndex` 1) is three DIFFERENT moves across the three phases. That is
    // the whole defect in one line: the player's DPS at cast time picks the move.
    expect([1, 2, 3].map(ph => moveOf(1, ph)), 'the first cast is a different move per phase')
      .toEqual(['蛮王冲锋', '旋风断军', '震地斩']);
    // `skillIndex` alone - the counterfactual cycle - is a clean rotation with no phase in it.
    expect([1, 2, 3, 4].map(si => MOVES[(si - 1) % 3]), 'without the phase term it is a plain cycle')
      .toEqual(['震地斩', '蛮王冲锋', '旋风断军', '震地斩']);
    // Removing the term rotates every slot by one: this is the calibration `formPressure` reads.
    expect([1, 2, 3].every(si => moveOf(si, 1) !== MOVES[(si - 1) % 3]), 'dropping it rotates every slot by one').toBe(true);
    expect(moveOf(1, 1), 'the boss cell reads 蛮王冲锋 first').toBe('蛮王冲锋');
    expect(moveOf(2, 1), 'and 旋风断军 second').toBe('旋风断军');

    // --- The observation: the run's shape pair is a function of the run, not of `skillIndex`. ---
    const perJourney: Record<string, { casts: number; median: number; pairs: Record<string, number>; deviating: string[] }> = {};
    for (const journey of JOURNEYS) {
      const seqs = sequences(journey);
      const pairs = seqs.reduce<Record<string, number>>((acc, run) => ({ ...acc, [run.seq.join('>') || '(none)']: (acc[run.seq.join('>') || '(none)'] ?? 0) + 1 }), {});
      // Runs whose two-cast sequence is not the modal `2:cone>3:line`. These are the DPS-different runs.
      const deviating = seqs.filter(run => run.seq.join('>') !== '2:cone>3:line').map(run => `${run.seed}:${run.seq.join('>') || '(none)'}`);
      perJourney[journey] = { casts: seqs.reduce((n, r) => n + r.casts, 0), median: median(seqs.map(r => r.casts)), pairs, deviating };
      // The two-cast pair dominates, but is NOT universal: some runs cast once, and some cast
      // three times - and those are exactly the runs that were in a different phase at cast time.
      expect(perJourney[journey]!.pairs['2:cone>3:line'] ?? 0, `${journey}: the modal pair`)
        .toBeGreaterThan(SEEDS.length / 2);
      expect(deviating.length, `${journey}: and it is not universal`).toBeGreaterThan(0);
    }
    // Every deviating `classic` run is a different phase at its first cast - the mechanism, not a
    // distribution. `classic` is where the phase-1 first cast exists at all (3 runs).
    expect(perJourney['classic']!.pairs['1:line>2:circle>3:cone'] ?? 0, 'three classic runs cast thrice, all at phase 1 first')
      .toBeGreaterThan(0);
    expect(perJourney['evolution']!.pairs['1:line>2:circle>3:cone'] ?? 0, 'evolution never casts in phase 1')
      .toBe(0);

    // --- The counterfactual, measured: force the phase to 1 and see how many moves change. ---
    const counterfactual = (journey: Journey) => {
      const seqs = runs(journey, threatV2.bossDamage, 'hud', SEEDS, NO_CADENCE, true);
      // `castLog` has no ordinal, so read it back **per run** and index by the cast's position:
      // the ordinal is the `skillIndex` the cast ran at (that is what `:105` advances).
      let total = 0, moved = 0;
      for (const item of seqs) {
        (item.castLog ?? []).forEach((event, ordinal) => {
          total++; if (event.shape !== shapeOf(ordinal + 1, 1)) moved++;
        });
      }
      return { total, moved };
    };
    const cfClassic = counterfactual('classic'), cfEvolution = counterfactual('evolution');

    // --- Evidence, written from the same numbers the assertions below read. ---
    const EVIDENCE5 = resolve(process.cwd(), '../../tasks/game-remediation/evidence/R2-F-BOSSPHASE');
    const report = {
      slice: 'R2-F-BOSSPHASE',
      question: 'Is the move a cast resolves to a function of the run, rather than of `skillIndex`?',
      rule: {
        site: 'FirstBoss.ts:106 -> config.mechanics.skills[(boss.skillIndex + boss.phase - 1) % 3]',
        skillIndexCycle: 'FirstBoss.ts:105 -> boss.skillIndex = (boss.skillIndex + 1) % 3',
        phaseRule: 'FirstBoss.ts:70 -> ratio <= .35 ? 3 : ratio <= .70 ? 2 : 1 (ratio = hp / maxHp)',
        table: MOVES.map((move, slot) => ({ slot, move, key: KEYS[slot] })),
      },
      arm: { policy: 'hud', bossDamage: threatV2.bossDamage, seeds: SEEDS.length, cadence: 'NO_CADENCE (the shipped table)' },
      perJourney,
      counterfactual: {
        meaning: 'Force the phase to 1 for every cast - i.e. read the table as a plain `skillIndex` cycle - and compare the resolved shape.',
        classic: cfClassic, evolution: cfEvolution,
      },
      /** The calibration this rule carries, named so a change can be priced against it. */
      calibrationAtRisk: {
        site: 'formPressure.test.ts:1616-1617 (and two sibling copies)',
        asserts: ['B001-蛮王冲锋 lands', 'B001-旋风断军 lands'],
        why: "R2-F-INST's comment at :1613 - 'two casts, the charge then the cone, both at phase 1' - is slots 1 and 2 of `(skillIndex + phase - 1) % 3`. Rewriting to `skillIndex % 3` rotates every slot by one and moves these.",
      },
      note: 'Zero production changes. Instrument only. The fix is not made here - only priced.',
    };
    try {
      mkdirSync(EVIDENCE5, { recursive: true });
      writeFileSync(resolve(EVIDENCE5, 'bossphase-report.json'), `${JSON.stringify(report, null, 2)}\n`);
    } catch { /* evidence is best-effort when the workspace is read-only */ }
    // Measured, not thresholded: 63 of 71 classic casts and every one of evolution's 53 resolve to a
    // different move once the phase term is gone. These are the numbers `evidence/R2-F-BOSSPHASE`
    // records; if either moves, the table or the phase rule changed. R3-E01..07a moved them from
    // 58/61 and 59/59, R3-M01 from 63/71 - the cast count follows the fight length, and the *claim*
    // (removing the phase term rewrites almost every cast) is unchanged at 88.6% and 100%.
    expect([cfClassic.total, cfClassic.moved], 'classic: 62 of 70 casts change shape').toEqual([70, 62]);
    expect([cfEvolution.total, cfEvolution.moved], 'evolution: all 53 change shape').toEqual([53, 53]);
    // The report carries exactly the readings asserted above - so it cannot drift from them.
    expect(report.counterfactual.classic, 'the report carries the classic counterfactual').toEqual(cfClassic);
    expect(report.counterfactual.evolution, 'and the evolution one').toEqual(cfEvolution);
    expect(report.rule.table.map(row => row.move), 'the report names the table').toEqual([...MOVES]);
    expect(report.perJourney['classic']!.pairs, 'the report carries the classic pair distribution')
      .toEqual(perJourney['classic']!.pairs);
  }, 1_200_000);
});

