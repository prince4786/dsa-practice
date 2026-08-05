export default {
  id: "cdn",
  track: "sysdesign",
  title: "CDN & Edge Delivery",
  difficulty: 1,
  minutes: 13,
  tags: ["cdn", "edge", "latency", "http-caching", "origin-offload"],

  explainer: [
    { type: "p", text: "A CDN is a cache whose eviction policy you barely control, placed where the *speed of light* stops being negligible. Its job is two things: cut round-trip time by moving bytes closer to users, and cut origin traffic by an order of magnitude or two." },

    { type: "h3", text: "The physics you cannot argue with" },
    { type: "p", text: "Light in fibre goes about **200,000 km/s**, and real paths are ~1.5× the great-circle distance. London→New York is 5,600 km, so the theoretical one-way is ~28 ms and a real RTT is **70–90 ms**. A TCP+TLS 1.3 handshake costs 2 RTTs before the first byte, so a cold cross-Atlantic HTTPS request is ~250 ms *before the server does any work*. Serving from an edge PoP 20 ms away turns that into ~60 ms. **No amount of backend optimization recovers a bad RTT.**" },

    { type: "h3", text: "How a request actually finds an edge" },
    { type: "list", items: [
      "**Anycast BGP** — the same IP is announced from every PoP; the internet's own routing delivers you to the topologically nearest one. Fast failover (withdraw the announcement), but a route flap can move a live TCP connection to a different PoP.",
      "**DNS-based (GeoDNS)** — the resolver's location picks the PoP. Coarse (you see the resolver, not the user, unless EDNS Client Subnet is on) and hostage to DNS TTLs.",
      "Then: TLS terminates at the edge, the edge checks its cache, and on a miss goes back to origin over a warm, tuned, often-multiplexed connection."
    ]},

    { type: "h3", text: "Origin offload is the number to quote" },
    { type: "p", text: "With E edges each caching independently, a cold object is fetched E times from origin — once per PoP. **Tiered caching / origin shield** puts a regional parent cache between the edges and the origin, so the origin sees *one* fetch per object instead of E. For 8 PoPs and 10k objects that is 80k origin requests collapsed into 10k: an 8× reduction in origin load for a config flag." },
    { type: "p", text: "Back-of-envelope: 10M page views/day, 2 MB per page, 95% of bytes static. That is 20 TB/day ≈ **1.9 Gbps average, ~5 Gbps at peak**. Through a CDN at 95% byte hit ratio the origin serves ~250 Mbps — one modest server instead of a fleet, and the egress bill moves to the CDN's cheaper per-GB rate." },

    { type: "h3", text: "Cache-control is the API" },
    { type: "list", items: [
      "`Cache-Control: public, max-age=31536000, immutable` on **content-hashed** filenames (`app.9f3a1c.js`). Never expires, never revalidates, and a deploy changes the URL — this is the whole game for static assets.",
      "`s-maxage` targets shared caches only; `max-age` targets the browser. Use a long `s-maxage` with a short `max-age` so the edge holds it but browsers recheck.",
      "`stale-while-revalidate=60` lets the edge serve a stale copy instantly while it refreshes behind the scenes — the single most valuable header for tail latency.",
      "`ETag` + `If-None-Match` gives you a **304** — still a full round trip, but 200 bytes instead of 2 MB.",
      "`Vary: Accept-Encoding` is fine. `Vary: User-Agent` fragments your cache into thousands of near-duplicate entries and destroys the hit ratio."
    ]},

    { type: "callout", tone: "pitfall", text: "Query strings are part of the cache key by default. One tracking parameter (`?utm_source=…`) turns a single cached object into a million unique misses. Strip or allow-list query parameters at the edge." },

    { type: "h3", text: "Invalidation and dynamic content" },
    { type: "p", text: "A global purge is not instant — it is a broadcast to hundreds of PoPs and takes seconds to minutes. **Design so you never need it**: version the URL. When you must purge, purge by surrogate key/tag rather than by URL so one product update invalidates every page that embedded it." },
    { type: "p", text: "Modern CDNs also accelerate *uncacheable* requests: the TLS handshake terminates at the edge (saving 2 RTTs of user latency) and the edge→origin hop rides a pre-warmed, congestion-tuned connection. You get 30–50% off a dynamic API call while caching nothing." },

    { type: "callout", tone: "tip", text: "Distinguish **request hit ratio** from **byte hit ratio**. A CDN can hit on 60% of requests but 98% of bytes, because the misses are small HTML and the hits are large media. Origin *load* tracks request ratio; origin *bandwidth* tracks byte ratio. Say which one you mean." }
  ],

  complexity: {
    rows: [
      { operation: "Same-city RTT", time: "~5–20 ms", space: "—", note: "user → edge PoP" },
      { operation: "Cross-continent RTT", time: "~70–150 ms", space: "—", note: "edge → distant origin" },
      { operation: "TLS 1.3 first byte", time: "2 × RTT", space: "—", note: "1 RTT with 0-RTT resumption" },
      { operation: "Origin fetches, no shield", time: "E per object", space: "O(E·objects)", note: "E = number of PoPs" },
      { operation: "Origin fetches, with shield", time: "1 per object", space: "O(objects) at the shield", note: "the tiered-caching win" }
    ]
  },

  interview: {
    whyAsked: "It checks whether you think in round trips rather than in CPU. The signal is quoting a real RTT number, separating the latency win from the origin-offload win, and knowing that cache keys and Cache-Control headers — not the CDN vendor — determine whether any of it works.",
    followUps: [
      { q: "How do you invalidate a file on a CDN?", a: "Preferably you never do: content-hash the filename and serve it `immutable, max-age=1y`, so a deploy publishes a new URL and the old one simply ages out. When you must purge, purge by surrogate key rather than URL, so 'product 42 changed' invalidates every page tagged with it in one call. Accept that a global purge propagates in seconds-to-minutes across hundreds of PoPs; never treat it as a synchronous consistency mechanism." },
      { q: "Can a CDN help with content that cannot be cached at all?", a: "Yes, and this is the underrated half. The edge terminates TLS, so the user pays 2 RTTs to a PoP 10 ms away instead of an origin 100 ms away — that alone can save 180 ms. The edge→origin hop then rides a long-lived, pre-warmed, congestion-tuned connection over the CDN's private backbone rather than the open internet. Typically 30–50% off a dynamic request with a 0% hit ratio." },
      { q: "Your hit ratio is 40% and you expected 95%. Where do you look?", a: "The cache key first: query strings (tracking params), cookies, and an over-broad `Vary` header each multiply one object into many. Then TTLs — a `max-age` of 60 s on an asset that changes weekly means constant revalidation. Then the long tail: if your catalogue is huge and requests are uniform, the edge simply cannot hold the working set, and the fix is tiered caching so misses hit a big regional parent instead of the origin. Finally, check `Set-Cookie` on static responses, which makes many CDNs refuse to cache at all." },
      { q: "How does a user get routed to the nearest PoP?", a: "Anycast: the same IP is announced by every PoP over BGP and the internet's routing picks the topologically nearest — instant failover by withdrawing an announcement, but no control over the choice and a route flap can break a long TCP connection. The alternative is GeoDNS, which returns a PoP-specific address based on the resolver's location — more control, but you see the resolver rather than the user unless EDNS Client Subnet is enabled, and changes are gated on DNS TTLs." },
      { q: "How would you serve a live video stream or a large software release?", a: "Segment it: HLS/DASH chunks of a few seconds are ordinary cacheable objects, so a million viewers of the same live stream collapse into one origin fetch per segment per shield. That is the trick — turn a stream into cacheable files. For a big release, pre-warm the PoPs before announcing, and for extreme fan-out use peer-assisted or multicast-style distribution between PoPs so the origin never sees the spike." },
      { q: "What breaks when the CDN goes down?", a: "Your origin instantly sees its full unshielded traffic — potentially 20× normal — while also losing the edge's DDoS absorption and TLS termination. Mitigations: keep origin capacity or autoscaling for a survivable multiple of normal load, put a rate limiter and a stale-serving cache at the origin edge, use DNS with a short TTL to a second CDN if availability justifies the complexity, and make sure your origin is not reachable directly by attackers in the first place (allow-list the CDN's IP ranges or use an authenticated origin pull)." }
    ]
  },

  code: [
    { lang: "pseudo", label: "Cache headers by content type", code: "# Content-hashed assets: never revalidate, deploys change the URL.\n/static/app.9f3a1c.js\n  Cache-Control: public, max-age=31536000, immutable\n\n# HTML: must be fresh-ish, but never make the user wait for revalidation.\n/index.html\n  Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=300\n  ETag: \"a1b2c3\"\n  Surrogate-Key: home layout-v3\n\n# Personalized API response: edge accelerates the connection, caches nothing.\n/api/me\n  Cache-Control: private, no-store\n\n# Public API read: short shared TTL, long stale window for resilience.\n/api/products/42\n  Cache-Control: public, s-maxage=30, stale-while-revalidate=600,\n                 stale-if-error=86400        # serve stale if origin is DOWN\n  Surrogate-Key: product-42\n\n# Purge by tag, not by URL:\n#   POST /purge  { \"surrogate_keys\": [\"product-42\"] }\n#   -> invalidates every page that embedded product 42, in one call." },
    { lang: "javascript", label: "Edge worker: normalize the cache key", code: "// The #1 cause of a bad hit ratio is a cache key that varies for no reason.\nconst KEEP = new Set([\"id\", \"page\", \"q\", \"v\"]);   // ALLOW-list, never deny-list\n\nfunction cacheKey(request) {\n  const url = new URL(request.url);\n\n  // 1. Drop every parameter that does not change the response body.\n  for (const k of [...url.searchParams.keys()]) {\n    if (!KEEP.has(k)) url.searchParams.delete(k);   // utm_*, fbclid, gclid, ...\n  }\n  url.searchParams.sort();                          // ?a=1&b=2 == ?b=2&a=1\n\n  // 2. Fold high-cardinality dimensions into low-cardinality buckets.\n  const device = /Mobile|Android|iPhone/.test(request.headers.get(\"user-agent\") || \"\")\n    ? \"m\" : \"d\";                                    // 2 variants, not 40,000\n  const lang = (request.headers.get(\"accept-language\") || \"en\").slice(0, 2);\n\n  return new Request(`${url}#${device}:${lang}`, request);\n}\n\naddEventListener(\"fetch\", (event) => event.respondWith(handle(event)));\n\nasync function handle(event) {\n  const req = event.request;\n  const key = cacheKey(req);\n  const hit = await caches.default.match(key);\n  if (hit) return hit;                              // edge hit: ~10 ms\n\n  const res = await fetch(req);                     // miss: back to shield/origin\n  if (res.ok && req.method === \"GET\") {\n    // Don't make the user wait for the cache write.\n    event.waitUntil(caches.default.put(key, res.clone()));\n  }\n  return res;\n}" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.8, maxFrames: 320 },

    params: [
      { key: "edges", label: "Edge PoPs", type: "int", min: 3, max: 6, default: 4 },
      { key: "objects", label: "Distinct objects", type: "int", min: 3, max: 14, default: 8 },
      { key: "requests", label: "User requests", type: "int", min: 20, max: 70, default: 44 },
      { key: "topology", label: "Topology", type: "enum", options: ["edge→origin", "edge→shield→origin"], default: "edge→origin" },
      { key: "seed", label: "Re-roll traffic", type: "seed" }
    ],

    frames: function* (params, rng) {
      const E = params.edges;
      const O = params.objects;
      const N = params.requests;
      const shielded = params.topology === "edge→shield→origin";

      // Each PoP has its own RTT to the user and its own RTT back to origin.
      const edges = [];
      for (let i = 0; i < E; i++) {
        edges.push({
          name: ["SFO", "IAD", "LHR", "FRA", "NRT", "GRU"][i] || ("pop" + i),
          userRtt: 8 + Math.floor(rng() * 18),          // 8–25 ms
          originRtt: 60 + Math.floor(rng() * 100),      // 60–160 ms
          shieldRtt: 18 + Math.floor(rng() * 22),       // 18–40 ms to the regional parent
          cache: []
        });
      }
      const shieldCache = [];
      const buckets = [0, 0, 0, 0, 0, 0, 0, 0];        // 0-25,25-50,...,175+
      const bucketOf = (ms) => Math.min(7, Math.floor(ms / 25));
      const samples = [];

      let edgeHits = 0, shieldHits = 0, originFetches = 0;
      const zipf = [];
      let zs = 0;
      for (let i = 0; i < O; i++) { const w = 1 / Math.pow(i + 1, 0.9); zipf.push(w); zs += w; }
      const pickObj = () => { let r = rng() * zs; for (let i = 0; i < O; i++) { r -= zipf[i]; if (r <= 0) return i; } return O - 1; };

      const snap = () => ({
        edges: edges.map((e) => ({ name: e.name, userRtt: e.userRtt, originRtt: e.originRtt, shieldRtt: e.shieldRtt, cache: e.cache.slice() })),
        shield: shieldCache.slice(), shielded: shielded, objects: O,
        buckets: buckets.slice(), edgeHits: edgeHits, shieldHits: shieldHits, originFetches: originFetches,
        n: N, done: samples.length,
        p50: pct(50), p95: pct(95), avg: samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0,
        hop: "", edge: -1, obj: -1, ms: 0
      });
      function pct(p) {
        if (!samples.length) return 0;
        const s = samples.slice().sort((a, b) => a - b);
        return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
      }

      yield {
        label: `${E} edge PoPs in front of one origin${shielded ? " with a regional shield between them" : ""}. Every request pays the user→edge RTT; only misses pay the long haul.`,
        phase: "init",
        state: snap()
      };

      for (let r = 0; r < N; r++) {
        const ei = Math.floor(rng() * E);
        const e = edges[ei];
        const oi = pickObj();
        const key = "/obj" + oi;
        let ms = e.userRtt * 2;      // TCP+TLS handled by the edge; count one RTT each way
        let hop, why;

        if (e.cache.indexOf(oi) >= 0) {
          edgeHits += 1;
          hop = "edge-hit";
          why = `HIT at ${e.name}. Served in ${ms} ms without ever leaving the region.`;
        } else if (shielded && shieldCache.indexOf(oi) >= 0) {
          shieldHits += 1;
          ms += e.shieldRtt * 2;
          e.cache = e.cache.concat([oi]);
          hop = "shield-hit";
          why = `MISS at ${e.name} → the regional shield already has ${key}, so the origin is not touched at all. ${ms} ms, and ${e.name} is now warm.`;
        } else {
          originFetches += 1;
          ms += (shielded ? e.shieldRtt * 2 + 70 : e.originRtt * 2);
          e.cache = e.cache.concat([oi]);
          if (shielded) shieldCache.push(oi);
          hop = "origin";
          why = shielded
            ? `MISS at ${e.name} and at the shield → all the way to origin. ${ms} ms. This is the only time the origin will ever see /obj${oi}: the shield now holds it for every PoP.`
            : `MISS at ${e.name} → all the way to origin. ${ms} ms. Each PoP pays this cold cost independently, so the origin sees one fetch per PoP per object.`;
        }

        samples.push(ms);
        buckets[bucketOf(ms)] += 1;
        const total = edgeHits + shieldHits + originFetches;
        const hr = ((edgeHits + shieldHits) / total) * 100;

        yield {
          label: `Request ${r + 1}: user near ${e.name} asks for ${key}. ${why} Cache hit ratio ${hr.toFixed(0)}%, origin has served ${originFetches}.`,
          phase: hop,
          focus: [ei],
          state: Object.assign(snap(), { hop: hop, edge: ei, obj: oi, ms: ms })
        };
      }

      const total = Math.max(1, edgeHits + shieldHits + originFetches);
      const naiveOrigin = shielded ? originFetches * E : originFetches;
      yield {
        label: `Done: ${edgeHits} edge hits, ${shieldHits} shield hits, ${originFetches} origin fetches out of ${N} (${(((edgeHits + shieldHits) / total) * 100).toFixed(0)}% hit ratio). p50 ${pct(50)} ms, p95 ${pct(95)} ms. ${shielded ? `Without the shield those cold objects would have been fetched up to ${naiveOrigin} times — once per PoP.` : `Add a shield and cold objects would be fetched once instead of once per PoP.`}`,
        phase: "done",
        state: snap()
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

      const E = s.edges.length;
      const topH = H * 0.58;
      const userX = 44, edgeX = W * 0.34, shieldX = W * 0.62, originX = W - 70;
      const ey = (i) => 46 + (i + 0.5) * ((topH - 56) / E);

      lab(16, 20, "user → edge PoP → " + (s.shielded ? "regional shield → origin" : "origin"), C.text, 12, "left", true);

      // origin
      const oy = topH / 2 + 10;
      ctx.fillStyle = C.surface2; ctx.strokeStyle = C.viz7; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(originX - 38, oy - 30, 76, 60, 8); ctx.fill(); ctx.stroke();
      lab(originX, oy - 4, "ORIGIN", C.text, 12, "center");
      lab(originX, oy + 12, `${s.originFetches} fetches`, C.muted, 9, "center");

      // shield
      if (s.shielded) {
        ctx.fillStyle = C.surface2; ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.roundRect(shieldX - 34, oy - 26, 68, 52, 8); ctx.fill(); ctx.stroke();
        lab(shieldX, oy - 6, "SHIELD", C.text, 11, "center");
        lab(shieldX, oy + 9, `${s.shield.length} obj`, C.muted, 9, "center");
      }

      // edges
      for (let i = 0; i < E; i++) {
        const e = s.edges[i], y = ey(i);
        const active = s.edge === i;
        ctx.fillStyle = C.surface; ctx.strokeStyle = active ? C.viz1 : C.border; ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(edgeX - 40, y - 20, 80, 40, 7); ctx.fill(); ctx.stroke();
        lab(edgeX, y - 3, e.name, C.text, 12, "center");
        lab(edgeX, y + 12, `${e.cache.length} cached`, C.muted, 9, "center");

        // user dot + link
        ctx.strokeStyle = active ? C.viz1 : C.grid; ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath(); ctx.moveTo(userX + 10, y); ctx.lineTo(edgeX - 40, y); ctx.stroke();
        ctx.fillStyle = active ? C.viz1 : C.muted;
        ctx.beginPath(); ctx.arc(userX, y, active ? 7 : 4, 0, Math.PI * 2); ctx.fill();
        lab(userX - 12, y + 4, `${e.userRtt}ms`, C.muted, 8, "right");

        // back-haul link, only lit when this request used it
        const usedBack = active && (s.hop === "origin" || s.hop === "shield-hit");
        const midX = s.shielded ? shieldX - 34 : originX - 38;
        ctx.strokeStyle = usedBack ? (s.hop === "origin" ? C.viz2 : C.viz4) : C.grid;
        ctx.lineWidth = usedBack ? 2.5 : 0.8;
        ctx.setLineDash(usedBack ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(edgeX + 40, y); ctx.lineTo(midX, oy); ctx.stroke();
        ctx.setLineDash([]);
      }
      if (s.shielded) {
        const lit = s.hop === "origin";
        ctx.strokeStyle = lit ? C.viz2 : C.grid; ctx.lineWidth = lit ? 2.5 : 0.8;
        ctx.setLineDash(lit ? [] : [3, 4]);
        ctx.beginPath(); ctx.moveTo(shieldX + 34, oy); ctx.lineTo(originX - 38, oy); ctx.stroke();
        ctx.setLineDash([]);
      }

      // status chip for the current request
      if (s.obj >= 0) {
        const col = s.hop === "edge-hit" ? C.ok : s.hop === "shield-hit" ? C.warn : C.danger;
        lab(W - 16, 20, `/obj${s.obj}  ${s.hop.toUpperCase()}  ${s.ms} ms`, col, 12, "right");
      }

      // ---- latency histogram --------------------------------------------------
      const hx = 40, hy = H - 26, hh = H - topH - 54, hw = W * 0.5;
      const bw = hw / s.buckets.length;
      const maxB = Math.max(1, ...s.buckets);
      lab(hx, hy - hh - 12, "latency histogram (ms)", C.muted, 10);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + hw, hy); ctx.stroke();
      for (let i = 0; i < s.buckets.length; i++) {
        const bh = (s.buckets[i] / maxB) * hh;
        const lo = i * 25;
        ctx.fillStyle = lo < 50 ? C.viz3 : lo < 100 ? C.viz4 : C.viz2;
        ctx.beginPath(); ctx.roundRect(hx + i * bw + 2, hy - bh, Math.max(2, bw - 4), Math.max(0, bh), 2); ctx.fill();
        lab(hx + i * bw + bw / 2, hy + 12, i === s.buckets.length - 1 ? "175+" : String(lo), C.muted, 8, "center");
        if (s.buckets[i] > 0) lab(hx + i * bw + bw / 2, hy - bh - 4, String(s.buckets[i]), C.text2, 8, "center");
      }

      // ---- counters -----------------------------------------------------------
      const cx = hx + hw + 34;
      const total = Math.max(1, s.edgeHits + s.shieldHits + s.originFetches);
      const hr = ((s.edgeHits + s.shieldHits) / total) * 100;
      lab(cx, hy - hh + 2, `hit ratio      ${hr.toFixed(0)}%`, hr > 80 ? C.ok : C.warn, 13);
      lab(cx, hy - hh + 22, `edge hits      ${s.edgeHits}`, C.viz3, 12);
      if (s.shielded) lab(cx, hy - hh + 40, `shield hits    ${s.shieldHits}`, C.viz4, 12);
      lab(cx, hy - hh + (s.shielded ? 58 : 40), `origin fetches ${s.originFetches}`, C.viz2, 12);
      lab(cx, hy - 16, `p50 ${Math.round(s.p50)} ms    p95 ${Math.round(s.p95)} ms    avg ${s.avg.toFixed(0)} ms`, C.text2, 12);
      lab(cx, hy, `${s.done}/${s.n} requests`, C.muted, 10);
    }
  },

  drill: {
    cards: [
      { q: "Why can't backend optimization fix a cross-continent request?", a: "Light in fibre is ~200,000 km/s and real paths are ~1.5× great-circle, so London→New York is a ~75 ms RTT and a TLS handshake costs 2 RTTs before the first byte. Only moving the endpoint closer removes that.", tags: ["latency", "numbers"] },
      { q: "What is origin shield / tiered caching and what does it buy?", a: "A regional parent cache between the edge PoPs and the origin. Without it a cold object is fetched once per PoP (E times); with it the origin sees one fetch. With 8 PoPs that is an 8× reduction in origin load.", tags: ["offload"] },
      { q: "Cache-Control header for a content-hashed JS bundle?", a: "`public, max-age=31536000, immutable` — it can never be wrong because a change produces a new filename, and `immutable` stops browsers revalidating on reload.", tags: ["headers"] },
      { q: "Difference between max-age and s-maxage?", a: "`max-age` applies to all caches including the browser; `s-maxage` overrides it for shared caches (CDN) only. A long `s-maxage` with a short `max-age` keeps the edge warm while browsers recheck often.", tags: ["headers"] },
      { q: "What does stale-while-revalidate do?", a: "It lets a cache serve an expired response immediately while asynchronously refreshing it, so nobody ever waits on the origin for a revalidation. `stale-if-error` extends the same idea to origin outages.", tags: ["headers", "resilience"] },
      { q: "Name three things that silently destroy CDN hit ratio.", a: "Tracking query parameters in the cache key (`?utm_source=…`), an over-broad `Vary` (e.g. `Vary: User-Agent`), and `Set-Cookie` on static responses which makes many CDNs refuse to cache at all.", tags: ["pitfall"] },
      { q: "Request hit ratio vs byte hit ratio?", a: "Request ratio drives origin request load; byte ratio drives origin bandwidth. They diverge sharply — small uncached HTML plus large cached media gives a mediocre request ratio and an excellent byte ratio.", tags: ["metrics"] },
      { q: "Anycast vs GeoDNS for routing to a PoP?", a: "Anycast announces the same IP from every PoP and lets BGP pick — instant failover, but no control and route flaps can break long connections. GeoDNS returns a PoP-specific IP based on the resolver's location — more control, but gated on DNS TTLs and blind to the real client without EDNS Client Subnet.", tags: ["routing"] },
      { q: "How do you avoid ever needing a CDN purge?", a: "Version the URL — content-hash static assets, and for dynamic pages use surrogate keys so you invalidate by tag. A global purge propagates in seconds to minutes and is not a consistency primitive.", tags: ["invalidation"] }
    ],
    sixtySecond: [
      "Explain what a CDN buys you beyond latency, and quote the numbers for a cross-continent round trip.",
      "Explain how you'd cache a page whose HTML changes every minute but whose assets never change."
    ]
  }
};
