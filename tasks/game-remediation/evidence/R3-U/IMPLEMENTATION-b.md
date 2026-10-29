# R3-U06（D33）—— 一扇门，三行，和一道不该复用的门禁

Base: `R3-U01..05`（D32）。队列 `QUEUE.md` #19。裁定 `DECISIONS.md` D33。
代码：`ui/ChapterPanel.vue`（新）、`App.vue`、`chapter/prepare.ts`（导出 `OPEN_STAGES` + `stageObjective`）。
断言：`ui/chapter-entry.test.ts`（**14 个 `it`**）+ 改写的两条 `pages.test.ts`。

## 1. Scope 0 的四个答案（全部命令级，详见 D33）

| 问题 | 答案 |
|---|---|
| `chapter` 从哪进、要什么形状 | 三行：`BattleView.vue:28` 的 prop（类型是 `ChapterRunOptions` 七字段）、`:161-163` 的会话分叉、`App.vue:65` **没有 `:chapter`** |
| 从点击到开局缺什么 | 复用五样，缺四样：一个页面、一次绑定、一个 `page` 成员、**一次退出清空** |
| 四个空页面第一次结算后有内容吗 | 战报/挑战/护符**有**（`settleChapterRun` 必写）；图鉴**不一定** —— 写入在 `if (run.formId)` 里 |
| 既有门禁能复用吗 | **不能**。`previewBlocker` 的八条里七条对章节线无意义，`contracts.test.ts:27-38` 已测 |

## 2. 三行分叉点

```
BattleView.vue:28    chapter?: ChapterRunOptions                    ← 类型
BattleView.vue:161   chapterSession = new ChapterRunSession(…)      ← 有它走章节
BattleView.vue:163   if (!props.chapter) runSession = new RunSession(…)  ← 没它走征途
App.vue:65           <BattleView … />                              ← 从来没传过（D33 前）
```

**两条会话互斥，不会同时存在。** 所以「可构造 ≠ 可玩」不是缺功能，是缺一行绑定 ——
D27 之后每一个章节片（图鉴/战报/护符/挑战/星级）都在为一条**没有入口**的路径写代码。

## 3. 门禁：为什么本片**不**复用 `previewBlocker`

TASK 第 2 条写「No second gate. Reuse `launchBlocker` / `previewBlocker`」。这条前提是假的。

`previewBlocker`（`schema30.ts:88-104`）逐条检查八组字段。章节线的准备期
`prepareChapterRun`（`prepare.ts:30-47`）只读两样：`chapterHeroes[heroId]` 与
`equippedCharm(progress)`。**后七组字段它一个都不读**，而这一点**已经被测过**：
`contracts.test.ts:27-38` 把 `mode` 改成 `'endless'`、`selectedChapter` 改成 `'ST012'`、
`hero` 改成 `'H019'`、`gold` 改成 999999、`talents` 改成 999、`runes` 加 `'FUTURE'`、
`pet` 改成 `'FUTURE'`、装备评分改成 999999，然后断言
`prepareChapterRun(low)` 与 `prepareChapterRun(high)` **`toEqual` 相等**。

唯一有意义的那条（英雄必须是三个初始英雄之一）由 `prepareChapterRun` 自己保证：
`Object.hasOwn(chapterHeroes, options.heroId)`。

**所以替代品是一个真实调用**：

```ts
try { prepareChapterRun(save, options); return ''; }
catch (cause) { return message(cause); }
```

`chapter-entry.test.ts` 用一个断言同时钉住两半：

```
previewBlocker(source, 'classic')  → 含「仅支持」（拒绝）
prepareChapterRun(source, options) → 不抛（放行）
```

**判据不是「有没有第二道门」，是「这道门拦的东西，这条路径读不读」。**
复用会造出「`mode: 'endless'` 的存档打不了章节关」的假限制，而那个字段章节线根本不读；
反过来，试跑一次 `prepareChapterRun` 执行的就是开战那一刻要执行的那一行，**不会漂**。

## 4. 页面

`ui/ChapterPanel.vue`：三关（`OPEN_STAGES` 过滤 `chapterStages`，不是抄一份 id 列表）、
每关的目标（`stageObjective` 从 `seals`/`eliteChecks`/`boss` 派生）、**当前最好星级**、
当前英雄与当前护符、一个「出战」按钮。

**星级这一行是三个格子，而这只在 D31 之后才是对的。** D29 明确拒绝画三格，因为写入端只会发
0 或 1 —— 三格显示 1/3 读起来像「你没打好」。D31 把区间填满之后，三格才是评级。
格子数从 `chapterStars.mastery` 取，不写字面量 `3`。

**`chapters.stars` 因此拿到它的第一个渲染器。** D31 的裁定里写着「仍然没有渲染器读它，
最好成绩还是只写字段」—— 本片把这个缺口关掉了，`chapter-entry.test.ts` 断言
`chapters.CH001?.stars[id]` 这个读法存在。

## 5. 四个空页面的第一次

| 页面 | 第一次章节局结算后 | 依据 |
|---|---|---|
| 战报 | **有内容** | `settleChapterRun` 每局 `unshift` 一条 |
| 挑战 | **有内容** | 赢一局即达成 `clear`，发 `MC_SURVIVAL` |
| 护符 | **有内容** | 同上，一次最多可发三枚 |
| 图鉴 | **不一定** | 写入在 `if (run.formId)` 里；不进化的一局 `formId === null` |

**图鉴这一条是结构性的，不是运气**：它记的是「形态见过没有」，而形态是 Lv.3 之后的**可选**分支。
把它写成「打完就有」是错的；页面上的「未见」是诚实的。

## 6. 重基线（旧数在新数旁边）

| 位置 | 旧 | 新 | 为什么 |
|---|---|---|---|
| `App.vue` 的 `page` 联合 | 8 个值 | **9 个**（+`chapter`） | 队列点的「章节」页现在存在 |
| `pages.test.ts` 的 `it.each` | 8 个路由 | **9 个** | 同上 |
| `pages.test.ts`「has no chapter page」 | `not.toMatch(/page === 'chapter'/)` | **`toMatch(/page === 'chapter'/)`** | D32 记的是当时的事实；本片推翻了它，所以断言翻转而不是删除 |
| `chapters.stars` 读者数 | **0** | **1**（`ChapterPanel`） | D31 记的缺口 |
| `previewBlocker` 对章节线 | 未评估 | **明确不复用** | 八条里七条无关（§3） |

**没有数字变化**：本片不动结算、不动关卡、不动存档 schema。三关的时长、目标、星级门槛一列都没改。

## 7. 门禁

- `ui/chapter-entry.test.ts`：**14 `it` / 10 ms**。
- `src/ui` + `src/chapter` 子集：**16 files / 480 tests / 7.98 s**，全绿。
- `vue-tsc --noEmit`：clean。
- 全量：见 §7.1。

### 7.1 全量

**60 files / 1684 tests / 1722.14 s / EXIT=0 / 零失败**（`npx vitest run > full.log 2>&1`）。
增量 **1669 → 1684 = +15** = 新文件的 14 个 `it` **加** `pages.test.ts` 路由列表多出的一行
（8 → 9 个路由，`it.each` 多跑一次）；文件数 **59 → 60 = +1**。**两条同时对上 ⇒ 没有探针残留。**
`check` / `smoke` / `audit` / `archive:verify` 全 OK；账本 **271 不变**。

## 8. 没有被验证的

- **Playwright 仍然无输出**。章节页**没有被人看过一眼**，更没有一次「点出战 → 真的进战场」的往返。
  本片能保证的是：`:chapter` 绑定存在、`ChapterRunOptions` 的形状由 `prepareChapterRun` 现场试跑过、
  退出会清空。**不能保证点下去能开**。
- **三关的「出战」按钮没有一次被真的点过**。`prepareChapterRun` 对三关都不抛（测试断言了），
  但 `mountBattle` 拿到 `chapter` 之后会不会正常起 Phaser，**没有验证**。
- **星级渲染没有在真存档上对过**。`best()` 读 `chapters.CH001.stars[id]`，字段名 `CH001` 是字面量；
  如果哪天章节 id 变了，这个读法会静默返回 0。**这是本片的一处硬编码，记在这里。**
- **`replay` 的新 seed 没有验证过「真的换了一局」**。代码上是 `{...chapterOptions, seed: 新}`，
  但 `BattleView` 重挂载时读的是新值 —— 只读了代码，没跑过。

## 9. 已知边界

- **章节页只做入口，不做关卡选择 UI 之外的东西**：没有难度选择、没有英雄切换、没有关卡美术。
  英雄取大厅当前选中的那个（`isStarter(save.hero) ? save.hero : 'H001'`），
  所以「换英雄打章节」要回大厅切 —— 这是本片刻意不做的第二件事。
- **`previewBlocker` 仍然在征途路径上生效**，本片没有削弱它。两条线各有各的门。
- **`launchBlocker` 没有被章节页使用**，所以大厅的「进入战场预览」按钮仍然只对征途生效；
  章节的可用性由 `gates`（试跑 `prepareChapterRun`）单独回答。
