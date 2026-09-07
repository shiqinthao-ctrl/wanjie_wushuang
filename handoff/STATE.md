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
Mobile modernization P0 source baseline: immutable legacy hashes, effective config and Schema30 fresh save captured from isolated Chrome. ST001-01 already includes B001; preserve its original 270s Boss and 360s goal.

## Changed files
TASK.md; tasks/mobile-modernization/ baseline, capture/verify tools, roadmap, status and inventory; handoff/STATE.md.

## Tests
Isolated Chrome new-game capture: 26 scripts, 1 CSS, 6 heroes, 12 stages; 0 page errors; normalized zero-star Schema30 with gear instances. Hash verification passed. Legacy check, smoke, audit, context (4894/8192 bytes), archive:verify all pass.

## Unresolved risk
Physical Android/iPhone baseline, thermal endurance and touch acceptance pending. New runtime and full parity not yet implemented. No entry switch or deployment.

## Recommended next task
P1: isolated TypeScript/Vite/Phaser/Vue lifecycle and strict verification; no fake legacy host. Explicitly authorize dependencies in TASK.md.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
