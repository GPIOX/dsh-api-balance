# DSH API Balance · Floating API Balance Badge

> A floating badge for the [DeepSeek Harness](https://github.com/deepseek-ai) (DSH) Web GUI. Shows your LLM API account balance, drags anywhere, resizes, and switches text color to match whatever sits beneath it.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
![Platform](https://img.shields.io/badge/platform-DeepSeek%20Harness-4d6bfe)

[中文文档](README.zh-CN.md)

## Screenshots

<p align="center">
  <img src="assets/badge-light.png" width="30%" alt="Badge over light content, text switches to dark">
  <img src="assets/badge-dark.png" width="30%" alt="Badge over dark content, text switches to light">
  <img src="assets/badge-acrylic.png" width="30%" alt="Frosted-glass acrylic texture">
</p>

> The screenshots show the badge itself only. No real UI or conversation content.

## Features

- Floats in a frame-wide overlay above every column. Click-through, so it never blocks the app underneath.
- Drag it anywhere on screen.
- Resizable from 70% to 250% with the bottom-right handle.
- Frosted-glass look: translucent neutral tint, backdrop blur, a thin border. Reads fine on light and dark skins.
- Text color follows the brightness of the content beneath it, light text over dark areas and dark text over light ones. The badge samples this every 1.5 seconds.
- Click the badge to refresh, or let it refresh itself every minute by default. The interval is configurable in Settings › API Balance, down to 30 seconds.
- Works with DeepSeek, Moonshot (Kimi), OpenAI, or any custom endpoint.
- API keys stay in the Harness credential store (`~/.dsh/.credentials.yaml`) and never reach the browser. curl gets the key through an environment variable, not the command line.
- The settings page covers provider and key setup, balance details (total, granted, topped-up, available, used), badge visibility, size, and position reset.

## Installation

One command installs the plugin into your DSH `web` profile and registers it automatically (`dsh plugin` reconciles `dsh.profile.bundles` for you). The tarball form is plain HTTPS. You don't need a GitHub account, an SSH key, or git:

```bash
dsh plugin --profile web add https://github.com/GPIOX/dsh-api-balance/archive/refs/heads/main.tar.gz
```

> Alternative git-based form (resolves through your local git configuration): `dsh plugin --profile web add github:GPIOX/dsh-api-balance`.

Then restart DSH (stop the `dsh` process and run it again, e.g. `dsh web`), refresh the page, and open Settings › API Balance to save your key. The badge shows up right away.

Uninstall / rollback:

```bash
dsh plugin --profile web remove dsh-api-balance
```

> The in-app Market (Settings › Plugins/Market) can install it too once it is listed in the [awesome-dsh-plugin](https://awesome-dsh-plugin.com) registry. For local development: `dsh plugin --profile web add link:/path/to/dsh-api-balance`.

### Zero-install quick start (dynamic plugin)

If you would rather not touch your profile, paste the plugin into any DSH Web GUI session as a dynamic plugin. No build step and no restart:

1. Call the `cordis_define` tool (`kind: "new"`, any 3-6 letter prefix) and paste
   [`plugins/api-balance/host.js`](plugins/api-balance/host.js) / [`plugins/api-balance/client.js`](plugins/api-balance/client.js)
   as `code.host` / `code.client`
2. Activate the returned Package with `cordis_run` and click Approve on the run card
3. Open Settings › API Balance, pick a provider, paste your key, and save. The badge shows your balance immediately

> Dynamic plugins live in the process, not on disk. After a DSH restart, define and activate it again (both source files are in this repo).

## Supported providers

| Provider | Balance endpoint | Auth | Notes |
| --- | --- | --- | --- |
| DeepSeek | `GET https://api.deepseek.com/user/balance` | API Key (`sk-...`) | total / granted / topped-up (CNY) |
| Moonshot (Kimi) | `GET https://api.moonshot.cn/v1/users/me/balance` | API Key (`sk-...`) | available / voucher / cash (CNY) |
| OpenAI | `GET https://api.openai.com/dashboard/billing/credit_grants` | Browser session token (`sess-...`) | OpenAI offers no API-key balance endpoint; session tokens expire |
| Custom | any GET endpoint (Bearer auth) | your own | JSON field paths like `data.available_balance` or `balance_infos[0].total_balance`, such as relay stations |

## Security

- The browser only sees whether a key is configured. The plaintext key is never sent back to the page.
- Keys are stored by the Harness credential service (`~/.dsh/.credentials.yaml`), the same place DSH keeps its other secrets.
- curl receives `AI_BALANCE_KEY` through `env`, so it never appears in process listings.

## Repository layout

```
.
├── assets/                  # README screenshots (badge renders, no real UI content)
├── lib/index.js             # Host half: /dsh-api-balance/* HTTP routes + credential handling
├── client/client.js         # Client half: floating badge + settings page (factory bundle)
├── cordis.patch.yml         # Bundle patch inserting this plugin into a profile
├── package.json             # DSH plugin package manifest (dsh.bundle / dsh.client)
├── plugins/api-balance/     # Same halves as dynamic-plugin sources (zero-install path)
│   ├── host.js
│   ├── client.js
│   └── README.md
├── LICENSE                  # MIT
├── README.md                # this file (English)
└── README.zh-CN.md          # 中文文档
```

## License

[MIT](LICENSE) © 2026 GPIOX
