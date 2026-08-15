/**
 * dsh-api-balance-badge host entry: mounts the /dsh-api-balance-badge/* HTTP routes once
 * the profile composes the webServer service. Balance lookups run through the
 * shell service (curl); API keys live in the Harness credential store
 * (~/.dsh/.credentials.yaml) and reach curl via environment, never on the
 * command line and never back to the browser.
 */
export const name = 'dsh-api-balance-badge'

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
    try {
      const resolved = await credentials.resolve(CRED_REFS[provider])
      if (resolved) {
        const value = typeof resolved === 'string' ? resolved : (resolved.value || '')
        if (value) return value
      }
    } catch {
      /* fall through */
    }
  }
  return typeof fallbackKey === 'string' ? fallbackKey : ''
}

async function fetchBalance(host, args) {
  const provider = args && args.provider
  if (!CRED_REFS[provider]) return { ok: false, error: '未知平台：' + provider }
  const shell = host.get('shell')
  if (!shell) return { ok: false, error: 'shell 服务不可用，无法发起请求' }
  const credentials = host.get('credentials')
  const key = await resolveKey(credentials, provider, args && args.key)
  if (!key) return { ok: false, error: '尚未配置密钥，请先到设置 › API 余额 中保存' }

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
            let ok = false
            if (credentials) {
              try {
                const resolved = await credentials.resolve(CRED_REFS[p])
                const value = resolved ? (typeof resolved === 'string' ? resolved : (resolved.value || '')) : ''
                ok = !!value
              } catch {
                ok = false
              }
            }
            configured[p] = ok
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

      // GET /dsh-api-balance-badge/fetch — query one provider's balance.
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
            const result = await fetchBalance(host, args)
            sendJson(response, 200, result)
          } catch (e) {
            sendJson(response, 500, { ok: false, error: '请求失败：' + String(e && e.message || e) })
          }
        },
      }))

      return () => {
        for (const d of disposers) d()
      }
    })
  })
}
