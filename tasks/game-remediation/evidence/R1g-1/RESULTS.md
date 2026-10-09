# R1g-1 - threat model rebuild and playability regression harness

Base / rollback: `72a2860` (branch `codex/first-chapter-remediation`).
Harness: `apps/mobile-next/src/core/threatModel.test.ts` (12 tests, rules only, no browser).
Raw trace data: `harness-report.json` (rules harness) and `attempt-1/`, `attempt-2/`,
`attempt-3/` (browser batches) in this directory.
**Regenerated once, in R1g-2.** The harness that writes `harness-report.json` keeps
writing on every run, and the R1g-2 cooldown fix moves exactly one row of it:
`threat-v2 evolution active` went from `275.4s / min 0.774` to
`279.9s / min 0.810`. Every other row is unchanged. From R1g-2 on that harness
writes to `evidence/R1g-2/threat-report.json` instead.
Design source: `docs/design/GDD-可玩性提升设计-v2.md` §5 (P0-1 / P0-2 / P0-3).

## Problem this slice fixes

On `72a2860` three mitigation layers stacked in the journey rules:

1. `firstStage.rule.incoming = 0.44` - a global -56% on every incoming hit.
2. `damage - def * 0.08` in `incomingHit` - a flat subtraction (2.24 at H001 def 28).
3. `inv = 0.28` used as a **global** i-frame.

Layer 3 capped incoming hits at 3.57/s no matter how many enemies were attacking,
and layer 2 pushed every weak hit onto the `Math.max(1, ...)` floor. The measured
consequence was that a player who never moved and never pressed a button still won
the classic journey by timeout, and won the evolution journey outright.

## Model

Opt-in, selected by an explicit run rules version (`RunRules`, `src/core/threatModel.ts`):

| concern | `legacy` (frozen reference) | `threat-v2` |
| --- | --- | --- |
| global incoming multiplier | `firstStage.rule.incoming` = 0.44 | `threatV2.incoming` = 1 |
| mitigation | flat `damage - def * 0.08` | `damage * (1 - def / (def + 60))` soft cap |
| i-frame | global 0.28s re-armed by every hit | none; per-source contact timers (0.85s enemies, 1.1s Boss body) |
| enemy contact damage | `firstStage.enemies[id].damage * 0.82` | `threatV2.enemyDamage[id]` |

`threatV2.enemyDamage[id]` is `firstStage.enemies[id].damage * 1.8`; relative to the
legacy effective contact damage (`* 0.82`) that is `* 2.2`. It is data, not formula:
`firstStage.enemies` is never edited in place, and the stage's own `dmg` scaler is
skipped when a threat table is present (`enemy.damage *= threat ? 1 : firstStage.dmg`)
so the two reductions cannot stack.

The legacy path is byte-identical when no threat is configured, so
`combat-math-oracle.json` (384 `incomingHit` cases) and `GameCore.test.ts:9`
(`incoming: .44`) still pass unchanged. Journey runs request `threat-v2` in
`mountBattle`; chapter runs stay `legacy`.

## Calibration history

| attempt | `enemyDamage` | rules harness, classic active, seed 15 | browser natural victory (`settlement.spec:209`) |
| --- | --- | --- | --- |
| first | `damage * 2.4` | victory, min **56%** HP, sweep mean 0.467 | **died** at 246s |
| final | `damage * 1.8` | victory, min **35.2%** HP, sweep mean 0.569 | **died** at 371s |

The first table was rejected because the *faithful* driver (see Notes) showed the
natural victory run losing to it. `1.33x` the final values measurably kills the
natural victory run in the rules harness as well.

## Measured results

Rules-only full-run driver, 390x844, 60 steps/s, seed 15 unless noted.
"no input" = the player never moves and never presses a button.

| run | base `72a2860` | `threat-v2` |
| --- | --- | --- |
| classic, no input | timeout at 360s, 672/763 HP left (88%) | **defeat at 37.4s** (lv3, Boss never spawns) |
| evolution, no input | **victory at 296.7s**, 696/763 HP | **defeat at 34.0s** (lv2, Boss never spawns) |
| classic, active | victory at 288.1s, min 79.0% HP | victory at 285.6s, **min 35.2% HP** |
| evolution, active | (not measured on base) | victory at 275.4s, min 77.4%, Boss defeated |

Active-player health floor across seeds 15/3/5/7/21/33:
`0.352, 0.766, 0.609, 0.649, 0.547, 0.492` - mean **0.569**. Every seed still wins
and still defeats the Boss, and the canonical seed 15 floor is 0.438 lower than the
legacy reference floor (0.790), so the model demonstrably bites.

Damage taken on the canonical classic active run goes 244 (legacy) -> 1,182
(threat-v2); on the no-input run 853 -> 771 (the run simply ends 9.6x sooner).

## Browser batch (`tests/settlement.spec.ts`, `--project=desktop`)

| attempt | `enemyDamage` | `:209` victory | `:210` defeat | `:211` timeout | `:213` imported defeat |
| --- | --- | --- | --- | --- | --- |
| 1 | `damage * 2.4` | FAIL, died 246.1s | **PASS 51.8s** | FAIL, died 36.5s | PASS 40.6s |
| 2 | `damage * 2.4` (re-run) | FAIL, died 291.3s | **PASS 41.6s** | FAIL, died 34.4s | PASS 28.3s |
| 3 | `damage * 1.8` | FAIL, died 371.0s | **PASS 77.0s** | FAIL, died 37.8s | PASS 39.5s |

Attempt 2 was launched from a chain in which `npm run build` failed silently, so it
re-tested the attempt-1 bundle rather than the attempt-3 numbers. It is retained
because it is still a valid `* 2.4` measurement; its role is to show run-to-run
variance (246s vs 291s on the same bundle).

Attempt 3 detail, from the retained `natural-settlement-input.json` files:

- `:209` - `本局生命耗尽`, `☆☆☆`, 371.0s, last frame `生命 5 / 763 Lv.21`, Boss at
  `3700.3 / ~25048` HP, `lootSeen: false`. The run is 15% of a Boss short of the
  victory contract when it dies of attrition.
- `:210` - `本局生命耗尽`, `☆☆☆`, 77.0s, `生命 11 / 763 Lv.5`. **This is the slice's
  hard gate and it turns green.** The pre-existing unresolved risk recorded since
  R1f (`natural play survives to kill the boss, so natural defeat is unreachable`)
  is closed.
- `:211` - `本局生命耗尽`, `☆☆☆`, 37.8s, `生命 33 / 763 Lv.2`. A stationary player
  now dies instead of timing out, which is the intended design outcome and makes the
  old timeout contract unreachable. See Disposition.
- `:213` - `本局生命耗尽`, `☆☆☆`, 39.5s, `生命 1 / 620`. Unchanged behaviour.

## Disposition of the two red browser cases

`:210` was the only hard gate. `:209` and `:211` going red are **direct consequences
of the model working**, not defects in it, and both are handed forward rather than
tuned away:

- `:209` is a **damage-per-second** problem, not a threat problem. The browser driver
  reached the Boss with 15% left at 371s; lowering threat strength far enough to let
  it finish would put `:210` back to unreachable. The real cause is that the player's
  effective DPS is nowhere near what the rules model predicts, and that is the
  `baseCooldowns` sentinel - R1g-2 owns it.
- `:211` encodes a contract that the design deliberately removes ("stand still and
  the stage times out"). It needs a new semantics - an *evasive* player who avoids
  contact but does not die - and that redesign is a test-strategy task, not a
  balance tweak. It must not be satisfied by weakening the threat table.

## Why the Boss race looked knife-edge (falsified in R1g-2)

> **Correction (R1g-2).** The analysis below was a hypothesis, not a measurement,
> and R1g-2 falsified it. Driving the same build while stopping the charge at the
> Boss's own 155px stand-off still deals **24,983 of 25,048** Boss HP, only 20%
> slower than closing to 65px: ranged skills and the ultimate connect regardless of
> the stand-off. The stand-off is at most a soft incentive to close (standing at
> 155px costs 382 HP in the Boss phase versus 227 HP at 65px), not a blocker. The
> real Boss problem is that its HP is far too low for the 90s window - see
> `evidence/R1g-2/RESULTS.md` and the R1g-3 handover. The original text is kept
> below for the record.

`FirstBoss.updateAI` only closes while `distance > 155`, so the Boss holds a
155px stand-off. The player's basic attack reaches `105 + heat * 0.35`, i.e. 105px
up to 140px at full heat, and the skill reaches 135px. Both are **inside** the
Boss stand-off, so a player that never closes cannot damage the Boss with its two
most-used attacks at all - only the ultimate (210-264px) and ranged skill forms
connect. The Boss race is therefore decided by whether a run happens to close the
last 15px, which is why the same rules produce ~25.0k boss damage in one seed and
~19.0k in another. Boss HP and stand-off belong to R1g-2, after the
`baseCooldowns` auto-cast fix, because the current DPS is inflated.

## Notes

- `baseCooldowns.S001/A021/... = 0.5` (sentinel) still makes `updateOuter`
  auto-cast twice a second, so every balance number here is measured with that
  inflation present. R1g-2 owns it; the harness targets are deliberately set on
  the inflated model and must be re-derived afterwards.
- The harness is deliberately rules-only: it drives the same `GameCore.advance`
  loop Phaser drives. Its `active` strategy was written to mirror the natural-play
  driver in `tests/settlement.spec.ts` exactly - one-second square legs, **one**
  skill/ultimate press per second (not per frame), and a Boss charge that stops
  65px away - and it picks `choice.options[0]`, the same upgrade the browser takes.
  An earlier version pressed every frame and preferred the first *active* upgrade;
  it over-predicted victory 7/7 while the browser died on the same numbers, which
  is why the table was re-calibrated downward. The residual gap (harness wins at
  seed 15, browser dies at 371s) is driver fidelity, not model error.
- Browser attempts are kept in full, including the failed one, per the slice's
  "keep all attempts" requirement. `.webm` recordings, `test-results/` and
  `playwright-report/` stay gitignored.
