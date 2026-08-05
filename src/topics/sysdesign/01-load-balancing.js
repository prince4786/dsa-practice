export default {
  id: "load-balancing",
  track: "sysdesign",
  title: "Scaling & Load Balancers",
  difficulty: 1,
  minutes: 14,
  tags: ["load-balancing", "horizontal-scaling", "health-checks", "availability"],

  explainer: [
    { type: "p", text: "A load balancer is one job with two halves: **pick a backend** for each request, and **stop picking backends that are broken**. Candidates always talk about the first half. The interview signal is in the second." },

    { type: "h3", text: "Vertical vs horizontal, and why we ended up here" },
    { type: "p", text: "Vertical scaling (a bigger box) is the cheapest thing you can do until it isn't: there is a largest instance, it costs superlinearly, and it is still a single failure domain. Horizontal scaling gives you capacity *and* redundancy, but it forces the app to become **stateless** — session state has to move to a shared store (Redis, a signed cookie, a JWT) so any replica can serve any request. That is the actual cost of horizontal scaling, and it is the thing to say out loud." },

    { type: "h3", text: "L4 vs L7" },
    { type: "list", items: [
      "**L4 (transport)** — routes on IP/port, forwards TCP/UDP without parsing. Cheap, ~microseconds of added latency, millions of connections per box. It cannot see URLs, cookies, or HTTP status codes.",
      "**L7 (application)** — terminates TLS and parses HTTP. Now you get path/host routing, header-based canaries, retries on `502`, request buffering, gzip, and per-route rate limits. Costs ~1 ms and far more CPU.",
      "Real stacks are both: an L4 (or anycast/ECMP) tier in front for raw connection spread, an L7 tier (Envoy, nginx, ALB) behind it for routing intelligence."
    ]},

    { type: "h3", text: "The algorithms, and when each one is wrong" },
    { type: "list", items: [
      "**Round-robin** — perfect when every request costs the same. Wrong the moment request costs vary: one slow endpoint pins one server while round-robin keeps feeding it.",
      "**Least connections** — routes to the backend with the fewest in-flight requests. This is the default you should reach for; it self-corrects for uneven request cost and for a slow/GC-paused replica. Its failure mode is a *newly added* server, which looks empty and gets slammed (fix: slow start / warm-up ramp).",
      "**Least response time / EWMA / peak-EWMA** — least-connections weighted by observed latency. What Envoy and Finagle actually use.",
      "**Consistent hash on a key** — needed for cache affinity or sticky sessions. Buys you locality, costs you balance (see the hot-keys lesson).",
      "**Power of two choices** — pick two backends at random, send to the less loaded. Nearly the quality of least-connections with none of the global state. This is the answer that impresses."
    ]},

    { type: "h3", text: "Health checks are the whole availability story" },
    { type: "p", text: "Between a server dying and the LB noticing, every request routed to it fails. That window is `interval × unhealthy_threshold` — with a 5 s interval and 3 strikes, you are serving errors for up to 15 s. Shortening it costs you false ejections during a GC pause. This tension — *fast detection vs flapping* — is the trade-off to name." },
    { type: "list", items: [
      "**Passive checks** (outlier detection) eject a backend that returns 5xx to real traffic — detection in milliseconds, zero extra probes.",
      "**Active checks** hit `/healthz` on a timer, so an idle backend is still verified.",
      "A **deep** health check that pings the database turns one database blip into a total outage: every backend fails its check at once and the LB has nobody left. Use a shallow liveness check for the LB and keep deep checks for alerting."
    ]},

    { type: "callout", tone: "pitfall", text: "Never let health checks eject the last healthy backend. Real LBs implement a **panic threshold** (Envoy: below 50% healthy, ignore health status and load balance across everything) — sending traffic to a maybe-broken server beats sending it nowhere." },

    { type: "h3", text: "Back-of-envelope" },
    { type: "p", text: "100k requests/sec, 50 ms average server-side latency. By Little's Law, in-flight requests = `100,000 × 0.05 = 5,000`. At a safe 200 concurrent requests per app server, that is **25 servers** — call it 40 with headroom for one AZ failing and for peak being ~2× average. A single L7 proxy handles maybe 50k rps, so you need a small tier of them, fronted by DNS or anycast." },

    { type: "callout", tone: "tip", text: "Sticky sessions are a smell, not a feature. They break least-connections balance, they break draining, and they turn one dead server into logged-out users. Say \"I'd put session state in Redis and keep the LB stateless\" before anyone asks." }
  ],

  complexity: {
    rows: [
      { operation: "Round-robin", time: "O(1) pick", space: "O(1)", note: "no load signal; blind to slow backends" },
      { operation: "Least connections", time: "O(1) with a heap/counter", space: "O(n)", note: "needs in-flight state per backend" },
      { operation: "Power of two choices", time: "O(1), 2 samples", space: "O(n)", note: "near-optimal balance, no global state" },
      { operation: "Consistent hash", time: "O(log v) ring lookup", space: "O(n·v)", note: "affinity; v = virtual nodes per server" },
      { operation: "Failure detection", time: "interval × threshold", space: "—", note: "the real availability knob" }
    ]
  },

  interview: {
    whyAsked: "It is the first fork in almost every design: 'you now have more traffic than one box'. The signal is not that you know the word round-robin — it is whether you separate routing policy from failure detection, whether you notice that horizontal scaling forces statelessness, and whether you can name the detection-speed vs flapping trade-off and commit to a side.",
    followUps: [
      { q: "Round-robin or least-connections — pick one and defend it.", a: "Least connections, because request cost is never uniform in a real service and least-connections is self-correcting: a server in a GC pause or a slow disk keeps its in-flight count high and stops receiving work, with no extra signal needed. Round-robin only wins when every request is genuinely identical and I want zero coordination state. If I cannot keep in-flight counts (multiple independent LB instances), I use power-of-two-choices, which gets most of the benefit from local sampling." },
      { q: "A server dies. Walk me through exactly what the user sees.", a: "Requests already in flight to it fail or time out. New requests keep being routed to it until the health checker trips — `interval × unhealthy_threshold`, so 5 s × 3 = up to 15 s of errors for 1/N of traffic. Passive outlier detection cuts that to the first few 5xx responses. Meanwhile the surviving N−1 servers absorb the load, so I must have provisioned below `(N−1)/N` utilization or I cascade. Retries with a budget hide the residual errors from the user; retries without a budget turn a partial outage into a total one." },
      { q: "How do you deploy without dropping requests?", a: "Connection draining: mark the instance as draining so the LB stops sending it new requests, let in-flight requests finish up to a deadline (typically 30 s), then stop the process. The app must fail its readiness check *before* it stops accepting connections, and it must handle SIGTERM by closing the listener rather than exiting immediately. Combine with rolling batches small enough that the remaining capacity still covers peak." },
      { q: "Where does TLS terminate?", a: "At the L7 edge, so certificates and cipher policy live in one place and the proxy can read the request for routing. If the network between edge and backends is untrusted or compliance demands it, re-encrypt on the internal hop (mTLS via a service mesh) — you pay a handshake per connection, mitigated by connection pooling and session resumption. Terminating at the backend instead means the LB is limited to L4 and you lose HTTP-aware routing and retries." },
      { q: "How does traffic reach the load balancer itself — isn't it a single point of failure?", a: "You run a tier, not a box, and spread traffic across it below the HTTP layer: DNS round-robin with short TTLs (crude, clients cache badly), or anycast BGP so the same VIP is announced from many locations and the network picks the nearest, or ECMP hashing at the router across a set of L4 nodes. Health of the LB tier itself is handled by withdrawing the route/announcement, which is far faster than waiting for DNS TTLs to expire." },
      { q: "When would you deliberately use sticky sessions?", a: "When the backend holds expensive per-connection state you genuinely cannot externalize — a WebSocket/game session, an in-progress upload, or a local cache whose miss cost dominates (then prefer consistent hashing for affinity rather than cookie stickiness, since it degrades gracefully). Accept the cost: worse balance, harder draining, and a dead server means those users lose their session." }
    ]
  },

  code: [
    { lang: "python", label: "Least-connections + power-of-two-choices", code: "import random\n\nclass Balancer:\n    def __init__(self, backends):\n        self.inflight = {b: 0 for b in backends}\n        self.healthy  = {b: True for b in backends}\n        self.strikes  = {b: 0 for b in backends}\n\n    def _pool(self):\n        live = [b for b, ok in self.healthy.items() if ok]\n        # PANIC MODE: never eject everyone. Below 50% healthy, ignore health.\n        if len(live) < len(self.healthy) / 2:\n            return list(self.healthy)\n        return live\n\n    def pick_least_conn(self):\n        pool = self._pool()\n        return min(pool, key=lambda b: self.inflight[b])\n\n    def pick_p2c(self):                     # no global scan, near-optimal\n        pool = self._pool()\n        a, b = random.sample(pool, 2) if len(pool) > 1 else (pool[0], pool[0])\n        return a if self.inflight[a] <= self.inflight[b] else b\n\n    def dispatch(self, request):\n        b = self.pick_p2c()\n        self.inflight[b] += 1\n        try:\n            resp = send(b, request)\n            if resp.status >= 500:          # passive health check\n                self._strike(b)\n            else:\n                self.strikes[b] = 0\n            return resp\n        finally:\n            self.inflight[b] -= 1           # MUST be in finally, or a timeout\n                                            # permanently inflates the count\n    def _strike(self, b, threshold=3):\n        self.strikes[b] += 1\n        if self.strikes[b] >= threshold:\n            self.healthy[b] = False         # eject; re-probe on a timer" },
    { lang: "javascript", label: "Smooth weighted round-robin (nginx's algorithm)", code: "// Naive weighted RR emits AAABC for weights {A:3,B:1,C:1} — bursty.\n// Smooth WRR emits ABACA: same ratio, evenly spread.\nfunction createSWRR(backends) {          // [{ id, weight }]\n  const s = backends.map(b => ({ ...b, current: 0 }));\n  const total = s.reduce((t, b) => t + b.weight, 0);\n  return function next() {\n    let best = null;\n    for (const b of s) {\n      b.current += b.weight;             // everyone gains its weight\n      if (!best || b.current > best.current) best = b;\n    }\n    best.current -= total;               // winner pays the full total\n    return best.id;\n  };\n}" },
    { lang: "pseudo", label: "Health checker with hysteresis", code: "every INTERVAL (5s):\n  for each backend b:\n    ok = probe(b, \"/healthz\", timeout=2s)   # SHALLOW: no DB, no downstream\n    if ok:\n      b.fails = 0\n      b.passes += 1\n      if not b.inPool and b.passes >= HEALTHY_THRESHOLD (2):\n        addToPool(b)                        # with slow-start: ramp weight 0->1\n    else:\n      b.passes = 0\n      b.fails += 1\n      if b.inPool and b.fails >= UNHEALTHY_THRESHOLD (3):\n        removeFromPool(b)                   # worst-case error window:\n                                            #   INTERVAL * UNHEALTHY_THRESHOLD = 15s\n\n# Asymmetric thresholds on purpose: eject slowly (3 strikes, avoid flapping\n# on a GC pause), re-admit slowly too (2 passes + slow start, avoid slamming\n# a cold server that least-connections thinks is idle)." }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.75, maxFrames: 400 },

    params: [
      { key: "servers", label: "Backends", type: "int", min: 3, max: 7, default: 5 },
      { key: "algo", label: "Policy", type: "enum", options: ["round-robin", "least-connections", "hash-key"], default: "least-connections" },
      { key: "requests", label: "Requests", type: "int", min: 20, max: 70, default: 40 },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const S = params.servers;
      const N = params.requests;
      const algo = params.algo;
      const CHECK_EVERY = 4;
      const UNHEALTHY = 3;
      const HEALTHY = 2;

      const hash32 = (s) => {
        let h = 2166136261 >>> 0;
        for (let i = 0; i < s.length; i++) {
          h ^= s.charCodeAt(i);
          h = Math.imul(h, 16777619) >>> 0;
        }
        return h >>> 0;
      };

      const algoName = algo === "round-robin" ? "round-robin"
        : algo === "least-connections" ? "least-connections" : "hash(key) mod N";

      const srv = [];
      for (let i = 0; i < S; i++) {
        srv.push({ id: "s" + (i + 1), alive: true, inPool: true, active: 0, served: 0, errors: 0, fails: 0, passes: 0 });
      }
      const conns = [];                 // { s: index, left: ticks }
      let rr = 0, errors = 0, served = 0;

      const killAt = Math.max(6, Math.floor(N * 0.4));
      const reviveAt = Math.min(N - 4, killAt + Math.max(8, Math.floor(N * 0.3)));
      const victim = S > 1 ? 1 : 0;

      const snap = () => srv.map((s) => ({
        id: s.id, alive: s.alive, inPool: s.inPool, active: s.active,
        served: s.served, errors: s.errors, fails: s.fails
      }));

      const spread = () => {
        const pool = srv.filter((s) => s.inPool);
        if (pool.length === 0) return 0;
        const counts = pool.map((s) => s.served);
        return Math.max.apply(null, counts) - Math.min.apply(null, counts);
      };

      yield {
        label: `${S} backends behind one load balancer, policy = ${algoName}. Watch the in-flight counters, not the totals — that is where imbalance shows first.`,
        phase: "init",
        state: { servers: snap(), algo, req: null, target: -1, key: "", cost: 0, i: 0, n: N, served: 0, errors: 0, spread: 0, event: "start", ok: true }
      };

      for (let i = 0; i < N; i++) {
        // --- advance time: finish in-flight work -----------------------------
        for (let k = conns.length - 1; k >= 0; k--) {
          conns[k].left -= 1;
          if (conns[k].left <= 0) {
            srv[conns[k].s].active = Math.max(0, srv[conns[k].s].active - 1);
            conns.splice(k, 1);
          }
        }

        // --- fault injection --------------------------------------------------
        if (i === killAt) {
          srv[victim].alive = false;
          yield {
            label: `${srv[victim].id} just died (process crash). The load balancer does not know yet — it will keep routing there until the health check trips.`,
            phase: "fault",
            state: { servers: snap(), algo, req: null, target: victim, key: "", cost: 0, i, n: N, served, errors, spread: spread(), event: "kill", ok: false }
          };
        }
        if (i === reviveAt && !srv[victim].alive) {
          srv[victim].alive = true;
          srv[victim].fails = 0;
          yield {
            label: `${srv[victim].id} restarted and is healthy again, but it stays out of the pool until it passes ${HEALTHY} consecutive checks — re-admitting instantly would slam a cold server.`,
            phase: "fault",
            state: { servers: snap(), algo, req: null, target: victim, key: "", cost: 0, i, n: N, served, errors, spread: spread(), event: "revive", ok: true }
          };
        }

        // --- active health check ---------------------------------------------
        if (i > 0 && i % CHECK_EVERY === 0) {
          let changed = "";
          for (let k = 0; k < S; k++) {
            const s = srv[k];
            if (s.alive) {
              s.fails = 0;
              s.passes += 1;
              if (!s.inPool && s.passes >= HEALTHY) { s.inPool = true; changed = `${s.id} re-admitted to the pool`; }
            } else {
              s.passes = 0;
              s.fails += 1;
              if (s.inPool && s.fails >= UNHEALTHY) {
                s.inPool = false;
                s.active = 0;
                for (let c = conns.length - 1; c >= 0; c--) if (conns[c].s === k) conns.splice(c, 1);
                changed = `${s.id} EJECTED after ${UNHEALTHY} failed probes`;
              }
            }
          }
          const live = srv.filter((s) => s.inPool).length;
          yield {
            label: changed
              ? `Health check #${i / CHECK_EVERY}: ${changed}. ${live}/${S} backends in the pool — surviving servers now absorb ${(100 / Math.max(1, live)).toFixed(0)}% of traffic each.`
              : `Health check #${i / CHECK_EVERY}: all ${live} pooled backends answered /healthz. A shallow probe on purpose — if it pinged the database, one DB blip would eject every server at once.`,
            phase: "health",
            state: { servers: snap(), algo, req: null, target: -1, key: "", cost: 0, i, n: N, served, errors, spread: spread(), event: "check", ok: !changed }
          };
        }

        // --- route one request -------------------------------------------------
        const key = "user-" + Math.floor(rng() * 12);
        const cost = 1 + Math.floor(rng() * 5);      // uneven request cost: 1..5 ticks
        const pool = [];
        for (let k = 0; k < S; k++) if (srv[k].inPool) pool.push(k);

        if (pool.length === 0) {
          errors += 1;
          yield {
            label: `No backends left in the pool — every request is a hard 503. This is why real proxies have a panic threshold: below 50% healthy they ignore health and route anyway.`,
            phase: "route",
            state: { servers: snap(), algo, req: i + 1, target: -1, key, cost, i, n: N, served, errors, spread: spread(), event: "no-pool", ok: false }
          };
          continue;
        }

        let target, why;
        if (algo === "round-robin") {
          target = pool[rr % pool.length];
          rr += 1;
          why = `round-robin: next in the ring, ignoring that it already holds ${srv[target].active} in-flight`;
        } else if (algo === "least-connections") {
          target = pool[0];
          for (const k of pool) if (srv[k].active < srv[target].active) target = k;
          const loads = pool.map((k) => srv[k].active).join("/");
          why = `least-connections: in-flight was ${loads}, so the emptiest wins`;
        } else {
          target = pool[hash32(key) % pool.length];
          why = `hash("${key}") mod ${pool.length} — same key always lands on the same backend, so its cache stays warm`;
        }

        const hit = srv[target];
        if (!hit.alive) {
          hit.errors += 1;
          hit.fails += 1;
          errors += 1;
          yield {
            label: `Request #${i + 1} routed to ${hit.id} — which is dead. 502 to the user. ${srv[victim].fails}/${UNHEALTHY} strikes; every request in this window is a real error the user sees.`,
            phase: "route",
            focus: [target],
            state: { servers: snap(), algo, req: i + 1, target, key, cost, i, n: N, served, errors, spread: spread(), event: "5xx", ok: false }
          };
        } else {
          hit.active += 1;
          hit.served += 1;
          served += 1;
          conns.push({ s: target, left: cost });
          yield {
            label: `Request #${i + 1} (key=${key}, cost=${cost} ticks) → ${hit.id} — ${why}.`,
            phase: "route",
            focus: [target],
            state: { servers: snap(), algo, req: i + 1, target, key, cost, i, n: N, served, errors, spread: spread(), event: "ok", ok: true }
          };
        }
      }

      const counts = srv.map((s) => s.served);
      const mx = Math.max.apply(null, counts);
      const mn = Math.min.apply(null, counts);
      const mean = counts.reduce((a, b) => a + b, 0) / S;
      yield {
        label: `Done: ${served} served, ${errors} errors. Busiest backend took ${mx}, quietest ${mn} (mean ${mean.toFixed(1)}) — a spread of ${mx - mn}. ${algo === "round-robin" ? "Round-robin cannot see cost, so the spread is real work imbalance." : algo === "least-connections" ? "Least-connections tracked the uneven costs and kept the spread small." : "Hashing traded balance for cache affinity — the spread is the price."}`,
        phase: "done",
        state: { servers: snap(), algo, req: null, target: -1, key: "", cost: 0, i: N, n: N, served, errors, spread: mx - mn, event: "done", ok: errors === 0 }
      };
    },

    draw: function (frame, svg, env) {
      const C = env.colors;
      const W = env.width, H = env.height;
      const st = frame.state;
      const S = st.servers.length;

      const h = env.h || function (tag, attrs, kids) {
        const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
        if (attrs) for (const k in attrs) if (attrs[k] != null) el.setAttribute(k, String(attrs[k]));
        const list = kids == null ? [] : (Array.isArray(kids) ? kids : [kids]);
        for (const c of list) {
          if (c == null) continue;
          el.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
        }
        return el;
      };
      while (svg.firstChild) svg.removeChild(svg.firstChild);
      svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
      const add = (n) => { svg.appendChild(n); return n; };
      const txt = (x, y, s, o) => {
        o = o || {};
        return h("text", {
          x: x, y: y, fill: o.fill || C.text2, "font-size": o.size || 11,
          "font-family": o.mono ? env.font.mono : env.font.base,
          "text-anchor": o.anchor || "start", "font-weight": o.bold ? 600 : 400, opacity: o.opacity
        }, s);
      };

      const lbX = 118, lbY = H * 0.5, lbW = 84, lbH = 54;
      const colX = W - 250;
      const topY = 62;
      const rowH = Math.min(46, (H - topY - 92) / S);
      const boxH = Math.max(20, rowH - 10);
      const sy = (i) => topY + i * rowH;

      // ---- title row ---------------------------------------------------------
      add(txt(16, 22, "Load balancer", { fill: C.text, size: 13, bold: true }));
      add(txt(16, 40, `policy: ${st.algo}   request ${st.i}/${st.n}`, { fill: C.muted, size: 11, mono: true }));
      add(txt(W - 16, 22, `served ${st.served}`, { fill: C.text, size: 12, mono: true, anchor: "end" }));
      add(txt(W - 16, 40, `errors ${st.errors}`, { fill: st.errors > 0 ? C.danger : C.muted, size: 12, mono: true, anchor: "end" }));

      // ---- client + LB -------------------------------------------------------
      add(h("rect", { x: 16, y: lbY - 26, width: 62, height: 52, rx: 6, fill: C.surface2, stroke: C.border }));
      add(txt(47, lbY - 4, "clients", { fill: C.text2, size: 11, anchor: "middle" }));
      add(txt(47, lbY + 12, st.key || "—", { fill: C.muted, size: 10, mono: true, anchor: "middle" }));

      add(h("line", { x1: 78, y1: lbY, x2: lbX, y2: lbY, stroke: C.axis, "stroke-width": 2 }));
      add(h("rect", { x: lbX, y: lbY - lbH / 2, width: lbW, height: lbH, rx: 8, fill: C.surface, stroke: C.accent, "stroke-width": 2 }));
      add(txt(lbX + lbW / 2, lbY - 4, "LB", { fill: C.text, size: 13, bold: true, anchor: "middle" }));
      add(txt(lbX + lbW / 2, lbY + 13, `${st.servers.filter((s) => s.inPool).length}/${S} in pool`, { fill: C.muted, size: 9, mono: true, anchor: "middle" }));

      // ---- wires + servers ---------------------------------------------------
      const maxServed = Math.max(1, ...st.servers.map((s) => s.served));
      const maxAct = Math.max(1, ...st.servers.map((s) => s.active));

      for (let i = 0; i < S; i++) {
        const s = st.servers[i];
        const y = sy(i) + boxH / 2;
        const live = s.inPool && s.alive;
        const wireCol = !s.inPool ? C.muted : (st.target === i ? (st.ok ? C.viz1 : C.danger) : C.grid);

        add(h("path", {
          d: `M ${lbX + lbW} ${lbY} C ${lbX + lbW + 46} ${lbY}, ${colX - 46} ${y}, ${colX} ${y}`,
          fill: "none", stroke: wireCol,
          "stroke-width": st.target === i ? 2.5 : 1.2,
          "stroke-dasharray": s.inPool ? null : "4 4"
        }));

        // request dot travelling the chosen wire
        if (st.target === i && st.event !== "check" && st.event !== "revive") {
          add(h("circle", { cx: (lbX + lbW + colX) / 2, cy: (lbY + y) / 2, r: 6, fill: st.ok ? C.viz1 : C.danger }));
        }

        const fill = !s.alive ? C.surface2 : (s.inPool ? C.surface : C.surface2);
        const stroke = !s.alive ? C.danger : (!s.inPool ? C.warn : (st.target === i ? C.viz1 : C.border));
        add(h("rect", { x: colX, y: sy(i), width: 150, height: boxH, rx: 6, fill: fill, stroke: stroke, "stroke-width": st.target === i ? 2 : 1 }));

        // health pip
        add(h("circle", { cx: colX + 13, cy: y, r: 5, fill: !s.alive ? C.danger : (s.inPool ? C.ok : C.warn) }));
        add(txt(colX + 26, y + 4, s.id, { fill: live ? C.text : C.muted, size: 12, bold: true, mono: true }));

        // in-flight bar
        const barX = colX + 58, barW = 58;
        add(h("rect", { x: barX, y: y - 6, width: barW, height: 12, rx: 3, fill: C.surface2 }));
        add(h("rect", {
          x: barX, y: y - 6, width: Math.max(0, (s.active / maxAct) * barW), height: 12, rx: 3,
          fill: s.active >= maxAct && maxAct > 1 ? C.viz4 : C.viz1
        }));
        add(txt(colX + 144, y + 4, String(s.active), { fill: C.text2, size: 11, mono: true, anchor: "end" }));

        if (!s.alive) add(txt(colX + 155, y + 4, "DOWN", { fill: C.danger, size: 10, mono: true, bold: true }));
        else if (!s.inPool) add(txt(colX + 155, y + 4, "probing", { fill: C.warn, size: 10, mono: true }));
      }
      add(txt(colX + 58, topY - 8, "in-flight", { fill: C.muted, size: 9, mono: true }));
      add(txt(colX, topY - 8, "backend", { fill: C.muted, size: 9, mono: true }));

      // ---- served-per-backend histogram (the balance story) -------------------
      const gy = H - 62, gh = 40;
      const gx = 16, gw = colX - 40;
      const bw = gw / S;
      add(h("line", { x1: gx, y1: gy + gh, x2: gx + gw, y2: gy + gh, stroke: C.axis }));
      add(txt(gx, gy - 8, `requests served per backend  (spread = ${st.spread})`, { fill: C.muted, size: 10, mono: true }));
      for (let i = 0; i < S; i++) {
        const s = st.servers[i];
        const bh = (s.served / maxServed) * gh;
        add(h("rect", {
          x: gx + i * bw + 3, y: gy + gh - bh, width: Math.max(2, bw - 6), height: Math.max(0, bh), rx: 2,
          fill: st.target === i ? C.viz1 : (s.alive ? C.viz3 : C.muted)
        }));
        add(txt(gx + i * bw + bw / 2, gy + gh + 13, s.id, { fill: C.muted, size: 9, mono: true, anchor: "middle" }));
        if (s.errors > 0) {
          const eh = (s.errors / maxServed) * gh;
          add(h("rect", { x: gx + i * bw + 3, y: gy + gh - bh - eh, width: Math.max(2, bw - 6), height: Math.max(1, eh), rx: 2, fill: C.danger }));
        }
      }
    }
  },

  drill: {
    cards: [
      { q: "What does horizontal scaling force you to change in the application?", a: "It must become stateless — any replica has to be able to serve any request, so session state moves to a shared store (Redis) or into a signed token. Sticky sessions are the workaround, and they cost you balance and graceful draining.", tags: ["scaling"] },
      { q: "L4 vs L7 load balancing in one line each.", a: "L4 forwards TCP/UDP by IP:port without parsing — microseconds, millions of connections, no HTTP awareness. L7 terminates TLS and parses HTTP — path/header routing, retries on 5xx, per-route limits, at ~1 ms and much more CPU.", tags: ["layers"] },
      { q: "Why is least-connections usually better than round-robin?", a: "Request cost is never uniform. A slow or GC-paused backend keeps a high in-flight count and therefore stops receiving new work automatically. Round-robin is blind to cost and keeps feeding the struggling server.", tags: ["algorithms"] },
      { q: "What is power-of-two-choices and why is it liked?", a: "Sample two backends at random and send to the less loaded one. It gets near least-connections quality with no global load state, so it works across many independent LB instances. Exponential improvement in max load over pure random.", tags: ["algorithms"] },
      { q: "How long can a dead backend keep receiving traffic?", a: "Up to `check_interval × unhealthy_threshold` — e.g. 5 s × 3 = 15 s of errors for 1/N of requests. Passive outlier detection (ejecting on real 5xx responses) cuts that to milliseconds.", tags: ["health-checks"] },
      { q: "Why must a load-balancer health check be shallow?", a: "A deep check that touches the database fails on every backend simultaneously during one DB blip, so the LB ejects the entire pool and turns a degradation into a total outage. Keep liveness shallow; use deep checks for alerting.", tags: ["health-checks", "pitfall"] },
      { q: "What is a panic threshold?", a: "When the healthy fraction drops below a limit (Envoy defaults to 50%), the LB ignores health status and load balances across all hosts. Sending traffic to a possibly-broken backend beats having no backend at all.", tags: ["availability"] },
      { q: "How do you deploy without dropping requests?", a: "Connection draining: fail the readiness check first so the LB stops sending new requests, let in-flight work finish up to a deadline, handle SIGTERM by closing the listener, then exit. Roll in batches that leave enough capacity for peak.", tags: ["operations"] }
    ],
    sixtySecond: [
      "Explain how you'd scale a single-server web app to 100k requests per second, and say what horizontal scaling forces you to change in the app itself.",
      "Explain the trade-off between fast failure detection and health-check flapping, and how passive outlier detection changes it."
    ]
  }
};
