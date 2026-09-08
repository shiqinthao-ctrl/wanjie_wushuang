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
Published P2k/G3 preview to the authorized WJWS Render service. Source 75e139b, deployment dep-dag058on74is73bukk40 is Live. Mobile: https://wjws.onrender.com/mobile-next/; legacy root preserved. Clean-cache redeploy resolved old repository-file retention. Auto-deploy is off.

## Changed files
TASK, handoff, .node-version, scripts/build-render-site.mjs, scripts/verify-render-site.mjs and tasks/mobile-modernization/RENDER-DEPLOYMENT.md. Public package is allowlisted; no gameplay, dependency or legacy-source changes. Runtime tag: mobile-next-render-20260908 at 75e139b; later docs commit records acceptance only.

## Tests
Deployment: 5 root gates, 49/49 baseline hashes, types/build and local/HTTPS package verification pass (51 files). Local/live desktop and phone-layout browser checks cover selection, natural upgrades/evolution, pause/continue/exit, save/reload and legacy startup; error/warn logs empty. Prior P2k: 946 rules, 42 related browser cases pass; latest 54 cases = 51 pass/3 fresh HP-death failures. Recordings preserved.

## Unresolved risk
Fresh HP-death gate remains open: three contact runs won; synthetic diagnostics do not replace natural acceptance. Full gameplay suite was not rerun for deployment. Physical phones, balance, performance/endurance unverified. HUD/control occlusion, first-stage-only content, audio/full parity/PWA and Phaser chunk warning remain. Rollback procedure recorded, not executed.

## Recommended next task
Define one narrow phone camera/control-occlusion slice with natural input evidence; keep P2j HP-death tracked separately. See P2k-EVIDENCE.md and RENDER-DEPLOYMENT.md. GitHub branch codex/mobile-web-modernization. Recordings: release mobile-next-p2k-20260908; local viewer port 4191. Future deployment requires the same package/HTTPS checks and explicit verified commit.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
