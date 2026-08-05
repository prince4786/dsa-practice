// REFERENCE LESSON — the canonical shape every lesson file must follow.
// This exact file is the intended content of src/topics/dsa/04-binary-search.js
// (agent A1 may move/copy it there verbatim; all other agents use it as a template only).
//
// RULES THIS FILE DEMONSTRATES:
//   * exactly one statement: `export default { ... }` — no imports, no top-level consts.
//   * `frames` is a PURE generator: no Math.random (use the injected `rng`), no Date,
//     no DOM, and it never mutates an object it has already yielded (always spread/copy).
//   * `draw` is a PURE renderer of ONE frame: full redraw every call, no state kept
//     between calls, every colour comes from `env.colors` (never a hardcoded hex).
//   * every yielded frame has a human-readable `label` — that caption IS the teaching.

export default {
  id: "binary-search",
  track: "dsa",
  title: "Binary Search & Variants",
  difficulty: 1,
  minutes: 12,
  tags: ["arrays", "divide-and-conquer", "invariants"],

  explainer: [
    { type: "p", text: "Binary search finds a target in a **sorted** array by repeatedly halving the search space. The whole algorithm is one invariant: *if the target exists, it lies inside `[lo, hi]`*. Every step must preserve that." },
    { type: "h3", text: "Why it terminates" },
    { type: "p", text: "Each iteration strictly shrinks `hi - lo`, because `mid` is always inside the range and is always excluded from the next range. A loop that can leave the range unchanged is the classic infinite-loop bug." },
    { type: "callout", tone: "pitfall", text: "Writing `mid = (lo + hi) / 2` overflows in languages with fixed-width ints. Use `lo + (hi - lo) // 2`. Interviewers in C++/Java roles do watch for this." },
    { type: "h3", text: "The variants matter more than the base case" },
    { type: "list", items: [
      "**Exact match** — return as soon as `a[mid] == target`.",
      "**Lower bound** (`bisect_left`) — first index with `a[i] >= target`. Never returns early; converges on a single insertion point.",
      "**Upper bound** (`bisect_right`) — first index with `a[i] > target`. `upper - lower` gives the count of duplicates.",
      "**Binary search on the answer** — when the array is implicit: search the answer space for the smallest value satisfying a monotone predicate."
    ]},
    { type: "callout", tone: "tip", text: "In an interview, prefer the half-open form `[lo, hi)` with `while lo < hi`. It has one loop condition, one update rule, and no off-by-one on the final answer." }
  ],

  complexity: {
    rows: [
      { operation: "Search", time: "O(log n)", space: "O(1)", note: "iterative; O(log n) stack if recursive" },
      { operation: "Sorting first", time: "O(n log n)", space: "O(1)–O(n)", note: "only worth it if you search many times" },
      { operation: "Count duplicates", time: "O(log n)", space: "O(1)", note: "upper_bound − lower_bound" }
    ]
  },

  interview: {
    whyAsked: "It is the cheapest test of whether you can state and maintain a loop invariant. Most candidates can write the happy path; the signal comes from how you handle the boundary — duplicates, not-found, and the termination argument.",
    followUps: [
      { q: "How do you find the first occurrence when duplicates exist?", a: "Use lower bound: on `a[mid] >= target` move `hi = mid`, else `lo = mid + 1`. You never return early — the loop converges to the leftmost index whose value is >= target. Then check `a[lo] == target` to confirm the target actually exists." },
      { q: "How would you search a rotated sorted array?", a: "At each step one half is guaranteed sorted. Compare `a[lo]` with `a[mid]` to find which half that is, test whether the target lies inside that sorted half's range, and recurse into it. Still O(log n), but duplicates degrade it to O(n) because you can no longer tell the halves apart." },
      { q: "What does 'binary search on the answer' mean?", a: "When the answer space is monotone — a predicate that is false, false, ..., true, true — you binary search the answer range rather than an array. Classic uses: minimum ship capacity to ship packages in D days, or minimum eating speed. You need a feasibility check that is monotone in the parameter." },
      { q: "Why is `mid = lo + (hi - lo) / 2` preferred?", a: "`(lo + hi)` can overflow a 32-bit int when both are large; the subtraction form cannot. It is the documented fix to the bug that sat in the JDK's binary search for nine years." },
      { q: "When is binary search the wrong tool?", a: "When the data is not sorted and you search only once — sorting costs O(n log n), so a linear scan at O(n) wins. Also when random access is unavailable, as in a linked list, where seeking to `mid` is itself O(n)." }
    ]
  },

  code: [
    { lang: "python", label: "Half-open, exact match", code: "def binary_search(a, target):\n    lo, hi = 0, len(a)          # invariant: answer lies in [lo, hi)\n    while lo < hi:\n        mid = lo + (hi - lo) // 2\n        if a[mid] == target:\n            return mid\n        if a[mid] < target:\n            lo = mid + 1        # discard left half incl. mid\n        else:\n            hi = mid            # discard right half excl. mid\n    return -1" },
    { lang: "python", label: "Lower bound (first >= target)", code: "def lower_bound(a, target):\n    lo, hi = 0, len(a)\n    while lo < hi:\n        mid = lo + (hi - lo) // 2\n        if a[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid            # keep mid as a candidate\n    return lo                   # == len(a) if every element < target\n\n# count of `target` in a sorted array:\n#   upper_bound(a, target) - lower_bound(a, target)" },
    { lang: "python", label: "Binary search on the answer", code: "def min_capacity(weights, days):\n    def feasible(cap):\n        need, cur = 1, 0\n        for w in weights:\n            if cur + w > cap:\n                need, cur = need + 1, 0\n            cur += w\n        return need <= days\n\n    lo, hi = max(weights), sum(weights)\n    while lo < hi:                       # predicate is monotone in cap\n        mid = lo + (hi - lo) // 2\n        if feasible(mid): hi = mid\n        else:             lo = mid + 1\n    return lo" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 400 },

    params: [
      { key: "n",      label: "Array size", type: "int", min: 8, max: 40, default: 20 },
      { key: "target", label: "Target",     type: "int", min: 0, max: 99, default: 42 },
      { key: "mode",   label: "Variant",    type: "enum", options: ["exact", "lower-bound"], default: "exact" },
      { key: "seed",   label: "Reshuffle",  type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = params.n;
      // Build a sorted array with duplicates, so lower-bound mode is meaningful.
      const arr = [];
      let v = Math.floor(rng() * 8);
      for (let i = 0; i < n; i++) {
        arr.push(v);
        v += Math.floor(rng() * 9);           // sometimes 0 -> duplicates
      }
      const target = params.target % 100;
      const exact = params.mode === "exact";

      let lo = 0, hi = n;                     // half-open [lo, hi)
      let steps = 0, found = -1;

      yield {
        label: exact
          ? `Searching for ${target} in a sorted array of ${n}. Invariant: if ${target} exists, it is inside [lo, hi).`
          : `Lower bound for ${target}: find the first index whose value is >= ${target}.`,
        phase: "init",
        state: { arr: arr.slice(), lo, hi, mid: null, target, found: -1, steps, discarded: [], mode: params.mode }
      };

      const discarded = [];                   // [start, end) ranges we have ruled out

      while (lo < hi) {
        const mid = lo + Math.floor((hi - lo) / 2);
        steps++;

        yield {
          label: `mid = ${lo} + (${hi} − ${lo})/2 = ${mid}. Probe a[${mid}] = ${arr[mid]}.`,
          phase: "probe",
          focus: [mid],
          state: { arr: arr.slice(), lo, hi, mid, target, found: -1, steps, discarded: discarded.slice(), mode: params.mode }
        };

        if (exact && arr[mid] === target) {
          found = mid;
          yield {
            label: `a[${mid}] = ${arr[mid]} = target. Found at index ${mid} after ${steps} probe${steps === 1 ? "" : "s"} (a linear scan would have taken up to ${n}).`,
            phase: "done",
            focus: [mid],
            state: { arr: arr.slice(), lo, hi, mid, target, found: mid, steps, discarded: discarded.slice(), mode: params.mode }
          };
          return;
        }

        const goRight = exact ? arr[mid] < target : arr[mid] < target;
        if (goRight) {
          discarded.push([lo, mid + 1]);
          lo = mid + 1;
          yield {
            label: `a[${mid}] = ${arr[mid]} < ${target}, so nothing at index ≤ ${mid} can be the answer. Discard the left half; lo = ${lo}.`,
            phase: "shrink",
            state: { arr: arr.slice(), lo, hi, mid, target, found: -1, steps, discarded: discarded.slice(), mode: params.mode }
          };
        } else {
          discarded.push([mid + (exact ? 1 : 1), hi]);
          hi = mid;
          yield {
            label: exact
              ? `a[${mid}] = ${arr[mid]} > ${target}, so discard everything right of ${mid}; hi = ${hi}.`
              : `a[${mid}] = ${arr[mid]} >= ${target}, so ${mid} is still a candidate — keep it: hi = ${hi}.`,
            phase: "shrink",
            state: { arr: arr.slice(), lo, hi, mid, target, found: -1, steps, discarded: discarded.slice(), mode: params.mode }
          };
        }
      }

      if (exact) {
        yield {
          label: `lo = hi = ${lo}: the range is empty, so ${target} is not in the array. ${steps} probes for n = ${n}.`,
          phase: "done",
          state: { arr: arr.slice(), lo, hi, mid: null, target, found: -1, steps, discarded: discarded.slice(), mode: params.mode }
        };
      } else {
        const hit = lo < n && arr[lo] === target;
        yield {
          label: `Converged: lower bound = ${lo}` +
                 (lo < n ? ` (a[${lo}] = ${arr[lo]})` : " (past the end)") +
                 `. ${hit ? "The target exists here." : "The target is absent — this is where it would be inserted."}`,
          phase: "done",
          focus: [lo],
          state: { arr: arr.slice(), lo, hi, mid: null, target, found: hit ? lo : -1, steps, discarded: discarded.slice(), mode: params.mode }
        };
      }
    },

    draw: function (frame, ctx, env) {
      const { arr, lo, hi, mid, target, found, steps } = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      const n = arr.length;

      ctx.clearRect(0, 0, W, H);

      const padX = 24, padTop = 64, padBottom = 56;
      const cellW = (W - padX * 2) / n;
      const barTop = padTop, barH = H - padTop - padBottom;

      const inRange = (i) => i >= lo && i < hi;
      const maxV = Math.max(1, ...arr);

      // ---- bars -------------------------------------------------------------
      for (let i = 0; i < n; i++) {
        const x = padX + i * cellW;
        const h = Math.max(3, (arr[i] / maxV) * barH * 0.72);
        const y = barTop + barH - h;

        let fill = C.surface2;              // discarded
        if (i === mid)          fill = C.viz2;    // the probe
        else if (i === found)   fill = C.viz6;    // the answer
        else if (inRange(i))    fill = C.viz1;    // still live

        ctx.globalAlpha = inRange(i) || i === mid || i === found ? 1 : 0.35;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, Math.max(1, cellW - 2), h, 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        // value label, only when there is room
        if (cellW > 18) {
          ctx.fillStyle = inRange(i) ? C.text2 : C.muted;
          ctx.font = `10px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(String(arr[i]), x + cellW / 2, barTop + barH + 14);
        }
      }

      // ---- live-range bracket ----------------------------------------------
      if (lo < hi) {
        const x0 = padX + lo * cellW, x1 = padX + hi * cellW;
        ctx.strokeStyle = C.viz4;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x0, barTop - 10); ctx.lineTo(x0, barTop - 2);
        ctx.moveTo(x0, barTop - 6);  ctx.lineTo(x1, barTop - 6);
        ctx.moveTo(x1, barTop - 10); ctx.lineTo(x1, barTop - 2);
        ctx.stroke();
        ctx.fillStyle = C.viz4;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(`[lo=${lo}, hi=${hi})  ${hi - lo} left`, (x0 + x1) / 2, barTop - 14);
      }

      // ---- mid pointer ------------------------------------------------------
      if (mid !== null && mid !== undefined) {
        const cx = padX + mid * cellW + cellW / 2;
        ctx.fillStyle = C.viz2;
        ctx.beginPath();
        ctx.moveTo(cx, barTop + barH + 22);
        ctx.lineTo(cx - 5, barTop + barH + 32);
        ctx.lineTo(cx + 5, barTop + barH + 32);
        ctx.closePath();
        ctx.fill();
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText("mid", cx, barTop + barH + 44);
      }

      // ---- header -----------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`target = ${target}`, padX, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `12px ${env.font.mono}`;
      ctx.fillText(`probes: ${steps}   ceil(log2(${n})) = ${Math.ceil(Math.log2(n))}`, padX, 42);
    }
  },

  drill: {
    cards: [
      { q: "State the loop invariant of binary search.", a: "If the target exists in the array, its index lies within the current range `[lo, hi)`. Every branch must preserve this, and every iteration must strictly shrink the range.", tags: ["invariant"] },
      { q: "Why is `mid = lo + (hi - lo) // 2` preferred over `(lo + hi) // 2`?", a: "`lo + hi` can overflow a fixed-width integer for large indices. The subtraction form stays in range. (Famous JDK bug.)", tags: ["pitfall"] },
      { q: "How do you return the FIRST occurrence of a duplicated target?", a: "Lower bound: on `a[mid] >= target` set `hi = mid` (keeping mid as a candidate), else `lo = mid + 1`. Never return early. Afterwards verify `a[lo] == target`.", tags: ["variant"] },
      { q: "How do you count occurrences of a value in a sorted array in O(log n)?", a: "`upper_bound(target) - lower_bound(target)` — two binary searches.", tags: ["variant"] },
      { q: "What makes 'binary search on the answer' valid?", a: "The predicate must be monotone over the answer space: false...false, true...true. Then you search for the boundary. Requires a feasibility check that is cheap relative to the range.", tags: ["technique"] },
      { q: "What causes an infinite loop in binary search?", a: "A branch that leaves the range unchanged — e.g. `hi = mid` combined with `mid` rounding down when `hi = lo + 1`. Ensure every iteration strictly reduces `hi - lo`.", tags: ["pitfall"] },
      { q: "Complexity of binary search on a linked list?", a: "O(n) — you cannot random-access `mid`, so seeking dominates. Binary search needs O(1) indexing.", tags: ["complexity"] }
    ],
    sixtySecond: [
      "Explain binary search's invariant, why the loop terminates, and how the lower-bound variant differs from the exact-match one.",
      "Describe 'binary search on the answer' and give one concrete problem where you would use it."
    ]
  }
};
