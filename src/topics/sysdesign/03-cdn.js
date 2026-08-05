export default {
  id: "cdn",
  track: "sysdesign",
  title: "CDN & Edge Delivery",
  difficulty: 1,
  minutes: 13,
  tags: ["cdn", "edge", "latency", "http-caching", "origin-offload"],

  explainer: [
    { type: "p", text: "A CDN — Content Delivery Network — is a large network of cache servers spread across many physical locations around the world, so that a copy of your website's files sits physically close to whoever is requesting them. Think of it like a chain of local warehouses instead of one central factory: instead of every customer's order traveling all the way to the factory (your \"origin\" server) and back, most orders get filled from the nearest warehouse. The CDN does two things for you: it cuts the round-trip time by moving bytes physically closer to users, and it cuts the traffic your own origin server has to handle, often by a factor of ten or more, because most requests never reach it at all." },

    { type: "h3", text: "The physics you cannot argue your way around" },
    { type: "p", text: "Light traveling through fiber-optic cable moves at roughly **200,000 km/s** — slower than in a vacuum — and real network paths are typically about 1.5 times longer than the straight-line (\"great-circle\") distance, because cables follow real-world routes, not straight lines. London to New York is about 5,600 km, so the theoretical one-way trip is around 28 ms, and a real **RTT** (Round-Trip Time — the time for a message to go out and a reply to come back) ends up around **70-90 ms**. On top of that, setting up a secure connection (a TCP handshake plus a TLS 1.3 handshake — the steps that establish and encrypt a connection before any real data flows) costs **2 full round trips** before the first byte of actual content arrives. So a cold cross-Atlantic HTTPS request can take roughly 250 ms *before the server has done a single bit of work*. Serving the same request from a nearby edge location just 20 ms away instead turns that into roughly 60 ms. This is the core lesson of the whole topic: **no amount of clever backend code can undo a bad round trip — only physical distance can fix physical distance.**" },

    { type: "h3", text: "How a request actually finds a nearby edge" },
    { type: "list", items: [
      "**Anycast over BGP** — the exact same IP address is announced from every **PoP** (Point of Presence — one of the CDN's physical edge locations) simultaneously, using BGP (Border Gateway Protocol, the protocol that routers use to decide how to forward traffic across the internet). The internet's own routing infrastructure then automatically delivers each user to whichever PoP is topologically nearest. This makes failover very fast (just stop announcing the address from a broken location), though a sudden change in routing (a \"route flap\") can occasionally shift an already-open connection to a different PoP mid-stream.",
      "**DNS-based routing (GeoDNS)** — instead of one IP for everyone, the DNS system returns a different, PoP-specific IP address depending on where the request seems to be coming from. This is coarser than anycast, because by default it sees the location of the user's DNS resolver rather than the user themselves (unless a feature called EDNS Client Subnet is enabled to pass along more location detail), and it's constrained by DNS TTLs — how long resolvers are allowed to cache an old answer before asking again.",
      "Once a request lands at a PoP: TLS is decrypted right there at the edge, the edge checks whether it already has the requested content cached, and if not (\"a miss\"), it fetches it from the origin over a connection that's typically already open, warmed up, and tuned for that specific route."
    ]},

    { type: "h3", text: "Origin offload is the number worth quoting in an interview" },
    { type: "p", text: "With E separate edge locations each caching independently, a brand-new (\"cold\") piece of content gets fetched from the origin server up to E separate times — once per PoP that happens to see a first request for it. **Tiered caching**, also called an **origin shield**, fixes this by inserting one additional regional cache layer between all the edges and the origin, so the origin only ever sees *one* fetch per object, no matter how many edges eventually want it. With 8 PoPs and 10,000 distinct objects, that's the difference between 80,000 origin requests and just 10,000 — an 8× cut in origin load, essentially for free." },
    { type: "p", text: "As a concrete example: 10 million page views a day, 2 MB per page, with 95% of those bytes being static assets (images, scripts, stylesheets that don't change per request). That's 20 TB a day, which works out to roughly **1.9 Gbps average, and around 5 Gbps at peak** traffic. Routed through a CDN with a 95% byte hit ratio (95% of bytes served from cache rather than the origin), the origin itself only needs to serve about 250 Mbps — one modest server instead of an entire fleet — and the CDN's own outbound bandwidth (\"egress\") typically bills at a cheaper per-gigabyte rate than running that traffic straight from your own servers." },

    { type: "h3", text: "Cache-Control headers are the actual API you're programming against" },
    { type: "list", items: [
      "`Cache-Control: public, max-age=31536000, immutable` on a **content-hashed** filename (like `app.9f3a1c.js`, where the random-looking string is derived from the file's actual contents) tells every cache along the way: never expire this, never bother re-checking it, just serve it forever. Because a new deploy produces a new filename (the hash changes when the content changes), this single header is essentially the entire caching strategy for static assets.",
      "`s-maxage` controls how long *shared* caches (the CDN itself) may keep a response, while plain `max-age` controls the browser's own local cache. Pairing a long `s-maxage` with a short `max-age` lets the CDN edge hold onto content for a long time while browsers still check back reasonably often.",
      "`stale-while-revalidate=60` tells the cache: if this response just expired, go ahead and serve the (now slightly stale) copy immediately anyway, while quietly fetching a fresh one in the background for next time. This is arguably the single most valuable header for smoothing out tail latency, because no user ever has to wait for the refresh.",
      "`ETag` combined with `If-None-Match` lets a client ask \"has this actually changed since I last saw it?\" and get back a **304 Not Modified** response if not — still a full round trip, but transferring only a couple hundred bytes instead of, say, 2 MB of unchanged content.",
      "`Vary: Accept-Encoding` (varying the cached response by whether the client accepts compression) is harmless and normal. `Vary: User-Agent`, on the other hand, fragments a single cacheable object into thousands of near-identical entries — one per distinct browser/OS string seen — which destroys the effective hit ratio."
    ]},

    { type: "callout", tone: "pitfall", text: "Query strings are part of the cache key by default — meaning `/page` and `/page?utm_source=twitter` are treated as two entirely different cached objects. One innocuous tracking parameter appended by a marketing tool can turn a single popular, cacheable page into millions of unique cache misses. Strip unnecessary query parameters, or explicitly allow-list only the ones that actually change the response, right at the edge." },

    { type: "h3", text: "Invalidation and dynamic content" },
    { type: "p", text: "A global purge — telling every PoP worldwide to drop a cached object right now — is not instant. It's a broadcast message to potentially hundreds of physical locations, and it takes anywhere from seconds to minutes to fully propagate. **The best strategy is to design around ever needing one at all**, by versioning the URL itself (so a changed file simply gets a new address, and the old cached copy just becomes irrelevant rather than needing to be deleted). When you genuinely must purge, purge by a **surrogate key** (a tag you attach to a cached response, like `product-42`) rather than by individual URL, so that a single product update can invalidate every page that happened to embed that product with one call." },
    { type: "p", text: "Modern CDNs also speed up requests that can never be cached at all — a personalized API response, for example. TLS still terminates at the nearby edge (saving the user those 2 round trips of latency versus going all the way to a distant origin), and the edge-to-origin leg of the journey rides a long-lived, pre-warmed, congestion-tuned connection over the CDN's own private backbone network rather than the public internet. That alone can shave 30-50% off a fully dynamic, zero-cache-hit API call." },

    { type: "callout", tone: "tip", text: "Keep **request hit ratio** and **byte hit ratio** distinct in your head. A CDN can hit on 60% of *requests* but 98% of *bytes*, because the requests that miss tend to be small HTML pages while the requests that hit tend to be large media files. Origin *request load* (how many separate requests it has to handle) tracks the request hit ratio; origin *bandwidth* (how much data it has to push) tracks the byte hit ratio. Be explicit about which one you're quoting." }
  ],

  glossary: [
    { term: "PoP (Point of Presence)", plain: "One of a CDN's physical server locations spread around the world, positioned to be physically close to a cluster of users." },
    { term: "RTT (Round-Trip Time)", plain: "How long it takes for a message to travel to a destination and for a reply to come back — the basic unit of network latency." },
    { term: "TLS termination", plain: "The point where an encrypted HTTPS connection is decrypted back into plain data. On a CDN, this usually happens at the nearby edge rather than the distant origin server." },
    { term: "TCP + TLS handshake", plain: "The back-and-forth exchange of messages needed to open and secure a connection before any real data can be sent — it costs extra round trips before the first useful byte arrives." },
    { term: "Anycast / BGP", plain: "Anycast means announcing the same IP address from many locations at once. BGP (Border Gateway Protocol) is the internet-wide protocol routers use to decide how to forward traffic, and it's what makes anycast automatically route users to the nearest announcing location." },
    { term: "GeoDNS", plain: "A DNS setup that returns a different server address depending on roughly where the request seems to be coming from, used to route users toward a nearby location." },
    { term: "Origin (server)", plain: "The original, authoritative server that holds the real copy of the data — the 'factory' that a CDN's edge locations exist to protect from having to serve every single request directly." },
    { term: "Tiered caching / origin shield", plain: "An extra caching layer placed between all the edge locations and the origin server, so the origin only has to serve each distinct piece of content once, no matter how many edges eventually request it." },
    { term: "Cache-Control header", plain: "An HTTP response header that tells browsers and CDNs how long they're allowed to keep and reuse a copy of the response before checking back for a fresh one." },
    { term: "s-maxage vs max-age", plain: "max-age sets how long any cache (including the user's own browser) may keep a response. s-maxage overrides that specifically for shared caches like a CDN, letting you set different freshness rules for the edge versus the browser." },
    { term: "stale-while-revalidate", plain: "A caching instruction meaning: if the cached copy just expired, serve it anyway right away, and quietly fetch a fresh copy in the background for the next request — so no user ever waits on the refresh." },
    { term: "ETag / 304 Not Modified", plain: "An ETag is a short fingerprint of a response's content. A client can send it back on a later request, and if nothing changed the server replies '304 Not Modified' with no body at all, saving bandwidth." },
    { term: "Surrogate key", plain: "A tag attached to one or more cached responses (like 'product-42') so that a single invalidation call can purge every cached page that happens to reference that tag, without needing to know every individual URL involved." }
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
