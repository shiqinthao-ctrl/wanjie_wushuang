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
R1a isolated chapter preparation, Schema30 extension and atomic settlement complete; no new gameplay entry. R0 accd764 contains baseline and sample brief. See tasks/game-remediation/evidence/R1a/RESULTS.md. G5 runtime 821b90c / Render dep-dagi1c740ujc73f9nikg unchanged.

## Changed files
Added chapter catalog/preparation/progress/settlement, ChapterRunSession, 60 rule cases and 7 native cases. Parser validates optional mobileChapter. Updated TASK, remediation docs/evidence and handoff. No old combat, dependency, archive or deployment change.

## Tests
Five root gates, 49 legacy hashes, types, 1034/1034 rules and build pass. Final compatibility: 26/26 desktop/phone-size Chrome; earlier native/compat runs 18/18 and 26/26 overlap. 35 raw synthetic-storage videos plus 35 report copies decoded/hashed. R0 cold 12/12. All attempts retained; no natural chapter battle or real-phone claim.

## Unresolved risk
R1 gameplay/art sample incomplete; base stats and victory=1 star are engineering baselines. Charms/stages 2-3 not playable. P2l natural HP-death, G4 cold timeout, phones/endurance/PWA/audio/human acceptance remain open. Large chunk and legacy favicon404 remain. R1a code rollback accd764; keep data. G5 stays live, auto-deploy Off.

## Recommended next task
R1b: scope TASK first; integrate chapter preparation with GameCore and H001 4+4 growth, 3-choice evolution, core grant/guarantee and core-based awakening. Verify seeded candidates and normal UI selection chain; then R1c dragon combat. Preserve preview-g5 and do not label the foundation as a playable sample.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
