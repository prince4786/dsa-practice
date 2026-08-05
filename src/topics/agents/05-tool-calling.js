export default {
  id: "tool-calling",
  track: "agents",
  title: "Tool / Function Calling",
  difficulty: 2,
  minutes: 17,
  tags: ["tool-use", "json-schema", "structured-outputs", "agents", "safety"],

  explainer: [
    { type: "p", text: "Tool calling is a **contract**, not a capability. You send a list of JSON Schemas; the model emits a `tool_use` block naming one and supplying arguments that fit the schema; your code executes it and returns a `tool_result` carrying the matching `tool_use_id`. The model can no more run your function than it can read your database — it produces a structured request and stops." },

    { type: "h3", text: "The wire shapes, exactly" },
    { type: "code", lang: "python", code: "# what you send\n{\"name\": \"get_weather\",\n \"description\": \"Get the current weather for a city. Call this whenever the\\n                  user asks about conditions, temperature or forecast.\",\n \"input_schema\": {\"type\": \"object\",\n                  \"properties\": {\"location\": {\"type\": \"string\",\n                                              \"description\": \"City, e.g. Paris, FR\"}},\n                  \"required\": [\"location\"],\n                  \"additionalProperties\": False},\n \"strict\": True}\n\n# what comes back (stop_reason == \"tool_use\")\n{\"type\": \"tool_use\", \"id\": \"toolu_01A…\", \"name\": \"get_weather\",\n \"input\": {\"location\": \"Paris, FR\"}}\n\n# what you send next, inside a user message\n{\"type\": \"tool_result\", \"tool_use_id\": \"toolu_01A…\",\n \"content\": \"14°C, light rain\"}" },

    { type: "h3", text: "The description is the prompt" },
    { type: "p", text: "Tool descriptions are the single highest-leverage thing you write, and the usual failure is *under*-description. Three or four sentences minimum: what the tool does, **when to call it** (prescriptive trigger conditions, not just capabilities), when *not* to, what each parameter means, and what the tool does not return. Recent Claude models reach for tools conservatively, so a description that says \"Call this when the user asks about current prices or recent events\" measurably outperforms one that only says what the tool does." },
    { type: "callout", tone: "warn", text: "Do **not** put worked examples, fake dialogue, or numbered protocols in a tool description — they constrain the model's exploration and cost tokens on every request. And do not put behavioural steering there (`ALWAYS use X, NEVER use Y`): a description is a contract about functionality. Steering belongs in the system prompt." },

    { type: "h3", text: "Malformed calls and how to make them impossible" },
    { type: "p", text: "Without `strict: true`, the schema is a strong suggestion. A missing required field, a string where an integer belongs, or a hallucinated enum value all happen at low but non-zero rates — and once a bad token is sampled the model cannot retract it. Your only recovery is a `tool_result` with `is_error: true` describing the violation, which costs a full round trip. `strict: true` (plus `additionalProperties: false` and an explicit `required` list) makes the API guarantee the arguments validate, so the bad branch is never sampled." },
    { type: "callout", tone: "pitfall", text: "Never string-match the serialized tool input. Current models vary Unicode and forward-slash escaping, so `\"input\":{\"path\":\"a/b\"}` and `\"a\\/b\"` are both legal. Always parse with `json.loads` / `JSON.parse` and work with the object." },

    { type: "h3", text: "Design the tool surface, not just the tools" },
    { type: "list", items: [
      "**Bash gives breadth, dedicated tools give control.** A bash tool can do almost anything, but hands your harness an opaque string. Promote an action to its own tool when you need to *gate* it (irreversible actions), *render* it (a confirmation dialog), *audit* it (typed arguments in a log), or *parallelize* it (marking a read-only tool safe to run concurrently).",
      "**Fewer, clearly-bounded tools beat many overlapping ones.** Two tools whose descriptions could plausibly both match a request produce coin-flip routing. Past a few dozen tools, use tool search with `defer_loading` rather than shipping every schema in every request.",
      "**Return high-signal results.** Tool output is re-sent on every subsequent turn of the run. A 40KB JSON dump is a 40KB tax per remaining iteration. Filter server-side.",
      "**Parallel calls are the default.** One assistant message can contain several `tool_use` blocks; run them concurrently and return every `tool_result` in one user message."
    ]},

    { type: "h3", text: "Human-in-the-loop does not require a manual loop" },
    { type: "p", text: "A common misconception is that approval gates force you to hand-write the agent loop. They do not — gate inside the tool function (return \"user declined\" as the result) or intervene on the yielded message before the runner executes anything. What *does* require care is which actions get gated: reversibility is the useful criterion. Reading a file is fine; sending an email, deleting a row, or moving money is not." }
  ],

  complexity: {
    rows: [
      { operation: "Tool schemas in context", time: "~200–400 tokens each", space: "position 0 of the prefix", note: "a tool set change invalidates the whole cache" },
      { operation: "One tool round trip", time: "2 model calls + 1 execution", space: "+1 assistant +1 user turn", note: "call, then incorporate the result" },
      { operation: "k parallel calls", time: "2 model calls + max(exec)", space: "+1 assistant +1 user turn", note: "all results in ONE user message" },
      { operation: "Malformed-call retry", time: "+1 full round trip", space: "+2 turns of transcript", note: "eliminated by strict: true" },
      { operation: "First strict-schema request", time: "one-off compile cost", space: "—", note: "cached 24h per schema" }
    ]
  },

  interview: {
    whyAsked: "It is the clearest test of whether you know where the model ends and your system begins. The signal is in the details: the tool_use/tool_result id pairing, that all parallel results go in one message, that a failed tool returns an error result rather than raising, and that strict schemas remove a whole class of retries.",
    followUps: [
      { q: "The model emits a tool call. What has actually happened server-side?", a: "Nothing beyond text generation. The response carries `stop_reason: \"tool_use\"` and a `tool_use` block with an id, a name and a parsed `input` object. Execution is entirely yours: you validate, run, and reply with a `tool_result` referencing that id. The model has no side-effect capability of any kind." },
      { q: "How do you handle a malformed tool call?", a: "Return a `tool_result` with `is_error: true` and a message naming the violation — 'location is required and must be a string' — so the model can correct itself on the next turn. Better, prevent it: `strict: true` with `additionalProperties: false` and a complete `required` list makes the API guarantee the input validates, so the malformed branch is never generated." },
      { q: "Two tools could plausibly answer the same request. What happens, and what do you do?", a: "Routing becomes near-random and the model may oscillate between them. Fix it in the descriptions: state explicit boundaries in *both* ('use this for historical orders; use `live_orders` for anything in the last 24 hours'), or merge them into one tool with a discriminating parameter. Overlap is a schema design bug, not a prompting problem." },
      { q: "When would you promote an action out of a generic bash tool into its own tool?", a: "When the harness needs to do something with it that an opaque command string prevents: gate it behind approval (irreversible actions), render a custom UI, audit typed arguments, enforce a staleness check, or mark it parallel-safe. Bash gives breadth; dedicated tools give the harness a hook." },
      { q: "Your agent stopped making parallel tool calls after a refactor. Why?", a: "Almost certainly because the results are being returned in separate user messages instead of one. The API accepts it, but the transcript then shows the model that its parallel calls were serialized, and it stops emitting them. Batch every `tool_result` for a given assistant turn into a single user message." },
      { q: "How do you build an approval gate without hand-writing the loop?", a: "Gate inside the tool function itself — prompt the operator and return 'user declined: …' as the tool result — or, with the SDK tool runner, inspect the pending `tool_use` on the yielded message and override the messages before it executes. The runner only runs your function if you do not intervene." },
      { q: "Why does a chatty tool make an agent expensive?", a: "Because the tool result stays in the transcript and is re-sent on every subsequent iteration. A 40KB response on step 2 of a 15-step run is paid for 13 more times. Filter server-side, return ids plus a summary rather than full records, and use context editing to clear tool results once they stop being load-bearing." }
    ]
  },

  code: [
    { lang: "python", label: "Strict schema + parallel execution", code: "import json, anthropic\nfrom concurrent.futures import ThreadPoolExecutor\n\nTOOLS = [{\n    \"name\": \"get_weather\",\n    # 3-4 sentences: what, WHEN to call, when not to, what it doesn't return.\n    \"description\": (\n        \"Get current conditions for one city. Call this whenever the user asks \"\n        \"about weather, temperature, rain or what to wear. Do not call it for \"\n        \"forecasts more than 24h out — use get_forecast for that. Returns \"\n        \"observed conditions only; it does not return alerts or air quality.\"\n    ),\n    \"strict\": True,                      # API guarantees the input validates\n    \"input_schema\": {\n        \"type\": \"object\",\n        \"properties\": {\n            \"location\": {\"type\": \"string\",\n                         \"description\": \"City and country, e.g. 'Paris, FR'\"},\n            \"unit\": {\"type\": \"string\", \"enum\": [\"celsius\", \"fahrenheit\"]},\n        },\n        \"required\": [\"location\", \"unit\"],\n        \"additionalProperties\": False,   # required by strict mode\n    },\n}]\n\nresp = client.messages.create(model=\"claude-opus-5\", max_tokens=16000,\n                              tools=TOOLS, messages=messages)\n\nif resp.stop_reason == \"tool_use\":\n    calls = [b for b in resp.content if b.type == \"tool_use\"]\n    messages.append({\"role\": \"assistant\", \"content\": resp.content})\n\n    # independent calls run concurrently\n    with ThreadPoolExecutor() as pool:\n        outs = list(pool.map(lambda c: run(c.name, c.input), calls))\n\n    # ALL results in ONE user message\n    messages.append({\"role\": \"user\", \"content\": [\n        {\"type\": \"tool_result\", \"tool_use_id\": c.id, \"content\": o}\n        for c, o in zip(calls, outs)\n    ]})" },

    { lang: "python", label: "Error results and an approval gate", code: "DESTRUCTIVE = {\"send_email\", \"delete_record\", \"issue_refund\"}\n\ndef execute(name, args, approve):\n    if name in DESTRUCTIVE and not approve(name, args):\n        # A refusal is a normal RESULT, not an exception. The model sees it,\n        # explains to the user, and moves on.\n        return {\"content\": f\"user declined to run {name}\", \"is_error\": False}\n    try:\n        return {\"content\": TOOLS_IMPL[name](**args), \"is_error\": False}\n    except KeyError as e:\n        return {\"content\": f\"missing required argument: {e}\", \"is_error\": True}\n    except TimeoutError:\n        return {\"content\": \"upstream timed out after 10s; safe to retry once\",\n                \"is_error\": True}\n\nresults = []\nfor c in calls:\n    r = execute(c.name, c.input, approve)      # c.input is already parsed JSON\n    results.append({\"type\": \"tool_result\", \"tool_use_id\": c.id,\n                    \"content\": r[\"content\"], \"is_error\": r[\"is_error\"]})\n# every tool_use id must be answered — a missing one 400s the next request" },

    { lang: "javascript", label: "TypeScript-flavoured tool runner", code: "import Anthropic from \"@anthropic-ai/sdk\";\nimport { betaZodTool } from \"@anthropic-ai/sdk/helpers/beta/zod\";\nimport { z } from \"zod\";\n\nconst client = new Anthropic();\n\nconst getWeather = betaZodTool({\n  name: \"get_weather\",\n  description:\n    \"Get current conditions for one city. Call whenever the user asks about \" +\n    \"weather or temperature. Returns observed conditions only, not forecasts.\",\n  inputSchema: z.object({\n    location: z.string().describe(\"City and country, e.g. 'Paris, FR'\"),\n    unit: z.enum([\"celsius\", \"fahrenheit\"]),\n  }),\n  run: async ({ location, unit }) => weatherApi.now(location, unit),\n});\n\nconst runner = client.beta.messages.toolRunner({\n  model: \"claude-opus-5\",\n  max_tokens: 16000,\n  tools: [getWeather],\n  messages: [{ role: \"user\", content: task }],\n});\n\nconst final = await runner;   // loops until Claude stops calling tools" }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.75, maxFrames: 260 },

    params: [
      { key: "strict",   label: "strict: true",   type: "enum", options: ["off", "on"], default: "off" },
      { key: "parallel", label: "Parallel calls", type: "enum", options: ["off", "on"], default: "on" },
      { key: "gate",     label: "Approval gate",  type: "enum", options: ["off", "on"], default: "on" },
      { key: "seed",     label: "Re-roll",        type: "seed" }
    ],

    frames: function* (params, rng) {
      const strict = params.strict === "on";
      const parallel = params.parallel === "on";
      const gated = params.gate === "on";

      const LANES = ["USER", "MODEL", "HARNESS", "API"];
      const tableNo = 12 + Math.floor(rng() * 30);

      let msgs = [];       // {from,to,kind,label,payload}
      let schema = null;   // {name, fields:[{n,t,req,status}], strict}
      let gate = null;     // null | "pending" | "approved"
      let note = "";

      const snap = (extra) => Object.assign({
        lanes: LANES.slice(),
        msgs: msgs.map((m) => ({ from: m.from, to: m.to, kind: m.kind, label: m.label, payload: m.payload })),
        schema: schema ? { name: schema.name, strict: schema.strict, fields: schema.fields.map((f) => ({ n: f.n, t: f.t, req: f.req, status: f.status })) } : null,
        gate, note, inflight: false, cur: msgs.length - 1
      }, extra || {});

      const send = function* (from, to, kind, label, payload, flightLabel, landLabel) {
        yield {
          label: flightLabel,
          phase: "flight",
          state: snap({ inflight: true, flight: { from, to, kind, label, payload } })
        };
        msgs = msgs.concat([{ from, to, kind, label, payload }]);
        yield {
          label: landLabel,
          phase: kind,
          state: snap()
        };
      };

      schema = {
        name: "book_table",
        strict,
        fields: [
          { n: "restaurant_id", t: "string", req: true, status: "" },
          { n: "party_size", t: "integer", req: true, status: "" },
          { n: "time", t: "string (HH:MM)", req: true, status: "" },
          { n: "notes", t: "string", req: false, status: "" }
        ]
      };

      yield {
        label: `Three JSON schemas are sent with the request and render at position 0 of the prompt. \`strict\` is ${strict ? "ON — the API guarantees arguments validate" : "OFF — the schema is a strong suggestion, not a guarantee"}.`,
        phase: "init",
        state: snap()
      };

      yield* send("USER", "MODEL", "user",
        "user message + tools[]",
        'Book a table for 4 at 19:30 tonight and email me the confirmation.',
        "The task and the tool list go up together. The model has never seen your API — only these schemas.",
        "Request delivered. The model must now decide which tool, if any, fits the request.");

      yield* send("MODEL", "HARNESS", "tool_use",
        "tool_use · find_restaurants",
        '{"id":"toolu_01Ax","name":"find_restaurants","input":{"area":"downtown","party_size":4}}',
        "The model emits a `tool_use` block and stops. `stop_reason: \"tool_use\"` — nothing has executed yet; your code is the runtime.",
        "Your harness receives the block. It is already parsed JSON — never string-match the serialized form, escaping varies between models.");

      yield* send("HARNESS", "API", "call",
        "GET /restaurants?area=downtown",
        "auth: service key (the model never sees it)",
        "The harness maps the tool call onto a real API, injecting credentials the model has no access to.",
        "Upstream request issued with your credentials, your timeout, your retry policy.");

      yield* send("API", "HARNESS", "resp",
        "200 OK",
        '[{"id":"r_88","name":"Osteria","rating":4.6},{"id":"r_91","name":"Kaido","rating":4.4}]',
        "Upstream responds.",
        "Trim before returning: this result is re-sent on every later turn of the run, so verbose output is a recurring tax.");

      yield* send("HARNESS", "MODEL", "tool_result",
        "tool_result · toolu_01Ax",
        '[{"id":"r_88","name":"Osteria","rating":4.6},{"id":"r_91",…}]',
        "Result goes back as a `tool_result` in a user message, carrying the matching `tool_use_id`.",
        "The model can now see the restaurants. Every `tool_use` id must be answered — a missing one rejects the next request.");

      // ---- the booking call, with the malformed branch -------------------
      if (!strict) {
        yield* send("MODEL", "HARNESS", "tool_use",
          "tool_use · book_table (malformed)",
          '{"id":"toolu_02Bq","name":"book_table","input":{"restaurant_id":"r_88","party":4,"time":"19:30"}}',
          "The model emits the booking call. Without `strict`, nothing constrained the sampler as it wrote these arguments.",
          "Arrived — and it used `party` instead of the required `party_size`. Time to validate.");

        for (let i = 0; i < schema.fields.length; i++) {
          const f = schema.fields[i];
          const bad = f.n === "party_size";
          schema = {
            name: schema.name, strict: schema.strict,
            fields: schema.fields.map((x, j) => ({ n: x.n, t: x.t, req: x.req, status: j < i ? x.status : (j === i ? (bad ? "bad" : "ok") : "") }))
          };
          yield {
            label: bad
              ? `Validating \`${f.n}\`: **missing**. Required, and \`party\` is not in the schema — \`additionalProperties: false\` rejects it too.`
              : `Validating \`${f.n}\`: present and typed \`${f.t}\`. ✓`,
            phase: "validate",
            state: snap({ validating: i })
          };
        }

        yield* send("HARNESS", "MODEL", "error",
          "tool_result · is_error: true",
          '{"tool_use_id":"toolu_02Bq","is_error":true,"content":"party_size is required (integer); unknown field \'party\'"}',
          "Validation failed. Reply with an error `tool_result`, not an exception and not silence.",
          "A readable violation message lets the model self-correct — but you just paid a full extra round trip for it.");

        yield* send("MODEL", "HARNESS", "tool_use",
          "tool_use · book_table (corrected)",
          '{"id":"toolu_03Cr","name":"book_table","input":{"restaurant_id":"r_88","party_size":4,"time":"19:30"}}',
          "The model reads the error and re-emits the call.",
          "Correct this time. With `strict: true` this whole detour is impossible — the malformed branch is never sampled.");

        schema = { name: schema.name, strict: schema.strict, fields: schema.fields.map((x) => ({ n: x.n, t: x.t, req: x.req, status: x.req ? "ok" : "" })) };
      } else {
        yield* send("MODEL", "HARNESS", "tool_use",
          "tool_use · book_table",
          '{"id":"toolu_02Bq","name":"book_table","input":{"restaurant_id":"r_88","party_size":4,"time":"19:30"}}',
          "With `strict: true`, `additionalProperties: false` and a complete `required` list, the API constrains generation itself.",
          "Guaranteed to validate — no retry branch exists. The one-off schema compile is cached for 24 hours.");
        schema = { name: schema.name, strict: schema.strict, fields: schema.fields.map((x) => ({ n: x.n, t: x.t, req: x.req, status: x.req ? "ok" : "" })) };
      }

      if (parallel) {
        yield {
          label: `The model also emitted \`check_allergens\` in the **same** assistant message — parallel tool use is on by default. Both calls run concurrently in your harness.`,
          phase: "parallel",
          state: snap({ note: "2 tool_use blocks in one assistant turn" })
        };
      }

      yield* send("HARNESS", "API", "call",
        parallel ? "POST /bookings  ‖  GET /allergens" : "POST /bookings",
        `{"restaurant":"r_88","party_size":4,"time":"19:30"}`,
        parallel
          ? "Independent calls execute concurrently — wall-clock is max(), not sum()."
          : "Single call, executed with your credentials.",
        "Upstream working.");

      yield* send("API", "HARNESS", "resp",
        "201 Created",
        `{"booking_id":"BK-${tableNo}41","table":${tableNo},"confirmed":true}`,
        "Booking created.",
        "The side effect is now real — and it happened in your process, not the model's.");

      yield* send("HARNESS", "MODEL", "tool_result",
        parallel ? "tool_result ×2 · one user message" : "tool_result · toolu_02Bq",
        `[{"tool_use_id":"toolu_02Bq","content":"BK-${tableNo}41 confirmed"}${parallel ? ',{"tool_use_id":"toolu_02Bs","content":"no allergens flagged"}' : ""}]`,
        parallel
          ? "Both results go back in a SINGLE user message."
          : "Result returned.",
        parallel
          ? "Splitting parallel results across messages is accepted by the API but quietly trains the model to stop calling in parallel."
          : "The model can now compose an answer, or call another tool.");

      // ---- gated action -------------------------------------------------
      yield* send("MODEL", "HARNESS", "tool_use",
        "tool_use · send_email",
        '{"id":"toolu_04Dt","name":"send_email","input":{"to":"me@example.com","subject":"Table confirmed"}}',
        "Next the model wants to send an email — an irreversible action.",
        "This is why `send_email` is its own tool rather than `bash -c \"curl …\"`: your harness can only gate what it can see.");

      if (gated) {
        gate = "pending";
        yield {
          label: `Approval gate: the harness pauses before executing. Reversibility is the criterion — read a file freely, but sending mail, deleting rows and moving money should stop here.`,
          phase: "gate",
          state: snap()
        };
        gate = "approved";
        yield {
          label: `Approved. A denial is not an exception — you return a normal \`tool_result\` saying "user declined", and the model explains that to the user and continues.`,
          phase: "gate",
          state: snap()
        };
      }

      yield* send("HARNESS", "API", "call", "POST /mail/send", '{"to":"me@example.com",…}',
        "Executing the approved action.", "Sent.");

      yield* send("HARNESS", "MODEL", "tool_result", "tool_result · toolu_04Dt",
        '{"status":"sent","message_id":"msg_7c1"}',
        "Result returned to the model.",
        "The model now has everything it needs and no further tool to call.");

      yield* send("MODEL", "USER", "answer",
        "text · stop_reason: end_turn",
        `Booked Osteria for 4 at 19:30 (BK-${tableNo}41) and emailed the confirmation.`,
        "The model produces text instead of a tool call.",
        `\`stop_reason: "end_turn"\` ends the loop. ${strict ? "With strict schemas there was no retry detour." : "Without strict schemas, one malformed call cost a whole extra round trip."}`);
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
        k === "tool_use" ? C.viz2 :
        k === "tool_result" ? C.viz3 :
        k === "error" ? C.danger :
        k === "call" ? C.viz5 :
        k === "resp" ? C.viz4 :
        k === "answer" ? C.viz6 : C.viz1;

      // ---------------- schema card (left) --------------------------------
      const cardW = Math.min(320, W * 0.28);
      const cardX = 18, cardY = 60;
      root.appendChild(mk("text", { x: 18, y: 24, fill: C.text, "font-family": env.font.base, "font-size": 14 },
        "Tool calling — model · harness · API"));
      root.appendChild(mk("text", { x: 18, y: 42, fill: C.muted, "font-family": env.font.mono, "font-size": 11 },
        S.msgs.length + " messages exchanged"));

      if (S.schema) {
        const rows = S.schema.fields.length;
        const cardH = 66 + rows * 22;
        root.appendChild(mk("rect", {
          x: cardX, y: cardY, width: cardW, height: cardH, rx: 8,
          fill: C.surface2, stroke: S.schema.strict ? C.viz6 : C.border,
          "stroke-width": S.schema.strict ? 2 : 1
        }));
        root.appendChild(mk("text", {
          x: cardX + 12, y: cardY + 20, fill: C.text, "font-family": env.font.mono, "font-size": 12
        }, S.schema.name));
        root.appendChild(mk("text", {
          x: cardX + cardW - 12, y: cardY + 20, "text-anchor": "end",
          fill: S.schema.strict ? C.viz6 : C.muted, "font-family": env.font.mono, "font-size": 10
        }, S.schema.strict ? "strict: true" : "strict: false"));
        root.appendChild(mk("text", {
          x: cardX + 12, y: cardY + 36, fill: C.muted, "font-family": env.font.base, "font-size": 9.5
        }, "input_schema.properties"));

        for (let i = 0; i < rows; i++) {
          const f = S.schema.fields[i];
          const y = cardY + 54 + i * 22;
          const col = f.status === "ok" ? C.ok : f.status === "bad" ? C.danger : C.text2;
          root.appendChild(mk("text", {
            x: cardX + 12, y: y, fill: col, "font-family": env.font.mono, "font-size": 11
          }, (f.req ? "* " : "  ") + clip(f.n, 22)));
          root.appendChild(mk("text", {
            x: cardX + cardW - 12, y: y, "text-anchor": "end",
            fill: f.status === "bad" ? C.danger : C.muted, "font-family": env.font.mono, "font-size": 10
          }, f.status === "bad" ? "MISSING" : f.status === "ok" ? "✓ " + clip(f.t, 16) : clip(f.t, 18)));
        }

        root.appendChild(mk("text", {
          x: cardX + 12, y: cardY + cardH - 8, fill: C.muted, "font-family": env.font.base, "font-size": 9
        }, "* required · additionalProperties: false"));

        // gate badge
        if (S.gate) {
          const gy = cardY + cardH + 16;
          root.appendChild(mk("rect", {
            x: cardX, y: gy, width: cardW, height: 44, rx: 8,
            fill: C.surface2, stroke: S.gate === "pending" ? C.warn : C.ok, "stroke-width": 2
          }));
          root.appendChild(mk("text", {
            x: cardX + 12, y: gy + 19, fill: S.gate === "pending" ? C.warn : C.ok,
            "font-family": env.font.base, "font-size": 11
          }, S.gate === "pending" ? "APPROVAL PENDING" : "APPROVED"));
          root.appendChild(mk("text", {
            x: cardX + 12, y: gy + 34, fill: C.muted, "font-family": env.font.mono, "font-size": 9
          }, "send_email — irreversible"));
        }
      }

      // ---------------- sequence diagram (right) ---------------------------
      const sx = cardX + cardW + 26;
      const sw = W - sx - 18;
      const topY = 76, botY = H - 18;

      const lanes = S.lanes;
      const laneX = {};
      for (let i = 0; i < lanes.length; i++) {
        laneX[lanes[i]] = sx + (sw / lanes.length) * (i + 0.5);
      }

      for (const name of lanes) {
        const x = laneX[name];
        root.appendChild(mk("rect", {
          x: x - 44, y: topY - 26, width: 88, height: 22, rx: 5,
          fill: C.surface2, stroke: C.border
        }));
        root.appendChild(mk("text", {
          x: x, y: topY - 11, "text-anchor": "middle",
          fill: name === "HARNESS" ? C.accent : C.text2,
          "font-family": env.font.base, "font-size": 10
        }, name));
        root.appendChild(mk("line", {
          x1: x, y1: topY, x2: x, y2: botY, stroke: C.grid, "stroke-width": 1, "stroke-dasharray": "3 4"
        }));
      }

      // Message labels wrap onto a second line at a word boundary instead of
      // being ellipsized after ~20 chars -- "book_table (malformed)" and
      // "GET /allergens" need to read in full, not "book_table (malform...".
      const wrapLabel = (text, maxChars) => {
        if (text.length <= maxChars) return [text];
        const breakable = [" ", "·"];
        let idx = -1;
        for (let i = Math.min(text.length - 1, maxChars); i >= 1; i--) {
          if (breakable.indexOf(text[i]) >= 0) { idx = i; break; }
        }
        if (idx < 0) idx = maxChars;
        const line1 = text.slice(0, idx).trim();
        let line2 = text.slice(idx).trim();
        if (line2.length > maxChars) line2 = line2.slice(0, Math.max(1, maxChars - 1)) + "…";
        return [line1, line2];
      };

      const rowH = 58;
      const capacity = Math.max(1, Math.floor((botY - topY - 10) / rowH));
      const all = S.msgs.slice();
      if (S.inflight && S.flight) all.push(S.flight);
      const vis = all.slice(Math.max(0, all.length - capacity));

      for (let i = 0; i < vis.length; i++) {
        const m = vis[i];
        const y = topY + 26 + i * rowH;
        const x0 = laneX[m.from], x1 = laneX[m.to];
        const isLast = i === vis.length - 1;
        const flying = S.inflight && isLast;
        const col = kindColor(m.kind);
        const dir = x1 > x0 ? 1 : -1;
        const ax0 = x0 + dir * 6;
        const ax1 = flying ? x0 + (x1 - x0) * 0.55 : x1 - dir * 6;

        root.appendChild(mk("line", {
          x1: ax0, y1: y, x2: ax1, y2: y,
          stroke: col, "stroke-width": isLast ? 2.4 : 1.4,
          opacity: isLast ? 1 : 0.55,
          "stroke-dasharray": flying ? "5 4" : "none"
        }));
        // arrowhead
        root.appendChild(mk("path", {
          d: "M " + ax1 + " " + y + " L " + (ax1 - dir * 7) + " " + (y - 4) +
             " L " + (ax1 - dir * 7) + " " + (y + 4) + " Z",
          fill: col, opacity: isLast ? 1 : 0.55
        }));

        const midX = (ax0 + ax1) / 2;
        const labChars = Math.max(12, Math.floor(Math.abs(ax1 - ax0) / 5.6));
        const labLines = wrapLabel(m.label, labChars);
        const labFill = isLast ? col : C.muted;
        if (labLines.length === 1) {
          root.appendChild(mk("text", {
            x: midX, y: y - 6, "text-anchor": "middle",
            fill: labFill, "font-family": env.font.base, "font-size": 9.5
          }, labLines[0]));
        } else {
          root.appendChild(mk("text", {
            x: midX, y: y - 17, "text-anchor": "middle",
            fill: labFill, "font-family": env.font.base, "font-size": 9.5
          }, labLines[0]));
          root.appendChild(mk("text", {
            x: midX, y: y - 6, "text-anchor": "middle",
            fill: labFill, "font-family": env.font.base, "font-size": 9.5
          }, labLines[1]));
        }

        if (isLast && m.payload) {
          root.appendChild(mk("text", {
            x: sx + 4, y: y + 15,
            fill: C.text2, "font-family": env.font.mono, "font-size": 9
          }, clip(m.payload, Math.floor((sw - 8) / 5.4))));
        }
      }

      if (S.note) {
        root.appendChild(mk("text", {
          x: sx + 4, y: topY - 34, fill: C.viz2, "font-family": env.font.mono, "font-size": 10
        }, S.note));
      }
    }
  },

  drill: {
    cards: [
      { q: "What are the three wire objects in a tool round trip?", a: "The tool definition (`name`, `description`, `input_schema`) you send; the `tool_use` block (`id`, `name`, parsed `input`) the model emits with `stop_reason: \"tool_use\"`; and the `tool_result` block you return in a user message with the matching `tool_use_id`.", tags: ["api"] },
      { q: "What does `strict: true` guarantee, and what does it require?", a: "That `tool_use.input` validates against your schema exactly — the malformed branch is never sampled. It requires `additionalProperties: false` and a complete `required` list. First request pays a one-off schema compile, cached 24h.", tags: ["schema"] },
      { q: "How should a tool description be written?", a: "3–4+ sentences: what it does, prescriptive *when to call it*, when not to, what each parameter means, and what it does not return. No worked examples, no fake dialogue, no `ALWAYS/NEVER` steering — that belongs in the system prompt.", tags: ["description"] },
      { q: "Why must you parse tool input rather than string-match it?", a: "Escaping varies between models — Unicode and forward slashes may or may not be escaped. `block.input` is already a parsed object in the SDKs; never regex the serialized JSON.", tags: ["pitfall"] },
      { q: "When do you promote an action from bash into its own tool?", a: "When the harness needs a hook: approval gating for irreversible actions, custom UI rendering, typed audit logs, staleness checks, or marking a read-only action parallel-safe. Bash gives breadth; dedicated tools give control.", tags: ["design"] },
      { q: "Two tools overlap in purpose. What breaks?", a: "Routing becomes near-random and the model may oscillate. Fix it in both descriptions with explicit boundaries, or merge them into one tool with a discriminating parameter. It is a schema design bug, not a prompting problem.", tags: ["design"] },
      { q: "A tool times out. What goes back to the model?", a: "A `tool_result` with `is_error: true` and an actionable message ('upstream timed out after 10s; safe to retry once'), not a stack trace and never an omitted block. Every `tool_use` id must be answered.", tags: ["errors"] },
      { q: "Why did parallel tool calling stop happening after a refactor?", a: "Because the results are being returned in separate user messages. The API accepts it, but the transcript shows the model its parallel calls were serialized, and it stops emitting them. Batch all `tool_result`s into one user message.", tags: ["parallel"] }
    ],
    sixtySecond: [
      "Describe a full tool round trip at the wire level, including what the model does and what your harness does.",
      "Explain how a malformed tool call happens, what it costs, and how strict schemas eliminate it."
    ]
  }
};
