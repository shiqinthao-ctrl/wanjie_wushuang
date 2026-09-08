# TASK.md - G2 elemental evolution and recorded acceptance

Status: completed, 2026-09-08.
Specification: tasks/mobile-modernization/G2.md.
Evidence: tasks/mobile-modernization/G2-EVIDENCE.md.
Recordings: tasks/mobile-modernization/evidence/G2/index.html.

## Goal and scope
Extend the isolated Evolution Journey with one new form per existing starter:
frost control, chain lightning and a summon army. Add frost skill, frost/lightning
routes and three mechanical bonds. Guide signature skill growth without free
levels or extra slots. Keep classic behavior and G1 branches intact.
Record natural browser play, including phone touch and one full victory/replay.

## Authorized dependencies
No new dependencies. App source/tests, local recordings/reports and migration
docs are in scope. Preserve prior dirty P2j/G1 work and all evidence.
Legacy source/entry/storage, 49 baseline hashes, archives and lockfiles unchanged.

## Acceptance
Rules: form eligibility, exclusive routes, capped temporary slow and expiry,
lightning target uniqueness/range, summon limits/expiry, each bond's real effect,
signature offers/slots, pause/reset and unchanged save/settlement invariants.
Natural browser: select all three additions, upgrade signature skills, choose
routes, inspect bonds, pause/resume, exit/re-enter; complete a victory/save/replay.
Use visible controls only: no injected RNG, time, XP, HP or core state.
Preserve passing and failed recordings, inspect decoded frames and provide a
playable local report with results and timestamps. Synthetic fixtures separate.
Run check, smoke, audit, context, archive:verify in order; verify 49 hashes,
app types/tests/build and affected browser paths. Context must remain <8192 bytes.

## Boundaries
New design applies only to Evolution Journey, ST001-01 story/normal and PET001.
Three starters, run-only forms/routes; permanent rewards retain atomic once-only
settlement and Schema30 compatibility. No public debug UI, deployment or push.
P2j fresh-preparation HP-death gap stays open; retain its assertion/evidence.
Full verify is not green. No physical-phone/performance/endurance/PWA claim.
Update five rotating sections of handoff/STATE.md after this slice.
