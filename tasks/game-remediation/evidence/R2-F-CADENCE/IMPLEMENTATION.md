# R2-F-CADENCE — 一场 90s 首领战应该给几次闪避决策

**Base:** R2-F-SUFFIX（分类器已修、零生产改动）。**Roadmap:** `tasks/game-remediation/ROADMAP.md`；**queue:** `QUEUE.md` #6m。
**来源:** `evidence/R2-F-INST/IMPLEMENTATION.md`（`bossCasts` 0 → 2 的测量与路由）。

**本片零生产改动，不落地任何平衡改动。** 交付 = 一套可重跑的测量装置（`bossThreat.test.ts` 新增一段）
+ 一张扫描表 + 每个候选的**重标定账单**。选哪个是设计决定，不是 harness 的决定。

---

## §0 前提核实（Scope 0）

TASK 引用的每个数字都要先归类：**常量**（配置里写死的）、**推导值**（常量代入公式）、**测量值**（跑出来的）。

| 引用 | 值 | 类别 | 读它的地方 |
| --- | --- | --- | --- |
| `threatV2.bossCastCooldown` | **14.31** | 常量 `threatV2.json:14` | `FirstBoss.ts:67` `castCdScale`；扫描的乘数；报告 `shippedTable` |
| `threatV2.bossSkillDamage` | **14.31** | 常量 `threatV2.json:12` | `FirstBoss.ts:64` `skillScale` |
| `threatV2.bossDamage` | 0.6 | 常量 | `bossBudget.test.ts:208`、`bossThreat.test.ts:594` |
| `threatV2.bossContactDamage` | 0.8 | 常量 | `bossThreat.test.ts:1134`（R1g-11 的储备杠杆） |
| `firstStage.telegraphScale` | 1.65 | 常量 `firstStage.json` | `bossThreat.test.ts:596`（**有断言**） |
| `firstStage.bossAt` / `duration` | 270 / 360 | 常量 | `bossBudget`、`formPressure` |
| 首次施放 `1.7 × 14.31` | **24.327s** | 推导 | `FirstBoss.ts:41` |
| 循环（相位 1）`2.62 × 14.31` | **37.492s** | 推导 | `FirstBoss.ts:124` |
| 循环（相位 3）`1.86 × 14.31` | **26.617s** | 推导 | `FirstBoss.ts:124` |
| 第三次施放（停在相位 1） | **99.31s** | 推导 | — |
| 遭遇窗口 `360 − 270` | **90s** | 推导 | `formPressure.test.ts:165/3023`（**有断言**） |
| 预警窗口 `(.95 − phase×.08) × 1.65` | 相位 1 **1.4355s** / 2 **1.3035s** / 3 **1.1715s** | 推导；中位 **1.303s** 是测量 | `bossThreat.test.ts:223` |
| `bossCasts = 2`（24.33s / 61.83s） | 2 | **测量** | `formPressure.test.ts:681` 等 8 处、`bossThreat` 的 `castLog` |
| `skillIndex` 走 0→1→2 | — | 推导自 `FirstBoss.ts:105`；`castLog` 实测吻合 | — |
| `requiredMultiple` | **14.31** | **测量**（R1g-10 报告） | `evidence/R1g-12/boss-cadence-report.json` |
| 单招 ×8.586 | `0.6 × 14.31` | 推导 | `FirstBoss.ts:64` |

### §0.1 两条前提**为真**，一条**需要限定**

1. **`bossCastCooldown = 14.31` 是真的**，`skillIndex` 确实走 0→1→2，`震地斩` 确实要第三次施放
   （推导 99.31s > 90s 窗口）。✅
2. **`bossCastCooldown` 与 `bossSkillDamage` 在整个套件里没有任何断言**。`bossBudget.test.ts:202`
   那条「pin every viewport-derived gameplay distance」钉了 `spawnRadius` / `chargeRange` /
   `bossDamage` / `bossHp` / `bossPhaseSpawnInterval`，**就是没有这两个**。本片已补上（§7）。
   一条关于某个旋钮的测量，在旋钮本身没人钉的时候是漂移的 —— 这正是「描述性字段没人断言 ⇒ 最易烂」。
3. **TASK 的「两次施放都在相位 1」只对 `formPressure` 的首领格成立，对发货关卡不成立。**
   `formPressure` 的首领格让 Boss 背着**进化预算**（452,115.7 HP），所以 90s 内只有 `phoenix` r2
   越过 70% 线；而真实关卡里 Boss 的预算是 `7000 × 1.19276 × 19.95 ≈ 166,553`（classic），
   玩家在 270s 时已经练满，**第一次施放之前就越过了 70% 和 35%**。实测（`castLog`）：
   `m = 1` 时两次施放落在**相位 2 和相位 3**，招式因此是 `旋风断军`（cone）与 `蛮王冲锋`（line），
   **不是** TASK 写的相位 1 组合。两个读数各自正确，**基准不同**。

### §0.2 顺带修掉的一处**过时注释**

`bossThreat.test.ts` 的 `hud` 臂里有一句「at the shipped cadence the Boss casts every ~2.6s，所以有些
提示到达时按钮还在灰」。**R1g-10 之后这是错的**：2.6s 是 `bossCastCooldown = 1` 时代的数，发货值是
`2.62 × 14.31 = 37.5s`。本片把它改准，并用本片的时间线测量背书（`blockedByCooldown` 在 0.25× 下仍为 0）。

---

## §1 这场战斗给了什么（Scope 1）

装置：`bossThreat.test.ts` 新增的 `castLog`（**opt-in**，`run(..., log: true)`）。每次 `boss-warning`
记下：距出生秒数、相位、`boss.next` 提示文本、招式形状、预警 `life`、**提示出现瞬间的玩家 HP 比例**、
闪避键是否就绪、同屏未结算预警数。五种子 × 两路线 × 四个倍率 = 40 局。

| 倍率 `m` | 路线 | 每场施放 | 见过的招式 | 可行动比例 | 预警窗口 | 首次 `震地斩` |
| --- | --- | --- | --- | --- | --- | --- |
| **1（发货）** | classic | **2.0** | cone 5 / line 5 | **1.000** | 1.303s | **null** |
| **1（发货）** | evolution | 1.6 | cone 4 / line 4 | **1.000** | 1.303s | **null** |
| 0.75 | classic | 2.8 | line 5 / circle 4 / cone 5 | 1.000 | 1.303s | **38.33s** |
| 0.75 | evolution | 2.2 | cone 5 / line 4 / circle 2 | 1.000 | 1.303s | **34.33s** |
| 0.5 | classic | 4.2 | line 9 / circle 9 / cone 3 | 1.000 | 1.303s | 31.92s |
| 0.5 | evolution | 3.0 | line 5 / circle 5 / cone 5 | 1.000 | 1.303s | 28.77s |
| 0.25 | classic | 10.0 | line 19 / cone 18 / circle 13 | 1.000 | 1.303s | 24.85s |
| 0.25 | evolution | 7.6 | line 15 / cone 15 / circle 8 | 1.000 | 1.303s | 40.50s |

**「窗口」与「机会」在这里是同一个数，而且这是被测量出来的，不是被假设的。**
`blockedByCooldown = 0`、`blockedByOverlap = 0` 在**所有**四个倍率上成立 —— 一直到 0.25×
（循环冷却 9.37s）为止，每一次施放都是一个玩家真的能做的决定：闪避键（4.5s cd）早就转好了，
也没有两个形状同时在屏上。**所以本片的「闪避机会数」= 「施放数」，且这个等号有收据。**

`skillIndex` 与相位的耦合（`(skillIndex + phase − 1) % 3`）意味着**玩家看到哪两招取决于自己的 DPS**：
`m = 1` 时两次施放落在相位 2/3 ⇒ `旋风断军` + `蛮王冲锋`；同一个倍率下只要击杀更快一点、相位还在 1，
组合就会变。这是 §0.1 第 3 条的推论，也是一个独立的可读性缺陷（记入队列，见 §9）。

---

## §2 杠杆与它的两条臂

`bossCastCooldown` 与 `bossSkillDamage` 是同一个杠杆的两半：

```
Boss 招式总 DPS  ∝  skillScale / castCdScale  =  (bossDamage × bossSkillDamage) / bossCastCooldown
```

发货表里两个数**都是 14.31** ⇒ 总 DPS 的倍率恰好是 `bossDamage = 0.6`（R1g-10 的取舍：单招 ×8.586、
节奏 ÷14.31、总量 ×0.6）。所以要「更多的闪避决策」，只有两条路，**且付账的验收不同**：

| 臂 | `castCd` | `skill` | 保住 | 付账 |
| --- | --- | --- | --- | --- |
| **cadence only** | `m` | `1` | **G4**（每招重量不变） | 招式总伤害 ×`1/m` |
| **constant aggregate** | `m` | `m` | 总量不变（`= bossDamage`） | **G4**（每招重量 ×`m`） |

---

## §3 扫描（Scope 2）

10 行 × 33 种子 × 2 路线 = **660 局**，`hud` 与 `browser` 两条臂都读，**分路线报、绝不池化**
（R1g-11 的 0.147 就是被池化中位数藏掉的）。原始数据 `cadence-sweep.json`。

### §3.1 `hud` 臂（G2 的记账仪器，浏览器套件的孪生）

| 臂 | `m` | 路线 | 施放 | hpMin | **G2** | ttk | **G3** | 胜率 | 不躲承伤份额 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| control | 1 | classic | **2** | 0.455 | ✅ | 67.8 | ✅ | .909 | .967 |
| control | 1 | evolution | **2** | 0.364 | ✅ | 61.9 | ✅ | .849 | .932 |
| cadence only | .75 | classic | 3 | 0.506 | ✅ | 66.1 | ✅ | .909 | 1.000 |
| cadence only | .75 | evolution | 3 | 0.411 | ✅ | 62.3 | ✅ | .909 | .988 |
| cadence only | .5 | classic | 4 | 0.432 | ✅ | 68.3 | ✅ | .879 | .976 |
| cadence only | .5 | evolution | 3 | 0.494 | ✅ | 62.3 | ✅ | .970 | .972 |
| const aggregate | .75 | classic | 3 | 0.506 | ✅ | 66.1 | ✅ | .909 | 1.000 |
| const aggregate | .75 | evolution | 3 | 0.411 | ✅ | 62.3 | ✅ | .909 | .988 |
| const aggregate | .5 | classic | 4 | 0.432 | ✅ | 68.3 | ✅ | .909 | .976 |
| const aggregate | .5 | evolution | 3 | 0.515 | ✅ | 62.3 | ✅ | .970 | .972 |

**在记账仪器上，G2 与 G3 在每一个候选上都是绿的**：hpMin 0.364–0.515（G2 带 0.25–0.60），
ttk 61.9–68.3s（G3 窗 60–90s）。闪避机会 2 → 3 → 3–4。
⇒ **对「会躲的玩家」而言，缩短冷却几乎是免费的。** 这不是笔误：`hud` 臂避开 93–100% 的招式，
多出来的施放落不到身上；它只多花掉一点输出时间（ttk 最多 +1s）。

### §3.2 `browser` 臂（从不按闪避的玩家）

| 臂 | `m` | 路线 | 施放 | hpMin | **G2** | ttk | 胜率 | **战死 /33** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| control | 1 | classic | 2 | 0.245 | ❌ | 66.8 | .788 | 6 |
| control | 1 | evolution | 2 | 0.166 | ❌ | 62.0 | .636 | 12 |
| cadence only | .75 | classic | 2 | 0.143 | ❌ | 67.3 | .636 | 12 |
| cadence only | .75 | evolution | 2 | **0** | ❌ | 61.7 | .485 | **17** |
| cadence only | .5 | classic | 3 | 0.037 | ❌ | 62.2 | .576 | **14** |
| cadence only | .5 | evolution | 3 | **0** | ❌ | 62.3 | .364 | **21** |
| const aggregate | .75 | classic | 3 | 0.182 | ❌ | 63.9 | .727 | 9 |
| const aggregate | .75 | evolution | 2 | 0.109 | ❌ | 61.7 | .606 | 13 |
| const aggregate | .5 | classic | 3 | 0.279 | ✅ | 62.5 | .788 | 6 |
| const aggregate | .5 | evolution | 3 | 0.219 | ❌ | 62.3 | .667 | 11 |

**`cadence only` 把「不躲」从「拿不到 G2」升级成「会死」**：`m = .75` 与 `.5` 上，进化路线的
hpMin 中位数是 **0**，战死 17/33 与 21/33（对照 12/33）。这正是 R1g-13 想要的方向
（「不躲的惩罚走分档」），而且它是**实测**的，不是推的。

### §3.3 G4 是唯一把两条臂分开的验收，也是**卡死的那一个**

`R1g-10` 的报告给出 `requiredMultiple = 14.31` —— 也就是「要让最弱一招打掉 15% 生命，
`bossSkillDamage` 需要多少」。发货值**恰好就是 14.31**（`headroom = 1.000`）。
⇒ **G4 没有任何余量**，`constant aggregate` 臂（把每招变轻）在**任何** `m < 1` 上都会破 G4。

实测相位 1 单招（在 `browser` 臂上读，`hud` 臂几乎不挨打）：

| 臂 | `m` | 路线 | 相位 1 单招 | **G4**（≥ 15%） |
| --- | --- | --- | --- | --- |
| control | 1 | classic | 0.1500（n=3） | ✅ |
| cadence only | .75 | classic | **0.1500**（n=20） | ✅ |
| cadence only | .5 | classic | **0.1500**（n=33） | ✅ |
| const aggregate | .75 | classic | **0.1125**（n=20） | ❌ |
| const aggregate | .5 | classic | **0.0750**（n=33） | ❌ |

结论：**「更多的闪避决策」不是免费的，但账单落在 G4 上，而不是 G2/G3 上。**
想保住 G4 就必须保住每招重量（`cadence only`），代价转移到「不躲的玩家会死」；
想保住总量就必须降低每招重量（`constant aggregate`），代价是 G4 直接不达标 —— 而 R1g-13
已经明确「G4 的定义不动」。

---

## §4 选项与重标定账单（Scope 3，**只出选项，不落地**）

### O1 — 维持现状（`m = 1`）
2 次闪避决策/场，G2/G3/G4 全绿，`震地斩` 永不出现。**账单：零。** 代价：闪避键一场用两次。

### O2 — `cadence only`，`m ≈ .75`（`bossCastCooldown` 14.31 → ≈ 10.73）
3 次决策，G4 完好（0.1500），G2/G3 在记账仪器上完好。
**重标定账单**：`bossCastCooldown` 是一个新常量 ⇒ 必须带上本片这张扫描作为它的标定；
`bossBudget.test.ts` 的 TTK/相位轮次/胜率断言全部要重跑；`bossThreat.test.ts` 的曲线行整体平移；
**`formPressure.test.ts` 的首领格 `bossCasts` 从 2 变 3**（8 处断言 + `bossDodged` 臂 + 报告字段）；
`browser` 臂的 hpMin 与战死数要重新记录（预期「不躲会死」上线）。

### O3 — `constant aggregate`，`m ≈ .75`
3 次决策，G2/G3 完好，**G4 破**（相位 1 单招 11.25%）。
**重标定账单**：先要一个 GDD 层面的决定 —— 要么改 §4 的 G4 定义（R1g-13 已冻结它），
要么给「单招可读性」换一个不靠 `bossSkillDamage` 的机制。之后 O2 的整套 harness 账单照付。
**本片不建议**：这是唯一一个会**打破一条已冻结验收**的选项。

### O4 — 缩短冷却 **且** 拉长窗口（改 `duration` / `bossAt`）
在不改每次施放间隔的前提下塞进更多施放。**账单**：六分钟关卡契约、G3 的每一条读数、
`bossBudget` 的 `CELLS`、浏览器套件的 620s 期限。而且实测战斗本身只有 62–68s，
多出来的时间是空的 —— 除非同时把 Boss 血量抬上去，那就又回到 G3。

### O5 — 把招式从相位解耦（**独立缺陷，不是本片的选项**）
`(skillIndex + phase − 1) % 3` 让**玩家看到哪两招取决于自己的 DPS**（§0.1 #3、§1）。
修它不会增加决策数，只会让顺序确定。**记为独立条目**（§9 #6s），不与本片的节奏问题混在一起。

---

## §5 触及哪个验收（Scope 4）

- **G2**（hpMin 0.25–0.60）：`hud` 臂在全部候选上绿；`browser` 臂在 `cadence only` 上跌到 0。
- **G3**（窗口 60–90s）：全部候选 61.7–68.3s，**不受影响**。
- **G4**（单招 ≥ 15%）：**唯一卡死的验收**，发货值余量为 0；`constant aggregate` 任何 `m<1` 都破。
- **G9**（≥3 个术式「手动显著更强」）：**未触及**。`manualStrongSkills` 仍是 10 个
  （`A011 A021 A027 A026 A003 A054 G2_FROST S001 A015 A013`），它取自 `cast` 包装器，与首领施放无关；
  而且战斗长度在全部候选上不动（61.7–68.3s）⇒ 按压次数不变。

---

## §6 文件变更

**零生产文件。** 只有仪器与证据：

| 文件 | 变更 |
| --- | --- |
| `apps/mobile-next/src/core/bossThreat.test.ts` | 新增 `CastEvent` + `ThreatRun.castLog?`（**opt-in**）；`run()` 加 `log` 参数；`runs()` 缓存键加 `log`；新增 `describe('Boss cadence, and the dodge budget it sets (R2-F-CADENCE)')`（3 个 `it`）；修一处过时注释（§0.2） |
| `tasks/game-remediation/evidence/R2-F-CADENCE/cadence-sweep.json` | 新增（滚动工件，每次运行被覆写） |

### §6.1 opt-in 的证明：旧报告**逐字节未变**

`castLog` 只在 `log` 为真时挂到返回值上（`...(log ? { castLog } : {})`），`JSON.stringify` 会丢掉
`undefined` 键 ⇒ 不记日志的运行与改动前**序列化结果完全相同**。四份滚动报告与 `R2-F-CAP/cap10-md5.txt`
基线**逐位一致**：

```
6182a8a85db5070798bc9f3c1fe379ef  R1g-12/boss-threat-report.json
add3ef8c337a23c4e7b82601ad997892  R1g-12/boss-cadence-report.json
e86284172c33404536749f9f019e924d  R1g-12/boss-hud-arms.json
77c3a1b6bc29c9eed8db5fff989a0b3b  R1g-12/boss-hud-report.json
```

### §6.2 新增的常量钉（补上 §0.1 #2 的缺口）

```ts
expect(threatV2.bossCastCooldown).toBe(14.31);
expect(threatV2.bossSkillDamage).toBe(14.31);
```

### §6.3 复现

```
npx vitest run src/core/bossThreat.test.ts -t "R2-F-CADENCE"
```

660 局扫描 + 40 局时间线，本机约 **378s**。

---

## §7 门禁

见 `handoff/STATE.md` 的 `Tests` 字段（`typecheck`、全量套件、五项根门禁、`context` 用量）。

---

## §8 写回队列

- **#6m `R2-F-CADENCE`** → ✅ 完成（本片）。
- 新增 **#6s `R2-F-BOSSPHASE`**（仪器/设计）：玩家看到哪两招取决于自己的 DPS（§0.1 #3、§4 O5）。
- 下一片 = **#6n `R2-F-CIRCLE`**。
