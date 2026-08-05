export default {
  id: "btree-index",
  track: "db",
  title: "B-Tree Indexes",
  difficulty: 2,
  minutes: 16,
  tags: ["indexes", "b-tree", "storage", "range-scan"],

  explainer: [
    { type: "p", text: "Every mainstream relational index is a **B+ tree**: a shallow, wide, self-balancing tree whose nodes are *disk pages* (8 KB in Postgres, 16 KB in InnoDB). All the actual keys live in the leaf level; internal nodes hold only separator keys and child pointers, so they act as a routing table. Leaves are linked left-to-right, which is what makes range scans cheap." },
    { type: "h3", text: "Why a B-tree and not a binary tree" },
    { type: "p", text: "A binary search tree over 100M rows is ~27 levels deep, and each level is potentially a random disk read. A B+ tree with a fanout of ~200 keys per page is `log₂₀₀(100M) ≈ 3.5` levels — three or four page reads, and the top two levels are permanently in the buffer cache. **Depth is the whole game**: the tree is optimised for the number of pages touched, not the number of comparisons." },
    { type: "list", items: [
      "**Fanout** = page size ÷ entry size. Wider keys mean lower fanout, a deeper tree, and more I/O — one concrete reason not to index a long text column.",
      "**Every leaf is at the same depth.** Balance is maintained by *splitting on the way up*, never by rotating.",
      "**Split**: when a page overflows, it is cut in half and a separator key is pushed into the parent. If the parent overflows, it splits too. If the root splits, the tree gains a level — the only way a B-tree grows taller.",
      "**Leaf links**: each leaf points to its right sibling, so `BETWEEN`, `>`, `ORDER BY id LIMIT 10` and index-only scans walk sideways with no re-descent."
    ]},
    { type: "h3", text: "What the index actually stores" },
    { type: "p", text: "In Postgres a leaf entry is `(key, ctid)` — the key plus a physical row pointer (page, offset); the heap is separate, so every index is a *secondary* index and a non-covered lookup costs an extra heap fetch. In InnoDB the primary key index **is** the table (clustered), and secondary indexes store `(key, primary key)`, so a secondary lookup does a second descent through the clustered index. That difference explains a lot of otherwise-mysterious performance advice." },
    { type: "callout", tone: "pitfall", text: "Random inserts (UUIDv4 primary keys) hit random leaves, splitting pages everywhere and leaving them ~50% full — the index bloats to roughly double its size and the write amplification is brutal. Monotonic keys (bigserial, ULID, UUIDv7) append to the rightmost leaf, which the engine special-cases with a cheap 'rightmost split' that fills pages ~90%." },
    { type: "callout", tone: "tip", text: "B-trees answer equality, range, prefix (`LIKE 'abc%'`), `IS NULL`, sorted output and MIN/MAX. They cannot answer leading-wildcard `LIKE '%abc'`, arbitrary containment, or a predicate wrapped in a function — `WHERE lower(email) = ?` needs an expression index on `lower(email)`." }
  ],

  complexity: {
    rows: [
      { operation: "Point lookup", time: "O(log_f n)", space: "O(1)", note: "f ≈ 200 fanout → 3–4 page reads at 100M rows" },
      { operation: "Range scan of k rows", time: "O(log_f n + k/f)", space: "O(1)", note: "one descent, then sequential leaf links" },
      { operation: "Insert", time: "O(log_f n)", space: "O(1) amortised", note: "split cost amortises to O(1) pages per insert" },
      { operation: "Delete", time: "O(log_f n)", space: "O(1)", note: "usually just marks dead; VACUUM/merge reclaims later" },
      { operation: "Index build", time: "O(n log n)", space: "O(n)", note: "sort-then-bulk-load, ~2–3× faster than n inserts" },
      { operation: "Space", time: "—", space: "O(n)", note: "~50–90% page fill depending on insert order" }
    ]
  },

  interview: {
    whyAsked: "It is the load-bearing data structure of every database on earth, and the answer reveals whether you think in terms of pages and I/O or in terms of abstract Big-O. The signal is whether you can connect fanout → depth → number of disk reads, and explain why range queries are cheap.",
    followUps: [
      { q: "Why B+ tree instead of a binary search tree or a hash index?", a: "Fanout. A node is a disk page holding hundreds of keys, so the tree is 3–4 levels deep instead of ~27, and each level is one page read. A hash index beats it for pure equality but supports no ranges, no ordering, and no prefix matching — and it degrades badly on resize. B+ trees also keep all data in linked leaves, making range scans sequential." },
      { q: "What happens on a page split, and why do random keys hurt?", a: "An overflowing page is split in half and a separator key is inserted into the parent, possibly cascading up; a root split adds a level. With random keys the splits land all over the index, leaving pages half-full — the index roughly doubles in size and every insert may dirty a random page. Monotonic keys append to the rightmost leaf, which engines special-case to fill pages ~90%." },
      { q: "Why is the leaf level linked?", a: "So a range query descends once to the lower bound and then walks sideways through the leaves in key order, reading sequential pages, instead of re-descending from the root per row. It is also what makes `ORDER BY indexed_col LIMIT n` free — the index already yields sorted rows." },
      { q: "What is a clustered index and how does Postgres differ from InnoDB?", a: "A clustered index stores the rows themselves in the leaves. InnoDB's primary key is clustered, so secondary indexes store the PK and a lookup costs a second descent — which is why a fat PK is expensive there. Postgres has no clustered index: the heap is separate, every index is secondary, and each match may need a heap fetch unless the index covers the query and the visibility map says the page is all-visible." },
      { q: "Why doesn't `WHERE lower(email) = 'x'` use the index on email?", a: "The index stores `email`, not `lower(email)`, and the engine cannot invert the function to translate the predicate into a key range. The fix is an expression index: `CREATE INDEX ON users (lower(email));` — or a case-insensitive collation. The general rule: wrapping an indexed column in a function makes the predicate non-sargable." },
      { q: "How deep is a B-tree over a billion rows?", a: "With a 8 KB page and ~16-byte entries, fanout is roughly 400, so depth ≈ log₄₀₀(10⁹) ≈ 3.5 — call it 4 levels. The root and most of the second level stay cached, so a point lookup is typically 1–2 actual disk reads. Doubling the row count adds a fraction of a level, which is why index lookups feel size-independent." }
    ]
  },

  code: [
    { lang: "sql", label: "Creating and inspecting", code: "-- B-tree is the default access method\nCREATE INDEX idx_orders_created ON orders (created_at);\n\n-- Build without blocking writes (takes longer, can leave an INVALID index)\nCREATE INDEX CONCURRENTLY idx_orders_created ON orders (created_at);\n\n-- Expression index: needed for function-wrapped predicates\nCREATE INDEX idx_users_lower_email ON users (lower(email));\n\n-- Partial index: only the rows you actually query, much smaller\nCREATE INDEX idx_orders_open ON orders (created_at)\n  WHERE status = 'open';\n\n-- Size and depth\nSELECT pg_size_pretty(pg_relation_size('idx_orders_created'));\nCREATE EXTENSION IF NOT EXISTS pageinspect;\nSELECT level, type, live_items\n  FROM bt_page_stats('idx_orders_created', 1);" },
    { lang: "sql", label: "Descent vs leaf walk in EXPLAIN", code: "EXPLAIN (ANALYZE, BUFFERS)\nSELECT id, created_at FROM orders\nWHERE created_at BETWEEN '2024-03-01' AND '2024-03-07'\nORDER BY created_at\nLIMIT 100;\n\n-- Index Only Scan using idx_orders_created on orders\n--   (cost=0.43..12.9 rows=98 width=12)\n--   (actual time=0.021..0.089 rows=100 loops=1)\n--   Index Cond: (created_at >= '2024-03-01' AND created_at <= '2024-03-07')\n--   Heap Fetches: 0\n--   Buffers: shared hit=5          <-- 3 pages of descent + 2 leaf pages\n-- Planning Time: 0.14 ms\n-- Execution Time: 0.11 ms\n--\n-- No Sort node: the leaf level is already in created_at order,\n-- so ORDER BY + LIMIT costs nothing extra." },
    { lang: "sql", label: "Insert-order effects you can measure", code: "-- Random UUIDs: every insert lands on a random leaf -> splits everywhere\nCREATE TABLE t_rand (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), pad text);\nINSERT INTO t_rand (pad) SELECT repeat('x', 40) FROM generate_series(1, 2000000);\n\n-- Monotonic keys: always appends to the rightmost leaf -> dense pages\nCREATE TABLE t_seq (id bigserial PRIMARY KEY, pad text);\nINSERT INTO t_seq (pad) SELECT repeat('x', 40) FROM generate_series(1, 2000000);\n\nSELECT relname, pg_size_pretty(pg_relation_size(oid))\nFROM pg_class WHERE relname LIKE 't_%_pkey';\n--  t_rand_pkey | 92 MB     <-- ~50-60% page fill after random splits\n--  t_seq_pkey  | 43 MB     <-- ~90% page fill\n\nREINDEX INDEX CONCURRENTLY t_rand_pkey;   -- rebuild packs it back down" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 400 },

    params: [
      { key: "n", label: "Keys to insert", type: "int", min: 6, max: 24, default: 14 },
      { key: "cap", label: "Keys per page", type: "enum", options: ["3", "4"], default: "3" },
      { key: "order", label: "Insert order", type: "enum", options: ["random", "ascending"], default: "random" },
      { key: "seed", label: "Reshuffle keys", type: "seed" }
    ],

    frames: function* (params, rng) {
      const CAP = params.cap === "4" ? 4 : 3;   // max keys per page before it splits
      const n = params.n;

      // ---- key set ---------------------------------------------------------
      const pool = [];
      for (let v = 10; v <= 99; v++) pool.push(v);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const t = pool[i]; pool[i] = pool[j]; pool[j] = t;
      }
      let keys = pool.slice(0, n);
      if (params.order === "ascending") keys = keys.slice().sort((a, b) => a - b);

      // ---- tree ------------------------------------------------------------
      let nextId = 1;
      const nodes = new Map();   // id -> { id, leaf, keys:[], kids:[], next }
      const mk = (leaf) => {
        const id = nextId++;
        nodes.set(id, { id: id, leaf: leaf, keys: [], kids: [], next: null });
        return id;
      };
      let rootId = mk(true);

      const snap = (extra) => {
        const arr = [];
        for (const nd of nodes.values()) {
          arr.push({ id: nd.id, leaf: nd.leaf, keys: nd.keys.slice(), kids: nd.kids.slice(), next: nd.next });
        }
        arr.sort((a, b) => a.id - b.id);
        const s = {
          nodes: arr,
          rootId: rootId,
          cap: CAP,
          path: extra && extra.path ? extra.path.slice() : [],
          active: extra && extra.active != null ? extra.active : null,
          hotKey: extra && extra.hotKey != null ? extra.hotKey : null,
          splitting: extra && extra.splitting ? extra.splitting.slice() : [],
          scan: extra && extra.scan ? extra.scan.slice() : [],
          scanRange: extra && extra.scanRange ? extra.scanRange.slice() : null,
          hits: extra && extra.hits ? extra.hits.slice() : [],
          pagesRead: extra && extra.pagesRead != null ? extra.pagesRead : 0,
          depth: (function () { let d = 1, id = rootId; while (!nodes.get(id).leaf) { id = nodes.get(id).kids[0]; d++; } return d; })(),
          inserted: extra && extra.inserted != null ? extra.inserted : 0,
          total: n,
          mode: extra && extra.mode ? extra.mode : "insert"
        };
        return s;
      };

      yield {
        label: `Empty index: one page, which is both the root and the only leaf. Every key we insert lands here until the page is full at ${CAP} keys.`,
        phase: "init",
        state: snap({ inserted: 0 })
      };

      const childIndexFor = (nd, k) => {
        let i = 0;
        while (i < nd.keys.length && k >= nd.keys[i]) i++;
        return i;
      };

      for (let ki = 0; ki < keys.length; ki++) {
        const k = keys[ki];
        // descend
        const path = [];
        let cur = rootId;
        while (true) {
          path.push(cur);
          const nd = nodes.get(cur);
          if (nd.leaf) break;
          const ci = childIndexFor(nd, k);
          yield {
            label: `Inserting ${k}: at internal page ${cur} with separators [${nd.keys.join(", ")}] — ${k} routes to child ${ci + 1} of ${nd.kids.length}. Internal pages hold no data, only routing keys.`,
            phase: "descend",
            state: snap({ path: path, active: cur, hotKey: k, inserted: ki, pagesRead: path.length })
          };
          cur = nd.kids[ci];
        }

        // insert into leaf
        const leaf = nodes.get(cur);
        const pos = leaf.keys.findIndex((x) => x > k);
        const at = pos === -1 ? leaf.keys.length : pos;
        leaf.keys = leaf.keys.slice(0, at).concat([k], leaf.keys.slice(at));
        yield {
          label: `Leaf page ${cur} now holds [${leaf.keys.join(", ")}] — ${leaf.keys.length}/${CAP} slots used. Keys inside a page are kept sorted so a binary search inside the page is possible.`,
          phase: "insert",
          state: snap({ path: path, active: cur, hotKey: k, inserted: ki + 1, pagesRead: path.length })
        };

        // split cascade
        let idx = path.length - 1;
        while (nodes.get(path[idx]).keys.length > CAP) {
          const nodeId = path[idx];
          const nd = nodes.get(nodeId);
          const mid = Math.floor(nd.keys.length / 2);
          let sepKey;
          const rightId = mk(nd.leaf);
          const right = nodes.get(rightId);

          if (nd.leaf) {
            sepKey = nd.keys[mid];                 // copied up: still lives in the right leaf
            right.keys = nd.keys.slice(mid);
            nd.keys = nd.keys.slice(0, mid);
            right.next = nd.next;
            nd.next = rightId;
          } else {
            sepKey = nd.keys[mid];                 // pushed up: leaves this level entirely
            right.keys = nd.keys.slice(mid + 1);
            right.kids = nd.kids.slice(mid + 1);
            nd.keys = nd.keys.slice(0, mid);
            nd.kids = nd.kids.slice(0, mid + 1);
          }

          if (idx === 0) {
            const newRootId = mk(false);
            const nr = nodes.get(newRootId);
            nr.keys = [sepKey];
            nr.kids = [nodeId, rightId];
            rootId = newRootId;
            yield {
              label: `Page ${nodeId} overflowed ${CAP} keys, so it split into ${nodeId} + ${rightId} and separator ${sepKey} had nowhere to go — a NEW ROOT is created. This is the only way a B-tree grows taller, and it is why every leaf stays at the same depth.`,
              phase: "split-root",
              state: snap({ path: path.slice(0, idx + 1), active: newRootId, hotKey: k, splitting: [nodeId, rightId], inserted: ki + 1 })
            };
          } else {
            const parentId = path[idx - 1];
            const par = nodes.get(parentId);
            const ci = par.kids.indexOf(nodeId);
            par.keys = par.keys.slice(0, ci).concat([sepKey], par.keys.slice(ci));
            par.kids = par.kids.slice(0, ci + 1).concat([rightId], par.kids.slice(ci + 1));
            yield {
              label: nd.leaf
                ? `Leaf ${nodeId} overflowed: split into [${nd.keys.join(", ")}] | [${right.keys.join(", ")}], separator ${sepKey} copied up into parent ${parentId}, and the sibling link ${nodeId} → ${rightId} is rewired so range scans still work.`
                : `Internal page ${nodeId} overflowed: split, and separator ${sepKey} is *pushed* up into parent ${parentId} (internal separators move, leaf separators are copied — the leaf keeps its own key).`,
              phase: "split",
              state: snap({ path: path.slice(0, idx + 1), active: parentId, hotKey: k, splitting: [nodeId, rightId], inserted: ki + 1 })
            };
          }
          idx--;
          if (idx < 0) break;
        }
      }

      const finalDepth = (function () { let d = 1, id = rootId; while (!nodes.get(id).leaf) { id = nodes.get(id).kids[0]; d++; } return d; })();
      yield {
        label: `${n} keys indexed in a tree of depth ${finalDepth}. Real pages hold ~200 keys, not ${CAP}: at fanout 200 this same shape addresses ${Math.pow(200, finalDepth).toExponential(1)} rows in ${finalDepth} page reads.`,
        phase: "built",
        state: snap({ inserted: n })
      };

      // ---- range scan ------------------------------------------------------
      const sortedKeys = keys.slice().sort((a, b) => a - b);
      const lo = sortedKeys[Math.floor(sortedKeys.length * 0.3)];
      const hi = sortedKeys[Math.min(sortedKeys.length - 1, Math.floor(sortedKeys.length * 0.75))];

      yield {
        label: `Now: SELECT * FROM users WHERE id BETWEEN ${lo} AND ${hi}. A B-tree answers this in two moves — descend to the lower bound, then walk the leaves.`,
        phase: "scan",
        state: snap({ mode: "scan", scanRange: [lo, hi], hotKey: lo })
      };

      const path = [];
      let cur = rootId;
      let pages = 0;
      while (true) {
        path.push(cur); pages++;
        const nd = nodes.get(cur);
        if (nd.leaf) {
          yield {
            label: `Reached leaf page ${cur} — that was ${pages} page read${pages === 1 ? "" : "s"} to find where ${lo} lives. No scan of the table, no comparison against non-matching rows.`,
            phase: "scan",
            state: snap({ mode: "scan", path: path, active: cur, scanRange: [lo, hi], pagesRead: pages, hotKey: lo })
          };
          break;
        }
        const ci = childIndexFor(nd, lo);
        yield {
          label: `Descending for lower bound ${lo}: page ${cur} separators [${nd.keys.join(", ")}] → take child ${ci + 1}. Only one child can contain ${lo}, so we discard the rest of the tree at every level.`,
          phase: "scan",
          state: snap({ mode: "scan", path: path, active: cur, scanRange: [lo, hi], pagesRead: pages, hotKey: lo })
        };
        cur = nd.kids[ci];
      }

      // walk leaves
      const hits = [];
      const visited = [];
      let leafId = cur;
      while (leafId != null) {
        const nd = nodes.get(leafId);
        visited.push(leafId);
        const inRange = nd.keys.filter((x) => x >= lo && x <= hi);
        for (const x of inRange) if (!hits.includes(x)) hits.push(x);
        pages++;
        const past = nd.keys.some((x) => x > hi);
        yield {
          label: past
            ? `Leaf ${leafId} contains a key above ${hi} — the walk stops here. Total: ${pages} pages read for ${hits.length} matching rows.`
            : `Leaf ${leafId} yields [${inRange.join(", ")}]; keys are already sorted, so results come out in order — this is why ORDER BY id LIMIT n is free on an indexed column. Follow the sibling link →`,
          phase: "scan",
          focus: hits.slice(),
          state: snap({ mode: "scan", scan: visited, active: leafId, scanRange: [lo, hi], hits: hits, pagesRead: pages })
        };
        if (past) break;
        leafId = nd.next;
      }

      yield {
        label: `Range scan done: ${hits.length} rows via ${pages} page reads (${path.length} descending + ${visited.length} leaf pages). A sequential scan would have touched every page of the table regardless of how few rows matched.`,
        phase: "done",
        state: snap({ mode: "scan", scan: visited, scanRange: [lo, hi], hits: hits, pagesRead: pages })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const byId = {};
      for (const nd of s.nodes) byId[nd.id] = nd;

      // ---- layout ------------------------------------------------------------
      const depthOf = {};
      const leafOrder = [];
      const stack = [[s.rootId, 0]];
      const seen = {};
      while (stack.length) {
        const top = stack.pop();
        const id = top[0], d = top[1];
        if (seen[id]) continue;
        seen[id] = 1;
        depthOf[id] = d;
        const nd = byId[id];
        if (!nd) continue;
        if (nd.leaf) leafOrder.push(id);
        else for (let i = nd.kids.length - 1; i >= 0; i--) stack.push([nd.kids[i], d + 1]);
      }
      // stack order reverses leaves; rebuild left-to-right with an explicit recursion
      leafOrder.length = 0;
      (function collect(id) {
        const nd = byId[id];
        if (!nd) return;
        if (nd.leaf) { leafOrder.push(id); return; }
        for (const k of nd.kids) collect(k);
      })(s.rootId);

      let maxD = 0;
      for (const k in depthOf) maxD = Math.max(maxD, depthOf[k]);

      // ---- scale the whole tree to fill the canvas, not just shrink to fit ---
      // Base unit sizes at scale 1; a uniform scale factor S is chosen from
      // whichever dimension (width or height) is tighter, then clamped so the
      // tree grows into empty space instead of sitting small at fixed size.
      const baseCellW = 26, baseCellH = 22, basePad = 6, baseGap = 16, baseLevelH = 40;
      const baseWidthOf = (id) => {
        const nd = byId[id];
        return Math.max(baseCellW, nd.keys.length * baseCellW) + basePad * 2;
      };
      let totalBaseLeafW = 0;
      for (const id of leafOrder) totalBaseLeafW += baseWidthOf(id) + baseGap;
      totalBaseLeafW -= baseGap;

      const marginX = 16;
      const avail = W - marginX * 2;
      const scaleW = avail / Math.max(1, totalBaseLeafW);

      const headerH = 54;
      const bottomMargin = 40;
      const availH = Math.max(60, H - headerH - bottomMargin);
      const scaleH = availH / (Math.max(1, maxD + 1) * baseLevelH);

      const S = Math.max(0.55, Math.min(3.4, Math.min(scaleW, scaleH)));

      const cellW = baseCellW * S, cellH = baseCellH * S, padIn = basePad * S, gapLeaf = baseGap * S;
      const widthOf = (id) => {
        const nd = byId[id];
        return Math.max(cellW, nd.keys.length * cellW) + padIn * 2;
      };

      let totalLeafW = 0;
      for (const id of leafOrder) totalLeafW += widthOf(id) + gapLeaf;
      totalLeafW -= gapLeaf;

      const cx = {};
      let x = marginX + Math.max(0, (avail - totalLeafW) / 2);
      for (const id of leafOrder) {
        const w = widthOf(id);
        cx[id] = x + w / 2;
        x += w + gapLeaf;
      }
      (function place(id) {
        const nd = byId[id];
        if (!nd || nd.leaf) return;
        let sum = 0;
        for (const k of nd.kids) { place(k); sum += cx[k]; }
        cx[id] = sum / Math.max(1, nd.kids.length);
      })(s.rootId);

      // Level spacing is deliberately decoupled from S: a shallow 2-level
      // tree has plenty of vertical room even when S is pinned by width, and
      // tying levelH to S alone left a big, centered gap above and below a
      // small-looking tree. Spread levels to use most of availH directly,
      // capped so very shallow trees don't stretch into silly gaps.
      const levelH = Math.max(cellH * 1.5, Math.min(340, availH / Math.max(1, maxD + 1)));
      const totalTreeH = maxD * levelH + cellH;
      const topOffset = headerH + Math.max(0, (availH - totalTreeH) / 2);
      const yOf = (d) => topOffset + d * levelH;

      // ---- edges -------------------------------------------------------------
      ctx.lineWidth = 1;
      for (const nd of s.nodes) {
        if (nd.leaf) continue;
        const px = cx[nd.id], py = yOf(depthOf[nd.id]) + cellH;
        for (const k of nd.kids) {
          if (cx[k] == null) continue;
          const onPath = s.path.indexOf(nd.id) >= 0 && s.path.indexOf(k) >= 0;
          ctx.strokeStyle = onPath ? C.viz1 : C.border;
          ctx.lineWidth = onPath ? 2 : 1;
          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.bezierCurveTo(px, py + levelH * 0.4, cx[k], yOf(depthOf[k]) - levelH * 0.3, cx[k], yOf(depthOf[k]));
          ctx.stroke();
        }
      }

      // ---- leaf sibling links -------------------------------------------------
      for (let i = 0; i < leafOrder.length; i++) {
        const id = leafOrder[i];
        const nd = byId[id];
        if (nd.next == null || cx[nd.next] == null) continue;
        const y = yOf(depthOf[id]) + cellH / 2;
        const x0 = cx[id] + widthOf(id) / 2;
        const x1 = cx[nd.next] - widthOf(nd.next) / 2;
        const walked = s.scan.indexOf(id) >= 0 && s.scan.indexOf(nd.next) >= 0;
        ctx.strokeStyle = walked ? C.viz3 : C.axis;
        ctx.lineWidth = walked ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(x0 + 2 * S, y); ctx.lineTo(x1 - 6 * S, y);
        ctx.stroke();
        ctx.fillStyle = walked ? C.viz3 : C.axis;
        ctx.beginPath();
        ctx.moveTo(x1 - 6 * S, y - 3.5 * S); ctx.lineTo(x1 - 1 * S, y); ctx.lineTo(x1 - 6 * S, y + 3.5 * S);
        ctx.closePath(); ctx.fill();
      }

      // ---- nodes --------------------------------------------------------------
      const keyFontPx = Math.max(10, Math.round(11 * Math.min(S, 2.6)));
      const idFontPx = Math.max(9, Math.round(9 * Math.min(S, 2.4)));
      const cellRadius = Math.max(3, 4 * Math.min(S, 2));
      const textDy = cellH * 0.68;
      const idDy = Math.max(4, 4 * S);

      for (const nd of s.nodes) {
        if (cx[nd.id] == null) continue;
        const w = widthOf(nd.id);
        const nx = cx[nd.id] - w / 2;
        const ny = yOf(depthOf[nd.id]);
        const isActive = s.active === nd.id;
        const onPath = s.path.indexOf(nd.id) >= 0;
        const isSplit = s.splitting.indexOf(nd.id) >= 0;
        const scanned = s.scan.indexOf(nd.id) >= 0;

        ctx.fillStyle = C.surface2;
        ctx.beginPath();
        ctx.roundRect(nx, ny, w, cellH, cellRadius);
        ctx.fill();
        ctx.strokeStyle = isSplit ? C.viz2 : isActive ? C.viz1 : scanned ? C.viz3 : onPath ? C.viz1 : C.border;
        ctx.lineWidth = (isSplit || isActive || scanned ? 2 : 1) * Math.min(S, 1.8);
        ctx.beginPath();
        ctx.roundRect(nx + 0.5, ny + 0.5, w - 1, cellH - 1, cellRadius);
        ctx.stroke();

        const kw = (w - padIn * 2) / Math.max(1, nd.keys.length);
        ctx.font = `${keyFontPx}px ${env.font.mono}`;
        ctx.textAlign = "center";
        for (let i = 0; i < nd.keys.length; i++) {
          const k = nd.keys[i];
          const kx = nx + padIn + kw * (i + 0.5);
          const inRange = s.scanRange && k >= s.scanRange[0] && k <= s.scanRange[1] && nd.leaf;
          const isHit = nd.leaf && s.hits.indexOf(k) >= 0;
          if (isHit) {
            ctx.fillStyle = C.viz3;
            ctx.globalAlpha = 0.28;
            ctx.fillRect(kx - kw / 2 + 1, ny + 2, kw - 2, cellH - 4);
            ctx.globalAlpha = 1;
          } else if (k === s.hotKey) {
            ctx.fillStyle = C.viz2;
            ctx.globalAlpha = 0.3;
            ctx.fillRect(kx - kw / 2 + 1, ny + 2, kw - 2, cellH - 4);
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = isHit ? C.viz3 : k === s.hotKey ? C.viz2 : inRange ? C.text : nd.leaf ? C.text2 : C.viz7;
          ctx.fillText(String(k), kx, ny + textDy);
        }
        if (nd.keys.length === 0) {
          ctx.fillStyle = C.muted;
          ctx.fillText("·", cx[nd.id], ny + textDy);
        }
        // page id + fill
        ctx.font = `${idFontPx}px ${env.font.mono}`;
        ctx.fillStyle = C.muted;
        ctx.textAlign = "left";
        ctx.fillText(`p${nd.id}${nd.leaf ? "" : " ·sep"}`, nx, ny - idDy);
        if (nd.leaf) {
          ctx.textAlign = "right";
          ctx.fillText(`${nd.keys.length}/${s.cap}`, nx + w, ny - idDy);
        }
      }

      // ---- header -------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      const title = s.mode === "scan"
        ? `Range scan: id BETWEEN ${s.scanRange ? s.scanRange[0] : ""} AND ${s.scanRange ? s.scanRange[1] : ""}`
        : `Building the index — ${s.inserted}/${s.total} keys inserted`;
      ctx.fillText(title, 16, 22);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(
        `depth ${s.depth}   ·   max ${s.cap} keys/page   ·   pages read ${s.pagesRead}` +
        (s.mode === "scan" ? `   ·   rows matched ${s.hits.length}` : ""),
        16, 40
      );

      // legend
      ctx.textAlign = "right";
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz7;
      ctx.fillText("separator key", W - 16, 22);
      ctx.fillStyle = C.viz2;
      ctx.fillText("key being inserted / split", W - 16, 36);
      ctx.fillStyle = C.viz3;
      ctx.fillText("leaf walk + matched rows", W - 16, 50);

      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("leaves are linked left→right — that link is what makes BETWEEN, > and ORDER BY cheap", 16, H - 8);
    }
  },

  drill: {
    cards: [
      { q: "Why a B+ tree instead of a binary search tree for on-disk indexes?", a: "Fanout: a node is a page holding hundreds of keys, so depth is ~log₂₀₀(n) ≈ 3–4 instead of ~27. Cost is measured in page reads, not comparisons.", tags: ["fanout"] },
      { q: "Where do the actual keys live in a B+ tree?", a: "Only in the leaves. Internal nodes hold separator keys and child pointers — they are a routing table.", tags: ["structure"] },
      { q: "What happens when a page overflows?", a: "It splits in half and a separator is inserted into the parent, cascading upward. A root split adds a level — the only way the tree gets taller, which is why all leaves stay at the same depth.", tags: ["split"] },
      { q: "Why do random UUID primary keys bloat an index?", a: "Inserts hit random leaves, splitting pages everywhere and leaving them ~50% full (vs ~90% for monotonic keys), roughly doubling index size and dirtying random pages on every write.", tags: ["pitfall"] },
      { q: "Why is a range scan cheap?", a: "One descent to the lower bound, then the linked leaf level is walked sequentially in key order. No re-descent, and the output is already sorted.", tags: ["range"] },
      { q: "Clustered vs non-clustered — Postgres vs InnoDB?", a: "InnoDB clusters rows in the PK index; secondary indexes store the PK, so a lookup needs a second descent. Postgres keeps a separate heap: every index is secondary and a match may need a heap fetch unless the scan is index-only.", tags: ["storage"] },
      { q: "Why doesn't `WHERE lower(email)='x'` use an index on `email`?", a: "The index keys are `email`, and the engine can't invert the function into a key range. Create an expression index on `lower(email)`.", tags: ["sargability"] },
      { q: "Which predicates can a B-tree not serve?", a: "Leading-wildcard LIKE ('%abc'), arbitrary containment/full-text, and any column wrapped in a non-indexed function. Those need GIN/GiST, trigram, or expression indexes.", tags: ["limits"] }
    ],
    sixtySecond: [
      "Explain why a B+ tree is the right structure for a disk-based index, connecting fanout to depth to number of I/Os.",
      "Walk through what happens on a page split and why insert order changes the size of the resulting index."
    ]
  }
};
