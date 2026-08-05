export default {
  id: "consistent-hashing",
  track: "sysdesign",
  title: "Consistent Hashing",
  difficulty: 2,
  minutes: 16,
  tags: ["sharding", "hashing", "rebalancing", "virtual-nodes"],

  explainer: [
    { type: "p", text: "`shard = hash(key) % N` is correct, uniform, and one line long. It has exactly one problem, and it is fatal: **change N and almost every key moves.** Going from 4 nodes to 5 relocates roughly `1 − 1/5 = 80%` of your data. For a cache that is a total cold start; for a database it is a multi-hour migration you cannot do at 3am during an outage." },

    { type: "h3", text: "The ring" },
    { type: "p", text: "Map both nodes and keys onto the same circular hash space (say 0…2³²−1). A key belongs to the **first node clockwise** from its position. Adding a node inserts one new point on the circle; it steals only the arc between itself and its counter-clockwise predecessor. Every other key stays exactly where it was." },
    { type: "p", text: "The guarantee: adding the Nth node moves **K/N keys** in expectation, not K·(N−1)/N. Nine nodes going to ten moves 10% of keys, and only from one neighbour." },

    { type: "h3", text: "Why virtual nodes are not optional" },
    { type: "p", text: "With one point per node, the arcs are random and wildly uneven — with 10 nodes the largest shard is typically ~3× the smallest, and removing a node dumps its entire load onto *one* successor rather than spreading it. Give each physical node **V positions** on the ring (100–256 is typical) and the arcs average out: the standard deviation of load falls as `1/√V`. At V=100 you're within a few percent of uniform, and a node's departure spreads across ~V different successors." },
    { type: "list", items: [
      "Virtual nodes also give you **heterogeneous capacity for free**: a machine with twice the RAM gets twice the tokens.",
      "The cost is memory and lookup: the ring holds `N × V` entries, so a lookup is `O(log(N·V))` (binary search over sorted token positions).",
      "Dynamo, Cassandra, Riak, and memcached client libraries all do exactly this."
    ]},

    { type: "h3", text: "Bounded loads and the alternatives" },
    { type: "list", items: [
      "**Consistent hashing with bounded loads** — accept a node only if its load is below `c × average` (c ≈ 1.25), otherwise walk clockwise to the next. Caps the damage a hot arc can do. Used by HAProxy and Vimeo's CDN balancer.",
      "**Rendezvous (HRW) hashing** — for each key, compute `hash(key, node)` for every node and take the max. Same minimal-disruption property, no ring, trivially handles weights, but `O(N)` per lookup — great for small N.",
      "**Jump consistent hash** — 5 lines, no memory, perfectly balanced, `O(ln N)`. The catch: buckets must be numbered `0…N−1` and you can only remove the *last* one, so it fits elastic shard counts, not arbitrary node failures.",
      "**Fixed shard count with a lookup table** — pre-split into e.g. 4096 logical shards, hash keys into shards with mod, and keep a shard→node map you can edit. The industry's boring, excellent answer: rebalancing is a metadata change, and it is how Vitess, Citus, Kafka partitions and Redis Cluster's 16384 hash slots all work."
    ]},

    { type: "callout", tone: "pitfall", text: "Consistent hashing balances *keys*, not *traffic*. One celebrity key still melts one node no matter how good your ring is. That is a different problem with a different fix — see the hot-keys lesson." },

    { type: "callout", tone: "tip", text: "The interview-winning line: \"I'd pre-shard into a few thousand logical partitions and keep a partition→node map, rather than hashing straight onto physical nodes. Consistent hashing solves resharding; a partition map makes it an atomic metadata edit, and I can move partitions individually to fix hotspots.\"" },

    { type: "h3", text: "What still hurts" },
    { type: "p", text: "Even minimal movement is not free. During a rebalance the moving keys have two possible owners, so you need either a read-both/repair window, or a hand-off protocol where the new owner streams from the old one and only takes ownership at the end. Cache clusters usually just accept the misses; databases cannot." }
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
