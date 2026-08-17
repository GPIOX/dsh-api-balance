/**
 * dsh-api-balance-badge client bundle (built factory form, served under /plugins).
 * One floating badge per configured provider: balance providers show the currency
 * amount, OpenCode Go shows its rolling-5h / weekly / monthly quota windows.
 * Badges are individually draggable, resizable, click-to-refresh, and their text
 * color adapts to whatever sits beneath them.
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
      '.apibal-bar-track{flex:1;height:6px;border-radius:3px;background:rgba(128,128,128,0.25);overflow:hidden;}',
      '.apibal-bar-fill{height:100%;border-radius:3px;}',
            '.apibal-bar-text{width:158px;text-align:right;opacity:0.8;font-variant-numeric:tabular-nums;white-space:nowrap;flex:none;}',
      '.apibal-bar-block{display:flex;flex-direction:column;gap:1px;}',
      '.apibal-bar-reset{font-size:11px;opacity:0.7;text-align:right;padding-left:34px;font-variant-numeric:tabular-nums;white-space:nowrap;}',
      '.apibal-quota{flex-direction:column;align-items:flex-start;gap:2px;}',
      '.apibal-qhead{display:flex;align-items:center;gap:0.5em;}',
      '.apibal-qrows{display:flex;flex-direction:column;gap:1px;margin-top:2px;}',
      '.apibal-qrow{display:flex;gap:0.6em;white-space:nowrap;font-size:0.85em;}',
      '.apibal-qlabel{opacity:0.7;width:1.8em;flex:none;}',
      '.apibal-qval{font-variant-numeric:tabular-nums;}',
    ].join("\n");

    var styleEl = document.createElement("style");
    styleEl.textContent = css;
    document.head.appendChild(styleEl);
    ctx.effect(function () {
      return function () {
        if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl);
      };
    });

    var PROVIDER_LABELS = {
      deepseek: "DeepSeek",
      "opencode-go": "OpenCode Go",
      moonshot: "Moonshot (Kimi)",
      openai: "OpenAI",
      custom: "自定义接口",
    };
    var PROVIDER_ORDER_ALL = ["deepseek", "opencode-go", "moonshot", "openai", "custom"];
    var QUOTA_LABELS = { rolling: "5h", weekly: "周", monthly: "月" };
    var BADGE_BASE = { x: 12, y: 12 };
    var BADGE_STACK = 46;

    var state = {
      providers: [],
      status: {},
      storeAvailable: false,
      results: {},
      errors: {},
      loading: false,
      error: null,
      keyInput: "",
      savedMsg: "",
      keyProvider: "deepseek",
      customUrl: "",
      customPath: "balance",
      customCurrency: "CNY",
      visible: true,
      refreshSec: 60,
      badges: {},
      now: 0,
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

    function getDefaultPos(id) {
      var idx = state.providers.indexOf(id);
      if (idx < 0) idx = 0;
      return { x: BADGE_BASE.x, y: BADGE_BASE.y + idx * BADGE_STACK };
    }
    function getBadge(id) {
      return state.badges[id] || { pos: getDefaultPos(id), scale: 1, bgKind: null };
    }
    function setBadge(id, patch) {
      var cur = getBadge(id);
      var next = Object.assign({}, cur, patch);
      var badges = Object.assign({}, state.badges);
      badges[id] = next;
      setState({ badges: badges });
    }

    var badgeEls = {};
    function detectScheme(id) {
      var el = badgeEls[id];
      if (!el) return;
      var kind = null;
      try {
        var doc = el.ownerDocument;
        var view = doc.defaultView;
        if (!view || !doc.elementsFromPoint) return;
        var rect = el.getBoundingClientRect();
        var x = rect.left + rect.width / 2;
        var y = rect.top + rect.height / 2;
        var list = doc.elementsFromPoint(x, y);
        for (var i = 0; i < list.length; i++) {
          var node = list[i];
          if (!node || node === el || el.contains(node)) continue;
          var cur = node;
          for (var d = 0; d < 10 && cur && cur.nodeType === 1; d++) {
            var bg = view.getComputedStyle(cur).backgroundColor;
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
      if (kind !== getBadge(id).bgKind) setBadge(id, { bgKind: kind });
    }

    function beginDrag(id, e, kind) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      var moved = false;
      var el = e.currentTarget;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      var b = getBadge(id);
      var startX = e.clientX;
      var startY = e.clientY;
      var origX = b.pos.x;
      var origY = b.pos.y;
      var scale0 = b.scale;
      function move(ev) {
        var dx = ev.clientX - startX;
        var dy = ev.clientY - startY;
        if (kind === "resize") {
          setBadge(id, { scale: Math.min(2.5, Math.max(0.7, scale0 + (dx - dy) / 180)) });
        } else {
          if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
          setBadge(id, { pos: { x: origX + dx, y: origY - dy } });
        }
      }
      function up() {
        el.removeEventListener("pointermove", move);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        if (kind === "move" && !moved) refreshAll();
        detectScheme(id);
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

    async function loadConfig() {
      try {
        var res = await api("GET", "/get-providers");
        if (res && res.ok && res.config) {
          setState({ providers: res.config.enabled || [] });
        }
      } catch (e) { /* ignore */ }
    }

    async function refreshAll() {
      if (state.loading) return;
      setState({ loading: true, error: null });
      try {
        var res = await api("GET", "/fetch-all?" + qs({
          customUrl: state.customUrl,
          customPath: state.customPath,
          customCurrency: state.customCurrency,
        }));
        var byId = {};
        var errs = {};
        if (res && res.ok) {
          (res.results || []).forEach(function (r) { if (r && r.provider) byId[r.provider] = r; });
          errs = res.errors || {};
          setState({
            loading: false,
            results: byId,
            errors: errs,
            providers: (res.config && res.config.enabled) || state.providers,
            now: Date.now(),
          });
        } else {
          setState({ loading: false, error: res && res.error || "未知错误" });
        }
      } catch (e) {
        setState({ loading: false, error: String(e && e.message || e) });
      }
    }

    async function saveKey() {
      var key = state.keyInput.trim();
      if (!key) { setState({ savedMsg: "请输入密钥" }); return; }
      try {
        var res = await api("POST", "/save", { provider: state.keyProvider, key: key });
        if (res && res.ok) {
          setState({ savedMsg: "已保存", keyInput: "" });
          await loadStatus();
          refreshAll();
        } else {
          setState({ savedMsg: res && res.error || "保存失败" });
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }); }
    }

    async function clearKey() {
      try {
        var res = await api("POST", "/clear", { provider: state.keyProvider });
        if (res && res.ok) {
          setState({ savedMsg: "已清除" });
          await loadStatus();
          refreshAll();
        } else {
          setState({ savedMsg: res && res.error || "清除失败" });
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }); }
    }

    async function saveProviders() {
      try {
        var res = await api("POST", "/save-providers", { enabled: state.providers });
        if (res && res.ok && res.config) {
          setState({ savedMsg: "已保存", providers: res.config.enabled });
        } else {
          setState({ savedMsg: res && res.error || "保存失败" });
        }
      } catch (e) { setState({ savedMsg: String(e && e.message || e) }); }
    }

    function toggleProvider(id) {
      var list = state.providers.slice();
      var i = list.indexOf(id);
      if (i >= 0) list.splice(i, 1);
      else list.push(id);
      setState({ providers: list });
    }

    function moveProvider(id, dir) {
      var list = state.providers.slice();
      var i = list.indexOf(id);
      var j = i + dir;
      if (i < 0 || j < 0 || j >= list.length) return;
      var t = list[i];
      list[i] = list[j];
      list[j] = t;
      setState({ providers: list });
    }

    function fmt(n) {
      if (n == null || !Number.isFinite(Number(n))) return "--";
      return Number(n).toFixed(2);
    }

    function fmtCountdown(resetsAt, now) {
      if (!resetsAt) return "";
      var t = new Date(resetsAt).getTime() - now;
      if (!Number.isFinite(t) || t <= 0) return "已重置";
      var s = Math.floor(t / 1000);
      var h = Math.floor(s / 3600);
      var m = Math.floor((s % 3600) / 60);
      var sec = s % 60;
      function p2(n) { return (n < 10 ? "0" : "") + n; }
      return p2(h) + ":" + p2(m) + ":" + p2(sec);
    }

    function barColor(percent) {
      if (percent < 50) return "#46a758";
      if (percent < 80) return "#d29922";
      return "#e5484d";
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
      if (p === "opencode-go") return "OpenCode Go 订阅额度：密钥通常已由 DSH 模型设置页写入 OPENCODE_GO_API_KEY，一般无需在这里填写";
      return "适用于中转站等自建接口：填接口地址与 JSON 字段路径（如 data.balance 或 balance_infos[0].total_balance）";
    }

    function badgeText(res, id) {
      if (!res) return state.errors[id] ? "出错" : (state.loading ? "查询中…" : "--");
      if (res.type === "balance") return (res.currency ? res.currency + " " : "") + fmt(res.total);
      if (res.type === "quota" && res.windows) {
        var w = res.windows;
        return "5h " + (w.rolling ? w.rolling.remaining : "--") + "% · 周 " + (w.weekly ? w.weekly.remaining : "--") + "% · 月 " + (w.monthly ? w.monthly.remaining : "--") + "%";
      }
      return "--";
    }

    function badgeTitle(res, err, id, label) {
      var t = label + " · 点击刷新\n按住拖动移动，拖拽右下角缩放";
      if (err) return t + "\n" + err;
      if (!res) return t;
      if (res.type === "balance") {
        var bits = [];
        if (res.granted != null) bits.push("赠送 " + fmt(res.granted));
        if (res.toppedUp != null) bits.push("充值 " + fmt(res.toppedUp));
        if (res.available != null) bits.push("可用 " + fmt(res.available));
        if (res.used != null) bits.push("已用 " + fmt(res.used));
        if (bits.length) t += "\n" + bits.join(" · ");
        return t;
      }
      if (res.type === "quota" && res.windows) {
        var keys = ["rolling", "weekly", "monthly"];
        for (var i = 0; i < keys.length; i++) {
          var w = res.windows[keys[i]];
          if (!w) continue;
          var line = QUOTA_LABELS[keys[i]] + " 已用 " + w.percent + "% · 剩 " + w.remaining + "%";
          if (w.resetsAt) line += " · " + fmtCountdown(w.resetsAt, state.now) + " 后重置";
          t += "\n" + line;
        }
      }
      return t;
    }

    function quotaBars(res) {
      var bars = [];
      if (res && res.type === "quota" && res.windows) {
        var keys = ["rolling", "weekly", "monthly"];
        for (var i = 0; i < keys.length; i++) {
          var w = res.windows[keys[i]];
          if (!w) continue;
          var pct = Math.min(100, Math.max(0, w.percent));
          var resetText = w.resetsAt ? "重置 " + fmtCountdown(w.resetsAt, state.now) : "";
          bars.push(
            React.createElement("div", { key: keys[i], className: "apibal-bar-block" },
              React.createElement("div", { className: "apibal-bar-row" },
                React.createElement("span", { className: "apibal-bar-label" }, QUOTA_LABELS[keys[i]]),
                React.createElement("div", { className: "apibal-bar-track" },
                  React.createElement("div", { className: "apibal-bar-fill", style: { width: pct + "%", background: barColor(pct) } })),
                React.createElement("span", { className: "apibal-bar-text" }, "已用 " + pct + "% · 剩 " + w.remaining + "%")),
              resetText ? React.createElement("div", { className: "apibal-bar-reset" }, resetText) : null),
          );
        }
      }
      return bars;
    }

    function providerRow(id) {
      var label = PROVIDER_LABELS[id] || id;
      var res = state.results[id];
      var err = state.errors[id];
      var children = [
        React.createElement("div", { key: "head", className: "apibal-prow" },
          React.createElement("span", { className: "apibal-pname" }, label),
          React.createElement("span", { className: "apibal-pval" }, badgeText(res, id))),
      ];
      if (err) children.push(React.createElement("div", { key: "err", className: "apibal-err" }, err));
      if (res && res.type === "balance") {
        var bits = [];
        if (res.granted != null) bits.push("赠送 " + fmt(res.granted));
        if (res.toppedUp != null) bits.push("充值 " + fmt(res.toppedUp));
        if (res.available != null) bits.push("可用 " + fmt(res.available));
        if (res.used != null) bits.push("已用 " + fmt(res.used));
        if (bits.length) children.push(React.createElement("div", { key: "sub", className: "apibal-psub" }, bits.join(" · ")));
      }
      if (res && res.type === "quota") {
        children.push(React.createElement("div", { key: "bars", className: "apibal-bars" }, quotaBars(res)));
      }
      return React.createElement("div", { key: id }, children);
    }

    function FloatingBadge(props) {
      var id = props.id;
      useStore();
      if (!state.visible) return null;
      if (!state.status[id]) return null;
      var res = state.results[id];
      var err = state.errors[id];
      var label = PROVIDER_LABELS[id] || id;
      var b = getBadge(id);
      var cls = "apibal-float"
        + (b.bgKind === "dark" ? " apibal-on-dark" : b.bgKind === "light" ? " apibal-on-light" : "");
      var resizeHandle = React.createElement("span", {
        className: "apibal-resize",
        onPointerDown: function (e) { e.stopPropagation(); beginDrag(id, e, "resize"); },
      });
      var base = {
        className: cls,
        ref: function (node) { badgeEls[id] = node; },
        style: {
          left: b.pos.x + "px",
          bottom: b.pos.y + "px",
          fontSize: Math.round(15 * b.scale) + "px",
        },
        title: badgeTitle(res, err, id, label),
        onPointerDown: function (e) { beginDrag(id, e, "move"); },
      };
      if (res && res.type === "quota" && res.windows) {
        var w = res.windows;
        var keys = ["rolling", "weekly", "monthly"];
        var rows = [];
        for (var i = 0; i < keys.length; i++) {
          var win = w[keys[i]];
          if (!win) continue;
          rows.push(
            React.createElement("div", { key: keys[i], className: "apibal-qrow" },
              React.createElement("span", { className: "apibal-qlabel" }, QUOTA_LABELS[keys[i]]),
              React.createElement("span", { className: "apibal-qval" }, "剩 " + win.remaining + "%")),
          );
        }
        return React.createElement("div", Object.assign({}, base, { className: cls + " apibal-quota" }),
          React.createElement("div", { className: "apibal-qhead" },
            React.createElement("span", { className: "apibal-ico" }, "💰"),
            React.createElement("span", { className: "apibal-prov" }, label)),
          React.createElement("div", { className: "apibal-qrows" }, rows),
          resizeHandle);
      }
      return React.createElement("div", base,
        React.createElement("span", { className: "apibal-ico" }, "💰"),
        React.createElement("span", { className: "apibal-txt" }, badgeText(res, id)),
        React.createElement("span", { className: "apibal-prov" }, label),
        resizeHandle);
    }

    function App() {
      useStore();
      React.useEffect(function () {
        async function boot() {
          await loadStatus();
          await loadConfig();
          refreshAll();
        }
        boot();
        var tick = ctx.interval(function () { setState({ now: Date.now() }); }, 1000);
        var sample = ctx.interval(function () {
          for (var i = 0; i < state.providers.length; i++) detectScheme(state.providers[i]);
        }, 1500);
        return function () {
          tick();
          sample();
        };
      }, []);
      React.useEffect(function () {
        var secs = Math.max(30, Math.round(Number(state.refreshSec) || 60));
        var d = ctx.interval(function () { refreshAll(); }, secs * 1000);
        return d;
      }, [state.refreshSec]);
      var badges = [];
      for (var i = 0; i < state.providers.length; i++) {
        badges.push(React.createElement(FloatingBadge, { key: state.providers[i], id: state.providers[i] }));
      }
      return React.createElement('div', { style: { display: 'contents' } }, badges);
    }

    function BalanceSettings() {
      useStore();
      var configured = !!state.status[state.keyProvider];
      var keyPlaceholder = state.keyProvider === "openai" ? "sess-..." : "sk-...（或其他密钥）";

      var plistRows = [];
      for (var i = 0; i < PROVIDER_ORDER_ALL.length; i++) {
        var id = PROVIDER_ORDER_ALL[i];
        var checked = state.providers.indexOf(id) >= 0;
        plistRows.push(
          React.createElement("div", { key: id, className: "apibal-plist-row" },
            React.createElement("input", {
              type: "checkbox",
              checked: checked,
              onChange: function () { toggleProvider(id); },
            }),
            React.createElement("span", { className: "apibal-plist-name" }, PROVIDER_LABELS[id]),
            React.createElement("button", {
              className: "apibal-btn",
              type: "button",
              disabled: !checked,
              onClick: function () { moveProvider(id, -1); },
            }, "↑"),
            React.createElement("button", {
              className: "apibal-btn",
              type: "button",
              disabled: !checked,
              onClick: function () { moveProvider(id, 1); },
            }, "↓"),
            React.createElement("span", {
              className: "apibal-badge " + (state.status[id] ? "apibal-badge-ok" : "apibal-badge-no"),
            }, state.status[id] ? "已配置" : "未配置")),
        );
      }

      var children = [
        React.createElement("h3", { key: "h1", className: "apibal-h" }, "提供商"),
        React.createElement("div", { key: "plist", className: "apibal-plist" }, plistRows),
        React.createElement("div", { key: "r1", className: "apibal-row" },
          React.createElement("button", { className: "apibal-btn", type: "button", onClick: saveProviders }, "保存提供商列表"),
          React.createElement("span", { className: "apibal-hint" }, "每个已配置的提供商一个悬浮徽章，↑↓ 调整堆叠顺序")
          + (state.savedMsg ? "　" + state.savedMsg : "")),
        React.createElement("h3", { key: "h2", className: "apibal-h" }, "密钥"),
        React.createElement("div", { key: "r2", className: "apibal-row" },
          React.createElement("span", { className: "apibal-label" }, "平台"),
          React.createElement("select", {
            className: "apibal-select",
            value: state.keyProvider,
            onChange: function (e) { setState({ keyProvider: e.target.value, keyInput: "", savedMsg: "" }); },
          },
            opt("deepseek", "DeepSeek"),
            opt("opencode-go", "OpenCode Go"),
            opt("moonshot", "Moonshot (Kimi)"),
            opt("openai", "OpenAI"),
            opt("custom", "自定义接口"))),
        React.createElement("div", { key: "hint1", className: "apibal-hint" }, providerHint(state.keyProvider)),
        React.createElement("div", { key: "r3", className: "apibal-row" },
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
            : "凭据服务不可用：无法保存密钥。")),
      ];

      if (state.keyProvider === "custom") {
        children.push(
          React.createElement("h3", { key: "h3", className: "apibal-h" }, "自定义接口"),
          React.createElement("div", { key: "r4", className: "apibal-row" },
            React.createElement("span", { className: "apibal-label" }, "接口地址"),
            React.createElement("input", {
              className: "apibal-input",
              placeholder: "https://…（GET，Bearer 鉴权）",
              value: state.customUrl,
              onChange: function (e) { setState({ customUrl: e.target.value }); },
            })),
          React.createElement("div", { key: "r5", className: "apibal-row" },
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
        React.createElement("h3", { key: "h4", className: "apibal-h" }, "数据"),
        React.createElement("div", { key: "r6", className: "apibal-row" },
          React.createElement("button", {
            className: "apibal-btn",
            type: "button",
            disabled: state.loading,
            onClick: function () { refreshAll(); },
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

      var dataRows = [];
      for (var k = 0; k < state.providers.length; k++) {
        dataRows.push(providerRow(state.providers[k]));
      }
      if (dataRows.length) {
        children.push(
          React.createElement("div", { key: "card", className: "apibal-card" },
            React.createElement("div", { key: "rows" }, dataRows)),
        );
      }

      children.push(
        React.createElement("h3", { key: "h5", className: "apibal-h" }, "悬浮徽章"),
        React.createElement("div", { key: "r7", className: "apibal-row" },
          React.createElement("span", { className: "apibal-label" }, "显示徽章"),
          React.createElement("input", {
            type: "checkbox",
            checked: state.visible,
            onChange: function (e) { setState({ visible: e.target.checked }); },
          })),
        React.createElement("div", { key: "r8", className: "apibal-row" },
          React.createElement("button", {
            className: "apibal-btn",
            type: "button",
            onClick: function () { setState({ badges: {} }); },
          }, "重置全部位置与大小")),
        React.createElement("div", { key: "hint3", className: "apibal-hint" },
          "每个已配置的提供商一个悬浮徽章：按住拖动、拖拽右下角手柄缩放、点击刷新。文字颜色随下方内容明暗自适应。"),
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
        function () { return React.createElement(App); },
      );
    });
  }

  exports.name = name;
  exports.inject = inject;
  exports.apply = apply;
  return module.exports;
}});
