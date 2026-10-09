# R2-F-BOSS-ADDS —— ① 的唯一生效配置：一格都没有

**切片**：`QUEUE.md` #6p。**基线**：R2-F-TOUGH-HORDE（零生产改动）。
**结论**：**零生产改动**（测量 + 定价 + 成本账单 + 选项，不落地）。本片唯一的文件改动是**仪器**：
`apps/mobile-next/src/core/formPressure.test.ts` 追加一个 `describe`（4 个 `it`）+ 一个 `ADDS` 常量，
放在文件**末尾**。

---

## 0. Scope 0 —— 前提核实

### 0.1 首领格的构造

`formPressure.test.ts:371-380`：

```ts
boss: (sim: CombatSimulation) => {
  sim.time = 270; sim.bossEncounter.updateObjective();
  const boss = sim.boss!;
  sim.player.x = boss.x - 90; sim.player.y = boss.y;
  return [];
},
```

| 项 | 值 | 类别 |
| --- | --- | --- |
| 站位 `boss.x - 90` | **90px** | **常量**（写死在格子里） |
| 窗口 | `BOSS_FRAMES = (duration − bossAt) × 60 = (360 − 270) × 60 = 5400` | **推导**（从 `firstStage.json` 读） |
| 返回的身体 | `[]` | **常量** |
| Boss 半径 `r` | **42** | **测量**（本片在树上读出） |
| Boss 血量（本格） | **452,115.678** | **测量**（进化预算） |
| 技能涡旋 | `G4_WIND_E`，r **120 / 160**，`atk×.35`，life 4 / 6，reach **180** | **常量**（`EvolutionCombat:68`） |
| 必杀涡旋 | `G4_WIND_R`，r **200**，`atk×.65`，life 6，reach **180** | **常量**（`EvolutionCombat:89`） |

### 0.2 「首领格没有小怪」不是遗漏 —— **它被断言了**

`run()` 每帧剔除所有未播种的敌人（`:489`）：

```ts
for (let k = sim.enemies.length - 1; k >= 0; k--) if (!keep.has(sim.enemies[k]!)) sim.enemies.splice(k, 1);
```

而 `R2-F-INST` 把这条**写成断言**（`:3036-3040`）：

```ts
// The cell isolates the Boss: the director's own spawns are culled every frame, so every point
// of incoming in this cell is the Boss's. That is what makes the numbers a reading of the kit.
const sources = [...new Set([...Object.keys(plain.takenBy), ...Object.keys(plain.absorbedBy)])];
expect(sources.filter(k => !k.startsWith('B001-')), `${key}: nothing but the Boss lands here`).toEqual([]);
```

⇒ **「首领格 = 纯 Boss 格」是十形态共用的设计断言**。队列写的「首领格不撒任何小怪」为真，
但它是**刻意的**，不是缺口。**任何「往首领格塞小怪」的候选都会打红这条断言 ×10 形态。**

### 0.3 但发货里 Boss 与小怪**确实共存**

`CombatSimulation:338-342`：

```ts
this.spawnClock += dt; const baseInterval = director(this.directorState(), p, this.difficulty).interval;
const interval = baseInterval * (this.threat && this.bossEncounter.active ? this.threat.bossPhaseSpawnInterval[this.journey] : 1);
while (this.spawnClock > interval) { this.spawnClock -= interval; this.spawn(); }
```

`threatV2.json:9` 的 `bossPhaseSpawnInterval = { classic: 2, evolution: 3 }` 是**乘数**（拉长间隔），
**不是开关** ⇒ Boss 阶段照常生成小怪（`spawnRadius = 524`，走进来）。
本片在树上实测：首领格跑 600 帧后 `sim.enemies.length > 0`（§1 的 `it` 1）。

⇒ **发货里「Boss + 小怪」是常态，而 harness 里一次都没出现过。** 这是本片真正的覆盖缺口。

### 0.4 ① 的精确几何

| 函数 | 定义 | 位置 |
| --- | --- | --- |
| `heroAim()` | `const target = this.boss \|\| this.nearest();`（**Boss 优先**） | `CombatSimulation:174` |
| `nearestFrom(p)` | `[...s.enemies, ...(s.boss ? [s.boss] : [])].reduce(最近)`（**小怪也算**） | `EvolutionCombat:113-117` |
| `fixedVortex(...)` | `target = nearestFrom(p)`；`angle = atan2(target − p)`；`length = min(reach, distance(p, target))` | `EvolutionCombat:118-125` |
| 涡旋命中 Boss 的判据 | `distance(boss, vortex) <= vortex.r + boss.r` | `CombatSimulation:498` |

**① = 让技能涡旋改用 `heroAim()` 的目标。** 两者**只在「有 Boss **且** 有更近的小怪」时分离**
（R2-F-SHADOW §1.1 已测）。

**推论（本片的核心几何）**：技能涡旋落在**小怪**那条射线的 `min(180, d)` 处，
所以 Boss 落在技能涡旋**之外**当且仅当

```
d < standoff                     （小怪更近，nearestFrom 才会挑它）
standoff + min(180, d) > r + 42  （两个圆盘不再重叠）
```

r = 120（rank 1）/ 160（rank 2）。**这两条就是 ① 的生效条件。**

### 0.5 每一处读首领格的断言

`boss.r1.` / `boss.r2.` 共 **93 行**（十形态 × 四格里的首领格）。另有 `R2-F-INST` 的三条
跨形态首领格断言（`bossCasts === 2`、`takenBy` 只有 `B001-*`、`bossDodged` 臂）。
**没有任何一处断言读「涡旋落在哪里」** —— 全部读结果（`dealtBy` / `bossHpLost` / `hpMin` / `taken`）。

### 0.6 谁会被 ① 影响

`fixedVortex` 的调用者只有三处（`grep fixedVortex`）：

| 位置 | 归属 | 受影响？ |
| --- | --- | --- |
| `EvolutionCombat:68` | `windwarden` 的**技能** | ✅ ① 的目标 |
| `EvolutionCombat:89` | `windwarden` 的**必杀** | ❌（① 只改 `G4_WIND_E`） |
| `EvolutionCombat:188` | `A026` 的 `ambush` 路线（R2-F-SHADOW §0.1 的「第三个调用者」） | ⚠️ 同一函数 ⇒ 会被 ① 连带改到 |

⇒ **十形态里只有 `windwarden` 一个形态的读数会动。**

---

## 1. Scope 1 —— 最小格的实测

### 1.1 出货站位（90px）：**rank 2 根本不可达**

把 §0.4 的两条代入 `standoff = 90`：

- **rank 1**（r=120）：需要 `90 + d > 162` 且 `d < 90` ⇒ **d ∈ (72, 90)**。**可分离，但窗口只有 18px。**
- **rank 2**（r=160）：需要 `90 + d > 202` 且 `d < 90` ⇒ 需要 `d > 112`，与 `d < 90` **矛盾**。
  ⇒ **对任何合法的 d 都不可达。**

树上实测（本片 `it` 2，把 d = 1..89 全枚举）：`legal.filter(d => separates(90, d, 2, 42))` = **`[]`**。

> **这就是队列「首领格不撒任何小怪」之外的更深一层**：即使撒了小怪，**90px 的站位让 rank 2 永远看不见 ①**。
> 挡路的不是「没有身体」，是**站位**。

### 1.2 最小格：standoff **102**、d **101**

要两个 rank 同时可分离：`standoff + d > 202` 且 `d < standoff` ⇒ `2·standoff > 202` ⇒ `standoff > 101`。
最小整数解 **standoff = 102、d = 101**（实测：`separates(101, 100, 2) = false`、`separates(102, 101, 2) = true`）。
本片提出的格用**圆整值 standoff = 110、d = 100**（`ADDS` 常量）。

### 1.3 46 格扫掠：**几何模型解释每一格**

`GRID` = standoff {90, 110, 130, 160, 200, 260} × d {60, 80, 100, 120, 160}，跳过 `d ≥ standoff`
⇒ **23 个摆位 × 2 阶 = 46 格**，每格跑 base / aim 两臂（**92 局**）。

断言是**逐格**的：`[standoff, d, rank, gain > 0]` 必须等于 `[standoff, d, rank, separates(...)]`
⇒ **46/46 一致**。扫掠里 **40 格可分离、6 格不可**。

| standoff | d | rank | base `G4_WIND_E` | aim `G4_WIND_E` | 增益 |
| --- | --- | --- | --- | --- | --- |
| 90 | 60 | 1 | 11250.01 | 11250.01 | **0**（150 ≤ 162） |
| 90 | 80 | 1 | 10418.73 | 11250.01 | **+831.28** |
| 90 | 80 | 2 | 16847.31 | 16847.31 | **0**（170 ≤ 202） |
| 110 | 100 | 1 | 10529.57 | 11360.85 | **+831.28** |
| 110 | 100 | 2 | 15683.52 | 16902.73 | **+1219.21** |
| 260 | 160 | 2 | 15905.19 | 17124.40 | **+1219.21** |

### 1.4 增益是**常数**，不是曲线

rank 1 恒 **+831.28**、rank 2 恒 **+1219.21**，与 standoff / d 无关。
按树上实测的每跳伤害 **55.42**（`G4_WIND_E` 对 Boss 的单跳）反算：**+15 跳 / +22 跳**。

⇒ **一格要么完全看不见 ①，要么完整看得见它。** 没有「部分可见」的中间档。

### 1.5 ① 不动这场战斗的其它任何东西

46 格里逐格断言：`hpMin` / `taken` / `killed` / `G4_WIND_R` 两臂**全部相同**。

> **边界（写清）**：本扫掠用 **1 具 `EN001`（63 HP）**，它在必杀涡旋的第一跳（102.92）就死
> ⇒ 玩家承伤不受影响。**换成扛得住的身体就会不同**：探针实测 standoff=200、3 具 `EN006`（198 HP）时
> `hpMin` **0.3612 → 0.4087**、`taken` **329.95 → 305.22**。⇒ 「① 只动 Boss 一侧」是**这个格**的性质，
> 不是 ① 的一般性质。

---

## 2. Scope 2 —— 定价

### 2.1 ① 今天扛着哪条验收？**没有。**

① 的**名义**目标是 R2-F-SHADOW 的遮蔽问题（敌群格里 `G4_WIND_E` 恒 0）。
但 R2-F-TOUGH-HORDE 已经把那个原因定死：**0.28s 的跳周期 + 85px/s 的向心牵引**让 12 具身体在
0.283s 内全死，与「两个涡旋同心」无关。⇒ **① 不修敌群格**，它没有任何现存验收。

### 2.2 首领格今天断言什么

十形态共用的 93 行读的是**结果**（`dealtBy` / `bossHpLost` / `hpMin` / `taken` / `takenBy`），
外加 `R2-F-INST` 的三条跨形态断言（`bossCasts === 2`、`takenBy` 只有 `B001-*`、`bossDodged` 更强）。
**没有一条读「涡旋落在哪」。**

### 2.3 真实缺口比队列写的更大

队列写的是「① 的验收位没有格」。实测的真话是：

> **「Boss 与小怪共存」这个交互，整套 harness 一次都没测过。**
> 四个格里三个有身体没 Boss、一个只有 Boss；而发货的整个 Boss 阶段**两者同时在场**。

### 2.4 谁会被影响

**十形态里只有 `windwarden` 一个**（`fixedVortex` 的唯一形态调用者）。
⇒ 「加一格来验 ①」对**九个形态是纯成本**。

---

## 3. Scope 3 —— 一格要花多少

### 3.1 候选

| # | 做法 | 判定 |
| --- | --- | --- |
| **A** | 往**首领格**塞身体（改 `scenarios.boss`） | ❌ **打红 `R2-F-INST:3040`**（`nothing but the Boss lands here`）×10 形态；且站位 90px 时 rank 2 仍不可达 |
| **B** | **新增第五格 `boss-adds`**（standoff 110 + 1× `EN001` @100px 反向） | ✅ 能看见 ①；账单见下 |
| **C** | 把 `scenarios` 之外**另开一次 opt-in 扫描**（本片的做法） | ✅ **零报告改动**；但不进入十形态的常规回归 |
| **D** | 判定 ①「不可验证、不落地」 | ✅ 零账单；代价是 `A026` 的 `ambush` 分支与 `windwarden` 的技能继续追小怪 |

### 3.2 断言层账单（选 B）

| 位置 | 影响 |
| --- | --- |
| `R2-F-INST:3018` `expect(WINDOWS).toEqual({...})` | **必改**（要加第五个键） |
| `type ScenarioName = keyof typeof scenarios` + `WINDOWS: Record<ScenarioName, number>` | **编译期强制**：加 key 必须加窗口（这是好耦合） |
| `NAMES`（`:383`，**独立字面量**） | 加 `scenarios` 的键**不会**自动进 `NAMES` ⇒ 新格会静默不跑。**隐藏耦合** |
| `for (const name of NAMES)` × **10 处** | 新格会进入每一处循环 |
| `for (const [label, o] of cells)` × **62 处** | `cells` 由 `NAMES` 生成 ⇒ 新格进入 62 条通用断言（`casts > 0`、`ults === 1`、`vortexPeak`…） |
| 十形态的 `boss.r1.` / `boss.r2.` × **93 行** | 读的是 `outcomes.boss`，**不受影响** |

### 3.3 报告层账单

`matrix()` 写 `report.scenarios[name]` ⇒ 新增键会让**十份压力报告全部变字节**。
按技能 `### 7a`/`### 6z`：**schema 变 ⇒ 用「去新键重建 md5」复核**，
不能直接比 md5（会得到假红）。`R2-F-CAP/cap10-md5.txt`（248 行）随之作废。
**选 C（本片）零报告改动**：新块不写任何既有报告，只写自己的
`evidence/R2-F-BOSS-ADDS/boss-adds-report.json`。

### 3.4 窗口

新格需要自己的窗口。Boss 格用 `BOSS_FRAMES`（遭遇本身的 90s）；`boss-adds` 沿用同一档即可
（本片实测 5400 帧足够：Boss 两次施放都发生在窗内）。**不需要新常量。**

### 3.5 harness

**只有 `formPressure.test.ts`**（`grep readFileSync` 全库唯一命中在本片新加的对照臂）。

### 3.6 隐藏耦合

1. `NAMES` 与 `scenarios` 是**两个独立清单** ⇒ 只改一个会静默失效（§3.2）。
2. `R2-F-INST:3040` 把「首领格只有 Boss」写成断言 ⇒ 候选 A 会被它拦住（**这是它存在的意义**）。
3. `formPressure.test.ts:2127` **另外**硬编码一个 `onRing(sim, 'EN001', 120, 12)`，不跟着 `scenarios.horde` 走
   （R2-F-TOUGH-HORDE §5.2 已记录）—— 同一类「字面量复制」。

---

## 4. Scope 4 —— 选项（**只出选项，不落地**）

| # | 选项 | 账单 | 换来什么 |
| --- | --- | --- | --- |
| **O1** | **维持现状 + 把结论写进文档** | 零 | 「Boss + 小怪」仍未测；① 仍不可验证 |
| **O2** | **新增第五格 `boss-adds`**（standoff 110 / d 100） | 十份报告作废 + `WINDOWS` 断言改 + 62 条通用循环重推 + 10 组控制臂 | 补上「Boss + 小怪」这个**真实且未测**的交互；① 变得可验证 |
| **O3** | **只开一次 opt-in 扫描**（本片的做法） | 零报告改动 | 结论可复现，但不进常规回归 |
| **O4** | **判定 ①「可验证但不值得落地」** | 零 | **依据**：即使可见，增益也只有 **+831.28 / +1219.21** 对 **452,115.68** 的预算 = **0.18% / 0.27%**；而它把技能涡旋从小怪身上挪走（净额在小怪一侧是负的） |
| **O5** | **改的是「技能为什么追小怪」而不是格**（根因，属平衡） | — | `windwarden` 的技能是否**应该**优先打 Boss 是设计问题，不是仪器问题 |

**本片的建议（不是裁定）**：**O1 + O4 一起**（零账单），并把 **O2** 留作「Boss + 小怪」覆盖缺口的
独立切片 —— 那个缺口的价值**不依赖 ①**。

---

## 5. 文件变更

**生产文件：零。** 唯一改动是仪器 `apps/mobile-next/src/core/formPressure.test.ts`：
追加 `ADDS` 常量 + `describe('R2-F-BOSS-ADDS ...')`（4 个 `it`）到**文件末尾**，
`scenarios.boss`（`:371`）**原样未动**，以保护 `manualDamage.test.ts:131/498/546/550` 的**行号引用**
（`formPressure.test.ts:195` / `:1009-1047` / `:2572` / `:2895`）。

新建：`evidence/R2-F-BOSS-ADDS/boss-adds-report.json`（16,863 B，**每次运行被覆写**）。

### 5.1 opt-in 证明

新块**不写**任何既有报告 ⇒ 十份压力报告应与基线逐位一致。逐位账见 §6。

---

## 6. 门禁

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck`（`vue-tsc --noEmit`） | ✅ 干净（0 输出） |
| 定向 `-t "R2-F-BOSS-ADDS"` | ✅ **4 passed / 73 skipped (77)**（8.57s） |
| `npx vitest run`（全量） | ✅ **43 文件 / 1456 测试全绿**（见 §6.1） |
| `smoke` | ✅ `SMOKE OK` |
| `audit` | ✅ `AUDIT OK` |
| `context`（活跃上下文包 ≤ 8192 B） | ✅ **8183 / 8192**（见 §6.2） |
| `archive:verify` | ✅ `30/30` + 12 份 master docs |
| `npm run check` | ⚠️ **本机跑不了**（`child_process` 被拦截 ⇒ `spawnSync` = EBUSY）—— 手查等价：`index.html` 的 **26 个 ref 全部存在**、逐个过 `node --check`、**0 内联 `<script>` / 0 内联 `<style>`** |
| Playwright | ⚠️ 始终无输出 ⇒ 浏览器侧无法本地验证（本片无浏览器侧变更） |

### 6.1 全量套件

`cd apps/mobile-next && npx vitest run`（**后台 + 同回合内阻塞 `TaskOutput`**，输出重定向到
`/tmp/boss-adds-suite.txt`）：

```
 Test Files  43 passed (43)
      Tests  1456 passed (1456)
   Start at  16:21:44
   Duration  1635.78s (tests 99%)
EXIT=0
```

比 `R2-F-TOUGH-HORDE` 完成时（43 文件 / 1452 测试 / 1593.96s）多的 **4 条** = 本片新增的
`describe('R2-F-BOSS-ADDS ...')` 的 4 个 `it`；文件数不变（仪器追加在既有文件末尾）。

### 6.2 上下文包

`npm run context`：`AGENTS.md` **689** + `TASK.md` **3016** + `handoff/STATE.md` **3437** +
`docs/INDEX.md` **1041** = **8183 / 8192**（余量 **9** 字节）。

本片把 `STATE.md` 的五字段从 R2-F-TOUGH-HORDE 换成 R2-F-BOSS-ADDS 时**先超限两次**
（3619 ⇒ 8365、3456 ⇒ 8202），压到 **3437** 才过 ⇒ **换片时 `STATE.md` 的预算就是「旧值 + 余量」**，
新片的结论写长一点就会撞线。

### 6.3 逐字节账（opt-in 证明）

`R2-F-CAP/cap10-md5.txt`（248 行）逐行重算（`node:crypto`，`md5sum` 本机被拦截）：

```
total=248 ok=247 mismatch=1 missing=0
  DIFF ./R1g-12/manual-report.json expected 8246b726... got 9c71d883...
```

**唯一不符项不是本片造成的** —— 与 `R2-F-TOUGH-HORDE` 的读数逐位相同（`R2-F-HORDE-LEDGER` 已记录
它的根因：该目录有**六份**滚动报告，早先的逐字节账只核了**四份**）。本片只改
`formPressure.test.ts` 且新块**不写**任何既有报告 ⇒ 十份压力报告逐位不变。

---

## 7. 写回队列

1. **#6p 关闭**：结论 = **零生产改动**。① **可验证**，但**最小格的站位是 102px**（出货的 90px 让
   **rank 2 完全不可达**），而且即使可见，增益只有 Boss 预算的 **0.18% / 0.27%**。
2. **队列原文需更正一处**：不是「首领格不撒任何小怪」（那只是表层）——**「首领格只有 Boss」是一条断言**
   （`R2-F-INST:3040`），所以候选「往首领格塞小怪」**必然打红**；而且**站位**才是 rank 2 的硬阻塞。
3. **新入队 `R2-F-BOSS-COVERAGE`（仪器）**：「Boss 与小怪共存」这个交互**整套没测过**，
   而发货的整个 Boss 阶段都在这个状态。**它的价值不依赖 ①** —— 是独立覆盖缺口。
4. **`R2-F-TOUGH-HORDE` 的 `R2-F-HORDE-BAND` / `R2-F-HORDE-LEDGER` 保持不变。**

---

*本文件描述的是 R2-F-BOSS-ADDS 完成时的代码状态。本片零生产改动，所以本文件描述的
「当前状态」与 R2-F-TOUGH-HORDE 完成时相同。*
