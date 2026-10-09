# R2-F-KITKEY —— `G2_FROST_E` 是两样东西，而守卫只减掉其中一样

**一句话**：`formPressure.test.ts:2895` 的「没有手动释放」守卫用的是
`k.endsWith('_E') && !spec.kit.includes(k)` —— 它**减掉 kit 自己的 `_E` id**，
所以在**唯一一种**会撞车的形状上（形态的 kit `_E` id **就是**某个可释放技能的释放键）它是**盲的**。
撞车时释放**不会丢**，而是**并进签名场自己的数字里**（`hit`/`hitBoss` 在 `manualCast` 期间把源名改成
`${source}_E`，`CombatSimulation:218`/`:228`）。**实测**：同一个键在安全装配下读 **152.92**，
在危险装配下读 **1136.01**（**7.43×**），而那个过滤器两次都报「干净」。

**本片零生产改动**，只改仪器。

---

## 0. Scope 0 —— 前提核实

### 0.1 `:2895` 的原文（`formPressure.test.ts:2888-2895`，R2-F10 windwarden 压力块内）

```ts
// No arm owns a skill, so `releaseManual()` is a no-op and no manual release can appear. The
// marker is a `_E` suffix (`CombatSimulation:218`), but **this kit's own skill id already ends
// in `_E`** (`G4_WIND_E`), so the filter has to exclude the kit - every form's skill id follows
// the `<id>_E` convention (`EvolutionCombat:61`), and R2-F09's kit happened to be the one shape
// where the two readings did not collide. This is the same trap as the `H012_BASIC` shared key:
// one string, two meanings.
for (const [label, o] of cells)
  expect(Object.keys(o.dealtBy).filter(k => k.endsWith('_E') && !(spec.kit as readonly string[]).includes(k)), `${label}: no manual release fired`).toEqual([]);
```

`:2572`（R2-F09 beastlord 压力块）是同一句话的**更早、更弱**版本：`k.endsWith('_E')`，**没有** kit 排除。

### 0.2 释放键是怎么派生的（读出来的，不是猜的）

| 步 | 位置 | 内容 |
| --- | --- | --- |
| 1 | `CombatSimulation:270-273` | `action('skill')` 在进化路线上先跑 `journeyCombat.action('skill')`，**然后无条件** `if (done && action === 'skill') this.releaseManual()` |
| 2 | `CombatSimulation:410-416` | `releaseManual()`：`const id = this.manualId(); if (!id) return;` → `this.manualCast = true` → `this.cast(id)` |
| 3 | `CombatSimulation:418` | `manualId()` = `this.threat ? this.progression.manualSkill() : undefined` |
| 4 | `progression.ts:97-104` | `manualSkill()` 遍历 `build.active`，取**第一个严格更高**等级者（平局由 `build.active` 顺序决定） |
| 5 | `CombatSimulation:218` / `:228` | `const key = manual ? \`${source}_E\` : source` —— `hitBoss` 与 `hit` 各一处 |

⇒ **释放键 = `${manualSkill()}_E`**。这是一个**函数**，不是一个常量。

### 0.3 `G2_FROST` 确实是可释放的拥有技能

- `chapter/catalog.ts:38`：`chapterCoreSkills = { …, frostlord: 'G2_FROST', frostflame: 'G2_FROST', … }`
  ⇒ `RunEvolution:56` `coreSkill()` 对 `frostlord` 返回 **`G2_FROST`**。
- `evolutionCatalog.ts:43`：`activeSkills` 含 `'G2_FROST'`；`RunEvolution:9` 把
  `activeSkills` 中不在初始组里的一律追加进 `build.active`
  ⇒ **每个英雄的 `build.active` 都以 `G2_FROST` 结尾**（与 `formPressure.test.ts:1044` 的注释一致：
  `A003, A011, A021, ... G2_FROST`）。

### 0.4 碰撞是唯一的：**`frostlord`**（`probe-ids.json`，十个形态逐一枚举）

判据：`chapterCoreSkills[form] + '_E' ∈ SPECS[form].kit`。

| 形态 | hero | core | 释放键 | 在 kit 里？ | kit 的 `_E` id |
| --- | --- | --- | --- | --- | --- |
| bulwark | H001 | A021 | `A021_E` | ✗ | `H001_E` |
| **frostlord** | H001 | **G2_FROST** | **`G2_FROST_E`** | **✓** | **`G2_FROST_E`** |
| frostflame | H001 | G2_FROST | `G2_FROST_E` | ✗ | `G5_FROST_E` / `G5_FIRE_E` |
| phoenix | H010 | A054 | `A054_E` | ✗ | `H010_E` |
| legion | H010 | S001 | `S001_E` | ✗ | （无） |
| thunderlord | H010 | A013 | `A013_E` | ✗ | `G2_LIGHTNING_E` |
| void | H012 | A026 | `A026_E` | ✗ | `H012_E` |
| reaper | H012 | A015 | `A015_E` | ✗ | `H012_E` |
| beastlord | H012 | S001 | `S001_E` | ✗ | （无） |
| windwarden | H012 | A026 | `A026_E` | ✗ | `G4_WIND_E` |

**只有 `frostlord` 撞车**，而它恰好是**唯一一个压力块里没有这条守卫的形态**（R2-F02 压力块 `:827-889`
里没有任何 `no manual release fired`）。`frostflame` 的 core 也是 `G2_FROST`，但它的 kit 用 `G5_*` id
⇒ 同一个释放键**不在**它的 kit 里 ⇒ 那个形状的过滤器能抓到它。**盲点只在一个形态上。**

同一份探针还给出：**十个形态的四个压力格 `manualSkill()` 全是 `undefined`**
（`make(spec, rank)` 不传 skills）⇒ **今天没有任何一格能释放**。让格子干净的是**装配**，不是过滤器。

### 0.5 危险装配下的实测（`probe-hazard.json`）

两条臂**只差「按钮释放哪个技能」**，其余完全相同（同一形态、同一装配点、同一 dummy、同一帧数）：

| 装配 | `manualSkill()` | `_E` 键 | `:2895` 过滤器 | `G2_FROST_E` |
| --- | --- | --- | --- | --- |
| `{A011:1, G2_FROST:1}` | `A011` | `G2_FROST_E`, `A011_E` | `['A011_E']` ⇒ **报红（正确）** | **152.924308992** |
| `{G2_FROST:1}` | `G2_FROST` | `G2_FROST_E` | `[]` ⇒ **报「干净」（盲）** | **1136.009152512** |

比值 **7.4286**。安全臂里 `G2_FROST_E` = 纯签名场；危险臂里 = 签名场 **+ 释放**（`manualTrack.json` 的
`boost = 6` 骑在同一个键上）。⇒ **释放没有消失，它被合并了**，而且它让这一格读到的「场」变大。

### 0.6 常量 / 测量 / 推导

- **常量（源码字面）**：`chapterCoreSkills` 的映射；`activeSkills` 列表；`manualTrack.json` 的 `boost = 6`；
  `:218`/`:228` 的 `_E` 后缀；`:2895`/`:2572` 的过滤器形状。
- **测量**：`probe-ids.json` 的十行（每次跑逐位可复现，`make` 用 `() => .8` 固定随机）；
  `probe-hazard.json` 的两臂 `damageBy`。
- **推导**：`7.4286` = 1136.009152512 / 152.924308992（从上面两个测量值算，不独立测）。
- **不变量**：`frostlord` 的碰撞是**结构性**的（映射 + kit 列表都是常量），不是随机或平衡造成的。

---

## 1. Scope 1 —— 失败长什么样

**不是「释放丢了」，是「释放被并进另一个键」。** 这个区分是全部：如果释放丢进虚空，
`dealtBy` 会少一个键，任何「键集恰好等于 X」的断言都会红；而合并之后**键集完全不变**，
`:2895` 的过滤器**返回空数组**，格子读起来是干净的 —— 这正是「为 0 的开关比没有更糟」。

**哪一条既有断言会在撞车时保持绿**：

| 断言 | 撞车时 |
| --- | --- |
| `:2895` / `:2572` 的 `filter(...).toEqual([])` | **绿**（过滤器减掉了撞车键） |
| `:839` `o.casts > 0` | 绿 |
| `:840` `o.fieldR > 0` | 绿（而且更大） |
| `:843-844` 觉醒加宽/延长场 | 绿 |
| `:887` `boss.r2.kitDealt > boss.r1.kitDealt` | 绿（甚至更容易过） |

⇒ **一个「释放发生了」的事实，会被读成「场变强了」。** 这就是「静默扩大」而不是红。

---

## 2. Scope 2 —— 定价两条形状

### 形状 A：把守卫做成**抗撞车**的（按**解析出的手动 id** 断言，不按键名）

- **代价**：只加断言，不改生产、不改任何既有数字。
- **作废的标定**：无。新断言只读 `sim.progression.manualSkill()` 与 `damageBy` 的键集，
  两者都是既有读数。
- **风险**：`manualSkill()` 是**行为**，会随 `build.active` 顺序或等级变化而变 ⇒
  断言必须写成「**不是** kit 的那个键」，不能写成某个具体 id 的绝对期望（本片两条都写，见 §3）。

### 形状 B：把**碰撞本身**做成断言（钉住「哪个形态会盲」）

- **代价**：同样只加断言。
- **价值**：撞车是**结构常量**，所以它可以被钉成一条不会随平衡漂移的断言；
  一旦有人新增一个「kit `_E` id == 自己 core 技能释放键」的形态，这条会**立刻红**，
  而不是等到某个格子静默变大。

### 两者都采（互补）

A 管**今天**（装配是否仍把释放挡在 kit 键之外），B 管**明天**（新增形态时是否踩同一个坑）。
**B 单独不够**：它今天就已经是绿的（`frostlord` 已知撞车，所以断言必须**点名它**而不是断言「没有」）；
**A 单独不够**：它只说装配，不说这个坑为什么存在。

---

## 3. Scope 3 —— 落地（只在文档半边免费的地方落地；本片仪器半边也免费）

**`formPressure.test.ts` 追加一个 `describe('R2-F-KITKEY - ...')`，三条 `it`，全部在文件末尾**
（该文件被行号引用，所以**一律追加**，不动任何既有行号）：

1. `the collision is structural, and exactly one form has it`
   —— 枚举十个 `SPECS`，断言撞车形态**恰好**是 `['frostlord']`，并点名 `G2_FROST` / `G2_FROST_E`。
2. `the harness dodges it by keeping \`A011\`, and nothing asserted that`
   —— 把「靠构造回避」写成断言：`{}` ⇒ `undefined`；`{A011:1}` ⇒ `A011`；
   `{A011:1, G2_FROST:1}` ⇒ `A011`（平局走 `build.active` 顺序）；
   `{G2_FROST:1}` ⇒ `G2_FROST`；**`{A011:1, G2_FROST:3}` ⇒ `G2_FROST`**（等级压过也会撞）。
3. `the filter is blind exactly there, and the merge is measurable`
   —— 两条臂对跑，断言：安全臂过滤器**看到** `A011_E`；危险臂的键**只有** `G2_FROST_E`
   且过滤器**返回空**；`hazard.field / safe.field > 2`（**比率**，不是绝对值）。

**为什么不改 `:2895` 本身**：该文件被行号引用（`:195`、`:1009-1010`、`:2895`…），
改动会位移全部引用；而 `:2895` 在 windwarden 上**是正确的**（`G4_WIND_E` 不可释放，见 §0.4）。
所以正确的做法是**把坑钉在末尾**，而不是就地改一个当前没坏的守卫。

---

## 4. 仪器改动（本片唯一触及代码的地方）

`apps/mobile-next/src/core/formPressure.test.ts`：**文件末尾追加**一个 `describe` + 3 个 `it`，
外加一条 `import { chapterCoreSkills } from '../chapter/catalog';`（ESM 顶层声明，位置不影响语义）。
**未改动任何既有行**；`grep -n PROBE` 为空（探针已删）。

---

## 5. 文件变更

| 文件 | 变更 |
| --- | --- |
| `apps/mobile-next/src/core/formPressure.test.ts` | 追加 1 个 `describe` / 3 个 `it`（仪器） |
| `tasks/game-remediation/evidence/R2-F-KITKEY/` | 新建（本文件 + 两份探针 JSON） |
| `DECISIONS.md` / `QUEUE.md` / `STATE.md` / `TASK.md` / `WORKSHOP-BRIEF.md` | 记账 |

**生产文件：无。**

### 5.1 opt-in 证明

- 新增的三条断言只读 `sim.progression.manualSkill()` 与 `damageBy` 的键集，**不写任何生产状态**。
- 全部使用 `make(spec, …)` 的既有装配点；唯一的新装配是**探针**用的 `{G2_FROST: 1}`，
  它**不在**任何断言块里（只活在已删的探针与 §0.5 的记录里），落地块里的两条臂用的是
  `{A011:1, G2_FROST:1}` 与 `{G2_FROST:1}` —— 后者**确实**是新的，但它只在
  `the filter is blind exactly there` 这一条里，且**只读 `damageBy`**，不改任何生产行为。
- 报告 schema 未变 ⇒ 滚动报告应逐位不变（见 §6.3）。

---

## 6. 门禁

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck`（`vue-tsc --noEmit`） | ✅ 干净（0 输出） |
| 定向 `formPressure.test.ts -t R2-F-KITKEY` | ✅ **3 passed / 77 skipped**（744ms） |
| `npx vitest run`（全量） | ✅ **43 文件 / 1459 测试全绿**（1593.83s，**EXIT=0**） |
| `smoke` | ✅ `SMOKE OK` |
| `audit` | ✅ `AUDIT OK` |
| `context`（活跃上下文包 ≤ 8192 B） | ✅ **8176 / 8192** |
| `archive:verify` | ✅ `30/30` + 12 份 master docs |
| `npm run check` | ⚠️ **本机跑不了**（`child_process` 被拦截 ⇒ `spawnSync` = EBUSY）—— 手查等价：`index.html` 的 **27 个 ref（26 JS + 1 CSS）全部存在**、逐个过 `node --check`、**0 内联 `<script>` / 0 内联 `<style>`** |
| Playwright | ⚠️ 始终无输出 ⇒ 浏览器侧无法本地验证（本片无浏览器侧变更） |

### 6.1 测试

定向 `npx vitest run src/core/formPressure.test.ts -t "R2-F-KITKEY"`：

```
 ✓ src/core/formPressure.test.ts (80 tests | 77 skipped) 16ms
 Test Files  1 passed (1)
      Tests  3 passed | 77 skipped (80)
   Duration  744ms
```

全量 `npx vitest run`（**后台 + 同回合内阻塞 `TaskOutput`**）：

```
 Test Files  43 passed (43)
      Tests  1459 passed (1459)
   Duration  1593.83s (tests 99%)
EXIT=0
```

**1459 − 1456 = +3**，正好是本片新增的三个 `it` ⇒ **没有测试被顺带改红或静默增删**。

**第一次全量运行崩在启动阶段**：`EXIT=-1073741502`（`0xC0000142`，DLL 初始化失败），
日志为空（**不是测试失败**）。重跑即正常 —— 本机环境噪声，与代码无关。

### 6.2 上下文包

`npm run context`：`AGENTS.md` **689** + `TASK.md` **3174** + `handoff/STATE.md` **3272** +
`docs/INDEX.md` **1041** = **8176 / 8192**（余量 **16** 字节）。

### 6.3 逐字节账（opt-in 证明）

`R2-F-CAP/cap10-md5.txt`（248 行）逐行重算（`node:crypto`，`md5sum` 本机被拦截）：

```
total=248 ok=247 mismatch=1
  DIFF ./R1g-12/manual-report.json
```

唯一不符项仍是 `R1g-12/manual-report.json`，**非本片造成**（本片未触及滚动报告，schema 也未变）。

---

## 7. 写回队列

- **本片结论**：`G2_FROST_E` 的撞车是**结构性**的、**唯一**的（`frostlord`），
  守卫的**形状**（减掉 kit id）在它上面**可证盲**；今天靠**装配**（压力格不拥有任何技能）避开，
  且**现在有断言了**（三条，末尾追加）。
- **`R2-F-KITKEY` 关闭**。
- **新增入队建议**：无（本片没有发现新的独立缺陷）。
- **仍挂着**：`R2-F-BOSSPHASE`、`R2-F-G4ROWS`、`R2-F-HORDE-BAND`、`R2-F-HORDE-LEDGER`、
  `R2-F-BOSS-COVERAGE`。
