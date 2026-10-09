# TASK.md - R2-S01..12: the twelve skill routes, one at a time

Base: R2-F-BOSS-COVERAGE (**instrument, zero production change**). Roadmap
`tasks/game-remediation/ROADMAP.md`; queue `QUEUE.md` #7. Spec: `QUEUE.md` §"R2-S01..12".

## Why

`skillRoutes` (`evolutionCatalog.ts:28`) defines **twelve** routes across **five** base skills:
`volley/nova/ringfire` (A011), `roaming/orbit/ambush` (A026), `hunter/guard` (S001),
`glacier/shatter` (G2_FROST), `relay/thunderstrike` (A013). The table and the route branches in
`EvolutionCombat.cast` (`:176-198`) both exist. What does not is **exclusivity and boundary
acceptance**: a route is chosen once per skill (`RunEvolution:74-83`, keyed by skill so the second
choice never appears), and nothing asserts that choosing one route makes the others unreachable,
that a route is legible to the player, or that the branch it takes is the one the table promises.

## Scope

0. **Verify the premise first**, on the current tree: enumerate `skillRoutes` and the
   `EvolutionCombat.cast` route branches **with a command**, and report per skill whether the routes
   are (a) mutually exclusive, (b) all reachable, (c) described by a branch that names them. Do not
   trust the count in this file - it says twelve routes over five skills; count it.
1. **Per-route behaviour**: for each of the twelve, drive its branch and read what the table's
   `detail` promises (count/speed/area/split, `guard` vs `hunter`, `glacier` vs `shatter`,
   `relay` vs `thunderstrike`). A route whose branch does not match its own `detail` is the finding.
2. **Exclusivity and boundary**: the second choice for a skill must never be offered
   (`RunEvolution:74`); an owned route must persist across ranks; a route for an unowned skill must
   never be offered; the route must survive the level-19 awakening.
3. **Ruling**: land the assertions, or pin the gap with an instrument, or leave a priced option.
   Either way every route's promise is asserted somewhere it cannot go quiet.

## Out of scope

Any balance change. Any edit to the route table or the branch list - this slice asserts what exists.
Art, audio, release. `R2-D`'s build report (200 seeds) is a separate slice.

## Constraints

`AGENTS.md`, plus: `legacy` byte-identical; no new dependencies; every number re-derivable from the
command that produced it; state coverage in the same breath as the numbers, as `byteLedger.test.ts`
does for the evidence tree and `R2-F-BOSS-COVERAGE` does for the pressure cells.
