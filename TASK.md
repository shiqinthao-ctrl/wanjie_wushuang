# TASK.md - R3-M08: ninety seconds, and six runs that never got there

Base: R3-U07 (D38). **No queue entry.** D36 measured `CH001-01` losing 6 of 33 seeds to the clock
with **positive hp** (40-279) - not killed, just out of time. The Boss spawns at 270 and the stage
ends at 360, so the fight has 90 seconds. The fastest win kills it in 37. The slowest run does not
kill it in 90. That spread is the slice.

## Why

D36 fixed `CH001-02`, whose clock was *longer* than its victory condition. This is the opposite
direction: a clock *shorter* than the fight, on the stage every player meets first. Six runs in
thirty-three ended because a timer expired while the player was alive - the one outcome a player
cannot read as "I was beaten".

## Scope

0. **Measure where the 90 seconds go, before choosing a lever.**
   (a) Count readers: `boss.spawnAt`, `boss.hp` (the `FirstBoss` row), and `duration`. Name every
       site. Pick the lever with the fewest - D36's rule.
   (b) Among the 22 wins, the distribution of **Boss-spawn-to-kill** seconds. Among the 6 timeouts,
       **the Boss's remaining hp** at the final frame. A timeout at 90% boss hp and one at 10% are
       different defects; do not report a count without this split.
   (c) Does the wave table carry a `boss` row tied to `spawnAt`? If the lever moves the spawn, does
       anything else have to move with it (the D36 lesson: an elite row 70 s from its seal is a
       random elite).
   (d) What does the GDD promise about the first stage's length, if anything? If nothing, say so -
       this is a decision nobody has made, not a promise being broken.

1. **Change at most one number**, and only if (b) says the timeouts are a clock problem rather than
   a player problem. If the Boss is at 90% hp when the clock expires, the player never engaged and
   the lever is not the clock - write that down and change nothing.
2. **Re-measure the same 33 seeds**, report win rate beside the old one, and report the timeout
   count beside the old one. A change that trades timeouts for defeats is not a fix.
3. **Pin the shape, not the outcome**: assert the Boss's spawn leaves at least N seconds before
   `duration` for every open stage - a rule that a fourth stage inherits.

## Out of scope

Art and audio; the four difficulty rows (D38 shipped them); `CH001-02` (33/33, two attempts have
failed, leave it); the hero selector; anything that changes a `normal` run's first frame.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. `CH001-02` and `CH001-03` must stay byte-identical unless the
measurement says otherwise, and then it has to be said out loud.
