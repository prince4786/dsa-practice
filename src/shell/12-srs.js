/* ============================================================================
   12-srs.js — SM-2-lite (§1).
   grades: Again(0) Hard(1) Good(2) Easy(3)
     Again -> interval 0 (re-queue this session), Hard -> x1.2,
     Good  -> x ease, Easy -> x ease x 1.3
     ease += (-0.2, -0.05, 0, +0.1), clamped [1.3, 3.0]
     graduation: first Good = 1 day, second = 3 days
   cardId = "<track>/<lessonId>#<cardIndex>"  |  "<track>/<lessonId>#60s<n>"
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var DAY = 86400000;

  var GRADES = [
    { g: 0, label: "Again", hint: "blanked" },
    { g: 1, label: "Hard",  hint: "shaky" },
    { g: 2, label: "Good",  hint: "got it" },
    { g: 3, label: "Easy",  hint: "instant" }
  ];
  var EASE_DELTA = [-0.2, -0.05, 0, 0.1];

  function fresh() { return { ease: 2.5, intervalDays: 0, due: 0, reps: 0, lapses: 0 }; }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function round2(v) { return Math.round(v * 100) / 100; }

  var SRS = App.SRS = {
    DAY: DAY,
    GRADES: GRADES,
    fresh: fresh,

    cardId: function (lessonKey, i) { return lessonKey + "#" + i; },
    sixtyId: function (lessonKey, i) { return lessonKey + "#60s" + i; },
    lessonKeyOf: function (cardId) { return String(cardId).split("#")[0]; },

    /** Apply a grade; persists and returns the new entry. */
    grade: function (cardId, g, now) {
      now = now || Date.now();
      var e = Object.assign(fresh(), App.Store.card(cardId));
      var prev = e.intervalDays || 0;
      var iv;
      if (g === 0) {
        iv = 0;
        e.lapses = (e.lapses || 0) + 1;
      } else if (g === 1) {
        iv = prev <= 0 ? 1 : prev * 1.2;
      } else if (g === 2) {
        iv = prev <= 0 ? 1 : prev < 3 ? 3 : prev * e.ease;
      } else {
        iv = prev <= 0 ? 2 : prev < 3 ? 5 : prev * e.ease * 1.3;
      }
      e.ease = round2(clamp(e.ease + (EASE_DELTA[g] || 0), 1.3, 3.0));
      e.intervalDays = round2(clamp(iv, 0, 365));
      e.reps = (e.reps || 0) + 1;
      e.due = now + e.intervalDays * DAY;
      App.Store.setCard(cardId, e);
      return e;
    },

    /** All card ids a lesson owns (drill cards + 60-second prompts). */
    cardIdsFor: function (lesson) {
      var key = App.keyOf(lesson), out = [];
      var cards = (lesson.drill && lesson.drill.cards) || [];
      for (var i = 0; i < cards.length; i++) out.push(SRS.cardId(key, i));
      return out;
    },

    /** Materialised card = { id, q, a, tags, lessonKey, title, index } */
    cardsOf: function (lesson) {
      var key = App.keyOf(lesson);
      return ((lesson.drill && lesson.drill.cards) || []).map(function (c, i) {
        return {
          id: SRS.cardId(key, i), q: c.q, a: c.a, tags: c.tags || [],
          lessonKey: key, title: lesson.title, track: lesson.track, index: i
        };
      });
    },

    allCards: function () {
      var out = [];
      App.allLessons().forEach(function (l) { out = out.concat(SRS.cardsOf(l)); });
      return out;
    },

    isDue: function (id, now) {
      var e = App.Store.card(id);
      if (!e) return false;
      return (e.due || 0) <= (now || Date.now());
    },
    isNew: function (id) { return !App.Store.card(id); },

    /**
     * Build a review queue: everything due, plus up to `newCap` unseen cards
     * from lessons the user has actually opened (status >= learning).
     */
    queue: function (opts) {
      opts = opts || {};
      var now = opts.now || Date.now();
      var newCap = opts.newCap == null ? 20 : opts.newCap;
      var track = opts.track || null;
      var due = [], fresh_ = [];
      App.allLessons().forEach(function (l) {
        if (track && l.track !== track) return;
        var st = App.Store.lessonState(App.keyOf(l));
        SRS.cardsOf(l).forEach(function (c) {
          var e = App.Store.card(c.id);
          if (e) { if ((e.due || 0) <= now) due.push(c); }
          else if (st.status !== "unseen") fresh_.push(c);
        });
      });
      return { due: due, fresh: fresh_.slice(0, newCap), newAvailable: fresh_.length };
    },

    counts: function (track) {
      var q = SRS.queue({ track: track });
      return { due: q.due.length, fresh: q.fresh.length, newAvailable: q.newAvailable };
    },

    /** Auto status per §1: learning on visit, reviewing once every card has a rep,
     *  mastered when every card has intervalDays >= 21. */
    statusOf: function (lesson) {
      var key = App.keyOf(lesson);
      var st = App.Store.lessonState(key);
      var ids = SRS.cardIdsFor(lesson);
      if (!ids.length) return st.status;
      var allRepped = true, allMature = true;
      for (var i = 0; i < ids.length; i++) {
        var e = App.Store.card(ids[i]);
        if (!e || !e.reps) { allRepped = false; allMature = false; break; }
        if ((e.intervalDays || 0) < 21) allMature = false;
      }
      if (allMature) return "mastered";
      if (allRepped) return "reviewing";
      if (st.status === "unseen") return "unseen";
      return "learning";
    },

    /** Refresh the persisted status for a lesson (called after grading/visiting). */
    syncStatus: function (lesson) {
      var key = App.keyOf(lesson);
      var s = SRS.statusOf(lesson);
      if (App.Store.lessonState(key).status !== s) App.Store.setLessonState(key, { status: s });
      return s;
    },

    trackProgress: function (track) {
      var ls = App.lessonsIn(track), done = 0, started = 0;
      ls.forEach(function (l) {
        var s = SRS.statusOf(l);
        if (s === "mastered") done++;
        if (s !== "unseen") started++;
      });
      return { total: ls.length, mastered: done, started: started,
               pct: ls.length ? Math.round((done / ls.length) * 100) : 0 };
    },

    overallProgress: function () {
      var all = App.allLessons(), done = 0, started = 0;
      all.forEach(function (l) {
        var s = SRS.statusOf(l);
        if (s === "mastered") done++;
        if (s !== "unseen") started++;
      });
      return { total: all.length, mastered: done, started: started,
               pct: all.length ? Math.round((done / all.length) * 100) : 0 };
    },

    fmtInterval: function (d) {
      if (!d) return "now";
      if (d < 1) return Math.round(d * 24) + "h";
      if (d < 30) return Math.round(d) + "d";
      return Math.round(d / 30) + "mo";
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
