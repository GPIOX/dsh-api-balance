/**
 * dsh-api-balance-badge client bundle (built factory form, served under /plugins).
 * The only external module is the app shell's static `react` entry.
 * Talks to the host half over the package's own HTTP routes
 * (/dsh-api-balance-badge/*); the API key never crosses the wire back to the page.
 */
window.__ModuleLoader__.load({ id: "dsh-api-balance-badge", factory: (require) => {
  var module = { exports: {} };
  var exports = module.exports;
  Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
  var React = require("react");

  var name = "dsh-api-balance-badge";
  var inject = ["slots", "timer"];

  function apply(ctx) {
    var css = [
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
      '.apibal-total{font-size:26px;font-weight:700;font-variant-numeric:tabular-nums;}',
      '.apibal-sub{display:flex;gap:18px;flex-wrap:wrap;margin-top:8px;opacity:0.75;font-size:12px;}',
      '.apibal-err{color:#e5484d;font-size:12px;}',
      '.apibal-hint{opacity:0.6;font-size:12px;line-height:1.5;}',
      '.apibal-badge{padding:2px 8px;border-radius:999px;font-size:11px;white-space:nowrap;}',
      '.apibal-badge-ok{background:rgba(46,160,67,0.18);}',
      '.apibal-badge-no{background:rgba(128,128,128,0.15);}',
    ].join("\n");

    var styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    ctx.effect(function () {
      return function () {
        if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      };
    });

    var PROVIDER_LABELS = { deepseek: "DeepSeek", moonshot: "Moonshot (Kimi)", openai: "OpenAI", custom: "自定义接口" };

    var state = {
      provider: "deepseek",
      status: {},
      storeAvailable: false,
      result: null,
      loading: false,
      error: null,
      keyInput: "",
      savedMsg: "",
      customUrl: "",
      customPath: "balance",
      customCurrency: "CNY",
      pos: { x: 12, y: 12 },
      scale: 1,
      visible: true,
      bgKind: null,
      refreshSec: 60,
    };
    var listeners = [];
    function setState(patch) {
      state = Object.assign({}, state, patch);
      for (var i = 0; i < listeners.length; i++) listeners[i]();
    }
    function subscribe(fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    }

    function qs(obj) {
      var parts = [];
      for (var k in obj) {
        if (obj[k] != null && obj[k] !== "") parts.push(encodeURIComponent(k) + "=" + encodeURIComponent(String(obj[k])));
      }
      return parts.join("&");
    }

    function api(method, path, body) {
      var init = { method: method, headers: { "content-type": "application/json" } };
      if (body !== undefined) init.body = JSON.stringify(body);
      return fetch("/dsh-api-balance-badge" + path, init).then(function (r) { return r.json(); });
    }

    var badgeEl = null;
    function detectScheme() {
      if (!badgeEl) return;
      var kind = null;
      try {
        var rect = badgeEl.getBoundingClientRect();
        var x = rect.left + rect.width / 2;
        var y = rect.top + rect.height / 2;
        var list = document.elementsFromPoint(x, y);
        for (var i = 0; i < list.length; i++) {
          var node = list[i];
          if (!node || node === badgeEl || badgeEl.contains(node)) continue;
          var cur = node;
          for (var d = 0; d < 10 && cur && cur.nodeType === 1; d++) {
            var bg = getComputedStyle(cur).backgroundColor;
            var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)/.exec(bg);
            if (m) {
              var a = m[4] === undefined ? 1 : Number(m[4]);
              if (a > 0.5) {
                var lum = 0.299 * Number(m[1]) + 0.587 * Number(m[2]) + 0.114 * Number(m[3]);
                kind = lum > 140 ? "light" : "dark";
                break;
              }
            }
            cur = cur.parentElement;
          }
          if (kind) break;
        }
      } catch (e) { /* ignore */ }
      if (kind !== state.bgKind) setState({ bgKind: kind });
    }

    var dragMoved = false;
    function beginDrag(e, kind) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      var el = e.currentTarget;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      var startX = e.clientX;
      var startY = e.clientY;
      var origX = state.pos.x;
      var origY = state.pos.y;
      var scale0 = state.scale;
      function move(ev) {
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if (kind === "resize") {
          setState({ scale: Math.min(2.5, Math.max(0.7, scale0 + (dx - dy) / 180)) });
        } else {
          if (Math.abs(dx) + Math.abs(dy) > 4) dragMoved = true;
          setState({ pos: { x: origX + dx, y: origY - dy } });
        }
      }
      function up() {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        detectScheme();
      }
      el.addEventListener("pointermove", move);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
    }

    async function loadStatus() {
      try {
        var res = await api("GET", "/status");
        if (res && res.ok) setState({ status: res.configured || {}, storeAvailable: !!res.storeAvailable });
      } catch (e) { /* ignore */ }
    }

    async function refresh() {
      if (state.loading) return;
      setState({ loading: true, error: null });
      try {
        var payload = {
          provider: state.provider,
          customUrl: state.customUrl,
          customPath: state.customPath,
          customCurrency: state.customCurrency,
        };
        var res = await api("GET", "/fetch?" + qs(payload));
        setState({
          loading: false,
          result: res && res.ok ? res : null,
          error: res && res.ok ? null : (res && res.error || "未知错误"),
        });
      } catch (e) {
        setState({ loading: false, result: null, error: String(e && e.message || e) });
      }
    }

    async function saveKey() {
      var key = state.keyInput.trim();
      if (!key) { setState({ savedMsg: "请输入密钥" }); return; }
      try {
        var res = await api("POST", "/save", { provider: state.provider, key: key });
        if (res && res.ok) {
          setState({ savedMsg: "已保存", keyInput: "" });
          await loadStatus();
          refresh();
        } else {
          setState({ savedMsg: res && res.error || "保存失败" });
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }); }
    }

    async function clearKey() {
      try {
        var res = await api("POST", "/clear", { provider: state.provider });
        if (res && res.ok) {
          setState({ savedMsg: "已清除", result: null });
          await loadStatus();
        } else {
          setState({ savedMsg: res && res.error || "清除失败" });
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }); }
    }

    function fmt(n) {
      if (n == null || !Number.isFinite(Number(n))) return "--";
      return Number(n).toFixed(2);
    }

    function useStore() {
      var forceRef = React.useState(0);
      var force = forceRef[1];
      React.useEffect(function () {
        return subscribe(function () { force(function (v) { return v + 1; }); });
      }, []);
    }

    function opt(value, label) {
      return React.createElement("option", { value: value }, label);
    }

    function providerHint(p) {
      if (p === "deepseek") return "使用 DeepSeek 开放平台 API Key（sk-...），查询 https://api.deepseek.com/user/balance";
      if (p === "moonshot") return "使用 Moonshot/Kimi 开放平台 API Key（sk-...）";
      if (p === "openai") return "OpenAI 官方不支持用 API Key 查余额：请粘贴浏览器登录后的会话 token（sess-...），有效期有限";
      return "适用于中转站等自建接口：填接口地址与 JSON 字段路径（如 data.balance 或 balance_infos[0].total_balance）";
    }

    function FloatingBadge() {
      useStore();
      if (!state.visible) return null;
      var result = state.result;
      var label = PROVIDER_LABELS[state.provider] || state.provider;
      var text = result && result.total != null
        ? (result.currency ? result.currency + " " : "") + fmt(result.total)
        : (state.loading ? "查询中…" : "未配置");
      var title = state.error
        ? "API 余额（" + label + "）：" + state.error + "\n点击重试"
        : "API 余额（" + label + "）：" + text + "\n按住拖动可移动位置，拖拽右下角可缩放\n点击刷新，密钥在 设置 › API 余额 中配置";
      React.useEffect(function () {
        async function boot() {
          await loadStatus();
          if (state.status[state.provider]) refresh();
        }
        boot();
        var t1 = ctx.timeout(function () { detectScheme(); }, 300);
        var sampleDispose = ctx.interval(function () { detectScheme(); }, 1500);
        return function () {
          t1();
          sampleDispose();
        };
      }, []);
      React.useEffect(function () {
        var secs = Math.max(30, Math.round(Number(state.refreshSec) || 60));
        var balanceDispose = ctx.interval(function () {
          if (state.status[state.provider]) refresh();
        }, secs * 1000);
        return balanceDispose;
      }, [state.refreshSec]);
      var cls = "apibal-float"
        + (state.bgKind === "dark" ? " apibal-on-dark" : state.bgKind === "light" ? " apibal-on-light" : "");
      return React.createElement("div", {
        className: cls,
        ref: function (node) { badgeEl = node; },
        style: {
          left: state.pos.x + "px",
          bottom: state.pos.y + "px",
          fontSize: Math.round(15 * state.scale) + "px",
        },
        title: title,
        onPointerDown: function (e) { beginDrag(e, "move"); },
        onClick: function () {
          if (dragMoved) { dragMoved = false; return; }
          refresh();
        },
      },
        React.createElement("span", { className: "apibal-ico" }, "💰"),
        React.createElement("span", { className: "apibal-txt" }, text),
        React.createElement("span", { className: "apibal-prov" }, label),
        React.createElement("span", {
          className: "apibal-resize",
          onPointerDown: function (e) { e.stopPropagation(); beginDrag(e, "resize"); },
        }));
    }

    function BalanceSettings() {
      useStore();
      var p = state.provider;
      var configured = !!state.status[p];
      var result = state.result;
      var keyPlaceholder = p === "openai" ? "sess-..." : "sk-...（或其他密钥）";
      var subRows = [];
      if (result && result.granted != null) subRows.push(["赠送", fmt(result.granted)]);
      if (result && result.toppedUp != null) subRows.push(["充值", fmt(result.toppedUp)]);
      if (result && result.available != null) subRows.push(["可用", fmt(result.available)]);
      if (result && result.used != null) subRows.push(["已用", fmt(result.used)]);
      if (result && result.atText) subRows.push(["更新", result.atText]);

      var children = [
        React.createElement("h3", { key: "h1", className: "apibal-h" }, "数据源"),
        React.createElement("div", { key: "r1", className: "apibal-row" },
          React.createElement("span", { className: "apibal-label" }, "平台"),
          React.createElement("select", {
            className: "apibal-select",
            value: p,
            onChange: function (e) {
              var v = e.target.value;
              setState({ provider: v, result: null, error: null, savedMsg: "" });
              if (state.status[v]) refresh();
            },
          },
            opt("deepseek", "DeepSeek"),
            opt("moonshot", "Moonshot (Kimi)"),
            opt("openai", "OpenAI"),
            opt("custom", "自定义接口")),
        ),
        React.createElement("div", { key: "hint1", className: "apibal-hint" }, providerHint(p)),
        React.createElement("h3", { key: "h2", className: "apibal-h" }, "密钥"),
        React.createElement("div", { key: "r2", className: "apibal-row" },
          React.createElement("input", {
            className: "apibal-input",
            type: "password",
            placeholder: keyPlaceholder,
            value: state.keyInput,
            onChange: function (e) { setState({ keyInput: e.target.value }); },
          }),
          React.createElement("button", { className: "apibal-btn", type: "button", disabled: !state.keyInput.trim(), onClick: saveKey }, "保存"),
          React.createElement("button", { className: "apibal-btn", type: "button", onClick: clearKey }, "清除"),
          React.createElement("span", {
            className: "apibal-badge " + (configured ? "apibal-badge-ok" : "apibal-badge-no"),
          }, configured ? "已配置" : "未配置")),
        React.createElement("div", { key: "hint2", className: "apibal-hint" },
          (state.storeAvailable
            ? "密钥保存在本机 Harness 凭据库（~/.dsh/.credentials.yaml），不会回传到页面。"
            : "凭据服务不可用：无法保存密钥。")
          + (state.savedMsg ? "　" + state.savedMsg : "")),
      ];

      if (p === "custom") {
        children.push(
          React.createElement("h3", { key: "h3", className: "apibal-h" }, "自定义接口"),
          React.createElement("div", { key: "r3", className: "apibal-row" },
            React.createElement("span", { className: "apibal-label" }, "接口地址"),
            React.createElement("input", {
              className: "apibal-input",
              placeholder: "https://…（GET，Bearer 鉴权）",
              value: state.customUrl,
              onChange: function (e) { setState({ customUrl: e.target.value }); },
            })),
          React.createElement("div", { key: "r4", className: "apibal-row" },
            React.createElement("span", { className: "apibal-label" }, "余额字段"),
            React.createElement("input", {
              className: "apibal-input",
              placeholder: "如 data.available_balance",
              value: state.customPath,
              onChange: function (e) { setState({ customPath: e.target.value }); },
            }),
            React.createElement("span", { className: "apibal-label" }, "币种"),
            React.createElement("input", {
              className: "apibal-input",
              placeholder: "CNY / USD",
              value: state.customCurrency,
              onChange: function (e) { setState({ customCurrency: e.target.value }); },
            })),
        );
      }

      children.push(
        React.createElement("h3", { key: "h4", className: "apibal-h" }, "余额"),
        React.createElement("div", { key: "r5", className: "apibal-row" },
          React.createElement("button", {
            className: "apibal-btn",
            type: "button",
            disabled: state.loading,
            onClick: function () { refresh(); },
          }, state.loading ? "查询中…" : "立即刷新"),
          React.createElement("span", { className: "apibal-label", style: { minWidth: "0" } }, "自动刷新间隔"),
          React.createElement("input", {
            className: "apibal-input",
            type: "number",
            min: "30",
            step: "10",
            value: String(state.refreshSec),
            style: { flex: "0 0 96px", minWidth: "0" },
            onChange: function (e) {
              var v = Number(e.target.value);
              var secs = Number.isFinite(v) ? Math.max(30, Math.round(v)) : 60;
              setState({ refreshSec: secs });
            },
          }),
          React.createElement("span", { className: "apibal-hint" }, "秒（最短 30 秒）")),
      );

      if (state.error) {
        children.push(React.createElement("div", { key: "err", className: "apibal-err" }, state.error));
      }

      if (result) {
        children.push(
          React.createElement("div", { key: "card", className: "apibal-card" },
            React.createElement("div", { className: "apibal-total" }, fmt(result.total) + " " + (result.currency || "")),
            subRows.length
              ? React.createElement("div", { className: "apibal-sub" },
                  subRows.map(function (row, i) {
                    return React.createElement("span", { key: i }, row[0] + "：" + row[1]);
                  }))
              : null),
        );
      }

      children.push(
        React.createElement("h3", { key: "h5", className: "apibal-h" }, "悬浮徽章"),
        React.createElement("div", { key: "r6", className: "apibal-row" },
          React.createElement("span", { className: "apibal-label" }, "显示徽章"),
          React.createElement("input", {
            type: "checkbox",
            checked: state.visible,
            onChange: function (e) { setState({ visible: e.target.checked }); },
          })),
        React.createElement("div", { key: "r7", className: "apibal-row" },
          React.createElement("span", { className: "apibal-label" }, "徽章大小"),
          React.createElement("input", {
            type: "range",
            min: "0.7",
            max: "2.5",
            step: "0.1",
            value: String(state.scale),
            style: { flex: 1, minWidth: "140px" },
            onChange: function (e) { setState({ scale: Number(e.target.value) }); },
          }),
          React.createElement("span", { className: "apibal-hint" }, Math.round(state.scale * 100) + "%")),
        React.createElement("div", { key: "r8", className: "apibal-row" },
          React.createElement("button", {
            className: "apibal-btn",
            type: "button",
            onClick: function () { setState({ pos: { x: 12, y: 12 }, scale: 1 }); },
          }, "重置位置与大小")),
        React.createElement("div", { key: "hint3", className: "apibal-hint" },
          "徽章悬浮在页面上方：按住拖动改变位置，拖拽右下角手柄自由缩放，点击刷新余额（默认每 1 分钟自动刷新，可在「余额」区自定义间隔，最短 30 秒）。文字颜色会随下方内容明暗自动切换。"),
      );

      return React.createElement("div", { className: "apibal-wrap" }, children);
    }

    ctx.slots.inject("settings.section", function () {
      return ctx.slots.register(
        { name: "settings.section", id: "api-balance", order: 30, label: "API 余额" },
        function () { return React.createElement(BalanceSettings); },
      );
    });

    ctx.slots.inject("shell.overlay", function () {
      return ctx.slots.register(
        { name: "shell.overlay", id: "api-balance-widget", order: 20, label: "API 余额" },
        function () { return React.createElement(FloatingBadge); },
      );
    });
  }

  exports.name = name;
  exports.inject = inject;
  exports.apply = apply;
  return module.exports;
}});
