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
`R3-P02` reports page (`../TASK.md`); `R3-P01` shipped.

## Last completed
**R3-P01 (D28)** - the codex. Scope 0 first, then the page. Five answers: `discoveries` is keyed by
**form** and written only inside `if (run.formId)`, so "never seen" is `undefined`, not `false`;
`heroForms` (11 rows) and `chapterHeroes[].forms` are the same set grouped by hero, so the page pins
them equal; fusion rows are `[name, E, E]` (evolution ids, not skills); there is **no router**, so
"reachable" is asserted on the union member, the import, the button and the branch; and no new save
field is needed - but "does this save hold both parts" is **constant-true** in the evolution journey
(`evolutionBuild` hands every hero all 10 actives and 11 passives). So fusions carry **two columns
with their own sources**: assemble-able from the skill lists (4 of 10, same for all three heroes) and
held from `save.build` (3 of 10 on a fresh save) - `F026` is the row that proves they differ. The
page also survives a save from a newer build: `readChapterProgress` throws there, so the codex
catches it, shows the catalog with empty progress, and says why.

## Changed files
New `chapter/codex.ts` (pure `codexRows(save, track)`), `ui/CodexPanel.vue`, `chapter/codex.test.ts`
(16 `it`, 24 ms); `App.vue` (`page` union +1, lobby button, `v-else-if` branch); page
`evidence/R3-P/IMPLEMENTATION.md`. D28; `QUEUE.md` 14 done, **15 next**; ledger unchanged at **271**
(no new report - the page renders D28's measurements, it does not take new ones).

## Tests
**GATE_FULL**: **55 files / 1585 tests (1691.60 s), all green**. `vue-tsc --noEmit` clean,
`vite build` OK. `ledger:verify` OK (271/271, rolling 36 - **no new report**, and `numstat` shows the
ledger is byte-identical after the run). `smoke`/`audit`/`archive:verify` OK; `context` under 8192;
`check` cannot run here. **No Playwright**: the codex layout is asserted through `codexRows`'s return
value and four source-level connection points, not seen.

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
`R3-P02` (reports page, brief in `TASK.md`). Start with the same five commands the codex needed: one
`ChapterReport`'s fields, where the twenty-item cap lives (writer, validator, or both), and which
recorded-looking fields are never written. Then reuse the codex's shape - pure row function, one
panel, one union member, one lobby button, source assertions for reachability.

Replace only the five fields above.
