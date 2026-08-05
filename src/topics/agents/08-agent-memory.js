export default {
  id: "agent-memory",
  track: "agents",
  title: "Memory & Context Management",
  difficulty: 2,
  minutes: 16,
  tags: ["memory", "context", "summarization", "compaction", "retrieval"],

  explainer: [
    { type: "p", text: "When people say an AI agent has \"memory,\" it is easy to picture something like human memory — the model quietly holding onto facts in its head between conversations. That is not what is actually happening. As covered in the tokens-and-context-windows lesson, the Claude API is **stateless**: the model remembers exactly, and only, whatever text is included in the current request, and nothing more. There is no hidden storage on the server side that persists between requests. So every single design people call an \"agent memory system\" is really just a policy — a set of rules your own code follows — answering one practical question, over and over: *given that the context window can only hold so much, and the conversation so far is longer than that, what exactly do I choose to send this time?* This lesson walks through the main strategies people use to answer that question, and what each one gives up in exchange for what it saves." },

    { type: "h3", text: "Four strategies, and what each one sacrifices" },
    { type: "list", items: [
      "**Buffer, also called a sliding window** — simply keep the most recent N turns of the conversation, word for word, and drop anything older than that. This is the cheapest option: no extra cost, no extra delay, and whatever it does keep is kept perfectly, exactly as it was said. Its weakness is total, silent amnesia for anything it drops — the model has no idea an earlier turn ever existed, and nothing in the system flags that a turn was thrown away.",
      "**Summarization, also called compaction** — once the conversation gets too long, replace the older turns with a shorter, generated summary of what happened. This preserves the overall thread of a long conversation using far fewer tokens than keeping every word. The cost is that it requires an extra call to the model every time you summarize, and summaries are lossy by nature — they keep the general gist but drop exact numbers, names, and IDs. It gets worse over a very long conversation, because eventually you end up summarizing an existing summary, and each such pass loses a little more detail than the last.",
      "**Retrieval memory** — instead of summarizing, save every single turn into a searchable vector store (as covered in the RAG lessons), and only pull back the handful of turns that are actually relevant to the current question, on demand. The size of what gets sent to the model each time stays flat no matter how long the overall conversation has gotten, and because nothing is summarized, exact wording is fully preserved when it is retrieved. The cost is one embedding calculation per turn as it comes in, and it inherits all the usual weaknesses of a RAG search system — if the search misses the right turn, that looks exactly the same to the user as if the model had simply forgotten it.",
      "**File-backed memory, sometimes called a scratchpad** — the agent itself writes structured notes out to files it can read back later, the way a person might keep a notebook. This is the only one of the four approaches that survives across entirely separate sessions (not just within one long conversation), and it is the only one a human can easily open up, read, and edit directly, which gives you a genuine audit trail. Current Claude models are notably good at maintaining notes like this, and do even better when your prompt explicitly tells them *when* they should check their notes, not just that the notes exist."
    ]},
    { type: "callout", tone: "tip", text: "Real production systems usually combine several of these layers rather than picking just one: a word-for-word buffer of the last few turns (because the most recent context tends to matter most), a running summary of everything older than that, and a retrieval search over the full historical archive for anything specific someone might ask to recall. Each strategy fails in a different way, which is exactly why combining them covers each other's weaknesses." },

    { type: "h3", text: "What the Claude API gives you as ready-made building blocks" },
    { type: "list", items: [
      "**Prompt caching** (covered in the tokens-and-context-windows and prompt-assembly lessons) is technically not a memory strategy at all — it is a cost strategy. It does not remove or shrink anything from the conversation; it just makes resending the same unchanged prefix roughly ten times cheaper. It is always worth setting up regardless of which memory strategy you pick, because it does not conflict with any of them.",
      "**Context editing**, via a feature called `clear_tool_uses_20250919`, *deletes* stale, no-longer-useful tool results outright, rather than summarizing them. This is especially useful inside a long AI agent loop (covered in the ReAct-loop lesson), where a 40-kilobyte tool result from step 2 of a run has become completely irrelevant dead weight by step 12, but is still being resent — and billed — on every step in between.",
      "**Compaction**, via a feature called `compact_20260112`, is a server-side summarization feature: as the conversation approaches the context window's limit, the API automatically generates a summary of the older parts for you. One critical implementation detail: after calling this feature, you must append the *entire* `response.content` back into your running `messages` list, not just the visible text of the reply. The compaction summary is delivered as a special block within that response, and it is what the API uses to actually replace the older history on the next request — if you only save the plain text and discard the rest, the summarization state silently gets lost with no error telling you.",
      "**Memory stores** are a feature for AI agents built on Anthropic's Managed Agents platform: documents scoped to your whole workspace that get mounted into an agent's session like a small filesystem it can read and write, persisting across completely separate sessions, complete with version history and an audit trail of every change."
    ]},

    { type: "h3", text: "\"Context rot\": a bigger window does not automatically mean better memory" },
    { type: "p", text: "It is tempting to think that because current Claude models support a context window of up to 1 million tokens, you could simply avoid all of this by just stuffing the entire conversation history in every time. That does not actually work as well as it sounds. Having 1 million tokens of room available does not mean the model reliably pays attention to and uses all 1 million tokens of it equally well. Models tend to attend most reliably to material near the very beginning and the very end of a long prompt; content buried deep in the middle of a very long context gets used less reliably, and simply having a lot of irrelevant filler text present measurably makes the model's reasoning worse on the parts that actually matter, even when that filler is technically harmless information. The practical, if counterintuitive, conclusion that follows from this is that **a smaller, carefully chosen set of context usually produces better results than dumping in everything you have.** Retrieval-based memory, in other words, is not merely a way to save money — it is often a genuine quality improvement on top of that." },

    { type: "callout", tone: "pitfall", text: "Two specific mistakes catch almost everyone who builds their own eviction logic (logic that decides what to drop from a conversation as it grows). First: if you keep dropping the oldest messages without any special-casing, you will eventually drop the system prompt itself, and the agent will lose its own instructions — always pin the system prompt so it can never be evicted. Second: never drop only half of a paired user-and-assistant turn. If a `tool_result` message gets separated from the `tool_use` request it was answering, the API will flatly reject your next request because that pairing is broken — always evict whole user-and-assistant pairs together, never split them." },

    { type: "h3", text: "Choosing which strategy fits your situation" },
    { type: "list", items: [
      "Short, task-scoped conversations that naturally wrap up in a handful of turns → a simple buffer is plenty. There is no need to build any extra infrastructure for a five-turn conversation.",
      "A long, open-ended conversation where the overall thread and topic matter more than exact figures → summarization or server-side compaction is a good fit.",
      "A long conversation where users are likely to ask for specific earlier details back (\"what was the invoice number you gave me?\") → retrieval memory is the right call, precisely because summarization is the strategy most likely to have dropped exactly that kind of specific detail.",
      "Anything that needs to persist across entirely separate sessions, or that a human needs to be able to review and audit → file-backed memory, with explicit instructions telling the agent when to read from and write to it."
    ]}
  ],

  glossary: [
    { term: "Stateless (API)", plain: "Describes a server that keeps no memory of previous requests. Because Claude's API is stateless, an agent's 'memory' has to be rebuilt and resent by your own code with every request." },
    { term: "Buffer / sliding window", plain: "A memory strategy that simply keeps the most recent handful of conversation turns, word for word, and drops everything older with no summary or backup." },
    { term: "Summarization / compaction", plain: "A memory strategy where, once a conversation gets too long, older turns are replaced with a shorter, generated summary instead of being kept in full." },
    { term: "Retrieval memory", plain: "A memory strategy where every turn of a conversation is saved to a searchable store, and only the most relevant past turns are pulled back in when they are actually needed." },
    { term: "File-backed memory / scratchpad", plain: "A memory strategy where the agent writes structured notes to files it can read again later, similar to a person keeping a notebook. Survives across sessions and can be reviewed by a human." },
    { term: "Context editing", plain: "A Claude API feature that deletes old, no-longer-useful tool results from a long conversation outright, rather than summarizing them, to stop them from being resent forever." },
    { term: "Compaction (compact_20260112)", plain: "A Claude API feature that automatically generates a summary of older parts of a long conversation on the server side as it approaches the context window limit." },
    { term: "Memory store", plain: "A Managed Agents feature: a workspace-scoped set of documents mounted into an agent's session like a small filesystem, that persists across sessions with version history." },
    { term: "Context rot", plain: "The observed effect where simply having a lot of text in a model's context window — even if none of it is wrong — measurably makes its reasoning less reliable, especially for content buried in the middle." },
    { term: "Eviction (of messages)", plain: "The act of deliberately removing old messages from a conversation to make room for new ones, whether by simple deletion, summarization, or moving them into retrieval storage." },
    { term: "tool_use / tool_result pairing", plain: "The requirement that every tool call a model makes (a tool_use block) must be matched by exactly one result sent back (a tool_result block) — breaking this pairing causes the API to reject the next request." }
  ],

  complexity: {
    rows: [
      { operation: "Buffer, t turns", time: "O(min(t,W)) tokens/turn", space: "O(W)", note: "flat cost, hard amnesia at the boundary" },
      { operation: "Naive full history", time: "O(t) tokens/turn → O(t²) total", space: "O(t)", note: "what you get if you do nothing" },
      { operation: "Summarization", time: "O(W) + 1 extra call per compaction", space: "O(W)", note: "lossy; summarizing summaries compounds error" },
      { operation: "Retrieval memory", time: "O(k·chunk) tokens/turn + 1 embed/turn", space: "O(t) on disk", note: "flat prompt, exact recall, retrieval misses" },
      { operation: "Prompt caching", time: "unchanged token count", space: "unchanged", note: "~0.1× price on the cached prefix" }
    ]
  },

  interview: {
    whyAsked: "It is the clearest architecture question in the space: there is no single right answer, only trade-offs, so it shows whether you reason about failure modes. The strongest signal is naming what each strategy *loses* and proposing a layered design rather than picking one.",
    followUps: [
      { q: "A user asks 'what was the invoice number you gave me earlier?' 40 turns later. Which strategy answers correctly?", a: "Retrieval, reliably. A buffer has evicted the turn entirely. A summary almost certainly dropped the exact digits — summaries preserve gist and discard specifics, and that is precisely what this question needs. This is the canonical example of why summarization is the wrong default for factual callbacks." },
      { q: "Why does summarization degrade over a long conversation?", a: "Because you eventually summarize summaries. Each pass is lossy, so detail decays geometrically and any error introduced early is inherited and amplified. Mitigations: summarize from the original turns rather than the previous summary where you can, keep a structured 'facts' section that is appended to rather than rewritten, and keep the most recent turns verbatim." },
      { q: "You have a 1M-token window. Why not just send everything?", a: "Cost, latency and quality. You pay for every token every turn; time-to-first-token scales with prompt size; and recall degrades for material in the middle of a very long context while irrelevant filler measurably hurts reasoning. A smaller curated context usually outperforms a larger complete one." },
      { q: "What is the difference between context editing and compaction?", a: "Context editing *clears* content — old tool results or thinking blocks are removed outright, which suits agent loops where stale tool output is dead weight. Compaction *summarizes* earlier context server-side as you approach the window limit, which suits long conversations where the thread matters. They compose: clear tool noise, compact the dialogue." },
      { q: "What is the classic bug when implementing compaction?", a: "Appending only the assistant's text back into `messages` instead of the full `response.content`. The compaction block in the response is what the API uses to replace the compacted history on the next request; drop it and the state silently resets, so the conversation grows again with no error." },
      { q: "How would you evict turns safely?", a: "Pin the system prompt so it can never be evicted. Drop whole user/assistant pairs from the oldest end, never half a turn, or you orphan a `tool_result` from its `tool_use` and the API rejects the request. And count tokens with `messages.count_tokens` rather than estimating, since tool schemas count too." },
      { q: "Design memory for a support agent that talks to the same customer over months.", a: "Three layers. A verbatim buffer of the current session for recency. A structured, file-backed profile the agent updates — preferences, open tickets, account facts — that persists across sessions and is human-auditable. And retrieval over the full transcript archive for specific callbacks. Never store credentials in it: memory is replayed verbatim into every future session." }
    ]
  },

  code: [
    { lang: "python", label: "Server-side compaction (the correct shape)", code: "messages = []\n\ndef chat(user_message: str) -> str:\n    messages.append({\"role\": \"user\", \"content\": user_message})\n\n    resp = client.beta.messages.create(\n        betas=[\"compact-2026-01-12\"],\n        model=\"claude-opus-5\",\n        max_tokens=16000,\n        messages=messages,\n        context_management={\"edits\": [{\"type\": \"compact_20260112\"}]},\n    )\n\n    # THE bug: appending only the text loses the compaction block, and the\n    # API silently stops replacing the compacted history.\n    messages.append({\"role\": \"assistant\", \"content\": resp.content})   # full content\n\n    return next(b.text for b in resp.content if b.type == \"text\")" },

    { lang: "python", label: "Context editing for agent loops", code: "# Clears STALE TOOL RESULTS rather than summarizing them. A 40KB tool output\n# from step 2 is dead weight by step 12 -- and it is re-sent every step.\nresp = client.beta.messages.create(\n    model=\"claude-opus-5\",\n    max_tokens=16000,\n    betas=[\"context-management-2025-06-27\"],\n    context_management={\"edits\": [\n        {\"type\": \"clear_tool_uses_20250919\", \"clear_tool_inputs\": True},\n        {\"type\": \"clear_thinking_20251015\"},\n    ]},\n    tools=tools,\n    messages=messages,\n)" },

    { lang: "python", label: "Layered memory, hand-rolled", code: "class LayeredMemory:\n    \"\"\"Verbatim recency + running summary + retrieval over the archive.\"\"\"\n\n    def __init__(self, keep_recent=6, budget=6000):\n        self.recent, self.summary, self.archive = [], \"\", []\n        self.keep_recent, self.budget = keep_recent, budget\n\n    def add(self, msg):\n        self.recent.append(msg)\n        self.archive.append({\"msg\": msg, \"vec\": embed(text_of(msg))})\n        # evict whole user/assistant PAIRS, never half a turn\n        while len(self.recent) > self.keep_recent:\n            pair, self.recent = self.recent[:2], self.recent[2:]\n            self.summary = self._resummarize(pair)\n\n    def _resummarize(self, pair):\n        r = client.messages.create(\n            model=\"claude-haiku-4-5\", max_tokens=400,\n            messages=[{\"role\": \"user\", \"content\":\n                f\"Running summary:\\n{self.summary}\\n\\nNew turns:\\n{pair}\\n\\n\"\n                f\"Rewrite the summary. Preserve every number, id, name and \"\n                f\"commitment verbatim; compress narrative only.\"}],\n        )\n        return next(b.text for b in r.content if b.type == \"text\")\n\n    def build(self, query):\n        hits = topk(self.archive, embed(query), k=3)   # exact wording survives\n        return [\n            {\"role\": \"user\", \"content\":\n             f\"<summary>{self.summary}</summary>\\n\"\n             f\"<recalled>{chr(10).join(h['msg']['content'] for h in hits)}</recalled>\"},\n            *self.recent,\n        ]" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.9, maxFrames: 300 },

    params: [
      { key: "window",  label: "Window (tokens)", type: "int", min: 600, max: 3000, default: 1400 },
      { key: "recent",  label: "Verbatim turns kept", type: "int", min: 2, max: 8, default: 4 },
      { key: "topk",    label: "Retrieval k", type: "int", min: 1, max: 4, default: 2 },
      { key: "seed",    label: "Re-roll dialogue", type: "seed" }
    ],

    frames: function* (params, rng) {
      const CAP = params.window;
      const KEEP = params.recent;
      const TOPK = params.topk;

      const SYS = { label: "system prompt", tokens: 180, kind: "system" };
      const GOLD_TURN = 3;
      const invoice = "INV-" + (4000 + Math.floor(rng() * 900));

      const TOPICS = [
        "set up the account", "confirm the billing address", "issue the invoice",
        "add a second seat", "change the plan tier", "ask about SSO",
        "report a login failure", "request a data export", "discuss the renewal date",
        "raise a tax exemption", "chase a webhook retry", "confirm the SLA terms",
        "schedule the onboarding", "close the ticket"
      ];

      let buffer = { items: [SYS], tokens: SYS.tokens, evicted: 0, cost: 0 };
      let summ = { items: [SYS], tokens: SYS.tokens, compactions: 0, extra: 0, cost: 0 };
      let retr = { items: [SYS], tokens: SYS.tokens, indexed: 0, cost: 0 };
      let turn = 0;
      let ask = null;

      const tokensOf = (arr) => arr.reduce((a, b) => a + b.tokens, 0);
      const clone = (o) => ({
        items: o.items.map((i) => ({ label: i.label, tokens: i.tokens, kind: i.kind, gold: !!i.gold })),
        tokens: o.tokens, cost: o.cost,
        evicted: o.evicted || 0, compactions: o.compactions || 0,
        extra: o.extra || 0, indexed: o.indexed || 0
      });

      const snap = (extra) => Object.assign({
        cap: CAP, turn, keep: KEEP, topk: TOPK, gold: GOLD_TURN, invoice,
        buffer: clone(buffer), summ: clone(summ), retr: clone(retr),
        ask, note: ""
      }, extra || {});

      yield {
        label: `Three strategies, one conversation, one ${CAP}-token window each. The API is stateless — "memory" is entirely a decision about what you re-send.`,
        phase: "init",
        state: snap()
      };

      for (turn = 1; turn <= 12; turn++) {
        const topic = TOPICS[(turn - 1) % TOPICS.length];
        const isGold = turn === GOLD_TURN;
        const uTok = 40 + Math.floor(rng() * 25);
        const aTok = 110 + Math.floor(rng() * 90);
        const uLabel = `t${turn} user · ${topic}`;
        const aLabel = isGold
          ? `t${turn} asst · invoice ${invoice} issued`
          : `t${turn} asst · ${topic}`;

        // ---- buffer -----------------------------------------------------
        buffer = {
          items: buffer.items.concat([
            { label: uLabel, tokens: uTok, kind: "turn", gold: false },
            { label: aLabel, tokens: aTok, kind: "turn", gold: isGold }
          ]),
          tokens: 0, evicted: buffer.evicted, cost: buffer.cost
        };
        buffer.tokens = tokensOf(buffer.items);

        // ---- summarizer -------------------------------------------------
        summ = {
          items: summ.items.concat([
            { label: uLabel, tokens: uTok, kind: "turn", gold: false },
            { label: aLabel, tokens: aTok, kind: "turn", gold: isGold }
          ]),
          tokens: 0, compactions: summ.compactions, extra: summ.extra, cost: summ.cost
        };
        summ.tokens = tokensOf(summ.items);

        // ---- retrieval --------------------------------------------------
        retr = {
          items: retr.items.concat([
            { label: uLabel, tokens: uTok, kind: "turn", gold: false },
            { label: aLabel, tokens: aTok, kind: "turn", gold: isGold }
          ]),
          tokens: 0, indexed: retr.indexed + 2, cost: retr.cost
        };
        retr.tokens = tokensOf(retr.items);

        yield {
          label: isGold
            ? `Turn ${turn}: the assistant issues invoice **${invoice}**. Remember this number — in nine turns the user is going to ask for it back.`
            : `Turn ${turn} (${topic}) appended to all three. Right now every strategy holds the identical verbatim history — the divergence only starts when the window fills.`,
          phase: "turn",
          state: snap({ hiTurn: turn })
        };

        // ---- buffer eviction --------------------------------------------
        if (buffer.tokens > CAP) {
          const dropped = [];
          const items = buffer.items.slice();
          while (tokensOf(items) > CAP && items.length > 3) {
            dropped.push(items[1]); dropped.push(items[2]);
            items.splice(1, 2);   // index 0 is the pinned system prompt
          }
          const lostGold = dropped.some((d) => d.gold);
          buffer = { items, tokens: tokensOf(items), evicted: buffer.evicted + dropped.length, cost: buffer.cost };
          yield {
            label: lostGold
              ? `BUFFER evicts turn ${GOLD_TURN} — the invoice number is now gone with no trace. The model will not know the turn ever existed; this is the silent failure mode of a sliding window.`
              : `BUFFER over ${CAP} tokens: drop the oldest whole user/assistant pair. Note the system prompt is pinned at index 0 — evicting it would make the agent forget its own instructions.`,
            phase: "evict",
            state: snap({ warnCol: 0 })
          };
        }

        // ---- summarization ----------------------------------------------
        if (summ.tokens > CAP) {
          const head = summ.items.slice(1);
          const keepN = KEEP * 2;
          const old = head.slice(0, Math.max(0, head.length - keepN));
          const keep = head.slice(Math.max(0, head.length - keepN));
          const hadGold = old.some((o) => o.gold) || summ.items.some((o) => o.kind === "summary" && o.gold);
          const prior = summ.items.filter((x) => x.kind === "summary").length;
          const sumTok = 120 + prior * 20;
          const newSummary = {
            label: `summary of ${old.length} messages` + (prior ? ` (pass ${prior + 1})` : ""),
            tokens: sumTok, kind: "summary",
            gold: hadGold && prior === 0     // detail survives one pass, not two
          };
          const items = [summ.items[0], newSummary].concat(keep);
          summ = {
            items, tokens: tokensOf(items),
            compactions: summ.compactions + 1,
            extra: summ.extra + 1,
            cost: summ.cost
          };
          yield {
            label: prior === 0
              ? `SUMMARIZER compacts ${old.length} old messages into ${sumTok} tokens. Costs one extra model call. The gist survives; whether the exact invoice digits survive depends entirely on how you prompt the summarizer.`
              : `SUMMARIZER runs again — and this pass summarizes a summary. Loss compounds: narrative survives, specific numbers and ids are usually the first casualty.`,
            phase: "compact",
            state: snap({ warnCol: 1 })
          };
        }

        // ---- retrieval memory --------------------------------------------
        if (retr.tokens > CAP) {
          const head = retr.items.slice(1);
          const keepN = KEEP * 2;
          const keep = head.slice(Math.max(0, head.length - keepN));
          const items = [retr.items[0], {
            label: `vector store · ${retr.indexed} messages indexed`,
            tokens: 30, kind: "index", gold: false
          }].concat(keep);
          retr = { items, tokens: tokensOf(items), indexed: retr.indexed, cost: retr.cost };
          yield {
            label: `RETRIEVAL writes every message to a vector store and keeps only the last ${KEEP} turns in the window. The prompt is now flat regardless of conversation length — and the original wording is still on disk, verbatim.`,
            phase: "index",
            state: snap({ warnCol: 2 })
          };
        }

        buffer = Object.assign({}, buffer, { cost: buffer.cost + buffer.tokens });
        summ = Object.assign({}, summ, { cost: summ.cost + summ.tokens + (summ.extra ? 0 : 0) });
        retr = Object.assign({}, retr, { cost: retr.cost + retr.tokens + 2 });
      }

      // ---- the callback question ------------------------------------------
      ask = { q: `"What was the invoice number you gave me earlier?"`, answers: null };
      yield {
        label: `Turn 13, the question every memory design is really evaluated on: ${ask.q} The answer was stated at turn ${GOLD_TURN}, ${12 - GOLD_TURN} turns ago.`,
        phase: "ask",
        state: snap()
      };

      const bufferHas = buffer.items.some((i) => i.gold);
      ask = { q: ask.q, answers: { buffer: bufferHas ? "exact" : "lost", summary: null, retrieval: null } };
      yield {
        label: bufferHas
          ? `BUFFER: still inside the window — an exact, verbatim answer. Sliding windows are perfect until the moment they are not.`
          : `BUFFER: the turn was evicted, so the model answers "I don't have that in this conversation" — or worse, invents a plausible number. Nothing signalled that a turn was dropped.`,
        phase: "answer",
        focus: [0],
        state: snap({ ask })
      };

      const summGold = summ.items.some((i) => i.gold);
      ask = { q: ask.q, answers: { buffer: bufferHas ? "exact" : "lost", summary: summGold ? "gist" : "lost", retrieval: null } };
      yield {
        label: summGold
          ? `SUMMARIZATION: the summary mentions an invoice was issued, but summaries preserve narrative and drop identifiers. Expect "an invoice was issued during onboarding" — right shape, missing the digits.`
          : `SUMMARIZATION: after ${summ.compactions} compaction passes the number is gone. Each pass is lossy and later passes summarize summaries, so specifics decay fastest.`,
        phase: "answer",
        focus: [1],
        state: snap({ ask })
      };

      ask = { q: ask.q, answers: { buffer: bufferHas ? "exact" : "lost", summary: summGold ? "gist" : "lost", retrieval: "exact" } };
      yield {
        label: `RETRIEVAL: embed the question, pull the top ${TOPK} archived messages, and turn ${GOLD_TURN} comes back word for word — **${invoice}**. Exact recall is the thing summarization structurally cannot give you.`,
        phase: "answer",
        focus: [2],
        state: snap({ ask })
      };

      yield {
        label: `Totals: buffer ${buffer.cost} prompt tokens and ${buffer.evicted} messages destroyed · summarization ${summ.cost} tokens plus ${summ.extra} extra model calls · retrieval ${retr.cost} tokens with ${retr.indexed} messages still on disk. Production systems layer all three, because they fail differently.`,
        phase: "done",
        state: snap({ ask })
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
      const kindColor = (k) =>
        k === "system" ? C.viz7 : k === "summary" ? C.viz4 : k === "index" ? C.viz3 : C.viz1;

      // ---------------- header --------------------------------------------
      root.appendChild(mk("text", { x: 20, y: 24, fill: C.text, "font-family": env.font.base, "font-size": 14 },
        "Three memory strategies, same conversation"));
      root.appendChild(mk("text", { x: 20, y: 42, fill: C.muted, "font-family": env.font.mono, "font-size": 11 },
        "turn " + S.turn + "   ·   window " + S.cap + " tok   ·   verbatim tail " + S.keep + " turns"));

      // conversation timeline
      const tlY = 58, tlX = 20, tlW = W - 40;
      const nTurns = 13;
      for (let t = 1; t <= nTurns; t++) {
        const x = tlX + (tlW - 14) * ((t - 1) / (nTurns - 1));
        const isGold = t === S.gold;
        const done = t <= S.turn;
        root.appendChild(mk("rect", {
          x: x, y: tlY, width: 12, height: 12, rx: 3,
          fill: isGold ? C.ok : done ? C.viz1 : C.surface2,
          opacity: done || isGold ? 1 : 0.5
        }));
      }
      root.appendChild(mk("text", {
        x: tlX + (tlW - 14) * ((S.gold - 1) / (nTurns - 1)) + 6, y: tlY - 4,
        "text-anchor": "middle", fill: C.ok, "font-family": env.font.mono, "font-size": 9
      }, S.invoice));

      // ---------------- three panels ---------------------------------------
      const cols = [
        { key: "buffer", title: "BUFFER", sub: "keep the last N turns", data: S.buffer },
        { key: "summ", title: "SUMMARIZATION", sub: "compress the old ones", data: S.summ },
        { key: "retr", title: "RETRIEVAL", sub: "index all, recall k", data: S.retr }
      ];

      const gap = 18;
      const pw = (W - 40 - gap * 2) / 3;
      const pyTop = 86;
      const ph = H - pyTop - 74;

      for (let ci = 0; ci < 3; ci++) {
        const col = cols[ci];
        const x = 20 + ci * (pw + gap);
        const warn = S.warnCol === ci;

        root.appendChild(mk("rect", {
          x: x, y: pyTop, width: pw, height: ph, rx: 8,
          fill: C.surface, stroke: warn ? C.viz4 : C.border, "stroke-width": warn ? 2 : 1
        }));
        root.appendChild(mk("text", {
          x: x + 12, y: pyTop + 20, fill: C.text, "font-family": env.font.base, "font-size": 12
        }, col.title));
        root.appendChild(mk("text", {
          x: x + 12, y: pyTop + 35, fill: C.muted, "font-family": env.font.base, "font-size": 10
        }, col.sub));

        // window box
        const bx = x + 12, by = pyTop + 46;
        const bw = pw - 24, bh = ph - 46 - 58;
        const over = col.data.tokens > S.cap;
        root.appendChild(mk("rect", {
          x: bx, y: by, width: bw, height: bh, rx: 6,
          fill: C.surface2, stroke: over ? C.danger : C.grid
        }));

        const scale = bh / Math.max(S.cap, col.data.tokens);
        let yy = by;
        for (const it of col.data.items) {
          const hgt = Math.max(3, it.tokens * scale);
          root.appendChild(mk("rect", {
            x: bx + 2, y: yy + 1, width: bw - 4, height: Math.max(2, hgt - 2), rx: 2,
            fill: it.gold ? C.ok : kindColor(it.kind),
            opacity: it.kind === "turn" ? 0.85 : 1
          }));
          if (hgt >= 12) {
            root.appendChild(mk("text", {
              x: bx + 8, y: yy + Math.min(hgt - 3, hgt / 2 + 4),
              fill: C.surface, "font-family": env.font.mono,
              "font-size": Math.min(9.5, Math.max(7, hgt * 0.5))
            }, clip(it.label, Math.floor((bw - 16) / 5.2))));
          }
          yy += hgt;
        }

        // gauge
        const gy = by + bh + 14;
        root.appendChild(mk("text", {
          x: bx, y: gy, fill: over ? C.danger : C.text2, "font-family": env.font.mono, "font-size": 10
        }, col.data.tokens + " / " + S.cap + " tok"));

        const stat =
          ci === 0 ? col.data.evicted + " msgs destroyed" :
          ci === 1 ? col.data.compactions + " compactions · " + col.data.extra + " extra calls" :
                     col.data.indexed + " msgs on disk";
        root.appendChild(mk("text", {
          x: bx, y: gy + 15, fill: C.muted, "font-family": env.font.mono, "font-size": 10
        }, clip(stat, Math.floor(bw / 5.4))));

        root.appendChild(mk("text", {
          x: bx, y: gy + 30, fill: C.muted, "font-family": env.font.mono, "font-size": 10
        }, "Σ " + col.data.cost + " prompt tok"));

        // answer verdict
        if (S.ask && S.ask.answers) {
          const v = [S.ask.answers.buffer, S.ask.answers.summary, S.ask.answers.retrieval][ci];
          if (v) {
            const vcol = v === "exact" ? C.ok : v === "gist" ? C.warn : C.danger;
            root.appendChild(mk("rect", {
              x: bx, y: gy + 38, width: bw, height: 22, rx: 5,
              fill: C.surface2, stroke: vcol, "stroke-width": 1.5
            }));
            root.appendChild(mk("text", {
              x: bx + bw / 2, y: gy + 53, "text-anchor": "middle",
              fill: vcol, "font-family": env.font.base, "font-size": 10
            }, v === "exact" ? "exact recall ✓" : v === "gist" ? "gist only — digits lost" : "forgotten ✗"));
          }
        }
      }

      // ---------------- callback question ----------------------------------
      if (S.ask) {
        root.appendChild(mk("text", {
          x: 20, y: H - 16, fill: C.text2, "font-family": env.font.mono, "font-size": 11
        }, clip("t13 user: " + S.ask.q, Math.floor((W - 40) / 6.2))));
      } else {
        root.appendChild(mk("text", {
          x: 20, y: H - 16, fill: C.muted, "font-family": env.font.base, "font-size": 10
        }, "pinned system prompt · gold fact · summary · retrieval index"));
      }
    }
  },

  drill: {
    cards: [
      { q: "Name the four memory strategies and what each loses.", a: "Buffer: loses everything past the window, silently. Summarization: loses specifics (numbers, ids, names) and compounds error across passes. Retrieval: loses nothing on disk but inherits retrieval misses. File-backed memory: loses nothing but needs explicit read/write instructions and human curation.", tags: ["strategies"] },
      { q: "Which strategy answers 'what was the invoice number?' 40 turns later?", a: "Retrieval. The buffer evicted the turn; a summary preserved the gist and dropped the digits — exactly the detail the question needs. This is the canonical argument against summarization as a default.", tags: ["trade-offs"] },
      { q: "Context editing vs compaction?", a: "Context editing *clears* stale tool results or thinking blocks outright (`clear_tool_uses_20250919`) — good for agent loops. Compaction *summarizes* earlier conversation server-side (`compact_20260112`) — good for long dialogues. They compose.", tags: ["api"] },
      { q: "The classic compaction bug?", a: "Appending only the response *text* back into `messages` instead of the full `response.content`. The compaction block is what the API uses to replace the compacted history next turn; dropping it silently loses the state with no error.", tags: ["pitfall"] },
      { q: "Two eviction bugs everyone hits?", a: "Evicting the system prompt (pin it at index 0), and dropping half a turn so a `tool_result` is orphaned from its `tool_use` — the API rejects that request. Always evict whole user/assistant pairs.", tags: ["pitfall"] },
      { q: "Why doesn't a 1M-token window make memory a solved problem?", a: "Cost scales with every token every turn, latency scales with prompt size, and recall degrades for material buried in the middle of a long context while irrelevant filler measurably hurts reasoning. A smaller curated context often beats a larger complete one.", tags: ["context-rot"] },
      { q: "Why does summarization degrade over time?", a: "You end up summarizing summaries — each pass is lossy so detail decays geometrically and early errors are inherited. Mitigate by summarizing from originals where possible, keeping a structured append-only facts section, and keeping recent turns verbatim.", tags: ["summarization"] },
      { q: "Is prompt caching a memory strategy?", a: "No — it is a cost strategy. It does not shrink the context by one token; it makes re-sending the same prefix cost ~0.1×. Reach for it first, then reduce what you send.", tags: ["caching"] }
    ],
    sixtySecond: [
      "Compare buffer, summarization and retrieval memory: what each costs, what each loses, and when you would pick each.",
      "Explain context rot and why a bigger context window does not remove the need for retrieval."
    ]
  }
};
