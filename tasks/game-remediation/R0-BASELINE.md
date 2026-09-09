# R0 当前证据与问题基线

检查日期 2026-09-09，源码起点 84e04723a3509395d9a6061ede2c29323008d8d4。
G5 运行时 821b90c，标签 mobile-next-g5-20260909。历史发布证据见
../mobile-modernization/G5-EVIDENCE.md；它是上次核验记录，本轮不重复宣称线上核验。
本轮浏览器检查使用本地生产构建，实际结果见 evidence/R0/RESULTS.md。

证据分级：S=当前源码/目录；H=保留的历史测试证据；B=本轮浏览器；
T=设计目标；P=外部验收待办。通过测试不代表好玩或美术达标。

| 问题 | 事实与证据位置（项目根目录相对） | 影响 | 归属/闭环任务 |
|---|---|---|---|
| Q01 单关硬编码 | S: GameCore.ts、FirstBoss.ts、settlement.ts 绑定 ST001-01/B001；均在 apps/mobile-next/src/core | 无新章节独立流程 | 研发 R1a/R3-M |
| Q02 旧属性侵入 | S: GameCore 构造仅替换 build，calculateStartup 仍读装备/天赋/符文/宠物 | 精品版难统一平衡 | 研发 R1a/R1b |
| Q03 选择规则不符 | S: progression.ts 上限 6；RunEvolution.ts Lv3 展示全池、Lv8 任意主动 Lv3；无重抽放逐 | 新设计尚未生效 | 策划/研发 R1b/R2-S |
| Q04 首领元素机制不足 | S: evolutionCatalog.ts superconduct/thermalshock 文案排除首领减速触发 | 冰系首领玩法不完整 | 研发 R2-B |
| Q05 角色辨识度 | S: public/art 共 7 SVG；game/mountBattle.ts 英雄染色/附件、敌人共用 enemy 图 | 进化剪影和动作不足 | 美术/研发 R1f/R3-A |
| Q06 音频缺失 | S: game/mountBattle.ts audio.noAudio=true；无新版音乐目录 | 打击/危险反馈无声音 | 音频/研发 R1e |
| Q07 HUD 与选择负担 | S: ui/BattleView.vue、ChoiceDetails.vue、App.vue 常驻文字多；H: G5 原片 | 小屏注意力竞争 | 交互 R1f/R3-U |
| Q08 缺少下一局目标 | S: App.vue 仅 home/battle/settings/saves；RunResult.vue 主奖仍旧货币 | 重玩驱动不完整 | 策划/研发 R3-P/U |
| Q09 冷启动历史超时 | H: G4-EVIDENCE.md 的首个 readiness timeout，后续成功无已证实根因 | 发布稳定性仍有盲区 | 测试 R0 采样/独立修复切片 |
| Q10 自然生命耗尽未闭环 | H: P2l-EVIDENCE.md；phone 静止超时预期实际获胜 | 目标场景覆盖缺口 | 测试独立历史回归；不调参凑结果 |
| Q11 资源预算未实测 | S: 7 SVG 不是成品资源负载；H: G5 大块构建警告 | 无法推断量产性能 | 研发 R1f/R4-P |
| Q12 PWA 未完成 | S: package.json 无 PWA 依赖/章节清单 | 离线与更新不可验收 | 研发 R4-O |
| Q13 玩家/实体手机证据缺失 | P: 没有本项目已完成的 5 人/12 人/两实体机记录 | 品质与性能不确定 | 策划/测试 R1g/R4-Q |
| Q14 状态入口落后 | S: modernization/STATUS.md 仍停 G3 | 后续任务可能用错基线 | 文档 R0，新增当前状态入口保留历史 |

## 当前内容盘点

evolutionCatalog.ts 当前确有 3 starters、11 forms、10 activeSkills、11 passiveSkills、
12 skillRoutes、8 bonds。数量存在不等于本次打法/美术已完成，逐项映射见规则合同。
firstStage.json 首关刷怪池为 EN001/EN002/EN003；目录含更多配置不等于完整迁移。
现有保护/回血、旧装备与演示档对录像结果的影响须单独注明。

## 保留与诊断方式

旧 index.html/顺序脚本、archive、Schema30 样本与 G5 附件不修改。
Q09 冷启动：桌面与三种手机宽度，每次独立浏览器上下文、空缓存/空新版存储；
记录大厅、点击出战、暂停可用、首个计时变化、资源/控制台/长任务与原片。
沿用历史 expect 的 5 秒 readiness 阈值，重复三次且零自动重试；失败也输出证据。
这是桌面 Chrome 冷上下文采样，不是重启手机/清系统缓存，也不预设问题已解决。
Q10 本轮不重新跑六分钟失败目标；保留原问题与原测试，不标关闭。
