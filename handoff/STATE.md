# handoff/STATE.md

## Baseline
Version: V3.1.2 Context-Lite
Runtime: ordered global browser JS
Save schema: 30
Entry: `index.html`
JS files: 22
Dependencies: none at runtime

## Critical invariants
- Fresh ST001 stages start at 0 stars.
- Defeat grants 0 chapter stars.
- Non-story modes do not alter chapter stars.
- One run settles at most once.
- Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction.

## Current architecture debt
Legacy version wrappers still exist. Migrate incrementally; do not rewrite the full combat loop in one task.

## Current task
See `../TASK.md`.

## Last completed
P2i first Boss/loot verified. B001 at 270s, original HP/AI/damage/map rules, elite loot, single-use Boss choices, chest priority and guarded victory/timeout. P2a-h remains verified.

## Changed files
TASK.md; app FirstBoss/BossView/BossLoot, core/combat/map/gear, UI/art/tests/README; Boss oracle/capture, P2i evidence/screenshots/status and handoff. Legacy unchanged; no added dependencies.

## Tests
P2i: legacy 5 gates, 30/30 archives, 49/49 hashes, types/build, 874/874 tests pass. 63 distinct Chrome paths: natural Boss 3, regression 59, narrow chest 1 rerun after a test-only dialog/control race fix. Boss/loot screenshots viewed. No physical-device acceptance.

## Unresolved risk
Atomic settlement, natural complete victory/defeat/retry, audio/full content pending. Gear remains run-local. Boss loot delay intentionally uses unpaused battle time. Node/Chrome random sort differs; exact choices checked in Chrome. Physical phones, endurance/PWA pending. Battle mount 373.48KB gzip; no measured gain.

## Recommended next task
P2j: atomic rewards/progression/receipt settlement, immutable run result, result/retry UI, effective legacy oracles and natural full-stage victory/defeat/retry. Then continue approved P3-P5; physical-device gates remain separate.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
