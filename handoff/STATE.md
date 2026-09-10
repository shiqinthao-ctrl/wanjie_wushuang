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
R1c chapter-only dragon directional combat: frontal arcs, piercing blades, awakened follow-ups, locked windups and dodge cancellation. Procedural weapon/pose sample and descriptions match rules. See tasks/game-remediation/evidence/R1c/RESULTS.md and RECORDINGS.md. No Render deployment; historical G5 reference 821b90c not reverified.

## Changed files
Added DragonCombat/DragonView/dragonText and 26 rules; scoped EvolutionCombat, movement-facing/events, render and chapter descriptions. Added four directed browser scenes and bounded natural-recorder button waits. Updated TASK, contract, evidence and handoff. No legacy source, dependencies, archives or release changes.

## Tests
Five root gates, 49 archive hashes, types, 1269/1269 rules and build pass. Final browsers: 8 dragon + 10 growth + 46 compatibility; 2 natural dragon growth runs. 43 raw WebM, 43 report copies and 6 MP4s decoded/hashed; 1 interrupted partial WebM retained separately. Four directed scenarios are synthetic, not natural Boss victory.

## Unresolved risk
Full R1/art sample and public chapter entry incomplete. Dragon awakening at 166s desktop/97s phone-size precedes target 210-270s; balance open. H010/H012, charms/stages 2-3 unavailable. P2l natural HP-death, G4 cold timeout, phones/endurance/PWA/audio/human gates open. Large chunk, mobile shortcut/HUD occlusion remain. R1c rollback e2030f9; keep saves/evidence. Live G5/auto-deploy not reverified.

## Recommended next task
R1d: scope TASK first; improve chapter step-soldier windup/hit/death and one Boss move's telegraph and response. Test normal/interrupt/low-effects paths and record visible results. Keep chapter/G5 isolation; use R1b/R1c timing for later tuning. No professional asset-production or full R1 acceptance claim.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
