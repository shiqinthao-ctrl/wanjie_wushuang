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
G5 delivered: frostflame, ringfire, thermalshock; 11 forms/12 routes/8 bonds. Runtime 821b90c, tag mobile-next-g5-20260909, Render dep-dagi1c740ujc73f9nikg. GitHub prerelease published with 7 verified assets. See G5-EVIDENCE.md.

## Changed files
Evolution catalog/combat/math, advice/presentation, rules/natural tests, G5 packaging, changelog and Render milestone. Final delivery reports are evidence-only; not redeployed. No dependency, schema, classic or legacy-source change.

## Tests
974 rules; 54/54 local browser cases. Public first run 2/3; phone won without target route, retained as failed. Unchanged phone rerun 1/1 passed. Awakening/victory/retry/reload verified. Five root gates, 49 legacy hashes, types/build, 51 public hashes pass. 61 raw videos and 2 full MP4s decode.

## Unresolved risk
P2l fresh HP-death/phone timeout and G4 initial readiness timeout remain open. Natural target builds are not guaranteed each run. Full browser suite not rerun; real phones, performance/endurance, parity/audio/PWA, legacy favicon404 and large chunk remain. Rollback: 05b82ac / dep-daggvhbl550s73bkiq30; auto-deploy Off.

## Recommended next task
Scope startup readiness diagnosis with repeated cold-load evidence before more content expansion. Preserve current thresholds, natural acceptance, classic/Schema30, immutable releases and auto-deploy Off. Do not treat G5's passing startup samples as a fix for G4's unexplained timeout.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
