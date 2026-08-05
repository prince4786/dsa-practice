export default {
  id: "index-selection",
  track: "db",
  title: "Index Selection & Covering Indexes",
  difficulty: 2,
  minutes: 16,
  tags: ["indexes", "composite-index", "sargability", "covering-index"],

  explainer: [
    { type: "p", text: "An index is only useful if the engine can turn your `WHERE` clause into a *contiguous key range* in the index. Everything about index design follows from that one sentence: column order matters, function calls kill it, and `OR` splits it." },
    { type: "h3", text: "The leftmost-prefix rule" },
    { type: "p", text: "An index on `(region, status, created_at)` sorts rows by region, then by status within a region, then by date within that. So it can serve a predicate on `region`, on `region + status`, or on all three — a prefix of the key. It **cannot** serve `WHERE status = 'paid'` alone: the paid rows are scattered across every region block, so there is no single range to seek to." },
    { type: "list", items: [
      "`region = 'EU'` → seek to the EU block. **Prefix length 1.**",
      "`region = 'EU' AND status = 'paid'` → seek to the EU/paid sub-block. **Prefix length 2.**",
      "`region = 'EU' AND created_at = X` → seeks on region only, then filters every EU row for the date. **Prefix length 1** — the gap at `status` stops the seek.",
      "`status = 'paid'` → **prefix length 0**: the index is useless, back to a sequential scan (unless the planner picks a much more expensive full index scan).",
      "**Range then equality is the same trap**: `region = 'EU' AND status > 'a' AND created_at = X`. A range predicate ends the usable prefix — equality columns must come first in the key."
    ]},
    { type: "h3", text: "Covering indexes and index-only scans" },
    { type: "p", text: "A normal index scan finds matching keys and then fetches each row from the heap — one random I/O per row. If every column the query needs is already in the index, the heap fetch disappears: Postgres calls it an **Index Only Scan**, SQL Server calls it a covering index. Postgres also has `INCLUDE (...)` to bolt payload columns onto the leaf without adding them to the sort key." },
    { type: "callout", tone: "warn", text: "In Postgres an Index Only Scan still needs the *visibility map* to say the heap page is all-visible — otherwise it must fetch the tuple to check MVCC visibility. A table that has not been vacuumed recently shows `Heap Fetches: <big number>` and the 'index only' scan is not actually cheap. Check that line in EXPLAIN ANALYZE." },
    { type: "h3", text: "Sargability — predicates that can seek" },
    { type: "list", items: [
      "`WHERE lower(email) = ?` — not sargable; needs an expression index on `lower(email)`.",
      "`WHERE created_at::date = '2024-01-01'` — not sargable; rewrite as a half-open range `>= '2024-01-01' AND < '2024-01-02'`.",
      "`WHERE amount / 100 > 5` — not sargable; move the arithmetic to the constant side.",
      "`WHERE name LIKE 'ab%'` — sargable (a prefix is a range). `LIKE '%ab'` is not; that needs a trigram index.",
      "`WHERE a = 1 OR b = 2` — two separate ranges; the planner may use a BitmapOr of two indexes, or give up and scan."
    ]},
    { type: "callout", tone: "pitfall", text: "Indexes are not free: every index multiplies write cost, occupies cache that the table itself wants, and must be maintained by VACUUM. The common production failure is not a missing index but *nine redundant ones* — if you have `(a)` and `(a, b)`, the single-column `(a)` is almost always dead weight." }
  ],

  complexity: {
    rows: [
      { operation: "Seq Scan, selectivity s", time: "O(R)", space: "O(1)", note: "reads every page; cheap per row, sequential I/O" },
      { operation: "Index Scan + heap fetch", time: "O(log n + sR)", space: "O(1)", note: "one random heap I/O per matched row" },
      { operation: "Index Only Scan", time: "O(log n + sR/f)", space: "O(1)", note: "no heap access when the visibility map is clean" },
      { operation: "Bitmap Index Scan", time: "O(log n + sR + P)", space: "O(P)", note: "P = heap pages; sorts row pointers to make heap I/O sequential" },
      { operation: "Crossover point", time: "—", space: "—", note: "index usually loses above ~5–20% selectivity" },
      { operation: "Write amplification", time: "O(k log n)", space: "—", note: "k = number of indexes touched per row change" }
    ]
  },

  interview: {
    whyAsked: "Index design is the highest-leverage database skill and it cannot be memorised — you have to reason about sort order and selectivity. The signal is whether you can explain the leftmost-prefix rule from first principles and know when a scan is *correctly* faster than an index.",
    followUps: [
      { q: "You have an index on (a, b, c). Which of these can use it: `b = 1`, `a = 1 AND c = 3`, `a > 1 AND b = 2`?", a: "`b = 1` cannot — b is not the leading column, so matching rows are scattered. `a = 1 AND c = 3` seeks on `a` only and then filters for c (or, in newer Postgres/MySQL, uses a skip-scan style filter inside the index). `a > 1 AND b = 2` seeks on the `a` range, but the b predicate cannot narrow it further because a range ends the usable prefix — put equality columns first." },
      { q: "When is a full table scan the right plan?", a: "When selectivity is poor. An index scan pays a random I/O per matched row, so above roughly 5–20% of the table the sequential scan wins outright — modern planners cost this explicitly. It is also right for tiny tables (everything is on one page) and for queries that need most columns of most rows, such as analytics aggregates." },
      { q: "What is a covering index and how do you know it worked?", a: "One that contains every column the query touches, so the engine never reads the heap. In Postgres you look for `Index Only Scan` plus `Heap Fetches: 0` in EXPLAIN ANALYZE; a nonzero count means the visibility map is stale and the scan is still doing random I/O. Use `INCLUDE (payload_cols)` to add payload without widening the sort key." },
      { q: "Why does column order in a composite index matter, and how do you choose it?", a: "The index is sorted lexicographically, so only a prefix of the key can bound a seek. Practical ordering: all equality-predicate columns first (most selective first is a decent tiebreak, but any order works for pure equality), then one range column, then any ORDER BY columns so the sort can be eliminated, then INCLUDE-only payload columns." },
      { q: "The query has an index but the planner ignores it. Why?", a: "Common causes: the predicate is not sargable (function or cast on the column), a type mismatch forces a coercion, statistics are stale so the planner thinks the predicate matches most of the table, the table is small enough that a scan is genuinely cheaper, or the query needs columns not in the index and the planner prefers one sequential pass to thousands of random fetches. `EXPLAIN (ANALYZE, BUFFERS)` plus `ANALYZE tbl` is the first debug step." },
      { q: "How do you decide whether to add an index at all?", a: "Look at the read side (pg_stat_statements: total time, calls, rows) and the write side (every index adds cost to every INSERT/UPDATE/DELETE and to VACUUM). Check `pg_stat_user_indexes.idx_scan` for indexes never used, and drop redundant prefixes — `(a)` is subsumed by `(a, b)`. Build with `CREATE INDEX CONCURRENTLY` in production." }
    ]
  },

  code: [
    { lang: "sql", label: "Composite + covering index", code: "-- Query we want to serve:\nSELECT id, amount\nFROM   orders\nWHERE  region = 'EU' AND status = 'paid'\nORDER BY created_at DESC\nLIMIT 20;\n\n-- Key order: equality columns first, then the ORDER BY column,\n-- then payload in INCLUDE so it does not widen the sort key.\nCREATE INDEX idx_orders_region_status_created\n  ON orders (region, status, created_at DESC)\n  INCLUDE (id, amount);\n\n-- Result: seek straight to the (EU, paid) block, walk 20 leaf entries\n-- in created_at order, never touch the heap.\n--   Limit  (cost=0.42..8.1 rows=20 width=12)\n--     ->  Index Only Scan using idx_orders_region_status_created on orders\n--           Index Cond: ((region = 'EU') AND (status = 'paid'))\n--           Heap Fetches: 0" },
    { lang: "sql", label: "Non-sargable predicates and their fixes", code: "-- BAD: function on the column -> no seek possible\nSELECT * FROM users WHERE lower(email) = 'a@b.com';\nCREATE INDEX idx_users_lower_email ON users (lower(email));   -- fix\n\n-- BAD: cast on the column\nSELECT * FROM events WHERE created_at::date = DATE '2024-01-01';\n-- GOOD: half-open range, index-friendly\nSELECT * FROM events\nWHERE created_at >= '2024-01-01' AND created_at < '2024-01-02';\n\n-- BAD: arithmetic on the column\nSELECT * FROM orders WHERE amount / 100 > 5;\nSELECT * FROM orders WHERE amount > 500;                      -- fix\n\n-- BAD: leading wildcard\nSELECT * FROM users WHERE name LIKE '%son';\nCREATE EXTENSION pg_trgm;\nCREATE INDEX idx_users_name_trgm ON users USING gin (name gin_trgm_ops);" },
    { lang: "sql", label: "Auditing indexes in production", code: "-- Never-used indexes (excluding constraint-backing ones)\nSELECT s.relname AS table, s.indexrelname AS index,\n       s.idx_scan, pg_size_pretty(pg_relation_size(s.indexrelid)) AS size\nFROM   pg_stat_user_indexes s\nJOIN   pg_index i ON i.indexrelid = s.indexrelid\nWHERE  s.idx_scan = 0 AND NOT i.indisunique\nORDER  BY pg_relation_size(s.indexrelid) DESC;\n\n-- Redundant prefixes: (a) is subsumed by (a, b)\nSELECT indexrelid::regclass AS idx, indkey\nFROM   pg_index WHERE indrelid = 'orders'::regclass;\n\n-- Where the time actually goes\nSELECT calls, mean_exec_time, rows, query\nFROM   pg_stat_statements\nORDER  BY total_exec_time DESC LIMIT 10;" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.35, maxFrames: 220 },

    params: [
      { key: "n", label: "Rows in table", type: "int", min: 20, max: 60, default: 40 },
      { key: "pred", label: "WHERE clause", type: "enum", options: ["region", "region+status", "region+status+day", "region+day", "status only"], default: "region+status" },
      { key: "covering", label: "Index covers SELECT list", type: "enum", options: ["no", "yes"], default: "no" },
      { key: "seed", label: "Regenerate rows", type: "seed" }
    ],

    frames: function* (params, rng) {
      const N = params.n;
      const REG = ["APAC", "EU", "NA"];
      const STA = ["failed", "open", "paid"];

      const rows = [];
      for (let i = 0; i < N; i++) {
        rows.push({
          id: i + 1,
          region: REG[Math.floor(rng() * 3)],
          status: STA[Math.floor(rng() * 3)],
          day: 1 + Math.floor(rng() * 14)
        });
      }
      // guarantee the demo predicate matches something
      for (let k = 0; k < 3; k++) {
        const i = Math.floor(rng() * N);
        rows[i] = { id: rows[i].id, region: "EU", status: "paid", day: 12 };
      }

      const pred = params.pred;
      const usesRegion = pred !== "status only";
      const usesStatus = pred === "region+status" || pred === "region+status+day" || pred === "status only";
      const usesDay = pred === "region+status+day" || pred === "region+day";
      const predText =
        pred === "region" ? "region = 'EU'"
          : pred === "region+status" ? "region = 'EU' AND status = 'paid'"
            : pred === "region+status+day" ? "region = 'EU' AND status = 'paid' AND day = 12"
              : pred === "region+day" ? "region = 'EU' AND day = 12"
                : "status = 'paid'";

      const matches = (r) =>
        (!usesRegion || r.region === "EU") &&
        (!usesStatus || r.status === "paid") &&
        (!usesDay || r.day === 12);

      // usable leftmost prefix of the index (region, status, day)
      let prefix = 0;
      if (usesRegion) {
        prefix = 1;
        if (usesStatus) { prefix = 2; if (usesDay) prefix = 3; }
      }
      const prefixCols = ["region", "status", "day"];

      // index order: sorted by (region, status, day)
      const idxOrder = rows.map((r, i) => i).sort((a, b) => {
        const A = rows[a], B = rows[b];
        if (A.region !== B.region) return A.region < B.region ? -1 : 1;
        if (A.status !== B.status) return A.status < B.status ? -1 : 1;
        if (A.day !== B.day) return A.day - B.day;
        return A.id - B.id;
      });

      // the contiguous slice the seek can bound, using only the usable prefix
      const inSeekRange = (r) =>
        (prefix >= 1 ? r.region === "EU" : true) &&
        (prefix >= 2 ? r.status === "paid" : true) &&
        (prefix >= 3 ? r.day === 12 : true);
      const seekSlice = prefix === 0 ? [] : idxOrder.filter((i) => inSeekRange(rows[i]));

      const totalMatches = rows.filter(matches).length;
      const descent = 3;   // root + internal + leaf page reads

      const snap = (extra) => ({
        rows: rows.map((r) => ({ id: r.id, region: r.region, status: r.status, day: r.day })),
        idxOrder: idxOrder.slice(),
        scanPos: extra.scanPos != null ? extra.scanPos : -1,
        scanExamined: extra.scanExamined || 0,
        scanMatched: extra.scanMatched || 0,
        scanDone: !!extra.scanDone,
        idxPos: extra.idxPos != null ? extra.idxPos : -1,
        idxExamined: extra.idxExamined || 0,
        idxMatched: extra.idxMatched || 0,
        idxDone: !!extra.idxDone,
        idxUsable: prefix > 0,
        prefix: prefix,
        prefixCols: prefixCols.slice(),
        sliceStart: seekSlice.length ? idxOrder.indexOf(seekSlice[0]) : -1,
        sliceEnd: seekSlice.length ? idxOrder.indexOf(seekSlice[seekSlice.length - 1]) : -1,
        heapFetches: extra.heapFetches || 0,
        covering: params.covering === "yes",
        predText: predText,
        totalMatches: totalMatches,
        n: N,
        phaseNote: extra.phaseNote || ""
      });

      yield {
        label: `Same query, two plans, one table of ${N} rows: SELECT id, amount FROM orders WHERE ${predText}. Index is (region, status, day)${params.covering === "yes" ? " INCLUDE (id, amount)" : ""}.`,
        phase: "setup",
        state: snap({ phaseNote: "left = heap order (physical), right = index order (sorted by key)" })
      };

      yield {
        label: prefix === 0
          ? `Leftmost-prefix check: the predicate never mentions region, the index's leading column. Matching rows are scattered across every region block, so there is no range to seek to — the index is unusable and both plans become a scan.`
          : `Leftmost-prefix check: usable prefix = ${prefix} of 3 (${prefixCols.slice(0, prefix).join(", ")}). ` +
          (prefix < 3 && usesDay
            ? `The gap at "status" stops the seek: day can only be applied as a filter on rows already read.`
            : `The seek can bound a contiguous slice of the index.`),
        phase: "prefix",
        state: snap({ phaseNote: "prefix analysis" })
      };

      if (prefix > 0) {
        yield {
          label: `Index side descends ${descent} pages (root → internal → leaf) to land on the first key with ${prefixCols.slice(0, prefix).map((c, i) => c + " = " + (i === 0 ? "'EU'" : i === 1 ? "'paid'" : "12")).join(", ")}. Cost so far: ${descent} page reads, 0 rows examined.`,
          phase: "seek",
          state: snap({ idxPos: -1, heapFetches: 0, phaseNote: "descent" })
        };
      }

      const idxSteps = prefix > 0 ? seekSlice.length : 0;
      const total = Math.max(N, idxSteps);
      let scanEx = 0, scanMa = 0, idxEx = 0, idxMa = 0, heap = 0;

      for (let t = 0; t < total; t++) {
        const doScan = t < N;
        const doIdx = t < idxSteps;
        let label = "";

        if (doScan) {
          const r = rows[t];
          scanEx++;
          if (matches(r)) scanMa++;
        }
        if (doIdx) {
          const ri = seekSlice[t];
          const r = rows[ri];
          idxEx++;
          if (matches(r)) { idxMa++; if (!(params.covering === "yes")) heap++; }
        }

        if (doIdx) {
          const ri = seekSlice[t];
          const r = rows[ri];
          const m = matches(r);
          label = m
            ? `Index entry ${idxEx}: row #${r.id} (${r.region}/${r.status}/d${r.day}) matches` +
            (params.covering === "yes"
              ? ` — the index carries id and amount, so no heap access at all (Index Only Scan).`
              : ` — now a random heap fetch to read the other columns (${heap} so far).`) +
            `   Meanwhile the seq scan is only at row ${scanEx}/${N}.`
            : `Index entry ${idxEx}: row #${r.id} (d${r.day}) is inside the seeked range but fails the day filter — this is the cost of the prefix gap: read, then discard.`;
        } else if (doScan) {
          const r = rows[t];
          label = `Index plan finished after ${idxEx} index entries. The seq scan is still going: row ${scanEx}/${N} (#${r.id}, ${r.region}/${r.status}) — it cannot stop early because nothing tells it where the matches end.`;
        }

        yield {
          label: label,
          phase: "race",
          focus: [t],
          state: snap({
            scanPos: doScan ? t : -1,
            scanExamined: scanEx, scanMatched: scanMa, scanDone: !doScan,
            idxPos: doIdx ? idxOrder.indexOf(seekSlice[t]) : -1,
            idxExamined: idxEx, idxMatched: idxMa, idxDone: !doIdx,
            heapFetches: heap,
            phaseNote: "racing"
          })
        };
      }

      const idxTotalReads = prefix > 0 ? descent + Math.ceil(idxSteps / 8) + heap : N;
      yield {
        label: prefix === 0
          ? `Final: both plans examined all ${N} rows. An index whose leading column is missing from the predicate does nothing for you — this is exactly why (region, status) and (status, region) are different indexes.`
          : `Final: seq scan examined ${scanEx} rows to return ${scanMa}; the index examined ${idxEx} (${Math.round((idxEx / N) * 100)}% of the table) ` +
          (params.covering === "yes"
            ? `and touched the heap 0 times — Index Only Scan.`
            : `plus ${heap} random heap fetch${heap === 1 ? "" : "es"}. Add INCLUDE (id, amount) and those heap fetches disappear.`),
        phase: "done",
        state: snap({
          scanExamined: scanEx, scanMatched: scanMa, scanDone: true,
          idxExamined: idxEx, idxMatched: idxMa, idxDone: true,
          heapFetches: heap, phaseNote: "result"
        })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 16;
      const headerH = 96;
      const colW = (W - pad * 3) / 2;
      const listTop = headerH + 26;
      const rowH = Math.max(8, Math.min(15, (H - listTop - 46) / s.n));

      const matched = (r) => {
        const p = s.predText;
        const okR = p.indexOf("region") >= 0 ? r.region === "EU" : true;
        const okS = p.indexOf("status") >= 0 ? r.status === "paid" : true;
        const okD = p.indexOf("day") >= 0 ? r.day === 12 : true;
        return okR && okS && okD;
      };

      // ---------------- header --------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`WHERE ${s.predText}`, pad, 20);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`index: (region, status, day)${s.covering ? "  INCLUDE (id, amount)" : ""}`, pad, 38);

      // prefix chips
      const chipY = 52, chipW = 92, chipH = 26;
      for (let i = 0; i < 3; i++) {
        const cxp = pad + i * (chipW + 8);
        const usable = i < s.prefix;
        ctx.fillStyle = usable ? C.viz1 : C.surface2;
        ctx.globalAlpha = usable ? 0.85 : 0.6;
        ctx.beginPath();
        ctx.roundRect(cxp, chipY, chipW, chipH, 5);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = usable ? C.viz1 : C.border;
        ctx.beginPath();
        ctx.roundRect(cxp + 0.5, chipY + 0.5, chipW - 1, chipH - 1, 5);
        ctx.stroke();
        ctx.fillStyle = usable ? C.text : C.muted;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(s.prefixCols[i], cxp + chipW / 2, chipY + 12);
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = usable ? C.text2 : C.muted;
        ctx.fillText(usable ? "seekable" : "filter only", cxp + chipW / 2, chipY + 22);
      }
      ctx.textAlign = "left";
      ctx.fillStyle = s.prefix === 0 ? C.danger : C.text2;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(
        s.prefix === 0 ? "usable prefix = 0 → index cannot be used" : `usable prefix = ${s.prefix}/3`,
        pad + 3 * (chipW + 8) + 8, chipY + 17
      );

      // ---------------- column headers ------------------------------------------
      const leftX = pad, rightX = pad * 2 + colW;
      ctx.font = `12px ${env.font.base}`;
      ctx.fillStyle = C.text;
      ctx.fillText("Seq Scan — heap order", leftX, headerH + 6);
      ctx.fillText(s.idxUsable ? "Index Scan — key order (region, status, day)" : "Index unusable — planner falls back to Seq Scan", rightX, headerH + 6);
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.viz2;
      ctx.fillText(`rows examined ${s.scanExamined}/${s.n}   matched ${s.scanMatched}`, leftX, headerH + 22);
      ctx.fillStyle = s.idxUsable ? C.viz1 : C.muted;
      ctx.fillText(
        s.idxUsable
          ? `rows examined ${s.idxExamined}   matched ${s.idxMatched}   heap fetches ${s.covering ? 0 : s.heapFetches}`
          : `— `,
        rightX, headerH + 22
      );

      // ---------------- row lists -------------------------------------------------
      const drawList = (x, order, cursor, isIndex) => {
        for (let i = 0; i < order.length; i++) {
          const r = s.rows[order[i]];
          const y = listTop + i * rowH;
          const examined = isIndex
            ? (s.sliceStart >= 0 && i >= s.sliceStart && i <= s.sliceStart + s.idxExamined - 1)
            : i < s.scanExamined;
          const inSlice = isIndex && s.sliceStart >= 0 && i >= s.sliceStart && i <= s.sliceEnd;
          const isMatch = matched(r);
          const isCursor = i === cursor;

          let fill = C.surface2, alpha = 0.35;
          if (isCursor) { fill = isIndex ? C.viz1 : C.viz2; alpha = 0.9; }
          else if (examined && isMatch) { fill = C.viz3; alpha = 0.8; }
          else if (examined) { fill = C.surface2; alpha = 0.85; }
          else if (inSlice) { fill = C.viz1; alpha = 0.18; }

          ctx.fillStyle = fill;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.roundRect(x, y, colW, rowH - 2, 2);
          ctx.fill();
          ctx.globalAlpha = 1;

          if (rowH >= 11) {
            ctx.font = `${Math.min(10, rowH - 3)}px ${env.font.mono}`;
            ctx.textAlign = "left";
            ctx.fillStyle = isCursor ? C.text : examined ? (isMatch ? C.text : C.text2) : C.muted;
            ctx.fillText(`#${String(r.id).padStart(2, " ")}`, x + 6, y + rowH * 0.72);
            ctx.fillText(r.region, x + 40, y + rowH * 0.72);
            ctx.fillText(r.status, x + 92, y + rowH * 0.72);
            ctx.fillText("d" + r.day, x + 150, y + rowH * 0.72);
            if (examined && isMatch) {
              ctx.textAlign = "right";
              ctx.fillStyle = C.viz3;
              ctx.fillText("match", x + colW - 8, y + rowH * 0.72);
            }
          }
        }
      };

      const heapOrder = s.rows.map((r, i) => i);
      drawList(leftX, heapOrder, s.scanPos, false);
      if (s.idxUsable) {
        drawList(rightX, s.idxOrder, s.idxPos, true);
        // seek bracket
        if (s.sliceStart >= 0) {
          const y0 = listTop + s.sliceStart * rowH;
          const y1 = listTop + (s.sliceEnd + 1) * rowH;
          ctx.strokeStyle = C.viz4;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(rightX - 6, y0); ctx.lineTo(rightX - 10, y0);
          ctx.lineTo(rightX - 10, y1); ctx.lineTo(rightX - 6, y1);
          ctx.stroke();
          ctx.save();
          ctx.translate(rightX - 14, (y0 + y1) / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.fillStyle = C.viz4;
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillText("seek range", 0, 0);
          ctx.restore();
        }
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = `12px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText("no contiguous key range exists for this predicate", rightX + colW / 2, listTop + 40);
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText("'paid' rows are spread through APAC, EU and NA blocks", rightX + colW / 2, listTop + 60);
      }

      // ---------------- footer verdict -------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      const ratio = s.idxUsable && s.idxExamined > 0 ? (s.scanExamined / Math.max(1, s.idxExamined)).toFixed(1) : "1.0";
      ctx.fillText(
        s.idxUsable
          ? `rows examined ratio ${ratio}×   ·   ${s.covering ? "Index Only Scan (0 heap fetches)" : "Index Scan + " + s.heapFetches + " random heap fetches"}   ·   matches in table: ${s.totalMatches}`
          : `both plans read all ${s.n} rows   ·   matches in table: ${s.totalMatches}`,
        pad, H - 8
      );
    }
  },

  drill: {
    cards: [
      { q: "State the leftmost-prefix rule.", a: "A composite index sorts by its columns in order, so only a prefix of the key can bound a seek. `(a,b,c)` serves `a`, `a+b`, `a+b+c` — never `b` or `c` alone.", tags: ["composite"] },
      { q: "Index on (a,b,c); predicate `a = 1 AND c = 3`. What happens?", a: "It seeks on `a` only. Every `a = 1` entry is read and then filtered on `c`, because the gap at `b` ends the usable prefix.", tags: ["composite"] },
      { q: "Where do range predicates belong in the key order?", a: "Last. A range (`>`, `BETWEEN`, `LIKE 'x%'`) terminates the usable prefix, so all equality columns must come before it.", tags: ["composite"] },
      { q: "What is a covering index / Index Only Scan?", a: "An index containing every column the query needs, so no heap fetch is required. In Postgres, confirm with `Index Only Scan` + `Heap Fetches: 0`; `INCLUDE (...)` adds payload without widening the sort key.", tags: ["covering"] },
      { q: "Why can an Index Only Scan still hit the heap in Postgres?", a: "Visibility. The index has no MVCC info, so unless the visibility map marks the heap page all-visible, the tuple must be fetched to check it. Stale VACUUM → nonzero Heap Fetches.", tags: ["postgres"] },
      { q: "Name three non-sargable predicates and their fixes.", a: "`lower(col) = x` → expression index; `col::date = d` → half-open range; `col / 100 > 5` → move the arithmetic to the constant; `LIKE '%x'` → trigram/GIN index.", tags: ["sargability"] },
      { q: "When does a sequential scan beat an index scan?", a: "Above roughly 5–20% selectivity, because index scans pay a random heap I/O per matched row while a scan is sequential. Also on tiny tables and on queries that need most columns of most rows.", tags: ["planner"] },
      { q: "Given indexes (a) and (a,b), which is redundant?", a: "`(a)` — it is a prefix of `(a,b)`, so every query it serves the composite also serves. Drop it unless it is much smaller and hot, or backs a unique constraint.", tags: ["audit"] }
    ],
    sixtySecond: [
      "Explain the leftmost-prefix rule and how you would order the columns of an index for a query with two equality predicates, a range and an ORDER BY.",
      "Explain what a covering index is, what it saves, and how you verify it is actually being used."
    ]
  }
};
