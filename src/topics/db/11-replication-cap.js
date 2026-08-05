export default {
  id: "replication-cap",
  track: "db",
  title: "Replication & CAP",
  difficulty: 2,
  minutes: 17,
  tags: ["replication", "cap-theorem", "consistency", "availability", "distributed-systems"],

  explainer: [
    { type: "p", text: "In a distributed database, your data isn't stored on just one machine — it's copied across several machines, called replicas, so the system can survive one of them failing and can serve reads faster by spreading them out. But copying data across multiple machines over a network introduces a new problem that a single machine never has: what happens when the network connection between those machines breaks, even temporarily? This is called a **network partition** — a situation where some machines can no longer talk to others, even though each individual machine is still running fine on its own. The **CAP theorem** is a well-known result describing exactly what a distributed system is forced to choose between the moment a partition actually happens: **C**onsistency, meaning every read anywhere in the system sees the most recent acknowledged write, or **A**vailability, meaning every request still gets *some* response rather than an error or a hang. During an actual partition, you genuinely cannot have both — you can only choose which one you're willing to give up. Outside of a partition, when the network is healthy, most systems can give you both consistency and availability just fine; CAP is specifically a statement about what happens *during* the moment the network is actually broken." },
    { type: "h3", text: "Leader-based replication — the setup most systems actually use" },
    { type: "p", text: "In this common design, one machine is designated the leader and is the only one that accepts writes; the other machines, called followers, continuously copy the leader's stream of changes (its log) to stay up to date. Two settings determine how a system built this way actually behaves under CAP: how many followers have to confirm they've received a write before that write is considered officially committed (called the **quorum**, meaning the minimum number of replicas that must agree), and whether the leader waits for that confirmation before telling the client the write succeeded (**synchronous** replication) or tells the client immediately and lets the copying happen in the background (**asynchronous** replication)." },
    { type: "list", items: [
      "**A CP system** (one that favors Consistency over Availability during a partition — examples include databases built on consensus protocols like Raft or Paxos, or Postgres configured with `synchronous_commit` plus `synchronous_standby_names`): a write only gets acknowledged to the client once a *majority* of replicas have durably stored it. If the leader loses contact with enough replicas that it can no longer reach that majority, it simply refuses to accept new writes at all — the system becomes temporarily unavailable rather than risk two conflicting values existing anywhere.",
      "**An AP system** (favoring Availability over Consistency during a partition — examples include Amazon's Dynamo, Cassandra configured with a low consistency level like `ONE`, or MySQL with asynchronous replicas): a write is acknowledged the moment just *one* node has it, and copying it to the rest happens in the background afterward. Every machine that's still reachable keeps accepting writes throughout the partition, so the system stays fully available — but the two separated sides of the partition can now independently accept *different* writes to the same piece of data, meaning their data has **diverged** (drifted apart into disagreeing versions)."
    ]},
    { type: "h3", text: "What happens once the network partition heals" },
    { type: "p", text: "A CP system has nothing to reconcile once connectivity comes back, because it never let the two sides disagree with each other in the first place — healing just means the followers that were cut off catch up on whatever log entries they missed. An AP system, on the other hand, may now be holding two different, conflicting histories for the same piece of data, and has to run a process called **anti-entropy** to fix that: it compares the different versions (using either a scheme called vector clocks, which can detect true concurrent edits, or something simpler like a plain timestamp for a strategy called last-write-wins) and merges them. That merge either picks one version as the winner and silently throws away the other, or it surfaces the conflict for a human or the application to resolve manually (a famous real example: how Amazon historically merged two versions of the same shopping cart). A more advanced alternative is a CRDT (Conflict-free Replicated Data Type — a data structure specifically designed so that no matter what order or combination its updates get merged in, every replica always converges to the same final result with nothing lost)." },
    { type: "callout", tone: "pitfall", text: "The reassuring-sounding term \"eventually consistent\" hides a real cost: reconciling with last-write-wins silently drops data. If two different users concurrently update the very same row on opposite sides of a partition, once the two timestamps are compared, one of those two updates simply vanishes — there's no error message, no conflict alert, just a quiet, permanent loss. Anything where losing an update is unacceptable — money, an inventory count going down — genuinely needs either CP-style guarantees, or a merge function (like a CRDT) specifically designed for that exact kind of data so nothing gets silently discarded." },
    { type: "h3", text: "PACELC: CAP only tells half the story" },
    { type: "p", text: "CAP only describes what a system does **during a Partition** (the 'P'): it has to choose between Availability and Consistency. A follow-up framework called **PACELC** adds the missing other half: **Else** — meaning even when there's no partition happening at all, and the network is perfectly healthy — a system still has to trade off **Latency** (how fast it responds) against **Consistency**, simply because waiting for a majority of replicas to acknowledge a write is always going to be slower than a single machine acknowledging it locally and moving on. So a real system is more precisely described as either PA/EL (available during a partition, and low-latency the rest of the time — this describes Dynamo-style systems) or PC/EC (consistent during a partition, and willing to accept slower responses even when the network is completely fine, in order to keep that consistency guarantee — this describes a majority-quorum system)." },
    { type: "callout", tone: "tip", text: "In an interview, avoid the shorthand \"CAP means you pick 2 out of 3\" — it's a famously imprecise way to put it, because partition tolerance isn't something you get to opt out of in a real distributed system; networks really do partition sometimes, so you always effectively have 'P', and the actual choice is only between C and A, and only while a partition is genuinely happening. A stronger answer sounds like: \"during a partition, this particular system favors consistency over availability, and here's the actual mechanism that causes that — quorum size, and synchronous rather than asynchronous replication.\"" },
    { type: "h3", text: "Consequences that show up specifically on the read side" },
    { type: "list", items: [
      "**Reading from a follower instead of the leader** takes load off the leader, but introduces the possibility of a **stale read** — the follower might not have received the very latest committed write yet, a gap known as replication lag.",
      "**Read-your-own-writes** is a specific, commonly promised guarantee where a user immediately sees the effect of their own write, even if other users temporarily wouldn't yet — typically implemented by routing that particular user's reads to the leader (or to a follower confirmed to be fully caught up) right after they've written something, while other users' reads can go anywhere.",
      "**Quorum reads and writes**: if a write requires acknowledgment from `W` replicas, and a read checks `R` replicas, then choosing `R + W` to be greater than the total replica count `N` mathematically guarantees that the set of replicas you read from and the set you wrote to must overlap by at least one replica — meaning that read is guaranteed to see the most recent write. This gives you a tunable middle ground between pure CP and pure AP behavior, adjustable per individual operation in systems like Cassandra."
    ]}
  ],

  glossary: [
    { term: "replica", plain: "One copy of the data, stored on a separate machine, as part of a system that keeps multiple copies for reliability and speed." },
    { term: "network partition", plain: "A situation where some machines in a distributed system can no longer communicate with others over the network, even though each machine individually is still running." },
    { term: "CAP theorem", plain: "CAP stands for Consistency, Availability, and Partition tolerance. The theorem says that during an actual network partition, a distributed system must choose between Consistency (every read sees the latest write) and Availability (every request gets a response) — it cannot fully guarantee both at once." },
    { term: "consistency (in CAP)", plain: "The guarantee that every read, from any replica, reflects the most recently acknowledged write." },
    { term: "availability (in CAP)", plain: "The guarantee that every request receives some response, rather than an error or an indefinite hang." },
    { term: "leader / follower replication", plain: "A setup where one designated machine (the leader) accepts all writes, and other machines (followers) copy its stream of changes to stay in sync." },
    { term: "quorum", plain: "The minimum number of replicas that must agree to or acknowledge an operation before it's considered successful." },
    { term: "synchronous vs asynchronous replication", plain: "Synchronous means the leader waits for a follower's confirmation before telling the client a write succeeded; asynchronous means the leader confirms immediately and copies the data to followers afterward." },
    { term: "diverge / divergence", plain: "When two copies of the same data end up disagreeing with each other because they each independently accepted different writes." },
    { term: "anti-entropy", plain: "The process of comparing and reconciling divergent copies of data after a network partition heals." },
    { term: "vector clock", plain: "A bookkeeping scheme that lets a system detect whether two versions of data were changed independently at the same time (truly concurrent), rather than one simply happening after the other." },
    { term: "last-write-wins (LWW)", plain: "A simple conflict-resolution strategy that keeps whichever update has the later timestamp and discards the other one." },
    { term: "CRDT (Conflict-free Replicated Data Type)", plain: "A data structure specifically designed so that merging any two versions of it, in any order, always produces the same consistent result with nothing lost." },
    { term: "PACELC", plain: "An extension of the CAP theorem noting that even without a network partition, a system still has to trade off Latency (how fast it responds) against Consistency (how up to date the answer is). A system is described by two choices: what it favors during a Partition (Availability or Consistency), and what it favors the rest of the time, Else (Latency or Consistency) — for example, 'available-during-partition, low-latency-otherwise'." },
    { term: "stale read", plain: "A read that returns an out-of-date value because it came from a replica that hasn't yet received the most recent write." },
    { term: "replication lag", plain: "The delay between when a write happens on the leader and when it has actually been copied to a given follower." },
    { term: "read-your-own-writes", plain: "A guarantee that a user will always see the effect of their own most recent write, even if other users might briefly see an older version." }
  ],

  complexity: {
    rows: [
      { operation: "Sync (majority-quorum) write", time: "1 RTT to slowest quorum member", space: "O(N) copies", note: "CP: refuses writes if quorum unreachable" },
      { operation: "Async (fire-and-forget) write", time: "1 RTT to leader only", space: "O(N) copies, eventually", note: "AP: available, but followers can lag or diverge" },
      { operation: "Quorum read (R + W > N)", time: "1 RTT to R replicas", space: "O(1) extra", note: "guaranteed to see the latest acked write" },
      { operation: "Anti-entropy reconciliation", time: "O(divergent keys)", space: "O(conflicting versions)", note: "compares versions/vector clocks, merges or flags conflicts" },
      { operation: "Leader failover (CP, consensus-based)", time: "O(election timeout)", space: "—", note: "unavailable for writes until a new leader wins a majority" }
    ]
  },

  interview: {
    whyAsked: "CAP is a compact way to test whether you understand that distributed trade-offs are forced by physics (a partition WILL happen), not a design taste. The signal is picking a concrete mechanism (quorum size, sync vs async) rather than reciting \"consistency vs availability\", and being able to say what actually happens to a client's request during a partition on each side.",
    followUps: [
      { q: "During a network partition, what does a CP system actually do differently from an AP one?", a: "CP: the side that cannot reach a write quorum (typically the minority, or the whole system if quorum requires the leader) refuses writes and returns an error/timeout — unavailable but never inconsistent. AP: every reachable replica keeps accepting writes independently, so both sides stay available but can now hold different values for the same key, to be reconciled later." },
      { q: "Why is 'CAP means pick 2 of 3' considered a bad way to describe it?", a: "Partition tolerance isn't a choice for a real distributed system — the network WILL partition eventually, so you always have P. The actual choice, and only while a partition is ongoing, is between C and A. Outside a partition, plenty of systems give you both. The precise claim is: 'during a partition, this system favors X over Y, implemented by Z (quorum size / sync replication).'" },
      { q: "What is PACELC and why does it matter beyond CAP?", a: "It extends the trade-off to the normal, non-partitioned case: even with no partition (Else), a system trades Latency against Consistency, because waiting for a quorum ack before responding is slower than acknowledging locally. A store is really PA/EL or PC/EC, not just 'CP' or 'AP' — the second half explains why a 'consistent' system is still slower on the happy path." },
      { q: "How does an AP system reconcile diverged writes after a partition heals?", a: "Anti-entropy: compare version metadata (a simple last-write-wins timestamp, or a vector clock that can detect true concurrency) and merge — either deterministically pick a winner (silently discarding the other write) or surface both versions as a conflict for the application to resolve. CRDTs sidestep this by designing the merge function so any order of application converges to the same result with no data loss." },
      { q: "What is the risk hiding inside last-write-wins reconciliation?", a: "Silent data loss: if two replicas accepted different writes to the same key during a partition, LWW keeps the one with the later timestamp and discards the other with no error raised anywhere. That's acceptable for a view counter, not for money or inventory — those need CP semantics or a domain-specific CRDT (e.g. a G-counter for a monotonic count)." },
      { q: "What do R + W > N quorum reads/writes buy you, and what do they cost?", a: "If a write requires acks from W replicas and a read queries R replicas out of N total, R + W > N guarantees the read set and the write set overlap by at least one replica, so the read is guaranteed to see the most recent acknowledged write — tunable consistency without a single fixed leader. The cost is latency: every read and write now waits on multiple replicas instead of one, and you still must define behavior for the case R + W <= N deliberately, if you ever relax it for availability." }
    ]
  },

  code: [
    { lang: "sql", label: "Postgres: choosing CP or AP per replica set", code: "-- CP: a write is not acknowledged to the client until at least one\n-- named standby has confirmed it durably -- quorum of 1-of-N here,\n-- raise ANY N to require a true majority for stronger guarantees.\nALTER SYSTEM SET synchronous_standby_names = 'ANY 1 (replica_a, replica_b)';\nALTER SYSTEM SET synchronous_commit = 'on';\n\n-- If every synchronous standby becomes unreachable, writes on the\n-- primary BLOCK (unavailable) rather than silently going async --\n-- that block is CAP's 'C over A' happening in front of you.\n\n-- AP: default async streaming replication -- the primary acknowledges\n-- immediately and ships WAL to standbys in the background.\nALTER SYSTEM SET synchronous_commit = 'off';\n-- Standbys can now lag; a failover can lose the last few\n-- unshipped transactions -- the classic AP trade-off." },
    { lang: "python", label: "Quorum arithmetic and anti-entropy merge", code: "def has_quorum(acked: int, total: int) -> bool:\n    return acked >= total // 2 + 1          # majority\n\ndef read_write_overlap(r: int, w: int, n: int) -> bool:\n    return r + w > n                          # guarantees a fresh read\n\ndef reconcile_lww(version_a, version_b):\n    # version = (timestamp, node_id, value); node_id breaks exact ties\n    winner = max(version_a, version_b, key=lambda v: (v[0], v[1]))\n    loser = version_b if winner is version_a else version_a\n    return winner, loser   # `loser` is the write that gets silently dropped" },
    { lang: "pseudo", label: "Leader write path under both policies", code: "function write(key, value, mode):\n    entry = append_to_log(key, value)\n    if mode == CP:\n        acked = replicate_and_wait_for_quorum(entry, timeout)\n        if acked < quorum_size:\n            return ERROR(\"unavailable: cannot reach write quorum\")\n        return OK(committed=true)\n    else:  # AP\n        replicate_async(entry)          # fire and forget\n        return OK(committed=\"locally, replicating in background\")" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 220 },

    params: [
      { key: "followers", label: "Followers", type: "int", min: 2, max: 4, default: 3 },
      { key: "mode", label: "Replication mode", type: "enum", options: ["CP (majority quorum)", "AP (async, always available)"], default: "CP (majority quorum)" },
      { key: "seed", label: "Partition split", type: "seed" }
    ],

    frames: function* (params, rng) {
      const F = params.followers;
      const isCP = params.mode.indexOf("CP") === 0;
      const total = 1 + F; // leader + followers
      const quorum = Math.floor(total / 2) + 1;

      // nodes[0] = leader, nodes[1..F] = followers
      let nodes = [{ id: 0, name: "Leader", value: "v0", ver: 0, side: "A", alive: true }];
      for (let i = 1; i <= F; i++) nodes.push({ id: i, name: "F" + i, value: "v0", ver: 0, side: "A", alive: true });

      // Decide the partition split with the injected rng: leader's side (A)
      // must end up the minority so the CP/AP contrast is meaningful.
      let sideOf = { 0: "A" };
      for (let i = 1; i <= F; i++) sideOf[i] = rng() < 0.5 ? "A" : "B";
      const sizeA = Object.values(sideOf).filter((x) => x === "A").length;
      if (sizeA * 2 >= total) {
        // force at least one follower to B so the leader is isolated/minority
        const followerIds = Object.keys(sideOf).map(Number).filter((id) => id !== 0);
        sideOf[followerIds[0]] = "B";
      }
      nodes = nodes.map((n) => ({ ...n, side: sideOf[n.id] }));
      const aCount = nodes.filter((n) => n.side === "A").length;
      const bCount = total - aCount;

      let clock = 0;
      let writesRefused = 0;
      let cpWritesCommitted = 0;
      let writesA = 0, writesB = 0;
      let log = []; // {ver, side, value}
      let partitioned = false;
      let leaderId = 0; // which node id is currently the leader (can move to side B under CP)

      const snap = (over) => Object.assign({
        nodes: nodes.map((n) => ({ ...n })),
        total, quorum, isCP,
        partitioned, aCount, bCount, leaderId,
        clock, writesRefused, writesA, writesB,
        log: log.slice(),
        note: "", phase2: ""
      }, over || {});

      yield {
        label: `${total} nodes: 1 leader + ${F} followers, all holding the same value v0. Write quorum = ⌊${total}/2⌋+1 = ${quorum}. Mode: ${isCP ? "CP — a write needs a majority ack before it is acknowledged to the client" : "AP — the leader acknowledges immediately and replicates in the background"}.`,
        phase: "init",
        state: snap({ phase2: "init" })
      };

      // ---- normal operation: one write, replicated to everyone ----
      clock++;
      const v1 = "v" + clock;
      nodes = nodes.map((n) => ({ ...n, value: v1, ver: clock }));
      log.push({ ver: clock, side: "-", value: v1 });
      yield {
        label: `Normal operation: client writes ${v1} to the leader.`,
        phase: "normal",
        focus: [0],
        state: snap({ phase2: "normal", note: "no partition yet — both modes agree" })
      };
      yield {
        label: `All ${total} of ${total} nodes ack — trivially clears the quorum of ${quorum}. Under normal conditions CP pays a latency cost (wait for the slowest quorum member) that AP does not; you only see that cost once the network gets slow or partitioned.`,
        phase: "normal",
        state: snap({ phase2: "normal-committed", note: `${v1} committed everywhere` })
      };

      // ---- partition strikes ----
      partitioned = true;
      yield {
        label: `Network partition: side A (${nodes.filter((n) => n.side === "A").map((n) => n.name).join(", ")}) can no longer reach side B (${nodes.filter((n) => n.side === "B").map((n) => n.name).join(", ")}). The leader is on side A, which has ${aCount} of ${total} nodes — a minority against B's ${bCount}.`,
        phase: "partition",
        state: snap({ phase2: "partition", note: "side A (leader) is the minority" })
      };

      if (isCP) {
        // The old leader, isolated on the minority side, cannot reach quorum.
        for (let attempt = 1; attempt <= 2; attempt++) {
          clock++;
          writesRefused++;
          yield {
            label: `Write attempt ${attempt} (client → leader): the leader can only reach ${aCount} node${aCount === 1 ? "" : "s"} on its own side of the partition. ${aCount} < quorum (${quorum}), so the write is REFUSED — CP sacrifices availability rather than let side B silently diverge.`,
            phase: "refuse",
            focus: [leaderId],
            state: snap({ phase2: "cp-refuse", note: `${aCount}/${quorum} acks — insufficient, write rejected` })
          };
        }
        yield {
          label: `The old leader recognizes it cannot reach a majority and steps back to a read-only, non-voting role rather than keep guessing. It still holds every previously committed value — just nothing newer.`,
          phase: "refuse",
          focus: [leaderId],
          state: snap({ phase2: "cp-steps-down", note: "old leader demotes itself: no quorum, no new writes" })
        };

        // Majority side (bCount) is, by construction of the partition split, >= quorum on its own.
        yield {
          label: `Side B has ${bCount} nodes, and ${bCount} >= quorum (${quorum}) — it can satisfy the SAME quorum requirement using only its own members. A consensus protocol (Raft/Paxos) lets the majority side elect a new leader and keep taking writes; a plain fixed-primary setup without an orchestrator would just be down until a human intervenes. We show the consensus case, since it's the one CP databases are built on.`,
          phase: "elect",
          state: snap({ phase2: "elect-eligible", note: `side B alone can reach quorum (${bCount} ≥ ${quorum})` })
        };
        const newLeaderId = nodes.find((n) => n.side === "B").id;
        leaderId = newLeaderId;
        yield {
          label: `Election: ${nodes.find((n) => n.id === newLeaderId).name} on side B wins a majority of votes among the ${bCount} reachable nodes and becomes the new leader. The old leader is still running on side A, but it is no longer the leader anyone should write through.`,
          phase: "elect",
          focus: [newLeaderId],
          state: snap({ phase2: "elect-done", note: `${nodes.find((n) => n.id === newLeaderId).name} is the new leader` })
        };

        const cpRounds = 2;
        for (let r = 1; r <= cpRounds; r++) {
          clock++;
          const vb = "v" + clock;
          nodes = nodes.map((n) => (n.side === "B" ? { ...n, value: vb, ver: clock } : { ...n }));
          log.push({ ver: clock, side: "B", value: vb });
          cpWritesCommitted++;
          yield {
            label: `New leader accepts write ${vb} and gets ${bCount}/${bCount} acks from side B — that already clears the fixed quorum of ${quorum}, so it commits normally. Side B is fully available and fully consistent among itself.`,
            phase: "elect",
            focus: [newLeaderId],
            state: snap({ phase2: "cp-new-leader-write", note: `${vb} committed on side B (${bCount}/${quorum} acks)` })
          };
        }
        yield {
          label: `Meanwhile a client that reaches the OLD leader on side A still gets its writes refused (it never regains quorum while partitioned), and a client that reaches side A for anything newer than "${log[log.length - 1] ? log[log.length - 1].value : v1}" is out of luck. ${writesRefused} write${writesRefused === 1 ? "" : "s"} refused on side A; side B kept working the whole time — CP's unavailability during this partition was confined to the minority, not the whole system.`,
          phase: "refuse",
          state: snap({ phase2: "cp-summary-during", note: "minority (side A) down for writes; majority (side B) fully available" })
        };
      } else {
        // AP: both sides keep accepting writes independently -> divergence.
        const rounds = 3;
        for (let r = 1; r <= rounds; r++) {
          clock++;
          const va = "A" + clock;
          nodes = nodes.map((n) => (n.side === "A" ? { ...n, value: va, ver: clock } : { ...n }));
          log.push({ ver: clock, side: "A", value: va });
          writesA++;
          yield {
            label: `Write to side A: leader accepts "${va}" immediately (AP never waits for a quorum) and replicates it to the ${aCount - 1} follower${aCount - 1 === 1 ? "" : "s"} it can still reach. Side B never sees this write.`,
            phase: "diverge",
            focus: [0],
            state: snap({ phase2: "ap-write-a", note: `side A now at version ${clock}` })
          };

          clock++;
          const vb = "B" + clock;
          nodes = nodes.map((n) => (n.side === "B" ? { ...n, value: vb, ver: clock } : { ...n }));
          log.push({ ver: clock, side: "B", value: vb });
          writesB++;
          const bRepresentative = nodes.find((n) => n.side === "B");
          yield {
            label: `Meanwhile side B independently accepts its own write "${vb}" on ${bRepresentative ? bRepresentative.name : "a follower"} — AP allows any reachable replica to take writes. The two sides now hold DIFFERENT values for the same key: A has "${va}", B has "${vb}".`,
            phase: "diverge",
            focus: nodes.filter((n) => n.side === "B").map((n) => n.id),
            state: snap({ phase2: "ap-write-b", note: `diverged: side A = "${va}", side B = "${vb}"` })
          };
        }
        yield {
          label: `After the partition, side A accepted ${writesA} write${writesA === 1 ? "" : "s"} and side B accepted ${writesB} — ${writesA + writesB} total writes were served with zero refusals (fully available), but the two sides now disagree and will need to be reconciled once they can talk again.`,
          phase: "diverge",
          state: snap({ phase2: "ap-diverged", note: `${writesA + writesB} writes accepted, both sides diverged` })
        };
      }

      // ---- partition heals ----
      partitioned = false;
      yield {
        label: `The partition heals — every node can reach every other node again.`,
        phase: "heal",
        state: snap({ phase2: "heal", note: "network restored" })
      };

      if (isCP) {
        const finalVal = log[log.length - 1].value, finalVer = log[log.length - 1].ver;
        yield {
          label: `Old leader (side A) rejoins as a plain follower under the new leader's term and replays the log entries it missed — it never had a conflicting write to undo, only entries to catch up on.`,
          phase: "reconcile",
          focus: nodes.filter((n) => n.side === "A").map((n) => n.id),
          state: snap({ phase2: "cp-catchup", note: `side A catching up to "${finalVal}"` })
        };
        nodes = nodes.map((n) => ({ ...n, value: finalVal, ver: finalVer }));
        yield {
          label: `Nothing to reconcile: side B never accepted a write that could be undone, so all ${total} nodes now agree on "${finalVal}" with zero conflicting writes. This is the payoff for having refused writes on the minority — there was never anything to merge.`,
          phase: "done",
          state: snap({ phase2: "cp-caught-up", note: "all nodes consistent — nothing was ever lost or overwritten" })
        };
      } else {
        // Anti-entropy: last-write-wins by (ver, side) tie-break.
        const lastA = [...log].reverse().find((e) => e.side === "A");
        const lastB = [...log].reverse().find((e) => e.side === "B");
        yield {
          label: `Anti-entropy runs: compare side A's latest write (ver ${lastA.ver}, "${lastA.value}") against side B's latest write (ver ${lastB.ver}, "${lastB.value}").`,
          phase: "reconcile",
          state: snap({ phase2: "reconcile-compare", note: "comparing divergent versions" })
        };
        const winner = lastA.ver >= lastB.ver ? lastA : lastB;
        const loser = winner === lastA ? lastB : lastA;
        nodes = nodes.map((n) => ({ ...n, value: winner.value, ver: winner.ver }));
        yield {
          label: `Last-write-wins by version number: "${winner.value}" (ver ${winner.ver}) wins over "${loser.value}" (ver ${loser.ver}). All ${total} nodes converge on "${winner.value}" — but "${loser.value}" is GONE with no error raised anywhere. That silent loss is the real price of AP's availability during the partition.`,
          phase: "reconcile",
          state: snap({ phase2: "reconcile-done", note: `converged on "${winner.value}"; "${loser.value}" silently discarded` })
        };
      }

      yield {
        label: isCP
          ? `Summary — CP: ${writesRefused} write${writesRefused === 1 ? "" : "s"} refused on the minority side, ${cpWritesCommitted} committed on the majority side after it elected a new leader, 0 divergent anywhere. Consistency held completely; unavailability was confined to the minority partition, not the whole cluster.`
          : `Summary — AP: ${writesA + writesB} writes accepted during the partition across both sides, 0 refused, but reconciliation discarded one write via last-write-wins. The system chose availability, and paid for it with a silent conflict resolution.`,
        phase: "done",
        state: snap({ phase2: "summary" })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 16;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`${s.isCP ? "CP (majority quorum)" : "AP (always available)"} · quorum ${s.quorum}/${s.total} · ${s.phase2}`, pad, 22);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(s.note || "", pad, 40);

      const areaTop = 64, areaBottom = H - 60;
      const midX = W / 2;

      // partition divider
      if (s.partitioned) {
        ctx.strokeStyle = C.danger;
        ctx.setLineDash([6, 5]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(midX, areaTop - 6);
        ctx.lineTo(midX, areaBottom + 6);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.danger;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText("partition", midX, areaTop - 12);
      }

      // Node radius grows with the canvas: bounded by vertical room per node
      // and by the horizontal half of its side, so the ring of nodes actually
      // uses the space instead of sitting as small fixed 30px dots in the
      // middle of a much larger canvas.
      const sideNodes = { A: s.nodes.filter((n) => n.side === "A"), B: s.nodes.filter((n) => n.side === "B") };
      const drawSide = (side, xCenter, halfW) => {
        const list = sideNodes[side];
        if (!list.length) return;
        const gapY = (areaBottom - areaTop) / (list.length + 1);
        const r = Math.max(24, Math.min(64, gapY * 0.42, halfW * 0.55));
        const fs = Math.max(1, r / 30);
        list.forEach((n, i) => {
          const cy = areaTop + gapY * (i + 1);
          const cx = xCenter;
          const isLeader = n.id === s.leaderId;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = isLeader ? C.viz1 : C.viz3;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
          if (isLeader) {
            ctx.strokeStyle = C.viz7;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = C.text;
          ctx.font = `${Math.round(12 * fs)}px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(n.name, cx, cy - 4 * fs);
          ctx.font = `${Math.round(11 * fs)}px ${env.font.mono}`;
          ctx.fillText(n.value, cx, cy + 13 * fs);
        });
        ctx.fillStyle = C.muted;
        ctx.font = `${Math.round(11 * Math.min(fs, 1.5))}px ${env.font.base}`;
        ctx.textAlign = "center";
        ctx.fillText(`side ${side} (${list.length} node${list.length === 1 ? "" : "s"})`, xCenter, areaTop - 12 < 30 ? 20 : areaTop - 20 < 30 ? 30 : areaTop - 20);
      };

      if (s.partitioned || s.aCount !== s.total) {
        drawSide("A", W * 0.27, W * 0.22);
        drawSide("B", W * 0.73, W * 0.22);
      } else {
        // everyone together, single row
        const list = s.nodes;
        const gapX = (W - pad * 2) / (list.length + 1);
        const r = Math.max(24, Math.min(64, gapX * 0.4, (areaBottom - areaTop) * 0.32));
        const fs = Math.max(1, r / 30);
        list.forEach((n, i) => {
          const cx = pad + gapX * (i + 1);
          const cy = (areaTop + areaBottom) / 2;
          const isLeader = n.id === s.leaderId;
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fillStyle = isLeader ? C.viz1 : C.viz3;
          ctx.globalAlpha = 0.85;
          ctx.fill();
          ctx.globalAlpha = 1;
          if (isLeader) {
            ctx.strokeStyle = C.viz7;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.fillStyle = C.text;
          ctx.font = `${Math.round(12 * fs)}px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(n.name, cx, cy - 4 * fs);
          ctx.font = `${Math.round(11 * fs)}px ${env.font.mono}`;
          ctx.fillText(n.value, cx, cy + 13 * fs);
          if (i > 0) {
            ctx.strokeStyle = C.axis;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx - gapX + r, cy);
            ctx.lineTo(cx - r, cy);
            ctx.stroke();
          }
        });
      }

      // footer counters
      ctx.textAlign = "left";
      ctx.fillStyle = C.text2;
      ctx.font = `11px ${env.font.mono}`;
      const y0 = H - 40;
      ctx.fillText(`writes accepted: A=${s.writesA}  B=${s.writesB}`, pad, y0);
      ctx.fillStyle = s.writesRefused > 0 ? C.warn : C.muted;
      ctx.fillText(`writes refused: ${s.writesRefused}`, pad, y0 + 16);

      ctx.fillStyle = C.muted;
      ctx.textAlign = "right";
      ctx.fillText(`leader = ring outline    ·    quorum needs ${s.quorum} of ${s.total} nodes`, W - pad, y0 + 16);
    }
  },

  drill: {
    cards: [
      { q: "State the CAP theorem precisely (not 'pick 2 of 3').", a: "During an actual network partition, a system must choose between Consistency (every read sees the latest acknowledged write) and Availability (every request gets a response) — it cannot have both while the partition lasts. Partition tolerance is not optional for a real distributed system.", tags: ["cap"] },
      { q: "What does a CP system do when it can't reach a write quorum?", a: "It refuses the write (times out / errors) rather than accept it with fewer acknowledgments than required — unavailable but never lets two sides silently disagree.", tags: ["cp"] },
      { q: "What does an AP system do during a partition?", a: "Every reachable replica keeps accepting writes independently, so the system stays available, but replicas on different sides of the partition can end up holding different values for the same key.", tags: ["ap"] },
      { q: "What is anti-entropy?", a: "The process that runs once a partition heals to reconcile divergent replica states — comparing versions (timestamps or vector clocks) and merging, either picking a winner (last-write-wins, which silently drops the loser) or surfacing a conflict.", tags: ["anti-entropy"] },
      { q: "What does PACELC add on top of CAP?", a: "Even with no partition (Else), a system trades Latency for Consistency: waiting for a quorum ack is slower than acknowledging locally. Systems are really PA/EL or PC/EC, not just 'AP' or 'CP'.", tags: ["pacelc"] },
      { q: "What is the hidden risk of last-write-wins reconciliation?", a: "Silent data loss — the losing write is discarded with no error surfaced anywhere. Fine for a view counter, unacceptable for money or inventory, which need CP semantics or a purpose-built CRDT.", tags: ["risk"] },
      { q: "What does R + W > N guarantee, and what does it cost?", a: "The read quorum and write quorum are guaranteed to overlap by at least one replica, so a read is guaranteed to observe the latest acknowledged write. The cost is latency: reads and writes now wait on multiple replicas instead of one.", tags: ["quorum"] }
    ],
    sixtySecond: [
      "Explain what actually happens to writes on each side of a network partition under CP vs AP replication, using quorum and sync/async replication as the mechanism.",
      "Explain PACELC and why it's a more complete description of a replicated system's trade-offs than CAP alone."
    ]
  }
};
