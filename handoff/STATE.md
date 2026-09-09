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
P4b short portrait HUD and P4a edge-camera fix delivered. Both tagged GitHub prereleases have six verified assets. Render 4c37125 / dep-dagd7tp42hec73bpec70 is live, with 51 HTTPS file hashes and both entries verified. Auto-deploy stays off; the final evidence commit does not change the deployed runtime.

## Changed files
BattleView.vue, battle-compact.css, P4b Playwright config/tests, Render milestone, changelog, TASK/handoff and P4b evidence/packaging documents. Final delivery adds release hash reports, live screenshots and deployment evidence. No GameCore, balance, save, dependency or legacy-source changes.

## Tests
946 rules, 27 latest related browser cases, 5 ordered root gates, 49/49 hashes and app types/build pass. 45 executions = 35 pass / 10 failed attempts; 42 raw recordings decoded. Natural and synthetic checks stay separate. Live 320x568: upgrade, bond, skill, pause/resume/exit and reload retain hero/gold; legacy lobby passes, no console errors. See evidence/P4b/delivery.json and delivery-gates.json.

## Unresolved risk
P2k's 3 fresh HP-death failures remain open (actual victory); full suite not rerun. Physical phones, landscape HUD, performance/endurance, other stages/modes, audio/PWA and Phaser chunk warning remain. Compact HUD acceptance is browser emulation only. One transient HTTPS TLS failure passed on retry without network/security changes. Rollback target: 75e139b / dep-dag058on74is73bukk40.

## Recommended next task
Scope landscape HUD/control overlap from a reproducible baseline as one presentation slice; replace TASK.md before implementation. Preserve immutable P4a/P4b tags and evidence. Keep fresh HP-death acceptance separate; do not alter balance to force that outcome. See P4b-EVIDENCE.md and RENDER-DEPLOYMENT.md.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
