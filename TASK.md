# TASK.md - R3-P02: the last twenty runs, and what a report is allowed to claim

Base: R3-P01 (D28). Queue `QUEUE.md` #15. Unblocked by R2-D (D21).

## Why

`settlement` already builds a `ChapterReport` for every settled run and keeps the newest twenty
(`progress.reports.unshift(...).slice(0, 20)`). Nothing renders the list: the player sees one result
screen and then loses the run. This slice is the page that shows the twenty - read-only, no new save
field.

## Scope

0. **Verify the premise first, with a command.**
   (a) What exactly does one `ChapterReport` hold, and which of those fields are already shown once?
   (b) Is the list really capped, and where - the writer, the validator, or both?
   (c) Are there fields that *look* recorded but are never written (the `hazardPeak` failure mode)?
   (d) Where is the page hung - the same hand-written union as the codex, or something new?
   (e) Does this page need a save field that does not exist? Say so before adding one.
1. **One row per run, oldest last**: stage, hero, form, result, time, level, kills, stars, seed.
   A run that ended in `defeat` or `timeout` must be as legible as a victory - the list is a record,
   not a trophy case.
2. **No aggregate claim the data cannot support.** If a summary line (win rate, median time) is
   shown, it names its denominator and its window (which runs, how many). A percentage over 3 runs
   is not a win rate.
3. **Read-only.** `readChapterProgress` and nothing else; no save writes.
4. **Re-baseline, explicitly.** Same rule as D23-D28: what moved, old numbers beside new.

## Out of scope

Art and audio; charms (`R3-P03`); the chapter UI entry (`R3-U06`); release; anything that replays or
re-settles a stored report. **Do not add a second report store** - `progress.reports` is the only one.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads, and
the delivery says the picture is unverified; every number re-derivable from its command; state the
instrument with the number. A page that only exists in a template is not shipped: it owes a route from
the lobby and an assertion that the route is reachable.
