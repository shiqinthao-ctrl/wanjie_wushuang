# TASK.md - Mobile modernization / P2e first-stage map

Status: completed and verified. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate ST001-01 map interactables, fireline hazards and timed recovery into the
single GameCore loop. Expose nearby interaction prompts, route guidance and
one-use progress through touch and keyboard. Capture effective legacy fixtures
before implementation; verify a natural movement -> interaction flow.
Events/chests, evolution/fusion, B001/Boss Loot and persistent settlement are
later slices. ST001-01 keeps its original 270s Boss and 360s objective.

## Authorized dependencies
Current app dependencies remain authorized. No additions in this slice.
Allowed: apps/mobile-next source/data/tests; tasks/mobile-modernization tools,
fixtures and evidence; five handoff sections. Legacy runtime/saves stay unchanged.

## Acceptance
Compare all map actions, damage, XP, healing and hazard timing with legacy
fixtures. Check distance boundaries, repeated use, suppression, capped healing,
pause/destroy behavior and choice priority. Verify actual keyboard/touch movement
to a map object, visible use feedback, portrait layout and browser console.
Run legacy check -> smoke -> audit -> context -> archive:verify, baseline hashes,
then app typecheck/tests/build/browser. Update five handoff sections.

## Constraints
No legacy wrapper host, runtime injection for natural acceptance, public Debug
UI, new content/balance, backend, old-save mutation or entry replacement.
Physical Android/iPhone performance and installation remain pending.
