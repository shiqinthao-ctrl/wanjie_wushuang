# TASK.md - Mobile modernization / P2a startup rules

Status: complete. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate permanent growth, equipped instance bonuses, sets, rune/pet resonance
and startup player calculation into independent typed modules. Use the preserved
legacy runtime as an isolated rule oracle, with fresh Schema30 and explicit test
variants. Wire H001 stats into the preview and preparation summary. This is a
prerequisite to P2 combat, not a claim of playable first-stage parity.

## Authorized dependencies
Current app dependencies remain authorized. No additions in this slice.
Allowed: apps/mobile-next source/data/tests; tasks/mobile-modernization tools,
fixtures and evidence; five handoff sections. Old runtime/saves remain unchanged.

## Acceptance
Compare all six heroes, level/star/mastery thresholds, 30 equipment templates,
sets, all rune resonance types and five pets against the legacy oracle. Preserve
operation order, intermediate rounding, instance identity and virtual passives.
Strict types, rule tests, production build and preparation/browser acceptance.
Run legacy check -> smoke -> audit -> context -> archive:verify; then new checks.
Update five handoff sections; preserve baseline hashes and all save invariants.

## Constraints
No legacy wrapper host, hidden runtime state injection for acceptance, public
Debug UI, new content/balance, backend, old-save mutation or entry replacement.
Physical Android/iPhone performance and installation remain pending.
