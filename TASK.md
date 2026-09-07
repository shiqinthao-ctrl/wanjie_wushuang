# TASK.md - Mobile modernization / P2h timed chests and evolution

Status: complete. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate effective ST001-01 timed rewards at 90/210/300 seconds. Require explicit
claim; freeze combat during selection and preserve claim/choice idempotency.
Port config-ordered fusion/evolution priority, owned upgrades, purple chest
gear, shared run-local drops, and actual evolution/fusion attacks reachable by
the supported H001 build (F001/F002/F004). Surface rewards and form names.
Keep original RNG/clock order and frame timing. B001, Boss Loot and settlement
remain the next slices; retain a tested Boss-Loot priority guard for integration.

## Authorized dependencies
No new dependencies. Current app source/data/tests, capture/oracle/evidence under
tasks/mobile-modernization and five rotating handoff sections are in scope.
Legacy source/entry/storage, archived files and locked dependencies stay intact.

## Acceptance
Capture isolated effective legacy schedule, choice ordering/claim guards, gear,
evolution and supported fusion attack oracles. Add failing rule tests, implement,
then verify snapshot/input/pause/destroy boundaries and one reward per token.
Natural desktop and portrait browser play reaches 90 seconds, explicitly opens
the ready chest, chooses and resumes without core/time injection. Synthetic
fixtures cover advanced forms and branch cases; distinguish them from natural
acceptance. Inspect narrow layout and controls.
Run legacy five gates, 49 baseline hashes, strict app types/tests/build/browser.
Update handoff and status with precise remaining boundaries.

## Constraints
Preserve original parameters, RNG and temporal order; no public Debug UI or new
gameplay. Gear from events/chests remains run-local until later settlement.
Physical-device, PWA and release acceptance remain pending; no deployment/push.
