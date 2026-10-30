# 项目长期记忆 — wanjie_wushuang（万界无双）

> **判据全集在 `memory/RULES.md`**（原 MEMORY.md 超注入上限被截断，规则段已拆出）；单片裁定全文在
> `tasks/game-remediation/DECISIONS.md`（D1–D30）；细则见 `headless-harness-fidelity/SKILL.md` 与
> `memory/YYYY-MM-DD.md`。本文件只留**当前状态 + 每次开工都要用的东西**。

## 当前状态

- 分支 **`main`**（已推 GitHub；Render watch `main`）。生产主力 = `apps/mobile-next/`（TS+Vue3+Phaser4+Vite+Vitest5）。
- **已完成**：R1g-1…13、R2-F01…F10 及全部 `R2-F-*`、R2-S01..12(D19)、R2-B01..08(D20)、R2-D(D21)、
  R3-E01..07(D22)、R3-E01..07a(D23)、R3-M01(D24)、R3-M02(D25)、R3-E01..07c(D26)、R3-M03(D27)、
  R3-P01 图鉴(D28)、R3-P02 战报(D29)、R3-P03 六护符(D30)、R3-P04 挑战+三星(D31)、
  R3-U01..05 五页六态(D32)、R3-U06 章节入口(D33) —— **队列 1–19 清空**；之后 `R3-M04` 波次表(D34)、
  `R3-M05` 标定(D35)、`R3-M06` 窗口(D36)、`R3-M07` 四臂(D37)。
- **D23/D24 两次改出货档**：出生池 `5/3/1` → **6 行**（`charge`/`aoe_ranged` 变真行为，复用 `Telegraph`
  单条预警通道，难度上升是固有的）；敌人移动补 `clampPoint`、火线钳制对象从**中心**改成**线体**。
- **D25–D27 章节线连开三关**：`CH001-02`（界碑半径 **160** 承重）；`CH001-03`（`bosses[id]` 构造期解析、
  三阶段进数据，**六条 `curve` 必须仿射**——`.95 - phase*.08` ≠ 字面量 `0.87`，预言机逐字节钉着；
  `'B001'` 承重：`damageTakenBy` 键前缀 + `bossThreat.test.ts` 的 `slice(5)`）。
- **#14 图鉴（D28）**：`chapter/codex.ts` + `ui/CodexPanel.vue`。融合 10 行 → **4 可组装 → fresh 持有 3**；
  三英雄可组装**集合相同**、差的是**频率**（订正 D21）；`discoveries` 键是 **formId**、缺席是 `undefined`。
- **#15 战报（D29）**：`chapter/reports.ts` + `ui/ReportsPanel.vue`。17 字段 / 一个读者（`runId` 去重）/
  零渲染器；上限两处两种态度（写入 `slice(0,20)`、校验 `>20` 拒收）；`stars` 只写 `0/1` 而校验允许 `0..3`；
  **7 字段在战报边界被丢掉**（含 `sealsHeld`/`elitesChecked`，即 D25/D26 的读数）。
- **#16 六护符（D30）**：`chapter/charms.ts`（六行 = `lever` + `factor`，**不存绝对值**）+ `ui/CharmsPanel.vue`
  （全应用唯一写进度的界面）。六个 id **实现前 0/6**；效果挂 `chapter` 路径、**乘数缺省 1**（`x*1` 逐字节相等
  ⇒ 预言机结构上安全）；打出来的三枚：胜利 3/3、觉醒 3/3、两条羁绊 1/3。**最贵的错**：`p.skillCd` 有**三个**
  写入点（`H001` 走 `DragonCombat`）⇒ 收成 `skillCooldown()` 三处共用。
- **#17 挑战（D31）**：`chapter/challenges.ts`（三行 = `asks` + `reward` + 只读三个字段的谓词，
  `Proxy` 数属性）+ `ui/ChallengesPanel.vue`。`chapters.stars`/`clears` **生产读者 = 0**；重打无永久收益的
  所有者行是 `prepare.ts:43`；`stars` 从 `victory?1:0` 改成 `starsFor()`（2 通关 / 3 过 55%，`>` 不是 `>=`）。
  **最贵的发现**：GDD 的「通关1/无伤2/≥55%3」**建不出来**（无伤蕴含 ≥55%，`Math.max` 下两档塌成一档）⇒ 按数据。
- **#18 五页六态（D32）**：`page` 联合 **8 个**值（队列说 4 个，过期两片）；队列点的「**章节**」页**不存在**
  （= #19）。**两个洞是假话**：`ReportsPanel` 说「胜利记 1 星」（D31 已改）、`ChapterResult` 说护符
  「效果将在战备版本开放」（D30 已接入）—— **跟改动同一提交发出，测试全绿，因为没人断言那句话**。
  `transactOnce` 两类失败同形（`receipt` 命中可重试 / `revision` 不符永远失败）；五页零 `@media`。
- **#19 章节入口（D33）**：**「可构造 ≠ 可玩」解掉了** —— 六个片在一条没入口的路径上写代码，
  原因只有一行 `App.vue` 的 `<BattleView>` 少了 `:chapter`。新 `ui/ChapterPanel.vue`（三关 + 派生目标 +
  最好星级）。**最贵的发现**：TASK 说「复用 `previewBlocker`」是**假的**（八条里七条章节线不读，
  `contracts.test.ts:27-38` 已测）⇒ 改成**试跑一次 `prepareChapterRun`**。三格星级在 D29 被拒、
  D31 之后才对 —— **同一个布局因数据变了而答案相反**。`chapters.stars` 拿到第一个读者。
- **R3-M04 波次表（D34）**：`waveAt(time)` **签名里没有 stage** ⇒ 三关共用 `firstStage` 的表，而它 360 秒
  结束、末行 `budget: 0` ⇒ `interval = Infinity` ⇒ **不刷怪**。`CH001-02`（420s、无 Boss）**真空 60 秒**；
  `CH001-03` **不是空场**（Boss 在 360 登场）—— **判据是「玩家有没有事做」，不是「刷不刷怪」**。
  两次给祭坛加 Boss 战小怪都让 hunt 输给 corner（2/3、1/3 vs 3/3）⇒ **降参数不修「惩罚正确玩法」**。
  只给 `CH001-02` 加表，另两关 `waves: null` 逐字节不变。
- **R3-M05 标定（D35）**：33 种子 × 2 策略 × 3 关。`CH001-01` **22/33**、`CH001-02` **33/33**、
  `CH001-03` **17/33**；`idle` 对照（不站碑）**0/33**。**`CH001-02` 33 局全在 289.98 秒结束**，
  而关卡 420 秒 ⇒ **后 130 秒只有输家看得到**（**否定 D34 的一半功劳**）。零生产改动：
  杠杆在 `seals[].opensAt` / `duration`（D25），不在波次表。
- **R3-M06 窗口（D36）**：三关窗口 **52.55 / 130.02 / 79.93 秒**；`duration` 8 个读者、`opensAt` 4 个
  ⇒ 改后者（`90/180/270 → 100/220/340`）。**窗口 130→60，胜率 33/33 一点没动** —— 假设被证伪。
  改动保留但**理由换了**（一致性，不是难度）。`CH001-01` 的 6 局超时**血是正的**（打不完 Boss），
  与 `CH001-02` **方向相反**。
- **R3-M07 四臂（D37）**：`seal` 33/33（每秒承伤 **1.017**）、`clear` **29/33**（411，**更差且更疼**）、
  `idle` 0/33；`CH001-01` 22/33（1.380）、`CH001-03` 17/33（1.439）。承伤 **70% 是远程弹** ⇒
  走向敌人 = 吃更多弹。**「更差」比「走不通」值钱**（29 不是 0）。两次尝试都没碰到 100%。
- **当前 = `R3-U07`**（章节线的难度档位：`difficulties.json` 四档，`prepareChapterRun` 只放 normal）。
- **未决**：`R2-F-G4ROWS` evolution 臂可达性塌了；**章节线在 UI 上不可达**（`App.vue` 从不传 `:chapter`
  ⇒「可构造 ≠ 可玩」，入口 `R3-U06`）；章节线继承第一关波次表；火线**不伤小怪**；`hazardPeak` 死字段；
  死数据 `boss.skills`/`mechanics.shield`/`shrink`/`name`；火线 band 是**屏幕空间**；27pp 视口差未归因；
  G10 的 D3 门槛未达；主术式无 UI；`S001` 与形态**共用召唤上限**。参数见 `handoff/STATE.md`。

## 本机限制（每次都用得上）

- **`npm run check` 现在能跑**（`CHECK OK: 26 JS, 1 CSS`，查遗留 `index.html` 的本地引用）——
  记忆里「跑不了」是**过期结论**（D31 实测）。**`find` 不能从 node 调** ⇒ 纯 `fs` 递归；
  **`md5sum` 被拦** ⇒ `node:crypto`。**Playwright 始终无输出** ⇒ 浏览器侧改动无法本地验证，须写进交付
  （断言读**渲染器读的同一个字段**）。
- **后台任务回合结束被杀** ⇒ 后台 + **同回合内阻塞** `TaskOutput`（单次 10 分钟，全量分 3 次）。**全量 27–30
  分钟**；`bossThreat.test.ts` 单文件 27 分钟 ⇒ 单文件前台会撞上限。
- **`npx vitest run --reporter=basic` 不认** ⇒ 默认 reporter + `> log 2>&1`；日志带 ANSI ⇒ 解析先 `re.sub`。
- **`node -e` 里反引号会被 shell 当命令替换** ⇒ 含反引号的长文本用 `Write` 或 Python heredoc。
- **`Edit` 的 `old_string` 含 `▶`/`−`/未转义 `|` 时易失配** ⇒ 用 Python heredoc（`replace` + `assert count==1`）；
  并发多个 `Edit` 可能静默丢一个 ⇒ 改完 `grep` 复核；**一条 assert 失败会让整段替换全部不落盘** ⇒ 先跑
  「逐条 `count()`」探针再一次性应用。**Python `glob()` 返回 `\` 分隔路径** ⇒ `os.path.relpath` + `os.sep`。
- **`ledger:write` / `ledger:verify` 在仓库根**（子包里是 `Missing script`）。生成器
  `tasks/game-remediation/byte-ledger.mjs`，账本 `evidence/R2-F-CAP/cap10-md5.txt`。**全量跑完会重写滚动报告
  ⇒ 账本要在全量之后再刷一次**。手写脚本算对 ≠ 它就是那条命令。
- **活跃上下文包 ≤ 8192 B**（`AGENTS.md+TASK.md+handoff/STATE.md+docs/INDEX.md`）；`TASK.md` 是唯一活跃槽。

## 十条最高频判据（全集见 `RULES.md`）

1. **前提为假 ⇒ 零生产改动**，交付「测量 + 归因 + 写回队列」。TASK/队列的「做法」与「理由」都可能为假。
2. **「没有 X」先问「X 的防守对象存在吗」**：空真断言与真断言长得一样，只有后者会在有人加进第一个碰撞体时变红。
3. **一个字段「声明在表里」≠「它出场」≠「它被实现」** ⇒ 数集合分三层数，别写成一个数字。
4. **一个键名 / 一个「杠杆」可能有多个发射点** ⇒ 先 `grep` 发射点，改一处可能对两个英雄无效。
5. **校验允许的范围可以比写入的宽，宽出来的格子是假的** ⇒ 画实际值，不画声明范围。
6. **驱动函数要对**：`enemyAI`/`updateEnemyWarnings` 在 `beginFrame` 里跑，不在 `updateOuter`；用错驱动得到
   全 0，那**不是**「没发生」。
7. **「首轮全绿」也可能是过期绿**：判据是「mtime 早于采集时刻」；**边跑边改时唯一信号是「进程还活着」**，
   活着就别改测试文件，改了必须杀掉重跑。
8. **结局量混沌**：平衡数字 ≥ 33 种子；胜率必须带仪器声明；混沌序列上的 `max` 钉上界不钉值。
9. **「有效」≠「修好了」**：分开写「机制生效」与「净额变好」，净额符号用同一份账本回答。
10. **断言范围应等于它声称的事实范围**：钉自己那一段，不钉邻居；「A 与 B 形状一样」必须让两者在别的维度上
    真的不同。
