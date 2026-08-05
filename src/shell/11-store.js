/* ============================================================================
   11-store.js — localStorage wrappers (§1). Every access is try/catch'd:
   file:// + "block third-party cookies" makes localStorage throw on ACCESS,
   not just on write, so the whole thing degrades to an in-memory session.
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});

  var NS = "cid.v1.";
  var KEYS = { meta: NS + "meta", lessons: NS + "lessons", srs: NS + "srs", stats: NS + "stats" };

  var ls = null, persistent = true;
  try {
    ls = global.localStorage;
    var probe = NS + "probe";
    ls.setItem(probe, "1"); ls.removeItem(probe);
  } catch (e) { ls = null; persistent = false; }

  var cache = {};

  function read(key, fallback) {
    if (Object.prototype.hasOwnProperty.call(cache, key)) return cache[key];
    var v = fallback;
    try {
      var raw = ls && ls.getItem(key);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") v = parsed;
      }
    } catch (e) { v = fallback; }
    cache[key] = v;
    return v;
  }
  function write(key, val) {
    cache[key] = val;
    try { if (ls) ls.setItem(key, JSON.stringify(val)); } catch (e) { persistent = false; }
    return val;
  }

  function todayKey(d) {
    d = d || new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0"), day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  var Store = App.Store = {
    persistent: function () { return persistent; },
    KEYS: KEYS,
    todayKey: todayKey,

    /* ---- meta ---- */
    meta: function () { return read(KEYS.meta, { schema: 1, theme: "auto", lastRoute: "#/" }); },
    setMeta: function (patch) {
      var m = Object.assign({ schema: 1, theme: "auto", lastRoute: "#/" }, Store.meta(), patch);
      return write(KEYS.meta, m);
    },

    /* ---- lessons ---- */
    lessons: function () { return read(KEYS.lessons, {}); },
    lessonState: function (key) {
      var s = Store.lessons()[key];
      return s || { status: "unseen", lastVisited: 0, vizCompleted: false };
    },
    setLessonState: function (key, patch) {
      var all = Store.lessons();
      all[key] = Object.assign({ status: "unseen", lastVisited: 0, vizCompleted: false }, all[key], patch);
      write(KEYS.lessons, all);
      return all[key];
    },
    visit: function (key) {
      var s = Store.lessonState(key);
      return Store.setLessonState(key, {
        status: s.status === "unseen" ? "learning" : s.status,
        lastVisited: Date.now()
      });
    },

    /* ---- srs ---- */
    srs: function () { return read(KEYS.srs, {}); },
    card: function (id) { return Store.srs()[id] || null; },
    setCard: function (id, entry) {
      var all = Store.srs();
      all[id] = entry;
      write(KEYS.srs, all);
      return entry;
    },

    /* ---- stats ---- */
    stats: function () { return read(KEYS.stats, { streakDays: 0, lastStudyDay: "", reviewsByDay: {} }); },
    recordReview: function (n) {
      var s = Store.stats(), today = todayKey();
      if (s.lastStudyDay !== today) {
        var y = todayKey(new Date(Date.now() - 86400000));
        s.streakDays = s.lastStudyDay === y ? (s.streakDays || 0) + 1 : 1;
        s.lastStudyDay = today;
      }
      if (!s.streakDays) s.streakDays = 1;
      s.reviewsByDay = s.reviewsByDay || {};
      s.reviewsByDay[today] = (s.reviewsByDay[today] || 0) + (n == null ? 1 : n);
      return write(KEYS.stats, s);
    },
    reviewsToday: function () {
      var s = Store.stats();
      return (s.reviewsByDay && s.reviewsByDay[todayKey()]) || 0;
    },

    resetAll: function () {
      cache = {};
      Object.keys(KEYS).forEach(function (k) { try { if (ls) ls.removeItem(KEYS[k]); } catch (e) {} });
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
