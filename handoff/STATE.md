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
`R3-U01..05` the five pages and their six states (`../TASK.md`); `R3-P04` shipped.

## Last completed
**R3-P04 (D31)** - three challenges, three charms, and a star that is a record. (a) `chapters.stars`
and `clears` had **zero** production readers. (b) Replay granted no permanent numeric gain; the owning
line is `prepare.ts:43` - stats come from `chapterHeroes`, and settlement assigns only `mobileChapter`.
The legacy path (`core/settlement.ts:50-56`) does add gold/mastery/XP; that is the shape the queue
forbids, and none of it was copied. (c) No new field: the three earnable charms were already in
`charms.unlocked`, and `stars` already admitted `0..3` in both validators - the writer used a third of
it. (d) The GDD promises three stars, but its prose ("win 1 / unhurt 2 / >=55% 3") **cannot be built**:
unhurt implies >=55%, so under `Math.max` the two upper tiers collapse and the middle is unreachable.
The data (`clear: 2`) is self-consistent, so the data won and the prose is recorded as wrong.

## Changed files
New `chapter/challenges.ts` (three rows: `asks` + `reward` + a predicate over three fields only),
`ui/ChallengesPanel.vue`, `chapter/challenges.test.ts` (23 `it`); `chapter/catalog.ts` (`chapterStars`),
`chapter/settlement.ts` (`starsFor`; three magic indexes become `earnedCharms`), `chapter/reports.ts`
(comment), `ui/ChapterResult.vue` (says N stars), `App.vue` (+1 page); page
`evidence/R3-P/IMPLEMENTATION-d.md`. D31; `QUEUE.md` 17 done, **18 next**; ledger 271.

## Tests
**GATE_FULL**: **58 files / 1646 tests (1659.07 s), all green**. Increment 1623 -> 1646 is +23 = the new
file's 23 `it`; files 57 -> 58; no probe (`+N` matches, and `treeHygiene` is green). Subset `src/chapter`:
13 files / 435 tests / 8.40 s. `vue-tsc --noEmit` clean; `check` OK (26 JS, 1 CSS); `smoke` / `audit` /
`archive:verify` OK; `context` 7709/8192; ledger 271 unchanged. **No Playwright**: the page is asserted
through `challengeViews`'s return value, the four source-level connection points in `App.vue`, and the
predicate's property trace - the picture is unseen.

## Unresolved risk
`App.vue` still never passes `:chapter`, so the chapter track is constructible and winnable but **not
clickable** - entry is `R3-U06`; consequences: the challenge and report pages have nothing to grow
from, and a charm can be equipped with no run to wear it. `stars` is now 0..3 but nothing renders
`chapters.stars` - the best score is still write-only. `bossThreat.test.ts` still slices with
`slice(5)`. Dead data remains (`boss.skills`, `mechanics.shield`, `mechanics.shrink`, `mechanics.name`).
The six charm effects move their lever - **not** proven to change win rates (needs >= 33 seeds).
`R2-F-G4ROWS`'s evolution arm sees no G4 row; the fireline does not damage enemies; `hazardPeak` is
dead; 27pp viewport gap; G10 D3 unmet; main-skill has no UI; `S001` shares the summon cap.

## Recommended next task
`R3-U01..05` (brief in `TASK.md`). Start by counting: which pages exist, which of the six states each
one handles, and whether `transactOnce`'s retry is reachable by a player or only by a test.

Replace only the five fields above.
