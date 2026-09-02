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
V3.4.2 Combat Growth Pickup Loop / Slice 1. Normal and elite defeats now create visible experience crystals with their existing effective XP values. Crystals remain in the world, attract only within 170px, settle once within 26px, and retain total XP through a deterministic 180-crystal cap. Collection reuses the existing `checkLevel()` -> `showLevelChoices()` -> `pickLevel()` authority. The battle HUD now keeps level, HP, and XP progress visible.

## Changed files
`TASK.md`; `index.html`; `assets/css/app.css`; `assets/js/combat/engine.js`; `scripts/smoke.mjs`; `scripts/audit.mjs`; `handoff/STATE.md`. No dependency, schema, ordered-script, enemy/player/skill/Boss balance, stage duration, upgrade authority, objective authority, or settlement change.

## Tests
Focused guards cover normal `6 XP` and elite `27 XP` crystals at the existing 1.5x multiplier, no XP at defeat, attraction boundaries, one-time collection, value-preserving cap, and HP/XP projection. An integration guard executes the real pickup, three-choice overlay, upgrade selection, and same-run resume path. Desktop `1280x720`, emulated `390x844`, and emulated `320x844` keep the rail and controls visible without horizontal overflow; browser warnings/errors: 0. Ordered check, smoke, audit, context, and archive gates pass.

## Unresolved risk
Physical-phone pickup feel, long-session high-density feel, and a fully natural browser run that kills, walks to crystals, upgrades, and resumes remain unverified. Browser emulation and automated integration are not physical-device or human-play acceptance. The 130 legacy wrappers remain existing debt.

## Recommended next task
Implement V3.4.3 Combat Growth Feel Acceptance / Slice 2: complete one natural desktop run and one physical-phone run through kill -> attract -> collect -> choose -> resume, then tune only evidence-backed crystal visibility or pickup feel. Preserve existing XP values, combat balance, saves, upgrade authority, objectives, and settlement.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
