// Lesson: Two Pointers  (track: dsa, order 02)
// Visualizer: container-with-most-water. Bars are wall heights; L and R converge
// from the ends. The current container is drawn as a water rectangle, the best
// container so far stays on screen as a ghosted rectangle, and every frame label
// spells out the exchange argument that justifies discarding the shorter wall.

export default {
  id: "two-pointers",
  track: "dsa",
  title: "Two Pointers",
  difficulty: 1,
  minutes: 12,
  tags: ["arrays", "two-pointers", "invariants", "greedy"],

  explainer: [
    { type: "p", text: "Two pointers is a technique for scanning an array using two moving index positions instead of one, so that you can solve certain problems in a single pass instead of comparing every possible pair. The whole point is to turn a slow `O(n²)` (quadratic — roughly n times n work) double loop, where you check every pair of elements against every other pair, into a fast `O(n)` (linear — roughly n work) single scan, by proving that most of those pairs could never have been the answer in the first place, so you never actually have to check them. You keep two index variables — think of them as two fingers resting on the array — and at every step you make an argument for why one of those fingers can safely move forward and never come back. If that argument holds, the technique works; if it doesn't, two pointers is the wrong tool. The whole technique really is that one small proof, repeated once per step of the scan." },

    { type: "h3", text: "The two shapes" },
    { type: "list", items: [
      "**Converging** — one pointer, `L` (left), starts at index 0, and the other, `R` (right), starts at the last index; they move toward each other, one step at a time, until they meet. This shape is used for container-with-most-water, two-sum on a sorted array, checking whether a string is a valid palindrome, the inner loop of 3-sum, and trapping rain water.",
      "**Same-direction (fast/slow)** — both pointers start at the left end of the array and only ever move rightward; the fast pointer reads ahead through the data, while the slow pointer marks where the next 'kept' element should be written, or otherwise lags behind. This shape is used for removing duplicates from a sorted array in place, removing a target value, partitioning an array around a pivot, detecting a cycle in a linked list, and it is also the shape behind sliding window (the next lesson is exactly this pattern with an extra constraint added)."
    ]},

    { type: "h3", text: "The invariant and the exchange argument" },
    { type: "p", text: "Before writing any loop, you should be able to state the invariant — the fact that stays true after every single step, and which is what actually makes the algorithm correct. For container-with-most-water — where each array value is the height of a vertical wall, and you're looking for the pair of walls that traps the most water between them — the invariant is: **the pair of walls that gives the biggest container is still somewhere inside the current range `[L, R]`**. The amount of water a pair of walls at `L` and `R` can hold is `(R - L) × min(h[L], h[R])` — the width between them, times whichever wall is shorter (because water spills over the shorter side). Now suppose `h[L]` (the height at L) is smaller than `h[R]`. Consider any other container that still uses wall `L` but pairs it with some wall strictly to the left of `R` instead. That container is *narrower* — it has less width — and its height is still capped at `h[L]`, because `L`'s height hasn't changed. A container that is both narrower and no taller can never hold more water than the one we already measured. So no pair that still includes `L` can ever beat what we just recorded, which means `L` can be safely discarded forever, without ever having to check those pairs individually. This is called an exchange argument: showing that swapping a candidate solution for the one you already considered can only ever make it worse, not better. Saying this reasoning out loud — 'the shorter wall is the limiting factor, and the width can only shrink from here, so it's dominated' — is exactly what an interviewer is listening for." },

    { type: "callout", tone: "tip", text: "State the discard proof *before* you write the loop. Candidates who move the shorter wall only because they remember it as a trick tend to get half the credit of candidates who can say out loud: \"width can only decrease from here, so the shorter wall is already the best it's ever going to be — it is dominated by what we've already measured, and can be dropped.\"" },

    { type: "code", lang: "python", code: "# Two-sum on a SORTED array — the same discard proof:\nL, R = 0, len(a) - 1\nwhile L < R:\n    s = a[L] + a[R]\n    if s == target:\n        answer = (L, R); break\n    if s < target:  L += 1   # a[L] is the smallest left; it can never reach target\n    else:           R -= 1   # a[R] is the largest left; it overshoots every pair" },

    { type: "h3", text: "Edge cases" },
    { type: "list", items: [
      "**Ties (`h[L] == h[R]`, both walls equally tall).** Moving either pointer is correct here: both walls are already as tall as they'll ever matter at this width, and any container you check next will only be narrower. Moving both pointers at once also happens to work in this specific problem, but that is *not* generally safe in other two-pointer problems — be ready to explain why it's safe here before you rely on it.",
      "**Why the loop terminates.** Every single iteration either moves `L` one step right or `R` one step left, so the gap between them shrinks every time, and the loop can run at most `n - 1` times before `L` and `R` meet. If you ever write a branch that could leave both pointers unchanged, you have created an infinite loop.",
      "**`while L < R` vs `while L <= R`.** When you need two *distinct* indices (as in finding a pair), use the strict `L < R`, which stops as soon as they'd otherwise coincide. For checking palindromes either version works; `L < R` just skips comparing the single middle character to itself, which is harmless since a character always equals itself.",
      "**Duplicate values in 3-sum (finding three numbers that sum to zero).** After fixing the first index `i`, skip over any repeated values at `i` so you don't re-run the same search twice; and after you record a matching triple, also skip past repeated values at both `L` and `R` before continuing — otherwise the same triple of numbers gets reported multiple times.",
      "**Empty input or an array with only one element.** In these cases the loop body never runs at all, so whatever answer you initialised before the loop (commonly `0`, or `-1` to mean 'not found') must already be the correct answer on its own."
    ]},

    { type: "callout", tone: "pitfall", text: "The trap: an interviewer asks a two-pointer-shaped question on an array that is *not sorted*. On an unsorted array, the converging argument falls apart completely — knowing that `a[L] + a[R]` is too small or too large tells you nothing reliable about any other pair, because there's no ordering to exploit. The correct move is either a hash map lookup (still O(n) time, using O(n) extra space), or sorting the array first and accepting the O(n log n) cost of sorting. Candidates who pattern-match 'two indices moving toward each other' onto any array, sorted or not, walk straight into this trap." },

    { type: "callout", tone: "warn", text: "Container-with-most-water is *not the same problem* as trapping-rain-water, even though both involve an array of wall heights. Trapping rain water asks how much water sits *above each individual column*, computed as `min(maxLeft, maxRight) - h[i]` summed across every column, which requires tracking the running maximum height seen so far from the left and from the right. Container-with-most-water only cares about the two walls you've currently chosen and completely ignores everything sitting between them." }
  ],

  glossary: [
    { term: "Two pointers", plain: "A technique that uses two moving index positions in an array, instead of one, to solve a problem in a single pass instead of checking every pair." },
    { term: "O(n²) / quadratic time", plain: "Work that grows with the square of the input size — checking every possible pair of elements is the classic example." },
    { term: "O(n) / linear time", plain: "Work that grows in direct proportion to the input size — one pass through the data." },
    { term: "Invariant", plain: "A fact or condition that stays true after every single step of an algorithm — it's the thing you rely on to prove the algorithm actually does what it claims to." },
    { term: "Exchange argument", plain: "A style of proof that shows swapping a candidate answer for one you've already ruled out can never make things better, only equal or worse — which justifies discarding it for good." },
    { term: "Converging pointers", plain: "Two index positions that start at opposite ends of an array and move toward each other until they meet." },
    { term: "Same-direction (fast/slow) pointers", plain: "Two index positions that both start at the left end and only ever move rightward, with one 'reading' ahead of the other." },
    { term: "3-sum", plain: "The classic problem of finding three numbers in an array that add up to zero (or some target), usually solved by fixing one number and two-pointering the rest." },
    { term: "Amortised", plain: "A cost measured by averaging it out over a whole sequence of operations, rather than looking at any single operation in isolation." }
  ],

  complexity: {
    rows: [
      { operation: "Converging scan", time: "O(n)", space: "O(1)", note: "each step retires one index" },
      { operation: "Two-sum on sorted input", time: "O(n)", space: "O(1)", note: "O(n log n) if you must sort first" },
      { operation: "Two-sum on unsorted input", time: "O(n)", space: "O(n)", note: "hash map — two pointers does not apply" },
      { operation: "3-sum", time: "O(n²)", space: "O(1)", note: "sort, then fix i and two-point the suffix" },
      { operation: "Brute-force all pairs", time: "O(n²)", space: "O(1)", note: "the baseline you are beating" }
    ]
  },

  interview: {
    whyAsked: "It separates candidates who recite a trick from candidates who can prove a discard is safe. The signal is the exchange argument — can you state, in one sentence, why the pointer you are about to move cannot appear in any better solution — plus whether you notice that the technique needs sortedness or monotonicity to exist at all.",
    followUps: [
      { q: "Prove that moving the shorter wall never loses the optimal container.", a: "Let h[L] < h[R] and consider any container that uses L together with some wall at index j < R. Its width R-L shrinks to j-L and its height is at most min(h[L], h[j]) ≤ h[L], so its area is strictly less than (R-L)×h[L], which is exactly the area we just recorded. So no unexamined pair containing L can beat the current best, and L is safe to discard permanently. The same argument mirrored applies when h[R] is the shorter wall." },
      { q: "What if the array is not sorted for two-sum?", a: "Two pointers stops working, because a[L] + a[R] being too small tells you nothing about pairs elsewhere — the ordering is what makes the sum monotone in the pointer moves. Use a hash map for O(n) time and O(n) space, storing target - x as you scan. Sorting first restores two pointers but costs O(n log n) and destroys original indices, so keep (value, index) pairs if the answer needs indices." },
      { q: "How does 3-sum use two pointers, and how do you avoid duplicate triples?", a: "Sort, fix index i, then run a converging two-pointer over the suffix looking for -a[i]; that is O(n) per i, so O(n²) overall — better than the O(n³) triple loop. For duplicates, skip i when a[i] == a[i-1], and after recording a hit advance L past equal values and pull R back past equal values. Using a set of triples also works but costs extra space and hashing time." },
      { q: "When h[L] == h[R], can you move both pointers at once?", a: "For this problem, yes: both walls are already maximised at the current maximum width, and every remaining container is strictly narrower, so neither wall can be part of a better answer. It is a genuine micro-optimisation, not a correctness requirement. But it is problem-specific — in two-sum on a sorted array moving both pointers on a match can skip valid pairs unless you are only counting distinct values." },
      { q: "How is the sliding window related to two pointers?", a: "A sliding window is the same-direction two-pointer shape with an invariant on the interval between the pointers: the right pointer expands the window, the left pointer advances only far enough to restore the invariant. It stays O(n) because each index enters and leaves the window at most once — the amortisation argument, not a per-step bound. Converging pointers retire indices from the outside in; windows retire them from the left only." },
      { q: "How would you handle trapping rain water with pointers?", a: "Converging pointers with running maxima: keep leftMax and rightMax, and always move the side whose running max is smaller, because that side's max is the binding constraint for the water above that column. Add max(0, leftMax - h[L]) or max(0, rightMax - h[R]) as you go. It is O(n) time and O(1) space, replacing the two prefix/suffix max arrays of the O(n)-space solution." }
    ]
  },

  code: [
    { lang: "python", label: "Container with most water", code: "def max_area(height):\n    L, R = 0, len(height) - 1\n    best = 0\n    # Invariant: the optimal container still lies within [L, R].\n    while L < R:\n        h = min(height[L], height[R])      # the SHORTER wall caps the water\n        best = max(best, h * (R - L))      # width is R - L, and it only shrinks\n        # Discard the shorter wall: every remaining container using it is\n        # narrower AND still capped by it, so it can never beat what we just saw.\n        if height[L] < height[R]:\n            L += 1\n        else:\n            R -= 1                          # ties: moving either is safe\n    return best" },
    { lang: "python", label: "Sorted two-sum & 3-sum", code: "def two_sum_sorted(a, target):\n    L, R = 0, len(a) - 1\n    while L < R:\n        s = a[L] + a[R]\n        if s == target:\n            return (L, R)\n        if s < target:\n            L += 1        # a[L] is the smallest left; it cannot reach target\n        else:\n            R -= 1        # a[R] is the largest left; it overshoots every pair\n    return None\n\ndef three_sum(nums):\n    nums.sort()\n    out = []\n    for i in range(len(nums) - 2):\n        if i and nums[i] == nums[i - 1]:\n            continue                       # skip duplicate anchors\n        if nums[i] > 0:\n            break                          # sorted: no way back to zero\n        L, R = i + 1, len(nums) - 1\n        while L < R:\n            s = nums[i] + nums[L] + nums[R]\n            if s < 0:   L += 1\n            elif s > 0: R -= 1\n            else:\n                out.append([nums[i], nums[L], nums[R]])\n                L += 1\n                while L < R and nums[L] == nums[L - 1]:\n                    L += 1                 # skip duplicate seconds\n                R -= 1\n    return out" },
    { lang: "python", label: "Same-direction: in-place dedupe", code: "def dedupe_sorted(a):\n    \"\"\"Fast pointer reads, slow pointer writes. Returns the new length.\"\"\"\n    if not a:\n        return 0\n    slow = 0                       # invariant: a[:slow+1] is deduped\n    for fast in range(1, len(a)):\n        if a[fast] != a[slow]:\n            slow += 1\n            a[slow] = a[fast]      # at most one write per element -> O(n)\n    return slow + 1\n\n# Same shape, different predicate: move-zeroes, remove-element,\n# partition-around-pivot (Lomuto), and the compaction step of Dutch-flag." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 150 },

    params: [
      { key: "n",    label: "Walls", type: "int", min: 8, max: 28, default: 18 },
      { key: "seed", label: "Reshuffle", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(4, Math.min(28, params.n | 0));

      const h = [];
      for (let i = 0; i < n; i++) h.push(1 + Math.floor(rng() * 12));

      // Brute-force optimum, used only for the closing label (n <= 28).
      let brute = 0;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = (j - i) * Math.min(h[i], h[j]);
          if (a > brute) brute = a;
        }
      }

      let L = 0, R = n - 1;
      let best = 0, bestL = 0, bestR = n - 1, checked = 0;

      const snap = function (area, note) {
        return {
          h: h.slice(), L: L, R: R, area: area,
          best: best, bestL: bestL, bestR: bestR,
          checked: checked, n: n, note: note
        };
      };

      yield {
        label: `Area = (R \u2212 L) \u00d7 min(h[L], h[R]). Start at the widest possible container and shrink: the invariant is that the optimal pair always stays inside [L, R].`,
        phase: "init",
        state: snap(0, "start")
      };

      while (L < R) {
        const hl = h[L], hr = h[R];
        const width = R - L;
        const cap = Math.min(hl, hr);
        const area = width * cap;
        checked++;

        yield {
          label: `L=${L} (height ${hl}), R=${R} (height ${hr}): width ${width} \u00d7 min(${hl}, ${hr}) = ${cap} \u2192 area ${area}. The water level is set by the shorter wall, not the taller one.`,
          phase: "measure",
          focus: [L, R],
          state: snap(area, "measure")
        };

        if (area > best) {
          const prev = best;
          best = area; bestL = L; bestR = R;
          yield {
            label: `${area} beats the previous best of ${prev} \u2014 record [${L}, ${R}] as the best container so far (the ghosted rectangle).`,
            phase: "record",
            focus: [L, R],
            state: snap(area, "record")
          };
        } else {
          yield {
            label: `${area} does not beat the best of ${best} at [${bestL}, ${bestR}], so nothing is recorded \u2014 this container is ${width < bestR - bestL ? "narrower" : "no wider"} and capped at ${cap}.`,
            phase: "reject",
            focus: [L, R],
            state: snap(area, "reject")
          };
        }

        if (hl < hr) {
          yield {
            label: `height[L]=${hl} < height[R]=${hr}, so moving R can never help \u2014 any narrower container is still capped by ${hl}. Move L to ${L + 1}.`,
            phase: "discard-left",
            focus: [L],
            state: snap(area, "discard-left")
          };
          L++;
        } else if (hr < hl) {
          yield {
            label: `height[R]=${hr} < height[L]=${hl}, so moving L can never help \u2014 any narrower container is still capped by ${hr}. Move R to ${R - 1}.`,
            phase: "discard-right",
            focus: [R],
            state: snap(area, "discard-right")
          };
          R--;
        } else {
          yield {
            label: `height[L]=height[R]=${hl}: both walls are already maximised at this width, and every container left is narrower, so neither can be in a better answer. Move L (moving either is safe).`,
            phase: "discard-tie",
            focus: [L, R],
            state: snap(area, "discard-tie")
          };
          L++;
        }
      }

      yield {
        label: `L met R after ${checked} comparisons \u2014 O(n) instead of the ${(n * (n - 1)) / 2} pairs a double loop would test. Best container = [${bestL}, ${bestR}], area ${best}${best === brute ? ", exactly the brute-force optimum" : ""}.`,
        phase: "done",
        focus: [bestL, bestR],
        state: snap(0, "done")
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      const n = s.h.length;

      ctx.clearRect(0, 0, W, H);

      const padX = 28, padTop = 62, padBottom = 84;
      const slotW = (W - padX * 2) / n;
      const barW = Math.max(3, slotW * 0.52);
      const baseY = H - padBottom;
      const plotH = baseY - padTop;
      let maxH = 1;
      for (let i = 0; i < n; i++) if (s.h[i] > maxH) maxH = s.h[i];

      const cx = function (i) { return padX + i * slotW + slotW / 2; };
      const yOf = function (v) { return baseY - (v / maxH) * plotH; };

      // ---- ghosted best-so-far container ------------------------------------
      if (s.best > 0) {
        const gx0 = cx(s.bestL), gx1 = cx(s.bestR);
        const gh = Math.min(s.h[s.bestL], s.h[s.bestR]);
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = C.viz6;
        ctx.fillRect(gx0, yOf(gh), gx1 - gx0, baseY - yOf(gh));
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = C.viz6;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.strokeRect(gx0, yOf(gh), gx1 - gx0, baseY - yOf(gh));
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.viz6;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(`best ${s.best}`, (gx0 + gx1) / 2, yOf(gh) - 6);
      }

      // ---- current container -------------------------------------------------
      if (s.L < s.R && s.area > 0) {
        const wx0 = cx(s.L), wx1 = cx(s.R);
        const wh = Math.min(s.h[s.L], s.h[s.R]);
        ctx.globalAlpha = 0.26;
        ctx.fillStyle = C.viz1;
        ctx.fillRect(wx0, yOf(wh), wx1 - wx0, baseY - yOf(wh));
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.viz1;
        ctx.lineWidth = 2;
        ctx.strokeRect(wx0, yOf(wh), wx1 - wx0, baseY - yOf(wh));
        ctx.fillStyle = C.viz1;
        ctx.font = `12px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(`${s.R - s.L} \u00d7 ${wh} = ${s.area}`, (wx0 + wx1) / 2, yOf(wh) + (baseY - yOf(wh)) / 2 + 4);
      }

      // ---- walls -------------------------------------------------------------
      for (let i = 0; i < n; i++) {
        const x = cx(i) - barW / 2;
        const top = yOf(s.h[i]);
        const live = i >= s.L && i <= s.R;

        // Recessive-but-present fill for ordinary bars: surface2 alone is
        // nearly indistinguishable from the near-black canvas background, so
        // use muted (a mid grey that reads on both dark and light bg) and
        // lean on alpha to separate "still in play" from "discarded".
        let fill = C.muted;
        let alpha = live ? 0.85 : 0.35;
        if (i === s.L) { fill = C.viz1; alpha = 1; }
        else if (i === s.R) { fill = C.viz5; alpha = 1; }

        ctx.globalAlpha = alpha;
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, top, barW, baseY - top, 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (slotW > 15) {
          ctx.fillStyle = live ? C.text2 : C.muted;
          ctx.font = `10px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(String(s.h[i]), cx(i), top - 5);
        }
      }

      // baseline
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padX - 6, baseY + 0.5);
      ctx.lineTo(W - padX + 6, baseY + 0.5);
      ctx.stroke();

      // ---- pointers ----------------------------------------------------------
      const marker = function (i, color, name) {
        const x = cx(i);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, baseY + 6);
        ctx.lineTo(x - 6, baseY + 17);
        ctx.lineTo(x + 6, baseY + 17);
        ctx.closePath();
        ctx.fill();
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(name, x, baseY + 30);
      };
      marker(s.L, C.viz1, "L");
      marker(s.R, C.viz5, "R");

      // ---- header ------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`area = (R \u2212 L) \u00d7 min(h[L], h[R])`, 16, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `12px ${env.font.mono}`;
      ctx.fillText(`current ${s.area}    best ${s.best} at [${s.bestL}, ${s.bestR}]    comparisons ${s.checked} / ${(s.n * (s.n - 1)) / 2} pairs`, 16, 42);

      // ---- legend ------------------------------------------------------------
      const ly = H - 26;
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
      let lx = 16;
      lx = swatch(lx, C.viz1, "L wall + current container", 1);
      lx = swatch(lx, C.viz5, "R wall", 1);
      lx = swatch(lx, C.viz6, "best container so far (ghost)", 0.45);
      lx = swatch(lx, C.muted, "discarded \u2014 provably cannot win", 0.35);
    }
  },

  drill: {
    cards: [
      { q: "State the exchange argument for container-with-most-water.", a: "If `h[L] < h[R]`, every unexamined container using `L` is narrower *and* still capped by `h[L]`, so its area is strictly less than the `(R-L)×h[L]` just measured. `L` therefore cannot be in a better answer and is discarded permanently.", tags: ["proof", "invariant"] },
      { q: "What is the loop invariant of a converging two-pointer scan?", a: "The optimal pair still lies within `[L, R]`. Every step must preserve it while strictly shrinking `R - L`, which is also the termination argument (at most `n-1` iterations).", tags: ["invariant"] },
      { q: "Why does two-pointer two-sum require a sorted array?", a: "Sortedness makes the sum monotone in the pointer moves: `L++` can only increase the sum, `R--` can only decrease it. Unsorted, a too-small sum says nothing about other pairs — use a hash map for O(n) instead.", tags: ["precondition", "pitfall"] },
      { q: "How do you avoid duplicate triples in 3-sum?", a: "Skip the anchor when `nums[i] == nums[i-1]`, and after recording a hit advance `L` past equal values and pull `R` back past equal values. Requires the array to be sorted first.", tags: ["duplicates", "3-sum"] },
      { q: "Container-with-most-water vs trapping-rain-water — what changes?", a: "The container uses only the two chosen walls: `(R-L) × min(h[L], h[R])`, ignoring everything between. Rain water sums per column `min(maxLeft, maxRight) - h[i]`, so it needs running maxima and always moves the side with the smaller running max.", tags: ["contrast"] },
      { q: "When `h[L] == h[R]`, which pointer do you move?", a: "Either — both walls are maximised at the current widest span and every remaining container is narrower, so neither can be part of a better answer. Moving both is a valid micro-optimisation *for this problem only*.", tags: ["edge-case"] },
      { q: "What is the fast/slow (same-direction) pointer pattern for?", a: "In-place rewriting in O(n) time and O(1) space: fast reads every element, slow marks the boundary of the finished prefix. Used by dedupe, remove-element, move-zeroes and Lomuto partition.", tags: ["pattern"] },
      { q: "Why is a two-pointer scan O(n) even though there is a loop with two moving indices?", a: "Each iteration retires one index for good, so the total number of iterations is bounded by `n`, not `n²`. That accounting argument — every index is consumed at most once — is the same one that makes sliding windows linear.", tags: ["complexity"] }
    ],
    sixtySecond: [
      "Explain the exchange argument that makes container-with-most-water O(n), and why moving the taller wall would be wrong.",
      "Compare converging and same-direction two pointers: what invariant does each maintain, and give one problem for each.",
      "Explain why two-pointer two-sum needs a sorted array and what you would do instead if it is unsorted."
    ]
  }
};
