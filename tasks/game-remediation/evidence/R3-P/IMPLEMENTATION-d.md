# R3-P04（D31）—— 三条挑战、三枚护符、一个只是记录的星级

Base: `R3-P03`（D30）。队列 `QUEUE.md` #17。裁定 `DECISIONS.md` D31。
代码：`chapter/challenges.ts`（新）、`chapter/catalog.ts`、`chapter/settlement.ts`、`chapter/reports.ts`
（注释）、`ui/ChallengesPanel.vue`（新）、`ui/ChapterResult.vue`、`App.vue`。
断言：`chapter/challenges.test.ts`（**23 个 `it`**）+ 改写的两条既有断言。

## 1. Scope 0 的五个答案（全部命令级，详见 D31）

| 问题 | 答案 |
|---|---|
| `chapters.stars` / `clears` 记什么，谁读 | 记「最好星级」与「通关次数」，**生产读者 = 0**。写入点只有 `settlement.ts:72-73`，另一处读点是 `progress.ts:58-59` 的**校验**。`ChapterResult.vue` 读的是结算返回值，`ReportsPanel.vue` 读的是战报副本 —— 都不是这个字段 |
| 重打一关有永久数值收益吗 | **没有**。所有者行是 `prepare.ts:43`：`player` 的五个数逐字来自 `chapterHeroes`，`prepareChapterRun` 从 progress 只取 `equippedCharm`。对照：遗留线 `core/settlement.ts:50-56` 同一件事写了三行（`gold` 含 `stars * 100`、`mastery`、`accountXp`）—— 那才是「碾压」的形状，章节线没有复制 |
| 需要新存档字段吗 | **不需要**。三枚非初始护符本来就在 `charms.unlocked`；缺的是「什么换来它」的表 |
| `stars` 的 `0/1` vs `0..3` 挡路吗 | **不挡，它就是本片要填的**。两层校验都已经是 `0..3`（`progress.ts:58`、`schema30.ts:82`），写入端只用了三分之一 |
| GDD 承诺了什么 | 3 星评级（P1-3）。但 GDD 的「通关 1 / 无伤 2 / 剩余≥55% 3」**与数据 `clear: 2 / mastery: 3` 矛盾**，见 §3 |

### 1.1 一个「零读者」字段不能问「有没有被滥用」

`chapters.stars` 与 `chapters.clears` 在生产里没有任何读者 —— 它们只被写、只被校验。
所以「重打会不会刷出永久数值优势」不能靠读这两个字段来回答，只能读**消费端**：
`prepareChapterRun` 与 `settleChapterRun` 的写入面。这正是 (b) 换了个问法的原因，
也是本片把断言写成「同一份存档、只改进度字段、`prepareChapterRun` 输出逐字段相等」的原因。

### 1.2 队列自己的一条描述已经过期

队列 §「R3-U01..05 + R3-U06」写着「`App.vue` 只有 `home | battle | settings | saves` 四页」。
实测 `page` 联合在本片之前已经是 **七个**（多出 `codex` / `reports` / `charms`），本片加到八个。
**这条不影响任何代码，但它是 #18 的 Scope 0 会撞上的第一个假前提** —— 记在这里，免得下一片
从一句过期的描述开始数。

## 2. 三行挑战

`chapter/challenges.ts` 每行三个字段加一个谓词：

| id | 问什么（`asks`） | 给哪一枚（`reward`） | 谓词读的字段 |
|---|---|---|---|
| `clear` | 本局结算为胜利 | `MC_SURVIVAL` 不屈护符（受伤 ×0.85） | `endReason === 'victory'` |
| `awakened` | 本局完成形态觉醒 | `MC_CYCLE` 回环护符（术式冷却 ×0.85） | `awakened` |
| `bonds` | 本局凑齐两条羁绊 | `MC_MOVE` 疾行护符（移速 ×1.12） | `bonds.length >= 2` |

三枚奖励**逐字等于**旧代码那三个魔法下标（`chapterCharms[3]/[4]/[5]`）—— 本片是**把行为数据化**，
不是重新设计奖励。三条断言把它钉住：
- `reward` 全在 `chapterCharms` 里，且**都不在开局三枚**（`slice(0, 3)`）里 —— 否则挑战发的是
  玩家已有的东西，看起来还正常；
- 每枚 `factor !== 1` —— 一个不改任何数的奖励比没有奖励更糟；
- 三个 `reward` 互不相同。

### 2.1 谓词只读三个字段，用 `Proxy` 数出来

「挑战不会因为关卡被重调而改变含义」这句话，写成注释是没人执行的。这里的写法是一个 `Proxy`
记录 `met()` 碰过的每个字符串属性，然后断言集合**恰好等于** `['awakened', 'bonds', 'endReason']`。
多读一个 `time`、`hp` 或 `stars`，这条就红 —— 所以它是结构保证，不是承诺。

### 2.2 谓词是结构类型，不是 import

`ChallengeFacts` 只声明三个只读字段，`ChapterFinalRun` 结构上满足它，因此 `challenges.ts` 不必
`import settlement.ts`（后者要 `import challenges.ts`）。**方向是单向的**：数据表不认识结算类型，
只认识它自己敢读的那三个字段。

## 3. 星级：数据赢，GDD 的散文错

写入端原来是 `victory ? 1 : 0`。现在：

```ts
export function starsFor(run: { endReason: …; hp: number; maxHp: number }): number {
  if (run.endReason !== 'victory') return 0;
  return run.hp / run.maxHp > chapterStars.masteryHp ? chapterStars.mastery : chapterStars.clear;
}
```

`chapterStars = { clear: 2, mastery: 3, masteryHp: .55 }`，逐字来自遗留线的 `storyContract.stars`，
算式逐字来自 `core/settlement.ts:40`（**`>` 而不是 `>=`**，所以 `hp = 341 / 620` 正好在线上时是 2 星）。

**GDD 那句话不能照写**：`无伤`（`hp === maxHp`）严格强于 `剩余 ≥55%`，在 `Math.max` 最好成绩下
两档会塌成一档 —— 照原话写 `hp === maxHp ? 2 : hp/maxHp > .55 ? 3 : 1` 的话，**无伤的局拿 2 星、
掉了一点血的局拿 3 星**，打得更好反而显示得更差，而且每个分支单独看都对，没有测试会红。
裁定按数据（`clear: 2`），散文记为错。

**星级不给任何东西**：遗留线在同一行还发 `stars * 100` 金币，本片一个数都不发。

## 4. 页面

`ui/ChallengesPanel.vue`：只读，三行 + 星级说明 + 边界声明。它把奖励写在**护符自己的话**里
（`charmRow(reward).detail`），不复制那个乘数 —— 否则护符被重调之后，玩家读到的是旧数。
`App.vue` 加 `page` 联合成员、大厅按钮、`v-else-if`，四条源码级断言钉住（与 D28/D29/D30 同一写法）。
`ChapterResult.vue` 从「本关目标已完成」改成「本关 N 星」。

## 5. 重基线（旧数在新数旁边）

| 位置 | 旧 | 新 | 为什么 |
|---|---|---|---|
| `contracts.test.ts:108` | `result.stars` = **1** | **2** | `hp 200 / 620` 在精通线之下 ⇒ `clear` 档 |
| `contracts.test.ts:121` | 存档 `stars['CH001-01']` = **1** | **2** | 同上，失败局不擦除已得星级 |
| `reports.test.ts:71` | `row.stars` = **1** | **2** | 战报副本跟着写新值 |
| `reports.test.ts` 星级分布 | `[0, 0, 1]`，集合 `{0, 1}` | `[0, 2, 3]`，集合 `{0, 2, 3}` | 三档现在都可达：无伤局 3 星加进夹具 |
| `reports.ts` 模块注释第 3 条 | 「`stars` 是穿三星外衣的布尔」 | 「D31 填满了区间；**行仍然带计数**」 | 三格布局假设某个值可达，布局不该假设 |

**没有放宽任何断言**：`[0, 0, 1] → [0, 2, 3]` 是把夹具加了一局满血胜利，观测集合从 2 个值
变成 3 个值，仍然要求 ≥2 个值且都落在声明区间内。

## 6. 门禁

- `src/chapter` 子集：**13 files / 435 tests / 8.40 s**，全绿。
- `chapter/challenges.test.ts`：**23 `it` / 24 ms**。
- `vue-tsc --noEmit`：clean。
- 全量：见 §6.1。
- 账本：**271**（本片只改测试与源码，未动 `evidence/` 之外的产物清单，见 §6.1 复核）。

### 6.1 全量

**58 files / 1646 tests / 1659.07 s / EXIT=0 / 零失败**（`npx vitest run > full.log 2>&1`）。
增量 **1623 → 1646 = +23**，逐字等于 `challenges.test.ts` 的 23 个 `it`；文件数 **57 → 58 = +1**。
**`+N` 与 `文件数 +1` 两条同时成立 ⇒ 没有探针残留**（`treeHygiene.test.ts` 绿）。
`check` **能跑**：`CHECK OK: 26 JS, 1 CSS, all local references exist.` —— 记忆里那条「跑不了」是过期结论。
`smoke` / `audit`（7 modes / 30 gear / 20 runes / 5 pets / 20 talents / no permanent aura slow）/
`archive:verify`（30/30、12 篇）全 OK。`context` 7709/8192。
账本 **271 不变**：本片新增的是源码与测试，`evidence/R3-P/**` 不在 `cap10-md5.txt` 的扫描范围内
（`grep -c "R3-P"` = 0）。

## 7. 没有被验证的

- **Playwright 仍然无输出**。挑战页的视觉没有被人眼或浏览器验证过。本片能保证的是：页面读的
  字段（`challengeViews` 的 `paid`、`charmRow(reward).detail`）与断言读的是同一个返回值。
- **星级与挑战都没有在真跑局里端到端走过一遍**：`settleChapterRun` 的所有测试都是直接喂
  `ChapterFinalRun`，没有一局是真打出来再结算的。`altar.test.ts` 会真打到胜利，但它不结算。
- **挑战达成率没有测量**。D30 测过「三枚护符在真跑局里的可达性」（胜利 3/3、觉醒 3/3、
  两条羁绊 1/3），本片**没有重测**，因为挑战条件与那三个门槛逐字相同 —— 但「逐字相同」是
  读代码得出的，不是跑出来的。**这是本片最大的一处「引用而非测量」。**
- **`stars` 的三档在真局里各能拿到几次**没有测（那需要 ≥33 种子）。

## 8. 已知边界

- **章节线仍然从 UI 进不去**（`App.vue` 不传 `:chapter`，入口 `R3-U06`）。挑战页能看、护符能装、
  星级能写，**但没有一局可以从大厅点开**。这一条写在页面正文里，不藏在代码里。
- **`chapters.stars` 仍然是只写字段**：本片把它填成了 `0..3`，但**仍然没有渲染器**读它。
  战报页读的是每局的 `report.stars`，不是最好成绩。想让玩家看到「本关最好 3 星」，还需要一个读者 ——
  那是 #18（结算/大厅页）或 `R3-U06` 的事。
- **`challengeRow()` 的未知 id 错误今天走不到**：`challengeViews` 只遍历自己的表。
  它存在是为了给未来的外部输入（存档里的 id、URL 参数）留一条说人话的路，与 `charmRow` 同一分工。
