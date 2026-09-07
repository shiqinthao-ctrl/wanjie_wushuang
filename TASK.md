# TASK.md - Mobile modernization / P0 baseline

Status: P0 source baseline complete; physical-device measurements pending.

## Goal
Freeze the existing runtime as the migration oracle and establish a traceable
capability, save, resource and rule inventory for `apps/mobile-next`.
Full roadmap and evidence: `tasks/mobile-modernization/PLAN.md` and `STATUS.md`.

## Scope
Add baseline manifests, isolated configuration extraction, Schema30 fixtures,
and migration documentation. Preserve prior task/handoff snapshots separately.
Do not modify the legacy entry, CSS, JS, existing tests, saves or archive.
No runtime dependencies in P0. Later tasks explicitly authorize the new stack.

## Acceptance
- Record the baseline commit, source hashes, script order and capabilities.
- Extract effective configuration and normalized fresh Schema30 data from the
  actual sources, without reading personal browser data or editing legacy files.
- Record physical-device evidence as pending until real devices are tested.
- Run check, smoke, audit, context, archive:verify in that order.
- Update only the five rotating sections of handoff/STATE.md.

## Invariants
Schema30, fresh 0-star chapters, defeat=0 star, non-story star isolation,
one settlement per run, dual-Boss routing, Boss Loot precedence, V3.0 safety,
all existing XP/balance values, objectives and progression authorities.
No new gameplay, backend, public Debug UI or legacy wrapper layer.
