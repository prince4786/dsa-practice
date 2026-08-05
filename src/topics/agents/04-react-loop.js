export default {
  id: "react-loop",
  track: "agents",
  title: "ReAct Agent Loop",
  difficulty: 2,
  minutes: 16,
  tags: ["agents", "react", "tool-use", "control-flow", "failure-modes"],

  explainer: [
    { type: "p", text: "ReAct (*Reason + Act*) is the loop underneath essentially every agent: **thought → action → observation → thought → …** until the model produces an answer instead of an action. It was originally a prompting trick — you asked the model to emit `Thought:` / `Action:` lines and parsed them out of free text. Modern APIs make the same loop native: the model emits a structured `tool_use` block and the response comes back with `stop_reason: \"tool_use\"`." },

    { type: "callout", tone: "tip", text: "The sentence to have ready in an interview: **the model emits a tool call and stops — nothing has executed. Your code is the runtime.** Everything interesting about agent engineering lives in that gap: approval gates, timeouts, retries, sandboxing, logging, budget enforcement." },

    { type: "h3", text: "What each participant actually does" },
    { type: "list", items: [
      "**The model** decides *what* to call and with what arguments, then stops generating. It has no ability to execute anything, and no memory between requests.",
      "**Your harness** receives `stop_reason: \"tool_use\"`, extracts every `tool_use` block, executes them (in parallel if they are independent), and appends **all** the `tool_result` blocks in one user message.",
      "**The transcript** is the agent's entire state. The API is stateless, so 'the agent remembers' only means 'you re-sent the list'.",
      "**The loop terminates** when `stop_reason` is `end_turn` — or when *you* stop it, which is the part candidates forget."
    ]},

    { type: "h3", text: "Loop hygiene: the four guards you must write" },
    { type: "list", items: [
      "**Iteration cap.** Without one, a confused model can call the same tool until you run out of money. Ten to twenty-five iterations covers almost all real tasks; log every run that hits the cap, because that is your bug queue.",
      "**No-progress detection.** Track a hash of `(tool_name, arguments)`. The same call twice in a row with the same result means the model is stuck; inject a system-level nudge naming what it already knows rather than letting it spin.",
      "**Error results, not exceptions.** A failed tool returns `{\"type\": \"tool_result\", \"is_error\": true, \"content\": \"...\"}`. Dropping the block entirely breaks the `tool_use`/`tool_result` pairing and the API rejects your next request.",
      "**Budget.** `max_tokens` is a hard per-response cap the model cannot see. A `task_budget` is a ceiling the model *can* see, so it paces itself and wraps up gracefully instead of being guillotined mid-sentence."
    ]},

    { type: "h3", text: "Where the tokens go" },
    { type: "p", text: "Every iteration re-sends the whole transcript, so a 12-step agent run costs roughly the sum of a growing prefix — quadratic in steps. Two things flatten it: prompt caching (the prefix bills at ~0.1×) and context editing (`clear_tool_uses_20250919` drops stale tool results once they are no longer load-bearing). Verbose tool output is the usual culprit — a tool that returns 40KB of JSON pays for that 40KB on every remaining turn of the run." },

    { type: "callout", tone: "pitfall", text: "Parallel tool calls must have **all** their results returned in a **single** user message. Splitting them across multiple messages is accepted by the API but quietly teaches the model to stop making parallel calls, and your agent gets slower over time for no visible reason." },

    { type: "h3", text: "Reflexion, plan-and-execute, and when ReAct is the wrong shape" },
    { type: "p", text: "ReAct interleaves reasoning with action, which is right when the next step genuinely depends on what the last one returned. When it does not — three independent lookups, a fixed five-stage pipeline — a plain workflow with code-controlled steps is cheaper, faster, and testable. Reach for an agent when the task is multi-step *and* hard to specify in advance *and* errors are recoverable. \"It could be an agent\" is not \"it should be an agent\"." }
  ],

  complexity: {
    rows: [
      { operation: "One iteration", time: "1 model call + k tool calls", space: "transcript grows by ~1 turn", note: "tool calls parallelize; the model call does not" },
      { operation: "n-step run (naive)", time: "O(n²) input tokens", space: "O(n) transcript", note: "full transcript re-sent every iteration" },
      { operation: "n-step run (cached prefix)", time: "O(n²) tokens, ~0.1× price on the prefix", space: "O(n)", note: "breakpoint on the last block of the newest turn" },
      { operation: "n-step run (context editing)", time: "O(n·w)", space: "O(w)", note: "clear_tool_uses drops stale tool results" },
      { operation: "Latency", time: "n × (model TTFT + tool time)", space: "—", note: "sequential by construction — the loop cannot be pipelined" }
    ]
  },

  interview: {
    whyAsked: "It is the fastest way to see whether you understand the division of labour between the model and your code. Candidates who describe the agent as 'the model calling APIs' have not built one; candidates who talk about stop_reason, the tool_use/tool_result pairing, iteration caps and no-progress detection have.",
    followUps: [
      { q: "Walk me through one iteration of an agent loop at the API level.", a: "You POST the full message list plus tool schemas. The response comes back with `stop_reason: \"tool_use\"` and one or more `tool_use` blocks. You append the assistant message *verbatim* — the tool_use blocks must be preserved — execute each tool, and append a single user message containing one `tool_result` per call, each carrying the matching `tool_use_id`. Then you POST again. You stop when `stop_reason` is `end_turn`." },
      { q: "A tool throws. What do you send back?", a: "A `tool_result` with `is_error: true` and a short, actionable message — 'rate limited, retry after 30s', not a stack trace. Never omit the block: every `tool_use` must be answered or the next request is rejected for an unmatched id. Giving the model a readable error usually lets it recover on its own, which is cheaper than failing the whole run." },
      { q: "How do you stop an agent that loops forever?", a: "Three layers. A hard iteration cap in the harness. A no-progress check that hashes (tool_name, arguments) and detects repeats, then injects a system-level message naming what has already been tried. And a token budget — `task_budget` makes the ceiling visible to the model so it prioritizes and wraps up, where `max_tokens` just truncates it mid-thought." },
      { q: "Why is a 12-step agent run so much more expensive than 12 separate calls?", a: "Because each step re-sends the entire transcript, so total input is quadratic in steps. The biggest lever is caching the prefix, then trimming what accumulates: verbose tool output is usually the real cost driver, since a 40KB JSON blob is re-sent on every remaining iteration. Context editing clears stale tool results once they stop mattering." },
      { q: "When would you not use an agent loop?", a: "When the control flow is knowable in advance. Three independent lookups, or a fixed extract → validate → store pipeline, should be plain code with one model call per stage: cheaper, faster, deterministic, and unit-testable. Agents earn their overhead when the next step genuinely depends on the last result and the space of paths is too large to enumerate." },
      { q: "What is the difference between ReAct and plan-and-execute?", a: "ReAct decides one step at a time, so it adapts to surprises but can wander. Plan-and-execute drafts a full plan first, then executes it — cheaper and more auditable, but brittle when reality diverges from the plan. Most production systems are hybrids: plan up front, re-plan when an observation contradicts the plan." }
    ]
  },

  code: [
    { lang: "python", label: "The loop, with the guards", code: "import anthropic, json, hashlib\n\nclient = anthropic.Anthropic()\n\ndef run_agent(user_input, tools, execute, max_iters=20):\n    messages = [{\"role\": \"user\", \"content\": user_input}]\n    seen = []                      # (tool, args) fingerprints, for loop detection\n\n    for step in range(max_iters):\n        resp = client.messages.create(\n            model=\"claude-opus-5\",\n            max_tokens=16000,\n            thinking={\"type\": \"adaptive\"},\n            tools=tools,\n            messages=messages,\n        )\n\n        if resp.stop_reason == \"refusal\":       # check BEFORE reading content\n            return {\"status\": \"refused\", \"details\": resp.stop_details}\n\n        # Append the assistant turn verbatim: tool_use blocks must survive.\n        messages.append({\"role\": \"assistant\", \"content\": resp.content})\n\n        if resp.stop_reason == \"end_turn\":\n            return {\"status\": \"ok\",\n                    \"text\": \"\".join(b.text for b in resp.content if b.type == \"text\")}\n\n        calls = [b for b in resp.content if b.type == \"tool_use\"]\n\n        results = []\n        for call in calls:\n            fp = hashlib.sha1(\n                (call.name + json.dumps(call.input, sort_keys=True)).encode()\n            ).hexdigest()\n            repeat = seen[-1:] == [fp]           # identical call, back to back\n            seen.append(fp)\n            try:\n                out = execute(call.name, call.input)\n                results.append({\"type\": \"tool_result\",\n                                \"tool_use_id\": call.id, \"content\": out})\n            except Exception as e:\n                # An error result, never a dropped block: every tool_use\n                # must be answered or the next request 400s.\n                results.append({\"type\": \"tool_result\", \"tool_use_id\": call.id,\n                                \"content\": f\"error: {e}\", \"is_error\": True})\n\n        # ALL results in ONE user message — splitting them trains the model\n        # out of making parallel calls.\n        messages.append({\"role\": \"user\", \"content\": results})\n\n        if repeat:\n            messages.append({\"role\": \"system\", \"content\":\n                \"You just repeated an identical tool call. Do not call it \"\n                \"again; use the result you already have or say what is missing.\"})\n\n    return {\"status\": \"iteration_cap\", \"steps\": max_iters}" },

    { lang: "python", label: "The same loop with the SDK tool runner", code: "from anthropic import beta_tool\n\n@beta_tool\ndef search_flights(origin: str, destination: str, month: str) -> str:\n    \"\"\"Find nonstop flights on a route.\n\n    Args:\n        origin: IATA code of the departure airport, e.g. SFO.\n        destination: IATA code of the arrival airport, e.g. HND.\n        month: Month of travel as YYYY-MM.\n    \"\"\"\n    return json.dumps(flight_db.search(origin, destination, month))\n\nrunner = client.beta.messages.tool_runner(\n    model=\"claude-opus-5\",\n    max_tokens=16000,\n    tools=[search_flights],\n    messages=[{\"role\": \"user\", \"content\": task}],\n)\n\nfor message in runner:          # one iteration per yield, BEFORE tools run\n    for b in message.content:   # inspect / gate / log here if you need to\n        if b.type == \"tool_use\":\n            audit.log(b.name, b.input)\n# iteration stops automatically when Claude stops calling tools" },

    { lang: "python", label: "Make the budget visible to the model", code: "# max_tokens is a hard cap the model cannot see -> it gets cut off mid-answer.\n# task_budget is a ceiling it CAN see -> it paces itself and lands the plane.\nwith client.beta.messages.stream(\n    model=\"claude-opus-5\",\n    max_tokens=128000,\n    betas=[\"task-budgets-2026-03-13\"],\n    output_config={\n        \"effort\": \"high\",\n        \"task_budget\": {\"type\": \"tokens\", \"total\": 64000},   # min 20,000\n    },\n    tools=tools,\n    messages=messages,\n) as stream:\n    resp = stream.get_final_message()" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.8, maxFrames: 220 },

    params: [
      { key: "failure", label: "Inject", type: "enum", options: ["none", "tool-error", "repeat-loop"], default: "tool-error" },
      { key: "budget",  label: "Iteration cap", type: "int", min: 3, max: 12, default: 8 },
      { key: "seed",    label: "Re-roll prices", type: "seed" }
    ],

    frames: function* (params, rng) {
      const cap = params.budget;
      const mode = params.failure;

      const jitter = (base) => base + Math.floor(rng() * 40) - 20;
      const uaPrice = jitter(913);
      const nhPrice = jitter(861);

      let transcript = [];     // {kind, who, text}
      let node = "idle";       // thought | action | observation | answer
      let iter = 0;
      let tokens = 340;        // system + tool schemas
      let calls = 0;

      const snap = (extra) => Object.assign({
        transcript: transcript.map((e) => ({ kind: e.kind, who: e.who, text: e.text })),
        node, iter, cap, tokens, calls, mode
      }, extra || {});

      const add = (kind, who, text, cost) => {
        transcript = transcript.concat([{ kind, who, text }]);
        tokens += cost;
      };

      yield {
        label: `Task: find the cheapest nonstop SFO→HND in March under $900 and hold it. The model has three tools and no ability to run any of them.`,
        phase: "init",
        state: snap()
      };

      const cycle = function* (thought, toolName, args, obs, opts) {
        opts = opts || {};
        iter++;
        node = "thought";
        add("thought", "assistant", thought, 60);
        yield {
          label: `Iteration ${iter} · THOUGHT. Reasoning happens inside the model's turn; on Claude this is a thinking block, billed as output and invisible to your tools.`,
          phase: "thought",
          state: snap()
        };

        node = "action";
        calls++;
        add("action", "assistant", `tool_use  ${toolName}(${args})`, 45);
        yield {
          label: `Iteration ${iter} · ACTION. The model emits a \`tool_use\` block and stops — \`stop_reason: "tool_use"\`. Nothing has executed yet; your code is the runtime.`,
          phase: "action",
          state: snap({ pending: true })
        };

        yield {
          label: `Your harness extracts the call, validates the arguments against the schema, and runs it. Timeouts, auth, retries and approval gates all live here — the model never sees any of it.`,
          phase: "execute",
          state: snap({ pending: true, executing: true })
        };

        node = "observation";
        add(opts.error ? "error" : "observation", "user", `tool_result  ${obs}`, opts.cost || 130);
        yield {
          label: opts.error
            ? `Iteration ${iter} · OBSERVATION (error). The failure comes back as a \`tool_result\` with \`is_error: true\`. Dropping the block instead would orphan the \`tool_use\` and the next request would be rejected.`
            : `Iteration ${iter} · OBSERVATION. The result is appended as a \`tool_result\` carrying the matching \`tool_use_id\`, in a single user message.`,
          phase: "observation",
          state: snap()
        };

        yield {
          label: `The whole transcript — ${tokens} tokens now — is re-sent for the next model call. This is why an n-step run costs O(n²) input tokens unless you cache the prefix.`,
          phase: "resend",
          state: snap({ resending: true })
        };
      };

      yield* cycle(
        "I need candidate flights before I can compare prices. Search the route first.",
        "search_flights",
        '{"origin":"SFO","destination":"HND","month":"2026-03","nonstop":true}',
        '4 flights: UA837 $842 · NH107 $868 · JL001 $1,104 · SQ012 $1,290'
      );

      if (mode === "tool-error") {
        yield* cycle(
          "UA837 is cheapest on the listing. Listings go stale, so confirm the live fare.",
          "get_price",
          '{"flight":"UA837","date":"2026-03-14"}',
          'error: upstream rate limited (429), retry_after=8s',
          { error: true, cost: 40 }
        );
        yield* cycle(
          "The pricing service rate limited me. Wait and retry the same flight once.",
          "get_price",
          '{"flight":"UA837","date":"2026-03-14"}',
          `{"flight":"UA837","live_price":${uaPrice},"currency":"USD"}`
        );
      } else {
        yield* cycle(
          "UA837 is cheapest on the listing. Listings go stale, so confirm the live fare.",
          "get_price",
          '{"flight":"UA837","date":"2026-03-14"}',
          `{"flight":"UA837","live_price":${uaPrice},"currency":"USD"}`
        );
      }

      node = "thought";
      add("thought", "assistant", `Live fare is $${uaPrice}, over the $900 ceiling. The listing price was wrong — check NH107 next.`, 60);
      yield {
        label: `Re-plan. The observation contradicted the plan: $${uaPrice} ≠ the $842 listing. This is exactly the case ReAct exists for — a plan fixed up front would have booked the wrong flight.`,
        phase: "thought",
        state: snap()
      };

      yield* cycle(
        "Check the live fare on the second-cheapest option.",
        "get_price",
        '{"flight":"NH107","date":"2026-03-14"}',
        `{"flight":"NH107","live_price":${nhPrice},"currency":"USD"}`
      );

      if (mode === "repeat-loop") {
        yield* cycle(
          "Let me confirm that price once more before committing.",
          "get_price",
          '{"flight":"NH107","date":"2026-03-14"}',
          `{"flight":"NH107","live_price":${nhPrice},"currency":"USD"}`
        );
        add("nudge", "system", "You repeated an identical call. Use the result you already have.", 30);
        yield {
          label: `Loop detected: identical \`(tool_name, arguments)\` fingerprint two calls in a row with an identical result. The harness injects a system-level nudge — cheaper than letting the agent burn its whole budget re-verifying.`,
          phase: "nudge",
          state: snap({ warn: true })
        };
      }

      yield* cycle(
        `NH107 at $${nhPrice} is under the $900 ceiling and nonstop. Place the hold.`,
        "hold_booking",
        '{"flight":"NH107","date":"2026-03-14","passengers":1}',
        '{"hold_id":"HB-4471","expires_at":"2026-03-01T18:00Z"}'
      );

      node = "answer";
      add("answer", "assistant", `Held NH107 (SFO→HND, 14 Mar, nonstop) at $${nhPrice}. Hold HB-4471 expires in 24h. UA837 listed at $842 but priced live at $${uaPrice}.`, 70);
      yield {
        label: `\`stop_reason: "end_turn"\` — the model answered instead of calling a tool, so the loop exits. ${iter} iterations, ${calls} tool calls, ~${tokens} tokens in the final transcript.`,
        phase: "done",
        state: snap()
      };

      if (iter >= cap) {
        yield {
          label: `Note: this run used ${iter} of your ${cap}-iteration cap. Runs that hit the cap are your bug queue — log them, do not just raise the number.`,
          phase: "done",
          state: snap({ warn: true })
        };
      }
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

      const wrap = (s, n) => {
        const words = String(s).split(" ");
        const out = []; let line = "";
        for (const w of words) {
          if (!line.length) { line = w; }
          else if (line.length + 1 + w.length <= n) { line += " " + w; }
          else { out.push(line); line = w; }
          while (line.length > n) { out.push(line.slice(0, n)); line = line.slice(n); }
        }
        if (line.length) out.push(line);
        return out;
      };

      const kindColor = (k) =>
        k === "thought" ? C.viz7 :
        k === "action" ? C.viz2 :
        k === "observation" ? C.viz3 :
        k === "error" ? C.danger :
        k === "nudge" ? C.warn : C.viz6;

      // ---------------- header --------------------------------------------
      root.appendChild(mk("text", { x: 20, y: 24, fill: C.text, "font-family": env.font.base, "font-size": 14 },
        "ReAct loop — thought → action → observation"));
      root.appendChild(mk("text", { x: 20, y: 42, fill: C.muted, "font-family": env.font.mono, "font-size": 11 },
        "iter " + S.iter + "/" + S.cap + "   ·   " + S.calls + " tool calls   ·   transcript " + S.tokens + " tok"));

      // ---------------- loop diagram (left) --------------------------------
      const dx = 24, dy = 66, dw = Math.min(300, W * 0.31), dh = H - dy - 24;
      root.appendChild(mk("rect", { x: dx, y: dy, width: dw, height: dh, rx: 8, fill: C.surface, stroke: C.border }));

      const cx = dx + dw / 2, cyc = dy + dh * 0.45, R = Math.min(dw, dh) * 0.30;
      const nodes = [
        { id: "thought", label: "THOUGHT", sub: "model reasons", a: -Math.PI / 2 },
        { id: "action", label: "ACTION", sub: "tool_use emitted", a: Math.PI / 6 },
        { id: "observation", label: "OBSERVATION", sub: "tool_result", a: (5 * Math.PI) / 6 }
      ];

      // arcs between nodes
      for (let i = 0; i < 3; i++) {
        const a0 = nodes[i].a, a1 = nodes[(i + 1) % 3].a;
        const p0 = { x: cx + Math.cos(a0) * R, y: cyc + Math.sin(a0) * R };
        const p1 = { x: cx + Math.cos(a1) * R, y: cyc + Math.sin(a1) * R };
        const active = S.node === nodes[(i + 1) % 3].id;
        root.appendChild(mk("path", {
          d: "M " + p0.x + " " + p0.y + " A " + R + " " + R + " 0 0 1 " + p1.x + " " + p1.y,
          fill: "none", stroke: active ? C.accent : C.grid,
          "stroke-width": active ? 2.5 : 1.5
        }));
      }

      for (const nd of nodes) {
        const x = cx + Math.cos(nd.a) * R, y = cyc + Math.sin(nd.a) * R;
        const on = S.node === nd.id;
        root.appendChild(mk("circle", {
          cx: x, cy: y, r: on ? 34 : 30,
          fill: on ? kindColor(nd.id) : C.surface2,
          stroke: on ? C.text : C.border, "stroke-width": on ? 2 : 1
        }));
        root.appendChild(mk("text", {
          x: x, y: y + 3, "text-anchor": "middle",
          fill: on ? C.surface : C.text2, "font-family": env.font.base, "font-size": 9.5
        }, nd.label));
        root.appendChild(mk("text", {
          x: x, y: y + 15, "text-anchor": "middle",
          fill: on ? C.surface : C.muted, "font-family": env.font.mono, "font-size": 8
        }, nd.sub));
      }

      // executor box under the ACTION node
      const exY = cyc + R + 62;
      const exOn = frame.phase === "execute";
      root.appendChild(mk("rect", {
        x: dx + 22, y: exY, width: dw - 44, height: 40, rx: 6,
        fill: exOn ? C.viz2 : C.surface2, stroke: exOn ? C.text : C.border
      }));
      root.appendChild(mk("text", {
        x: cx, y: exY + 17, "text-anchor": "middle",
        fill: exOn ? C.surface : C.text2, "font-family": env.font.base, "font-size": 11
      }, "YOUR HARNESS"));
      root.appendChild(mk("text", {
        x: cx, y: exY + 31, "text-anchor": "middle",
        fill: exOn ? C.surface : C.muted, "font-family": env.font.mono, "font-size": 9
      }, "execute · gate · retry · log"));

      // exit arrow
      if (S.node === "answer") {
        root.appendChild(mk("line", {
          x1: cx, y1: cyc - R - 34, x2: cx, y2: dy + 22,
          stroke: C.viz6, "stroke-width": 2.5
        }));
        root.appendChild(mk("text", {
          x: cx, y: dy + 16, "text-anchor": "middle",
          fill: C.viz6, "font-family": env.font.mono, "font-size": 10
        }, "end_turn ↑"));
      }

      // ---------------- transcript (right) ---------------------------------
      const tx = dx + dw + 22, tw = W - tx - 20;
      root.appendChild(mk("rect", { x: tx, y: dy, width: tw, height: dh, rx: 8, fill: C.surface, stroke: C.border }));
      root.appendChild(mk("text", {
        x: tx + 12, y: dy + 18, fill: C.muted, "font-family": env.font.base, "font-size": 11
      }, "messages[] — the agent's entire state"));

      const charW = 6.1, fs = 10;
      const maxChars = Math.max(12, Math.floor((tw - 34) / charW));

      // lay out from the bottom so the newest entry is always visible
      const entries = S.transcript;
      const laid = [];
      let hUsed = 0;
      const availH = dh - 40;
      for (let i = entries.length - 1; i >= 0; i--) {
        const lines = wrap(entries[i].text, maxChars);
        const eh = 14 + lines.length * 12 + 8;
        if (hUsed + eh > availH) break;
        hUsed += eh;
        laid.unshift({ e: entries[i], lines: lines, h: eh, idx: i });
      }

      let ey = dy + 30;
      for (const item of laid) {
        const col = kindColor(item.e.kind);
        const newest = item.idx === entries.length - 1;
        root.appendChild(mk("rect", {
          x: tx + 10, y: ey, width: 3, height: item.h - 6, rx: 1.5, fill: col
        }));
        root.appendChild(mk("text", {
          x: tx + 20, y: ey + 9, fill: col, "font-family": env.font.base, "font-size": 9
        }, item.e.who + " · " + item.e.kind));
        for (let li = 0; li < item.lines.length; li++) {
          root.appendChild(mk("text", {
            x: tx + 20, y: ey + 22 + li * 12,
            fill: newest ? C.text : C.text2,
            "font-family": env.font.mono, "font-size": fs
          }, item.lines[li]));
        }
        if (newest) {
          root.appendChild(mk("rect", {
            x: tx + 6, y: ey - 3, width: tw - 16, height: item.h, rx: 4,
            fill: "none", stroke: col, "stroke-width": 1, opacity: 0.6
          }));
        }
        ey += item.h;
      }

      if (frame.phase === "resend") {
        root.appendChild(mk("rect", {
          x: tx, y: dy, width: tw, height: dh, rx: 8,
          fill: "none", stroke: C.viz4, "stroke-width": 3
        }));
        root.appendChild(mk("text", {
          x: tx + tw - 12, y: dy + 18, "text-anchor": "end",
          fill: C.viz4, "font-family": env.font.mono, "font-size": 10
        }, "↻ all " + S.tokens + " tokens re-sent"));
      }
    }
  },

  drill: {
    cards: [
      { q: "What does the model do when it wants to use a tool?", a: "It emits a `tool_use` content block and stops generating; the response carries `stop_reason: \"tool_use\"`. Nothing has executed — your harness is the runtime that runs the tool and feeds the result back.", tags: ["tool-use"] },
      { q: "How do you return a failed tool call?", a: "A `tool_result` block with `is_error: true` and a short actionable message. Never drop the block: every `tool_use` id must be answered or the next request is rejected.", tags: ["errors"] },
      { q: "Multiple parallel tool calls — how are results returned?", a: "All `tool_result` blocks in a **single** user message. Splitting them across messages is accepted but trains the model out of making parallel calls, silently slowing the agent down.", tags: ["parallel"] },
      { q: "Why is an n-step agent run O(n²) in input tokens?", a: "The API is stateless, so each iteration re-sends the full transcript. Cache the prefix (~0.1×) and use context editing to clear stale tool results; verbose tool output is usually the real cost driver.", tags: ["cost"] },
      { q: "How do you detect a stuck agent?", a: "Hash `(tool_name, sorted arguments)` per call. An identical fingerprint back-to-back with an identical result means no progress — inject a system message naming what has already been tried, on top of a hard iteration cap.", tags: ["failure-modes"] },
      { q: "`max_tokens` vs `task_budget`?", a: "`max_tokens` is an enforced per-response cap the model cannot see, so hitting it truncates mid-thought. `task_budget` (min 20,000) is a loop-level ceiling the model *can* see, so it paces itself and finishes gracefully.", tags: ["budget"] },
      { q: "When should you *not* build an agent loop?", a: "When the control flow is knowable in advance. A fixed pipeline or a set of independent lookups should be plain code with one model call per stage — cheaper, faster, deterministic and testable.", tags: ["design"] },
      { q: "ReAct vs plan-and-execute?", a: "ReAct decides one step at a time (adaptive, can wander). Plan-and-execute drafts the whole plan first (cheap, auditable, brittle when reality diverges). Production systems usually plan up front and re-plan when an observation contradicts the plan.", tags: ["design"] }
    ],
    sixtySecond: [
      "Explain one iteration of an agent loop at the API level, and name what the model does versus what your code does.",
      "Explain the four guards every agent loop needs and the failure each one prevents."
    ]
  }
};
