# R3-M04（D34）—— 一个没有 stage 参数的函数，和一段我判错了的空场

Base: `R3-U06`（D33）。**队列没有这一条** —— 1–19 已清空，本片从 `handoff/STATE.md` 的未决清单里选。
裁定 `DECISIONS.md` D34。
代码：`chapter/catalog.ts`（`ChapterWave` + 三关的 `waves`）、`core/spawnRules.ts`（`WaveRow` +
`waveAt`/`director` 的可选表参数）、`core/CombatSimulation.ts`（`stageWaves()` 与两处调用）。
断言：`chapter/stageWaves.test.ts`（**9 个 `it`**）。

## 1. Scope 0 的四个答案（全部命令级，详见 D34）

| 问题 | 答案 |
|---|---|
| 刷怪器从哪读波次 | `spawnRules.ts:31-33` 的 `waveAt(time)` —— **没有第二个参数**；`director()` 与 `createEnemy` 的出生池同样只读 `firstStage`。`stage.*` 在战斗核心里的读者（除 `duration`/`seals`/`eliteChecks`/`boss`）：**零** |
| 是决定还是继承 | **继承**，而且 `eliteChecks.test.ts:132-135` 的注释早就写着「every chapter stage inherits the first stage's 150 s `type: 'elite'` wave」—— D26 写那条注释时**利用了**这个事实 |
| GDD 承诺了什么 | 对三关的波次**零承诺**。三关的名字与目标来自 `catalog.ts`（D25/D26），波次从来没被设计过 |
| 第二张表的成本 | 一处签名 + 两处调用 + 一个数据字段；钉住第一张表的断言只有两条，且只对 `CH001-01` 有意义 |

## 2. 我判错了一件事，订正在这里

第一遍我把 `CH001-03` 的 360–480 秒判成「120 秒空场」。**那是错的**：它的 Boss 在 360 登场，
那 120 秒玩家在打 Boss。

**判据不是「刷不刷怪」，是「玩家有没有事做」。** 改成这张表之后，需要自己的表的只有一关：

| 关卡 | 时长 | 表覆盖到 | 360 之后 |
|---|---|---|---|
| `CH001-01` | 360 | 360 | 正好结束 |
| `CH001-02` | 420 | 360 | **60 秒真空**：无小怪、无 Boss（`boss: null`） |
| `CH001-03` | 480 | 360 | **不空** —— Boss 战 |

这条订正把交付范围从「三张表」缩到「一张表」。**如果我没跑 `altar.test.ts`，我会交出三张表，
而其中两张是错的。**

## 3. 两次尝试给祭坛加表，两次都更糟

| 版本 | Boss 战期间 | `altar.test.ts` 报出 |
|---|---|---|
| 继承表（原状） | 无小怪 | hunt 3/3 vs corner 3/3 ✅ |
| 第一版 | `420s` 起 `budget: 1.0` | **hunt 2/3 vs corner 3/3** ❌ |
| 第二版 | `360s` 起 `budget: .55` | **hunt 1/3 vs corner 3/3** ❌ |
| 最终 | 继承（无小怪） | hunt 3/3 vs corner 3/3 ✅ |

**「站在角落不动」比「主动游走」更容易赢** —— 因为游走会同时吃到 Boss 与接触伤害。
这不是「难度上升」，是**惩罚了正确的玩法**，而这条断言（`wins strictly more often than a policy
that holds a corner`）正是为了抓这个而存在的。降 budget 不会修好它，只会让它更糟。

## 4. `CH001-02` 的新表

6 行，覆盖 0–420，**没有 `boss` 行**（它 `boss: null`），两条精英行各自落在界碑开启前 15–30 秒：

| at | name | type | budget | elite | 为什么在这 |
|---|---|---|---|---|---|
| 0 | 界外步卒 | normal | .78 | .30 | 前 90 秒没有界碑 |
| 70 | 弓手压线 | normal | .88 | .40 | 远程夹击第一处界碑 |
| 150 | 镇界试锋 | **elite** | .92 | .70 | 第二处界碑（180）前 30 秒 |
| 240 | 荒原合围 | normal | 1.00 | .55 | 第三处界碑开启后的持续压力 |
| 255 | 界碑守望 | **elite** | 1.02 | .75 | 第三处界碑（270）前 15 秒 |
| 400 | 终局清剿 | normal | .90 | .40 | **覆盖到 420，不留空场** |

设计原则写在数据旁边：**守碑是站桩 20 秒，所以压力要平缓持续，不能有「必须跑」的尖峰**；
精英行的作用不是「加难度」，是**给玩家一个必须离开点位的理由**。

## 5. 断言：把表与时长放在一起看

新测试的第一条就是那个**不存在的检查**：

```ts
// 没有 Boss 的关卡不许有任何 budget: 0 的行
for (const stage of owned.filter(stage => stage.boss === null))
  expect(rows(stage).some(row => row.budget === 0)).toBe(false);
```

写成**规则**而不是个案，第四关会自动被检查。**这条如果早存在，`CH001-02` 在 D25 就会红。**

第二条是行为读数：

```ts
expect(Number.isFinite(intervalAt(firstWaves, 400))).toBe(false);   // 继承表在 400 秒不刷
expect(Number.isFinite(intervalAt(rows(SEAL), 400))).toBe(true);   // 新表刷
```

`intervalAt` 直接调 `director(...).interval` —— **`Infinity` 就是「不刷怪」**，这是刷怪与否的唯一判据。

## 6. 重基线（旧数在新数旁边）

| 位置 | 旧 | 新 |
|---|---|---|
| `chapterStages[].waves` | 字段不存在 | `CH001-01: null`、`CH001-02: 6 行`、`CH001-03: null` |
| `waveAt(time)` | 一个参数 | 两个参数（第二个可选，缺省是 `firstStage` 的表） |
| `director(state, player, difficulty)` | 三个参数 | 四个（第四个可选） |
| `CH001-02` 最后 60 秒 | 不刷怪 | 刷（`budget .90`） |
| `CH001-02` 270 秒的 `boss` 波 | 继承来的（`budget .68`） | **不存在**（它没有 Boss） |
| `seal-report.json` 种子 15 的结算血量 | **283.4** | **302.9**（+6.9%） |
| `seal-report.json` 种子 15 的第二处界碑时血量 | **545.5** | **524.9**（−3.8%） |

最后两行是**本片唯一一处真实读数**，而且它同时说了两件相反的事：**结局更好，中途更疼**。
前段更密（`240` 起 `.68 → 1.00`）⇒ 拿第二处界碑时血更少；后段有怪 ⇒ 多杀 4 个、多升一级的经验
换来更稳的收尾。**这就是「机制生效」与「净额变好」必须分开写的地方** —— 只看结局会说「更容易」，
只看中途会说「更难」。

**`CH001-01` 与 `CH001-03` 逐字节不变**：两关都是 `waves: null` ⇒ `stageWaves()` 返回 `undefined`
⇒ `waveAt` 走缺省表 ⇒ 与改动前完全一致。`altar.test.ts` 的 13 条断言全绿就是证据。

## 7. 门禁

- `chapter/stageWaves.test.ts`：**11 `it` / 7 ms**。
- `src/chapter`：**14 files / 446 tests / 8.09 s**，全绿（含 `altar` 13、`seals`、`eliteChecks`）。
- `src/core` 的四个用波次的文件（`enemyWarnings`/`enemyRoles`/`firstCombat`/`mapBounds`）：
  **4 files / 70 tests**，全绿。
- `vue-tsc --noEmit`：clean。
- 全量：见 §7.1。

### 7.1 全量

**61 files / 1695 tests / 1718.32 s / EXIT=0 / 零失败**（`npx vitest run > full.log 2>&1`）。
增量 **1684 → 1695 = +11**，逐字等于 `stageWaves.test.ts` 的 11 个 `it`；文件数 **60 → 61 = +1**。
**两条同时对上 ⇒ 没有探针残留。** `check` / `smoke` / `audit` / `archive:verify` 全 OK；账本 **271 不变**。

## 8. 没有被验证的

- **`CH001-02` 的新表没有跑过 33 个种子**。本片对它的唯一行为验证是
  `director(...).interval` 在 400 秒是有限值 —— 那证明「会刷怪」，**不证明「刷得对」**。
  `seals.test.ts` 绿了，但它测的是界碑规则，不是难度曲线。**这是本片最大的一处「机制生效 ≠ 净额变好」。**
- **三关之间的难度差没有被比较过**。`CH001-02` 的平均 budget 是 `.92`，`CH001-01` 是 `.74`，
  但两者的关卡目标不同（守碑 vs 打 Boss），数字不能直接比。
- **`CH001-02` 只被两个种子打通过**。`seals.test.ts` 里有一条**真的**用 `GameCore(chapter1-v1)`
  跑完整局（种子 `15` 与 `7`，都 `victory`，289.98 秒三碑全持，结算 hp `302.9` / `274.5`）——
  **我第一遍写「没有一次打完整局」是错的**，写这句话之前没读 `seal-report.json`。
  但两个种子不是胜率，且**没有对照策略**（`CH001-02` 没有「站角落」那种臂）。

## 9. 已知边界

- **出生池仍然只有一个**（`firstStage.storyEncounter.enemies`，6 行权重）。本片只分了**波次**，
  没分**敌人构成**。三关刷的仍然是同一批 `EN001–EN006`。这是下一个可做的维度，也是本片刻意不做的：
  换敌人构成要重标定接触伤害，而波次不需要。
- **`history.waves` 的第一条对章节局是错的**（字段初始化时用了 `waveAt(0)` 的缺省表，写死「步卒接战」）。
  它不被任何读者使用，本片没改 —— 改它要动字段初始化顺序，风险大于收益。
- **`eliteChecks.test.ts` 那条注释仍然说「every chapter stage inherits … 150 s elite wave」**。
  它现在只对 `CH001-01` 与 `CH001-03` 成立，对 `CH001-02` 不成立。注释没改，因为那条测试只跑
  `CH001-01`，改注释会让读者以为测试也变了 —— 记在这里。
