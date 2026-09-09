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
P4c landscape HUD/control slice locally verified at 568x320, 640x360 and 844x390, including safe areas, rotation and natural upgrades. GitHub/Render delivery pending. P4a/P4b tagged releases remain immutable; last verified live is 4c37125 / dep-dagd7tp42hec73bpec70, auto-deploy off.

## Changed files
battle-compact.css, P4c Playwright config/tests, Render milestone, changelog, TASK/handoff and P4c evidence/packaging documents. Runtime: 39 CSS lines and version label only. No Vue script/markup, GameCore, camera, balance, save, dependency or legacy-source changes.

## Tests
946 rules, 45 latest related browser cases, 5 ordered root gates, 49/49 hashes and app types/build pass. 57 executions = 50 pass / 7 failed; one extra setup failure. All 57 recordings fully decoded, with an uncut 18.24s natural test MP4. Synthetic Boss HUD is separate from natural play. Visible local landscape entry/pause/resume/exit passes, no console errors.

## Unresolved risk
P2k's 3 fresh HP-death failures remain open (actual victory); full suite not rerun. Physical phones, performance/endurance, other stages/modes, audio/PWA and Phaser chunk warning remain. HUD acceptance is browser emulation only. P4c remote delivery pending; prior rollback: 75e139b / dep-dag058on74is73bukk40.

## Recommended next task
Finish P4c GitHub/Render delivery and record actual remote evidence. Then scope fresh natural defeat/retry investigation from preserved P2k evidence; replace TASK.md before implementation and do not alter balance to force defeat. See P4c-EVIDENCE.md and RENDER-DEPLOYMENT.md.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
