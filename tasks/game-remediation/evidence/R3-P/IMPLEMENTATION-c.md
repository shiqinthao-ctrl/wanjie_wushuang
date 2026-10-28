# R3-P03（D30）—— 六枚护符：六个杠杆，每枚只动一个数

Base: `R3-P02`（D29）。队列 `QUEUE.md` #16。裁定 `DECISIONS.md` D30。
代码：`chapter/charms.ts`、`chapter/prepare.ts`、`core/CombatSimulation.ts`、`core/progression.ts`、
`core/GameCore.ts`、`chapter/DragonCombat.ts`、`core/EvolutionCombat.ts`、`ui/CharmsPanel.vue`、`App.vue`。
断言：`chapter/charms.test.ts`（**21 个 `it`**）。

## 1. Scope 0 的五个答案（全部命令级，详见 D30）

| 问题 | 答案 |
|---|---|
| 六个 id 有任何一个实现过吗 | **0/6**。非测试代码里提到任一 id 字面量的行**只有 `catalog.ts:38` 那一行定义本身**；其余都是**下标**（`chapterCharms[3..5]` 发奖、`slice(0,3)` 开局解锁）⇒ **改名不会被任何人察觉** |
| 装备在哪失败，玩家看到什么 | `prepare.ts:31` 抛错，被 `BattleView.vue` 的 **catch-all** 接住 ⇒ 玩家读到的是**「请确认已启用图形加速」**，一句关于显卡的话 |
| 效果能合法挂在哪 | `chapter` 这条构造路径上，**乘数缺省 1**。预言机走 `new GameCore()` / 五参 `CombatSimulation`，两者 `chapter` 都是 `undefined` ⇒ 结构上碰不到 |
| 三个打出来的护符可达吗 | 胜利 **3/3**、觉醒 **3/3**、两条羁绊 **1/3**（详见 §1.3） |
| 需要新存档字段吗 | **不需要**。`charms.equipped` 已有，`progress.ts:67` 要求 `equipped ∈ unlocked`；但它**不检查 id 属于 `chapterCharms`**（`strings()` 只查类型/去重/长度）⇒ 未知 id 可以合法躺在 `unlocked` 里 |

### 1.1 这一片把「一句错误的错误消息」换成了「一句正确的错误消息」

旧代码不是「功能关着」，是**一条没人走的路上的一个错误的错误消息**：`App.vue` 不传 `:chapter`，
所以那个 throw 今天根本走不到；而一旦走到，玩家会被告知检查显卡。现在未知护符 id 抛的是
`战备护符「MC_PHOENIX」在本版本无法识别，请卸下后重新出战。原存档未被修改。` —— **点名到具体那枚**。

### 1.2 一个杠杆不止一个发射点 —— 我数错了，测试抓住了

D30 的初稿写着「六个杠杆各自只有一个读点，所以『一个护符只做一件事』是结构保证」。
**这句话对五个杠杆成立，对 `skillCd` 是假的。** 全库写 `p.skillCd` 的有三处：

| 类 | 行 | 谁走这条 |
|---|---|---|
| `CombatSimulation` | `action('skill')` 的遗留分支 | 无形态时的英雄 |
| `chapter/DragonCombat.ts` | 龙形术式 | **`H001` 在章节线的技能** |
| `core/EvolutionCombat.ts` | 进化征途的技能 | 征途 |

第一次跑 `charms.test.ts`，`MC_CYCLE` 那条红了：`expected 6 to be 5.1`。原因不是算式写错，
而是 **`H001` 的技能根本不走我改的那一行** —— 它走 `DragonCombat`。
修法不是「再补一处」，是**把冷却收成一个函数**：

```ts
skillCooldown(): number { return 6 * this.charmScale('skillCd'); }
```

三个发射点全部改成调用它。**「一处改完」的判据不是「我改了」，是「所有发射点都经过我改的那一行」** ——
这正是记忆里那条「一个键名可能有多个发射点，先 `grep` 发射点再解释它」的实例。
反过来说，这也解释了为什么这条测试值得写：**如果我只测 `charmScale('skillCd')` 的返回值，
它会绿，而玩家装上护符什么都不会发生。**

### 1.3 三个「打出来」的护符，在出货关卡上实测

仪器：`CH001-01`（**出货关卡**），一个「优先进化/觉醒」的机器人，三种子 `15 / 7 / 99`，
走位与 D27 的参考玩家同一条（绕行 136 px、读预警、闪避、奥义）。

| 护符 | 门槛 | 实测 | 备注 |
|---|---|---|---|
| `MC_SURVIVAL` | 任意胜利 | **3/3** | 三局都赢 |
| `MC_CYCLE` | 觉醒 `rank === 2` | **3/3** | 形态 `bulwark / dragon / dragon`，核心术式 Lv.5 |
| `MC_MOVE` | 两条羁绊 | **1/3** | 种子 99 三条（`wildfire / shadowfire / galephantom`），另两局各一条 |

**开局是 0 条羁绊**（三英雄起手技能表都只有一个技能 `{A003:1}` / `{A011:1}` / `{A015:1}`，凑不出两条 tag）
⇒ 这一列不是常数，是真打出来的。

**`MC_CYCLE` 的 3/3 是策略给的，不是运气给的**：D27 那个只挑 `active` 的机器人觉醒 **0/3**
（`formId` 恒 `null`，Lv.19 也不觉醒）。同一个门槛，换一种点法就从 0 变 3 ⇒ 页面必须写「觉醒解锁」，
不能写「打通就送」。这条写进了 `charms.test.ts` 的注释，因为它决定文案。

## 2. 六枚护符：杠杆、读点、出厂值与装备后

| id | 名字 | 杠杆 | 唯一读点 | 出厂 → 装备后 |
|---|---|---|---|---|
| `MC_DODGE` | 疾影 | `dodgeCd` | `CombatSimulation.action('dodge')` | 4.5 → **3.6** s |
| `MC_ELITE` | 破甲 | `eliteDamage` | `hit()` 的 `enemy.elite` 分支 | ×1 → **×1.15** |
| `MC_PICKUP` | 收束 | `pickup` | `XpField.advance` 的 26 px | 26 → **52** px |
| `MC_SURVIVAL` | 不屈 | `incoming` | 构造器 `player.incoming` | 0.44 → **0.374** |
| `MC_CYCLE` | 回环 | `skillCd` | `skillCooldown()`（三个发射点共用） | 6 → **5.1** s |
| `MC_MOVE` | 疾行 | `speed` | 移动那一行 `p.speed` | ×1 → **×1.12** |

**数据只存 `lever` + `factor`，不存绝对值。** 理由是可测的：一个把「4.5 秒」抄进自己行里的护符，
在有人把闪避冷却改成 4 秒之后**还会继续宣称 4.5** —— 它会一边失效一边说自己有效。
现在基数是 `CombatSimulation` 的字面量，护符是它上面的乘数，改基数会流过每一枚碰它的护符。

**`MC_MOVE` 特意不乘 `player.speed`**：闪避位移是 `min(90, speed * .34, 视口 * .16)`，也读同一个 `p.speed`。
乘在属性上会让同一枚护符**悄悄做两件事**（走路变快 + 闪避变远）。挂在移动那一行上，闪避距离逐位不变 ——
测试用同一个 `action('dodge')` 在两局里比较位移，要求**完全相等**。

## 3. 页面：全应用唯一会写进度的一页

`ui/CharmsPanel.vue` 是**唯一写 `mobileChapter` 的界面**（结算除外）。写入是一次 `transactOnce`，
**操作号里带槽位 revision**：

```
chapter1-v1:charm:${props.active.revision}:${id ?? 'none'}
```

没有 revision 会有一个真实的 bug：装备 A → 卸下 → 再装 A，第三次会命中第一次的**回执**，
`applied: false` 且**什么都没写**，而界面显示「已装备」。带上 revision，重试仍然幂等（同一 revision
同一操作号），而「卸下后再装」是一次新操作。

页面照实写着一条边界：**章节出战入口（`R3-U06`）尚未接入大厅，所以现在装备之后还没有可点开的一局。**
这一条写在页面上，不藏在代码里 —— 装备是真的、写盘是真的、`prepareChapterRun` 读回来也是真的，
**缺的那一步是入口，不是护符**。

## 4. 重基线（逐条，旧数在新数旁边）

| 项 | 旧 | 新 | 为什么 |
|---|---|---|---|
| `prepare.ts` 的 equipped 分支 | `throw '效果尚未接入'` | 解析成 `preparation.charm` | 本片的功能本身 |
| `ChapterPreparation` | 7 个字段 | **8 个**（+`charm`） | 效果从数据流下去，不进 `player` |
| `CombatSimulation` 的技能冷却 | 三处各写 `6 * …` | 一处 `skillCooldown()`，三处调用 | 见 §1.2 |
| `XpField.advance` | `(player, elapsed)` | `(player, elapsed, radiusScale = 1)` | 拾取半径的唯一读点 |
| `GameCore` 的拾取调用 | `advance(player, dt)` | `advance(player, dt, charmScale('pickup'))` | 同上 |
| `App.vue` 的 `page` 联合 | 6 个成员 | **7 个**（+`'charms'`） | 页面入口 |
| `App.vue` 大厅按钮 | 图鉴 / 战报 / 存档 | 图鉴 / 战报 / **护符** / 存档 | 同上 |
| 全量用例 | 1602 | 见 §5 | 新文件 21 个 `it` |
| 文件数 | 56 | 见 §5 | +1 |
| 账本 | 271 | **271（不变）** | 本片不产生新报告；测量全在测试里 |

**出货路径的读数没有动**：`firstBoss.test.ts`（遗留预言机）、`GameCore.test.ts` 的 `incoming: .44`、
`bossThreat.test.ts` 全部在子集里跑过（18 文件 / 533 用例绿）。原因是结构性的 —— 那两个测试的
`chapter` 都是 `undefined`，而 `charmScale` 在没有 chapter 时返回 `1`，`x * 1` 对任何有限双精度**逐字节相等**。

## 5. 门禁

**57 files / 1623 tests (1766.93 s), all green.** Increment `1623 - 1602 = 21` = `charms.test.ts`'s
21 `it`; files `57 - 56 = 1` ⇒ **no probe survived**. `ledger:verify` OK (**271/271**, rolling 36) and
`git diff --numstat` on the ledger is **empty** after the run - this slice adds no report, and the
rolling reports did not move either, because nothing here touches a harness that writes one.
Subset before the full run: 18 files / 533 tests green (chapter + game + `GameCore` + `firstBoss` +
`bossLifecycle` + `progression` + `evolutionCombat` + `evolvedCombat` + `dragon`).

`vue-tsc --noEmit` clean（首轮两条红都在测试文件：`elites[1] / elites[0]` 在
`noUncheckedIndexedAccess` 下的「可能为 undefined」，不是产品代码）；`vite build` OK；
`smoke` / `audit` / `archive:verify` OK；`context` 见 STATE；`check` 本机跑不了。

## 6. 没有被验证的

- **没有 Playwright**：护符页在手机竖屏上的**样子**没被看见。断言读的是渲染器读的同一个东西
  （`charmViews()` 的返回值 + `App.vue` 源码里的四处连接点 + 面板里那次 `transactOnce` 的写法），不是像素。
- **装备→开战这一步没有走通过**，因为**章节线在 UI 上不可达**（`App.vue` 不传 `:chapter`）。
  本片验证的是这条路上除最后一步之外的全部：写盘 → 重新 `parseSchema30` → `prepareChapterRun` 读回
  → `preparation.charm` 就是那一枚。
- **六个杠杆各自的实战影响没有测量**。本片只证明「杠杆按因子动、且只动它」，**没有**证明
  「带 `MC_SURVIVAL` 的胜率比不带高」。那是平衡片的活，且结局量混沌（≥33 种子），不该混进功能片。

## 7. 已知边界

- **`charms.unlocked` 不校验成员资格**：未知 id 可以躺在里面（`strings()` 只查类型/去重/长度）。
  这是刻意的（D28 决定未来版本存档要能打开），代价是「准备期」必须自己兜底 —— 现在它会抛。
- **一次只能戴一枚**，所以六枚之间没有组合效果，也没有「套装」。TASK 的原话就是「one equipped at a time」。
- **章节线仍不可达**（`R3-U06`）。战报页与护符页都会因此对真实玩家**大概率是空的/装上了没处用** ——
  这两页都照实说了，没有报成「已完成的可玩内容」。
