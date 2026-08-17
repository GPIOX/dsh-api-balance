// 动态 Cordis 插件 apibal-1 的 Client 半部分（code.client 参数原文）
// 与打包版 client/client.js 功能对齐：每个已配置的服务商一个独立悬浮徽章。
return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    styles.insert([
      '.apibal-float{position:fixed;z-index:60;display:inline-flex;align-items:center;gap:0.5em;padding:0.5em 0.8em;border-radius:10px;background:rgba(128,128,128,0.14);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(128,128,128,0.3);color:inherit;cursor:grab;user-select:none;-webkit-user-select:none;touch-action:none;font-family:inherit;max-width:70vw;}',
      '.apibal-float:active{cursor:grabbing;}',
      '.apibal-on-dark{color:#f4f4f5;}',
      '.apibal-on-light{color:#1b1b1f;}',
      '.apibal-ico{font-size:1.3em;line-height:1;}',
      '.apibal-txt{font-weight:600;font-variant-numeric:tabular-nums;font-size:1em;white-space:nowrap;}',
      '.apibal-prov{opacity:0.62;font-size:0.8em;white-space:nowrap;}',
      '.apibal-resize{position:absolute;right:-5px;bottom:-5px;width:14px;height:14px;cursor:nwse-resize;touch-action:none;border-right:2px solid currentColor;border-bottom:2px solid currentColor;opacity:0.75;border-bottom-right-radius:4px;}',
      '.apibal-wrap{display:flex;flex-direction:column;gap:14px;padding:14px 2px;max-width:560px;font-size:13px;}',
      '.apibal-h{font-size:13px;font-weight:600;margin:0;opacity:0.85;}',
      '.apibal-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.apibal-label{min-width:96px;opacity:0.7;font-size:12px;}',
      '.apibal-input{flex:1;min-width:200px;padding:6px 8px;border:1px solid rgba(128,128,128,0.35);border-radius:6px;background:transparent;color:inherit;font-family:inherit;font-size:13px;box-sizing:border-box;}',
      '.apibal-select{padding:6px 8px;border:1px solid rgba(128,128,128,0.35);border-radius:6px;background:transparent;color:inherit;font-family:inherit;font-size:13px;}',
      '.apibal-btn{padding:6px 12px;border:1px solid rgba(128,128,128,0.35);border-radius:6px;background:rgba(128,128,128,0.1);color:inherit;cursor:pointer;font-family:inherit;font-size:13px;white-space:nowrap;}',
      '.apibal-btn:hover{background:rgba(128,128,128,0.2);}',
      '.apibal-btn:disabled{opacity:0.5;cursor:default;}',
      '.apibal-card{border:1px solid rgba(128,128,128,0.25);border-radius:10px;padding:14px 16px;}',
      '.apibal-err{color:#e5484d;font-size:12px;}',
      '.apibal-hint{opacity:0.6;font-size:12px;line-height:1.5;}',
      '.apibal-badge{padding:2px 8px;border-radius:999px;font-size:11px;white-space:nowrap;}',
      '.apibal-badge-ok{background:rgba(46,160,67,0.18);}',
      '.apibal-badge-no{background:rgba(128,128,128,0.15);}',
      '.apibal-plist{display:flex;flex-direction:column;gap:6px;}',
      '.apibal-plist-row{display:flex;align-items:center;gap:8px;}',
      '.apibal-plist-name{flex:1;min-width:120px;}',
      '.apibal-prow{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 0;}',
      '.apibal-pname{font-weight:600;}',
      '.apibal-pval{font-variant-numeric:tabular-nums;font-weight:600;}',
      '.apibal-psub{font-size:11px;opacity:0.65;margin-top:2px;}',
      '.apibal-bars{display:flex;flex-direction:column;gap:4px;margin:2px 0 8px;}',
      '.apibal-bar-row{display:flex;align-items:center;gap:8px;font-size:12px;}',
      '.apibal-bar-label{width:26px;opacity:0.7;flex:none;}',
      '.apibal-bar-track{flex:1 1 200px;min-width:140px;max-width:240px;height:6px;border-radius:3px;background:rgba(128,128,128,0.25);overflow:hidden;}',
      '.apibal-bar-fill{height:100%;border-radius:3px;}',
            '.apibal-bar-text{flex:1;min-width:0;text-align:right;opacity:0.8;font-variant-numeric:tabular-nums;white-space:nowrap;}',
      '.apibal-quota{flex-direction:column;align-items:flex-start;gap:2px;}',
      '.apibal-qhead{display:flex;align-items:center;gap:0.5em;}',
      '.apibal-qrows{display:flex;flex-direction:column;gap:1px;margin-top:2px;}',
      '.apibal-qrow{display:flex;gap:0.6em;white-space:nowrap;font-size:0.85em;}',
      '.apibal-qlabel{opacity:0.7;width:1.8em;flex:none;}',
      '.apibal-qval{font-variant-numeric:tabular-nums;}',
    ].join('\n'))

    const PROVIDER_LABELS = {
      deepseek: 'DeepSeek',
      'opencode-go': 'OpenCode Go',
      moonshot: 'Moonshot (Kimi)',
      openai: 'OpenAI',
      custom: '自定义接口',
    }
    const PROVIDER_ORDER_ALL = ['deepseek', 'opencode-go', 'moonshot', 'openai', 'custom']
    const QUOTA_LABELS = { rolling: '5h', weekly: '周', monthly: '月' }
    const BADGE_BASE = { x: 12, y: 12 }
    const BADGE_STACK = 46

    let state = {
      providers: [],
      status: {},
      storeAvailable: false,
      results: {},
      errors: {},
      loading: false,
      error: null,
      keyInput: '',
      savedMsg: '',
      keyProvider: 'deepseek',
      customUrl: '',
      customPath: 'balance',
      customCurrency: 'CNY',
      visible: true,
      refreshSec: 60,
      badges: {},
      now: 0,
    }
    const listeners = []
    function setState(patch) {
      state = Object.assign({}, state, patch)
      for (const fn of listeners.slice()) fn()
    }
    function subscribe(fn) {
      listeners.push(fn)
      return function () {
        const i = listeners.indexOf(fn)
        if (i >= 0) listeners.splice(i, 1)
      }
    }

    function getDefaultPos(id) {
      let idx = state.providers.indexOf(id)
      if (idx < 0) idx = 0
      return { x: BADGE_BASE.x, y: BADGE_BASE.y + idx * BADGE_STACK }
    }
    function getBadge(id) {
      return state.badges[id] || { pos: getDefaultPos(id), scale: 1, bgKind: null }
    }
    function setBadge(id, patch) {
      const cur = getBadge(id)
      const next = Object.assign({}, cur, patch)
      const badges = Object.assign({}, state.badges)
      badges[id] = next
      setState({ badges })
    }

    const badgeEls = {}
    function detectScheme(id) {
      const el = badgeEls[id]
      if (!el) return
      let kind = null
      try {
        const doc = el.ownerDocument
        const view = doc.defaultView
        if (!view || !doc.elementsFromPoint) return
        const rect = el.getBoundingClientRect()
        const x = rect.left + rect.width / 2
        const y = rect.top + rect.height / 2
        const list = doc.elementsFromPoint(x, y)
        for (const node of list) {
          if (!node || node === el || el.contains(node)) continue
          let cur = node
          for (let i = 0; i < 10 && cur && cur.nodeType === 1; i++) {
            const bg = view.getComputedStyle(cur).backgroundColor
            const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(bg)
            if (m) {
              const a = m[4] === undefined ? 1 : Number(m[4])
              if (a > 0.5) {
                const lum = 0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3])
                kind = lum > 140 ? 'light' : 'dark'
                break
              }
            }
            cur = cur.parentElement
          }
          if (kind) break
        }
      } catch (e) { /* ignore */ }
      if (kind !== getBadge(id).bgKind) setBadge(id, { bgKind: kind })
    }

    function beginDrag(id, e, kind) {
      if (e.pointerType === 'mouse' && e.button !== 0) return
      let moved = false
      const el = e.currentTarget
      try { el.setPointerCapture(e.pointerId) } catch (err) { /* ignore */ }
      const b = getBadge(id)
      const startX = e.clientX
      const startY = e.clientY
      const origX = b.pos.x
      const origY = b.pos.y
      const scale0 = b.scale
      function move(ev) {
        const dx = ev.clientX - startX
        const dy = ev.clientY - startY
        if (kind === 'resize') {
          setBadge(id, { scale: Math.min(2.5, Math.max(0.7, scale0 + (dx - dy) / 180)) })
        } else {
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true
          setBadge(id, { pos: { x: origX + dx, y: origY - dy } })
        }
      }
      function up() {
        el.removeEventListener('pointermove', move)
        el.removeEventListener('pointerup', up)
        el.removeEventListener('pointercancel', up)
        if (kind === 'move' && !moved) refreshAll()
        detectScheme(id)
      }
      el.addEventListener('pointermove', move)
      el.addEventListener('pointerup', up)
      el.addEventListener('pointercancel', up)
    }

    async function loadStatus() {
      try {
        const res = await host.call('balance:status', {})
        if (res && res.ok) setState({ status: res.configured || {}, storeAvailable: !!res.storeAvailable })
      } catch (e) { /* ignore */ }
    }

    async function loadConfig() {
      try {
        const res = await host.call('balance:get-providers', {})
        if (res && res.ok && res.config) {
          setState({ providers: res.config.enabled || [] })
        }
      } catch (e) { /* ignore */ }
    }

    async function refreshAll() {
      if (state.loading) return
      setState({ loading: true, error: null })
      try {
        const res = await host.call('balance:fetch-all', {
          customUrl: state.customUrl,
          customPath: state.customPath,
          customCurrency: state.customCurrency,
        })
        const byId = {}
        const errs = {}
        if (res && res.ok) {
          (res.results || []).forEach(function (r) { if (r && r.provider) byId[r.provider] = r })
          errs = res.errors || {}
          setState({
            loading: false,
            results: byId,
            errors: errs,
            providers: (res.config && res.config.enabled) || state.providers,
            now: Date.now(),
          })
        } else {
          setState({ loading: false, error: res && res.error || '未知错误' })
        }
      } catch (e) {
        setState({ loading: false, error: String(e && e.message || e) })
      }
    }

    async function saveKey() {
      const key = state.keyInput.trim()
      if (!key) { setState({ savedMsg: '请输入密钥' }); return }
      try {
        const res = await host.call('balance:save', { provider: state.keyProvider, key })
        if (res && res.ok) {
          setState({ savedMsg: '已保存', keyInput: '' })
          await loadStatus()
          refreshAll()
        } else {
          setState({ savedMsg: res && res.error || '保存失败' })
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }) }
    }

    async function clearKey() {
      try {
        const res = await host.call('balance:clear', { provider: state.keyProvider })
        if (res && res.ok) {
          setState({ savedMsg: '已清除' })
          await loadStatus()
          refreshAll()
        } else {
          setState({ savedMsg: res && res.error || '清除失败' })
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }) }
    }

    async function saveProviders() {
      try {
        const res = await host.call('balance:save-providers', { enabled: state.providers })
        if (res && res.ok && res.config) {
          setState({ savedMsg: '已保存', providers: res.config.enabled })
        } else {
          setState({ savedMsg: res && res.error || '保存失败' })
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }) }
    }

    function toggleProvider(id) {
      const list = state.providers.slice()
      const i = list.indexOf(id)
      if (i >= 0) list.splice(i, 1)
      else list.push(id)
      setState({ providers: list })
    }

    function moveProvider(id, dir) {
      const list = state.providers.slice()
      const i = list.indexOf(id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return
      const t = list[i]
      list[i] = list[j]
      list[j] = t
      setState({ providers: list })
    }

    function fmt(n) {
      if (n == null || !Number.isFinite(Number(n))) return '--'
      return Number(n).toFixed(2)
    }

    function fmtCountdown(resetsAt, now) {
      if (!resetsAt) return ''
      const t = new Date(resetsAt).getTime() - now
      if (!Number.isFinite(t) || t <= 0) return '已重置'
      const s = Math.floor(t / 1000)
      const h = Math.floor(s / 3600)
      const m = Math.floor((s % 3600) / 60)
      const sec = s % 60
      function p2(n) { return (n < 10 ? '0' : '') + n }
      return p2(h) + ':' + p2(m) + ':' + p2(sec)
    }

    function fmtDate(resetsAt) {
      const d = new Date(resetsAt)
      if (!Number.isFinite(d.getTime())) return ''
      return (d.getMonth() + 1) + '月' + d.getDate() + '日'
    }

    function barColor(percent) {
      if (percent < 50) return '#46a758'
      if (percent < 80) return '#d29922'
      return '#e5484d'
    }

    function useStore() {
      const [, force] = React.useState(0)
      React.useEffect(function () {
        return subscribe(function () { force(function (v) { return v + 1 }) })
      }, [])
    }

    function opt(value, label) {
      return React.createElement('option', { value: value }, label)
    }

    function providerHint(p) {
      if (p === 'deepseek') return '使用 DeepSeek 开放平台 API Key（sk-...），查询 https://api.deepseek.com/user/balance'
      if (p === 'moonshot') return '使用 Moonshot/Kimi 开放平台 API Key（sk-...）'
      if (p === 'openai') return 'OpenAI 官方不支持用 API Key 查余额：请粘贴浏览器登录后的会话 token（sess-...），有效期有限'
      if (p === 'opencode-go') return 'OpenCode Go 订阅额度：密钥通常已由 DSH 模型设置页写入 OPENCODE_GO_API_KEY，一般无需在这里填写'
      return '适用于中转站等自建接口：填接口地址与 JSON 字段路径（如 data.balance 或 balance_infos[0].total_balance）'
    }

    function badgeText(res, id) {
      if (!res) return state.errors[id] ? '出错' : (state.loading ? '查询中…' : '--')
      if (res.type === 'balance') return (res.currency ? res.currency + ' ' : '') + fmt(res.total)
      if (res.type === 'quota' && res.windows) {
        const w = res.windows
        return '5h ' + (w.rolling ? w.rolling.remaining : '--') + '% · 周 ' + (w.weekly ? w.weekly.remaining : '--') + '% · 月 ' + (w.monthly ? w.monthly.remaining : '--') + '%'
      }
      return '--'
    }

    function badgeTitle(res, err, id, label) {
      let t = label + ' · 点击刷新\n按住拖动移动，拖拽右下角缩放'
      if (err) return t + '\n' + err
      if (!res) return t
      if (res.type === 'balance') {
        const bits = []
        if (res.granted != null) bits.push('赠送 ' + fmt(res.granted))
        if (res.toppedUp != null) bits.push('充值 ' + fmt(res.toppedUp))
        if (res.available != null) bits.push('可用 ' + fmt(res.available))
        if (res.used != null) bits.push('已用 ' + fmt(res.used))
        if (bits.length) t += '\n' + bits.join(' · ')
        return t
      }
      if (res.type === 'quota' && res.windows) {
        const keys = ['rolling', 'weekly', 'monthly']
        for (let i = 0; i < keys.length; i++) {
          const w = res.windows[keys[i]]
          if (!w) continue
          let line = QUOTA_LABELS[keys[i]] + ' 已用 ' + w.percent + '% · 剩 ' + w.remaining + '%'
          if (w.resetsAt) line += ' · ' + fmtCountdown(w.resetsAt, state.now) + ' 后重置'
          t += '\n' + line
        }
      }
      return t
    }

    function quotaBars(res) {
      const bars = []
      if (res && res.type === 'quota' && res.windows) {
        const keys = ['rolling', 'weekly', 'monthly']
        for (let i = 0; i < keys.length; i++) {
          const w = res.windows[keys[i]]
          if (!w) continue
          const pct = Math.min(100, Math.max(0, w.percent))
          let resetText = ''
          if (w.resetsAt) {
            resetText = keys[i] === 'rolling' ? fmtCountdown(w.resetsAt, state.now) : fmtDate(w.resetsAt)
          }
          let text = '已用 ' + pct + '% · 剩 ' + w.remaining + '%'
          if (resetText) text += ' · ' + resetText + ' 重置'
          bars.push(
            React.createElement('div', { key: keys[i], className: 'apibal-bar-row' },
              React.createElement('span', { className: 'apibal-bar-label' }, QUOTA_LABELS[keys[i]]),
              React.createElement('div', { className: 'apibal-bar-track' },
                React.createElement('div', { className: 'apibal-bar-fill', style: { width: pct + '%', background: barColor(pct) } })),
              React.createElement('span', { className: 'apibal-bar-text' }, text)),
          )
        }
      }
      return bars
    }

    function providerRow(id) {
      const label = PROVIDER_LABELS[id] || id
      const res = state.results[id]
      const err = state.errors[id]
      const children = [
        React.createElement('div', { key: 'head', className: 'apibal-prow' },
          React.createElement('span', { className: 'apibal-pname' }, label),
          React.createElement('span', { className: 'apibal-pval' }, badgeText(res, id))),
      ]
      if (err) children.push(React.createElement('div', { key: 'err', className: 'apibal-err' }, err))
      if (res && res.type === 'balance') {
        const bits = []
        if (res.granted != null) bits.push('赠送 ' + fmt(res.granted))
        if (res.toppedUp != null) bits.push('充值 ' + fmt(res.toppedUp))
        if (res.available != null) bits.push('可用 ' + fmt(res.available))
        if (res.used != null) bits.push('已用 ' + fmt(res.used))
        if (bits.length) children.push(React.createElement('div', { key: 'sub', className: 'apibal-psub' }, bits.join(' · ')))
      }
      if (res && res.type === 'quota') {
        children.push(React.createElement('div', { key: 'bars', className: 'apibal-bars' }, quotaBars(res)))
      }
      return React.createElement('div', { key: id }, children)
    }

    function FloatingBadge(props) {
      const id = props.id
      useStore()
      if (!state.visible) return null
      if (!state.status[id]) return null
      const res = state.results[id]
      const err = state.errors[id]
      const label = PROVIDER_LABELS[id] || id
      const b = getBadge(id)
      const cls = 'apibal-float'
        + (b.bgKind === 'dark' ? ' apibal-on-dark' : b.bgKind === 'light' ? ' apibal-on-light' : '')
      const resizeHandle = React.createElement('span', {
        className: 'apibal-resize',
        onPointerDown: function (e) { e.stopPropagation(); beginDrag(id, e, 'resize') },
      })
      const base = {
        className: cls,
        ref: function (node) { badgeEls[id] = node },
        style: {
          left: b.pos.x + 'px',
          bottom: b.pos.y + 'px',
          fontSize: Math.round(15 * b.scale) + 'px',
        },
        title: badgeTitle(res, err, id, label),
        onPointerDown: function (e) { beginDrag(id, e, 'move') },
      }
      if (res && res.type === 'quota' && res.windows) {
        const w = res.windows
        const keys = ['rolling', 'weekly', 'monthly']
        const rows = []
        for (let i = 0; i < keys.length; i++) {
          const win = w[keys[i]]
          if (!win) continue
          rows.push(
            React.createElement('div', { key: keys[i], className: 'apibal-qrow' },
              React.createElement('span', { className: 'apibal-qlabel' }, QUOTA_LABELS[keys[i]]),
              React.createElement('span', { className: 'apibal-qval' }, '剩 ' + win.remaining + '%')),
          )
        }
        return React.createElement('div', Object.assign({}, base, { className: cls + ' apibal-quota' }),
          React.createElement('div', { className: 'apibal-qhead' },
            React.createElement('span', { className: 'apibal-ico' }, '💰'),
            React.createElement('span', { className: 'apibal-prov' }, label)),
          React.createElement('div', { className: 'apibal-qrows' }, rows),
          resizeHandle)
      }
      return React.createElement('div', base,
        React.createElement('span', { className: 'apibal-ico' }, '💰'),
        React.createElement('span', { className: 'apibal-txt' }, badgeText(res, id)),
        React.createElement('span', { className: 'apibal-prov' }, label),
        resizeHandle)
    }

    function App() {
      useStore()
      React.useEffect(function () {
        async function boot() {
          await loadStatus()
          await loadConfig()
          refreshAll()
        }
        boot()
        const tick = ctx.interval(function () { setState({ now: Date.now() }) }, 1000)
        const sample = ctx.interval(function () {
          for (let i = 0; i < state.providers.length; i++) detectScheme(state.providers[i])
        }, 1500)
        return function () {
          tick()
          sample()
        }
      }, [])
      React.useEffect(function () {
        const secs = Math.max(30, Math.round(Number(state.refreshSec) || 60))
        const d = ctx.interval(function () { refreshAll() }, secs * 1000)
        return d
      }, [state.refreshSec])
      const badges = []
      for (let i = 0; i < state.providers.length; i++) {
        badges.push(React.createElement(FloatingBadge, { key: state.providers[i], id: state.providers[i] }))
      }
      return React.createElement('div', { style: { display: 'contents' } }, badges)
    }

    function BalanceSettings() {
      useStore()
      const configured = !!state.status[state.keyProvider]
      const keyPlaceholder = state.keyProvider === 'openai' ? 'sess-...' : 'sk-...（或其他密钥）'

      const plistRows = []
      for (let i = 0; i < PROVIDER_ORDER_ALL.length; i++) {
        const id = PROVIDER_ORDER_ALL[i]
        const checked = state.providers.indexOf(id) >= 0
        plistRows.push(
          React.createElement('div', { key: id, className: 'apibal-plist-row' },
            React.createElement('input', {
              type: 'checkbox',
              checked: checked,
              onChange: function () { toggleProvider(id) },
            }),
            React.createElement('span', { className: 'apibal-plist-name' }, PROVIDER_LABELS[id]),
            React.createElement('button', {
              className: 'apibal-btn',
              type: 'button',
              disabled: !checked,
              onClick: function () { moveProvider(id, -1) },
            }, '↑'),
            React.createElement('button', {
              className: 'apibal-btn',
              type: 'button',
              disabled: !checked,
              onClick: function () { moveProvider(id, 1) },
            }, '↓'),
            React.createElement('span', {
              className: 'apibal-badge ' + (state.status[id] ? 'apibal-badge-ok' : 'apibal-badge-no'),
            }, state.status[id] ? '已配置' : '未配置')),
        )
      }

      const children = [
        React.createElement('h3', { key: 'h1', className: 'apibal-h' }, '提供商'),
        React.createElement('div', { key: 'plist', className: 'apibal-plist' }, plistRows),
        React.createElement('div', { key: 'r1', className: 'apibal-row' },
          React.createElement('button', { className: 'apibal-btn', type: 'button', onClick: saveProviders }, '保存提供商列表'),
          React.createElement('span', { className: 'apibal-hint' }, '每个已配置的提供商一个悬浮徽章，↑↓ 调整堆叠顺序')
          + (state.savedMsg ? '　' + state.savedMsg : '')),
        React.createElement('h3', { key: 'h2', className: 'apibal-h' }, '密钥'),
        React.createElement('div', { key: 'r2', className: 'apibal-row' },
          React.createElement('span', { className: 'apibal-label' }, '平台'),
          React.createElement('select', {
            className: 'apibal-select',
            value: state.keyProvider,
            onChange: function (e) { setState({ keyProvider: e.target.value, keyInput: '', savedMsg: '' }) },
          },
            opt('deepseek', 'DeepSeek'),
            opt('opencode-go', 'OpenCode Go'),
            opt('moonshot', 'Moonshot (Kimi)'),
            opt('openai', 'OpenAI'),
            opt('custom', '自定义接口'))),
        React.createElement('div', { key: 'hint1', className: 'apibal-hint' }, providerHint(state.keyProvider)),
        React.createElement('div', { key: 'r3', className: 'apibal-row' },
          React.createElement('input', {
            className: 'apibal-input',
            type: 'password',
            placeholder: keyPlaceholder,
            value: state.keyInput,
            onChange: function (e) { setState({ keyInput: e.target.value }) },
          }),
          React.createElement('button', { className: 'apibal-btn', type: 'button', disabled: !state.keyInput.trim(), onClick: saveKey }, '保存'),
          React.createElement('button', { className: 'apibal-btn', type: 'button', onClick: clearKey }, '清除'),
          React.createElement('span', {
            className: 'apibal-badge ' + (configured ? 'apibal-badge-ok' : 'apibal-badge-no'),
          }, configured ? '已配置' : '未配置')),
        React.createElement('div', { key: 'hint2', className: 'apibal-hint' },
          (state.storeAvailable
            ? '密钥保存在本机 Harness 凭据库（~/.dsh/.credentials.yaml），不会回传到页面。'
            : '凭据服务不可用：无法保存密钥。')),
      ]

      if (state.keyProvider === 'custom') {
        children.push(
          React.createElement('h3', { key: 'h3', className: 'apibal-h' }, '自定义接口'),
          React.createElement('div', { key: 'r4', className: 'apibal-row' },
            React.createElement('span', { className: 'apibal-label' }, '接口地址'),
            React.createElement('input', {
              className: 'apibal-input',
              placeholder: 'https://…（GET，Bearer 鉴权）',
              value: state.customUrl,
              onChange: function (e) { setState({ customUrl: e.target.value }) },
            })),
          React.createElement('div', { key: 'r5', className: 'apibal-row' },
            React.createElement('span', { className: 'apibal-label' }, '余额字段'),
            React.createElement('input', {
              className: 'apibal-input',
              placeholder: '如 data.available_balance',
              value: state.customPath,
              onChange: function (e) { setState({ customPath: e.target.value }) },
            }),
            React.createElement('span', { className: 'apibal-label' }, '币种'),
            React.createElement('input', {
              className: 'apibal-input',
              placeholder: 'CNY / USD',
              value: state.customCurrency,
              onChange: function (e) { setState({ customCurrency: e.target.value }) },
            })),
        )
      }

      children.push(
        React.createElement('h3', { key: 'h4', className: 'apibal-h' }, '数据'),
        React.createElement('div', { key: 'r6', className: 'apibal-row' },
          React.createElement('button', {
            className: 'apibal-btn',
            type: 'button',
            disabled: state.loading,
            onClick: function () { refreshAll() },
          }, state.loading ? '查询中…' : '立即刷新'),
          React.createElement('span', { className: 'apibal-label', style: { minWidth: '0' } }, '自动刷新间隔'),
          React.createElement('input', {
            className: 'apibal-input',
            type: 'number',
            min: '30',
            step: '10',
            value: String(state.refreshSec),
            style: { flex: '0 0 96px', minWidth: '0' },
            onChange: function (e) {
              const v = Number(e.target.value)
              const secs = Number.isFinite(v) ? Math.max(30, Math.round(v)) : 60
              setState({ refreshSec: secs })
            },
          }),
          React.createElement('span', { className: 'apibal-hint' }, '秒（最短 30 秒）')),
      )

      if (state.error) {
        children.push(React.createElement('div', { key: 'err', className: 'apibal-err' }, state.error))
      }

      const dataRows = []
      for (let k = 0; k < state.providers.length; k++) {
        dataRows.push(providerRow(state.providers[k]))
      }
      if (dataRows.length) {
        children.push(
          React.createElement('div', { key: 'card', className: 'apibal-card' },
            React.createElement('div', { key: 'rows' }, dataRows)),
        )
      }

      children.push(
        React.createElement('h3', { key: 'h5', className: 'apibal-h' }, '悬浮徽章'),
        React.createElement('div', { key: 'r7', className: 'apibal-row' },
          React.createElement('span', { className: 'apibal-label' }, '显示徽章'),
          React.createElement('input', {
            type: 'checkbox',
            checked: state.visible,
            onChange: function (e) { setState({ visible: e.target.checked }) },
          })),
        React.createElement('div', { key: 'r8', className: 'apibal-row' },
          React.createElement('button', {
            className: 'apibal-btn',
            type: 'button',
            onClick: function () { setState({ badges: {} }) },
          }, '重置全部位置与大小')),
        React.createElement('div', { key: 'hint3', className: 'apibal-hint' },
          '每个已配置的提供商一个悬浮徽章：按住拖动、拖拽右下角手柄缩放、点击刷新。文字颜色随下方内容明暗自适应。'),
      )

      return React.createElement('div', { className: 'apibal-wrap' }, children)
    }

    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'api-balance', order: 30, label: 'API 余额' },
      () => React.createElement(BalanceSettings),
    ))

    slots.inject('shell.overlay', () => slots.register(
      { name: 'shell.overlay', id: 'api-balance-widget', order: 20, label: 'API 余额' },
      () => React.createElement(App),
    ))
  },
}
