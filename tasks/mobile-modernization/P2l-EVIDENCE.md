# P2l fresh pressure and settlement evidence

Status: investigation and GitHub delivery complete; fresh death and phone
timeout targets remain open, 2026-09-09.
Source baseline: `06daa60e640469d0512fb69c49e86699bef462b4`.
Runtime baseline: P4c, `649b0b54e16b0016de9ba88dd148516aefd0da8b`.

## Outcome and scope

The additional fresh HP-death strategy still wins at all three sizes. The
original requested death assertion fails after actual rewards, reload and
retry have been verified. No demonstrated migration defect justifies changing
combat rules. This is an evidence-only checkpoint, not a new playable feature
or a claim that the full browser suite is green.

Changes are limited to diagnostic strategies/accounting, natural-input test
observations, an isolated recording configuration and evidence packaging.
Runtime code, dependency versions, the legacy entry and fresh preparation are
unchanged. Fresh fixture SHA-256 remains:
`c4903f476644792538691fef91d9d8da168c312d0b6aaadd21a637c4fb72c685`.

## Synthetic pressure investigation

Direct GameCore simulations use the original normalized preparation, 60 Hz
advance, seeds 123/456/789 and desktop 1280x720, phone 390x844, narrow 320x844.
They record incoming HP loss, attack healing, scheduled healing, accepted and
ignored hits, upgrade choices, minimum HP/time and a balanced HP ledger.
The first launch stopped before any simulation because the parent evidence
directory did not exist; creating that parent resolved the setup error. No
attempt was overwritten.

| Attempt | Strategy / upgrade policy | Cases | Victory | Timeout | HP death | Lowest HP |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| contact-first-01 | Nearest/elite contact; first option | 18 | 1 | 17 | 0 | 686.297 |
| boss-first-01 | Boss contact/gap; first option | 18 | 18 | 0 | 0 | 484.917 |
| inset-priority-01 | Leave corner then contact Boss; priority | 9 | 9 | 0 | 0 | 288.942 |
| Total | | 45 | 28 | 17 | 0 | 288.942 |

Chasing ordinary enemies activates attacks and lifesteal, reducing pressure.
The inset/Boss path produced the lowest simulated HP and informed the browser
attempt. These bounded simulations do not establish natural acceptance or
prove death impossible. They are not exact browser replays: simulation exits
the corner at 12 seconds and stops the inward movement at 13.5 seconds; the
browser uses visible whole-second clock values and stops at 14 seconds. It
also has unseeded upgrades and pixel tracking, instead of direct coordinates.

## Unchanged-fresh browser attempt

`inset-contact-01` starts by exporting the visible save UI and comparing it to
the unchanged fixture. It uses H001 / ST001-01 / story / normal. Input moves
up-left until 12 seconds, down-right until 14 seconds, then stays still until
the Boss. It follows rendered hero/Boss pixels for close contact, declines
encounter purchases, selects visible upgrades by the stated priority, and
does not use active skills. Desktop uses keyboard; phones use touch input.
The run clock, RNG, preparation and battle state are never injected.

| Layout | Game seconds | Actual result | Sampled minimum HUD HP | Persistence / retry |
| --- | ---: | --- | --- | --- |
| 1280x720 | 336 | Victory, 3 stars, +756 gold | 591 at 05:22 | Passed |
| 390x844 | 329 | Victory, 3 stars, +756 gold | 448 at 05:28 | Passed |
| 320x844 | 314 | Victory, 3 stars, +756 gold | 522 at 04:52 | Passed |

HUD HP is rounded upward and sampled at input intervals; these values are not
frame-exact minima. Upgrade offers and selections are retained. All three
recorded zero page/console/HTTP errors. The test still expects `本局生命耗尽`
and zero stars; it never accepts victory as a passing death target. Screenshot
names follow the requested test; release media explicitly names the actual
victory. Each actual result saved one set of rewards, started a fresh retry,
and survived repeated reload/export equality checks.

## Verification

| Browser group | Passed | Failed target | Result |
| --- | ---: | ---: | --- |
| Unchanged-fresh HP death | 0 | 3 | All three actual victories, retained as failures |
| Natural victory | 3 | 0 | Victory at 302 / 287 / 289 game seconds |
| Natural stationary timeout | 2 | 1 | Desktop/narrow timeout; phone wins at 350 seconds |
| Imported low-growth HP death | 3 | 0 | Death at 289 / 220 / 230 game seconds |
| Related native regressions | 42 | 0 | Settlement, lifecycle, saves and touch |
| Total executions | 50 | 4 | No retries, skipped cases or flaky-pass classification |

Time triplets above follow desktop / phone / narrow order. The phone timeout
failure reveals another unreliable natural-input assumption: standing still
can defeat the Boss before 360 seconds. The test expected `首战时限已到` but
observed victory, three stars and +756 gold. Desktop and narrow timed out at
360 seconds, with zero stars and +123 gold. This is not evidence of a runtime
settlement defect, and neither RNG nor game balance was changed to force it.

All 12 natural runs verified their actual rewards, single settlement, reload
and fresh retry, with no recorded page/console/HTTP errors. All three imported
low-growth deaths received zero stars; that distinct preparation does not
close the original unchanged-fresh gate. Requested title/star assertions stay
in place. The entire browser suite was not rerun or declared green.

946/946 rule tests, app types/build, five ordered root checks and 49/49 legacy
baseline hashes pass. Rebuilt mobile assets match all 13 corresponding files
in the retained P4c runtime manifest. Phaser still emits its large-chunk
warning (1,429.70 kB, 377.35 kB gzip); this is not a phone-performance result.

Synthetic native cases cover concurrent/duplicate settlement, aborted
transactions, lost responses, stale writers, storage denial, invalid rewards
and held-touch transitions. Natural supplemental low-growth imports remain
separate from unchanged-fresh acceptance. Failure originals are preserved.

`evidence/P2l/settlement-outcomes.json` contains all 12 compact outcomes,
sampled HP and upgrade choices; raw per-input timelines remain in the release
ZIP. The three report folders preserve every execution and failure.

## Recordings and release artifacts

All 54 original browser recordings, including all four failed targets, are
retained and fully decoded. Two full normal-speed MP4 exports show the fresh
phone attempt that actually wins and the separate imported low-growth phone
death. They include setup, play, settlement and retry without edited cuts or
accelerated game time. `settlement-comparison.png` labels their actual results.
`recordings.json` records source paths, durations, hashes and decode checks.
The full fresh phone MP4 is 347.88 seconds (5:47.88); the imported low-growth
MP4 is 230.16 seconds (3:50.16). Result screenshots and sampled frames at
setup/play/end were visually checked for readable, complete portrait output.

Media packaging initially rejected the misspelled Python encoding name
`utf8-sig`, after decoding the originals and before producing an MP4. Changing
that helper to `utf-8-sig` fixed the packaging failure; no browser run was
repeated or original evidence overwritten.

Tag: `mobile-next-p2l-20260909`. The evidence-only prerelease contains six
assets: complete evidence ZIP, two MP4s, result comparison, these release notes
and SHA256SUMS. The ZIP is checked for CRC and each member's SHA-256. Remote
size/digest checks are required before and after publication. The playable
package and immutable P4c tag stay unchanged.

### Delivery verification

Published [GitHub prerelease](https://github.com/shiqinthao-ctrl/wanjie_wushuang/releases/tag/mobile-next-p2l-20260909)
from commit `fe2220c7ea6b2626b3764b4630ade1fda1c110bf`. All six remote assets
match local sizes and SHA-256 digests, verified before and after publication
at 2026-09-09 06:22 UTC. Release ID: `385268305`. The evidence ZIP is
480,850,849 bytes and passed CRC plus every member's SHA-256 check.
See `evidence/P2l/github-verification.json` for the public asset URLs/digests.

The branch and annotated tag were pushed together; remote tag/branch matched
the source commit. Main remains `30d05f291a4860f653a7d7a1ecbbf5015b2145fc`.
This follow-up records delivery evidence without moving the release tag or
replacing any asset. Render remains on the previously verified P4c deployment.

## Live runtime and rollback

On 2026-09-09 the live HTTPS package passed all 51 file hashes, both entries,
legacy baseline matching and repository-only path exclusions. The dashboard
shows P4c commit `649b0b54e16b0016de9ba88dd148516aefd0da8b`, Live deployment
`dep-dagdr1142hec73brst60`, and auto-deploy Off. Build command, branch and
`dist/render` publish directory retain their verified settings.

This batch has no runtime/package change, so Render retains that deployment.
No redundant deploy, rollback, main merge or legacy entrance switch is needed.
Previous runtime: `4c371250af4822575c230bf47063e35510b4a168`, deployment
`dep-dagd7tp42hec73bpec70`. Existing immutable tags/assets remain available.

## Next bounded task

Stop repeating the same fresh-death hypothesis without new evidence. Carry
this gate forward explicitly. The next gameplay slice can add one cross-element
evolution route to an existing starter, with one skill branch and a matching
bond, within the opt-in evolution journey. Write its exact behavior and natural
run acceptance into TASK.md before implementation. Keep legacy classic rules
and the unresolved original fresh-death assertion intact.

Physical phones, thermal/performance/endurance, full content parity, sound and
PWA/offline remain separate acceptance work. Browser sizes are emulation only.

## Reproduction

From the repository root, use a new output directory:

```powershell
$env:PRESSURE_STRATEGIES='inset-boss-contact'
$env:PRESSURE_CHOICES='priority'
node tasks/mobile-modernization/diagnose-fresh-pressure.mjs tasks/mobile-modernization/evidence/P2l/inset-priority-02
```

From `apps/mobile-next`, use a new P2L_ATTEMPT for each command:

```powershell
$env:P2L_ATTEMPT='inset-contact-02'
$env:FRESH_DEFEAT_STRATEGY='inset-boss-contact'
npx playwright test tests/settlement.spec.ts --config=playwright.p2l.config.ts --grep 'natural corner-contact defeat'
```

The target exits nonzero when it wins instead of dying. For the separate
regression set, use grep `natural complete|natural first-stage timeout|supplemental imported`.
Native regressions use `tests/settlement.native.spec.ts tests/lifecycle.spec.ts tests/saves.spec.ts`.
The P2l config refuses existing result folders and uses isolated port 4188.
