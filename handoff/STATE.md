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
P4c landscape HUD/control slice delivered. GitHub tag mobile-next-p4c-20260909 has six verified release assets. Render 649b0b5 / dep-dagdr1142hec73brst60 is live with all 51 hashes and both entries verified. P4a/P4b tags remain immutable; auto-deploy off.

## Changed files
battle-compact.css, P4c Playwright config/tests, Render milestone, changelog, TASK/handoff and P4c evidence/packaging documents. Final follow-up records GitHub hashes, Render delivery, three live tests and screenshots. Runtime: 39 CSS lines and version label only; no core, camera, save, dependency or legacy changes.

## Tests
946 rules, 45 latest local browser cases, 5 ordered root gates, 49/49 hashes and app types/build pass. 57 local recordings retained, including 7 failures; one setup failure. Three extra live natural upgrade/touch/rotation cases pass, with 3 decoded recordings. Six GitHub assets and 51 HTTPS runtime hashes match. Visible live entry/skill/pause/exit and legacy lobby pass, no console errors.

## Unresolved risk
P2k's 3 fresh HP-death failures remain open (actual victory); full suite not rerun. Physical phones, performance/endurance, other stages/modes, audio/PWA and Phaser chunk warning remain. HUD acceptance is browser emulation only. Prior runtime: 4c37125 / dep-dagd7tp42hec73bpec70; older rollback: 75e139b / dep-dag058on74is73bukk40. No rollback executed.

## Recommended next task
Scope fresh natural defeat/retry investigation from preserved P2k evidence; replace TASK.md before implementation and do not alter balance to force defeat. Preserve P4c runtime tag/assets and auto-deploy off. See P4c-EVIDENCE.md and RENDER-DEPLOYMENT.md.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
