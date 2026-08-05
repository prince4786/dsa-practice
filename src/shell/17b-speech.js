/* ============================================================================
   17b-speech.js — "Listen" narration for a lesson.

   Uses the browser's built-in speechSynthesis: no audio files, no network, no
   dependency. That is the only TTS option compatible with this app's
   `default-src 'none'` CSP and its offline/file:// guarantee.

   Design notes:
   - Segments are collected from the RENDERED DOM, not the lesson data, so the
     element being spoken can be highlighted and scrolled to, and so narration
     can never drift out of sync with what is on screen.
   - Long text is chunked at sentence boundaries. This is not cosmetic: Chrome
     silently truncates a single utterance after ~15s, so one long paragraph
     would cut off mid-sentence.
   - CS prose reads badly through a screen reader voice ("O(n log n)" becomes
     "oh open paren en log en close paren"), so text is passed through a
     pronunciation pass first.
   ========================================================================== */
(function (global) {
  "use strict";
  var App = global.App || (global.App = {});
  var doc = global.document;

  var synth = global.speechSynthesis || null;
  var Utter = global.SpeechSynthesisUtterance || null;

  var SKEY = "cid.v1.speech";
  var MAX_CHUNK = 180;

  /* ---- persisted settings ------------------------------------------------- */
  function loadCfg() {
    try {
      var raw = global.localStorage.getItem(SKEY);
      var o = raw ? JSON.parse(raw) : null;
      if (o && typeof o.rate === "number") return { rate: o.rate, voice: o.voice || null };
    } catch (e) { /* sandboxed storage — fall through to defaults */ }
    return { rate: 1, voice: null };
  }
  function saveCfg() {
    try { global.localStorage.setItem(SKEY, JSON.stringify(cfg)); } catch (e) {}
  }
  var cfg = loadCfg();

  /* ---- voice selection ---------------------------------------------------- */
  /* Voices load asynchronously in Chrome; voiceschanged may fire after boot. */
  var voices = [];
  function refreshVoices() { try { voices = synth ? synth.getVoices() || [] : []; } catch (e) { voices = []; } }
  if (synth && typeof synth.addEventListener === "function") {
    synth.addEventListener("voiceschanged", refreshVoices);
  }
  refreshVoices();

  /* Prefer a natural en voice; these are the common good defaults per platform. */
  var PREFERRED = ["Samantha", "Google US English", "Daniel", "Karen", "Alex", "Microsoft Aria"];
  function pickVoice() {
    if (!voices.length) refreshVoices();
    if (!voices.length) return null;
    var en = voices.filter(function (v) { return /^en/i.test(v.lang || ""); });
    var pool = en.length ? en : voices;
    if (cfg.voice) {
      for (var i = 0; i < pool.length; i++) if (pool[i].name === cfg.voice) return pool[i];
    }
    for (var p = 0; p < PREFERRED.length; p++) {
      for (var j = 0; j < pool.length; j++) {
        if (pool[j].name.indexOf(PREFERRED[p]) === 0) return pool[j];
      }
    }
    return pool[0] || null;
  }

  /* ---- pronunciation ------------------------------------------------------ */
  var SYMBOLS = [
    [/\bO\(1\)/g, "constant time"],
    [/\bO\(([^)]{1,24})\)/g, "big O of $1"],
    [/\bΘ\(([^)]{1,24})\)/g, "theta of $1"],
    [/\bΩ\(([^)]{1,24})\)/g, "omega of $1"],
    [/([a-zA-Z0-9])\^2\b/g, "$1 squared"],
    [/([a-zA-Z0-9])\^3\b/g, "$1 cubed"],
    [/([a-zA-Z0-9])\^([a-zA-Z0-9]+)/g, "$1 to the $2"],
    [/2ⁿ/g, "2 to the n"], [/n²/g, "n squared"], [/n³/g, "n cubed"],
    [/√/g, "square root of "], [/Σ/g, "the sum of "], [/∑/g, "the sum of "],
    [/≈/g, " approximately "], [/≥/g, " at least "], [/≤/g, " at most "],
    [/≠/g, " not equal to "], [/×/g, " times "], [/÷/g, " divided by "],
    [/→/g, " to "], [/←/g, " from "], [/↔/g, " both ways to "],
    /* No \b here: Greek letters are not \w, so a word boundary never matches
       before them and the substitution would silently do nothing. */
    [/α/g, "alpha"], [/β/g, "beta"], [/γ/g, "gamma"], [/δ/g, "delta"],
    [/ε/g, "epsilon"], [/θ/g, "theta"], [/λ/g, "lambda"], [/μ/g, "mu"],
    [/π/g, "pi"], [/σ/g, "sigma"], [/φ/g, "phi"], [/ω/g, "omega"],
    [/\bi\.e\./gi, "that is"], [/\be\.g\./gi, "for example"],
    [/\bvs\.?\b/gi, "versus"], [/\betc\.\b/gi, "et cetera"],
    [/\bO\b(?=\s*\()/g, "big O"]
  ];

  function speechText(raw) {
    var s = String(raw || "");
    s = s.replace(/`([^`]*)`/g, "$1");         // code spans read as plain words
    s = s.replace(/\*\*([^*]*)\*\*/g, "$1");   // bold markers are silent
    for (var i = 0; i < SYMBOLS.length; i++) s = s.replace(SYMBOLS[i][0], SYMBOLS[i][1]);
    s = s.replace(/\s+/g, " ").trim();
    return s;
  }

  /* Split into utterance-sized chunks at sentence boundaries where possible. */
  function chunk(text) {
    if (text.length <= MAX_CHUNK) return [text];
    var parts = text.match(/[^.!?;:]+[.!?;:]*\s*/g) || [text];
    var out = [], cur = "";
    parts.forEach(function (p) {
      if ((cur + p).length > MAX_CHUNK && cur) { out.push(cur.trim()); cur = ""; }
      // A single sentence longer than the cap still has to be broken up.
      while (p.length > MAX_CHUNK) {
        var cut = p.lastIndexOf(" ", MAX_CHUNK);
        if (cut < 40) cut = MAX_CHUNK;
        out.push(p.slice(0, cut).trim());
        p = p.slice(cut);
      }
      cur += p;
    });
    if (cur.trim()) out.push(cur.trim());
    return out.filter(Boolean);
  }

  /* ---- segment collection from the rendered page -------------------------- */
  var SECTION_IDS = ["sec-explainer", "sec-glossary", "sec-complexity", "sec-interview", "sec-followups"];

  function rowText(tr) {
    var cells = tr.cells ? Array.prototype.slice.call(tr.cells) : [];
    if (!cells.length) return "";
    var txt = cells.map(function (c) { return (c.textContent || "").trim(); }).filter(Boolean);
    if (!txt.length) return "";
    // "Search | O(log n) | O(1) | iterative" -> "Search: O(log n), O(1), iterative"
    return txt[0] + (txt.length > 1 ? ": " + txt.slice(1).join(", ") : "");
  }

  function collect() {
    var segs = [];
    SECTION_IDS.forEach(function (id) {
      var sec = doc.getElementById(id);
      if (!sec) return;
      var nodes = sec.querySelectorAll("h2, h3, p, li, .callout, tbody tr, .glossary dt");
      Array.prototype.forEach.call(nodes, function (n) {
        if (n.closest && (n.closest("pre") || n.closest(".copy"))) return;
        var raw;
        if (n.tagName === "TR") raw = rowText(n);
        // A glossary term and its definition are one spoken sentence.
        else if (n.tagName === "DT") raw = (n.textContent || "") + " means: " + ((n.nextElementSibling && n.nextElementSibling.textContent) || "");
        else raw = n.textContent || "";
        var t = speechText(raw);
        if (!t || t.length < 2) return;
        chunk(t).forEach(function (c) { segs.push({ el: n, text: c }); });
      });
    });
    return segs;
  }

  /* ---- playback ----------------------------------------------------------- */
  var segs = [], idx = -1, playing = false, listeners = [];
  var current = null;   // element currently highlighted
  var failures = 0, lastError = null;

  function emit() { listeners.forEach(function (fn) { try { fn(status()); } catch (e) {} }); }
  function status() {
    return {
      playing: playing, idx: idx, total: segs.length,
      rate: cfg.rate, available: available(), error: lastError
    };
  }
  function available() { return !!(synth && Utter); }

  function highlight(el) {
    if (current && current !== el) current.classList.remove("speaking");
    current = el || null;
    if (!current) return;
    current.classList.add("speaking");
    var r = current.getBoundingClientRect();
    if (r.top < 70 || r.bottom > (global.innerHeight || 800) - 60) {
      current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function speakAt(i) {
    if (!available() || i < 0 || i >= segs.length) return stop();
    idx = i;
    var seg = segs[i];
    var u = new Utter(seg.text);
    u.rate = cfg.rate;
    var v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; }
    u.onend = function () { failures = 0; if (playing) speakAt(idx + 1); };
    u.onerror = function (e) {
      var err = (e && e.error) || "speech-failed";
      // "interrupted"/"canceled" are the normal result of our own cancel().
      if (err === "interrupted" || err === "canceled") return;
      failures++;
      /* A missing voice fails every utterance. Without this guard the handler
         would recurse through the whole lesson in milliseconds and look like
         narration "finishing" instantly. Surface it instead. */
      if (failures >= 2 || err === "synthesis-unavailable" ||
          err === "synthesis-failed" || err === "not-allowed" || err === "audio-busy") {
        lastError = err;
        stop();
        return;
      }
      if (playing) speakAt(idx + 1);
    };
    highlight(seg.el);
    try { synth.speak(u); } catch (e) { stop(); }
    emit();
  }

  function start() {
    if (!available()) return;
    segs = collect();
    if (!segs.length) return;
    try { synth.cancel(); } catch (e) {}
    failures = 0; lastError = null;
    playing = true;
    speakAt(0);
  }

  function pause() {
    if (!available() || !playing) return;
    playing = false;
    // Chrome's pause() is unreliable across platforms; cancel + resume-from-idx
    // is deterministic and keeps our position.
    try { synth.cancel(); } catch (e) {}
    emit();
  }

  function resume() {
    if (!available()) return;
    if (!segs.length) return start();
    playing = true;
    speakAt(idx < 0 ? 0 : idx);
  }

  function toggle() { if (playing) pause(); else resume(); }

  function stop() {
    playing = false; idx = -1;
    try { if (synth) synth.cancel(); } catch (e) {}
    highlight(null);
    segs = [];
    emit();
  }

  function step(delta) {
    if (!segs.length) segs = collect();
    var next = Math.max(0, Math.min(segs.length - 1, (idx < 0 ? 0 : idx) + delta));
    playing = true;
    try { synth.cancel(); } catch (e) {}
    speakAt(next);
  }

  function setRate(r) {
    cfg.rate = r; saveCfg();
    if (playing) { try { synth.cancel(); } catch (e) {} speakAt(idx); }
    emit();
  }

  /* Some browsers keep speaking after the page navigates away. */
  if (global.addEventListener) {
    global.addEventListener("beforeunload", function () { try { if (synth) synth.cancel(); } catch (e) {} });
  }

  App.Speech = {
    available: available,
    start: start, pause: pause, resume: resume, toggle: toggle, stop: stop,
    step: step, setRate: setRate, status: status,
    onChange: function (fn) { listeners.push(fn); return function () { listeners = listeners.filter(function (f) { return f !== fn; }); }; },
    // exposed for tests
    _speechText: speechText, _chunk: chunk
  };
})(typeof window !== "undefined" ? window : globalThis);
