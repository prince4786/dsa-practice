export default {
  id: "sampling",
  track: "agents",
  title: "Next-Token Sampling",
  difficulty: 1,
  minutes: 13,
  tags: ["sampling", "temperature", "top-p", "decoding", "determinism"],

  explainer: [
    { type: "p", text: "When an AI model generates text, it is not writing whole sentences at once. It is picking one small chunk of text — one token — at a time, over and over, each new token chosen based on everything written so far. This lesson is about exactly how that one-token-at-a-time choice gets made, and what all those \"creativity\" and \"randomness\" settings you may have seen in AI tools (temperature, top-p, top-k) actually do under the hood. The short version: the model itself does not add any randomness. Every bit of randomness in the output comes from a separate step, applied after the model has finished thinking, called sampling." },
    { type: "p", text: "Here is what happens at each step. The model's internal calculation ends by producing one long list of numbers — one number for every possible token in its vocabulary (tens of thousands of them) — where a higher number means the model thinks that token is a more likely next choice. These raw, unprocessed numbers are called **logits**. A step called `softmax` turns that list of raw numbers into an actual probability distribution: a list of percentages that all add up to 100%. Only after that conversion does anything random happen — a token gets drawn from that distribution, roughly like drawing a numbered ball from a bag where more likely tokens have more balls in the bag. Everything people casually call \"creativity settings\" — temperature, top-p, top-k — is just extra processing applied to that probability list *before* the ball gets drawn." },

    { type: "h3", text: "The three classic knobs, and the order they apply in" },
    { type: "list", items: [
      "**Temperature (`T`)** reshapes the whole probability list before a token is drawn, by dividing the raw logits by `T` before the softmax step. A `T` below 1 makes the model's favorite tokens even more dominant (the rich get richer); a `T` above 1 flattens the distribution out, making unlikely tokens relatively more competitive; `T` approaching 0 collapses everything onto the single most likely token every time — no randomness at all. Temperature never removes a token from consideration; it only reshapes how likely each one is.",
      "**Top-k** is a blunt cutoff: keep only the `k` tokens with the highest probability, throw the rest away completely, and rescale what remains back up to 100%. The problem is that `k` is a fixed number regardless of how confident the model actually is at that moment — `k=40` throws away 39 pointless options when the model is 99% sure of the answer, but might cut off a real, sensible alternative when the model is genuinely torn between many options.",
      "**Top-p, also called nucleus sampling,** fixes that problem by being adaptive instead of fixed. Instead of always keeping a fixed count of tokens, it keeps the smallest group of top tokens whose probabilities add up to at least `p` (for example, 90%), then throws the rest away. When the model is very confident, that might be just one token. When the model is uncertain, it might keep sixty. This adaptiveness is why top-p has largely replaced top-k as the more sensible default."
    ]},
    { type: "callout", tone: "pitfall", text: "Temperature is applied to the raw, pre-softmax logits, not to the final probabilities — this matters because it means temperature is a mathematically different kind of adjustment (technically, a power transform) than a simple linear scale-up or scale-down would be. In practice, this means a token that started out 100 times less likely than the top choice stays wildly less likely even at a fairly high temperature like 1.5 — the effect only opens up noticeably once temperature climbs past roughly 2." },

    { type: "h3", text: "These three knobs no longer exist on current Claude models" },
    { type: "p", text: "This is important and easy to miss if you learned about `temperature`, `top_p`, and `top_k` from older tutorials: as of this writing, sending any of those three parameters to Claude Opus 5, Claude Fable 5, Claude Sonnet 5, Opus 4.8, or Opus 4.7 causes the request to fail outright with an HTTP error (a \"400 Bad Request\"). They were simply removed. Instead, you steer the model's behavior through what you write in the prompt itself, and you can control how much effort the model puts into a request with a separate setting, `output_config.effort`. If you are working on code that was written for an older model and still sets a temperature, it will need to be updated. Understanding *why* those knobs used to exist — and what replaces each use case — matters more for an interview than knowing their old syntax." },
    { type: "list", items: [
      "**If your goal was determinism** — getting the exact same output every time — setting `temperature=0` on an older model never actually guaranteed that anyway. Behind the scenes, factors like how requests get batched together on the server and the order floating-point math gets carried out can make two runs differ even at temperature zero. If you genuinely need a fixed, predictable output shape (say, always valid JSON with the same fields), the modern fix is structured outputs (`output_config.format`), which enforces a schema directly rather than hoping a low temperature keeps things consistent.",
      "**If your goal was variety** — getting genuinely different answers on different attempts — simply asking for it in the prompt works better than cranking up a randomness knob ever did. A prompt like *\"propose four distinct directions, then pick one\"* produces real, structural variety, whereas raising temperature mostly just shuffles word choice around the same underlying idea.",
      "**If your goal was forcing one specific answer out of a fixed set** — say, always one of three category labels — the modern approach is to define a tool whose parameter is restricted to an `enum` (an explicit fixed list of allowed values), or to use strict structured output. You are constraining the shape of the answer directly, rather than hoping the sampler happens to land on the right token."
    ]},

    { type: "h3", text: "Why picking tokens one at a time is not the same as searching for the best sentence" },
    { type: "p", text: "The way models generate text — sampling one token at a time and never going back — is fundamentally different from an approach called beam search, which is worth knowing about for contrast. Once a token has been drawn under sampling, it is committed; the model can never un-write it and try again, so a single unlucky, low-probability token can steer the entire rest of the response down a worse path. Beam search instead keeps several different partial sentences alive simultaneously and compares their overall likelihood before choosing — this makes it better for tasks like machine translation, where there is one roughly correct answer to converge toward, but worse for open-ended writing, where the highest-probability continuation tends to be bland and repetitive rather than interesting. Inside an AI agent that calls tools, this same one-token-at-a-time risk shows up in a more concrete way: if the model is generating a structured tool call (essentially a small chunk of JSON), one unlucky token can make that JSON invalid, and your code has to detect the broken call and ask the model to retry." },
    { type: "callout", tone: "tip", text: "When comparing how likely two different multi-token sequences are, always work with log-probabilities (the logarithm of each probability) added together, rather than multiplying the raw probabilities themselves. Multiplying forty probabilities that are each less than 1 quickly produces a number so small that a computer's standard number format rounds it down to exactly zero, destroying any ability to compare sequences. Summing the logarithms avoids this problem entirely. If you ever hear \"just multiply the probabilities along the path\" as an answer, that is the follow-up question waiting to be asked." }
  ],

  glossary: [
    { term: "Logits", plain: "The model's raw, unprocessed scores for every possible next token, before they are converted into percentages. A higher logit means the model favors that token more." },
    { term: "Softmax", plain: "The math step that converts a list of raw logit scores into an actual probability distribution — a list of percentages that add up to 100%." },
    { term: "Sampling", plain: "The step where the model actually picks one token, at random, from the probability distribution — more likely tokens are more likely to be picked, but it is not always the single most likely one." },
    { term: "Temperature", plain: "A setting that reshapes the whole probability distribution before a token is picked. Low temperature makes the model stick close to its top choice; high temperature spreads its bets more widely." },
    { term: "Top-k sampling", plain: "A rule that only allows the k tokens with the highest probability to be considered, discarding everything else, regardless of how confident the model actually is." },
    { term: "Top-p / nucleus sampling", plain: "A rule that keeps only the smallest group of top tokens whose combined probability reaches a target percentage p, so the number of tokens considered adapts to how confident the model is." },
    { term: "Greedy decoding", plain: "Always picking the single most likely next token with no randomness at all — what you get when temperature is set to zero." },
    { term: "Beam search", plain: "An alternative to one-token-at-a-time sampling that tracks several candidate sentences at once and picks the overall best one at the end. Common in translation, rarely used for open-ended chat." },
    { term: "Structured outputs (output_config.format)", plain: "A Claude API feature that forces a model's reply to follow an exact schema (for example, valid JSON with specific fields), instead of hoping the model's word choices happen to come out in the right shape." },
    { term: "Strict tool use", plain: "A setting on a tool definition that guarantees the arguments the model sends for that tool will exactly match the tool's schema, eliminating malformed tool calls." },
    { term: "Log-probability", plain: "The logarithm of a probability, used instead of the raw probability when comparing how likely a whole sequence of tokens is, because multiplying many raw probabilities together quickly rounds down to zero on a computer." },
    { term: "output_config.effort", plain: "A setting on current Claude models that controls how much reasoning and computation the model puts into a request, replacing the older idea of a fixed 'thinking budget' in tokens." }
  ],

  complexity: {
    rows: [
      { operation: "Softmax over vocabulary", time: "O(V)", space: "O(V)", note: "V ≈ 100k–200k for a modern tokenizer" },
      { operation: "Top-k filter", time: "O(V log k)", space: "O(k)", note: "partial heap select, not a full sort" },
      { operation: "Top-p filter", time: "O(V log V)", space: "O(V)", note: "needs a sort to compute the cumulative mass" },
      { operation: "Generate n tokens", time: "n forward passes", space: "O(context) KV cache", note: "decoding is sequential — this is why output costs 5× input" }
    ]
  },

  interview: {
    whyAsked: "It tests whether you understand that the model outputs a distribution and your code chooses. Candidates who say 'temperature makes it more creative' get the follow-up; candidates who can state the order of operations, explain why top-p is adaptive where top-k is not, and note that the parameters are removed on current Claude models are visibly operating at a different level.",
    followUps: [
      { q: "Walk me through temperature, top-k and top-p in the order they are applied.", a: "Logits are divided by temperature, softmaxed into probabilities. Top-k then keeps the k highest and zeroes the rest. Top-p keeps the smallest prefix of the sorted distribution whose cumulative mass reaches p. The survivors are renormalized and one token is drawn. Order matters: applying top-p before temperature would filter a distribution you are about to reshape." },
      { q: "Why did top-p largely replace top-k?", a: "Top-k is a fixed-size cut applied to a distribution whose entropy varies wildly per step. After 'The capital of France is', the model is ~99% sure and k=40 admits 39 junk tokens. At a genuinely open step, k=40 may truncate real alternatives. Top-p adapts: it keeps one token when the model is confident and many when it is not." },
      { q: "Does `temperature=0` give reproducible output?", a: "Not reliably. It makes the sampler deterministic — argmax — but the forward pass itself is not bit-exact: batching, GPU kernel selection and floating-point reduction order all vary, and a tie or near-tie in the logits can flip. If your system needs a stable shape, enforce it with structured outputs or a strict tool schema, not with the sampler." },
      { q: "Current Claude models reject `temperature`. How do you get varied output?", a: "Prompt for it. Ask the model to propose several deliberately distinct directions and then commit to one; that produces genuinely different structure, where a temperature bump mostly perturbs word choice. For controlled variation across runs, vary the input — different framing, different exemplars — rather than the sampler." },
      { q: "Where does sampling randomness actually hurt an agent?", a: "Inside structured output. A single unlucky token in a JSON tool call yields a malformed call the model cannot un-emit, and your executor has to return an error result and let the model retry — costing a full round trip. Strict tool use (`strict: true`) and structured outputs constrain generation so the malformed branch cannot be sampled at all." },
      { q: "Why sum log-probabilities instead of multiplying probabilities?", a: "Probabilities under 1 multiplied 40 times underflow float32 to zero, losing all ranking information. Log-space turns the product into a sum, is numerically stable, and is what beam search compares. You normally also divide by length, since raw cumulative log-prob always prefers shorter sequences." }
    ]
  },

  code: [
    { lang: "python", label: "The sampler, explicitly", code: "import numpy as np\n\ndef sample(logits, temperature=1.0, top_k=0, top_p=1.0, rng=np.random):\n    logits = np.asarray(logits, dtype=np.float64)\n\n    if temperature <= 1e-6:                 # greedy: no randomness at all\n        return int(logits.argmax())\n\n    # 1. temperature reshapes the LOGITS, before softmax\n    z = logits / temperature\n    z -= z.max()                            # numerical stability\n    p = np.exp(z); p /= p.sum()\n\n    order = np.argsort(-p)                  # descending\n\n    # 2. top-k: fixed-size cut\n    if top_k and top_k < len(p):\n        drop = order[top_k:]\n        p[drop] = 0.0\n\n    # 3. top-p: adaptive cut on the cumulative mass\n    if top_p < 1.0:\n        srt = order[p[order] > 0]\n        cum = np.cumsum(p[srt])\n        keep = int(np.searchsorted(cum, top_p) + 1)   # always keep >= 1\n        p[srt[keep:]] = 0.0\n\n    p /= p.sum()                            # 4. renormalize, then draw\n    return int(rng.choice(len(p), p=p))" },

    { lang: "python", label: "What you use instead on Claude Opus 5", code: "# temperature / top_p / top_k return 400 on Opus 5, Fable 5, Sonnet 5,\n# Opus 4.8 and 4.7. Constrain the OUTPUT SHAPE instead of the sampler.\nresp = client.messages.create(\n    model=\"claude-opus-5\",\n    max_tokens=16000,\n    output_config={\n        \"effort\": \"medium\",                 # the real cost/thoroughness dial\n        \"format\": {\n            \"type\": \"json_schema\",\n            \"schema\": {\n                \"type\": \"object\",\n                \"properties\": {\n                    \"sentiment\": {\"type\": \"string\",\n                                  \"enum\": [\"positive\", \"neutral\", \"negative\"]},\n                    \"confidence\": {\"type\": \"number\"},\n                },\n                \"required\": [\"sentiment\", \"confidence\"],\n                \"additionalProperties\": False,\n            },\n        },\n    },\n    messages=[{\"role\": \"user\", \"content\": review}],\n)\n# The label is now guaranteed to be one of three strings — no sampler tuning,\n# no regex, no retry-on-parse loop." },

    { lang: "javascript", label: "Nucleus sampling in JS", code: "function topP(probs, p) {\n  const idx = probs.map((v, i) => i).sort((a, b) => probs[b] - probs[a]);\n  let cum = 0, keep = [];\n  for (const i of idx) {\n    keep.push(i);\n    cum += probs[i];\n    if (cum >= p) break;        // smallest prefix reaching p; >= 1 token always\n  }\n  const mass = keep.reduce((s, i) => s + probs[i], 0);\n  const out = new Array(probs.length).fill(0);\n  for (const i of keep) out[i] = probs[i] / mass;   // renormalize\n  return out;\n}" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 260 },

    params: [
      { key: "temp",  label: "Temperature ×100", type: "int", min: 0, max: 200, default: 100 },
      { key: "topk",  label: "Top-k",            type: "int", min: 1, max: 7,   default: 7 },
      { key: "topp",  label: "Top-p ×100",       type: "int", min: 10, max: 100, default: 100 },
      { key: "seed",  label: "Re-roll",          type: "seed" }
    ],

    frames: function* (params, rng) {
      const T = params.temp / 100;
      const K = params.topk;
      const P = params.topp / 100;

      const LM = {
        "<start>": [["The", 0.40], ["A", 0.16], ["Every", 0.13], ["Each", 0.11], ["Language", 0.09], ["Sampling", 0.06], ["Text", 0.05]],
        "The":     [["model", 0.34], ["decoder", 0.16], ["network", 0.14], ["sampler", 0.12], ["output", 0.10], ["next", 0.08], ["whole", 0.06]],
        "model":   [["samples", 0.30], ["predicts", 0.24], ["outputs", 0.15], ["scores", 0.12], ["emits", 0.11], ["ranks", 0.05], ["weighs", 0.03]],
        "samples": [["one", 0.32], ["a", 0.24], ["from", 0.16], ["exactly", 0.12], ["tokens", 0.09], ["each", 0.07]],
        "predicts":[["a", 0.28], ["one", 0.22], ["the", 0.18], ["each", 0.13], ["every", 0.09], ["its", 0.06], ["only", 0.04]],
        "one":     [["token", 0.44], ["word", 0.18], ["piece", 0.13], ["symbol", 0.10], ["step", 0.09], ["unit", 0.06]],
        "a":       [["single", 0.30], ["token", 0.24], ["new", 0.16], ["fresh", 0.12], ["whole", 0.10], ["word", 0.08]],
        "single":  [["token", 0.48], ["word", 0.19], ["step", 0.13], ["piece", 0.11], ["symbol", 0.09]],
        "token":   [["at", 0.36], ["per", 0.22], ["from", 0.15], ["and", 0.11], ["then", 0.09], ["until", 0.07]],
        "at":      [["a", 0.60], ["each", 0.16], ["every", 0.11], ["this", 0.08], ["most", 0.05]],
        "per":     [["step", 0.50], ["call", 0.18], ["forward", 0.14], ["pass", 0.10], ["token", 0.08]],
        "step":    [[".", 0.56], ["and", 0.16], ["until", 0.12], ["then", 0.09], ["so", 0.07]]
      };
      const FALLBACK = [[".", 0.62], ["and", 0.20], ["then", 0.11], ["so", 0.07]];

      let key = "<start>";
      let text = [];
      let history = [];   // per-step summary, used to build a real final frame
      const MAXSTEPS = 9;

      yield {
        label: `Every step, the model produces one probability distribution over the vocabulary. Temperature=${T.toFixed(2)}, top-k=${K}, top-p=${P.toFixed(2)} reshape it — the model does not know they exist.`,
        phase: "init",
        state: { cands: [], stage: "idle", text: [], step: 0, T, K, P, chosen: -1, cutIdx: -1 }
      };

      for (let step = 0; step < MAXSTEPS; step++) {
        const raw = (LM[key] || FALLBACK).map((c) => ({ tok: c[0], p0: c[1] }));

        // ---- stage 1: raw distribution ---------------------------------
        let cands = raw.map((c) => ({ tok: c.tok, p0: c.p0, p: c.p0, kept: true }));
        const rawTop0 = cands[0].p0;
        const totalCandsThisStep = cands.length;
        const mk = (stage, extra) => Object.assign({
          cands: cands.map((c) => ({ tok: c.tok, p0: c.p0, p: c.p, kept: c.kept })),
          stage, text: text.slice(), step: step + 1, T, K, P, chosen: -1, cutIdx: -1
        }, extra || {});

        yield {
          label: `Step ${step + 1}: raw softmax over the ${cands.length} plausible next tokens. Top candidate \`${cands[0].tok}\` at ${(cands[0].p0 * 100).toFixed(0)}% — the model's honest belief before any sampler runs.`,
          phase: "raw",
          state: mk("raw")
        };

        // ---- stage 2: temperature --------------------------------------
        let tempTopP;
        if (T <= 0.02) {
          const best = cands.reduce((a, b) => (b.p0 > a.p0 ? b : a));
          cands = cands.map((c) => ({ tok: c.tok, p0: c.p0, p: c.tok === best.tok ? 1 : 0, kept: c.tok === best.tok }));
          tempTopP = 1;
          yield {
            label: `T = 0 collapses the distribution onto the argmax: \`${best.tok}\` at 100%. This is greedy decoding — deterministic sampler, but the forward pass is still not bit-exact.`,
            phase: "temp",
            state: mk("temp")
          };
        } else {
          const z = cands.map((c) => Math.pow(c.p0, 1 / T));   // p ∝ exp(log p / T)
          const s = z.reduce((a, b) => a + b, 0);
          cands = cands.map((c, i) => ({ tok: c.tok, p0: c.p0, p: z[i] / s, kept: true }));
          const top = cands[0];
          tempTopP = top.p;
          yield {
            label: T < 1
              ? `T = ${T.toFixed(2)} < 1 sharpens: \`${top.tok}\` climbs ${(top.p0 * 100).toFixed(0)}% → ${(top.p * 100).toFixed(0)}%. Temperature divides the logits, so this is a power transform, not a linear scale.`
              : T > 1
                ? `T = ${T.toFixed(2)} > 1 flattens: \`${top.tok}\` drops ${(top.p0 * 100).toFixed(0)}% → ${(top.p * 100).toFixed(0)}% and the tail lifts. Nothing is removed yet — every token is still reachable.`
                : `T = 1.00 leaves the distribution exactly as the model produced it.`,
            phase: "temp",
            state: mk("temp")
          };
        }

        // ---- stage 3: top-k --------------------------------------------
        const order = cands.map((c, i) => i).sort((a, b) => cands[b].p - cands[a].p);
        if (K < cands.length) {
          const keepSet = {};
          for (let i = 0; i < K; i++) keepSet[order[i]] = true;
          const cut = cands.filter((c, i) => !keepSet[i]).length;
          cands = cands.map((c, i) => ({ tok: c.tok, p0: c.p0, p: keepSet[i] ? c.p : 0, kept: !!keepSet[i] }));
          const mass = cands.reduce((a, c) => a + c.p, 0);
          cands = cands.map((c) => ({ tok: c.tok, p0: c.p0, p: c.p / mass, kept: c.kept }));
          yield {
            label: `Top-k = ${K}: the ${cut} lowest-scoring token${cut === 1 ? " is" : "s are"} zeroed and the survivors renormalized. A fixed-size cut ignores how confident the model actually is at this step.`,
            phase: "topk",
            state: mk("topk", { cutIdx: K })
          };
        } else {
          yield {
            label: `Top-k = ${K} ≥ ${cands.length} candidates, so nothing is cut here. Top-k only bites when the distribution is wider than k.`,
            phase: "topk",
            state: mk("topk")
          };
        }

        // ---- stage 4: top-p --------------------------------------------
        const order2 = cands.map((c, i) => i).sort((a, b) => cands[b].p - cands[a].p);
        let cum = 0, keepN = 0;
        for (const i of order2) {
          if (cands[i].p <= 0) break;
          keepN++;
          cum += cands[i].p;
          if (cum >= P) break;
        }
        keepN = Math.max(1, keepN);
        const keep2 = {};
        for (let i = 0; i < keepN; i++) keep2[order2[i]] = true;
        const dropped = cands.filter((c, i) => c.p > 0 && !keep2[i]).length;
        cands = cands.map((c, i) => ({ tok: c.tok, p0: c.p0, p: keep2[i] ? c.p : 0, kept: !!keep2[i] }));
        const mass2 = cands.reduce((a, c) => a + c.p, 0) || 1;
        cands = cands.map((c) => ({ tok: c.tok, p0: c.p0, p: c.p / mass2, kept: c.kept }));
        const postTopP = Math.max(0, ...cands.map((c) => c.p));
        const keptAfterTopp = cands.filter((c) => c.kept).length;

        yield {
          label: P >= 1
            ? `Top-p = 1.00 keeps everything that survived. The nucleus is the whole distribution.`
            : `Top-p = ${P.toFixed(2)}: the top ${keepN} token${keepN === 1 ? "" : "s"} already cover ${(cum * 100).toFixed(0)}% of the mass, so ${dropped} more ${dropped === 1 ? "is" : "are"} dropped. This cut *adapts* — a confident step keeps 1 token, an ambiguous one keeps many.`,
          phase: "topp",
          state: mk("topp", { cutIdx: keepN })
        };

        // ---- stage 5: draw ---------------------------------------------
        const r = rng();
        let acc = 0, pick = order2[0];
        for (const i of order2) {
          acc += cands[i].p;
          if (r <= acc) { pick = i; break; }
        }
        const tok = cands[pick].tok;
        text = text.concat([tok]);
        history = history.concat([{
          step: step + 1, tok,
          rawTop: rawTop0, tempTop: tempTopP, postTop: postTopP,
          keptTopp: keptAfterTopp, totalCands: totalCandsThisStep,
          drawnProb: cands[pick].p
        }]);
        yield {
          label: `Draw r = ${r.toFixed(3)} → \`${tok}\` (${(cands[pick].p * 100).toFixed(0)}% of the surviving mass). Committed: sampling never revisits a token, so one unlucky draw steers the whole continuation.`,
          phase: "sample",
          focus: [pick],
          state: Object.assign(mk("sample", { chosen: pick }), { text: text.slice() })
        };

        if (tok === ".") break;
        key = tok;
      }

      // ---- a real conclusion: the full sequence plus what temperature/top-p
      // actually did to the distribution across the whole run, not just a
      // "sequence complete" caption over an empty canvas.
      const nSteps = Math.max(1, history.length);
      const avgRaw = history.reduce((a, h) => a + h.rawTop, 0) / nSteps;
      const avgTemp = history.reduce((a, h) => a + h.tempTop, 0) / nSteps;
      const avgPost = history.reduce((a, h) => a + h.postTop, 0) / nSteps;
      const avgKept = history.reduce((a, h) => a + h.keptTopp, 0) / nSteps;
      const avgTotal = history.reduce((a, h) => a + h.totalCands, 0) / nSteps;

      yield {
        label: `Generated: "${text.join(" ").replace(" .", ".")}" over ${text.length} sequential forward passes. Across the run, temperature moved the average top-token share from ${(avgRaw * 100).toFixed(0)}% (raw) to ${(avgTemp * 100).toFixed(0)}% (post-temperature); top-k/top-p then narrowed an average of ${avgTotal.toFixed(1)} candidates down to ${avgKept.toFixed(1)} before every draw, leaving ${(avgPost * 100).toFixed(0)}% average probability on the surviving top token. Re-roll the seed with the same params to see how much of this was the sampler rather than the model.`,
        phase: "done",
        state: {
          cands: [], stage: "done", text: text.slice(), step: text.length, T, K, P, chosen: -1, cutIdx: -1,
          history: history.slice(),
          summary: { avgRaw, avgTemp, avgPost, avgKept, avgTotal, nSteps: history.length }
        }
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const padL = 40, padR = 24, padTop = 96, padBot = 66;
      const plotW = W - padL - padR;
      const plotH = H - padTop - padBot;
      const baseY = padTop + plotH;

      // ---------- header: generated text ---------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.base}`;
      ctx.fillText("generated so far", padL, 24);

      ctx.fillStyle = C.text;
      ctx.font = `16px ${env.font.mono}`;
      let shown = S.text.join(" ").replace(" .", ".");
      const maxChars = Math.floor((W - padL - padR) / 9.6);
      if (shown.length > maxChars) shown = "…" + shown.slice(shown.length - maxChars + 1);
      ctx.fillText(shown || "▏", padL, 46);

      // ---------- param strip --------------------------------------------
      const chips = [
        ["T", S.T.toFixed(2), S.stage === "temp" ? C.viz2 : C.muted],
        ["top-k", String(S.K), S.stage === "topk" ? C.viz2 : C.muted],
        ["top-p", S.P.toFixed(2), S.stage === "topp" ? C.viz2 : C.muted],
        ["step", String(S.step), C.muted]
      ];
      let cx = padL;
      ctx.font = `11px ${env.font.mono}`;
      for (const [k, v, col] of chips) {
        const label = k + " = " + v;
        const w = ctx.measureText(label).width + 16;
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(cx, 60, w, 20, 5); ctx.fill();
        ctx.fillStyle = col;
        ctx.fillText(label, cx + 8, 74);
        cx += w + 8;
      }

      if (!S.cands.length) {
        if (S.stage === "done" && S.history && S.history.length) {
          // A real conclusion: per-step bars (raw top-token share as a ghost
          // outline, the share actually left after the full pipeline as the
          // solid fill) plus the run's aggregate numbers -- not just a
          // "sequence complete" caption over empty space.
          const hist = S.history;
          const n = hist.length;
          const sumTop = padTop + 6, sumH = plotH - 54;
          const slot = plotW / n;
          const bw = Math.min(74, slot * 0.56);

          ctx.textAlign = "left";
          ctx.fillStyle = C.text2;
          ctx.font = `12px ${env.font.base}`;
          ctx.fillText(`run summary — ${n} step${n === 1 ? "" : "s"}, top-token share per step`, padL, sumTop + 2);

          ctx.strokeStyle = C.axis;
          ctx.lineWidth = 1;
          const axisY = sumTop + 18 + sumH;
          ctx.beginPath(); ctx.moveTo(padL, axisY + 0.5); ctx.lineTo(padL + plotW, axisY + 0.5); ctx.stroke();
          ctx.strokeStyle = C.grid;
          ctx.fillStyle = C.muted;
          ctx.font = `9px ${env.font.mono}`;
          ctx.textAlign = "right";
          for (const g of [0.5, 1]) {
            const y = axisY - g * sumH;
            ctx.beginPath(); ctx.moveTo(padL, y + 0.5); ctx.lineTo(padL + plotW, y + 0.5); ctx.stroke();
            ctx.fillText((g * 100).toFixed(0) + "%", padL - 6, y + 3);
          }

          for (let i = 0; i < n; i++) {
            const h = hist[i];
            const x = padL + i * slot + (slot - bw) / 2;

            // ghost = raw top-token share before any sampler ran
            const gh = h.rawTop * sumH;
            ctx.strokeStyle = C.grid;
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.beginPath(); ctx.rect(x, axisY - gh, bw, gh); ctx.stroke();
            ctx.setLineDash([]);

            // solid = top-token share left after temperature + top-k + top-p
            const ph = h.postTop * sumH;
            ctx.fillStyle = h.postTop >= h.rawTop ? C.viz1 : C.viz4;
            ctx.beginPath(); ctx.roundRect(x, axisY - ph, bw, Math.max(1, ph), 3); ctx.fill();

            ctx.textAlign = "center";
            ctx.fillStyle = C.text2;
            ctx.font = `9px ${env.font.mono}`;
            ctx.fillText(`${h.keptTopp}/${h.totalCands} kept`, x + bw / 2, axisY - Math.max(gh, ph) - 6);

            ctx.fillStyle = C.text;
            ctx.font = `11px ${env.font.mono}`;
            ctx.fillText("`" + h.tok + "`", x + bw / 2, axisY + 16);
            ctx.fillStyle = C.muted;
            ctx.font = `9px ${env.font.base}`;
            ctx.fillText("step " + h.step, x + bw / 2, axisY + 29);
          }

          const sm = S.summary || {};
          ctx.textAlign = "left";
          ctx.fillStyle = C.text2;
          ctx.font = `12px ${env.font.base}`;
          ctx.fillText(
            `avg top-token share: raw ${(sm.avgRaw * 100).toFixed(0)}% → post-temperature ${(sm.avgTemp * 100).toFixed(0)}% → after top-k/top-p ${(sm.avgPost * 100).toFixed(0)}%`,
            padL, axisY + 48
          );
          ctx.fillStyle = C.muted;
          ctx.font = `11px ${env.font.mono}`;
          ctx.fillText(
            `nucleus kept ${sm.avgKept.toFixed(1)} of ~${sm.avgTotal.toFixed(1)} candidates per draw on average · T=${S.T.toFixed(2)}  top-k=${S.K}  top-p=${S.P.toFixed(2)}`,
            padL, axisY + 64
          );
          return;
        }
        ctx.fillStyle = C.muted;
        ctx.font = `13px ${env.font.base}`;
        ctx.textAlign = "center";
        ctx.fillText(S.stage === "done" ? "sequence complete" : "waiting for the first forward pass",
          W / 2, padTop + plotH / 2);
        return;
      }

      // ---------- axis ----------------------------------------------------
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(padL, baseY + 0.5); ctx.lineTo(padL + plotW, baseY + 0.5); ctx.stroke();

      ctx.strokeStyle = C.grid;
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.textAlign = "right";
      for (let g = 0; g <= 4; g++) {
        const v = g / 4;
        const y = baseY - v * plotH;
        ctx.beginPath(); ctx.moveTo(padL, y + 0.5); ctx.lineTo(padL + plotW, y + 0.5); ctx.stroke();
        ctx.fillText((v * 100).toFixed(0) + "%", padL - 6, y + 3);
      }

      // ---------- bars ----------------------------------------------------
      const n = S.cands.length;
      const slot = plotW / n;
      const bw = Math.min(64, slot * 0.62);

      for (let i = 0; i < n; i++) {
        const c = S.cands[i];
        const x = padL + i * slot + (slot - bw) / 2;

        // ghost of the original probability
        const gh = c.p0 * plotH;
        ctx.strokeStyle = C.grid;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.rect(x, baseY - gh, bw, gh);
        ctx.stroke();
        ctx.setLineDash([]);

        const h = Math.max(0, c.p) * plotH;
        let fill = C.viz1;
        if (!c.kept) fill = C.surface2;
        else if (i === S.chosen) fill = C.viz6;
        else if (S.stage === "temp") fill = C.viz4;

        ctx.fillStyle = fill;
        ctx.globalAlpha = c.kept ? 1 : 0.5;
        ctx.beginPath();
        ctx.roundRect(x, baseY - h, bw, h, 3);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (i === S.chosen) {
          ctx.strokeStyle = C.text;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.roundRect(x, baseY - h, bw, h, 3); ctx.stroke();
        }

        // probability label
        ctx.textAlign = "center";
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillStyle = c.kept ? C.text2 : C.muted;
        if (c.p > 0.004) ctx.fillText((c.p * 100).toFixed(0) + "%", x + bw / 2, baseY - h - 5);
        else if (!c.kept) ctx.fillText("cut", x + bw / 2, baseY - 5);

        // token label
        ctx.fillStyle = c.kept ? C.text : C.muted;
        ctx.font = `12px ${env.font.mono}`;
        let lbl = c.tok;
        const cw = Math.max(3, Math.floor(slot / 7.6));
        if (lbl.length > cw) lbl = lbl.slice(0, cw - 1) + "…";
        ctx.fillText(lbl, padL + i * slot + slot / 2, baseY + 18);
      }

      // ---------- truncation boundary -------------------------------------
      if (S.cutIdx > 0 && S.cutIdx < n) {
        const bx = padL + S.cutIdx * slot;
        ctx.strokeStyle = C.viz8;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, padTop - 6); ctx.lineTo(bx, baseY + 6); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.viz8;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(S.stage === "topk" ? "top-k cut" : "nucleus edge", bx + 5, padTop + 4);
      }

      // ---------- stage caption -------------------------------------------
      const stageName = {
        raw: "1 · raw softmax", temp: "2 · temperature", topk: "3 · top-k",
        topp: "4 · top-p (nucleus)", sample: "5 · draw", idle: "", done: ""
      }[S.stage] || "";
      ctx.textAlign = "left";
      ctx.fillStyle = C.text2;
      ctx.font = `12px ${env.font.base}`;
      ctx.fillText(stageName, padL, baseY + 42);

      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.base}`;
      ctx.textAlign = "right";
      ctx.fillText("dashed outline = probability the model actually produced", padL + plotW, baseY + 42);
    }
  },

  drill: {
    cards: [
      { q: "In what order are temperature, top-k and top-p applied?", a: "Temperature scales the logits → softmax → top-k keeps the k highest → top-p keeps the smallest prefix reaching cumulative p → renormalize → draw one token.", tags: ["order"] },
      { q: "Why is top-p better than top-k in most cases?", a: "Top-k is a fixed-size cut on a distribution whose entropy varies per step. Top-p adapts to confidence: it keeps one token when the model is sure and many when it is genuinely uncertain.", tags: ["top-p"] },
      { q: "Temperature acts on probabilities or logits?", a: "Logits — `p ∝ exp(logit/T)`, equivalently `p ∝ p_orig^(1/T)`. It is a power transform. T<1 sharpens, T>1 flattens, T→0 is argmax.", tags: ["temperature"] },
      { q: "Does `temperature=0` guarantee identical outputs?", a: "No. It makes the sampler deterministic but not the forward pass — batching, kernel choice and floating-point reduction order can flip a near-tie. Use structured outputs if you need a guaranteed shape.", tags: ["determinism"] },
      { q: "What do current Claude models (Opus 5, Sonnet 5, Opus 4.7+) do with `temperature`?", a: "They reject it with a 400. Sampling parameters were removed. Steer with the prompt and `output_config.effort`; constrain shape with `output_config.format` or `strict: true` tools.", tags: ["api"] },
      { q: "Why sum log-probs instead of multiplying probabilities?", a: "Products of many sub-1 probabilities underflow to zero in float32. Log-space converts the product to a sum and is numerically stable — and you usually length-normalize, since raw cumulative log-prob always favours shorter sequences.", tags: ["numerics"] },
      { q: "How does sampling randomness break a tool-calling agent?", a: "A single unlucky token inside a JSON argument produces a malformed tool call. The model cannot retract it, so the harness must return an error `tool_result` and pay another round trip. Strict tool schemas prevent the bad branch from being sampled at all.", tags: ["agents"] }
    ],
    sixtySecond: [
      "Explain temperature, top-k and top-p: what each does to the distribution, in what order, and why top-p is adaptive.",
      "Explain why 'temperature=0' is not the same as 'reproducible output', and what you would use instead."
    ]
  }
};
