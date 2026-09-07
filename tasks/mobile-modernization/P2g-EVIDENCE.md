# P2g first-stage encounters

ST001-01 opens merchant or gold-chest choices once at 45s and 150s, after
pending level choices. Gold gear, owned-skill upgrades, costs and healing match
the isolated legacy oracle. Event gear remains run-local until settlement.

The effective H001 dedicated basic attack ignores legacy shopBuff. Synthetic
Chrome calls to the actual legacy shootAuto produced identical damage
318.80895317107206 for buff 0, .18 and .36. The purchase explains this behavior;
no balance adjustment was introduced.

## Persistence and interruption

EventSession pins the original slot, revision and failed selection. Currency
and a per-run/per-event receipt commit in the same IndexedDB transaction before
ephemeral effects apply. Duplicates, concurrent submissions and retries cannot
award twice. A lost commit response can recover from its receipt; if another
writer has subsequently advanced the slot, the stale run remains interrupted.
Switching the active slot elsewhere does not redirect this run's transaction.
Background pause survives write completion and requires explicit resume.

## Evidence

Legacy five gates, 30/30 archives, 49/49 baseline hashes, strict app types,
805/805 rule tests, production build and 48/48 Chrome browser paths passed.
Desktop 1280x720, phone emulation 390x844 and narrow 320x844 each naturally
reached 45s with keyboard or actual touch contacts, chose a visible reward,
resumed, returned to the lobby and reloaded the persisted gold amount.

Separate synthetic browser fixtures verify transaction abort/retry, lost
response, stale revision and exact legacy RNG/drop/upgrade output. The visible
storage-error test uses natural combat but injects a storage abort and is
labeled synthetic. It is not ordinary no-fault gameplay acceptance.

The legacy random sort comparator can order options differently in Node and
Chrome. Node checks the owned-upgrade invariants; the Chrome fixture checks the
exact legacy skills/passives/drop and RNG consumption. The comparator is
preserved. Narrow natural-choice and save-error screenshots were viewed; text
and both recovery actions remain visible without horizontal overflow.

## Boundaries

P2 still needs timed chests/evolution, original B001/Boss Loot and atomic
settlement. Full content/audio, same-origin import discovery, physical phones,
thermal endurance and PWA remain pending. Emulated sizes are not real-device
acceptance. Legacy code/entry/saves and dependencies are unchanged.
Main JS is 40.01 KB gzip; lazy battle mount 371.00 KB gzip. The existing bundle
warning remains; no measured performance improvement or release is claimed.
