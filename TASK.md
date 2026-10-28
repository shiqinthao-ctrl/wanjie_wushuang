# TASK.md - R3-P04: chapter challenges, and the four words the queue gives them

Base: R3-P03 (D30). Queue `QUEUE.md` #17. The queue's entire spec is "no permanent numeric crushing".

## Why

`chapters.stars` / `chapters.clears` exist and `settlement` writes them; nothing has ever read them
back. Four words is a constraint, not a design - so this slice has to *define* what a challenge is
before it builds one, and the definition has to be small enough to be honest.

## Scope

0. **Verify the premise first, with a command.**
   (a) What do `chapters.stars` / `clears` record today, and who reads them? Count readers.
   (b) Is there any permanent numeric gain from replaying a stage today? If none, say which line
       makes that true - an absence with no owner is a coincidence, not a rule.
   (c) Does a challenge need a save field, or is it derivable from what a settled report already
       holds? `stars` is written as `0/1` while the validator admits `0..3` (D29) - say whether that
       gap is in the way.
   (d) What does the GDD promise for this chapter, and which part of it is already built?
1. **Define the row in data** - one row per challenge: what it asks, what it pays, and what it must
   not change. A challenge that grants a permanent stat is the thing the queue forbids; pin that
   with an assertion, not a comment.
2. **Reachable from the lobby**, and the state that satisfies a challenge survives the run that
   satisfied it.
3. **Read-only where it says so.** If a challenge needs a write, it is one write, named.
4. **Re-baseline, explicitly.** Same rule as D23-D30: what moved, old numbers beside new.

## Out of scope

Art and audio; the chapter UI entry (`R3-U06`); a second progress field; re-tuning a stage's budget;
anything that changes a shipped run's numbers when no challenge is active.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. A page that only exists in a template is not shipped: it owes a
route from the lobby and an assertion that the route is reachable.
