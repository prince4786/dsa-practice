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
    { type: "p", text: "Union-Find — also called disjoint-set union, or DSU for short — is a data structure for keeping track of groups of things that can merge together over time, and quickly answering the question 'are these two things currently in the same group?' Picture a big party where people start out as complete strangers, and every so often two people discover they know each other and their entire friend circles merge into one bigger circle. Union-Find is the tool for efficiently tracking, at any point during the party, which giant friend circle any given person currently belongs to, and for merging two circles together the instant a new connection is discovered — without ever having to recheck every single person in the room." },
    { type: "p", text: "Formally, Union-Find maintains a partition — a way of dividing a fixed collection of `n` elements into non-overlapping groups — under two operations. `find(x)` returns a canonical representative of the group `x` currently belongs to — think of this representative as that group's 'official name' or 'leader', a single stand-in element used to identify the whole group. `union(x, y)` merges the group containing `x` with the group containing `y` into one single group. Two elements are considered connected — in the same group — exactly when calling `find` on both of them returns the same representative. That's the entire interface these two operations provide; everything interesting about this topic is in how you make both operations run fast." },

    { type: "h3", text: "The representation" },
    { type: "p", text: "Each group is stored as a tree — but not the kind of tree with fixed branching you might picture; here, a tree just means a hierarchy of parent-pointers. There's a single array called `parent[]`, where `parent[x]` tells you the element that `x` currently points to as its parent, and the root of a tree — the element that has no parent above it — is simply the element that is its own parent, i.e. `parent[x] == x`. The operation `find` walks up this chain of parent-pointers starting from `x` until it reaches a root, and that root is `x`'s representative. The operation `union` links one entire tree underneath the root of another tree, merging them into one. Here is the key insight that everything else in this lesson builds on: nothing about the *shape* of these trees — how tall or how wide they are — matters for whether the algorithm gives correct answers. Shape only matters for how *fast* the algorithm runs. That's exactly why both of the optimisations below are entirely about controlling tree shape, and nothing else." },

    { type: "h3", text: "Union by rank (or size) — why O(log n)" },
    { type: "p", text: "Here's the core idea: if, every time you merge two trees, you always attach the shorter tree underneath the root of the taller tree, then the height of the resulting merged tree is simply the height of whichever tree was already taller — merging never makes the tallest tree in the structure any taller. The height of a tree can only increase in one specific situation: when you merge two trees that happen to have exactly equal rank (rank is a number — cheaper to maintain than the tree's exact real height — that serves as an upper-bound estimate of a tree's height). And critically, whenever two equal-rank trees merge, the resulting combined set is guaranteed to be at least twice as large as either of the two trees that went into it. A set can only double in size a limited number of times — at most `log2(n)` times, meaning 'the number of times you can double 1 before reaching n' — before it would have to contain every single element there is. So rank, and therefore tree depth, can never exceed `log2(n)`. That single fact is the entire proof behind why this technique gives `O(log n)` — logarithmic — time per operation, with no other tricks required." },
    { type: "callout", tone: "tip", text: "There's a close variant called union by size, where instead of tracking an abstract 'rank' number, you attach whichever tree currently has fewer total elements underneath the root of the tree with more elements. It gives you the exact same O(log n) bound, and honestly the argument for it is even easier to say out loud: a node's depth only ever increases when the set it belongs to at least doubles in size, and a set can only double at most log2(n) times before running out of elements to add. Pick whichever version — rank or size — you personally find easier to explain fluently; interviewers accept either one." },

    { type: "h3", text: "Path compression — why inverse Ackermann" },
    { type: "p", text: "Here's the second optimisation, and it targets a completely different inefficiency. During a call to `find`, once you've actually walked all the way up to the root and found the answer, you now know — for free — the correct root for every single node you passed through along the way. So instead of leaving those intermediate nodes pointing at their old, possibly-far-away parents, you re-point every one of them directly at the root you just found. This means that walk you just paid for is the very last time anyone will ever have to pay for climbing that particular chain again — the next `find` on any of those nodes is now a single step. Path compression by itself, with no other optimisation, already brings the amortised cost (a cost measured by averaging it out over a long sequence of operations, rather than measuring any single operation in isolation) down to `O(log n)`. But when you combine it with union by rank, the amortised cost per operation drops all the way down to `O(α(n))`, where `α` (the Greek letter alpha) stands for the inverse Ackermann function — a function that grows so absurdly slowly that its value is at most 4 for any input size `n` you could possibly encounter, even ones larger than the number of atoms in the observable universe. In practice you can treat this as a constant amount of work, but be precise in how you phrase it: say 'amortised near-constant', not 'O(1)', since it is not, technically, a true constant." },
    { type: "callout", tone: "warn", text: "There's a subtlety worth naming out loud: path compression actually breaks the literal meaning of `rank`. After a chain of nodes gets flattened by compression, a root's stored rank value can end up larger than that tree's actual, true height — the rank number is now stale, an overestimate. This is completely deliberate and totally harmless: rank was only ever being used as an upper bound on height to help decide which tree to attach underneath which, and that decision only needs a valid upper bound — it doesn't need the exact true height. Compression can only ever make trees shorter than their stored rank claims, never taller, so the upper-bound property stays valid throughout. Recomputing the exact, true height after every compression would cost far more than the sharper number would ever save you. This exact question — why is a stale rank still safe to use — is a favourite follow-up interviewers ask, to check whether you actually understand the underlying invariant (the fact that stays true) rather than having just memorised the code." },

    { type: "h3", text: "Where it shows up" },
    { type: "list", items: [
      "**Kruskal's algorithm for building a minimum spanning tree** (MST — a tree connecting every node in a graph using the lowest possible total edge weight): sort every edge by its weight from cheapest to most expensive, then walk through them in that order and add an edge to the tree if and only if its two endpoints are currently in different Union-Find groups. Union-Find *is* the mechanism that checks for cycles here — if the two endpoints are already in the same group, adding this edge would create a loop, so you skip it.",
      "**Tracking connected components** — groups of nodes that are all reachable from one another — as new edges get added one at a time to a graph over time (this is sometimes called dynamic connectivity under insertions).",
      "**Grid flood-fill style problems** — for example, counting the number of separate 'islands' as land cells get added to a grid one at a time, simulating percolation (whether a substance can flow all the way through a random grid), or finding the last day on which a matrix is still fully connected.",
      "**Weighted or bipartite Union-Find** — a fancier version where, alongside each node's parent pointer, you also store a parity (whether a value is even or odd) or a numeric offset relative to that node's parent, and you carefully keep that value correct even as path compression rewrites the pointers. This lets you answer questions like 'are these two elements definitely on opposite sides of some divide?' or 'what is the numeric difference between these two elements?'",
      "**Checking whether a set of equations is internally consistent**, and deduplication problems like 'accounts merge' — where you're given many partial pieces of information that some things are equivalent to each other, and you need to group everything into consistent equivalence classes."
    ]},
    { type: "callout", tone: "pitfall", text: "One hard limitation to say out loud the moment it comes up: Union-Find only supports merging groups together — it can never split a group back apart. If the problem allows edges to be deleted, not just added, plain Union-Find cannot help you directly. Your two options are: process the entire sequence of operations offline (meaning: you're given the whole sequence in advance, not one operation at a time, so you can look ahead) and replay it in reverse order, which cleverly turns every deletion into an insertion; or reach for a fundamentally different, more powerful data structure built for this — link-cut trees or Euler-tour trees — which support true dynamic connectivity, meaning they handle edge deletions directly, at additional implementation cost. Naming this limitation out loud the instant deletions appear in a problem statement is exactly the kind of signal that separates a candidate who understands the tool's boundaries from one who is just pattern-matching." },

    { type: "h3", text: "Write it iteratively" },
    { type: "p", text: "Here is `find` written out, combining both optimisations: it walks up to the root once, then walks the same path a second time, re-pointing every node it passes directly at that root." },
    { type: "code", lang: "python", code: "def find(x):\n    root = x\n    while parent[root] != root:\n        root = parent[root]\n    while parent[x] != root:          # second pass compresses\n        parent[x], x = root, parent[x]\n    return root" }
  ],

  glossary: [
    { term: "Union-Find / disjoint-set union (DSU)", plain: "A data structure that tracks a collection of items split into non-overlapping groups, letting you quickly check whether two items are in the same group and quickly merge two groups together." },
    { term: "Partition", plain: "A way of splitting a fixed collection of items into groups where every item belongs to exactly one group, with no overlaps." },
    { term: "find(x)", plain: "The operation that returns a single stand-in element representing whichever group x currently belongs to." },
    { term: "union(x, y)", plain: "The operation that merges the group containing x and the group containing y into one combined group." },
    { term: "Representative / root", plain: "The single designated element used as the 'official name' of a group — the element that is its own parent in the parent-pointer tree." },
    { term: "parent[] array", plain: "The underlying storage: an array where each element points to its parent, forming chains that lead up to each group's representative." },
    { term: "Union by rank", plain: "A rule that always attaches the shorter tree underneath the root of the taller tree when merging, which keeps trees from growing needlessly tall." },
    { term: "Union by size", plain: "A close variant of union by rank that attaches the tree with fewer total elements underneath the tree with more elements, giving the same speed guarantee." },
    { term: "Path compression", plain: "After walking up to a group's root to answer a query, re-pointing every node passed along the way directly at that root, so future queries on those nodes are instant." },
    { term: "Amortised", plain: "A cost measured by averaging it out over a long sequence of operations, rather than judging any single operation on its own — a technique can be amortised-fast even if a few individual steps are slow." },
    { term: "Inverse Ackermann function (α)", plain: "A function that grows unbelievably slowly — so slowly that for any input size that could realistically occur, its value never exceeds about 4, making it effectively constant in practice." },
    { term: "Invariant", plain: "A fact or condition that stays true after every single step of an algorithm, which is what lets you trust that the final answer is correct." },
    { term: "Kruskal's algorithm / MST", plain: "An algorithm for building a minimum spanning tree — the cheapest possible set of connections that links every node in a graph together — by adding edges from cheapest to most expensive and skipping any edge that would create a cycle." },
    { term: "Dynamic connectivity", plain: "The problem of tracking which nodes are connected to each other in a graph as edges are added (and sometimes removed) over time, rather than in one fixed, unchanging graph." }
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
