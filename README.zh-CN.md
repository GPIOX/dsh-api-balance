# DSH API Balance · API 余额悬浮徽章

> 在 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）的 Web GUI 里显示大模型 API 余额的悬浮徽章。可以拖着走、改大小，文字颜色跟着底下内容的明暗自动变。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-4d6bfe)

[English](README.md)

## 效果图

<p align="center">
  <img src="assets/badge-light.png" width="30%" alt="浅色内容上，文字自动切换为深色">
  <img src="assets/badge-dark.png" width="30%" alt="深色内容上，文字自动切换为浅色">
  <img src="assets/badge-acrylic.png" width="30%" alt="半透明亚克力质感">
</p>

> 效果图只截了徽章本身，没有真实界面和会话内容。

## 功能特性

- 浮在界面上方，点击穿透，不会挡住下面的任何操作。
- 按住就能拖到屏幕任意位置。
- 右下角手柄缩放，70% 到 250%。
- 半透明中性灰加毛玻璃虚化，再描一条细边，深浅色皮肤下都自然。
- 文字颜色跟着下方内容的亮度走：深色内容上变浅色文字，浅色内容上变深色文字。每 1.5 秒采样一次。
- 点徽章立即刷新，默认每分钟自动刷新一次。间隔在 设置 › API 余额 里可以改，最短 30 秒。
- 支持 DeepSeek、Moonshot (Kimi)、OpenAI，也能接任意自定义接口。
- 密钥存在 Harness 凭据库（`~/.dsh/.credentials.yaml`），不会回传页面。curl 通过环境变量拿到密钥，命令行里看不到。
- 设置页里可以配置平台和密钥、看余额明细（总余额/赠送/充值/可用/已用），也能开关徽章、调大小、重置位置。

## 正式安装（一键）

一条命令把插件装进你的 DSH `web` profile，`dsh plugin` 会自动同步 `dsh.profile.bundles`，不用手动改文件。tarball 形式是纯 HTTPS 下载，不用 GitHub 账号、SSH key，也不用装 git：

```bash
dsh plugin --profile web add https://github.com/GPIOX/dsh-api-balance/archive/refs/heads/main.tar.gz
```

> 另一种基于 git 的写法（经你本机 git 配置解析）：`dsh plugin --profile web add github:GPIOX/dsh-api-balance`。

然后重启 DSH（关掉 `dsh` 进程再跑一次，比如 `dsh web`），刷新页面，打开 设置 › API 余额 保存密钥。悬浮徽章马上就会显示余额。

卸载 / 回滚：

```bash
dsh plugin --profile web remove dsh-api-balance
```

> 等插件进了 [awesome-dsh-plugin](https://awesome-dsh-plugin.com) 目录，也可以在应用内的插件市场里一键安装。本地开发用 `dsh plugin --profile web add link:/路径/dsh-api-balance`。

### 零安装体验（动态插件）

不想动 profile 的话，可以直接在任意 DSH Web GUI 会话里把它贴成动态插件，不用构建也不用重启：

1. 用工具 `cordis_define` 创建插件（`kind: "new"`，任意 3-6 位字母前缀），把本仓库的
   [`plugins/api-balance/host.js`](plugins/api-balance/host.js) 和 [`plugins/api-balance/client.js`](plugins/api-balance/client.js)
   内容分别贴成 `code.host` 和 `code.client`
2. 用工具 `cordis_run` 激活刚定义的 Package，在运行卡片上点允许
3. 打开 设置 › API 余额，选平台、贴密钥、保存，徽章上立刻显示余额

> 动态插件存在进程里，不落盘。DSH 重启后重新定义、激活一次就行，两个源码文件都在本仓库。

## 支持平台

| 平台 | 余额接口 | 鉴权方式 | 备注 |
| --- | --- | --- | --- |
| DeepSeek | `GET https://api.deepseek.com/user/balance` | API Key（`sk-...`） | 返回总/赠送/充值余额（CNY） |
| Moonshot (Kimi) | `GET https://api.moonshot.cn/v1/users/me/balance` | API Key（`sk-...`） | 返回可用/赠送/现金余额（CNY） |
| OpenAI | `GET https://api.openai.com/dashboard/billing/credit_grants` | 浏览器会话 token（`sess-...`） | 官方不支持用 API Key 查余额；会话 token 有时效 |
| 自定义接口 | 任意 GET 接口（Bearer 鉴权） | 自填 | 支持 JSON 字段路径（如 `data.available_balance` 或 `balance_infos[0].total_balance`），适配中转站等 |

## 安全设计

- 页面只显示「已配置/未配置」，密钥明文永不回传浏览器。
- 密钥存进 Harness 官方的凭据服务（`~/.dsh/.credentials.yaml`），和其他 DSH 密钥放在一起。
- curl 通过 env 拿到 `AI_BALANCE_KEY`，进程列表里看不到它。

## 仓库结构

```
.
├── assets/                  # README 效果图（徽章展示图，无真实界面内容）
├── lib/index.js             # Host 半部分：/dsh-api-balance/* HTTP 路由 + 凭据托管
├── client/client.js         # Client 半部分：悬浮徽章 + 设置页（工厂打包形式）
├── cordis.patch.yml         # bundle 补丁：把本插件插入 profile 组合
├── package.json             # DSH 插件包清单（dsh.bundle / dsh.client）
├── plugins/api-balance/     # 同样两个半部分的动态插件源码（零安装路径）
│   ├── host.js
│   ├── client.js
│   └── README.md
├── LICENSE                  # MIT
├── README.md                # English
└── README.zh-CN.md          # 中文文档（本文件）
```

## License

[MIT](LICENSE) © 2026 GPIOX
