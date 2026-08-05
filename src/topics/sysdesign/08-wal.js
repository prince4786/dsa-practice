export default {
  id: "wal",
  track: "sysdesign",
  title: "Write-Ahead Log & Recovery",
  difficulty: 2,
  minutes: 16,
  tags: ["wal", "durability", "recovery", "aries", "fsync", "checkpoint"],

  explainer: [
    { type: "p", text: "A database has to be able to survive having its power cut at the absolute worst possible instant, mid-operation, with no warning. It can't achieve that by carefully writing its actual data pages (the fixed-size blocks of storage a database organizes its data into, often 8 KB) directly to disk, because writing one page is not an all-or-nothing (\"atomic\") operation, and a single transaction usually touches many pages at once — a crash partway through leaves you with some pages updated and others not, and no record of which. Instead, before touching any real data, the database first writes down **one simple, sequential log describing exactly what it's about to do**, and only afterward actually applies those changes to the data itself. That reversal — write the log first, touch the data later — is called the **write-ahead log (WAL)**, and it's the foundational trick underneath Postgres, MySQL/InnoDB, SQLite, etcd, Kafka, RocksDB, and effectively every consensus system in existence." },

    { type: "h3", text: "The rule, stated precisely" },
    { type: "p", text: "There are really just two rules, and together they buy you everything this lesson is about. First: **before any modified data page is allowed to be written to disk, the log record describing that modification must already be safely durable.** Second — this is where the \"D\" in ACID (Atomicity, Consistency, Isolation, Durability — the four properties a real transactional database promises) comes from — **before a transaction is told \"committed,\" its COMMIT record must already be durable.**" },
    { type: "p", text: "Why this actually works: the log is **append-only and purely sequential** — new entries only ever get added to the end. A commit therefore costs just one `fsync` (the operating system call that forces bytes to be physically written to the storage device, rather than sitting in a faster memory cache) of a few hundred bytes, appended to the end of one file. Updating the actual data pages in place, by contrast, would mean many separate, randomly-scattered 8 KB writes across a large file — an order of magnitude more expensive as I/O, and with no natural way to make the whole group of them atomic. The WAL converts the *durable* part of a write into one cheap sequential operation, and defers the *scattered, random* part to whenever the database chooses to do it later." },

    { type: "h3", text: "What actually lives inside a log record" },
    { type: "list", items: [
      "**LSN (Log Sequence Number)** — a number that only ever goes up, uniquely identifying each log record's position. Every data page also remembers the LSN of the last log record that was applied to it (its `pageLSN`), which is exactly how the recovery process later knows whether a given change has already made it onto that page or not.",
      "**Redo information** — either the \"after-image\" (what the data should look like once the change is applied) or a description of the change itself — used to reapply work that was already committed, in case it never made it to disk before the crash.",
      "**Undo information** — the \"before-image\" (what the data looked like immediately before the change) — used to roll back any transaction that was still in progress, and therefore not actually finished, when the crash happened.",
      "**A transaction id, plus a `prevLSN` pointer** chaining each transaction's own records backwards to the one before it, so that undoing one specific transaction means simply walking that chain."
    ]},

    { type: "h3", text: "Checkpoints — why recovery doesn't mean replaying all of history" },
    { type: "p", text: "Without any further mechanism, recovering from a crash would mean replaying the *entire* log, all the way back to the very first record the database ever wrote — clearly unworkable once a database has been running for months. A **checkpoint** is a periodic marker the database writes that essentially says \"as of log position X, these specific pages were dirty (modified in memory but not yet flushed to disk) and these specific transactions were still active,\" and it flushes enough real state to disk that recovery only ever needs to start reading from that point forward, not from the beginning of time. Checkpointing more often makes recovery faster (there's less log to replay) but increases steady-state I/O, because more pages get flushed more often; checkpointing less often gives you a smoother, cheaper normal operating path but a genuinely frightening amount of log to replay if a crash does happen. **This trade-off — how fast you need to recover (your recovery time objective) versus how much extra I/O you're willing to pay in normal operation — is exactly the answer an interviewer is fishing for here.**" },

    { type: "h3", text: "ARIES recovery, in three passes" },
    { type: "p", text: "ARIES is the classic, widely-implemented algorithm (used, in spirit, by most real relational databases) for recovering correctly from a crash using exactly the log described above. It works in three distinct passes:" },
    { type: "list", items: [
      "**Analysis** — scan forward from the last checkpoint to the very end of the log, and use that scan to rebuild two things: the table of pages that were dirty at crash time, and the list of transactions that were still in progress (the *\"losers\"*, since they never got to finish) when everything stopped.",
      "**Redo** — replay *every single* logged update from the earliest relevant point forward, deliberately including updates that belonged to loser transactions that never actually committed. This step is often called \"repeating history\": its entire purpose is to reconstruct the exact state the database was in at the precise moment of the crash — nothing more, nothing less. A given record can be safely skipped if `pageLSN ≥ record.LSN`, since that just means the change is already reflected on the page.",
      "**Undo** — now walk backwards through the loser transactions' records and apply their before-images, actually rolling back the unfinished work. For each individual undo action taken, the database writes a **compensation log record (CLR)** — a log entry recording that this specific undo has now happened — so that if the machine crashes again *while recovery itself is in progress*, the next attempt at recovery won't accidentally undo the same change a second time. This CLR mechanism is what makes recovery itself safely repeatable (idempotent) even if it gets interrupted midway, which is a subtlety people frequently forget."
    ]},

    { type: "callout", tone: "pitfall", text: "Calling `write()` does not mean your data is durable — it only places the bytes into the operating system's in-memory page cache. Only `fsync()` (or its close relative `fdatasync()`) actually pushes those bytes out to the physical storage device — and even then, the device itself might still be holding them in its own small, volatile write cache, unless it has power-loss protection or the operating system's write \"barrier\" is properly honored. A number of famous real-world data-loss incidents — including Postgres's well-known 2018 bug nicknamed \"fsyncgate\" — trace back to mishandling a *failed* fsync call: on some systems, the OS silently drops the dirty page after a failed write and only reports the error exactly once, so a naive retry can misleadingly report success even though the data is genuinely gone." },

    { type: "h3", text: "Group commit and the actual numbers" },
    { type: "p", text: "An fsync on an NVMe solid-state drive takes roughly 100 microseconds (µs); on a spinning mechanical disk, roughly 5-10 milliseconds; on a network-attached volume like AWS's EBS, roughly 0.5-1 ms. If every single transaction has to pay for its own separate fsync, you're capped at somewhere between roughly 1,000 and 10,000 commits per second, depending on the hardware. **Group commit** fixes this by batching the commit records of many concurrently-committing transactions into one single shared fsync call: 100 transactions can share one fsync, multiplying commit throughput by roughly 100×, at the cost of each individual transaction waiting up to one batching interval longer for its own commit to be confirmed. Every serious production database implements this, and it's the reason tuning knobs with names like `commit_delay` exist at all." },

    { type: "h3", text: "The same idea, showing up everywhere else" },
    { type: "list", items: [
      "**LSM trees** (used by RocksDB, Cassandra) — the in-memory write buffer (\"memtable\") is volatile and would be lost on a crash, so a WAL is what makes writes into it durable; periodic flushes of that buffer to disk (\"SSTable\" files) serve the same role checkpoints do here.",
      "**Replication** — the WAL frequently *is* the replication stream itself: Postgres's streaming replication, MySQL's binlog, and CDC (Change Data Capture) tools like Debezium all work by reading the write-ahead log directly.",
      "**Consensus systems** — Raft's replicated log (covered in its own lesson) is, at its core, a write-ahead log that several separate machines are all made to agree on; its `commitIndex` plays exactly the same role the durability boundary plays here.",
      "**Filesystems** — journaling filesystems like ext4 and XFS apply this exact same trick, just to filesystem metadata (which files exist, where their blocks are) instead of database rows."
    ]},

    { type: "callout", tone: "tip", text: "The line that lands well in an interview: \"The write-ahead log turns many scattered, random durable writes into one cheap sequential one, and it turns crash recovery from 'hope for the best' into 'deterministically replay the log.' The cost is that every commit still needs at least one fsync, which is exactly why group commit exists.\"" }
  ],

  glossary: [
    { term: "Write-ahead log (WAL)", plain: "A sequential, append-only record of every intended change, written and made durable before the actual change is applied to the real data — so a crash mid-change can always be recovered from by replaying the log." },
    { term: "Data page", plain: "A fixed-size block of storage (often 8 KB) that a database organizes its stored data into on disk." },
    { term: "fsync", plain: "An operating system call that forces data to be physically pushed to the storage device, rather than sitting in a faster but volatile memory cache — the actual moment a write becomes durable." },
    { term: "ACID", plain: "The four properties a transactional database promises: Atomicity (a transaction fully happens or not at all), Consistency (it never leaves data in an invalid state), Isolation (concurrent transactions don't interfere), and Durability (once committed, it survives a crash)." },
    { term: "LSN (Log Sequence Number)", plain: "A number that only ever increases, uniquely identifying one record's position in the write-ahead log — used to figure out exactly what's already been applied and what hasn't." },
    { term: "Checkpoint", plain: "A periodic marker the database writes that records enough state (which pages were dirty, which transactions were active) that crash recovery can start from there instead of replaying the entire log from the beginning." },
    { term: "ARIES", plain: "The classic, widely-used algorithm for recovering a database correctly after a crash using a write-ahead log, built around three passes: analysis, redo, and undo." },
    { term: "Redo / undo", plain: "Redo means reapplying a logged change to reconstruct the exact state at crash time. Undo means reversing a change that belonged to a transaction that never actually finished." },
    { term: "Compensation log record (CLR)", plain: "A log entry written while undoing a change, recording that the undo has happened — so that if recovery itself crashes partway through, it won't accidentally undo the same thing twice." },
    { term: "Group commit", plain: "Batching the commit records of several separate transactions into a single shared fsync call, dramatically increasing how many commits per second a database can sustain." },
    { term: "LSM tree (Log-Structured Merge tree)", plain: "A storage design (used by RocksDB, Cassandra, and others) that buffers writes in memory and periodically flushes them to disk in sorted files, relying on a WAL to make the in-memory buffer durable." },
    { term: "CDC (Change Data Capture)", plain: "A technique for streaming every change made to a database, usually by reading its write-ahead log or binlog directly, so other systems can react to changes as they happen." }
  ],

  complexity: {
    rows: [
      { operation: "Commit", time: "1 fsync (~0.1–10 ms)", space: "O(record)", note: "amortized by group commit" },
      { operation: "Page write", time: "deferred, random I/O", space: "O(page)", note: "must follow its log record" },
      { operation: "Recovery", time: "O(log since last checkpoint)", space: "O(dirty pages + losers)", note: "checkpoint frequency sets RTO" },
      { operation: "Redo pass", time: "O(records)", space: "O(1)", note: "skip if pageLSN ≥ record.LSN" },
      { operation: "Undo pass", time: "O(loser records)", space: "O(active txns)", note: "CLRs make it crash-safe" },
      { operation: "Log growth", time: "O(bytes written)", space: "reclaimed at checkpoint", note: "unless a replication slot pins it" }
    ]
  },

  interview: {
    whyAsked: "It's the cleanest test of whether 'durability' is a word or a mechanism to you. The signal is stating the write-ahead rule precisely, knowing that fsync — not write — is the durability boundary, and being able to describe recovery as redo-then-undo rather than 'it replays the log'.",
    followUps: [
      { q: "Why is a sequential log faster than just writing the pages carefully?", a: "Three reasons. First, sequential I/O is far cheaper than random — an order of magnitude on SSD and two on spinning disk. Second, a transaction touching 20 pages becomes one small append rather than 20 scattered 8 KB writes. Third, and most important, page writes cannot be made atomic, so there is no ordering of them that survives a crash mid-write; the log gives you a single point where the transaction becomes real, which is the fsync of its commit record. The dirty pages are then written lazily, batched, coalesced, and at a moment of the database's choosing." },
      { q: "What happens if the machine dies between writing the log and writing the page?", a: "Nothing is lost — that's the case the design is for. On restart, analysis finds the last checkpoint and the transactions in flight; redo replays every logged update from the earliest dirty-page LSN forward, restoring the exact pre-crash state including work by transactions that never committed; then undo rolls back those losers using before-images. The page eventually gets the change either from redo or never needed it. The inverse ordering — page written before the log — is what breaks: you'd have a change on disk with no record of how to undo it." },
      { q: "Why does ARIES redo the work of transactions that never committed?", a: "Because it repeats history first and asks questions second. Redo restores the exact state at the moment of the crash, which means undo can then operate against a state it fully understands, using the same logical page contents that existed when the log was written. Trying to be clever — skipping losers during redo — breaks physiological logging, where a record like 'compact this page' only makes sense applied to the exact page image that preceded it. Repeating history makes redo a simple, idempotent, order-independent replay." },
      { q: "How do you make recovery itself crash-safe?", a: "Compensation log records. Each undo action is itself logged as a CLR containing an `undoNextLSN` pointer to the next record that still needs undoing. If you crash during recovery, the next run's redo pass replays the CLRs — reapplying the undos already done — and then continues from the `undoNextLSN` rather than starting over. CLRs are never undone, so there's no infinite regress. Without them, a crash during a long rollback could undo the same operation twice, which for a non-idempotent physical change corrupts the page." },
      { q: "What does fsync actually guarantee, and where do people get it wrong?", a: "`write()` only reaches the OS page cache; `fsync()`/`fdatasync()` asks the kernel to push those pages to the device and, if barriers are honoured, past the device's volatile write cache. Getting it wrong: assuming write() is durable; not fsyncing the *directory* after creating a file, so the file can vanish; and — the subtle one — mishandling a failed fsync. On Linux, a failed writeback marks the error once and *drops the dirty page*, so a retry can return success while the data is gone. Postgres's response (fsyncgate, 2018) was to panic and recover from the WAL rather than trust a retry." },
      { q: "How do you choose checkpoint frequency?", a: "It's an RTO knob traded against steady-state I/O. Frequent checkpoints mean less log to replay — recovery in seconds — but more repeated page flushing and I/O spikes that show up as latency. Rare checkpoints give a smooth normal path and a recovery that could take many minutes, during which you are down. I'd set it from the recovery time objective, spread the flushing out (Postgres's `checkpoint_completion_target`) so it isn't a spike, and actually measure recovery by killing a replica. Also watch log retention: a stalled replication slot or an old backup can pin WAL and fill the disk, which is a much more common outage than a slow recovery." }
    ]
  },

  code: [
    { lang: "python", label: "A minimal WAL with redo/undo recovery", code: "import json, os\n\nclass WAL:\n    def __init__(self, path):\n        self.f = open(path, \"a+b\")\n        self.lsn = 0\n\n    def append(self, rec):\n        self.lsn += 1\n        rec[\"lsn\"] = self.lsn\n        self.f.write((json.dumps(rec) + \"\\n\").encode())\n        return self.lsn                     # NOT durable yet -- only buffered\n\n    def flush(self):\n        self.f.flush()\n        os.fsync(self.f.fileno())           # THE durability boundary\n\nclass Store:\n    def __init__(self, wal):\n        self.wal = wal\n        self.pages = {}                     # page -> value   (buffer pool)\n        self.page_lsn = {}                  # page -> lsn of last applied record\n        self.active = {}                    # txid -> [lsns]\n\n    def begin(self, txid):\n        self.active[txid] = [self.wal.append({\"t\": \"begin\", \"tx\": txid})]\n\n    def update(self, txid, page, new):\n        old = self.pages.get(page, 0)\n        # WRITE-AHEAD: the record exists before the page is touched.\n        lsn = self.wal.append({\"t\": \"update\", \"tx\": txid, \"page\": page,\n                               \"before\": old, \"after\": new})\n        self.pages[page] = new              # dirty page, in memory only\n        self.page_lsn[page] = lsn\n        self.active[txid].append(lsn)\n\n    def commit(self, txid):\n        self.wal.append({\"t\": \"commit\", \"tx\": txid})\n        self.wal.flush()                    # <-- ONE fsync = the transaction is real\n        del self.active[txid]               # only now may we tell the client OK\n\n    # ---- recovery -------------------------------------------------------\n    def recover(self, records, checkpoint_lsn=0):\n        # 1. ANALYSIS: who was in flight when we died?\n        committed, seen = set(), set()\n        for r in records:\n            if r[\"t\"] == \"commit\": committed.add(r[\"tx\"])\n            if r[\"t\"] == \"begin\":  seen.add(r[\"tx\"])\n        losers = seen - committed\n\n        # 2. REDO everything from the checkpoint -- INCLUDING losers.\n        #    \"Repeat history\", then undo. Idempotent via the pageLSN test.\n        for r in records:\n            if r[\"lsn\"] <= checkpoint_lsn or r[\"t\"] != \"update\":\n                continue\n            if self.page_lsn.get(r[\"page\"], 0) < r[\"lsn\"]:\n                self.pages[r[\"page\"]] = r[\"after\"]\n                self.page_lsn[r[\"page\"]] = r[\"lsn\"]\n\n        # 3. UNDO the losers, backwards, logging a CLR for each so that a\n        #    crash DURING recovery does not undo the same change twice.\n        for r in reversed(records):\n            if r[\"t\"] == \"update\" and r[\"tx\"] in losers:\n                self.pages[r[\"page\"]] = r[\"before\"]\n                self.wal.append({\"t\": \"clr\", \"tx\": r[\"tx\"], \"page\": r[\"page\"],\n                                 \"undone\": r[\"lsn\"]})\n        self.wal.flush()\n        return {\"redone\": len(records), \"rolled_back\": sorted(losers)}" },
    { lang: "pseudo", label: "Group commit — 100 transactions, one fsync", code: "# Without this you are capped at ~1/fsync_time commits per second:\n#   NVMe   fsync ~100us -> ~10,000 commits/s\n#   EBS    fsync ~1ms   -> ~1,000  commits/s\n#   HDD    fsync ~8ms   -> ~125    commits/s\n\ncommit_queue = Queue()\n\ndef commit(txn):                    # called by every worker thread\n    txn.commit_lsn = wal.append({\"t\": \"commit\", \"tx\": txn.id})\n    commit_queue.put(txn)\n    txn.done.wait()                 # park until the group's fsync lands\n\ndef flusher_thread():               # exactly one of these\n    while True:\n        batch = [commit_queue.get()]            # block for the first\n        sleep(COMMIT_DELAY)                     # ~200us: let friends arrive\n        while not commit_queue.empty():\n            batch.append(commit_queue.get())\n\n        wal.fsync()                             # ONE fsync for the whole batch\n\n        for txn in batch:\n            txn.done.set()                      # now they may all reply OK\n\n# Trade: each transaction pays up to COMMIT_DELAY extra latency; throughput\n# multiplies by the batch size. Under load the batch grows on its own, so the\n# system self-tunes: it is fast when idle and efficient when busy." }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.7, maxFrames: 400 },

    params: [
      { key: "txns", label: "Transactions", type: "int", min: 3, max: 8, default: 5 },
      { key: "ops", label: "Updates per txn", type: "int", min: 1, max: 4, default: 2 },
      { key: "pages", label: "Data pages", type: "int", min: 2, max: 5, default: 4 },
      { key: "seed", label: "Re-roll workload", type: "seed" }
    ],

    frames: function* (params, rng) {
      const NT = params.txns, OPS = params.ops, NP = params.pages;

      const log = [];              // { lsn, type, tx, page, before, after }
      const mem = {};              // buffer pool: page -> value
      const memLsn = {};           // pageLSN
      const disk = {};             // durable page images
      const diskLsn = {};
      for (let p = 0; p < NP; p++) { mem["p" + p] = 100; disk["p" + p] = 100; memLsn["p" + p] = 0; diskLsn["p" + p] = 0; }

      let lsn = 0, durableLsn = 0, checkpointLsn = 0;
      const active = {};
      let crashed = false;

      const pageList = () => {
        const out = [];
        for (let p = 0; p < NP; p++) {
          const id = "p" + p;
          out.push({ id: id, mem: mem[id], disk: disk[id], lsn: memLsn[id], dirty: mem[id] !== disk[id] });
        }
        return out;
      };
      const snap = (extra) => Object.assign({
        log: log.map((r) => ({ lsn: r.lsn, type: r.type, tx: r.tx, page: r.page || "", before: r.before == null ? 0 : r.before, after: r.after == null ? 0 : r.after })),
        pages: pageList(), lsn: lsn, durableLsn: durableLsn, checkpointLsn: checkpointLsn,
        active: Object.keys(active), crashed: crashed, cursor: 0, mode: "run", losers: [], undone: []
      }, extra || {});

      const append = (rec) => { lsn += 1; rec.lsn = lsn; log.push(rec); return lsn; };

      yield {
        label: `Empty WAL, ${NP} data pages holding 100 each. The rule: a log record describing a change must be durable BEFORE the changed page may reach disk, and a COMMIT record must be durable before the client is told "ok".`,
        phase: "init",
        state: snap()
      };

      const crashDuring = 1 + Math.floor(rng() * Math.max(1, NT - 2));   // txn index that will be in flight

      for (let t = 0; t < NT; t++) {
        const tx = "T" + (t + 1);
        append({ type: "begin", tx: tx });
        active[tx] = true;
        yield {
          label: `${tx} BEGIN → log record ${lsn}. Nothing durable yet: this record is only in the log buffer.`,
          phase: "run",
          state: snap()
        };

        for (let o = 0; o < OPS; o++) {
          const pg = "p" + Math.floor(rng() * NP);
          const before = mem[pg];
          const after = before + 10 + Math.floor(rng() * 40);

          const l = append({ type: "update", tx: tx, page: pg, before: before, after: after });
          yield {
            label: `${tx} wants ${pg}: ${before} → ${after}. Log record ${l} is appended FIRST, carrying both the before-image (for undo) and the after-image (for redo). The page has not been touched.`,
            phase: "run",
            state: snap({ cursor: l })
          };

          mem[pg] = after; memLsn[pg] = l;
          yield {
            label: `Now the page changes — in the buffer pool only. ${pg} is dirty (memory ${after}, disk ${disk[pg]}) with pageLSN ${l}. Disk is stale on purpose: random page writes are deferred, sequential log writes are not.`,
            phase: "run",
            state: snap({ cursor: l })
          };
        }

        // ---- the crash lands mid-flush, with this transaction in flight -----
        if (t === crashDuring) {
          // a background flush pushes ONE dirty page out (legally: its log record is older than durableLsn? no —
          // that is exactly the rule we are about to demonstrate)
          const victim = "p" + Math.floor(rng() * NP);
          if (memLsn[victim] > durableLsn) {
            durableLsn = memLsn[victim];
            yield {
              label: `Background writer wants to flush ${victim}. Write-ahead rule: it must first fsync the log up to LSN ${durableLsn} — the record describing that page's change. Log fsynced.`,
              phase: "flush",
              state: snap({ cursor: durableLsn })
            };
          }
          disk[victim] = mem[victim]; diskLsn[victim] = memLsn[victim];
          yield {
            label: `${victim} written to disk with value ${disk[victim]} — belonging to ${tx}, which has NOT committed. That is allowed (a "steal" policy) precisely because the before-image is already in the durable log.`,
            phase: "flush",
            state: snap({ cursor: durableLsn })
          };

          crashed = true;
          yield {
            label: `💥 CRASH. Power loss mid-flight. In memory: the buffer pool, the uncommitted changes, and any log records after LSN ${durableLsn} that were never fsynced. On disk: the log up to ${durableLsn}, and a half-updated set of pages.`,
            phase: "crash",
            state: snap({ cursor: durableLsn })
          };
          break;
        }

        // ---- commit ---------------------------------------------------------
        append({ type: "commit", tx: tx });
        durableLsn = lsn;
        delete active[tx];
        yield {
          label: `${tx} COMMIT → log record ${lsn}, then ONE fsync makes the log durable up to ${durableLsn}. Only now may the client be told "committed" — and note the dirty pages are still not on disk. Durability came from the log, not the data.`,
          phase: "commit",
          state: snap({ cursor: lsn })
        };

        if ((t + 1) % 2 === 0) {
          for (let p = 0; p < NP; p++) { const id = "p" + p; disk[id] = mem[id]; diskLsn[id] = memLsn[id]; }
          checkpointLsn = append({ type: "checkpoint", tx: "-" });
          durableLsn = lsn;
          yield {
            label: `CHECKPOINT at LSN ${checkpointLsn}: dirty pages flushed, so recovery may start here instead of at the beginning of time. More checkpoints = faster recovery, more steady-state I/O. That is the RTO knob.`,
            phase: "checkpoint",
            state: snap({ cursor: checkpointLsn })
          };
        }
      }

      // ================= RECOVERY =================
      // Reset volatile state — everything in RAM is gone.
      const durableLog = log.filter((r) => r.lsn <= durableLsn);
      for (let p = 0; p < NP; p++) { const id = "p" + p; mem[id] = disk[id]; memLsn[id] = diskLsn[id]; }

      yield {
        label: `Restart. Memory is empty; pages are read back from disk exactly as the crash left them (${pageList().map((p) => p.id + "=" + p.disk).join(", ")}) — a mixture of committed and uncommitted values. The durable log ends at LSN ${durableLsn}; records after it never existed.`,
        phase: "recover",
        state: snap({ mode: "recover", cursor: 0 })
      };

      // --- pass 1: analysis ---------------------------------------------------
      const begun = {}, committedTx = {};
      for (const r of durableLog) {
        if (r.type === "begin") begun[r.tx] = true;
        if (r.type === "commit") committedTx[r.tx] = true;
      }
      const losers = Object.keys(begun).filter((tx) => !committedTx[tx]);
      yield {
        label: `PASS 1 — ANALYSIS: scan forward from the last checkpoint (LSN ${checkpointLsn}). Committed: ${Object.keys(committedTx).join(", ") || "none"}. In flight at the crash (the "losers"): ${losers.join(", ") || "none"} — their partial work is sitting on disk and must go.`,
        phase: "analysis",
        state: snap({ mode: "recover", losers: losers.slice(), cursor: checkpointLsn })
      };

      // --- pass 2: redo (repeat history, losers included) ---------------------
      let redone = 0, skipped = 0;
      for (const r of durableLog) {
        if (r.type !== "update" || r.lsn <= checkpointLsn) continue;
        if (memLsn[r.page] >= r.lsn) {
          skipped += 1;
          yield {
            label: `REDO ${r.lsn}: ${r.page} already has pageLSN ${memLsn[r.page]} ≥ ${r.lsn}, so this change survived the crash on disk. Skip — that pageLSN test is what makes redo idempotent.`,
            phase: "redo",
            state: snap({ mode: "recover", losers: losers.slice(), cursor: r.lsn })
          };
          continue;
        }
        mem[r.page] = r.after; memLsn[r.page] = r.lsn;
        redone += 1;
        yield {
          label: `REDO ${r.lsn}: reapply ${r.tx}'s change to ${r.page} → ${r.after}${losers.indexOf(r.tx) >= 0 ? ` — yes, even though ${r.tx} never committed. ARIES repeats history first, then undoes; that is what makes undo safe.` : "."}`,
          phase: "redo",
          state: snap({ mode: "recover", losers: losers.slice(), cursor: r.lsn })
        };
      }

      // --- pass 3: undo -------------------------------------------------------
      const undone = [];
      for (let i = durableLog.length - 1; i >= 0; i--) {
        const r = durableLog[i];
        if (r.type !== "update" || losers.indexOf(r.tx) < 0) continue;
        mem[r.page] = r.before; memLsn[r.page] = lsn + 1;
        undone.push(r.lsn);
        const clr = append({ type: "clr", tx: r.tx, page: r.page, before: r.after, after: r.before });
        yield {
          label: `UNDO ${r.lsn}: restore ${r.page} to its before-image ${r.before}, and write a compensation log record (CLR ${clr}). The CLR is why a crash *during recovery* cannot undo this twice — CLRs are redone, never undone.`,
          phase: "undo",
          state: snap({ mode: "recover", losers: losers.slice(), undone: undone.slice(), cursor: r.lsn })
        };
      }

      for (let p = 0; p < NP; p++) { const id = "p" + p; disk[id] = mem[id]; diskLsn[id] = memLsn[id]; }
      yield {
        label: `Recovery complete: ${redone} records redone, ${skipped} skipped by the pageLSN test, ${undone.length} rolled back. Final state = every committed transaction, and nothing from ${losers.join(", ") || "any loser"}. Atomicity and durability both came out of one append-only file.`,
        phase: "done",
        state: snap({ mode: "recover", losers: losers.slice(), undone: undone.slice(), cursor: lsn })
      };
    },

    draw: function (frame, svg, env) {
      const C = env.colors, W = env.width, H = env.height;
      const s = frame.state;
      const h = env.h || function (tag, attrs, kids) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        if (attrs) for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, String(attrs[k]));
        const list = kids == null ? [] : (Array.isArray(kids) ? kids : [kids]);
        for (const c of list) { if (c == null) continue; el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c))); }
        return el;
      };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const add = (n) => { svg.appendChild(n); return n; };
      const txt = (x, y, str, o) => {
        o = o || {};
        return h("text", {
          x: x, y: y, fill: o.fill || C.text2, "font-size": o.size || 11,
          "font-family": o.mono === false ? env.font.base : env.font.mono,
          "text-anchor": o.anchor || "start", "font-weight": o.bold ? 600 : 400
        }, str);
      };

      const typeColor = (t) => t === "commit" ? C.viz6 : t === "checkpoint" ? C.viz7 : t === "clr" ? C.viz5 : t === "begin" ? C.viz1 : C.viz4;

      // ---- header --------------------------------------------------------------
      add(txt(16, 20, s.mode === "recover" ? "RECOVERY" : (s.crashed ? "CRASHED" : "NORMAL OPERATION"),
        { fill: s.mode === "recover" ? C.viz4 : s.crashed ? C.danger : C.text, size: 13, bold: true, mono: false }));
      add(txt(W - 16, 20, `LSN ${s.lsn}   durable ≤ ${s.durableLsn}   checkpoint ${s.checkpointLsn}`, { fill: C.muted, size: 11, anchor: "end" }));

      // ---- buffer pool + disk ---------------------------------------------------
      // A single scale factor `vf`, derived from how much vertical room is
      // actually available between the header and the legend, drives box
      // heights, gaps and font sizes together -- previously everything here
      // was a fixed pixel size, so a tall canvas just grew a big empty gap
      // before the legend instead of bigger, more readable content.
      const topY = 36, bottomY = H - 46;
      const baselineTotal = 46 + 22 + 40 + 30 + 34 + 40; // mem+arrow+disk+gap+logbar+label room
      const vf = Math.max(1, Math.min(3.2, (bottomY - topY) / baselineTotal));

      const py = topY + 4;
      const labelColW = 116; // fixed left column for "buffer pool"/"disk pages" --
      // the row label font is capped well below vf so it can never grow wide
      // enough to run into the boxes, whatever vf ends up being.
      const boxW = Math.min(200 * Math.min(vf, 1.5), (W - labelColW - 24) / Math.max(1, s.pages.length));
      const gap = 14;
      const memH = 46 * vf, arrowLen = 22 * vf, diskH = 40 * vf;
      const labelFs = Math.round(10 * Math.min(vf, 1.2));
      const subFs = Math.round(9 * Math.min(vf, 1.3));

      add(txt(16, py + memH * 0.46, "buffer pool", { fill: C.muted, size: labelFs }));
      add(txt(16, py + memH * 0.46 + subFs + 4, "(volatile)", { fill: C.muted, size: subFs }));
      const diskY0 = py + memH + arrowLen;
      add(txt(16, diskY0 + diskH * 0.55, "disk pages", { fill: C.muted, size: labelFs }));
      add(txt(16, diskY0 + diskH * 0.55 + subFs + 4, "(durable)", { fill: C.muted, size: subFs }));

      for (let i = 0; i < s.pages.length; i++) {
        const p = s.pages[i];
        const x = labelColW + i * (boxW + gap);
        // memory
        add(h("rect", { x: x, y: py, width: boxW, height: memH, rx: 6, fill: C.surface, stroke: p.dirty ? C.viz4 : C.border, "stroke-width": p.dirty ? 2 : 1, opacity: s.crashed && s.mode !== "recover" ? 0.25 : 1 }));
        add(txt(x + boxW / 2, py + memH * 0.42, `${p.id} = ${p.mem}`, { fill: C.text, size: Math.round(13 * Math.min(vf, 1.6)), anchor: "middle", opacity: 1 }));
        add(txt(x + boxW / 2, py + memH * 0.78, p.dirty ? `dirty · pageLSN ${p.lsn}` : `clean · pageLSN ${p.lsn}`, { fill: p.dirty ? C.viz4 : C.muted, size: subFs, anchor: "middle" }));
        // arrow
        add(h("line", { x1: x + boxW / 2, y1: py + memH + 2, x2: x + boxW / 2, y2: py + memH + arrowLen - 2, stroke: p.dirty ? C.viz4 : C.grid, "stroke-width": 1.4, "stroke-dasharray": p.dirty ? "3 3" : null }));
        // disk
        add(h("rect", { x: x, y: diskY0, width: boxW, height: diskH, rx: 6, fill: C.surface2, stroke: C.border }));
        add(txt(x + boxW / 2, diskY0 + diskH * 0.62, `${p.disk}`, { fill: p.disk === p.mem ? C.text2 : C.muted, size: Math.round(13 * Math.min(vf, 1.6)), anchor: "middle" }));
      }
      if (s.crashed && s.mode !== "recover") {
        add(txt(labelColW, py - 8, "everything above the line evaporates", { fill: C.danger, size: labelFs }));
      }

      // ---- the log --------------------------------------------------------------
      const ly = diskY0 + diskH + 30 * vf;
      add(txt(16, ly - 12, "write-ahead log (append-only, sequential)", { fill: C.muted, size: labelFs }));
      const n = Math.max(1, s.log.length);
      const barH = 34 * vf;
      const cw = Math.min(46, (W - 40) / n);
      for (let i = 0; i < s.log.length; i++) {
        const r = s.log[i];
        const x = 20 + i * cw;
        const beyond = r.lsn > s.durableLsn && s.mode !== "recover";
        add(h("rect", {
          x: x, y: ly, width: Math.max(3, cw - 3), height: barH, rx: 3,
          fill: typeColor(r.type), opacity: beyond ? 0.3 : (s.cursor === r.lsn ? 1 : 0.85),
          stroke: s.cursor === r.lsn ? C.text : "none", "stroke-width": s.cursor === r.lsn ? 2 : 0
        }));
        if (cw > 16) {
          add(txt(x + (cw - 3) / 2, ly + barH * 0.44, String(r.lsn), { fill: C.surface, size: Math.round(9 * Math.min(vf, 1.4)), anchor: "middle" }));
          add(txt(x + (cw - 3) / 2, ly + barH * 0.79, r.type === "checkpoint" ? "CKP" : r.type === "update" ? r.tx : r.type === "commit" ? "OK" : r.type === "clr" ? "CLR" : r.tx,
            { fill: C.surface, size: Math.round(8 * Math.min(vf, 1.4)), anchor: "middle" }));
        }
      }
      // durable boundary
      if (s.durableLsn > 0) {
        const bx = 20 + s.durableLsn * cw - 1;
        add(h("line", { x1: bx, y1: ly - 6, x2: bx, y2: ly + barH + 8, stroke: C.ok, "stroke-width": 2 }));
        add(txt(bx + 4, ly + barH + 20, `fsync boundary — durable ≤ ${s.durableLsn}`, { fill: C.ok, size: subFs }));
      }
      if (s.checkpointLsn > 0) {
        const ckx = 20 + (s.checkpointLsn - 1) * cw + (cw - 3) / 2;
        add(h("line", { x1: ckx, y1: ly - 10, x2: ckx, y2: ly, stroke: C.viz7, "stroke-width": 2 }));
        add(txt(ckx, ly - 14, "checkpoint", { fill: C.viz7, size: subFs, anchor: "middle" }));
      }

      // legend
      const leg = [["begin", C.viz1], ["update", C.viz4], ["commit", C.viz6], ["checkpoint", C.viz7], ["CLR", C.viz5]];
      for (let i = 0; i < leg.length; i++) {
        const x = 20 + i * 96;
        add(h("rect", { x: x, y: H - 34, width: 11, height: 11, rx: 2, fill: leg[i][1] }));
        add(txt(x + 16, H - 24, leg[i][0], { fill: C.muted, size: 11 }));
      }

      // ---- status --------------------------------------------------------------
      if (s.mode === "recover") {
        add(txt(W - 16, H - 24, `losers: ${s.losers.join(", ") || "none"}   undone: ${s.undone.length}`, { fill: s.losers.length ? C.warn : C.ok, size: 12, anchor: "end" }));
      } else {
        add(txt(W - 16, H - 24, `active txns: ${s.active.join(", ") || "none"}`, { fill: C.muted, size: 12, anchor: "end" }));
      }
    }
  },

  drill: {
    cards: [
      { q: "State the write-ahead rule.", a: "A log record describing a change must be durable before the changed page may be written to disk, and a transaction's COMMIT record must be durable before the client is told it committed.", tags: ["rule"] },
      { q: "Why log first instead of just writing pages carefully?", a: "Page writes are neither atomic nor cheap: one transaction touches many scattered 8 KB pages. The log turns that into a single sequential append, and gives you one instant — the commit fsync — at which the transaction becomes real.", tags: ["concept"] },
      { q: "What does fsync guarantee that write does not?", a: "`write()` only fills the OS page cache. `fsync()`/`fdatasync()` pushes to the device. Beyond that you depend on barriers and the device's power-loss protection. A *failed* fsync on Linux may drop the dirty page and report the error once — which is why Postgres panics and recovers rather than retrying.", tags: ["durability", "pitfall"] },
      { q: "Name the three ARIES passes and what each does.", a: "Analysis: from the last checkpoint, rebuild the dirty page table and the list of in-flight (loser) transactions. Redo: replay all updates forward, including losers, skipping records where pageLSN ≥ record LSN. Undo: roll losers back using before-images, writing CLRs.", tags: ["recovery"] },
      { q: "Why does redo replay uncommitted transactions too?", a: "It repeats history to reconstruct the exact pre-crash state, so undo then operates against page contents it fully understands. Skipping losers breaks physiological log records that only make sense applied to a specific page image.", tags: ["recovery"] },
      { q: "What is a CLR and why is it needed?", a: "A compensation log record written for each undo action, carrying an undoNextLSN. If recovery itself crashes, CLRs are redone and never undone, so no change is rolled back twice — that's what makes recovery idempotent.", tags: ["recovery"] },
      { q: "What does a checkpoint trade off?", a: "Recovery time against steady-state I/O. Frequent checkpoints mean a short log to replay but repeated page flushing and latency spikes; rare checkpoints mean a smooth normal path and a long, scary recovery. Set it from your RTO and spread the flushing out.", tags: ["checkpoint"] },
      { q: "Why does group commit exist and what does it cost?", a: "One fsync per transaction caps commits at ~1/fsync_time — roughly 10k/s on NVMe, 125/s on a spinning disk. Group commit batches many commit records into a single fsync, multiplying throughput by the batch size, at the cost of up to one batching interval of extra latency per transaction.", tags: ["numbers"] },
      { q: "Where else does the WAL idea show up?", a: "LSM trees (WAL in front of a volatile memtable), replication (Postgres streaming/MySQL binlog IS the WAL), CDC pipelines, Raft's replicated log, and filesystem journaling.", tags: ["breadth"] }
    ],
    sixtySecond: [
      "Explain why a database writes a log before it writes data, and what happens on restart after a crash.",
      "Explain ARIES: analysis, redo, undo, and why redo includes transactions that never committed."
    ]
  }
};
