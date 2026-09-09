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
G5 local acceptance passed: H001 frostflame, A011 ringfire, thermalshock; 11 forms/12 routes/8 bonds. Tag mobile-next-g5-20260909 prepared; GitHub/Render delivery pending. Prior runtime G4 05b82ac remains live. See G5-EVIDENCE.md.

## Changed files
Evolution catalog/combat/math, advice/presentation, focused rules and natural tests; G5 packaging, evidence, changelog and Render milestone. No dependency, schema, classic or legacy-source change.

## Tests
974 rules; 54/54 local related browser cases without retries/skips. Desktop/phone natural victory, awakening, saved rewards/retry/reload; narrow guide/touch/reentry. Five root gates, 49 legacy hashes and types/build pass. 57 raw videos and both full MP4s decode. Remote verification pending.

## Unresolved risk
P2l fresh HP-death/phone timeout open; no assertions weakened. G4 initial live readiness timeout unexplained; legacy favicon404. Full suite not rerun; physical phones, performance/endurance, parity/audio/PWA and large chunk remain. Rollback: 05b82ac / dep-daggvhbl550s73bkiq30; auto-deploy Off.

## Recommended next task
Complete G5 media/GitHub/Render verification. Then scope startup readiness diagnosis with repeated cold-load evidence before further content expansion. Preserve existing assertions, natural acceptance, classic/Schema30, immutable releases and auto-deploy Off.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
