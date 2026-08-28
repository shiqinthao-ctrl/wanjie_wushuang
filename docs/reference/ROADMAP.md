# ROADMAP.md

## V3.2 Runtime Namespace 重构
Phase 1：配置层进入 `WW.config`，保留旧全局别名。  
Phase 2：迁移 `WW.state.save/run/player`。  
Phase 3：建立 SaveService / ModeService / RewardService / CombatService / UIService。  
Phase 4：合并 finishRun/startBattle/damageEnemy/damageBoss/renderTop/renderResult/updateRun wrapper链。  
Phase 5：最小浏览器自动化：boot/new save/hero select/mode select/battle start/save reload。

## V3.3 真实资源管线
英雄/敌人/Boss/技能/地图/音频资源目录、Manifest、preload、fallback。

## V3.4 内容与平衡 Beta
补足40战斗技能、25被动、20进化、10融合、4神话；统一数值、经济、掉落与6英雄Build多样性。

## V4.0 可发行 Web Demo
正式素材、正式音频、15分钟首次引导、遥测接口、部署流程、build hash/version、发布检查清单。
