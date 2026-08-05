export default {
  id: "embeddings",
  track: "ai",
  title: "Embeddings & Cosine Similarity",
  difficulty: 1,
  minutes: 15,
  tags: ["embeddings", "cosine-similarity", "vector-search", "word2vec"],

  explainer: [
    { type: "p", text: "An embedding is a way of representing a piece of text — a word, a sentence, a whole document — as a list of numbers, called a **vector**, such that pieces of text with similar meaning end up with similar-looking lists of numbers. Think of it like plotting words on a map: words that mean similar things get plotted near each other, and words that mean very different things end up far apart. Under the hood, an embedding is nothing more than a **learned lookup table**: a big matrix `E` of shape `(vocab, d)`, where `vocab` is the number of distinct tokens (words or word-pieces) the model knows about, `d` is how many numbers describe each one, and row `i` of the table is the vector for token `i`. There is nothing magical about it — it's a linear layer applied to a \"one-hot\" vector (a list of all zeros except a single 1 marking which token this is), which is exactly why looking up an embedding in code is implemented as a plain array index rather than a matrix multiplication. What makes the table *useful* is how it gets trained: the training process nudges vectors of tokens that tend to appear in similar contexts closer together, so *geometric* closeness in this number-space ends up encoding *semantic* (meaning-based) closeness." },

    { type: "h3", text: "Cosine, dot product, Euclidean — pick deliberately" },
    { type: "list", items: [
      "**Dot product** `a·b = Σ aᵢbᵢ` — multiply the matching entries of two vectors and add them up. This score is sensitive to how long (large-magnitude) each vector is, not just which direction it points. In search, that means a longer vector can outscore a shorter one that is actually a better semantic match. Some models are deliberately trained so that a longer vector *should* score higher — for them, this is a feature, not a bug: length can encode how important or confident a token is.",
      "**Cosine similarity** `a·b / (‖a‖‖b‖)`, where `‖a‖` means \"the length of vector `a`\" — this divides the dot product by both vectors' lengths, cancelling magnitude out entirely and leaving a pure measure of *direction*, always between −1 and 1. This is the default choice for text embeddings, because a long document shouldn't automatically look more relevant than a short one just because its vector happens to be longer.",
      "**Euclidean distance** — the plain straight-line distance between two points. Once both vectors have been rescaled to length 1 (called **L2 normalisation**), a neat identity holds: `‖a−b‖² = 2 − 2·cos(a,b)`. That means ranking results by Euclidean distance and ranking them by cosine similarity give the *exact same order* once vectors are normalised — a fact interviewers like to probe because it surprises people.",
      "Practical consequence: **normalise every vector once, when you build the index**, and cosine similarity search then becomes a single dot-product matrix multiplication — which is literally what every production vector database does under the hood."
    ]},

    { type: "callout", tone: "tip", text: "A cosine similarity score like `0.7` is *not* a probability, and it is not comparable between two different embedding models — 0.7 might mean \"very similar\" in one model's number-space and \"barely related\" in another's. Only the *ranking* of results within a single embedding space is meaningful. Teams that hard-code a fixed threshold like \"only show results above 0.8 similarity\" and then later swap in a new embedding model often silently break their search, because the same threshold now means something completely different." },

    { type: "h3", text: "The analogy trick, and why it is oversold" },
    { type: "p", text: "A famous demonstration of embeddings is vector arithmetic: take the vector for `king`, subtract the vector for `man`, add the vector for `woman`, and the result lands close to the vector for `queen`. This works because the training objectives used by classic word-embedding methods like word2vec and GloVe end up making certain *offsets* consistent across the whole vocabulary: the direction you travel going from `man` to `king` turns out to be roughly the same direction you'd travel going from `woman` to `queen` — a reusable \"royalty\" direction baked into the geometry. But there's a catch that demos often gloss over: the standard way of evaluating this trick **explicitly excludes the three input words (`king`, `man`, `woman`) from the set of possible answers**. Without that exclusion rule, the single nearest word to the computed result is very often just one of the three inputs you started with, especially `king` itself. Mentioning this exclusion rule unprompted is a strong signal that you have actually run this experiment rather than just read about it." },

    { type: "h3", text: "Static vs contextual embeddings" },
    { type: "p", text: "Classic methods like word2vec and GloVe give exactly one vector per *word type*, meaning the word `bank` gets a single vector that has to represent an average of \"river bank\" and \"money bank\" meanings mashed together — these are called **static embeddings**. A modern transformer's raw embedding lookup table is also static in this same sense. But the vector you actually use downstream in a transformer is not that raw lookup — it's the **hidden state** (the vector representing that token) *after* the token has passed through the model's attention and processing layers, which makes it **contextual**: the word `bank` appearing in two different sentences produces two genuinely different vectors, because each one has absorbed information from the surrounding words. When people talk about \"sentence embeddings\" from a large language model, they usually mean either averaging (\"mean-pooling\") the contextual hidden states of every token in the sentence, or taking the hidden state of one special token — often from a layer partway through the model rather than the very last one — and then L2-normalising the result." },

    { type: "callout", tone: "pitfall", text: "In high-dimensional spaces, the raw hidden states coming straight out of a transformer tend to be **anisotropic** — a term meaning they all cluster tightly inside a narrow cone-shaped region of the space rather than spreading out in every direction. When that happens, almost every pair of vectors ends up with a cosine similarity of 0.9 or higher, even for completely unrelated pieces of text, making the numbers look meaninglessly high across the board. Contrastive fine-tuning (training approaches like SimCSE or the sentence-transformers library, which explicitly teach the model to spread similar and dissimilar pairs apart) or a simple mean-centering trick (subtracting the average vector from every embedding) fixes this. If someone tells you \"all my cosine similarities come out around 0.95 no matter what I compare\", this anisotropy problem is the diagnosis." },

    { type: "h3", text: "Searching at scale" },
    { type: "p", text: "If you have `N` stored vectors, each of dimension `d`, and you want to find the ones most similar to a new query vector, the straightforward approach — compare the query against every single stored vector — costs `O(N·d)` work per query. That's perfectly fine up to a few million rows, computed as one big matrix multiplication. Beyond that scale, exact search becomes too slow, so systems switch to **approximate nearest neighbour (ANN)** search, which trades a small amount of accuracy for a large speed-up. Two common approaches: **HNSW** (Hierarchical Navigable Small World, a graph structure where similar vectors are connected as neighbours, so search hops through roughly `O(log N)` connections instead of checking everything — fast and accurate, but uses a lot of memory) and **IVF-PQ** (Inverted File with Product Quantisation: first cluster all vectors into cells and only search the most promising few cells, then compress each vector into a lossy, much smaller code to save memory — far more memory-efficient, at some cost to accuracy). Every one of these systems is tuning the same fundamental trade-off: how much accuracy (**recall**, meaning the fraction of true best matches actually found) you're willing to give up in exchange for lower latency and less memory use." }
  ],

  glossary: [
    { term: "Embedding", plain: "A list of numbers (a vector) that represents a piece of text so that texts with similar meaning end up with similar-looking vectors." },
    { term: "Vector", plain: "An ordered list of numbers; in this lesson, the numeric representation of a word, sentence, or document." },
    { term: "Vocabulary (vocab)", plain: "The full set of distinct tokens — words or word-pieces — that a model has a learned vector for." },
    { term: "One-hot vector", plain: "A vector that is all zeros except for a single 1, used to mark exactly which item out of a list is being referred to." },
    { term: "Cosine similarity", plain: "A score between −1 and 1 measuring how similar the *direction* of two vectors is, ignoring how long each vector happens to be." },
    { term: "L2 normalisation", plain: "Rescaling a vector so its length becomes exactly 1, without changing the direction it points." },
    { term: "Euclidean distance", plain: "The plain straight-line distance between two points, measured the same way you'd measure distance on a map." },
    { term: "Anisotropy", plain: "A problem where a whole set of vectors clusters tightly in one narrow direction of the space instead of spreading out, making every similarity score look artificially high." },
    { term: "Contextual embedding", plain: "A vector for a word that changes depending on the sentence it appears in, because it has absorbed information from the surrounding words." },
    { term: "Static embedding", plain: "A single fixed vector for a word that never changes no matter which sentence the word appears in." },
    { term: "Approximate nearest neighbour (ANN) search", plain: "A search method that finds vectors close to a query quickly by accepting a small chance of missing the true best match, in exchange for much greater speed." },
    { term: "Recall (in search)", plain: "The fraction of the truly best matches that a search method actually manages to find." },
    { term: "HNSW", plain: "Hierarchical Navigable Small World — a graph-based approximate search method that connects similar vectors as neighbours so a search can hop toward good matches instead of checking every vector." },
    { term: "IVF-PQ", plain: "A vector-search method that first groups vectors into clusters and only searches the most relevant clusters, while also compressing each vector to save memory." }
  ],

  complexity: {
    rows: [
      { operation: "Embedding lookup", time: "O(1) per token", space: "vocab × d", note: "an index, not a matmul" },
      { operation: "Cosine similarity, one pair", time: "O(d)", space: "O(1)", note: "O(d) for the dot + 2 norms" },
      { operation: "Exact top-k over N vectors", time: "O(N·d + N log k)", space: "O(N·d)", note: "one GEMM if pre-normalised" },
      { operation: "HNSW approximate search", time: "≈O(log N · M)", space: "O(N·d + N·M)", note: "M = graph degree; recall < 1" },
      { operation: "IVF-PQ search", time: "O(nprobe · N/nlist · d')", space: "≈N · bytes_per_code", note: "compressed; big memory win" }
    ]
  },

  interview: {
    whyAsked: "It checks whether you can reason about vector spaces rather than repeat 'embeddings capture meaning'. The real signal is in the follow-ups: knowing that cosine and Euclidean rank identically after normalisation, that dot-product retrieval is magnitude-biased, and that similarity scores are model-relative — because those are the decisions that break production RAG systems.",
    followUps: [
      { q: "When would you use dot product instead of cosine?", a: "When magnitude is meaningful — e.g. models trained with a maximum-inner-product objective, or when you deliberately want longer/more confident vectors to rank higher. For general text retrieval you normalise, because otherwise document length leaks into relevance." },
      { q: "Are cosine and Euclidean interchangeable?", a: "Only on L2-normalised vectors, where ‖a−b‖² = 2 − 2·cos(a,b) — a monotone map, so the top-k ordering is identical. On unnormalised vectors they can disagree completely: a vector with the right direction but a large norm is far in Euclidean terms yet has cosine 1." },
      { q: "Why doesn't `king − man + woman` return `king`?", a: "It nearly does — the raw nearest neighbour of the result is very often one of the input words, because the offset is small relative to the vectors themselves. The standard analogy evaluation explicitly excludes all three inputs from the candidate set; that exclusion is doing a lot of the work the demo gets credit for." },
      { q: "How do you embed a document longer than the model's context?", a: "Chunk it (with overlap), embed each chunk, and either index chunks individually or aggregate — mean-pool with length weighting, or keep a hierarchy of chunk plus document vectors. Averaging a whole long document into one vector destroys the specific passages you actually need to retrieve." },
      { q: "All my cosine similarities are between 0.85 and 0.99. What's wrong?", a: "Anisotropy: raw transformer hidden states occupy a narrow cone, so everything looks similar. It is usually harmless for *ranking* but useless for thresholding. Fix by mean-centering / whitening, or by using a contrastively fine-tuned embedding model, and always evaluate ranking metrics rather than absolute scores." },
      { q: "How would you scale similarity search from 1M to 1B vectors?", a: "Exact GEMM is fine at 1M. At 1B you need ANN plus compression: IVF-PQ or HNSW with product quantisation, shard by cluster, keep the codebooks in memory, and re-rank the top few hundred candidates with full-precision vectors. You explicitly choose a recall target — say 95% — and tune nprobe/efSearch to hit it." }
    ]
  },

  code: [
    { lang: "python", label: "Cosine similarity & top-k (numpy)", code: "import numpy as np\n\ndef l2_normalize(X, eps=1e-9):\n    return X / (np.linalg.norm(X, axis=-1, keepdims=True) + eps)\n\ndef cosine(a, b):\n    return float(a @ b / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-9))\n\ndef top_k(query, E, words, k=5, exclude=()):\n    \"\"\"E: (N, d) already L2-normalised -> cosine IS the dot product.\"\"\"\n    q = query / (np.linalg.norm(query) + 1e-9)\n    scores = E @ q                              # (N,) one matmul, O(N*d)\n    order = np.argsort(-scores)\n    out = []\n    for i in order:\n        if words[i] in exclude:                 # <- the analogy caveat\n            continue\n        out.append((words[i], float(scores[i])))\n        if len(out) == k:\n            break\n    return out\n\n# analogy: king - man + woman\n# target = E[king] - E[man] + E[woman]\n# top_k(target, E, words, exclude={'king', 'man', 'woman'})" },
    { lang: "python", label: "Cosine == Euclidean after normalising", code: "import numpy as np\nrng = np.random.default_rng(0)\n\nA = rng.normal(size=(500, 64))\nq = rng.normal(size=64)\n\nAn = A / np.linalg.norm(A, axis=1, keepdims=True)\nqn = q / np.linalg.norm(q)\n\ncos_rank = np.argsort(-(An @ qn))\nl2_rank  = np.argsort(np.linalg.norm(An - qn, axis=1))\nprint((cos_rank == l2_rank).all())      # True\n\n# because  ||a-b||^2 = ||a||^2 + ||b||^2 - 2 a.b  =  2 - 2*cos  when both are unit\nunn_rank = np.argsort(np.linalg.norm(A - q, axis=1))\nprint((cos_rank == unn_rank).all())     # False -> magnitude changed the ranking" },
    { lang: "python", label: "Embedding layer = one-hot matmul", code: "import torch, torch.nn as nn\n\nemb = nn.Embedding(num_embeddings=50_000, embedding_dim=768)\nids = torch.tensor([[7, 42, 3]])          # (batch=1, seq=3)\nprint(emb(ids).shape)                     # (1, 3, 768)\n\n# identical to a one-hot matmul, just without materialising the one-hot:\none_hot = torch.zeros(3, 50_000)\none_hot[torch.arange(3), ids[0]] = 1\nassert torch.allclose(one_hot @ emb.weight, emb(ids)[0], atol=1e-6)\n\n# 50k x 768 = 38.4M params -- often 20-40% of a small model, and frequently\n# TIED to the output head (weight tying) to halve that cost." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 300 },

    params: [
      { key: "anchor", label: "Anchor word", type: "enum", options: ["king", "queen", "man", "woman", "dog", "paris", "tokyo"], default: "king" },
      { key: "analogy", label: "Analogy walk", type: "enum", options: ["king−man+woman", "paris−france+japan", "puppy−dog+cat"], default: "king−man+woman" },
      { key: "metric", label: "Metric", type: "enum", options: ["cosine", "dot"], default: "cosine" }
    ],

    frames: function* (params, rng) {
      // Hand-built 2-D "embedding table". Real ones are 768-D; the arithmetic
      // below is dimension-agnostic — 2-D is only so we can draw the arrows.
      const V = {
        king: [0.90, 1.90], queen: [-0.15, 1.85],
        prince: [0.72, 1.45], princess: [-0.30, 1.42],
        man: [0.50, 0.90], woman: [-0.50, 0.90],
        boy: [0.45, 0.62], girl: [-0.42, 0.60],
        dog: [1.75, -0.55], puppy: [1.90, -0.30],
        cat: [1.55, -0.85], kitten: [1.62, -0.95],
        paris: [-1.60, -0.70], france: [-1.75, -0.45],
        tokyo: [-1.35, -1.05], japan: [-1.55, -0.90]
      };
      const words = Object.keys(V);
      const metric = params.metric === "dot" ? "dot" : "cosine";
      const anchor = V[params.anchor] ? params.anchor : "king";

      const r3 = (v) => (Math.round(v * 1000) / 1000) || 0;
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
      const norm = (a) => Math.sqrt(dot(a, a));
      const cos = (a, b) => dot(a, b) / (norm(a) * norm(b) + 1e-12);
      const score = (a, b) => (metric === "dot" ? dot(a, b) : cos(a, b));
      const deg = (a, b) => (Math.acos(Math.max(-1, Math.min(1, cos(a, b)))) * 180) / Math.PI;

      const table = words.map((w) => ({ w: w, v: [V[w][0], V[w][1]], n: r3(norm(V[w])) }));

      const base = () => ({
        table: table.map((t) => ({ w: t.w, v: t.v.slice(), n: t.n })),
        metric: metric,
        anchor: anchor,
        anchorVec: V[anchor].slice(),
        cmp: null, cmpVec: null,
        work: null,
        ranked: [],
        target: null, targetLabel: null, walk: null, excluded: [],
        phase: "scan"
      });

      yield {
        label: `16 words as vectors. These are 2-D so they can be drawn; a real embedding table is (vocab × d) with d = 768 or 1536 — every formula below is identical, just with more terms in the sum.`,
        phase: "init",
        state: Object.assign(base(), { phase: "init" })
      };

      yield {
        label: `Metric = ${metric}. ${metric === "cosine" ? "cos(a,b) = a·b / (‖a‖‖b‖) — pure direction, magnitude cancels." : "Raw dot product a·b — longer vectors score higher regardless of direction. Watch which words this promotes."}  Anchor = "${anchor}", ‖${anchor}‖ = ${r3(norm(V[anchor]))}.`,
        phase: "init",
        state: Object.assign(base(), { phase: "init" })
      };

      // ---------------- phase 1: scan all words against the anchor ---------
      let ranked = [];
      const push = (w, sc) => {
        ranked = ranked.concat([{ w: w, s: r3(sc) }]).sort((a, b) => b.s - a.s).slice(0, 6);
      };

      const others = words.filter((w) => w !== anchor);
      for (let i = 0; i < others.length; i++) {
        const w = others[i];
        const a = V[anchor], b = V[w];
        const d = dot(a, b), na = norm(a), nb = norm(b), c = cos(a, b), ang = deg(a, b);
        const work = {
          d: r3(d), na: r3(na), nb: r3(nb), c: r3(c), ang: r3(ang),
          terms: [r3(a[0] * b[0]), r3(a[1] * b[1])],
          a: a.slice(), b: b.slice()
        };

        if (i < 2) {
          yield {
            label: `${anchor}·${w} = (${a[0]})(${b[0]}) + (${a[1]})(${b[1]}) = ${r3(a[0] * b[0])} + ${r3(a[1] * b[1])} = ${r3(d)}`,
            phase: "dot",
            state: Object.assign(base(), { cmp: w, cmpVec: b.slice(), work: Object.assign({}, work, { c: null, ang: null }), ranked: ranked.map((r) => ({ w: r.w, s: r.s })) })
          };
        }
        push(w, score(a, b));
        yield {
          label: metric === "cosine"
            ? `cos(${anchor}, ${w}) = ${r3(d)} / (${r3(na)} × ${r3(nb)}) = ${r3(c)}  →  angle ${r3(ang)}°.  ${c > 0.9 ? "Nearly the same direction — same semantic cluster." : c > 0.4 ? "Related but clearly distinct." : c > -0.1 ? "Roughly orthogonal: no shared direction." : "Opposed directions."}`
            : `${anchor}·${w} = ${r3(d)}  (cos would be ${r3(c)}; ‖${w}‖ = ${r3(nb)} scales the score${nb > 1.6 ? " — this long vector gets an unearned boost" : ""}).`,
          phase: "compare",
          focus: [i],
          state: Object.assign(base(), { cmp: w, cmpVec: b.slice(), work: work, ranked: ranked.map((r) => ({ w: r.w, s: r.s })) })
        };
      }

      yield {
        label: `Nearest neighbours of "${anchor}" by ${metric}: ${ranked.slice(0, 4).map((r) => `${r.w} ${r.s.toFixed(3)}`).join(", ")}. This ranking — not the absolute numbers — is the only thing that transfers between models.`,
        phase: "ranked",
        state: Object.assign(base(), { ranked: ranked.map((r) => ({ w: r.w, s: r.s })), phase: "ranked" })
      };

      // ---------------- phase 2: the analogy walk --------------------------
      const ANALOGIES = {
        "king−man+woman": ["king", "man", "woman", "queen"],
        "paris−france+japan": ["paris", "france", "japan", "tokyo"],
        "puppy−dog+cat": ["puppy", "dog", "cat", "kitten"]
      };
      const A = ANALOGIES[params.analogy] || ANALOGIES["king−man+woman"];
      const [wa, wb, wc, expect] = A;
      const va = V[wa], vb = V[wb], vc = V[wc];

      const step1 = [va[0], va[1]];
      const step2 = [r3(va[0] - vb[0]), r3(va[1] - vb[1])];
      const step3 = [r3(step2[0] + vc[0]), r3(step2[1] + vc[1])];

      const walkState = (walk, target) => Object.assign(base(), {
        phase: "analogy",
        walk: walk,
        target: target ? target.slice() : null,
        targetLabel: `${wa}−${wb}+${wc}`,
        excluded: [wa, wb, wc],
        ranked: []
      });

      yield {
        label: `Analogy walk: ${wa} − ${wb} + ${wc} = ?  Start at ${wa} = [${va.join(", ")}].`,
        phase: "analogy",
        state: walkState({ stage: 0, a: wa, b: wb, c: wc, va: va.slice(), vb: vb.slice(), vc: vc.slice(), cur: step1.slice() }, step1)
      };
      yield {
        label: `Subtract ${wb} = [${vb.join(", ")}] → [${step2.join(", ")}]. This offset is the "${wa} minus ${wb}" direction — in word2vec that same offset roughly maps ${wc} to its counterpart.`,
        phase: "analogy",
        state: walkState({ stage: 1, a: wa, b: wb, c: wc, va: va.slice(), vb: vb.slice(), vc: vc.slice(), cur: step2.slice() }, step2)
      };
      yield {
        label: `Add ${wc} = [${vc.join(", ")}] → target [${step3.join(", ")}]. Now find the nearest real word to this synthetic vector.`,
        phase: "analogy",
        state: walkState({ stage: 2, a: wa, b: wb, c: wc, va: va.slice(), vb: vb.slice(), vc: vc.slice(), cur: step3.slice() }, step3)
      };

      let ranked2 = [], rankedAll = [];
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        const c = cos(step3, V[w]);
        rankedAll = rankedAll.concat([{ w: w, s: r3(c) }]).sort((a, b) => b.s - a.s).slice(0, 6);
        if (A.indexOf(w) < 3 && A.indexOf(w) >= 0) {
          // an input word: scored, but excluded from the answer set
          yield {
            label: `cos(target, ${w}) = ${r3(c)} — but "${w}" is one of the three inputs, so the standard analogy evaluation EXCLUDES it. Without that rule it would often win outright.`,
            phase: "analogy-scan",
            state: Object.assign(walkState({ stage: 3, a: wa, b: wb, c: wc, va: va.slice(), vb: vb.slice(), vc: vc.slice(), cur: step3.slice() }, step3), { cmp: w, cmpVec: V[w].slice(), ranked: ranked2.map((r) => ({ w: r.w, s: r.s })) })
          };
          continue;
        }
        ranked2 = ranked2.concat([{ w: w, s: r3(c) }]).sort((a, b) => b.s - a.s).slice(0, 6);
        yield {
          label: `cos(target, ${w}) = ${r3(c)}${ranked2[0].w === w ? "  ← new best" : ""}`,
          phase: "analogy-scan",
          focus: [i],
          state: Object.assign(walkState({ stage: 3, a: wa, b: wb, c: wc, va: va.slice(), vb: vb.slice(), vc: vc.slice(), cur: step3.slice() }, step3), { cmp: w, cmpVec: V[w].slice(), ranked: ranked2.map((r) => ({ w: r.w, s: r.s })) })
        };
      }

      const winner = ranked2[0];
      yield {
        label: `Answer: ${wa} − ${wb} + ${wc} = **${winner.w}** (cos ${winner.s.toFixed(3)}${winner.w === expect ? ", the expected word" : ""}). Including the inputs, the raw top hit would have been "${rankedAll[0].w}" at ${rankedAll[0].s.toFixed(3)} — the exclusion rule is doing real work.`,
        phase: "done",
        state: Object.assign(walkState({ stage: 4, a: wa, b: wb, c: wc, va: va.slice(), vb: vb.slice(), vc: vc.slice(), cur: step3.slice() }, step3), { ranked: ranked2.map((r) => ({ w: r.w, s: r.s })), cmp: winner.w, cmpVec: V[winner.w].slice() })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const panelW = Math.min(230, W * 0.28);
      const plotW = W - panelW - 24;
      const plotH = H - 56;
      const cx = 20 + plotW * 0.46;
      const cy = 34 + plotH * 0.60;
      const scale = Math.min(plotW / 5.2, plotH / 4.4);

      const px = (v) => cx + v[0] * scale;
      const py = (v) => cy - v[1] * scale;

      // ---------- axes / grid ----------------------------------------------
      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      for (let g = -2; g <= 2; g++) {
        ctx.beginPath();
        ctx.moveTo(px([g, 0]), 30); ctx.lineTo(px([g, 0]), 30 + plotH);
        ctx.moveTo(20, py([0, g])); ctx.lineTo(20 + plotW, py([0, g]));
        ctx.stroke();
      }
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(20, cy); ctx.lineTo(20 + plotW, cy);
      ctx.moveTo(cx, 30); ctx.lineTo(cx, 30 + plotH);
      ctx.stroke();

      // ---------- arrow helper ----------------------------------------------
      const arrow = (v, color, width, dashed, alpha) => {
        const x1 = px(v), y1 = py(v);
        ctx.save();
        ctx.globalAlpha = alpha === undefined ? 1 : alpha;
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = width;
        if (dashed) ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(cx, cy); ctx.lineTo(x1, y1);
        ctx.stroke();
        ctx.setLineDash([]);
        const ang = Math.atan2(y1 - cy, x1 - cx);
        const hl = 7 + width;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - hl * Math.cos(ang - 0.4), y1 - hl * Math.sin(ang - 0.4));
        ctx.lineTo(x1 - hl * Math.cos(ang + 0.4), y1 - hl * Math.sin(ang + 0.4));
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };

      const isExcluded = (w) => s.excluded && s.excluded.indexOf(w) >= 0;

      // all words, dimmed
      ctx.textBaseline = "middle";
      for (let i = 0; i < s.table.length; i++) {
        const t = s.table[i];
        const active = t.w === s.anchor || t.w === s.cmp;
        if (active) continue;
        arrow(t.v, isExcluded(t.w) ? C.viz5 : C.muted, 1, false, isExcluded(t.w) ? 0.55 : 0.30);
        ctx.font = `10px ${env.font.base}`;
        ctx.fillStyle = isExcluded(t.w) ? C.viz5 : C.muted;
        ctx.textAlign = t.v[0] >= 0 ? "left" : "right";
        ctx.fillText(t.w, px(t.v) + (t.v[0] >= 0 ? 5 : -5), py(t.v));
      }

      // ---------- analogy walk ---------------------------------------------
      if (s.walk) {
        const w = s.walk;
        if (w.stage >= 1) {
          // draw -b as a translation from a
          const from = [w.va[0], w.va[1]];
          const to = [w.va[0] - w.vb[0], w.va[1] - w.vb[1]];
          ctx.strokeStyle = C.viz2;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(px(from), py(from)); ctx.lineTo(px(to), py(to));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = C.viz2;
          ctx.font = `10px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(`−${w.b}`, (px(from) + px(to)) / 2, (py(from) + py(to)) / 2 - 6);
        }
        if (w.stage >= 2) {
          const from = [w.va[0] - w.vb[0], w.va[1] - w.vb[1]];
          const to = [from[0] + w.vc[0], from[1] + w.vc[1]];
          ctx.strokeStyle = C.viz3;
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 3]);
          ctx.beginPath();
          ctx.moveTo(px(from), py(from)); ctx.lineTo(px(to), py(to));
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = C.viz3;
          ctx.font = `10px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(`+${w.c}`, (px(from) + px(to)) / 2, (py(from) + py(to)) / 2 - 6);
        }
        arrow(w.cur, C.viz7, 2.6, true);
        ctx.fillStyle = C.viz7;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(s.targetLabel || "target", px(w.cur) + 7, py(w.cur) - 10);
      }

      // ---------- anchor & comparison ---------------------------------------
      const showAnchor = !s.walk;
      if (showAnchor) {
        arrow(s.anchorVec, C.viz1, 3);
        ctx.fillStyle = C.viz1;
        ctx.font = `12px ${env.font.base}`;
        ctx.textAlign = s.anchorVec[0] >= 0 ? "left" : "right";
        ctx.fillText(s.anchor, px(s.anchorVec) + (s.anchorVec[0] >= 0 ? 6 : -6), py(s.anchorVec) - 8);
      }
      if (s.cmpVec) {
        arrow(s.cmpVec, C.viz4, 3);
        ctx.fillStyle = C.viz4;
        ctx.font = `12px ${env.font.base}`;
        ctx.textAlign = s.cmpVec[0] >= 0 ? "left" : "right";
        ctx.fillText(s.cmp, px(s.cmpVec) + (s.cmpVec[0] >= 0 ? 6 : -6), py(s.cmpVec) - 8);
      }

      // ---------- the cosine angle arc --------------------------------------
      const base = s.walk ? s.walk.cur : s.anchorVec;
      if (s.cmpVec && base) {
        const a0 = Math.atan2(-base[1], base[0]);
        const a1 = Math.atan2(-s.cmpVec[1], s.cmpVec[0]);
        let d = a1 - a0;
        while (d > Math.PI) d -= 2 * Math.PI;
        while (d < -Math.PI) d += 2 * Math.PI;
        const rad = Math.min(70, scale * 0.55);
        ctx.strokeStyle = C.viz7;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rad, a0, a0 + d, d < 0);
        ctx.stroke();
        const mid = a0 + d / 2;
        ctx.fillStyle = C.viz7;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const degv = Math.abs((d * 180) / Math.PI);
        ctx.fillText(`${degv.toFixed(0)}°`, cx + (rad + 14) * Math.cos(mid), cy + (rad + 14) * Math.sin(mid));
      }

      // ---------- work readout ----------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.font = `11px ${env.font.mono}`;
      if (s.work) {
        const w = s.work;
        ctx.fillStyle = C.text2;
        ctx.fillText(`a·b = ${w.terms[0]} + ${w.terms[1]} = ${w.d}`, 22, 24);
        if (w.c !== null && w.c !== undefined) {
          ctx.fillStyle = C.text;
          ctx.fillText(`‖a‖=${w.na}  ‖b‖=${w.nb}   cos = ${w.d} / ${(w.na * w.nb).toFixed(3)} = ${w.c.toFixed(3)}   θ = ${w.ang.toFixed(1)}°`, 200, 24);
        }
      } else {
        ctx.fillStyle = C.muted;
        ctx.fillText(s.metric === "cosine" ? "cos(a,b) = a·b / (‖a‖·‖b‖)   — direction only, magnitude cancels" : "score = a·b   — magnitude counts, long vectors win", 22, 24);
      }

      // ---------- neighbour panel -------------------------------------------
      const bx = W - panelW - 8, by = 34;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(bx, by - 22, panelW, Math.min(H - by - 4, 22 + 26 + s.ranked.length * 24 + 8), 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = C.text;
      ctx.font = `11px ${env.font.base}`;
      ctx.fillText(s.walk ? `nearest to ${s.targetLabel}` : `nearest to "${s.anchor}"`, bx + 10, by - 6);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(s.walk ? "inputs excluded" : `by ${s.metric}`, bx + 10, by + 8);

      const maxS = Math.max(0.001, ...s.ranked.map((r) => Math.abs(r.s)));
      for (let i = 0; i < s.ranked.length; i++) {
        const r = s.ranked[i];
        const y = by + 26 + i * 24;
        if (y > H - 12) break;
        const barW = (panelW - 96) * (Math.abs(r.s) / maxS);
        ctx.fillStyle = i === 0 ? C.viz3 : C.viz1;
        ctx.globalAlpha = i === 0 ? 0.9 : 0.45;
        ctx.fillRect(bx + 10, y + 4, Math.max(1, barW), 10);
        ctx.globalAlpha = 1;
        ctx.fillStyle = r.w === s.cmp ? C.viz4 : C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(r.w, bx + 12, y + 1);
        ctx.fillStyle = C.text2;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "right";
        ctx.fillText(r.s.toFixed(3), bx + panelW - 10, y + 12);
        ctx.textAlign = "left";
      }
    }
  },

  drill: {
    cards: [
      { q: "Write cosine similarity and say what it ignores.", a: "`cos(a,b) = a·b / (‖a‖‖b‖)` ∈ [−1,1]. It ignores magnitude entirely — it is the dot product of the L2-normalised vectors, i.e. pure direction.", tags: ["metrics"] },
      { q: "When do cosine and Euclidean give the same top-k?", a: "Whenever both vectors are L2-normalised: `‖a−b‖² = 2 − 2·cos(a,b)`, a monotone decreasing map, so the ordering is identical. On unnormalised vectors they can disagree.", tags: ["metrics"] },
      { q: "Why is a raw dot product risky for retrieval?", a: "It is magnitude-biased: a long document vector can outrank a semantically better short one. Normalise at index time unless the model was explicitly trained for inner-product search.", tags: ["retrieval"] },
      { q: "What does the analogy demo hide?", a: "The evaluation excludes the three input words. Without that, the nearest neighbour of `king − man + woman` is frequently `king` itself.", tags: ["word2vec"] },
      { q: "Static vs contextual embeddings?", a: "word2vec/GloVe give one vector per word type, so `bank` has one blended vector. A transformer's hidden states are contextual — the same token gets different vectors in different sentences.", tags: ["theory"] },
      { q: "All your cosine scores are 0.9+. Diagnosis?", a: "Anisotropy — raw transformer hidden states live in a narrow cone. Ranking may still be fine, but absolute thresholds are meaningless. Fix with mean-centering/whitening or a contrastively trained embedding model.", tags: ["pitfall"] },
      { q: "Cost of exact top-k over N vectors of dim d?", a: "`O(N·d)` for the scores (one GEMM if pre-normalised) plus `O(N log k)` to select. Fine to a few million; beyond that use HNSW or IVF-PQ.", tags: ["scale"] },
      { q: "How many parameters is a 50k × 768 embedding table, and what's the standard saving?", a: "38.4M. Weight tying — sharing the embedding matrix with the output projection — removes a second copy of it.", tags: ["shapes"] }
    ],
    sixtySecond: [
      "Explain what an embedding is, why cosine similarity is the usual metric, and when you would use a raw dot product instead.",
      "Explain how vector search scales: exact search, when it breaks, and what HNSW or IVF-PQ trade away."
    ]
  }
};
