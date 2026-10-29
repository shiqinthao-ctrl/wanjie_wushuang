# TASK.md - R3-M06: a 420-second stage you win at 290

Base: R3-M05 (D35). **No queue entry.** D35 measured `CH001-02` at 33/33 and then noticed the number
underneath it: every win ended at 289.98 s, the third seal's dwell completing, while the stage clock
runs to 420. The last 130 seconds are only ever seen by a player who is losing.

## Why

`CH001-02`'s victory condition is "hold all three seals". The seals open at 90 / 180 / 270 and each
needs twenty seconds, so the earliest win is 290. The stage is 420. That gap is not a tuning choice -
it is two numbers in different files that were never put next to each other, and it is the same shape
as D34's finding (a table that ended at 360 while the stage ran to 420). D34 fixed the loser's half;
this is the winner's.

## Scope

0. **Verify the premise first, with a command.**
   (a) For each of the three stages, compute the earliest possible victory from its own data
       (seals + dwell, or boss spawn + kill) and put it beside `duration`. Which stages have a gap?
   (b) `CH001-01` lost 6 of 33 seeds to **timeout at 360 s with positive hp** - not death. Read
       `calibration-report.json` and say how many of each `endReason` per stage. Is that the same
       shape (a clock shorter than the fight) or a different one?
   (c) Who reads `duration`? Count the readers and name what each would do if it changed - the
       timeout verdict, the HUD clock, `UiStage`, the objective line.
   (d) Who reads `seals[].opensAt`? Count the assertions that would move.
1. **Close the gap on `CH001-02`.** Either the clock comes down or the seals move later - pick one,
   say why, and record the other. Do not do both.
2. **Re-measure 33 seeds on both versions** and report both rates, even if the second one is worse.
3. **`CH001-01`'s timeouts: measure, do not fix.** Say how many and what they are; fixing it is a
   different slice with a different lever.
4. **Re-baseline, explicitly.** Same rule as D23-D35: what moved, old numbers beside new.

## Out of scope

Art and audio; a fourth stage; the enemy pool; difficulty tiers; re-tuning the wave tables (D34's
rows stay as they are).

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. Balance numbers need >= 33 seeds; a win rate without its instrument
declared is not a measurement.
