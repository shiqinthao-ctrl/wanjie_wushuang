# R2-F-G4ROWS —— G4 的「实测一半」在丢行，而它的兄弟三元只能返回 `null`

**一句话**：`bossThreat.test.ts:1338` 的 `perShape.filter(shape => shape.hits > 0)` 在发货臂上
把 G4 问的三招里的**两招整行丢掉**（`circle` 0 命中 / `cone` 0 命中，只剩 `line`），于是
`cheapestMove` 与 `heaviestMove` 是**同一个数**（`0.2206`）—— G4 本想描述的那个「区间」塌缩成单值，
**而没有任何字段说有一行被丢了**。同一块的兄弟三元 `:1370`（`g4: phase1.length ? … : null`）
在这棵树上**只能是 `null`**：`phaseOfRaw` 是把相位**从伤害数额反解**出来的，实测**每个非 `contact`
命中都反解出 phase 3** ⇒ `phase1` 恒空 ⇒ 读者若写 `g4 === false`（「测了且没过」最自然的读法）
永远拿不到答案。**本片零生产改动**，只改仪器。

---

## 0. Scope 0 —— 前提核实

### 0.1 两个现场（行号与队列不符，按实际代码为准）

| 位置 | 原文 |
| --- | --- |
| `bossThreat.test.ts:1338` | `const fractions = perShape.filter(shape => shape.hits > 0).map(shape => shape.fractionMedian);` |
| `:1363-1364` | `cheapestMove: fractions.length ? Math.min(...fractions) : 0` / `heaviestMove: fractions.length ? Math.max(...fractions) : 0` |
| `:1370` | `g4: phase1.length ? phase1Fraction >= TARGET.skillFraction : null,` |

`TASK.md` 记的 `:1280` / `:1312` 是队列写入时的旧行号（R2-F-CIRCLE 在其后追加过仪器），**本片按实际行号**。

### 0.2 `phaseOfRaw` 是「反解」而不是「读遭遇」（`:79-82`）

```ts
function phaseOfRaw(shape, raw, diffDmg, bossDamage, skill = 1, contact = 1) {
  const phase = contact
    ? (raw / (diffDmg * bossDamage * contact) - 11) / 3
    : (raw / (SHAPE_FACTOR[shape] * diffDmg * bossDamage * skill) - 13) / 4;
  …
}
```

⇒ 相位是**从伤害数额推回去的**，是那个数的性质，**不是**这场战斗的性质。这决定了 §2 的结论：
`phase1` 空不空，由「有没有哪个命中恰好落在反解出的 phase-1 区间」，而不是「遭遇有没有进过 phase 1」。

### 0.3 发货配置（不是常量的地方都读出来了）

- `NO_CADENCE`（`:321`）= `{ castCd: 1, skill: 1, hp: 1 }` = **无覆写 = 发货表**，故可作为 control。
- `TARGET.skillFraction = .15`（`:45`），G4 的门槛。
- `policy: 'hud'`、`bossDamage = threatV2.bossDamage`（= `0.6`）、`SEEDS` = 33 个种子。
- 唯一读 `report.g4` 的地方是 `:1764` `expect(report.g4.required).toBe(14.31);` ——
  **被判定的那个字段 `g4` 本身，全库没有任何测试消费它**。

### 0.4 两个探针（追加到 EOF，跑完即删；`grep -c "PROBE"` 复核 = 0）

`PROBE-G4ROWS`（每个 journey 一次冷跑）：

| journey | circle | line | cone | `filtered` | `cheapestMove` | `heaviestMove` | `tally` | `castsMedian` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| classic | 0 | 2 | 0 | `[0.2206]` | 0.2206 | 0.2206 | `{contact:961, line:2}` | 2 |
| evolution | 0 | 3 | 0 | `[0.2206]` | 0.2206 | 0.2206 | `{contact:859, line:3}` | — |

`PROBE-PHASES`：`{"classic:phase3":2,"evolution:phase3":3}` ⇒ **非 `contact` 命中全部是派生 phase 3**，
没有任何一个是 phase 1。

---

## 1. 那个过滤器在防什么

`filter(hits > 0)` 表面上是「零命中形状的 `fractionMedian` 是占位 `0`，
留着会把 `min` 拉到 0」。**它确实在防这个**——但它同时**删掉了行本身**：
过滤后的数组里没有 `{shape:'circle', hits:0}`，也没有任何东西记「有一行被丢了」。
于是下游读到的 `cheapestMove === heaviestMove === 0.2206`，
看起来像「三招里最便宜和最贵恰好一样」，实际是「**只有一招被观测到**」。

这两个形状**不是「没测到」而是「测到且为零」**：它们在整个 33 种子发货窗口里
**一次都没有命中**（`tally` 里只有 `contact` 与 `line`）——
这正是 R2-F-CIRCLE 从几何侧得到的同一事实（圆心 = 玩家、站位使得这些招式在窗口内到不了）。

---

## 2. 两个形状的定价

### (a) 让零显式可见 —— 保留行、记 `hits: 0`、让选择规则自己决定

若把 `fractions` 改成「不过滤、零命中形状带 `0`」，
则 `cheapestMove` 变 `0`、`heaviestMove` 仍 `0.2206`，
G4 的实测半会**从「单值」变成「区间 `[0, 0.2206]`」**——
但那个 `0` 是**占位**，不是「这一招只花 0」，所以这个区间是**假的**。
**结论：不可取**。显式可见的正解是**保留行并显式记录被丢掉了几行 / 哪几行**，
而不是把占位当成读数喂给 `min`。

### (b) 保留过滤器，但断言它移除了什么

这是本片落地的方向：**过滤器不动，在它旁边加一条断言说清它丢掉了什么**——
`perShape` 恒为 3 行、其中恰好 2 行 `hits === 0` 且形状恰为 `['circle','cone']`、
`kept` 恒为 1 行、`cheapestMove === heaviestMove`、
且 `kept[0] === cheapestMove`（证明「区间」就是一个值本身）。

### 作废了哪次早期标定

**R2-F-CIRCLE 的实测行集读数**。CIRCLE 报告 `:1747-1754` 的 `g4.observedRows`
记录了「发货 `hud` 读数的被观测行」，但它的 `dropFilter` 字段把站点写成 **`:1280`**
（旧行号），且它只记 `hits` 而**没有断言被丢掉的形状是哪两个**——
本片把这条从「描述」升级为「断言」，并把站点行号订正为 `:1338`。

**G4 的结论是否移动**：**不移动，但它的读法变了**。`g4` 在发货臂上恒为 `null`，
所以「G4 是否达标」在这棵树上**无法被任何读数回答**；
加上 `phase1` 恒空这一条，可以说 G4 的实测半**当前是空转的**。

---

## 3. 落地（追加到 EOF，零行号位移）

`apps/mobile-next/src/core/bossThreat.test.ts` 尾部新增：

- 一个 `describe('R2-F-G4ROWS - the rows G4 never sees, and the verdict that is only ever null', …)`；
- 一个**记忆化**的 `g4Rows(journey)` 派生函数：逐字复刻 `:1338`（`filter(hits>0)`）与 `:1370`
  （`phase1.length ? phase1Fraction >= TARGET.skillFraction : null`）的形状，
  并额外带上 `derivedMovePhases` / `derivedContactPhases`（相位来自 `phaseFromRaw`）与 `contact` 行集；
- **一个** `it`（原为两个，第一个在 5s 默认超时内跑不完 33 局冷跑 ⇒ 合并为一个并给 `1_200_000`）：

  1. **过滤器**：`perShape` 恒 3 行；零命中的形状恰为 `['circle','cone']`；
     `kept` 恒 1 行；`cheapestMove === heaviestMove`；`kept[0] > TARGET.skillFraction`；
  2. **三元**：`phase1` 恒空；`g4` 恒 `null`；`derivedMovePhases === [3]`（机制，写在它所在处）；
     `derivedContactPhases` **含 1**（⇒ 盲区是**形状行专有**，不是整个遭遇——所以「全程没有 phase 1」
     会是错的叙述）；
  3. **证据自证**：把序列化后的 `report.filter.rows` 逐个回读，断言 `kept` 长度、两读数相等、
     `g4 === null`、`kept[0] === cheapestMove`，并断言 `report.ternary.possible === ['null']`。

- 证据写入 `tasks/game-remediation/evidence/R2-F-G4ROWS/g4rows-report.json`（best-effort）。

---

## 4. 实测（`g4rows-report.json` 摘要）

| journey | circle | line | cone | kept | cheapest | heaviest | phase1 | **g4** |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| classic | 0 | 2 | 0 | `[0.2206]` | 0.2206 | 0.2206 | 0 | **`null`** |
| evolution | 0 | 3 | 0 | `[0.2206]` | 0.2206 | 0.2206 | 0 | **`null`** |

- 两个 journey 的 `derivedMovePhases` 都是 `[3]`；`derivedContactPhases` 都是 `[1,2,3]`。
- **`g4` 的取值域 = `{null}`**，`true` / `false` 都不可达。

---

## 5. 交付与门禁

- **生产改动：0**。仅仪器（`bossThreat.test.ts`）+ 证据页。
- 定向：`npx vue-tsc --noEmit` 干净；`-t "R2-F-G4ROWS"` **1 passed / 15 skipped**（36.1s）。
- 全量：`npx vitest run` **43 文件 / 1460 测试全绿**（1571.59s，EXIT=0；**1460 − 1459 = +1** 恰为本片新增的一条 `it`）。
- 五项根门禁：`smoke` OK / `audit` OK / `archive:verify` **30/30 + 12 master docs** / `context`
  **7537 / 8192**（`AGENTS 689 + TASK 2665 + STATE 3142 + INDEX 1041`）/ `check` 手工等价
  （**27 refs = 26 JS + 1 CSS** 全存在、26 个 `node --check` 全过、**0 内联 script/style**）。
- 逐字节账 **247/248**：唯一不符仍是 `R1g-12/manual-report.json`（`R2-F-HORDE-LEDGER`，**非本片造成**）。
- **滚动报告变更（本片唯一一处非追加的磁盘改动）**：`evidence/R2-F-CIRCLE/circle-report.json` 的
  `dropFilter` 字符串随 `:1754` 修正而变 ⇒ 新 md5 **`2145152b1e4d7d65d9c4846539248500`**
  （旧字符串含过时行号 `:1280`；重跑 CIRCLE 块 3 passed 后自修正）。该报告**不在** 248 行账清单里。
- 队列后续：**#6s `R2-F-BOSSPHASE`**（`FirstBoss.ts:106` 把相位混进招式选择）。

---

## 6. 坑

1. **忘写显式超时 = 默认 5s**：本文件每个重块都带 `1_200_000`–`1_800_000`，新块漏写 ⇒ 直接超时。
   **两个 `it` 各自调一次 33 局冷跑 = 双倍开销**；合并 + 记忆化后 36s 跑完。
2. **`filter(x>0)` 让零命中静默消失**（本片的核心）：取极值前先问**被滤掉的是什么**。
3. **「反解的量」不能当「遭遇的性质」**：`phaseOfRaw` 从伤害推相位 ⇒ `phase1` 空是**数值事实**，
   不是「战斗没进 phase 1」。
4. **三元返回 `null` 要问是「没测到」还是「测到且不合格」**：这里 `null` 把两者混成一个值。
5. **行号引用会随插入位移**：CIRCLE 报告里的 `:1280` 已被本片订正为 `:1338`；
   新仪器**一律追加到 EOF**，不动既有行号。
