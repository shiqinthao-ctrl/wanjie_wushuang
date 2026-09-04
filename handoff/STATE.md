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
V3.4.3 Combat Growth Feel Acceptance / Slice 2. A natural browser run proves defeat -> crystal drop -> attraction and collection -> XP growth -> existing three-choice level-up -> upgrade -> same-run resume. Final presentation and Director overrides now retain the V3.4.2 crystal authorities. Crystal contrast, pulse, attraction radius (`240px`), and speed (`540px/s`) were tuned from reproduced pickup-readability issues without changing XP values, `xpNeed`, combat damage, objectives, or settlement.

## Changed files
`TASK.md`; `assets/js/combat/engine.js`; `assets/js/presentation/quality-presentation.js`; `assets/js/systems/director-balance.js`; `scripts/smoke.mjs`; `handoff/STATE.md`. No dependency, schema, ordered-script, XP-value, `xpNeed`, enemy/player/skill/Boss balance, stage duration, upgrade authority, objective authority, or settlement change.

## Tests
Focused RED -> GREEN guards cover `220px` attraction, render order, final presentation, and final Director updates. Natural `ST001-01` play progressed from Lv.1 / 0 XP through visible pickups to a real three-choice level-up; selection closed the overlay and the same run continued with increasing time, kills, and XP. Desktop `1280x720`, emulated `390x844`, and emulated `320x844` have no horizontal overflow or HUD collision with the visible joystick and five action controls. Browser warnings/errors: 0. Ordered check, smoke, audit, context (under `8192` bytes), and archive (`30/30`, 12 docs) gates pass.

## Unresolved risk
Physical-phone joystick, safe-area, pickup, and skill-combo feel remain unverified; browser emulation is not physical-device acceptance. Full-stage long-session density through Boss and settlement was not part of this slice. The 130 legacy wrappers remain existing debt.

## Recommended next task
Implement V3.4.4 Physical Mobile Combat Feel Acceptance / Slice 1: run one real phone through movement, dodge, skill, ultimate, interaction, crystal pickup, level-up choice, pause/resume, and return to the same run; record obstruction, dead-zone, reach, and safe-area evidence, then tune only reproduced mobile-control issues. Preserve saves, XP and combat values, existing action authorities, objectives, and settlement; do not represent browser emulation as phone acceptance.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
