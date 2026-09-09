# TASK.md - P4a portrait edge camera

Status: local implementation and acceptance complete, 2026-09-09.
GitHub/Render delivery pending: external HTTPS connections fail.

## Goal
Keep the hero visible at portrait phone map edges with presentation-only
camera padding and a visible world boundary. Preserve desktop camera behavior.

## Scope and invariants
- Mobile-next rendering and directly related regression/evidence only; no new
  dependencies. Keep existing controls and UI patterns.
- Preserve the full GameCore viewport, world coordinates, spawning, movement,
  collision, progression, RNG and settlement. Camera space is not playable space.
- Preserve legacy sources, Schema30, fresh/defeat zero stars, non-story isolation,
  one settlement per run, Boss Loot priority, V3.0 fixes and prior evidence.
- Keep P2k's three fresh HP-death target failures open and separately tracked.
- Continue authorized GitHub sync and Render preview deployment to service
  srv-d9v8cm1t0dsc73ch79k0. Keep legacy root, auto-deploy off and main unchanged.

## Acceptance and delivery
1. Reproduce the edge occlusion with natural browser input before the fix.
2. Record all four corners in both phone layouts; check hero/HUD geometry.
3. Check simultaneous movement/skill, pause/resume, resize and repeated entry.
4. Run check, smoke, audit, context, archive:verify in order; verify 49 baseline
   hashes, app rules/types/build and related real-browser cases.
5. Review recordings, record P4a evidence/changelog, update the five handoff
   sections, commit/tag/push and verify the new Render package and live startup.

Physical phones, short/landscape HUD redesign, full parity, PWA, performance,
endurance and natural fresh HP-death remain separate follow-ups.

## Result
946 rules, 17 latest related browser cases and the root/baseline checks pass.
35 raw recordings retain three failed attempts; the 12-second comparison is
reviewed. See tasks/mobile-modernization/P4a-EVIDENCE.md for exact counts.
Resume the already-authorized remote sync and verified deployment when the
connection recovers, before starting the next slice.
