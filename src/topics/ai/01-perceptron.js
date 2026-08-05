export default {
  id: "perceptron",
  track: "ai",
  title: "Neurons & the Forward Pass",
  difficulty: 1,
  minutes: 14,
  tags: ["neural-networks", "forward-pass", "activations", "shapes"],

  explainer: [
    { type: "p", text: "A neuron is a **dot product plus a bias, followed by a non-linearity**: `a = σ(w·x + b)`. A layer is many neurons sharing the same input, which is exactly one matrix multiply. Everything else in deep learning — attention, convolution, MLP blocks — is bookkeeping around that primitive." },

    { type: "h3", text: "Shapes are the whole game" },
    { type: "p", text: "For a batch of `B` examples with `d_in` features: `X` is `(B, d_in)`, the weight matrix `W` is `(d_in, d_out)`, the bias `b` is `(d_out,)` and broadcasts over the batch. Then `Z = X @ W + b` is `(B, d_out)`, and `A = σ(Z)` keeps that shape. The activation function is **elementwise** — it never mixes features, which is why the only thing that mixes information across features is the matmul." },
    { type: "callout", tone: "pitfall", text: "PyTorch's `nn.Linear(d_in, d_out)` stores `weight` with shape `(d_out, d_in)` and computes `x @ weight.T + bias`. Candidates who quote `(d_in, d_out)` from the maths and then index `layer.weight[i]` expecting an input-sized row get it backwards. `layer.weight[i]` is the incoming weight vector of **output** neuron `i`." },

    { type: "h3", text: "Why the non-linearity is not optional" },
    { type: "p", text: "Composing linear maps gives a linear map: `W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂)`. A 50-layer network with no activation is algebraically one matrix — it can only ever fit a hyperplane. `σ` is the only reason depth buys you expressive power. With a non-linearity, a single hidden layer with enough units is already a universal approximator; depth is what makes that *efficient* rather than exponentially wide." },

    { type: "h3", text: "The activation menu, and what each one costs" },
    { type: "list", items: [
      "**ReLU** `max(0, z)` — the default. Gradient is exactly 1 on the positive side, so it does not shrink gradients through depth. Cheap, sparse (about half the units output 0). Risk: a unit whose pre-activation is negative for every input gets zero gradient forever — a *dead ReLU*.",
      "**Sigmoid** `1/(1+e⁻ᶻ)` — squashes to (0,1), so it is right for a **binary output probability** and wrong for hidden layers: its max derivative is 0.25, so gradients shrink by ≥4× per layer, and it saturates flat at both ends.",
      "**tanh** — sigmoid rescaled to (−1,1); zero-centred, which helps optimisation versus sigmoid, but it still saturates.",
      "**GELU / SiLU** — smooth, roughly `z·Φ(z)`. Standard inside transformer MLPs: they keep a small gradient for slightly-negative inputs, so units recover instead of dying.",
      "**Softmax** — not really an activation but a *normaliser* over a vector; it is the multi-class output head, never a hidden layer."
    ]},

    { type: "callout", tone: "tip", text: "Initialisation is part of the forward pass. If weights are too large, activations blow up through depth; too small and they collapse to zero. He init (`std = √(2/d_in)`, for ReLU) and Xavier/Glorot (`std = √(2/(d_in+d_out))`, for tanh) both pick the scale that keeps the **variance of activations roughly constant per layer**. That is the entire justification — nothing mystical." },

    { type: "h3", text: "What training actually changes" },
    { type: "p", text: "Only `W` and `b`. The architecture, the activation and the input are fixed; a forward pass is a deterministic function of those parameters (dropout and batch-norm statistics are the two exceptions, which is why `model.eval()` exists). Parameter count for a linear layer is `d_in·d_out + d_out`, and the forward FLOP cost is about `2·d_in·d_out` per example — the classic rule of thumb that a forward pass costs ~2 FLOPs per parameter per token." }
  ],

  complexity: {
    rows: [
      { operation: "Forward, one linear layer", time: "O(B · d_in · d_out)", space: "O(B · d_out)", note: "~2 FLOPs per parameter per example" },
      { operation: "Elementwise activation", time: "O(B · d_out)", space: "O(1) extra", note: "never mixes features" },
      { operation: "Parameters of a layer", time: "—", space: "d_in·d_out + d_out", note: "bias is the +d_out" },
      { operation: "Backward pass", time: "≈2× forward", space: "O(activations)", note: "must cache activations, hence activation memory" }
    ]
  },

  interview: {
    whyAsked: "It is the shape-and-scale sanity check. Anyone can say 'neurons fire'; the signal is whether you can write the matmul with correct dimensions, explain why the non-linearity is load-bearing, and reason about what happens to activation magnitudes through depth. Every later topic (attention, conv, transformers) is graded against this baseline.",
    followUps: [
      { q: "Why can't we just stack linear layers?", a: "Because their composition is linear: `W₂(W₁x+b₁)+b₂ = (W₂W₁)x + (W₂b₁+b₂)`, a single affine map. Depth adds no expressive power at all without an elementwise non-linearity between layers — you would be paying for parameters that could be folded into one matrix." },
      { q: "What is a dead ReLU and how do you fix it?", a: "A unit whose pre-activation is negative for every input in the data: output is 0, so the local gradient is 0, so its weights never update again. Usually caused by too-large a learning rate pushing the bias very negative. Fixes: lower the LR, use He init, or switch to LeakyReLU/GELU/SiLU which keep a non-zero slope for negative inputs." },
      { q: "Why do sigmoids cause vanishing gradients but ReLU doesn't?", a: "σ'(z) = σ(z)(1−σ(z)) peaks at 0.25 and goes to ~0 in the saturated tails. Backprop multiplies these per layer, so a 10-layer sigmoid net attenuates the gradient by at least 4¹⁰ ≈ 10⁶. ReLU's derivative is exactly 1 wherever the unit is active, so the product through active paths is 1 — the magnitude is set by the weights, not by the activation." },
      { q: "How many parameters does an MLP with layers 784 → 256 → 10 have?", a: "784·256 + 256 = 200,960 for the first layer, and 256·10 + 10 = 2,570 for the second: 203,530 total. Interviewers use this to check you remember the bias terms and that you multiply, not add, the dimensions." },
      { q: "Do we need a bias if the layer is followed by LayerNorm or BatchNorm?", a: "No — the normalisation subtracts the mean and then applies its own learned shift `β`, so the preceding bias is redundant and gets absorbed. That is why `nn.Linear(..., bias=False)` is standard in transformer blocks before a norm, and it saves a small number of parameters and one kernel." },
      { q: "Why does He init use √(2/d_in) rather than √(1/d_in)?", a: "The factor 2 compensates for ReLU zeroing out roughly half the pre-activations, which halves the variance of the output. Xavier's √(1/d_in)-style scaling is derived for symmetric activations like tanh where nothing is clipped. Getting the scale wrong makes activation variance grow or shrink geometrically with depth." }
    ]
  },

  code: [
    { lang: "python", label: "Forward pass from scratch (numpy)", code: "import numpy as np\n\ndef relu(z):    return np.maximum(0.0, z)\ndef sigmoid(z): return 1.0 / (1.0 + np.exp(-z))\n\nclass MLP:\n    def __init__(self, d_in, d_hidden, d_out, rng):\n        # He init for the ReLU layer, Xavier for the output layer.\n        self.W1 = rng.normal(0, np.sqrt(2.0 / d_in),     size=(d_in, d_hidden))\n        self.b1 = np.zeros(d_hidden)\n        self.W2 = rng.normal(0, np.sqrt(1.0 / d_hidden), size=(d_hidden, d_out))\n        self.b2 = np.zeros(d_out)\n\n    def forward(self, X):            # X: (B, d_in)\n        Z1 = X @ self.W1 + self.b1   # (B, d_in) @ (d_in, d_hidden) -> (B, d_hidden)\n        A1 = relu(Z1)                # elementwise, shape unchanged\n        Z2 = A1 @ self.W2 + self.b2  # (B, d_hidden) @ (d_hidden, d_out) -> (B, d_out)\n        return sigmoid(Z2)           # (B, d_out) probabilities\n\nrng = np.random.default_rng(0)\nnet = MLP(4, 5, 1, rng)\nX = rng.normal(size=(8, 4))          # batch of 8\nprint(net.forward(X).shape)          # (8, 1)" },
    { lang: "python", label: "The same thing in PyTorch (note weight shape)", code: "import torch, torch.nn as nn\n\nnet = nn.Sequential(\n    nn.Linear(4, 5),   # weight is (5, 4)  == (d_out, d_in)\n    nn.ReLU(),\n    nn.Linear(5, 1),\n    nn.Sigmoid(),\n)\n\nx = torch.randn(8, 4)\nprint(net(x).shape)                 # torch.Size([8, 1])\nprint(net[0].weight.shape)          # torch.Size([5, 4])  <- transposed vs the maths\n\n# nn.Linear computes  x @ weight.T + bias\nassert torch.allclose(net[0](x), x @ net[0].weight.T + net[0].bias, atol=1e-6)\n\nn_params = sum(p.numel() for p in net.parameters())\nprint(n_params)                     # 4*5+5 + 5*1+1 = 31" },
    { lang: "python", label: "Why depth without a non-linearity is a lie", code: "import numpy as np\nrng = np.random.default_rng(0)\n\nW1, W2, W3 = (rng.normal(size=(4, 4)) for _ in range(3))\nx = rng.normal(size=(1, 4))\n\ndeep   = ((x @ W1) @ W2) @ W3       # 3 'layers', no activation\nfolded = x @ (W1 @ W2 @ W3)         # one matrix\nprint(np.allclose(deep, folded))    # True -> the depth bought nothing" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 240 },

    params: [
      { key: "hidden", label: "Hidden units", type: "int", min: 2, max: 6, default: 5 },
      { key: "act", label: "Hidden activation", type: "enum", options: ["relu", "tanh", "sigmoid"], default: "relu" },
      { key: "bias", label: "Bias term", type: "enum", options: ["on", "off"], default: "on" },
      { key: "seed", label: "Re-init weights", type: "seed" }
    ],

    frames: function* (params, rng) {
      const nIn = 4;
      const nH = Math.max(2, Math.min(6, params.hidden | 0 || 5));
      const act = params.act || "relu";
      const useBias = params.bias !== "off";

      const r3 = (v) => (Math.round(v * 1000) / 1000) || 0;
      const r2 = (v) => (Math.round(v * 100) / 100) || 0;
      const f = (z) =>
        act === "relu" ? Math.max(0, z) :
        act === "tanh" ? Math.tanh(z) :
        1 / (1 + Math.exp(-z));
      const sig = (z) => 1 / (1 + Math.exp(-z));
      const fmt = (v) => (v >= 0 ? " " : "") + v.toFixed(2);

      // ---- build a small, readable network -------------------------------
      const featNames = ["hours studied", "prior score", "slept well", "attended"];
      const x = [];
      for (let i = 0; i < nIn; i++) x.push(r2(rng() * 2 - 1));

      // He-style scale so activations stay O(1): std = sqrt(2/d_in)
      const scale1 = Math.sqrt(2 / nIn);
      const scale2 = Math.sqrt(2 / nH);
      const W1 = [], b1 = [];
      for (let j = 0; j < nH; j++) {
        const row = [];
        for (let i = 0; i < nIn; i++) row.push(r2((rng() * 2 - 1) * 1.6 * scale1));
        W1.push(row);
        b1.push(useBias ? r2((rng() * 2 - 1) * 0.5) : 0);
      }
      const W2 = [];
      for (let j = 0; j < nH; j++) W2.push(r2((rng() * 2 - 1) * 1.8 * scale2));
      const b2 = useBias ? r2((rng() * 2 - 1) * 0.5) : 0;

      const z1 = new Array(nH).fill(null);
      const a1 = new Array(nH).fill(null);

      const snap = (extra) => Object.assign({
        x: x.slice(),
        W1: W1.map((r) => r.slice()),
        b1: b1.slice(),
        W2: W2.slice(),
        b2: b2,
        z1: z1.slice(),
        a1: a1.slice(),
        z2: null,
        a2: null,
        nIn: nIn,
        nH: nH,
        act: act,
        useBias: useBias,
        featNames: featNames.slice(0, nIn),
        work: null,
        activeEdge: null,
        layer: 0
      }, extra || {});

      yield {
        label: `A ${nIn}→${nH}→1 network. x = [${x.map(fmt).join(", ")}] are real features; every weight on screen was sampled with He scaling, std = √(2/d_in) = ${r3(scale1)}.`,
        phase: "init",
        state: snap({ layer: 0 })
      };

      yield {
        label: `Layer 1 is one matmul: x (1×${nIn}) · W₁ (${nIn}×${nH}) + b₁ (${nH}) → z₁ (1×${nH}). We will unroll it into ${nH * nIn} multiply-accumulates so you can read the arithmetic.`,
        phase: "init",
        state: snap({ layer: 1 })
      };

      // ---- hidden layer, neuron by neuron, term by term -------------------
      for (let j = 0; j < nH; j++) {
        let acc = 0;
        const terms = [];
        for (let i = 0; i < nIn; i++) {
          const prod = W1[j][i] * x[i];
          acc += prod;
          terms.push({ w: W1[j][i], x: x[i], prod: r3(prod) });
          yield {
            label: `h${j + 1}: += w[${j + 1},${i + 1}]·x${i + 1} = ${fmt(W1[j][i])} × ${fmt(x[i])} = ${fmt(r3(prod))}  →  running sum ${fmt(r3(acc))}`,
            phase: "hidden-sum",
            focus: [j],
            state: snap({ layer: 1, activeEdge: { from: i, to: j, layer: 1 }, work: { unit: j, layer: 1, terms: terms.map((t) => ({ w: t.w, x: t.x, prod: t.prod })), bias: null, z: null, a: null, running: r3(acc) } })
          };
        }
        acc += b1[j];
        z1[j] = r3(acc);
        yield {
          label: useBias
            ? `h${j + 1}: add the bias b₁[${j + 1}] = ${fmt(b1[j])}  →  z₁[${j + 1}] = ${fmt(z1[j])}. The bias shifts the decision threshold without touching any input.`
            : `h${j + 1}: bias is off, so z₁[${j + 1}] = ${fmt(z1[j])} is a pure dot product — the unit can only threshold at the origin.`,
          phase: "hidden-bias",
          focus: [j],
          state: snap({ layer: 1, work: { unit: j, layer: 1, terms: terms.map((t) => ({ w: t.w, x: t.x, prod: t.prod })), bias: b1[j], z: z1[j], a: null, running: z1[j] } })
        };
        a1[j] = r3(f(z1[j]));
        const note =
          act === "relu"
            ? (z1[j] > 0 ? "positive, so ReLU passes it through unchanged (local gradient 1)" : "negative, so ReLU clamps it to 0 — this unit contributes nothing and receives no gradient on this example")
            : act === "tanh"
              ? "tanh squashes it into (−1, 1), zero-centred"
              : "sigmoid squashes it into (0, 1); note how compressed the output range already is";
        yield {
          label: `h${j + 1}: a₁[${j + 1}] = ${act}(${fmt(z1[j])}) = ${fmt(a1[j])} — ${note}.`,
          phase: "hidden-act",
          focus: [j],
          state: snap({ layer: 1, work: { unit: j, layer: 1, terms: terms.map((t) => ({ w: t.w, x: t.x, prod: t.prod })), bias: b1[j], z: z1[j], a: a1[j], running: a1[j] } })
        };
      }

      const nDead = a1.filter((v) => v === 0).length;
      yield {
        label: `Layer 1 done: a₁ = [${a1.map(fmt).join(", ")}]${act === "relu" ? `. ${nDead} of ${nH} units output exactly 0 — ReLU makes activations sparse` : ""}. Cost so far: ${nIn * nH} multiplies + ${nH} adds ≈ 2·${nIn * nH} FLOPs.`,
        phase: "layer1-done",
        state: snap({ layer: 1 })
      };

      // ---- output neuron --------------------------------------------------
      let acc2 = 0;
      const terms2 = [];
      for (let j = 0; j < nH; j++) {
        const prod = W2[j] * a1[j];
        acc2 += prod;
        terms2.push({ w: W2[j], x: a1[j], prod: r3(prod) });
        yield {
          label: `output: += w₂[${j + 1}]·a₁[${j + 1}] = ${fmt(W2[j])} × ${fmt(a1[j])} = ${fmt(r3(prod))}  →  running sum ${fmt(r3(acc2))}${a1[j] === 0 ? "  (dead unit contributes exactly nothing)" : ""}`,
          phase: "out-sum",
          focus: [j],
          state: snap({ layer: 2, activeEdge: { from: j, to: 0, layer: 2 }, work: { unit: 0, layer: 2, terms: terms2.map((t) => ({ w: t.w, x: t.x, prod: t.prod })), bias: null, z: null, a: null, running: r3(acc2) } })
        };
      }
      acc2 += b2;
      const z2 = r3(acc2);
      yield {
        label: `output: + b₂ = ${fmt(b2)}  →  z₂ = ${fmt(z2)}. This is the **logit** — an unbounded real number, the thing a loss like BCE-with-logits consumes directly.`,
        phase: "out-bias",
        state: snap({ layer: 2, z2: z2, work: { unit: 0, layer: 2, terms: terms2.map((t) => ({ w: t.w, x: t.x, prod: t.prod })), bias: b2, z: z2, a: null, running: z2 } })
      };
      const a2 = r3(sig(z2));
      yield {
        label: `ŷ = sigmoid(${fmt(z2)}) = 1/(1+e^${fmt(-z2)}) = ${a2.toFixed(3)} — the logit becomes a probability. Threshold at 0.5 ⇒ predict "${a2 >= 0.5 ? "pass" : "fail"}".`,
        phase: "out-act",
        state: snap({ layer: 2, z2: z2, a2: a2, work: { unit: 0, layer: 2, terms: terms2.map((t) => ({ w: t.w, x: t.x, prod: t.prod })), bias: b2, z: z2, a: a2, running: a2 } })
      };

      const nParams = nIn * nH + (useBias ? nH : 0) + nH + (useBias ? 1 : 0);
      yield {
        label: `Whole forward pass: ${nParams} parameters, ≈${2 * (nIn * nH + nH)} FLOPs, one number out. Training changes only the weights and biases — the arrows and circles never move.`,
        phase: "done",
        state: snap({ layer: 3, z2: z2, a2: a2 })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const fmt = (v) => (v === null || v === undefined) ? "—" : (v >= 0 ? "" : "−") + Math.abs(v).toFixed(2);
      const padTop = 44;
      const panelH = 92;
      const netH = H - padTop - panelH - 16;
      const colX = [W * 0.16, W * 0.52, W * 0.86];
      const R = Math.max(12, Math.min(22, netH / (s.nH * 2.6)));

      const yFor = (count, i) => {
        const span = netH - R * 2;
        if (count === 1) return padTop + netH / 2;
        return padTop + R + (span * i) / (count - 1);
      };

      const inY = (i) => yFor(s.nIn, i);
      const hY = (j) => yFor(s.nH, j);
      const outY = padTop + netH / 2;

      // ---------- edges ---------------------------------------------------
      const maxW1 = Math.max(0.01, ...s.W1.map((r) => Math.max(...r.map(Math.abs))));
      const maxW2 = Math.max(0.01, ...s.W2.map(Math.abs));

      const drawEdge = (x0, y0, x1, y1, w, maxAbs, active, computed) => {
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(x1, y1);
        ctx.lineWidth = 0.7 + (Math.abs(w) / maxAbs) * 4.2;
        ctx.strokeStyle = active ? C.viz4 : (w >= 0 ? C.viz1 : C.viz2);
        ctx.globalAlpha = active ? 1 : (computed ? 0.5 : 0.16);
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (active) {
          const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
          ctx.fillStyle = C.surface;
          ctx.strokeStyle = C.viz4;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(mx - 21, my - 9, 42, 16, 4);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = C.text;
          ctx.font = `10px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(fmt(w), mx, my - 1);
        }
      };

      for (let j = 0; j < s.nH; j++) {
        for (let i = 0; i < s.nIn; i++) {
          const ae = s.activeEdge;
          const active = !!(ae && ae.layer === 1 && ae.from === i && ae.to === j);
          const computed = s.z1[j] !== null || s.layer >= 2;
          drawEdge(colX[0] + R, inY(i), colX[1] - R, hY(j), s.W1[j][i], maxW1, active, computed);
        }
      }
      for (let j = 0; j < s.nH; j++) {
        const ae = s.activeEdge;
        const active = !!(ae && ae.layer === 2 && ae.from === j);
        drawEdge(colX[1] + R, hY(j), colX[2] - R, outY, s.W2[j], maxW2, active, s.a2 !== null);
      }

      // ---------- nodes ----------------------------------------------------
      const drawNode = (cx, cy, value, lo, hi, label, sub, highlight) => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.fillStyle = C.surface2;
        ctx.fill();
        if (value !== null && value !== undefined) {
          const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
          ctx.save();
          ctx.clip();
          ctx.fillStyle = value < 0 ? C.viz2 : C.viz3;
          const fillH = 2 * R * t;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(cx - R, cy + R - fillH, 2 * R, fillH);
          ctx.restore();
        }
        ctx.lineWidth = highlight ? 2.4 : 1;
        ctx.strokeStyle = highlight ? C.viz4 : C.border;
        ctx.beginPath();
        ctx.arc(cx, cy, R, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${R > 16 ? 11 : 9}px ${env.font.mono}`;
        ctx.fillStyle = C.text;
        ctx.fillText(value === null || value === undefined ? "·" : fmt(value), cx, cy);

        if (label) {
          ctx.font = `10px ${env.font.base}`;
          ctx.fillStyle = C.muted;
          ctx.textAlign = "right";
          ctx.fillText(label, cx - R - 6, cy);
        }
        if (sub) {
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = C.text2;
          ctx.textAlign = "left";
          ctx.fillText(sub, cx + R + 6, cy);
        }
      };

      for (let i = 0; i < s.nIn; i++) {
        drawNode(colX[0], inY(i), s.x[i], -1, 1, s.featNames[i] || `x${i + 1}`, null,
          !!(s.activeEdge && s.activeEdge.layer === 1 && s.activeEdge.from === i));
      }
      for (let j = 0; j < s.nH; j++) {
        const activeUnit = !!(s.work && s.work.layer === 1 && s.work.unit === j) ||
          !!(s.activeEdge && s.activeEdge.layer === 2 && s.activeEdge.from === j);
        const lo = s.act === "tanh" ? -1 : 0;
        const hi = s.act === "sigmoid" ? 1 : Math.max(1, ...s.a1.map((v) => (v === null ? 1 : Math.abs(v))));
        drawNode(colX[1], hY(j), s.a1[j], lo, hi, null,
          s.z1[j] === null ? null : `z=${fmt(s.z1[j])}${s.a1[j] === 0 ? " ✕" : ""}`, activeUnit);
      }
      drawNode(colX[2], outY, s.a2, 0, 1, null, s.z2 === null ? null : `logit ${fmt(s.z2)}`, s.layer === 2);

      // ---------- column headers -------------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `12px ${env.font.base}`;
      ctx.fillStyle = C.text;
      ctx.fillText(`input  (1×${s.nIn})`, colX[0], 22);
      ctx.fillText(`hidden ${s.act}  (1×${s.nH})`, colX[1], 22);
      ctx.fillText("output  sigmoid (1×1)", colX[2], 22);
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.muted;
      ctx.fillText(`W₁: ${s.nIn}×${s.nH}${s.useBias ? " + b₁" : "  (no bias)"}`, (colX[0] + colX[1]) / 2, 36);
      ctx.fillText(`W₂: ${s.nH}×1${s.useBias ? " + b₂" : ""}`, (colX[1] + colX[2]) / 2, 36);

      // ---------- arithmetic panel -----------------------------------------
      const py = H - panelH - 4;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(12, py, W - 24, panelH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.mono}`;
      if (s.work) {
        const w = s.work;
        const title = w.layer === 1 ? `z₁[${w.unit + 1}]  =` : "z₂  =";
        ctx.fillStyle = C.text2;
        ctx.fillText(title, 24, py + 22);
        let x = 24 + 58;
        for (let k = 0; k < w.terms.length; k++) {
          const t = w.terms[k];
          const str = `${k ? "+ " : ""}(${fmt(t.w)})·(${fmt(t.x)})`;
          ctx.fillStyle = k === w.terms.length - 1 && w.bias === null ? C.viz4 : C.text;
          ctx.fillText(str, x, py + 22);
          x += ctx.measureText(str).width + 8;
          if (x > W - 150) break;
        }
        if (w.bias !== null && w.bias !== undefined) {
          ctx.fillStyle = C.viz5;
          ctx.fillText(`+ (${fmt(w.bias)})`, x, py + 22);
          x += 60;
        }
        ctx.fillStyle = C.text2;
        ctx.fillText("=", x + 4, py + 22);
        ctx.fillStyle = C.viz4;
        ctx.fillText(fmt(w.running), x + 20, py + 22);

        // per-term product bars
        const bx = 24, bw = Math.min(360, W - 300);
        const maxP = Math.max(0.001, ...w.terms.map((t) => Math.abs(t.prod)));
        ctx.font = `10px ${env.font.mono}`;
        for (let k = 0; k < w.terms.length && k < 6; k++) {
          const t = w.terms[k];
          const yy = py + 38 + k * 9;
          if (yy > py + panelH - 6) break;
          const len = (Math.abs(t.prod) / maxP) * (bw / 2 - 20);
          ctx.fillStyle = t.prod >= 0 ? C.viz1 : C.viz2;
          const mid = bx + bw / 2;
          ctx.fillRect(t.prod >= 0 ? mid : mid - len, yy - 5, len, 6);
          ctx.fillStyle = C.muted;
          ctx.textAlign = "right";
          ctx.fillText(fmt(t.prod), bx + bw / 2 - 22 - (t.prod >= 0 ? 0 : len), yy);
          ctx.textAlign = "left";
        }
        ctx.strokeStyle = C.axis;
        ctx.beginPath();
        ctx.moveTo(bx + bw / 2, py + 32);
        ctx.lineTo(bx + bw / 2, py + panelH - 6);
        ctx.stroke();

        if (w.a !== null && w.a !== undefined) {
          ctx.textAlign = "left";
          ctx.font = `12px ${env.font.mono}`;
          ctx.fillStyle = C.viz3;
          const fn = w.layer === 1 ? s.act : "sigmoid";
          ctx.fillText(`${fn}(${fmt(w.z)}) = ${fmt(w.a)}`, Math.min(W - 220, bx + bw + 24), py + 46);
        }
      } else {
        ctx.fillStyle = C.muted;
        ctx.fillText("Edge thickness ∝ |weight|.  Blue = positive weight, orange = negative.  Circle fill = activation magnitude.", 24, py + 22);
        if (s.a2 !== null) {
          ctx.fillStyle = C.text;
          ctx.font = `12px ${env.font.mono}`;
          ctx.fillText(`ŷ = ${s.a2.toFixed(3)}   logit z₂ = ${fmt(s.z2)}   a₁ = [${s.a1.map((v) => fmt(v)).join(", ")}]`, 24, py + 46);
        } else {
          ctx.fillStyle = C.text2;
          ctx.fillText(`x = [${s.x.map((v) => fmt(v)).join(", ")}]`, 24, py + 46);
        }
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the forward pass of one dense layer with shapes.", a: "`Z = X @ W + b` where `X` is `(B, d_in)`, `W` is `(d_in, d_out)`, `b` is `(d_out,)` broadcast over the batch, giving `Z` of shape `(B, d_out)`. Then `A = σ(Z)`, elementwise, same shape.", tags: ["shapes"] },
      { q: "Why does stacking linear layers without activations gain nothing?", a: "The composition of affine maps is affine: `W₂(W₁x+b₁)+b₂ = (W₂W₁)x + (W₂b₁+b₂)`. Any depth collapses to a single matrix and bias.", tags: ["nonlinearity"] },
      { q: "What shape is `nn.Linear(d_in, d_out).weight` in PyTorch?", a: "`(d_out, d_in)` — transposed relative to the textbook maths, because the layer computes `x @ weight.T + bias`.", tags: ["pytorch", "pitfall"] },
      { q: "What is a dead ReLU?", a: "A unit whose pre-activation is negative for every input, so its output is 0 and its gradient is 0 forever. Caused by too-large learning rates or bad init; fixed with LeakyReLU/GELU, lower LR, or He init.", tags: ["activations"] },
      { q: "Why does sigmoid vanish gradients?", a: "σ'(z)=σ(z)(1−σ(z)) ≤ 0.25 and → 0 in the tails, so each layer multiplies the gradient by ≤ ¼. Ten layers ⇒ ≥ 4¹⁰ ≈ 10⁶ attenuation.", tags: ["activations"] },
      { q: "Parameter count for 784 → 256 → 10?", a: "784·256+256 = 200,960 plus 256·10+10 = 2,570 → 203,530. Don't forget the bias vectors.", tags: ["shapes"] },
      { q: "What does He initialisation compute and why the factor 2?", a: "std = √(2/d_in). The 2 compensates for ReLU zeroing ~half the pre-activations, which halves the output variance; the goal is constant activation variance across depth.", tags: ["init"] },
      { q: "Roughly how many FLOPs is a forward pass, in terms of parameters?", a: "About 2 FLOPs per parameter per example (one multiply + one add), so ~2·N. Backward is roughly twice that, giving the familiar ~6N FLOPs per token of training.", tags: ["flops"] }
    ],
    sixtySecond: [
      "Explain what one neuron computes, why the non-linearity is required, and give the shapes for a batched forward pass through a 2-layer MLP.",
      "Compare ReLU, sigmoid and GELU: what each is used for, and what each does to gradients through depth."
    ]
  }
};
