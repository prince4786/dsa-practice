export default {
  id: "join-algorithms",
  track: "db",
  title: "Nested-Loop / Hash / Merge Joins",
  difficulty: 2,
  minutes: 16,
  tags: ["joins", "planner", "hash-join", "sort-merge"],

  explainer: [
    { type: "p", text: "There are exactly three ways to join two relations, and every database implements all three because each wins in a different regime. Knowing which one the planner picked — and why — is the difference between a 3 ms query and a 30 s query on identical data." },
    { type: "h3", text: "Nested loop" },
    { type: "p", text: "For every row of the outer relation, look at every row of the inner. `O(R × S)` comparisons — catastrophic on two large tables. But with an **index on the inner join column** it becomes `O(R × log S)`: for each outer row you do one index seek. That is the plan you want when the outer side is small (a few rows after filtering) and the inner side is indexed. It is also the only algorithm that can produce the first row immediately, so it wins under `LIMIT`, and the only one that supports non-equality join conditions such as `ON a.ts BETWEEN b.start AND b.end`." },
    { type: "h3", text: "Hash join" },
    { type: "p", text: "Build an in-memory hash table on the **smaller** relation keyed by the join column, then stream the larger relation through it, probing once per row. `O(R + S)` — the workhorse for large equi-joins in analytics. Costs: it needs memory (`work_mem`); if the build side does not fit it spills to disk in partitions (a *grace* / hybrid hash join, visible in Postgres as `Batches: 8` instead of 1); it produces no output until the build side is fully read; and it only works for **equality** predicates." },
    { type: "h3", text: "Sort-merge join" },
    { type: "p", text: "Sort both sides by the join key, then walk them with two cursors like merging two sorted lists — `O(R log R + S log S)`, or just `O(R + S)` if both inputs are **already sorted**, which is exactly what happens when both sides come off B-tree indexes on the join key. It also emits rows in sorted order, so a downstream `ORDER BY` or merge-based aggregate is free. Its weakness is duplicates on both sides: the merge must rewind the inner cursor, and with heavy duplication it degrades toward the nested-loop cost." },
    { type: "callout", tone: "tip", text: "The one-liner that lands: *nested loop when one side is tiny and the other is indexed; hash when both are big and the join is equality; merge when both inputs already arrive sorted or the output needs to be sorted.*" },
    { type: "h3", text: "Where plans go wrong in production" },
    { type: "list", items: [
      "**Row misestimate** → the planner thinks the outer side has 5 rows, picks a nested loop, and actually gets 500 000. This is the single most common cause of a query that was fast for a year and then wasn't. `EXPLAIN ANALYZE` shows `rows=5 ... actual rows=500000`.",
      "**Hash spill** → `Batches: 32` and a hot temp directory. Raise `work_mem` for that query, or reduce the build side with an earlier filter.",
      "**Join order** matters more than join algorithm: joining the two most selective relations first keeps every intermediate result small. Postgres searches join orders exhaustively up to `geqo_threshold` (12 relations) and then switches to a genetic algorithm.",
      "**Correlated columns** break the independence assumption: `WHERE city='Paris' AND country='FR'` is estimated as `sel(city) × sel(country)`, which is wildly low. Fix with `CREATE STATISTICS ... (dependencies)`."
    ]},
    { type: "callout", tone: "pitfall", text: "A hash join cannot serve `ON a.x < b.y`, and neither can a merge join in most engines. If your plan shows a nested loop over two big tables, check whether an accidental inequality (or a `LIKE`, or a function on the join key) forced it — that is a classic cross-join-in-disguise." }
  ],

  complexity: {
    rows: [
      { operation: "Nested loop", time: "O(R × S)", space: "O(1)", note: "any join predicate; streams first row immediately" },
      { operation: "Nested loop + inner index", time: "O(R × log S)", space: "O(1)", note: "best when R is small after filtering" },
      { operation: "Hash join", time: "O(R + S)", space: "O(min(R,S))", note: "equality only; build side must fit work_mem or it spills" },
      { operation: "Sort-merge join", time: "O(R log R + S log S)", space: "O(R + S)", note: "O(R+S) if both inputs already sorted; output is sorted" },
      { operation: "Merge on pre-sorted indexes", time: "O(R + S)", space: "O(1)", note: "no sort node in EXPLAIN — inputs stream from B-trees" },
      { operation: "Hash join with spill", time: "O(R + S) + 2×I/O", space: "O(work_mem)", note: "Batches > 1 in EXPLAIN; each batch written and re-read" }
    ]
  },

  interview: {
    whyAsked: "It is the cleanest test of whether a candidate reasons about physical execution and cost, not just SQL syntax. The signal is whether you can name the regime where each algorithm wins and connect a bad plan back to a bad cardinality estimate.",
    followUps: [
      { q: "When would the planner choose a nested loop over a hash join?", a: "When the outer side is small after filtering and the inner side has an index on the join key, so each outer row costs one cheap seek. Also when a LIMIT means only a few rows are needed (nested loop streams; hash must build first), and always when the predicate is not an equality — hash and merge require equi-joins." },
      { q: "Which side does a hash join build on, and what happens when it doesn't fit in memory?", a: "The estimated-smaller side, because the hash table must be held in memory. If it exceeds work_mem the join goes multi-batch: both inputs are partitioned by hash to temp files and each partition is joined separately. EXPLAIN shows `Batches: N > 1` and the extra I/O usually doubles the time or worse — raise work_mem for that query or filter the build side earlier." },
      { q: "Why can a merge join be free?", a: "If both inputs are already sorted on the join key — typically because they stream out of B-tree indexes on that key — there is no sort node at all and the merge is a single linear pass. It also emits sorted output, which can eliminate a downstream ORDER BY or feed a merge-based GROUP BY." },
      { q: "A query got slow after a data-volume change. Where do you look first?", a: "`EXPLAIN (ANALYZE, BUFFERS)` and compare estimated vs actual rows on every node. A nested loop whose outer estimate was 5 and whose actual is 500 000 is the classic failure: the plan was chosen for a shape that no longer exists. Fix the estimate — run ANALYZE, raise the statistics target, add extended statistics for correlated columns — before you touch the query." },
      { q: "How does the planner choose join *order*?", a: "It enumerates orders (dynamic programming over subsets, up to geqo_threshold relations, then a genetic search) and costs each one using cardinality estimates. The goal is to keep intermediate results small, so the most selective joins go first. Bad estimates poison this globally, which is why a single misestimated predicate can produce a bizarre plan." },
      { q: "What is an anti-join and how is it executed?", a: "`NOT EXISTS` / `LEFT JOIN ... WHERE r.id IS NULL` — return outer rows with no match. Postgres executes it as a Hash Anti Join or Merge Anti Join, stopping at the first match per outer row. Prefer `NOT EXISTS` over `NOT IN`: with a NULL in the subquery, `NOT IN` returns no rows at all, and it often blocks the anti-join optimisation." }
    ]
  },

  code: [
    { lang: "sql", label: "Reading the three plans", code: "EXPLAIN (ANALYZE, BUFFERS)\nSELECT c.name, o.amount\nFROM   orders o JOIN customers c ON c.id = o.customer_id\nWHERE  o.created_at >= now() - interval '1 day';\n\n-- (a) small outer + indexed inner  -> nested loop\n-- Nested Loop  (cost=0.43..91.2 rows=12 width=36)\n--   ->  Index Scan using idx_orders_created on orders o  (rows=12)\n--   ->  Index Scan using customers_pkey on customers c   (rows=1 loops=12)\n--         Index Cond: (id = o.customer_id)\n\n-- (b) both sides large -> hash join, build on the smaller side\n-- Hash Join  (cost=140.5..7412.9 rows=910000 width=36)\n--   Hash Cond: (o.customer_id = c.id)\n--   ->  Seq Scan on orders o  (rows=910000)\n--   ->  Hash  (rows=5000)  Buckets: 8192  Batches: 1  Memory Usage: 320kB\n--         ->  Seq Scan on customers c  (rows=5000)\n\n-- (c) both inputs already sorted by the join key -> merge join, no Sort node\n-- Merge Join  (cost=0.85..6120.4 rows=910000 width=36)\n--   Merge Cond: (o.customer_id = c.id)\n--   ->  Index Scan using idx_orders_customer on orders o\n--   ->  Index Scan using customers_pkey on customers c" },
    { lang: "sql", label: "Diagnosing a bad join plan", code: "-- The tell: estimated 5 rows, actually got 500k, and the planner\n-- built a nested loop around it.\n--   ->  Nested Loop  (cost=.. rows=5 ..) (actual .. rows=498211 loops=1)\n\nANALYZE orders;                       -- refresh stats first, always\nALTER TABLE orders ALTER COLUMN customer_id SET STATISTICS 1000;\n\n-- Correlated columns: sel(city) * sel(country) is far too low\nCREATE STATISTICS stat_city_country (dependencies, ndistinct)\n  ON city, country FROM addresses;\nANALYZE addresses;\n\n-- Give the hash join enough memory instead of spilling to disk\n-- (Batches: 32 in EXPLAIN means 31 extra round-trips to temp files)\nSET LOCAL work_mem = '128MB';\n\n-- Last resort, for diagnosis only -- never leave these in production code:\nSET LOCAL enable_nestloop = off;      -- confirm the alternative is faster\nEXPLAIN ANALYZE SELECT ...;\nRESET enable_nestloop;" },
    { lang: "sql", label: "Anti-join: NOT EXISTS vs NOT IN", code: "-- Customers with no orders.\n-- GOOD: planner turns this into a Hash Anti Join, NULL-safe.\nSELECT c.id, c.name\nFROM   customers c\nWHERE  NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);\n\n-- TRAP: if any orders.customer_id is NULL, this returns ZERO rows,\n-- because `x NOT IN (1, NULL)` evaluates to UNKNOWN, never TRUE.\nSELECT c.id FROM customers c\nWHERE  c.id NOT IN (SELECT o.customer_id FROM orders o);\n\n-- Also fine, and readable, but materialises the outer join first:\nSELECT c.id\nFROM   customers c\nLEFT JOIN orders o ON o.customer_id = c.id\nWHERE  o.id IS NULL;" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.6, maxFrames: 400 },

    params: [
      { key: "algo", label: "Algorithm", type: "enum", options: ["nested-loop", "nested-loop + index", "hash", "sort-merge"], default: "hash" },
      { key: "rN", label: "orders rows (R)", type: "int", min: 6, max: 16, default: 11 },
      { key: "sN", label: "customers rows (S)", type: "int", min: 3, max: 8, default: 6 },
      { key: "seed", label: "Regenerate data", type: "seed" }
    ],

    frames: function* (params, rng) {
      const NAMES = ["Ana", "Ben", "Cleo", "Dev", "Eve", "Finn", "Gus", "Hana"];
      const sN = params.sN, rN = params.rN;
      const algo = params.algo;

      const customers = [];
      for (let i = 0; i < sN; i++) customers.push({ id: i + 1, name: NAMES[i % NAMES.length] });
      const orders = [];
      for (let i = 0; i < rN; i++) {
        orders.push({
          id: 100 + i,
          cust: 1 + Math.floor(rng() * sN),
          amount: 20 + Math.floor(rng() * 40) * 5
        });
      }

      const NB = 4;   // hash buckets
      const hashOf = (k) => k % NB;

      let comparisons = 0;
      let output = [];
      let buckets = [];
      for (let b = 0; b < NB; b++) buckets.push([]);

      const snap = (extra) => ({
        algo: algo,
        orders: orders.map((o) => ({ id: o.id, cust: o.cust, amount: o.amount })),
        customers: customers.map((c) => ({ id: c.id, name: c.name })),
        outerOrder: extra.outerOrder ? extra.outerOrder.slice() : orders.map((_, i) => i),
        innerOrder: extra.innerOrder ? extra.innerOrder.slice() : customers.map((_, i) => i),
        oi: extra.oi != null ? extra.oi : -1,
        ii: extra.ii != null ? extra.ii : -1,
        comparisons: comparisons,
        output: output.slice(-10),
        outputCount: output.length,
        buckets: buckets.map((b) => b.slice()),
        activeBucket: extra.activeBucket != null ? extra.activeBucket : -1,
        hit: !!extra.hit,
        miss: !!extra.miss,
        stage: extra.stage || "",
        rN: rN, sN: sN, nb: NB,
        worstCase: rN * sN
      });

      const emit = (oIdx, cIdx) => {
        output = output.concat([{ o: orders[oIdx].id, c: customers[cIdx].id, name: customers[cIdx].name, amount: orders[oIdx].amount }]);
      };

      yield {
        label: `Joining orders (R = ${rN} rows) with customers (S = ${sN} rows) ON orders.cust = customers.id, using a ${algo} join. Watch the comparison counter — that is what the planner is costing.`,
        phase: "setup",
        state: snap({ stage: "setup" })
      };

      // ---------------- NESTED LOOP -----------------------------------------
      if (algo === "nested-loop") {
        for (let i = 0; i < rN; i++) {
          for (let j = 0; j < sN; j++) {
            comparisons++;
            const hit = orders[i].cust === customers[j].id;
            if (hit) emit(i, j);
            yield {
              label: hit
                ? `orders#${orders[i].id}.cust=${orders[i].cust} = customers#${customers[j].id} → emit (${customers[j].name}, ${orders[i].amount}). Comparison ${comparisons} of at most R×S = ${rN * sN}.`
                : `orders#${orders[i].id}.cust=${orders[i].cust} ≠ customers#${customers[j].id} — no index, so the inner side is re-scanned in full for every single outer row.`,
              phase: "scan",
              focus: [i, j],
              state: snap({ oi: i, ii: j, hit: hit, miss: !hit, stage: "loop" })
            };
          }
        }
        yield {
          label: `Done: ${comparisons} comparisons for ${output.length} result rows. At 1M × 5k rows this same plan is 5×10⁹ comparisons — this is the plan you never want to see over two big tables.`,
          phase: "done",
          state: snap({ stage: "done" })
        };
        return;
      }

      // ---------------- INDEX NESTED LOOP -----------------------------------
      if (algo === "nested-loop + index") {
        const depth = Math.max(1, Math.ceil(Math.log2(sN + 1)));
        for (let i = 0; i < rN; i++) {
          comparisons += depth;
          yield {
            label: `Outer row orders#${orders[i].id} (cust=${orders[i].cust}): index seek into customers_pkey — ${depth} comparisons instead of ${sN}. This is why 'small outer + indexed inner' is the planner's favourite shape.`,
            phase: "seek",
            focus: [i],
            state: snap({ oi: i, ii: -1, stage: "seek" })
          };
          const j = customers.findIndex((c) => c.id === orders[i].cust);
          if (j >= 0) {
            emit(i, j);
            yield {
              label: `Found customers#${customers[j].id} (${customers[j].name}) → emit (${customers[j].name}, ${orders[i].amount}). Total so far ${comparisons} comparisons vs ${(i + 1) * sN} for the un-indexed loop.`,
              phase: "match",
              focus: [i, j],
              state: snap({ oi: i, ii: j, hit: true, stage: "match" })
            };
          }
        }
        yield {
          label: `Done: ${comparisons} comparisons (R × log S) vs ${rN * sN} for the plain nested loop. The index turned a quadratic plan into a near-linear one — and it still streams the first row immediately, which is why LIMIT loves this plan.`,
          phase: "done",
          state: snap({ stage: "done" })
        };
        return;
      }

      // ---------------- HASH JOIN --------------------------------------------
      if (algo === "hash") {
        yield {
          label: `Build phase: hash the SMALLER side (customers, ${sN} rows) into ${NB} buckets on the join key. The build side must fit in work_mem — if it doesn't, the join spills to disk in batches.`,
          phase: "build",
          state: snap({ stage: "build" })
        };
        for (let j = 0; j < sN; j++) {
          const b = hashOf(customers[j].id);
          buckets = buckets.map((arr, k) => (k === b ? arr.concat([j]) : arr.slice()));
          yield {
            label: `hash(${customers[j].id}) = ${b} → customers#${customers[j].id} (${customers[j].name}) goes in bucket ${b}. Building costs one pass over S and zero comparisons.`,
            phase: "build",
            focus: [j],
            state: snap({ ii: j, activeBucket: b, stage: "build" })
          };
        }
        yield {
          label: `Hash table built: ${buckets.map((b, i) => "b" + i + ":" + b.length).join("  ")}. Now stream the larger side through it — one probe per row, no re-scanning.`,
          phase: "probe",
          state: snap({ stage: "probe-start" })
        };
        for (let i = 0; i < rN; i++) {
          const b = hashOf(orders[i].cust);
          const bucket = buckets[b];
          yield {
            label: `Probe: hash(orders#${orders[i].id}.cust=${orders[i].cust}) = ${b} — only bucket ${b} (${bucket.length} entr${bucket.length === 1 ? "y" : "ies"}) can possibly match. The other ${sN - bucket.length} customers are never even looked at.`,
            phase: "probe",
            focus: [i],
            state: snap({ oi: i, activeBucket: b, stage: "probe" })
          };
          let matched = false;
          for (const j of bucket) {
            comparisons++;
            const hit = customers[j].id === orders[i].cust;
            if (hit) { emit(i, j); matched = true; }
            yield {
              label: hit
                ? `Bucket ${b}: customers#${customers[j].id} matches → emit (${customers[j].name}, ${orders[i].amount}). ${comparisons} comparisons total.`
                : `Bucket ${b}: customers#${customers[j].id} is a hash collision, not a real match — the key must still be compared. ${comparisons} comparisons total.`,
              phase: "probe",
              focus: [i, j],
              state: snap({ oi: i, ii: j, activeBucket: b, hit: hit, miss: !hit, stage: "probe" })
            };
          }
          if (!matched && bucket.length === 0) {
            yield {
              label: `Bucket ${b} is empty — orders#${orders[i].id} has no matching customer and is discarded with zero comparisons. (An anti-join would emit it here.)`,
              phase: "probe",
              focus: [i],
              state: snap({ oi: i, activeBucket: b, miss: true, stage: "probe" })
            };
          }
        }
        yield {
          label: `Done: ${comparisons} comparisons for ${output.length} rows — O(R + S), versus ${rN * sN} for the nested loop. The catch: nothing is emitted until the whole build side is read, and equality is the only predicate hashing can serve.`,
          phase: "done",
          state: snap({ stage: "done" })
        };
        return;
      }

      // ---------------- SORT-MERGE -------------------------------------------
      const outerOrder = orders.map((_, i) => i).sort((a, b) => orders[a].cust - orders[b].cust || orders[a].id - orders[b].id);
      const innerOrder = customers.map((_, i) => i).sort((a, b) => customers[a].id - customers[b].id);

      yield {
        label: `Sort phase: both sides must be ordered by the join key. Sorting orders by cust costs O(R log R) — but if the rows already stream out of an index on cust, this node disappears entirely and the join is a single linear pass.`,
        phase: "sort",
        state: snap({ outerOrder: outerOrder, innerOrder: innerOrder, stage: "sort" })
      };
      yield {
        label: `Both inputs are now in key order: orders by cust = [${outerOrder.map((i) => orders[i].cust).join(",")}], customers by id = [${innerOrder.map((i) => customers[i].id).join(",")}]. Merge with two cursors that only ever move forward.`,
        phase: "merge",
        state: snap({ outerOrder: outerOrder, innerOrder: innerOrder, stage: "merge-start" })
      };

      let a = 0, b = 0;
      while (a < rN && b < sN) {
        const oi = outerOrder[a], ii = innerOrder[b];
        const ok = orders[oi].cust, ck = customers[ii].id;
        comparisons++;
        if (ok === ck) {
          emit(oi, ii);
          yield {
            label: `cursors align: orders#${orders[oi].id}.cust=${ok} = customers#${ck} → emit (${customers[ii].name}, ${orders[oi].amount}). Advance the outer cursor; duplicates on that side stay matched to the same customer.`,
            phase: "merge",
            focus: [oi, ii],
            state: snap({ outerOrder: outerOrder, innerOrder: innerOrder, oi: oi, ii: ii, hit: true, stage: "merge" })
          };
          a++;
        } else if (ok < ck) {
          yield {
            label: `orders#${orders[oi].id}.cust=${ok} < customers#${ck}: because both sides are sorted, no later customer can match either — skip the outer row and advance. One comparison, never a rescan.`,
            phase: "merge",
            focus: [oi, ii],
            state: snap({ outerOrder: outerOrder, innerOrder: innerOrder, oi: oi, ii: ii, miss: true, stage: "merge" })
          };
          a++;
        } else {
          yield {
            label: `customers#${ck} < orders#${orders[oi].id}.cust=${ok}: this customer can never match anything further along — advance the inner cursor. Total comparisons ${comparisons}, bounded by R + S = ${rN + sN}.`,
            phase: "merge",
            focus: [oi, ii],
            state: snap({ outerOrder: outerOrder, innerOrder: innerOrder, oi: oi, ii: ii, miss: true, stage: "merge" })
          };
          b++;
        }
      }
      yield {
        label: `Done: ${comparisons} comparisons for ${output.length} rows, and the output came out sorted by the join key — so a downstream ORDER BY or grouped aggregate on that key is free. That free ordering is the merge join's real selling point.`,
        phase: "done",
        state: snap({ outerOrder: outerOrder, innerOrder: innerOrder, stage: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 16;
      const headerH = 52;
      const outW = Math.min(300, W * 0.28);
      const stripW = Math.min(210, (W - outW - pad * 4) * 0.34);
      const leftX = pad;
      const rightX = pad + stripW + (W - outW - pad * 3 - stripW * 2);
      const midX = leftX + stripW;
      const midW = rightX - midX;
      const outX = W - pad - outW;

      const listTop = headerH + 22;
      const rowH = Math.min(26, (H - listTop - 40) / Math.max(s.rN, s.sN));

      // ---------- header --------------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`${s.algo} join   ·   orders ⋈ customers ON cust = id`, pad, 20);
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.viz2;
      ctx.fillText(`comparisons: ${s.comparisons}`, pad, 38);
      ctx.fillStyle = C.muted;
      ctx.fillText(
        `   worst case R×S = ${s.worstCase}   ·   R + S = ${s.rN + s.sN}   ·   rows emitted ${s.outputCount}`,
        pad + 130, 38
      );

      // ---------- table strips ---------------------------------------------------
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.text2;
      ctx.fillText(`orders (R=${s.rN})`, leftX, listTop - 8);
      ctx.fillText(`customers (S=${s.sN})`, rightX, listTop - 8);

      const cursorY = {};
      for (let k = 0; k < s.outerOrder.length; k++) {
        const i = s.outerOrder[k];
        const o = s.orders[i];
        const y = listTop + k * rowH;
        const active = i === s.oi;
        ctx.fillStyle = active ? C.viz1 : C.surface2;
        ctx.globalAlpha = active ? 0.85 : 0.6;
        ctx.beginPath();
        ctx.roundRect(leftX, y, stripW - 10, rowH - 3, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (active) {
          ctx.strokeStyle = C.viz1; ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.roundRect(leftX + 0.5, y + 0.5, stripW - 11, rowH - 4, 4); ctx.stroke();
        }
        ctx.fillStyle = active ? C.text : C.text2;
        ctx.font = `${Math.min(11, rowH - 8)}px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(`#${o.id}`, leftX + 8, y + rowH * 0.66);
        ctx.fillStyle = active ? C.text : C.viz4;
        ctx.fillText(`cust=${o.cust}`, leftX + 54, y + rowH * 0.66);
        ctx.fillStyle = active ? C.text : C.muted;
        ctx.textAlign = "right";
        ctx.fillText(String(o.amount), leftX + stripW - 18, y + rowH * 0.66);
        if (active) cursorY.o = y + rowH / 2;
      }

      for (let k = 0; k < s.innerOrder.length; k++) {
        const j = s.innerOrder[k];
        const c = s.customers[j];
        const y = listTop + k * rowH;
        const active = j === s.ii;
        ctx.fillStyle = active ? (s.hit ? C.viz3 : C.viz5) : C.surface2;
        ctx.globalAlpha = active ? 0.85 : 0.6;
        ctx.beginPath();
        ctx.roundRect(rightX, y, stripW - 10, rowH - 3, 4);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = active ? C.text : C.text2;
        ctx.font = `${Math.min(11, rowH - 8)}px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(`id=${c.id}`, rightX + 8, y + rowH * 0.66);
        ctx.fillText(c.name, rightX + 58, y + rowH * 0.66);
        if (active) cursorY.c = y + rowH / 2;
      }

      // ---------- middle: buckets or connector ------------------------------------
      if (s.algo === "hash") {
        const bh = Math.min(64, (H - listTop - 40) / s.nb);
        for (let b = 0; b < s.nb; b++) {
          const y = listTop + b * bh;
          const act = b === s.activeBucket;
          ctx.fillStyle = act ? C.viz1 : C.surface2;
          ctx.globalAlpha = act ? 0.3 : 0.6;
          ctx.beginPath();
          ctx.roundRect(midX + 6, y, midW - 12, bh - 6, 5);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = act ? C.viz1 : C.border;
          ctx.lineWidth = act ? 1.5 : 1;
          ctx.beginPath();
          ctx.roundRect(midX + 6.5, y + 0.5, midW - 13, bh - 7, 5);
          ctx.stroke();
          ctx.textAlign = "left";
          ctx.fillStyle = act ? C.text : C.muted;
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillText(`bucket ${b}`, midX + 14, y + 14);
          ctx.font = `11px ${env.font.mono}`;
          ctx.fillStyle = act ? C.text : C.text2;
          const entries = s.buckets[b].map((j) => `${s.customers[j].id}:${s.customers[j].name}`).join("  ");
          ctx.fillText(entries || "—", midX + 14, y + 30);
        }
        ctx.textAlign = "center";
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText("hash table on the smaller side", midX + midW / 2, listTop - 8);
      } else if (cursorY.o != null && cursorY.c != null) {
        ctx.strokeStyle = s.hit ? C.viz3 : C.viz5;
        ctx.lineWidth = s.hit ? 2.5 : 1.2;
        ctx.setLineDash(s.hit ? [] : [4, 3]);
        ctx.beginPath();
        ctx.moveTo(leftX + stripW - 8, cursorY.o);
        ctx.bezierCurveTo(midX + midW * 0.4, cursorY.o, midX + midW * 0.6, cursorY.c, rightX - 2, cursorY.c);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.textAlign = "center";
        ctx.fillStyle = s.hit ? C.viz3 : C.viz5;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(s.hit ? "match" : "compare", midX + midW / 2, (cursorY.o + cursorY.c) / 2 - 6);
      }
      if (s.algo === "sort-merge") {
        ctx.textAlign = "center";
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText("both sides sorted by join key", midX + midW / 2, listTop - 8);
        ctx.fillText("cursors only move forward", midX + midW / 2, H - 22);
      }

      // ---------- output panel ------------------------------------------------------
      ctx.fillStyle = C.surface2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.roundRect(outX, listTop - 18, outW, H - listTop - 18, 6);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(outX + 0.5, listTop - 17.5, outW - 1, H - listTop - 19, 6);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = C.text2;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`result (${s.outputCount} rows)`, outX + 10, listTop - 2);
      ctx.font = `11px ${env.font.mono}`;
      for (let i = 0; i < s.output.length; i++) {
        const r = s.output[i];
        const y = listTop + 16 + i * 20;
        if (y > H - 20) break;
        ctx.fillStyle = i === s.output.length - 1 ? C.viz3 : C.text2;
        ctx.fillText(`${r.name}  ${r.amount}`, outX + 10, y);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(`o#${r.o} ⋈ c${r.c}`, outX + outW - 78, y);
        ctx.font = `11px ${env.font.mono}`;
      }

      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.textAlign = "left";
      ctx.fillText(s.stage ? `phase: ${s.stage}` : "", pad, H - 8);
    }
  },

  drill: {
    cards: [
      { q: "Cost and best regime for a nested-loop join?", a: "O(R×S) unindexed, O(R·log S) with an index on the inner join key. Best when the outer side is tiny after filtering, when there's a LIMIT (it streams), or when the predicate is not an equality.", tags: ["nested-loop"] },
      { q: "Which side does a hash join build on, and why?", a: "The estimated-smaller side, because the hash table must fit in memory (work_mem). The larger side is streamed through as probes.", tags: ["hash"] },
      { q: "What does `Batches: 8` in a Postgres Hash node mean?", a: "The build side didn't fit in work_mem, so both inputs were partitioned to temp files and joined batch by batch. Extra I/O — raise work_mem or shrink the build side.", tags: ["hash"] },
      { q: "When is a merge join free?", a: "When both inputs already arrive sorted on the join key (e.g. streaming from B-tree indexes) — no Sort node, one linear pass, and the output is sorted for downstream operators.", tags: ["merge"] },
      { q: "Which join algorithms require an equality predicate?", a: "Hash and merge. Only nested loop can evaluate `ON a.ts BETWEEN b.start AND b.end` or other inequalities.", tags: ["predicates"] },
      { q: "A query regressed badly. First thing to check in EXPLAIN ANALYZE?", a: "Estimated vs actual rows on each node. A nested loop with `rows=5` but `actual rows=500000` means the plan was chosen for a shape the data no longer has — fix statistics before touching the SQL.", tags: ["debugging"] },
      { q: "Why prefer NOT EXISTS over NOT IN?", a: "`NOT IN` with a NULL in the subquery returns zero rows (UNKNOWN semantics) and often blocks the anti-join optimisation. `NOT EXISTS` is NULL-safe and plans as a Hash/Merge Anti Join.", tags: ["anti-join"] },
      { q: "Why does join order matter more than join algorithm?", a: "Because it determines the size of every intermediate result. Joining the most selective relations first keeps them small; a bad cardinality estimate poisons the whole search.", tags: ["planner"] }
    ],
    sixtySecond: [
      "Compare nested-loop, hash and merge joins: cost, memory, predicates supported, and the regime where each wins.",
      "You see a nested loop over two million-row tables in a plan. Walk through how you'd diagnose and fix it."
    ]
  }
};
