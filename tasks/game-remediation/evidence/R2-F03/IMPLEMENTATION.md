# R2-F03 —— `frostflame`（霜焰剑皇 H001）四压力场景行为验证

**结论：行为与文案逐条吻合，零生产改动。** 这是十形态里的第三个，也是**第一个双元素形态** ——
冰与火两条通道同时跑，GDD 把它卖成「组合冰火羁绊」。前两片都测不到这件事。

仪器 `src/core/formPressure.test.ts` 现在共 **19 测试**（bulwark 5 + frostlord 7 + frostflame 7）。
读数冻结在 `evidence/R2-F03/frostflame-pressure.json`；
**`bulwark` 与 `frostlord` 的 8 格数字经复核逐位未变**（见 §7）。

> ⚠ 本目录的 `frostflame-pressure.json` **每次运行都会被覆写**。正文里的绝对值读在
> `threat-v2` + `paced`、600 帧、rank 1/2 这一组参数上。

---

## 0. 前提核实（Scope 0）

| 前提 | 核实方式 | 结果 |
|---|---|---|
| 行为已实现 | `EvolutionCombat.ts:30-33`（普攻）、`:65-67`（技能）、`:86-88`（必杀） | ✅ 成立 |
| 普攻 = 霜环 **+** 火刃 | `frost('G5_FROST_BASIC', p, rank2?155:125, p.atk*.55, 1.2)` 之后 `projectile('G5_FIRE_BASIC', p, heroAim(), 440, p.atk*.8, 7, {pierce: rank2?3:1})` | ✅ 成立 |
| 技能 = 霜环 **+** 火域 | `frost('G5_FROST_E', p, rank2?220:180, p.atk*.6, 2)` 之后 `field('G5_FIRE_E', p, rank2?180:130, p.atk*.3, rank2?5:3)` | ✅ 成立 |
| 必杀 = 霜爆 + 火爆 | `frost('G5_FROST_R', p, 260, p.atk*2, 3)` + `explosion('G5_FIRE_R', p, 260, p.atk*4)` | ✅ 成立（**两者都是瞬时，不留场**） |
| **火域是静止的** | `field()`（`CombatSimulation:368`）把 `point.x/y` **拷进**结构；`G5_FIRE_E` 不传第 6 参 `follow` | ✅ 成立（§2 行为 3 用坐标读数证明） |
| **火域不减速** | `updateFields:481` 只在 `field.chill` 为真时上 `chilledUntil`；`G5_FIRE_E` 不传 `chill` | ✅ 成立（`field.chill === undefined`） |
| 两通道元素分离 | `sourceElement`：`G5_FROST*`→`frost`、`G5_FIRE*`→`fire`；`skillModifier` 按元素吃不同被动 | ✅ 成立 |
| `thermalshock` ×1.3 | `incomingEnemyDamage`（`:105-108`）在 `hit()`（`CombatSimulation:226`）里乘 | ✅ 成立（§3 实测 **1.300000**） |
| **首领对羁绊也免疫** | `hitBoss()`（`:215-223`）**不调用** `incomingEnemyDamage` ⇒ 首领既不被减速、也不吃 ×1.3 | ✅ 成立（**无显式判断**，靠调用点） |
| 已有测试覆盖 | **`src/core/frostFlame.test.ts` 已有 9 条单元测试**（含羁绊、首领、冰火修正分离） | ⚠️ **前提与 F01/F02 不同**（见下） |
| `evolutionCombat.test.ts` 的形态 `if` 链 | 遍历十一形态，但专属断言只覆盖 legion/void/phoenix/bulwark/dragon/reaper | ❌ 本形态**无专属断言** |

### 与 F01/F02 的前提差异（必须记下来）

`frostlord` 的前提是「行为从未被测」。**`frostflame` 不是** —— `frostFlame.test.ts` 已经测了
普攻/技能/必杀的**单元行为**、`thermalshock` 的**逐源伤害差**、以及「首领不触发」。

所以本片的价值**不在单元层**，而在三件单元测试做不到的事：

1. **四压力场景下**（敌群/远程/精英/首领）、**发货规则下**（`threat-v2` + `paced`）的读数；
2. **双通道在真实战斗里各自贡献多少**（单元测试只对 100000 HP 假人比 `damageBy` 差）；
3. **羁绊作为单一开关**：单元测试断言「有羁绊比没羁绊多」，本片断言**倍率是 1.3**，
   且**霜通道逐位不变**（见 §3）—— 那才是「只乘火」这句话的可证伪形式。

---

## 1. 仪器

与 F01/F02 同一套骨架（`threat-v2` + `paced`：形态闸门 **Lv.10**、觉醒 **Lv.19 + 任一主动技 Lv.3**；
harness 自己按技能；关宠物；每帧丢弃导演自刷的怪；包装 `hurt` 同读护盾）。本片新增三处：

| 改动 | 为什么 |
|---|---|
| `FormSpec.kit` 从三元组改成**扁平列表**，新增 `basic: readonly string[]` | 双元素形态**每个行为产生两个来源**；塞进一个槽会藏掉一条通道 |
| `run(..., { silence: true })` + `silenceAutoCast()` | 见下 |
| 遥测沿用 `chilledEver` / `chilledSeconds` / `bossChilled` / `fieldMax` | 同 F02 |

### 仪器发现：`action('skill')` 是**两件事**

在 journey 局里按技能键会**同时**触发 R1g-7 的手动术式：

```ts
// CombatSimulation.ts:266-273
if (this.journeyCombat && action !== 'dodge') {
  const done = this.journeyCombat.action(action);   // ← 形态 kit
  if (done && action === 'skill') this.releaseManual();  // ← 额外释放手动术式（×6 攻击，键名带 `_E`）
  return done;
}
```

`releaseManual()` → `progression.manualSkill()` → **`build.active` 里等级最高的已拥有主动技**。
F01/F02 没撞上，是因为它们**不拥有任何技能** ⇒ `manualSkill()` 返回 `undefined` ⇒ 提前 return。
本片必须拥有 `G2_FROST`（冰）+ 一个炎系技才能开羁绊，于是手动轨道出现了。

**后果与修法**：如果两臂拥有的技能不同，`manualSkill()` 会解析到**不同的技能**
（`{G2_FROST:1}` → `G2_FROST`；`{A011:1,G2_FROST:1}` → `A011`）—— 那「单一开关」其实是两个开关。
本片两臂都拥有 `A011`（`A011` 在 `build.active` 里排第二、`G2_FROST` 排最后，同等级时先命中 `A011`），
所以手动轨道**逐位一致**，羁绊是唯一差别。另用 `silenceAutoCast()` 把自动施放的 `cool` 钉死，
免得拥有的炎系技在自动轨道上再加一个火源。

---

## 2. 四行为 × 四场景 × 两阶（8 格读数）

`maxHp = 762.91`；**本形态不给护盾**（八格 `shieldPeak` 全 0）；火域（**静止**）r = **130 / 180**、life = **3s / 5s**。

| 场景 | 阶 | 造成伤害 | 其中普攻 | HP 承伤 | `hpMin` | 火域 r/life | 曾减速 | 击杀 | Boss 掉血 |
|---|---|---|---|---|---|---|---|---|---|
| 敌群 12×EN001 @120px | 1 | 1310.78（**全 `G5_FROST_E`**） | **0** | 0 | 1.000 | 130 / 3 | **0** | 12/12 | — |
| | 2 | 1310.78 | 0 | 0 | 1.000 | **180 / 5** | 0 | 12/12 | — |
| 远程 6×EN002 @520px | 1 | **1457.41**（**全 `G5_FIRE_BASIC`**） | 1457.41 | **82.47** | **0.893** | 130 / 3 | 0 | **6/6** | — |
| | 2 | 1457.41 | 1457.41 | 82.47 | 0.893 | 180 / 5 | 0 | 6/6 | — |
| 精英 1×EN006（elite）@120px | 1 | 816.62 | 343.03 | 0 | 1.000 | 130 / 3 | 1 | 1/1 | — |
| | 2 | 816.62 | 343.03 | 0 | 1.000 | 180 / 5 | 1 | 1/1 | — |
| 首领 B001 @90px | 1 | **4763.16** | 3087.28 | 0 | 1.000 | 130 / 3 | 0 | — | **4763.16** |
| | 2 | **5418.99** | 3087.28 | 0 | 1.000 | 180 / 5 | 0 | — | **5418.99** |

分源明细（rank 1）：精英 = 霜环 109.23 + 火域 364.35 + 霜普攻 100.13 + 火刃 242.90；
首领 = 霜环 218.46 + 火域 1457.41 + 霜普攻 901.16 + 火刃 2186.12。

### 行为逐条

1. **普攻是「霜环 + 火刃」两件**：单测里 8 只 @(r−10) 被一次 `basic()` 全部打伤**并全部被减速**
   （`chilledUntil = time + 1.2`），圈外那只（r+4）既不掉血也不被减速；**同时**只射出**一发**
   `G5_FIRE_BASIC`（`pierce` = 1/3、`dmg = atk × .8`、`vx = 440`）。
2. **火刃真的穿透**：把 5 只排成 +x 直线（220/280/340/400/460px，**全在霜环半径之外**），
   只按一次 `basic()`，跑 90 帧（1.5s，**短于自动普攻的最小间隔 1.667s**，所以计数只归火刃）：
   **rank 1 打中 2 只、rank 2 打中 4 只**。`updateProjectiles` 每次命中减 `pierce`、归零后移除
   ⇒ `pierce: n` 打 **n+1** 个目标。**这是行为，不是构造参数。**
3. **技能 = 霜环 + 静止火域**：霜环半径 **180 / 220**（减速 **2s**，比普攻的 1.2s 长），
   火域 r **130 / 180**、life **3s / 5s**、`follow === false`、`chill === undefined`。
   把玩家挪 260/180px 后**火域坐标逐位不变**（与玩家的距离 > 300px）——
   对照 `bulwark` / `frostlord` 的火域/寒域是 `follow: true`，移动后坐标逐位跟到玩家身上。
4. **觉醒在首领格有效**：火域 life 3s → 5s，10 秒窗口内两次施放 ⇒ **4763.16 → 5418.99（+13.77%）**。
   `fieldR` 130→180、`fieldMax` 3→5 在**四个场景**里都成立。

---

## 3. 单一开关对照：`thermalshock` 羁绊（×1.3）

两臂**都拥有 `A011`**（手动轨道一致），只差 `G2_FROST`（冰标签）⇒ 羁绊开/关。

| 格（rank 1，技能照按） | 火通道 | 霜通道 | `kitDealt` | `casts` |
|---|---|---|---|---|
| 精英（**羁绊开**） | **118.41** | 109.23 | 227.65 | 2 |
| 精英（**羁绊关**） | **91.09** | 109.23 | 200.32 | 2 |
| 首领（羁绊开） | 3643.53 | 1119.62 | 4763.16 | 2 |
| 首领（羁绊关） | 3643.53 | 1119.62 | **4763.16** | 2 |

- **精英格：火通道 118.41 / 91.09 = 1.300000**（`toBeCloseTo(1.3, 3)` 已钉成断言），
  **霜通道逐位相同**（`toBe`，不是 `toBeCloseTo`）⇒ 「只乘火」这句话是可证伪的，不是叙述。
- **首领格：两臂逐位相同**（`kitDealt` 4763.1553 两臂相等）。这正是
  `hitBoss` 不调用 `incomingEnemyDamage` 的读数形式：**开关打开，什么都没动。**
- **敌群与远程两格到不了羁绊**：敌群在技能霜环的施放帧就被清空（`chilledEver = 0`），
  远程线**从不被减速**（`chilledEver = 0`，见 §4）⇒ 没有「被减速的敌人」可以乘。

另有一条**身份级**的独立测量（不按技能、只按普攻，`silenceAutoCast` 关掉自动轨道）：
同一个被冻住的假人上，`G5_FIRE_BASIC` 开/关羁绊的比值 = **1.3**，
`G5_FROST_BASIC` **逐位不变**。

---

## 4. 与 F01 / F02 的对照：同一个远程格，三种形态

| 形态 | 远程格 造成伤害 | 击杀 | HP 承伤 | `hpMin` | 原因 |
|---|---|---|---|---|---|
| `bulwark` | **0** | 0/6 | **0** | 1.000 | kit 最长 210px；**护盾花 241.92 全吃下** |
| `frostlord` | **0** | 0/6 | **164.95** | 0.784 | kit 最长 200px；**不给护盾** |
| `frostflame` | **1457.41** | **6/6** | **82.47** | **0.893** | **火刃飞 440px/s × 2s = 880px，够得着** |

**`frostflame` 是第一个打得着 520px 远程线的形态。** 它的火刃在 t = 2.03s 首次命中，
之后每秒清掉一个（`firstHitAt` = 2.03 / 3.03 / 4.03 / 5.03 / 6.03 / 7.02）。
「够得着」的直接后果是**承伤只有 `frostlord` 的一半**（82.47 vs 164.95）——
不是因为它更耐打，而是因为**线被打死了**（6/6）。而它**没有护盾**，
所以这 82.47 全部落在血条上（`takenBy.hostile-projectile = 82.47`、`absorbed = 0`）。

---

## 5. 规则发现（都进队列，不在本切片改）

### 5.1 `action('skill')` 是两件事 —— 手动术式搭车（仪器发现，见 §1）

在 journey 局里按技能键 = **形态 kit + R1g-7 的手动术式**（×6 攻击、键名带 `_E`）。
`manualSkill()` 取 `build.active` 里等级最高的已拥有主动技 ⇒ **拥有的技能一变，搭车的那一招就变**。
任何「靠拥有技能来开开关」的 harness 都必须把两臂的 `manualSkill()` 对齐，否则单一开关是两个开关。
（本片两臂都拥有 `A011` 正是为此。）

### 5.2 火域**不减速**，霜环才减速 —— 减速只挂在 `field.chill` 上

`updateFields`（`CombatSimulation:479-481`）先 `filter` 成快照，然后：

```ts
this.hit(enemy, field.dmg, field.id, false, true, field.manual);
if (this.journeyCombat && field.chill) enemy.chilledUntil = Math.max(...);
```

`chill` 只有 `frostField()`（`EvolutionCombat:144`）会传。`frostflame` 的 `G5_FIRE_E`
走的是裸 `s.field(...)` ⇒ **`field.chill === undefined` ⇒ 火域只掉血、不上减速**。
实测：把目标放在火域里直到被烧死，`chilledUntil` 始终小于 `sim.time`（施放时霜环给的 2s 早已过期）。
文案「技能先降霜、再留下火域」是对的，但**「火域」这一半不提供减速**——
减速全部来自施放帧那一次霜环。

### 5.3 霜环「只减速它没打死的」次序被 `frostflame` 继承

R2-F02 §5.1 在 `frostlord` 上发现：`frost()` 先 `explosion` 后遍历 `s.enemies` 设减速，
而 `hit()` 会把死者 `splice` 出去（`CombatSimulation:237`）⇒ **霜环不减速被它一击清掉的敌人**。
`frostflame` 的**普攻与必杀都复用 `frost()`**（`:31`、`:87`），本片**核实了继承成立**，而不是假设：

- 敌群格 12 只 EN001 被技能霜环在施放帧全清 ⇒ `chilledEver = 0`、`basicDealt = 0`
  （清空后 `nearest()` 为空，自动普攻一次都没挥出）。
- 单测里 1 只 EN001 被普攻霜环一击清掉 ⇒ `chilledUntil` 保持 `undefined`。

### 5.4 首领是**双免疫**，而且两条都是「调用点」给的

| 免疫 | 由什么给出 |
|---|---|
| 减速 | `frost()` / `updateFields()` 只遍历 `sim.enemies`；Boss 是 `sim.boss` |
| `thermalshock` ×1.3 | `incomingEnemyDamage` 只在 `hit()`（`:226`）被调用；`hitBoss()` 不调用 |

两处都**没有一行显式判断**。`skillDetails.G2_FROST` 写的「首领免疫减速」与实现一致，
但它是**副作用而非契约**。仪器里钉成两条可证伪断言：①同一发霜环下，旁边 110px 的普通敌人
被减速、Boss 不；②羁绊两臂在 Boss 格**逐位相同**。

---

## 6. 文案对账（Scope 5）

`evolutionCatalog.ts:25`：

- `detail: '霜环减速后射出穿透火刃；技能先降霜、再留下火域。引导寒霜环成长，组合冰火羁绊。'`
  - 霜环减速 → 射出火刃 ✅（`basic()` 里 `frost` 在前、`projectile` 在后）
  - 穿透火刃 ✅（pierce 1/3；行为实测打中 2 / 4 个目标）
  - 技能先降霜、再留下火域 ✅（`EvolutionCombat.ts:66-67` 的次序；同一帧内霜环先结算）
    —— 但见 §5.2：**「火域」这一半不提供减速**
  - 引导寒霜环成长 ✅（`signatureSkills.frostflame = 'G2_FROST'`、`journeySkillNames.G2_FROST = '寒霜环'`）
  - 组合冰火羁绊 ✅（`thermalshock` = 冰 + 炎；实测 ×1.300000）
- `awakening: '扩大霜环与剑域，火刃穿透提升至三次，火域延长至五秒。'`
  - 扩大霜环 ✅（普攻 125→155、技能 180→220）
  - 扩大剑域（= 火域）✅（130→180）
  - 火刃穿透提升至三次 ✅（1→3）
  - 火域延长至五秒 ✅（3→5）

**无漂移，零改动。** 唯一需要读者注意的措辞是 `detail` 里的「霜环减速敌群」——
按 §5.3，对**能被霜环一击清掉**的敌群它不成立（`frostlord` 与 `frostflame` 同病）。
这条已在 R2-F02 记录并进队列，本片只是**再确认一次它被继承**。

---

## 7. 文件变更

| 文件 | 变更 |
|---|---|
| `apps/mobile-next/src/core/formPressure.test.ts` | `FormSpec.kit` 改扁平列表 + 新增 `basic`；新增 `silenceAutoCast()` 与 `run({silence})`；新增 R2-F03 的 2 个 `describe`（+7 测试，19 总计） |
| `tasks/game-remediation/evidence/R2-F03/frostflame-pressure.json` | **新增**（本形态读数，每次运行被重写） |
| `tasks/game-remediation/evidence/R2-F01/form-pressure.json` | 被重写（同一棵树 ⇒ **8 格数字逐位未变**：1821.77 / 241.92 / 1001.97 / 6710.17、`shieldPeak` 122.07/183.10、`fieldR` 170/210） |
| `tasks/game-remediation/evidence/R2-F02/frost-pressure.json` | 被重写（同一棵树 ⇒ **8 格数字逐位未变**：1223.39 / 164.95 / 720.93 / 2454.07→2821.09、`fieldR` 160/200、`fieldMax` 3/5） |
| 生产代码 | **无** |

**泛化的回归证据**：加 `frostflame` 之前先跑一遍 `bulwark`/`frostlord` 的报告，加完再跑一遍，
**逐位比对**（上表括号里的数字）。这条现在是加形态的固定动作。

---

## 8. 门禁

见 `handoff/STATE.md` 的 Tests 字段。本切片无生产改动 ⇒ 不触碰 `legacy` 路径、不触碰预言机。
