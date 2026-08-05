// 12-dijkstra.js — Dijkstra & A* on a weighted grid.
// Exactly one statement: `export default { ... }`. No imports, no top-level consts.
// `frames` is a pure generator (rng only, no Date/DOM, never mutates a yielded object).
// `draw` is a pure single-frame renderer; every colour comes from `env.colors`.

export default {
  id: "dijkstra",
  track: "dsa",
  title: "Dijkstra & A*",
  difficulty: 2,
  minutes: 18,
  tags: ["graphs", "shortest-paths", "heaps", "heuristics", "greedy"],

  explainer: [
    { type: "p", text: "Dijkstra answers *single-source shortest path with non-negative weights*. It is BFS with a priority queue instead of a FIFO queue: instead of expanding in order of hop count, you expand in order of accumulated cost `d[v]`." },

    { type: "h3", text: "The invariant — and why greedy is safe here" },
    { type: "p", text: "The invariant is: **every node already popped from the queue has its final shortest distance**. The proof is one sentence you should be able to say out loud. Suppose we pop `u` with key `d[u]`. Any other path to `u` must leave the settled set at some frontier node `x`, which is still in the queue, so `d[x] >= d[u]`. That path then continues from `x` with only non-negative edges, so its total is `>= d[x] >= d[u]`. No cheaper path can exist." },
    { type: "callout", tone: "warn", text: "That argument uses non-negativity twice. With even one negative edge, the tail of the alternative path can be cheaper than its prefix and the greedy pop is wrong. Negative weights need Bellman-Ford (O(VE)), or Johnson's reweighting if you want all-pairs." },

    { type: "h3", text: "Lazy deletion — what you actually write" },
    { type: "p", text: "Textbook Dijkstra uses `decrease-key`, but `heapq` has no such operation. The idiomatic fix is **lazy deletion**: never update an entry in place, just push a new `(new_dist, v)` pair and, when popping, discard any entry whose key is worse than the best distance you have recorded. The heap can hold up to `E` entries, which is why the honest bound is `O(E log E)` — identical to `O(E log V)` since `E <= V^2`." },
    { type: "code", lang: "python", code: "if nd < dist[v]:\n    dist[v] = nd\n    heapq.heappush(pq, (nd, v))   # stale entries stay; we skip them on pop" },

    { type: "h3", text: "A* — the same algorithm with a bribe" },
    { type: "p", text: "A* orders the queue by `f = g + h` instead of `g`, where `g` is the cost so far and `h(v)` is an estimate of the remaining cost to the goal. On a 4-connected grid with minimum step cost 1, `h = |dr| + |dc|` (Manhattan) is the natural choice. The heuristic does not change what a path costs — it only changes the *order* in which you pull cells out, biasing expansion toward the goal instead of expanding a circle in every direction." },
    { type: "list", items: [
      "**Admissible**: `h(v) <= true remaining cost`. Guarantees the first pop of the goal is optimal.",
      "**Consistent** (monotone): `h(u) <= w(u,v) + h(v)`. Stronger; guarantees each node is popped at most once, so you never have to re-open a closed node.",
      "Manhattan distance on a unit-cost 4-connected grid is both. Euclidean distance on a grid where you may only move in 4 directions is admissible but weaker (it under-estimates more), so it expands more cells.",
      "`h = 0` degrades A* into exactly Dijkstra. Multiplying an admissible `h` by `w > 1` gives **weighted A***: faster, but the answer can be up to `w` times optimal."
    ]},
    { type: "callout", tone: "pitfall", text: "The classic trap: an interviewer asks you to add a heuristic to a grid with terrain costs of 1..9 and you write `h = manhattan * 9`. That over-estimates, so A* is no longer admissible and can return a sub-optimal path. Scale by the **minimum** possible step cost, not the maximum." },

    { type: "h3", text: "Edge cases worth naming before you code" },
    { type: "list", items: [
      "Unreachable target — the queue drains and `dist[goal]` stays at infinity. Say what you return.",
      "Zero-weight edges are fine (non-negative includes zero); they just mean ties.",
      "Self-loops and parallel edges are harmless — the relaxation `if nd < dist[v]` filters them.",
      "All weights equal → use plain BFS, `O(V + E)`, no heap at all.",
      "Weights only in `{0, 1}` → use **0-1 BFS** with a deque: push 0-edges to the front, 1-edges to the back. `O(V + E)`."
    ]},
    { type: "callout", tone: "tip", text: "On a grid, do not build an explicit adjacency list. Generate neighbours on the fly from `(r, c)` and treat 'weight' as the cost of *entering* a cell. Interviewers like seeing that the graph can stay implicit." }
  ],

  complexity: {
    rows: [
      { operation: "Dijkstra (binary heap, lazy)", time: "O(E log E)", space: "O(V + E)", note: "heap may hold one entry per relaxation" },
      { operation: "Dijkstra (Fibonacci heap)", time: "O(E + V log V)", space: "O(V)", note: "theory only; constants lose in practice" },
      { operation: "Dijkstra on an R×C grid", time: "O(RC log RC)", space: "O(RC)", note: "E = 4RC, graph stays implicit" },
      { operation: "A* (admissible h)", time: "O(E log E) worst case", space: "O(V)", note: "same bound; the win is in expanded nodes, not asymptotics" },
      { operation: "BFS (all weights equal)", time: "O(V + E)", space: "O(V)", note: "no heap needed" },
      { operation: "0-1 BFS (weights in {0,1})", time: "O(V + E)", space: "O(V)", note: "deque: front for 0, back for 1" },
      { operation: "Bellman-Ford (negative edges)", time: "O(V·E)", space: "O(V)", note: "also detects negative cycles" }
    ]
  },

  interview: {
    whyAsked: "It is the standard probe for whether you can reason about a greedy algorithm's correctness rather than just recite it. The signal is in three places: can you state the non-negativity argument for why a popped node is final, do you know that real heaps have no decrease-key (lazy deletion), and can you recognise when a cheaper specialised variant — BFS, 0-1 BFS, A* — applies instead.",
    followUps: [
      { q: "Why does Dijkstra break with negative edge weights, and what do you use instead?", a: "The correctness argument needs every alternative path leaving the settled set to cost at least as much as the node being popped, which relies on all remaining edges being non-negative. One negative edge lets a later hop reduce the total below an already-finalised distance, so a settled node can turn out wrong. Use Bellman-Ford, O(V·E), which relaxes every edge V-1 times and reports a negative cycle if a V-th pass still improves something. For all-pairs on a sparse graph with negative edges but no negative cycle, Johnson's algorithm reweights with Bellman-Ford potentials and then runs Dijkstra per source." },
      { q: "Your heap has no decrease-key. What do you do, and what does it cost?", a: "Lazy deletion: on every successful relaxation push a fresh `(new_dist, node)` entry and leave the old one in the heap. When you pop, compare the key with `dist[node]` and skip the entry if it is stale. The heap can grow to O(E) entries instead of O(V), so the bound is O(E log E), which is the same as O(E log V) up to a constant. It is strictly simpler than maintaining an index-to-heap-position map, and it is what `heapq` code in every language without a mutable heap looks like." },
      { q: "What must a heuristic satisfy for A* to stay correct?", a: "Admissibility — `h(v)` never exceeds the true remaining cost — guarantees that the first time the goal is popped, its `g` is optimal. Consistency, `h(u) <= w(u,v) + h(v)` with `h(goal) = 0`, is stronger: it makes `f` non-decreasing along any path, so a node is never re-opened after being closed, and you can safely skip already-settled nodes. Manhattan distance scaled by the minimum edge weight is consistent on a 4-connected grid; a heuristic scaled by the maximum weight is not even admissible." },
      { q: "How would bidirectional search help, and what is the catch?", a: "Run one search from the source and one from the goal and stop when the frontiers meet; if a search explores roughly b^d nodes, two searches of depth d/2 explore 2·b^(d/2), an enormous cut on large graphs. The catch is the stopping rule: you cannot stop the instant the frontiers touch, you must continue until the sum of the two frontier minimum keys exceeds the best meeting cost found so far. Bidirectional A* is fussier still because the two heuristics have to be made consistent with each other, which is why route planners usually prefer contraction hierarchies or ALT landmarks." },
      { q: "All your edge weights are 0 or 1. Can you beat a heap?", a: "Yes — 0-1 BFS with a double-ended queue in O(V + E). Relaxing a 0-weight edge pushes the neighbour to the front, a 1-weight edge pushes to the back; the deque then stays sorted with at most two distinct key values, which is exactly the ordering property the priority queue was providing. The same trick generalises to small integer weights bounded by k via a bucket queue (Dial's algorithm), which is O(V·k + E)." },
      { q: "You need the actual path, not just the distance. And what about all shortest paths?", a: "Keep a `parent[v]` set at the moment you improve `dist[v]`, then walk back from the goal and reverse. For all optimal paths, store a list of predecessors and append instead of overwrite whenever `nd == dist[v]`, which turns the parent pointers into a shortest-path DAG you can enumerate or count over. Counting paths is then a DP over that DAG in the order nodes were popped, which is already a topological order." }
    ]
  },

  code: [
    { lang: "python", label: "Dijkstra with heapq (lazy deletion)", code: "import heapq\n\ndef dijkstra(adj, src, n):\n    \"\"\"adj[u] = list of (v, w) with w >= 0. Returns dist, parent.\"\"\"\n    INF = float('inf')\n    dist = [INF] * n\n    parent = [-1] * n\n    dist[src] = 0\n    pq = [(0, src)]                      # (key, node)\n\n    while pq:\n        d, u = heapq.heappop(pq)\n        # Lazy deletion: heapq has no decrease-key, so we pushed duplicates.\n        # If this entry is out of date, a better one was already processed.\n        if d > dist[u]:\n            continue\n        # Greedy safety: nothing left in the heap has a key < d, and every\n        # remaining edge is >= 0, so d is final for u. Settle it.\n        for v, w in adj[u]:\n            nd = d + w\n            if nd < dist[v]:             # strict: ties change nothing\n                dist[v] = nd\n                parent[v] = u\n                heapq.heappush(pq, (nd, v))\n\n    return dist, parent\n\n\ndef path_to(parent, t):\n    out = []\n    while t != -1:\n        out.append(t)\n        t = parent[t]\n    return out[::-1]" },

    { lang: "python", label: "A* on a grid with terrain costs", code: "import heapq\n\ndef astar(grid, start, goal):\n    \"\"\"grid[r][c] = cost of ENTERING the cell, or 0 for a wall.\n    The graph stays implicit -- no adjacency list is ever built.\"\"\"\n    R, C = len(grid), len(grid[0])\n    step_min = 1                          # cheapest possible step cost\n\n    def h(r, c):\n        # Manhattan * min step cost => never overestimates => admissible.\n        # It is also consistent on a 4-connected grid, so no node reopens.\n        return (abs(r - goal[0]) + abs(c - goal[1])) * step_min\n\n    INF = float('inf')\n    g = [[INF] * C for _ in range(R)]\n    parent = {}\n    g[start[0]][start[1]] = 0\n    pq = [(h(*start), 0, start)]          # (f, g, node); f = g + h\n    closed = [[False] * C for _ in range(R)]\n\n    while pq:\n        f, gu, (r, c) = heapq.heappop(pq)\n        if closed[r][c]:                  # stale duplicate\n            continue\n        closed[r][c] = True\n        if (r, c) == goal:                # admissible h => this g is optimal\n            break\n        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):\n            nr, nc = r + dr, c + dc\n            if not (0 <= nr < R and 0 <= nc < C) or grid[nr][nc] == 0:\n                continue\n            ng = gu + grid[nr][nc]        # weight = cost of entering\n            if ng < g[nr][nc]:\n                g[nr][nc] = ng\n                parent[(nr, nc)] = (r, c)\n                heapq.heappush(pq, (ng + h(nr, nc), ng, (nr, nc)))\n\n    if g[goal[0]][goal[1]] == INF:\n        return None, INF                  # unreachable\n    node, path = goal, []\n    while node != start:\n        path.append(node)\n        node = parent[node]\n    path.append(start)\n    return path[::-1], g[goal[0]][goal[1]]" },

    { lang: "python", label: "0-1 BFS (weights in {0,1})", code: "from collections import deque\n\ndef zero_one_bfs(adj, src, n):\n    \"\"\"O(V + E): the deque holds at most two distinct keys, d and d+1,\n    so it is already 'sorted' and no heap is needed.\"\"\"\n    INF = float('inf')\n    dist = [INF] * n\n    dist[src] = 0\n    dq = deque([src])\n\n    while dq:\n        u = dq.popleft()\n        for v, w in adj[u]:               # w in {0, 1}\n            if dist[u] + w < dist[v]:\n                dist[v] = dist[u] + w\n                if w == 0:\n                    dq.appendleft(v)      # same layer -> front\n                else:\n                    dq.append(v)          # next layer -> back\n    return dist" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.55, maxFrames: 340 },

    params: [
      { key: "cols",    label: "Grid width",  type: "int",  min: 6, max: 16, default: 12 },
      { key: "rows",    label: "Grid height", type: "int",  min: 5, max: 10, default: 8 },
      { key: "density", label: "Wall %",      type: "int",  min: 0, max: 35, default: 16 },
      { key: "mode",    label: "Algorithm",   type: "enum", options: ["dijkstra", "a-star"], default: "dijkstra" },
      { key: "seed",    label: "New terrain", type: "seed" }
    ],

    frames: function* (params, rng) {
      const P = params || {};
      const cols = Math.max(6, Math.min(16, Math.round(Number(P.cols) || 12)));
      const rows = Math.max(5, Math.min(10, Math.round(Number(P.rows) || 8)));
      const density = Math.max(0, Math.min(35, Math.round(Number(P.density) === 0 ? 0 : (Number(P.density) || 16)))) / 100;
      const mode = P.mode === "a-star" ? "a-star" : "dijkstra";
      const astar = mode === "a-star";

      const INF = 1e9;              // JSON-safe stand-in for "unreached"
      // Hard budget. Provable upper bound at max params (16x10, no walls):
      // 160 pops + 160 relax summaries + 2 stale + init + path + done = 325.
      const MAXF = 332;             // layout.maxFrames is 340
      let fc = 0;

      // ---------- terrain ---------------------------------------------------
      const cost = [];
      for (let r = 0; r < rows; r++) {
        const row = [];
        for (let c = 0; c < cols; c++) {
          if (rng() < density) { row.push(0); continue; }   // 0 == wall
          const t = rng();
          row.push(t < 0.58 ? 1 : t < 0.80 ? 2 : t < 0.93 ? 4 : 9);
        }
        cost.push(row);
      }
      const sr = 0, sc = 0, gr = rows - 1, gc = cols - 1;
      if (cost[sr][sc] === 0) cost[sr][sc] = 1;
      // Carve one monotone corridor so the goal is always reachable.
      let wr = sr, wc = sc;
      while (wr !== gr || wc !== gc) {
        if (wr === gr) wc++;
        else if (wc === gc) wr++;
        else if (rng() < 0.5) wc++;
        else wr++;
        if (cost[wr][wc] === 0) cost[wr][wc] = 1;
      }

      let open = 0;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (cost[r][c] > 0) open++;

      const hOf = function (r, c) {
        // Manhattan distance x the minimum possible step cost (1).
        return astar ? (Math.abs(r - gr) + Math.abs(c - gc)) : 0;
      };

      // ---------- state arrays ---------------------------------------------
      const dist = [];
      const status = [];            // 0 unseen, 1 in queue, 2 settled
      const parent = [];            // encoded r*cols+c, or -1
      for (let r = 0; r < rows; r++) {
        dist.push(new Array(cols).fill(INF));
        status.push(new Array(cols).fill(0));
        parent.push(new Array(cols).fill(-1));
      }

      // ---------- a tiny binary min-heap on `key` ---------------------------
      const heap = [];
      const hswap = function (i, j) { const t = heap[i]; heap[i] = heap[j]; heap[j] = t; };
      const hpush = function (item) {
        heap.push(item);
        let i = heap.length - 1;
        while (i > 0) {
          const p = (i - 1) >> 1;
          if (heap[p].key <= heap[i].key) break;
          hswap(p, i); i = p;
        }
      };
      const hpop = function () {
        const top = heap[0];
        const last = heap.pop();
        if (heap.length > 0) {
          heap[0] = last;
          let i = 0;
          for (;;) {
            const l = 2 * i + 1, r = l + 1;
            let m = i;
            if (l < heap.length && heap[l].key < heap[m].key) m = l;
            if (r < heap.length && heap[r].key < heap[m].key) m = r;
            if (m === i) break;
            hswap(m, i); i = m;
          }
        }
        return top;
      };

      const snap = function (extra) {
        const base = {
          rows: rows, cols: cols, mode: mode,
          cost: cost.map(function (row) { return row.slice(); }),
          dist: dist.map(function (row) { return row.slice(); }),
          status: status.map(function (row) { return row.slice(); }),
          heap: heap.map(function (o) { return { r: o.r, c: o.c, g: o.g, h: o.h, key: o.key }; }),
          start: [sr, sc], goal: [gr, gc],
          pop: null, relaxed: [], path: [], stale: null,
          pops: 0, pushes: 0, open: open, inf: INF, best: INF
        };
        for (const k in extra) base[k] = extra[k];
        return base;
      };

      // ---------- go --------------------------------------------------------
      dist[sr][sc] = 0;
      status[sr][sc] = 1;
      let pushes = 1;
      hpush({ r: sr, c: sc, g: 0, h: hOf(sr, sc), key: hOf(sr, sc) });

      fc++;
      yield {
        label: astar
          ? "A* on a weighted grid. Each cell's number is the cost of entering it; the queue is ordered by f = g + h, where h is Manhattan distance to the goal."
          : "Dijkstra on a weighted grid. Each cell's number is the cost of entering it, and the queue is ordered purely by g, the cheapest cost known so far.",
        phase: "init",
        focus: [sr * cols + sc],
        state: snap({ pushes: pushes })
      };

      let pops = 0, staleShown = 0, staleCount = 0, reachedGoal = false;

      while (heap.length > 0) {
        if (fc > MAXF - 6) {
          fc++;
          yield {
            label: "Frame budget reached — shrink the grid or raise the wall density to watch the run end to end.",
            phase: "truncated",
            state: snap({ pops: pops, pushes: pushes })
          };
          return;
        }

        const top = hpop();
        const tr = top.r, tc = top.c;

        if (status[tr][tc] === 2 || top.g > dist[tr][tc]) {
          staleCount++;
          if (staleShown < 2) {
            staleShown++;
            fc++;
            yield {
              label: "Popped a stale entry for (" + tr + "," + tc + ") with key " + top.key + ", but that cell is already settled at " + dist[tr][tc] + ". This is lazy deletion: we never decrease a key, we push a duplicate and skip the outdated copy here.",
              phase: "stale",
              focus: [tr * cols + tc],
              state: snap({ pops: pops, pushes: pushes, stale: { r: tr, c: tc, key: top.key } })
            };
          }
          continue;
        }

        status[tr][tc] = 2;
        pops++;
        const isGoal = (tr === gr && tc === gc);
        const frontierMin = heap.length > 0 ? heap[0].key : null;

        let popLabel;
        if (astar) {
          popLabel = "Pop (" + tr + "," + tc + "): f = g + h = " + top.g + " + " + top.h + " = " + top.key +
            ". h never overestimates the remaining cost, so ordering by f only changes which cells we look at — never what a path costs.";
        } else {
          popLabel = "Pop (" + tr + "," + tc + ") with d = " + top.g + ". " +
            (frontierMin === null
              ? "The queue is now empty, so nothing can undercut it"
              : "Nothing left in the queue has a key below " + frontierMin) +
            ", and every weight is non-negative, so " + top.g + " is final for this cell.";
        }
        if (isGoal) {
          popLabel = (astar
            ? "The goal is popped with g = " + top.g + " (f = " + top.key + ", h = 0 here). "
            : "The goal is popped with d = " + top.g + ". ") +
            "The first pop of the goal is already optimal, so we stop — the rest of the queue can only be more expensive.";
        }

        fc++;
        yield {
          label: popLabel,
          phase: isGoal ? "goal" : "pop",
          focus: [tr * cols + tc],
          state: snap({
            pops: pops, pushes: pushes,
            pop: { r: tr, c: tc, g: top.g, h: top.h, key: top.key },
            best: isGoal ? top.g : INF
          })
        };

        if (isGoal) { reachedGoal = true; break; }

        // ---- relax the four neighbours, summarised into one frame ----------
        const relaxed = [];
        const deltas = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        for (let k = 0; k < deltas.length; k++) {
          const nr = tr + deltas[k][0], nc = tc + deltas[k][1];
          if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
          if (cost[nr][nc] === 0) continue;                 // wall
          if (status[nr][nc] === 2) continue;               // already final
          const nd = top.g + cost[nr][nc];                  // weight = entry cost
          if (nd < dist[nr][nc]) {
            const wasQueued = status[nr][nc] === 1;
            const old = dist[nr][nc];
            dist[nr][nc] = nd;
            parent[nr][nc] = tr * cols + tc;
            status[nr][nc] = 1;
            const nh = hOf(nr, nc);
            hpush({ r: nr, c: nc, g: nd, h: nh, key: nd + nh });
            pushes++;
            relaxed.push({ r: nr, c: nc, old: old, val: nd, h: nh, key: nd + nh, requeue: wasQueued });
          }
        }

        if (relaxed.length > 0) {
          const parts = [];
          for (let i = 0; i < relaxed.length; i++) {
            const x = relaxed[i];
            parts.push("(" + x.r + "," + x.c + ") " + (x.old >= INF ? "-" : String(x.old)) + "->" + x.val);
          }
          const requeued = relaxed.filter(function (x) { return x.requeue; }).length;
          let lbl = "Relax from (" + tr + "," + tc + "): " + parts.join(", ") +
            ". The edge weight is the cost of entering the neighbour, so the new key is " + top.g + " + terrain.";
          if (astar) {
            const x = relaxed[0];
            lbl += " Queued with f = g + h = " + x.val + " + " + x.h + " = " + x.key + " for (" + x.r + "," + x.c + "), which pulls cells near the goal to the front.";
          }
          if (requeued > 0) {
            lbl += " " + requeued + " of these were already in the queue with a worse key — we push the better copy and leave the stale one to be skipped later.";
          }
          fc++;
          yield {
            label: lbl,
            phase: "relax",
            focus: relaxed.map(function (x) { return x.r * cols + x.c; }),
            state: snap({
              pops: pops, pushes: pushes,
              pop: { r: tr, c: tc, g: top.g, h: top.h, key: top.key },
              relaxed: relaxed.map(function (x) { return { r: x.r, c: x.c, old: x.old, val: x.val, h: x.h, key: x.key, requeue: x.requeue }; })
            })
          };
        }
      }

      // ---------- traceback --------------------------------------------------
      const path = [];
      if (reachedGoal) {
        let cur = gr * cols + gc;
        let guard = 0;
        while (cur !== -1 && guard <= rows * cols) {
          path.push([Math.floor(cur / cols), cur % cols]);
          cur = parent[Math.floor(cur / cols)][cur % cols];
          guard++;
        }
        path.reverse();
      }

      const total = reachedGoal ? dist[gr][gc] : INF;

      fc++;
      yield {
        label: reachedGoal
          ? "Walk the parent pointers back from the goal: a path of " + path.length + " cells costing " + total + ". Each parent was recorded at the moment that cell's distance improved."
          : "The queue drained without reaching the goal — it is unreachable, and its distance stays at the infinity sentinel.",
        phase: "path",
        focus: path.map(function (p) { return p[0] * cols + p[1]; }),
        state: snap({ pops: pops, pushes: pushes, path: path.map(function (p) { return p.slice(); }), best: total })
      };

      fc++;
      yield {
        label: (astar
          ? "A* settled " + pops + " of " + open + " open cells"
          : "Dijkstra settled " + pops + " of " + open + " open cells") +
          " and pushed " + pushes + " heap entries (" + staleCount + " of them went stale). " +
          (astar
            ? "Flip the mode back to plain Dijkstra on the same seed: identical cost, a far larger expanded region, because h = 0 makes the frontier grow as a circle instead of a cone."
            : "Flip the mode to A* on the same seed: identical cost, far fewer cells expanded, because f = g + h drags the frontier toward the goal."),
        phase: "done",
        focus: path.map(function (p) { return p[0] * cols + p[1]; }),
        state: snap({ pops: pops, pushes: pushes, path: path.map(function (p) { return p.slice(); }), best: total })
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors;
      const W = env.width, H = env.height;
      const s = frame.state;
      const rows = s.rows, cols = s.cols, INF = s.inf;

      ctx.clearRect(0, 0, W, H);

      const padX = 14;
      const headH = 54;
      const heapH = 78;
      const gw = W - padX * 2;
      const gh = Math.max(40, H - headH - heapH - 8);
      const cell = Math.min(gw / cols, gh / rows);
      const gx = padX + (gw - cell * cols) / 2;
      const gy = headH + (gh - cell * rows) / 2;

      // ---- scale for "coloured by tentative distance" -----------------------
      let maxD = 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const d = s.dist[r][c];
          if (d < INF && d > maxD) maxD = d;
        }
      }

      const inPath = [];
      for (let r = 0; r < rows; r++) inPath.push(new Array(cols).fill(false));
      for (let i = 0; i < s.path.length; i++) inPath[s.path[i][0]][s.path[i][1]] = true;

      const isRelaxed = function (r, c) {
        for (let i = 0; i < s.relaxed.length; i++) if (s.relaxed[i].r === r && s.relaxed[i].c === c) return true;
        return false;
      };

      // ---- grid --------------------------------------------------------------
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = gx + c * cell, y = gy + r * cell;
          const wall = s.cost[r][c] === 0;
          const d = s.dist[r][c];
          const st = s.status[r][c];
          const ramp = d < INF ? 0.28 + 0.62 * (1 - d / (maxD + 1)) : 0.3;

          let fill = C.surface2;
          let alpha = 1;
          if (wall) { fill = C.viz8; alpha = 0.55; }
          else if (inPath[r][c]) { fill = C.viz6; alpha = 0.95; }
          else if (s.pop && s.pop.r === r && s.pop.c === c) { fill = C.viz1; alpha = 1; }
          else if (st === 2) { fill = C.viz3; alpha = ramp; }
          else if (st === 1) { fill = C.viz4; alpha = ramp; }

          ctx.globalAlpha = alpha;
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, Math.max(1, cell - 2), Math.max(1, cell - 2), 3);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.strokeStyle = C.grid;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, Math.max(1, cell - 2), Math.max(1, cell - 2), 3);
          ctx.stroke();

          if (isRelaxed(r, c)) {
            ctx.strokeStyle = C.viz2;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(x + 2, y + 2, Math.max(1, cell - 4), Math.max(1, cell - 4), 3);
            ctx.stroke();
          }

          if (wall) continue;

          // tentative distance (big) + terrain cost (small, corner)
          if (cell > 22) {
            ctx.textAlign = "center";
            ctx.fillStyle = C.text;
            ctx.font = Math.max(9, Math.round(cell * 0.34)) + "px " + env.font.mono;
            const label = d >= INF ? "·" : String(d);
            ctx.fillText(label, x + cell / 2, y + cell * 0.56);

            ctx.textAlign = "right";
            ctx.fillStyle = C.muted;
            ctx.font = Math.max(8, Math.round(cell * 0.24)) + "px " + env.font.mono;
            ctx.fillText(String(s.cost[r][c]), x + cell - 3, y + cell - 3);
          }
        }
      }

      // start / goal markers
      ctx.textAlign = "left";
      ctx.font = Math.max(9, Math.round(cell * 0.26)) + "px " + env.font.base;
      ctx.fillStyle = C.text2;
      ctx.fillText("S", gx + s.start[1] * cell + 3, gy + s.start[0] * cell + Math.max(10, cell * 0.3));
      ctx.fillText("G", gx + s.goal[1] * cell + 3, gy + s.goal[0] * cell + Math.max(10, cell * 0.3));

      ctx.strokeStyle = C.viz7;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(gx + s.goal[1] * cell + 1.5, gy + s.goal[0] * cell + 1.5, Math.max(1, cell - 3), Math.max(1, cell - 3), 3);
      ctx.stroke();

      // ---- header ------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      const title = s.mode === "a-star" ? "A*  —  key f = g + h" : "Dijkstra  —  key f = g  (h = 0)";
      ctx.fillText(title, padX, 18);

      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      let stat = "settled " + s.pops + "/" + s.open + "   heap " + s.heap.length + "   pushes " + s.pushes;
      if (s.best < INF) stat += "   cost " + s.best;
      ctx.fillText(stat, padX, 34);

      if (s.pop) {
        ctx.fillStyle = C.text2;
        ctx.font = "11px " + env.font.mono;
        const t = s.mode === "a-star"
          ? "(" + s.pop.r + "," + s.pop.c + ")  f = " + s.pop.g + " + " + s.pop.h + " = " + s.pop.key
          : "(" + s.pop.r + "," + s.pop.c + ")  d = " + s.pop.g;
        ctx.textAlign = "right";
        ctx.fillText(t, W - padX, 18);
        ctx.textAlign = "left";
      }

      // ---- legend ------------------------------------------------------------
      const legend = [
        [C.viz1, "popped now"],
        [C.viz4, "in queue"],
        [C.viz3, "settled"],
        [C.viz8, "wall"],
        [C.viz6, "path"]
      ];
      let lx = padX;
      const ly = 46;
      ctx.font = "10px " + env.font.base;
      ctx.textAlign = "left";
      for (let i = 0; i < legend.length; i++) {
        ctx.fillStyle = legend[i][0];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(lx, ly - 7, 9, 9, 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.muted;
        ctx.fillText(legend[i][1], lx + 13, ly + 1);
        lx += 15 + ctx.measureText(legend[i][1]).width + 12;
      }

      // ---- heap array strip --------------------------------------------------
      const hy = H - heapH + 10;
      ctx.fillStyle = C.text2;
      ctx.font = "11px " + env.font.base;
      ctx.textAlign = "left";
      ctx.fillText("priority queue (binary heap, stored as an array — index 0 is the minimum)", padX, hy - 2);

      const shown = Math.min(s.heap.length, Math.max(6, Math.floor((W - padX * 2) / 42)));
      const bw = shown > 0 ? Math.min(46, (W - padX * 2) / Math.max(1, shown)) : 0;
      for (let i = 0; i < shown; i++) {
        const e = s.heap[i];
        const x = padX + i * bw;
        ctx.fillStyle = i === 0 ? C.viz1 : C.surface2;
        ctx.globalAlpha = i === 0 ? 1 : 0.9;
        ctx.beginPath();
        ctx.roundRect(x + 1, hy + 6, Math.max(2, bw - 3), 34, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = i === 0 ? C.viz1 : C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 1, hy + 6, Math.max(2, bw - 3), 34, 3);
        ctx.stroke();

        if (bw > 24) {
          ctx.textAlign = "center";
          ctx.fillStyle = i === 0 ? C.text : C.text2;
          ctx.font = "11px " + env.font.mono;
          ctx.fillText(String(e.key), x + bw / 2, hy + 20);
          ctx.fillStyle = C.muted;
          ctx.font = "9px " + env.font.mono;
          ctx.fillText(e.r + "," + e.c, x + bw / 2, hy + 33);
          ctx.fillText(String(i), x + bw / 2, hy + 50);
        }
      }
      if (s.heap.length > shown) {
        ctx.textAlign = "left";
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.mono;
        ctx.fillText("+" + (s.heap.length - shown) + " more", padX + shown * bw + 4, hy + 26);
      }
      if (s.heap.length === 0) {
        ctx.textAlign = "left";
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.mono;
        ctx.fillText("empty", padX, hy + 26);
      }
    }
  },

  drill: {
    cards: [
      { q: "State the one-sentence proof that a node popped by Dijkstra has its final distance.", a: "Any alternative path to `u` must leave the settled set through some queued node `x`, and `x`'s key is >= `u`'s key because `u` was the minimum; the rest of that path adds only non-negative weight, so it cannot beat `d[u]`.", tags: ["invariant", "proof"] },
      { q: "Why does `heapq`-based Dijkstra push duplicate entries?", a: "There is no `decrease-key`. On each improvement you push a fresh `(new_dist, v)` and skip any popped entry with `d > dist[v]` — lazy deletion. The heap grows to O(E), giving O(E log E).", tags: ["implementation"] },
      { q: "What is the difference between an admissible and a consistent heuristic?", a: "Admissible: `h(v)` never exceeds the true remaining cost — the first pop of the goal is optimal. Consistent: `h(u) <= w(u,v) + h(v)` — stronger, makes `f` non-decreasing along paths so no node is ever re-opened.", tags: ["a-star"] },
      { q: "Manhattan heuristic on a grid whose terrain costs are 1..9 — what do you scale by?", a: "By the **minimum** step cost (1). Scaling by the maximum overestimates, breaks admissibility, and A* can return a sub-optimal path.", tags: ["a-star", "pitfall"] },
      { q: "Weights are all 0 or 1. Beat the heap.", a: "0-1 BFS with a deque in O(V + E): relax a 0-edge by pushing to the front, a 1-edge by pushing to the back. The deque holds at most two distinct keys, so it stays sorted for free.", tags: ["variant"] },
      { q: "Why can't Dijkstra handle negative edges, and what replaces it?", a: "The greedy pop assumes no path can get cheaper later; a negative edge breaks that, so an already-settled node can be wrong. Use Bellman-Ford, O(V·E), which also detects negative cycles.", tags: ["limits"] },
      { q: "Complexity of Dijkstra on an R×C grid, and how much of the graph do you build?", a: "O(RC log RC) time, O(RC) space. You build none of it — generate the four neighbours from `(r,c)` on the fly and treat the cell's terrain value as the edge weight.", tags: ["complexity", "grids"] },
      { q: "You need every shortest path, not just one. What changes?", a: "Append to a predecessor list on `nd == dist[v]` instead of overwriting on `nd < dist[v]`. The parent pointers become a shortest-path DAG; the pop order is already a topological order, so counting or enumerating is a DP over it.", tags: ["variant"] }
    ],
    sixtySecond: [
      "Explain why Dijkstra's greedy pop is safe, and exactly where the argument uses non-negative weights.",
      "Explain how A* differs from Dijkstra in one line of code, and what admissibility and consistency each buy you.",
      "Explain lazy deletion versus decrease-key, and what it does to the complexity bound."
    ]
  }
};
