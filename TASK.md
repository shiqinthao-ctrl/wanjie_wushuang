# TASK.md - R1e chapter presentation and audio sample

Status: complete. Base/rollback 8505a3d; recorded G5 reference 821b90c.
Execute this slice only; full roadmap: tasks/game-remediation/ROADMAP.md.
Evidence: tasks/game-remediation/evidence/R1e/RESULTS.md and RECORDINGS.md.

## Scope
- Chapter1-v1 H001/dragon: centralize sample assets, actions and event-to-cue
  mapping. Consume confirmed core events/snapshots; no damage from animation.
- Original synthesized engineering sounds for combat, growth and Boss cues.
  First gesture unlock, mute/volume persistence in separate mobile settings,
  bounded voices/cooldowns and danger priority. No music or new dependencies.
- Pause/hidden stops sound immediately; manual continuation resumes without
  replaying stale events. Dispose audio/listeners on exit; retry unlock failure.
- Audio/effects choices never change rules/RNG. G5/legacy remains silent.
  No public chapter entry, professional asset approval or growth rebalance.
- No new dependency, legacy source/archive/release edits or Render deployment.
  Preserve Schema30, fresh/defeat zero stars, non-story isolation and V3.0 fixes.

## Acceptance
1. Failing tests first: mapping, priority, cooldown, mute, lifecycle, failure
   recovery and rule parity. Verify actual Web Audio in Chrome.
2. Record labeled desktop/phone scenarios with sound, mute, pause, manual
   resume, reentry and evolution feedback. Retain all attempts.
3. Inspect visuals, console/network and decoded recording audio. Directed
   scenes do not establish natural or physical-phone acceptance.
4. Run check, smoke, audit, context, archive:verify in order, then types/full
   rules/build and focused desktop/phone-size browser regression.
5. Record evidence/limits, update five handoff fields, commit and push existing
   codex branch. No full R1 tag or accepted professional art/combat claim.
