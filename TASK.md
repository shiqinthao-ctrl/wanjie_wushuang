# TASK.md - Mobile modernization / P2b experience and choices

Status: complete. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate XP crystals and level choices as pure TypeScript rules. Preserve values,
collection-before-attraction order, overflow conservation, thresholds, prepared
pools and legacy random ordering. Capture isolated old-runtime oracle fixtures.
Connect progression snapshots, choice commands, crystal rendering and upgrade UI
to the single GameCore lifecycle. Natural kill/pickup acceptance follows combat
migration; never add fake crystal spawns or public controls to simulate progress.

## Authorized dependencies
Current app dependencies remain authorized. No additions in this slice.
Allowed: apps/mobile-next source/data/tests; tasks/mobile-modernization tools,
fixtures and evidence; five handoff sections. Old runtime/saves remain unchanged.

## Acceptance
Compare crystal boundaries, overflow, multiple pickups, difficulty XP, upgrade
pool eligibility, caps and chained choices with legacy outputs. Verify pause and
stale/repeated choice safety. Strict types, rule tests, build and browser lifecycle.
Run legacy check -> smoke -> audit -> context -> archive:verify; then new checks.
Update five handoff sections; preserve baseline hashes and all save invariants.

## Constraints
No legacy wrapper host, hidden runtime state injection for acceptance, public
Debug UI, new content/balance, backend, old-save mutation or entry replacement.
Physical Android/iPhone performance and installation remain pending.
