export default {
  id: "sharding",
  track: "db",
  title: "Partitioning & Sharding",
  difficulty: 2,
  minutes: 16,
  tags: ["sharding", "partitioning", "scalability", "hashing", "distributed-systems"],

  explainer: [
    { type: "p", text: "Sharding is horizontal partitioning across independent machines: instead of one database holding every row, each shard holds a disjoint subset, and a routing function decides which shard owns which row. It is what you reach for once a single primary can no longer hold the write throughput or the dataset size, no matter how you index or cache it." },
    { type: "h3", text: "Choosing a shard key" },
    { type: "list", items: [
      "**High cardinality** — a boolean or a `status` column gives you at most a few buckets; a shard key must be able to spread millions of rows.",
      "**Matches the access pattern** — most queries should be answerable from a single shard. A multi-tenant SaaS app almost always shards on `tenant_id`, because nearly every query already filters on it.",
      "**Avoid hotspots by construction** — a key correlated with time (an auto-increment id, a timestamp) concentrates recent, high-traffic rows onto whichever shard currently owns the top of the range.",
      "**Ideally immutable** — if the shard key can change (a user changes plans, moves regions), the row has to physically migrate shards to stay correctly routed."
    ]},
    { type: "h3", text: "Hash vs range partitioning" },
    { type: "list", items: [
      "**Hash**: `shard = hash(key) mod S` (or a position on a consistent-hash ring). Spreads load evenly regardless of the key's natural order — a monotonically increasing id hashes to essentially random shards. The cost: a range query (`WHERE id BETWEEN a AND b`) has to fan out to every shard, because adjacent keys are scattered.",
      "**Range**: contiguous key intervals are assigned to shards (`[0,1000) -> shard 0`, `[1000,2000) -> shard 1`, …). Range scans stay on one or a few shards. The cost: if the key keeps growing past every boundary you defined, every new row lands in the same last shard."
    ]},
    { type: "callout", tone: "pitfall", text: "The append-only hotspot: range-partition a table on an auto-increment id or a creation timestamp and, no matter how you drew the boundaries, all NEW writes eventually land in the shard that owns the top of the range. The other shards go idle while one shard absorbs 100% of write traffic. This is a real, repeated production incident, not a hypothetical." },
    { type: "h3", text: "The real cost is resharding, not routing" },
    { type: "p", text: "Routing a single key is cheap under both schemes. What's expensive is changing the shard count. Naive hash sharding recomputes `hash(key) mod S` for a new `S` — since the modulus changed, almost every key's assignment changes, so you must move almost all the data to add one node. **Consistent hashing** fixes exactly this: keys and nodes both live on a hash ring, and adding a node only steals the keys nearest to it on the ring — on average `1/S` of the data moves, not nearly all of it." },
    { type: "callout", tone: "tip", text: "Range partitioning reshards cheaply in one specific way: split the hot range in two. Only the rows inside that one range move; every other shard's boundaries are untouched. That is the standard fix for the append-only hotspot — keep splitting the newest range as it fills, which is exactly what Bigtable/HBase/CockroachDB do automatically." },
    { type: "h3", text: "Cross-shard operations" },
    { type: "list", items: [
      "**Queries without the shard key** become scatter-gather: fan out to every shard, merge results, pay for `S`× the round trips.",
      "**Joins across shards** are either done in the application (fetch both sides, join in memory) or avoided by denormalizing / co-locating related rows on the same shard (shard orders by the same `customer_id` you shard customers by).",
      "**Cross-shard transactions** need two-phase commit or a saga — both are slow and operationally heavy compared to a single-node transaction, so most systems try hard to keep a transaction inside one shard.",
      "**Secondary indexes** are either *local* (built per-shard, so a lookup by a non-shard-key column still requires scatter-gather) or *global* (a separate indexing service that maps the secondary key to a shard, adding a hop but avoiding the fan-out)."
    ]},
    { type: "h3", text: "Directory-based sharding" },
    { type: "p", text: "A third option: keep an explicit lookup table (`key range or hash bucket -> shard id`) in a small, highly-available metadata service instead of computing it. This is more moving parts, but it decouples the routing decision from a formula, which is what lets systems like Vitess and Citus rebalance shards live — move a range's ownership in the directory, migrate the underlying rows in the background, and routing picks up the new owner without a modulus ever changing." }
  ],

  complexity: {
    rows: [
      { operation: "Hash lookup (route one key)", time: "O(1)", space: "O(1)", note: "one hash + one mod; ideal even spread" },
      { operation: "Range lookup (route one key)", time: "O(log S)", space: "O(S)", note: "binary search over boundaries; supports range scans" },
      { operation: "Naive hash reshard (S -> S+1)", time: "O(n)", space: "O(n)", note: "~ S/(S+1) of ALL rows move" },
      { operation: "Consistent-hash reshard", time: "O(n/S)", space: "O(n/S)", note: "only the new node's share moves" },
      { operation: "Range shard split", time: "O(k)", space: "O(k)", note: "k = rows in the one shard being split" },
      { operation: "Query without shard key", time: "O(S) fan-out", space: "O(results)", note: "scatter-gather across every shard" }
    ]
  },

  interview: {
    whyAsked: "Sharding questions probe whether you think about data placement as a design decision with real trade-offs, not a checkbox. The signal is naming a concrete shard key for a stated access pattern, explaining WHY naive resharding is expensive, and knowing what breaks (joins, transactions, secondary indexes) once one table becomes many.",
    followUps: [
      { q: "How would you choose a shard key for a multi-tenant SaaS product?", a: "`tenant_id`, almost always. It has high cardinality, nearly every query already filters on it, and it co-locates all of one customer's data so cross-shard joins and transactions become rare inside normal request handling. The main risk is a single very large tenant becoming a hot shard, which needs a separate mitigation (splitting that tenant further, or giving whales a dedicated shard)." },
      { q: "Why does naive hash resharding move almost all the data, and what fixes it?", a: "`hash(key) mod S` depends on the exact value of S; changing S changes the mod result for nearly every key, so nearly every row's owning shard changes. Consistent hashing places both keys and shards on a hash ring so that adding a shard only reassigns the keys immediately preceding it on the ring — expected O(n/S) movement instead of O(n)." },
      { q: "What causes a hot shard under range partitioning, and how do you fix it for a monotonically increasing key?", a: "If the key keeps growing (auto-increment id, timestamp) past every boundary you drew, every new row falls into the last, open-ended range — one shard absorbs 100% of new writes. Fix it by continuously splitting the hot range as it fills (what Bigtable/CockroachDB do automatically), or switch to hashing the key (at the cost of losing cheap range scans)." },
      { q: "A query doesn't include the shard key. What happens?", a: "It becomes scatter-gather: the coordinator sends the query to every shard and merges the results, paying S times the round trips and losing any single-shard optimization. If that access pattern is common, you need either a global secondary index service or a second copy of the data sharded on that other key." },
      { q: "How do cross-shard transactions work, and why do teams avoid them?", a: "Either two-phase commit (a coordinator gets all shards to prepare, then commits everywhere) or an application-level saga (a sequence of local transactions with compensating actions on failure). Both add latency and failure modes a single-node transaction never has, so the usual strategy is to co-locate related rows so that transactions almost never need to cross a shard boundary." },
      { q: "What is directory-based sharding and why use it over a pure formula?", a: "A small, highly-available lookup service maps key ranges or hash buckets to shard ids explicitly, instead of deriving the mapping purely from `hash(key) mod S`. It costs an extra lookup, but it lets you rebalance live: move one entry's ownership and migrate the underlying rows in the background, without ever changing a modulus that would otherwise reshuffle everything at once." }
    ]
  },

  code: [
    { lang: "python", label: "Hash sharding and the resharding cost", code: "def fnv1a(s: str) -> int:\n    h = 0x811c9dc5\n    for ch in s.encode():\n        h ^= ch\n        h = (h * 0x01000193) & 0xFFFFFFFF\n    return h\n\ndef hash_shard(key: str, num_shards: int) -> int:\n    return fnv1a(key) % num_shards\n\n# Growing from S to S+1 shards the naive way recomputes the mod for\n# every key -- measure exactly how much data that actually moves:\ndef reshard_cost(keys, old_s, new_s):\n    moved = sum(\n        1 for k in keys\n        if fnv1a(k) % old_s != fnv1a(k) % new_s\n    )\n    return moved, len(keys)\n\n# moved / total is close to old_s / new_s for random keys --\n# e.g. 4 -> 5 shards moves roughly 80% of all rows." },
    { lang: "python", label: "Range sharding with a splittable hot shard", code: "class RangeRouter:\n    def __init__(self, boundaries):\n        self.boundaries = boundaries          # sorted; boundaries[i] = start of upper half\n\n    def shard_of(self, key):\n        lo, hi = 0, len(self.boundaries)\n        while lo < hi:                        # binary search: O(log S)\n            mid = (lo + hi) // 2\n            if key < self.boundaries[mid]:\n                hi = mid\n            else:\n                lo = mid + 1\n        return lo\n\n    def split_hot_shard(self, shard_id, midpoint_key):\n        # Only rows with key >= midpoint_key physically move; every\n        # other shard's boundary is untouched -- this is the cheap reshard.\n        self.boundaries.insert(shard_id, midpoint_key)" },
    { lang: "sql", label: "Declarative range partitioning (Postgres)", code: "-- Native declarative partitioning: each partition IS effectively a shard\n-- (co-located here, but the same idea extends to Citus/foreign-data-wrapper shards)\nCREATE TABLE events (\n  id BIGINT NOT NULL,\n  created_at TIMESTAMPTZ NOT NULL,\n  payload JSONB\n) PARTITION BY RANGE (created_at);\n\nCREATE TABLE events_2026_01 PARTITION OF events\n  FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');\nCREATE TABLE events_2026_02 PARTITION OF events\n  FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');\n\n-- The append-only hotspot in miniature: every write in February goes\n-- to events_2026_02 until March's partition exists. Automate partition\n-- creation ahead of time (pg_partman) so the \"hot\" partition is never missing." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.95, maxFrames: 200 },

    params: [
      { key: "shards", label: "Initial shards (S)", type: "int", min: 3, max: 6, default: 4 },
      { key: "n", label: "Existing rows", type: "int", min: 24, max: 60, default: 48 },
      { key: "newWrites", label: "New rows (growing ids)", type: "int", min: 12, max: 48, default: 24 }
    ],

    frames: function* (params, rng) {
      const S = params.shards;
      const n0 = params.n;
      const nNew = params.newWrites;
      const N = n0 + nNew;

      function fnv1a(str) {
        let h = 0x811c9dc5;
        for (let i = 0; i < str.length; i++) {
          h ^= str.charCodeAt(i);
          h = Math.imul(h, 0x01000193);
        }
        return h >>> 0;
      }
      const hashOf = (id) => fnv1a("row-" + id);

      // Range boundaries computed from the ORIGINAL n0 rows only, spread
      // evenly; the last shard's range is open-ended (id -> infinity).
      const bounds = [];
      for (let i = 0; i < S - 1; i++) bounds.push(Math.ceil(((i + 1) * n0) / S));
      const rangeShardOf = (id) => {
        for (let i = 0; i < bounds.length; i++) if (id < bounds[i]) return i;
        return bounds.length;
      };

      let hashCounts = new Array(S).fill(0);
      let rangeCounts = new Array(S).fill(0);
      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
      const imbalance = (arr) => (avg(arr) === 0 ? 1 : Math.max(...arr) / avg(arr));

      const snap = (over) => Object.assign({
        S, n0, nNew, N,
        bounds: bounds.slice(),
        hashCounts: hashCounts.slice(),
        rangeCounts: rangeCounts.slice(),
        currentId: null, currentHashShard: null, currentRangeShard: null,
        phase2: "", note: "",
        hashImbalance: +imbalance(hashCounts).toFixed(3),
        rangeImbalance: +imbalance(rangeCounts).toFixed(3),
        reshardHash: null, reshardRange: null
      }, over || {});

      yield {
        label: `A good shard key has high cardinality, spreads load evenly, and lets most queries stay on one shard. We will route the SAME ${n0} rows two ways — by hash and by id range — across S = ${S} shards, and measure the difference for real instead of describing it.`,
        phase: "setup",
        state: snap({ phase2: "setup" })
      };

      yield {
        label: `HASH: shard = fnv1a(key) mod ${S} — the hash scrambles the key, so nearby ids land on unrelated shards. RANGE: shard = which of ${S} contiguous id-buckets the key falls in, boundaries at ids ${bounds.join(", ")} (bucket ${S - 1} is open-ended).`,
        phase: "setup",
        state: snap({ phase2: "setup" })
      };

      // ---- illustrate a handful of individual routes ----
      const showN = Math.min(5, n0);
      for (let id = 0; id < showN; id++) {
        const h = hashOf(id);
        const hs = h % S;
        const rs = rangeShardOf(id);
        hashCounts[hs]++; rangeCounts[rs]++;
        yield {
          label: `row ${id}: fnv1a("row-${id}") = ${h} → mod ${S} = shard H${hs}.  Range: id ${id} ${rs < bounds.length ? `< ${bounds[rs]}` : `≥ ${bounds[bounds.length - 1]}`} → shard R${rs}.`,
          phase: "route",
          focus: [id],
          state: snap({ currentId: id, currentHashShard: hs, currentRangeShard: rs, phase2: "initial" })
        };
      }

      // ---- batch-route the remaining initial rows ----
      const batch1 = Math.max(1, Math.ceil((n0 - showN) / 12));
      for (let start = showN; start < n0; start += batch1) {
        const end = Math.min(n0, start + batch1);
        for (let id = start; id < end; id++) {
          hashCounts[hashOf(id) % S]++;
          rangeCounts[rangeShardOf(id)]++;
        }
        yield {
          label: `Routed rows ${start}–${end - 1} (${end - start} rows). Hash counts [${hashCounts.join(",")}] · range counts [${rangeCounts.join(",")}].`,
          phase: "route",
          state: snap({ phase2: "initial", note: `${end}/${n0} existing rows routed` })
        };
      }

      yield {
        label: `All ${n0} existing rows placed. Hash imbalance (max/avg) = ${imbalance(hashCounts).toFixed(2)}×, range imbalance = ${imbalance(rangeCounts).toFixed(2)}×. With ids spread uniformly over a FIXED range, both are close to even — the difference appears once new rows keep arriving.`,
        phase: "initial-done",
        state: snap({ phase2: "initial-done", note: "baseline: both roughly balanced" })
      };

      // ---- append-only growth: ids n0 .. N-1 ----
      yield {
        label: `Simulate ${nNew} new rows arriving with monotonically increasing ids (${n0} … ${N - 1}) — an auto-increment primary key or a timestamp-ordered id, the most common shard key in practice.`,
        phase: "growth",
        state: snap({ phase2: "growth-start" })
      };

      const batch2 = Math.max(1, Math.ceil(nNew / 14));
      for (let start = n0; start < N; start += batch2) {
        const end = Math.min(N, start + batch2);
        for (let id = start; id < end; id++) {
          hashCounts[hashOf(id) % S]++;
          rangeCounts[rangeShardOf(id)]++;
        }
        yield {
          label: `Rows ${start}–${end - 1}: hash scatters them across all ${S} shards (hashing a growing id does not itself grow), but every one has id ≥ the last range boundary, so RANGE sends 100% of them into shard R${S - 1}. It now holds ${rangeCounts[S - 1]} rows.`,
          phase: "growth",
          state: snap({ phase2: "growth", note: `R${S - 1} is receiving every new write` })
        };
      }

      const hImb = imbalance(hashCounts), rImb = imbalance(rangeCounts);
      yield {
        label: `After ${N} total rows: hash counts [${hashCounts.join(",")}] → imbalance ${hImb.toFixed(2)}×. Range counts [${rangeCounts.join(",")}] → imbalance ${rImb.toFixed(2)}×. Shard R${S - 1} holds ${rangeCounts[S - 1]} of ${N} rows (${(100 * rangeCounts[S - 1] / N).toFixed(1)}%) — a real, measured hotspot from a monotonic key under range partitioning.`,
        phase: "compare",
        state: snap({ phase2: "compare", note: `hot shard R${S - 1}: ${(100 * rangeCounts[S - 1] / N).toFixed(1)}% of all rows` })
      };

      // ---- reshard: HASH mod S -> mod (S+1) ----
      yield {
        label: `Reshard by adding one node. Naive hash resharding recomputes hash(key) mod ${S + 1} for every row — the modulus changed, so most keys' owning shard changes too.`,
        phase: "reshard-hash",
        state: snap({ phase2: "reshard-hash-start" })
      };
      let movedHash = 0;
      const sampleMoves = [];
      for (let id = 0; id < N; id++) {
        const h = hashOf(id);
        const oldS = h % S, newS = h % (S + 1);
        if (oldS !== newS) {
          movedHash++;
          if (sampleMoves.length < 6) sampleMoves.push({ id, oldS, newS });
        }
      }
      for (const m of sampleMoves) {
        yield {
          label: `row ${m.id}: hash mod ${S} = H${m.oldS}, hash mod ${S + 1} = H${m.newS} — different, so this row must physically move to the new shard layout.`,
          phase: "reshard-hash",
          focus: [m.id],
          state: snap({ phase2: "reshard-hash", reshardHash: { moved: movedHash, total: N, sample: sampleMoves.slice() } })
        };
      }
      yield {
        label: `Across all ${N} rows, comparing hash(key) mod ${S} against hash(key) mod ${S + 1} directly shows ${movedHash} rows (${(100 * movedHash / N).toFixed(1)}%) change shards — nearly everything, for adding a single node. This is the textbook argument for consistent hashing over plain modulo.`,
        phase: "reshard-hash",
        state: snap({ phase2: "reshard-hash-done", reshardHash: { moved: movedHash, total: N, sample: sampleMoves.slice() } })
      };

      // ---- reshard: RANGE split the hot shard ----
      yield {
        label: `Now reshard RANGE instead: split the hot shard R${S - 1} in two. Everything below the midpoint of its span stays; everything at or above it becomes a brand-new shard R${S}.`,
        phase: "reshard-range",
        state: snap({ phase2: "reshard-range-start" })
      };
      const lo = bounds.length ? bounds[bounds.length - 1] : 0;
      const hi = N - 1;
      const mid = lo + Math.floor((hi - lo) / 2);
      let movedRange = 0, stayedRange = 0;
      for (let id = 0; id < N; id++) {
        if (id >= lo) { if (id >= mid) movedRange++; else stayedRange++; }
      }
      yield {
        label: `New boundary at id ${mid}: rows in [${lo}, ${mid}) stay in R${S - 1} (${stayedRange} rows); rows in [${mid}, ${hi}] move to the new R${S} (${movedRange} rows). Only ${movedRange} of ${N} rows (${(100 * movedRange / N).toFixed(1)}%) move — every other shard's range never changed.`,
        phase: "reshard-range",
        state: snap({ phase2: "reshard-range-done", reshardRange: { moved: movedRange, stayed: stayedRange, total: N, mid, lo, hi } })
      };

      yield {
        label: `Same growth, two resharding costs: hash-mod moved ${movedHash}/${N} rows (${(100 * movedHash / N).toFixed(1)}%); splitting the hot range moved only ${movedRange}/${N} (${(100 * movedRange / N).toFixed(1)}%). Range reshards cheaply but hotspots on monotonic keys; hash stays balanced but reshards expensively without consistent hashing — that exact tension is why production systems combine both ideas (hash the key, then use a consistent-hash ring so growth only touches a fraction of the data).`,
        phase: "done",
        state: snap({ phase2: "done", reshardHash: { moved: movedHash, total: N }, reshardRange: { moved: movedRange, total: N, mid, lo, hi } })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 16;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`${s.S} shards · ${s.phase2}`, pad, 20);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(s.note || "", pad, 36);

      if (s.currentId != null) {
        ctx.textAlign = "center";
        ctx.fillStyle = C.viz4;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(`row ${s.currentId} → H${s.currentHashShard} / R${s.currentRangeShard}`, W / 2, 20);
      }

      const headerH = 52;
      const panelTop = headerH + 24;
      const panelH = H - panelTop - 60;
      const gap = 24;
      const panelW = (W - pad * 2 - gap) / 2;
      const leftX = pad, rightX = pad + panelW + gap;

      const avg = (arr) => arr.reduce((a, b) => a + b, 0) / Math.max(1, arr.length);
      const hashAvg = avg(s.hashCounts), rangeAvg = avg(s.rangeCounts);

      const drawPanel = (x, title, letter, counts, hotIdxFn, extra) => {
        ctx.textAlign = "center";
        ctx.fillStyle = C.text;
        ctx.font = `14px ${env.font.base}`;
        ctx.fillText(title, x + panelW / 2, panelTop - 10);

        const n = counts.length;
        const bw = Math.min(120, (panelW - 20) / n);
        const gapx = (panelW - bw * n) / (n + 1);
        const maxC = Math.max(1, ...counts);
        const baseY = panelTop + panelH;

        for (let i = 0; i < n; i++) {
          const bx = x + gapx + i * (bw + gapx);
          const bh = Math.max(3, (counts[i] / maxC) * (panelH - 40));
          const by = baseY - bh;
          const hot = hotIdxFn(i, counts);

          ctx.globalAlpha = hot ? 0.9 : 0.75;
          ctx.fillStyle = hot ? C.viz8 : C.viz1;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 4);
          ctx.fill();
          ctx.globalAlpha = 1;

          if (hot) {
            ctx.strokeStyle = C.danger;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(bx - 1, by - 1, bw + 2, bh + 2, 4);
            ctx.stroke();
          }

          ctx.fillStyle = C.text;
          ctx.font = `13px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(String(counts[i]), bx + bw / 2, by - 6 < panelTop ? by + 16 : by - 6);
          ctx.fillStyle = C.muted;
          ctx.font = `12px ${env.font.mono}`;
          ctx.fillText(letter + i, bx + bw / 2, baseY + 18);
        }
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + panelW, baseY);
        ctx.stroke();

        if (extra) {
          ctx.textAlign = "left";
          ctx.fillStyle = C.warn;
          ctx.font = `10px ${env.font.mono}`;
          wrapText(ctx, extra, x, baseY + 32, panelW, 12);
        }
      };

      function wrapText(ctx2, text, x, y, maxW, lh) {
        const words = text.split(" ");
        let line = "", yy = y;
        for (const w of words) {
          const test = line ? line + " " + w : w;
          if (ctx2.measureText(test).width > maxW && line) {
            ctx2.fillText(line, x, yy);
            line = w; yy += lh;
          } else line = test;
        }
        if (line) ctx2.fillText(line, x, yy);
      }

      drawPanel(leftX, "HASH  ·  shard = hash(key) mod S", "H", s.hashCounts,
        (i, arr) => arr[i] > hashAvg * 1.5 && arr[i] > 2,
        s.reshardHash ? `reshard mod ${s.S}→${s.S + 1}: ${s.reshardHash.moved}/${s.reshardHash.total} rows move (${(100 * s.reshardHash.moved / s.reshardHash.total).toFixed(1)}%)` : null);

      drawPanel(rightX, "RANGE  ·  shard = id bucket", "R", s.rangeCounts,
        (i, arr) => i === arr.length - 1 && arr[i] > rangeAvg * 1.5,
        s.reshardRange ? `split R${s.S - 1} at id ${s.reshardRange.mid}: ${s.reshardRange.moved}/${s.reshardRange.total} rows move (${(100 * s.reshardRange.moved / s.reshardRange.total).toFixed(1)}%)` : null);

      ctx.textAlign = "left";
      ctx.fillStyle = C.text2;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`hash imbalance (max/avg): ${s.hashImbalance}×      range imbalance (max/avg): ${s.rangeImbalance}×`, pad, H - 12);
    }
  },

  drill: {
    cards: [
      { q: "What makes a good shard key?", a: "High cardinality, matches the query access pattern (most queries stay on one shard), avoids correlation with time/insertion order, and ideally never changes for a given row.", tags: ["shard-key"] },
      { q: "Why does naive hash resharding move almost all the data?", a: "`hash(key) mod S` depends on the exact value of S; changing S changes the mod result for nearly every key, so nearly every row's owning shard changes.", tags: ["resharding"] },
      { q: "What fixes the expensive-resharding problem of hash sharding?", a: "Consistent hashing: place keys and shards on a hash ring so adding a shard only reassigns the keys nearest to it — expected O(n/S) movement instead of O(n).", tags: ["consistent-hashing"] },
      { q: "What causes a hot shard under range partitioning?", a: "A monotonically increasing key (auto-increment id, timestamp) keeps exceeding every boundary you drew, so every new row lands in the same open-ended last range.", tags: ["hotspot"] },
      { q: "How do you fix an append-only hotspot on a range-sharded table?", a: "Continuously split the hot range as it fills so new writes redistribute onto a fresh shard (what Bigtable/CockroachDB automate), or hash the key instead and give up cheap range scans.", tags: ["hotspot"] },
      { q: "What happens when a query doesn't include the shard key?", a: "It becomes scatter-gather: fan out to every shard and merge results, paying S times the round trips instead of hitting one shard.", tags: ["querying"] },
      { q: "Why are cross-shard transactions avoided in practice?", a: "They require two-phase commit or a saga, both slower and more failure-prone than a single-node transaction, so systems co-locate related rows on one shard to avoid needing them.", tags: ["transactions"] },
      { q: "What is directory-based sharding?", a: "An explicit lookup service mapping key ranges/hash buckets to shard ids, instead of a pure formula — it adds a lookup hop but allows live rebalancing without a modulus changing.", tags: ["directory"] }
    ],
    sixtySecond: [
      "Explain hash vs range sharding, and why one hotspots on a monotonic key while the other is expensive to reshard.",
      "Walk through what breaks (joins, transactions, secondary indexes) once a single table becomes many shards, and how you'd mitigate each."
    ]
  }
};
