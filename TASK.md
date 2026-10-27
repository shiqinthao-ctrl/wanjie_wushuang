# TASK.md - R3-P01: the codex, and what it is allowed to know

Base: R3-M03 (D27). Queue `QUEUE.md` #14. Unblocked by R2-D (D21).

## Why

D21 priced the "players cannot see the fusion recipes" gap as **information, not supply**: the pool is
the same for everyone, so the fix is a page that shows what exists and what it needs. That page is
this slice. `progress.discoveries` already records `discovered / awakened / cleared` per form, and
`settlement` already writes it - nothing reads it back yet.

## Scope

0. **Verify the premise first, with a command.**
   (a) What does `progress.discoveries` hold today, and is every form ever written to it?
   (b) Where is the form catalog, and does a form have a name/description, or only an id?
   (c) What do the fusion rows actually say - two parts and a result, or something weaker?
   (d) Is there a page to hang this on, and what does the shell route look like?
   (e) Does the codex need a save field that does not exist? Say so before adding one.
1. **One page, three truths per row**: exists in the catalog, seen by this save, and what it needs.
   A row that the save has never touched must read as "not found", not as "locked by a rule".
2. **Fusions are shown as pairs**, with the two parts and whether this save holds both. D21's
   decision is that the page marks the recipe - it does not weight the pool.
3. **Read-only.** The codex must not write the save. If it needs progress, it reads
   `readChapterProgress` and nothing else.
4. **Re-baseline, explicitly.** Same rule as D23-D27: list what moved, old numbers beside new.

## Out of scope

Art and audio; the charm effects (`R3-P03`); the chapter UI entry (`R3-U06`); release. **Do not add a
second catalog** - `chapterHeroes[...].forms` and `evolutionCatalog` are the only form lists, and
`fusions.json` is the only fusion list.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from the command that
produced it; state the instrument in the same breath as the number. A page that only exists in a
template is not shipped: it owes a route from the lobby and an assertion that the route is reachable.
