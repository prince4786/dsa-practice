export default {
  id: "retries-idempotency",
  track: "sysdesign",
  title: "Timeouts, Retries & Idempotency",
  difficulty: 2,
  minutes: 16,
  tags: ["retries", "idempotency", "timeouts", "backoff", "distributed-systems"],

  explainer: [
    { type: "p", text: "When a request times out, that does not mean \"the request failed.\" All it actually means is **\"I never got an answer back in time — I genuinely don't know what happened.\"** There are three real possibilities hiding behind that single timeout: the request may never have actually reached the server at all, the server may still be quietly working on it, or — the dangerous case — the server may have already finished the work and committed it permanently, and only the *response* telling the client about that success got lost or arrived too late. From the client's point of view, sitting outside the server, these three situations are completely indistinguishable. Real production incidents happen when a client silently assumes it knows which one occurred, and guesses wrong." },

    { type: "h3", text: "The double-charge case, walked through" },
    { type: "p", text: "Imagine a payment request arrives at a server, the server debits the customer's card and permanently commits that transaction — and then, purely by bad luck, the response packet telling the client \"success\" gets dropped by the network, or arrives late because of a GC pause (a garbage-collection pause — a brief freeze some programming languages trigger to clean up memory) or a slow network hop somewhere along the way. The client's own timeout fires before that response arrives. The charge already happened for real — the client simply has no way of knowing that. If the client's retry logic treats \"I got no response\" as equivalent to \"nothing happened, so it's safe to try again,\" and it resends the exact same charge request, the customer ends up paying twice for something that only cost the business once." },
    { type: "callout", tone: "pitfall", text: "The timeout itself told the truth: \"no answer arrived in time.\" The actual bug is the client's next mental leap — \"...so it must not have worked\" — which is simply not a valid conclusion to draw from a timeout. Only a proper idempotency mechanism can turn \"I don't know what happened\" into \"it's genuinely safe to retry no matter what actually happened the first time.\"" },

    { type: "h3", text: "Idempotency keys — how you make a retry provably safe" },
    { type: "p", text: "An **idempotent** operation is one where doing it once and doing it five times produces exactly the same end result — repeating it changes nothing further. The client generates one unique key per **logical** operation — commonly a UUID (a randomly generated unique identifier), minted exactly once and reused on every retry attempt of that *same* logical operation, never regenerated fresh on each retry. The server then stores a mapping from `key → result` in the **very same transaction** as the actual side effect it performs. If the server later sees a request carrying a key it's already seen before, it skips redoing the side effect entirely, and simply replays back the previously stored result instead." },
    { type: "list", items: [
      "**Operations that are naturally idempotent already**: `PUT` with a full resource representation (replacing a whole object with the same new version every time), `DELETE` (deleting something already deleted just does nothing further), or a conditional `UPDATE ... WHERE version = expected` (which only applies once, since the version condition stops matching afterward). Repeating any of these after the first success changes nothing.",
      "**Operations that are not naturally idempotent**: `POST /charge`, an `INCR` (increment) operation, or \"append this item to a list\" — every single repetition of these is a brand-new, distinct side effect, unless something external is explicitly added to make repeating them safe.",
      "**The storage race to watch for**: writing the idempotency key as a *separate* step from performing the actual side effect reopens the exact same race condition you were trying to close in the first place — a crash landing between those two steps can leave you with a completed charge and no record of its key (so a retry charges again), or a recorded key with no matching charge (so a legitimate retry never actually happens when it should). The key and the side effect must be committed together, atomically, as one unit."
    ]},

    { type: "h3", text: "Backoff: why retrying immediately makes a bad situation worse" },
    { type: "p", text: "If a server is failing specifically because it's overloaded, a client that retries its request immediately adds fresh load at precisely the moment the server has the least spare capacity to handle it. Worse, if many different clients all happen to experience a failure at the same moment — because a shared dependency they all rely on had a brief blip — they will all retry at essentially the same instant too, in **lockstep** with each other. That synchronized spike of simultaneous retries is called a **retry storm**, and it can keep an already-struggling server pinned down indefinitely, well after the original blip that started it all has actually passed." },
    { type: "list", items: [
      "**Exponential backoff** — the delay before each successive retry grows as `base × 2^attempt` (so it roughly doubles each time), spacing out one individual client's own sequence of retries over time.",
      "**Full jitter** — instead of a fixed, growing delay, compute `delay = random(0, base × 2^attempt)`: a growing *window* that the client then picks a random value from, rather than a single deterministic number. This distinction matters enormously: without randomization, every client experiencing the same failure computes the exact same delay and they all retry in lockstep again regardless of how large that delay has grown. **Jitter is the specific ingredient that actually desynchronizes many clients from each other — exponential growth alone does not.**",
      "**Retry budgets and circuit breakers** — cap the total volume of retries allowed as a fraction of normal forward traffic (for example, \"retries may never add more than 10% extra load\"), and stop attempting to call a dependency entirely once its observed error rate crosses some threshold — rather than trusting every individual client's own backoff math to somehow add up to something safe in aggregate."
    ]},
    { type: "callout", tone: "warn", text: "Retries compound as they pass across layers. A client retries up to 3 times; behind it, a load balancer independently retries up to 2 times on a 5xx (server error) response; behind that, a service mesh (a networking layer that manages traffic between internal services) retries up to 2 more times on a timeout. A single logical request can silently balloon into 12 actual attempts reaching the struggling backend, each one adding load at exactly the moment it's least welcome. Without a shared deadline and a retry budget that propagate consistently through the entire call chain, each individual layer's own well-intentioned \"safety\" retry logic multiplies together into everyone else's outage." },
    { type: "callout", tone: "tip", text: "The interview-winning combination to name: an idempotency key for anything that has a side effect, exponential backoff with full jitter for the retry schedule itself, and a deadline that propagates through the entire call chain so that nested retries at different layers can't multiply into each other unboundedly." },

    { type: "h3", text: "Which HTTP methods are safe to retry without an idempotency key" },
    { type: "p", text: "`GET`, `HEAD`, `PUT`, and `DELETE` are all formally defined as idempotent by the HTTP specification itself — repeating any of them is specified to converge to the same end result, so a generic client library or proxy is allowed to retry them automatically without needing anything extra. `POST` is different: the specification makes no such promise about it, so a generic retry layer must never blindly resend a bare `POST` request. This is exactly why APIs involving payments or order creation require you to explicitly pass an idempotency key on `POST` requests — the underlying protocol itself provides no safety net there at all." }
  ],

  glossary: [
    { term: "Timeout", plain: "A client giving up on waiting for a response after a set amount of time. It only tells you that no answer arrived in time — it does not tell you whether the underlying work actually happened or not." },
    { term: "Idempotent operation", plain: "An operation where performing it once and performing it many times produce the exact same final result, making it safe to retry without worrying about unwanted side effects piling up." },
    { term: "Idempotency key", plain: "A unique identifier generated once per logical operation and reused on every retry of that same attempt, letting a server recognize a retry as a duplicate of a request it already handled rather than as a brand-new one." },
    { term: "GC pause (garbage collection pause)", plain: "A brief pause some programming languages (Java, Go, and others) trigger to reclaim memory that's no longer in use, during which the program does no useful work — sometimes long enough to cause a request to time out." },
    { term: "Exponential backoff", plain: "A retry strategy where the delay before each successive retry roughly doubles, spreading a single client's own retries further apart over time." },
    { term: "Jitter (full jitter)", plain: "Adding randomness to a retry delay — picking a random value from a growing range rather than a fixed number — so that many clients failing at the same moment don't all retry at exactly the same instant as each other." },
    { term: "Retry storm", plain: "A situation where retries themselves, from many clients at once, become the dominant source of load on a struggling service, preventing it from recovering." },
    { term: "Retry budget", plain: "A cap on how many retries a system allows as a fraction of its normal traffic volume, preventing retries in aggregate from overwhelming a dependency regardless of how any single client behaves." },
    { term: "Circuit breaker", plain: "A safety mechanism that stops sending requests to a dependency entirely once it's clearly failing, rather than continuing to pile on load that will likely just fail anyway." },
    { term: "Deadline propagation", plain: "Passing a single absolute cutoff time through every layer of a call chain, so that an inner service knows exactly how much time is genuinely left rather than starting its own independent timer from zero." },
    { term: "Service mesh", plain: "A networking layer that manages and observes traffic passing between a system's internal services, often handling things like retries, timeouts, and encryption automatically." },
    { term: "5xx (server error)", plain: "The family of HTTP status codes from 500-599, indicating the server itself failed to fulfill a request, as opposed to the client having made a bad request." }
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
