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
    { type: "p", text: "Big-O notation is a way of describing how much slower a piece of code gets as you give it more data, without tying that description to any particular computer or programming language. Instead of measuring seconds — which depend on hardware you don't control — Big-O asks a simpler question: if the input doubles, does the amount of work stay the same, double, quadruple, or explode? That question is what interviewers actually care about, because it predicts whether your solution will still finish in time when the input is a million items instead of ten. It is a bit like describing a car by its miles-per-gallon rating instead of by how much fuel it used on one specific errand: the rating lets you compare cars and predict cost on trips you have not taken yet, and Big-O lets you compare algorithms and predict runtime on inputs you have not tested yet." },
    { type: "p", text: "Big-O is not a stopwatch — it does not tell you how many milliseconds something takes. It answers exactly one question: *as the input grows, how does the amount of work grow?* Small constant factors and smaller extra terms get dropped from the notation because they stop mattering once the input, usually called `n` (short for 'number of elements'), gets large. `3n + 400` and plain `n` both grow in a straight line as `n` increases, so Big-O calls them the same shape. `n` and `n²` (n squared) never grow the same way, no matter how large the constants are, so Big-O always keeps them separate." },

    { type: "h3", text: "The intuition: growth, not speed" },
    { type: "p", text: "Here is a mental model that makes the abstract idea concrete: imagine every algorithm gets the same fixed budget of operations to work with — say 10⁸ (100 million) operations, which is roughly what a modern CPU can do in about one second. Big-O tells you the largest input size, `n`, that fits inside that budget for a given algorithm shape. An algorithm that does `O(n²)` work (its work grows with the square of the input) can only afford an `n` of about 10,000 before it blows the budget. An algorithm that does `O(n log n)` work can afford an `n` of about 5,000,000. An algorithm that does `O(2ⁿ)` work — work that doubles with every extra input element — can only afford an `n` of about 26 before it runs out of budget. That is the whole lesson in one picture: the *shape* of the growth, not the specific constant multiplier in front of it, decides which problem sizes are even reachable." },
    { type: "list", items: [
      "**O(1) — constant time.** A hash lookup, reading an array by index, or pushing/popping from the end of a list. The amount of work stays exactly the same no matter how big `n` is.",
      "**O(log n) — logarithmic time.** Binary search, or walking down a balanced tree. `log n` means 'the number of times you can cut n in half before reaching 1' — each step throws away a constant *fraction* of what's left, so the work barely grows even as `n` grows enormously (log₂ of a billion is only about 30).",
      "**O(n) — linear time.** One pass over the data, touching each element once. This is the floor — the minimum possible work — for any algorithm that genuinely has to look at every element at least once.",
      "**O(n log n) — linearithmic time.** Comparison-based sorting algorithms, and divide-and-conquer algorithms that do a linear amount of merging work at each level. At the sizes you see in interviews, this behaves so close to linear that the difference rarely matters in practice.",
      "**O(n²) — quadratic time.** Typically a loop nested inside another loop over the same array, so the work is roughly `n` times `n`. This is fine when `n` is around 1,000, but becomes hopelessly slow once `n` reaches a million.",
      "**O(2ⁿ) / O(n!) — exponential / factorial time.** Enumerating every subset (`2ⁿ` of them) or every ordering (`n!` of them) of the input. This is only realistic when the problem itself caps `n` at something small — seeing a constraint like `n ≤ 20` in a problem statement is the usual signal that this is the intended, accepted complexity."
    ]},

    { type: "h3", text: "How to actually count it" },
    { type: "list", items: [
      "**Sequential blocks of code add together, and you keep only the largest term.** If your function does an `O(n)` step followed by an `O(n log n)` step, the total is `O(n) + O(n log n)`, which simplifies to just `O(n log n)` — the smaller term is swallowed by the larger one and can be dropped.",
      "**Nested loops multiply their costs — but only when the inner loop's bound actually depends on the outer loop's variable.** Two separate loops that each run up to `n` and are nested inside each other cost `O(n²)`. But a loop up to `n` that contains a loop up to a fixed number like `1000` still costs `O(n)`, because `1000` is a constant, not something that grows with `n`.",
      "**Give different inputs different letters instead of lumping them into one `n`.** If you scan an array `a` of size `a` and then a separate array `b` of size `b`, the cost is `O(a + b)` — never `O(n²)`. Collapsing two independently-sized inputs into a single variable called `n` and then reasoning as if they were the same size is the single most common analysis mistake candidates make in interviews.",
      "**Amortised is not the same idea as average.** A dynamic array (like Python's `list` or Java's `ArrayList`) reports its `append` operation as `O(1)` amortised. 'Amortised' means: if you look at a long *sequence* of appends, the occasional expensive `O(n)` resize is paid for — spread out — by the many cheap appends that came before it, so the average cost per append across the whole sequence is constant. This is a guaranteed fact about worst-case sequences, not a probabilistic claim about typical inputs — it holds even in the worst case, every time."
    ]},

    { type: "code", lang: "python", code: "# O(a + b), NOT O(n^2) — two independent inputs.\nfor x in a:\n    seen.add(x)\nfor y in b:\n    if y in seen:\n        hits += 1" },

    { type: "h3", text: "The formal definition, and why it is worth knowing" },
    { type: "p", text: "You can get a long way in interviews on intuition alone, but it helps to know the precise definition too, because interviewers sometimes probe it directly. Formally, `f(n) = O(g(n))` means: there exist some positive constant `c` and some starting point `n₀` such that `f(n) ≤ c · g(n)` for every `n` at or beyond `n₀`. In plain words: once the input is big enough, `g(n)` is an upper bound on `f(n)`, allowing for some fixed multiplier `c`. This matters because Big-O, on its own, only ever describes an *upper* bound — it says 'no worse than this', not 'exactly this'. There are two related pieces of notation that fill in the rest of the picture: `Ω` (the Greek letter Omega) describes a *lower* bound — 'at least this much work' — and `Θ` (the Greek letter Theta) means both bounds hold at once, i.e. a *tight* bound. Because of this, the statement 'quicksort is `O(n²)`' is technically true but not very informative, since `O(n²)` is a loose upper bound that quicksort rarely actually reaches. The statement 'quicksort is `Θ(n log n)`' is actually false, because quicksort's worst case really is `n²`; the honest statement is that quicksort is `O(n²)` and `Θ(n log n)` only on average, over random inputs." },

    { type: "callout", tone: "pitfall", text: "The trap interviewers set: they ask for the time complexity of a solution that builds up a list, get your answer, and then ask \"and what about the space complexity?\" Space complexity means how much extra memory the algorithm uses beyond the input itself, and three things people forget to count toward it: the call stack used by recursion, the output data structure you are building and returning, and any hidden copies your language makes behind the scenes. In Python specifically, slicing an array inside a loop — `a[1:]` — silently copies the whole remaining array every time, which quietly turns what looked like an `O(n)` scan into an `O(n²)` algorithm without a single explicit loop giving it away." },

    { type: "h3", text: "Edge cases people get wrong" },
    { type: "list", items: [
      "**Calling a sort function inside a loop.** `for x in a: b.sort()` costs `O(n · m log m)`, where `n` is how many times the loop runs and `m` is the size of `b` being sorted each time — not the `O(n log n)` you'd get from sorting once outside the loop.",
      "**Checking `x in some_list` is O(n)** because it has to scan the list one element at a time looking for a match; the same check on a `set` or `dict` (a hash-based container) is `O(1)` on average, because it jumps straight to where the value should be. Doing a list-membership check inside a loop is the classic, easy-to-miss way to accidentally write an `O(n²)` algorithm.",
      "**Building up a string with repeated concatenation inside a loop** costs `O(n²)` in Python and Java, because strings in those languages are immutable — every `+=` creates a brand-new string and copies everything so far into it. The fix is to append pieces to a list and join them once at the end with `\"\".join(...)`, which is `O(n)`.",
      "**Hash tables (the data structure behind `dict`/`set`/hash maps) are `O(1)` on *average*, but `O(n)` in the worst case** if an adversary — or unlucky structured input — causes many keys to collide into the same bucket. Say the word 'average' out loud when you claim `O(1)` for a hash table; interviewers are specifically listening for that caveat.",
      "**The recursion call stack itself costs space.** A recursive depth-first search on a graph shaped like a straight chain (a 'path graph') uses `O(n)` stack space to hold all the nested calls, even though the algorithm only visits each node exactly once — the space cost comes from how deep the recursion goes, not from how many nodes it touches."
    ]},

    { type: "callout", tone: "tip", text: "Read the numeric constraints in the problem statement before you start designing — they are a direct hint at the complexity the interviewer expects. Seeing `n ≤ 20` is practically shouting 'exponential is fine here' (bitmask enumeration or backtracking, since `2ⁿ` stays small). `n ≤ 2000` comfortably permits an `O(n²)` dynamic-programming solution. `n ≤ 10⁵` (100,000) demands `O(n log n)` or better. `n ≤ 10⁹` (a billion) means you cannot even loop over every element once — the intended answer is a closed-form math formula, binary search on the answer, or something `O(log n)`." }
  ],

  glossary: [
    { term: "Big-O notation", plain: "A way of describing how the running time or memory use of an algorithm grows as the input gets bigger, ignoring the exact hardware and constant multipliers." },
    { term: "n", plain: "The standard variable name for 'size of the input' — for example, the number of elements in an array." },
    { term: "O(1) / constant time", plain: "The work stays the same no matter how big the input is." },
    { term: "O(log n) / logarithmic time", plain: "The work grows very slowly, roughly by the number of times you can cut the input in half — doubling the input only adds one more step." },
    { term: "O(n) / linear time", plain: "The work grows in direct proportion to the input size — twice the input means roughly twice the work." },
    { term: "O(n log n) / linearithmic time", plain: "Slightly more than linear; the typical cost of a good sorting algorithm. At interview-sized inputs it behaves almost like O(n)." },
    { term: "O(n²) / quadratic time", plain: "The work grows with the square of the input size — doubling the input roughly quadruples the work. Usually caused by a loop nested inside another loop." },
    { term: "O(2ⁿ) / exponential time", plain: "The work doubles every time the input grows by one — only usable when the problem guarantees the input stays very small." },
    { term: "Amortised O(1)", plain: "Almost every individual operation is cheap, and the occasional expensive operation is rare enough that its cost, spread out over all the operations, averages down to constant — this is a guarantee, not a probability." },
    { term: "Ω (Omega notation)", plain: "A lower bound on how much work an algorithm needs — 'it can't be done in less than this.'" },
    { term: "Θ (Theta notation)", plain: "A tight bound: both an upper bound (O) and a lower bound (Ω) at once, meaning 'this is exactly the growth rate, not just a ceiling on it.'" },
    { term: "Space complexity", plain: "How much extra memory an algorithm uses beyond the input itself, including things like recursion call stacks and any new data structures it builds." },
    { term: "Hash table", plain: "A data structure (behind Python's dict/set, Java's HashMap, etc.) that stores key-value pairs and can look up a key in roughly constant time on average by computing where it should be stored." },
    { term: "Worst case vs average case", plain: "Worst case is the slowest an algorithm can ever run on any input; average case is how it performs on typical or random inputs, which can be much faster." }
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
