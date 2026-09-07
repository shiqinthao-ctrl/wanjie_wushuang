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
P2d H001 actions, first-stage enemies, prepared skills and PET001 are connected. Natural kill/XP/choice/resume passes. ST001-01 still requires B001 at 270s and 360s goal; Boss/settlement remain pending.

## Changed files
TASK.md; app CombatSimulation/spawn rules, GameCore, Phaser rendering, touch/keyboard UI and tests; first-combat oracle/capture/verifier/evidence; status and handoff. Legacy unchanged; no added dependencies.

## Tests
P2d: 734 app tests, 8 exact Chrome spawns, 9 desktop/portrait browser checks pass (natural growth and 4 scene cycles per size). Legacy 5 gates, 49 hashes, strict types/build pass.

## Unresolved risk
Preview lacks map/events/Boss/loot/settlement, audio and full content. Physical Android/iPhone baseline, thermal endurance and touch acceptance pending. Storage/PWA pending. Battle chunk about 372KB gzip; no measured performance gain.

## Recommended next task
P2e: migrate first-stage map, timed recovery/events and chest interactions with legacy rule fixtures and visible prompts. Then original B001/Boss Loot and atomic settlement to complete P2.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
