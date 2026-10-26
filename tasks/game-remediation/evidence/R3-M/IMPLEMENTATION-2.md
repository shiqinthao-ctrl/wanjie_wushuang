# R3-M02 — 荒原镇界：三道锁、一个类型谎言，和一条谁都没走的门

**队列 #12**。`catalog.ts:12` 声明 `CH001-02 荒原镇界`：`duration 420`、`boss: null`、
`seals: [{90,20},{180,20},{270,20}]`。这一行要的是「三镇界阵、累计驻守、超时目标提示」。

**结论先行**：`seals` 在全库**零生产读者**；而这个关卡**根本进不去** —— 不是一道锁，是**三道**，
其中一道在**类型系统里**。开门之后还有两处**首帧崩溃**和一个**永远无法达成的胜利条件**。
本片把门打开、把界碑实现、把胜利条件补上，并把「界碑要多大」这个数用**扫描**定下来。

---

## 1. Scope 0：逐条判定（全部命令产出）

### (a) 有没有东西读 `seals`？

```
$ grep -rn "seals" src/ --include=*.ts --include=*.vue
src/chapter/catalog.ts:11   ... seals: [],
src/chapter/catalog.ts:12   ... seals: [{opensAt:90,...}]
src/chapter/catalog.ts:13   ... seals: [],
src/chapter/contracts.test.ts:42  expect(chapterStages[1]!.seals).toEqual([...])
```

**三行数据 + 一条断言**。断言读的是**数据本身**，不是行为。`seals` 与 `hazardPeak` 同类，
区别是它至少还被一条测试数过。

### (b) 今天能构造 `CH001-02` 吗？—— 三道锁

| 锁 | 位置 | 形态 |
|---|---|---|
| 1 | `prepare.ts:13` | `if (options.stageId !== 'CH001-01') throw new Error('此精品关卡尚未开放。')` |
| 2 | `prepare.ts:26` | `stage: structuredClone(chapterStages[0])` —— 不看 `stageId`，永远克隆第一行 |
| 3 | `contracts.test.ts:48` | 把 `{ stageId: 'CH001-02' }` 列进**必须抛错**的表 |

**还有第四道，在类型里**。`ChapterRunOptions.stageId` 是字面量 `'CH001-01'`，而
`stage: structuredClone(chapterStages[0])` 让 `stage` 的类型等于**第一行**的类型：

```
boss:   { readonly id: "B001"; readonly spawnAt: 270 }     // 非空
seals:  readonly []                                        // 空元组
duration: 360                                              // 字面量
```

也就是说**类型系统在替数据撒谎**：它声称每个关卡都有 Boss、都没有界碑。把
`stageId` 换成数据真正承认的联合（`ChapterStageId = (typeof chapterStages)[number]['id']`）
之后，`vue-tsc` 立刻点名**恰好两处**：

```
src/chapter/settlement.ts(32,83): error TS18047: 'preparation.stage.boss' is possibly 'null'.
src/core/FirstBoss.ts(34,92): error TS2531: Object is possibly 'null'.
```

两处都是 `stage.boss.spawnAt`。**这不是「需要加个守卫」，是两处首帧崩溃**。实测（探针，已删）：

```
PROBE_ERROR TypeError: Cannot read properties of null (reading 'spawnAt')
```

`FirstBoss.spawn()` 在**第一帧**就被调用 ⇒ 关卡能构造的那一刻就崩，连画面都出不来。
「打不开的门」把这两个崩溃挡住了 —— 门和崩溃是同一个 bug 的两面。

### (c) `dwell: 20` 是哪种？

数据是 `{ opensAt, dwell }`，一个数。它自然读作**「连续 20 秒」**（离开即清零）。
队列写的「**累计驻守，离开不清零**」是**另一种规则**：累计、离开暂停。两者都能用一个数表达，
数据形状**不区分**它们 —— 这是设计决定，不是实现细节（见 §3）。

### (d) `boss: null` 的关卡靠什么结束？

**超时已经存在**：`FirstBoss.ts:170` 读 `chapter?.stage.duration ?? firstStage.duration`。
缺的是**胜利**：`updateObjective()` 只在 `defeatedAt !== undefined` 时返回 `'victory'`，而
`defeatedAt` 只能由 `defeat()` 写 —— 没有 Boss 就没有 `defeat()`。⇒ **没有 Boss 的关卡只能超时或阵亡，
永远赢不了**。`settlement.ts:33` 同样把 `completed` 钉成 `bossDefeated && bossLootClaimed`。

**外加一个 UI 谎言**：`snapshot().phase` 在 `time >= 250` 时返回 `'warning'`，与关卡无关。
在 `boss: null` 的关卡里，HUD 会在第 250 秒宣布「首领即将登场」，然后**永远不会来**。
`BattleView` 的 `stage-note` 还把 `边境破围` 和 `06:00` 写死给所有章节关卡。

### (e) 还有一个不在队列里的发现：**整个章节线在 UI 上不可达**

```
$ grep -rn "BattleView" src/App.vue
src/App.vue:61:  <BattleView ... :slot :repository :journey @exit @replay />
```

`:chapter` **从来没被传过**。`mountBattle(..., chapter?)` 与 `prepareChapterRun` 只被测试和
`GameCore` 的显式参数调用。⇒ 开门让 `CH001-02` **可构造**，不等于**可玩**。
关卡选择页属于 `R3-U`（队列 #18–19，页面工作排在机制之后）。本片把它写进交付，不在这里补。

---

## 2. 交付

| 文件 | 改动 |
|---|---|
| `chapter/catalog.ts` | 新增 `ChapterStageId`（数据承认的联合）与 `SealRule` |
| `chapter/prepare.ts` | `stageId` 用联合类型；`OPEN_STAGES = ['CH001-01','CH001-02']` 是**策略**（一行、可见）；按 id 取行，不再克隆 `[0]` |
| `chapter/Seals.ts` | **新**。三处界碑的运行时：位置、半径、驻守进度、`snapshot()`、`renderState()`、`updateObjective()` |
| `chapter/settlement.ts` | `ChapterFinalRun.sealsHeld`；`completed` 按关卡目标分流；界碑胜利的时间下界；`boss` 解引用守卫 |
| `core/FirstBoss.ts` | `bossAt()`：无 Boss 的关卡返回 `undefined`（不刷、不预告）；`phase` 的 250 改为 `at - 20` 派生 |
| `core/CombatSimulation.ts` | `seals?: ChapterSeals`；`finishBaseFrame` 里与地图危险区同一个时钟推进 |
| `core/GameCore.ts` | `UiSnapshot.stage / .seals`；胜利判定 `seals ?? bossEncounter`；`captureFinal` 写 `sealsHeld` |
| `core/FirstStageMap.ts` | `direction` 改为导出（八向罗盘只有一份，界碑与地图共用） |
| `game/MapView.ts` | 画三处界碑（锁定/开启/镇守中/已镇守 + 进度弧） |
| `game/mountBattle.ts` | 把 `renderState().seals` 交给地图层 |
| `ui/BattleView.vue` | `objective` 计算属性（按关卡取文案）、界碑指引面板、标题取 `stage.name` |
| `ui/ChapterResult.vue` | 界碑关卡的胜负文案（`镇界完成` / `镇界超时`） |
| `chapter/seals.test.ts` | **新**，13 个 `it`、1.8 s |
| `evidence/R3-M/seal-report.json` | **滚动**，每次运行覆写 |

**没有第二份界碑格式**：`opensAt` / `dwell` 仍然只有 `catalog.ts` 一处声明；
`Seals.ts` 只拥有**位置与半径**，与 `FirstStageMap.layout` 拥有六个交互物是同一类分工。

---

## 3. 规则判定：连续 vs 累计（**连续**，附价格）

**选定：连续**。站进圈里累计，**离开立刻清零**。理由三条：

1. 它是 `dwell: 20` 的字面读法。选累计就得给这个字段换名字或加第二个字段 ——
   而 `TASK.md` 明令「不要发明第二份界碑格式」。
2. 「镇界」的动词是**驻守**。可以随时走开再续上的据点，不是据点。
3. 它让「离开」成为一个**可断言的边界**，而不是一个无人测试的分支。

**价格（实测，同一条轨迹）**：站 19.9 s → 出去 **2 帧（0.0333 s）** → 回来。

| 规则 | 拿到界碑所需总时长 | 离开的代价 |
|---|---|---|
| **连续（出货）** | **40.0333 s** | 19.9 s 归零，重来 |
| 累计（未出货） | **20.0 s** | 无 |

**这条规则不是第二段代码**：`seals.test.ts` 从同一串位置里重算累计值，把它当作**反事实**报出来。
一个只可能停在一边的开关，是没人能测的开关。

**代价写清**：连续规则下，被推出圈一次就是 20 秒的惩罚。缓解不在规则里，在**半径**里（§4）——
圈够大，玩家才不必用「贴边站」换生存。

---

## 4. 半径是这条机制的承重数字（扫描，九个样本 × 五档）

`SEAL_RADIUS` 不是装饰。第一版取 84 px，参考玩家（绕圈 + 闪避 + 奥义 + 低血优先恢复）
**一个都赢不了**。两轮扫描（同一支机器人、同一个种子 15 的绕行半径臂，加六种子臂）：

| 半径 | 直径 / 390 px 屏宽 | 样本 | 胜 | 终局血量（/620） |
|---|---|---|---|---|
| **84** | 43% | 3 个绕行半径 | **0/3** | 全灭（最好 2/3，死于 243.4 s） |
| **120** | 62% | 6 种子 + 3 绕行 | 9/9 | 16 – 309（**2.6% – 50%**） |
| **140** | 72% | 6 种子 | 6/6 | 35 – 300（**5.6% – 48%**） |
| **160（出货）** | 82% | 6 种子 + 3 绕行 | **9/9** | **190 – 385（30.6% – 62%**） |
| 200 | 103% | 3 个绕行半径 | 3/3 | 299 – 404（48% – 65%） |

**为什么是 160**：120 与 140 也赢，但**最差样本只剩 2.6%–5.6% 血** —— 那是**完美反应的机器**
才守得住的余量，人类会输在那些样本上。160 是第一个「最差样本仍剩三成血」的值，
即人类有、而机器不需要的那份余量。200 太宽（圈占满屏，界碑退化成「待在场上」）。
**84 的读数最有价值**：它证明这个数不是手感问题 —— 同样的机器人、同样的种子，
只改这一个常量，就从「必死」变成「稳赢」。

**这九个数不是「平衡已定」，是「机制第一次可通关」**：种子只取了 6 个，`AGENTS.md` 对平衡数字
要求 33 种子起步；本片的 claim 只是「存在一组可通关的配置」，33 种子扫描属于平衡切片。

**代价写清**：160 让界碑比 84 容易得多。圈越大，`hold` 越接近「正常打」，机制越薄。
这是本片**主动选择**的方向：先让它**能通关**，再谈难度。

---

## 5. 读数（`seal-report.json`，每次运行重算）

**三处界碑**（世界 3600 × 2400，位置是世界比例，随视口放大）：

| # | x | y | r | opensAt | dwell |
|---|---|---|---|---|---|
| 一 | 1800 | 552 | 160 | 90 | 20 |
| 二 | 972 | 1848 | 160 | 180 | 20 |
| 三 | 2628 | 1848 | 160 | 270 | 20 |

**胜局（参考玩家，种子 15 / 7 / 99）**：

| 种子 | 结局 | 时刻 | 界碑 | 终局血量 | 等级 | 击杀 | 闪避 / 奥义 |
|---|---|---|---|---|---|---|---|
| 15 | victory | **289.98** | 3/3 | 283.4 | 18 | 514 | 17 / 7 |
| 7 | victory | **289.98** | 3/3 | 384.6 | 17 | 528 | 12 / 7 |
| 99 | victory | **289.98** | 3/3 | 379.8 | 17 | 531 | 11 / 7 |

（扫描时另外三个种子 1 / 21 / 42 也在 160 px 下全胜：213.0 / 361.0 / 340.0。）

**289.98 = 270 + 20 − 1 帧**：第三处界碑 270 s 开启、驻守 20 s ⇒ **290 s 是这个关卡的理论最早胜利时刻**。
三个种子都打在理论值上，说明**关卡的时间结构**（不是运气）决定了这个数；离 420 s 的时限还有 **130 s** 余量。

**超时**：`time = 420`、`sealsHeld = 0`、`endReason = timeout`，且 `validateChapterFinal` 接受它
（`run.time === stage.duration` 是超时分支的既有要求，界碑关卡照样满足）。

**镇守边界**：站 19.9 s → 出圈 2 帧 ⇒ `progress = 0`、`state = 'open'`、`notice = 界碑一 · 镇守中断`；
回来需要**完整 20 s**。半径边界：`84 px 内` 累计、`85 px 外` 清零（半径是**身体**的边界，
不是中心的 —— 与 D24 火线同一个教训）。

**「站桩」是不可行的**（这解释了为什么驻守要能边走边守）：同一机器人**站定不动**在第一处界碑
死于 **109.1 s**，差 0.9 秒没守满 20 秒。⇒ 圈必须大到能在里面走位，这是 §4 扫描的前提。

---

## 6. 可读性：断言读的字段，就是渲染器读的字段

| 表面 | 字段 | 谁读 |
|---|---|---|
| 地图上的三处圈 | `renderState().seals[i].{x,y,r,state,ratio}` | `MapView.draw` |
| HUD 的界碑面板 | `snapshot().seals.{held,total,next,notice}` | `BattleView` |
| 目标行 | `snapshot().stage.{name,duration}` + `seals.held/total` | `BattleView.objective` |
| 结算标题 | `snapshot().seals` 是否存在 | `ChapterResult` |

**一致性断言**：`seals.test.ts` 逐项比对 `renderState().seals[i].state` 与 `snapshot().seals.rows[i].state`，
以及 `ratio === progress / dwell`。**没有 Playwright**，所以几何/颜色/淡出**没有被看见** ——
只保证「渲染器读的字段被断言」，不保证「画面好看」。这一句要跟着数字一起说。

---

## 7. 重基线

**生产侧只影响章节线**。`threat-v2`（出货档）与 `legacy` 都**没有**界碑：`seals` 只从
`chapter.stage.seals` 来，而章节线是 `legacy` 规则、且从 `App.vue` 不可达 ⇒ **在册报告一份都没动**。

**`git diff --numstat tasks/game-remediation/evidence/` 只有一行：**

```
1	0	tasks/game-remediation/evidence/R2-F-CAP/cap10-md5.txt
```

**这一行不是报告移动，是 md5 清单多了一行。** `cap10-md5.txt` 是**证据树的逐文件 md5 清单**
（每行 `md5 *./路径`），新增 `seal-report.json` ⇒ 清单 `268 → 269` 行。判据：
**清单行数 == 账本行数**（`wc -l` 得 **269**，`byte-ledger` 也是 **269**）。
**不要拿「证据树里的 json 数」当分母**：`find evidence -name '*.json'` 是 **760**，因为
`attempt-*/` 里躺着 491 个 Playwright 落盘产物 —— **「在册报告」和「证据树里的文件」是两个集合**，
混用会得到一个看起来很专业、但谁也对不上的数。初稿把这句话写成
「对既有报告零输出」，是**用 `git status` 的印象替代了 `numstat` 的读数** —— 与 D24 那条
「`git status` 答的是『文件有没有被碰过』，不是『内容有没有变』」同一个坑的**第二层**：
`numstat` 有了读数，也要问**这一行是内容还是清单**。

**3 条断言重基线**（都是合同变化，不是读数漂移）：

| 文件 | 断言 | 前 → 后 | 判定 |
|---|---|---|---|
| `contracts.test.ts` | `CH001-02` 必须被拒绝 | 拒绝 → **接受**，并断言拿回的是**第二行** | **合同被兑现**（队列 #12 的前提） |
| `contracts.test.ts` | 拒绝列表 | 含 `CH001-02` → 含 `CH001-03` + `CH001-04` | 保留 `CH001-03`（两精英未定义）；`CH001-04` 不存在，守住「按 id 查表」 |
| `contracts.test.ts` / `chapterHarness.ts` | `ChapterFinalRun` 字面量 | 缺 `sealsHeld` → `0` | **机械**：新字段必须被生产者写 |

**账本 268 → 269**（滚动 33 → 34）。

---

## 8. 门禁

- `vue-tsc --noEmit` clean（`tsc --noEmit` 会因 `.vue` 模块报错，那不是本片的）。
- `seals.test.ts`：**13 个 `it`、1.8 s**。
- 子集（`src/chapter/` + `src/game/` + `firstMap` + `mapBounds` + `GameCore`）：**14 文件全绿**。
- 账本：`LEDGER OK` 269/269，滚动 34，stale 0、moved 0。
- `smoke` / `audit` / `archive:verify` OK；`context` **8059 / 8192**。
- **全量：52 files / 1544 tests，全过，1844.68 s**（`EXIT=0`）。
  **两个增量逐一等于新文件：** `1544 - 1531 = 13` = `seals.test.ts` 的 `it` 数；
  `52 - 51 = 1` = 新增的**一个**文件。**所以没有探针存活** —— 按 D23 起的判据，
  探针的签名是「`+N ≠ 本片 it 数` **且** `文件数 +1`」两条同时出现。
- `npm run check` 在本机跑不了（`child_process` 被拦）；等价核查 = `vue-tsc` + 上述四项。

---

## 9. 已知边界（记录，不改）

1. **章节线在 UI 上不可达**（`App.vue:61` 不传 `:chapter`）⇒ 界碑只有**代码可玩**，没有**玩家可玩**。
   入口是 `R3-U` 的活。这是本片最大的一条，也是「开门 ≠ 可玩」的实例。
2. **`CH001-03` 仍然关着**：它的两个精英还没有定义（`R3-E01..07c`），`CH001_ALTAR` 也没有 Boss 配置。
   开它等于把一个明确的报错换成「打得进去、赢不了」。
3. **报告不记 `sealsHeld`**：`ChapterReport` 是持久化 schema，本片不扩它（旧存档会缺字段）。
   界碑胜利在战报里只体现为 `endReason: 'victory'` —— 足够结算，不足以复盘。
4. **火线不伤小怪**（D24 写回）在本关卡**不适用**：章节线里 `FirstStageMap` 是关的
   （`enabled = !chapter`），所以 `CH001-02` 没有火线、没有六个交互物、没有中途恢复。
   这是既有设计，不是本片删的。
5. **三处界碑的位置是常量**，与 `first-map-oracle.json` 无关（那个 oracle 只钉第一关的六个交互物）。
   位置随世界尺寸缩放（比例，不是像素）。
6. **`duration: 420` 在胜利路径上用不到**：290 s 就赢了，剩 130 s 是给「守不住、但也没死」的玩家留的。
   超时只在「活到 420 s 且没守满三处」时发生 —— 那是失败者的第二种输法，不是主路径。
