export default {
  id: "cdn",
  track: "sysdesign",
  title: "CDN & Edge Delivery",
  difficulty: 1,
  minutes: 13,
  tags: ["cdn", "edge", "latency", "http-caching", "origin-offload"],

  explainer: [
    {"type": "p", "text": "A **CDN (Content Delivery Network)** keeps copies of your files in many locations. Think of local warehouses: customers get an order nearby instead of asking a distant factory every time. The **origin** is your main server; an **edge** or **PoP** is a CDN location. Two wins: shorter journeys for users and fewer requests reaching your origin."},
    {"type": "image", "text": "User requests a photo from a nearby CDN edge. A cache hit replies locally; a miss fetches the distant origin.", "src": "data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22900%22%20height%3D%22300%22%20viewBox%3D%220%200%20900%20300%22%3E%3Crect%20width%3D%22900%22%20height%3D%22300%22%20rx%3D%2218%22%20fill%3D%22%23101827%22/%3E%3Cg%20font-family%3D%22Arial%2Csans-serif%22%20text-anchor%3D%22middle%22%20fill%3D%22%23ffffff%22%3E%3Ctext%20x%3D%22450%22%20y%3D%2240%22%20font-size%3D%2226%22%3EA%20nearby%20copy%20saves%20a%20long%20journey%3C/text%3E%3Crect%20x%3D%2230%22%20y%3D%2290%22%20width%3D%22180%22%20height%3D%2290%22%20rx%3D%2212%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22120%22%20y%3D%22125%22%20font-size%3D%2222%22%3EYou%3C/text%3E%3Ctext%20x%3D%22120%22%20y%3D%22155%22%20font-size%3D%2217%22%3Erequest%20/photo.jpg%3C/text%3E%3Crect%20x%3D%22310%22%20y%3D%2290%22%20width%3D%22220%22%20height%3D%2290%22%20rx%3D%2212%22%20fill%3D%22%23075985%22/%3E%3Ctext%20x%3D%22420%22%20y%3D%22125%22%20font-size%3D%2222%22%3ENearby%20CDN%20edge%3C/text%3E%3Ctext%20x%3D%22420%22%20y%3D%22155%22%20font-size%3D%2217%22%3Ecached%20copy%3C/text%3E%3Crect%20x%3D%22670%22%20y%3D%2290%22%20width%3D%22200%22%20height%3D%2290%22%20rx%3D%2212%22%20fill%3D%22%23334155%22/%3E%3Ctext%20x%3D%22770%22%20y%3D%22125%22%20font-size%3D%2222%22%3EDistant%20origin%3C/text%3E%3Ctext%20x%3D%22770%22%20y%3D%22155%22%20font-size%3D%2217%22%3Eoriginal%20file%3C/text%3E%3Ctext%20x%3D%22260%22%20y%3D%22125%22%20font-size%3D%2225%22%3E%E2%86%92%3C/text%3E%3Ctext%20x%3D%22260%22%20y%3D%22160%22%20font-size%3D%2225%22%3E%E2%86%90%3C/text%3E%3Ctext%20x%3D%22600%22%20y%3D%22132%22%20font-size%3D%2225%22%3E%E2%87%84%3C/text%3E%3Ctext%20x%3D%22600%22%20y%3D%22205%22%20font-size%3D%2216%22%20fill%3D%22%23fda4af%22%3EOnly%20if%20needed%3C/text%3E%3Ctext%20x%3D%22450%22%20y%3D%22260%22%20font-size%3D%2218%22%20fill%3D%22%23cbd5e1%22%3EHIT%3A%20reply%20from%20edge.%20MISS%3A%20fetch%20origin%2C%20then%20keep%20a%20copy%20if%20cacheable.%3C/text%3E%3C/g%3E%3C/svg%3E"},
    {"type": "p", "text": "Use **Play** to watch each journey, or **Next** to inspect a step. Arrows show message direction; the highlighted box marks the current action. Timing examples are illustrations, not measured promises."},
    {"type": "h3", "text": "1. Why nearby is faster"},
    {"type": "p", "text": "A **round trip (RTT)** is a message going out and a reply coming back. A nearby edge usually has a shorter RTT. Opening a new secure connection adds more exchanges; reusing a connection avoids much of that setup. DNS, server work, congestion, file size, and HTTP version also affect the total."},
    {"type": "steps", "text": "Distance: the same request, a shorter trip", "frames": [{"slots": ["You", "Distant origin\n80 ms RTT"], "text": "Without an edge, the request and response cross the long route. Example: one round trip is 80 ms.", "focus": 1}, {"slots": ["TCP setup\n80 ms", "TLS setup\n80 ms", "Request + reply\n80 ms"], "text": "Simplified cold TCP + TLS 1.3 connection: about three RTTs to the first response byte, or 240 ms, plus DNS and server work. This is not a rule for every protocol."}, {"slots": ["You", "Nearby edge\n20 ms RTT"], "text": "A cache hit at a nearby edge avoids the distant origin route.", "focus": 1}, {"slots": ["TCP setup\n20 ms", "TLS setup\n20 ms", "Request + reply\n20 ms"], "text": "The same simplified setup is about 60 ms here. Warm connections, resumption, and HTTP/3 change these costs."}]},
    {"type": "h3", "text": "2. How the request finds an edge"},
    {"type": "p", "text": "**Anycast** uses one IP address at several locations. Internet routers choose a route using **BGP**, their route-sharing system. **GeoDNS** instead chooses which IP address to return when a name is looked up. Both can guide users to an edge; neither guarantees the geographically closest server."},
    {"type": "steps", "text": "Anycast: one address, several doors", "frames": [{"slots": ["Mumbai edge\nsame IP", "London edge\nsame IP", "Singapore edge\nsame IP"], "text": "Several edge locations advertise the same service IP address."}, {"slots": ["You → service IP", "Internet routers\nchoose route", "Mumbai edge"], "text": "Routers select a route using their network policies and available paths. In this example it reaches Mumbai.", "focus": 1}, {"slots": ["You → Mumbai", "Mumbai edge\nhandles request", "Origin\nonly on miss"], "text": "The selected edge handles HTTPS and checks its cache. A good network route is not necessarily the shortest map distance.", "focus": 1}, {"slots": ["Mumbai route\nwithdrawn", "Routers\nconverge", "You → Singapore"], "text": "If that route is withdrawn, traffic can move elsewhere after routing converges. Failover is not instant, and existing connections may break.", "focus": 1}]},
    {"type": "steps", "text": "GeoDNS: the name lookup chooses an address", "frames": [{"slots": ["Browser\nasks for site IP", "DNS resolver", "CDN DNS"], "text": "A resolver looks up your hostname. CDN DNS can consider resolver location, health, and routing policy.", "focus": 1}, {"slots": ["DNS answer\nMumbai edge IP", "Resolver\ncaches answer", "Browser"], "text": "The browser gets an edge address and connects to it. Some setups use client-subnet hints to improve location estimates.", "focus": 0}, {"slots": ["Mumbai edge\nunavailable", "Old DNS answer\nstill cached", "New DNS answer\nSingapore IP"], "text": "A resolver may reuse its cached answer until its DNS TTL ends. New routing answers do not immediately replace every cached answer.", "focus": 1}]},
    {"type": "h3", "text": "3. Cache miss first, cache hit next"},
    {"type": "steps", "text": "Follow a photo through the CDN", "frames": [{"slots": ["You → edge\nGET /photo.jpg", "Edge\nno copy", "Origin\nhas photo"], "text": "First request: the edge checks its cache and finds no usable copy. This is a miss.", "focus": 1}, {"slots": ["You\nwaiting", "Edge → origin\nfetch photo", "Origin\nreturns photo"], "text": "The edge asks the origin, typically over HTTPS. Only cacheable responses may be stored.", "focus": 2}, {"slots": ["You ← edge\nphoto arrives", "Edge\nstores copy", "Origin\nfetch count: 1"], "text": "The edge sends the photo to you and keeps a cacheable copy for future requests.", "focus": 1}, {"slots": ["Next user → edge", "Edge\nfresh copy: HIT", "Origin\nnot contacted"], "text": "A later request with the same cache key gets the fresh copy locally. The origin does no work for this hit.", "focus": 1}]},
    {"type": "h3", "text": "4. A shield shares the first fetch"},
    {"type": "p", "text": "Different edges have separate caches. An **origin shield** is a parent cache they can ask before contacting your server. It reduces duplicate downloads; expiration, eviction, different keys, multiple shields, or simultaneous misses can still cause more origin requests."},
    {"type": "steps", "text": "Three edges ask for the same new file", "frames": [{"slots": ["Edge A → origin", "Edge B → origin", "Edge C → origin"], "text": "Without a shield, three cold edges can each fetch the same file: three origin requests."}, {"slots": ["Edge A → shield", "Shield\nMISS → origin", "Origin\nreturns file"], "text": "With a shared shield, the first edge request fills the shield. This example assumes sequential requests and a cacheable file.", "focus": 1}, {"slots": ["Edge B → shield", "Shield\nHIT → Edge B", "Origin\nidle"], "text": "The second edge downloads from the shield, not the origin.", "focus": 1}, {"slots": ["Edge C → shield", "Shield\nHIT → Edge C", "Origin\n1 fetch total"], "text": "The third edge also uses the shield. In this simple example, three origin fetches become one.", "focus": 1}]},
    {"type": "h3", "text": "5. Freshness: browser and edge have separate timers"},
    {"type": "p", "text": "**Cache-Control** tells caches when a response may be reused. `max-age` gives a freshness lifetime; `s-maxage` overrides it for shared caches. A response can be fresh without being the latest version at the origin. These timers use the response’s age, not a new full lifetime on every hit."},
    {"type": "steps", "text": "Example: max-age=60, s-maxage=300", "frames": [{"slots": ["Browser\nfresh to age 60s", "CDN edge\nfresh to age 300s", "Origin\noriginal response"], "text": "The browser has a short freshness window; the shared cache has a longer one."}, {"slots": ["Browser\nage 30s: fresh", "CDN edge\nnot contacted", "Origin\nnot contacted"], "text": "The browser can reuse its local copy without a network request.", "focus": 0}, {"slots": ["Browser → edge\nage 70s: stale", "Edge\nage 70s: fresh", "Origin\nnot contacted"], "text": "The browser needs a network check. The edge can satisfy it using its still-fresh copy, if the request permits reuse.", "focus": 1}, {"slots": ["Browser → edge", "Edge\nage 310s: stale", "Edge → origin\ncheck or fetch"], "text": "Once the shared copy is stale, it needs checking or replacement unless another directive permits stale reuse.", "focus": 2}]},
    {"type": "steps", "text": "Stale-while-revalidate: a limited grace period", "frames": [{"slots": ["Cached response\nmax-age=60", "Grace period\n+30 seconds", "Origin"], "text": "With stale-while-revalidate=30, the cache may reuse a stale copy while refreshing during a 30-second grace period."}, {"slots": ["User request\nage 70s", "Edge → user\nold copy now", "Edge → origin\nrefresh in background"], "text": "At age 70 seconds, stale reuse is allowed. The user can get a quick reply while a background check updates the cache.", "focus": 1}, {"slots": ["Next user", "Edge\nrefreshed copy", "Origin\nrefresh complete"], "text": "A successful refresh supplies a usable copy for later requests.", "focus": 1}, {"slots": ["Request\nage 100s, no refresh", "Edge\ngrace ended", "Origin\ncheck needed"], "text": "If no refresh succeeded, the grace period ends. This directive alone no longer permits stale reuse; a request may have to wait.", "focus": 2}]},
    {"type": "steps", "text": "ETag: ask whether the saved copy changed", "frames": [{"slots": ["Browser\nsaved body + ETag v1", "Edge / origin\ncurrent ETag v1"], "text": "An ETag is a version identifier. The client keeps it with the saved response.", "focus": 0}, {"slots": ["Browser → server\nIf-None-Match: v1", "Server\ncompare versions"], "text": "When checking freshness, the browser sends the saved ETag.", "focus": 1}, {"slots": ["Browser\nreuse saved body", "Server → browser\n304, no body"], "text": "If unchanged, 304 Not Modified lets the browser reuse its saved body. A network round trip still happened.", "focus": 1}, {"slots": ["Browser\nreplace saved copy", "Server → browser\n200 + new body + v2"], "text": "If the representation changed, the server sends the new body and ETag.", "focus": 1}]},
    {"type": "h3", "text": "6. The cache key decides what can be shared"},
    {"type": "p", "text": "A **cache key** identifies a saved response. URLs, selected query parameters, and headers can affect that identity, depending on CDN configuration. Remove tracking-only differences only when they do not change the response. Never share private account responses across users; use appropriate cache rules such as `private` or `no-store`."},
    {"type": "steps", "text": "One photo, or three separate cache entries?", "frames": [{"slots": ["/photo.jpg?utm=a", "/photo.jpg?utm=b", "/photo.jpg?utm=c"], "text": "If tracking parameters participate in the cache key, three URLs can produce three separate entries."}, {"slots": ["Tracking ignored\nby configured rule", "Shared key\n/photo.jpg", "One reusable copy"], "text": "If utm changes only analytics, configure the key to ignore it. Later requests can share one copy.", "focus": 1}, {"slots": ["/photo.jpg?w=200", "/photo.jpg?w=800", "Keep width\nin cache key"], "text": "Width changes the image. Keep meaningful parameters, or users could receive the wrong response.", "focus": 2}, {"slots": ["Accept-Encoding\ngzip variant", "Accept-Encoding\nbr variant", "Vary\nseparates variants"], "text": "Vary selects variants by request headers. Too many distinct variants reduce sharing; encoding variants serve different bytes.", "focus": 2}]},
    {"type": "h3", "text": "7. Publish new files without chasing old copies"},
    {"type": "p", "text": "Give a changed asset a new filename, such as `app.v2.js` or a content hash. A long freshness lifetime plus `immutable` suits files whose bytes never change at that URL. `immutable` does not mean cached forever. Your HTML must also update to point to the new file, and its own caching rules determine when users see that change."},
    {"type": "steps", "text": "Versioned URLs versus a global purge", "frames": [{"slots": ["HTML → app.v1.js", "Edge\ncopy of v1", "Origin\nv1 available"], "text": "The original page references version 1."}, {"slots": ["Deploy\napp.v2.js", "Origin\nv1 + v2", "HTML updated\nreferences v2"], "text": "Publish the new asset before publishing HTML that refers to it. The new URL has its own cache entry.", "focus": 2}, {"slots": ["Updated HTML\nasks for v2", "Edge\nv2 miss → fetch", "Old v1\ncan remain cached"], "text": "Users receiving updated HTML request v2. You do not have to erase v1 everywhere to serve v2.", "focus": 1}, {"slots": ["Same URL changed", "Purge message\nto many edges", "Propagation\nnot all at once"], "text": "If a URL must stay the same, invalidate its cached copies. Purge speed depends on the CDN; do not assume simultaneous worldwide updates.", "focus": 1}]},
    {"type": "h3", "text": "8. Dynamic requests and measuring the benefit"},
    {"type": "steps", "text": "Private API: forward it without sharing the response", "frames": [{"slots": ["You → nearby edge", "Edge\nHTTPS endpoint", "Origin\naccount API"], "text": "A CDN can proxy a request even when the response must not enter a shared cache.", "focus": 1}, {"slots": ["You\nwaiting", "Edge → origin\nforward request", "Origin\nchecks identity"], "text": "The origin still performs the personalized work. A CDN cannot eliminate this origin trip.", "focus": 2}, {"slots": ["You ← edge\nprivate result", "Edge\nno shared copy", "Origin\nresponse"], "text": "Connection reuse and better routes may help. The gain depends on the network and configuration; no fixed percentage is guaranteed.", "focus": 1}]},
    {"type": "steps", "text": "Request hit ratio is different from byte hit ratio", "frames": [{"slots": ["8 small requests\n1 KB each: MISS", "2 image requests\n1 MB each: HIT"], "text": "Ten requests: eight small misses and two large hits. Sizes here use decimal KB and MB."}, {"slots": ["2 / 10 requests HIT", "Request hit ratio\n20%", "Origin\n8 requests"], "text": "The origin handles 80% of requests, even though the big downloads hit.", "focus": 1}, {"slots": ["2 MB served by cache", "Total\n2.008 MB", "Byte hit ratio\n≈99.6%"], "text": "Nearly all bytes come from cache. Request hit ratio explains request load; byte hit ratio explains bandwidth.", "focus": 2}]},
    {"type": "callout", "text": "For an interview: “The CDN serves fresh public copies near users. On a miss it fetches the origin; a shield reduces duplicate fetches. Cache keys decide what can be shared, freshness rules decide how long, and versioned URLs make asset updates easier.”", "tone": "tip"},
    {"type": "p", "text": "Further reading: Cloudflare CDN reference architecture — https://developers.cloudflare.com/reference-architecture/architectures/cdn/ ; MDN Cache-Control — https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Cache-Control"},
  ],

  glossary: [
    { term: "PoP (Point of Presence)", plain: "One of a CDN's physical server locations spread around the world, positioned to be physically close to a cluster of users." },
    { term: "RTT (Round-Trip Time)", plain: "How long it takes for a message to travel to a destination and for a reply to come back — the basic unit of network latency." },
    { term: "TLS termination", plain: "The point where an encrypted HTTPS connection is decrypted back into plain data. On a CDN, this usually happens at the nearby edge rather than the distant origin server." },
    { term: "TCP + TLS handshake", plain: "The back-and-forth exchange of messages needed to open and secure a connection before any real data can be sent — it costs extra round trips before the first useful byte arrives." },
    { term: "Anycast / BGP", plain: "Anycast means announcing the same IP address from many locations at once. BGP (Border Gateway Protocol) is the internet-wide protocol routers use to decide how to forward traffic, and it's what makes anycast automatically route users to the a location selected by network routing policy." },
    { term: "GeoDNS", plain: "A DNS setup that returns a different server address depending on roughly where the request seems to be coming from, used to route users toward a nearby location." },
    { term: "Origin (server)", plain: "The original, authoritative server that holds the real copy of the data — the 'factory' that a CDN's edge locations exist to protect from having to serve every single request directly." },
    { term: "Tiered caching / origin shield", plain: "An extra caching layer placed between all the edge locations and the origin server, so edges can share upstream copies and reduce repeated origin fetches." },
    { term: "Cache-Control header", plain: "An HTTP response header that tells browsers and CDNs how long they're allowed to keep and reuse a copy of the response before checking back for a fresh one." },
    { term: "s-maxage vs max-age", plain: "max-age sets how long any cache (including the user's own browser) may keep a response. s-maxage overrides that specifically for shared caches like a CDN, letting you set different freshness rules for the edge versus the browser." },
    { term: "stale-while-revalidate", plain: "A caching instruction meaning: if the cached copy just expired, serve it anyway right away, and quietly fetch a fresh copy in the background for the next request — during the permitted stale window; after that window requests may need to wait." },
    { term: "ETag / 304 Not Modified", plain: "An ETag is a short fingerprint of a response's content. A client can send it back on a later request, and if nothing changed the server replies '304 Not Modified' with no body at all, saving bandwidth." },
    { term: "Surrogate key", plain: "A tag attached to one or more cached responses (like 'product-42') so that a single invalidation call can purge every cached page that happens to reference that tag, without needing to know every individual URL involved." }
  ],

  complexity: {
    rows: [
      { operation: "Same-city RTT", time: "~5–20 ms", space: "—", note: "user → edge PoP" },
      { operation: "Cross-continent RTT", time: "~70–150 ms", space: "—", note: "edge → distant origin" },
      { operation: "Cold TCP + TLS 1.3 + request", time: "~3 × RTT", space: "—", note: "simplified first-byte model; excludes DNS and server work" },
      { operation: "Origin fetches, no shield", time: "E per object", space: "O(E·objects)", note: "E = number of PoPs" },
      { operation: "Origin fetches, with shield", time: "~1 per cold object", space: "O(objects) at the shield", note: "ideal shared shield; no expiry, eviction or duplicate concurrent fetches" }
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
      { q: "Cache-Control header for a content-hashed JS bundle?", a: "`public, max-age=31536000, immutable` — a changed asset gets a new filename; freshness still ends after the specified lifetime, and `immutable` stops browsers revalidating on reload.", tags: ["headers"] },
      { q: "Difference between max-age and s-maxage?", a: "`max-age` applies to all caches including the browser; `s-maxage` overrides it for shared caches (CDN) only. A long `s-maxage` with a short `max-age` keeps the edge warm while browsers recheck often.", tags: ["headers"] },
      { q: "What does stale-while-revalidate do?", a: "It lets a cache serve an expired response immediately while asynchronously refreshing it, within the allowed stale window; later requests may wait. `stale-if-error` extends the same idea to origin outages.", tags: ["headers", "resilience"] },
      { q: "Name three things that silently destroy CDN hit ratio.", a: "Tracking query parameters in the cache key (`?utm_source=…`), an over-broad `Vary` (e.g. `Vary: User-Agent`), and `Set-Cookie` on static responses which makes many CDNs refuse to cache at all.", tags: ["pitfall"] },
      { q: "Request hit ratio vs byte hit ratio?", a: "Request ratio drives origin request load; byte ratio drives origin bandwidth. They diverge sharply — small uncached HTML plus large cached media gives a mediocre request ratio and an excellent byte ratio.", tags: ["metrics"] },
      { q: "Anycast vs GeoDNS for routing to a PoP?", a: "Anycast announces the same IP from every PoP and lets BGP pick — failover after routing convergence and route flaps can break long connections. GeoDNS returns a PoP-specific IP based on the resolver's location — more control, but gated on DNS TTLs and blind to the real client without EDNS Client Subnet.", tags: ["routing"] },
      { q: "How do you avoid ever needing a CDN purge?", a: "Version the URL — content-hash static assets, and for dynamic pages use surrogate keys so you invalidate by tag. A global purge propagates in seconds to minutes and is not a consistency primitive.", tags: ["invalidation"] }
    ],
    sixtySecond: [
      "Explain what a CDN buys you beyond latency, and quote the numbers for a cross-continent round trip.",
      "Explain how you'd cache a page whose HTML changes every minute but whose assets never change."
    ]
  }
};
