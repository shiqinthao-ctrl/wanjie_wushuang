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
**R3-M03 (D27)** - the altar lord, and the id that had no reader. `CH001-03` named `CH001_ALTAR`
while `spawn()` hardcoded `B001`. Four answers: (a) `firstBoss.json` held **one** Boss with **no id
field at all** (its `pool` is loot, read by `gearDrops`), so the lookup table did not exist; (b)
`mechanics.phase` has 3 entries and **one** reader (`phaseName`) - names were data, behaviour was
nine literals; (c) `maxPhase` comes from the **hp ratio** `.35/.70`, not from data; (d) `'B001'` is
load-bearing outside `FirstBoss` - the `damageTakenBy` key prefix, the feedback source, the
`B001-BODY` asset row, a legacy-tree audit gate, and `bossThreat.test.ts` partitions with
`slice(5)`, which **hardcodes the id's length**. Fifth finding: `firstStage.rule.bossId === 'B001'`
had **zero readers**, so the default was data all along. Rows are now `bosses[id]`, resolved at
construction (a missing id throws once, not per frame), and the damage prefix follows the id. The
three phases moved into the row as `thresholds`, six affine `curve` pairs, per-phase
`radius/width/arc` and `adds` - affine because `.95 - .08` is not the double `0.87`. `CH001-03`
opened only after a **calibrated** bot won it: the same policy wins `CH001-01` 3/3 and `CH001-03`
3/3 (410.25/402.32/401.50 s); a corner-holding policy wins 1/3, so the first "unfinishable" reading
was the instrument, not the stage.

## Changed files
`data/firstBoss.json` (rows + curves), `core/FirstBoss.ts` (lookup, `this.id`, row-driven phases),
`chapter/prepare.ts` (`OPEN_STAGES` +1), `chapter/catalog.ts` (`clear`/`timeout`), `core/GameCore.ts`
(`UiStage` 6 fields), `ui/ChapterResult.vue`, `ui/BattleView.vue`. New `chapter/altar.test.ts`
(13 `it`, 5.4 s); rolling `evidence/R3-E/altar-report.json`; page `IMPLEMENTATION-d.md`. D27;
`QUEUE.md` 13 done, **14 next**; ledger **270 -> 271** (rolling **35 -> 36**).

## Tests
**GATE_FULL**: **54 files / 1569 tests (1716.81 s), all green**. `vue-tsc --noEmit` clean. Subset
(chapter + game + firstBoss + bossLifecycle + GameCore): 16 files / 410 tests.
`ledger:verify` OK (271/271, rolling 36); `smoke`/`audit`/`archive:verify` OK; `context` under 8192;
`check` cannot run here. **No Playwright**: the altar telegraphs, the `elite-route` panel and the
result title are asserted through the fields they read, not seen.

## Unresolved risk
`App.vue:61` still never passes `:chapter`, so the chapter track is constructible and winnable but
**not clickable** - entry is `R3-U06`. `bossThreat.test.ts` still slices sources with `slice(5)`, so
the next person to change `firstStage.bossId` will be silently misled. Dead data remains
(`boss.skills`, `mechanics.shield`, `mechanics.shrink`, `mechanics.name`). The 480 s deadline is
asserted by driving the clock, not by playing it; the earliest real win is 401.50 s. The reference
player is thin on the shipped stage too (16.6 hp on seed 99). `R2-F-G4ROWS`'s evolution arm sees no
G4 row; the fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3
unmet; main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
**R3-P01** (`QUEUE.md` #14); brief in `TASK.md`. Start by counting what `progress.discoveries` can
hold, then decide whether the codex needs a save field at all.

Replace only the five fields above.
