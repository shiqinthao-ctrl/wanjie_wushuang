# V3.1 Validation

## 已通过

- 22 个 JavaScript 文件逐文件 `node --check`：通过
- 22 个 JavaScript 按真实加载顺序合并后 `node --check`：通过
- `index.html` 无内联 `<script>`：通过
- `index.html` 无内联 `<style>`：通过
- 外部 CSS 引用：通过
- 外部脚本数量与 manifest 加载顺序：通过
- HTML 引用的 23 个本地资源全部存在：通过
- 本地 HTTP 服务逐资源请求：23 / 23 返回 HTTP 200
- V3.1 项目元数据 `window.WW_PROJECT`：存在
- V3.0 Schema 30 / 存档迁移层：保留
- 正式界面 Debug 入口：无

## 浏览器自动化说明

本次环境中的 Chromium / Playwright 对 `localhost` 和 `file://` 导航被运行环境策略阻断（`ERR_BLOCKED_BY_ADMINISTRATOR`），因此无法完成真实页面自动点击烟测。

这不是项目自身的 JavaScript 或资源加载错误。作为替代，已完成：
1. 所有 JS 静态语法检查；
2. 按真实加载顺序的合并语法检查；
3. 所有 HTML 外部依赖路径解析；
4. 本地 HTTP 服务逐资源 200 检查。

建议在开发机上运行 `run_local_server.bat` 或 `run_local_server.sh` 后进行一次人工烟测。
