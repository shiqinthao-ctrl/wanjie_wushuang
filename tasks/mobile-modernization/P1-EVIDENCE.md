# P1 evidence

Verified locally on 2026-09-07. This is a scene/lifecycle preview, not migrated
combat or phone performance acceptance.

- Independent locked Vue 3.5.42 / Phaser 4.2.1 / Vite 8.2.2 application.
- TypeScript 7.0.2 could not run vue-tsc (unexported lib/tsc). Locked 5.9.3
  passes strict typecheck and production build with vue-tsc 3.3.11.
- Four rule tests cover lifecycle, interruption, movement/frame cap and snapshots.
- Six Chrome tests pass at 1280x720, 390x844 and 320x844. Four enter/pause/
  resume/exit cycles per viewport, actual WebGL, no remaining canvas after exit,
  no page/console/HTTP errors, blur pause and simulated missing-asset recovery.
- Portrait screenshot inspected: original hero/ground visible; HUD, pause and
  movement pad are unobstructed. Test artifacts regenerate under app/test-results.
- Legacy check, smoke, audit, context and archive:verify pass. All 49 legacy
  baseline hashes match. Runtime entry and saves remain untouched.
- Lazy Phaser chunk: approximately 1.38MB raw / 359KB gzip. Vite's size warning
  remains visible. This is bundle size, not a phone benchmark.

Pending: complete combat, persistence, physical multitouch/visibility testing,
resource/thermal profiling, offline install/update and complete-content parity.
