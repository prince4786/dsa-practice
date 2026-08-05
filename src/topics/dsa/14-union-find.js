// 14-union-find.js — disjoint-set union: forest, parent[] array, path compression.
// Exactly one statement: `export default { ... }`. No imports, no top-level consts.
// `frames` is a pure generator (rng only); node positions are computed here and
// carried in `state`. `draw` is pure, never calls rng, and reads every colour
// from `env.colors`.

export default {
  id: "union-find",
  track: "dsa",
  title: "Union-Find",
  difficulty: 2,
  minutes: 16,
  tags: ["disjoint-set", "amortised-analysis", "graphs", "kruskal"],

  explainer: [
    { type: "p", text: "Union-Find (disjoint-set union, DSU) maintains a partition of `n` elements under two operations: `find(x)` returns a canonical representative of x's set, and `union(x, y)` merges two sets. Two elements are connected exactly when their finds agree. That is the whole interface — everything interesting is in making it fast." },

    { type: "h3", text: "The representation" },
    { type: "p", text: "Each set is a tree stored in a single `parent[]` array; the root is the element that is its own parent. `find` walks up to the root, `union` links one root under another. Nothing about the tree's *shape* matters for correctness — only for cost. Which is why both optimisations are purely about shape." },

    { type: "h3", text: "Union by rank (or size) — why O(log n)" },
    { type: "p", text: "If you always hang the shorter tree under the taller one, the depth of the result is the depth of the taller tree — it does not grow. Depth only increases when you link two trees of *equal* rank, and in that case the resulting set is at least twice as large as either input. A set can double at most `log2(n)` times before it contains everything, so rank — and therefore depth — is bounded by `log2(n)`. That gives `O(log n)` per operation with no other tricks." },
    { type: "callout", tone: "tip", text: "Union by size (attach the smaller set under the bigger) gives the same O(log n) bound with an argument that is even easier to say: a node's depth increases only when its set at least doubles, so it can happen at most log2(n) times. Pick whichever you can defend fluently — interviewers accept both." },

    { type: "h3", text: "Path compression — why inverse Ackermann" },
    { type: "p", text: "During `find`, after you have located the root you already know the answer for every node you walked past, so re-point all of them directly at the root. The walk you just paid for is the last time anyone pays for that chain. Alone, compression gives `O(log n)` amortised; combined with union by rank the amortised cost per operation drops to `O(α(n))`, the inverse Ackermann function, which is at most 4 for any `n` that fits in the universe. Treat it as a constant — but say \"amortised near-constant\", not \"O(1)\"." },
    { type: "callout", tone: "warn", text: "Compression breaks the meaning of `rank`: after flattening, a root's rank can exceed its real height. That is deliberate and harmless — rank remains a valid *upper bound* on height, which is all the union decision needs, and recomputing true heights would cost more than it saves. This is the follow-up interviewers use to check you understand the invariant rather than the code." },

    { type: "h3", text: "Where it shows up" },
    { type: "list", items: [
      "**Kruskal's MST** — sort edges by weight, add an edge iff its endpoints are in different sets. DSU *is* the cycle test.",
      "**Connected components** / dynamic connectivity under edge *insertions*.",
      "**Grid flood problems** — number of islands as cells are added, percolation, 'last day the matrix is connected'.",
      "**Weighted / bipartite DSU** — store a parity or offset relative to the parent, maintained through compression, to answer 'are these two on opposite sides?' or 'what is x − y?'.",
      "**Equation satisfiability** and 'accounts merge'-style deduplication."
    ]},
    { type: "callout", tone: "pitfall", text: "DSU supports union, never split. If edges can be *deleted*, DSU alone cannot help: you either process everything offline in reverse (deletions become insertions), or reach for link-cut trees / Euler-tour trees for true dynamic connectivity. Say this out loud the moment deletions appear in the problem statement." },

    { type: "h3", text: "Write it iteratively" },
    { type: "code", lang: "python", code: "def find(x):\n    root = x\n    while parent[root] != root:\n        root = parent[root]\n    while parent[x] != root:          # second pass compresses\n        parent[x], x = root, parent[x]\n    return root" }
  ],

  complexity: {
    rows: [
      { operation: "find / union — no optimisation", time: "O(n) worst case", space: "O(n)", note: "a chain of unions builds a path" },
      { operation: "union by rank or size only", time: "O(log n) worst case", space: "O(n)", note: "depth only grows when the set doubles" },
      { operation: "path compression only", time: "O(log n) amortised", space: "O(n)", note: "each chain is paid for once" },
      { operation: "both together", time: "O(α(n)) amortised", space: "O(n)", note: "α(n) ≤ 4 in practice; not true O(1)" },
      { operation: "m operations on n elements", time: "O(m α(n))", space: "O(n)", note: "the bound you should quote" },
      { operation: "Kruskal's MST", time: "O(E log E)", space: "O(V)", note: "sorting dominates; DSU is the cheap part" },
      { operation: "DSU with rollback", time: "O(log n) per op", space: "O(n)", note: "union by size, NO compression, undo stack" }
    ]
  },

  interview: {
    whyAsked: "It is the standard test of amortised reasoning. Anyone can write twelve lines of DSU; the signal is whether you can explain why union by rank bounds depth by log n, why compression is amortised rather than worst-case, why rank stays correct after compression breaks it, and — most tellingly — whether you notice on your own that the structure cannot handle deletions.",
    followUps: [
      { q: "After path compression, rank is no longer the tree's height. Why is that acceptable?", a: "Rank is only ever used to decide which root to hang under, and for that a valid upper bound on height is enough — attaching a tree of rank r under one of rank ≥ r can never increase the taller tree's true height. Compression only makes trees shorter than their rank claims, so the bound stays sound. Recomputing exact heights would require touching whole subtrees on every compression, which would cost more than the sharper bound is worth." },
      { q: "Explain the two bounds separately: why log n from rank, and why α(n) with compression added.", a: "With union by rank, a tree's rank only increases when two equal-rank trees merge, and a rank-r tree contains at least 2^r nodes, so rank ≤ log2(n) and every find walks at most log2(n) edges. Adding compression means each expensive walk permanently shortens the paths it traversed, so the cost amortises: Tarjan's analysis assigns nodes to rank blocks and shows the total for m operations is Θ(m α(n)). α is the inverse Ackermann function and is below 5 for any n up to 2^65536, so it is constant for practical purposes but genuinely is not O(1)." },
      { q: "I need to undo unions — for example in an offline divide-and-conquer over time. How?", a: "Use union by size or rank with NO path compression, and push each modified (index, old value) pair onto an undo stack; rolling back is popping and restoring. Compression must be dropped because it makes an unbounded number of writes per find, which destroys both the undo bookkeeping and the amortised argument that assumed no rollbacks. Without compression each operation is a clean O(log n) worst case, which is exactly what offline dynamic connectivity needs." },
      { q: "How does Kruskal use DSU, and why isn't DSU the bottleneck?", a: "Sort the edges by weight, then scan them and add an edge to the MST only if `find(u) != find(v)` — the DSU is the cycle test, and the union commits the merge. Total cost is O(E log E) for the sort plus O(E α(V)) for the DSU, so sorting dominates. If the weights are small integers you can counting-sort them and the DSU term is what remains." },
      { q: "What if edges can be deleted as well as added?", a: "DSU cannot do it — trees can be merged but never split, and there is no cheap way to discover which nodes belonged to the removed edge's side. If the whole operation sequence is known in advance, process it offline: reverse time so deletions become insertions, or run offline dynamic connectivity with a segment tree over time plus rollback DSU in O(m log m log n). If it truly must be online, you need link-cut trees or Euler-tour trees." },
      { q: "Detect whether a graph is bipartite using DSU.", a: "Use a weighted (parity) DSU: alongside `parent[x]`, store `rel[x]`, the parity of the path from x to its parent, and accumulate it through both the find walk and the compression rewrite. An edge (u, v) demands opposite colours: if u and v are already in the same set and their parities to the root are equal, you have found an odd cycle and the graph is not bipartite. The same offset trick generalises to storing numeric differences, giving 'is x − y = d consistent?' queries." }
    ]
  },

  code: [
    { lang: "python", label: "Iterative DSU: union by rank + path compression", code: "class DSU:\n    def __init__(self, n):\n        self.parent = list(range(n))   # every element starts as its own root\n        self.rank = [0] * n            # UPPER BOUND on height, not the height\n        self.size = [1] * n\n        self.components = n\n\n    def find(self, x):\n        # Iterative on purpose: recursion blows the stack on a long chain,\n        # and the two-pass form is the clearest way to write compression.\n        root = x\n        while self.parent[root] != root:\n            root = self.parent[root]\n        while self.parent[x] != root:  # second pass: flatten what we walked\n            self.parent[x], x = root, self.parent[x]\n        return root\n\n    def union(self, a, b):\n        ra, rb = self.find(a), self.find(b)\n        if ra == rb:\n            return False               # already together -- this is the cycle test\n        # Hang the shorter tree under the taller one so depth cannot grow\n        # unless the ranks are equal, and equal ranks mean the set doubles.\n        if self.rank[ra] < self.rank[rb]:\n            ra, rb = rb, ra\n        self.parent[rb] = ra\n        self.size[ra] += self.size[rb]\n        if self.rank[ra] == self.rank[rb]:\n            self.rank[ra] += 1         # only place rank ever increases\n        self.components -= 1\n        return True\n\n    def connected(self, a, b):\n        return self.find(a) == self.find(b)" },

    { lang: "python", label: "Kruskal's MST", code: "def kruskal(n, edges):\n    \"\"\"edges = [(w, u, v)]. O(E log E) -- the sort dominates, not the DSU.\"\"\"\n    dsu = DSU(n)\n    total, tree = 0, []\n    for w, u, v in sorted(edges):\n        if dsu.union(u, v):            # False means u,v already connected\n            total += w                 # so adding this edge would make a cycle\n            tree.append((u, v, w))\n            if len(tree) == n - 1:     # spanning tree complete\n                break\n    return (total, tree) if len(tree) == n - 1 else (None, tree)  # None => disconnected" },

    { lang: "python", label: "Rollback DSU (union by size, NO compression)", code: "class RollbackDSU:\n    \"\"\"Compression is deliberately dropped: it writes an unbounded number of\n    cells per find, which cannot be undone cheaply. Union by size alone still\n    gives a clean O(log n) WORST case, which is what offline dynamic\n    connectivity (segment tree over time) needs.\"\"\"\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.size = [1] * n\n        self.history = []\n\n    def find(self, x):\n        while self.parent[x] != x:     # no compression: pure walk\n            x = self.parent[x]\n        return x\n\n    def union(self, a, b):\n        ra, rb = self.find(a), self.find(b)\n        if ra == rb:\n            self.history.append(None)  # record a no-op so undo stays balanced\n            return False\n        if self.size[ra] < self.size[rb]:\n            ra, rb = rb, ra\n        self.history.append((rb, ra, self.size[ra]))\n        self.parent[rb] = ra\n        self.size[ra] += self.size[rb]\n        return True\n\n    def undo(self):\n        rec = self.history.pop()\n        if rec is None:\n            return\n        child, root, old_size = rec\n        self.parent[child] = child\n        self.size[root] = old_size" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 400 },

    params: [
      { key: "n",    label: "Elements",   type: "int",  min: 8, max: 18, default: 14 },
      { key: "ops",  label: "Operations", type: "int",  min: 6, max: 24, default: 18 },
      { key: "mode", label: "Strategy",   type: "enum", options: ["naive", "by-rank", "rank+compression"], default: "rank+compression" },
      { key: "seed", label: "New ops",    type: "seed" }
    ],

    frames: function* (params, rng) {
      const P = params || {};
      const n = Math.max(8, Math.min(18, Math.round(Number(P.n) || 14)));
      const opCount = Math.max(6, Math.min(24, Math.round(Number(P.ops) || 18)));
      const mode = (P.mode === "naive" || P.mode === "by-rank") ? P.mode : "rank+compression";
      const compressOn = mode === "rank+compression";
      const rankOn = mode !== "naive";

      // Budget. Worst case: 24 ops x (1 announce + 2 x (5 walk + 1 compress)
      // + 1 link) = 336, plus the intro and summary frames.
      const MAXF = 390;      // layout.maxFrames is 400
      let fc = 0;

      const parent = [];
      const rank = [];
      const size = [];
      for (let i = 0; i < n; i++) { parent.push(i); rank.push(0); size.push(1); }

      // ---- deterministic forest layout, recomputed after every change --------
      const layout = function () {
        const children = [];
        for (let i = 0; i < n; i++) children.push([]);
        const roots = [];
        for (let i = 0; i < n; i++) {
          if (parent[i] === i) roots.push(i);
          else children[parent[i]].push(i);
        }
        const px = new Array(n).fill(0);
        const py = new Array(n).fill(0);
        let cursor = 0, maxDepth = 0;
        const dfs = function (u, d) {
          py[u] = d;
          if (d > maxDepth) maxDepth = d;
          if (children[u].length === 0) { px[u] = cursor; cursor += 1; return; }
          let acc = 0;
          for (let k = 0; k < children[u].length; k++) {
            dfs(children[u][k], d + 1);
            acc += px[children[u][k]];
          }
          px[u] = acc / children[u].length;
        };
        for (let k = 0; k < roots.length; k++) { dfs(roots[k], 0); cursor += 0.8; }
        const span = Math.max(1, cursor - 0.8) + 0.6;
        // Spread rows across the FULL available band regardless of how shallow
        // the forest currently is -- capping this at a minimum of 3 (as before)
        // left 2/3 of the canvas empty whenever the tree was flatter than that.
        const ds = Math.max(1, maxDepth);
        const pos = [];
        for (let i = 0; i < n; i++) pos.push({ x: (px[i] + 0.3) / span, y: py[i] / ds });
        return { pos: pos, roots: roots, maxDepth: maxDepth };
      };

      let curA = null, curB = null, opText = "", opIndex = 0, hops = 0, merges = 0;

      const depthOf = function (x) {
        let d = 0, u = x, k = 0;
        while (parent[u] !== u && k++ <= n) { u = parent[u]; d++; }
        return d;
      };
      const deepest = function () {
        let bd = -1, bi = 0;
        for (let i = 0; i < n; i++) { const d = depthOf(i); if (d > bd) { bd = d; bi = i; } }
        return bi;
      };
      let lastDeep = null;

      const snap = function (extra) {
        const L = layout();
        const base = {
          n: n, mode: mode,
          parent: parent.slice(), rank: rank.slice(), size: size.slice(),
          pos: L.pos.map(function (p) { return { x: p.x, y: p.y }; }),
          roots: L.roots.slice(), maxDepth: L.maxDepth,
          active: [], compressed: [], newEdge: null,
          opA: curA, opB: curB, opText: opText, opIndex: opIndex,
          hops: hops, merges: merges, components: L.roots.length,
          rankOn: rankOn, compressOn: compressOn
        };
        for (const k in extra) base[k] = extra[k];
        return base;
      };

      // ---- find, as a delegating sub-generator so it can yield -------------
      const walk = function* (x, who) {
        const chain = [x];
        let u = x;
        let shown = 0;
        while (parent[u] !== u) {
          const from = u;
          u = parent[u];
          chain.push(u);
          hops++;
          if (shown < 4 && fc <= MAXF - 8) {
            shown++;
            fc++;
            yield {
              label: "find(" + who + ") climbs: parent[" + from + "] = " + u +
                (parent[u] === u
                  ? ", and " + u + " is its own parent — that is the root, the set's canonical name."
                  : ", which is not a root, so keep climbing. Every hop here is real work."),
              phase: "find",
              focus: chain.slice(),
              state: snap({ active: chain.slice() })
            };
          }
        }
        if (chain.length - 1 > shown && fc <= MAXF - 8) {
          fc++;
          yield {
            label: "…and " + (chain.length - 1 - shown) + " more hops before the walk finally reaches root " + chain[chain.length - 1] +
              ". find(" + who + ") cost " + (chain.length - 1) + " pointer hops — an unbalanced tree makes every query pay for the shape of the whole set.",
            phase: "find",
            focus: chain.slice(),
            state: snap({ active: chain.slice() })
          };
        }
        if (chain.length === 1 && fc <= MAXF - 8) {
          fc++;
          yield {
            label: "find(" + who + ") is a single step: " + who + " is already its own parent, so it is the root of a set of size " + size[who] + ".",
            phase: "find",
            focus: [who],
            state: snap({ active: [who] })
          };
        }
        return chain;
      };

      const compress = function* (chain) {
        if (!compressOn || chain.length <= 2) return;
        const root = chain[chain.length - 1];
        const moved = [];
        for (let i = 0; i < chain.length - 1; i++) {
          if (parent[chain[i]] !== root) { parent[chain[i]] = root; moved.push(chain[i]); }
        }
        if (moved.length === 0 || fc > MAXF - 6) return;
        fc++;
        yield {
          label: "Path compression: we already know the answer for every node we walked past, so re-point " + moved.join(", ") +
            " straight at root " + root + ". The chain collapses to depth 1 — that walk is the last time anyone pays for it, which is why the cost amortises away.",
          phase: "compress",
          focus: chain.slice(),
          state: snap({ active: chain.slice(), compressed: moved.slice() })
        };
      };

      // ---- operation script ---------------------------------------------------
      // The script is built from the same rng draws in every mode, so the three
      // strategies are compared on identical input. It has two deliberate parts:
      //   * a SEQUENTIAL part (a third of the elements) — naive union turns it
      //     into a chain, union by rank turns the very same calls into a flat
      //     star. That is the depth contrast the enum is there to show.
      //   * a TOURNAMENT part (the rest) — equal ranks meet, so rank is forced
      //     upward and real depth appears even under the good strategy. That is
      //     what path compression then has something to flatten.
      // `find` targets are resolved at run time to whichever element is currently
      // deepest, so the walk is always the worst one the structure can offer.
      const perm = [];
      for (let i = 0; i < n; i++) perm.push(i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1)) % (i + 1);
        const tmp = perm[i]; perm[i] = perm[j]; perm[j] = tmp;
      }
      // Involve only as many elements as the operation budget can actually merge,
      // so the script always reaches its closing queries instead of being cut off
      // mid-tournament. Anything left over simply stays a singleton component.
      const act = Math.max(4, Math.min(n, opCount - 2));
      const used = perm.slice(0, act);
      const split = Math.max(3, Math.round(act / 3));
      const chainPart = used.slice(0, split);
      const tourPart = used.slice(split);

      const script = [];
      for (let i = 1; i < chainPart.length; i++) {
        script.push({ t: "union", x: chainPart[i - 1], y: chainPart[i] });
      }
      script.push({ t: "find", x: "deep" });

      let level = tourPart.map(function (e) { return [e]; });
      while (level.length > 1) {
        const next = [];
        for (let i = 0; i < level.length; i += 2) {
          if (i + 1 < level.length) {
            script.push({ t: "union", x: level[i][0], y: level[i + 1][0] });
            next.push(level[i].concat(level[i + 1]));
          } else {
            next.push(level[i]);
          }
        }
        level = next;
      }
      // The tournament runs without queries in between: in compression mode an
      // early find would flatten the tree before it has any depth to show.
      if (tourPart.length > 0) script.push({ t: "union", x: chainPart[0], y: tourPart[0] });
      script.push({ t: "find", x: "deep" });
      script.push({ t: "find", x: "again" });
      while (script.length < opCount + 2) script.push({ t: "find", x: "deep" });
      script.length = Math.max(3, opCount - 1);
      script.push({ t: "find", x: "deep" });

      fc++;
      yield {
        label: n + " singleton sets: parent[i] = i, so every element is its own root. " +
          (mode === "naive"
            ? "Naive mode hangs one root under the other with no regard for height — watch the trees get tall."
            : compressOn
              ? "Union by rank keeps trees shallow, and every find flattens the chain it walked."
              : "Union by rank keeps trees shallow, but nothing flattens them afterwards."),
        phase: "init",
        state: snap({})
      };

      for (let k = 0; k < script.length; k++) {
        if (fc > MAXF - 8) {
          fc++;
          yield {
            label: "Frame budget reached — lower the operation count to watch the whole sequence.",
            phase: "truncated",
            state: snap({})
          };
          return;
        }
        const op = script[k];
        opIndex = k + 1;

        if (op.t === "find") {
          const repeat = op.x === "again" && lastDeep !== null;
          const target = repeat ? lastDeep : (typeof op.x === "number" ? op.x : deepest());
          const before = depthOf(target);
          lastDeep = target;
          curA = target; curB = null;
          opText = "find(" + target + ")";
          fc++;
          yield {
            label: repeat
              ? "Operation " + opIndex + ": find(" + target + ") a second time. It is " + before + " hop" + (before === 1 ? "" : "s") + " from the root now — " +
                (compressOn
                  ? "the previous find re-pointed it straight at the root, and that saving is permanent."
                  : "nothing flattened it after the last walk, so we are about to pay for the very same chain again.")
              : "Operation " + opIndex + ": find(" + target + "), currently the deepest element in the forest at " + before + " hop" + (before === 1 ? "" : "s") +
                ". A find is only a walk up the parent pointers until a node is its own parent — so its cost is exactly the depth.",
            phase: "op",
            focus: [target],
            state: snap({ active: [target] })
          };
          const chain = yield* walk(target, String(target));
          yield* compress(chain);
          continue;
        }

        curA = op.x; curB = op.y;
        opText = "union(" + op.x + ", " + op.y + ")";
        fc++;
        yield {
          label: "Operation " + opIndex + ": union(" + op.x + ", " + op.y + "). Merging two sets means finding both roots first — you never link the arguments themselves, only their roots.",
          phase: "op",
          focus: [op.x, op.y],
          state: snap({ active: [op.x, op.y] })
        };

        const chainA = yield* walk(op.x, String(op.x));
        yield* compress(chainA);
        const ra = chainA[chainA.length - 1];

        const chainB = yield* walk(op.y, String(op.y));
        yield* compress(chainB);
        const rb = chainB[chainB.length - 1];

        if (ra === rb) {
          fc++;
          yield {
            label: "Both finds returned root " + ra + ": " + op.x + " and " + op.y + " are already in the same set, so union does nothing. This exact test is how Kruskal rejects an edge that would close a cycle.",
            phase: "noop",
            focus: [ra],
            state: snap({ active: [ra] })
          };
          continue;
        }

        let child, par, why;
        if (!rankOn) {
          child = ra; par = rb;
          parent[child] = par;
          size[par] += size[child];
          why = "Naive union hangs root " + child + " under root " + par + " with no regard for height. Repeat that and you build a path: find degrades to O(n).";
        } else {
          if (rank[ra] < rank[rb]) { child = ra; par = rb; }
          else if (rank[ra] > rank[rb]) { child = rb; par = ra; }
          else { child = rb; par = ra; }
          const tie = rank[ra] === rank[rb];
          parent[child] = par;
          size[par] += size[child];
          if (tie) rank[par] += 1;
          why = tie
            ? "Ranks tie at " + (rank[par] - 1) + ", so the depth has to grow: rank[" + par + "] becomes " + rank[par] + ". But a tie means the merged set is at least twice the size of either half, and a set can only double log2(" + n + ") times — that is the whole O(log n) argument."
            : "Rank " + rank[child] + " goes under rank " + rank[par] + ": the shorter tree hangs off the taller one, so the taller tree's depth does not change at all. Depth only ever grows on a tie.";
        }
        merges++;

        fc++;
        yield {
          label: "Link: parent[" + child + "] = " + par + ". " + why,
          phase: "union",
          focus: [child, par],
          state: snap({ active: [child, par], newEdge: [child, par] })
        };
      }

      const L = layout();
      curA = null; curB = null; opText = "";
      fc++;
      yield {
        label: mode + ": " + merges + " merges left " + L.roots.length + " component" + (L.roots.length === 1 ? "" : "s") +
          ", deepest tree = " + L.maxDepth + ", and the finds cost " + hops + " pointer hops in total. " +
          (mode === "naive"
            ? "Switch to by-rank on the same seed: identical merges, shallower trees, fewer hops."
            : compressOn
              ? "Compression makes almost every node a direct child of its root, so future finds are one hop — O(α(n)) amortised, where α(n) ≤ 4 for any real n."
              : "Rank alone bounds the depth by log2(" + n + "); add compression and the same script gets flatter still."),
        phase: "done",
        state: snap({})
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors;
      const W = env.width, H = env.height;
      const s = frame.state;
      const n = s.n;

      ctx.clearRect(0, 0, W, H);

      const padX = 16;
      const headH = 54;
      const arrH = s.rankOn ? Math.min(130, Math.max(76, H * 0.16)) : Math.min(108, Math.max(60, H * 0.13));
      const bandTop = headH;
      const bandH = Math.max(40, H - headH - arrH - 8);

      // Radius grows with the canvas on both axes: bounded by how many nodes
      // must fit side by side, AND by how many tree levels must fit top to
      // bottom, so a shallow-but-wide or deep-but-narrow forest both fill up
      // rather than leaving the node circles pinned to their old small size.
      const rows = Math.max(1, (s.maxDepth || 0) + 1);
      const R = Math.max(10, Math.min(42, (W - 2 * padX) / (n * 2.2), bandH / (rows * 2.6)));
      const nx = function (i) { return padX + R + s.pos[i].x * Math.max(1, W - 2 * padX - 2 * R); };
      const ny = function (i) { return bandTop + R + 6 + s.pos[i].y * Math.max(1, bandH - 2 * R - 12); };

      const has = function (arr, v) {
        for (let i = 0; i < arr.length; i++) if (arr[i] === v) return true;
        return false;
      };

      // ---- edges (child -> parent) -------------------------------------------
      for (let i = 0; i < n; i++) {
        const p = s.parent[i];
        if (p === i) continue;
        const x0 = nx(i), y0 = ny(i), x1 = nx(p), y1 = ny(p);
        const isNew = s.newEdge && s.newEdge[0] === i && s.newEdge[1] === p;
        const isComp = has(s.compressed, i);
        ctx.strokeStyle = (isNew || isComp) ? C.viz6 : (has(s.active, i) ? C.viz1 : C.axis);
        ctx.lineWidth = (isNew || isComp) ? 2.6 : (has(s.active, i) ? 2 : 1.2);
        ctx.globalAlpha = (isNew || isComp || has(s.active, i)) ? 1 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.stroke();
        // arrowhead at the parent end
        const dx = x1 - x0, dy = y1 - y0;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len, uy = dy / len;
        const bx = x1 - ux * (R + 1), by = y1 - uy * (R + 1);
        ctx.fillStyle = ctx.strokeStyle;
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.lineTo(bx - ux * 7 - uy * 4, by - uy * 7 + ux * 4);
        ctx.lineTo(bx - ux * 7 + uy * 4, by - uy * 7 - ux * 4);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ---- nodes ---------------------------------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < n; i++) {
        const x = nx(i), y = ny(i);
        const isRoot = s.parent[i] === i;
        const isOperand = i === s.opA || i === s.opB;
        const isActive = has(s.active, i);
        const isComp = has(s.compressed, i);

        let fill = C.surface2;
        if (isComp) fill = C.viz6;
        else if (isActive) fill = C.viz1;
        else if (isOperand) fill = C.viz2;
        else if (isRoot) fill = C.viz7;

        ctx.fillStyle = fill;
        ctx.globalAlpha = (isComp || isActive || isOperand || isRoot) ? 1 : 0.85;
        ctx.beginPath();
        ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = isRoot ? C.viz7 : C.border;
        ctx.lineWidth = isRoot ? 2 : 1;
        ctx.beginPath();
        ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = C.text;
        ctx.font = Math.max(9, Math.round(R * 0.9)) + "px " + env.font.mono;
        ctx.fillText(String(i), x, y + 0.5);

        if (isRoot && s.rankOn && R > 10) {
          ctx.fillStyle = C.muted;
          ctx.font = "9px " + env.font.mono;
          ctx.fillText("r" + s.rank[i], x, y - R - 6);
        }
      }

      // ---- header ----------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText(s.mode + (s.opText ? "   —   " + s.opText : ""), padX, 18);

      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText("components " + s.components + "   deepest " + s.maxDepth + "   find hops " + s.hops + "   merges " + s.merges, padX, 34);

      const legend = [
        [C.viz7, "root"],
        [C.viz1, "find walk"],
        [C.viz2, "operand"],
        [C.viz6, "new / compressed"]
      ];
      let lx = padX;
      ctx.font = "10px " + env.font.base;
      for (let i = 0; i < legend.length; i++) {
        ctx.fillStyle = legend[i][0];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.arc(lx + 4, 45, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.muted;
        ctx.fillText(legend[i][1], lx + 12, 48);
        lx += 14 + ctx.measureText(legend[i][1]).width + 10;
      }

      // ---- parent[] array strip ----------------------------------------------------
      const ay = H - arrH + 12;
      const arrScale = Math.max(1, Math.min(1.7, arrH / (s.rankOn ? 76 : 60)));
      ctx.fillStyle = C.text2;
      ctx.font = Math.round(11 * arrScale) + "px " + env.font.base;
      ctx.fillText("parent[]", padX, ay - 2);

      const cellH2 = 24 * arrScale;
      const bw = Math.min(60 * arrScale, (W - 2 * padX) / n);
      for (let i = 0; i < n; i++) {
        const x = padX + i * bw;
        const isRoot = s.parent[i] === i;
        const isComp = has(s.compressed, i);
        const isActive = has(s.active, i);

        let fill = C.surface2;
        if (isComp) fill = C.viz6;
        else if (isActive) fill = C.viz1;
        else if (isRoot) fill = C.viz7;

        ctx.fillStyle = fill;
        ctx.globalAlpha = (isComp || isActive || isRoot) ? 0.95 : 0.85;
        ctx.beginPath();
        ctx.roundRect(x + 1, ay + 4, Math.max(2, bw - 3), cellH2, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x + 1, ay + 4, Math.max(2, bw - 3), cellH2, 3);
        ctx.stroke();

        if (bw > 16) {
          ctx.textAlign = "center";
          ctx.fillStyle = C.text;
          ctx.font = Math.round(11 * arrScale) + "px " + env.font.mono;
          ctx.fillText(String(s.parent[i]), x + bw / 2, ay + 4 + cellH2 * 0.67);
          ctx.fillStyle = C.muted;
          ctx.font = Math.round(9 * arrScale) + "px " + env.font.mono;
          ctx.fillText(String(i), x + bw / 2, ay + 4 + cellH2 + Math.round(11 * arrScale));
          if (s.rankOn) {
            ctx.fillStyle = C.muted;
            ctx.fillText("r" + s.rank[i], x + bw / 2, ay + 4 + cellH2 + Math.round(11 * arrScale) * 2 + 2);
          }
          ctx.textAlign = "left";
        }
      }
    }
  },

  drill: {
    cards: [
      { q: "Why does union by rank bound the tree depth by log2(n)?", a: "Depth only grows when two trees of equal rank merge, and a rank-r tree holds at least 2^r nodes. Since a set can double at most log2(n) times, rank — and therefore depth — never exceeds log2(n).", tags: ["analysis"] },
      { q: "What does path compression do, and what is the combined bound?", a: "After a find locates the root, it re-points every node on the walked path directly at the root. Combined with union by rank, m operations cost O(m α(n)) amortised, where α is the inverse Ackermann function (≤ 4 in practice). Not O(1).", tags: ["analysis", "compression"] },
      { q: "Compression breaks `rank` as a height measure. Why is that fine?", a: "Rank is only used to pick which root to hang under, and an upper bound on height is sufficient for that decision. Compression only makes trees shorter than their rank suggests, so the bound stays valid and no correctness argument breaks.", tags: ["invariant"] },
      { q: "Write `find` iteratively and say why.", a: "Walk to the root, then walk again re-pointing each node at the root: `while parent[x] != root: parent[x], x = root, parent[x]`. Iterative avoids blowing the recursion stack on a long chain, which is exactly the case compression is meant to fix.", tags: ["implementation"] },
      { q: "How does Kruskal's algorithm use DSU?", a: "Sort edges by weight and add an edge only if `find(u) != find(v)`; the DSU is the cycle test and `union` commits the merge. O(E log E) overall — the sort dominates the O(E α(V)) DSU work.", tags: ["applications"] },
      { q: "You need to undo unions. What must you give up?", a: "Path compression. Use union by size with an undo stack of (index, old value) pairs; compression makes an unbounded number of writes per find, which cannot be rolled back cheaply. Without it each operation is a clean O(log n) worst case.", tags: ["variants", "rollback"] },
      { q: "Edges can be deleted. Can DSU handle it?", a: "No — sets merge but never split. Either process offline in reverse so deletions become insertions, or use a segment tree over time with rollback DSU (O(m log m log n)); true online dynamic connectivity needs link-cut or Euler-tour trees.", tags: ["limits"] },
      { q: "How do you answer 'are u and v on opposite sides?' with DSU?", a: "Weighted/parity DSU: store `rel[x]`, the parity of the path from x to its parent, and update it during both the find walk and the compression rewrite. Same set with equal parity on an edge means an odd cycle, so the graph is not bipartite.", tags: ["variants"] }
    ],
    sixtySecond: [
      "Explain union by rank and path compression, and give the complexity each one buys separately and together.",
      "Explain why rank is still a correct decision variable after path compression has broken it as a height measure.",
      "Explain what Union-Find cannot do, and what you reach for when edges are deleted rather than added."
    ]
  }
};
