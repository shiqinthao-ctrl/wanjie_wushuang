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
`R3-P03` six charms (`../TASK.md`); `R3-P02` shipped.

## Last completed
**R3-P02 (D29)** - the run record. Five answers: a `ChapterReport` has **17 fields** and exactly
**one reader** in the app (a `runId` de-dup) - nothing had ever rendered it; the twenty-run cap is
enforced **twice with different meanings** (the writer truncates silently, the validator refuses the
whole save, so `<= 20` is safe and `=== 20` is not); no field is declared-but-unwritten (**17 == 17** -
my first regex said three were missing because it ignored shorthand); `stars` is written as
`victory ? 1 : 0` while the validator admits `0..3`, so the page draws a count, not three slots; and
**7 fields stop at the report boundary**, including `sealsHeld`/`elitesChecked` - D25's and D26's
readings are not in the record. No new save field was needed. The page refuses three things: a rate
under five runs, a median dragged by timeouts (victories only, with its own denominator), and
"cannot read" rendered as "never played".

## Changed files
New `chapter/reports.ts` (`reportRows(save)`, `RATE_MIN_RUNS`, `REPORT_CAP`), `ui/ReportsPanel.vue`,
`chapter/reports.test.ts` (17 `it`); `App.vue` (`page` union +1, lobby button, `v-else-if`);
`codex.test.ts`'s union assertion loosened; page `evidence/R3-P/IMPLEMENTATION-b.md`. D29; `QUEUE.md`
15 done, **16 next**; ledger unchanged at **271**.

## Tests
**GATE_FULL**: **56 files / 1602 tests (1674.23 s), all green**; increment 1585 -> 1602 is +17 = the
new file's 17 `it`, files +1, no probe. `vue-tsc --noEmit` clean, `vite build` OK. `ledger:verify` OK
(271/271, rolling 36; `numstat` empty). `smoke`/`audit`/`archive:verify` OK; `context` under 8192;
`check` cannot run here. **No Playwright**: the list is asserted through `reportRows`'s return value
and four source-level connection points, not seen.

## Unresolved risk
`App.vue:61` still never passes `:chapter`, so the chapter track is constructible and winnable but
**not clickable** - entry is `R3-U06`. `bossThreat.test.ts` still slices sources with `slice(5)`, so
the next person to change `firstStage.bossId` will be silently misled. Dead data remains
(`boss.skills`, `mechanics.shield`, `mechanics.shrink`, `mechanics.name`). The 480 s deadline is
asserted by driving the clock, not by playing it; the earliest real win is 401.50 s. The reference
player is thin on the shipped stage too (16.6 hp on seed 99). `R2-F-G4ROWS`'s evolution arm sees no
G4 row; the fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3
unmet; main-skill has no UI; `S001` shares the summon cap. **`progress.reports` never grows from the UI**
(`App.vue` passes no `:chapter`), so the new page is honestly empty - entry is `R3-U06`.

## Recommended next task
`R3-P03` (six charms, brief in `TASK.md`). Start by counting readers of the six ids - the throw at
`prepare.ts:34` is the only thing that knows charms exist. Then find the legal hook for an effect:/nthe shipped oracle must stay byte-identical with nothing equipped, and that constraint decides where
the code goes.

Replace only the five fields above.
