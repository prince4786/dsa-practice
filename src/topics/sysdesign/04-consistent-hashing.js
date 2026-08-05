export default {
  id: "consistent-hashing",
  track: "sysdesign",
  title: "Consistent Hashing",
  difficulty: 2,
  minutes: 16,
  tags: ["sharding", "hashing", "rebalancing", "virtual-nodes"],

  explainer: [
    { type: "p", text: "Imagine you have a set of servers (call them \"shards\" or \"nodes\") and you want every request for a given key — say, a user id — to always land on the same server, so you can find its data again later. The obvious way to do this is `shard = hash(key) % N` — run the key through a hash function (which turns any input into a well-spread-out number) and take the remainder when divided by the number of servers, N. It's correct, spreads keys evenly, and is one line of code. It has exactly one problem, and that problem is fatal: **the moment N changes — you add or remove even a single server — almost every key's answer to \"which server owns me?\" changes too.** Going from 4 servers to 5 relocates roughly `1 − 1/5 = 80%` of all your data. For a cache, that's an instant, total cold start — everything looks like a miss. For a database, that's a migration that could take hours, and you cannot casually do that at 3am in the middle of an outage." },

    { type: "h3", text: "The ring — a smarter way to assign keys to servers" },
    { type: "p", text: "Instead of using modulo arithmetic, imagine both the servers and the keys plotted as points around the edge of a circle — a \"hash ring\" — where the circle represents every possible hash value from 0 up to some very large number (2³²−1, say) and then wraps back around to 0. Each key belongs to whichever server's point is the **first one you hit going clockwise** from the key's own position on the circle. Now, when you add a new server, it inserts exactly one new point onto that circle — and it only steals the small arc of keys between itself and the server that was previously its counter-clockwise neighbor. Every other key on the ring is completely unaffected and stays exactly where it was." },
    { type: "p", text: "The mathematical guarantee this buys you: adding the Nth server moves roughly **K/N keys** on average (where K is the total number of keys) — not `K × (N−1)/N` like the modulo approach. Going from nine servers to ten moves only about 10% of your keys, and that movement comes entirely from one neighboring server on the ring, not from a global reshuffle." },

    { type: "h3", text: "Why virtual nodes are not an optional nice-to-have" },
    { type: "p", text: "If each physical server gets exactly one point on the ring, the arcs between points end up wildly uneven purely by chance — with 10 servers, the biggest arc (and therefore the biggest shard) is typically about 3 times the size of the smallest one. Worse, when a server is removed, its *entire* arc gets dumped onto whichever single server happens to be its clockwise neighbor, rather than being spread out. The fix is to give each physical server many points on the ring instead of just one — these are called **virtual nodes**, typically 100 to 256 per physical server. With enough virtual nodes, the many small arcs owned by each server average out, and the unevenness (measured as standard deviation of load) shrinks proportionally to `1/√V`, where V is the number of virtual nodes per server. At V=100, you land within a few percent of perfectly even, and when a server leaves, its load gets spread across roughly V different successors instead of dumped on just one." },
    { type: "list", items: [
      "Virtual nodes also give you **weighted capacity for free**: a beefier machine with twice the RAM can simply be assigned twice as many virtual nodes/tokens, and it will naturally receive roughly twice the share of keys — no special-casing required.",
      "The cost is memory and lookup time: the ring now holds `N × V` entries total, so finding which node owns a key means a binary search over that sorted list of token positions, which is `O(log(N·V))` — logarithmic, and cheap even at scale.",
      "This exact technique (a ring plus virtual nodes) is used by Dynamo (Amazon's internal key-value store), Cassandra, Riak, and most memcached client libraries."
    ]},

    { type: "h3", text: "Bounded loads and the alternatives to a plain ring" },
    { type: "list", items: [
      "**Consistent hashing with bounded loads** — before actually placing a key on the node the ring says it belongs to, check whether that node's current load is above `c × average` (c is usually around 1.25); if it's too loaded, keep walking clockwise to the next node instead. This caps how badly one unlucky, oversized arc can hurt a single server. Used in production by HAProxy (a popular open-source load balancer) and Vimeo's CDN balancer.",
      "**Rendezvous hashing (also called HRW — Highest Random Weight)** — for each key, compute a hash combining that key with every candidate node's id, and pick whichever node produces the highest resulting value. This gives you the same minimal-disruption property as a ring, needs no ring data structure at all, and handles weighted nodes trivially — its downside is that a lookup costs `O(N)` (you must check every node), which is fine for a small number of nodes but doesn't scale to thousands.",
      "**Jump consistent hash** — a famously tiny algorithm (about 5 lines of code), uses zero extra memory, gives perfectly even balance, and runs in `O(ln N)` time. The catch: it requires buckets to be numbered `0…N−1` in order, and you can only ever remove the *last* bucket in that numbering — it works beautifully for elastically growing or shrinking a shard count, but not for handling an arbitrary node failing in the middle of the list.",
      "**A fixed shard count with a lookup table** — pre-split your data into, say, 4,096 fixed logical shards up front, route keys into those shards with simple modulo arithmetic (which never needs to change, since the shard count is fixed forever), and then maintain a separate, editable mapping from logical shard to physical machine. This is the industry's boring but excellent default answer: rebalancing becomes a simple metadata edit rather than a property that emerges from a hash function. This is exactly how Vitess, Citus, Kafka's topic partitions, and Redis Cluster's 16,384 hash slots all work."
    ]},

    { type: "callout", tone: "pitfall", text: "Consistent hashing balances the *key space* — it says nothing about *how much traffic* any particular key generates. One extremely popular (\"celebrity\") key still overwhelms exactly one node no matter how good your ring is, because that key is still just one point that lands on one node. That's a genuinely different problem with a different fix — see the hot-keys lesson." },

    { type: "callout", tone: "tip", text: "The interview-winning line: \"I'd pre-shard into a few thousand logical partitions and keep an explicit partition-to-node map, rather than hashing straight onto physical machines. Consistent hashing solves the resharding problem elegantly, but a partition map turns rebalancing into an atomic metadata edit, and it also lets me move individual partitions around by hand to fix hotspots.\"" },

    { type: "h3", text: "What still hurts even with a ring" },
    { type: "p", text: "Even the small amount of key movement a ring causes is not free. During a rebalance, the keys that are moving briefly have two plausible owners at once — the old node and the new one. You need either a window where both are read and reconciled, or a hand-off protocol where the new owner streams the data from the old owner and only officially takes ownership once that transfer finishes. Cache clusters can usually get away with simply accepting a few extra cache misses during this window; databases generally cannot afford to, and need the explicit hand-off protocol instead." }
  ],

  glossary: [
    { term: "Hash function", plain: "A function that takes any input (like a key or string) and turns it into a number that looks essentially random but is always the same for the same input, and tends to spread different inputs out evenly." },
    { term: "Shard / node", plain: "One individual server (or database partition) that owns and stores a subset of the overall data." },
    { term: "Hash ring", plain: "A way of visualizing consistent hashing: both servers and keys are placed as points around a circle of possible hash values, and each key belongs to the first server found going clockwise from it." },
    { term: "Virtual nodes (vnodes / tokens)", plain: "Giving each physical server many points on the hash ring instead of just one, so that the arcs of keys it owns are smaller and more evenly spread out — this fixes both load balance and how gracefully the ring handles a server leaving." },
    { term: "Rendezvous hashing (HRW)", plain: "An alternative to a ring: for each key, hash it together with every candidate server and pick whichever server produces the highest value. No ring data structure needed, but checking every server makes it slower for large numbers of servers." },
    { term: "Jump consistent hash", plain: "A very small, memory-free algorithm for mapping keys to numbered buckets with perfect balance. Its limitation is that buckets can only be removed from the end of the list, so it fits growing/shrinking shard counts better than arbitrary node failures." },
    { term: "Partition map (shard-to-node map)", plain: "A table that explicitly records which physical machine currently owns each of a fixed number of logical partitions or shards, so that moving data around is just an edit to this table rather than something that falls out of a hash function." },
    { term: "O(log n) / O(1) notation", plain: "A shorthand for how an operation's cost grows as the amount of data (n) grows. O(1) means constant time regardless of size; O(log n) means the cost grows very slowly, roughly proportional to the number of digits in n." },
    { term: "Consistent hashing with bounded loads", plain: "A variant of ring-based hashing that refuses to overload any single node past a set multiple of the average load, instead passing the key along to the next node on the ring." }
  ],

  complexity: {
    rows: [
      { operation: "mod-N lookup", time: "O(1)", space: "O(1)", note: "and O(K·(N−1)/N) keys moved on resize" },
      { operation: "Ring lookup", time: "O(log(N·V))", space: "O(N·V)", note: "binary search over sorted tokens" },
      { operation: "Keys moved, add 1 node", time: "K/(N+1) expected", space: "—", note: "the entire point of the ring" },
      { operation: "Load imbalance", time: "±O(1/√V)", space: "—", note: "V = virtual nodes per physical node" },
      { operation: "Rendezvous (HRW)", time: "O(N) per key", space: "O(N)", note: "same movement guarantee, weights are trivial" },
      { operation: "Jump hash", time: "O(ln N)", space: "O(1)", note: "perfect balance, only removes the last bucket" }
    ]
  },

  interview: {
    whyAsked: "It is the sharpest test of whether a candidate reasons about *change* rather than steady state. Anyone can shard with mod-N; the signal is noticing that resizing is the actual requirement, quantifying the difference, and then knowing that virtual nodes (or a partition map) are what make it work in practice.",
    followUps: [
      { q: "Exactly how many keys move when you add a node under mod-N vs a ring?", a: "Under `hash % N`, going from N to N+1 keeps a key only if `h mod N == h mod (N+1)`, which happens with probability ~1/(N+1) — so roughly `N/(N+1)` of all keys move: 80% going 4→5, 90% going 9→10. On a ring, the new node's tokens claim only the arcs immediately counter-clockwise of them, so the expected fraction moved is `1/(N+1)` — 20% and 10% respectively. Two orders of magnitude apart at scale, and the ring's movement is also localized to specific neighbours rather than shuffling everything." },
      { q: "Why do you need virtual nodes?", a: "Two reasons. Balance: with one token per node the arc lengths are exponentially distributed, so the biggest shard is typically ~3× the smallest with 10 nodes; the load's standard deviation falls as 1/√V, so V=100 gets you within a few percent. Failure spreading: with one token, a dead node hands its entire range to a single successor, which then gets 2× load and probably falls over too — a cascade. With V tokens the load is absorbed by ~V different nodes. Virtual nodes also give weighted capacity for free: a bigger machine gets more tokens." },
      { q: "What breaks during the rebalance itself?", a: "For the moving key range there are briefly two plausible owners. Caches usually accept the misses — the keys just look cold. Databases need an explicit handoff: the new owner streams the range from the old owner while the old owner keeps serving, writes are dual-written or forwarded, and ownership flips atomically in the routing metadata at the end. Get that wrong and you get lost writes or split-brain on a key range. This is why a pre-split partition map is nicer: the unit of movement is a whole partition with a clear owner, and the flip is one metadata update." },
      { q: "Is consistent hashing enough for hot keys?", a: "No, and this is the trap in the question. Consistent hashing distributes the *key space* uniformly; it says nothing about the *request distribution* over that space. One celebrity key is one point on the ring and lands on one node however many virtual nodes you have. The fixes are different: replicate the hot key across several nodes and read from a random replica, salt it into `key#0…key#9`, or put a small local cache in front so most requests never reach the ring at all." },
      { q: "When would you not use consistent hashing?", a: "When you can afford a routing table. If the shard count is fixed and modest, pre-splitting into a few thousand logical partitions with an explicit partition→node map is strictly more flexible: you can move individual partitions to fix hotspots, you can weight nodes exactly, and rebalancing is a metadata change rather than an emergent property of a hash function. That's what Redis Cluster (16384 slots), Kafka (partitions), and Vitess do. Consistent hashing wins when membership changes constantly and there is no coordinator — client-side cache clusters, DHTs, service meshes." },
      { q: "How do clients agree on the ring?", a: "They must, or two clients route the same key to different nodes. Options: a gossip protocol where every node learns membership (Dynamo/Cassandra), a coordination service holding the authoritative membership (ZooKeeper/etcd) that clients watch, or the servers redirecting misrouted requests (Redis Cluster's MOVED/ASK). During a membership change there is unavoidably a window of disagreement — for a cache that is extra misses, for a database that is why ownership handoff must be explicit rather than implicit." }
    ]
  },

  code: [
    { lang: "python", label: "Consistent hash ring with virtual nodes", code: "import bisect, hashlib\n\nclass HashRing:\n    def __init__(self, nodes=(), vnodes=150):\n        self.vnodes = vnodes\n        self.ring = {}          # token -> node\n        self.sorted = []        # sorted token list, for bisect\n        for n in nodes:\n            self.add(n)\n\n    @staticmethod\n    def _hash(key):\n        # md5 is fine here: we need uniformity, not security.\n        return int(hashlib.md5(key.encode()).hexdigest()[:8], 16)\n\n    def add(self, node, weight=1):\n        for i in range(self.vnodes * weight):     # weight => proportional load\n            t = self._hash(f\"{node}#{i}\")\n            self.ring[t] = node\n            bisect.insort(self.sorted, t)\n\n    def remove(self, node):\n        for t in [t for t, n in self.ring.items() if n == node]:\n            del self.ring[t]\n            self.sorted.remove(t)\n\n    def get(self, key):\n        if not self.sorted:\n            return None\n        h = self._hash(key)\n        i = bisect.bisect(self.sorted, h) % len(self.sorted)   # first token >= h, wrapping\n        return self.ring[self.sorted[i]]\n\n    def get_n(self, key, n):\n        \"\"\"Preference list: the next n DISTINCT physical nodes clockwise.\n        This is how replication works on a ring (Dynamo-style).\"\"\"\n        if not self.sorted:\n            return []\n        out, i = [], bisect.bisect(self.sorted, self._hash(key)) % len(self.sorted)\n        for _ in range(len(self.sorted)):\n            node = self.ring[self.sorted[i]]\n            if node not in out:\n                out.append(node)\n                if len(out) == n:\n                    break\n            i = (i + 1) % len(self.sorted)\n        return out" },
    { lang: "python", label: "Measure the movement — the number to quote", code: "K = 1_000_000\nkeys = [f\"user:{i}\" for i in range(K)]\n\n# --- ring ------------------------------------------------------------------\nring = HashRing([\"a\", \"b\", \"c\", \"d\"], vnodes=150)\nbefore = {k: ring.get(k) for k in keys}\nring.add(\"e\")\nafter  = {k: ring.get(k) for k in keys}\nmoved  = sum(before[k] != after[k] for k in keys)\nprint(moved / K)          # ~0.20  == 1/5, exactly the theory\n\n# --- mod N -----------------------------------------------------------------\nh = lambda k: int(hashlib.md5(k.encode()).hexdigest()[:8], 16)\nmoved_mod = sum(h(k) % 4 != h(k) % 5 for k in keys)\nprint(moved_mod / K)      # ~0.80  == 4/5" },
    { lang: "javascript", label: "Jump consistent hash — 5 lines, zero memory", code: "// Perfectly balanced, O(ln n), no ring, no storage.\n// Constraint: buckets are 0..n-1 and only the LAST one can be removed.\nfunction jumpHash(key /* BigInt */, buckets) {\n  let b = -1n, j = 0n, k = BigInt(key);\n  while (j < BigInt(buckets)) {\n    b = j;\n    k = (k * 2862933555777941757n + 1n) & 0xFFFFFFFFFFFFFFFFn;   // LCG step\n    j = BigInt(Math.floor((Number(b) + 1) * (2147483648 / Number((k >> 33n) + 1n))));\n  }\n  return Number(b);\n}\n// Ideal for \"I have N shards and I scale N up and down elastically\".\n// Useless for \"node 3 died\" — you cannot punch a hole in the middle." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 400 },

    params: [
      { key: "keys", label: "Keys", type: "int", min: 40, max: 400, default: 200 },
      { key: "vnodes", label: "Virtual nodes / server", type: "int", min: 1, max: 80, default: 24 },
      { key: "seed", label: "Re-roll keys", type: "seed" }
    ],

    frames: function* (params, rng) {
      const K = params.keys;
      const V = params.vnodes;
      const SPACE = 4294967296;

      const hash32 = (s) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
        h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0;
        h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
        return (h ^ (h >>> 16)) >>> 0;
      };

      // ---- keys ---------------------------------------------------------------
      const keyName = [], keyPos = [];
      for (let i = 0; i < K; i++) {
        const nm = "key:" + Math.floor(rng() * 1e9).toString(36);
        keyName.push(nm);
        keyPos.push(hash32(nm));
      }

      // ---- ring ---------------------------------------------------------------
      let nodes = [];                 // [{id}]
      let tokens = [];                // sorted [{p, n}]
      const rebuild = () => {
        const t = [];
        for (let i = 0; i < nodes.length; i++) {
          for (let v = 0; v < V; v++) t.push({ p: hash32(nodes[i].id + "#" + v), n: i });
        }
        t.sort((a, b) => a.p - b.p);
        tokens = t;
      };
      const owner = (p) => {
        if (!tokens.length) return -1;
        let lo = 0, hi = tokens.length;
        while (lo < hi) { const m = (lo + hi) >> 1; if (tokens[m].p < p) lo = m + 1; else hi = m; }
        return tokens[lo % tokens.length].n;
      };

      let ringAssign = new Array(K).fill(-1);
      let modAssign = new Array(K).fill(-1);
      const recomputeMod = () => keyPos.map((p) => (nodes.length ? hash32("m" + p) % nodes.length : -1));

      let movedRingTotal = 0, movedModTotal = 0;

      const counts = (arr) => {
        const c = new Array(nodes.length).fill(0);
        for (let i = 0; i < K; i++) if (arr[i] >= 0 && arr[i] < c.length) c[arr[i]] += 1;
        return c;
      };

      const snap = (extra) => Object.assign({
        nodeIds: nodes.map((n) => n.id),
        tokens: tokens.map((t) => ({ p: t.p, n: t.n })),
        keyPos: keyPos.slice(),
        ring: ringAssign.slice(),
        mod: modAssign.slice(),
        ringCounts: counts(ringAssign),
        modCounts: counts(modAssign),
        vnodes: V, K: K, space: SPACE,
        movedRing: 0, movedMod: 0, movedRingTotal: movedRingTotal, movedModTotal: movedModTotal,
        highlight: [], event: "", changed: ""
      }, extra || {});

      // ---- phase 1: bring up three nodes --------------------------------------
      const NAMES = ["A", "B", "C", "D", "E", "F"];
      for (let i = 0; i < 3; i++) {
        nodes.push({ id: NAMES[i] });
        rebuild();
        ringAssign = keyPos.map(owner);
        modAssign = recomputeMod();
        yield {
          label: `Server ${NAMES[i]} joins: ${V} virtual node${V === 1 ? "" : "s"} hashed onto the ring, so it owns ${V} separate arcs rather than one big one.`,
          phase: "build",
          state: snap({ event: "add", changed: NAMES[i] })
        };
      }

      const spreadOf = (c) => (c.length ? (Math.max.apply(null, c) - Math.min.apply(null, c)) : 0);
      yield {
        label: `${K} keys placed. Ring shards hold ${counts(ringAssign).join(" / ")} keys (spread ${spreadOf(counts(ringAssign))}) — with V=${V} virtual nodes the arcs average out. mod-3 holds ${counts(modAssign).join(" / ")}.`,
        phase: "build",
        state: snap({ event: "placed" })
      };

      // ---- topology changes ---------------------------------------------------
      const events = [
        { kind: "add", id: "D", why: "Traffic grew — scale out." },
        { kind: "remove", id: "B", why: "Server B died. Nobody chose this moment." },
        { kind: "add", id: "E", why: "Replace the dead capacity, then some." }
      ];

      for (const ev of events) {
        // Compare by node IDENTITY, not by array index — indices shift on removal.
        const idsBefore = nodes.map((n) => n.id);
        const beforeRingId = ringAssign.map((i) => (i >= 0 ? idsBefore[i] : "-"));
        const beforeModId = modAssign.map((i) => (i >= 0 ? idsBefore[i] : "-"));

        if (ev.kind === "add") nodes = nodes.concat([{ id: ev.id }]);
        else {
          const idx = nodes.findIndex((n) => n.id === ev.id);
          nodes = nodes.slice(0, idx).concat(nodes.slice(idx + 1));
        }
        rebuild();
        const afterRing = keyPos.map(owner);
        const afterMod = recomputeMod();
        const idsAfter = nodes.map((n) => n.id);

        const movedRingIdx = [], movedModIdx = [];
        for (let i = 0; i < K; i++) {
          if (beforeRingId[i] !== (afterRing[i] >= 0 ? idsAfter[afterRing[i]] : "-")) movedRingIdx.push(i);
          if (beforeModId[i] !== (afterMod[i] >= 0 ? idsAfter[afterMod[i]] : "-")) movedModIdx.push(i);
        }

        ringAssign = afterRing;
        modAssign = afterMod;
        movedRingTotal += movedRingIdx.length;
        movedModTotal += movedModIdx.length;

        const pctR = ((movedRingIdx.length / K) * 100).toFixed(1);
        const pctM = ((movedModIdx.length / K) * 100).toFixed(1);

        yield {
          label: `${ev.why} ${ev.kind === "add" ? "Adding" : "Removing"} ${ev.id} → the ring now has ${nodes.length} servers × ${V} tokens = ${tokens.length} points.`,
          phase: "change",
          state: snap({ event: ev.kind, changed: ev.id, movedRing: movedRingIdx.length, movedMod: movedModIdx.length })
        };

        // reveal the moved keys in chunks so the locality is visible
        const CHUNKS = 6;
        const per = Math.ceil(movedRingIdx.length / CHUNKS) || 1;
        for (let c = 0; c < CHUNKS && c * per < movedRingIdx.length; c++) {
          const shown = movedRingIdx.slice(0, Math.min(movedRingIdx.length, (c + 1) * per));
          yield {
            label: `Remapping: ${shown.length}/${movedRingIdx.length} moved keys highlighted. Notice they all sit in the arcs immediately counter-clockwise of ${ev.id}'s tokens — no other key is touched.`,
            phase: "remap",
            state: snap({ event: ev.kind, changed: ev.id, movedRing: movedRingIdx.length, movedMod: movedModIdx.length, highlight: shown })
          };
        }

        const rc = counts(ringAssign);
        yield {
          label: `${ev.kind === "add" ? "Added" : "Removed"} ${ev.id}: the ring moved ${movedRingIdx.length}/${K} keys (${pctR}%) — theory says ~1/${nodes.length + (ev.kind === "add" ? 0 : 1)} ≈ ${(100 / (ev.kind === "add" ? nodes.length : nodes.length + 1)).toFixed(1)}%. hash mod N moved ${movedModIdx.length}/${K} (${pctM}%). That is ${(movedModIdx.length / Math.max(1, movedRingIdx.length)).toFixed(1)}× more data over the wire, for the same operation.`,
          phase: "compare",
          state: snap({ event: "summary", changed: ev.id, movedRing: movedRingIdx.length, movedMod: movedModIdx.length, highlight: movedRingIdx.slice(0, 400) })
        };

        yield {
          label: `Post-change balance: ${nodes.map((n, i) => n.id + "=" + rc[i]).join("  ")} (ideal ${(K / nodes.length).toFixed(0)} each, spread ${spreadOf(rc)}). With V=1 this spread would typically be 3× worse — virtual nodes are what make the ring usable.`,
          phase: "balance",
          state: snap({ event: "balance", changed: ev.id })
        };
      }

      yield {
        label: `Three topology changes total: the ring moved ${movedRingTotal} keys, mod-N would have moved ${movedModTotal} — ${(movedModTotal / Math.max(1, movedRingTotal)).toFixed(1)}× more. That ratio is the entire reason consistent hashing exists.`,
        phase: "done",
        state: snap({ event: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors, W = env.width, H = env.height;
      const s = frame.state;
      ctx.clearRect(0, 0, W, H);
      const M = env.font.mono, F = env.font.base;
      const lab = (x, y, t, col, size, align, useBase) => {
        ctx.fillStyle = col; ctx.font = `${size || 11}px ${useBase ? F : M}`;
        ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
      };
      const PAL = [C.viz1, C.viz3, C.viz5, C.viz7, C.viz4, C.viz6];
      const colOf = (i) => (i < 0 ? C.muted : PAL[i % PAL.length]);

      // ---- LEFT: the ring -----------------------------------------------------
      const cx = H * 0.52, cy = H * 0.52 + 6, R = Math.min(H * 0.36, W * 0.19);
      const ang = (p) => (p / s.space) * Math.PI * 2 - Math.PI / 2;

      lab(16, 20, `consistent hash ring — ${s.nodeIds.length} servers × ${s.vnodes} vnodes`, C.text, 12, "left", true);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
      lab(cx, cy - R - 10, "0 / 2³²", C.muted, 9, "center");

      // token ticks
      for (let i = 0; i < s.tokens.length; i++) {
        const a = ang(s.tokens[i].p);
        ctx.strokeStyle = colOf(s.tokens[i].n);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * (R - 6), cy + Math.sin(a) * (R - 6));
        ctx.lineTo(cx + Math.cos(a) * (R + 7), cy + Math.sin(a) * (R + 7));
        ctx.stroke();
      }

      // key dots
      const hi = {};
      for (let i = 0; i < s.highlight.length; i++) hi[s.highlight[i]] = 1;
      for (let i = 0; i < s.keyPos.length; i++) {
        const a = ang(s.keyPos[i]);
        const rr = R - 16 - (i % 3) * 5;
        const moved = hi[i] === 1;
        ctx.fillStyle = moved ? C.viz2 : colOf(s.ring[i]);
        ctx.globalAlpha = moved ? 1 : 0.75;
        ctx.beginPath();
        ctx.arc(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, moved ? 3.2 : 1.9, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // node legend around the ring
      for (let i = 0; i < s.nodeIds.length; i++) {
        const a = -Math.PI / 2 + (i / s.nodeIds.length) * Math.PI * 2;
        const lx = cx + Math.cos(a) * (R + 26), ly = cy + Math.sin(a) * (R + 26);
        ctx.fillStyle = colOf(i);
        ctx.beginPath(); ctx.arc(lx, ly, 8, 0, Math.PI * 2); ctx.fill();
        lab(lx, ly + 4, s.nodeIds[i], C.surface, 11, "center");
      }

      // ---- RIGHT: mod-N buckets + counters ------------------------------------
      const px = H * 0.52 + R + 74;
      const pw = W - px - 24;
      const N = s.nodeIds.length;

      lab(px, 20, `hash(key) mod ${N}`, C.text, 12, "left", true);
      const bw = Math.min(64, pw / Math.max(1, N) - 8);
      const maxMod = Math.max(1, ...s.modCounts, ...s.ringCounts);
      const bh = 74;
      for (let i = 0; i < N; i++) {
        const x = px + i * (bw + 8);
        const h2 = (s.modCounts[i] / maxMod) * bh;
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(x, 32, bw, bh, 4); ctx.fill();
        ctx.fillStyle = colOf(i);
        ctx.beginPath(); ctx.roundRect(x, 32 + bh - h2, bw, Math.max(1, h2), 4); ctx.fill();
        lab(x + bw / 2, 32 + bh + 13, s.nodeIds[i], C.text2, 10, "center");
        lab(x + bw / 2, 32 + bh - h2 - 4, String(s.modCounts[i]), C.muted, 9, "center");
      }

      // ring balance bars for comparison
      const ry = 32 + bh + 40;
      lab(px, ry - 8, "ring shard sizes", C.text2, 11);
      for (let i = 0; i < N; i++) {
        const x = px + i * (bw + 8);
        const h2 = (s.ringCounts[i] / maxMod) * bh;
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(x, ry, bw, bh, 4); ctx.fill();
        ctx.fillStyle = colOf(i);
        ctx.beginPath(); ctx.roundRect(x, ry + bh - h2, bw, Math.max(1, h2), 4); ctx.fill();
        lab(x + bw / 2, ry + bh + 13, s.nodeIds[i], C.text2, 10, "center");
        lab(x + bw / 2, ry + bh - h2 - 4, String(s.ringCounts[i]), C.muted, 9, "center");
      }

      // ---- keys-moved counter -------------------------------------------------
      const my = ry + bh + 42;
      lab(px, my, s.changed ? `last change: ${s.event === "remove" ? "remove" : "add"} ${s.changed}` : "keys moved", C.muted, 11);
      const barW = pw - 90;
      const rowsY = [my + 18, my + 42];
      const vals = [s.movedRing, s.movedMod];
      const names = ["ring", `mod ${N}`];
      const cols = [C.viz3, C.viz2];
      for (let i = 0; i < 2; i++) {
        lab(px, rowsY[i] + 10, names[i], C.text2, 11);
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(px + 46, rowsY[i], barW, 14, 3); ctx.fill();
        ctx.fillStyle = cols[i];
        ctx.beginPath(); ctx.roundRect(px + 46, rowsY[i], Math.max(1, (vals[i] / s.K) * barW), 14, 3); ctx.fill();
        lab(px + 46 + barW + 6, rowsY[i] + 11, `${vals[i]} (${((vals[i] / s.K) * 100).toFixed(0)}%)`, cols[i], 11);
      }
      lab(px, my + 76, `cumulative — ring ${s.movedRingTotal}, mod-N ${s.movedModTotal} of ${s.K} keys`, C.muted, 10);
    }
  },

  drill: {
    cards: [
      { q: "What fraction of keys move when you go from 4 to 5 shards under hash % N?", a: "About 4/5 = 80%. In general N/(N+1) — the two moduli agree for only ~1/(N+1) of keys.", tags: ["numbers"] },
      { q: "And on a consistent hash ring?", a: "About 1/(N+1) = 20%, and only the keys in the arcs the new node's tokens claim from their counter-clockwise neighbours. Nothing else is touched.", tags: ["numbers"] },
      { q: "Why are virtual nodes required, not optional?", a: "With one token per node the arcs are exponentially distributed, so the largest shard is ~3× the smallest at N=10, and a dead node dumps its whole range on one successor, which then cascades. V tokens per node reduce load stddev as 1/√V and spread a failure across ~V successors.", tags: ["vnodes"] },
      { q: "How do you give a bigger machine more data on a ring?", a: "Give it proportionally more virtual nodes/tokens. Weight is just token count.", tags: ["vnodes"] },
      { q: "Ring lookup cost and memory?", a: "O(log(N·V)) via binary search over the sorted token array, using O(N·V) memory. With N=100 and V=150 that is 15,000 entries — trivial.", tags: ["complexity"] },
      { q: "What is rendezvous (HRW) hashing?", a: "For each key compute hash(key, node) for every node and pick the max. Same minimal-disruption property as a ring, no ring data structure, easy weighting — but O(N) per lookup, so it fits small N.", tags: ["alternatives"] },
      { q: "What is jump consistent hash good and bad at?", a: "Good: 5 lines, no memory, perfect balance, O(ln n). Bad: buckets must be 0..n−1 and only the last can be removed — great for elastic shard counts, useless for 'node 3 died'.", tags: ["alternatives"] },
      { q: "Why do many production systems pre-split into fixed logical shards instead?", a: "A partition→node map (Redis Cluster's 16384 slots, Kafka partitions, Vitess) makes rebalancing an explicit metadata edit: you can move one partition to fix a hotspot, weight nodes exactly, and hand off ownership atomically. Consistent hashing's advantage is needing no coordinator.", tags: ["alternatives"] },
      { q: "Does consistent hashing solve hot keys?", a: "No. It balances the key space, not the request distribution. A single celebrity key is one ring position and lands on one node. Fix it separately with replication of that key, salting, or a local cache in front.", tags: ["pitfall"] }
    ],
    sixtySecond: [
      "Explain why hash % N is unusable for a growing cluster, and quantify what the ring gives you instead.",
      "Explain virtual nodes: the two problems they solve and what they cost."
    ]
  }
};
