# R3-U07 — 四个难度档位，和那道只放一个进去的门

裁定：`DECISIONS.md` D38。基线：R3-M07（D37）。队列无条目。

## 1. 这一片要回答什么

`difficulties.json` 有四行，`budget`/`elite`/`hp`/`dmg`/`speed`/`xp` 在章节路径上**全部被读**，
而 `prepareChapterRun` 用**一个比较**把它们全拒了。玩家觉得 `CH001-02` 太简单（D37 测到 33/33）时，
手里没有任何杠杆 —— 而数据早就加载好了。

Scope 0 的四问，逐条用命令回答（全文见 D38）：

| 问题 | 答案 |
|---|---|
| 类型/默认/检查有几个站点 | **14 个**；门只有 **2 行**（类型字面量 + `!== 'normal'`） |
| 八个系数哪些活着 | **六个**：`hp`/`dmg`/`speed`/`budget`/`elite`/`xp`。**死两个**：`gold`（只有遗留结算读）、`drop`（没人读） |
| 放宽类型会碰到存档 schema 吗 | **不会** —— 而这是问题：战报没有难度字段，星级只按 `stageId` 索引 |
| 多少测试硬编码 `normal` | **15 处**，其中 **1 处**含义会变（`contracts.test.ts` 的拒绝列表） |

## 2. 交付

### 2.1 门

```ts
// 之前
difficulty: 'normal';
if (options.mode !== 'story' || options.difficulty !== 'normal') chapterError('模式/难度');

// 之后
difficulty: DifficultyId;
if (options.mode !== 'story') chapterError('模式');
if (!(difficultyIds as readonly string[]).includes(options.difficulty)) chapterError('难度');
```

`difficultyIds` 来自 `Object.keys(difficulties)`，**不重打一份**：JSON 里加第五行，选择器自动多一格。

**门必须查表而不是查 `difficultyFor`**：后者对未知值回落 `normal`。那个回落对**查表**是对的，
对**门**是错的 —— 它会让 `'nightmare '`（多一个空格）跑一局普通难度，而玩家以为选了最难的。
`difficulty.test.ts` 钉住三个未知值（`future` / `Nightmare` / 尾随空格）都被拒，且
`difficultyFor('future')` 确实等于 `normal` —— 两条一起说明「回落还在，但它不再是门」。

### 2.2 战报带档位

`ChapterReport.difficulty` **读取时可选**，缺席按 `normal`。

**这个默认是证明不是猜测**：D27–D38 之间 `prepareChapterRun` 只接受 `normal`，
所以任何缺这个字段的战报**必然是**普通局。门要是曾经开过，同一个默认就是假话。
这句话写在字段上，测试把「删掉字段 → 读回 `normal`」钉住。

写入从 **preparation** 取，不是在这里补默认值：`validateChapterFinal` 已经要求
`run.difficulty === preparation.difficulty`，所以两者不可能不一致。

### 2.3 星级**不**分难度，页面说出来

`chapters.stars` 只按 `stageId` 索引 ⇒ 一次 `nightmare` 通关与一次 `normal` 通关写进**同一格**
（`settlement.ts:79` 的 `Math.max`）。

不改存档形状的理由：星是「我打过了这一关」的记录，不是「我在第几档打过了」；挑战表与护符挂在
`clears` 上，没有一个读者需要按难度分层的星。所以 `ChapterPanel` 的「最好成绩」旁边多一句
**「（不分难度：记的是这一关拿到过的最好星级）」** —— 把语义写在读数旁边，而不是让它去猜。

### 2.4 选择器只列六个系数

`hard` 的 `desc` 写着「高密度高收益」。在章节线上「收益」**不存在**（D31：结算不碰 `gold`）。
照抄 `desc` 就是把一句假话印在按钮上。

所以 `LEVERS` 只列 `hp/dmg/speed/budget/elite/xp`，注释点名 `gold` 与 `drop` 死在哪，
页面写「本模式不结算金币与掉落，所以四档里的「收益」在这里不生效」。
测试断言这两个键**不在** `LEVERS` 里、且注释提到它们 —— **省略是声明，不是遗漏**。

### 2.5 混档的胜率不给

D29 拒绝「不足 5 局的胜率」，也拒绝「跨结局的中位数」。门开了第三种让**分母不再只有一个含义**
的方式。`summarize` 多一条 `tiers.length <= 1`，页面区分两种 `null`：
「样本不足 N 局」/「窗口内混有 2 个难度（标准 / 万界劫），不给合并胜率」。
**不是新规矩，是同一句规矩用在新轴上。**

## 3. `normal` 为什么逐字节不变

`normal` 行的八个数值**全等于 1**，而它们全都是乘数 ⇒ 1 是恒等。

```
hp 1 · dmg 1 · speed 1 · budget 1 · elite 1 · gold 1 · drop 1 · xp 1
```

这不是承诺，是一条断言（`difficulty.test.ts`）。同一条 `it` 里还断言**其余三档不是恒等** ——
前者守现有战局，后者守门开得有内容。两条一起才完整：只钉前者，把四档写成一样也能过。

## 4. 重基线

| 断言 | 旧 | 新 | 为什么 |
|---|---|---|---|
| `contracts.test.ts` 拒绝列表 | 含 `{ difficulty: 'hard' }` | **移出**，单独一条 `it` 断言四档都通过、`future` 仍被拒 | 这是唯一记录着那把锁的断言；**移动而不是删除** |
| 子集 `src/chapter` + `src/ui` | — | **19 files / 516 tests（101.16 s）** | 新文件 17 个 `it`。**不给「之前」的数字**：D37 的 STATE 记的是 `src/chapter` 单目录（15 files / 454），口径不同，并排写会造出一个假的增量 |
| `ReportsPanel` 每行字段 | 6 个 span | **7 个**（多档位） | 战报行多一列 |
| `ReportRow` 字段 | 16 | **18**（`difficulty` + `difficultyName`） | 同上 |
| `ReportSummary` 字段 | 8 | **9**（`tiers`） | 混档不给胜率 |
| 存档 schema | — | **不变** | 新字段读取时可选，`schema30` 不碰 |

## 5. 测试

`chapter/difficulty.test.ts`，17 个 `it`，五组：

1. **门是数据不是字面量**（4）：四个 id 等于 `Object.keys(difficulties)`；四档都能 prepare 且
   preparation 回显所选档位、`stage`/`player` 不随档位变；三个未知值被拒而 `difficultyFor` 仍回落；
   `normal` 八项全 1 且其余三档不是恒等。
2. **六个活系数走进模拟**（4）：`director.interval` 在四档上**严格递减**（不是只比 easy/nightmare ——
   两档对调的表格也能过 `easy > nightmare`）；`eliteChance` 严格递增；同一个敌人 id + 常量随机数，
   `hp`/`damage`/`speed` 的比值等于表里声明的比值，且 `normal` 等于 `cfg.hp * rule.hp`
   （**舞台级缩放坐在难度乘法之后**，漏了它就是「逐字节不变」悄悄失效的典型）；两个死值不在 `LEVERS`。
3. **记录带档位**（4）：写入并读回；删掉字段读回 `normal`；篡改成 `future` 被校验拒；
   **用 `hard` 的准备去结算一局 `normal` 的 run 被拒** —— 这条检查一直存在，门开之前不可达。
4. **混档不给胜率**（3）：5 局里 4 normal + 1 nightmare ⇒ `winRate === null`、`tiers` 两个；
   同档 5 局 ⇒ 胜率回来；`tiers` 按表序而不是按发生顺序。
5. **选中的档位活得比页面久**（2）：档位由 `App.vue` 持有（`shallowRef`），`ChapterPanel` 只有 prop；
   `home()` **清 `chapterOptions` 但不清档位** —— 后者写成「不在那段里出现」的断言，因为
   「忘了清」与「故意留着」在 diff 里长得一模一样。

### 5.1 全量

**63 files / 1720 tests / 1676.49 s / EXIT=0 / 零失败**（`npx vitest run > full.log 2>&1`）。
增量 **1703 → 1720 = +17**，逐字等于 `difficulty.test.ts` 的 17 个 `it`；文件数 **62 → 63 = +1**。
**两条同时对上 ⇒ 没有探针残留。** `check` / `smoke` / `audit` / `archive:verify` 全 OK；
账本 **272 不变** —— 本片没有新增 JSON 报告，全量重写的两份滚动报告逐字节相同。

**这一片杀掉过一次全量重跑**：第一次跑到 2 分 24 秒时，发现难度被做成了页面里的 `ref`
（换页即丢），改完必须重跑。**边跑边改源码时，已经跑过的文件的结果不代表当前树** ——
唯一的信号是「进程还活着」，活着就杀掉重来。

## 6. 边界（原样转述，不当成已解决）

- **`xp` 是六个活系数里唯一没有断言的一个**。它在 `CombatSimulation.ts:299` 被读，但那一行在
  `onKill` 内部 —— 钉它要么跑一局（噪声），要么写源码断言（等于没测）。**记在这里。**
- **页面没有被渲染过**。选择器、六项系数、两句边界都只有源码级断言，Playwright 在本机仍无输出。
- **四档的胜率没有测**。TASK Scope 3 明确要求「钉系数不钉结果」：4 档 × 33 种子是在测机器人，
  不是测这扇门。
- **星级仍然不分难度**。这是一条被写进页面的决定，不是遗漏；要改它是存档形状的改动，不是本片。
- **档位不写存档**：它是 `App.vue` 的会话偏好。换页不丢（有两条断言钉着），但**重启应用回到
  `normal`**。刻意如此 —— 难度是这一局的选择，不是账号设置 —— 而「重启就忘」这件事**没有测试**。
