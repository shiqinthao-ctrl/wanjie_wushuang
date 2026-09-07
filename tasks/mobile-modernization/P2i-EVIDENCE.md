# P2i first Boss and loot

ST001-01 B001 appears at 270s with the effective director HP curve, original
three phases, movement, contact damage, circle/line/cone attacks, shield and
hero/skill/map damage rules. The effective normal HP at exactly 270s is
25047.959999999992, rather than the base 7000 multiplied only by three.

Elite drops share the run loot array. Boss defeat produces one automatic item
and a three-choice extra reward. Selection is single-use. The original
template/rarity/affix/UID RNG order is preserved. Pending choices use raw
template score; the selected reward receives its computed score.

The legacy wall-clock 180ms loot timer intentionally becomes 180ms of unpaused
battle time. There is no callback after exit. Loot blocks timed chests from
the moment of defeat, and pause resumes the same offer. Victory requires the
drop and selection, followed by the original 0.75s and 0.25s guards. A living
Boss at 360s times out. GameCore owns the state and Phaser the only frame loop.

## Evidence and review

The isolated Chrome oracle includes eight spawns, nine attacks, eight damage
cases, twelve seeded loot sequences and six completion scenarios. These are
synthetic fixtures, with timers suppressed and outcomes intercepted. Rule and
browser fixtures explicitly identify that boundary; production exports no
state-injection or debug interface.

Review covered collision order, ordinary-shot consumption before Boss checks,
Boss priority in hero targeting, radius and multiplier differences by attack,
map interaction selection, no respawn, stale/duplicate loot, pause/destroy and
timeout guards. Vue escapes item content; scene-owned sprites/warnings have no
independent timers. Existing rules, old entry/storage and dependencies remain
unchanged.

Strict types and 874 rule tests pass. Production build passes (373.48 KB gzip
for the lazy battle mount; the large-chunk warning remains). Legacy five gates,
30 archives and 49 baseline hashes pass. Twelve exact seeded Chrome loot
sequences and the native loot component passed in three layouts (six paths).
Natural Boss paths pass in all three layouts (14.6 minutes, one worker).
Each starts with a fresh save, uses keyboard or multi-touch movement/skills,
chooses upgrades/events/chests, reaches 270s without injected state or time,
observes the Boss health and attack cue, then pauses and resumes the same run.
Screenshots in `evidence/P2i/natural-boss-{desktop,phone,narrow}.png` were viewed;
Boss health/telegraphs and controls are visible, with no horizontal overflow.
The remaining 60 browser paths ran against the final production build with
three independent workers: 59 passed and the narrow chest path timed out.
Its inspected screenshot showed the normal level-7 choice at 01:03, full HP.
The test checked for a choice just before it appeared, then waited indefinitely
for the now-hidden movement pad. Bounded control lookups now return to dialog
handling on the next iteration. No gameplay or assertions changed. The narrow
path passed its focused rerun (1.7 minutes). All 63 distinct paths now have
passing evidence across the natural Boss run (3), regression run (59) and
corrected narrow chest rerun (1); this was not a single all-green suite run.
These are functional checks, not FPS/thermal measurements.
Synthetic loot screenshots in `evidence/P2i/synthetic-boss-loot-*.png` were
preserved and viewed in all three layouts.

The initial natural-path attempt was interrupted after a test synchronization
race: after clicking an asynchronous event choice, the test tried to click
again while the save completed. It now waits for that dialog to close.
Assertions and gameplay rules were not relaxed.

## Remaining boundary

Atomic settlement and natural full-stage victory/defeat/retry remain the next
slice; P2 is incomplete. Gear is run-local until settlement. Audio and full
content remain pending. Chrome phone emulation does not establish real-device,
thermal endurance or human-play acceptance. PWA, delivery and entry switching
remain later stages. No performance improvement or release is claimed.
