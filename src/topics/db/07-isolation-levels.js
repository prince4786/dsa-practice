export default {
  id: "isolation-levels",
  track: "db",
  title: "Isolation Levels & Anomalies",
  difficulty: 2,
  minutes: 18,
  tags: ["transactions", "isolation", "anomalies", "serializable"],

  explainer: [
    { type: "p", text: "Isolation is a dial, not a switch. The SQL standard defines four levels by which **anomalies** they permit — and the levels only make sense if you can name the anomalies. The practical version of this topic is: know the four anomalies, know which level stops each, and know that your database's defaults are weaker than you think." },
    { type: "h3", text: "The anomalies, in increasing subtlety" },
    { type: "list", items: [
      "**Dirty read** — you read a row another transaction has modified but not committed. If it rolls back, you acted on a value that never existed. Prevented from READ COMMITTED up.",
      "**Non-repeatable read** — you read a row twice in one transaction and get different values because someone committed in between. Prevented from REPEATABLE READ up.",
      "**Phantom read** — you run the same *range* query twice and new rows appear. ANSI says REPEATABLE READ permits this; Postgres's snapshot-based RR does not, and MySQL's InnoDB blocks it with gap locks.",
      "**Lost update** — two transactions read the same value, both compute a new one, and the second overwrites the first. Read-committed permits it silently; Postgres's RR raises a serialization error instead.",
      "**Write skew** — two transactions read an overlapping set, each checks an invariant that is still true, then each writes a *different* row, and together they break the invariant. **Only SERIALIZABLE prevents this.** It is the anomaly that makes snapshot isolation insufficient, and the one interviewers use to separate levels."
    ]},
    { type: "h3", text: "What the levels actually are in practice" },
    { type: "list", items: [
      "**READ UNCOMMITTED** — Postgres does not implement it at all (it behaves as READ COMMITTED). It exists mostly in the standard and in SQL Server's `NOLOCK` hint.",
      "**READ COMMITTED** (Postgres & Oracle default) — a *new snapshot per statement*. Each statement sees a consistent view, but two statements in the same transaction can disagree.",
      "**REPEATABLE READ** (MySQL/InnoDB default) — one snapshot for the whole transaction. In Postgres this is true snapshot isolation: no phantoms either, and conflicting writers get `40001 could not serialize access`.",
      "**SERIALIZABLE** — the result is equivalent to *some* serial order. Postgres implements SSI (Serializable Snapshot Isolation): optimistic, tracks read/write dependencies, and aborts a transaction that would create a dangerous cycle. MySQL implements it by turning every read into a locking read."
    ]},
    { type: "callout", tone: "warn", text: "At SERIALIZABLE (and at Postgres REPEATABLE READ) your application **must** handle SQLSTATE 40001 by retrying the whole transaction. There is no way around this: the level is enforced by aborting, not by blocking. Code that does not retry will surface random 500s under load." },
    { type: "callout", tone: "tip", text: "You rarely need to raise the global level. Targeted pessimistic locking — `SELECT ... FOR UPDATE` on exactly the rows you are about to modify — fixes lost updates at any level and is what most production systems actually do. For write skew, either lock the rows you *read* (`FOR SHARE`/`FOR UPDATE`), materialise the constraint into a row you can lock, or go SERIALIZABLE." },
    { type: "h3", text: "Optimistic alternative" },
    { type: "p", text: "`UPDATE ... WHERE id = ? AND version = ?` plus a check that one row was affected gives you lost-update protection with no locks and no level change. It is the standard ORM strategy (Hibernate `@Version`), it scales better under low contention, and it puts the retry in your hands." }
  ],

  complexity: null,

  interview: {
    whyAsked: "It is the fastest way to find out whether someone has actually shipped concurrent code. Anyone can list the four levels; the signal is whether you can construct a write-skew example, know your database's default level, and know that serializable means handling retry errors.",
    followUps: [
      { q: "What is write skew and which level prevents it?", a: "Two transactions read an overlapping set, each verifies an invariant that still holds, then each updates a *different* row; individually valid, together they break the invariant. The classic case: two on-call doctors each check that another is on call, and both go off call. Snapshot isolation (Postgres REPEATABLE READ) does not prevent it because they never write the same row — only SERIALIZABLE does, or explicitly locking the rows you read." },
      { q: "What is your database's default isolation level?", a: "Postgres and Oracle: READ COMMITTED — a fresh snapshot per statement, so two reads in one transaction can disagree. MySQL/InnoDB: REPEATABLE READ — one snapshot per transaction, with gap locks preventing phantoms. SQL Server: READ COMMITTED, lock-based unless READ_COMMITTED_SNAPSHOT is on." },
      { q: "How does Postgres implement SERIALIZABLE?", a: "SSI — Serializable Snapshot Isolation. Transactions run optimistically on snapshots while the engine tracks read/write dependencies through predicate locks; if it detects a pattern that could produce a non-serializable cycle, it aborts one transaction with SQLSTATE 40001. So it costs no blocking, but the application must retry." },
      { q: "Two users click 'buy the last ticket' at the same moment. What happens and how do you fix it?", a: "At READ COMMITTED both read stock = 1, both decrement, and you have sold two tickets — a lost update. Fixes: `SELECT ... FOR UPDATE` on the stock row so the second waits and re-reads; an atomic conditional write `UPDATE stock SET n = n - 1 WHERE id = ? AND n > 0` and check the affected-row count; optimistic version columns; or SERIALIZABLE with retry. A `CHECK (n >= 0)` constraint is a good backstop." },
      { q: "Does REPEATABLE READ prevent phantoms?", a: "By the standard, no. In practice, yes in both major engines but for different reasons: Postgres's RR is snapshot isolation, so a transaction simply never sees rows committed after its snapshot; InnoDB uses next-key/gap locks to block the insert. This is a great example of the standard being weaker than the implementations." },
      { q: "What is SQLSTATE 40001 and what should your app do?", a: "`serialization_failure` — the engine aborted your transaction to preserve the isolation guarantee. The only correct handling is to roll back and retry the entire transaction, with a bounded retry count and jittered backoff. Retrying a single statement is wrong: the whole transaction's snapshot is gone." },
      { q: "When would you deliberately use READ UNCOMMITTED / NOLOCK?", a: "Almost never. It is unavailable in Postgres, and in SQL Server `NOLOCK` can return not just uncommitted data but duplicated or skipped rows during page splits. The legitimate use case — a rough count on a huge table for a dashboard — is better served by an approximate count from statistics." }
    ]
  },

  code: [
    { lang: "sql", label: "Reproducing each anomaly (two psql sessions)", code: "-- === NON-REPEATABLE READ ===============================\n-- session 1\nBEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED;\nSELECT balance FROM accounts WHERE id = 'alice';   -- 100\n-- session 2\nUPDATE accounts SET balance = 50 WHERE id = 'alice';   -- autocommit\n-- session 1 (same transaction!)\nSELECT balance FROM accounts WHERE id = 'alice';   -- 50   <-- changed\nCOMMIT;\n\n-- Same script at REPEATABLE READ returns 100 both times:\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\n\n-- === LOST UPDATE =======================================\n-- both sessions at READ COMMITTED\nBEGIN; SELECT balance FROM accounts WHERE id='alice';  -- both read 100\nUPDATE accounts SET balance = 90 WHERE id='alice';     -- both write 90\nCOMMIT;                                                -- 10 vanished\n\n-- === WRITE SKEW ========================================\n-- invariant: at least one doctor on call\nBEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ;\nSELECT count(*) FROM doctors WHERE on_call;            -- both see 2\nUPDATE doctors SET on_call = false WHERE name='alice'; -- different rows!\nCOMMIT;                                                -- both succeed\n-- result: zero doctors on call. Only SERIALIZABLE stops this." },
    { lang: "sql", label: "The three fixes, cheapest first", code: "-- 1. ATOMIC CONDITIONAL WRITE -- no lock, no retry, no level change\nUPDATE inventory SET stock = stock - 1\nWHERE  sku = 'ABC' AND stock > 0;\n-- then check the affected row count; 0 means someone beat you to it\n\n-- 2. OPTIMISTIC VERSION COLUMN -- what ORMs do\nUPDATE orders SET status = 'shipped', version = version + 1\nWHERE  id = 42 AND version = 7;\n-- 0 rows affected -> reload and retry in application code\n\n-- 3. PESSIMISTIC LOCK -- serialises just the rows that matter\nBEGIN;\nSELECT stock FROM inventory WHERE sku = 'ABC' FOR UPDATE;  -- others wait\nUPDATE inventory SET stock = stock - 1 WHERE sku = 'ABC';\nCOMMIT;\n\n-- FOR UPDATE variants worth knowing:\nSELECT ... FOR UPDATE NOWAIT;         -- fail instantly instead of waiting\nSELECT ... FOR UPDATE SKIP LOCKED;    -- the queue-worker pattern\nSELECT ... FOR SHARE;                 -- lock rows you only READ (write skew)" },
    { lang: "sql", label: "SERIALIZABLE with a retry loop", code: "-- Postgres SSI aborts rather than blocks, so retries are mandatory.\nBEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;\nSELECT count(*) FROM doctors WHERE on_call AND shift_id = 4;\nUPDATE doctors SET on_call = false WHERE name = 'alice' AND shift_id = 4;\nCOMMIT;\n-- ERROR:  could not serialize access due to read/write dependencies\n--         among transactions\n-- SQLSTATE: 40001   HINT: The transaction might succeed if retried.\n\n-- Application side (pseudo-Python):\n-- for attempt in range(5):\n--     try:\n--         with conn.transaction(isolation='serializable'):\n--             run_business_logic()\n--         break\n--     except SerializationFailure:          # 40001, also 40P01 deadlock\n--         sleep(random.uniform(0, 0.05 * 2 ** attempt))\n\nSELECT datname, xact_commit, xact_rollback FROM pg_stat_database;\n-- a rising rollback ratio at SERIALIZABLE = contention, add retries/backoff" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.45, maxFrames: 160 },

    params: [
      { key: "level", label: "Isolation level", type: "enum", options: ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"], default: "READ COMMITTED" },
      { key: "anomaly", label: "Scenario", type: "enum", options: ["dirty read", "non-repeatable read", "phantom read", "lost update", "write skew"], default: "non-repeatable read" }
    ],

    frames: function* (params, rng) {
      const LEVELS = ["READ UNCOMMITTED", "READ COMMITTED", "REPEATABLE READ", "SERIALIZABLE"];
      const ANOMS = ["dirty read", "non-repeatable read", "phantom read", "lost update", "write skew"];
      // true = prevented at this level
      const PREVENTED = {
        "dirty read": [false, true, true, true],
        "non-repeatable read": [false, false, true, true],
        "phantom read": [false, false, true, true],
        "lost update": [false, false, true, true],
        "write skew": [false, false, false, true]
      };
      const level = params.level;
      const li = LEVELS.indexOf(level);
      const anomaly = params.anomaly;
      const snapshotPerTxn = li >= 2;      // RR and SER hold one snapshot
      const seesUncommitted = li === 0;

      let steps = [];
      let db = [];
      let t1view = [];
      let verdict = null;
      let matrix = [];
      let cursor = null;
      let dbTitle = "accounts (committed)";
      let viewTitle = "what T1 sees";

      const snap = (extra) => ({
        level: level, levelIdx: li, anomaly: anomaly,
        levels: LEVELS.slice(), anomalies: ANOMS.slice(),
        steps: steps.map((s) => ({ lane: s.lane, text: s.text, tag: s.tag, status: s.status })),
        db: db.map((r) => ({ k: r.k, v: r.v, ghost: !!r.ghost })),
        t1view: t1view.map((r) => ({ k: r.k, v: r.v, ghost: !!r.ghost })),
        dbTitle: dbTitle, viewTitle: viewTitle,
        verdict: verdict ? { prevented: verdict.prevented, text: verdict.text } : null,
        matrix: matrix.map((m) => ({ a: m.a, l: m.l, prevented: m.prevented })),
        cursor: cursor ? cursor.slice() : null,
        note: extra && extra.note ? extra.note : ""
      });

      const push = (lane, text, tag) => {
        steps = steps.map((s) => ({ ...s, status: s.status === "active" ? "done" : s.status }));
        steps = steps.concat([{ lane: lane, text: text, tag: tag || "op", status: "active" }]);
      };

      yield {
        label: `Scenario: ${anomaly}, replayed at ${level}. T1 on the left, T2 on the right, time flowing down. The question every isolation level answers is: what is T1 allowed to see?`,
        phase: "setup",
        state: snap({ note: "twin timelines, one shared database" })
      };

      // ==================== DIRTY READ =====================================
      if (anomaly === "dirty read") {
        db = [{ k: "alice", v: 100 }, { k: "bob", v: 50 }];
        t1view = [];
        push(1, "BEGIN  (" + level + ")", "begin");
        yield { label: `T1 begins at ${level}.`, phase: "run", state: snap({}) };
        push(2, "BEGIN", "begin");
        yield { label: `T2 begins.`, phase: "run", state: snap({}) };
        push(2, "UPDATE alice SET balance = 50", "write");
        yield {
          label: `T2 writes alice = 50 but has NOT committed. The new value exists only in T2's uncommitted row version, guarded by an exclusive row lock.`,
          phase: "run",
          state: snap({ note: "uncommitted write in flight" })
        };
        push(1, "SELECT balance WHERE id='alice'", "read");
        t1view = [{ k: "alice", v: seesUncommitted ? 50 : 100, ghost: seesUncommitted }];
        yield {
          label: seesUncommitted
            ? `T1 reads alice and sees 50 — a value no committed transaction ever produced. This is a DIRTY READ, and only READ UNCOMMITTED allows it.`
            : `T1 reads alice and sees 100. At ${level} an uncommitted row version is simply not visible — MVCC hands T1 the last committed version instead of blocking it.`,
          phase: "run",
          state: snap({ note: seesUncommitted ? "reading uncommitted data" : "reads the last committed version" })
        };
        push(2, "ROLLBACK", "rollback");
        db = [{ k: "alice", v: 100 }, { k: "bob", v: 50 }];
        yield {
          label: seesUncommitted
            ? `T2 rolls back — alice is 100 again, and was never anything else. T1 has already acted on 50: it read a value from a transaction that never happened.`
            : `T2 rolls back. T1's read of 100 is still correct: it never depended on T2's outcome at all.`,
          phase: "run",
          state: snap({ note: "T2 undone" })
        };
        verdict = {
          prevented: PREVENTED[anomaly][li],
          text: PREVENTED[anomaly][li]
            ? `${level} prevents dirty reads: readers see only committed versions.`
            : `${level} permits dirty reads. Postgres does not even implement this level — it silently upgrades to READ COMMITTED.`
        };
      }

      // ==================== NON-REPEATABLE READ ============================
      else if (anomaly === "non-repeatable read") {
        db = [{ k: "alice", v: 100 }, { k: "bob", v: 50 }];
        push(1, "BEGIN  (" + level + ")", "begin");
        yield {
          label: snapshotPerTxn
            ? `T1 begins at ${level}. A snapshot is taken for the WHOLE transaction — every statement will see this same instant.`
            : `T1 begins at ${level}. Each *statement* will take its own fresh snapshot; that is the entire difference from REPEATABLE READ.`,
          phase: "run",
          state: snap({ note: snapshotPerTxn ? "one snapshot per transaction" : "one snapshot per statement" })
        };
        push(1, "SELECT balance WHERE id='alice'", "read");
        t1view = [{ k: "alice", v: 100 }];
        yield { label: `T1's first read: alice = 100. Remember this number — the anomaly is about whether the same read repeats.`, phase: "run", state: snap({}) };
        push(2, "BEGIN; UPDATE alice = 50; COMMIT", "write");
        db = [{ k: "alice", v: 50 }, { k: "bob", v: 50 }];
        yield {
          label: `T2 sets alice = 50 and COMMITS, entirely inside T1's lifetime. The committed state has changed under T1's feet.`,
          phase: "run",
          state: snap({ note: "T2 committed while T1 is still open" })
        };
        push(1, "SELECT balance WHERE id='alice'   -- again", "read");
        t1view = [{ k: "alice", v: snapshotPerTxn ? 100 : 50 }];
        yield {
          label: snapshotPerTxn
            ? `T1 reads again and still sees 100. Its snapshot predates T2's commit, so T2's version is invisible — the read repeats. Nothing blocked; MVCC just kept the old version.`
            : `T1 reads again and now sees 50. Same query, same transaction, different answer — a NON-REPEATABLE READ. Any logic that read a value, decided something, and re-read it is now inconsistent.`,
          phase: "run",
          state: snap({ note: snapshotPerTxn ? "snapshot still holds" : "value changed mid-transaction" })
        };
        verdict = {
          prevented: PREVENTED[anomaly][li],
          text: PREVENTED[anomaly][li]
            ? `${level} holds one snapshot for the whole transaction, so re-reads are stable.`
            : `${level} takes a new snapshot per statement, so a committed change between two reads is visible.`
        };
      }

      // ==================== PHANTOM READ ===================================
      else if (anomaly === "phantom read") {
        dbTitle = "accounts WHERE balance > 40";
        db = [{ k: "alice", v: 100 }, { k: "bob", v: 50 }];
        push(1, "BEGIN  (" + level + ")", "begin");
        yield { label: `T1 begins at ${level}. A phantom is about a *range* of rows, not a single row — that is what makes it different from a non-repeatable read.`, phase: "run", state: snap({}) };
        push(1, "SELECT count(*) WHERE balance > 40", "read");
        t1view = [{ k: "count", v: 2 }];
        yield { label: `T1 counts 2 accounts over 40. Note that it locked nothing — there is no row to lock for rows that do not exist yet.`, phase: "run", state: snap({}) };
        push(2, "INSERT dave 90; COMMIT", "write");
        db = [{ k: "alice", v: 100 }, { k: "bob", v: 50 }, { k: "dave", v: 90 }];
        yield {
          label: `T2 INSERTs a brand-new row (dave = 90) that satisfies T1's predicate, and commits. This is the row that will or will not haunt T1.`,
          phase: "run",
          state: snap({ note: "new row matching T1's predicate" })
        };
        push(1, "SELECT count(*) WHERE balance > 40   -- again", "read");
        t1view = [{ k: "count", v: snapshotPerTxn ? 2 : 3 }];
        yield {
          label: snapshotPerTxn
            ? `T1 re-counts and still gets 2. Postgres's REPEATABLE READ is snapshot isolation, so rows committed after the snapshot are invisible — no phantom. Note the ANSI standard technically permits phantoms at RR; MySQL blocks them instead with next-key/gap locks.`
            : `T1 re-counts and gets 3 — a row appeared out of nowhere. That is a PHANTOM READ, and it breaks any "check the range, then act" logic.`,
          phase: "run",
          state: snap({ note: snapshotPerTxn ? "row invisible to T1's snapshot" : "phantom row appeared" })
        };
        verdict = {
          prevented: PREVENTED[anomaly][li],
          text: PREVENTED[anomaly][li]
            ? `${level} prevents phantoms in practice — via snapshots (Postgres) or gap locks (InnoDB).`
            : `${level} permits phantoms: each statement re-evaluates the range against whatever is committed now.`
        };
      }

      // ==================== LOST UPDATE ====================================
      else if (anomaly === "lost update") {
        db = [{ k: "alice", v: 100 }];
        push(1, "BEGIN  (" + level + ")", "begin");
        push(2, "BEGIN  (" + level + ")", "begin");
        yield { label: `Both transactions begin at ${level}. This is the read-modify-write race behind every double-charge and oversold-inventory incident.`, phase: "run", state: snap({}) };
        push(1, "SELECT balance → 100", "read");
        t1view = [{ k: "alice", v: 100 }];
        yield { label: `T1 reads alice = 100 and computes 100 − 10 = 90 in application code. The database has no idea a decision was made from this value.`, phase: "run", state: snap({}) };
        push(2, "SELECT balance → 100", "read");
        yield { label: `T2 reads alice = 100 too — reads never block reads. Both now hold the same stale 100 and both intend to write 90.`, phase: "run", state: snap({ note: "both computed from 100" }) };
        push(1, "UPDATE alice = 90", "write");
        yield { label: `T1 writes 90 and takes the exclusive row lock.`, phase: "run", state: snap({ note: "T1 holds the row lock" }) };
        push(2, "UPDATE alice = 90   ⟨blocked⟩", "wait");
        yield { label: `T2 tries the same UPDATE and blocks on T1's lock. This is the moment the database *could* save you — what happens when the lock is released depends entirely on the level.`, phase: "run", state: snap({ note: "T2 waiting on the row lock" }) };
        push(1, "COMMIT", "commit");
        db = [{ k: "alice", v: 90 }];
        yield { label: `T1 commits: alice = 90. Lock released, T2 wakes up.`, phase: "run", state: snap({}) };
        if (snapshotPerTxn) {
          push(2, "ERROR 40001 serialization failure", "error");
          yield {
            label: `T2 wakes and finds the row it wants to update has been changed by a transaction committed after T2's snapshot. Under ${level} that is not allowed to be silently overwritten — T2 is ABORTED with SQLSTATE 40001 and must retry. Correctness at the cost of a mandatory retry loop.`,
            phase: "run",
            state: snap({ note: "aborted rather than lose the update" })
          };
        } else {
          push(2, "COMMIT   (writes 90 over 90)", "commit");
          db = [{ k: "alice", v: 90 }];
          yield {
            label: `T2 re-reads the row under READ COMMITTED, applies its already-computed 90, and commits. Two withdrawals of 10 happened but the balance only fell by 10 — a LOST UPDATE. No error, no warning, wrong money.`,
            phase: "run",
            state: snap({ note: "expected 80, got 90" })
          };
        }
        verdict = {
          prevented: PREVENTED[anomaly][li],
          text: PREVENTED[anomaly][li]
            ? `${level} detects the write-write conflict and aborts (40001) — retry the whole transaction.`
            : `${level} lets the second writer overwrite silently. Fix with SELECT … FOR UPDATE, an atomic UPDATE … WHERE balance = 100, or a version column.`
        };
      }

      // ==================== WRITE SKEW =====================================
      else {
        dbTitle = "doctors (on_call)";
        viewTitle = "what each txn checked";
        db = [{ k: "alice", v: "on call" }, { k: "bob", v: "on call" }];
        push(1, "BEGIN  (" + level + ")", "begin");
        push(2, "BEGIN  (" + level + ")", "begin");
        yield { label: `Invariant: at least one doctor must be on call. Both alice and bob are on call, and both want to go off. This is the anomaly that snapshot isolation cannot see.`, phase: "run", state: snap({ note: "invariant: count(on_call) >= 1" }) };
        push(1, "SELECT count(*) WHERE on_call → 2", "read");
        t1view = [{ k: "T1 saw", v: 2 }];
        yield { label: `T1 checks the invariant: 2 doctors on call, so it is safe for alice to go off. A perfectly correct check — against the state it can see.`, phase: "run", state: snap({}) };
        push(2, "SELECT count(*) WHERE on_call → 2", "read");
        t1view = [{ k: "T1 saw", v: 2 }, { k: "T2 saw", v: 2 }];
        yield { label: `T2 runs the identical check and also sees 2. Both are reading, so nothing blocks and nothing conflicts — yet.`, phase: "run", state: snap({ note: "both read the same set" }) };
        push(1, "UPDATE alice SET on_call = false", "write");
        yield { label: `T1 updates the alice row.`, phase: "run", state: snap({}) };
        push(2, "UPDATE bob SET on_call = false", "write");
        yield {
          label: `T2 updates the BOB row. Crucially the two transactions write *different rows* — there is no write-write conflict, no lock contention, nothing for row-level MVCC to detect.`,
          phase: "run",
          state: snap({ note: "disjoint writes — no row conflict exists" })
        };
        push(1, "COMMIT", "commit");
        db = [{ k: "alice", v: "OFF" }, { k: "bob", v: "on call" }];
        yield { label: `T1 commits. Still one doctor on call — the invariant holds. Nothing has gone wrong yet.`, phase: "run", state: snap({}) };
        if (li === 3) {
          push(2, "ERROR 40001 read/write dependencies", "error");
          yield {
            label: `T2 commits — and SERIALIZABLE aborts it. Postgres's SSI tracked that T2 READ a set that T1 then WROTE, and that committing both would produce a cycle with no equivalent serial order. It is the only level that watches read/write dependencies rather than just row conflicts.`,
            phase: "run",
            state: snap({ note: "SSI detected a dangerous dependency cycle" })
          };
        } else {
          push(2, "COMMIT", "commit");
          db = [{ k: "alice", v: "OFF" }, { k: "bob", v: "OFF" }];
          yield {
            label: `T2 commits too — and now ZERO doctors are on call. Each transaction was individually valid; together they broke the invariant. This is WRITE SKEW, and ${level} cannot see it because the two writes never touched the same row.`,
            phase: "run",
            state: snap({ note: "invariant violated: 0 on call" })
          };
        }
        verdict = {
          prevented: PREVENTED[anomaly][li],
          text: PREVENTED[anomaly][li]
            ? `Only SERIALIZABLE prevents write skew — by aborting one transaction, so you must retry.`
            : `${level} permits write skew. Fixes short of SERIALIZABLE: lock the rows you READ with FOR UPDATE/FOR SHARE, or materialise the invariant into a single row you can lock.`
        };
      }

      yield {
        label: (verdict.prevented ? "PREVENTED — " : "ANOMALY OCCURRED — ") + verdict.text,
        phase: verdict.prevented ? "safe" : "anomaly",
        state: snap({ note: "verdict" })
      };

      // ==================== matrix sweep ===================================
      for (let a = 0; a < ANOMS.length; a++) {
        for (let l = 0; l < LEVELS.length; l++) {
          matrix = matrix.concat([{ a: a, l: l, prevented: PREVENTED[ANOMS[a]][l] }]);
          cursor = [a, l];
          const first = PREVENTED[ANOMS[a]].indexOf(true);
          yield {
            label: `${ANOMS[a]} @ ${LEVELS[l]}: ${PREVENTED[ANOMS[a]][l] ? "prevented" : "possible"}.` +
              (l === LEVELS.length - 1
                ? ` — ${ANOMS[a]} needs at least ${first === -1 ? "more than SERIALIZABLE" : LEVELS[first]}.`
                : ""),
            phase: "matrix",
            state: snap({ note: "building the level × anomaly matrix" })
          };
        }
      }
      cursor = null;
      yield {
        label: `The whole topic in one table. Note the staircase — each level adds one guarantee — and note that write skew breaks the pattern: it survives all the way to SERIALIZABLE, which is exactly why interviewers ask about it.`,
        phase: "done",
        state: snap({ note: "green = prevented, red = possible" })
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
          x: x, y: y, fill: o.fill || C.text2, "font-size": o.size || 11,
          "font-family": o.sans ? env.font.base : env.font.mono,
          "text-anchor": o.anchor || "start", "font-weight": o.weight || "normal",
          opacity: o.opacity == null ? 1 : o.opacity
        }, [String(str)]);
      };
      const rect = (x, y, w, hh, o) => {
        o = o || {};
        return h("rect", {
          x: x, y: y, width: Math.max(0, w), height: Math.max(0, hh), rx: o.r == null ? 5 : o.r,
          fill: o.fill || "none", stroke: o.stroke || "none", "stroke-width": o.sw || 1,
          opacity: o.opacity == null ? 1 : o.opacity, "stroke-dasharray": o.dash || "none"
        });
      };

      const rightW = Math.min(400, W * 0.36);
      const leftW = W - rightW - 40;

      // ---------------- level chips ------------------------------------------
      const chipW = Math.min(150, leftW / 4 - 6);
      for (let i = 0; i < s.levels.length; i++) {
        const x = 16 + i * (chipW + 6);
        const on = i === s.levelIdx;
        add(rect(x, 12, chipW, 30, { fill: on ? C.viz1 : C.surface2, opacity: on ? 0.9 : 0.45, stroke: on ? C.viz1 : C.border }));
        add(txt(x + chipW / 2, 26, s.levels[i], { fill: on ? C.text : C.muted, size: 9, anchor: "middle" }));
        add(txt(x + chipW / 2, 37, i === 0 ? "weakest" : i === 3 ? "strongest" : "", { fill: C.muted, size: 8, anchor: "middle" }));
      }
      add(txt(16, 60, `scenario: ${s.anomaly}`, { fill: C.text, size: 13, sans: true, weight: "600" }));
      if (s.note) add(txt(leftW + 20, 60, s.note, { fill: C.viz4, size: 10 }));

      // ---------------- twin timelines ---------------------------------------
      const laneTop = 76;
      const laneW = leftW / 2 - 10;
      const laneX = [16, 16 + laneW + 16];
      const rowH = Math.min(26, (H - laneTop - 150) / Math.max(6, s.steps.length));

      add(txt(laneX[0], laneTop - 4, "T1", { fill: C.viz1, size: 12, sans: true, weight: "600" }));
      add(txt(laneX[1], laneTop - 4, "T2", { fill: C.viz5, size: 12, sans: true, weight: "600" }));
      for (let i = 0; i < 2; i++) {
        add(h("line", { x1: laneX[i] + 6, y1: laneTop, x2: laneX[i] + 6, y2: laneTop + rowH * Math.max(1, s.steps.length) + 4, stroke: C.grid, "stroke-width": 2 }));
      }
      for (let i = 0; i < s.steps.length; i++) {
        const st = s.steps[i];
        const x = laneX[st.lane - 1];
        const y = laneTop + i * rowH;
        const base = st.lane === 1 ? C.viz1 : C.viz5;
        const isErr = st.tag === "error";
        const isWait = st.tag === "wait";
        const active = st.status === "active";
        add(rect(x + 14, y + 1, laneW - 20, rowH - 5, {
          fill: isErr ? C.danger : active ? base : C.surface2,
          opacity: isErr ? 0.35 : active ? 0.85 : 0.5,
          stroke: isErr ? C.danger : active ? base : C.border,
          dash: isWait ? "4 3" : "none", r: 4
        }));
        add(h("circle", { cx: x + 6, cy: y + rowH / 2, r: 3.5, fill: active ? base : C.grid }));
        add(txt(x + 22, y + rowH / 2 + 3.5, st.text, { fill: isErr ? C.danger : active ? C.text : C.text2, size: 9.5 }));
      }

      // ---------------- state panels -------------------------------------------
      const panelY = laneTop + rowH * Math.max(6, s.steps.length) + 18;
      const pw = leftW / 2 - 10;
      const panel = (x, title, rows, accent) => {
        add(txt(x, panelY, title, { fill: C.text2, size: 11 }));
        add(rect(x, panelY + 8, pw, 18 + rows.length * 20, { fill: C.surface2, opacity: 0.45, stroke: C.border }));
        for (let i = 0; i < rows.length; i++) {
          const r = rows[i];
          add(txt(x + 12, panelY + 32 + i * 20, r.k, { fill: C.muted, size: 11 }));
          add(txt(x + 120, panelY + 32 + i * 20, String(r.v), { fill: r.ghost ? C.danger : accent, size: 12, weight: "600" }));
          if (r.ghost) add(txt(x + 170, panelY + 32 + i * 20, "uncommitted!", { fill: C.danger, size: 9 }));
        }
        if (rows.length === 0) add(txt(x + 12, panelY + 32, "(nothing read yet)", { fill: C.muted, size: 10 }));
      };
      panel(laneX[0], s.dbTitle, s.db, C.text);
      panel(laneX[1], s.viewTitle, s.t1view, C.viz4);

      // ---------------- verdict --------------------------------------------------
      if (s.verdict) {
        const vy = H - 56;
        add(rect(16, vy, leftW, 44, {
          fill: s.verdict.prevented ? C.viz3 : C.danger,
          opacity: 0.18,
          stroke: s.verdict.prevented ? C.viz3 : C.danger
        }));
        add(txt(28, vy + 19, s.verdict.prevented ? "PREVENTED" : "ANOMALY OCCURRED", {
          fill: s.verdict.prevented ? C.viz3 : C.danger, size: 12, weight: "600"
        }));
        add(txt(28, vy + 34, s.verdict.text.slice(0, 110), { fill: C.text2, size: 10 }));
      }

      // ---------------- matrix ------------------------------------------------------
      const mx = leftW + 32, my = 80;
      const rowLabelSize = 9.5;
      // Measure the longest row label instead of guessing a fixed gutter width —
      // "non-repeatable read" is long enough to run into the first data column
      // if the gutter is sized like an ordinary cell.
      const measureCanvas = document.createElement("canvas");
      const mctx = measureCanvas.getContext("2d");
      mctx.font = `${rowLabelSize}px ${env.font.mono}`;
      let maxLabelW = 0;
      for (const a of s.anomalies) maxLabelW = Math.max(maxLabelW, mctx.measureText(a).width);
      const gutterW = maxLabelW + 14;
      const cw = (rightW - 20 - gutterW) / s.levels.length, chh = 34;
      add(txt(mx, my - 10, "anomaly × isolation level", { fill: C.text, size: 12, sans: true }));
      for (let l = 0; l < s.levels.length; l++) {
        const short = ["RU", "RC", "RR", "SER"][l];
        add(txt(mx + gutterW + cw * l + cw / 2, my + 12, short, {
          fill: l === s.levelIdx ? C.viz1 : C.muted, size: 11, anchor: "middle", weight: l === s.levelIdx ? "600" : "normal"
        }));
      }
      for (let a = 0; a < s.anomalies.length; a++) {
        const y = my + 22 + a * chh;
        add(txt(mx, y + chh / 2 + 3, s.anomalies[a], {
          fill: s.anomalies[a] === s.anomaly ? C.text : C.muted, size: rowLabelSize
        }));
        for (let l = 0; l < s.levels.length; l++) {
          const cell = s.matrix.filter((m) => m.a === a && m.l === l)[0];
          const x = mx + gutterW + cw * l;
          const isCursor = s.cursor && s.cursor[0] === a && s.cursor[1] === l;
          const isCurrent = s.anomalies[a] === s.anomaly && l === s.levelIdx;
          add(rect(x + 2, y + 2, cw - 4, chh - 6, {
            fill: cell ? (cell.prevented ? C.viz3 : C.danger) : C.surface2,
            opacity: cell ? (isCursor ? 0.85 : 0.45) : 0.25,
            stroke: isCursor ? C.viz4 : isCurrent ? C.text : "none",
            sw: isCursor ? 2 : 1
          }));
          if (cell) {
            add(txt(x + cw / 2, y + chh / 2 + 3, cell.prevented ? "safe" : "possible", {
              fill: cell.prevented ? C.viz3 : C.danger, size: 9, anchor: "middle", weight: "600"
            }));
          }
        }
      }
      add(txt(mx, my + 30 + s.anomalies.length * chh, "safe = prevented at that level", { fill: C.muted, size: 9 }));
      add(txt(mx, my + 44 + s.anomalies.length * chh, "write skew survives everything below SERIALIZABLE", { fill: C.warn, size: 9 }));
      add(txt(mx, my + 58 + s.anomalies.length * chh, "Postgres default = RC · MySQL/InnoDB default = RR", { fill: C.muted, size: 9 }));
    }
  },

  drill: {
    cards: [
      { q: "Name the four anomalies in order of subtlety.", a: "Dirty read → non-repeatable read → phantom read → (lost update) → write skew. Each needs a stronger level than the last; write skew needs full SERIALIZABLE.", tags: ["anomalies"] },
      { q: "What is write skew?", a: "Two transactions read an overlapping set, each verifies an invariant that still holds, then each writes a *different* row. No write-write conflict exists, so snapshot isolation can't detect it — only SERIALIZABLE does.", tags: ["write-skew"] },
      { q: "Postgres and MySQL default isolation levels?", a: "Postgres (and Oracle): READ COMMITTED — new snapshot per statement. MySQL/InnoDB: REPEATABLE READ — one snapshot per transaction, gap locks against phantoms.", tags: ["defaults"] },
      { q: "How does Postgres implement SERIALIZABLE?", a: "SSI — optimistic snapshot isolation plus tracking of read/write dependencies via predicate locks; a transaction that would create a dangerous cycle is aborted with SQLSTATE 40001.", tags: ["ssi"] },
      { q: "What must the application do at SERIALIZABLE or Postgres RR?", a: "Catch SQLSTATE 40001 (and 40P01 deadlock) and retry the entire transaction with bounded, jittered backoff. Retrying one statement is wrong — the snapshot is gone.", tags: ["retry"] },
      { q: "Fix a lost update without changing the isolation level.", a: "`SELECT … FOR UPDATE` before the read-modify-write, an atomic conditional `UPDATE … WHERE stock > 0` with an affected-rows check, or an optimistic `version` column.", tags: ["fixes"] },
      { q: "Does REPEATABLE READ prevent phantoms?", a: "The ANSI standard says no; both major engines actually do — Postgres because RR is snapshot isolation, InnoDB via next-key/gap locks.", tags: ["phantoms"] },
      { q: "What does READ COMMITTED actually guarantee?", a: "Only that you never read uncommitted data. Each *statement* gets a fresh snapshot, so two reads in one transaction can disagree, and read-modify-write races are unprotected.", tags: ["read-committed"] }
    ],
    sixtySecond: [
      "Name the four isolation levels and the anomaly each one eliminates, then explain why write skew is the exception.",
      "Two users buy the last ticket simultaneously. Explain what goes wrong at READ COMMITTED and give three different fixes."
    ]
  }
};
