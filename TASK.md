# TASK.md - R3-P03: six charms, and the one line that refuses to let you wear them

Base: R3-P02 (D29). Queue `QUEUE.md` #16. Unblocked by R3-M03 (D27).

## Why

`chapterCharms` defines six ids and `freshChapterProgress` unlocks the first three; the other three
are awarded by `settlement` on victory, awakening and two bonds. Nothing has an effect:
`prepare.ts:34` throws `战备护符效果尚未接入` the moment `charms.equipped` is not null. So the sixth
turning point of G10 is **0, structurally**, and the charm you just earned cannot be worn.

## Scope

0. **Verify the premise first, with a command.**
   (a) What are the six ids, and is *any* of them implemented anywhere? Count readers, not mentions.
   (b) Where does equipping fail, who catches it, and what does the player see?
   (c) Where can an effect legally attach? Name the hook and its opt-in rule - the shipped oracle
       (`combat-math-oracle.json`, `GameCore.test.ts:9`'s `incoming: .44`) must stay byte-identical
       when nothing is equipped.
   (d) Are the three earned charms reachable in a real run? Awakening and two bonds are gates, not
       promises - measure them on a stage that ships, the way D23/D26 measured theirs.
   (e) Does this need a save field? `charms.equipped` exists - say whether it is enough, and who
       validates it.
1. **Six effects, one equipped at a time.** Each charm states what it changes and by how much, in
   data where possible. No charm may be a no-op, and no charm may silently do two things.
2. **Equipping must be reachable from the lobby**, and the equipped charm must survive into the run
   the player then starts - assert the path, not the template.
3. **Read-only where it says so.** Equipping is the one write; the battle itself must not write
   `mobileChapter`.
4. **Re-baseline, explicitly.** Same rule as D23-D29: what moved, old numbers beside new.

## Out of scope

Art and audio; the chapter UI entry (`R3-U06`); challenges (`R3-P04`); a second charm store or a
second progress field; re-tuning any stage's difficulty budget.

## Constraints

`AGENTS.md`, plus: no Playwright - a visual claim is an assertion on the field the renderer reads,
and the delivery says the picture is unverified; every number re-derivable from its command; state
the instrument with the number. A page that only exists in a template is not shipped: it owes a
route from the lobby and an assertion that the route is reachable.
