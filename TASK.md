# TASK.md - Mobile modernization / P2g first-stage events

Status: complete. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Migrate ST001-01 merchant/gold-chest events at 45s and 150s using effective
legacy order and choices. Port required gear generation, run-local gear rewards
and skill upgrades. Persist event gold spending/awards with the P2f repository;
pause at choices and storage errors, prevent duplicate rewards and permit retry.
Show player-facing choices and natural browser event acceptance.
Timed chests, evolution, B001/Boss Loot and settlement are subsequent slices.

## Authorized dependencies
Current app dependencies remain authorized; no additions. Allowed: mobile app
source/tests, tasks/mobile-modernization fixtures/capture/evidence, five rotating
handoff sections. Legacy sources/entry/storage and archive stay unchanged.

## Acceptance
Capture isolated legacy oracle for schedule, choices, costs/heal/buff/rewards,
gear RNG/order and skill upgrades. Pure tests compare those rules. Native
storage integration covers repeated event mutation and stale-save interruption.
Natural desktop and portrait browser play reaches a scheduled event, chooses
through visible UI and resumes the same run; no acceleration/state injection.
Explicit synthetic fixtures may cover branch/fault cases, never natural proof.
Run legacy five gates, 49 baseline hashes, strict app types/tests/build/browser.
Update handoff and status with precise remaining boundaries.

## Constraints
Preserve original encounter parameters, RNG and temporal order; no public Debug
UI or new gameplay. Gear from events remains run-local until later settlement.
Physical-device, PWA and release acceptance remain pending; no deployment/push.
