# TASK.md - R3-M04: three stages, one wave table?

Base: R3-U06 (D33). **No queue entry** - the queue ends at #19 and is now empty. This slice comes
from `handoff/STATE.md`'s unresolved list, which has carried "章节线继承第一关波次表" since D25
without anyone measuring it.

## Why

Three stages are clickable for the first time. If all three spawn from the same table, then "three
stages" is one stage with three objectives - and what the player feels between them is a rule change,
not a fight. That is worth knowing before anything is built on top of it, and it is exactly the kind
of claim this project has learned not to accept from a note.

## Scope

0. **Verify the premise first, with a command.**
   (a) Which stage does the spawner read its waves from? Name the line, and count the readers of
       `stage.*` that are not `duration` / `seals` / `eliteChecks` / `boss`.
   (b) If all three share one table, is that a decision or an inheritance? Find the commit or the
       comment that says so - an inheritance with no owner is a coincidence, not a rule.
   (c) What does the GDD promise per stage, and does any of it already exist in data?
   (d) What would a second table cost? Count the assertions that pin the first one.
1. **If the stages already differ**, say so and stop: zero production change, the delivery is the
   measurement plus the attribution.
2. **If they do not**, give each stage its own row, derived from what the stage asks for (a seal
   stage should not be paced like a Boss stage), and keep `CH001-01` byte-identical.
3. **Re-baseline, explicitly.** Same rule as D23-D33: what moved, old numbers beside new.

## Out of scope

Art and audio; a fourth stage; difficulty tiers; re-tuning the six charm effects; anything that
changes a shipped run's numbers on `CH001-01`.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. Balance numbers need >= 33 seeds; a win rate without its instrument
declared is not a measurement.
