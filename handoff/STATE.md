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
P2e map verified. Six interactables, fireline hazards and five timed recoveries connected. P2a-d combat/growth remains verified. ST001-01 B001 at 270s and 360s goal remain required.

## Changed files
TASK.md; app FirstStageMap/MapView, combat/core integration, controls/UI/help/tests; first-map oracle/capture/evidence; status and handoff. Legacy unchanged; no added dependencies.

## Tests
P2e: legacy 5 gates, 30/30 archives, 49/49 hashes, strict types/build, 754/754 rule tests and 12/12 browser paths pass. Includes natural map interaction on desktop, 390px and 320px widths; not physical-device acceptance.

## Unresolved risk
Preview lacks events/chests/evolution/Boss/loot/settlement, audio and full content. Boss map damage/trap clearing must join with Boss entities. Physical phones, thermal endurance, storage/PWA pending. Battle chunk about 373KB gzip; no measured gain.

## Recommended next task
P2f: migrate first-stage events, timed chests and required gear reward rules with legacy fixtures. Then evolution/fusion, original B001/Boss Loot and atomic settlement to complete P2.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
