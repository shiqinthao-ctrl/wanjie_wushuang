# TASK.md - V3.4.3 Combat Growth Feel Acceptance / Slice 2

Status: completed.

## Goal

Complete one evidence-led browser acceptance slice for the V3.4.2 combat-growth loop without changing combat balance or adding a second progression authority.

- Play the real game through the natural desktop path: defeat enemies -> see experience crystals -> move into attraction range -> collect enough XP -> open the existing three-choice upgrade -> choose one upgrade -> resume the same run.
- Observe crystal readability, attraction response, pickup feedback, HUD continuity, control obstruction, and browser console health from the user-visible runtime.
- Recheck the combat view at desktop, emulated `390x844`, and emulated `320x844` sizes.
- Tune only a browser-reproduced visibility, pickup-feedback, or control-obstruction issue. If behavior is already clear, do not change gameplay parameters merely to create work.
- Keep physical-phone feel as an explicitly unverified follow-up unless a real device is available during this task.

## Acceptance

- The natural desktop flow reaches one real level-up without editing runtime state, fabricating DOM state, invoking hidden debug controls, or bypassing combat.
- At least one defeated enemy visibly produces a crystal, the crystal remains unclaimed outside attraction range, and player movement causes a visible attract-and-collect response.
- The existing level-up overlay presents three choices; selecting one closes the overlay and resumes the same battle/run identity.
- The persistent level, HP, and XP rail remains readable throughout the flow and reflects the collected XP and resulting level.
- Desktop, emulated `390x844`, and emulated `320x844` combat views have no horizontal overflow and do not let the HUD or overlays cover the movement or skill controls.
- Browser console errors and warnings remain zero for the accepted path.
- Any behavior change follows a focused RED -> GREEN guard and preserves existing XP values and combat authority. If no defect is reproduced, this task may complete as an evidence-only acceptance slice.
- Physical-phone feel is reported separately and is not represented as verified by browser emulation.

## Preserve and exclude

Preserve Schema30, fresh chapter 0 stars, defeat 0 stars, non-story star isolation, one settlement per run, dual-Boss routing, V3.0 safety fixes, Boss Loot precedence, ordered scripts, existing saves, existing normal/elite XP values and multipliers, `xpNeed`, the existing level-up/choice authority, objectives, and settlement.

No backend/account/network service, new hero, new map, new mode, new objective/task authority, second upgrade system, second clock/settlement, dependency, public Debug UI, schema bump, runtime-state injection, combat-balance change, or `_v343Old*` wrapper. Do not change enemy HP, damage, count, speed, player speed, skills, Boss parameters, stage length, `incoming:.44`, five `22%` recoveries, `telegraphScale:1.65`, `bossHp:3.00`, or `duration:360`.

## Required completion gates

Run in order: `npm run check`, `npm run smoke`, `npm run audit`, `npm run context`, `npm run archive:verify`. Then update only the five rotating sections of `handoff/STATE.md`.
