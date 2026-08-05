export default {
  id: "decoding",
  track: "ai",
  title: "Greedy vs Beam Search",
  difficulty: 2,
  minutes: 17,
  tags: ["decoding", "beam-search", "sampling", "generation"],

  explainer: [
    { type: "p", text: "At every single step of generating text, a language model doesn't just hand you one next word — it hands you a full **probability distribution** over its entire vocabulary: a list saying, for every possible next token (roughly, word or word-piece), how likely the model thinks it is to come next, written `P(next token | prefix)` (\"the probability of the next token, given everything generated so far\"). The model's job stops there. **Decoding** is the separate, downstream question of how you actually turn that long sequence of probability distributions — one per step — into one concrete sequence of tokens you show the user. This matters more than it might sound: the underlying model stays completely fixed, yet changing *only* how you decode from it can completely change the character of the output — from bland and repetitive to lively and varied, or from wildly random to precise and literal. Most of the practical control you have over a model's output quality, without retraining anything, lives in these decoding choices." },

    { type: "h3", text: "Why log-probabilities" },
    { type: "p", text: "The overall \"score\" of a whole generated sequence is the probability of every token in it happening in that exact order, which multiplies out to `∏ P(tᵢ | t_<i)` (the product, across every position `i`, of the probability of token `i` given everything before it). The problem: multiply together, say, 200 numbers that are each somewhat below 1, using standard computer number formats (float32), and the result rounds all the way down to exactly 0 — a numerical failure called **underflow**. The standard fix is to work with **logarithms** of the probabilities instead of the probabilities themselves, and add them up: `Σ log P(tᵢ | t_<i)`. Because the logarithm function only ever gets bigger as its input gets bigger (it's *monotone*), ranking sequences by this summed log-probability gives exactly the same ordering as ranking by the true product would — but addition of many small negative numbers stays numerically well-behaved where repeated multiplication of tiny positive ones does not. Every score shown in this lesson's visualiser is one of these cumulative log-probabilities — remember that with log-probabilities, a number *closer to zero* (less negative) means a *more* likely sequence." },

    { type: "h3", text: "Greedy: locally optimal, globally myopic" },
    { type: "p", text: "The simplest possible decoding strategy is **greedy decoding**: at every single step, just take whichever single token currently has the highest probability (this is called taking the **argmax**, \"the input that maximises the output\"), and never reconsider that choice again. It costs `O(steps · |V|)`, where `|V|` is the vocabulary size — cheap, because it's just one lookup per step. But because it can never backtrack, a token that looks like the single best choice *right now* can quietly lead the model into a corner: a region of the sequence space where every remaining continuation is unlikely, even though a slightly different (locally second-best) first choice would have opened up a much better overall sequence. This lesson's visualiser is deliberately built around exactly that trap: greedy picks the single highest-probability first token, and ends up locked into a full sequence that turns out to be roughly 5 times less likely overall than the sequence beam search (described next) manages to find." },

    { type: "h3", text: "Beam search: keep k hypotheses" },
    { type: "list", items: [
      "**Beam search** hedges against greedy's tunnel vision by keeping several candidate sequences alive at once instead of committing to just one. At each step, it takes every one of the `k` sequences currently being tracked (called **beams**, and `k` is called the **beam width**) and extends *each* of them by *every* possible next token in the vocabulary, producing `k·|V|` total candidates. It then scores every candidate by its cumulative log-probability so far and keeps only the best `k` of them, discarding the rest.",
      "This costs `O(steps · k · |V|)` time and `O(k · seq)` memory, where `seq` is the sequence length so far — plus, in a real large language model, `k` separate copies of the KV cache (a store of intermediate computation results, covered in the attention lesson), which is usually the real practical cost when serving beam search at scale.",
      "Beam search is **still not** a guaranteed way of finding the single most likely sequence overall — that would require checking every possible sequence, which is computationally intractable (impossibly expensive). Beam search is only a heuristic (an approximate shortcut), and it genuinely can, and does, throw away the prefix of what would have turned out to be the best overall sequence, early in the search, before it had the chance to prove itself.",
      "**Length normalisation** is essentially mandatory in practice: because every additional token you generate adds one more negative log-probability to the running total, raw cumulative scores mechanically get worse the longer a sequence runs — so without correcting for this, beam search would be strongly biased toward stopping as early as possible. The standard fix divides the cumulative score by `length` raised to a power `α`, typically `α ≈ 0.6–0.7` (known as the GNMT length penalty, after the Google Neural Machine Translation system that popularised it).",
      "Beams that emit a special \"end of sequence\" token (**EOS**) are considered *finished* and set aside; they compete at the very end against still-running beams using each one's length-normalised score."
    ]},

    { type: "callout", tone: "pitfall", text: "Watch the visualiser closely with a beam width of `k=2`: the two surviving beams very often turn out to share the exact same parent sequence, differing only in their very last token or two. Beam search's surviving beams are **not** meaningfully diverse alternatives — they tend to be near-duplicates of each other. That's exactly why techniques like *diverse beam search* (which explicitly penalises beams for looking too similar to each other) and *n-gram blocking* (which forbids repeating a short sequence of tokens already used) exist, and why plain beam search should not be relied on to give you `k` genuinely different candidate answers." },

    { type: "h3", text: "Why beam search is wrong for open-ended text" },
    { type: "p", text: "Beam search is, at its core, a tool for finding a *high-likelihood* sequence — and for open-ended text generation, such as chatting or storytelling, **higher likelihood does not mean better quality**. Real human-written text is not what a language model considers its single most probable continuation: genuine language is full of small surprises, while the mathematically \"most likely\" continuation according to the model tends to be bland, repetitive, and prone to getting stuck looping the same phrase over and over — a well-documented failure mode researchers call **neural text degeneration**. Deliberately maximising probability steers you directly toward that dull, repetitive output. Beam search does work well for tasks where the correct output is tightly *constrained* by the input — translation, summarisation, code completion, speech-to-text transcription — because in those cases the genuinely correct answer really is close to the model's most probable one. For open-ended generation like chat, stories, or brainstorming, practitioners use **sampling** instead (described next), which deliberately introduces some randomness rather than always taking the top choice." },

    { type: "h3", text: "The sampling family" },
    { type: "list", items: [
      "**Temperature** (`T`) — before converting the model's raw output scores (called **logits**) into probabilities via softmax, divide every logit by `T`. As `T` approaches 0, this becomes equivalent to greedy decoding (the top choice dominates completely); as `T` grows above 1, it flattens the distribution, making less-likely tokens relatively more likely to be picked, i.e. more random output. Because this rescaling happens *before* any of the truncation methods below, the order in which you apply temperature versus truncation genuinely changes the result.",
      "**Top-k sampling** — keep only the `k` tokens with the highest probability, rescale their probabilities so they sum to 1 again (**renormalise**), and randomly sample the next token from just that shortlist. Simple, but a single fixed `k` is a poor fit both when the model is very confident (where even `k` might include some genuinely bad options) and when it's very uncertain (where `k` might exclude perfectly reasonable options).",
      "**Top-p sampling** (also called **nucleus sampling**) — instead of a fixed count, keep the smallest possible group of top tokens whose probabilities add up to at least `p` (for example, 90%), renormalise, and sample from that group. Because the size of this group automatically adapts to how confident or uncertain the model is at each individual step, top-p is the more commonly used default over top-k.",
      "**Min-p sampling** — a newer variant that keeps any token whose probability is at least `min_p` times the single highest probability at that step; it achieves a similar adaptive effect to top-p through a different, scale-relative rule.",
      "**Repetition / frequency penalties** — directly subtract a penalty from the logits of tokens that have already appeared in the output so far, making them less likely to be chosen again. This is a blunt, hand-tuned patch for repetitive loops, and pushing it too hard can visibly degrade output quality by avoiding words the text genuinely needed to repeat."
    ]},

    { type: "callout", tone: "tip", text: "Two facts worth stating even if not directly asked: first, greedy decoding is *deterministic given the same prompt* — meaning it always produces the same output for the same input — though setting temperature to exactly 0 in a real production system is not always a perfect guarantee of reproducibility, because batched GPU computations can introduce tiny floating-point differences depending on what else is running alongside your request at the time. Second, **speculative decoding** is a technique for speeding up generation that changes *nothing* about the actual output distribution: a small, fast \"draft\" model proposes several candidate tokens in a row, and the large, slow \"target\" model then checks all of them in a single forward pass, accepting the longest prefix of proposed tokens that agrees with what it would have generated on its own. This produces output statistically identical to running the large model alone, just faster." }
  ],

  glossary: [
    { term: "Decoding", plain: "The process of turning a language model's step-by-step probability outputs into one actual sequence of chosen tokens." },
    { term: "Probability distribution", plain: "A full list of every possible outcome together with how likely each one is, with all the likelihoods adding up to 100%." },
    { term: "Vocabulary (|V|)", plain: "The complete set of distinct tokens a language model can choose from at each generation step." },
    { term: "Log-probability", plain: "The logarithm of a probability; summing log-probabilities across a sequence gives the same ranking as multiplying the raw probabilities, without the numbers shrinking to zero and rounding down to nothing (a computer error called underflow)." },
    { term: "Argmax", plain: "Picking whichever single option has the highest score out of a list of options." },
    { term: "Greedy decoding", plain: "Choosing the single highest-probability token (the argmax) at every step, with no ability to reconsider earlier choices." },
    { term: "Beam search", plain: "A decoding method that tracks several candidate sequences (the number kept is called the beam width, k) at once and keeps extending only the best-scoring ones, instead of committing to a single choice at every step." },
    { term: "Length normalisation", plain: "Dividing a sequence's cumulative score by a function of its length, to stop beam search from unfairly favouring shorter outputs." },
    { term: "EOS (end of sequence)", plain: "A special token a model generates to signal that it has finished producing output." },
    { term: "Neural text degeneration", plain: "A failure mode where always picking the most probable words produces text that is bland, repetitive, or stuck in a loop." },
    { term: "Logits", plain: "The raw, unbounded scores a model produces for each possible next token, before they are converted into probabilities." },
    { term: "Temperature", plain: "A setting that rescales a model's output scores before sampling, making choices more deterministic at low values and more random at high values." },
    { term: "Top-k / top-p (nucleus) sampling", plain: "Sampling methods that first narrow the choice down to a shortlist of likely tokens — a fixed count for top-k, or the smallest group covering a target probability mass for top-p — before randomly picking one." },
    { term: "Speculative decoding", plain: "A speed-up technique where a small model proposes several tokens and a large model verifies them in one pass, producing the exact same output faster." }
  ],

  complexity: {
    rows: [
      { operation: "Greedy decode", time: "O(L·|V|) + L forwards", space: "O(1) beyond the KV cache", note: "argmax per step, no backtracking" },
      { operation: "Beam search (width k)", time: "O(L·k·|V|) + L·k forwards", space: "O(k·L) + k KV caches", note: "batched, so wall-clock ≈ k× memory not k× time" },
      { operation: "Sampling (top-p)", time: "O(L·|V| log|V|)", space: "O(|V|)", note: "the sort dominates per step" },
      { operation: "Exact MAP sequence", time: "O(|V|^L)", space: "—", note: "intractable; beam is a heuristic for it" },
      { operation: "Speculative decoding", time: "≈2–3× fewer big-model steps", space: "+draft model", note: "output distribution unchanged" }
    ]
  },

  interview: {
    whyAsked: "It separates people who have shipped an LLM feature from people who have only called an API. The signal is knowing that decoding is a search problem distinct from the model, being able to state beam search's cost and its length bias, and — the question that actually discriminates — explaining why the highest-likelihood text is not the best text for open-ended generation.",
    followUps: [
      { q: "Is beam search guaranteed to find the most likely sequence?", a: "No. Exact MAP decoding is exponential; beam search is a heuristic that keeps only k partial hypotheses and can discard the prefix of the true best sequence at any step. Increasing k improves the approximation with diminishing returns — and for open-ended text, larger k often makes the output *worse*, which is the giveaway that likelihood is the wrong objective there." },
      { q: "Why does beam search need length normalisation?", a: "Every additional token adds a negative log-prob, so longer sequences always score lower. Without normalisation the beam systematically prefers short outputs and terminates early. Dividing by `length^α` with α around 0.6–0.7 corrects the bias; α is a tuned hyperparameter, not a derived constant." },
      { q: "Why is sampling preferred over beam search for chat?", a: "Because human-like text is not the mode of the distribution. Maximising probability yields bland, repetitive, often looping output — documented as neural text degeneration. Sampling with top-p keeps the output in the high-probability region while preserving the variability that makes text read naturally. Constrained tasks like translation are the exception, where the target is genuinely near the mode." },
      { q: "Top-k vs top-p?", a: "Top-k keeps a fixed number of tokens regardless of the distribution's shape, so it truncates too little when the model is confident and too much when it is uncertain. Top-p keeps a variable number covering probability mass p, so the cut-off adapts per step. Top-p is the usual default; they are sometimes combined." },
      { q: "What does temperature do, exactly?", a: "It divides the logits before the softmax: `softmax(z/T)`. T < 1 sharpens (more deterministic), T > 1 flattens (more random), T → 0 becomes argmax. Because it acts on logits, it changes which tokens fall inside a subsequent top-p nucleus — so temperature is applied before truncation, and the order matters." },
      { q: "How does speculative decoding work and what does it cost you?", a: "A small draft model proposes γ tokens; the large model scores all of them in a single forward pass and accepts the longest prefix consistent with its own distribution, using a rejection-sampling correction. Output is distributed exactly as the big model alone, so quality is unchanged. The cost is extra memory for the draft model and wasted work when acceptance is low." }
    ]
  },

  code: [
    { lang: "python", label: "Greedy and beam search from scratch", code: "import numpy as np\n\ndef greedy(step_fn, start, max_len, eos):\n    \"\"\"step_fn(prefix) -> (tokens, log_probs) for the next position.\"\"\"\n    seq, total = list(start), 0.0\n    for _ in range(max_len):\n        toks, logps = step_fn(seq)\n        i = int(np.argmax(logps))                 # local argmax, no backtracking\n        seq.append(toks[i]); total += logps[i]\n        if toks[i] == eos:\n            break\n    return seq, total\n\ndef beam_search(step_fn, start, max_len, eos, k=4, alpha=0.7):\n    beams = [(list(start), 0.0)]                  # (sequence, cumulative log-prob)\n    finished = []\n    for _ in range(max_len):\n        cands = []\n        for seq, score in beams:\n            toks, logps = step_fn(seq)\n            for t, lp in zip(toks, logps):        # expand ALL beams by ALL tokens\n                cands.append((seq + [t], score + lp))\n        cands.sort(key=lambda c: -c[1])\n        beams = []\n        for seq, score in cands:\n            if seq[-1] == eos:\n                finished.append((seq, score))\n            else:\n                beams.append((seq, score))\n            if len(beams) == k:\n                break\n        if not beams:\n            break\n\n    finished += beams\n    # length normalisation: raw log-probs always favour SHORT sequences\n    norm = lambda s: s[1] / (len(s[0]) ** alpha)\n    return max(finished, key=norm)" },
    { lang: "python", label: "Temperature, top-k, top-p — in the right order", code: "import numpy as np\n\ndef sample_next(logits, temperature=1.0, top_k=0, top_p=0.0, rng=None):\n    rng = rng or np.random.default_rng()\n    logits = np.asarray(logits, dtype=np.float64)\n\n    # 1. temperature acts on LOGITS, before any truncation\n    if temperature <= 0:\n        return int(np.argmax(logits))             # T -> 0 is exactly greedy\n    logits = logits / temperature\n\n    # 2. top-k: keep the k largest logits\n    if top_k > 0:\n        kth = np.partition(logits, -top_k)[-top_k]\n        logits = np.where(logits < kth, -np.inf, logits)\n\n    # 3. softmax\n    z = logits - logits.max()\n    probs = np.exp(z); probs /= probs.sum()\n\n    # 4. top-p (nucleus): smallest prefix with cumulative mass >= p\n    if 0.0 < top_p < 1.0:\n        order = np.argsort(-probs)\n        csum = np.cumsum(probs[order])\n        cut = int(np.searchsorted(csum, top_p) + 1)\n        keep = order[:cut]\n        mask = np.zeros_like(probs, dtype=bool); mask[keep] = True\n        probs = np.where(mask, probs, 0.0)\n        probs /= probs.sum()                      # renormalise AFTER truncating\n\n    return int(rng.choice(len(probs), p=probs))" },
    { lang: "python", label: "Why you sum logs, not multiply probs", code: "import numpy as np\n\nps = np.full(400, 0.5)                 # a 400-token generation\nprint(np.prod(ps))                     # 0.0   <- underflowed in float64\nprint(np.sum(np.log(ps)))              # -277.26  <- fine\n\n# perplexity of a sequence = exp(-mean log prob per token)\nlogps = np.log(ps)\nprint(np.exp(-logps.mean()))           # 2.0\n\n# and the length bias beam search must correct for:\nshort, long = np.log([0.4, 0.3]), np.log([0.4, 0.3, 0.9, 0.9])\nprint(short.sum(), long.sum())         # -2.12  vs  -2.33 -> the LONGER, better\n                                       # sequence scores worse without normalisation\nalpha = 0.7\nprint(short.sum()/len(short)**alpha, long.sum()/len(long)**alpha)   # now it wins" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 400 },

    params: [
      { key: "k", label: "Beam width k", type: "int", min: 1, max: 4, default: 2 },
      { key: "norm", label: "Length norm", type: "enum", options: ["none", "α = 0.7"], default: "none" },
      { key: "steps", label: "Max new tokens", type: "int", min: 2, max: 4, default: 4 }
    ],

    frames: function* (params, rng) {
      // A tiny explicit language model: P(next | prefix). Every probability
      // below is a real number the search actually uses.
      const MODEL = {
        "": [["nice", 0.42], ["mostly", 0.30], ["cold", 0.18], ["rainy", 0.10]],

        "nice": [["weather", 0.30], ["and", 0.28], ["today", 0.24], [".", 0.18]],
        "mostly": [["sunny", 0.85], ["cloudy", 0.10], ["clear", 0.05]],
        "cold": [["and", 0.40], ["with", 0.35], [".", 0.25]],
        "rainy": [["with", 0.50], ["and", 0.30], [".", 0.20]],

        "nice|weather": [["today", 0.34], ["here", 0.33], [".", 0.33]],
        "nice|and": [["warm", 0.45], ["sunny", 0.35], ["clear", 0.20]],
        "nice|today": [[".", 0.60], ["with", 0.40]],
        "mostly|sunny": [["with", 0.70], ["and", 0.20], [".", 0.10]],
        "mostly|cloudy": [["with", 0.60], ["and", 0.25], [".", 0.15]],
        "mostly|clear": [["skies", 0.55], ["with", 0.30], [".", 0.15]],
        "cold|and": [["windy", 0.55], ["wet", 0.25], ["dry", 0.20]],
        "cold|with": [["rain", 0.60], ["snow", 0.40]],
        "rainy|with": [["showers", 0.70], ["storms", 0.30]],
        "rainy|and": [["windy", 0.60], ["cold", 0.40]],

        "mostly|sunny|with": [["highs", 0.80], ["a", 0.20]],
        "mostly|sunny|and": [["warm", 0.70], ["dry", 0.30]],
        "mostly|cloudy|with": [["showers", 0.65], ["rain", 0.35]],
        "mostly|clear|skies": [[".", 0.70], ["later", 0.30]],
        "nice|weather|today": [[".", 0.70], ["for", 0.30]],
        "nice|weather|here": [[".", 0.80], ["too", 0.20]],
        "nice|and|warm": [[".", 0.60], ["with", 0.40]],
        "nice|and|sunny": [[".", 0.65], ["skies", 0.35]],
        "cold|and|windy": [[".", 0.70], ["with", 0.30]],
        "cold|with|rain": [[".", 0.75], ["later", 0.25]],
        "rainy|with|showers": [[".", 0.75], ["later", 0.25]],
        "rainy|and|windy": [[".", 0.80], ["all", 0.20]],

        "mostly|sunny|with|highs": [[".", 1.0]],
        "mostly|sunny|and|warm": [[".", 1.0]],
        "nice|weather|today|.": [[".", 1.0]]
      };
      const PROMPT = "The weather tomorrow will be";
      const EOS = ".";
      const k = Math.max(1, Math.min(4, params.k | 0 || 2));
      const maxSteps = Math.max(2, Math.min(4, params.steps | 0 || 4));
      const alpha = params.norm === "none" ? 0 : 0.7;

      const dist = (path) => MODEL[path.join("|")] || null;
      const r3 = (v) => (Math.round(v * 1000) / 1000) || 0;
      const lg = (p) => r3(Math.log(p));
      const scoreOf = (cum, len) => (alpha === 0 ? cum : cum / Math.pow(Math.max(1, len), alpha));

      // node store (grows as the search proceeds)
      const nodes = [];
      const addNode = (parent, token, p, cumParent, step) => {
        const cum = r3(cumParent + Math.log(p));
        nodes.push({
          id: nodes.length, parent: parent, token: token, p: r3(p), lp: lg(p),
          cum: cum, step: step, status: 0, greedy: false, beam: false, rank: null
        });
        return nodes.length - 1;
      };
      const pathOf = (id) => {
        const out = [];
        let cur = id;
        while (cur !== null && cur >= 0) { out.unshift(nodes[cur].token); cur = nodes[cur].parent; }
        return out;
      };

      const snap = (extra) => Object.assign({
        prompt: PROMPT, k: k, alpha: alpha, maxSteps: maxSteps,
        nodes: nodes.map((n) => ({ id: n.id, parent: n.parent, token: n.token, p: n.p, lp: n.lp, cum: n.cum, step: n.step, status: n.status, greedy: n.greedy, beam: n.beam, rank: n.rank })),
        beams: [], greedyPath: null, greedyScore: null, bestPath: null, bestScore: null,
        active: null, stage: "init"
      }, extra || {});

      yield {
        label: `Prompt: "${PROMPT}". At each step the model gives a real distribution over next tokens. Decoding is the separate question of which token to actually take — the model never decides that.`,
        phase: "init",
        state: snap({})
      };
      yield {
        label: `Sequence score = Σ log P(tᵢ | t_<i). We add logs rather than multiply probabilities because 200 multiplications of numbers below 1 underflow to exactly 0 in float32. Less negative = more likely.`,
        phase: "init",
        state: snap({})
      };

      // ---------------- greedy ---------------------------------------------
      let gpath = [], gcum = 0;
      const greedyIds = [];
      for (let t = 0; t < maxSteps; t++) {
        const d = dist(gpath);
        if (!d) break;
        let bi = 0;
        for (let i = 1; i < d.length; i++) if (d[i][1] > d[bi][1]) bi = i;
        const parent = greedyIds.length ? greedyIds[greedyIds.length - 1] : -1;
        const id = addNode(parent, d[bi][0], d[bi][1], gcum, t);
        nodes[id].greedy = true;
        nodes[id].status = 1;
        greedyIds.push(id);
        gpath = gpath.concat([d[bi][0]]);
        gcum = nodes[id].cum;
        yield {
          label: `Greedy step ${t + 1}: options were ${d.map((c) => `"${c[0]}" ${c[1].toFixed(2)}`).join(", ")}. Take the argmax "${d[bi][0]}" (p = ${d[bi][1].toFixed(2)}, log p = ${lg(d[bi][1])}). Cumulative log-prob ${gcum}. Greedy can never revisit this.`,
          phase: "greedy",
          focus: [id],
          state: snap({ stage: "greedy", greedyPath: gpath.slice(), greedyScore: gcum, active: id })
        };
        if (d[bi][0] === EOS) break;
      }
      const greedyText = gpath.join(" ");
      const greedyScore = gcum;
      yield {
        label: `Greedy finished: "${PROMPT} ${greedyText}" with log-prob ${greedyScore} (probability ${Math.exp(greedyScore).toFixed(4)}). It committed to "${gpath[0]}" because it was locally best — now watch beam search keep a second option alive.`,
        phase: "greedy-done",
        state: snap({ stage: "greedy", greedyPath: gpath.slice(), greedyScore: greedyScore })
      };

      // ---------------- beam search ----------------------------------------
      let beams = [{ id: -1, path: [], cum: 0, done: false }];
      const finished = [];

      for (let t = 0; t < maxSteps; t++) {
        const cands = [];
        for (let b = 0; b < beams.length; b++) {
          const beam = beams[b];
          if (beam.done) { cands.push({ id: beam.id, path: beam.path.slice(), cum: beam.cum, done: true, fresh: false }); continue; }
          const d = dist(beam.path);
          if (!d) { cands.push({ id: beam.id, path: beam.path.slice(), cum: beam.cum, done: true, fresh: false }); continue; }
          yield {
            label: `Step ${t + 1}: expand beam ${b + 1} — "${beam.path.length ? beam.path.join(" ") : "(prompt)"}" (log-prob ${r3(beam.cum)}) by all ${d.length} candidate token${d.length === 1 ? "" : "s"}.`,
            phase: "expand",
            state: snap({ stage: "beam", beams: beams.map((x, i) => ({ rank: i + 1, text: x.path.join(" "), cum: r3(x.cum), score: r3(scoreOf(x.cum, x.path.length)), done: x.done })), greedyPath: gpath.slice(), greedyScore: greedyScore, active: beam.id })
          };
          for (let i = 0; i < d.length; i++) {
            const nid = addNode(beam.id, d[i][0], d[i][1], beam.cum, t);
            cands.push({ id: nid, path: beam.path.concat([d[i][0]]), cum: nodes[nid].cum, done: d[i][0] === EOS, fresh: true });
            yield {
              label: `candidate "${beam.path.concat([d[i][0]]).join(" ")}" : ${r3(beam.cum)} + log(${d[i][1].toFixed(2)}) = ${nodes[nid].cum}${d[i][0] === EOS ? "  — ends the sequence, so it is set aside as a finished hypothesis" : ""}`,
              phase: "candidate",
              focus: [nid],
              state: snap({ stage: "beam", beams: beams.map((x, i2) => ({ rank: i2 + 1, text: x.path.join(" "), cum: r3(x.cum), score: r3(scoreOf(x.cum, x.path.length)), done: x.done })), greedyPath: gpath.slice(), greedyScore: greedyScore, active: nid })
            };
          }
        }

        cands.sort((a, b) => scoreOf(b.cum, b.path.length) - scoreOf(a.cum, a.path.length));
        const kept = cands.slice(0, k);
        const dropped = cands.slice(k);

        for (let i = 0; i < nodes.length; i++) if (nodes[i].step === t && !nodes[i].greedy) nodes[i].status = 2;
        for (let i = 0; i < kept.length; i++) {
          if (kept[i].id >= 0) { nodes[kept[i].id].status = kept[i].done ? 3 : 1; nodes[kept[i].id].beam = true; nodes[kept[i].id].rank = i + 1; }
        }

        const parents = {};
        for (let i = 0; i < kept.length; i++) if (kept[i].id >= 0 && nodes[kept[i].id].parent >= 0) parents[nodes[kept[i].id].parent] = 1;
        const nParents = Object.keys(parents).length;

        yield {
          label: `Step ${t + 1} prune: ${cands.length} candidates → keep the top ${Math.min(k, cands.length)} by ${alpha ? `normalised score (log-prob / len^${alpha})` : "cumulative log-prob"}. Dropped ${dropped.length}.${nParents === 1 && kept.length > 1 ? " Note both survivors share one parent — beam search's beams are near-duplicates, not diverse alternatives." : ""}`,
          phase: "prune",
          state: snap({ stage: "beam", beams: kept.map((x, i) => ({ rank: i + 1, text: x.path.join(" "), cum: r3(x.cum), score: r3(scoreOf(x.cum, x.path.length)), done: x.done })), greedyPath: gpath.slice(), greedyScore: greedyScore })
        };

        beams = [];
        for (let i = 0; i < kept.length; i++) {
          if (kept[i].done) { finished.push(kept[i]); beams.push({ id: kept[i].id, path: kept[i].path.slice(), cum: kept[i].cum, done: true }); }
          else beams.push({ id: kept[i].id, path: kept[i].path.slice(), cum: kept[i].cum, done: false });
        }
        let anyLive = false;
        for (let i = 0; i < beams.length; i++) if (!beams[i].done) anyLive = true;
        if (!anyLive) break;
      }

      const all = beams.slice();
      all.sort((a, b) => scoreOf(b.cum, b.path.length) - scoreOf(a.cum, a.path.length));
      const best = all[0];
      const bestText = best.path.join(" ");

      let node = best.id;
      while (node >= 0) { nodes[node].status = 3; node = nodes[node].parent; }

      const ratio = Math.exp(best.cum - greedyScore);
      yield {
        label: `Beam (k=${k}) best: "${PROMPT} ${bestText}" with log-prob ${r3(best.cum)} vs greedy's ${greedyScore} — ${ratio.toFixed(1)}× more likely. Greedy's first token "${gpath[0]}" (p=${MODEL[""].find((c) => c[0] === gpath[0])[1].toFixed(2)}) beat "${best.path[0]}" (p=${(MODEL[""].find((c) => c[0] === best.path[0]) || [0, 0])[1].toFixed(2)}) locally, then led into a flat, low-probability region.`,
        phase: "done",
        state: snap({ stage: "done", beams: all.map((x, i) => ({ rank: i + 1, text: x.path.join(" "), cum: r3(x.cum), score: r3(scoreOf(x.cum, x.path.length)), done: x.done })), greedyPath: gpath.slice(), greedyScore: greedyScore, bestPath: best.path.slice(), bestScore: r3(best.cum) })
      };
      yield {
        label: `And the punchline: this higher-likelihood sentence is also the blander one. Beam search maximises probability, but for open-ended text the mode of the distribution is repetitive and dull — which is why chat models sample with top-p instead, and why beam search survives mainly in translation and summarisation.`,
        phase: "done",
        state: snap({ stage: "done", beams: all.map((x, i) => ({ rank: i + 1, text: x.path.join(" "), cum: r3(x.cum), score: r3(scoreOf(x.cum, x.path.length)), done: x.done })), greedyPath: gpath.slice(), greedyScore: greedyScore, bestPath: best.path.slice(), bestScore: r3(best.cum) })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const panelW = Math.min(260, W * 0.30);
      const treeW = W - panelW - 26;
      const top = 62, bottom = 18;

      // group nodes by step for layout
      const cols = [];
      for (let i = 0; i < s.nodes.length; i++) {
        const st = s.nodes[i].step;
        if (!cols[st]) cols[st] = [];
        cols[st].push(s.nodes[i]);
      }
      const nCols = Math.max(1, cols.length);
      const colW = treeW / nCols;
      const pos = {};
      let maxRows = 1;
      for (let c = 0; c < nCols; c++) if (cols[c]) maxRows = Math.max(maxRows, cols[c].length);
      const rowH = Math.min(30, (H - top - bottom) / Math.max(1, maxRows));

      for (let c = 0; c < nCols; c++) {
        const list = cols[c] || [];
        const startY = top + ((H - top - bottom) - list.length * rowH) / 2;
        for (let i = 0; i < list.length; i++) {
          pos[list[i].id] = { x: 14 + c * colW + colW * 0.12, y: startY + i * rowH + rowH / 2 };
        }
      }

      const boxW = Math.max(56, colW * 0.72);
      const boxH = Math.min(22, rowH - 5);

      // ---------------- edges -----------------------------------------------
      for (let i = 0; i < s.nodes.length; i++) {
        const n = s.nodes[i];
        const p = pos[n.id];
        if (!p) continue;
        let px, py;
        if (n.parent < 0) { px = 14; py = H / 2; }
        else { const pp = pos[n.parent]; if (!pp) continue; px = pp.x + boxW; py = pp.y; }
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + 16, py, p.x - 16, p.y, p.x, p.y);
        if (n.status === 2) { ctx.strokeStyle = C.viz8; ctx.setLineDash([2, 3]); ctx.globalAlpha = 0.4; ctx.lineWidth = 1; }
        else if (n.greedy) { ctx.strokeStyle = C.viz2; ctx.lineWidth = 2; ctx.globalAlpha = 1; }
        else if (n.status === 3) { ctx.strokeStyle = C.viz6; ctx.lineWidth = 2; ctx.globalAlpha = 1; }
        else { ctx.strokeStyle = C.viz1; ctx.lineWidth = 1.6; ctx.globalAlpha = 1; }
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // ---------------- nodes -----------------------------------------------
      ctx.textBaseline = "middle";
      for (let i = 0; i < s.nodes.length; i++) {
        const n = s.nodes[i];
        const p = pos[n.id];
        if (!p) continue;
        const isActive = s.active === n.id;
        let fill = C.surface2, stroke = C.border, txt = C.text;
        if (n.status === 2) { fill = C.surface; stroke = C.viz8; txt = C.muted; }
        else if (n.status === 3) { fill = C.viz6; stroke = C.viz6; txt = C.surface; }
        else if (n.status === 1 && n.beam) { fill = C.viz1; stroke = C.viz1; txt = C.surface; }
        else if (n.greedy) { fill = C.surface2; stroke = C.viz2; txt = C.text; }
        if (isActive) { stroke = C.viz4; }

        ctx.globalAlpha = n.status === 2 ? 0.5 : 1;
        ctx.fillStyle = fill;
        ctx.strokeStyle = stroke;
        ctx.lineWidth = isActive ? 2.4 : (n.greedy ? 2 : 1);
        ctx.beginPath();
        ctx.roundRect(p.x, p.y - boxH / 2, boxW, boxH, 4);
        ctx.fill();
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = txt;
        ctx.font = `11px ${env.font.base}`;
        ctx.textAlign = "left";
        ctx.fillText(n.token === "." ? "· EOS" : n.token, p.x + 6, p.y - 0.5);
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = n.status === 3 || (n.status === 1 && n.beam) ? C.surface : C.muted;
        ctx.textAlign = "right";
        ctx.fillText(n.cum.toFixed(2), p.x + boxW - 5, p.y - 0.5);
        if (n.greedy) {
          ctx.fillStyle = C.viz2;
          ctx.font = `8px ${env.font.mono}`;
          ctx.textAlign = "left";
          ctx.fillText("greedy", p.x + 2, p.y + boxH / 2 + 6);
        }
      }

      // ---------------- header ----------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = `12px ${env.font.base}`;
      ctx.fillText(`"${s.prompt} …"`, 14, 22);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`beam k=${s.k}   ${s.alpha ? `length norm α=${s.alpha}` : "no length normalisation"}   node label: token + cumulative log-prob`, 14, 38);
      ctx.font = `10px ${env.font.base}`;
      ctx.fillStyle = C.viz2;
      ctx.fillText("■ greedy path", 14, 54);
      ctx.fillStyle = C.viz1;
      ctx.fillText("■ live beam", 104, 54);
      ctx.fillStyle = C.viz8;
      ctx.fillText("■ pruned", 184, 54);
      ctx.fillStyle = C.viz6;
      ctx.fillText("■ winner", 244, 54);

      // ---------------- right panel -----------------------------------------
      const bx = W - panelW - 8;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, 12, panelW, H - 24, 6);
      ctx.fill();
      ctx.stroke();

      let y = 32;
      ctx.fillStyle = C.text;
      ctx.font = `11px ${env.font.base}`;
      ctx.fillText("beams", bx + 12, y);
      y += 8;
      ctx.font = `10px ${env.font.mono}`;
      for (let i = 0; i < s.beams.length; i++) {
        const b = s.beams[i];
        y += 18;
        if (y > H - 90) break;
        ctx.fillStyle = b.done ? C.viz6 : C.viz1;
        ctx.fillRect(bx + 12, y - 8, 4, 10);
        ctx.fillStyle = C.text2;
        ctx.font = `10px ${env.font.base}`;
        const t = b.text.length > 26 ? b.text.slice(0, 26) + "…" : (b.text || "(prompt)");
        ctx.fillText(t, bx + 22, y);
        y += 13;
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(`logP ${b.cum.toFixed(3)}${s.alpha ? `   score ${b.score.toFixed(3)}` : ""}${b.done ? "   [EOS]" : ""}`, bx + 22, y);
      }

      y = H - 78;
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.moveTo(bx + 10, y - 12); ctx.lineTo(bx + panelW - 10, y - 12);
      ctx.stroke();

      if (s.greedyPath) {
        ctx.fillStyle = C.viz2;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(`greedy: ${s.greedyPath.join(" ")}`, bx + 12, y + 2);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(`logP ${s.greedyScore === null ? "—" : s.greedyScore.toFixed(3)}   p = ${s.greedyScore === null ? "—" : Math.exp(s.greedyScore).toFixed(4)}`, bx + 12, y + 16);
      }
      if (s.bestPath) {
        ctx.fillStyle = C.viz6;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(`beam:   ${s.bestPath.join(" ")}`, bx + 12, y + 36);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(`logP ${s.bestScore.toFixed(3)}   p = ${Math.exp(s.bestScore).toFixed(4)}`, bx + 12, y + 50);
      }
    }
  },

  drill: {
    cards: [
      { q: "Why score sequences with summed log-probs?", a: "The product of hundreds of probabilities underflows to 0 in floating point. Logs are monotone in the product, numerically stable, and turn the product into a sum.", tags: ["basics"] },
      { q: "Beam search cost, time and memory?", a: "O(L·k·|V|) time and O(k·L) memory, plus k copies of the KV cache — in an LLM server the KV cache is the binding cost, not the FLOPs.", tags: ["complexity"] },
      { q: "Does beam search find the most likely sequence?", a: "No. Exact MAP decoding is exponential; beam search is a heuristic that can discard the true best prefix at any step. Larger k approximates better but for open-ended text often reads worse.", tags: ["theory"] },
      { q: "Why does beam search need length normalisation?", a: "Each extra token adds a negative log-prob, so raw scores always favour short sequences. Divide by `length^α` with α ≈ 0.6–0.7 to remove the bias.", tags: ["pitfall"] },
      { q: "Why is beam search bad for chat but fine for translation?", a: "In open-ended generation the mode of the distribution is bland and repetitive — likelihood ≠ quality. Translation and summarisation are constrained by the source, so the target really is near the mode.", tags: ["core"] },
      { q: "Top-k vs top-p?", a: "Top-k keeps a fixed count regardless of the distribution's shape; top-p keeps the smallest set covering probability mass p, so it adapts per step. Top-p is the usual default.", tags: ["sampling"] },
      { q: "What does temperature do and when is it applied?", a: "Divides logits before the softmax: `softmax(z/T)`. T→0 is greedy, T>1 flattens. Applied *before* top-k/top-p truncation, so it changes which tokens make the cut.", tags: ["sampling"] },
      { q: "What does speculative decoding change about the output?", a: "Nothing — the accepted tokens are distributed exactly as the target model's own samples, thanks to a rejection-sampling correction. It only reduces the number of large-model forward passes.", tags: ["inference"] }
    ],
    sixtySecond: [
      "Compare greedy, beam search and nucleus sampling: cost, what each optimises, and when each is the right choice.",
      "Explain why maximising sequence likelihood produces bad open-ended text, and what practitioners do instead."
    ]
  }
};
