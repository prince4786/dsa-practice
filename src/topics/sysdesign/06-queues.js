export default {
  id: "queues",
  track: "sysdesign",
  title: "Message Queues & Backpressure",
  difficulty: 2,
  minutes: 15,
  tags: ["queues", "kafka", "backpressure", "consumer-lag", "littles-law", "dlq"],

  explainer: [
    { type: "p", text: "A queue does not create capacity. It *buffers* the mismatch between how fast work arrives and how fast you can do it. If arrival rate exceeds service rate for long enough, the queue does not save you — it just changes the failure from *dropped requests* into *unbounded latency*, which is usually worse because it's invisible until it isn't." },

    { type: "h3", text: "The one equation: Little's Law" },
    { type: "p", text: "`L = λ × W` — items in the system = arrival rate × time in the system. Rearranged, **wait time = queue depth ÷ throughput**. A queue holding 50,000 messages drained at 500/s is a **100-second** delay, no matter how you feel about it. This single line converts an alarming-looking depth graph into a user-visible SLA number, and it is the sentence that makes an interviewer relax." },
    { type: "p", text: "The corollary that surprises people: at utilization ρ = λ/μ, queue wait grows as roughly `ρ/(1−ρ)`. At 80% utilization you wait 4 service times; at 90%, 9; at 95%, 19. **Latency explodes before throughput does**, which is why you provision consumers to ~70% and not to 95%." },

    { type: "h3", text: "What a queue actually buys you" },
    { type: "list", items: [
      "**Load levelling** — absorb a 10× spike lasting 30 s with 30 s of buffered work rather than 10× the servers.",
      "**Decoupling** — the producer doesn't need the consumer to be up, deployed, or even written yet.",
      "**Retry and isolation** — a failing consumer retries without the user knowing, and a poison message goes to a dead-letter queue instead of stopping the world.",
      "**Fan-out** — one event, many independent subscribers, added without touching the producer."
    ]},

    { type: "h3", text: "Log vs broker — the distinction interviewers probe" },
    { type: "list", items: [
      "**Broker queue** (SQS, RabbitMQ) — the message is *deleted* on ack. Per-message ack, per-message retry, easy to scale consumers arbitrarily. Ordering is best-effort or costs you a FIFO queue with lower throughput.",
      "**Log** (Kafka, Kinesis, Pulsar) — messages are an *append-only offset-indexed file*, retained for days and replayable. Ordering is guaranteed **per partition**. Parallelism is capped at the partition count, and one slow consumer blocks its whole partition (head-of-line blocking).",
      "Pick a log when you need replay, ordering, or multiple independent consumer groups. Pick a broker when you need per-message retry, arbitrary consumer counts, and don't care about total order."
    ]},

    { type: "h3", text: "Delivery semantics" },
    { type: "p", text: "At-most-once (ack before work — lose messages), **at-least-once** (ack after work — duplicate messages), exactly-once (only within a transactional system's own boundary, never across an external side effect). In practice you ship **at-least-once plus idempotent consumers**, and you say that sentence out loud. 'Exactly-once' end-to-end with a third party's API does not exist; an idempotency key does." },

    { type: "callout", tone: "pitfall", text: "Retrying a poison message forever is how one bad payload takes down a pipeline for a day. Cap retries, use exponential backoff, and route the failure to a **dead-letter queue** with the original message plus the error. Then alarm on DLQ depth — an un-monitored DLQ is a silent data-loss bucket." },

    { type: "h3", text: "Backpressure — the four responses to 'too much work'" },
    { type: "list", items: [
      "**Scale consumers** — right answer when the spike is sustained and the downstream can take it. Bounded by partition count in a log, and by the database behind you in all cases.",
      "**Shed load** — reject at the door with a 429/503 so latency stays bounded for whoever you do serve. Prefer shedding *cheap and early* over collapsing *late and expensive*.",
      "**Slow the producer** — a blocking send, a bounded channel, or TCP-style flow control. Correct inside one system; dangerous across a service boundary because it propagates the stall upstream.",
      "**Degrade** — drop the optional work (skip the recommendation refresh, defer the analytics event) and keep the critical path alive."
    ]},
    { type: "callout", tone: "warn", text: "An **unbounded** queue is a bug, not a design. Bound every queue, and decide explicitly what happens when it's full: block, drop-newest, or drop-oldest. Dropping the *oldest* is often right for telemetry (fresh data is more valuable); blocking is right when every item must survive." },

    { type: "h3", text: "Back-of-envelope" },
    { type: "p", text: "10k messages/sec, 2 KB each = 20 MB/s = 1.7 TB/day. Kafka with 7-day retention and 3× replication needs ~36 TB of disk. Consumers process 500 msg/s each, so 10k/s needs 20 consumers — and therefore **at least 20 partitions**, since a partition is consumed by exactly one member of a group. Provision 60 partitions so you can grow to 3× without repartitioning, because increasing partitions breaks key→partition ordering for existing keys." }
  ],

  complexity: {
    rows: [
      { operation: "Wait time (Little's Law)", time: "W = L / λ", space: "—", note: "depth ÷ throughput = delay" },
      { operation: "Queue growth", time: "(λ − μ) per second", space: "unbounded if λ > μ", note: "a queue never adds capacity" },
      { operation: "Wait vs utilization", time: "∝ ρ/(1−ρ)", space: "—", note: "4× at ρ=0.8, 19× at ρ=0.95" },
      { operation: "Log consume", time: "O(1) sequential read", space: "O(retention)", note: "replayable; parallelism ≤ partitions" },
      { operation: "Broker ack", time: "O(1) per message", space: "O(depth)", note: "per-message retry and visibility timeout" }
    ]
  },

  interview: {
    whyAsked: "It reveals whether you understand that a queue moves a failure rather than removing it. The signal: reaching for Little's Law unprompted to turn depth into user-visible latency, insisting the queue is bounded, and choosing a specific backpressure response instead of saying 'we'd add more consumers'.",
    followUps: [
      { q: "Your consumer lag is 2 million messages and climbing. Walk me through it.", a: "First quantify: at 5,000 msg/s throughput, 2M of lag is 400 seconds of delay — that's the number I report, not the count. Then determine whether λ > μ (structurally under-provisioned, lag grows forever) or whether it's a backlog from a past spike (λ < μ now, lag drains at μ − λ). Look for the actual bottleneck: usually the consumer's downstream — a database, an external API, a lock. Scale consumers only up to the partition count and only if the downstream can take the extra concurrency; otherwise I'm moving the queue, not draining it. If the data is time-sensitive and stale items are worthless, the right move can be to skip ahead — seek to the latest offset and accept the loss deliberately." },
      { q: "How do you get exactly-once processing?", a: "You don't, across an external boundary. What you ship is at-least-once delivery plus an idempotent consumer: derive a deterministic key from the message (its id, or a hash of its content), and make the side effect conditional on that key — an INSERT with a unique constraint, an upsert, or a dedup table with a TTL. Kafka's transactions give exactly-once *within* Kafka (consume-transform-produce with the offset commit in the same transaction), which genuinely helps for stream processing, but the moment you call a payment API the guarantee is yours to build with an idempotency key." },
      { q: "When is a queue the wrong answer?", a: "When the caller needs the result now — inserting a queue into a synchronous request path just adds latency and a place for work to get lost. When ordering across the whole stream matters and you can't partition by a key that preserves it. When the work is not retry-safe and you can't make it idempotent. And when the queue would only be papering over a permanently under-provisioned consumer: if λ > μ on average, the queue grows without bound and you have chosen unbounded latency over honest rejection." },
      { q: "How do you handle a poison message?", a: "Bounded retries with exponential backoff, then route to a dead-letter queue carrying the original payload, the error, and the retry count. The DLQ must be monitored and have an owner — alarm on depth and on age of the oldest item, or it becomes silent data loss. For a log-based system there's an extra hazard: a poison message blocks its entire partition, so the consumer must be able to skip past it (commit the offset and DLQ the payload) rather than retrying in place forever." },
      { q: "How many partitions should a Kafka topic have?", a: "At least the number of consumers you'll ever want in one group, since a partition is read by exactly one member — partitions are the unit of parallelism and the ceiling on it. Size from throughput: 10k msg/s at 500 msg/s per consumer needs 20, so provision 60 for headroom. Over-partitioning isn't free either — more open file handles, more leader elections, higher end-to-end latency, longer rebalances. And crucially, increasing partitions later changes `hash(key) % partitions`, so existing keys move and per-key ordering breaks across the change." },
      { q: "How do you decide between scaling consumers and shedding load?", a: "By whether the spike is sustained and whether the downstream can absorb it. A 30-second spike is what the buffer is for — do nothing. A sustained increase means scale, up to the partition limit and only if the database behind the consumer has headroom; otherwise adding consumers just moves the queue into the database's lock manager. When neither is true, shed: reject at the entry point with a 429 so the requests you do accept keep bounded latency. Shedding early and cheaply always beats collapsing late and expensively, and the shedder should be adaptive — triggered by measured latency or queue depth, not a hardcoded rate." }
    ]
  },

  code: [
    { lang: "python", label: "Idempotent at-least-once consumer", code: "# At-least-once delivery is a given. Idempotency is YOUR job.\ndef handle(msg):\n    key = msg.headers.get(\"idempotency-key\") or msg.id\n\n    with db.transaction():\n        # The dedup marker and the side effect commit ATOMICALLY, or\n        # a crash between them reintroduces the duplicate you just prevented.\n        inserted = db.execute(\n            \"INSERT INTO processed (key, at) VALUES (%s, now()) \"\n            \"ON CONFLICT (key) DO NOTHING\", key).rowcount\n        if inserted == 0:\n            return  # already done; ack and move on\n\n        apply_side_effect(msg)\n\n# Retention on `processed` must exceed the queue's maximum retry/retention\n# window, or a very late redelivery will be processed a second time.\n\ndef consume_loop(consumer, dlq, max_attempts=5):\n    for msg in consumer:\n        for attempt in range(max_attempts):\n            try:\n                handle(msg)\n                consumer.commit(msg)          # commit AFTER the work\n                break\n            except Retryable as e:\n                sleep(min(30, 2 ** attempt) * (0.5 + random.random()))\n        else:\n            # Never retry forever: one poison message must not block a partition.\n            dlq.send({\"payload\": msg.value, \"error\": repr(e),\n                      \"attempts\": max_attempts, \"topic\": msg.topic})\n            consumer.commit(msg)              # skip past it" },
    { lang: "python", label: "Bounded queue with an explicit full-policy", code: "import collections\n\nclass BoundedQueue:\n    \"\"\"An UNBOUNDED queue is a bug. Choose the overflow behaviour explicitly.\"\"\"\n    def __init__(self, maxsize, on_full=\"reject\"):\n        assert on_full in (\"reject\", \"drop_oldest\", \"block\")\n        self.q = collections.deque()\n        self.maxsize = maxsize\n        self.on_full = on_full\n        self.dropped = 0\n\n    def put(self, item, deadline=None):\n        if len(self.q) < self.maxsize:\n            self.q.append(item); return True\n        if self.on_full == \"reject\":            # 429 at the door: bounded latency\n            self.dropped += 1; return False\n        if self.on_full == \"drop_oldest\":       # right for telemetry: fresh > complete\n            self.q.popleft(); self.q.append(item); self.dropped += 1; return True\n        return self._block_until_space(deadline) # right when nothing may be lost\n\n    def wait_estimate(self, throughput_per_s):\n        # Little's Law. Report SECONDS to the on-call, never raw depth.\n        return len(self.q) / max(1e-9, throughput_per_s)" },
    { lang: "javascript", label: "Adaptive load shedding (latency-triggered)", code: "// A fixed rps limit is always wrong by tomorrow. Shed on measured pain.\nclass Shedder {\n  constructor({ targetP99Ms = 250, floor = 0.05 }) {\n    this.accept = 1.0;                 // fraction of requests we admit\n    this.targetP99Ms = targetP99Ms;\n    this.floor = floor;\n  }\n  // called once per second with observed latency + queue depth\n  observe(p99Ms, depth, throughput) {\n    const waitS = depth / Math.max(1, throughput);       // Little's Law\n    const overloaded = p99Ms > this.targetP99Ms || waitS > 1.0;\n    this.accept = overloaded\n      ? Math.max(this.floor, this.accept * 0.9)          // back off fast\n      : Math.min(1.0, this.accept + 0.02);               // recover slowly (AIMD)\n  }\n  admit(req) {\n    if (req.priority === \"critical\") return true;        // never shed the checkout\n    return hash(req.id) / 2 ** 32 < this.accept;         // deterministic, not random:\n  }                                                     // a retried request gets the\n}                                                       // same verdict, no retry storm"}
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 320 },

    params: [
      { key: "arrival", label: "Arrivals / tick", type: "int", min: 2, max: 20, default: 8 },
      { key: "consumers", label: "Consumers", type: "int", min: 1, max: 8, default: 3 },
      { key: "serviceRate", label: "Msgs / consumer / tick", type: "int", min: 1, max: 8, default: 3 },
      { key: "maxDepth", label: "Queue bound", type: "int", min: 20, max: 400, default: 120 },
      { key: "policy", label: "Backpressure", type: "enum", options: ["none", "autoscale", "shed-load"], default: "autoscale" },
      { key: "ticks", label: "Ticks", type: "int", min: 30, max: 80, default: 54 },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const T = params.ticks;
      const MU = params.serviceRate;
      const MAXD = params.maxDepth;
      const POLICY = params.policy;
      let consumers = params.consumers;
      const baseArrival = params.arrival;

      let depth = 0, enqueued = 0, processed = 0, dropped = 0, dlq = 0;
      let slowFrom = Math.floor(T * 0.25), slowTo = Math.floor(T * 0.62);
      let accept = 1.0;
      const hist = [];       // { d, c, lam, mu, shed }

      const r2 = (x) => Math.round(x * 100) / 100;
      const snap = (t, extra) => Object.assign({
        t: t, T: T, depth: depth, maxDepth: MAXD, consumers: consumers, mu: MU,
        enqueued: enqueued, processed: processed, dropped: dropped, dlq: dlq,
        accept: r2(accept), policy: POLICY,
        hist: hist.slice(),
        lam: 0, cap: 0, wait: 0, util: 0, event: ""
      }, extra || {});

      yield {
        label: `Producers push ~${baseArrival} msg/tick into a bounded queue (max ${MAXD}); ${consumers} consumers drain ${MU} each = ${consumers * MU}/tick. Utilization ρ = ${r2(baseArrival / (consumers * MU))}.`,
        phase: "init",
        state: snap(0)
      };

      for (let t = 1; t <= T; t++) {
        // --- arrivals (with a sustained spike in the middle) --------------------
        const spike = t >= slowFrom && t < slowTo ? 2.2 : 1.0;
        let lam = Math.max(0, Math.round(baseArrival * spike + (rng() - 0.5) * baseArrival * 0.5));

        // --- backpressure policies ---------------------------------------------
        let event = "";
        const cap0 = consumers * MU;
        if (POLICY === "autoscale") {
          // scale on measured wait, not on raw depth
          const wait = depth / Math.max(1, cap0);
          if (wait > 3 && consumers < 8) { consumers += 1; event = "scale-up"; }
          else if (wait < 0.5 && consumers > 1 && t > slowTo) { consumers -= 1; event = "scale-down"; }
        } else if (POLICY === "shed-load") {
          const wait = depth / Math.max(1, cap0);
          accept = wait > 2 ? Math.max(0.1, accept * 0.85) : Math.min(1, accept + 0.05);
          const admitted = Math.round(lam * accept);
          dropped += lam - admitted;
          if (lam - admitted > 0) event = "shed";
          lam = admitted;
        }

        // --- enqueue, honouring the bound --------------------------------------
        const room = MAXD - depth;
        const admitted = Math.min(lam, room);
        if (admitted < lam) { dropped += lam - admitted; event = event || "overflow"; }
        depth += admitted;
        enqueued += admitted;

        // --- consumers drain ----------------------------------------------------
        const cap = consumers * MU;
        const done = Math.min(depth, cap);
        depth -= done;
        processed += done;
        // a small poison rate: one in ~40 messages fails permanently
        if (done > 0 && rng() < 0.025) { dlq += 1; }

        const wait = depth / Math.max(1, cap);
        const util = Math.min(2, lam / Math.max(1, cap));
        hist.push({ d: depth, c: consumers, lam: lam, cap: cap });

        let msg;
        if (event === "scale-up") {
          msg = `Tick ${t}: queue wait crossed 3 ticks → autoscaled to ${consumers} consumers (capacity ${cap}/tick). Scaling on *wait*, not depth — depth alone tells you nothing without throughput.`;
        } else if (event === "scale-down") {
          msg = `Tick ${t}: backlog drained, wait ${r2(wait)} ticks → scaled down to ${consumers} consumers. Scale in slowly; the next spike is always closer than you think.`;
        } else if (event === "shed") {
          msg = `Tick ${t}: shedding — admitting only ${(accept * 100).toFixed(0)}% of arrivals (${dropped} rejected so far). Rejecting cheaply at the door keeps latency bounded for everyone we *do* accept.`;
        } else if (event === "overflow") {
          msg = `Tick ${t}: QUEUE FULL at ${MAXD}. Overflow is now silent data loss — this is why an unbounded queue is a bug and a bounded one needs an explicit full-policy.`;
        } else {
          msg = `Tick ${t}: ${lam} in, ${done} out, depth ${depth}. Little's Law: ${depth} ÷ ${cap}/tick = ${r2(wait)} ticks of delay — that is the number to put in an SLA, not the depth.`;
        }
        if (lam > cap && !event) msg += ` λ=${lam} > μ=${cap}: the queue is growing ${lam - cap}/tick and will not recover on its own.`;

        yield {
          label: msg,
          phase: event || (depth > MAXD * 0.6 ? "backlog" : "steady"),
          state: snap(t, { lam: lam, cap: cap, wait: r2(wait), util: r2(util), event: event })
        };
      }

      const peak = hist.reduce((m, h) => Math.max(m, h.d), 0);
      const capEnd = consumers * MU;
      yield {
        label: `Done: ${enqueued} enqueued, ${processed} processed, ${dropped} rejected/dropped, ${dlq} dead-lettered. Peak depth ${peak} — at ${capEnd}/tick that peak was ${r2(peak / Math.max(1, capEnd))} ticks of user-visible delay. ${POLICY === "none" ? "With no backpressure the queue absorbed everything until it couldn't." : POLICY === "autoscale" ? "Autoscaling converted the spike into consumers instead of latency." : "Shedding converted the spike into honest rejections instead of unbounded latency."}`,
        phase: "done",
        state: snap(T, { cap: capEnd })
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

      const topH = H * 0.46;

      // ---- producer ------------------------------------------------------------
      const py = topH / 2 + 6;
      ctx.fillStyle = C.surface2; ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(16, py - 26, 74, 52, 7); ctx.fill(); ctx.stroke();
      lab(53, py - 4, "producers", C.text2, 11, "center");
      lab(53, py + 12, `λ = ${s.lam}/tick`, s.lam > s.cap ? C.warn : C.muted, 10, "center");

      // ---- queue ---------------------------------------------------------------
      const qx = 106, qw = W * 0.44, qy = py - 22, qh = 44;
      ctx.fillStyle = C.surface2;
      ctx.beginPath(); ctx.roundRect(qx, qy, qw, qh, 6); ctx.fill();
      const fillFrac = Math.min(1, s.depth / Math.max(1, s.maxDepth));
      ctx.fillStyle = fillFrac > 0.85 ? C.danger : fillFrac > 0.5 ? C.warn : C.viz1;
      ctx.beginPath(); ctx.roundRect(qx, qy, Math.max(1, qw * fillFrac), qh, 6); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(qx, qy, qw, qh, 6); ctx.stroke();
      // message tick marks
      const shown = Math.min(40, s.depth);
      for (let i = 0; i < shown; i++) {
        const x = qx + 4 + i * ((qw - 8) / 40);
        ctx.fillStyle = C.surface;
        ctx.fillRect(x, qy + 6, 2, qh - 12);
      }
      lab(qx + qw / 2, qy - 8, `queue depth ${s.depth} / ${s.maxDepth}`, C.text, 12, "center");
      lab(qx + qw / 2, qy + qh + 16, `wait = depth ÷ throughput = ${s.depth} ÷ ${s.cap} = ${s.wait} ticks`, C.text2, 11, "center");
      if (s.event === "shed" || s.event === "overflow") {
        lab(qx + 6, qy + qh + 32, s.event === "shed" ? `shedding: admitting ${(s.accept * 100).toFixed(0)}%` : "OVERFLOW — dropping", C.danger, 11);
      }

      // ---- consumers -----------------------------------------------------------
      const cx0 = qx + qw + 26;
      const nC = s.consumers;
      const ch = Math.min(26, (topH - 20) / Math.max(1, nC));
      for (let i = 0; i < nC; i++) {
        const y = 18 + i * (ch + 5);
        ctx.fillStyle = C.surface; ctx.strokeStyle = C.viz3; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(cx0, y, 116, ch, 5); ctx.fill(); ctx.stroke();
        lab(cx0 + 8, y + ch / 2 + 4, `consumer ${i + 1}`, C.text2, 10);
        const busy = Math.min(1, s.depth > 0 ? 1 : 0);
        ctx.fillStyle = busy ? C.viz3 : C.muted;
        ctx.beginPath(); ctx.arc(cx0 + 104, y + ch / 2, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = s.depth > 0 ? C.viz3 : C.grid; ctx.lineWidth = s.depth > 0 ? 1.6 : 0.8;
        ctx.beginPath(); ctx.moveTo(qx + qw, py); ctx.lineTo(cx0, y + ch / 2); ctx.stroke();
      }
      lab(cx0, 12, `${nC} × ${s.mu} = ${s.cap}/tick`, C.text, 11);
      lab(cx0 + 126, 12, `ρ = ${s.util}`, s.util > 1 ? C.danger : s.util > 0.8 ? C.warn : C.ok, 12);
      lab(cx0 + 126, 30, `processed ${s.processed}`, C.muted, 10);
      lab(cx0 + 126, 46, `dropped ${s.dropped}`, s.dropped ? C.danger : C.muted, 10);
      lab(cx0 + 126, 62, `DLQ ${s.dlq}`, s.dlq ? C.warn : C.muted, 10);

      // ---- queue-depth graph ----------------------------------------------------
      const gx = 46, gy = H - 34, gw = W - 78, gh = H - topH - 62;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy - gh); ctx.lineTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke();
      lab(gx, gy - gh - 8, "queue depth over time (line) and consumer count (steps)", C.muted, 10);
      lab(gx + gw, gy + 14, "tick →", C.muted, 9, "right");

      const scale = Math.max(s.maxDepth, 1);
      // bound line
      const by2 = gy - gh * (s.maxDepth / scale);
      ctx.strokeStyle = C.danger; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, by2); ctx.lineTo(gx + gw, by2); ctx.stroke();
      ctx.setLineDash([]);
      lab(gx - 4, by2 + 4, String(s.maxDepth), C.danger, 9, "right");
      lab(gx - 4, gy + 3, "0", C.muted, 9, "right");

      if (s.hist.length > 1) {
        const X = (i) => gx + (i / Math.max(1, s.T - 1)) * gw;
        // depth
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < s.hist.length; i++) {
          const y = gy - (Math.min(scale, s.hist[i].d) / scale) * gh;
          if (i === 0) ctx.moveTo(X(i), y); else ctx.lineTo(X(i), y);
        }
        ctx.stroke();
        // consumers (right-hand scale, 0..8)
        ctx.strokeStyle = C.viz7; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < s.hist.length; i++) {
          const y = gy - (s.hist[i].c / 8) * gh;
          if (i === 0) ctx.moveTo(X(i), y); else ctx.lineTo(X(i), y);
        }
        ctx.stroke();
        // arrival rate vs capacity
        const maxRate = Math.max(1, ...s.hist.map((h) => Math.max(h.lam, h.cap)));
        ctx.strokeStyle = C.viz2; ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
        ctx.beginPath();
        for (let i = 0; i < s.hist.length; i++) {
          const y = gy - (s.hist[i].lam / maxRate) * gh * 0.4;
          if (i === 0) ctx.moveTo(X(i), y); else ctx.lineTo(X(i), y);
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
      lab(gx + gw - 200, gy - gh + 12, "— depth", C.viz1, 10);
      lab(gx + gw - 132, gy - gh + 12, "— consumers", C.viz7, 10);
      lab(gx + gw - 46, gy - gh + 12, "-- λ", C.viz2, 10);
    }
  },

  drill: {
    cards: [
      { q: "State Little's Law and its practical use here.", a: "L = λ × W, so wait time = queue depth ÷ throughput. A 50,000-message backlog draining at 500/s is a 100-second delay — that's what you report, not the raw depth.", tags: ["littles-law"] },
      { q: "Why provision consumers to ~70% utilization rather than 95%?", a: "Queue wait grows as ρ/(1−ρ): 4 service times at ρ=0.8, 9 at 0.9, 19 at 0.95. Latency explodes long before throughput does, and any jitter at high ρ produces a backlog that takes minutes to drain.", tags: ["numbers"] },
      { q: "Does a queue add capacity?", a: "No. It buffers a temporary mismatch. If λ > μ on average, the queue converts dropped requests into unbounded latency, which is usually worse because it's invisible until it isn't.", tags: ["concept"] },
      { q: "Log (Kafka) vs broker queue (SQS) — when do you pick each?", a: "Log: you need replay, per-partition ordering, or several independent consumer groups; parallelism is capped at partition count and one slow message blocks its partition. Broker: you need per-message ack/retry and arbitrary consumer counts, and total ordering doesn't matter.", tags: ["technology"] },
      { q: "How do you get exactly-once processing?", a: "You ship at-least-once delivery plus an idempotent consumer: a deterministic key and a conditional side effect (unique-constraint insert, upsert, dedup table), with the dedup marker committed in the same transaction as the effect.", tags: ["semantics"] },
      { q: "What's the danger of a poison message in a partitioned log?", a: "It blocks its entire partition if the consumer retries in place forever. Bound retries, then commit the offset and route the payload to a DLQ so the partition can move on.", tags: ["dlq"] },
      { q: "Name the four responses to backpressure.", a: "Scale consumers, shed load at the door, slow the producer (bounded channel / blocking send), or degrade by dropping optional work. Choose by whether the spike is sustained and whether the downstream can absorb more concurrency.", tags: ["backpressure"] },
      { q: "Why is an unbounded queue a bug?", a: "It has no defined failure mode — it just grows until memory or disk dies, with latency rising invisibly. Bound it and choose explicitly: reject, drop-oldest, or block.", tags: ["pitfall"] },
      { q: "How many Kafka partitions do you need?", a: "At least the maximum consumers you'll want in one group, since a partition is read by exactly one member. Size from throughput (10k msg/s ÷ 500 per consumer = 20) and over-provision, because increasing partitions later changes hash(key) % partitions and breaks per-key ordering.", tags: ["kafka"] },
      { q: "Why is a fixed-rate load shedder inferior to an adaptive one?", a: "A hardcoded rps limit is wrong the moment your capacity changes. Trigger shedding on measured pain — p99 latency or queue wait — and recover with AIMD. Make the admit decision deterministic on request id so a retry gets the same verdict rather than amplifying.", tags: ["shedding"] }
    ],
    sixtySecond: [
      "Explain what a queue buys you and what it cannot buy you, using Little's Law to make it concrete.",
      "Your consumer lag is 2 million and climbing. Explain how you'd diagnose and respond in 60 seconds."
    ]
  }
};
