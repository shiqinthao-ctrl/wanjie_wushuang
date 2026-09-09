# TASK.md - P4b short portrait battle layout

Status: local acceptance complete; remote delivery, 2026-09-09.
P4a delivery remains pending; GitHub and Render access recovered on a later retry.
Retain both releases and publish the latest verified P4b preview.

## Goal
Keep the short portrait battle HUD readable, preserve a clear central hero area
and separate reward buttons from movement/actions. Retain the existing visual style.

## Scope and invariants
- Mobile-next HUD markup/CSS and directly related regression/evidence only; no
  new dependencies. Compact layout for portrait <= 600px wide / <= 740px high.
- Keep full HUD content available; allow bounded scrolling for detailed map
  feedback. Touch buttons at least 44px. Test 320x568, 360x640 and 390x664,
  safe-area insets, browser-height changes and unchanged tall/desktop layouts.
- Preserve the full GameCore viewport, world coordinates, spawning, movement,
  collision, progression, RNG and settlement. Camera space is not playable space.
- Preserve legacy sources, Schema30, fresh/defeat zero stars, non-story isolation,
  one settlement per run, Boss Loot priority, V3.0 fixes and prior evidence.
- Keep P2k's three fresh HP-death target failures open and separately tracked.
- Continue authorized GitHub sync and Render preview deployment to service
  srv-d9v8cm1t0dsc73ch79k0. Keep legacy root, auto-deploy off and main unchanged.

## Acceptance and delivery
1. Capture baseline short portrait HUD overlap using natural lobby/battle input.
2. Assert HUD/reward/control separation and clear hero area, then record results.
3. Check simultaneous movement/skill, choice dialogs, pause/resume, resize and
   repeated entry; distinguish synthetic crowded-HUD checks from natural play.
4. Run check, smoke, audit, context, archive:verify in order; verify 49 baseline
   hashes, app rules/types/build and related real-browser cases.
5. Review recordings, record P4b evidence/changelog, update the five handoff
   sections, commit/tag/push and verify the new Render package and live startup.

Physical phones, landscape HUD redesign, full parity, PWA, performance,
endurance and natural fresh HP-death remain separate follow-ups.

## Result
946 rules and 27 latest related browser cases pass; 45 executions / 42 raw
recordings retained. Natural upgrades and synthetic Boss layout are separate.
Five ordered root gates, 49/49 legacy hashes and app types/build pass.
See tasks/mobile-modernization/P4b-EVIDENCE.md and its gates.json for evidence.
Preserve P4a's 35 recordings and immutable tag 212c4fc. Complete authorized
remote delivery and record exact source/deployment verification separately.
