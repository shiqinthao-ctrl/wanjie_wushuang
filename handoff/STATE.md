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
**R3-E01..07c (D26)** - "two elites", which no row defined. Four answers, all measured. `elite` is
**not a row**: it is a multiplier block in `spawnRules.ts:69-78` (r x1.25, hp x3.25, dmg x1.38,
1 affix) with eight readers. "Rows that carry elite" does not parse - all six pool rows can roll
elite - and **chapter runs inherit the first stage's wave table** (`waveAt`, read unconditionally),
so `CH001-03` gets an elite at 150 s regardless.
`eliteChecks` had **zero readers and zero assertions** (the "one assertion" in the queue is the
`CH001-03 stays shut` test, which asserts the *refusal*, not the field). And the clock-based second
affix needs `time > 960`, which **no chapter stage reaches** (360/420/480) - that alone killed the
"two ordinary elites" option. Decision: **two scripted two-affix elites at `eliteAt: [120, 300]`**,
counted by `checkedElites`, with `eliteChecks === eliteAt.length` pinned by a test. The Boss is
**gated** on them (`bossAt()` returns undefined until both die), so "victory without the checks"
cannot occur rather than having to be rejected.

## Changed files
`chapter/catalog.ts` (`eliteAt` + rationale), `core/spawnRules.ts` (`Enemy.checked`, options
`affixes?`/`checked?`), `core/CombatSimulation.ts` (`checkedElites`, `eliteCursor`,
`spawnScriptedElites`, `eliteCheckState`), `core/FirstBoss.ts` (the gate), `core/GameCore.ts`
(`UiSnapshot.eliteChecks`, `captureFinal`), `chapter/settlement.ts` (`elitesChecked` + ceiling),
`ui/BattleView.vue` (`elite-route`). New `chapter/eliteChecks.test.ts` (13 `it`, 20 ms); rolling
`evidence/R3-E/elite-report.json`; page `evidence/R3-E/IMPLEMENTATION-c.md`. D26; `QUEUE.md` 10c
done, **13 next**; ledger **269 -> 270** (rolling **34 -> 35**).

## Tests
**53 files / 1557 tests (1676.81 s)** = 1544 + 13, 52 + 1 - both increments equal the new file, so no
probe survived. First pass had **2 red**, both `byteLedger` coverage (new report not booked); after
`ledger:write` that file re-ran **5/5 green**, and only `byteLedger` reads the ledger, so green is
derived, not re-run. `vue-tsc` clean; subset 16 files / 458 tests / 2.83 s; `ledger:verify` OK
(270/270, rolling 35); `smoke`/`audit`/`archive:verify` OK; `check` cannot run here. **No Playwright**
- `elite-route` is asserted through the fields it reads, not seen.

## Unresolved risk
**`stage.boss.id` has no reader** - `FirstBoss.spawn()` hardcodes `B001`, and `CH001-03` measurably
spawns `B001`. Opening the stage therefore starts with a lookup, not a data file; that is #13's
first job, and it is why `CH001-03` is **still shut** and why `settlement`'s "victory needs both
checks" half is **unreachable from a test** (only the ceiling on open stages is asserted). The
chapter track has no UI entry (`App.vue:61`); `R2-F-G4ROWS`'s evolution arm sees no G4 row; the
fireline does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet; main-skill
has no UI; `S001` shares the summon cap.

## Recommended next task
**R3-M03** (`QUEUE.md` #13); brief in `TASK.md`. Start with the id lookup, then the three phases
as data, then open the stage only if a real run can finish it.

Replace only the five fields above.
