# TASK.md - G3 combat readability and route decisions

Status: implementation and local acceptance completed, 2026-09-08.
Specification: tasks/mobile-modernization/G3.md.
Evidence: tasks/mobile-modernization/G3-EVIDENCE.md. Tagged delivery and remote
verification are recorded under tasks/mobile-modernization/releases/.

## Goal and scope
Continue G2 in the isolated mobile-next Evolution Journey. Make frost fields,
instant frost bursts, real lightning chains and summon roles readable. Explain
route playstyles/tradeoffs and owned/missing bond skills at normal choice/guide
surfaces. Record alternate shatter/thunderstrike/hunter/guard natural play,
including one full victory/save/replay. No new balance or progression rules.

## Authorized dependencies and versioning
No new dependencies or lockfile changes. App source/tests, migration docs,
local evidence/report generation and Git hygiene are in scope. Preserve prior
P2j/G1/G2 work and all raw evidence; checkpoint it before G3. User authorizes
commits and GitHub upload on codex/mobile-web-modernization. Publish a clearly
marked development milestone with source, changelog, checks and recording
assets; do not switch the old entry or deploy the game. Never force push.

## Acceptance
- Render-only effects consume copied combat events, remain bounded, freeze
  while paused and clear on teardown. Disabling effects leaves damage, drops,
  slow, collision and settlement identical; important area boundaries remain.
- Choices show route benefits/constraints; guide names owned and missing
  positive-level skills. Native keyboard/touch controls remain reachable at
  1280x720, 390x844 and 320x844 without overflow or activation carryover.
- Natural recordings use visible controls, no injected RNG/time/XP/HP/state.
  Preserve attempts, inspect actual frames and provide a playable local report.
  Synthetic fixtures remain separate. Check GitHub branch/tag/assets after push.

## Checks and boundaries
Run check, smoke, audit, context, archive:verify in order; 49 baseline hashes,
app types/rules/build and affected browser tests. Keep context <8192 bytes.
Preserve Schema30, original saves, zero-star defeats, non-story isolation,
atomic once-only settlement, Boss Loot priority and V3.0 fixes.
P2j fresh-preparation HP-death remains a separate open acceptance gap; retain
its assertions. No full-suite-green, real-phone, performance, endurance or PWA
claim. Update the five rotating sections of handoff/STATE.md after this slice.
