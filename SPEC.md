# CS Interview Prep Dashboard — Build Specification (v1)

Working dir: `/Users/prince/Documents/Tech-docs.noindex/dsa_practice`. Vanilla HTML/CSS/JS, zero deps, one `build.js` node script, single self-contained `dist/index.html` that works from `file://` and under a strict CSP (no CDNs, no `fetch`, no external assets, no `eval`).

---

## 1. Information Architecture

### Navigation model
```
Home (dashboard) ──> Track ──> Lesson ──> [Explainer | Visualizer | Code | Interview | Drill Me]
        │
        └──> Drill (global spaced-repetition queue)
```

- **Layout**: persistent left sidebar (collapsible on <900px into a hamburger sheet): `Home`, the 7 tracks (`DSA`, `Databases`, `Machine Learning`, `Reinforcement Learning`, `LLM Agents`, `AI Foundations`, `System Design`), `Drill`, theme toggle, and a global progress ring.
- **Routing**: hash router, no fetch. Routes: `#/` (home), `#/t/<track>` (track page), `#/t/<track>/<lessonId>` (lesson), `#/t/<track>/<lessonId>/viz` (visualizer focused full-width), `#/drill`, `#/drill/60s`. Back/forward must work (`hashchange` listener only).
- **Home**: per-track completion bars, "Due today: N cards" call-to-action, "Continue where you left off" (last route from localStorage), and a "random visualizer" button.
- **Track page**: lesson cards in curriculum order showing difficulty pip, status dot (unseen / learning / reviewing / mastered), and est. minutes.
- **Lesson page**: single scroll page with sticky in-page tab bar anchoring to sections in this order: **Visualizer first** (the #1 requirement — it is above the fold), then Explainer, Complexity, Code, "Why interviewers ask this", Follow-ups, Drill Me (starts a scoped drill of just this lesson's cards). Prev/next lesson footer links.
- **Keyboard**: `Tab`-navigable everywhere (all controls are real `<button>/<input>/<a>`); `?` opens a shortcut overlay; `[` `]` prev/next lesson; `t` theme toggle; `g` then `1–7` jumps to a track. Visualizer keys in §3.

### Progress & spaced repetition (localStorage)
Single namespace, versioned, one JSON blob per concern (read on boot, write-through on change, `try/catch` all JSON parsing):

| Key | Value shape |
|---|---|
| `cid.v1.meta` | `{ schema: 1, theme: "dark"\|"light"\|"auto", lastRoute: string }` |
| `cid.v1.lessons` | `{ [ "track/lessonId" ]: { status: "unseen"\|"learning"\|"reviewing"\|"mastered", lastVisited: epochMs, vizCompleted: boolean } }` |
| `cid.v1.srs` | `{ [cardId]: { ease: number (init 2.5, min 1.3), intervalDays: number, due: epochMs, reps: number, lapses: number } }` |
| `cid.v1.stats` | `{ streakDays, lastStudyDay: "YYYY-MM-DD", reviewsByDay: { [day]: count } }` |

SRS algorithm: **SM-2-lite**, grades `Again(0) / Hard(1) / Good(2) / Easy(3)`. Again → interval 0 (re-queue this session), Hard → interval×1.2, Good → interval×ease, Easy → interval×ease×1.3; ease += (-0.2, -0.05, 0, +0.1) clamped to [1.3, 3.0]; first Good = 1 day, second = 3 days. `cardId = "<track>/<lessonId>#<cardIndex>"` — stable because card arrays are append-only (builder rule). Lesson auto-status: `learning` on first visit, `reviewing` once all its cards have ≥1 rep, `mastered` when all its cards have `intervalDays ≥ 21`.

---

## 2. Lesson Content Model — THE integration contract

Every lesson file is `src/topics/<track>/<NN>-<lessonId>.js` (NN = 2-digit curriculum order) containing **exactly one statement**: `export default { ... }` and **zero `import` statements**. `build.js` transforms it mechanically (§6), so any deviation breaks the build — this is deliberate.

```js
export default {
  // identity
  id: "binary-search",            // string, kebab-case, MUST equal filename minus "NN-" prefix
  track: "dsa",                   // "dsa"|"db"|"ml"|"rl"|"agents"|"ai"|"sysdesign"
  title: "Binary Search",         // string, ≤ 40 chars
  difficulty: 1,                  // 1 = fundamentals, 2 = standard interview, 3 = senior/deep-dive
  minutes: 12,                    // int, estimated study time
  tags: ["arrays", "divide-and-conquer"],   // string[], lowercase kebab-case

  // prose — array of blocks, rendered in order. NO raw HTML strings.
  explainer: [
    { type: "p",    text: "…" },                       // plain paragraph; `code` spans via backticks, shell renders them
    { type: "h3",   text: "…" },
    { type: "list", items: ["…", "…"] },
    { type: "callout", tone: "tip"|"warn"|"pitfall", text: "…" },
    { type: "code", lang: "python", code: "…" }        // inline mini-snippet inside prose
  ],

  // complexity table — null if genuinely N/A (e.g., a CAP-theorem lesson)
  complexity: {
    rows: [ { operation: "Search", time: "O(log n)", space: "O(1)", note: "iterative" } ]
  } | null,

  interview: {
    whyAsked: "1–3 sentence string: what signal the interviewer is extracting.",
    followUps: [                                       // 3–8 entries
      { q: "What if the array has duplicates?", a: "2–4 sentence model answer." }
    ]
  },

  code: [                                              // 1–3 snippets, first is the canonical one
    { lang: "python"|"sql"|"javascript"|"pseudo", label: "Iterative", code: "…" }
  ],

  viz: { /* §3 — REQUIRED on every lesson; may be kind:"diagram" for concept lessons */ },

  drill: {
    cards: [                                           // 4–10; APPEND-ONLY after first publish
      { q: "string (may contain backtick code spans)", a: "string", tags: ["…"] }
    ],
    sixtySecond: [                                     // 1–3 "explain X in 60 seconds" prompts
      "Explain binary search's invariant and why the loop terminates."
    ]
  }
}
```

Validation: `build.js` runs a schema check (field presence + types) and **fails the build with file+field named** on any violation. That check is the safety net that lets 7 agents work blind.

---

## 3. Visualizer Plugin Contract

**Generator-of-frames design.** Algorithm authors write a pure generator that yields immutable state snapshots; the shell owns *all* playback (play/pause/step-fwd/step-back/speed/scrub/reset) by materializing the frame array up front and rendering `frames[i]`. Step-back and scrubbing become array indexing — no inverse operations, no author-side playback code.

```js
viz: {
  kind: "canvas" | "svg" | "diagram",   // "diagram" = svg with a small hand-authored frame list
  layout: { aspect: 1.6, maxFrames: 2000 },   // aspect = width/height hint; maxFrames optional (default 2000)

  // Optional user-tweakable inputs, rendered by the shell as a control row.
  params: [
    { key: "n",      label: "Array size", type: "int",  min: 4, max: 64, default: 16 },
    { key: "target", label: "Target",     type: "int",  min: 0, max: 99, default: 37 },
    { key: "mode",   label: "Pivot",      type: "enum", options: ["first","random","median3"], default: "random" },
    { key: "seed",   label: "Shuffle",    type: "seed" }   // shell shows a dice button; value = uint32
  ],

  // PURE generator. No DOM, no Date/Math.random (use rng), no mutation of yielded objects.
  frames: function* (params, rng) {       // rng: () => float in [0,1), seeded, deterministic
    yield { label: "Initial state", state: { arr: [...a], lo: 0, hi: n-1, mid: null } };
    // … yield after every semantically meaningful step …
  },

  // PURE renderer of ONE frame. Never animates, never stores state between calls.
  draw: function (frame, surface, env) { /* full redraw of `frame` */ }
}
```

**Frame schema** (every yielded object):
```js
{
  label: "Compare a[mid]=42 with target=37",  // REQUIRED, one sentence, shown under the canvas
  state: { /* plain JSON-serializable data — arrays, numbers, strings, bools, nulls only */ },
  phase: "search" | "done" | …,               // optional string, shell shows as a badge
  focus: [3, 7]                                // optional — indices/ids the shell may echo in the caption
}
```

**Shell guarantees & rules**
- On mount and on any param change, the shell runs the generator to completion (hard cap `maxFrames`, then truncates with a warning frame), passing each yield through `structuredClone` and `Object.freeze` — so authors get immutability enforcement for free, and functions/DOM nodes in `state` throw immediately.
- `surface` is a `CanvasRenderingContext2D` (already DPR-scaled; draw in CSS pixels) for `kind:"canvas"`, or an empty `<svg>` root plus helper `env.h(tag, attrs, children)` for `kind:"svg"` (draw clears and rebuilds — cheap at these sizes).
- `env = { width, height, theme: "light"|"dark", colors: { /* resolved token hex values, §7 — REQUIRED source of all colors; canvas can't read CSS vars, so the shell resolves them */ }, font: { base, mono }, text(x,y,str,opts), badge(...) }`. `draw` is re-invoked on theme change and resize with the same frame.
- **Transport UI (shell-owned, identical everywhere)**: play/pause, step ±1, jump ±10, speed ×0.25–×4, scrub slider with frame count, reset, param row, current `label` caption. Keys: `Space` play/pause, `←/→` step, `Shift+←/→` ±10, `Home/End` first/last, `-/=` speed, `r` reset (re-seeds if a `seed` param exists). Slider is a real `<input type="range">` → keyboard/screen-reader scrubbing free of charge.
- Reaching the last frame sets `vizCompleted: true` in progress storage.

---

## 4. Curriculum (76 lessons, interview-weighted)

Format: `NN id — Title [difficulty] — visualization in one line`.

### Track `dsa` — 14 lessons
1. `big-o` — Big-O Intuition [1] — n / n log n / n² / 2ⁿ dot-racers on a shared track, n slider, log-scale toggle.
2. `two-pointers` — Two Pointers [1] — bar array with converging L/R pointers solving container-with-most-water, best area ghosted.
3. `sliding-window` — Sliding Window [1] — translucent window band sliding over an array, live sum + char-frequency panel shrinking/growing.
4. `binary-search` — Binary Search & Variants [1] — shrinking [lo,hi] bracket with mid probe, discarded half fades to muted; lower-bound mode toggle.
5. `sorting` — Merge Sort vs Quick Sort [2] — bar-height array animating swaps/merges with the recursion tree drawn live beside it.
6. `heaps` — Heaps & Top-K [2] — implicit tree and its backing array side-by-side, sift-up/down arrows moving both in lockstep.
7. `hash-tables` — Hash Tables [1] — keys flying through a hash function into buckets, chaining growth, load-factor bar triggering animated rehash.
8. `linked-lists` — Linked List Reversal & Cycles [1] — nodes with prev/cur/next pointer arrows flipping one edge per frame; Floyd's tortoise/hare mode.
9. `monotonic-stack` — Stacks & Monotonic Stack [2] — next-greater-element: bars scan left→right while the stack column pops smaller bars off.
10. `tree-traversals` — BFS/DFS on Trees [1] — tree with the frontier rendered as a literal queue/stack strip, visited nodes recolor in visit order.
11. `graph-traversal` — Graph BFS/DFS/Topo Sort [2] — node-link graph, expanding visited wave; topo mode shows in-degree counters hitting zero.
12. `dijkstra` — Dijkstra & A* [2] — weighted grid with expanding frontier, priority queue rendered as a heap array; A* toggle shows heuristic pull.
13. `dynamic-programming` — DP Table Filling [2] — edit-distance grid filling cell-by-cell with dependency arrows from the 3 source cells; traceback path.
14. `union-find` — Union-Find [2] — forest of nodes merging on union; path-compression frame visibly flattens a chain onto the root.

### Track `db` — 11 lessons
1. `sql-execution` — Logical SQL Execution Order [1] — clauses (FROM→WHERE→GROUP→HAVING→SELECT→ORDER→LIMIT) light up while a rowset shrinks/reshapes per stage.
2. `btree-index` — B-Tree Indexes [2] — keys inserted into a B-tree with page splits; range-scan walks down then across leaf links.
3. `index-selection` — Index Selection & Covering Indexes [2] — same query raced: full-scan row sweep vs index seek; composite-key leftmost-prefix toggle.
4. `join-algorithms` — Nested-Loop / Hash / Merge Joins [2] — two tables as row strips; each algorithm animates its probe pattern with a comparison counter.
5. `query-planner` — Query Planner & EXPLAIN [3] — plan tree builds bottom-up, per-node cost/row estimates fill, alternative plan swaps in on stats change.
6. `acid-transactions` — Transactions & ACID [1] — two interleaved transaction timelines against a ledger; commit flushes, rollback rewinds.
7. `isolation-levels` — Isolation Levels & Anomalies [2] — dirty read / non-repeatable read / phantom scenarios replayed on twin timelines per isolation level (dropdown).
8. `mvcc` — MVCC & Snapshot Visibility [3] — row version chains stacking; each transaction's snapshot filter dims invisible versions; vacuum sweeps dead ones.
9. `deadlocks` — Locks & Deadlock Detection [2] — lock table plus wait-for graph; a cycle forms, detector highlights it, victim aborts.
10. `sharding` — Partitioning & Sharding [2] — rows routed by hash vs range key to shard boxes; hot-shard glows; resharding animates row movement.
11. `replication-cap` — Replication & CAP [2] — leader-follower with a partition toggle: CP side refuses writes, AP side diverges then anti-entropy reconciles.

### Track `ml` — 12 lessons
1. `gradient-descent` — Gradient Descent [1] — contour plot of a loss surface with the descent ball; learning-rate slider from crawl to divergence.
2. `optimizers` — Momentum / RMSProp / Adam [2] — three balls racing the same ravine-shaped surface, trailing paths compared.
3. `linear-logistic` — Linear & Logistic Regression [1] — fit line / sigmoid decision boundary re-fitting per epoch over a 2D point cloud, loss ticker.
4. `bias-variance` — Bias-Variance & Overfitting [2] — polynomial-degree slider morphs the fit while train/test error curves diverge live.
5. `cross-validation` — Splits & K-Fold CV [1] — data strip re-partitioning per fold, per-fold score chips averaging into one estimate.
6. `backprop` — Backpropagation [2] — 2-3-1 network: forward pass fills activations left→right, then gradients flow back edge-by-edge with chain-rule products shown.
7. `activations` — Activations & Vanishing Gradients [2] — deep sigmoid vs ReLU chain; per-layer gradient-magnitude bars shrinking to nothing vs surviving.
8. `regularization` — L1/L2/Dropout [2] — weight scatter shrinking toward zero (L1 snapping exactly to zero) per step; dropout mode blanks random neurons.
9. `decision-trees` — Trees & Random Forests [2] — 2D point cloud recursively split by axis-aligned lines as the tree grows beside it; forest mode overlays voted boundary.
10. `kmeans` — k-Means Clustering [1] — centroids step: assignment recolor, centroid drag to mean, until convergence; bad-init seed shows local optimum.
11. `pca` — PCA & Embeddings [2] — 2D cloud with rotating candidate axis maximizing variance; projection collapses points onto PC1.
12. `roc-metrics` — Precision/Recall/ROC [2] — threshold slider sweeps a score histogram; confusion matrix and ROC/PR points update live.

### Track `rl` — 10 lessons
1. `bandits` — Multi-Armed Bandits [1] — slot arms pulled by ε-greedy vs UCB; estimate bars with confidence whiskers converge; regret curves race.
2. `mdp` — MDPs: States/Actions/Rewards [1] — gridworld rollout stepping s→a→r→s′ with the return accumulating and discounting visibly (γ slider).
3. `value-iteration` — Bellman & Value Iteration [2] — gridworld heatmap of V(s) converging sweep-by-sweep; max-over-actions backup shown for the focused cell.
4. `policy-iteration` — Policy Iteration [2] — alternating evaluation (heatmap settles) and improvement (policy arrows flip) until arrows stop changing.
5. `mc-vs-td` — Monte Carlo vs TD Learning [2] — same episode: MC updates every visited state at the end vs TD nudging each state per step.
6. `q-learning` — Q-Learning [2] — gridworld with 4 Q-value wedges per cell updating; ε decays; greedy path emerges through a wall maze.
7. `sarsa-vs-q` — SARSA vs Q-Learning [2] — cliff-walk: SARSA's safe path vs Q-learning's cliff-edge path drawn from the same training run.
8. `exploration` — Exploration vs Exploitation [2] — regret curves under ε ∈ {0, 0.01, 0.1, 0.5} with per-arm pull-count histograms.
9. `policy-gradient` — REINFORCE / Policy Gradients [3] — action-probability bars shifting after each rewarded episode; high-variance jitter vs baseline-subtracted mode.
10. `actor-critic-rlhf` — Actor-Critic → RLHF [3] — animated loop diagram: actor acts, critic scores, gradients flow; RLHF mode swaps critic for a reward model over answer pairs + KL leash.

### Track `agents` — 10 lessons
1. `tokens-context` — Tokenization & Context Windows [1] — sentence splitting into token tiles filling a fixed-width window; overflow truncates oldest tiles with a cost counter.
2. `sampling` — Next-Token Sampling [1] — probability bar chart per step; temperature/top-p/top-k sliders visibly reshape and truncate the distribution.
3. `prompt-assembly` — Prompt Anatomy & Few-Shot [1] — system / examples / history / user blocks stacking into the context window; block sizes trade off live.
4. `react-loop` — ReAct Agent Loop [2] — thought→action→observation cycle stepping through a real task ("find cheapest flight"), transcript growing beside the loop diagram.
5. `tool-calling` — Tool / Function Calling [2] — JSON schema card, model emits a call frame, executor swimlane returns a result, model incorporates it; malformed-call retry branch.
6. `rag-chunking` — RAG I: Chunking & Embeddings [2] — document sliced by chunk-size/overlap sliders; chunks fly into a 2D embedding scatter, semantic neighbors cluster.
7. `rag-retrieval` — RAG II: Retrieval & Reranking [2] — query vector lands in the scatter, kNN ring highlights candidates, reranker reorders, winners assemble into the prompt.
8. `agent-memory` — Memory & Context Management [2] — long conversation overflowing the window: buffer vs summarization vs retrieval memory strategies animated side-by-side.
9. `mcp` — Model Context Protocol [2] — host/client/server swimlanes: initialize handshake, tools/list, tools/call round-trip with typed message envelopes stepping across.
10. `multi-agent` — Multi-Agent Orchestration [3] — planner decomposes a task into a DAG; worker agents execute nodes in parallel swimlanes; results merge; one failure triggers replan.

### Track `ai` — 9 lessons
1. `perceptron` — Neurons & Forward Pass [1] — 2-layer net computing on real numbers: weighted edges thicken, activations fill neuron circles layer by layer.
2. `convolution` — CNNs & Convolution [2] — 3×3 kernel sliding over an image grid producing the feature map cell-by-cell; edge-detector kernel preset.
3. `embeddings` — Embeddings & Cosine Similarity [1] — word vectors as arrows; cosine angle arc animates as you pick word pairs; nearest-neighbor list updates.
4. `attention` — Attention Mechanism [2] — per-token Q·K score matrix fills, softmax normalizes each row into a heatmap, weighted V-sum composes the output token.
5. `transformer` — The Transformer Block [3] — one token's journey through the residual stream: LN → multi-head attention → add → LN → MLP → add, activations flowing.
6. `minimax` — Minimax & Alpha-Beta [2] — tic-tac-toe game tree: values bubble up; alpha-beta mode grays out pruned branches with the α/β bounds shown.
7. `decoding` — Greedy vs Beam Search [2] — token tree expanding; beams (k slider) survive by cumulative log-prob while greedy's single path goes wrong.
8. `training-pipeline` — Pretrain → SFT → RLHF [2] — animated pipeline: web-scale corpus → base model → instruction pairs → preference pairs → reward model → PPO, with what-changes-at-each-stage captions.
9. `scaling-laws` — Scaling Laws & Loss Curves [3] — log-log compute-vs-loss lines per model size; compute-optimal frontier traced; slider allocates FLOPs between params and tokens.

### Track `sysdesign` — 12 lessons
1. `load-balancing` — Scaling & Load Balancers [1] — request dots fan across servers under round-robin vs least-connections; kill a server, watch redistribution + health checks.
2. `caching` — Caching & Eviction (LRU/LFU) [1] — request stream hitting a cache box: hit/miss flashes, LRU recency stack reorders, hit-rate gauge; TTL + stampede toggle.
3. `cdn` — CDN & Edge Delivery [1] — origin + edge nodes with user dots worldwide; first request travels to origin and populates the edge, later ones stop short; latency histogram.
4. `consistent-hashing` — Consistent Hashing [2] — hash ring with virtual nodes; add/remove a node and watch only the neighboring key arc remap, versus mod-N remapping everything.
5. `rate-limiting` — Rate Limiters [2] — token bucket filling/draining next to fixed vs sliding window counters, identical burst traffic replayed through all three; 429s flash red.
6. `queues` — Message Queues & Backpressure [2] — producer/consumer flow with live queue-depth graph; slow consumer grows the queue; add consumers or shed load to recover.
7. `replication` — DB Replication & Failover [2] — leader ships log entries to followers (sync vs async lag bars); leader dies, follower promotes, stale reads highlighted.
8. `wal` — Write-Ahead Log & Recovery [2] — writes append to the WAL before the page cache; crash marker hits mid-flush; recovery replays the log to the last commit record.
9. `raft` — Leader Election (Raft) [3] — five nodes with term counters and randomized election timers; heartbeats stream, leader dies, candidate wins votes; split-vote retry case.
10. `quorums` — CAP, PACELC & Quorums [2] — N/R/W sliders over replica nodes; partition toggle shows when R+W>N saves you and what latency it costs.
11. `hot-keys` — Sharding & Hot Keys [2] — hash vs range routing of a key stream; a celebrity key melts one shard; salting/replication of the hot key restores balance.
12. `retries-idempotency` — Timeouts, Retries & Idempotency [2] — client-server timeline: timeout fires after the write landed, naive retry double-charges; idempotency key dedupes; exponential backoff + jitter vs retry storm.

---

## 5. Interview Drill Mode

- **Card pool** = union of every lesson's `drill.cards`, ids per §1. `#/drill` shows: due count, new-cards-today (cap 20, from lessons with status ≥ learning), and a Start button.
- **Review session UI**: question → reveal → self-grade `Again / Hard / Good / Easy` (keys `1–4`, `Space` to reveal). Each card shows a "→ open lesson" link. Session ends with a summary (reviewed / relearned / streak).
- **60-second explain mode** (`#/drill/60s`): draws a random `sixtySecond` prompt from studied lessons, shows a 60s ring timer (`Space` start/pause), then reveals that lesson's explainer + complexity table for self-check, then self-grade feeding the same SRS entry (cardId `"<track>/<id>#60s<n>"`).
- **Scoped drill**: lesson page "Drill Me" runs only that lesson's cards, ignoring due dates, but still records grades.
- Track pages show per-track due counts so revision can be targeted before a specific interview.

---

## 6. File Tree & Parallelization Plan

```
dsa_practice/
├── build.js                      # the only node script (uses only node:fs, node:path)
├── dist/                         # generated; dist/index.html is the artifact
└── src/
    ├── index.template.html       # skeleton: <style>/*__CSS__*/</style> <script>/*__SHELL__*/ /*__LESSONS__*/</script>
    ├── shell/
    │   ├── 00-tokens.css         # design tokens (§7) — ONLY file that defines colors
    │   ├── 01-base.css           # reset, typography, layout grid
    │   ├── 02-components.css     # cards, tabs, buttons, callouts, code blocks, transport bar
    │   ├── 03-viz.css            # visualizer chrome, param row, scrubber
    │   ├── 10-registry.js        # window.__L = {}; window.__registerLesson(key, obj) + schema validation
    │   ├── 11-store.js           # localStorage wrappers (§1 keys)
    │   ├── 12-srs.js             # SM-2-lite (§1)
    │   ├── 13-router.js          # hash router
    │   ├── 14-theme.js           # theme toggle + resolved-token color object for canvas
    │   ├── 15-ui.js              # dom helper h(), sidebar, home, track & lesson page renderers
    │   ├── 16-player.js          # frame engine: materialize/clone/freeze frames, transport, keys (§3)
    │   ├── 17-drill.js           # drill + 60s mode
    │   └── 18-main.js            # boot: build nav from registry, mount router
    └── topics/
        ├── dsa/       01-big-o.js … 14-union-find.js
        ├── db/        01-sql-execution.js … 11-replication-cap.js
        ├── ml/        01-gradient-descent.js … 12-roc-metrics.js
        ├── rl/        01-bandits.js … 10-actor-critic-rlhf.js
        ├── agents/    01-tokens-context.js … 10-multi-agent.js
        ├── ai/        01-perceptron.js … 09-scaling-laws.js
        └── sysdesign/ 01-load-balancing.js … 12-retries-idempotency.js
```

**build.js behavior (mechanical, no parser):** concatenate `src/shell/*.css` (sorted) into `__CSS__`; concatenate `src/shell/*.js` (sorted by the `NN-` prefix — that IS the load order) into `__SHELL__`; for each `src/topics/<track>/<NN>-<id>.js`, verify the file's first non-comment token sequence is `export default`, then emit `__registerLesson("<track>/<id>", (function(){ return { ...file body with "export default" stripped... }; })());` into `__LESSONS__`; run the schema validator in node (same validation source as `10-registry.js`) and fail loudly. Curriculum order = filename `NN-` order, so **no shared manifest file exists** — that's what makes zero-overlap parallelism work.

**Agent ownership (zero file overlap):**

| Agent | Owns |
|---|---|
| **A0 Shell** | `build.js`, `src/index.template.html`, everything in `src/shell/` |
| **A1** | `src/topics/dsa/` (14 files) |
| **A2** | `src/topics/db/` (11 files) |
| **A3** | `src/topics/ml/` (12 files) |
| **A4** | `src/topics/rl/` (10 files) |
| **A5** | `src/topics/agents/` (10 files) |
| **A6** | `src/topics/ai/` (9 files) |
| **A7** | `src/topics/sysdesign/` (12 files) |

No agent ever edits another agent's directory. Integration = run build, open `dist/index.html`.

---

## 7. Design Direction & Tokens

**Style**: dark-first "focused lab" aesthetic — near-black page, one elevated surface per card, hairline borders instead of shadows, a single blue accent, and color used *meaningfully only inside visualizations*. System font stack everywhere (CSP forbids webfonts); monospace for code and array cells; `tabular-nums` for any number column or axis. Recessive chrome, vivid data. Sidebar 240px; content column `max-width: 880px`; visualizers may go full-bleed to 1100px. Border radius 10px cards / 6px controls. Motion: transport-driven frames only — UI transitions ≤ 150ms and disabled under `prefers-reduced-motion`.

Tokens live **only** in `src/shell/00-tokens.css`; builder agents must never hardcode a color — canvas/svg code reads them via `env.colors`. Key names in `env.colors` are the token names without the leading `--` (e.g. `env.colors.viz1`, `env.colors.text`, `env.colors.surface`, `env.colors.grid`, `env.colors.axis`, `env.colors.muted`, `env.colors.accent`, `env.colors.ok`, `env.colors.warn`, `env.colors.danger`, `env.colors.text2`, `env.colors.surface2`, `env.colors.border`).

```css
:root[data-theme="dark"] {           /* default */
  --bg: #0d0d0d;  --surface: #1a1a19;  --surface-2: #232322;
  --text: #ffffff;  --text-2: #c3c2b7;  --muted: #898781;
  --border: rgba(255,255,255,.10);  --grid: #2c2c2a;  --axis: #383835;
  --accent: #3987e5;
  --viz-1: #3987e5;  /* active / current element  */
  --viz-2: #d95926;  /* comparing / swapping      */
  --viz-3: #199e70;  /* visited / done / sorted   */
  --viz-4: #c98500;  /* frontier / candidate      */
  --viz-5: #d55181;  /* secondary pointer / probe */
  --viz-6: #008300;  /* accepted / committed      */
  --viz-7: #9085e9;  /* special / pivot / leader  */
  --viz-8: #e66767;  /* conflict / error / pruned */
  --ok: #0ca30c;  --warn: #fab219;  --danger: #d03b3b;
  --font: system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: ui-monospace, "SF Mono", Menlo, Consolas, monospace;
  --radius: 10px;  --radius-sm: 6px;  --gap: 16px;
}
:root[data-theme="light"] {
  --bg: #f9f9f7;  --surface: #fcfcfb;  --surface-2: #f0efec;
  --text: #0b0b0b;  --text-2: #52514e;  --muted: #898781;
  --border: rgba(11,11,11,.10);  --grid: #e1e0d9;  --axis: #c3c2b7;
  --accent: #2a78d6;
  --viz-1: #2a78d6;  --viz-2: #eb6834;  --viz-3: #1baf7a;  --viz-4: #eda100;
  --viz-5: #e87ba4;  --viz-6: #008300;  --viz-7: #4a3aa7;  --viz-8: #e34948;
  --ok: #006300;  --warn: #fab219;  --danger: #d03b3b;
}
```

Semantic rules for agents: use `--viz-*` by the *role comments above*, never "because it looks nice"; ≤ 4 simultaneous roles per frame; identity is never color-alone (pair with a label, pointer glyph, or position); text on canvas uses `--text`/`--text-2`/`--muted`, never a series color; status colors (`--ok/--warn/--danger`) are reserved for pass/fail states, never as a fourth data series.
