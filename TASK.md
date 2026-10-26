# TASK.md - R3-M02: the three seals, and the stage that cannot be entered

Base: R3-M01 (D24). Queue `QUEUE.md` #12.

## Why

`catalog.ts:12` declares `CH001-02 荒原镇界` with `seals: [{opensAt:90,dwell:20},{180},{270}]`.
That is the whole of "三镇界阵": **no code reads `seals`** - `grep -rn seals src/` returns the
catalog line and an unrelated CSS class in `App.vue`. And the stage cannot be started at all:
`prepare.ts:11` throws 此精品关卡尚未开放 for any `stageId !== 'CH001-01'`, the options type is the
literal `'CH001-01'`, and `prepareChapterRun` always clones `chapterStages[0]`.

So the row asks for a mechanic on a stage that refuses to load. Scope 0 decides whether this slice
opens the stage, implements the seals behind an already-open door, or both.

## Scope

0. **Verify the premise first, with a command.** (a) Does anything read `seals`? (b) Can
   `CH001-02` be constructed today - through `prepareChapterRun`, through `new GameCore(...)`, or
   only by hand? (c) What does the data actually say: `dwell: 20` is *twenty seconds inside*, not
   a counter that accumulates. Which of the two is "累计驻守，离开不清零", and is the other one
   expressible in the current shape? (d) Is there any objective/timeout surface for a stage with
   `boss: null` - what ends a 420 s run that has no Boss?
1. **Make the seal readable before making it pay.** Whatever the answer to 0(c), the player must be
   able to see which seal is open, how much dwell is left, and what happens when they leave. A
   seal that only exists as a number in `snapshot()` is the `hazardPeak` failure again.
2. **Decide the accumulation rule and write it down.** `dwell: 20` continuous vs cumulative is a
   design decision, not an implementation detail. Pick one, state what it costs, and assert the
   boundary (leaving at 19.9 s).
3. **The timeout.** `duration: 420` with `boss: null` - say what the run ends on and what the
   player is told before it does. If nothing ends it, that is the finding.
4. **Re-baseline, explicitly.** Same rule as D23/D24: list what moved, old numbers beside new.

## Out of scope

Art and audio; `CH001-03`'s two elites (`R3-E01..07c`, still open); the charms (`R3-P03`);
release. **Do not invent a second seal format** - `catalog.ts` is the only declaration site.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from the command that
produced it; state the instrument in the same breath as the number. If the stage has to be opened
for the mechanic to be reachable, that is a shipping change and owes the re-baseline list.
