# P4b short portrait battle layout evidence

Date: 2026-09-09. Tag: `mobile-next-p4b-20260909`.
Baseline: `212c4fc2fc899371aff3d98e35d2cba045df6951` (P4a).

## Change and boundary

At 320 x 568 the map direction overlapped the stage objective and combat
record, while reward buttons narrowed to about 38.7 px. The compact portrait
layout now flows the top HUD as a grid, keeps vitals and feedback in paired
rows, and separates a full-width reward row from the joystick/action area.
Detailed map feedback remains scrollable by touch and keyboard. The compact
rules apply only at width <= 600 and height <= 740 in portrait orientation.

BattleView adds a presentation wrapper and a focusable map region; its script
is unchanged. No GameCore, camera, world coordinates, RNG, collision, balance,
progression, settlement, storage, dependency or legacy-source change is made.
The Render milestone identifies this build; the preceding P4a camera fix is
included by ancestry. The legacy root and isolated mobile path remain intact.

## Browser evidence

Evidence root: `evidence/P4b/`. Every attempt is retained, including failures.

| Attempt | Pass | Fail | Observation |
| --- | ---: | ---: | --- |
| before-01 | 0 | 3 | Browser setup failed before launch: iPhone profile selected WebKit with a Chrome channel. No recordings. |
| before-02 | 2 | 1 | Natural baseline: short portrait HUD overlaps and narrow reward controls. |
| after-01 | 3 | 0 | Classic entry geometry corrected at all three short sizes. |
| after-02 | 3 | 6 | Classic passes; new test setup used an incorrect CDP safe-area method. |
| after-03 | 6 | 0 | Correct CDP method; natural evolution and synthetic crowded HUD pass. |
| regression-01 | 18 | 0 | Existing controls, lifecycle and missing-assets behavior in six viewports. |
| scroll-01 | 3 | 0 | Synthetic crowded HUD with keyboard and real touch-scroll assertions. |
| Total | 35 | 10 | 45 executions; 42 original browser recordings. |

The latest distinct related cases are **27/27 passing**, not a full gameplay
suite result. The layout dimensions are 320 x 568, 360 x 640, 390 x 664 plus
the existing narrow, phone and desktop profiles for regression cases.

Natural classic/evolution cases use visible controls and real input. They
assert pairwise HUD/reward/control separation, full hero clearance using the
existing pixel fixture, and at least 44 x 44 px buttons. Evolution additionally
sets actual browser safe-area insets (24 px top / 34 px bottom), moves with one
finger while activating a skill with another, leaves the pad, cancels input,
collects naturally dropped experience, scrolls/selects an upgrade, pauses,
resizes across compact/tall heights, resumes and exits with no remaining canvas.
No game state, save, RNG or clock is injected in these natural cases.

The crowded-HUD test deliberately inserts DOM-only Boss markup, an awakened
hero name and long notices after ordinary battle entry. This verifies layout,
including keyboard and touch scrolling, **not a naturally reached Boss fight**.
The natural upgrade screenshot and before/after/crowded screenshots were
visually inspected. Local visible-browser entry, pause/resume and exit passed.

## Rules, artifacts and review

`rules.json` records 946/946 passing rule tests. All five ordered root gates,
49/49 legacy baseline hashes and final app typecheck/build pass; full outcomes
are in `gates.json`.
The existing Phaser chunk warning remains (1,429.70 kB / 377.35 kB gzip).

`recordings.json` records file sizes, SHA-256, durations and successful full
decode of all 42 original WebM videos. `wanjie-p4b-natural-test.mp4` is the
entire 12.68-second short evolution test from after-03 at original speed,
without cuts. It includes natural play and test interactions; it is not a
complete match. The four-frame contact sheet and before/after poster were
visually inspected. Failed attempts remain in the recordings ZIP.

Source/test review found no required correction remaining: the responsive
change stays within presentation, retains all feedback and reuses existing
controls. There are no new dependencies or public debug controls. Physical
device readability and portrait dimensions outside the recorded matrix have
not been accepted by these browser checks.

Reproduce with a new attempt name (existing evidence paths are rejected):

```powershell
cd apps/mobile-next
$env:P4B_ATTEMPT = 'new-short-layout'
npx playwright test --config playwright.p4b.config.ts short-layout.native.spec.ts --project short --project medium --project browser-bars
```

Use camera-controls.native.spec.ts and lifecycle.spec.ts for the unchanged
regression cases. `package-p4b-release.py --media` prepares recordings once;
`--release` packages a clean tagged checkout and matching Render package,
checking gates, reports, video hashes, ZIP entries and SHA256SUMS. Existing
local Python/Pillow/FFmpeg tools add no application dependency.

## Delivery and open work

Release assets: `releases/mobile-next-p4b-20260909/` (MP4, comparison poster,
all-recordings ZIP, Render build ZIP, notes and SHA256SUMS). P4a's immutable
tag and 35 original recordings remain available separately.

Earlier attempts this turn failed with GitHub TLS errors and Render
ERR_CONNECTION_CLOSED. A later retry restored access to both GitHub and the
existing Render dashboard. Publishing and exact-commit live verification are
recorded separately in RENDER-DEPLOYMENT.md after they actually complete.
No network, certificate, TLS verification or service settings were changed.

P2k's three fresh natural HP-death target failures remain open (actual outcome:
victory). The full gameplay suite was not rerun here. Physical phones,
landscape HUD usability, performance, 30-minute endurance, other stages/modes,
audio/full parity and PWA remain separate work. Next bounded slice: measure
landscape HUD/control overlap and fix only reproduced presentation failures.
This preview is not a full P4 completion or replacement for the legacy game.
