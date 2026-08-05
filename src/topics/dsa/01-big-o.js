// Lesson: Big-O Intuition  (track: dsa, order 01)
// Visualizer: four "dot racers" — n, n log n, n^2, 2^n — sharing one horizontal
// track whose full length is a fixed operation budget. Each tick grows the input
// size by 1; a racer's position is its work at that input size, normalised
// against the budget (log or linear scale). Exponential leaves the track early.

export default {
  id: "big-o",
  track: "dsa",
  title: "Big-O Intuition",
  difficulty: 1,
  minutes: 10,
  tags: ["complexity", "analysis", "fundamentals"],

  explainer: [
    { type: "p", text: "Big-O is not a stopwatch. It answers exactly one question: *as the input grows, how does the amount of work grow?* Constants and lower-order terms are dropped because they stop mattering once `n` is large — `3n + 400` and `n` bend the same way; `n` and `n²` never do." },

    { type: "h3", text: "The intuition: growth, not speed" },
    { type: "p", text: "Think of a fixed operation budget — say 10⁸ operations, roughly one second on a modern CPU. Big-O tells you the largest `n` you can afford. An `O(n²)` algorithm buys you n ≈ 10 000. An `O(n log n)` algorithm buys you n ≈ 5 000 000. An `O(2ⁿ)` algorithm buys you n ≈ 26. That is the whole lesson: the class, not the constant, decides what problem sizes are reachable." },
    { type: "list", items: [
      "**O(1)** — hash lookup, array index, push/pop. Work does not depend on `n` at all.",
      "**O(log n)** — binary search, balanced-tree descent. Each step throws away a constant *fraction* of the input.",
      "**O(n)** — one scan. The floor for any algorithm that must look at every element.",
      "**O(n log n)** — comparison sorts, divide-and-conquer with linear merge. Practically indistinguishable from linear at interview scale.",
      "**O(n²)** — nested loops over the same array. Fine at n = 1 000, hopeless at n = 1 000 000.",
      "**O(2ⁿ) / O(n!)** — subset and permutation enumeration. Only viable when `n` is capped by the problem (n ≤ 20 is the usual tell)."
    ]},

    { type: "h3", text: "How to actually count it" },
    { type: "list", items: [
      "**Sequential blocks add**, then you keep the max: `O(n) + O(n log n) = O(n log n)`.",
      "**Nested loops multiply** — but only if the inner bound depends on the outer variable. Two loops each to `n` is `O(n²)`; a loop to `n` containing a loop to `1000` is `O(n)`.",
      "**Different inputs get different letters.** Scanning array `a` then array `b` is `O(a + b)`, never `O(n²)` — collapsing two independent sizes into one `n` is the single most common analysis error in interviews.",
      "**Amortised ≠ average.** A dynamic array's `append` is O(1) amortised: the occasional O(n) resize is paid for by the n cheap appends before it. It is a worst-case guarantee over a *sequence*, not a probabilistic claim."
    ]},

    { type: "code", lang: "python", code: "# O(a + b), NOT O(n^2) — two independent inputs.\nfor x in a:\n    seen.add(x)\nfor y in b:\n    if y in seen:\n        hits += 1" },

    { type: "h3", text: "The invariant to state out loud" },
    { type: "p", text: "`f(n) = O(g(n))` means there exist constants `c > 0` and `n₀` such that `f(n) ≤ c·g(n)` for all `n ≥ n₀`. In words: *beyond some input size, g is an upper bound up to a constant factor.* O is an upper bound, Ω a lower bound, Θ both — so saying \"quicksort is O(n²)\" is true but uninformative, and \"quicksort is Θ(n log n)\" is false for the worst case." },

    { type: "callout", tone: "pitfall", text: "The trap interviewers set: they ask for the complexity of a solution that builds a list, then say \"and what about space?\". Recursion stack, the output array, and slicing all count. In Python, `a[1:]` inside a loop is a hidden O(n) copy that quietly turns your O(n) scan into O(n²)." },

    { type: "h3", text: "Edge cases people get wrong" },
    { type: "list", items: [
      "**Sorting inside a loop.** `for x in a: b.sort()` is O(n · m log m), not O(n log n).",
      "**`in` on a list is O(n)**, on a set/dict it is O(1) average. A membership test inside a loop is the classic accidental O(n²).",
      "**String concatenation in a loop** is O(n²) in Python/Java because strings are immutable — build a list and `\"\".join(...)`.",
      "**Hash tables are O(1) *average*, O(n) worst case** under adversarial collisions. Say \"average\" out loud; interviewers listen for it.",
      "**Recursion space.** A recursive DFS on a path-shaped graph is O(n) stack even though it touches each node once."
    ]},

    { type: "callout", tone: "tip", text: "Read the constraints before you design. `n ≤ 20` screams bitmask/backtracking (2ⁿ is intended). `n ≤ 2000` permits O(n²) DP. `n ≤ 10⁵` demands O(n log n) or better. `n ≤ 10⁹` means the answer is math, binary search on the answer, or O(log n)." }
  ],

  complexity: {
    rows: [
      { operation: "Array index / hash get", time: "O(1)", space: "O(1)", note: "hash is average-case; O(n) adversarial" },
      { operation: "Binary search", time: "O(log n)", space: "O(1)", note: "discards a constant fraction each step" },
      { operation: "Single scan", time: "O(n)", space: "O(1)", note: "lower bound if every element matters" },
      { operation: "Comparison sort", time: "O(n log n)", space: "O(log n)–O(n)", note: "proven lower bound for comparisons" },
      { operation: "All pairs", time: "O(n²)", space: "O(1)", note: "nested loops over the same input" },
      { operation: "All subsets", time: "O(2ⁿ · n)", space: "O(n)", note: "only viable for n ≲ 20–25" }
    ]
  },

  interview: {
    whyAsked: "It extracts whether you can predict cost before you write code, rather than benchmarking after. The real signal is in the sloppy edges: do you say 'average case' for hash tables, do you count the output array and the recursion stack as space, and do you use two variables when there are two independent inputs.",
    followUps: [
      { q: "Why do we drop constants and lower-order terms?", a: "Because Big-O classifies growth, and beyond some n₀ the dominant term swamps everything else — 3n + 400 and n differ by a constant factor that a faster machine also buys you, while n and n² differ by a factor that grows without bound. The caveat worth stating: constants absolutely matter in practice, which is why an O(n log n) sort beats an O(n) radix pass on small inputs and why cache behaviour can dominate at fixed n." },
      { q: "What's the difference between O, Ω and Θ?", a: "O is an asymptotic upper bound, Ω a lower bound, Θ both simultaneously. Quicksort is O(n²) and Ω(n log n); merge sort is Θ(n log n). Interviewers accept O colloquially for 'tight bound', but knowing the distinction lets you say precisely that the comparison-sort lower bound is Ω(n log n), which is a statement about every possible algorithm, not one implementation." },
      { q: "Explain amortised O(1) for a dynamic array append.", a: "Doubling the capacity on overflow means a resize costing O(n) happens only after n cheap appends, so n appends cost O(n) total — O(1) each on average over the sequence. This is a worst-case guarantee across the sequence, not a probability: any run of m appends costs O(m). Growing by a fixed increment instead of doubling would make it O(n) amortised, which is why the doubling factor matters." },
      { q: "You have two arrays of sizes a and b. What is the complexity of the two-loop solution?", a: "O(a + b) time and O(a) space if you hash the first array. Calling both sizes 'n' and reporting O(n) hides the fact that one input may dwarf the other, and it is the mistake that makes candidates say O(n²) for what is actually linear. Always name the inputs separately and only collapse them at the end if they are genuinely tied." },
      { q: "How does the constraint on n tell you the intended complexity?", a: "It is a direct hint. n ≤ 20 means exponential is intended (bitmask DP or backtracking); n ≤ 2000 allows O(n²); n ≤ 10⁵ needs O(n log n); n ≤ 10⁹ means you cannot even iterate, so the answer is closed-form math or binary search on the answer. Reading this off the constraints before designing saves you from optimising a solution that was already fast enough — or from writing one that was never going to pass." },
      { q: "Does O(n log n) really beat O(n²) for the inputs you see in practice?", a: "Only above the crossover point set by the constants. Insertion sort beats merge sort below roughly 30–60 elements, which is exactly why production sorts like Timsort and introsort switch to insertion sort on small runs. The honest answer is: asymptotics tell you which algorithm wins eventually, profiling tells you where 'eventually' starts." }
    ]
  },

  code: [
    { lang: "python", label: "Reading complexity off code", code: "def f(a, b):\n    total = 0\n\n    for x in a:                 # O(a)\n        total += x\n\n    for x in a:                 # nested over the SAME input -> O(a^2)\n        for y in a:\n            total += x * y\n\n    for y in b:                 # independent input -> O(b), not O(a*b)\n        total += y\n\n    a_sorted = sorted(a)        # O(a log a) time, O(a) space\n    return total, a_sorted\n\n# Total: O(a^2 + b) time  (the a^2 swallows the two O(a) scans),\n#        O(a) space for the sorted copy.\n# Say the space part out loud: the returned list counts." },
    { lang: "python", label: "The accidental O(n^2)", code: "# BAD: `in` on a list is a linear scan, so this is O(n * m).\ndef common_slow(a, b):\n    return [x for x in a if x in b]          # O(len(a) * len(b))\n\n# GOOD: hash the smaller side once -> O(a + b) time, O(min(a,b)) space.\ndef common_fast(a, b):\n    if len(b) < len(a):\n        a, b = b, a\n    small = set(a)\n    return [x for x in b if x in small]\n\n# Same trap in string building:\n#   s += chunk   inside a loop is O(n^2) (strings are immutable);\n#   parts.append(chunk) then \"\".join(parts) is O(n)." },
    { lang: "python", label: "Amortised growth, measured", code: "def appends_are_amortised_O1(n):\n    \"\"\"n appends cost O(n) TOTAL: each resize copies k items but only\n    happens after k cheap appends have already been paid for.\"\"\"\n    cap, size, copies = 1, 0, 0\n    for _ in range(n):\n        if size == cap:          # resize: O(size), happens log2(n) times\n            copies += size\n            cap *= 2\n        size += 1\n    return copies                # ~ n, i.e. O(1) copies per append\n\n# copies(1_000_000) == 1_048_575  ->  about 1 copy per append.\n# Growing by +1 instead of *2 would make copies ~ n^2/2." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 120 },

    params: [
      { key: "n",      label: "Max input size n", type: "int",  min: 16, max: 64, default: 40 },
      { key: "scale",  label: "Track scale",      type: "enum", options: ["log", "linear"], default: "log" },
      { key: "budget", label: "Op budget",        type: "enum", options: ["1e3", "1e6", "1e9"], default: "1e6" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(4, Math.min(64, params.n | 0));
      const scale = params.scale === "linear" ? "linear" : "log";
      const budget = params.budget === "1e3" ? 1e3 : (params.budget === "1e9" ? 1e9 : 1e6);
      const budgetLabel = params.budget === "1e3" ? "1e3" : (params.budget === "1e9" ? "1e9" : "1e6");

      const fmt = function (x) {
        if (!isFinite(x)) return "huge";
        if (x < 100000) return String(Math.round(x));
        return x.toExponential(1).replace("e+", "e");
      };
      const workAt = function (k) {
        return [k, k * Math.log2(Math.max(1, k)), k * k, Math.pow(2, k)];
      };

      const names = ["n", "n log n", "n\u00b2", "2\u207f"];
      const hist = [];
      let blown = [false, false, false, false];

      yield {
        label: `The track is a budget of ${budgetLabel} operations. Each tick grows the input by one and moves every racer to the work it needs at that size — same problem, four algorithms.`,
        phase: "init",
        state: { k: 0, n: n, scale: scale, budget: budget, budgetLabel: budgetLabel, work: [0, 0, 0, 0], hist: [], blown: [false, false, false, false], names: names.slice() }
      };

      for (let k = 1; k <= n; k++) {
        const w = workAt(k);
        hist.push(w.slice());

        const nextBlown = [
          blown[0] || w[0] > budget,
          blown[1] || w[1] > budget,
          blown[2] || w[2] > budget,
          blown[3] || w[3] > budget
        ];
        const justBlown = [];
        for (let i = 0; i < 4; i++) if (nextBlown[i] && !blown[i]) justBlown.push(i);
        blown = nextBlown;

        let insight;
        if (justBlown.length > 0) {
          const i = justBlown[justBlown.length - 1];
          insight = `${names[i]} just spent the whole ${budgetLabel} budget at n=${k} and leaves the track — every larger input is now unaffordable for it.`;
        } else if (k <= 3) {
          insight = "at tiny n every class looks identical, which is exactly why you cannot benchmark your way to an answer.";
        } else if (w[3] > budget && w[2] <= budget) {
          insight = `2\u207f is already ${fmt(w[3] / Math.max(1, w[2]))}\u00d7 the work of n\u00b2 — doubling the input squares its cost, it never recovers.`;
        } else if (w[2] > budget) {
          insight = `only n and n log n are still on the track; n\u00b2 needs ${fmt(w[2] / budget)}\u00d7 the budget.`;
        } else {
          insight = `n\u00b2 is ${(w[2] / Math.max(1, w[1])).toFixed(1)}\u00d7 the work of n log n, while n log n is only ${(w[1] / Math.max(1, w[0])).toFixed(1)}\u00d7 the work of n.`;
        }

        yield {
          label: `at n=${k}: n=${fmt(w[0])} ops, n log n=${fmt(w[1])}, n\u00b2=${fmt(w[2])}, 2\u207f=${fmt(w[3])} \u2014 ${insight}`,
          phase: k === n ? "final-size" : "grow",
          focus: [k],
          state: { k: k, n: n, scale: scale, budget: budget, budgetLabel: budgetLabel, work: w.slice(), hist: hist.slice(), blown: blown.slice(), names: names.slice() }
        };
      }

      const wEnd = workAt(n);
      const affordable = [
        Math.floor(budget),
        Math.max(1, Math.round(budget / Math.log2(Math.max(2, budget)))),
        Math.floor(Math.sqrt(budget)),
        Math.floor(Math.log2(budget))
      ];
      yield {
        label: `With a ${budgetLabel}-operation budget you can afford n\u2248${fmt(affordable[0])} at O(n), n\u2248${fmt(affordable[1])} at O(n log n), n\u2248${affordable[2]} at O(n\u00b2), but only n\u2248${affordable[3]} at O(2\u207f) \u2014 the complexity class, not the constant, decides which problem sizes exist for you.`,
        phase: "done",
        state: { k: n, n: n, scale: scale, budget: budget, budgetLabel: budgetLabel, work: wEnd.slice(), hist: hist.slice(), blown: blown.slice(), names: names.slice(), affordable: affordable.slice() }
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;

      ctx.clearRect(0, 0, W, H);

      const lane = [
        { name: s.names[0], form: "one scan", color: C.viz1 },
        { name: s.names[1], form: "sort / divide & conquer", color: C.viz3 },
        { name: s.names[2], form: "nested loops", color: C.viz4 },
        { name: s.names[3], form: "all subsets", color: C.viz8 }
      ];

      const padL = 116, padR = 96;
      const x0 = padL, x1 = W - padR;
      const trackW = x1 - x0;
      const topY = 62;
      const bottomY = H - 74;
      const laneH = (bottomY - topY) / 4;

      const logB = Math.log(1 + s.budget);
      const pos = function (w) {
        const t = s.scale === "log" ? Math.log(1 + Math.max(0, w)) / logB : Math.max(0, w) / s.budget;
        return t;
      };
      const px = function (w) {
        return x0 + Math.min(1.045, pos(w)) * trackW;
      };

      // ---- header ------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`input size n = ${s.k}`, 16, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `12px ${env.font.mono}`;
      ctx.fillText(`track length = ${s.budgetLabel} ops    scale: ${s.scale}    max n = ${s.n}`, 16, 42);

      // ---- scale gridlines ---------------------------------------------------
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.textAlign = "center";
      const ticks = [];
      if (s.scale === "log") {
        for (let e = 0; Math.pow(10, e) <= s.budget + 1; e++) ticks.push(Math.pow(10, e));
      } else {
        for (let f = 0; f <= 4; f++) ticks.push(s.budget * f / 4);
      }
      for (let i = 0; i < ticks.length; i++) {
        const gx = px(ticks[i]);
        ctx.beginPath();
        ctx.moveTo(gx, topY - 8);
        ctx.lineTo(gx, bottomY + 4);
        ctx.stroke();
        const lbl = ticks[i] < 1000 ? String(Math.round(ticks[i])) : ticks[i].toExponential(0).replace("e+", "e");
        ctx.fillText(lbl, gx, bottomY + 18);
      }

      // finish line = the budget
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px(s.budget), topY - 10);
      ctx.lineTo(px(s.budget), bottomY + 4);
      ctx.stroke();
      ctx.fillStyle = C.text2;
      ctx.font = `10px ${env.font.mono}`;
      ctx.textAlign = "right";
      ctx.fillText("budget", px(s.budget) - 4, topY - 14);

      // ---- lanes -------------------------------------------------------------
      for (let i = 0; i < 4; i++) {
        const cy = topY + laneH * i + laneH / 2;
        const w = s.work[i];

        // rail
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x0, cy);
        ctx.lineTo(x1, cy);
        ctx.stroke();
        ctx.lineCap = "butt";

        // trail of every earlier tick
        ctx.fillStyle = lane[i].color;
        for (let t = 0; t < s.hist.length; t++) {
          ctx.globalAlpha = 0.10 + 0.22 * (t / Math.max(1, s.hist.length));
          const tx = px(s.hist[t][i]);
          ctx.beginPath();
          ctx.arc(tx, cy, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;

        // lane name (never colour alone)
        ctx.textAlign = "right";
        ctx.fillStyle = C.text;
        ctx.font = `12px ${env.font.mono}`;
        ctx.fillText(lane[i].name, x0 - 12, cy + 4);

        // the racer dot
        const dx = px(w);
        const offTrack = pos(w) > 1;
        ctx.fillStyle = lane[i].color;
        ctx.beginPath();
        ctx.arc(Math.min(dx, x1 + 18), cy, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.surface;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (offTrack) {
          // chevron: this racer has run off the end of the budget
          const ax = x1 + 30;
          ctx.fillStyle = C.danger;
          ctx.beginPath();
          ctx.moveTo(ax, cy - 6);
          ctx.lineTo(ax + 10, cy);
          ctx.lineTo(ax, cy + 6);
          ctx.closePath();
          ctx.fill();
        }

        // op count on the right
        ctx.textAlign = "left";
        ctx.fillStyle = offTrack ? C.danger : C.text2;
        ctx.font = `11px ${env.font.mono}`;
        const wl = w < 100000 ? String(Math.round(w)) : w.toExponential(1).replace("e+", "e");
        ctx.fillText(wl, x1 + 44, cy + 4);
      }

      // ---- legend ------------------------------------------------------------
      const ly = H - 42;
      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.base}`;
      let lx = 16;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = lane[i].color;
        ctx.beginPath();
        ctx.arc(lx + 5, ly - 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = C.text2;
        const txt = `${lane[i].name} \u2014 ${lane[i].form}`;
        ctx.fillText(txt, lx + 15, ly);
        lx += 15 + ctx.measureText(txt).width + 22;
      }
      ctx.fillStyle = C.danger;
      ctx.beginPath();
      ctx.moveTo(lx, ly - 9);
      ctx.lineTo(lx + 9, ly - 4);
      ctx.lineTo(lx, ly + 1);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = C.text2;
      ctx.fillText("off the track (over budget)", lx + 14, ly);

      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("dot = work needed at the current n; faint dots = every smaller n", 16, H - 12);
    }
  },

  drill: {
    cards: [
      { q: "Formally, what does `f(n) = O(g(n))` mean?", a: "There exist constants `c > 0` and `n₀` with `f(n) ≤ c·g(n)` for all `n ≥ n₀`. It is an asymptotic **upper** bound up to a constant factor — nothing about small n, nothing about tightness.", tags: ["definition"] },
      { q: "Two loops over the same array vs. a loop over `a` then a loop over `b` — complexities?", a: "Nested loops over the same input multiply: O(n²). Sequential loops over independent inputs add: O(a + b). Collapsing two independent sizes into one `n` is the most common analysis error.", tags: ["counting", "pitfall"] },
      { q: "Why is `x in some_list` inside a loop a red flag?", a: "List membership is O(n), so the loop becomes O(n·m). Hashing one side into a `set` first makes it O(n + m) time and O(min(n,m)) space.", tags: ["pitfall", "hashing"] },
      { q: "What does 'amortised O(1)' mean for dynamic-array append?", a: "Any sequence of n appends costs O(n) total, because capacity doubling makes an O(k) resize happen only after k cheap appends. It is a worst-case guarantee over a sequence, not an average over random inputs.", tags: ["amortised"] },
      { q: "O vs Ω vs Θ?", a: "O = upper bound, Ω = lower bound, Θ = both. Quicksort is O(n²) and Ω(n log n); merge sort is Θ(n log n). The comparison-sort lower bound Ω(n log n) is a claim about all algorithms, not one.", tags: ["definition"] },
      { q: "What largest `n` fits a 10⁸-operation budget for O(n log n), O(n²) and O(2ⁿ)?", a: "About 5×10⁶ for n log n, about 10⁴ for n², and about 26 for 2ⁿ. Memorise these three — they let you read the intended complexity straight off the constraints.", tags: ["intuition", "constraints"] },
      { q: "Name three space costs candidates forget.", a: "The recursion stack (O(depth)), the output structure you build, and hidden copies such as Python slicing `a[1:]` or string concatenation in a loop.", tags: ["space", "pitfall"] },
      { q: "Why is hash-table lookup usually written O(1) with a caveat?", a: "It is O(1) *average* under a good hash; worst case is O(n) when everything collides, which an adversary (or a bad hash on structured keys) can force. Say 'average case' out loud.", tags: ["hashing", "worst-case"] }
    ],
    sixtySecond: [
      "Explain what Big-O actually measures, why constants are dropped, and why that does not mean constants are unimportant in practice.",
      "Given constraints n ≤ 20, n ≤ 2000 and n ≤ 10⁵, say what complexity each one is asking for and why.",
      "Explain amortised O(1) append and why growing a dynamic array by a fixed increment instead of doubling breaks it."
    ]
  }
};
