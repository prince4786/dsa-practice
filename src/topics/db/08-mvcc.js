export default {
  id: "mvcc",
  track: "db",
  title: "MVCC & Snapshot Visibility",
  difficulty: 3,
  minutes: 18,
  tags: ["mvcc", "postgres", "vacuum", "snapshots", "bloat"],

  explainer: [
    { type: "p", text: "Imagine two people trying to use the same shared document at the same time: one person is reading it while another person is in the middle of editing it. If the reader could only see the document by waiting for the editor to finish, that's simple but slow — readers and writers are constantly blocking each other. **MVCC**, which stands for **Multi-Version Concurrency Control**, is the clever trick most modern databases use to avoid that wait entirely. The idea: instead of editing a row in place, the database keeps *several versions* of that row at once. When you update a row, the database doesn't erase the old value and overwrite it — it writes a brand new version of the row alongside the old one, and simply marks the old version as no longer current. A transaction that's in the middle of reading data gets handed whichever version of each row was current at the moment its read began, so it never has to wait for a writer, and a writer never has to wait for a reader either. Only two writers trying to change the very same row at the very same time actually need to coordinate with each other." },
    { type: "h3", text: "The two hidden columns that make it work" },
    { type: "p", text: "In Postgres, every single row version — internally called a tuple — secretly carries two extra columns you don't normally see: `xmin`, the ID of the transaction that created this version, and `xmax`, the ID of the transaction that deleted or replaced this version (or `0` if it's still the current, live version). Whether a particular row version is visible to a given transaction's read comes down to one rule: a version is visible if the transaction recorded in `xmin` had already committed by the time your snapshot (your transaction's fixed view of 'the database as of this moment') was taken, **and** the transaction recorded in `xmax` is either empty (`0`, meaning nothing has superseded this version yet) or belongs to a transaction that had *not* committed by then. That's genuinely the whole rule — every other detail of MVCC is just bookkeeping built around making that one visibility check fast and correct." },
    { type: "code", lang: "sql", code: "SELECT xmin, xmax, ctid, id, balance FROM accounts WHERE id = 'alice';\n--  xmin | xmax |  ctid  |  id   | balance\n--  1042 |    0 | (0,7)  | alice |      50" },
    { type: "h3", text: "The consequences that follow from this design, and that you should be able to explain" },
    { type: "list", items: [
      "**Readers never block writers, and writers never block readers.** The only case where one transaction has to wait for another is two writers trying to change the exact same row at the exact same time. This lack of blocking between readers and writers is the entire point of MVCC.",
      "**An UPDATE is really an INSERT plus marking the old version dead**, not an in-place edit. It writes a brand new row version, and — unless a specific optimization called HOT applies, explained below — it also has to add a new entry to *every single index* built on that table, because the new row version physically lives somewhere new. This is exactly why adding 'just one more index' isn't free: it adds cost to every future write, not just reads.",
      "**Old, superseded row versions (called dead tuples) pile up over time** instead of being deleted immediately. They get cleaned up by a background process called `VACUUM`, which can only safely remove a version once it's certain no currently-running transaction's snapshot could still need to see it.",
      "**`SELECT count(*)` has to actually scan the rows**, rather than reading a pre-stored count. That's because an index has no idea which row versions are currently visible to your particular transaction — only a full check of each candidate row (or an index-only scan combined with the visibility map, covered in the index-selection lesson) can determine that. This is exactly why counting rows is comparatively slow in Postgres, in contrast to storage engines that maintain a running total and can answer instantly.",
      "**Transaction IDs are 32-bit numbers, and they eventually wrap around** (run out and start over) after roughly two billion transactions. `VACUUM` also periodically *freezes* very old row versions — marking them as permanently valid regardless of transaction ID — specifically to prevent this wraparound from causing very old data to suddenly look like it's from the future. If `VACUUM` ever falls too far behind, Postgres will actually refuse to accept new writes rather than risk data corruption from wraparound."
    ]},
    { type: "callout", tone: "pitfall", text: "The single most common real-world MVCC-related incident: some transaction is left open for a long time — an idle database connection sitting inside a `BEGIN` with nothing happening, a slow analytics query, or an abandoned replication slot (a bookmark used to stream changes to another system) — and that transaction's old snapshot stays pinned the whole time it's open. While that snapshot is pinned, `VACUUM` cannot safely remove *any* row version newer than it, no matter how old and clearly dead those versions are elsewhere. Dead row versions pile up, tables and their indexes silently grow (bloat), and every scan gets progressively slower — even though the actual number of live rows in the table never changes. You can spot the culprit by checking `pg_stat_activity` (a view of currently active database connections) sorted by how long each one's transaction has been open." },
    { type: "h3", text: "A cheaper path: HOT updates and fill factor" },
    { type: "p", text: "If an update doesn't change any column that's part of an index, **and** the new row version happens to fit on the very same disk page as the old one, Postgres can take a shortcut called a **HOT update** (short for Heap-Only Tuple): the new version is linked directly on the same page, and — crucially — no new index entries have to be written at all, because nothing indexed actually changed. This is dramatically cheaper than a regular update. You can make HOT updates more likely on a table that gets updated often by deliberately leaving some empty space on each page using `ALTER TABLE ... SET (fillfactor = 85)`, which tells Postgres to only fill each page 85% full when writing it, leaving room for future new versions to fit alongside the old ones." },
    { type: "callout", tone: "tip", text: "MVCC isn't unique to Postgres — MySQL's InnoDB storage engine uses it too — but InnoDB implements it differently: it keeps old row versions in a separate structure called an **undo log**, rather than leaving them mixed in with the live rows inside the table itself. So InnoDB tables themselves don't bloat with dead versions the way Postgres tables can; instead, the undo log area grows, and a long-running transaction there shows up as a rising 'history list length' rather than table bloat. It's the same underlying physics — old versions have to be kept somewhere until nobody needs them — just a different place chosen to put the leftovers." }
  ],

  glossary: [
    { term: "MVCC (Multi-Version Concurrency Control)", plain: "A technique where the database keeps multiple versions of a row instead of overwriting it in place, so readers and writers never have to block each other." },
    { term: "tuple", plain: "Postgres's internal term for one physical row version stored on disk." },
    { term: "snapshot", plain: "A transaction's fixed, consistent view of the database as it existed at a specific moment, used to decide which row versions it's allowed to see." },
    { term: "xmin / xmax", plain: "Two hidden columns Postgres attaches to every row version: xmin is the ID of the transaction that created it, xmax is the ID of the transaction that replaced or deleted it (or 0 if it's still current)." },
    { term: "visibility", plain: "Whether a given row version is allowed to be seen by a particular transaction's snapshot, based on the xmin/xmax rule." },
    { term: "dead tuple", plain: "An old row version that's been superseded by a newer one and is no longer visible to any current or future transaction, but hasn't been physically cleaned up yet." },
    { term: "VACUUM", plain: "Postgres's background maintenance process that removes dead tuples once no running transaction could still need them, and performs other cleanup like freezing old rows." },
    { term: "HOT update (Heap-Only Tuple)", plain: "A cheaper kind of update where the new row version fits on the same disk page as the old one and no indexed column changed, so no new index entries need to be written." },
    { term: "fillfactor", plain: "A per-table setting controlling how full Postgres packs each disk page when writing it, leaving spare room that makes future HOT updates more likely." },
    { term: "transaction ID wraparound", plain: "A failure mode where the 32-bit counter used to number transactions runs out and would start repeating, potentially making old data look like it's from the future; VACUUM's freezing prevents it." },
    { term: "bloat (table/index bloat)", plain: "A table or index growing larger than its actual live data requires, because dead row versions haven't been cleaned up yet." },
    { term: "buffer cache", plain: "The area of memory where the database keeps recently used disk pages so it doesn't have to re-read them from disk." },
    { term: "undo log", plain: "MySQL InnoDB's separate storage area for old row versions, used instead of keeping them mixed into the table itself the way Postgres does." },
    { term: "replication slot", plain: "A bookmark a Postgres database keeps to track how far a replica or downstream consumer has caught up on changes, which can also pin old data in place if left unused too long." }
  ],

  complexity: {
    rows: [
      { operation: "Read a row", time: "O(chain length)", space: "O(1)", note: "walks the version chain until one is visible" },
      { operation: "UPDATE (non-HOT)", time: "O(1 + indexes)", space: "+1 tuple", note: "new tuple + an entry in every index" },
      { operation: "UPDATE (HOT)", time: "O(1)", space: "+1 tuple", note: "no indexed column changed and it fits on the page" },
      { operation: "DELETE", time: "O(1)", space: "+0", note: "just stamps xmax; space is reclaimed later" },
      { operation: "VACUUM", time: "O(table + indexes)", space: "reclaims", note: "only versions older than the oldest running snapshot" },
      { operation: "SELECT count(*)", time: "O(rows)", space: "O(1)", note: "visibility must be checked per row; index-only helps if all-visible" }
    ]
  },

  interview: {
    whyAsked: "MVCC is where storage, concurrency and operations meet. The signal is whether you can state the visibility rule, derive the consequences (bloat, VACUUM, slow counts, index write amplification) rather than memorise them, and connect long transactions to production incidents.",
    followUps: [
      { q: "What exactly does an UPDATE do in Postgres?", a: "It inserts a new tuple with `xmin` = the current transaction id, and sets `xmax` on the old tuple to that same id. The old version stays in the page until VACUUM removes it. Unless the update is HOT-eligible, a new entry is also written into every index on the table — so update cost scales with index count." },
      { q: "State the tuple visibility rule.", a: "A tuple is visible to a snapshot if its `xmin` belongs to a transaction that committed before the snapshot was taken and is not in the snapshot's in-progress list, and its `xmax` is either unset or belongs to a transaction that had not committed by then. Own-transaction changes are also visible to itself." },
      { q: "Why can't VACUUM reclaim space while a long transaction is running?", a: "Because that transaction's snapshot might still need old versions. VACUUM can only remove tuples whose xmax committed before the oldest running snapshot (the xmin horizon). One idle-in-transaction session therefore blocks cleanup across the whole database, and the table bloats even though its logical row count is constant." },
      { q: "Why is `SELECT count(*)` slow in Postgres but fast in some other engines?", a: "Indexes carry no visibility information, so every candidate row's tuple header must be checked — count(*) is a full scan of the table (or an index-only scan if the visibility map says the pages are all-visible). Engines that maintain a row counter can only do so because they don't support this concurrency model. For an estimate, use `reltuples` from pg_class." },
      { q: "What is a HOT update and why do you care?", a: "Heap-Only Tuple: when no indexed column changes and the new version fits on the same page, the version is chained within the page and no index entries are written. It makes updates far cheaper and lets the space be reclaimed by page-level pruning without a full VACUUM. Lowering fillfactor on an update-heavy table makes HOT much more likely." },
      { q: "What is transaction-id wraparound?", a: "Transaction ids are 32-bit; visibility is computed modulo 2³¹, so tuples older than ~2 billion transactions would appear to be in the future. VACUUM freezes old tuples to mark them as permanently visible. If autovacuum can't keep up, Postgres warns, and finally refuses new write transactions to prevent data loss — an outage you fix by vacuuming." },
      { q: "How does InnoDB's MVCC differ?", a: "Old versions live in a rollback/undo segment rather than in the table itself, and a read reconstructs the older version by applying undo records. Tables therefore don't bloat with dead tuples, but a long transaction grows the undo history — the equivalent failure mode, monitored as 'history list length'." }
    ]
  },

  code: [
    { lang: "sql", label: "Seeing the versions", code: "-- The hidden system columns\nSELECT xmin, xmax, ctid, id, balance FROM accounts WHERE id = 'alice';\n\n-- Where the dead tuples are\nSELECT relname, n_live_tup, n_dead_tup,\n       round(100.0 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 1) AS dead_pct,\n       last_autovacuum\nFROM   pg_stat_user_tables\nORDER  BY n_dead_tup DESC LIMIT 10;\n\n-- Who is holding the xmin horizon back? (the bloat culprit)\nSELECT pid, state, age(backend_xid) AS xid_age,\n       now() - xact_start AS txn_duration, left(query, 60)\nFROM   pg_stat_activity\nWHERE  state <> 'idle'\nORDER  BY xact_start\nLIMIT  10;\n\n-- Also check replication slots and prepared transactions -- both pin xmin\nSELECT slot_name, active, xmin, catalog_xmin FROM pg_replication_slots;\nSELECT gid, prepared, database FROM pg_prepared_xacts;" },
    { lang: "sql", label: "Making updates cheap (HOT)", code: "-- Update-heavy table: leave free space on each page so the new\n-- version can live beside the old one -> HOT update, no index writes.\nALTER TABLE sessions SET (fillfactor = 85);\nVACUUM FULL sessions;      -- rewrite so the new fillfactor takes effect\n\n-- Measure whether it worked\nSELECT relname, n_tup_upd, n_tup_hot_upd,\n       round(100.0 * n_tup_hot_upd / NULLIF(n_tup_upd, 0), 1) AS hot_pct\nFROM   pg_stat_user_tables WHERE relname = 'sessions';\n--  sessions | 4820193 | 4655910 | 96.6      <-- good\n\n-- HOT is disabled for any update that touches an indexed column,\n-- so a needless index on last_seen_at can destroy the whole benefit.\n\n-- Tune autovacuum for a hot table instead of relying on global defaults\nALTER TABLE sessions SET (\n  autovacuum_vacuum_scale_factor = 0.02,   -- default 0.2 = 20% dead first\n  autovacuum_vacuum_cost_delay   = 2\n);" },
    { lang: "sql", label: "Bloat, and how to remove it", code: "-- Ordinary VACUUM: marks space reusable, no exclusive lock, no shrink\nVACUUM (VERBOSE, ANALYZE) accounts;\n\n-- VACUUM FULL: rewrites the table, returns space to the OS,\n-- but takes an ACCESS EXCLUSIVE lock -- never on a live hot table\nVACUUM FULL accounts;\n\n-- Online alternative (pg_repack extension): rebuilds with brief locks\n-- $ pg_repack -t accounts -d mydb\n\n-- Guard rails that prevent the incident in the first place\nALTER SYSTEM SET idle_in_transaction_session_timeout = '60s';\nALTER SYSTEM SET statement_timeout = '30s';\n\n-- Wraparound watch: act well before 2^31\nSELECT relname, age(relfrozenxid) AS xid_age\nFROM   pg_class WHERE relkind = 'r'\nORDER  BY age(relfrozenxid) DESC LIMIT 5;\n-- autovacuum_freeze_max_age default 200000000; hard stop at ~2^31" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.6, maxFrames: 200 },

    params: [
      { key: "reader", label: "T101 isolation", type: "enum", options: ["REPEATABLE READ", "READ COMMITTED"], default: "REPEATABLE READ" },
      { key: "hold", label: "T101 lifetime", type: "enum", options: ["ends promptly", "stays open (idle in txn)"], default: "ends promptly" }
    ],

    frames: function* (params, rng) {
      const rrReader = params.reader === "REPEATABLE READ";
      const holdOpen = params.hold !== "ends promptly";

      let seq = 0;                 // logical event clock
      const committedAt = { 90: 0 };  // xid -> event seq of commit (0 = ancient)

      let txns = [
        { xid: 100, name: "T100 writer", begin: null, commit: null, state: "not started", snapAt: null },
        { xid: 101, name: "T101 reader", begin: null, commit: null, state: "not started", snapAt: null },
        { xid: 102, name: "T102 writer", begin: null, commit: null, state: "not started", snapAt: null }
      ];
      let rows = [
        { id: "alice", versions: [{ xmin: 90, xmax: 0, val: "100", vis: "?", why: "" }] },
        { id: "bob", versions: [{ xmin: 90, xmax: 0, val: "50", vis: "?", why: "" }] },
        { id: "carol", versions: [{ xmin: 90, xmax: 0, val: "30", vis: "?", why: "" }] }
      ];
      let focus = null;          // xid whose snapshot we are evaluating
      let vacuumed = false;

      const visibleXid = (x, at) => x !== 0 && committedAt[x] != null && committedAt[x] <= at;

      const evaluate = (at) => {
        rows = rows.map((r) => ({
          id: r.id,
          versions: r.versions.map((v) => {
            if (v.removed) return { ...v };
            const born = visibleXid(v.xmin, at);
            const killed = v.xmax !== 0 && visibleXid(v.xmax, at);
            let vis = "visible", why = `xmin ${v.xmin} committed, xmax ${v.xmax === 0 ? "0" : v.xmax + " not yet committed"}`;
            if (!born) { vis = "future"; why = `xmin ${v.xmin} not committed as of this snapshot`; }
            else if (killed) { vis = "dead"; why = `xmax ${v.xmax} committed before the snapshot`; }
            return { ...v, vis: vis, why: why };
          })
        }));
      };
      const clearVis = () => {
        rows = rows.map((r) => ({ id: r.id, versions: r.versions.map((v) => ({ ...v, vis: "?", why: "" })) }));
      };

      const deadCount = () => {
        let n = 0;
        for (const r of rows) for (const v of r.versions) if (!v.removed && v.xmax !== 0 && committedAt[v.xmax] != null) n++;
        return n;
      };

      const snap = (extra) => ({
        txns: txns.map((t) => ({ xid: t.xid, name: t.name, begin: t.begin, commit: t.commit, state: t.state, snapAt: t.snapAt })),
        rows: rows.map((r) => ({ id: r.id, versions: r.versions.map((v) => ({ xmin: v.xmin, xmax: v.xmax, val: v.val, vis: v.vis, why: v.why, removed: !!v.removed })) })),
        focus: focus,
        seq: seq,
        dead: deadCount(),
        vacuumed: vacuumed,
        horizon: extra && extra.horizon != null ? extra.horizon : null,
        note: extra && extra.note ? extra.note : "",
        rrReader: rrReader,
        holdOpen: holdOpen
      });

      const setTxn = (xid, patch) => { txns = txns.map((t) => (t.xid === xid ? { ...t, ...patch } : t)); };

      yield {
        label: `Three rows, each with one version created by an ancient committed transaction (xmin=90, xmax=0). xmax=0 means "not deleted". These two hidden columns are the entire visibility mechanism.`,
        phase: "init",
        state: snap({ note: "xmin = creator xid · xmax = destroyer xid" })
      };

      // T101 reader begins first, taking an early snapshot
      seq++; setTxn(101, { begin: seq, state: "running", snapAt: seq });
      focus = 101; evaluate(seq);
      yield {
        label: `T101 (the reader) begins and takes a snapshot at event ${seq}. Under ${params.reader} this snapshot ${rrReader ? "lasts for the whole transaction" : "will be re-taken before every statement"}.`,
        phase: "snapshot",
        state: snap({ note: "snapshot = the set of transactions considered committed" })
      };
      yield {
        label: `Visibility check for T101: all three versions have xmin=90 (committed long ago) and xmax=0, so all three are visible. alice=100, bob=50, carol=30.`,
        phase: "read",
        state: snap({ note: "3 of 3 versions visible" })
      };

      // T100 writer begins
      seq++; setTxn(100, { begin: seq, state: "running" });
      focus = null; clearVis();
      yield {
        label: `T100 (a writer) begins. It gets xid 100 on its first write — a read-only transaction never consumes an xid at all.`,
        phase: "write",
        state: snap({ note: "" })
      };

      // T100 updates alice
      seq++;
      rows = rows.map((r) => r.id !== "alice" ? r : {
        id: r.id,
        versions: r.versions.map((v, i) => (i === r.versions.length - 1 ? { ...v, xmax: 100 } : { ...v }))
          .concat([{ xmin: 100, xmax: 0, val: "50", vis: "?", why: "" }])
      });
      yield {
        label: `T100 runs UPDATE accounts SET balance=50 WHERE id='alice'. Nothing is overwritten: a NEW version (xmin=100) is appended and the old one is stamped xmax=100. The old bytes are still there, and still readable.`,
        phase: "write",
        state: snap({ note: "UPDATE = INSERT new version + stamp old one" })
      };
      yield {
        label: `Because the row was physically moved, an entry must also be inserted into every index on accounts (unless this qualifies as a HOT update). This is the real cost of an extra index: it is paid on every UPDATE, not just on INSERT.`,
        phase: "write",
        state: snap({ note: "non-HOT update ⇒ one index entry per index" })
      };

      // T101 reads again while T100 uncommitted
      focus = 101; evaluate(rrReader ? txns.find((t) => t.xid === 101).snapAt : seq);
      yield {
        label: `T101 reads alice again while T100 is still open. The new version has xmin=100, which has not committed — so it is invisible, and T101 walks past it to the version with xmax=100 (also not committed, therefore still alive). It reads 100.`,
        phase: "read",
        state: snap({ note: "uncommitted versions are simply skipped — no locks, no waiting" })
      };

      // T100 commits
      seq++; committedAt[100] = seq; setTxn(100, { commit: seq, state: "committed" });
      focus = null; clearVis();
      yield {
        label: `T100 COMMITs at event ${seq}. Notice what did NOT happen: no rows were rewritten. Commit just records that xid 100 is committed — visibility is computed at read time from that fact.`,
        phase: "commit",
        state: snap({ note: "commit is O(1): it records a status bit, not data" })
      };

      // T101 reads after commit
      const readerAt = rrReader ? txns.find((t) => t.xid === 101).snapAt : (seq + 0.5);
      focus = 101; evaluate(readerAt);
      yield {
        label: rrReader
          ? `T101 reads alice a third time. Its snapshot was taken before T100 committed, so the new version is still invisible: it reads 100 again. Repeatable reads come for free — the old version was never destroyed.`
          : `T101 reads alice again. Under READ COMMITTED it takes a FRESH snapshot for this statement, so T100's commit is now visible: it reads 50. Same transaction, different answer — that is the non-repeatable read, and MVCC is what makes both behaviours cheap.`,
        phase: "read",
        state: snap({ note: rrReader ? "old version retained for T101's snapshot" : "new snapshot per statement" })
      };

      // T102 begins, deletes carol
      seq++; setTxn(102, { begin: seq, state: "running", snapAt: seq });
      focus = 102; evaluate(seq);
      yield {
        label: `T102 begins now and takes a later snapshot. For T102, T100 is committed — so it sees alice=50. Two transactions are reading the same row and getting different, both-correct answers.`,
        phase: "snapshot",
        state: snap({ note: "two live snapshots, two truths" })
      };

      seq++;
      rows = rows.map((r) => r.id !== "carol" ? r : {
        id: r.id,
        versions: r.versions.map((v, i) => (i === r.versions.length - 1 ? { ...v, xmax: 102 } : { ...v }))
      });
      yield {
        label: `T102 runs DELETE FROM accounts WHERE id='carol'. A DELETE writes no new version at all — it only stamps xmax=102. The row's bytes remain until VACUUM decides no one can still need them.`,
        phase: "write",
        state: snap({ note: "DELETE = stamp xmax; the data is still on the page" })
      };

      seq++; committedAt[102] = seq; setTxn(102, { commit: seq, state: "committed" });
      focus = 101; evaluate(readerAt);
      yield {
        label: `T102 commits. But T101's snapshot predates it, so T101 still sees carol=30 — deleted rows are only gone for snapshots taken after the deleting transaction committed.`,
        phase: "commit",
        state: snap({ note: "T101 still needs the deleted version" })
      };

      // vacuum attempt while T101 open
      const oldestOpen = holdOpen ? 101 : null;
      focus = null; clearVis();
      yield {
        label: `Autovacuum wakes up. There are ${deadCount()} dead versions on the table. But VACUUM may only remove a version whose xmax committed before the OLDEST running snapshot — the "xmin horizon".`,
        phase: "vacuum",
        state: snap({ horizon: 101, note: "xmin horizon = oldest running transaction" })
      };
      yield {
        label: `T101's snapshot is currently the horizon. Every dead version is still newer than it, so VACUUM removes nothing and simply exits. The dead tuples stay on the pages.`,
        phase: "vacuum",
        state: snap({ horizon: 101, note: "0 tuples removable while T101 is open" })
      };

      if (holdOpen) {
        for (let k = 1; k <= 3; k++) {
          seq++;
          rows = rows.map((r) => r.id !== "bob" ? r : {
            id: r.id,
            versions: r.versions.map((v, i) => (i === r.versions.length - 1 ? { ...v, xmax: 200 + k } : { ...v }))
              .concat([{ xmin: 200 + k, xmax: 0, val: String(50 + k * 10), vis: "?", why: "" }])
          });
          committedAt[200 + k] = seq;
          yield {
            label: `Meanwhile other transactions keep updating bob (round ${k}). T101 is still idle-in-transaction, so every superseded version must be kept. The chain grows: ${rows.find((r) => r.id === "bob").versions.length} versions for ONE logical row.`,
            phase: "bloat",
            state: snap({ horizon: 101, note: "version chain growing — this is table bloat" })
          };
        }
        yield {
          label: `This is the classic Postgres incident: one forgotten open transaction, a table whose row count never changes, and a heap that doubles every hour. Reads get slower because every scan walks longer chains. Fix: idle_in_transaction_session_timeout.`,
          phase: "bloat",
          state: snap({ horizon: 101, note: "bloat: same rows, more pages, slower scans" })
        };
      }

      // T101 ends
      seq++; setTxn(101, { commit: seq, state: "committed" });
      focus = null; clearVis();
      yield {
        label: `T101 finally ends. The xmin horizon jumps forward — every version it was pinning becomes removable in a single step.`,
        phase: "vacuum",
        state: snap({ horizon: null, note: "horizon advanced" })
      };

      // vacuum sweeps
      const targets = [];
      for (let ri = 0; ri < rows.length; ri++) {
        for (let vi = 0; vi < rows[ri].versions.length; vi++) {
          const v = rows[ri].versions[vi];
          if (v.xmax !== 0 && committedAt[v.xmax] != null) targets.push([ri, vi]);
        }
      }
      for (const t of targets) {
        rows = rows.map((r, ri) => ri !== t[0] ? r : {
          id: r.id,
          versions: r.versions.map((v, vi) => (vi === t[1] ? { ...v, removed: true } : { ...v }))
        });
        vacuumed = true;
        yield {
          label: `VACUUM removes the dead version of ${rows[t[0]].id} (xmin=${rows[t[0]].versions[t[1]].xmin}, xmax=${rows[t[0]].versions[t[1]].xmax}): its deleter committed before the horizon, so no snapshot can ever want it again. The space becomes reusable — the file does not shrink.`,
          phase: "vacuum",
          state: snap({ note: "space marked reusable (VACUUM FULL would shrink the file)" })
        };
      }

      yield {
        label: `${targets.length} dead version${targets.length === 1 ? "" : "s"} reclaimed; ${rows.reduce((a, r) => a + r.versions.filter((v) => !v.removed).length, 0)} live versions remain. VACUUM also updates the visibility map (enabling index-only scans) and freezes old xids (preventing wraparound) — it does three jobs, not one.`,
        phase: "done",
        state: snap({ note: "VACUUM: reclaim + visibility map + freeze" })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 16;

      // ---------------- transaction timeline ---------------------------------
      const tlTop = 26, tlRow = Math.max(22, Math.min(30, H * 0.028));
      const tlX = pad + 110, tlW = W - tlX - pad - 200;
      const maxSeq = Math.max(10, s.seq + 1);
      const X = (e) => tlX + (e / maxSeq) * tlW;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `12px ${env.font.base}`;
      ctx.fillText("transactions", pad, tlTop + 2);

      for (let i = 0; i < s.txns.length; i++) {
        const t = s.txns[i];
        const y = tlTop + 12 + i * tlRow;
        ctx.fillStyle = t.xid === s.focus ? C.viz1 : C.muted;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(t.name, pad, y + 10);
        if (t.begin != null) {
          const x0 = X(t.begin);
          const x1 = t.commit != null ? X(t.commit) : X(s.seq + 0.6);
          const open = t.commit == null;
          ctx.fillStyle = t.xid === s.focus ? C.viz1 : open ? C.viz4 : C.viz6;
          ctx.globalAlpha = t.xid === s.focus ? 0.85 : 0.5;
          ctx.beginPath();
          ctx.roundRect(x0, y, Math.max(4, x1 - x0), 13, 3);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = C.text2;
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(open ? "open" : "commit", x1 + 4, y + 10);
          if (t.snapAt != null) {
            ctx.strokeStyle = C.viz7;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(X(t.snapAt), y - 3); ctx.lineTo(X(t.snapAt), y + 16);
            ctx.stroke();
          }
        } else {
          ctx.fillStyle = C.muted;
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillText("not started", tlX, y + 10);
        }
      }
      // now marker
      ctx.strokeStyle = C.axis;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(X(s.seq), tlTop + 6); ctx.lineTo(X(s.seq), tlTop + 12 + s.txns.length * tlRow);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = C.muted;
      ctx.font = `9px ${env.font.mono}`;
      ctx.textAlign = "center";
      ctx.fillText("now", X(s.seq), tlTop + 6);
      ctx.textAlign = "left";
      ctx.fillStyle = C.viz7;
      ctx.fillText("│ = snapshot taken", W - 190, tlTop + 12);
      ctx.fillStyle = s.focus ? C.viz1 : C.muted;
      ctx.fillText(s.focus ? `evaluating visibility for T${s.focus}` : "no snapshot focused", W - 190, tlTop + 26);
      ctx.fillStyle = s.dead > 0 ? C.warn : C.muted;
      ctx.fillText(`dead versions: ${s.dead}`, W - 190, tlTop + 40);
      if (s.horizon) {
        ctx.fillStyle = C.danger;
        ctx.fillText(`xmin horizon pinned by T${s.horizon}`, W - 190, tlTop + 54);
      }

      // ---------------- version chains -----------------------------------------
      // rowH/boxW/boxH grow with the canvas instead of capping at a small fixed
      // size -- vScale then drives every font and gap inside a box so bigger
      // boxes actually mean bigger, more readable content rather than more
      // padding around the same tiny text.
      const chainTop = tlTop + 20 + s.txns.length * tlRow + 16;
      const rowH = Math.min(220, (H - chainTop - 34) / s.rows.length);
      const boxW = Math.min(260, (W - pad - 90) / 5);
      const boxH = Math.min(120, rowH - 26);
      const vScale = Math.max(1, Math.min(1.9, boxH / 56));
      const gapBox = 26 * Math.min(vScale, 1.5);

      for (let ri = 0; ri < s.rows.length; ri++) {
        const r = s.rows[ri];
        const y = chainTop + ri * rowH;
        ctx.textAlign = "left";
        ctx.fillStyle = C.text;
        ctx.font = `${Math.round(12 * vScale)}px ${env.font.mono}`;
        ctx.fillText(r.id, pad, y + boxH / 2 + 4);
        ctx.fillStyle = C.muted;
        ctx.font = `${Math.round(9 * vScale)}px ${env.font.mono}`;
        ctx.fillText("version chain →", pad, y + boxH / 2 + 18 * vScale);

        let vx = pad + 84;
        for (let vi = 0; vi < r.versions.length; vi++) {
          const v = r.versions[vi];
          if (v.removed) {
            ctx.strokeStyle = C.border;
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(vx, y, boxW, boxH, 5);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = C.muted;
            ctx.font = `${Math.round(10 * vScale)}px ${env.font.mono}`;
            ctx.textAlign = "center";
            ctx.fillText("reclaimed", vx + boxW / 2, y + boxH / 2 + 4);
            vx += boxW + gapBox;
            continue;
          }
          const vis = v.vis;
          let border = C.border, fillC = C.surface2, alpha = 0.85, tag = "", tagC = C.muted;
          if (vis === "visible") { border = C.viz3; tag = "visible"; tagC = C.viz3; }
          else if (vis === "future") { border = C.viz4; alpha = 0.3; tag = "not yet committed"; tagC = C.viz4; }
          else if (vis === "dead") { border = C.viz8; alpha = 0.3; tag = "superseded"; tagC = C.viz8; }
          else if (v.xmax !== 0) { border = C.viz8; alpha = 0.55; tag = "xmax set"; tagC = C.viz8; }

          ctx.fillStyle = fillC;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.roundRect(vx, y, boxW, boxH, 5);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.strokeStyle = border;
          ctx.lineWidth = vis === "visible" ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(vx + 0.5, y + 0.5, boxW - 1, boxH - 1, 5);
          ctx.stroke();

          ctx.textAlign = "left";
          ctx.globalAlpha = alpha < 0.5 ? 0.6 : 1;
          ctx.fillStyle = C.text;
          ctx.font = `${Math.round(13 * vScale)}px ${env.font.mono}`;
          ctx.fillText(v.val, vx + 10, y + 20 * vScale);
          ctx.font = `${Math.round(9 * vScale)}px ${env.font.mono}`;
          ctx.fillStyle = C.text2;
          ctx.fillText(`xmin ${v.xmin}`, vx + 10, y + 34 * vScale);
          ctx.fillStyle = v.xmax === 0 ? C.muted : C.viz8;
          ctx.fillText(`xmax ${v.xmax === 0 ? "0 (live)" : v.xmax}`, vx + 10, y + 46 * vScale);
          ctx.globalAlpha = 1;
          if (tag) {
            // Bottom-right corner, on its own row below xmin/xmax -- sharing
            // the value's row with a long badge like "not yet committed"
            // risked colliding with it once both grew with the box.
            ctx.textAlign = "right";
            ctx.fillStyle = tagC;
            ctx.font = `${Math.max(9, Math.min(12, Math.round(9 * vScale)))}px ${env.font.mono}`;
            ctx.fillText(tag, vx + boxW - 8, Math.min(y + boxH - 6, y + 46 * vScale + 13));
          }

          // chain arrow
          if (vi < r.versions.length - 1) {
            ctx.strokeStyle = C.axis;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(vx + boxW + 3, y + boxH / 2);
            ctx.lineTo(vx + boxW + gapBox - 6, y + boxH / 2);
            ctx.stroke();
            ctx.fillStyle = C.axis;
            ctx.beginPath();
            ctx.moveTo(vx + boxW + gapBox - 6, y + boxH / 2 - 3.5);
            ctx.lineTo(vx + boxW + gapBox - 1, y + boxH / 2);
            ctx.lineTo(vx + boxW + gapBox - 6, y + boxH / 2 + 3.5);
            ctx.closePath(); ctx.fill();
          }
          vx += boxW + gapBox;
          if (vx > W - boxW) break;
        }
      }

      // ---------------- footer ---------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(
        `visible ⟺ xmin committed before the snapshot AND (xmax = 0 OR xmax not committed before the snapshot)` +
        (s.note ? `   ·   ${s.note}` : ""),
        pad, H - 10
      );
    }
  },

  drill: {
    cards: [
      { q: "What do xmin and xmax mean?", a: "`xmin` = the xid that created this tuple version; `xmax` = the xid that deleted or superseded it (0 = still live). Together they decide visibility for any snapshot.", tags: ["visibility"] },
      { q: "State the tuple visibility rule.", a: "Visible if xmin committed before the snapshot (and isn't in its in-progress list) and xmax is 0 or belongs to a transaction not committed before the snapshot.", tags: ["visibility"] },
      { q: "What does an UPDATE physically do in Postgres?", a: "Inserts a new tuple version and stamps xmax on the old one. Unless the update is HOT-eligible, it also writes one new entry into every index on the table.", tags: ["update"] },
      { q: "Why can't VACUUM reclaim dead tuples during a long transaction?", a: "It may only remove versions older than the oldest running snapshot (the xmin horizon). One long or idle-in-transaction session pins that horizon and blocks all cleanup.", tags: ["vacuum"] },
      { q: "What is a HOT update?", a: "An update where no indexed column changed and the new version fits on the same page — chained within the page, no index writes. Encourage it with a lower fillfactor.", tags: ["hot"] },
      { q: "Why is `SELECT count(*)` slow in Postgres?", a: "Indexes carry no visibility info, so every row's tuple header must be checked — it's a full scan (index-only if the visibility map says the pages are all-visible).", tags: ["counting"] },
      { q: "What is transaction-id wraparound and what prevents it?", a: "Xids are 32-bit and compared modulo 2³¹, so ancient tuples could look like the future. VACUUM freezes old tuples; if it falls too far behind Postgres refuses new writes to protect the data.", tags: ["wraparound"] },
      { q: "How does InnoDB's MVCC differ from Postgres's?", a: "Old versions live in an undo log rather than in the table, so tables don't bloat with dead tuples — instead undo history grows, and a long transaction shows up as a large 'history list length'.", tags: ["innodb"] }
    ],
    sixtySecond: [
      "Explain MVCC using xmin/xmax and derive why VACUUM exists and why long transactions cause bloat.",
      "Explain why an UPDATE in Postgres can be far more expensive than it looks, and what a HOT update changes."
    ]
  }
};
