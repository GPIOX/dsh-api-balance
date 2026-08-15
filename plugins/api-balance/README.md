# api-balance 源码说明

本目录是动态 Cordis 插件 `apibal-1` 的两个代码半部分（与 `cordis_define` 工具参数 `code.host` / `code.client` 一一对应）：

- `host.js`：Host 半部分。经 `shell` 服务执行 `curl` 查询余额接口（`web.fetch` 不支持自定义请求头），密钥以环境变量 `AI_BALANCE_KEY` 注入，并托管于 Harness 凭据库。
- `client.js`：Client 半部分。设置页（`settings.section` 的「API 余额」页）+ 全局悬浮徽章（`shell.overlay`）。

## 部署

在 DSH Web GUI 会话中：`cordis_define`（粘贴两个文件为 `code.host`/`code.client`）→ `cordis_run` → 批准 → 设置页配置密钥。

## 凭据引用（CredentialRef）

`AI_BALANCE_DEEPSEEK` / `AI_BALANCE_MOONSHOT` / `AI_BALANCE_OPENAI` / `AI_BALANCE_CUSTOM`

## 更新

修改代码后：`cordis_define`（`kind: "existing"`，`pluginId: "apibal-1"`）追加新 Package → `cordis_run`（`mode: "update"`）。仓库根 README 的「版本演进」表记录了 pkg 与 git 提交的对应关系。

完整介绍见仓库根目录 [README](../../README.md)。
