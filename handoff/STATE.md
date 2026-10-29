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
`R3-M06` a 420-second stage you win at 290 (`../TASK.md`); `R3-M05` shipped; queue still empty.

## Last completed
**R3-M05 (D35)** - `CH001-02` is not "cannot be won", it is "cannot be lost". 33 seeds x 2 policies x
3 stages, one reference player: `CH001-01` **22/33**, `CH001-02` **33/33**, `CH001-03` **17/33**. The
idle control (same bot, never stands on a seal) is **0/33** with `held: 0` - the wins come from the
objective, not from killing. All 33 wins ended at **289.98 s** (the third seal's dwell completing)
while the stage clock runs to 420: **the last 130 s are only seen by a player who is losing**. That
also undercuts half of D34 - the 400 s row it added for `CH001-02` cannot affect a winner. Zero
production change: the gap is between the clock and the victory condition (D25's data), not in D34's
table. D34's own note "no bot has played this stage through" was **wrong** - `seal-report.json` had
two wins in it all along.

## Changed files
No production code. New `chapter/sealCalibration.test.ts` (6 `it`, 73.44 s - all in module load),
`evidence/R3-M/calibration-report.json` (132 runs), page `evidence/R3-M/IMPLEMENTATION-4.md`. D35.

## Tests
**GATE_FULL**: **62 files / 1701 tests (1632.24 s), all green**. Increment 1695 -> 1701 is +6 = the new
file's 6 `it`; files 61 -> 62; no probe. `vue-tsc --noEmit` clean; `check` / `smoke` / `audit` /
`archive:verify` OK. **The first run was 2 red** - both in `byteLedger.test.ts`, because the new
`calibration-report.json` was not in the ledger yet (271 vs 272). Refreshed, re-ran, green.

## Unresolved risk
`CH001-02` wins 100% on this bot - an upper bound, not an estimate: a human does not orbit as cleanly.
`CH001-01` lost **6 of 33 to timeout at 360 s with positive hp** - it cannot finish the Boss, the same
shape (a clock shorter than the fight), not fixed here. `CH001-03`'s 16 losses are not split by
`endReason`. The seal policy is a **copy** of `seals.test.ts:224`, not an import - a drift risk with
one guard (seed 15 matches). Two failures are still told apart by message text in three places. No
Playwright. Dead data remains (4 fields). The six charm effects move their lever - not proven to
change win rates. `R2-F-G4ROWS`'s evolution arm sees no G4 row; the fireline does not damage enemies;
`hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet; main-skill has no UI; `S001` shares the summon
cap.

## Recommended next task
`R3-M06` (brief in `TASK.md`). Same shape as D34 and D35: two numbers in different files that were
never put next to each other.

Replace only the five fields above.
