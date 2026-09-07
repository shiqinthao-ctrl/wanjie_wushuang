# TASK.md - Mobile modernization / P2d first-stage combat

Status: completed and verified. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Connect H001 actions, first-stage enemy waves, prepared skills and PET001 to the
single GameCore lifecycle. Capture legacy action/spawn oracles before migration.
Preserve frame cap, rule order, damage modifiers and entity caps independent of
visual quality. Verify natural kill -> crystal -> pickup -> choice -> resume.
Stage events, B001, Boss Loot and persistent settlement follow in later slices;
ST001-01 still requires its original B001 at 270s and 360s objective.

## Authorized dependencies
Current app dependencies remain authorized. No additions in this slice.
Allowed: apps/mobile-next source/data/tests; tasks/mobile-modernization tools,
fixtures and evidence; five handoff sections. Old runtime/saves remain unchanged.

## Acceptance
Compare hero actions, prepared skill constructs, enemy spawns and kill rewards
with legacy functions. Verify pause/destroy cancel scheduled actions, input cleanup,
natural desktop/portrait growth loop, strict types, rule tests and browser lifecycle.
Run legacy check -> smoke -> audit -> context -> archive:verify; then new checks.
Update five handoff sections; preserve baseline hashes and all save invariants.

## Constraints
No legacy wrapper host, hidden runtime state injection for acceptance, public
Debug UI, new content/balance, backend, old-save mutation or entry replacement.
Physical Android/iPhone performance and installation remain pending.
