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
`R3-M05` the stage I re-paced and never played (`../TASK.md`); `R3-M04` shipped; queue still empty.

## Last completed
**R3-M04 (D34)** - one stage needed its own table, and it was not the one I first thought.
`waveAt(time)` took **no stage at all**, so all three chapter stages spawned from `firstStage`'s
table, whose last row is `budget: 0` at 360 s - and a zero budget makes `director`'s interval
`Infinity`. `CH001-02` (420 s, `boss: null`) therefore had **60 s with nothing on the field**.
`CH001-03` looked the same by arithmetic and is not: its Boss arrives at 360 and fills those 120 s.
Two attempts at giving the altar rows both made `altar.test.ts` report that standing in a corner beat
hunting (2/3 then 1/3 vs 3/3), so it keeps inheriting. `CH001-02` gets six rows; `CH001-01` and
`CH001-03` stay `waves: null`, byte-identical.

## Changed files
`chapter/catalog.ts` (`ChapterWave`, three `waves` fields), `core/spawnRules.ts` (`WaveRow`, optional
table on `waveAt` / `director`), `core/CombatSimulation.ts` (`stageWaves()`, two call sites); new
`chapter/stageWaves.test.ts` (9 `it`); page `evidence/R3-M/IMPLEMENTATION-3.md`. D34.

## Tests
**GATE_FULL**: **61 files / 1695 tests (1718.32 s), all green**. Increment 1684 -> 1695 is +11 = the
new file's 11 `it`; files 60 -> 61; no probe. Subset `src/chapter`: 14 files / 446 tests (8.09 s);
the four `src/core` files that read waves: 70 tests. `vue-tsc --noEmit` clean; `check` / `smoke` /
`audit` / `archive:verify` OK; ledger 271 unchanged.

## Unresolved risk
`CH001-02`'s new table is **uncalibrated**: the only thing measured is that `director` returns a
finite interval at 400 s, which proves "it spawns", not "it can be won". The enemy pool is still
shared by all three stages (D34 split pacing, not composition). `history.waves`'s first row is wrong
for chapter runs (field initialiser uses the default table); nothing reads it. `eliteChecks.test.ts`'s
comment says every chapter stage inherits the 150 s elite wave - no longer true for `CH001-02`. Two
failures are still told apart by message text in three places. No Playwright: the chapter page has
never been rendered and no run has been started from it. Dead data remains (4 fields). The six charm
effects move their lever - not proven to change win rates. `R2-F-G4ROWS`'s evolution arm sees no G4
row; the fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet;
main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
`R3-M05` (brief in `TASK.md`). The queue is empty; this is the gap the last slice wrote down about
itself, and it is cheaper to close before anything is built on the new table.

Replace only the five fields above.
