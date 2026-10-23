# TASK.md - R3-M01: the first stage's map, and the "limited random event slot" it does not have

Base: R3-E01..07a (D23). Queue `QUEUE.md` #11.

## Why

`FirstStageMap` is 109 lines and holds the whole map: six interactables, one hazard, five recovery
ticks. The queue's row asks for "第一关地图与有限随机事件槽" with three acceptance items - no
invisible blockers, a hazard layer hierarchy, boundaries. Find out which of the three describe the
code and which describe the row's imagination. Two look wrong already:

- `layout` (`:12`) is a `const` array of six `[type, x, y]` fractions. Nothing on this map is random
  except the hazard's `y`. "有限随机事件槽" may name something that does not exist.
- There are **no obstacles at all**. If nothing can block, "no invisible blocker" holds because
  there is nothing to hide - a different statement from the row's.

## Scope

0. **Verify the premise first, with a command.** For each acceptance item, say whether the thing it
   guards exists: (a) any collider, wall or blocked region the player or an enemy can hit? (b) how
   many hazard *layers*, and does the existing one leave an escape that does not depend on the
   viewport? (c) what clamps whom at the world edge - player, enemies, projectiles? Derive it.
1. **Make the hazard honest before making it richer.** `fireline` spans `x: 0, w: world.width`
   every 26 s for 4 s at 8 dmg/s, `size 36`, and its `y` is drawn from a viewport-height band
   centred on the player. Measure whether that band can place the line where it cannot be escaped
   (or is never met), and whether 4 s is enough to walk out of 36 px.
2. **Decide the event slot, and write the decision down.** Either the six objects become a bounded
   random draw (seeded, so a run is reproducible) or the word "random" leaves the row. A fixed
   layout is a legitimate design; a fixed layout called random is a lie in the queue.
3. **Boundaries.** One clamp for player, one for enemies, one for projectiles - or one shared rule.
   Say which, and assert the corners (`(0,0)` and `(w,h)`).
4. **Re-baseline, explicitly.** Any report whose run reads the map gets re-run, old numbers beside
   new. A report not re-run is marked stale in `handoff/STATE.md`'s unresolved risk.

## Out of scope

Art and audio; the "two elites" definition (`R3-E01..07c`, still open, and it blocks `R3-M03`);
stages 2-3 (`prepare.ts:11` refuses them until `R3-M03`); release; any new ruleset value.

## Constraints

`AGENTS.md`, plus: **no Playwright here** - a visual claim is an assertion on the field the renderer
reads, and the delivery says the picture is unverified; every number re-derivable from the command
that produced it; state the instrument in the same breath as the number. This slice **may** change
the shipping profile - if it does it owes the explicit re-baseline list D23 owed, and should expect
the same failure mode: a red assertion hides the ones after it in the same `it`.
