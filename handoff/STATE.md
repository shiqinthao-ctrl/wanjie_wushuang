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
G2 complete: three starters, nine forms, five branching skills and six bonds. Added frost control, lightning routes and summon synergy. Three original browser recordings include a full frost victory/save/replay. P2a-i and G1 retained; P2j fresh HP-death gap remains.

## Changed files
G2 catalog/RunEvolution/EvolutionCombat, progression/combat math/slow, Phaser effects, lobby, focused rules, recorded browser helper/spec and local replay report. G1/P2j dirty work and evidence preserved. TASK/status/README/G2 evidence and five handoff sections updated. No legacy/dependency change.

## Tests
G2: legacy 5 gates, 30/30 archives, 49/49 hashes, types/build and 937/937 rules pass. Recorded natural 3/3 (desktop full victory/replay, two touch viewports), affected browser 87/87 including original G1 routes. Three videos fully decoded; representative frames viewed. See G2-EVIDENCE.md and local evidence/G2/index.html.

## Unresolved risk
P2j fresh-preparation HP-death remains unverified; supplemental import evidence does not replace it. Full verify is not green. G2 balance, physical phones and endurance unverified; first story stage only. Audio/full parity/PWA pending. Phaser chunk warning remains; no measured performance gain.

## Recommended next task
Define one G3 slice for elemental attack readability and alternate build variety, with measured player feedback before tuning. Track P2j fresh HP-death separately without balance/time/state changes. Local G2 recording viewer uses port 4189; app preview uses 4178 when started.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
