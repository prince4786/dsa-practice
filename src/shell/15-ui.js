/* ============================================================================
   15-ui.js — DOM helper, chrome, page renderers, command palette.
   Nothing here ever injects author HTML: every string is escaped first and only
   the shell's own tags (<code>, <strong>, <em>, highlight spans) are added back.
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var doc = global.document;

  /* ---- dom helper --------------------------------------------------------- */
  function h(tag, attrs, children) {
    var e = doc.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === "class") e.className = v;
        else if (k === "html") e.innerHTML = v;
        else if (k === "text") e.textContent = v;
        else if (k === "style" && typeof v === "object") Object.assign(e.style, v);
        else if (k.slice(0, 2) === "on" && typeof v === "function") e.addEventListener(k.slice(2), v);
        else if (k === "dataset") Object.assign(e.dataset, v);
        else if (v === true) e.setAttribute(k, "");
        else e.setAttribute(k, String(v));
      });
    }
    append(e, children);
    return e;
  }
  function append(parent, children) {
    if (children == null || children === false) return parent;
    if (Array.isArray(children)) { children.forEach(function (c) { append(parent, c); }); return parent; }
    parent.appendChild(children && children.nodeType ? children : doc.createTextNode(String(children)));
    return parent;
  }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); return el; }

  /* ---- inline markdown ---------------------------------------------------- */
  /** `code` -> <code>, **bold** -> <strong>, *italic* -> <em>. HTML-escaped first.
   *  Code spans are lifted out first so emphasis can still span across them. */
  var MARK = String.fromCharCode(1);                    // placeholder sentinel
  var RE_MARK = new RegExp(MARK + "(\\d+)" + MARK, "g");
  function inlineMd(text) {
    var codes = [];
    var s = String(text == null ? "" : text).replace(/`([^`]*)`/g, function (_, c) {
      codes.push(c);
      return MARK + (codes.length - 1) + MARK;
    });
    s = esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[\s(\[])\*([^*\n]+?)\*(?=$|[\s.,;:)\]!?])/g, "$1<em>$2</em>");
    s = s.replace(RE_MARK, function (_, i) { return "<code>" + esc(codes[+i]) + "</code>"; });
    return s;
  }
  /** Element with inline markdown applied. */
  function md(tag, text, cls) {
    return h(tag, { class: cls || null, html: inlineMd(text) });
  }

  /* ---- syntax highlighting ------------------------------------------------ */
  var KW = {
    python: "False|None|True|and|as|assert|async|await|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|nonlocal|not|or|pass|raise|return|try|while|with|yield|self|print|len|range|int|float|str|list|dict|set|tuple|min|max|sum|sorted|enumerate|zip|abs|map|filter",
    javascript: "async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|let|new|null|of|return|static|super|switch|this|throw|try|typeof|undefined|var|void|while|yield|true|false|Math|Array|Object|console",
    sql: "SELECT|FROM|WHERE|GROUP|BY|HAVING|ORDER|LIMIT|OFFSET|JOIN|LEFT|RIGHT|INNER|OUTER|FULL|CROSS|ON|AS|AND|OR|NOT|IN|EXISTS|BETWEEN|LIKE|IS|NULL|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|INDEX|VIEW|DROP|ALTER|ADD|PRIMARY|KEY|FOREIGN|REFERENCES|UNIQUE|DISTINCT|COUNT|SUM|AVG|MIN|MAX|CASE|WHEN|THEN|ELSE|END|UNION|ALL|WITH|OVER|PARTITION|BEGIN|COMMIT|ROLLBACK|TRANSACTION|EXPLAIN|ANALYZE|ASC|DESC|USING|RETURNING",
    pseudo: "if|else|elif|then|for|foreach|while|do|end|return|function|procedure|repeat|until|break|continue|and|or|not|true|false|null|nil"
  };
  var COMMENT = {
    python: "#[^\\n]*",
    javascript: "\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/",
    sql: "--[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/",
    pseudo: "#[^\\n]*|\\/\\/[^\\n]*"
  };
  var STRING = {
    python: "'''[\\s\\S]*?'''|\"\"\"[\\s\\S]*?\"\"\"|'(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"",
    javascript: "`(?:\\\\.|[^`\\\\])*`|'(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\"",
    sql: "'(?:''|[^'])*'|\"(?:[^\"])*\"",
    pseudo: "'(?:\\\\.|[^'\\\\\\n])*'|\"(?:\\\\.|[^\"\\\\\\n])*\""
  };
  var NUM = "\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b";
  var reCache = {};
  function langRe(lang) {
    if (reCache[lang]) return reCache[lang];
    var kw = KW[lang], flags = lang === "sql" ? "gi" : "g";
    var src = "(" + COMMENT[lang] + ")|(" + STRING[lang] + ")|(" + NUM + ")|\\b(" + kw + ")\\b";
    var re;
    try { re = new RegExp(src, flags); } catch (e) { re = null; }
    reCache[lang] = re;
    return re;
  }
  function highlight(code, lang) {
    lang = String(lang || "").toLowerCase();
    if (lang === "js") lang = "javascript";
    if (lang === "py") lang = "python";
    if (!KW[lang] || code.length > 20000) return esc(code);
    var re = langRe(lang);
    if (!re) return esc(code);
    var out = "", last = 0, m, guard = 0;
    re.lastIndex = 0;
    try {
      while ((m = re.exec(code)) !== null && guard++ < 8000) {
        if (m[0] === "") { re.lastIndex++; continue; }
        out += esc(code.slice(last, m.index));
        var cls = m[1] !== undefined ? "tok-com" : m[2] !== undefined ? "tok-str"
                : m[3] !== undefined ? "tok-num" : "tok-kw";
        out += '<span class="' + cls + '">' + esc(m[0]) + "</span>";
        last = m.index + m[0].length;
      }
      out += esc(code.slice(last));
    } catch (e) { return esc(code); }
    return out;
  }

  /* ---- code block --------------------------------------------------------- */
  function codeBlock(snippet, opts) {
    opts = opts || {};
    var code = String(snippet.code == null ? "" : snippet.code);
    var lang = snippet.lang || "pseudo";
    var pre = h("pre", { tabindex: "0", html: highlight(code, lang) });
    var copy = h("button", {
      class: "btn sm ghost", type: "button", title: "Copy to clipboard",
      onclick: function () { copyText(code, copy); }
    }, "Copy");
    var header = h("header", null, [
      snippet.label ? h("span", { class: "lbl" }, snippet.label) : null,
      h("span", { class: "lang" }, lang),
      h("span", { class: "grow" }),
      copy
    ]);
    return h("div", { class: "codeblock" + (opts.inline ? " inline" : "") }, [header, pre]);
  }

  function copyText(text, btn) {
    var done = function () {
      if (!btn) return;
      var old = btn.textContent;
      btn.textContent = "Copied";
      global.setTimeout(function () { btn.textContent = old; }, 1200);
    };
    try {
      if (global.navigator && global.navigator.clipboard && global.navigator.clipboard.writeText) {
        global.navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        return;
      }
    } catch (e) {}
    fallbackCopy(text, done);
  }
  function fallbackCopy(text, done) {
    try {
      var ta = h("textarea", { style: { position: "fixed", opacity: "0", top: "0" } });
      ta.value = text;
      doc.body.appendChild(ta);
      ta.select();
      doc.execCommand("copy");
      doc.body.removeChild(ta);
      done();
    } catch (e) { toast("Copy failed — select the code and press ⌘C"); }
  }

  var toastEl = null, toastTimer = null;
  function toast(msg) {
    if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    toastEl = h("div", { class: "toast", role: "status" }, msg);
    doc.body.appendChild(toastEl);
    if (toastTimer) global.clearTimeout(toastTimer);
    toastTimer = global.setTimeout(function () {
      if (toastEl && toastEl.parentNode) toastEl.parentNode.removeChild(toastEl);
    }, 2000);
  }

  /* ---- explainer / complexity --------------------------------------------- */
  var TONE_LABEL = { tip: "Tip", warn: "Watch out", pitfall: "Pitfall" };
  function renderExplainer(blocks) {
    var out = [];
    (blocks || []).forEach(function (b) {
      if (!b || typeof b !== "object") return;
      switch (b.type) {
        case "h3": out.push(md("h3", b.text)); break;
        case "p": out.push(md("p", b.text)); break;
        case "list":
          out.push(h("ul", null, (b.items || []).map(function (it) { return md("li", it); })));
          break;
        case "callout":
          out.push(h("div", { class: "callout " + (b.tone || "tip") }, [
            h("span", { class: "ic" }, TONE_LABEL[b.tone] || "Note"),
            h("div", { class: "grow" }, md("p", b.text))
          ]));
          break;
        case "code": out.push(codeBlock({ code: b.code, lang: b.lang, label: b.label }, { inline: true })); break;
        default: break;
      }
    });
    return out;
  }

  function complexityTable(cx) {
    if (!cx || !cx.rows || !cx.rows.length) return null;
    var hasNote = cx.rows.some(function (r) { return r.note; });
    return h("div", { class: "table-wrap" }, h("table", null, [
      h("thead", null, h("tr", null, [
        h("th", null, "Operation"), h("th", null, "Time"), h("th", null, "Space"),
        hasNote ? h("th", null, "Note") : null
      ])),
      h("tbody", null, cx.rows.map(function (r) {
        return h("tr", null, [
          h("td", null, r.operation),
          h("td", { class: "mono" }, r.time),
          h("td", { class: "mono" }, r.space),
          hasNote ? h("td", null, r.note || "") : null
        ]);
      }))
    ]));
  }

  /* ---- small pieces -------------------------------------------------------- */
  function pips(n) {
    return h("span", { class: "pips", title: "Difficulty " + n + "/3", "aria-label": "difficulty " + n + " of 3" },
      [1, 2, 3].map(function (i) { return h("i", { class: "pip" + (i <= n ? " on" : "") }); }));
  }
  function statusDot(status) {
    var t = { unseen: "Not started", learning: "Learning", reviewing: "Reviewing", mastered: "Mastered" };
    return h("span", { class: "status-dot " + status, title: t[status] || status, "aria-label": t[status] || status });
  }
  function ring(pct, size, label) {
    size = size || 34;
    var r = (size - 5) / 2, c = 2 * Math.PI * r;
    var sv = App.svgEl("svg", { class: "ring", width: size, height: size, viewBox: "0 0 " + size + " " + size }, [
      App.svgEl("circle", { class: "track", cx: size / 2, cy: size / 2, r: r, "stroke-width": 3 }),
      App.svgEl("circle", {
        class: "val", cx: size / 2, cy: size / 2, r: r, "stroke-width": 3,
        "stroke-dasharray": (c * pct / 100).toFixed(2) + " " + c.toFixed(2)
      })
    ]);
    if (label) sv.appendChild(App.svgEl("text", {
      class: "ring-label", x: size / 2, y: size / 2, "text-anchor": "middle", "dominant-baseline": "central"
    }, label));
    return sv;
  }
  function bar(pct) { return h("div", { class: "bar" }, h("i", { style: { width: Math.max(0, Math.min(100, pct)) + "%" } })); }

  /* ---- sidebar ------------------------------------------------------------- */
  /* The theme button is updated in place rather than by re-rendering the page,
     so toggling the theme never resets the visualizer you are mid-way through. */
  var themeBtn = null;
  App.Theme.onChange(function () {
    if (themeBtn) themeBtn.textContent = App.Theme.current() === "dark" ? "◐" : "◑";
  });

  function sidebar(route) {
    var counts = App.SRS.counts();
    var prog = App.SRS.overallProgress();
    var items = [];
    items.push(h("a", { class: "brand", href: "#/" }, [h("span", { class: "dot" }), "CS Interview Prep"]));
    items.push(h("a", {
      class: "nav-item" + (route.name === "home" ? " active" : ""), href: "#/"
    }, ["Home", h("span", { class: "key" }, "g h")]));

    items.push(h("div", { class: "nav-section" }, "Tracks"));
    App.TRACKS.forEach(function (t, i) {
      var n = App.lessonsIn(t.id).length;
      var active = (route.track === t.id);
      items.push(h("a", {
        class: "nav-item" + (active ? " active" : ""), href: "#/t/" + t.id
      }, [
        h("span", { class: "grow" }, t.label),
        h("span", { class: "count" }, String(n)),
        h("span", { class: "key" }, "g " + (i + 1))
      ]));
    });

    items.push(h("div", { class: "nav-section" }, "Practice"));
    items.push(h("a", {
      class: "nav-item" + (route.name === "drill" ? " active" : ""), href: "#/drill"
    }, ["Drill", h("span", { class: "count" + (counts.due ? " due" : "") }, String(counts.due))]));
    items.push(h("a", {
      class: "nav-item" + (route.name === "sixty" ? " active" : ""), href: "#/drill/60s"
    }, ["60-second explain"]));

    items.push(h("div", { class: "nav-spacer" }));
    items.push(h("div", { class: "sidebar-foot" }, [
      ring(prog.pct, 30, prog.pct + ""),
      h("div", { class: "grow" }, [
        h("div", { class: "mono", style: { fontSize: "11px" } }, prog.mastered + " / " + prog.total + " mastered"),
        h("div", { class: "muted", style: { fontSize: "11px" } }, App.Store.stats().streakDays + "d streak")
      ]),
      (themeBtn = h("button", {
        class: "btn icon ghost", type: "button", title: "Toggle theme (t)",
        onclick: function () { App.Theme.toggle(); }
      }, App.Theme.current() === "dark" ? "◐" : "◑"))
    ]));
    items.push(h("button", {
      class: "btn sm ghost", type: "button", style: { margin: "8px 4px 0" },
      onclick: function () { openPalette(); }
    }, "Search  /"));

    return h("nav", { class: "sidebar", id: "sidebar", "aria-label": "Primary" }, items);
  }

  /* ---- home ---------------------------------------------------------------- */
  function homePage() {
    var all = App.allLessons();
    var counts = App.SRS.counts();
    var prog = App.SRS.overallProgress();
    var meta = App.Store.meta();
    var kids = [];

    kids.push(h("div", { class: "page-head" }, [
      h("div", { class: "grow" }, [
        h("div", { class: "eyebrow" }, "Dashboard"),
        h("h1", null, "CS Interview Prep"),
        h("p", { class: "sub" }, all.length
          ? all.length + " lessons across " + App.TRACKS.length + " tracks — every one with a step-through visualizer."
          : "No lessons are built into this bundle yet.")
      ]),
      h("div", { style: { display: "flex", gap: "10px", alignItems: "center" } }, [
        ring(prog.pct, 46, prog.pct + "%")
      ])
    ]));

    if (!all.length) {
      kids.push(h("div", { class: "empty" }, [
        h("h2", null, "Nothing built yet"),
        h("p", null, "Add lesson files under src/topics/<track>/ and re-run node build.js.")
      ]));
      return kids;
    }

    /* stat row */
    var lastLesson = null;
    if (meta.lastRoute) {
      var r = App.Router.parse(meta.lastRoute);
      if ((r.name === "lesson" || r.name === "viz") && App.lesson(r.key)) lastLesson = App.lesson(r.key);
    }
    kids.push(h("div", { class: "grid three" }, [
      h("a", { class: "card card-link", href: "#/drill" }, [
        h("div", { class: "eyebrow" }, "Spaced repetition"),
        h("h2", { class: "tabular" }, counts.due + (counts.due === 1 ? " card due" : " cards due")),
        h("p", { class: "sub", style: { margin: "4px 0 0" } },
          counts.due ? "Start reviewing →" : (counts.fresh ? counts.fresh + " new cards ready →" : "Nothing due. Open a lesson to seed new cards."))
      ]),
      lastLesson
        ? h("a", { class: "card card-link", href: App.Router.lessonHash(lastLesson) }, [
            h("div", { class: "eyebrow" }, "Continue"),
            h("h2", null, lastLesson.title),
            h("p", { class: "sub", style: { margin: "4px 0 0" } }, App.trackMeta(lastLesson.track).label + " · " + lastLesson.minutes + " min")
          ])
        : h("div", { class: "card" }, [
            h("div", { class: "eyebrow" }, "Continue"),
            h("h2", null, "Start anywhere"),
            h("p", { class: "sub", style: { margin: "4px 0 0" } }, "Your last lesson shows up here.")
          ]),
      h("div", { class: "card" }, [
        h("div", { class: "eyebrow" }, "Explore"),
        h("h2", null, "Random visualizer"),
        h("div", { class: "btn-row", style: { marginTop: "10px" } }, [
          h("button", {
            class: "btn primary", type: "button",
            onclick: function () {
              var l = all[Math.floor(Math.random() * all.length)];
              App.Router.go("#/t/" + App.keyOf(l) + "/viz");
            }
          }, "Surprise me"),
          h("button", { class: "btn ghost", type: "button", onclick: function () { openPalette(); } }, "Search")
        ])
      ])
    ]));

    /* tracks */
    kids.push(h("div", { class: "section" }, [
      h("h2", null, "Tracks"),
      h("div", { class: "grid two" }, App.TRACKS.map(function (t) {
        var p = App.SRS.trackProgress(t.id);
        var due = App.SRS.counts(t.id).due;
        return h("a", { class: "card card-link", href: "#/t/" + t.id }, [
          h("div", { style: { display: "flex", alignItems: "baseline", gap: "8px" } }, [
            h("h3", { class: "grow" }, t.label),
            h("span", { class: "chip" }, p.total + " lessons")
          ]),
          h("div", { style: { margin: "10px 0 6px" } }, bar(p.pct)),
          h("div", { class: "sub tabular", style: { display: "flex", gap: "10px" } }, [
            h("span", null, p.mastered + " mastered"),
            h("span", { class: "muted" }, p.started + " started"),
            due ? h("span", { style: { color: "var(--warn)" } }, due + " due") : null
          ])
        ]);
      }))
    ]));
    return kids;
  }

  /* ---- track page ---------------------------------------------------------- */
  function trackPage(route) {
    var t = App.trackMeta(route.track);
    var ls = App.lessonsIn(route.track);
    var p = App.SRS.trackProgress(route.track);
    var due = App.SRS.counts(route.track).due;
    var kids = [];
    kids.push(h("div", { class: "page-head" }, [
      h("div", { class: "grow" }, [
        h("div", { class: "eyebrow" }, "Track"),
        h("h1", null, t.label),
        h("p", { class: "sub" }, ls.length + " lessons · " + p.mastered + " mastered · " + due + " cards due")
      ]),
      h("div", { class: "btn-row" }, [
        due ? h("a", { class: "btn primary", href: "#/drill" }, "Review " + due + " due") : null,
        ls.length ? h("a", { class: "btn", href: "#/t/" + App.keyOf(ls[0]) }, "Start track") : null
      ])
    ]));
    if (!ls.length) {
      kids.push(h("div", { class: "empty" }, [
        h("h2", null, "No lessons in this track yet"),
        h("p", null, "Files go in src/topics/" + route.track + "/ as NN-<id>.js, then re-run node build.js.")
      ]));
      return kids;
    }
    kids.push(h("div", { class: "stack" }, ls.map(function (l, i) {
      var st = App.SRS.statusOf(l);
      var ldue = App.SRS.cardIdsFor(l).filter(function (id) { return App.SRS.isDue(id); }).length;
      return h("a", { class: "lesson-row", href: App.Router.lessonHash(l) }, [
        h("span", { class: "idx" }, String(i + 1).padStart(2, "0")),
        statusDot(st),
        h("span", { class: "grow" }, [
          h("div", { class: "t" }, l.title),
          h("div", { class: "m" }, (l.tags || []).slice(0, 4).join(" · "))
        ]),
        ldue ? h("span", { class: "chip", style: { color: "var(--warn)" } }, ldue + " due") : null,
        pips(l.difficulty),
        h("span", { class: "m tabular", style: { width: "52px", textAlign: "right" } }, l.minutes + " min")
      ]);
    })));
    return kids;
  }

  /* ---- lesson page --------------------------------------------------------- */
  var SECTIONS = [
    { id: "viz", label: "Visualizer" },
    { id: "explainer", label: "Explainer" },
    { id: "complexity", label: "Complexity" },
    { id: "code", label: "Code" },
    { id: "interview", label: "Why asked" },
    { id: "followups", label: "Follow-ups" },
    { id: "drill", label: "Drill me" }
  ];

  function lessonPage(route, teardown) {
    var l = App.lesson(route.key);
    if (!l) return notFound(route);
    var key = App.keyOf(l);
    App.Store.visit(key);
    var nb = App.neighbours(key);
    var t = App.trackMeta(l.track);
    var kids = [];

    var present = SECTIONS.filter(function (s) {
      if (s.id === "complexity") return !!(l.complexity && l.complexity.rows && l.complexity.rows.length);
      if (s.id === "followups") return !!(l.interview && l.interview.followUps && l.interview.followUps.length);
      return true;
    });

    kids.push(h("div", { class: "tabbar", id: "tabbar" }, present.map(function (s) {
      return h("a", { href: "#/t/" + key, dataset: { sec: s.id }, onclick: function (e) {
        e.preventDefault();
        var el = doc.getElementById("sec-" + s.id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      } }, s.label);
    })));

    kids.push(h("div", { class: "page-head narrow", style: { marginTop: "18px" } }, [
      h("div", { class: "grow" }, [
        h("div", { class: "eyebrow" }, [h("a", { href: "#/t/" + l.track }, t.label)]),
        h("h1", null, l.title),
        h("div", { class: "chips", style: { marginTop: "8px" } }, [
          pips(l.difficulty),
          h("span", { class: "chip" }, l.minutes + " min"),
          h("span", { class: "chip" }, App.SRS.statusOf(l)),
          (l.tags || []).map(function (tg) { return h("span", { class: "chip" }, tg); })
        ])
      ])
    ]));

    /* --- visualizer first (§1) --- */
    var vizHost = h("div", { class: "section", id: "sec-viz", style: { marginTop: "8px" } });
    kids.push(vizHost);

    /* --- explainer --- */
    kids.push(h("div", { class: "section narrow", id: "sec-explainer" }, [
      h("h2", null, "Explainer"),
      h("div", { class: "prose" }, renderExplainer(l.explainer))
    ]));

    /* --- complexity --- */
    if (l.complexity && l.complexity.rows && l.complexity.rows.length) {
      kids.push(h("div", { class: "section narrow", id: "sec-complexity" }, [
        h("h2", null, "Complexity"),
        complexityTable(l.complexity)
      ]));
    }

    /* --- code --- */
    kids.push(h("div", { class: "section narrow", id: "sec-code" }, [
      h("h2", null, "Code"),
      (l.code || []).map(function (c) { return codeBlock(c); })
    ]));

    /* --- interview --- */
    kids.push(h("div", { class: "section narrow", id: "sec-interview" }, [
      h("h2", null, "Why interviewers ask this"),
      h("div", { class: "prose" }, md("p", (l.interview && l.interview.whyAsked) || ""))
    ]));

    /* --- follow-ups --- */
    if (l.interview && l.interview.followUps && l.interview.followUps.length) {
      kids.push(h("div", { class: "section narrow", id: "sec-followups" }, [
        h("h2", null, "Follow-ups"),
        l.interview.followUps.map(function (fu) {
          return h("details", { class: "qa" }, [
            h("summary", null, md("span", fu.q)),
            h("div", { class: "body" }, md("div", fu.a))
          ]);
        })
      ]));
    }

    /* --- drill --- */
    var nCards = ((l.drill && l.drill.cards) || []).length;
    kids.push(h("div", { class: "section narrow", id: "sec-drill" }, [
      h("h2", null, "Drill me"),
      h("div", { class: "card" }, [
        h("p", { class: "sub" }, nCards + " question" + (nCards === 1 ? "" : "s") +
          " from this lesson, plus " + (((l.drill && l.drill.sixtySecond) || []).length) + " 60-second prompts. Grades feed the same spaced-repetition schedule."),
        h("div", { class: "btn-row" }, [
          h("a", { class: "btn primary", href: "#/drill/" + key }, "Drill this lesson"),
          h("a", { class: "btn", href: "#/drill/60s" }, "60-second explain")
        ])
      ])
    ]));

    /* --- prev/next --- */
    kids.push(h("div", { class: "section narrow", style: { display: "flex", gap: "12px", justifyContent: "space-between" } }, [
      nb.prev ? h("a", { class: "btn", href: App.Router.lessonHash(nb.prev) }, "← " + nb.prev.title) : h("span"),
      nb.next ? h("a", { class: "btn", href: App.Router.lessonHash(nb.next) }, nb.next.title + " →") : h("span")
    ]));

    /* mount the player after the DOM is in the document */
    teardown.after = function () {
      var p = App.Player.mount(vizHost, l, { full: false });
      teardown.player = p;
      spyTabs(present, teardown);
    };
    return kids;
  }

  function vizPage(route, teardown) {
    var l = App.lesson(route.key);
    if (!l) return notFound(route);
    App.Store.visit(App.keyOf(l));
    var host = h("div", { id: "sec-viz" });
    var kids = [
      h("div", { class: "page-head" }, [
        h("div", { class: "grow" }, [
          h("div", { class: "eyebrow" }, [h("a", { href: "#/t/" + l.track }, App.trackMeta(l.track).label)]),
          h("h1", null, l.title)
        ]),
        h("a", { class: "btn", href: "#/t/" + App.keyOf(l) }, "Full lesson")
      ]),
      host,
      h("p", { class: "sub", style: { marginTop: "14px" } }, [
        h("kbd", null, "Space"), " play · ", h("kbd", null, "←/→"), " step · ",
        h("kbd", null, "⇧←/→"), " ±10 · ", h("kbd", null, "Home/End"), " ends · ",
        h("kbd", null, "-/="), " speed · ", h("kbd", null, "r"), " reset"
      ])
    ];
    teardown.after = function () { teardown.player = App.Player.mount(host, l, { full: true }); };
    return kids;
  }

  function spyTabs(present, teardown) {
    if (!global.IntersectionObserver) return;
    var links = {};
    Array.prototype.forEach.call(doc.querySelectorAll(".tabbar a"), function (a) { links[a.dataset.sec] = a; });
    var io = new global.IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id.replace(/^sec-/, "");
        Object.keys(links).forEach(function (k) { links[k].classList.toggle("active", k === id); });
      });
    }, { rootMargin: "-60px 0px -70% 0px", threshold: 0 });
    present.forEach(function (s) {
      var el = doc.getElementById("sec-" + s.id);
      if (el) io.observe(el);
    });
    var prev = teardown.extra;
    teardown.extra = function () { io.disconnect(); if (prev) prev(); };
  }

  function notFound(route) {
    return h("div", { class: "empty" }, [
      h("h2", null, "Nothing here"),
      h("p", null, "No route or lesson matches " + (route.hash || "")),
      h("p", null, h("a", { href: "#/" }, "Back to the dashboard"))
    ]);
  }

  /* ---- command palette (fuzzy search) -------------------------------------- */
  var overlay = null;

  function fuzzy(q, text) {
    // subsequence match with bonuses for consecutive runs and word starts
    var t = text.toLowerCase(), n = t.length, qi = 0, score = 0, run = 0, pos = [];
    for (var i = 0; i < n && qi < q.length; i++) {
      if (t.charAt(i) === q.charAt(qi)) {
        var wordStart = i === 0 || /[\s\-\/_.]/.test(t.charAt(i - 1));
        score += 1 + run * 2 + (wordStart ? 3 : 0);
        run++; pos.push(i); qi++;
      } else run = 0;
    }
    if (qi < q.length) return null;
    score -= (n - q.length) * 0.05;
    return { score: score, pos: pos };
  }
  function searchLessons(query) {
    var q = query.trim().toLowerCase();
    var all = App.allLessons();
    if (!q) {
      return all.slice(0, 40).map(function (l) { return { l: l, pos: [], score: 0 }; });
    }
    var res = [];
    all.forEach(function (l) {
      var m = fuzzy(q, l.title);
      var best = m ? { score: m.score + 6, pos: m.pos } : null;
      var hay = (l.tags || []).join(" ") + " " + App.trackMeta(l.track).label + " " + l.id;
      var m2 = fuzzy(q, hay);
      if (m2 && (!best || m2.score > best.score)) best = { score: m2.score, pos: [] };
      if (best) res.push({ l: l, score: best.score, pos: best.pos });
    });
    res.sort(function (a, b) { return b.score - a.score || a.l.__order - b.l.__order; });
    return res.slice(0, 40);
  }
  function markTitle(title, pos) {
    if (!pos || !pos.length) return esc(title);
    var out = "", set = {};
    pos.forEach(function (p) { set[p] = 1; });
    for (var i = 0; i < title.length; i++) {
      out += set[i] ? "<mark>" + esc(title.charAt(i)) + "</mark>" : esc(title.charAt(i));
    }
    return out;
  }

  function openPalette() {
    if (overlay) closeOverlay();
    var input = h("input", {
      class: "palette-input", type: "text", placeholder: "Search lessons and tags…",
      "aria-label": "Search lessons", autocomplete: "off", spellcheck: "false"
    });
    var list = h("div", { class: "palette-list", role: "listbox" });
    var sel = 0, rows = [];

    function paint() {
      var results = searchLessons(input.value);
      clear(list);
      rows = results.map(function (r, i) {
        var row = h("div", {
          class: "palette-item", role: "option", "aria-selected": i === sel ? "true" : "false",
          onclick: function () { go(r.l); },
          onmousemove: function () { if (sel !== i) { sel = i; markSel(); } }
        }, [
          statusDot(App.SRS.statusOf(r.l)),
          h("span", { class: "t", html: markTitle(r.l.title, r.pos) }),
          h("span", { class: "tr" }, App.trackMeta(r.l.track).short)
        ]);
        list.appendChild(row);
        return row;
      });
      if (!rows.length) list.appendChild(h("div", { class: "palette-item muted" }, "No matches"));
      sel = Math.min(sel, Math.max(0, rows.length - 1));
      markSel();
    }
    function markSel() {
      rows.forEach(function (r, i) {
        r.setAttribute("aria-selected", i === sel ? "true" : "false");
        if (i === sel && r.scrollIntoView) r.scrollIntoView({ block: "nearest" });
      });
    }
    function go(l) { closeOverlay(); App.Router.go(App.Router.lessonHash(l)); }

    input.addEventListener("input", function () { sel = 0; paint(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); sel = Math.min(rows.length - 1, sel + 1); markSel(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); sel = Math.max(0, sel - 1); markSel(); }
      else if (e.key === "Enter") {
        e.preventDefault();
        var results = searchLessons(input.value);
        if (results[sel]) go(results[sel].l);
      } else if (e.key === "Escape") { e.preventDefault(); closeOverlay(); }
    });

    var panel = h("div", { class: "panel", role: "dialog", "aria-modal": "true", "aria-label": "Search" }, [
      input, list,
      h("div", { class: "palette-foot" }, [
        h("span", null, [h("kbd", null, "↑↓"), " navigate"]),
        h("span", null, [h("kbd", null, "↵"), " open"]),
        h("span", null, [h("kbd", null, "esc"), " close"])
      ])
    ]);
    mountOverlay(panel);
    paint();
    input.focus();
  }

  function openShortcuts() {
    if (overlay) { closeOverlay(); return; }
    var rows = [
      ["/  or  ⌘K", "Search lessons"],
      ["?", "This help"],
      ["g then 1–7", "Jump to a track"],
      ["g then h", "Home"],
      ["g then d", "Drill queue"],
      ["[  ]", "Previous / next lesson"],
      ["t", "Toggle theme"],
      ["Space", "Play / pause the visualizer"],
      ["← →", "Step one frame"],
      ["⇧← ⇧→", "Jump ten frames"],
      ["Home / End", "First / last frame"],
      ["- =", "Slower / faster"],
      ["r", "Reset (re-seeds if the viz has a seed)"],
      ["1–4", "Grade a drill card (Again…Easy)"],
      ["Esc", "Close overlays"]
    ];
    var panel = h("div", { class: "panel", role: "dialog", "aria-modal": "true", "aria-label": "Keyboard shortcuts" }, [
      h("div", { class: "palette-input", style: { fontWeight: "600" } }, "Keyboard shortcuts"),
      h("div", { class: "shortcut-grid" }, rows.map(function (r) {
        return h("div", null, [h("kbd", null, r[0]), h("span", null, r[1])]);
      })),
      h("div", { class: "palette-foot" }, h("span", null, [h("kbd", null, "esc"), " close"]))
    ]);
    mountOverlay(panel);
    panel.setAttribute("tabindex", "-1");
    panel.focus();
  }

  function mountOverlay(panel) {
    overlay = h("div", {
      class: "overlay", onclick: function (e) { if (e.target === overlay) closeOverlay(); }
    }, panel);
    doc.body.appendChild(overlay);
  }
  function closeOverlay() {
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
  }

  /* ---- page shell + render ------------------------------------------------- */
  var teardown = { player: null, extra: null, after: null };

  function render(route) {
    if (teardown.player) { try { teardown.player.destroy(); } catch (e) {} teardown.player = null; }
    if (teardown.extra) { try { teardown.extra(); } catch (e) {} teardown.extra = null; }
    teardown.after = null;

    var app = doc.getElementById("app");
    clear(app);
    app.removeAttribute("aria-busy");

    var wide = route.name === "lesson" || route.name === "viz";
    var main = h("main", { class: "main", id: "main" });
    var inner = h("div", { class: wide ? "wrap-wide" : "wrap" });
    main.appendChild(inner);

    var body;
    switch (route.name) {
      case "home": body = homePage(); break;
      case "track": body = trackPage(route); break;
      case "lesson": body = lessonPage(route, teardown); break;
      case "viz": body = vizPage(route, teardown); break;
      case "drill": body = App.Drill.page(route, teardown); break;
      case "sixty": body = App.Drill.sixtyPage(route, teardown); break;
      default: body = notFound(route);
    }
    append(inner, body);

    if (global.__LESSON_ERRORS && global.__LESSON_ERRORS.length && route.name === "home") {
      inner.insertBefore(h("div", { class: "error-card", style: { marginBottom: "18px" } }, [
        h("h3", null, global.__LESSON_ERRORS.length + " lesson(s) failed validation and were skipped"),
        h("pre", null, global.__LESSON_ERRORS.map(function (e) {
          return e.key + "\n  " + e.errors.join("\n  ");
        }).join("\n"))
      ]), inner.firstChild);
    }

    var layout = h("div", { class: "layout" }, [sidebar(route), main]);
    app.appendChild(layout);
    app.appendChild(h("button", {
      class: "btn icon hamburger", type: "button", "aria-label": "Menu",
      onclick: function () { toggleSidebar(); }
    }, "☰"));

    if (teardown.after) { try { teardown.after(); } catch (e) { console.error(e); } }

    try { App.Store.setMeta({ lastRoute: route.hash }); } catch (e) {}
    global.scrollTo(0, 0);
  }

  function toggleSidebar(force) {
    var sb = doc.getElementById("sidebar");
    if (!sb) return;
    var open = force == null ? !sb.classList.contains("open") : force;
    sb.classList.toggle("open", open);
    var scrim = doc.querySelector(".scrim");
    if (open && !scrim) {
      doc.body.appendChild(h("div", { class: "scrim", onclick: function () { toggleSidebar(false); } }));
    } else if (!open && scrim) scrim.parentNode.removeChild(scrim);
  }

  App.UI = {
    h: h, esc: esc, md: md, inlineMd: inlineMd, clear: clear, append: append,
    codeBlock: codeBlock, highlight: highlight, renderExplainer: renderExplainer,
    complexityTable: complexityTable, ring: ring, bar: bar, pips: pips, statusDot: statusDot,
    toast: toast, copyText: copyText,
    render: render, openPalette: openPalette, openShortcuts: openShortcuts,
    closeOverlay: closeOverlay, toggleSidebar: toggleSidebar,
    overlayOpen: function () { return !!overlay; }
  };
})(typeof window !== "undefined" ? window : globalThis);
