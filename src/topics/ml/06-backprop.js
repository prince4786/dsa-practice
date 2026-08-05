export default {
  id: "backprop",
  track: "ml",
  title: "Backpropagation",
  difficulty: 2,
  minutes: 18,
  tags: ["neural-networks", "chain-rule", "autodiff", "training"],

  explainer: [
    { type: "p", text: "It's a common mix-up worth clearing up immediately: backpropagation ('backprop') is not itself the thing that trains a neural network. Gradient descent (or Adam, or any other optimizer) is the thing that actually updates the weights; backprop is simply the efficient procedure that computes the gradient those optimizers need in the first place — the numbers saying which way, and how strongly, to adjust every single weight in the network. Formally, backprop is an application of a general technique called **reverse-mode automatic differentiation** to a **computation graph**: a computation graph is just a diagram of every arithmetic operation a neural network performs, from input to final loss, drawn as a chain (or web) of small steps; 'automatic differentiation' means a systematic, mechanical procedure for computing exact derivatives of that whole chain, rather than working them out by hand. Backprop's job is to compute `∂L/∂θ` — the derivative of the loss `L` with respect to every parameter `θ` (theta, used here as a stand-in for 'all the weights in the network') — for every single parameter, in one efficient sweep." },
    { type: "h3", text: "Why backprop is cheap, no matter how big the model is" },
    { type: "p", text: "Here's the property that makes deep learning computationally feasible at all. Imagine trying to compute the same gradients a different, more naive way: for each of the model's (potentially billions of) parameters, nudge that one parameter slightly and rerun the whole network to see how much the loss changed. That naive method — called forward-mode differentiation, or finite differences — needs one full pass through the network *per parameter*, which is impossibly slow for large models. Backprop instead runs backward from the single loss number, and computes the gradient with respect to *every* parameter simultaneously, in just one backward pass, no matter how many parameters there are. The total cost of that one backward pass is roughly 2× the cost of the original forward pass — a fixed, small multiple, completely independent of the parameter count. This result has a formal name (the Baur–Strassen theorem) and it is the entire reason training networks with billions of parameters is practical at all." },
    { type: "h3", text: "The two rules everything else follows from" },
    { type: "list", items: [
      "**The chain rule, applied along a single path** — if `x` affects `z` which affects the loss `L`, then the effect of `x` on `L` is found by multiplying the local derivatives together: `∂L/∂x = ∂L/∂z · ∂z/∂x`. This is ordinary calculus, applied one small step at a time through the network.",
      "**The multivariate chain rule, applied at a fan-out** — when a single value feeds into *several* different downstream computations (a 'fan-out'), its total gradient is the *sum* of the gradients flowing back from each of those consumers separately. This is the rule people most often get wrong, and it's exactly why a residual/skip connection's gradient simply adds together with the gradient from its other branch, rather than needing anything more complicated."
    ]},
    { type: "p", text: "Consider one layer of a network: it computes `z = Wa_prev + b` (a weighted sum of the previous layer's output `a_prev`, plus a bias `b`), then applies an activation function `f` to get `a = f(z)` (see the activations lesson for what `f` typically is). Define the **local error**, written `δ` (delta), as `δ = ∂L/∂z` — literally, 'how much would the final loss change if this particular pre-activation value `z` changed a little'. With that definition, the entire backward pass for a network with many such layers, indexed by `l`, reduces to four small formulas:" },
    { type: "code", lang: "python", code: "delta_L   = dL/da_L * f'(z_L)              # output layer\ndelta_l   = (W_{l+1}.T @ delta_{l+1}) * f'(z_l)   # recurse backwards\ndL/dW_l   = delta_l @ a_{l-1}.T            # outer product\ndL/db_l   = delta_l" },
    { type: "p", text: "Read what these mean rather than just the symbols: the first line starts the process at the very last layer. The second line is the recursive step that lets `δ` flow backward from layer to layer: take the error from the next layer, route it back through that layer's weights (`W_{l+1}.T`, the transpose — a rearranged version — of that weight matrix), and multiply by how sensitive this layer's own activation function is at this point (`f'(z_l)`, its derivative). The third and fourth lines say the gradient for a given layer's weights and bias is always `(the error arriving from the output side) × (the activation value coming in from the input side)` — that one pattern, repeated at every layer, is the entirety of what a deep learning framework's `Linear.backward` function computes." },
    { type: "h3", text: "The sigmoid + cross-entropy shortcut" },
    { type: "p", text: "For a network's final layer using sigmoid activation `a = σ(z)` together with binary cross-entropy loss (both introduced in the linear/logistic regression lesson), the two derivatives involved — `∂L/∂a = (a−y)/(a(1−a))` from the loss, and `σ′(z) = a(1−a)` from the sigmoid itself — cancel each other's messy denominator exactly, leaving simply `δ = a − y`: prediction minus true label. The identical cancellation happens for softmax paired with categorical cross-entropy (the multi-class version). This is exactly why deep learning frameworks fuse the activation and the loss into a single combined operation (commonly named something like `cross_entropy_with_logits`): it is both faster to compute and more numerically stable than computing the two steps separately." },
    { type: "callout", tone: "pitfall", text: "Every activation value computed during the forward pass must be **kept in memory** until the backward pass reaches that same layer and needs it — this stored data is called **activation memory**, and in practice it is usually the thing that decides whether a training run fits on a GPU, far more often than the raw parameter count does, because activation memory scales with batch size, sequence length, and depth all multiplied together. **Gradient checkpointing** is the standard workaround: instead of storing every activation, only store a subset and recompute the rest on the fly during the backward pass — roughly 30% more total compute, in exchange for a large reduction in memory used." },
    { type: "h3", text: "What actually breaks in practice" },
    { type: "list", items: [
      "**Forgetting to zero gradients** — in PyTorch, gradients accumulate (add up) into each parameter's `.grad` attribute by default across calls; without explicitly calling `opt.zero_grad()` before each new backward pass, you end up training on the *sum* of every batch's gradient seen so far, not just the current one.",
      "**In-place operations on tensors the backward pass still needs** — the automatic-differentiation system keeps references to the exact values used during the forward pass so it can compute derivatives later; overwriting one of those values in place, rather than creating a new tensor, silently corrupts the computation or throws an error.",
      "**Vanishing or exploding gradients** — `δ` is built up as a product of many small derivative terms, one per layer (each term technically a **Jacobian**, a matrix of all the partial derivatives of one layer's outputs with respect to its inputs). If those terms are consistently smaller than 1 in magnitude, their product shrinks toward zero as it passes through many layers (vanishing); if consistently larger than 1, it grows explosively (exploding). The activations lesson covers this in depth.",
      "**Accidentally detaching part of the computation graph** — calling `.item()`, `.numpy()`, wrapping code in `torch.no_grad()`, or converting a value to a plain Python number all sever the link back to earlier computations, so any gradient trying to flow through that point silently becomes zero instead of raising a visible error."
    ]},
    { type: "callout", tone: "tip", text: "Always be able to verify a hand-written backward pass numerically: compare the analytic (formula-derived) gradient against the approximation `(L(θ+ε) − L(θ−ε))/2ε` — nudge a parameter up by a tiny amount `ε` (epsilon), then down by the same tiny amount, and see how much the loss changed either way, with `ε ≈ 1e-5`. A relative error below roughly one part in ten million (`1e-7`) between the two means the hand-derived backward pass is almost certainly correct. This check, called **gradient checking**, is a common interview question: 'how would you verify a custom layer's backward pass is right?'" }
  ],

  glossary: [
    { term: "Backpropagation", plain: "The efficient procedure that computes the gradient of the loss with respect to every parameter in a network, in one backward sweep. It produces the gradients; an optimizer like gradient descent then uses them to update the weights." },
    { term: "Computation graph", plain: "A diagram of every arithmetic step a network performs, from input to final loss, used as the structure that backpropagation works backward through." },
    { term: "Automatic differentiation (autodiff)", plain: "A systematic, mechanical way for software to compute exact derivatives of a chain of calculations, rather than a human working them out by hand." },
    { term: "Reverse-mode differentiation", plain: "The style of automatic differentiation, used by backpropagation, that computes the gradient of one final output with respect to every input in a single backward pass — regardless of how many inputs there are." },
    { term: "Chain rule", plain: "The calculus rule for finding how a change far upstream affects a result far downstream, by multiplying together the local rate-of-change at each step in between." },
    { term: "Fan-out", plain: "When a single value in a computation feeds into more than one downstream calculation. Its gradient is the sum of the gradients coming back from each of those consumers." },
    { term: "Local error (δ, delta)", plain: "How much the final loss would change if one specific intermediate value in the network changed slightly — the quantity that flows backward, layer by layer, during backpropagation." },
    { term: "Jacobian", plain: "A grid of numbers listing how every output of one computation step responds to every input of that step — the multi-variable generalisation of a single derivative." },
    { term: "Activation memory", plain: "The forward-pass values a network must keep stored in memory until the backward pass reaches and uses them. It usually determines whether a training run fits in available GPU memory." },
    { term: "Gradient checkpointing", plain: "A memory-saving technique that stores only some forward-pass activations and recomputes the rest during the backward pass, trading extra compute time for less memory use." },
    { term: "Vanishing / exploding gradients", plain: "When the gradient flowing backward through many layers shrinks toward zero (vanishing) or grows enormously (exploding), because it is built from a long chain of multiplied terms." },
    { term: "Gradient checking", plain: "A way of testing whether a hand-written backward pass is correct, by comparing it against a numerical approximation made by nudging a parameter slightly up and down and observing the change in loss." }
  ],

  complexity: {
    rows: [
      { operation: "Forward pass", time: "O(∑ nₗ·nₗ₊₁)", space: "O(∑ nₗ) activations", note: "per example; ×batch size" },
      { operation: "Backward pass", time: "≈ 2× forward", space: "O(params) for grads", note: "independent of parameter count — reverse-mode AD" },
      { operation: "Finite-difference gradient", time: "O(P) forward passes", space: "O(1)", note: "P = #parameters; only for checking" },
      { operation: "Gradient checkpointing", time: "≈ 1.3× forward+backward", space: "O(√L) activations", note: "recompute instead of store" }
    ]
  },

  interview: {
    whyAsked: "It separates people who have used a framework from people who understand what it does. The tell is whether you can write the δ recursion and explain why the backward pass costs the same as the forward one no matter how many parameters there are.",
    followUps: [
      { q: "Write the backprop equations for a fully-connected net.", a: "With `z_l = W_l a_{l−1} + b_l`, `a_l = f(z_l)`, and `δ_l = ∂L/∂z_l`: output `δ_L = ∇_a L ⊙ f′(z_L)`; recursion `δ_l = (W_{l+1}ᵀ δ_{l+1}) ⊙ f′(z_l)`; parameter gradients `∂L/∂W_l = δ_l a_{l−1}ᵀ` and `∂L/∂b_l = δ_l`. Everything is one matmul plus one elementwise multiply per layer." },
      { q: "Why is backprop O(1) passes rather than O(#params) passes?", a: "Reverse-mode AD computes the gradient of one scalar output w.r.t. all inputs in a single sweep, because it propagates the *adjoint* `∂L/∂v` backwards through shared subexpressions instead of propagating each input's perturbation forward. The cost is a small constant multiple (≈2×) of the forward pass — Baur–Strassen. Forward-mode would cost one pass per parameter." },
      { q: "What happens at a fan-out — a value used by two layers?", a: "Its gradient is the **sum** of the gradients arriving from every consumer (multivariate chain rule). This is exactly why residual connections help: `y = x + F(x)` gives `∂L/∂x = ∂L/∂y·(I + ∂F/∂x)`, so the identity path passes gradient through unattenuated even when `∂F/∂x` is tiny." },
      { q: "Why is δ = a − y for the output layer with cross-entropy?", a: "`∂L/∂a = (a−y)/(a(1−a))` for BCE and `σ′(z) = a(1−a)`; the product is `a − y`. The same cancellation holds for softmax + categorical cross-entropy. It is why frameworks fuse the softmax into the loss — better numerics and one fewer kernel." },
      { q: "Why do we need to store activations, and what can be done about it?", a: "`∂L/∂W_l = δ_l a_{l−1}ᵀ` needs the forward activation `a_{l−1}`, so it must live until the backward pass reaches that layer. For a transformer that dominates memory and scales with batch × sequence × layers. Gradient checkpointing stores only every √L-th activation and recomputes the rest during backward: ~30% more compute for a large memory saving." },
      { q: "How do you verify a hand-written backward pass?", a: "Numerical gradient checking with central differences: `(L(θ+ε) − L(θ−ε))/(2ε)` with ε ≈ 1e-5 in float64, compared by relative error `‖ga − gn‖/(‖ga‖+‖gn‖)`; below 1e-7 is correct, above 1e-4 is a bug. Check a random subset of parameters, avoid kinks (ReLU at exactly 0), and turn off dropout/BN randomness first." },
      { q: "What's the difference between backprop and gradient descent?", a: "Backprop computes gradients; gradient descent uses them to update parameters. You can backprop and then feed the gradients to Adam, L-BFGS, or nothing at all (e.g. for saliency maps or adversarial examples, where you take the gradient w.r.t. the *input* and never touch the weights)." },
      { q: "Why do RNNs need BPTT and what goes wrong?", a: "Unrolling the recurrence in time makes it a deep feed-forward net with *shared* weights, so the weight gradient is the sum of contributions from every timestep. The δ recursion multiplies by `Wᵀ` once per step, so gradients scale like `‖W‖ᵀ` — vanishing if the spectral radius < 1, exploding if > 1. Fixes: gradient clipping, gated cells (LSTM/GRU), truncated BPTT." }
    ]
  },

  code: [
    { lang: "python", label: "A 2-3-1 net, forward and backward by hand", code: "import numpy as np\n\ndef sigmoid(z): return 1 / (1 + np.exp(-z))\n\ndef train_step(W1, b1, W2, b2, x, y, lr=0.5):\n    # ---- forward -------------------------------------------------------\n    z1 = W1 @ x + b1            # (3,)\n    a1 = np.tanh(z1)            # hidden activation\n    z2 = W2 @ a1 + b2           # (1,)\n    a2 = sigmoid(z2)            # prediction\n    loss = -(y * np.log(a2 + 1e-12) + (1 - y) * np.log(1 - a2 + 1e-12))\n\n    # ---- backward ------------------------------------------------------\n    d2 = a2 - y                 # dL/dz2  (sigmoid+BCE cancellation)\n    gW2 = np.outer(d2, a1)      # dL/dW2 = delta * a_prev^T\n    gb2 = d2\n\n    d1 = (W2.T @ d2) * (1 - a1 ** 2)   # backprop through tanh: f'(z)=1-a^2\n    gW1 = np.outer(d1, x)\n    gb1 = d1\n\n    return (W1 - lr * gW1, b1 - lr * gb1,\n            W2 - lr * gW2, b2 - lr * gb2, float(loss))" },
    { lang: "python", label: "Generic L-layer backprop", code: "def forward(params, x, f, fp):\n    cache = [(None, x)]                     # (z, a) per layer\n    a = x\n    for (W, b) in params:\n        z = W @ a + b\n        a = f(z)\n        cache.append((z, a))\n    return a, cache\n\ndef backward(params, cache, dL_da, fp):\n    grads = [None] * len(params)\n    z, a = cache[-1]\n    delta = dL_da * fp(z)                   # delta_L\n    for l in range(len(params) - 1, -1, -1):\n        a_prev = cache[l][1]\n        grads[l] = (np.outer(delta, a_prev), delta.copy())\n        if l > 0:\n            W = params[l][0]\n            delta = (W.T @ delta) * fp(cache[l][0])   # the recursion\n    return grads" },
    { lang: "python", label: "Numerical gradient check", code: "def grad_check(loss_fn, theta, analytic, eps=1e-5, k=20, rng=None):\n    rng = rng or np.random.default_rng(0)\n    idx = rng.choice(theta.size, size=min(k, theta.size), replace=False)\n    num = np.zeros_like(theta)\n    flat = theta.ravel()\n    for i in idx:\n        old = flat[i]\n        flat[i] = old + eps; lp = loss_fn(theta)\n        flat[i] = old - eps; lm = loss_fn(theta)\n        flat[i] = old\n        num.ravel()[i] = (lp - lm) / (2 * eps)\n    a, n_ = analytic.ravel()[idx], num.ravel()[idx]\n    return np.linalg.norm(a - n_) / (np.linalg.norm(a) + np.linalg.norm(n_) + 1e-12)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 250 },

    params: [
      { key: "act", label: "Hidden activation", type: "enum", options: ["tanh", "sigmoid", "relu"], default: "tanh" },
      { key: "lr", label: "Learning rate ×0.1", type: "int", min: 1, max: 20, default: 8 },
      { key: "epochs", label: "Updates", type: "int", min: 1, max: 6, default: 3 },
      { key: "target", label: "Target y", type: "enum", options: ["1", "0"], default: "1" },
      { key: "seed", label: "Re-init weights", type: "seed" }
    ],

    frames: function* (params, rng) {
      const lr = params.lr / 10;
      const EP = params.epochs;
      const yT = params.target === "1" ? 1 : 0;
      const actName = params.act;

      const f = (z) => actName === "tanh" ? Math.tanh(z)
        : actName === "sigmoid" ? 1 / (1 + Math.exp(-z))
          : Math.max(0, z);
      const fp = (z, a) => actName === "tanh" ? 1 - a * a
        : actName === "sigmoid" ? a * (1 - a)
          : (z > 0 ? 1 : 0);
      const fpName = actName === "tanh" ? "1 − a²" : actName === "sigmoid" ? "a(1 − a)" : "1 if z>0 else 0";
      const sig = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));
      const r2 = (v) => Math.round(v * 100) / 100;

      const x = [r2(rng() * 2 - 1), r2(rng() * 2 - 1)];
      const W1 = [];
      for (let j = 0; j < 3; j++) W1.push([r2((rng() * 2 - 1) * 1.2), r2((rng() * 2 - 1) * 1.2)]);
      const b1 = [r2((rng() * 2 - 1) * 0.4), r2((rng() * 2 - 1) * 0.4), r2((rng() * 2 - 1) * 0.4)];
      const W2 = [r2((rng() * 2 - 1) * 1.2), r2((rng() * 2 - 1) * 1.2), r2((rng() * 2 - 1) * 1.2)];
      let b2 = r2((rng() * 2 - 1) * 0.4);

      let z1 = [0, 0, 0], a1 = [0, 0, 0], z2 = 0, a2 = 0, loss = 0;
      let d2 = 0, d1 = [0, 0, 0];
      let gW1 = [[0, 0], [0, 0], [0, 0]], gb1 = [0, 0, 0], gW2 = [0, 0, 0], gb2 = 0;
      const lossHist = [];

      const snap = (over) => Object.assign({
        x: x.slice(), y: yT, act: actName, lr, epoch: 0, epochs: EP,
        W1: W1.map((r) => r.slice()), b1: b1.slice(), W2: W2.slice(), b2,
        z1: z1.slice(), a1: a1.slice(), z2, a2, loss,
        d2, d1: d1.slice(),
        gW1: gW1.map((r) => r.slice()), gb1: gb1.slice(), gW2: gW2.slice(), gb2,
        lossHist: lossHist.slice(),
        dir: "fwd", active: null, expr: "", live: []
      }, over || {});

      yield {
        label: `A 2-3-1 network. Input x = (${x[0]}, ${x[1]}), target y = ${yT}. Hidden activation ${actName}, output sigmoid, loss = binary cross-entropy. Nothing has been computed yet — the weights are the random init.`,
        phase: "init",
        state: snap({ expr: "network initialised" })
      };

      for (let ep = 1; ep <= EP; ep++) {
        // ================= FORWARD =========================================
        for (let j = 0; j < 3; j++) {
          z1[j] = W1[j][0] * x[0] + W1[j][1] * x[1] + b1[j];
          a1[j] = f(z1[j]);
          yield {
            label: `Forward, hidden unit h${j + 1}: z = ${W1[j][0].toFixed(2)}·${x[0].toFixed(2)} + ${W1[j][1].toFixed(2)}·${x[1].toFixed(2)} + ${b1[j].toFixed(2)} = ${z1[j].toFixed(4)}; a = ${actName}(${z1[j].toFixed(2)}) = ${a1[j].toFixed(4)}.`,
            phase: "forward",
            focus: [j],
            state: snap({
              epoch: ep, dir: "fwd", active: { layer: 1, i: j },
              expr: `z₁${j + 1} = w·x + b = ${z1[j].toFixed(4)}\na₁${j + 1} = ${actName}(z) = ${a1[j].toFixed(4)}`,
              live: [1, j]
            })
          };
        }

        z2 = W2[0] * a1[0] + W2[1] * a1[1] + W2[2] * a1[2] + b2;
        a2 = sig(z2);
        yield {
          label: `Forward, output: z₂ = ${W2.map((w, j) => `${w.toFixed(2)}·${a1[j].toFixed(2)}`).join(" + ")} + ${b2.toFixed(2)} = ${z2.toFixed(4)}; ŷ = σ(z₂) = ${a2.toFixed(4)}.`,
          phase: "forward",
          state: snap({ epoch: ep, dir: "fwd", active: { layer: 2, i: 0 }, expr: `z₂ = W₂·a₁ + b₂ = ${z2.toFixed(4)}\nŷ = σ(z₂) = ${a2.toFixed(4)}`, live: [2, 0] })
        };

        loss = -(yT * Math.log(Math.max(1e-12, a2)) + (1 - yT) * Math.log(Math.max(1e-12, 1 - a2)));
        lossHist.push(loss);
        yield {
          label: `Loss = −[y·log ŷ + (1−y)·log(1−ŷ)] = −log(${yT === 1 ? a2.toFixed(4) : (1 - a2).toFixed(4)}) = ${loss.toFixed(4)}. Now every derivative is taken with respect to THIS number.`,
          phase: "loss",
          state: snap({ epoch: ep, dir: "fwd", active: { layer: 3, i: 0 }, expr: `L = ${loss.toFixed(4)}\nŷ = ${a2.toFixed(4)}, y = ${yT}` })
        };

        // ================= BACKWARD ========================================
        d2 = a2 - yT;
        yield {
          label: `Backward starts. δ₂ = ∂L/∂z₂ = ŷ − y = ${a2.toFixed(4)} − ${yT} = ${d2.toFixed(4)}. The messy (ŷ−y)/(ŷ(1−ŷ)) from the cross-entropy is cancelled exactly by σ′(z) = ŷ(1−ŷ) — that cancellation is why sigmoid pairs with BCE.`,
          phase: "backward",
          state: snap({ epoch: ep, dir: "bwd", active: { layer: 2, i: 0 }, expr: `δ₂ = ∂L/∂ŷ · σ′(z₂)\n   = (ŷ−y)/(ŷ(1−ŷ)) · ŷ(1−ŷ)\n   = ŷ − y = ${d2.toFixed(4)}` })
        };

        for (let j = 0; j < 3; j++) {
          gW2[j] = d2 * a1[j];
          yield {
            label: `∂L/∂W₂[${j + 1}] = δ₂ · a₁${j + 1} = ${d2.toFixed(4)} × ${a1[j].toFixed(4)} = ${gW2[j].toFixed(5)}. Weight gradient = (error on the output side) × (activation on the input side) — that pattern is every weight gradient in the network.`,
            phase: "backward",
            focus: [j],
            state: snap({ epoch: ep, dir: "bwd", active: { layer: 2, i: 0, edge: j }, expr: `∂L/∂W₂[${j + 1}] = δ₂·a₁${j + 1}\n   = ${d2.toFixed(4)} × ${a1[j].toFixed(4)}\n   = ${gW2[j].toFixed(5)}` })
          };
        }
        gb2 = d2;
        yield {
          label: `∂L/∂b₂ = δ₂ · 1 = ${gb2.toFixed(5)} — the bias sees an input that is always 1, so its gradient is just the error itself.`,
          phase: "backward",
          state: snap({ epoch: ep, dir: "bwd", active: { layer: 2, i: 0 }, expr: `∂L/∂b₂ = δ₂ = ${gb2.toFixed(5)}` })
        };

        for (let j = 0; j < 3; j++) {
          const dp = fp(z1[j], a1[j]);
          d1[j] = d2 * W2[j] * dp;
          yield {
            label: `δ₁${j + 1} = δ₂ · W₂[${j + 1}] · ${fpName} = ${d2.toFixed(4)} × ${W2[j].toFixed(3)} × ${dp.toFixed(4)} = ${d1[j].toFixed(5)}. The error is routed backwards through the weight it came forward on, then multiplied by the local activation slope. Note ${dp < 0.15 ? "this slope is small — that unit is saturated and its gradient is being throttled" : "this slope is healthy, so the error passes through largely intact"}.`,
            phase: "backward",
            focus: [j],
            state: snap({ epoch: ep, dir: "bwd", active: { layer: 1, i: j }, expr: `δ₁${j + 1} = δ₂·W₂[${j + 1}]·f′(z₁${j + 1})\n   = ${d2.toFixed(4)} × ${W2[j].toFixed(3)} × ${dp.toFixed(4)}\n   = ${d1[j].toFixed(5)}`, live: [1, j] })
          };
        }

        for (let j = 0; j < 3; j++) {
          gW1[j][0] = d1[j] * x[0];
          gW1[j][1] = d1[j] * x[1];
          gb1[j] = d1[j];
          yield {
            label: `∂L/∂W₁[${j + 1}] = δ₁${j + 1} · x = ${d1[j].toFixed(5)} × (${x[0].toFixed(2)}, ${x[1].toFixed(2)}) = (${gW1[j][0].toFixed(5)}, ${gW1[j][1].toFixed(5)}); ∂L/∂b₁${j + 1} = ${gb1[j].toFixed(5)}. Same outer-product pattern, one layer down.`,
            phase: "backward",
            focus: [j],
            state: snap({ epoch: ep, dir: "bwd", active: { layer: 1, i: j, edge: -1 }, expr: `∂L/∂W₁[${j + 1}] = δ₁${j + 1}·xᵀ\n   = (${gW1[j][0].toFixed(5)}, ${gW1[j][1].toFixed(5)})\n∂L/∂b₁${j + 1} = ${gb1[j].toFixed(5)}` })
          };
        }

        // ================= UPDATE ==========================================
        for (let j = 0; j < 3; j++) {
          W2[j] -= lr * gW2[j];
          W1[j][0] -= lr * gW1[j][0];
          W1[j][1] -= lr * gW1[j][1];
          b1[j] -= lr * gb1[j];
        }
        b2 -= lr * gb2;

        const gnorm = Math.sqrt(
          gW2.reduce((s, v) => s + v * v, 0) + gb2 * gb2 +
          gW1.reduce((s, r) => s + r[0] * r[0] + r[1] * r[1], 0) +
          gb1.reduce((s, v) => s + v * v, 0)
        );

        yield {
          label: `Update ${ep}/${EP}: every parameter moves by −η·∂L/∂θ with η = ${lr.toFixed(1)}. Total gradient norm ${gnorm.toFixed(5)}. Prediction was ŷ = ${a2.toFixed(4)} against y = ${yT}; the next forward pass should land closer.`,
          phase: "update",
          state: snap({ epoch: ep, dir: "upd", expr: `θ ← θ − η·∂L/∂θ\n‖∇‖ = ${gnorm.toFixed(5)}\nloss = ${loss.toFixed(4)}` })
        };
      }

      // final forward to show the improvement
      for (let j = 0; j < 3; j++) { z1[j] = W1[j][0] * x[0] + W1[j][1] * x[1] + b1[j]; a1[j] = f(z1[j]); }
      z2 = W2[0] * a1[0] + W2[1] * a1[1] + W2[2] * a1[2] + b2;
      a2 = sig(z2);
      const fin = -(yT * Math.log(Math.max(1e-12, a2)) + (1 - yT) * Math.log(Math.max(1e-12, 1 - a2)));
      lossHist.push(fin);
      loss = fin;
      yield {
        label: `After ${EP} update${EP === 1 ? "" : "s"}: ŷ = ${a2.toFixed(4)} (target ${yT}), loss ${lossHist[0].toFixed(4)} → ${fin.toFixed(4)}. One backward pass produced all ${3 * 2 + 3 + 3 + 1} gradients at roughly 2× the cost of the forward pass — a finite-difference check would have needed ${3 * 2 + 3 + 3 + 1 + 1} forward passes.`,
        phase: "done",
        state: snap({ epoch: EP, dir: "fwd", expr: `ŷ = ${a2.toFixed(4)}\nL = ${fin.toFixed(4)}` })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const panelW = 210;
      const netW = W - panelW - 20;
      const cx = [netW * 0.16, netW * 0.5, netW * 0.84];
      const inY = [H * 0.38, H * 0.62];
      const hY = [H * 0.24, H * 0.5, H * 0.76];
      const outY = H * 0.5;
      const R = 20;

      const active = S.active || {};
      const bwd = S.dir === "bwd";

      // ---- header ----------------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text2;
      ctx.fillText(`${S.dir === "bwd" ? "◀ backward" : S.dir === "upd" ? "· update ·" : "forward ▶"}   update ${S.epoch}/${S.epochs}   hidden = ${S.act}   η = ${S.lr.toFixed(1)}`, 14, 20);

      // ---- edges -----------------------------------------------------------
      const edge = (x0, y0, x1, y1, w, hot, grad) => {
        ctx.strokeStyle = hot ? (bwd ? C.viz2 : C.viz4) : (w >= 0 ? C.viz1 : C.viz8);
        ctx.globalAlpha = hot ? 1 : 0.55;
        ctx.lineWidth = hot ? 3 : Math.max(0.7, Math.min(4, Math.abs(w) * 2));
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.globalAlpha = 1;
        // label
        const mx = x0 + (x1 - x0) * 0.55, my = y0 + (y1 - y0) * 0.55;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "center";
        const txt = grad !== undefined && bwd ? `∇${grad.toFixed(3)}` : w.toFixed(2);
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = C.surface;
        ctx.fillRect(mx - tw / 2 - 2, my - 7, tw + 4, 12);
        ctx.fillStyle = hot ? (bwd ? C.viz2 : C.viz4) : C.muted;
        ctx.fillText(txt, mx, my + 3);
      };

      for (let j = 0; j < 3; j++) {
        for (let i = 0; i < 2; i++) {
          const hot = active.layer === 1 && active.i === j;
          edge(cx[0] + R, inY[i], cx[1] - R, hY[j], S.W1[j][i], hot, S.gW1[j][i]);
        }
      }
      for (let j = 0; j < 3; j++) {
        const hot = (active.layer === 2 && (active.edge === undefined || active.edge === j)) ||
          (active.layer === 1 && active.i === j && bwd);
        edge(cx[1] + R, hY[j], cx[2] - R, outY, S.W2[j], hot, S.gW2[j]);
      }

      // ---- nodes -----------------------------------------------------------
      const node = (x, y, fill, frac, top, bottom, hot) => {
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2);
        ctx.fillStyle = C.surface2; ctx.fill();
        // fill level by activation magnitude
        ctx.save();
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = fill;
        const hgt = Math.max(0, Math.min(1, frac)) * 2 * R;
        ctx.fillRect(x - R, y + R - hgt, 2 * R, hgt);
        ctx.restore();
        ctx.strokeStyle = hot ? (bwd ? C.viz2 : C.viz4) : C.border;
        ctx.lineWidth = hot ? 2.6 : 1.2;
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.stroke();
        ctx.textAlign = "center";
        ctx.font = `11px ${env.font.mono}`; ctx.fillStyle = C.text;
        ctx.fillText(top, x, y + 4);
        if (bottom) {
          ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
          ctx.fillText(bottom, x, y + R + 14);
        }
      };

      ctx.textAlign = "center"; ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.muted;
      ctx.fillText("input", cx[0], 40);
      ctx.fillText("hidden (3)", cx[1], 40);
      ctx.fillText("output", cx[2], 40);

      for (let i = 0; i < 2; i++) {
        node(cx[0], inY[i], C.viz1, Math.abs(S.x[i]), S.x[i].toFixed(2), `x${i + 1}`, false);
      }
      for (let j = 0; j < 3; j++) {
        const hot = active.layer === 1 && active.i === j;
        const val = bwd ? S.d1[j] : S.a1[j];
        node(cx[1], hY[j], bwd ? C.viz2 : C.viz3, Math.min(1, Math.abs(val) * (bwd ? 8 : 1)),
          val.toFixed(bwd ? 4 : 3), bwd ? `δ₁${j + 1}` : `a₁${j + 1}`, hot);
      }
      const hotO = active.layer >= 2;
      node(cx[2], outY, bwd ? C.viz2 : C.viz3, bwd ? Math.min(1, Math.abs(S.d2)) : S.a2,
        (bwd ? S.d2 : S.a2).toFixed(4), bwd ? "δ₂" : "ŷ", hotO);

      // loss box
      const lbx = cx[2] + R + 14;
      if (lbx + 74 < netW + 8) {
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(lbx, outY - 16, 74, 32, 6); ctx.fill();
        ctx.strokeStyle = active.layer === 3 ? C.viz4 : C.border; ctx.lineWidth = active.layer === 3 ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(lbx, outY - 16, 74, 32, 6); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "center";
        ctx.fillText(`y = ${S.y}`, lbx + 37, outY - 3);
        ctx.fillStyle = C.text; ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(`L ${S.loss.toFixed(3)}`, lbx + 37, outY + 11);
      }

      // ---- panel -----------------------------------------------------------
      const px = W - panelW + 8;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(px - 10, 12); ctx.lineTo(px - 10, H - 12); ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`;
      ctx.fillText(bwd ? "chain rule at this step" : S.dir === "upd" ? "parameter update" : "forward computation", px, 26);

      ctx.font = `11px ${env.font.mono}`;
      const lines = String(S.expr || "").split("\n");
      let yy = 48;
      for (const ln of lines) {
        ctx.fillStyle = ln.indexOf("=") === 0 || ln.indexOf("   =") === 0 ? C.viz3 : C.text2;
        ctx.fillText(ln, px, yy);
        yy += 16;
      }

      // gradient magnitude bars
      yy = Math.max(yy + 12, 130);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`;
      ctx.fillText("gradient magnitudes", px, yy); yy += 8;
      const grads = [
        ["W₁1", Math.hypot(S.gW1[0][0], S.gW1[0][1])],
        ["W₁2", Math.hypot(S.gW1[1][0], S.gW1[1][1])],
        ["W₁3", Math.hypot(S.gW1[2][0], S.gW1[2][1])],
        ["W₂", Math.hypot(S.gW2[0], S.gW2[1], S.gW2[2])],
        ["b₂", Math.abs(S.gb2)]
      ];
      const gmax = Math.max(1e-6, Math.max.apply(null, grads.map((g) => g[1])));
      for (const g of grads) {
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "left"; ctx.fillText(g[0], px, yy + 9);
        ctx.fillStyle = C.surface2; ctx.fillRect(px + 32, yy + 1, panelW - 60, 9);
        ctx.fillStyle = C.viz2;
        ctx.fillRect(px + 32, yy + 1, Math.max(1, (panelW - 60) * (g[1] / gmax)), 9);
        ctx.fillStyle = C.text2; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "right";
        ctx.fillText(g[1].toFixed(4), W - 10, yy + 9);
        yy += 15;
      }

      // loss history
      if (S.lossHist.length > 1) {
        const gh = 44, gw = panelW - 24;
        const gy = H - gh - 22;
        ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(px, gy, gw, gh);
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
        ctx.fillText("loss per update", px, gy - 5);
        const hi = Math.max.apply(null, S.lossHist), lo = 0;
        ctx.strokeStyle = C.viz3; ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < S.lossHist.length; i++) {
          const X = px + (i / Math.max(1, S.lossHist.length - 1)) * gw;
          const Y = gy + gh - ((S.lossHist[i] - lo) / Math.max(1e-9, hi - lo)) * (gh - 4) - 2;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the four backprop equations.", a: "`δ_L = ∇_a L ⊙ f′(z_L)`; `δ_l = (W_{l+1}ᵀ δ_{l+1}) ⊙ f′(z_l)`; `∂L/∂W_l = δ_l a_{l−1}ᵀ`; `∂L/∂b_l = δ_l`.", tags: ["core"] },
      { q: "Why does the backward pass cost ~2× the forward pass regardless of parameter count?", a: "Reverse-mode AD propagates the adjoint of a single scalar output backwards through shared subexpressions, so all partials come out in one sweep (Baur–Strassen). Forward-mode / finite differences would need one pass per parameter.", tags: ["autodiff"] },
      { q: "What happens to gradients at a fan-out?", a: "They sum. If a tensor feeds two consumers, its gradient is the sum of the two incoming gradients (multivariate chain rule). Residual connections exploit this: ∂L/∂x = ∂L/∂y·(I + ∂F/∂x).", tags: ["core"] },
      { q: "Why is δ = ŷ − y at the output for sigmoid + BCE?", a: "`∂L/∂ŷ = (ŷ−y)/(ŷ(1−ŷ))` and `σ′(z) = ŷ(1−ŷ)`; the product cancels to `ŷ − y`. The same holds for softmax + categorical cross-entropy, which is why the two are fused in frameworks.", tags: ["derivation"] },
      { q: "Why do forward activations have to be stored?", a: "`∂L/∂W_l = δ_l a_{l−1}ᵀ` needs the input-side activation. That is activation memory, and it scales with batch × sequence × depth. Gradient checkpointing recomputes them instead, saving memory for ~30% more compute.", tags: ["systems"] },
      { q: "How do you numerically verify a backward pass?", a: "Central differences: `(L(θ+ε) − L(θ−ε))/2ε`, ε ≈ 1e-5 in float64. Relative error `‖ga−gn‖/(‖ga‖+‖gn‖)` below 1e-7 is correct. Disable dropout/BN randomness and avoid ReLU kinks.", tags: ["debugging"] },
      { q: "Difference between backprop and gradient descent?", a: "Backprop computes ∂L/∂θ; gradient descent (or Adam, L-BFGS…) uses them to update. You can backprop to the *input* instead and never touch the weights — that is how adversarial examples and saliency maps work.", tags: ["conceptual"] },
      { q: "What is BPTT and what breaks in it?", a: "Backprop through an unrolled RNN with shared weights: the weight gradient sums contributions from every timestep. The recursion multiplies by Wᵀ per step, so gradients vanish (spectral radius < 1) or explode (> 1). Fixes: clipping, LSTM/GRU gates, truncation.", tags: ["rnn"] }
    ],
    sixtySecond: [
      "Write and explain the backpropagation equations for a fully-connected network, including what δ means.",
      "Explain why the backward pass costs a constant multiple of the forward pass, and what that implies about memory."
    ]
  }
};
