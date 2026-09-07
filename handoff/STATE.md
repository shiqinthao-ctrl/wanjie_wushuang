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
P1 independent Vue/TypeScript/Vite/Phaser 4 WebGL scaffold: lobby, movement, pause, interruption, teardown and asset-failure recovery. P0 confirms ST001-01 has B001 at 270s and a 360s goal.

## Changed files
TASK.md; apps/mobile-next source, locked dependencies and tests; tasks/mobile-modernization/STATUS.md; handoff/STATE.md. Legacy runtime unchanged.

## Tests
P1: legacy check/smoke/audit/context/archive all pass; 49 baseline hashes match; strict typecheck/build and 4 core tests pass; 6 Chrome browser tests pass (1280x720, 390x844, 320x844, 4 mount cycles each, blur pause and asset failure). Not physical-device evidence.

## Unresolved risk
Physical Android/iPhone baseline, thermal endurance and touch acceptance pending. Combat, storage, content parity and PWA pending. Phaser chunk is 359KB gzip; no measured performance gain. No entry switch/deployment.

## Recommended next task
P2a: migrate typed startup growth/equipment/rune/pet calculations against legacy behavior, then implement H001/ST001-01 combat in bounded slices.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
