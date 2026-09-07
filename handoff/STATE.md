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
P2c skill modifiers, virtual passives and incoming/outgoing damage rules match final legacy functions, including healing, daily bonuses and shield order. ST001-01 retains B001 at 270s and 360s goal.

## Changed files
TASK.md; app combatMath rules/tests and skillForms data; migration combat-math capture/oracle/evidence; status and handoff. Legacy runtime unchanged; no added dependencies.

## Tests
P2c: 693 app tests pass; 449 new checks cover 32 modifier matrices and 384 incoming boundaries. Legacy 5 gates, 49 hashes, strict build and 6 desktop/portrait browser checks pass.

## Unresolved risk
Natural kill/pickup/choice acceptance awaits combat. Physical Android/iPhone baseline, thermal endurance and touch acceptance pending. Storage, content parity and PWA pending. Phaser chunk is 361KB gzip; no measured performance gain.

## Recommended next task
P2d: connect H001 actions, first-stage enemies, prepared skills and PET001 to the single lifecycle; verify natural kill/pickup/upgrade. Then migrate stage events/Boss/settlement. Preserve original Boss objective.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
