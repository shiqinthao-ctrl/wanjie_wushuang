# TASK.md - V3.4.1 Mobile World Navigation and Objective Interaction / Slice 1

Status: implementation and required completion gates complete.

## Goal

Complete one bounded mobile navigation and interaction slice without changing combat balance or run authority.

- Expand the existing floating-joystick touch plane while preserving the current analog vector, movement speed, world size, camera, and Pointer Events ownership.
- Derive one navigation target from the nearest unused existing map interactable while the existing interaction objective is incomplete.
- Show the same target on the tactical minimap and mobile HUD with a readable direction and bucketed distance; make the existing interaction button visibly ready only inside the established interaction radius.
- Distinguish approaching a world edge from reaching it and show the direction back into the playable world.
- On the existing successful interaction path, refresh the existing objective projection immediately so `0/1` becomes `1/1` without a second objective or settlement path.

## Acceptance

- Focused guards first fail on the absent V3.4.1 contract, then pass after implementation.
- A read-only runtime projection selects the nearest unused interaction, reports direction/distance, and stops guiding after the existing interaction objective completes.
- The existing interaction function consumes exactly one nearby object, preserves its existing effect, and advances the existing objective to `1/1`; repeated input cannot consume it twice.
- Emulated `390x844` and `320x844` battle views have no horizontal overflow. Pointer movement can traverse toward the guided target, the existing mobile interaction button completes it, and edge feedback remains visible without blocking controls.
- Browser console errors and warnings remain zero. Physical-phone feel remains a separately reported acceptance risk unless a real device is tested.

## Preserve and exclude

Preserve Schema30, fresh chapter 0 stars, defeat 0 stars, non-story star isolation, one settlement per run, dual-Boss routing, V3.0 safety fixes, Boss Loot precedence, ordered scripts, existing saves, interaction effects, and interaction radius.

No backend/account/network service, auto-pathing, new map, new interactable, new objective authority, automatic interaction, dependency, public Debug UI, schema bump, second clock/settlement, or `_v341Old*` wrapper. Do not change attack, skills, damage, speed, collision, enemy density/AI, XP, drops, Boss parameters, stage length, `incoming:.44`, five `22%` recoveries, `telegraphScale:1.65`, `bossHp:3.00`, `bossAt:270`, or `duration:360`.

## Required completion gates

Run in order: `npm run check`, `npm run smoke`, `npm run audit`, `npm run context`, `npm run archive:verify`. Then update only the five rotating sections of `handoff/STATE.md`.
