# handoff/STATE.md

## Baseline
V3.1.2 Context-Lite | ordered global browser JS | save schema 30 | `index.html` | 22 JS files | no runtime deps

## Critical invariants
- Fresh ST001 stages start at 0 stars. Defeat grants 0 chapter stars. Non-story modes do not alter chapter stars.
- One run settles at most once. Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction.

## Current architecture debt
Legacy version wrappers remain; migrate incrementally, never rewrite the combat loop in one pass.

## Current task
See `../TASK.md`.

## Last completed
**R3-E01..07a (D23)** - the first slice in more than ten that changes the shipping profile. Three
dead rows fielded (pool `5/3/1` -> **6 rows**); `charge` and `aoe_ranged` given behaviour under
`threat-v2` only (windup 35 frames, dash 330.0 = 12.49x walk; a `r70` circle every 2.4 s settling
after .9 s); enemies got **one** warning channel (reused `Telegraph` -> `renderState()` ->
`graphics`, not a second `FirstBoss.telegraphs`). `brute` unchanged, asserted. Price: **16 of 83**
reports moved and **15** assertions re-baselined - G8 cells **3 -> 2**, G7 fusions **2 -> 1**,
`BOSSPHASE` **61/58 -> 71/63**, `maxAdds` 6 -> **2-3**, D2 dash cost **20% -> 12.9%**. The harder
horde is inherent: every `EN004..006` stat sits above the old pool's expectation, so any positive
weight raises the contact budget - only weight 0 is neutral, and that is a switch that is always off.

## Changed files
`src/data/firstStage.json` (6-row pool), `src/core/spawnRules.ts` (`windup/dash/aim/chargeCd`),
`FirstBoss.ts` (`source`), `CombatSimulation.ts` (`CHARGE`, `AOE_LOB`, `chargeStep`,
`updateEnemyWarnings`, `warnings`), `GameCore.ts`, `src/game/mountBattle.ts` (draws warnings).
New `src/core/enemyWarnings.test.ts` (10 `it`); `enemyRoles.test.ts` rewritten as the legacy arm.
`DECISIONS.md` D23; `QUEUE.md` 10a done, 11 next; ledger **266 -> 267** (rolling **31 -> 32**).

## Tests
Full suite on the clean tree: **50 files / 1519 tests, all pass (1643.92 s)** = 1509 + 10, 49 + 1.
`vue-tsc --noEmit` clean. `ledger:verify` -> `LEDGER OK` (267/267, rolling 32, stale 0, moved 0).
`smoke`/`audit`/`archive:verify` OK; `context` 8169/8192; `check` cannot run here.
**No Playwright**, so neither the warning geometry nor the Vue templates can be seen locally - the
tests assert the data those renderers read.

## Unresolved risk
`R2-F-G4ROWS`'s evolution arm now observes **no** G4 row at all (three shapes at `hits: 0`, `kept`
empty): the arm's reachability collapsed, so the two readings under it are equal for a trivial
reason. `R3-E01..07c` (the "two elites" definition) still blocks `R3-M03`. 27pp viewport gap; G10 D3
unmet; main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
**R3-M01** (`QUEUE.md` #11); brief in `TASK.md`. The map's six objects come from a `const layout`
with no randomness and there is no collider anywhere, so two of the row's three acceptance items may
describe an imagination - settle that before building anything.

Replace only the five fields above.
