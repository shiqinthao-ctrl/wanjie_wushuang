# TASK.md - V3.4.0 Complete Playable Combat Loop Foundation

## Goal

Turn the current combat presentation into a coherent, replayable browser-game loop without numerical combat rebalance: make traversal feel like a real world rather than a small boxed arena, keep the player oriented with a tactical minimap, make hero/build deployment an informed confirmation, and add in-run objectives plus time-milestone rewards that create readable short-term goals.

## Scope

This task may update `TASK.md`, `index.html`, `assets/css/app.css`, existing files under `assets/js/config/`, `assets/js/combat/`, `assets/js/systems/`, and `assets/js/ui/`, focused assertions under `scripts/`, and only the five rotating sections of `handoff/STATE.md`.

Deliver the following independently verifiable slices:

1. **Combat space and touch movement** - enlarge perceived traversal through camera look-ahead, a calmer safe zone, world-edge feedback, and a floating mobile joystick that can start within the left movement zone and sustain movement without changing hero move speed.
2. **Tactical minimap** - show world bounds, player, live Boss, unused interactions, active objective, and current viewport. Do not show every normal enemy.
3. **Hero and deployment choice** - show each hero's role, difficulty, range, survival, mobility, resource loop, and recommended style. Hero browsing must not overwrite the active build. Confirmation must explicitly choose whether to retain a compatible build or apply the selected hero's recommended preset, then return to one deployment summary covering hero, gear, runes, pet, active/passive skills, stage, and mode.
4. **In-run objectives** - provide one primary objective and up to two contextual side objectives driven only by existing time, kills, elite kills, interactions, chests, Boss, survival, and settlement events. Show progress and completion feedback in the combat HUD.
5. **Timed rewards** - provide three once-per-run time milestones with visible lock/ready/claimed states. Claiming pauses combat, reuses the existing choice presentation, and cannot be duplicated. These replace the opaque legacy timed-chest trigger; they are not login, offline, server, or calendar rewards.
6. **Choice quality and replay guidance** - upgrade/chest choices must show category, current-to-next level, concrete effect summary, and build synergy tags. Results must summarize completed objectives/rewards and suggest a next run based on the current hero/build without granting extra settlement.

## Required behavior

- World coordinates remain authoritative and separate from the viewport. Camera look-ahead follows the unified keyboard/joystick movement vector, clamps to world bounds, and returns smoothly when input stops.
- Mobile movement supports pointer capture, cancellation, orientation/resize, dead zone, and starting from the left movement zone. Action buttons remain independent and unobstructed at `390x844` and `320px` widths.
- The minimap and objective HUD consume existing run state only. They must not mutate health, damage, enemy AI, interactions, saves, progression, time, loot, or settlement.
- A hero preview is non-destructive. Locked-hero purchase and final hero/build application happen only after explicit confirmation; cancel/return preserves the prior hero and build.
- Objectives and timed rewards initialize once per run, update deterministically, and stop after run end. A milestone can open at most once and be claimed at most once, including rapid repeated input.
- Boss Loot remains authoritative and must be selected before victory settlement. Timed rewards and objective feedback may never replace, delay, or duplicate Boss Loot or settlement.
- Keep ordered global script loading. Merge into existing logic; add no new `_vXXOld*` wrapper layer.

## Excluded

Do not add a backend, account system, network event service, login/sign-in/offline reward, server task center, gacha, monetization, multiplayer, new dependency, public Debug UI, second combat clock, second settlement path, new stage, new enemy, new interactable, or new save-schema version.

Do not change attack, skill, damage, enemy density/AI, collision, XP curve, drop rate, Boss health/phases/damage/spawn timing, stage duration, movement speed, `incoming:.44`, five `22%` recoveries, `telegraphScale:1.65`, `bossHp:3.00`, `bossAt:270`, or `duration:360`.

## Acceptance

- Add focused RED guards before behavior changes for world/camera policy, floating joystick lifecycle, minimap state projection, non-destructive hero preview, explicit build application, objective initialization/progress/completion, timed-reward ready/claim idempotency, informative choice copy, Boss-loot/settlement precedence, responsive containment, unchanged constants, and unchanged ordered scripts. Record RED then GREEN.
- Isolate pure projections for minimap, deployment summary, objectives, timed rewards, and choice metadata where practical. Prove these projections cannot write saves or combat/settlement state.
- Through normal UI, complete the route `home -> mission -> briefing -> hero/build confirmation -> battle -> timed reward -> objectives -> B001 -> Boss Loot -> Result`. Verify one victory settlement and objective/reward summary.
- Verify desktop plus `390x844` and `320px` browser layouts: sustained keyboard/touch movement, camera/world-edge behavior, readable minimap and objectives, no control overlap, all overlays dismissible, and clean console.
- Before completion run, in order: `npm run check`, `npm run smoke`, `npm run audit`, `npm run context`, `npm run archive:verify`. Then update only the five rotating `handoff/STATE.md` sections.

## Preserve

Preserve Schema30 compatibility, fresh chapter 0 stars, defeat 0 stars, non-story star isolation, one settlement per run, Boss Loot before settlement, dual-Boss routing, V3.0 safety fixes, ordered scripts, all excluded numerical values, and existing saved data. Browser emulation is not physical-phone or five-route human acceptance.
