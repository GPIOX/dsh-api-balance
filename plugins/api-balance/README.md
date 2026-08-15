# API 账户余额查看器（动态 Cordis 插件）

在 DeepSeek Harness Web GUI 中显示大模型 API 平台的账户余额。

- 运行时对象：动态 Cordis 插件 `apibal-1`（当前版本 `pkg-5`）
- Host 半部分：`host.js` —— 通过 `shell` 服务执行 `curl` 查询余额接口，密钥经环境变量传入，并托管于 Harness 凭据库（`~/.dsh/.credentials.yaml`）
- Client 半部分：`client.js` —— 设置页（`settings.section` 新增「API 余额」页）+ 全局悬浮余额徽章（`shell.overlay`，可拖动、可缩放、半透明亚克力底色、文字随下方内容明暗自动切换）

## 支持平台

| 平台 | 接口 | 鉴权 |
| --- | --- | --- |
| DeepSeek | `GET https://api.deepseek.com/user/balance` | API Key（`sk-...`） |
| Moonshot (Kimi) | `GET https://api.moonshot.cn/v1/users/me/balance` | API Key（`sk-...`） |
| OpenAI | `GET https://api.openai.com/dashboard/billing/credit_grants` | 浏览器会话 token（`sess-...`），官方不支持用 API Key 查余额 |
| 自定义接口 | 任意 GET 接口（Bearer 鉴权） | 自填 URL + JSON 字段路径 + 币种 |

## 文件说明

- `host.js` / `client.js` 是 `cordis_define` 工具中 `code.host` / `code.client` 的参数原文（函数体，返回 Cordis Plugin）。
- 修改后通过 `cordis_define`（`plugin.kind: "existing"`，`pluginId: "apibal-1"`）追加不可变版本，再用 `cordis_run`（`mode: "update"`）激活。

## 密钥凭据引用（CredentialRef）

- `AI_BALANCE_DEEPSEEK` / `AI_BALANCE_MOONSHOT` / `AI_BALANCE_OPENAI` / `AI_BALANCE_CUSTOM`
