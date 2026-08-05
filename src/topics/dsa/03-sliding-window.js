// Lesson: Sliding Window  (track: dsa, order 03)
// Visualizer: longest-substring-without-repeating-characters. A translucent band
// slides over the character array; a live panel beside it shows the characters
// currently inside the window with their last-seen index, growing as the right
// edge expands and shrinking the instant the left edge jumps past a duplicate.

export default {
  id: "sliding-window",
  track: "dsa",
  title: "Sliding Window",
  difficulty: 1,
  minutes: 13,
  tags: ["arrays", "strings", "two-pointers", "hashing", "amortised"],

  explainer: [
    { type: "p", text: "A sliding window is a technique for looking at every contiguous chunk (every run of consecutive elements) of an array or string without literally re-checking each one from scratch. Picture a physical window frame — like a viewport — sliding across a strip of the data: it has a left edge and a right edge, and as it slides, elements enter on the right and leave on the left. Instead of picking a start and end point and re-scanning everything in between every single time (which is slow), you keep a small running summary — a count, a sum, a set of characters currently visible — and update that summary by just one element at a time as the window moves. This is why the technique is fast: it reuses almost all of the work from the previous position instead of redoing it." },
    { type: "p", text: "More precisely, a sliding window is a same-direction two-pointer scan — meaning both edges only ever move to the right, never backward — over a contiguous range, combined with a small piece of bookkeeping that lets you answer \"is the current window still valid?\" in constant time, `O(1)`, instead of having to re-examine the whole window. The right edge always moves forward. The left edge also only ever moves forward. That single fact is why the whole scan runs in `O(n)` time (n = size of the input) even though the code often *looks* like a loop nested inside another loop: each index enters the window exactly once and leaves it at most once, so there are never more than `2n` pointer moves in total across the entire scan — this is called an amortised bound, meaning the cost is measured by spreading it across the whole run rather than looking at any single step." },

    { type: "h3", text: "The invariant" },
    { type: "p", text: "Pick the invariant — the condition that must remain true after every step — *first*, before you write a single line of the loop; the loop's whole job is just to keep restoring that invariant whenever it breaks. For the classic 'longest substring without repeating characters' problem, the invariant is: **the substring `s[left..right]` (everything currently inside the window) contains no duplicate characters**. After the right edge pulls in a new character, that invariant might break — you might now have a duplicate inside the window. So you advance `left` just exactly far enough to fix it, and no further, because moving `left` any further than necessary would throw away windows that were actually still valid and could have been the answer. Every problem in this whole family boils down to the same three steps: expand the window on the right, restore the invariant by shrinking from the left, then record whatever answer you're tracking (like the window's length) before moving on." },

    { type: "code", lang: "python", code: "for right in range(n):\n    add(s[right])                 # expand\n    while not valid():            # restore the invariant\n        remove(s[left]); left += 1\n    best = max(best, right - left + 1)   # record" },

    { type: "h3", text: "Two flavours" },
    { type: "list", items: [
      "**Variable-size window** — the window's length changes as you go: grow it from the right, then shrink it from the left until it becomes valid again. This flavour answers questions shaped like \"find the longest/shortest contiguous run such that …\": no repeated characters, at most K distinct values, a sum of at least some target, or the smallest window that covers every character of a given pattern.",
      "**Fixed-size window** — the window's length is a constant `k` chosen up front, and the left edge simply trails exactly `k` positions behind the right edge at all times, moving in lockstep with it. This flavour answers questions shaped like \"find the best window of exactly size k\": the maximum average of any k consecutive elements, checking for anagram matches, or any other rolling statistic. There is no inner loop at all in this version — both edges move together, one step per iteration."
    ]},

    { type: "h3", text: "Why the left edge jumps instead of crawling one step at a time" },
    { type: "p", text: "If you keep a map from each character to the index where it was last seen (call it `last_seen`), you can move `left` in a single jump instead of nudging it forward one character at a time. When you see a repeated character `c`, you set `left = max(left, last_seen[c] + 1)`. The reasoning: any window that still contains *both* copies of `c` is automatically invalid, so the leftmost position that is still legal is exactly one step past wherever the earlier copy of `c` was. The `max(...)` here is doing real work, not just being defensive — without it, a stale entry left over in the map from *before* the current window even started could drag `left` backwards, silently letting an old duplicate back into the window. There is also a simpler alternative: a crawling version that removes one character at a time in a `while` loop until the duplicate is gone. That version is equally `O(n)` overall and is easier to get right under interview pressure; the one-jump version is also `O(n)` but does slightly less work per step." },

    { type: "callout", tone: "pitfall", text: "Writing `left = last_seen[c] + 1` without wrapping it in `max(left, ...)` is the single most common bug in this problem. Trace through the string `\"abba\"`: by the time you reach the final `a`, the map still says `last_seen['a'] = 0` from the very first character, even though `left` has already advanced to `2`. Assigning directly would move `left` backward to `1`, producing a window that actually contains two `b` characters — silently violating the invariant you were supposed to be protecting. Always clamp with `max(left, ...)`, or alternatively delete each character's entry from the map the moment it leaves the window on the left." },

    { type: "h3", text: "Edge cases and the boundary of the technique" },
    { type: "list", items: [
      "**Empty input** — the correct answer is 0, and the loop body never runs at all in this case, so whatever value you initialise your answer variable to before the loop must already be correct on its own.",
      "**All identical characters** — the window can never grow past length 1, and `left` has to jump forward on every single step. This is a good case to trace through by hand as a sanity check.",
      "**The alphabet size caps how long the answer can possibly be** — a window with no duplicate characters can never be longer than the number of distinct symbols that exist at all, so for lowercase English letters the answer can never exceed 26, no matter how long the input string `n` is.",
      "**Shrinking the window must be conditional on the invariant being broken, not automatic.** If you advance `left` on every single iteration regardless of whether the invariant actually broke, you've accidentally turned this into a fixed-size window and will get the wrong answer.",
      "**Negative numbers can break sum-based windows entirely.** A problem like \"shortest contiguous subarray with sum at least K\" only works as a sliding window when every value is non-negative, because that's precisely what guarantees the running sum only ever grows as the window expands (a property called monotonicity). If negative numbers are allowed, this technique no longer applies — you would instead need prefix sums combined with a monotonic deque (a double-ended queue that keeps its contents in sorted order as you add and remove from either end)."
    ]},

    { type: "callout", tone: "warn", text: "The trap interviewers like to set: they ask for the longest subarray with a sum of at least K, and then almost as an aside mention that the array may contain negative numbers. A plain two-pointer sliding window will silently produce wrong answers here, because there is no longer any monotonicity (the guarantee that the sum only moves in one direction as the window grows) to rely on. Always say the non-negative precondition out loud before you commit to writing the sliding-window loop." },

    { type: "callout", tone: "tip", text: "Be ready to prove the `O(n)` bound explicitly rather than just asserting it: \"the inner `while` loop looks like it's nested inside the outer loop, but `left` only ever increases and can move at most `n` times in total across the *entire* scan, so summed over every iteration of the outer loop, the inner loop does no more than `n` units of work altogether.\" That kind of amortised argument — reasoning about the total cost across the whole run rather than any single step — is precisely the signal this question is designed to test for." }
  ],

  glossary: [
    { term: "Sliding window", plain: "A technique that tracks a contiguous, moving chunk of an array or string using two edges (left and right), updating a running summary incrementally instead of re-scanning the chunk from scratch each time." },
    { term: "Two pointers", plain: "Using two moving index positions to scan data, instead of one, so that comparisons happen in a single pass." },
    { term: "Invariant", plain: "A condition that must remain true after every step of the algorithm — the thing the loop's logic exists to protect or restore." },
    { term: "O(1) / constant time", plain: "Work that stays the same no matter how large the input is — here, checking whether the window is still valid without re-scanning it." },
    { term: "O(n) / linear time", plain: "Work that grows in direct, roughly one-to-one proportion with the input size." },
    { term: "Amortised bound", plain: "A cost measured by adding up the total work across an entire run and dividing it out, rather than judging any single step in isolation — a step-by-step-looking loop can still be linear overall this way." },
    { term: "Monotonic / monotonicity", plain: "Only ever moving in one direction — for example, a running sum that only increases (never decreases) as you add more non-negative numbers to it." },
    { term: "Monotonic deque", plain: "A double-ended queue (addable/removable from both ends) that is kept sorted as items enter and leave, used when plain sliding-window logic breaks down (such as with negative numbers)." },
    { term: "Prefix sum", plain: "A precomputed running total, where the sum of any range of the array can be found instantly by subtracting two precomputed totals instead of adding up the range from scratch." },
    { term: "Anagram", plain: "A rearrangement of the same set of letters — e.g. 'listen' and 'silent' are anagrams of each other." }
  ],

  complexity: {
    rows: [
      { operation: "Longest substring, no repeats", time: "O(n)", space: "O(min(n, Σ))", note: "Σ = alphabet size; ≤ 128 for ASCII" },
      { operation: "Fixed window of size k", time: "O(n)", space: "O(1)", note: "rolling sum, no inner loop" },
      { operation: "Minimum window substring", time: "O(n + m)", space: "O(Σ)", note: "two counters plus a 'matched' tally" },
      { operation: "At most K distinct", time: "O(n)", space: "O(K)", note: "shrink while distinct > K" },
      { operation: "Brute force all substrings", time: "O(n²)–O(n³)", space: "O(1)", note: "the baseline you are beating" }
    ]
  },

  interview: {
    whyAsked: "It tests whether you can turn a nested-loop brute force into a linear scan by naming an invariant and an amortisation argument — and whether you notice that the technique has a precondition (monotonicity/contiguity) rather than pattern-matching it onto any subarray question. The `max(left, last+1)` clamp is a precise correctness detail interviewers use to separate memorised code from understood code.",
    followUps: [
      { q: "Why is this O(n) when there is a loop inside a loop?", a: "The inner loop advances `left`, which never decreases and is bounded by `n`, so across the entire outer loop it can execute at most `n` times in total — the cost is amortised, not per-iteration. Each index is added to the window once and removed at most once, giving at most 2n operations. Stating this bound is usually worth more than the code itself." },
      { q: "Why does `left = last_seen[c] + 1` need a `max` with the current `left`?", a: "Because `last_seen` may hold an index from before the window started. On `\"abba\"`, when the final `a` arrives `last_seen['a']` is still 0 while `left` has already advanced to 2; assigning directly would rewind `left` to 1 and re-admit the duplicate `b`. Clamping with `max(left, last_seen[c] + 1)` keeps the left edge monotone, which is also what preserves the O(n) bound." },
      { q: "How would you adapt this to 'at most K distinct characters'?", a: "Keep a count map instead of a last-seen map. Expand right and increment the count; while the number of distinct keys exceeds K, decrement the count at `left` and delete the key when it hits zero, then advance `left`. Track the distinct count as an integer rather than recomputing `len(map)` so the check stays O(1). Same skeleton, different validity predicate — that substitution is the whole family of problems." },
      { q: "When does the sliding window NOT apply?", a: "When the quantity you monitor is not monotone as the window grows. Sum-based windows require non-negative values; with negatives, extending the window can decrease the sum, so shrinking from the left is no longer justified and you need prefix sums with a monotonic deque instead. It also does not apply to non-contiguous subsequences at all — that is a DP or greedy problem." },
      { q: "Explain minimum-window-substring's bookkeeping.", a: "Keep `need` (counts required by the pattern) and `have` (counts inside the window), plus an integer `matched` counting how many distinct characters have reached their required count. Expand right and increment `matched` only when a character's window count exactly reaches its need; while `matched == len(need)` record the window and shrink from the left, decrementing `matched` when a count drops below its need. The `matched` counter is what keeps validity O(1) instead of comparing two maps each step." },
      { q: "How do you find all anagrams of a pattern in a string?", a: "That is the fixed-size flavour: a window of exactly `len(pattern)` characters where the frequency vector matches. Slide by one, incrementing the entering character and decrementing the leaving one, and maintain a `matched` counter so the comparison is O(1) rather than O(Σ). Total cost O(n) time and O(Σ) space." }
    ]
  },

  code: [
    { lang: "python", label: "Longest substring without repeats", code: "def length_of_longest_substring(s):\n    last = {}            # char -> last index seen\n    left = 0             # invariant: s[left..right] has no duplicates\n    best = 0\n    for right, c in enumerate(s):\n        # The max() is load-bearing: `last[c]` may predate the window,\n        # and letting `left` move backwards would re-admit a duplicate.\n        if c in last and last[c] >= left:\n            left = last[c] + 1        # every window holding both copies is invalid\n        last[c] = right\n        best = max(best, right - left + 1)\n    return best\n\n# O(n) time: `right` advances n times, `left` only ever advances -> <= 2n moves.\n# O(min(n, alphabet)) space for the map." },
    { lang: "python", label: "Generic variable window (at most K distinct)", code: "def longest_at_most_k_distinct(s, k):\n    count = {}\n    distinct = 0                     # keep it as an int: len(count) each step is O(K)\n    left = 0\n    best = 0\n    for right, c in enumerate(s):\n        if count.get(c, 0) == 0:\n            distinct += 1\n        count[c] = count.get(c, 0) + 1\n\n        while distinct > k:          # restore the invariant, no further\n            d = s[left]\n            count[d] -= 1\n            if count[d] == 0:\n                distinct -= 1        # d has fully left the window\n            left += 1\n\n        best = max(best, right - left + 1)\n    return best\n\n# Swap the predicate and you get: sum >= target, no repeats,\n# at most one odd count, ... the skeleton never changes." },
    { lang: "python", label: "Fixed-size window: find all anagrams", code: "def find_anagrams(s, p):\n    \"\"\"Every start index where s has a permutation of p. O(n) time, O(1) space.\"\"\"\n    if len(p) > len(s):\n        return []\n\n    need = [0] * 26\n    have = [0] * 26\n    idx = lambda ch: ord(ch) - 97\n    for ch in p:\n        need[idx(ch)] += 1\n\n    matched = sum(1 for i in range(26) if need[i] == 0)   # letters already satisfied\n    out = []\n    for right, ch in enumerate(s):\n        j = idx(ch)\n        have[j] += 1                       # element enters\n        if have[j] == need[j]:   matched += 1\n        elif have[j] == need[j] + 1: matched -= 1\n\n        if right >= len(p):                # element leaves: window size stays fixed\n            k = idx(s[right - len(p)])\n            have[k] -= 1\n            if have[k] == need[k]:   matched += 1\n            elif have[k] == need[k] - 1: matched -= 1\n\n        if matched == 26:                  # O(1) validity test, not a dict compare\n            out.append(right - len(p) + 1)\n    return out" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 200 },

    params: [
      { key: "n",        label: "String length", type: "int", min: 12, max: 40, default: 24 },
      { key: "alphabet", label: "Distinct letters", type: "int", min: 3, max: 8, default: 5 },
      { key: "seed",     label: "Re-generate", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(4, Math.min(40, params.n | 0));
      const k = Math.max(2, Math.min(8, params.alphabet | 0));
      const letters = "abcdefgh".slice(0, k);

      const chars = [];
      for (let i = 0; i < n; i++) chars.push(letters.charAt(Math.floor(rng() * k)));

      const panelOf = function (l, r) {
        const order = [], cnt = {}, last = {};
        for (let i = l; i <= r; i++) {
          const c = chars[i];
          if (cnt[c] === undefined) { cnt[c] = 0; order.push(c); }
          cnt[c] = cnt[c] + 1;
          last[c] = i;
        }
        const out = [];
        for (let j = 0; j < order.length; j++) {
          out.push({ ch: order[j], count: cnt[order[j]], last: last[order[j]] });
        }
        return out;
      };

      const seenAt = {};                 // char -> last index (may predate the window)
      let left = 0, best = 0, bestL = 0, jumps = 0;

      const snap = function (right, dupChar, dupPrev, panel) {
        return {
          chars: chars.slice(), n: n, alphabet: k,
          left: left, right: right,
          best: best, bestL: bestL, jumps: jumps,
          dupChar: dupChar, dupPrev: dupPrev,
          panel: panel
        };
      };

      yield {
        label: `Find the longest run of distinct characters. Invariant: everything inside the window s[left..right] is unique — the right edge always expands, and the left edge only ever moves forward.`,
        phase: "init",
        focus: [],
        state: snap(-1, null, null, [])
      };

      for (let right = 0; right < n; right++) {
        const c = chars[right];
        const prev = seenAt[c] === undefined ? -1 : seenAt[c];
        const inWindow = prev >= left;

        // 1. expand: the right edge swallows one character
        yield {
          label: `right expands to ${right} and reads '${c}'. Window is s[${left}..${right}], length ${right - left + 1}` +
                 (inWindow ? ` — but '${c}' is already inside, so the invariant is broken.` : ` — '${c}' is new to the window, so the invariant still holds.`),
          phase: inWindow ? "conflict" : "expand",
          focus: inWindow ? [prev, right] : [right],
          state: snap(right, inWindow ? c : null, inWindow ? prev : null, panelOf(left, right))
        };

        // 2. restore the invariant by jumping the left edge
        if (inWindow) {
          const target = prev + 1;
          left = target;
          jumps++;
          yield {
            label: `'${c}' repeats at index ${right}; its last occurrence was ${prev}, so left jumps to ${target} — every window containing both copies is invalid, and any smaller jump would leave one behind.`,
            phase: "shrink",
            focus: [prev, right],
            state: snap(right, c, prev, panelOf(left, right))
          };
        }

        seenAt[c] = right;
        const len = right - left + 1;

        // 3. record
        if (len > best) {
          const prevBest = best;
          best = len; bestL = left;
          yield {
            label: `s[${left}..${right}] = "${chars.slice(left, right + 1).join("")}" has ${len} distinct characters, beating ${prevBest} — record it as the best window.`,
            phase: "record",
            focus: [left, right],
            state: snap(right, null, null, panelOf(left, right))
          };
        } else {
          yield {
            label: `Window length ${len} does not beat the best of ${best} at [${bestL}..${bestL + best - 1}]; keep scanning — the left edge never rewinds, which is why the whole scan stays O(n).`,
            phase: "scan",
            focus: [left, right],
            state: snap(right, null, null, panelOf(left, right))
          };
        }
      }

      yield {
        label: `Done: longest run of distinct characters is ${best}, at s[${bestL}..${bestL + best - 1}] = "${chars.slice(bestL, bestL + best).join("")}". The right edge moved ${n} times and the left edge jumped ${jumps} times — at most 2n pointer moves, versus the ${(n * (n + 1)) / 2} substrings a brute force would test.`,
        phase: "done",
        focus: [bestL, bestL + best - 1],
        state: snap(n - 1, null, null, panelOf(left, n - 1))
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      const n = s.chars.length;

      ctx.clearRect(0, 0, W, H);

      const panelW = Math.min(230, Math.max(150, W * 0.22));
      const panelX = W - panelW - 14;
      const padX = 18;
      const areaW = panelX - 22 - padX;
      const tileW = areaW / n;
      const tileH = Math.min(38, Math.max(20, tileW * 1.5));
      const tileY = 118;
      const bandTop = tileY - 26;
      const bandBot = tileY + tileH + 26;

      const tx = function (i) { return padX + i * tileW; };

      // ---- header ------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText("longest substring without repeating characters", padX, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `12px ${env.font.mono}`;
      const winLen = s.right < 0 ? 0 : s.right - s.left + 1;
      ctx.fillText(`window [${s.left}, ${Math.max(s.left, s.right)}] length ${winLen}    best ${s.best} at [${s.bestL}, ${s.bestL + Math.max(0, s.best - 1)}]    left-edge jumps ${s.jumps}`, padX, 42);

      // ---- translucent window band -------------------------------------------
      if (s.right >= s.left && s.right >= 0) {
        ctx.globalAlpha = 0.16;
        ctx.fillStyle = C.viz1;
        ctx.fillRect(tx(s.left), bandTop, (s.right - s.left + 1) * tileW, bandBot - bandTop);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.viz1;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tx(s.left) + 0.5, bandTop + 0.5, (s.right - s.left + 1) * tileW - 1, bandBot - bandTop - 1);
      }

      // ---- character tiles ---------------------------------------------------
      for (let i = 0; i < n; i++) {
        const x = tx(i);
        const inWin = s.right >= 0 && i >= s.left && i <= s.right;
        const isDup = s.dupChar !== null && (i === s.dupPrev || (i === s.right && s.chars[i] === s.dupChar));

        let fill = C.surface2;
        if (isDup) fill = C.viz2;
        else if (inWin) fill = C.surface;

        ctx.globalAlpha = i < s.left ? 0.35 : 1;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x + 1, tileY, Math.max(2, tileW - 2), tileH, 3);
        ctx.fill();
        if (inWin && !isDup) {
          ctx.strokeStyle = C.viz1;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        ctx.textAlign = "center";
        ctx.fillStyle = isDup ? C.text : (inWin ? C.text : C.muted);
        ctx.font = `${Math.min(16, Math.max(9, Math.floor(tileW * 0.62)))}px ${env.font.mono}`;
        ctx.fillText(s.chars[i], x + tileW / 2, tileY + tileH * 0.68);

        if (tileW > 14) {
          ctx.fillStyle = C.muted;
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(String(i), x + tileW / 2, tileY + tileH + 13);
        }
      }

      // ---- best window marker -------------------------------------------------
      if (s.best > 0) {
        const bx = tx(s.bestL), bw = s.best * tileW;
        const by = tileY + tileH + 26;
        ctx.strokeStyle = C.viz6;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + 1, by);
        ctx.lineTo(bx + bw - 1, by);
        ctx.stroke();
        ctx.fillStyle = C.viz6;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(`best = ${s.best}`, bx + bw / 2, by + 15);
      }

      // ---- L / R pointers -----------------------------------------------------
      const ptr = function (i, name, color, up) {
        const x = tx(i) + tileW / 2;
        const y = up ? bandTop - 6 : bandBot + 6;
        ctx.fillStyle = color;
        ctx.beginPath();
        if (up) {
          ctx.moveTo(x, y + 9); ctx.lineTo(x - 5, y); ctx.lineTo(x + 5, y);
        } else {
          ctx.moveTo(x, y); ctx.lineTo(x - 5, y + 9); ctx.lineTo(x + 5, y + 9);
        }
        ctx.closePath();
        ctx.fill();
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(name, x, up ? y - 4 : y + 21);
      };
      if (s.right >= 0) {
        ptr(s.left, "left", C.viz1, true);
        ptr(Math.max(0, s.right), "right", C.viz1, true);
      }

      // ---- live window panel --------------------------------------------------
      const rows = s.panel || [];
      const panelH = 44 + rows.length * 22;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(panelX, 58, panelW, Math.max(66, panelH), 8);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = C.text2;
      ctx.font = `11px ${env.font.base}`;
      ctx.fillText("in window — char : last seen", panelX + 12, 78);
      ctx.strokeStyle = C.grid;
      ctx.beginPath();
      ctx.moveTo(panelX + 12, 86);
      ctx.lineTo(panelX + panelW - 12, 86);
      ctx.stroke();

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const y = 104 + r * 22;
        const dup = row.count > 1;
        ctx.fillStyle = dup ? C.viz2 : C.surface2;
        ctx.beginPath();
        ctx.roundRect(panelX + 12, y - 12, 18, 17, 3);
        ctx.fill();
        ctx.fillStyle = dup ? C.text : C.text2;
        ctx.font = `12px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(row.ch, panelX + 21, y + 1);

        ctx.textAlign = "left";
        ctx.fillStyle = dup ? C.viz2 : C.text2;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(`last @ ${row.last}${dup ? `   ×${row.count} duplicate` : ""}`, panelX + 38, y + 1);
      }
      if (rows.length === 0) {
        ctx.fillStyle = C.muted;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText("(empty)", panelX + 12, 104);
      }

      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.textAlign = "left";
      ctx.fillText(`panel size = distinct chars in window (max ${s.alphabet})`, panelX + 12, Math.max(66, panelH) + 74);

      // ---- legend --------------------------------------------------------------
      const ly = H - 24;
      const swatch = function (x, color, label, alpha) {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(x, ly - 9, 11, 11);
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.text2;
        ctx.font = `11px ${env.font.base}`;
        ctx.textAlign = "left";
        ctx.fillText(label, x + 16, ly);
        return x + 16 + ctx.measureText(label).width + 20;
      };
      let lx = padX;
      lx = swatch(lx, C.viz1, "current window [left, right]", 0.5);
      lx = swatch(lx, C.viz2, "duplicate pair that broke the invariant", 1);
      lx = swatch(lx, C.viz6, "best window so far", 1);
      lx = swatch(lx, C.surface2, "left of the window — discarded for good", 0.6);
    }
  },

  drill: {
    cards: [
      { q: "State the sliding-window skeleton in three steps.", a: "Expand the right edge by one; while the invariant is broken, advance the left edge and undo its bookkeeping; then record the answer for the now-valid window.", tags: ["pattern"] },
      { q: "Why is a sliding window O(n) despite the inner `while` loop?", a: "`left` never decreases and is bounded by `n`, so all inner iterations across the whole scan total at most `n`. Each index enters the window once and leaves at most once — ≤ 2n moves. It is an amortised bound, not a per-step one.", tags: ["complexity", "amortised"] },
      { q: "Why must the left-edge jump be `left = max(left, last_seen[c] + 1)`?", a: "`last_seen[c]` can point to an occurrence from before the window. Assigning directly would move `left` backwards — on `\"abba\"` it rewinds to 1 and re-admits a duplicate `b`. The clamp keeps the left edge monotone, which is also what preserves O(n).", tags: ["pitfall", "correctness"] },
      { q: "Variable vs fixed-size window — when do you use each?", a: "Variable when the constraint decides the size (\"longest/shortest such that …\"): grow right, shrink left until valid. Fixed when the size is given (\"best window of size k\"): the left edge trails exactly k behind and there is no inner loop.", tags: ["pattern"] },
      { q: "What is the precondition that makes a sum-based window valid?", a: "Non-negative values, so the window sum is monotone in the window's extent. With negative numbers, extending can shrink the sum and shrinking from the left is no longer justified — use prefix sums with a monotonic deque instead.", tags: ["precondition", "pitfall"] },
      { q: "How do you adapt the skeleton to 'at most K distinct characters'?", a: "Keep a count map plus an integer `distinct`; increment `distinct` when a count goes 0→1 and decrement on 1→0. Shrink while `distinct > K`. Tracking the integer keeps the validity check O(1) instead of O(K).", tags: ["variant"] },
      { q: "What bookkeeping makes minimum-window-substring O(n)?", a: "A `matched` counter that increments only when a character's window count exactly reaches its required count, so validity is an O(1) integer test rather than a map comparison every step.", tags: ["variant"] },
      { q: "What upper-bounds the answer for longest-substring-without-repeats?", a: "The alphabet size — a window of distinct characters cannot exceed the number of distinct symbols (26 for lowercase ASCII, 128 for full ASCII), regardless of `n`. That also bounds the map's space at O(min(n, Σ)).", tags: ["edge-case", "space"] }
    ],
    sixtySecond: [
      "Explain the sliding-window invariant for longest-substring-without-repeats and prove the whole scan is O(n).",
      "Explain why the left edge jumps to `max(left, last_seen[c] + 1)` and what breaks without the `max`.",
      "Describe when a sliding window is the wrong tool, using the negative-numbers sum case as the example."
    ]
  }
};
