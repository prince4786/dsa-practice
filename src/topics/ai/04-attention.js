export default {
  id: "attention",
  track: "ai",
  title: "The Attention Mechanism",
  difficulty: 2,
  minutes: 22,
  tags: ["attention", "softmax", "transformers", "qkv"],

  explainer: [
    { type: "p", text: "Attention lets every token build its next representation as a **weighted average of all tokens' value vectors**, where the weights are decided by content, not by position. Each token emits a *query* (\"what am I looking for?\"), each token emits a *key* (\"what do I offer?\"), and the compatibility of a query with a key — their dot product — becomes, after a softmax, the fraction of that token's value you copy." },

    { type: "code", lang: "python", code: "Attention(Q, K, V) = softmax( (Q @ K.T) / sqrt(d_k) ) @ V" },

    { type: "h3", text: "The shapes, which you will be asked to recite" },
    { type: "list", items: [
      "`X`: `(B, n, d_model)` — batch, sequence length, model width.",
      "`W_Q, W_K`: `(d_model, d_k)`; `W_V`: `(d_model, d_v)`. In practice `d_k = d_v = d_model / h` for `h` heads.",
      "`Q = X @ W_Q` → `(B, n, d_k)`; same for `K` and `V`.",
      "`S = Q @ K.T` → `(B, n, n)` — the score matrix. **This `n²` term is the entire cost story of transformers.**",
      "`A = softmax(S / √d_k, axis=-1)` → `(B, n, n)`, and **every row sums to exactly 1**.",
      "`O = A @ V` → `(B, n, d_v)`; concatenate `h` heads → `(B, n, d_model)`, then one more projection `W_O`."
    ]},

    { type: "h3", text: "Why divide by √d_k — the answer they actually want" },
    { type: "p", text: "If the components of `q` and `k` are independent with mean 0 and variance 1, then `q·k = Σ_{i=1..d_k} q_i k_i` has mean 0 and **variance `d_k`**, so its standard deviation is `√d_k`. With `d_k = 64` the raw scores swing by ±8 or more. Softmax over inputs that large is effectively an argmax: one weight goes to ~1, the rest to ~0, and since `∂softmax/∂s → 0` in that saturated regime, **the gradient through attention vanishes**. Dividing by `√d_k` restores unit variance, keeping the distribution soft and the gradients alive. It is a *temperature*, chosen so the temperature does not depend on the head width." },
    { type: "callout", tone: "pitfall", text: "Two common wrong answers: \"to normalise the vectors\" (no — normalising would be dividing by ‖q‖‖k‖, which is cosine attention, a different mechanism) and \"to keep the softmax from overflowing\" (numerical overflow is handled separately by subtracting the row max). The reason is *variance control so softmax stays in its high-gradient regime*." },

    { type: "h3", text: "Causal masking" },
    { type: "p", text: "A decoder must not see the future, so before the softmax you set `S[i,j] = −∞` for all `j > i`. `exp(−∞) = 0`, so those positions get exactly zero weight and — crucially — contribute nothing to the row's normaliser, so the remaining weights still sum to 1. The mask is applied to the *scores*, never to the probabilities: zeroing probabilities after the softmax would leave the row summing to less than 1." },

    { type: "h3", text: "Multi-head: why not one big head?" },
    { type: "p", text: "One head can only express one averaging pattern per position — a single softmax row. With `h` heads of width `d_model/h` you get `h` independent patterns at **the same total FLOPs and parameters**, then mix them with `W_O`. Interpretability work finds heads that specialise: previous-token heads, induction heads (\"the last time I saw token A, what followed it?\"), syntactic-dependency heads. The visualiser lets you switch between a content head and a positional head to see this concretely." },

    { type: "h3", text: "Cost, and the tricks that fight it" },
    { type: "list", items: [
      "Time `O(n²·d)` and, naively, memory `O(n²)` for the score matrix — the quadratic term is in the *sequence length*, which is why context windows are expensive.",
      "**FlashAttention** never materialises the `n×n` matrix: it tiles the computation and keeps a running softmax (online softmax with running max and sum), making memory `O(n)` and making it faster by being IO-aware. It is exact, not an approximation — a distinction interviewers probe.",
      "**KV cache**: at generation time, keys and values of past tokens never change, so you cache them and each new token costs `O(n·d)` instead of `O(n²·d)`. Cache size is `2 · n · layers · h · d_head · bytes` and is usually the real memory limit on serving.",
      "**MQA / GQA**: share one (or a few) K/V heads across all query heads to shrink that cache — the reason Llama-2 70B and most modern models use grouped-query attention.",
      "**Cross-attention**: `Q` comes from the decoder, `K`/`V` from the encoder, so the score matrix is `(n_dec, n_enc)`. Self-attention is just the case where all three come from the same sequence."
    ]},

    { type: "callout", tone: "tip", text: "Attention itself contains no notion of order — permute the tokens and the outputs permute identically. Position comes entirely from positional encodings (learned, sinusoidal, ALiBi) or from RoPE rotating `Q` and `K` before the dot product. If asked \"what would break without positional information?\", the answer is that the model would see a bag of tokens." }
  ],

  complexity: {
    rows: [
      { operation: "Scores Q·Kᵀ", time: "O(n²·d_k)", space: "O(n²)", note: "the quadratic term" },
      { operation: "Softmax", time: "O(n²)", space: "O(n²)", note: "row-wise; subtract row max for stability" },
      { operation: "A·V", time: "O(n²·d_v)", space: "O(n·d_v)", note: "the weighted sum of values" },
      { operation: "Projections Q,K,V,O", time: "O(n·d²)", space: "O(d²)", note: "dominates while n < d" },
      { operation: "FlashAttention", time: "O(n²·d)", space: "O(n)", note: "exact; tiled, never materialises S" },
      { operation: "Decode step with KV cache", time: "O(n·d)", space: "O(n·d) cache", note: "vs O(n²·d) recompute" }
    ]
  },

  interview: {
    whyAsked: "This is the load-bearing question of every LLM interview. It simultaneously tests linear-algebra fluency (can you get the shapes right under pressure), statistical reasoning (the √d_k variance argument), and systems awareness (n² cost, KV cache, FlashAttention). Candidates who can only recite the formula are separated from those who can explain why each piece is there.",
    followUps: [
      { q: "Why divide by √d_k specifically?", a: "With unit-variance entries, `q·k` sums `d_k` independent products, so its variance is `d_k` and its scale is `√d_k`. Feeding scores that large into softmax saturates it into a near-argmax, where the Jacobian is ~0 and gradients vanish. Dividing by `√d_k` returns the scores to unit variance so the softmax stays soft and trainable, independently of head width." },
      { q: "Where exactly is the causal mask applied, and why not after the softmax?", a: "On the scores, before the softmax: set the future positions to −∞ so `exp` gives 0. If you instead zeroed the probabilities afterwards, the future positions would already have contributed to the denominator, so the row would sum to less than 1 and you would be silently down-weighting every legitimate token." },
      { q: "What does multi-head attention buy over a single head of the same total width?", a: "Multiple independent attention patterns per position. A single softmax row can only express one weighted average; with h heads you get h of them at identical FLOPs, then `W_O` mixes their concatenation. Empirically heads specialise (previous-token, induction, syntactic heads), and pruning studies show a small number of them do most of the work." },
      { q: "How does the KV cache change generation cost?", a: "Without it, generating token t re-runs attention over the whole prefix: O(t²·d) per step, O(n³) for a sequence. With it, keys and values of past tokens are stored, so each step is O(t·d) — and generation becomes memory-bandwidth-bound rather than compute-bound. The cache is `2·n·L·h·d_head` values, which is what actually limits batch size in serving." },
      { q: "Is FlashAttention an approximation?", a: "No — it is numerically exact (up to floating-point reassociation). It tiles Q, K, V into SRAM-sized blocks and maintains a running max and running sum so the softmax can be computed incrementally, never materialising the n×n matrix. The win is IO: far fewer reads/writes to HBM, plus O(n) memory instead of O(n²)." },
      { q: "Attention has no notion of position. Why does the model still work?", a: "Because position is injected before or inside attention: added positional embeddings (learned or sinusoidal), ALiBi biases added to the scores, or RoPE, which rotates Q and K so that their dot product depends only on the *relative* offset. Remove all of them and self-attention is permutation-equivariant — the model literally sees a bag of tokens." },
      { q: "What is an induction head?", a: "A two-head circuit that implements in-context copying: a previous-token head writes 'the token before me was A' into position i, and a later head queries for 'where was A followed by something' and copies that continuation. It is the mechanistic explanation for much of in-context learning and shows up as a sharp phase change in the loss curve during training." }
    ]
  },

  code: [
    { lang: "python", label: "Scaled dot-product attention from scratch (numpy)", code: "import numpy as np\n\ndef softmax(x, axis=-1):\n    x = x - np.max(x, axis=axis, keepdims=True)   # numerical stability only\n    e = np.exp(x)\n    return e / np.sum(e, axis=axis, keepdims=True)\n\ndef attention(Q, K, V, causal=False):\n    \"\"\"Q: (n, d_k)  K: (n, d_k)  V: (n, d_v)  ->  (n, d_v), (n, n)\"\"\"\n    d_k = Q.shape[-1]\n    scores = Q @ K.T / np.sqrt(d_k)               # (n, n)   <- the sqrt(d_k) scaling\n\n    if causal:\n        n = scores.shape[0]\n        mask = np.triu(np.ones((n, n), dtype=bool), k=1)   # strictly upper triangle\n        scores = np.where(mask, -np.inf, scores)  # BEFORE the softmax\n\n    A = softmax(scores, axis=-1)                  # every row sums to 1\n    return A @ V, A\n\nrng = np.random.default_rng(0)\nn, d_k, d_v = 6, 64, 64\nQ, K, V = rng.normal(size=(n, d_k)), rng.normal(size=(n, d_k)), rng.normal(size=(n, d_v))\nO, A = attention(Q, K, V, causal=True)\nprint(O.shape, A.shape)          # (6, 64) (6, 6)\nprint(A.sum(axis=-1))            # [1. 1. 1. 1. 1. 1.]\nprint(np.allclose(np.triu(A, 1), 0))   # True -> no token sees the future\n\n# Why the scaling matters, empirically:\nraw = (Q @ K.T)[0]\nprint(raw.std(), raw.std() / np.sqrt(d_k))   # ~sqrt(d_k)  ->  ~1" },
    { lang: "python", label: "Multi-head attention (PyTorch, explicit)", code: "import torch, torch.nn as nn, math\n\nclass MultiHeadAttention(nn.Module):\n    def __init__(self, d_model, n_heads, causal=True):\n        super().__init__()\n        assert d_model % n_heads == 0\n        self.h = n_heads\n        self.d_head = d_model // n_heads          # heads SPLIT the width, not add to it\n        self.qkv = nn.Linear(d_model, 3 * d_model, bias=False)\n        self.proj = nn.Linear(d_model, d_model, bias=False)\n        self.causal = causal\n\n    def forward(self, x):                          # x: (B, n, d_model)\n        B, n, d = x.shape\n        q, k, v = self.qkv(x).split(d, dim=2)      # each (B, n, d)\n        # (B, n, d) -> (B, h, n, d_head)\n        q = q.view(B, n, self.h, self.d_head).transpose(1, 2)\n        k = k.view(B, n, self.h, self.d_head).transpose(1, 2)\n        v = v.view(B, n, self.h, self.d_head).transpose(1, 2)\n\n        att = (q @ k.transpose(-2, -1)) / math.sqrt(self.d_head)   # (B, h, n, n)\n        if self.causal:\n            mask = torch.ones(n, n, dtype=torch.bool, device=x.device).triu(1)\n            att = att.masked_fill(mask, float('-inf'))\n        att = att.softmax(dim=-1)\n\n        out = att @ v                              # (B, h, n, d_head)\n        out = out.transpose(1, 2).contiguous().view(B, n, d)       # concat heads\n        return self.proj(out)\n\nx = torch.randn(2, 10, 256)\nprint(MultiHeadAttention(256, 8)(x).shape)         # torch.Size([2, 10, 256])" },
    { lang: "python", label: "KV cache: the whole idea in 20 lines", code: "import torch, math\n\nclass KVCache:\n    def __init__(self):\n        self.k = None      # (B, h, t, d_head)\n        self.v = None\n\n    def append(self, k_new, v_new):\n        self.k = k_new if self.k is None else torch.cat([self.k, k_new], dim=2)\n        self.v = v_new if self.v is None else torch.cat([self.v, v_new], dim=2)\n        return self.k, self.v\n\ndef decode_step(q_new, k_new, v_new, cache):\n    \"\"\"q_new: (B, h, 1, d_head) -- ONE new token attending over the whole prefix.\"\"\"\n    k, v = cache.append(k_new, v_new)\n    att = (q_new @ k.transpose(-2, -1)) / math.sqrt(q_new.shape[-1])   # (B, h, 1, t)\n    att = att.softmax(dim=-1)                                          # no mask needed:\n    return att @ v                                                     # the future isn't in the cache\n\n# cost per step: O(t * d) instead of O(t^2 * d).\n# cache bytes = 2 * n_tokens * n_layers * n_kv_heads * d_head * dtype_bytes\n# GQA/MQA shrink n_kv_heads -- that is the entire motivation." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 400 },

    params: [
      { key: "head", label: "Head", type: "enum", options: ["content (subject-finding)", "positional (previous-token)"], default: "content (subject-finding)" },
      { key: "causal", label: "Causal mask", type: "enum", options: ["off", "on"], default: "off" },
      { key: "scale", label: "Scaling", type: "enum", options: ["÷√d_k", "none"], default: "÷√d_k" },
      { key: "focus", label: "Unroll output for token", type: "int", min: 0, max: 5, default: 4 }
    ],

    frames: function* (params, rng) {
      const tokens = ["the", "cat", "sat", "because", "it", "purred"];
      const n = tokens.length;
      const dk = 4, dv = 4;
      const causal = params.causal === "on";
      const scaled = params.scale !== "none";
      const positional = String(params.head || "").indexOf("positional") === 0;
      const focus = Math.max(0, Math.min(n - 1, params.focus | 0));
      const sqrtDk = Math.sqrt(dk);

      const r3 = (v) => (Math.round(v * 1000) / 1000) || 0;
      const r4 = (v) => (Math.round(v * 10000) / 10000) || 0;
      const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
      const copy2 = (M) => M.map((r) => r.slice());

      // ---- Q, K, V. In a real model these are X @ W_Q etc.; we start after
      //      that projection so every number on screen stays readable.
      let Q, K, V, headNote;
      if (!positional) {
        // dimensions read as: [animate, action-ness, past-tense, subject-ness]
        Q = [
          [0.2, 0.1, 0.0, 0.1],   // the
          [0.1, 0.9, 0.2, 0.0],   // cat   -> looking for its verb
          [1.0, 0.1, 0.0, 0.9],   // sat   -> looking for a subject
          [0.2, 0.6, 0.3, 0.1],   // because
          [1.3, 0.0, 0.0, 1.1],   // it    -> looking for an animate subject
          [1.1, 0.1, 0.0, 1.0]    // purred-> looking for a subject
        ];
        K = [
          [0.1, 0.0, 0.0, 0.2],
          [1.2, 0.1, 0.0, 1.0],   // cat offers: animate + subject
          [0.0, 1.1, 0.9, 0.0],
          [0.0, 0.0, 0.2, 0.1],
          [0.6, 0.0, 0.0, 0.5],
          [0.1, 1.0, 0.8, 0.0]
        ];
        V = [
          [0.0, 0.1, 0.0, 0.0],
          [0.9, 0.2, 0.1, 0.8],
          [0.1, 0.8, 0.7, 0.0],
          [0.0, 0.1, 0.5, 0.2],
          [0.4, 0.1, 0.0, 0.3],
          [0.2, 0.9, 0.6, 0.1]
        ];
        headNote = "a content head: queries look for animate subjects, keys advertise them";
      } else {
        // A relative-position head: q_i · k_j is maximal exactly at j = i-1,
        // because q_i encodes angle (i-1)·θ and k_j encodes angle j·θ.
        const th = 1.0;
        Q = []; K = []; V = [];
        for (let i = 0; i < n; i++) {
          Q.push([r3(3 * Math.cos((i - 1) * th)), r3(3 * Math.sin((i - 1) * th)), 1.5, 0]);
          K.push([r3(Math.cos(i * th)), r3(Math.sin(i * th)), 0.5, 0]);
        }
        V = [
          [0.2, 0.0, 0.1, 0.0],
          [0.8, 0.3, 0.0, 0.6],
          [0.0, 0.7, 0.6, 0.1],
          [0.1, 0.2, 0.4, 0.3],
          [0.5, 0.0, 0.1, 0.2],
          [0.3, 0.8, 0.5, 0.0]
        ];
        headNote = "a positional head: q_i encodes angle (i−1)θ and k_j encodes jθ, so q·k peaks exactly at j = i−1";
      }

      const S = [], mask = [], P = [], OUT = [];
      for (let i = 0; i < n; i++) {
        S.push(new Array(n).fill(null));
        mask.push(new Array(n).fill(0));
        P.push(new Array(n).fill(null));
        OUT.push(null);
      }

      const snap = (extra) => Object.assign({
        tokens: tokens.slice(), n: n, dk: dk, dv: dv,
        Q: copy2(Q), K: copy2(K), V: copy2(V),
        S: copy2(S), mask: copy2(mask), P: copy2(P),
        out: OUT.map((o) => (o ? o.slice() : null)),
        causal: causal, scaled: scaled, positional: positional,
        stage: "scores", active: null, work: null, focus: focus
      }, extra || {});

      yield {
        label: `Self-attention over ${n} tokens with d_k = ${dk}. Q, K, V are each (${n}×${dk}); the score matrix will be (${n}×${n}). This is ${headNote}.`,
        phase: "init",
        state: snap({ stage: "init" })
      };

      yield {
        label: `Q = X·W_Q, K = X·W_K, V = X·W_V. Each row of Q asks a question; each row of K advertises an answer; each row of V is the content that gets copied if the match wins.`,
        phase: "init",
        state: snap({ stage: "init" })
      };

      // ---------------- 1. raw scores --------------------------------------
      for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
          const terms = [];
          let acc = 0;
          const detail = (i === 0 && j < 2);
          for (let t = 0; t < dk; t++) {
            const p = Q[i][t] * K[j][t];
            acc += p;
            terms.push(r4(p));
            if (detail) {
              yield {
                label: `S[${i},${j}] += Q[${i}][${t}]·K[${j}][${t}] = ${Q[i][t]} × ${K[j][t]} = ${r3(p)}  →  running ${r3(acc)}   (one term of the ${dk}-dimensional dot product)`,
                phase: "dot",
                focus: [i, j],
                state: snap({ active: { i: i, j: j }, work: { kind: "dot", i: i, j: j, terms: terms.slice(), acc: r3(acc), full: false } })
              };
            }
          }
          S[i][j] = r4(acc);
          yield {
            label: `S[${i},${j}] = q_${tokens[i]} · k_${tokens[j]} = ${r3(acc)} — "${tokens[i]}" ${acc > 1.5 ? "matches" : acc > 0.5 ? "weakly matches" : "barely matches"} "${tokens[j]}". Raw scores are unbounded; nothing is a probability yet.`,
            phase: "scores",
            focus: [i, j],
            state: snap({ active: { i: i, j: j }, work: { kind: "dot", i: i, j: j, terms: terms.slice(), acc: r3(acc), full: true } })
          };
        }
      }

      const flat = [];
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) flat.push(S[i][j]);
      const mean = flat.reduce((a, b) => a + b, 0) / flat.length;
      const sd = Math.sqrt(flat.reduce((a, b) => a + (b - mean) * (b - mean), 0) / flat.length);

      yield {
        label: `All ${n * n} scores computed: ${n}×${dk} × ${dk}×${n} = one (${n}×${n}) matmul, O(n²·d_k). Spread of these scores: sd ≈ ${r3(sd)}. With d_k = ${dk}, √d_k = ${sqrtDk}.`,
        phase: "scores-done",
        state: snap({ stage: "scores" })
      };

      // ---------------- 2. scale -------------------------------------------
      if (scaled) {
        for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) S[i][j] = r4(S[i][j] / sqrtDk);
        yield {
          label: `Divide every score by √d_k = ${sqrtDk}. q·k sums ${dk} independent products, so its variance grows like d_k — without this the softmax saturates into an argmax and the gradient dies. Scores now have unit-ish scale (sd ≈ ${r3(sd / sqrtDk)}).`,
          phase: "scale",
          state: snap({ stage: "scaled" })
        };
      } else {
        yield {
          label: `Scaling is OFF. Scores keep sd ≈ ${r3(sd)}. Watch the softmax rows below become far spikier than they should be — at a realistic d_k = 64 this is what kills the gradient.`,
          phase: "scale",
          state: snap({ stage: "scaled" })
        };
      }

      // ---------------- 3. causal mask -------------------------------------
      if (causal) {
        for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) mask[i][j] = 1;
        yield {
          label: `Causal mask: set S[i,j] = −∞ for every j > i, BEFORE the softmax. exp(−∞) = 0, so future tokens get exactly zero weight and never enter the row's denominator — which is why each row still sums to 1.`,
          phase: "mask",
          state: snap({ stage: "masked" })
        };
      }

      // ---------------- 4. softmax, row by row ------------------------------
      for (let i = 0; i < n; i++) {
        const live = [];
        for (let j = 0; j < n; j++) if (!mask[i][j]) live.push(j);

        let m = -Infinity;
        for (let t = 0; t < live.length; t++) m = Math.max(m, S[i][live[t]]);
        yield {
          label: `Row ${i} ("${tokens[i]}"): softmax step 1 — subtract the row max ${r3(m)} from every entry. Pure numerical hygiene: it changes nothing mathematically, it just stops exp() overflowing.`,
          phase: "softmax",
          focus: [i],
          state: snap({ stage: "softmax", active: { i: i, j: null }, work: { kind: "softmax", row: i, step: 1, max: r3(m), exps: null, sum: null, probs: null } })
        };

        const exps = new Array(n).fill(0);
        let sum = 0;
        for (let t = 0; t < live.length; t++) {
          const j = live[t];
          exps[j] = Math.exp(S[i][j] - m);
          sum += exps[j];
        }
        yield {
          label: `Row ${i}: step 2 — exponentiate. exp turns differences into ratios: a score gap of 1.0 becomes a weight ratio of e ≈ 2.72. Denominator Σexp = ${r3(sum)}${causal ? ` over the ${live.length} visible position${live.length === 1 ? "" : "s"}` : ""}.`,
          phase: "softmax",
          focus: [i],
          state: snap({ stage: "softmax", active: { i: i, j: null }, work: { kind: "softmax", row: i, step: 2, max: r3(m), exps: exps.map((e) => r4(e)), sum: r3(sum), probs: null } })
        };

        for (let j = 0; j < n; j++) P[i][j] = mask[i][j] ? 0 : r4(exps[j] / sum);
        let rowSum = 0;
        for (let j = 0; j < n; j++) rowSum += P[i][j];
        let best = 0;
        for (let j = 1; j < n; j++) if (P[i][j] > P[i][best]) best = j;
        const shown = P[i].map((p) => p.toFixed(2).replace(/^0/, "")).join(" ");

        yield {
          label: `Row ${i} softmaxes to [${shown}] — sums to ${rowSum.toFixed(3)}. "${tokens[i]}" puts ${(P[i][best] * 100).toFixed(0)}% of its attention on "${tokens[best]}"${best === i ? " (itself — a very common pattern)" : ""}.`,
          phase: "softmax-done",
          focus: [i, best],
          state: snap({ stage: "probs", active: { i: i, j: best }, work: { kind: "softmax", row: i, step: 3, max: r3(m), exps: exps.map((e) => r4(e)), sum: r3(sum), probs: P[i].slice() } })
        };
      }

      yield {
        label: `The attention matrix A is (${n}×${n}), row-stochastic: every row is a probability distribution over which tokens to read from. Reading it is the whole diagnostic value of attention maps.`,
        phase: "probs",
        state: snap({ stage: "probs" })
      };

      // ---------------- 5. output = A @ V ----------------------------------
      for (let i = 0; i < n; i++) {
        const acc = new Array(dv).fill(0);
        const terms = [];
        if (i === focus) {
          for (let j = 0; j < n; j++) {
            for (let t = 0; t < dv; t++) acc[t] += P[i][j] * V[j][t];
            terms.push({ j: j, p: P[i][j], v: V[j].slice() });
            yield {
              label: `out[${i}] += A[${i},${j}] · v_${tokens[j]} = ${P[i][j].toFixed(3)} × [${V[j].join(", ")}]  →  running [${acc.map((x) => r3(x)).join(", ")}]${P[i][j] < 0.02 ? "  (near-zero weight: this token is effectively ignored)" : ""}`,
              phase: "compose",
              focus: [i, j],
              state: snap({ stage: "output", active: { i: i, j: j }, work: { kind: "compose", i: i, terms: terms.map((t) => ({ j: t.j, p: t.p, v: t.v.slice() })), acc: acc.map((x) => r4(x)) } })
            };
          }
        } else {
          for (let j = 0; j < n; j++) for (let t = 0; t < dv; t++) acc[t] += P[i][j] * V[j][t];
        }
        OUT[i] = acc.map((x) => r4(x));
        if (i === focus) {
          yield {
            label: `out[${i}] = [${OUT[i].join(", ")}] — the new representation of "${tokens[i]}", a convex mixture of all value vectors. Because the weights sum to 1, the output can never leave the convex hull of V.`,
            phase: "compose-done",
            focus: [i],
            state: snap({ stage: "output", active: { i: i, j: null }, work: { kind: "compose", i: i, terms: terms.map((t) => ({ j: t.j, p: t.p, v: t.v.slice() })), acc: OUT[i].slice() } })
          };
        } else {
          yield {
            label: `out[${i}] = Σ_j A[${i},j]·v_j = [${OUT[i].join(", ")}] — "${tokens[i]}" rewritten as a blend of what it attended to.`,
            phase: "compose",
            focus: [i],
            state: snap({ stage: "output", active: { i: i, j: null } })
          };
        }
      }

      yield {
        label: `Done. O is (${n}×${dv}); in a real block it is concatenated with the other heads and projected by W_O. Total cost: O(n²·d) time — the n² is why context length is expensive, and why FlashAttention and KV caches exist.`,
        phase: "done",
        state: snap({ stage: "output" })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const parse = (hex) => {
        if (typeof hex !== "string" || hex[0] !== "#") return [128, 128, 128];
        let h = hex.slice(1);
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        const v = parseInt(h.slice(0, 6), 16);
        return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
      };
      const mix = (a, b, t) => {
        const A = parse(a), B = parse(b);
        t = Math.max(0, Math.min(1, t));
        return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
      };
      const num = (v, d) => (v === null || v === undefined) ? "" : v.toFixed(d === undefined ? 2 : d);

      const n = s.n;
      const bottomH = 92;
      // Reserved header band: title (y=20), meta caption (y=38), axis label
      // (y=58) and column headers (y=76) each get their own row so nothing
      // ever collides, however long the mode caption gets.
      const titleY = 20, metaY = 38, axisLabelY = 58, colHeaderY = 76;
      const top = 92;
      const labelW = 62;
      const mx = labelW + 14, my = top;
      const py0 = H - bottomH - 4; // top of the bottom Q/K/V panel
      const availH = py0 - my - 8;
      const cell = Math.max(22, Math.min(92, availH / n, (W * 0.46 - labelW) / n));

      const showProbs = s.stage === "probs" || s.stage === "output" || (s.stage === "softmax");
      const M = (i, j) => {
        if (s.P[i][j] !== null && (s.stage === "probs" || s.stage === "output" || s.stage === "softmax")) return s.P[i][j];
        return s.S[i][j];
      };
      let maxAbs = 0.001;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = s.S[i][j];
        if (v !== null) maxAbs = Math.max(maxAbs, Math.abs(v));
      }

      // ---------------- column headers -------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `${Math.min(13, cell * 0.2)}px ${env.font.base}`;
      for (let j = 0; j < n; j++) {
        ctx.fillStyle = (s.active && s.active.j === j) ? C.viz4 : C.text2;
        ctx.fillText(s.tokens[j], mx + j * cell + cell / 2, colHeaderY);
      }
      ctx.fillStyle = C.muted;
      ctx.font = `9px ${env.font.mono}`;
      ctx.fillText("keys  j →", mx + (n * cell) / 2, axisLabelY);

      // ---------------- matrix ---------------------------------------------
      ctx.textBaseline = "middle";
      for (let i = 0; i < n; i++) {
        // row label
        ctx.textAlign = "right";
        ctx.font = `${Math.min(13, cell * 0.2)}px ${env.font.base}`;
        ctx.fillStyle = (s.active && s.active.i === i) ? C.viz4 : C.text2;
        ctx.fillText(s.tokens[i], mx - 8, my + i * cell + cell / 2);

        for (let j = 0; j < n; j++) {
          const x = mx + j * cell, y = my + i * cell;
          const masked = s.mask[i][j] === 1;
          const v = M(i, j);

          if (masked && (s.stage === "masked" || s.stage === "softmax" || s.stage === "probs" || s.stage === "output")) {
            ctx.fillStyle = C.surface;
            ctx.fillRect(x, y, cell - 1, cell - 1);
            ctx.strokeStyle = C.border;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, cell - 2, cell - 2);
            ctx.fillStyle = C.muted;
            ctx.font = `${Math.min(19, cell * 0.30)}px ${env.font.mono}`;
            ctx.textAlign = "center";
            ctx.fillText("−∞", x + cell / 2, y + cell / 2);
            continue;
          }

          if (v === null || v === undefined) {
            ctx.fillStyle = C.surface;
            ctx.fillRect(x, y, cell - 1, cell - 1);
            ctx.strokeStyle = C.grid;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, cell - 2, cell - 2);
            continue;
          }

          let t, col;
          if (showProbs && s.P[i][j] !== null) {
            t = Math.max(0, Math.min(1, s.P[i][j] / 0.6));
            col = C.viz1;
          } else {
            t = Math.min(1, Math.abs(v) / maxAbs);
            col = v >= 0 ? C.viz1 : C.viz2;
          }
          ctx.fillStyle = mix(C.surface2, col, 0.10 + 0.90 * t);
          ctx.fillRect(x, y, cell - 1, cell - 1);

          ctx.fillStyle = t > 0.55 ? C.surface : C.text;
          ctx.font = `${Math.min(18, cell * 0.28)}px ${env.font.mono}`;
          ctx.textAlign = "center";
          const digits = (showProbs && s.P[i][j] !== null) ? 3 : 2;
          ctx.fillText(num(showProbs && s.P[i][j] !== null ? s.P[i][j] : v, digits), x + cell / 2, y + cell / 2);
        }

        // row sum
        if (s.P[i][0] !== null) {
          let rs = 0;
          for (let j = 0; j < n; j++) rs += s.P[i][j];
          ctx.textAlign = "left";
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = Math.abs(rs - 1) < 1e-3 ? C.ok : C.warn;
          ctx.fillText(`Σ=${rs.toFixed(3)}`, mx + n * cell + 6, my + i * cell + cell / 2);
        }
      }

      // active cell outline
      if (s.active && s.active.i !== null && s.active.j !== null && s.active.j !== undefined) {
        ctx.strokeStyle = C.viz4;
        ctx.lineWidth = 2.4;
        ctx.strokeRect(mx + s.active.j * cell + 0.5, my + s.active.i * cell + 0.5, cell - 2, cell - 2);
      } else if (s.active && s.active.i !== null && s.active.i !== undefined) {
        ctx.strokeStyle = C.viz4;
        ctx.lineWidth = 2;
        ctx.strokeRect(mx - 0.5, my + s.active.i * cell + 0.5, n * cell, cell - 2);
      }

      // ---------------- headers --------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = `12px ${env.font.base}`;
      const title = s.stage === "init" ? "Q, K, V"
        : s.stage === "scores" ? "S = Q·Kᵀ   (raw scores)"
          : s.stage === "scaled" ? (s.scaled ? "S / √d_k" : "S  (unscaled — scaling disabled)")
            : s.stage === "masked" ? "S with causal mask"
              : s.stage === "softmax" ? "softmax(S) — in progress"
                : "A = softmax(S/√d_k)   row-stochastic";
      ctx.fillText(title, 14, titleY);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`n=${n}  d_k=${s.dk}  √d_k=${Math.sqrt(s.dk)}  ${s.causal ? "causal" : "bidirectional"}  ${s.positional ? "positional head" : "content head"}`, 14, metaY);
      ctx.textAlign = "left";
      ctx.font = `9px ${env.font.mono}`;
      ctx.fillStyle = C.muted;
      ctx.save();
      ctx.translate(12, my + (n * cell) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center";
      ctx.fillText("queries  i ↓", 0, 0);
      ctx.restore();

      // ---------------- right panel: Q/K/V rows + row bars -------------------
      const rx = mx + n * cell + 66;
      const rw = Math.max(120, W - rx - 14);
      ctx.textAlign = "left";

      const vecRow = (y, label, vec, color, hi) => {
        ctx.fillStyle = C.text2;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(label, rx, y);
        const cw = Math.min(34, (rw - 74) / vec.length);
        for (let t = 0; t < vec.length; t++) {
          const x = rx + 70 + t * cw;
          const mag = Math.min(1, Math.abs(vec[t]) / 2);
          ctx.fillStyle = mix(C.surface2, color, 0.15 + 0.7 * mag);
          ctx.fillRect(x, y - 10, cw - 2, 14);
          if (hi !== undefined && hi === t) {
            ctx.strokeStyle = C.viz4;
            ctx.lineWidth = 1.6;
            ctx.strokeRect(x + 0.5, y - 9.5, cw - 3, 13);
          }
          ctx.fillStyle = mag > 0.5 ? C.surface : C.text2;
          ctx.font = `9px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(vec[t].toFixed(1), x + (cw - 2) / 2, y);
          ctx.textAlign = "left";
        }
      };

      let ry = my + 6;
      const w = s.work;
      if (w && w.kind === "dot") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(`S[${w.i},${w.j}] = q_${s.tokens[w.i]} · k_${s.tokens[w.j]}`, rx, ry);
        ry += 24;
        vecRow(ry, `q[${w.i}]`, s.Q[w.i], C.viz1, w.full ? undefined : w.terms.length - 1);
        ry += 26;
        vecRow(ry, `k[${w.j}]`, s.K[w.j], C.viz3, w.full ? undefined : w.terms.length - 1);
        ry += 26;
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(`products: ${w.terms.map((t) => t.toFixed(2)).join("  ")}`, rx, ry);
        ry += 18;
        ctx.fillStyle = C.viz4;
        ctx.font = `13px ${env.font.mono}`;
        ctx.fillText(`Σ = ${w.acc.toFixed(3)}`, rx, ry);
      } else if (w && w.kind === "softmax") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(`softmax of row ${w.row} ("${s.tokens[w.row]}")`, rx, ry);
        ry += 20;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillStyle = C.text2;
        ctx.fillText(`max = ${w.max.toFixed(3)}`, rx, ry);
        ry += 16;
        if (w.sum !== null && w.sum !== undefined) {
          ctx.fillText(`Σ exp(sᵢ − max) = ${w.sum.toFixed(3)}`, rx, ry);
          ry += 16;
        }
        const barTop = ry + 6;
        const bh = 13;
        for (let j = 0; j < n; j++) {
          const yy = barTop + j * (bh + 4);
          if (yy > H - bottomH - 20) break;
          const val = w.probs ? w.probs[j] : (w.exps ? w.exps[j] / Math.max(1e-9, w.sum || 1) : 0);
          const shown = w.probs ? w.probs[j] : (w.exps ? w.exps[j] : 0);
          ctx.fillStyle = C.muted;
          ctx.font = `9px ${env.font.base}`;
          ctx.fillText(s.tokens[j], rx, yy + bh - 3);
          const bx = rx + 52;
          const bw2 = rw - 100;
          ctx.fillStyle = C.surface2;
          ctx.fillRect(bx, yy, bw2, bh);
          ctx.fillStyle = s.mask[w.row][j] ? C.viz8 : C.viz1;
          ctx.fillRect(bx, yy, Math.max(0, Math.min(1, val)) * bw2, bh);
          ctx.fillStyle = C.text2;
          ctx.font = `9px ${env.font.mono}`;
          ctx.textAlign = "right";
          ctx.fillText(w.probs ? shown.toFixed(3) : shown.toFixed(2), rx + rw - 4, yy + bh - 3);
          ctx.textAlign = "left";
        }
      } else if (w && w.kind === "compose") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(`out[${w.i}] = Σ_j A[${w.i},j] · v_j`, rx, ry);
        ry += 18;
        for (let t = 0; t < w.terms.length; t++) {
          const tm = w.terms[t];
          if (ry > H - bottomH - 34) break;
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillStyle = tm.p > 0.25 ? C.viz1 : C.muted;
          ctx.fillText(`${tm.p.toFixed(3)} × v_${s.tokens[tm.j]}`, rx, ry);
          const bw2 = (rw - 120) * Math.min(1, tm.p / 0.6);
          ctx.fillRect(rx + 110, ry - 8, Math.max(1, bw2), 8);
          ry += 14;
        }
        ry += 6;
        vecRow(ry, "out", w.acc, C.viz3);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.base}`;
        const lines = [
          "Q  (n × d_k)   what each token is looking for",
          "K  (n × d_k)   what each token offers",
          "V  (n × d_v)   what gets copied if the match wins",
          "",
          "A = softmax(QKᵀ / √d_k)   (n × n)",
          "O = A · V                 (n × d_v)"
        ];
        for (let i = 0; i < lines.length; i++) {
          ctx.font = i >= 4 ? `10px ${env.font.mono}` : `10px ${env.font.base}`;
          ctx.fillStyle = i >= 4 ? C.text2 : C.muted;
          ctx.fillText(lines[i], rx, ry + i * 16);
        }
        ry += lines.length * 16 + 8;
        if (s.out[0]) {
          ctx.fillStyle = C.text;
          ctx.font = `10px ${env.font.base}`;
          ctx.fillText("outputs O:", rx, ry);
          ry += 16;
          for (let i = 0; i < n && ry < H - bottomH - 16; i++) {
            if (!s.out[i]) continue;
            vecRow(ry, s.tokens[i], s.out[i], C.viz3);
            ry += 22;
          }
        }
      }

      // ---------------- bottom panel ---------------------------------------
      const py = H - bottomH - 4;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(12, py, W - 24, bottomH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.text2;
      ctx.fillText("Q  (n×d_k)", 24, py + 20);
      ctx.fillText("K  (n×d_k)", 24 + (W - 48) / 3, py + 20);
      ctx.fillText("V  (n×d_v)", 24 + 2 * (W - 48) / 3, py + 20);

      const miniW = ((W - 48) / 3) - 30;
      const cw = Math.min(26, miniW / s.dk);
      const rh = Math.min(11, (bottomH - 34) / n);
      const drawMini = (ox, M2, color, activeRow) => {
        for (let i = 0; i < n; i++) {
          for (let t = 0; t < s.dk; t++) {
            const x = ox + t * cw, y = py + 28 + i * rh;
            const mag = Math.min(1, Math.abs(M2[i][t]) / 2);
            ctx.fillStyle = mix(C.surface2, M2[i][t] >= 0 ? color : C.viz2, 0.12 + 0.8 * mag);
            ctx.fillRect(x, y, cw - 1, rh - 1);
          }
          if (activeRow === i) {
            ctx.strokeStyle = C.viz4;
            ctx.lineWidth = 1.4;
            ctx.strokeRect(ox - 0.5, py + 28 + i * rh - 0.5, s.dk * cw, rh);
          }
          ctx.fillStyle = C.muted;
          ctx.font = `8px ${env.font.base}`;
          ctx.textAlign = "right";
          ctx.fillText(s.tokens[i], ox - 4, py + 28 + i * rh + rh - 2);
          ctx.textAlign = "left";
        }
      };
      const aw = s.work && s.work.kind === "dot" ? s.work.i : (s.active ? s.active.i : null);
      const ak = s.work && s.work.kind === "dot" ? s.work.j : null;
      drawMini(24 + 44, s.Q, C.viz1, aw);
      drawMini(24 + (W - 48) / 3 + 44, s.K, C.viz3, ak);
      drawMini(24 + 2 * (W - 48) / 3 + 44, s.V, C.viz7, null);
    }
  },

  drill: {
    cards: [
      { q: "Write scaled dot-product attention.", a: "`Attention(Q,K,V) = softmax(QKᵀ / √d_k) · V`, with `Q,K: (n,d_k)`, `V: (n,d_v)`, scores `(n,n)`, output `(n,d_v)`.", tags: ["formula"] },
      { q: "Why divide by √d_k?", a: "`q·k` sums d_k independent products, so its variance is d_k and its scale is √d_k. Unscaled, softmax saturates into an argmax where its Jacobian ≈ 0 and gradients vanish. The division restores unit variance regardless of head width.", tags: ["core"] },
      { q: "Where is the causal mask applied?", a: "To the **scores**, before softmax: `S[i,j] = −∞` for `j > i`. Applied after softmax it would leave rows summing to < 1, because the future positions would already be in the denominator.", tags: ["masking"] },
      { q: "What does each row of the attention matrix sum to, and why does that matter?", a: "Exactly 1 — it is a probability distribution, so the output is a convex combination of value vectors and can never exit their convex hull.", tags: ["softmax"] },
      { q: "Why multi-head instead of one wide head?", a: "One head expresses one averaging pattern per position. h heads of width d/h give h patterns for the same FLOPs, then `W_O` mixes them. Heads empirically specialise (previous-token, induction, syntactic).", tags: ["architecture"] },
      { q: "Time and memory complexity of self-attention?", a: "O(n²·d) time; O(n²) memory naively for the score matrix, or O(n) with FlashAttention, which is exact and tiles the computation with a running softmax.", tags: ["complexity"] },
      { q: "What does a KV cache save?", a: "Past keys/values never change, so caching them turns each decode step from O(t²·d) into O(t·d). Cache size = 2·n·layers·kv_heads·d_head·bytes — usually the binding constraint on serving batch size.", tags: ["inference"] },
      { q: "Why is attention permutation-equivariant, and what fixes it?", a: "The formula contains no index arithmetic, so permuting inputs permutes outputs identically. Position is injected by positional embeddings, ALiBi score biases, or RoPE rotations applied to Q and K." , tags: ["position"] }
    ],
    sixtySecond: [
      "Derive scaled dot-product attention: what Q, K and V are, every shape, and exactly why the √d_k appears.",
      "Explain the attention cost model: why it is O(n²), what a KV cache changes, and what FlashAttention does differently."
    ]
  }
};
