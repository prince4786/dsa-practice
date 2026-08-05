#!/usr/bin/env node
/* ============================================================================
   build.js — the only build step. node:fs + node:path only, no deps.

     node build.js              strict: any schema violation fails the build
     node build.js --lenient    schema violations become warnings; the offending
                                lesson is SKIPPED so a partial repo still ships
     node build.js --no-smoke   skip the generator smoke-run (see below)
     node build.js --quiet      only print the summary

   What it does
     1. concatenate src/shell CSS files (name-sorted)             -> __CSS__
     2. concatenate src/shell JS files  (name-sorted = load order) -> __SHELL__
     3. for each src/topics/<track>/<NN>-<id>.js:
          - the first non-comment token sequence MUST be `export default`
          - everything after that token is preserved byte-for-byte
          - emit __registerLesson("<track>/<id>", (function(){ return {…}; })());
     4. run the SAME validator the runtime uses (src/shell/10-registry.js) and
        fail loudly, naming file + field.
     5. write a fully self-contained dist/index.html (file:// safe, no network).
   ========================================================================== */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const SRC = path.join(ROOT, "src");
const SHELL = path.join(SRC, "shell");
const TOPICS = path.join(SRC, "topics");
const TEMPLATE = path.join(SRC, "index.template.html");
const OUT_DIR = path.join(ROOT, "dist");
const OUT = path.join(OUT_DIR, "index.html");
const ART_OUT = path.join(OUT_DIR, "artifact.html");
const ARTIFACT = process.argv.includes("--artifact");

const argv = process.argv.slice(2);
const LENIENT = argv.includes("--lenient");
const NO_SMOKE = argv.includes("--no-smoke");
const QUIET = argv.includes("--quiet");

const C = process.stdout.isTTY
  ? { r: "\x1b[31m", y: "\x1b[33m", g: "\x1b[32m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" }
  : { r: "", y: "", g: "", d: "", b: "", x: "" };

const errors = [];     // fatal (unless --lenient)
const warnings = [];    // never fatal

function fail(file, msg) { errors.push({ file, msg }); }
function warn(file, msg) { warnings.push({ file, msg }); }
function log(...a) { if (!QUIET) console.log(...a); }

/* -------------------------------------------------------------------------- */
/* 0. load the shared validator out of the runtime source                      */
/* -------------------------------------------------------------------------- */
function loadValidator() {
  const src = fs.readFileSync(path.join(SHELL, "10-registry.js"), "utf8");
  const stub = { console: { error() {}, warn() {} } };
  try {
    // The registry is written to run headless; `window` is its only global.
    new Function("window", src)(stub);
  } catch (e) {
    console.error(`${C.r}FATAL${C.x} src/shell/10-registry.js failed to evaluate: ${e.message}`);
    process.exit(1);
  }
  if (typeof stub.__validateLesson !== "function") {
    console.error(`${C.r}FATAL${C.x} src/shell/10-registry.js did not export window.__validateLesson`);
    process.exit(1);
  }
  return { validate: stub.__validateLesson, TRACKS: (stub.App && stub.App.TRACKS) || [] };
}

/* -------------------------------------------------------------------------- */
/* 1. helpers                                                                  */
/* -------------------------------------------------------------------------- */
function readDirSorted(dir, ext) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(ext) && !f.startsWith("."))
    .sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

/** Index of the first non-comment, non-whitespace character. */
function firstTokenIndex(src) {
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r" || c === "﻿") { i++; continue; }
    if (c === "/" && src[i + 1] === "/") { const n = src.indexOf("\n", i); if (n < 0) return src.length; i = n + 1; continue; }
    if (c === "/" && src[i + 1] === "*") { const n = src.indexOf("*/", i); if (n < 0) return src.length; i = n + 2; continue; }
    return i;
  }
  return src.length;
}

/** Make a JS payload safe to sit inside an inline <script> in an HTML file. */
function scriptSafe(js) {
  return js.split("</script").join("<\\/script");
}

/* -------------------------------------------------------------------------- */
/* 2. shell                                                                    */
/* -------------------------------------------------------------------------- */
function bundleShell() {
  const cssFiles = readDirSorted(SHELL, ".css");
  const jsFiles = readDirSorted(SHELL, ".js");
  if (!cssFiles.length) fail("src/shell", "no .css files found");
  if (!jsFiles.length) fail("src/shell", "no .js files found");

  const css = cssFiles
    .map((f) => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(SHELL, f), "utf8"))
    .join("\n");
  const js = jsFiles
    .map((f) => `/* ===== ${f} ===== */\n` + fs.readFileSync(path.join(SHELL, f), "utf8"))
    .join("\n");

  return { css, js, cssFiles, jsFiles };
}

/* -------------------------------------------------------------------------- */
/* 3. lessons                                                                  */
/* -------------------------------------------------------------------------- */
function collectTrackDirs(TRACKS) {
  if (!fs.existsSync(TOPICS)) return [];
  const onDisk = fs.readdirSync(TOPICS).filter((d) => {
    try { return fs.statSync(path.join(TOPICS, d)).isDirectory() && !d.startsWith("."); }
    catch { return false; }
  });
  const known = TRACKS.map((t) => t.id).filter((id) => onDisk.includes(id));
  const extra = onDisk.filter((d) => !known.includes(d)).sort();
  extra.forEach((d) => warn(`src/topics/${d}`, "directory is not one of the seven declared tracks — lessons in it will still be embedded"));
  return known.concat(extra);
}

function buildLessons(validate, TRACKS) {
  const chunks = [];
  const perTrack = {};
  const accepted = [];
  const skipped = [];

  for (const track of collectTrackDirs(TRACKS)) {
    perTrack[track] = 0;
    const dir = path.join(TOPICS, track);
    for (const file of readDirSorted(dir, ".js")) {
      const rel = `src/topics/${track}/${file}`;
      const m = /^(\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.js$/.exec(file);
      if (!m) {
        fail(rel, 'filename must be "NN-<lesson-id>.js" (two digits, hyphen, kebab-case id)');
        skipped.push(rel);
        continue;
      }
      const id = m[2];
      const key = `${track}/${id}`;
      const src = fs.readFileSync(path.join(dir, file), "utf8");

      /* --- mechanical transform (no parser, exactly as specified) --------- */
      const idx = firstTokenIndex(src);
      const head = src.slice(idx, idx + 14);
      if (head !== "export default") {
        fail(rel, `first non-comment token must be "export default", found ${JSON.stringify(src.slice(idx, idx + 24).trim() || "<empty file>")}`);
        skipped.push(rel);
        continue;
      }
      if (/^[ \t]*import[\s{*]/m.test(src)) {
        fail(rel, "contains an import statement — lesson files must have zero imports");
        skipped.push(rel);
        continue;
      }
      const prefix = src.slice(0, idx);                      // leading comments only
      const body = src.slice(idx + 14).replace(/^\s+/, " "); // preserved byte-for-byte
      const moduleBody = `${prefix}return ${body}`;

      /* --- evaluate + validate with the runtime validator ------------------ */
      let obj;
      try {
        obj = new Function(moduleBody)();
      } catch (e) {
        fail(rel, `failed to evaluate: ${e.message}`);
        skipped.push(rel);
        continue;
      }

      let res;
      try {
        res = validate(key, obj);
      } catch (e) {
        res = { errors: [`<validator threw> ${e.message}`], warnings: [] };
      }
      res.warnings.forEach((w) => warn(rel, w));

      if (obj && obj.id !== undefined && obj.id !== id) {
        res.errors.push(`id: "${obj.id}" must equal the filename minus the "NN-" prefix ("${id}")`);
      }
      if (obj && obj.track !== undefined && obj.track !== track) {
        res.errors.push(`track: "${obj.track}" must equal the containing directory ("${track}")`);
      }

      if (res.errors.length) {
        res.errors.forEach((e) => (LENIENT ? warn(rel, `[skipped] ${e}`) : fail(rel, e)));
        skipped.push(rel);
        continue;
      }

      /* --- generator smoke-run (diagnostic only, never fatal) -------------- */
      let frameCount = null;
      if (!NO_SMOKE) {
        try { frameCount = smokeRun(obj); }
        catch (e) { warn(rel, `viz.frames threw on a smoke run with default params: ${e.message}`); }
      }

      chunks.push(
        `/* ---- ${rel} ---- */\n__registerLesson(${JSON.stringify(key)}, (function(){ ${moduleBody} })());`
      );
      perTrack[track]++;
      accepted.push({ key, rel, frames: frameCount, title: obj.title });
    }
  }
  return { code: chunks.join("\n\n"), perTrack, accepted, skipped };
}

/** Run the generator with default params so authors learn about crashes at build time. */
function smokeRun(lesson) {
  const viz = lesson.viz || {};
  if (typeof viz.frames !== "function") return null;
  const params = {};
  (viz.params || []).forEach((p) => {
    if (p.type === "seed") params[p.key] = (p.default >>> 0) || 0x1f2e3d4c;
    else if (p.type === "enum") params[p.key] = p.default != null ? p.default : (p.options || [])[0];
    else if (p.type === "bool") params[p.key] = !!p.default;
    else params[p.key] = p.default != null ? p.default : p.min;
  });
  // same mulberry32 the player injects
  let a = (params.seed >>> 0) || 0x2f6e2b1;
  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const max = (viz.layout && viz.layout.maxFrames) || 2000;
  const it = viz.frames(params, rng);
  if (!it || typeof it.next !== "function") throw new Error("frames() did not return an iterator (declare it `function*`)");
  let n = 0;
  for (;;) {
    const r = it.next();
    if (r.done) break;
    if (!r.value || typeof r.value !== "object") throw new Error(`frame ${n} is not an object`);
    if (typeof r.value.label !== "string" || !r.value.label) throw new Error(`frame ${n} has no string label`);
    try { structuredClone(r.value); }
    catch (e) { throw new Error(`frame ${n} is not structuredClone-able (state must be plain JSON data): ${e.message}`); }
    n++;
    if (n >= max) break;
  }
  if (!n) throw new Error("generator yielded zero frames");
  return n;
}

/* -------------------------------------------------------------------------- */
/* 4. emit                                                                     */
/* -------------------------------------------------------------------------- */
function main() {
  const t0 = Date.now();
  const { validate, TRACKS } = loadValidator();
  const shell = bundleShell();
  const lessons = buildLessons(validate, TRACKS);

  if (!fs.existsSync(TEMPLATE)) {
    console.error(`${C.r}FATAL${C.x} missing ${path.relative(ROOT, TEMPLATE)}`);
    process.exit(1);
  }
  let html = fs.readFileSync(TEMPLATE, "utf8");
  ["/*__CSS__*/", "/*__SHELL__*/", "/*__LESSONS__*/"].forEach((ph) => {
    if (!html.includes(ph)) fail("src/index.template.html", `missing placeholder ${ph}`);
  });

  /* ---- report ---- */
  if (warnings.length && !QUIET) {
    console.log(`${C.y}${warnings.length} warning(s)${C.x}`);
    for (const w of warnings) console.log(`  ${C.y}warn${C.x} ${C.d}${w.file}${C.x} — ${w.msg}`);
  }
  if (errors.length) {
    console.error(`\n${C.r}${C.b}BUILD FAILED — ${errors.length} error(s)${C.x}`);
    for (const e of errors) console.error(`  ${C.r}error${C.x} ${C.b}${e.file}${C.x} — ${e.msg}`);
    console.error(`\n  Re-run with ${C.b}--lenient${C.x} to skip the offending lesson(s) and still produce a dist.`);
    process.exit(1);
  }

  // split/join, never String.replace: lesson code is full of $ patterns.
  html = html.split("/*__CSS__*/").join(shell.css);
  html = html.split("/*__SHELL__*/").join(scriptSafe(shell.js));
  html = html.split("/*__LESSONS__*/").join(scriptSafe(lessons.code || "/* no lessons built */"));

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT, html, "utf8");

  /* ---- optional --artifact target -----------------------------------------
     Hosts like Claude Artifacts wrap the uploaded file in their own
     <!doctype>/<head>/<body> skeleton, so a full document would nest. Emit
     content-only: styles, markup, scripts. The app themes off
     :root[data-theme], which is the same attribute such viewers toggle, so
     the host's light/dark control drives our tokens for free. */
  if (ARTIFACT) {
    const artifact =
      "<style>\n" + shell.css + "\n</style>\n" +
      '<a class="skip-link" href="#main">Skip to content</a>\n' +
      '<div id="app" aria-busy="true"></div>\n' +
      "<script>\n" +
      "(function () {\n" +
      "  try {\n" +
      '    var raw = localStorage.getItem("cid.v1.meta");\n' +
      "    var t = raw ? (JSON.parse(raw) || {}).theme : null;\n" +
      '    if (t === "auto" || !t) {\n' +
      '      t = (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark";\n' +
      "    }\n" +
      '    document.documentElement.setAttribute("data-theme", t === "light" ? "light" : "dark");\n' +
      "  } catch (e) { /* sandboxed storage can throw — dark is the default */ }\n" +
      "})();\n" +
      "<\/script>\n" +
      "<script>\n" +
      scriptSafe(shell.js) + "\n" +
      scriptSafe(lessons.code || "/* no lessons built */") + "\n" +
      "if (window.__boot) window.__boot();\n" +
      "<\/script>\n";
    fs.writeFileSync(ART_OUT, artifact, "utf8");
    console.log(`\n${C.b}dist/artifact.html${C.x}  ${C.g}built${C.x}  ` +
      `${C.d}${(Buffer.byteLength(artifact, "utf8") / 1024).toFixed(1)} KB (content-only)${C.x}`);
  }

  /* ---- summary ---- */
  const bytes = Buffer.byteLength(html, "utf8");
  const framesCapable = lessons.accepted.filter((l) => l.frames === null || l.frames > 0).length;
  const totalFrames = lessons.accepted.reduce((s, l) => s + (l.frames || 0), 0);

  const order = TRACKS.map((t) => t.id).concat(
    Object.keys(lessons.perTrack).filter((k) => !TRACKS.some((t) => t.id === k))
  );
  console.log(`\n${C.b}dist/index.html${C.x}  ${C.g}built${C.x} in ${Date.now() - t0}ms`);
  console.log(`  shell        ${shell.cssFiles.length} css + ${shell.jsFiles.length} js files`);
  console.log(`  lessons      ${lessons.accepted.length} embedded` +
    (lessons.skipped.length ? `  ${C.y}(${lessons.skipped.length} skipped)${C.x}` : ""));
  for (const t of order) {
    if (!(t in lessons.perTrack)) continue;
    const n = lessons.perTrack[t];
    console.log(`    ${t.padEnd(12)} ${String(n).padStart(3)}${n === 0 ? `  ${C.d}(empty)${C.x}` : ""}`);
  }
  console.log(`  frames       ${framesCapable}/${lessons.accepted.length} lessons frame-capable` +
    (NO_SMOKE ? ` ${C.d}(smoke run skipped)${C.x}` : `, ${totalFrames} frames generated at defaults`));
  console.log(`  output       ${(bytes / 1024).toFixed(1)} KB  ${C.d}${path.relative(ROOT, OUT)}${C.x}`);
  if (!lessons.accepted.length) {
    console.log(`  ${C.y}note${C.x}         no lessons yet — the app boots and shows an empty state.`);
  }
}

main();
