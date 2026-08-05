export default {
  id: "tokens-context",
  track: "agents",
  title: "Tokenization & Context Windows",
  difficulty: 1,
  minutes: 14,
  tags: ["tokens", "context-window", "cost", "prompt-caching"],

  explainer: [
    { type: "p", text: "A language model never sees characters. Text is first split by a **tokenizer** — a fixed vocabulary of ~100k subword pieces learned by byte-pair encoding. `\"tokenization\"` might become `token` + `ization`; a rare proper noun might become five pieces; a space is usually glued onto the *front* of the following token, which is why `\"hello\"` and `\" hello\"` are different tokens." },
    { type: "p", text: "Two consequences interviewers probe: token counts are **not** proportional to word counts (English averages ~3.5–4 chars/token, code and non-English are far worse), and they are **model-specific**. Claude Opus 4.7 shipped a new tokenizer, so the same string counts differently on Opus 4.6 vs Opus 5. Never estimate with another vendor's tokenizer — `tiktoken` is OpenAI's and undercounts Claude by 15–20% on prose and much more on code." },

    { type: "h3", text: "The context window is a hard wall, not a suggestion" },
    { type: "p", text: "Claude Opus 5, Sonnet 5 and Fable 5 have a 1M-token context window; Haiku 4.5 has 200K. That budget covers **everything**: system prompt, tool schemas, every prior turn, retrieved documents, thinking tokens, and the response being generated. `max_tokens` caps output only, and on models where thinking is on by default it caps thinking **plus** the visible answer — a limit tuned for a non-thinking model can now truncate mid-sentence." },
    { type: "callout", tone: "pitfall", text: "The Messages API is **stateless**. There is no server-side conversation. Every turn you re-send the entire history, so a 20-turn chat pays for turn 1's tokens twenty times. Cost grows quadratically in turns, not linearly — this is the single most common surprise on a first production bill." },

    { type: "h3", text: "What you actually pay for" },
    { type: "list", items: [
      "**Input tokens** — everything you send. Claude Opus 5: $5 / M. Sonnet 5: $3 / M. Haiku 4.5: $1 / M.",
      "**Output tokens** — everything generated, including thinking. Opus 5: $25 / M. Sonnet 5: $15 / M. Haiku 4.5: $5 / M. Output is 5× input, so verbosity is the expensive end.",
      "**Cache writes** — 1.25× input price (2× for the 1-hour TTL). Paid once per distinct prefix.",
      "**Cache reads** — ~0.1× input price. This is the lever that makes long-context agents affordable."
    ]},
    { type: "p", text: "Prompt caching is a **prefix match**: the cache key is the exact bytes of `tools` → `system` → `messages` up to each `cache_control` breakpoint. One changed byte anywhere in the prefix invalidates everything after it. Interpolating `datetime.now()` into the system prompt is the classic silent cache killer — you will see `cache_read_input_tokens: 0` forever and never get an error." },
    { type: "callout", tone: "tip", text: "Verify caching empirically: `usage.cache_read_input_tokens` on the response. Total prompt size is `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` — `input_tokens` alone is only the *uncached remainder*, which is why an agent that ran for an hour can report 4K input tokens." },

    { type: "h3", text: "Running out of room" },
    { type: "p", text: "When history outgrows the window you have four options, in increasing order of loss: **prompt caching** (does not shrink anything, just makes re-sending cheap), **context editing** (clear stale tool results), **compaction** (summarize old turns server-side), and **truncation** (drop the oldest messages — the strategy the visualizer animates, and the one that silently eats your system prompt if you implement it naively)." },
    { type: "code", lang: "python", code: "resp = client.messages.count_tokens(\n    model=\"claude-opus-5\",\n    system=SYSTEM,\n    tools=TOOLS,          # tool schemas count too — people forget this\n    messages=history,\n)\nprint(resp.input_tokens)   # exact, model-specific, free to call" }
  ],

  complexity: {
    rows: [
      { operation: "Naive multi-turn chat", time: "O(t²) tokens over t turns", space: "O(t) context", note: "stateless API: full history re-sent each turn" },
      { operation: "…with prompt caching", time: "O(t²) tokens, ~0.1× price on the cached prefix", space: "O(t)", note: "cache read ≈ 10% of input price" },
      { operation: "…with sliding-window truncation", time: "O(t·w) tokens, w = window cap", space: "O(w)", note: "bounded cost, unbounded amnesia" },
      { operation: "…with summarization / compaction", time: "O(t·w) + one summary call per overflow", space: "O(w)", note: "lossy but keeps a thread of the past" },
      { operation: "Counting tokens", time: "1 API call, free", space: "—", note: "messages.count_tokens, model-specific" }
    ]
  },

  interview: {
    whyAsked: "It separates people who have shipped an LLM feature from people who have called one. The signal is whether you know the API is stateless, that cost is quadratic in turns without caching, and that the context window is shared by system prompt, tools, history and output — not just 'the user's message'.",
    followUps: [
      { q: "Why does a long chat get more expensive per turn even when the user's messages stay short?", a: "The Messages API is stateless, so each request carries the whole conversation as input. Turn 20 re-sends turns 1–19, making total spend quadratic in turn count. Prompt caching fixes the price (cache reads are ~0.1× input) but not the token count — you still transmit and count the full prefix." },
      { q: "How would you estimate token count for a document without calling the API?", a: "You can approximate at ~4 characters per token for English prose and ~2.5–3 for code, but only as a rough guardrail. For anything that gates a decision, call `messages.count_tokens` with the exact model, system prompt, tools and messages — counts are model-specific and tool schemas are easy to forget. Never use another vendor's tokenizer." },
      { q: "Your cache hit rate is zero despite setting `cache_control`. Where do you look?", a: "Something in the prefix changes per request. Render order is tools → system → messages, so check for a timestamp or UUID interpolated into the system prompt, non-deterministic JSON serialization (unsorted dict keys, set iteration), a per-user tool list, or conditional system sections. Also check the prefix is above the model's cacheable minimum — 512 tokens on Opus 5, 1024 on Opus 4.8 — below which it silently will not cache." },
      { q: "You have a 1M-token window. Should you just put everything in it?", a: "No. You pay for every token on every turn, latency scales with prompt size, and retrieval quality degrades — models attend less reliably to material buried in the middle of a very long context ('context rot'). Treat the window as a working set: put in what the current step needs, and reach for retrieval or a file-backed memory for the rest." },
      { q: "Where do thinking tokens land in the budget?", a: "They are output tokens: billed at the output rate and counted against `max_tokens` alongside the visible answer. On Claude Opus 5 thinking is on by default, so a request that omits the `thinking` parameter now spends output tokens it did not before — `max_tokens` values tuned on a non-thinking model can truncate the answer." },
      { q: "How do you bound cost for an unbounded conversation?", a: "Layer three things: prompt caching so the stable prefix is cheap, context editing or compaction so the history stops growing, and a hard `max_tokens` plus a turn cap in the harness. For agent loops, an explicit token budget the model can see (`task_budget`) makes it pace itself rather than getting cut off mid-task." }
    ]
  },

  code: [
    { lang: "python", label: "Count before you send", code: "import anthropic\n\nclient = anthropic.Anthropic()\n\nPRICES = {                       # USD per 1M tokens\n    \"claude-opus-5\":    (5.00, 25.00),\n    \"claude-sonnet-5\":  (3.00, 15.00),\n    \"claude-haiku-4-5\": (1.00,  5.00),\n}\n\ndef estimate(model, system, tools, messages, expected_output=800):\n    # Exact, model-specific, and free. Tool schemas count as input too.\n    n_in = client.messages.count_tokens(\n        model=model, system=system, tools=tools, messages=messages\n    ).input_tokens\n    p_in, p_out = PRICES[model]\n    return n_in, (n_in / 1e6) * p_in + (expected_output / 1e6) * p_out\n\nn, usd = estimate(\"claude-opus-5\", SYSTEM, TOOLS, history)\nprint(f\"{n} input tokens -> ${usd:.4f} for this single turn\")" },

    { lang: "python", label: "Cache the stable prefix", code: "# Render order is tools -> system -> messages. A breakpoint on the last\n# system block caches tools + system together.\nresp = client.messages.create(\n    model=\"claude-opus-5\",\n    max_tokens=16000,\n    system=[{\n        \"type\": \"text\",\n        \"text\": BIG_STABLE_PROMPT,          # NO timestamps, NO user ids in here\n        \"cache_control\": {\"type\": \"ephemeral\"},\n    }],\n    tools=TOOLS,                            # serialize deterministically!\n    messages=history + [{\"role\": \"user\", \"content\": question}],\n)\n\nu = resp.usage\nprint(u.cache_creation_input_tokens,   # written this request  (~1.25x price)\n      u.cache_read_input_tokens,       # served from cache     (~0.10x price)\n      u.input_tokens)                  # uncached remainder    (1.00x price)\n# total prompt = the sum of all three, not input_tokens alone" },

    { lang: "python", label: "Sliding window that never evicts the system prompt", code: "def fit(system, messages, cap_tokens, model=\"claude-opus-5\"):\n    \"\"\"Drop oldest turns until the request fits. Keep system + last user turn.\"\"\"\n    lo = 0\n    while lo < len(messages) - 1:\n        n = client.messages.count_tokens(\n            model=model, system=system, messages=messages[lo:]\n        ).input_tokens\n        if n <= cap_tokens:\n            break\n        lo += 2                    # drop a whole user/assistant pair, never half\n    kept = messages[lo:]\n    # A tool_result must never be orphaned from its tool_use.\n    if kept and kept[0][\"role\"] == \"user\" and _has_tool_result(kept[0]):\n        kept = kept[1:]\n    return kept" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 2.0, maxFrames: 320 },

    params: [
      { key: "cap",   label: "Context window (tokens)", type: "int", min: 12, max: 60, default: 36 },
      { key: "model", label: "Model", type: "enum", options: ["claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"], default: "claude-opus-5" },
      { key: "cache", label: "Prompt caching", type: "enum", options: ["off", "on"], default: "off" },
      { key: "seed",  label: "Re-roll questions", type: "seed" }
    ],

    frames: function* (params, rng) {
      const cap = params.cap;
      const priceTable = {
        "claude-opus-5":    [5, 25],
        "claude-sonnet-5":  [3, 15],
        "claude-haiku-4-5": [1, 5]
      };
      const price = priceTable[params.model] || priceTable["claude-opus-5"];
      const caching = params.cache === "on";

      // --- a deliberately crude BPE-ish splitter: subwords + leading-space marks
      const tokenize = (s) => {
        const out = [];
        for (const w of s.split(" ")) {
          if (!w.length) continue;
          let rest = w, first = true;
          while (rest.length) {
            const n = rest.length <= 5 ? rest.length : (rest.length <= 8 ? 4 : 5);
            out.push((first ? "·" : "") + rest.slice(0, n));
            rest = rest.slice(n);
            first = false;
          }
        }
        return out;
      };

      const questions = [
        "what is the refund window",
        "does that cover digital goods",
        "how long until the money lands",
        "can I return a gift without a receipt",
        "what if the box is already open"
      ];
      const answers = [
        "Thirty days from delivery for any unopened item.",
        "Digital goods are refundable within fourteen days.",
        "Refunds settle to the original card in five days.",
        "Yes with the order number the gift can be returned.",
        "Opened boxes qualify only if the item is defective."
      ];
      const qi = [], ai = [];
      for (let k = 0; k < 5; k++) {
        qi.push(Math.floor(rng() * questions.length));
        ai.push(Math.floor(rng() * answers.length));
      }

      let tiles = [];          // {t, role}
      let evicted = [];        // last few evicted tokens, for the shredder lane
      let evictedCount = 0;
      let billedIn = 0, billedOut = 0, cachedIn = 0;
      let turn = 0;

      const cost = () =>
        (billedIn / 1e6) * price[0] +
        (cachedIn / 1e6) * price[0] * 0.1 +
        (billedOut / 1e6) * price[1];

      const snap = (extra) => Object.assign({
        tiles: tiles.slice(),
        evicted: evicted.slice(-8),
        evictedCount,
        cap,
        turn,
        billedIn,
        billedOut,
        cachedIn,
        cost: cost(),
        model: params.model,
        caching,
        systemAlive: tiles.some((x) => x.role === "system")
      }, extra || {});

      const push = (tok, role) => {
        tiles = tiles.concat([{ t: tok, role }]);
        if (tiles.length > cap) {
          const gone = tiles[0];
          evicted = evicted.concat([gone]);
          evictedCount++;
          tiles = tiles.slice(1);
          return gone;
        }
        return null;
      };

      yield {
        label: `Empty ${cap}-token window. Everything the model will ever see this turn — system prompt, tools, history, and the answer it is generating — has to fit in here.`,
        phase: "init",
        state: snap({ hi: -1 })
      };

      const SYSTEM = "You are a returns agent. Always cite the policy id.";
      const sysToks = tokenize(SYSTEM);
      for (let i = 0; i < sysToks.length; i++) {
        push(sysToks[i], "system");
        yield {
          label: i === 0
            ? `Tokenizing the system prompt. "${SYSTEM.split(" ")[0]}" becomes token \`${sysToks[0]}\` — the "·" marks the leading space, which is part of the token.`
            : `System prompt token ${i + 1}/${sysToks.length}: \`${sysToks[i]}\`. ${sysToks[i].startsWith("·") ? "New word." : "A word split mid-way — long words cost several tokens."}`,
          phase: "system",
          focus: [tiles.length - 1],
          state: snap({ hi: tiles.length - 1 })
        };
      }

      yield {
        label: `System prompt = ${sysToks.length} tokens for ${SYSTEM.length} characters (~${(SYSTEM.length / sysToks.length).toFixed(1)} chars/token). It is re-sent on every single turn.`,
        phase: "system",
        state: snap({ hi: -1 })
      };

      for (let t = 0; t < 5; t++) {
        turn = t + 1;
        const q = questions[qi[t]], a = answers[ai[t]];

        for (const tok of tokenize(q)) {
          const gone = push(tok, "user");
          yield {
            label: gone
              ? `Window full — the oldest token \`${gone.t}\` (${gone.role}) is evicted to make room. ${gone.role === "system" ? "That was part of the system prompt: the agent has just forgotten its own instructions." : "Naive truncation always eats the oldest context first."}`
              : `Turn ${turn} user token: \`${tok}\`.`,
            phase: "user",
            focus: [tiles.length - 1],
            state: snap({ hi: tiles.length - 1 })
          };
        }

        // Billing frame: the whole window is re-sent as input.
        const promptTokens = tiles.length;
        if (caching && t > 0) {
          cachedIn += promptTokens - tokenize(q).length;
          billedIn += tokenize(q).length;
        } else {
          billedIn += promptTokens;
        }
        yield {
          label: caching && t > 0
            ? `Request ${turn}: the ${promptTokens}-token prompt is sent again, but the stable prefix is a cache hit — ${promptTokens - tokenize(q).length} tokens bill at ~0.1×, only the new question at full price.`
            : `Request ${turn}: the API is stateless, so all ${promptTokens} tokens in the window are re-sent and re-billed as input. Turn 1's tokens have now been paid for ${turn} time${turn === 1 ? "" : "s"}.`,
          phase: "billing",
          state: snap({ hi: -1, billingFlash: true })
        };

        const aToks = tokenize(a);
        for (const tok of aToks) {
          const gone = push(tok, "assistant");
          billedOut += 1;
          yield {
            label: gone
              ? `Generating: \`${tok}\`. Output tokens land in the same window — writing evicts \`${gone.t}\`. ${gone.role === "system" ? "The system prompt is being consumed by the model's own answer." : ""}`
              : `Generating: \`${tok}\`. Output bills at $${price[1]}/M — five times the input rate.`,
            phase: "assistant",
            focus: [tiles.length - 1],
            state: snap({ hi: tiles.length - 1 })
          };
        }
      }

      yield {
        label: `Five turns: ${billedIn + cachedIn} input tokens billed (${cachedIn} of them at cache rates) + ${billedOut} output = $${cost().toFixed(6)}. At 10,000 conversations/day that is $${(cost() * 10000).toFixed(2)}/day — ${evictedCount} tokens fell out of the window and are gone forever.`,
        phase: "done",
        state: snap({ hi: -1 })
      };
    },

    draw: function (frame, root, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      const NS = "http://www.w3.org/2000/svg";

      const mk = (tag, attrs, txt) => {
        let n;
        if (env.h) { n = env.h(tag, attrs); }
        else {
          n = document.createElementNS(NS, tag);
          for (const k in attrs) if (attrs[k] !== null && attrs[k] !== undefined) n.setAttribute(k, String(attrs[k]));
        }
        if (txt !== undefined && txt !== null) n.textContent = String(txt);
        return n;
      };
      while (root.firstChild) root.removeChild(root.firstChild);
      root.setAttribute("viewBox", "0 0 " + W + " " + H);

      const clip = (s, maxChars) =>
        s.length > maxChars ? s.slice(0, Math.max(1, maxChars - 1)) + "…" : s;

      const roleColor = (r) =>
        r === "system" ? C.viz7 : r === "user" ? C.viz1 : C.viz3;

      // ---------------- header -------------------------------------------
      root.appendChild(mk("text", {
        x: 20, y: 24, fill: C.text, "font-family": env.font.base, "font-size": 14
      }, "Context window — " + S.model));

      root.appendChild(mk("text", {
        x: 20, y: 42, fill: C.muted, "font-family": env.font.mono, "font-size": 11
      }, S.tiles.length + " / " + S.cap + " tokens used   ·   turn " + S.turn +
         "   ·   caching " + (S.caching ? "ON" : "OFF")));

      // ---------------- layout -------------------------------------------
      const panelW = 216;
      const boxX = 20, boxY = 84;
      const boxW = W - panelW - 56, boxH = H - boxY - 54;

      // window frame
      root.appendChild(mk("rect", {
        x: boxX, y: boxY, width: boxW, height: boxH, rx: 8,
        fill: C.surface, stroke: S.tiles.length >= S.cap ? C.warn : C.border,
        "stroke-width": S.tiles.length >= S.cap ? 2 : 1
      }));

      const cols = 9;
      const rows = Math.max(1, Math.ceil(S.cap / cols));
      const pad = 10;
      const tw = (boxW - pad * 2) / cols;
      const th = Math.min(30, (boxH - pad * 2) / rows);
      const fs = Math.max(7, Math.min(11, tw / 4.4));
      const maxChars = Math.max(2, Math.floor((tw - 6) / (fs * 0.62)));

      // empty slots
      for (let i = 0; i < S.cap; i++) {
        const cx = boxX + pad + (i % cols) * tw;
        const cy = boxY + pad + Math.floor(i / cols) * th;
        root.appendChild(mk("rect", {
          x: cx + 1.5, y: cy + 1.5, width: tw - 3, height: th - 3, rx: 3,
          fill: "none", stroke: C.grid, "stroke-width": 1
        }));
      }

      // filled tiles
      for (let i = 0; i < S.tiles.length; i++) {
        const tile = S.tiles[i];
        const cx = boxX + pad + (i % cols) * tw;
        const cy = boxY + pad + Math.floor(i / cols) * th;
        const isHi = i === S.hi;
        root.appendChild(mk("rect", {
          x: cx + 1.5, y: cy + 1.5, width: tw - 3, height: th - 3, rx: 3,
          fill: roleColor(tile.role),
          opacity: isHi ? 1 : 0.72,
          stroke: isHi ? C.text : "none", "stroke-width": isHi ? 1.5 : 0
        }));
        root.appendChild(mk("text", {
          x: cx + tw / 2, y: cy + th / 2 + fs * 0.36,
          "text-anchor": "middle", fill: C.surface,
          "font-family": env.font.mono, "font-size": fs
        }, clip(tile.t, maxChars)));
      }

      // ---------------- eviction lane ------------------------------------
      const evY = boxY + boxH + 16;
      root.appendChild(mk("text", {
        x: boxX, y: evY + 4, fill: C.muted, "font-family": env.font.base, "font-size": 11
      }, "evicted (" + S.evictedCount + ")"));
      let ex = boxX + 76;
      for (let i = 0; i < S.evicted.length; i++) {
        const t = S.evicted[i];
        const w = Math.min(46, Math.max(26, t.t.length * 6));
        root.appendChild(mk("rect", {
          x: ex, y: evY - 10, width: w, height: 18, rx: 3,
          fill: roleColor(t.role), opacity: 0.16 + 0.05 * i
        }));
        root.appendChild(mk("text", {
          x: ex + w / 2, y: evY + 3, "text-anchor": "middle",
          fill: C.muted, "font-family": env.font.mono, "font-size": 9
        }, clip(t.t, 6)));
        ex += w + 4;
      }

      // ---------------- right panel: the meter ---------------------------
      const px = W - panelW - 20;
      root.appendChild(mk("rect", {
        x: px, y: boxY, width: panelW, height: boxH, rx: 8,
        fill: C.surface2, stroke: C.border
      }));

      const line = (dy, label, value, color) => {
        root.appendChild(mk("text", {
          x: px + 14, y: boxY + dy, fill: C.text2,
          "font-family": env.font.base, "font-size": 11
        }, label));
        root.appendChild(mk("text", {
          x: px + panelW - 14, y: boxY + dy, "text-anchor": "end",
          fill: color || C.text, "font-family": env.font.mono, "font-size": 12
        }, value));
      };

      root.appendChild(mk("text", {
        x: px + 14, y: boxY + 22, fill: C.text,
        "font-family": env.font.base, "font-size": 12
      }, "Running bill"));

      line(46, "input billed", String(S.billedIn), C.viz1);
      line(66, "input cached", String(S.cachedIn), S.cachedIn ? C.viz3 : C.muted);
      line(86, "output billed", String(S.billedOut), C.viz2);
      line(112, "cost so far", "$" + S.cost.toFixed(6), C.accent);
      line(132, "× 10k / day", "$" + (S.cost * 10000).toFixed(2), C.accent);

      root.appendChild(mk("line", {
        x1: px + 14, y1: boxY + 148, x2: px + panelW - 14, y2: boxY + 148,
        stroke: C.border
      }));

      line(172, "system prompt", S.systemAlive ? "intact" : "EVICTED",
        S.systemAlive ? C.ok : C.danger);
      line(192, "window", S.tiles.length + "/" + S.cap,
        S.tiles.length >= S.cap ? C.warn : C.text2);

      // legend
      const leg = [["system", C.viz7], ["user", C.viz1], ["assistant", C.viz3]];
      let lx = px + 14;
      for (const [name, col] of leg) {
        root.appendChild(mk("rect", { x: lx, y: boxY + 212, width: 9, height: 9, rx: 2, fill: col }));
        root.appendChild(mk("text", {
          x: lx + 13, y: boxY + 220, fill: C.muted,
          "font-family": env.font.base, "font-size": 10
        }, name));
        lx += 22 + name.length * 5.4;
      }

      if (frame.phase === "billing") {
        root.appendChild(mk("rect", {
          x: boxX, y: boxY, width: boxW, height: boxH, rx: 8,
          fill: "none", stroke: C.viz4, "stroke-width": 3
        }));
        root.appendChild(mk("text", {
          x: boxX + boxW / 2, y: boxY - 8, "text-anchor": "middle",
          fill: C.viz4, "font-family": env.font.mono, "font-size": 11
        }, "↑ entire window re-sent as input"));
      }
    }
  },

  drill: {
    cards: [
      { q: "Why does a 20-turn conversation cost quadratically, not linearly?", a: "The Messages API is stateless. Each request re-sends the entire history, so turn *t* pays for turns 1..t. Total ≈ O(t²) tokens. Prompt caching cuts the *price* of the re-sent prefix to ~0.1×, but not the token count.", tags: ["cost"] },
      { q: "What counts against the context window besides the conversation?", a: "The system prompt, every tool schema, retrieved documents, thinking tokens, and the response being generated. `max_tokens` caps output (thinking + visible text), not the whole window.", tags: ["context"] },
      { q: "Cache read vs cache write pricing?", a: "Read ≈ 0.1× input price; write ≈ 1.25× (2× for 1-hour TTL). With the default 5-minute TTL you break even at two requests against the same prefix.", tags: ["caching"] },
      { q: "Name three silent prompt-cache invalidators.", a: "A timestamp/UUID interpolated into the system prompt; non-deterministic JSON serialization (unsorted keys, set iteration); a tool list that varies per user. All change the prefix bytes, and caching is a strict prefix match.", tags: ["caching", "pitfall"] },
      { q: "How do you get an exact token count?", a: "`client.messages.count_tokens(model=..., system=..., tools=..., messages=...)`. It is free, model-specific, and includes tool schemas. Never use `tiktoken` — it is OpenAI's tokenizer and undercounts Claude by 15–20% on prose, more on code.", tags: ["tokens"] },
      { q: "What does `usage.input_tokens` actually report when caching is on?", a: "Only the *uncached remainder*. Total prompt size = `input_tokens + cache_creation_input_tokens + cache_read_input_tokens`. A long agent run showing 4K input tokens usually means the rest was a cache read.", tags: ["caching"] },
      { q: "What breaks when you truncate the oldest messages naively?", a: "You eventually evict the system prompt (the agent forgets its instructions) and you can orphan a `tool_result` from its `tool_use`, which the API rejects. Always pin the system prompt and drop whole user/assistant pairs.", tags: ["pitfall"] },
      { q: "Rough chars-per-token for English vs code?", a: "~3.5–4 chars/token for English prose, ~2.5–3 for code and JSON, and far worse for non-Latin scripts. Tokenizers are also model-specific — Opus 4.7+ uses a different tokenizer than Opus 4.6.", tags: ["tokens"] }
    ],
    sixtySecond: [
      "Explain why LLM chat costs grow quadratically with conversation length, and the three levers that flatten the curve.",
      "Explain what a token is, why token counts are model-specific, and everything that competes for space in a context window."
    ]
  }
};
