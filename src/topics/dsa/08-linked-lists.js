// Lesson 08 — Linked List Reversal & Cycles (track: dsa)
// Exactly one statement below, no imports, no top-level consts.
// `frames` is pure (uses only the injected `rng`); `draw` reads every colour from env.colors.

export default {
  id: "linked-lists",
  track: "dsa",
  title: "Linked List Reversal & Cycles",
  difficulty: 1,
  minutes: 15,
  tags: ["linked-lists", "pointers", "two-pointers"],

  explainer: [
    { type: "p", text: "A linked list gives you exactly one power an array does not have: **O(1) structural edits given a pointer to the spot**. Everything else about it is worse — no random access, terrible cache locality, a pointer of overhead per element. Interview questions on lists are really pointer-discipline questions." },

    { type: "h3", text: "Reversal: the three-pointer dance" },
    { type: "p", text: "You walk the list once holding three references. The invariant is: *everything from `prev` backwards is already reversed, everything from `cur` forwards is untouched, and the two halves are currently disconnected.* Each iteration reconnects exactly one edge and moves the boundary one node right." },
    { type: "code", lang: "python", code: "def reverse(head):\n    prev, cur = None, head\n    while cur:\n        nxt = cur.next        # 1. SAVE — after the next line the rest of the list is unreachable\n        cur.next = prev       # 2. FLIP — the only mutation, exactly one edge\n        prev, cur = cur, nxt  # 3. SLIDE — move the boundary one node right\n    return prev               # cur is None, so prev is the last node visited = new head" },
    { type: "callout", tone: "pitfall", text: "Forgetting the `nxt = cur.next` save is the single most common linked-list bug. The moment you write `cur.next = prev` the tail is unreachable — you have not corrupted memory, you have simply lost the list, and no later line can recover it." },

    { type: "h3", text: "Floyd's cycle detection, and why it works" },
    { type: "p", text: "Move `slow` one node and `fast` two nodes per tick. If there is no cycle, `fast` runs off the end in about `n/2` ticks. If there is a cycle, both pointers eventually enter it, and from then on the gap from `slow` to `fast` **around the cycle** shrinks by exactly one per tick — one pointer gains one net node on the other. A gap that decreases by one can never step over zero, so they must land on the same node." },

    { type: "h3", text: "Why resetting to the head finds the entry" },
    { type: "list", items: [
      "Let `μ` = distance from head to the cycle entry, `λ` = cycle length, and `t` = ticks until they meet.",
      "`slow` has walked `t`, `fast` has walked `2t`, and both stand on the same node, so `2t − t = t` must be a whole number of laps: **`t ≡ 0 (mod λ)`**.",
      "`slow` is `t − μ` steps into the cycle. Walking `μ` more steps puts it `t` steps past the entry — and `t` is a multiple of `λ`, so that is exactly back at the **entry**.",
      "So: reset one pointer to the head, advance both one step at a time, and they collide after exactly `μ` steps — at the entry. No arithmetic on `μ` is ever needed, which is the elegant part."
    ]},
    { type: "callout", tone: "tip", text: "You can always answer \"detect a cycle\" with a hash set of visited nodes in O(n) time and O(n) space. Say that first, then offer Floyd for O(1) space. Showing you know the trade-off beats jumping straight to the clever answer." },

    { type: "h3", text: "The tricks worth having in your hands" },
    { type: "list", items: [
      "**Dummy head** — `dummy = Node(0); dummy.next = head` removes every \"what if we delete/insert at the head\" special case. Return `dummy.next`.",
      "**Runner ahead by k** — advance one pointer k nodes, then move both; when the leader hits null, the follower is on the k-th from the end.",
      "**Slow/fast for the middle** — when `fast` reaches the end, `slow` is at the midpoint. Used by merge sort on lists and by the palindrome check.",
      "**Reverse a sublist in place** — the same three-pointer loop bounded by a saved `before` and `after` node; this is the core of reverse-k-group."
    ]},
    { type: "callout", tone: "warn", text: "\"Deleting from a linked list is O(1)\" is only true if you already hold the previous node. Searching for it is O(n), which is why real code either keeps a doubly-linked list or hands out node handles (that is exactly how an LRU cache's hash map + doubly-linked list works)." }
  ],

  complexity: {
    rows: [
      { operation: "Reverse (iterative)", time: "O(n)", space: "O(1)", note: "one pass, three pointers" },
      { operation: "Reverse (recursive)", time: "O(n)", space: "O(n)", note: "call stack — can blow up on 10^5 nodes" },
      { operation: "Cycle detection (Floyd)", time: "O(n)", space: "O(1)", note: "meets within μ + λ ticks" },
      { operation: "Cycle detection (hash set)", time: "O(n)", space: "O(n)", note: "simpler, states the trade-off" },
      { operation: "Index / access k-th", time: "O(n)", space: "O(1)", note: "no random access — this is the whole weakness" },
      { operation: "Insert / delete at a known node", time: "O(1)", space: "O(1)", note: "requires the previous node, or a doubly-linked list" }
    ]
  },

  interview: {
    whyAsked: "Reversal is the cheapest test of whether you can mutate pointers without losing data, and whether you can state an invariant while doing it. Floyd's algorithm additionally shows whether you can prove a claim rather than recite it — the interviewer is listening for the modular-arithmetic argument, not the code.",
    followUps: [
      { q: "Write the recursive reversal — and tell me when you would not use it.", a: "`if not head or not head.next: return head; new_head = reverse(head.next); head.next.next = head; head.next = None; return new_head`. It recurses to the tail, then unwinds flipping each edge on the way back. It costs O(n) stack, so on a list of 10⁵ nodes CPython hits its recursion limit and a C++ solution risks a stack overflow — the iterative version is strictly better in production." },
      { q: "Reverse the list in groups of k.", a: "Use a dummy head and a `group_prev` pointer. For each group, first walk k nodes to check a full group exists (otherwise leave the remainder as-is per the usual problem statement), then run the standard three-pointer reversal bounded to those k nodes, then reconnect: `group_prev.next` becomes the group's new head and the old group head becomes the new `group_prev`. O(n) time, O(1) space; the difficulty is entirely in the reconnection bookkeeping, which the dummy head halves." },
      { q: "Prove that the tortoise and the hare must meet.", a: "Once both are inside the cycle, define the gap as the forward distance from slow to fast around the cycle, in [0, λ). Each tick fast gains exactly one net node, so the gap decreases by one modulo λ. It therefore takes at most λ ticks to hit zero, and because it changes by one at a time it cannot skip over zero. If instead fast moved three at a time the gap changes by two per tick and, with an even cycle length and an odd starting gap, it could cycle without ever hitting zero — the step sizes are not arbitrary." },
      { q: "Why does resetting one pointer to the head find the cycle entry?", a: "At the meeting point slow has walked t and fast 2t, and their difference t is a whole number of laps, so t ≡ 0 (mod λ). Slow is (t − μ) steps into the cycle, so advancing it μ more steps leaves it t steps past the entry — a multiple of λ, i.e. back at the entry. A pointer starting at the head also needs exactly μ steps to reach the entry, so moving both one step at a time makes them collide there." },
      { q: "What is the dummy-head trick and what does it buy you?", a: "Allocate a throwaway node whose `next` is the real head and return `dummy.next` at the end. It makes the head no longer a special case, so insertion, deletion and merging need one code path instead of two. In merge-two-sorted-lists or remove-nth-from-end it removes every `if prev is None` branch, which is where the off-by-one bugs live." },
      { q: "When does a linked list actually beat an array?", a: "When you hold a pointer to the position and need O(1) splice or delete with stable references to other elements — an LRU cache (hash map to node + doubly-linked list), an intrusive free list in an allocator, or a queue built from chunks. It also avoids the O(n) copy of a growing array and never invalidates references on insertion. For anything involving scanning, sorting, or indexing, a contiguous array wins on cache locality by an order of magnitude, and that is the honest default." }
    ]
  },

  code: [
    { lang: "python", label: "Reverse (iterative)", code: "class Node:\n    __slots__ = (\"val\", \"next\")\n    def __init__(self, val, nxt=None):\n        self.val, self.next = val, nxt\n\ndef reverse(head):\n    prev, cur = None, head\n    # invariant: [.. prev] is reversed, [cur ..] is untouched, and they are disconnected\n    while cur:\n        nxt = cur.next          # SAVE first — one line later this link is gone\n        cur.next = prev         # FLIP exactly one edge\n        prev, cur = cur, nxt    # SLIDE the boundary right\n    return prev                 # cur is None, so prev is the final node = new head\n\ndef reverse_between(head, left, right):\n    # reverse positions [left, right] (1-indexed) in one pass, dummy head kills the edge cases\n    dummy = Node(0, head)\n    before = dummy\n    for _ in range(left - 1):\n        before = before.next\n    prev, cur = None, before.next\n    tail = cur                  # this node becomes the tail of the reversed chunk\n    for _ in range(right - left + 1):\n        nxt = cur.next\n        cur.next = prev\n        prev, cur = cur, nxt\n    before.next = prev          # stitch the reversed chunk back in\n    tail.next = cur\n    return dummy.next" },

    { lang: "python", label: "Floyd: detect + find entry", code: "def detect_cycle(head):\n    slow = fast = head\n\n    # PHASE 1 — the gap from slow to fast shrinks by exactly 1 per tick,\n    # so if they are both in the cycle they cannot step over each other.\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            break\n    else:\n        return None                 # fast fell off the end: acyclic\n\n    # PHASE 2 — let mu = head->entry, lam = cycle length, t = ticks so far.\n    # slow walked t, fast walked 2t, and 2t - t = t is a whole number of laps,\n    # so t % lam == 0. slow sits (t - mu) into the cycle; mu more steps puts it\n    # t steps past the entry, i.e. exactly back AT the entry.\n    p = head\n    while p is not slow:            # both need exactly mu steps\n        p = p.next\n        slow = slow.next\n    return p                        # the cycle entry\n\ndef cycle_length(node_in_cycle):\n    n, cur = 1, node_in_cycle.next\n    while cur is not node_in_cycle:\n        cur = cur.next\n        n += 1\n    return n" },

    { lang: "python", label: "The other list patterns", code: "def middle(head):\n    slow = fast = head\n    while fast and fast.next:       # fast ends on the last node (odd) or None (even)\n        slow, fast = slow.next, fast.next.next\n    return slow                     # second middle for even length\n\ndef remove_nth_from_end(head, n):\n    dummy = Node(0, head)\n    lead = lag = dummy\n    for _ in range(n):\n        lead = lead.next            # open a gap of exactly n\n    while lead.next:\n        lead, lag = lead.next, lag.next\n    lag.next = lag.next.next        # lag is the node BEFORE the target\n    return dummy.next               # dummy makes deleting the head unremarkable\n\ndef merge_two(a, b):\n    dummy = tail = Node(0)\n    while a and b:\n        if a.val <= b.val:\n            tail.next, a = a, a.next\n        else:\n            tail.next, b = b, b.next\n        tail = tail.next\n    tail.next = a or b              # one list is empty; splice the rest in O(1)\n    return dummy.next\n\ndef is_palindrome(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow, fast = slow.next, fast.next.next\n    second = reverse(slow)          # reverse the back half in place: O(1) space\n    a, b = head, second\n    while b:\n        if a.val != b.val:\n            return False\n        a, b = a.next, b.next\n    return True" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.3, maxFrames: 320 },

    params: [
      { key: "n",       label: "Nodes",          type: "int",  min: 4, max: 16, default: 12 },
      { key: "mode",    label: "Algorithm",      type: "enum", options: ["reverse", "floyd"], default: "reverse" },
      { key: "cycleAt", label: "Cycle entry",    type: "int",  min: -1, max: 15, default: 5 },
      { key: "seed",    label: "Reshuffle",      type: "seed" }
    ],

    frames: function* (params, rng) {
      const out = [];
      const MAXF = 300;

      const n = Math.max(2, Math.min(16, Math.floor(params && params.n ? params.n : 12)));
      const mode = params && params.mode === "floyd" ? "floyd" : "reverse";
      let cycleAt = params && typeof params.cycleAt === "number" ? Math.floor(params.cycleAt) : 5;
      if (cycleAt > n - 1) cycleAt = n - 1;
      if (cycleAt < 0) cycleAt = -1;

      const vals = [];
      for (let i = 0; i < n; i++) vals.push(10 + Math.floor(rng() * 90));

      // next[i] = index of the successor, or -1 for null.
      const next = [];
      for (let i = 0; i < n; i++) next.push(i + 1 < n ? i + 1 : -1);
      if (mode === "floyd" && cycleAt >= 0) next[n - 1] = cycleAt;

      const base = function (extra) {
        const s = {
          mode: mode,
          n: n,
          vals: vals.slice(),
          next: next.slice(),
          head: 0,
          cycleAt: mode === "floyd" ? cycleAt : -1,
          prev: -1,
          cur: -1,
          nxt: -1,
          slow: -1,
          fast: -1,
          walk: -1,
          meet: -1,
          entry: -1,
          flipped: 0,
          ticks: 0,
          phase2: false,
          gap: -1
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

      if (mode === "reverse") {
        add(
          "A singly linked list of " + n + " nodes. Every node knows only its successor, so the only way to reach node k is to walk k links.",
          "init",
          base()
        );

        let prev = -1;
        let cur = 0;
        let nxt = -1;
        let flipped = 0;

        add(
          "prev = null, cur = head. Invariant: everything behind prev is already reversed, everything from cur on is untouched, and right now the two halves are disconnected.",
          "init",
          base({ prev: prev, cur: cur, nxt: nxt, flipped: flipped }),
          [0]
        );

        while (cur !== -1 && out.length < MAXF - 6) {
          add(
            "cur = node " + cur + " (value " + vals[cur] + "). Its outgoing edge is the one and only edge this iteration will change.",
            "inspect",
            base({ prev: prev, cur: cur, nxt: -1, flipped: flipped }),
            [cur]
          );

          nxt = next[cur];
          add(
            nxt === -1
              ? "SAVE: next = cur.next = null. cur is the last node, so after the flip there is nothing left to walk to."
              : "SAVE: next = cur.next = node " + nxt + ". This must happen BEFORE the flip -- one line later, that link no longer exists and the tail would be lost forever.",
            "save",
            base({ prev: prev, cur: cur, nxt: nxt, flipped: flipped }),
            nxt === -1 ? [cur] : [cur, nxt]
          );

          next[cur] = prev;
          flipped++;
          add(
            prev === -1
              ? "FLIP: cur.next = prev = null. The old head becomes the new tail -- exactly one edge changed."
              : "FLIP: cur.next = prev, so node " + cur + " now points back at node " + prev +
                ". Exactly one edge changed; the list is momentarily two disconnected pieces.",
            "flip",
            base({ prev: prev, cur: cur, nxt: nxt, flipped: flipped }),
            [cur]
          );

          prev = cur;
          cur = nxt;
          add(
            cur === -1
              ? "SLIDE: prev = cur, cur = next = null. The loop condition now fails, and prev is standing on the new head."
              : "SLIDE: prev = " + prev + ", cur = " + cur + ". The boundary between the reversed prefix and the untouched suffix moved one node right.",
            "slide",
            base({ prev: prev, cur: cur, nxt: -1, flipped: flipped }),
            cur === -1 ? [prev] : [prev, cur]
          );
        }

        add(
          "cur is null, so the whole list has been consumed and prev = node " + prev +
            " is the new head. " + flipped + " edges flipped, one pass, O(1) extra space.",
          "done",
          base({ prev: prev, cur: -1, nxt: -1, flipped: flipped, walk: prev }),
          [prev]
        );

        let w = prev;
        let steps = 0;
        const order = [];
        while (w !== -1 && steps < n + 1 && out.length < MAXF - 2) {
          order.push(vals[w]);
          add(
            (order.length === 1
              ? "Verify by walking from the new head: " + order.join(" → ") +
                ". If any flip had been done before saving `next`, the walk would stop here — that is the bug this check catches."
              : "Walk continues: " + order.join(" → ") + (next[w] === -1 ? " → null" : "") +
                (next[w] === -1
                  ? ". Termination at null proves no cycle was introduced — a mis-ordered flip makes the last node point at itself and loops forever."
                  : ". Every node is reached exactly once, in the exact reverse of the original order.")),
            "verify",
            base({ prev: prev, cur: -1, nxt: -1, flipped: flipped, walk: w }),
            [w]
          );
          w = next[w];
          steps++;
        }

        add(
          "Reversed. Note what this cost: no array copy, no extra memory, and every node object is the same object it always was -- only " +
            flipped + " pointer writes.",
          "done",
          base({ prev: prev, cur: -1, nxt: -1, flipped: flipped, walk: -1 }),
          [prev]
        );

        yield* out;
        return;
      }

      // ---- Floyd's tortoise and hare ----------------------------------------
      const lam = cycleAt >= 0 ? n - cycleAt : 0;
      const inCycle = function (i) { return cycleAt >= 0 && i >= cycleAt; };
      const gapOf = function (sIdx, fIdx) {
        if (!inCycle(sIdx) || !inCycle(fIdx) || lam <= 0) return -1;
        return (((fIdx - cycleAt) - (sIdx - cycleAt)) % lam + lam) % lam;
      };

      add(
        cycleAt >= 0
          ? "A list of " + n + " nodes whose tail points back to node " + cycleAt +
            " -- so the last " + lam + " nodes form a cycle. Walking it never terminates; that is what we must detect using O(1) memory."
          : "A list of " + n + " nodes ending in null. We will run Floyd's algorithm anyway, to see what the no-cycle case looks like.",
        "init",
        base({ slow: -1, fast: -1 })
      );

      let slow = 0;
      let fast = 0;
      let ticks = 0;
      let meet = -1;

      add(
        "slow and fast both start at the head. slow advances one node per tick, fast advances two -- so fast gains exactly one node on slow every tick.",
        "phase1",
        base({ slow: slow, fast: fast, ticks: ticks, gap: gapOf(slow, fast) }),
        [0]
      );

      let acyclic = false;
      while (out.length < MAXF - 10) {
        ticks++;
        slow = next[slow];
        add(
          "Tick " + ticks + ": slow hops one node, to node " + slow + " (value " + vals[slow] + ").",
          "phase1",
          base({ slow: slow, fast: fast, ticks: ticks, gap: gapOf(slow, fast) }),
          [slow]
        );

        if (next[fast] === -1) {
          acyclic = true;
          add(
            "fast.next is null, so fast walks off the end. No cycle exists -- and we proved it in about n/2 ticks using two pointers and no extra memory.",
            "done",
            base({ slow: slow, fast: fast, ticks: ticks }),
            [fast]
          );
          break;
        }
        fast = next[fast];
        add(
          "fast's first hop lands on node " + fast + ". A cautious implementation checks fast and fast.next before every double hop -- that null check is the whole acyclic case.",
          "phase1",
          base({ slow: slow, fast: fast, ticks: ticks, gap: gapOf(slow, fast) }),
          [fast]
        );

        if (next[fast] === -1) {
          acyclic = true;
          add(
            "fast.next is null on the second hop, so the list ends. No cycle -- O(n) time, O(1) space, no hash set required.",
            "done",
            base({ slow: slow, fast: fast, ticks: ticks }),
            [fast]
          );
          break;
        }
        fast = next[fast];

        const g = gapOf(slow, fast);
        add(
          "fast's second hop lands on node " + fast + ". " +
            (g >= 0
              ? "Both pointers are inside the cycle now, and the forward gap from slow to fast is " + g +
                " -- it drops by exactly one each tick, so it can never skip past zero."
              : "fast is still racing down the tail towards the cycle."),
          "phase1",
          base({ slow: slow, fast: fast, ticks: ticks, gap: g }),
          [fast]
        );

        if (slow === fast) {
          meet = slow;
          add(
            "MEET at node " + slow + " after " + ticks + " ticks. slow walked " + ticks + " nodes, fast walked " +
              (2 * ticks) + ", and they stand on the same node -- so the difference " + ticks +
              " is a whole number of laps: t ≡ 0 (mod λ).",
            "meet",
            base({ slow: slow, fast: fast, ticks: ticks, meet: meet, gap: 0 }),
            [slow]
          );
          break;
        }
      }

      if (!acyclic && meet !== -1 && out.length < MAXF - 8) {
        add(
          "PHASE 2. slow sits t − μ steps inside the cycle (μ = distance from head to the entry). Walk it μ more steps and it is t past the entry -- and t is a multiple of λ, so that lands exactly ON the entry.",
          "phase2",
          base({ slow: meet, fast: meet, ticks: ticks, meet: meet, phase2: true }),
          [meet]
        );

        let p1 = 0;
        let p2 = meet;
        add(
          "So: reset one pointer to the head and move BOTH one node per tick. The head pointer needs μ steps to reach the entry, and by the algebra above so does the one at the meeting point.",
          "phase2",
          base({ slow: p1, fast: p2, ticks: ticks, meet: meet, phase2: true }),
          [p1, p2]
        );

        let guard = 0;
        while (p1 !== p2 && guard < n + 2 && out.length < MAXF - 6) {
          p1 = next[p1];
          p2 = next[p2];
          guard++;
          add(
            "Step " + guard + ": the head pointer is at node " + p1 + ", the meeting-point pointer is at node " + p2 +
              (p1 === p2 ? " -- they have collided." : " -- still apart, keep going."),
            "phase2",
            base({ slow: p1, fast: p2, ticks: ticks, meet: meet, phase2: true }),
            [p1, p2]
          );
        }

        const entry = p1;
        add(
          "Cycle entry = node " + entry + " (value " + vals[entry] + "), found after " + guard +
            " steps -- and " + guard + " is exactly μ. We never computed μ or λ; the arithmetic did it for us.",
          "entry",
          base({ slow: entry, fast: entry, ticks: ticks, meet: meet, entry: entry, phase2: true }),
          [entry]
        );

        let c = next[entry];
        let len = 1;
        add(
          "Cycle length is now one more walk: start at the entry and count until you come back to it.",
          "measure",
          base({ slow: entry, fast: -1, meet: meet, entry: entry, walk: entry, phase2: true }),
          [entry]
        );
        while (c !== entry && len < n + 2 && out.length < MAXF - 3) {
          len++;
          add(
            "Counting: node " + c + " is " + (len - 1) + " step" + (len - 1 === 1 ? "" : "s") + " past the entry.",
            "measure",
            base({ slow: entry, fast: -1, meet: meet, entry: entry, walk: c, phase2: true }),
            [c]
          );
          c = next[c];
        }

        add(
          "Done: entry at node " + entry + ", cycle length λ = " + lam + ", meeting point node " + meet +
            ". Total cost O(n) time and O(1) space -- a visited-set solution is just as fast but costs O(n) memory.",
          "done",
          base({ slow: entry, fast: -1, meet: meet, entry: entry, walk: -1, phase2: true }),
          [entry]
        );
      }

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

      const pad = 20;
      const step = (W - pad * 2) / n;
      const boxW = Math.max(20, Math.min(58, step - 14));
      const boxH = 32;
      const boxY = Math.round(H * 0.34);
      const midY = boxY + boxH / 2;
      const cx = function (i) { return pad + i * step + step / 2; };

      const arrowHead = function (x, y, ang, color) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x - 7 * Math.cos(ang - 0.4), y - 7 * Math.sin(ang - 0.4));
        ctx.lineTo(x - 7 * Math.cos(ang + 0.4), y - 7 * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
      };

      // ---- edges -------------------------------------------------------------
      for (let i = 0; i < n; i++) {
        const j = s.next[i];
        if (j === -1) {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(cx(i) + boxW / 2, midY);
          ctx.lineTo(cx(i) + boxW / 2 + Math.min(18, step - boxW), midY);
          ctx.stroke();
          ctx.fillStyle = C.muted;
          ctx.font = "9px " + env.font.mono;
          ctx.textAlign = "left";
          ctx.fillText("∅", cx(i) + boxW / 2 + Math.min(20, step - boxW), midY + 3);
          continue;
        }

        const isBackEdge = s.mode === "floyd" && i === n - 1;
        const forward = j === i + 1;
        let color = C.axis;
        let width = 1.5;
        if (isBackEdge) { color = C.viz7; width = 2; }
        else if (!forward) { color = C.viz6; width = 2; }

        if (forward) {
          const x0 = cx(i) + boxW / 2;
          const x1 = cx(j) - boxW / 2;
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(x0, midY);
          ctx.lineTo(x1 - 5, midY);
          ctx.stroke();
          arrowHead(x1, midY, 0, color);
        } else {
          // draw right-to-left (or long) links as an arc under the row
          const x0 = cx(i);
          const x1 = cx(j);
          const depth = isBackEdge ? Math.min(78, 26 + Math.abs(i - j) * 5) : 30;
          const yb = boxY + boxH;
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(x0, yb);
          ctx.bezierCurveTo(x0, yb + depth, x1, yb + depth, x1, yb + 4);
          ctx.stroke();
          arrowHead(x1, yb + 2, -Math.PI / 2, color);
        }
      }

      // ---- nodes -------------------------------------------------------------
      for (let i = 0; i < n; i++) {
        const x = cx(i) - boxW / 2;
        let fill = C.surface2;
        let stroke = C.border;
        if (s.entry === i) { fill = C.viz7; stroke = C.viz7; }
        else if (s.meet === i && s.entry === -1) { fill = C.viz2; stroke = C.viz2; }
        else if (s.cur === i || s.slow === i) { fill = C.viz1; stroke = C.viz1; }
        else if (s.fast === i) { fill = C.viz5; stroke = C.viz5; }
        else if (s.walk === i) { fill = C.viz3; stroke = C.viz3; }
        else if (s.nxt === i) { stroke = C.viz4; }
        else if (s.prev === i) { stroke = C.viz5; }

        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.roundRect(x, boxY, boxW, boxH, 5);
        ctx.fill();
        ctx.strokeStyle = stroke;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x, boxY, boxW, boxH, 5);
        ctx.stroke();

        const highlighted = fill !== C.surface2;
        ctx.fillStyle = highlighted ? C.surface : C.text;
        ctx.font = "12px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText(String(s.vals[i]), cx(i), boxY + 21);

        ctx.fillStyle = C.muted;
        ctx.font = "9px " + env.font.mono;
        ctx.fillText(String(i), cx(i), boxY + boxH + 12);
      }

      // ---- pointer flags above the row --------------------------------------
      const flag = function (idx, name, color, lane) {
        if (idx === null || idx === undefined || idx < 0 || idx >= n) return;
        const y = boxY - 12 - lane * 17;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(cx(idx), boxY - 3);
        ctx.lineTo(cx(idx) - 5, boxY - 11);
        ctx.lineTo(cx(idx) + 5, boxY - 11);
        ctx.closePath();
        ctx.fill();
        ctx.font = "10px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText(name, cx(idx), y);
      };

      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;

      if (s.mode === "reverse") {
        ctx.fillText("Reversal — three pointers, one edge flipped per step", pad, 22);
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.mono;
        ctx.fillText(
          "edges flipped: " + s.flipped + " / " + n +
            "   prev=" + (s.prev < 0 ? "null" : s.prev) +
            "  cur=" + (s.cur < 0 ? "null" : s.cur) +
            "  next=" + (s.nxt < 0 ? "null" : s.nxt),
          pad,
          40
        );
        flag(s.cur, "cur", C.viz1, 0);
        flag(s.prev, "prev", C.viz5, s.prev === s.cur ? 1 : 0);
        flag(s.nxt, "next", C.viz4, s.nxt === s.cur || s.nxt === s.prev ? 1 : 0);
        if (s.walk >= 0) flag(s.walk, "walk", C.viz3, 2);
      } else {
        ctx.fillText(
          s.phase2 ? "Floyd — phase 2: finding the cycle entry" : "Floyd — phase 1: tortoise and hare",
          pad,
          22
        );
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.mono;
        ctx.fillText(
          "ticks: " + s.ticks +
            "   slow=" + (s.slow < 0 ? "-" : s.slow) +
            "  fast=" + (s.fast < 0 ? "-" : s.fast) +
            (s.gap >= 0 ? "   gap(slow→fast)=" + s.gap : "") +
            (s.cycleAt >= 0 ? "   λ=" + (n - s.cycleAt) + "  μ=" + s.cycleAt : "   no cycle"),
          pad,
          40
        );
        flag(s.slow, s.phase2 ? "p1" : "slow", C.viz1, 0);
        flag(s.fast, s.phase2 ? "p2" : "fast", C.viz5, s.fast === s.slow ? 1 : 0);
        if (s.walk >= 0 && s.walk !== s.slow) flag(s.walk, "count", C.viz3, 2);
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

      if (s.mode === "reverse") {
        chip(C.viz1, "cur");
        chip(C.viz5, "prev");
        chip(C.viz4, "next (saved)");
        chip(C.viz6, "flipped edge");
      } else {
        chip(C.viz1, s.phase2 ? "pointer from head" : "slow (1 hop)");
        chip(C.viz5, s.phase2 ? "pointer from meeting point" : "fast (2 hops)");
        chip(C.viz7, "cycle back-edge / entry");
        if (s.meet >= 0) chip(C.viz2, "meeting point");
      }
    }
  },

  drill: {
    cards: [
      { q: "State the invariant of the iterative list reversal.", a: "Everything from `prev` backwards is already reversed, everything from `cur` forwards is untouched, and the two halves are currently disconnected. Each iteration reconnects one edge and moves the boundary one node right.", tags: ["invariant", "reversal"] },
      { q: "Why must `nxt = cur.next` come before `cur.next = prev`?", a: "The flip overwrites the only reference to the rest of the list. Save it first or the tail becomes unreachable — the classic linked-list bug.", tags: ["pitfall", "reversal"] },
      { q: "After the reversal loop ends, why return `prev` and not `cur`?", a: "The loop exits when `cur` is None, so `prev` holds the last node actually visited — the old tail, which is the new head.", tags: ["reversal"] },
      { q: "Why must the tortoise and the hare meet inside a cycle?", a: "Once both are in the cycle, fast gains exactly one net node per tick, so the forward gap from slow to fast decreases by one each tick modulo λ. A quantity changing by one cannot skip zero, so it hits zero within λ ticks.", tags: ["floyd", "proof"] },
      { q: "Why does resetting a pointer to the head find the cycle entry?", a: "At the meeting point slow walked t and fast 2t, so t is a multiple of λ. Slow is (t − μ) into the cycle, so μ more steps puts it t past the entry — i.e. back at the entry. A pointer from the head also needs μ steps, so both collide there.", tags: ["floyd", "proof"] },
      { q: "How do you find the middle of a list in one pass?", a: "Slow/fast: advance slow one and fast two; when fast (or fast.next) is null, slow is at the middle. Used by list merge sort and the palindrome check.", tags: ["technique"] },
      { q: "What does the dummy-head trick buy you?", a: "It removes the \"operating on the head\" special case, so insertion, deletion and merging need one code path. Return `dummy.next`.", tags: ["technique"] },
      { q: "Name one real case where a linked list beats an array.", a: "An LRU cache: a hash map holds node handles and a doubly-linked list gives O(1) move-to-front and eviction with no element shifting and no reference invalidation.", tags: ["tradeoffs"] }
    ],
    sixtySecond: [
      "Walk through the three-pointer reversal, state the invariant, and explain why the save must precede the flip.",
      "Prove that Floyd's tortoise and hare must meet, then derive why resetting one pointer to the head lands on the cycle entry.",
      "Compare a linked list with a dynamic array on access, insertion, memory overhead and cache behaviour, and name a structure that genuinely needs the list."
    ]
  }
};
