# Mobile modernization implementation contract

Approved: 2026-09-07. Target: portrait-first Android/iPhone web game and PWA.
Keep the original game usable; build the independent successor in
`apps/mobile-next`. No production entry replacement before full acceptance.

## Architecture
- Vite, TypeScript, Phaser 4, Vue 3; immutable view snapshots, no reactive entities.
- Pure GameCore owns rules; Phaser owns the sole frame driver.
- Separate simulation, render, input, UI, configuration and persistence.
- IndexedDB SaveRepository copies Schema30 imports; never mutates legacy keys.
- Settlement and its receipt are committed in one IndexedDB transaction.
- PWA assets and scope are isolated; updates wait until outside combat.
- Preserve all existing values, modes, heroes, stages, progression and fixes.

## Ordered slices
1. P0: baseline hashes, effective configuration, source/rule inventory, fixtures.
2. P1: locked toolchain, typed core boundary, Vue/Phaser lifecycle, verification.
3. P2: H001 / ST001-01 natural playable loop and parity evidence.
4. P3: remaining equipment/growth, heroes/skills, stages/Bosses, modes and UI.
5. P4: measured mobile input/render/resource optimization and quality tiers.
6. P5: imports, offline, install/update/rollback tests and delivery artifacts.

Each slice receives a bounded TASK.md and evidence before progressing. Tests
may use deterministic fixtures, but simulated outcomes are never human-play
acceptance. Unavailable phone measurements stay pending and do not prevent
independent source work. Do not represent incomplete parity as full migration.

## Acceptance
- Existing check -> smoke -> audit -> context -> archive:verify after each slice.
- New strict typecheck, rule tests, build and browser smoke per affected slice.
- Fresh, imported and malformed saves; atomic and repeated settlements.
- Natural start -> combat -> crystal pickup -> upgrade -> result -> retry.
- Single/double Boss, defeat, non-story isolation, all existing capability rows.
- Desktop, 390x844 and 320x844 layouts; real Android/iPhone touch acceptance.
- Fixed real-device benchmarks: target 60 FPS, low-tier P95 frame <=33.3ms;
  >=30 minute endurance and repeated scene lifecycle checks.
- HTTPS PWA install, offline downloaded chapters, interrupted download/update,
  storage failures, no update during battle, source/artifact version agreement.

No account/network/payment/new content/art overhaul. No phone or deployment
evidence may be invented. Package lock is frozen after compatibility checks.
