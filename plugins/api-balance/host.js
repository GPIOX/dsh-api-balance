// 动态 Cordis 插件 apibal-1 的 Host 半部分（code.host 参数原文）
// 与打包版 lib/index.js 功能对齐：多提供商（DeepSeek/Moonshot/OpenAI/自定义余额型 +
// OpenCode Go 额度型：5h/周/月窗口），提供商列表与轮播配置持久化到凭据库。
return {
  apply(ctx) {
    const shell = ctx.get('shell')
    const credentials = ctx.get('credentials')

    const CRED_REFS = {
      deepseek: 'AI_BALANCE_DEEPSEEK',
      moonshot: 'AI_BALANCE_MOONSHOT',
      openai: 'AI_BALANCE_OPENAI',
      custom: 'AI_BALANCE_CUSTOM',
      'opencode-go': 'OPENCODE_GO_API_KEY',
    }

    const ALT_CRED_REFS = {
      'opencode-go': ['OPENCODE_GO_API_KEY', 'OPENCODE_ZERO_API_KEY'],
    }

    const PROVIDERS_CRED = 'AI_BALANCE_PROVIDERS'
    const DEFAULT_PROVIDER_ORDER = ['deepseek', 'opencode-go', 'moonshot', 'openai', 'custom']
    const ZEN_USAGE_URL = 'https://opencode.ai/zen/go/v1/usage'
    const QUOTA_BUCKETS = ['rolling', 'weekly', 'monthly']

    function num(v) {
      const n = Number(v)
      return Number.isFinite(n) ? n : null
    }

    function walkPath(obj, path) {
      let cur = obj
      const parts = String(path || '').trim().split('.')
      for (const part of parts) {
        if (part === '' || cur == null) break
        const m = /^([A-Za-z0-9_]+)\[(\d+)\]$/.exec(part)
        if (m) cur = cur[m[1]] ? cur[m[1]][Number(m[2])] : undefined
        else cur = cur[part]
      }
      return cur
    }

    function parsePreset(provider, body) {
      if (provider === 'deepseek') {
        const list = body && body.balance_infos
        const info = Array.isArray(list) ? list[0] : null
        if (!info) throw new Error('DeepSeek 返回格式异常：' + String(JSON.stringify(body)).slice(0, 200))
        return {
          currency: info.currency || 'CNY',
          total: num(info.total_balance),
          granted: num(info.granted_balance),
          toppedUp: num(info.topped_up_balance),
        }
      }
      if (provider === 'moonshot') {
        const d = body && body.data
        if (!d) throw new Error('Moonshot 返回格式异常：' + String(JSON.stringify(body)).slice(0, 200))
        return {
          currency: 'CNY',
          total: num(d.available_balance),
          granted: num(d.voucher_balance),
          toppedUp: num(d.cash_balance),
        }
      }
      if (provider === 'openai') {
        return {
          currency: 'USD',
          total: num(body.total_granted),
          used: num(body.total_used),
          available: num(body.total_available),
        }
      }
      throw new Error('未知平台：' + provider)
    }

    async function resolveKey(provider, fallbackKey) {
      if (credentials) {
        const refs = ALT_CRED_REFS[provider] || [CRED_REFS[provider]]
        for (const ref of refs) {
          try {
            const resolved = await credentials.resolve(ref)
            if (resolved) {
              const value = typeof resolved === 'string' ? resolved : (resolved.value || '')
              if (value) return value
            }
          } catch (e) { /* try next */ }
        }
      }
      return typeof fallbackKey === 'string' ? fallbackKey : ''
    }

    /** 执行一次 curl GET 并返回 {code, body}。 */
    async function curlJson(url, key, timeoutSec) {
      if (!shell) return { error: 'shell 服务不可用，无法发起请求' }
      const command = "curl -sS --max-time " + timeoutSec + " -w '\\n%{http_code}' -H \"Authorization: Bearer $AI_BALANCE_KEY\" \"" + url + "\""
      const spec = shell.resolve({ command, env: { AI_BALANCE_KEY: key }, timeoutMs: (timeoutSec + 5) * 1000, stdoutMaxBytes: 131072 })
      const res = await shell.run(spec)
      const text = res.stdout && res.stdout.text ? res.stdout.text : ''
      const m = /(\d{3})\s*$/.exec(text)
      if (!m) {
        const err = res.stderr && res.stderr.text ? res.stderr.text.trim() : 'curl 无响应'
        return { error: '请求失败（exit=' + res.exitCode + '）：' + String(err).slice(0, 300) }
      }
      const code = Number(m[1])
      const bodyText = text.slice(0, text.length - m[0].length)
      let body
      try { body = JSON.parse(bodyText) } catch (e) {
        return { error: '响应不是合法 JSON（HTTP ' + code + '）：' + String(bodyText).slice(0, 200) }
      }
      return { code, body }
    }

    async function fetchZenUsage(key) {
      const r = await curlJson(ZEN_USAGE_URL, key, 15)
      if (r.error) return { ok: false, error: r.error }
      if (r.code !== 200) return { ok: false, error: '接口返回 HTTP ' + r.code + '：' + String(JSON.stringify(r.body)).slice(0, 200) }
      const usage = r.body && r.body.usage
      if (!usage || typeof usage !== 'object') return { ok: false, error: 'Zen 返回缺少 usage 对象' }
      const windows = {}
      for (const bucket of QUOTA_BUCKETS) {
        const b = usage[bucket]
        if (!b || typeof b !== 'object' || typeof b.percent !== 'number' || !Number.isFinite(b.percent) || b.percent < 0 || b.percent > 100) {
          return { ok: false, error: 'Zen 窗口 ' + bucket + ' 数据异常' }
        }
        windows[bucket] = {
          percent: b.percent,
          remaining: Math.round((100 - b.percent) * 10) / 10,
          resetsAt: typeof b.resetsAt === 'string' ? b.resetsAt : null,
        }
      }
      return { ok: true, type: 'quota', windows }
    }

    const PROVIDER_LABELS = {
      deepseek: 'DeepSeek',
      moonshot: 'Moonshot (Kimi)',
      openai: 'OpenAI',
      custom: '自定义接口',
      'opencode-go': 'OpenCode Go',
    }

    async function fetchProvider(args) {
      const provider = args && args.provider
      if (!CRED_REFS[provider]) return { ok: false, error: '未知平台：' + provider }
      const key = await resolveKey(provider, args && args.key)
      if (!key) return { ok: false, error: '尚未配置密钥，请先到设置 › API 余额 中保存' }

      if (provider === 'opencode-go') {
        try {
          const r = await fetchZenUsage(key)
          if (!r.ok) return r
          return { ok: true, provider, type: 'quota', label: PROVIDER_LABELS[provider], windows: r.windows }
        } catch (e) {
          return { ok: false, error: '请求失败：' + String(e && e.message || e) }
        }
      }

      let url
      if (provider === 'custom') {
        url = args && args.customUrl
        if (!url) return { ok: false, error: '请填写自定义接口地址' }
      } else {
        url = {
          deepseek: 'https://api.deepseek.com/user/balance',
          moonshot: 'https://api.moonshot.cn/v1/users/me/balance',
          openai: 'https://api.openai.com/dashboard/billing/credit_grants',
        }[provider]
      }

      try {
        const r = await curlJson(url, key, 25)
        if (r.error) return { ok: false, error: r.error }
        if (r.code !== 200) return { ok: false, error: '接口返回 HTTP ' + r.code + '：' + String(JSON.stringify(r.body)).slice(0, 300) }

        let parsed
        let currency
        if (provider === 'custom') {
          const value = walkPath(r.body, args && args.customPath)
          if (value == null || !Number.isFinite(Number(value))) {
            return { ok: false, error: '字段路径未命中数值，接口返回：' + String(JSON.stringify(r.body)).slice(0, 300) }
          }
          parsed = { total: num(value) }
          currency = args && args.customCurrency ? String(args.customCurrency) : 'CNY'
        } else {
          parsed = parsePreset(provider, r.body)
          currency = parsed.currency
        }

        const at = Date.now()
        return {
          ok: true,
          provider,
          type: 'balance',
          label: PROVIDER_LABELS[provider],
          currency,
          total: parsed.total,
          granted: parsed.granted != null ? parsed.granted : null,
          toppedUp: parsed.toppedUp != null ? parsed.toppedUp : null,
          used: parsed.used != null ? parsed.used : null,
          available: parsed.available != null ? parsed.available : null,
          at,
          atText: new Date(at).toLocaleString(),
        }
      } catch (e) {
        return { ok: false, error: '请求失败：' + String(e && e.message || e) }
      }
    }

    async function readProviderConfig() {
      const fallback = { enabled: DEFAULT_PROVIDER_ORDER }
      if (!credentials) return fallback
      try {
        const resolved = await credentials.resolve(PROVIDERS_CRED)
        const value = resolved ? (typeof resolved === 'string' ? resolved : (resolved.value || '')) : ''
        if (!value) return fallback
        const parsed = JSON.parse(value)
        const enabled = Array.isArray(parsed.enabled)
          ? parsed.enabled.filter((id) => CRED_REFS[id])
          : DEFAULT_PROVIDER_ORDER
        return { enabled: enabled.length ? enabled : DEFAULT_PROVIDER_ORDER }
      } catch (e) {
        return fallback
      }
    }

    harness.handle('balance:status', async () => {
      const configured = {}
      for (const p of Object.keys(CRED_REFS)) {
        configured[p] = !!(await resolveKey(p, ''))
      }
      return { ok: true, configured, storeAvailable: !!credentials }
    })

    harness.handle('balance:save', async (args) => {
      const provider = args && args.provider
      const key = args && args.key
      if (!CRED_REFS[provider]) return { ok: false, error: '未知平台：' + provider }
      if (!key) return { ok: false, error: 'API Key 不能为空' }
      if (!credentials) return { ok: false, error: '凭据服务不可用，无法保存（密钥仅能在本次会话内使用）' }
      try {
        await credentials.set(CRED_REFS[provider], key)
        return { ok: true }
      } catch (e) {
        return { ok: false, error: '保存失败：' + String(e && e.message || e) }
      }
    })

    harness.handle('balance:clear', async (args) => {
      const provider = args && args.provider
      if (!CRED_REFS[provider]) return { ok: false, error: '未知平台：' + provider }
      if (!credentials) return { ok: false, error: '凭据服务不可用' }
      try {
        await credentials.unset(CRED_REFS[provider])
        return { ok: true }
      } catch (e) {
        return { ok: false, error: '清除失败：' + String(e && e.message || e) }
      }
    })

    harness.handle('balance:fetch', async (args) => fetchProvider(args))

    harness.handle('balance:fetch-all', async (args) => {
      const config = await readProviderConfig()
      const base = args || {}
      const tasks = config.enabled.map((id) => fetchProvider(Object.assign({ provider: id }, base)))
      const settled = await Promise.allSettled(tasks)
      const results = []
      const errors = {}
      config.enabled.forEach((id, i) => {
        const r = settled[i]
        if (r.status === 'fulfilled' && r.value && r.value.ok) results.push(r.value)
        else if (r.status === 'fulfilled') errors[id] = (r.value && r.value.error) || '未知错误'
        else errors[id] = String(r.reason && r.reason.message || r.reason || '未知错误')
      })
      return { ok: true, config, results, errors }
    })

    harness.handle('balance:get-providers', async () => {
      const config = await readProviderConfig()
      return { ok: true, config, available: Object.keys(CRED_REFS) }
    })

    harness.handle('balance:save-providers', async (args) => {
      if (!credentials) return { ok: false, error: '凭据服务不可用' }
      try {
        const enabled = Array.isArray(args && args.enabled)
          ? args.enabled.filter((id) => CRED_REFS[id])
          : DEFAULT_PROVIDER_ORDER
        const config = { enabled: enabled.length ? enabled : DEFAULT_PROVIDER_ORDER }
        await credentials.set(PROVIDERS_CRED, JSON.stringify(config))
        return { ok: true, config }
      } catch (e) {
        return { ok: false, error: '保存失败：' + String(e && e.message || e) }
      }
    })
  },
}
