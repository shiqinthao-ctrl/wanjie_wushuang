# TASK.md - R3-U06: the chapter entry, and the four pages that are empty without it

Base: R3-U01..05 (D32). Queue `QUEUE.md` #19. The queue's whole spec is "close GDD finding 7".

## Why

`App.vue` never passes `:chapter` to `BattleView`, so the chapter track is constructible, winnable
and settleable - and **unclickable**. Everything built on it since D27 is therefore invisible to a
player: the codex, the run record, the six charms and the three challenges all read progress that
no reachable run can produce. D32 counted the page side of that: the queue's "章节" page does not
exist. This slice is that page.

## Scope

0. **Verify the premise first, with a command.**
   (a) Where exactly does `BattleView` take `chapter`, what shape does it need, and what does
       `ChapterRunSession` read from it? Name the three lines.
   (b) What already exists that a chapter entry would reuse - the hero table, `prepareChapterRun`,
       `OPEN_STAGES`, the charm list? Count what is missing between "click" and "run starts".
   (c) Which of the four empty pages start producing content the first time a chapter run settles,
       and which stay empty for a different reason? Name the writer for each.
   (d) What does the lobby do today when the chapter track is unavailable - and what does the
       existing `launchBlocker` already refuse? Do not invent a second gate.
1. **One entry, three stages, one write.** The lobby gains a chapter entry that names the stage and
   the worn charm, and hands `BattleView` a `ChapterRunOptions`. Stage selection is `OPEN_STAGES`,
   not a new list.
2. **No second gate.** Reuse `launchBlocker` / `previewBlocker` for anything that already blocks a
   run; a new check is only justified where the chapter track differs from the legacy one.
3. **The four pages get a first real row.** A chapter run settled from the UI must appear in the run
   record and pay a challenge. Assert it through the same reducer the page reads.
4. **Re-baseline, explicitly.** Same rule as D23-D32: what moved, old numbers beside new.

## Out of scope

Art and audio; a stage-select screen with per-stage art; difficulty and mode selectors; the six
charm effects' balance; any change to a settlement number.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. A page that only exists in a template is not shipped: it owes a
route from the lobby and an assertion that the route is reachable.
