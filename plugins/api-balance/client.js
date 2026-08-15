// 动态 Cordis 插件 apibal-1 的 Client 半部分（code.client 参数原文，pkg-2）
return {
  inject: ['timer'],
  apply(ctx) {
    const slots = ctx.get('slots')
    if (slots === undefined) return

    styles.insert([
      '.apibal-chip{display:inline-flex;align-items:center;gap:8px;cursor:pointer;border:none;background:transparent;color:inherit;font-size:15px;padding:7px 10px;border-radius:8px;font-family:inherit;margin-left:-12px;}',
      '.apibal-chip:hover{background:rgba(128,128,128,0.14);}',
      '.apibal-chip-wide{padding:9px 14px;margin-left:-12px;}',
      '.apibal-ico{font-size:19px;line-height:1;}',
      '.apibal-txt{font-weight:600;font-variant-numeric:tabular-nums;font-size:15px;}',
      '.apibal-prov{opacity:0.6;font-size:13px;}',
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
      '.apibal-total{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;}',
      '.apibal-sub{display:flex;gap:18px;flex-wrap:wrap;margin-top:8px;opacity:0.75;font-size:12px;}',
      '.apibal-err{color:#e5484d;font-size:12px;}',
      '.apibal-hint{opacity:0.6;font-size:12px;line-height:1.5;}',
      '.apibal-badge{padding:2px 8px;border-radius:999px;font-size:11px;white-space:nowrap;}',
      '.apibal-badge-ok{background:rgba(46,160,67,0.18);}',
      '.apibal-badge-no{background:rgba(128,128,128,0.15);}',
    ].join('\n'))

    const PROVIDER_LABELS = { deepseek: 'DeepSeek', moonshot: 'Moonshot (Kimi)', openai: 'OpenAI', custom: '自定义接口' }

    let state = {
      provider: 'deepseek',
      status: {},
      storeAvailable: false,
      result: null,
      loading: false,
      error: null,
      keyInput: '',
      savedMsg: '',
      customUrl: '',
      customPath: 'balance',
      customCurrency: 'CNY',
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

    async function loadStatus() {
      try {
        const res = await host.call('balance:status', {})
        if (res && res.ok) setState({ status: res.configured || {}, storeAvailable: !!res.storeAvailable })
      } catch (e) { /* ignore */ }
    }

    async function refresh() {
      if (state.loading) return
      setState({ loading: true, error: null })
      try {
        const payload = {
          provider: state.provider,
          customUrl: state.customUrl,
          customPath: state.customPath,
          customCurrency: state.customCurrency,
        }
        if (!state.storeAvailable && state.keyInput) payload.key = state.keyInput
        const res = await host.call('balance:fetch', payload)
        setState({
          loading: false,
          result: res && res.ok ? res : null,
          error: res && res.ok ? null : (res && res.error || '未知错误'),
        })
      } catch (e) {
        setState({ loading: false, result: null, error: String(e && e.message || e) })
      }
    }

    async function saveKey() {
      const key = state.keyInput.trim()
      if (!key) { setState({ savedMsg: '请输入密钥' }); return }
      try {
        const res = await host.call('balance:save', { provider: state.provider, key })
        if (res && res.ok) {
          setState({ savedMsg: '已保存', keyInput: '' })
          await loadStatus()
          refresh()
        } else {
          setState({ savedMsg: res && res.error || '保存失败' })
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }) }
    }

    async function clearKey() {
      try {
        const res = await host.call('balance:clear', { provider: state.provider })
        if (res && res.ok) {
          setState({ savedMsg: '已清除', result: null })
          await loadStatus()
        } else {
          setState({ savedMsg: res && res.error || '清除失败' })
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }) }
    }

    function fmt(n) {
      if (n == null || !Number.isFinite(Number(n))) return '--'
      return Number(n).toFixed(2)
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
      return '适用于中转站等自建接口：填接口地址与 JSON 字段路径（如 data.balance 或 balance_infos[0].total_balance）'
    }

    function BalanceChip(props) {
      useStore()
      const wide = !!(props && props.wide)
      const result = state.result
      const label = PROVIDER_LABELS[state.provider] || state.provider
      const text = result && result.total != null
        ? (result.currency ? result.currency + ' ' : '') + fmt(result.total)
        : (state.loading ? '查询中…' : '未配置')
      const title = state.error
        ? 'API 余额（' + label + '）：' + state.error + '\n点击重试'
        : 'API 余额（' + label + '）：' + text + '\n点击刷新，密钥在 设置 › API 余额 中配置'
      React.useEffect(function () {
        async function boot() {
          await loadStatus()
          if (state.status[state.provider]) refresh()
        }
        boot()
        const dispose = ctx.interval(function () {
          if (state.status[state.provider]) refresh()
        }, 10 * 60 * 1000)
        return dispose
      }, [])
      return React.createElement('button', {
        className: 'apibal-chip' + (wide ? ' apibal-chip-wide' : ''),
        title: title,
        type: 'button',
        onClick: function () { refresh() },
      },
        wide
          ? [
              React.createElement('span', { key: 'i', className: 'apibal-ico' }, '💰'),
              React.createElement('span', { key: 't', className: 'apibal-txt' }, text),
              React.createElement('span', { key: 'p', className: 'apibal-prov' }, label),
            ]
          : React.createElement('span', { className: 'apibal-ico' }, '💰'))
    }

    function BalanceSettings() {
      useStore()
      const p = state.provider
      const configured = !!state.status[p]
      const result = state.result
      const keyPlaceholder = p === 'openai' ? 'sess-...' : 'sk-...（或其他密钥）'
      const subRows = []
      if (result && result.granted != null) subRows.push(['赠送', fmt(result.granted)])
      if (result && result.toppedUp != null) subRows.push(['充值', fmt(result.toppedUp)])
      if (result && result.available != null) subRows.push(['可用', fmt(result.available)])
      if (result && result.used != null) subRows.push(['已用', fmt(result.used)])
      if (result && result.atText) subRows.push(['更新', result.atText])

      const children = [
        React.createElement('h3', { key: 'h1', className: 'apibal-h' }, '数据源'),
        React.createElement('div', { key: 'r1', className: 'apibal-row' },
          React.createElement('span', { className: 'apibal-label' }, '平台'),
          React.createElement('select', {
            className: 'apibal-select',
            value: p,
            onChange: function (e) {
              const v = e.target.value
              setState({ provider: v, result: null, error: null, savedMsg: '' })
              if (state.status[v]) refresh()
            },
          },
            opt('deepseek', 'DeepSeek'),
            opt('moonshot', 'Moonshot (Kimi)'),
            opt('openai', 'OpenAI'),
            opt('custom', '自定义接口')),
        ),
        React.createElement('div', { key: 'hint1', className: 'apibal-hint' }, providerHint(p)),
        React.createElement('h3', { key: 'h2', className: 'apibal-h' }, '密钥'),
        React.createElement('div', { key: 'r2', className: 'apibal-row' },
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
            : '凭据服务不可用：密钥仅保存在本次页面内存中，刷新后需重新输入。')
          + (state.savedMsg ? '　' + state.savedMsg : '')),
      ]

      if (p === 'custom') {
        children.push(
          React.createElement('h3', { key: 'h3', className: 'apibal-h' }, '自定义接口'),
          React.createElement('div', { key: 'r3', className: 'apibal-row' },
            React.createElement('span', { className: 'apibal-label' }, '接口地址'),
            React.createElement('input', {
              className: 'apibal-input',
              placeholder: 'https://…（GET，Bearer 鉴权）',
              value: state.customUrl,
              onChange: function (e) { setState({ customUrl: e.target.value }) },
            })),
          React.createElement('div', { key: 'r4', className: 'apibal-row' },
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
        React.createElement('h3', { key: 'h4', className: 'apibal-h' }, '余额'),
        React.createElement('div', { key: 'r5', className: 'apibal-row' },
          React.createElement('button', {
            className: 'apibal-btn',
            type: 'button',
            disabled: state.loading,
            onClick: function () { refresh() },
          }, state.loading ? '查询中…' : '立即刷新')),
      )

      if (state.error) {
        children.push(React.createElement('div', { key: 'err', className: 'apibal-err' }, state.error))
      }

      if (result) {
        children.push(
          React.createElement('div', { key: 'card', className: 'apibal-card' },
            React.createElement('div', { className: 'apibal-total' }, fmt(result.total) + ' ' + (result.currency || '')),
            subRows.length
              ? React.createElement('div', { className: 'apibal-sub' },
                  subRows.map(function (row, i) {
                    return React.createElement('span', { key: i }, row[0] + '：' + row[1])
                  }))
              : null),
        )
      }

      children.push(React.createElement('div', { key: 'hint3', className: 'apibal-hint' },
        '余额同时显示在左下角侧边栏「设置」旁的常驻徽章中，点击徽章即可刷新。'))

      return React.createElement('div', { className: 'apibal-wrap' }, children)
    }

    slots.inject('settings.section', () => slots.register(
      { name: 'settings.section', id: 'api-balance', order: 30, label: 'API 余额' },
      () => React.createElement(BalanceSettings),
    ))

    slots.inject('sidebar.footer.action', () => slots.register(
      { name: 'sidebar.footer.action', id: 'api-balance-chip', order: 20, label: 'API 余额' },
      (props) => React.createElement(BalanceChip, { wide: !!(props && props.wide) }),
    ))
  },
}
