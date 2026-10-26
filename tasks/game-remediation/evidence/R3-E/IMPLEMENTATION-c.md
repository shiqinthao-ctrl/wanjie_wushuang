# R3-E01..07c —— 「两精英」的定义（D26）

> 队列 `QUEUE.md` #10c。基线 D25（R3-M02）。本片**不改出货档**，**不打开任何关卡**。
> 全部数字来自本页列出的命令；`elite-report.json` 每次运行重算。

---

## 1. Scope 0：四问四答（命令产出）

### (a) `elite` 今天做什么 —— 八个读者，零行数据

`elite` 不是一行敌人数据，是 `spawnRules.ts:69-78` 的一串倍率：

```ts
if (elite) {
  enemy.elite = true; enemy.r *= 1.25; enemy.hp *= 3.25; enemy.maxHp = enemy.hp; enemy.damage *= 1.38;
  enemy.affixes = [...stage.affixes].sort(() => random() - .5).slice(0, state.time > 960 || difficulty === 'nightmare' ? 2 : 1);
  ... enemy.color = '#d5a254';
}
```

读者（`grep -rn "elite" src/`）：

| 位置 | 它做什么 |
|---|---|
| `combatMath.ts:84/90/95` | `eliteDmg` 三个来源（装备/符文/天赋）乘进**玩家打精英**的倍率 |
| `combatMath.ts:107-113` | `enemyHit(..., elite)` 把 target 变成 `'elite'`，走上面那条倍率 |
| `progression.ts:11` | `effectiveXp`：**18 vs 4** |
| `CombatSimulation.ts:262` | 大招充能 **8 vs 1.4** |
| `:263` | `eliteKills++` |
| `:266` | **章节线不掉精英装备**（`!this.chapter`） |
| `:268/:269` | R043 / R041 |
| `SoldierCombat.ts:6` | `isSoldier` = `id === 'EN001' && !elite` |

### (b) 多少行带 `elite`，可达吗 —— **零行**

「带 elite 的行」这个问法本身不成立：`firstStage.json` 里没有任何一行声明自己是精英。出生池是
`[['EN001',5],['EN002',3],['EN003',1],['EN004',1],['EN005',1],['EN006',1]]`，每一行都可能被 roll 成精英。

可达性没问题，而且**比预期更宽**：`finishBaseFrame` 里

```ts
const wave = waveAt(this.time);   // 读 firstStage.storyEncounter.waves，无条件
if (this.lastWave !== wave.at) { ... if (wave.type === 'elite') this.spawn({ elite: true }); }
```

**章节线也继承第一关的波次表**。`CH001-03` 在 150 s 必吃一次 `type:'elite'`。

### (c) `eliteChecks` 是计数还是注记 —— **注记，连断言都没有**

```
$ grep -rn eliteChecks src/ tests/
src/chapter/catalog.ts:11  ... eliteChecks: 0
src/chapter/catalog.ts:12  ... eliteChecks: 0
src/chapter/catalog.ts:13  ... eliteChecks: 2
```

队列说「three catalog rows and one assertion」。实测**三行、零断言**。那条被记成断言的
`seals.test.ts:76`「leaves CH001-03 shut, because its two elites are still undefined」断言的是
**`prepareChapterRun` 拒绝这个 stageId**，不是这个字段。**字段 vs 后果，是两件事。**

### (d) 960 s 的第二词缀，在 480 s 关卡里存在吗 —— **不存在**

判据是 `state.time > 960`（`spawnRules.ts:71`）。三关时长 `360 / 420 / 480` —— **三关全部到不了**。
第二词缀今天只有 `nightmare` 难度能拿到（那个分支是 `|| difficulty === 'nightmare'`）。

**这一条直接否掉了「两个普通精英」**：单条词缀的精英在 480 s 内不构成「检验」。

### (e) 不在 TASK 里、但它决定 scope 3 的发现

`CH001_ALTAR` 不只是「没有配置」——**`stage.boss.id` 全库零读者**。

```
$ grep -rn CH001_ALTAR src/
src/chapter/catalog.ts:13   boss: { id: 'CH001_ALTAR', spawnAt: 360 }
src/chapter/prepare.ts:9    （注释里提到）
```

`FirstBoss.spawn()` 第 55 行把 `id: 'B001'` **写死**，名字/血量/技能全从 `firstBoss.json` 的
`config.boss` 来。实测（`elite-report.json` 的 `gate`）：`CH001-03` 的 `spawn()` 返回 `true`，
`active.id === 'B001'`。**配一份 `CH001_ALTAR` 数据也不会被用。**

所以 TASK scope 3 的答案比它预设的更硬：不是「缺一份配置」，是**缺读这个 id 的代码**。

---

## 2. 三个选项的成本，先写后选

| 选项 | 成本 | 判定 |
|---|---|---|
| **A 两个双词缀精英，由关卡调度** | `createEnemy` 一个 opt-in 参数（缺省不变）+ 一个调度字段 + 一个计数器 + 一行 `renderState` + 一个 `ChapterFinalRun` 字段 | **选它** |
| B 两个新敌人行 | 必须动 `storyEncounter.enemies` 出生池，否则新行永不出现 —— **等于第二次改出货档**，而 D23 刚改过 | 否 |
| C 两个普通精英在两个时间点 | 最便宜，但 150 s 那波已经刷 1 个，再加两个 = **三个**；且 (d) 说单条词缀不构成检验 | 否 |

**A 的定义**：`eliteChecks: N` = 本关要求击破 N 名**由关卡调度**的精英；`eliteAt: [t1, t2]` 是它们
到达的时刻，每个都是**双词缀**精英。`eliteChecks === eliteAt.length` 由测试钉住 —— 两个会漂的数
换成一个关系。

`eliteAt` 是**调度**，不是第二种精英格式：身体仍然只从 `createEnemy` 来。

---

## 3. 实现

| 文件 | 改动 |
|---|---|
| `chapter/catalog.ts` | 三行加 `eliteAt`（`[]` / `[]` / `[120, 300]`）+ 一段说明为什么是两个字段 |
| `core/spawnRules.ts` | `Enemy.checked?: boolean`（显式标签）；`createEnemy` options 加 `affixes?: number` / `checked?: boolean` |
| `core/CombatSimulation.ts` | `checkedElites`、`eliteCursor`、`spawnScriptedElites()`、`eliteCheckState()`；`renderState()` 发布 `eliteChecks` |
| `core/FirstBoss.ts` | `bossAt()` 在 `checkedElites < eliteChecks` 时返回 `undefined` |
| `core/GameCore.ts` | `UiSnapshot.eliteChecks`；`captureFinal` 写 `elitesChecked` |
| `chapter/settlement.ts` | `ChapterFinalRun.elitesChecked`；上限校验；`completed` 加一项 |
| `ui/BattleView.vue` | `elite-route` 面板（进度 / 下一名何时登场）+ 目标行分流 |
| `chapter/eliteChecks.test.ts` | **新，13 个 `it`、20 ms** |

**为什么 `checked` 是显式标签而不是 `affixes.length >= 2`**：后者是**反解**。一个字段的语义如果
要从另一个字段的长度推出来，平衡改动一碰就断，而且「这条算不算」会随数据漂移。标签是**声明**。

**为什么门开在 `bossAt()` 而不是 `updateObjective()`**：`bossAt()` 返回 `undefined` 已经有两个
既有语义 —— `spawn()` 不刷、`snapshot().phase` 恒 `'advance'`（D25 引入）。门开在这里，
「没检验就胜利」**不是结算要拒绝的状态，是不可能发生的状态**。

---

## 4. 读数（`elite-report.json`，每次运行重算）

| 量 | 值 | 判据 |
|---|---|---|
| 首名检验精英到达 | `at = 120` | `sim.time = 120` + 一帧 |
| 它的词缀 | `['swift','tank']`（**2 条**） | `affixes.length === 2` |
| 它的血量 / 半径 | `hp = 657`、`r = 12.5` | 普通精英 `r = 12.5` 同，`hp` 因 `tank` ×1.8 |
| 跳到 300 s 时刷出 | **2 个**（一次补刷） | 游标单调 ⇒ 走过去也没用 |
| 两个都杀后 | `checkedElites = 2` | |
| **150 s 波精英** | `eliteKills = 1`、`checkedElites = 0`、`affixes.length = 1` | **两个计数器确实不是同一个数** |
| 门 | `spawnBefore = false`、`spawnAfter = true` | 同一个 `spawnAt = 360` |
| 门后的 Boss | `active.id = 'B001'` | **`CH001_ALTAR` 零读者的硬证据** |

**可读性**：`renderState().eliteChecks` 与 `eliteCheckState()` **逐项相等**（`before`/`after` 两次
读数记在报告里）；`GameCore.snapshot().eliteChecks` 在**开着的** `CH001-02` 上转发同一个对象
（`{required:0, defeated:0, at:[]}`）—— 证明通路存在，不是证明数字非零。

---

## 5. 价格

**零读数移动。** `threat-v2` 与 `legacy` 都不带 `eliteAt`（`chapter` 之外没有这个字段），
所以出货档逐字节不变。`git diff --numstat evidence/` 有两行，**两行都不是读数**：

| 文件 | 差异 | 是什么 |
|---|---|---|
| `R2-F-CAP/cap10-md5.txt` | `+1` | 证据树的 md5 清单多了一个文件（清单 269 → 270 == 账本 270） |
| `R3-M/seal-report.json` | `+2 / -1` | **schema 增长**：`stage` 对象多一个 `eliteAt: []`。**读数逐项不变** —— `held`、`hp`、`time`、`kills` 一个都没动 |

第二条要特别说：`seals.test.ts` 把整个 `stage` 写进滚动报告，`catalog` 加字段就会改它。
**判断它是「schema 增长」还是「读数漂移」的方法只有一条 —— 看 diff 里改的是不是只有键。**
本片 diff 里新增的是 `"eliteAt": []` 一行、改动的是上一行补逗号，**没有一个是数**。

**3 条机械重基线**：三处 `ChapterFinalRun` 字面量补 `elitesChecked: 0`
（`contracts.test.ts:15`、`tests/fixtures/chapterHarness.ts:10`、`seals.test.ts:167`）。

**没有语义重基线** —— 没有一条既有断言因为本片改了读数。

---

## 6. 记录不改

1. **`CH001-03` 仍然关着。** 不是两精英没定义（本片定义了），是 `CH001_ALTAR` 没配置**且
   `stage.boss.id` 没读者**。开门要先把 `FirstBoss` 从写死 `B001` 改成按 `stage.boss.id` 查表 ——
   那是 `R3-M03` 的第一件事。
2. **`settlement` 的「胜利需要 `elitesChecked >= eliteChecks`」今天不可达。**
   `validateChapterFinal` 第一行是 `validateChapterOptions`，它按 `OPEN_STAGES` 拒绝 `CH001-03`。
   可执行的那半是**上限**：开着的关卡 `eliteChecks: 0`，一份声称 `elitesChecked: 1` 的战报会被拒
   （`eliteChecks.test.ts` 里那条就是它）。**空真的一半明说，不假装测过。**
3. **章节线继承第一关的波次表。** `finishBaseFrame` 里 `waveAt(this.time)` 无条件读
   `firstStage.storyEncounter.waves`，所以 `CH001-03` 在 150 s 会刷一个**不属于本关设计**的精英。
   本片没动它（动了就是改章节线的节奏），但它是一处真实耦合。
4. **`ChapterReport` 不记 `elitesChecked`** —— 与 D25 的 `sealsHeld` 同理，持久化 schema 不在这片扩。
5. **无 Playwright** ⇒ `elite-route` 面板的版式、颜色、淡出**没有被看见**；只保证它读的字段
   就是被断言的字段。

---

## 7. 门禁

- `vue-tsc --noEmit` clean。
- `eliteChecks.test.ts`：**13 个 `it`、20 ms**。
- 子集（`src/chapter/` + `src/game/` + `firstBoss` + `bossLifecycle` + `GameCore` + `spawnRules` +
  `progression`）：**16 文件 / 458 用例全绿、2.83 s**。
- 账本：`LEDGER OK` 270/270，滚动 35，missing/stale/moved/extra 全 0。
- **全量：53 files / 1557 tests、1676.81 s**。首轮 **2 条红**，都是 `byteLedger.test.ts` 的覆盖断言
  —— 新报告还没入账。`ledger:write`（270 行）+ `ledger:verify` OK 后单文件复跑 **5/5 绿**。
  **所以全绿是推出来的，不是重跑出来的**，推导链写在下面，因为重跑要 28 分钟而这条链更硬：
  ① 首轮 52 个文件绿、1 个红；② `grep -rn cap10-md5 src/ tests/` 只有 `byteLedger.test.ts` 读它
  （另一个是生成器 `byte-ledger.mjs`），所以账本内容不可能影响别的文件；③ 该文件复跑 5/5 绿。
  **增量**：`1557 - 1544 = 13` = `eliteChecks.test.ts` 的 `it` 数；`53 - 52 = 1` = 新增的一个文件
  ⇒ 没有探针存活。

---

## 8. 本片自己踩的三个坑

三条红全是**驱动错**，不是读数错：

1. **夹具选错层**：用 `GameCore` 构造 `CH001-03` 会被 `OPEN_STAGES` 拒 —— `CombatSimulation` 才是
   不看策略的那一层（它只读 `chapter.stage`）。
2. **跳时间会补刷**：把 `sim.time` 直接跳到 150 s，会让 120 s 的检查**补刷**（游标单调），于是
   「150 s 波精英不计」的断言被自己的检查污染 ⇒ 那条必须换到 `CH001-01`（`eliteAt: []`）上测。
   **这个坑本身就是机制在起作用**：补刷正是「走开也躲不掉」的实现。
3. **`spawn()` 不在 `updateAI` 里**：它在 `updateObjective()` 里调。用 `beginFrame` 驱动永远等不到
   首领 ⇒ 门那条断言改成直接调 `spawn()`，测的是门本身，不是帧循环何时调它。
