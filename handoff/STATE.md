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
P2h timed chests/evolution verified. Explicit 90/210/300s claims, paused one-use choices, original fusion/evolution priority, shared run loot and actual supported forms. P2a-g remains verified.

## Changed files
TASK.md; app TimedChests/gear/events/core/combat and battle UI, fusion data/tests/README; legacy chest oracle/capture, P2h evidence/status and handoff. Legacy unchanged; no added dependencies.

## Tests
P2h: legacy 5 gates, 30/30 archives, 49/49 hashes, strict types/build, 836/836 tests and 54/54 Chrome paths pass (12.4m). Natural 90s chest on all three sizes; separate synthetic advanced-form/oracle cases. Ready/choice screenshots viewed. No physical-device acceptance.

## Unresolved risk
Preview lacks Boss/loot/kill gear/settlement, audio/full content. Gear remains run-local. Boss Loot guard tested but not yet connected to core state. Node/Chrome random sort differs; exact upgrades checked in Chrome. Physical phones, endurance and PWA pending. Battle mount 371KB gzip; no measured gain.

## Recommended next task
P2i: original B001 at 270s, Boss map interactions and attacks, Boss Loot priority/choice, kill gear and guarded completion signals. Then atomic settlement and natural complete stage/retry to finish P2; continue approved P3-P5 afterward.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
