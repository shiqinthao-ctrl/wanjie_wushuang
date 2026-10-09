# R2-F-GDD-G8 —— GDD 自己的 G8 断言，量的是「在基础形态待了多久」

**切片**：`QUEUE.md` #6q。**基线**：R2-F-BOSS-ADDS（零生产改动）。
**结论**：**零生产改动**。裁定 **D12**：把 GDD §11.1 的 G8 断言改写成**两个按钮桶**的读法，
依据是**本节自己写的设计意图**，不是「哪个数能过」。本片改动 = **设计文档 1 份 + 仪器注释/守卫**，
生产代码一行未动。

---

## 0. Scope 0 —— 前提核实

### 0.1 GDD §11.1 的原文（`docs/design/GDD-可玩性提升设计-v2.md:917-922`，改写前）

```ts
test('手动操作贡献不低于 35%（G8）', () => {
  const r = simulate({ journey: 'evolution', seed: 15 });
  const manual = ['H001_E', 'H001_R'].reduce((s, k) => s + (r.damageBy[k] || 0), 0);
  const total = Object.values(r.damageBy).reduce((s, v) => s + v, 0);
  expect(manual / total).toBeGreaterThanOrEqual(0.35);
});
```

### 0.2 两个读数各自读什么

| 读数 | 定义 | 读的键 / 桶 |
| --- | --- | --- |
| **GDD §11.1（字面）** | `damageBy['H001_E'] + damageBy['H001_R']` ÷ 总伤害 | **两个字面键** |
| **`manualCoreShare`** | `MANUAL_CORE = ['manualSkill','manualUltimate']` 两个桶 ÷ 总伤害 | **两个桶**（`bucketOf` 分类，划分完备，未知来源会让 harness 红） |

两者都在 `apps/mobile-next/src/core/manualDamage.test.ts`；`gddShare`（池化后 `gddSnippetShare`）
是 R2-F-SUFFIX 为了把差量**记在账上**而新增的字段，本片沿用。

### 0.3 2.74× 是键集差异，不是任何一侧的 bug

全部取自同一次运行（`evidence/R1g-12/manual-report.json`，**165 局**，总伤害 **88,639,364**）：

```
GDD 两个字面键 = H001_E 9,061,659.49 + H001_R 3,036,861.87 = 12,098,521.36  -> 0.13649
两个按钮桶     = manualSkill 30,102,367.34 + manualUltimate 3,036,861.87 = 33,139,229.20 -> 0.37387
比值 = 2.7391
```

**两者都不是 bug，而且关系比「不同」更紧**：

- **GDD 的两个键是两个桶的严格子集**（`12,098,521.36 ⊂ 33,139,229.20`），差量
  **21,040,707.85**（占总伤害 **0.23737**）。
- **GDD 的两个键 100% 落在生产自己的 `manual` 旗标判为 `auto` 的那一半里**：

| 键 | 总量 | 其中 `manual` | 其中 `auto` |
| --- | --- | --- | --- |
| `H001_E` | 9,061,659.49 | **0** | 9,061,659.49 |
| `H001_R` | 3,036,861.87 | **0** | 3,036,861.87 |

两个桶的构成（`truthByKey`，即 `hit`/`hitBoss` 每次调用的 `damageBy` 精确增量）：

| 部分 | 量 | 占总伤害 |
| --- | --- | --- |
| **真·手动释放**（`manual = true`） | **19,654,845.33** | **0.22174** |
| 按钮自身的签名伤害（`manual = false`，被 `bucketOf` 归入按钮桶） | 13,484,383.88 | 0.15213 |
| ↳ 其中 `H001_E` + `H001_R` + `H010_BOMB` | 9,061,659.49 + 3,036,861.87 + 1,385,862.52 | — |

真·手动释放的九个键：`A003_E` 13,447,659.44 / `A011_E` 2,737,869.66 / `S001_E` 1,640,766.98 /
`A027_E` 895,776.49 / `A015_E` 278,592.14 / `A026_E` 244,742.35 / `A054_E` 230,578.80 /
`A013_E` 126,146.93 / `G2_FROST_E` 52,712.54。

**⇒ GDD 的两个键一个手动释放都没有。**

### 0.4 那两个字面键究竟是什么 —— **一个键名，两个发射点**

`H001_E` / `H001_R` 是**未进化形态（`heroId = H001`）按钮自己的伤害**，由**两条互斥的路径**发出，
共用一个键名：

| 路径 | 代码 | 何时可达 |
| --- | --- | --- |
| 经典 | `CombatSimulation:292` `arc(135, atk×2.2, 'H001_E')`；`:298` 推 `scheduled` → `:336` `arc(210+wave×18, atk×4, 'H001_R', 2π)` | `:270` `if (this.journeyCombat && action !== 'dodge')` 的**反例** ⇒ **只有 classic 路线** |
| 进化 | `EvolutionCombat:79` `s.arc(150, atk×2.2, id, 2π)`，`id = \`${v.heroId}_E\`` = `H001_E`；`:95` `s.arc(260, atk×8, id, 2π)` | 形态 switch 的**最后一个 `else`**（即 `formId` 不是那九个具名形态时）⇒ **英雄尚未进化时** |

两条路径都不传 `manual`（`arc()` → `hit(..., manual = this.manualCast)`，`manualCast` 只在
`releaseManual()` 的栈上为真）⇒ **永远是 `auto`**。

**按路线拆**（`probe-keys.json`）：

| 键 | classic 两个 cell | evolution 三个 cell | evolution 占比 |
| --- | --- | --- | --- |
| `H001_E` | 2,285,963 | 6,775,696 | **74.8%** |
| `H001_R` | 1,071,053 | 1,965,810 | **64.7%** |

⇒ GDD 的字面读数**主要来自「进化路线里那个还没进化的兜底分支」**。

### 0.5 逐 cell 数字（池化，`manual-report.json`）

| cell | GDD 字面 | `manualCoreShare` | `manualShare`（四个桶） |
| --- | --- | --- | --- |
| classic/first | 0.1552 | 0.3282 | 0.3314 |
| evolution/first | 0.1383 | 0.4063 | 0.4085 |
| classic/unlock | 0.1362 | 0.2985 | 0.3007 |
| evolution/unlock | **0.1215** | 0.3690 | 0.3725 |
| evolution/focus | 0.1383 | 0.4063 | 0.4085 |

（池化 0.1365 / 0.3739 由这五格加权得到；`evolution/focus` 与 `evolution/first` 逐位相同 ——
`structure.focusMatchesFirst`，所以池化把最强的那一格算了两遍。）

### 0.6 常量 / 测量 / 推导

| 类别 | 项 |
| --- | --- |
| **常量**（写在代码里） | 桶定义 `MANUAL_CORE = ['manualSkill','manualUltimate']`；GDD 的两个字面键；门槛 `.35`；`arc` 的半径与倍率（135/2.2、150/2.2、210+18w/4、260/8） |
| **推导** | 池化份额（分子 ÷ 分母，分母是**总伤害**不是常数）；比值 2.74× |
| **测量** | 12,098,521.36 / 33,139,229.20 / 88,639,364；`manual` 旗标下的 19,654,845.33；逐 cell 五个值；相关系数 −0.32 / +0.34 |

---

## 1. Scope 1 —— G8 问的是什么，哪个读数答得了

### 1.1 意图（GDD 自己的三处原文）

- **§0 指标表（`:330`）**：`G8 | 玩家操作对输出的贡献 | 手动按钮贡献 ≈ 0%（S001 占 50%） | 手动操作贡献 ≥ 35% 总伤害`
- **§P2-2 目标行（`:677`）**：`目标（G8/G9）：手动操作贡献 ≥ 35% 总伤害；至少 3 个术式有"手动显著更强"的差异。`
- **§P2-2 建议做法（`:668-676`）**：把 `action('skill')` 改成 `castManual(this.manualSkill)` ——
  **按钮去释放已拥有的术式**。这正是 R1g-7 落地的 `releaseManual()`。

**意图 = 玩家操作的代理度**：它要替代的是「按钮约等于没用、一个召唤物 `S001` 拿走一半输出」的状态。
问题不是「某个键的伤害多少」，是「**玩家的手有没有用**」。

### 1.2 字面读数答不了它 —— 三条实测理由

1. **它是两个桶的严格子集，且完全落在 `auto` 那一半**（§0.3）⇒ 它一个手动释放都没读。
2. **它看不到 G8 存在的理由**：R1g-7 落地的手动释放 `A003_E`（13,447,659，全账本最大的一项）
   不在它的两个键里；形态 kit（`G4_WIND_E` / `G5_FROST_E` / ...）也不在。
3. **它随玩家变强而下降。** `evolution/unlock` 是唯一「有的局进化、有的局没进化」的 cell（33 局，
   20 / 13 分裂），在它上面逐局相关：

   | 相关对 | r |
   | --- | --- |
   | `r(进化数, gddShare)` | **−0.3172** |
   | `r(进化数, manualCoreShare)` | **+0.3447** |
   | `r(进化数, 真·手动释放量)` | **+0.3657** |
   | `r(进化数, H001_E)` | **−0.3265** |
   | `r(进化数, 总伤害)` | +0.2144（⇒ 不是分母效应） |

   分档均值（同一 cell、同一批种子）：

   | 进化数 | n | GDD 字面 | `manualCoreShare` | 真·手动释放量 |
   | --- | --- | --- | --- | --- |
   | 0 | 13 | **0.1378** | 0.3002 | 92,961 |
   | 1 | 19 | **0.1125** | **0.4121** | **186,370** |

   **两个读数在同一批局上朝相反方向动**：进化一次把真·手动释放翻了一倍（+100.5%），
   把桶读数抬了 **+11.2pp**，而 GDD 的字面读数**掉了 2.5pp**。
   ⇒ 它测的是「这一局在基础形态待了多久」（§0.4 的兜底分支），**不是**玩家的操作。

### 1.3 结论

**两个按钮桶的读法答得了 G8 的意图**：它包含按钮自身的伤害**和**按钮释放的已拥有术式，
这正是「玩家的手造成的输出」。字面键的读法答不了，因为它在结构上排除了那个修复本身。

---

## 2. Scope 2 —— 定价

### 2.1 分支 A：把 GDD 的断言改写成桶读法

**要动的文档 / 注释**（全部列出）：

| 位置 | 改动 |
| --- | --- |
| `docs/design/GDD-可玩性提升设计-v2.md` §11.1 | G8 片段改为桶读法 + 一条 D12 裁定说明（`:930+`） |
| 同上 `:330` 指标表 G8 行 | 「目标」列注明读数 = 两个按钮桶 |
| 同上 `:677` §P2-2 目标行 | 同上 |
| `manualDamage.test.ts` `MANUAL_CORE` 文档注释 | 补「为什么不是字面键」的实测理由 |
| 同上 `Sample.gddShare` 文档注释 | 标注为**被取代**的读数 |
| 同上 报告 `headline.gddSnippetShare` / 逐 cell 注释 | 同上 |
| `DECISIONS.md` | 新增 **D12** |

**门禁影响：无。**
- `scripts/archive-verify.mjs` 的 `required` 清单（12 项）**不含** GDD；它只查存在性与 30 份历史 HTML。
- `scripts/doc-budget.mjs` 与 GDD 无关。
- 活跃上下文包（`AGENTS.md + TASK.md + STATE.md + docs/INDEX.md`）**不含** GDD ⇒ `context` 不受影响。
- **没有任何测试或脚本读 GDD 文本**（`grep` 全库：只有注释在引用它的行号）。

**数字影响：无。** GDD 不是仪器；改它不动任何报告。

**被重开的冻结验收：无。** harness 自己的 G8 断言（`manualDamage.test.ts`）读的是
`MANUAL` / `MANUAL_CORE`，与 GDD 的片段无关。

### 2.2 分支 B：承认 G8 未达

- **35% 原本替谁站岗**：替「玩家操作的代理度」站岗 —— 它是这条线上**唯一**的数值守卫。
- 若承认未达，游戏失去的不是一个数字，是**唯一一条能发现「按钮又变得没用」的断言**。
- **但这个结论只有在一个特定口径下才成立**：若把口径收紧为「只有被释放的术式算手动」
  （即只读 `manual` 旗标），读数是 **0.22174**，**未达 35%**。
  本片认为这个口径**不符合意图**（按钮自身的签名伤害是按下按钮的**直接后果**，把它排除会把 G8
  变成「被释放的术式有多强」，而不是「玩家的手有没有用」），但**必须把这条界记在账上**：
  **G8 在 0.3739 上过线，前提是按钮自身的伤害算手动。** 若将来口径收紧，门槛要重设为 ~0.20。

---

## 3. Scope 3 —— 选项与裁定

| 选项 | 内容 | 账单 |
| --- | --- | --- |
| **O1** | 维持 GDD 原样，只在 harness 留注释 | 零成本，但**设计文档里留一条测错东西的断言**，下一个人会照它实现 |
| **O2** | 把 GDD 的 G8 断言改成桶读法 + 注明理由 | **零门禁成本、零数字变动**（§2.1） |
| **O3** | 把 harness 的守卫从「差 2×」升级为**点名机制** | **零额外运行**（复用 `all()` 的缓存），见 §4 |
| **O4** | 承认 G8 未达并降门槛 | 只在「release-only」口径下成立（0.2217）；会把唯一一条代理度守卫删掉 |
| **O5** | 改生产遥测，让 `H001_E`/`H001_R` 带 `manual` 旗标 | **否**：R2-F-SUFFIX 已实测后缀的用途声明被满足（`A003` vs `A003_E` 可分）；且会移动全部数字 |

### 裁定（D12）：**O2 + O3**

理由：G8 的意图是**玩家操作的代理度**，而桶读法是**唯一**包含「按钮释放的已拥有术式」的读法
（§1.3）。字面读法不是「一个更保守的口径」，它是**一个测不同东西的读数** —— 它随进化下降，
且把 `manual` 旗标判为 `auto` 的那一半当成全部。**改写依据是设计意图，不是「哪个数能过」**：
如果意图是 release-only，正确的做法是承认 0.2217 未达并重设门槛（§2.2），而不是留着那两个键。

**保守界已入账**：0.22174（release-only 口径）。

---

## 4. 仪器改动（本片唯一触及代码的地方）

`apps/mobile-next/src/core/manualDamage.test.ts`：

1. **`MANUAL_CORE` 的文档注释**：把「不是 GDD 的片段」升级为「GDD 已改写成这个读数 + 三条实测理由」。
2. **`Sample.gddShare` 注释**：标注为被取代的读数，并记下反向相关。
3. **`suffixReading` 测试的 (4) 段**：从「`gdd < 0.35` 且 `core/gdd > 2`」升级为
   - `H001_E`/`H001_R` **是**两个桶键集的子集（逐键断言，不是数值比较）；
   - 这两个键的 `manual` 量**都是 0**（`toEqual([0, 0])`）；
   - 保留原有两条。
4. **G8 测试新增两条**：在 `evolution/unlock` 上比较「已进化」与「未进化」两组的均值 ——
   字面读数**下降**、桶读数**上升**。`samples(['evolution','unlock'])` 已在 `all()` 的缓存里
   ⇒ **零额外运行**。
5. **报告 schema 未变**（没有新增字段，`gddSnippetShare` 是 R2-F-SUFFIX 加的）⇒ 逐字节账仍可用直接 md5。

---

## 5. 文件变更

**生产代码：零。**

| 文件 | 变更 |
| --- | --- |
| `docs/design/GDD-可玩性提升设计-v2.md` | §11.1 的 G8 片段 + `:330` 指标表 + `:677` 目标行 + 一条 D12 裁定说明 |
| `apps/mobile-next/src/core/manualDamage.test.ts` | 4 处注释 + 2 处断言强化（零额外运行） |
| `tasks/game-remediation/DECISIONS.md` | 新增 **D12** |
| `tasks/game-remediation/evidence/R2-F-GDD-G8/` | 本文件 + `probe-keys.json` + `probe-progression.json`（**一次性探针输出**，不参与断言） |

### 5.1 opt-in 证明

报告 schema 与所有数值均未变动 ⇒ `R1g-12/manual-report.json` 与基线应**逐位一致**（逐字节账见 §6.3）。

---

## 6. 门禁

| 门禁 | 结果 |
| --- | --- |
| `npm run typecheck`（`vue-tsc --noEmit`） | ✅ 干净（0 输出） |
| 定向 `manualDamage.test.ts` | ✅ 见 §6.1 |
| `npx vitest run`（全量） | ✅ **43 文件 / 1456 测试全绿**（见 §6.1） |
| `smoke` | ✅ `SMOKE OK` |
| `audit` | ✅ `AUDIT OK` |
| `context`（活跃上下文包 ≤ 8192 B） | ✅ **8183 / 8192**（见 §6.2） |
| `archive:verify` | ✅ `30/30` + 12 份 master docs |
| `npm run check` | ⚠️ **本机跑不了**（`child_process` 被拦截 ⇒ `spawnSync` = EBUSY）—— 手查等价：`index.html` 的 **26 个 ref 全部存在**、逐个过 `node --check`、**0 内联 `<script>` / 0 内联 `<style>`** |
| Playwright | ⚠️ 始终无输出 ⇒ 浏览器侧无法本地验证（本片无浏览器侧变更） |

### 6.1 测试

`cd apps/mobile-next && npx vue-tsc --noEmit` ⇒ **干净（0 输出）**。

定向 `npx vitest run src/core/manualDamage.test.ts`：

```
 ✓ src/core/manualDamage.test.ts (11 tests) 297917ms
     ✓ partitions every damage source instead of letting an unknown one hide in "auto" 118693ms
     ✓ brackets the share against the press cadence and the map interaction 41380ms
     ✓ prices the dual track in share, win rate and HP floor 58295ms
     ✓ isolates the press cadence from the map key on the win rate 12230ms
     ✓ prices D2: the dash clamp costs the HP floor, not the manual damage 67290ms
 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  298.58s
```

全量 `npx vitest run`（**后台 + 同回合内阻塞 `TaskOutput`**，输出重定向到 `/tmp/gdd-suite.txt`）：

```
 Test Files  43 passed (43)
      Tests  1456 passed (1456)
   Start at  17:38:00
   Duration  1587.61s (tests 99%)
EXIT=0
```

**测试条数与 R2-F-BOSS-ADDS 完成时相同（43 / 1456）** —— 本片**没有新增 `it`**，
只强化了既有两条断言并加了三条同测试内的断言 ⇒ **零额外运行**。

### 6.2 上下文包

`npm run context`：`AGENTS.md` **689** + `TASK.md` **3016** + `handoff/STATE.md` **3437** +
`docs/INDEX.md` **1041** = **8183 / 8192**（余量 **9** 字节）。

**GDD 不在活跃上下文包内** ⇒ 本片对它的改动不影响 `context`。这也是 §2.1「零门禁成本」的一部分。

### 6.3 逐字节账（opt-in 证明）

`R2-F-CAP/cap10-md5.txt`（248 行）逐行重算（`node:crypto`，`md5sum` 本机被拦截）：

```
total=248 ok=247 mismatch=1
  DIFF ./R1g-12/manual-report.json
```

**唯一不符项与 R2-F-BOSS-ADDS 完成时逐位相同**（根因已由 `R2-F-HORDE-LEDGER` 记录：
该目录有**六份**滚动报告，早先的逐字节账只核了**四份**）。

本片自己那份报告的直接 md5 核对：

```
R1g-12/manual-report.json  当前 = 9c71d8836995ee06eda32af1586b6bba
                            R2-F-BOSS-ADDS 完成时 = 9c71d8836995ee06eda32af1586b6bba   ← 逐位一致
headline = { manualShare 0.3765, manualCoreShare 0.3739, gddSnippetShare 0.1365,
             manualShareDistinct 0.3653, runs 165 }
```

⇒ **报告 schema 未变、数值未动**，本片对仪器的改动（注释 + 断言强化）**没有移动任何记录到的数字**。

---

## 7. 写回队列

1. **#6q 关闭**：结论 = **D12**，把 GDD §11.1 的 G8 断言改写成两个按钮桶的读法；**零生产改动**。
2. **队列原文需更正一处**：不是「注释声称是同一读数」（那是 R2-F-SUFFIX 的发现，仍成立），
   而是**字面读数是两个桶的严格子集、且完全落在 `manual` 旗标判为 `auto` 的那一半**，
   并且**随进化反向下降** ⇒ 它不是「更保守的口径」，是**另一个读数**。
3. **保守界入账**：release-only 口径 = **0.22174**，未达 35%；若将来收紧口径，门槛重设为 ~0.20。
4. **不改生产遥测**（O5 否证：R2-F-SUFFIX 已证明后缀的用途声明被满足，且会移动全部数字）。

---

*本文件描述的是 R2-F-GDD-G8 完成时的代码状态。本片零生产改动，所以生产侧与 R2-F-BOSS-ADDS
完成时相同；改动只落在**设计文档**与**仪器注释/守卫**。*
