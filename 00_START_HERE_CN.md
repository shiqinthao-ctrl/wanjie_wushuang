# 00_START_HERE_CN.md
# 《万界无双》Codex 完整母包使用说明

这个压缩包同时解决两个目标：

1. **完整归档**：保留本项目从 V0.1 到当前版本的全部项目相关对话过程、设计结论、冻结数据、历史可运行版本和交付结果。
2. **避免 Codex 413 / 上下文超限**：Codex 默认绝对不要一次读取完整归档，只按当前任务渐进读取。

---

## 一、你下载后到底怎么用

### 第一次

1. 解压整个 ZIP。
2. 用 Codex 打开**整个根目录** `wanjie_wushuang_v3.1.3_codex_master_handoff/`。
3. 不要把 ZIP 里的所有 Markdown 拖进 Codex 对话。
4. 不要复制过去几十轮聊天记录。
5. 只发送这一句话：

```text
Read AGENTS.md, then execute TASK.md. Do not preload archive/ or docs/reference/.
```

Codex 会从项目文件中自己读取需要的代码。

### 当前任务做完

要求 Codex：

```text
Update handoff/STATE.md with changed files, tests, unresolved risks, and the exact next step.
```

然后把下一个任务写入 `TASK.md`。

### 对话很长、又开始出现 context limit / 413

不要继续旧线程。

1. 让旧线程更新 `handoff/STATE.md`
2. 新建 Codex thread
3. 只发：

```text
Read AGENTS.md, handoff/STATE.md, and TASK.md. Continue. Use docs/INDEX.md only when needed. Do not preload archive/.
```

**绝对不要把旧聊天全文复制到新线程。**

---

## 二、完整资料在哪里

这些内容都在包里，但默认不给 Codex 全读：

### 项目完整对话与版本演进
`archive/conversation/PROJECT_CONVERSATION_FULL.md`

### 用户需求与决策时间线
`archive/conversation/USER_REQUEST_TIMELINE.md`

### 每一版交付与结果
`archive/conversation/VERSION_CHANGELOG_FULL.md`

### 冻结的完整游戏设计数据
`archive/spec/CANONICAL_GAME_DESIGN_FULL.md`

### 已发现 / 已修复 Bug 与回归项
`archive/spec/BUG_REGRESSION_HISTORY.md`

### 历史30个可运行 HTML
`archive/releases/`

### 历史开发包
`archive/packages/`

这些是**母档 / 追溯资料**。只有当前任务真的需要历史信息时，才让 Codex 读某一份、某一节。

---

## 三、Codex真正默认读什么

正常一个任务只需要：

```text
AGENTS.md
TASK.md
```

需要续接时再读：

```text
handoff/STATE.md
```

需要找参考资料时：

```text
docs/INDEX.md
```

当前 active context packet 被控制在 8KB 内。

---

## 四、日常开发命令

启动：

```bash
npm run dev
```

验证：

```bash
npm run check
npm run smoke
npm run audit
npm run context
npm run archive:verify
```

全部通过才算任务完成。

---

## 五、你以后怎么给 Codex 下任务

不要说：

```text
继续优化整个游戏
全部重构
把游戏做完整
```

推荐写到 `TASK.md`：

```text
# Task

## Goal
只优化 H001 赤焰战神的近战打击感。

## Read
- assets/js/combat/hero-identity.js
- assets/js/combat/skill-forms.js

## Constraints
- 不改其他英雄
- 不改 Schema 30
- 不改七模式规则
- 不增加 npm 依赖

## Done when
- H001 普攻 / Q/E / R 正常
- npm run check
- npm run smoke
- npm run audit
```

这样 Codex 每个线程只背一个明确任务，不容易上下文爆炸。

---

## 六、完整母包与轻量上下文并不冲突

**完整性靠文件归档实现。**  
**Codex效率靠按需读取实现。**

不要为了“让 Codex 知道全部历史”，把完整历史每次都塞进 prompt。完整历史就在仓库中，需要时再查即可。
