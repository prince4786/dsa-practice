/* ============================================================================
   14-theme.js — theme toggle + the resolved token colours canvas code needs.
   Canvas cannot read CSS custom properties, so the shell resolves every token
   from live computed style and hands authors `env.colors`.
   Key = token name minus "--", camelCased:  --viz-1 -> viz1, --text-2 -> text2
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});

  var TOKENS = {
    bg: "--bg", surface: "--surface", surface2: "--surface-2",
    text: "--text", text2: "--text-2", muted: "--muted",
    border: "--border", grid: "--grid", axis: "--axis", accent: "--accent",
    viz1: "--viz-1", viz2: "--viz-2", viz3: "--viz-3", viz4: "--viz-4",
    viz5: "--viz-5", viz6: "--viz-6", viz7: "--viz-7", viz8: "--viz-8",
    ok: "--ok", warn: "--warn", danger: "--danger"
  };
  /* Last-resort values if computed style is unavailable (headless / very old engine). */
  var FALLBACK = {
    bg: "#0d0d0d", surface: "#1a1a19", surface2: "#232322",
    text: "#ffffff", text2: "#c3c2b7", muted: "#898781",
    border: "rgba(255,255,255,.10)", grid: "#2c2c2a", axis: "#383835", accent: "#3987e5",
    viz1: "#3987e5", viz2: "#d95926", viz3: "#199e70", viz4: "#c98500",
    viz5: "#d55181", viz6: "#008300", viz7: "#9085e9", viz8: "#e66767",
    ok: "#0ca30c", warn: "#fab219", danger: "#d03b3b"
  };

  var listeners = [];
  var cache = null, cacheTheme = null;

  function prefersLight() {
    try { return !!(global.matchMedia && global.matchMedia("(prefers-color-scheme: light)").matches); }
    catch (e) { return false; }
  }
  function pref() {
    var t = (App.Store && App.Store.meta().theme) || "auto";
    return t === "light" || t === "dark" || t === "auto" ? t : "auto";
  }
  function effective() {
    var p = pref();
    return p === "auto" ? (prefersLight() ? "light" : "dark") : p;
  }

  var Theme = App.Theme = {
    TOKENS: TOKENS,
    pref: pref,
    current: effective,

    apply: function () {
      var t = effective();
      if (global.document) global.document.documentElement.setAttribute("data-theme", t);
      cache = null;
      listeners.forEach(function (fn) { try { fn(t); } catch (e) {} });
      return t;
    },
    set: function (t) {
      if (App.Store) App.Store.setMeta({ theme: t });
      return Theme.apply();
    },
    toggle: function () { return Theme.set(effective() === "dark" ? "light" : "dark"); },

    /** Resolved token values, cached per theme. */
    colors: function () {
      var t = effective();
      if (cache && cacheTheme === t) return cache;
      var out = {};
      var cs = null;
      try { cs = global.getComputedStyle(global.document.documentElement); } catch (e) { cs = null; }
      Object.keys(TOKENS).forEach(function (k) {
        var v = "";
        try { v = cs ? cs.getPropertyValue(TOKENS[k]).trim() : ""; } catch (e) { v = ""; }
        out[k] = v || FALLBACK[k];
      });
      cache = out; cacheTheme = t;
      return out;
    },

    fonts: function () {
      var base = "system-ui, -apple-system, 'Segoe UI', sans-serif";
      var mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace";
      try {
        var cs = global.getComputedStyle(global.document.documentElement);
        base = cs.getPropertyValue("--font").trim() || base;
        mono = cs.getPropertyValue("--mono").trim() || mono;
      } catch (e) {}
      return { base: base, mono: mono };
    },

    onChange: function (fn) {
      listeners.push(fn);
      return function () {
        var i = listeners.indexOf(fn);
        if (i >= 0) listeners.splice(i, 1);
      };
    },

    init: function () {
      try {
        var mq = global.matchMedia && global.matchMedia("(prefers-color-scheme: light)");
        if (mq && mq.addEventListener) {
          mq.addEventListener("change", function () { if (pref() === "auto") Theme.apply(); });
        }
      } catch (e) {}
      return Theme.apply();
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
