# TASK.md - R3-P01: the codex, and what it is allowed to know

Base: R3-M03 (D27). Queue `QUEUE.md` #14. Unblocked by R2-D (D21). **Scope 0 done: D28.**

## Why

D21 priced "players cannot see the fusion recipes" as **information, not supply**: the pool is the
same for everyone, so the fix is a page. `progress.discoveries` already records
`discovered / awakened / cleared` per form and `settlement` writes it - nothing reads it back yet.

## Scope

1. **One page, three truths per row**: exists in the catalog, seen by this save, and what it needs.
   A row the save never touched must read "not found", not "locked" - `discoveries` stores absence
   as `undefined`. "What it needs" is **two gate pairs**, so name the line: chapter (`pacing:
   legacy`) form Lv.3 / awaken Lv.8 + core Lv.3; evolution journey on `threat-v2` Lv.10 / Lv.19.
2. **Fusions are pairs, with two columns that each name their source** (D28): `可组装` - both parts'
   skills are in `activeSkills`/`passiveSkills` (**4 of 10**, the same four for all three heroes) -
   and `本档构筑持有` - from `save.build`. Not one column: "holds both" is constant-true in the
   evolution journey, where `evolutionBuild` hands every hero all 10 actives and all 11 passives.
   D21: the page marks the recipe, it does not weight the pool.
3. **Read-only.** No save writes. If it needs progress it reads `readChapterProgress` only.
4. **Re-baseline, explicitly.** Same rule as D23-D27: what moved, old numbers beside new.

## Out of scope

Art and audio; charms (`R3-P03`); the chapter UI entry (`R3-U06`); release. **No second catalog** -
`heroForms` / `chapterHeroes[...].forms` and `fusions.json` are the only lists.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. A page that only exists in a template is not shipped: it owes a
route from the lobby and an assertion that the route is reachable.
