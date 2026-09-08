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
G3 complete: real lightning paths, frost lifetime/bursts, summon role marks, effect toggle and ten-route/bond guidance. Four selected natural recordings include frost victory/save/replay. Three starters, nine forms and six bonds retained; P2j fresh HP-death gap remains.

## Changed files
G3 copied combat events, bounded Phaser effects, choice/guide components, nine rule cases and recording exit helper. Added replay viewer/package tools, evidence, changelog and release notes. Prior P2j/G1/G2 preserved in 0fc637c; no legacy/dependency change.

## Tests
G3: legacy 5 gates, 30/30 archives, 49/49 hashes, types/build, 946/946 rules and 87/87 affected browser cases pass. Selected natural recordings 4/4; all attempts 7 pass/3 fail, preserved with causes. See G3-EVIDENCE.md, recordings.json and viewer-check.json for decoded video/playback evidence.

## Unresolved risk
P2j fresh-preparation HP-death stays open; full verify is not green. Physical phones, balance, performance/endurance remain unverified. At map edges some summons approach bottom controls. First stage only; audio/full parity/PWA pending. Phaser chunk warning remains.

## Recommended next task
Define one slice closing P2j fresh HP-death naturally without state/time/balance changes; then gather phone camera/control feedback before more content. G3 viewer: port 4190. Authorized GitHub branch codex/mobile-web-modernization; tag mobile-next-g3-20260908. Upload verification stays in ignored releases folder.

## After each task
Replace only these fields:
- Last completed
- Changed files
- Tests
- Unresolved risk
- Recommended next task
