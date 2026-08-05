export default {
  id: "transformer",
  track: "ai",
  title: "The Transformer Block",
  difficulty: 3,
  minutes: 22,
  tags: ["transformer", "residual-stream", "layernorm", "mlp"],

  explainer: [
    { type: "p", text: "A transformer block does not *transform* its input so much as **edit a running vector**. Each token carries a `d_model`-wide vector — the *residual stream* — from the embedding all the way to the output head. Every sublayer reads that stream, computes a small update, and adds it back. Nothing ever overwrites the stream; it is a shared bus that sublayers read from and write to." },

    { type: "code", lang: "python", code: "# pre-norm block (what every modern LLM uses)\nx = x + MultiHeadAttention(LayerNorm(x))   # tokens exchange information here\nx = x + MLP(LayerNorm(x))                  # and each token thinks alone here" },

    { type: "h3", text: "Two sublayers, two completely different jobs" },
    { type: "list", items: [
      "**Attention** is the only place tokens communicate. Its cost is `O(n²·d)` and it *moves* information between positions.",
      "**The MLP** is applied identically and independently to every position — it is `n` copies of the same 2-layer network, `O(n·d²)`. It holds most of the parameters (`8·d²` vs attention's `4·d²`) and is where most factual knowledge appears to be stored.",
      "So a block alternates *gather* and *process*. If asked \"where does a transformer store facts?\", the current best answer is the MLP's key-value-like structure, not attention."
    ]},

    { type: "h3", text: "Why the residual connection is load-bearing" },
    { type: "p", text: "Two reasons, and interviewers want both. **Optimisation**: the gradient reaches early layers through the identity path — `∂(x+f(x))/∂x = I + ∂f/∂x` — so the signal cannot be killed by a chain of small Jacobians. **Representation**: because sublayers only ever add, later layers can read what earlier layers wrote. The stream behaves like a bandwidth-limited communication channel between layers, which is the frame all of mechanistic interpretability is built on. Note the norm of the stream *grows* with depth as updates accumulate — which is exactly why you must normalise before reading it." },

    { type: "h3", text: "LayerNorm, and why not BatchNorm" },
    { type: "p", text: "LayerNorm standardises **across the feature dimension of a single token**: `μ` and `σ²` are computed over `d_model` values, then `y = γ·(x−μ)/√(σ²+ε) + β`. It is independent of batch size and of sequence position, so it behaves identically at training and inference and with batch size 1 — none of which is true of BatchNorm, whose statistics run across the batch and are useless for variable-length autoregressive decoding. **RMSNorm** drops the mean subtraction and the `β`, keeping only `x/RMS(x)·γ`; it is cheaper and works just as well, which is why Llama and most recent models use it." },

    { type: "callout", tone: "pitfall", text: "Pre-LN vs post-LN is a real interview question. The original 2017 paper used **post-LN** (`LayerNorm(x + Sublayer(x))`), which puts a normalisation *on* the residual path and needs a learning-rate warmup to train at all at depth. **Pre-LN** (`x + Sublayer(LayerNorm(x))`) keeps the residual path clean and identity-like, trains stably without warmup, and is what essentially every modern LLM uses — at a small cost in final quality that people fix with a final norm before the output head." },

    { type: "h3", text: "The MLP: expand, non-linearity, contract" },
    { type: "p", text: "`MLP(x) = W₂ · act(W₁x + b₁) + b₂` with `W₁: (d_model, 4·d_model)` and `W₂: (4·d_model, d_model)`. The 4× expansion is convention, not law. Modern models use **SwiGLU**, a gated variant `(W₁x ⊙ swish(W_gx))W₂`, which has three matrices instead of two, so the hidden width is cut to `⅔·4d` to keep the parameter count matched — a detail worth knowing because it is the reason you see `d_ff = 11008` for `d_model = 4096` in Llama." },

    { type: "h3", text: "Parameter budget per block, from memory" },
    { type: "list", items: [
      "Attention: `4·d²` (W_Q, W_K, W_V, W_O), independent of the number of heads — heads split `d`, they do not add to it.",
      "MLP: `8·d²` for the classic 4× two-matrix form (`d·4d` twice).",
      "Total ≈ `12·d²` per block, so an `L`-layer model is ≈ `12·L·d²` parameters excluding embeddings. For GPT-3 (`L=96, d=12288`): `12·96·12288² ≈ 174B` — which is how you sanity-check a model card in your head.",
      "Norms contribute `2·d` per norm — negligible in count, not negligible in behaviour."
    ]},

    { type: "callout", tone: "tip", text: "When asked to \"walk through a transformer\", trace **one token's vector** and name the shape at each step: `(d,) → LN → (d,) → attention over n tokens → (d,) → add → (d,) → LN → (d,) → up-project (4d,) → act → down-project (d,) → add → (d,)`. Ending on 'and the shape never changed, which is why blocks stack' is the answer they are waiting for." }
  ],

  complexity: {
    rows: [
      { operation: "Attention sublayer", time: "O(n²·d + n·d²)", space: "O(n² ) or O(n) flash", note: "the only cross-token operation" },
      { operation: "MLP sublayer", time: "O(n·d²)", space: "O(n·4d)", note: "per-position, embarrassingly parallel" },
      { operation: "LayerNorm", time: "O(n·d)", space: "O(1)", note: "stats over d_model, per token" },
      { operation: "Parameters per block", time: "—", space: "≈12·d²", note: "4d² attention + 8d² MLP" },
      { operation: "Whole model forward", time: "≈2N FLOPs/token", space: "O(n·d·L) activations", note: "N = parameter count" }
    ]
  },

  interview: {
    whyAsked: "It is the architecture question: can you describe a block precisely enough that someone could implement it, and do you understand *why* each piece is there rather than which paper introduced it. The residual-stream framing, pre-LN vs post-LN, and the 12·d² parameter estimate are the three answers that separate people who have read code from people who have read summaries.",
    followUps: [
      { q: "Why pre-LN over post-LN?", a: "Post-LN puts a normalisation on the residual path, so the identity shortcut is broken and gradients at depth become unstable — it needs learning-rate warmup and careful init. Pre-LN normalises only the sublayer's *input*, leaving `x + f(LN(x))` with a clean identity path, so deep models train without warmup. The trade is slightly worse final loss, usually recovered with a final LayerNorm before the unembedding." },
      { q: "Why LayerNorm rather than BatchNorm?", a: "LayerNorm's statistics come from a single token's features, so they are independent of batch size, sequence length and padding, and are identical at train and inference. BatchNorm's statistics come from the batch, which breaks with batch size 1, with variable-length sequences, and with autoregressive decoding where you would leak information across the batch." },
      { q: "What fraction of parameters is attention vs MLP?", a: "Roughly one third versus two thirds: 4d² for the four attention projections and 8d² for the two MLP matrices, so ~12d² per block. FLOPs split the same way at short context; at long context the n²·d attention term takes over." },
      { q: "What actually is the residual stream?", a: "The `(n, d_model)` tensor threaded through every block. Sublayers read it (through a norm), compute an update, and add — never overwrite. That makes it a linear communication channel: any layer's output is a sum of contributions from all earlier sublayers, which is what lets you decompose a model's logits into per-head and per-MLP terms." },
      { q: "Why does the MLP expand by 4×?", a: "It is empirical convention — enough width for the non-linearity to be expressive without dominating the parameter count. The ratio is a hyperparameter; SwiGLU variants use ⅔·4d because the gate adds a third matrix and they keep the parameter count constant. Nothing in the maths requires 4." },
      { q: "Where do positional signals enter this picture?", a: "Either added into the residual stream at the embedding (learned/sinusoidal positional embeddings) or applied inside attention on Q and K each layer (RoPE) or as a bias on the scores (ALiBi). The block itself contains no position-dependent operation — everything else is permutation-equivariant." }
    ]
  },

  code: [
    { lang: "python", label: "A complete pre-LN block (PyTorch)", code: "import torch, torch.nn as nn\n\nclass Block(nn.Module):\n    def __init__(self, d_model, n_heads, mult=4, p_drop=0.0):\n        super().__init__()\n        self.ln1 = nn.LayerNorm(d_model)\n        self.attn = nn.MultiheadAttention(d_model, n_heads, batch_first=True)\n        self.ln2 = nn.LayerNorm(d_model)\n        self.mlp = nn.Sequential(\n            nn.Linear(d_model, mult * d_model),   # up-project\n            nn.GELU(),\n            nn.Linear(mult * d_model, d_model),   # down-project\n            nn.Dropout(p_drop),\n        )\n\n    def forward(self, x, attn_mask=None):        # x: (B, n, d_model)\n        h = self.ln1(x)                          # normalise the READ, not the stream\n        a, _ = self.attn(h, h, h, attn_mask=attn_mask, need_weights=False)\n        x = x + a                                # residual write #1\n        x = x + self.mlp(self.ln2(x))            # residual write #2\n        return x                                 # (B, n, d_model)  -- shape preserved\n\nblk = Block(512, 8)\nprint(blk(torch.randn(2, 16, 512)).shape)        # (2, 16, 512)\nprint(sum(p.numel() for p in blk.parameters()))  # ~3.15M  ~= 12 * 512**2" },
    { lang: "python", label: "LayerNorm and RMSNorm from scratch", code: "import torch, torch.nn as nn\n\nclass LayerNorm(nn.Module):\n    def __init__(self, d, eps=1e-5):\n        super().__init__()\n        self.g = nn.Parameter(torch.ones(d))\n        self.b = nn.Parameter(torch.zeros(d))\n        self.eps = eps\n\n    def forward(self, x):                     # x: (..., d)\n        mu  = x.mean(-1, keepdim=True)        # over d_model, NOT over the batch\n        var = x.var(-1, keepdim=True, unbiased=False)\n        return self.g * (x - mu) / torch.sqrt(var + self.eps) + self.b\n\nclass RMSNorm(nn.Module):                     # Llama-style: no mean, no beta\n    def __init__(self, d, eps=1e-6):\n        super().__init__()\n        self.g = nn.Parameter(torch.ones(d))\n        self.eps = eps\n\n    def forward(self, x):\n        rms = x.pow(2).mean(-1, keepdim=True).sqrt()\n        return self.g * x / (rms + self.eps)\n\nx = torch.randn(4, 8)\nprint(LayerNorm(8)(x).mean(-1))   # ~0\nprint(LayerNorm(8)(x).std(-1))    # ~1" },
    { lang: "python", label: "Parameter budget you can do in your head", code: "def block_params(d_model, mult=4, bias=False):\n    attn = 4 * d_model * d_model                  # W_Q, W_K, W_V, W_O\n    mlp  = 2 * mult * d_model * d_model           # up + down\n    norms = 2 * 2 * d_model                       # two LayerNorms (gamma, beta)\n    return attn + mlp + norms\n\ndef model_params(L, d_model, vocab, mult=4):\n    return L * block_params(d_model, mult) + vocab * d_model   # tied embeddings\n\nprint(f\"{model_params(96, 12288, 50257)/1e9:.0f}B\")   # ~175B  (GPT-3)\nprint(f\"{model_params(32, 4096, 32000)/1e9:.1f}B\")    # ~6.6B  (Llama-7B-ish)\n\n# rule of thumb: params ~= 12 * L * d_model**2  (excluding embeddings)\n# forward FLOPs/token ~= 2 * params ; training FLOPs/token ~= 6 * params" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.8, maxFrames: 300 },

    params: [
      { key: "token", label: "Follow token", type: "int", min: 0, max: 3, default: 2 },
      { key: "norm", label: "Norm placement", type: "enum", options: ["pre-LN", "post-LN"], default: "pre-LN" },
      { key: "act", label: "MLP activation", type: "enum", options: ["gelu", "relu"], default: "gelu" },
      { key: "seed", label: "Re-init weights", type: "seed" }
    ],

    frames: function* (params, rng) {
      const names = ["The", "cat", "sat", "down"];
      const n = 4, d = 8, dff = 32, heads = 2, dh = d / heads;
      const i0 = Math.max(0, Math.min(n - 1, params.token | 0));
      const preNorm = params.norm !== "post-LN";
      const useGelu = params.act !== "relu";
      const eps = 1e-5;

      const r3 = (v) => (Math.round(v * 1000) / 1000) || 0;
      const r2 = (v) => (Math.round(v * 100) / 100) || 0;
      const gelu = (z) => 0.5 * z * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (z + 0.044715 * z * z * z)));
      const actf = (z) => (useGelu ? gelu(z) : Math.max(0, z));
      const nrm = (v) => Math.sqrt(v.reduce((a, b) => a + b * b, 0));
      const rnd = (sc) => r2((rng() * 2 - 1) * sc);

      // ---- inputs and weights (all real, all deterministic given the seed) --
      const X = [];
      for (let t = 0; t < n; t++) {
        const v = [];
        for (let k = 0; k < d; k++) v.push(rnd(1.4));
        X.push(v);
      }
      const mat = (rows, cols, sc) => {
        const M = [];
        for (let a = 0; a < rows; a++) {
          const r = [];
          for (let b = 0; b < cols; b++) r.push(rnd(sc));
          M.push(r);
        }
        return M;
      };
      const s1 = 1.2 / Math.sqrt(d), s2 = 1.2 / Math.sqrt(dff);
      const WQ = mat(d, d, s1), WK = mat(d, d, s1), WV = mat(d, d, s1), WO = mat(d, d, s1);
      const W1 = mat(d, dff, s1), W2 = mat(dff, d, s2);
      const g1 = [], b1v = [], g2 = [], b2v = [];
      for (let k = 0; k < d; k++) { g1.push(r2(1 + (rng() * 2 - 1) * 0.15)); b1v.push(rnd(0.12)); g2.push(r2(1 + (rng() * 2 - 1) * 0.15)); b2v.push(rnd(0.12)); }

      const matvec = (v, M) => {
        const out = new Array(M[0].length).fill(0);
        for (let a = 0; a < v.length; a++) for (let b = 0; b < M[0].length; b++) out[b] += v[a] * M[a][b];
        return out.map(r3);
      };
      const layernorm = (v, g, b) => {
        const mu = v.reduce((a, c) => a + c, 0) / v.length;
        const va = v.reduce((a, c) => a + (c - mu) * (c - mu), 0) / v.length;
        const xh = v.map((c) => (c - mu) / Math.sqrt(va + eps));
        const y = xh.map((c, k) => g[k] * c + b[k]);
        return { mu: r3(mu), va: r3(va), xhat: xh.map(r3), out: y.map(r3) };
      };

      const stream = [];
      const pushStream = (name, vec, note) => { stream.push({ name: name, vec: vec.slice(), note: note, norm: r3(nrm(vec)) }); };

      const snap = (extra) => Object.assign({
        names: names.slice(), n: n, d: d, dff: dff, heads: heads,
        focus: i0, preNorm: preNorm, act: useGelu ? "gelu" : "relu",
        stream: stream.map((s) => ({ name: s.name, vec: s.vec.slice(), note: s.note, norm: s.norm })),
        stage: "", work: null
      }, extra || {});

      pushStream("x  (embed+pos)", X[i0], "the residual stream enters the block");

      yield {
        label: `We follow one token — "${names[i0]}" — through one ${preNorm ? "pre-LN" : "post-LN"} block. Its residual stream is a (${d},) vector; the block will ADD two updates to it and hand back the same shape, which is exactly why blocks stack.`,
        phase: "init",
        state: snap({ stage: "enter" })
      };
      yield {
        label: `Shapes for the whole block: x (${d},) · W_Q/W_K/W_V/W_O (${d}×${d}) · W₁ (${d}×${dff}) · W₂ (${dff}×${d}). That is 4d² + 2·4d² = 12d² = ${12 * d * d} parameters — the same formula that gives GPT-3 its 175B.`,
        phase: "init",
        state: snap({ stage: "enter" })
      };

      // ================= sublayer 1: attention =============================
      let attnIn;                                  // (n, d)
      if (preNorm) {
        const L = layernorm(X[i0], g1, b1v);
        yield {
          label: `LayerNorm step 1: mean over the ${d} features of THIS token, μ = ${L.mu}. Note it is over d_model, not over the batch — that independence is why LayerNorm survives batch size 1 and autoregressive decoding.`,
          phase: "ln1",
          state: snap({ stage: "ln1", work: { kind: "ln", which: 1, step: 1, mu: L.mu, va: null, xhat: null, gamma: g1.slice(), beta: b1v.slice(), inVec: X[i0].slice(), out: null } })
        };
        yield {
          label: `Variance σ² = ${L.va} (biased, over the same ${d} features), so σ = ${r3(Math.sqrt(L.va))}.`,
          phase: "ln1",
          state: snap({ stage: "ln1", work: { kind: "ln", which: 1, step: 2, mu: L.mu, va: L.va, xhat: null, gamma: g1.slice(), beta: b1v.slice(), inVec: X[i0].slice(), out: null } })
        };
        yield {
          label: `x̂ = (x − ${L.mu}) / √(${L.va} + 1e−5) → mean 0, variance 1. The block reads a normalised copy; the stream itself is untouched.`,
          phase: "ln1",
          state: snap({ stage: "ln1", work: { kind: "ln", which: 1, step: 3, mu: L.mu, va: L.va, xhat: L.xhat.slice(), gamma: g1.slice(), beta: b1v.slice(), inVec: X[i0].slice(), out: null } })
        };
        yield {
          label: `Affine: y = γ⊙x̂ + β with learned γ, β (2d = ${2 * d} parameters). RMSNorm drops both the μ subtraction and β and works just as well — that is the Llama variant.`,
          phase: "ln1",
          state: snap({ stage: "ln1", work: { kind: "ln", which: 1, step: 4, mu: L.mu, va: L.va, xhat: L.xhat.slice(), gamma: g1.slice(), beta: b1v.slice(), inVec: X[i0].slice(), out: L.out.slice() } })
        };
        pushStream("LN₁(x)", L.out, "normalised READ of the stream");
        attnIn = X.map((v) => layernorm(v, g1, b1v).out);
      } else {
        yield {
          label: `Post-LN: attention reads the RAW stream (no normalisation first). The norm comes after the residual add — which is what makes deep post-LN models need learning-rate warmup.`,
          phase: "ln1",
          state: snap({ stage: "attn" })
        };
        attnIn = X.map((v) => v.slice());
      }

      // project
      const Qm = attnIn.map((v) => matvec(v, WQ));
      const Km = attnIn.map((v) => matvec(v, WK));
      const Vm = attnIn.map((v) => matvec(v, WV));

      yield {
        label: `Project: Q = h·W_Q, K = h·W_K, V = h·W_V, each (${d},). Split into ${heads} heads of width ${dh} — heads SPLIT d_model, they never add to it, so multi-head is free relative to single-head.`,
        phase: "attn",
        state: snap({ stage: "attn", work: { kind: "proj", label: "q / k / v", inVec: attnIn[i0].slice(), outVec: Qm[i0].slice(), extra: { k: Km[i0].slice(), v: Vm[i0].slice() } } })
      };

      const headOuts = [];
      for (let h = 0; h < heads; h++) {
        const o = h * dh;
        const q = Qm[i0].slice(o, o + dh);
        const scores = [];
        for (let j = 0; j < n; j++) {
          const kv = Km[j].slice(o, o + dh);
          let s = 0;
          for (let t = 0; t < dh; t++) s += q[t] * kv[t];
          s = s / Math.sqrt(dh);
          scores.push(r3(s));
          yield {
            label: `head ${h + 1}: score("${names[i0]}" → "${names[j]}") = q·k / √${dh} = ${r3(s)}${j === n - 1 ? "" : " …"}`,
            phase: "attn",
            focus: [j],
            state: snap({ stage: "attn", work: { kind: "attn", head: h, j: j, scores: scores.slice(), probs: null, terms: null, acc: null } })
          };
        }
        const m = Math.max.apply(null, scores);
        const ex = scores.map((s) => Math.exp(s - m));
        const su = ex.reduce((a, b) => a + b, 0);
        const probs = ex.map((e) => r3(e / su));
        let best = 0;
        for (let j = 1; j < n; j++) if (probs[j] > probs[best]) best = j;
        yield {
          label: `head ${h + 1}: softmax → [${probs.map((p) => p.toFixed(3)).join(", ")}] (sums to ${probs.reduce((a, b) => a + b, 0).toFixed(3)}). This head sends "${names[i0]}" mostly to "${names[best]}".`,
          phase: "attn",
          focus: [best],
          state: snap({ stage: "attn", work: { kind: "attn", head: h, j: null, scores: scores.slice(), probs: probs.slice(), terms: null, acc: null } })
        };
        const acc = new Array(dh).fill(0);
        const terms = [];
        for (let j = 0; j < n; j++) {
          const vv = Vm[j].slice(o, o + dh);
          for (let t = 0; t < dh; t++) acc[t] += probs[j] * vv[t];
          terms.push({ j: j, p: probs[j] });
          yield {
            label: `head ${h + 1}: out += ${probs[j].toFixed(3)} · v("${names[j]}")  →  [${acc.map(r3).join(", ")}]`,
            phase: "attn",
            focus: [j],
            state: snap({ stage: "attn", work: { kind: "attn", head: h, j: j, scores: scores.slice(), probs: probs.slice(), terms: terms.map((t) => ({ j: t.j, p: t.p })), acc: acc.map(r3) } })
          };
        }
        headOuts.push(acc.map(r3));
      }

      const concat = headOuts[0].concat(headOuts[1]);
      yield {
        label: `Concatenate the ${heads} head outputs: (${dh},) + (${dh},) → (${d},). Each head contributed a different weighted average of the same tokens — that is the entire argument for multi-head.`,
        phase: "attn",
        state: snap({ stage: "attn", work: { kind: "proj", label: "concat heads", inVec: headOuts[0].concat(headOuts[1]), outVec: concat.slice() } })
      };
      const attnOut = matvec(concat, WO);
      pushStream("attn out", attnOut, "the update attention wants to write");
      yield {
        label: `Mix the heads with W_O (${d}×${d}) → the attention sublayer's update, ‖·‖ = ${r3(nrm(attnOut))}. Nothing has been written to the stream yet.`,
        phase: "attn",
        state: snap({ stage: "attn", work: { kind: "proj", label: "W_O", inVec: concat.slice(), outVec: attnOut.slice() } })
      };

      // ---- residual add ----------------------------------------------------
      let res1 = X[i0].map((v, k) => r3(v + attnOut[k]));
      yield {
        label: `Residual write #1: x ← x + attn. Elementwise, no gating, no projection. ‖x‖ went ${r3(nrm(X[i0]))} → ${r3(nrm(res1))} — the stream's norm grows with depth, which is precisely why the next sublayer must normalise before reading it.`,
        phase: "add",
        state: snap({ stage: "add1", work: { kind: "add", a: X[i0].slice(), b: attnOut.slice(), sum: res1.slice(), aLabel: "x", bLabel: "attn" } })
      };
      pushStream("x + attn", res1, "residual write #1");

      if (!preNorm) {
        const L = layernorm(res1, g1, b1v);
        yield {
          label: `Post-LN: normalise the stream ITSELF after the add — LayerNorm(x + attn), μ = ${L.mu}, σ² = ${L.va}. This is what breaks the clean identity path and forces warmup at depth.`,
          phase: "ln1",
          state: snap({ stage: "ln1", work: { kind: "ln", which: 1, step: 4, mu: L.mu, va: L.va, xhat: L.xhat.slice(), gamma: g1.slice(), beta: b1v.slice(), inVec: res1.slice(), out: L.out.slice() } })
        };
        res1 = L.out.slice();
        pushStream("LN(x+attn)", res1, "post-LN normalises the stream");
      }

      // ================= sublayer 2: MLP ===================================
      let mlpIn;
      if (preNorm) {
        const L = layernorm(res1, g2, b2v);
        yield {
          label: `LayerNorm₂: μ = ${L.mu}, σ² = ${L.va} → x̂, then γ⊙x̂ + β. Same operation, its own parameters. The MLP reads this; the stream is still untouched.`,
          phase: "ln2",
          state: snap({ stage: "ln2", work: { kind: "ln", which: 2, step: 4, mu: L.mu, va: L.va, xhat: L.xhat.slice(), gamma: g2.slice(), beta: b2v.slice(), inVec: res1.slice(), out: L.out.slice() } })
        };
        pushStream("LN₂(x)", L.out, "normalised READ for the MLP");
        mlpIn = L.out.slice();
      } else {
        mlpIn = res1.slice();
      }

      const hidden = matvec(mlpIn, W1);
      for (let u = 0; u < 3; u++) {
        let acc = 0;
        for (let k = 0; k < d; k++) acc += mlpIn[k] * W1[k][u];
        yield {
          label: `MLP up-projection, unit ${u + 1} of ${dff}: Σ_k x[k]·W₁[k,${u}] = ${r3(acc)}. This is a per-position 2-layer net — no token talks to any other token in this sublayer.`,
          phase: "mlp",
          state: snap({ stage: "mlp", work: { kind: "mlp", step: "up-detail", unit: u, hidden: hidden.slice(0, u + 1).concat(new Array(dff - u - 1).fill(null)), inVec: mlpIn.slice(), acc: r3(acc) } })
        };
      }
      yield {
        label: `Full up-projection: (${d},) · (${d}×${dff}) → (${dff},). The 4× expansion is convention: enough width for the non-linearity to be expressive. SwiGLU variants use ⅔·4d because the gate adds a third matrix.`,
        phase: "mlp",
        state: snap({ stage: "mlp", work: { kind: "mlp", step: "up", hidden: hidden.slice(), inVec: mlpIn.slice(), acted: null } })
      };
      const acted = hidden.map((z) => r3(actf(z)));
      const nNeg = hidden.filter((z) => z < 0).length;
      yield {
        label: `Apply ${useGelu ? "GELU" : "ReLU"} elementwise. ${nNeg} of ${dff} pre-activations were negative — ${useGelu ? "GELU keeps a small negative tail, so those units still receive gradient" : "ReLU zeroes them all, which makes the layer sparse but risks dead units"}.`,
        phase: "mlp",
        state: snap({ stage: "mlp", work: { kind: "mlp", step: "act", hidden: hidden.slice(), acted: acted.slice(), inVec: mlpIn.slice() } })
      };
      const mlpOut = matvec(acted, W2);
      yield {
        label: `Down-projection: (${dff},) · (${dff}×${d}) → (${d},), ‖·‖ = ${r3(nrm(mlpOut))}. The MLP holds ${2 * d * dff} of this block's ${12 * d * d} parameters — two thirds of the block, and where most factual knowledge is thought to live.`,
        phase: "mlp",
        state: snap({ stage: "mlp", work: { kind: "mlp", step: "down", hidden: hidden.slice(), acted: acted.slice(), out: mlpOut.slice(), inVec: mlpIn.slice() } })
      };
      pushStream("mlp out", mlpOut, "the update the MLP wants to write");

      let out = res1.map((v, k) => r3(v + mlpOut[k]));
      yield {
        label: `Residual write #2: x ← x + mlp. ‖x‖ = ${r3(nrm(out))}. Two sublayers, two adds, and the shape is still (${d},).`,
        phase: "add",
        state: snap({ stage: "add2", work: { kind: "add", a: res1.slice(), b: mlpOut.slice(), sum: out.slice(), aLabel: "x", bLabel: "mlp" } })
      };
      pushStream("block output", out, "handed to the next block unchanged in shape");

      if (!preNorm) {
        const L = layernorm(out, g2, b2v);
        out = L.out.slice();
        pushStream("LN(x+mlp)", out, "post-LN's second stream normalisation");
        yield {
          label: `Post-LN normalises the stream once more. Compare the two modes: pre-LN leaves a pure identity path from input to output; post-LN inserts a normalisation into it.`,
          phase: "done",
          state: snap({ stage: "done" })
        };
      }

      yield {
        label: `Done. In: ‖x‖ = ${r3(nrm(X[i0]))}. Out: ‖x‖ = ${r3(nrm(out))}. Attention moved information BETWEEN tokens; the MLP processed each token ALONE. Stack ${12} of these and you have a small language model.`,
        phase: "done",
        state: snap({ stage: "done" })
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

      // ---------------- left: pipeline diagram -----------------------------
      const pipeW = 132;
      const stages = s.preNorm
        ? [["ln1", "LayerNorm"], ["attn", "Multi-Head Attn"], ["add1", "⊕ residual"], ["ln2", "LayerNorm"], ["mlp", "MLP 4×"], ["add2", "⊕ residual"]]
        : [["attn", "Multi-Head Attn"], ["add1", "⊕ residual"], ["ln1", "LayerNorm"], ["mlp", "MLP 4×"], ["add2", "⊕ residual"], ["ln2", "LayerNorm"]];

      ctx.textBaseline = "middle";
      ctx.textAlign = "left";
      const bh = Math.min(38, (H - 92) / stages.length);
      const bx = 12, by0 = 56;

      // residual bus
      ctx.strokeStyle = C.viz7;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(bx + 6, by0 - 12);
      ctx.lineTo(bx + 6, by0 + stages.length * bh + 6);
      ctx.stroke();
      ctx.globalAlpha = 1;

      for (let i = 0; i < stages.length; i++) {
        const y = by0 + i * bh;
        const active = s.stage === stages[i][0];
        const done = stages.findIndex((q) => q[0] === s.stage) > i || s.stage === "done";
        ctx.fillStyle = active ? mix(C.surface2, C.viz1, 0.45) : C.surface;
        ctx.strokeStyle = active ? C.viz1 : C.border;
        ctx.lineWidth = active ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(bx + 14, y + 2, pipeW - 20, bh - 6, 5);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = active ? C.text : (done ? C.text2 : C.muted);
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(stages[i][1], bx + 22, y + bh / 2 - 1);
      }
      ctx.fillStyle = C.muted;
      ctx.font = `9px ${env.font.mono}`;
      ctx.textAlign = "left";
      ctx.fillText(s.preNorm ? "pre-LN" : "post-LN", bx + 14, by0 - 24);
      ctx.fillText("residual", bx, by0 + stages.length * bh + 18);

      // ---------------- centre: residual-stream strips ----------------------
      const sx = pipeW + 26;
      const panelBottom = 108;
      const availH = H - 52 - panelBottom;
      const rows = s.stream.length;
      const rh = Math.min(30, availH / Math.max(1, rows));
      const cellW = Math.min(34, (W - sx - 250) / s.d);

      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.base}`;
      ctx.fillStyle = C.text;
      ctx.fillText(`residual stream of token "${s.names[s.focus]}"   (d_model = ${s.d})`, sx, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`sublayers ADD to this vector; they never overwrite it`, sx, 38);

      let maxAbs = 0.5;
      for (let i = 0; i < rows; i++) for (let k = 0; k < s.stream[i].vec.length; k++) maxAbs = Math.max(maxAbs, Math.abs(s.stream[i].vec[k]));

      for (let i = 0; i < rows; i++) {
        const st = s.stream[i];
        const y = 52 + i * rh;
        if (y + rh > H - panelBottom) break;
        ctx.font = `9px ${env.font.base}`;
        ctx.fillStyle = i === rows - 1 ? C.text : C.text2;
        ctx.textAlign = "right";
        ctx.fillText(st.name, sx + 92, y + rh / 2);
        for (let k = 0; k < st.vec.length; k++) {
          const x = sx + 100 + k * cellW;
          const v = st.vec[k];
          const t = Math.min(1, Math.abs(v) / maxAbs);
          ctx.fillStyle = mix(C.surface2, v >= 0 ? C.viz1 : C.viz2, 0.10 + 0.85 * t);
          ctx.fillRect(x, y + 2, cellW - 2, rh - 5);
          if (cellW >= 24 && rh >= 16) {
            ctx.fillStyle = t > 0.55 ? C.surface : C.text2;
            ctx.font = `8px ${env.font.mono}`;
            ctx.textAlign = "center";
            ctx.fillText(v.toFixed(1), x + (cellW - 2) / 2, y + rh / 2);
          }
        }
        ctx.textAlign = "left";
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = C.muted;
        ctx.fillText(`‖·‖=${st.norm.toFixed(2)}`, sx + 104 + s.d * cellW, y + rh / 2);
      }

      // ---------------- right: shapes ---------------------------------------
      const qx = sx + 104 + s.d * cellW + 62;
      if (qx < W - 90) {
        ctx.textAlign = "left";
        ctx.fillStyle = C.text2;
        ctx.font = `9px ${env.font.mono}`;
        const lines = [
          `d_model = ${s.d}`,
          `heads   = ${s.heads} × ${s.d / s.heads}`,
          `d_ff    = ${s.dff} (4×)`,
          `params  = 12·d² = ${12 * s.d * s.d}`,
          `act     = ${s.act}`
        ];
        for (let i = 0; i < lines.length; i++) ctx.fillText(lines[i], qx, 60 + i * 14);
      }

      // ---------------- bottom: work panel ----------------------------------
      const py = H - panelBottom + 6;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(12, py, W - 24, panelBottom - 14, 6);
      ctx.fill();
      ctx.stroke();

      const strip = (x, y, vec, w, hgt, label, color, showNums) => {
        ctx.textAlign = "right";
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = C.muted;
        ctx.fillText(label, x - 6, y + hgt / 2);
        let mx2 = 0.3;
        for (let k = 0; k < vec.length; k++) if (vec[k] !== null) mx2 = Math.max(mx2, Math.abs(vec[k]));
        for (let k = 0; k < vec.length; k++) {
          const cx2 = x + k * w;
          if (vec[k] === null || vec[k] === undefined) {
            ctx.fillStyle = C.surface2;
            ctx.fillRect(cx2, y, w - 1.5, hgt);
            continue;
          }
          const t = Math.min(1, Math.abs(vec[k]) / mx2);
          ctx.fillStyle = mix(C.surface2, vec[k] >= 0 ? color : C.viz2, 0.10 + 0.85 * t);
          ctx.fillRect(cx2, y, w - 1.5, hgt);
          if (showNums && w >= 22) {
            ctx.fillStyle = t > 0.55 ? C.surface : C.text2;
            ctx.font = `8px ${env.font.mono}`;
            ctx.textAlign = "center";
            ctx.fillText(vec[k].toFixed(1), cx2 + (w - 1.5) / 2, y + hgt / 2);
          }
        }
        ctx.textAlign = "left";
      };

      const w = s.work;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `10px ${env.font.mono}`;
      const wx = 78, wy = py + 16;

      if (w && w.kind === "ln") {
        ctx.fillStyle = C.text;
        ctx.fillText(`LayerNorm${w.which}   μ = ${w.mu}${w.va !== null ? `   σ² = ${w.va}   σ = ${Math.sqrt(w.va).toFixed(3)}` : ""}`, 24, py + 12);
        strip(wx, wy + 6, w.inVec, 26, 14, "x", C.viz1, true);
        if (w.xhat) strip(wx, wy + 26, w.xhat, 26, 14, "x̂", C.viz4, true);
        if (w.out) strip(wx, wy + 46, w.out, 26, 14, "γx̂+β", C.viz3, true);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText("stats are over d_model of ONE token — not over the batch", wx + 26 * s.d + 16, wy + 26);
      } else if (w && w.kind === "attn") {
        ctx.fillStyle = C.text;
        ctx.fillText(`head ${w.head + 1}  scores = q·k/√${s.d / s.heads}`, 24, py + 12);
        const bw = 92;
        for (let j = 0; j < s.n; j++) {
          const x = 24 + j * bw;
          const active = w.j === j;
          ctx.fillStyle = active ? C.viz4 : C.text2;
          ctx.font = `9px ${env.font.base}`;
          ctx.fillText(s.names[j], x, py + 30);
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = C.text;
          ctx.fillText(w.scores[j] === undefined ? "·" : w.scores[j].toFixed(3), x, py + 46);
          if (w.probs) {
            ctx.fillStyle = C.surface2;
            ctx.fillRect(x, py + 54, bw - 14, 10);
            ctx.fillStyle = C.viz1;
            ctx.fillRect(x, py + 54, (bw - 14) * w.probs[j], 10);
            ctx.fillStyle = C.text2;
            ctx.font = `9px ${env.font.mono}`;
            ctx.fillText(w.probs[j].toFixed(3), x, py + 78);
          }
        }
        if (w.acc) strip(24 + s.n * bw + 50, py + 30, w.acc, 26, 16, "head out", C.viz3, true);
      } else if (w && w.kind === "proj") {
        ctx.fillStyle = C.text;
        ctx.fillText(w.label, 24, py + 12);
        strip(wx, wy + 8, w.inVec, 24, 16, "in", C.viz1, true);
        strip(wx, wy + 34, w.outVec, 24, 16, "out", C.viz3, true);
        if (w.extra) {
          strip(wx + 24 * w.inVec.length + 60, wy + 8, w.extra.k, 20, 14, "k", C.viz4, false);
          strip(wx + 24 * w.inVec.length + 60, wy + 30, w.extra.v, 20, 14, "v", C.viz7, false);
        }
      } else if (w && w.kind === "add") {
        ctx.fillStyle = C.text;
        ctx.fillText(`residual add:  ${w.aLabel} + ${w.bLabel}`, 24, py + 12);
        strip(wx, wy + 4, w.a, 26, 14, w.aLabel, C.viz1, true);
        strip(wx, wy + 24, w.b, 26, 14, w.bLabel, C.viz4, true);
        strip(wx, wy + 46, w.sum, 26, 16, "sum", C.viz3, true);
      } else if (w && w.kind === "mlp") {
        ctx.fillStyle = C.text;
        ctx.fillText(`MLP — ${w.step}${w.unit !== undefined ? `  unit ${w.unit + 1}/${s.dff}, Σ = ${w.acc}` : ""}`, 24, py + 12);
        const perRow = 16;
        const cw = Math.min(22, (W - 140) / perRow);
        const src = w.acted && (w.step === "act" || w.step === "down") ? w.acted : w.hidden;
        for (let r = 0; r < Math.ceil(s.dff / perRow); r++) {
          const slice = src.slice(r * perRow, (r + 1) * perRow);
          strip(wx, py + 22 + r * 20, slice, cw, 16, r === 0 ? (w.acted && w.step !== "up" ? "act(h)" : "h") : "", C.viz7, cw >= 22);
        }
        if (w.out) strip(wx + perRow * cw + 60, py + 30, w.out, 24, 16, "mlp out", C.viz3, true);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText("Blue = positive component, orange = negative. Each strip is one 8-dimensional vector on the residual stream.", 24, py + 20);
        ctx.fillText(s.preNorm
          ? "pre-LN:  x ← x + Attn(LN(x));  x ← x + MLP(LN(x))   — identity path stays clean, no warmup needed"
          : "post-LN: x ← LN(x + Attn(x));  x ← LN(x + MLP(x))   — normalisation sits ON the residual path", 24, py + 42);
        ctx.fillText("Attention moves information between tokens; the MLP processes each token independently.", 24, py + 64);
      }
    }
  },

  drill: {
    cards: [
      { q: "Write a pre-LN transformer block in two lines.", a: "`x = x + MHA(LayerNorm(x))` then `x = x + MLP(LayerNorm(x))`. Shape `(B, n, d_model)` in and out — which is why blocks stack.", tags: ["architecture"] },
      { q: "What is the residual stream?", a: "The `(n, d_model)` tensor carried through every block. Sublayers read a normalised copy, compute an update and **add** it; nothing overwrites. That makes the output a linear sum of every sublayer's contribution.", tags: ["core"] },
      { q: "Pre-LN vs post-LN?", a: "Post-LN (`LN(x + f(x))`) puts a norm on the residual path and needs LR warmup to train deep. Pre-LN (`x + f(LN(x))`) keeps a clean identity path and trains stably without warmup; modern LLMs use pre-LN plus a final norm.", tags: ["stability"] },
      { q: "Why LayerNorm and not BatchNorm?", a: "LayerNorm's μ and σ² come from one token's d_model features, so they are independent of batch size, padding and position, and identical at train and inference. BatchNorm's batch statistics break with batch size 1 and autoregressive decoding.", tags: ["normalization"] },
      { q: "What is RMSNorm?", a: "LayerNorm without mean subtraction and without β: `y = γ · x / RMS(x)`. Cheaper, empirically as good; used by Llama and most recent models.", tags: ["normalization"] },
      { q: "Parameters per transformer block?", a: "≈12·d² — 4d² for W_Q/W_K/W_V/W_O and 8d² for the two 4× MLP matrices, plus 2·d per LayerNorm. A model is ≈12·L·d² excluding embeddings.", tags: ["shapes"] },
      { q: "Which sublayer mixes tokens?", a: "Only attention. The MLP is applied per position independently — it is n copies of the same 2-layer network with no cross-token communication.", tags: ["architecture"] },
      { q: "Why does the residual stream's norm grow with depth?", a: "Every sublayer adds to it and nothing subtracts, so magnitudes accumulate. That is exactly why each sublayer normalises its *read* of the stream instead of assuming a fixed scale.", tags: ["core"] }
    ],
    sixtySecond: [
      "Walk one token through a pre-LN transformer block, naming the shape after every operation and what each sublayer is for.",
      "Explain the residual stream and why pre-LN replaced post-LN in modern language models."
    ]
  }
};
