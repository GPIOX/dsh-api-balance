# DSH API Balance · API 余额悬浮徽章

> 一枚为 [DeepSeek Harness](https://github.com/deepseek-ai) Web GUI 打造的小巧悬浮徽章：实时显示你的大模型 API 平台账户余额，可自由拖动、自由缩放、半透明亚克力质感，文字颜色随下方内容明暗自动切换。
>
> *A tiny floating badge for the DeepSeek Harness (DSH) Web GUI: live LLM-API account balance, draggable, resizable, acrylic texture, with text color that adapts to whatever is underneath.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-4d6bfe)

## 📸 效果图

<p align="center">
  <img src="assets/badge-light.png" width="30%" alt="浅色内容上，文字自动切换为深色">
  <img src="assets/badge-dark.png" width="30%" alt="深色内容上，文字自动切换为浅色">
  <img src="assets/badge-acrylic.png" width="30%" alt="半透明亚克力质感">
</p>

> 效果图为徽章本身的展示图，不包含任何真实界面与会话内容。

## ✨ 功能特性

- **全局悬浮**：浮于所有界面之上，点击穿透，不遮挡任何操作
- **自由拖动**：按住徽章拖到屏幕任意位置，松手即定位
- **自由缩放**：拖拽右下角手柄，70% – 250% 无级缩放
- **亚克力质感**：半透明中性灰 + 毛玻璃虚化 + 细描边，深浅色皮肤都自然
- **文字明暗自适应**：实时采样徽章下方内容的背景亮度，深色内容上自动变浅色文字、浅色内容上自动变深色文字
- **点击刷新 + 自动刷新**：轻点徽章立即刷新，每 10 分钟自动刷新一次
- **多平台支持**：DeepSeek、Moonshot (Kimi)、OpenAI、任意自定义接口
- **密钥安全**：密钥保存在 Harness 凭据库（`~/.dsh/.credentials.yaml`），绝不回传页面；请求经 `curl` 以环境变量传递密钥，不出现在命令行
- **设置面板**：在 设置 › API 余额 中配置平台与密钥、查看余额明细（总余额/赠送/充值/可用/已用）、控制徽章显示/大小/重置

## 🚀 快速开始

本插件是 **DSH 动态 Cordis 插件**（进程内插件，无需构建或重启）。在任意 DSH Web GUI 会话中：

1. 使用工具 `cordis_define` 创建插件（`kind: "new"`，任意 3–6 位字母前缀），把本仓库的
   [`plugins/api-balance/host.js`](plugins/api-balance/host.js) 与 [`plugins/api-balance/client.js`](plugins/api-balance/client.js)
   内容分别粘贴为 `code.host` 与 `code.client`
2. 使用工具 `cordis_run` 激活刚定义的 Package，并在运行卡片中点击**允许**
3. 打开 设置 › **API 余额**：选择平台 → 粘贴密钥 → 保存，悬浮徽章即刻显示余额

> 动态插件按设计是进程内临时的：重启 DSH 后需重新定义并激活（源码就在本仓库，照做一次即可）。

## 🖥 支持平台

| 平台 | 余额接口 | 鉴权方式 | 备注 |
| --- | --- | --- | --- |
| DeepSeek | `GET https://api.deepseek.com/user/balance` | API Key（`sk-...`） | 返回总/赠送/充值余额（CNY） |
| Moonshot (Kimi) | `GET https://api.moonshot.cn/v1/users/me/balance` | API Key（`sk-...`） | 返回可用/赠送/现金余额（CNY） |
| OpenAI | `GET https://api.openai.com/dashboard/billing/credit_grants` | 浏览器会话 token（`sess-...`） | 官方不支持用 API Key 查余额；会话 token 有时效 |
| 自定义接口 | 任意 GET 接口（Bearer 鉴权） | 自填 | 支持 JSON 字段路径（如 `data.available_balance` 或 `balance_infos[0].total_balance`），适配中转站等 |

## 🔒 安全设计

- **密钥只进不出**：页面只能看到"已配置/未配置"状态，密钥明文永不回传浏览器
- **凭据托管**：密钥存入 Harness 官方凭据服务（`~/.dsh/.credentials.yaml`），与其他 DSH 密钥统一管理
- **不落命令行**：`curl` 请求通过 `env` 注入 `AI_BALANCE_KEY`，进程列表里看不到密钥

## 🧩 版本演进

仓库 git 历史即插件的版本演进（动态插件版本不可变，每次修改追加新 Package）：

| 版本 | 提交 | 变更 |
| --- | --- | --- |
| pkg-2 | `821594b` | 首个版本：设置页 + 侧边栏底部常驻徽章 |
| pkg-3 | `70ec8d1` | 徽章升级为全局悬浮：自由拖动 + 右下角手柄自由缩放 |
| pkg-4 | `41f739d` | 改用主题 token 的不透明底色（后续被 pkg-6 替代） |
| pkg-5 | `ef87547` | 亚克力底色 + 文字随下方内容明暗自适应 |
| pkg-6 | `3ae1b68` | 恢复 pkg-3 原版亚克力质感，保留明暗自适应 |

## 📂 仓库结构

```
.
├── assets/                  # README 效果图（徽章展示图，无真实界面内容）
├── plugins/api-balance/
│   ├── host.js              # code.host：余额查询、凭据托管
│   ├── client.js            # code.client：悬浮徽章 + 设置页
│   └── README.md            # 源码结构说明
├── LICENSE                  # MIT
└── README.md                # 本文件
```

## 📄 License

[MIT](LICENSE) © 2026 GPIOX

## English

**DSH API Balance** is a dynamic [Cordis](https://github.com/cordisjs/cordis) plugin for the DeepSeek Harness Web GUI. It shows your LLM-API account balance as a floating badge that you can drag anywhere and resize freely. The badge has a frosted-glass look, and its text color automatically switches between dark and light based on the brightness of the content beneath it. Supported providers: DeepSeek, Moonshot (Kimi), OpenAI, and any custom Bearer-authenticated endpoint. API keys live in the Harness credential store and never travel back to the browser.
