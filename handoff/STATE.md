# handoff/STATE.md

## Baseline
V3.1.2 Context-Lite | ordered global browser JS | save schema 30 | `index.html` | 22 JS files | no runtime deps

## Critical invariants
- Fresh stages start at 0 stars. Defeat grants 0. A win is `chapterStars.clear` (2), 3 above 55% hp.
  Non-story modes do not alter chapter stars.
- One run settles at most once. Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction.

## Current architecture debt
Legacy version wrappers remain; migrate incrementally, never rewrite the combat loop in one pass.

## Current task
`R3-U07` one difficulty, and it is the one nobody chose (`../TASK.md`); `R3-M07` shipped.

## Last completed
**R3-M07 (D37)** - D36's suspicion, measured. Four arms x 33 seeds on `CH001-02` plus the two Boss
stages as controls: `seal` (circle inside the radius) **33/33**, `clear` (same bot, walks at bodies
within 70 px) **29/33**, `idle` (never stands on a seal) **0/33**; `CH001-01` 22/33, `CH001-03` 17/33.
`clear` also takes **more** damage (median 411 vs 366), because ~70% of the damage is
`hostile-projectile` and walking at an enemy walks into the next shot. Per second: seal **1.017**,
clear 1.142, first 1.380, altar 1.439 - the seal stage's pace is 71-74% of the Boss stages'. So the
100% is not the window (D36 falsified that) but the objective and the pace. Zero production change:
"the seal stage is calmer" may be right - it tests endurance, the Boss stages test movement.

## Changed files
No production code. `chapter/sealCalibration.test.ts` gains a `clear` arm and two assertions (6 -> 8
`it`); the report gains `takenTotal` for four arms and three stages; page
`evidence/R3-M/IMPLEMENTATION-6.md`. D37.

## Tests
**GATE_FULL**: **62 files / 1703 tests (1682.57 s), all green**. Increment 1701 -> 1703 is +2 = the two
new assertions; files unchanged. Subset `src/chapter`: 15 files / 454 tests (98.06 s).
`vue-tsc --noEmit` clean; `check` / `smoke` / `audit` / `archive:verify` OK; ledger 272 unchanged.

## Unresolved risk
`CH001-02` is **still 33/33**; two attempts (window, engagement) have not touched it. "Per second"
is median-damage over median-duration, not a per-run ratio - an approximation. `clear`'s 4 losses are
not split by `endReason`. Only one bot: 29 vs 33 is this bot's gap, not a player's. `CH001-01`'s 6
timeouts are counted, not explained. The three victory windows are still uneven (52.55 / 60 / 79.93).
The seal policy is a copy of `seals.test.ts:224`, not an import. Two failures are told apart by
message text in three places. No Playwright. Dead data remains (4 fields). The six charm effects move
their lever - not proven to change win rates. `R2-F-G4ROWS`'s evolution arm sees no G4 row; the
fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet; main-skill
has no UI; `S001` shares the summon cap.

## Recommended next task
`R3-U07` (brief in `TASK.md`). Three stages ship at exactly one difficulty while `difficulties.json`
already has four rows, every coefficient of which is read on this path.

Replace only the five fields above.
