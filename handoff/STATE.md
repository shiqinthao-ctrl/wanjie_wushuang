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
V3.4.1 Mobile World Navigation and Objective Interaction / Slice 1. The mobile joystick touch plane is wider, the nearest unused existing interaction is projected through one shared direction/distance target, the minimap and mobile route card stay synchronized, the existing interaction button shows readiness only inside the unchanged 74px radius, and world-edge feedback distinguishes approach from contact with a return direction. The existing successful interaction path immediately refreshes the existing `0/1 -> 1/1` objective projection.

## Changed files
`TASK.md`; `index.html`; `assets/css/app.css`; `assets/js/combat/engine.js`; `assets/js/combat/boss-map-interactions.js`; `scripts/smoke.mjs`; `scripts/audit.mjs`; `handoff/STATE.md`. No dependency, schema, ordered-script, world-size, movement-speed, interaction-radius, interaction-effect, settlement, or locked gameplay-value change.

## Tests
Focused nearest-target, direction/distance, minimap consistency, edge-state, existing-effect, idempotency, and `0/1 -> 1/1` guards completed RED-to-GREEN. Automated coverage proves navigation stops after the existing objective completes and adds no auto-pathing or auto-interaction. Desktop `1280x720`, emulated `390x844`, and emulated `320x844` fill the viewport with no horizontal overflow; the touch plane measures 68% at 390px and 64% at 320px, and minimap, route card, objective HUD, and actions remain visible. Real browser UI showed the same nearest target at `北 625m`, with prior mobile action evidence updating it to `北 575m` and `北 500m`; warnings/errors: 0. Ordered gates pass: check 26 JS/1 CSS, smoke, audit, context 7985/8192 bytes, archive 30/30 HTML and 12 docs.

## Unresolved risk
Physical-phone feel, sustained Pointer hold through the browser automation surface, real-device world-edge traversal, one normal touch interaction from `0/1` to `1/1`, and five-route human acceptance remain pending. Browser automation cannot keep the floating joystick held while animation frames advance, so the complete touch route is covered by focused runtime guards rather than claimed as browser or physical-device acceptance. The 130 legacy wrappers remain existing debt.

## Recommended next task
Implement V3.4.2 Physical-Phone Navigation Acceptance / Slice 2: on one real phone, follow the shared target to an existing object, complete `0/1 -> 1/1`, reach and leave a world edge, and record any obstruction or missed input. Change only evidence-backed touch ergonomics or feedback; preserve speed, world size, 74px interaction radius, effects, combat values, saves, rewards, and settlement.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
