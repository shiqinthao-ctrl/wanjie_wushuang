# V3.1 Architecture

## 当前架构

V3.1 是从单 HTML 到正式代码仓库的第一步，采用 **ordered global runtime**：

1. 基础数据与默认存档加载。
2. 基础 UI / 战斗引擎加载。
3. 按 V1.9 → V3.0 的演进顺序加载系统层。
4. 后加载层通过函数 wrapper 覆盖前一层实现。
5. `v31-project.js` 最后加载，只负责项目元信息和版本显示。

这是为了保持 V3.0 行为一致，而不是理想终态。

## 关键加载顺序

`config/game-data.js`
→ `ui/*`
→ `combat/engine.js`
→ `systems/director-balance.js`
→ `systems/save-slots-start.js`
→ `presentation/*`
→ `combat/hero-identity.js`
→ `combat/skill-forms.js`
→ `combat/boss-map-interactions.js`
→ `systems/gear-affix-loot.js`
→ `systems/runes-pets.js`
→ `systems/meta-growth.js`
→ `systems/game-modes.js`
→ `systems/daily-mutators.js`
→ `core/stability-v30.js`
→ `core/v31-project.js`

改变这个顺序可能导致 wrapper 引用旧函数失败。

## V3.2 建议

- 新建 `window.WW = { config, state, combat, ui, systems }`。
- 优先迁移纯配置：Hero/Skill/Boss/Stage/Equipment/Rune/Pet。
- 然后迁移存档与模式状态。
- 再把 `run/player/enemies/shots` 收进 `WW.combat.state`。
- 将旧版本 wrapper 逐步合并成单一实现，减少 `_vXXOldFunction` 链。
- 最后再切换到 ES Modules / bundler。
