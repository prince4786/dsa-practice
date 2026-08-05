// Lesson: BFS/DFS on Trees — the four traversal orders and what each one is FOR.
// Contract notes: exactly one statement (`export default {...}`), zero imports,
// `frames` is a pure seeded generator, `draw` is a pure full-redraw of one frame
// and takes every colour from env.colors.

export default {
  id: "tree-traversals",
  track: "dsa",
  title: "BFS/DFS on Trees",
  difficulty: 1,
  minutes: 14,
  tags: ["trees", "bfs", "dfs", "recursion", "stacks-queues"],

  explainer: [
    { type: "p", text: "A tree traversal is simply a rule for the order you visit every node in a tree-shaped structure. Think of a company org chart, or the folders and subfolders on your computer. If someone asked you to 'go look at everyone in this org chart', there's more than one reasonable order to do it in. You could start at the CEO and work down department by department, announcing each person before you look at their reports — root first, then children. Or you could visit every one of a person's reports fully before you announce that person themselves — children before the parent. Or you could count everyone at the top level first, then everyone one level down, and so on, like a company photo taken layer by layer. Each of these orders is genuinely useful for different questions, and 'tree traversal' is just the umbrella name for this whole family of 'in what order do I visit these nodes' techniques. Once you know the four standard orders, and why each one exists, most tree problems in an interview stop looking like brand-new puzzles and start looking like 'which one of these four do I need here, plus a small twist.'" },
    { type: "p", text: "Underneath, all four orders share the exact same two-step skeleton: touch (look at, or record) the current node, and recurse into its children — meaning call that same process again on each child, the way a Russian nesting doll contains a smaller copy of itself inside it. The only thing that changes between the four orders is exactly *where*, relative to those recursive calls, the touch happens. Move that one line up or down in the code and preorder turns into inorder turns into postorder. And if you swap out the mechanism used to hold 'which nodes are queued up to visit next' — a stack (last item added is the first one removed, like a stack of plates) for a queue (first item added is the first one removed, like a line at a checkout counter) — depth-first search becomes breadth-first search. Depth-first search (DFS) means following one branch of the tree as far down as it goes before backing up to try another branch; breadth-first search (BFS) means visiting everything at the current distance from the root before going any deeper. That's the whole shape of this lesson: one skeleton, and a small number of dials you can turn on it." },

    { type: "h3", text: "The four orders and what each is actually for" },
    { type: "list", items: [
      "**Preorder** (order: node itself, then left subtree, then right subtree) — you touch a node *before* you have looked at either of its subtrees at all. This is the **serialisation** order — the order used when turning a tree into a flat sequence of values so it can be saved to disk or sent across a network and rebuilt later. A serialized sequence like `1,2,#,#,3,#,#` (where `#` marks a missing/empty child) can be rebuilt in a single pass, because the very first value you read is always the root of whatever subtree you're currently reconstructing. Preorder is also the natural order for a top-down DFS — one that pushes information *down* into the recursion, such as the current depth, the path taken so far, or a running prefix.",
      "**Inorder** (order: left subtree, then the node itself, then right subtree) — when run on a **BST** (a binary search tree, where every node's left subtree holds only smaller values and its right subtree holds only larger values), inorder traversal emits the keys in fully **sorted order**. That single fact turns three classic problems into short, almost mechanical solutions once you spot the connection: 'validate that this is a real BST', 'find the k-th smallest value', and 'find the two nodes that got swapped by mistake'.",
      "**Postorder** (order: left subtree, then right subtree, then the node itself last) — a node is touched only *after both* of its children are fully finished. That makes postorder the order to reach for whenever a computation has to **aggregate upward** — meaning a parent's answer depends on first knowing both children's answers. Typical examples: subtree sums, subtree heights, deleting/freeing a tree node by node, and the classic 'diameter of a tree' and 'maximum path sum' interview problems.",
      "**Level-order** (also called breadth-first search, or **BFS**) — unlike the other three, this one isn't depth-first at all. It uses a **queue** instead of a stack, which gives you the shallowest not-yet-visited node first, every time. That is exactly what you want for problems like minimum depth, right-side view, zigzag printing, and grouping nodes by which level they're on."
    ]},

    { type: "h3", text: "The invariant" },
    { type: "p", text: "Before writing any of this as code, it helps to name the invariant — the condition that has to stay true after every single step of the algorithm, and that is exactly what lets you trust that the final answer is correct. DFS and BFS have different invariants, because they use different bookkeeping structures underneath." },
    { type: "p", text: "For DFS, the invariant is shaped like a stack: whatever is holding the pending work — whether that's the actual call stack a language maintains behind the scenes for a recursive function (the hidden structure that tracks function calls in progress and exactly where each one should resume), or a stack data structure you build by hand — holds exactly the chain of ancestors of whichever node you are currently processing. Each of those ancestor nodes is 'paused' partway through its own work, waiting for a child to finish before it can continue." },
    { type: "p", text: "For BFS, the invariant is shaped like distance: the queue always holds nodes in non-decreasing depth order (never a node that's farther from the root sitting ahead of one that's closer), and at any given moment it never spans more than two adjacent levels at once. That second fact — never more than two adjacent levels in the queue at the same time — is exactly what makes the level-size trick below correct: it guarantees that the queue's current length is precisely the size of one full level." },

    { type: "code", lang: "python", code: "# the level-size trick — the ONLY thing that separates\n# 'BFS' from 'BFS grouped by level'\nwhile q:\n    for _ in range(len(q)):   # snapshot the size BEFORE the loop\n        node = q.popleft()    # ... everything popped here is one level\n        ...\n    depth += 1" },

    { type: "callout", tone: "tip", text: "Snapshot the queue's current length into a variable before you loop over it — `size = len(q)`, or `range(len(q))` in Python, which evaluates once at the start rather than re-checking on every pass. If you instead write an inner loop that keeps checking `while q:`, newly-added children keep getting pulled into what was supposed to be a single level, and the entire tree collapses into one 'level 0'." },

    { type: "h3", text: "Iterative DFS, and why postorder is the awkward one" },
    { type: "p", text: "When recursion does the work for you, the visiting order falls out naturally from the two lines of code. But interviewers often ask for the same walk written without recursion — using a stack you manage by hand — precisely because it proves you understand what the recursion was actually doing underneath, rather than reciting a memorised shape." },
    { type: "p", text: "Preorder is the easy one to convert: pop a node off the stack, touch it immediately, then push its right child followed by its left child, so the left child ends up on top of the stack and is popped — and therefore visited — next. Inorder needs a slightly different pattern: descend as far left as you can go, pushing every node you pass along the way, until you hit an empty spot; only then do you pop, touch that node, and step over to its right child before repeating the whole process." },
    { type: "p", text: "Postorder is the genuinely awkward one, because a node has to be visited twice conceptually before it is actually touched: once when you first arrive at it, and once again after both of its children have finished — and it's only on that second visit that you record its value. That means each entry on your hand-built stack needs one extra piece of information beyond just 'which node is this': specifically, has this node's right subtree been done yet? Ordinary recursion tracks that extra bit for you automatically, tucked away in what's called the program counter — the piece of state, kept for every paused function call, that records exactly which line of code it should resume from. When you build the stack by hand instead, you have to track that same bit yourself: a flag stored alongside the node, a `lastVisited` pointer, or a shortcut trick where you do a reversed preorder (node, right, left) and reverse the whole output list at the end to land on (left, right, node) for free." },

    { type: "callout", tone: "pitfall", text: "The trap: candidates try to 'validate a BST' by only checking the immediate relationship — `left.val < node.val < right.val` for the current node and its direct children. That check can pass on a broken tree, because a value several levels down on the left side (a 'deep-left grandchild') can be larger than the root, even though every node still looks locally correct compared to just its immediate parent and children. The fix is either an inorder walk that asserts the values come out strictly increasing (exactly what a real BST guarantees), or passing a valid range — a lower bound and upper bound, often written `(lo, hi)` — down through the recursion, narrowing it at every step, so each node is checked against the constraints imposed by *every* one of its ancestors, not just its immediate parent." },

    { type: "h3", text: "Edge cases interviewers actually check" },
    { type: "list", items: [
      "**Empty tree** — before you read `root.val` (the value stored at the root) or push the root onto a queue, you must check whether `root is None` (Python's way of saying 'nothing here') and handle that case first, or the code crashes immediately.",
      "**Single node** — a tree that's just one node with no children has depth 1, not 0. This sounds trivial, but different problem statements define 'depth' differently, so agree on the definition out loud before you code, rather than guessing and landing on an off-by-one answer.",
      "**Skewed tree** — a tree where nodes mostly chain off to one side instead of branching evenly, behaving more like a straight list than a wide tree. A skewed tree with 10⁵ (100,000) nodes blows past Python's default recursion limit of roughly 1,000 nested calls, because a purely recursive DFS needs one stack frame per node on a chain like this. Say this limitation out loud, then offer the iterative version.",
      "**Duplicate keys in a BST** — if the same key value can appear more than once, an inorder traversal emits a sequence that is no longer *strictly* increasing (it can have equal neighbours). That means a 'validate BST' check must use a strict less-than (`<`), not a less-than-or-equal (`<=`), or you must explicitly define which side of the tree duplicates are supposed to live on."
    ]}
  ],

  glossary: [
    { term: "Tree traversal", plain: "A rule for the order in which you visit every node in a tree-shaped data structure — for example, always visiting a parent before its children, or always finishing every child before returning to the parent." },
    { term: "Preorder", plain: "Visiting order: touch the current node first, then its left subtree, then its right subtree. Used for turning a tree into a flat sequence you can save or send elsewhere." },
    { term: "Inorder", plain: "Visiting order: visit the left subtree, then the current node, then the right subtree. On a binary search tree this always produces the values in sorted order." },
    { term: "Postorder", plain: "Visiting order: visit the left subtree, then the right subtree, then the current node last. Used whenever a node's answer depends on already knowing both of its children's answers." },
    { term: "Level-order (BFS)", plain: "Visiting every node one full 'layer' of the tree at a time, starting from the root's layer before moving down to the next. Also called breadth-first search." },
    { term: "Depth-first search (DFS)", plain: "Following one branch of a tree or graph as far down as it goes before backing up and trying the next branch. Preorder, inorder, and postorder are all specific kinds of DFS." },
    { term: "Stack", plain: "A container where you can only add or remove from one end, so the most recently added item is always the first one removed. Used by DFS and by function recursion itself." },
    { term: "Queue", plain: "A container where items are removed in the same order they were added — the first item in is the first one out. Used by BFS." },
    { term: "Binary search tree (BST)", plain: "A tree where every node's left subtree contains only smaller values and its right subtree contains only larger values, which is what makes an inorder walk of it come out sorted." },
    { term: "Invariant", plain: "A condition that has to remain true after every single step of an algorithm — the thing you rely on to trust that the final result is correct." },
    { term: "Call stack", plain: "The hidden structure a programming language uses to keep track of function calls that have started but not yet finished, including exactly where each one should resume." },
    { term: "Program counter", plain: "The piece of state, tracked automatically for every paused function call, that records which line of code that call should resume from." },
    { term: "Morris traversal", plain: "A way of visiting every node of a tree in sorted order without using any extra stack or recursion, by temporarily rewiring some of the tree's own pointers to point back to earlier nodes and then undoing the rewiring." },
    { term: "Skewed tree", plain: "A tree where nodes are mostly chained off to one side rather than branching evenly, making it behave more like a straight list than a wide tree — this is the worst case for recursion depth." }
  ],

  complexity: {
    rows: [
      { operation: "Any traversal (visit every node)", time: "O(n)", space: "O(h)", note: "h = height; recursion or explicit stack" },
      { operation: "DFS on a skewed tree", time: "O(n)", space: "O(n)", note: "h = n — the recursion-limit case" },
      { operation: "DFS on a balanced tree", time: "O(n)", space: "O(log n)", note: "h = log n" },
      { operation: "Level-order (BFS)", time: "O(n)", space: "O(w)", note: "w = max width, up to n/2 at the bottom level" },
      { operation: "Morris inorder", time: "O(n)", space: "O(1)", note: "amortised; threads and un-threads the tree" }
    ]
  },

  interview: {
    whyAsked: "It is the cheapest way to see whether you actually understand recursion as a stack rather than as magic. The signal is not 'can you print a tree' — it is whether you pick the order that matches the problem (aggregate up ⇒ postorder, shallowest first ⇒ BFS, sorted keys ⇒ inorder), and whether you can convert the recursion to an explicit stack on demand, which is what proves you know what the call stack was holding.",
    followUps: [
      { q: "Write inorder traversal iteratively, with an explicit stack.", a: "Keep a `cur` pointer and a stack. While `cur` is not None, push `cur` and go left — you are recording the ancestors you still owe a visit to. When `cur` is None, pop a node, emit it (its whole left subtree is done), and set `cur = node.right`. The loop runs while `cur` or the stack is non-empty; total work is O(n) because every node is pushed and popped exactly once." },
      { q: "Can you do inorder in O(1) extra space?", a: "Yes — Morris traversal. For each node with a left child, find that subtree's rightmost node (the inorder predecessor) and temporarily point its right pointer at the current node, creating a thread back up. Descend left; when you arrive back via the thread, you know the left subtree is done, so you cut the thread and emit. It is still O(n) time amortised because each edge is walked at most twice, but it mutates the tree during the walk, which makes it unsafe in a concurrent or read-only setting." },
      { q: "How do you reconstruct a tree from preorder + inorder?", a: "The first element of preorder is the root; find it in inorder — everything to its left is the left subtree, everything to the right is the right subtree, and their sizes tell you how to split the preorder array. Recurse on the two halves. Use a hash map from value to inorder index to make the lookup O(1), giving O(n) overall instead of O(n²). This needs distinct values, and preorder+postorder is *not* enough to determine a tree uniquely unless it is full." },
      { q: "Why does level-order need the level-size trick?", a: "A plain BFS pops nodes in depth order but gives you no boundary between levels, because children are being appended to the same queue you are draining. Snapshotting `len(q)` at the top of each outer iteration works because of the BFS invariant: at that instant the queue contains exactly the nodes of one level, so popping precisely that many pops that level and nothing else. Without the snapshot the size grows underneath you and every node lands in 'level 0'." },
      { q: "Which traversal would you use for 'delete a tree' and why?", a: "Postorder. You must free the children before you free the parent, because once the parent is gone you no longer have the pointers to reach them. The same shape applies to any bottom-up aggregate: subtree size, height, diameter, max path sum — you need both children's answers before you can compute your own." },
      { q: "BFS or DFS to find the minimum depth of a tree?", a: "BFS, and it is the rare case where BFS strictly wins. BFS can return the moment it pops the first leaf, so on a tree with a shallow leaf and one enormous branch it stops almost immediately; DFS must explore the entire tree to be sure no shallower leaf exists. For maximum depth the opposite is true — you have to see every node either way, so use DFS for its smaller memory footprint." }
    ]
  },

  code: [
    { lang: "python", label: "All four orders", code: "from collections import deque\n\n# --- DFS: the SAME code, one line moved -------------------------------\ndef preorder(node, out):\n    if not node: return out\n    out.append(node.val)        # touch BEFORE the children\n    preorder(node.left, out)\n    preorder(node.right, out)\n    return out\n\ndef inorder(node, out):\n    if not node: return out\n    inorder(node.left, out)\n    out.append(node.val)        # touch BETWEEN the children\n    inorder(node.right, out)    # on a BST this comes out SORTED\n    return out\n\ndef postorder(node, out):\n    if not node: return out\n    postorder(node.left, out)\n    postorder(node.right, out)\n    out.append(node.val)        # touch AFTER both children\n    return out\n\n# --- BFS: a queue instead of the call stack ---------------------------\ndef level_order(root):\n    if not root: return []      # ALWAYS handle the empty tree first\n    levels, q = [], deque([root])\n    while q:\n        size = len(q)           # snapshot: the queue IS exactly one level\n        level = []\n        for _ in range(size):\n            node = q.popleft()\n            level.append(node.val)\n            if node.left:  q.append(node.left)\n            if node.right: q.append(node.right)\n        levels.append(level)\n    return levels" },

    { lang: "python", label: "Iterative DFS (explicit stack)", code: "def preorder_iter(root):\n    out, stack = [], [root] if root else []\n    while stack:\n        node = stack.pop()\n        out.append(node)\n        # push RIGHT first so LEFT is on top and pops first\n        if node.right: stack.append(node.right)\n        if node.left:  stack.append(node.left)\n    return out\n\ndef inorder_iter(root):\n    out, stack, cur = [], [], root\n    while cur or stack:\n        while cur:              # dive left, recording ancestors we still owe\n            stack.append(cur)\n            cur = cur.left\n        cur = stack.pop()       # left subtree finished -> this node is next\n        out.append(cur.val)\n        cur = cur.right         # then hand over to the right subtree\n    return out\n\ndef postorder_iter(root):\n    # trick: preorder with the children swapped gives node,right,left;\n    # reverse that and you have left,right,node.\n    out, stack = [], [root] if root else []\n    while stack:\n        node = stack.pop()\n        out.append(node.val)\n        if node.left:  stack.append(node.left)\n        if node.right: stack.append(node.right)\n    return out[::-1]\n\n# The honest single-stack postorder needs one extra bit per frame,\n# because a node is seen twice. Recursion stores that bit in the\n# program counter; here we store it by hand:\ndef postorder_flagged(root):\n    out, stack = [], [(root, 0)] if root else []\n    while stack:\n        node, stage = stack.pop()\n        if stage == 0:\n            stack.append((node, 1))              # come back to me later\n            if node.right: stack.append((node.right, 0))\n            if node.left:  stack.append((node.left, 0))\n        else:\n            out.append(node.val)                 # both children are done\n    return out" },

    { lang: "python", label: "Two payoffs: validate BST, Morris", code: "# 1) 'Validate a BST' is a one-liner ON TOP of inorder:\n#    inorder of a BST is strictly increasing. Nothing else to check.\ndef is_valid_bst(root):\n    prev = None\n    stack, cur = [], root\n    while cur or stack:\n        while cur:\n            stack.append(cur); cur = cur.left\n        cur = stack.pop()\n        if prev is not None and cur.val <= prev.val:\n            return False        # <= : duplicates are NOT allowed in a strict BST\n        prev = cur\n        cur = cur.right\n    return True\n\n# 2) Morris inorder: O(1) extra space by threading the tree.\ndef morris_inorder(root):\n    out, cur = [], root\n    while cur:\n        if not cur.left:\n            out.append(cur.val)         # no left subtree -> emit and go right\n            cur = cur.right\n        else:\n            pred = cur.left             # inorder predecessor = rightmost of left\n            while pred.right and pred.right is not cur:\n                pred = pred.right\n            if not pred.right:\n                pred.right = cur        # thread: a way back UP\n                cur = cur.left\n            else:\n                pred.right = None       # we came back via the thread ->\n                out.append(cur.val)     # the left subtree is finished\n                cur = cur.right\n    return out" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 200 },

    params: [
      { key: "n",       label: "Nodes",   type: "int",  min: 7, max: 31, default: 27 },
      { key: "balance", label: "Balance", type: "int",  min: 0, max: 100, default: 75 },
      { key: "order",   label: "Order",   type: "enum", options: ["preorder", "inorder", "postorder", "level-order"], default: "inorder" },
      { key: "seed",    label: "Reshape", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = Math.max(1, Math.min(31, params.n | 0));
      const order = params.order;
      const balance = Math.max(0, Math.min(100, params.balance | 0)) / 100;

      // ---- build a random binary tree ---------------------------------------
      // `balance` interpolates between a skewed chain (0) and a near-perfect
      // tree (100). Ids are assigned in preorder, so the root is always 0.
      const L = new Array(n).fill(-1);
      const R = new Array(n).fill(-1);
      let nextId = 0;
      function build(count) {
        if (count <= 0) return -1;
        const centred = (rng() + rng() + rng()) / 3;          // ~ balanced split
        const forced = rng() < (1 - balance) * 0.85;          // ~ everything one side
        const r = forced ? (rng() < 0.5 ? 0 : 0.999999) : centred;
        const lc = Math.max(0, Math.min(count - 1, Math.floor(r * count)));
        const id = nextId++;
        L[id] = build(lc);
        R[id] = build(count - 1 - lc);
        return id;
      }
      const root = build(n);

      // ---- depth + inorder rank (rank drives x, so edges never cross) -------
      const depth = new Array(n).fill(0);
      const rank = new Array(n).fill(0);
      let ord = 0;
      function walk(id, d) {
        if (id < 0) return;
        depth[id] = d;
        walk(L[id], d + 1);
        rank[id] = ord++;
        walk(R[id], d + 1);
      }
      walk(root, 0);

      // ---- values assigned BY INORDER RANK, so the tree is a real BST -------
      const byRank = [];
      let v = 5 + Math.floor(rng() * 15);
      for (let i = 0; i < n; i++) { byRank.push(v); v += 2 + Math.floor(rng() * 7); }
      const val = new Array(n);
      let maxDepth = 0;
      for (let i = 0; i < n; i++) {
        val[i] = byRank[rank[i]];
        if (depth[i] > maxDepth) maxDepth = depth[i];
      }

      const baseNodes = [];
      for (let i = 0; i < n; i++) {
        baseNodes.push({ id: i, val: val[i], l: L[i], r: R[i], nx: (rank[i] + 0.5) / n, depth: depth[i] });
      }

      // ---- frame plumbing ---------------------------------------------------
      const MAXF = 190;
      const F = [];
      const visit = new Array(n).fill(-1);   // visit number, -1 = not yet
      const out = [];                        // emitted values, in order
      let front = [];                        // the literal queue / stack contents
      let stages = [];                       // postorder only: "L" | "R" | "E"
      let k = 0;

      function add(label, phase, cur, extra) {
        if (F.length >= MAXF) return;
        const e = extra || {};
        F.push({
          label: label,
          phase: phase,
          focus: (cur === null || cur === undefined || cur < 0) ? [] : [cur],
          state: {
            nodes: baseNodes.map(o => ({ id: o.id, val: o.val, l: o.l, r: o.r, nx: o.nx, depth: o.depth })),
            n: n,
            root: root,
            maxDepth: maxDepth,
            order: order,
            visit: visit.slice(),
            current: (cur === null || cur === undefined) ? -1 : cur,
            frontier: front.slice(),
            stages: stages.slice(),
            frontierKind: order === "level-order" ? "queue" : "stack",
            output: out.slice(),
            level: typeof e.level === "number" ? e.level : -1,
            hint: e.hint || ""
          }
        });
      }

      const sortedHint = "inorder on a BST ⇒ sorted output";

      if (order === "level-order") {
        front = [root];
        add("Level-order (BFS) uses a QUEUE, and FIFO is the entire reason nodes come out level by level. Start with only the root, " + val[root] + ".", "init", -1, { level: 0, hint: "queue = FIFO ⇒ shallowest first" });
        let level = 0;
        while (front.length > 0 && F.length < MAXF) {
          const sz = front.length;
          add("Level " + level + " begins: the queue holds exactly the " + sz + " node" + (sz === 1 ? "" : "s") + " of this level. Snapshot that size BEFORE the inner loop and you get per-level grouping for free.", "level", -1, { level: level, hint: "size = len(queue) — snapshot it" });
          for (let i = 0; i < sz && F.length < MAXF; i++) {
            const id = front.shift();
            visit[id] = k++;
            out.push(val[id]);
            add("Dequeue " + val[id] + " from the FRONT and visit it as #" + k + ". Every node of level " + level + " is dequeued before any node of level " + (level + 1) + ", because children only ever join at the BACK.", "visit", id, { level: level, hint: "shallowest node first" });
            const kids = [];
            if (L[id] >= 0) { front.push(L[id]); kids.push(String(val[L[id]])); }
            if (R[id] >= 0) { front.push(R[id]); kids.push(String(val[R[id]])); }
            if (kids.length > 0) {
              add("Enqueue " + val[id] + "'s child" + (kids.length === 1 ? "" : "ren") + " " + kids.join(" and ") + " at the BACK — they belong to level " + (level + 1) + " and must wait for the whole current level to drain.", "enqueue", id, { level: level, hint: "queue never spans >2 levels" });
            }
          }
          level++;
        }
        add("Done: " + out.length + " nodes in level order. Replace this queue with a stack and the very same loop becomes a depth-first traversal — that one data-structure choice IS the difference between BFS and DFS.", "done", -1, { hint: "queue→BFS, stack→DFS" });

      } else if (order === "preorder") {
        front = [root];
        add("Preorder = NODE, left, right. Iteratively that is a STACK: pop a node, emit it at once, then push RIGHT before LEFT so the left child sits on top.", "init", -1, { hint: "emit before recursing" });
        let guard = 0;
        while (front.length > 0 && F.length < MAXF && guard++ < 4 * n + 10) {
          const id = front.pop();
          visit[id] = k++;
          out.push(val[id]);
          add("Pop " + val[id] + " and emit it immediately as #" + k + ". Preorder commits to a node before it has looked at either subtree — which is exactly why it is the order you SERIALISE a tree in.", "visit", id, { hint: "root always arrives first" });
          const pushed = [];
          if (R[id] >= 0) { front.push(R[id]); pushed.push(val[R[id]] + " (right)"); }
          if (L[id] >= 0) { front.push(L[id]); pushed.push(val[L[id]] + " (left)"); }
          if (pushed.length > 0) {
            add("Push " + pushed.join(", then ") + ". LIFO means the LEFT child is now on top and gets explored first — matching the recursive order exactly.", "push", id, { hint: "push right first, pop left first" });
          }
        }
        add("Done: " + out.length + " nodes in preorder. This sequence plus null markers is enough to rebuild the tree in a single pass, because the root of every subtree is always the next unread token.", "done", -1, { hint: "preorder = serialisation order" });

      } else if (order === "inorder") {
        add("Inorder = left, NODE, right. Iteratively: dive as far LEFT as you can, pushing every node you pass; then pop, emit, and step RIGHT once.", "init", -1, { hint: sortedHint });
        let cur = root;
        let guard = 0;
        while ((cur >= 0 || front.length > 0) && F.length < MAXF && guard++ < 6 * n + 10) {
          while (cur >= 0 && F.length < MAXF) {
            front.push(cur);
            add("Push " + val[cur] + " and keep descending left. Nothing may be emitted while an unexplored left subtree still hangs below — the stack is just the list of ancestors we still owe a visit.", "descend", cur, { hint: "stack = ancestors owed a visit" });
            cur = L[cur];
          }
          if (front.length === 0) break;
          const id = front.pop();
          visit[id] = k++;
          out.push(val[id]);
          add("Left subtree of " + val[id] + " is exhausted, so pop and emit " + val[id] + " as #" + k + ". Watch the output row: it only ever grows to the right and never decreases.", "visit", id, { hint: sortedHint });
          cur = R[id];
        }
        add("Done. Inorder on a BST emits SORTED order — that is why 'validate a BST' is a one-liner with inorder: walk it and assert each value is strictly greater than the previous one. Same trick gives you the k-th smallest in O(h + k).", "done", -1, { hint: sortedHint });

      } else {
        front = [root];
        stages = ["L"];
        add("Postorder = left, right, NODE. A node may only be emitted once BOTH subtrees are finished, so each stack entry carries a flag for how far it has got (L → R → emit). Recursion stores that flag for you in the program counter.", "init", -1, { hint: "stack entry needs one extra bit" });
        let guard = 0;
        while (front.length > 0 && F.length < MAXF && guard++ < 6 * n + 10) {
          const top = front.length - 1;
          const id = front[top];
          if (stages[top] === "L") {
            stages[top] = "R";
            if (L[id] >= 0) {
              front.push(L[id]);
              stages.push("L");
              add(val[id] + " hands control to its LEFT child " + val[L[id]] + " and stays on the stack, flag now 'R' — it is parked, waiting on its right subtree.", "descend", L[id], { hint: "parent stays parked" });
            }
          } else if (stages[top] === "R") {
            stages[top] = "E";
            if (R[id] >= 0) {
              front.push(R[id]);
              stages.push("L");
              add("Left subtree of " + val[id] + " is finished; now its RIGHT child " + val[R[id]] + ". Still nothing emitted for " + val[id] + " — postorder is patient.", "descend", R[id], { hint: "both children before the parent" });
            }
          } else {
            front.pop();
            stages.pop();
            visit[id] = k++;
            out.push(val[id]);
            add("Both subtrees of " + val[id] + " are complete, so postorder emits " + val[id] + " as #" + k + ". A parent ALWAYS follows its children — that is why postorder is the order for freeing a tree, or for any bottom-up aggregate like height, subtree sum or diameter.", "visit", id, { hint: "children finish before the parent" });
          }
        }
        add("Done: the root is emitted last, always. Any computation that needs both children's answers before its own — height, diameter, max path sum — is a postorder traversal wearing a disguise.", "done", -1, { hint: "aggregate upwards" });
      }

      for (let i = 0; i < F.length; i++) yield F[i];
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;

      ctx.clearRect(0, 0, W, H);

      const padX = 22;
      const headerH = 46;
      const stripH = 30;
      const outH = 28;
      const bottomH = stripH + outH + 40;

      const treeTop = headerH + 12;
      const treeBot = H - bottomH;
      const treeH = Math.max(40, treeBot - treeTop);
      const rows = Math.max(1, S.maxDepth + 1);
      const rowH = treeH / rows;
      const colW = (W - padX * 2) / Math.max(1, S.n);
      const nodeR = Math.max(4, Math.min(15, Math.min(rowH * 0.34, colW * 0.46)));

      const nodes = S.nodes;
      const px = function (nd) { return padX + nd.nx * (W - padX * 2); };
      const py = function (nd) { return treeTop + (nd.depth + 0.5) * rowH; };

      const inFrontier = {};
      for (let i = 0; i < S.frontier.length; i++) inFrontier[S.frontier[i]] = i;

      // ---- edges -------------------------------------------------------------
      ctx.lineWidth = Math.max(1, nodeR * 0.14);
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i];
        const kids = [nd.l, nd.r];
        for (let j = 0; j < 2; j++) {
          const c = kids[j];
          if (c < 0) continue;
          const ch = nodes[c];
          const bothDone = S.visit[nd.id] >= 0 && S.visit[c] >= 0;
          ctx.strokeStyle = bothDone ? C.viz3 : C.border;
          ctx.globalAlpha = bothDone ? 0.75 : 1;
          ctx.beginPath();
          ctx.moveTo(px(nd), py(nd));
          ctx.lineTo(px(ch), py(ch));
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
      }

      // ---- nodes -------------------------------------------------------------
      const showVals = nodeR >= 9;
      for (let i = 0; i < nodes.length; i++) {
        const nd = nodes[i];
        const x = px(nd), y = py(nd);
        const isCur = nd.id === S.current;
        const isDone = S.visit[nd.id] >= 0;
        const isFront = inFrontier[nd.id] !== undefined;

        let fill = C.surface2;
        if (isCur) fill = C.viz1;
        else if (isDone) fill = C.viz3;
        else if (isFront) fill = C.viz4;

        ctx.beginPath();
        ctx.arc(x, y, nodeR, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();

        if (nd.id === S.root) {                 // viz7 = special / root
          ctx.strokeStyle = C.viz7;
          ctx.lineWidth = 2;
        } else {
          ctx.strokeStyle = C.border;
          ctx.lineWidth = 1;
        }
        ctx.stroke();

        if (showVals) {
          ctx.fillStyle = (isCur || isDone || isFront) ? C.text : C.text2;
          ctx.font = Math.round(nodeR * 0.95) + "px " + env.font.mono;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(nd.val), x, y + 0.5);
        }

        // visit number badge — identity is never colour alone
        if (isDone && nodeR >= 7) {
          ctx.fillStyle = C.text2;
          ctx.font = Math.round(Math.max(8, nodeR * 0.8)) + "px " + env.font.mono;
          ctx.textAlign = "left";
          ctx.textBaseline = "alphabetic";
          ctx.fillText(String(S.visit[nd.id] + 1), x + nodeR + 1, y - nodeR * 0.4);
        }
      }
      ctx.textBaseline = "alphabetic";

      // ---- root caption ------------------------------------------------------
      if (nodes.length > 0) {
        const rn = nodes[S.root];
        ctx.fillStyle = C.viz7;
        ctx.font = "10px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText("root", px(rn), py(rn) - nodeR - 5);
      }

      // ---- frontier strip: the literal queue / stack --------------------------
      const stripY = H - (stripH + outH + 26);
      const isQueue = S.frontierKind === "queue";
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.base;
      ctx.fillText(isQueue ? "queue  (front → back)" : "stack  (bottom → top)", padX, stripY - 5);

      const cellW = 34, cellGap = 4;
      const maxCells = Math.max(1, Math.floor((W - padX * 2) / (cellW + cellGap)));
      const shown = Math.min(S.frontier.length, maxCells);
      for (let i = 0; i < shown; i++) {
        const id = S.frontier[i];
        const x = padX + i * (cellW + cellGap);
        ctx.fillStyle = C.viz4;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.roundRect(x, stripY, cellW, stripH, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.text;
        ctx.font = "12px " + env.font.mono;
        ctx.textAlign = "center";
        ctx.fillText(String(nodes[id].val), x + cellW / 2, stripY + 15);
        const sg = S.stages[i];
        if (sg) {
          ctx.fillStyle = C.text2;
          ctx.font = "9px " + env.font.mono;
          ctx.fillText(sg === "L" ? "→left" : (sg === "R" ? "→right" : "emit"), x + cellW / 2, stripY + 26);
        }
      }
      if (S.frontier.length > shown) {
        ctx.fillStyle = C.muted;
        ctx.font = "11px " + env.font.mono;
        ctx.textAlign = "left";
        ctx.fillText("+" + (S.frontier.length - shown), padX + shown * (cellW + cellGap) + 2, stripY + 19);
      }
      if (S.frontier.length === 0) {
        ctx.fillStyle = C.muted;
        ctx.font = "12px " + env.font.mono;
        ctx.textAlign = "left";
        ctx.fillText("(empty)", padX, stripY + 19);
      } else {
        ctx.strokeStyle = C.viz4;
        ctx.lineWidth = 1;
        ctx.beginPath();
        if (isQueue) {                       // front marker on the left
          ctx.moveTo(padX - 8, stripY + stripH / 2);
          ctx.lineTo(padX - 2, stripY + stripH / 2);
        } else {                             // top marker on the right end
          const tx = padX + (shown - 1) * (cellW + cellGap) + cellW / 2;
          ctx.moveTo(tx, stripY - 3);
          ctx.lineTo(tx, stripY + 1);
        }
        ctx.stroke();
      }

      // ---- output row --------------------------------------------------------
      const outY = H - outH - 6;
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = "11px " + env.font.base;
      ctx.fillText("visit order", padX, outY - 4);
      ctx.font = "12px " + env.font.mono;
      let ox = padX + 74;
      ctx.fillStyle = C.viz3;
      for (let i = 0; i < S.output.length; i++) {
        const t = String(S.output[i]);
        const w = ctx.measureText(t).width;
        if (ox + w > W - padX - 20) { ctx.fillStyle = C.muted; ctx.fillText("…", ox, outY + 10); break; }
        ctx.fillText(t, ox, outY + 10);
        ox += w + 9;
      }

      // ---- header + legend ---------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = "13px " + env.font.base;
      ctx.fillText(S.order + "   ·   " + S.output.length + " / " + S.n + " visited", padX, 20);
      ctx.fillStyle = C.text2;
      ctx.font = "11px " + env.font.mono;
      ctx.fillText(S.hint || "", padX, 36);

      const legend = [
        [C.viz1, "current"],
        [C.viz4, isQueue ? "in queue" : "on stack"],
        [C.viz3, "visited (numbered)"],
        [C.viz7, "root"]
      ];
      let lx = W - padX;
      ctx.font = "10px " + env.font.base;
      for (let i = legend.length - 1; i >= 0; i--) {
        const t = legend[i][1];
        const w = ctx.measureText(t).width;
        lx -= w;
        ctx.fillStyle = C.text2;
        ctx.textAlign = "left";
        ctx.fillText(t, lx, 20);
        lx -= 8;
        ctx.fillStyle = legend[i][0];
        ctx.beginPath();
        ctx.arc(lx, 16, 4, 0, Math.PI * 2);
        ctx.fill();
        lx -= 14;
      }
    }
  },

  drill: {
    cards: [
      { q: "Preorder / inorder / postorder — what changes between them?", a: "Only *where* the node is touched relative to the two recursive calls. Preorder touches before both, inorder between them, postorder after both. The traversal shape is identical.", tags: ["dfs", "core"] },
      { q: "What does inorder traversal of a BST produce, and what does that buy you?", a: "Strictly increasing key order. It makes 'validate a BST' a walk that asserts each value > the previous one, and 'k-th smallest' an early-terminating inorder walk in O(h + k).", tags: ["bst", "inorder"] },
      { q: "Which traversal do you use to compute subtree sums, heights, or a tree's diameter?", a: "Postorder — you need both children's answers before you can compute the parent's. Same reason postorder is the order for freeing/deleting a tree.", tags: ["postorder", "aggregate"] },
      { q: "Why does level-order BFS need `size = len(queue)` snapshotted at the top of each round?", a: "Because children are appended to the same queue you are draining. At the top of the round the queue holds exactly one level, so popping precisely that many pops that level. Without the snapshot the size grows underneath you.", tags: ["bfs", "pitfall"] },
      { q: "Iterative preorder: which child do you push first, and why?", a: "Push the RIGHT child first. The stack is LIFO, so pushing right then left leaves the left child on top, and it pops first — matching the recursive order node, left, right.", tags: ["dfs", "iterative"] },
      { q: "Why is postorder the awkward one to write iteratively?", a: "A node is revisited twice, so each stack entry needs an extra bit recording whether the right subtree is done. Recursion keeps that in the program counter; iteratively you store a flag, a `lastVisited` pointer, or use reversed node-right-left preorder.", tags: ["postorder", "iterative"] },
      { q: "What is Morris traversal and what does it cost?", a: "An inorder walk in O(1) extra space: thread each node's inorder predecessor's right pointer back up to it, descend left, and cut the thread when you return. O(n) time amortised, but it temporarily mutates the tree.", tags: ["morris", "space"] },
      { q: "Reconstruct a tree from preorder + inorder — outline and complexity.", a: "preorder[0] is the root; its position in inorder splits the remaining nodes into left and right subtrees whose sizes slice the preorder array. Recurse. With a value→index hash map it is O(n); requires distinct values.", tags: ["reconstruction"] }
    ],
    sixtySecond: [
      "Explain how preorder, inorder and postorder differ with one code skeleton, and name the problem each one is the natural fit for.",
      "Explain level-order traversal, the level-size trick, and why the BFS queue never spans more than two adjacent levels.",
      "Explain how to write inorder iteratively with an explicit stack, and state what that stack is holding at any moment."
    ]
  }
};
