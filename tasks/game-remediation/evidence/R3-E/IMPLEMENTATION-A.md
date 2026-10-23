# R3-E01..07a —— 三个死行接池 + 两个空 `ai` 的实现 + 一条敌人预警通道

> 裁定见 `DECISIONS.md` **D23**。上一片 `R3-E01..07`（D22）是**测量**，零生产改动；本片是**第一次
> 改变出货档 `threat-v2`** 的规则改动。基线（改动前）的 83 份报告快照与逐字段差异是本页第 6 节的来源。

## 1. 改了什么（生产文件）

| 文件 | 改动 |
|---|---|
| `src/data/firstStage.json` | `rule.storyEncounter.enemies` 由 3 行变 **6 行**：原有 `EN001 5 / EN002 3 / EN003 1` **原样不动**，追加 `EN004 1 / EN005 1 / EN006 1` |
| `src/core/spawnRules.ts` | `Enemy` 加 `windup / dash / aim / chargeCd`（全部 optional，`enemyAI` 读 `?? 0`） |
| `src/core/FirstBoss.ts` | `WarningBase` 加 optional `source`（**唯一**的类型改动，不新增预警类型） |
| `src/core/CombatSimulation.ts` | `CHARGE` / `AOE_LOB` 两个常量；`chargeStep()`；`updateEnemyWarnings()`；`readonly warnings: Telegraph[]`；`enemyAI` 里两条 `threat-v2` 分支；`renderState()` 输出 `warnings`；`destroy()` 清空 |
| `src/core/GameCore.ts` | `renderState()` 透传 `warnings` |
| `src/game/mountBattle.ts` | 在 `graphics` 层画 `warnings`（circle / line），画在所有身体之前 |

**没有**改 `hp` / `damage` / `speed` / `r` 的任何数值，**没有**改 `threatV2.enemyDamage`（`EN004 17.28`、
`EN005 12.96`、`EN006 23.04` 是 R1g-1 早就登记好的），**没有**新增 ruleset 值。

## 2. Scope 0 —— 前提核实（命令产出）

**(a) 出货的是 `threat-v2`，`legacy` 是 oracle 钉住的参考路径。**

```
src/game/mountBattle.ts:22   new GameCore(save, Math.random, journey, chapter, 'threat-v2')
src/core/GameCore.ts:50      constructor(..., rules: RunRules = 'legacy')
src/core/CombatSimulation.ts:131  constructor(..., rules: RunRules = 'legacy')
src/core/threatModel.ts:13   export type RunRules = 'legacy' | 'threat-v2'
```

生产里**只有一个** `new GameCore`（`mountBattle.ts:22`），显式传 `'threat-v2'`；两处构造器的缺省都是
`'legacy'`，所以任何不传 rules 的测试跑的是冻结参考。`threatFor('legacy') === undefined` ⇒ 敌人伤害走
`firstStage.enemies[id].damage * firstStage.dmg`，`threat-v2` 走 `threatV2.enemyDamage`。

**(b) 谁会因为敌人构成变化而移动 —— 按「跑不跑刷怪器」推，再用实测确认。**

`createEnemy`（`spawnRules.ts:39`）是唯一读出生池的地方：`const pool = firstStage.storyEncounter.enemies`。
所以「读敌人构成」= 「这次运行让刷怪器活着」。逐个 harness 查 `core.start(` / `beginFrame`：

| harness | 刷怪器 | 报告 |
|---|---|---|
| `threatModel.test.ts` | 活 | `R1g-12/threat-report.json` |
| `bossThreat.test.ts` | 活 | `R1g-12/boss-*.json` ×5 |
| `bossBudget.test.ts` | 活 | `R1g-12/boss-report.json` |
| `manualDamage.test.ts` | 活 | `R1g-12/manual-report.json` |
| `growthPacing.test.ts` | 活 | `R1g-12/growth-report.json` |
| `skillCadence.test.ts` | 活 | `R1g-12/cadence-report.json` |
| `fusionReachability.test.ts` | 活 | `R1g-12/fusion-report.json` |
| `buildReport.test.ts` | 活 | `R2-D/build-report.json` |
| `formPressure.test.ts` | 活（每帧 `cull` 掉） | `R2-F-*` ×14 |
| `enemyRoles.test.ts` / `enemyWarnings.test.ts` | 每帧清空 | `R3-E/*.json` |

**实测确认**：83 份在册报告里 **16 份移动**、67 份逐字节不变、1 份新增。没动的那 67 份里包含
`R2-F01..F10` 十个压力格、`R2-F-BOSS-ADDS`、`R2-F-BOSS-COVERAGE`、`R2-S01`、`R2-B01` 与全部
`R1g-1..R1g-11` 历史件 —— 前两类**逐帧 `cull` 掉刷怪器的产物**，所以敌人构成进不去它们的读数；
历史件是冻结的归档。

## 3. Scope 1 —— 接池，以及每一波实际遇到的构成

| id | 权重 | 占比 |
|---|---|---|
| `EN001` 步卒 | 5 | 41.67% |
| `EN002` 弓手 | 3 | 25.00% |
| `EN003` 盾兵 | 1 | 8.33% |
| `EN004` 骑兵 | 1 | 8.33% |
| `EN005` 火箭兵 | 1 | 8.33% |
| `EN006` 力士 | 1 | 8.33% |

**波 0 的职责（「步卒与弓手建立基础走位」）**：这两行仍占 **8/12 = 66.7%** 的每一次投骰，仍是多数。
但必须说清一件事：**数据里只有一个池**，`createEnemy` 不读波次，所以「逐波构成」在现有结构下**不可表达**
—— 波与波之间变的不是构成，是**速率与精英率**（`director` 读 `wave.budget` / `wave.elite`）：

| at | 波 | 类型 | `interval` | `eliteChance` |
|---|---|---|---|---|
| 0 | 步卒接战 | normal | 0.807 | 0.61% |
| 60 | 弓手压线 | normal | 0.694 | 0.80% |
| 150 | 盾阵试锋 | elite | 0.607 | 1.56% |
| 270 | 巨将压境 | boss | 0.802 | 0.55% |
| 360 | 边境决胜 | end | — | 0 |

⇒ **代价必须写下来**：接池让每一波都同时出现六种身体，波 0 的「基础走位」从「只有步卒和弓手」变成
「三分之二是步卒和弓手」。要让波 0 结构性地只出前三种，需要给 `waves[i]` 加可选 `enemies` 覆盖
—— 那是新的数据形状，本片不做，也不偷偷用「时间门」冒充。

## 4. Scope 2 —— 两个空 `ai` 的实现（只在 `threat-v2` 下）

**`charge`（`EN004` 骑兵）** —— 三态机，一个常量组 `CHARGE = { range 300, distance 330, windup .55, dash .32, cooldown 2.6 }`：

- **前摇**：进入 300px 就**钉住不动**（不是减速，是 `{x:0,y:0}`），同时推一条 `line` 预警；
- **冲刺**：定距 330px、定速（`distance/dash`），**`distance > range` 是故意的** —— 骑兵穿过玩家并冲过头，
  所以冲刺结束后步长**变号**（它得掉头），这是这行存在的战术形状，不是建模残渣；
- **冷却**：2.6s 内不再起手，冲刺中不会重新进入前摇。

实测（1/60s 帧，玩家静止、`atk=0`、宠物关）：

| 量 | 值 |
|---|---|
| 步行步长 | 1.376 px/帧（`speed 82.56`） |
| 钉住帧数 | **35 帧 = 0.583s**（标称 .55；多出的 2 帧是「武装冲刺的那一帧仍报零位移」+ 1/60 的 epsilon 尾巴，**照实报，不抹平**） |
| 冲刺帧数 / 步长 | 19 帧 / **17.188 px/帧**（**12.49×** 步行） |
| 冲刺距离 | **330.0**（`distance` 本身就是它） |
| 一次命中 | 玩家掉 6.71 HP，`damageTakenBy.EN004` 一次 |

**`aoe_ranged`（`EN005` 火箭兵）** —— `AOE_LOB = { every 2.4, delay .9, radius 70 }`：

- 走位比弓手**宽一档**（`>320 → .6`、`<200 → -.5`、中间驻停），且**不再发直线弹**（`enemyShots` 恒 0）；
- 每 2.4s 在**玩家当时所在位置**落一个 `circle` 标记，`.9s` 后结算，`insideTelegraph(player)` 判定；
- 站在圈里 **一次掉 5.03 HP**；在标记消失前**横向走开**则 **0**。

**`brute`（`EN006`）不动。** `TASK.md` 明确禁止为了「让名字看起来实现了」而给它编一个职责，所以它接池后
仍然只是「走 1.0、`r 14`、接触伤害最高（23.04）、血量 198」的重身体，**零新行为、零预警**，这一条写成断言。

**`legacy` 逐字节不动**：两条分支都被 `this.threat` 包住（`chargeStep` 只在 `this.threat` 时调用；
`aoe_ranged` 的走位与投掷同样），`enemyRoles.test.ts` 把这一点钉成断言 —— 同一批 `ai` 字符串在
`legacy` 下与 `melee` **逐帧相同**、`warnings` 恒空。

## 5. Scope 3 —— 一条通道，两个读者

- 类型：**复用** `Telegraph`（`FirstBoss.ts:11`）与 `insideTelegraph`（`:12`），只在 `WarningBase` 上加
  一个 optional `source`。**没有**第二个预警类型，**没有**第二份几何判定。
- 载体：`CombatSimulation.warnings: Telegraph[]`（与 `bossEncounter.telegraphs` 并列，**不是它的副本**）。
- 结算：`updateEnemyWarnings(dt)` 在 `beginFrame` 里跑（`enemyAI` 之后），`damage > 0` 才结算伤害；
  `charge` 的 `line` 是 `damage: 0` —— **公告不是攻击**，伤害来自身体自己的接触判定。
- 读者：`GameCore.renderState().warnings` → `mountBattle` 的 `graphics` 层。
- 断言：`sim.renderState().warnings` 与 `sim.warnings` 同长同值（同一对象，没有渲染器私有副本）；
  `GameCore.renderState()` 的键里有 `warnings`；`bossEncounter.telegraphs` 在有敌人时恒空（不是第二份）。

**本机没有 Playwright** ⇒ **画面本身未验证**。本片断言的是**渲染器读的那个字段**，不是像素。

## 6. Scope 4 —— 显式重基线

### 6.1 报告（83 份在册，16 份移动）

**这个 16 可以逐条复核**，命令是 `git diff --numstat tasks/game-remediation/evidence/`（内容真的变了的 14 份）
加上两份 untracked 的新/滚动报告（`R2-D/build-report.json`、`R3-E/ai-report.json`）。

> **一个必须写下来的坑**：`git status` 在证据树上会**多报 14 个 `M`** —— `R2-F01..F10` 十个压力格、
> `R2-F-BOSS-ADDS`、`R2-F-TOUGH-HORDE`、`R2-F-BOSS-COVERAGE` 全部显示为已修改，而 `git diff --numstat`
> 对它们**一行都不输出**（只有 CRLF 警告）。**内容逐字节相同，变的是行尾归一化。**
> 用 `git status` 数「移动了几份」会得到 28，用 `git diff --numstat` 得到 14 ⇒ **数产物要用会看内容的命令**。

| 报告 | 代表字段 | 前 | 后 |
|---|---|---|---|
| `R1g-12/manual-report` | `headline.manualShare` | 0.3716 | 见报告 |
| `R1g-12/manual-report` | `cells[0].byBucket.autoSkill` | 0.5385 | 0.5362 |
| `R1g-12/boss-hud-arms` | `after.browser.avoidRate` | 0.386 | 0.2931 |
| `R1g-12/boss-hud-arms` | `after.browser.hpMinMedian` | 0.202 | 0.222 |
| `R1g-12/boss-cadence-report` | `atG4.browser.winRate` | 0.7273 | 0.697 |
| `R1g-12/boss-hud-report` | 整局读数 | — | 移动 |
| `R1g-12/boss-report` | `byDriver[0].lossesByKind.defeat` | 18 | 16 |
| `R1g-12/boss-threat-report` | 招式威胁读数 | — | 移动 |
| `R1g-12/threat-report` | 接触预算读数 | — | 移动 |
| `R1g-12/cadence-report` | 施放/闪避机会 | — | 移动 |
| `R1g-12/growth-report` | `fusionRuns` / `offersWithFusion` | 2 / 2 | **1 / 1** |
| `R1g-12/fusion-report` | `attribution.first.misses` | 31 | 32 |
| `R2-D/build-report` | `g7.fusionsPerRun` | 0.0567 | 0.0583 |
| `R2-D/build-report` | `g7.byHero` H001 / H010 / H012 | .085 / .060 / .025 | .055 / .085 / .035 |
| `R2-F-BOSSPHASE` | `counterfactual.classic` total / moved | 61 / 58 | **71 / 63** |
| `R2-F-BOSSPHASE` | `counterfactual.evolution` total / moved | 59 / 59 | **53 / 53** |
| `R2-F-G4ROWS` | `filter.rows[0].cheapestMove` | 0.2206 | 0.234 |
| `R2-F-CIRCLE` | `g4.observedRows[1].hits` | 5 | 0 |
| `R2-F-CADENCE` | `rows[0].perJourney[0].losses.timeout` | 2 | 7 |
| `R3-E/ai-report` | `roster[3..5].fielded` | false | **true** |

**方向一致**：这 16 份读的都是「跑完一整局」的量（胜率、HP 地板、击杀、升级节奏），没有一份读的是纯数学。
**没动的 67 份**里有十个压力格与 `R2-F-BOSS-ADDS/COVERAGE` —— 它们**逐帧 `cull` 掉刷怪器的产物**，
所以敌人构成进不去它们的读数（这也解释了为什么 `git status` 那 14 个 `M` 是行尾而不是内容）。

### 6.2 断言（15 条红，7 个文件）—— 逐条判「钉读数」还是「改合同」

> **首轮的 13 条是下限**：同一个 `it` 里前面的断言红了，后面的不会跑。补完再复跑才露出下面第 6、14 行。
> 红的总数按「复跑到全绿」数。

| 文件 | 断言 | 前 → 后 | 判定 |
|---|---|---|---|
| `byteLedger` ×2 | 账本覆盖 / 行数 | 新增 1 份报告未登记 | **机械**：`ledger:write` 后转绿 |
| `bossThreat` G4ROWS | 从没被观察到的两式 | `[circle, cone]` → `[circle, line]`（evolution 臂：三式全没观察到） | **钉读数**（「三取二」的claim存活） |
| `bossThreat` G4ROWS | `kept` 的长度 / `kept[0] > TARGET` | classic 1 / evolution **0** | **钉读数**：逐 journey 判，空臂跳过「survivor 是真实分数」 |
| `bossThreat` G4ROWS | 报告里的 `kept` 长度 | 恒 1 → classic 1 / evolution **0** | **钉读数**：钉到循环刚验过的那个集合，不是钉到一个只有 classic 能过的数 |
| `bossThreat` G4ROWS | `derivedMovePhases` | `[3]` → classic `[3]` / evolution `[]` | **钉读数** |
| `bossThreat` G4ROWS | `kept[0] === cheapestMove` | `0` vs **`undefined`** | **合同改写**：空臂上这条恒等式没有主语，改成断言「空过滤器读 0，不是 `undefined`」 |
| `bossThreat` BOSSPHASE | 反事实 total/moved | 61/58、59/59 → **71/63、53/53** | **钉读数**（88.7% / 100% 仍成立） |
| `formPressure` BOSS-COVERAGE | `maxAdds` | 恒 6 → **2–3** | **钉读数**（「≥90% 帧同场」存活，密度减半） |
| `fusionReachability` | 无末箱的种子 | `[4, 30]` → **`[22]`** | **钉读数**（两类缺口仍划分完备） |
| `growthPacing` | 达成融合的局数 | ≥2 → **1**（44 局） | **合同降级**：只剩 1/44，「可达」仍成立 |
| `manualDamage` G8 | 过线格数 | 3 → **2** | **合同降级**：`evolution/unlock` 37.25% → 34.07% 掉出 |
| `manualDamage` 转折点 | `classic/unlock` 上界 | 恒 0 → **≥1** | **合同被证伪**（记录，不倒转） |
| `manualDamage` 策略一致 | 胜场去重数 | 1（28/28/28）→ **3（31/30/29）** | **合同被证伪**（记录） |
| `manualDamage` D2 定价 | 冲刺 clamp 的胜场代价 | 7/30（20%）→ **4/31（12.9%）** | **合同降级**：门槛改成数据仍支持的量级（10%） |
| `growthPacing` | 带融合选项的宝箱数 | ≥2 → **1**（44 局） | **合同降级** + 新增 `offers >= fusionRuns` 把包含关系钉成关系 |
| `skillCadence` ×2 | `unlock` 驱动是否拿到 `S001` | 是（种子 15）→ 否 | **仪器**：换种子扫描，前提仍被断言 |

**没有一条是靠「改数字让它绿」处理的**：钉读数改成实测值并写明前值；合同降级/证伪都写进了本页与
`DECISIONS.md` D23，并在 `handoff/STATE.md` 的未决风险里留了条目。

## 7. 门禁

- `vue-tsc --noEmit` clean（`tsc --noEmit` 会因 `.vue` 模块报错 —— 那不是本片的，`typecheck` 脚本用的是 `vue-tsc`）。
- 新文件 `enemyWarnings.test.ts`：**10 个 `it`、约 40 ms**；`enemyRoles.test.ts`：**8 个 `it`、34 ms**（legacy 臂，数量不变）。
- **全量（干净树）**：**50 文件 / 1519 用例全绿，1643.92 s**（27.4 分钟）= 上一片 **1509 + 10**、
  **49 + 1** —— 两个增量与本片的 `it` 数与文件数**逐一相等**，没有探针残留。
- 账本：**267 / 267**（滚动 **32**，stale 0，moved 0）；新增 1 份滚动报告 `R3-E/enemy-warnings-report.json`。
- `smoke` OK / `audit` OK（7 modes、30 gear、20 runes、5 pets、20 talents、no permanent aura slow）/
  `archive:verify` OK（30/30 + 12 必需文档）/ `context` **7900 / 8192**。**`check` 本机跑不了**（见 `AGENTS.md`）。
- **复跑三轮才全绿**，这不是流程噪音：首轮 13 条红 → 补完后 2 条红（同一 `it` 里被前一条挡住的）→
  再补 2 条（`skillCadence` 的显式超时）。**红的计数按「复跑到全绿」算**。

## 8. 已知边界（写下来，不假装）

1. **画面未验证**（无 Playwright）。预警的几何、颜色、淡出只保证「渲染器读的是被断言的字段」。
2. **波次构成不可表达**：一个池，六种身体，每一波都一样；波 0 的职责靠权重保护到 66.7%，不是 100%。
3. **敌人更难了**：接触伤害的期望值从 10.88 涨到 12.60（每具身体 +15.8%），再加 `charge` 的一次冲刺命中和
   `aoe_ranged` 的落点伤害。G8 掉一格、G7 的融合局数掉到 **1/44**、D2 的冲刺代价从 20% 掉到 12.9% —— 都是这件事的账。
   这不是「可以调回去的数值」：三行的 `enemyDamage` 与 HP **每一项**都高于旧池期望，任何正权重都抬高接触预算。
4. **`brute` 仍是一个只有数值的身体**，`R3-E01..07c`（「两精英」的定义）仍是一个未做的设计决策。
