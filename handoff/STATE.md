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
G4 locally verified: H012 windwarden, A026 ambush and galephantom bond. Ten forms, eleven routes, seven bonds. GitHub/Render delivery pending; tag mobile-next-g4-20260909. See G4-EVIDENCE.md.

## Changed files
Evolution catalog/combat/math, route advice, form/vortex presentation, focused rules, natural fixture/config, packaging/evidence/changelog and Render milestone. No dependency, save schema, classic or legacy-source change.

## Tests
960 rules; 54/54 related browser executions, no retries/skips. Two complete natural victories/reload/retry and one narrow build; 51 related native cases. Five root gates, 49 legacy hashes and app types/build pass. 57 originals and two full MP4s decode. Remote checks pending.

## Unresolved risk
P2l fresh HP-death and stationary phone timeout still open; no assertions weakened. Full suite not rerun. Physical phones, performance/endurance, remaining parity/audio/PWA and large Phaser chunk remain. G4 rollback: 649b0b5 / dep-dagdr1142hec73brst60; auto-deploy Off.

## Recommended next task
Scope one H001 cross-element form, one skill branch and one matching bond, with exact rules in TASK before implementation. Retain natural full-build acceptance and carry P2l gaps forward. Preserve classic/Schema30, immutable releases and auto-deploy Off.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
