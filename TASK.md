# TASK.md - R1b isolated chapter growth

Status: complete. Base/rollback fa8d3a2; live G5 remains 821b90c.
Execute this slice only; full roadmap: tasks/game-remediation/ROADMAP.md.

## Scope
- Connect chapter1-v1 preparation to the sole GameCore loop; H001/CH001-01
  only in this slice. Explicit options and seeded rules, no legacy startup,
  gear/runes/pet bonuses or old currency events. Preserve preview defaults.
- Four automatic/four passive slots, three distinct Lv.3 evolution choices,
  core grant, legal core/owned guarantees, exclusive routes and Lv.8 plus
  core Lv.3 awakening. Two normal rerolls/one unowned non-core ban per run;
  no illegal full-slot offers, max-level overflow or stale choice activation.
- Wire normal BattleView controls and chapter-only atomic settlement. Test
  fixture mounts real UI and Phaser; no public lobby entry/debug controls yet.
- Combat/visuals remain transitional G5 mechanics; R1c owns dragon redesign.
  Map/currency/chest content excluded until new chapter reward rules exist.
  Keep Boss Loot priority; chapter loot is confirmation, not legacy equipment.
- No new dependency, legacy source/archive/release edits or Render deployment.
  Preserve Schema30, fresh/defeat zero stars, non-story isolation and V3.0 fixes.

## Acceptance
1. Test new behavior before implementation; 200 fixed H001 seeds, bounded
   slots, replay determinism, core reachability and original preview regression.
2. Verify rich/fresh legacy saves yield identical chapter combat, no old
   settlement, and chapter final/report binding. Failure/retry stays atomic.
3. Record normal-speed UI growth attempts without editing HP/XP/drops/time.
   Synthetic edge fixtures labeled separately; preserve failures and originals.
4. Run check, smoke, audit, context, archive:verify in order, then types/full
   rules/build and focused desktop/phone-size browser regression.
5. Record evidence/limits, update five handoff fields, commit and push existing
   codex branch. R1b is a growth foundation, not accepted art/combat sample.
