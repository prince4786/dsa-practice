// 05-sorting.js — Merge Sort vs Quick Sort
// Visualizer: bar-height array on the LEFT, the live recursion tree on the RIGHT.
// Single-statement module: one default-exported object, no module-level anything else.
// `frames` is a pure generator (seeded rng only — no global randomness, no clock, no
// DOM) and never mutates an object it has already yielded. `draw` is a pure full
// redraw and takes every colour from env.colors.

export default {
  id: "sorting",
  track: "dsa",
  title: "Merge Sort vs Quick Sort",
  difficulty: 2,
  minutes: 16,
  tags: ["sorting", "divide-and-conquer", "recursion", "stability"],

  explainer: [
    { type: "p", text: "Sorting means putting a list of items into order — smallest to largest, alphabetical, cheapest to most expensive, whatever the rule is. It sounds like a solved, boring problem, but almost every piece of real software does it constantly (ranking search results, showing a leaderboard, preparing data for a fast lookup), so the specific algorithm you reach for actually matters once the list gets big. Merge sort and quick sort are the two most famous general-purpose sorting algorithms, and this lesson is about the trade-off between them — not just being able to recite either one from memory, but being able to say which one you'd actually pick and why." },
    { type: "p", text: "Both algorithms use a strategy called divide-and-conquer: break a big problem into two smaller copies of the same problem, solve each smaller copy the same way (by breaking it down further, recursively, until the pieces are trivially small), and then combine the results back into a full answer. Both run, on average, in `O(n log n)` time — `n` is the number of elements in the list, and `O(n log n)` (read 'linearithmic') means the running time grows a little faster than a straight line as `n` grows, but nowhere near as fast as `n²` (n squared) would. See the Big-O lesson for the full explanation of that notation; the short version here is: both algorithms scale well. The real difference between them is *where the work happens* during that divide-and-conquer process. Merge sort splits the array blindly down the middle — no comparisons at all — and only starts doing real work on the way back **up** out of the recursion, when it combines ('merges') two already-sorted halves into one sorted whole. Quick sort does the opposite: it does all its real work on the way **down**, by picking one value from the array (called the **pivot**) and rearranging everything so that every value smaller than the pivot ends up on one side and every value greater-or-equal ends up on the other — a step called **partitioning** — after which the way back up out of the recursion needs no more work at all." },
    { type: "h3", text: "The two invariants" },
    { type: "p", text: "Before looking at either algorithm's code, it helps to name its invariant: the one fact that is guaranteed to be true every time a given step finishes, and which is what lets you trust the algorithm's final answer without re-checking everything by hand." },
    { type: "list", items: [
      "**Merge sort**: once `merge_sort(a[lo:hi])` (a call that sorts the stretch of the array from index `lo` up to, but not including, `hi`) returns, that stretch is fully sorted. Combining two already-sorted sub-lists ('runs') that together hold `L` elements costs at most `L - 1` comparisons and exactly `L` writes, because you only ever need to compare the two current front elements of each run, one comparison per element placed.",
      "**Quick sort**: once `partition(a, lo, hi)` returns some index `p`, everything in `a[lo:p]` (the slice before `p`) is guaranteed to be `< a[p]`, and everything in `a[p+1:hi]` (the slice after `p`) is guaranteed to be `>= a[p]`. In other words, `a[p]` has landed in exactly the index it will hold in the final sorted array, and the algorithm never touches that index again."
    ]},
    { type: "p", text: "That second invariant is the whole reason quick sort needs no merge step at all: partitioning permanently places one element and turns the two remaining sides into two completely independent sub-problems, with nothing left to stitch back together afterward." },
    { type: "h3", text: "Stability" },
    { type: "p", text: "A sort is called **stable** if two elements that compare as equal keep their original relative order after sorting. For example, if you sort a list of people by last name only, a stable sort guarantees that two people who happen to share a last name stay in whatever order they were already in — first-come, first-served among ties. Merge sort is stable, and it comes down to *one single character* in its code: when merging, the moment the two runs' current front values are tied, it always takes from the left run first (written as `left[i] <= right[j]`, using 'less than or equal to' rather than strictly 'less than'). Change that one operator to strict `<` and equal keys can swap order. Quick sort, by contrast, is not stable — during partitioning, its swaps can move an element across a large distance in the array in one jump, so two equal keys can easily end up reordered relative to each other, and there is no simple fix for this." },
    { type: "callout", tone: "pitfall", text: "The classic trap interviewers set: they say \"quick sort is O(n log n)\" as if that's the whole story. It is O(n log n) *expected* (i.e. on typical/average input) — the worst case is O(n²), and if the pivot is always chosen as the first or last element, the worst-case input turns out to be an **already-sorted array**, which is exactly the kind of input a naive test happens to use. Say \"expected O(n log n), worst case O(n²)\" out loud in an interview to show you know the difference." },
    { type: "h3", text: "Why quick sort still wins in practice" },
    { type: "list", items: [
      "It is **in-place**, meaning it rearranges the original array using only a small, constant amount of extra memory, instead of allocating a whole second array to build the answer in. Merge sort, in its usual array-based form, needs an `O(n)` scratch buffer — a temporary second array roughly the same size as the input — to hold values mid-merge.",
      "Partitioning is a single sequential scan through the array with occasional swaps, which gives it near-perfect **cache locality** — a term for how well a program's memory-access pattern lines up with the way modern CPUs pull nearby memory into their fast on-chip cache ahead of time. Because quick sort mostly reads and writes memory in one direction, in order, the CPU's cache keeps up almost perfectly, which makes each individual step run very fast in practice (a small **constant factor**, the fixed multiplier that Big-O notation deliberately ignores but that still affects real wall-clock time).",
      "Merge sort's constant factor, by contrast, is dominated by copying values into and back out of that auxiliary buffer at every level of recursion — real memory-bandwidth cost that doesn't show up in the `O(n log n)` count of comparisons, even though the two algorithms' asymptotic (large-`n`) complexity classes are identical."
    ]},
    { type: "callout", tone: "tip", text: "Randomise the choice of pivot (or use the median of the first, middle, and last elements — called 'median-of-three') so that no adversarial *input*, meaning an input someone deliberately constructed to sabotage your specific pivot-choosing rule, can force the O(n²) worst case. With a randomised pivot, only bad luck can trigger it, and the probability of that vanishes as the array grows. Real-world libraries go further still: **introsort** (used by C++'s `std::sort`) keeps track of how deep the recursion has gone, and if it ever gets suspiciously deep — a sign the pivot choices are going badly — it bails out and finishes the job with heap sort instead, which guarantees `O(n log n)` no matter what." },
    { type: "h3", text: "Edge cases that bite" },
    { type: "list", items: [
      "Arrays of length 0 and 1 — this is the recursion's base case, the smallest input the recursive calls eventually bottom out at. An off-by-one mistake in how this base case is written is a common way to accidentally write an infinite loop.",
      "All-equal elements — a particular way of writing the partition step, called **Lomuto partitioning** (named after its inventor), degenerates to `O(n²)` when every element in the array is equal, because every comparison sends the element to the same side. The fix is **three-way partitioning**, also called the 'Dutch national flag' partitioning scheme, which splits the array into three zones in one pass — less-than, equal-to, and greater-than the pivot — and only recurses into the outer two zones, since the middle zone is already exactly where it needs to be.",
      "Recursing into the *larger* side first: if the code always recurses into the left side before the right side without thinking about which side is bigger, the **call stack** (the mechanism a program uses to keep track of pending recursive calls, with each nested call using a little bit of memory) can grow to `O(n)` in the worst case. The fix is to always recurse into the smaller side and handle the larger side with a loop instead of a nested call, which bounds the stack depth at `O(log n)`.",
      "Sorting objects by a key: if you need equal-key elements to keep their original order, you either need a stable sort (like merge sort), or you need to add an explicit tiebreaker — for example, sorting by `(key, original_index)` instead of just `key` — to force a consistent order even with an unstable sort."
    ]},
    { type: "code", lang: "python", code: "# The stability test an interviewer will actually run:\n#   sort [(1,'a'), (1,'b')] by the first field.\n# Stable  -> [(1,'a'), (1,'b')]\n# Unstable-> either order is legal." }
  ],

  glossary: [
    { term: "Divide-and-conquer", plain: "A strategy for solving a big problem by breaking it into smaller copies of the same problem, solving each smaller copy, and combining the results." },
    { term: "O(n log n) / linearithmic time", plain: "A running time that grows a bit faster than a straight line as the input grows, but far slower than the input squared. Typical of good general-purpose sorting algorithms." },
    { term: "Invariant", plain: "A fact that is guaranteed to be true every time a given step of an algorithm finishes — the thing you rely on to trust the final answer." },
    { term: "Stable sort", plain: "A sort where two elements that compare as equal keep their original relative order in the output, instead of possibly swapping places." },
    { term: "In-place", plain: "An algorithm that rearranges the original data using only a small, constant amount of extra memory, rather than building a whole separate copy." },
    { term: "Pivot / partition", plain: "The pivot is one chosen value from the array; partitioning is rearranging the array so everything smaller than the pivot ends up on one side and everything bigger ends up on the other." },
    { term: "Call stack", plain: "The mechanism a program uses to keep track of function calls that are still in progress, including recursive calls — each pending call uses a bit of memory until it returns." },
    { term: "Lomuto partition", plain: "One specific, simple way of writing the partitioning step of quick sort, which can slow to O(n²) when many elements are equal." },
    { term: "Three-way partitioning (Dutch national flag)", plain: "A way of partitioning an array into three groups in one pass — less than, equal to, and greater than the pivot — so that duplicate-heavy arrays don't slow quick sort down." },
    { term: "Cache locality", plain: "How well a program's pattern of memory access matches the way a computer's processor pre-loads nearby memory for speed. Reading data in order, from one place, is much faster than jumping around." },
    { term: "Introsort", plain: "The sorting algorithm many standard libraries actually use: quick sort that switches to heap sort (a different, always-reliable sorting algorithm built on the heap data structure) if the recursion goes suspiciously deep, guaranteeing it can never be as slow as quick sort's true worst case." },
    { term: "Timsort", plain: "The stable sorting algorithm used by Python and Java for objects; it detects stretches of the input that are already sorted and takes advantage of them, making it very fast on nearly-sorted data." },
    { term: "Quickselect", plain: "An algorithm that reuses quick sort's partitioning step to find just the k-th smallest (or largest) element, without sorting the whole array." },
    { term: "External merge sort", plain: "A version of merge sort designed for data too large to fit in memory: sort chunks that do fit, write each sorted chunk to disk, then merge the sorted chunks together." }
  ],

  complexity: {
    rows: [
      { operation: "Merge sort", time: "O(n log n) always", space: "O(n)", note: "stable; the O(n) buffer is unavoidable in the array version" },
      { operation: "Quick sort (expected)", time: "O(n log n)", space: "O(log n) stack", note: "in-place; recurse into the smaller side to bound the stack" },
      { operation: "Quick sort (worst)", time: "O(n²)", space: "O(log n) stack", note: "sorted input with a fixed pivot, or all-equal keys with Lomuto" },
      { operation: "Heap sort", time: "O(n log n) always", space: "O(1)", note: "in-place but not stable, and cache-hostile" },
      { operation: "Timsort (Python/Java objects)", time: "O(n) best, O(n log n) worst", space: "O(n)", note: "stable; exploits existing runs" },
      { operation: "Quickselect (k-th smallest)", time: "O(n) expected", space: "O(1)", note: "same partition, recurse into one side only" }
    ]
  },

  interview: {
    whyAsked: "It is the cheapest way to see whether you understand recursion cost, memory, and the gap between asymptotics and real machines. The signal is not \"can you code merge sort\" — it is whether you volunteer stability, the O(n) buffer, the O(n²) worst case, and *why the library sort in your language chose what it chose*.",
    followUps: [
      { q: "Which of these is stable, and why does stability matter?", a: "Merge sort is stable, quick sort and heap sort are not. Stability comes from taking the left run on ties during the merge — one `<=` instead of `<`. It matters whenever you sort by successive keys: sort by name, then by department, and a stable sort keeps names ordered inside each department. Without stability you must sort once on a composite key (dept, name)." },
      { q: "Quick sort is O(n²) in the worst case. Why is it still the default in most libraries?", a: "Because the worst case is essentially unreachable once the pivot is randomised, and the expected case has a much smaller constant than merge sort. Partitioning is one sequential scan with in-place swaps, so it is cache-friendly and allocation-free, while merge sort pays to copy every element into and out of an auxiliary buffer at every level. In practice quick sort runs about two to three times faster on primitive arrays with identical asymptotics." },
      { q: "Can you make merge sort in-place, and can you make quick sort stable?", a: "Both are possible and both are bad trades. In-place merge sort exists (Kronrod-style block merges, used by `std::inplace_merge` when allocation fails) but the constant factor is brutal and the code is hard to get right. Stable quick sort requires O(n) extra space to hold the two partitions in order, at which point you have written merge sort. The honest answer is: pick the algorithm whose natural properties you need." },
      { q: "What do real standard libraries actually use?", a: "C++ `std::sort` is introsort: quick sort with a median-of-three pivot, switching to heap sort once recursion depth exceeds ~2·log₂n (guaranteeing O(n log n)) and to insertion sort for runs under ~16 elements. Python's `sorted` and Java's `Arrays.sort` for objects use Timsort: it finds existing ascending/descending runs, extends short ones with binary insertion sort, and merges runs under a stack invariant — it is stable and O(n) on already-sorted data. Java uses dual-pivot quick sort for primitives, where stability is meaningless." },
      { q: "How do you sort 100 GB of data with 4 GB of RAM?", a: "External merge sort. Read the file in chunks that fit in memory, sort each chunk in RAM, write it back as a sorted run — that is the \"split\" phase. Then k-way merge the runs with a min-heap holding one element per run, streaming the output sequentially. The cost model is disk passes, not comparisons: with B bytes of RAM and N bytes of data you need about log_{B}(N/B) merge passes, so you pick the largest fan-in your buffers allow. This is exactly why merge sort, not quick sort, is the external-sorting algorithm — it streams sequentially and never needs random access." },
      { q: "The array is all equal values. What happens?", a: "With Lomuto partitioning (`a[j] < pivot`) every element goes to the same side, so each partition removes exactly one element and you get O(n²). Hoare's scheme handles it better because both pointers move on equal keys, splitting roughly in half. The proper fix is three-way partitioning — Dutch national flag — which groups `<`, `==`, `>` and recurses only into the outer two, making duplicate-heavy input O(n) per level." }
    ]
  },

  code: [
    { lang: "python", label: "Merge sort (stable)", code: "def merge_sort(a):\n    \"\"\"O(n log n) always, O(n) extra space, stable.\"\"\"\n    if len(a) <= 1:                 # base case: 0 or 1 element is sorted\n        return a\n    mid = len(a) // 2\n    left = merge_sort(a[:mid])      # no comparisons on the way DOWN\n    right = merge_sort(a[mid:])\n    return merge(left, right)       # all the work is on the way UP\n\n\ndef merge(left, right):\n    out, i, j = [], 0, 0\n    while i < len(left) and j < len(right):\n        # '<=' not '<': on a tie we take from the LEFT run.\n        # That single character is the entire stability guarantee.\n        if left[i] <= right[j]:\n            out.append(left[i]); i += 1\n        else:\n            out.append(right[j]); j += 1\n    out.extend(left[i:])            # exactly one of these two is non-empty\n    out.extend(right[j:])\n    return out" },
    { lang: "python", label: "Quick sort (in-place, Lomuto, randomised pivot)", code: "import random    # randomising the pivot is what kills the O(n^2) adversary\n\ndef quick_sort(a, lo=0, hi=None):\n    if hi is None:\n        hi = len(a)                       # half-open [lo, hi)\n    while hi - lo > 1:\n        p = partition(a, lo, hi)\n        # Recurse into the SMALLER side, loop on the larger one.\n        # This bounds the call stack at O(log n) instead of O(n).\n        if p - lo < hi - (p + 1):\n            quick_sort(a, lo, p)\n            lo = p + 1\n        else:\n            quick_sort(a, p + 1, hi)\n            hi = p\n    return a\n\n\ndef partition(a, lo, hi):\n    # Randomising the pivot means no INPUT can force O(n^2) - only bad luck can.\n    pi = random.randrange(lo, hi)\n    a[pi], a[hi - 1] = a[hi - 1], a[pi]   # park the pivot at the end\n    pivot = a[hi - 1]\n\n    i = lo                                # invariant: a[lo:i] < pivot\n    for j in range(lo, hi - 1):           #            a[i:j]  >= pivot\n        if a[j] < pivot:\n            a[i], a[j] = a[j], a[i]\n            i += 1\n    a[i], a[hi - 1] = a[hi - 1], a[i]     # pivot lands on its FINAL index\n    return i                              # a[i] is never moved again" },
    { lang: "python", label: "Three-way partition + quickselect", code: "import random\n\ndef sort3(a, lo=0, hi=None):\n    \"\"\"Dutch national flag: O(n) per level when keys repeat heavily.\"\"\"\n    if hi is None:\n        hi = len(a)\n    if hi - lo <= 1:\n        return a\n    pivot = a[random.randrange(lo, hi)]\n    lt, i, gt = lo, lo, hi                # a[lo:lt] < p, a[lt:i] == p, a[gt:hi] > p\n    while i < gt:\n        if a[i] < pivot:\n            a[lt], a[i] = a[i], a[lt]; lt += 1; i += 1\n        elif a[i] > pivot:\n            gt -= 1\n            a[gt], a[i] = a[i], a[gt]     # do NOT advance i: a[i] is unexamined\n        else:\n            i += 1                        # equal keys are already final\n    sort3(a, lo, lt)\n    sort3(a, gt, hi)                      # the '==' block in the middle is done\n    return a\n\n\ndef quickselect(a, k):\n    \"\"\"k-th smallest (0-indexed) in O(n) expected - partition ONE side only.\"\"\"\n    lo, hi = 0, len(a)\n    while True:\n        p = partition(a, lo, hi)\n        if p == k:   return a[p]\n        if p < k:    lo = p + 1\n        else:        hi = p" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 460 },

    params: [
      { key: "algo",  label: "Algorithm",  type: "enum", options: ["merge", "quick"], default: "merge" },
      { key: "pivot", label: "Pivot rule", type: "enum", options: ["first", "random", "median3"], default: "median3" },
      { key: "n",     label: "Array size", type: "int", min: 6, max: 32, default: 16 },
      { key: "seed",  label: "Reshuffle",  type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(6, Math.min(32, Math.round(params.n || 16)));
      const algo = params.algo === "quick" ? "quick" : "merge";
      const rule = params.pivot === "first" ? "first" : (params.pivot === "median3" ? "median3" : "random");
      const CAP = 430;                       // hard guard, stays under layout.maxFrames
      const detailed = n <= 20;              // small arrays: show every scan step

      const arr = [];
      for (let i = 0; i < n; i++) arr.push(6 + Math.floor(rng() * 92));

      const tree = [];
      const runs = [];
      const placed = [];
      let nextId = 0, comps = 0, writes = 0, swaps = 0, emitted = 0;

      function addNode(lo, hi, depth, parent) {
        const id = nextId++;
        tree.push({ id: id, parent: parent, lo: lo, hi: hi, depth: depth, status: "open" });
        return id;
      }
      function setStatus(id, s) {
        for (let t = 0; t < tree.length; t++) if (tree[t].id === id) tree[t].status = s;
      }
      function over() { return emitted >= CAP; }
      function mk(label, phase, active, extra, focus) {
        emitted++;
        const st = {
          algo: algo, rule: rule, n: n,
          arr: arr.slice(),
          tree: tree.map(function (t) {
            return { id: t.id, parent: t.parent, lo: t.lo, hi: t.hi, depth: t.depth, status: t.status };
          }),
          runs: runs.map(function (r) { return r.slice(); }),
          placed: placed.slice(),
          active: (active === null || active === undefined) ? null : active,
          lo: null, hi: null, mid: null, i: null, j: null, k: null,
          pivotIdx: null, pivotVal: null, aux: null,
          comps: comps, writes: writes, swaps: swaps
        };
        if (extra) for (const key in extra) st[key] = extra[key];
        const f = { label: label, phase: phase, state: st };
        if (focus) f.focus = focus.slice();
        return f;
      }

      // ---------------------------------------------------------------- merge
      function* msort(lo, hi, depth, parent) {
        const id = addNode(lo, hi, depth, parent);
        if (hi - lo <= 1) {
          setStatus(id, "done");
          if (hi > lo) runs.push([lo, hi]);
          return;
        }
        const mid = (lo + hi) >> 1;
        setStatus(id, "active");
        yield mk(
          "Divide [" + lo + "," + hi + ") at " + mid + ": merge sort splits blindly and does zero comparisons on the way down.",
          "divide", id, { lo: lo, hi: hi, mid: mid });
        if (over()) return;

        yield* msort(lo, mid, depth + 1, id);
        if (over()) return;
        yield* msort(mid, hi, depth + 1, id);
        if (over()) return;

        setStatus(id, "merge");
        const left = arr.slice(lo, mid), right = arr.slice(mid, hi);
        let li = 0, rj = 0, k = lo;

        while (li < left.length && rj < right.length) {
          comps++;
          const takeLeft = left[li] <= right[rj];
          const val = takeLeft ? left[li] : right[rj];
          const li0 = li, rj0 = rj;
          const label = takeLeft
            ? "left[" + li0 + "]=" + left[li0] + " <= right[" + rj0 + "]=" + right[rj0] + ", so " + val +
              " is written to index " + k + ". Ties always take the LEFT run — that single '<=' is the whole stability guarantee."
            : "right[" + rj0 + "]=" + right[rj0] + " < left[" + li0 + "]=" + left[li0] + ", so " + val +
              " is written to index " + k + "; the left run keeps its candidate for the next round.";
          arr[k] = val; writes++;
          yield mk(label, "merge", id,
            { lo: lo, hi: hi, mid: mid, k: k,
              aux: { left: left.slice(), right: right.slice(), li: li0, rj: rj0, mid: mid } }, [k]);
          if (takeLeft) li++; else rj++;
          k++;
          if (over()) return;
        }
        while (li < left.length) {
          const li0 = li;
          arr[k] = left[li]; writes++;
          yield mk("The right run is exhausted, so the rest of the left run copies straight down: " + left[li0] +
            " goes to index " + k + " with no comparison at all.", "merge", id,
            { lo: lo, hi: hi, mid: mid, k: k,
              aux: { left: left.slice(), right: right.slice(), li: li0, rj: rj, mid: mid } }, [k]);
          li++; k++;
          if (over()) return;
        }
        while (rj < right.length) {
          const rj0 = rj;
          arr[k] = right[rj]; writes++;
          yield mk("The left run is exhausted, so the rest of the right run copies straight down: " + right[rj0] +
            " goes to index " + k + " with no comparison at all.", "merge", id,
            { lo: lo, hi: hi, mid: mid, k: k,
              aux: { left: left.slice(), right: right.slice(), li: li, rj: rj0, mid: mid } }, [k]);
          rj++; k++;
          if (over()) return;
        }

        for (let r = runs.length - 1; r >= 0; r--) {
          if (runs[r][0] >= lo && runs[r][1] <= hi) runs.splice(r, 1);
        }
        runs.push([lo, hi]);
        setStatus(id, "done");
        yield mk("[" + lo + "," + hi + ") is now one sorted run of " + (hi - lo) +
          ". Merging cost " + (hi - lo) + " writes into a scratch buffer — that buffer is exactly why merge sort is not in-place.",
          "merged", id, { lo: lo, hi: hi, mid: mid });
      }

      // ---------------------------------------------------------------- quick
      function pickPivot(lo, hi) {
        if (rule === "first") return lo;
        if (rule === "median3") {
          const m = (lo + hi - 1) >> 1, e = hi - 1;
          const a = arr[lo], b = arr[m], c = arr[e];
          if ((a <= b && b <= c) || (c <= b && b <= a)) return m;
          if ((b <= a && a <= c) || (c <= a && a <= b)) return lo;
          return e;
        }
        return lo + Math.floor(rng() * (hi - lo));
      }

      function* qsort(lo, hi, depth, parent) {
        const id = addNode(lo, hi, depth, parent);
        if (hi - lo <= 1) {
          setStatus(id, "done");
          if (hi - lo === 1) placed.push(lo);
          return;
        }
        setStatus(id, "active");

        const pi = pickPivot(lo, hi);
        const pval = arr[pi];
        if (pi !== hi - 1) {
          const t = arr[pi]; arr[pi] = arr[hi - 1]; arr[hi - 1] = t; swaps++;
        }
        const ruleText = rule === "first"
          ? "the first element"
          : (rule === "median3" ? "the median of first/middle/last" : "a uniformly random index");
        yield mk("Pivot rule '" + rule + "' chooses " + ruleText + ": pivot = " + pval +
          ". Park it at index " + (hi - 1) + " and scan [" + lo + "," + (hi - 1) + ") around it.",
          "pivot", id, { lo: lo, hi: hi, pivotIdx: hi - 1, pivotVal: pval }, [hi - 1]);
        if (over()) return;

        let i = lo;
        for (let j = lo; j < hi - 1; j++) {
          comps++;
          const v = arr[j];
          if (v < pval) {
            if (i !== j) { const t = arr[i]; arr[i] = arr[j]; arr[j] = t; swaps++; }
            i++;
            yield mk("a[" + j + "]=" + v + " < pivot " + pval + ": swap it into the less-than zone, which now spans [" +
              lo + "," + i + ").", "partition", id,
              { lo: lo, hi: hi, i: i, j: j, pivotIdx: hi - 1, pivotVal: pval }, [i - 1, j]);
            if (over()) return;
          } else if (detailed) {
            yield mk("a[" + j + "]=" + v + " >= pivot " + pval + ": leave it in place and advance j — the >= zone [" +
              i + "," + (j + 1) + ") grows by one.", "partition", id,
              { lo: lo, hi: hi, i: i, j: j, pivotIdx: hi - 1, pivotVal: pval }, [j]);
            if (over()) return;
          }
        }

        if (i !== hi - 1) { const t = arr[i]; arr[i] = arr[hi - 1]; arr[hi - 1] = t; swaps++; }
        placed.push(i);
        yield mk("pivot=" + pval + "; everything left of index " + i + " is now < " + pval + " and everything right is >= " +
          pval + " — the pivot is in its final position and never moves again.",
          "placed", id, { lo: lo, hi: hi, i: i, pivotIdx: i, pivotVal: pval }, [i]);
        if (over()) return;

        yield* qsort(lo, i, depth + 1, id);
        if (over()) return;
        yield* qsort(i + 1, hi, depth + 1, id);
        if (over()) return;
        setStatus(id, "done");
      }

      // ---------------------------------------------------------------- drive
      yield mk(algo === "merge"
        ? "Unsorted array of " + n + ". Merge sort will halve it down to single elements, then rebuild sorted runs upward — the tree on the right is the call stack."
        : "Unsorted array of " + n + ". Quick sort will pick a pivot, split the range around it, and never look at that pivot again.",
        "init", null, {});

      if (algo === "merge") yield* msort(0, n, 0, -1);
      else yield* qsort(0, n, 0, -1);

      const optimal = Math.ceil(n * Math.log2(Math.max(2, n)));
      yield mk(algo === "merge"
        ? "Sorted in " + comps + " comparisons and " + writes + " writes (n log2 n = " + optimal +
          "). Merge sort pays O(n) scratch memory for a guaranteed O(n log n) and stability."
        : "Sorted in " + comps + " comparisons and " + swaps + " swaps (n log2 n = " + optimal +
          "). Quick sort touched no extra memory beyond O(log n) of stack — that is why it is the default in practice.",
        "done", null, {});
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      const arr = S.arr, n = arr.length;
      const isMerge = S.algo === "merge";
      const pad = 18, gapX = 20;
      const leftW = Math.max(140, Math.round((W - pad * 2 - gapX) * 0.58));
      const rightX = pad + leftW + gapX;
      const rightW = Math.max(90, W - pad - rightX);

      const bodyTop = 58;
      const legendTop = H - 26;
      const bodyBottom = legendTop - 10;

      // ---------------------------------------------------------- headers
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText(isMerge
        ? "Merge sort — split blindly, do the work on the way up"
        : "Quick sort — partition first, the way up is free", pad, 22);
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText("compares " + S.comps + "   writes " + S.writes + "   swaps " + S.swaps +
        (isMerge ? "" : "   pivot rule: " + S.rule), pad, 40);
      ctx.fillStyle = C.text2;
      ctx.font = "12px " + env.font.base;
      ctx.fillText("recursion tree", rightX, 22);
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText("width = slice size, depth = call depth", rightX, 40);

      // ---------------------------------------------------------- bars
      const auxH = isMerge ? Math.round((bodyBottom - bodyTop) * 0.24) : 0;
      const barsBottom = bodyBottom - (isMerge ? auxH + 40 : 22);
      const barsTop = bodyTop;
      const barsH = Math.max(24, barsBottom - barsTop);
      const cellW = leftW / n;

      let maxV = 1;
      for (let i = 0; i < n; i++) if (arr[i] > maxV) maxV = arr[i];

      const placedMap = {};
      for (let p = 0; p < S.placed.length; p++) placedMap[S.placed[p]] = true;

      const xAt = function (i) { return pad + i * cellW; };

      for (let i = 0; i < n; i++) {
        const h = Math.max(3, (arr[i] / maxV) * (barsH - 14));
        const y = barsBottom - h;
        const inRange = S.lo !== null && i >= S.lo && i < S.hi;

        let fill = C.surface2;
        let alpha = 0.55;
        if (inRange) { fill = C.viz1; alpha = 1; }
        if (placedMap[i]) { fill = C.viz3; alpha = 1; }
        if (isMerge) {
          if (i === S.k) { fill = C.viz2; alpha = 1; }
        } else {
          if (i === S.pivotIdx) { fill = C.viz7; alpha = 1; }
          else if (i === S.i || i === S.j) { fill = C.viz2; alpha = 1; }
        }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(xAt(i) + 1, y, Math.max(1, cellW - 2), h, 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (cellW > 17) {
          ctx.fillStyle = inRange || placedMap[i] ? C.text2 : C.muted;
          ctx.font = "10px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.fillText(String(arr[i]), xAt(i) + cellW / 2, barsBottom + 12);
          ctx.textAlign = "left";
        }
      }

      // sorted-run underlines (merge sort): runs fuse together as merges finish
      if (isMerge && S.runs.length) {
        for (let r = 0; r < S.runs.length; r++) {
          const a0 = S.runs[r][0], b0 = S.runs[r][1];
          ctx.fillStyle = C.viz3;
          ctx.globalAlpha = 0.85;
          ctx.beginPath();
          ctx.roundRect(xAt(a0) + 1.5, barsBottom + 17, Math.max(2, (b0 - a0) * cellW - 3), 3, 1.5);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // pointer glyphs under the bars
      const tick = function (idx, text, color) {
        if (idx === null || idx === undefined || idx < 0 || idx >= n) return;
        const cx = xAt(idx) + cellW / 2;
        const yTop = barsBottom + (isMerge ? 24 : 20);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx, yTop);
        ctx.lineTo(cx - 4, yTop + 7);
        ctx.lineTo(cx + 4, yTop + 7);
        ctx.closePath();
        ctx.fill();
        ctx.font = "10px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText(text, cx, yTop + 18);
        ctx.textAlign = "left";
      };
      if (isMerge) {
        tick(S.k, "k", C.viz2);
      } else {
        tick(S.pivotIdx, "pivot", C.viz7);
        if (S.j !== S.pivotIdx) tick(S.j, "j", C.viz2);
        if (S.i !== S.pivotIdx && S.i !== S.j) tick(S.i, "i", C.viz2);
      }

      // ---------------------------------------------------------- aux runs (merge)
      if (isMerge) {
        const auxTop = barsBottom + 34;
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.mono;
        ctx.fillText("scratch buffer: left run | right run", pad, auxTop - 4);
        if (S.aux) {
          const L = S.aux.left, R = S.aux.right;
          let am = 1;
          for (let i = 0; i < L.length; i++) if (L[i] > am) am = L[i];
          for (let i = 0; i < R.length; i++) if (R[i] > am) am = R[i];
          const drawRun = function (vals, startIdx, cur) {
            for (let i = 0; i < vals.length; i++) {
              const h = Math.max(2, (vals[i] / am) * (auxH - 4));
              const x = xAt(startIdx + i);
              const isCur = i === cur;
              ctx.fillStyle = isCur ? C.viz4 : C.surface2;
              ctx.globalAlpha = isCur ? 1 : 0.7;
              ctx.beginPath();
              ctx.roundRect(x + 1, auxTop + (auxH - h), Math.max(1, cellW - 2), h, 2);
              ctx.fill();
              ctx.globalAlpha = 1;
            }
          };
          drawRun(L, S.aux.mid - L.length, S.aux.li);
          drawRun(R, S.aux.mid, S.aux.rj);
          // divider between the two runs
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(xAt(S.aux.mid), auxTop);
          ctx.lineTo(xAt(S.aux.mid), auxTop + auxH);
          ctx.stroke();
        } else {
          ctx.fillStyle = C.muted;
          ctx.font = "10px " + env.font.base;
          ctx.fillText("(empty — only allocated while a merge is running)", pad, auxTop + auxH / 2);
        }
      }

      // ---------------------------------------------------------- recursion tree
      const tree = S.tree;
      const tTop = bodyTop, tBottom = bodyBottom - 6;
      let maxD = 0;
      for (let t = 0; t < tree.length; t++) if (tree[t].depth > maxD) maxD = tree[t].depth;
      const rowH = (tBottom - tTop) / (maxD + 1);
      const nodeH = Math.max(5, Math.min(13, rowH * 0.46));

      const cxOf = function (t) { return rightX + ((t.lo + t.hi) / 2 / n) * rightW; };
      const cyOf = function (t) { return tTop + t.depth * rowH + nodeH / 2 + 2; };

      if (!tree.length) {
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.base;
        ctx.fillText("the tree grows as calls are made", rightX, tTop + 18);
      }

      // edges first
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      for (let t = 0; t < tree.length; t++) {
        const node = tree[t];
        if (node.parent < 0) continue;
        let par = null;
        for (let q = 0; q < tree.length; q++) if (tree[q].id === node.parent) par = tree[q];
        if (!par) continue;
        ctx.beginPath();
        ctx.moveTo(cxOf(par), cyOf(par) + nodeH / 2);
        ctx.lineTo(cxOf(node), cyOf(node) - nodeH / 2);
        ctx.stroke();
      }

      // nodes
      for (let t = 0; t < tree.length; t++) {
        const node = tree[t];
        const w = Math.max(4, ((node.hi - node.lo) / n) * rightW - 2);
        const x = cxOf(node) - w / 2;
        const y = cyOf(node) - nodeH / 2;
        let fill = C.surface2, alpha = 0.8;
        if (node.status === "active") { fill = C.viz1; alpha = 0.9; }
        else if (node.status === "merge") { fill = C.viz2; alpha = 0.95; }
        else if (node.status === "done") { fill = C.viz3; alpha = 0.9; }
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, y, w, nodeH, 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (node.id === S.active) {
          ctx.strokeStyle = C.viz1;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x - 2.5, y - 2.5, w + 5, nodeH + 5, 3);
          ctx.stroke();
          if (rowH > 18) {
            ctx.fillStyle = C.text2;
            ctx.font = "10px " + env.font.mono;
            ctx.textAlign = "center";
            ctx.fillText("[" + node.lo + "," + node.hi + ")", cxOf(node), y - 5);
            ctx.textAlign = "left";
          }
        }
      }

      // ---------------------------------------------------------- legend
      const items = isMerge
        ? [[C.viz1, "active call"], [C.viz2, "write target k"], [C.viz4, "run candidates"], [C.viz3, "sorted run / returned"]]
        : [[C.viz1, "active range"], [C.viz2, "scan i / j"], [C.viz7, "pivot"], [C.viz3, "final position"]];
      let lx = pad;
      ctx.font = "10px " + env.font.base;
      for (let e = 0; e < items.length; e++) {
        ctx.fillStyle = items[e][0];
        ctx.beginPath();
        ctx.roundRect(lx, legendTop + 4, 9, 9, 2);
        ctx.fill();
        ctx.fillStyle = C.muted;
        ctx.fillText(items[e][1], lx + 14, legendTop + 12);
        lx += 20 + ctx.measureText(items[e][1]).width;
      }
    }
  },

  drill: {
    cards: [
      { q: "State the partition invariant of quick sort.", a: "After `p = partition(a, lo, hi)`, every element in `a[lo:p]` is `< a[p]` and every element in `a[p+1:hi]` is `>= a[p]`. So `a[p]` sits at its final index and is never moved again, and the two sides can be sorted independently with no merge step.", tags: ["invariant", "quicksort"] },
      { q: "Which common sorts are stable?", a: "Merge sort, Timsort, insertion sort, and counting/radix sort are stable. Quick sort, heap sort, and selection sort are not. Stability comes from taking the LEFT run on ties during a merge — the `<=` in `left[i] <= right[j]`.", tags: ["stability"] },
      { q: "Why is quick sort usually faster than merge sort despite an O(n²) worst case?", a: "It is in-place (no O(n) buffer, no allocation) and partitioning is one sequential scan with swaps, so it has excellent cache locality and a small constant. With a randomised pivot the O(n²) case has vanishing probability.", tags: ["tradeoffs"] },
      { q: "What input makes naive quick sort O(n²), and what fixes it?", a: "Already-sorted (or reverse-sorted) input when the pivot is the first or last element — every partition peels off one element. Fix with a randomised pivot, median-of-three, or introsort's depth-limited fallback to heap sort. All-equal input needs three-way partitioning.", tags: ["pitfall", "quicksort"] },
      { q: "What is introsort and what is Timsort?", a: "Introsort (C++ `std::sort`) = quick sort + heap sort fallback once depth exceeds ~2·log₂n + insertion sort for tiny runs; it gets quick sort's speed with an O(n log n) guarantee. Timsort (Python, Java objects) = stable merge sort that detects existing runs, so it is O(n) on nearly-sorted data.", tags: ["libraries"] },
      { q: "How do you sort data larger than RAM?", a: "External merge sort: sort memory-sized chunks and write them out as sorted runs, then k-way merge the runs with a min-heap, streaming sequentially. The cost metric is disk passes, not comparisons. Merge sort wins here because it needs only sequential access.", tags: ["external", "systems"] },
      { q: "How much stack does quick sort use, and how do you bound it?", a: "Naively O(n) in the worst case. Recurse into the smaller partition and loop (tail-call eliminate) on the larger one — the recursed side is always ≤ half, so depth is O(log n).", tags: ["space", "quicksort"] },
      { q: "What is quickselect and what does it cost?", a: "Quick sort's partition applied to only one side: to find the k-th smallest, partition, then recurse into the side containing k. Expected O(n) because the work halves each time (n + n/2 + n/4 … = 2n); worst case O(n²), fixed by median-of-medians for a deterministic O(n).", tags: ["selection"] }
    ],
    sixtySecond: [
      "Compare merge sort and quick sort on time, space, stability, and real-world speed — and say why libraries pick what they pick.",
      "Explain quick sort's partition invariant and why it means the pivot never moves again.",
      "Describe how you would sort 100 GB of records on a machine with 4 GB of RAM."
    ]
  }
};
