/**
 * dsh-api-balance-badge host entry: mounts the /dsh-api-balance-badge/* HTTP routes once
 * the profile composes the webServer service. Balance and quota lookups use native Node.js
 * fetch (no shell/curl dependency). API keys live in the Harness credential store
 * (~/.dsh/.credentials.yaml) and are passed via the Authorization header, never on the
 * command line and never back to the browser.
 *
 * Providers come in two kinds:
 * - balance: DeepSeek / Moonshot / OpenAI / custom endpoint, shows a currency amount.
 * - quota:   OpenCode Go (Zen), shows rolling-5h / weekly / monthly usage windows.
 */
export const name = 'dsh-api-balance-badge'

const CRED_REFS = {
  deepseek: 'AI_BALANCE_DEEPSEEK',
  moonshot: 'AI_BALANCE_MOONSHOT',
  openai: 'AI_BALANCE_OPENAI',
  custom: 'AI_BALANCE_CUSTOM',
  'opencode-go': 'OPENCODE_GO_API_KEY',
}

const PROVIDERS = {
  deepseek: { label: 'DeepSeek', type: 'balance' },
  moonshot: { label: 'Moonshot (Kimi)', type: 'balance' },
  openai: { label: 'OpenAI', type: 'balance' },
  custom: { label: '自定义接口', type: 'balance' },
  'opencode-go': { label: 'OpenCode Go', type: 'quota' },
}

/** Candidate credential refs per provider, tried in order. */
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

function sendJson(response, status, payload) {
  response.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': 'application/json; charset=utf-8',
  })
  response.end(JSON.stringify(payload))
}

function sameOrigin(request) {
  const origin = request.headers.origin
  const host = request.headers.host
  if (origin === undefined || host === undefined) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

async function readJsonBody(request) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > 4096) throw new Error('request body too large')
    chunks.push(buffer)
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

async function resolveKey(credentials, provider, fallbackKey) {
  if (credentials) {
    const refs = ALT_CRED_REFS[provider] || [CRED_REFS[provider]]
    for (const ref of refs) {
      try {
        const resolved = await credentials.resolve(ref)
        if (resolved) {
          const value = typeof resolved === 'string' ? resolved : (resolved.value || '')
          if (value) return value
        }
      } catch {
        /* try the next ref */
      }
    }
  }
  return typeof fallbackKey === 'string' ? fallbackKey : ''
}

/** Fetch OpenCode Go usage from the Zen endpoint and normalize the three windows. */
async function fetchZenUsage(key) {
  const res = await fetch(ZEN_USAGE_URL, {
    method: 'GET',
    headers: { Authorization: 'Bearer ' + key },
    signal: AbortSignal.timeout(15000),
  })
  const code = res.status
  const bodyText = await res.text()
  let body
  try {
    body = JSON.parse(bodyText)
  } catch {
    return { ok: false, error: '响应不是合法 JSON（HTTP ' + code + '）' }
  }
  if (code !== 200) {
    return { ok: false, error: '接口返回 HTTP ' + code + '：' + String(JSON.stringify(body)).slice(0, 200) }
  }
  const usage = body && body.usage
  if (!usage || typeof usage !== 'object') {
    return { ok: false, error: 'Zen 返回缺少 usage 对象' }
  }
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

/** Fetch one provider, typed by its kind. */
async function fetchProvider(host, args) {
  const provider = args && args.provider
  if (!CRED_REFS[provider]) return { ok: false, error: '未知平台：' + provider }
  const credentials = host.get('credentials')
  const key = await resolveKey(credentials, provider, args && args.key)
  if (!key) return { ok: false, error: '尚未配置密钥，请先到设置 › API 余额 中保存' }

  if (provider === 'opencode-go') {
    try {
      const r = await fetchZenUsage(key)
      if (!r.ok) return r
      return { ok: true, provider, type: 'quota', label: PROVIDERS[provider].label, windows: r.windows }
    } catch (e) {
      return { ok: false, error: '请求失败：' + String(e && e.message || e) }
    }
  }

  let url
  if (provider === 'custom') {
    url = args && args.customUrl
    if (!url || !/^https?:\/\//.test(url)) return { ok: false, error: '请填写合法的自定义接口地址（http/https）' }
  } else {
    url = {
      deepseek: 'https://api.deepseek.com/user/balance',
      moonshot: 'https://api.moonshot.cn/v1/users/me/balance',
      openai: 'https://api.openai.com/dashboard/billing/credit_grants',
    }[provider]
  }

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + key },
      signal: AbortSignal.timeout(25000),
    })
    const code = res.status
    const bodyText = await res.text()
    let body
    try {
      body = JSON.parse(bodyText)
    } catch {
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
      type: 'balance',
      label: PROVIDERS[provider].label,
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

async function readProviderConfig(credentials) {
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
  } catch {
    return fallback
  }
}

export function apply(ctx, config) {
  ctx.inject(['webServer'], (host) => {
    host.effect(() => {
      const disposers = []

      // GET /dsh-api-balance-badge/status — which providers have a saved key.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/status',
        handler: async (request, response) => {
          if (request.method !== 'GET') {
            response.writeHead(405, { allow: 'GET' })
            response.end()
            return
          }
          const credentials = host.get('credentials')
          const configured = {}
          for (const p of Object.keys(CRED_REFS)) {
            configured[p] = !!(await resolveKey(credentials, p, ''))
          }
          sendJson(response, 200, { ok: true, configured, storeAvailable: !!credentials })
        },
      }))

      // POST /dsh-api-balance-badge/save — store a key in the credential store.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/save',
        handler: async (request, response) => {
          if (request.method !== 'POST') {
            response.writeHead(405, { allow: 'POST' })
            response.end()
            return
          }
          if (!sameOrigin(request)) {
            sendJson(response, 403, { ok: false, error: '同源校验失败' })
            return
          }
          try {
            const args = await readJsonBody(request)
            const provider = args && args.provider
            const key = args && args.key
            if (!CRED_REFS[provider]) {
              sendJson(response, 400, { ok: false, error: '未知平台：' + provider })
              return
            }
            if (!key) {
              sendJson(response, 400, { ok: false, error: 'API Key 不能为空' })
              return
            }
            const credentials = host.get('credentials')
            if (!credentials) {
              sendJson(response, 500, { ok: false, error: '凭据服务不可用，无法保存' })
              return
            }
            await credentials.set(CRED_REFS[provider], key)
            sendJson(response, 200, { ok: true })
          } catch (e) {
            sendJson(response, 500, { ok: false, error: '保存失败：' + String(e && e.message || e) })
          }
        },
      }))

      // POST /dsh-api-balance-badge/clear — remove a stored key.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/clear',
        handler: async (request, response) => {
          if (request.method !== 'POST') {
            response.writeHead(405, { allow: 'POST' })
            response.end()
            return
          }
          if (!sameOrigin(request)) {
            sendJson(response, 403, { ok: false, error: '同源校验失败' })
            return
          }
          try {
            const args = await readJsonBody(request)
            const provider = args && args.provider
            if (!CRED_REFS[provider]) {
              sendJson(response, 400, { ok: false, error: '未知平台：' + provider })
              return
            }
            const credentials = host.get('credentials')
            if (!credentials) {
              sendJson(response, 500, { ok: false, error: '凭据服务不可用' })
              return
            }
            await credentials.unset(CRED_REFS[provider])
            sendJson(response, 200, { ok: true })
          } catch (e) {
            sendJson(response, 500, { ok: false, error: '清除失败：' + String(e && e.message || e) })
          }
        },
      }))

      // GET /dsh-api-balance-badge/fetch — query one provider.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/fetch',
        handler: async (request, response) => {
          if (request.method !== 'GET') {
            response.writeHead(405, { allow: 'GET' })
            response.end()
            return
          }
          try {
            const u = new URL(request.url, 'http://localhost')
            const args = {
              provider: u.searchParams.get('provider') || 'deepseek',
              customUrl: u.searchParams.get('customUrl') || '',
              customPath: u.searchParams.get('customPath') || '',
              customCurrency: u.searchParams.get('customCurrency') || 'CNY',
            }
            const result = await fetchProvider(host, args)
            sendJson(response, 200, result)
          } catch (e) {
            sendJson(response, 500, { ok: false, error: '请求失败：' + String(e && e.message || e) })
          }
        },
      }))

      // GET /dsh-api-balance-badge/fetch-all — every enabled provider in one round trip.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/fetch-all',
        handler: async (request, response) => {
          if (request.method !== 'GET') {
            response.writeHead(405, { allow: 'GET' })
            response.end()
            return
          }
          try {
            const u = new URL(request.url, 'http://localhost')
            const base = {
              customUrl: u.searchParams.get('customUrl') || '',
              customPath: u.searchParams.get('customPath') || '',
              customCurrency: u.searchParams.get('customCurrency') || 'CNY',
            }
            const credentials = host.get('credentials')
            const config = await readProviderConfig(credentials)
            const tasks = config.enabled.map((id) => fetchProvider(host, Object.assign({ provider: id }, base)))
            const settled = await Promise.allSettled(tasks)
            const results = []
            const errors = {}
            config.enabled.forEach((id, i) => {
              const r = settled[i]
              if (r.status === 'fulfilled' && r.value && r.value.ok) results.push(r.value)
              else if (r.status === 'fulfilled') errors[id] = (r.value && r.value.error) || '未知错误'
              else errors[id] = String(r.reason && r.reason.message || r.reason || '未知错误')
            })
            sendJson(response, 200, { ok: true, config, results, errors })
          } catch (e) {
            sendJson(response, 500, { ok: false, error: '请求失败：' + String(e && e.message || e) })
          }
        },
      }))

      // GET /dsh-api-balance-badge/get-providers — read the enabled list + rotation.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/get-providers',
        handler: async (request, response) => {
          if (request.method !== 'GET') {
            response.writeHead(405, { allow: 'GET' })
            response.end()
            return
          }
          try {
            const credentials = host.get('credentials')
            const config = await readProviderConfig(credentials)
            sendJson(response, 200, { ok: true, config, available: Object.keys(CRED_REFS) })
          } catch (e) {
            sendJson(response, 500, { ok: false, error: String(e && e.message || e) })
          }
        },
      }))

      // POST /dsh-api-balance-badge/save-providers — persist the enabled list + rotation.
      disposers.push(host.webServer.register({
        kind: 'exact',
        path: '/dsh-api-balance-badge/save-providers',
        handler: async (request, response) => {
          if (request.method !== 'POST') {
            response.writeHead(405, { allow: 'POST' })
            response.end()
            return
          }
          if (!sameOrigin(request)) {
            sendJson(response, 403, { ok: false, error: '同源校验失败' })
            return
          }
          try {
            const args = await readJsonBody(request)
            const credentials = host.get('credentials')
            if (!credentials) {
              sendJson(response, 500, { ok: false, error: '凭据服务不可用' })
              return
            }
            const enabled = Array.isArray(args && args.enabled)
              ? args.enabled.filter((id) => CRED_REFS[id])
              : DEFAULT_PROVIDER_ORDER
            await credentials.set(PROVIDERS_CRED, JSON.stringify({ enabled: enabled.length ? enabled : DEFAULT_PROVIDER_ORDER }))
            sendJson(response, 200, { ok: true, config: { enabled: enabled.length ? enabled : DEFAULT_PROVIDER_ORDER } })
          } catch (e) {
            sendJson(response, 500, { ok: false, error: '保存失败：' + String(e && e.message || e) })
          }
        },
      }))

      return () => {
        for (const d of disposers) d()
      }
    })
  })
}
