export default {
  id: "replication",
  track: "sysdesign",
  title: "DB Replication & Failover",
  difficulty: 2,
  minutes: 16,
  tags: ["replication", "failover", "consistency", "replica-lag", "durability"],

  explainer: [
    { type: "p", text: "Replication just means keeping more than one copy of your data, usually on separate machines. It sounds simple, but people constantly blur together three genuinely different reasons for doing it: **durability** (surviving the loss of one disk, so your data literally isn't gone), **availability** (surviving the loss of one whole machine, so the service keeps running), and **read scale** (spreading read traffic across several copies so no single machine has to answer every query). These three goals pull the design in different directions, and almost every hard question in this topic really boils down to: *which of the three am I buying with this choice, and what am I paying for it?*" },

    { type: "h3", text: "The mechanism underneath all of it" },
    { type: "p", text: "In the most common setup, one server — the **leader** (sometimes called the primary or master) — is the only one that accepts writes. It appends every write to a sequential log (its **WAL**, or write-ahead log — a durable, append-only record of every change, covered in its own lesson — sometimes called a \"binlog\" in MySQL), and then ships that log over to the other servers, the **followers** (or replicas), which replay it to reconstruct the same state. Nearly everything else discussed in this lesson — synchronous versus asynchronous replication, how failover works, how reads get routed — is really just a policy layered on top of that one simple pipe. The detail that matters most is this: **the leader gets to choose whether it tells the client \"done\" before, during, or after the followers actually have that write.** That single choice is essentially the whole lesson." },

    { type: "h3", text: "Sync vs async vs semi-sync — when does the leader say \"done\"?" },
    { type: "list", items: [
      "**Asynchronous replication** — the leader tells the client the write succeeded as soon as its *own* copy of the log is durable, without waiting for any follower at all. Write latency is just one local **fsync** (the operating system call that guarantees data is physically written to disk, taking roughly 1 ms). But if the leader dies before it manages to ship that write to any follower, the write the client was told succeeded is simply **gone**. This is the default setting in both MySQL and Postgres, and most people running those databases don't realize they've silently accepted this trade-off.",
      "**Synchronous replication (to all followers)** — the leader waits until every single follower has confirmed the write before telling the client it succeeded. This guarantees zero data loss, but write latency becomes however long the *slowest* follower's round trip takes, and if even one follower is slow or offline, *every write to the whole system* stalls. Almost nobody actually runs this in production.",
      "**Semi-synchronous / quorum replication** — the leader waits for just *k* out of *n* followers to confirm (commonly 1, or a majority) before acknowledging. Latency then depends on the *k-th fastest* replica rather than the slowest one, which is dramatically better, while you still survive losing up to `n − k` replicas without losing any acknowledged write. **This is generally the right answer** to reach for in an interview: Postgres's `synchronous_standby_names` setting with `ANY 1`, MySQL's semi-sync replication mode, or a consensus-based system that gives you this property automatically by construction."
    ]},
    { type: "p", text: "Some concrete numbers to ground this: a local fsync takes roughly 0.5-1 ms; a round trip to another machine in the same AZ (Availability Zone — a physically separate data center within one cloud region) takes roughly 0.5 ms; a round trip across AZs takes roughly 1-2 ms; and a round trip across regions (say, US to Europe) takes roughly 70 ms. So synchronous replication *within one region* roughly doubles write latency — a small, cheap insurance premium. Synchronous replication *across regions*, by contrast, multiplies write latency by something like 70×, which is exactly why cross-region replicas are almost always run asynchronously in practice, and why building a system where two different regions both accept writes at once (\"active-active\") is a fundamentally different and much harder design than everything discussed here." },

    { type: "callout", tone: "pitfall", text: "By default, MySQL's \"semi-sync\" mode means the follower has *received* the write event over the network, not that it has *applied* it to its own copy of the data yet. Received-but-not-yet-applied is still enough to be safe during a failover (the data physically exists somewhere else), but a freshly promoted replica may still need a moment to catch up before it can correctly serve reads. Know precisely which of the two guarantees your particular configuration flag is actually giving you." },

    { type: "h3", text: "Replica lag, and the four odd behaviors it can create" },
    { type: "list", items: [
      "**Read-your-own-writes** — a user posts a comment, gets redirected to view the page, but that read happens to hit a replica that hasn't caught up yet, so their own comment appears to have vanished. Fix: route that specific user's reads to the leader for a short window right after they write, or pin their read to a replica whose applied position (its **LSN**, or Log Sequence Number — a number identifying exactly how far into the log a replica has processed) is at least as recent as the LSN their write returned.",
      "**Monotonic reads** — two reads in a row from the same user happen to land on two different replicas with different amounts of lag, so the second read appears to go *backwards in time* relative to the first. Fix: sticky routing, meaning a given user always reads from the same replica for some period, so time can't visibly run backwards for them.",
      "**Consistent prefix** — under partitioned (sharded) replication, it's possible to see an answer before you've seen the corresponding question, because causally related writes landed on different partitions that replicate independently. Fix: preserve causal ordering explicitly, or keep causally related data together in one partition.",
      "**Stale reads, in general** — the fix here is simply to quantify them rather than wave your hands. \"p99 replica lag is 200 ms\" (meaning 99% of the time, a replica is no more than 200 ms behind the leader) is a real, measurable service-level objective (SLO). \"Eventually consistent\" on its own is not — it's a shrug dressed up as an answer."
    ]},

    { type: "h3", text: "Failover — where the real outages actually come from" },
    { type: "list", items: [
      "**Detection** — usually implemented as a timeout, typically somewhere in the 10-30 second range. Too short, and a routine GC pause (a garbage collection pause — a brief stop-the-world memory-cleanup pause some languages like Java or Go trigger) can trigger an entirely needless failover. Too long, and the system is genuinely down for the full duration of a real failure. There's no universally correct value here — only a trade-off that someone has to explicitly own.",
      "**Election** — the system should automatically pick whichever surviving replica has applied the most of the log (the highest LSN), because that minimizes how much acknowledged data ends up lost. This should be handled by an automated, consensus-backed process (see the Raft lesson); hand-rolled failover scripts are exactly how real split-brain incidents happen.",
      "**Data loss** — under asynchronous replication, anything the old leader had acknowledged to a client but never managed to ship to a follower before dying is lost outright. If that old leader later comes back online, it must be **rewound** — forcibly reset back to match the new leader's history, discarding those un-shipped writes entirely. GitHub's well-documented 2018 outage is the canonical real-world case study of this going wrong.",
      "**Split brain** — the old leader didn't actually die, it was merely cut off from the network (\"partitioned\"), and it's still sitting there happily accepting writes from whoever can still reach it. Now you have two leaders and two diverging histories of the data. Mitigations include **fencing tokens** (a monotonically increasing number, or \"epoch,\" assigned to each new leadership term; underlying storage rejects any write carrying an older epoch than one it's already seen), **STONITH** (\"Shoot The Other Node In The Head\" — forcibly powering off the suspected-dead node to be certain), or requiring a leader to continuously hold a majority-backed lease to keep acting as leader at all.",
      "**The thundering-herd effect** — right after a new leader is promoted, every client reconnects at once, and the newly promoted replica's local caches are cold (empty), so it briefly has to do far more work per request than the old leader did. Failover, ironically, often *causes* a burst of exactly the overload it was meant to protect against."
    ]},

    { type: "callout", tone: "tip", text: "The sentence worth saying out loud in an interview: \"I'd run semi-synchronous replication to at least one replica in another AZ, asynchronous replication across regions, automatic failover using fencing tokens, and I'd track replica lag as a first-class SLO. I'm explicitly accepting up to one replica's worth of unavailability, in exchange for zero acknowledged data loss.\"" },

    { type: "h3", text: "Multi-leader and leaderless — reach for these only when you must" },
    { type: "p", text: "**Multi-leader replication** — where, say, two different regions both independently accept writes — removes the cross-region write-latency penalty and gives you resilience to a whole region going offline, at the cost of **write conflicts that someone has to resolve**: last-write-wins silently throws away one of two conflicting writes, CRDTs (Conflict-free Replicated Data Types — special data structures engineered so concurrent updates merge automatically and correctly) are genuinely correct but constrain what kind of data model you can use, and manual application-level merge logic is real, ongoing engineering work. **Leaderless replication** (used by Dynamo and Cassandra) replaces the single-leader concept entirely with a system of quorums — covered in the quorums lesson. Both of these designs are proposed far more often in interviews than they're actually the right answer in production." }
  ],

  glossary: [
    { term: "Leader / follower (primary / replica)", plain: "In single-leader replication, the leader is the one server that accepts writes; followers are the other servers that copy and replay the leader's changes to stay in sync." },
    { term: "WAL / binlog", plain: "A durable, append-only, in-order record of every change made to the data, written before the change itself is applied — the mechanism that both crash recovery and replication are built on top of. MySQL calls its version the 'binlog.'" },
    { term: "fsync", plain: "An operating system call that forces data to actually be physically written to disk (rather than just sitting in a faster, volatile memory cache), which is what makes a write truly durable." },
    { term: "Synchronous / asynchronous replication", plain: "Synchronous means the leader waits for a follower to confirm a write before telling the client it succeeded. Asynchronous means the leader tells the client 'done' immediately, without waiting, which is faster but risks losing that write if the leader then fails." },
    { term: "Semi-sync / quorum replication", plain: "A middle ground where the leader waits for only some (not all, not zero) of its followers to confirm before acknowledging a write — trading a small amount of latency for a meaningful durability guarantee." },
    { term: "LSN (Log Sequence Number)", plain: "A number that identifies a specific position in the write-ahead log, used to describe exactly how far a replica has caught up, or exactly which point in time a query needs to see." },
    { term: "Replica lag", plain: "How far behind a follower is from the leader, usually measured in time (seconds) rather than in bytes, since time is what actually matters to users." },
    { term: "Failover", plain: "The process of detecting that a leader has failed and promoting one of its followers to become the new leader so the system can keep accepting writes." },
    { term: "Fencing token", plain: "A monotonically increasing number assigned to each new leadership term; storage systems reject any write carrying an older token, which is what stops a stale, partitioned-away former leader from corrupting data if it wakes back up." },
    { term: "Split brain", plain: "A failure scenario where two nodes both believe they are the leader at the same time — usually because a network partition cut one off rather than actually killing it — leading to two diverging, conflicting histories of the data." },
    { term: "GC pause (garbage collection pause)", plain: "A brief pause some programming languages (Java, Go, etc.) trigger to reclaim unused memory, during which the program does no useful work — long enough, occasionally, to be mistaken for a crash by a failure detector." },
    { term: "CRDT (Conflict-free Replicated Data Type)", plain: "A specially designed data structure where concurrent, independent updates from different replicas can always be merged back together automatically and correctly, with no conflicts requiring manual resolution." },
    { term: "AZ (Availability Zone)", plain: "A physically separate data center within one cloud region, built so a failure in one (power outage, network cut) doesn't take down the others." }
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
