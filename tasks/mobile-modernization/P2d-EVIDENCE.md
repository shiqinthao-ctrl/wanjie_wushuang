# P2d first-stage combat

H001 actions, ST001-01 normal/elite waves, six prepared active skills and PET001
now run in the pure GameCore lifecycle. Phaser alone advances simulation. Vue
publishes movement/action commands and receives small UI snapshots at 10 Hz.
Legacy source and player saves are unchanged. No dependencies were added.

## Rule evidence

`capture-first-combat.mjs` captures the effective legacy configuration in an
isolated Chrome profile: 8 spawns, 3 actions, 12 skill constructions and 12 AI
steps. All AI positions, shots and player damage match, including ranged fire
after movement and contact distance sampled before movement. Eight normal/elite
spawns also match exactly in Chrome, including randomized affixes. Node's sort
comparator sequence differs from Chrome, so browser comparison remains required.
734 app tests pass, including the earlier growth/progression/damage oracles.

Movement, auto attack, hero skill/dodge, projectiles, fields, vortex, meteor,
pet, XP pickup, choice pause/resume and safety caps are connected. Tests cover
no repeated kill rewards, aura recovery, lifecycle action gates, frozen cooldowns,
immutable enemy affixes and delayed-ultimate cleanup on destroy.

Two explicit migration decisions: delayed ultimate waves use battle time so
pause/exit cannot leak attacks; combat entity budgets retain the legacy balanced
profile independent of future visual quality. Decorative particles do not consume
the rules RNG. Whole-run seeded equivalence is not asserted.

## Browser evidence

Production build tested in isolated Chrome at 1280x720, 390x844 and 320x844.
Nine checks pass: natural move/skill/dodge -> kills -> XP -> three-option choice
-> same-run resume; four enter/pause/exit cycles per viewport; missing-asset
recovery. Portrait combat uses multi-contact touch protocol, desktop uses keys.
No runtime state injection, debug action or clock acceleration is used.
No console errors or failed asset responses in successful runs. Screenshots
show visible crystals, enemy shots, readable HUD and separated touch controls.
These are browser-emulation results, not physical-phone or human-play acceptance.
Raw screenshots, input timeline attachments and HTML report are regenerated in
`apps/mobile-next/test-results` and `apps/mobile-next/playwright-report`.

Legacy check, smoke, audit, context, archive verification and 49 source hashes
pass. New strict types, tests, build and browser tests pass. Build still reports
the large lazy-loaded Phaser/battle chunk (about 372 KB gzip); no performance
gain is claimed.

## Remaining P2 work

Stage map/interactions, timed recovery/events/chests, evolution/fusion acquisition,
elite gear drops, original B001 at 270 seconds, Boss Loot priority and atomic
persistent settlement still need migration. The preview stops on death or at
360 seconds without awarding anything. It does not claim a stage victory.
Only H001/PET001 is accepted by the current combat slice. Original EN001 artwork
is reused for the three enemy AI types with shape cues; full presentation/audio
parity remains pending. P2 is not complete.

Reproduce: `npm run verify --prefix apps/mobile-next` and
`node tasks/mobile-modernization/verify-first-combat.mjs`.
