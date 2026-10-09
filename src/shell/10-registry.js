/* ============================================================================
   10-registry.js — lesson registry + THE schema validator.
   This exact file is also loaded by build.js (via new Function("window", src)),
   so the build and the runtime share one validation source. Keep it free of
   DOM access: it must run headless.
   ========================================================================== */
(function (global) {
  "use strict";

  var App = global.App || (global.App = {});

  App.TRACKS = [
    { id: "dsa",       label: "DSA",                    short: "DSA" },
    { id: "db",        label: "Databases",              short: "DB" },
    { id: "ml",        label: "Machine Learning",       short: "ML" },
    { id: "rl",        label: "Reinforcement Learning", short: "RL" },
    { id: "agents",    label: "LLM Agents",             short: "AG" },
    { id: "ai",        label: "AI Foundations",         short: "AI" },
    { id: "sysdesign", label: "System Design",          short: "SD" }
  ];
  App.TRACK_IDS = App.TRACKS.map(function (t) { return t.id; });

  var LANGS = ["python", "sql", "javascript", "pseudo"];
  var BLOCKS = ["p", "h3", "list", "callout", "code", "image", "steps"];
  var TONES = ["tip", "warn", "pitfall"];
  var KINDS = ["canvas", "svg", "diagram"];
  var PARAM_TYPES = ["int", "float", "enum", "seed", "bool"];

  function isStr(v) { return typeof v === "string"; }
  function isNum(v) { return typeof v === "number" && isFinite(v); }
  function isInt(v) { return isNum(v) && Math.floor(v) === v; }
  function isArr(v) { return Array.isArray(v); }
  function isObj(v) { return v && typeof v === "object" && !Array.isArray(v); }
  function isFn(v) { return typeof v === "function"; }
  function type(v) { return v === null ? "null" : Array.isArray(v) ? "array" : typeof v; }

  /**
   * Validate a lesson object against §2 / §3 of the spec.
   * @returns {{errors: string[], warnings: string[]}}
   *   errors   -> fail the build (or refuse registration at runtime)
   *   warnings -> printed, never fatal (editorial limits: title length, card counts…)
   */
  function validateLesson(key, L) {
    var E = [], W = [];
    function err(field, msg) { E.push(field + ": " + msg); }
    function warn(field, msg) { W.push(field + ": " + msg); }
    function need(field, v, ok, what) {
      if (!ok(v)) { err(field, "expected " + what + ", got " + type(v)); return false; }
      return true;
    }

    if (!isObj(L)) { return { errors: ["<root>: expected an object, got " + type(L)], warnings: [] }; }

    /* ---- identity -------------------------------------------------------- */
    if (need("id", L.id, isStr, "string")) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(L.id)) err("id", 'must be kebab-case, got "' + L.id + '"');
    }
    if (need("track", L.track, isStr, "string")) {
      if (App.TRACK_IDS.indexOf(L.track) === -1)
        err("track", '"' + L.track + '" is not one of ' + App.TRACK_IDS.join("|"));
    }
    if (need("title", L.title, isStr, "string")) {
      if (!L.title.trim()) err("title", "must not be empty");
      else if (L.title.length > 40) warn("title", "is " + L.title.length + " chars (spec says <= 40)");
    }
    if (need("difficulty", L.difficulty, isInt, "int 1|2|3")) {
      if (L.difficulty < 1 || L.difficulty > 3) err("difficulty", "must be 1, 2 or 3, got " + L.difficulty);
    }
    if (need("minutes", L.minutes, isInt, "int")) {
      if (L.minutes <= 0 || L.minutes > 180) warn("minutes", "implausible value " + L.minutes);
    }
    if (need("tags", L.tags, isArr, "string[]")) {
      L.tags.forEach(function (t, i) {
        if (!isStr(t)) err("tags[" + i + "]", "expected string, got " + type(t));
        else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(t)) warn("tags[" + i + "]", 'should be lowercase kebab-case: "' + t + '"');
      });
    }

    /* ---- explainer ------------------------------------------------------- */
    if (need("explainer", L.explainer, isArr, "block[]")) {
      if (!L.explainer.length) err("explainer", "must contain at least one block");
      L.explainer.forEach(function (b, i) {
        var f = "explainer[" + i + "]";
        if (!isObj(b)) { err(f, "expected object, got " + type(b)); return; }
        if (BLOCKS.indexOf(b.type) === -1) {
          err(f + ".type", '"' + b.type + '" is not one of ' + BLOCKS.join("|")); return;
        }
        if (b.type === "list") {
          if (need(f + ".items", b.items, isArr, "string[]")) {
            if (!b.items.length) err(f + ".items", "must not be empty");
            b.items.forEach(function (it, j) {
              if (!isStr(it)) err(f + ".items[" + j + "]", "expected string, got " + type(it));
            });
          }
        } else if (b.type === "steps") {
          need(f + ".text", b.text, isStr, "string");
          if (need(f + ".frames", b.frames, isArr, "frame[]")) {
            if (!b.frames.length) err(f + ".frames", "must not be empty");
            b.frames.forEach(function (frame, j) {
              var ff = f + ".frames[" + j + "]";
              if (!isObj(frame)) { err(ff, "expected object"); return; }
              need(ff + ".text", frame.text, isStr, "string");
              if (need(ff + ".slots", frame.slots, isArr, "string[]")) frame.slots.forEach(function (slot) {
                if (!isStr(slot)) err(ff + ".slots", "expected strings");
              });
            });
          }
        } else if (b.type === "image") {
          need(f + ".src", b.src, isStr, "string");
          need(f + ".text", b.text, isStr, "string");
          if (isStr(b.src) && !/^data:image\/svg\+xml[,;]/.test(b.src)) err(f + ".src", "expected embedded SVG image");
        } else if (b.type === "code") {
          need(f + ".code", b.code, isStr, "string");
          if (b.lang != null && !isStr(b.lang)) err(f + ".lang", "expected string, got " + type(b.lang));
        } else {
          need(f + ".text", b.text, isStr, "string");
          if (b.type === "callout" && TONES.indexOf(b.tone) === -1)
            err(f + ".tone", '"' + b.tone + '" is not one of ' + TONES.join("|"));
        }
      });
    }

    /* ---- complexity ------------------------------------------------------ */
    if (L.complexity !== null && L.complexity !== undefined) {
      if (need("complexity", L.complexity, isObj, "object or null")) {
        if (need("complexity.rows", L.complexity.rows, isArr, "row[]")) {
          if (!L.complexity.rows.length) err("complexity.rows", "must not be empty (use complexity: null instead)");
          L.complexity.rows.forEach(function (r, i) {
            var f = "complexity.rows[" + i + "]";
            if (!isObj(r)) { err(f, "expected object, got " + type(r)); return; }
            ["operation", "time", "space"].forEach(function (k) { need(f + "." + k, r[k], isStr, "string"); });
            if (r.note != null && !isStr(r.note)) err(f + ".note", "expected string, got " + type(r.note));
          });
        }
      }
    } else if (L.complexity === undefined) {
      err("complexity", "is required (use null when genuinely N/A)");
    }

    /* ---- glossary (optional) --------------------------------------------- */
    /* Plain-English definitions for the jargon a lesson uses. Optional so old
       lessons keep validating, but every lesson that uses acronyms should have
       one — unexplained jargon is the main thing that makes these unreadable
       to someone learning the topic rather than revising it. */
    if (L.glossary != null) {
      if (need("glossary", L.glossary, isArr, "{term,plain}[]")) {
        L.glossary.forEach(function (g, i) {
          var f = "glossary[" + i + "]";
          if (!isObj(g)) { err(f, "expected object, got " + type(g)); return; }
          need(f + ".term", g.term, isStr, "string");
          need(f + ".plain", g.plain, isStr, "string");
        });
      }
    }

    /* ---- interview ------------------------------------------------------- */
    if (need("interview", L.interview, isObj, "object")) {
      need("interview.whyAsked", L.interview.whyAsked, isStr, "string");
      if (need("interview.followUps", L.interview.followUps, isArr, "{q,a}[]")) {
        var n = L.interview.followUps.length;
        if (n < 3 || n > 8) warn("interview.followUps", "has " + n + " entries (spec says 3-8)");
        L.interview.followUps.forEach(function (fu, i) {
          var f = "interview.followUps[" + i + "]";
          if (!isObj(fu)) { err(f, "expected object, got " + type(fu)); return; }
          need(f + ".q", fu.q, isStr, "string");
          need(f + ".a", fu.a, isStr, "string");
        });
      }
    }

    /* ---- code ------------------------------------------------------------ */
    if (need("code", L.code, isArr, "snippet[]")) {
      if (!L.code.length) err("code", "must contain at least one snippet");
      if (L.code.length > 4) warn("code", "has " + L.code.length + " snippets (spec says 1-4)");
      L.code.forEach(function (c, i) {
        var f = "code[" + i + "]";
        if (!isObj(c)) { err(f, "expected object, got " + type(c)); return; }
        need(f + ".code", c.code, isStr, "string");
        need(f + ".label", c.label, isStr, "string");
        if (need(f + ".lang", c.lang, isStr, "string") && LANGS.indexOf(c.lang) === -1)
          warn(f + ".lang", '"' + c.lang + '" is outside ' + LANGS.join("|") + " (no highlighting)");
      });
    }

    /* ---- viz (§3) -------------------------------------------------------- */
    if (need("viz", L.viz, isObj, "object")) {
      var v = L.viz;
      if (KINDS.indexOf(v.kind) === -1) err("viz.kind", '"' + v.kind + '" is not one of ' + KINDS.join("|"));
      if (v.layout != null) {
        if (need("viz.layout", v.layout, isObj, "object")) {
          if (v.layout.aspect != null && !isNum(v.layout.aspect))
            err("viz.layout.aspect", "expected number, got " + type(v.layout.aspect));
          if (v.layout.aspect != null && isNum(v.layout.aspect) && (v.layout.aspect < 0.4 || v.layout.aspect > 5))
            warn("viz.layout.aspect", "unusual aspect " + v.layout.aspect + " (width/height)");
          if (v.layout.maxFrames != null && !isInt(v.layout.maxFrames))
            err("viz.layout.maxFrames", "expected int, got " + type(v.layout.maxFrames));
        }
      }
      if (v.params != null && need("viz.params", v.params, isArr, "param[]")) {
        v.params.forEach(function (p, i) {
          var f = "viz.params[" + i + "]";
          if (!isObj(p)) { err(f, "expected object, got " + type(p)); return; }
          need(f + ".key", p.key, isStr, "string");
          if (p.label != null && !isStr(p.label)) err(f + ".label", "expected string, got " + type(p.label));
          if (PARAM_TYPES.indexOf(p.type) === -1) {
            err(f + ".type", '"' + p.type + '" is not one of ' + PARAM_TYPES.join("|")); return;
          }
          if (p.type === "int" || p.type === "float") {
            if (!isNum(p.min) || !isNum(p.max)) err(f, "type " + p.type + " requires numeric min and max");
            else if (p.max <= p.min) err(f, "max must be greater than min");
            if (p.default != null && !isNum(p.default)) err(f + ".default", "expected number, got " + type(p.default));
          } else if (p.type === "enum") {
            if (need(f + ".options", p.options, isArr, "string[]")) {
              if (!p.options.length) err(f + ".options", "must not be empty");
              p.options.forEach(function (o, j) {
                if (!isStr(o)) err(f + ".options[" + j + "]", "expected string, got " + type(o));
              });
              if (p.default != null && p.options.indexOf(p.default) === -1)
                err(f + ".default", '"' + p.default + '" is not in options');
            }
          }
        });
      }
      if (!isFn(v.frames)) err("viz.frames", "expected a generator function, got " + type(v.frames));
      else if (v.frames.constructor && v.frames.constructor.name !== "GeneratorFunction")
        warn("viz.frames", "is not declared `function*` — it must return an iterable of frames");
      if (!isFn(v.draw)) err("viz.draw", "expected a function (frame, surface, env), got " + type(v.draw));
      else if (v.draw.length && v.draw.length < 2) warn("viz.draw", "should accept (frame, surface, env)");
    }

    /* ---- drill (§5) ------------------------------------------------------ */
    if (need("drill", L.drill, isObj, "object")) {
      if (need("drill.cards", L.drill.cards, isArr, "{q,a}[]")) {
        var nc = L.drill.cards.length;
        if (nc < 4 || nc > 10) warn("drill.cards", "has " + nc + " cards (spec says 4-10)");
        if (!nc) err("drill.cards", "must not be empty");
        L.drill.cards.forEach(function (c, i) {
          var f = "drill.cards[" + i + "]";
          if (!isObj(c)) { err(f, "expected object, got " + type(c)); return; }
          need(f + ".q", c.q, isStr, "string");
          need(f + ".a", c.a, isStr, "string");
          if (c.tags != null && !isArr(c.tags)) err(f + ".tags", "expected string[], got " + type(c.tags));
        });
      }
      if (need("drill.sixtySecond", L.drill.sixtySecond, isArr, "string[]")) {
        if (!L.drill.sixtySecond.length) err("drill.sixtySecond", "needs at least one prompt");
        if (L.drill.sixtySecond.length > 3) warn("drill.sixtySecond", "has more than 3 prompts");
        L.drill.sixtySecond.forEach(function (s, i) {
          if (!isStr(s)) err("drill.sixtySecond[" + i + "]", "expected string, got " + type(s));
        });
      }
    }

    /* ---- key agreement --------------------------------------------------- */
    if (isStr(key) && isStr(L.track) && isStr(L.id)) {
      var expect = L.track + "/" + L.id;
      if (key !== expect)
        err("<key>", 'file path implies "' + key + '" but {track,id} says "' + expect + '"');
    }

    return { errors: E, warnings: W };
  }

  /* ---- registry ---------------------------------------------------------- */
  global.__L = {};            // "track/id" -> lesson object
  global.__ORDER = [];        // registration order == build order == curriculum order
  global.__LESSON_ERRORS = [];

  global.__validateLesson = validateLesson;
  App.validateLesson = validateLesson;

  global.__registerLesson = function (key, obj) {
    var res;
    try {
      res = validateLesson(key, obj);
    } catch (e) {
      res = { errors: ["<validator threw> " + (e && e.message)], warnings: [] };
    }
    if (res.errors.length) {
      global.__LESSON_ERRORS.push({ key: key, errors: res.errors });
      if (global.console && console.error) console.error("[lesson] " + key + " rejected:\n  " + res.errors.join("\n  "));
      return false;
    }
    if (global.__L[key]) {
      global.__LESSON_ERRORS.push({ key: key, errors: ["duplicate lesson key"] });
      return false;
    }
    obj.__key = key;
    obj.__order = global.__ORDER.length;
    global.__L[key] = obj;
    global.__ORDER.push(key);
    return true;
  };

  /* ---- read helpers used by the UI --------------------------------------- */
  App.allLessons = function () {
    return global.__ORDER.map(function (k) { return global.__L[k]; });
  };
  App.lessonsIn = function (track) {
    return App.allLessons().filter(function (l) { return l.track === track; });
  };
  App.lesson = function (key) { return global.__L[key] || null; };
  App.keyOf = function (l) { return l.track + "/" + l.id; };
  App.trackMeta = function (id) {
    for (var i = 0; i < App.TRACKS.length; i++) if (App.TRACKS[i].id === id) return App.TRACKS[i];
    return { id: id, label: id, short: id.slice(0, 2).toUpperCase() };
  };
  App.neighbours = function (key) {
    var l = App.lesson(key);
    if (!l) return { prev: null, next: null };
    var sib = App.lessonsIn(l.track);
    var i = sib.indexOf(l);
    return { prev: i > 0 ? sib[i - 1] : null, next: i >= 0 && i < sib.length - 1 ? sib[i + 1] : null };
  };
})(typeof window !== "undefined" ? window : globalThis);
