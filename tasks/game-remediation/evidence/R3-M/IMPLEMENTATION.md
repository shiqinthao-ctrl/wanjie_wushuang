# R3-M01 —— 第一关地图：三条验收里两条名字指的东西不存在，第三条有三个答案

> 裁定见 `DECISIONS.md` **D24**。本片**改变了出货档**（两处），所以按 D23 的规矩带显式重基线清单。
> 仪器：`src/core/mapBounds.test.ts`（**12 个 `it`、约 0.34 s**）；滚动报告
> `evidence/R3-M/map-report.json`；命令产出与读数一一对应，见第 2、4 节。

## 1. 结论先行

`QUEUE.md` #11 那一行要三件事，逐条判定：

| 验收项 | 判定 | 依据 |
|---|---|---|
| **无隐形阻挡** | **空真**（vacuously true） | 全库**没有任何碰撞体**：`collider/obstacle/wall` 在 `src/core`+`src/game`+`src/data` 里零命中，`blocked` 的六处全是「护盾抵挡」「升级被选择阻塞」这类无关语义。所以「没有隐形阻挡」成立的原因是**没有任何阻挡** —— 与那一行想说的不是一回事。已改成强形式断言：走过六个物件的每一步**步长完全相同**（744.64 px / 179 帧 / 每帧 4.16 px，`speed 249.6`） |
| **危险区层级** | **不存在层级** | `firstStage.storyEncounter.hazard` 是**一个对象**不是数组；`Fireline.type` 是字面量 `'fireline'`；`advanceHazards` 只有**一个** push 点。层级是 1 |
| **边界** | **三条规则，不是一条** | 玩家 `clampPoint(p, world, 18)`（`CombatSimulation:298/309/423`、`EvolutionCombat:56`）；敌人**只在出生时** clamp（`spawnRules:64`，margin 30），**移动时没有**；弹道是 `±100` 剔除（`updateOuter`）不是 clamp；敌弹只按 `life` 清（`finishBaseFrame`） |
| **有限随机事件槽** | **半真** | 六个物件来自 `const layout`（`FirstStageMap:12`），且被 `first-map-oracle.json` 的 `layout` **逐字段钉死** ⇒ 改成随机就是作废 oracle，不是「加功能」。地图上唯一的随机量是火线的 `y`（每次触发一次 `random()`）。所以「有限随机事件槽」**有一个**，不是六个 |

## 2. Scope 0 —— 前提核实（命令产出）

**(a) 有没有碰撞体、墙、阻挡区？**

```
$ grep -rn "collider|blocker|blocked|obstacle|wall" src/core src/game src/data | grep -v test
src/core/CombatSimulation.ts:30   ({ type: 'enemy-strike'; outcome: 'hit' | 'blocked' | 'miss' ...})
src/core/CombatSimulation.ts:223  outcome: !inside ? 'miss' : this.player.hp < hp ? 'hit' : 'blocked'
src/core/combatMath.ts:136        const blocked = Math.min(shield, damage); shield -= blocked;
src/core/progression.ts:114       checkLevel(blocked = false)
src/core/RunEvolution.ts:34       ... blocker, not the gate ...
src/core/timedChests.ts:16        ... the chest *count* is the G7 blocker ...
```

零个碰撞体。`blocked` 的六处：两处是「护盾吃掉的伤害」，两处是「升级选择被阻塞」，两处是**注释里**说
「某个东西是 G7 的阻碍」。**没有一处是几何阻挡。** ⇒ 「无隐形阻挡」的防守对象不存在。

**(b) 危险区有几层？**

```
$ node -e "…firstStage.storyEncounter.hazard…"
{"type":"fireline","name":"边境疏火线","desc":"低频横向火线留出明确闪避窗口。",
 "interval":26,"damage":8,"size":36,"life":4}
```

一个对象；`Fireline` 的 `type` 是字面量 `'fireline'`（`FirstStageMap:6`）；`this.hazards` 只在
`advanceHazards:77` 被 push。**一层。**

**(c) 世界边界上谁钳谁？**

```
CombatSimulation:298  p.x += direction.x * step; … clampPoint(p, this.world, 18)   // 闪避
CombatSimulation:309  clampPoint(p, this.world, 18)                                // 技能位移
CombatSimulation:423  p.x += this.response.x * p.speed * … ; clampPoint(p, this.world, 18)  // 摇杆
EvolutionCombat:56    … clampPoint(p, s.world, 18)
spawnRules:64         const enemy: Enemy = clampPoint({ … }, world, 30)            // 只在这一处
CombatSimulation:553  shot.x < -100 || shot.x > world.width + 100 …                // 剔除
FirstBoss:42/137      clampPoint(this.active, this.sim.world, 45)                  // Boss 钳了
```

**玩家钳了、Boss 钳了、普通敌人的移动没钳、弹道按 ±100 剔除、敌弹只按 life 清。** 四种做法。

## 3. 两个真实缺陷（都已修，各一处）

### 3.1 敌人移动没有 clamp —— `charge` 是第一条能把它推出世界的路径

钳制的缺失不是这一片引入的，但它一直**没有可达路径**：`ranged`/`aoe_ranged`/`shield` 的后退方向是
「背离玩家」，而玩家永远在 18 px 内侧 ⇒ 内侧永远有位置，所以几何本身挡住了它。已断言（见 4.1）。

`charge`（上一片 D23 加的）瞄准的是**穿过玩家**：260 px 站位 + 330 px 定距冲刺 ⇒ 必然越过玩家。玩家贴墙
时「越过」就是墙外。实测：

```
player.x = 40, enemy.x = 300, d = 260  →  冲刺后 enemy.x = -30.0
```

一个身体在地图外 30 px、照常发弹、照常结算接触伤害，而玩家被钳在 18 ⇒ **再也够不到它**。

修法（`CombatSimulation.ts:347`，一行）：

```ts
clampPoint(enemy, this.world, enemy.r);
```

放在 `enemyAI` 里两条移动分支**之后**、接触判定之前 ⇒ 冲刺与步行共用同一条规则。

**为什么这条对 `legacy` 是可证明惰性的**：`legacy` 的池里没有 `charge`（`EN004..EN006` 只由 `threat-v2`
读取），而后退/追击都不会越界（4.1 已断言）⇒ 这一行在 `legacy` 里**永不触发**。`first-map-oracle.json`
与 `combat-math-oracle.json` 的读数因此不动。

### 3.2 火线中心钳在世界内 80 px ⇒ 沿墙 44 px 是永久安全区

```ts
// 修前
const y = Math.max(80, Math.min(world.height - 80, …));
```

线宽 36 ⇒ 伤害带是 `[y-18, y+18]`；`y ≥ 80` ⇒ 伤害带最低点 62。玩家钳在 18 ⇒ **`y ≤ 62` 的玩家永远
打不到**（下墙同理 `y ≥ 2338`）。实测（201 个抽样 draw）：修前玩家贴墙时火线的**最近接近距离恒为 62**，
而线宽只有 36 ⇒ 「永远打不到」。

这不是「火线太弱」，是**地图的两条边是免伤区**：贴墙站着，26 秒一次的火线对你完全无效。这也正是那一行
验收里「（或永远打不到）」的那一半。

修法（`FirstStageMap:79-80`，两行）：把钳制对象从**中心**改成**线自己的身体**。

```ts
const edge = hazard.size / 2;
const y = Math.max(edge, Math.min(world.height - edge, …));
```

修后最近接近距离 = **0**（能落在贴墙玩家身上），逃逸仍是 18 px，且线仍然不越界。

**oracle 安全性**：`first-map-oracle.json` 只有一条带 y 的样本（`time 26.01`，玩家 (1800,1200)，
`random = .5` ⇒ y = 1200，取的是**band 中点**，与钳制无关）。改钳制不动它 —— 已实测（`firstMap.test.ts` 绿）。

## 4. 实测读数

### 4.1 地图没有几何

| 读数 | 值 | 仪器 |
|---|---|---|
| 走过每个物件的步长 | **恒定**，`4.16 px/帧`（`speed 249.6 × 1/60`） | `beginFrame` 驱动的摇杆移动，30 帧斜坡 + 179 帧测量 |
| 每个物件的行程 | **744.64 px**（六个全等） | 同上 |
| 物件仍然可交互 | 74.00 可用 / 74.01 不可用 | `useNearest()` |
| 后退不越界 | `minX ≥ r`，且后退后 `x > 起点` | `EN002` 贴墙 + 玩家钳在 18，600 帧 |

### 4.2 边界

| 角色 | 规则 | 余量 | 实测 |
|---|---|---|---|
| 玩家 | clamp | 18 | 四个角逐一 `(18,18) / (3560,18) / (18,2382) / (3560,2382)` |
| 敌人 | clamp（**本片新增**） | `enemy.r` | 修前 `charge` 到 **-30.0**；修后 `minX ≥ r` |
| 弹道 | 剔除 | ±100 | 出界 100 px 内仍在，之后消失 |
| 敌弹 | 只按 life | — | 不钳制（记录，不是缺陷） |

### 4.3 火线

| 读数 | 值 |
|---|---|
| 层级 | **1** |
| 占空比 | `life/interval = 4/26 = 15.38%` |
| 最坏逃逸 | `size/2 = 18 px` = **0.0721 s**（`speed 249.6`） |
| 窗口 | `life = 4 s` |
| 窗口 / 需求 | **55.5×** |
| 修前贴墙最近距离 | **62 px**（线宽 36 ⇒ 打不到） |
| 修后贴墙最近距离 | **0 px**（打得到） |
| 视口 390×844 / 390×600 / 1280×720 同一 draw 的 y | **1029 / 1090 / 1060** |
| 是否伤小怪 | **否**（记录，见第 7 节） |

「留出明确闪避窗口」这句话**成立**，但它不是「窗口刚好够」而是「窗口是需求的 55 倍」：4 秒里只需要
0.072 秒。所以火线的真实功能不是**威胁**，是**节奏**（每 26 秒有 4 秒的一条横线把场地切两半）。

## 5. 重基线 —— 12 份在册报告移动，1 份新增

两处改动都只作用于「贴着世界边缘」的状态，所以移动的报告全部是**跑完一整局**的读数（胜率、HP 地板、
TTK、招式命中），没有一份读纯数学。**方向一致：略微变难** —— 火线现在打得到贴墙的玩家，而越界的
`charge` 现在留在场内继续参与接触。

| 报告 | 代表字段 | 前 → 后 |
|---|---|---|
| `R1g-12/boss-cadence-report` | `sweep[0].browser.wins` | 60 → **58**（`winRate` .9091 → **.8788**） |
| `R1g-12/boss-cadence-report` | `sweep[0].browser.hpMinMedian` | .464 → **.452** |
| `R1g-12/boss-hud-arms` / `boss-hud-report` | `before.browser.wins` | 60 → **58**（同一条 run，两份报告） |
| `R1g-12/boss-threat-report` | `sweep[0].losses.defeat / timeout` | 2/4 → **3/5** |
| `R1g-12/boss-report` | `cells[0].hpAtSpawnMedian` | 739 → **743** |
| `R1g-12/manual-report` | `headline.manualShare` | .3716 → **.3718** |
| `R1g-12/threat-report` | `distribution[1].hpMinMedian` | .396 → **.336** |
| `R1g-12/fusion-report` | `trace[30].chests[3].options[0]` | `evo:E015` → **`upgrade`** |
| `R2-D/build-report` | `heroes[0].evolutionsPerRun` | 2.5 → **2.49**（`victory` 117 → **115**） |
| `R2-F-BOSSPHASE` | `counterfactual.classic` total / moved | 71 / 63 → **70 / 62** |
| `R2-F-CADENCE` | `rows[0].perJourney[0].cheapestMove` | .1853 → **.2206**（`perShape[1].hits` 1 → **2**） |
| `R2-F-CIRCLE` | `reach[1].perPolicy[0].perJourney[].circleHits` | 18/10 → **19/11** |
| `R3-M/map-report` | **新增** | — |

**4 条断言重基线**（3 个文件）：

| 文件 | 断言 | 前 → 后 | 判定 |
|---|---|---|---|
| `byteLedger` ×2 | 账本覆盖 / 行数 | 缺 1 份新报告 | **机械**：`ledger:write` 后转绿（267 → **268**，滚动 32 → **33**） |
| `bossThreat` BOSSPHASE | classic 反事实 total/moved | 71/63 → **70/62** | **钉读数**（88.6% / 100% 不变，claim 存活） |
| `manualDamage` classic/unlock | 转折点上界 | D23 的 `≥1` → **`≤1`** | **改成上界**：D23 读到 1、本片读到 0，两次都在「至多 1」之内。钉一个 33 局混沌序列的**最大值**会在任何合法平衡改动上翻转 —— 这正是同文件 `:801` 自己写的教训 |

**为什么改上界而不是改回 `toBe(0)`**：`toBe(0)` 在 D23 被证伪过一次；本片回到 0 只说明那个 1 是尾巴，
不是结构。**「至多 1」在两次读数下都成立，且正是 D3 需要的那个量**（classic 按 3 分记，实测上界 1）。

## 6. 门禁

| 项 | 结果 |
|---|---|
| 全量套件（干净树） | **51 文件 / 1531 用例全绿，1660.69 s** = 1519 + **12**、50 + **1** —— 两个增量与新文件的 `it` 数、文件数**逐一相等** ⇒ 无探针残留 |
| `vue-tsc --noEmit` | clean（`tsc --noEmit` 会因 `.vue` 模块报错，那不是本片的） |
| 账本 | `LEDGER OK`：**268/268**，滚动 **33**，`stale 0`、`moved 0`、`missing 0`、`extra 0` |
| `smoke` / `audit` / `archive:verify` | OK / OK（20 talents、无永久光环减速）/ OK（30/30 + 12 文档） |
| `context` | **8176 / 8192** |
| `check` | 本机跑不了（`child_process` 被拦），等价项已手工执行 |

**过程读数**：首轮全量 **51 文件 / 1531 用例、4 条红**（`byteLedger`×2 机械、`BOSSPHASE` 71/63、
`manualDamage` 的上界）⇒ 补完后**只复跑受影响的 3 个文件**（`bossThreat` 单文件就要 **27 分钟**，
`manualDamage` 5.6 分钟）⇒ 再跑一次干净全量取上面那组数。

## 7. 已知边界与写回队列

1. **无 Playwright**：火线的画法（`src/game/MapView.ts:14`）没有被看过。断言读的是渲染器读的同一个字段
   （`renderState().hazards` 的 `y/h/life`），但**画面本身未验证**。
2. **`charge` 的预警线没有 clamp**：撞墙时身体走的比线短（线仍是 330 px）。**公告与实际路径在墙角处不一致**
   —— 这是设计形状（公告是「意图」），但写在这里，别让下一个人当成 bug 去「修」。
3. **`hazardPeak` 是死字段**：`CombatSimulation:77` 声明、**全库零写入零读取**。要么给它一个读者，要么删掉；
   本片不动（不在 scope 内，且删字段会动 `history` 的形状）。
4. **火线只伤玩家、不伤小怪**：一条横贯全图的火线，队伍走过去毫发无伤。这是**设计问题不是实现问题**，
   写回 `R3-M02`（危险区作为「场地机制」而不是「玩家障碍」）。
5. **火线的 y 是屏幕空间**：band 由 `viewport.height` 推出 ⇒ **同种子跨设备不可复现**。「seeded ⇒ 可复现」
   只在一个视口下成立。这是有意的（线必须出现在你看得见的地方），但它是「可复现」这个词的边界。
6. **队列措辞已改**（`QUEUE.md` #11）：`有限随机事件槽` → `一个种子化的随机危险区 + 六个固定的交互物`。
   一个固定布局是正当设计；把固定布局叫随机是队列在说谎。

## 8. 新增/改动文件

| 文件 | 性质 |
|---|---|
| `src/core/CombatSimulation.ts:347` | **生产**：敌人移动后的 clamp |
| `src/core/FirstStageMap.ts:79-80` | **生产**：火线钳制对象从中心改成线体 |
| `src/core/mapBounds.test.ts` | **新仪器**，12 个 `it` |
| `evidence/R3-M/map-report.json` | 滚动报告（账本新增 1 行） |
| `evidence/R3-M/IMPLEMENTATION.md` | 本页 |
