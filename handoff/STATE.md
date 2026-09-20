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
R1f chapter phone HUD and pause controls. Chapter battle HUD compacted to
title/time/pause + side-by-side life/XP rows; kills and build guide moved into
the pause dialog with a collapsed summary, scrollable middle and pinned
continue/exit. Phone actions show readiness/cooldown without persistent
keyboard hints (desktop keeps them, coarse/narrow switches automatically).
Real-device fix: pause now activates on pointerdown because browsers emit no
click while another finger is held. Chapter-only styles in new chapter-ui.css.
Evidence: tasks/game-remediation/evidence/R1f/RESULTS.md. Rollback 3e840c1;
G5 reference 821b90c not reverified; no Render deployment.

## Changed files
BattleView.vue (chapter HUD/pause restructure, pause pointerdown), new
chapter-ui.css (chapter-scoped), new tests/chapter-ui.spec.ts (10 tests),
boss.spec.ts reward-click race fix (1500ms timeout like settlement.spec).
No legacy layout, dependency, archive, release or rule/balance changes;
Schema30, fresh/defeat zero stars, non-story isolation, one settlement and
V3.0 fixes untouched.

## Tests
Five root gates pass in order; types and 1,313/1,313 rules across 35 files and
build pass. chapter-ui 10/10 (phone): 360/390/430 widths, pause collapse/
scroll, 640x360 landscape, mid-run resize, simultaneous move+cast,
pointercancel, held-finger pause entry, directed upgrade 360 and boss 390
layouts. Focused chapter regression 92/92 (desktop+phone). Focused G5
regression 80/98: boss natural race fixed and re-run 1/1; 16 by-spec-guard
skips (no landscape-* project in config, pre-existing); 2 failures are the
SAME pre-existing drift at base 3e840c1: settlement natural corner-contact
defeat instead sees the hero kill the boss (evidence R1f/settlement-base).
All attempts, browser-errors.json (all empty) and WebM recordings retained;
inventory and hashes in R1f/recordings.json. Screenshots reviewed by hand at
360/landscape/upgrade/boss/expanded-guide.

## Unresolved risk
Pre-existing since before this slice: natural play now survives to kill the
first boss, so settlement.spec:210 cannot reach natural defeat on the
committed base; needs a dedicated balance/test-strategy task, zero-star
defeat logic itself still covered by rules. Landscape/short-layout native
specs are dead-skipped under the committed playwright config (no dedicated
projects). Phones are emulated Chrome only; no iOS Safari, physical device,
public chapter entry, professional art/audio acceptance, natural Boss victory
chain or external players. H010/H012, charms, stages 2-3, P2l natural
HP-death, G4 cold timeout and live G5/auto-deploy remain open. Large chunk
and long pause menu polish continue; rollback 3e840c1, keep saves/evidence.

## Recommended next task
R1g per roadmap: restore a reachable natural defeat (either rebalance the
legacy early game or give the settlement harness an explicit hazard-death
path) and re-verify settlement.spec:210 plus the focused G5 batch to green;
scope TASK before touching any balance. Then the natural Boss chain and
external-player tests stay separate; no full R1 tag or asset-production
claim until those gates close.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
