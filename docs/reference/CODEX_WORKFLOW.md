# CODEX_WORKFLOW.md

## 第一次
1. 解压项目。
2. 用 Codex 打开整个根目录，不要只打开 `index.html`。
3. 让 Codex 先读取 `AGENTS.md`。
4. 发送 `CODEX_START_PROMPT.md` 中的第一阶段任务。

## 每次需求推荐格式
```text
目标：只做 XXX。
范围：允许修改 xxx.js / yyy.js。
禁止：不改Schema、不改战斗数值、不引入新依赖。
验收：npm run check / smoke / audit + 指定交互。
```

不要使用“继续优化”“全部重构”“做成正式游戏”这类无限范围任务。

## 并行建议
如果使用多Agent/Worktree：
- A：V3.2配置命名空间迁移
- B：浏览器测试脚手架
- C：资源manifest审计

不要让多个Agent同时修改 `engine.js`、`game-modes.js`、`stability-v30.js`。
