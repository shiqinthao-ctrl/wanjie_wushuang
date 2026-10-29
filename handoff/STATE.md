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
`R3-M04` three stages, one wave table? (`../TASK.md`); `R3-U06` shipped; the queue is empty.

## Last completed
**R3-U06 (D33)** - the door. Six slices (D27-D32) wrote code on a path no player could reach, and the
cause was one line: `App.vue`'s `<BattleView>` never passed `:chapter`. Everything behind it already
existed and was tested. This slice adds `ui/ChapterPanel.vue` (three stages, each with its derived
objective and best-star row), the route member, the binding, and the reset. Two decisions matter.
(a) The gate is **a real call** - `prepareChapterRun` - not `previewBlocker`, whose eight conditions
check seven fields this path never reads (`contracts.test.ts:27-38` measured that); reusing it would
have refused a save whose `mode` is `endless`. (b) The star row is three slots, which is only correct
because D31 filled 0..3; D29 refused the same layout for the same reason in reverse. `chapters.stars`
gains its first reader.

## Changed files
New `ui/ChapterPanel.vue`, `ui/chapter-entry.test.ts` (14 `it`); `chapter/prepare.ts` (exports
`OPEN_STAGES`, adds `stageObjective`); `App.vue` (`page` +1, `chapterOptions`, `:chapter`, reset on
home, new seed on replay, `previewBlocker` bypass for chapter replays); `ui/pages.test.ts` (two
assertions flipped: 8 -> 9 routes, "no chapter page" -> "has one"); page
`evidence/R3-U/IMPLEMENTATION-b.md`. D33; `QUEUE.md` 19 done - **queue empty**.

## Tests
**GATE_FULL**: **60 files / 1684 tests (1722.14 s), all green**. Increment 1669 -> 1684 is +15 =
the new file's 14 `it` plus one more row in `pages.test.ts`'s route list; files 59 -> 60; no probe.
Subset `src/ui` + `src/chapter`: 16 files / 480 tests (7.98 s). `vue-tsc --noEmit` clean;
`check` / `smoke` / `audit` / `archive:verify` OK; ledger 271 unchanged. **No Playwright**: the
chapter page has never been rendered, and no run has been started from it.

## Unresolved risk
The chapter page has **never been clicked**: `:chapter` is bound and `prepareChapterRun` is probed for
all three stages, but no run has been started from it and `mountBattle` taking a chapter option is
unverified. `best()` reads `chapters.CH001.stars[id]` with the chapter id as a literal. Two failures
are still told apart by message text in three places. No Playwright. `bossThreat.test.ts` slices with
`slice(5)`. Dead data remains (`boss.skills`, `mechanics.shield`, `mechanics.shrink`, `mechanics.name`).
The six charm effects move their lever - not proven to change win rates. `R2-F-G4ROWS`'s evolution arm
sees no G4 row; the fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3
unmet; main-skill has no UI; `S001` shares the summon cap. All three stages may share one wave table.

## Recommended next task
`R3-M04` (brief in `TASK.md`). The queue is empty; this is the first item on the unresolved list that
changes what the player feels between the three now-clickable stages.

Replace only the five fields above.
