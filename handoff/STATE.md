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
P2a typed startup growth/equipment/rune/pet rules implemented, wired to GameCore and preparation UI. 179 isolated legacy oracle cases match. ST001-01 retains existing B001 at 270s and 360s goal.

## Changed files
TASK.md; app growth/save types/data, GameCore, preparation UI and tests; migration growth capture/oracle/evidence; handoff. Legacy runtime unchanged; no added dependencies.

## Tests
P2a: 185 tests pass, including 179 legacy startup cases/no save mutation. Legacy 5 gates, 49 hashes and strict build pass. Six Chrome preparation/lifecycle checks pass across desktop and two portrait sizes.

## Unresolved risk
Physical Android/iPhone baseline, thermal endurance and touch acceptance pending. Combat, storage, content parity and PWA pending. Phaser chunk is 359KB gzip; no measured performance gain. No entry switch/deployment.

## Recommended next task
P2b: migrate XP crystals, level options and choice state against existing authority; continue H001/ST001-01 combat in bounded slices. Do not replace original Boss objective.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
