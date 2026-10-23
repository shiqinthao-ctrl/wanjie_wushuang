# R3-E01..07 —— 五普通敌人 + 两精英（Scope 0：前提半假，零生产改动）

切片：`QUEUE.md` #10 / `TASK.md`。基准：R2-D（D21）。
**本片零生产改动**：只新增一个 harness 与一份滚动报告。

harness `apps/mobile-next/src/core/enemyRoles.test.ts`（**8 个 `it`、40 ms**）→
`evidence/R3-E/ai-report.json`。

---

## 0. 前提核实（命令产出，不是读格名）

队列行写的是「其余**五**普通敌人、**两**精英逐个完善 - 职责、预警、独立外观」。
把它逐项拆开，**三项里有两项半不成立**：

### 0.1 「五普通敌人」：其中三个**从未出场**

`firstStage.rule.storyEncounter.enemies` 就是首关的出生池，**只有三行**：

```
[["EN001", 5], ["EN002", 3], ["EN003", 1]]
```

而 `stage.enemies` 里 `map === 'ST001'` 的有**六行**：`EN001..EN006`。
多出来的 `EN004`（黄巾骑兵 `charge`）、`EN005`（火箭兵 `aoe_ranged`）、
`EN006`（黄巾力士 `brute`）**声明了 ST001，却不在任何波次里**
（`waves` 只有 0/60/150/270/360 五个节点，`enemies` 池是上面那三行）。

⇒ 它们只能通过**显式 `spawn({ id })`** 出现，而全库**没有调用方**传 `id`。
**三行是死数据。** `it('reads the roster: three of the six ST001 rows are never fielded')` 钉住这一点。

### 0.2 「职责」：出场的那三个有两个有，没出场的三个全都没有

`it` 用 `createEnemy`（生产构造器）造一个敌人，放在离玩家 250 px 处，
用 `beginFrame` 推 20 帧，读它**实际移动了多少**，再除以 `speed × dt` ——
这个归一化位移**就是 `enemyAI` 选的那个 `move` 乘数**，不同速度的敌人可以直接比。

| 敌人 | `ai` | 出场 | 权重 | 归一化位移 | 5 秒内射击 | `r` |
| --- | --- | --- | --- | --- | --- | --- |
| EN001 黄巾步卒 | `melee` | ✅ | 5 | **1.00** | 0 | 10 |
| EN002 黄巾弓手 | `ranged` | ✅ | 3 | **0**（250px 处驻停） | **3** | 10 |
| EN003 黄巾盾兵 | `shield` | ✅ | 1 | **0.65** | 0 | **14** |
| EN004 黄巾骑兵 | `charge` | ❌ | 0 | **1.00** | 0 | 10 |
| EN005 火箭兵 | `aoe_ranged` | ❌ | 0 | **1.00** | **0** | 10 |
| EN006 黄巾力士 | `brute` | ❌ | 0 | **1.00** | 0 | **14** |

- **`ranged` 的走位是完整的**：350 px 收近 `.6`、250 px 驻停 `0`、150 px 后退 `−.5`（两个阈值 300/190），
  并且 `attack > 1.8` 时射出弹道（5 秒 3 发）。
- **`shield` 只有一个 `.65` 移速**（外加 `r + 4`）。
- **`charge`、`aoe_ranged` 在生产里没有任何读者**：两者都按 `move = 1` 直走，
  和 `melee` **逐帧相同**；`aoe_ranged` 在 200 px 处**5 秒 0 发**。
- **`brute` 只买到 `r + 4`**，走位与 `melee` 逐帧相同。
- `charge` 的「没有冲刺」不是靠求和断言的：`it` 断言**每一帧的步长完全相同**
  （`max − min < 1e-9`）—— 冲刺会表现为某一帧是走路的整数倍。

⇒ 「五普通敌人」的真身是：**两个已经做好、但没进池；三个既没进池、也没实现**。
队列把「没实现」和「没出场」写成了同一个数字 5。

### 0.3 「预警」：**敌人一个都没有**

`it('pins that no enemy carries a telegraph field …')`：

- `Object.keys(enemy)` 里没有任何键匹配 `/warn|windup|telegraph|cast/`；
- 场上只有敌人时，`sim.bossEncounter.telegraphs` **恒为空**；
- 弓手的弹道是**同帧发出**的：`attack > 1.8` 的判断里直接 `enemyShots.push(...)`，
  中间没有前摇、没有地面标记。

⇒ **预警系统只属于 Boss**（`FirstBoss.ts` 的 `Telegraph` / `insideTelegraph`）。
六个普通敌人共享的是「走到身上就掉血」这一种交互。

### 0.4 「两精英」：**没有对应的行**

`it('pins what an elite is …')`：`stage.enemies` 的 **20 行全是普通敌人**
（没有一行带 `elite` 或 `affixes` 字段）。`elite` 是 `createEnemy` 的一个**开关**：

| 精英化带来的 | 值 |
| --- | --- |
| `hp` | × 3.25 |
| `damage` | × 1.38 |
| `r` | × 1.25 |
| `color` | 固定 `#d5a254` |
| `affixes` | **1 条**；`state.time > 960` 或 `nightmare` 时 **2 条** |

数据里唯一的「两」是**词缀条数**（`slice(0, 2)`），不是两个精英敌人。
波次表里的 `type: 'elite'`（150 s，`elite: 0.85`）只是一个**概率**。
⇒ 队列的「两精英」最可能的意思是**带两条词缀的精英**，不是一个新的敌人行。
**这一点必须由设计确认**，本片不替它选。

### 0.5 「独立外观」：数据里做不到（且属美术，按指令排除）

敌人的**身体颜色不是数据字段**：`mountBattle.ts:151` 是一个写死的三路开关
（精英金 `0xd5a254` / 远程棕 `0x9b735b` / 其余灰 `0x6e737c`），**不读 `enemy.color`**。
`enemy.color` 唯一的生产读者是 `CombatSimulation:318` 的**敌方弹道颜色**。
所以「六种独立外观」在当前渲染器里**没有数据通道** —— 它要么是改渲染器，要么是美术资产，
两者都不在本片（用户指令排除美术）。

---

## 1. 裁定（`DECISIONS.md` D22）

**本片零生产改动。** 队列这一行的前提是**半假**的，而真的那一半（把三个死行接进波次 +
实现 `charge`/`aoe_ranged` + 开一条敌人预警通道）是一次**改变出货档（`threat-v2`）的规则改动**：

- 一旦 `EN004..EN006` 进池，**敌群构成**就变了 ⇒ `manual-report.json`、`growth-report.json`、
  `build-report.json`、四份 `R2-F-*` 压力格报告、`firstCombat`/`bossThreat` 的承伤读数**全部作废**；
- 实现 `charge`/`aoe_ranged` 还要给 `Enemy` 加字段（前摇、冲刺相位）并让渲染器读它 ——
  没有 Playwright 时**画面无法本地验证**。

所以本片把它**拆成三行**写回队列（见 `QUEUE.md` #10 的完成段）：
`R3-E01..07a`（数据接池 + 两个空 `ai` 的实现 + 一条敌人预警通道，**带显式重基线清单**）、
`R3-E01..07b`（美术，按指令排除）、`R3-E01..07c`（「两精英」的定义确认，**设计决策**，不是工程）。

**为什么不顺手把三行加进池**：那会静默改写十几份已发布的报告，而本片没有重跑它们的预算 ——
「改仪器作废早期标定 ⇒ 显式入队」是 `AGENTS.md` 的规矩。

---

## 2. 交付

- `apps/mobile-next/src/core/enemyRoles.test.ts`（8 `it`）：出生池、逐敌人归一化位移、
  射击计数、无预警字段、精英化读数、报告落盘。
- `evidence/R3-E/ai-report.json`（滚动）：上表 + `jobs.fieldedAndImplemented` /
  `jobs.declaredButNeverFielded` / `telegraphs` / `elites`。
- `DECISIONS.md` D22；`QUEUE.md` #10 完成段 + 三行拆分。

## 3. 门禁

`typecheck` 干净；`enemyRoles.test.ts` **8 passed / 40 ms**；
全量套件（干净树）**49 文件 / 1509 测试全绿（1693.27 s）**；账本 **266 行**（滚动 **31**）`LEDGER OK`；
`smoke` / `audit` / `archive:verify` OK；`context` **8171 / 8192**。
