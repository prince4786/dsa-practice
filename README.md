# CS Interview Prep Dashboard

A single, self-contained `dist/index.html` — 7 tracks of interview lessons, each with a
step-through visualizer, a spaced-repetition drill, and a 60-second explain mode.
Vanilla HTML/CSS/JS, zero dependencies, no network access at runtime: it opens straight
from `file://` under a strict CSP.

## Build

```bash
node build.js               # strict — any schema violation fails the build
node build.js --lenient     # schema violations become warnings; bad lessons are SKIPPED
node build.js --no-smoke    # skip the build-time generator dry-run
node build.js --quiet       # summary only
```

Output: **`dist/index.html`**. Open it directly in a browser (double-click, or
`open dist/index.html`). Nothing else is generated and nothing is fetched at runtime.

The build:

1. concatenates `src/shell/*.css` (name-sorted) into the template's `__CSS__` slot;
2. concatenates `src/shell/*.js` (name-sorted — **that ordering is the load order**) into `__SHELL__`;
3. for every `src/topics/<track>/<NN>-<id>.js`, checks the first non-comment token is
   `export default`, then emits
   `__registerLesson("<track>/<id>", (function(){ return { …file body… }; })());`
   — the body after `export default` is preserved byte-for-byte (only the whitespace
   immediately following the token is collapsed, so `return` can't hit ASI);
4. runs the **same validator the runtime uses** (`src/shell/10-registry.js`, loaded
   headless by `build.js`) and fails with the file *and* field named;
5. dry-runs each `viz.frames` generator with default params — failures are warnings, not
   errors, but they tell you a visualizer is broken before you open the browser.

Curriculum order is the filename `NN-` order. There is no manifest file, which is what
lets seven authors work in parallel without touching a shared file.

## Adding a lesson

Create `src/topics/<track>/<NN>-<lesson-id>.js` (track ∈ `dsa db ml rl agents ai sysdesign`)
containing **exactly one statement** — `export default { … }` — and **zero imports**.
`id` must equal the filename minus the `NN-` prefix, and `track` must equal the directory.
See `REFERENCE-LESSON.js` for the canonical shape and `SPEC.md` §2–§3 for the full contract.

Then `node build.js` and reload `dist/index.html`.

Things the shell guarantees, so you don't write them:

- **Playback.** Write a pure `function*` that yields `{ label, state, phase?, focus? }`.
  The shell materializes the whole array up front (capped at `viz.layout.maxFrames`,
  default 2000, then appends a truncation-warning frame), `structuredClone`s and deep-
  freezes every frame, and owns play/pause/step/scrub/speed/reset. `state` must be plain
  JSON data — a function, `Map`, or DOM node in there fails loudly at build time.
- **Determinism.** Use the injected `rng()` (seeded mulberry32) — never `Math.random`
  or `Date`. Declare a `{ key: "seed", type: "seed" }` param to get a dice button.
- **Colour.** `draw(frame, surface, env)` gets every design token through `env.colors`
  (`viz1`…`viz8`, `text`, `text2`, `muted`, `surface`, `surface2`, `border`, `grid`,
  `axis`, `accent`, `bg`, `ok`, `warn`, `danger`). Never hardcode a hex — the app is
  dual-theme and `draw` is re-invoked on theme change and on resize.
- **Sizing.** Canvas is DPR-scaled for you: draw in CSS pixels, using `env.width` /
  `env.height`. For `kind: "svg"` / `"diagram"`, `surface` is an empty `<svg>` root and
  `env.h(tag, attrs, children)` builds namespaced elements.
- **Helpers.** `env.text(x, y, str, { size, color, align, baseline, mono, weight, alpha })`
  and `env.badge(x, y, str, { color, bg, size, align })` work identically for canvas and svg.
- **Failure containment.** If `frames` or `draw` throws, the player shows an in-place error
  card naming the lesson and the error. One bad lesson never white-screens the app.

## Keyboard shortcuts

| Key | Action |
|---|---|
| `/` or `⌘K` / `Ctrl+K` | Command palette — fuzzy search over lesson titles and tags |
| `?` | Shortcut overlay |
| `g` then `1`–`7` | Jump to a track |
| `g` then `h` / `d` | Home / Drill |
| `[` `]` | Previous / next lesson |
| `t` | Toggle theme |
| `Esc` | Close overlay or sidebar |
| **Visualizer** | |
| `Space` | Play / pause |
| `←` `→` | Step one frame |
| `Shift+←` `Shift+→` | Jump ten frames |
| `Home` / `End` | First / last frame |
| `-` `=` | Slower / faster (×0.25 – ×4) |
| `r` | Reset (re-seeds if the viz has a `seed` param) |
| **Drill** | |
| `Space` | Reveal the answer / start the 60-second timer |
| `1`–`4` | Grade: Again / Hard / Good / Easy |

Everything is also reachable by `Tab` — all controls are real `<button>`, `<a>`, `<input>`
and `<select>` elements, including the frame scrubber (`<input type="range">`).

## Progress

Progress, SRS scheduling and stats live in `localStorage` under the `cid.v1.*` namespace
(§1 of SPEC.md). Every access is wrapped in `try/catch`: if a browser blocks storage on
`file://`, the app still runs — progress just becomes session-only.

## Layout

```
build.js                     the only build step (node:fs + node:path only)
dist/index.html              the artifact
src/index.template.html      skeleton with the __CSS__ / __SHELL__ / __LESSONS__ slots
src/shell/00-tokens.css      design tokens — the ONLY place colours are defined
src/shell/01-base.css        reset, typography, app grid
src/shell/02-components.css  cards, buttons, tabs, callouts, code, overlays, drill
src/shell/03-viz.css         visualizer chrome, transport bar, params, scrubber
src/shell/10-registry.js     registry + schema validator (shared with build.js)
src/shell/11-store.js        localStorage wrappers
src/shell/12-srs.js          SM-2-lite
src/shell/13-router.js       hash router
src/shell/14-theme.js        theme + resolved token colours for canvas
src/shell/15-ui.js           dom helper, chrome, page renderers, command palette
src/shell/16-player.js       frame engine + transport (the core)
src/shell/17-drill.js        drill queue, scoped drill, 60-second mode
src/shell/18-main.js         boot + global keymap
src/topics/<track>/NN-id.js  lessons (one author per track)
```
