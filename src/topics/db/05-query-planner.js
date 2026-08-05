export default {
  id: "query-planner",
  track: "db",
  title: "Query Planner & EXPLAIN",
  difficulty: 3,
  minutes: 20,
  tags: ["planner", "explain", "cost-model", "statistics"],

  explainer: [
    { type: "p", text: "SQL is what's called a declarative language: you describe *what* result you want, not *how* to get it — unlike a for-loop, you never tell the database to 'go row by row and check this condition'. Something inside the database has to translate your declarative wish into an actual sequence of physical steps, and that something is called the **query optimiser** (also called the planner). It works by coming up with several different possible ways to physically execute your query — different orders to join tables in, different ways to read each table — estimating roughly how expensive each option would be using statistics it keeps about your tables, and then running whichever option looks cheapest. Nearly every 'my query used to be fast and now it's slow' disaster you will ever have to debug traces back to one of exactly two root causes: either the optimiser's estimate of how many rows something would match was wrong, or the assumptions baked into its cost model don't match your actual hardware (for example, assuming a slow spinning hard disk when you're really running on fast SSDs)." },
    { type: "h3", text: "The three stages a query passes through" },
    { type: "list", items: [
      "**Parse & rewrite** — the database first figures out what your query's table and column names actually refer to, expands any views (saved named queries) you referenced, flattens nested subqueries where it safely can, and applies some straightforward rewriting rules. Even at this early stage, a `NOT IN` condition might get rewritten into a different, equivalent form called an anti-join (a join that returns rows with *no* match).",
      "**Plan / optimise** — for each table, the database lists out the different ways it could physically be read (a full sequential scan, an index scan, a 'bitmap' scan that combines several index lookups, or an index-only scan that never touches the table at all), and for queries with multiple tables, it also considers different orders to join them in and different join algorithms. It estimates a cost for each combination and looks for the cheapest overall plan. For small numbers of tables, Postgres tries essentially every combination systematically (a technique called dynamic programming); above a configurable table-count limit called `geqo_threshold` (12 tables by default), it switches to a faster, approximate search instead, called a genetic algorithm, because trying every combination would take too long.",
      "**Execute** — the chosen plan runs as a tree of operations, where each step pulls rows from the steps below it only as needed, rather than materializing everything up front. This 'pull as needed' style is called a demand-driven pipeline."
    ]},
    { type: "h3", text: "The cost numbers you see are estimates, not real time measurements" },
    { type: "p", text: "Postgres assigns each plan a cost expressed in made-up units, calibrated so that reading one page sequentially from disk costs exactly `seq_page_cost = 1.0`. A few other default settings matter a lot: `random_page_cost = 4.0` assumes that a random (non-sequential) disk read costs four times as much as a sequential one — a leftover assumption from the era of spinning hard drives, where random reads really were that much slower. On modern SSDs, that gap is much smaller, so a common tuning step is setting it to around `1.1`, which makes the planner much more willing to choose index scans. Two other defaults, `cpu_tuple_cost = 0.01` and `cpu_operator_cost = 0.0025`, represent the (tiny) cost of processing each row and each comparison in memory. A setting called `effective_cache_size` tells the planner roughly how much of the database is likely to already be sitting in memory, which affects how expensive it assumes disk access will be. The important thing to internalize: **these cost numbers are not milliseconds.** Comparing the cost of two different candidate plans *for the same query* tells you which one the planner thinks is cheaper — that comparison is meaningful. Comparing the cost number of one query against the cost number of a completely different query tells you nothing." },
    { type: "h3", text: "Where the estimates actually come from: table statistics" },
    { type: "p", text: "A command called `ANALYZE` samples a table (by default, `300 × default_statistics_target` rows, which works out to 30,000 rows) and records, for each column: a list of the most common values and how often each appears, a histogram (a chart-like summary bucketing the remaining values into equal-sized groups) that approximates the overall distribution, an estimate of how many distinct values exist, what fraction of values are NULL, and how well the column's logical sort order matches its physical order on disk. When the planner needs to estimate how selective a condition like `region = 'EU'` is — meaning, what fraction of rows it will actually match — it checks the most-common-values list first if `'EU'` is common enough to be listed there, and otherwise falls back to a formula: `(1 - the combined frequency of all the common values) / (the estimated number of distinct values)`. When a query has multiple conditions, the planner multiplies their individual selectivities together — but only because it **assumes the conditions are statistically independent** of each other, which is often not true in real-world data, and is the single biggest source of bad estimates you will encounter." },
    { type: "callout", tone: "pitfall", text: "Consider `WHERE city = 'Paris' AND country = 'France'`. The planner estimates this as `selectivity(city) × selectivity(country)` — say, `1/5000 × 1/200` — but the true answer is really just `selectivity(city)` alone, because every row where city is Paris already has country set to France; the two conditions aren't actually independent at all. The planner ends up wildly underestimating how many rows will match — predicting maybe 3 rows when the real number is 200,000 — picks a nested loop join on that bad assumption, and the query becomes disastrously slow. The fix is to explicitly tell Postgres about the relationship between the columns: `CREATE STATISTICS ... (dependencies, ndistinct) ON city, country FROM addresses;`." },
    { type: "h3", text: "Reading EXPLAIN output like someone who does this daily" },
    { type: "list", items: [
      "Running `EXPLAIN` by itself only shows the planner's *estimates* — it doesn't actually run the query. `EXPLAIN (ANALYZE, BUFFERS)` actually executes the query and additionally reports **the real row counts, the real timing, and counts of cache hits versus real disk reads** — you should almost always reach for this fuller form when debugging.",
      "For every single step (called a 'node') in the plan tree, compare the estimated `rows=` value against the `actual rows=` value. Find the deepest node in the tree where these two numbers diverge by roughly 10x or more — that node is very likely the actual root cause, and everything built on top of it in the tree is just downstream fallout.",
      "A node marked `loops=N` means that step of the plan ran N separate times — this happens for the inner side of a nested loop join, which re-runs once per outer row. The reported time next to it is the *average time per loop*, not the total, so you have to multiply the two together to see the real cost. This is exactly how a nested loop join can hide a huge amount of total work behind an innocent-looking small number.",
      "The line `Buffers: shared hit=X read=Y` tells you how many disk pages were already sitting in memory (a 'hit') versus how many had to actually be read from disk (a 'read') — this is about as close to ground truth as the plan output gets.",
      "Watch specifically for two red flags: `Rows Removed by Filter` (meaning a condition was checked row-by-row after the fact, rather than being used to narrow an index search directly — a sign it should have been an index condition instead), and `Batches > 1` on a hash join (meaning the join's build side didn't fit in memory and had to spill extra data to disk)."
    ]},
    { type: "callout", tone: "tip", text: "The single sentence that lands best in an interview: *\"I'd start with EXPLAIN (ANALYZE, BUFFERS) and look for the deepest node in the plan tree where the estimated and actual row counts diverge — that node is almost always the real cause, and every slow thing built on top of it in the plan is just a symptom.\"*" }
  ],

  glossary: [
    { term: "query optimiser / planner", plain: "The part of the database that turns your declarative SQL into an actual, physical sequence of steps, by comparing the estimated cost of several possible ways to run the query and picking the cheapest one." },
    { term: "declarative language", plain: "A language, like SQL, where you describe the result you want rather than the exact steps to compute it — the opposite of an imperative, step-by-step language." },
    { term: "cost model", plain: "The set of formulas and assumptions a database uses to estimate how expensive a candidate query plan will be, before actually running it." },
    { term: "view", plain: "A saved, named SQL query that can be referenced like a table in other queries." },
    { term: "sequential scan (seq scan)", plain: "Reading a table by going through it from start to finish, page by page, without using an index." },
    { term: "index scan / index-only scan", plain: "Reading a table by following an index instead of scanning it start to finish; an index-only scan additionally never has to touch the table at all, because the index alone contains every needed column." },
    { term: "bitmap scan", plain: "A scan technique that first collects the locations of matching rows from an index into an in-memory list ('bitmap'), then visits the table pages in an efficient order, useful when several index conditions need to be combined." },
    { term: "genetic algorithm (in query planning)", plain: "A faster, approximate search technique the planner switches to for queries joining many tables, used because checking every single possible join order would take far too long." },
    { term: "selectivity", plain: "The fraction of a table's rows that a given condition is expected to match — highly selective means very few rows match." },
    { term: "histogram (in database statistics)", plain: "A summary of a column's values, grouped into buckets, that the planner uses to estimate how many rows fall within a given range." },
    { term: "n_distinct", plain: "The database's estimate of how many distinct (unique) values exist in a column." },
    { term: "correlated columns", plain: "Two columns whose values tend to go together (like a city implying its country) — a source of estimate errors, because the planner normally assumes columns are independent." },
    { term: "SSD vs HDD (random_page_cost)", plain: "SSDs (solid-state drives) can read data at a random location almost as fast as sequentially; older spinning hard disk drives (HDDs) are much slower at random reads than sequential ones — the planner's default settings assume the older, slower kind of disk unless told otherwise." },
    { term: "EXPLAIN / EXPLAIN ANALYZE", plain: "A SQL command that reveals the plan chosen for a query; the ANALYZE form actually executes the query and reports real measured numbers next to the original estimates." },
    { term: "hash join batches", plain: "The number of chunks a hash join's build side gets split into when it doesn't fit in memory; `Batches: 1` means everything fit comfortably, higher numbers mean data spilled to disk." }
  ],

  complexity: {
    rows: [
      { operation: "Seq Scan", time: "pages×1.0 + rows×0.01", space: "O(1)", note: "sequential I/O; unavoidable baseline" },
      { operation: "Index Scan", time: "≈ 3 + matched×(random_page_cost + cpu)", space: "O(1)", note: "random_page_cost=4.0 default, 1.1 on SSD" },
      { operation: "Bitmap Heap Scan", time: "index + pages×~2", space: "O(matched)", note: "sorts row pointers so heap I/O turns sequential" },
      { operation: "Sort", time: "≈ rows×log₂(rows)×cpu_op", space: "O(rows) or work_mem", note: "spills to an external merge sort past work_mem" },
      { operation: "Plan search", time: "O(2ⁿ) subsets", space: "O(2ⁿ)", note: "n = joined relations; GEQO above geqo_threshold=12" },
      { operation: "ANALYZE sample", time: "O(30 000 rows)", space: "O(1)", note: "300 × default_statistics_target" }
    ]
  },

  interview: {
    whyAsked: "This separates people who tune queries by superstition from people who read the plan. The signal is whether you go to estimated-vs-actual rows first, and whether you understand that the optimiser is a cost model over statistics — so the fix is usually to the statistics, not the SQL.",
    followUps: [
      { q: "EXPLAIN vs EXPLAIN ANALYZE — what's the difference and the risk?", a: "EXPLAIN shows the chosen plan with estimates only and does not run the query. EXPLAIN ANALYZE executes it and adds actual rows, actual time and loop counts. The risk: it really runs, so an EXPLAIN ANALYZE of a DELETE deletes rows — wrap it in `BEGIN; ... ROLLBACK;`." },
      { q: "How does the planner estimate the selectivity of `WHERE region = 'EU'`?", a: "From ANALYZE's per-column statistics: if 'EU' is in the most-common-values list, its recorded frequency is used directly; otherwise selectivity is `(1 - sum of MCV frequencies) / n_distinct`. Range predicates interpolate within the equi-depth histogram. Multiple predicates are multiplied assuming independence." },
      { q: "Why would the planner pick a plan that is obviously worse?", a: "Because its estimate was wrong, or its cost model doesn't match reality. Stale statistics after a bulk load; correlated columns multiplied as independent; `random_page_cost = 4.0` on SSD making index scans look expensive; a low `effective_cache_size` making it assume nothing is cached. Fix the input to the model before rewriting the query." },
      { q: "What does `loops=1000` mean in a plan node?", a: "The node was executed 1000 times — it is the inner side of a nested loop. The reported `actual time` and `rows` are *per loop averages*, so the real cost is time × loops. A node showing `actual time=0.01..0.02 rows=1 loops=500000` is 10 seconds of work hiding in plain sight." },
      { q: "How do you fix a row misestimate caused by correlated columns?", a: "`CREATE STATISTICS stat_name (dependencies, ndistinct, mcv) ON col_a, col_b FROM tbl;` then ANALYZE. Extended statistics teach the planner that the columns are functionally dependent, so it stops multiplying their selectivities. Raising `default_statistics_target` (or per-column STATISTICS) helps for skewed single columns." },
      { q: "Is a lower cost number always faster?", a: "No. Cost is an abstract unit calibrated to a 2000s-era disk. It is meaningful for comparing candidate plans *for the same query on the same box*, and meaningless as a cross-query performance metric. The only real measurement is actual time plus buffer counts from EXPLAIN (ANALYZE, BUFFERS)." },
      { q: "When would you use planner hints or `enable_*` flags?", a: "Only for diagnosis: `SET LOCAL enable_nestloop = off` proves the alternative plan is faster and tells you the cost model is wrong. Shipping it freezes a decision that will be wrong after the next data-volume change. Postgres deliberately has no hint syntax for this reason; the supported levers are statistics, indexes and cost settings." }
    ]
  },

  code: [
    { lang: "sql", label: "The plan that matters", code: "EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT)\nSELECT c.name, o.amount\nFROM   orders o\nJOIN   customers c ON c.id = o.customer_id\nWHERE  o.region = 'EU'\n  AND  o.created_at >= now() - interval '1 day'\nORDER  BY o.amount DESC\nLIMIT  20;\n\n-- Limit  (cost=12611.9..12611.9 rows=20 width=36)\n--        (actual time=812.4..812.4 rows=20 loops=1)\n--   ->  Sort  (cost=12611.9..12616.9 rows=2000 width=36)\n--             (actual time=812.4..812.4 rows=20 loops=1)\n--         Sort Key: o.amount DESC\n--         Sort Method: top-N heapsort  Memory: 27kB\n--         ->  Nested Loop  (cost=0.86..12558.6 rows=2000 width=36)\n--                          (actual time=0.05..805.1 rows=101433 loops=1)\n--               ->  Index Scan using idx_orders_region_created on orders o\n--                     (cost=0.43..2503.4 rows=2000 width=12)\n--                     (actual time=0.03..96.2 rows=101433 loops=1)\n--                     Index Cond: ((region='EU') AND (created_at >= ...))\n--               ->  Index Scan using customers_pkey on customers c\n--                     (cost=0.43..0.50 rows=1 width=28)\n--                     (actual time=0.006..0.006 rows=1 loops=101433)\n--                     Index Cond: (id = o.customer_id)\n-- Buffers: shared hit=402118 read=1204\n-- Execution Time: 812.6 ms\n--\n-- The tell: rows=2000 vs actual rows=101433 (50x), and loops=101433\n-- on the inner index scan. The nested loop was chosen for a shape\n-- the data no longer has." },
    { lang: "sql", label: "Fixing the estimate, not the SQL", code: "-- 1. Are the stats even current?\nSELECT relname, last_analyze, last_autoanalyze, n_live_tup, n_mod_since_analyze\nFROM   pg_stat_user_tables WHERE relname = 'orders';\n\nANALYZE orders;\n\n-- 2. What does the planner think it knows about the column?\nSELECT null_frac, n_distinct, most_common_vals, most_common_freqs, correlation\nFROM   pg_stats WHERE tablename = 'orders' AND attname = 'region';\n\n-- 3. Skewed column -> finer histogram\nALTER TABLE orders ALTER COLUMN region SET STATISTICS 1000;\nANALYZE orders;\n\n-- 4. Correlated columns -> stop multiplying selectivities\nCREATE STATISTICS stat_orders_region_country (dependencies, ndistinct)\n  ON region, country FROM orders;\nANALYZE orders;\n\n-- 5. SSD? tell the cost model\nALTER SYSTEM SET random_page_cost = 1.1;\nALTER SYSTEM SET effective_cache_size = '24GB';\nSELECT pg_reload_conf();" },
    { lang: "sql", label: "Proving the alternative (diagnosis only)", code: "BEGIN;\nSET LOCAL enable_nestloop = off;      -- force the alternative\nEXPLAIN (ANALYZE, BUFFERS)\nSELECT c.name, o.amount FROM orders o\nJOIN customers c ON c.id = o.customer_id\nWHERE o.region = 'EU' AND o.created_at >= now() - interval '1 day'\nORDER BY o.amount DESC LIMIT 20;\n-- Hash Join ... Execution Time: 61.3 ms   <-- 13x faster\nROLLBACK;\n\n-- Do NOT ship the SET. It proves the cost model was wrong;\n-- the fix is ANALYZE / extended statistics / random_page_cost,\n-- or an index that makes the good plan obviously cheap:\nCREATE INDEX idx_orders_region_amount\n  ON orders (region, amount DESC)\n  WHERE created_at >= '2024-01-01';   -- partial + ordered = no Sort node" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.45, maxFrames: 200 },

    params: [
      { key: "sel", label: "Matching rows per 10k (selectivity)", type: "int", min: 1, max: 400, default: 20 },
      { key: "stats", label: "Statistics", type: "enum", options: ["fresh", "stale (100× off)"], default: "fresh" },
      { key: "rpc", label: "random_page_cost", type: "enum", options: ["4.0 (HDD default)", "1.1 (SSD)"], default: "4.0 (HDD default)" }
    ],

    frames: function* (params, rng) {
      const R = 1000000;      // orders
      const S = 5000;         // customers
      const PAGE_ROWS = 100;
      const RPC = params.rpc === "1.1 (SSD)" ? 1.1 : 4.0;
      const stale = params.stats !== "fresh";

      const trueSel = params.sel / 10000;
      const trueRows = Math.max(1, Math.round(R * trueSel));
      const estRows = stale ? Math.max(1, Math.round(trueRows / 100)) : trueRows;

      const seqScanCost = (rows) => Math.round(rows / PAGE_ROWS + rows * 0.01);
      const idxScanCost = (matched) => Math.round(3 + matched * (RPC * 0.5 + 0.01));
      const sortCost = (rows) => Math.round(rows * Math.log2(Math.max(2, rows)) * 0.005);

      const planCosts = (rowsEst) => {
        const a1 = idxScanCost(rowsEst);
        const a2 = Math.round(rowsEst * (0.5 + RPC * 0.25));   // pkey probe per outer row
        const a3 = a1 + a2;
        const a4 = a3 + sortCost(rowsEst);
        const b1 = seqScanCost(R);
        const b2 = seqScanCost(S);
        const b3 = b2 + Math.round(S * 0.02);
        const b4 = b1 + b3 + Math.round(rowsEst * 0.02);
        const b5 = b4 + sortCost(rowsEst);
        return { a1: a1, a2: a2, a3: a3, a4: a4, aTotal: a4, b1: b1, b2: b2, b3: b3, b4: b4, b5: b5, bTotal: b5 };
      };

      const est = planCosts(estRows);
      const act = planCosts(trueRows);

      const mkNodes = () => ([
        // plan A — nested loop over two index scans
        { plan: "A", id: "a1", row: 3, col: 0, name: "Index Scan orders", detail: "idx(region, created_at)", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "A", id: "a2", row: 3, col: 1, name: "Index Scan customers", detail: "customers_pkey", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "A", id: "a3", row: 2, col: 0.5, name: "Nested Loop", detail: "one pkey seek per outer row", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "A", id: "a4", row: 1, col: 0.5, name: "Sort", detail: "amount DESC, top-N heapsort", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "A", id: "a5", row: 0, col: 0.5, name: "Limit 20", detail: "", rows: 20, cost: 0, shown: false, actual: null },
        // plan B — hash join over two seq scans
        { plan: "B", id: "b2", row: 4, col: 1, name: "Seq Scan customers", detail: "5 000 rows", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "B", id: "b3", row: 3, col: 1, name: "Hash", detail: "build side, Batches: 1", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "B", id: "b1", row: 3, col: 0, name: "Seq Scan orders", detail: "filter: region, created_at", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "B", id: "b4", row: 2, col: 0.5, name: "Hash Join", detail: "cond: c.id = o.customer_id", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "B", id: "b5", row: 1, col: 0.5, name: "Sort", detail: "amount DESC", rows: 0, cost: 0, shown: false, actual: null },
        { plan: "B", id: "b6", row: 0, col: 0.5, name: "Limit 20", detail: "", rows: 20, cost: 0, shown: false, actual: null }
      ]);
      const edges = [
        ["a3", "a1"], ["a3", "a2"], ["a4", "a3"], ["a5", "a4"],
        ["b3", "b2"], ["b4", "b1"], ["b4", "b3"], ["b5", "b4"], ["b6", "b5"]
      ];

      let nodes = mkNodes();
      let curve = [];
      let chosen = null;
      let histo = 0;

      const setNode = (id, patch) => {
        nodes = nodes.map((n) => (n.id === id ? { ...n, ...patch } : n));
      };
      const snap = (extra) => ({
        nodes: nodes.map((n) => ({ ...n })),
        edges: edges.map((e) => e.slice()),
        chosen: chosen,
        estRows: estRows,
        trueRows: trueRows,
        stale: stale,
        rpc: RPC,
        R: R, S: S,
        histo: histo,
        curve: curve.map((c) => ({ sel: c.sel, a: c.a, b: c.b })),
        selPerMil: params.sel,
        aTotal: extra && extra.aTotal != null ? extra.aTotal : 0,
        bTotal: extra && extra.bTotal != null ? extra.bTotal : 0,
        stage: extra && extra.stage ? extra.stage : "",
        note: extra && extra.note ? extra.note : "",
        actualMode: !!(extra && extra.actualMode)
      });

      yield {
        label: `The query: orders ⋈ customers WHERE region='EU' AND created_at >= now()-1d ORDER BY amount DESC LIMIT 20. orders has ${R.toLocaleString ? R.toLocaleString("en-US") : R} rows; the planner must choose an access path and a join method.`,
        phase: "parse",
        state: snap({ stage: "parse" })
      };

      // ---- selectivity estimation from the histogram -------------------------
      for (let i = 1; i <= 8; i++) {
        histo = i;
        yield {
          label: i < 8
            ? `Reading pg_stats for orders.region: bucket ${i}/8 of the equi-depth histogram. Every bucket holds ~1/8 of the sampled rows, so a range predicate is answered by interpolating inside one bucket.`
            : `Estimate: region='EU' AND created_at >= … matches ${estRows.toLocaleString ? estRows.toLocaleString("en-US") : estRows} of ${R.toLocaleString ? R.toLocaleString("en-US") : R} rows (${(estRows / R * 100).toFixed(3)}%)` +
            (stale ? `. But the stats are STALE — the true count is ${trueRows.toLocaleString ? trueRows.toLocaleString("en-US") : trueRows}. Every decision below is built on this wrong number.` : `. Two predicates, multiplied assuming independence.`),
          phase: "estimate",
          state: snap({ stage: "estimate" })
        };
      }

      // ---- build plan A bottom-up ---------------------------------------------
      const stepsA = [
        { id: "a1", rows: estRows, cost: est.a1, why: `Index Scan on idx(region, created_at): seek to the (EU, recent) range and read ${estRows} rows. Each match is a random heap fetch costed at random_page_cost=${RPC}.` },
        { id: "a2", rows: 1, cost: est.a2, why: `Inner side: one customers_pkey lookup per outer row. Cheap individually (rows=1) — but it will run ${estRows} times, which is the number to watch.` },
        { id: "a3", rows: estRows, cost: est.a3, why: `Nested Loop total = ${est.a1} + ${est.a2}. This plan streams: it can hand the first joined row upward immediately, which matters because there is a LIMIT above.` },
        { id: "a4", rows: estRows, cost: est.a4, why: `Sort by amount DESC. With a LIMIT the executor uses a bounded top-N heapsort — only 20 rows are ever held, so memory is tiny even for a big input.` },
        { id: "a5", rows: 20, cost: est.a4, why: `Plan A total cost ≈ ${est.aTotal}. Its cost is dominated by ${estRows} random heap fetches plus ${estRows} index probes — it scales linearly with the estimate.` }
      ];
      for (const st of stepsA) {
        setNode(st.id, { shown: true, rows: st.rows, cost: st.cost });
        yield {
          label: st.why,
          phase: "planA",
          focus: [st.id],
          state: snap({ stage: "planA", aTotal: st.cost })
        };
      }

      // ---- build plan B bottom-up ---------------------------------------------
      const stepsB = [
        { id: "b2", rows: S, cost: est.b2, why: `Candidate plan B starts differently: Seq Scan customers, all ${S} rows, ${est.b2} cost units. Sequential I/O is cheap per row — that is the whole reason scans compete with indexes.` },
        { id: "b3", rows: S, cost: est.b3, why: `Hash node: build a hash table on the smaller side (customers). Batches: 1 means it fits in work_mem; if it didn't, both inputs would spill to temp files.` },
        { id: "b1", rows: estRows, cost: est.b1, why: `Seq Scan orders reads all ${R.toLocaleString ? R.toLocaleString("en-US") : R} rows and filters down to ${estRows} — cost ${est.b1}, and crucially it is a FIXED cost that does not care how selective the predicate is.` },
        { id: "b4", rows: estRows, cost: est.b4, why: `Hash Join: stream the filtered orders through the hash table, one probe per row. O(R + S), no random I/O, but nothing is emitted until the build side is complete.` },
        { id: "b5", rows: estRows, cost: est.b5, why: `Sort by amount DESC on ${estRows} rows.` },
        { id: "b6", rows: 20, cost: est.b5, why: `Plan B total cost ≈ ${est.bTotal}. Almost all of it is the ${est.b1}-unit sequential scan — a floor that plan A only beats when very few rows match.` }
      ];
      for (const st of stepsB) {
        setNode(st.id, { shown: true, rows: st.rows, cost: st.cost });
        yield {
          label: st.why,
          phase: "planB",
          focus: [st.id],
          state: snap({ stage: "planB", aTotal: est.aTotal, bTotal: st.cost })
        };
      }

      // ---- choose ---------------------------------------------------------------
      chosen = est.aTotal <= est.bTotal ? "A" : "B";
      yield {
        label: `Cost comparison: plan A ${est.aTotal} vs plan B ${est.bTotal}. The planner picks ${chosen === "A" ? "the Nested Loop (A)" : "the Hash Join (B)"} — purely because that number is smaller. Cost units are not milliseconds; they only mean something relative to each other.`,
        phase: "choose",
        state: snap({ stage: "choose", aTotal: est.aTotal, bTotal: est.bTotal })
      };

      // ---- crossover sweep -------------------------------------------------------
      const sweep = [1, 2, 4, 8, 16, 32, 64, 100, 150, 200, 300, 400];
      for (let i = 0; i < sweep.length; i++) {
        const rowsAt = Math.max(1, Math.round(R * sweep[i] / 10000));
        const c = planCosts(rowsAt);
        curve = curve.concat([{ sel: sweep[i], a: c.aTotal, b: c.bTotal }]);
        const flip = i > 0 && (curve[i - 1].a < curve[i - 1].b) !== (c.aTotal < c.bTotal);
        yield {
          label: flip
            ? `Crossover: at about ${sweep[i]} matching rows per 10 000 (${(sweep[i] / 100).toFixed(2)}%) the nested-loop plan stops being cheaper. This point is what "the planner ignored my index" almost always means — it didn't, it costed it and lost.`
            : `Sweeping selectivity: at ${sweep[i]}/10 000 (${rowsAt.toLocaleString ? rowsAt.toLocaleString("en-US") : rowsAt} rows) plan A costs ${c.aTotal}, plan B ${c.bTotal}. Plan B's cost is nearly flat — a seq scan reads the whole table no matter what.`,
          phase: "sweep",
          state: snap({ stage: "sweep", aTotal: est.aTotal, bTotal: est.bTotal })
        };
      }

      // ---- execute with actuals ---------------------------------------------------
      const order = chosen === "A" ? ["a1", "a2", "a3", "a4", "a5"] : ["b2", "b3", "b1", "b4", "b5", "b6"];
      const actualsFor = (id) => {
        if (id === "a1") return trueRows;
        if (id === "a2") return 1;
        if (id === "a3") return trueRows;
        if (id === "a4" || id === "a5" || id === "b6") return 20;
        if (id === "b2" || id === "b3") return S;
        if (id === "b1" || id === "b4" || id === "b5") return trueRows;
        return trueRows;
      };
      for (const id of order) {
        setNode(id, { actual: actualsFor(id) });
        const n = nodes.find((x) => x.id === id);
        const ratio = n.rows > 0 ? actualsFor(id) / n.rows : 1;
        yield {
          label: (id === "a2"
            ? `EXPLAIN ANALYZE: the inner Index Scan shows rows=1 loops=${trueRows.toLocaleString ? trueRows.toLocaleString("en-US") : trueRows}. Per-loop time looks trivial — multiply by loops and it is the whole query. This is how a nested loop hides its cost.`
            : ratio >= 10
              ? `EXPLAIN ANALYZE on ${n.name}: estimated ${n.rows}, actual ${actualsFor(id)} — ${Math.round(ratio)}× off. This is the deepest node where estimate and reality diverge, so this node is the cause; everything above it is a symptom.`
              : `EXPLAIN ANALYZE on ${n.name}: estimated ${n.rows}, actual ${actualsFor(id)} — the estimate holds, so this node is doing what the planner expected.`),
          phase: "execute",
          focus: [id],
          state: snap({ stage: "execute", actualMode: true, aTotal: est.aTotal, bTotal: est.bTotal })
        };
      }

      const realBest = act.aTotal <= act.bTotal ? "A" : "B";
      yield {
        label: stale
          ? `Verdict: the planner chose plan ${chosen} for ${estRows} rows, but reality was ${trueRows} — the right plan was ${realBest} (true cost ${realBest === "A" ? act.aTotal : act.bTotal} vs ${chosen === "A" ? act.aTotal : act.bTotal}). Nothing was wrong with the SQL or the index. Run ANALYZE, and add extended statistics if the columns are correlated.`
          : `Verdict: stats were accurate, so plan ${chosen} really is the cheaper one here (${chosen === "A" ? act.aTotal : act.bTotal} vs ${chosen === "A" ? act.bTotal : act.aTotal}). Change random_page_cost to 1.1 for SSD and watch plan A's cost fall — the cost model is an assumption about your hardware.`,
        phase: "done",
        state: snap({ stage: "done", actualMode: true, aTotal: act.aTotal, bTotal: act.bTotal })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const fmt = (v) => {
        const n = Math.round(v);
        let str = String(n), out = "", cnt = 0;
        for (let i = str.length - 1; i >= 0; i--) {
          out = str[i] + out; cnt++;
          if (cnt % 3 === 0 && i > 0) out = "," + out;
        }
        return out;
      };

      const pad = 16;
      const headTop = 16;
      const panelBottom = 118;             // bottom cost panel height
      const treeTop = 92;
      const treeBottom = H - panelBottom;
      const halfW = (W - pad * 3) / 2;

      // ---------------- header ---------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`orders (${fmt(s.R)} rows) ⋈ customers (${fmt(s.S)})  ·  WHERE region='EU' AND created_at >= now()-1d  ·  ORDER BY amount DESC LIMIT 20`, pad, headTop + 4);

      // histogram strip
      const hx = pad, hy = headTop + 16, hw = 220, hh = 26;
      for (let i = 0; i < 8; i++) {
        const bw = hw / 8;
        const on = i < s.histo;
        ctx.fillStyle = on ? C.viz7 : C.surface2;
        ctx.globalAlpha = on ? 0.8 : 0.5;
        ctx.fillRect(hx + i * bw, hy, bw - 2, hh);
        ctx.globalAlpha = 1;
      }
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("pg_stats histogram", hx, hy + hh + 12);

      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = s.stale ? C.warn : C.text2;
      ctx.fillText(`estimated rows: ${fmt(s.estRows)}`, hx + hw + 20, hy + 11);
      ctx.fillStyle = s.actualMode ? (s.stale ? C.danger : C.viz3) : C.muted;
      ctx.fillText(s.actualMode ? `actual rows: ${fmt(s.trueRows)}` : `actual rows: (run ANALYZE to see)`, hx + hw + 20, hy + 26);
      ctx.fillStyle = C.muted;
      ctx.fillText(`random_page_cost = ${s.rpc}`, hx + hw + 220, hy + 11);
      if (s.stale) {
        ctx.fillStyle = C.warn;
        ctx.fillText(`stale statistics`, hx + hw + 220, hy + 26);
      }

      // ---------------- plan trees --------------------------------------------------
      const drawPlan = (planId, px, title) => {
        const nodes = s.nodes.filter((n) => n.plan === planId);
        const maxRow = 4;
        const rowH = Math.min(58, (treeBottom - treeTop - 24) / (maxRow + 1));
        const colW = halfW / 2;
        const boxW = Math.min(colW * 0.95, 190);
        const boxH = Math.min(42, rowH - 10);
        const pos = {};
        for (const n of nodes) {
          const x = px + n.col * colW + (colW - boxW) / 2;
          const y = treeTop + 22 + n.row * rowH;
          pos[n.id] = { x: x, y: y, w: boxW, h: boxH };
        }
        const isChosen = s.chosen === planId;

        // title
        ctx.textAlign = "left";
        ctx.fillStyle = isChosen ? C.viz3 : s.chosen ? C.muted : C.text2;
        ctx.font = `12px ${env.font.base}`;
        ctx.fillText(title + (isChosen ? "   ← chosen" : s.chosen ? "   (rejected)" : ""), px, treeTop + 8);

        // edges
        for (const e of s.edges) {
          const a = pos[e[0]], b = pos[e[1]];
          if (!a || !b) continue;
          const na = s.nodes.find((n) => n.id === e[0]);
          const nb = s.nodes.find((n) => n.id === e[1]);
          if (!na.shown || !nb.shown) continue;
          ctx.strokeStyle = isChosen ? C.viz3 : C.border;
          ctx.lineWidth = isChosen ? 1.6 : 1;
          ctx.beginPath();
          ctx.moveTo(a.x + a.w / 2, a.y + a.h);
          ctx.lineTo(b.x + b.w / 2, b.y);
          ctx.stroke();
        }

        for (const n of nodes) {
          if (!n.shown) continue;
          const p = pos[n.id];
          const bad = n.actual != null && n.rows > 0 && n.actual / n.rows >= 10;
          ctx.fillStyle = C.surface2;
          ctx.globalAlpha = s.chosen && !isChosen ? 0.4 : 0.9;
          ctx.beginPath();
          ctx.roundRect(p.x, p.y, p.w, p.h, 5);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = bad ? C.danger : isChosen ? C.viz3 : C.border;
          ctx.lineWidth = bad ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1, 5);
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.fillStyle = s.chosen && !isChosen ? C.muted : C.text;
          ctx.font = `11px ${env.font.mono}`;
          ctx.fillText(n.name, p.x + 8, p.y + 14);
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillStyle = C.muted;
          if (n.detail) ctx.fillText(n.detail.slice(0, 30), p.x + 8, p.y + 26);
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillStyle = C.viz4;
          ctx.fillText(`cost=${fmt(n.cost)} rows=${fmt(n.rows)}`, p.x + 8, p.y + 38);
          if (n.actual != null) {
            ctx.textAlign = "right";
            ctx.fillStyle = bad ? C.danger : C.viz3;
            ctx.fillText(`actual ${fmt(n.actual)}`, p.x + p.w - 8, p.y + 38);
          }
        }
      };

      drawPlan("A", pad, "Plan A — Nested Loop + Index Scans");
      drawPlan("B", pad * 2 + halfW, "Plan B — Hash Join + Seq Scans");

      // ---------------- cost panel ---------------------------------------------------
      const py = H - panelBottom + 6;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, py - 6); ctx.lineTo(W - pad, py - 6);
      ctx.stroke();

      // bars
      const maxCost = Math.max(1, s.aTotal, s.bTotal);
      const barW = halfW * 0.9;
      ctx.textAlign = "left";
      ctx.font = `10px ${env.font.mono}`;
      const bars = [
        { label: "plan A total", v: s.aTotal, c: s.chosen === "A" ? C.viz3 : C.viz1 },
        { label: "plan B total", v: s.bTotal, c: s.chosen === "B" ? C.viz3 : C.viz1 }
      ];
      for (let i = 0; i < bars.length; i++) {
        const by = py + 8 + i * 26;
        ctx.fillStyle = C.muted;
        ctx.fillText(bars[i].label, pad, by + 11);
        ctx.fillStyle = C.surface2;
        ctx.fillRect(pad + 80, by, barW - 80, 14);
        ctx.fillStyle = bars[i].c;
        ctx.fillRect(pad + 80, by, Math.max(2, (barW - 80) * (bars[i].v / maxCost)), 14);
        ctx.fillStyle = C.text2;
        ctx.fillText(fmt(bars[i].v), pad + 86 + (barW - 80) * (bars[i].v / maxCost), by + 11);
      }
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("cost units (seq_page_cost = 1.0) — comparable between plans, not between queries", pad, py + 70);

      // crossover curve
      const cx0 = pad * 2 + halfW, cy0 = py + 4, cw = halfW * 0.92, ch = panelBottom - 26;
      ctx.strokeStyle = C.axis;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0); ctx.lineTo(cx0, cy0 + ch); ctx.lineTo(cx0 + cw, cy0 + ch);
      ctx.stroke();
      if (s.curve.length > 1) {
        let mx = 1, mv = 1;
        for (const p of s.curve) { mx = Math.max(mx, p.sel); mv = Math.max(mv, p.a, p.b); }
        const X = (v) => cx0 + (v / mx) * cw;
        const Y = (v) => cy0 + ch - (v / mv) * ch;
        for (const key of ["a", "b"]) {
          ctx.strokeStyle = key === "a" ? C.viz1 : C.viz5;
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          for (let i = 0; i < s.curve.length; i++) {
            const p = s.curve[i];
            if (i === 0) ctx.moveTo(X(p.sel), Y(p[key])); else ctx.lineTo(X(p.sel), Y(p[key]));
          }
          ctx.stroke();
        }
        ctx.fillStyle = C.viz1;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText("A nested loop", cx0 + 6, cy0 + 12);
        ctx.fillStyle = C.viz5;
        ctx.fillText("B hash join", cx0 + 6, cy0 + 26);
        // current selectivity marker
        const px2 = X(Math.min(mx, s.selPerMil));
        ctx.strokeStyle = C.viz4;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px2, cy0); ctx.lineTo(px2, cy0 + ch);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.viz4;
        ctx.textAlign = "center";
        ctx.fillText(`${s.selPerMil}/10k`, px2, cy0 + ch + 12);
      }
      ctx.textAlign = "right";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("cost vs selectivity", cx0 + cw, cy0 + 12);
    }
  },

  drill: {
    cards: [
      { q: "What is the first thing you look at in EXPLAIN ANALYZE?", a: "Estimated `rows=` vs `actual rows=` on every node. The deepest node where they diverge by ~10× or more is the cause; everything above it is a symptom.", tags: ["explain"] },
      { q: "What does `loops=N` mean and why does it matter?", a: "The node ran N times as the inner side of a nested loop. Reported time and rows are per loop, so real cost = time × loops. It's how a nested loop hides seconds of work.", tags: ["explain"] },
      { q: "Where do selectivity estimates come from?", a: "ANALYZE's samples: most-common-values + frequencies, an equi-depth histogram, n_distinct, null fraction and correlation, stored in pg_stats. Multiple predicates are multiplied assuming independence.", tags: ["statistics"] },
      { q: "Why is `WHERE city='Paris' AND country='FR'` underestimated?", a: "Independence assumption: sel(city) × sel(country), though city determines country. Fix with `CREATE STATISTICS ... (dependencies, ndistinct) ON city, country`.", tags: ["statistics"] },
      { q: "Is Postgres cost in milliseconds?", a: "No — arbitrary units with seq_page_cost = 1.0. Comparable between candidate plans for the same query; meaningless across queries or machines.", tags: ["cost-model"] },
      { q: "Why lower random_page_cost on SSD?", a: "The default 4.0 assumes a seek-bound spinning disk, making index scans look ~4× more expensive than they are on flash. 1.1 is the usual SSD value and makes the planner willing to use indexes.", tags: ["tuning"] },
      { q: "When are `enable_nestloop = off` and friends appropriate?", a: "Diagnosis only — to prove the alternative plan is faster and therefore the cost model or the statistics are wrong. Shipping it freezes a decision that will be wrong after the next data change.", tags: ["tuning"] },
      { q: "What do `Rows Removed by Filter` and `Batches: 8` tell you?", a: "The first: a predicate applied after fetching rows that could have been an index condition. The second: the hash join's build side exceeded work_mem and spilled to temp files.", tags: ["explain"] }
    ],
    sixtySecond: [
      "Walk through how Postgres decides between an index scan and a sequential scan, and where the crossover comes from.",
      "You are handed a slow query and its EXPLAIN ANALYZE output. Describe your diagnostic order and what each signal tells you."
    ]
  }
};
