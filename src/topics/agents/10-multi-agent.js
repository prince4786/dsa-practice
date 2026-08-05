export default {
  id: "multi-agent",
  track: "agents",
  title: "Multi-Agent Orchestration",
  difficulty: 3,
  minutes: 18,
  tags: ["multi-agent", "orchestration", "dag", "parallelism", "cost"],

  explainer: [
    { type: "p", text: "A multi-agent system is a scheduler wearing a trench coat. A **coordinator** decomposes a task into a dependency graph, dispatches independent nodes to **workers** that each run their own agent loop in their own context window, and merges the results. Everything hard about it is classic distributed systems — dependency ordering, partial failure, result reconciliation — plus one new problem: the workers cannot see each other's context." },

    { type: "callout", tone: "pitfall", text: "**Context is not shared.** Each subagent starts with an empty window and only what the coordinator wrote into its delegation message. If the coordinator says \"research vendor B like you did for A\", the worker has no idea what A was. Under-briefing is the number one cause of bad subagent output, and it looks like model failure rather than orchestration failure." },

    { type: "h3", text: "When fan-out actually pays" },
    { type: "list", items: [
      "**Genuinely independent work.** Three vendors researched in parallel is a real 3× on wall-clock. Three sequential edits to one file is not — you have paid three context re-establishments for zero speedup.",
      "**Context isolation as a feature.** A worker that reads 200KB of logs and returns a 500-token finding keeps that 200KB out of the coordinator's window entirely. This is often the *main* reason to delegate, not speed.",
      "**Different tools or permissions per role.** A read-only researcher and a write-capable editor are cleanly separable.",
      "**Not for:** anything you could finish in a handful of tool calls yourself, and not for verification — checking your own work belongs in the main loop, not in a subagent."
    ]},

    { type: "h3", text: "The cost model, honestly" },
    { type: "p", text: "Multi-agent runs are typically several times more expensive than a single agent doing the same work sequentially. Every worker re-establishes its own context, re-explores, and reports back — and the coordinator then pays to read every report. You are buying wall-clock time and context isolation with tokens. That trade is excellent for wide research and poor for a three-file refactor, which is why an explicit spawn cap matters more than any prompt." },
    { type: "callout", tone: "warn", text: "Model-dependent behaviour worth knowing: Claude Opus 4.8 *under*-reached for subagents and needed prompting to delegate; Claude Opus 5 delegates readily and usually needs a cap instead. Guidance written for one model can be exactly backwards on the next — this is a real migration item, not a style preference." },

    { type: "h3", text: "Failure and replanning" },
    { type: "list", items: [
      "**A failed node is data, not an exception.** The coordinator sees the failure, decides whether the plan still holds, and either substitutes an approach (cached filings instead of a blocked site) or drops the node and narrows the deliverable.",
      "**Retry once, then replan.** Repeating an identical failing call is the classic infinite loop; the fingerprint check from the agent-loop lesson applies per worker *and* at the coordinator.",
      "**Partial results are usually shippable.** \"Two of three vendors covered, third blocked by a paywall\" is a far better outcome than a failed run — but only if the coordinator is told that partial delivery is acceptable.",
      "**Depth one.** Coordinators delegate to workers; workers do not delegate further. Managed Agents enforces this — rostering an agent that itself has a roster is a validation error — because unbounded depth makes cost, latency and failure attribution impossible to reason about."
    ]},

    { type: "h3", text: "Merging is where correctness is lost" },
    { type: "p", text: "Two workers editing the same file, two research nodes returning contradictory numbers, a summary node that silently drops one worker's finding — the merge step is the least glamorous and most bug-prone part. Give workers disjoint write scopes wherever possible, make the coordinator reconcile conflicts explicitly rather than concatenating, and require each worker to return citations so the coordinator can adjudicate rather than guess." },

    { type: "h3", text: "Communication topology" },
    { type: "p", text: "Prefer a **star**: workers report to the coordinator and never to each other. Full mesh communication multiplies token cost quadratically and makes traces unreadable. On Managed Agents each subagent runs in its own *thread* with its own event stream and history; the session-level stream shows a condensed view, and cross-thread messages appear as `agent.thread_message_sent` / `_received` — direction is relative to whichever thread's stream you are reading, which is a classic misreading." }
  ],

  complexity: {
    rows: [
      { operation: "Sequential agent, n subtasks", time: "Σ tᵢ", space: "one growing context", note: "cheapest in tokens; slowest in wall-clock" },
      { operation: "Parallel, w workers", time: "critical path, ≥ max tᵢ", space: "w independent contexts", note: "speedup capped by the DAG, not by w" },
      { operation: "Token cost of fan-out", time: "~w × context re-establishment", space: "—", note: "typically several× a single agent for the same work" },
      { operation: "Coordinator merge", time: "O(w) reports read", space: "+Σ report tokens", note: "reports land in the coordinator's window and stay there" },
      { operation: "Replan after failure", time: "+1 coordinator call + retried subtree", space: "—", note: "retry once, then change approach" }
    ]
  },

  interview: {
    whyAsked: "It is a systems-design question disguised as an LLM question. Interviewers want to hear dependency graphs, critical paths, partial failure and merge conflicts — and they want to hear you say out loud that multi-agent costs several times more than a single agent, because candidates who have only read about it never mention the bill.",
    followUps: [
      { q: "When is multi-agent worth it, and when is it theatre?", a: "Worth it when subtasks are genuinely independent (real wall-clock speedup) or when a worker consumes far more context than it returns (isolation keeps the coordinator's window clean). Theatre when the work is inherently sequential or small — you pay w context re-establishments and w reports for no parallelism. If you could finish it in a handful of tool calls yourself, do that." },
      { q: "Why is it several times more expensive?", a: "Each worker starts cold, re-reads whatever it needs, runs its own loop, and writes a report the coordinator then pays to read. None of that context is shared, so the same background material can be paid for w times. You are buying latency and isolation with tokens; the decision should be explicit, with a spawn cap enforced in the harness." },
      { q: "A worker fails. What does the coordinator do?", a: "Treat it as data. Retry once for a transient failure, then replan: substitute an approach, narrow the deliverable, or drop the node and report partial results. Repeating an identical failing call is the classic infinite loop, so fingerprint calls per worker and at the coordinator. Partial delivery beats a failed run, provided the coordinator has been told partial is acceptable." },
      { q: "Two workers edited the same file. How do you prevent that?", a: "Structurally, by giving workers disjoint write scopes and keeping the graph's parallel branches on non-overlapping resources. When it cannot be avoided, serialize the writes behind a single writer node, or have workers propose patches that the coordinator applies. The merge step should reconcile explicitly, never concatenate." },
      { q: "How deep should delegation go?", a: "One level. Coordinator to worker, and no further — Managed Agents enforces this as a validation error rather than silently flattening it. Deeper trees make cost, latency and failure attribution impossible to reason about, and the second level almost never adds capability that a wider first level would not." },
      { q: "How do you brief a subagent?", a: "As if it knows nothing, because it does. State the goal, the constraints, the exact deliverable format, where to write output, and any facts from earlier work it needs — subagents do not share the coordinator's conversation. Brief precisely the first time: launching, waiting, and re-briefing costs a whole extra round trip per worker." },
      { q: "What does the speedup actually depend on?", a: "The critical path through the dependency graph, not the number of workers. With eight nodes in a chain, twenty workers give you exactly zero speedup. Compute the critical path first; if it is most of the total work, the graph is the problem and no amount of concurrency fixes it." }
    ]
  },

  code: [
    { lang: "python", label: "Coordinator: plan → schedule → merge", code: "import asyncio, json\n\nasync def orchestrate(task, max_workers=3, max_replans=2):\n    plan = await make_plan(task)          # -> [{id, goal, deps, deliverable}]\n    done, failed, results = set(), {}, {}\n    sem = asyncio.Semaphore(max_workers)  # hard spawn cap: cost lives here\n\n    for _ in range(max_replans + 1):\n        while True:\n            ready = [n for n in plan\n                     if n[\"id\"] not in done and n[\"id\"] not in failed\n                     and set(n[\"deps\"]) <= done]\n            if not ready:\n                break\n            outs = await asyncio.gather(\n                *[run_worker(n, results, sem) for n in ready],\n                return_exceptions=True,\n            )\n            for n, out in zip(ready, outs):\n                if isinstance(out, Exception):\n                    failed[n[\"id\"]] = str(out)\n                else:\n                    results[n[\"id\"]] = out\n                    done.add(n[\"id\"])\n\n        if not failed:\n            break\n        # A failure is DATA. Let the coordinator decide: substitute an\n        # approach, narrow the deliverable, or ship partial results.\n        plan, failed = await replan(task, plan, done, failed), {}\n\n    return await merge(task, results, failed)   # explicit reconciliation" },

    { lang: "python", label: "Briefing a worker (it knows nothing)", code: "async def run_worker(node, results, sem):\n    # A subagent starts with an EMPTY context window. Everything it needs must\n    # be in this message -- it cannot see the coordinator's conversation.\n    upstream = \"\\n\".join(f\"<{d}>{results[d]}</{d}>\" for d in node[\"deps\"])\n    brief = (\n        f\"GOAL: {node['goal']}\\n\"\n        f\"CONTEXT FROM UPSTREAM STEPS:\\n{upstream or '(none)'}\\n\"\n        f\"DELIVERABLE: {node['deliverable']}\\n\"\n        f\"CONSTRAINTS: cite a source url for every factual claim; if a source \"\n        f\"is unreachable, say so explicitly rather than substituting memory.\\n\"\n        f\"WRITE ONLY TO: /out/{node['id']}.md\"       # disjoint write scope\n    )\n    async with sem:\n        return await agent_loop(brief, tools=node.get(\"tools\", READ_ONLY),\n                               max_iters=12)" },

    { lang: "python", label: "Managed Agents: coordinator + roster", code: "# multiagent is a TOP-LEVEL field on the agent, not a tools[] entry.\ncoordinator = client.beta.agents.create(\n    name=\"Research lead\",\n    model=\"claude-opus-5\",\n    system=(\n        \"You coordinate research. Delegate independent vendor research to the \"\n        \"researcher; do NOT spawn a subagent for work you could finish in a \"\n        \"few tool calls, and never use one to verify your own output. \"\n        \"Never run more than 4 workers concurrently.\"\n    ),\n    tools=[{\"type\": \"agent_toolset_20260401\"}],\n    multiagent={\n        \"type\": \"coordinator\",\n        \"agents\": [researcher.id,                              # latest version\n                   {\"type\": \"agent\", \"id\": writer.id, \"version\": 4},\n                   {\"type\": \"self\"}],                          # copies of itself\n    },\n)\n\nsession = client.beta.sessions.create(agent=coordinator.id,\n                                      environment_id=env.id)\n\n# Each subagent runs in its own THREAD with its own history and event stream.\nfor thread in client.beta.sessions.threads.list(session.id):\n    print(thread.id, thread.agent.name, thread.status)\n# Depth is capped at one: rostering an agent that itself has a roster is a\n# validation error, not a silently flattened tree." }
  ],

  viz: {
    kind: "svg",
    layout: { aspect: 1.75, maxFrames: 280 },

    params: [
      { key: "workers", label: "Worker agents", type: "int", min: 1, max: 5, default: 3 },
      { key: "failure", label: "Inject failure", type: "enum", options: ["none", "blocked-source", "merge-conflict"], default: "blocked-source" },
      { key: "seed",    label: "Re-roll durations", type: "seed" }
    ],

    frames: function* (params, rng) {
      const NW = params.workers;
      const mode = params.failure;

      const PLAN = [
        { id: "n1", label: "define criteria", layer: 0, slot: 0, deps: [], dur: 2, tok: 900 },
        { id: "n2", label: "research vendor A", layer: 1, slot: 0, deps: ["n1"], dur: 4, tok: 5200 },
        { id: "n3", label: "research vendor B", layer: 1, slot: 1, deps: ["n1"], dur: 4, tok: 5100 },
        { id: "n4", label: "research vendor C", layer: 1, slot: 2, deps: ["n1"], dur: 3, tok: 4700 },
        { id: "n5", label: "pricing table", layer: 2, slot: 0, deps: ["n2", "n3", "n4"], dur: 2, tok: 2100 },
        { id: "n6", label: "risk section", layer: 2, slot: 1, deps: ["n2", "n3", "n4"], dur: 3, tok: 2400 },
        { id: "n7", label: "write brief", layer: 3, slot: 0, deps: ["n5", "n6"], dur: 3, tok: 3300 },
        { id: "n8", label: "verify citations", layer: 4, slot: 0, deps: ["n7"], dur: 2, tok: 1400 }
      ];

      let nodes = [];
      let edges = [];
      let runs = [];
      let t = 0, tokens = 0, replans = 0, note = "";

      const snap = (extra) => Object.assign({
        nodes: nodes.map((n) => ({
          id: n.id, label: n.label, layer: n.layer, slot: n.slot,
          deps: n.deps.slice(), status: n.status, worker: n.worker,
          start: n.start, end: n.end, tok: n.tok
        })),
        edges: edges.map((e) => e.slice()),
        runs: runs.map((r) => ({ w: r.w, id: r.id, start: r.start, end: r.end, status: r.status })),
        nw: NW, t, tokens, replans, note, cur: null, maxT: 18
      }, extra || {});

      yield {
        label: `Task: "produce a competitive brief on three vendors." One agent would do this sequentially. A coordinator first decides whether it decomposes into independent work at all — that decision is the whole design.`,
        phase: "init",
        state: snap()
      };

      // ---- planning ------------------------------------------------------
      for (let i = 0; i < PLAN.length; i++) {
        const p = PLAN[i];
        nodes = nodes.concat([{
          id: p.id, label: p.label, layer: p.layer, slot: p.slot, deps: p.deps.slice(),
          dur: p.dur, tok: p.tok, status: "pending", worker: -1, start: -1, end: -1
        }]);
        edges = edges.concat(p.deps.map((d) => [d, p.id]));
        yield {
          label: p.deps.length === 0
            ? `Plan node \`${p.id}\` — ${p.label}. No dependencies, so it can start immediately.`
            : `Plan node \`${p.id}\` — ${p.label}, depends on ${p.deps.map((d) => "`" + d + "`").join(", ")}. Dependencies, not ordering preferences: these are the edges that bound your speedup.`,
          phase: "plan",
          state: snap({ cur: p.id })
        };
      }

      const critical = 2 + 4 + 3 + 3 + 2;
      const serial = PLAN.reduce((a, p) => a + p.dur, 0);
      yield {
        label: `Graph complete: ${PLAN.length} nodes, critical path ${critical} ticks against ${serial} ticks of total work. The critical path — not the worker count — caps the speedup. Twenty workers on a chain buy you nothing.`,
        phase: "plan",
        state: snap({ note: `critical path ${critical} · serial ${serial}` })
      };

      // ---- execution -----------------------------------------------------
      const workers = [];
      for (let i = 0; i < NW; i++) workers.push({ id: i, free: 0, node: null });

      const byId = (id) => nodes.filter((n) => n.id === id)[0];
      const setStatus = (id, patch) => {
        nodes = nodes.map((n) => (n.id === id ? Object.assign({}, n, patch) : n));
      };

      let guard = 0;
      let injected = false;

      while (guard++ < 120) {
        const pend = nodes.filter((n) => n.status === "pending" || n.status === "ready");
        const running = nodes.filter((n) => n.status === "running");
        if (!pend.length && !running.length) break;

        // dispatch every ready node onto a free worker
        let dispatched = false;
        for (const n of nodes) {
          if (n.status !== "pending") continue;
          const ok = n.deps.every((d) => {
            const dn = byId(d);
            return dn && dn.status === "done";
          });
          if (!ok) continue;
          const w = workers.filter((x) => x.node === null)[0];
          if (!w) break;

          const dur = Math.max(1, n.dur + (rng() < 0.3 ? 1 : 0));
          w.node = n.id;
          w.free = t + dur;
          setStatus(n.id, { status: "running", worker: w.id, start: t, end: t + dur });
          runs = runs.concat([{ w: w.id, id: n.id, start: t, end: t + dur, status: "running" }]);
          tokens += n.tok;
          dispatched = true;

          const busy = workers.filter((x) => x.node !== null).length;
          yield {
            label: `t=${t}: dispatch \`${n.id}\` to worker ${w.id + 1} (${busy}/${NW} busy). The worker starts with an EMPTY context window — everything it needs is in the brief the coordinator writes, and it costs ~${n.tok} tokens to establish.`,
            phase: "dispatch",
            state: snap({ cur: n.id, note: `${busy}/${NW} workers busy` })
          };
        }

        if (!dispatched && !running.length) {
          // deadlock (all remaining nodes blocked by a failure)
          break;
        }

        // advance time to the next completion
        const active = workers.filter((x) => x.node !== null);
        if (!active.length) break;
        const next = Math.min.apply(null, active.map((x) => x.free));
        t = next;

        for (const w of active) {
          if (w.free !== t) continue;
          const id = w.node;
          w.node = null;

          const fail = mode === "blocked-source" && id === "n3" && !injected;
          if (fail) {
            injected = true;
            setStatus(id, { status: "failed" });
            runs = runs.map((r) => (r.id === id ? Object.assign({}, r, { status: "failed" }) : r));
            yield {
              label: `t=${t}: \`n3\` FAILS — vendor B's pricing page is behind a login the worker cannot pass. Everything downstream (\`n5\`, \`n6\`, \`n7\`, \`n8\`) is now blocked, so this is not a node-level problem any more.`,
              phase: "fail",
              state: snap({ cur: id, note: "n3 failed — downstream blocked" })
            };
            yield {
              label: `The coordinator treats the failure as data, not an exception. Retrying the identical call is the classic infinite loop; instead it replans — substitute a source, narrow the deliverable, or ship partial results.`,
              phase: "replan",
              state: snap({ cur: id, note: "replanning" })
            };
            replans++;
            nodes = nodes.concat([{
              id: "n3b", label: "vendor B from filings", layer: 1, slot: 3,
              deps: ["n1"], dur: 3, tok: 3800, status: "pending", worker: -1, start: -1, end: -1
            }]);
            edges = edges.concat([["n1", "n3b"], ["n3b", "n5"], ["n3b", "n6"]]);
            nodes = nodes.map((n) =>
              (n.id === "n5" || n.id === "n6")
                ? Object.assign({}, n, { deps: n.deps.filter((d) => d !== "n3").concat(["n3b"]) })
                : n);
            yield {
              label: `Replan: \`n3b\` substitutes public filings for the blocked page, and \`n5\`/\`n6\` are rewired to depend on it instead of \`n3\`. The rest of the graph is untouched — only the failed subtree is re-run.`,
              phase: "replan",
              state: snap({ cur: "n3b", note: "n3 → n3b substituted" })
            };
            continue;
          }

          setStatus(id, { status: "done" });
          runs = runs.map((r) => (r.id === id && r.status === "running" ? Object.assign({}, r, { status: "done" }) : r));
          const unlocked = nodes.filter((n) =>
            n.status === "pending" && n.deps.indexOf(id) >= 0 &&
            n.deps.every((d) => { const dn = byId(d); return dn && dn.status === "done"; })
          );
          yield {
            label: unlocked.length
              ? `t=${t}: \`${id}\` done — unlocks ${unlocked.map((u) => "`" + u.id + "`").join(", ")}. Its report lands in the coordinator's window, where it will be re-sent on every subsequent coordinator turn.`
              : `t=${t}: \`${id}\` done. Its dependents still wait on siblings — a fan-in is only as fast as its slowest branch.`,
            phase: "complete",
            state: snap({ cur: id })
          };
        }
      }

      // ---- merge ---------------------------------------------------------
      if (mode === "merge-conflict") {
        yield {
          label: `Merge: workers on \`n5\` and \`n6\` both wrote a figure for vendor A's enterprise tier, and they disagree — $18k vs $22k. Concatenating the reports would publish both.`,
          phase: "conflict",
          state: snap({ note: "conflicting figures from two workers" })
        };
        yield {
          label: `Because every worker was required to return a citation, the coordinator can adjudicate instead of guessing: keep the figure whose source is the vendor's own price list, and note the discrepancy. Disjoint write scopes prevent the file-level version of this entirely.`,
          phase: "conflict",
          state: snap({ note: "adjudicated by citation" })
        };
      }

      const singleAgent = Math.round(tokens * 0.42);
      yield {
        label: `Done in ${t} ticks with ${NW} worker${NW === 1 ? "" : "s"} (serial would be ${serial}) after ${replans} replan${replans === 1 ? "" : "s"}. Cost ≈ ${tokens} tokens against ≈ ${singleAgent} for one sequential agent — you bought wall-clock time and context isolation with roughly ${(tokens / singleAgent).toFixed(1)}× the tokens.`,
        phase: "done",
        state: snap({ note: `${t} ticks · ${tokens} tokens` })
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
      const statusColor = (s) =>
        s === "done" ? C.viz3 :
        s === "running" ? C.viz1 :
        s === "failed" ? C.viz8 : C.surface2;

      // ---------------- header ---------------------------------------------
      root.appendChild(mk("text", { x: 20, y: 24, fill: C.text, "font-family": env.font.base, "font-size": 14 },
        "Planner → DAG → parallel workers → merge"));
      root.appendChild(mk("text", { x: 20, y: 42, fill: C.muted, "font-family": env.font.mono, "font-size": 11 },
        "t=" + S.t + "   ·   " + S.nw + " workers   ·   " + S.tokens + " tokens   ·   " +
        S.replans + " replan" + (S.replans === 1 ? "" : "s")));
      if (S.note) {
        root.appendChild(mk("text", {
          x: W - 20, y: 42, "text-anchor": "end",
          fill: frame.phase === "fail" ? C.danger : C.warn,
          "font-family": env.font.base, "font-size": 11
        }, clip(S.note, 52)));
      }

      // ---------------- DAG -------------------------------------------------
      const gX = 20, gY = 58;
      const gW = W - 40, gH = (H - gY - 20) * 0.56;
      root.appendChild(mk("rect", { x: gX, y: gY, width: gW, height: gH, rx: 8, fill: C.surface, stroke: C.border }));

      const nLayers = 5;
      const colW = (gW - 40) / nLayers;
      const nodeW = Math.min(colW - 16, 132), nodeH = 34;
      const pos = {};
      const maxSlot = {};
      for (const n of S.nodes) maxSlot[n.layer] = Math.max(maxSlot[n.layer] || 0, n.slot);
      for (const n of S.nodes) {
        const cx = gX + 20 + n.layer * colW + colW / 2;
        const count = (maxSlot[n.layer] || 0) + 1;
        const band = (gH - 30) / Math.max(1, count);
        const cy = gY + 20 + n.slot * band + band / 2;
        pos[n.id] = { x: cx, y: cy };
      }

      // edges
      for (const e of S.edges) {
        const a = pos[e[0]], b = pos[e[1]];
        if (!a || !b) continue;
        const from = S.nodes.filter((n) => n.id === e[0])[0];
        const live = from && from.status === "done";
        const mx = (a.x + b.x) / 2;
        root.appendChild(mk("path", {
          d: "M " + (a.x + nodeW / 2) + " " + a.y +
             " C " + mx + " " + a.y + ", " + mx + " " + b.y + ", " + (b.x - nodeW / 2) + " " + b.y,
          fill: "none", stroke: live ? C.viz3 : C.grid, "stroke-width": live ? 2 : 1.2,
          opacity: live ? 0.9 : 0.6
        }));
      }

      // nodes
      for (const n of S.nodes) {
        const p = pos[n.id];
        const isCur = n.id === S.cur;
        root.appendChild(mk("rect", {
          x: p.x - nodeW / 2, y: p.y - nodeH / 2, width: nodeW, height: nodeH, rx: 6,
          fill: statusColor(n.status),
          stroke: isCur ? C.text : (n.status === "failed" ? C.danger : C.border),
          "stroke-width": isCur ? 2 : 1
        }));
        const dark = n.status === "pending";
        root.appendChild(mk("text", {
          x: p.x, y: p.y - 2, "text-anchor": "middle",
          fill: dark ? C.text2 : C.surface, "font-family": env.font.mono, "font-size": 9
        }, n.id));
        root.appendChild(mk("text", {
          x: p.x, y: p.y + 10, "text-anchor": "middle",
          fill: dark ? C.muted : C.surface, "font-family": env.font.base, "font-size": 8.5
        }, clip(n.label, Math.floor(nodeW / 4.6))));
      }

      // ---------------- worker swimlanes -------------------------------------
      const sY = gY + gH + 12;
      const sH = H - sY - 16;
      root.appendChild(mk("rect", { x: gX, y: sY, width: gW, height: sH, rx: 8, fill: C.surface, stroke: C.border }));

      const labW = 92;
      const trackX = gX + labW, trackW = gW - labW - 16;
      const laneH = Math.min(28, (sH - 26) / Math.max(1, S.nw));
      const tick = trackW / S.maxT;

      // time grid
      for (let i = 0; i <= S.maxT; i += 2) {
        root.appendChild(mk("line", {
          x1: trackX + i * tick, y1: sY + 20, x2: trackX + i * tick, y2: sY + sH - 6,
          stroke: C.grid, "stroke-width": 1
        }));
        root.appendChild(mk("text", {
          x: trackX + i * tick, y: sY + 14, "text-anchor": "middle",
          fill: C.muted, "font-family": env.font.mono, "font-size": 8
        }, String(i)));
      }
      // now marker
      root.appendChild(mk("line", {
        x1: trackX + S.t * tick, y1: sY + 18, x2: trackX + S.t * tick, y2: sY + sH - 6,
        stroke: C.viz2, "stroke-width": 2
      }));

      for (let w = 0; w < S.nw; w++) {
        const y = sY + 22 + w * laneH;
        root.appendChild(mk("text", {
          x: gX + 12, y: y + laneH * 0.62, fill: C.text2, "font-family": env.font.base, "font-size": 10
        }, "worker " + (w + 1)));
        root.appendChild(mk("line", {
          x1: trackX, y1: y + laneH - 2, x2: trackX + trackW, y2: y + laneH - 2,
          stroke: C.grid, "stroke-width": 1
        }));
        for (const r of S.runs) {
          if (r.w !== w) continue;
          const x0 = trackX + r.start * tick;
          const x1 = trackX + Math.min(S.maxT, r.end) * tick;
          root.appendChild(mk("rect", {
            x: x0 + 1, y: y + 2, width: Math.max(4, x1 - x0 - 2), height: laneH - 8, rx: 3,
            fill: r.status === "failed" ? C.viz8 : r.status === "done" ? C.viz3 : C.viz1,
            opacity: r.status === "running" ? 0.9 : 0.8
          }));
          if (x1 - x0 > 34) {
            root.appendChild(mk("text", {
              x: x0 + 6, y: y + laneH * 0.52,
              fill: C.surface, "font-family": env.font.mono, "font-size": 8.5
            }, clip(r.id, Math.floor((x1 - x0) / 5.2))));
          }
        }
      }

      // legend
      const leg = [["pending", C.surface2], ["running", C.viz1], ["done", C.viz3], ["failed", C.viz8]];
      let lx = trackX;
      for (const [name, col] of leg) {
        root.appendChild(mk("rect", { x: lx, y: sY + sH - 12, width: 8, height: 8, rx: 2, fill: col }));
        root.appendChild(mk("text", {
          x: lx + 12, y: sY + sH - 4, fill: C.muted, "font-family": env.font.base, "font-size": 9
        }, name));
        lx += 26 + name.length * 5.2;
      }
    }
  },

  drill: {
    cards: [
      { q: "What do subagents share?", a: "The filesystem, if any — never conversation context. Each worker starts with an empty window and only what the coordinator wrote in its brief. Under-briefing is the top cause of bad subagent output, and it masquerades as model failure.", tags: ["context"] },
      { q: "Why is multi-agent several times more expensive than one agent?", a: "Every worker re-establishes its own context, re-explores, and writes a report the coordinator then pays to read — on every subsequent coordinator turn. You are buying wall-clock time and context isolation with tokens.", tags: ["cost"] },
      { q: "What caps the speedup from adding workers?", a: "The critical path through the dependency DAG. Eight nodes in a chain get zero speedup from twenty workers. Compute the critical path before choosing a worker count.", tags: ["parallelism"] },
      { q: "A worker fails. What should the coordinator do?", a: "Treat it as data: retry once for a transient failure, then replan — substitute an approach, rewire the dependents, narrow the deliverable, or ship partial results. Repeating an identical failing call is the classic infinite loop.", tags: ["failure"] },
      { q: "How deep should delegation go, and why?", a: "One level. Managed Agents rejects a rostered agent that itself has a roster rather than flattening it. Deeper trees make cost, latency and failure attribution unreasonable, and rarely add capability a wider first level would not.", tags: ["design"] },
      { q: "How do you prevent two workers clobbering the same output?", a: "Disjoint write scopes per worker, parallel branches on non-overlapping resources, and a single writer node when overlap is unavoidable. The coordinator should reconcile explicitly using per-claim citations, never concatenate reports.", tags: ["merge"] },
      { q: "Besides speed, why delegate at all?", a: "Context isolation. A worker that reads 200KB of logs and returns a 500-token finding keeps that 200KB out of the coordinator's window entirely. That is often the main reason, not parallelism.", tags: ["design"] },
      { q: "What is the model-version trap with subagent prompting?", a: "Claude Opus 4.8 under-reached for subagents and needed 'delegate more' guidance; Claude Opus 5 delegates readily and needs an explicit cap. Guidance carried across a migration can be exactly backwards — treat delegation prompting as a per-model tuning item.", tags: ["migration"] }
    ],
    sixtySecond: [
      "Explain when multi-agent orchestration beats a single agent, what it costs, and what caps the speedup.",
      "Walk through what a coordinator does when one node of its plan fails, and why merging is the bug-prone step."
    ]
  }
};
