export default {
  id: "sql-execution",
  track: "db",
  title: "Logical SQL Execution Order",
  difficulty: 1,
  minutes: 12,
  tags: ["sql", "query-semantics", "aggregation"],

  explainer: [
    { type: "p", text: "When you write a SQL query, you type the clauses in the order that reads naturally to a human — `SELECT` first, because that is the part that says what you actually want to see. But the database does not evaluate the query in that order at all. It cannot decide which columns to show you until it has already gone and found the rows, filtered out the ones you don't want, and possibly grouped them together. So internally, the database works through the query starting from `FROM` — the part that says which table the data comes from — and only reaches `SELECT` near the very end. This mismatch between the order you *write* a query and the order the database *evaluates* it is the source of almost every confusing SQL error you will ever hit: a column that 'does not exist' even though it is sitting right there in your SELECT list, an alias (a temporary nickname you gave a column, like `AS total`) that the database claims not to recognize, or a complaint that you cannot use an aggregate function (a function such as `SUM` or `COUNT` that combines many rows into a single number) in a place you tried to use it. Once you know the real evaluation order, every one of these errors becomes predictable instead of mysterious." },
    { type: "h3", text: "The logical order — the sequence the database actually thinks in" },
    { type: "list", items: [
      "**FROM / JOIN** — gather the source rows first. The technical word for this is that the database *materialises* the rows, meaning it produces the actual working set of rows in memory. Every clause after this one only ever gets to see what this step produced — it can never reach back and grab something FROM didn't include.",
      "**WHERE** — filter individual *rows*, one at a time, before any grouping happens. Because grouping hasn't happened yet, WHERE has no idea what a SUM or a COUNT even is — you cannot reference an aggregate function here.",
      "**GROUP BY** — collapse many rows into one row per group. This is a genuine turning point in the query: after this step, the individual rows are gone for good. All that survives is the grouping key (e.g. `region`) and whatever aggregates you computed (e.g. `SUM(amount)`).",
      "**HAVING** — filter *groups*, not rows, and it runs after GROUP BY. This is the only place `SUM(x) > 300` is allowed to live, because SUM only exists once grouping has happened.",
      "**SELECT** — actually compute the columns you asked for, and this is the moment column aliases (nicknames given with `AS`) come into existence. That is exactly why `WHERE total > 5` fails — WHERE runs before SELECT, so `total` doesn't exist yet — but `ORDER BY total` works fine, because ORDER BY runs after SELECT.",
      "**DISTINCT** — remove duplicate rows from whatever SELECT just produced.",
      "**ORDER BY** — sort the result. It is the only clause that can see both the raw columns and the aliases SELECT just created.",
      "**LIMIT / OFFSET** — cut the sorted result down to the number of rows you asked for. This always happens last."
    ]},
    { type: "callout", tone: "tip", text: "The short version that lands well in an interview: *WHERE filters rows before grouping happens; HAVING filters groups after grouping happens. If your condition mentions an aggregate function like SUM or COUNT, it has to go in HAVING. If it doesn't, put it in WHERE instead, so fewer rows ever reach the (more expensive) grouping step.*" },
    { type: "h3", text: "Why this matters for speed, not just for getting the syntax right" },
    { type: "p", text: "The order described above is the *logical* order — it describes what answer the query must produce, not literally the steps the database takes to compute it. The query planner (the part of the database that decides how to physically execute your query) is free to reorder or combine steps in any way it can prove gives the same answer, and it often does. But what it can prove is limited. If your `HAVING` condition only mentions columns you already grouped by, the planner can usually rewrite it as an earlier `WHERE` filter automatically, which is cheap. But if your `HAVING` condition mentions a column that isn't part of the grouping key, the planner usually cannot do that rewrite — so it ends up grouping millions of rows together, computing every aggregate, and only then throwing most of the results away. Writing the filter in `WHERE` yourself whenever possible avoids relying on the planner to make that leap." },
    { type: "callout", tone: "pitfall", text: "`LIMIT 10` without an `ORDER BY` does not mean \"the first 10 rows\" the way it sounds — there is no defined 'first' without a sort order, so it really means *some ten rows, chosen however the database happened to produce them*. Which ten rows you get can change between runs, for instance if the database's internal execution plan changes or the physical layout of the data changes. Any pagination logic built on `LIMIT`/`OFFSET` without a stable `ORDER BY` will end up silently skipping some rows and showing duplicates of others." },
    { type: "h3", text: "Window functions run in a specific, easy-to-forget spot" },
    { type: "p", text: "A window function — something like `ROW_NUMBER() OVER (...)`, which numbers or ranks rows without collapsing them the way GROUP BY does — is evaluated after `HAVING` and before `ORDER BY`/`DISTINCT`. Because of that exact position in the order, you cannot write `WHERE rn = 1` or `HAVING rn = 1` to filter on a window function's result — at the time WHERE and HAVING run, the window function hasn't been computed yet. The fix is to wrap the whole query in a subquery or a CTE (a named temporary result set you define with `WITH ... AS (...)`) and apply the filter in an outer query, after the window function has already run. This one fact answers a question interviewers ask constantly." }
  ],

  glossary: [
    { term: "clause", plain: "One of the keyword-introduced parts of a SQL query — SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY, and so on." },
    { term: "predicate", plain: "A true/false condition in a query, like `status = 'paid'` — it decides whether a row or group is kept or thrown away." },
    { term: "aggregate function", plain: "A function like SUM, COUNT, AVG, MIN, or MAX that combines many rows into a single number." },
    { term: "alias", plain: "A temporary nickname given to a column or table in a query, usually with `AS`, so you can refer to it more conveniently elsewhere in the query." },
    { term: "materialise", plain: "To actually produce and hold a set of rows in memory or on disk, as opposed to just describing them abstractly." },
    { term: "query planner / optimiser", plain: "The part of the database that decides the actual physical steps to run a query — which scans, which order, which algorithms — while still producing the answer the logical order requires." },
    { term: "window function", plain: "A function such as `ROW_NUMBER()` or `RANK()` that computes a value per row using a group of related rows (a 'window'), without collapsing those rows into one the way GROUP BY does." },
    { term: "CTE (Common Table Expression)", plain: "A named, temporary result set you define at the top of a query with `WITH name AS (...)`, which you can then reference like a table later in the same query." },
    { term: "top-N heap", plain: "A small, size-limited data structure the database can use to keep only the best N rows seen so far while scanning, instead of sorting the entire result set — much cheaper when you only need the top few rows." },
    { term: "selectivity", plain: "How much a condition narrows down the rows — a highly selective condition matches very few rows out of the whole table." }
  ],

  complexity: {
    rows: [
      { operation: "FROM (seq scan)", time: "O(R)", space: "O(1)", note: "R = rows in the table" },
      { operation: "WHERE", time: "O(R)", space: "O(1)", note: "streams; selectivity s leaves sR rows" },
      { operation: "GROUP BY (hash)", time: "O(sR)", space: "O(G)", note: "G = distinct groups; spills to disk if G is large" },
      { operation: "GROUP BY (sort)", time: "O(sR log sR)", space: "O(sR)", note: "chosen when input is already sorted or G is huge" },
      { operation: "ORDER BY", time: "O(G log G)", space: "O(G)", note: "top-N heap when a LIMIT is present" },
      { operation: "LIMIT n", time: "O(n)", space: "O(1)", note: "with ORDER BY, enables a bounded top-N sort" }
    ]
  },

  interview: {
    whyAsked: "It separates people who have written SQL from people who have only read it. The signal is whether you reason about a query as a pipeline of row-sets rather than as one magic incantation — which is the same skill that lets you debug a wrong result or a slow plan.",
    followUps: [
      { q: "Why can't I use a SELECT alias in the WHERE clause?", a: "Aliases are created by the SELECT clause, which is evaluated after WHERE, so at WHERE-time the name does not exist yet. ORDER BY runs after SELECT, which is why the same alias works there. Postgres and most engines let you repeat the expression in WHERE, or wrap it in a subquery/CTE and filter outside." },
      { q: "What's the difference between WHERE and HAVING?", a: "WHERE filters individual rows before grouping; HAVING filters whole groups after aggregation. Anything that does not reference an aggregate should go in WHERE, because it reduces the number of rows the grouping has to process. `WHERE status='paid'` then `HAVING SUM(amount) > 300` is the canonical pairing." },
      { q: "Why does adding a column to SELECT break my GROUP BY?", a: "After GROUP BY, each output row represents many input rows, so a bare column is ambiguous unless it is functionally dependent on the grouping key. Postgres allows bare columns only when you group by the table's primary key; otherwise you must aggregate it (`MAX(x)`) or add it to GROUP BY. MySQL historically allowed it and returned an arbitrary value, which is a genuine data bug." },
      { q: "How do you filter on the result of a window function?", a: "You cannot do it in WHERE or HAVING, because window functions are evaluated after both. Push the query into a CTE or subquery and filter in the outer query: `WITH ranked AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY ts DESC) rn FROM events) SELECT * FROM ranked WHERE rn = 1;` — that is also the standard 'latest row per group' pattern." },
      { q: "Is LIMIT 10 without ORDER BY deterministic?", a: "No. It returns ten arbitrary rows, and which ten can change with the plan, with concurrent updates, or after a VACUUM moves tuples. For pagination, always order by a unique, stable key — and prefer keyset pagination (`WHERE (ts, id) < (?, ?) ORDER BY ts DESC, id DESC LIMIT 20`) over OFFSET, which re-scans and discards everything before the offset." },
      { q: "Does the engine actually execute the clauses in this order?", a: "No — this is the logical semantics the result must be equivalent to. The optimiser reorders freely: it pushes predicates below joins, converts a sort+limit into a bounded top-N heap, and may compute the aggregate with a hash or a sort depending on statistics. The logical order tells you what the answer must be; EXPLAIN tells you how it was actually obtained." }
    ]
  },

  code: [
    { lang: "sql", label: "The query the visualizer runs", code: "-- Logical order: FROM -> WHERE -> GROUP BY -> HAVING -> SELECT -> ORDER BY -> LIMIT\nSELECT   region,\n         COUNT(*)     AS n,\n         SUM(amount)  AS total\nFROM     orders                      -- 1. 14 rows\nWHERE    status = 'paid'             -- 2. row filter  -> 9 rows\nGROUP BY region                      -- 3. collapse    -> 4 groups\nHAVING   SUM(amount) > 300           -- 4. group filter-> 3 groups\nORDER BY total DESC                  -- 6. sort (can see the alias)\nLIMIT    2;                          -- 7. cut" },
    { lang: "sql", label: "The three classic errors", code: "-- ERROR: column \"total\" does not exist\n--   the SELECT alias is not created until after WHERE runs\nSELECT region, SUM(amount) AS total\nFROM orders\nWHERE total > 300\nGROUP BY region;\n\n-- ERROR: aggregate functions are not allowed in WHERE\nSELECT region FROM orders WHERE SUM(amount) > 300 GROUP BY region;\n\n-- ERROR: column \"orders.customer\" must appear in the GROUP BY clause\n--   after grouping, a bare row-level column is ambiguous\nSELECT region, customer, SUM(amount) FROM orders GROUP BY region;\n\n-- Correct: row predicate in WHERE, group predicate in HAVING,\n--          alias reused only in ORDER BY.\nSELECT region, SUM(amount) AS total\nFROM orders\nWHERE status = 'paid'\nGROUP BY region\nHAVING SUM(amount) > 300\nORDER BY total DESC;" },
    { lang: "sql", label: "Filtering a window function needs a wrapper", code: "-- Window functions run after HAVING, so this fails:\n--   SELECT *, ROW_NUMBER() OVER (...) rn FROM events WHERE rn = 1;\n\n-- Latest event per user -- the canonical wrapped form:\nWITH ranked AS (\n  SELECT e.*,\n         ROW_NUMBER() OVER (PARTITION BY user_id\n                            ORDER BY created_at DESC, id DESC) AS rn\n  FROM   events e\n  WHERE  created_at >= now() - interval '30 days'   -- pushed down: cheap\n)\nSELECT user_id, id, created_at\nFROM   ranked\nWHERE  rn = 1;                                       -- filtered outside" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.55, maxFrames: 160 },

    params: [
      { key: "minTotal", label: "HAVING SUM(amount) >", type: "int", min: 0, max: 600, default: 300 },
      { key: "limit", label: "LIMIT", type: "int", min: 1, max: 4, default: 2 },
      { key: "status", label: "WHERE status =", type: "enum", options: ["paid", "any"], default: "paid" }
    ],

    frames: function* (params, rng) {
      const base = [
        { id: 1, customer: "Ana", region: "EU", amount: 120, status: "paid" },
        { id: 2, customer: "Ben", region: "NA", amount: 90, status: "paid" },
        { id: 3, customer: "Cleo", region: "EU", amount: 240, status: "refunded" },
        { id: 4, customer: "Dev", region: "APAC", amount: 60, status: "paid" },
        { id: 5, customer: "Eve", region: "NA", amount: 310, status: "paid" },
        { id: 6, customer: "Finn", region: "EU", amount: 180, status: "paid" },
        { id: 7, customer: "Gus", region: "APAC", amount: 200, status: "paid" },
        { id: 8, customer: "Hana", region: "NA", amount: 75, status: "pending" },
        { id: 9, customer: "Ivo", region: "EU", amount: 95, status: "paid" },
        { id: 10, customer: "Jo", region: "APAC", amount: 40, status: "failed" },
        { id: 11, customer: "Kit", region: "NA", amount: 150, status: "paid" },
        { id: 12, customer: "Lee", region: "EU", amount: 30, status: "paid" },
        { id: 13, customer: "Mia", region: "LATAM", amount: 220, status: "paid" },
        { id: 14, customer: "Nils", region: "LATAM", amount: 190, status: "paid" }
      ];
      const minTotal = params.minTotal;
      const lim = params.limit;
      const wantPaid = params.status === "paid";
      const clauses = ["FROM", "WHERE", "GROUP BY", "HAVING", "SELECT", "ORDER BY", "LIMIT"];

      // rows carry per-stage marks: keep = true|false|null (null = not yet tested)
      let rows = base.map((r) => ({ id: r.id, customer: r.customer, region: r.region, amount: r.amount, status: r.status, keep: null }));
      const snapRows = () => rows.map((r) => ({ id: r.id, customer: r.customer, region: r.region, amount: r.amount, status: r.status, keep: r.keep }));

      let groups = [];
      const snapGroups = () => groups.map((g) => ({ region: g.region, n: g.n, total: g.total, members: g.members.slice(), keep: g.keep }));

      const st = (stage, clauseIdx, extra) => {
        const s = {
          stage: stage,
          clauseIdx: clauseIdx,
          rows: snapRows(),
          groups: snapGroups(),
          view: extra && extra.view ? extra.view : (groups.length ? "groups" : "rows"),
          cursorRow: extra && extra.cursorRow != null ? extra.cursorRow : -1,
          cursorGroup: extra && extra.cursorGroup != null ? extra.cursorGroup : -1,
          projected: extra && extra.projected ? extra.projected : false,
          rowsIn: extra && extra.rowsIn != null ? extra.rowsIn : 0,
          rowsOut: extra && extra.rowsOut != null ? extra.rowsOut : 0,
          minTotal: minTotal,
          lim: lim,
          statusPred: wantPaid ? "'paid'" : "any",
          clauses: clauses.slice()
        };
        return s;
      };

      yield {
        label: `The query as written reads SELECT-first, but nothing can be selected until the rows exist. Execution starts at the bottom: FROM orders.`,
        phase: "read",
        state: st("read", -1, { view: "rows", rowsIn: 0, rowsOut: 0 })
      };

      // ---- FROM -------------------------------------------------------------
      rows = rows.map((r) => ({ ...r, keep: true }));
      yield {
        label: `FROM orders materialises all ${rows.length} rows. Every later clause can only remove or reshape what this step produced — it can never invent a row.`,
        phase: "FROM",
        state: st("from", 0, { view: "rows", rowsIn: 14, rowsOut: 14 })
      };

      // ---- WHERE ------------------------------------------------------------
      yield {
        label: `WHERE runs next — before grouping. It sees one row at a time and knows nothing about SUM or COUNT, which is exactly why aggregates are illegal here.`,
        phase: "WHERE",
        state: st("where", 1, { view: "rows", rowsIn: 14, rowsOut: 14 })
      };
      let kept = 0;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const pass = wantPaid ? r.status === "paid" : true;
        rows = rows.map((x, j) => (j === i ? { ...x, keep: pass } : x));
        if (pass) kept++;
        yield {
          label: pass
            ? `row ${r.id} (${r.customer}, ${r.region}, ${r.amount}): status='${r.status}' passes the predicate — kept. ${kept} kept so far.`
            : `row ${r.id} (${r.customer}, ${r.region}, ${r.amount}): status='${r.status}' ≠ 'paid' — dropped here, so the ${r.amount} never reaches SUM().`,
          phase: "WHERE",
          focus: [i],
          state: st("where", 1, { view: "rows", cursorRow: i, rowsIn: 14, rowsOut: kept })
        };
      }
      const survivors = rows.filter((r) => r.keep);
      yield {
        label: `WHERE kept ${survivors.length} of 14 rows. Filtering before the group-by is the single cheapest optimisation in SQL: the grouping step now handles ${survivors.length} rows instead of 14.`,
        phase: "WHERE",
        state: st("where-done", 1, { view: "rows", rowsIn: 14, rowsOut: survivors.length })
      };

      // ---- GROUP BY ---------------------------------------------------------
      yield {
        label: `GROUP BY region collapses rows into one output row per distinct region. After this step the individual rows are gone — only the key and the aggregates survive.`,
        phase: "GROUP BY",
        state: st("group", 2, { view: "rows", rowsIn: survivors.length, rowsOut: 0 })
      };
      for (let i = 0; i < survivors.length; i++) {
        const r = survivors[i];
        let g = groups.find((x) => x.region === r.region);
        if (!g) {
          g = { region: r.region, n: 0, total: 0, members: [], keep: true };
          groups = groups.concat([g]);
        }
        g = { ...g, n: g.n + 1, total: g.total + r.amount, members: g.members.concat([r.id]) };
        groups = groups.map((x) => (x.region === r.region ? g : x));
        const gi = groups.findIndex((x) => x.region === r.region);
        yield {
          label: `row ${r.id} (${r.amount}) lands in group ${r.region}: COUNT=${g.n}, SUM=${g.total}. The hash table holds one accumulator per group, not one per row.`,
          phase: "GROUP BY",
          focus: [gi],
          state: st("group", 2, { view: "groups", cursorGroup: gi, rowsIn: survivors.length, rowsOut: groups.length })
        };
      }
      yield {
        label: `${survivors.length} rows became ${groups.length} groups: ${groups.map((g) => g.region + "=" + g.total).join(", ")}. This is the reshape — the row-set changed *shape*, not just size.`,
        phase: "GROUP BY",
        state: st("group-done", 2, { view: "groups", rowsIn: survivors.length, rowsOut: groups.length })
      };

      // ---- HAVING -----------------------------------------------------------
      yield {
        label: `HAVING filters *groups*, and it is the first clause that can legally mention SUM(amount) — the sums only exist now.`,
        phase: "HAVING",
        state: st("having", 3, { view: "groups", rowsIn: groups.length, rowsOut: groups.length })
      };
      let gkept = 0;
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const pass = g.total > minTotal;
        groups = groups.map((x, j) => (j === i ? { ...x, keep: pass } : x));
        if (pass) gkept++;
        yield {
          label: pass
            ? `group ${g.region}: SUM=${g.total} > ${minTotal} — the whole group survives (all ${g.n} of its rows are represented by this one output row).`
            : `group ${g.region}: SUM=${g.total} ≤ ${minTotal} — the entire group is discarded. Note we still had to read and aggregate its ${g.n} rows to find that out.`,
          phase: "HAVING",
          focus: [i],
          state: st("having", 3, { view: "groups", cursorGroup: i, rowsIn: groups.length, rowsOut: gkept })
        };
      }
      groups = groups.filter((g) => g.keep);
      yield {
        label: `HAVING left ${groups.length} group${groups.length === 1 ? "" : "s"}. A predicate on a plain column would have belonged in WHERE; this one names an aggregate, so it can only run here.`,
        phase: "HAVING",
        state: st("having-done", 3, { view: "groups", rowsIn: gkept, rowsOut: groups.length })
      };

      // ---- SELECT -----------------------------------------------------------
      yield {
        label: `SELECT region, COUNT(*) AS n, SUM(amount) AS total — the projection runs now, and this is the moment the alias "total" is born. That is why WHERE total > ${minTotal} would have failed.`,
        phase: "SELECT",
        state: st("select", 4, { view: "groups", projected: true, rowsIn: groups.length, rowsOut: groups.length })
      };

      // ---- ORDER BY ---------------------------------------------------------
      const sorted = groups.slice().sort((a, b) => b.total - a.total);
      groups = sorted;
      yield {
        label: `ORDER BY total DESC sorts the projected rows. ORDER BY runs after SELECT, so it can use the alias — the one place an alias is legal outside SELECT itself.`,
        phase: "ORDER BY",
        state: st("order", 5, { view: "groups", projected: true, rowsIn: groups.length, rowsOut: groups.length })
      };

      // ---- LIMIT ------------------------------------------------------------
      const finalGroups = groups.slice(0, lim);
      groups = groups.map((g, i) => ({ ...g, keep: i < lim }));
      yield {
        label: `LIMIT ${lim} cuts last, after the sort. Because a LIMIT follows an ORDER BY, the planner can use a bounded top-${lim} heap instead of sorting everything — but only because the ORDER BY is there.`,
        phase: "LIMIT",
        state: st("limit", 6, { view: "groups", projected: true, rowsIn: groups.length, rowsOut: finalGroups.length })
      };
      groups = finalGroups;
      yield {
        label: `Result: ${finalGroups.map((g) => g.region + " (n=" + g.n + ", total=" + g.total + ")").join("  ·  ")}. 14 rows → ${survivors.length} → ${gkept} groups → ${finalGroups.length}. Each clause only ever shrank or reshaped the set.`,
        phase: "done",
        state: st("done", 6, { view: "groups", projected: true, rowsIn: 14, rowsOut: finalGroups.length })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const padX = 18, padTop = 16;
      const railW = Math.min(240, W * 0.26);

      // ---------- clause rail -------------------------------------------------
      const boxH = Math.min(46, (H - padTop - 24) / 7 - 6);
      const gap = 6;
      const detail = [
        "materialise rows",
        "filter rows",
        "collapse -> groups",
        "filter groups",
        "project + alias",
        "sort",
        "cut"
      ];
      for (let i = 0; i < s.clauses.length; i++) {
        const y = padTop + i * (boxH + gap);
        const active = i === s.clauseIdx;
        const done = i < s.clauseIdx;
        ctx.fillStyle = active ? C.viz1 : C.surface2;
        ctx.globalAlpha = active ? 1 : done ? 0.75 : 0.35;
        ctx.beginPath();
        ctx.roundRect(padX, y, railW, boxH, 6);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = done ? C.viz3 : C.border;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(padX + 0.5, y + 0.5, railW - 1, boxH - 1, 6);
        ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = active ? C.text : done ? C.text2 : C.muted;
        ctx.font = `600 12px ${env.font.mono}`;
        ctx.fillText(s.clauses[i], padX + 10, y + 17);
        ctx.font = `10px ${env.font.base}`;
        ctx.fillStyle = active ? C.text2 : C.muted;
        ctx.fillText(detail[i], padX + 10, y + 31);
        if (done) {
          ctx.textAlign = "right";
          ctx.fillStyle = C.viz3;
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillText("done", padX + railW - 10, y + 17);
        }
        if (active) {
          ctx.textAlign = "right";
          ctx.fillStyle = C.text;
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillText(`${s.rowsIn} → ${s.rowsOut}`, padX + railW - 10, y + 17);
        }
      }

      // ---------- right pane --------------------------------------------------
      const tx = padX + railW + 22;
      const tw = W - tx - padX;
      let y = padTop + 4;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text2;
      ctx.font = `11px ${env.font.mono}`;

      if (s.view === "rows") {
        ctx.fillStyle = C.muted;
        ctx.fillText(`orders  —  intermediate row-set`, tx, y + 8);
        y += 20;
        const cols = [
          { k: "id", x: 0, w: 34, align: "left", head: "id" },
          { k: "customer", x: 38, w: 74, align: "left", head: "customer" },
          { k: "region", x: 116, w: 62, align: "left", head: "region" },
          { k: "amount", x: 182, w: 62, align: "right", head: "amount" },
          { k: "status", x: 250, w: 82, align: "left", head: "status" }
        ];
        const scale = Math.min(1, tw / 340);
        ctx.font = `${Math.round(10 * scale)}px ${env.font.mono}`;
        ctx.fillStyle = C.muted;
        for (const c of cols) {
          ctx.textAlign = c.align;
          ctx.fillText(c.head, tx + (c.align === "right" ? c.x + c.w : c.x) * scale, y);
        }
        y += 6;
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.moveTo(tx, y); ctx.lineTo(tx + 340 * scale, y);
        ctx.stroke();
        y += 4;

        const rowH = Math.min(24, (H - y - 20) / Math.max(1, s.rows.length));
        for (let i = 0; i < s.rows.length; i++) {
          const r = s.rows[i];
          const ry = y + i * rowH;
          const dropped = r.keep === false;
          if (i === s.cursorRow) {
            ctx.fillStyle = C.viz1;
            ctx.globalAlpha = 0.18;
            ctx.fillRect(tx - 4, ry, 348 * scale, rowH - 2);
            ctx.globalAlpha = 1;
          }
          ctx.font = `${Math.round(11 * scale)}px ${env.font.mono}`;
          for (const c of cols) {
            ctx.textAlign = c.align;
            const v = String(r[c.k]);
            if (dropped) ctx.fillStyle = C.muted;
            else if (i === s.cursorRow) ctx.fillStyle = C.text;
            else if (r.keep === true) ctx.fillStyle = C.text2;
            else ctx.fillStyle = C.muted;
            if (!dropped && c.k === "status" && r.status === "paid") ctx.fillStyle = i === s.cursorRow ? C.text : C.viz3;
            ctx.fillText(v, tx + (c.align === "right" ? c.x + c.w : c.x) * scale, ry + rowH * 0.68);
          }
          if (dropped) {
            ctx.strokeStyle = C.viz8;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(tx - 2, ry + rowH * 0.5);
            ctx.lineTo(tx + 336 * scale, ry + rowH * 0.5);
            ctx.stroke();
            ctx.textAlign = "left";
            ctx.fillStyle = C.viz8;
            ctx.font = `${Math.round(9 * scale)}px ${env.font.mono}`;
            ctx.fillText("dropped by WHERE", tx + 344 * scale, ry + rowH * 0.68);
          }
        }
      } else {
        ctx.fillStyle = C.muted;
        ctx.fillText(s.projected ? `projected result — region, n, total` : `group accumulators (one per distinct region)`, tx, y + 8);
        y += 24;
        const rowH = Math.min(58, (H - y - 30) / Math.max(1, s.groups.length));
        for (let i = 0; i < s.groups.length; i++) {
          const g = s.groups[i];
          const gy = y + i * rowH;
          const dropped = g.keep === false;
          ctx.fillStyle = i === s.cursorGroup ? C.viz1 : dropped ? C.surface2 : C.surface2;
          ctx.globalAlpha = dropped ? 0.4 : i === s.cursorGroup ? 0.28 : 0.9;
          ctx.beginPath();
          ctx.roundRect(tx, gy, tw - 8, rowH - 8, 6);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = dropped ? C.viz8 : i === s.cursorGroup ? C.viz1 : C.border;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(tx + 0.5, gy + 0.5, tw - 9, rowH - 9, 6);
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.fillStyle = dropped ? C.muted : C.text;
          ctx.font = `600 13px ${env.font.mono}`;
          ctx.fillText(g.region, tx + 12, gy + 20);
          ctx.font = `12px ${env.font.mono}`;
          ctx.fillStyle = dropped ? C.muted : C.text2;
          ctx.fillText(`n = ${g.n}`, tx + 92, gy + 20);
          ctx.fillStyle = dropped ? C.muted : C.viz4;
          ctx.fillText(`total = ${g.total}`, tx + 156, gy + 20);
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = C.muted;
          ctx.fillText(`from rows [${g.members.join(", ")}]`, tx + 12, gy + 36);
          if (dropped) {
            ctx.textAlign = "right";
            ctx.fillStyle = C.viz8;
            ctx.font = `10px ${env.font.mono}`;
            ctx.fillText(s.stage === "limit" || s.stage === "done" ? "cut by LIMIT" : `HAVING: ${g.total} ≤ ${s.minTotal}`, tx + tw - 20, gy + 20);
          }
        }
      }

      // footer counters
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`WHERE status = ${s.statusPred}   ·   HAVING SUM(amount) > ${s.minTotal}   ·   LIMIT ${s.lim}`, padX, H - 6);
    }
  },

  drill: {
    cards: [
      { q: "Name the logical execution order of a SQL SELECT.", a: "FROM/JOIN → WHERE → GROUP BY → HAVING → SELECT (incl. window functions) → DISTINCT → ORDER BY → LIMIT/OFFSET.", tags: ["order"] },
      { q: "Why can ORDER BY use a SELECT alias but WHERE cannot?", a: "Aliases are created by SELECT. ORDER BY runs after SELECT so the name exists; WHERE runs before it, so it doesn't.", tags: ["alias"] },
      { q: "WHERE vs HAVING — one sentence.", a: "WHERE filters rows before grouping (no aggregates allowed); HAVING filters groups after aggregation (aggregates required, or it belonged in WHERE).", tags: ["having"] },
      { q: "Where do window functions sit in the order?", a: "After HAVING, before DISTINCT/ORDER BY. So you cannot filter on one in WHERE or HAVING — wrap the query in a CTE/subquery and filter outside.", tags: ["windows"] },
      { q: "Is `LIMIT 10` without `ORDER BY` deterministic?", a: "No — ten arbitrary rows, and the set can change between runs. Pagination needs a total order on a unique key.", tags: ["pitfall"] },
      { q: "Why does `SELECT region, customer, SUM(amount) ... GROUP BY region` fail?", a: "After grouping, one output row stands for many input rows, so a bare `customer` is ambiguous. Aggregate it, add it to GROUP BY, or group by the PK it depends on.", tags: ["group-by"] },
      { q: "Is the logical order the same as the physical execution order?", a: "No. It defines the required result. The optimiser may push predicates down, choose hash vs sort aggregation, or turn ORDER BY + LIMIT into a top-N heap. EXPLAIN shows what really happened.", tags: ["planner"] },
      { q: "Given a predicate that mentions no aggregate, where should it go and why?", a: "In WHERE. It then runs before GROUP BY, so fewer rows are aggregated — same answer, strictly less work.", tags: ["performance"] }
    ],
    sixtySecond: [
      "Walk through the logical execution order of a SELECT with GROUP BY and HAVING, and explain which clause creates aliases.",
      "Explain why you cannot filter on a window function in WHERE, and show the wrapping pattern that fixes it."
    ]
  }
};
