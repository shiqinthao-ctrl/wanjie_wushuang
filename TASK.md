# TASK.md - V3.4.0 Complete Playable Combat Loop Foundation

Status: implementation and final release gates complete.

## Goal and delivered behavior

Turn combat into a coherent replayable browser-game loop without numerical rebalance.

- Persistent world coordinates, bounded follow-camera look-ahead, edge feedback, and shared keyboard/floating-joystick movement.
- Tactical minimap projects player, viewport, live Boss, unused interaction, and objective from existing run state only.
- Hero preview is non-destructive. Explicit confirmation retains a compatible build or applies the recommended preset, then returns to one deployment summary.
- One primary and up to two contextual objectives use existing run events only.
- Three once-per-run timed rewards expose locked/ready/choosing/claimed states, pause through the existing choice UI, and reject repeated claims.
- Choice cards show category, level change, effect, and synergy. Result shows objectives, rewards, hero/build context, and replay guidance without extra settlement.
- Boss Loot remains authoritative before victory settlement.

## Preserve and exclude

Preserve Schema30, fresh chapter 0 stars, defeat 0 stars, non-story star isolation, one settlement per run, dual-Boss routing, V3.0 fixes, ordered scripts, and existing saves.

No backend/account/network service, login/offline/calendar reward, gacha, monetization, multiplayer, dependency, public Debug UI, second clock/settlement, new stage/enemy/interactable, schema bump, or `_v34Old*` wrapper. Do not change attack, skills, damage, speed, collision, enemy density/AI, XP, drops, Boss parameters, stage length, `incoming:.44`, five `22%` recoveries, `telegraphScale:1.65`, `bossHp:3.00`, `bossAt:270`, or `duration:360`.

## Verification record

- RED: focused guards first covered world/camera policy, joystick lifecycle, minimap and deployment projections, preview/build confirmation, objectives, reward idempotency, choice copy, Boss-loot precedence, containment, constants, and script order; the new contract was absent before implementation.
- GREEN: focused smoke/audit guards cover those contracts and prove read-only projections. The final ordered `check`, `smoke`, `audit`, `context`, and `archive:verify` gates pass.
- Desktop `1280x720` completed `home -> mission -> hero/build confirmation -> briefing -> battle -> timed reward -> B001 -> Boss Loot -> Result`. Result: `04:56`, 542 kills, 3 stars, `+756` gold, Boss Loot `1/1`, and no repeated settlement after waiting.
- Timed rewards reached all four states; rapid repeated input did not duplicate a claim; Boss Loot preceded the third milestone.
- Emulated `390x844` and `320x844` had no horizontal overflow. Minimap, objectives, joystick, actions, pause, upgrade, reward, and Boss-Loot overlays stayed usable. Browser warnings/errors: 0.
- Normal touch movement reached an interaction radius and enabled interaction, but did not complete the recorded map interaction.

## Remaining gap and release rule

Physical-phone feel, sustained world-edge traversal, a normal mobile interaction from `0/1` to `1/1`, and five-route human play acceptance remain unverified. Emulation is not physical-device acceptance.

Before release run, in order: `npm run check`, `npm run smoke`, `npm run audit`, `npm run context`, `npm run archive:verify`. Update only the five rotating sections of `handoff/STATE.md`; commit, tag `v3.4.0`, push only to an existing writable GitHub repository, and verify remote branch/tag SHAs.
