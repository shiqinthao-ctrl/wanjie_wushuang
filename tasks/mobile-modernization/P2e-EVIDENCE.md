# P2e first-stage map

Six original ST001-01 map objects, fireline hazards and five timed recoveries
are connected to the existing GameCore. No dependency or legacy runtime changes.
New map rules and Phaser presentation have separate modules; Vue only receives
the nearby target, direction/distance, one-use progress and feedback.

## Rule evidence

`capture-first-map.mjs` captures effective legacy functions in an isolated Chrome
profile: six object positions, six interaction scenarios, four hazard boundaries
and eight recovery steps. Synthetic fixtures are distinct from gameplay evidence.

Twenty tests cover all five interaction types, strict barrel radius, elite-first
mechanism ordering, the inclusive 74-unit use radius, one-use rewards, supply XP
and choice priority, healing cap, overdue recovery order, lethal damage before
recovery, hazard suppression (including its expiry frame), final fireline damage,
read-only render snapshots and destroy cleanup. The GameCore choice/death tests
explicitly use synthetic unit fixtures; no such state writes exist in browser tests.

Map hazards run after hostile shots and before director/death checks. Recovery
runs after the hero/skill/pet update, only while the run remains active. Existing
invulnerability and incoming-damage math stay authoritative. Map gold remains
within the run; there is no persistent reward before the settlement slice.

## Browser evidence

The targeted three-size Chrome suite passes at 1280x720, 390x844 and 320x844:
visible route -> keyboard or touch movement -> ready prompt -> use barrel ->
completion feedback -> disabled repeated use. No time acceleration, runtime
state injection or hidden controls. No console/page/asset errors or horizontal
overflow. Narrow ready-state and phone completed-state screenshots were viewed.
Labels, HP/XP, route and four action buttons remain readable and separated.

Artifacts regenerate in `apps/mobile-next/test-results` and `playwright-report`.
This is browser emulation, not real-phone or human-play acceptance.

## Final checks

Legacy check, smoke, audit, context and archive:verify passed (30/30 archives).
All 49 baseline hashes match. App strict types, 754/754 rule tests, production
build and all 12/12 browser paths passed. Final context packet is 5222 bytes.
The lazy battle chunk is about 373 KB gzip.
No measured speedup is claimed.

## Remaining dependencies

Events, timed chests, gear drops, evolution/fusion, original B001 and Boss Loot,
persistent atomic settlement and full-stage acceptance remain required for P2.
Boss barrel/mechanism damage and clearing Boss traps must join this map module
when those entities exist; they are not silently represented by normal enemies.
Physical Android/iPhone tests, audio, full content, storage and PWA remain pending.
