# TASK.md - Mobile modernization / P2f save foundation

Status: complete. Approved roadmap: tasks/mobile-modernization/PLAN.md.

## Goal and scope
Build the isolated IndexedDB SaveRepository needed before first-stage merchant
spending and persistent rewards. Provide local slots, copy-only Schema30 JSON
import, retained original backups, export and receipt-based atomic mutations.
Connect visible save management and persisted preparation to the lobby. Unsupported
imported combat content stays preserved with a clear launch boundary.
Events/chests, evolution, B001/Boss Loot, settlement rules and PWA are later slices.

## Authorized dependencies
Current app dependencies remain authorized; native IndexedDB, no additions.
Allowed: apps/mobile-next source/tests; tasks/mobile-modernization evidence;
five handoff sections. Legacy runtime, keys and original saves stay unchanged.

## Acceptance
Validate Schema30 input without discarding unknown fields; reject malformed,
future-schema and oversized input without modifying existing slots. Retain exact
import source for export. Native-browser tests must prove transaction rollback,
duplicate receipts, concurrency, stale revision rejection and slot isolation.
Natural UI checks: create/select, reload, export, import, malformed-file feedback,
portrait layout and launch from supported saved preparation. Never auto-reset
on storage failure or fall back to an unsaved game silently.
Run legacy check -> smoke -> audit -> context -> archive:verify, baseline hashes,
then app typecheck/tests/build/browser. Update five handoff sections.

## Constraints
No public Debug UI, hidden state injection for natural acceptance, new content,
backend, old-save mutation, entry replacement or deployment. Synthetic storage
integration fixtures must be explicitly distinguished from gameplay evidence.
Physical-device performance and HTTPS installation remain pending.
