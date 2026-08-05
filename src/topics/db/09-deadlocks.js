export default {
  id: "deadlocks",
  track: "db",
  title: "Locks & Deadlock Detection",
  difficulty: 2,
  minutes: 15,
  tags: ["locking", "deadlock", "concurrency", "wait-for-graph"],

  explainer: [
    { type: "p", text: "A deadlock is a cycle in the *wait-for graph*: T1 waits for a lock T2 holds, T2 waits for one T3 holds, T3 waits for one T1 holds. No one can make progress and no one will ever give up, so the database must break the cycle by killing someone." },
    { type: "h3", text: "What actually takes locks" },
    { type: "list", items: [
      "`UPDATE` / `DELETE` / `SELECT … FOR UPDATE` take an exclusive **row** lock, held until the transaction ends — not until the statement ends.",
      "`SELECT` in an MVCC engine takes no row lock at all. Readers do not block writers; that is what MVCC bought you.",
      "`INSERT` takes a lock on its own new row, plus possibly a lock while checking a unique index or a foreign key — a very common source of surprising deadlocks.",
      "DDL takes an `ACCESS EXCLUSIVE` **table** lock. An `ALTER TABLE` that waits behind a long query will queue every subsequent query behind itself, because lock requests are FIFO. This is why you always set a short `lock_timeout` before DDL.",
      "Foreign keys take a `FOR KEY SHARE` lock on the parent row, so two children inserted under the same parent can deadlock with a concurrent parent update."
    ]},
    { type: "h3", text: "Detection, not prevention" },
    { type: "p", text: "Postgres does not try to prevent deadlocks. Each waiting backend sets a timer (`deadlock_timeout`, default **1 s**); when it fires, that backend builds the wait-for graph and looks for a cycle. If it finds one it aborts *one* transaction with SQLSTATE **40P01**, releasing its locks so the rest proceed. Detection is deliberately lazy because deadlocks are supposed to be rare and building the graph is not free." },
    { type: "h3", text: "The fix is almost always ordering" },
    { type: "p", text: "A cycle requires two transactions to acquire the same resources in *opposite* order. If every transaction takes locks in one globally agreed order — sort by primary key, always parent before child — a cycle is impossible, because the wait-for graph can only point 'upward' in that order. That is the answer interviewers want, and it costs nothing at runtime." },
    { type: "callout", tone: "pitfall", text: "`UPDATE accounts SET … WHERE id IN (1, 2, 3)` does not guarantee lock order — the engine locks rows in whatever order the plan produces them, which can differ between sessions and between plans. If order matters, materialise it: `SELECT … WHERE id = ANY(?) ORDER BY id FOR UPDATE` first, then update." },
    { type: "callout", tone: "tip", text: "Deadlocks are normal at scale — every one of them must be *retryable*. Catch 40P01 (and 40001) and retry the whole transaction with jittered backoff. Also shorten transactions: a transaction that holds locks for 5 ms is dramatically less likely to be in a cycle than one that holds them across an HTTP call." },
    { type: "h3", text: "Related non-deadlock lock problems" },
    { type: "list", items: [
      "**Lock convoy / queue**: one long transaction + one DDL request + everything behind it. Diagnose with `pg_locks` joined to `pg_stat_activity`; `pg_blocking_pids(pid)` names the blocker directly.",
      "**Lock escalation** does not exist in Postgres (it does in SQL Server) — but the number of locks is bounded by `max_locks_per_transaction`.",
      "**`SKIP LOCKED`** turns a queue table into a work queue with no contention: each worker grabs rows nobody else has locked.",
      "**`NOWAIT`** fails immediately instead of waiting — the right choice for a user-facing request that must not hang."
    ]}
  ],

  complexity: {
    rows: [
      { operation: "Row lock acquire (uncontended)", time: "O(1)", space: "O(1) in tuple header", note: "no central lock table entry until contention" },
      { operation: "Lock wait", time: "unbounded", space: "O(1)", note: "bounded only by lock_timeout / statement_timeout" },
      { operation: "Deadlock detection", time: "O(V + E) after 1 s", space: "O(V + E)", note: "runs only when deadlock_timeout fires" },
      { operation: "Victim abort + retry", time: "O(work redone)", space: "—", note: "SQLSTATE 40P01; the app must retry" },
      { operation: "Ordered locking", time: "O(k log k) sort", space: "O(k)", note: "makes cycles structurally impossible" }
    ]
  },

  interview: {
    whyAsked: "It tests whether you understand that concurrency bugs are structural, not accidental. The signal is naming the wait-for cycle, giving lock ordering as the fix, and knowing that deadlocks must be handled with retries rather than eliminated by wishing.",
    followUps: [
      { q: "What exactly is a deadlock, and how does Postgres resolve it?", a: "A cycle in the wait-for graph, where each transaction waits on a lock held by the next. Postgres detects rather than prevents: a waiting backend whose `deadlock_timeout` (1 s) fires builds the graph, finds the cycle, and aborts one transaction with SQLSTATE 40P01, freeing its locks so the others proceed." },
      { q: "How do you prevent deadlocks?", a: "Impose a global lock ordering — always acquire rows sorted by primary key, always parent before child. A cycle needs two transactions taking the same resources in opposite orders, so a total order makes it impossible. Also keep transactions short, take the strongest lock you'll need up front rather than upgrading shared→exclusive, and use `SELECT … FOR UPDATE` with an explicit `ORDER BY`." },
      { q: "Which transaction gets chosen as the victim?", a: "Implementation-defined. Postgres aborts the backend that ran the detection (the one whose timeout fired), which in practice is often the one that has waited longest. InnoDB deliberately picks the transaction with the least work done, measured in rows modified, so the cheapest one is rolled back. Either way, your application cannot rely on being the survivor." },
      { q: "Two transactions each UPDATE the same two rows. Do they always deadlock?", a: "Only if they touch them in opposite orders. Same order means the second simply waits and then proceeds. This is why `UPDATE … WHERE id IN (1,2)` is risky: the lock order follows the plan's row order, which is not guaranteed to be stable across sessions." },
      { q: "Can a single-statement UPDATE deadlock with itself?", a: "Two concurrent multi-row UPDATEs can absolutely deadlock with each other if they reach rows in different orders. Foreign-key checks add another layer: inserting two children of different parents while another transaction updates those parents in the opposite order deadlocks on the FOR KEY SHARE locks — a classic in ORM-generated code." },
      { q: "What's the difference between a deadlock and simple lock contention?", a: "Contention is progress-with-waiting: someone will eventually release. A deadlock is a cycle that can never resolve, so the engine must abort a participant. Contention shows up as high `wait_event = Lock` and rising latency; deadlocks show up as 40P01 errors in the log with the full wait chain printed." },
      { q: "How do you debug a lock problem in production?", a: "`SELECT pid, pg_blocking_pids(pid), wait_event_type, wait_event, now()-xact_start, query FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;` gives the blocker chain directly. `log_lock_waits = on` records anything waiting longer than deadlock_timeout, and the deadlock log entry prints every participant's statement." }
    ]
  },

  code: [
    { lang: "sql", label: "Producing and then preventing a deadlock", code: "-- === SESSION A ===            === SESSION B ===\nBEGIN;                          BEGIN;\nUPDATE accounts SET balance=balance-10\n  WHERE id='alice';             UPDATE accounts SET balance=balance-10\n                                  WHERE id='bob';\nUPDATE accounts SET balance=balance+10\n  WHERE id='bob';    -- waits   UPDATE accounts SET balance=balance+10\n                                  WHERE id='alice';  -- waits -> CYCLE\n\n-- After deadlock_timeout (1s) one session gets:\n-- ERROR:  deadlock detected\n-- DETAIL: Process 8412 waits for ShareLock on transaction 90412;\n--         blocked by process 8455.\n--         Process 8455 waits for ShareLock on transaction 90411;\n--         blocked by process 8412.\n-- HINT:   See server log for query details.\n-- SQLSTATE: 40P01\n\n-- THE FIX: one global order, enforced by sorting the keys.\nBEGIN;\nSELECT id FROM accounts WHERE id = ANY(ARRAY['alice','bob'])\nORDER BY id FOR UPDATE;        -- both sessions lock alice, then bob\nUPDATE accounts SET balance = balance - 10 WHERE id = 'alice';\nUPDATE accounts SET balance = balance + 10 WHERE id = 'bob';\nCOMMIT;" },
    { lang: "sql", label: "Seeing who blocks whom", code: "-- The blocker chain, in one query\nSELECT   a.pid,\n         pg_blocking_pids(a.pid) AS blocked_by,\n         a.wait_event_type, a.wait_event,\n         now() - a.xact_start    AS txn_age,\n         left(a.query, 60)       AS query\nFROM     pg_stat_activity a\nWHERE    cardinality(pg_blocking_pids(a.pid)) > 0\nORDER BY txn_age DESC;\n\n-- What locks exist and which are not yet granted\nSELECT locktype, relation::regclass, mode, granted, pid\nFROM   pg_locks WHERE NOT granted;\n\n-- Log every wait longer than deadlock_timeout (cheap, very useful)\nALTER SYSTEM SET log_lock_waits = on;\nALTER SYSTEM SET deadlock_timeout = '1s';\n\n-- Last resort\nSELECT pg_cancel_backend(8412);      -- cancel the statement\nSELECT pg_terminate_backend(8412);   -- kill the connection" },
    { lang: "sql", label: "Bounded waits and lock-free queues", code: "-- Never let a user request hang on a lock\nSET LOCAL lock_timeout = '2s';\nSET LOCAL statement_timeout = '10s';\n\n-- DDL: fail fast rather than queueing every later query behind you\nBEGIN;\nSET LOCAL lock_timeout = '100ms';\nALTER TABLE orders ADD COLUMN note text;   -- ACCESS EXCLUSIVE\nCOMMIT;\n\n-- Fail immediately instead of waiting\nSELECT * FROM jobs WHERE id = 42 FOR UPDATE NOWAIT;\n\n-- The work-queue pattern: N workers, zero contention, zero deadlocks\nWITH job AS (\n  SELECT id FROM jobs\n  WHERE  status = 'pending'\n  ORDER  BY created_at\n  FOR UPDATE SKIP LOCKED           -- skip rows another worker holds\n  LIMIT  1\n)\nUPDATE jobs SET status = 'running', started_at = now()\nFROM   job WHERE jobs.id = job.id\nRETURNING jobs.*;" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 200 },

    params: [
      { key: "n", label: "Transactions in the cycle", type: "int", min: 2, max: 4, default: 3 },
      { key: "order", label: "Lock ordering", type: "enum", options: ["inconsistent (each txn its own order)", "consistent (sorted by key)"], default: "inconsistent (each txn its own order)" },
      { key: "victim", label: "Victim policy", type: "enum", options: ["detector's own backend", "least work done"], default: "detector's own backend" }
    ],

    frames: function* (params, rng) {
      const N = params.n;
      const ROWS = ["alice", "bob", "carol", "dave"].slice(0, N);
      const consistent = params.order.indexOf("consistent") === 0;

      let txns = [];
      for (let i = 0; i < N; i++) {
        txns.push({ id: i, name: "T" + (i + 1), holds: [], want: null, status: "running", work: 0 });
      }
      let cycle = null, victim = null, detector = null, walk = [];
      let note = "";

      const holderOf = (row) => {
        for (const t of txns) if (t.status !== "aborted" && t.status !== "committed" && t.holds.indexOf(row) >= 0) return t.id;
        return -1;
      };
      const edges = () => {
        const es = [];
        for (const t of txns) {
          if (t.want && t.status === "waiting") {
            const hid = holderOf(t.want);
            if (hid >= 0 && hid !== t.id) es.push({ from: t.id, to: hid, row: t.want });
          }
        }
        return es;
      };
      const snap = (extra) => ({
        txns: txns.map((t) => ({ id: t.id, name: t.name, holds: t.holds.slice(), want: t.want, status: t.status, work: t.work })),
        rows: ROWS.slice(),
        edges: edges(),
        cycle: cycle ? cycle.slice() : null,
        victim: victim,
        detector: detector,
        walk: walk.slice(),
        note: extra && extra.note ? extra.note : note,
        consistent: consistent,
        n: N
      });
      const setT = (id, patch) => { txns = txns.map((t) => (t.id === id ? { ...t, ...patch } : t)); };

      yield {
        label: consistent
          ? `${N} transactions each need to lock ${N} rows, and every one of them acquires in the SAME order (sorted by key). Watch what the wait-for graph can and cannot become.`
          : `${N} transactions each need two rows, but each starts from a different one — the classic "transfer money in both directions" shape. Watch the wait-for graph close.`,
        phase: "setup",
        state: snap({ note: consistent ? "global lock order: " + ROWS.join(" < ") : "each transaction has its own order" })
      };

      // ---- first acquisitions ----------------------------------------------
      for (let i = 0; i < N; i++) {
        const row = consistent ? ROWS[0] : ROWS[i];
        if (consistent && i > 0) {
          setT(i, { want: row, status: "waiting" });
          yield {
            label: `${txns[i].name} also wants ${row} — the first row in the global order — and simply waits behind ${txns[holderOf(row)].name}. A waiter that holds nothing can never be part of a cycle.`,
            phase: "acquire",
            state: snap({ note: "waiting, but holding nothing" })
          };
        } else {
          setT(i, { holds: [row], work: 1 });
          yield {
            label: `${txns[i].name} takes an exclusive row lock on ${row} (UPDATE … WHERE id='${row}'). Row locks are held until COMMIT or ROLLBACK — not until the statement finishes.`,
            phase: "acquire",
            focus: [i],
            state: snap({ note: "exclusive row lock held until end of transaction" })
          };
        }
      }

      if (consistent) {
        // no cycle possible — unwind serially
        yield {
          label: `The graph is a straight line into ${txns[0].name}, not a cycle: every waiter is waiting on the transaction that got there first, and that transaction is waiting on nobody. Progress is guaranteed.`,
          phase: "safe",
          state: snap({ note: "wait-for graph is acyclic by construction" })
        };
        for (let i = 0; i < N; i++) {
          const t = txns[i];
          if (t.status === "waiting") {
            setT(i, { holds: [t.want], want: null, status: "running", work: 1 });
            yield {
              label: `${t.name} is granted ${t.want} as soon as its predecessor commits. Locks are handed out FIFO, so nobody starves.`,
              phase: "safe",
              state: snap({})
            };
          }
          // take the remaining rows in global order
          for (let k = 1; k < Math.min(2, ROWS.length); k++) {
            const nt = txns[i];
            setT(i, { holds: nt.holds.concat([ROWS[k]]), work: nt.work + 1 });
            yield {
              label: `${t.name} takes ${ROWS[k]} — always later in the global order than what it already holds. That single discipline is what makes a cycle structurally impossible.`,
              phase: "safe",
              state: snap({ note: "only ever wait 'upward' in the order" })
            };
          }
          setT(i, { holds: [], want: null, status: "committed" });
          yield {
            label: `${t.name} COMMITs and releases everything. Slower than true parallelism, but never a deadlock and never a retry storm.`,
            phase: "safe",
            state: snap({})
          };
        }
        yield {
          label: `All ${N} transactions completed with zero aborts. Consistent lock ordering trades a little concurrency for the complete elimination of an entire class of production incident.`,
          phase: "done",
          state: snap({ note: "0 deadlocks, 0 retries" })
        };
        return;
      }

      // ---- each transaction now requests the next row (closing the cycle) ----
      for (let i = 0; i < N; i++) {
        const want = ROWS[(i + 1) % N];
        setT(i, { want: want, status: "waiting" });
        const hid = holderOf(want);
        const closes = i === N - 1;
        yield {
          label: closes
            ? `${txns[i].name} requests ${want} — held by ${txns[hid].name}. The last edge closes the loop: every transaction is now waiting on the next, and the next is waiting on the one after that.`
            : `${txns[i].name} requests ${want}, but ${txns[hid].name} holds it, so ${txns[i].name} blocks. It is still holding its own row while it waits — that is what makes a cycle possible.`,
          phase: "wait",
          focus: [i],
          state: snap({ note: closes ? "cycle formed — nobody can proceed" : "waiting while holding" })
        };
      }

      // ---- detection ----------------------------------------------------------
      detector = N - 1;
      yield {
        label: `Every backend is now blocked. Postgres does not check for this eagerly — the last waiter's deadlock_timeout (default 1 s) has to fire first. Until then this looks exactly like ordinary slow contention.`,
        phase: "detect",
        state: snap({ note: "deadlock_timeout = 1s ticking" })
      };
      yield {
        label: `deadlock_timeout fires in ${txns[detector].name}'s backend. It builds the wait-for graph: one node per waiting transaction, one edge per "waits for the holder of".`,
        phase: "detect",
        state: snap({ note: "building the wait-for graph" })
      };

      walk = [];
      let cur = detector;
      for (let step = 0; step <= N; step++) {
        walk = walk.concat([cur]);
        const e = edges().filter((x) => x.from === cur)[0];
        if (!e) break;
        const closesHere = walk.indexOf(e.to) >= 0;
        yield {
          label: closesHere
            ? `…and ${txns[e.to].name} is already on the path. CYCLE DETECTED: ${walk.map((w) => txns[w].name).join(" → ")} → ${txns[e.to].name}. No amount of waiting can resolve this.`
            : `Following the edge: ${txns[cur].name} waits for ${e.row}, which ${txns[e.to].name} holds. Walk to ${txns[e.to].name} and keep going.`,
          phase: "detect",
          focus: [cur, e.to],
          state: snap({ note: closesHere ? "cycle found" : "traversing the wait-for graph" })
        };
        if (closesHere) { cycle = walk.slice(walk.indexOf(e.to)); break; }
        cur = e.to;
      }
      if (!cycle) cycle = txns.map((t) => t.id);

      // ---- victim -------------------------------------------------------------
      if (params.victim === "least work done") {
        let best = cycle[0];
        for (const id of cycle) if (txns[id].work < txns[best].work) best = id;
        victim = best;
      } else {
        victim = detector;
      }
      yield {
        label: params.victim === "least work done"
          ? `Victim selection: choose the transaction with the least work done (${txns[victim].name}, ${txns[victim].work} row${txns[victim].work === 1 ? "" : "s"} modified) so the least effort is thrown away. This is InnoDB's policy.`
          : `Victim selection: Postgres aborts the backend that ran the detection — ${txns[victim].name}, the one whose timeout fired. Your application cannot assume it will be the survivor, which is exactly why every transaction needs a retry path.`,
        phase: "victim",
        focus: [victim],
        state: snap({ note: "one transaction must die for the others to live" })
      };

      setT(victim, { status: "aborted", holds: [], want: null });
      yield {
        label: `${txns[victim].name} is aborted with SQLSTATE 40P01 "deadlock detected" and all of its locks are released. The cycle is broken by removing a node from the graph.`,
        phase: "victim",
        state: snap({ note: "40P01 — the application must retry the whole transaction" })
      };

      // ---- unwind ---------------------------------------------------------------
      let guard = 0;
      while (guard++ < 12) {
        const waiter = txns.filter((t) => t.status === "waiting" && holderOf(t.want) === -1)[0];
        if (!waiter) break;
        setT(waiter.id, { holds: waiter.holds.concat([waiter.want]), want: null, status: "running", work: waiter.work + 1 });
        yield {
          label: `${waiter.name} was waiting on a lock that is now free — it wakes up and acquires it. One abort unblocked the entire chain.`,
          phase: "unwind",
          focus: [waiter.id],
          state: snap({ note: "chain unblocking" })
        };
        setT(waiter.id, { status: "committed", holds: [], want: null });
        yield {
          label: `${waiter.name} COMMITs and releases its locks, freeing the next transaction in line.`,
          phase: "unwind",
          state: snap({})
        };
      }

      const done = txns.filter((t) => t.status === "committed").length;
      yield {
        label: `${done} of ${N} transactions committed; ${txns[victim].name} must retry from the beginning. Deadlocks are not a bug to eliminate but a condition to survive — retry with jittered backoff, and remove the cause by locking in a consistent order.`,
        phase: "done",
        state: snap({ note: "fix: sort the keys before locking; survive: retry on 40P01" })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 16;
      const leftW = Math.min(W * 0.46, 470);

      // ---------------- lock table --------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText("lock table", pad, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("X = holds exclusive row lock    W = waiting for it", pad, 40);

      const colW = Math.min(96, (leftW - 90) / s.n);
      const rowH = 40;
      const tblTop = 56;
      for (let i = 0; i < s.txns.length; i++) {
        const t = s.txns[i];
        const x = pad + 84 + i * colW;
        ctx.textAlign = "center";
        ctx.fillStyle = t.status === "aborted" ? C.danger : t.status === "committed" ? C.viz3 : C.text;
        ctx.font = `12px ${env.font.mono}`;
        ctx.fillText(t.name, x + colW / 2, tblTop - 18);
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = t.status === "aborted" ? C.danger : t.status === "waiting" ? C.viz4 : C.muted;
        ctx.fillText(t.status, x + colW / 2, tblTop - 6);
      }
      for (let r = 0; r < s.rows.length; r++) {
        const y = tblTop + r * rowH;
        ctx.textAlign = "left";
        ctx.fillStyle = C.text2;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(s.rows[r], pad, y + rowH / 2 + 4);
        for (let i = 0; i < s.txns.length; i++) {
          const t = s.txns[i];
          const x = pad + 84 + i * colW;
          const holds = t.holds.indexOf(s.rows[r]) >= 0;
          const waits = t.want === s.rows[r] && t.status === "waiting";
          ctx.fillStyle = holds ? C.viz1 : waits ? C.viz4 : C.surface2;
          ctx.globalAlpha = holds ? 0.85 : waits ? 0.4 : 0.35;
          ctx.beginPath();
          ctx.roundRect(x + 3, y + 3, colW - 8, rowH - 8, 4);
          ctx.fill();
          ctx.globalAlpha = 1;
          if (waits) {
            ctx.strokeStyle = C.viz4;
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(x + 3.5, y + 3.5, colW - 9, rowH - 9, 4);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          if (holds || waits) {
            ctx.textAlign = "center";
            ctx.fillStyle = holds ? C.text : C.viz4;
            ctx.font = `12px ${env.font.mono}`;
            ctx.fillText(holds ? "X" : "W", x + colW / 2, y + rowH / 2 + 4);
          }
        }
      }

      // ---------------- wait-for graph -------------------------------------------
      const gx = leftW + 40, gw = W - gx - pad;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText("wait-for graph", gx, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("an edge means \"is blocked by\"; a cycle means deadlock", gx, 40);

      const cxc = gx + gw / 2, cyc = 56 + (H - 120) / 2;
      const rad = Math.min(gw / 2 - 60, (H - 150) / 2);
      const pos = [];
      for (let i = 0; i < s.n; i++) {
        const a = -Math.PI / 2 + (i * 2 * Math.PI) / s.n;
        pos.push({ x: cxc + Math.cos(a) * rad, y: cyc + Math.sin(a) * rad });
      }

      const inCycle = (from, to) => {
        if (!s.cycle) return false;
        const k = s.cycle.indexOf(from);
        if (k < 0) return false;
        return s.cycle[(k + 1) % s.cycle.length] === to;
      };

      for (const e of s.edges) {
        const a = pos[e.from], b = pos[e.to];
        if (!a || !b) continue;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.sqrt(dx * dx + dy * dy) || 1;
        const ux = dx / len, uy = dy / len;
        const nr = 26;
        const x0 = a.x + ux * nr, y0 = a.y + uy * nr;
        const x1 = b.x - ux * nr, y1 = b.y - uy * nr;
        const hot = inCycle(e.from, e.to);
        const walked = s.walk.indexOf(e.from) >= 0 && s.walk.indexOf(e.to) >= 0;
        ctx.strokeStyle = hot ? C.danger : walked ? C.viz4 : C.axis;
        ctx.lineWidth = hot ? 2.5 : walked ? 2 : 1.2;
        ctx.beginPath();
        ctx.moveTo(x0, y0); ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.fillStyle = hot ? C.danger : walked ? C.viz4 : C.axis;
        const ax = Math.atan2(y1 - y0, x1 - x0);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 9 * Math.cos(ax - 0.35), y1 - 9 * Math.sin(ax - 0.35));
        ctx.lineTo(x1 - 9 * Math.cos(ax + 0.35), y1 - 9 * Math.sin(ax + 0.35));
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = hot ? C.danger : C.muted;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(e.row, (x0 + x1) / 2, (y0 + y1) / 2 - 5);
      }

      for (let i = 0; i < s.n; i++) {
        const t = s.txns[i];
        const p = pos[i];
        const isVictim = s.victim === i;
        const onWalk = s.walk.indexOf(i) >= 0;
        ctx.fillStyle = t.status === "aborted" ? C.danger : t.status === "committed" ? C.viz3 : t.status === "waiting" ? C.viz4 : C.viz1;
        ctx.globalAlpha = t.status === "aborted" ? 0.35 : 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        if (isVictim || onWalk) {
          ctx.strokeStyle = isVictim ? C.danger : C.viz4;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 27, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = C.text;
        ctx.font = `12px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(t.name, p.x, p.y + 4);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(t.status === "aborted" ? "40P01 aborted" : t.status, p.x, p.y + 38);
        if (s.detector === i && t.status !== "aborted") {
          ctx.fillStyle = C.viz4;
          ctx.fillText("timeout fired", p.x, p.y - 32);
        }
      }

      if (s.cycle && s.cycle.length) {
        ctx.textAlign = "center";
        ctx.fillStyle = C.danger;
        ctx.font = `12px ${env.font.mono}`;
        ctx.fillText(
          "cycle: " + s.cycle.map((i) => s.txns[i].name).join(" → ") + " → " + s.txns[s.cycle[0]].name,
          cxc, H - 46
        );
      } else if (s.consistent) {
        ctx.textAlign = "center";
        ctx.fillStyle = C.viz3;
        ctx.font = `12px ${env.font.mono}`;
        ctx.fillText("acyclic — every edge points 'up' the global lock order", cxc, H - 46);
      }

      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(s.note, pad, H - 10);
    }
  },

  drill: {
    cards: [
      { q: "Define a deadlock in database terms.", a: "A cycle in the wait-for graph: each transaction waits for a lock held by the next, and the last waits for the first. No participant can ever proceed.", tags: ["definition"] },
      { q: "How does Postgres handle deadlocks?", a: "Detection, not prevention. A waiting backend whose `deadlock_timeout` (1 s) fires builds the wait-for graph, finds the cycle, and aborts one transaction with SQLSTATE 40P01.", tags: ["detection"] },
      { q: "What is the standard prevention technique?", a: "A global lock ordering — always acquire rows sorted by primary key (`ORDER BY id FOR UPDATE`), always parent before child. A cycle requires opposite orders, so a total order makes it impossible.", tags: ["prevention"] },
      { q: "Which locks are held until commit?", a: "All row-level write locks from UPDATE/DELETE/SELECT FOR UPDATE, and table locks from DDL. Not until end of statement — until end of transaction.", tags: ["locking"] },
      { q: "Why is `UPDATE … WHERE id IN (1,2,3)` risky?", a: "Lock order follows the plan's row order, which isn't guaranteed to be the same in every session. Materialise the order with `SELECT … ORDER BY id FOR UPDATE` first.", tags: ["pitfall"] },
      { q: "What is `FOR UPDATE SKIP LOCKED` for?", a: "Work queues: each worker claims rows nobody else has locked instead of waiting, giving contention-free parallel consumers.", tags: ["patterns"] },
      { q: "Deadlock vs lock contention?", a: "Contention resolves when the holder commits; a deadlock never resolves and requires an abort. Contention shows as `wait_event = Lock` and latency, deadlocks as 40P01 errors.", tags: ["diagnosis"] },
      { q: "Which query names the blocker directly?", a: "`SELECT pid, pg_blocking_pids(pid), query FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;` — plus `log_lock_waits = on` for the historical record.", tags: ["diagnosis"] }
    ],
    sixtySecond: [
      "Explain how a deadlock forms, how the database detects it, and the single design change that prevents the whole class.",
      "Walk through debugging a production incident where queries are piling up behind a lock."
    ]
  }
};
