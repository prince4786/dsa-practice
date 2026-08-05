export default {
  id: "activations",
  track: "ml",
  title: "Activations & Vanishing Gradients",
  difficulty: 2,
  minutes: 16,
  tags: ["neural-networks", "activations", "initialization", "training"],

  explainer: [
    { type: "p", text: "This lesson answers a very practical question: why can a neural network with too many layers, or the wrong building blocks, simply fail to learn at all, with the loss barely moving no matter how long you train it? The answer comes directly from the backward pass covered in the backpropagation lesson. Recall the recursive formula for how the error signal `δ` (delta) flows backward, layer by layer: `δ_l = (W_{l+1}ᵀ δ_{l+1}) ⊙ f′(z_l)` — in words, the error arriving at layer `l` is the error from the next layer, routed back through that layer's weights, multiplied (`⊙` means multiply entry by entry) by the local slope of that layer's activation function, `f′(z_l)`. Applying this recursion once per layer, all the way from the output back to layer 1 in a network with `L` layers total, means the gradient reaching the very first layer is literally a **product of L separate multiplicative factors** — one per layer, chained together. This has a critical consequence: if those factors are consistently smaller than 1, their product shrinks exponentially fast toward zero as `L` grows (a **vanishing gradient**); if they are consistently larger than 1, the product grows explosively (an **exploding gradient**). Two separate things control the size of each factor: the choice of activation function contributes one part of it, and the scale used to randomly initialise the weights contributes the other." },
    { type: "h3", text: "Why sigmoid kills deep networks" },
    { type: "p", text: "The sigmoid activation function (introduced in the linear/logistic regression lesson) has a derivative, `σ′(z) = σ(z)(1−σ(z))`, that reaches a maximum value of just **0.25** — and only exactly at `z = 0` — decaying toward nearly 0 whenever `|z|` (the size of `z`, ignoring its sign) exceeds about 5. That means each sigmoid layer, even in its very best case, multiplies the backward-flowing gradient by no more than 0.25. Stack 20 such layers and the gradient reaching the first layer is attenuated by at most `0.25²⁰ ≈ 10⁻¹²` — twelve orders of magnitude smaller than where it started, effectively zero. On top of that, sigmoid's output is never negative (it always sits between 0 and 1, so it is not centred around zero), which means all the gradients flowing into a given row of weights tend to share the same sign, causing the updates to zig-zag rather than move efficiently. `tanh`, a related S-shaped function whose output ranges from −1 to 1, is at least zero-centred and has a derivative of exactly 1 at `z = 0` (better than sigmoid's 0.25), but it still saturates — its derivative still shrinks toward 0 for large `|z|` — so it suffers a milder version of the same problem." },
    { type: "h3", text: "Why ReLU works" },
    { type: "code", lang: "python", code: "relu(z)  = max(0, z)\nrelu'(z) = 1 if z > 0 else 0     # gradient is EXACTLY 1 on the active half" },
    { type: "p", text: "**ReLU** (short for Rectified Linear Unit) is a much simpler function: it just outputs `z` unchanged when `z` is positive, and outputs exactly 0 when `z` is negative. Its derivative is either exactly 1 (when the unit is 'active', meaning `z > 0`) or exactly 0 (when it's 'off'). On the active side, since the derivative is exactly 1, that layer contributes *no shrinkage or growth at all* to the backward-flowing product — the chain of multiplications 'telescopes' cleanly instead of decaying, which is what makes very deep networks trainable at all. ReLU is also sparse (roughly half of its units are off, contributing zero, at any given time) and computationally trivial. The cost is a failure mode called a **dead ReLU**: if a particular unit's input happens to be negative for every single training example (often caused by too large a learning rate pushing its bias very negative in one bad update), its derivative is permanently 0, so it receives zero gradient forever and can never recover or start contributing again. Variants like Leaky ReLU (which allows a small nonzero slope, `0.01z`, on the negative side instead of a hard 0), PReLU, ELU, and GELU all exist specifically to keep a nonzero slope on the negative side and avoid this dead-unit problem." },
    { type: "h3", text: "Initialisation is the other half of the answer" },
    { type: "list", items: [
      "**Xavier / Glorot initialisation** — sets the random starting weights so that `Var(W) = 1/n_in` (or a close variant, `2/(n_in+n_out)`), where `n_in` is the number of inputs feeding into a layer and `Var` means statistical variance (spread) of the randomly-initialised weight values. This choice is specifically designed to keep the *forward-pass* activation values from shrinking or growing layer to layer, for a symmetric, unit-slope-at-zero activation like `tanh`.",
      "**He / Kaiming initialisation** — uses `Var(W) = 2/n_in` instead, with an extra factor of 2 compared to Xavier. That factor of 2 exactly compensates for the fact that ReLU zeroes out roughly half its inputs on average, which would otherwise halve the variance of the signal passing through each layer. This is the standard default for networks using ReLU.",
      "**Initialising all weights to zero is fatal** — every unit in a layer would then compute exactly the same output and receive exactly the same gradient forever, so they can never differentiate from one another. Random initialisation is what breaks this symmetry.",
      "**Initialising with too small a spread** (for example `N(0, 0.01)`, meaning random values drawn from a normal/Gaussian distribution with a standard deviation of just 0.01, in a 30-layer network) causes the forward-pass activation values to shrink toward zero geometrically as they pass through each layer, and once the activations vanish, the gradients computed from them vanish too. The visualizer above shows this directly."
    ]},
    { type: "h3", text: "The modern stack" },
    { type: "list", items: [
      "**ReLU** — the standard choice for convolutional networks and most simple feed-forward networks. Fast, sparse, and never saturates on the positive side.",
      "**GELU / SiLU (also called Swish)** — the default choice inside transformer models today. `GELU(z) = z·Φ(z)` (where `Φ` is the cumulative distribution function of a standard normal distribution — a smooth S-shaped weighting curve) is a smooth function with a small negative dip, and it empirically trains slightly better than plain ReLU at large scale.",
      "**Softmax / sigmoid** — reserved for output layers only, specifically when the model needs to produce a probability distribution (softmax, for multiple classes) or a single probability (sigmoid, for yes/no).",
      "**Normalisation layers (LayerNorm / BatchNorm) plus residual connections** — the real, practical reason 100-layer-deep networks can train at all. A **residual connection** adds a layer's input directly to its output, `y = x + F(x)`, which gives the gradient a direct, unattenuated 'identity' path straight back through every layer (`∂L/∂x = ∂L/∂y·(I + ∂F/∂x)`, where `I` is the identity — meaning 'unchanged' — path), so there is always at least one route for the gradient to travel back through, no matter how small the rest of the layer's contribution becomes."
    ]},
    { type: "callout", tone: "pitfall", text: "Exploding gradients are the mirror-image problem, and they show up mainly in recurrent networks and near the very start of transformer training. The standard fix is **gradient clipping by global norm** — rescaling the entire gradient (across all parameters at once) so its overall length never exceeds some chosen limit (in code, `clip_grad_norm_(params, 1.0)`) — rather than clipping each individual number by value. Clipping by value changes the gradient's *direction*, not just its size, which distorts the descent path; clipping by norm only shortens its length while preserving the direction it points in." },
    { type: "callout", tone: "tip", text: "The one-sentence answer to 'how do modern networks manage to go 100+ layers deep?': residual connections give gradients an unattenuated identity path straight back through the network, normalisation layers keep each layer's input values in a well-behaved numeric range, and He initialisation combined with a non-saturating activation like ReLU or GELU stops the per-layer multiplicative factors from drifting far away from 1 in either direction." }
  ],

  glossary: [
    { term: "Activation function", plain: "The function applied to a layer's weighted sum of inputs before passing the result to the next layer — it's what lets networks represent curved, non-straight-line relationships." },
    { term: "Vanishing gradient", plain: "When the gradient flowing backward through many layers shrinks toward zero, because it is the product of many small numbers multiplied together, so early layers stop receiving any useful training signal." },
    { term: "Exploding gradient", plain: "The opposite of vanishing: the gradient flowing backward grows enormously large because it is built from a chain of numbers each bigger than 1, causing unstable, wildly swinging updates." },
    { term: "Sigmoid / tanh", plain: "Two related S-shaped activation functions. Sigmoid squashes any input into a probability between 0 and 1; tanh squashes it into a range between -1 and 1. Both flatten out (saturate) for large positive or negative inputs." },
    { term: "ReLU (Rectified Linear Unit)", plain: "An activation function that outputs the input unchanged if it's positive, and exactly 0 if it's negative. Simple, fast, and avoids the vanishing-gradient problem sigmoid and tanh suffer from." },
    { term: "Dead ReLU", plain: "A ReLU unit whose input is negative for every training example it ever sees, so it always outputs zero, receives zero gradient, and can never learn or recover." },
    { term: "Saturation", plain: "When an activation function's output barely changes even as its input changes a lot, because the input has landed in a flat part of the curve — the derivative there is close to zero." },
    { term: "Xavier / Glorot initialisation", plain: "A recipe for randomly choosing a network's starting weights so that signal strength stays roughly constant as it passes forward through layers, tuned for activations like tanh." },
    { term: "He / Kaiming initialisation", plain: "A variant of Xavier initialisation adjusted to account for ReLU zeroing out about half its inputs, keeping signal strength constant through ReLU layers. The standard default for ReLU networks." },
    { term: "GELU / SiLU (Swish)", plain: "Smooth activation functions, similar in spirit to ReLU but without a sharp corner at zero, commonly used as the default inside transformer models." },
    { term: "Residual connection", plain: "A shortcut that adds a layer's input directly to its output, giving the gradient a direct path backward through the network that doesn't get shrunk by that layer's own computation." },
    { term: "Normalisation (LayerNorm / BatchNorm)", plain: "A technique that rescales the values flowing through a network so they stay in a consistent, well-behaved numeric range from layer to layer, making deep networks much easier to train." },
    { term: "Gradient clipping", plain: "Rescaling the gradient so its overall size never exceeds a chosen limit, used to prevent exploding gradients from causing unstable, oversized training updates." }
  ],

  complexity: {
    rows: [
      { operation: "Gradient at layer 1 of an L-layer net", time: "—", space: "—", note: "‖δ₁‖ ~ ∏ ‖W‖·‖f′‖ — exponential in L" },
      { operation: "Sigmoid best-case per-layer factor", time: "—", space: "—", note: "σ′ ≤ 0.25 → 0.25^L" },
      { operation: "ReLU per-layer factor", time: "—", space: "—", note: "exactly 1 where active, 0 where dead" },
      { operation: "Gradient clipping", time: "O(d)", space: "O(1)", note: "one norm reduction over all parameters" }
    ]
  },

  interview: {
    whyAsked: "It tests whether you can reason about a network as a composition of maps rather than a stack of layers. Anyone can say 'sigmoid vanishes'; the signal is the quantitative argument (σ′ ≤ 0.25, so 0.25^L) and knowing that initialisation and residuals are the other two halves of the fix.",
    followUps: [
      { q: "Quantify the vanishing-gradient problem for sigmoid.", a: "`σ′(z) = σ(1−σ)` peaks at 0.25. The backward recursion multiplies by `f′` once per layer, so even with perfectly scaled weights a 10-layer sigmoid net attenuates the gradient by at most 0.25¹⁰ ≈ 10⁻⁶, and 20 layers by 10⁻¹². Saturated units (|z| > 5) make it far worse — σ′ there is below 0.007." },
      { q: "What is a dead ReLU and how do you avoid it?", a: "A unit whose pre-activation is negative for every input in the data: its gradient is exactly 0, so it never updates and is permanently dead. Causes: a learning rate large enough to push the bias very negative in one step, or bad init. Fixes: lower LR, He init, Leaky ReLU/ELU/GELU (nonzero left slope), and monitoring the fraction of always-zero units." },
      { q: "Derive He initialisation.", a: "For `z = Wa` with iid zero-mean entries, `Var(z) = n_in·Var(W)·E[a²]`. With ReLU on a symmetric input distribution, `E[a²] = ½·Var(z_prev)` because half the inputs are zeroed. To keep `Var(z)` constant across layers you need `n_in·Var(W)·½ = 1`, hence `Var(W) = 2/n_in`. Xavier's `1/n_in` omits the factor 2 and is right for tanh, which has no zeroing." },
      { q: "Why do residual connections help gradients?", a: "`y = x + F(x)` gives `∂L/∂x = ∂L/∂y·(I + ∂F/∂x)`. The identity term means the gradient reaching earlier layers is at least the gradient at the output, no matter how small `∂F/∂x` gets. The backward path is a sum over all subsets of blocks, so short paths dominate and depth stops being a multiplicative penalty." },
      { q: "Sigmoid vs tanh vs ReLU vs GELU — when do you use each?", a: "Sigmoid: binary output layers and gates (LSTM, attention gating) only. tanh: zero-centred, still used in RNN cells and small nets. ReLU: default hidden activation for CNNs/MLPs — cheap, non-saturating, sparse. GELU/SiLU: transformers; smooth with a small negative lobe, marginally better at scale. Never sigmoid/tanh in a deep hidden stack." },
      { q: "How do you diagnose vanishing or exploding gradients in practice?", a: "Log the per-layer gradient norm (and the ratio of gradient norm to parameter norm) every N steps. Vanishing: earlier layers' norms orders of magnitude below the later ones, and their weights barely change. Exploding: norms spiking then a NaN loss. Also watch activation statistics — saturated units and near-zero variance are the forward-side symptom." },
      { q: "Clipping by value vs by norm?", a: "Clip by global norm: compute `‖g‖` over all parameters and rescale `g ← g·min(1, c/‖g‖)`. It preserves the direction of the update. Clipping element-wise by value changes the direction — coordinates with large components get truncated relative to small ones — which distorts the descent direction, so it is only a crude last resort." }
    ]
  },

  code: [
    { lang: "python", label: "Measure per-layer gradient norms", code: "import numpy as np\n\ndef chain_grads(L=20, n=64, act=\"relu\", init=\"he\", seed=0):\n    rng = np.random.default_rng(seed)\n    f  = {\"relu\": lambda z: np.maximum(0, z),\n          \"tanh\": np.tanh,\n          \"sigmoid\": lambda z: 1 / (1 + np.exp(-z))}[act]\n    fp = {\"relu\": lambda z, a: (z > 0).astype(float),\n          \"tanh\": lambda z, a: 1 - a ** 2,\n          \"sigmoid\": lambda z, a: a * (1 - a)}[act]\n    std = {\"he\": np.sqrt(2 / n), \"xavier\": np.sqrt(1 / n), \"naive\": 0.1}[init]\n\n    Ws = [rng.normal(0, std, (n, n)) for _ in range(L)]\n    a = rng.normal(0, 1, n); zs, as_ = [], [a]\n    for W in Ws:                                   # forward\n        z = W @ a; a = f(z)\n        zs.append(z); as_.append(a)\n\n    delta = rng.normal(0, 1, n)                    # pretend dL/da_L\n    norms = []\n    for l in range(L - 1, -1, -1):                 # backward\n        delta = delta * fp(zs[l], as_[l + 1])\n        norms.append(np.linalg.norm(delta))\n        delta = Ws[l].T @ delta\n    return norms[::-1]                             # layer 1 .. L\n\nfor act in (\"sigmoid\", \"tanh\", \"relu\"):\n    g = chain_grads(act=act, init=\"he\")\n    print(f\"{act:8s} layer1/layerL = {g[0] / g[-1]:.3e}\")" },
    { lang: "python", label: "Initialisation schemes", code: "def init_layer(n_in, n_out, kind, rng):\n    if kind == \"he\":       std = np.sqrt(2.0 / n_in)     # ReLU: half the units die\n    elif kind == \"xavier\": std = np.sqrt(1.0 / n_in)     # tanh / linear\n    elif kind == \"glorot\": std = np.sqrt(2.0 / (n_in + n_out))\n    else:                  std = 0.01                    # the classic mistake\n    return rng.normal(0, std, (n_out, n_in))\n\n# torch equivalents:\n#   nn.init.kaiming_normal_(w, nonlinearity=\"relu\")\n#   nn.init.xavier_uniform_(w, gain=nn.init.calculate_gain(\"tanh\"))" },
    { lang: "python", label: "Diagnostics you actually ship", code: "def grad_report(model):\n    rows = []\n    for name, p in model.named_parameters():\n        if p.grad is None: continue\n        gn, pn = p.grad.norm().item(), p.norm().item()\n        rows.append((name, gn, gn / (pn + 1e-12)))\n    return rows          # ratio ~1e-3 healthy; 1e-8 vanished; >1 exploding\n\n# and the standard guard:\n#   torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)\n# dead-ReLU monitor:\n#   frac_dead = (activations == 0).all(dim=0).float().mean()" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 250 },

    params: [
      { key: "L", label: "Depth (layers)", type: "int", min: 4, max: 24, default: 16 },
      { key: "init", label: "Init scale", type: "enum", options: ["he", "xavier", "naive"], default: "xavier" },
      { key: "samples", label: "Input samples", type: "int", min: 1, max: 4, default: 2 },
      { key: "seed", label: "Re-init", type: "seed" }
    ],

    frames: function* (params, rng) {
      const L = params.L, n = 8, R = params.samples;
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const std = params.init === "he" ? Math.sqrt(2 / n)
        : params.init === "xavier" ? Math.sqrt(1 / n) : 0.1;

      const kinds = ["sigmoid", "tanh", "relu"];
      const F = {
        sigmoid: (z) => 1 / (1 + Math.exp(-z)),
        tanh: (z) => Math.tanh(z),
        relu: (z) => (z > 0 ? z : 0)
      };
      const FP = {
        sigmoid: (z, a) => a * (1 - a),
        tanh: (z, a) => 1 - a * a,
        relu: (z, a) => (z > 0 ? 1 : 0)
      };

      // one shared set of weights so the only difference is the activation
      const Ws = [];
      for (let l = 0; l < L; l++) {
        const M = [];
        for (let i = 0; i < n; i++) {
          const row = [];
          for (let j = 0; j < n; j++) row.push(gauss() * std);
          M.push(row);
        }
        Ws.push(M);
      }

      const logf = (v) => Math.max(-24, Math.log10(Math.max(1e-24, v)));
      const norm = (v) => Math.sqrt(v.reduce((s, t) => s + t * t, 0));

      const zs = [[], [], []], as = [[], [], []];
      const actMag = [[], [], []], gradMag = [[], [], []];
      const accum = [[], [], []];
      for (let k = 0; k < 3; k++) for (let l = 0; l <= L; l++) accum[k].push(0);

      const snap = (over) => Object.assign({
        L, n, init: params.init, kinds: kinds.slice(),
        actMag: actMag.map((a) => a.slice()),
        gradMag: gradMag.map((a) => a.slice()),
        avgGrad: accum.map((a) => a.slice()),
        layer: -1, dir: "fwd", sample: 0, samples: R, ratios: [0, 0, 0]
      }, over || {});

      yield {
        label: `A ${L}-layer chain of ${n}-wide fully-connected layers, identical weights (${params.init} init, σ = ${std.toFixed(3)}) — the only difference between the three runs is the activation. We push the same input through each, then send the same unit gradient back and measure ‖δ‖ at every layer.`,
        phase: "init",
        state: snap()
      };

      for (let s = 0; s < R; s++) {
        const x = [];
        for (let i = 0; i < n; i++) x.push(gauss());

        for (let k = 0; k < 3; k++) {
          zs[k] = []; as[k] = [x.slice()];
          actMag[k] = [norm(x) / Math.sqrt(n)];
          gradMag[k] = new Array(L).fill(null);
        }

        // ---------------- forward ----------------
        for (let l = 0; l < L; l++) {
          for (let k = 0; k < 3; k++) {
            const prev = as[k][l];
            const z = [], a = [];
            for (let i = 0; i < n; i++) {
              let acc = 0;
              for (let j = 0; j < n; j++) acc += Ws[l][i][j] * prev[j];
              if (!isFinite(acc)) acc = 0;
              z.push(acc);
              a.push(F[kinds[k]](acc));
            }
            zs[k].push(z); as[k].push(a);
            actMag[k].push(norm(a) / Math.sqrt(n));
          }
          yield {
            label: `Forward through layer ${l + 1}/${L}. RMS activation now — sigmoid ${actMag[0][l + 1].toExponential(2)}, tanh ${actMag[1][l + 1].toExponential(2)}, ReLU ${actMag[2][l + 1].toExponential(2)}. ` +
              (l === 0 ? "Sigmoid's output is centred on 0.5, not 0, which is already a problem: every gradient into a weight row will share a sign."
                : actMag[1][l + 1] < 0.02 ? "The tanh signal is collapsing toward zero — with weights this small the forward pass itself is dying, before backprop even starts."
                  : "Watch the RMS: a healthy chain keeps it roughly constant with depth, which is precisely what Xavier/He initialisation is designed to achieve."),
            phase: "forward",
            focus: [l],
            state: snap({ layer: l, dir: "fwd", sample: s })
          };
        }

        // ---------------- backward ----------------
        const seedGrad = [];
        for (let i = 0; i < n; i++) seedGrad.push(gauss());
        const gscale = norm(seedGrad);
        const deltas = [];
        for (let k = 0; k < 3; k++) deltas.push(seedGrad.map((v) => v / gscale));

        for (let l = L - 1; l >= 0; l--) {
          for (let k = 0; k < 3; k++) {
            const d = deltas[k];
            const dz = [];
            for (let i = 0; i < n; i++) {
              const v = d[i] * FP[kinds[k]](zs[k][l][i], as[k][l + 1][i]);
              dz.push(isFinite(v) ? v : 0);
            }
            gradMag[k][l] = norm(dz) / Math.sqrt(n);
            const dprev = [];
            for (let j = 0; j < n; j++) {
              let acc = 0;
              for (let i = 0; i < n; i++) acc += Ws[l][i][j] * dz[i];
              dprev.push(isFinite(acc) ? acc : 0);
            }
            deltas[k] = dprev;
          }
          const g = [gradMag[0][l], gradMag[1][l], gradMag[2][l]];
          yield {
            label: `Backward through layer ${l + 1}/${L}: ‖δ‖ = sigmoid ${g[0].toExponential(2)}, tanh ${g[1].toExponential(2)}, ReLU ${g[2].toExponential(2)}. ` +
              (l === L - 1 ? "All three start from the same unit gradient; from here each layer multiplies by W and by f′(z)."
                : `Sigmoid has lost a factor of ${(gradMag[0][L - 1] / Math.max(1e-30, g[0])).toExponential(1)} since the output layer — σ′ ≤ 0.25 means at least a 4× attenuation per layer even at its best point. ReLU's f′ is exactly 1 wherever the unit is active, so it only loses whatever ‖W‖ takes.`),
            phase: "backward",
            focus: [l],
            state: snap({ layer: l, dir: "bwd", sample: s })
          };
        }

        for (let k = 0; k < 3; k++) {
          for (let l = 0; l < L; l++) accum[k][l] += gradMag[k][l] / R;
        }

        const ratios = [0, 1, 2].map((k) => gradMag[k][0] / Math.max(1e-30, gradMag[k][L - 1]));
        yield {
          label: `Sample ${s + 1}/${R} done. Gradient at layer 1 relative to layer ${L}: sigmoid ${ratios[0].toExponential(2)}, tanh ${ratios[1].toExponential(2)}, ReLU ${ratios[2].toExponential(2)}. A ratio of 1e-8 means the first layer's weights are effectively frozen — the network is only ${L} layers on paper.`,
          phase: "summary",
          state: snap({ layer: -1, dir: "bwd", sample: s, ratios })
        };
      }

      const ratios = [0, 1, 2].map((k) => accum[k][0] / Math.max(1e-30, accum[k][L - 1]));
      yield {
        label: `Averaged over ${R} input${R === 1 ? "" : "s"} with ${params.init} init: layer-1/layer-${L} gradient ratio is ${ratios[0].toExponential(2)} (sigmoid), ${ratios[1].toExponential(2)} (tanh), ${ratios[2].toExponential(2)} (ReLU). Change the init to "naive" to see the same collapse happen to ReLU too — the activation is only half the story; the weight scale is the other half.`,
        phase: "done",
        state: snap({ layer: -1, dir: "bwd", sample: R - 1, ratios })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const series = [C.viz2, C.viz4, C.viz1];   // sigmoid, tanh, relu
      const dash = [[], [5, 3], [2, 3]];
      const L = S.L;

      const padL = 52, padR = 150, padT = 26;
      const pw = W - padL - padR;
      const gapY = 34;
      const topH = Math.round((H - padT - 44 - gapY) * 0.4);
      const botH = (H - padT - 44 - gapY) - topH;
      const topY = padT, botY = padT + topH + gapY;

      const XX = (l) => padL + (L <= 1 ? 0.5 : l / L) * pw;

      // --------- helper: log-scale panel -----------------------------------
      const panel = (y0, h, title, dataSets, loD, hiD, bars) => {
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2; ctx.strokeRect(padL, y0, pw, h);
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(title, padL, y0 - 8);
        const YY = (v) => y0 + h - ((Math.max(loD, Math.min(hiD, v)) - loD) / (hiD - loD)) * h;
        // gridlines per decade
        ctx.font = `10px ${env.font.mono}`;
        const stepD = Math.max(1, Math.ceil((hiD - loD) / 6));
        for (let d = Math.ceil(loD); d <= hiD; d += stepD) {
          const Y = YY(d);
          ctx.strokeStyle = d === 0 ? C.axis : C.grid; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(padL, Y); ctx.lineTo(padL + pw, Y); ctx.stroke();
          ctx.fillStyle = C.muted; ctx.textAlign = "right";
          ctx.fillText(`1e${d}`, padL - 6, Y + 3);
        }
        // layer ticks
        ctx.fillStyle = C.muted; ctx.textAlign = "center";
        const tick = L > 16 ? 4 : 2;
        for (let l = 0; l <= L; l += tick) {
          const X = XX(l);
          ctx.strokeStyle = C.grid;
          ctx.beginPath(); ctx.moveTo(X, y0); ctx.lineTo(X, y0 + h); ctx.stroke();
          ctx.fillText(String(l), X, y0 + h + 13);
        }
        // series
        for (let k = 0; k < dataSets.length; k++) {
          const arr = dataSets[k];
          if (!arr || !arr.length) continue;
          if (bars) {
            const bw = Math.max(1.5, (pw / L) / 4);
            ctx.fillStyle = series[k];
            for (let l = 0; l < arr.length; l++) {
              if (arr[l] === undefined || arr[l] === null) continue;
              const v = Math.log10(Math.max(1e-24, arr[l]));
              const X = XX(l + 0.5) + (k - 1) * (bw + 1);
              const Y = YY(v);
              ctx.fillRect(X - bw / 2, Y, bw, y0 + h - Y);
            }
          } else {
            ctx.strokeStyle = series[k]; ctx.lineWidth = 2;
            ctx.setLineDash(dash[k]);
            ctx.beginPath();
            let started = false;
            for (let l = 0; l < arr.length; l++) {
              if (arr[l] === undefined || arr[l] === null) continue;
              const v = Math.log10(Math.max(1e-24, arr[l]));
              const X = XX(l), Y = YY(v);
              if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
            }
            ctx.stroke(); ctx.setLineDash([]);
          }
        }
        return YY;
      };

      // ranges
      const allA = [];
      for (const arr of S.actMag) for (const v of arr) if (v > 0) allA.push(Math.log10(v));
      const allG = [];
      for (const arr of S.gradMag) for (const v of arr) if (v > 0) allG.push(Math.log10(v));
      const aHi = allA.length ? Math.ceil(Math.max.apply(null, allA)) : 1;
      const aLo = allA.length ? Math.max(-24, Math.floor(Math.min.apply(null, allA))) : -3;
      const gHi = allG.length ? Math.ceil(Math.max.apply(null, allG)) : 1;
      const gLo = allG.length ? Math.max(-24, Math.floor(Math.min.apply(null, allG))) : -6;

      panel(topY, topH, "RMS activation per layer (forward)", S.actMag, aLo, Math.max(aLo + 1, aHi), false);
      panel(botY, botH, "‖δ‖ gradient magnitude per layer (backward)", S.gradMag, gLo, Math.max(gLo + 1, gHi), true);

      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
      ctx.fillText("layer index (input → output)", padL + pw / 2, botY + botH + 32);

      // current layer marker
      if (S.layer >= 0) {
        const X = XX(S.layer + (S.dir === "bwd" ? 0.5 : 1));
        ctx.strokeStyle = C.viz7; ctx.lineWidth = 1.6;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(X, topY); ctx.lineTo(X, botY + botH); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.viz7; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(S.dir === "bwd" ? "◀ δ" : "a ▶", X, topY - 8);
      }

      // ---- legend / readouts ----------------------------------------------
      const px = W - padR + 12;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`;
      ctx.fillText(`init: ${S.init}`, px, padT + 4);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`;
      ctx.fillText(`sample ${S.sample + 1}/${S.samples}`, px, padT + 20);

      let yy = padT + 46;
      const names = ["sigmoid", "tanh", "ReLU"];
      const fprime = ["σ′ ≤ 0.25", "tanh′ ≤ 1", "1 if z>0"];
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = series[k]; ctx.lineWidth = 2.4; ctx.setLineDash(dash[k]);
        ctx.beginPath(); ctx.moveTo(px, yy - 4); ctx.lineTo(px + 18, yy - 4); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.text; ctx.font = `11px ${env.font.base}`;
        ctx.fillText(names[k], px + 24, yy);
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(fprime[k], px + 24, yy + 12);
        const g0 = S.gradMag[k][0], gL = S.gradMag[k][S.L - 1];
        if (g0 !== undefined && gL !== undefined && gL > 0) {
          ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.mono}`;
          const r = g0 / gL;
          ctx.fillText(`δ₁/δ_L ${r.toExponential(1)}`, px + 24, yy + 24);
        }
        yy += 42;
      }

      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`;
      const note = [
        "product of L Jacobians:",
        "δ₁ = ∏ Wᵀ · f′(z)",
        "",
        "< 1 per layer → vanish",
        "> 1 per layer → explode"
      ];
      for (let i = 0; i < note.length; i++) ctx.fillText(note[i], px, yy + 12 + i * 13);
    }
  },

  drill: {
    cards: [
      { q: "Why does sigmoid cause vanishing gradients? Give the number.", a: "`σ′(z) = σ(1−σ)` peaks at 0.25, so each layer multiplies the gradient by at most 0.25. Twenty layers → ≤ 0.25²⁰ ≈ 1e-12, and saturated units are far worse.", tags: ["vanishing"] },
      { q: "What is ReLU's derivative and why does that matter?", a: "Exactly 1 for z > 0 and 0 otherwise. On the active half it contributes no attenuation at all, so the backward product doesn't decay from the activation — only from the weight norms.", tags: ["relu"] },
      { q: "What is a dead ReLU?", a: "A unit with negative pre-activation for every input: gradient is exactly 0, so it never updates and stays dead. Caused by too-large LR or bad init; fixed by Leaky ReLU/ELU/GELU, lower LR, He init.", tags: ["relu"] },
      { q: "Derive He initialisation.", a: "`Var(z) = n_in·Var(W)·E[a²]`; ReLU zeroes half the inputs so `E[a²] = ½Var(z_prev)`. Setting `n_in·Var(W)·½ = 1` gives `Var(W) = 2/n_in`. Xavier's `1/n_in` is the no-zeroing (tanh) version.", tags: ["init"] },
      { q: "Why can't you initialise all weights to zero?", a: "Every unit in a layer computes the same output and receives the same gradient, so they stay identical forever — symmetry is never broken. Random init breaks it.", tags: ["init"] },
      { q: "How do residual connections fix gradient flow?", a: "`y = x + F(x)` ⇒ `∂L/∂x = ∂L/∂y(I + ∂F/∂x)`. The identity term guarantees an unattenuated path back to early layers regardless of how small ∂F/∂x is.", tags: ["architecture"] },
      { q: "Clip gradients by value or by norm, and why?", a: "By global norm: `g ← g·min(1, c/‖g‖)` preserves the update direction. Clipping element-wise by value truncates large components relative to small ones and changes the direction.", tags: ["exploding"] },
      { q: "Which activations do you use where, today?", a: "ReLU for CNN/MLP hidden layers; GELU or SiLU in transformers; tanh in RNN cells; sigmoid/softmax only at outputs and gates. Never sigmoid in a deep hidden stack.", tags: ["practice"] }
    ],
    sixtySecond: [
      "Explain vanishing gradients quantitatively and describe the three things modern architectures do to prevent them.",
      "Compare sigmoid, tanh, ReLU and GELU: derivative behaviour, failure modes, and where each belongs."
    ]
  }
};
