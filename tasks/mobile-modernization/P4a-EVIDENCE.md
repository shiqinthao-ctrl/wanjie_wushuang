# P4a portrait edge camera evidence

Date: 2026-09-09. Tag: `mobile-next-p4a-20260909`.
Baseline checkout: `d2ab25806f305172daa9e66cfbdcf90c92c9f339`.

## Change and acceptance boundary

Before this change, moving H001 to the south-east world corner placed the hero
behind the bottom-right interaction button on a 390 x 844 phone layout.
P4a pads only the portrait camera bounds by half a viewport on each side.
The hero remains centered and the arena has a visible gold/jade boundary.
The additional camera area is not playable space. Ground sizing and bounds
update only when the viewport or core world size changes.

Portrait means width <= 600 and height > width. Desktop/landscape camera
clamping stays unchanged. GameCore, its full viewport, world coordinates,
movement, enemy spawning, RNG, damage, skills, progression and saves are
unchanged. No dependencies or legacy runtime files changed.

## Browser attempts

Chrome production-build tests use ordinary lobby controls and CDP touch input.
They never inject game state, save data or game time. This is browser touch
emulation, not a physical Android/iPhone run.

| Attempt | Passed | Failed | Evidence and interpretation |
| --- | ---: | ---: | --- |
| before-01 | 0 | 1 | Baseline south-east phone: hero hidden; expected reproduction failure. |
| after-01 | 7 | 1 | First fix run: a second screenshot caught an upgrade dialog after the saved screenshot. |
| after-02 | 8 | 0 | All corners in phone/narrow layouts; saved and analyzed screenshot is now identical. |
| controls-01 | 9 | 0 | Touch/cancel/resize plus existing lifecycle and missing-asset checks in three layouts. |
| after-03 | 7 | 1 | Added actual corner pixel assertions; all eight camera checks pass, but phone north-east exit waits behind a new upgrade modal and times out. |
| after-04 | 1 | 0 | Same phone north-east test passes after resolving visible choices before a bounded pause click. |
| Total executions | 32 | 3 | All 35 raw recordings retained, including failures. |

Latest result per distinct related case: **17 passed, 0 failed**. This is not a
claim that the entire gameplay suite passes. Earlier P2k fresh HP-death targets
remain three failures, with actual victory outcomes. The full suite was not
rerun for this rendering slice.

Reports are `evidence/P4a/<attempt>/results.json`. Raw video, screenshots and
failure context are in the matching `test-results/` folder. Failed after-03
cleanup originally masked the waiting action and omitted its timeline; its
saved `hero.json`, edge screenshot, failure context and 120-second recording
remain. Cleanup now writes the timeline before attempting browser detachment.

### What the checks establish

- 390 x 844 and 320 x 844, four corners each: natural diagonal movement reaches
  the core's 18-pixel world clamp. Two long gold boundary lines locate the actual
  corner within 3 pixels. Hero anchor is within 6 pixels of viewport center.
- The complete 66 x 81 sprite does not overlap HUD, vitals, route information,
  timed reward buttons or the touch control zone in these captured layouts.
- Two touch points move and cast together; dragging beyond the pad retains
  movement; touch cancellation returns the stick to zero.
- Paused resizes through 390 x 780, 844 x 390, 320 x 844 and 1280 x 720 preserve
  paused time, one correctly sized canvas, and a centered hero after resuming.
  This proves resize lifecycle, not landscape/short-phone HUD usability.
- Four entry/exit cycles per layout clear the canvas. Existing tests verify
  WebGL, pause/resume, simulated blur input clearing and missing-asset recovery.
- Successful natural runs and lifecycle checks report no runtime/asset errors.

## Verification and recordings

Root check -> smoke -> audit -> context -> archive:verify pass in order;
49/49 legacy baseline hashes pass. Vitest passes 946/946 in 24 files; app
typecheck and production build pass. Logs are root-gates.json and app-gates.json.
The existing Phaser chunk warning remains (1,429.70 kB / 377.35 kB gzip).

`recordings.json` records SHA-256, byte size, duration and successful full decode
for all 35 original WebM videos. The 12-second MP4 compares seconds 20-32 of
independent natural south-east phone runs (before-01 and after-03), at original
speed. It is a comparison excerpt, not a full-match or frame-synchronized replay.
The poster was visually checked: the old hero is clipped behind the lower-right
controls; the new hero is centered with the world boundary visible.
`corners.png` is the inspected eight-frame after-02 contact sheet.

Reproduce browser evidence with a NEW attempt name:

```powershell
cd apps/mobile-next
$env:P4A_ATTEMPT = 'new-corners'
npx playwright test --config playwright.p4a.config.ts camera.native.spec.ts --project phone --project narrow
```

Use camera-controls.native.spec.ts and lifecycle.spec.ts for related controls.
Existing attempt directories are rejected. `package-p4a-release.py --media`
creates the comparison and decodes raw recordings; `--release` requires a clean,
tagged checkout and the matching Render build. Python/Pillow and FFmpeg are
existing local evidence tools; no application dependency was added.

## Delivery and follow-up

Local assets are under `releases/mobile-next-p4a-20260909/`: MP4 comparison,
poster, all-recordings ZIP, allowlisted Render build ZIP, release notes and
SHA256SUMS.txt. ZIP entries carry a manifest and are checked after packaging.

GitHub/Render synchronization is currently blocked by external connection
failures, not awaiting user approval. Git/CLI GitHub requests fail with TLS
handshake/EOF; the selected browser cannot open the Render dashboard due to
ERR_QUIC_PROTOCOL_ERROR / ERR_CONNECTION_CLOSED. Direct and the existing local
proxy connection both fail. No credentials were requested and no service,
system proxy, certificate or TLS verification settings were changed.

Last recorded live runtime is 75e139b, deployment dep-dag058on74is73bukk40 on
2026-09-08. It was not reverified during this network failure. Resume the
authorized push/release and clean-cache deployment once reachable, then verify
all 51 HTTPS package hashes, public paths, both entries and natural browser
startup before reporting a new live version. See RENDER-DEPLOYMENT.md.

Next implementation slice: short portrait HUD/control spacing with natural
input evidence. Keep natural fresh HP-death acceptance separate. Physical
phones, performance, 30-minute endurance, other stages/modes, audio and PWA
remain open; this is not the full P4 or a replacement release.
