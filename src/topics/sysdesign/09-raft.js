export default {
  id: "raft",
  track: "sysdesign",
  title: "Leader Election (Raft)",
  difficulty: 3,
  minutes: 18,
  tags: ["consensus", "raft", "leader-election", "quorum", "split-brain"],

  explainer: [
    { type: "p", text: "Consensus is how a set of machines agrees on a **sequence of commands** despite crashes, message loss, and reordering. Raft's contribution was not a new guarantee — Paxos already had that — but a *decomposition you can hold in your head*: leader election, log replication, and safety. If you can explain those three plus the term counter, you can explain Raft." },

    { type: "h3", text: "Terms are a logical clock" },
    { type: "p", text: "Time is divided into **terms**, numbered monotonically. Each term has at most one leader, and a term begins with an election. Every message carries a term; the rule is brutally simple: **if you see a higher term, adopt it and become a follower; if you see a lower term, reject the message.** That single rule is what makes a stale leader harmless the instant it talks to anyone current — no clocks, no coordination, just an integer." },

    { type: "h3", text: "Election" },
    { type: "list", items: [
      "A follower that hears no heartbeat within its **randomized election timeout** (typically 150–300 ms) becomes a candidate: it increments the term, votes for itself, and requests votes from everyone.",
      "A node grants a vote if (a) it hasn't voted in this term, and (b) the candidate's log is **at least as up to date as its own** — compared by (last log term, last log index). That second condition is the safety property: a node missing committed entries can never win.",
      "A majority of the whole cluster wins. Majority, not 'most of the ones I can reach' — which is why two leaders in the same term are impossible: two majorities of the same set must intersect, and the node in the intersection only votes once.",
      "**Split vote**: if two candidates start simultaneously, the votes can split with nobody reaching a majority. Nothing breaks — the term simply ends with no leader, timeouts fire again with *new random* values, and one candidate almost certainly gets a head start. **Randomization is the entire anti-split mechanism**, and it's why fixed timeouts would livelock."
    ]},

    { type: "h3", text: "Log replication and commitment" },
    { type: "p", text: "Clients send commands to the leader, which appends to its log and sends `AppendEntries` to everyone. An entry is **committed** once it is stored on a majority — and only then may it be applied to the state machine and acknowledged. The leader tracks a `commitIndex` and piggybacks it on later heartbeats so followers learn what is safe to apply." },
    { type: "callout", tone: "pitfall", text: "A leader may **never** commit an entry from a *previous* term just because it's now on a majority — Figure 8 of the Raft paper. It commits an entry of its *own* term (typically an immediate no-op entry on election), which transitively commits everything before it. Skipping this is a real, subtle, data-losing bug, and knowing it signals you actually read the paper." },
    { type: "p", text: "Consistency is maintained by the **Log Matching Property**: `AppendEntries` carries `(prevLogIndex, prevLogTerm)`, and a follower rejects it if its log doesn't match there. The leader then backs up and retries until it finds the agreement point, after which the follower truncates its conflicting suffix and copies the leader's. Followers never persuade the leader; the leader's log is the truth." },

    { type: "h3", text: "The numbers that matter" },
    { type: "list", items: [
      "**Cluster size**: 3 tolerates 1 failure, 5 tolerates 2, 7 tolerates 3. Always odd — 4 nodes tolerate the same 1 failure as 3 while making every write slower. Beyond 5–7, write latency (the median follower's round trip) rises with no availability gain.",
      "**Election timeout** should be ≫ heartbeat interval ≫ network RTT: broadcast time (~1 ms) ≪ election timeout (150–300 ms) ≪ MTBF. Too low and you get spurious elections during GC pauses; too high and you're unavailable for the duration after a real failure.",
      "**Write latency** = one fsync + one round trip to the *median* follower (not the slowest — you only need a majority). In-region that's a couple of milliseconds. Cross-region it's tens to hundreds, which is why global consensus systems place members carefully.",
      "**Throughput ceiling**: everything goes through one leader, so consensus does not scale writes. Scale by **sharding into many Raft groups** — that is exactly what CockroachDB, TiKV, and Spanner do."
    ]},

    { type: "h3", text: "What Raft costs you" },
    { type: "list", items: [
      "**Unavailability during elections** — you cannot serve writes for one election timeout after a leader dies. That's the availability you traded for consistency.",
      "**Reads are not free** — a stale leader can still serve reads it thinks are current. Correct options: route reads through the log (expensive), use a **ReadIndex** (confirm leadership with a heartbeat round before answering), or **lease reads** (fast, but depends on bounded clock drift).",
      "**Membership changes are subtle** — you cannot just swap the config, or two disjoint majorities can exist during the switch. Raft does single-node-at-a-time changes (or joint consensus).",
      "**Byzantine faults are out of scope** — Raft assumes nodes crash but never lie."
    ]},

    { type: "callout", tone: "tip", text: "The framing that wins: \"Raft gives me a linearizable replicated log with automatic failover, at the cost of a majority round trip per write and a window of unavailability during elections. I'd use it for metadata and coordination — leader locks, config, shard assignment — not for the bulk data path.\"" }
  ],

  complexity: {
    rows: [
      { operation: "Commit one entry", time: "1 fsync + majority RTT", space: "O(entry) × n", note: "median follower, not slowest" },
      { operation: "Leader election", time: "1 election timeout (150–300 ms)", space: "O(1)", note: "randomized to avoid split votes" },
      { operation: "Fault tolerance", time: "⌊n/2⌋ failures", space: "—", note: "3→1, 5→2, 7→3; always odd" },
      { operation: "Follower catch-up", time: "O(divergent suffix)", space: "O(log)", note: "prevLogIndex backtracking, or a snapshot" },
      { operation: "Linearizable read", time: "ReadIndex: 1 heartbeat round", space: "O(1)", note: "or a lease, which assumes bounded clock drift" },
      { operation: "Write scalability", time: "single leader", space: "—", note: "shard into many Raft groups" }
    ]
  },

  interview: {
    whyAsked: "It's the standard probe for whether you understand *why* distributed agreement is hard, not just that ZooKeeper exists. The signal is majority intersection as the reason two leaders can't coexist, randomized timeouts as the fix for split votes, and knowing that consensus buys consistency by spending availability and write latency.",
    followUps: [
      { q: "Why can't two leaders exist in the same term?", a: "Winning requires votes from a majority of the whole cluster, and each node votes at most once per term. Any two majorities of the same set must overlap in at least one node, and that node cannot have voted for both. So at most one candidate can reach a majority in a term. Across *different* terms two nodes can both believe they're leader — the old one just doesn't know yet — but the old one cannot commit anything, because commitment also needs a majority and that majority has already moved to the higher term and will reject its lower-term messages." },
      { q: "What happens on a split vote?", a: "Nothing unsafe: the term ends with no leader elected. Each candidate's election timer expires again, and because the timeouts are randomized in a range like 150–300 ms, one candidate almost certainly starts meaningfully before the others next time and wins. The cost is one extra election timeout of unavailability. This is exactly why fixed timeouts are wrong — with identical timers the split can repeat indefinitely, which is a livelock." },
      { q: "How does Raft guarantee a new leader has all committed entries?", a: "Through the voting restriction. A committed entry is on a majority by definition. A candidate needs votes from a majority, and those two majorities intersect. A node only grants a vote if the candidate's log is at least as up to date as its own — compared by last log term first, then last log index. So a candidate missing a committed entry will be refused by the intersecting node and cannot win. Committed entries therefore survive every election without any explicit data transfer during the election." },
      { q: "Why can't a leader commit an entry from a previous term just because it's on a majority?", a: "Figure 8 of the paper. A leader can see an old-term entry replicated to a majority and be tempted to mark it committed, but a subsequent leader with a different log can still overwrite it — so 'on a majority' is not sufficient for entries the current leader did not create. Raft's rule is that a leader only counts replicas for entries of its *own* term; committing one of those transitively commits everything before it. In practice a new leader appends a no-op entry immediately so it has something of its own term to commit." },
      { q: "How do you serve a linearizable read without writing to the log?", a: "Three options. Push the read through the log as a no-op entry — correct and expensive. **ReadIndex**: the leader records its current commitIndex, exchanges one round of heartbeats to confirm it's still leader for that term, waits until its state machine has applied up to that index, then answers — one round trip, no disk write. **Lease reads**: the leader assumes it remains leader for a lease period shorter than the election timeout and answers purely locally — fastest, but its correctness depends on bounded clock drift, so it's a real (usually acceptable) assumption you should state." },
      { q: "3, 5 or 7 nodes?", a: "Five for most production systems: it tolerates two simultaneous failures, so you can lose a node to a failure and another to a deployment without losing the cluster, and the write path only needs the median of five. Three is fine for lower-stakes coordination and is cheaper and slightly faster, but any maintenance leaves you with zero fault tolerance. Seven only if the failure model genuinely demands three concurrent losses — write latency and the cost of a slow member grow, and elections take longer. Never an even number: 4 tolerates the same single failure as 3 while widening every quorum." },
      { q: "Where would you actually use Raft, and where not?", a: "Use it where the data is small, must be strongly consistent, and is read far more than written: cluster membership, shard/partition assignment, leader locks, feature flags, configuration — the etcd/ZooKeeper/Consul niche. Don't put your bulk data path through a single Raft group; the leader is a throughput ceiling and every write pays a majority round trip. If you need consensus at data scale, shard into thousands of Raft groups, one per key range, as CockroachDB and TiKV do — then consensus is per-shard and scales horizontally." }
    ]
  },

  code: [
    { lang: "python", label: "Election: the candidate and the voter", code: "import random\n\nHEARTBEAT_MS = 50\nELECTION_MIN, ELECTION_MAX = 150, 300      # MUST be randomized, or split votes livelock\n\nclass Node:\n    def __init__(self, id, peers):\n        self.id, self.peers = id, peers\n        self.term, self.voted_for, self.role = 0, None, \"follower\"\n        self.log = []                       # [(term, command)]\n        self.commit_index = 0\n        self.reset_timer()\n\n    def reset_timer(self):\n        self.deadline = now_ms() + random.randint(ELECTION_MIN, ELECTION_MAX)\n\n    # ---- becoming a candidate ------------------------------------------\n    def on_timeout(self):\n        self.term += 1                      # new term\n        self.role = \"candidate\"\n        self.voted_for = self.id            # vote for self\n        self.reset_timer()                  # NEW random timeout -> anti-split-vote\n        votes = 1\n        for p in self.peers:\n            ok = p.request_vote(self.term, self.id,\n                                len(self.log), self.last_log_term())\n            if ok:\n                votes += 1\n        if votes > (len(self.peers) + 1) // 2:       # STRICT majority of ALL nodes\n            self.become_leader()\n        # else: no leader this term. Timer fires again; randomness breaks the tie.\n\n    # ---- granting a vote -------------------------------------------------\n    def request_vote(self, term, cand, cand_last_idx, cand_last_term):\n        if term < self.term:\n            return False                    # stale candidate\n        if term > self.term:                # ALWAYS step down on a higher term\n            self.term, self.voted_for, self.role = term, None, \"follower\"\n\n        # SAFETY: only vote for a log at least as up to date as mine.\n        # This is what guarantees the winner holds every committed entry.\n        my_last_term = self.last_log_term()\n        up_to_date = (cand_last_term > my_last_term or\n                      (cand_last_term == my_last_term and cand_last_idx >= len(self.log)))\n\n        if self.voted_for in (None, cand) and up_to_date:\n            self.voted_for = cand\n            self.reset_timer()              # don't campaign against someone you backed\n            return True\n        return False\n\n    def last_log_term(self):\n        return self.log[-1][0] if self.log else 0" },
    { lang: "python", label: "Replication, commitment, and the Figure-8 rule", code: "class Leader(Node):\n    def become_leader(self):\n        self.role = \"leader\"\n        self.next_index  = {p.id: len(self.log) + 1 for p in self.peers}\n        self.match_index = {p.id: 0 for p in self.peers}\n        # Append a no-op of MY term immediately, so there is something of the\n        # current term to commit -- which transitively commits the old entries.\n        self.log.append((self.term, NOOP))\n\n    def append_entries(self, follower):\n        ni = self.next_index[follower.id]\n        prev_idx  = ni - 1\n        prev_term = self.log[prev_idx - 1][0] if prev_idx > 0 else 0\n        ok = follower.on_append(self.term, prev_idx, prev_term,\n                                self.log[ni - 1:], self.commit_index)\n        if ok:\n            self.match_index[follower.id] = len(self.log)\n            self.next_index[follower.id]  = len(self.log) + 1\n        else:\n            self.next_index[follower.id] = max(1, ni - 1)   # back up and retry\n\n    def advance_commit(self):\n        for n in range(len(self.log), self.commit_index, -1):\n            replicas = 1 + sum(m >= n for m in self.match_index.values())\n            # FIGURE 8: only ever commit by counting replicas for an entry of\n            # MY OWN TERM. Counting for an older term's entry is a real bug\n            # -- a later leader can still overwrite it.\n            if replicas > (len(self.peers) + 1) // 2 and self.log[n - 1][0] == self.term:\n                self.commit_index = n\n                break\n\n    def on_append(self, term, prev_idx, prev_term, entries, leader_commit):\n        if term < self.term:\n            return False\n        self.role, self.term = \"follower\", term\n        self.reset_timer()\n        # LOG MATCHING: refuse unless my log agrees at (prev_idx, prev_term).\n        if prev_idx > 0 and (len(self.log) < prev_idx or\n                             self.log[prev_idx - 1][0] != prev_term):\n            return False\n        self.log = self.log[:prev_idx] + list(entries)    # truncate conflicts\n        self.commit_index = min(leader_commit, len(self.log))\n        return True" },
    { lang: "pseudo", label: "ReadIndex — a linearizable read with no disk write", code: "def linearizable_read(key):\n    if self.role != \"leader\":\n        raise NotLeader(self.known_leader)\n\n    # 1. Snapshot the commit point BEFORE confirming leadership.\n    read_index = self.commit_index\n\n    # 2. Confirm we are STILL leader for this term: one heartbeat round to a\n    #    majority. If a newer term exists, someone will tell us and we step down.\n    #    Without this a partitioned old leader happily serves stale reads.\n    if not self.heartbeat_majority():\n        raise NotLeader(None)\n\n    # 3. Wait until our own state machine has applied everything up to that point.\n    wait_until(self.applied_index >= read_index)\n\n    return self.state_machine.get(key)\n\n# Cost: one network round trip, zero fsyncs, no log entry.\n# Lease reads skip step 2 by assuming leadership holds for a lease shorter than\n# the election timeout -- much faster, but correctness now rests on bounded\n# clock drift. State that assumption out loud." }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.55, maxFrames: 400 },

    params: [
      { key: "nodes", label: "Cluster size", type: "int", min: 3, max: 7, default: 5 },
      { key: "seed", label: "Re-roll timers", type: "seed" }
    ],

    frames: function* (params, rng) {
      const N = params.nodes;
      const MAJ = Math.floor(N / 2) + 1;

      const nodes = [];
      for (let i = 0; i < N; i++) {
        nodes.push({
          id: "n" + i, role: "follower", term: 1, votedFor: null,
          timer: 0, timeout: 6 + Math.floor(rng() * 6), log: 3, commit: 3, alive: true, votes: 0
        });
      }
      nodes[0].role = "leader"; nodes[0].votedFor = "n0";

      let msgs = [];
      const snap = (extra) => Object.assign({
        nodes: nodes.map((n) => ({ id: n.id, role: n.role, term: n.term, votedFor: n.votedFor, timer: n.timer, timeout: n.timeout, log: n.log, commit: n.commit, alive: n.alive, votes: n.votes })),
        msgs: msgs.map((m) => ({ from: m.from, to: m.to, kind: m.kind, ok: m.ok })),
        majority: MAJ, n: N, note: ""
      }, extra || {});

      yield {
        label: `${N}-node Raft cluster, term 1, n0 is leader. A majority is ${MAJ} — that is the only number that matters, and it is a majority of ALL ${N}, not of the reachable ones.`,
        phase: "steady",
        state: snap()
      };

      // ---- steady state: heartbeats + replication ------------------------------
      for (let t = 0; t < 4; t++) {
        msgs = [];
        for (let i = 1; i < N; i++) { nodes[i].timer = 0; msgs.push({ from: "n0", to: nodes[i].id, kind: "heartbeat", ok: true }); }
        if (t === 1) {
          nodes[0].log += 1;
          yield {
            label: `Client write → leader appends entry ${nodes[0].log} to its own log. It is NOT committed yet: one copy on one machine is not a decision.`,
            phase: "replicate",
            state: snap()
          };
          for (let i = 1; i < N; i++) { nodes[i].log = nodes[0].log; msgs.push({ from: "n0", to: nodes[i].id, kind: "append", ok: true }); }
          yield {
            label: `AppendEntries(prevLogIndex=${nodes[0].log - 1}) reaches all followers; ${N - 1} acknowledge. ${MAJ} of ${N} now hold entry ${nodes[0].log}, so the leader advances commitIndex and only NOW replies to the client.`,
            phase: "replicate",
            state: snap()
          };
          for (const n of nodes) n.commit = nodes[0].log;
        } else {
          yield {
            label: `Heartbeat ${t + 1}: empty AppendEntries every ~50 ms. Its only job is to reset every follower's election timer and carry the current commitIndex.`,
            phase: "steady",
            state: snap()
          };
        }
      }

      // ---- leader dies ----------------------------------------------------------
      msgs = [];
      nodes[0].alive = false; nodes[0].role = "dead";
      yield {
        label: `n0 dies. No more heartbeats. Every follower is now counting down its own randomized election timeout — the cluster is unavailable for writes until someone wins.`,
        phase: "fault",
        state: snap()
      };

      // ---- force a split vote: two nodes with identical timers -----------------
      const a = 1, b = N > 3 ? 3 : 2;
      nodes[a].timeout = 5; nodes[b].timeout = 5;
      for (let i = 1; i < N; i++) if (i !== a && i !== b) nodes[i].timeout = 9 + Math.floor(rng() * 4);

      for (let tick = 1; tick <= 5; tick++) {
        for (let i = 1; i < N; i++) if (nodes[i].alive) nodes[i].timer = tick;
        if (tick < 5) {
          yield {
            label: `Tick ${tick}: no heartbeat. Timers advance — ${nodes.slice(1).filter((n) => n.alive).map((n) => `${n.id} ${n.timer}/${n.timeout}`).join(", ")}. Whoever hits its timeout first campaigns first.`,
            phase: "timeout",
            state: snap()
          };
        }
      }

      // ---- term 2: split vote ---------------------------------------------------
      msgs = [];
      for (const i of [a, b]) {
        nodes[i].term = 2; nodes[i].role = "candidate"; nodes[i].votedFor = nodes[i].id; nodes[i].votes = 1;
      }
      for (let i = 1; i < N; i++) if (i !== a && i !== b) nodes[i].term = 2;
      yield {
        label: `${nodes[a].id} and ${nodes[b].id} time out on the SAME tick. Both increment to term 2, vote for themselves, and broadcast RequestVote. This is the split-vote setup.`,
        phase: "election",
        state: snap()
      };

      // remaining voters split
      const voters = [];
      for (let i = 1; i < N; i++) if (i !== a && i !== b) voters.push(i);
      for (let k = 0; k < voters.length; k++) {
        const v = voters[k];
        const target = k % 2 === 0 ? a : b;
        nodes[v].votedFor = nodes[target].id;
        nodes[target].votes += 1;
        msgs = [{ from: nodes[v].id, to: nodes[target].id, kind: "vote", ok: true }];
        yield {
          label: `${nodes[v].id} votes for ${nodes[target].id} (term 2, first request to arrive, and ${nodes[target].id}'s log is at least as up to date). One vote per node per term — ${nodes[v].id} must now refuse the other candidate.`,
          phase: "election",
          focus: [target],
          state: snap()
        };
      }

      msgs = [];
      yield {
        label: `Term 2 ends with no leader: ${nodes[a].id} has ${nodes[a].votes} votes, ${nodes[b].id} has ${nodes[b].votes}, and ${MAJ} were needed. A SPLIT VOTE. Nothing is corrupted — the term is simply wasted, and the cluster stays unavailable for one more timeout.`,
        phase: "split",
        state: snap()
      };

      // ---- retry with fresh random timers ---------------------------------------
      for (let i = 1; i < N; i++) {
        nodes[i].role = "follower"; nodes[i].votedFor = null; nodes[i].votes = 0;
        nodes[i].timeout = 4 + Math.floor(rng() * 9);
        nodes[i].timer = 0;
      }
      let winner = 1;
      for (let i = 2; i < N; i++) if (nodes[i].timeout < nodes[winner].timeout) winner = i;
      yield {
        label: `Every candidate re-randomizes its timeout: ${nodes.slice(1).map((n) => `${n.id}=${n.timeout}`).join(", ")}. Randomization is the ENTIRE anti-split mechanism — with fixed timeouts this could repeat forever, which is a livelock.`,
        phase: "retry",
        state: snap()
      };

      for (let tick = 1; tick <= nodes[winner].timeout; tick++) {
        for (let i = 1; i < N; i++) if (nodes[i].alive) nodes[i].timer = tick;
        if (tick === nodes[winner].timeout || tick % 3 === 0) {
          yield {
            label: `Tick ${tick}: ${nodes.slice(1).map((n) => `${n.id} ${n.timer}/${n.timeout}`).join(", ")}. ${tick === nodes[winner].timeout ? `${nodes[winner].id} fires first — a clear head start this time.` : "Still counting."}`,
            phase: "timeout",
            state: snap()
          };
        }
      }

      // ---- term 3: clean election ------------------------------------------------
      nodes[winner].term = 3; nodes[winner].role = "candidate"; nodes[winner].votedFor = nodes[winner].id; nodes[winner].votes = 1;
      msgs = [];
      for (let i = 0; i < N; i++) if (i !== winner && nodes[i].alive) msgs.push({ from: nodes[winner].id, to: nodes[i].id, kind: "request", ok: true });
      yield {
        label: `${nodes[winner].id} becomes a candidate in term 3 and broadcasts RequestVote(term=3, lastLogIndex=${nodes[winner].log}, lastLogTerm=…). It has 1 vote — its own.`,
        phase: "election",
        focus: [winner],
        state: snap()
      };

      for (let i = 1; i < N; i++) {
        if (i === winner || !nodes[i].alive) continue;
        nodes[i].term = 3; nodes[i].votedFor = nodes[winner].id; nodes[winner].votes += 1;
        msgs = [{ from: nodes[i].id, to: nodes[winner].id, kind: "vote", ok: true }];
        const got = nodes[winner].votes;
        yield {
          label: `${nodes[i].id} grants its vote: term 3 > its term, it has not voted this term, and ${nodes[winner].id}'s log (index ${nodes[winner].log}) is at least as up to date as its own. ${got}/${MAJ} votes.` +
            (got >= MAJ ? ` MAJORITY — and because any two majorities intersect, no second leader can exist in term 3.` : ""),
          phase: "election",
          focus: [winner],
          state: snap()
        };
        if (nodes[winner].votes >= MAJ) break;
      }

      nodes[winner].role = "leader";
      nodes[winner].log += 1;
      msgs = [];
      for (let i = 0; i < N; i++) if (i !== winner && nodes[i].alive) msgs.push({ from: nodes[winner].id, to: nodes[i].id, kind: "heartbeat", ok: true });
      yield {
        label: `${nodes[winner].id} is leader for term 3 and immediately appends a NO-OP entry of its own term. That is the Figure-8 rule: a leader may only commit by counting replicas for an entry of its own term, and committing the no-op transitively commits everything before it.`,
        phase: "leader",
        focus: [winner],
        state: snap()
      };

      for (let i = 0; i < N; i++) if (nodes[i].alive) { nodes[i].log = nodes[winner].log; nodes[i].commit = nodes[winner].log; nodes[i].timer = 0; }
      yield {
        label: `Heartbeats resume; followers converge to the leader's log via the (prevLogIndex, prevLogTerm) match check, truncating anything that conflicts. Writes are available again. Total outage = one wasted term + one election timeout.`,
        phase: "leader",
        state: snap()
      };

      // ---- the old leader wakes up ------------------------------------------------
      nodes[0].alive = true; nodes[0].role = "leader"; nodes[0].term = 1;
      msgs = [{ from: "n0", to: nodes[winner].id, kind: "append", ok: false }];
      yield {
        label: `n0 comes back still believing it is leader — of term 1. It sends AppendEntries; the receiver sees term 1 < term 3 and rejects it, replying with the current term. This is why a stale leader is harmless: one integer comparison, no clocks, no coordination.`,
        phase: "stale",
        focus: [0],
        state: snap()
      };

      nodes[0].role = "follower"; nodes[0].term = 3; nodes[0].votedFor = nodes[winner].id;
      nodes[0].log = nodes[winner].log; nodes[0].commit = nodes[winner].commit;
      msgs = [];
      yield {
        label: `n0 sees the higher term and immediately steps down to follower at term 3, then catches up its log. Cluster is whole: ${N} nodes, one leader, term 3, commitIndex ${nodes[winner].commit}.`,
        phase: "done",
        state: snap()
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
          "text-anchor": o.anchor || "middle", "font-weight": o.bold ? 600 : 400
        }, str);
      };

      const N = s.nodes.length;
      const cx = W * 0.36, cy = H * 0.47, R = Math.min(H * 0.36, W * 0.25);
      const pos = (i) => {
        const a = -Math.PI / 2 + (i / N) * Math.PI * 2;
        return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
      };

      const maxTerm = Math.max.apply(null, s.nodes.map((n) => n.term));
      add(txt(16, 22, `term ${maxTerm}`, { fill: C.text, size: 15, bold: true, anchor: "start", mono: false }));
      add(txt(16, 40, `majority = ${s.majority} of ${s.n}`, { fill: C.muted, size: 11, anchor: "start" }));

      // ---- messages -------------------------------------------------------------
      const kindColor = { heartbeat: C.viz3, append: C.viz1, request: C.viz4, vote: C.viz6 };
      for (const m of s.msgs) {
        const fi = s.nodes.findIndex((n) => n.id === m.from);
        const ti = s.nodes.findIndex((n) => n.id === m.to);
        if (fi < 0 || ti < 0) continue;
        const p = pos(fi), q = pos(ti);
        const col = m.ok === false ? C.danger : (kindColor[m.kind] || C.viz1);
        add(h("line", { x1: p.x, y1: p.y, x2: q.x, y2: q.y, stroke: col, "stroke-width": 1.8, opacity: 0.75, "stroke-dasharray": m.ok === false ? "4 3" : null }));
        const mx = p.x + (q.x - p.x) * 0.66, my = p.y + (q.y - p.y) * 0.66;
        add(h("circle", { cx: mx, cy: my, r: 4.5, fill: col }));
      }

      // ---- nodes ----------------------------------------------------------------
      // Node radius scales with the ring instead of sitting at a fixed 26px,
      // so a taller/wider canvas gets a bigger, more legible ring diagram.
      const r = Math.max(22, Math.min(48, R * 0.2));
      const nfs = Math.min(1.8, r / 26);
      for (let i = 0; i < N; i++) {
        const n = s.nodes[i], p = pos(i);
        const roleCol = !n.alive ? C.danger : n.role === "leader" ? C.viz7 : n.role === "candidate" ? C.viz4 : C.viz1;

        // election-timer ring
        if (n.alive && n.role !== "leader" && n.timeout > 0) {
          const frac = Math.max(0, Math.min(1, n.timer / n.timeout));
          const a0 = -Math.PI / 2, a1 = a0 + frac * Math.PI * 2;
          const lg = frac > 0.5 ? 1 : 0;
          if (frac > 0.001) {
            add(h("path", {
              d: `M ${p.x + Math.cos(a0) * (r + 7)} ${p.y + Math.sin(a0) * (r + 7)} A ${r + 7} ${r + 7} 0 ${lg} 1 ${p.x + Math.cos(a1) * (r + 7)} ${p.y + Math.sin(a1) * (r + 7)}`,
              fill: "none", stroke: frac > 0.8 ? C.warn : C.axis, "stroke-width": 3
            }));
          }
        }

        add(h("circle", { cx: p.x, cy: p.y, r: r, fill: C.surface, stroke: roleCol, "stroke-width": n.role === "leader" ? 3 : 2, opacity: n.alive ? 1 : 0.45 }));
        add(txt(p.x, p.y - 2, n.id, { fill: n.alive ? C.text : C.muted, size: Math.round(13 * nfs), bold: true }));
        add(txt(p.x, p.y + Math.round(12 * nfs), !n.alive ? "DOWN" : n.role, { fill: roleCol, size: Math.round(9 * nfs) }));
        add(txt(p.x, p.y - r - 8, `term ${n.term}`, { fill: C.muted, size: Math.round(9 * nfs) }));
        if (n.role === "candidate") add(txt(p.x, p.y + r + 14, `${n.votes}/${s.majority} votes`, { fill: n.votes >= s.majority ? C.ok : C.warn, size: Math.round(10 * nfs) }));
        else if (n.votedFor && n.alive) add(txt(p.x, p.y + r + 14, `voted ${n.votedFor}`, { fill: C.muted, size: Math.round(9 * nfs) }));
      }

      // ---- log panel --------------------------------------------------------------
      const lx = cx + R + 66;
      const lw = W - lx - 24;
      add(txt(lx, 26, "replicated logs (green = committed)", { fill: C.muted, size: 12, anchor: "start" }));
      const rowH = Math.min(72, (H - 92) / N);
      const lfs = Math.min(1.8, rowH / 34);
      const maxLog = Math.max(1, ...s.nodes.map((n) => n.log));
      const cw = Math.min(46, (lw - 60) / maxLog);
      const barH = Math.min(34, rowH - 10);
      for (let i = 0; i < N; i++) {
        const n = s.nodes[i];
        const y = 44 + i * rowH;
        add(txt(lx, y + barH * 0.72, n.id, { fill: n.alive ? C.text2 : C.muted, size: Math.round(12 * lfs), anchor: "start" }));
        for (let k = 0; k < n.log; k++) {
          add(h("rect", {
            x: lx + 34 * lfs + k * cw, y: y, width: Math.max(4, cw - 3), height: barH, rx: 2,
            fill: k < n.commit ? C.viz6 : C.viz4, opacity: n.alive ? 1 : 0.35
          }));
        }
        if (n.role === "leader" && n.alive) add(txt(lx + 34 * lfs + n.log * cw + 12, y + barH * 0.72, "◀ leader", { fill: C.viz7, size: Math.round(10 * lfs), anchor: "start" }));
      }
      add(txt(lx, H - 18, `commitIndex = ${Math.max.apply(null, s.nodes.map((n) => n.commit))} — an entry is committed once ${s.majority} of ${s.n} hold it`, { fill: C.muted, size: 11, anchor: "start" }));
    }
  },

  drill: {
    cards: [
      { q: "Why is it impossible to have two leaders in the same Raft term?", a: "Winning requires votes from a majority of all nodes and each node votes at most once per term. Any two majorities of the same set intersect, and the overlapping node cannot have voted twice.", tags: ["safety"] },
      { q: "What is a term and what is the universal rule about it?", a: "A monotonically increasing logical clock with at most one leader per term. Every message carries a term: if you see a higher term, adopt it and step down to follower; if you see a lower one, reject the message.", tags: ["terms"] },
      { q: "What happens on a split vote, and what prevents it repeating?", a: "The term ends with no leader — nothing unsafe, just one election timeout of unavailability. Randomized timeouts (150–300 ms) give one candidate a head start next round. Fixed timeouts would livelock.", tags: ["election"] },
      { q: "Under what condition does a node grant a vote?", a: "It hasn't voted in that term, and the candidate's log is at least as up to date as its own — compared by last log term first, then last log index. That restriction is what guarantees the winner holds every committed entry.", tags: ["safety"] },
      { q: "When is an entry committed?", a: "When it is stored on a majority of the cluster AND it is an entry of the current leader's term. Only then may it be applied and acknowledged.", tags: ["replication"] },
      { q: "What is the Figure-8 rule?", a: "A leader must never commit an entry from a previous term merely because it now sits on a majority — a later leader could still overwrite it. It commits an entry of its own term (typically a no-op appended on election), which transitively commits everything earlier.", tags: ["pitfall"] },
      { q: "How does a follower with a divergent log get fixed?", a: "AppendEntries carries (prevLogIndex, prevLogTerm); the follower rejects if it doesn't match. The leader decrements nextIndex and retries until it finds the agreement point, then the follower truncates its conflicting suffix and copies the leader's.", tags: ["replication"] },
      { q: "3, 5, or 7 nodes — and why never 4?", a: "5 for production: tolerates 2 failures, so one node can be down for maintenance and you still survive a failure. 3 is cheaper but has zero tolerance during maintenance. 4 tolerates the same single failure as 3 while making every quorum larger, so it is strictly worse.", tags: ["sizing"] },
      { q: "How do you serve a linearizable read without appending to the log?", a: "ReadIndex: capture commitIndex, confirm leadership with one heartbeat round to a majority, wait until applied ≥ that index, then answer. Lease reads skip the round trip by assuming leadership holds for a lease shorter than the election timeout — faster, but it depends on bounded clock drift.", tags: ["reads"] },
      { q: "Does Raft scale writes?", a: "No — every write goes through one leader and costs a majority round trip. Scale by sharding into many independent Raft groups (CockroachDB, TiKV, Spanner), one per key range.", tags: ["scaling"] }
    ],
    sixtySecond: [
      "Explain Raft leader election, including terms, the voting restriction, and why split votes resolve.",
      "Explain when an entry is committed in Raft and why a leader cannot commit an entry from an earlier term."
    ]
  }
};
