# TASK.md - Mobile modernization / P1 runtime skeleton

Status: in progress. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Build apps/mobile-next as an independent portrait-first Vite/TypeScript/Phaser 4/
Vue 3 application. One GameCore, one Phaser frame driver; Vue owns menus and
commands only. Prove mount, movement, pause, visibility loss and teardown.
No gameplay parity claim until P2/P3. Preserve legacy entry and its script order.

## Authorized dependencies
Only inside apps/mobile-next: phaser, vue; development dependencies vite,
typescript, @vitejs/plugin-vue, vue-tsc, vitest, @playwright/test, @types/node.
Pin compatible versions with a local package-lock. PWA/storage dependencies
will be authorized in their specific slices. No root runtime dependencies.

## Acceptance
Strict typecheck, focused core/input tests, production build; isolated browser
start/pause/resume/exit cycles at desktop, 390x844, 320x844 with no errors or
remaining canvases. Record WebGL and resource failures truthfully.
Run legacy check -> smoke -> audit -> context -> archive:verify; then new checks.
Update five handoff sections; preserve baseline hashes and all save invariants.

## Constraints
No legacy wrapper host, hidden runtime state injection for acceptance, public
Debug UI, new content/balance, backend, old-save mutation or entry replacement.
Physical Android/iPhone performance and installation remain pending.
