# BUG_REGRESSION_HISTORY.md
# Bug / 回归历史母档

## 已识别并在V3.0收口的关键问题

### Boss重复生成
早期：`run.bossDefeated` 未可靠初始化/设置。  
要求：Boss死亡后同一逻辑节点不得重复刷新。

### 失败给章节星
早期失败可能获得1星。  
当前不变量：失败0星。

### Elite Aura永久减速
旧逻辑：每帧 `player.speed *= .997`。  
结果：长局速度持续下降。  
当前不变量：Aura只能临时减速，离开恢复。

### Rift累计击杀误判
旧逻辑直接检查累计 `run.eliteKills >= 3`。  
当前：进入裂缝时记录 baseline，再要求新增3只。

### Modal / Pause穿透
升级、事件、宝箱、Boss loot可能同时打开，Esc可误解除底层暂停。  
V3.0加入 blocking modal guard + queue。

### 新存档带星
早期 ST001 默认存在已完成星。  
V3.0 Schema30新存档改为0星。

### 难度XP未接入
难度配置有 xp 倍率但击杀经验未使用。  
V3.0接入。

### Q快捷键缺失
当前 Q/E 均可英雄技。

### ST004-03炎雷双王名实不符
早期只有B010。  
V3.0剧情改 B009 → B010。

### 重复结算
多层 `finishRun` wrapper 可能在同帧触发。  
V3.0加入 `run.v30.finalizing`。

### 存档槽重置
重置当前槽可能错误回到空Slot1。  
V3.0优先切换其他有效槽。

### 长局实体累积
V3.0加入 low / balanced / high 多类实体上限。

---

## 仍属于架构债务的项目

1. 版本 wrapper 链数量仍高（V3.1.2 audit 约129 legacy wrapper aliases）。
2. `startBattle / finishRun / updateRun / damageEnemy / damageBoss / renderTop / renderResult` 都是高风险覆盖链。
3. 全局 `save/run/player/enemies/shots` 尚未命名空间化。
4. 配置和运行态仍未完全分离。
5. 浏览器自动化测试仍需正式引入。
6. 部分完整40技能/25被动/20进化/10融合/4神话在设计上冻结，但实际实现完整度仍需V3.4核对。
7. H012 M008构筑合法路线需要最终统一。
8. 当前程序化美术仍需真实资源替换。

---

## 每次Codex修改后的最小回归

运行：

npm run check
npm run smoke
npm run audit
npm run context
npm run archive:verify

并额外确认：
- 新存档0星
- defeat 0星
- non-story 不改星
- Boss死亡不重复
- Aura不永久减速
- Rift从baseline计数
- Q/E/Space/R/F
- 单局单结算
