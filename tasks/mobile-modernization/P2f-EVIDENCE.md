# P2f isolated save foundation

Native IndexedDB owns mobile slots, active selection, import originals and
operation receipts in a separate database. No dependency or legacy-key changes.
Merchant persistence requires this foundation before the event migration slice.

## Storage contract

Schema30 JSON import validates known fields, size, depth, unsafe property names
and finite numbers without merging defaults or discarding unknown content.
Unsupported hero/stage/mode/difficulty/loadout content remains stored/exportable;
the lobby explains the preview boundary and prevents unsupported launches.
Imports always create a new slot and preserve exact original text, including BOM.
This is validated JSON copy import, not a claim of every historical save variant
or automatic discovery of same-origin legacy keys.

`transactOnce` commits save revision and operation receipt atomically. New stale
operations fail; duplicate receipts return their original result. Reducers are
synchronous. Reducer exceptions, invalid data and uncloneable receipts abort
the transaction. This primitive is not the final settlement rule implementation.

## Verification

Twenty-one Schema30 tests include fresh zero-star content, unknown-field
preservation, malformed/future/oversized/deep input and preview boundaries.
Six newly written boundary tests first reproduced silent unsupported-preparation
fallbacks, then passed with explicit launch blocking.

Synthetic native-browser storage fixtures exercise concurrent connections and
two actual pages, duplicate receipts, stale revisions, rollback and retry,
original text, independent slots and reopen selection. Fixtures are bundled in
test memory only. Storage-denied fault injection checks visible retry and that
an unsaved run cannot start; it is not natural gameplay evidence.

Natural UI: create a slot, export its actual content, import that export, compare
the retained original, reject malformed input without adding a slot, switch,
reload, enter the battle and refresh back to the saved lobby. A separate visible
file-input fixture checks unsupported difficulty and exact BOM export. The 320px
save-panel screenshot was viewed; no horizontal overflow or UI path errors.

Legacy five gates, 30/30 archives and all 49 baseline hashes passed. App strict
types, 775/775 tests, production build and all 30/30 browser paths passed.
This is isolated Chrome desktop/phone emulation, not physical-phone acceptance.

## Remaining work

First-stage events/chests, gear reward generation, evolution, B001/Boss Loot and
atomic settlement rules are still pending. Full content, audio, PWA, physical
Android/iPhone and thermal/endurance acceptance remain later requirements.
Main bundle is about 40 KB gzip; lazy battle bundle about 373 KB gzip, with the
existing size warning retained. No measured performance gain is claimed.
