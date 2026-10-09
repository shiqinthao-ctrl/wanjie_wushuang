# R1g-2 - skill auto-cast budget (the `baseCooldowns` sentinel)

Base: R1g-1 on `72a2860` (branch `codex/first-chapter-remediation`).
Harness: `apps/mobile-next/src/core/skillCadence.test.ts` (6 tests, rules only).
Raw data: `cadence-report.json` and `threat-report.json` in this directory.
Design source: `docs/design/GDD-可玩性提升设计-v2.md` §7 P2-1.

> **Rolling artifact note (added by R1g-12)**: `skillCadence.test.ts` rewrites `cadence-report.json`
> on every run. R1g-12 re-ran it after recalibrating the horde contact table and pointed its output
> directory at `evidence/R1g-12/`, so the `cadence-report.json` copy in this directory was removed.
> **R1g-2's numbers are the ones in this file's prose**, not the ones in any JSON. R1g-12's re-run
> did not move a single threshold in that harness - a weaker horde makes runs longer, not casts more
> frequent - so nothing here is invalidated; the artifact simply moved to the tree it was measured
> on. (`threat-report.json` here is a pre-convention leftover with no `slice` field, written before
> `threatModel.test.ts` grew one; it is not a current reading of anything.)

## Problem this slice fixes

`skillForms.baseCooldowns` used `0.5` as the legacy marker for "persistent effect,
refresh often". `CombatSimulation.updateOuter` reads that same table as an
auto-cast interval, so `0.5` means **two casts per second**, and the fallback
`{ S001: 7 }` on the next line could never run because `S001` was already in the
table.

Measured on the committed base, with a driver that unlocks new actives (see
"Reachability"):

| skill | casts | casts/s while owned |
| --- | --- | --- |
| S001 影分身 | 481 | **2.18** |
| A021 焚城火域 | 618 | **2.24** |

S001 summons `Math.min(6, 1 + count)` clones that live `4.5 * duration` seconds.
At two casts a second the clone cap is saturated permanently, so the skill stops
behaving like a summon and becomes a permanent six-clone wall. A021 is
dedup-guarded (`!this.fields.some(field => field.id === id)`), so its double-cast
never produced extra damage - but it still ran 618 pointless invocations.

## Change

| entry | before | after | why |
| --- | --- | --- | --- |
| `S001` `S002` `S003` `S018` | 0.5 | **7** | summon skills; matches the dead `{ S001: 7 }` fallback |
| `A021` | 0.5 | **4** | a persistent aura still needs one cast, and the dedup guard makes each refresh a no-op; 4s keeps it recoverable if the field list is capped out |
| `A022` `A030` `A062` `A063` `A068` `A070` | 0.5 | **null** | not implemented by any cast path; `null` says "not driven by the auto-cast loop" instead of encoding it as a fast cooldown |

`updateOuter` also gained an explicit guard so a stale `0.5` cannot silently
reintroduce the double-cast:

```ts
const PERSISTENT_AURA = .5;
if (level && base != null && base !== PERSISTENT_AURA && !(this.cool[id]! > 0)) { ... }
```

`baseCooldowns` has exactly one consumer (`CombatSimulation.updateOuter`), so the
table change cannot reach the legacy `assets/js/**` build or the chapter path.

## Measured result

| skill | before | after |
| --- | --- | --- |
| S001 casts/s | 2.18 | **0.15** |
| A021 casts/s | 2.24 | **0.28** |

Every owned skill now lands at `casts/s × tableCooldown ≈ 1.0`; the bug measured
**15.3** for S001, so the harness asserts `>= 0.7` and separates the two cleanly.

Boss window on the evolution journey (`threat-v2`, 390x844, seed 15):
**4.0s -> 8.6s**. Classic keeps its 14.4s because its build never owns S001.

All runs stay winnable: classic and evolution both still reach `victory` with the
Boss defeated and a health floor above 25%.

## Reachability: why the browser suite never saw this

`tests/settlement.spec.ts:105` always takes `options[0]`. `Progression.validOptions`
shuffles for journey runs and then **unshifts the first owned active to index 0**,
so `options[0]` is always an upgrade of something already owned and the bot never
unlocks S001 at all. Verified: the classic-journey bot ends on
`{A011, A021, A027, A026}` and the evolution-journey bot on
`{A003, A011, A054, A026}` - S001 absent from both.

A player who deliberately unlocks actives reaches S001 within a few levels (the
`unlock` driver reaches S001 Lv.2 by 56s and it then deals 38.5% of all damage).
So the defect is player-reachable but invisible to the `options[0]` bot, which is
why R1g-1's browser batches could not have caught it.

## Corrections to R1g-1's evidence

Two claims in `evidence/R1g-1/RESULTS.md` did not survive measurement:

1. **"The Boss holds a 155px stand-off that puts it outside the basic attack, so
   the Boss race is decided by the last 15px."** Falsified. Driving the same build
   and stopping the charge at the Boss's own 155px stand-off still deals
   **24,983 of 25,048** Boss HP - only 20% slower than closing to 65px. Ranged
   skills (A011, A027, A054) and the ultimate connect regardless of the stand-off.
   The stand-off is not a blocker; it is at most a soft incentive to close, since
   standing at 155px costs 382 HP in the Boss phase versus 227 HP at 65px.

   | charge stop distance | Boss phase | Boss DPS | HP taken in phase |
   | --- | --- | --- | --- |
   | 65px | 14.4s | 1736 | 227 |
   | 120px | 14.4s | 1711 | 299 |
   | 155px | 18.0s | 1388 | 382 |

2. **The `threat-v2 evolution / active` row moved.** `harness-report.json` was
   regenerated by a later run of the same harness, which the cooldown fix does
   touch on that configuration: `275.4s / min 0.774` became
   `279.9s / min 0.810`. Every other R1g-1 row is unchanged. From R1g-2 on, that
   harness writes to `evidence/R1g-2/threat-report.json` so the R1g-1 copy cannot
   be rewritten again.

## Handover: Boss time budget is a two-sided problem (R1g-3)

The GDD's P0-5 says to raise `firstBoss.json boss.hp` from 7000 to ~31,500
(~94,500 effective) so that `DPS x 75s` matches. Measured Boss-phase DPS on the
post-fix base, 390x844:

| build | rules | Boss phase | Boss DPS |
| --- | --- | --- | --- |
| classic / first-offer | threat-v2 | 14.4s | 1736 |
| evolution / unlock | threat-v2 | 8.6s | 2796 |
| classic / first-offer | legacy | 16.8s | 1473 |

Against a 90s window (spawn 270s, stage 360s) that is a TTK of 9-17s - the Boss
dies in a sixth of its budget, which is the "Boss 秒杀" problem the GDD flagged.

But **Boss HP cannot be derived from DPS alone**, because the player also has to
survive the longer fight. On `classic / first-offer / threat-v2` the player has
478 HP when the Boss spawns and loses 227 HP over 14.4s - about **15.8 HP/s**, i.e.
30 seconds of survival. A 94,500 HP Boss needs 54s at 1736 DPS, so the player dies
first. That is the same failure the R1g-1 browser batch recorded (died at 371s with
the Boss on 3,700/25,048).

R1g-3 therefore has to set the Boss HP budget **and** the Boss-phase incoming
pressure together, and should also settle the viewport question below.

### New finding: the viewport is a first-order balance variable

Same build, same rules, only the viewport differs:

| viewport | result | Boss DPS | HP when Boss spawns |
| --- | --- | --- | --- |
| 390x844 (phone) | victory 285.6s | 1736 | 478 |
| 1280x720 (desktop) | victory 287.5s | 1535 | **213** |

On the `unlock` build the desktop viewport actually **loses**: defeat at 282.9s
with the Boss on 11,070/25,048 and 126 HP at spawn. The phone viewport is the
product target, so balance should be derived there, but `settlement.spec.ts` runs
`:209` on all three Playwright projects and the desktop one is roughly twice as
lethal. That needs an explicit decision (scale spawn pressure by viewport area, or
accept that desktop is a smoke-only target) before a single Boss HP number is
meaningful.

## Browser batch (desktop, one attempt, all four cases retained)

| case | R1g-1 attempt 3 | R1g-2 attempt 1 |
| --- | --- | --- |
| `:209` natural victory | FAIL, died 371.0s | **PASS** 299.4s, `★★☆`, `lootSeen: true`, 179/687 HP |
| `:210` natural corner defeat | PASS 77.0s | PASS 60.5s, 7 HP |
| `:211` natural timeout | FAIL, died 37.8s | FAIL, died 39.7s |
| `:213` imported low-growth defeat | PASS 39.5s | PASS 37.1s |

**`:209` passing is browser variance, not this slice's fix.** The harness rows for
the classic build are byte-identical before and after the cadence change (288.1s /
min 0.790 legacy, 285.6s / min 0.352 threat-v2, and all five sweep seeds
unchanged), and the `options[0]` bot never owns S001, so the rules-level trajectory
that produces this browser run did not move. The browser run is unseeded
(`Math.random`), and R1g-1's three attempts all died at 246-371s with the Boss on
3,700 of 25,048 - a coin flip that happened to land green here. `:209` must be
treated as **flaky, not fixed**, until R1g-3 gives the Boss a real budget.

`:211` remains the one deterministic red, exactly as predicted: a stationary player
now dies in ~40s, so the "stand still and the stage times out" contract cannot be
satisfied by any balance change. It needs new evasive-play semantics.

## Notes

- No change to `combat-math-oracle.json`, `firstStage.json`, Schema30,
  dependencies or archive. `firstStage.rule.incoming` stays at 0.44.
- The `{ S001: 7, G2_FROST: 5 }` fallback in `updateOuter` is kept even though
  S001 is now in the table: it still covers journey skills such as `G2_FROST` that
  have no table entry, and it documents the intended cooldown.
- The harness deliberately uses an `unlock` driver rather than `options[0]`,
  because `options[0]` cannot reach S001 at all. Both drivers are legitimate; they
  answer different questions.
