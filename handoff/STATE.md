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
P2f saves verified. Isolated IndexedDB slots, Schema30 copy import, exact backups, exports and atomic receipts connect to the lobby. Unsupported preparation blocks launch. P2a-e combat/growth/map remains verified.

## Changed files
TASK.md; app storage boundary/repository, SavePanel, lobby and saved battle preparation, tests/README; P2f evidence/status and handoff. Legacy unchanged; no added dependencies.

## Tests
P2f: legacy 5 gates, 30/30 archives, 49/49 hashes, strict types/build, 775/775 tests and 30/30 browser paths pass. Includes natural save UI, separate synthetic rollback/concurrency/storage-failure fixtures, desktop/390px/320px; not physical-device acceptance.

## Unresolved risk
Preview lacks events/chests/evolution/Boss/loot/settlement, audio/full content. Atomic storage is a primitive, not settlement parity. Boss map hooks, same-origin legacy discovery, physical phones, thermal endurance and PWA pending. Battle chunk about 373KB gzip; no measured gain.

## Recommended next task
P2g: migrate first-stage events and required gear reward rules with legacy fixtures and persisted event currency. Then timed chests/evolution, original B001/Boss Loot and atomic settlement to complete P2.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
