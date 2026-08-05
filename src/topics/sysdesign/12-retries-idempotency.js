export default {
  id: "retries-idempotency",
  track: "sysdesign",
  title: "Timeouts, Retries & Idempotency",
  difficulty: 2,
  minutes: 16,
  tags: ["retries", "idempotency", "timeouts", "backoff", "distributed-systems"],

  explainer: [
    { type: "p", text: "A timeout does not mean \"the request failed.\" It means **\"I don't know what happened.\"** The request may never have reached the server, the server may still be working on it, or — the dangerous case — the server may have already finished and committed the write, and only the *response* was lost or delayed. A client cannot tell these apart from the outside, and the wrong assumption is what causes real incidents." },

    { type: "h3", text: "The double-charge case" },
    { type: "p", text: "A payment request arrives, the server debits the card and commits the transaction, and then the response packet is dropped, or delayed past the client's deadline by a GC pause or a slow network hop. The client's timeout fires. The write already happened — the client just doesn't know it. If the client's retry logic treats \"no response\" as \"nothing happened\" and resends the identical charge, the customer pays twice for something that only cost once server-side." },
    { type: "callout", tone: "pitfall", text: "The timeout told the truth: \"no answer arrived.\" The bug is the client's inference from that truth — \"so it must not have worked\" — which is not a valid deduction. Only an idempotency mechanism turns \"I don't know\" into \"safe to retry regardless.\"" },

    { type: "h3", text: "Idempotency keys" },
    { type: "p", text: "The client generates a unique key per **logical** operation (a UUID, minted once, reused on every retry of that same attempt — never regenerated per retry). The server stores `key → result` in the **same transaction** as the side effect. On a duplicate key, it skips the side effect entirely and replays the stored result." },
    { type: "list", items: [
      "**Naturally idempotent operations**: `PUT` with a full resource representation, `DELETE`, a conditional `UPDATE ... WHERE version = expected`. Repeating them changes nothing after the first success.",
      "**Not naturally idempotent**: `POST /charge`, `INCR`, \"append to this list\" — every repetition is a new side effect unless something external makes it safe.",
      "**The storage race**: writing the idempotency key in a *separate* step from the side effect re-opens the exact race you were closing — a crash between the two leaves you with a charge and no record of its key, or a key and no charge. They must commit atomically."
    ]},

    { type: "h3", text: "Backoff: why retrying immediately makes things worse" },
    { type: "p", text: "If a server is failing because it's overloaded, a client that retries immediately adds load at exactly the moment the server has the least spare capacity — and if many clients fail at once (a shared dependency blips), they all retry in the same instant, in **lockstep**. That synchronized spike is a **retry storm**, and it can keep a recovering server pinned down indefinitely, even after the original blip has passed." },
    { type: "list", items: [
      "**Exponential backoff** — delay grows as `base × 2^attempt`, spacing out an individual client's own retries.",
      "**Full jitter** — delay = `random(0, base × 2^attempt)`, not just a growing delay but a growing *window* the client picks randomly from. Without jitter, every client computes the identical delay and they all retry in the same instant anyway — jitter is what actually desynchronizes them, exponential growth alone does not.",
      "**Retry budgets and circuit breakers** — cap total retries as a fraction of forward traffic (e.g. retries may add at most 10% extra load) and stop retrying entirely once a dependency's error rate crosses a threshold, rather than trusting every individual client's backoff math to save you in aggregate."
    ]},
    { type: "callout", tone: "warn", text: "Retries compound across layers. A client retries 3×, behind a load balancer that retries 2× on 5xx, calling a service mesh that retries 2× on timeout — a single logical request can turn into 12 actual attempts, each adding load exactly when the callee is already struggling. Without a deadline and a retry budget that propagate through the whole call chain, every layer's \"safety\" retry multiplies into everyone else's outage." },
    { type: "callout", tone: "tip", text: "The interview-winning combination: an idempotency key for anything with a side effect, exponential backoff with full jitter for the retry schedule, and a deadline that propagates through the call chain so nested retries can't multiply unboundedly." },

    { type: "h3", text: "Which HTTP methods are safe to retry blindly" },
    { type: "p", text: "`GET`, `HEAD`, `PUT`, `DELETE` are defined as idempotent by the HTTP spec — repeating them should produce the same end state, so a generic client or proxy can retry them automatically. `POST` is not: a generic retry layer must not resend a bare `POST` without an idempotency key, because the spec gives it no such guarantee. This is precisely why payment and order-creation APIs make you pass an explicit idempotency key on `POST` — the protocol itself won't save you." }
  ],

  complexity: {
    rows: [
      { operation: "Naive immediate retry", time: "amplifies load Nx in lockstep", space: "—", note: "adds load exactly when the callee is weakest" },
      { operation: "Exponential backoff", time: "delay = base·2^attempt", space: "—", note: "spaces out one client's own retries" },
      { operation: "Full jitter", time: "delay = random(0, base·2^attempt)", space: "—", note: "the part that actually desynchronizes many clients" },
      { operation: "Idempotency key lookup", time: "O(1)", space: "O(1) per key, needs a TTL", note: "must commit atomically with the side effect" },
      { operation: "Retry budget", time: "capped, e.g. ≤10% of traffic", space: "O(1) counter", note: "protects the callee regardless of any one client's math" }
    ]
  },

  interview: {
    whyAsked: "Almost every real distributed system has this bug somewhere, so interviewers use it to check whether you reason about failure as a first-class case rather than an afterthought. The signal is naming the double-charge scenario unprompted, describing the idempotency-key storage race precisely, and knowing that jitter — not just exponential growth — is what prevents a retry storm.",
    followUps: [
      { q: "Walk through exactly how a timeout can cause a double charge.", a: "The server receives the charge request, debits the card, and commits — the write is real and durable. Before the response reaches the client, it's lost or delayed past the client's timeout. The client sees no answer, assumes failure (an invalid inference — a timeout only means 'unknown'), and retries with a brand-new, indistinguishable request. The server has no way to know this is a duplicate of an already-completed charge, so it charges again. The fix is entirely on the client+server contract: an idempotency key that lets the server recognize the retry as the same logical operation." },
      { q: "Describe an idempotency-key implementation precisely, including the race to avoid.", a: "The client mints a key once per logical operation (not per HTTP attempt) and sends it on every retry of that operation. The server, in the SAME transaction as the side effect, checks for the key: if absent, it performs the effect and stores {key: result} atomically with it; if present, it skips the effect and returns the stored result. The race to avoid is doing this in two steps — e.g. checking the key, then charging, then storing the key — because a crash between any of those steps leaves an inconsistent state: a charge with no recorded key (so the retry double-charges anyway), or a key recorded with no charge (so the retry never happens when it should)." },
      { q: "Why isn't exponential backoff alone enough to prevent a retry storm?", a: "If every client computes the same deterministic delay from the same failure event, they retry in lockstep regardless of how large the delay is — a synchronized spike just arrives later. Jitter is the mechanism that actually spreads clients out in time, by making each client pick randomly from a window rather than a fixed value. 'Full jitter' (uniform over [0, base·2^attempt]) spreads them the most; 'equal jitter' (half fixed, half random) trades some spread for a guaranteed minimum delay. Exponential growth without randomization only makes the periodic spikes farther apart, not less severe." },
      { q: "What is a retry storm and how do you prevent one at the system level?", a: "A retry storm is retries themselves becoming the dominant source of load on a struggling or recovering service — client-side backoff can reduce it but cannot bound it in aggregate, because it only reasons about one client's own behavior. System-level defenses: a retry budget that caps total retries as a fraction of forward traffic across the whole client population, a circuit breaker that stops calling a dependency once its error rate crosses a threshold (failing fast instead of queuing more attempts), and deadline propagation so a request that's already exceeded its budget doesn't get retried again by an inner layer that doesn't know time has run out." },
      { q: "Which HTTP methods can a generic proxy or client retry without an idempotency key?", a: "GET, HEAD, PUT and DELETE are defined as idempotent by HTTP semantics — repeating them is specified to converge to the same end state, so a generic retry layer (a load balancer, an HTTP client library) can safely retry them automatically on a transient failure. POST has no such guarantee in the spec; a generic layer must not retry a bare POST, which is exactly why APIs with side-effecting POSTs (payments, order creation) require an explicit client-supplied idempotency key — the protocol itself provides no safety net there." },
      { q: "How do you prevent retries from multiplying across a call chain of services?", a: "Propagate a single deadline (an absolute timestamp, not a relative timeout) through every hop, and check remaining budget before each layer attempts its own retry — a request with 5ms left should not be retried by an inner service with its own independent 30-second timeout. Combine that with a retry budget per service boundary so at most a bounded fraction of traffic is ever a retry, and prefer that only ONE layer in the chain owns retry policy for a given failure mode rather than every layer independently retrying the same underlying fault." }
    ]
  },

  code: [
    { lang: "python", label: "Idempotency key: atomic check-execute-store", code: "def charge(db, idempotency_key, account_id, amount_cents):\n    with db.transaction():\n        # SELECT ... FOR UPDATE (or an equivalent unique-constraint insert)\n        # so a concurrent duplicate request blocks here instead of racing.\n        existing = db.execute(\n            \"SELECT result FROM idempotency_keys WHERE key = %s FOR UPDATE\",\n            idempotency_key\n        ).fetchone()\n        if existing:\n            return existing.result           # replay -- side effect NEVER re-runs\n\n        result = execute_charge(db, account_id, amount_cents)   # the real side effect\n\n        # Stored in the SAME transaction as the charge. If this commit fails,\n        # the charge itself rolls back too -- there is no window where one\n        # exists without the other.\n        db.execute(\n            \"INSERT INTO idempotency_keys (key, result, created_at) VALUES (%s, %s, now())\",\n            idempotency_key, result\n        )\n        return result\n\n# Client side: mint the key ONCE per logical attempt and reuse it on every\n# retry of that same attempt. Minting a new key per retry defeats the entire\n# mechanism -- the server would see a stream of \"first-time\" requests." },
    { lang: "javascript", label: "Exponential backoff with full jitter", code: "async function withRetry(fn, { maxAttempts = 5, baseMs = 200, maxMs = 8000 } = {}) {\n  for (let attempt = 0; attempt < maxAttempts; attempt++) {\n    try {\n      return await fn();\n    } catch (err) {\n      if (attempt === maxAttempts - 1 || !isRetryable(err)) throw err;\n\n      const cap = Math.min(maxMs, baseMs * 2 ** attempt);\n      // FULL JITTER: pick uniformly from [0, cap], not a fixed growing delay.\n      // This is what desynchronizes many clients failing at the same instant --\n      // exponential growth alone just makes the lockstep spikes farther apart.\n      const delay = Math.random() * cap;\n      await sleep(delay);\n    }\n  }\n}\n\nfunction isRetryable(err) {\n  // Only retry things that MIGHT succeed on a second try. Retrying a 400\n  // (bad request) or a business-logic rejection just wastes a round trip\n  // and adds load for a request that will never succeed.\n  return err.status === 429 || err.status === 503 || err.code === \"ETIMEDOUT\";\n}" },
    { lang: "pseudo", label: "Deadline propagation and a retry budget", code: "# Every hop propagates an ABSOLUTE deadline, not a relative timeout, so an\n# inner service knows how much time is ACTUALLY left, not how much it was\n# originally given.\nfunction handle_request(req, deadline):\n    if now() >= deadline:\n        return error(\"DEADLINE_EXCEEDED\")   # don't even try -- caller has moved on\n\n    remaining = deadline - now()\n    result = call_downstream(req, deadline=deadline, timeout=remaining)\n    return result\n\n# Retry budget: shared across the whole client population calling one\n# dependency, not per-client. Bounds the WORST CASE regardless of how many\n# individual clients decide to retry at once.\nclass RetryBudget:\n    def __init__(self, ratio=0.1, window_s=10):\n        self.ratio, self.window_s = ratio, window_s\n        self.requests = self.retries = 0        # reset every window\n\n    def allow_retry(self):\n        # Never let retries exceed `ratio` of the underlying request volume --\n        # e.g. at most 1 retry for every 10 real requests, system-wide.\n        return self.retries < self.requests * self.ratio\n\n    def record(self, was_retry):\n        if was_retry: self.retries += 1\n        else: self.requests += 1" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 300 },

    params: [
      { key: "idempotent", label: "Idempotency key", type: "enum", options: ["off", "on"], default: "off" },
      { key: "backoff", label: "Retry strategy", type: "enum", options: ["immediate", "exponential-jitter"], default: "immediate" },
      { key: "clients", label: "Concurrent clients", type: "int", min: 5, max: 40, default: 20 },
      { key: "seed", label: "Re-roll timing", type: "seed" }
    ],

    frames: function* (params, rng) {
      const IDEMPOTENT = params.idempotent === "on";
      const BACKOFF = params.backoff;
      const CLIENTS = params.clients;

      // ============================================================ Scene A
      const TIMEOUT_MS = 300;
      const PROCESS_MS = 120 + Math.floor(rng() * 60);
      const RESPONSE_DELAY_MS = TIMEOUT_MS + 80 + Math.floor(rng() * 120);
      const idKey = "idem_7f3a9c";

      let ledgerTotal = 0;
      const events = [];
      const pushA = (t, who, what, kind) => { events.push({ t, who, what, kind }); };

      const snapA = (extra) => Object.assign({
        scene: "A", timeoutMs: TIMEOUT_MS, processMs: PROCESS_MS, responseDelayMs: RESPONSE_DELAY_MS,
        idempotent: IDEMPOTENT, ledgerTotal, events: events.slice(), t: 0
      }, extra || {});

      pushA(0, "client", `POST /charge ($50)${IDEMPOTENT ? ` Idempotency-Key: ${idKey}` : " — no idempotency key"}`, "req");
      yield {
        label: `Client sends a $50 charge${IDEMPOTENT ? " carrying an idempotency key" : " with NO idempotency key"}. Client timeout is ${TIMEOUT_MS} ms.`,
        phase: "send",
        state: snapA({ t: 0 })
      };

      ledgerTotal += 50;
      pushA(PROCESS_MS, "server", `Charges $50, commits to the ledger.`, "commit");
      yield {
        label: `Server finishes the write at t=${PROCESS_MS}ms — the charge is REAL and committed. It now tries to send the response back.`,
        phase: "commit",
        state: snapA({ t: PROCESS_MS })
      };

      yield {
        label: `Client's timeout fires at t=${TIMEOUT_MS}ms. The response is still ${RESPONSE_DELAY_MS - TIMEOUT_MS}ms away. The write already happened — the client just has no way to know that.`,
        phase: "timeout",
        state: snapA({ t: TIMEOUT_MS })
      };

      if (!IDEMPOTENT) {
        pushA(TIMEOUT_MS + 10, "client", `Retries: POST /charge ($50) — a brand-new request with no memory of the first.`, "retry");
        yield {
          label: `Naive retry: a completely new request. The server has no way to recognize this as a duplicate of the first.`,
          phase: "retry",
          state: snapA({ t: TIMEOUT_MS + 10 })
        };

        ledgerTotal += 50;
        pushA(TIMEOUT_MS + 10 + PROCESS_MS, "server", `Charges $50 AGAIN — a second, distinct commit.`, "double");
        yield {
          label: `Server executes the charge again — it had no signal that this was a repeat. Ledger total is now $${ledgerTotal}. The customer was charged twice for one purchase.`,
          phase: "double",
          state: snapA({ t: TIMEOUT_MS + 10 + PROCESS_MS })
        };
      } else {
        pushA(TIMEOUT_MS + 10, "client", `Retries: POST /charge with the SAME Idempotency-Key: ${idKey}.`, "retry");
        yield {
          label: `Retry carries the identical idempotency key as the first attempt — the client reused it rather than minting a new one.`,
          phase: "retry",
          state: snapA({ t: TIMEOUT_MS + 10 })
        };

        pushA(TIMEOUT_MS + 10 + 8, "server", `Looks up "${idKey}" — already committed. Replays the stored result; the ledger is untouched.`, "dedupe");
        yield {
          label: `Server finds "${idKey}" already processed (key and charge were stored in the SAME transaction). It replays the cached response — no second charge. Ledger total stays $${ledgerTotal}.`,
          phase: "dedupe",
          state: snapA({ t: TIMEOUT_MS + 10 + 8 })
        };
      }

      pushA(RESPONSE_DELAY_MS, "server", `Original response FINALLY arrives — late, possibly a duplicate of the retry's response.`, "late");
      yield {
        label: `The FIRST response finally lands at t=${RESPONSE_DELAY_MS}ms, long after the client gave up and (in this run) already retried. Out-of-order duplicate responses are the other half of this problem — clients must tolerate them too.`,
        phase: "late",
        state: snapA({ t: RESPONSE_DELAY_MS })
      };

      yield {
        label: IDEMPOTENT
          ? `Verdict: with an idempotency key, exactly 1 charge landed no matter how many times the client retried. The key must be stored ATOMICALLY with the side effect — a separate storage step reopens the same race.`
          : `Verdict: with no idempotency key, the customer paid $${ledgerTotal} for a $50 purchase. The timeout told the truth ("no answer") — the client's assumption ("so it must have failed") was the bug.`,
        phase: "verdict-a",
        state: snapA({ t: RESPONSE_DELAY_MS })
      };

      // ============================================================ Scene B
      const CAPACITY = 12;
      const TICKS = 30;
      const failTick = 2;

      const load = new Array(TICKS).fill(0);
      for (let t = 0; t < TICKS; t++) load[t] = Math.floor(CAPACITY * 0.35 + rng() * CAPACITY * 0.15);
      load[failTick] += Math.floor(CAPACITY * 0.9);   // the latency blip itself

      const clientDelays = [];
      for (let c = 0; c < CLIENTS; c++) {
        let attempt = 0, tick = failTick + 1;
        const schedule = [];
        while (attempt < 3 && tick < TICKS) {
          schedule.push(tick);
          const delay = BACKOFF === "immediate"
            ? 1
            : Math.max(1, Math.round(rng() * Math.pow(2, attempt) * 2));   // full jitter, base = 2 ticks
          tick += delay;
          attempt += 1;
        }
        clientDelays.push(schedule);
      }

      const liveLoad = load.slice();
      for (const schedule of clientDelays) for (const t of schedule) if (t < TICKS) liveLoad[t] += 1;

      const snapB = (extra) => Object.assign({
        scene: "B", capacity: CAPACITY, ticks: TICKS, load: liveLoad.slice(), backoff: BACKOFF,
        clients: CLIENTS, tickNow: 0, peak: 0, recoveredAt: null
      }, extra || {});

      yield {
        label: `Scene 2: ${CLIENTS} clients share this server. A latency blip at tick ${failTick} makes them ALL time out at nearly the same moment. What they do next decides whether the server recovers.`,
        phase: "storm-init",
        state: snapB({ tickNow: 0 })
      };

      yield {
        label: `Backoff formula: delay = random(0, base·2^attempt) ticks, base=2. Client 0's actual retry ticks under "${BACKOFF}": ${clientDelays[0] ? clientDelays[0].join(", ") : "n/a"}.`,
        phase: "formula",
        state: snapB({ tickNow: 0 })
      };

      let peak = 0, recoveredAt = null;
      for (let t = 0; t < TICKS; t++) {
        peak = Math.max(peak, liveLoad[t]);
        if (recoveredAt === null && t > failTick + 2 && liveLoad[t] <= CAPACITY && liveLoad[Math.max(0, t - 1)] <= CAPACITY) {
          recoveredAt = t;
        }
        const label = (t === 0 || t === TICKS - 1)
          ? `Tick ${t + 1}/${TICKS}: load ${liveLoad[t]} against capacity ${CAPACITY}. Running peak so far: ${peak}. ${BACKOFF === "immediate"
              ? "Immediate retries land in the SAME tick as the failure, stacking on top of it."
              : "Jittered backoff spreads retries across many ticks instead of one."}`
          : `Tick ${t + 1}/${TICKS}: load ${liveLoad[t]}, running peak ${peak} (capacity ${CAPACITY}).`;
        yield {
          label,
          phase: liveLoad[t] > CAPACITY * 1.5 ? "storm" : "steady",
          state: snapB({ tickNow: t + 1, peak, recoveredAt })
        };
      }

      yield {
        label: `Verdict: peak concurrent load hit ${peak} against a capacity of ${CAPACITY} (${(peak / CAPACITY).toFixed(1)}×). ${BACKOFF === "immediate"
          ? `Immediate retries never let the server catch up — the retries themselves ARE the outage now.`
          : `Backoff with jitter kept the peak lower and let the server drain the queue${recoveredAt !== null ? ` by tick ${recoveredAt + 1}` : ""}.`}`,
        phase: "verdict-b",
        state: snapB({ tickNow: TICKS, peak, recoveredAt })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const F = env.font.base, M = env.font.mono;
      const lab = (x, y, t, col, size, align, base) => {
        ctx.fillStyle = col; ctx.font = `${size || 11}px ${base ? F : M}`;
        ctx.textAlign = align || "left"; ctx.fillText(t, x, y);
      };
      const clip = (str, n) => (str.length > n ? str.slice(0, Math.max(1, n - 1)) + "…" : str);
      const KIND_COLOR = { req: C.viz1, commit: C.viz1, retry: C.viz4, double: C.danger, dedupe: C.ok, late: C.muted };

      if (s.scene === "A") {
        lab(16, 22, `client ↔ server timeline`, C.text, 13, "left", true);
        lab(W - 16, 22, `ledger total: $${s.ledgerTotal}`, s.ledgerTotal > 50 ? C.danger : C.ok, 13, "right", true);

        const laneY = { client: 64, server: H - 96 };
        const padX = 96, trackW = W - padX - 32;
        const maxT = Math.max(400, s.responseDelayMs + 40, s.t + 20);
        const tx = (t) => padX + (t / maxT) * trackW;

        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(padX, laneY.client); ctx.lineTo(padX + trackW, laneY.client); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padX, laneY.server); ctx.lineTo(padX + trackW, laneY.server); ctx.stroke();
        lab(16, laneY.client + 4, "CLIENT", C.text2, 11);
        lab(16, laneY.server + 4, "SERVER", C.text2, 11);

        ctx.strokeStyle = C.warn; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(tx(s.timeoutMs), laneY.client - 22); ctx.lineTo(tx(s.timeoutMs), laneY.server + 22); ctx.stroke();
        ctx.setLineDash([]);
        lab(tx(s.timeoutMs), laneY.client - 28, `timeout ${s.timeoutMs}ms`, C.warn, 9, "center");

        for (const ev of s.events) {
          if (ev.t > s.t) continue;
          const y = ev.who === "client" ? laneY.client : laneY.server;
          const x = tx(ev.t);
          const col = KIND_COLOR[ev.kind] || C.viz1;
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
          lab(x, y + (ev.who === "client" ? -14 : 22), clip(ev.what, 30), col, 9, "center");
        }

        if (s.t >= s.responseDelayMs) {
          ctx.strokeStyle = C.muted; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(tx(s.processMs), laneY.server); ctx.lineTo(tx(s.responseDelayMs), laneY.client); ctx.stroke();
          ctx.setLineDash([]);
        }

        lab(padX, H - 20, `t = ${s.t} ms`, C.muted, 11);
      } else {
        lab(16, 22, `${s.clients} clients, backoff: ${s.backoff}`, C.text, 13, "left", true);
        lab(W - 16, 22, `peak load ${s.peak} / capacity ${s.capacity}`, s.peak > s.capacity * 1.5 ? C.danger : C.ok, 12, "right", true);

        const padX = 24, chartTop = 50, chartBottom = H - 42;
        const chartH = chartBottom - chartTop;
        const n = s.load.length;
        const bw = (W - padX * 2) / n;
        const maxV = Math.max(s.capacity * 2, Math.max.apply(null, s.load), 1);

        const capY = chartBottom - (s.capacity / maxV) * chartH;
        ctx.strokeStyle = C.ok; ctx.setLineDash([4, 4]); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(padX, capY); ctx.lineTo(W - padX, capY); ctx.stroke();
        ctx.setLineDash([]);
        lab(W - padX, capY - 6, `capacity ${s.capacity}`, C.ok, 9, "right");

        for (let i = 0; i < n; i++) {
          if (i >= s.tickNow) continue;
          const v = s.load[i];
          const x = padX + i * bw;
          const h = (v / maxV) * chartH;
          const over = v > s.capacity * 1.5;
          ctx.fillStyle = over ? C.danger : (v > s.capacity ? C.warn : C.viz1);
          ctx.beginPath(); ctx.roundRect(x + 1, chartBottom - h, Math.max(1, bw - 2), h, 2); ctx.fill();
        }
        for (let i = s.tickNow; i < n; i++) {
          const x = padX + i * bw;
          ctx.fillStyle = C.surface2;
          ctx.beginPath(); ctx.roundRect(x + 1, chartBottom - 3, Math.max(1, bw - 2), 3, 1); ctx.fill();
        }

        lab(padX, chartBottom + 16, "tick →", C.muted, 10);
        lab(padX, chartTop - 10, `tick ${s.tickNow}/${s.ticks}`, C.muted, 10);
        if (s.recoveredAt !== null) {
          const rx = padX + s.recoveredAt * bw;
          ctx.strokeStyle = C.ok; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(rx, chartTop); ctx.lineTo(rx, chartBottom); ctx.stroke();
          ctx.setLineDash([]);
          lab(rx, chartTop - 10, "recovered", C.ok, 9, "center");
        }
      }
    }
  },

  drill: {
    cards: [
      { q: "What does a timeout actually tell you?", a: "Only that no response arrived before the deadline. It does not tell you whether the request never arrived, is still executing, or already completed and the response was lost — those are indistinguishable from the client's side.", tags: ["timeouts"] },
      { q: "How exactly does a naive retry cause a double charge?", a: "The server executes and commits the write, then the response is lost or delayed past the client's timeout. The client assumes failure and retries with a new, indistinguishable request; the server has no way to recognize it as a duplicate and executes the side effect again.", tags: ["pitfall"] },
      { q: "What must be true of an idempotency key implementation to actually be safe?", a: "The client mints the key once per logical operation and reuses it on every retry (never a new key per attempt). The server stores {key: result} in the SAME transaction as the side effect, so there is no window where one exists without the other.", tags: ["idempotency"] },
      { q: "Name operations that are naturally idempotent and ones that aren't.", a: "Idempotent: PUT with a full resource, DELETE, a conditional UPDATE ... WHERE version = expected. Not idempotent: POST create, INCR, append — each repetition is a distinct side effect unless something external (an idempotency key) makes it safe.", tags: ["idempotency"] },
      { q: "Why is jitter necessary in addition to exponential backoff?", a: "Exponential growth alone still produces a deterministic delay — many clients failing at the same instant compute the same delay and retry in lockstep again, just later. Jitter (randomizing within a window) is what actually desynchronizes them.", tags: ["backoff"] },
      { q: "What is a retry storm, and name two system-level defenses.", a: "Retries themselves becoming the dominant load on a struggling service, preventing recovery. Defenses: a retry budget capping total retries as a fraction of forward traffic across all clients, and a circuit breaker that stops calling a failing dependency once its error rate crosses a threshold.", tags: ["retry-storm"] },
      { q: "Which HTTP methods can a generic proxy retry without an idempotency key?", a: "GET, HEAD, PUT, DELETE — defined as idempotent by the spec. POST has no such guarantee, which is why side-effecting POST endpoints (payments, order creation) require an explicit client-supplied idempotency key.", tags: ["http"] },
      { q: "How do retries multiply across a call chain, and what prevents it?", a: "Each layer (client, load balancer, service mesh) may retry independently on the same underlying failure, so a single logical request can become many actual attempts. Prevent it with an absolute deadline propagated through every hop and a retry budget owned by one layer per failure mode.", tags: ["deadline-propagation"] }
    ],
    sixtySecond: [
      "Explain how a timeout can cause a double charge even though the timeout itself reported the truth, and how an idempotency key fixes it.",
      "Explain exponential backoff with full jitter, why jitter specifically is necessary, and how a retry storm happens without it."
    ]
  }
};
