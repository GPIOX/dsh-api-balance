// 动态 Cordis 插件 apibal-1 的 Host 半部分（code.host 参数原文，pkg-2）
return {
  apply(ctx) {
    const shell = ctx.get('shell')
    const credentials = ctx.get('credentials')

    const CRED_REFS = {
      deepseek: 'AI_BALANCE_DEEPSEEK',
      moonshot: 'AI_BALANCE_MOONSHOT',
      openai: 'AI_BALANCE_OPENAI',
      custom: 'AI_BALANCE_CUSTOM',
    }

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
        try {
          const resolved = await credentials.resolve(CRED_REFS[provider])
          if (resolved) {
            const value = typeof resolved === 'string' ? resolved : (resolved.value || '')
            if (value) return value
          }
        } catch (e) { /* fall through */ }
      }
      return typeof fallbackKey === 'string' ? fallbackKey : ''
    }

    harness.handle('balance:status', async () => {
      const configured = {}
      for (const p of Object.keys(CRED_REFS)) {
        let ok = false
        if (credentials) {
          try {
            const resolved = await credentials.resolve(CRED_REFS[p])
            const value = resolved ? (typeof resolved === 'string' ? resolved : (resolved.value || '')) : ''
            ok = !!value
          } catch (e) { ok = false }
        }
        configured[p] = ok
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

    harness.handle('balance:fetch', async (args) => {
      const provider = args && args.provider
      if (!CRED_REFS[provider]) return { ok: false, error: '未知平台：' + provider }
      if (!shell) return { ok: false, error: 'shell 服务不可用，无法发起请求' }

      const key = await resolveKey(provider, args && args.key)
      if (!key) return { ok: false, error: '尚未配置密钥，请先到设置 › API 余额 中保存' }

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

      const command = "curl -sS --max-time 25 -w '\\n%{http_code}' -H \"Authorization: Bearer $AI_BALANCE_KEY\" \"" + url + "\""
      try {
        const spec = shell.resolve({ command, env: { AI_BALANCE_KEY: key }, timeoutMs: 30000, stdoutMaxBytes: 131072 })
        const res = await shell.run(spec)
        const text = res.stdout && res.stdout.text ? res.stdout.text : ''
        const m = /(\d{3})\s*$/.exec(text)
        if (!m) {
          const err = res.stderr && res.stderr.text ? res.stderr.text.trim() : 'curl 无响应'
          return { ok: false, error: '请求失败（exit=' + res.exitCode + '）：' + String(err).slice(0, 300) }
        }
        const code = Number(m[1])
        const bodyText = text.slice(0, text.length - m[0].length)
        let body
        try { body = JSON.parse(bodyText) } catch (e) {
          return { ok: false, error: '响应不是合法 JSON（HTTP ' + code + '）：' + String(bodyText).slice(0, 200) }
        }
        if (code !== 200) {
          return { ok: false, error: '接口返回 HTTP ' + code + '：' + String(JSON.stringify(body)).slice(0, 300) }
        }

        let parsed
        let currency
        if (provider === 'custom') {
          const value = walkPath(body, args && args.customPath)
          if (value == null || !Number.isFinite(Number(value))) {
            return { ok: false, error: '字段路径未命中数值，接口返回：' + String(JSON.stringify(body)).slice(0, 300) }
          }
          parsed = { total: num(value) }
          currency = args && args.customCurrency ? String(args.customCurrency) : 'CNY'
        } else {
          parsed = parsePreset(provider, body)
          currency = parsed.currency
        }

        const at = Date.now()
        return {
          ok: true,
          provider,
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
    })
  },
}
