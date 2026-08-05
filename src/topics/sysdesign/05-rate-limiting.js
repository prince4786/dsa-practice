export default {
  id: "rate-limiting",
  track: "sysdesign",
  title: "Rate Limiters",
  difficulty: 2,
  minutes: 15,
  tags: ["rate-limiting", "token-bucket", "sliding-window", "backpressure", "429"],

  explainer: [
    { type: "p", text: "A rate limiter answers one question — *may this request proceed right now?* — and the four common algorithms differ only in how they remember the past. Everything else (where it runs, what you key it on, what you return) is where the real interview happens." },

    { type: "h3", text: "The four algorithms" },
    { type: "list", items: [
      "**Fixed window** — a counter per (key, window), reset on the boundary. One integer, one `INCR` with a TTL, O(1) memory. **Flaw: it permits 2× the limit across a boundary** — 100 requests in the last instant of one minute and 100 in the first instant of the next is 200 requests in a two-millisecond span, all legal.",
      "**Sliding window log** — store a timestamp per request, drop the ones older than the window, count what's left. Exactly correct, and it costs O(limit) memory *per key* — 10,000 users × a limit of 1,000 is 10M timestamps.",
      "**Sliding window counter** — keep the previous window's count and the current one, and interpolate: `prev × (1 − elapsed/window) + cur`. Two integers, ~0.003% error in practice, no boundary burst. **This is the production default for HTTP APIs** and what Cloudflare published numbers for.",
      "**Token bucket** — a bucket of capacity `B` refilled at `r` tokens/sec; a request costs one token. Allows a burst of up to `B` and then a steady `r`. Two numbers (token count, last refill time) and it is *lazily* computed, so no background timer. **This is the default for anything where a burst is legitimate.**",
      "**Leaky bucket (as a queue)** — requests queue and drain at a fixed rate. Perfectly smooth output, but it adds latency and can hold stale requests; use it for traffic *shaping* (outbound calls to a partner API), not for rejecting inbound traffic."
    ]},

    { type: "callout", tone: "tip", text: "The one-sentence answer: **token bucket when bursts are legitimate, sliding-window counter when a hard cap matters.** Both are O(1) memory. Say which and why — that is the whole signal." },

    { type: "h3", text: "Where does it run?" },
    { type: "p", text: "A per-instance in-memory limiter is exact only if you have one instance. With 20 API servers and a 1,000 rps limit, each gets 50 rps — and load isn't even, so you either reject legitimate traffic or overshoot. The fixes, in ascending cost:" },
    { type: "list", items: [
      "**Centralized counter (Redis)** — correct, but adds ~1 ms and a hard dependency on the round trip. Must be atomic: a Lua script or `INCR`+`EXPIRE` in one call, never read-then-write.",
      "**Local with periodic sync** — each instance limits locally against a share and reconciles with the central store every few hundred ms. Slightly over-permissive, no per-request latency. What large gateways actually do.",
      "**At the edge / L7 proxy** — cheapest of all: the request never reaches your application. Combine with a coarse global limit at the edge and a precise per-user one at the service."
    ]},

    { type: "h3", text: "What you key on, and what you return" },
    { type: "list", items: [
      "Key on the **authenticated principal** (API key, user id) wherever possible — IP is a proxy for identity, and NAT means one office shares one IP while an attacker rents ten thousand.",
      "Layer the limits: per-user, per-endpoint (a search endpoint costs 100× a health check — charge tokens by cost, not by request), and a global circuit-breaker limit for the service as a whole.",
      "Return **429 Too Many Requests** with `Retry-After: <seconds>`, plus `RateLimit-Limit` / `RateLimit-Remaining` / `RateLimit-Reset`. A limiter that doesn't tell clients when to come back guarantees a retry storm.",
      "**503 vs 429**: 429 means *you* sent too much, 503 means *we* are overloaded. Different client behaviour; don't conflate them."
    ]},

    { type: "callout", tone: "pitfall", text: "Rejecting a request must be much cheaper than serving it, or the limiter is the outage. If your 429 path does a database lookup for the user's plan tier, an attack that trips the limiter still takes you down. Cache the limit config, and put the check before authentication where you can." },

    { type: "h3", text: "Back-of-envelope" },
    { type: "p", text: "10M users, a 100 req/min limit, sliding-window counter: 2 integers plus a key per user ≈ 100 bytes in Redis → **1 GB**, and only for *active* users if you TTL the keys, so realistically ~50 MB. The same limit with a sliding window *log* would be 10M × 100 timestamps × 8 bytes = **8 GB** — that is the trade-off made concrete." },

    { type: "callout", tone: "warn", text: "Rate limiting is not the same as load shedding. A rate limiter enforces a *contract* (fairness, billing tiers). Load shedding protects the *service* by dropping work when latency or queue depth rises, regardless of who sent it. A resilient service needs both, and the shedder must be adaptive rather than a fixed number." }
  ],

  complexity: {
    rows: [
      { operation: "Fixed window", time: "O(1)", space: "O(1) per key", note: "2× burst at the boundary" },
      { operation: "Sliding window log", time: "O(log n) / O(n) trim", space: "O(limit) per key", note: "exact, expensive" },
      { operation: "Sliding window counter", time: "O(1)", space: "O(1) per key (2 ints)", note: "~0.003% error, no boundary burst" },
      { operation: "Token bucket", time: "O(1) lazy refill", space: "O(1) per key", note: "burst B then steady r" },
      { operation: "Distributed check", time: "+1 RTT (~1 ms)", space: "O(active keys)", note: "must be atomic — Lua or INCR+EXPIRE" }
    ]
  },

  interview: {
    whyAsked: "Every API design turns into this, and it separates people who memorized four algorithm names from people who can say which one they'd ship. The signal: naming the fixed-window boundary flaw unprompted, choosing between burst tolerance and a hard cap deliberately, and handling the distributed case without hand-waving.",
    followUps: [
      { q: "What exactly is wrong with a fixed window?", a: "It has no memory across the boundary, so a client can spend its full quota in the last moment of window k and the full quota again in the first moment of window k+1 — 2× the limit inside a span shorter than one window. With a 100/min limit that is 200 requests in a couple of milliseconds, which is precisely the spike the limiter existed to prevent. The sliding window counter fixes it for the cost of one extra integer: weight the previous window's count by the fraction of it still inside the rolling window." },
      { q: "Token bucket or sliding window — which do you ship?", a: "Token bucket when a burst is legitimate and the constraint is average throughput — user-facing APIs where somebody opening ten tabs shouldn't be punished, or any client doing batch work. Sliding-window counter when the limit is a hard contractual or safety cap where 'briefly 3× the rate' is unacceptable — a downstream partner's quota, or a limit protecting a fragile dependency. Both are O(1) memory and O(1) time, so the choice is purely about whether bursts are a feature or a hazard." },
      { q: "How do you rate limit across 50 servers?", a: "The exact answer is a shared atomic counter in Redis — one Lua script per check so the read-modify-write can't interleave — at the cost of ~1 ms per request and a hard dependency you must fail open or closed deliberately. The practical answer at high volume is local limiting with periodic reconciliation: each instance gets a share of the budget, enforces locally with zero latency, and syncs with the central store every ~200 ms, redistributing unused budget. You accept a small overshoot during the sync interval in exchange for removing Redis from the request path." },
      { q: "What happens when Redis, holding your counters, goes down?", a: "You must decide in advance. **Fail open** keeps the service available and gives up enforcement — right for a limiter that exists for fairness. **Fail closed** protects a fragile downstream and turns a Redis outage into a full outage — almost never right for user-facing traffic. The good middle ground is to fail over to a local in-memory limiter with a conservative per-instance share, so you keep approximate enforcement without the dependency. Whatever you choose, say it out loud and alarm on it." },
      { q: "Should you rate limit by IP?", a: "Only as a blunt outer layer. One corporate NAT or mobile carrier gateway shares an IP among thousands of users, so a per-IP limit either punishes them or is too loose to matter, and IPv6 gives an attacker a /64 with more addresses than you can track. Key on the authenticated principal for real limits, use IP limits only for unauthenticated endpoints like login and signup, and there prefer limits keyed on (IP, endpoint) with a low ceiling plus a proof-of-work or CAPTCHA escalation." },
      { q: "How do you handle expensive endpoints under one limit?", a: "Charge variable cost: a token bucket where a request debits tokens proportional to its expected cost — a report query costs 50 tokens, a health check costs 1. That converts a request-rate limit into a work-rate limit, which is what you actually care about. GitHub's GraphQL API does exactly this. Pair it with a concurrency limit (max in-flight per user) because cost estimates are always wrong and concurrency bounds the damage." },
      { q: "Client side: what should a well-behaved client do on 429?", a: "Read `Retry-After` and honour it; if absent, exponential backoff with full jitter. Never retry immediately, never retry synchronously in a tight loop, and maintain a retry budget so retries are capped at a small percentage of total requests. Ideally rate limit yourself client-side against the published limit so you rarely see a 429 at all." }
    ]
  },

  code: [
    { lang: "python", label: "Token bucket (lazy refill — no timer)", code: "import time\n\nclass TokenBucket:\n    \"\"\"Allows a burst of `capacity`, then a steady `rate` per second.\n    No background thread: tokens are computed from elapsed time on demand.\"\"\"\n    def __init__(self, capacity, rate):\n        self.capacity = float(capacity)\n        self.rate = float(rate)\n        self.tokens = float(capacity)\n        self.last = time.monotonic()\n\n    def allow(self, cost=1.0):\n        now = time.monotonic()\n        self.tokens = min(self.capacity,\n                          self.tokens + (now - self.last) * self.rate)\n        self.last = now\n        if self.tokens >= cost:\n            self.tokens -= cost          # variable cost => work-rate limiting\n            return True, 0.0\n        # Tell the client exactly when to come back: Retry-After.\n        return False, (cost - self.tokens) / self.rate" },
    { lang: "python", label: "Sliding window counter (the production default)", code: "def allow(redis, key, limit, window_s, now):\n    \"\"\"Two counters, O(1) memory, no boundary burst.\"\"\"\n    cur_win  = int(now // window_s)\n    elapsed  = (now % window_s) / window_s          # 0.0 .. 1.0 through the window\n\n    cur_key  = f\"{key}:{cur_win}\"\n    prev_key = f\"{key}:{cur_win - 1}\"\n\n    prev = int(redis.get(prev_key) or 0)\n    cur  = int(redis.get(cur_key) or 0)\n\n    # Weight the previous window by how much of it is still inside the\n    # rolling window. THIS is what a fixed window is missing.\n    estimate = prev * (1 - elapsed) + cur\n    if estimate >= limit:\n        return False\n\n    pipe = redis.pipeline()\n    pipe.incr(cur_key)\n    pipe.expire(cur_key, window_s * 2)              # keep it for the next window's math\n    pipe.execute()\n    return True" },
    { lang: "javascript", label: "Atomic distributed token bucket (Redis Lua)", code: "// One round trip, no read-then-write race. Returns [allowed, retryAfterMs].\nconst SCRIPT = `\n  local key      = KEYS[1]\n  local rate     = tonumber(ARGV[1])   -- tokens per second\n  local cap      = tonumber(ARGV[2])\n  local now      = tonumber(ARGV[3])   -- ms, from the CALLER (clock skew is yours to own)\n  local cost     = tonumber(ARGV[4])\n\n  local b = redis.call('HMGET', key, 'tokens', 'ts')\n  local tokens = tonumber(b[1]) or cap\n  local ts     = tonumber(b[2]) or now\n\n  tokens = math.min(cap, tokens + (now - ts) * rate / 1000)\n\n  local allowed = 0\n  local retry   = 0\n  if tokens >= cost then\n    tokens  = tokens - cost\n    allowed = 1\n  else\n    retry = math.ceil((cost - tokens) * 1000 / rate)\n  end\n\n  redis.call('HMSET', key, 'tokens', tokens, 'ts', now)\n  redis.call('PEXPIRE', key, math.ceil(cap * 1000 / rate) + 1000)  -- idle keys die\n  return { allowed, retry }\n`;\n\nasync function check(user, cost = 1) {\n  try {\n    const [ok, retry] = await redis.eval(SCRIPT, 1, `rl:${user}`,\n                                         RATE, CAP, Date.now(), cost);\n    return { ok: ok === 1, retryAfterMs: retry };\n  } catch (err) {\n    // FAIL OPEN, and alarm. Decide this deliberately, not by accident.\n    metrics.increment(\"ratelimit.backend_down\");\n    return { ok: true, retryAfterMs: 0 };\n  }\n}" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 320 },

    params: [
      { key: "limit", label: "Limit per window", type: "int", min: 3, max: 20, default: 8 },
      { key: "window", label: "Window (ticks)", type: "int", min: 6, max: 20, default: 10 },
      { key: "ticks", label: "Timeline (ticks)", type: "int", min: 20, max: 60, default: 34 },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const L = params.limit;
      const W = params.window;
      const T = params.ticks;
      const rate = L / W;                     // tokens per tick, so all three agree on average

      // ---- one traffic trace, replayed through all three limiters -------------
      // Deliberately quiet, then a boundary-straddling burst, then steady load.
      const arrivals = [];                    // arrival tick per request
      const burstStart = W - 2;               // end of window 0
      for (let t = 0; t < T; t++) {
        let k;
        if (t >= burstStart && t < burstStart + 4) k = Math.ceil(L / 2);   // the boundary burst
        else if (t < 3) k = 0;
        else k = rng() < 0.55 ? 1 : 0;
        for (let j = 0; j < k; j++) arrivals.push(t);
      }

      // limiter state
      let tokens = L;                          // token bucket, capacity L
      let fixedWin = 0, fixedCount = 0;        // fixed window
      let slidePrev = 0, slideCur = 0, slideWin = 0;

      const okTicks = { bucket: [], fixed: [], slide: [] };
      const marks = [];                        // { t, bucket, fixed, slide }
      const stats = { bucket: { a: 0, d: 0 }, fixed: { a: 0, d: 0 }, slide: { a: 0, d: 0 } };

      const maxInWindow = (ts) => {
        let best = 0;
        for (let i = 0; i < ts.length; i++) {
          let c = 0;
          for (let j = i; j < ts.length; j++) if (ts[j] - ts[i] < W) c += 1;
          if (c > best) best = c;
        }
        return best;
      };

      const r2 = (x) => Math.round(x * 100) / 100;
      const snap = (t, extra) => Object.assign({
        t: t, T: T, W: W, L: L, rate: r2(rate),
        tokens: r2(tokens), fixedCount: fixedCount, fixedWin: fixedWin,
        slidePrev: slidePrev, slideCur: slideCur,
        slideEst: r2(slidePrev * (1 - ((t % W) / W)) + slideCur),
        marks: marks.slice(),
        stats: { bucket: { a: stats.bucket.a, d: stats.bucket.d }, fixed: { a: stats.fixed.a, d: stats.fixed.d }, slide: { a: stats.slide.a, d: stats.slide.d } },
        maxBucket: 0, maxFixed: 0, maxSlide: 0,
        cur: null
      }, extra || {});

      yield {
        label: `One traffic trace, three limiters, identical budget: ${L} requests per ${W}-tick window (token bucket: capacity ${L}, refill ${r2(rate)}/tick). Watch the window boundary at tick ${W}.`,
        phase: "init",
        state: snap(0)
      };

      let lastTick = 0;
      for (let i = 0; i < arrivals.length; i++) {
        const t = arrivals[i];

        // advance time to t
        if (t > lastTick) {
          tokens = Math.min(L, tokens + (t - lastTick) * rate);
          lastTick = t;
        }
        const win = Math.floor(t / W);
        if (win !== fixedWin) {
          yield {
            label: `Tick ${t}: fixed window ${fixedWin} → ${win}. Its counter resets to 0 — the ${fixedCount} requests it just allowed are forgotten instantly. That amnesia is the flaw.`,
            phase: "boundary",
            state: snap(t, { cur: null })
          };
          fixedWin = win;
          fixedCount = 0;
        }
        if (win !== slideWin) {
          slidePrev = slideCur;
          slideCur = 0;
          slideWin = win;
        }

        // --- three independent decisions on the SAME request ------------------
        const bucketOk = tokens >= 1;
        if (bucketOk) { tokens -= 1; stats.bucket.a += 1; okTicks.bucket.push(t); } else stats.bucket.d += 1;

        const fixedOk = fixedCount < L;
        if (fixedOk) { fixedCount += 1; stats.fixed.a += 1; okTicks.fixed.push(t); } else stats.fixed.d += 1;

        const elapsed = (t % W) / W;
        const est = slidePrev * (1 - elapsed) + slideCur;
        const slideOk = est < L;
        if (slideOk) { slideCur += 1; stats.slide.a += 1; okTicks.slide.push(t); } else stats.slide.d += 1;

        marks.push({ t: t, bucket: bucketOk ? 1 : 0, fixed: fixedOk ? 1 : 0, slide: slideOk ? 1 : 0 });

        const denied = [!bucketOk && "token bucket", !fixedOk && "fixed window", !slideOk && "sliding window"].filter(Boolean);
        yield {
          label: `Tick ${t}, request #${i + 1}: ` +
            `bucket ${bucketOk ? "ALLOW" : "429"} (${r2(tokens)} tokens left), ` +
            `fixed ${fixedOk ? "ALLOW" : "429"} (${fixedCount}/${L} in window ${win}), ` +
            `sliding ${slideOk ? "ALLOW" : "429"} (est ${r2(est)}/${L}).` +
            (denied.length ? ` Rejected by: ${denied.join(", ")}.` : ""),
          phase: denied.length ? "reject" : "allow",
          state: snap(t, { cur: { t: t, bucket: bucketOk ? 1 : 0, fixed: fixedOk ? 1 : 0, slide: slideOk ? 1 : 0, i: i + 1 } })
        };
      }

      const mb = maxInWindow(okTicks.bucket), mf = maxInWindow(okTicks.fixed), ms = maxInWindow(okTicks.slide);
      yield {
        label: `Verdict over ${arrivals.length} requests. Worst ${W}-tick span each limiter actually permitted: ` +
          `token bucket ${mb}, fixed window ${mf}, sliding window ${ms} — against a configured limit of ${L}. ` +
          `The fixed window let through ${(mf / L).toFixed(2)}× its own limit by straddling the boundary; the sliding window counter never exceeds it. ` +
          `429s: bucket ${stats.bucket.d}, fixed ${stats.fixed.d}, sliding ${stats.slide.d}.`,
        phase: "done",
        state: snap(T, { maxBucket: mb, maxFixed: mf, maxSlide: ms })
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

      // ---- token bucket tank (left) ------------------------------------------
      const bx = 34, by = 44, bw = 46, bh = H - 132;
      lab(bx - 18, 24, "token bucket", C.text, 12, "left", true);
      ctx.fillStyle = C.surface2;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.fill();
      const fillH = Math.max(0, Math.min(1, s.tokens / s.L)) * bh;
      ctx.fillStyle = s.tokens >= 1 ? C.viz1 : C.danger;
      ctx.beginPath(); ctx.roundRect(bx, by + bh - fillH, bw, fillH, 6); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, 6); ctx.stroke();
      for (let k = 0; k <= s.L; k++) {
        const y = by + bh - (k / s.L) * bh;
        ctx.strokeStyle = C.border;
        ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + 6, y); ctx.stroke();
      }
      lab(bx + bw / 2, by + bh + 16, `${s.tokens}`, C.text, 13, "center");
      lab(bx + bw / 2, by + bh + 30, `cap ${s.L}`, C.muted, 9, "center");
      lab(bx + bw / 2, by - 8, `+${s.rate}/tick`, C.viz3, 9, "center");

      // ---- timeline ------------------------------------------------------------
      const tx = bx + bw + 60, tw = W - tx - 150;
      const laneY = [78, 78 + 62, 78 + 124];
      const laneName = ["token bucket", "fixed window", "sliding window"];
      const laneKey = ["bucket", "fixed", "slide"];
      const px = (t) => tx + (t / Math.max(1, s.T)) * tw;

      // window bands + boundary lines
      for (let wnum = 0; wnum * s.W <= s.T; wnum++) {
        const x0 = px(wnum * s.W);
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(x0, 52); ctx.lineTo(x0, laneY[2] + 26); ctx.stroke();
        ctx.setLineDash([]);
        lab(x0 + 3, 48, `w${wnum}`, C.muted, 9);
      }
      // "now" marker
      ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(px(s.t), 52); ctx.lineTo(px(s.t), laneY[2] + 26); ctx.stroke();

      for (let l = 0; l < 3; l++) {
        const y = laneY[l];
        lab(tx - 8, y + 4, laneName[l], C.text2, 10, "right");
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(tx, y + 14); ctx.lineTo(tx + tw, y + 14); ctx.stroke();

        for (let i = 0; i < s.marks.length; i++) {
          const m = s.marks[i];
          const ok = m[laneKey[l]] === 1;
          const x = px(m.t) + ((i % 5) - 2) * 2.2;
          ctx.fillStyle = ok ? C.viz3 : C.danger;
          ctx.beginPath(); ctx.arc(x, y + (ok ? 2 : -8), ok ? 3.2 : 3.8, 0, Math.PI * 2); ctx.fill();
          if (!ok) {
            ctx.strokeStyle = C.danger; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x, y - 4); ctx.lineTo(x, y + 12); ctx.stroke();
          }
        }
        const st = s.stats[laneKey[l]];
        lab(tx + tw + 12, y + 4, `${st.a} ok / ${st.d} × 429`, st.d > 0 ? C.text2 : C.muted, 10);
      }
      lab(tx, laneY[2] + 42, "tick →   ● allowed (below the line)   ✕ 429 (above)", C.muted, 10);

      // ---- counters -------------------------------------------------------------
      const cy = H - 62;
      lab(tx, cy, `fixed window ${s.fixedWin}: ${s.fixedCount}/${s.L}`, s.fixedCount >= s.L ? C.danger : C.text2, 12);
      const fbw = 150;
      ctx.fillStyle = C.surface2;
      ctx.beginPath(); ctx.roundRect(tx, cy + 8, fbw, 12, 3); ctx.fill();
      ctx.fillStyle = s.fixedCount >= s.L ? C.danger : C.viz1;
      ctx.beginPath(); ctx.roundRect(tx, cy + 8, Math.min(1, s.fixedCount / s.L) * fbw, 12, 3); ctx.fill();

      lab(tx + fbw + 30, cy, `sliding estimate: ${s.slideEst}/${s.L}`, s.slideEst >= s.L ? C.danger : C.text2, 12);
      ctx.fillStyle = C.surface2;
      ctx.beginPath(); ctx.roundRect(tx + fbw + 30, cy + 8, fbw, 12, 3); ctx.fill();
      ctx.fillStyle = s.slideEst >= s.L ? C.danger : C.viz1;
      ctx.beginPath(); ctx.roundRect(tx + fbw + 30, cy + 8, Math.min(1, s.slideEst / s.L) * fbw, 12, 3); ctx.fill();
      lab(tx + fbw + 30, cy + 34, `prev ${s.slidePrev} × (1 − elapsed) + cur ${s.slideCur}`, C.muted, 9);

      if (s.maxFixed > 0) {
        lab(tx, cy + 34, `worst ${s.W}-tick span allowed — bucket ${s.maxBucket}, fixed ${s.maxFixed}, sliding ${s.maxSlide}  (limit ${s.L})`, C.warn, 11);
      }
    }
  },

  drill: {
    cards: [
      { q: "What is the fixed-window boundary flaw?", a: "The counter resets at the boundary with no memory, so a client can use its full quota just before and just after — 2× the limit inside a span shorter than one window.", tags: ["fixed-window", "pitfall"] },
      { q: "How does a sliding window counter fix it, and what does it cost?", a: "It keeps the previous window's count and interpolates: `prev × (1 − elapsed/window) + cur`. One extra integer per key, O(1) time, ~0.003% error in practice.", tags: ["sliding-window"] },
      { q: "Token bucket in one sentence.", a: "A bucket of capacity B refilled at r tokens/sec; a request costs a token and is rejected when the bucket is empty — so it permits a burst of B and then a steady r, using two numbers and lazy refill (no timer).", tags: ["token-bucket"] },
      { q: "When do you pick token bucket over sliding window?", a: "When bursts are legitimate and you only care about the average rate. Pick sliding window when the cap is a hard contract or protects a fragile dependency, where a temporary 3× is unacceptable.", tags: ["trade-off"] },
      { q: "Why is a sliding window LOG expensive?", a: "It stores a timestamp per request per key: 10M users × a 1,000 limit × 8 bytes ≈ 8 GB, versus ~100 bytes per key for the counter version.", tags: ["numbers"] },
      { q: "How do you rate limit across many servers without paying a Redis round trip per request?", a: "Local limiting against an allocated share of the budget, reconciled with the central counter every few hundred milliseconds. You accept a small overshoot per sync interval in exchange for zero added latency.", tags: ["distributed"] },
      { q: "Redis is down. Fail open or closed?", a: "A deliberate choice: fail open for fairness limiters (availability wins), fail closed only when the limiter protects something that will break. Best is fallback to a conservative local in-memory limiter, and always alarm.", tags: ["failure"] },
      { q: "What should a 429 response contain?", a: "`Retry-After` in seconds, plus `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset`. Without them clients guess, and guessing produces a retry storm.", tags: ["api"] },
      { q: "429 vs 503?", a: "429 means the client exceeded its own quota; 503 means the service is overloaded regardless of who asked. They imply different client behaviour, so don't conflate them.", tags: ["api"] },
      { q: "How do you limit expensive endpoints fairly under one budget?", a: "Variable cost: debit tokens proportional to expected work (a report costs 50, a health check costs 1), turning a request-rate limit into a work-rate limit. Pair it with a concurrency cap since cost estimates are always wrong.", tags: ["design"] }
    ],
    sixtySecond: [
      "Explain the four rate-limiting algorithms and say which one you'd ship for a public API, and why.",
      "Explain how you'd enforce a 1,000 rps per-user limit across 50 stateless servers, including what happens when the counter store fails."
    ]
  }
};
