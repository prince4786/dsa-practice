// 06-heaps.js — Heaps & Top-K
// Visualizer: the implicit binary tree (left) and its backing array (right), drawn
// side by side; every sift step highlights the SAME two indices in BOTH views.
// Single-statement module: one default-exported object, no module-level anything else.
// `frames` is a pure generator (seeded rng only, no clock, no DOM) and never mutates
// an object it has already yielded. `draw` is a pure full redraw using env.colors only.

export default {
  id: "heaps",
  track: "dsa",
  title: "Heaps & Top-K",
  difficulty: 2,
  minutes: 15,
  tags: ["heaps", "priority-queue", "top-k", "streaming"],

  explainer: [
    { type: "p", text: "Imagine you need to repeatedly ask a growing pile of numbers \"what's the biggest one right now?\", add new numbers to the pile, and remove the biggest one — over and over, quickly, forever. Sorting the whole pile every time you ask would work, but it's wasteful: you'd be re-doing enormous amounts of work just to answer one small question. A heap is a data structure built exactly for this repeated task. It deliberately does *not* keep everything fully sorted, because that's more order than you actually need — it only guarantees one thing: the single best element (the biggest, or the smallest, depending on which kind of heap you build) always sits in one specific, easy-to-find spot, and every other element is arranged just loosely enough that finding the *next* best element, after you remove the current one, stays cheap." },
    { type: "p", text: "A binary heap — the usual kind used in interviews — is stored as a **complete** binary tree, meaning every level of the tree is completely filled with nodes except possibly the last level, which fills strictly left to right with no gaps. Because the shape is so rigidly predictable, the tree doesn't need to be built out of separately-allocated nodes connected by pointers at all — it can be stored as one plain, flat array, and the parent/child relationships are recovered purely through index arithmetic: for an element sitting at array index `i`, its parent lives at index `parent(i) = (i-1)//2` (integer division, i.e. round down), its left child lives at `left(i) = 2i+1`, and its right child lives at `right(i) = 2i+2`. Because there are no pointers to store or follow, a heap has essentially zero per-node memory overhead and excellent cache locality — reading nearby array indices is fast on real hardware in a way that chasing pointers around scattered memory is not." },
    { type: "h3", text: "The invariant" },
    { type: "p", text: "The one fact a heap guarantees to stay true after every single operation — its invariant — is, for a max-heap (a heap where the biggest element wins): `a[parent(i)] >= a[i]` for every index `i > 0`, meaning every parent is greater than or equal to both of its children. That is the *entire* guarantee — nothing more. Sibling nodes (two children of the same parent) are not ordered relative to each other, the array as a whole is *not* sorted, and the only element you can say anything definite about just by looking at it is `a[0]`, the root, which is guaranteed to be the maximum of the whole collection. A min-heap is the mirror image: every parent is less than or equal to its children, and the root is the minimum. Because a heap only enforces this loose, partial ordering rather than a full sort order, it is genuinely cheaper to build and maintain than keeping the whole array sorted." },
    { type: "list", items: [
      "**sift-up** — used after appending a brand-new element at the end of the array (the one position that keeps the tree 'complete'). While the new node beats its parent (is bigger, for a max-heap), swap it upward with that parent, and repeat. This takes `O(log n)` steps, because the tree's height — the longest path from root to leaf — is only about `log₂ n` for `n` elements.",
      "**sift-down** — used after removing the root and moving the very last element in the array up to take its place. While a child beats the current node, swap the node down with whichever child is the *better* of the two (not just any child — this detail matters and is a common source of bugs). Also `O(log n)`.",
      "**push then pop**, done as two separate calls, is two separate `O(log n)` operations. Most heap libraries also offer a combined `heapreplace` (pop, then push) or `heappushpop` (push, then pop) that fuses the two into a single sift-down pass — same complexity class, but measurably faster in a tight loop because it does one walk down the tree instead of two."
    ]},
    { type: "h3", text: "Why build-heap is O(n), not O(n log n)" },
    { type: "p", text: "There is a specific, efficient way to turn an arbitrary unsorted array into a valid heap all at once, called **build-heap** or **heapify** (Floyd's algorithm): starting from index `n//2 - 1` (the last index that has any children at all) and walking backward down to index `0`, sift-down each one. A naive estimate would multiply `n` nodes by `O(log n)` work each and conclude the whole thing costs `O(n log n)` — but that estimate is too pessimistic, because almost all of the nodes in a heap sit near the *bottom* of the tree and therefore have very little height left to sift down through. Concretely: half of all the nodes are leaves, with height 0 (nothing below them to sift into); a quarter of the nodes have height 1; an eighth have height 2; and so on. Summing the actual work — `Σ n/2^(h+1) · h`, added up over every possible height `h` — is a series that converges to approximately `n`, not `n log n`. Building a heap by inserting elements one at a time, by contrast, really is `O(n log n)`, because in that version the expensive nodes are the many elements that get appended near the bottom and each has to sift all the way up toward the root." },
    { type: "callout", tone: "tip", text: "Sift **down** starting from the middle of the array, never sift **up** starting from the front. That single choice of direction is the entire difference between an O(n) build and an O(n log n) build — memorise which direction goes with which complexity." },
    { type: "h3", text: "Top-K: use a MIN-heap of size k" },
    { type: "p", text: "A very common interview task is: given a long stream of numbers (possibly too long to ever hold entirely in memory), find the `k` largest ones. The efficient way to do this is to keep a **min**-heap — the kind where the smallest element sits at the root — capped at exactly `k` elements. This might sound backwards at first, since you're looking for the *largest* values, but think about what that root actually represents: it's the weakest of the `k` items you're currently keeping, i.e. the current 'winner' that's most vulnerable to being knocked out. That makes it exactly the right thing to compare each new incoming value against, and exactly the right thing to evict if something better comes along. The algorithm, for each new value `x` arriving from the stream: if `x` is bigger than the heap's current root, replace the root with `x` and sift down to restore the invariant; otherwise, `x` isn't good enough to make the top `k`, so just discard it in `O(1)` time and move on. Total cost across the whole stream is `O(n log k)` (n = length of the stream, k = how many you're keeping) using only `O(k)` memory — and critically, it never needs to look at the stream more than once." },
    { type: "callout", tone: "pitfall", text: "The trap: candidates instinctively reach for a **max**-heap of size k, because the question says \"largest\". But a max-heap's root would be the *biggest* of your current winners — completely useless as a comparison point, since that's the one element you'd never want to evict. Say out loud \"min-heap of size k, so the root is the weakest survivor\" and this entire follow-up question disappears." },
    { type: "h3", text: "Edge cases and language traps" },
    { type: "list", items: [
      "Python's built-in `heapq` module only implements a **min**-heap — there is no built-in max-heap. To get max-heap behaviour, either push every value negated (`-x`, so the smallest negative number corresponds to the largest original number — the 'negation trick') or wrap your values in a small wrapper class whose comparison logic is inverted.",
      "Tuples pushed onto a heap are compared element-by-element, left to right, the same way Python compares any tuple. So if you push `(priority, item)` and two priorities happen to tie, Python will try to compare the `item`s directly to break the tie — and if `item` isn't a comparable type (say, a dictionary), that crashes. The fix is to push `(priority, counter, item)`, where `counter` is a number that increases by one on every push; because no two counters are ever equal, the comparison never has to fall through to comparing `item` at all, and as a side effect this also makes ties come out in insertion order.",
      "Two boundary cases are easy to get wrong: if `k` (how many items you want to keep) is greater than `n` (how many items exist), the correct answer is just to return everything; if `k == 0`, the correct answer is an empty result. Both are worth explicitly testing.",
      "A plain array-backed heap has no efficient way to remove an arbitrary element you don't already know the index of, or to change ('decrease') the priority of an element already inside it — both of those naively cost `O(n)` just to *find* the element. The two standard fixes are: keep a separate lookup table (a dictionary) mapping each key to its current index inside the heap, updating it every time you swap two elements — this is exactly what Dijkstra's shortest-path algorithm needs — or use the **lazy-deletion** trick, where instead of removing anything you just push a new, updated entry, and whenever you pop an entry later you check whether it's still 'valid' and simply skip it if it's stale."
    ]},
    { type: "code", lang: "python", code: "# The whole data structure in three lines of index arithmetic:\nparent = lambda i: (i - 1) // 2\nleft   = lambda i: 2 * i + 1\nright  = lambda i: 2 * i + 2" }
  ],

  glossary: [
    { term: "Binary heap", plain: "A data structure, usually stored as a plain array, that always keeps the biggest (or smallest) element easy to find at one fixed spot, without fully sorting everything else." },
    { term: "Complete binary tree", plain: "A tree shape where every level is completely full except possibly the last, which fills up from left to right with no gaps — this shape is what lets a heap be stored as a flat array instead of needing pointers." },
    { term: "Max-heap / min-heap", plain: "A max-heap always keeps the largest element at the root (top); a min-heap always keeps the smallest element at the root." },
    { term: "Invariant", plain: "A fact guaranteed to stay true after every operation — for a heap, that every parent node beats (or ties) both of its children." },
    { term: "Sift-up", plain: "Repeatedly swapping a newly added element upward with its parent until it no longer beats the parent, restoring the heap's ordering." },
    { term: "Sift-down", plain: "Repeatedly swapping a node downward with whichever of its children is better, until it no longer loses to either child, restoring the heap's ordering." },
    { term: "Priority queue", plain: "An abstract data structure that always lets you access the highest-priority (or lowest) item first; a heap is the usual way to implement one." },
    { term: "Build-heap / Floyd's algorithm", plain: "An efficient way to turn an entire unsorted array into a valid heap all at once, by sifting down from the middle of the array toward the front, in O(n) total time." },
    { term: "Amortised", plain: "A cost measured by averaging it out across a whole sequence of operations, rather than judging any single operation on its own." },
    { term: "Top-K", plain: "The problem of finding the k largest (or smallest) items out of a much bigger collection or stream, without necessarily sorting everything." },
    { term: "k-way merge", plain: "Combining k already-sorted lists into one sorted list, typically by keeping the current front element of each list in a small min-heap." },
    { term: "Lazy deletion", plain: "A way of handling removals in a data structure by marking an entry as stale instead of actually deleting it, and simply skipping over stale entries whenever they're encountered later." }
  ],

  complexity: {
    rows: [
      { operation: "peek (min/max)", time: "O(1)", space: "O(1)", note: "always a[0]" },
      { operation: "push (sift-up)", time: "O(log n)", space: "O(1)", note: "amortised O(1) for random input" },
      { operation: "pop (sift-down)", time: "O(log n)", space: "O(1)", note: "swap root with last, shrink, sift down" },
      { operation: "build-heap (Floyd)", time: "O(n)", space: "O(1)", note: "sift-down from n//2-1 to 0; sum of heights is < n" },
      { operation: "build by n pushes", time: "O(n log n)", space: "O(1)", note: "same result, strictly worse — direction matters" },
      { operation: "top-K of a stream", time: "O(n log k)", space: "O(k)", note: "min-heap of size k; one pass, no re-read" },
      { operation: "heapsort", time: "O(n log n)", space: "O(1)", note: "build then pop n times; in-place but unstable" },
      { operation: "k-way merge", time: "O(N log k)", space: "O(k)", note: "N total elements across k sorted runs" }
    ]
  },

  interview: {
    whyAsked: "Top-K is the most common \"can you pick the right data structure\" question there is: the naive answer is sort-then-slice, and the signal is whether you notice you need order statistics rather than a full ordering. Heaps also test whether you can reason about amortised cost — build-heap's O(n) proof separates people who memorised complexities from people who can derive them.",
    followUps: [
      { q: "Why is build-heap O(n) when each sift-down is O(log n)?", a: "Because sift-down cost is proportional to the node's *height*, not the tree's height, and heights are wildly unbalanced. At height h there are at most n/2^(h+1) nodes, so total work is Σ (n/2^(h+1))·h = n·Σ h/2^(h+1), and that series converges to 1 — giving O(n). Building by repeated insertion is genuinely O(n log n) because sift-up cost is proportional to *depth*, and most nodes are deep." },
      { q: "Heap vs balanced BST — when do you pick which?", a: "A heap gives you O(1) peek at one extreme and O(log n) push/pop with a flat array, no pointers, and a small constant — but it cannot do search, predecessor, successor, or in-order traversal. A BST gives you all of those in O(log n) plus sorted iteration, at the cost of pointer chasing and higher constants. If the only thing you ever ask is \"what is the current minimum\", a heap is strictly the better tool." },
      { q: "For the k largest of n items, when would you use quickselect instead of a heap?", a: "Quickselect is O(n) expected versus O(n log k), so it wins when the whole array is already in memory and you may reorder it — it partitions around the k-th element and stops. The heap wins when the data is a stream you cannot store or re-read, when n is unknown or unbounded, when you need memory bounded by O(k) rather than O(n), or when you want the results in sorted order for free. Also note quickselect is O(n²) worst case unless you use median-of-medians." },
      { q: "How do you merge k sorted lists totalling N elements?", a: "Push the head of each list into a min-heap keyed by value, carrying the list id: `(value, list_id, index)`. Pop the smallest, emit it, and push the next element from that same list. Every element enters and leaves a heap of size ≤ k once, so it is O(N log k) time and O(k) space — versus O(Nk) for scanning all k heads each step. This is exactly the merge phase of external sorting." },
      { q: "Python's heapq is a min-heap. How do you get a max-heap?", a: "Push negated keys and negate on the way out — `heappush(h, -x)` / `-heappop(h)`. For tuples negate only the sort key: `(-score, tie, item)`. If keys are not numbers, wrap them in a small class whose `__lt__` is inverted, or store `(-index_of_key,)`. The stdlib also exposes `heapq._heapify_max` but it is private and lacks a matching push, so the negation trick is the answer to give." },
      { q: "How do you delete an arbitrary element, or change its priority?", a: "A bare array heap cannot find an arbitrary element in less than O(n). Two standard fixes: keep a dict from key to current array index, updating it on every swap, so you can sift the touched node up or down in O(log n) — that is the indexed heap Dijkstra wants; or use *lazy deletion*, pushing the new priority and skipping entries you pop that a `valid` set says are stale. Lazy deletion is what most interview-grade Dijkstra implementations do, and it costs an extra O(log n) per stale entry." }
    ]
  },

  code: [
    { lang: "python", label: "heapq essentials (min-heap, max-heap, heapsort)", code: "import heapq   # stdlib. It is a MIN-heap, and only a min-heap.\n\nh = [5, 1, 9, 3]\nheapq.heapify(h)          # O(n) - Floyd's sift-down, NOT n pushes\nheapq.heappush(h, 4)      # O(log n) sift-up\nsmallest = h[0]           # O(1) peek - the ONLY element you know\nx = heapq.heappop(h)      # O(log n): move last to root, sift down\n\n# push+pop in one sift-down (skips one full sift-up):\ny = heapq.heappushpop(h, 7)   # push first, then pop\nz = heapq.heapreplace(h, 7)   # pop first, then push (heap must be non-empty)\n\n# MAX-heap: negate on the way in and on the way out.\nmaxh = [-v for v in [5, 1, 9, 3]]\nheapq.heapify(maxh)\nlargest = -heapq.heappop(maxh)        # 9\n\n# Tuples compare element-wise, so add a counter to break ties and to\n# stop Python from ever comparing the payload itself:\ncounter = 0\nheapq.heappush(h2, (priority, counter, task)); counter += 1\n\ndef heapsort(a):\n    h = list(a)\n    heapq.heapify(h)                  # O(n)\n    return [heapq.heappop(h) for _ in range(len(h))]   # n * O(log n)" },
    { lang: "python", label: "Top-K of a stream (min-heap of size k)", code: "import heapq\n\ndef top_k(stream, k):\n    \"\"\"k largest items. O(n log k) time, O(k) space, single pass.\"\"\"\n    if k <= 0:\n        return []\n    h = []                                  # MIN-heap: h[0] is the WEAKEST winner\n    for x in stream:\n        if len(h) < k:\n            heapq.heappush(h, x)\n        elif x > h[0]:\n            # x beats the weakest survivor -> evict it in one sift-down.\n            heapq.heapreplace(h, x)\n        # else: x cannot be in the top k, discard in O(1)\n    return sorted(h, reverse=True)          # O(k log k) only if you need order\n\n\n# Why a MIN-heap: the root is the smallest thing we are keeping, so it is\n# both the cheapest comparison ('is x worth keeping?') and the right victim.\n# A max-heap's root would be the champion - the one thing we never evict.\n\n# The stdlib does this for you when k is small relative to n:\n#   heapq.nlargest(k, stream, key=...)  /  heapq.nsmallest(k, stream)\n\n\ndef kth_largest(nums, k):\n    return top_k(nums, k)[-1]               # the root of the size-k min-heap" },
    { lang: "python", label: "Manual sift-down + k-way merge", code: "import heapq\n\ndef sift_down(a, i, size):\n    \"\"\"Restore the max-heap property at i, assuming both subtrees are heaps.\"\"\"\n    while True:\n        l, r, best = 2 * i + 1, 2 * i + 2, i\n        if l < size and a[l] > a[best]:\n            best = l\n        if r < size and a[r] > a[best]:\n            best = r                       # swap with the BIGGER child, or the\n        if best == i:                      # smaller one floats above its sibling\n            return\n        a[i], a[best] = a[best], a[i]\n        i = best\n\n\ndef build_heap(a):\n    # Leaves (indices >= n//2) are already valid heaps of one node.\n    for i in range(len(a) // 2 - 1, -1, -1):\n        sift_down(a, i, len(a))            # O(n) total: sum of HEIGHTS < n\n    return a\n\n\ndef merge_k(lists):\n    \"\"\"O(N log k) merge of k sorted lists - the external-sort merge phase.\"\"\"\n    h = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]\n    heapq.heapify(h)\n    out = []\n    while h:\n        val, li, idx = heapq.heappop(h)\n        out.append(val)\n        if idx + 1 < len(lists[li]):\n            heapq.heappush(h, (lists[li][idx + 1], li, idx + 1))\n    return out" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 320 },

    params: [
      { key: "mode", label: "Mode",  type: "enum", options: ["build-heap", "push-pop", "top-k"], default: "build-heap" },
      { key: "n",    label: "Items", type: "int", min: 7, max: 31, default: 23 },
      { key: "k",    label: "k",     type: "int", min: 2, max: 8, default: 4 },
      { key: "seed", label: "Reshuffle", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(7, Math.min(31, Math.round(params.n || 23)));
      const mode = (params.mode === "push-pop" || params.mode === "top-k") ? params.mode : "build-heap";
      const k = Math.max(2, Math.min(8, Math.round(params.k || 4)));
      const CAP = 300;                       // hard guard, stays under layout.maxFrames

      const values = [];
      for (let i = 0; i < n; i++) values.push(10 + Math.floor(rng() * 89));

      const heap = [];
      const settled = [];
      const out = [];
      const marks = [];                      // per stream index: 0 pending, 1 kept, 2 rejected
      let comps = 0, swaps = 0, emitted = 0;

      function over() { return emitted >= CAP; }
      function mk(label, phase, extra, focus) {
        emitted++;
        const st = {
          mode: mode, kind: mode === "top-k" ? "min" : "max", k: k, n: n,
          heap: heap.slice(),
          settled: settled.slice(),
          out: out.slice(),
          stream: mode === "top-k" ? values.slice() : [],
          marks: marks.slice(),
          pos: null, active: null, cmpA: null, cmpB: null,
          note: "", comps: comps, swaps: swaps
        };
        if (extra) for (const key in extra) st[key] = extra[key];
        const f = { label: label, phase: phase, state: st };
        if (focus) f.focus = focus.slice();
        return f;
      }
      function better(a, b) { return mode === "top-k" ? a < b : a > b; }
      const word = mode === "top-k" ? "smaller" : "larger";
      const rootWord = mode === "top-k" ? "minimum" : "maximum";

      // ------------------------------------------------------------- sift-up
      function* siftUp(start, phase) {
        let i = start;
        while (i > 0) {
          const p = (i - 1) >> 1;
          comps++;
          const note = "parent(" + i + ") = (" + i + "-1)//2 = " + p;
          const wins = better(heap[i], heap[p]);
          if (!wins) {
            yield mk(note + ", holding " + heap[p] + ". " + heap[i] + " does not beat it, so the heap property already holds and sifting stops.",
              phase, { active: i, cmpA: p, cmpB: i, note: note }, [p, i]);
            return;
          }
          yield mk(note + ", holding " + heap[p] + ". " + heap[i] + " is " + word + ", so the child must rise — one swap in the array is one level in the tree.",
            phase, { active: i, cmpA: p, cmpB: i, note: note }, [p, i]);
          if (over()) return;
          const t = heap[i]; heap[i] = heap[p]; heap[p] = t; swaps++;
          yield mk("Swapped indices " + i + " and " + p + ". Watch both panels: the tree edge flipped and the two array cells exchanged — they are the same operation.",
            phase, { active: p, cmpA: p, cmpB: i, note: note }, [p, i]);
          if (over()) return;
          i = p;
        }
        yield mk("Index 0 reached: the new value is now the root, so it is the " + rootWord + " of every element in the heap.",
          phase, { active: 0, cmpA: 0, cmpB: null, note: "root: parent(0) does not exist" }, [0]);
      }

      // ----------------------------------------------------------- sift-down
      function* siftDown(start, size, phase) {
        let i = start;
        while (true) {
          const l = 2 * i + 1, r = 2 * i + 2;
          if (l >= size) {
            yield mk("Index " + i + " has no children (2*" + i + "+1 = " + l + " is past the end of the heap), so it is a leaf and sifting stops.",
              phase, { active: i, cmpA: i, cmpB: null, note: "left(" + i + ") = 2*" + i + "+1 = " + l }, [i]);
            return;
          }
          let best = i;
          comps++;
          if (better(heap[l], heap[best])) best = l;
          if (r < size) { comps++; if (better(heap[r], heap[best])) best = r; }
          const note = "left(" + i + ") = " + l + ", right(" + i + ") = " + r;
          if (best === i) {
            yield mk("Node " + i + " holds " + heap[i] + "; children at " + l + (r < size ? " and " + r : "") +
              " are " + heap[l] + (r < size ? " and " + heap[r] : "") + ". The parent already dominates both, so the invariant holds here.",
              phase, { active: i, cmpA: i, cmpB: best === i ? l : best, note: note }, [i, l]);
            return;
          }
          yield mk("Node " + i + " holds " + heap[i] + ", but the " + word + " child a[" + best + "]=" + heap[best] +
            " beats it. Always swap with the " + word + " child — swapping with the other one would break the invariant against its sibling.",
            phase, { active: i, cmpA: i, cmpB: best, note: note }, [i, best]);
          if (over()) return;
          const t = heap[i]; heap[i] = heap[best]; heap[best] = t; swaps++;
          yield mk("Swapped indices " + i + " and " + best + " — one array exchange, one level down the tree. Continue from " + best + ".",
            phase, { active: best, cmpA: i, cmpB: best, note: note }, [i, best]);
          if (over()) return;
          i = best;
        }
      }

      // --------------------------------------------------------------- modes
      if (mode === "build-heap") {
        for (let i = 0; i < n; i++) { heap.push(values[i]); settled.push(0); }
        for (let i = Math.floor(n / 2); i < n; i++) settled[i] = 1;
        yield mk("An arbitrary array of " + n + ". Indices " + Math.floor(n / 2) + ".." + (n - 1) +
          " are leaves — every leaf is already a valid one-node heap, which is why Floyd's build-heap never touches them.",
          "init", { note: "parent(i) = (i-1)//2, left(i) = 2i+1, right(i) = 2i+2" });

        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
          yield mk("Sift DOWN from index " + i + ": both subtrees below it are already heaps, so one downward pass fixes this whole subtree. Going bottom-up is what makes the total O(n).",
            "heapify", { active: i, cmpA: i, cmpB: null, note: "left(" + i + ") = " + (2 * i + 1) + ", right(" + i + ") = " + (2 * i + 2) }, [i]);
          if (over()) break;
          yield* siftDown(i, heap.length, "heapify");
          if (over()) break;
          settled[i] = 1;
        }
        yield mk("Max-heap built in " + comps + " comparisons and " + swaps + " swaps. Sift-down cost is a node's HEIGHT, and heights sum to less than n — that is the O(n) proof. Note the array is still not sorted; only a[0] is guaranteed.",
          "done", { note: "sum of heights < n" });

      } else if (mode === "push-pop") {
        yield mk("Start with an empty max-heap and push " + n + " values one at a time. Each push appends at the end — the only slot that keeps the tree complete — then sifts up.",
          "init", { note: "parent(i) = (i-1)//2" });
        for (let v = 0; v < n; v++) {
          heap.push(values[v]); settled.push(0);
          yield mk("push(" + values[v] + "): append at index " + (heap.length - 1) +
            ". The tree stays complete, but the new leaf may violate the invariant against its parent.",
            "push", { active: heap.length - 1, cmpA: heap.length - 1, cmpB: null, note: "appended at " + (heap.length - 1) }, [heap.length - 1]);
          if (over()) break;
          yield* siftUp(heap.length - 1, "push");
          if (over()) break;
        }
        const pops = Math.min(3, heap.length);
        for (let p = 0; p < pops && !over(); p++) {
          const top = heap[0];
          const last = heap[heap.length - 1];
          heap[0] = last;
          heap.pop(); settled.pop();
          out.push(top);
          yield mk("pop() returns the root " + top + ". Move the LAST leaf (" + last +
            ") to the root and shrink — that keeps the tree complete; now sift it down. Never shift the array left: that would be O(n).",
            "pop", { active: 0, cmpA: 0, cmpB: null, note: "root <- last leaf, size " + heap.length }, [0]);
          if (over()) break;
          if (heap.length > 1) yield* siftDown(0, heap.length, "pop");
        }
        yield mk("Built by " + n + " pushes: " + comps + " comparisons. Floyd's build-heap on the same data would be O(n) instead of O(n log n) — sift DOWN from the middle beats sifting UP from the front.",
          "done", { note: "n pushes = O(n log n); heapify = O(n)" });

      } else {
        yield mk("Stream of " + n + " numbers, keep the " + k + " largest. A MIN-heap of size " + k +
          " does it in one pass: its root is the WEAKEST of the current winners, so it is both the cheapest thing to compare against and the right thing to evict.",
          "init", { pos: null, note: "min-heap of size k = " + k });
        for (let s = 0; s < n && !over(); s++) {
          const x = values[s];
          if (heap.length < k) {
            heap.push(x); settled.push(0); marks[s] = 1;
            yield mk("Heap holds " + (heap.length - 1) + " < k = " + k + " items, so " + x +
              " is admitted unconditionally: append and sift up (upward, because this is a MIN-heap — small values rise).",
              "fill", { pos: s, active: heap.length - 1, cmpA: heap.length - 1, cmpB: null, note: "size " + heap.length + " / k = " + k }, [heap.length - 1]);
            if (over()) break;
            yield* siftUp(heap.length - 1, "fill");
          } else {
            comps++;
            if (x > heap[0]) {
              marks[s] = 1;
              const evicted = heap[0];
              heap[0] = x;
              yield mk(x + " > heap root " + evicted + ", so " + x + " beats the weakest survivor: overwrite the root and sift down. One O(log k) operation, not a push plus a pop.",
                "replace", { pos: s, active: 0, cmpA: 0, cmpB: null, note: "heapreplace: evict " + evicted }, [0]);
              if (over()) break;
              out.push(evicted);
              yield* siftDown(0, heap.length, "replace");
            } else {
              marks[s] = 2;
              yield mk(x + " <= heap root " + heap[0] + ", so " + x + " cannot be in the top " + k +
                " — discard it in O(1). Most of a stream ends here, which is why this is O(n log k) and not O(n log n).",
                "reject", { pos: s, active: 0, cmpA: 0, cmpB: null, note: "root = k-th largest so far" }, [0]);
            }
          }
        }
        yield mk("Done in one pass: " + comps + " comparisons, O(k) memory. The root " + (heap.length ? heap[0] : 0) +
          " is the " + k + "-th largest value seen. Sorting the whole stream would cost O(n log n) and require storing all of it.",
          "done", { note: "O(n log k) time, O(k) space" });
      }
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";

      const heap = S.heap, m = heap.length;
      const pad = 18;
      const arrW = 118;
      const arrX = W - pad - arrW;
      const treeX = pad;
      const treeW = Math.max(160, arrX - 26 - treeX);

      const legendTop = H - 26;
      const bodyTop = 62;
      const showStrip = S.mode === "top-k" || S.out.length > 0;
      const stripH = showStrip ? 34 : 0;
      const bodyBottom = legendTop - 10 - stripH;

      // ------------------------------------------------------------ headers
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      const titles = {
        "build-heap": "Floyd build-heap — sift DOWN from n//2-1 to 0",
        "push-pop": "push / pop — sift up on insert, sift down on extract",
        "top-k": "top-K — a MIN-heap of size k over a stream"
      };
      ctx.fillText(titles[S.mode] || "Binary heap", pad, 22);
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText((S.kind === "min" ? "min-heap" : "max-heap") + "   size " + m +
        "   compares " + S.comps + "   swaps " + S.swaps, pad, 40);
      if (S.note) {
        ctx.fillStyle = C.text2;
        ctx.font = "11px " + env.font.mono;
        ctx.textAlign = "right";
        ctx.fillText(S.note, W - pad, 22);
        ctx.textAlign = "left";
      }

      // ------------------------------------------------------- role helper
      const roleOf = function (i) {
        if (i === S.active) return C.viz1;
        if (i === S.cmpA || i === S.cmpB) return C.viz2;
        if (i === 0 && m > 0) return C.viz7;
        if (S.settled[i]) return C.viz3;
        return null;
      };

      // ------------------------------------------------------------- tree
      let levels = 1;
      while ((1 << levels) - 1 < m) levels++;
      if (m === 0) levels = 1;
      const rowH = (bodyBottom - bodyTop) / Math.max(1, levels);
      const rad = Math.max(9, Math.min(17, Math.min(rowH * 0.34, treeW / (1 << (levels - 1)) * 0.42)));

      const levelOf = function (i) { let L = 0; while ((1 << (L + 1)) - 1 <= i) L++; return L; };
      const nodeX = function (i) {
        const L = levelOf(i);
        const slot = i - ((1 << L) - 1);
        return treeX + ((slot + 0.5) / (1 << L)) * treeW;
      };
      const nodeY = function (i) { return bodyTop + levelOf(i) * rowH + rowH * 0.42; };

      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      for (let i = 1; i < m; i++) {
        const p = (i - 1) >> 1;
        ctx.beginPath();
        ctx.moveTo(nodeX(p), nodeY(p) + rad);
        ctx.lineTo(nodeX(i), nodeY(i) - rad);
        ctx.stroke();
      }

      for (let i = 0; i < m; i++) {
        const role = roleOf(i);
        const cx = nodeX(i), cy = nodeY(i);
        ctx.beginPath();
        ctx.arc(cx, cy, rad, 0, Math.PI * 2);
        if (role) {
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = role;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = role;
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = C.surface2;
          ctx.fill();
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        ctx.fillStyle = C.text;
        ctx.font = Math.round(rad * 0.9) + "px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText(String(heap[i]), cx, cy + rad * 0.32);
        if (rad >= 11) {
          ctx.fillStyle = C.muted;
          ctx.font = "9px " + env.font.mono;
          ctx.fillText(String(i), cx, cy + rad + 10);
        }
        ctx.textAlign = "left";
      }

      if (m === 0) {
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.base;
        ctx.fillText("empty heap", treeX, bodyTop + 18);
      }

      // ------------------------------------------------------- backing array
      ctx.fillStyle = C.text2;
      ctx.font = "11px " + env.font.base;
      ctx.fillText("backing array", arrX, bodyTop - 12);

      const cellH = Math.max(9, Math.min(20, (bodyBottom - bodyTop) / Math.max(1, m)));
      for (let i = 0; i < m; i++) {
        const y = bodyTop + i * cellH;
        const role = roleOf(i);
        ctx.beginPath();
        ctx.roundRect(arrX, y + 1, arrW, Math.max(4, cellH - 2), 3);
        if (role) {
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = role;
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = role;
          ctx.lineWidth = 2;
        } else {
          ctx.fillStyle = C.surface2;
          ctx.fill();
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        const fs = Math.max(8, Math.min(12, cellH - 6));
        ctx.font = fs + "px " + env.font.mono;
        ctx.fillStyle = C.muted;
        ctx.fillText(String(i), arrX + 6, y + cellH / 2 + fs * 0.36);
        ctx.fillStyle = C.text;
        ctx.textAlign = "right";
        ctx.fillText(String(heap[i]), arrX + arrW - 8, y + cellH / 2 + fs * 0.36);
        ctx.textAlign = "left";
      }

      // lockstep connectors: same index highlighted in BOTH views
      const link = function (i, color) {
        if (i === null || i === undefined || i < 0 || i >= m) return;
        const y = bodyTop + i * cellH + cellH / 2;
        ctx.save();
        ctx.setLineDash([3, 3]);
        ctx.strokeStyle = color;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(nodeX(i) + rad, nodeY(i));
        ctx.lineTo(arrX - 2, y);
        ctx.stroke();
        ctx.restore();
      };
      link(S.cmpA, S.cmpA === S.active ? C.viz1 : C.viz2);
      link(S.cmpB, S.cmpB === S.active ? C.viz1 : C.viz2);

      // ------------------------------------------------- stream / output strip
      if (showStrip) {
        const sy = legendTop - 8 - stripH;
        if (S.mode === "top-k") {
          ctx.fillStyle = C.muted;
          ctx.font = "10px " + env.font.mono;
          ctx.fillText("stream", pad, sy + 9);
          const items = S.stream;
          const cw = Math.max(10, Math.min(26, (W - pad * 2 - 46) / Math.max(1, items.length)));
          for (let s = 0; s < items.length; s++) {
            const x = pad + 46 + s * cw;
            let col = null;
            if (s === S.pos) col = C.viz1;
            else if (S.marks[s] === 1) col = C.viz7;
            else if (S.marks[s] === 2) col = C.viz8;
            ctx.beginPath();
            ctx.roundRect(x, sy, Math.max(3, cw - 2), 20, 2);
            if (col) {
              ctx.globalAlpha = 0.25; ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = 1;
              ctx.strokeStyle = col; ctx.lineWidth = 1.5;
            } else {
              ctx.fillStyle = C.surface2; ctx.fill();
              ctx.strokeStyle = C.border; ctx.lineWidth = 1;
            }
            ctx.stroke();
            if (cw > 17) {
              ctx.fillStyle = s === S.pos ? C.text : C.text2;
              ctx.font = "9px " + env.font.mono;
              ctx.textAlign = "center";
              ctx.fillText(String(items[s]), x + (cw - 2) / 2, sy + 14);
              ctx.textAlign = "left";
            }
          }
        } else {
          ctx.fillStyle = C.muted;
          ctx.font = "10px " + env.font.mono;
          ctx.fillText("popped", pad, sy + 9);
          for (let s = 0; s < S.out.length; s++) {
            const x = pad + 46 + s * 34;
            if (x > W - pad - 34) break;
            ctx.beginPath();
            ctx.roundRect(x, sy, 30, 20, 3);
            ctx.globalAlpha = 0.22; ctx.fillStyle = C.viz3; ctx.fill(); ctx.globalAlpha = 1;
            ctx.strokeStyle = C.viz3; ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.fillStyle = C.text;
            ctx.font = "10px " + env.font.mono;
            ctx.textAlign = "center";
            ctx.fillText(String(S.out[s]), x + 15, sy + 14);
            ctx.textAlign = "left";
          }
        }
      }

      // ------------------------------------------------------------- legend
      const items = S.mode === "top-k"
        ? [[C.viz1, "current item / sifting node"], [C.viz2, "index pair being compared"], [C.viz7, "kept (root = k-th largest)"], [C.viz8, "discarded"]]
        : [[C.viz1, "node being sifted"], [C.viz2, "index pair being compared"], [C.viz7, "root = " + (S.kind === "min" ? "minimum" : "maximum")], [C.viz3, "heap-ordered / emitted"]];
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
      { q: "Give the three index formulas for an implicit binary heap.", a: "`parent(i) = (i-1)//2`, `left(i) = 2i+1`, `right(i) = 2i+2` (0-indexed). The tree is complete, so the array has no gaps and no pointers are stored.", tags: ["fundamentals"] },
      { q: "State the max-heap invariant.", a: "`a[(i-1)//2] >= a[i]` for every `i > 0`. Siblings are unordered and the array is not sorted — the only guaranteed element is `a[0]`.", tags: ["invariant"] },
      { q: "Why is build-heap O(n) but building by n pushes O(n log n)?", a: "Sift-down cost is the node's height, and there are only n/2^(h+1) nodes at height h, so Σ n·h/2^(h+1) converges to O(n). Sift-up cost is the node's depth, and half the nodes are at maximum depth — so insertion-based building really does pay log n for most elements.", tags: ["complexity", "proof"] },
      { q: "For the k largest items of a stream, which heap and why?", a: "A MIN-heap of size k. Its root is the weakest current winner, so comparing a new item against it is O(1) and evicting it is the correct move. O(n log k) time, O(k) space, single pass. A max-heap's root is the champion, which you never want to evict.", tags: ["top-k"] },
      { q: "Quickselect or a heap for top-K?", a: "Quickselect: O(n) expected, but needs the whole array in memory and reorders it, and is O(n²) worst case without median-of-medians. Heap: O(n log k), O(k) memory, works on an unbounded stream, and gives sorted output. Stream or memory constraint → heap; in-memory array you may mutate → quickselect.", tags: ["top-k", "tradeoffs"] },
      { q: "How do you merge k sorted lists of N total elements?", a: "Min-heap of the k current heads keyed `(value, list_id, index)`. Pop the smallest, emit, push the successor from that list. O(N log k) time, O(k) space — this is the merge phase of external sort.", tags: ["k-way-merge"] },
      { q: "Python's heapq only does min-heaps. How do you get a max-heap?", a: "Negate: `heappush(h, -x)` and `-heappop(h)`; for tuples negate only the sort key, e.g. `(-score, counter, item)`. The counter also stops Python from comparing non-comparable payloads on ties.", tags: ["python", "idiom"] },
      { q: "Heap or balanced BST?", a: "Heap: O(1) peek at one extreme, O(log n) push/pop, flat array, tiny constant — but no search, no successor, no sorted traversal. BST: all of those in O(log n) plus in-order iteration, at higher constants. If you only ever ask for the current extreme, take the heap.", tags: ["comparison"] }
    ],
    sixtySecond: [
      "Explain the heap invariant, the index arithmetic, and why sift-up and sift-down are both O(log n).",
      "Prove that build-heap is O(n) and explain why inserting one at a time is not.",
      "Design top-K over a stream of a billion items and justify every choice: heap type, heap size, time and space."
    ]
  }
};
