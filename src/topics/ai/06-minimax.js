export default {
  id: "minimax",
  track: "ai",
  title: "Minimax & Alpha-Beta",
  difficulty: 2,
  minutes: 18,
  tags: ["game-search", "minimax", "alpha-beta", "pruning"],

  explainer: [
    { type: "p", text: "Minimax computes the value of a position **under the assumption that both players play optimally**. You alternate levels: at a MAX node take the largest child value, at a MIN node take the smallest. The value that bubbles to the root is the game-theoretic value, and the child that produced it is the move to play. Nothing is heuristic about it in a solved game like tic-tac-toe — the numbers are the truth." },

    { type: "h3", text: "Alpha-beta: the only idea, stated once" },
    { type: "p", text: "Carry two bounds down the tree: `α` = the best value MAX can already guarantee somewhere above, `β` = the best MIN can already guarantee. The window `[α, β]` is the range of values that could still change the decision at the root. The moment `α ≥ β`, whatever this node returns is irrelevant — a parent already has a better option and will never route the game here — so you stop expanding siblings. **It never changes the answer**; it only skips work that provably cannot affect the answer." },

    { type: "callout", tone: "tip", text: "Say it as a *contract*, not as code: \"I'm exploring a MIN node with β already down to 0, and I've just found a child worth 1 for MAX. MAX would love that, so MIN will never enter this node — I can stop.\" Candidates who can narrate one concrete cutoff in those terms are treated very differently from those who recite `if beta <= alpha: break`." },

    { type: "h3", text: "Why move ordering is the whole ballgame" },
    { type: "list", items: [
      "Plain minimax visits `O(b^d)` nodes — branching factor `b`, depth `d`.",
      "With **perfect ordering** (best move first at every node), alpha-beta visits `O(b^{d/2})` — the square root. That is the same time budget buying **twice the search depth**, which in chess is worth several hundred Elo.",
      "With random ordering you get roughly `O(b^{3d/4})` — still a large win, but nothing like the best case.",
      "So real engines spend serious effort on ordering: the hash/transposition move first, then captures ordered by MVV-LVA, then killer moves, then history heuristic.",
      "**Iterative deepening** searches depth 1, 2, 3… and uses each shallow search's best move to order the next. The re-search cost is geometric and therefore almost free, and it gives you an anytime algorithm."
    ]},

    { type: "h3", text: "Real games can't reach terminal states" },
    { type: "p", text: "Tic-tac-toe's tree has 255,168 leaves — searchable. Chess has ~10⁴⁰ legal positions. So you cut off at a depth limit and call a **static evaluation function** instead of a terminal value. That introduces two classic bugs: the *horizon effect* (the search pushes a disaster just past the depth limit and calls the position fine — fixed with quiescence search, which extends captures until the position is quiet) and evaluation instability. Add a **transposition table** keyed by a Zobrist hash so positions reachable by different move orders are only searched once." },

    { type: "callout", tone: "pitfall", text: "Two things reliably go wrong in interviews. (1) Returning `±1` for a win with no depth term, so the engine sees no difference between mating now and mating in five and stalls — use `±(K − depth)` so it prefers fast wins and slow losses. (2) Forgetting that alpha-beta results are only exact when the search completes; a node cut off by the window returns a *bound*, not a value, which is why transposition entries must be tagged EXACT / LOWERBOUND / UPPERBOUND." },

    { type: "h3", text: "Beyond alpha-beta" },
    { type: "list", items: [
      "**Negamax** — one code path instead of two by using `−max(−v)` and negating at each level. Purely a simplification; same algorithm.",
      "**Expectimax** — replace MIN levels with expectation nodes when the opponent is stochastic (backgammon, 2048). Note that alpha-beta pruning does *not* apply directly, because an average has no upper bound until every child is seen.",
      "**MCTS** — sample rollouts and grow the tree towards promising lines via UCT; it needs no evaluation function and handles enormous branching factors, which is why Go fell to MCTS + a neural policy/value net, not to alpha-beta.",
      "**AlphaZero** — MCTS where the rollout is replaced by a value network and the prior by a policy network; the search is the policy improvement operator and the network is trained on its own search results."
    ]}
  ],

  complexity: {
    rows: [
      { operation: "Minimax", time: "O(b^d)", space: "O(b·d)", note: "d = plies, b = branching factor" },
      { operation: "Alpha-beta, best ordering", time: "O(b^(d/2))", space: "O(b·d)", note: "doubles reachable depth" },
      { operation: "Alpha-beta, random ordering", time: "≈O(b^(3d/4))", space: "O(b·d)", note: "still a large win" },
      { operation: "Transposition table", time: "cuts repeated subtrees", space: "O(entries)", note: "Zobrist hash; tag EXACT/LOWER/UPPER" },
      { operation: "Tic-tac-toe full tree", time: "255,168 leaves", space: "—", note: "5,478 distinct positions" }
    ]
  },

  interview: {
    whyAsked: "It is the classic recursion-plus-invariant question and doubles as the bridge from search to modern RL. Interviewers look for a clean recursive formulation, a correct statement of what α and β actually mean (not just the comparison), and the awareness that pruning changes the work but never the result. The follow-ups about move ordering and depth limits separate people who have implemented it from people who have watched a lecture.",
    followUps: [
      { q: "What exactly do α and β represent?", a: "α is the highest value MAX is already guaranteed on the path from the root to this node; β is the lowest value MIN is already guaranteed. Together they form the window of values that could still influence the root's decision. When α ≥ β the window is empty, so no value from this subtree can matter and you cut off." },
      { q: "Does alpha-beta ever change the result?", a: "No. It returns exactly the minimax value of the root. What it changes is which nodes get expanded — pruned subtrees are provably unable to affect the root, because a parent already has a move at least as good. If your pruned search gives a different answer, the bug is in bound propagation, not in the idea." },
      { q: "How much does move ordering matter?", a: "Everything. Perfect ordering gives O(b^{d/2}) versus O(b^d), which is the same as doubling search depth for free. Engines therefore order by transposition-table move, then captures (MVV-LVA), then killer and history moves, and use iterative deepening so each shallower search supplies the ordering for the next." },
      { q: "How do you handle games too large to search to the end?", a: "Cut off at a depth limit and call a static evaluation function. Then you must handle the horizon effect — the search hides a loss just beyond the limit — with quiescence search that keeps extending forcing moves until the position is quiet, plus iterative deepening so you always have a usable move when time runs out." },
      { q: "Why prefer faster wins?", a: "Score terminal nodes as `±(K − depth)` rather than `±1`. Otherwise every winning line has identical value, the engine has no reason to convert, and it will shuffle pieces forever in a won position. The same trick makes it prefer the *longest* losing line, which maximises the opponent's chance of erring." },
      { q: "Why did Go need MCTS instead of alpha-beta?", a: "Branching factor ~250 versus ~35, and no reliable hand-written evaluation function for a Go position. MCTS needs no evaluation — it estimates values by sampling — and concentrates its search on promising lines via UCT rather than expanding uniformly. AlphaGo/AlphaZero then replaced the random rollout with a learned value network and the uniform prior with a learned policy." }
    ]
  },

  code: [
    { lang: "python", label: "Minimax with alpha-beta (negamax-free, explicit)", code: "WIN_LINES = [(0,1,2),(3,4,5),(6,7,8),(0,3,6),(1,4,7),(2,5,8),(0,4,8),(2,4,6)]\n\ndef winner(b):\n    for i, j, k in WIN_LINES:\n        if b[i] and b[i] == b[j] == b[k]:\n            return b[i]                 # +1 (X) or -1 (O)\n    return 0\n\ndef minimax(board, player, alpha=-float('inf'), beta=float('inf'), depth=0):\n    \"\"\"player: +1 maximiser (X), -1 minimiser (O). Returns (value, move).\"\"\"\n    w = winner(board)\n    if w:                                # depth term -> prefer FAST wins\n        return w * (10 - depth), None\n    empties = [i for i, v in enumerate(board) if v == 0]\n    if not empties:\n        return 0, None\n\n    best_move = None\n    if player == 1:                                  # MAX node\n        best = -float('inf')\n        for m in empties:\n            board[m] = 1\n            val, _ = minimax(board, -1, alpha, beta, depth + 1)\n            board[m] = 0\n            if val > best:\n                best, best_move = val, m\n            alpha = max(alpha, best)\n            if alpha >= beta:\n                break                                # beta cutoff\n        return best, best_move\n    else:                                            # MIN node\n        best = float('inf')\n        for m in empties:\n            board[m] = -1\n            val, _ = minimax(board, 1, alpha, beta, depth + 1)\n            board[m] = 0\n            if val < best:\n                best, best_move = val, m\n            beta = min(beta, best)\n            if alpha >= beta:\n                break                                # alpha cutoff\n        return best, best_move\n\nprint(minimax([0]*9, 1))     # (0, 0) -> perfect play is a draw" },
    { lang: "python", label: "Negamax: one branch instead of two", code: "def negamax(board, player, alpha, beta, depth=0):\n    \"\"\"Value is ALWAYS from the side-to-move's point of view.\"\"\"\n    w = winner(board)\n    if w:\n        return -(10 - depth), None        # side to move just lost\n    empties = [i for i, v in enumerate(board) if v == 0]\n    if not empties:\n        return 0, None\n\n    best, best_move = -float('inf'), None\n    for m in empties:\n        board[m] = player\n        val, _ = negamax(board, -player, -beta, -alpha, depth + 1)\n        val = -val                        # flip the child's perspective\n        board[m] = 0\n        if val > best:\n            best, best_move = val, m\n        alpha = max(alpha, val)\n        if alpha >= beta:\n            break                         # a single cutoff test for both node types\n    return best, best_move" },
    { lang: "python", label: "Iterative deepening + move ordering", code: "import time\n\ndef search(board, player, max_depth, time_budget=1.0):\n    \"\"\"Anytime search: always has a best move; each pass orders the next.\"\"\"\n    t0, best_move, pv = time.time(), None, {}\n    for d in range(1, max_depth + 1):\n        val, best_move = minimax_ordered(board, player, d, pv, best_move)\n        pv[0] = best_move                 # principal variation seeds the next pass\n        if time.time() - t0 > time_budget:\n            break\n    return best_move\n\ndef order_moves(board, empties, player, pv_move=None):\n    def key(m):\n        if m == pv_move:      return -100          # try the PV move first\n        board[m] = player\n        immediate = winner(board) == player\n        board[m] = 0\n        if immediate:         return -50           # then immediate wins\n        return {4: -10, 0: -5, 2: -5, 6: -5, 8: -5}.get(m, 0)   # centre, corners\n    return sorted(empties, key=key)\n\n# Ordering is not a micro-optimisation: it moves alpha-beta from O(b^d)\n# towards O(b^(d/2)), i.e. it doubles the depth you can afford." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.1, maxFrames: 1200 },

    params: [
      { key: "position", label: "Position", type: "enum", options: ["O must hold (4 empty)", "X endgame (3 empty)", "X fork (5 empty)"], default: "O must hold (4 empty)" },
      { key: "mode", label: "Search", type: "enum", options: ["alpha-beta", "plain minimax"], default: "alpha-beta" },
      { key: "order", label: "Move ordering", type: "enum", options: ["natural", "best-first"], default: "natural" }
    ],

    frames: function* (params, rng) {
      const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
      const INF = 2;                                  // values live in {-1,0,1}
      const prune = params.mode !== "plain minimax";
      const bestFirst = params.order === "best-first";

      const POS = {
        "O must hold (4 empty)": { X: [0, 2, 8], O: [1, 4], turn: -1, note: "X owns two corners and the far corner; O to move must stop the 6-7-8 row." },
        "X endgame (3 empty)": { X: [0, 2, 4], O: [1, 3, 8], turn: 1, note: "Three squares left, X to move — a small tree you can verify by hand." },
        "X fork (5 empty)": { X: [4, 8], O: [0, 7], turn: 1, note: "X has two live lines through the centre; look for the double threat." }
      };
      const P = POS[params.position] || POS["O must hold (4 empty)"];

      const board0 = new Array(9).fill(0);
      for (let i = 0; i < P.X.length; i++) board0[P.X[i]] = 1;
      for (let i = 0; i < P.O.length; i++) board0[P.O[i]] = -1;

      const winnerOf = (b) => {
        for (let i = 0; i < LINES.length; i++) {
          const L = LINES[i];
          if (b[L[0]] !== 0 && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return b[L[0]];
        }
        return 0;
      };
      const winLine = (b) => {
        for (let i = 0; i < LINES.length; i++) {
          const L = LINES[i];
          if (b[L[0]] !== 0 && b[L[0]] === b[L[1]] && b[L[1]] === b[L[2]]) return L.slice();
        }
        return null;
      };
      const emptiesOf = (b) => { const e = []; for (let i = 0; i < 9; i++) if (b[i] === 0) e.push(i); return e; };
      const nameOf = (p) => (p === 1 ? "X" : "O");

      const orderMoves = (b, emp, turn) => {
        if (!bestFirst) return emp.slice();
        const rank = (m) => {
          const nb = b.slice(); nb[m] = turn;
          if (winnerOf(nb) === turn) return -100;                 // immediate win
          const ob = b.slice(); ob[m] = -turn;
          if (winnerOf(ob) === -turn) return -50;                 // block a loss
          if (m === 4) return -10;
          if (m === 0 || m === 2 || m === 6 || m === 8) return -5;
          return 0;
        };
        return emp.slice().sort((a, b2) => rank(a) - rank(b2) || a - b2);
      };

      // ---------------- build the full game tree (static) -------------------
      const tree = [];
      const build = (b, turn, parent, move, depth) => {
        const id = tree.length;
        const w = winnerOf(b);
        const emp = emptiesOf(b);
        const terminal = w !== 0 || emp.length === 0;
        tree.push({
          id: id, parent: parent, move: move, depth: depth, turn: turn,
          type: turn === 1 ? "max" : "min",
          terminal: terminal,
          termVal: terminal ? w : null,
          line: terminal && w !== 0 ? winLine(b) : null,
          board: b.slice(), children: [], x: 0
        });
        if (!terminal) {
          const order = orderMoves(b, emp, turn);
          for (let i = 0; i < order.length; i++) {
            const nb = b.slice();
            nb[order[i]] = turn;
            tree[id].children.push(build(nb, -turn, id, order[i], depth + 1));
          }
        }
        return id;
      };
      const root = build(board0, P.turn, -1, null, 0);

      let leaf = 0, maxDepth = 0;
      const layout = (id) => {
        const nd = tree[id];
        maxDepth = Math.max(maxDepth, nd.depth);
        if (!nd.children.length) { nd.x = leaf++; return; }
        for (let i = 0; i < nd.children.length; i++) layout(nd.children[i]);
        nd.x = (tree[nd.children[0]].x + tree[nd.children[nd.children.length - 1]].x) / 2;
      };
      layout(root);
      const leaves = Math.max(1, leaf);
      const TREE = tree.map((nd) => ({
        id: nd.id, parent: nd.parent, move: nd.move, depth: nd.depth, type: nd.type,
        terminal: nd.terminal, x: nd.x / Math.max(1, leaves - 1), children: nd.children.slice()
      }));

      // ---------------- search ---------------------------------------------
      const status = new Array(tree.length).fill(0);   // 0 unseen 1 active 2 done 3 pruned
      const value = new Array(tree.length).fill(null);
      const alphaA = new Array(tree.length).fill(null);
      const betaA = new Array(tree.length).fill(null);
      let path = [];
      let visited = 0, prunedCount = 0;

      const snap = (extra) => Object.assign({
        tree: TREE, maxDepth: maxDepth, leaves: leaves,
        status: status.slice(), value: value.slice(),
        alpha: alphaA.slice(), beta: betaA.slice(),
        path: path.slice(),
        board: tree[path.length ? path[path.length - 1] : root].board.slice(),
        line: tree[path.length ? path[path.length - 1] : root].line,
        visited: visited, prunedCount: prunedCount, total: tree.length,
        mode: prune ? "alpha-beta" : "minimax", order: bestFirst ? "best-first" : "natural",
        rootTurn: P.turn, best: null
      }, extra || {});

      const mark = (id, st) => {
        if (status[id] === 0) { status[id] = st; if (st === 3) prunedCount++; }
        const ch = tree[id].children;
        for (let i = 0; i < ch.length; i++) mark(ch[i], st);
      };

      const bnd = (v) => (v <= -INF ? "−∞" : v >= INF ? "+∞" : String(v));

      function* go(id, alpha, beta) {
        const nd = tree[id];
        status[id] = 1;
        alphaA[id] = alpha;
        betaA[id] = beta;
        path = path.concat([id]);
        visited++;

        if (nd.terminal) {
          const v = nd.termVal;
          value[id] = v;
          status[id] = 2;
          yield {
            label: v === 0
              ? `Depth ${nd.depth}: board is full with no line — terminal value 0 (draw).`
              : `Depth ${nd.depth}: ${nameOf(v)} completes ${nd.line.join("-")} — terminal value ${v > 0 ? "+1" : "−1"} (positive is good for X, the maximiser).`,
            phase: "terminal",
            focus: [id],
            state: snap({})
          };
          path = path.slice(0, -1);
          return v;
        }

        yield {
          label: `Enter ${nd.type.toUpperCase()} node at depth ${nd.depth} (${nameOf(nd.turn)} to move, ${nd.children.length} legal move${nd.children.length === 1 ? "" : "s"}). Window arrives as α=${bnd(alpha)}, β=${bnd(beta)}${prune ? " — only values strictly inside it can change the root's decision." : "."}`,
          phase: "enter",
          focus: [id],
          state: snap({})
        };

        let best = nd.type === "max" ? -INF : INF;
        let bestChild = null;

        for (let i = 0; i < nd.children.length; i++) {
          const cid = nd.children[i];
          const v = yield* go(cid, alpha, beta);
          const improved = nd.type === "max" ? v > best : v < best;
          if (improved) { best = v; bestChild = cid; }
          value[id] = best;

          if (nd.type === "max") {
            const oldA = alpha;
            alpha = Math.max(alpha, best);
            alphaA[id] = alpha;
            yield {
              label: `MAX (depth ${nd.depth}) got ${v > 0 ? "+" : ""}${v} from move ${tree[cid].move}. Best here is now ${best > 0 ? "+" : ""}${best}${alpha !== oldA ? `, so α rises ${bnd(oldA)} → ${bnd(alpha)} — MAX can now guarantee at least ${bnd(alpha)}.` : `; α stays ${bnd(alpha)}.`}`,
              phase: "update",
              focus: [id, cid],
              state: snap({})
            };
          } else {
            const oldB = beta;
            beta = Math.min(beta, best);
            betaA[id] = beta;
            yield {
              label: `MIN (depth ${nd.depth}) got ${v > 0 ? "+" : ""}${v} from move ${tree[cid].move}. Best here is now ${best > 0 ? "+" : ""}${best}${beta !== oldB ? `, so β falls ${bnd(oldB)} → ${bnd(beta)} — MIN can now hold MAX to at most ${bnd(beta)}.` : `; β stays ${bnd(beta)}.`}`,
              phase: "update",
              focus: [id, cid],
              state: snap({})
            };
          }

          if (prune && alpha >= beta && i < nd.children.length - 1) {
            const rest = nd.children.slice(i + 1);
            for (let k = 0; k < rest.length; k++) mark(rest[k], 3);
            yield {
              label: `CUTOFF: α=${bnd(alpha)} ≥ β=${bnd(beta)}. ${nd.type === "max" ? "MIN above already has an option worth ≤ " + bnd(beta) + ", so it will never let the game reach this node" : "MAX above already has an option worth ≥ " + bnd(alpha) + ", so it will never choose this node"} — the remaining ${rest.length} sibling${rest.length === 1 ? "" : "s"} cannot change the root's answer. Skip them entirely.`,
              phase: "prune",
              focus: [id],
              state: snap({})
            };
            break;
          }
        }

        value[id] = best;
        status[id] = 2;
        yield {
          label: `${nd.type.toUpperCase()} node at depth ${nd.depth} returns ${best > 0 ? "+" : ""}${best}${bestChild !== null ? ` via move ${tree[bestChild].move}` : ""}. This value now flows up to its parent.`,
          phase: "return",
          focus: [id],
          state: snap({})
        };
        path = path.slice(0, -1);
        return best;
      }

      yield {
        label: `${nameOf(P.turn)} to move, ${emptiesOf(board0).length} empty squares. ${P.note} Values are from X's point of view: +1 = X wins, 0 = draw, −1 = O wins. Full tree: ${tree.length} nodes.`,
        phase: "init",
        state: snap({})
      };

      const rootVal = yield* go(root, -INF, INF);

      let bestMove = null;
      const rc = tree[root].children;
      for (let i = 0; i < rc.length; i++) {
        if (value[rc[i]] === rootVal) { bestMove = tree[rc[i]].move; break; }
      }

      yield {
        label: `Root value = ${rootVal > 0 ? "+" : ""}${rootVal}${bestMove !== null ? `, best move = square ${bestMove}` : ""}. ${prune ? `Alpha-beta expanded ${visited} of ${tree.length} nodes and pruned ${prunedCount} — same answer, ${(tree.length / Math.max(1, visited)).toFixed(1)}× less work. Try 'best-first' ordering to prune harder.` : `Plain minimax expanded all ${visited} nodes. Switch to alpha-beta to see how many were provably irrelevant.`}`,
        phase: "done",
        state: snap({ best: bestMove })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const panelW = 196;
      const treeW = W - panelW - 26;
      const top = 46, bot = 26;
      const levels = s.maxDepth + 1;
      const rowH = (H - top - bot) / Math.max(1, levels);
      const nx = (nd) => 16 + nd.x * (treeW - 32);
      const ny = (nd) => top + nd.depth * rowH + rowH * 0.34;

      const nodeW = Math.max(9, Math.min(30, (treeW - 32) / Math.max(1, s.leaves) * 0.86));
      const nodeH = Math.min(18, rowH * 0.44);

      // ---------------- edges ----------------------------------------------
      for (let i = 0; i < s.tree.length; i++) {
        const nd = s.tree[i];
        if (nd.parent < 0) continue;
        const pnd = s.tree[nd.parent];
        const st = s.status[i];
        ctx.beginPath();
        ctx.moveTo(nx(pnd), ny(pnd) + nodeH / 2);
        ctx.lineTo(nx(nd), ny(nd) - nodeH / 2);
        if (st === 3) {
          ctx.strokeStyle = C.viz8;
          ctx.setLineDash([2, 3]);
          ctx.globalAlpha = 0.45;
          ctx.lineWidth = 1;
        } else if (st === 0) {
          ctx.strokeStyle = C.grid;
          ctx.globalAlpha = 0.7;
          ctx.lineWidth = 1;
        } else {
          const onPath = s.path.indexOf(i) >= 0;
          ctx.strokeStyle = onPath ? C.viz4 : C.axis;
          ctx.lineWidth = onPath ? 2 : 1;
          ctx.globalAlpha = 1;
        }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // ---------------- nodes ----------------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < s.tree.length; i++) {
        const nd = s.tree[i];
        const st = s.status[i];
        const x = nx(nd), y = ny(nd);
        const v = s.value[i];
        const onPath = s.path.indexOf(i) >= 0;

        let fill = C.surface;
        let stroke = C.border;
        if (st === 3) { fill = C.surface; stroke = C.viz8; }
        else if (st === 1) { fill = C.viz4; stroke = C.viz4; }
        else if (st === 2) { fill = nd.type === "max" ? C.viz1 : C.viz5; stroke = fill; }

        ctx.globalAlpha = st === 3 ? 0.35 : (st === 0 ? 0.55 : 1);
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = onPath ? 2 : 1;
        ctx.beginPath();
        if (nd.type === "max") {
          ctx.roundRect(x - nodeW / 2, y - nodeH / 2, nodeW, nodeH, 3);
        } else {
          ctx.roundRect(x - nodeW / 2, y - nodeH / 2, nodeW, nodeH, nodeH / 2);
        }
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        if (nodeW >= 15) {
          ctx.font = `${Math.min(10, nodeH * 0.72)}px ${env.font.mono}`;
          if (st === 3) {
            ctx.fillStyle = C.viz8;
            ctx.fillText("✕", x, y);
          } else if (v !== null && v !== undefined) {
            ctx.fillStyle = st === 2 || st === 1 ? C.surface : C.text;
            ctx.fillText(v > 0 ? "+1" : v < 0 ? "−1" : "0", x, y);
          } else if (nd.move !== null && nd.move !== undefined && nodeW >= 20) {
            ctx.fillStyle = C.muted;
            ctx.fillText(String(nd.move), x, y);
          }
        }

        // alpha/beta bounds on the current path (and shallow visited nodes)
        if ((onPath || (nd.depth <= 1 && st === 2)) && s.mode === "alpha-beta" && s.alpha[i] !== null && nodeW >= 14 && rowH > 30) {
          ctx.font = `8px ${env.font.mono}`;
          ctx.fillStyle = C.text2;
          const a = s.alpha[i] <= -2 ? "−∞" : String(s.alpha[i]);
          const b = s.beta[i] >= 2 ? "+∞" : String(s.beta[i]);
          ctx.fillText(`${a},${b}`, x, y + nodeH / 2 + 7);
        }
      }

      // ---------------- level labels ---------------------------------------
      ctx.textAlign = "left";
      ctx.font = `9px ${env.font.mono}`;
      for (let d = 0; d < levels; d++) {
        ctx.fillStyle = C.muted;
        ctx.fillText(d % 2 === (s.rootTurn === 1 ? 0 : 1) ? "MAX" : "MIN", 2, top + d * rowH + rowH * 0.34);
      }

      // ---------------- header ---------------------------------------------
      ctx.fillStyle = C.text;
      ctx.font = `12px ${env.font.base}`;
      ctx.fillText(`${s.mode}  ·  ${s.order} ordering`, 14, 20);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`expanded ${s.visited}/${s.total} nodes   pruned ${s.prunedCount}   squares = MAX, rounded = MIN`, 14, 36);

      // ---------------- right panel: board + stack --------------------------
      const bx = W - panelW - 8;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, 12, panelW, H - 24, 6);
      ctx.fill();
      ctx.stroke();

      const cw = 34, ox = bx + 14, oy = 34;
      ctx.textAlign = "left";
      ctx.font = `10px ${env.font.base}`;
      ctx.fillStyle = C.text2;
      ctx.fillText("position at the current node", bx + 12, 26);
      for (let i = 0; i < 9; i++) {
        const r = Math.floor(i / 3), c = i % 3;
        const x = ox + c * cw, y = oy + r * cw;
        const inLine = s.line && s.line.indexOf(i) >= 0;
        ctx.fillStyle = inLine ? C.viz3 : C.surface2;
        ctx.fillRect(x, y, cw - 3, cw - 3);
        ctx.strokeStyle = C.grid;
        ctx.strokeRect(x + 0.5, y + 0.5, cw - 4, cw - 4);
        const v = s.board[i];
        if (v !== 0) {
          ctx.fillStyle = inLine ? C.surface : (v === 1 ? C.viz1 : C.viz5);
          ctx.font = `18px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(v === 1 ? "X" : "O", x + (cw - 3) / 2, y + (cw - 3) / 2 + 1);
        } else {
          ctx.fillStyle = C.muted;
          ctx.font = `9px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i), x + (cw - 3) / 2, y + (cw - 3) / 2);
        }
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
      }

      // recursion stack with bounds
      let sy = oy + 3 * cw + 20;
      ctx.fillStyle = C.text2;
      ctx.font = `10px ${env.font.base}`;
      ctx.fillText("recursion stack (α, β)", bx + 12, sy);
      sy += 14;
      ctx.font = `10px ${env.font.mono}`;
      for (let i = 0; i < s.path.length && sy < H - 30; i++) {
        const id = s.path[i];
        const nd = s.tree[id];
        const a = s.alpha[id] === null ? "?" : (s.alpha[id] <= -2 ? "−∞" : String(s.alpha[id]));
        const b = s.beta[id] === null ? "?" : (s.beta[id] >= 2 ? "+∞" : String(s.beta[id]));
        ctx.fillStyle = i === s.path.length - 1 ? C.viz4 : C.muted;
        const vv = s.value[id];
        ctx.fillText(`d${nd.depth} ${nd.type === "max" ? "MAX" : "MIN"}  α=${a} β=${b}${vv !== null ? `  v=${vv > 0 ? "+" : ""}${vv}` : ""}`, bx + 12, sy);
        sy += 14;
      }

      if (s.best !== null && s.best !== undefined) {
        ctx.fillStyle = C.ok;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(`best move: square ${s.best}`, bx + 12, H - 18);
      }
    }
  },

  drill: {
    cards: [
      { q: "What do α and β mean?", a: "α = the best value MAX is already guaranteed on the path to this node; β = the best MIN is already guaranteed. `[α, β]` is the window of values that could still change the root's decision.", tags: ["core"] },
      { q: "When do you cut off, and why is it safe?", a: "When `α ≥ β`. A parent already has an option at least as good, so it will never route play into this subtree — its exact value cannot affect the root. The returned minimax value is unchanged.", tags: ["core"] },
      { q: "Complexity of minimax vs alpha-beta?", a: "O(b^d) vs O(b^{d/2}) with perfect move ordering — the square root, i.e. twice the search depth for the same time. Random ordering lands around O(b^{3d/4}).", tags: ["complexity"] },
      { q: "How do engines order moves?", a: "Transposition-table move first, then captures by MVV-LVA, then killer moves, then history heuristic — with iterative deepening feeding each pass's best move into the next.", tags: ["ordering"] },
      { q: "Why score terminals as ±(K − depth)?", a: "So the engine prefers faster wins and slower losses. With flat ±1 all winning lines look identical and the engine will shuffle in a won position forever.", tags: ["pitfall"] },
      { q: "What is the horizon effect?", a: "A depth-limited search pushes an unavoidable loss just past its cutoff and reports the position as fine. Fixed with quiescence search — keep extending forcing moves (captures, checks) until the position is quiet.", tags: ["pitfall"] },
      { q: "Why doesn't alpha-beta apply to expectimax?", a: "Chance nodes take an expectation, and an average has no bound until every child has been evaluated, so you cannot prove a sibling is irrelevant. Bounded utilities allow *-minimax variants, but not plain alpha-beta.", tags: ["variants"] },
      { q: "Why did Go need MCTS instead of alpha-beta?", a: "Branching ~250 and no reliable static evaluation. MCTS estimates values by sampling and concentrates search via UCT; AlphaZero then replaced rollouts with a value net and the prior with a policy net.", tags: ["modern"] }
    ],
    sixtySecond: [
      "Explain minimax and alpha-beta pruning, stating precisely what α and β mean and why pruning cannot change the answer.",
      "Explain why move ordering changes alpha-beta's complexity, and how iterative deepening helps you get it."
    ]
  }
};
