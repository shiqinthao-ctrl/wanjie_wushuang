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
P2g encounters verified. Merchant/gold chest at 45s/150s, gold gear and owned upgrades, original-slot atomic currency with retry and interruption UI. H001 ignores merchant attack buff in legacy; preserved and explained. P2a-f remains verified.

## Changed files
TASK.md; app encounter/gear/progression/core/EventSession and battle/lobby UI, tests/README; legacy event oracle/capture, P2g evidence/status and handoff. Legacy unchanged; no added dependencies.

## Tests
P2g: legacy 5 gates, 30/30 archives, 49/49 hashes, strict types/build, 805/805 tests and 48/48 Chrome paths pass. Natural event choices/reload plus labeled synthetic faults/oracles; 320px choice/error screenshots viewed. No physical-device acceptance.

## Unresolved risk
Preview lacks timed chests/evolution/Boss/loot/settlement, audio/full content. Event gear remains run-local. Node/Chrome random sort differs; exact event upgrade checked in Chrome. Boss map hooks, physical phones, thermal endurance and PWA pending. Battle mount 371KB gzip; no measured gain.

## Recommended next task
P2h: timed chests at effective 90/210/300 seconds, evolution and supported fusion attacks, run-local drops and natural explicit-claim UI. Then original B001/Boss Loot and atomic settlement to complete P2; continue approved P3-P5 afterward.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
