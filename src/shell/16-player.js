/* ============================================================================
   16-player.js — the frame engine (§3).
   The author writes a pure generator of immutable state snapshots and a pure
   renderer of ONE frame. The shell owns everything else: materialisation,
   cloning + freezing, transport, scrubbing, sizing, DPR, theme, and errors.
   A lesson that throws must never white-screen the app.
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var SVG_NS = "http://www.w3.org/2000/svg";
  var BASE_MS = 520;               // frame duration at speed x1
  var SPEEDS = [0.25, 0.5, 1, 1.5, 2, 3, 4];
  var DEFAULT_MAX_FRAMES = 2000;

  /* ---- deterministic RNG (mulberry32) ------------------------------------ */
  function mulberry32(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  App.mulberry32 = mulberry32;

  function deepFreeze(o) {
    if (o && typeof o === "object" && !Object.isFrozen(o)) {
      Object.freeze(o);
      var ks = Object.keys(o);
      for (var i = 0; i < ks.length; i++) deepFreeze(o[ks[i]]);
    }
    return o;
  }

  function clone(v) {
    if (typeof global.structuredClone === "function") return global.structuredClone(v);
    return JSON.parse(JSON.stringify(v));   // fallback: same "no functions" contract
  }

  /* ---- frame materialisation --------------------------------------------- */
  /** @returns {{frames: Array, truncated: boolean}} — throws on author error. */
  function materialize(viz, params, rng) {
    var max = (viz.layout && viz.layout.maxFrames) || DEFAULT_MAX_FRAMES;
    if (!(max > 0)) max = DEFAULT_MAX_FRAMES;
    var out = [], truncated = false;
    var it = viz.frames(params, rng);
    if (!it || typeof it.next !== "function") throw new Error("viz.frames did not return an iterator (declare it `function*`)");
    for (;;) {
      var r = it.next();
      if (r.done) break;
      if (out.length >= max) {
        truncated = true;
        out.push(deepFreeze({
          label: "⚠ Truncated at " + max + " frames (viz.layout.maxFrames). The generator had more to yield.",
          phase: "truncated", state: {}, __truncated: true
        }));
        if (typeof it.return === "function") { try { it.return(); } catch (e) {} }
        break;
      }
      var f = r.value;
      if (!f || typeof f !== "object") throw new Error("frame " + out.length + " is " + (f === null ? "null" : typeof f) + ", expected an object { label, state }");
      var copy;
      try {
        copy = clone(f);
      } catch (e) {
        throw new Error("frame " + out.length + ' ("' + String(f.label).slice(0, 60) +
          '") is not cloneable — `state` must be plain JSON data (no functions, DOM nodes, Maps or class instances). ' + e.message);
      }
      if (typeof copy.label !== "string" || !copy.label) copy.label = "Frame " + (out.length + 1);
      if (copy.state === undefined) copy.state = {};
      out.push(deepFreeze(copy));
    }
    if (!out.length) throw new Error("viz.frames yielded nothing — a visualizer needs at least one frame");
    return { frames: out, truncated: truncated };
  }
  App.materializeFrames = materialize;

  /* ---- small DOM helper (local; 15-ui.js has the general one) ------------- */
  function el(tag, cls, txt) {
    var e = global.document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }
  function svgEl(tag, attrs, children) {
    var e = global.document.createElementNS(SVG_NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        e.setAttribute(k, String(v));
      });
    }
    if (children != null) {
      var list = Array.isArray(children) ? children : [children];
      list.forEach(function (c) {
        if (c == null || c === false) return;
        e.appendChild(typeof c === "object" && c.nodeType ? c : global.document.createTextNode(String(c)));
      });
    }
    return e;
  }
  App.svgEl = svgEl;

  /* ---- environment handed to draw() -------------------------------------- */
  function makeEnv(kind, surface, w, h) {
    var colors = App.Theme.colors();
    var font = App.Theme.fonts();
    var theme = App.Theme.current();

    function fontStr(o) {
      o = o || {};
      var size = o.size || 12;
      var fam = o.mono ? font.mono : font.base;
      return (o.weight ? o.weight + " " : "") + size + "px " + fam;
    }

    var env = {
      kind: kind, width: w, height: h, theme: theme, colors: colors, font: font,
      h: svgEl,

      text: function (x, y, str, o) {
        o = o || {};
        if (kind === "canvas") {
          surface.save();
          surface.fillStyle = o.color || colors.text;
          surface.font = fontStr(o);
          surface.textAlign = o.align || "left";
          surface.textBaseline = o.baseline || "alphabetic";
          if (o.alpha != null) surface.globalAlpha = o.alpha;
          surface.fillText(String(str), x, y, o.maxWidth);
          surface.restore();
          return null;
        }
        var t = svgEl("text", {
          x: x, y: y, fill: o.color || colors.text,
          "font-family": o.mono ? font.mono : font.base,
          "font-size": (o.size || 12) + "px",
          "font-weight": o.weight || null,
          "text-anchor": o.align === "center" ? "middle" : o.align === "right" ? "end" : "start",
          "dominant-baseline": o.baseline === "middle" ? "central" : o.baseline === "top" ? "hanging" : null,
          opacity: o.alpha == null ? null : o.alpha
        }, String(str));
        surface.appendChild(t);
        return t;
      },

      /** Small pill label. badge(x, y, text, { color, bg, size, align }) -> {w,h} */
      badge: function (x, y, str, o) {
        o = o || {};
        var size = o.size || 11;
        var padX = o.padX == null ? 6 : o.padX;
        var padY = o.padY == null ? 3 : o.padY;
        var bg = o.bg || colors.surface2;
        var fg = o.color || colors.text2;
        str = String(str);
        var tw;
        if (kind === "canvas") {
          surface.save();
          surface.font = fontStr({ size: size, mono: o.mono !== false, weight: o.weight });
          tw = surface.measureText(str).width;
          var w = tw + padX * 2, hh = size + padY * 2;
          var bx = o.align === "center" ? x - w / 2 : o.align === "right" ? x - w : x;
          surface.fillStyle = bg;
          surface.beginPath();
          if (surface.roundRect) surface.roundRect(bx, y, w, hh, 999);
          else surface.rect(bx, y, w, hh);
          surface.fill();
          surface.fillStyle = fg;
          surface.textAlign = "left";
          surface.textBaseline = "middle";
          surface.fillText(str, bx + padX, y + hh / 2 + 0.5);
          surface.restore();
          return { w: w, h: hh };
        }
        tw = str.length * size * 0.6;
        var w2 = tw + padX * 2, h2 = size + padY * 2;
        var bx2 = o.align === "center" ? x - w2 / 2 : o.align === "right" ? x - w2 : x;
        surface.appendChild(svgEl("rect", { x: bx2, y: y, width: w2, height: h2, rx: h2 / 2, fill: bg }));
        surface.appendChild(svgEl("text", {
          x: bx2 + padX, y: y + h2 / 2, fill: fg, "font-family": font.mono,
          "font-size": size + "px", "dominant-baseline": "central"
        }, str));
        return { w: w2, h: h2 };
      }
    };
    return env;
  }

  /* ======================================================================== */
  /*  mount                                                                   */
  /* ======================================================================== */
  /**
   * @param {HTMLElement} host  container the player takes over
   * @param {object} lesson     registered lesson
   * @param {object} [opts]     { full: boolean, compact: boolean }
   * @returns {{destroy: Function, root: HTMLElement}}
   */
  App.Player = {
    SPEEDS: SPEEDS,
    mount: function (host, lesson, opts) {
      opts = opts || {};
      var doc = global.document;
      var viz = lesson.viz || {};
      var kind = viz.kind === "svg" || viz.kind === "diagram" ? "svg" : "canvas";
      var lessonKey = App.keyOf(lesson);
      var aspect = (viz.layout && viz.layout.aspect) || 1.6;
      if (!(aspect > 0.2)) aspect = 1.6;

      var params = {}, seedKey = null;
      (viz.params || []).forEach(function (p) {
        if (p.type === "seed") { seedKey = p.key; params[p.key] = (p.default >>> 0) || 0x1F2E3D4C; }
        else if (p.type === "enum") params[p.key] = p.default != null ? p.default : (p.options || [])[0];
        else if (p.type === "bool") params[p.key] = !!p.default;
        else params[p.key] = p.default != null ? p.default : p.min;
      });

      var frames = [], idx = 0, playing = false, speed = 1, timer = null;
      var buildErr = null, drawErrCount = 0;
      var destroyed = false;

      /* ---- DOM ------------------------------------------------------------ */
      var root = el("div", "viz" + (opts.full ? " viz-full" : ""));
      var head = el("div", "viz-head");
      var title = el("span", "title", opts.full ? lesson.title : "Visualizer");
      var phaseBadge = el("span", "viz-phase"); phaseBadge.hidden = true;
      var headGrow = el("div", "grow");
      var openBtn = el("a", "btn sm ghost", opts.full ? "Back to lesson" : "Focus");
      openBtn.href = opts.full ? "#/t/" + lessonKey : "#/t/" + lessonKey + "/viz";
      openBtn.title = opts.full ? "Return to the full lesson" : "Open the visualizer full-width";
      head.append(title, phaseBadge, headGrow, openBtn);

      var surfaceWrap = el("div", "viz-surface");
      var errBox = el("div", "error-card"); errBox.hidden = true;
      errBox.style.margin = "12px";

      var caption = el("div", "viz-caption");
      var capN = el("span", "n", "1/1");
      var capText = el("span", "grow");
      var capFocus = el("span", "focus");
      caption.append(capN, capText, capFocus);

      /* transport */
      var bar = el("div", "transport");
      function tbtn(label, title_, fn, cls) {
        var b = el("button", "btn icon" + (cls ? " " + cls : ""), label);
        b.type = "button"; b.title = title_; b.setAttribute("aria-label", title_);
        b.addEventListener("click", fn);
        return b;
      }
      var playBtn = tbtn("▶", "Play / pause (Space)", function () { toggle(); }, "primary");
      var g1 = el("div", "group");
      g1.append(
        tbtn("⏮", "First frame (Home)", function () { pause(); setIdx(0); }),
        tbtn("«", "Back 10 (Shift+Left)", function () { pause(); setIdx(idx - 10); }),
        tbtn("‹", "Back 1 (Left)", function () { pause(); setIdx(idx - 1); }),
        playBtn,
        tbtn("›", "Forward 1 (Right)", function () { pause(); setIdx(idx + 1); }),
        tbtn("»", "Forward 10 (Shift+Right)", function () { pause(); setIdx(idx + 10); }),
        tbtn("⏭", "Last frame (End)", function () { pause(); setIdx(frames.length - 1); })
      );

      var scrubWrap = el("div", "grow");
      var scrub = doc.createElement("input");
      scrub.type = "range"; scrub.min = "0"; scrub.max = "0"; scrub.step = "1"; scrub.value = "0";
      scrub.setAttribute("aria-label", "Scrub frames");
      scrub.addEventListener("input", function () { pause(); setIdx(parseInt(scrub.value, 10) || 0); });
      var counter = el("span", "count", "0 / 0");
      scrubWrap.append(scrub, counter);

      var g2 = el("div", "group");
      var speedSel = doc.createElement("select");
      speedSel.setAttribute("aria-label", "Playback speed");
      SPEEDS.forEach(function (s) {
        var o = doc.createElement("option");
        o.value = String(s); o.textContent = "×" + s;
        if (s === 1) o.selected = true;
        speedSel.appendChild(o);
      });
      speedSel.addEventListener("change", function () { speed = parseFloat(speedSel.value) || 1; });
      var resetBtn = el("button", "btn sm", "Reset");
      resetBtn.type = "button";
      resetBtn.title = seedKey ? "Reset and re-seed (r)" : "Reset to the first frame (r)";
      resetBtn.addEventListener("click", function () { reset(true); });
      g2.append(speedSel, resetBtn);
      if (seedKey) {
        var dice = el("button", "btn sm", "Seed");
        dice.type = "button";
        dice.title = "Re-roll the random seed";
        dice.setAttribute("aria-label", "New random seed");
        dice.addEventListener("click", function () {
          params[seedKey] = (Math.random() * 4294967295) >>> 0;
          rebuild(true);
        });
        g2.appendChild(dice);
      }
      bar.append(g1, scrubWrap, g2);

      /* param row */
      var paramRow = null;
      if ((viz.params || []).filter(function (p) { return p.type !== "seed"; }).length) {
        paramRow = el("div", "params");
        (viz.params || []).forEach(function (p) {
          if (p.type === "seed") return;
          var wrap = el("div", "param");
          var id = "p-" + lessonKey.replace(/\W/g, "-") + "-" + p.key;
          var lab = el("label", null, p.label || p.key);
          lab.htmlFor = id;
          wrap.appendChild(lab);
          if (p.type === "enum") {
            var sel = doc.createElement("select");
            sel.id = id;
            (p.options || []).forEach(function (o) {
              var op = doc.createElement("option");
              op.value = o; op.textContent = o;
              if (o === params[p.key]) op.selected = true;
              sel.appendChild(op);
            });
            sel.addEventListener("change", function () { params[p.key] = sel.value; rebuild(true); });
            wrap.appendChild(sel);
          } else if (p.type === "bool") {
            var cb = doc.createElement("input");
            cb.type = "checkbox"; cb.id = id; cb.checked = !!params[p.key];
            cb.addEventListener("change", function () { params[p.key] = cb.checked; rebuild(true); });
            wrap.appendChild(cb);
          } else {
            var r = doc.createElement("input");
            r.type = "range"; r.id = id;
            r.min = String(p.min); r.max = String(p.max);
            r.step = String(p.step || (p.type === "float" ? (p.max - p.min) / 100 : 1));
            r.value = String(params[p.key]);
            var val = el("span", "val", String(params[p.key]));
            r.addEventListener("input", function () {
              params[p.key] = p.type === "float" ? parseFloat(r.value) : parseInt(r.value, 10);
              val.textContent = String(params[p.key]);
              debounceRebuild();
            });
            wrap.append(r, val);
          }
          paramRow.appendChild(wrap);
        });
      }

      root.append(head, surfaceWrap, errBox, caption, bar);
      if (paramRow) root.appendChild(paramRow);
      host.appendChild(root);

      /* ---- surface -------------------------------------------------------- */
      var canvas = null, ctx = null, svg = null;
      if (kind === "canvas") {
        canvas = doc.createElement("canvas");
        canvas.setAttribute("role", "img");
        surfaceWrap.appendChild(canvas);
        try { ctx = canvas.getContext("2d"); } catch (e) { ctx = null; }
      } else {
        svg = doc.createElementNS(SVG_NS, "svg");
        svg.setAttribute("role", "img");
        svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
        surfaceWrap.appendChild(svg);
      }

      var cssW = 0, cssH = 0;
      function measure() {
        var w = Math.max(220, Math.round(surfaceWrap.clientWidth || root.clientWidth || 640));
        var maxH = opts.full ? Math.max(320, (global.innerHeight || 800) - 330) : 560;
        var h = Math.round(Math.min(Math.max(w / aspect, 180), maxH));
        cssW = w; cssH = h;
        surfaceWrap.style.height = h + "px";
        if (canvas) {
          var dpr = global.devicePixelRatio || 1;
          var pw = Math.round(w * dpr), ph = Math.round(h * dpr);
          if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
          canvas.style.width = w + "px";
          canvas.style.height = h + "px";
          if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);   // authors draw in CSS pixels
        } else if (svg) {
          svg.setAttribute("viewBox", "0 0 " + w + " " + h);
          svg.setAttribute("width", w);
          svg.setAttribute("height", h);
        }
      }

      /* ---- error surface -------------------------------------------------- */
      function showError(where, e) {
        var msg = (e && e.message) || String(e);
        errBox.textContent = "";
        var hd = el("h3", null, "This visualizer failed (" + where + ")");
        var p = el("p", null, lesson.title + "  —  " + lessonKey);
        var pre = el("pre", null, msg + (e && e.stack ? "\n\n" + String(e.stack).split("\n").slice(0, 4).join("\n") : ""));
        errBox.append(hd, p, pre);
        errBox.hidden = false;
        surfaceWrap.style.display = "none";
        if (global.console) console.error("[viz] " + lessonKey + " " + where + ":", e);
      }
      function clearError() {
        if (!errBox.hidden) { errBox.hidden = true; surfaceWrap.style.display = ""; measure(); }
      }

      /* ---- draw ----------------------------------------------------------- */
      function draw() {
        if (destroyed || buildErr || !frames.length) return;
        var f = frames[idx];
        if (!f) return;
        try {
          if (kind === "canvas") {
            if (!ctx) throw new Error("2D canvas context unavailable");
            ctx.save();
            ctx.clearRect(0, 0, cssW, cssH);
            ctx.lineJoin = "round";
            var env = makeEnv("canvas", ctx, cssW, cssH);
            viz.draw(f, ctx, env);
            ctx.restore();
          } else {
            while (svg.firstChild) svg.removeChild(svg.firstChild);
            var env2 = makeEnv("svg", svg, cssW, cssH);
            viz.draw(f, svg, env2);
          }
          drawErrCount = 0;
          clearError();
        } catch (e) {
          drawErrCount++;
          if (kind === "canvas" && ctx) { try { ctx.restore(); } catch (e2) {} }
          pause();
          showError("draw of frame " + (idx + 1), e);
        }
      }

      /* ---- transport ------------------------------------------------------ */
      function setIdx(i, silent) {
        if (!frames.length) return;
        i = Math.max(0, Math.min(frames.length - 1, i | 0));
        idx = i;
        scrub.value = String(i);
        counter.textContent = (i + 1) + " / " + frames.length;
        capN.textContent = (i + 1) + "/" + frames.length;
        var f = frames[i];
        capText.textContent = f.label || "";
        if (f.phase) { phaseBadge.hidden = false; phaseBadge.textContent = f.phase; }
        else phaseBadge.hidden = true;
        capFocus.textContent = Array.isArray(f.focus) && f.focus.length ? "focus " + JSON.stringify(f.focus) : "";
        if (!silent) draw();
        if (i === frames.length - 1) {
          try {
            if (!App.Store.lessonState(lessonKey).vizCompleted)
              App.Store.setLessonState(lessonKey, { vizCompleted: true });
          } catch (e) {}
        }
      }
      function play() {
        if (buildErr || playing || frames.length < 2) return;
        if (idx >= frames.length - 1) setIdx(0);
        playing = true;
        playBtn.textContent = "⏸";
        playBtn.title = "Pause (Space)";
        step();
      }
      function step() {
        if (!playing) return;
        timer = global.setTimeout(function () {
          if (!playing) return;
          if (idx >= frames.length - 1) { pause(); return; }
          setIdx(idx + 1);
          step();
        }, Math.max(24, BASE_MS / speed));
      }
      function pause() {
        playing = false;
        if (timer) { global.clearTimeout(timer); timer = null; }
        playBtn.textContent = "▶";
        playBtn.title = "Play (Space)";
      }
      function toggle() { playing ? pause() : play(); }
      function bumpSpeed(dir) {
        var i = SPEEDS.indexOf(speed);
        if (i < 0) i = 2;
        i = Math.max(0, Math.min(SPEEDS.length - 1, i + dir));
        speed = SPEEDS[i];
        speedSel.value = String(speed);
      }

      /* ---- build ---------------------------------------------------------- */
      var rebuildTimer = null;
      function debounceRebuild() {
        if (rebuildTimer) global.clearTimeout(rebuildTimer);
        rebuildTimer = global.setTimeout(function () { rebuildTimer = null; rebuild(true); }, 70);
      }
      function rebuild(resetIdx) {
        pause();
        buildErr = null;
        var seed = seedKey ? (params[seedKey] >>> 0) : 0x2F6E2B1;
        var rng = mulberry32(seed);
        var copy = {};
        Object.keys(params).forEach(function (k) { copy[k] = params[k]; });
        try {
          if (typeof viz.frames !== "function") throw new Error("viz.frames is not a function");
          if (typeof viz.draw !== "function") throw new Error("viz.draw is not a function");
          var res = materialize(viz, copy, rng);
          frames = res.frames;
        } catch (e) {
          buildErr = e;
          frames = [];
          scrub.max = "0";
          counter.textContent = "0 / 0";
          capText.textContent = "";
          showError("frame generation", e);
          return;
        }
        scrub.max = String(frames.length - 1);
        scrub.disabled = frames.length < 2;
        clearError();
        measure();
        setIdx(resetIdx ? 0 : Math.min(idx, frames.length - 1));
      }
      function reset(reseed) {
        if (reseed && seedKey) params[seedKey] = (Math.random() * 4294967295) >>> 0;
        rebuild(true);
      }

      /* ---- observers ------------------------------------------------------ */
      var ro = null;
      if (global.ResizeObserver) {
        var lastW = -1;
        ro = new global.ResizeObserver(function () {
          if (destroyed) return;
          var w = surfaceWrap.clientWidth;
          if (w === lastW) return;
          lastW = w;
          measure();
          draw();
        });
        try { ro.observe(surfaceWrap); } catch (e) { ro = null; }
      } else {
        global.addEventListener("resize", onWinResize);
      }
      function onWinResize() { measure(); draw(); }
      var offTheme = App.Theme.onChange(function () { if (!destroyed) { measure(); draw(); } });

      /* ---- keyboard (§3) --------------------------------------------------- */
      function onKey(e) {
        if (destroyed) return;
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (App.UI && App.UI.overlayOpen && App.UI.overlayOpen()) return;
        var t = e.target;
        var tag = t && t.tagName;
        var typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (t && t.isContentEditable);
        var k = e.key;
        if (typing) {
          // let native slider/select keys through, but keep Space for playback off buttons
          if (!(t === scrub && (k === " " || k === "Spacebar"))) return;
        }
        if (k === " " || k === "Spacebar") {
          if (tag === "BUTTON" || tag === "A") return;      // let the control activate
          e.preventDefault(); toggle(); return;
        }
        switch (k) {
          case "ArrowRight": e.preventDefault(); pause(); setIdx(idx + (e.shiftKey ? 10 : 1)); break;
          case "ArrowLeft":  e.preventDefault(); pause(); setIdx(idx - (e.shiftKey ? 10 : 1)); break;
          case "Home":       e.preventDefault(); pause(); setIdx(0); break;
          case "End":        e.preventDefault(); pause(); setIdx(frames.length - 1); break;
          case "-": case "_": e.preventDefault(); bumpSpeed(-1); break;
          case "=": case "+": e.preventDefault(); bumpSpeed(1); break;
          case "r": case "R": e.preventDefault(); reset(true); break;
        }
      }
      global.document.addEventListener("keydown", onKey);

      /* ---- go -------------------------------------------------------------- */
      measure();
      rebuild(true);
      // one more measure after layout settles (fonts/scrollbars can shift width)
      global.requestAnimationFrame(function () {
        if (destroyed) return;
        var w = surfaceWrap.clientWidth;
        if (Math.abs(w - cssW) > 1) { measure(); draw(); }
      });

      return {
        root: root,
        play: play, pause: pause, setIdx: setIdx,
        frameCount: function () { return frames.length; },
        destroy: function () {
          destroyed = true;
          pause();
          if (rebuildTimer) global.clearTimeout(rebuildTimer);
          if (ro) { try { ro.disconnect(); } catch (e) {} }
          else global.removeEventListener("resize", onWinResize);
          offTheme();
          global.document.removeEventListener("keydown", onKey);
          if (root.parentNode) root.parentNode.removeChild(root);
        }
      };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
