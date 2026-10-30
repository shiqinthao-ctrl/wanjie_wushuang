# handoff/STATE.md

## Baseline
V3.1.2 Context-Lite | ordered global browser JS | save schema 30 | `index.html` | 22 JS files | no runtime deps

## Critical invariants
- Fresh stages start at 0 stars. Defeat grants 0. A win is `chapterStars.clear` (2), 3 above 55% hp.
  Non-story modes do not alter chapter stars.
- One run settles at most once. Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction. The four difficulty ids come from `difficulties.json`;
  `normal`'s eight numbers are all 1, so a normal run is byte-identical to a pre-D38 one.

## Current architecture debt
Legacy version wrappers remain; migrate incrementally, never rewrite the combat loop in one pass.

## Current task
`R3-M08` ninety seconds, and six runs that never got there (`../TASK.md`); `R3-U07` shipped.

## Last completed
**R3-U07 (D38)** - four difficulty rows, one comparison refusing three. `difficulty` appears at 14
sites; the door was **two lines** and the other 12 are downstream, which already knew four tiers. Of
the **eight** numeric coefficients (TASK said nine), **six are live** here and two are dead: `gold`
only by the legacy settlement, `drop` by nothing - so `hard`'s own "high density, high yield" is half
false here, and the selector lists six. Widening the type does **not** reach the save schema, and that
was the finding: the report had no difficulty field and `chapters.stars` is keyed by stage alone, so
two tiers wrote one record. The answer was a column on the report (whose reader exists), not an axis
on the star cell (whose reader does not).

## Changed files
`core/spawnRules.ts` (`DifficultyId`/`difficultyIds`), `chapter/prepare.ts` (door), `chapter/progress.ts`
(optional report field), `chapter/settlement.ts`, `chapter/reports.ts` (tier + `tiers`), `ui/ChapterPanel.vue`,
`ui/ReportsPanel.vue`, `App.vue` (owns the tier), `chapter/contracts.test.ts` (the `hard` row moved),
new `chapter/difficulty.test.ts` (17 `it`); page `evidence/R3-U/IMPLEMENTATION-c.md`. D38.

## Tests
**GATE_FULL**: **63 files / 1720 tests (1676.49 s), all green**. Increment 1703 -> 1720 is +17 = the new
file's 17 `it`; files 62 -> 63; no probe. Subset `src/chapter` + `src/ui`: 19 files / 516 tests
(101.16 s). `vue-tsc --noEmit` clean; `check` / `smoke` / `audit` / `archive:verify` OK; ledger 272.

## Unresolved risk
`CH001-01` loses 6 of 33 seeds to the clock with positive hp (40-279) - the Boss spawns at 270 and
the stage ends at 360, so the fight has 90 seconds; the fastest win kills it in 37. That is `R3-M08`.
`CH001-02` is **still 33/33**; two attempts have not touched it. `xp` is the one live coefficient with
no assertion (read inside `onKill`). The chapter page has never been rendered; no difficulty's win rate
was measured (Scope 3: pin coefficients, not outcome). The tier is `App.vue` session state: it
survives navigation (two assertions) and is not in the save, so a restart returns to `normal` -
untested. The star cell is difficulty-agnostic by decision, not omission.
