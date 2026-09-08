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
P2k investigation complete: corrected natural-test wall-time and import readiness; retained three fresh Boss-contact target failures with actual victory/save/replay evidence. Added 54 synthetic strategy diagnostics and 12 complete settlement recordings. Fresh HP-death gate stays open; G3 gameplay unchanged.

## Changed files
P2k settlement test helper/config, diagnostic and viewer/package tools, original evidence, changelog/release notes and TASK. No app runtime, preparation, balance, dependency or legacy-source changes. Each attempt uses its own directory; all failures retained.

## Tests
P2k: legacy 5 gates, 30/30 archives, 49/49 hashes, types/build and 946/946 rules pass. Browser attempts 51 pass/6 fail; three setup failures fixed on rerun. Latest 54 distinct cases: 51 pass/3 fresh HP-death failures. Native related cases 42/42; complete recordings 9 pass/3 fail. All 12 videos decoded; 36 viewer playback/download checks pass.

## Unresolved risk
Fresh HP-death remains open: three contact runs won; 54 synthetic runs had 21 wins/33 timeouts, no HP-death. This does not prove impossibility. Full suite not rerun/green. Physical phones, balance, performance/endurance unverified. Edge HUD/controls can obscure combat; first stage only, audio/full parity/PWA pending. Phaser chunk warning remains.

## Recommended next task
Define one narrow phone camera/control-occlusion slice with natural input evidence; keep P2j HP-death tracked separately and never replace it with imported/synthetic evidence. P2k-EVIDENCE.md records tested strategies. Viewer: port 4191. GitHub branch codex/mobile-web-modernization; tag mobile-next-p2k-20260908. Upload verification goes in ignored releases folder.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
