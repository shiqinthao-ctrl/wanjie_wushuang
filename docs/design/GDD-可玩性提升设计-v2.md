# 万界无双 · 可玩性提升设计 v2

> 对象工程：`apps/mobile-next/`（TypeScript + Vue 3 + Phaser 4，6834 行）
> 上一版 `GDD-玩法与平衡设计-v1.md` 分析的是 `assets/js/**`（V3.1.3 遗留单文件版），
> 本版**全部结论基于主力工程的真实运行结果**，并附实测数据。
> 测量方法见 §0，全部原始数据可复现。

---

## §0 测量方法与证据来源

### 0.1 为什么这次不一样

上一轮的问题是**分析对象错了**：`assets/js/**` 是线上 `index.html` 的遗留 V3.x 单文件版，
而 `tasks/game-remediation/ROADMAP.md` 声明技术栈为 TypeScript/Vite/Phaser/Vue ——
真正往前走的是 `apps/mobile-next/`。

本轮直接运行主力工程的**纯规则核心**（`GameCore` + `CombatSimulation`，无 DOM/时钟/音频依赖），
在 390×844 竖屏、固定种子 15、360 秒关卡、每秒 60 步的条件下跑完整局。

### 0.2 测量矩阵

| 场景 | 移动 | 按键 | 难度 |
|---|---|---|---|
| 进化征途 · 主动 | ✓ | ✓ | normal |
| 进化征途 · 只移动 | ✓ | ✗ | normal |
| **进化征途 · 完全静止** | **✗** | **✗** | normal |
| 进化征途 · 静止 | ✗ | ✗ | nightmare |
| 经典征途 · 主动 / 静止 | ✓/✗ | ✓/✗ | normal |
| 首章 CH001-01 · 主动 / 静止 | ✓/✗ | ✓/✗ | normal |

「按键」= 闪避（CD 好且有威胁时）、主动技（CD 好就按）、必杀（能量满就按）。
移动策略 = 追经验晶石，敌人 <80px 时后撤。

---

## §1 一句话诊断

> **当前版本不是"难"或"简单"的问题，而是"没有游戏"的问题：
> 玩家全程不移动、不按键也能通关；Boss 三阶段全部招式合计只造成玩家 4.2% 的生命值伤害（**此数为遗留路径读数**，
> threat-v2 下 Boss 单局已造成 56.6% 生命、占全部承伤 34.6%，真正的问题是**单招不可读**：1.05%）；
> 而游戏宣称的 20 个进化、10 个融合，在一次 6 分钟的运行里从来没有出现在选择列表中。**

实测最刺眼的一行数据：

```
进化征途 · 完全静止（不移动、不按任何按钮） → 胜利，301.9 秒，剩余生命 758/763（99%）
```

---

## §2 九项实测发现

### 发现 1 · 玩家什么都不做也能通关

| 场景 | 结果 | 结束时间 | 剩余生命 |
|---|---|---|---|
| 进化征途 · 移动+按键 | **胜利** | 288.7s | 754/763（99%） |
| **进化征途 · 完全静止** | **胜利** | **301.9s** | **758/763（99%）** |
| 进化征途 · 只移动 | **胜利** | 290.4s | 716/763（94%） |
| 进化征途 · 静止 + 万界劫 | **胜利** | 287.2s | 111/763（15%） |
| 经典征途 · 静止 | 超时（Boss 存活） | 360.0s | 671/763（88%） |
| 首章 CH001-01 · 静止 | **失败** | 100.5s | 0/620 |

**在 UI 实际可进入的两种征途里，玩家不操作也能胜利。游戏没有失败状态。**

唯一存在真实失败状态的是首章模式 —— 而它**在 UI 上不可达**（见发现 7）。

### 发现 2 · Boss 全流程只造成 4.2% 生命值伤害

实测 `damageTakenBy`（进化征途 · 移动+按键，整局）：

```
hostile-projectile : 46      ← 小怪远程弹
B001-蛮王冲锋      : 10
B001-旋风断军      : 11
B001-震地斩        :  7
B001-contact       :  4
```

**Boss 三个阶段、三套招式，整局合计 ≈ 32 点伤害。玩家最大生命 763 → 4.2%。**

> **R1g-9 更正**：4.2% 是**遗留路径**的读数（`incoming 0.44` + 固定 `def × 0.08` 减免 + 全局 0.28s 无敌）。
> 在 threat-v2 下这三层都不存在，Boss 单局造成 **56.6% 生命**、占全部承伤 **34.6%** —— 总量上早就不是
> "不构成威胁"。缺的是**单招可读性**：单招仍只有 1.05%。所以 P0-4 的解法不是"再加伤害"，而是
> "把同样的总量压进更少、更大、看得见的招式里"（见 P0-4 落地记录）。

三层减伤叠加导致（`src/core/combatMath.ts`）：

1. `incomingHit()` L130 —— `if (Number.isFinite(player.incoming)) damage *= player.incoming`，
   而 `firstStage.rule.incoming = 0.44` → **全局 −56% 受伤**
2. `incomingHit()` L139 —— `damage - context.baseDef * .08`，H001 `def = 28` → **−2.24 固定**
   （对 8 点伤害是 −28%，对 200 点伤害只有 −1%：曲线形状完全错误）
3. `incomingHit()` L139 —— `inv = .28` → **每次受击后 0.28 秒全局无敌**

第 3 条是致命的：`inv` 是**全局**的，不是按来源计时。因此
`if (player.inv > 0) return { hp: player.hp, ... }` 会吞掉同帧所有其他敌人的伤害。

**玩家承受伤害的数学上限 ≈ (1 / 0.28) × 每次伤害 ≈ 3.57 × 1.3 ≈ 4.6 HP/s，
与围攻的敌人数量无关。** 玩家 763 HP + 吸血 → 需要 166 秒才能被打死，而关卡只有 360 秒。

### 发现 3 · Boss 在 6.3 秒内被秒杀

Boss B001 黄巾巨将 HP = **25,048**（`firstBoss.json` hp 7000 × `firstStage.bossHp` 3 × 时间系数 1.19）。

| 模式 | Boss 生成 | Boss 击杀 | 窗口 | 击杀 DPS |
|---|---|---|---|---|
| 进化征途 | 270s | 276.3s | **6.3s** | ≈ 3,976 |
| 经典征途 | 270s | 337.7s | 67.6s | ≈ 371 |
| 首章 CH001-01 | 270s | **未击杀** | >90s | < 278 |

首章设计给 Boss 的窗口是 90 秒（`chapterStages[0].boss.spawnAt = 270`，`duration = 360`），
对应目标 DPS ≈ 278。**进化征途超出 14 倍。**

经典征途 67.6 秒反而接近设计意图 —— 但经典征途没有进化系统。

### 发现 4 · 进化与觉醒在前 70 秒就完成了

进化征途实测时间轴：

```
Lv1 → Lv2 :   9s
Lv2 → Lv3 :  18s   ← 进化（形态选择）
Lv3 → Lv8 :  71s   ← 觉醒
Lv8 → Lv20: 266s   ← 之后全部是"给已有术式 +1 级"
```

**前 70 秒（19% 关卡时长）走完全部结构性成长，之后 290 秒（81%）没有任何新东西。**
玩家的第 3 分钟和第 6 分钟体验完全相同。

`RunEvolution.special()` 的门槛是 `level >= 3`（进化）与 `level >= 8 && 核心术式 >= 3`（觉醒），
而 XP 曲线 `xpNeed = 26 + level * 11`（`progression.ts` L105）在 6 分钟内可支撑 20 级 ——
**门槛设得远低于时长预算**。

### 发现 5 · 头牌内容（20 进化 + 10 融合）在实战中不可达

`TimedChests.claim()` L24 的进化门槛：

```ts
for (const [id, [, a, p]] of Object.entries(evolution))
  if (!this.forms.evolved[id] && (skills[a!] || 0) >= 5 && (passives[p!] || 0) >= 5)
    options.push({ type: 'evo', id });
```

需要**指定主动术式 Lv5 + 配对心法 Lv5**。

两次完整运行（21 次升级、领取 2 个宝箱）实测结果：

| 构筑策略 | 主动术式 | 心法 | 宝箱选项 | 进化 | 融合 |
|---|---|---|---|---|---|
| 聚焦（优先 A011+P026→A026+P030） | A003=5, A011=5, A026=5 | P026=1, P017=2, P023=1, P024=2, P030=2, P033=1 | `upgrade / upgrade / gear` | **0** | **0** |
| 自然（总是选第一项） | A003=5, A011=5, A015=5, A026=5 | P026=2, P016=1, P017=1 | `upgrade / upgrade / gear` | **0** | **0** |

**两次宝箱三选一全是"随机强化 / 随机强化 / 随机装备"，进化与融合选项从未出现。**
`evolved = []`、`fused = []`。

根因：心法槽位 6 个、候选池 11 个（`passiveSkills`），每次只随机展示 3 个，
21 次升级被 6 个心法稀释 → 单个心法期望只能到 3.5 级，**永远到不了 5**。

`evolution.json` 的 20 条配方里，H001 可用的有 9 条（E003/E011/E013/E015/E021/E026/E027/E054/SE001），
`fusions.json` 里 H001 可达的有 4 条（F001=E011+E026、F002=E021+E027、F004=E003+E054、F026=SE001+E015）。
**设计上全部可达，实测全部为零。**

### 发现 6 · 重抽 / 放逐 只在不可达的模式里存在

`Progression.snapshot()` L144：

```ts
const growth = this.journey?.ruleset
  ? Object.freeze({ autoSlots: 4, passiveSlots: 4, rerolls: this.rerolls, banishes: this.banishes, ... })
  : undefined;
```

`ruleset` 只有首章模式会传入（`new RunEvolution(save.hero)` 不带 ruleset）。
`Progression.reroll()` / `banish()` 也通过 `ordinary()` 要求 `journey.ruleset` 存在。

**结论：2 次重抽 + 1 次放逐只在首章模式生效，而首章模式 UI 不可达。
UI 可达的经典征途与进化征途既没有重抽、也没有放逐。**

这直接切断了玩家"塑造构筑"的唯一操作杠杆 —— 也是发现 5 里进化不可达的重要成因。

### 发现 7 · 首章模式在 UI 上完全不可达

`src/App.vue` L61：

```vue
<BattleView v-if="page === 'battle' && active && repository"
  :slot="active" :repository="repository" :journey="journey"
  @exit="home" @replay="replay" />
```

**没有传 `:chapter`。** `App.vue` 里除了两个 CSS 类名（`.chapter-art` / `.chapter-marker`），
没有任何首章逻辑。`main.ts` 也只是 `createApp(App).mount('#app')`。

首章模式（`chapter1-v1`）只在测试夹具 `tests/fixtures/chapterBattle.ts` 里被挂载。
这与 `handoff/STATE.md` 的 "no ... public chapter entry" 一致。

**首章专属内容全部被 `if (this.chapter) return false` 禁用：**

| 系统 | 禁用位置 | 经典/进化征途 |
|---|---|---|
| 地图互动（火药桶/军医/战旗祭坛/弩炮/军箱） | `GameCore.interact()` L85 | ✓ 可用 |
| 定时宝箱（90/210/300s） | `GameCore.claimChest()` L105 | ✓ 可用 |
| 荒原奇遇（万界游商 / 黄金宝箱） | `GameCore.acceptsEvent()` L114 | ✓ 可用 |
| 宠物 PET001 | `CombatSimulation` L116 `enabled: !chapter` | ✓ 可用 |
| 战旗祭坛恢复 | `FirstStageMap.recover()` 需 `enabled` | ✓ 可用 |
| 护符 | `chapter/prepare.ts` L21 **直接抛错** | ✗ 不存在 |
| 重抽 / 放逐 | 见发现 6 | ✗ 不存在 |

**首章是"内容更少"的版本，不是"内容更好"的版本。**
唯一比经典/进化征途更好的地方是：它有真实的失败状态（发现 1）。

### 发现 8 · 一半伤害来自玩家无法操作、自动维持的分身军团

`CombatSimulation.updateOuter()` L415-418 —— **所有已解锁的主动术式自动施法**：

```ts
for (const [id, level] of Object.entries(this.progression.snapshot().skills)) {
  const base = forms.baseCooldowns[id] ?? (this.journeyCombat ? { S001: 7, G2_FROST: 5 }[id] : undefined);
  if (level && base != null && !(this.cool[id]! > 0)) {
    this.cool[id] = base * skillModifier(this.context, this.state(), id).cd;
    this.cast(id);
  }
}
```

注意 fallback `{ S001: 7 }` **永远不会生效** —— 因为 `skillForms.json` 里
`baseCooldowns.S001 = 0.5` 已经存在。

于是 `EvolutionCombat.cast('S001')` **每秒执行 2 次**：

```ts
else if (id === 'S001') this.summon(id, Math.min(6, 1 + m.count), 4.5 * m.duration, route === 'guard', p.atk * .65);
```

`update()` 里每个分身每 0.8 秒攻击一次 `atk × 0.65`，`cap(this.summons, 8)`。

**→ 永久维持 6 个分身，每秒输出 `atk × 6 × 0.65 / 0.8 = atk × 4.875`，完全自动、无需任何输入。**

实测整局伤害来源（进化征途 · 移动+按键）：

```
S001  影分身        87,039   ← 50.0%
A011  火球          33,979
H001_BASIC 普攻     23,626
H001_E  主动技      10,944
H001_R  必杀         8,226
G4_SHADOW_BOND       3,964
PET001               2,747
A003                 1,614
A026                 1,387
H010_WILDFIRE          797
```

`baseCooldowns` 里 `= 0.5` 的条目还有：`A021 / A022 / A030 / A062 / A063 / A068 / A070 / S002 / S003 / S018`。
其中 `A021`（焚城火域）因为有 `!this.fields.some(field => field.id === id)` 去重保护而安全，
但 `S002 / S003 / S018` 与 `S001` 同类，存在相同风险。

**操作面盘点**：ROADMAP 冻结范围写的是"自动普攻，手动移动、闪避、主动技、必杀"。
实际实现里，玩家选择的 6 个主动术式**全部自动施法**，手动按钮只有英雄专属技能与必杀两个，
而这两者**不随构筑变化**（只有形态会改它们）。

→ **玩家选什么构筑，不影响他按什么键。玩家是观众，不是操作者。**

### 发现 9 · 内容量与产品规格的差距

| 项目 | 产品规格 | 主力工程实际可玩 | 缺口 |
|---|---|---|---|
| 关卡 | 12 关 / 首章 3 关 | **1 关**（`prepare.ts` L13 只放 `CH001-01`；UI 连首章都进不去） | −11 |
| Boss | 8 / 首章 2 | **1**（仅 B001） | −7 |
| 英雄 | 首发 6 | **3**（`starter()` 只认 H001/H010/H012；H002/H007/H019 会**抛错**） | −3 |
| 模式 | 7（story/clear/endless/bossrush/tower/daily/abyss） | **1**（`CombatSimulation.state()` 里 `mode: 'story'` 硬编码） | −6 |
| 难度 | 4（休闲/标准/修罗/万界劫） | **1**（UI 无难度选择器，`freshSave` 无 `difficulty` 字段 → normal） | −3 |
| 星级 | 3（`storyContract.stars: clear 2 / mastery 3`） | **0 或 1**（`chapter/settlement.ts` L45 `victory ? 1 : 0`） | −2 |
| 进化 | 20 | **0（不可达，见发现 5）** | −20 |
| 融合 | 10 | **0（不可达）** | −10 |
| 护符 | 6 | **0（`prepare.ts` L21 抛错 + 首章 UI 不可达）** | −6 |
| 形态 | 11 | 11（代码已实现，但无验收、无操作差异） | 验收 |
| 心法 | 11 | 11（但单个到不了 Lv5） | 门槛 |
| 地图事件 | 首章 3 关的 seals / eliteChecks | **0**（`chapterStages[1].seals`、`chapterStages[2].eliteChecks = 2` 已声明未实现） | −3 |

---

## §3 根因分析：三个系统性错位

### 3.1 威胁模型失效 —— 「减伤三层叠加 + 全局无敌帧」

```
敌人伤害 8
  × incoming 0.44          → 3.52      （firstStage.json）
  − def(28) × 0.08 = 2.24  → 1.28      （combatMath.ts:139）
  Math.max(1, ...)         → 1.28
  → 之后 0.28 秒内所有其他伤害被 inv 吞掉（combatMath.ts:138）
```

三层机制各自"看起来合理"，叠加后把玩家变成不死的。**这不是数值问题，是公式结构问题**：
`def × 0.08` 是线性减免（对低伤害过强、对高伤害无感），
`inv` 是全局无敌（让围攻失去意义），`incoming` 是全局乘区（让所有敌人伤害表失去意义）。

### 3.2 成长曲线倒置 —— 「门槛低于时长预算」

XP 曲线 `26 + level × 11` 在 6 分钟内可支撑 Lv20+。
但结构性成长只有两个门槛：Lv3（进化）与 Lv8（觉醒）。
**结果：19% 的时长消耗掉 100% 的成长节点，剩下 81% 是空转。**

同时，本该承担"长线成长"的进化/融合（20+10 条）被 Lv5+Lv5 的高门槛锁死（发现 5）。
**成长系统两头都错：易得的部分太快，难得的部分永远拿不到。**

### 3.3 内容锁死在不可达分支

首章模式是**唯一**同时具备「真实失败状态 + 重抽放逐 + 形态 3 选 1 + 星级/护符/战报」
的完整规则集，却在 UI 上不可达（发现 7）。
UI 可达的经典/进化征途反而缺少这些系统。

**"精品"版本做完了但没人能玩到；玩家能玩到的版本是残缺的。**

---

## §4 设计目标（可度量）

| 编号 | 目标 | 当前实测 | 目标值 |
|---|---|---|---|
| G1 | 静止玩家应当失败 | **胜利（99% 生命）** | 在 120 秒内死亡 |
| G2 | 主动玩家应当有生存压力 | hpMin 94–99% | hpMin 落在 25%–60%（R1g-12 两条路线均达标：classic 0.455 / evolution 0.364） |
| G3 | Boss 战时长 | 6.3s（进化）/ 67.6s（经典） | **60–90 秒**，三阶段各至少一次 |
| G4 | Boss 招式威胁度 | 全招式合计 4.2% 生命（**遗留路径**；threat-v2 下 Boss 单局已造成 56.6% 生命、占全部承伤 34.6%，但单招仅 1.05%） | **单招命中 ≥ 15% 生命** — R1g-11 已达：最弱招 15.00%，见 P0-4 落地记录。**R1g-13 判定：这个定义本身不动**；「不躲」的惩罚走**分档**（死亡率 12.1% → 27.3%），见 §5 P0-4 的 R1g-13 段 |
| G5 | 结构性成长分布 | 前 70s 完成全部 | 进化 Lv3 → 出现在 90–120s；觉醒 → 出现在 240–300s |
| G6 | 进化可达性 | 0 / 20 | 单局至少可达成 **2–3 个进化** |
| G7 | 融合可达性 | 0 / 10 | 熟练玩家单局可达成 **1 个融合** |
| G8 | 玩家操作对输出的贡献 | 手动按钮贡献 ≈ 0%（S001 占 50%） | 手动操作贡献 **≥ 35%** 总伤害（读数 = **两个按钮桶** `manualCoreShare`，不是字面键求和 —— 见 §11.1 的 D12 裁定） |
| G9 | 构筑选择影响操作 | 无影响 | 至少 3 个术式有"手动释放显著更强"的差异 |
| G10 | 每局决策中的"转折点"数量 | 2（进化 + 觉醒） | **≥ 6**（进化 + 觉醒 + 2 进化 + 1 融合 + 1 护符） |

---

## §5 P0 修正：让游戏重新有输赢

> 优先级最高。不做这一层，后面所有内容都无处施展。

### P0-1 受伤公式重做（`src/core/combatMath.ts` `incomingHit`）

**现状**
```ts
if (Number.isFinite(player.incoming)) damage *= player.incoming!;   // ×0.44
...
return { hp: player.hp - Math.max(1, damage - context.baseDef * .08), shield, inv: .28 };
```

**建议**
```ts
// 1. 移除全局乘区：把 firstStage.rule.incoming 从 0.44 改为 1.00，
//    平衡改由敌人伤害表承担（见 P0-3）
// 2. 线性减免 → 软上限曲线
const mitigation = def / (def + 90);
return { hp: player.hp - Math.max(1, damage * (1 - mitigation)), shield, inv: .28 };
```

**减伤曲线对比**

| def | 现公式（对 100 伤害） | 建议公式 | 说明 |
|---|---|---|---|
| 14（H010/H012） | 100 − 1.12 = 98.9% | 13.5% 减免 | 脆皮定位成立 |
| 28（H001） | 100 − 2.24 = 97.8% | 23.7% 减免 | 坦克定位成立 |
| 60 | 95.2% | 40.0% | — |
| 120 | 90.4% | 57.1% | — |
| 300 | 76.0% | 76.9% | 收敛，不免疫 |

**收益**：`def` 从"死属性"变成真正的成长属性；低伤害不再被过度减免；
高 def 不会突然接近免疫。

### P0-2 无敌帧改为「按来源计时」（`combatMath.ts` L138）

**现状**：`inv` 是玩家身上的单一计时器，一次受击后 0.28 秒内所有伤害被吞。

**建议**：`inv` 保留（保护玩家不被单帧多段伤害秒杀），但**接触伤害与招式伤害分开计时**：

```ts
// player 增加字段
contactInv: number;   // 接触伤害独立无敌（0.5s）
// 敌人 AI 接触判定改为
if (d < enemy.r + player.r + 2 && player.contactInv <= 0) {
  this.hurt(enemy.damage, enemy.id);
  player.contactInv = 0.5;
}
```

**目标**：10 个近战敌人围攻时，玩家应在 **6–8 秒内死亡**（当前是"永远不死"）。
这一条单独就能让 G1 从"胜利"变成"失败"。

### P0-3 敌人伤害表上调（`src/data/firstStage.json` `enemies`）

| 敌人 | 现状伤害 | 建议 | 理由 |
|---|---|---|---|
| EN001 黄巾步卒 | 8 | **22** | 单次接触 ≈ 2.9% 最大生命 |
| EN002 黄巾弓手 | 7 | **18** | 远程，可躲，略低 |
| EN003 黄巾盾兵 | 7 | **20** | 慢，但硬 |
| EN004 黄巾骑兵 | 12 | **34** | 冲锋型，惩罚站位 |
| EN005 火箭兵 | 9 | **26** | 范围，惩罚聚集 |
| EN006 黄巾力士 | 16 | **48** | 精英级威胁，必须躲 |

**校验**：玩家 763 HP、23.7% 减免。
3 个步卒围攻（接触无敌 0.5s）→ 每秒约 2 次接触 × 22 × 0.763 ≈ **33.6 HP/s**
→ 763 / 33.6 ≈ **23 秒**。合理。

#### P0-3 落地记录（R1g-1 / R1g-12）—— 机制不同：伤害表进了 opt-in 模型

**原文建议的「直接上调 `firstStage.enemies` 的伤害」没有采用**，因为 `legacy` 必须逐字节不变
（`combat-math-oracle.json` 和章节局都读它）。替代做法是把威胁模型做成 `src/data/threatV2.json`：
`enemyDamage[id] = firstStage.enemies[id].damage × K`，**K 是表内唯一自由度**，只有选
`rules='threat-v2'` 的局读它。K 的两代取值、扫描过程与理由见 §9 落地状态。

上表 22/18/20/34/26/48 是在「`incoming` 归 1 + 新减免公式」下反推的计划值，那条路径没有被采用；
**不要拿它当发货值**。R1g-12 的结论与「杂兵是否仍然致命」的实测（静止玩家 43.8s 死）在
`tasks/game-remediation/evidence/R1g-12/`。

### P0-4 Boss 招式改为「按最大生命百分比」结算

**现状**：`FirstBoss.updateAI` L74-88 的招式伤害是固定值 `13 + phase × 4`，
再乘 `difficultyFor().dmg` —— 会被 P0-1 的公式和 `incoming` 一起吞掉。

**建议**：Boss 招式伤害直接按玩家最大生命百分比计算，绕过减伤公式的乘区：

```ts
// FirstBoss 增加
private strikeDamage(base: number) {
  return this.sim.player.maxHp * base * difficultyFor(this.difficulty).dmg;
}
// 震地斩（circle）  base = 0.18
// 蛮王冲锋（line）  base = 0.22
// 旋风断军（cone）  base = 0.26
```

**目标**：三招各命中一次 ≈ 66% 最大生命 → **玩家必须躲**。
当前这三招整局合计只造成 32 点（4.2%）。

#### P0-4 落地记录（R1g-10 实测 / R1g-11 落地）—— 机制与原文不同

**原文建议的「按最大生命百分比结算」没有采用**，改成「**降频 + 集中**」。原因（R1g-9 实测）：

- Boss 伤害链路是 `base(13 + phase×4) × 形状系数 × difficulty.dmg × bossDamage`，而 `bossDamage`
  **同时乘体接触**。G4 需要 14.31×，此时体接触是 82 HP / 1.1s —— 玩家在第一次施放落地前就死。
  只用 `bossDamage` 的可达上限是 1.5×（4.09%），**是目标的 27%**。
- 比例结算（18/22/26%）绕过了减伤公式，会把相位成长一起抹掉：三招在任何相位都是同一个数。

**实际做法** —— 拆旋钮 + 加一条节奏轴（DECISIONS D7 路径 A）：

| 字段 | 落地值 | 作用 |
|---|---|---|
| `threatV2.bossSkillDamage` | **14.31** | 只乘 `B001-<招式>`，把最弱招（蛮王冲锋 · phase 1）抬到 15.00% |
| `threatV2.bossCastCooldown` | **14.31** | 只乘每次**新赋**的施法冷却（生成 / 相位切换 / 常驻），不乘逐帧递减 |
| `threatV2.bossContactDamage` | **0.8** | 体接触独立；R1g-10 预留、R1g-11 动用，理由见下 |
| `threatV2.bossHp` | **19.95 / 54.15** | 集中的聚合让战斗变短，用 HP 预算把 G3 的 60s 地板买回来 |

**结果**（33 种子 × 2 路线，`bossThreat.test.ts` 的 `hud` 臂 —— 读 HUD 招式提示并按闪避的玩家，
即 `tests/settlement.spec.ts` 的孪生体）：

| 指标 | 落地前 | R1g-11 落地 | R1g-12 重标后 |
|---|---|---|---|
| 单招成本（设计值，最弱招） | 1.05% | **15.00%** | 15.00%（未动，G4 的定义不许动） |
| 每局施放次数 | 37 | **2** | **2** |
| Boss 战时长 | 80.3s | **62.8s** | **62.6s** |
| 主动玩家血线（`hud` 臂） | 0.761 | **0.264**（聚合；分路线 classic 0.280 / evolution **0.147 ✗**） | **0.449**（classic **0.455** / evolution **0.364** —— **两条路线都在 G2 的 25–60% 内**） |
| 胜率 | 3.03% | **72.73%（48/66）** | **87.88%（58/66）** |

**R1g-12 追加**：0.264 这个**聚合**中位数是绿的，但它掩盖了 evolution 的 **0.147**（低于 G2 下沿）。
归因指向**杂兵接触表**而不是 Boss（把 `enemyDamage` 归零 → evolution 0.839 / 33 胜 33），
所以 R1g-12 把该表的唯一自由度 K 从 1.8 重标为 **1.44**（扫描与理由见
`tasks/game-remediation/evidence/R1g-12/`）。**代价**：不闪避那一臂的血线从 **0** 升到 **0.202**
—— 「不躲必死」降级成「不躲拿不到 G2」，已入队 **R1g-13**。

**R1g-13 判定（措辞定稿）**：「不躲必死」这个**说法**被撤回，换成**分档**表述。同一批 66 局/臂的
`losses` 分解给出：

| 臂 | 血线中位 | 胜率 | **战死** | 超时 |
|---|---|---|---|---|
| 读预警 + 按闪避（`hud`） | **0.449** | 87.88% | **8/66 = 12.1%** | 0 |
| 不读预警、不躲（`browser`） | **0.202** | **71.21%** | **18/66 = 27.3%** | 1 |

**不躲让战死率翻 2.25 倍（12.1% → 27.3%）、血线掉 24.7pp、胜率掉 16.7pp，并跌破 G2 下沿。**
所以「惩罚」没有消失，只是从**悬崖**变成**斜坡**——而斜坡更好：悬崖让「一次没躲到」= 「这局白打」，
玩家学到的是放弃（R1g-11 实测：认真读预警的玩家落地前 **64/66 超时**，最优解反而是站桩硬吃）；
斜坡让「躲得好」有正收益而「不躲」仍可玩。**为什么不把惩罚重新挂到 Boss 招式上**：可躲的招式被 G4
钉死在 15%（常数），唯一的自由旋钮是**不可读、不可躲**的体接触——挂上去只会教「站远」，不会教
「读预警」。算术上也要付 `hud` 臂的全部余量（`bossContactDamage` 0.8 → ≈1.55 才够把 `browser`
推归零，而 `hud` 会掉到 ≈0.26，贴着 0.25 下沿）。**零生产改动**，详见 `DECISIONS.md` **D11**。

**为什么 `bossContactDamage` 要动**：招式全部被躲掉之后，体接触就是 Boss 剩下的**全部**伤害。
在 1.0 下这个玩家的血线是 **0.240**（发货表；R1g-10 的 `hp×1.1` 基准上是 0.232），低于 G2 的 0.25；
**0.8 给出 0.264**，0.9 只有 0.248 仍不清线（`hp×1.1` 基准上 0.9 是 0.262，所以 §4 的 sweep 表与
发货表读数不同，见 `evidence/R1g-11/IMPLEMENTATION.md` §4）。

**R1g-12 更正**：上面这条理由**已经不再成立**。杂兵表降 20% 之后重读同一张 sweep，**每一行都进了
G2**：`contact 1.0` → **0.414**、0.9 → 0.438、0.8 → **0.449**。也就是说 **0.8 不再是「最小可行改动」，
而是一个保留的余量**。R1g-12 的 Out of scope 封了所有 Boss 旋钮，所以本片**不动这个值**，
只把断言改成「杠杆方向单调 + 每行都在带内」，并把重新决策这件事交给 **R1g-13**。

**另一个必须记录的实测（R1g-11）**：在**落地前**的配置下，一个认真读预警、按满预警时长躲避的玩家
**66 局里 64 局超时**——它只挨了 38 点 Boss 伤害、血线 0.761，却打不死 Boss。
也就是说落地前「按提示躲招」是要输的，最优解是站桩硬吃。落地后这个惩罚从 **80.3pp 缩到 1.5pp**
（谨慎打法 `hud` 72.73% vs 高效打法 `dodge` 71.21%；落地前同一对是 3.03% vs 83.33%）
——**节奏改动的意义不是"招式变疼"，而是"招式终于躲得起"**。

R1g-12 重标杂兵表后同一对读 **87.88% vs 86.36%**，仍是 **1.52pp** —— 这条结论在更宽的杂兵表下
同样成立，而且**两侧都上移**（不是靠压低其中一侧换来的）。

### P0-5 Boss HP 时间预算（**依赖 P2-2 先修**）

**不要先调 Boss HP。** 当前进化征途的 3,976 DPS 里有一半来自 S001 自动召唤（发现 8）。
正确顺序：

1. 先修 P2-2（S001 冷却），重测 → 预期进化征途 Boss 窗口回到 40–70s
2. 再按 `BossHP = 目标DPS × 75s` 反推
3. 目标：进化征途与经典征途的 Boss 窗口收敛到 **60–90 秒**

**反推参考（修 P2-2 后预期 DPS ≈ 1,500）**：`1500 × 75 = 112,500`
→ `firstBoss.json` 的 `boss.hp` 从 7000 提升到约 **31,500**（× `firstStage.bossHp` 3 ≈ 94,500 有效值）。

---

## §6 P1 修正：让头牌内容可达

### P1-1 进化 / 融合门槛改造（`src/core/timedChests.ts` L23-24）

**现状**：`(skills[a] || 0) >= 5 && (passives[p] || 0) >= 5` → 实测不可达。

**建议（三选一，按推荐度排序）**

**方案 A（推荐）· 主动满级即解锁**
```ts
// 只要主动术式满级，就把它对应的进化放入宝箱候选；心法作为"加速器"而非"门槛"
for (const [id, [, a, p]] of Object.entries(evolution))
  if (!this.forms.evolved[id] && (skills[a!] || 0) >= 5
      && (passives[p!] || 0) >= 1)          // 从 5 降到 1
    options.push({ type: 'evo', id });
```
实测数据支撑：聚焦与自然两种策略都能把 3–4 个主动术式推到 Lv5，心法必然有 Lv1。
→ **G6 从 0 变为 3–4**。

**方案 B · 心法门槛改为"合计"**
```ts
const passiveTotal = Object.values(passives).reduce((sum, lv) => sum + (lv || 0), 0);
if (!this.forms.evolved[id] && (skills[a!] || 0) >= 5 && passiveTotal >= 5) ...
```
但这样所有进化会同时解锁，失去"构筑指向性"。

**方案 C · 裁剪心法候选池**
`passiveSkills` 从 11 条按英雄裁剪到 4–5 条（`evolutionCatalog.ts`）。
单心法期望从 3.5 级提升到 7+ 级 → Lv5 可达。
代价：心法组合自由度下降。

**融合**：`fusions.json` 要求两个进化 ID。方案 A 落地后，单局可达 3–4 个进化
→ 融合（F001 = E011 + E026 等）自然可达。**G7 从 0 变为 1。**

### P1-2 重抽 / 放逐全局化（`src/core/progression.ts` L144）

**现状**：`growth` 只在 `journey.ruleset` 存在时输出 → 经典/进化征途没有重抽与放逐。

**建议**：去掉 `ruleset` 条件，让三种模式都有 **2 次重抽 + 1 次放逐**：

```ts
const growth = Object.freeze({
  autoSlots: this.journey?.ruleset ? 4 : 6,
  passiveSlots: this.journey?.ruleset ? 4 : 6,
  rerolls: this.rerolls, banishes: this.banishes,
  coreSkill: this.journey?.coreSkill(),
  banned: Object.freeze([...this.banned]),
});
```

同步修改 `Progression.reroll()` / `banish()` 与 `ordinary()`，去掉 `journey.ruleset` 依赖。

**收益**：
- 玩家第一次获得"塑造构筑"的操作杠杆 → 直接提升进化可达性（配合 P1-1）
- `BattleView.vue` 已有的重抽/放逐 UI（`v-if="snapshot.growth"`）自动生效，**无需改前端**

### P1-3 首章入口开放 + 内容补齐

**第一步 · 入口**（`src/App.vue`）
- 增加 `chapterOptions` 状态与章节选择页（对应 ROADMAP `R3-U02`）
- `<BattleView ... :chapter="chapterOptions" />`
- 大厅增加「首章 · 边境破围」入口，与「经典征途 / 进化征途」并列

**第二步 · 补齐首章独占内容**（否则首章仍是"内容更少"的版本）

| 缺口 | 数据已声明 | 需实现 |
|---|---|---|
| 三镇界阵 | `chapterStages[1].seals = [{opensAt:90,dwell:20},{opensAt:180,dwell:20},{opensAt:270,dwell:20}]` | 驻守计时 + 离开不清零 + 进度条（ROADMAP `R3-M02`） |
| 精英检定 | `chapterStages[2].eliteChecks = 2` | 2 次精英检定时刻 + 额外宝箱（`R3-M03`） |
| 第二、三关 | `chapterStages[1..2]`（420s / 480s） | 解除 `prepare.ts` L13 的 `CH001-01` 硬校验 |
| 护符 | `chapterCharms` 6 个 | 见 P1-4 |
| 星级 | `storyContract.stars = { clear: 2, mastery: 3, masteryHp: 0.55 }` | 3 星评级：通关 1 星 / 无伤 2 星 / 剩余生命 ≥55% 3 星（`R3-P01..04`） |
| 英雄 | `chapterHeroes` 已含 H010/H012 | 解除 `GameCore.ts` L51 的 `heroId !== 'H001'` 抛错 |
| 难度 | `difficulties.json` 4 档 | 解除 `prepare.ts` L15 的 `normal` 硬校验 + UI 选择器 |

**第三步 · 决策建议**
首章模式当前**禁用**了地图互动/宝箱/奇遇/宠物（发现 7），这是刻意的"规则纯度"设计。
建议**保留这份纯度**，但把首章定位为「**挑战模式**」而非主模式：
- 主线进度走**进化征途**（有局外成长、有宝箱、有奇遇、有宠物）
- 首章模式提供**纯净规则 + 3 星评级 + 护符**，作为"技术验证 / 速通"内容
- 这样两条线各有明确卖点，而不是互相替代

### P1-4 护符接入（`src/chapter/prepare.ts` L21）

**现状**
```ts
if (progress.charms.equipped !== null) throw new Error('战备护符效果尚未接入，请保留存档，等待对应版本。');
```

**建议**：改为把护符注入 `chapterCombatContext()`。

| 护符 | ID | 建议效果 | 注入点 |
|---|---|---|---|
| MC_DODGE | 闪避强化 | 闪避 CD −20%，无敌时间 +0.1s | `CombatSimulation.action('dodge')` |
| MC_ELITE | 精英猎手 | 对精英伤害 +15% | `combatMath.damageMultiplier` 的 `elite` 分支 |
| MC_PICKUP | 拾取范围 | 晶石吸引半径 240 → 340 | `XpField.advance` |
| MC_SURVIVAL | 求生本能 | 生命 <35% 时受伤 −18% | `incomingHit` |
| MC_CYCLE | 循环强化 | 每次升级额外 +1 次重抽机会（上限 3） | `Progression.rerolls` |
| MC_MOVE | 疾行 | 移动速度 +8%，闪避距离 +12% | `CombatSimulation.beginFrame` |

`chapter/settlement.ts` L55 已实现解锁逻辑（通关 → MC_SURVIVAL、觉醒 → MC_CYCLE、≥2 羁绊 → MC_MOVE），
**只差"装备后生效"这一步**。

---

## §7 P2 修正：让玩家有操作权

### P2-1 S001 冷却修复（**单条收益最大**）

`src/data/skillForms.json` 的 `baseCooldowns` 里 `= 0.5` 的条目：

```json
"A021": 0.5, "A022": 0.5, "A030": 0.5, "A062": 0.5, "A063": 0.5,
"A068": 0.5, "A070": 0.5, "S001": 0.5, "S002": 0.5, "S003": 0.5, "S018": 0.5
```

在遗留设计里 `0.5` 是"常驻光环 / 需要频繁刷新"的哨兵值。
但在新的自动施法循环（`updateOuter` L415-418）里，它变成"每秒施法 2 次"。

**建议**
```json
"S001": 7, "S002": 7, "S003": 7, "S018": 7
```
或在 `updateOuter` 里显式跳过哨兵值：
```ts
const SENTINEL = 0.5;   // 常驻效果，由各自的 update 维护，不参与自动施法
if (base != null && base !== SENTINEL && ...) { ... }
```
推荐**两者都做**（改表 + 加防御性判断）。

**预期收益**
- 进化征途整局伤害从 ~174,000 降到 ~90,000 → Boss 窗口从 6.3s 回到 ~13s
- S001 的伤害占比从 50% 降到 ~5%
- 与 P0-5 配合后可把 Boss 窗口调到 60–90s

### P2-2 自动施法双轨化 —— 让构筑影响操作

**现状**：6 个主动术式全部自动施法；手动按钮只有英雄专属技与必杀，且不随构筑变化。

**建议 · 双轨制**

```
自动轨道：所有已解锁主动术式按 baseCooldowns 自动施法，伤害 × 0.6，冷却 × 1.4
手动轨道：玩家可指定 1 个主动术式为「手动主术式」，手动释放时伤害 × 1.0
```

实现：
- `Progression` 增加 `manualSkill: string | undefined`，在升级面板加一个"设为主术式"按钮
- `CombatSimulation.action('skill')` 改为：
  ```ts
  if (this.manualSkill && this.cool[this.manualSkill] > 0) {
    this.cool[this.manualSkill] = 0;             // 手动释放不受自动冷却限制
    this.castManual(this.manualSkill);            // 伤害 ×1.0
  }
  ```
- `updateOuter` 的自动施法对 `manualSkill` 跳过，或按 ×0.6 结算

**目标（G8/G9）**：手动操作贡献 ≥ 35% 总伤害（读数 = **两个按钮桶** `manualCoreShare`，**不是**字面键 `H001_E` + `H001_R` —— 见 §11.1 的 D12 裁定）；至少 3 个术式有"手动显著更强"的差异。

### P2-3 闪避的回报 —— 从"逃跑键"到"操作点"

**现状**：闪避只有位移 + 0.35s 无敌，4.5s CD。除 `shadowfire` 羁绊与 `reaper` 觉醒外无奖励。

**建议 · 完美闪避**
```ts
// CombatSimulation 记录最近一次敌人预警窗口
// 若在预警窗口内（telegraph.life <= 0.25 或敌人接触前 0.2s）闪避：
if (perfectDodge) {
  p.hp = Math.min(p.maxHp, p.hp + p.maxHp * .08);   // 回复 8% 生命
  for (const id of Object.keys(this.cool)) this.cool[id] = 0;   // 刷新主动技 CD
  this.ring(p, 120, 'PERFECT_DODGE');
}
```
**收益**：把"必须躲 Boss 招式"（P0-4）变成正向循环 —— 躲得好 → 回血 + 刷新技能 → 输出更高。

### P2-4 连击系统显性化

**现状**：`combo` / `maxCombo` 已存在（`CombatSimulation` L50-52），但只被 `R004` 符文用到。

**建议**：把 `R004` 的逻辑全局化并上 UI：

| 连击 | 攻速 | 伤害 |
|---|---|---|
| 30+ | +8% | +5% |
| 60+ | +16% | +10% |
| 100+ | +24% | +15% |

- `BattleView` 顶部显示连击数与 2 秒倒计时条
- **压力来源**：清不掉场就掉连击 → 玩家必须主动维持节奏

---

## §8 新增玩法系统提案

> 前七节是"修复"。本节是"变得好玩"。

### S-1 本局誓约（Run Vow）

**为什么现在需要**：实测发现游戏太安全（G1/G2 全不达标）。需要一个**玩家自愿选择风险**的机制，
而不是单方面提高难度。

**设计**：开局 6 选 1（或"不立誓"），每条带明确代价与回报。

| 誓约 | 代价 | 回报 |
|---|---|---|
| 焚身之誓 | 最大生命 −25% | 攻击 +35% |
| 疾影之誓 | 受伤 +30% | 移动速度 +20%，闪避 CD −1.5s |
| 贫者之誓 | 不获得任何地图互动与宝箱 | 每 60 秒自动获得 1 次进化候选 |
| 孤军之誓 | 无法获得护盾与恢复 | 伤害 +25%，击杀回复 0.5% 生命 |
| 猎首之誓 | 精英与首领生命 +40% | 对精英/首领伤害 +50%，掉落品质 +1 档 |
| 逆命之誓 | 每 30 秒随机失去 8% 当前生命 | 每 30 秒随机获得 1 级已有术式 |

**收益**：直接把 G2（生存压力）与 G10（转折点数量）拉起来，且**由玩家自己决定难度**。
同时为"贫者之誓"提供了绕过 P1-1 门槛的替代路径（用生命换进化）。

### S-2 威胁预算导演（Threat Budget）

**现状**：`spawnRules.director()` 已有 `pressure` 概念，但只是"按时间 + 击杀效率"的被动计算，
没有"导演意图"，也没有反馈闭环。

**建议**：每 30 秒生成一个"威胁包"，按玩家**当前 DPS** 反向调整：

```
目标DPS = f(关卡进度)           // 例如 270s 时目标 = 450
实际DPS = 最近 10 秒平均
修正系数 = clamp(实际DPS / 目标DPS, 0.6, 1.8)
威胁包 = 基础威胁 × (1 / 修正系数)
```

- 玩家 DPS 过高 → 加压（更多敌人 / 更高精英概率）
- 玩家 DPS 过低 → 减压（防止卡死）

**收益**：每一局都有节奏起伏；解决"前 70 秒到顶、之后空转"（发现 4）。
**注意**：必须在 P2-1（S001）修好之后才能调 —— 否则会被异常的 DPS 带偏。

### S-3 精英检定（Elite Check）

`chapterStages[2].eliteChecks = 2` 已声明未实现。

**设计**：关卡内 2 个检定时刻（如 150s / 300s），刷出 1 只带 2 词缀的精英 + 护卫。
- 击败 → 立即开启一次宝箱（额外进化/融合候选）
- 未击败（存活超过 60 秒）→ 该精英强化并持续追击

**收益**：给关卡内提供"小目标"，并额外供给进化/融合候选（配合 P1-1 → G6/G7）。

### S-4 三镇界阵（Seals）

`chapterStages[1].seals = [{opensAt:90,dwell:20},{opensAt:180,dwell:20},{opensAt:270,dwell:20}]` 已声明未实现。

**设计**：在 90/180/270 秒于地图三处生成"界阵"。
- 玩家进入界阵范围 → 开始累计驻守时间（20 秒）
- **离开不清零**（ROADMAP 明确要求），但界阵持续刷怪
- 驻守完成 → 全图敌人受到一次大范围伤害 + 获得一次强化

**收益**：这是**唯一一个让玩家"主动站到危险里"的玩法** —— 与"必须移动躲避"形成张力。
直接服务 G2 与 G10。

### S-5 护符轮换（对齐 `R3-P03`）

6 个护符（P1-4）应设计为**改变玩法而非数值**：
- MC_DODGE 让闪避成为输出手段（配合 P2-3 完美闪避）
- MC_ELITE 让玩家主动寻找精英（配合 S-3）
- MC_CYCLE 让重抽成为资源（配合 P1-2）
- MC_PICKUP 让走位路线改变（配合经验晶石）

---

## §9 参数总表

| 组 | 参数 | 现值 | 建议值 | 依据 |
|---|---|---|---|---|
| **威胁** | `firstStage.rule.incoming` | 0.44 | **1.00** | 发现 2 |
| 威胁 | `incomingHit` 减免公式 | `damage - def×0.08` | `damage × (1 - def/(def+90))` | 发现 2 |
| 威胁 | 接触无敌 `contactInv` | 无（全局 inv 0.28） | **0.5（按来源）** | 发现 2 |
| 威胁 | EN001 伤害 | 8 | **22** | P0-3 |
| 威胁 | EN002 伤害 | 7 | **18** | P0-3 |
| 威胁 | EN003 伤害 | 7 | **20** | P0-3 |
| 威胁 | EN004 伤害 | 12 | **34** | P0-3 |
| 威胁 | EN005 伤害 | 9 | **26** | P0-3 |
| 威胁 | EN006 伤害 | 16 | **48** | P0-3 |
| **Boss** | 震地斩 | `13 + phase×4` | 保留链路 + `bossSkillDamage 14.31` → phase1 16.3% 最大生命 | P0-4（改机制，见落地记录） |
| Boss | 蛮王冲锋 | `13 + phase×4` | 同上 → phase1 **15.0%**（G4 的约束招） | P0-4 |
| Boss | 旋风断军 | `13 + phase×4` | 同上 → phase1 15.9%，phase3 峰值 23.4% | P0-4 |
| Boss | 施法间隔 | 2.62 / 2.24 / 1.86s | **× 14.31**（每局约 35–37 次 → 2 次） | P0-4 / D7-A |
| Boss | 体接触 | 同 `bossDamage` | **独立 `bossContactDamage 0.8`** | P0-4 |
| Boss | `firstBoss.boss.hp` | 7000 | **31,500**（待 P2-1 后重测） | P0-5 |
| Boss | 目标窗口 | 90s（设计）/ 6.3s（实测） | **60–90s** | G3 |
| **成长** | 进化门槛 `level >= 3` | 3（18s 达成） | **6**（≈90–120s） | 发现 4 / G5 |
| 成长 | 觉醒门槛 `level >= 8` | 8（70s 达成） | **14**（≈240–300s） | 发现 4 / G5 |
| 成长 | `xpNeed` | `26 + level×11` | `26 + level×16` | 压低升级速度 |
| 成长 | 进化心法门槛 | `passives[p] >= 5` | **`passives[p] >= 1`** | 发现 5 / G6 |
| **操作** | `baseCooldowns.S001/S002/S003/S018` | 0.5 | **7** | 发现 8 / P2-1 |
| 操作 | 自动施法伤害系数 | 1.0 | **0.6** | P2-2 |
| 操作 | 自动施法冷却系数 | 1.0 | **1.4** | P2-2 |
| 操作 | 手动主术式伤害系数 | — | **1.0** | P2-2 |
| 操作 | 完美闪避回复 | 无 | **maxHp × 0.08** | P2-3 |
| 操作 | 连击加成（30/60/100） | 仅 R004 | **+8%/+16%/+24% 攻速，+5%/+10%/+15% 伤害** | P2-4 |
| **系统** | 重抽次数（全局） | 2（仅首章） | **2（全模式）** | P1-2 |
| 系统 | 放逐次数（全局） | 1（仅首章） | **1（全模式）** | P1-2 |
| 系统 | 星级 | `victory ? 1 : 0` | **通关 1 / 无伤 2 / 剩余≥55% 3** | P1-3 |
| 系统 | 难度选择 | 无（恒 normal） | **4 档可选** | P1-3 |
| 系统 | 护符 | 抛错 | **6 个生效** | P1-4 |

### §9 落地状态（R1g-12 追加）

**「威胁」组的六行（`incoming` / 减免公式 / `contactInv` / EN001–EN006）不是照本表落的，而是以
`src/data/threatV2.json` 的形式做成了 opt-in 模型** —— 选 `rules='threat-v2'` 才生效，`legacy`
逐字节不变。所以本表的「建议值」列是**当时的计划值**，与发货值不是一回事：

| 参数 | 本表建议 | 实际发货 |
|---|---|---|
| `firstStage.rule.incoming` | 0.44 → 1.00 | **仍是 0.44**（`legacy`）；threat-v2 用**模型内**的 `incoming: 1` |
| 减免公式 | `damage - def×0.08` → 软上限 | `incomingHit` L146 的软上限**已实现**，但**按 `context.threat` 分叉**（L149 仍是旧的线性式） |
| 接触无敌 | 0.5s 按来源 | **未实现**；threat-v2 用 `contactInterval 0.85` / `bossContactInterval 1.1` |
| EN001–EN006 伤害 | 22 / 18 / 20 / 34 / 26 / 48 | **11.52 / 10.08 / 10.08 / 17.28 / 12.96 / 23.04**（= `firstStage.enemies[id].damage × 1.44`） |

EN001–EN006 的发货值是 `firstStage` 的原始伤害（8 / 7 / 7 / 12 / 9 / 16，**未改**）乘一个
**表内唯一自由度 K**。R1g-1 取 K = 1.8（在**更弱的驱动**上标定），R1g-12 在忠实孪生体上重扫为
**K = 1.44**，理由与扫描见 `tasks/game-remediation/evidence/R1g-12/`。本表的 22/18/20/34/26/48
是在「`incoming` 归 1 + 旧线性减免」下反推的，那条路径没有被采用，**不要拿它当发货值**。

---

## §10 与整改路线 ROADMAP 的切片映射

| 本方案 | 对应 ROADMAP 切片 | 备注 |
|---|---|---|
| P0-1 / P0-2 / P0-3 威胁模型 | **无对应切片** | 需新增（建议编号 `R1g-1` 威胁模型重建） |
| P0-4 / P0-5 Boss | `R1g`（恢复自然失败） | STATE.md 已列为 Unresolved risk |
| P1-1 进化门槛 | `R2-D` 前置 | 门槛不改，200 种子报告会全是"零进化" |
| P1-2 重抽全局化 | **无对应切片** | 需新增（建议 `R2-S00` 构筑杠杆） |
| P1-3 首章入口 | `R3-U02` 章节页 | — |
| P1-3 三镇界阵 | `R3-M02` | 数据已声明 |
| P1-3 精英检定 | `R3-M03` | 数据已声明 |
| P1-3 星级 | `R3-P01..04` | — |
| P1-4 护符 | `R3-P03` 六护符 | 只差"装备后生效" |
| P2-1 S001 冷却 | **缺陷修复** | 建议单独切片，优先级最高 |
| P2-2 自动施法双轨 | **无对应切片** | 需新增（建议 `R1c-1` 操作权） |
| P2-3 完美闪避 | 无对应切片 | 需新增 |
| P2-4 连击 | 无对应切片 | 需新增 |
| S-1 本局誓约 | 无对应切片 | 需新增 |
| S-2 威胁预算导演 | 无对应切片 | 需新增 |
| S-3 精英检定 | `R3-M03` | — |
| S-4 三镇界阵 | `R3-M02` | — |
| S-5 护符轮换 | `R3-P03` | — |

### 建议的切片顺序

```
R1g-1  威胁模型重建（P0-1/P0-2/P0-3）        ← 必须先做，否则后面所有调参都被公式吞掉
R1g-2  S001 冷却修复（P2-1）                  ← 单条收益最大，独立可验证
R1g-3  Boss 时间预算（P0-4/P0-5）             ← 依赖 R1g-1 + R1g-2
R1g-4  成长节奏重排（§9 成长组）              ← 独立
R2-S00 构筑杠杆（P1-2 重抽全局化）            ← 独立
R2-F00 进化门槛改造（P1-1）                   ← 依赖 R2-S00
R1c-1  操作权（P2-2/P2-3/P2-4）               ← 独立
R3-U02 首章入口（P1-3 第一步）
R3-P03 护符生效（P1-4）
R3-M02 三镇界阵（S-4）
R3-M03 精英检定（S-3）
R4-X   新玩法（S-1 誓约 / S-2 威胁预算）
```

---

## §11 验收指标与回归测试

### 11.1 建议新增的自动化断言

把 §0 的测量矩阵固化为测试（放在 `src/**/*.test.ts`，纯规则，无浏览器）：

```ts
test('静止玩家必须在 120 秒内死亡（G1）', () => {
  const r = simulate({ journey: 'evolution', move: false, press: false, seed: 15 });
  expect(r.endReason).toBe('defeat');
  expect(r.time).toBeLessThan(120);
});

test('主动玩家应当有生存压力（G2）', () => {
  const r = simulate({ journey: 'evolution', move: true, press: true, seed: 15 });
  expect(r.hpMin / r.maxHp).toBeGreaterThan(0.25);
  expect(r.hpMin / r.maxHp).toBeLessThan(0.60);
});

test('Boss 战时长落在 60-90 秒（G3）', () => {
  for (const seed of [15, 77, 2024]) {
    const r = simulate({ journey: 'evolution', seed });
    expect(r.bossWindow).toBeGreaterThanOrEqual(60);
    expect(r.bossWindow).toBeLessThanOrEqual(90);
  }
});

test('单局至少达成 2 个进化（G6）', () => {
  const r = simulate({ journey: 'evolution', focused: true, seed: 15 });
  expect(Object.keys(r.evolved).length).toBeGreaterThanOrEqual(2);
});

test('手动操作贡献不低于 35%（G8）', () => {
  const r = simulate({ journey: 'evolution', seed: 15 });
  // 手动操作 = **两个按钮**（技能键 + 必杀键）所造成的一切：按钮自身的伤害，
  // **加上**按钮释放的已拥有术式（`releaseManual()` → `A003_E` / `A011_E` / ...；
  // 形态 kit → `G4_WIND_E` / `G5_FROST_E` / ...）。
  // 桶的定义与正式断言见 `apps/mobile-next/src/core/manualDamage.test.ts` 的 `MANUAL_CORE`；
  // 实测口径：`manualCoreShare` = 0.3739（发货 165 局池化）。
  const manual = sumBuckets(r.damageBy, ['manualSkill', 'manualUltimate']);
  const total = Object.values(r.damageBy).reduce((s, v) => s + v, 0);
  expect(manual / total).toBeGreaterThanOrEqual(0.35);
});
```

> **R2-F-GDD-G8 裁定（D12）—— 上面的 G8 断言已按本节的设计意图改写。**
> 原文按**字面键**求和（`['H001_E','H001_R']`），实测 **0.1365**，**未达本节自己写的 35%**；
> 而按**两个按钮桶**读是 **0.3739**，两者相差 **2.74×**。裁定依据不是「哪个过」，而是**本节问的是什么**：
> G8 的指标名是「**玩家操作对输出的贡献**」，现状列写的是「手动按钮贡献 ≈ 0%（S001 占 50%）」，
> 目标是「手动操作贡献 ≥ 35% 总伤害」——它要回答的是**玩家的手有没有用**。
>
> 两个字面键答不了这个问题，理由有三条（全部实测）：
>
> 1. **它们是两个桶的严格子集**（`12,098,521 ⊂ 33,139,229`），且**恰好是生产自己的 `manual` 旗标
>    判为 `auto` 的那一部分**——即「按钮自身的签名伤害」，不是任何一次手动释放。
> 2. **它们看不到这个指标存在的理由**：R1g-7 落地的手动释放（`A003_E` = 13,447,659，全账本最大的一项）
>    根本不在那两个键里。
> 3. **它们随玩家变强而下降**：`evolution/unlock` 是唯一「有的局进化、有的局没进化」的 cell，
>    在它上面 `r(进化数, gddShare) = **−0.32**`，而 `r(进化数, manualCoreShare) = **+0.34**`。
>    两个字面键（`H001_E` 由 `CombatSimulation:292` 与 `EvolutionCombat:79` 两个发射点共用一个键名，
>    后者只在英雄**尚未进化**时触发）测的是「这一局在基础形态待了多久」，不是玩家的操作。
>
> **保守界**：若将来把口径收紧为「只有被释放的术式算手动」（即只读 `manual` 旗标），读数是 **0.2217**，
> **未达 35%**。届时要么承认 G8 未达，要么把门槛重设为 ~0.20；**不能**在两种口径之间来回挑。
> 正式断言与逐 cell 数字见 `tasks/game-remediation/evidence/R2-F-GDD-G8/IMPLEMENTATION.md`。

### 11.2 必须保持的不变式（`handoff/STATE.md`）

- Fresh ST001 stages start at 0 stars
- Defeat grants 0 chapter stars
- Non-story modes do not alter chapter stars
- One run settles at most once
- Endless ignores legacy 20-minute completion
- Boss respawn / permanent aura slow / rift cumulative-kill 三项 V3.0 修复不得回归
- Schema30 存档：新增字段必须全部可选且有默认值
- 有序脚本加载顺序不变；不新增依赖；无公开 Debug UI

### 11.3 每轮验收命令

```bash
npm run check && npm run smoke && npm run audit && npm run context && npm run archive:verify
cd apps/mobile-next && npm run verify     # typecheck + vitest + build + playwright
```

---

## 附录 A · 测量复现方法

本轮测量使用一次性 vitest 文件驱动 `GameCore`（已在完成后删除，未改动仓库）：

```ts
import fresh from './data/freshSave.json';
import { GameCore } from './core/GameCore';
import { eventPayment } from './core/firstEvents';

const core = new GameCore(structuredClone(fresh), seededRng(15), 'evolution');
core.start(390, 844);
for (let step = 0; step * DT < 400; step++) {
  const st = core.snapshot();
  // 处理 choosing / encounter / chest / boss-loot，其余推进
  core.move(...); core.action('skill'); core.advance(1 / 60);
}
```

关键点：
- `GameCore` 与 `CombatSimulation` 是**纯规则**，无 DOM / 时钟 / 音频依赖
  （`CombatSimulation` 类注释：「One run's rule state; no DOM, clocks, audio, or presentation-dependent RNG」）
- 种子通过 `Math.random` 注入替换（`GameCore` 构造函数第 2 参数）
- 伤害明细从 `core.renderState()` 之外的 `combat.damageBy` / `damageTakenBy` 读取

## 附录 B · 本轮引用的文件

| 文件 | 关键行 | 用途 |
|---|---|---|
| `src/core/combatMath.ts` | L128-140 | 受伤公式（发现 2） |
| `src/core/CombatSimulation.ts` | L415-418 | 自动施法循环（发现 8） |
| `src/core/CombatSimulation.ts` | L105-120 | chapter 限制与宠物禁用（发现 7） |
| `src/core/CombatSimulation.ts` | L212-238 | `action()` 英雄分支 |
| `src/core/progression.ts` | L99-112, L143-146 | XP 曲线与 growth 条件（发现 4/6） |
| `src/core/timedChests.ts` | L18-28 | 进化/融合门槛（发现 5） |
| `src/core/spawnRules.ts` | L19-29 | director 压力模型（S-2） |
| `src/core/FirstBoss.ts` | L33-39, L74-93 | Boss HP 与招式伤害（发现 3 / P0-4） |
| `src/core/GameCore.ts` | L51, L85, L105, L114 | 首章限制（发现 7） |
| `src/chapter/prepare.ts` | L13, L15, L21 | 首章硬校验与护符抛错（发现 7 / P1-4） |
| `src/chapter/settlement.ts` | L45, L55 | 星级与护符解锁（P1-3 / P1-4） |
| `src/chapter/catalog.ts` | L9-20 | 首章冻结规则真值（发现 9） |
| `src/App.vue` | L61 | 首章入口缺失（发现 7） |
| `src/data/firstStage.json` | `incoming: 0.44` | 全局减伤（发现 2） |
| `src/data/skillForms.json` | `baseCooldowns.S001: 0.5` | 自动召唤根因（发现 8） |
| `src/data/evolution.json` | 20 条 | 进化配方（发现 5） |
| `src/data/fusions.json` | 10 条 | 融合配方（发现 5） |
| `src/data/difficulties.json` | 4 档 | 难度表（发现 9） |
| `tasks/game-remediation/ROADMAP.md` | L5-12, L22-46 | 冻结范围与切片表（§10） |
| `handoff/STATE.md` | L59-77 | 已承认的未解风险（§10/§11） |
