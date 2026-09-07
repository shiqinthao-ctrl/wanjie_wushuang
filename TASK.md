# TASK.md - Mobile modernization / P2c combat modifiers

Status: complete. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate virtual passives, skill modifiers, outgoing and incoming damage as pure
TypeScript rules. Preserve additive/multiplicative order, caps, elemental source
mapping, evolution, awakening, healing and shield/invulnerability order. Capture
isolated old-runtime oracle fixtures before implementation. No enemy/hero action
simulation in this slice; these rules are the next combat integration foundation.

## Authorized dependencies
Current app dependencies remain authorized. No additions in this slice.
Allowed: apps/mobile-next source/data/tests; tasks/mobile-modernization tools,
fixtures and evidence; five handoff sections. Old runtime/saves remain unchanged.

## Acceptance
Compare all skill/element families, levels, virtual passives, targets, awakened
heroes, stacked bonuses, critical skill healing and incoming shield/DR boundaries
with final legacy functions. Strict types, rule tests, build and browser lifecycle.
Run legacy check -> smoke -> audit -> context -> archive:verify; then new checks.
Update five handoff sections; preserve baseline hashes and all save invariants.

## Constraints
No legacy wrapper host, hidden runtime state injection for acceptance, public
Debug UI, new content/balance, backend, old-save mutation or entry replacement.
Physical Android/iPhone performance and installation remain pending.
