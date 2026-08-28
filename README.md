# 万界无双 V3.1.3 Codex Master Handoff

这是**完整母包**，同时保留 Codex Context-Lite 工作方式。

## 你先做什么

打开：

`00_START_HERE_CN.md`

## Codex 第一次只发送

```text
Read AGENTS.md, then execute TASK.md. Do not preload archive/ or docs/reference/.
```

## 为什么 archive 很大但不会导致 413

因为 `archive/` 是追溯母档，不在 Codex 默认上下文入口中。  
普通任务只读 `AGENTS.md + TASK.md`，需要历史时再定点读取。

## 本地运行

```bash
npm run dev
```

## 完整验证

```bash
npm run check
npm run smoke
npm run audit
npm run context
npm run archive:verify
```

完整目录说明见 `MASTER_INDEX.md`。
