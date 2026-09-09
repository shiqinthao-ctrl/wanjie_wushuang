# P4c landscape battle layout evidence

Date: 2026-09-09. Tag: `mobile-next-p4c-20260909`.
Baseline: `1325d371019fb110a82d10f672421df488b6d4c7` (verified P4a/P4b delivery).

## Change and boundary

The 568 x 320 baseline placed vitals over the joystick; combat records, map
feedback and reward controls also overlapped across the landscape matrix.
Landscape viewports up to 600 px high now use a three-column HUD: vitals and
combat feedback on the left, map/objective/Boss feedback on the right, and a
clear center for the hero. Rewards sit between the two control areas. Long
feedback and dialogs remain scrollable, including browser safe areas.

Runtime changes are 39 added CSS lines and the Render milestone identifier.
No Vue script/markup, GameCore, camera, world coordinates, RNG, collision,
balance, progression, settlement, storage, dependency or legacy-source change
is made. P4a/P4b fixes remain included. Schema30 and existing invariants remain.

## Browser evidence

Evidence root: `evidence/P4c/`. Every attempt is retained, including failures.

| Attempt | Pass | Fail | Observation |
| --- | ---: | ---: | --- |
| before-01 | 0 | 0 | Setup failed before tests: merged server config selected occupied port 4178. Error report retained; no recording. |
| before-02 | 0 | 3 | Natural baseline: vitals/joystick, combat/map/reward overlap. |
| after-01 | 3 | 0 | Initial classic landscape geometry correction. |
| after-02 | 2 | 4 | Intermediate HUD background shaded the hero; pixel checks failed at short safe-area/300 px height. |
| after-03 | 9 | 0 | Final classic, natural evolution and synthetic crowded HUD in three landscape sizes. |
| regression-01 | 27 | 0 | Existing camera-controls and lifecycle cases in nine viewports. |
| portrait-01 | 9 | 0 | Existing P4b short portrait cases in three viewports. |
| Total | 50 | 7 | 57 executions and raw recordings; one additional setup failure. |

The latest distinct related cases are **45/45 passing**, not a full gameplay
suite result. Landscape dimensions: 568 x 320, 640 x 360, 844 x 390.
Portrait regression: 320 x 568, 360 x 640, 390 x 664, plus established narrow,
phone and desktop profiles in the control/lifecycle matrix.

Natural cases enter from the lobby and assert viewport bounds, pairwise
HUD/reward/control separation, full hero clearance with the existing pixel
fixture, and buttons at least 44 x 44 px. Evolution checks browser-emulated
44 px left/right and 21 px bottom safe areas, simultaneous touch movement and
skill activation, movement outside the pad, touch cancellation, naturally
dropped experience and upgrade selection. It also covers route/pause dialogs,
portrait/tall/landscape rotation, a 300 px browser height and repeated entry.
No game state, save, RNG or clock is injected in these natural cases.

The crowded test inserts DOM-only Boss/name/notice markup after ordinary
entry, then checks geometry and keyboard/native-touch scrolling. This is a
synthetic layout stress test, not evidence of naturally reaching a Boss.
Before/after, safe-area, crowded and natural-upgrade screenshots were visually
inspected. A visible local 568 x 320 evolution entry, route/pause, resume and
exit passed with no game console warnings/errors; viewport override reset.

## Rules, artifacts and review

`rules.json` records 946/946 passing rules. All five ordered root gates,
49/49 legacy baseline hashes and app typecheck/build pass; see `gates.json`.
The existing Phaser chunk warning remains (1,429.70 kB / 377.35 kB gzip).

`recordings.json` includes sizes, SHA-256, duration and successful full decode
for all 57 WebM recordings. `wanjie-p4c-natural-test.mp4` is the complete
18.24-second short-landscape evolution test from after-03, at original speed
without cuts. It is a test recording, not a complete match. The comparison
poster and four-frame review sheet were visually checked. The recordings ZIP
retains failed attempts. Existing Python/Pillow/FFmpeg tools add no app dependency.

Source/test review found no required correction remaining within this slice.
The presentation change retains feedback and existing control behavior, with
no public debug UI. Browser emulation does not establish physical-phone UX.

Reproduce using a new attempt name; existing reports are rejected:

```powershell
cd apps/mobile-next
$env:P4C_ATTEMPT = 'new-landscape-check'
npx playwright test --config playwright.p4c.config.ts landscape-layout.native.spec.ts --project landscape-short --project landscape-medium --project landscape-wide
```

Use camera-controls.native.spec.ts and lifecycle.spec.ts for nine-profile
regression, and short-layout.native.spec.ts with short/medium/browser-bars for
the portrait regression. `package-p4c-release.py --media` prepares media once;
`--release` requires a clean tagged checkout and matching Render manifest,
verifying gates, browser counts, all recording hashes and ZIP entry hashes.

## Delivery and open work

Release folder: `releases/mobile-next-p4c-20260909/`. Six assets: natural MP4,
comparison poster, all-recordings ZIP, Render build ZIP, notes and SHA256SUMS.
GitHub/Render delivery is pending at packaging time; final delivery evidence
will be appended after remote hashes and the actual public runtime pass.
The runtime tag and preparation-time release assets will remain immutable.

P2k's three fresh natural HP-death target failures remain open (actual outcome:
victory). The full gameplay suite was not rerun. Physical phones, performance,
30-minute endurance, remaining stages/modes, audio/full parity and PWA remain
separate work. Next recommended slice: investigate fresh natural defeat/retry
acceptance from preserved evidence, without changing balance to force defeat.
This preview is not full P4 completion or a replacement for the legacy game.

## Verified delivery - 2026-09-09

Runtime commit: `649b0b54e16b0016de9ba88dd148516aefd0da8b`.
The annotated tag and branch are pushed; main remains `30d05f2`. GitHub
prerelease ID 385221073 has six matching remote sizes and SHA-256 digests:
https://github.com/shiqinthao-ctrl/wanjie_wushuang/releases/tag/mobile-next-p4c-20260909

Render Clear build cache & deploy completed as `dep-dagdr1142hec73brst60`,
source 649b0b5, at 12:16:22 GMT+8 (18.1 seconds). Same branch, empty root,
Node 24.18.0, build command and publish dist/render were confirmed. Auto-deploy
Off was inspected and the editor cancelled without saving any change.
The build reports zero dependency vulnerabilities and the existing chunk warning.

Local HTTP and public HTTPS checks pass all 51 runtime hashes/sizes, both
entry references, legacy baseline and four repository-only URL exclusions.
The visible live 568 x 320 smoke uses the existing Flame Ninja / 6,000 gold
save: entry, hero skill, pause, resume and exit pass. Legacy Continue opens
its existing lobby; neither game tab reports console warnings/errors. The
temporary viewport is reset. This visible check makes no timing claim.

Three additional tests run against the actual public HTTPS site using the
unchanged natural evolution test at 568 x 320, 640 x 360 and 844 x 390. All
three pass: natural upgrade, two-finger skill/movement, cancellation, safe
areas, rotation, 300 px height and remount. Their three original videos fully
decode and are separate from the 57 local recordings in the immutable release.
The first temporary live config had an ESM extension error before any test
ran; renaming .ts to .mts resolved it. That setup failure is recorded in
delivery.json. No application source changed during live verification.

Final records under evidence/P4c: github.json, delivery.json, live-http-01.json,
delivery-live-01/results.json, live-recordings.json and live screenshots.
The release notes/ZIP/checksums keep their preparation-time state; this final
documentation-only follow-up records completed delivery without moving the
runtime tag or triggering another deploy. P2k/full-suite/phone/performance/PWA
limits above remain open. RENDER-DEPLOYMENT.md records rollback references.
