export default {
  id: "caching",
  track: "sysdesign",
  title: "Caching & Eviction",
  difficulty: 1,
  minutes: 15,
  tags: ["caching", "lru", "lfu", "ttl", "thundering-herd", "invalidation"],

  explainer: [
    { type: "p", text: "A cache is a bet that the *next* request looks like the *last* one. Everything interesting about caching follows from three questions: **what do you evict**, **when does it go stale**, and **what happens the instant it disappears**." },

    { type: "h3", text: "The latency ladder — why caching pays" },
    { type: "list", items: [
      "L1 cache reference ≈ **1 ns**; main memory ≈ **100 ns**",
      "In-process cache hit ≈ **~0.1 µs**; Redis over the network ≈ **0.5–1 ms**",
      "SSD random read ≈ **100 µs**; a real indexed DB query ≈ **1–10 ms**",
      "Cross-region round trip ≈ **80–150 ms**"
    ]},
    { type: "p", text: "So a Redis hit is roughly **10× faster** than a DB query, and an in-process hit is **1000×** faster. That ratio is why hit rate matters so much: at 90% hit rate with a 1 ms cache and a 10 ms DB, average latency is `0.9×1 + 0.1×10 = 1.9 ms`. Push the hit rate to 99% and it is `1.09 ms`. Drop it to 50% and it is `5.5 ms` — **and your database load has gone up 5×**. The load-shedding effect, not the latency, is usually what saves you." },

    { type: "h3", text: "Eviction policies" },
    { type: "list", items: [
      "**LRU** — evict the least recently used. Cheap (hash map + doubly-linked list, O(1)), matches real temporal locality. Its failure mode is a **scan**: one full table sweep evicts your entire working set.",
      "**LFU** — evict the least frequently used. Resists scans, but suffers *cache pollution*: a key that was hot last week keeps a high count forever. Real systems use **windowed/decaying LFU** (TinyLFU, as in Caffeine) — a frequency sketch over a sliding window plus an LRU admission window.",
      "**FIFO / CLOCK** — cheapest to implement, no per-access bookkeeping; CLOCK approximates LRU with one reference bit and is what OS page caches actually use.",
      "**Random** — genuinely fine at large scale, and immune to adversarial access patterns. Redis's `allkeys-random` exists for a reason."
    ]},

    { type: "h3", text: "The three write strategies" },
    { type: "list", items: [
      "**Cache-aside (lazy loading)** — app reads cache, misses, reads DB, writes cache. Default choice. Only cached data is ever requested; the cost is a miss penalty on cold data and a race window on concurrent write+fill.",
      "**Write-through** — write cache and DB together. Cache is never stale, writes are slower, and you cache data nobody may ever read.",
      "**Write-behind (write-back)** — write cache, flush to DB asynchronously. Fastest writes, absorbs spikes, and **you lose data if the cache dies before the flush**. Only acceptable for tolerant data (counters, view tallies)."
    ]},

    { type: "callout", tone: "pitfall", text: "On a write, **delete the cache entry, don't update it**. Two concurrent writers can interleave their cache updates in the opposite order to their DB commits, leaving the cache permanently wrong. Deleting is idempotent and forces a fresh read." },

    { type: "h3", text: "The three failure modes worth naming" },
    { type: "list", items: [
      "**Thundering herd / stampede** — a hot key expires and 5,000 concurrent requests all miss and all hit the database at once. Fixes: **single-flight** (one request fetches, the rest wait on the same promise), a short **mutex/lease** on the key, or **stale-while-revalidate** (serve the expired value while one worker refreshes).",
      "**Cache penetration** — repeated requests for keys that don't exist bypass the cache entirely and hammer the DB. Fix: cache the negative result with a short TTL, or a **Bloom filter** of existing keys in front.",
      "**Cache avalanche** — everything you warmed at deploy time has the same TTL and expires in the same second. Fix: **jitter the TTL**, e.g. `ttl × (0.9 + 0.2·random())`."
    ]},

    { type: "h3", text: "Invalidation" },
    { type: "p", text: "TTL is not invalidation, it is *bounded staleness you chose*. A 60 s TTL means you have agreed to serve data up to 60 s old. Real invalidation needs an event: delete-on-write, a CDC stream off the DB's replication log, or versioned keys (`user:42:v7`) where a bump makes every old key unreachable and it ages out on its own." },

    { type: "callout", tone: "tip", text: "In an interview, always state your hit-rate assumption and derive the DB load from it. \"At 95% hit rate, 100k rps of reads becomes 5k rps at the database\" is the sentence that shows you understand what a cache is *for*." }
  ],

  complexity: {
    rows: [
      { operation: "LRU get / put", time: "O(1)", space: "O(capacity)", note: "hash map + doubly-linked list" },
      { operation: "LFU get / put", time: "O(1)", space: "O(capacity)", note: "freq buckets of linked lists" },
      { operation: "TTL expiry", time: "O(1) lazy, O(n) sampled", space: "O(1)", note: "Redis samples on access + a background sweep" },
      { operation: "Avg read latency", time: "h·t_cache + (1−h)·(t_cache + t_db)", space: "—", note: "a miss costs you the lookup too" },
      { operation: "DB load", time: "(1−h) × rps", space: "—", note: "the number that actually matters" }
    ]
  },

  interview: {
    whyAsked: "Caching is where you find out whether a candidate reasons about *consistency and failure*, or just says 'add Redis'. The signal is naming a specific eviction policy with its failure mode, choosing delete-over-update on writes, and knowing what happens the microsecond a hot key expires.",
    followUps: [
      { q: "LRU or LFU — pick one and justify it.", a: "LRU by default: it is O(1), trivially correct, and matches how real traffic exhibits temporal locality. I switch when the workload has a periodic scan (an analytics job walking the whole table) which LRU handles catastrophically — it flushes the working set. Then I want scan resistance: LFU, or better W-TinyLFU, which keeps a decaying frequency sketch plus a small LRU admission window so a one-off scan never gets admitted at all." },
      { q: "A celebrity key expires and you get 10,000 simultaneous misses. What happens and what do you do?", a: "All 10,000 requests miss, all issue the same DB query, the DB saturates, latency spikes, and requests time out and retry — that is the stampede. The fix is single-flight: the first miss takes a per-key lock or in-flight-promise map and does the fetch, everyone else waits on it, so the DB sees exactly one query. Better still, serve stale-while-revalidate: return the expired value immediately and refresh in the background, so nobody waits at all. And always jitter TTLs so keys don't expire in lockstep." },
      { q: "Why delete the cache key on write instead of updating it?", a: "Because two concurrent writers can commit to the DB in one order and update the cache in the other, leaving a permanently wrong value with no self-healing. Deletion is idempotent — whatever order the deletes land, the next read repopulates from the DB. The residual race (a slow reader writing back a stale value it read before someone else's commit) is small, and is closed by delayed double-delete or by versioning the key." },
      { q: "How do you keep a cache consistent with the database?", a: "You don't get strong consistency cheaply — you pick a bounded staleness. Cache-aside with delete-on-write plus a modest TTL as a safety net covers most cases. If staleness genuinely matters, drive invalidation off the database's replication log via CDC (Debezium reading the binlog), which is ordered and survives an app crash mid-write — the failure mode of app-side deletes. For read-your-own-writes specifically, route the user's reads to the primary, or write a short-lived per-user marker that forces a cache bypass." },
      { q: "Where would you put the cache — in the process, or in Redis?", a: "Both, in layers. An in-process LRU is ~0.1 µs and takes the hottest few thousand keys and all the network cost with it, but every replica has its own copy so invalidation is a broadcast problem and memory is duplicated N times. Redis is ~0.5 ms, shared, invalidated once, and can hold far more. The standard shape is a small local cache with a very short TTL (seconds) in front of a large shared Redis — accept the local staleness explicitly." },
      { q: "How do you size the cache?", a: "Start from the working set, not the total data. Plot hit rate vs cache size — it is a sharply diminishing curve, and the knee is where you stop paying. Concretely: if 20% of keys serve 80% of traffic, caching that 20% gets you to ~80% hit rate and the next 20% of memory buys maybe 8 points. Then check the memory bill against the DB replicas that hit rate lets you *not* buy." }
    ]
  },

  code: [
    { lang: "python", label: "LRU cache from scratch (map + doubly-linked list)", code: "class Node:\n    __slots__ = (\"k\", \"v\", \"prev\", \"next\", \"exp\")\n    def __init__(self, k, v, exp):\n        self.k, self.v, self.exp = k, v, exp\n        self.prev = self.next = None\n\nclass LRUCache:\n    def __init__(self, capacity):\n        self.cap = capacity\n        self.map = {}\n        self.head = Node(None, None, 0)     # MRU sentinel\n        self.tail = Node(None, None, 0)     # LRU sentinel\n        self.head.next, self.tail.prev = self.tail, self.head\n\n    def _unlink(self, n):\n        n.prev.next, n.next.prev = n.next, n.prev\n\n    def _push_front(self, n):\n        n.next, n.prev = self.head.next, self.head\n        self.head.next.prev = self.head.next = n\n\n    def get(self, k, now):\n        n = self.map.get(k)\n        if n is None:\n            return None                      # miss\n        if n.exp and now >= n.exp:            # lazy TTL expiry\n            self._unlink(n); del self.map[k]\n            return None\n        self._unlink(n); self._push_front(n)  # touch -> becomes MRU\n        return n.v\n\n    def put(self, k, v, now, ttl=None):\n        if k in self.map:\n            self._unlink(self.map[k])\n        elif len(self.map) >= self.cap:\n            victim = self.tail.prev           # evict LRU\n            self._unlink(victim); del self.map[victim.k]\n        n = Node(k, v, now + ttl if ttl else 0)\n        self.map[k] = n\n        self._push_front(n)" },
    { lang: "python", label: "Cache-aside with single-flight + TTL jitter", code: "import asyncio, random\n\n_inflight = {}          # key -> Future, THE stampede fix\n\nasync def get_user(uid):\n    key = f\"user:{uid}\"\n    hit = await redis.get(key)\n    if hit is not None:\n        return decode(hit)\n\n    # Single-flight: only the first misser touches the database.\n    fut = _inflight.get(key)\n    if fut is not None:\n        return await fut                    # 9,999 requests park here\n\n    fut = asyncio.get_event_loop().create_future()\n    _inflight[key] = fut\n    try:\n        row = await db.fetch_one(\"SELECT * FROM users WHERE id=$1\", uid)\n        if row is None:\n            # Negative caching: stops cache PENETRATION on bogus ids.\n            await redis.set(key, TOMBSTONE, ex=30)\n        else:\n            ttl = int(300 * (0.9 + 0.2 * random.random()))  # jitter -> no avalanche\n            await redis.set(key, encode(row), ex=ttl)\n        fut.set_result(row)\n        return row\n    except Exception as e:\n        fut.set_exception(e)\n        raise\n    finally:\n        _inflight.pop(key, None)\n\nasync def update_user(uid, patch):\n    await db.update(uid, patch)\n    await redis.delete(f\"user:{uid}\")       # DELETE, never SET\n    # optional: delayed double-delete to close the slow-reader race\n    asyncio.create_task(_delayed_delete(f\"user:{uid}\", 0.5))" },
    { lang: "javascript", label: "Stale-while-revalidate", code: "// Nobody ever waits for a refresh: the expired value is served immediately\n// and exactly one background job repopulates it.\nasync function swr(key, fetcher, { fresh = 60_000, stale = 600_000 }) {\n  const e = store.get(key);                       // { value, at }\n  const age = e ? Date.now() - e.at : Infinity;\n\n  if (e && age < fresh) return e.value;           // fresh hit\n\n  if (e && age < stale) {                         // stale but usable\n    if (!refreshing.has(key)) {                   // single-flight the refresh\n      refreshing.add(key);\n      fetcher(key)\n        .then(v => store.set(key, { value: v, at: Date.now() }))\n        .finally(() => refreshing.delete(key));\n    }\n    return e.value;                               // serve stale NOW\n  }\n  return await coalesce(key, fetcher);            // truly cold: must wait\n}" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 320 },

    params: [
      { key: "capacity", label: "Cache slots", type: "int", min: 3, max: 10, default: 6 },
      { key: "policy", label: "Eviction", type: "enum", options: ["lru", "lfu", "fifo"], default: "lru" },
      { key: "keyspace", label: "Distinct keys", type: "int", min: 8, max: 30, default: 16 },
      { key: "ttl", label: "TTL (ticks, 0 = off)", type: "int", min: 0, max: 40, default: 0 },
      { key: "requests", label: "Requests", type: "int", min: 24, max: 90, default: 50 },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const CAP = params.capacity;
      const K = params.keyspace;
      const TTL = params.ttl;
      const N = params.requests;
      const POL = params.policy;

      // Zipf-ish popularity: key 0 is the celebrity.
      const weights = [];
      let wsum = 0;
      for (let i = 0; i < K; i++) { const w = 1 / Math.pow(i + 1, 1.1); weights.push(w); wsum += w; }
      const pick = () => {
        let r = rng() * wsum;
        for (let i = 0; i < K; i++) { r -= weights[i]; if (r <= 0) return i; }
        return K - 1;
      };

      let entries = [];   // { key, lastUsed, freq, insertedAt, expiresAt }
      let hits = 0, misses = 0, expired = 0, evictions = 0;
      let originNaive = 0, originSF = 0;
      const stream = [];
      const rate = [];

      const snapEntries = () => entries.map((e) => ({
        key: e.key, lastUsed: e.lastUsed, freq: e.freq, insertedAt: e.insertedAt, expiresAt: e.expiresAt
      }));
      const stack = () => entries.slice().sort((a, b) => b.lastUsed - a.lastUsed).map((e) => e.key);

      const base = (t, extra) => Object.assign({
        entries: snapEntries(), order: stack(), cap: CAP, policy: POL, ttl: TTL,
        t: t, hits: hits, misses: misses, expired: expired, evictions: evictions,
        originNaive: originNaive, originSF: originSF,
        stream: stream.slice(-14), rate: rate.slice(), keyspace: K,
        cur: null, result: "", victim: null, conc: 1
      }, extra || {});

      yield {
        label: `${CAP}-slot ${POL.toUpperCase()} cache over ${K} keys with Zipf traffic (k0 is the celebrity). ${TTL ? `TTL = ${TTL} ticks.` : "No TTL — entries live until evicted."}`,
        phase: "init",
        state: base(0)
      };

      for (let t = 1; t <= N; t++) {
        const kid = pick();
        const key = "k" + kid;
        // The celebrity key attracts concurrent duplicate requests — that is what
        // makes its expiry a stampede rather than a single miss.
        const conc = kid === 0 ? 3 + Math.floor(rng() * 5) : 1;

        // --- lazy TTL expiry on access ---------------------------------------
        if (TTL > 0) {
          const before = entries.length;
          const dead = entries.filter((e) => e.expiresAt > 0 && t >= e.expiresAt).map((e) => e.key);
          if (dead.length) {
            entries = entries.filter((e) => !(e.expiresAt > 0 && t >= e.expiresAt));
            expired += before - entries.length;
            yield {
              label: `Tick ${t}: TTL expired ${dead.join(", ")} — expiry is not a miss yet, but it is a miss waiting to happen. Un-jittered TTLs expire in lockstep: that is an avalanche.`,
              phase: "expire",
              state: base(t, { cur: null, result: "expire", victim: dead.join(",") })
            };
          }
        }

        const idx = entries.findIndex((e) => e.key === key);
        if (idx >= 0) {
          hits += 1;
          const e = entries[idx];
          const next = entries.slice();
          next[idx] = { key: e.key, lastUsed: t, freq: e.freq + 1, insertedAt: e.insertedAt, expiresAt: e.expiresAt };
          entries = next;
          stream.push({ key: key, hit: true });
          const hr = hits / (hits + misses);
          rate.push(hr);
          yield {
            label: `HIT on ${key} (freq ${entries[idx].freq}). ${POL === "lru" ? `${key} moves to the top of the recency stack.` : POL === "lfu" ? `Frequency count bumps; recency is ignored.` : `FIFO ignores the touch entirely — insertion order is all that matters.`} Hit rate ${(hr * 100).toFixed(0)}%.`,
            phase: "hit",
            focus: [kid],
            state: base(t, { cur: key, result: "hit", conc: conc })
          };
        } else {
          misses += 1;
          originNaive += conc;     // every concurrent misser hits the origin
          originSF += 1;           // single-flight collapses them into one
          stream.push({ key: key, hit: false });

          let victim = null;
          if (entries.length >= CAP) {
            let vi = 0;
            for (let i = 1; i < entries.length; i++) {
              if (POL === "lru" && entries[i].lastUsed < entries[vi].lastUsed) vi = i;
              else if (POL === "lfu" && (entries[i].freq < entries[vi].freq ||
                (entries[i].freq === entries[vi].freq && entries[i].lastUsed < entries[vi].lastUsed))) vi = i;
              else if (POL === "fifo" && entries[i].insertedAt < entries[vi].insertedAt) vi = i;
            }
            victim = entries[vi].key;
            evictions += 1;
            entries = entries.slice(0, vi).concat(entries.slice(vi + 1));
          }
          entries = entries.concat([{ key: key, lastUsed: t, freq: 1, insertedAt: t, expiresAt: TTL > 0 ? t + TTL : -1 }]);
          const hr = hits / (hits + misses);
          rate.push(hr);

          const herd = conc > 1
            ? ` ${conc} concurrent requests all missed the same key: ${conc} origin fetches naively, 1 with single-flight (${originNaive} vs ${originSF} so far).`
            : "";
          yield {
            label: `MISS on ${key} → fetch from origin, insert.${victim ? ` Evicted ${victim} (${POL === "lru" ? "least recently used" : POL === "lfu" ? "lowest frequency" : "oldest insertion"}).` : ""}${herd} Hit rate ${(hr * 100).toFixed(0)}%.`,
            phase: "miss",
            focus: [kid],
            state: base(t, { cur: key, result: "miss", victim: victim, conc: conc })
          };
        }
      }

      const hr = hits / Math.max(1, hits + misses);
      yield {
        label: `Final: ${hits} hits / ${misses} misses = ${(hr * 100).toFixed(1)}% hit rate with ${CAP} slots for ${K} keys. Origin saw ${originNaive} fetches; with single-flight it would have seen ${originSF} — a ${(originNaive / Math.max(1, originSF)).toFixed(1)}× reduction in database load for one lock.`,
        phase: "done",
        state: base(N, { cur: null, result: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors, W = env.width, H = env.height;
      const s = frame.state;
      ctx.clearRect(0, 0, W, H);

      const M = env.font.mono, F = env.font.base;
      const label = (x, y, t, col, size, align, mono) => {
        ctx.fillStyle = col; ctx.font = `${size || 11}px ${mono === false ? F : M}`;
        ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
      };

      // ---- request stream (top strip) ----------------------------------------
      const sx = 16, sy = 30, tw = 30, th = 22;
      label(sx, sy - 10, "request stream (recent →)", C.muted, 10);
      for (let i = 0; i < s.stream.length; i++) {
        const r = s.stream[i];
        const x = sx + i * (tw + 4);
        const isCur = i === s.stream.length - 1;
        ctx.fillStyle = r.hit ? C.viz3 : C.viz2;
        ctx.globalAlpha = isCur ? 1 : 0.35 + 0.5 * (i / Math.max(1, s.stream.length));
        ctx.beginPath(); ctx.roundRect(x, sy, tw, th, 4); ctx.fill();
        ctx.globalAlpha = 1;
        label(x + tw / 2, sy + 15, r.key, C.text, 10, "center");
        if (isCur) {
          ctx.strokeStyle = C.text; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(x - 1.5, sy - 1.5, tw + 3, th + 3, 5); ctx.stroke();
        }
      }

      // ---- cache slots --------------------------------------------------------
      const cy = sy + th + 34;
      const slotW = 76, slotH = 46;
      label(sx, cy - 8, `cache — ${s.entries.length}/${s.cap} slots (${s.policy.toUpperCase()})`, C.muted, 10);
      for (let i = 0; i < s.cap; i++) {
        const x = sx + i * (slotW + 8);
        const e = s.entries[i];
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(x, cy, slotW, slotH, 6); ctx.fill();
        ctx.strokeStyle = e && e.key === s.cur ? (s.result === "hit" ? C.viz3 : C.viz1) : C.border;
        ctx.lineWidth = e && e.key === s.cur ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(x, cy, slotW, slotH, 6); ctx.stroke();
        if (e) {
          label(x + slotW / 2, cy + 20, e.key, C.text, 14, "center");
          const ttlTxt = s.ttl > 0 && e.expiresAt > 0 ? `ttl ${Math.max(0, e.expiresAt - s.t)}` : `freq ${e.freq}`;
          label(x + slotW / 2, cy + 36, ttlTxt, C.muted, 9, "center");
        } else {
          label(x + slotW / 2, cy + 27, "empty", C.muted, 10, "center");
        }
      }
      if (s.victim && s.result === "miss") {
        label(sx + s.cap * (slotW + 8) + 6, cy + 27, `evicted ${s.victim} ✕`, C.viz8, 11);
      }

      // ---- recency stack (MRU top) -------------------------------------------
      const stx = W - 132, sty = cy + slotH + 26;
      label(stx, sty - 8, s.policy === "lru" ? "recency stack (MRU→LRU)" : "recency (informational)", C.muted, 10);
      for (let i = 0; i < s.order.length; i++) {
        const y = sty + i * 20;
        const isCur = s.order[i] === s.cur;
        ctx.fillStyle = isCur ? C.viz1 : C.surface2;
        ctx.beginPath(); ctx.roundRect(stx, y, 96, 17, 3); ctx.fill();
        label(stx + 8, y + 12, s.order[i], isCur ? C.text : C.text2, 11);
        label(stx + 88, y + 12, i === 0 ? "MRU" : (i === s.order.length - 1 ? "LRU" : ""), C.muted, 8, "right");
      }

      // ---- hit-rate gauge -----------------------------------------------------
      const total = s.hits + s.misses;
      const hr = total ? s.hits / total : 0;
      const gx = sx + 62, gy = H - 78, gr = 42;
      ctx.lineWidth = 11;
      ctx.strokeStyle = C.surface2;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, 2 * Math.PI); ctx.stroke();
      ctx.strokeStyle = hr > 0.85 ? C.ok : hr > 0.6 ? C.warn : C.danger;
      ctx.beginPath(); ctx.arc(gx, gy, gr, Math.PI, Math.PI + Math.PI * hr); ctx.stroke();
      label(gx, gy - 4, `${(hr * 100).toFixed(0)}%`, C.text, 20, "center");
      label(gx, gy + 12, "hit rate", C.muted, 10, "center");
      label(gx - gr, gy + 28, "0", C.muted, 9, "center");
      label(gx + gr, gy + 28, "100", C.muted, 9, "center");

      // ---- hit-rate history line ---------------------------------------------
      const lx = gx + gr + 34, lw = W - lx - 210, ly = H - 120, lh = 62;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(lx, ly); ctx.lineTo(lx, ly + lh); ctx.lineTo(lx + lw, ly + lh); ctx.stroke();
      ctx.strokeStyle = C.grid;
      ctx.beginPath(); ctx.moveTo(lx, ly + lh / 2); ctx.lineTo(lx + lw, ly + lh / 2); ctx.stroke();
      label(lx - 4, ly + 6, "1.0", C.muted, 9, "right");
      label(lx - 4, ly + lh / 2 + 4, "0.5", C.muted, 9, "right");
      label(lx - 4, ly + lh + 3, "0", C.muted, 9, "right");
      label(lx + lw / 2, ly - 6, "cumulative hit rate over time", C.muted, 10, "center");
      if (s.rate.length > 1) {
        ctx.strokeStyle = C.viz3; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < s.rate.length; i++) {
          const x = lx + (i / Math.max(1, s.rate.length - 1)) * lw;
          const y = ly + lh - s.rate[i] * lh;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // ---- origin-load counters ----------------------------------------------
      const ox = lx + lw + 22, oy = ly + 6;
      label(ox, oy, "origin fetches", C.muted, 10);
      label(ox, oy + 20, `naive:        ${s.originNaive}`, C.danger, 12);
      label(ox, oy + 38, `single-flight: ${s.originSF}`, C.ok, 12);
      label(ox, oy + 58, `evictions ${s.evictions}   expired ${s.expired}`, C.muted, 10);
      if (s.conc > 1 && s.result === "miss") {
        label(ox, oy + 76, `⚡ herd: ${s.conc} concurrent misses`, C.warn, 11);
      }
    }
  },

  drill: {
    cards: [
      { q: "Give the rough latency ladder: in-process cache, Redis, SSD, DB query, cross-region.", a: "In-process ~0.1 µs, Redis over the network ~0.5–1 ms, SSD random read ~100 µs, an indexed DB query ~1–10 ms, cross-region round trip ~80–150 ms.", tags: ["numbers"] },
      { q: "At 95% hit rate, what does a cache do to database load?", a: "It divides it by 20 — only the 5% of misses reach the DB. The load-shedding effect usually matters more than the latency win, and it is why a cache outage is catastrophic: the DB suddenly sees 20× its normal traffic.", tags: ["numbers"] },
      { q: "LRU's catastrophic failure mode?", a: "A sequential scan. One analytics job walking the whole table touches every key once, evicting the entire working set with data nobody will read again. Scan-resistant policies (LFU, W-TinyLFU with an admission window) exist for exactly this.", tags: ["eviction"] },
      { q: "Cache-aside vs write-through vs write-behind.", a: "Cache-aside: app fills on miss — default, but cold-start misses. Write-through: write both together — never stale, slower writes, caches unread data. Write-behind: write cache, flush later — fastest, absorbs spikes, loses data if the cache dies first.", tags: ["strategies"] },
      { q: "On a write, do you update or delete the cache entry? Why?", a: "Delete. Concurrent writers can update the cache in the opposite order to their DB commits, leaving a permanently wrong value. Deletion is idempotent and forces the next read to repopulate from the source of truth.", tags: ["consistency", "pitfall"] },
      { q: "What is a cache stampede and what are the three fixes?", a: "A hot key expires and every concurrent request misses and hits the DB at once. Fixes: single-flight (one fetch, the rest await it), a per-key lease/mutex, or stale-while-revalidate (serve the expired value, refresh in the background).", tags: ["failure-modes"] },
      { q: "Cache penetration vs cache avalanche.", a: "Penetration: requests for keys that don't exist always miss and always hit the DB — fix with negative caching or a Bloom filter. Avalanche: many keys share an expiry time and all expire together — fix by jittering TTLs, e.g. ttl × (0.9 + 0.2·rand).", tags: ["failure-modes"] },
      { q: "Why is TTL not the same as invalidation?", a: "TTL is bounded staleness you have chosen to accept — a 60 s TTL means you agreed to serve data up to 60 s old. Real invalidation is event-driven: delete-on-write, CDC off the replication log, or versioned keys.", tags: ["invalidation"] }
    ],
    sixtySecond: [
      "Explain cache-aside, why you delete rather than update on writes, and what happens when a celebrity key expires.",
      "Explain LRU vs LFU, each one's failure mode, and what W-TinyLFU does about it."
    ]
  }
};
