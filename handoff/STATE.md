# handoff/STATE.md

## Baseline
Version: V3.1.2 Context-Lite
Runtime: ordered global browser JS
Save schema: 30
Entry: `index.html`
JS files: 22
Dependencies: none at runtime

## Critical invariants
- Fresh ST001 stages start at 0 stars.
- Defeat grants 0 chapter stars.
- Non-story modes do not alter chapter stars.
- One run settles at most once.
- Endless ignores legacy 20-minute completion.
- Boss respawn regression, permanent aura slow, and rift cumulative-kill bug must remain fixed.
- Q/E skill, Space dodge, R ult, F interaction.

## Current architecture debt
Legacy version wrappers still exist. Migrate incrementally; do not rewrite the full combat loop in one task.

## Current task
See `../TASK.md`.

## Last completed
R1d chapter-only EN001 windup/strike/recovery and B001 cone commitment with safe response window. Added essential weapon/hit/death poses, warning progress and camera-bounded Boss cues. See tasks/game-remediation/evidence/R1d/RESULTS.md and RECORDINGS.md. No Render deployment; historical G5 reference 821b90c not reverified.

## Changed files
Added SoldierCombat, EnemyView and 21 rules; scoped CombatSimulation/FirstBoss events, BossView and camera/render order. Added 12 directed enemy cases per viewport. Updated TASK, rule contract, evidence/recording package and handoff. No legacy source, dependencies, archives or release changes.

## Tests
Five root gates, types, 1290/1290 rules across 31 files and build pass. Final browsers: 24 enemy + 8 dragon + 10 growth + 46 compatibility = 88/88. All attempts retained: 118 browser passes in total. 86 raw WebM, 86 report copies and 8 MP4s decoded/hashed; 30.64s review. Enemy scenes use artificial placement/durability, not natural Boss victory.

## Unresolved risk
Full R1/art sample and public chapter entry incomplete. Changed contact damage/recovery affects difficulty; R1c growth times are not R1d measurements, natural balance must be resampled. H010/H012, charms/stages 2-3 unavailable. P2l natural HP-death, G4 cold timeout, phones/endurance/PWA/audio/human gates open. Large chunk, mobile shortcuts/HUD remain. R1d rollback ad64a8b; keep saves/evidence. Live G5/auto-deploy not reverified.

## Recommended next task
R1e: scope TASK first; centralize hero/action/asset and presentation-event mapping, add first-gesture audio unlock, pause/resume and bounded mix priorities. Keep chapter/G5 isolation and source/licensing evidence; professional samples, R1f mobile HUD and R1g natural/human acceptance stay separate. No full R1 tag or asset-production claim.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
