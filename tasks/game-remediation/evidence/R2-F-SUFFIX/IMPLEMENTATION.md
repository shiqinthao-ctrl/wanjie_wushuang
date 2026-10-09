# R2-F-SUFFIX —— `_E` 同时是两个意思

Base: **R2-F-SHADOW**（零生产改动）。Queue `QUEUE.md` #6l。发现处：`evidence/R2-F10/IMPLEMENTATION.md` §5.4；
R2-F-SHADOW §1 再次撞上。

**一句话结论**：`CombatSimulation:218` 用 `_E` 后缀标记「手动释放」，而**每个形态的技能 id 本身就以 `_E` 结尾**
（`EvolutionCombat:61` 造 `${heroId}_E`）。一个字符串两种意思。本片把两种意思分开量了出来，并且发现
**唯一真正读错的地方是 GDD §11.1 的字面读数被 `MANUAL_CORE` 冒名顶替（2.74×）** —— 而分类器本身对 G8 是对的。

**生产改动 0 行、0 文件。** 全部改动在 `manualDamage.test.ts`（仪器层），且**已落盘报告的每一个旧字段逐位复现**
（见 §8）。

---

## §0 前提核实表（在**当前树**上逐条验，不沿用队列措辞）

| # | 队列 / TASK.md 的说法 | 实测 | 依据 |
| --- | --- | --- | --- |
| 1 | `:218` 用 `_E` 标记手动释放 | ✅ `const key = manual ? \`${source}_E\` : source;` | `CombatSimulation:218`（`hit` 同形 `:228`） |
| 2 | 每个形态的技能 id 以 `_E` 结尾 | ✅ `const id = \`${v.heroId}_${action === 'skill' ? 'E' : 'R'}\``，命名 kit 是字面量 | `EvolutionCombat:61` / `:66-95` |
| 3 | `manualDamage.test.ts:117` 用 `/_E$/` 切整个账本 | ✅ `if (SKILL_EXTRA.has(source) \|\| /_E$/.test(source)) return 'manualSkill';` | `:117`（`/_R$/` 在 `:118`，**后测**） |
| 4 | 只有**两个** `_E`/`_R` 分类器 | ✅ 全库 grep `_E$`/`_R$`/`endsWith('_E')`：`manualDamage.test.ts:117/118`、`:459`、`formPressure.test.ts:2572`、`:2895`。其余命中是形态 id 的**字面用法**（`chapter-dragon.spec.ts:44/54` 等） | grep（见 §8） |
| 5 | `manualCast` 的语义是「正在 `releaseManual()` 里」 | ✅ `:129` `manualCast = false`；`:410-416` 只在 `try/finally` 里置真 | `CombatSimulation:129/410-416` |
| 6 | 手动释放的 id 是**拥有技能**，不是形态 kit | ✅ `manualId() = this.threat ? this.progression.manualSkill() : undefined`；`manualSkill()` 走 `build.active` | `:418`、`progression.ts:97-104` |
| 7 | `releaseManual()` 只从 **skill** 分支到达 | ✅ `:272`（journey 路径）、`:294`（classic 路径），**没有** ultimate 分支 | `CombatSimulation:272/294` |
| 8 | `AUTO_IDS`（`baseCooldowns` 键 + `G2_FROST`）不含形态 id | ✅ 键集 = `A001…A073` 子集 / `S001`/`S002`/`S003`/`S018` | `skillForms.json:186-221` |
| 9 | `build.active` 里没有 `_E`/`_R` 结尾的 id | ✅ `freshSave.build.active = [A011,A021,A026,A027,A003,A054]`；`activeSkills` = 10 个 `A0xx`/`S001`/`G2_FROST` | `freshSave.json`、`evolutionCatalog.ts:43` |
| 10 | `action()` 只能由玩家输入到达（没有自动施放驱动器） | ✅ 生产侧只有 `controls.ts:16`（键盘）、`BattleView.vue:91`（UI）、`GameCore.ts:91` | grep `.action(` |
| 11 | `settlement.spec.ts`（浏览器机器人）读手动轨 | ❌ **不读** —— 全文件对 `manual`/`_E`/`_R`/`damageBy` 只有 1 处命中且无关 | grep（§6） |
| 12 | 队列说「可见的失败只是 R2-F10 的一条红断言，是危害最小的那一端」 | ✅ 对，但**它同时掩盖了一个假绿**：GDD §11.1 的字面读数被一个同名但不同义的字段顶替（§3） | §3 |

**结论**：前提 1–11 全部成立；前提 12 的「危害最小」**只对了一半**。

---

## §1 Scope 1 —— 四个键 `X` / `X_E` / `X_R` / `X_R_E` 各落哪个桶

`bucketOf` 的分支顺序决定一切。探针（`probe-output.txt` 段 A）在**当前树**上读出（探针内是 `bucketOf` 的
逐字副本，见 §8 的保真声明）：

| `X` | `X` | `X_E` | `X_R` | `X_R_E` |
| --- | --- | --- | --- | --- |
| `A011`（拥有技能） | `autoSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `A003` / `A026` / `A013` / `A015` / `A021` / `A027` / `A054` | `autoSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `S001` | `summon` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `G2_FROST` | `autoSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `H001_E`（形态 kit id） | `manualSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `G4_WIND_E` / `G5_FROST_E` / `G5_FIRE_E` / `G2_LIGHTNING_E` / `G2_FROST_E` | `manualSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `H001_R` / `G4_WIND_R` | `manualUltimate` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `H001_BASIC` / `H001_SLASH` | `basic` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `H010_BOMB` | `manualSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `H012_CLONE` / `H012_R_CLONE` / `H010_CLONE` / `G2_FROST_CLONE` | `summon` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `G4_SHADOW_BOND` / `H010_WILDFIRE` | `autoSkill` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `H010_BOND` / `H012_DODGE` | `manualDodge` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `PET001` | `pet` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `F004` | `fusion` | `manualSkill` | `manualUltimate` | **`manualSkill`** |
| `MAP_BARREL` / `MAP_MECHANISM` | `manualMap` | `manualMap` | `manualMap` | `manualMap` |

三件事从表里直接读出来：

1. **`X_E` 对任何 `X` 都落 `manualSkill`** —— 包括 `PET001_E`、`F004_E` 这种永远不会被生产的键。
   分类器**没有在分类 id，它在分类后缀**。
2. **`X_R_E` 对任何 `X` 都落 `manualSkill`**（`MAP_` 前缀除外，因为 `:115` 最先测）。这就是
   「手动**必杀**释放」的形状，而它被判成手动**技能**。`probe-output.txt` 段 A2 把分支级原因钉住：
   `H001_R_E /_E$/=true /_R$/=false -> manualSkill` —— `/_E$/` 先测，`X_R_E` 以 `_E` 结尾。
3. `MAP_*` 免疫，因为 `startsWith('MAP_')` 在链首。

**「手动施放的形态技能落哪个桶」的答案（TASK.md Scope 1 要测的前提）**：
**不存在「自动施放的形态技能」这回事。** `action('skill')` 只由玩家输入到达（§0 #10），而形态 kit 只由
`EvolutionCombat.action` 生产 —— 所以形态技能**永远**是手动轨的伤害，落 `manualSkill`，正确。
反过来，**自动施放**只走 `updateOuter` 的 `cast(id)`，`id` 取自 `progression.snapshot().skills`（= `build.active` 的
`A0xx`/`S001`/`G2_FROST`），**没有一个以 `_E` 结尾**（§0 #8/#9）⇒ 自动施放**不会**落进 `manualSkill`。
**TASK.md 的待测前提为假** —— 但它为假的原因是「`_E` 恰好同时是 kit id 的后缀」，而不是「分类器分得清」。

---

## §2 Scope 2 —— 污染量：把「哪个按钮打的」和「是不是手动释放」分开量

探针把 `hit`/`hitBoss` 包成**精确 `damageBy` 增量**账本，记录每次调用**实际收到的 `manual` 旗标**
（生产自己的旗标，不是第二个分类器）。这一能力已经**落进 harness 本体**（`Sample.truthByKey`，只读，见 §4），
下面两份表都来自落盘报告的 `suffixReading`。

### 2.1 每个桶：来自 `manual=true` 调用 vs `manual=false` 调用

| 桶 | 来自 `manual=true` | 来自 `manual=false` | 「自动」占比 |
| --- | --- | --- | --- |
| **`manualSkill`** | **19,654,845** | **10,447,522** | **34.71%** |
| **`manualUltimate`** | **0** | **3,036,862** | **100%** |
| `manualMap` | 0 | 139,671 | 100% |
| `manualDodge` | 0 | 90,474 | 100% |
| `autoSkill` | 0 | 41,023,281 | 100% |
| `summon` | 0 | 3,087,418 | 100% |
| `basic` | 0 | 10,270,325 | 100% |
| `pet` | 0 | 872,081 | 100% |
| `fusion` | 0 | 16,903 | 100% |

**`manualUltimate` 是 100% 非手动。** 这不是分类器的错：`releaseManual()` 只在 skill 分支被调用（§0 #7），
**游戏里根本不存在「手动必杀释放」这个机制**。桶名承诺了一个不存在的机制。落在里面的 3,036,862 全部是
`H001_R`（经典必杀按钮）—— G8 意义上确实是玩家发起的，所以 G8 不受影响；作为「手动轨」读数是 0。

**`manualSkill` 是混合物，34.71% 不是手动释放。** 而且那 34.71% **恰好是两个来源**，两者都是「按钮自己的 id」
而不是「释放」：

| 泄漏键 | `manual=false` 伤害 | 它其实是什么 |
| --- | --- | --- |
| `H001_E` | 9,061,659 | 经典技能弧（`:292`）/ `dragon` 形态的突进弧（`:78-79` 的 `else`） |
| `H010_BOMB` | 1,385,863 | 经典技能按钮的五颗炸弹（`SKILL_EXTRA` 显式白名单） |

合计 10,447,522 = 桶的 34.71%。harness 现在把这条断言写成**集合相等**（`['H001_E','H010_BOMB']`），
所以第三个来源出现时是红，而不是静默变宽。

**为什么 G8 依然是对的**：G8 的定义是「玩家发起的桶 / 总伤害」（`:95` 的注释原文），而 `H001_E` 与
`H010_BOMB` **都是技能按钮**。所以把它们并进 `manualSkill` 是**符合 G8 定义**的。错的是「`manualSkill` ＝ 手动轨」
这个读法 —— 而这个读法正是 `:117` 注释（「`_E` 是分类器的手动技能标记」）自己写的。

### 2.2 唯一**能**同时是两个东西的键：`G2_FROST_E`

| 事实 | 依据 |
| --- | --- |
| 它是**霜君形态**的签名场：`frostField('G2_FROST_E', …)` | `EvolutionCombat:69`；`formPressure.test.ts:195` `field: 'G2_FROST_E'` |
| 它**同时**是拥有技能 `G2_FROST` 的**释放键**：`manualSkill()` 会返回 `G2_FROST` | `progression.ts:97` 走 `build.active`，其末位就是 `G2_FROST`（`RunEvolution:9`） |

本片在落盘账本上量到：`G2_FROST_E = 52,713`，**`manual=true` 全部、`manual=false` 为零** —— 在这套 harness 的
总体里它**只**是释放。原因见 §2.3。

这条已经写成断言（`truth['G2_FROST_E'].auto === 0`），所以**将来这套 harness 一旦真的跑到霜君形态，
撞名会在这里变红**，而不是把形态的场静默并进手动轨。

### 2.3 为什么撞名在这两套 harness 里都不可达 —— 两边都是**刻意绕开**

| harness | 怎么绕开 | 依据 |
| --- | --- | --- |
| `formPressure.test.ts` | 靠**让 `manualSkill()` 解析到 `A011`**：两个臂都保留 `A011`，因为 `manualSkill()` 取「第一个严格更高的等级」而 `A011` 在 `build.active` 里早于 `G2_FROST`。注释明说「**把 `A011` 从 off 臂拿掉，它就会解析到 `G2_FROST`** —— 另一个技能、另一个元素、地图上另一个位置」 | `:1009-1010`、`:1044-1047` |
| `manualDamage.test.ts` | 靠**驱动本身只到达 `dragon` 形态**：165 局里 `dragon@r2` 97 局、`(none)` 66 局、`dragon@r1` 2 局，**没有一局到霜君**，所以 `G2_FROST_E` 只可能是释放 | 探针 `probe-output.txt` 段 B5 |

两边都没有断言这个绕开 —— `formPressure.test.ts:2895` 的守卫是
`k.endsWith('_E') && !spec.kit.includes(k)`，它**把 `G2_FROST_E` 当 kit 减掉**，所以那条守卫
**看不见** `G2_FROST` 的释放。这是一个「靠构造回避、没被断言」的活口子，本片把它记下来（§10 写回队列）。

---

## §3 本片真正的活缺陷：GDD §11.1 的字面读数被冒名顶替（**2.74×**）

这是本片最重的一条，也是 R2-F10 §5.4 那条红断言的**另一头**。

GDD `docs/design/GDD-可玩性提升设计-v2.md:917-922` 的 G8 断言**原话**：

```ts
test('手动操作贡献不低于 35%（G8）', () => {
  const r = simulate({ journey: 'evolution', seed: 15 });
  const manual = ['H001_E', 'H001_R'].reduce((s, k) => s + (r.damageBy[k] || 0), 0);
  const total = Object.values(r.damageBy).reduce((s, v) => s + v, 0);
  expect(manual / total).toBeGreaterThanOrEqual(0.35);
});
```

它是**两个字面 `damageBy` 键求和**。而 harness 里的 `MANUAL_CORE` 是**两个桶**（`:98`），
并且它的注释与 `Sample.manualCoreShare` 的注释都写着「**The GDD's own §11.1 test reads only these two keys**」
/「**G8 read the way the GDD's own test reads it (`H001_E` + `H001_R`)**」（`:97`、`:140`）。

两者差 2.74 倍：

| 读数 | 定义 | pooled | 门槛 `.35` |
| --- | --- | --- | --- |
| `manualShare` | `MANUAL` 四个桶 | **0.3765** | ✅ 过 |
| `manualCoreShare` | `manualSkill` + `manualUltimate` 两个桶 | **0.3739** | ✅ 过 |
| **`gddSnippetShare`（新）** | GDD 的字面 `damageBy['H001_E'] + damageBy['H001_R']` | **0.1365** | ❌ **差 21.4pp** |

分格（新字段 `cells[].gddSnippetShare`）：

| 格 | `manualShare` | `manualCoreShare` | `gddSnippetShare` | 比值 |
| --- | --- | --- | --- | --- |
| classic/first | 0.3314 | 0.3282 | **0.1552** | 2.115 |
| evolution/first | 0.4085 | 0.4063 | **0.1383** | 2.938 |
| classic/unlock | 0.3007 | 0.2985 | **0.1362** | 2.192 |
| evolution/unlock | 0.3725 | 0.3690 | **0.1215** | 3.037 |
| evolution/focus | 0.4085 | 0.4063 | **0.1383** | 2.938 |

**为什么差这么多（机制，不是数值）**：按钮自己的伤害源**不是** `H001_E` 的形态。`EvolutionCombat:61` 造
`${heroId}_E`，命名 kit 是 `G4_WIND_E` / `G5_FROST_E` / `G2_LIGHTNING_E` / … —— 所以 GDD 的两键求和
**只看得见经典路径和 `dragon` 形态**。再叠上 R1g-7 的双轨机制：按钮真正的产出是**被释放的拥有技能**
（键 `A003_E` = 13,447,659，是 `manualSkill` 里最大的一项），而它**不在** GDD 的两键里。

**这一条为什么是「假绿」**：`MANUAL_CORE` 的注释声称它**就是** GDD 的读数，于是
`expect(core).toBeLessThanOrEqual(headline)`（`:403`）与 `expect(core).toBeGreaterThan(.08)`（`:404`）
让人以为 GDD 的 35% 门槛被 `manualCoreShare = .3739` 满足。**一个照 GDD 逐字实现验收的评审会得到
0.1365 并判 G8 未达标** —— 而 harness 报的是过。

**本片没有把 `manualCoreShare` 改成 0.1365**，理由写在 §4.3。

---

## §4 Scope 3 —— 修法归属：**分类器**，不是后缀

### 4.1 后缀侧（生产）的代价

- 改 `CombatSimulation:218` 的后缀（例如 `X@manual`）会**改写每一个已落盘账本的键名** ——
  `manual-report.json` 的 `damageRanking`（34 行）、`suffixReading.keys`、以及 `formPressure.test.ts` /
  `windShadow.test.ts` 里所有读 `dealtBy` 键的断言。
- **它买不到分类器买不到的东西**：`legacy` 逐字节安全（`_E` 只在 `manual===true` 时出现，而 `manualCast` 只在
  `releaseManual()` 里置真，那要求 `threat` ⇒ legacy 路径永远不产生后缀），但**信息本身没有丢** ——
  后缀是**追加**的，所以「释放」的形状（`X_E`，其中 `X` 不以 `_E` 结尾）与「kit id」的形状**可以**区分开。
- 结论：**后缀是清白的**。`CombatSimulation:210-213` 声明的用途（「一次释放与同一技能的自动施放保持可分辨」）
  **被满足且被实测**：`A003`（auto，7,161,671）对 `A003_E`（release，13,447,659）。模糊的是**读的人**，
  不是写的人。

### 4.2 分类器侧（仪器）的代价

- 0 生产改动；**已落盘报告的每一个旧字段逐位复现**（§8 的 md5 账）。
- 可以表达**两种**读法（G8 的「哪个按钮」与遥测的「是不是释放」），信息量严格更大。

### 4.3 裁定与落地

**修分类器。** 三处，全部在 `manualDamage.test.ts`：

1. **`bucketOf` 加 `/_R_E$/ → manualUltimate`，放在 `/_E$/` 之前**（`:117` 之前）。
   这是唯一能从**键字符串本身**把两种意思分开的地方。实测该分支在本总体上是**空操作**
   （断言：`keys.filter(k => /_R_E$/.test(k))` 为空），所以它不移动任何一个已记录的数字 ——
   它存在是为了 `releaseManual` 被接到必杀键的那一天（一行改动之遥）。
2. **`:459` 的裸 `/_E$|_R$/` 换成 `isManualRelease`**（新增 `KIT_IDS` 集合，把形态 kit id 减掉）。
   这与 `formPressure.test.ts:2895` 已经在做的减法**同构**；原写法只有因为 `ranked[0] === 'A011'`
   才碰巧通过，任何一天有 kit id 登顶它就会**为错误的理由变红**。
3. **`MANUAL_CORE` / `manualCoreShare` 的两处注释改成准确描述**，并把 GDD 的字面读数
   作为**新字段 `gddSnippetShare`**（headline + 每格）量出来，配两条断言
   （`gdd < TARGET.manualShare`、`core / gdd > 2`）。

**为什么不把 `manualCoreShare` 本身改成 0.1365**（这是本片唯一的取舍，两种做法都写在这里）：

- 它是 `evidence/R1g-11` / `R1g-12` 与已落盘 `manual-report.json` 引用的**记录值**；改定义等于
  **静默改写**那些报告里的数字，正是 TASK 的 constraint 警告的那种失败模式。
- GDD 的两键求和在**非 `H001` 形态**上**根本不是良定义**的读数（§3），所以它不是更好的 headline。
- 缺陷是**误标**。误标的修法是**把标签写准 + 把缺失的测量补上**，不是搬动别人依赖的数字。

于是 `manualCoreShare = 0.3739` **保持不变**（旧读法有断言守着），GDD 的字面读数**新增且被守卫**。
`MANUAL_CORE` 现在被准确描述为「两个按钮桶 = 去掉地图/闪避键的手动份额」，而它与 GDD 字面读数的
差距（2.74×）变成一条**会变红**的断言，而不是一条注释里的口误。

---

## §5 Scope 4 —— 重跑 G8，重述三个读数

| 读数 | 值 | 目标 | 状态 |
| --- | --- | --- | --- |
| `manualShare`（pooled，5 格 165 局） | **0.3765** | ≥ .35 | ✅ |
| `manualShareDistinct`（去掉重复的 evolution/focus） | **0.3653** | ≥ .35 | ✅ |
| `manualCoreShare` | **0.3739** | —— | 记录值，逐位复现 |
| **`gddSnippetShare`（新）** | **0.1365** | ≥ .35 | ❌ **未达**（差 21.4pp） |
| `manualStrongSkills` | **10** 个 distinct id | ≥ 3 | ✅ |

`manualStrongSkills` 的来源与后缀无关：它取自 `sim.cast` 包装器的 `manualSkillCasts`
（`manualDepth > 0` 期间被 `cast` 的 id），即 `releaseManual()` → `progression.manualSkill()`。
实测 10 个：`A011 A021 A027 A026 A003 A054 G2_FROST S001 A015 A013`（与 `ownedSkillIds` 同集）。
**本片没有触及 G9。**

每格的手动份额（未动，逐位复现）：classic/first .3314、evolution/first .4085、classic/unlock .3007、
evolution/unlock .3725、evolution/focus .4085 —— 3 格清线（≥ .35），与 R1g-11/R1g-12 记录一致。

---

## §6 Scope 5 —— 浏览器机器人

`apps/mobile-next/tests/settlement.spec.ts` 对 `manual` / `_E` / `_R` / `damageBy` 的命中：**1 处，且无关**
（`:131` 是 HUD 读数的注释）。**机器人不读手动轨，没有 `_E` 读数，不需要修。**

`tests/fixtures/chapterBattle.ts:68` 会把 `{ ...sim.damageBy }` 暴露给章节 spec，而
`chapter-dragon.spec.ts:44/54` 读的是 `H001_DRAGON_E` / `H001_DRAGON_R` —— 那是**章节模式的形态 id 字面用法**
（`DragonCombat`），不是手动轨后缀。两者不冲突：章节模式 `threat` 为 `undefined`（`:136`），
`releaseManual()` 是空操作，所以章节账本里**不可能**出现释放后缀。已记入 §8 的「读法清单」。

---

## §7 Scope 6 —— 触及哪个验收

| 验收 | 是否触及 | 说明 |
| --- | --- | --- |
| **G8** | ✅ **触及** | `manualShare` / `manualCoreShare` 逐位未动；新增的 `gddSnippetShare = 0.1365` 记录「GDD 字面读数未达 .35」。**G8 的状态因此从「过」变成「按桶读法过、按 GDD 字面读法未达」** |
| G9 | ❌ 未触及 | `manualStrongSkills = 10 ≥ 3`，机制与后缀无关（§5） |
| G10 | ❌ 未触及 | 本片不碰 turning points |
| G2 / G3 / G4 | ❌ 未触及 | 0 生产改动，平衡数字全部逐位复现 |

---

## §8 文件变更 · md5 账 · 复现

### 8.1 变更清单

| 文件 | 性质 | 内容 |
| --- | --- | --- |
| `apps/mobile-next/src/core/manualDamage.test.ts` | **仪器层**（唯一被改的文件） | ① `bucketOf` 加 `/_R_E$/` 分支（`/_E$/` 之前）；② 新增 `KIT_IDS` + `isManualRelease`，`:459` 换用它；③ `MANUAL_CORE` / `manualCoreShare` 注释改写；④ `Sample.truthByKey` + `Sample.gddShare` + `run()` 的只读 `hit`/`hitBoss` 增量账本；⑤ 新增 1 个 `it`（四键表 + 三种测量）；⑥ 报告新增 `headline.gddSnippetShare`、`cells[].gddSnippetShare`、`suffixReading` |
| `apps/mobile-next/src/core/suffixProbe.test.ts` | **一次性探针，已删除** | 输出存档在 `evidence/R2-F-SUFFIX/probe-output.txt`（7,995 B） |
| `tasks/game-remediation/evidence/R2-F-SUFFIX/` | 本片证据 | `IMPLEMENTATION.md`（本文件）、`probe-output.txt`、`manual-report.pre-suffix.json`（改动前的 `R1g-12/manual-report.json` 快照，md5 `8246b726…`） |

**生产代码改动：0 行。** 未新增依赖。

### 8.2 探针保真声明

`probe-output.txt` 段 A 用的是 `bucketOf` 的**逐字副本**（探针内联，常量与 `if` 链顺序与
`manualDamage.test.ts:101-125` 相同），因为 `bucketOf` 是 test-local 且未导出。
段 B 的测量**不依赖**该副本 —— 它包装真实的 `hit`/`hitBoss` 读精确增量。
段 A 记录的是**改动前**的分类器行为（`X_R_E → manualSkill`），这正是要留档的旧读法。

### 8.3 md5 账（两重检查，都过）

**（a）已落盘报告逐位复现 —— 这是「零数字改动」的最强证明。**

`evidence/R1g-12/manual-report.json` 在改动前备份为
`evidence/R2-F-SUFFIX/manual-report.pre-suffix.json`（md5 `8246b726fbfd70dcadebd1b0595bce97`，
15,796 B —— 归档到**本片**目录，R1g-12 保持干净）。
本次重跑后，把**三个新增键**（`suffixReading`、`headline.gddSnippetShare`、
`cells[].gddSnippetShare`）剥掉再序列化（`sort_keys=True, indent=2`）：

```
md5（改动前）              = 1f4bfd3c320a7e9495ddcd6007c49a79
md5（重跑后，去新键重建）  = 1f4bfd3c320a7e9495ddcd6007c49a79
```

⇒ **schema 变了，旧字段逐位不变。** 新增键的完整清单（对基线做键集差）：
`new-only top keys: ['suffixReading']`、`headline new-only: ['gddSnippetShare']`、
`cell new-only: ['gddSnippetShare']`、`old-only: []`。

**（b）全证据树 741/741 逐位一致。**

改动后（新报告已落盘）对 `tasks/game-remediation/evidence/**/*.json`（**741 个**）记了 md5 基线，
**全量套件重跑一遍**后再核一次：

```
diff pre-suffix-md5.txt post-suffix-md5.txt   → exit 0，0 行差异
```

⇒ 全量套件把**每一份**报告（含本片新增字段的 `manual-report.json`）**逐字节复现**，
且没有任何 sibling 报告被改写。这同时证明了新报告是确定性的。

---

## §9 门禁

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck`（`vue-tsc --noEmit`） | ✅ 干净（exit 0，无输出） |
| `npm test`（`vitest run`，全量） | ✅ **43 文件 / 1443 测试全绿**，1244.01s（比上片 1442 多 **1** = 本片新增的那条 `it`） |
| 定向验证 `vitest run src/core/manualDamage.test.ts` | ✅ 11/11，303s |
| `npm run smoke` | ✅ `SMOKE OK: main pages, migrated hero/loadout/build/growth UIs, config aliases, runtime systems and V3.0 safety guards detected.` |
| `npm run audit` | ✅ `AUDIT OK`（21 项 PASS + `INFO legacy wrapper aliases: 130`） |
| `npm run context` | ✅ **8178 / 8192 bytes**（`AGENTS.md` 689 + `TASK.md` 2787 + `STATE.md` 3661 + `docs/INDEX.md` 1041） |
| `npm run archive:verify` | ✅ `Historical runnable HTML: 30/30`、`Required master docs: 12` |
| `npm run check` | ⚠️ **跑不了**（`spawnSync … EBUSY`，`child_process` 被本机拦截 —— 见 `handoff/STATE.md` 的已知限制）。**等价手查**：`index.html` 的 **26** 个 `src="*.js"` 引用逐个 `node --check` **全过**；内联 `<script>`/`<style>` 计数 **0** |
| Playwright（`npm run test:browser`） | ⚠️ 本机始终无输出，无法本地验证 —— 本片未触及浏览器侧（§6），已写入交付 |
| legacy 逐字节 | ✅ **0 生产改动** ⇒ 平凡成立；`combat-math-oracle.json` 未被触碰 |

### 8.4 复现命令

```bash
cd apps/mobile-next
npx vue-tsc --noEmit                       # typecheck
npx vitest run src/core/manualDamage.test.ts   # 本片的定向验证（11 tests，~303s）
npx vitest run                             # 全量
```

### 8.5 读法清单（TASK.md Scope 0 要求枚举的每一个读者）

| 读者 | 位置 | test-only? | 结论 |
| --- | --- | --- | --- |
| `/_E$/` → `manualSkill` | `manualDamage.test.ts:117` | test | **已修**（`/_R_E$/` 提前）；对 G8 本来就是对的 |
| `/_R$/` → `manualUltimate` | `:118` | test | 未动；在 `/_E$/` 之后是 `X_R_E` 误判的成因 |
| `/_E$\|_R$/`（裸） | `:459` | test | **已修**（`isManualRelease`） |
| `endsWith('_E')`（裸） | `formPressure.test.ts:2572` | test | 该形态 kit 无 `_E` id ⇒ 正确；注释已说明为何不能推广 |
| `endsWith('_E') && !kit.includes` | `formPressure.test.ts:2895` | test | 正确，但**对 `G2_FROST_E` 是盲的**（§2.2）—— 记入队列 |
| `manualCast` | `CombatSimulation:129/366/369/381/386/449`、`EvolutionCombat:135` | **生产** | 语义正确，未动 |
| `_E` 后缀本身 | `CombatSimulation:218/228` | **生产** | 用途声明（`:210-213`）**被实测满足**，未动 |
| `H001_DRAGON_E/_R` | `chapter-dragon.spec.ts:44/54` | test | 章节形态 id 的**字面用法**，非后缀；章节模式不产生释放 |

---

## §10 写回队列

1. **#6l `R2-F-SUFFIX` ✅ 完成** —— 零生产改动；分类器修好；`gddSnippetShare` 新增并守卫。
2. **新入队 `R2-F-GDD-G8`（文档 / 验收）**：GDD §11.1 的 G8 断言（`:919`）与 harness 的
   `manualCoreShare` 不是同一个读数（0.1365 vs 0.3739，2.74×），且**字面读数未达自己写的 35% 门槛**。
   本片只测量与守卫，**没有改 GDD**。要么把 GDD 的断言改成按桶读法（并把 `H001_E` 这个
   `H001` 专属键的假设删掉），要么承认 G8 未达并降级。**这是设计裁定，不是仪器问题。**
3. **新入队 `R2-F-KITKEY`（仪器）**：`G2_FROST_E` 同时是霜君形态签名场与 `G2_FROST` 的释放键，
   而 `formPressure.test.ts:2895` 的守卫把它当 kit 减掉 ⇒ **对 `G2_FROST` 的释放是盲的**。
   两套 harness 都靠**构造**回避（`formPressure` 保 `A011`；`manualDamage` 只到 `dragon`），
   **没有一处断言这个回避**。`manualDamage` 侧本片已加断言；`formPressure` 侧待补。
4. **`R2-F-TOUGH-HORDE` / `R2-F-BOSS-ADDS` / `R2-F-CADENCE` / `R2-F-CIRCLE`** 未动。
