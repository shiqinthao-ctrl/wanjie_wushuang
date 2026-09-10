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
R1e chapter H001/dragon presentation mapping and 16 original synthesized engineering cues. Added gesture unlock, bounded mix, persisted mute/volume, pause/manual resume and cleanup. See tasks/game-remediation/evidence/R1e/RESULTS.md and RECORDINGS.md. No Render deployment; G5 reference 821b90c not reverified.

## Changed files
Added chapterPresentation, audio backend/mixer/lifecycle/settings, AudioSettings UI and 23 rules. Core adds confirmed feedback events, including banked XP choices; mountBattle consumes them. Added 7 audio browsers per viewport. Updated TASK, contracts, evidence and handoff. No legacy, dependency, archive or release edits.

## Tests
Five root gates, types, 1313/1313 rules across 35 files and build pass. Final browsers: 14 audio + 24 enemy + 8 dragon + 10 growth + 46 compatibility = 102/102. Each viewport closes all contexts after 20 exits. 123 raw WebM, 110 report copies and 13 MP4s decode/hash; 9 accepted MP4s, 4 rejected exports retained. Four sound exports have signal; six silence samples RMS=0. 13.77s directed review, not natural victory.

## Unresolved risk
Full R1/professional art/audio and public chapter entry incomplete. R1d changed difficulty; old growth timing is not current evidence. H010/H012, charms/stages 2-3 unavailable. P2l natural HP-death, G4 cold timeout, phones/iOS audio/endurance/PWA/human gates open. Large chunk, mobile shortcuts/HUD and long pause menu remain. R1e rollback 8505a3d; keep saves/evidence. Live G5/auto-deploy not reverified.

## Recommended next task
R1f: scope TASK first; simplify chapter phone HUD and pause menu, remove persistent keyboard hints, verify 360/390/430 widths, safe areas, multitouch and modal interruption. Integrate professional samples only when available/accepted. Preserve chapter/G5 isolation. R1g natural Boss chain and external players remain separate; no full R1 tag or mass asset-production claim.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
