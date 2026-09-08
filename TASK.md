# TASK.md - Publish the mobile preview to the existing Render site

Status: completed, 2026-09-08.

## Goal and authorization
The user explicitly authorizes GitHub synchronization and updating Render
service srv-d9v8cm1t0dsc73ch79k0 through its open dashboard. This supersedes
the previous task's no-deployment boundary for this service only.
Publish the current P2k/G3 mobile preview at https://wjws.onrender.com/mobile-next/.
Keep the legacy root entry and isolated saves; do not merge or force-push main.

## Scope and invariants
- Add a reproducible, allowlisted static-site package: legacy index/assets,
  mobile production build, and public version metadata. Never publish the
  repository, test recordings, archives, local saves or credentials wholesale.
- Configure only this service's source branch, build/publish paths and deploy
  trigger as needed. Preserve its domain, account, access and billing settings.
- Preserve all game rules, Schema30, zero-star behavior, non-story isolation,
  once-only settlement, Boss Loot priority, V3.0 fixes and previous evidence.
- No gameplay changes, dependencies or lockfile changes. Keep P2k's three
  fresh HP-death failures open; this is an explicitly requested preview deploy.

## Acceptance and delivery
Run the five root checks in order, 49 baseline hashes, app typecheck/build and
deployment-package verification. Check the packaged and live legacy/mobile
pages, assets, startup, hero selection, battle/pause/exit and console errors.
Record Render's prior/current commit and deployment status, remote version
identity, settings and rollback steps. Update the five handoff sections,
commit/tag/push to GitHub, and verify the named Render deployment is Live.
Physical phones, performance/endurance, PWA and full parity remain unverified.

## Result
Render deployment dep-dag058on74is73bukk40 is Live at source 75e139b.
Both public entries, all 51 runtime hashes, blocked repository paths and
natural browser startup/evolution/pause/exit/save reload passed. Auto-deploy
is off. Release identity, evidence and rollback: tasks/mobile-modernization/RENDER-DEPLOYMENT.md.
