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
R0 remediation baseline complete: 14 issues, chapter rules, outsourced sample brief, 25 quote groups/85 icons and 18 acceptance groups. See tasks/game-remediation/evidence/R0/RESULTS.md. G5 runtime 821b90c and Render dep-dagi1c740ujc73f9nikg remain the deployed baseline.

## Changed files
Added tasks/game-remediation roadmap/contracts/inventory and repeatable cold-start evidence. Updated TASK, INDEX and stale modernization status pointer. No runtime, dependency, save, legacy or archive change.

## Tests
Five root gates, 49 legacy hashes, types, 974/974 rules and build pass. Cold Chrome contexts: desktop/360/390/430 x3 =12/12; battle readiness 202-259ms after click, no browser/resource errors. 12 raw videos+1 MP4 fully decoded and hashed. Desktop emulation only.

## Unresolved risk
P2l natural HP-death and G4 public cold readiness timeout remain open; successful local samples do not explain historical failure. Real phones, performance/endurance, full parity/audio/PWA, legacy favicon404 and large chunk remain. Outsourcing/human playtests pending. G4 rollback 05b82ac / dep-daggvhbl550s73bkiq30; auto-deploy Off.

## Recommended next task
R1a: versioned preparation and independent CH001 progress/atomic settlement. Preserve unknown Schema30 fields, reject future-extension writes, isolate old stats/stars, test native IDB abort/retry/conflicts. Keep incomplete chapter gameplay unavailable; then R1b growth/selection.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
