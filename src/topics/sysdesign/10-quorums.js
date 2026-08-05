export default {
  id: "quorums",
  track: "sysdesign",
  title: "CAP, PACELC & Quorums",
  difficulty: 2,
  minutes: 16,
  tags: ["cap", "pacelc", "quorums", "consistency", "availability", "partitions"],

  explainer: [
    { type: "p", text: "CAP is the most quoted and least understood result in distributed systems. It does **not** say \"pick two of three\". It says: *when a network partition occurs*, a system must choose between continuing to serve (**A**) and refusing in order to stay consistent (**C**). With no partition, you get both. The theorem is a statement about one specific, rare failure mode." },

    { type: "callout", tone: "warn", text: "The \"CA system\" does not exist. Partitions are not optional — cables get cut, switches reboot, GC pauses look exactly like a partition from outside. A single-node database isn't CA; it's a system with no partitions to reason about. If someone offers you CA, they are describing what happens when nothing is broken." },

    { type: "h3", text: "PACELC — the half people forget" },
    { type: "p", text: "**If Partitioned, choose Availability or Consistency; Else, choose Latency or Consistency.** The `ELSE` clause matters far more day to day, because partitions are rare and *every single request* pays the latency/consistency trade. A system that waits for a quorum on every read is slower forever, not just during an incident." },
    { type: "list", items: [
      "**PC/EC** — Spanner, etcd, ZooKeeper, HBase. Consistent always, and you pay a round trip for it.",
      "**PA/EL** — Dynamo, Cassandra (default), Riak. Available and fast, and you handle stale reads and conflicts.",
      "**PC/EL** — MongoDB with default read concern, PNUTS. Consistent under partition, but reads from a local replica in the happy path.",
      "The important insight: this is a per-operation choice, not a per-database one. Cassandra lets you pick the consistency level per query, and you should — a balance read is not a profile-photo read."
    ]},

    { type: "h3", text: "Quorums make it a dial" },
    { type: "p", text: "With N replicas, a write waits for **W** acks and a read collects **R** responses. If **R + W > N**, the read set and the write set must share at least one replica, so the read is guaranteed to see the latest acknowledged write. That's just the pigeonhole principle, and it is the single most useful formula on this page." },
    { type: "list", items: [
      "`N=3, W=2, R=2` — the classic. Overlap guaranteed (4 > 3), tolerates one replica down for both reads and writes.",
      "`N=3, W=3, R=1` — fast reads from any replica, but any single replica down blocks *all* writes. Good for read-heavy, write-rare config data.",
      "`N=3, W=1, R=1` — fastest possible, no overlap guarantee (2 ≯ 3), so reads can be stale. Fine for metrics, view counts, presence.",
      "**Sloppy quorum + hinted handoff** (Dynamo) — during a partition, accept W acks from *any* N healthy nodes, not the N designated ones. That keeps writes available, but it breaks the R+W>N guarantee, because the read quorum may not include the nodes that took the write."
    ]},

    { type: "callout", tone: "pitfall", text: "R+W>N gives you overlap, not linearizability. Two concurrent writes can be acked in different orders at different replicas; a read can see a value and a later read see the older one if a write is still propagating; and a failed write that reached some replicas may or may not later appear. Dynamo-style quorums are strong *enough* for many things and are not the same as consensus." },

    { type: "h3", text: "What you must do if you choose A" },
    { type: "p", text: "Choosing availability means accepting divergent replicas and reconciling later. That machinery is the actual cost:" },
    { type: "list", items: [
      "**Read repair** — a read that sees disagreement pushes the newest value back to the laggards. Cheap, and only fixes keys someone reads.",
      "**Anti-entropy** — background Merkle-tree comparison between replicas, repairing everything including cold keys.",
      "**Hinted handoff** — a substitute node holds writes destined for a down node and delivers them when it returns.",
      "**Conflict resolution** — last-write-wins is simple and silently loses data (and depends on clocks). **Vector clocks** detect concurrency instead of guessing, and hand the conflict to the application. **CRDTs** make merges automatic and correct, at the cost of constraining your data types."
    ]},

    { type: "h3", text: "The numbers" },
    { type: "p", text: "Latency of a quorum operation is the **W-th (or R-th) fastest** replica's response, not the slowest — which is exactly why quorums are used instead of all-replica writes. With N=3 replicas at 1 ms, 2 ms and 90 ms (one cross-region), `W=2` costs ~2 ms while `W=3` costs ~90 ms. Same durability story as semi-sync replication, same reason." },
    { type: "p", text: "Back-of-envelope for availability: if a single replica is up 99.9% of the time, `N=3, W=2` needs any 2 of 3, giving roughly `1 − 3×(0.001)² ≈ 99.9997%` write availability — three extra nines from one extra replica. That calculation, stated out loud, is worth more than any amount of CAP vocabulary." }
  ],

  complexity: {
    rows: [
      { operation: "Quorum write", time: "W-th fastest replica RTT", space: "N copies", note: "not the slowest — that's the point" },
      { operation: "Quorum read", time: "R-th fastest replica RTT", space: "—", note: "returns max version among R" },
      { operation: "Overlap guarantee", time: "R + W > N", space: "—", note: "pigeonhole; no overlap ⇒ stale reads possible" },
      { operation: "Write availability", time: "any W of N reachable", space: "—", note: "N=3,W=2 survives 1 failure" },
      { operation: "Read repair", time: "O(R) compare + O(divergent) write", space: "—", note: "only repairs keys that are read" },
      { operation: "Anti-entropy", time: "O(log keys) Merkle compare", space: "O(keys)", note: "repairs cold keys too" }
    ]
  },

  interview: {
    whyAsked: "It's the trade-off question interviewers use to separate vocabulary from judgement. Saying 'CAP means pick two' is a red flag; saying 'partitions are not optional, so the real question is what I do during one, and PACELC's else-clause is what I pay for every day' is the answer. They then want R+W>N derived, not recited.",
    followUps: [
      { q: "Explain CAP without saying 'pick two'.", a: "When the network partitions a cluster, a node that can't reach its peers has exactly two options: answer anyway, risking that its data is stale or that it creates a conflicting write (AP), or refuse to answer until it can confirm it's current (CP). There is no third option, because answering correctly would require information it cannot obtain. When there's no partition, you get consistency and availability simultaneously — which is why CAP describes a failure mode, not a steady state. PACELC completes it: even without a partition you're choosing between latency and consistency on every request." },
      { q: "Derive R + W > N.", a: "The write is acknowledged once W replicas have it; the read collects responses from R replicas. If R + W > N then by pigeonhole the read set and the write set cannot be disjoint — at least one replica is in both — so the read sees the latest acknowledged write and, using version numbers, can pick it out. If R + W ≤ N the sets can be disjoint and the read can legally miss the newest value entirely. Note what this doesn't give you: it's not linearizability, because concurrent writes can be ordered differently at different replicas and an in-flight write can appear and disappear across successive reads." },
      { q: "Pick N, R, W for a shopping cart, and for an account balance.", a: "Shopping cart: availability matters more than momentary correctness — never lose an 'add to cart'. N=3, W=1, R=1 with vector clocks or a CRDT set, so concurrent adds from two devices merge rather than overwrite. Amazon's original Dynamo paper uses exactly this example, and 'the cart occasionally resurrects a deleted item' is a business decision they made deliberately. Account balance: correctness dominates — I wouldn't use quorums at all, I'd use a consensus-backed system with a single leader per account so I get real linearizability and transactions. If forced into quorums, N=3, W=3, R=1 or W=2, R=2, and conditional writes with compare-and-set on a version." },
      { q: "What is a sloppy quorum and what does it break?", a: "During a partition, instead of requiring W of the N replicas that *should* own the key, Dynamo accepts W acks from the first N healthy nodes it can reach, with hinted handoff so those nodes forward the data to the rightful owners when they recover. This keeps writes available through almost any failure. The cost is that R+W>N no longer guarantees overlap: the read quorum queries the designated replicas, which may not yet have received the handoff, so a read can miss an acknowledged write. It's an availability choice, and it must be a conscious one." },
      { q: "How do you resolve conflicting writes?", a: "Last-write-wins by timestamp is the simplest and silently discards one of the two writes — and it depends on clock sync, so a machine with a skewed clock can make its writes permanently win or permanently lose. Vector clocks detect true concurrency rather than guessing, so the system can hand both versions to the application (Dynamo's siblings) — correct but pushes work onto the caller. CRDTs give deterministic, order-independent merges (G-counters, OR-sets, LWW-registers) at the price of constraining your data model to those types. For anything financial, don't reconcile at all — serialize the writes through a leader." },
      { q: "How does Spanner claim to be CA?", a: "It doesn't, really — it's CP with extremely high availability. Under a partition, the minority side stops serving; it just so happens Google's private network makes partitions rare enough that measured availability exceeds five nines, so users perceive it as always-on. Its distinctive part is TrueTime: GPS and atomic clocks give a bounded uncertainty interval, and a commit *waits out* that uncertainty (a few milliseconds) before acknowledging, which yields external consistency across regions. That's PACELC's else-clause made explicit — they pay latency on every write to buy global consistency." },
      { q: "Is a system with R+W>N linearizable?", a: "No, and this is a common trap. Overlap ensures a read sees the latest *acknowledged* write, but Dynamo-style quorums have no ordering authority: two concurrent writes may be applied in different orders at different replicas; a write that failed after reaching some replicas may surface later; and without read repair being synchronous, successive reads can go backwards, violating monotonic reads. Linearizability requires a single ordering point — consensus (Raft/Paxos) or a leader with fencing — not just intersecting quorums." }
    ]
  },

  code: [
    { lang: "python", label: "Quorum read/write with versions and read repair", code: "import time\n\nclass QuorumClient:\n    def __init__(self, replicas, N, R, W):\n        assert R + W > N or True, \"R+W<=N is legal, just not overlap-guaranteed\"\n        self.replicas, self.N, self.R, self.W = replicas, N, R, W\n        self.guaranteed = R + W > N\n\n    def put(self, key, value):\n        version = (int(time.time() * 1000), self.node_id)   # (ts, tiebreak)\n        acks, errs = 0, []\n        # Send to ALL N in parallel; return as soon as W have acked.\n        # Latency = the W-th FASTEST replica, not the slowest. That is the point.\n        for r in self.fan_out(key, self.N):\n            try:\n                r.write(key, value, version)\n                acks += 1\n                if acks >= self.W:\n                    return version              # the rest continue in the background\n            except Unreachable as e:\n                errs.append(e)\n        raise NotEnoughReplicas(f\"{acks}/{self.W} acks; {len(errs)} unreachable\")\n\n    def get(self, key):\n        responses = []\n        for r in self.fan_out(key, self.N):\n            try:\n                responses.append((r, r.read(key)))          # (replica, (value, version))\n                if len(responses) >= self.R:\n                    break\n            except Unreachable:\n                pass\n        if len(responses) < self.R:\n            raise NotEnoughReplicas(f\"{len(responses)}/{self.R}\")\n\n        newest = max(responses, key=lambda rv: rv[1][1])\n        # READ REPAIR: push the winner back to whoever is behind. Only fixes\n        # keys somebody actually reads -- cold keys need anti-entropy.\n        for replica, (val, ver) in responses:\n            if ver < newest[1][1]:\n                async_write(replica, key, newest[1][0], newest[1][1])\n        return newest[1][0]" },
    { lang: "python", label: "Vector clocks — detect concurrency instead of guessing", code: "def compare(a, b):\n    \"\"\"a, b: {node_id: counter}. Returns 'before' | 'after' | 'concurrent'.\"\"\"\n    a_le = all(a.get(k, 0) <= b.get(k, 0) for k in set(a) | set(b))\n    b_le = all(b.get(k, 0) <= a.get(k, 0) for k in set(a) | set(b))\n    if a_le and not b_le: return \"before\"\n    if b_le and not a_le: return \"after\"\n    if a_le and b_le:     return \"equal\"\n    return \"concurrent\"          # <-- LWW would silently discard one of these\n\ndef merge_siblings(versions):\n    \"\"\"Drop anything strictly dominated; return the surviving siblings.\"\"\"\n    keep = []\n    for v in versions:\n        if not any(compare(v.clock, o.clock) == \"before\" for o in versions if o is not v):\n            keep.append(v)\n    return keep                  # len > 1 => a real conflict for the APP to resolve\n\n# Cart example: two devices concurrently add items. LWW keeps one cart and\n# loses an item. Vector clocks surface both, and the app unions them --\n# which is why \"deleted items come back\" but \"added items never vanish\"." },
    { lang: "sql", label: "Cassandra: consistency is per-query, not per-database", code: "-- N is fixed by the keyspace's replication factor.\nCREATE KEYSPACE shop WITH replication =\n  { 'class': 'NetworkTopologyStrategy', 'us-east': 3, 'eu-west': 3 };\n\n-- Money: overlap guaranteed (2 + 2 > 3 within the local DC).\nCONSISTENCY LOCAL_QUORUM;               -- W = 2 of 3\nUPDATE ledger SET balance = 500 WHERE id = 42 IF balance = 450;  -- LWT = Paxos\n\n-- Telemetry: fastest possible, staleness is fine (1 + 1 <= 3, no overlap).\nCONSISTENCY ONE;                        -- W = 1, R = 1\nINSERT INTO page_views (page, ts, n) VALUES ('/home', now(), 1);\n\n-- Cross-region strong read: correct, and you pay ~80ms for it every time.\nCONSISTENCY EACH_QUORUM;\n\n-- The lesson: a balance read and a view-count read should NOT share a\n-- consistency level. PACELC's else-clause is a per-operation decision." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 320 },

    params: [
      { key: "N", label: "Replicas (N)", type: "int", min: 3, max: 7, default: 5 },
      { key: "R", label: "Read quorum (R)", type: "int", min: 1, max: 7, default: 3 },
      { key: "W", label: "Write quorum (W)", type: "int", min: 1, max: 7, default: 3 },
      { key: "ops", label: "Operations", type: "int", min: 10, max: 40, default: 22 },
      { key: "seed", label: "Re-roll latencies", type: "seed" }
    ],

    frames: function* (params, rng) {
      const N = params.N;
      const R = Math.max(1, Math.min(N, params.R));
      const W = Math.max(1, Math.min(N, params.W));
      const OPS = params.ops;
      const overlap = R + W > N;

      const reps = [];
      for (let i = 0; i < N; i++) {
        reps.push({
          id: "r" + i,
          rtt: i === N - 1 ? 70 + Math.floor(rng() * 30) : 1 + Math.floor(rng() * 6),
          zone: i === N - 1 ? "eu-west" : (i < Math.ceil(N / 2) ? "az-a" : "az-b"),
          version: 0, reachable: true
        });
      }
      let latest = 0;
      let staleReads = 0, failedWrites = 0, failedReads = 0, repairs = 0;
      const lat = [];

      const partFrom = Math.floor(OPS * 0.35), partTo = Math.floor(OPS * 0.7);

      const snap = (extra) => Object.assign({
        reps: reps.map((r) => ({ id: r.id, rtt: r.rtt, zone: r.zone, version: r.version, reachable: r.reachable })),
        N: N, R: R, W: W, overlap: overlap, latest: latest,
        staleReads: staleReads, failedWrites: failedWrites, failedReads: failedReads, repairs: repairs,
        lat: lat.slice(-24), op: "", chosen: [], ms: 0, partitioned: false, result: ""
      }, extra || {});

      yield {
        label: `N=${N}, R=${R}, W=${W}. R+W = ${R + W} ${overlap ? ">" : "≤"} N = ${N}, so the read and write sets ${overlap ? "MUST intersect — every read sees the latest acknowledged write" : "can be disjoint — a read may legally miss the newest write"}. That is the whole formula, and it is just pigeonhole.`,
        phase: "init",
        state: snap()
      };

      for (let op = 0; op < OPS; op++) {
        // ---- partition window --------------------------------------------------
        const inPartition = op >= partFrom && op < partTo;
        if (op === partFrom) {
          for (let i = Math.ceil(N / 2); i < N; i++) reps[i].reachable = false;
          const up = reps.filter((r) => r.reachable).length;
          yield {
            label: `NETWORK PARTITION: az-b and eu-west are cut off. Only ${up} of ${N} replicas reachable. Writes need W=${W}, reads need R=${R} — this is the exact moment CAP forces a choice.`,
            phase: "partition",
            state: snap({ partitioned: true, op: "partition" })
          };
        }
        if (op === partTo) {
          for (const r of reps) r.reachable = true;
          yield {
            label: `Partition heals. Replicas that missed writes are still stale — availability during the partition was paid for with divergence that read repair and anti-entropy must now clean up.`,
            phase: "heal",
            state: snap({ op: "heal" })
          };
        }

        const up = reps.filter((r) => r.reachable);
        const byRtt = up.slice().sort((a, b) => a.rtt - b.rtt);

        if (op % 2 === 0) {
          // ================= WRITE =================
          if (up.length < W) {
            failedWrites += 1;
            yield {
              label: `WRITE v${latest + 1} refused: only ${up.length} replicas reachable, W=${W} required. The system chose CONSISTENCY over availability — it would rather return an error than accept a write it cannot make durable on a quorum.`,
              phase: "write-fail",
              state: snap({ op: "write", result: "unavailable", partitioned: inPartition })
            };
            continue;
          }
          latest += 1;
          const chosen = byRtt.slice(0, W);
          for (const r of chosen) r.version = latest;
          const ms = chosen[chosen.length - 1].rtt;
          lat.push({ kind: "w", ms: ms });
          yield {
            label: `WRITE v${latest}: sent to all ${up.length} reachable replicas, acknowledged as soon as W=${W} responded — ${chosen.map((c) => c.id).join(", ")} at ${ms} ms. Latency is the ${W}${W === 1 ? "st" : W === 2 ? "nd" : W === 3 ? "rd" : "th"}-fastest replica, NOT the slowest (${byRtt[byRtt.length - 1].rtt} ms). That is why quorums beat writing to all.`,
            phase: "write",
            focus: chosen.map((c) => reps.indexOf(c)),
            state: snap({ op: "write", chosen: chosen.map((c) => c.id), ms: ms, result: "ok", partitioned: inPartition })
          };
        } else {
          // ================= READ =================
          if (up.length < R) {
            failedReads += 1;
            yield {
              label: `READ refused: ${up.length} reachable, R=${R} required. Choosing C means the minority side of a partition simply stops answering.`,
              phase: "read-fail",
              state: snap({ op: "read", result: "unavailable", partitioned: inPartition })
            };
            continue;
          }
          // read from R replicas chosen by latency (what a real coordinator does)
          const chosen = byRtt.slice(0, R);
          const seen = Math.max.apply(null, chosen.map((c) => c.version));
          const ms = chosen[chosen.length - 1].rtt;
          lat.push({ kind: "r", ms: ms });
          const stale = seen < latest;
          if (stale) staleReads += 1;
          // read repair
          let repaired = 0;
          for (const c of chosen) if (c.version < seen) { c.version = seen; repaired += 1; }
          repairs += repaired;

          yield {
            label: stale
              ? `READ from ${chosen.map((c) => c.id).join(", ")} → versions ${chosen.map((c) => "v" + c.version).join(", ")} → returns v${seen}, but the latest acknowledged write is v${latest}. STALE READ${overlap ? " — only possible because the partition broke the quorum's overlap assumption" : ` — expected: R+W = ${R + W} ≤ N = ${N}, so the read set can miss the write set entirely`}.`
              : `READ from ${chosen.map((c) => c.id).join(", ")} → versions ${chosen.map((c) => "v" + c.version).join(", ")} → returns v${seen} at ${ms} ms. Fresh${overlap ? ", and guaranteed so: R+W > N means at least one of these replicas took the last write" : " — by luck, not by guarantee"}.${repaired ? ` Read repair pushed v${seen} to ${repaired} lagging replica${repaired === 1 ? "" : "s"}.` : ""}`,
            phase: stale ? "stale" : "read",
            focus: chosen.map((c) => reps.indexOf(c)),
            state: snap({ op: "read", chosen: chosen.map((c) => c.id), ms: ms, result: stale ? "stale" : "fresh", partitioned: inPartition })
          };
        }
      }

      const ws = lat.filter((l) => l.kind === "w").map((l) => l.ms);
      const rs = lat.filter((l) => l.kind === "r").map((l) => l.ms);
      const avg = (a) => (a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : 0);
      yield {
        label: `Done. ${staleReads} stale reads, ${failedWrites} writes and ${failedReads} reads refused during the partition, ${repairs} read repairs. Avg write ${avg(ws)} ms, avg read ${avg(rs)} ms. ` +
          (overlap
            ? `R+W > N held outside the partition, so every read there was guaranteed fresh — and the price was refusing service on the minority side. That is CP.`
            : `R+W ≤ N, so nothing was ever refused — and staleness was permanent until read repair caught it. That is AP.`),
        phase: "done",
        state: snap({ op: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const C = env.colors, W = env.width, H = env.height;
      const s = frame.state;
      ctx.clearRect(0, 0, W, H);
      const M = env.font.mono, F = env.font.base;
      const lab = (x, y, t, col, size, align, useBase) => {
        ctx.fillStyle = col; ctx.font = `${size || 11}px ${useBase ? F : M}`;
        ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
      };

      // ---- formula banner ------------------------------------------------------
      lab(16, 24, `N = ${s.N}    R = ${s.R}    W = ${s.W}`, C.text, 15, "left", true);
      const ok = s.overlap;
      lab(210, 24, `R + W = ${s.R + s.W} ${ok ? ">" : "≤"} N = ${s.N}`, ok ? C.ok : C.warn, 14);
      lab(210, 42, ok ? "read and write sets must intersect → no stale reads (absent a partition)" : "read and write sets can be disjoint → stale reads are legal", ok ? C.ok : C.warn, 11);

      // ---- replicas -------------------------------------------------------------
      const chosenSet = {};
      for (const id of s.chosen) chosenSet[id] = 1;
      const bw = Math.min(120, (W - 60) / s.N - 12);
      const by = 74, bh = 78;
      for (let i = 0; i < s.N; i++) {
        const r = s.reps[i];
        const x = 24 + i * (bw + 12);
        const isChosen = chosenSet[r.id] === 1;
        const roleCol = s.op === "read" ? C.viz5 : C.viz1;

        ctx.fillStyle = r.reachable ? C.surface : C.surface2;
        ctx.beginPath(); ctx.roundRect(x, by, bw, bh, 8); ctx.fill();
        ctx.strokeStyle = !r.reachable ? C.danger : isChosen ? roleCol : C.border;
        ctx.lineWidth = isChosen ? 2.5 : 1;
        ctx.beginPath(); ctx.roundRect(x, by, bw, bh, 8); ctx.stroke();

        ctx.globalAlpha = r.reachable ? 1 : 0.5;
        lab(x + bw / 2, by + 20, r.id, C.text, 13, "center");
        lab(x + bw / 2, by + 36, r.zone, C.muted, 9, "center");
        const behind = r.version < s.latest;
        lab(x + bw / 2, by + 56, `v${r.version}`, behind ? C.warn : C.viz6, 16, "center");
        lab(x + bw / 2, by + 70, `${r.rtt} ms`, C.muted, 9, "center");
        ctx.globalAlpha = 1;

        if (!r.reachable) {
          ctx.strokeStyle = C.danger; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(x + 8, by + 8); ctx.lineTo(x + bw - 8, by + bh - 8); ctx.stroke();
          lab(x + bw / 2, by - 6, "unreachable", C.danger, 9, "center");
        } else if (isChosen) {
          lab(x + bw / 2, by - 6, s.op === "read" ? "in read quorum" : "in write quorum", roleCol, 9, "center");
        }
      }

      // partition line
      if (s.reps.some((r) => !r.reachable)) {
        const firstDown = s.reps.findIndex((r) => !r.reachable);
        const px = 24 + firstDown * (bw + 12) - 6;
        ctx.strokeStyle = C.danger; ctx.lineWidth = 2; ctx.setLineDash([6, 5]);
        ctx.beginPath(); ctx.moveTo(px, by - 18); ctx.lineTo(px, by + bh + 14); ctx.stroke();
        ctx.setLineDash([]);
        lab(px + 4, by + bh + 26, "PARTITION", C.danger, 10);
      }

      // ---- latency strip ---------------------------------------------------------
      const gy = H - 46, gh = H - (by + bh) - 76;
      const gx = 24, gw = W - 220;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
      lab(gx, gy - gh - 10, "per-operation latency — write (blue) vs read (pink); the tall bars are cross-region", C.muted, 10);
      const maxMs = Math.max(10, ...s.lat.map((l) => l.ms));
      const cw = gw / Math.max(1, s.lat.length);
      for (let i = 0; i < s.lat.length; i++) {
        const l = s.lat[i];
        const bh2 = (l.ms / maxMs) * gh;
        ctx.fillStyle = l.kind === "w" ? C.viz1 : C.viz5;
        ctx.beginPath(); ctx.roundRect(gx + i * cw + 2, gy - bh2, Math.max(2, cw - 4), Math.max(1, bh2), 2); ctx.fill();
      }
      lab(gx - 4, gy - gh + 4, `${maxMs}ms`, C.muted, 9, "right");
      lab(gx - 4, gy + 3, "0", C.muted, 9, "right");
      lab(gx, gy + 16, "operations →", C.muted, 9);

      // ---- counters ---------------------------------------------------------------
      const cx = gx + gw + 26;
      lab(cx, gy - gh + 6, `latest write      v${s.latest}`, C.text, 12);
      lab(cx, gy - gh + 26, `stale reads       ${s.staleReads}`, s.staleReads ? C.warn : C.ok, 12);
      lab(cx, gy - gh + 44, `refused writes    ${s.failedWrites}`, s.failedWrites ? C.danger : C.muted, 12);
      lab(cx, gy - gh + 62, `refused reads     ${s.failedReads}`, s.failedReads ? C.danger : C.muted, 12);
      lab(cx, gy - gh + 80, `read repairs      ${s.repairs}`, C.viz3, 12);
      lab(cx, gy + 3, s.partitioned ? "state: PARTITIONED" : "state: healthy", s.partitioned ? C.danger : C.ok, 12);
    }
  },

  drill: {
    cards: [
      { q: "State CAP correctly.", a: "During a network partition a system must choose between remaining available (answering, possibly with stale or conflicting data) and remaining consistent (refusing to answer). With no partition you get both — CAP describes a failure mode, not a steady state.", tags: ["cap"] },
      { q: "Why is there no such thing as a CA system?", a: "Partitions aren't optional — cables fail, switches reboot, and a long GC pause is indistinguishable from a partition. Claiming CA just means describing behaviour when nothing is broken.", tags: ["cap"] },
      { q: "What does PACELC add?", a: "If Partitioned choose A or C; Else choose Latency or Consistency. The else-clause is what you pay on every request, so it matters far more day to day than the rare partition.", tags: ["pacelc"] },
      { q: "Derive R + W > N.", a: "A write is acked by W replicas, a read queries R. If R+W > N the two sets cannot be disjoint (pigeonhole), so the read must include at least one replica holding the latest write, which version numbers let it identify.", tags: ["quorum"] },
      { q: "Does R+W>N give linearizability?", a: "No. It guarantees a read sees the latest acknowledged write, but concurrent writes can be ordered differently at different replicas, an in-flight write can appear then disappear, and successive reads can go backwards. Linearizability needs a single ordering point — consensus or a fenced leader.", tags: ["pitfall"] },
      { q: "What does a quorum operation cost in latency?", a: "The W-th (or R-th) fastest replica's response, not the slowest. With replicas at 1, 2 and 90 ms, W=2 costs ~2 ms while W=3 costs ~90 ms.", tags: ["numbers"] },
      { q: "What is a sloppy quorum with hinted handoff?", a: "During a partition, accept W acks from the first N *healthy* nodes rather than the N designated owners, and have those substitutes forward the data later. It keeps writes available but breaks the R+W>N overlap guarantee.", tags: ["dynamo"] },
      { q: "Read repair vs anti-entropy?", a: "Read repair fixes divergence it notices while serving a read — cheap, but only for keys someone reads. Anti-entropy compares Merkle trees between replicas in the background and repairs everything, including cold keys.", tags: ["repair"] },
      { q: "Last-write-wins vs vector clocks vs CRDTs.", a: "LWW is simple, clock-dependent, and silently discards one write. Vector clocks detect true concurrency and surface siblings for the application to merge. CRDTs merge automatically and correctly but constrain you to specific data types.", tags: ["conflicts"] },
      { q: "N, R, W for a shopping cart vs an account balance?", a: "Cart: N=3, W=1, R=1 with a CRDT/vector clocks — never lose an add, tolerate a resurrected item. Balance: don't use quorums — use a consensus-backed single writer per account; if forced, W=2/R=2 with compare-and-set on a version.", tags: ["design"] }
    ],
    sixtySecond: [
      "Explain CAP without saying 'pick two', then explain what PACELC adds.",
      "Derive R+W>N from first principles and say what it does and does not guarantee."
    ]
  }
};
