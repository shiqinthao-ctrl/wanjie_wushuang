# P2k fresh-preparation HP-death investigation

Status: investigation completed, 2026-09-08; fresh HP-death gate remains open.
Continues the open P2j gate after G3.
Baseline: 2f257c6174eed800531cd5a216f29ff3c40be2d1.

The acceptance profile is the unmodified freshSave.json, H001 / ST001-01 /
story / normal. Natural evidence may use visible controls, keyboard/touch,
rendered pixels and save export only. Preparation, mechanics, RNG and time are
not changed. The original fresh HP-death assertion remains mandatory.

## Investigation contract

Compare input strategies and identify HP loss/recovery mechanisms in separate
synthetic diagnostics. This does not establish browser acceptance or prove a
path impossible. Reproduce promising strategies through normal browser input.
Preserve successes and failures, annotate original videos, verify result
persistence and repeated-run isolation. Record exact verification outcomes.

## Initial observations

Previous corner input won at 286 seconds with 524/763 HP. The initial profile
has level-6 H001 and a lifesteal accessory. First-stage incoming damage is 0.44;
recovery at 75, 165, 255, 300 and 330 seconds restores 22% maximum HP. Boss
movement stops at 155 units and charges cross the viewport. These preserved
rules make passive standing/corner input a poor HP-death strategy. See
P2j-EVIDENCE.md for prior attempts and separate low-growth imported evidence.

## Completed investigation

The original 540-iteration helper bound treated each input iteration equally.
Boss pixel tracking uses 180 ms inputs rather than the 1-second normal inputs,
so it could stop before the six-minute objective. The helper now allows up to
620 seconds of wall time within its existing 680-second test timeout. It does
not accelerate game time. At entry, visible save export must equal the original
fresh fixture. At exit, the helper verifies the actual saved result and replay
before retaining the requested result and star assertions.

`boss-contact-01` has three failed target assertions, all expected
`本局生命耗尽` versus actual `黄巾巨将已击败`. The strategy stays in the corner
before the Boss, then follows rendered actor pixels to seek close contact.
It skips encounter purchases, selects the first upgrade option and does not
press active skills. Desktop uses keyboard; both phone layouts use CDP touch.
No battle state, random seed, preparation or clock is injected.

| Layout | Game seconds | Actual result | Last sampled HP | Saved/reloaded/replayed |
| --- | ---: | --- | --- | --- |
| 1280x720 | 292 | Victory, 3 stars, +756 gold | 634/763 at 04:50 | Passed |
| 390x844 | 297 | Victory, 3 stars, +756 gold | 637/763 at 04:52 | Passed |
| 320x844 | 311 | Victory, 3 stars, +756 gold | 754/763 at 05:09 | Passed |

HP values are the last sampled HUD values, not final-frame or minimum HP.
All three had zero recorded page/console/resource errors. Original failure
screenshots, assertions, input timelines, save exports and videos are retained.
The screenshot name `natural-defeat-result.png` reflects the requested test;
the recording viewer labels the actual outcome from the observed result.

## Import setup correction

`regression-natural-01` completed fresh victory and stationary timeout at all
three sizes (6 passes), but its three supplemental imports failed before battle.
SavePanel loads the slot list on mount and disables file input while busy.
Playwright's `setInputFiles` does not wait for enabled state. Entering the panel
immediately after the new initial export check exposed this timing window.
The helper now explicitly expects the input to be enabled before selecting the
file. This changes test actionability only; game UI and save rules are unchanged.
Original screenshots, videos and failure assertions remain in that attempt.
These setup failures have no combat input timeline and are not counted as
completed settlement recordings. The retry uses `regression-imported-02`.
All three retries passed natural-input HP-death, zero-star settlement, save
reload, replay and original-file preservation. The imported fixture remains
separate supplemental evidence and never replaces unchanged fresh preparation.

## Verification results

| Attempt / check | Passed | Failed | Meaning |
| --- | ---: | ---: | --- |
| boss-contact-01 | 0 | 3 | Fresh HP-death requested, actual victory; persistence/replay verified |
| regression-natural-01 | 6 | 3 | Fresh victory/timeout passed; imports failed during setup |
| regression-imported-02 | 3 | 0 | Enabled-input correction; imported HP-death and persistence passed |
| regression-native-01 | 42 | 0 | Save UI, lifecycle, atomicity, rollback, stale writes and touch transitions |
| Rules / storage | 946 | 0 | 42 rule suites |

Browser totals: 57 executed attempts, 51 passed and 6 failed. Three failed
imports were resolved by the separate retry. Across 54 distinct browser cases,
the latest outcomes are 51 passed and 3 failed fresh HP-death targets.
The 12 complete settlement recordings contain 9 passes and those 3 failures.
Raw failures are retained; `config-list-only` only lists cases and is excluded.
Native fault/state fixtures are synthetic, distinct from natural-input runs.
The full browser suite was not rerun because the required natural gate remains
open; no claim of complete green verification is made.

Root checks run in order: check, smoke, audit, context, archive:verify. All pass,
including 30 archive entries. The 49 legacy hashes, app typecheck and build pass.
No app runtime source, fresh fixture, dependency or lockfile changed. The existing
large Phaser chunk remains 1,429.18 kB (377.14 kB gzip); this is not measured FPS.

## Recording delivery and review

`evidence/P2k/index.html` selects all 12 original complete recordings, labels
requested versus actual results and provides estimated timeline jumps, speed
selection and original downloads. All 12 fully decode; result/contact sheets
were visually checked. The final viewer check at 1280x900, 390x844 and 320x844
passed 36 selections, playback/seek/speed checks and full-download SHA-256
comparisons, with no document overflow or recorded console/resource errors.
Final layout screenshots: `viewer-1788867961498/`; the earlier successful
viewer run remains preserved. Phone video height follows the source aspect
ratio, and the wide comparison table has a horizontal-scroll hint.

Code review confirmed that the helper still asserts the original requested
outcome and zero-star defeat, after gathering actual persistence evidence.
The package only deduplicates raw videos already copied into `videos/`;
the three failed import-setup originals and native attachments remain included.
No runtime source or dependency change and no new wrapper/debug UI were found.
The unresolved natural gate is explicit throughout the task, viewer and notes.

Version: annotated tag `mobile-next-p2k-20260908` on
`codex/mobile-web-modernization`. Release packaging requires a clean tagged
commit, verified viewer, complete video hashes and all five final root gates.
Each ZIP is checked by CRC and every member's SHA-256. GitHub asset digest and
remote ref verification are saved after upload under the ignored release folder.
The release is a development checkpoint; no main merge, deployment, legacy
entry switch, physical-device or PWA acceptance is included.

## Synthetic diagnostics

`diagnose-fresh-pressure.mjs` ran 54 separate direct-core simulations: six
strategies (stationary, inset, ranged-gap, ranged-contact, boss-contact,
boss-gap), seeds 123/456/789 and the three viewport sizes. It uses original
preparation, counts accepted HP loss, attack healing and scheduled recovery,
and asserts their accounting equals remaining HP. The recorded choice list
uses its own stated priority; these runs are not exact browser replays.

Results: 21 victories, 33 timeouts, zero HP-deaths. The lowest recorded HP
was 337.610747 (phone, boss-contact, seed 123); that run won at 289.2667 seconds
and ended with 337.977429 HP, after 998.667712 accepted damage, 127.896223 attack
healing and 445.838917 scheduled healing. These measurements explain survival
in the sampled strategies; they do not prove natural death is impossible.

Fresh fixture SHA-256:
`c4903f476644792538691fef91d9d8da168c312d0b6aaadd21a637c4fb72c685`.
Raw outputs: `evidence/P2k/synthetic-pressure-01/`.

## Reproduction

Run from the repository root for diagnostics; provide a new output folder:

```powershell
node tasks/mobile-modernization/diagnose-fresh-pressure.mjs tasks/mobile-modernization/evidence/P2k/synthetic-pressure-02
```

Run browser attempts from `apps/mobile-next`, always using a new attempt name:

```powershell
$env:P2K_ATTEMPT='boss-contact-02'
$env:FRESH_DEFEAT_STRATEGY='boss-contact'
npx playwright test tests/settlement.spec.ts --config=playwright.p2k.config.ts --grep 'natural corner-contact defeat'
```

For related natural regressions, select `natural complete|natural first-stage
timeout|supplemental imported`; for native regressions select
`settlement.native.spec.ts lifecycle.spec.ts saves.spec.ts`. Preserve the
original report whether the command succeeds or fails. A fresh attempt name
prevents Playwright from clearing earlier test output.
