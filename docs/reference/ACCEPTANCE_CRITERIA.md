# ACCEPTANCE_CRITERIA.md

## A 启动与资源
- `index.html` 可通过本地 HTTP 打开。
- 所有本地 CSS/JS 路径存在。
- 无阻断启动的 SyntaxError。
- 无公开 Debug 导航入口。

## B 存档
- Schema 30兼容。
- 旧存档缺字段有fallback。
- 新存档ST001四关初始0星。
- 三槽可创建/切换/重置。

## C 主流程
主大厅 → 英雄 → 装备/符文/宠物 → Build → 模式 → 世界地图 → 战斗 → 结算 → 成长。

## D 战斗
- WASD移动；Q/E英雄技；Space闪避；R终极；F交互。
- 升级/事件/宝箱/Boss掉落弹窗不得互抢状态。
- Esc不得穿透阻塞弹窗。
- 一局只结算一次。

## E Boss
- 不重复错误刷新。
- 三阶段、护盾、预警逻辑正确。
- ST004-03剧情为B009→B010。

## F 模式
- story可更新章节星。
- non-story不得改章节星。
- defeat=0星。
- endless不受旧20分钟结算影响。
- bossrush最多8 Boss后胜利。
- tower胜利层数+1。
- daily日期固定词缀。
- abyss治疗削弱/压力倍率生效。

## G 长期系统
英雄等级/星级/熟练/觉醒、账号天赋、装备词条/套装、符文/共鸣、宠物行为均进入实际战斗。

## H 性能
三档实体上限存在；长局数组不无限增长。

## I 完成门槛
```bash
npm run check
npm run smoke
npm run audit
```
三项全部通过。
