# TASK.md - R3-E01..07c: "two elites", which no row defines

Base: R3-M02 (D25). Queue `QUEUE.md` #10c. Blocks #13 (`R3-M03`).

## Why

`catalog.ts:13` declares `CH001-03 祭坛决战` with `eliteChecks: 2`. That field is the whole of
"两精英": `grep -rn eliteChecks src/` finds the three catalog rows and one assertion, and
nothing reads it. `R3-M03` cannot open the stage until someone says what the two things are.

## Scope

0. **Verify the premise first, with a command.** (a) What does `elite` actually do today - which
   numbers does it multiply, and who reads them? (b) How many rows carry `elite` in the data, and
   is any of them reachable? (c) `eliteChecks` has no reader - is the *count* the mechanic, or is
   it a note about a wave? (d) The affix list: how many entries, how are they drawn, and does the
   second one at 960 s exist for a 480 s stage?
1. **Decide, and write the decision down.** Two affixed elites, two new enemy rows, or two
   ordinary elites at two times. Each option has a different cost - a new row is data plus a
   reader; a second affix is a balance change to every existing elite; "two spawns" is neither.
   State what each one costs before picking, and say which one you picked and why.
2. **Make the choice reachable and observable.** Whatever is decided, it must be (a) spawnable on
   `CH001-03`, (b) visible in `renderState()` for a renderer that reads it, and (c) countable at
   the moment it is checked. A definition that only exists in `catalog.ts` is the `hazardPeak`
   failure a third time.
3. **The stage still has to be openable.** `prepare.ts` has `OPEN_STAGES = ['CH001-01','CH001-02']`
   and `CH001-03` is shut for exactly this reason. Opening it is in scope only if the two elites
   and `CH001_ALTAR` are both real - if `CH001_ALTAR` has no Boss config, that is the finding and
   the stage stays shut.
4. **Re-baseline, explicitly.** Same rule as D23/D24/D25: list what moved, old numbers beside new.

## Out of scope

Art and audio; `R3-M03`'s three-phase altar fight (that is #13, after this); the charms (`R3-P03`);
release. **Do not invent a second elite format** - `spawnRules.ts` is the only place `elite`
means anything.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from the command that
produced it; state the instrument in the same breath as the number. If a stage has to be opened
for the mechanic to be reachable, that is a shipping change and owes the re-baseline list.
