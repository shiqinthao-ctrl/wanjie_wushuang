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
P4b local short portrait HUD slice accepted: readable top HUD, scrollable map feedback and separated reward/touch controls. Includes P4a's edge-camera fix. GitHub/Render delivery is in progress after external access recovered. Last recorded live 75e139b / dep-dag058on74is73bukk40 awaits new verification.

## Changed files
BattleView.vue, battle-compact.css, P4b Playwright config/tests, Render milestone, changelog, TASK/handoff and P4b evidence/packaging documents. Presentation only; no GameCore, balance, save, dependency or legacy-source changes.

## Tests
P4b: 946 rules, 27 latest related browser cases, 5 ordered root gates, 49/49 hashes and app types/build pass. 45 executions = 35 pass / 10 failed attempts; 42 raw recordings fully decoded. Natural upgrade/touch/resize and synthetic crowded HUD are separate. Full 12.68-second MP4 and comparison visually checked. Logs: evidence/P4b/gates.json.

## Unresolved risk
Remote synchronization/deployment pending final verification. P2k's 3 fresh HP-death failures remain open (actual victory); full suite not rerun. Physical phones, landscape HUD, performance/endurance, other stages/modes, audio/PWA and Phaser chunk warning remain. Compact HUD acceptance is browser emulation only.

## Recommended next task
Finish P4a/P4b branch/tag/release sync and clean-cache deploy exact P4b source; verify package hashes/public paths and both entries. Then scope landscape HUD/control overlap from a reproducible baseline as one presentation slice. See P4b-EVIDENCE.md and RENDER-DEPLOYMENT.md; keep fresh HP-death acceptance separate.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
