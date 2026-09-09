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
R1b H001/CH001-01 growth connects to GameCore and BattleView: 4+4, three-choice evolution, core grant/awakening, reroll/banish and isolated settlement. Normal-speed growth passes on desktop/phone-size Chrome. See tasks/game-remediation/evidence/R1b/RESULTS.md. G5 runtime 821b90c / Render dep-dagi1c740ujc73f9nikg unchanged.

## Changed files
Added chapter growth/neutral combat context, chapter result UI and 209 rule cases; scoped optional chapter path in core, map, Boss and battle UI. Added real battle fixture with natural and synthetic flows. Updated TASK, contract, evidence and handoff. No legacy source, dependency, archive or deployment change.

## Tests
Five root gates, 49 legacy hashes, types, 1243/1243 rules and build pass. H001 200 seeded growth cases. Final browsers: 10 synthetic growth + 2 normal-speed growth + 46 compatibility pass. 44 raw videos, 44 report copies and 2 MP4s decoded/hashed. Failed attempts retained; synthetic victory/death are not natural acceptance.

## Unresolved risk
R1 gameplay/art sample incomplete; no public chapter entry. Natural awakening about 91/131s is earlier than target 210-270s; balance open. H010/H012, charms/stages 2-3 unavailable. P2l natural HP-death, G4 cold timeout, phones/endurance/PWA/audio/human acceptance remain open. Large chunk/favicon404 remain. R1b rollback fa8d3a2; keep data. G5 stays live, auto-deploy Off.

## Recommended next task
R1c: scope TASK first; implement chapter-only dragon frontal arcs/piercing fire blades, weak side and awakened consecutive attacks. Verify crowd/ranged/elite/Boss scenarios and readable feedback; retain G5 behavior. Use R1b timing evidence for later sample tuning; no asset-production or full R1 acceptance claim.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
