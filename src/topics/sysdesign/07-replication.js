export default {
  id: "replication",
  track: "sysdesign",
  title: "DB Replication & Failover",
  difficulty: 2,
  minutes: 16,
  tags: ["replication", "failover", "consistency", "replica-lag", "durability"],

  explainer: [
    { type: "p", text: "Replication exists for three different reasons that people constantly conflate: **durability** (survive losing a disk), **availability** (survive losing a machine), and **read scale** (spread reads across copies). They pull in different directions, and every design question here is really \"which of the three am I buying, and what am I paying?\"" },

    { type: "h3", text: "The mechanism" },
    { type: "p", text: "A leader accepts writes, appends them to a log (the WAL/binlog), and ships that log to followers, which replay it. Everything else — sync vs async, failover, read routing — is a policy layered on that one pipe. Note the ordering that matters: **the leader can acknowledge the client before, during, or after the followers have the entry.** That choice is the whole lesson." },

    { type: "h3", text: "Sync vs async vs semi-sync" },
    { type: "list", items: [
      "**Async** — the leader acks as soon as its own log is durable. Write latency = one local fsync (~1 ms). If the leader dies before shipping, those acknowledged writes are **gone**. This is the default in MySQL and Postgres, and most people don't realize they chose it.",
      "**Sync (to all)** — the leader waits for every follower. Zero data loss, but write latency = the *slowest* follower's round trip, and any follower being slow or down blocks all writes. Almost nobody runs this.",
      "**Semi-sync / quorum** — wait for *k* of *n* followers (usually 1, or a majority). Latency = the *k-th fastest* replica, which is dramatically better than the slowest, and you survive losing up to n−k replicas without losing acknowledged writes. **This is the answer**: Postgres `synchronous_standby_names` with `ANY 1`, MySQL semi-sync, or a consensus system that does it by construction."
    ]},
    { type: "p", text: "Concrete numbers: local fsync ~0.5–1 ms; same-AZ RTT ~0.5 ms; cross-AZ ~1–2 ms; cross-region ~70 ms. So sync replication *within a region* roughly doubles write latency — cheap insurance. Sync replication *across regions* multiplies it by 70× — which is why cross-region replicas are essentially always async, and why an active-active multi-region write path is a fundamentally different (and much harder) design." },

    { type: "callout", tone: "pitfall", text: "\"Semi-sync\" in MySQL by default means the follower has *received* the event, not *applied* it. Received-but-not-applied still counts for failover safety, but a promoted replica may need to catch up before serving reads. Know which guarantee your flag actually gives you." },

    { type: "h3", text: "Replica lag, and the four anomalies it creates" },
    { type: "list", items: [
      "**Read-your-own-writes** — user posts a comment, is redirected, the read hits a lagging replica, comment gone. Fix: route a user's reads to the leader for a short window after their write, or pin to a replica whose applied LSN ≥ the LSN returned by their write.",
      "**Monotonic reads** — two consecutive reads hit replicas with different lag and time appears to move backwards. Fix: sticky routing — a given user always reads from the same replica.",
      "**Consistent prefix** — with partitioned replication you can see an answer before the question. Fix: preserve causal ordering, or keep causally related data in one partition.",
      "**Stale reads generally** — quantify them. \"p99 replica lag is 200 ms\" is a real SLO; \"eventually consistent\" is not."
    ]},

    { type: "h3", text: "Failover — where the outages actually come from" },
    { type: "list", items: [
      "**Detection** — usually a timeout, typically 10–30 s. Too short and a GC pause triggers a needless failover; too long and you're down for the duration. There is no correct value, only a trade-off you own.",
      "**Election** — pick the replica with the highest applied LSN to minimize loss. This should be automatic and consensus-backed; hand-rolled scripts are how split brain happens.",
      "**Data loss** — under async, everything the old leader acked but never shipped is lost. If the old leader comes back it must be *rewound* to the new leader's history, discarding those writes. GitHub's 2018 outage is the canonical study.",
      "**Split brain** — the old leader didn't actually die, it was partitioned, and it's still accepting writes. Two leaders, divergent history. Mitigations: fencing tokens (monotonically increasing epoch; storage rejects the old epoch), STONITH, or requiring a majority lease to act as leader.",
      "**The thundering effect** — after promotion, every connection reconnects at once and a cold replica's caches are empty. Failover often *causes* the overload it was meant to avoid."
    ]},

    { type: "callout", tone: "tip", text: "The sentence to say: \"I'd run semi-synchronous replication to at least one replica in another AZ, async cross-region, automatic failover with fencing tokens, and I'd measure replica lag as a first-class SLO. I accept up to *one* replica's worth of unavailability for zero acknowledged data loss.\"" },

    { type: "h3", text: "Multi-leader and leaderless — only when you must" },
    { type: "p", text: "Multi-leader (two regions both accepting writes) removes the cross-region write latency and buys you offline/regional independence, at the price of **write conflicts you must resolve**: last-write-wins silently discards data, CRDTs are correct but constrain your data model, and application-level merge is work. Leaderless (Dynamo, Cassandra) replaces the leader with quorums — see the quorums lesson. Both are the right answer far less often than they are proposed." }
  ],

  complexity: {
    rows: [
      { operation: "Async write ack", time: "~1 ms (local fsync)", space: "—", note: "loses acked writes on leader failure" },
      { operation: "Semi-sync (1 of n)", time: "fsync + fastest replica RTT", space: "—", note: "~2 ms same-region; the recommended default" },
      { operation: "Sync to all", time: "fsync + slowest replica RTT", space: "—", note: "one slow replica stalls every write" },
      { operation: "Cross-region sync", time: "+70–150 ms", space: "—", note: "why cross-region is async in practice" },
      { operation: "Failover window", time: "detect (10–30 s) + elect + reconnect", space: "—", note: "the availability number that matters" },
      { operation: "Read scale", time: "n× reads, 1× writes", space: "n× storage", note: "replication never scales writes" }
    ]
  },

  interview: {
    whyAsked: "This is the trade-off question in its purest form: durability vs latency vs availability, with no free lunch. The signal is whether you know that async replication silently loses acknowledged writes on failover, whether you pick semi-sync deliberately, and whether you can describe split brain and how fencing prevents it.",
    followUps: [
      { q: "Sync or async replication — pick one.", a: "Neither extreme: semi-synchronous to one replica in a second AZ. Async is the wrong default because it loses acknowledged writes on failover — the client was told 'committed' and it wasn't. Fully synchronous to all replicas makes write latency equal to the slowest replica and turns any replica's hiccup into a total write outage. Waiting for one of n gives me zero acknowledged data loss for losing a single node, at the cost of roughly one same-AZ round trip (~1 ms) on top of the local fsync. Cross-region stays async, because 70 ms per write is not a trade I'll make." },
      { q: "The leader dies. What exactly can be lost?", a: "Under async, every write the leader acked but hadn't shipped — bounded by the replication lag at that instant, so 200 ms of lag at 5,000 writes/s is about 1,000 acknowledged writes gone. The new leader is elected from the replica with the highest applied LSN to minimize that. If the old leader returns, it holds writes that no longer exist in the new history and must be rewound; naively re-joining it is how you get duplicate primary keys and split-brain corruption. Under semi-sync, anything acked is on at least one surviving replica, so acknowledged data loss is zero for a single failure." },
      { q: "How do you prevent split brain?", a: "Never let 'I think I'm the leader' be sufficient. Elect via a consensus system that requires a majority, and give every leadership term a monotonically increasing **fencing token** (epoch). Every write to shared storage carries the token, and storage rejects anything with an older one — so a partitioned old leader that wakes up is refused even though it still believes it's in charge. Leases with a bounded clock assumption are the other standard mechanism, and STONITH (forcibly power off the old node) is the brutal-but-effective fallback." },
      { q: "A user posts a comment and doesn't see it. What's happening and how do you fix it?", a: "The write went to the leader, the subsequent read went to a replica that hadn't applied it yet — a read-your-own-writes violation. The cheapest fix is to route that user's reads to the leader for a few seconds after they write, keyed on a cookie or session flag. The more precise fix is to return the write's LSN/timestamp to the client and have the read path either wait for a replica whose applied LSN ≥ that value or fall back to the leader. Related but distinct: monotonic reads, fixed by pinning a user to one replica so time never appears to run backwards." },
      { q: "Does replication scale writes?", a: "No — every replica applies every write, so write throughput is bounded by a single machine no matter how many replicas you add. Replication scales *reads* and buys availability. To scale writes you must partition (shard), which introduces cross-shard transactions and rebalancing. Saying this unprompted is often the whole point of the question: replication and sharding solve different problems and are usually needed together." },
      { q: "How do you measure and alarm on replica lag?", a: "Not by bytes — by time. Track the difference between the leader's current LSN/position and the replica's applied position, converted to seconds via the write rate, plus a heartbeat row the leader updates every second so you can measure lag directly even when writes are idle. Alarm on p99 lag against an explicit SLO (e.g. 'p99 < 1 s'), and on the *derivative* — lag growing steadily means the replica cannot keep up, which is a much more urgent signal than a one-off spike. Single-threaded apply is the classic cause; parallel/logical replication is the usual fix." }
    ]
  },

  code: [
    { lang: "sql", label: "Postgres: quorum semi-sync + lag monitoring", code: "-- Wait for ANY 1 of these standbys before acknowledging a commit.\n-- Latency = the FASTEST of the two, not the slowest. Losing one is fine.\nALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (standby_az2, standby_az3)';\nALTER SYSTEM SET synchronous_commit = 'on';   -- 'remote_apply' if the replica\n                                              -- must be READABLE at ack time\nSELECT pg_reload_conf();\n\n-- Lag, measured three ways. write < flush < replay: the gap between\n-- flush and replay is exactly \"received but not yet visible to readers\".\nSELECT application_name,\n       sync_state,\n       pg_wal_lsn_diff(pg_current_wal_lsn(), sent_lsn)   AS sent_bytes,\n       pg_wal_lsn_diff(pg_current_wal_lsn(), flush_lsn)  AS flush_bytes,\n       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_bytes,\n       replay_lag                                        AS replay_time\nFROM pg_stat_replication;\n\n-- Alarm on replay_lag (TIME, not bytes) and on its derivative." },
    { lang: "python", label: "Read-your-own-writes without pinning everything to the leader", code: "# The write returns the log position it committed at.\ndef create_comment(user_id, body):\n    lsn = db.leader.execute(\n        \"INSERT INTO comments (user_id, body) VALUES (%s, %s) RETURNING pg_current_wal_lsn()\",\n        user_id, body).scalar()\n    session[\"min_lsn\"] = lsn          # per-user causality token\n    session[\"min_lsn_until\"] = now() + 10\n    return lsn\n\ndef pick_read_connection(session):\n    need = session.get(\"min_lsn\")\n    if not need or now() > session[\"min_lsn_until\"]:\n        return db.replica_pool.any()          # no causality requirement\n\n    # Prefer a replica that has ALREADY applied the user's own write.\n    for r in db.replica_pool.all():\n        if r.applied_lsn() >= need:\n            return r\n    return db.leader                          # fall back rather than serve stale\n\n# Cheap alternative when you cannot plumb LSNs: after any write, set a cookie\n# for N seconds and route that user's reads to the leader while it is set.\n# N must exceed p99 replica lag, or you have just moved the bug." },
    { lang: "pseudo", label: "Failover with fencing tokens", code: "# Detection\nif now - last_heartbeat_from_leader > FAILOVER_TIMEOUT (15s):\n    request_failover()\n\n# Election: minimize data loss by choosing the most caught-up replica.\ncandidates = [r for r in replicas if r.reachable and r.healthy]\nwinner     = max(candidates, key=lambda r: r.applied_lsn)\n\n# CRITICAL: bump the epoch. This is the fencing token.\nepoch = consensus_store.compare_and_increment(\"leader_epoch\")   # atomic, majority\nconsensus_store.put(\"leader\", winner.id, epoch)\n\n# Every write the new leader issues to shared storage carries `epoch`.\n# Storage enforces:\n#     if request.epoch < storage.max_seen_epoch: REJECT\n#\n# So the OLD leader -- which may be alive, partitioned, and still convinced\n# it is in charge -- is refused the moment it tries to write. Without this,\n# you get two leaders and a permanently divergent history.\n\n# Rejoin: the old leader has writes the new history never had.\n#   pg_rewind / mysql GTID diff -> DISCARD them, then follow the new leader.\n#   Those writes were acknowledged to clients. Under async, that is the cost.\nold_leader.rewind_to(common_ancestor_lsn)\nold_leader.follow(winner)" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.7, maxFrames: 400 },

    params: [
      { key: "followers", label: "Followers", type: "int", min: 2, max: 5, default: 3 },
      { key: "mode", label: "Replication", type: "enum", options: ["async", "semi-sync (1 of n)", "sync (all)"], default: "async" },
      { key: "writes", label: "Writes", type: "int", min: 12, max: 40, default: 24 },
      { key: "seed", label: "Re-roll timing", type: "seed" }
    ],

    frames: function* (params, rng) {
      const NF = params.followers;
      const N = params.writes;
      const MODE = params.mode;
      const FSYNC = 1;                     // ms, leader's own durable write

      const followers = [];
      for (let i = 0; i < NF; i++) {
        followers.push({
          id: "f" + (i + 1),
          rtt: i === NF - 1 ? 68 + Math.floor(rng() * 40) : 1 + Math.floor(rng() * 3),  // last one is cross-region
          idx: 0, alive: true, region: i === NF - 1 ? "eu-west" : "us-east"
        });
      }

      let leaderIdx = 0, committed = 0, acked = 0;
      let leader = "L", failedOver = false, lostWrites = 0;
      const latencies = [];
      const readLog = [];

      const r1 = (x) => Math.round(x * 10) / 10;
      const ackWait = () => {
        const rtts = followers.filter((f) => f.alive).map((f) => f.rtt * 2).sort((a, b) => a - b);
        if (MODE === "async" || rtts.length === 0) return FSYNC;
        if (MODE === "sync (all)") return FSYNC + rtts[rtts.length - 1];
        return FSYNC + rtts[0];
      };

      const snap = (extra) => Object.assign({
        leader: leader, leaderIdx: leaderIdx, committed: committed, acked: acked,
        followers: followers.map((f) => ({ id: f.id, rtt: f.rtt, idx: f.idx, alive: f.alive, region: f.region })),
        mode: MODE, n: N, lost: lostWrites, failedOver: failedOver,
        avgLatency: latencies.length ? r1(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0,
        lastLatency: latencies.length ? latencies[latencies.length - 1] : 0,
        reads: readLog.slice(-4), event: "", active: -1
      }, extra || {});

      yield {
        label: `One leader, ${NF} followers (${followers[NF - 1].id} is cross-region at ${followers[NF - 1].rtt} ms). Mode = ${MODE}. Watch when the leader is allowed to say "committed".`,
        phase: "init",
        state: snap()
      };

      const killAt = Math.floor(N * 0.6);

      for (let w = 1; w <= N; w++) {
        // --- leader appends -----------------------------------------------------
        leaderIdx += 1;
        const wait = ackWait();
        latencies.push(wait);
        acked += 1;

        // --- followers replicate, each at its own speed ------------------------
        for (const f of followers) {
          if (!f.alive) continue;
          const speed = f.rtt > 20 ? (rng() < 0.55 ? 1 : 0) : (rng() < 0.9 ? 1 : 0);
          f.idx = Math.min(leaderIdx, f.idx + speed);
        }
        // commit point depends on the durability policy
        const sorted = followers.filter((f) => f.alive).map((f) => f.idx).sort((a, b) => b - a);
        if (MODE === "async") committed = leaderIdx;
        else if (MODE === "sync (all)") committed = Math.min(leaderIdx, sorted.length ? sorted[sorted.length - 1] : 0);
        else committed = Math.min(leaderIdx, sorted.length ? sorted[0] : 0);

        const maxLag = Math.max.apply(null, followers.map((f) => leaderIdx - f.idx));
        yield {
          label: `Write #${w} appended at index ${leaderIdx}. ${MODE === "async"
            ? `Leader acks after its own fsync — ${wait} ms — without waiting for anyone. Max follower lag right now: ${maxLag} entries.`
            : MODE === "sync (all)"
              ? `Leader must wait for ALL followers including the ${followers[NF - 1].rtt} ms cross-region one: ${wait} ms per write. One slow replica taxes every single write.`
              : `Leader waits for the fastest follower only: ${wait} ms. Durable on 2 machines, and the slow cross-region replica cannot stall writes.`}`,
          phase: "write",
          state: snap({ event: "write", active: -1 })
        };

        // --- a read hits a random follower ------------------------------------
        if (w % 3 === 0) {
          const alive = followers.filter((f) => f.alive);
          const f = alive[Math.floor(rng() * alive.length)];
          const staleBy = leaderIdx - f.idx;
          readLog.push({ id: f.id, staleBy: staleBy });
          yield {
            label: staleBy > 0
              ? `Read routed to ${f.id}: it has applied index ${f.idx}, the leader is at ${leaderIdx} — a STALE READ, ${staleBy} write${staleBy === 1 ? "" : "s"} behind. If the same user just wrote, this is a read-your-own-writes violation.`
              : `Read routed to ${f.id}: fully caught up at index ${f.idx}. Fresh — but you got lucky, not guaranteed. "Eventually consistent" is not an SLO; p99 lag is.`,
            phase: "read",
            focus: [followers.indexOf(f)],
            state: snap({ event: "read", active: followers.indexOf(f) })
          };
        }

        // --- the leader dies -----------------------------------------------------
        if (w === killAt && !failedOver) {
          yield {
            label: `The leader dies at index ${leaderIdx}. It acknowledged ${acked} writes to clients. The question is how many of those actually exist anywhere else.`,
            phase: "fault",
            state: snap({ event: "leader-down" })
          };

          let best = followers[0];
          for (const f of followers) if (f.alive && f.idx > best.idx) best = f;
          lostWrites = MODE === "async" ? Math.max(0, leaderIdx - best.idx) : Math.max(0, committed - best.idx);

          yield {
            label: `Election: ${best.id} has the highest applied index (${best.idx}) so it is promoted — choosing the most caught-up replica is what minimizes loss. ${lostWrites > 0
              ? `${lostWrites} acknowledged write${lostWrites === 1 ? "" : "s"} existed ONLY on the dead leader and are now gone. Clients were told "committed".`
              : `Every acknowledged write survives: ${MODE} guaranteed it was on a second machine before the ack.`}`,
            phase: "failover",
            focus: [followers.indexOf(best)],
            state: snap({ event: "promote", active: followers.indexOf(best), lost: lostWrites })
          };

          yield {
            label: `New leader ${best.id} takes epoch 2. Every write it makes carries that fencing token, so if the old leader is merely partitioned and comes back believing it is still in charge, storage rejects it — that is what stops split brain.`,
            phase: "failover",
            state: snap({ event: "fence", active: followers.indexOf(best), lost: lostWrites })
          };

          // reshape the cluster around the new leader
          leader = best.id;
          leaderIdx = best.idx;
          committed = best.idx;
          failedOver = true;
          const others = followers.filter((f) => f !== best);
          followers.length = 0;
          for (const o of others) { o.idx = Math.min(o.idx, leaderIdx); followers.push(o); }
          followers.push({ id: "L(old)", rtt: 2, idx: 0, alive: false, region: "us-east" });
        }
      }

      yield {
        label: `Done. ${acked} writes acknowledged, ${lostWrites} lost at failover, average write latency ${latencies.length ? r1(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0} ms under ${MODE}. ` +
          (MODE === "async"
            ? `Async is fast and silently lossy — the trade you are usually making without realizing it.`
            : MODE === "sync (all)"
              ? `Zero loss, but every write paid for the slowest replica. One sick follower would have stopped writes entirely.`
              : `Semi-sync: zero acknowledged loss for a single failure, at roughly one same-AZ round trip. This is the default worth defending.`),
        phase: "done",
        state: snap({ event: "done" })
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

      const maxIdx = Math.max(1, s.leaderIdx, ...s.followers.map((f) => f.idx));
      const cellW = Math.min(15, (W - 300) / Math.max(1, maxIdx));
      const logX = 150;

      add(txt(16, 20, `replication: ${s.mode}`, { fill: C.text, size: 13, bold: true, mono: false }));
      add(txt(W - 16, 20, `avg write latency ${s.avgLatency} ms`, { fill: C.text, size: 12, anchor: "end" }));
      add(txt(W - 16, 38, `acked ${s.acked}   lost at failover ${s.lost}`, { fill: s.lost > 0 ? C.danger : C.muted, size: 11, anchor: "end" }));

      // ---- leader row ---------------------------------------------------------
      const ly = 62;
      add(h("rect", { x: 16, y: ly - 16, width: 124, height: 34, rx: 6, fill: C.surface, stroke: C.viz7, "stroke-width": 2 }));
      add(txt(24, ly + 5, `LEADER ${s.leader}`, { fill: C.text, size: 12, bold: true }));
      for (let i = 0; i < s.leaderIdx; i++) {
        const committedEntry = i < s.committed;
        add(h("rect", {
          x: logX + i * cellW, y: ly - 11, width: Math.max(2, cellW - 2), height: 24, rx: 2,
          fill: committedEntry ? C.viz6 : C.viz4
        }));
      }
      add(txt(logX, ly - 18, `log — ${s.committed} committed (green), ${Math.max(0, s.leaderIdx - s.committed)} not yet durable elsewhere (amber)`, { fill: C.muted, size: 9 }));

      // ---- followers -----------------------------------------------------------
      const fy0 = ly + 52;
      const rowH = Math.min(56, (H - fy0 - 84) / Math.max(1, s.followers.length));
      for (let i = 0; i < s.followers.length; i++) {
        const f = s.followers[i];
        const y = fy0 + i * rowH;
        const lag = Math.max(0, s.leaderIdx - f.idx);
        const active = s.active === i;

        add(h("rect", {
          x: 16, y: y - 15, width: 124, height: 32, rx: 6,
          fill: C.surface, stroke: !f.alive ? C.danger : active ? C.viz1 : C.border, "stroke-width": active || !f.alive ? 2 : 1
        }));
        add(h("circle", { cx: 30, cy: y, r: 5, fill: !f.alive ? C.danger : lag === 0 ? C.ok : lag > 3 ? C.warn : C.viz3 }));
        add(txt(42, y + 4, f.id, { fill: f.alive ? C.text : C.muted, size: 12, bold: true }));
        add(txt(42, y + 15, `${f.region} · ${f.rtt}ms`, { fill: C.muted, size: 8 }));

        // replication link
        add(h("path", {
          d: `M 80 ${ly + 18} C 80 ${(ly + y) / 2}, 80 ${(ly + y) / 2}, 80 ${y - 16}`,
          fill: "none", stroke: f.alive ? (f.rtt > 20 ? C.viz2 : C.viz3) : C.muted,
          "stroke-width": 1.5, "stroke-dasharray": f.alive ? null : "3 3"
        }));

        // the follower's own log
        for (let k = 0; k < f.idx; k++) {
          add(h("rect", { x: logX + k * cellW, y: y - 10, width: Math.max(2, cellW - 2), height: 20, rx: 2, fill: f.alive ? C.viz3 : C.muted, opacity: f.alive ? 1 : 0.4 }));
        }
        // the lag gap, drawn as the hole it is
        if (lag > 0 && f.alive) {
          add(h("rect", {
            x: logX + f.idx * cellW, y: y - 10, width: Math.max(2, lag * cellW - 2), height: 20, rx: 2,
            fill: C.danger, opacity: 0.22
          }));
          add(txt(logX + f.idx * cellW + lag * cellW + 8, y + 4, `lag ${lag}`, { fill: lag > 3 ? C.warn : C.muted, size: 10 }));
        }
      }

      // ---- recent reads --------------------------------------------------------
      const ry = H - 56;
      add(txt(16, ry, "recent replica reads:", { fill: C.muted, size: 10 }));
      for (let i = 0; i < s.reads.length; i++) {
        const r = s.reads[i];
        const x = 132 + i * 116;
        add(h("rect", { x: x, y: ry - 13, width: 108, height: 20, rx: 4, fill: C.surface2, stroke: r.staleBy > 0 ? C.warn : C.ok }));
        add(txt(x + 8, ry + 1, r.staleBy > 0 ? `${r.id}: stale −${r.staleBy}` : `${r.id}: fresh`, { fill: r.staleBy > 0 ? C.warn : C.ok, size: 10 }));
      }

      if (s.event === "promote" || s.event === "fence") {
        add(h("rect", { x: W / 2 - 150, y: H / 2 - 26, width: 300, height: 52, rx: 8, fill: C.surface2, stroke: s.lost > 0 ? C.danger : C.ok, "stroke-width": 2 }));
        add(txt(W / 2, H / 2 - 4, s.event === "promote" ? "FAILOVER — promoting most-caught-up replica" : "FENCING TOKEN epoch 2 issued", { fill: C.text, size: 12, anchor: "middle" }));
        add(txt(W / 2, H / 2 + 14, s.lost > 0 ? `${s.lost} acknowledged writes lost` : "0 acknowledged writes lost", { fill: s.lost > 0 ? C.danger : C.ok, size: 12, anchor: "middle" }));
      }
    }
  },

  drill: {
    cards: [
      { q: "What are the three reasons to replicate, and which one does replication NOT provide?", a: "Durability, availability, and read scale. It does not scale writes — every replica applies every write, so write throughput stays bounded by one machine. Sharding is what scales writes.", tags: ["concept"] },
      { q: "What is silently lost under async replication?", a: "Every write the leader acknowledged but hadn't shipped when it died — bounded by the replication lag. 200 ms of lag at 5,000 writes/s is ~1,000 acknowledged writes gone.", tags: ["durability"] },
      { q: "Why is semi-sync (1 of n) the usual right answer?", a: "Latency is the *fastest* replica's round trip rather than the slowest, so ~1 ms extra in-region; you get zero acknowledged data loss for a single node failure; and one sick replica cannot stall writes the way sync-to-all does.", tags: ["trade-off"] },
      { q: "Rough numbers: local fsync, same-AZ RTT, cross-region RTT.", a: "fsync ~0.5–1 ms, same-AZ ~0.5 ms, cross-AZ ~1–2 ms, cross-region ~70–150 ms. Which is why in-region replication can be synchronous and cross-region essentially cannot.", tags: ["numbers"] },
      { q: "What is a fencing token and what does it prevent?", a: "A monotonically increasing epoch issued with each leadership term. Every write to shared storage carries it, and storage rejects older epochs — so a partitioned old leader that returns is refused. It prevents split brain.", tags: ["failover"] },
      { q: "Name the four replica-lag anomalies.", a: "Read-your-own-writes (your write vanishes), monotonic reads (time goes backwards between reads), consistent prefix (see the answer before the question), and general stale reads. Fixes: leader-pinning after write, sticky replica, causal ordering, and an explicit lag SLO.", tags: ["consistency"] },
      { q: "How do you implement read-your-own-writes precisely?", a: "Return the write's LSN to the client, then either route reads to a replica whose applied LSN ≥ that value or fall back to the leader. The cheap version is a short-lived cookie that pins the user's reads to the leader — with a window longer than p99 lag.", tags: ["consistency"] },
      { q: "How should you measure replica lag?", a: "In time, not bytes: a heartbeat row updated by the leader every second gives lag directly even when idle. Alarm on p99 against an SLO and on the derivative — steadily growing lag means the replica cannot keep up, usually single-threaded apply.", tags: ["operations"] },
      { q: "Why is failover itself a common cause of outages?", a: "Detection timeouts either flap on GC pauses or leave you down for 30 s; the promoted replica has cold caches; every client reconnects simultaneously; and if the old leader returns without fencing you get divergent history. The failover is often the incident.", tags: ["failover"] }
    ],
    sixtySecond: [
      "Explain sync vs async vs semi-synchronous replication, with latency numbers, and say which you'd ship.",
      "Explain what can go wrong during a leader failover and how fencing tokens prevent the worst case."
    ]
  }
};
