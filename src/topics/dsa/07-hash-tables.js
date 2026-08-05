// Lesson 07 — Hash Tables (track: dsa)
// Exactly one statement below, no imports, no top-level consts.
// `frames` is pure (uses only the injected `rng`); `draw` reads every colour from env.colors.

export default {
  id: "hash-tables",
  track: "dsa",
  title: "Hash Tables",
  difficulty: 1,
  minutes: 14,
  tags: ["hashing", "amortised-analysis", "data-structures"],

  explainer: [
    { type: "p", text: "A hash table (also called a hash map, or a dict in Python) is a data structure that lets you store and look up information by a label — a 'key' — almost instantly, no matter how much data is stored in it. Picture a library that, instead of forcing you to walk past every shelf checking book by book, calculates exactly which shelf your book belongs on directly from its title, so you can walk straight there every time. Compare that to a plain list, where finding something means checking items one by one from the start until you find a match — that gets slower and slower as the list grows. A hash table sidesteps that entirely by using a mathematical function to turn each key directly into a location, so lookup, insertion, and deletion all cost roughly the same tiny amount of work regardless of how many items are stored." },
    { type: "p", text: "The mechanism behind that is genuinely simple: a hash table turns a key into an **array index** using one formula, `index = hash(key) % capacity`. Here, `hash(key)` is a function that takes any key (a string, a number, anything) and deterministically produces some number from it — the same key always produces the same number. `capacity` is the current size of the underlying array the table is built on top of. The `%` symbol is the modulo operator, meaning 'remainder after division' — it takes whatever number `hash(key)` produced, which could be enormous, and squeezes it down into a valid array index between `0` and `capacity - 1`. That formula really is the entire core idea. Everything else a hash table does exists purely to handle the two problems that formula cannot solve on its own: two different keys landing on the exact same index by coincidence (called a **collision**), and the underlying array eventually filling up (called **load**)." },

    { type: "h3", text: "The invariant" },
    { type: "p", text: "The invariant a hash table maintains — the fact guaranteed to stay true after every operation — is: every key `k` currently stored in the table lives in the bucket at `hash(k) % capacity` (a 'bucket' is just the slot in the array at that index), and every lookup for that key checks **only** that one bucket, nowhere else. Because of this, any operation that changes `capacity` forces every single key to be recomputed and re-placed into a new bucket — that whole re-placing process is called a **rehash**, and it's precisely why changes to `capacity` are rare, all-at-once events rather than something that happens gradually, a little at a time." },

    { type: "h3", text: "Collisions: chaining vs open addressing" },
    { type: "list", items: [
      "**Separate chaining** — each bucket, instead of holding just one item, holds a small list of every key that happened to land there. (Python's built-in `dict` does not use this approach; Java's `HashMap` does, and even upgrades a bucket's list into a self-balancing tree structure once it grows past 8 entries, to keep worst-case lookups fast.) Chaining is simple to implement, tolerates a load factor (defined below) greater than 1 without breaking, and costs one extra pointer-following step per element stored in a bucket's list.",
      "**Open addressing** — instead of letting a bucket hold multiple items, a collision is resolved by probing: checking a sequence of *other* slots in the same array until an empty one is found (common strategies are linear probing — just check the next slot over — quadratic probing, or double hashing, which use different rules for which slot to check next). This approach is cache-friendly (see the sorting and heaps lessons for what that means) and never needs to allocate extra memory for a list, but deletion becomes tricky — it needs a special marker called a **tombstone** (explained below) — and performance degrades sharply as the table fills up.",
      "CPython's `dict` implementation uses open addressing with a specific 'perturbation-based' rule for choosing which slot to probe next, combined with a compact separate index array, which is also the implementation detail that happens to make Python's dicts preserve insertion order."
    ]},

    { type: "h3", text: "Load factor is the whole performance story" },
    { type: "p", text: "**Load factor**, written `α` (the Greek letter alpha), is defined as `α = size / capacity` — the number of keys currently stored, divided by the size of the underlying array. With separate chaining, the *expected* length of any one bucket's list works out to be exactly `α`, so a typical lookup costs `1 + α` operations (one hash computation, plus walking a list of expected length `α`). With open addressing, the expected number of slots you have to probe before finding an empty one for linear probing works out to roughly `(1 + 1/(1-α)²)/2` — a formula that stays small and manageable at `α = 0.75` but blows up catastrophically as `α` approaches `1` (e.g. at `α = 0.95` it's already very large). This is why real-world hash table implementations in Java and Go grow the table once `α` crosses `0.75` — an empirically-chosen sweet spot that balances wasted memory (too low a load factor) against slow probing (too high a load factor)." },

    { type: "code", lang: "python", code: "alpha = size / capacity\nif alpha > 0.75:          # amortised: this fires O(log n) times total\n    resize(capacity * 2)  # O(n) now, O(1) averaged over all inserts" },

    { type: "h3", text: "Why the resize is still O(1) per operation" },
    { type: "p", text: "At first glance, an operation that occasionally triggers an `O(n)` rehash (re-placing every single key) sounds like it should make insertion slow. But because the table always **doubles** its capacity when it resizes, these expensive rehashes only happen when the table's size has grown to 1, 2, 4, 8, …, `n` elements — a shrinking number of times as `n` grows. Adding up the total cost of every rehash that ever happens gives `1 + 2 + 4 + … + n`, which is a sum bounded by less than `2n`. Spread that total cost out — 'amortised' — evenly across the `n` inserts that collectively paid for it, and each individual insert only carries `O(1)` of extra work on average, even though a few unlucky inserts happen to trigger the expensive rehash themselves. If the table instead grew by a fixed, *constant* amount each time (say, always adding 8 more slots) instead of doubling, that same sum would become quadratic instead of linear — this is a classic amortised-analysis question in disguise, and it's worth being able to explain out loud." },

    { type: "callout", tone: "pitfall", text: "\"Hash tables are O(1)\" is an *average-case* statement, meaning it assumes the hash function spreads keys out roughly evenly across the array. Adversarial keys (deliberately chosen to collide) or unlucky, degenerate real-world keys can force every key into the same bucket, turning every single operation into an O(n) walk through one giant chain. Say \"expected O(1), worst case O(n)\" out loud — interviewers are specifically listening for that exact caveat." },

    { type: "h3", text: "Edge cases that separate candidates" },
    { type: "list", items: [
      "**Mutable keys** — if you change a key's value *after* it's already been inserted into the table, that changes what `hash(key)` would compute for it, but the entry itself doesn't move. The entry becomes 'orphaned': still physically sitting in the table, but permanently unreachable by any future lookup, since a lookup for the new (changed) key value will compute a completely different bucket. Keys must be immutable, or at least kept hash-stable — never changed while stored as a key.",
      "**Deletion under open addressing** — you cannot fix a deletion by simply emptying the slot, because an empty slot is exactly the signal a probe sequence uses to mean 'stop looking, the key you're searching for isn't here.' Blanking a slot mid-chain would silently make every key that comes later in that same probe sequence unreachable. The fix is to write a **tombstone** — a special 'deleted, but keep probing past me' marker — into the slot instead, and periodically rebuild the whole table once tombstones start to dominate it.",
      "**`hash` and equality must agree** — any two objects that are considered equal must also produce equal hash values, or the table breaks (two 'equal' keys could end up in different buckets and never find each other). In Python specifically, overriding an object's `__eq__` method (which defines equality) without also overriding `__hash__` makes the object unhashable altogether — the language's way of protecting you from accidentally creating this exact bug.",
      "**Iteration order is not a guarantee** — even if a particular hash table implementation happens, in practice, to iterate over its entries in a consistent order, relying on that order in an interview answer is a red flag unless the specific language's documentation explicitly promises that ordering."
    ]},

    { type: "callout", tone: "tip", text: "When a problem statement says \"count\", \"group\", \"have I seen this before?\", \"find a pair summing to k\", or \"anagram\", the answer is almost always a hash map — trading `O(n)` extra memory for cutting a factor of `n` off the running time (often turning an `O(n²)` brute-force scan into an `O(n)` single pass). Say that trade-off out loud before you start writing code." }
  ],

  glossary: [
    { term: "Hash function", plain: "A function that takes any key (a string, number, etc.) and deterministically turns it into a number — the same key always produces the same number." },
    { term: "Hash table / hash map", plain: "A data structure that stores key-value pairs and can look up a key in close to constant time, by using a hash function to compute exactly where that key should live." },
    { term: "Load factor (α)", plain: "The number of stored items divided by the size of the underlying array. It's the single number that predicts how much slower lookups get as the table fills up." },
    { term: "Collision", plain: "When two different keys happen to compute the same array index — something a hash table has to handle, since it can't be fully avoided." },
    { term: "Separate chaining", plain: "A way of handling collisions by letting each array slot hold a small list of every key that landed there, instead of just one." },
    { term: "Open addressing", plain: "A way of handling collisions by checking a sequence of other slots in the same array until an empty one is found, instead of storing a list at each slot." },
    { term: "Tombstone", plain: "A special 'deleted, but keep looking past me' marker left in a slot of an open-addressed table, used instead of simply emptying the slot, so later lookups still work correctly." },
    { term: "Rehash / resize", plain: "The process of building a new, larger underlying array and re-placing every existing key into it, triggered when the table gets too full." },
    { term: "Amortised O(1)", plain: "Almost every individual operation is cheap, and the rare expensive one (like a full rehash) is infrequent enough that its cost, spread out over all the operations, averages down to constant." },
    { term: "Adversarial input / hash flooding", plain: "Keys deliberately chosen by an attacker to all collide into the same bucket, turning every operation into a slow linear scan instead of a fast constant-time one." },
    { term: "SipHash", plain: "A hash function designed to be hard for an attacker to predict, because it uses a random, per-process secret key — this is what stops hash-flooding attacks." },
    { term: "Immutable key", plain: "A key whose value can never change after it's created. Hash table keys need this property (or at least a hash value that never changes) so the table doesn't lose track of where they're stored." },
    { term: "Expected vs worst case", plain: "Expected case is the typical, average performance assuming keys spread out reasonably; worst case is the slowest the operation could ever possibly be, such as when every key collides." }
  ],

  complexity: {
    rows: [
      { operation: "Lookup / insert / delete", time: "O(1) expected", space: "O(n)", note: "worst case O(n) — all keys in one bucket" },
      { operation: "Resize (rehash)", time: "O(n) once, O(1) amortised", space: "O(n)", note: "doubling makes the total cost < 2n" },
      { operation: "Iterate all pairs", time: "O(n + capacity)", space: "O(1)", note: "chaining walks empty buckets too" },
      { operation: "Build from n items", time: "O(n) expected", space: "O(n)", note: "includes all the rehashes" },
      { operation: "Ordered traversal", time: "O(n log n)", space: "O(n)", note: "must sort — use a balanced BST if you need order" }
    ]
  },

  interview: {
    whyAsked: "It is the fastest way to see whether a candidate understands *expected* versus *worst-case* cost and can defend an amortised argument. Everyone knows \"a dict is O(1)\"; the signal is whether you can explain the load factor, what a resize actually does, and what an adversary could do to your hash function.",
    followUps: [
      { q: "Chaining or open addressing — which would you implement and why?", a: "Open addressing for a fixed-size, performance-critical table of small values: everything lives in one contiguous array, so probes are cache hits and there is no per-node allocation. Chaining when the load factor is unpredictable or deletion is frequent, because it degrades gracefully past α = 1 and deletes are a simple list unlink with no tombstones. Modern implementations lean open-addressing (CPython, Swift, Abseil) because cache misses dominate the instruction count." },
      { q: "Why 0.75 specifically?", a: "It is empirical, not derived. Below it you waste a lot of memory for little speed gain; above it the expected probe count for open addressing grows steeply because it depends on 1/(1−α). Java picked 0.75 as the memory/speed compromise and documents it; Go grows at 6.5 entries per bucket because its buckets hold 8 slots each. The defensible answer is that it is a tunable knob whose right value depends on the collision strategy." },
      { q: "How would you attack a web server through its hash table?", a: "Hash flooding: if the hash function is public and unkeyed, an attacker sends thousands of POST parameters whose keys all collide, turning every insert into an O(n) chain walk and the whole request into O(n²) — a CPU denial of service. The fix is a keyed, randomly-seeded hash such as SipHash, which is why Python randomises `PYTHONHASHSEED` by default and Rust's default `HashMap` uses SipHash 1-3. It is a real CVE class, not a thought experiment." },
      { q: "Python dicts preserve insertion order — can I rely on that?", a: "In Python yes, since 3.7 it is a language guarantee, but it came from an implementation detail: the compact-dict layout stores entries in a dense insertion-ordered array with a separate sparse index array, and ordering fell out for free. In general, treat hash-map iteration order as unspecified — Go deliberately randomises it to stop people depending on it, and Java's HashMap order changes when the table resizes." },
      { q: "Give me a case where a hash map is the wrong choice.", a: "When you need range queries, ordered iteration, or a predecessor/successor — a balanced BST or a sorted array with binary search gives O(log n) for those, while a hash map gives you nothing but a full scan. Also when worst-case latency matters more than average: a single insert can trigger an O(n) rehash, which is unacceptable in a hard-real-time or low-jitter path, where an incrementally-resized or open-addressed fixed table is preferred." },
      { q: "How do you make an object usable as a key?", a: "Implement `__hash__` and `__eq__` consistently: equal objects must hash equally, and the fields the hash reads must never change while the object is in a table. In practice hash a tuple of the immutable identity fields, and make the object frozen/read-only. If it must be mutable, key the table by a stable id instead of the object itself." }
    ]
  },

  code: [
    { lang: "python", label: "Chaining hash map with resize", code: "class HashMap:\n    def __init__(self, capacity=8, load_factor=0.75):\n        self.capacity = capacity            # always a power of two -> % is a mask\n        self.load_factor = load_factor\n        self.size = 0\n        self.buckets = [[] for _ in range(capacity)]\n\n    def _index(self, key):\n        # `hash` is seeded per-process in CPython: same key, different runs, different hash.\n        return hash(key) & (self.capacity - 1)\n\n    def put(self, key, value):\n        b = self.buckets[self._index(key)]\n        for i, (k, _) in enumerate(b):\n            if k == key:                    # update in place: hash equal is not key equal\n                b[i] = (key, value)\n                return\n        b.append((key, value))\n        self.size += 1\n        if self.size / self.capacity > self.load_factor:\n            self._resize(self.capacity * 2)\n\n    def get(self, key, default=None):\n        for k, v in self.buckets[self._index(key)]:\n            if k == key:                    # compare keys, never trust the hash alone\n                return v\n        return default\n\n    def remove(self, key):\n        b = self.buckets[self._index(key)]\n        for i, (k, _) in enumerate(b):\n            if k == key:\n                b.pop(i)                    # chaining: deletion is a plain unlink\n                self.size -= 1\n                return True\n        return False\n\n    def _resize(self, new_capacity):\n        # O(n), but doubling means it happens O(log n) times -> O(1) amortised per put.\n        old = self.buckets\n        self.capacity = new_capacity\n        self.buckets = [[] for _ in range(new_capacity)]\n        for bucket in old:\n            for k, v in bucket:\n                self.buckets[hash(k) & (new_capacity - 1)].append((k, v))" },

    { lang: "python", label: "Open addressing + tombstones", code: "_EMPTY = object()      # never written\n_DEAD = object()       # tombstone: probing must walk THROUGH it\n\nclass OpenAddressed:\n    def __init__(self, capacity=8):\n        self.capacity = capacity\n        self.keys = [_EMPTY] * capacity\n        self.vals = [None] * capacity\n        self.size = 0          # live entries\n        self.used = 0          # live + tombstones (this is what triggers growth)\n\n    def _probe(self, key):\n        i = hash(key) & (self.capacity - 1)\n        while True:\n            yield i\n            i = (i + 1) & (self.capacity - 1)      # linear probing: cache-friendly, clusters\n\n    def put(self, key, value):\n        first_dead = None\n        for i in self._probe(key):\n            k = self.keys[i]\n            if k is _EMPTY:\n                slot = first_dead if first_dead is not None else i\n                self.keys[slot], self.vals[slot] = key, value\n                self.size += 1\n                if first_dead is None:\n                    self.used += 1\n                break\n            if k is _DEAD:\n                if first_dead is None:\n                    first_dead = i             # reuse it, but keep probing for a real match\n            elif k == key:\n                self.vals[i] = value\n                return\n        if self.used / self.capacity > 0.66:\n            self._resize()\n\n    def get(self, key, default=None):\n        for i in self._probe(key):\n            k = self.keys[i]\n            if k is _EMPTY:\n                return default                 # a true empty ends the probe chain\n            if k is not _DEAD and k == key:\n                return self.vals[i]\n\n    def remove(self, key):\n        for i in self._probe(key):\n            k = self.keys[i]\n            if k is _EMPTY:\n                return False\n            if k is not _DEAD and k == key:\n                self.keys[i] = _DEAD           # NOT _EMPTY: that would break later probes\n                self.vals[i] = None\n                self.size -= 1\n                return True\n\n    def _resize(self):\n        items = [(k, v) for k, v in zip(self.keys, self.vals)\n                 if k is not _EMPTY and k is not _DEAD]\n        self.capacity *= 2\n        self.keys = [_EMPTY] * self.capacity\n        self.vals = [None] * self.capacity\n        self.size = self.used = 0\n        for k, v in items:                     # rehash also sweeps every tombstone away\n            self.put(k, v)" },

    { lang: "python", label: "The interview patterns", code: "from collections import Counter, defaultdict\n\ndef two_sum(nums, target):\n    seen = {}                                  # value -> index, built as we scan\n    for i, x in enumerate(nums):\n        if target - x in seen:                 # one pass, O(n) time, O(n) space\n            return [seen[target - x], i]\n        seen[x] = i\n    return []\n\ndef group_anagrams(words):\n    groups = defaultdict(list)\n    for w in words:\n        groups[tuple(sorted(w))].append(w)     # canonical form as the key; tuple is hashable\n    return list(groups.values())\n\ndef top_k_frequent(nums, k):\n    # Counter is a hash map; most_common uses a heap -> O(n + k log n)\n    return [x for x, _ in Counter(nums).most_common(k)]\n\ndef longest_consecutive(nums):\n    s = set(nums)                              # O(1) membership is the whole trick\n    best = 0\n    for x in s:\n        if x - 1 in s:                         # only start counting at a run's left end\n            continue\n        y = x\n        while y + 1 in s:\n            y += 1\n        best = max(best, y - x + 1)\n    return best                                # O(n) total: each run is walked once" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 420 },

    params: [
      { key: "n",        label: "Keys to insert",  type: "int", min: 4,  max: 32, default: 14 },
      { key: "capacity", label: "Start capacity",  type: "int", min: 4,  max: 16, default: 8 },
      { key: "load",     label: "Grow at load %",  type: "int", min: 50, max: 95, default: 75 },
      { key: "seed",     label: "Reshuffle keys",  type: "seed" }
    ],

    frames: function* (params, rng) {
      const out = [];
      const MAXF = 400;

      const WORDS = [
        "ada", "bash", "cache", "delta", "echo", "flux", "gamma", "hash", "index",
        "jolt", "kernel", "lambda", "mutex", "node", "octet", "proxy", "quark",
        "raft", "stack", "token", "union", "vector", "warp", "xenon", "yield",
        "zeta", "atom", "byte", "cell", "dense", "edge", "fiber", "graph", "heap",
        "input", "join"
      ];

      // Fisher-Yates with the injected rng only -- deterministic for a given seed.
      const pool = WORDS.slice();
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }

      const n = Math.max(1, Math.min(32, Math.floor(params && params.n ? params.n : 14)));
      const keys = [];
      for (let i = 0; i < n; i++) {
        keys.push(i < pool.length ? pool[i] : pool[i % pool.length] + String(i));
      }

      // FNV-1a, truncated so the number fits on screen. Real hashes are 64-bit.
      const hashOf = function (s) {
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 16777619);
        }
        return (h >>> 0) % 1000003;
      };

      const want = Math.max(2, Math.min(16, Math.floor(params && params.capacity ? params.capacity : 8)));
      let cap = 1;
      while (cap < want) cap *= 2;
      const thr = Math.min(0.95, Math.max(0.5, (params && params.load ? params.load : 75) / 100));

      let buckets = [];
      for (let i = 0; i < cap; i++) buckets.push([]);
      let size = 0;
      let collisions = 0;

      const maxChain = function (bs) {
        let m = 0;
        for (let i = 0; i < bs.length; i++) if (bs[i].length > m) m = bs[i].length;
        return m;
      };
      const copyBuckets = function (bs) {
        return bs.map(function (b) { return b.map(function (e) { return { k: e.k, h: e.h }; }); });
      };
      const snap = function (extra) {
        const s = {
          capacity: cap,
          size: size,
          threshold: thr,
          total: n,
          buckets: copyBuckets(buckets),
          cur: null,
          rehash: false,
          oldCapacity: null,
          pending: [],
          moved: null,
          probe: null,
          collisions: collisions,
          maxChain: maxChain(buckets),
          remaining: 0
        };
        if (extra) for (const key in extra) s[key] = extra[key];
        return s;
      };
      const add = function (label, phase, state, focus) {
        if (out.length >= MAXF) return false;
        const f = { label: label, state: state, phase: phase };
        if (focus) f.focus = focus;
        out.push(f);
        return true;
      };

      add(
        "An empty table of " + cap + " buckets. The only rule: a key lives in bucket hash(key) % capacity, and lookups look nowhere else.",
        "init",
        snap({ remaining: n })
      );

      for (let i = 0; i < n && out.length < MAXF - 12; i++) {
        const k = keys[i];
        const h = hashOf(k);
        const idx = h % cap;

        add(
          'hash("' + k + '") = ' + h + ", so bucket = " + h + " % " + cap + " = " + idx +
            ". Two multiplications and a mask -- no key comparisons yet.",
          "hash",
          snap({ cur: { k: k, h: h, idx: idx }, remaining: n - i }),
          [idx]
        );

        const before = buckets[idx].length;
        if (before > 0) collisions++;
        buckets = buckets.map(function (b, bi) {
          return bi === idx ? b.concat([{ k: k, h: h }]) : b;
        });
        size++;

        add(
          before > 0
            ? "Collision: bucket " + idx + " already holds " + before + ' key' + (before === 1 ? "" : "s") +
              ', so "' + k + '" is chained onto the end. A lookup here now costs ' + (before + 1) + " key comparisons."
            : 'Bucket ' + idx + ' was empty, so "' + k + '" lands alone -- this is the O(1) case: one hash, one array index, one comparison.',
          "insert",
          snap({ cur: { k: k, h: h, idx: idx }, remaining: n - i - 1 }),
          [idx]
        );

        const alpha = size / cap;
        const over = alpha > thr;
        add(
          "Load factor = " + size + "/" + cap + " = " + alpha.toFixed(2) + " against a threshold of " + thr.toFixed(2) +
            ". " + (over
              ? "Over the line: chains are getting long, so the table must grow."
              : "Still under: the expected chain length is " + alpha.toFixed(2) + ", so lookups stay near one comparison."),
          "load",
          snap({ cur: { k: k, h: h, idx: idx }, remaining: n - i - 1 }),
          [idx]
        );

        if (over) {
          const oldCap = cap;
          const newCap = cap * 2;

          // Snapshot every live entry, remembering which old bucket it came from.
          const moving = [];
          for (let bi = 0; bi < buckets.length; bi++) {
            for (let ei = 0; ei < buckets[bi].length; ei++) {
              moving.push({ k: buckets[bi][ei].k, h: buckets[bi][ei].h, from: bi });
            }
          }

          const emptyNew = [];
          for (let z = 0; z < newCap; z++) emptyNew.push([]);
          buckets = emptyNew;
          cap = newCap;
          size = 0;
          collisions = 0;

          add(
            "REHASH: allocate " + newCap + " buckets (always a doubling) and re-place all " + moving.length +
              " keys. This one insert costs O(n) -- the amortised argument is what makes that acceptable.",
            "rehash",
            snap({
              rehash: true,
              oldCapacity: oldCap,
              pending: moving.map(function (m) { return { k: m.k, h: m.h, from: m.from }; }),
              remaining: n - i - 1
            })
          );

          for (let mi = 0; mi < moving.length && out.length < MAXF - 4; mi++) {
            const mv = moving[mi];
            const to = mv.h % newCap;
            const beforeMove = buckets[to].length;
            if (beforeMove > 0) collisions++;
            buckets = buckets.map(function (b, bi) {
              return bi === to ? b.concat([{ k: mv.k, h: mv.h }]) : b;
            });
            size++;
            const restPending = moving.slice(mi + 1).map(function (m) {
              return { k: m.k, h: m.h, from: m.from };
            });

            add(
              'Re-place "' + mv.k + '": the hash never changes (' + mv.h + "), but the modulus does -- " +
                mv.h + " % " + newCap + " = " + to + ", so it moves from old bucket " + mv.from + " to bucket " + to + ".",
              "rehash",
              snap({
                rehash: true,
                oldCapacity: oldCap,
                pending: restPending,
                moved: { k: mv.k, h: mv.h, from: mv.from, to: to },
                remaining: n - i - 1
              }),
              [to]
            );
          }

          add(
            "Rehash done: " + size + " keys in " + cap + " buckets, load " + (size / cap).toFixed(2) +
              ", longest chain " + maxChain(buckets) + ". Doubling means rehashes happen at sizes 1, 2, 4, 8, ... so their total cost is under 2n.",
            "rehash-done",
            snap({ remaining: n - i - 1 })
          );
        }
      }

      // A lookup, to show what the whole structure was built for.
      if (out.length < MAXF - 8 && n > 0) {
        const qi = Math.floor(rng() * n) % n;
        const q = keys[qi];
        const qh = hashOf(q);
        const qidx = qh % cap;

        add(
          'LOOKUP "' + q + '": hash it once (' + qh + "), mask it to bucket " + qh + " % " + cap + " = " + qidx +
            ". Everything so far was O(1) arithmetic -- the only variable cost is the chain.",
          "lookup",
          snap({ probe: { idx: qidx, pos: -1, hit: false } }),
          [qidx]
        );

        const chain = buckets[qidx];
        for (let p = 0; p < chain.length && out.length < MAXF - 3; p++) {
          const hit = chain[p].k === q;
          add(
            "Compare slot " + p + ' of bucket ' + qidx + ': "' + chain[p].k + '" vs "' + q + '" -> ' +
              (hit
                ? "match. Equal hashes are not enough; the key comparison is what confirms it."
                : "no match, keep walking the chain."),
            "lookup",
            snap({ probe: { idx: qidx, pos: p, hit: hit } }),
            [qidx]
          );
          if (hit) break;
        }

        add(
          'Found "' + q + '" after walking a chain of length ' + chain.length + ". With load " +
            (size / cap).toFixed(2) + " the expected chain length is exactly that load factor -- which is why we cap it.",
          "done",
          snap({ probe: { idx: qidx, pos: chain.length - 1, hit: true } }),
          [qidx]
        );
      }

      yield* out;
    },

    draw: function (frame, ctx, env) {
      const C = env.colors;
      const W = env.width;
      const H = env.height;
      const s = frame.state;
      const B = s.buckets;

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "alphabetic";

      const pad = 18;
      const alpha = s.capacity > 0 ? s.size / s.capacity : 0;
      const over = alpha > s.threshold;

      // ---- header -----------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText("capacity " + s.capacity + "   ·   size " + s.size + "   ·   longest chain " + s.maxChain, pad, 20);

      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText(
        "collisions " + s.collisions + "   keys left " + s.remaining + "/" + s.total,
        pad,
        36
      );

      // ---- load-factor bar --------------------------------------------------
      const barX = Math.round(W * 0.42);
      const barW = W - barX - pad - 4;
      const barY = 14;
      const barH = 14;

      ctx.fillStyle = C.surface2;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW, barH, 4);
      ctx.fill();

      const fillW = Math.max(0, Math.min(1, alpha)) * barW;
      ctx.fillStyle = over ? C.warn : C.viz4;
      ctx.beginPath();
      ctx.roundRect(barX, barY, Math.max(1, fillW), barH, 4);
      ctx.fill();

      const tickX = barX + s.threshold * barW;
      ctx.strokeStyle = C.text2;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(tickX, barY - 4);
      ctx.lineTo(tickX, barY + barH + 4);
      ctx.stroke();

      ctx.fillStyle = over ? C.warn : C.text2;
      ctx.font = "11px " + env.font.mono;
      ctx.textAlign = "left";
      ctx.fillText(
        "load " + alpha.toFixed(2) + " / grow at " + s.threshold.toFixed(2),
        barX,
        barY + barH + 17
      );

      // ---- current key chip -------------------------------------------------
      let top = 58;
      if (s.cur) {
        ctx.fillStyle = C.surface2;
        ctx.beginPath();
        ctx.roundRect(pad, top - 12, Math.min(W - pad * 2, 420), 24, 5);
        ctx.fill();
        ctx.fillStyle = C.viz1;
        ctx.font = "12px " + env.font.mono;
        ctx.textAlign = "left";
        ctx.fillText(
          '"' + s.cur.k + '"  h=' + s.cur.h + "  →  " + s.cur.h + " % " + s.capacity + " = bucket " + s.cur.idx,
          pad + 8,
          top + 4
        );
        top += 24;
      }

      // ---- pending queue during a rehash -------------------------------------
      // The status line gets its own reserved row, measured so it either fits
      // or ellipsizes at a word boundary -- it must never collide with the
      // pending-key badges, which always start on the NEXT row.
      if (s.rehash) {
        ctx.font = "11px " + env.font.base;
        ctx.textAlign = "left";
        const fullLabel = "re-placing from the old " + s.oldCapacity + "-bucket table (" + s.pending.length + " left):";
        const maxLabelW = W - pad * 2;
        let label = fullLabel;
        if (ctx.measureText(label).width > maxLabelW) {
          const words = fullLabel.split(" ");
          let acc = "";
          for (const word of words) {
            const trial = acc ? acc + " " + word : word;
            if (ctx.measureText(trial + "…").width > maxLabelW) break;
            acc = trial;
          }
          label = (acc || fullLabel.slice(0, 1)) + "…";
        }
        ctx.fillStyle = C.text2;
        ctx.fillText(label, pad, top + 4);
        top += 20; // own row: badges never share a baseline with this text

        let px = pad;
        for (let i = 0; i < s.pending.length && px < W - pad - 46; i++) {
          ctx.fillStyle = C.surface2;
          ctx.beginPath();
          ctx.roundRect(px, top - 9, 44, 16, 3);
          ctx.fill();
          ctx.fillStyle = C.muted;
          ctx.font = "9px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.fillText(s.pending[i].k.slice(0, 6), px + 22, top + 3);
          px += 47;
        }
        top += 22;
      }

      // ---- bucket grid ------------------------------------------------------
      const legendH = 22;
      const gridTop = top + 10;
      const gridH = H - gridTop - legendH - 6;
      const cols = s.capacity > 16 ? Math.ceil(s.capacity / 16) : 1;
      const rows = Math.ceil(s.capacity / cols);
      const colW = (W - pad * 2) / cols;
      const rowH = Math.min(64, gridH / Math.max(1, rows));
      const showText = rowH >= 13;
      const rowScale = Math.max(1, Math.min(2.3, rowH / 30));
      const slotX = 30 * Math.min(rowScale, 1.5);
      const entW = Math.min(150, Math.max(20, (colW - slotX - 20) / 4));

      for (let i = 0; i < s.capacity; i++) {
        const col = Math.floor(i / rows);
        const r = i % rows;
        const x = pad + col * colW;
        const y = gridTop + r * rowH;
        const chain = B[i] || [];
        const isCur = s.cur && s.cur.idx === i;
        const isProbe = s.probe && s.probe.idx === i;
        const isMoved = s.moved && s.moved.to === i;

        // row plate
        ctx.fillStyle = isCur || isProbe || isMoved ? C.surface2 : C.surface;
        ctx.beginPath();
        ctx.roundRect(x, y + 1, colW - 10, Math.max(6, rowH - 3), 4 * Math.min(rowScale, 1.6));
        ctx.fill();

        // bucket index
        if (showText) {
          ctx.fillStyle = isCur || isProbe ? C.text : C.muted;
          ctx.font = Math.round(10 * rowScale) + "px " + env.font.mono;
          ctx.textAlign = "right";
          ctx.fillText(String(i), x + slotX - 8, y + rowH / 2 + 4);
        }

        // empty-slot marker
        if (chain.length === 0) {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + slotX, y + rowH / 2);
          ctx.lineTo(x + slotX + Math.min(entW, 24), y + rowH / 2);
          ctx.stroke();
          continue;
        }

        const shown = Math.min(chain.length, Math.max(1, Math.floor((colW - slotX - 16) / entW)));
        for (let e = 0; e < shown; e++) {
          const ex = x + slotX + e * entW;
          const ent = chain[e];
          let fill = C.viz3; // settled
          if (s.cur && ent.k === s.cur.k) fill = C.viz1; // the key being inserted
          else if (s.moved && ent.k === s.moved.k) fill = C.viz2; // being re-placed
          if (s.probe && s.probe.idx === i && s.probe.pos === e) fill = s.probe.hit ? C.viz6 : C.viz5;

          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.roundRect(ex, y + 3, entW - 4, Math.max(5, rowH - 7), 3 * Math.min(rowScale, 1.6));
          ctx.fill();

          if (showText && entW > 26) {
            ctx.fillStyle = C.surface;
            ctx.font = Math.max(9, Math.round(9 * rowScale)) + "px " + env.font.mono;
            ctx.textAlign = "center";
            ctx.fillText(ent.k.slice(0, 9), ex + (entW - 4) / 2, y + rowH / 2 + 3);
          }

          // chain link: a collision is drawn as a visible hop
          if (e > 0) {
            ctx.strokeStyle = C.viz8;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(ex - 4, y + rowH / 2);
            ctx.lineTo(ex, y + rowH / 2);
            ctx.stroke();
          }
        }

        if (chain.length > shown && showText) {
          ctx.fillStyle = C.viz8;
          ctx.font = Math.max(9, Math.round(9 * rowScale)) + "px " + env.font.mono;
          ctx.textAlign = "left";
          ctx.fillText("+" + (chain.length - shown), x + slotX + shown * entW + 2, y + rowH / 2 + 3);
        }
      }

      // ---- legend -----------------------------------------------------------
      const ly = H - 8;
      let lx = pad;
      const chip = function (color, text) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(lx, ly - 8, 9, 9, 2);
        ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.base;
        ctx.textAlign = "left";
        ctx.fillText(text, lx + 13, ly);
        lx += 15 + ctx.measureText(text).width + 14;
      };
      chip(C.viz1, "key being inserted");
      chip(C.viz3, "settled entry");
      chip(C.viz8, "collision chain link");
      if (s.rehash) chip(C.viz2, "re-placed by rehash");
      else if (s.probe) chip(C.viz5, "lookup probe");
    }
  },

  drill: {
    cards: [
      { q: "State the one invariant every hash table maintains.", a: "Every live key is stored in bucket `hash(key) % capacity`, and lookups examine only that bucket (or only that probe sequence). Any change to `capacity` therefore forces a full rehash.", tags: ["invariant"] },
      { q: "Why is a hash-table insert O(1) *amortised* rather than O(1) worst case?", a: "A single insert can trigger a resize that re-places all n keys, which is O(n). But doubling makes resizes happen at sizes 1, 2, 4, …, n, whose total cost is < 2n, so the extra work per insert averages to O(1).", tags: ["amortised", "complexity"] },
      { q: "What breaks if you grow a hash table by a constant amount instead of doubling?", a: "Resizes become O(n/c) frequent instead of O(log n), and the total rehash work becomes O(n²) — the amortised cost per insert degrades from O(1) to O(n).", tags: ["amortised"] },
      { q: "Chaining vs open addressing: one advantage each.", a: "Chaining tolerates load factor > 1 and deletes with a simple unlink. Open addressing keeps everything in one contiguous array, so probes are cache hits and there is no per-entry allocation.", tags: ["collisions"] },
      { q: "Why can't you delete by blanking a slot in an open-addressed table?", a: "An empty slot terminates a probe sequence, so blanking it hides every key that probed past that slot. You must write a tombstone that probing walks through, and rebuild when tombstones accumulate.", tags: ["collisions", "pitfall"] },
      { q: "What is hash flooding and what is the fix?", a: "An attacker submits keys that all hash to the same bucket, turning every operation into an O(n) walk and the request into O(n²) CPU denial of service. The fix is a keyed, per-process randomly-seeded hash such as SipHash (Python's `PYTHONHASHSEED`, Rust's default `HashMap`).", tags: ["security", "worst-case"] },
      { q: "Expected chain length with separate chaining at load factor α?", a: "Exactly α, assuming uniform hashing — so a lookup costs 1 + α operations. That is why the load factor is capped at a small constant.", tags: ["complexity"] },
      { q: "Two rules an object must satisfy to be a hash-map key.", a: "Equal objects must have equal hashes (`__hash__`/`__eq__` consistent), and the hashed fields must not change while the object is in the table — a mutated key becomes unreachable in its old bucket.", tags: ["keys", "pitfall"] }
    ],
    sixtySecond: [
      "Explain the load factor: what it measures, what happens when it crosses the threshold, and why the resize still leaves inserts at O(1) amortised.",
      "Compare separate chaining with open addressing: collision handling, deletion, cache behaviour, and how each degrades as the table fills.",
      "Explain how an attacker could turn a hash table into a denial-of-service vector, and what a defensive implementation does about it."
    ]
  }
};
