# TASK.md - R3-M05: the stage I re-paced and never played

Base: R3-M04 (D34). **No queue entry** - the queue ends at #19. This slice exists because D34 changed
what `CH001-02` spawns and then measured only one thing about it: that `director(...).interval` is
finite at 400 s. That proves "it spawns", not "it can be won".

## Why

D34 gave `CH001-02` its own six-row table because the inherited one stopped at 360 s while the stage
runs to 420 - sixty seconds of nothing. The new table is a design claim (flat, continuous pressure;
two elite rows just before the seals they gate) with **no play evidence behind it**. `seals.test.ts`
is green, but it jumps the clock to 90 s and tests the seal rule, never the first ninety seconds of
spawning. This is the one gap the last slice wrote down about itself; closing it is cheaper now than
after anything is built on top.

## Scope

0. **Verify the premise first, with a command.**
   (a) What does `seals.test.ts` actually drive - does any of it run the spawner for a full stage?
       Quote the line that skips the clock.
   (b) Is there a reusable player? `altar.test.ts` has one that wins `CH001-03`; name the function,
       the policy it encodes, and what it would need to hold a seal (it is built to keep moving).
   (c) How long does one seeded run of `CH001-02` take? Measure three before committing to 33.
   (d) What is the win condition on this stage, and can the bot satisfy it at all - three seals, each
       needing twenty seconds of standing still?
1. **Measure, with the instrument declared.** >= 33 seeds per policy, at least two policies (one that
   holds the point, one that keeps moving), and report the rate with its denominator and its policy.
2. **Compare against the two stages that did not change.** The same bot on `CH001-01` and `CH001-03`
   is the control: a rate is meaningless without one.
3. **If the stage cannot be won, say so and retune once** - record both versions and both rates.
   Do not tune until green.
4. **Re-baseline, explicitly.** Same rule as D23-D34: what moved, old numbers beside new.

## Out of scope

Art and audio; a fourth stage; difficulty tiers; the enemy pool (D34 left it shared on purpose);
anything that changes `CH001-01` or `CH001-03`.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. Balance numbers need >= 33 seeds; a win rate without its instrument
declared is not a measurement. If the bot is the limit rather than the stage, say that instead of
retuning.
