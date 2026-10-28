# R3-P02（D29）—— 最近二十局：一份记录，不是奖杯柜

**一句话**：`progress.reports` 存了每一局的战报，**全库只有一个读者**（按 `runId` 去重），
从来没有被画出来过。本片给它一个页面：一局一行、新的在最前，胜负与超时同样清楚；
**不给百分比配一个三局的分母**，也**不画三格星**（写入处只有 1 和 0）。

---

## 1. Scope 0 的五个答案（全部命令级，详见 `DECISIONS.md` D29）

| 问题 | 答案 |
|---|---|
| 一份战报有什么 | **17 个字段**；**只有一个读者**（`settlement.ts:68` 按 `runId` 去重）；**零渲染器** |
| 上限在哪 | **两处，语义不同**：写入 `unshift(...).slice(0, 20)` **静默截断**；校验 `> 20` **拒收整份存档** |
| 有「看着记了其实没写」吗 | **没有**（17 == 17）；但 `stars` 只写 `0/1` 而校验允许 `0..3`，且 **7 个字段在战报边界被丢掉** |
| 页面挂在哪 | 与图鉴同一处：`App.vue` 的 `page` 手写联合 + 一个组件 + 一条 `v-else-if` + 大厅一个按钮 |
| 需要新存档字段吗 | **不需要**：TASK 要的九项全在 17 个字段里 |

### 1.1 已经显示过一次的只有四个，而且两个是计数

`ChapterResult.vue` 读的是 `result.report` 的 `stars` / `awakened` / `routes.length` / `bonds.length`。
结算页上的 `Lv.` 与「击破」读的是 **`snapshot.level` / `snapshot.kills`（活值）**，不是战报里的那两个字段
⇒ **战报里的 `level` / `kills` 至今零渲染**。`seed / time / heroId / formId / damageBy / damageTakenBy`
从未出现过。

### 1.2 我第一次读错了：`shorthand` 不算写入

第一遍用 `re.findall(r"(\w+): …")` 解析写入字面量，得到「声明 18、只写 15，缺 `runId` / `stars`」。
**那是正则的错** —— 这两个是 shorthand（`{ runId, ruleset: …, stars, … }`）。按逗号切分、裸标识符也算
写入后是 **17 == 17**。**「字段没写」这个结论，必须先把 shorthand 算进去。**

### 1.3 两个真实存在的坑

**坑一：`stars` 是布尔值穿着三星的外套。** 写入处 `victory ? 1 : 0`（`settlement.ts:67`），
校验处 `number(report.stars, '战报星级', 3, true)` 允许 `0..3`。**画三格星会在每次胜利显示 1/3**，
看着像玩家没打好。页面画的是**数字**，并在页脚写明为什么只有一格。

**坑二：7 个字段写进了 `ChapterFinalRun`、在战报边界上被丢掉。**

| 被丢掉的字段 | 后果 |
|---|---|
| `hp` / `maxHp` | 记录里没有「剩多少血赢的」 |
| `coreSkillLevel` | 没有核心术式等级 |
| `bossDefeated` / `bossLootClaimed` | 胜利条件校验用过，之后不留痕 |
| **`sealsHeld`** | **D25 的界碑读数在记录里不存在** |
| **`elitesChecked`** | **D26 的精英检验读数在记录里不存在** |

**不补**：补它要动存档 schema，而 TASK 第 3 条要求只读、不加字段。**记进账，不当场扩表。**
这一条写成了断言（`reports.test.ts` 的 `carries no seal count and no elite count`），
所以将来有人把这两列加进战报时，红的是那条测试，而不是「没人发现」。

---

## 2. 页面做了什么

`src/chapter/reports.ts`（纯函数，`reportRows(save)`）：

```ts
export const RATE_MIN_RUNS = 5;   // 低于这个数不给百分比
export const REPORT_CAP = 20;     // 与写入处/校验处同一个 20，页面与测试不能各记一个
export function reportRows(save: GameSave): Reports   // { rows, summary, progressError }
```

- `rows`：**新的在最前**（写入处是 `unshift`），每行 `runId / stageId / stageName / heroId / heroName /
  formId / formName / outcome / outcomeLabel / stars / time / clock / level / kills / seed / routes / bonds /
  awakened`。`clock` 是 `mm:ss` 且 **`Math.floor`** —— `Math.round` 会把 359.6 s 印成 `06:00`，
  一个会往多了说的钟。
- `summary`：`runs / victory / defeat / timeout / winRate / rateNeeds / victoryMedian / victoryCount`。
- `progressError`：未来版本存档会让 `readChapterProgress` 抛错，此时**返回空列表 + 原因**，
  页面写「记录暂时看不见，这不等于你没有打过」—— **不写「你还没有打过」**。

`src/ui/ReportsPanel.vue`：

- 汇总行是**计数**（胜 / 败 / 超时）加窗口大小，胜率**只有在 `runs >= 5` 时出现**，且带分母
  （`40%（2/5 局）`）；不足时写「样本不足 5 局，不给胜率 —— 4 局里的百分比不是胜率」。
- 中位用时**只算胜利局**，并带自己的分母（`胜利局中位用时 320 秒（2 局胜利）`）。
  超时局按构造就停在时限上，混进去中位数会往时钟那边漂。
- 每行左侧的色条按结果分（胜=金、败=暖红、超时=灰蓝），结果词取自**关卡自己的两个字**
  （`破围成功 / 破围超时 / 祭坛告破 / 镇界完成`），与结算页同一个来源 —— 列表和结算页不可能互相打脸。

`src/App.vue`：`page` 联合加 `'reports'`、`import ReportsPanel`、大厅一个「战报」按钮、一条 `v-else-if`。

---

## 3. 三条「宁可不显示，也不撒谎」

1. **不给百分比配三局的分母。** `winRate` 在 `runs < RATE_MIN_RUNS` 时是 `null`，
   页面说的是「还差几局」，不是一个看起来很像结论的 33%。
2. **不把三格星画成 1/3。** 写入处只有 `1` 和 `0`；画三格等于凭空造出两个空位，
   而那两格从来没有值。
3. **不把「读不出来」显示成「没打过」。** 两条路径在页面上是两句话：空存档是
   「还没有结算过的战局」，未来版本存档是「读不出来（原因），这不等于你没有打过」。

---

## 4. 重基线（逐条，旧数在新数旁边）

| 项 | 旧 | 新 | 为什么 |
|---|---|---|---|
| `App.vue` 的 `page` 联合 | 5 个成员 | **6 个**（+`'reports'`） | 页面入口 |
| `App.vue` 大厅按钮 | 图鉴 / 存档 | 图鉴 / **战报** / 存档 | 同上 |
| `codex.test.ts` 的联合断言 | 逐字钉死整个联合 | `page = ref<[^>]*'codex'[^>]*>` | **每加一个页面就要改一个无关文件**，那不是断言是摩擦 |
| 全量用例 | 1585 | 见 §5 | 新文件 17 个 `it` |
| 文件数 | 55 | 见 §5 | +1 |
| 账本 | 271 | **271（不变）** | 本片不产生新测量，只读已有记录 |

**没有改生产逻辑的任何一行**：`settlement.ts` / `progress.ts` / `GameCore.ts` 一个字节没动。
本片是**第一个渲染 `progress.reports` 的地方**，不是第一个写它的地方。

---

## 5. 门禁

- `src/chapter/reports.test.ts` —— **17 个 `it`、109 ms**（全量日志里的那一行），首跑 15 绿 / 2 红，两条都是**我自己的断言写错**：
  ① 给失败局沿用了胜利局的 `time: 310` 却断言 `06:00`（实际 `05:10`）⇒ 改成失败局自己的 `time: 128`、
  断言 `02:08`，**这样这条测试才真的在证明「失败行有自己的钟」**；
  ② 中位数用例拿了 `time: 401`，而 `CH001-01` 的时限是 **360** ⇒ `validateChapterFinal` 直接拒收。
  改成 300 / 340 + 超时 360，中位数 **320**（若把超时混进去会是 340）。
- `vue-tsc --noEmit` clean（首跑两条红：一个未用导入；`Map<ChapterStageId, …>` 拒绝了
  `report.stageId`（`string`）的查表 —— 改成 `Map<string, …>` 并注明理由）。
- `vite build` 通过。
- 子集（`src/chapter/` + `src/game/` + `GameCore` + `firstBoss` + `bossLifecycle`）：**18 files / 444 tests 全绿**。
- 全量：**见 §5.1**。

### 5.1 全量

**56 files / 1602 tests (1674.23 s), all green.** Increment `1602 - 1585 = 17` = `reports.test.ts`'s
17 `it`; files `56 - 55 = 1` ⇒ **no probe survived**. `ledger:verify` OK (271/271, rolling 36) and
`numstat` on the ledger is empty - no new report, and the full run's rolling rewrites did not move a byte.
`smoke` / `audit` / `archive:verify` OK; `context` 7507/8192; `check` cannot run here.

---

## 6. 没有被验证的

- **没有 Playwright**：列表在手机竖屏上的**样子**没被看见。断言读的是**渲染器读的同一个字段**
  （`reportRows` 的返回值 + `App.vue` 源码里的四处连接点），不是像素。
- **这一页今天对真实玩家大概率是空的，而这不是这一页的 bug。** `BattleView.vue:28` 有
  `chapter?: ChapterRunOptions`，但 `App.vue:63` 的 `<BattleView>` **从不传 `:chapter`**
  ⇒ 章节线从界面进不去 ⇒ `progress.reports` 不会增长。入口归 `R3-U06`。
  **本片能交付的只有「记录一旦存在就能正确读出来」，并且它把这件事说在页面上而不是假装有数据。**
- **真实存档里到底有没有二十局**：测试里的战报是 `settleChapterRun` 真跑出来的（不是手写对象），
  但「玩满二十局之后这一页长什么样」只有构造出来的样本，没有真人存档。
- **`damageBy` / `damageTakenBy` 没有渲染**：它们是战报里唯一的「内容型」字段（其余是标量），
  但一份战报的 `damageBy` 能有十几个键，竖屏上塞不进一行。**本片不做伤害分解页**，
  那需要它自己的设计（排序、份额、归类），塞进列表会两边都做不好。

---

## 7. 已知边界

- **界碑数 / 精英检验数不在记录里**（§1.3 坑二）。要显示它们得改存档 schema，那是另一片。
- **`stars` 仍然只有 0/1**。三星制是「校验器允许、写入处没有」的半个功能；
  本片不发明另外两星，也不假装它们存在。
- **上限的两处语义不同**：写入处丢最旧的，校验处拒收整份存档。页面按 `<= 20` 渲染，
  但**不假设**它一定是 20（空存档、3 局存档都是正常状态）。
- **`runId` 只做 `:key`**，不显示。它是 `crypto.randomUUID()`，对玩家没有意义，
  但重复的 `runId` 会被校验器拒收 ⇒ 列表的 key 是可靠的。
- **章节线在 UI 上仍不可达**（`App.vue` 的 `BattleView` 从不传 `:chapter`），入口归 `R3-U06`；
  本页读的是存档里的记录，与「能不能进章节关」无关 —— 这也意味着**今天这一页大概率是空的**，
  因为章节关还不能从界面进入。**空列表是诚实的，不是坏的。**
