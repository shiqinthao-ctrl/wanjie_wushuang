# R2-F-HORDE-BAND —— 控制臂在半径带上不是常量，`taken` 是命中次数

**一句话**：队列说「控制臂只在 120px 上有，带上没有对应物，所以挪半径要作废 43 条断言」——
**前半句对，后半句订正**：kit 臂**早就有**一条完整的带（`radiusSweep()`，八档半径，
`:3307` 的块已经断言了 `clean`/`blind`/`taken`），真正没有对应物的只有**控制臂**
（`kit: false` 那一半）。本片把控制臂在八档半径上**重新导出**，得到三个队列没有的读数：
**① `taken` 是一个命中计数而不是伤害总量（量子 = 单次接触伤害）；② 控制臂在带上不是常量；
③ 出货的 120px 是控制臂最脏的那一档，而压力轴对半径不单调。** 零生产改动。

---

## 0. Scope 0 —— 前提核实

### 0.1 `scenarios.horde` 的几何（逐字引）

| 位置 | 原文 |
| --- | --- |
| `:368` | `horde: (sim: CombatSimulation) => onRing(sim, 'EN001', 120, 12),` |
| `:335` | `const onRing = (sim, id, radius, count, offset = 0) => Array.from({length: count}, (_, i) => { const a = offset + (i/count)*Math.PI*2; return place(sim, id, sim.player.x + Math.cos(a)*radius, sim.player.y + Math.sin(a)*radius); });` |
| `:3111` | `const HORDE = { id: 'EN001', radius: 120, count: 12 } as const;` |

⇒ 12 具 / 30° 等距 / **以玩家当前位置为圆心** / 第一具在 `+x` 轴。`:365` 的头注释写着
`Identical for every form - only the kit differs.`

### 0.2 两处订正（队列的「做法」与「理由」各一处）

**(1) 控制臂的构造点是 9 个，不是十个形态。** 实测：

| 量 | 实测 |
| --- | --- |
| `const control = {} as Record<'horde'\|'ranged', Outcome>` 构造点 | **9**（`:628 / 832 / 1264 / 1530 / 1767 / 2019 / 2238 / 2538 / 2856`） |
| 哪个形态没有 | **`R2-F03 frostflame`**（`grep` 该 describe 内为零） |
| `control.horde` 引用 | **43** |
| 其中在 `expect(control.horde` 里 | **34** |

**(2) 「控制臂只在 120px 上」正确地描述了控制臂，但队列漏掉了 kit 臂已经有一条带。**
`radiusSweep()`（`:3195`）对 `RADII = [120,150,180,210,240,260,280,300]`（`:3194`）重跑十个形态，
返回 `clean` / `blind` / `taken` / `kitDealt` / `basicDealt` / `killed` / `firstHitMin`。
`:3307` 的块已经断言了：

| 既有断言（本片复核，未改） | 值 |
| --- | --- |
| `at(120)` | `{ radius:120, clean:10, shown:[] }` |
| `at(150)` | `{ radius:150, clean:10, shown:['windwarden'] }` |
| `at(260).shown` | `5 of 7` |
| `at(260).dirty` | `['phoenix']` |
| `only the shipped ring is both clean for all ten and blind for all seven` | **`[120]`** |

⇒ **本片独立重算的「120 是唯一同时 `clean=10` 且 `blind=7` 的档位」在仓库里早已存在。**
真正缺的是**控制臂**在带上的对应物 —— 也就是本片交付的东西。

### 0.3 探针（跑完即删；`grep -c "PROBE"` 复核 = 0）

`describe('PROBE-BAND')` 追加到 EOF，10 形态 × 8 半径 × **2 阶** × 2 臂 = **320 局**，
`1_800_000` 超时，实跑 **3.3s**，落盘 `Temp/probe-band.json`（77 KB）。
每个字段是 **`[rank1, rank2]` 的二元数组**。

---

## 1. Scope 1 —— 三个读数

### 1.1 `taken` 是一个**命中计数**，量子 = 单次接触伤害

带上**每一个**非零 `taken` 都是 **`9.34054054054054` 的整数倍**，320 个样本**零例外**。

量子来源**反解并逐位命中**（`enemyDamage.EN001` 经 threat-v2 软上限）：

```
q = 11.52 * (1 - 14/(14 + 60)) = 11.52 * 60/74 = 9.34054054054054   ✓ bit-equal
                          ↑def   ↑softCap
```

- `11.52` = `threatV2.json.enemyDamage.EN001`
- `def = 14`、`softCap = 60` = `threatV2.json.softCap`（`threatModel.ts:20`）
- 公式 = `combatMath.ts:146` 的 `mitigated = damage * (1 - def/(def+softCap))`
- 本臂 `incoming = 1`（`threatV2.json.incoming`，已断回读）

**⇒ 压力轴是离散的：挪半径是按「整次接触」移动的，不存在「多一点点压力」。**
这条决定了整条带必须按**表**交付，不能按「某个形态偏好的半径」。

### 1.2 控制臂在带上**不是常量**

`kitBlind`/`ctrlBlind` 的正确定义是 **`same(dealtBy_r1, dealtBy_r2)`** —— 即
**「两阶的伤害来源与数值是否全等」**（觉醒有没有被看见），不是「玩家能不能看见」。

| 形态 | `ctrlClean` 逐档（120→300） | 形态 | `ctrlClean` |
| --- | --- | --- | --- |
| bulwark | `CCCCCCCC` | legion | `DDDDDDDD` |
| frostlord | `CCCCCCCC` | thunderlord | `DDDDDDDD` |
| frostflame | `CCCCCCCC` | void | `DDDDDDDD` |
| phoenix | `DDDDDDDD` | **reaper** | **`DDCCCDCC`** ← 非连续 |
| beastlord | `DDDDDDDD` | windwarden | `DDDDDDDD` |

**`reaper` 是唯一一个控制臂干净集不连续的形态**：150/180/210/260/280/300 干净，**120 与 240 脏**，
且两处脏档读**同样的 3 次接触** —— 同一个事件出现在两个无关的距离上。
⇒ 这不是距离阈值的读数，是**竞态**的读数。

`legion` 是唯一**近乎**单调的：`24, 21, 20, 18, 20, 18, 20, 20`（前四档递减，之后变成 20/18 的步幅）。

### 1.3 出货的 120px 是控制臂**最脏**的一档

| 半径 | 控制臂 `taken`（rank 1 接触次数） |
| --- | --- |
| 120 | 3 种形态 0（护盾），**7 种形态有伤**：`legion 24`、`thunderlord 34`、`void 21`、`beastlord 21`、`windwarden 17`、`phoenix 9`、`reaper 3` |
| 260 | `thunderlord` 降到 **12**、`windwarden` 降到 **6**、`legion` 降到 **18**；`phoenix` 8 |

`bulwark`/`frostlord`/`frostflame` 在**整条带**上都是 `taken = 0` —— **但这不是「环没打到」，
是护盾吃掉了接触**（`incomingHit` 先扣盾再进血条，`:135-138`），所以 `taken` 是**盾后读数**。

### 1.4 压力轴对半径**不单调**

| 形态 | 120 | 150 | 260 | 150 缓解？ | 260 缓解？ |
| --- | --- | --- | --- | --- | --- |
| phoenix | 9 | **11** | 8 | **否（变重）** | 是 |
| legion | 24 | 21 | 18 | 是 | 是 |
| thunderlord | 34 | 30 | 12 | 是 | 是 |
| void | 21 | 12 | 12 | 是 | 是 |
| reaper | 3 | 0 | 0 | 是 | 是 |
| beastlord | 21 | 12 | 12 | 是 | 是 |
| windwarden | 17 | 10 | 6 | 是 | 是 |

- **150 缓解 6 个形态，但让 `phoenix` 从 9 变 11（更重）。**
- **260 缓解全部 7 个有伤形态，且不加重任何形态。**
- ⇒ 两个候选形状都不是「安全方向」的一致选择。

### 1.5 控制臂 `clean` 的逐档个数

| 半径 | `ctrlClean` | 集合 |
| --- | --- | --- |
| **120** | **3/10** | `bulwark, frostlord, frostflame` |
| **150** | **4/10** | 上面三个 + **`reaper`** |
| 180 / 210 | 4/10 | 同上 |
| **240** | **3/10** | 丢回 `reaper` |
| **260 / 280 / 300** | **4/10** | 同上 |

⇒ **`reaper` 恰好值一格读数**：它是唯一一个「出货半径把它的控制臂弄脏、而更宽的环不会」的形态。
150 已经买到这格，260 没有再买。

---

## 2. Scope 2 —— 两个候选形状的定价

### (a) O2：把环从 120 挪到 150

| 轴 | 账单 |
| --- | --- |
| **控制臂** | 缓解 6 个形态；**加重 `phoenix`**；`ctrlClean` 3→4 |
| **kit 臂** | **7 个盲形态掉到 6**（丢 `windwarden`，`:3325` 已断） |
| 作废的早期标定 | 十份形态报告 + 248 行 md5 基线 + 7 份文档 md5 表全部作废（环半径进了每份报告） |

### (b) O3：新增第五格 `horde-far`（260px）

| 轴 | 账单 |
| --- | --- |
| **控制臂** | 缓解全部 7 个有伤形态；`ctrlClean` 与 150 相同（4/10） |
| **kit 臂** | **盲形态从 7 掉到 2**（只剩 `bulwark`/`frostlord`）；`phoenix` 丢 `clean`（吃 28.02） |
| 结构改动 | `NAMES` / `WINDOWS` / `of cells` 循环增长（40 → 50 格）；`:365` 头注释 `Identical for every form` 要改 |

**共同的一条**：`kitKilled` 在 120 与 260 **都是 12/12**（十形态、两阶）——
挪半径**不动「清环」这件事**，只动「清得多干净」。

---

## 3. Scope 3 —— 落地（追加 EOF，零行号位移）

`apps/mobile-next/src/core/formPressure.test.ts` 末尾新增
`describe('R2-F-HORDE-BAND - the control arm on the ring-radius band', …)`，四个 `it`：

1. **`the per-contact quantum…`** —— 320 个样本逐一断在格点上；`CONTACT_DAMAGE === 9.34054054054054`
   （**逐位**）；`sim.player.incoming === 1`（从运行实际用的字段读回）；
2. **`the shipped ring is the control arm's worst rung…`** —— 三个盾形态永不掉血条；
   其余七个各自的**最脏档**（六个在 120，`phoenix` 在 150）；`thunderlord` 34→12、18→3；
3. **`a control arm that is clean, then dirty again…`** —— `reaper` 的 `[false,true,true,true,false,true,true,true]`、
   两处脏档同为 3 次接触；`legion` 的 `[24,21,20,18,20,18,20,20]`；
4. **`what each candidate radius costs the control arm…`** —— `relief`/`strengthen` 集合、
   `phoenix` 是 150 唯一加重的形态、`cleanAt(120/150/260)` 的集合、`kitKilled` 恒 12/12。

**踩到的三个坑**（都是「派生处没做，断言处硬碰」）：
`taken / CONTACT_DAMAGE` 留下 `23.99999999999998`，`toEqual([24,…])` 必红 ⇒ 取整放在**派生处**；
`relief` 的比较方向写反过一次；`kitHeld` 声称「260 十形态都 `clean`」是**假的**（`phoenix` 不 `clean`）。

---

## 4. 交付与门禁

- **生产改动：0**。仅仪器 + 证据页。
- 定向：`npm run typecheck` 干净；`-t "R2-F-HORDE-BAND"` **4 passed / 80 skipped**（10.65s）；
  整文件 `npx vitest run src/core/formPressure.test.ts` ⇒ **84 passed / 21.40s**（本片前 80 ⇒ +4；
  记忆化前 29.17s）。
- 全量：**43 文件 / 1465 测试全绿**（EXIT=0，**1726.74s**）；`1465 − 1461 = +4` 恰为本片新增的四个 `it`。
- `context` **8188/8192**；`check` 手工等价（27 refs = 26 JS + 1 CSS，`node --check` 全过，0 内联）；
  逐字节账 **247/248**（唯一不符 `R1g-12/manual-report.json`，与上一片逐字相同）。
- 五项根门禁：见 `QUEUE.md` 6u 完成章节。
- **Playwright 从未运行。**

---

## 5. 选项（供设计裁定，本片不落地）

| 选项 | 内容 | 账单 |
| --- | --- | --- |
| **O1** | 维持 120px，把控制臂的带写成仪器（**本片做法**） | 零生产改动；任何挪半径的人立刻看到红了什么 |
| **O2** | 挪到 150px | 控制臂 6 形态缓解 / `phoenix` 加重；**丢 `windwarden` 的盲**；十份报告 + 7 份 md5 表作废 |
| **O3** | 新增第五格 `horde-far`（260px） | 控制臂 7 形态缓解、零加重；**盲 7→2**、`phoenix` 丢 `clean`；格数 40→50 |
| **O4** | 让控制臂本身成为**一格的读数**（「裸环压力」单列一列） | 把本片测到的东西变成设计可读的量；需改 `scan()` 的行形状 |

**「有效」≠「修好了」**：本片三条读数各自成立，但两条候选形状**都不是净额更好** ——
O2 让一个形态更重且丢一个盲，O3 让盲掉到 2/10。**净额符号只能由设计裁定，本片只负责把账摆平。**
