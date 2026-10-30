# TASK.md - R3-U07: one difficulty, and it is the one nobody chose

Base: R3-M07 (D37). **No queue entry.** `prepareChapterRun` rejects every difficulty but `normal`
with one comparison, while `difficulties.json` already has four rows and every coefficient in them is
read on this path. So the chapter track ships a choice that exists in data, works end to end, and is
refused at the door.

## Why

Three stages are clickable, graded, and paid - at exactly one difficulty. The four rows are not a
plan: `budget` feeds `director`, `elite` feeds its elite chance, `hp`/`dmg`/`speed` feed
`createEnemy` and `FirstBoss`, `xp` feeds crystals. All of that already runs on a chapter run; the
only thing missing is permission. A player who finds `CH001-02` too easy (33/33, D37) has no lever,
and the data to give them one is already loaded.

## Scope

0. **Verify the premise first, with a command.**
   (a) Where does `difficulty` appear as a type, a default, or a check? List every site - the type in
       `ChapterRunOptions`, the comparison in `validateChapterOptions`, the equality check in
       `validateChapterFinal`, the report field, the save validator.
   (b) Which of the nine coefficients in `difficulties.json` are actually read on the chapter path,
       and by which line? Name the ones that are dead here.
   (c) Does widening the type reach the report or the save schema? Say so before writing the selector.
   (d) How many existing tests hardcode `difficulty: 'normal'`, and would any of them change meaning
       if the type widened?
1. **Open the door to the four rows the data already has.** Do not write a second list of names; take
   them from `difficulties.json` so a fifth row cannot be half-added.
2. **The selector lives in `ChapterPanel`, and the choice rides on `ChapterRunOptions`.** One write,
   named - the same rule as every slice since D30.
3. **Pin the coefficients, not the outcome.** Assert that the four difficulties prepare, and that the
   spawn interval at `easy` is longer than at `nightmare` - a rate assertion would need 4 x 33 seeds
   and would be measuring the bot, not the door.
4. **Re-baseline, explicitly.** Same rule as D23-D37: what moved, old numbers beside new.

## Out of scope

Art and audio; a fifth difficulty; re-tuning any of the four rows; the hero selector (a separate
decision - `save.hero` belongs to the journey track); anything that changes a `normal` run.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command. A
difficulty that changes a shipped `normal` run by one byte is a regression, not a feature.
