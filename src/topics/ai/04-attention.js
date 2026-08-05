export default {
  id: "attention",
  track: "ai",
  title: "The Attention Mechanism",
  difficulty: 2,
  minutes: 22,
  tags: ["attention", "softmax", "transformers", "qkv"],

  explainer: [
    { type: "p", text: "Attention is the mechanism that lets a language model figure out which earlier words in a sentence are relevant to understanding the current word, and then blend information from those relevant words together. Think of a room full of people at a meeting: when it's your turn to speak, you don't weigh everyone's earlier comments equally — you mostly pay attention to the couple of comments that are directly relevant to what you're about to say, and you barely register the rest. Attention gives each token (roughly, each word or word-piece) in a sentence that same ability: for every token, it looks back over every other token, decides how relevant each one is right now, and then builds a new representation of the current token by blending in more of the relevant ones and less of the irrelevant ones. Crucially, this relevance is decided by *what the words mean* (their content), not by how far apart they sit in the sentence." },

    { type: "h3", text: "What Q, K and V actually are, before any formula" },
    { type: "p", text: "To make that blending mechanical, every token produces three separate vectors (lists of numbers) from itself, each computed by its own small learned matrix. The **query** vector, `Q`, represents \"what am I looking for right now?\" — think of it as the question the current token is silently asking. The **key** vector, `K`, represents \"what do I have to offer, as a topic?\" — every token advertises itself with a key, like a label on a folder. The **value** vector, `V`, represents \"here is the actual content I'll hand over if you pick me\" — it's the substance that actually gets copied into the answer, as opposed to the label used to decide *whether* to copy it. So the process is: compare the current token's question (its query) against every other token's label (their keys) to see how well each one matches; turn those match scores into a set of percentages that add up to 100%; and then build the new output as a blend of every token's content (its value), weighted by those percentages. A token that matches well contributes a lot of its value; a token that doesn't match barely contributes anything." },

    { type: "code", lang: "python", code: "Attention(Q, K, V) = softmax( (Q @ K.T) / sqrt(d_k) ) @ V" },

    { type: "h3", text: "Walking through the computation, step by step" },
    { type: "list", items: [
      "**Step 1 — compare every query to every key.** For each pair of tokens `i` and `j`, take token `i`'s query vector and token `j`'s key vector and compute their dot product (multiply matching entries, add them up). A large dot product means \"this key matches this query well\"; a small or negative one means \"barely related\". Doing this for every pair of tokens at once is written `Q @ K.T` (`.T` means transpose, i.e. flip rows and columns), and it produces a whole grid of raw match scores — the `n × n` **score matrix**, where `n` is the number of tokens.",
      "**Step 2 — rescale the scores.** Divide every score by `√d_k` (the square root of the query/key vector's length). This is a stabilising step explained in full below — for now, just note that it keeps the scores from getting so large that the next step breaks down.",
      "**Step 3 — turn scores into percentages.** Apply **softmax** to each row of the score matrix — softmax is a function that takes a list of raw numbers and turns them into positive percentages that add up to exactly 100% (1.0), where bigger raw numbers get a disproportionately bigger share. After this step, row `i` of the matrix tells you exactly what percentage of its attention token `i` is paying to every other token.",
      "**Step 4 — blend the values.** For each token, multiply every other token's value vector by the percentage of attention it received, and add all those weighted values together. This weighted blend, written `A @ V`, becomes the token's new, updated representation — richer than before, because it now carries information copied in from whichever other tokens turned out to be relevant."
    ]},

    { type: "h3", text: "The shapes, which you will be asked to recite" },
    { type: "list", items: [
      "`X`: `(B, n, d_model)` — `B` is the batch size (how many sequences are processed together), `n` is the sequence length (number of tokens), `d_model` is the width of each token's vector representation.",
      "`W_Q, W_K`: `(d_model, d_k)`; `W_V`: `(d_model, d_v)` — these are the small learned matrices, one per attention head, that turn a token's `d_model`-wide vector into its query, key and value. In practice `d_k = d_v = d_model / h` for `h` heads (heads are explained below).",
      "`Q = X @ W_Q` → `(B, n, d_k)`; the same computation, with its own matrix, produces `K` and `V`.",
      "`S = Q @ K.T` → `(B, n, n)` — the score matrix from Step 1 above. **This `n²` term, one score per pair of tokens, is the entire cost story of transformers.**",
      "`A = softmax(S / √d_k, axis=-1)` → `(B, n, n)`, still `n × n`, but now every row is a set of percentages that **sums to exactly 1**.",
      "`O = A @ V` → `(B, n, d_v)` — the blended output from Step 4. If there are multiple heads, their outputs get concatenated (stuck together side by side) into `(B, n, d_model)`, then passed through one more learned projection matrix, `W_O`."
    ]},

    { type: "h3", text: "Why divide by √d_k — the answer they actually want" },
    { type: "p", text: "Here `d_k` is the length of the query and key vectors — how many numbers each one contains. If those numbers are independent of each other, each roughly centred around 0 with a typical spread (variance) of 1, then a dot product `q·k = Σ_{i=1..d_k} q_i k_i` (summing `d_k` products) ends up with mean 0 but **variance equal to `d_k`** — the more numbers you add together, the more the total can swing. Its standard deviation (typical spread) is therefore `√d_k`. With a realistic `d_k = 64`, raw scores can easily swing by ±8 or more before any scaling. Feeding scores that large into softmax makes it behave almost like a hard \"pick the single winner\" rule: one weight rockets close to 1, everything else collapses toward 0. That sounds fine until you consider training: in that near-all-or-nothing regime, the softmax's *slope* — how much its output changes if you nudge the input — goes almost to zero everywhere, meaning **the learning signal (the gradient) passing back through attention vanishes**, and the model can barely improve those weights. Dividing every score by `√d_k` rescales things back down to roughly unit variance, keeping the softmax's output soft and its slope alive, which keeps training working. This division is essentially a *temperature* control, chosen specifically so the right amount of cooling doesn't depend on how wide each attention head happens to be." },
    { type: "callout", tone: "pitfall", text: "Two common wrong answers to \"why divide by √d_k\": (1) \"to normalise the vectors\" — no, actually normalising a vector means dividing by its own length (`‖q‖`, `‖k‖`), which produces a completely different mechanism called cosine attention. (2) \"to stop softmax from numerically overflowing\" — that specific numerical-overflow problem is handled separately, by subtracting each row's maximum value before exponentiating (a standard numerical-stability trick, unrelated to `√d_k`). The real reason is *controlling the variance of the scores so softmax stays in a range where its gradient hasn't collapsed to zero*." },

    { type: "h3", text: "Causal masking" },
    { type: "p", text: "When a model is generating text one token at a time, it must never be allowed to peek at tokens that come later in the sequence — otherwise it would be cheating, copying the very answer it's supposed to be predicting. This restriction is called being **causal** (or **autoregressive**): each token may only attend to itself and tokens before it. It's enforced by taking the raw score matrix from Step 1 and, before running softmax, setting every score `S[i,j]` to negative infinity for every future position `j > i`. Since `exp(−∞) = 0`, those positions end up with exactly zero weight after softmax — and, just as important, they contribute nothing to the row's total either, so the remaining, legitimate weights still add up to exactly 1. This masking step must happen to the *raw scores*, before softmax, never to the *probabilities* afterward: if you instead zeroed out probabilities after softmax, the future positions would already have been counted in the denominator, and the row would add up to less than 1 — quietly under-weighting every real, allowed token." },

    { type: "h3", text: "Multi-head: why not one big head?" },
    { type: "p", text: "A single attention computation can only express one \"averaging pattern\" per token — one softmax row deciding one blend. Real language needs several different kinds of relevance checked at once (grammar, meaning, position, and more), so instead of one wide attention computation, transformers run several smaller ones in parallel, called **heads** — each with its own, separately learned `W_Q`, `W_K`, `W_V`. With `h` heads, each working on a slice of width `d_model/h`, you get `h` independent attention patterns computed for essentially the **same total amount of arithmetic and the same number of parameters** as one big head would use, and their outputs are then combined by the `W_O` matrix. Researchers studying trained models find that individual heads often specialise in interpretable ways: some become \"previous-token heads\" that always look one step back, some become \"induction heads\" (roughly: \"the last time I saw this exact token, what came right after it? probably the same thing follows now\"), and some track grammatical relationships between words. The visualiser attached to this lesson lets you switch between an example content-based head and an example position-based head so you can see this specialisation concretely." },

    { type: "h3", text: "Cost, and the tricks that fight it" },
    { type: "list", items: [
      "Because the score matrix is `n × n`, one entry per pair of tokens, attention costs `O(n²·d)` time and, if you build the full matrix, `O(n²)` memory — the *squared* term is in the sequence length `n`, which is exactly why longer context windows get expensive fast as they grow.",
      "**FlashAttention** is an implementation trick that never actually builds the full `n×n` score matrix in memory at all. Instead it processes the computation in small tiles and keeps a running, incrementally-updated version of the softmax (tracking a running maximum and running sum as it goes) — this brings memory use down to `O(n)` and, because it reads and writes far less data to and from GPU memory, makes it faster too. It computes the exact same numbers as ordinary attention, not an approximation — a distinction interviewers specifically probe for.",
      "**KV cache**: while generating text one token at a time, the keys and values of all previously-generated tokens never change once computed, so you can simply store (\"cache\") them instead of recomputing them from scratch at every step. This turns the cost of producing each new token from `O(n²·d)` down to `O(n·d)`. The size of this cache is `2 · n · layers · h · d_head · bytes` (a factor of 2 for storing both keys and values), and in practice this cache size, not raw compute, is usually the real limit on how many requests a server can serve at once.",
      "**MQA / GQA** (Multi-Query Attention / Grouped-Query Attention): instead of giving every one of the `h` query heads its own separate key/value heads, share one (MQA) or a handful (GQA) of key/value heads across all the query heads. This shrinks the KV cache substantially, which is why Llama-2 70B and most modern large models use grouped-query attention.",
      "**Cross-attention** is the same mechanism as everything above, except the query comes from one sequence (say, a decoder generating output) while the keys and values come from a *different* sequence (say, an encoder that already processed some input text) — so the score matrix has shape `(n_dec, n_enc)` instead of being square. Ordinary **self-attention**, described throughout this lesson, is simply the special case where the query, key and value all come from the same sequence."
    ]},

    { type: "callout", tone: "tip", text: "The attention formula itself contains no built-in sense of word order at all — if you shuffled the input tokens around, the outputs would shuffle around in exactly the same way, completely unaffected by the original ordering (this property is called permutation equivariance). All notion of position is injected separately: via **positional encodings** added to the token vectors before attention runs (these can be learned during training, or built from fixed sine/cosine patterns, or added as a bias called ALiBi), or via **RoPE** (Rotary Position Embedding), which rotates the `Q` and `K` vectors by an angle based on position before the dot product is taken, so the score naturally reflects how far apart two tokens are. If you're asked \"what would break without any positional information?\", the answer is that the model would see the sentence as an unordered bag of tokens — it could still tell which words are present, but never in what order." }
  ],

  glossary: [
    { term: "Token", plain: "One unit of text a language model processes at a time — roughly a word or a piece of a word." },
    { term: "Query (Q)", plain: "A vector each token produces representing the question it is silently asking: 'what information am I looking for right now?'" },
    { term: "Key (K)", plain: "A vector each token produces representing what it has to offer, used to check how well it matches other tokens' queries." },
    { term: "Value (V)", plain: "A vector each token produces holding the actual content that gets copied into the output if that token turns out to be relevant." },
    { term: "Dot product", plain: "The result of multiplying two same-length lists of numbers pair by pair and adding up all the products; used here to score how well a query matches a key." },
    { term: "Softmax", plain: "A way of turning a list of raw scores into percentages that add up to 100%, where bigger scores get a disproportionately bigger share." },
    { term: "Score matrix", plain: "The grid of numbers, one per pair of tokens, produced by comparing every query against every key before softmax is applied." },
    { term: "Gradient", plain: "A measure of how much a small change in one number would change the model's output; training uses gradients to know which direction to nudge each weight." },
    { term: "Causal masking", plain: "Forcing a token to only attend to itself and earlier tokens, by blocking out any score involving a later token before softmax runs." },
    { term: "Attention head", plain: "One self-contained copy of the query/key/value computation; a model runs several of these in parallel, each learning to notice a different kind of relationship." },
    { term: "KV cache", plain: "Stored copies of previously computed key and value vectors, kept around during text generation so they don't have to be recomputed for every new token." },
    { term: "FlashAttention", plain: "An implementation technique that computes the exact same attention result while using far less memory and time, by never building the full score grid at once." },
    { term: "Positional encoding", plain: "Extra information added to each token's vector so the model can tell where in the sequence that token sits, since attention alone has no sense of order." },
    { term: "RoPE (Rotary Position Embedding)", plain: "A technique that rotates the query and key vectors by an amount based on their position, so the attention score naturally reflects how far apart two tokens are." }
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
