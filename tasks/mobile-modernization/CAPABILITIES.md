# Migration inventory

Source baseline: `3a7b9f4`. `baseline/source-manifest.json` records ordered
scripts, hashes and lexical definition chains. `runtime-oracle.json` records
actual final entry functions, first-stage contract and hero stats from isolated
Chrome. Lexical chains are navigation evidence, not a dependency graph.

## Verified correction to the proposal
ST001-01 already requires B001 at 270 seconds, within a 360-second limit,
including Boss Loot. Both source and an actual fresh-game browser capture agree.
Preserving the approved original objective therefore includes this existing Boss.
ST001-02 is the first no-Boss survival stage. Do not remove the ST001-01 Boss.

## Capability ownership and acceptance

| Existing capability / exhaustive ID source | New owner | Acceptance |
|---|---|---|
| 6 heroes: config.hero | core/growth, UI/hero | Each unlock, stats, skill, ult, identity |
| Active/passive skills, evolutions: config.skill/evolution/skillForms | core/skills | Damage, timing, targeting, evolution conditions |
| 12 stages: config.stage/storyEncounters/storyCurve | core/campaign | Original objective, unlock order, single/double Boss, no-Boss |
| Bosses: config.boss/bossInteractions | core/boss | Phase/telegraph/hit/death, no respawn, loot priority |
| Difficulty/director: runtime-oracle.difficulties | core/director | Spawn/stat curves, wave transitions, damage |
| Equipment instances/affixes/sets: config.gearSystem | core/gear | Equipped instance stats, drops, loot choice, salvage |
| Runes, pets, resonance: config.runePetSystem | core/growth/pets | All bonuses, casts, shields, no permanent slow |
| Hero levels/mastery/stars/awakening, talents and presets | core/growth | Cost, limits, final stats against oracle |
| Modes: config.mode/gameModes | core/modes | All mode goals/rewards; no story-star mutation |
| Daily mutators: systems/daily-mutators.js | core/modes | Deterministic daily selection, objectives/rewards |
| Move, auto attack, dodge, hero skill, ult, interact | core/input + Phaser | Simultaneous touch, cancellation, keyboard, foreground pause |
| Crystal pickup, XP, 3-choice upgrades | core/progression | 4/18 XP, 240/26px, 540px/s, caps, existing option authority |
| Events, chests, map interactions, rift | core/events | Choice ordering, cost, per-rift kill target, completion |
| Fresh/continue/three slots, unknown saved fields | persistence | Schema30 copy import/export, invalid import does not overwrite |
| Win/defeat/retry, progression and rewards | persistence/settlement | Atomic receipt; duplicate calls; zero-star loss; isolation |
| Pages: runtime-oracle.pages and index.html | Vue UI | Actual navigation/actions and responsive layout |
| 10 SVG files: source-manifest hashes + config.firstPlayableAssets | Phaser/assets | Same assets, stage loading, failure and release paths |
| Audio, particles, damage numbers, camera/minimap | presentation | Teardown; quality only changes visuals; rules unchanged |
| Offline/install/update (new requirement) | PWA | Scoped caches, complete downloads, lobby activation, rollback |

This table and the captured catalog enumerate migration scope, not implemented
parity. Exact rule bodies remain in the preserved source until independently
migrated and behavior-tested. No legacy wrapper runtime is permitted in the app.

## Devices and baseline
Desktop extraction used the Chrome version in source-manifest.json. It is not a
performance recording. Android model/OS/browser, iPhone model/iOS/browser,
30-minute runs, thermal/frame measurements, physical touch and HTTPS install
remain pending. No device or FPS values are invented.

## Reproduction
Run `node tasks/mobile-modernization/verify-baseline.mjs` to verify the immutable
source hashes and save contract. Capture is an explicit maintenance operation:
`node tasks/mobile-modernization/capture-baseline.mjs`; it uses the app's local
Playwright, or `MIGRATION_PLAYWRIGHT` pointing to an existing Playwright entry.
The capture opens a new temporary browser context and presses the new-game
button. It reads only that context and closes the browser in a finally block.
