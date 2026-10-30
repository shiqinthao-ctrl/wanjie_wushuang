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
`R3-M07` is "hold the seal and let them come to you" the whole game? (`../TASK.md`); `R3-M06` shipped.

## Last completed
**R3-M06 (D36)** - the window is fixed and the win rate did not move. Victory windows measured per
stage: `CH001-01` **52.55 s**, `CH001-02` **130.02 s**, `CH001-03` **79.93 s**. The third seal moved
270 -> 340 (interval 90/90 -> 120/120), so `CH001-02` now wins at 360 with a 60-second window; the
wave table's elite rows moved with it (150 -> 190, 255 -> 310) because `stageWaves.test.ts` pins them
to the seal they gate. **Win rate: 33/33 before, 33/33 after.** My hypothesis - "the window is too
long, so it is too easy" - was **falsified**: the winner could always last to 360. The change is kept
for structure (three windows now 52.55 / 60 / 79.93, and a winner no longer leaves 130 s unplayed),
not for difficulty. `CH001-01` lost 6 of 33 to timeout with **positive hp** (40-279) - it cannot
finish the Boss, which is the opposite direction and a different lever.

## Changed files
`chapter/catalog.ts` (three `opensAt` + three wave rows); assertions moved in `chapter/seals.test.ts`
(9 time constants), `contracts.test.ts`, `stageWaves.test.ts`, `reports.test.ts` (fixture `time`
300 -> 360, or the seal deadline refuses it), `sealCalibration.test.ts` (window 290 -> 360). Page
`evidence/R3-M/IMPLEMENTATION-5.md`. D36. **No `duration` change** - it has 8 readers, `opensAt` has 4.

## Tests
**GATE_FULL**: **62 files / 1701 tests (1668.63 s), all green**. Increment **+0** - this slice changed
data and assertions, added no `it`; files unchanged. Subset `src/chapter`: 15 files / 452 tests
(79.79 s). `vue-tsc --noEmit` clean; `check` / `smoke` / `audit` / `archive:verify` OK; ledger 272.

## Unresolved risk
`CH001-02` is **still 33/33** - this slice did not make it harder, only shorter. The suspicion is that
the seal objective lets the player stand still while bodies walk into them (two Boss stages force
movement), and it is **unmeasured**. `CH001-01`'s 6 timeouts are counted, not explained - Boss too
tough or bot DPS too low. `CH001-03`'s 1 timeout likewise. The three windows are still uneven
(52.55 / 60 / 79.93). The seal policy is a copy of `seals.test.ts:224`, not an import. Two failures
are told apart by message text in three places. No Playwright. Dead data remains (4 fields). The six
charm effects move their lever - not proven to change win rates. `R2-F-G4ROWS`'s evolution arm sees no
G4 row; the fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet;
main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
`R3-M07` (brief in `TASK.md`). D36 wrote a suspicion into the log instead of a measurement; this is
the slice that turns it into one.

Replace only the five fields above.
