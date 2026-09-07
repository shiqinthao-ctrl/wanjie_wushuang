# TASK.md - Mobile modernization / P2i first Boss and loot

Status: completed. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate effective ST001-01 B001 at 270s, original HP/attack/AI and map hooks.
Port Boss Loot generation and one-use choices, kill gear and shared run drops.
Connect Boss Loot priority to timed chests and completion guards. Surface Boss
health/telegraphs and loot choices through normal rendering/UI. Preserve defeat
and timeout semantics and expose guarded outcome for the next settlement slice.
Keep original RNG/clock order and frame timing. Atomic settlement and a complete
natural victory/retry remain the next bounded slice before P2 acceptance.

## Authorized dependencies
No new dependencies. Current app source/data/tests, capture/oracle/evidence under
tasks/mobile-modernization and five rotating handoff sections are in scope.
Legacy source/entry/storage, archived files and locked dependencies stay intact.

## Acceptance
Capture isolated effective legacy spawn/attack/damage/loot/timeout oracles.
Add failing rule tests before implementation. Verify no respawn, priority,
pause/background/destroy, one-use rewards and original loot/kill gear ordering.
Use explicit synthetic browser fixtures for Boss branches and natural gameplay
for spawn/telegraphs when reachable; never label fixtures as natural acceptance.
Inspect narrow layout, errors and resource loading. Keep full stage acceptance
pending until actual natural victory/defeat/retry runs with settlement exist.
Run legacy five gates, 49 baseline hashes, strict app types/tests/build/browser.
Update handoff and status with precise remaining boundaries.

## Constraints
Preserve original parameters, RNG and temporal order; no public Debug UI or new
gameplay. Gear remains run-local until later settlement.
Physical-device, PWA and release acceptance remain pending; no deployment/push.
