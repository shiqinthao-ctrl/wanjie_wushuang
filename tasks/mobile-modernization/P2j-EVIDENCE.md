# P2j atomic settlement and retry

Status: verification in progress. This slice does not complete P3-P5.

## Implementation and rule evidence

GameCore captures one detached, recursively frozen final run record before
destruction. Final score, Boss count, damage and encounter history retain the
legacy frame positions. RunSession owns both event payments and final rewards,
using the original slot and one revision chain. SaveRepository commits the
updated slot and the settlement receipt in one native IndexedDB transaction.
Duplicate and concurrent requests return the receipt; retries after a lost
response do not issue rewards again. Revision conflicts do not overwrite a
newer save. Only H001/ST001/ST001-01/story/normal may settle in this slice.

The effective legacy finishRun oracle has eight isolated synthetic scenarios:
fresh defeat, three-star victory, exact 0.55 HP boundary, timeout with previous
stars, lower-star victory, talents/account level-up, account level 200 and
gear/rune/pet bonuses. Every case compares the whole resulting save and result,
including original rounding/order, mastery, XP, tokens, UID deduplication and
unknown fields. The capture intercepts presentation and persistence in an
isolated browser context; it is not natural gameplay evidence.

Result UI distinguishes saving, failed save/retry and committed rewards. Replay
destroys the old battle, reloads its original slot and mounts a new battle.
Review fixed an event-handler argument being passed as a replay flag and added
a failing-then-passing difficulty-change guard. No legacy rules, entry, storage,
archives or locked dependencies changed.

## Verification collected

- Legacy check, smoke, audit, context and archive verification pass again after
  the final handoff update; 30/30 archives, 49/49 baseline hashes and 6153 bytes
  of active context. Legacy sources, entry and archives are unchanged.
- Strict app types and 897/897 rule tests pass. Production build passes; the lazy
  battle mount is 374.28 KB gzip and still produces a large-chunk warning.
- Native browser fixtures after the touch fix: 27/27 paths pass across desktop,
  390x844 and 320x844 (10.1 seconds).
  Coverage includes duplicate/concurrent calls, aborts before/after receipt
  request success, lost response, stale revision, original-slot isolation,
  event-to-settlement revisions, unsupported mode/invalid drop and actual result
  component save-error/retry/replay controls.
- A held joystick release reproduced an unintended result exit in all three
  layouts. The pre-fix screenshots, error context and traces are preserved in
  evidence/P2j/failed-touch-*; the phone screenshot was viewed. RunResult now
  requires a pointer click to begin on the same enabled result button, while
  detail-zero keyboard/assistive activation remains available. The same failing
  test passes in all layouts; it also checks cancelled touch, a deliberate new
  touch, mouse click, Enter and Space. No timer or arbitrary input delay was added.
- Six synthetic result screenshots in evidence/P2j were preserved and viewed.
  Both mobile sizes fit; the desktop dialog scrolls internally to its actions.
- Affected regressions: 60/60 paths pass in 4.6 minutes across all three layouts
  (lifecycle, combat, map, save UI/native storage, events/native payments,
  chests and native Boss rules). This invocation exited successfully.

## Natural browser acceptance

The first event-selection attempt was interrupted after the test used an exact
accessible name although the button includes its description. The test now
waits for the async event dialog to close. That initial failure image was not
preserved.

The next desktop victory attempt reached the original 360-second timeout with
the Boss still alive. Zero-star rewards were saved. The test kept circling and
limited melee contact; its screenshot and error context are preserved as
failed-circling-timeout-desktop.png/.md. Standing without skills also reached
timeout (662/763 HP); its screenshot/context are preserved and viewed as
failed-standing-timeout-desktop.png/.md. Neither attempt passes victory or
HP-death acceptance.

Source inspection explains the contact problem: the Boss stops approaching at
155 units, outside the normal arc, and its charge can cross the viewport. The
revised test follows hero/Boss face colors in rendered screenshot pixels and
sends real movement/skill input. It never reads Phaser/Core state. Victory,
saved rewards, reload equality and same-stage replay now pass in all three sizes:

| Layout | Game seconds | Kills | Level | Stars | Gold award | Account XP | Mastery | Drops |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Desktop 1280x720 | 322 | 609 | 21 | 3 | 756 | 531 | 66 | 5 |
| Phone 390x844 | 285 | 555 | 21 | 3 | 756 | 505 | 62 | 6 |
| Narrow 320x844 | 302 | 589 | 21 | 3 | 756 | 543 | 65 | 9 |

Each path checks actual downloaded save values after replay/exit/reload, with
event purchases deducted, exactly one added run and persistent star/XP/loot
results. A second reload exports the identical save. No console/page/network
errors were recorded. Result screenshots for all three sizes were viewed;
Boss tracking screenshots are preserved. Desktop invocation: one victory pass,
one HP-death failure. Phone/narrow victory-only invocation: 2/2 pass in 5.4min.

The corner-contact HP-death attempt instead won automatically at 286 seconds,
524/763 HP, level 10 and 557 kills. Its screenshot and error context are kept as
failed-corner-won-desktop.png/.md; the screenshot was viewed. This is not a
passing defeat test. Both timeout attempts and the corner victory remain
separate evidence failures, with the HP-death assertion unchanged.

The dedicated timeout invocation passed desktop and narrow, but failed phone:
the result committed +123 gold and immediately exited without an intentional
result action. The phone screenshot/context and all three input timelines are
preserved; both successful timeout result screenshots were viewed. This led
to the held-joystick reproduction and fix above. The rebuilt app subsequently
passed all three natural timeout paths; the result remains visible after the
held touch is released, then deliberate replay/exit, reload and save equality
pass. Victory reruns against the rebuilt app also passed all three layouts
(3/3 in 5.2 minutes), including Boss Loot, committed rewards, same-slot replay,
reload and save equality:

| Layout | Seconds | Kills | Level | Stars | Gold | Account XP | Mastery | Drops |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Desktop | 292 | 567 | 20 | 3 | 936 | 483 | 62 | 6 |
| Phone | 284 | 562 | 20 | 3 | 936 | 473 | 62 | 4 |
| Narrow | 293 | 568 | 21 | 3 | 936 | 499 | 63 | 3 |

All three result screenshots were viewed. The screenshots, visible Boss
tracking images, input timelines and passing run marker are preserved in
`evidence/P2j/post-touch-victory/`. No page, console or HTTP errors were recorded.
These are functional Chrome checks with natural input, not physical-phone or
performance acceptance.

Synthetic input diagnostics tested six strategies with three deterministic
seeds. All 18 survived with either victory or timeout. Prioritizing the least
offensive available passives and rerunning the 18 scenarios also produced no
HP-death. These diagnostics advance the core directly and are not browser
acceptance. The initial save has level-6 H001, approximately 763 HP, a lifesteal
accessory, automatic attacks and scheduled first-stage recovery; first-stage
incoming damage is multiplied by 0.44. These are preserved original rules,
not a claimed proof that HP-death is impossible.

Additional synthetic diagnostics covered the other three corners, two circle
sizes, and circling then stopping at 120/240/300 seconds, each with three seeds.
All 24 survived (9 victories, 15 timeouts); the minimum sampled HP was about
379. Results are in evidence/P2j/synthetic-swarm-strategies.jsonl. Together
with earlier diagnostics this still does not prove that HP-death is impossible.

A separate synthetic low-growth profile (H001 level 1/mastery 0, no equipped
instances, runes or prepared skills; PET001 retained) was tested with the same
18 strategy/seed combinations. Seven reached HP-death; all three corner runs
ended at approximately 285-294 seconds. Exact results are preserved in
evidence/P2j/synthetic-low-growth-strategies.jsonl. These are direct core
diagnostics, not fresh-save or natural browser acceptance. A supplemental
browser test imports this profile through the visible file UI and keeps the
original slot and exact import backup checks. All three layouts passed the
natural-input HP-death, zero-star settlement, save/reload and replay path.

The combined post-fix timeout/import invocation passed 6/6 in 12.4 minutes:

| Profile / outcome | Layout | Seconds | Kills | Level | Stars | Gold | Account XP | Mastery | Drops |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Fresh / timeout | Desktop | 360 | 641 | 13 | 0 | 123 | 395 | 58 | 2 |
| Fresh / timeout | Phone | 360 | 650 | 10 | 0 | 123 | 412 | 58 | 4 |
| Fresh / timeout | Narrow | 360 | 645 | 15 | 0 | 123 | 355 | 58 | 4 |
| Imported low-growth / HP-death | Desktop | 291 | 400 | 16 | 0 | 105 | 331 | 41 | 4 |
| Imported low-growth / HP-death | Phone | 289 | 375 | 15 | 0 | 98 | 312 | 40 | 2 |
| Imported low-growth / HP-death | Narrow | 291 | 409 | 15 | 0 | 94 | 301 | 41 | 1 |

All six result screenshots were viewed. Screenshots, input timelines, imported
fixtures and the passing run marker are preserved in
`evidence/P2j/post-touch-timeout-import/`. No page, console or HTTP errors were
recorded. Imported runs retained the original import backup and left the
separate fresh slot unchanged. These three imported paths do not replace the
fresh-profile HP-death gate.

Long natural tests disable Playwright traces because screenshot pixel data
otherwise appears in evaluate arguments and creates oversized traces. Explicit
screenshots and input timeline attachments remain; subsequent invocations also
write the timeline as a separate JSON file. This changes test reporting only.

Fresh-save HP-death remains pending. No answer has been received to the
question about using clearly labeled imported low-growth HP-death evidence
alongside the outstanding fresh-save gap. The original assertion is retained;
the whole P2j slice and full verify command are not reported as passing.
All browser checks are functional checks, not physical-phone, thermal, FPS,
human-play or installation acceptance. No rule, balance or timer changed.

## 2026-09-08 G1 continuation

The user subsequently requested more heroes, run evolution and branching skill
bonds. G1 proceeds under `EVOLUTION.md` while carrying this P2j acceptance gap.
This continuation is not a waiver or a replacement of fresh-preparation
HP-death evidence. The original assertion remains; the full app verification
suite is still not reported as green. See `G1-EVIDENCE.md` for the new slice.
