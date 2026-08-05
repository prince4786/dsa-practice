export default {
  id: "acid-transactions",
  track: "db",
  title: "Transactions & ACID",
  difficulty: 1,
  minutes: 14,
  tags: ["transactions", "acid", "wal", "durability"],

  explainer: [
    { type: "p", text: "A transaction is a set of statements the database treats as one indivisible unit. ACID names the four guarantees — but they are not four independent features: **A** and **D** are both delivered by the write-ahead log, **I** by concurrency control (locking or MVCC), and **C** is mostly *your* job." },
    { type: "h3", text: "Atomicity — all or nothing" },
    { type: "p", text: "Either every change lands or none does. The mechanism is the WAL: changes are appended to the log *before* the data pages are written, and a transaction is only considered committed once its COMMIT record is durably on disk. On crash recovery the engine **redoes** everything after the last checkpoint and then **undoes** every transaction with no COMMIT record. Rollback is the same undo machinery, run on demand." },
    { type: "h3", text: "Consistency — the one you own" },
    { type: "p", text: "The database enforces the constraints you declared: primary keys, foreign keys, `CHECK`, `NOT NULL`, uniqueness. It has no idea that debits should equal credits unless you wrote that down. In interviews, say this explicitly — 'C' is the property the application and the schema author are responsible for; the engine only guarantees that a transaction moves the database from one *declared-valid* state to another." },
    { type: "h3", text: "Isolation — as if alone" },
    { type: "p", text: "Concurrent transactions should produce a result equivalent to *some* serial order. Full serializability is expensive, so engines offer weaker levels that permit specific anomalies — the subject of the next lesson. The important framing: isolation is a dial, and the default is almost never the strongest setting (Postgres defaults to READ COMMITTED, and Oracle cannot even do REPEATABLE READ)." },
    { type: "h3", text: "Durability — survives the crash" },
    { type: "p", text: "Once COMMIT returns, the change survives a power cut. That requires an `fsync` of the WAL at commit time — the single most expensive thing a small transaction does (~0.1–1 ms even on NVMe). Hence **group commit**: many concurrent commits ride one fsync. Turning `synchronous_commit = off` in Postgres makes commits ~10× faster and gives up the D: you can lose the last ~600 ms of committed transactions on a crash, though the database is never *corrupted*." },
    { type: "callout", tone: "pitfall", text: "The most expensive real-world mistake is a transaction held open across a network call — an HTTP request inside a `BEGIN`. It pins locks, blocks VACUUM from removing dead rows (bloat), and holds an old snapshot open. Keep transactions short, do I/O outside them, and set `idle_in_transaction_session_timeout`." },
    { type: "callout", tone: "tip", text: "`ROLLBACK` is not a failure path you can skip: in Postgres any error inside a transaction aborts it entirely, and every following statement returns *\"current transaction is aborted\"* until you roll back. Savepoints (`SAVEPOINT s; ... ROLLBACK TO s;`) give you partial undo — and are exactly what a driver's nested-transaction emulation uses." }
  ],

  complexity: {
    rows: [
      { operation: "COMMIT (synchronous)", time: "1 fsync ≈ 0.1–1 ms", space: "O(changes)", note: "the dominant cost of small write transactions" },
      { operation: "COMMIT (group commit)", time: "1 fsync per batch", space: "O(changes)", note: "throughput scales with concurrency, latency does not" },
      { operation: "COMMIT (synchronous_commit=off)", time: "~0 (async)", space: "O(changes)", note: "loses up to ~600 ms of commits on crash; no corruption" },
      { operation: "ROLLBACK", time: "O(changes undone)", space: "O(1)", note: "same undo path as crash recovery" },
      { operation: "Crash recovery", time: "O(WAL since checkpoint)", space: "O(dirty pages)", note: "redo all, then undo the uncommitted" },
      { operation: "WAL write per row change", time: "O(row size)", space: "O(row size)", note: "full-page image on the first touch after a checkpoint" }
    ]
  },

  interview: {
    whyAsked: "Everyone can recite the acronym; few can say which component provides which letter. The signal is whether you connect atomicity and durability to the write-ahead log, admit that consistency is the application's job, and know the cost of an fsync.",
    followUps: [
      { q: "How does a database actually implement atomicity?", a: "With a write-ahead log. Every change is appended to the WAL before the corresponding data page is flushed, and a transaction counts as committed only when its COMMIT record is fsynced. On recovery the engine redoes everything after the last checkpoint, then undoes any transaction lacking a COMMIT record — the same undo path that ROLLBACK uses." },
      { q: "Whose responsibility is the C in ACID?", a: "Mostly yours. The engine enforces declared constraints — PK, FK, CHECK, NOT NULL, unique — and guarantees a transaction takes the database from one constraint-valid state to another. Application invariants like 'debits equal credits' only hold if you encode them as constraints or maintain them inside the transaction." },
      { q: "What is the cost of durability, and how do systems reduce it?", a: "An fsync of the WAL per commit — 0.1–1 ms, orders of magnitude more than the row change itself. Group commit amortises one fsync across many concurrent committers, so throughput scales even though latency doesn't. `synchronous_commit = off` removes the wait entirely at the cost of losing recent commits on a crash; synchronous replication moves the wait to a replica's ack instead." },
      { q: "What happens if the server crashes between the WAL flush and the data page write?", a: "Nothing is lost — that is the entire point of write-ahead logging. On restart, recovery replays the WAL from the last checkpoint and reapplies the change to the page. Postgres also writes a full-page image on the first modification after a checkpoint to protect against torn pages, which is why WAL volume spikes right after checkpoints." },
      { q: "Why are long-running transactions harmful?", a: "They hold locks, and in an MVCC engine they hold an old snapshot, so VACUUM cannot reclaim any row version newer than that snapshot — the table and its indexes bloat, and the transaction-id horizon stops advancing. An idle-in-transaction connection is the classic incident; guard it with `idle_in_transaction_session_timeout`." },
      { q: "What are savepoints for?", a: "Partial rollback inside a transaction: `SAVEPOINT s; ... ROLLBACK TO s;` undoes work back to the marker while keeping the transaction alive. ORMs use them to emulate nested transactions. They are not free — each savepoint consumes a subtransaction id, and thousands of them cause a well-known performance cliff in Postgres." }
    ]
  },

  code: [
    { lang: "sql", label: "The transfer, done properly", code: "BEGIN;\n\n-- Lock the rows in a deterministic order to avoid deadlocks\nSELECT balance FROM accounts WHERE id IN ('alice','bob')\nORDER BY id FOR UPDATE;\n\nUPDATE accounts SET balance = balance - 50 WHERE id = 'alice';\nUPDATE accounts SET balance = balance + 50 WHERE id = 'bob';\n\n-- Declared invariant: the engine enforces this, not your app code\n-- ALTER TABLE accounts ADD CONSTRAINT bal_nonneg CHECK (balance >= 0);\n\nCOMMIT;   -- WAL COMMIT record fsynced here; before this, nothing is durable\n\n-- Any error above aborts the whole transaction:\n--   ERROR: new row violates check constraint \"bal_nonneg\"\n--   ERROR: current transaction is aborted, commands ignored until ROLLBACK" },
    { lang: "sql", label: "Savepoints: partial undo", code: "BEGIN;\nINSERT INTO orders (id, customer_id, amount) VALUES (1001, 7, 250);\n\nSAVEPOINT before_discount;\nUPDATE orders SET amount = amount * 0.5 WHERE id = 1001;\n\n-- changed our mind -- undo only the discount, keep the insert\nROLLBACK TO SAVEPOINT before_discount;\n\nINSERT INTO order_events (order_id, kind) VALUES (1001, 'created');\nCOMMIT;\n\n-- Guard against transactions left open by a hung client:\nALTER SYSTEM SET idle_in_transaction_session_timeout = '30s';\nALTER SYSTEM SET statement_timeout = '10s';" },
    { lang: "sql", label: "Durability knobs and what they cost", code: "-- Per-transaction: give up durability for this one commit only\nSET LOCAL synchronous_commit = off;    -- ~10x faster commit, may lose it on crash\n\n-- Wait for a replica to have the WAL before COMMIT returns (RPO = 0)\nALTER SYSTEM SET synchronous_commit = 'remote_apply';\nALTER SYSTEM SET synchronous_standby_names = 'replica1';\n\n-- Group commit: make committers wait a moment so one fsync serves many\nALTER SYSTEM SET commit_delay = 100;   -- microseconds\nALTER SYSTEM SET commit_siblings = 5;\n\n-- Observe the cost\nSELECT wait_event_type, wait_event, count(*)\nFROM pg_stat_activity WHERE state = 'active' GROUP BY 1,2;\n--  IO | WALSync | 14      <-- commits are fsync-bound\n\n-- NEVER in production: skips the fsync entirely, corrupts on crash\n-- ALTER SYSTEM SET fsync = off;" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.5, maxFrames: 120 },

    params: [
      { key: "outcome", label: "T1 ends with", type: "enum", options: ["COMMIT", "ROLLBACK", "crash before commit", "crash after commit"], default: "COMMIT" }
    ],

    frames: function* (params, rng) {
      const outcome = params.outcome;
      let ledger = [
        { id: "alice", committed: 100, pending: null },
        { id: "bob", committed: 50, pending: null },
        { id: "carol", committed: 30, pending: null }
      ];
      let steps = [];
      let wal = [];
      let lsn = 100;
      let t2read = null;
      let crashed = false, recovery = false;

      const snap = (extra) => ({
        steps: steps.map((s) => ({ lane: s.lane, text: s.text, status: s.status })),
        ledger: ledger.map((a) => ({ id: a.id, committed: a.committed, pending: a.pending })),
        wal: wal.map((w) => ({ lsn: w.lsn, text: w.text, flushed: w.flushed, kind: w.kind })),
        t2read: t2read,
        crashed: crashed,
        recovery: recovery,
        letter: extra && extra.letter ? extra.letter : "",
        note: extra && extra.note ? extra.note : "",
        outcome: outcome,
        total: ledger.reduce((a, b) => a + b.committed, 0)
      });

      const push = (lane, text) => {
        steps = steps.map((s) => ({ ...s, status: s.status === "active" ? "done" : s.status }));
        steps = steps.concat([{ lane: lane, text: text, status: "active" }]);
      };
      const walAppend = (text, kind) => {
        lsn += 8;
        wal = wal.concat([{ lsn: lsn, text: text, flushed: false, kind: kind || "change" }]);
      };
      const flushAll = () => {
        wal = wal.map((w) => ({ ...w, flushed: true }));
      };

      yield {
        label: `Ledger before anything happens: alice 100, bob 50, carol 30 — total 180. The invariant we care about is that the total never changes; the database does not know that unless we declare it.`,
        phase: "init",
        state: snap({ letter: "C", note: "invariant: total = 180" })
      };

      push(1, "BEGIN");
      yield {
        label: `T1 BEGIN. Nothing is written yet — a transaction id is assigned lazily, on the first write. Until then T1 is invisible and costs nothing.`,
        phase: "T1",
        state: snap({ letter: "A" })
      };

      push(2, "BEGIN");
      yield {
        label: `T2 BEGIN, concurrently. Both transactions now believe they are alone. Making that belief true is the "I" in ACID.`,
        phase: "T2",
        state: snap({ letter: "I" })
      };

      push(1, "UPDATE alice: 100 → 50");
      yield {
        label: `T1's first UPDATE, step 1 of 3: take an exclusive row lock on alice. Any other writer touching this row now waits — writers block writers, always, at every isolation level.`,
        phase: "T1",
        state: snap({ letter: "I", note: "row lock held on alice by T1" })
      };
      walAppend("UPDATE accounts alice 100→50", "change");
      yield {
        label: `Step 2 of 3: append the change to the WAL buffer — the old and new values, so the record can be both redone and undone. "Write-ahead" is literal: the log entry exists before the data changes.`,
        phase: "T1",
        state: snap({ letter: "A", note: "WAL record appended (not yet fsynced)" })
      };
      ledger = ledger.map((a) => (a.id === "alice" ? { ...a, pending: 50 } : a));
      yield {
        label: `Step 3 of 3: modify the page in the buffer cache and mark it dirty. Disk is still untouched. A random page write per row change would be ruinous; one sequential log append is not.`,
        phase: "T1",
        state: snap({ letter: "A", note: "dirty page in buffer cache" })
      };

      push(2, "SELECT balance WHERE id='alice'");
      t2read = { q: "alice", v: 100 };
      yield {
        label: `T2 reads alice and sees 100, not 50 — T1's write is uncommitted, so it is invisible. That is isolation doing its job; the level determines exactly how much invisibility you get.`,
        phase: "T2",
        state: snap({ letter: "I", note: "T2 sees the committed value" })
      };

      push(1, "UPDATE bob: 50 → 100");
      walAppend("UPDATE accounts bob 50→100", "change");
      yield {
        label: `T1's second UPDATE: lock bob, append the WAL record. The log is strictly ordered by LSN, so recovery can replay these two records in exactly the order they happened.`,
        phase: "T1",
        state: snap({ letter: "A", note: "second WAL record, LSN-ordered" })
      };
      ledger = ledger.map((a) => (a.id === "bob" ? { ...a, pending: 100 } : a));
      yield {
        label: `Right now the in-flight state has alice at 50 and bob at 100 — the invariant holds *within* T1, but a crash here would leave two half-applied changes in the log with no commit record. That absence is what makes them not count.`,
        phase: "T1",
        state: snap({ letter: "A", note: "two uncommitted changes pending" })
      };

      push(2, "SELECT sum(balance)");
      t2read = { q: "sum", v: 180 };
      yield {
        label: `T2 sums all balances and gets 180 — it never observes the intermediate 130. Atomicity is not just about the writer; it is about what every reader is allowed to see.`,
        phase: "T2",
        state: snap({ letter: "A", note: "no reader ever sees a half-transfer" })
      };

      push(2, "SELECT … WHERE id='alice' FOR UPDATE  ⟨blocked⟩");
      yield {
        label: `T2 now wants to *write* alice, so it asks for the row lock with FOR UPDATE — and blocks, because T1 holds it. A plain SELECT was never blocked; only the lock request is.`,
        phase: "T2",
        state: snap({ letter: "I", note: "T2 waiting on T1's row lock" })
      };
      yield {
        label: `T2 is still waiting. Every millisecond T1 stays open is a millisecond T2 is stalled — this is the mechanism behind "one slow transaction took the site down". Lock waits are why transactions must be short.`,
        phase: "T2",
        state: snap({ letter: "I", note: "lock wait — T1 controls T2's latency" })
      };

      // ---- terminal action for T1 ------------------------------------------
      if (outcome === "COMMIT" || outcome === "crash after commit") {
        push(1, "COMMIT");
        walAppend("COMMIT xid=1042", "commit");
        yield {
          label: `T1 issues COMMIT. A COMMIT record is appended to the WAL — but the transaction is still NOT durable: the record is in an OS buffer.`,
          phase: "commit",
          state: snap({ letter: "D", note: "COMMIT record appended, not yet on disk" })
        };
        flushAll();
        yield {
          label: `fsync() of the WAL — this is the moment of commit, and typically 0.1–1 ms. Everything before it is now recoverable. This single syscall is why small write transactions are latency-bound, and why group commit exists.`,
          phase: "commit",
          state: snap({ letter: "D", note: "WAL fsynced — durable" })
        };
        ledger = ledger.map((a) => (a.pending != null ? { id: a.id, committed: a.pending, pending: null } : a));
        steps = steps.map((s) => ({ ...s, status: s.status === "active" ? "done" : s.status }));
        yield {
          label: `COMMIT returns. alice 50, bob 100, carol 30 — total still 180. Note the data pages have NOT been written to disk yet; they are dirty in the buffer cache and will be flushed lazily at the next checkpoint.`,
          phase: "commit",
          state: snap({ letter: "A", note: "committed: both updates visible together" })
        };
      } else if (outcome === "ROLLBACK") {
        push(1, "ROLLBACK");
        yield {
          label: `T1 issues ROLLBACK. No COMMIT record is written — and that absence IS the rollback. The WAL records stay in the log; they will simply never be considered committed.`,
          phase: "rollback",
          state: snap({ letter: "A", note: "no COMMIT record will ever be written" })
        };
        ledger = ledger.map((a) => ({ ...a, pending: null }));
        wal = wal.concat([{ lsn: lsn + 8, text: "ABORT xid=1042", flushed: true, kind: "abort" }]);
        steps = steps.map((s) => (s.lane === 1 && s.status !== "active" ? { ...s, status: "undone" } : { ...s, status: s.status === "active" ? "done" : s.status }));
        yield {
          label: `Both updates rewind at once: alice back to 100, bob back to 50. Atomicity means partial application is not a state the system can be in — not even briefly, not even for a reader.`,
          phase: "rollback",
          state: snap({ letter: "A", note: "all-or-nothing: nothing" })
        };
      }

      if (outcome === "crash before commit") {
        crashed = true;
        push(1, "✗ CRASH (power loss)");
        yield {
          label: `Power loss with T1 mid-flight. The WAL holds two change records and NO commit record; the dirty pages in memory are gone. What happens on restart is entirely determined by that missing record.`,
          phase: "crash",
          state: snap({ letter: "A", note: "crash: no COMMIT record in the log" })
        };
        recovery = true;
        yield {
          label: `Recovery starts at the last checkpoint and REDOes every WAL record — including T1's uncommitted updates, because redo is applied blindly. That is safe, because undo comes next.`,
          phase: "recovery",
          state: snap({ letter: "A", note: "redo phase" })
        };
        ledger = ledger.map((a) => ({ ...a, pending: null }));
        steps = steps.map((s) => (s.lane === 1 ? { ...s, status: s.text.indexOf("CRASH") >= 0 ? "aborted" : "undone" } : s));
        yield {
          label: `Undo phase: T1 has no COMMIT record, so every change it made is rolled back. Final state alice 100, bob 50 — exactly as if T1 had never run. Recovery and ROLLBACK are the same machinery.`,
          phase: "recovery",
          state: snap({ letter: "A", note: "undo phase: T1 discarded" })
        };
      } else if (outcome === "crash after commit") {
        crashed = true;
        push(1, "✗ CRASH (after fsync)");
        yield {
          label: `Power loss immediately after COMMIT returned. The data pages were never written to disk — but the WAL, including T1's COMMIT record, was fsynced. Durability says this transaction must survive.`,
          phase: "crash",
          state: snap({ letter: "D", note: "crash: COMMIT record IS on disk" })
        };
        recovery = true;
        yield {
          label: `Recovery replays the WAL from the last checkpoint and reapplies both updates to the pages it re-reads from disk. T1 has a COMMIT record, so nothing is undone — the committed state is reconstructed exactly.`,
          phase: "recovery",
          state: snap({ letter: "D", note: "redo: committed changes restored" })
        };
        yield {
          label: `alice 50, bob 100 — the acknowledged transaction survived a crash it never saw the data pages written for. That is the whole trade the WAL buys: one sequential fsync instead of scattered random page writes.`,
          phase: "recovery",
          state: snap({ letter: "D", note: "durable" })
        };
      }

      // ---- T2 finishes -------------------------------------------------------
      const aliceNow = ledger.find((a) => a.id === "alice").committed;
      if (!crashed) {
        push(2, "⟨lock acquired⟩ alice = " + aliceNow);
        t2read = { q: "alice", v: aliceNow };
        yield {
          label: outcome === "COMMIT"
            ? `T1 ended, so its locks are released and T2's FOR UPDATE finally proceeds — and it re-reads alice as ${aliceNow}, the value T1 committed. Under READ COMMITTED a blocked writer re-evaluates against the *newly committed* row, not the one it originally saw.`
            : `T1 ended, so its locks are released and T2's FOR UPDATE proceeds, reading alice = ${aliceNow}. T1 rolled back, so from T2's point of view T1 never existed at all.`,
          phase: "T2",
          state: snap({ letter: "I", note: "locks released at end of transaction, never before" })
        };
        push(2, "COMMIT");
        yield {
          label: `T2 commits. It only read rows, so its COMMIT is nearly free — a read-only transaction writes no WAL and needs no fsync. Locks are held until here, not until the last statement.`,
          phase: "T2",
          state: snap({ letter: "D", note: "read-only commit: no WAL, no fsync" })
        };
      }

      if (!crashed) {
        wal = wal.concat([{ lsn: lsn + 16, text: "CHECKPOINT", flushed: true, kind: "commit" }]);
        yield {
          label: `Later, a CHECKPOINT runs: every dirty page is finally written to disk and the log before this point becomes replayable-from-here-only. Checkpoints bound recovery time — they are the reason a crash does not mean replaying the whole log.`,
          phase: "checkpoint",
          state: snap({ letter: "D", note: "dirty pages flushed; recovery starts from here" })
        };
      }

      yield {
        label: `Final ledger: ${ledger.map((a) => a.id + "=" + a.committed).join(", ")} — total ${ledger.reduce((a, b) => a + b.committed, 0)}, unchanged. A: the WAL. C: the constraints you declared. I: concurrency control. D: the fsync.`,
        phase: "done",
        state: snap({ letter: "", note: "A=WAL · C=your constraints · I=concurrency control · D=fsync" })
      };
    },

    draw: function (frame, root, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;

      const h = env.h || function (tag, attrs, kids) {
        const n = document.createElementNS("http://www.w3.org/2000/svg", tag);
        if (attrs) for (const k in attrs) n.setAttribute(k, String(attrs[k]));
        if (kids) for (const c of kids) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
        return n;
      };
      while (root.firstChild) root.removeChild(root.firstChild);
      root.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const add = (n) => root.appendChild(n);
      const txt = (x, y, str, o) => {
        o = o || {};
        return h("text", {
          x: x, y: y, fill: o.fill || C.text2,
          "font-size": o.size || 11,
          "font-family": o.sans ? env.font.base : env.font.mono,
          "text-anchor": o.anchor || "start",
          "font-weight": o.weight || "normal",
          opacity: o.opacity == null ? 1 : o.opacity
        }, [String(str)]);
      };
      const rect = (x, y, w, hh, o) => {
        o = o || {};
        return h("rect", {
          x: x, y: y, width: Math.max(0, w), height: Math.max(0, hh), rx: o.r == null ? 5 : o.r,
          fill: o.fill || "none", stroke: o.stroke || "none",
          "stroke-width": o.sw || 1, opacity: o.opacity == null ? 1 : o.opacity,
          "stroke-dasharray": o.dash || "none"
        });
      };

      // ---------------- header: ACID letters --------------------------------
      const letters = [
        { k: "A", t: "Atomicity — WAL undo/redo" },
        { k: "C", t: "Consistency — your constraints" },
        { k: "I", t: "Isolation — concurrency control" },
        { k: "D", t: "Durability — fsync" }
      ];
      for (let i = 0; i < 4; i++) {
        const x = 16 + i * 150;
        const on = s.letter === letters[i].k;
        add(rect(x, 12, 142, 30, { fill: on ? C.viz1 : C.surface2, opacity: on ? 0.9 : 0.5, stroke: on ? C.viz1 : C.border }));
        add(txt(x + 10, 32, letters[i].k, { fill: on ? C.text : C.muted, size: 15, weight: "600" }));
        add(txt(x + 26, 31, letters[i].t, { fill: on ? C.text2 : C.muted, size: 9 }));
      }
      if (s.note) add(txt(W - 16, 32, s.note, { fill: C.viz4, size: 11, anchor: "end" }));

      // ---------------- transaction lanes -----------------------------------
      const laneTop = 62;
      const laneW = Math.min(300, (W - 380) / 2);
      const laneX = [16, 16 + laneW + 18];
      const rowH = Math.min(28, (H - laneTop - 130) / Math.max(6, s.steps.length));

      add(txt(laneX[0], laneTop - 6, "T1  (the transfer)", { fill: C.viz1, size: 12, sans: true }));
      add(txt(laneX[1], laneTop - 6, "T2  (a concurrent reader)", { fill: C.viz5, size: 12, sans: true }));
      for (let i = 0; i < 2; i++) {
        add(h("line", { x1: laneX[i] + 8, y1: laneTop, x2: laneX[i] + 8, y2: laneTop + rowH * Math.max(1, s.steps.length) + 6, stroke: C.grid, "stroke-width": 2 }));
      }

      for (let i = 0; i < s.steps.length; i++) {
        const st = s.steps[i];
        const x = laneX[st.lane - 1];
        const y = laneTop + i * rowH;
        const base = st.lane === 1 ? C.viz1 : C.viz5;
        let fill = C.surface2, stroke = C.border, fg = C.text2, op = 0.9, dash = "none";
        if (st.status === "active") { fill = base; stroke = base; fg = C.text; op = 0.9; }
        else if (st.status === "undone") { fill = C.surface2; stroke = C.viz8; fg = C.muted; op = 0.45; dash = "4 3"; }
        else if (st.status === "aborted") { fill = C.surface2; stroke = C.danger; fg = C.danger; op = 0.9; }
        add(rect(x + 16, y + 2, laneW - 24, rowH - 6, { fill: fill, stroke: stroke, opacity: op, dash: dash, r: 4 }));
        add(h("circle", { cx: x + 8, cy: y + rowH / 2 - 1, r: 4, fill: st.status === "active" ? base : C.grid }));
        add(txt(x + 24, y + rowH / 2 + 3, st.text, { fill: fg, size: 10.5 }));
        if (st.status === "undone") {
          add(h("line", { x1: x + 22, y1: y + rowH / 2 - 1, x2: x + laneW - 12, y2: y + rowH / 2 - 1, stroke: C.viz8, "stroke-width": 1 }));
        }
      }

      // ---------------- ledger ------------------------------------------------
      const px = laneX[1] + laneW + 26;
      const pw = W - px - 16;
      add(txt(px, laneTop - 6, "accounts (the ledger)", { fill: C.text, size: 12, sans: true }));
      add(rect(px, laneTop, pw, 4 + s.ledger.length * 34, { fill: C.surface2, opacity: 0.45, stroke: C.border }));
      for (let i = 0; i < s.ledger.length; i++) {
        const a = s.ledger[i];
        const y = laneTop + 10 + i * 34;
        add(txt(px + 14, y + 16, a.id, { fill: C.text2, size: 12 }));
        if (a.pending != null) {
          add(txt(px + 100, y + 16, String(a.committed), { fill: C.muted, size: 13 }));
          add(h("line", { x1: px + 98, y1: y + 11, x2: px + 130, y2: y + 11, stroke: C.viz8, "stroke-width": 1 }));
          add(txt(px + 142, y + 16, "→ " + a.pending, { fill: C.viz4, size: 13, weight: "600" }));
          add(txt(px + 210, y + 16, "uncommitted", { fill: C.viz4, size: 9 }));
        } else {
          add(txt(px + 100, y + 16, String(a.committed), { fill: C.text, size: 13, weight: "600" }));
          add(txt(px + 142, y + 16, "committed", { fill: C.viz6, size: 9 }));
        }
      }
      const totY = laneTop + 14 + s.ledger.length * 34;
      add(txt(px + 14, totY + 12, `total = ${s.total}`, { fill: s.total === 180 ? C.viz6 : C.danger, size: 12 }));
      add(txt(px + 120, totY + 12, s.total === 180 ? "invariant holds" : "INVARIANT VIOLATED", { fill: s.total === 180 ? C.muted : C.danger, size: 10 }));

      if (s.t2read) {
        add(txt(px + 14, totY + 40, `T2 last read: ${s.t2read.q} = ${s.t2read.v}`, { fill: C.viz5, size: 11 }));
      }
      if (s.crashed) {
        add(rect(px, totY + 54, pw, 30, { fill: C.danger, opacity: 0.18, stroke: C.danger }));
        add(txt(px + 12, totY + 74, s.recovery ? "recovery: redo from checkpoint, then undo the uncommitted" : "CRASH — memory lost, only the WAL survives", { fill: C.danger, size: 11 }));
      }

      // ---------------- WAL strip ----------------------------------------------
      const wy = H - 96;
      add(txt(16, wy - 8, "write-ahead log (append-only, sequential)", { fill: C.text, size: 12, sans: true }));
      const bw = Math.min(150, (W - 40) / Math.max(1, s.wal.length + 1));
      for (let i = 0; i < s.wal.length; i++) {
        const w = s.wal[i];
        const x = 16 + i * (bw + 8);
        const isCommit = w.kind === "commit";
        const isAbort = w.kind === "abort";
        add(rect(x, wy, bw, 46, {
          fill: isCommit ? C.viz6 : isAbort ? C.viz8 : C.surface2,
          opacity: w.flushed ? 0.85 : 0.45,
          stroke: w.flushed ? (isCommit ? C.viz6 : isAbort ? C.viz8 : C.border) : C.viz4,
          dash: w.flushed ? "none" : "4 3"
        }));
        add(txt(x + 8, wy + 16, "LSN " + w.lsn, { fill: C.muted, size: 9 }));
        add(txt(x + 8, wy + 30, w.text.slice(0, 22), { fill: isCommit || isAbort ? C.text : C.text2, size: 9.5 }));
        add(txt(x + 8, wy + 42, w.flushed ? "fsynced" : "in OS buffer", { fill: w.flushed ? C.viz6 : C.viz4, size: 9 }));
      }
      if (s.wal.length === 0) {
        add(txt(16, wy + 26, "(empty — a transaction that has written nothing costs nothing)", { fill: C.muted, size: 10 }));
      }
      add(txt(W - 16, H - 8, `T1 outcome: ${s.outcome}`, { fill: C.muted, size: 10, anchor: "end" }));
    }
  },

  drill: {
    cards: [
      { q: "Which ACID properties does the WAL provide?", a: "Atomicity and Durability. Redo replays committed changes after a crash; undo discards transactions with no COMMIT record — the same path ROLLBACK uses.", tags: ["wal"] },
      { q: "Who is responsible for the C in ACID?", a: "You. The engine enforces declared constraints (PK/FK/CHECK/NOT NULL/unique); application invariants only hold if you encode them or maintain them inside the transaction.", tags: ["consistency"] },
      { q: "What exactly happens at COMMIT?", a: "A COMMIT record is appended to the WAL and fsynced. That fsync is the commit point — data pages are written lazily later, at a checkpoint.", tags: ["commit"] },
      { q: "What does `synchronous_commit = off` give up?", a: "Durability of the most recent commits (up to ~600 ms can be lost on a crash) in exchange for ~10× faster commits. It never corrupts the database — atomicity is preserved.", tags: ["durability"] },
      { q: "What is group commit?", a: "Batching many concurrent commits behind a single WAL fsync. Throughput scales with concurrency while per-commit latency stays at one fsync.", tags: ["performance"] },
      { q: "Why are long-open transactions dangerous in Postgres?", a: "They hold locks and pin an old snapshot, so VACUUM cannot reclaim dead row versions — the table and indexes bloat and the xid horizon stalls. Bound them with `idle_in_transaction_session_timeout`.", tags: ["pitfall"] },
      { q: "What is a savepoint?", a: "A marker inside a transaction; `ROLLBACK TO SAVEPOINT s` undoes work back to it without ending the transaction. ORMs use them for nested-transaction emulation; thousands of them are a known performance cliff.", tags: ["savepoint"] },
      { q: "Crash between WAL fsync and data-page write — what is lost?", a: "Nothing. Recovery replays the WAL from the last checkpoint and reapplies the change. That is precisely what write-ahead logging buys.", tags: ["recovery"] }
    ],
    sixtySecond: [
      "Explain each letter of ACID and name the database component that provides it.",
      "Walk through what happens between COMMIT being issued and COMMIT returning, and what a crash at each point would mean."
    ]
  }
};
