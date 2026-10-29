# R3-U01..05（D32）—— 八页六态，其中两个洞是我上一片留下的假话

Base: `R3-P04`（D31）。队列 `QUEUE.md` #18。裁定 `DECISIONS.md` D32。
代码：`ui/ReportsPanel.vue`、`ui/ChapterResult.vue`、`ui/CodexPanel.vue`、`ui/CharmsPanel.vue`、
`ui/ChallengesPanel.vue`、`ui/SavePanel.vue`、`style.css`。
断言：`ui/pages.test.ts`（**23 个 `it`**）。

## 1. Scope 0 的四个答案（全部命令级，详见 D32）

| 问题 | 答案 |
|---|---|
| 五页今天存在哪些 | **存在七个**（`home/battle/settings/saves/codex/reports/charms`），队列点的五页里「**章节**」**不存在** —— 没有关卡选择页，大厅只有一行硬编码「下一站 · ST001-01」，入口是 `R3-U06` |
| 六态在哪、几个洞 | 矩阵见 §2。真洞 **5 个**（2 个是**假话**、3 个是缺路径），另有 **1 个状态不可达**（存档页的「空」） |
| `transactOnce` 重试可达吗 | **五个调用点，两类失败，只有战斗页区分**。`receipt` 命中 ⇒ 同 id 再调是安全的；`revision` 不符 ⇒ **重试永远不会成功**，必须回大厅。`CharmsPanel` / `SavePanel` 把两类显示成同一句话 |
| 窄屏今天做什么 | **八处断点全在大厅与战斗**；`settings/codex/reports/charms/challenges` **五页零断点** |

### 1.1 队列自己的描述过期了两个片

队列 §「R3-U01..05 + R3-U06」写着「`App.vue` 只有 `home | battle | settings | saves` 四页」。
实测本片之前是 **七个**（D28/D29/D30 各加一页）。这条不影响任何代码，但它是本片 Scope 0
撞上的**第一个假前提** —— 如果照它去数，会把「图鉴/战报/护符」三页当成不存在。

## 2. 六态 × 八页

判据是「有没有一个读者能看见的东西」，不是「有没有 `v-if`」。

| 页面 | 空 | 忙 | 错 | 重试 | 保存 | 窄屏 |
|---|---|---|---|---|---|---|
| `home` | 占位「正在读取存档」 | `busy` 禁用全部按钮 | `storageError` + `role=alert` | 「重试读取存档」 | 不写 | `style.css` 640px |
| `settings` | 静态，无空态 | 无异步 | 无 | 无 | 无 | **本片补上** |
| `saves` | **不可达**（§2.2） | `busy` | `error` | **本片补「重试上一步」** | `notice` | `saves.css` 640px |
| `battle` | `loading-curtain` | `eventBusy`/`settling` | `error`/`eventError`/`settlementError` | 「重试原选择」「重试保存战果」 | 「正在保存…」/「战果已保存」 | 4 处断点 |
| `codex` | 四态标签 + 未知 id 列表 | 无异步 | `progressError` | 无（同步，无处可重试） | 不写 | **本片补上** |
| `reports` | `runs === 0` 的 `.empty` | 无异步 | `progressError` | 无 | 不写 | **本片补上** |
| `charms` | 六行全渲染（未获得照常显示） | `busy` | `error` | **本片补「重试装备」+ 区分两类失败** | `notice` | **本片补上** |
| `challenges` | 三行全渲染（未达成照常显示） | 无异步 | `read.error` | 无 | 不写 | **本片补上** |

`codex` / `reports` / `challenges` 三页**没有重试态**，因为它们**没有异步写入**：读存档是同步的，
`readChapterProgress` 抛错就当场变成一句文案。给一个没有异步的页面加重试按钮是**假按钮** ——
按下去什么都不会发生。这条写在这里，是为了下一片不要「为了矩阵好看」补上去。

### 2.1 两个洞不是缺状态，是**假话**

这是本片最该记的一条。

| 位置 | 页面说的话 | 真值来自哪 | 什么时候变假的 |
|---|---|---|---|
| `ReportsPanel.vue` | 「写入处是**胜利记 1 星**、其余记 0，校验却允许 0–3」 | `settlement.ts` 的 `starsFor` | **D31**，同一个提交里改的 |
| `ChapterResult.vue` | 「新解锁 N 件战备护符，**效果将在战备版本开放**」 | `charms.ts` + `prepare.ts` 的 `charm` | **D30** |

两处都是**页面自己复述了另一个模块的规则**。改实现的时候我改了 `settlement.ts`、改了
`reports.ts` 的注释、改了三条测试断言 —— **没有改那句给玩家看的话**。
测试全绿，因为没有任何断言读它。

**修法不是改字，是让页面从数据取**：`ReportsPanel` 的星级说明现在插值
`chapterStars.clear` / `chapterStars.mastery` / `chapterStars.masteryHp`，重调档位时页面自动跟着变；
`ChapterResult` 改成陈述**已经发生的事实**（「可在战备页装备，一次一枚，下一局生效」）。

`pages.test.ts` 用两条断言钉住：**旧句子不再出现** + **新句子从 `chapterStars` 读**。
只钉前者的话，「换个说法再说一遍同样的错」还是绿的。

### 2.2 存档页的「空」是不可达的

`SaveRepository.initialize()`（`SaveRepository.ts:49-60`）在 `existing` 为空时**创建一个**
`新征途 1` 再返回 ⇒ `slots` 永远至少一条。`SavePanel` 的 `v-for` 空数组时什么都不渲染，
但**触发它的路径不存在**。

**空真断言与真断言长得一样**，所以这条不当成交付，而是**钉住它的所有者行**：
`pages.test.ts` 断言 `const slot = existing[0] || this.makeSlot('新征途 1'` 与
`if (!existing.length) slots.add(slot);` 这两行还在。如果哪天有人把它改成「没有就返回空」，
这条先红 —— 那时 `SavePanel` 才真的需要一句空文案。

图鉴/战报/护符/挑战四页的「空」是**真状态**（新存档就是没有战报、没有护符、没有达成），
四页都已经有句子，同一组断言逐个点名。

## 3. 重试：两类失败长得一样

`SaveRepository.ts:97-114`：

```
receipt 已存在        → { applied: false, slot, result: 旧结果 }   ← 同 id 再调，安全
slot.revision !== rev → throw '存档已更新，请返回大厅重新载入后继续' ← 重试永远失败
```

`BattleView.vue:118` / `:131` **逐字区分**（`cause.message.includes('存档已更新')`），
给出「重试原选择」与「返回大厅」两条不同的路。本片把同一个判据搬进 `CharmsPanel`：

- 可重试 ⇒ 「重试装备」，`equip(lastId)` **重发同一次装备**（不是「第一行」）；
- revision 不符 ⇒ 「返回大厅重新载入」，并明说**再点一次也不会成功**。

`SavePanel` 补的是另一种：它走的是 `create/select/import/export`（不经 `transactOnce`），
所以重试是**重跑同一个闭包** —— `failed` 存的是闭包本身，`importFile` 捕获的 `File` 还在，
玩家不用重新选文件。**存闭包而不是存按钮名，才让「重试」是同一个操作。**

## 4. 窄屏：八处断点，五页零断点

补之前：`style.css:6`（640 大厅）、`style.css:8`（360 战斗按钮）、`battle-compact.css:4`（600 高 + 横屏）、
`battle-compact.css:43`（600×740 + 竖屏）、`chapter-ui.css:32`（640 或粗指针）、
`chapter-ui.css:63`（600 高 + 横屏）、`evolution.css:48`（360）、`saves.css:8`（640）。

补之后新增五处：`CodexPanel` / `ReportsPanel` / `CharmsPanel` / `ChallengesPanel` 各自的
`<style scoped>`，加上 `style.css` 的 640 块里的 `.settings`（设置页是 `App.vue` 内联，没有自己的 style）。
`ChapterResult.vue` 也补了一段（结算 dialog 是每局必经的一屏）。

**为什么断点必须在组件自己的 scoped style 里**：`scoped` 只作用于本模板，`style.css` 的规则
**到不了**这些页面 —— 所以 `pages.test.ts` 逐个检查**组件文件本身**，只有 `SavePanel`（无 `<style>`）
和 `settings`（无组件）分别指向 `saves.css` 与 `style.css`。

## 5. 重基线（旧数在新数旁边）

| 位置 | 旧 | 新 |
|---|---|---|
| `ReportsPanel` 星级说明 | 「胜利记 1 星、其余记 0」 | 插值 `chapterStars`（2 / 3 / 55%） |
| `ChapterResult` 护符句 | 「效果将在战备版本开放」 | 「可在战备页装备（一次一枚，下一局生效）」 |
| `SavePanel` 错误态 | 只有一句话 | 一句话 + 「重试上一步」 |
| `CharmsPanel` 错误态 | 一句话，两类失败同形 | 两类分开，各给一条出路 |
| 五页窄屏 | 零断点 | 各一段 `@media (max-width: 640px)` |

**没有数字变化**：本片不动结算、不动关卡、不动存档 schema。`stars` / `gold` / `charms` 一列都没变。

## 6. 门禁

- `ui/pages.test.ts`：**23 `it` / 10 ms**。
- `src/ui` + `src/chapter` 子集：**15 files / 465 tests / 8.05 s**，全绿。
- `vue-tsc --noEmit`：clean。
- 全量：见 §6.1。

### 6.1 全量

**59 files / 1669 tests / 1633.89 s / EXIT=0 / 零失败**（`npx vitest run > full.log 2>&1`）。
增量 **1646 → 1669 = +23**，逐字等于 `pages.test.ts` 的 23 个 `it`；文件数 **58 → 59 = +1**。
**`+N` 与 `文件数 +1` 两条同时成立 ⇒ 没有探针残留**。
`check` / `smoke` / `audit` / `archive:verify` 全 OK；账本 **271 不变**（本片不动 `evidence/` 下的
产物清单，`cap10-md5.txt` 的扫描范围不含 `R3-U`）。

## 7. 没有被验证的

- **Playwright 仍然无输出**。本片加了五段断点，但**没有一张截图、没有一次真机**。
  能保证的只有「断点存在」与「规则写在组件自己的 scoped style 里」，**不能保证窄屏好看**。
  这一条必须原样转述，不能写成「窄屏已适配」。
- **重试按钮没有被人点过**。`SavePanel` 的「重试上一步」与 `CharmsPanel` 的「重试装备」都是
  源码级断言（按钮存在、绑定的闭包/参数正确），**没有一次真实的失败—重试往返**。
  能保证的是「按钮连到的是失败的那个操作」，不能保证「点下去真的成功」。
- **两类失败的区分靠消息文本**（`includes('存档已更新')`）。`BattleView` 早就这么做，本片沿用了
  同一个判据 —— 但这是一个**字符串契约**，不是类型契约。改那句话会同时静默关掉三处的分支，
  而没有任何测试会红。**这是一条已知的技术债，记在这里。**

## 8. 已知边界

- **章节模式仍无入口**（`App.vue` 不传 `:chapter`，入口 `R3-U06`）。本片数出来的「章节页不存在」
  就是这件事的页面侧证据：不是忘了做，是 `R3-U02` 与 `R3-U06` 是同一件事，后者归 #19。
- **`settings` 页是 `v-else` 兜底**：任何未匹配的 `page` 值都会落到帮助页。好处是永不空白，
  代价是「页面路由出错」会被显示成「帮助」。`pages.test.ts` 钉住这个形状（有 `v-else`、无
  `page === 'settings'`），这样改兜底是一个显式决定。
- **`battle` 页的六态已经最全**（4 处断点、3 个错误字段、2 个重试按钮）。本片没有改它，
  只在测试里引用它作为「两类失败要分开」的样板。
