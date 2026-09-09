# TASK.md - P4c landscape battle layout

Status: locally verified; GitHub/Render delivery pending, 2026-09-09.

## Goal
Keep landscape battle information, the central hero and both touch control
areas readable and separate, including safe areas and rotation.

## Scope and invariants
- Mobile-next presentation CSS and directly related browser tests/evidence.
  No new dependencies; retain the established visual language.
- Reproduce at 568x320, 640x360 and 844x390; test left/right safe areas,
  changing browser height, portrait rotation, natural upgrade/pause dialogs,
  simultaneous movement/skill and repeated entry. Touch targets >= 44px.
- Keep all feedback available, using bounded scrolling where necessary.
- Preserve GameCore, viewport/world coordinates, camera, RNG, collisions,
  progression, balance and settlement. Preserve P4a/P4b fixes and evidence.
- Preserve legacy sources, Schema30, fresh/defeat zero stars, non-story
  isolation, once-only settlement, Boss Loot priority and V3.0 fixes.
- Keep P2k's three fresh HP-death target failures separately open.
- Continue authorized GitHub and Render delivery to srv-d9v8cm1t0dsc73ch79k0;
  preserve legacy root, auto-deploy off, immutable old tags and main.

## Acceptance and delivery
1. Record the failing baseline using natural lobby/battle input.
2. Assert HUD/rewards/controls separation, central hero clearance and touch
   target sizes. Separate synthetic crowded Boss HUD checks from natural play.
3. Run related browser regressions with recordings, then root check, smoke,
   audit, context, archive:verify in order, 49 legacy hashes and app rules/build.
4. Review video/screenshots; record evidence and changelog, replace the five
   handoff sections, commit/tag/push, package the release and deploy Render.
5. Verify live commit, runtime hashes, excluded repository paths and both
   entries, then record the actual delivery in a documentation follow-up.

Physical phones, performance/endurance, full parity, PWA and natural fresh
HP-death remain separate acceptance work.
