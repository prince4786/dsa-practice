/* ============================================================================
   17-drill.js — spaced-repetition drill (§5): global queue, scoped drill,
   and the 60-second explain mode with a ring timer.
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var doc = global.document;
  var h, md, esc;

  function ui() { h = App.UI.h; md = App.UI.md; esc = App.UI.esc; return App.UI; }

  function shuffle(a, rnd) {
    rnd = rnd || Math.random;
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  /* ======================================================================== */
  /*  session runner                                                          */
  /* ======================================================================== */
  function runSession(host, cards, opts, teardown) {
    ui();
    opts = opts || {};
    var queue = cards.slice();
    var done = 0, again = 0, seen = {};
    var revealed = false, current = null;

    function next() {
      current = queue.shift() || null;
      revealed = false;
      paint();
    }
    function grade(g) {
      if (!current) return;
      App.SRS.grade(current.id, g);
      App.Store.recordReview(1);
      var l = App.lesson(current.lessonKey);
      if (l) App.SRS.syncStatus(l);
      if (!seen[current.id]) { seen[current.id] = 1; done++; }
      if (g === 0) { again++; queue.push(current); }
      next();
    }

    function paint() {
      App.UI.clear(host);
      if (!current) { host.appendChild(summary()); return; }
      var lesson = App.lesson(current.lessonKey);
      var entry = App.Store.card(current.id);

      var card = h("div", { class: "drill-card" }, [
        h("div", { class: "chips", style: { marginBottom: "14px" } }, [
          h("span", { class: "chip" }, lesson ? App.trackMeta(lesson.track).label : current.track),
          lesson ? h("a", { class: "chip accent", href: App.Router.lessonHash(lesson) }, "→ " + lesson.title) : null,
          entry ? h("span", { class: "chip" }, "seen " + entry.reps + "× · ease " + entry.ease) : h("span", { class: "chip" }, "new"),
          (current.tags || []).map(function (t) { return h("span", { class: "chip" }, t); })
        ]),
        md("div", current.q, "drill-q")
      ]);

      if (!revealed) {
        card.appendChild(h("div", { class: "btn-row", style: { marginTop: "22px" } }, [
          h("button", {
            class: "btn primary", type: "button",
            onclick: function () { revealed = true; paint(); }
          }, "Reveal answer"),
          h("span", { class: "muted", style: { fontSize: "12px" } }, [h("kbd", null, "Space")])
        ]));
      } else {
        card.appendChild(md("div", current.a, "drill-a"));
        card.appendChild(h("div", { class: "grade-row" }, App.SRS.GRADES.map(function (g) {
          var preview = previewInterval(current.id, g.g);
          return h("button", {
            class: "btn", type: "button", onclick: function () { grade(g.g); }
          }, [
            h("span", null, (g.g + 1) + "  " + g.label),
            h("small", null, preview)
          ]);
        })));
      }

      host.appendChild(h("div", null, [
        h("div", { class: "sub tabular", style: { display: "flex", gap: "14px", marginBottom: "12px" } }, [
          h("span", null, (queue.length + 1) + " left"),
          h("span", { class: "muted" }, done + " graded"),
          again ? h("span", { style: { color: "var(--warn)" } }, again + " re-queued") : null
        ]),
        card
      ]));
    }

    function previewInterval(id, g) {
      var e = Object.assign(App.SRS.fresh(), App.Store.card(id));
      var prev = e.intervalDays || 0, iv;
      if (g === 0) iv = 0;
      else if (g === 1) iv = prev <= 0 ? 1 : prev * 1.2;
      else if (g === 2) iv = prev <= 0 ? 1 : prev < 3 ? 3 : prev * e.ease;
      else iv = prev <= 0 ? 2 : prev < 3 ? 5 : prev * e.ease * 1.3;
      return App.SRS.fmtInterval(Math.min(365, iv));
    }

    function summary() {
      var stats = App.Store.stats();
      return h("div", { class: "card", style: { textAlign: "center", padding: "40px 20px" } }, [
        h("h2", null, done ? "Session complete" : "Nothing to review"),
        h("p", { class: "sub" }, done
          ? done + " card" + (done === 1 ? "" : "s") + " graded · " + again + " re-queued · " +
            stats.streakDays + "-day streak · " + App.Store.reviewsToday() + " reviews today"
          : "Open a lesson to start seeding cards into the queue."),
        h("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "16px" } }, [
          h("a", { class: "btn primary", href: "#/drill" }, "Back to drill"),
          h("a", { class: "btn", href: "#/drill/60s" }, "60-second explain"),
          h("a", { class: "btn ghost", href: "#/" }, "Home")
        ])
      ]);
    }

    function onKey(e) {
      if (App.UI.overlayOpen()) return;
      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (!current) return;
      if ((e.key === " " || e.key === "Spacebar")) {
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        if (!revealed) { revealed = true; paint(); }
        return;
      }
      if (revealed && e.key >= "1" && e.key <= "4") { e.preventDefault(); grade(parseInt(e.key, 10) - 1); }
    }
    doc.addEventListener("keydown", onKey);
    var prevExtra = teardown.extra;
    teardown.extra = function () { doc.removeEventListener("keydown", onKey); if (prevExtra) prevExtra(); };

    next();
  }

  /* ======================================================================== */
  /*  pages                                                                   */
  /* ======================================================================== */
  function drillPage(route, teardown) {
    ui();
    var scopeLesson = route.scope ? App.lesson(route.scope) : null;
    var host = h("div");

    if (route.scope && !scopeLesson) {
      return h("div", { class: "empty" }, [h("h2", null, "Unknown lesson"), h("p", null, route.scope)]);
    }

    if (scopeLesson) {
      /* scoped drill: every card, due or not */
      var cards = App.SRS.cardsOf(scopeLesson);
      var head = h("div", { class: "page-head" }, [
        h("div", { class: "grow" }, [
          h("div", { class: "eyebrow" }, "Scoped drill"),
          h("h1", null, scopeLesson.title),
          h("p", { class: "sub" }, cards.length + " cards · due dates ignored, grades still recorded")
        ]),
        h("a", { class: "btn", href: App.Router.lessonHash(scopeLesson) }, "Back to lesson")
      ]);
      runSession(host, cards, {}, teardown);
      return [head, host];
    }

    /* global queue landing */
    var q = App.SRS.queue({});
    var stats = App.Store.stats();
    var started = false;

    var landing = h("div", null, [
      h("div", { class: "page-head" }, [
        h("div", { class: "grow" }, [
          h("div", { class: "eyebrow" }, "Spaced repetition"),
          h("h1", null, "Drill"),
          h("p", { class: "sub" }, "SM-2-lite. Grade honestly — the schedule only works if you do.")
        ])
      ]),
      h("div", { class: "grid three" }, [
        statCard("Due now", q.due.length, q.due.length ? "cards scheduled for today" : "queue is clear"),
        statCard("New", q.fresh.length, q.newAvailable + " available (cap 20/day)"),
        statCard("Streak", stats.streakDays || 0, App.Store.reviewsToday() + " reviews today")
      ]),
      h("div", { class: "btn-row", style: { marginTop: "22px" } }, [
        h("button", {
          class: "btn primary", type: "button", disabled: !(q.due.length + q.fresh.length),
          onclick: function () {
            started = true;
            App.UI.clear(host);
            runSession(host, q.due.concat(shuffle(q.fresh.slice())), {}, teardown);
          }
        }, "Start session (" + (q.due.length + q.fresh.length) + ")"),
        h("a", { class: "btn", href: "#/drill/60s" }, "60-second explain"),
        h("button", {
          class: "btn ghost", type: "button",
          onclick: function () {
            App.UI.clear(host);
            runSession(host, shuffle(App.SRS.allCards().slice()).slice(0, 30), {}, teardown);
          }
        }, "Free practice (30 random)")
      ]),
      byTrackTable()
    ]);

    host.appendChild(landing);
    return host;
  }

  function statCard(label, value, sub) {
    return h("div", { class: "card" }, [
      h("div", { class: "eyebrow" }, label),
      h("h2", { class: "tabular", style: { fontSize: "28px" } }, String(value)),
      h("p", { class: "sub", style: { margin: "2px 0 0" } }, sub)
    ]);
  }

  function byTrackTable() {
    var rows = App.TRACKS.map(function (t) {
      var c = App.SRS.counts(t.id);
      var p = App.SRS.trackProgress(t.id);
      return { t: t, due: c.due, p: p };
    }).filter(function (r) { return r.p.total; });
    if (!rows.length) return null;
    return h("div", { class: "section" }, [
      h("h2", null, "By track"),
      h("div", { class: "table-wrap" }, h("table", null, [
        h("thead", null, h("tr", null, [
          h("th", null, "Track"), h("th", null, "Lessons"), h("th", null, "Mastered"), h("th", null, "Due")
        ])),
        h("tbody", null, rows.map(function (r) {
          return h("tr", null, [
            h("td", null, h("a", { href: "#/t/" + r.t.id }, r.t.label)),
            h("td", { class: "tabular" }, String(r.p.total)),
            h("td", { class: "tabular" }, String(r.p.mastered)),
            h("td", { class: "tabular", style: r.due ? { color: "var(--warn)" } : null }, String(r.due))
          ]);
        }))
      ]))
    ]);
  }

  /* ---- 60-second explain --------------------------------------------------- */
  function sixtyPage(route, teardown) {
    ui();
    var host = h("div");
    var pool = [];
    App.allLessons().forEach(function (l) {
      var st = App.Store.lessonState(App.keyOf(l));
      var prompts = (l.drill && l.drill.sixtySecond) || [];
      prompts.forEach(function (p, i) {
        pool.push({ lesson: l, prompt: p, index: i, studied: st.status !== "unseen" });
      });
    });
    var studied = pool.filter(function (p) { return p.studied; });
    var use = studied.length ? studied : pool;

    if (!use.length) {
      return h("div", { class: "empty" }, [
        h("h2", null, "No 60-second prompts yet"),
        h("p", null, "They come from lesson files. Build some lessons first.")
      ]);
    }

    var timerId = null, remaining = 60, running = false, phase = "prompt";
    var pick = use[Math.floor(Math.random() * use.length)];

    function stop() { if (timerId) { global.clearInterval(timerId); timerId = null; } running = false; }
    var prevExtra = teardown.extra;
    teardown.extra = function () { stop(); doc.removeEventListener("keydown", onKey); if (prevExtra) prevExtra(); };

    function onKey(e) {
      if (App.UI.overlayOpen()) return;
      var tag = e.target && e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Spacebar") {
        if (tag === "BUTTON" || tag === "A") return;
        e.preventDefault();
        if (phase === "prompt") toggleTimer();
        return;
      }
      if (phase === "review" && e.key >= "1" && e.key <= "4") { e.preventDefault(); grade(parseInt(e.key, 10) - 1); }
    }
    doc.addEventListener("keydown", onKey);

    function toggleTimer() {
      if (running) { stop(); paint(); return; }
      running = true;
      timerId = global.setInterval(function () {
        remaining -= 0.1;
        if (remaining <= 0) { remaining = 0; stop(); phase = "review"; paint(); return; }
        updateRing();
      }, 100);
      paint();
    }
    function grade(g) {
      var key = App.keyOf(pick.lesson);
      App.SRS.grade(App.SRS.sixtyId(key, pick.index), g);
      App.Store.recordReview(1);
      App.SRS.syncStatus(pick.lesson);
      App.UI.toast("Recorded — " + App.SRS.GRADES[g].label);
      again();
    }
    function again() {
      stop();
      pick = use[Math.floor(Math.random() * use.length)];
      remaining = 60; phase = "prompt";
      paint();
    }

    var ringVal = null, ringNum = null, ringSvg = null;
    function updateRing() {
      if (!ringVal) return;
      var r = 52, c = 2 * Math.PI * r, frac = Math.max(0, remaining / 60);
      ringVal.setAttribute("stroke-dasharray", (c * frac).toFixed(2) + " " + c.toFixed(2));
      ringNum.textContent = Math.ceil(remaining);
      ringSvg.classList.toggle("low", remaining <= 10);
    }

    function paint() {
      App.UI.clear(host);
      var l = pick.lesson;
      var head = h("div", { class: "page-head" }, [
        h("div", { class: "grow" }, [
          h("div", { class: "eyebrow" }, "60-second explain"),
          h("h1", null, "Explain it out loud"),
          h("p", { class: "sub" }, "Say the answer as if the interviewer is listening. Then self-check against the lesson.")
        ]),
        h("button", { class: "btn", type: "button", onclick: again }, "Another prompt")
      ]);
      host.appendChild(head);

      var r = 52, c = 2 * Math.PI * r, frac = Math.max(0, remaining / 60);
      ringVal = App.svgEl("circle", {
        class: "val", cx: 60, cy: 60, r: r, "stroke-width": 6,
        "stroke-dasharray": (c * frac).toFixed(2) + " " + c.toFixed(2)
      });
      ringNum = App.svgEl("text", {
        class: "timer-num", x: 60, y: 60, "text-anchor": "middle", "dominant-baseline": "central"
      }, String(Math.ceil(remaining)));
      ringSvg = App.svgEl("svg", { class: "timer-ring" + (remaining <= 10 ? " low" : ""), width: 120, height: 120, viewBox: "0 0 120 120" }, [
        App.svgEl("circle", { class: "track", cx: 60, cy: 60, r: r, "stroke-width": 6 }),
        ringVal, ringNum
      ]);

      var card = h("div", { class: "drill-card", style: { textAlign: "center" } }, [
        ringSvg,
        md("div", pick.prompt, "drill-q"),
        h("div", { class: "chips", style: { justifyContent: "center", marginTop: "14px" } }, [
          h("span", { class: "chip" }, App.trackMeta(l.track).label),
          h("a", { class: "chip accent", href: App.Router.lessonHash(l) }, "→ " + l.title)
        ])
      ]);

      if (phase === "prompt") {
        card.appendChild(h("div", { class: "btn-row", style: { justifyContent: "center", marginTop: "18px" } }, [
          h("button", { class: "btn primary", type: "button", onclick: toggleTimer },
            running ? "Pause" : (remaining === 60 ? "Start 60s" : "Resume")),
          h("button", {
            class: "btn", type: "button",
            onclick: function () { stop(); phase = "review"; paint(); }
          }, "Reveal now"),
          h("span", { class: "muted", style: { fontSize: "12px" } }, [h("kbd", null, "Space")])
        ]));
      } else {
        card.appendChild(h("div", { class: "grade-row" }, App.SRS.GRADES.map(function (g) {
          return h("button", { class: "btn", type: "button", onclick: function () { grade(g.g); } },
            [h("span", null, (g.g + 1) + "  " + g.label)]);
        })));
      }
      host.appendChild(card);

      if (phase === "review") {
        host.appendChild(h("div", { class: "section narrow" }, [
          h("h2", null, "Self-check — " + l.title),
          h("div", { class: "prose" }, App.UI.renderExplainer(l.explainer)),
          l.complexity && l.complexity.rows && l.complexity.rows.length
            ? h("div", { style: { marginTop: "16px" } }, App.UI.complexityTable(l.complexity)) : null,
          h("div", { class: "btn-row", style: { marginTop: "16px" } }, [
            h("a", { class: "btn", href: App.Router.lessonHash(l) }, "Open the full lesson")
          ])
        ]));
      }
    }

    paint();
    return host;
  }

  App.Drill = { page: drillPage, sixtyPage: sixtyPage, runSession: runSession };
})(typeof window !== "undefined" ? window : globalThis);
