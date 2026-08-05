export default {
  id: "prompt-assembly",
  track: "agents",
  title: "Prompt Anatomy & Few-Shot",
  difficulty: 1,
  minutes: 15,
  tags: ["prompting", "few-shot", "prompt-caching", "context-budget"],

  explainer: [
    { type: "p", text: "When people talk about \"writing a good prompt,\" they often picture typing a clever sentence into a chat box. In a real production system, a prompt is not a sentence at all — it is a whole document that your code assembles fresh before every single request, made of several distinct pieces stacked in a fixed order. Understanding that structure matters because of one specific, very practical fact: the order those pieces render in determines how much of your bill gets discounted through caching. Get the order wrong, and you quietly pay full price forever without any error telling you so. This lesson is about that structure and that trap." },
    { type: "p", text: "Every request Claude receives is rendered in this fixed order: **tool definitions, then the system prompt, then the conversation messages.** This order is not just trivia — it is the entire reason prompt caching works or fails. As covered in the tokens-and-context-windows lesson, prompt caching is a **prefix match**: think of your whole assembled request as one long string of text, and the API checks whether the bytes from the very beginning up to a marker you set (a `cache_control` breakpoint) are *identical* to a previous request. If anything unstable — a timestamp, a random ID, a piece of text that changes every time — sits early in that string, it poisons caching for everything that comes after it, on every single request, forever." },

    { type: "h3", text: "The pieces of a real prompt, and what each one is for" },
    { type: "list", items: [
      "**Tool schemas** — the definitions of any tools (functions) the model is allowed to call — render first, at the very beginning of the request. Adding, removing, or even just reordering one tool invalidates the cache for the entire conversation, because it changes bytes at the very front of the string. Serialize your tool list the same way every time (for example, always sorted alphabetically by name) and avoid changing which tools are available mid-conversation.",
      "**The system prompt** comes next — the role you are asking the model to play, facts about its environment, the quality bar you expect, and any hard constraints. This is the right place for context that only you, the author, know and that will not change from request to request. It should stay byte-for-byte identical across requests whenever possible.",
      "**Few-shot examples** — worked examples of the kind of input and output you want — are the single strongest signal in a prompt. The model does not just copy their format; it copies their length, their tone, and their overall structure too. Two or three deliberately varied examples generally work better than ten nearly-identical ones.",
      "**Conversation history** — the back-and-forth messages so far — is the part that keeps growing turn by turn. Everything before your last cache breakpoint gets billed at the cheap cached rate; everything after it is billed at full price.",
      "**The current user turn** — whatever the user just typed — always goes last, is never cached (since it is new every time), and is cheap on its own because it is usually short."
    ]},
    { type: "callout", tone: "pitfall", text: "The single most common prompt-caching mistake looks like this in code: `system = f\"Today is {datetime.now()}. You are…\"`. Because the current date and time changes on every request, the very front of your prompt changes every request too — which invalidates the cache completely, every single time, with zero savings and zero error message warning you. The fix is to put anything volatile — a timestamp, a per-user detail, a live fact — *after* your last cache breakpoint instead: on models that support it, as a separate `{\"role\": \"system\"}` message appended later in the conversation, or otherwise as a line inside the current user turn." },

    { type: "h3", text: "Few-shot examples cost you tokens on every single turn — spend them wisely" },
    { type: "p", text: "It is easy to think of examples as free, harmless context, but they are not — they compete for the same limited context window as conversation history and any retrieved documents, and because they typically sit above your last cache breakpoint... actually, because they get resent (from cache) on every turn, they are a permanent, standing cost for the whole conversation. Examples earn that cost when the task has a specific *format* the model genuinely cannot guess on its own — an unusual JSON shape, a particular citation style your company uses, a custom labeling scheme. They are poor value when they are only demonstrating ordinary judgment the model already has without being shown. On current Claude models, structured outputs (the `output_config.format` feature, covered in the sampling lesson) replace most of the reason people used to add format-pinning examples: a schema is *enforced* by the API, whereas an example is only a suggestion the model might drift away from." },
    { type: "callout", tone: "warn", text: "Watch out for \"example over-indexing\": if you show the model a single polished, gold-standard example, it tends to lock onto that example's exact length and structure and reproduce it too rigidly, even when the real task calls for something different. If you use examples at all, provide several, make them deliberately different from one another, and explicitly label them as illustrative rather than as a template to copy exactly." },

    { type: "h3", text: "Where to place your cache breakpoint" },
    { type: "p", text: "You are allowed at most **4** `cache_control` breakpoints in a single request, and each one only looks backward through the most recent 20 content blocks to find a matching earlier cache entry — if your prompt structure spans more than that between breakpoints, the lookup can miss even a valid match. Two placement patterns cover almost every real situation: put one breakpoint at the end of your system prompt block (this caches the tools, the system prompt, and any examples together as one unit), and put a second breakpoint at the end of the most recent conversation turn (this caches the whole conversation history built up so far). One more detail worth knowing: there is a minimum size a chunk of text needs to be before caching even kicks in at all — 512 tokens on Claude Opus 5, 1,024 tokens on Opus 4.8 — and below that minimum, caching just silently does not happen, with no warning." },
    { type: "code", lang: "python", code: "resp = client.messages.create(\n    model=\"claude-opus-5\", max_tokens=16000,\n    tools=TOOLS,                                   # position 0 — keep stable\n    system=[\n        {\"type\": \"text\", \"text\": ROLE_AND_RULES},\n        {\"type\": \"text\", \"text\": FEW_SHOT_BLOCK,\n         \"cache_control\": {\"type\": \"ephemeral\"}},  # breakpoint: tools+system+examples\n    ],\n    messages=[*history, {\"role\": \"user\", \"content\": question}],\n)" },

    { type: "h3", text: "Ordering rules that follow naturally from all of the above" },
    { type: "list", items: [
      "Always put stable, unchanging content first and anything that varies last — this single rule is the source of most of the guidance in this lesson.",
      "Do not switch which model you are using in the middle of a conversation if you can avoid it: caches are tied to a specific model, so switching models throws away the entire cache and starts over from a full-price request.",
      "If your code spins off a side task — say, a separate model call that summarizes the conversation, or a sub-agent handling a smaller piece of work — do not rebuild its `system` prompt or `tools` list from scratch. Copy the parent conversation's exact bytes, so the side task can also benefit from the same cache the main conversation already paid to create.",
      "Some changes only invalidate the newer, cheaper-to-rebuild parts of the cache rather than everything: switching which specific tool the model must use, turning \"thinking\" on or off, or adding an image only invalidates the conversation-history layer of the cache, not the tools-and-system layer underneath it. You do not need to worry much about these smaller changes."
    ]}
  ],

  glossary: [
    { term: "Prompt assembly", plain: "The process your code runs before every request to stitch together the tool definitions, system prompt, examples, conversation history, and the newest user message into one document sent to the model." },
    { term: "Render order", plain: "The fixed sequence a request is put together in — tool definitions first, then the system prompt, then the conversation messages. This order determines how prompt caching behaves." },
    { term: "Prefix match (caching)", plain: "How prompt caching decides whether to give you a discount: it checks whether the bytes of your request, from the very start up to a marker you set, are identical to an earlier request. Any earlier difference breaks the match." },
    { term: "Cache breakpoint (cache_control)", plain: "A marker you insert into your prompt telling the API where the reusable, cacheable part of the request ends. Up to 4 are allowed per request." },
    { term: "Few-shot examples", plain: "Sample input-and-output pairs you include in a prompt to show the model the format or style you want, rather than only describing it in words." },
    { term: "System prompt", plain: "The block of instructions at the start of a request describing the model's role, the environment it is operating in, and any hard rules it must follow — separate from the back-and-forth chat messages." },
    { term: "Structured outputs (output_config.format)", plain: "A Claude API setting that forces a reply to follow an exact schema, such as valid JSON with specific fields, guaranteed by the API rather than merely hoped for from an example." },
    { term: "Tool schema", plain: "The formal description of a tool (function) the model is allowed to call — its name, what it does, and what parameters it expects — written in a structured format called JSON Schema." },
    { term: "tool_choice", plain: "A request setting that controls whether the model may freely choose any available tool, must use one specific tool, or is forbidden from using tools at all on this turn." },
    { term: "Cache tier / invalidation hierarchy", plain: "The idea that a Claude request's cache is split into layers (tools, then system, then messages) and changing something only breaks the cache for that layer and the layers after it, not necessarily everything." }
  ],

  complexity: {
    rows: [
      { operation: "Cache write", time: "—", space: "prefix size", note: "1.25× input price (2× for 1-hour TTL)" },
      { operation: "Cache read", time: "—", space: "—", note: "≈0.10× input price" },
      { operation: "Break-even (5-min TTL)", time: "2 requests", space: "—", note: "1.25 + 0.10 = 1.35 vs 2.00 uncached" },
      { operation: "Break-even (1-hour TTL)", time: "3 requests", space: "—", note: "2.00 + 0.20 = 2.20 vs 3.00 uncached" },
      { operation: "Breakpoints per request", time: "max 4", space: "20-block lookback", note: "long tool-heavy turns can outrun the lookback window" }
    ]
  },

  interview: {
    whyAsked: "This is the cheapest way to find out whether someone has run an LLM feature at scale. Anyone can write a system prompt; the signal is knowing the render order, that caching is a byte-exact prefix match, and that few-shot examples are a recurring cost that competes with history for the same window.",
    followUps: [
      { q: "What is the render order of a Messages API request, and why does it matter?", a: "`tools` → `system` → `messages`. It matters because prompt caching is a prefix match keyed on the exact bytes up to each breakpoint. Tools sit at position 0, so any change to the tool set invalidates everything; the system prompt sits second, so a timestamp in it invalidates all history." },
      { q: "Your app needs to tell the model today's date. Where does it go?", a: "Not in the system prompt — that would change the prefix on every request. Put it after the last cache breakpoint: either as a `{\"role\": \"system\"}` message appended to `messages` (supported on Opus 5 / Opus 4.8 / Fable 5) or as a line in the current user turn. Both leave the cached prefix byte-identical." },
      { q: "When are few-shot examples worth their token cost?", a: "When they pin a format or taxonomy the model cannot infer from the instruction — an unusual JSON shape, a house citation style, an internal label set. They are poor value for demonstrating judgment the model already has, and on current models a JSON schema via `output_config.format` enforces format where an example merely suggests it." },
      { q: "How many examples, and how similar should they be?", a: "Two to four, deliberately varied. Examples are the strongest signal in the prompt — the model copies their length, structure and register. A single gold example over-constrains; ten near-identical ones waste tokens and still over-constrain. Vary them along whichever axis you want the model to generalize across." },
      { q: "You add a per-user tool to the tool list. What happens to caching?", a: "It dies for every user. Tools render at position 0, so a per-user tool set means no two users share a prefix and nothing caches across them. Keep a stable global tool set and use tool search or deferred loading if the surface is genuinely large; on Opus 5 you can also add and remove tools mid-conversation without invalidating the prefix." },
      { q: "A conversation runs long. What is the ordered list of things you do?", a: "Cache the stable prefix first (cheapest, lossless). Then context editing to clear stale tool results. Then compaction to summarize old turns server-side. Truncation last, because it is the only one that silently loses information — and it must drop whole user/assistant pairs so a `tool_result` is never orphaned from its `tool_use`." }
    ]
  },

  code: [
    { lang: "python", label: "Assembling a cacheable prompt", code: "import json\n\ndef build_request(history, question, now):\n    return dict(\n        model=\"claude-opus-5\",\n        max_tokens=16000,\n\n        # --- position 0: tools. Deterministic order, identical for every user.\n        tools=sorted(TOOLS, key=lambda t: t[\"name\"]),\n\n        # --- system: frozen bytes. No dates, no user ids, no feature flags.\n        system=[\n            {\"type\": \"text\", \"text\": ROLE_AND_RULES},\n            {\"type\": \"text\", \"text\": FEW_SHOT_BLOCK,\n             \"cache_control\": {\"type\": \"ephemeral\"}},   # breakpoint #1\n        ],\n\n        messages=[\n            *history,\n            # --- volatile context lives AFTER the breakpoint\n            {\"role\": \"user\", \"content\": [\n                {\"type\": \"text\", \"text\": f\"<context>today is {now:%Y-%m-%d}</context>\"},\n                {\"type\": \"text\", \"text\": question,\n                 \"cache_control\": {\"type\": \"ephemeral\"}},  # breakpoint #2: whole convo\n            ]},\n        ],\n    )\n\n# Deterministic serialization matters: json.dumps(d, sort_keys=True).\n# An unsorted dict or a set iteration silently changes the prefix bytes." },

    { lang: "python", label: "Verify it actually cached", code: "resp = client.messages.create(**build_request(history, q, now))\nu = resp.usage\n\nprint(f\"write={u.cache_creation_input_tokens} \"\n      f\"read={u.cache_read_input_tokens} fresh={u.input_tokens}\")\n\n# First request:  write=8200 read=0    fresh=45\n# Second request: write=0    read=8200 fresh=52   <- what you want\n# Second request: write=8200 read=0    fresh=45   <- silent invalidator!\n#\n# If read stays 0, diff the rendered prefix bytes across two requests.\n# Usual suspects: datetime.now(), uuid4(), unsorted json.dumps,\n# a per-user tool list, conditional system sections." },

    { lang: "python", label: "Mid-conversation instructions without a cold start", code: "# Editing top-level `system` re-prices the entire conversation.\n# Append a system-role MESSAGE instead: it sits after the cached prefix.\n# Supported on Claude Opus 5, Opus 4.8, Fable 5. No beta header.\nmessages = [\n    *history,\n    {\"role\": \"user\", \"content\": user_text},\n    {\"role\": \"system\", \"content\": \"Terse mode: answers under 40 words.\"},\n]\n\n# Must follow a user turn, and must be last or be followed by an assistant\n# turn. Never messages[0] — the opening instruction belongs in top-level\n# `system`. On unsupported models this 400s; fall back to a\n# <system-reminder> block inside the user turn." }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.7, maxFrames: 300 },

    params: [
      { key: "examples", label: "Few-shot examples", type: "int", min: 0, max: 8, default: 3 },
      { key: "tools",    label: "Tool schemas",      type: "int", min: 0, max: 8, default: 3 },
      { key: "cap",      label: "Budget (k tokens)", type: "int", min: 4, max: 40, default: 16 },
      { key: "volatile", label: "Timestamp in system", type: "enum", options: ["no", "yes"], default: "no" },
      { key: "seed",     label: "Re-roll turns",     type: "seed" }
    ],

    frames: function* (params, rng) {
      const cap = params.cap * 1000;
      const volatile_ = params.volatile === "yes";
      const TOOL_TOK = 260, SYS_TOK = 1400, EX_TOK = 420, USER_TOK = 90;

      let blocks = [];       // {name, tier, tokens, note}
      let boundary = -1;     // index after which nothing is cached
      let ledger = [];       // {turn, read, write, fresh}
      let warn = null;

      const total = () => blocks.reduce((a, b) => a + b.tokens, 0);
      const prefixTokens = () =>
        boundary < 0 ? 0 : blocks.slice(0, boundary + 1).reduce((a, b) => a + b.tokens, 0);

      const snap = (extra) => Object.assign({
        blocks: blocks.map((b) => ({ name: b.name, tier: b.tier, tokens: b.tokens, note: b.note || "" })),
        boundary,
        cap,
        total: total(),
        ledger: ledger.map((r) => ({ turn: r.turn, read: r.read, write: r.write, fresh: r.fresh })),
        warn,
        volatile: volatile_,
        hi: -1
      }, extra || {});

      yield {
        label: `An empty ${(cap / 1000).toFixed(0)}K budget. The request renders in a fixed order — tools, then system, then messages — and prompt caching keys on the exact bytes from the top down to a breakpoint.`,
        phase: "init",
        state: snap()
      };

      // --- tools ---------------------------------------------------------
      if (params.tools > 0) {
        blocks = blocks.concat([{ name: `${params.tools} tool schema${params.tools === 1 ? "" : "s"}`, tier: "tools", tokens: TOOL_TOK * params.tools }]);
        yield {
          label: `Tool schemas render at position 0 — ${TOOL_TOK * params.tools} tokens before a single word of your prompt. Add, remove or reorder one tool and the entire cache for this conversation is invalid.`,
          phase: "build",
          state: snap({ hi: blocks.length - 1 })
        };
      }

      // --- system --------------------------------------------------------
      blocks = blocks.concat([{
        name: volatile_ ? "system prompt + timestamp" : "system prompt",
        tier: "system",
        tokens: SYS_TOK + (volatile_ ? 12 : 0),
        note: volatile_ ? "VOLATILE" : ""
      }]);
      yield {
        label: volatile_
          ? `System prompt with \`Today is {now}\` interpolated in. Those 12 tokens change every request — everything below them is now uncacheable, and the API will never tell you.`
          : `System prompt: ${SYS_TOK} frozen tokens. Role, environment facts, quality bar, hard constraints — the things only you know.`,
        phase: "build",
        state: snap({ hi: blocks.length - 1 })
      };

      // --- few-shot ------------------------------------------------------
      for (let i = 0; i < params.examples; i++) {
        blocks = blocks.concat([{ name: `example ${i + 1}`, tier: "examples", tokens: EX_TOK }]);
        const spent = total();
        yield {
          label: i === 0
            ? `Few-shot example 1: ${EX_TOK} tokens, re-sent on every turn forever. Examples are the strongest signal in a prompt — the model copies their length and structure, not just their format.`
            : `Example ${i + 1}. ${(spent / cap * 100).toFixed(0)}% of the budget is now fixed overhead before the user has said anything. Every example you add is history you cannot keep.`,
          phase: "build",
          state: snap({ hi: blocks.length - 1 })
        };
      }

      // --- breakpoint ----------------------------------------------------
      boundary = blocks.length - 1;
      yield {
        label: volatile_
          ? `\`cache_control\` breakpoint set after the examples — but the timestamp above it moves every request, so this prefix never matches. You will pay a cache WRITE every single turn and never a read.`
          : `\`cache_control\` breakpoint after the last system block. Everything above — tools, system, examples — is one ${prefixTokens()}-token prefix that will bill at ~0.1× from the second request on.`,
        phase: "boundary",
        state: snap({ hi: boundary })
      };

      // --- conversation --------------------------------------------------
      const qs = [
        "why was my order split into two shipments",
        "can I change the delivery address now",
        "the tracking link says delivered but nothing arrived",
        "do you price match a competitor",
        "cancel the second shipment please",
        "send me the invoice as a pdf",
        "is the replacement covered by the warranty"
      ];

      for (let t = 1; t <= 7; t++) {
        const q = qs[Math.floor(rng() * qs.length)];
        blocks = blocks.concat([{ name: `turn ${t} · user`, tier: "history", tokens: USER_TOK, note: q }]);
        blocks = blocks.concat([{ name: `turn ${t} · assistant`, tier: "history", tokens: 210 + Math.floor(rng() * 160) }]);

        const pre = prefixTokens();
        const fresh = total() - pre;
        const first = t === 1;
        const cacheWorks = !volatile_;
        ledger = ledger.concat([{
          turn: t,
          read: cacheWorks && !first ? pre : 0,
          write: cacheWorks ? (first ? pre : 0) : pre,
          fresh
        }]);

        if (total() > cap) {
          warn = "over budget";
          yield {
            label: `Turn ${t} pushes the request to ${total()} tokens against a ${cap}-token budget. Something has to go — and the fixed overhead (${prefixTokens()} tokens of tools, system and examples) is exactly what you cannot drop.`,
            phase: "overflow",
            state: snap({ hi: blocks.length - 1 })
          };

          // evict the oldest history pair
          let firstHist = blocks.findIndex((b) => b.tier === "history");
          const dropped = blocks.slice(firstHist, firstHist + 2);
          blocks = blocks.slice(0, firstHist).concat(blocks.slice(firstHist + 2));
          warn = null;
          yield {
            label: `Evicted ${dropped.map((d) => d.name).join(" + ")} — a whole user/assistant pair, never half of one, or a \`tool_result\` gets orphaned from its \`tool_use\` and the API rejects the request.`,
            phase: "evict",
            state: snap()
          };
        } else {
          yield {
            label: cacheWorks && !first
              ? `Request ${t}: ${pre} tokens read from cache at ~0.1×, ${fresh} tokens fresh at full price. The conversation grows but the bill barely moves.`
              : cacheWorks
                ? `Request 1: the ${pre}-token prefix is written to cache at 1.25×. You pay the premium once; every later turn reads it back at 0.1×.`
                : `Request ${t}: prefix rewritten AGAIN (${pre} tokens at 1.25×) because the timestamp changed. You are paying 12.5× the cache-read price, forever, for twelve tokens of date.`,
            phase: "request",
            state: snap()
          };
        }
      }

      const totalRead = ledger.reduce((a, r) => a + r.read, 0);
      const totalWrite = ledger.reduce((a, r) => a + r.write, 0);
      const totalFresh = ledger.reduce((a, r) => a + r.fresh, 0);
      const usd = (totalFresh * 5 + totalWrite * 5 * 1.25 + totalRead * 5 * 0.1) / 1e6;
      const ideal = (totalFresh * 5 + (totalRead + totalWrite) * 5) / 1e6;

      yield {
        label: volatile_
          ? `7 turns: ${totalWrite} tokens written to cache, ${totalRead} read. Cost $${usd.toFixed(5)} vs $${ideal.toFixed(5)} uncached — you paid MORE than not caching at all. Move the timestamp below the breakpoint.`
          : `7 turns: ${totalWrite} written once, ${totalRead} read at 0.1×. Cost $${usd.toFixed(5)} vs $${ideal.toFixed(5)} uncached — a ${(ideal / usd).toFixed(1)}× saving from one correctly-placed breakpoint.`,
        phase: "done",
        state: snap()
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

      const clip = (s, n) => (s.length > n ? s.slice(0, Math.max(1, n - 1)) + "…" : s);
      const tierColor = (t) =>
        t === "tools" ? C.viz7 : t === "system" ? C.viz5 : t === "examples" ? C.viz4 : C.viz1;

      // ---------------- header --------------------------------------------
      root.appendChild(mk("text", { x: 20, y: 24, fill: C.text, "font-family": env.font.base, "font-size": 14 },
        "Prompt assembly — render order: tools → system → messages"));
      root.appendChild(mk("text", { x: 20, y: 42, fill: C.muted, "font-family": env.font.mono, "font-size": 11 },
        S.total + " / " + S.cap + " tokens" +
        (S.boundary >= 0 ? "   ·   breakpoint after block " + (S.boundary + 1) : "   ·   no breakpoint yet")));

      // ---------------- layout --------------------------------------------
      const colX = 20, colW = Math.min(430, W * 0.46);
      const colY = 60, colH = H - colY - 26;

      root.appendChild(mk("rect", {
        x: colX, y: colY, width: colW, height: colH, rx: 8,
        fill: C.surface, stroke: S.total > S.cap ? C.danger : C.border,
        "stroke-width": S.total > S.cap ? 2 : 1
      }));

      // scale: budget maps to the column height
      const scale = colH / Math.max(S.cap, S.total);
      let y = colY;
      for (let i = 0; i < S.blocks.length; i++) {
        const b = S.blocks[i];
        const h = Math.max(3, b.tokens * scale);
        const isHi = i === S.hi;
        root.appendChild(mk("rect", {
          x: colX + 3, y: y + 1, width: colW - 6, height: Math.max(2, h - 2), rx: 3,
          fill: tierColor(b.tier),
          opacity: i <= S.boundary ? 0.9 : 0.62,
          stroke: isHi ? C.text : "none", "stroke-width": isHi ? 1.5 : 0
        }));
        if (h >= 13) {
          root.appendChild(mk("text", {
            x: colX + 12, y: y + Math.min(h - 4, h / 2 + 4),
            fill: C.surface, "font-family": env.font.mono, "font-size": Math.min(11, Math.max(8, h * 0.45))
          }, clip(b.name, Math.floor((colW - 90) / 6.4))));
          root.appendChild(mk("text", {
            x: colX + colW - 12, y: y + Math.min(h - 4, h / 2 + 4), "text-anchor": "end",
            fill: C.surface, "font-family": env.font.mono, "font-size": Math.min(11, Math.max(8, h * 0.45))
          }, b.tokens + "t"));
        }
        if (b.note === "VOLATILE") {
          root.appendChild(mk("rect", {
            x: colX + 3, y: y + 1, width: colW - 6, height: Math.max(2, h - 2), rx: 3,
            fill: "none", stroke: C.danger, "stroke-width": 2, "stroke-dasharray": "4 3"
          }));
        }
        y += h;

        if (i === S.boundary) {
          root.appendChild(mk("line", {
            x1: colX - 8, y1: y, x2: colX + colW + 8, y2: y,
            stroke: S.volatile ? C.danger : C.viz3, "stroke-width": 2.5, "stroke-dasharray": "6 4"
          }));
          root.appendChild(mk("text", {
            x: colX + colW + 12, y: y + 4,
            fill: S.volatile ? C.danger : C.viz3, "font-family": env.font.mono, "font-size": 10
          }, S.volatile ? "cache_control (never hits)" : "cache_control breakpoint"));
        }
      }

      // budget line
      const capY = colY + Math.min(colH, S.cap * scale);
      if (S.total > S.cap) {
        root.appendChild(mk("line", {
          x1: colX, y1: capY, x2: colX + colW, y2: capY,
          stroke: C.danger, "stroke-width": 2
        }));
      }

      // ---------------- right: ledger --------------------------------------
      const px = colX + colW + 150;
      const pw = W - px - 20;

      root.appendChild(mk("text", { x: px, y: colY + 12, fill: C.text, "font-family": env.font.base, "font-size": 12 },
        "Per-request billing"));

      const cols = [["turn", 0], ["cache read", 74], ["cache write", 168], ["fresh", 262]];
      for (const [name, dx] of cols) {
        root.appendChild(mk("text", {
          x: px + dx, y: colY + 32, fill: C.muted, "font-family": env.font.base, "font-size": 10
        }, name));
      }

      const rows = S.ledger.slice(-9);
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        const ry = colY + 50 + i * 19;
        root.appendChild(mk("text", { x: px, y: ry, fill: C.text2, "font-family": env.font.mono, "font-size": 11 }, String(r.turn)));
        root.appendChild(mk("text", { x: px + 74, y: ry, fill: r.read ? C.viz3 : C.muted, "font-family": env.font.mono, "font-size": 11 }, r.read ? String(r.read) : "—"));
        root.appendChild(mk("text", { x: px + 168, y: ry, fill: r.write ? C.viz2 : C.muted, "font-family": env.font.mono, "font-size": 11 }, r.write ? String(r.write) : "—"));
        root.appendChild(mk("text", { x: px + 262, y: ry, fill: C.viz1, "font-family": env.font.mono, "font-size": 11 }, String(r.fresh)));
      }

      // legend
      const legY = H - 40;
      const legend = [["tools", C.viz7], ["system", C.viz5], ["examples", C.viz4], ["history", C.viz1]];
      let lx = px;
      for (const [name, col] of legend) {
        root.appendChild(mk("rect", { x: lx, y: legY - 8, width: 9, height: 9, rx: 2, fill: col }));
        root.appendChild(mk("text", { x: lx + 13, y: legY, fill: C.muted, "font-family": env.font.base, "font-size": 10 }, name));
        lx += 24 + name.length * 5.6;
      }

      if (S.volatile) {
        root.appendChild(mk("text", {
          x: px, y: legY - 26, fill: C.danger, "font-family": env.font.base, "font-size": 11
        }, "volatile bytes above the breakpoint → 0 cache reads"));
      }
      if (frame.phase === "overflow") {
        root.appendChild(mk("text", {
          x: px, y: legY - 26, fill: C.warn, "font-family": env.font.base, "font-size": 11
        }, "over budget — history must be evicted"));
      }
    }
  },

  drill: {
    cards: [
      { q: "What is the render order of a Messages API request?", a: "`tools` → `system` → `messages`. Caching is a prefix match over those exact bytes, so anything volatile placed early invalidates everything after it.", tags: ["caching"] },
      { q: "Where do you put today's date so caching still works?", a: "After the last cache breakpoint — as a `{\"role\": \"system\"}` message appended to `messages` (Opus 5 / Opus 4.8 / Fable 5) or inside the current user turn. Never interpolated into top-level `system`.", tags: ["caching", "pitfall"] },
      { q: "How many cache breakpoints can one request have?", a: "Four. Each one also looks back at most 20 content blocks for a prior entry, so a single turn that emits many tool_use/tool_result blocks can outrun the lookback and silently miss.", tags: ["caching"] },
      { q: "When is a few-shot example worth its recurring token cost?", a: "When it pins a format or taxonomy the model cannot infer — unusual JSON shape, house citation style, internal label set. Not for demonstrating judgment the model already has, and not where `output_config.format` can enforce the shape instead.", tags: ["few-shot"] },
      { q: "Why do 2–4 varied examples beat 10 similar ones?", a: "Examples are the strongest signal in a prompt: the model copies their length, structure and register. Homogeneous examples over-constrain and freeze the output shape; varied ones show the axis you want generalization along, at a quarter of the token cost.", tags: ["few-shot"] },
      { q: "Which request changes invalidate which cache tier?", a: "Tool definitions or a model switch → everything. System prompt content → system and messages. `tool_choice`, images, thinking on/off, message content → messages only. So per-request `tool_choice` changes are cheap; a per-user tool list is not.", tags: ["caching"] },
      { q: "Why must truncation drop whole user/assistant pairs?", a: "A `tool_result` block must be preceded by its matching `tool_use`. Dropping half a pair orphans it and the API rejects the request. Pin the system prompt and evict pairs from the oldest end.", tags: ["pitfall"] }
    ],
    sixtySecond: [
      "Explain the render order of a Claude request and where you place cache breakpoints to make a long conversation cheap.",
      "Explain when few-shot examples earn their tokens, and what replaces them on models with structured outputs."
    ]
  }
};
