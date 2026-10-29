# TASK.md - R3-U01..05: five pages, six states, and the ones handled only next door

Base: R3-P04 (D31). Queue `QUEUE.md` #18. The queue's whole spec is "empty / busy / error / retry /
save / narrow-screen, complete states".

## Why

Five pages are named and none has been audited for the six states. The failure modes already exist in
the code - `progressError`, `storageError`, `transactOnce` receipts, the catch-all in `BattleView` -
and they are handled unevenly: one page says "the save cannot be read", its neighbour draws an empty
list that looks like "you have never played". A page that renders only its happy path is a screenshot
of one state, not a page.

## Scope

0. **Verify the premise first, with a command.**
   (a) Which of the five pages exist today, and where is each routed from? Count them against
       `App.vue`'s `page` union - and against the queue's own claim about how many there are.
   (b) For each of the six states, name the page and the line that handles it. Count the holes per
       page, not in total: a state handled on one page and not its neighbour is the finding.
   (c) Is `transactOnce`'s retry reachable from the UI or only from a test? Read every call site and
       say which ones the player can retry.
   (d) What does the narrow layout do today - reflow, clip, or scroll? Cite the CSS, not the intent.
1. **One state per row, in data** - `page x state` with the line that handles it, so a hole is a
   missing row rather than a missing `v-if`.
2. **Fill the holes, or name them out of scope with the reason.** No silent half-states.
3. **Re-baseline, explicitly.** Same rule as D23-D31: what moved, old numbers beside new.

## Out of scope

Art and audio; the chapter battle entry (`R3-U06`, #19); any change to a settlement number; a new page;
re-tuning the six charm effects.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads, and
the delivery says the picture is unverified; every number re-derivable from its command; state the
instrument with the number.
