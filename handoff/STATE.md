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
R2-F-BOSS-COVERAGE - **instrument, zero production change**. The four pressure cells never hold a
Boss and a soldier at once (measured: `framesBoth = 0` for all 4 cells x 10 forms), while the
**shipped** Boss phase does so for **~95%** of the encounter (`bossPhaseSpawnInterval` is a
multiplier, not a switch, `CombatSimulation:341-342`). New finding: the queue's **candidate B** (a
fifth cell: standoff 110 + one `EN001` @100px reversed) **does not work as specified** - a single
98.154-HP body in reach of a kit firing 15 casts dies in **0.98-2.88s**, staging coexistence for
**<5%** of a 90s window; the shape that holds is a **body the kit cannot one-shot** (`hp = maxHp =
1e6`, whole window). With such a body the reading moves: `bossHpLost` shifts **+16.7% to -14.7%**
across kits, stable across ranks. **Ruling D18**: pin the gap with a visible instrument, no balance
change, no `scenarios` key. `formPressure.test.ts` EOF block, 5 `it`, ~1.2s; ten shipped reports
byte-identical.

## Changed files
**No production file.** `apps/mobile-next/src/core/formPressure.test.ts` (EOF block, +5 `it`, no
existing line moved), new `evidence/R2-F-BOSS-COVERAGE/` (report + page), regenerated
`evidence/R2-F-CAP/cap10-md5.txt` (261->262). `DECISIONS.md` D18. `QUEUE.md` 6w done / 7 next.

## Tests
`typecheck` clean; new block **5 pass** (1.21s); whole `formPressure.test.ts` **89 pass** (21.08s).
`ledger:verify` -> `LEDGER OK` (262/262, rolling writers 27, stale 0 after the full run). Full suite
**44 files / 1475 tests green** (EXIT=0, 1625.57s, `+5` = this block); `smoke`/`audit`/`archive:verify`
OK; `context` 7022/8192; `check` cannot run here. **No Playwright.**

## Unresolved risk
candidate B's body type must be fixed before the fifth cell can land; 27pp viewport gap; G10 D3
unmet; no UI for the main art; G7 1 fusion/run; `S001` shares the summon cap.

## Recommended next task
**R2-S01..12** (`QUEUE.md` #7); brief in `TASK.md`. Twelve skill routes over five base skills; the
table and the `EvolutionCombat.cast` route branches exist, exclusivity and boundary acceptance do
not. Count the routes with a command before trusting the number.

Replace only the five fields above.

