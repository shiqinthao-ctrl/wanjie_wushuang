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
`R3-U06` the chapter entry (`../TASK.md`); `R3-U01..05` shipped.

## Last completed
**R3-U01..05 (D32)** - eight pages, six states, and two lies I shipped last slice. (a) The queue says
"four pages"; there are eight. The "章节" page it names **does not exist** - the lobby shows one
hardcoded stage line, and that entry is the next slice. (b) The six-state matrix has 5 real holes:
two are **false sentences** - `ReportsPanel` still said "a win is 1 star" after D31, and
`ChapterResult` still said charm effects were "coming later" after D30; both shipped in the same
commit as the change that falsified them, and no assertion read them. Fixed by reading the data
(`chapterStars`) instead of restating the rule. (c) `transactOnce` fails two ways: a receipt hit
(retry is safe) and a revision mismatch (retry can never succeed); only `BattleView` told them apart,
so `CharmsPanel` now does too. (d) Five pages had zero `@media`; all five got one.

## Changed files
`ui/ReportsPanel.vue` (star tiers from `chapterStars`, breakpoint), `ui/ChapterResult.vue` (charm
sentence, breakpoint), `ui/CodexPanel.vue` / `ui/CharmsPanel.vue` / `ui/ChallengesPanel.vue`
(breakpoints; charms also splits the two failures and gained a retry), `ui/SavePanel.vue` (retry holds
the failed closure), `style.css` (settings breakpoint); new `ui/pages.test.ts` (23 `it`); page
`evidence/R3-U/IMPLEMENTATION.md`. D32; `QUEUE.md` 18 done, **19 next**.

## Tests
**GATE_FULL**: **59 files / 1669 tests (1633.89 s), all green**. Increment 1646 -> 1669 is +23 = the
new file's 23 `it`; files 58 -> 59; no probe. Subset `src/ui` + `src/chapter`: 15 files / 465 tests
(8.05 s). `vue-tsc --noEmit` clean; `check` / `smoke` / `audit` / `archive:verify` OK; ledger 271
unchanged. **No Playwright**: "narrow screen" here means a breakpoint exists in the component's own
scoped style, not that the page looks right; no retry has been clicked.

## Unresolved risk
`App.vue` still never passes `:chapter` - the chapter track, and therefore the codex, the run record,
the charms and the challenges, are **unclickable**; `R3-U06` fixes that. Two failures are told apart
by **message text** (`includes('存档已更新')`) in three places - a string contract, so changing that
sentence silently disables all three. No retry button has ever been clicked. No Playwright, so
"narrow screen" means "a breakpoint exists", not "it looks right". `chapters.stars` is 0..3 and still
write-only. `bossThreat.test.ts` slices with `slice(5)`. Dead data remains (`boss.skills`,
`mechanics.shield`, `mechanics.shrink`, `mechanics.name`). The six charm effects move their lever -
not proven to change win rates. `R2-F-G4ROWS`'s evolution arm sees no G4 row; the fireline does not
damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet; main-skill has no UI; `S001`
shares the summon cap.

## Recommended next task
`R3-U06` (brief in `TASK.md`). Start by naming the three lines where `chapter` would have to enter,
then count what is missing between a click and a running chapter run.

Replace only the five fields above.
