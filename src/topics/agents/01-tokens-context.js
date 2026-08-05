export default {
  id: "tokens-context",
  track: "agents",
  title: "Tokenization & Context Windows",
  difficulty: 1,
  minutes: 14,
  tags: ["tokens", "context-window", "cost", "prompt-caching"],

  explainer: [
    { type: "p", text: "Every time you send a message to an AI model, the model does not read your text the way a person does. Before the model ever sees anything, your text gets chopped up into small chunks, and there is a hard limit on how many chunks can be in play at once — the system prompt, the whole conversation history, and the answer the model is writing, all competing for the same fixed amount of room. This lesson covers both halves: how the chopping works, and why that fixed limit ends up shaping almost every practical decision you make when building with an AI model — what it costs you, and when the model quietly starts to lose track of things you said earlier." },
    { type: "p", text: "A **tokenizer** is the program that does the chopping. It splits your text into pieces called **tokens**, drawn from a fixed list of roughly 100,000 possible pieces that the model's creators built in advance by studying huge amounts of text (a technique called byte-pair encoding — you do not need to know how it works, just that the piece list is fixed and learned, not something you control). A common word might be exactly one token. A longer or rarer word gets split into several: `\"tokenization\"` might become `token` + `ization`. An unusual name could split into five or more pieces. One quirk worth knowing: the tokenizer usually glues the space in front of a word onto the front of that word's token, so `\"hello\"` and `\" hello\"` — with a leading space — are two different tokens, not the same one." },

    { type: "h3", text: "Token counts are not word counts, and they differ by model" },
    { type: "p", text: "Two things about tokens trip people up in interviews. First, the number of tokens in a piece of text is not proportional to the number of words in it. For ordinary English prose, a rough rule of thumb is about 3.5 to 4 characters per token. Code and non-English text are noticeably less efficient — they use more tokens for the same amount of content. Second, token counts are **model-specific**: the exact same sentence can produce a different token count depending on which model's tokenizer you run it through. Claude's tokenizer changed with the Opus 4.7 generation, so a string counted on an older Claude model and a newer one will not match exactly." },
    { type: "callout", tone: "pitfall", text: "Never estimate Claude's token count using another company's tokenizer. `tiktoken` is OpenAI's tokenizer library, and running Claude text through it undercounts by roughly 15–20% on ordinary prose, and considerably more on code. If you need an exact number, ask Claude's own API — see the code sample below." },

    { type: "h3", text: "The context window is a hard wall, not a soft suggestion" },
    { type: "p", text: "The **context window** is the total number of tokens a model can hold in view at once — think of it as the size of a whiteboard the model is writing and reading from. Nothing that does not fit on the whiteboard is visible to the model, full stop. As of this writing, Claude Opus 5, Sonnet 5 and Fable 5 have a 1-million-token context window; Claude Haiku 4.5 has 200,000 tokens. That budget is not just for \"the conversation\" — it covers absolutely everything the model has to read or write in one turn: the system prompt (the instructions you give the model about its role and rules), every tool definition, every previous message in the conversation, any documents you retrieved and pasted in, the model's own internal reasoning tokens if it is a thinking-enabled model, and the reply it is currently generating. All of that shares one budget." },
    { type: "p", text: "A separate parameter, `max_tokens`, caps only the output side — how much the model is allowed to generate in this one response. On models where step-by-step internal reasoning (\"thinking\") is switched on by default, that reasoning counts against `max_tokens` too, sharing the cap with the visible answer. If you set a small `max_tokens` value that was sized for a model that does not think by default, and then switch to a model that does, you can get a reply that gets cut off mid-sentence — the thinking used up the budget before the visible answer even started." },
    { type: "callout", tone: "pitfall", text: "The Messages API — the interface you use to talk to Claude — is **stateless**. That means the server does not remember your conversation between requests. Every single time you send a new message, your code has to resend the *entire* conversation history from scratch, not just the new part. So in a 20-turn back-and-forth conversation, the text from turn 1 gets sent — and billed — 20 separate times, once with every later request. Total cost grows roughly with the square of the number of turns, not in a straight line — this is the single most common surprise people hit on their first production bill." },

    { type: "h3", text: "What you actually pay for" },
    { type: "list", items: [
      "**Input tokens** — every token you send to the model, including the system prompt, tool definitions, and the whole conversation so far. As of this writing: Claude Opus 5 costs $5 per million input tokens, Sonnet 5 costs $3 per million, and Haiku 4.5 costs $1 per million.",
      "**Output tokens** — every token the model generates, including any invisible \"thinking\" tokens. Opus 5 costs $25 per million, Sonnet 5 costs $15 per million, Haiku 4.5 costs $5 per million. Output is 5 times more expensive than input on every one of these models, which is why a chatty, verbose model reply is the expensive kind of mistake to make.",
      "**Cache writes** — the first time a chunk of your prompt is cached (explained below), you pay 1.25× the normal input price for it (2× if you choose the longer, one-hour cache lifetime). You only pay this once per distinct chunk of text.",
      "**Cache reads** — every later request that reuses that same cached chunk pays roughly 0.1× the normal input price for it — a 90% discount. This is the one lever that makes long, multi-turn AI agent conversations financially workable."
    ]},
    { type: "p", text: "**Prompt caching** is a feature that lets you avoid paying full price to resend text that has not changed since the last request. It works as a **prefix match**: think of your whole request — tool definitions, then the system prompt, then the conversation messages, always rendered in that order — as one long string of bytes. You mark a point in that string with something called a `cache_control` breakpoint, telling the API \"everything up to here is worth caching.\" On the next request, if the bytes up to that same breakpoint are *identical, byte-for-byte*, the API serves them from cache at the discounted price. If even one byte changed anywhere before the breakpoint — one different character — the whole cache entry is invalidated and you are back to full price for that entire chunk. A classic mistake is putting today's date or a timestamp into the system prompt: that one line changes on every single request, which silently breaks caching for the entire prompt above it, forever, with no error message telling you it happened." },
    { type: "callout", tone: "tip", text: "Do not just assume caching is working — verify it. The API response includes a field called `usage.cache_read_input_tokens`; if that number stays at zero across repeated, near-identical requests, your caching is broken somewhere. Also note that the total size of your prompt is `input_tokens + cache_creation_input_tokens + cache_read_input_tokens` added together — the `input_tokens` field alone only reports the *uncached* portion, which is why an AI agent that has been working for an hour might report a suspiciously small `input_tokens` number even though its real conversation is huge." },

    { type: "h3", text: "What to do when the conversation outgrows the window" },
    { type: "p", text: "Eventually a long conversation will not fit in the context window anymore, and you have to decide what to do about it. There are four options, roughly ordered from \"loses nothing\" to \"loses the most information\":" },
    { type: "list", items: [
      "**Prompt caching** (described above) does not remove or shrink anything — it just makes resending the same content cheaper. It is always worth doing, but it does not solve the problem of the conversation eventually not fitting at all.",
      "**Context editing** removes stale tool results from the conversation — old outputs that are no longer relevant but are still taking up space, such as an old search result nobody needs anymore.",
      "**Compaction** asks the model itself to summarize older parts of the conversation into a shorter form, on the server side, so the gist survives even though the exact wording does not.",
      "**Truncation** simply deletes the oldest messages outright once the window fills up. This is the cheapest and crudest option — it is what the visualizer on this page animates — and if you implement it carelessly, it will eventually delete your own system prompt along with everything else, silently making the model forget its own instructions."
    ]},
    { type: "code", lang: "python", code: "resp = client.messages.count_tokens(\n    model=\"claude-opus-5\",\n    system=SYSTEM,\n    tools=TOOLS,          # tool schemas count too — people forget this\n    messages=history,\n)\nprint(resp.input_tokens)   # exact, model-specific, free to call" }
  ],

  glossary: [
    { term: "Token", plain: "The small chunk of text an AI model actually reads and writes — roughly a word, part of a word, or a punctuation mark. A model never sees raw letters, only tokens." },
    { term: "Tokenizer", plain: "The program that splits your text into tokens before the model sees it, using a fixed list of about 100,000 possible pieces that were learned in advance from large amounts of text." },
    { term: "Context window", plain: "The total number of tokens a model can hold in view at once — instructions, conversation history, and the reply it is writing all share this one fixed budget." },
    { term: "System prompt", plain: "The instructions you give the model at the start of a conversation about its role, rules, and how it should behave — separate from the back-and-forth chat messages." },
    { term: "Messages API", plain: "The interface (a set of web requests) you use to send a conversation to Claude and get a reply back. It is stateless, meaning the server keeps no memory of your conversation between requests." },
    { term: "Stateless", plain: "Describes a server that does not remember anything about previous requests. Because the Messages API is stateless, your code must resend the entire conversation history with every new message." },
    { term: "max_tokens", plain: "A setting that caps how many tokens the model is allowed to generate in one reply. On models that reason step-by-step before answering, that reasoning also counts against this cap." },
    { term: "Thinking tokens", plain: "Tokens some models generate internally to reason through a problem step by step before producing the final visible answer. They are billed as output tokens even though the user does not see them by default." },
    { term: "Prompt caching", plain: "A feature that lets you reuse an unchanged chunk of a prompt across requests at a steep discount (about a tenth of the normal price) instead of paying full price to resend it every time." },
    { term: "Cache breakpoint (cache_control)", plain: "A marker you place in your prompt telling the API \"everything before this point is worth caching.\" The cache only hits if every byte before that marker is identical to a previous request." },
    { term: "Context editing", plain: "A way to shrink a long conversation by deleting old, no-longer-useful tool results outright, rather than summarizing them." },
    { term: "Compaction", plain: "A way to shrink a long conversation by having the model generate a summary of older messages on the server, so the gist survives even though exact wording is lost." },
    { term: "Truncation", plain: "The simplest way to shrink a long conversation: just delete the oldest messages once the window is full. Cheap, but it permanently loses whatever gets deleted." }
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
