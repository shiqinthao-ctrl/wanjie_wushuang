# G2 elemental evolution and recorded acceptance

Date: 2026-09-08. Scope: `G2.md`, the isolated Evolution Journey first stage.
This extends G1 while retaining the open P2j fresh-preparation HP-death gap.

## Delivered behavior

- Three fixed starters now each offer three exclusive level-3 forms (nine in
  total). The new frostlord, thunderlord and beastlord change basic attacks,
  skill, ultimate and awakening. Evolution is run-only, with no healing,
  cooldown reset or permanent hero-level purchase.
- G2_FROST introduces temporary frost slow and two exclusive routes. A013 now
  offers relay or thunderstrike. Ten actives, eleven passives, five branching
  skill families and six mechanical bonds are available in the journey.
- Signature skills remain paid normal upgrade choices, guided until level 3,
  within six slots and level-5 caps. Existing active growth retains an offer.
- New bonds apply actual chilled-target lightning damage, summon frost pulses
  and faster summon intervals. Only positive-level owned skills count. Bosses
  take frost damage but retain their movement; ordinary slow never compounds
  base speed. Effects use simulation time and existing teardown/budgets.
- Phaser displays frost fields, chilled enemies and distinct form decoration.
  Vue continues to read snapshots and issue commands. No new dependencies,
  lockfile change, legacy source change or public debug controls.

## Rule evidence

The 12 focused G2 tests first failed before implementation. The final rule run
passes 937/937 tests in 21 files, with no skipped tests: 12 new mechanism tests
plus three existing form-parameterized cases added to G1's 922.
Machine-readable output: `evidence/G2/rules.json`.

Coverage includes signature acquisition and caps; frost auto cooldown and level
scaling; temporary noncompounding slow and expiry; mutually exclusive frost
routes; chain range, unique targets and area/chain tradeoffs; superconductivity
only while chilled; actual summon bonds and interval changes; new form attacks,
awakening, summon caps/destruction and Boss slow immunity; damage-element
isolation. Existing pause, replay, schema, transaction and settlement tests
continue to run. Synthetic state setup remains separate from natural play.

## Original recordings

All three new natural browser scenarios pass on their first recorded attempt.
They use real Chrome, visible UI, keyboard or CDP multi-touch. They never inject
RNG, battle time, experience, life or core state. Each test observes console,
page and HTTP errors; all report zero. Video is enabled on successful tests.

| Recording | Duration | Evidence |
|---|---|---|
| Desktop, 1280x720 | 313.88s | H001 -> frostlord -> glacier, awakening, winterlegion; B001 victory at 284 battle seconds, level 19, 556 kills, three stars; Boss Loot, saved rewards, one added run, starter replay and save equality after reload |
| Phone viewport, 390x844 | 115.20s | H010 -> thunderlord -> relay, superconductivity; simultaneous move/actions, route-guide pause/resume, abandon and restart with no final reward |
| Narrow viewport, 320x844 | 95.68s | H012 -> beastlord -> guard, winterlegion; touch controls, route-guide pause/resume, abandon and reset |

Raw test-results and HTML reports are preserved in
`evidence/G2/recorded-desktop-pass/` and
`evidence/G2/recorded-phone-narrow-pass/`. The prior test outputs were copied
to `evidence/G2/pre-g2-preserved/` before starting this batch. Earlier G1/P2j
failure evidence remains retained.

The desktop recording's guide shows the top of the long route list. The phone
and narrow recordings additionally scroll the activated G2 bond into view and
hold it for two seconds. No battle rule was altered for recording.

Delivery: `evidence/G2/index.html` contains a standalone local results viewer
with three original WebM files, selectable routes, timestamp jumps, playback
speed and downloads. `recordings.json` records sizes, durations, SHA-256 hashes,
timeline and full-decoding results. All video frames decode without errors
using the existing Playwright FFmpeg runtime. Representative actual decoded
frames were visually inspected for hero choices, routes, activated bonds,
combat and desktop victory. Videos retain original speed and have no audio
track because audio is not implemented in the current game.

## Affected regression and final gates

Affected browser regression passes 87/87 across all three viewport projects
(8.1 minutes): Boss, event, evolution, settlement and storage native fixtures;
save UI, lifecycle, combat and map; plus original G1 natural evolution routes.
This includes 84 affected/native checks and three natural G1 starter flows,
not 87 complete natural runs. Raw reports/screenshots are retained in
`evidence/G2/affected-regressions-pass/`; structured output is
`evidence/G2/regressions.json`.

Final engineering output is recorded in `evidence/G2/checks.json`: legacy
`check -> smoke -> audit -> context -> archive:verify` in order, the 49-file
baseline, strict types and production build. The Phaser chunk still exceeds
the 500 KB warning threshold; this is not evidence of improved performance.
`rules.json` retains the 937-test result. No acceptance assertion was removed
or skipped. Active context is 6270/8192 bytes; archive verification is 30/30.

Results-viewer verification passes three layouts and nine video-playback
checks (each video at every size): duration, seeking, advancing playback,
2x speed, original download, no document overflow and zero browser errors.
See `evidence/G2/viewer-check.json` and `viewer/`. The initial viewer check
found a missing favicon request; an embedded icon fixes it, with its failed
diagnostic/screenshot retained as `viewer-attempt-01.*`. Mobile visual review
also keeps test counts on one line and gives the detailed table its own scroll
area. These are report-only changes, not gameplay or test-assertion changes.

## Acceptance boundary

This completes the G2 scope only. P2j's retained fresh-preparation natural
HP-death assertion remains unresolved; its imported low-growth fixture is
supplemental. The full app `verify` suite is not a green gate and was not
represented as one. Chrome phone viewports do not certify physical iPhones,
Android devices, touch feel, 30-minute endurance or performance targets.
Audio, full-content parity and PWA remain pending. No entry switch, deployment,
push or commit is included in this batch.
