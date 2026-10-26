# TASK.md - R3-M03: the altar lord's three phases, and the Boss id that nobody reads

Base: R3-E01..07c (D26). Queue `QUEUE.md` #13. Unblocked by #10c.

## Why

`CH001-03` declares `boss: { id: 'CH001_ALTAR', spawnAt: 360 }`, but **`stage.boss.id` has no
reader**: `FirstBoss.spawn()` hardcodes `id: 'B001'` and reads everything from `firstBoss.json`'s
`config.boss`. D26 measured it - the stage spawns `active.id === 'B001'`. So "the altar lord" is
not a missing data file; it is a missing lookup. The two elites are defined (D26) and gated.

## Scope

0. **Verify the premise first, with a command.** (a) How many Boss rows does `firstBoss.json`
   hold - one, or a pool? (b) Who reads `mechanics.phase`, and how many entries does it have?
   (c) Is `maxPhase` set from data or from the config? (d) Does anything else key off `'B001'`
   (log prefixes, `damageBy` source names, oracle rows)? A hardcoded id may be load-bearing in
   places that are not `FirstBoss`.
1. **Make the id real, defaulting to the shipped one.** `spawn()` must look up `stage.boss.id`
   when there is a chapter stage, and fall back to `B001` when there is not - the legacy path and
   `threat-v2` must stay byte-identical. A missing id is an error, not a silent `B001`.
2. **Three phases, from data.** Whatever the altar lord's phases are (damage, cadence, skill
   rotation), they belong in a data row, not in a branch. State what each phase costs in the
   currency the existing Boss uses (contact, skill damage, telegraph count).
3. **Open `CH001-03` only if it can be finished.** `OPEN_STAGES` gains the row only when the
   Boss spawns, is defeatable, drops loot and the elite gate from D26 is satisfied in a real run.
   If any of those is not true, that is the finding and the stage stays shut.
4. **Re-baseline, explicitly.** Same rule as D23-D26: list what moved, old numbers beside new.

## Out of scope

Art and audio; the charms (`R3-P03`); the chapter UI entry (`R3-U06`); release. **Do not add a
second Boss format** - `FirstBoss` is the only place a Boss means anything, and `eliteAt` is a
schedule, not a format.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer
reads, and the delivery says the picture is unverified; every number re-derivable from the
command that produced it; state the instrument in the same breath as the number. Opening a
stage is a shipping change and owes the re-baseline list. `bossThreat.test.ts` is 27 minutes -
run it alone, in the background, and never as part of a foreground command.
