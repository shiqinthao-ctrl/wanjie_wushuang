# 万界无双 V3.3.5 Agent 开发接管包

更新时间：2026-08-25（Asia/Shanghai）  
工作区：`E:\wanjie_wushuang`  
当前任务：`V3.3.5 Real Human-Play Balance and Combat Feel Acceptance`  
当前判定：**开发与自动回归基线可用；真人验收为 `pending`，不得宣称 V3.3.5 完成。**

> 本文件是接收 Agent 的单文件入口。先按“从这里开始”执行，不要先全库扫描，也不要先调战斗数值。

## 0. 接收 Agent 从这里开始

在 PowerShell 中进入项目，依次执行：

```powershell
Set-Location -LiteralPath 'E:\wanjie_wushuang'
Get-Content -Raw -LiteralPath 'AGENTS.md'
Get-Content -Raw -LiteralPath 'TASK.md'
Get-Content -Raw -LiteralPath 'handoff/STATE.md'
Get-Content -Raw -LiteralPath 'playtest/PROTOCOL.md'
npm run playtest:self-test
node scripts/playtest-validate.mjs playtest/human-acceptance-2026-08-25.json
```

预期最后一条为结构有效但未验收：

```text
PLAYTEST PENDING: keyboard-mouse 0/5, browser-touch 0/5, physical-device-touch 0/5. This is not human acceptance evidence.
```

然后只做以下第一件实际工作：

1. 检查 `8082` 是否已有监听，不终止未知进程。
2. 如无监听，另开一个 PowerShell 终端以 `8082` 启动游戏。
3. 请真实玩家亲自完成键鼠 `ST001-01`。
4. 记录证据并校验；没有真人观察前，不改战斗或难度值。

## 1. 权威来源与读取顺序

按以下优先级解决冲突，前者优先：

1. `AGENTS.md`：仓库级强制约束。
2. `TASK.md`：当前唯一允许执行的任务和完成条件。
3. `handoff/STATE.md`：当前状态、风险和推荐动作。
4. 本接管包：执行顺序和定位导航。
5. `playtest/PROTOCOL.md`：真人证据口径。
6. `playtest/human-acceptance-2026-08-25.json`：本轮实际验收记录。
7. `handoff/PROGRESS-2026-08-25.md`：较详细的进度说明，仅在需要背景时读取。

不要预读或修改 `archive/`、`docs/reference/`。只有出现具体问题且确需历史依据时，先读 `docs/INDEX.md`，再只打开一个最相关参考文件。

## 2. 项目定位

- 类型：可本地运行的纯前端浏览器游戏，不是后台服务。
- 入口：`index.html`。
- 运行方式：有序加载的全局浏览器 JavaScript。
- 样式与运行资源：`assets/`。
- 回归与本地服务：`scripts/`。
- 真人验收记录：`playtest/`，位于生产存档之外。
- 运行依赖：无；开发/校验需要 Node.js `>=18`。
- 本地启动：`npm run dev`，默认只监听本机；通过 `PORT`、`HOST` 控制地址。
- 版本控制：当前目录不是 Git checkout，不要用 `git status` 作为变更或验收依据。

最小目录导航：

```text
E:\wanjie_wushuang\
|- AGENTS.md                 # 仓库约束
|- TASK.md                   # 当前唯一任务
|- index.html                # 页面入口与有序脚本加载
|- assets\                   # 游戏运行代码、样式和资源
|- scripts\                  # 本地服务、静态检查、冒烟、审计、上下文与归档校验
|- playtest\                 # 真人验收协议、模板、日期记录和校验器
|- handoff\                  # 当前状态、进度和本接管包
|- docs\INDEX.md             # 参考资料索引，只在确有需要时进入
|- archive\                  # 历史归档，当前任务禁止读取和修改
```

## 3. 当前已经完成的实现

传统页游式操作发现性已经落地，当前任务不是重新设计操作界面：

- 桌面战斗首屏保留战场和操作区，右侧战况栏独立滚动。
- 桌面操作坞显示“英雄技 / 闪避 / 终极”和 `E / Space / R`。
- 冷却、终极能量、可用状态、禁用状态和无障碍标签实时同步。
- 手机端继续使用全屏摇杆及技能、闪避、终极、互动、暂停控件。
- 此前未改变游戏内容、关卡路线、成长、存档、结算或战斗数值。

关键定位点：

| 文件 | 当前锚点 | 用途 |
| --- | ---: | --- |
| `index.html` | 220 | `battleCommandDock` 桌面操作坞 |
| `assets/css/app.css` | 60 | 桌面操作坞样式 |
| `assets/css/app.css` | 110 | 小屏/手机战斗布局和安全区规则 |
| `assets/js/combat/engine.js` | 237 | `updateDesktopActionsHud()` |
| `scripts/smoke.mjs` | 393 | 操作坞与实时状态静态回归 |
| `scripts/audit.mjs` | 712 | 桌面战斗首屏容纳审计 |
| `scripts/audit.mjs` | 718 | 可见操作名和就绪反馈审计 |
| `scripts/audit.mjs` | 756 | 待完成真人验收包审计 |
| `scripts/playtest-validate.mjs` | 7 | 五条必测路线 |
| `scripts/playtest-validate.mjs` | 14 | 三种必测输入方式 |

行号是 2026-08-25 快照；若文件已变，使用 `rg` 搜索符号，不要按旧行号盲改。

## 4. 当前证据与未完成项

当前验收记录：`playtest/human-acceptance-2026-08-25.json`  
记录状态：`acceptanceStatus: pending`  
运行构建指纹：`sha256-runtime-manifest:43bc4b4005f12f8a0e501b40ec91038d5c29e543bda7133fce62db7c1193b45a`  
当前 `8082`：2026-08-25 交接时没有监听。

| 证据层 | 状态 | 已证明 | 不能据此声称 |
| --- | --- | --- | --- |
| 源码/静态守卫 | 已有 | 桌面操作坞、移动端控件与关键规则存在 | 真人觉得直观、好用 |
| 确定性检查 | 既有基线通过 | 路线、存档、星级、结算、成长和安全规则未回退 | 难度、疲劳、真实手感 |
| 桌面浏览器自动验收 | 已有 | 1280x720 容纳、暂停/焦点、无横向溢出 | 真人键鼠完成 |
| 390x844 模拟回归 | 已有 | 控件可见、在边界内、无重叠 | 真实触控或实体手机证明 |
| `keyboard-mouse` | **0/5** | 无真人路线证据 | 不得标记完成 |
| `browser-touch` | **0/5** | 无真人真实触控证据 | DevTools 模拟不算 |
| `physical-device-touch` | **0/5** | 无实体手机证据 | 模拟器或 390x844 不算 |

自动化、AI 浏览器输入、DevTools 触控模拟、合成校验夹具都只能用于回归，绝不能写成真人或实体设备证据。

## 5. 不可破坏的约束

必须保留：

- Schema30 存档。
- 新章节 0 星、失败 0 星、重玩星级单调不回退。
- 六种非剧情模式不污染剧情星级。
- 每局最多结算一次，Boss 战利品先于结算。
- 重试行为、V3.0 安全修复、有序脚本加载和现有路线。
- V3.3.2 成长、V3.3.3 遭遇、V3.3.4 曲线与测试夹具。
- `ST001-01`：`spawn .88 / hp .90 / dmg .82 / speed .96 / incoming .58 / bossHp 3.00`；除非有可追溯真人证据证明某一项有害。

当前任务禁止：

- 新游戏内容、新依赖、新存档字段、公开 Debug UI。
- 新增 `_vXXOld*` 包装层或全量重写战斗循环。
- 为缩短验收修改正式存档、浏览器存储、解锁条件或战斗数值。
- 把自动化/模拟证据写成真人证据。
- 在 V3.3.5 真人验收关闭前创建或指派 V3.3.6。
- 读取或修改 `archive/`、`docs/reference/`。

优先把改动合并进现有逻辑，只做能被具体观察支持的最小修复。

## 6. 真人验收矩阵

每一种输入方式都必须由真人完成全部五条路线：

| 角色 | 路线 | 胜利条件 |
| --- | --- | --- |
| early-boss | `ST001-01` | 06:00 前击败 B001 并领取战利品 |
| early-normal | `ST001-02` | 生存至 20:00 |
| mid-boss | `ST003-03` | 20:00 前击败 B006 |
| late-normal | `ST004-02` | 生存至 20:00 |
| final-dual-boss | `ST004-03` | 20:00 前依次击败 B009、B010 |

输入方式固定为：

1. `keyboard-mouse`：真人键盘鼠标，不允许脚本代按。
2. `browser-touch`：真人在支持真实触控的浏览器设备操作，不允许 DevTools 触控模拟。
3. `physical-device-touch`：真人在实体 iOS/Android 手机上操作。

每条路线必须填写：

- `outcome`、`attemptCount`、`deathCount`、`retryCount`。
- `completionSeconds`、`healthMarginPercent`。
- 英雄、装备、构筑摘要与 `keyChoices`。
- 八项 1-5 分评分：`movementAim`、`threatClarity`、`hitClarity`、`dodgeResponse`、`skillResponse`、`recoveryFairness`、`buildQuality`、`fatigue`。
- 七类文字观察：移动/瞄准、威胁与命中、闪避与技能、恢复、构筑、死亡/重试、疲劳。
- 至少一个真实 `evidenceRefs`，例如录像文件名、截图文件名或带时间戳的人工观察记录。

实体手机还必须填写：

- 至少 20 分钟持续性能窗口。
- 平均 FPS、最低观测 FPS、测试后热感。
- 设备型号、系统、浏览器、视口。
- 竖屏/横屏、刘海/安全区、双指操作、暂停/恢复可靠性观察。

评分锚点：`1` 表示严重阻碍完成，`3` 表示能完成但问题明显，`5` 表示清晰稳定且无需调整。

## 7. 逐步执行流程

### A. 预检记录

```powershell
npm run playtest:self-test
node scripts/playtest-validate.mjs playtest/human-acceptance-2026-08-25.json
```

普通校验允许 `pending`。此时不要运行 `--require-acceptance` 来制造“失败问题”；证据未齐时退出码 2 是预期行为。

### B. 安全启动隔离服务

先只读检查端口：

```powershell
Get-NetTCPConnection -LocalPort 8082 -State Listen -ErrorAction SilentlyContinue
```

若存在监听，先查明 `OwningProcess`，不要终止未知进程。若无监听，在单独终端运行：

```powershell
Set-Location -LiteralPath 'E:\wanjie_wushuang'
$env:PORT='8082'
npm run dev
```

桌面访问：`http://127.0.0.1:8082/`。

实体手机测试时，电脑与手机必须在可信局域网；临时使用：

```powershell
Set-Location -LiteralPath 'E:\wanjie_wushuang'
$env:HOST='0.0.0.0'
$env:PORT='8082'
npm run dev
```

手机访问 `http://<电脑局域网IPv4>:8082/`。测试完成后在启动服务的终端按 `Ctrl+C` 停止，不要把端口暴露在公共网络。

### C. 先完成一个最小真人闭环

首条路线固定为真人键鼠 `ST001-01`：

1. 让玩家通过正常解锁进入路线；若未来使用夹具，只能是生产存档之外的隔离夹具，并写清来源。
2. 玩家亲自操作，Agent 只能记录，不能代按或用浏览器自动化完成。
3. 立即收集结果、尝试/死亡/重试、时间、血量、英雄装备构筑、八项评分、七类观察和证据引用。
4. 使用 `apply_patch` 只更新日期记录文件；保持 `playtest/session-template.json` 原样 `pending`。
5. 每录入一条路线后立即执行普通校验。

```powershell
node scripts/playtest-validate.mjs playtest/human-acceptance-2026-08-25.json
```

然后依次完成键鼠其余四条路线，再完成真实浏览器触控五条，最后完成实体手机五条。

### D. 修改决策门槛

只有真人在具体输入方式和具体路线中观察到以下问题之一，才可进入代码修改：

- 输入延迟或精度问题。
- 命中反馈、威胁提示或危险预警不清。
- 闪避/技能动作时序不合理。
- 恢复明显不公平。
- 难度出现无意义的过高或过低尖峰。

每次修改必须形成可追溯链：

```text
输入方式 + 路线 + 修改前观察
-> 最小代码/现有参数改动
-> 同路线、同输入方式复验
-> 修改后观察 + 证据引用
```

把决策写入验收记录的 `tuningDecisions`；没有此链路就保持数值不变。受影响路线还要在桌面和 390x844 模拟视口做回归，但模拟回归不能替代真人复验。

### E. 运行文件改动后的构建指纹

只要 `index.html` 或 `assets/` 下任何运行文件发生变化，就不能继续沿用旧指纹。用以下命令复算，更新日期验收记录，并明确哪些真人证据属于修改前、哪些属于修改后：

```powershell
$runtimeFiles = @()
$runtimeFiles += Get-Item -LiteralPath 'index.html'
$runtimeFiles += Get-ChildItem -LiteralPath 'assets' -Recurse -File
$runtimeFiles = $runtimeFiles | Sort-Object FullName
$manifest = ($runtimeFiles | ForEach-Object {
  $relative = [System.IO.Path]::GetRelativePath((Get-Location).Path, $_.FullName).Replace('\','/')
  $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $_.FullName).Hash.ToLowerInvariant()
  "$relative=$hash"
}) -join "`n"
$bytes = [System.Text.Encoding]::UTF8.GetBytes($manifest)
$algo = [System.Security.Cryptography.SHA256]::Create()
try {
  $fingerprint = [System.BitConverter]::ToString($algo.ComputeHash($bytes)).Replace('-','').ToLowerInvariant()
} finally {
  $algo.Dispose()
}
"sha256-runtime-manifest:$fingerprint"
"files=$($runtimeFiles.Count)"
```

当前期望为 24 个运行文件和本文件第 4 节所列指纹。若未主动修改运行文件却不一致，先停下并查明并发变化。

## 8. 校验与完成门槛

开发中：

```powershell
npm run playtest:self-test
node scripts/playtest-validate.mjs playtest/human-acceptance-2026-08-25.json
```

只有 15 个真人路线槽位都有合法证据、人工复核无误并把 `acceptanceStatus` 改为 `complete` 后，才运行严格验收：

```powershell
node scripts/playtest-validate.mjs playtest/human-acceptance-2026-08-25.json --require-acceptance
```

任务提交前必须在所有编辑完成后运行原样的五项门禁：

```powershell
npm run check && npm run smoke && npm run audit && npm run context && npm run archive:verify
```

完成定义必须同时满足：

- 三类输入各有一个干净的 `completed` session，且各完成五条路线。
- 每条路线都是 `victory`，时间上限、统计、构筑、八项评分、七类观察和证据引用完整。
- 实体手机的 20 分钟、FPS、热感、安全区、旋转、多指和暂停/恢复记录完整。
- 所有调参均有修改前/后同路线真人证据。
- `--require-acceptance` 退出码为 0。
- 五项项目门禁全部退出码为 0。
- `handoff/STATE.md` 只替换规定的五个字段。

## 9. `handoff/STATE.md` 更新规则

任务结束时只替换以下五节，不改 Baseline、Critical invariants、Current architecture debt 或 Current task：

1. `Last completed`
2. `Changed files`
3. `Tests`
4. `Unresolved risk`
5. `Recommended next task`

证据未齐时要明确写“真人验收仍 pending”，不得把文档、自动化或模拟回归写成 V3.3.5 已验收。只有严格验收和五项门禁全过，才允许推荐 V3.3.6。

## 10. 停止与升级条件

遇到以下任一情况，停止改动并向用户说明事实与所需决定：

- 没有真实玩家、真实触控设备或实体手机可用；保持 `pending`，绝不补造证据。
- 工作中出现不是本 Agent 产生的并发文件变化。
- `8082` 被未知进程占用；先报告 PID/进程信息，不终止。
- 构建指纹意外变化或验收记录与当前构建不匹配。
- 需求将扩大到新内容、新依赖、存档字段、公开 Debug UI、路由/成长重做或 V3.3.6。
- 需要修改 `archive/`、`docs/reference/` 或破坏本文件第 5 节任一约束。
- 真人证据互相冲突，无法用最小改动同时解决；先列出冲突和取舍，等待用户决定。

如果校验失败，先修复与本次变更直接相关的问题；不要借机清理 130 个既有 legacy wrapper aliases，它们当前不在任务范围内。

## 11. 可直接复制给接收 Agent 的提示词

```text
你现在接管 E:\wanjie_wushuang。先完整读取
E:\wanjie_wushuang\handoff\AGENT-DEVELOPMENT-PACKAGE-2026-08-25.md，
再按其中“接收 Agent 从这里开始”的顺序执行。

只执行当前 TASK.md：V3.3.5 Real Human-Play Balance and Combat Feel Acceptance。
当前真人证据为 keyboard-mouse 0/5、browser-touch 0/5、physical-device-touch 0/5，
acceptanceStatus=pending；不要把自动化、AI 浏览器输入、390x844 模拟或合成夹具当作真人/设备证据。

先校验验收记录并安全启动隔离 8082 服务，然后请真实玩家完成键鼠 ST001-01。
逐条把真实观察写入 playtest/human-acceptance-2026-08-25.json，每次写入后校验。
只有可追溯真人观察证明问题时才做最小改动，并用同路线真人复验记录前后证据。
保持 Schema30、星级/结算/路线/成长/有序脚本/V3.0-V3.3.4 约束；
不新增内容、依赖、存档字段、公开 Debug UI 或 _vXXOld* 包装层，
不读取或修改 archive/ 与 docs/reference/，不提前创建 V3.3.6。

完成全部 15 条真人路线后运行 --require-acceptance 和五项强制门禁，
最后只替换 handoff/STATE.md 的五个指定字段。
若缺少真人或设备，保持 pending 并报告阻塞，不得伪造完成。
```

## 12. 接手后的第一个可交付结果

接收 Agent 的第一个有效交付不是“又做了一轮自动化”，而应是以下二者之一：

1. 真人键鼠 `ST001-01` 的完整、可校验记录；或
2. 若真人当前不可用，一份明确说明缺失资源、保持 `pending`、未改数值且未伪造证据的阻塞报告。

这能让下一次决策建立在真实游戏体验上，而不是继续把前端可运行误当成完整游戏验收。
