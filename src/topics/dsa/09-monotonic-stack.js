// Lesson 09 — Stacks & Monotonic Stack (track: dsa)
// Exactly one statement below, no imports, no top-level consts.
// `frames` is pure (uses only the injected `rng`); `draw` reads every colour from env.colors.

export default {
  id: "monotonic-stack",
  track: "dsa",
  title: "Stacks & Monotonic Stack",
  difficulty: 2,
  minutes: 16,
  tags: ["stacks", "monotonic", "amortised-analysis", "arrays"],

  explainer: [
    { type: "p", text: "A stack is a container where you can only add or remove items from one end, called the top — like a stack of plates, where you always place a new plate on top and always take the top plate off first, never reaching into the middle. This 'last one in is the first one out' behavior is usually called LIFO. A monotonic stack is an ordinary stack with one extra rule bolted on: you only ever push a new item after first popping off (removing) any items at the top that would break a chosen order — for example, before pushing a new number, you might pop off every number already on top that is smaller than it, so that the stack always stays sorted from largest at the bottom to smallest at the top. Think of it like a bouncer at a club with a 'tallest people at the back' policy: before letting someone new in at the back, the bouncer walks anyone shorter than the newcomer back out to the front, so the line stays sorted at all times." },
    { type: "p", text: "This one small discipline — pop anything that would break the order, then push — turns out to solve an entire family of interview problems shaped like \"for every element, what is the nearest element to its right (or left) that is bigger (or smaller) than it?\" And it solves that whole family in a single linear pass through the array, meaning the total work is `O(n)` (n = number of elements) instead of the `O(n²)` (n squared — roughly n times n) you'd get from checking every pair of elements against each other. The reason it manages to be linear, even though the code looks like it shouldn't be, is exactly the part interviewers want you to be able to explain out loud." },

    { type: "h3", text: "The invariant" },
    { type: "p", text: "Before writing any code, it helps to name the invariant — the condition that must remain true after every single step, and which is what lets you trust the algorithm's output. For the 'next greater element' problem (find, for every position, the first value to its right that is bigger), the stack holds **indices whose answer is still unknown** — meaning we haven't yet found a bigger value to their right — and the heights (or values) at those indices are strictly decreasing as you look from the bottom of the stack to the top. That decreasing order isn't just a nice side effect; it is the entire reason the algorithm is fast, because it lets you stop popping early. If the new incoming value can't beat whatever is sitting on top of the stack, it definitely can't beat anything further down either, since everything further down is even bigger — so you don't have to check it." },

    { type: "code", lang: "python", code: "stack = []                      # indices, heights DECREASING bottom -> top\nfor i, x in enumerate(nums):\n    while stack and nums[stack[-1]] < x:\n        ans[stack.pop()] = x    # x is the first element to the right that beats it\n    stack.append(i)             # i's own answer is now pending\n# anything left never got beaten -> answer stays -1" },

    { type: "h3", text: "Why the nested loop is still O(n)" },
    { type: "p", text: "The `while` loop sitting inside the `for` loop *looks* like it should make this `O(n²)` — a loop inside a loop usually does. But you have to count the work differently here to see why it isn't: every index gets pushed onto the stack exactly once over the whole run, and every index gets popped off at most once over the whole run (once it's popped, it's gone for good — it's never pushed again). So no matter how unevenly the inner `while` loop's work is spread out across the different iterations of the outer `for` loop — sometimes it pops nothing, sometimes it pops many things at once — the total number of pushes across the entire run can never exceed `n`, and the total number of pops can never exceed `n` either. That caps the whole run at `2n` stack operations total. This style of reasoning — adding up the total cost across the *entire* run instead of judging any single step in isolation — is called amortised analysis (amortised meaning 'spread out and averaged over a sequence'), and this specific flavor of it is sometimes called the accounting method: think of every push as pre-paying for its own eventual pop." },
    { type: "callout", tone: "tip", text: "Say it in this exact shape: \"the inner loop can run many times in one iteration, but every pop consumes an element that was pushed once, so the total number of pops over all iterations is bounded by n — O(n) overall.\" That sentence is what the question is testing." },

    { type: "h3", text: "Choosing the direction" },
    { type: "list", items: [
      "**Next greater to the right** → keep a decreasing stack (values shrink from bottom to top), pop while the top of the stack is less than the current value, and scan the array left to right.",
      "**Next smaller to the right** → keep an increasing stack (values grow from bottom to top) instead, pop while the top of the stack is greater than the current value, and still scan left to right.",
      "**Previous greater to the left** → keep a decreasing stack and scan left to right as usual, but now the answer for position `i` is simply whatever value happens to remain on top of the stack right *before* you push `i` onto it — you're reading the answer off the stack instead of writing it in later.",
      "A useful rule of thumb: the stack ends up monotone (sorted) in the direction *opposite* to whatever you're searching for — decreasing when hunting for something greater, increasing when hunting for something smaller. And flipping the direction you scan the array in swaps a 'next' question into a 'previous' question, or vice versa."
    ]},

    { type: "h3", text: "Edge cases and traps" },
    { type: "list", items: [
      "**Ties.** Whether you use a strict `<` or a non-strict `<=` comparison when deciding to pop decides whether an equal value counts as 'greater'. For a strict next-greater search, use `<`, which lets equal-valued bars sit on the stack together rather than popping each other — and in the largest-rectangle problem specifically, that exact choice is what makes duplicate bar heights still produce the correct width for the rectangle.",
      "**Leftovers.** Any indices still sitting on the stack once the scan finishes never found a qualifying answer to their right at all. Rather than writing extra code to special-case this, just initialise the result array to `-1` everywhere up front, so 'never resolved' is already the default.",
      "**Circular arrays.** If the array wraps around (the element after the last one is the first one again), iterate `2n` times total using `i % n` (which wraps the index back into range), but only push new indices onto the stack during the first pass through — the second, wrap-around pass exists purely to give leftover indices a second chance to find an answer.",
      "**Sentinels.** A sentinel is a fake extra value you append to the end of the array purely to force cleanup — appending a `0` (in largest-rectangle) or a `+∞`, meaning positive infinity (in next-greater), automatically drains every remaining item off the stack at the end, which lets you delete the separate post-loop cleanup code you'd otherwise need to write by hand."
    ]},
    { type: "callout", tone: "pitfall", text: "Storing values instead of indices is the most common failure. You almost always need the index to compute a width (`i − stack[-1] − 1`) or to write into `ans[j]`. Push indices, read heights through them." }
  ],

  glossary: [
    { term: "Stack", plain: "A container where you can only add or remove items from one end (the top) — last item in is always the first one out." },
    { term: "LIFO", plain: "Short for 'last in, first out' — the behavior of a stack, where the most recently added item is always the next one removed." },
    { term: "Monotonic stack", plain: "A stack kept deliberately sorted (either always increasing or always decreasing from bottom to top) by popping off any items that would break that order before pushing a new one." },
    { term: "Push / pop", plain: "Push means adding an item to the top of a stack; pop means removing the item currently on top." },
    { term: "Invariant", plain: "A condition that stays true after every step of an algorithm — the fact you rely on to trust the final result is correct." },
    { term: "O(n) / linear time", plain: "Work that grows in direct proportion to the input size — one pass through the data." },
    { term: "O(n²) / quadratic time", plain: "Work that grows with the square of the input size — typically from checking every pair of elements, such as a loop nested inside another loop." },
    { term: "Amortised analysis", plain: "Reasoning about the total cost of an algorithm added up across its entire run, rather than judging any single step by itself — a loop that looks expensive on some steps can still be cheap overall this way." },
    { term: "Accounting method", plain: "A specific way of doing amortised analysis where you imagine each cheap operation (like a push) pre-paying in advance for a later expensive operation (like its eventual pop)." },
    { term: "Sentinel", plain: "A fake extra value added to the start or end of a data structure purely to simplify the code, often by forcing a cleanup step to run automatically instead of writing it by hand." },
    { term: "Monotonic deque", plain: "A double-ended queue (addable/removable from both the front and back) kept sorted as items enter and leave — used instead of a plain stack when you need to remove items from either end, such as in sliding-window-maximum." },
    { term: "Circular array", plain: "An array where the position after the last element wraps back around to the first element, as if the array were bent into a loop." }
  ],

  complexity: {
    rows: [
      { operation: "Next greater / smaller element", time: "O(n)", space: "O(n)", note: "each index pushed once, popped once" },
      { operation: "Largest rectangle in histogram", time: "O(n)", space: "O(n)", note: "same scan, width = i − stack[-1] − 1" },
      { operation: "Trapping rain water (stack)", time: "O(n)", space: "O(n)", note: "O(1) space with two pointers instead" },
      { operation: "Sliding window maximum", time: "O(n)", space: "O(k)", note: "monotonic deque, not a stack" },
      { operation: "Brute force baseline", time: "O(n²)", space: "O(1)", note: "what the stack replaces" }
    ]
  },

  interview: {
    whyAsked: "It separates people who memorised a template from people who can do amortised analysis. The code is eight lines; the signal is whether you can justify why a loop nested inside a loop is linear, and whether you can derive the right monotone direction instead of guessing it.",
    followUps: [
      { q: "Increasing or decreasing stack — how do you decide?", a: "Work out what invalidates a pending element. For next-greater, an element stops pending the moment something larger appears, so anything smaller than the incoming value must be popped, which keeps the stack decreasing. For next-smaller you pop everything larger, keeping it increasing. The stack is always monotone in the direction opposite to the thing you are searching for, and it always holds exactly the indices whose answers are still unresolved." },
      { q: "Solve largest rectangle in a histogram.", a: "Keep an increasing stack of indices. When `h[i]` is lower than the top, pop it and treat that popped bar as the rectangle's limiting height: its width runs from the new stack top (exclusive) to `i` (exclusive), i.e. `i − stack[-1] − 1`, and after popping everything the width is `i`. Append a sentinel height of 0 so the stack drains at the end. O(n) time and O(n) space, and the key insight is that a popped bar's rectangle is bounded exactly by the first strictly smaller bar on each side." },
      { q: "Sliding-window maximum — why a deque and not a stack?", a: "You need to evict from both ends: the front when the window's left edge passes an index, and the back when a new element dominates older, smaller ones. So you keep a deque of indices with decreasing values; the front is always the current window's maximum. Each index still enters and leaves once, so it is O(n) time and O(k) space — same amortised argument, different container." },
      { q: "Trapping rain water with a stack — how does it work?", a: "Keep a decreasing stack of indices. When a bar is taller than the top, that top is a valley floor: pop it, and if a left wall remains on the stack, the water above the floor is `(min(h[left], h[i]) − h[floor]) × (i − left − 1)`. This accumulates the water in horizontal layers rather than column by column. The two-pointer solution computes the same total in O(1) space, so mention both and let the interviewer choose." },
      { q: "What if the array is circular?", a: "Loop `i` from 0 to `2n − 1` and index with `i % n`, popping and resolving on every step but pushing only while `i < n`. The second lap resolves elements that had no greater value to their right in the linear view. Complexity is unchanged: still at most n pushes and n pops, so O(n)." },
      { q: "Prove the O(n) bound formally.", a: "Use the accounting method: charge each push 2 credits — one for the push itself and one saved to pay for the eventual pop. A pop is then free, since it spends a credit deposited earlier. Total credits spent is at most 2n, and no operation can ever run out of credit because nothing is popped twice. Therefore the total work over the whole loop is O(n), even though a single iteration can perform Θ(n) pops." }
    ]
  },

  code: [
    { lang: "python", label: "Next greater element", code: "def next_greater(nums):\n    n = len(nums)\n    ans = [-1] * n              # default: nothing to the right is bigger\n    stack = []                  # INDICES whose answer is still pending,\n                                # with nums[stack] strictly decreasing bottom -> top\n    for i, x in enumerate(nums):\n        # x resolves every pending index it beats. Each index is popped at most\n        # once in the whole run, so this while loop is O(n) TOTAL, not per-i.\n        while stack and nums[stack[-1]] < x:\n            ans[stack.pop()] = x\n        stack.append(i)         # x's own answer is now pending\n    return ans                  # leftovers keep -1\n\ndef next_greater_circular(nums):\n    n = len(nums)\n    ans, stack = [-1] * n, []\n    for i in range(2 * n):      # second lap resolves the leftovers only\n        x = nums[i % n]\n        while stack and nums[stack[-1]] < x:\n            ans[stack.pop()] = x\n        if i < n:\n            stack.append(i)\n    return ans" },

    { lang: "python", label: "Largest rectangle in histogram", code: "def largest_rectangle(heights):\n    stack = []                       # indices with INCREASING heights\n    best = 0\n    for i, h in enumerate(heights + [0]):   # sentinel 0 drains the stack\n        while stack and heights[stack[-1]] > h:\n            top = stack.pop()\n            # the popped bar is the limiting height; it extends right up to i\n            # (first strictly smaller on the right) and left down to the new\n            # stack top (first strictly smaller on the left), both exclusive.\n            left = stack[-1] if stack else -1\n            width = i - left - 1\n            best = max(best, heights[top] * width)\n        stack.append(i)\n    return best\n\ndef maximal_rectangle(matrix):\n    # every row becomes a histogram of consecutive 1s above it -> O(rows * cols)\n    if not matrix:\n        return 0\n    heights = [0] * len(matrix[0])\n    best = 0\n    for row in matrix:\n        for j, cell in enumerate(row):\n            heights[j] = heights[j] + 1 if cell == \"1\" else 0\n        best = max(best, largest_rectangle(heights))\n    return best" },

    { lang: "python", label: "Rain water & the monotonic deque", code: "from collections import deque\n\ndef trap(height):\n    stack, water = [], 0         # decreasing stack of indices\n    for i, h in enumerate(height):\n        while stack and height[stack[-1]] < h:\n            floor = stack.pop()  # this bar is the bottom of a puddle\n            if not stack:\n                break            # no left wall -> water spills out\n            left = stack[-1]\n            depth = min(height[left], h) - height[floor]\n            water += depth * (i - left - 1)   # one horizontal layer\n        stack.append(i)\n    return water\n\ndef max_sliding_window(nums, k):\n    dq = deque()                 # indices, values decreasing front -> back\n    out = []\n    for i, x in enumerate(nums):\n        while dq and dq[0] <= i - k:\n            dq.popleft()         # front left the window\n        while dq and nums[dq[-1]] <= x:\n            dq.pop()             # a smaller older value can never win again\n        dq.append(i)\n        if i >= k - 1:\n            out.append(nums[dq[0]])\n    return out                   # each index enters and leaves once -> O(n)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 320 },

    params: [
      { key: "n",    label: "Bars",      type: "int",  min: 6, max: 24, default: 12 },
      { key: "mode", label: "Looking for", type: "enum", options: ["next-greater", "next-smaller"], default: "next-greater" },
      { key: "seed", label: "Reshuffle", type: "seed" }
    ],

    frames: function* (params, rng) {
      const out = [];
      const MAXF = 300;

      const n = Math.max(2, Math.min(24, Math.floor(params && params.n ? params.n : 12)));
      const greater = !(params && params.mode === "next-smaller");
      const word = greater ? "greater" : "smaller";
      const dir = greater ? "decreasing" : "increasing";

      const h = [];
      for (let i = 0; i < n; i++) h.push(2 + Math.floor(rng() * 18));

      const PENDING = -2; // sentinel: this index's answer is not known yet
      const ans = [];
      for (let i = 0; i < n; i++) ans.push(PENDING);

      let stack = [];
      let pushes = 0;
      let pops = 0;
      let compares = 0;

      const snap = function (extra) {
        const s = {
          mode: greater ? "next-greater" : "next-smaller",
          n: n,
          h: h.slice(),
          ans: ans.slice(),
          stack: stack.slice(),
          i: -1,
          popping: -1,
          pushes: pushes,
          pops: pops,
          compares: compares,
          done: false
        };
        if (extra) for (const k in extra) s[k] = extra[k];
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
        "Goal: for every bar, the first bar to its RIGHT that is " + word +
          ". Brute force is O(n²); a " + dir + " stack does it in one pass because each index is pushed once and popped once.",
        "init",
        snap()
      );

      for (let i = 0; i < n && out.length < MAXF - 6; i++) {
        add(
          "Bar " + i + " arrives with height " + h[i] + ". Every index still on the stack is waiting for its next " +
            word + " element — bar " + i + " might be the answer for some of them.",
          "arrive",
          snap({ i: i }),
          [i]
        );

        for (;;) {
          if (stack.length === 0) {
            compares++;
            add(
              "The stack is empty, so there is nothing left to resolve. Bar " + i + " simply becomes the new pending index.",
              "compare",
              snap({ i: i, compares: compares }),
              [i]
            );
            break;
          }
          const top = stack[stack.length - 1];
          const beats = greater ? h[top] < h[i] : h[top] > h[i];
          compares++;
          if (!beats) {
            add(
              "Top of stack is bar " + top + " (height " + h[top] + "). Bar " + i + " (" + h[i] + ") does not beat it, and everything deeper in the stack is " +
                (greater ? "even taller" : "even shorter") + " — so nothing below can be resolved either. Stop popping: that early exit is the whole point of the ordering.",
              "compare",
              snap({ i: i, compares: compares }),
              [i, top]
            );
            break;
          }

          add(
            "h[" + top + "] = " + h[top] + (greater ? " < " : " > ") + h[i] +
              " = h[" + i + "], so bar " + i + " IS the next " + word + " element of bar " + top + ". Pop it and write answer[" + top + "] = " + h[i] + ".",
            "pop",
            snap({ i: i, popping: top, compares: compares }),
            [i, top]
          );

          stack = stack.slice(0, stack.length - 1);
          ans[top] = h[i];
          pops++;
        }

        stack = stack.concat([i]);
        pushes++;
        add(
          "Push " + i + ". The stack now holds [" + stack.map(function (j) { return h[j]; }).join(", ") +
            "] bottom→top, still " + dir + ". Running totals: " + pushes + " pushes, " + pops +
            " pops — never more than " + (2 * n) + " stack operations in the whole run.",
          "push",
          snap({ i: i, pushes: pushes }),
          [i]
        );
      }

      // Drain: everything still pending never found an answer.
      while (stack.length > 0 && out.length < MAXF - 2) {
        const top = stack[stack.length - 1];
        stack = stack.slice(0, stack.length - 1);
        ans[top] = -1;
        pops++;
        add(
          "Bar " + top + " (height " + h[top] + ") survived to the end of the scan, so nothing to its right is " +
            word + ": answer[" + top + "] = −1. This is why the result array is initialised to −1 instead of special-cased.",
          "drain",
          snap({ popping: top, pops: pops }),
          [top]
        );
      }

      add(
        "Done in one pass: " + pushes + " pushes and " + pops + " pops for " + n +
          " bars — at most 2n stack operations. The inner while loop looks quadratic, but every pop consumes an index that was pushed exactly once, so the TOTAL work is O(n).",
        "done",
        snap({ done: true })
      );

      yield* out;
    },

    draw: function (frame, ctx, env) {
      const C = env.colors;
      const W = env.width;
      const H = env.height;
      const s = frame.state;
      const n = s.n;

      ctx.clearRect(0, 0, W, H);
      ctx.textBaseline = "alphabetic";

      const pad = 18;
      const panelW = Math.min(150, Math.max(96, W * 0.2));
      const chartX = pad;
      const chartW = W - pad * 2 - panelW - 14;
      const headerH = 46;
      const legendH = 22;
      const ansH = 26;
      const chartTop = headerH + 12;
      const chartBottom = H - legendH - ansH - 14;
      const chartH = Math.max(30, chartBottom - chartTop);

      let maxH = 1;
      for (let i = 0; i < n; i++) if (s.h[i] > maxH) maxH = s.h[i];

      const cellW = chartW / n;
      const onStack = [];
      for (let i = 0; i < n; i++) onStack.push(false);
      for (let i = 0; i < s.stack.length; i++) onStack[s.stack[i]] = true;

      // ---- header ------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText(
        s.mode === "next-greater"
          ? "Next greater element — stack decreasing bottom→top"
          : "Next smaller element — stack increasing bottom→top",
        pad,
        20
      );
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText(
        "pushes " + s.pushes + "   pops " + s.pops + "   comparisons " + s.compares +
          "   ·   stack ops ≤ 2n = " + 2 * n,
        pad,
        38
      );

      // ---- bars --------------------------------------------------------------
      for (let i = 0; i < n; i++) {
        const x = chartX + i * cellW;
        const bh = Math.max(4, (s.h[i] / maxH) * (chartH - 16));
        const y = chartTop + chartH - bh;

        let fill = C.surface2;   // not reached yet
        if (i === s.popping) fill = C.viz2;            // being popped right now
        else if (i === s.i) fill = C.viz1;             // the incoming bar
        else if (onStack[i]) fill = C.viz4;            // pending / candidate
        else if (s.ans[i] !== -2) fill = C.viz3;       // resolved
        const dim = i > s.i && s.i >= 0 && !s.done;

        ctx.globalAlpha = dim ? 0.4 : 1;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x + 1, y, Math.max(2, cellW - 3), bh, 3);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (cellW > 16) {
          ctx.fillStyle = C.text2;
          ctx.font = "10px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.fillText(String(s.h[i]), x + cellW / 2, y - 4);
        }

        // index + resolved answer strip under the chart
        ctx.fillStyle = C.muted;
        ctx.font = "9px " + env.font.mono;
        ctx.textAlign = "center";
        if (cellW > 13) ctx.fillText(String(i), x + cellW / 2, chartTop + chartH + 12);

        const a = s.ans[i];
        if (cellW > 13) {
          if (a === -2) {
            ctx.fillStyle = C.muted;
            ctx.fillText("·", x + cellW / 2, chartTop + chartH + 25);
          } else if (a === -1) {
            ctx.fillStyle = C.text2;
            ctx.fillText("−1", x + cellW / 2, chartTop + chartH + 25);
          } else {
            ctx.fillStyle = C.viz3;
            ctx.fillText(String(a), x + cellW / 2, chartTop + chartH + 25);
          }
        }
      }

      // baseline
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(chartX, chartTop + chartH + 0.5);
      ctx.lineTo(chartX + chartW, chartTop + chartH + 0.5);
      ctx.stroke();

      ctx.fillStyle = C.muted;
      ctx.font = "9px " + env.font.mono;
      ctx.textAlign = "left";
      ctx.fillText("answer", chartX, chartTop + chartH + 25);

      // ---- stack panel -------------------------------------------------------
      const px = W - pad - panelW;
      const pTop = chartTop;
      const pH = chartH;

      ctx.fillStyle = C.surface;
      ctx.beginPath();
      ctx.roundRect(px, pTop, panelW, pH, 6);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px, pTop, panelW, pH, 6);
      ctx.stroke();

      ctx.fillStyle = C.text2;
      ctx.font = "10px " + env.font.base;
      ctx.textAlign = "center";
      ctx.fillText("stack (top)", px + panelW / 2, pTop + 14);
      ctx.fillStyle = C.muted;
      ctx.fillText("(bottom)", px + panelW / 2, pTop + pH - 6);

      const slotH = 22;
      const room = Math.max(1, Math.floor((pH - 30) / slotH));
      const depth = s.stack.length;
      const shown = Math.min(depth, room);

      for (let k = 0; k < shown; k++) {
        // k = 0 is the TOP of the stack, drawn nearest the panel's top label
        const idx = s.stack[depth - 1 - k];
        const y = pTop + 20 + k * slotH;
        const isTop = k === 0;

        ctx.fillStyle = isTop ? C.viz4 : C.surface2;
        ctx.beginPath();
        ctx.roundRect(px + 8, y, panelW - 16, slotH - 4, 4);
        ctx.fill();

        ctx.fillStyle = isTop ? C.surface : C.text2;
        ctx.font = "11px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText("i=" + idx + "  h=" + s.h[idx], px + panelW / 2, y + slotH - 10);
      }

      if (depth > shown) {
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText("+" + (depth - shown) + " deeper", px + panelW / 2, pTop + 20 + shown * slotH + 11);
      }

      if (depth === 0) {
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText("empty", px + panelW / 2, pTop + pH / 2);
      }

      // the bar currently being popped, echoed beside the panel
      if (s.popping >= 0) {
        ctx.fillStyle = C.viz2;
        ctx.font = "10px " + env.font.mono;
        ctx.textAlign = "right";
        ctx.fillText("pop i=" + s.popping, px - 8, pTop + 14);
      }

      // ---- legend ------------------------------------------------------------
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
      chip(C.viz1, "incoming bar");
      chip(C.viz4, "on the stack (answer pending)");
      chip(C.viz2, "being popped / resolved now");
      chip(C.viz3, "answer recorded");
    }
  },

  drill: {
    cards: [
      { q: "What does a monotonic stack actually hold?", a: "Indices whose answer is still unresolved, kept in monotone order of their values. For next-greater the values decrease from bottom to top.", tags: ["invariant"] },
      { q: "Why is the while-inside-for loop O(n) and not O(n²)?", a: "Each index is pushed exactly once and popped at most once, so there are at most n pushes and n pops in total. The inner loop's iterations are bounded globally, not per outer iteration.", tags: ["amortised", "complexity"] },
      { q: "Why can you stop popping as soon as the top survives?", a: "The stack is monotone, so everything below the top is even further from qualifying. If the incoming element cannot beat the top, it cannot beat anything deeper.", tags: ["invariant"] },
      { q: "Increasing or decreasing stack for next-SMALLER-element?", a: "Increasing: you pop every index whose value is larger than the incoming one, so what remains is increasing bottom to top.", tags: ["direction"] },
      { q: "In largest-rectangle-in-histogram, what is the width of a popped bar's rectangle?", a: "`i - stack[-1] - 1`, where `i` is the first strictly smaller bar to the right and `stack[-1]` the first strictly smaller to the left (or `i` if the stack is empty).", tags: ["histogram"] },
      { q: "Why does sliding-window maximum need a deque rather than a stack?", a: "You evict from both ends: the front when the window slides past an index, and the back when a new, larger value dominates older ones. The monotone invariant and the O(n) amortised argument are identical.", tags: ["deque"] },
      { q: "How do you handle a circular array with a monotonic stack?", a: "Iterate `2n` times with `i % n`, resolving on every step but pushing only while `i < n`. The second lap exists purely to resolve leftovers, and the cost is still O(n).", tags: ["variant"] },
      { q: "Why push indices instead of values?", a: "Widths and result writes need positions: `ans[j] = x` and `width = i - stack[-1] - 1`. Values alone throw away the information the algorithm depends on.", tags: ["pitfall"] }
    ],
    sixtySecond: [
      "Explain the monotonic-stack invariant and give the amortised argument for why a loop nested in a loop is still O(n).",
      "Derive the largest-rectangle-in-histogram solution from the next-smaller-element pattern, including where the width formula comes from.",
      "Explain how you decide between an increasing and a decreasing stack, and how the choice changes for previous- versus next-element questions."
    ]
  }
};
