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
G4 delivered: H012 windwarden, A026 ambush, galephantom; 10 forms/11 routes/7 bonds. Tag mobile-next-g4-20260909 at 05b82ac; GitHub prerelease 385317014 has seven verified assets. Render dep-daggvhbl550s73bkiq30 live. See G4-EVIDENCE.md.

## Changed files
Evolution catalog/combat/math, advice/presentation, focused rules and natural tests; packaging, evidence, changelog and Render milestone. Final follow-up contains delivery records only. No dependency, schema, classic or legacy-source change.

## Tests
960 rules; 54/54 local related browser cases. Live: phone/narrow pass, desktop first readiness timeout then full unchanged rerun pass (3/4 executions); no retries/skips. Five root gates, 49 legacy hashes, types/build and 51 live asset hashes pass. 57 local + 4 live videos and two full MP4s decode.

## Unresolved risk
P2l fresh HP-death/phone timeout open; no assertions weakened. Initial live readiness timeout unexplained; legacy favicon404. Full suite not rerun; physical phones, performance/endurance, parity/audio/PWA and large chunk remain. Rollback: 649b0b5 / dep-dagdr1142hec73brst60; auto-deploy Off.

## Recommended next task
Scope one H001 cross-element form/skill branch/bond with exact TASK rules. Keep natural full-build acceptance; carry startup and P2l gaps forward. Preserve classic/Schema30, immutable releases and auto-deploy Off.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
