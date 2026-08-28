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
V3.4.0 Complete Playable Combat Loop Foundation. Combat now uses persistent world coordinates, bounded camera look-ahead, a floating mobile joystick, tactical minimap, non-destructive hero/build confirmation, run objectives, three idempotent timed rewards, informative choices, and Result replay guidance. Boss Loot remains before one authoritative settlement.

## Changed files
`TASK.md`; `index.html`; `assets/css/app.css`; `assets/js/combat/engine.js`; `assets/js/combat/skill-forms.js`; `assets/js/core/stability-v30.js`; `assets/js/presentation/art-ui-cinematics.js`; `assets/js/presentation/quality-presentation.js`; `assets/js/systems/director-balance.js`; `assets/js/systems/game-modes.js`; `assets/js/ui/result.js`; `scripts/asset-pipeline.mjs`; `scripts/smoke.mjs`; `scripts/audit.mjs`; `handoff/STATE.md`. No dependency, schema, ordered-script, settlement, or locked gameplay-value change.

## Tests
Focused camera, joystick, minimap, deployment, objective, reward, choice, Boss-loot, responsive, constant, and script-order guards completed RED-to-GREEN. Script order is 26/26; `_v34Old*` and secret scans are empty. Desktop completed the full route and settled once: `04:56`, 542 kills, 3 stars, `+756` gold, Boss Loot `1/1`; repeated reward input did not duplicate a claim. Emulated `390x844` and `320x844` had no overflow/overlap; overlays were usable; warnings/errors: 0. Touch reached interaction range but did not trigger the object. Ordered gates pass: check 26 JS/1 CSS, smoke, audit, context, archive 30/30 HTML and 12 docs.

## Unresolved risk
Physical-phone feel, sustained world-edge traversal, one normal mobile interaction from `0/1` to `1/1`, and five-route human acceptance remain pending. The 130 legacy wrappers remain existing debt.

## Recommended next task
Implement V3.4.1 Mobile World Navigation and Objective Interaction / Slice 1: on a physical phone, reach a world edge, follow the minimap to one existing object, and complete interaction `0/1 -> 1/1`. Change only touch ergonomics/guidance if evidence requires it; preserve speed, effects, combat values, saves, rewards, and settlement.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
