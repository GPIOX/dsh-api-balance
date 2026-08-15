# DSH API Balance · API 余额悬浮徽章

> 一枚为 [DeepSeek Harness](https://github.com/deepseek-ai)（DSH）Web GUI 打造的小巧悬浮徽章：实时显示你的大模型 API 平台账户余额，可自由拖动、自由缩放、半透明亚克力质感，文字颜色随下方内容明暗自动切换。

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-4d6bfe)

[English](README.md)

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
- **点击刷新 + 自动刷新**：轻点徽章立即刷新，默认每 1 分钟自动刷新一次（设置 › API 余额 可自定义间隔，最短 30 秒）
- **多平台支持**：DeepSeek、Moonshot (Kimi)、OpenAI、任意自定义接口
- **密钥安全**：密钥保存在 Harness 凭据库（`~/.dsh/.credentials.yaml`），绝不回传页面；请求经 `curl` 以环境变量传递密钥，不出现在命令行
- **设置面板**：在 设置 › API 余额 中配置平台与密钥、查看余额明细（总余额/赠送/充值/可用/已用）、控制徽章显示/大小/重置

## 📦 正式安装（一键）

一条命令即可把插件装进你的 DSH `web` profile 并自动注册（`dsh plugin` 会自动同步 `dsh.profile.bundles`）。tarball 形式是纯 HTTPS 下载——无需 GitHub 账号、SSH key 或 git：

```bash
dsh plugin --profile web add https://github.com/GPIOX/dsh-api-balance/archive/refs/heads/main.tar.gz
```

> 另一种基于 git 的写法（经你本机 git 配置解析）：`dsh plugin --profile web add github:GPIOX/dsh-api-balance`。

然后重启 DSH（关闭 `dsh` 进程后重新运行，例如 `dsh web`），刷新页面，打开 设置 › **API 余额** 保存密钥——悬浮徽章即刻显示余额。

卸载 / 回滚：

```bash
dsh plugin --profile web remove dsh-api-balance
```

> 也可以等插件收录进 [awesome-dsh-plugin](https://awesome-dsh-plugin.com) 目录后，在应用内**插件市场**一键安装；本地开发调试可用 `dsh plugin --profile web add link:/路径/dsh-api-balance`。

### ⚡ 零安装体验（动态插件）

不想动 profile？可以在任意 DSH Web GUI 会话中直接粘贴为动态插件，无需构建或重启：

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

## 📂 仓库结构

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

## 📄 License

[MIT](LICENSE) © 2026 GPIOX
