// Lesson: Graph BFS/DFS/Topo Sort.
// Contract notes: exactly one statement (`export default {...}`), zero imports,
// `frames` is a pure seeded generator (all node positions are computed here and
// carried in state), `draw` is a pure full-redraw taking every colour from env.colors.

export default {
  id: "graph-traversal",
  track: "dsa",
  title: "Graph BFS/DFS/Topo Sort",
  difficulty: 2,
  minutes: 16,
  tags: ["graphs", "bfs", "dfs", "topological-sort", "cycles"],

  explainer: [
    { type: "p", text: "Graph traversal is tree traversal plus **one extra line**: a `visited` set. A tree has no way back, so recursion terminates for free; a graph has cycles, so without `visited` you loop forever. Everything else — BFS, DFS, topological sort, connected components, bipartite check, cycle detection — is the same walk with different bookkeeping hung off it." },

    { type: "h3", text: "BFS and DFS differ by one data structure" },
    { type: "p", text: "Both pull a node from a container, mark it, and push its unvisited neighbours back in. A **queue** (FIFO) makes it breadth-first; a **stack** (LIFO, or the call stack) makes it depth-first. That is the entire difference in code — but it changes what the traversal *guarantees*." },

    { type: "h3", text: "Why BFS gives shortest paths on unweighted graphs" },
    { type: "p", text: "The BFS invariant: **the queue always holds nodes in non-decreasing distance from the source, spanning at most two adjacent levels.** So when a node is dequeued, every node at a smaller distance has already been dequeued. The first time you *discover* a node, you discovered it from a node at distance `d`, and no shorter route can exist — anything shorter would have surfaced earlier. That is why `dist[v] = dist[u] + 1` at discovery time is final and never needs relaxing." },

    { type: "callout", tone: "warn", text: "This argument depends on every edge costing exactly 1. Give the edges weights and it collapses — a 2-hop path can be cheaper than a 1-hop path. That is precisely the gap Dijkstra fills by replacing the queue with a priority queue." },

    { type: "h3", text: "Cycle detection: directed ≠ undirected" },
    { type: "list", items: [
      "**Undirected** — DFS and, when you meet an already-visited neighbour, ask *is it the node I came from?* If yes, that is just the edge you walked in on. If no, it is a genuine cycle. (Union-Find also works: an edge joining two nodes already in the same set closes a cycle.)",
      "**Directed** — the parent trick is not enough; you need the **white / grey / black** colouring. White = untouched, grey = entered but not finished (currently on the recursion stack), black = fully finished. An edge into a **grey** node is a **back edge** and proves a cycle. An edge into a black node is harmless — that subtree is already closed.",
      "**Kahn's algorithm** detects a directed cycle as a side effect: if you emit fewer than `n` nodes, the leftovers are exactly the nodes on or downstream of a cycle."
    ]},

    { type: "code", lang: "python", code: "WHITE, GREY, BLACK = 0, 1, 2\n\ndef has_cycle(u):\n    color[u] = GREY                    # on the current recursion stack\n    for v in adj[u]:\n        if color[v] == GREY:  return True   # back edge -> cycle\n        if color[v] == WHITE and has_cycle(v): return True\n    color[u] = BLACK                   # finished; safe forever\n    return False" },

    { type: "h3", text: "Topological sort: two algorithms, one meaning" },
    { type: "p", text: "A topological order lists every node before all of its dependents. **Kahn (BFS-flavoured)** keeps an in-degree counter per node — *how many prerequisites are still unmet* — repeatedly emits any node whose counter is zero, and decrements its neighbours. **DFS-flavoured** pushes each node onto an output list when it *finishes* (turns black), then reverses that list: a node finishes only after everything reachable from it has finished, so reversed finish order is a valid topological order." },

    { type: "callout", tone: "pitfall", text: "The trap: candidates decrement the in-degree counter and then push the node *whenever it changes*, not only when it reaches zero — which emits a node before its prerequisites and silently produces a wrong order on any node with in-degree ≥ 2. Push only on the exact `0` transition." },

    { type: "h3", text: "Representation matters" },
    { type: "list", items: [
      "**Adjacency list** — O(V + E) space, iterating a node's neighbours is O(deg). The default for anything sparse, which is almost everything.",
      "**Adjacency matrix** — O(V²) space, O(1) edge lookup, O(V) to list neighbours. Worth it only for dense graphs, or when you need constant-time 'is there an edge u→v?'",
      "**Grids are graphs** — an r×c grid is V = rc nodes with implicit 4- or 8-directional edges. Never materialise the adjacency list; generate neighbours on the fly."
    ]}
  ],

  complexity: {
    rows: [
      { operation: "BFS / DFS (adjacency list)", time: "O(V + E)", space: "O(V)", note: "every node and edge touched once" },
      { operation: "BFS / DFS (adjacency matrix)", time: "O(V²)", space: "O(V²)", note: "listing neighbours costs O(V) per node" },
      { operation: "Shortest path, unweighted", time: "O(V + E)", space: "O(V)", note: "BFS; first discovery is optimal" },
      { operation: "Topological sort (Kahn or DFS)", time: "O(V + E)", space: "O(V)", note: "also reports whether a cycle exists" },
      { operation: "Connected components", time: "O(V + E)", space: "O(V)", note: "loop over all nodes, BFS/DFS each unvisited one" },
      { operation: "DFS recursion depth", time: "—", space: "O(V)", note: "a 10⁵-node path overflows Python's default limit" }
    ]
  },

  interview: {
    whyAsked: "Half of all graph interview questions are a traversal with a twist, so the signal is whether you reach for the right walk without being told: shortest hops ⇒ BFS, reachability or ordering ⇒ DFS, dependencies ⇒ topological sort. Interviewers also watch for the two things that separate 'has memorised BFS' from 'understands BFS': marking a node visited at *enqueue* time rather than dequeue time, and knowing that the shortest-path guarantee comes from the FIFO invariant and dies the moment edges get weights.",
    followUps: [
      { q: "BFS or DFS — how do you choose?", a: "BFS when the answer is about distance or the shallowest anything: shortest path in an unweighted graph, minimum number of moves, level-by-level processing. DFS when the answer is about structure or exhaustion: connectivity, cycle detection, topological order, backtracking, articulation points. Memory is the tiebreak — BFS holds a whole frontier (up to O(V) on a wide graph), DFS holds one path (O(depth)), so on a very wide shallow graph DFS is cheaper and on a very deep narrow one BFS avoids stack overflow." },
      { q: "How do you detect a cycle in an undirected graph, and why doesn't that method work for a directed one?", a: "Undirected: DFS and treat any already-visited neighbour that is not the parent you came from as a cycle. That works because an undirected edge is traversable both ways, so the only false positive is the edge you just walked. In a directed graph there is no such symmetry — an edge into an already-visited node may point into a completely finished region, which is fine. You need white/grey/black: only an edge into a grey node, one still on the current recursion stack, closes a cycle." },
      { q: "Kahn's algorithm or DFS-based topological sort?", a: "They are both O(V + E). Kahn is iterative, so no recursion-limit risk, it reports a cycle naturally (fewer than V nodes emitted), and it extends cleanly to lexicographically-smallest order by swapping the queue for a heap and to level-scheduling for 'minimum number of semesters'. DFS-based is shorter to write and falls out of code you may already have, but it needs the reversal step and either recursion or a hand-rolled stack. In interviews I default to Kahn because the cycle case is free." },
      { q: "What exactly does a cycle do to Kahn's algorithm?", a: "Every node on the cycle has an in-degree that is kept above zero by another node on the same cycle, so none of them can ever be emitted, and none of their downstream nodes can either. The queue drains and the loop exits early with `len(order) < V`. That comparison IS the cycle test — and the un-emitted set is exactly the nodes on or reachable from a cycle, which is useful for reporting *which* dependencies deadlocked." },
      { q: "How do you count connected components, and how does that change for a directed graph?", a: "Undirected: loop over all nodes; each time you find an unvisited one, run a BFS/DFS from it and increment a counter — total cost is still O(V + E) because each node is entered once. Union-Find gives the same answer incrementally in near-O(1) per edge, which is preferable if edges arrive as a stream. For directed graphs 'connected' splits: weakly connected components ignore direction (same algorithm on the undirected view), while strongly connected components need Tarjan or Kosaraju." },
      { q: "Adjacency list or adjacency matrix?", a: "List, unless the graph is dense or you need O(1) edge existence checks. A list is O(V + E) space and iterating a node's neighbours costs O(deg u), so a full traversal is O(V + E). A matrix is O(V²) space regardless, and listing neighbours costs O(V), which drags a traversal to O(V²). At E ≈ V² they converge and the matrix's cache behaviour and bitset tricks can win." }
    ]
  },

  code: [
    { lang: "python", label: "BFS + DFS", code: "from collections import deque\n\ndef bfs(adj, src):\n    \"\"\"Shortest #hops from src on an UNWEIGHTED graph.\"\"\"\n    dist = {src: 0}\n    parent = {src: None}\n    q = deque([src])\n    while q:\n        u = q.popleft()\n        for v in adj[u]:\n            if v not in dist:          # FIRST discovery == shortest path\n                dist[v] = dist[u] + 1  # ...so this value is final\n                parent[v] = u\n                q.append(v)            # mark on ENQUEUE, not on dequeue,\n                                       # or a node lands in the queue twice\n    return dist, parent\n\ndef path_to(parent, t):\n    out = []\n    while t is not None:\n        out.append(t); t = parent[t]\n    return out[::-1]\n\ndef dfs_iter(adj, src):\n    \"\"\"Iterative DFS — no recursion limit to worry about.\"\"\"\n    seen, order, stack = {src}, [], [src]\n    while stack:\n        u = stack.pop()\n        order.append(u)\n        for v in reversed(adj[u]):     # reversed -> same order as recursion\n            if v not in seen:\n                seen.add(v)\n                stack.append(v)\n    return order\n\ndef components(n, adj):\n    seen, count = set(), 0\n    for s in range(n):                 # every node, not just node 0\n        if s in seen: continue\n        count += 1\n        q = deque([s]); seen.add(s)\n        while q:\n            u = q.popleft()\n            for v in adj[u]:\n                if v not in seen:\n                    seen.add(v); q.append(v)\n    return count" },

    { lang: "python", label: "Topological sort (Kahn + DFS)", code: "from collections import deque\n\ndef topo_kahn(n, edges):\n    \"\"\"edges = [(u, v)] meaning u must come before v.\"\"\"\n    adj = [[] for _ in range(n)]\n    indeg = [0] * n                     # 'prerequisites still unmet'\n    for u, v in edges:\n        adj[u].append(v)\n        indeg[v] += 1\n\n    q = deque(i for i in range(n) if indeg[i] == 0)\n    order = []\n    while q:\n        u = q.popleft()\n        order.append(u)\n        for v in adj[u]:\n            indeg[v] -= 1\n            if indeg[v] == 0:           # ONLY on the exact 0 transition\n                q.append(v)\n\n    if len(order) < n:\n        # the un-emitted nodes are on / downstream of a cycle\n        return None                     # cycle detected\n    return order\n\ndef topo_dfs(n, adj):\n    WHITE, GREY, BLACK = 0, 1, 2\n    color = [WHITE] * n\n    out = []\n\n    def visit(u):\n        color[u] = GREY\n        for v in adj[u]:\n            if color[v] == GREY:\n                raise ValueError(\"cycle\")   # back edge\n            if color[v] == WHITE:\n                visit(v)\n        color[u] = BLACK\n        out.append(u)                   # append on FINISH\n\n    for u in range(n):\n        if color[u] == WHITE:\n            visit(u)\n    return out[::-1]                    # reversed finish order" },

    { lang: "python", label: "Two classic twists", code: "from collections import deque\n\ndef is_bipartite(n, adj):\n    color = [-1] * n\n    for s in range(n):\n        if color[s] != -1: continue\n        color[s] = 0\n        q = deque([s])\n        while q:\n            u = q.popleft()\n            for v in adj[u]:\n                if color[v] == -1:\n                    color[v] = color[u] ^ 1\n                    q.append(v)\n                elif color[v] == color[u]:\n                    return False        # odd cycle\n    return True\n\ndef multi_source_bfs(grid):\n    \"\"\"'Rotting oranges' / 'nearest exit': seed the queue with EVERY\n    source at distance 0 and one BFS solves all of them at once.\"\"\"\n    R, Cn = len(grid), len(grid[0])\n    q = deque()\n    dist = [[-1] * Cn for _ in range(R)]\n    for r in range(R):\n        for c in range(Cn):\n            if grid[r][c] == 2:\n                dist[r][c] = 0\n                q.append((r, c))\n    while q:\n        r, c = q.popleft()\n        for dr, dc in ((1,0), (-1,0), (0,1), (0,-1)):\n            nr, nc = r + dr, c + dc\n            if 0 <= nr < R and 0 <= nc < Cn and dist[nr][nc] == -1 and grid[nr][nc] == 1:\n                dist[nr][nc] = dist[r][c] + 1\n                q.append((nr, nc))\n    return dist" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 260 },

    params: [
      { key: "n",       label: "Nodes",        type: "int",  min: 5, max: 16, default: 14 },
      { key: "density", label: "Edge density", type: "int",  min: 10, max: 80, default: 50 },
      { key: "mode",    label: "Algorithm",    type: "enum", options: ["bfs", "dfs", "topo-sort", "topo-cycle"], default: "bfs" },
      { key: "seed",    label: "Rewire",       type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(5, Math.min(16, params.n | 0));
      const density = Math.max(0, Math.min(100, params.density | 0));
      const mode = params.mode;
      const directed = (mode === "topo-sort" || mode === "topo-cycle");
      const NAMES = "ABCDEFGHIJKLMNOP";
      function nameOf(i) { return NAMES.charAt(i); }

      // ---- build the graph ---------------------------------------------------
      const adj = [];
      for (let i = 0; i < n; i++) adj.push([]);
      const edges = [];
      const seenE = {};
      function ekey(u, v) {
        return directed ? (u + ">" + v) : (Math.min(u, v) + "-" + Math.max(u, v));
      }
      function addEdge(u, v) {
        if (u === v) return false;
        const kk = ekey(u, v);
        if (seenE[kk]) return false;
        seenE[kk] = 1;
        edges.push([u, v]);
        adj[u].push(v);
        if (!directed) adj[v].push(u);
        return true;
      }

      const extraMax = Math.floor(n * 1.4);
      const extra = Math.round((density / 100) * extraMax);
      const perm = [];
      for (let i = 0; i < n; i++) perm.push(i);

      if (directed) {
        // random permutation => every edge goes forwards in it => guaranteed DAG
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const t = perm[i]; perm[i] = perm[j]; perm[j] = t;
        }
        for (let i = 1; i < n; i++) addEdge(perm[Math.floor(rng() * i)], perm[i]);
        let tries = 0, added = 0;
        while (added < extra && tries < extra * 12 + 60) {
          tries++;
          const i = 1 + Math.floor(rng() * (n - 1));
          const j = Math.floor(rng() * i);
          if (addEdge(perm[j], perm[i])) added++;
        }
      } else {
        for (let i = 1; i < n; i++) addEdge(i, Math.floor(rng() * i));   // spanning tree => connected
        let tries = 0, added = 0;
        while (added < extra && tries < extra * 12 + 60) {
          tries++;
          if (addEdge(Math.floor(rng() * n), Math.floor(rng() * n))) added++;
        }
      }
      for (let i = 0; i < n; i++) adj[i].sort(function (a, b) { return a - b; });

      // ---- layered layout, computed HERE so draw stays pure ------------------
      const layer = new Array(n).fill(0);
      const src = 0;
      if (directed) {
        const ind0 = new Array(n).fill(0);
        for (let i = 0; i < edges.length; i++) ind0[edges[i][1]]++;
        const qq = [];
        for (let i = 0; i < n; i++) if (ind0[i] === 0) qq.push(i);
        let head = 0, guard = 0;
        while (head < qq.length && guard++ < n * n + 20) {
          const u = qq[head++];
          for (let t = 0; t < adj[u].length; t++) {
            const v = adj[u][t];
            if (layer[v] < layer[u] + 1) layer[v] = layer[u] + 1;
            ind0[v]--;
            if (ind0[v] === 0) qq.push(v);
          }
        }
      } else {
        for (let i = 0; i < n; i++) layer[i] = -1;
        layer[src] = 0;
        const qq = [src];
        let head = 0, guard = 0;
        while (head < qq.length && guard++ < n * n + 20) {
          const u = qq[head++];
          for (let t = 0; t < adj[u].length; t++) {
            const v = adj[u][t];
            if (layer[v] < 0) { layer[v] = layer[u] + 1; qq.push(v); }
          }
        }
        for (let i = 0; i < n; i++) if (layer[i] < 0) layer[i] = 0;
      }
      let numLayers = 1;
      for (let i = 0; i < n; i++) if (layer[i] + 1 > numLayers) numLayers = layer[i] + 1;

      // ---- inject a real cycle AFTER layering, for the topo-cycle mode -------
      let cycleSeed = [];
      if (mode === "topo-cycle") {
        // Seed the cycle part-way down the DAG (never on a source node), so Kahn
        // emits a healthy prefix and only THEN stalls — that is the teachable shape.
        let start = -1;
        const from = Math.max(1, Math.floor(n / 3));
        for (let i = from; i < n - 1; i++) { const u = perm[i]; if (adj[u].length > 0) { start = u; break; } }
        if (start < 0) for (let i = 1; i < n; i++) { const u = perm[i]; if (adj[u].length > 0) { start = u; break; } }
        if (start >= 0) {
          let cur = start;
          for (let s = 0; s < 3; s++) {
            if (adj[cur].length === 0) break;
            cur = adj[cur][Math.floor(rng() * adj[cur].length)];
          }
          if (cur !== start && addEdge(cur, start)) {
            adj[cur].sort(function (a, b) { return a - b; });
            cycleSeed = [cur, start];
          }
        }
      }

      const posX = new Array(n).fill(0.5);
      const posY = new Array(n).fill(0.5);
      const byLayer = [];
      for (let i = 0; i < numLayers; i++) byLayer.push([]);
      for (let i = 0; i < n; i++) byLayer[layer[i]].push(i);
      for (let l = 0; l < numLayers; l++) {
        const col = byLayer[l];
        for (let i = 0; i < col.length; i++) {
          posX[col[i]] = (l + 0.5) / numLayers;
          let y = (i + 1) / (col.length + 1) + (rng() - 0.5) * 0.05;
          if (y < 0.08) y = 0.08;
          if (y > 0.92) y = 0.92;
          posY[col[i]] = y;
        }
      }

      const nodesBase = [];
      for (let i = 0; i < n; i++) {
        nodesBase.push({ id: i, name: nameOf(i), nx: posX[i], ny: posY[i], layer: layer[i] });
      }

      // ---- frame plumbing ----------------------------------------------------
      const MAXF = 250;
      const F = [];
      const dist = new Array(n).fill(-1);
      const indeg = new Array(n).fill(0);
      const status = new Array(n).fill(0);        // 0 unseen, 1 frontier/grey, 2 done/black
      const emitted = [];
      let queue = [];
      const treeEdges = [];
      let marked = [];

      function add(label, phase, cur, extra2) {
        if (F.length >= MAXF) return;
        const e = extra2 || {};
        F.push({
          label: label,
          phase: phase,
          focus: (cur === null || cur === undefined || cur < 0) ? [] : [cur],
          state: {
            n: n,
            mode: mode,
            directed: directed,
            src: src,
            layers: numLayers,
            nodes: nodesBase.map(function (o) { return { id: o.id, name: o.name, nx: o.nx, ny: o.ny, layer: o.layer }; }),
            edges: edges.map(function (p) { return [p[0], p[1]]; }),
            dist: dist.slice(),
            indeg: indeg.slice(),
            status: status.slice(),
            queue: queue.slice(),
            queueKind: (mode === "dfs") ? "stack" : "queue",
            treeEdges: treeEdges.map(function (p) { return [p[0], p[1]]; }),
            activeEdge: e.edge ? [e.edge[0], e.edge[1]] : [],
            emitted: emitted.slice(),
            current: (cur === null || cur === undefined) ? -1 : cur,
            marked: marked.slice(),
            showDist: mode === "bfs",
            showIndeg: directed,
            hint: e.hint || ""
          }
        });
      }

      if (mode === "bfs") {
        dist[src] = 0;
        status[src] = 1;
        queue = [src];
        add("BFS from " + nameOf(src) + ". dist[" + nameOf(src) + "] = 0 and the queue holds only the source. Invariant: the queue is always sorted by distance and spans at most two adjacent rings.", "init", -1, { hint: "queue = FIFO ⇒ rings of equal distance" });
        let guard = 0;
        while (queue.length > 0 && F.length < MAXF && guard++ < 4 * n + 20) {
          const u = queue.shift();
          status[u] = 2;
          emitted.push(u);
          add("Dequeue " + nameOf(u) + " (dist " + dist[u] + "). Everything newly reachable from here sits at distance " + (dist[u] + 1) + " — FIFO guarantees no node at a larger distance is ever dequeued before a smaller one.", "visit", u, { hint: "ring " + dist[u] + " drains before ring " + (dist[u] + 1) });
          for (let t = 0; t < adj[u].length && F.length < MAXF; t++) {
            const v = adj[u][t];
            if (dist[v] === -1) {
              dist[v] = dist[u] + 1;
              status[v] = 1;
              queue.push(v);
              treeEdges.push([u, v]);
              add("Edge " + nameOf(u) + "–" + nameOf(v) + ": " + nameOf(v) + " has never been seen, so this is its FIRST discovery. Set dist = " + dist[v] + " and enqueue. On an unweighted graph first discovery IS the shortest path, so this number is final.", "discover", v, { edge: [u, v], hint: "mark visited at ENQUEUE time" });
            } else {
              add("Edge " + nameOf(u) + "–" + nameOf(v) + ": " + nameOf(v) + " already has dist " + dist[v] + ", which is ≤ " + (dist[u] + 1) + ". A second route to it cannot be shorter, so BFS just drops the edge — no relaxation needed when every edge costs 1.", "skip", v, { edge: [u, v], hint: "no relaxation: all edges cost 1" });
            }
          }
        }
        add("BFS complete: " + emitted.length + " of " + n + " nodes reached, each labelled with its true shortest hop count. Give the edges weights and this breaks — a 2-hop path can beat a 1-hop path, which is exactly the hole Dijkstra's priority queue fills.", "done", -1, { hint: "unweighted only" });

      } else if (mode === "dfs") {
        const parent = new Array(n).fill(-1);
        const st = [{ u: src, i: 0 }];
        status[src] = 1;
        queue = [src];
        emitted.push(src);
        add("DFS from " + nameOf(src) + ". The strip below is the RECURSION STACK: grey = entered but not finished, black = finished. DFS commits to one path as deep as it goes before it ever considers a sibling.", "init", src, { hint: "grey = on the stack, black = finished" });
        let guard = 0;
        while (st.length > 0 && F.length < MAXF && guard++ < 8 * n * n + 40) {
          const top = st[st.length - 1];
          const u = top.u;
          if (top.i < adj[u].length) {
            const v = adj[u][top.i];
            top.i++;
            if (status[v] === 0) {
              status[v] = 1;
              parent[v] = u;
              st.push({ u: v, i: 0 });
              queue = st.map(function (fr) { return fr.u; });
              emitted.push(v);
              treeEdges.push([u, v]);
              add("Edge " + nameOf(u) + "→" + nameOf(v) + ": " + nameOf(v) + " is WHITE, so DFS dives into it immediately — the stack is now " + st.length + " deep and holds exactly the path from the source to " + nameOf(v) + ".", "descend", v, { edge: [u, v], hint: "stack = current path from the source" });
            } else if (!directed && v === parent[u]) {
              add("Edge " + nameOf(u) + "–" + nameOf(v) + ": that is the edge we walked IN on. In an undirected graph you must skip the parent, or every single edge would look like a 2-cycle.", "parent", v, { edge: [u, v], hint: "undirected: skip the parent" });
            } else if (status[v] === 1) {
              add("Edge " + nameOf(u) + "→" + nameOf(v) + ": " + nameOf(v) + " is GREY — still on the stack, so there is already a path from " + nameOf(v) + " down to " + nameOf(u) + ". This is a BACK EDGE and it proves a cycle.", "back", v, { edge: [u, v], hint: "grey target ⇒ back edge ⇒ cycle" });
            } else {
              add("Edge " + nameOf(u) + "→" + nameOf(v) + ": " + nameOf(v) + " is BLACK — already finished, its whole region explored. Harmless: an edge into a finished node can never close a cycle.", "cross", v, { edge: [u, v], hint: "black target ⇒ no cycle" });
            }
          } else {
            st.pop();
            status[u] = 2;
            queue = st.map(function (fr) { return fr.u; });
            add(nameOf(u) + " has no unexplored edges left, so it FINISHES (black) and pops off the recursion stack. Record nodes in this finish order, reverse it, and you have a topological sort — for free.", "finish", u, { hint: "reversed finish order = topological order" });
          }
        }
        add("DFS complete. It reached " + emitted.length + " of " + n + " nodes along a single deep path at a time, holding only O(depth) memory — versus BFS, which holds a whole frontier. Neither gives shortest paths here; only BFS's FIFO order does.", "done", -1, { hint: "DFS memory = path length, not frontier" });

      } else {
        for (let i = 0; i < edges.length; i++) indeg[edges[i][1]]++;
        add("Kahn's algorithm. Each counter is that node's IN-DEGREE — how many prerequisites are still unmet. Count them all in one pass over the edges first.", "init", -1, { hint: "in-degree = unmet prerequisites" });
        queue = [];
        for (let i = 0; i < n; i++) if (indeg[i] === 0) { queue.push(i); status[i] = 1; }
        add(queue.length + " node" + (queue.length === 1 ? " has" : "s have") + " in-degree 0 — nothing has to come before " + (queue.length === 1 ? "it" : "them") + ", so " + (queue.length === 1 ? "it is a" : "they are") + " legal first pick" + (queue.length === 1 ? "" : "s") + ". Seed the queue with all of them.", "seed", -1, { hint: "counter 0 ⇒ unblocked" });
        let guard = 0;
        while (queue.length > 0 && F.length < MAXF && guard++ < 4 * n + 20) {
          const u = queue.shift();
          status[u] = 2;
          emitted.push(u);
          add("Emit " + nameOf(u) + " at position " + emitted.length + " of " + n + ". Its counter was 0, so every prerequisite of " + nameOf(u) + " is already in the output — that is the whole correctness argument.", "emit", u, { hint: "emit only when the counter is 0" });
          for (let t = 0; t < adj[u].length && F.length < MAXF; t++) {
            const v = adj[u][t];
            indeg[v]--;
            if (indeg[v] === 0) {
              status[v] = 1;
              queue.push(v);
              add("Edge " + nameOf(u) + "→" + nameOf(v) + " is now satisfied: " + nameOf(v) + "'s counter drops 1 → 0, so " + nameOf(v) + " is unblocked and joins the queue. Push ONLY on this exact zero transition — pushing on every decrement is the classic bug.", "zero", v, { edge: [u, v], hint: "push only on the 0 transition" });
            } else {
              add("Edge " + nameOf(u) + "→" + nameOf(v) + " is now satisfied: " + nameOf(v) + "'s counter drops " + (indeg[v] + 1) + " → " + indeg[v] + ". Still blocked by " + indeg[v] + " other prerequisite" + (indeg[v] === 1 ? "" : "s") + ", so it stays out of the queue.", "dec", v, { edge: [u, v], hint: "still blocked" });
            }
          }
        }
        if (emitted.length < n) {
          const stuck = [];
          for (let i = 0; i < n; i++) if (status[i] !== 2) stuck.push(i);
          marked = stuck.slice();
          add("STALL. The queue is empty but only " + emitted.length + " of " + n + " nodes were emitted, and every survivor still has a positive counter — each is waiting on another survivor. That mutual waiting is a CYCLE, and `len(order) < V` is the standard directed-cycle test.", "cycle", -1, { hint: "cycle ⇒ Kahn stops early" });
          add("The " + stuck.length + " highlighted nodes are on, or downstream of, the cycle. Kahn does not just say 'a cycle exists' — the un-emitted set tells you exactly WHICH dependencies deadlocked, which is why build tools use it.", "cycle", -1, { hint: "un-emitted set = the culprits" });
        } else {
          add("All " + n + " nodes emitted, so the graph is acyclic and this order respects every edge. Several valid orders usually exist; the queue's tie-breaking picked one. Swap the queue for a min-heap and you get the lexicographically smallest order.", "done", -1, { hint: "V emitted ⇒ no cycle" });
        }
      }

      for (let i = 0; i < F.length; i++) yield F[i];
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;

      ctx.clearRect(0, 0, W, H);

      const padX = 26;
      const headerH = 46;
      const stripH = 28;
      const outH = 26;
      const bottomH = stripH + outH + 44;

      const gTop = headerH + 16;
      const gBot = H - bottomH;
      const gH = Math.max(60, gBot - gTop);
      const gW = W - padX * 2;
      const R = Math.max(9, Math.min(19, Math.min(gW / (S.layers * 2.7), gH / 8.5)));

      const nodes = S.nodes;
      function PX(i) { return padX + nodes[i].nx * gW; }
      function PY(i) { return gTop + nodes[i].ny * gH; }

      const isMarked = {};
      for (let i = 0; i < S.marked.length; i++) isMarked[S.marked[i]] = 1;
      const inQ = {};
      for (let i = 0; i < S.queue.length; i++) inQ[S.queue[i]] = 1;

      // ---- distance rings / topological layers -------------------------------
      if (S.showDist || S.showIndeg) {
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        for (let l = 1; l < S.layers; l++) {
          const x = padX + (l / S.layers) * gW;
          ctx.beginPath();
          ctx.moveTo(x, gTop - 8);
          ctx.lineTo(x, gTop + gH + 8);
          ctx.stroke();
        }
        ctx.setLineDash([]);
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.mono;
        ctx.textAlign = "center";
        for (let l = 0; l < S.layers; l++) {
          const x = padX + ((l + 0.5) / S.layers) * gW;
          ctx.fillText(S.showDist ? ("dist " + l) : ("layer " + l), x, gTop - 12);
        }
      }

      // ---- edges --------------------------------------------------------------
      const treeK = {};
      for (let i = 0; i < S.treeEdges.length; i++) treeK[S.treeEdges[i][0] + ">" + S.treeEdges[i][1]] = 1;
      const actA = S.activeEdge.length === 2 ? S.activeEdge[0] : -1;
      const actB = S.activeEdge.length === 2 ? S.activeEdge[1] : -1;

      for (let i = 0; i < S.edges.length; i++) {
        const u = S.edges[i][0], v = S.edges[i][1];
        let col = C.border, lw = 1.3, alpha = 1;
        if (treeK[u + ">" + v] || treeK[v + ">" + u]) { col = C.viz3; lw = 2; alpha = 0.85; }
        if (isMarked[u] && isMarked[v]) { col = C.viz8; lw = 2.2; alpha = 1; }
        const isAct = (u === actA && v === actB) || (!S.directed && u === actB && v === actA);
        if (isAct) { col = C.viz2; lw = 2.8; alpha = 1; }

        const x1 = PX(u), y1 = PY(u), x2 = PX(v), y2 = PY(v);
        const dx = x2 - x1, dy = y2 - y1;
        const len = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        const ux = dx / len, uy = dy / len;
        const ax = x1 + ux * (R + 1), ay = y1 + uy * (R + 1);
        const bx = x2 - ux * (R + 3), by = y2 - uy * (R + 3);

        ctx.globalAlpha = alpha;
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();

        if (S.directed) {
          const hs = 6;
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - ux * hs - uy * hs * 0.55, by - uy * hs + ux * hs * 0.55);
          ctx.lineTo(bx - ux * hs + uy * hs * 0.55, by - uy * hs - ux * hs * 0.55);
          ctx.closePath();
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }

      // ---- nodes ---------------------------------------------------------------
      for (let i = 0; i < nodes.length; i++) {
        const x = PX(i), y = PY(i);
        const isCur = i === S.current;
        let fill = C.surface2;
        if (isMarked[i]) fill = C.viz8;
        else if (isCur) fill = C.viz1;
        else if (S.status[i] === 2) fill = C.viz3;
        else if (S.status[i] === 1 || inQ[i]) fill = C.viz4;

        ctx.beginPath();
        ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = (fill === C.surface2) ? C.text2 : C.text;
        ctx.font = Math.round(R * 0.95) + "px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(nodes[i].name, x, y + 0.5);
        ctx.textBaseline = "alphabetic";

        // BFS: the distance label sits under the node
        if (S.showDist) {
          ctx.fillStyle = S.dist[i] >= 0 ? C.text2 : C.muted;
          ctx.font = "10px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.fillText(S.dist[i] >= 0 ? ("d=" + S.dist[i]) : "d=∞", x, y + R + 12);
        }

        // Topo: the in-degree counter badge
        if (S.showIndeg) {
          const bx = x + R * 0.85, by = y - R * 0.85;
          const br = Math.max(7, R * 0.5);
          const zero = S.indeg[i] === 0;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fillStyle = (zero && S.status[i] !== 2) ? C.viz4 : C.surface;
          ctx.fill();
          ctx.strokeStyle = (zero && S.status[i] !== 2) ? C.viz4 : C.border;
          ctx.lineWidth = 1.2;
          ctx.stroke();
          ctx.fillStyle = (zero && S.status[i] !== 2) ? C.text : C.text2;
          ctx.font = Math.round(br * 1.05) + "px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(S.indeg[i]), bx, by + 0.5);
          ctx.textBaseline = "alphabetic";
        }

        if (i === S.src && !S.directed) {
          ctx.fillStyle = C.viz7;
          ctx.font = "10px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.fillText("source", x, y - R - 6);
        }
      }

      // ---- frontier strip: the literal queue / recursion stack -----------------
      const stripY = H - (stripH + outH + 28);
      const isStack = S.queueKind === "stack";
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.base;
      ctx.fillText(isStack ? "recursion stack  (bottom → top)" : "queue  (front → back)", padX, stripY - 5);

      const cellW = 30, cellGap = 4;
      const maxCells = Math.max(1, Math.floor((W - padX * 2) / (cellW + cellGap)));
      const shown = Math.min(S.queue.length, maxCells);
      for (let i = 0; i < shown; i++) {
        const id = S.queue[i];
        const x = padX + i * (cellW + cellGap);
        ctx.fillStyle = C.viz4;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(x, stripY, cellW, stripH, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.text;
        ctx.font = "13px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText(nodes[id].name, x + cellW / 2, stripY + 19);
      }
      if (S.queue.length > shown) {
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.mono;
        ctx.textAlign = "left";
        ctx.fillText("+" + (S.queue.length - shown), padX + shown * (cellW + cellGap) + 2, stripY + 19);
      }
      if (S.queue.length === 0) {
        ctx.fillStyle = C.muted;
        ctx.font = "12px " + env.font.mono;
        ctx.textAlign = "left";
        ctx.fillText("(empty)", padX, stripY + 19);
      }

      // ---- output strip ---------------------------------------------------------
      const outY = H - outH - 6;
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.base;
      ctx.fillText(S.showIndeg ? "emitted order" : "visit order", padX, outY - 4);
      ctx.font = "13px " + env.font.mono;
      ctx.fillStyle = C.viz3;
      let ox = padX + 86;
      for (let i = 0; i < S.emitted.length; i++) {
        const t = nodes[S.emitted[i]].name;
        const w = ctx.measureText(t).width;
        if (ox + w > W - padX - 16) { ctx.fillStyle = C.muted; ctx.fillText("…", ox, outY + 11); break; }
        ctx.fillText(t, ox, outY + 11);
        ox += w + 8;
      }

      // ---- header + legend --------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText(S.mode + "   ·   " + S.emitted.length + " / " + S.n + " " + (S.showIndeg ? "emitted" : "visited") + "   ·   " + S.edges.length + " edges", padX, 20);
      ctx.fillStyle = C.text2;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText(S.hint || "", padX, 36);

      const legend = [];
      legend.push([C.viz1, "current"]);
      legend.push([C.viz4, isStack ? "on stack (grey)" : "in queue"]);
      legend.push([C.viz3, S.showIndeg ? "emitted" : "finished"]);
      if (S.marked.length > 0) legend.push([C.viz8, "stuck in a cycle"]);
      else legend.push([C.viz2, "edge examined"]);

      let lx = W - padX;
      ctx.font = "10px " + env.font.base;
      for (let i = legend.length - 1; i >= 0; i--) {
        const t = legend[i][1];
        const w = ctx.measureText(t).width;
        lx -= w;
        ctx.fillStyle = C.text2;
        ctx.textAlign = "left";
        ctx.fillText(t, lx, 20);
        lx -= 8;
        ctx.fillStyle = legend[i][0];
        ctx.beginPath();
        ctx.arc(lx, 16, 4, 0, Math.PI * 2);
        ctx.fill();
        lx -= 14;
      }
    }
  },

  drill: {
    cards: [
      { q: "Why does BFS give shortest paths on an unweighted graph?", a: "The queue holds nodes in non-decreasing distance, spanning at most two adjacent levels. So a node is first discovered from a node at the minimum possible distance — `dist[v] = dist[u] + 1` at discovery is final. Weighted edges break the argument; that is where Dijkstra starts.", tags: ["bfs", "shortest-path"] },
      { q: "When do you mark a node visited in BFS — on enqueue or on dequeue?", a: "On enqueue. Marking on dequeue lets the same node be enqueued several times before it is first popped, blowing up the queue and, with a counter, corrupting per-level counts.", tags: ["bfs", "pitfall"] },
      { q: "How do you detect a cycle in a DIRECTED graph with DFS?", a: "White/grey/black colouring. Grey means 'entered but not finished — currently on the recursion stack'. An edge into a grey node is a back edge and proves a cycle. An edge into a black node is harmless.", tags: ["cycles", "dfs"] },
      { q: "State Kahn's algorithm in three lines.", a: "Compute every node's in-degree; queue all zeros; repeatedly pop a node, append it to the output, decrement each neighbour's counter and enqueue that neighbour the moment its counter hits 0. O(V + E).", tags: ["topo-sort"] },
      { q: "What does a cycle do to Kahn's algorithm?", a: "Nodes on the cycle keep each other's in-degree above zero, so none is ever emitted. The queue empties early and `len(order) < V` — which is the cycle test. The un-emitted set is exactly the nodes on or downstream of the cycle.", tags: ["topo-sort", "cycles"] },
      { q: "How does DFS produce a topological order?", a: "Append each node to a list when it FINISHES (turns black), then reverse the list. A node finishes only after everything reachable from it has finished, so reversed finish order puts every node before its dependents.", tags: ["topo-sort", "dfs"] },
      { q: "Adjacency list vs adjacency matrix — pick one and justify it.", a: "List: O(V + E) space and O(V + E) traversal, the right default for sparse graphs. Matrix: O(V²) space with O(1) edge lookup but O(V) to list neighbours, so traversal degrades to O(V²) — only worth it for dense graphs or constant-time edge queries.", tags: ["representation"] },
      { q: "How do you test whether a graph is bipartite?", a: "BFS/DFS 2-colouring from every unvisited node: colour each newly discovered neighbour the opposite colour. Any already-coloured neighbour sharing your colour means an odd cycle, so it is not bipartite. O(V + E).", tags: ["bfs", "classic"] }
    ],
    sixtySecond: [
      "Explain why BFS finds shortest paths on unweighted graphs, state the queue invariant, and say exactly where the argument breaks once edges have weights.",
      "Explain cycle detection in directed versus undirected graphs, including what grey and black mean in the white/grey/black colouring.",
      "Explain Kahn's algorithm end to end, including what happens to it when the graph contains a cycle and why that is useful."
    ]
  }
};
