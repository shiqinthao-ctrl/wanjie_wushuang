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
P4a local portrait camera slice: hero stays centered at map edges, with a visible world boundary. Local tag mobile-next-p4a-20260909. GitHub/Render delivery is blocked by external HTTPS handshake/EOF failures. Last recorded live runtime 75e139b / dep-dag058on74is73bukk40 (Sep 8), not reverified this turn.

## Changed files
mountBattle.ts, camera tests/vision fixture, P4a Playwright config, Render milestone, changelog, TASK/handoff and P4a evidence/release/packaging documents. Camera padding only; no GameCore, balance, save, dependency or legacy-source changes.

## Tests
P4a: 946 rules, 17 latest related browser cases, 5 root gates, 49/49 hashes and types/build pass. Four real corners in 2 phone layouts; touch/cancel/resize and lifecycle in 3 layouts. 35 recordings = 32 pass attempts / 3 failures; all raw videos retained and fully decoded. 12-second comparison visually checked. No new live acceptance.

## Unresolved risk
Remote synchronization/deployment incomplete; no service settings changed. P2k's 3 fresh HP-death failures remain open (actual victory); full suite not rerun. Physical phones, short/landscape HUD usability, performance/endurance, other stages/modes, audio/PWA and Phaser chunk warning remain. Camera acceptance is browser emulation only.

## Recommended next task
Resume authorized GitHub branch/tag/release sync, then clean-cache deploy the exact P4a tag to WJWS and verify all 51 HTTPS hashes/paths plus both entries in browser. After delivery, define short portrait HUD/control spacing as one slice. See P4a-EVIDENCE.md and RENDER-DEPLOYMENT.md; keep natural HP-death tracked separately.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
