# V3.2 Final Configuration Migration Audit

Audit date: 2026-08-14

## Scope and method

- Scope: all 22 runtime scripts loaded by `index.html`; `scripts/smoke.mjs` and `scripts/audit.mjs` are counted separately as test references.
- Runtime counts exclude comments and the one direct compatibility declaration for each protected alias.
- Reads and writes are counted separately by `npm run audit`; expected counts are locked in `scripts/audit.mjs`.
- A declaration such as `const HEROES=window.WW.config.hero={...}` preserves strict same-object identity at initialization.
- Cleanup Batches A-F removed 20 aliases that had zero loaded-runtime consumers. The audit now scans every loaded runtime script and fails if any of those identifiers returns.
- Phase 2J re-audited the nine remaining aliases without deleting them. Repository-visible usage classifies all nine as test-only compatibility aliases; possible out-of-repository use remains uncertain.
- Cleanup Batch G removed five low-coupling aliases after an immediate re-audit again found loaded-runtime R0/W0. Their formal assignments, configuration data, and load points remain unchanged.
- Cleanup Batch H removed the final four aliases after another immediate R0/W0 audit. Chapter mutations, Gear/Rune in-place merges, and Pet role separation remain guarded.
- The final audit independently found zero matches for all 29 retired identifiers across `assets/js`, confirmed 22 ordered runtime scripts, and made no runtime changes.
- Repository scanning cannot prove that browser-console snippets, embedded scripts, integrations, or other out-of-repository callers do not exist.
- Uppercase `GEAR`, `RUNES`, and `PETS` remain in `index.html` only as visible presentation labels. They are not JavaScript identifiers or runtime configuration consumers.

## Reviewed aliases

No reviewed alias remains in loaded-runtime use. Batches G and H removed all nine bindings while retaining their formal assignments at the same load points. External-caller uncertainty remains an explicit acceptance risk rather than a repository-visible consumer.

| Legacy alias | Formal path | Definition | Pre-removal R/W | Pre-removal test refs | Current status | Mutation or extension | Recommendation |
| --- | --- | --- | ---: | ---: | --- | --- | --- |
| `HEROES` | `WW.config.hero` | `assets/js/config/game-data.js:4` | 0 / 0 | 11 | Binding removed in Batch G; formal assignment retained | None | Final audit passed |
| `SKILLS` | `WW.config.skill` | `assets/js/config/game-data.js:19` | 0 / 0 | 4 | Binding removed in Batch G; formal assignment retained | None | Final audit passed |
| `EVOS` | `WW.config.evolution` | `assets/js/config/game-data.js:20` | 0 / 0 | 4 | Binding removed in Batch G; formal assignment retained | None | Final audit passed |
| `BOSSES` | `WW.config.boss` | `assets/js/config/game-data.js:54` | 0 / 0 | 3 | Binding removed in Batch G; formal assignment retained | None | Final audit passed |
| `CHAPTERS` | `WW.config.stage` | `assets/js/config/game-data.js:65` | 0 / 0 | 8 | Binding removed in Batch H; formal assignment retained | Three existing in-place `unlock` writes use the formal path | Final mutation audit passed |
| `GEAR` | `WW.config.gear` | `assets/js/config/game-data.js:23` | 0 / 0 | 3 | Binding removed in Batch H; formal assignment retained | Catalog is extended in place by `gear-affix-loot.js` | Final extension audit passed |
| `RUNES` | `WW.config.rune` | `assets/js/config/game-data.js:28` | 0 / 0 | 6 | Binding removed in Batch H; formal assignment retained | Rich rune projection is merged in place by `runes-pets.js` | Final projection audit passed |
| `PETS` | `WW.config.pet` | `assets/js/config/game-data.js:29` | 0 / 0 | 6 | Binding removed in Batch H; formal assignment retained | Lightweight config remains separate from rich pet definitions | Final role-separation audit passed |
| `V29_MODES` | `WW.config.mode` | `assets/js/systems/game-modes.js:5` | 0 / 0 | 10 | Binding removed in Batch G; formal assignment retained | None | Final audit passed |

## Loaded runtime consumers

| Legacy alias | Consumers outside declaration |
| --- | --- |
| `HEROES` | Identifier absent after Batch G; formal `WW.config.hero` assignment remains |
| `SKILLS` | Identifier absent after Batch G; formal `WW.config.skill` assignment remains |
| `EVOS` | Identifier absent after Batch G; formal `WW.config.evolution` assignment remains |
| `BOSSES` | Identifier absent after Batch G; formal `WW.config.boss` assignment remains |
| `CHAPTERS` | Identifier absent after Batch H; formal `WW.config.stage` assignment and three in-place writes remain |
| `GEAR` | Identifier absent after Batch H; formal `WW.config.gear` assignment and in-place catalog extension remain |
| `RUNES` | Identifier absent after Batch H; formal `WW.config.rune` assignment and in-place rich projection remain |
| `PETS` | Identifier absent after Batch H; formal lightweight `WW.config.pet` assignment remains separate from rich Pet definitions |
| `V29_MODES` | Identifier absent after Batch G; formal `WW.config.mode` assignment remains |

## Removed aliases

All 29 aliases below were removed in Cleanup Batches A-H after an immediate pre-removal audit found zero loaded-runtime consumers. Their formal `WW.config` paths remain. A repository-wide loaded-script guard now prevents these identifiers from being reintroduced at runtime.

| Removed alias | Preserved formal path | Cleanup batch | Current runtime status |
| --- | --- | --- | --- |
| `V24_FORM_DESC` | `WW.config.skillForms.descriptions` | A | Identifier absent |
| `V24_ELEMENT_PASSIVE` | `WW.config.skillForms.elementPassives` | A | Identifier absent |
| `V24_BASE_CD` | `WW.config.skillForms.baseCooldowns` | A | Identifier absent |
| `V24_EXTRA_NAMES` | `WW.config.skillForms.extraNames` | A | Identifier absent |
| `V25_BOSS` | `WW.config.bossInteractions.bosses` | B | Identifier absent |
| `V25_INTERACT_NAMES` | `WW.config.bossInteractions.interactionNames` | B | Identifier absent |
| `V25_INTERACT_DESC` | `WW.config.bossInteractions.interactionDescriptions` | B | Identifier absent |
| `V25_DAMAGE_NAMES` | `WW.config.bossInteractions.damageNames` | B | Identifier absent |
| `V26_GEAR_CATALOG` | `WW.config.gearSystem.catalog` | C | Identifier absent |
| `V26_SETS` | `WW.config.gearSystem.sets` | C | Identifier absent |
| `V26_AFFIX_POOL` | `WW.config.gearSystem.affixPool` | C | Identifier absent |
| `V26_RARITY_AFFIX` | `WW.config.gearSystem.rarityAffixCounts` | C | Identifier absent |
| `V26_BOSS_DROPS` | `WW.config.gearSystem.bossDrops` | C | Identifier absent |
| `V27_RUNES` | `WW.config.runePetSystem.runes` | D | Identifier absent |
| `V27_PETS` | `WW.config.runePetSystem.pets` | D | Identifier absent |
| `V23_HERO_COMBAT` | `WW.config.heroIdentity.combat` | E | Identifier absent |
| `V23_NAMES` | `WW.config.heroIdentity.skillNames` | E | Identifier absent |
| `V29_BOSS_ORDER` | `WW.config.gameModes.bossOrder` | F | Identifier absent |
| `V29_BOSS_STAGE` | `WW.config.gameModes.bossStages` | F | Identifier absent |
| `V29_DAILY` | `WW.config.gameModes.dailyChallenges` | F | Identifier absent |
| `HEROES` | `WW.config.hero` | G | Identifier absent |
| `SKILLS` | `WW.config.skill` | G | Identifier absent |
| `EVOS` | `WW.config.evolution` | G | Identifier absent |
| `BOSSES` | `WW.config.boss` | G | Identifier absent |
| `V29_MODES` | `WW.config.mode` | G | Identifier absent |
| `CHAPTERS` | `WW.config.stage` | H | Identifier absent |
| `GEAR` | `WW.config.gear` | H | Identifier absent |
| `RUNES` | `WW.config.rune` | H | Identifier absent |
| `PETS` | `WW.config.pet` | H | Identifier absent |

## Consumer migration sequence

Each phase migrates consumers only. Alias removal is deferred to a later, separate zero-consumer audit.

| Phase | Scope | Post-phase runtime R/W | Main risk control |
| --- | --- | ---: | --- |
| 2A (completed) | `V29_MODES` in `assets/js/core/stability-v30.js` | 0 / 0 | Schema30 mode fallback moved to `WW.config.mode`; alias was later removed in Batch G |
| 2B (completed) | `SKILLS` | 0 / 0 | Skill-name fallback and Schema30 build sanitization moved to `WW.config.skill`; alias was later removed in Batch G |
| 2C (completed) | `RUNES` and `PETS` | 0 / 0 | Consumers moved to formal paths; aliases were retained for migration and later removed in Batch H |
| 2D (completed) | `BOSSES` | 0 / 0 | Consumers moved to the formal path; alias was retained for migration and later removed in Batch G |
| 2E (completed) | `EVOS` | 0 / 0 | Consumers moved to `WW.config.evolution`; alias was retained for migration and later removed in Batch G |
| 2F (completed) | `HEROES` presentation and save consumers | 17 / 0 remain | Presentation/save consumers moved to `WW.config.hero`; remaining consumers moved in 2H and the alias was later removed in Batch G |
| 2G (completed) | `GEAR` | 0 / 0 | Consumers moved to `WW.config.gear`; in-place extension remains and the alias was later removed in Batch H |
| 2H (completed) | Remaining `HEROES` combat and data consumers | 0 / 0 | Remaining consumers moved to `WW.config.hero`; alias was later removed in Batch G |
| 2I (completed) | `CHAPTERS` | 0 / 0 | All reads and three in-place `unlock` writes moved to `WW.config.stage`; alias was later removed in Batch H |

## Decision

- Phase 2J deleted nothing and approved two bounded repository-cleanup batches.
- Batch G removed `HEROES`, `SKILLS`, `EVOS`, `BOSSES`, and `V29_MODES` after their second immediate audit confirmed runtime R0/W0. Their formal assignments remain at the same load points, and tests now guard formal paths, data sentinels, and identifier absence.
- Batch H removed `CHAPTERS`, `GEAR`, `RUNES`, and `PETS` after its immediate audit confirmed runtime R0/W0. Chapter in-place `unlock` writes, Gear catalog in-place extension, Rune projection in-place merge, and the separation between lightweight and rich Pet configuration remain unchanged and guarded.
- Final configuration migration audit passed: all 29 retired identifiers are absent from the 22 loaded scripts; formal paths, data sentinels, mutation semantics, Schema30, star rules, settlement guards, and V3.0 safety guards remain intact.
- External-caller uncertainty is accepted only as a documented risk for the bounded repository cleanup; repository scans cannot prove absence of browser-console snippets, embedded scripts, integrations, or other out-of-repository callers.
- Phase 2A is complete: `assets/js/core/stability-v30.js` now reads `WW.config.mode`, with the same missing/unknown-mode fallback to `story`.
- Phase 2B is complete: `assets/js/config/game-data.js` and `assets/js/core/stability-v30.js` now read `WW.config.skill`, preserving skill-name fallback and Schema30 build filtering.
- Phases 2A-2I completed consumer migration before any protected alias deletion. Phase 2J then reviewed the deletion boundary, and Batches G-H removed the nine aliases only after repeat R0/W0 audits.
- No further V3.2 compatibility-alias cleanup is recommended. Future configuration work should use formal `WW.config` paths and keep the 29-identifier loaded-runtime absence guard.
- External-consumer uncertainty remains unresolved: repository evidence cannot validate browser-console snippets, embedded scripts, integrations, or other out-of-repository callers.
