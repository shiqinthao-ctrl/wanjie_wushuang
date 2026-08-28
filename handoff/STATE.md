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
V3.3.8 First Boss Engagement / Slice 5. In normal `ST001-01 / H001 / B001`, attacks prefer live B001; guidance prioritizes a Boss-effective barrel, the mechanism, then another unused barrel. Nearby copy remains authoritative. Pre-Boss/run-end cast copy is cleared, and stale victory cinema no longer covers later battles. A desktop run naturally defeated B001, selected Boss loot first, and settled once with `0 -> 3` stars.

## Changed files
`TASK.md`; `assets/js/combat/hero-identity.js`; `assets/js/combat/boss-map-interactions.js`; `assets/css/app.css`; `scripts/asset-pipeline.mjs`; `scripts/smoke.mjs`; `scripts/audit.mjs`; `handoff/STATE.md`. Excluded gameplay values, saves, settlement authority, dependencies, and script order are unchanged.

## Tests
Target, guide, cast-cleanup, outcome-visibility, constant, and script-order guards completed RED-to-GREEN. Isolated checks prove B001-only scope, old selection fallthrough, guide order, and no interaction/save/combat/settlement writes. Desktop normal UI observed all three casts, natural B001 defeat at `05:27`, Boss Loot before one Result, and one victory. Simulated `390x844` showed live guidance/casts, controls in bounds, zero overlap/overflow, hidden stale cinema, and empty pre-Boss cast text. The final phone run exited normally; record: 13 attempts, 1 victory, best `05:28`, chapter stars 3. Browser warnings/errors: 0. All five required gates pass.

## Unresolved risk
Physical-phone touch feel and five-route human acceptance remain pending. Automation did not sustain joystick movement far enough to reach and use a map object while B001 was alive, although near-copy priority and remote fallback were each observed. There are 130 wrappers; this is a non-Git checkout.

## Recommended next task
Implement V3.3.9 Mobile Boss Interaction / Slice 6: make sustained touch movement toward the guided object reliable, reach one existing object during live B001, and use the normal `F` interaction once. Do not change interaction damage/effects, Boss values, saves, or settlement.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
