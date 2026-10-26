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
**R3-M02 (D25)** - the three seals of `CH001-02`. Premise **half false, half blocked**: `seals` had
**zero production readers**, and the stage could not be built for **three** reasons
(`prepare.ts:13` refused any other `stageId`; `:26` always cloned `chapterStages[0]`;
`contracts.test.ts:48` pinned the refusal). A **fourth lock was the type**: `stage` was typed as the
*first* row, so the compiler claimed `boss` non-null and `seals` an empty tuple. Widening to
`ChapterStageId` made `vue-tsc` name **exactly two** sites, both `stage.boss.spawnAt` - two
**first-frame crashes**. The shut door hid them; door and crash were one bug. Victory did not exist
either (`updateObjective` needed a Boss kill, so a `boss: null` stage could only time out or die),
and `phase` announced a Boss from t=250 on every stage. Dwell rule: **continuous** - leaving costs
**40.03 s vs 20.0 s** for cumulative on the same trajectory. **The radius is load-bearing**: 84 px
never won (best 2/3, dead 243.4 s); 120/140/160/200 swept over 9 samples each; 160 ships because
120/140 leave the worst sample at 2.6%/5.6% against 30.6%.

## Changed files
`chapter/catalog.ts` (`ChapterStageId`, `SealRule`), `chapter/prepare.ts` (union, `OPEN_STAGES`, lookup
by id), new `chapter/Seals.ts`, `chapter/settlement.ts` (`sealsHeld`, objective split, time floor),
`core/FirstBoss.ts` (`bossAt()`), `core/CombatSimulation.ts`, `core/GameCore.ts` (`stage`/`seals` in
`UiSnapshot`), `core/FirstStageMap.ts`, `game/MapView.ts`, `game/mountBattle.ts`,
`ui/BattleView.vue`, `ui/ChapterResult.vue`. New `chapter/seals.test.ts` (13 `it`, 1.8 s); rolling
`evidence/R3-M/seal-report.json`; page `evidence/R3-M/IMPLEMENTATION-2.md`. D25; `QUEUE.md` 12 done,
10c next (13 blocked by it); ledger **268 -> 269** (rolling **33 -> 34**).

## Tests
**52 files / 1544 tests, all pass (1844.68 s)** = 1531 + 13, 51 + 1 - both increments equal the
new file's size, so no probe survived. `vue-tsc --noEmit` clean. `ledger:verify` OK (269/269,
rolling 34, stale 0, moved 0); `smoke`/`audit`/`archive:verify` OK; `context` under 8192; `check`
cannot run here. **No Playwright**, so the seal's geometry and colours are asserted through the
fields `MapView` reads, not seen.

## Unresolved risk
**The chapter track has no UI entry** - `App.vue:61` never passes `:chapter`, so `CH001-02` is
constructible, not playable; entry is `R3-U06`. `R2-F-G4ROWS`'s evolution arm observes **no** G4 row.
The fireline **does not damage enemies** and is absent from chapter runs (`FirstStageMap` disabled
there). `hazardPeak` never written or read; the fireline's band is **screen space**. `CH001-03`
stays shut. 27pp viewport gap; G10 D3 unmet; main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
**R3-E01..07c** (`QUEUE.md` #10c); brief in `TASK.md`. `CH001-03`'s `eliteChecks: 2` has **no
reader** and no row defines "two elites" - and it is the only thing blocking #13.

Replace only the five fields above.
