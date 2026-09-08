# G3 combat readability and route decisions - evidence

Date: 2026-09-08. Source baseline checkpoint: `0fc637c`.
Legacy reference: `3a7b9f4`; all 49 baseline hashes remain unchanged.
Scope and exclusions are in `G3.md`. Development preview, not full parity.

## Implemented behavior

- Ten branches explain playstyle, tradeoff and the excluded alternative.
  Later upgrades retain the selected branch's description.
- Bond hints name actual positive-level owned skills and missing candidates.
  Acquiring a skill previews which bonds advance or activate.
- Lightning paths copy actual hit coordinates after the unchanged damage loop.
  Frost fields retain boundaries and lifetime arcs; instant bursts and summon
  attacks have different marks. Guards use square shields, hunters dual blades.
- The pause-menu toggle clears short-lived effects only. Its bounded 40-effect
  timeline uses simulation time and has no route back into combat rules.
  Enemy shots and experience pickups draw above cosmetic effects.

## Automated checks

`evidence/G3/checks.json` records the ordered legacy gates, baseline verification,
app typecheck, rules and build. Rules: 946 passed, zero failed/skipped, 24 files.
The additional nine cases cover copied hit paths, misses, area-only lightning,
unchanged combat outcomes with/without event consumption, effect lifecycle,
owned/missing skills, route alternatives and upgrade/bond choice guidance.

Final affected-browser result is recorded in `evidence/G3/regressions.json`.
Its scope is 87 cases across desktop, phone and narrow Chrome projects:
84 affected/native cases plus three original G1 natural starter flows.
Synthetic fixtures explicitly cover storage failures, concurrent receipts,
stale runs, Boss Loot priority, settlement/replay and held-touch transitions;
they are not represented as 87 complete natural games.

## Delivered natural-input recordings

| Route | Viewport | Selected attempt | Verified outcome |
|---|---|---|---|
| Frostlord / shatter | 1280x720 | alternates-02 desktop | Full victory: 557 kills, level 18, 284 battle seconds, 3 stars; Boss Loot, saved reward, replay and refresh persistence |
| Thunderlord / thunderstrike | 390x844 touch | alternates-02 phone | Named branch, superconduct bond, effects toggle, pause, exit and reset |
| Beastlord / hunter | 320x844 touch | narrow-03 | Winter-legion bond, follower combat, pause, exit and reset |
| Beastlord / guard | 320x844 touch | guard-03 | Winter-legion bond, stationary combat, pause, exit and reset |

All four selected runs use visible choices and keyboard/CDP multi-touch input.
No RNG seed, speedup, HP/XP/time mutation or hidden game-state injection.
Each asserts zero browser/console/resource errors. Video durations include
choice/guide pauses, so they differ from battle time. The game has no audio yet.

All attempts are retained locally. `attempts.json` reports six recording batches:
the pre-layout alternates batch passed 3/3; the final alternates batch passed
desktop/phone and failed narrow because the target bond was not obtained within
the unchanged budget. Narrow-03 passed. Guard-01 timed out when an upgrade dialog
blocked the helper's final Pause click. The helper now finishes pending dialogs
before pausing. Guard-02 obtained frost only at the end of its budget and failed
the required guide assertion. Guard-03 passed without further code changes.
Thus the selected delivery is 4/4, while all recording attempts total 7 passes
and 3 failures. The assertions and budgets were retained; no all-attempts-green
claim is made. Raw failed videos remain local; their result JSON is packaged.

## Visual and artifact inspection

Decoded frames actually viewed: phone lightning at 25.6 seconds; desktop frost
boundary/lifetime and bursts at 164-167 seconds; narrow hunter at 88-91 seconds;
guard square shields at 205 seconds. Route cards, named bond conditions and
the desktop victory screen were also inspected. Originals and inspection
contact sheets remain under `evidence/G3/inspection/` and raw test folders.

`build-g3-report.mjs` selects only individually passing runs, fully decodes all
four videos, records SHA-256/durations and generates a timestamped HTML player.
`verify-g3-viewer.mjs` checks all four videos at three layouts (12 playback/seek/
speed checks), original download hashes, overflow and browser/resource errors.
The first viewer attempt exposed missing byte-range support in Python's simple
HTTP server, causing seeks to restart at zero. Its failure record is retained.
`serve-g3-report.mjs` now provides a loopback-only, range-capable viewer server;
its test verifies partial content, invalid ranges and root/symlink boundaries.
Run from the repository root:
`node tasks/mobile-modernization/serve-g3-report.mjs tasks/mobile-modernization/evidence/G3`.
Open `http://127.0.0.1:4190/`. The ZIP includes this server as `serve-report.mjs`.
See `viewer-check.json`. The package tool verifies every ZIP entry and embeds
the tag, commit and per-file hashes in `MANIFEST.json`.

## Limits and next work

- P2j unchanged fresh-preparation natural HP-death remains an open acceptance
  gap. Imported-save evidence is supplemental. Full `npm run verify` is not green.
- These are Chrome viewport/touch emulations, not Android/iPhone acceptance.
- At map edges, some summons approach the bottom controls in narrow portrait;
  camera framing and combat readability need physical-device feedback in P4.
- No balance, 30-minute endurance or performance target acceptance. The Phaser
  bundle still emits the existing >500 kB chunk warning.
- Full content/modes, audio, PWA/offline and legacy entry replacement remain open.

Delivery version: `mobile-next-g3-20260908`. Release assets include the standalone
recording viewer, preview build, release notes, checksums and four original videos.
Post-upload branch/tag/asset verification is kept in the ignored release folder.
