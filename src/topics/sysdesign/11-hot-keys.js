export default {
  id: "hot-keys",
  track: "sysdesign",
  title: "Sharding & Hot Keys",
  difficulty: 2,
  minutes: 15,
  tags: ["sharding", "hot-keys", "load-balancing", "salting", "replication"],

  explainer: [
    { type: "p", text: "**Sharding** means splitting your data across many separate machines (\"shards\"), so no single machine has to store all of it or handle all the write traffic by itself. Sharding solves that specific *storage and throughput* problem well. What it does absolutely nothing for is a *skew* problem: sometimes one single key — a celebrity's profile, a flash-sale item, a trending hashtag — receives dramatically more traffic than all the other 999,999 keys put together. That one key always lives on exactly one shard, no matter how the system is set up, and no clever routing scheme changes that basic fact." },

    { type: "h3", text: "Hashing balances keys, not the requests aimed at them" },
    { type: "p", text: "A hash function's job is judged entirely by how uniformly it spreads the **key space** — meaning, roughly equal numbers of *distinct keys* land on each shard. It has absolutely no concept of how often any particular key is actually going to be requested. `hash(key) % N` will place a celebrity's key onto, say, shard 7, exactly as fairly as it places any other key — and from that point on, every single request for that key gets sent to shard 7, forever, because a hash function is deterministic (the same input always produces the same output). A perfect hash function is not a defense against a sudden popularity spike; it only guarantees that the spike lands on one *specific, unpredictable* shard, rather than a predictable one." },
    { type: "callout", tone: "pitfall", text: "This is exactly the same trap that consistent hashing (see the consistent-hashing lesson) does *not* solve: virtual nodes fix the *balance of the key space* when the number of servers changes, not the *distribution of request traffic* over that space. A celebrity key is still just one position on the ring, however many virtual nodes exist, and it still lands on exactly one physical node." },

    { type: "h3", text: "Range partitioning has its own, entirely different hot spot" },
    { type: "p", text: "**Range partitioning** — where each shard owns a contiguous range of keys, rather than keys being scattered by a hash function — is useful because it keeps related keys near each other, which makes range scans (reading a sequential block of keys) efficient. But real-world workloads are rarely spread evenly across the full range. Monotonically increasing keys (auto-incrementing ids, or event ids ordered by time) mean nearly all *currently arriving* writes fall into the newest, highest slice of the range, which lives on exactly one shard. This produces a hot **shard**, as opposed to a hot **key** — and it happens even with zero celebrity traffic involved at all. Hash-based routing avoids this problem automatically, simply because a hash scatters sequential keys apart; range routing has to fight it directly, either by splitting the hot range preemptively or by throttling writes to that one tail partition." },

    { type: "h3", text: "The fixes, and what each one actually costs you" },
    { type: "list", items: [
      "**Salting** — deliberately rewrite one hot key into k separate sub-keys (`key#0` through `key#(k-1)`) and spread those sub-keys across different shards. Writes are distributed round-robin or by hashing the sub-key; a read that needs the *true, combined* value has to gather all k sub-keys and combine them (\"scatter-gather\"). This is the only one of these fixes that actually helps a **write**-heavy hot key, because it's the writes themselves that get spread out.",
      "**Replicate the hot key** — make r extra copies of it across r different shards, and route **read** traffic to a randomly-chosen replica. Cheap and simple to implement, but it only helps with reads: writes still all have to funnel through one designated primary copy (or you've reopened a consistency problem across replicas — see the quorums lesson for what that costs).",
      "**Put a cache in front of it** — for a read-heavy hot key, an in-process cache or a CDN-level cache absorbs the traffic entirely before it ever reaches a shard at all. This is the cheapest fix available whenever the value can tolerate being a few seconds out of date.",
      "**Request coalescing (also called single-flight)** — when many concurrent requests all arrive at once asking for the same key, execute the underlying fetch exactly once and hand that one result out to every single waiting request. This turns a stampede of duplicate requests into just one real piece of work.",
      "**Give it a dedicated shard** — once a specific key is *known* to be hot (see the detection technique below), pull it off the general shared pool of shards entirely and give it its own isolated capacity, so its overload can't starve unrelated keys that happen to share the same shard."
    ]},
    { type: "callout", tone: "pitfall", text: "Salting breaks single-key atomicity. An `INCR` (atomic increment) on a single key is, by definition, an all-or-nothing operation the database guarantees won't race with itself. Once that same logical counter is spread across k separate sub-keys, reading the true total requires summing all k of them together, and there is no longer any way to do a single atomic compare-and-swap across the whole logical value. Don't salt a key that needs an exact, immediately-consistent total — either accept an approximate, eventually-summed total, or don't salt it at all." },
    { type: "callout", tone: "tip", text: "Find hot keys by observing real traffic, never by guessing: track per-key request counts using a bounded-memory structure (a **count-min sketch**, which estimates counts using fixed memory regardless of how many distinct keys exist, or simple top-N sampling), and set alarms on the *ratio* between the busiest shard's load and the average shard's load — not on any single key's raw request count — because it's the busiest **shard** that will actually go down, and a shard can be overloaded by one hot key or by many merely-warm ones." },

    { type: "h3", text: "The numbers" },
    { type: "p", text: "If a single key draws even 10% of all traffic on a 20-shard cluster, that one shard ends up carrying roughly `10% + (90%/20) ≈ 14.5%` of the cluster's total load, against an ideal even share of `100%/20 = 5%` per shard — nearly 3× overloaded — while every other shard sits comfortably under capacity the entire time. A dashboard that only shows the cluster's *average* utilization will look perfectly fine throughout the incident; the actual problem lives entirely at the p100 (the single worst-case value across all shards, not an average), on one specific box." }
  ],

  glossary: [
    { term: "Sharding", plain: "Splitting a dataset across many separate machines (shards) so that no single machine has to store all of it or serve all the write traffic alone." },
    { term: "Hot key", plain: "A single key that receives dramatically more traffic than typical keys — like a celebrity's profile or a flash-sale item — enough to overload the one shard it happens to live on." },
    { term: "Key space", plain: "The full range of all possible keys a hashing or partitioning scheme has to distribute across shards — what a hash function is judged on spreading evenly." },
    { term: "Range partitioning", plain: "A sharding approach where each shard owns a contiguous range of keys (rather than keys being scattered by a hash), which keeps related keys close together and makes sequential range scans efficient." },
    { term: "Monotonic key", plain: "A key whose values keep increasing in a predictable order over time, such as an auto-incrementing id or a timestamp-based event id — a pattern that tends to concentrate all recent writes onto one partition under range routing." },
    { term: "Salting", plain: "Deliberately rewriting one hot key into several sub-keys spread across different shards, so writes to it get distributed instead of all landing on one machine." },
    { term: "Scatter-gather", plain: "A read pattern where a request has to be sent out to multiple places at once (like all the sub-keys a salted key was split into) and their individual results combined into one final answer." },
    { term: "Request coalescing (single-flight)", plain: "A technique where, if many concurrent requests all ask for the same thing at once, only one of them actually does the underlying work, and every other request simply waits for and shares that one result." },
    { term: "Count-min sketch", plain: "A compact data structure that estimates how many times each distinct item has occurred, using a small, fixed amount of memory regardless of how many different items exist — useful for detecting hot keys without tracking every key exactly." },
    { term: "p100 (max)", plain: "The single worst-case value observed across a whole set of measurements — for example, the busiest shard's load, as opposed to the average load across all shards." }
  ],

  complexity: {
    rows: [
      { operation: "Hash routing, regular key", time: "O(1)", space: "—", note: "uniform over the key SPACE, not over request rate" },
      { operation: "Range routing, monotonic keys", time: "O(1)", space: "—", note: "can concentrate ALL recent writes on the tail partition" },
      { operation: "Salted write/read", time: "O(k) fan-out", space: "k× keys", note: "k = salt factor; breaks single-key atomicity" },
      { operation: "Replicated hot key (read)", time: "O(1), r choices", space: "r× copies", note: "reads only; writes still funnel to the primary" },
      { operation: "Request coalescing", time: "O(1) + shared wait", space: "O(in-flight keys)", note: "collapses a thundering herd into 1 fetch" },
      { operation: "Hot-key detection", time: "O(1) per request", space: "O(sketch size)", note: "count-min sketch or top-N sampling" }
    ]
  },

  interview: {
    whyAsked: "This is the follow-up that catches people who memorized consistent hashing without understanding what it actually guarantees. The signal is recognizing immediately that balancing keys and balancing request load are different problems, then picking a fix that matches whether the hot key is read-heavy or write-heavy — and naming the atomicity cost of salting unprompted.",
    followUps: [
      { q: "Why doesn't a better hash function fix a hot key?", a: "A hash function's job is to spread the key SPACE uniformly; it has no notion of request rate. It will place a celebrity key on some shard exactly as fairly as any other key — and then, being a pure function, send every one of that key's requests to that same shard forever. The uniformity guarantee is about which shard OWNS the key, not about how much traffic that key generates." },
      { q: "When do you salt a key versus replicate it versus cache it?", a: "Salt when the hot key is write-heavy and you can tolerate giving up single-key atomicity — you need the writes themselves spread out. Replicate when the hot key is read-heavy and writes are rare — copy it to a few shards and read from any of them, leaving one primary for writes. Cache in front when the value can tolerate a little staleness — cheapest option, and it stops the traffic before it reaches sharding at all. Salting is the only one of the three that helps a write-heavy key." },
      { q: "How do you detect a hot key before it takes a shard down?", a: "Track per-key frequency with a bounded structure — a count-min sketch is standard because it's O(1) per request and fixed memory regardless of key cardinality — or sample a percentage of requests and keep a top-N heap. Alarm on shard-level skew (busiest shard's load ÷ average shard load), because that ratio is what predicts an outage; a raw per-key count without that context doesn't tell you whether it matters." },
      { q: "What's specifically wrong with salting an atomic counter?", a: "An INCR on one key is atomic by construction. Split it into k sub-keys and the true total only exists as the sum of k independent values — reading it exactly requires a scatter-gather across all k, and no single compare-and-swap can span the whole logical key anymore. If you need an exact, immediately-consistent total, don't salt; if an approximate or eventually-summed total is acceptable, salting is fine." },
      { q: "Range partitioning with monotonic ids — what's the hot spot and how do you fix it?", a: "Almost all current writes land in the highest, newest key range, which lives on a single partition — a hot SHARD from ordinary traffic, not a celebrity key. Fixes: hash routing (avoids it structurally, at the cost of range scans), pre-splitting the tail range preemptively before it gets hot, or a monotonic-id scheme that spreads writes across a small hashed prefix (e.g. bucket = hash(id) % small_k, appended to a time-ordered suffix) so range scans still mostly work but writes aren't glued to one partition." },
      { q: "Does consistent hashing help with hot keys at all?", a: "No, and that's the trap in the question. Consistent hashing (and its virtual nodes) improves the BALANCE of the key space when membership changes — it says nothing about the distribution of requests over that space. A single popular key is one ring position, however many virtual nodes exist, and it lands on exactly one physical node regardless. Hot keys need a request-level fix — salting, replication, or caching — layered on top of whatever routing scheme you use." }
    ]
  },

  code: [
    { lang: "python", label: "Salting: scatter writes, gather reads, and why atomicity dies", code: "import random\n\nSALT_K = 8   # tune to the shard count; more salt = flatter load, more fan-out cost\n\ndef salted_write(redis_cluster, key, amount):\n    \"\"\"Spread INCR-like writes across k sub-keys instead of one hot key.\"\"\"\n    sub = f\"{key}#{random.randrange(SALT_K)}\"\n    redis_cluster.incrby(sub, amount)          # atomic on the SUB-key only\n\ndef salted_read_total(redis_cluster, key):\n    \"\"\"The true value only exists as the sum across all k shards.\"\"\"\n    subs = [f\"{key}#{i}\" for i in range(SALT_K)]\n    values = redis_cluster.mget(subs)          # k round trips (or 1 pipelined)\n    return sum(int(v or 0) for v in values)\n\n# What you gave up: a single atomic compare-and-swap on `key` no longer\n# exists -- it would need to coordinate across k independent counters.\n# Never salt a key that needs an exact, immediately-consistent total\n# (e.g. \"reject this order if inventory < 1\"); salt view counts, like\n# counts, and other totals that tolerate eventual, approximate consistency." },
    { lang: "python", label: "Hot-key detection: a tiny count-min sketch", code: "import hashlib\n\nclass CountMinSketch:\n    \"\"\"Fixed memory regardless of key cardinality. Overestimates, never\n    underestimates -- exactly what you want for \"is this key too hot?\".\"\"\"\n    def __init__(self, width=2048, depth=4):\n        self.width, self.depth = width, depth\n        self.table = [[0] * width for _ in range(depth)]\n\n    def _hashes(self, key):\n        for d in range(self.depth):\n            h = hashlib.blake2b(f\"{d}:{key}\".encode(), digest_size=8).digest()\n            yield int.from_bytes(h, \"big\") % self.width\n\n    def add(self, key, n=1):\n        for d, idx in enumerate(self._hashes(key)):\n            self.table[d][idx] += n\n\n    def estimate(self, key):\n        return min(self.table[d][idx] for d, idx in enumerate(self._hashes(key)))\n\n\nsketch = CountMinSketch()\nSHARD_AVG_QPS = 4000        # measured, not guessed\nHOT_THRESHOLD = SHARD_AVG_QPS * 0.20   # one key eating 20% of a shard's budget\n\ndef on_request(key):\n    sketch.add(key)\n    if sketch.estimate(key) > HOT_THRESHOLD:\n        promote_to_hot_key_tier(key)     # start salting / replicating / caching it\n" },
    { lang: "javascript", label: "Request coalescing (single-flight) for a read-heavy hot key", code: "// Many concurrent requests for the SAME key collapse into one upstream\n// fetch; every waiter gets the same result. Turns a thundering herd on a\n// freshly-expired cache entry into a single origin request.\nconst inflight = new Map();   // key -> Promise\n\nasync function getWithCoalescing(key, fetchFn) {\n  if (inflight.has(key)) return inflight.get(key);   // join the existing fetch\n\n  const promise = fetchFn(key)\n    .finally(() => inflight.delete(key));            // clear once settled\n\n  inflight.set(key, promise);\n  return promise;\n}\n\n// Combine with a short TTL cache in front so that once the herd is\n// coalesced into one fetch, the NEXT wave of requests hits cache instead\n// of triggering another round trip at all." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 300 },

    params: [
      { key: "shards", label: "Shards", type: "int", min: 3, max: 8, default: 6 },
      { key: "mode", label: "Routing", type: "enum", options: ["hash", "range"], default: "hash" },
      { key: "hotWeight", label: "Celebrity traffic %", type: "int", min: 20, max: 80, default: 55 },
      { key: "fix", label: "Mitigation", type: "enum", options: ["none", "salt", "replicate"], default: "none" },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const SHARDS = params.shards;
      const MODE = params.mode;
      const HOT_PCT = params.hotWeight / 100;
      const FIX = params.fix;
      const TOTAL = 400;
      const KEYSPACE = 5000;

      const hash32 = (str) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
        h ^= h >>> 16; h = Math.imul(h, 2246822507) >>> 0;
        h ^= h >>> 13; h = Math.imul(h, 3266489909) >>> 0;
        return (h ^ (h >>> 16)) >>> 0;
      };

      const CELEB = "user:celebrity";
      const SALT_K = Math.min(SHARDS, 6);
      const REPLICAS = Math.min(SHARDS, 4);

      const shardOfHash = (key) => hash32(key) % SHARDS;
      const shardOfRange = (rank) => Math.min(SHARDS - 1, Math.floor((rank / KEYSPACE) * SHARDS));

      const counts = new Array(SHARDS).fill(0);
      const celebCounts = new Array(SHARDS).fill(0);
      let celebHits = 0, celebReads = 0, celebWrites = 0;

      const snap = (extra) => Object.assign({
        shards: SHARDS, mode: MODE, fix: FIX, hotPct: Math.round(HOT_PCT * 100),
        counts: counts.slice(), celebCounts: celebCounts.slice(),
        sent: 0, total: TOTAL, celebHits, note: ""
      }, extra || {});

      yield {
        label: `${SHARDS} shards, ${MODE} routing. One key ("${CELEB}") draws ${Math.round(HOT_PCT * 100)}% of ALL traffic — a viral post, a flash-sale SKU. Mitigation applied: ${FIX === "none" ? "none yet" : FIX}.`,
        phase: "init",
        state: snap()
      };

      let explainedNone = false, explainedFix = false;
      const CHUNK = 10;

      for (let i = 1; i <= TOTAL; i++) {
        const isCeleb = rng() < HOT_PCT;
        let shard;

        if (isCeleb) {
          celebHits += 1;
          const isRead = rng() < 0.9;
          if (isRead) celebReads += 1; else celebWrites += 1;

          if (FIX === "salt") {
            const sub = CELEB + "#" + Math.floor(rng() * SALT_K);
            shard = MODE === "hash" ? shardOfHash(sub) : shardOfRange(hash32(sub) % KEYSPACE);
          } else if (FIX === "replicate") {
            if (isRead) {
              const rep = Math.floor(rng() * REPLICAS);
              shard = MODE === "hash" ? shardOfHash(CELEB + "@" + rep) : (SHARDS - 1 - rep + SHARDS) % SHARDS;
            } else {
              shard = MODE === "hash" ? shardOfHash(CELEB) : shardOfRange(KEYSPACE - 1);
            }
          } else {
            shard = MODE === "hash" ? shardOfHash(CELEB) : shardOfRange(KEYSPACE - 1);
          }
          celebCounts[shard] += 1;

          if (FIX === "none" && !explainedNone) {
            explainedNone = true;
            yield {
              label: `First celebrity request: hash("${CELEB}") % ${SHARDS} = shard ${shard}. Every future request for this exact key hashes to the SAME value — there is no fix inside the hash function itself.`,
              phase: "explain",
              focus: [shard],
              state: snap({ sent: i, counts: counts.slice(), celebCounts: celebCounts.slice() })
            };
          } else if (FIX === "salt" && !explainedFix) {
            explainedFix = true;
            yield {
              label: `Salting in action: this request used a random sub-key in [0, ${SALT_K}) appended to "${CELEB}", landing on shard ${shard}. The same logical key is now ${SALT_K} physical keys, spread across shards.`,
              phase: "explain",
              focus: [shard],
              state: snap({ sent: i, counts: counts.slice(), celebCounts: celebCounts.slice() })
            };
          } else if (FIX === "replicate" && !explainedFix) {
            explainedFix = true;
            yield {
              label: `Replication in action: this ${isRead ? "READ" : "WRITE"} for "${CELEB}" ${isRead ? `picked replica shard ${shard} at random` : `still had to go to the primary, shard ${shard}`}. Reads fan out across replicas; writes do not.`,
              phase: "explain",
              focus: [shard],
              state: snap({ sent: i, counts: counts.slice(), celebCounts: celebCounts.slice() })
            };
          }
        } else if (MODE === "hash") {
          const key = "k:" + Math.floor(rng() * KEYSPACE);
          shard = shardOfHash(key);
        } else {
          // realistic range skew: most ordinary traffic also touches RECENT keys
          const rank = Math.min(KEYSPACE - 1, Math.floor(Math.pow(rng(), 0.35) * KEYSPACE));
          shard = shardOfRange(rank);
        }
        counts[shard] += 1;

        if (i % CHUNK === 0 || i === TOTAL) {
          const total = counts.reduce((a, b) => a + b, 0);
          const ideal = total / SHARDS;
          const maxShard = counts.indexOf(Math.max.apply(null, counts));
          const maxCount = counts[maxShard];
          const ratio = ideal > 0 ? maxCount / ideal : 1;
          yield {
            label: i === TOTAL
              ? `${total} requests replayed. Shard ${maxShard} took ${maxCount} (${(maxCount / total * 100).toFixed(0)}%) against an ideal share of ${(100 / SHARDS).toFixed(0)}% — ${ratio.toFixed(1)}× overloaded.`
              : `${total}/${TOTAL} requests. Shard ${maxShard} is at ${maxCount} (${ratio.toFixed(1)}× the ${ideal.toFixed(0)}-request ideal).`,
            phase: FIX !== "none" ? "fixed" : (ratio > 1.8 ? "melt" : "steady"),
            focus: [maxShard],
            state: snap({ sent: i, counts: counts.slice(), celebCounts: celebCounts.slice(), note: `hottest shard ${maxShard}: ${ratio.toFixed(1)}×` })
          };
        }
      }

      const total = counts.reduce((a, b) => a + b, 0);
      const ideal = total / SHARDS;
      const stddev = Math.sqrt(counts.reduce((acc, c) => acc + Math.pow(c - ideal, 2), 0) / SHARDS);
      const maxShard = counts.indexOf(Math.max.apply(null, counts));

      yield {
        label: FIX === "none"
          ? `Verdict: ${celebHits} requests (${(celebHits / TOTAL * 100).toFixed(0)}% of traffic) all hit the SAME key, and hash and range routing both send a single key to exactly one shard — routing scheme is irrelevant to this problem. Shard ${maxShard} carries ${counts[maxShard]}, load stddev ${stddev.toFixed(0)}.`
          : FIX === "salt"
            ? `Verdict: salting "${CELEB}" into ${SALT_K} sub-keys spread its ${celebHits} requests across up to ${SALT_K} shards. Load stddev dropped to ${stddev.toFixed(0)}. Cost: any read needing the TRUE total must scatter-gather all ${SALT_K} sub-keys and sum them — a single atomic increment on this key no longer exists.`
            : `Verdict: replicating "${CELEB}" across ${REPLICAS} shards spread its ${celebReads} reads (${(celebReads / Math.max(1, celebHits) * 100).toFixed(0)}% of its traffic). Its ${celebWrites} writes still funnel to one primary shard — replication fixes a read-heavy hot key, not a write-heavy one. Load stddev ${stddev.toFixed(0)}.`,
        phase: "done",
        state: snap({ sent: TOTAL, counts: counts.slice(), celebCounts: celebCounts.slice() })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const F = env.font.base, M = env.font.mono;
      const lab = (x, y, t, col, size, align, base) => {
        ctx.fillStyle = col; ctx.font = `${size || 11}px ${base ? F : M}`;
        ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
      };

      lab(16, 22, `${s.mode} routing · fix: ${s.fix}`, C.text, 13, "left", true);
      lab(W - 16, 22, `${s.sent}/${s.total} requests · ${s.hotPct}% to one key`, C.muted, 11, "right");

      const padX = 24, chartTop = 52, chartBottom = H - 74;
      const chartH = chartBottom - chartTop;
      const n = s.counts.length;
      const bw = Math.min(70, (W - padX * 2) / n - 14);
      const gap = ((W - padX * 2) - bw * n) / Math.max(1, n - 1 || 1);

      const total = s.counts.reduce((a, b) => a + b, 0);
      const ideal = total / n;
      const maxV = Math.max(1, Math.max.apply(null, s.counts), ideal * 1.6);

      const idealY = chartBottom - (ideal / maxV) * chartH;
      ctx.strokeStyle = C.axis; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padX, idealY); ctx.lineTo(W - padX, idealY); ctx.stroke();
      ctx.setLineDash([]);
      lab(W - padX, idealY - 5, `ideal ${ideal.toFixed(0)}`, C.muted, 9, "right");

      for (let i = 0; i < n; i++) {
        const x = padX + i * (bw + gap);
        const total_i = s.counts[i];
        const celeb_i = Math.min(total_i, s.celebCounts[i]);
        const normal_i = total_i - celeb_i;
        const hNormal = (normal_i / maxV) * chartH;
        const hCeleb = (celeb_i / maxV) * chartH;
        const overloaded = ideal > 0 && total_i > ideal * 1.8;

        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(x, chartTop, bw, chartH, 4); ctx.fill();

        ctx.fillStyle = C.viz1;
        ctx.beginPath(); ctx.roundRect(x, chartBottom - hNormal, bw, hNormal, 3); ctx.fill();

        ctx.fillStyle = overloaded ? C.danger : C.viz2;
        ctx.beginPath(); ctx.roundRect(x, chartBottom - hNormal - hCeleb, bw, hCeleb, 3); ctx.fill();

        if (overloaded) {
          ctx.strokeStyle = C.danger; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(x, chartTop, bw, chartH, 4); ctx.stroke();
        }

        lab(x + bw / 2, chartBottom + 16, "s" + i, C.text2, 11, "center");
        lab(x + bw / 2, chartBottom + 30, String(total_i), overloaded ? C.danger : C.muted, 10, "center");
        if (celeb_i > 0) lab(x + bw / 2, chartTop - 6, celeb_i + " celeb", overloaded ? C.danger : C.viz2, 9, "center");
      }

      lab(padX, H - 34, s.note || "", C.warn, 11);

      const legY = H - 12;
      const legend = [["regular traffic", C.viz1], ["celebrity key", C.viz2], ["overloaded", C.danger]];
      legend.forEach((it, i) => {
        const lx = padX + i * 150;
        ctx.fillStyle = it[1]; ctx.fillRect(lx, legY - 8, 10, 10);
        lab(lx + 16, legY, it[0], C.text2, 10, "left");
      });
    }
  },

  drill: {
    cards: [
      { q: "Why doesn't a good hash function protect against a hot key?", a: "A hash function balances the KEY SPACE, not request rate. It sends a celebrity key to some shard exactly as evenly as any other key, then — being a pure function — routes every future request for that key to the same shard forever.", tags: ["hashing"] },
      { q: "Does consistent hashing solve hot keys?", a: "No. Its virtual nodes balance the key space when membership changes, but say nothing about request distribution over that space. One popular key is one ring position and lands on one physical node regardless of vnode count.", tags: ["pitfall"] },
      { q: "How does salting fix a hot key, and what does it cost?", a: "Rewrite the key into k sub-keys (`key#0..key#(k-1)`) spread across shards for writes; reads must scatter-gather all k and combine. Cost: the logical key loses single-key atomicity — no more single atomic INCR or compare-and-swap across the whole value.", tags: ["salting"] },
      { q: "When does replication help a hot key, and when doesn't it?", a: "Helps read-heavy hot keys: copy the value to r shards and route reads to any of them. Doesn't help write-heavy ones: writes still funnel to one primary (or you reopen a consistency problem across replicas).", tags: ["replication"] },
      { q: "What causes a hot SHARD under range partitioning with no celebrity key at all?", a: "Monotonic keys (auto-increment ids, time-ordered ids) put nearly all current writes in the newest, highest range, which lives on one partition. Hash routing avoids this structurally; range routing needs pre-splitting or a hashed prefix on the id.", tags: ["range-partitioning"] },
      { q: "How do you detect a hot key in production before it takes a shard down?", a: "A count-min sketch (fixed memory, O(1) per request) or top-N sampling of per-key frequency, with alarms on shard-level skew — busiest shard's load over average — since that ratio predicts the outage, not any single key's raw count.", tags: ["detection"] },
      { q: "What is request coalescing (single-flight) and what does it fix?", a: "Concurrent requests for the same key join a single in-flight fetch instead of each triggering their own; every waiter gets the same result. It collapses a thundering herd — e.g. many requests racing to repopulate a just-expired cache entry — into one upstream call.", tags: ["caching"] }
    ],
    sixtySecond: [
      "Explain why hashing and consistent hashing both fail to protect against a hot key, and what the actual fixes are.",
      "Explain salting versus replication for a hot key, including which traffic pattern each one fixes and what each one costs."
    ]
  }
};
