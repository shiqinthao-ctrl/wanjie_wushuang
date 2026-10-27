# R3-M03（D27）—— 祭坛术主的三阶段，以及一个没人读的首领 id

**这一片的起点是一句假话**：`CH001-03` 写着 `boss: { id: 'CH001_ALTAR', spawnAt: 360 }`，
而 `FirstBoss.spawn()` 把 `id: 'B001'` 写死。所以「祭坛术主」不是缺一份数据，是**缺一次查表**。
D26 已经量到：`CH001-03` 刷出来的 `active.id` 就是 `'B001'`。

---

## 1. Scope 0：四个问题，四条命令

### (a) `firstBoss.json` 里有几个 Boss？**一个，而且它连 `id` 字段都没有。**

```
top keys: ['boss', 'mechanics', 'pool']
boss keys: ['name', 'map', 'style', 'hp', 'color', 'skills']      ← 没有 id
```

`pool` 是**战利品池**（`EQW007`/`EQA007`/`EQX007`），读者是 `gearDrops.ts:10,24` —— 它不是首领池。
所以「按 `stage.boss.id` 查表」这件事，**表本身不存在**，必须先造出来。

### (b) `mechanics.phase` 有几个条目，谁在读？**三个，一个读者。**

`phase: ['巨斧压境','蛮王狂怒','震岳绝境']`，唯一读者是 `FirstBoss.ts` 的 `snapshot()`
（`phaseName`，给 HUD 用）。所以阶段**名字**是数据，阶段**行为**是代码里的九个字面量。

### (c) `maxPhase` 来自数据还是配置？**都不是 —— 来自血量比。**

`FirstBoss.ts` 的 `updateAI` 每帧算 `ratio <= .35 ? 3 : ratio <= .70 ? 2 : 1`，`maxPhase` 取历史最大值。
读者只有一处：`GameCore.captureFinal` 的 `bossPhaseMax`，而且**只在非章节路径**写（章节 `captureFinal`
走另一个分支）。所以两个阈值 `.35/.70` 是**代码里的字面量**，不是配置。

### (d) 还有别的东西按 `'B001'` 分派吗？**有，而且最贵的一处在测试里。**

| 位置 | 用法 | 为什么是承重的 |
|---|---|---|
| `FirstBoss` ×2 | `` `B001-contact` ``、`` `B001-${warning.name}` `` | 这是 `damageTakenBy` 的**键前缀**，账本靠它区分「谁打的」 |
| `FirstBoss` ×4 | `feedback(kind, 'B001')` | 事件源 |
| `bossThreat.test.ts` | `source.startsWith('B001')` → `source.slice(5)` | **`slice(5)` 把 id 的长度写死了**。id 一变长，招式名解析出 `01_ALTAR-震地斩`，`SKILL_SHAPE[...]` 取不到 ⇒ 伤害被静默归进 `lostToHorde` |
| `bossBudget.test.ts` | `source.startsWith('B001')` | 同上，`bossShareOfPhaseDamage` 的分母 |
| `bossLifecycle.test.ts` | `expect(...id).toBe('B001')` | 出货路径的身份断言 |
| `chapterPresentation.ts` | `chapterAssets` 里的 `B001-BODY` | 载入期资源行 |
| `scripts/asset-pipeline.mjs:116` | 要求**遗留树**含 `boss?.id==='B001'` | 遗留 V3.1.3 的审计门禁 |

**结论**：`'B001'` 不能改名，只能**加一行**；而新 id 一旦出场，伤害源前缀必须**跟着 id 走**，
否则两个首领在账本里会合并成同一个键。

### 第五个发现（TASK 没问，但它决定了 Scope 1 怎么写）

`firstStage.rule.bossId === 'B001'` —— **全库零读者**。

也就是说「默认用出货的那个」不需要一个魔法常量兜底：**数据里早就写着它，只是代码不看**。
所以 `FirstBoss` 的默认值不是 `'B001'` 这个字面量，而是 `firstStage.bossId`。

---

## 2. 查表：一行一个 id，缺 id 是错误

`firstBoss.json` 从 `{ boss, mechanics, pool }` 变成 `{ bosses: { B001: {boss, mechanics}, CH001_ALTAR: {...} }, pool }`。
**不是第二种格式** —— 每一行都是同一个形状，`FirstBoss` 仍然是「首领」唯一有意义的地方。

`FirstBoss` 在**构造时**解析一次：

```ts
this.id = sim.chapter?.stage.boss?.id ?? firstStage.bossId;
this.row = bossRow(this.id);        // 缺行 ⇒ throw「未知首领：<id>」
```

放在构造函数而不是 `spawn()` 里，是因为 `spawn()` 每帧被 `updateObjective()` 轮询 ——
每帧抛一次错是噪声，一次抛在「这一局怎么建起来的」上是诊断。伤害源前缀和 `feedback` 源
全部改成 `this.id`，所以账本能分开两个首领。

**读数**（`altar-report.json`）：`CH001-03` 刷出 `{ id: 'CH001_ALTAR', name: '祭坛术主', r: 36 }`；
`CH001-01` 刷出 `{ id: 'B001', name: '黄巾巨将', r: 42 }`。两者 hp 都是 `7000 × 时钟 × 3`，
差在**到场分钟**：`CH001-01` 是 270 s ⇒ **25048.0**，`CH001-03` 是 360 s ⇒ **26406.2**。

---

## 3. 三阶段：从数据来，而且**必须是仿射形式**

搬进 `mechanics` 的有四类：`thresholds`、`curve`（六条 `base + phase × perPhase`）、
`radius/width/arc`（每阶段一格）、`adds`（每阶段刷几个身体）。

**为什么不是「每阶段一个预算好的数」**：`.95 - phase * .08` 的浮点结果**不等于**字面量 `0.87`。
把三档预算成 `[.87, .79, .71]` 存进 JSON，会让每一发预警的 `life` 在最后一位上变化，
而 `combat-math-oracle.json` 与 `firstBoss.test.ts` 逐字节钉着出货路径。
**所以数据存的是系数，代码保留算式**：`delay.base - phase * delay.perPhase`。

**读数**（`altar-report.json`，同一台 `CombatSimulation`，逐阶段强制一发）：

| 阶段 | 名 | 招式基础伤害 | 红圈预警伤害（×1.25） | 红圈半径 |
|---|---|---|---|---|
| 1 | 血祭初式 | 20 | 25 | 64 |
| 2 | 焚坛再式 | 25 | 31.25 | 64 |
| 3 | 术主终式 | 30 | 37.5 | 80 |

- 阈值：祭坛 `[.66, .33]`，巨将 `[.70, .35]`。**在 .67 血量上，祭坛还是第 1 阶段，巨将已经是第 2 阶段** ——
  这是「阈值真的从行里来」的可判定证据，不是把文件读回来。
- 形态：终式直线宽 **50**（巨将 54）、锥形射程 **306**（`240 + 3×22`）、张角 **0.68π**（巨将 0.72π）。
- 阶段三刷人：祭坛 **2** 个（首个是精英），巨将 **3** 个。同一段规则，不同的数。

**顺带记录的死数据**：`mechanics.shield`、`mechanics.shrink`、`mechanics.name`、`boss.skills`
**全库零读者**。本片不删（删数据不是本片的活），但它们是下一片可以清掉的东西。

---

## 4. 能不能打完？—— 先标定仪器，再量关卡

TASK 的原话是「只有在能打完时才开」。第一版仪器给出的答案是「打不完」：三个种子分别在
**141.4 / 222.8 / 372.5 s 阵亡**，两个连首领都没见到。这个读数差点被写成结论。

**它错在仪器。** 同一台机器人在**出货关卡 `CH001-01`** 上也死（**226.7 / 229.9 / 303.3 s**）——
一个连出货关卡都打不过的机器人，没有资格判定新关卡「太难」。

所以本片的第一条纪律是**控制臂**：先把同一套策略跑通 `CH001-01`，再拿它量 `CH001-03`。
修好之后（真·单位向量绕行 + 读预警 + 守中带攻）：

| 臂 | 关卡 | 15 | 7 | 99 | 结果 |
|---|---|---|---|---|---|
| **hunt**（参考玩家） | `CH001-01` | 357.67 s / 264.7 hp | 322.22 s / **59.0 hp** | 328.83 s / **16.6 hp** | **3/3 胜** |
| **hunt** | `CH001-03` | 410.25 s / 234.2 hp | 402.32 s / 193.8 hp | 401.50 s / 82.3 hp | **3/3 胜** |
| **corner**（守一角） | `CH001-03` | 395.07 s 阵亡 | 423.18 s / 103.9 hp | 397.95 s 阵亡 | **1/3 胜** |

- 祭坛三胜：等级 19/20/20，击杀 620/617/622，**两道精英检验都清完**（`checked 2`），
  首领击杀于 **409.02 / 401.08 / 400.27 s**，胜利结算于 410.25 / 402.32 / 401.50。
- `validateChapterFinal` 对三份真实战报**全部接受**，`bossDefeated`/`bossLootClaimed`/`elitesChecked: 2` 齐全。
- 超时臂：`time = 480`、`elitesChecked 0`、`bossDefeated false`，同样被接受。
- **`hunt 3/3` 与 `corner 1/3` 的差不是关卡的差，是走位的差。** 这一条是本片最贵的教训：
  同一关卡、同一种子，换个「怎么动」就从「太难」变成「能过」。断言写成**关系**（`hunt > corner`），
  不钉 `corner` 的具体胜场 —— 那会随任何合法平衡改动翻转。

**于是 `CH001-03` 打开了。** `OPEN_STAGES` 加一行，是这一步的最后一步，不是第一步。

---

## 5. 重基线（逐条，旧数在新数旁边）

| 位置 | 旧 | 新 | 为什么 |
|---|---|---|---|
| `firstBoss.json` | `{boss, mechanics, pool}` | `{bosses:{B001, CH001_ALTAR}, pool}` | 一个 id 一行；`B001` 的**每个值逐字节不变** |
| `FirstBoss` | `id:'B001'`、`config.boss.*`、九个 `phase` 字面量 | `this.id`、`this.row.*`、六条 `curve` + 三张每阶段表 | 查表 + 三阶段从数据来 |
| `firstStage.rule.bossId` | **零读者** | 出货路径的默认 id | 死字段转正 |
| `OPEN_STAGES` | `[01, 02]` | `[01, 02, 03]` | 祭坛被证明可完成 |
| `chapterStages` | 无结算文案 | 每行 `clear`/`timeout` | 「破围成功」对「祭坛决战」是错的 |
| `UiStage` | 4 字段 | 6 字段 | 同上；`seals.test.ts` 的字面量随之更新 |
| `seals.test.ts` | 「`CH001-03` 保持关闭」 | 「`CH001-03` 已开，且它有首领没界碑」 | 政策变了 |
| `contracts.test.ts` | 拒绝 `stageId:'CH001-03'` | 接受并拿回第三行 | 同上 |
| `eliteChecks.test.ts` | 「**不可达**，所以不测」 | 「一检被拒、二检通过、三检超上限」 | D26 记的那半**现在可达** |
| `bossThreat.test.ts` | `firstBoss.mechanics.skills` | `firstBoss.bosses.B001.mechanics.skills` | 路径变了，值没变 |
| 账本 | 270 | **271**（滚动 35 → 36） | 新增 `altar-report.json` |

**出货路径逐字节不变**：`firstBoss.test.ts`（遗留预言机）在改动后**首跑即绿**；
`bossThreat.test.ts` 的 `rawOf` 把 `11 + phase*3` / `13 + phase*4` 写成**独立的重算**，
它现在同时是「`B001` 这一行仍然等于出货算式」的断言 —— 谁动了 `B001` 的曲线，它会红。

---

## 6. 没有被验证的

- **没有 Playwright**。祭坛的圈、预警、`elite-route` 面板、结算标题的**画面**都没被看见。
  被断言的是**渲染器读的字段**：`renderState()` / `snapshot()` 的同一个对象。
- 480 s 的**时限**只被 `sim.time = duration - FRAME` 驱动验证过（这是 TASK 允许的做法），
  不是被真打了八分钟验证的。**真实战报里最早的一次胜利是 401.50 s**，离 480 还有 78 s。
- 机器人不是玩家：它不换位、不留技能、不挑路线。三胜的 hp 余量是 234/194/82，
  `CH001-01` 上只有 264.7/**59.0**/**16.6** —— **出货关卡本身也是擦边过的**。
- **祭坛术主用的是巨将的贴图**。`mountBattle.ts:47` 只载入 `art/boss-b001.svg` 并注册成 `'boss'`，
  `BossView.draw(boss, telegraphs)` 按**位置**画，不按 `boss.id` 选图；`chapterAssets` 里也只有
  `B001-BODY` 一行。所以新首领**长得和旧的一样** —— 这是美术缺口（`R3-A`，排除），不是逻辑缺口，
  但它意味着「换了 id」在屏幕上**看不出来**，只能从 HUD 的名字和招式名看出来。

## 7. 已知边界

- `CH001_ALTAR` 的数值是**我定的**，没有外部依据：它比巨将「略凶」（伤害 20/25/30 vs 17/21/25，
  冷却 2.7 vs 3.0），但三胜说明这个方向没有过头。**这不是平衡结论，是一份可打的数据。**
- 章节线在 UI 上**仍然不可达**（`App.vue:61` 从不传 `:chapter`），入口归 `R3-U06`。
  本片让第三关「可构造且可完成」，**没有**让它「可点」。
- `boss.skills` / `mechanics.shield` / `mechanics.shrink` / `mechanics.name` 仍是死字段。
- `bossThreat.test.ts` 的 `slice(5)` 仍把 id 长度写死。它只在 `B001` 上跑，所以今天不会错，
  但下一个改 `firstStage.bossId` 的人会被它静默误导。

---

## 8. 门禁与增量

- `vue-tsc --noEmit` clean。
- 子集（chapter + game + firstBoss + bossLifecycle + GameCore）：**16 文件 / 410 用例全绿**。
- 账本：`npm run ledger:write` → **271 行**（270 → 271）；`npm run ledger:verify` → **`LEDGER OK`**
  （tree 271 = ledger 271、滚动 36、missing/stale/moved/extra **全 0**）。全量跑完会重写滚动报告，
  所以账本在**全量之后**又刷了一次，`git diff --numstat` 是 **+3 / -2** = 净 +1 行 + 两处滚动哈希。
- **全量：54 files / 1569 tests、1716.81 s、EXIT=0、全绿。**

**增量逐项**：`1569 - 1557 = 12` = `altar.test.ts` 的 **13** 个 `it` **减** `contracts.test.ts` 拒绝表里
删掉的 **1** 行（`it.each` 的 `{ stageId: 'CH001-03' }`，它现在会被接受）；文件数 `54 - 53 = 1` =
新增的那一个文件 ⇒ **没有探针存活**。

### 第一次全量报 12 个用例，第二次报 13 —— 根因是采集快照

首轮全量（1678.20 s）里写的是 `altar.test.ts (12 tests)`，而单跑报 **13 passed**。这不是 vitest 的
显示差，也不是有 `it` 被吞掉：**那次全量在 `01:00:19` 启动，`altar.test.ts` 的 mtime 是 `01:00:33`**
—— 守一角的对照臂是在采集之后才写进去的。两条算术互相印证：`1568 + 1 = 1569`，且复跑里那个
`describe` 从 `(3)` 变成 `(4)`。

于是本片多出两条纪律：

1. **「首轮全绿」也可能是过期绿。** 全量要 28 分钟，期间改测试文件不会被重新采集。判据不是
   「它绿了」，而是「它的 mtime 早于采集时刻」—— 跑全量前先对这片改过的文件跑一次
   `ls -l --time-style=full-iso`。
2. **`ledger:write` 不在 `apps/mobile-next`。** 脚本在**仓库根** `package.json`
   （`node tasks/game-remediation/byte-ledger.mjs --write`），在子包里跑得到的是 `Missing script`。
   我先用手写脚本算出 271 行（与官方脚本结果逐项一致：新增 1、删除 0、漂移 2 且两份都是滚动），
   再用官方命令重写 —— **手写脚本能算对，不代表它就是那条命令**。
