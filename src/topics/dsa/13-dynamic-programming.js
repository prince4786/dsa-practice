// 13-dynamic-programming.js — bottom-up DP shown on the edit-distance table.
// Exactly one statement: `export default { ... }`. No imports, no top-level consts.
// `frames` is a pure generator; `draw` is a pure single-frame renderer that reads
// every colour from `env.colors`.

export default {
  id: "dynamic-programming",
  track: "dsa",
  title: "DP Table Filling",
  difficulty: 2,
  minutes: 20,
  tags: ["dynamic-programming", "strings", "tabulation", "traceback"],

  explainer: [
    { type: "p", text: "Dynamic programming is not a trick, it is a bookkeeping strategy: find a recurrence whose subproblems repeat, then evaluate each subproblem exactly once. Edit distance is the cleanest place to see it, because the recurrence, the table, and the traceback are all visible at the same time." },

    { type: "h3", text: "How you recognise a DP problem" },
    { type: "list", items: [
      "**Optimal substructure** — the best answer for the whole is built from best answers to smaller instances of the *same* problem.",
      "**Overlapping subproblems** — the naive recursion re-solves the same state many times. If the recursion tree has no repeats, it is divide-and-conquer, not DP.",
      "You can name the state in a sentence: *'the edit distance between the first i characters of a and the first j characters of b'*. If you cannot say that sentence, you do not have a DP formulation yet — you have a guess."
    ]},
    { type: "callout", tone: "tip", text: "Interview order that never fails: (1) define the state in English, (2) write the recurrence, (3) write the base cases, (4) name the evaluation order, (5) only then decide memo vs table, and finally space-optimise. Skipping straight to code is where candidates lose the thread." },

    { type: "h3", text: "The edit-distance recurrence" },
    { type: "p", text: "State: `dp[i][j]` = minimum edits turning `a[:i]` into `b[:j]`. Base cases are forced — turning a prefix into the empty string costs one deletion per character, so `dp[i][0] = i`, and symmetrically `dp[0][j] = j`." },
    { type: "code", lang: "python", code: "if a[i-1] == b[j-1]:\n    dp[i][j] = dp[i-1][j-1]              # free: characters already agree\nelse:\n    dp[i][j] = 1 + min(dp[i-1][j],       # up   -> delete a[i-1]\n                       dp[i][j-1],       # left -> insert b[j-1]\n                       dp[i-1][j-1])     # diag -> substitute" },
    { type: "p", text: "Every cell reads exactly three neighbours — above, left, and diagonally up-left. That dependency shape *is* the evaluation order: fill row by row, left to right, and every value you need is already there." },

    { type: "h3", text: "Space optimisation falls out of the dependency shape" },
    { type: "p", text: "Because row `i` only ever touches row `i-1` and the cell immediately to its left, you never need the full table to compute the *number*. Keep two rows — or one row plus a scalar holding the old diagonal — and you drop from `O(mn)` to `O(min(m, n))` space by iterating over the shorter word in the inner dimension." },
    { type: "callout", tone: "warn", text: "The space optimisation destroys the traceback. Reconstructing the actual edit script needs the whole table (or Hirschberg's divide-and-conquer, which recovers the alignment in O(min(m,n)) space at the cost of 2x time). Always ask whether the interviewer wants the value or the script before you throw the table away." },

    { type: "h3", text: "The trap: greedy looks like it works" },
    { type: "p", text: "Candidates often propose walking both strings and greedily substituting on mismatch. That is exactly optimal for Hamming distance on equal-length strings and exactly wrong here: a single insertion early on can re-align the rest of the string and save many edits, and greedy has no way to look far enough ahead to see that. `abcdef` -> `zabcde` costs 1 insert; greedy substitution charges 6." },
    { type: "callout", tone: "pitfall", text: "The other trap is off-by-one indexing. The table is `(m+1) x (n+1)` and `dp[i][j]` compares `a[i-1]` with `b[j-1]`. Mixing the table index with the string index is the single most common bug in this problem — say the offset out loud when you write the loop." }
  ],

  complexity: {
    rows: [
      { operation: "Naive recursion", time: "O(3^(m+n))", space: "O(m+n)", note: "three branches per mismatch, massive re-computation" },
      { operation: "Memoised recursion", time: "O(mn)", space: "O(mn) + O(m+n) stack", note: "same states, top-down" },
      { operation: "Bottom-up table", time: "O(mn)", space: "O(mn)", note: "no recursion; supports traceback" },
      { operation: "Rolling array", time: "O(mn)", space: "O(min(m,n))", note: "two rows; loses the traceback" },
      { operation: "Traceback", time: "O(m+n)", space: "O(m+n)", note: "walk from dp[m][n] to dp[0][0]" },
      { operation: "Hirschberg alignment", time: "O(mn)", space: "O(min(m,n))", note: "keeps the edit script; ~2x time" }
    ]
  },

  interview: {
    whyAsked: "It separates candidates who memorised DP problems from candidates who can derive one. The signal is whether you can state the subproblem in English before writing code, justify the three transitions, explain the evaluation order from the dependency shape, and then reason about space and traceback as separate concerns rather than reciting a template.",
    followUps: [
      { q: "How do you decide a problem is DP in the first place?", a: "Write the brute-force recursion and look at its tree. If the same arguments recur — overlapping subproblems — and the optimal answer composes from optimal answers of those subproblems, it is DP. If the subcalls are disjoint, like merge sort, it is divide-and-conquer and memoisation buys nothing. A good tell is a small tuple of integers or indices that fully describes a state." },
      { q: "Memoisation or tabulation — which do you write?", a: "They compute the same values; the difference is control flow. Memoisation is easier to derive because you transcribe the recurrence directly and only visit reachable states, but it costs recursion stack and can blow Python's limit at a few thousand deep. Tabulation avoids the stack, has better constants and cache behaviour, and lets you space-optimise and traceback — but you must work out the evaluation order yourself. In an interview I derive it top-down and then convert if space or depth matters." },
      { q: "Reduce the space to O(min(m, n)).", a: "A cell depends only on the row above and the cell to its left, so keep a previous row and a current row and swap them, or keep one row plus a scalar carrying the old diagonal before you overwrite it. Loop so that the *inner* dimension is the shorter word, giving O(min(m,n)). The cost is the traceback: with the table gone you can report the distance but not the edit script, unless you use Hirschberg." },
      { q: "How does LCS relate to edit distance?", a: "They are the same table shape with a different recurrence: LCS takes `dp[i-1][j-1] + 1` on a match and `max(dp[i-1][j], dp[i][j-1])` otherwise — there is no diagonal move on a mismatch, because substitution is not an allowed operation. If you only allow insert and delete, edit distance equals `m + n - 2·LCS`. Adding substitution breaks that identity, which is why the two problems are close cousins rather than the same problem." },
      { q: "Why doesn't a greedy left-to-right pass work?", a: "Greedy commits to an operation before it knows whether a shifted alignment pays off later. Turning `abcdef` into `zabcde` costs one insertion, but a greedy substitute-on-mismatch scan pays six. DP works precisely because it keeps every alignment prefix alive in the table and only commits at the very end, during the traceback." },
      { q: "The strings are a million characters long. Now what?", a: "O(mn) is 10^12 cells, so exact full-table DP is out. If you only need to know whether the distance is at most k, use the banded Ukkonen variant that fills only the diagonal band of width 2k+1, giving O(k·min(m,n)). If you need an alignment, use Hirschberg for linear space, or drop to approximate methods — q-gram or MinHash prefilters — to discard obviously distant pairs before running exact DP on survivors." }
    ]
  },

  code: [
    { lang: "python", label: "Bottom-up table + traceback", code: "def edit_distance(a, b):\n    m, n = len(a), len(b)\n    # dp[i][j] = min edits turning a[:i] into b[:j]\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n\n    # Base cases are forced: prefix -> empty string costs one delete per char.\n    for i in range(m + 1):\n        dp[i][0] = i\n    for j in range(n + 1):\n        dp[0][j] = j\n\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1]          # characters agree: free\n            else:\n                dp[i][j] = 1 + min(\n                    dp[i - 1][j],                    # up   -> delete a[i-1]\n                    dp[i][j - 1],                    # left -> insert b[j-1]\n                    dp[i - 1][j - 1],                # diag -> substitute\n                )\n    return dp\n\n\ndef edit_script(a, b):\n    \"\"\"Walk backwards from dp[m][n]; each step names the operation taken.\"\"\"\n    dp = edit_distance(a, b)\n    i, j, ops = len(a), len(b), []\n    while i > 0 or j > 0:\n        if i > 0 and j > 0 and a[i - 1] == b[j - 1] and dp[i][j] == dp[i - 1][j - 1]:\n            i, j = i - 1, j - 1                      # match: no edit emitted\n        elif i > 0 and j > 0 and dp[i][j] == dp[i - 1][j - 1] + 1:\n            ops.append(f\"substitute {a[i-1]!r} -> {b[j-1]!r} at {i-1}\")\n            i, j = i - 1, j - 1\n        elif i > 0 and dp[i][j] == dp[i - 1][j] + 1:\n            ops.append(f\"delete {a[i-1]!r} at {i-1}\")\n            i -= 1\n        else:\n            ops.append(f\"insert {b[j-1]!r} at {i}\")\n            j -= 1\n    ops.reverse()                                    # we walked end -> start\n    return dp[len(a)][len(b)], ops" },

    { lang: "python", label: "Rolling array — O(min(m, n)) space", code: "def edit_distance_cheap(a, b):\n    \"\"\"Only the value, not the script: a cell needs the row above and the\n    cell to its left, so two rows suffice. Iterate the SHORTER word inside\n    to make the space bound O(min(m, n)).\"\"\"\n    if len(a) < len(b):\n        a, b = b, a                       # b is now the shorter one\n    m, n = len(a), len(b)\n\n    prev = list(range(n + 1))             # row i-1, starts as dp[0][*]\n    for i in range(1, m + 1):\n        cur = [i] + [0] * n               # dp[i][0] = i\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                cur[j] = prev[j - 1]\n            else:\n                cur[j] = 1 + min(prev[j],      # delete\n                                 cur[j - 1],   # insert\n                                 prev[j - 1])  # substitute\n        prev = cur                        # roll\n    return prev[n]" },

    { lang: "python", label: "Same table, LCS recurrence", code: "def lcs_length(a, b):\n    \"\"\"Identical shape, different transition: NO diagonal move on a mismatch,\n    because substitution is not an allowed operation here.\"\"\"\n    m, n = len(a), len(b)\n    dp = [[0] * (n + 1) for _ in range(m + 1)]\n    for i in range(1, m + 1):\n        for j in range(1, n + 1):\n            if a[i - 1] == b[j - 1]:\n                dp[i][j] = dp[i - 1][j - 1] + 1\n            else:\n                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\n    return dp[m][n]\n\n# With insert+delete only (no substitute):\n#     edit_distance(a, b) == len(a) + len(b) - 2 * lcs_length(a, b)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 240 },

    params: [
      { key: "pair", label: "Words", type: "enum",
        options: ["kitten / sitting", "sunday / saturday", "flaw / lawn", "horse / ros", "intention / execution"],
        default: "kitten / sitting" },
      { key: "pace", label: "Granularity", type: "enum", options: ["cell-by-cell", "row-by-row"], default: "cell-by-cell" }
    ],

    frames: function* (params, rng) {
      const P = params || {};
      const raw = typeof P.pair === "string" && P.pair.indexOf("/") > 0 ? P.pair : "kitten / sitting";
      const halves = raw.split("/");
      const a = halves[0].trim().slice(0, 12) || "kitten";
      const b = (halves[1] || "sitting").trim().slice(0, 12) || "sitting";
      const byRow = P.pace === "row-by-row";
      const m = a.length, n = b.length;

      const MAXF = 232;         // layout.maxFrames is 240
      let fc = 0;

      // ---- the table -------------------------------------------------------
      const dp = [];
      for (let i = 0; i <= m; i++) dp.push(new Array(n + 1).fill(null));

      const snap = function (extra) {
        const base = {
          a: a, b: b, m: m, n: n, pace: byRow ? "row-by-row" : "cell-by-cell",
          table: dp.map(function (row) { return row.slice(); }),
          cur: null, cand: null, rowDone: null,
          path: [], ops: [], best: null
        };
        for (const k in extra) base[k] = extra[k];
        return base;
      };

      fc++;
      yield {
        label: "State: dp[i][j] is the cheapest way to turn the first i letters of \"" + a + "\" into the first j letters of \"" + b + "\". The answer is the bottom-right cell.",
        phase: "setup",
        state: snap({})
      };

      // ---- base cases -------------------------------------------------------
      for (let j = 0; j <= n; j++) dp[0][j] = j;
      fc++;
      yield {
        label: "Base row: turning the empty string into \"" + b + "\" needs one insertion per character, so dp[0][j] = j. No choice is involved — the base cases are forced.",
        phase: "base",
        state: snap({ rowDone: 0 })
      };

      for (let i = 0; i <= m; i++) dp[i][0] = i;
      fc++;
      yield {
        label: "Base column: turning \"" + a + "\" into the empty string needs one deletion per character, so dp[i][0] = i. Everything else now reads only from cells that already exist.",
        phase: "base",
        state: snap({})
      };

      // ---- fill --------------------------------------------------------------
      const dirName = { up: "delete", left: "insert", diag: "substitute" };
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const up = dp[i - 1][j];        // delete a[i-1]
          const left = dp[i][j - 1];      // insert b[j-1]
          const diag = dp[i - 1][j - 1];  // match or substitute
          const match = a[i - 1] === b[j - 1];

          let chosen, val;
          if (match) {
            chosen = "diag";
            val = diag;
          } else {
            const best = Math.min(up, left, diag);
            chosen = diag === best ? "diag" : (up === best ? "up" : "left");
            val = best + 1;
          }
          dp[i][j] = val;

          if (!byRow) {
            if (fc > MAXF - 4) {
              fc++;
              yield { label: "Frame budget reached — switch granularity to row-by-row for the longer word pairs.", phase: "truncated", state: snap({}) };
              return;
            }
            const label = match
              ? "a[" + (i - 1) + "] = '" + a[i - 1] + "' equals b[" + (j - 1) + "] = '" + b[j - 1] + "', so the last characters already agree: take the diagonal unchanged, dp[" + i + "][" + j + "] = " + diag + ". A free move is always at least as good as paying 1."
              : "'" + a[i - 1] + "' vs '" + b[j - 1] + "' differ. Pay 1 on top of the cheapest of up = " + up + " (delete '" + a[i - 1] + "'), left = " + left + " (insert '" + b[j - 1] + "'), diag = " + diag + " (substitute) -> dp[" + i + "][" + j + "] = " + val + " via " + dirName[chosen] + ".";
            fc++;
            yield {
              label: label,
              phase: "fill",
              focus: [i * (n + 1) + j],
              state: snap({
                cur: [i, j],
                cand: { up: up, left: left, diag: diag, chosen: chosen, match: match, val: val }
              })
            };
          }
        }

        if (byRow) {
          if (fc > MAXF - 4) {
            fc++;
            yield { label: "Frame budget reached — pick a shorter word pair to watch the whole fill.", phase: "truncated", state: snap({}) };
            return;
          }
          const j = n;
          const up = dp[i - 1][j], left = dp[i][j - 1], diag = dp[i - 1][j - 1];
          const match = a[i - 1] === b[j - 1];
          fc++;
          yield {
            label: "Row " + i + " (matching '" + a[i - 1] + "') is complete. Every cell in it read only row " + (i - 1) + " and its own left neighbour — that dependency shape is exactly why two rows of memory are enough, giving O(min(m,n)) space.",
            phase: "fill-row",
            focus: [i],
            state: snap({
              rowDone: i,
              cur: [i, j],
              cand: { up: up, left: left, diag: diag, chosen: match ? "diag" : "up", match: match, val: dp[i][j] }
            })
          };
        }
      }

      const answer = dp[m][n];
      fc++;
      yield {
        label: "Table complete: dp[" + m + "][" + n + "] = " + answer + " edits turn \"" + a + "\" into \"" + b + "\". The number is done — but the table still holds every optimal alignment, and only the traceback commits to one.",
        phase: "filled",
        focus: [m * (n + 1) + n],
        state: snap({ best: answer })
      };

      // ---- traceback ---------------------------------------------------------
      let ti = m, tj = n;
      const path = [[m, n]];
      const ops = [];
      let guard = 0;

      fc++;
      yield {
        label: "Traceback: start at the bottom-right and, at every cell, ask which of the three sources actually produced this value. That reverses the decisions the fill made.",
        phase: "trace",
        state: snap({ best: answer, path: path.map(function (p) { return p.slice(); }), ops: ops.slice() })
      };

      while ((ti > 0 || tj > 0) && guard <= m + n + 2) {
        guard++;
        if (fc > MAXF - 3) break;

        let op, note;
        if (ti > 0 && tj > 0 && a[ti - 1] === b[tj - 1] && dp[ti][tj] === dp[ti - 1][tj - 1]) {
          op = null;
          note = "'" + a[ti - 1] + "' matched '" + b[tj - 1] + "' — the value came in unchanged from the diagonal, so no edit is emitted. Move diagonally.";
          ti--; tj--;
        } else if (ti > 0 && tj > 0 && dp[ti][tj] === dp[ti - 1][tj - 1] + 1) {
          op = "substitute '" + a[ti - 1] + "' -> '" + b[tj - 1] + "' at index " + (ti - 1);
          note = "dp[" + ti + "][" + tj + "] = " + dp[ti][tj] + " = diag + 1, so this cell paid for a substitution: " + op + ".";
          ti--; tj--;
        } else if (ti > 0 && dp[ti][tj] === dp[ti - 1][tj] + 1) {
          op = "delete '" + a[ti - 1] + "' at index " + (ti - 1);
          note = "dp[" + ti + "][" + tj + "] = " + dp[ti][tj] + " = up + 1, and up means we consumed a character of \"" + a + "\" without one in \"" + b + "\": " + op + ".";
          ti--;
        } else {
          op = "insert '" + b[tj - 1] + "' at index " + ti;
          note = "dp[" + ti + "][" + tj + "] = " + dp[ti][tj] + " = left + 1, and left means a character of \"" + b + "\" had no partner: " + op + ".";
          tj--;
        }
        if (op) ops.unshift(op);
        path.unshift([ti, tj]);

        fc++;
        yield {
          label: note,
          phase: "trace",
          focus: [ti * (n + 1) + tj],
          state: snap({
            best: answer,
            path: path.map(function (p) { return p.slice(); }),
            ops: ops.slice(),
            cur: [ti, tj]
          })
        };
      }

      fc++;
      yield {
        label: "Done: " + ops.length + " edit" + (ops.length === 1 ? "" : "s") + " — " + (ops.length ? ops.join("; ") : "the strings were already equal") + ". The path is the alignment; the diagonal steps with no edit are the characters both words share.",
        phase: "done",
        state: snap({
          best: answer,
          path: path.map(function (p) { return p.slice(); }),
          ops: ops.slice()
        })
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors;
      const W = env.width, H = env.height;
      const s = frame.state;
      const m = s.m, n = s.n;

      ctx.clearRect(0, 0, W, H);

      const padX = 14, headH = 52, footH = 12;
      const panelW = Math.max(140, Math.min(230, W * 0.28));
      const tableW = W - padX * 2 - panelW - 12;
      const tableH = H - headH - footH;
      const cell = Math.min(tableW / (n + 2), tableH / (m + 2));
      const tx = padX + (tableW - cell * (n + 2)) / 2;
      const ty = headH + (tableH - cell * (m + 2)) / 2;

      // table coordinates: data cell (i, j) sits at column j+1, row i+1
      const cx = function (j) { return tx + (j + 1) * cell + cell / 2; };
      const cy = function (i) { return ty + (i + 1) * cell + cell / 2; };

      const onPath = [];
      for (let i = 0; i <= m; i++) onPath.push(new Array(n + 1).fill(false));
      for (let k = 0; k < s.path.length; k++) onPath[s.path[k][0]][s.path[k][1]] = true;

      const cur = s.cur;
      const cand = s.cand;
      const srcOf = function (i, j) {
        if (!cur || !cand) return null;
        if (i === cur[0] - 1 && j === cur[1]) return "up";
        if (i === cur[0] && j === cur[1] - 1) return "left";
        if (i === cur[0] - 1 && j === cur[1] - 1) return "diag";
        return null;
      };

      // ---- header letters ----------------------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const fLetter = Math.max(9, Math.round(cell * 0.42));
      for (let j = 0; j <= n; j++) {
        ctx.font = fLetter + "px " + env.font.mono;
        ctx.fillStyle = cur && cur[1] === j && j > 0 ? C.text : C.muted;
        ctx.fillText(j === 0 ? "·" : s.b[j - 1], cx(j), ty + cell / 2);
      }
      for (let i = 0; i <= m; i++) {
        ctx.font = fLetter + "px " + env.font.mono;
        ctx.fillStyle = cur && cur[0] === i && i > 0 ? C.text : C.muted;
        ctx.fillText(i === 0 ? "·" : s.a[i - 1], tx + cell / 2, cy(i));
      }

      // ---- cells --------------------------------------------------------------
      for (let i = 0; i <= m; i++) {
        for (let j = 0; j <= n; j++) {
          const x = tx + (j + 1) * cell, y = ty + (i + 1) * cell;
          const v = s.table[i][j];
          const src = srcOf(i, j);

          let fill = C.surface2, alpha = 1;
          if (v === null) { fill = C.surface2; alpha = 0.35; }
          else if (cur && cur[0] === i && cur[1] === j && s.path.length === 0) { fill = C.viz1; }
          else if (onPath[i][j]) { fill = C.viz6; alpha = 0.9; }
          else if (src) { fill = src === cand.chosen ? C.viz6 : C.viz2; alpha = src === cand.chosen ? 0.9 : 0.55; }
          else if (s.rowDone !== null && i === s.rowDone) { fill = C.viz3; alpha = 0.5; }
          else { fill = C.viz3; alpha = 0.18; }

          ctx.globalAlpha = alpha;
          ctx.fillStyle = fill;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, Math.max(1, cell - 2), Math.max(1, cell - 2), 3);
          ctx.fill();
          ctx.globalAlpha = 1;

          ctx.strokeStyle = C.grid;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, Math.max(1, cell - 2), Math.max(1, cell - 2), 3);
          ctx.stroke();

          if (v !== null && cell > 13) {
            ctx.fillStyle = C.text;
            ctx.font = Math.max(9, Math.round(cell * 0.4)) + "px " + env.font.mono;
            ctx.fillText(String(v), cx(j), cy(i));
          }
        }
      }

      // ---- dependency arrows ---------------------------------------------------
      if (cur && cand && s.path.length === 0) {
        const arrow = function (fi, fj, key) {
          const x0 = cx(fj), y0 = cy(fi), x1 = cx(cur[1]), y1 = cy(cur[0]);
          const dx = x1 - x0, dy = y1 - y0;
          const len = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / len, uy = dy / len;
          const shrink = cell * 0.42;
          const ax = x0 + ux * shrink, ay = y0 + uy * shrink;
          const bx = x1 - ux * shrink, by = y1 - uy * shrink;
          const chosen = key === cand.chosen;
          ctx.strokeStyle = chosen ? C.viz6 : C.viz2;
          ctx.fillStyle = chosen ? C.viz6 : C.viz2;
          ctx.lineWidth = chosen ? 2.5 : 1.25;
          ctx.globalAlpha = chosen ? 1 : 0.65;
          ctx.beginPath();
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
          ctx.stroke();
          const hd = chosen ? 6 : 4.5;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.lineTo(bx - ux * hd - uy * hd * 0.6, by - uy * hd + ux * hd * 0.6);
          ctx.lineTo(bx - ux * hd + uy * hd * 0.6, by - uy * hd - ux * hd * 0.6);
          ctx.closePath();
          ctx.fill();
          ctx.globalAlpha = 1;
        };
        if (cand.up !== null) arrow(cur[0] - 1, cur[1], "up");
        if (cand.left !== null) arrow(cur[0], cur[1] - 1, "left");
        if (cand.diag !== null) arrow(cur[0] - 1, cur[1] - 1, "diag");

        ctx.strokeStyle = C.viz1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(tx + (cur[1] + 1) * cell + 1, ty + (cur[0] + 1) * cell + 1, Math.max(1, cell - 2), Math.max(1, cell - 2), 3);
        ctx.stroke();
      }

      // ---- header text ----------------------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText("edit distance:  \"" + s.a + "\"  →  \"" + s.b + "\"", padX, 18);

      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText("up = delete   left = insert   diag = match/substitute", padX, 34);

      if (s.best !== null) {
        ctx.textAlign = "right";
        ctx.fillStyle = C.text;
        ctx.font = "13px " + env.font.mono;
        ctx.fillText("dp[" + m + "][" + n + "] = " + s.best, W - padX, 18);
        ctx.textAlign = "left";
      }

      // ---- legend ----------------------------------------------------------------
      const legend = [
        [C.viz1, "filling"],
        [C.viz2, "source read"],
        [C.viz6, "chosen / path"],
        [C.viz3, "done"]
      ];
      let lx = padX;
      ctx.font = "10px " + env.font.base;
      for (let i = 0; i < legend.length; i++) {
        ctx.fillStyle = legend[i][0];
        ctx.globalAlpha = 0.85;
        ctx.beginPath();
        ctx.roundRect(lx, 40, 9, 9, 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.muted;
        ctx.fillText(legend[i][1], lx + 13, 48);
        lx += 15 + ctx.measureText(legend[i][1]).width + 10;
      }

      // ---- right panel: the edit script -------------------------------------------
      const px0 = W - padX - panelW;
      ctx.fillStyle = C.surface;
      ctx.beginPath();
      ctx.roundRect(px0, headH + 4, panelW, H - headH - footH - 4, 6);
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(px0, headH + 4, panelW, H - headH - footH - 4, 6);
      ctx.stroke();

      ctx.fillStyle = C.text2;
      ctx.font = "11px " + env.font.base;
      ctx.fillText("edit script", px0 + 10, headH + 22);

      if (s.ops.length === 0) {
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.mono;
        ctx.fillText("(emitted during traceback)", px0 + 10, headH + 40);
      } else {
        ctx.font = "10px " + env.font.mono;
        const maxRows = Math.max(1, Math.floor((H - headH - footH - 40) / 15));
        const list = s.ops.slice(0, maxRows);
        for (let i = 0; i < list.length; i++) {
          ctx.fillStyle = C.text2;
          const t = list[i].length > 26 ? list[i].slice(0, 25) + "…" : list[i];
          ctx.fillText((i + 1) + ". " + t, px0 + 10, headH + 40 + i * 15);
        }
        if (s.ops.length > list.length) {
          ctx.fillStyle = C.muted;
          ctx.fillText("+" + (s.ops.length - list.length) + " more", px0 + 10, headH + 40 + list.length * 15);
        }
      }

      // candidate readout
      if (cand && s.path.length === 0) {
        const by = H - footH - 46;
        ctx.fillStyle = C.muted;
        ctx.font = "10px " + env.font.mono;
        ctx.fillText("up   " + cand.up, px0 + 10, by);
        ctx.fillText("left " + cand.left, px0 + 10, by + 14);
        ctx.fillText("diag " + cand.diag + (cand.match ? "  (match)" : ""), px0 + 10, by + 28);
      }
    }
  },

  drill: {
    cards: [
      { q: "Name the two properties a problem needs before DP applies.", a: "Optimal substructure (the best whole is built from best parts) and overlapping subproblems (the naive recursion re-solves the same state). Without overlap it is divide-and-conquer, and memoisation buys nothing.", tags: ["recognition"] },
      { q: "State the edit-distance recurrence, including what each direction means.", a: "`dp[i][j] = dp[i-1][j-1]` if `a[i-1] == b[j-1]`, else `1 + min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1])` — up = delete from `a`, left = insert from `b`, diagonal = substitute.", tags: ["recurrence"] },
      { q: "Why are the base cases `dp[i][0] = i` and `dp[0][j] = j`?", a: "Turning a prefix of length `i` into the empty string costs `i` deletions; building a prefix of length `j` from the empty string costs `j` insertions. No choice is involved, which is what makes them base cases.", tags: ["base-cases"] },
      { q: "How do you get O(min(m, n)) space, and what do you lose?", a: "A cell only reads the row above and the cell to its left, so keep two rows (or one row plus a saved diagonal) and loop with the shorter word inside. You lose the traceback — the edit script needs the full table, or Hirschberg's O(min(m,n))-space divide-and-conquer.", tags: ["space", "optimisation"] },
      { q: "Memoisation vs tabulation — one advantage each.", a: "Memoisation transcribes the recurrence directly and only visits reachable states. Tabulation avoids recursion depth limits, has better cache behaviour, and is the only one you can space-optimise or traceback over.", tags: ["technique"] },
      { q: "How does the LCS recurrence differ from edit distance?", a: "Same table, but on a mismatch LCS takes `max(dp[i-1][j], dp[i][j-1])` with no diagonal move, because substitution is not allowed. With insert+delete only, `edit = m + n - 2·LCS`.", tags: ["variants"] },
      { q: "Give the one-line counterexample to greedy edit distance.", a: "`abcdef` -> `zabcde` costs a single insertion, but greedy substitute-on-mismatch pays 6. Greedy cannot see that shifting the alignment re-syncs the rest of the string.", tags: ["pitfall"] },
      { q: "Deletion costs 2 and substitution costs 3. What changes?", a: "Only the constants in the recurrence and the base cases (`i·cost_del`, `j·cost_ins`). Table shape, evaluation order, O(mn) time and the traceback are unchanged — this is the version spell-checkers actually ship, weighting keyboard-adjacent substitutions lower. Damerau-Levenshtein adds a fourth transition, `dp[i-2][j-2] + 1`, for a transposition.", tags: ["variants"] }
    ],
    sixtySecond: [
      "Derive the edit-distance recurrence from scratch: state the subproblem in English, give the three transitions, and justify the base cases.",
      "Explain why the dependency shape of the table dictates both the evaluation order and the O(min(m,n)) space optimisation — and what that optimisation costs you.",
      "Explain how you recognise a DP problem in an interview, and how you decide between memoisation and tabulation."
    ]
  }
};
