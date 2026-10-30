# TASK.md - R3-M07: is "hold the seal and let them come to you" the whole game?

Base: R3-M06 (D36). **No queue entry.** D36 fixed the victory window (130 s -> 60 s) and the win rate
did not move: `CH001-02` is still 33/33. The window was not the difficulty. D36 wrote down a
suspicion instead - the seal policy circles inside the radius and never has to charge - and left it
unmeasured. This slice measures it.

## Why

Two of the three stages are won 66.7% and 51.5% of the time by the same bot; the seal stage is 100%.
If that gap comes from "the objective lets you stand still", then the stage is not easier - it is
asking a different, smaller question. That distinction decides whether the fix is a number or a
mechanic, and right now it is a guess written in a decision log.

## Scope

0. **Verify the premise first, with a command.**
   (a) Does `CombatSimulation` record damage by source for a chapter run, and is the field readable
       from a test? Name it; if it is empty on this path, say so before building anything.
   (b) What exactly would a "clear first" arm change - one line of movement, or the choice logic too?
       Quote the branch.
   (c) What does the current arm's damage curve look like across the 33 seeds, and where does it
       peak - on a seal, or between seals?
   (d) Do the two Boss stages record the same field? Without that, there is no comparison.
1. **Add one arm, not a new bot.** `clear`: when a body is inside 70 px, walk at it and kill it
   before returning to the seal. Everything else stays identical to the `seal` arm.
2. **33 seeds per arm**, three arms (`seal` / `clear` / `idle`), and report rate **and** damage taken
   **and** where the run ended. A rate alone cannot tell "easier" from "shorter".
3. **If `clear` is worse than `seal`**, that is the finding: the stage rewards not engaging. Say so,
   do not retune the stage in the same slice.
4. **Re-baseline, explicitly.** Same rule as D23-D36: what moved, old numbers beside new.

## Out of scope

Art and audio; a fourth stage; difficulty tiers; re-tuning `CH001-01`'s timeouts (a different lever -
D36 measured them and stopped); changing the wave tables again.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. Balance numbers need >= 33 seeds; a win rate without its instrument
declared is not a measurement.
