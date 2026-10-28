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
`R3-P04` chapter challenges (`../TASK.md`); `R3-P03` shipped. The queue's whole spec is "no permanent
numeric crushing", so the slice starts by *defining* the thing.

## Last completed
**R3-P03 (D30)** - six charms, six levers, one worn at a time. Five answers: the six ids were
**0/6 implemented** (the only non-test line naming any of them was the definition; every other
mention is a positional subscript, so a rename would go unnoticed); equipping threw at
`prepare.ts:31` and the catch-all in `BattleView` turned it into **"check your graphics driver"**;
an effect can only hang off the `chapter` path, where both oracle tests pass `chapter: undefined`;
the three earned charms are reachable on a shipped stage (victory **3/3**, awakening **3/3**, two
bonds **1/3**, **0 bonds at the first frame**); no new save field is needed, though
`charms.unlocked` never checks membership, so preparation has to. The expensive mistake was mine: I
wrote "each lever has one read site" and `p.skillCd` has **three** - `H001`'s skill goes through
`DragonCombat`, so the line I changed was not on its path. Fixed by collapsing it into
`skillCooldown()`, called from all three. Data carries `lever` + `factor` only.

## Changed files
New `chapter/charms.ts`, `ui/CharmsPanel.vue` (the only page that writes progress),
`chapter/charms.test.ts` (21 `it`); `chapter/prepare.ts` (the throw becomes `preparation.charm`),
`core/CombatSimulation.ts` (`charmScale`, `skillCooldown`, five read sites), `core/progression.ts`
(`radiusScale`), `core/GameCore.ts` (pickup call), `chapter/DragonCombat.ts` +
`core/EvolutionCombat.ts`; `App.vue` (`page` +1, lobby button, `v-else-if`); page
`evidence/R3-P/IMPLEMENTATION-c.md`. D30; `QUEUE.md` 16 done, **17 next**; ledger **271**.

## Tests
**GATE_FULL**: **57 files / 1623 tests (1766.93 s), all green**; increment 1602 -> 1623 is +21 = the
new file's 21 `it`, files +1, no probe. Subset first: 18 files / 533 tests. `vue-tsc --noEmit` clean,
`vite build` OK. `ledger:verify` OK (271/271, rolling 36; `numstat` on the ledger empty). `smoke` /
`audit` / `archive:verify` OK; `context` under 8192; `check` cannot run here. **No Playwright**: the
page is asserted through `charmViews`'s return value, the four source-level connection points in
`App.vue` and the write pattern in the panel - not seen.

## Unresolved risk
`App.vue` still never passes `:chapter`, so the chapter track is constructible and winnable but
**not clickable** - entry is `R3-U06`. Second consequence: a charm can be equipped and persisted, and
there is no run to wear it in. `bossThreat.test.ts` still slices with `slice(5)`. Dead data remains
(`boss.skills`, `mechanics.shield`, `mechanics.shrink`, `mechanics.name`). The 480 s deadline is
asserted by driving the clock; the earliest real win is 401.50 s, and the reference player is thin on
the shipped stage (16.6 hp on seed 99). The six charm effects move their lever - **not** proven to
change win rates (that needs >= 33 seeds). `R2-F-G4ROWS`'s evolution arm sees no G4 row; the fireline
does not damage enemies; `hazardPeak` is dead; 27pp viewport gap; G10 D3 unmet; main-skill has no UI;
`S001` shares the summon cap; `progress.reports` never grows from the UI.

## Recommended next task
`R3-P04` (chapter challenges, brief in `TASK.md`). The queue gives one line - "no permanent numeric
crushing" - so Scope 0 defines the thing before building it: what `chapters.stars`/`clears` record,
who reads them, whether any can be farmed into a permanent stat, and only then what a row is.

Replace only the five fields above.
