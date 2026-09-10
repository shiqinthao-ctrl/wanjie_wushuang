# TASK.md - R1c dragon directional combat

Status: completed. Base/rollback e2030f9; recorded G5 reference 821b90c.
Execute this slice only; full roadmap: tasks/game-remediation/ROADMAP.md.

## Scope
- Redesign chapter1-v1 H001 dragon only: movement-facing frontal slash,
  core piercing fire blade, manual breach and awakened consecutive attacks.
  Preserve a side/rear weakness and viable single-Boss damage.
- Rules own windup, damage, projectile collisions, recovery and cancellation.
  Phaser consumes pose/telegraphs/events; effects never drive rules or RNG.
- Add directional weapon/pose and blade feedback as an engineering sample,
  accurate chapter-only descriptions, four combat scenario tests and videos.
  Professional art/audio, growth pacing and full R1 acceptance stay separate.
  Keep Boss Loot priority; chapter loot is confirmation, not legacy equipment.
- No new dependency, legacy source/archive/release edits or Render deployment.
  Preserve Schema30, fresh/defeat zero stars, non-story isolation and V3.0 fixes.

## Acceptance
1. Failing tests first: front/side/rear, windup lock, piercing once per target,
   range/collision edges, awakening, cooldown/cancel, pause and destruction.
2. Cover crowd, ranged, elite and Boss with deterministic scenarios; effects
   on/off produce identical rules, old preview behavior remains unchanged.
3. Record labeled scenarios and normal-speed growth through real inputs,
   without editing HP/XP/drops/time in natural runs. Retain failed attempts.
4. Run check, smoke, audit, context, archive:verify in order, then types/full
   rules/build and focused desktop/phone-size browser regression.
5. Record evidence/limits, update five handoff fields, commit and push existing
   codex branch. No full R1 tag or accepted professional art/combat claim.

## Result
See tasks/game-remediation/evidence/R1c/RESULTS.md and RECORDINGS.md.
26 new rules; 1269 full rules, 64 browser cases and 2 natural dragon growth
runs pass. Interrupted recorder attempt retained. No Render deployment.
Next: scope R1d enemy/Boss readability in TASK before further implementation.
