# TASK.md - V3.4.2 Combat Growth Pickup Loop / Slice 1

Status: implementation and required completion gates complete.

## Goal

Complete one bounded combat-growth feedback slice inspired by the readable risk-and-reward loop shared by survivor action games, without changing combat balance or run authority.

- Enemy defeat creates one collectible experience crystal instead of awarding XP immediately.
- Experience crystals remain in the world, begin homing only near the player, and award their exact stored XP value once on collection.
- Add a persistent combat status rail that keeps HP, level, and current XP progress legible while the player moves and fights.
- Preserve the existing level-up authority and choice flow so collected XP continues through `checkLevel()`, `showLevelChoices()`, and `pickLevel()`.
- Keep crystal rendering high contrast and bound the active crystal count through deterministic value-preserving merging for long-run stability.

## Acceptance

- Focused guards first fail on the absent V3.4.2 contract, then pass after implementation.
- Defeating a normal or elite enemy creates exactly one experience crystal with the existing effective XP value; XP does not increase at defeat time.
- A crystal outside collection range remains unclaimed. Entering its attraction range moves it toward the player, and collection increases XP exactly once before removing it.
- Crystal count is bounded without losing total stored XP value.
- Collection can trigger the existing level-up choice overlay; choosing an upgrade resumes the same run through the existing authority.
- Desktop, emulated `390x844`, and emulated `320x844` battle views keep the HP/XP rail visible with no horizontal overflow and without covering movement or skill controls.
- Browser console errors and warnings remain zero. Physical-phone feel remains a separately reported acceptance risk unless a real device is tested.

## Preserve and exclude

Preserve Schema30, fresh chapter 0 stars, defeat 0 stars, non-story star isolation, one settlement per run, dual-Boss routing, V3.0 safety fixes, Boss Loot precedence, ordered scripts, existing saves, existing effective normal/elite XP values and multipliers, `xpNeed`, and the existing level-up/choice authority.

No backend/account/network service, new hero, new map, new mode, new objective/task authority, second upgrade system, second clock/settlement, dependency, public Debug UI, schema bump, or `_v342Old*` wrapper. Do not change enemy HP, damage, count, speed, player speed, skills, Boss parameters, stage length, `incoming:.44`, five `22%` recoveries, `telegraphScale:1.65`, `bossHp:3.00`, or `duration:360`.

## Required completion gates

Run in order: `npm run check`, `npm run smoke`, `npm run audit`, `npm run context`, `npm run archive:verify`. Then update only the five rotating sections of `handoff/STATE.md`.
