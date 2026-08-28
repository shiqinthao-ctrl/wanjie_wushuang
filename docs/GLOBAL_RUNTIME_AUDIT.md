## Config globals

| `WW.config` key | Legacy compatibility alias | Reference rule |
|---|---|---|
| `hero` | `HEROES` | Same object reference |
| `skill` | `SKILLS` | Same object reference |
| `boss` | `BOSSES` | Same object reference |
| `stage` | `CHAPTERS` | Same object reference |
| `gear` | `GEAR` | Same object reference |
| `rune` | `RUNES` | Same object reference |
| `pet` | `PETS` | Same object reference |
| `mode` | `V29_MODES` | Same object reference |

| Group | Other configuration globals |
|---|---|
| Base domain and save defaults | `EVOS`, `FUSIONS`, `ENEMIES`, `ELITE_AFFIXES`, `MAP_EVENTS`, `SAVE_KEY`, `DEFAULT_SAVE` |
| Stage and runtime tuning | `TUTORIAL`, `V19_DIFFICULTIES`, `V19_WAVES`, `V20_SAVE_SLOTS_KEY`, `V20_ACTIVE_SLOT_KEY`, `V20_PERF` |
| Presentation | `V21_FEEDBACK_KEY`, `V21_TIPS`, `V21_FB_TAGS`, `V22_ASSET_MANIFEST` |
| Hero, skill, boss, and interaction | `V23_HERO_COMBAT`, `V23_NAMES`, `V24_FORM_DESC`, `V24_ELEMENT_PASSIVE`, `V24_BASE_CD`, `V24_EXTRA_NAMES`, `V25_BOSS`, `V25_INTERACT_NAMES`, `V25_INTERACT_DESC`, `V25_DAMAGE_NAMES` |
| Gear, rune, pet, and meta progression | `V26_GEAR_CATALOG`, `V26_SETS`, `V26_AFFIX_POOL`, `V26_RARITY_AFFIX`, `V26_BOSS_DROPS`, `V27_RUNES`, `V27_RUNE_IDS`, `V27_PETS`, `V28_AWAKEN`, `V28_MASTERY`, `V28_TALENTS`, `V28_BRANCH` |
| Modes, safety, and project metadata | `V29_BOSS_ORDER`, `V29_BOSS_STAGE`, `V29_DAILY`, `V30_SCHEMA`, `V30_PERF_CAPS`, `WW_PROJECT` |

## State globals

| Group | Mutable runtime globals |
|---|---|
| Persistence and meta selection | `save`, `lastResult`, `v20ActiveSlot`, `v20Slots`, `v28GrowthHero` |
| Combat | `run`, `player`, `enemies`, `shots`, `enemyShots`, `effects`, `numbers`, `traps` |
| Input and render loop | `keys`, `canvas`, `ctx`, `DPR`, `AW`, `AH`, `last`, `tutorialStep`, `v20Joy` |
| DOM initialization handles | `homeFeatureGrid`, `titleMark`, `chip` |
| Timers and transient UI | `window.tt`, `window.hh`, `v21LoadingTimer`, `v24LoadingTimer`, `v26LoadingTimer`, `v27LoadingTimer`, `v28LoadingTimer`, `v29LoadingTimer`, `v21LastBossCast`, `v21FeedbackRating`, `v21FeedbackTags`, `v30ModalQueue` |
| Runtime service object | `V21Audio` (`ctx`, `master`, and `unlocked` mutate at runtime) |

## Functions overridden 2+ times

| Function | Override bodies after first definition |
|---|---:|
| `v20Boot` | 10 |
| `finishRun` | 9 |
| `renderResult` | 8 |
| `renderTop` | 8 |
| `startBattle` | 8 |
| `updateRun` | 8 |
| `drawRun` | 5 |
| `spawnBoss` | 5 |
| `castHeroSkill` | 4 |
| `damageEnemy` | 4 |
| `damageBoss` | 3 |
| `hurtPlayer` | 3 |
| `makeGearDrop` | 3 |
| `pickChest` | 3 |
| `renderHeroes` | 3 |
| `renderLoadout` | 3 |
| `renderRunSide` | 3 |
| `skillName` | 3 |
| `v24Mod` | 3 |
| `v24PLv` | 3 |
| `v26DamageMult` | 3 |
| `bossAI` | 2 |
| `castUltimate` | 2 |
| `go` | 2 |
| `persist` | 2 |
| `pickLevel` | 2 |
| `renderGlobalSettings` | 2 |
| `renderStageList` | 2 |
| `shootAuto` | 2 |
| `showChest` | 2 |
| `spawnEnemy` | 2 |
| `tryDodge` | 2 |
| `v26RarityForSource` | 2 |

## Top 10 risky wrapper chains

| Rank | Function | Captured predecessor chain | Primary risk |
|---:|---|---|---|
| 1 | `v20Boot` | `_v21_v20Boot -> _v22_v20Boot -> _v23boot -> _v24_boot -> _v25_oldBoot -> _v26Boot -> _v27Boot -> _v28Boot -> _v29Boot -> _v30Boot` | Boot order, migrations, and duplicated side effects |
| 2 | `finishRun` | `_v18_finishRun -> _v21_finishRun -> _v25_oldFinish -> _v26Finish -> _v27Finish -> _v28Finish -> _v29Finish -> _v29DailyFinalFinish -> _v30Finish` | Duplicate settlement, save writes, rewards, and stars |
| 3 | `renderResult` | `_v18_renderResult -> _v20RenderResult -> _v22_renderResult -> _v25_oldResult -> _v26RenderResult -> _v27Result -> _v28Result -> _v29Result` | Repeated result rows and stale result state |
| 4 | `renderTop` | `_v18_renderTop -> _v22_renderTop -> _v26RenderTop -> _v27Top -> _v28Top -> _v29Top -> _v30RenderTop -> _v31RenderTop` | UI ordering and missing counters |
| 5 | `updateRun` | `_v20Update -> _v23ur -> _v24_prevUpdate -> _v25_oldUpdate -> _v27OldUpdate -> _v29Update -> _v30Update` | Frame-order regressions and duplicate combat updates |
| 6 | `drawRun` | `_v21_drawRun -> _v23dr -> _v24_prevDraw -> _v25_oldDraw -> _v27DrawPrev` | Render ordering and canvas-state leakage |
| 7 | `spawnBoss` | `_v18_spawnBoss -> _v21_spawnBoss -> _v22_spawnBoss -> _v25_oldSpawnBoss -> _v30SpawnBoss` | Boss lifecycle and respawn regressions |
| 8 | `damageEnemy` | `_v21_damageEnemy -> _v23de -> _v26DamageEnemy -> _v27OldDamageEnemy` | Damage, death, loot, and on-kill duplication |
| 9 | `castHeroSkill` | `_v21_castHeroSkill -> _v26HeroSkill -> _v27HeroSkill` | Cooldown and proc ordering |
| 10 | `damageBoss` | `_v25_oldDamageBoss -> _v26DamageBoss -> _v26BossDamageAfter` | Phase, loot, and kill attribution ordering |
