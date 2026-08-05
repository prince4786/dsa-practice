export default {
  id: "regularization",
  track: "ml",
  title: "L1, L2 & Dropout",
  difficulty: 2,
  minutes: 16,
  tags: ["regularization", "sparsity", "overfitting", "generalization"],

  explainer: [
    { type: "p", text: "Regularisation is the umbrella term for any technique that deliberately holds a model back from fitting its training data too perfectly, in order to make it generalise better to new data. Recall from the bias-variance lesson that this is always a trade: you accept a small increase in bias (the model becomes slightly less free to fit the true pattern exactly) in exchange for a larger decrease in variance (the model stops chasing the specific noise in its training set). Every technique covered in this lesson — L1, L2, and dropout — is the exact same trade, just paid for in a different currency: a penalty added onto the weights, random noise injected into the network during training, or some other constraint on how freely the model is allowed to fit." },
    { type: "h3", text: "L2 regularisation (also called ridge, or weight decay)" },
    { type: "code", lang: "python", code: "L = mse + lam * sum(w**2)\ndL/dw = grad_mse + 2*lam*w\nw <- w - lr*grad_mse - 2*lr*lam*w      # 'decay' = multiply by (1 - 2*lr*lam)" },
    { type: "p", text: "L2 regularisation adds an extra term to the loss, `λ·Σw²` (lambda times the sum of every weight squared), that grows larger the bigger any weight gets — so the optimizer is now rewarded for keeping weights small, not just for fitting the data. Working through the calculus, every training step ends up shrinking each weight `w` toward zero by a *multiplicative* factor (`1 − 2·lr·λ`, a number slightly less than 1), so weights get smaller and smaller but essentially never land on exactly zero — they just keep shrinking a little more each step, forever approaching but not reaching zero. For a linear model there is an exact, one-shot formula: `w = (XᵀX + λI)⁻¹Xᵀy` (compare this to the plain normal equation from the linear regression lesson — this is the same formula with `λI`, a small correction, added in). Digging one level deeper: in the coordinate system defined by the covariance structure of the data (its eigenvectors, from the gradient-descent lesson), the ordinary-least-squares coefficient along a direction with 'eigenvalue' `s` gets multiplied by `s/(s+λ)`. In plain terms, that means directions where you have plenty of reliable data (large `s`) are barely shrunk at all, while directions where the data is sparse or unreliable (small `s`) get crushed down hard — which is exactly the sensible thing to do. There's also a Bayesian interpretation worth knowing: L2 regularisation is mathematically identical to assuming, before seeing any data, that the weights are most likely to be near zero and follow a **Gaussian (bell-curve) distribution** — this Bayesian starting assumption is called a **prior**." },
    { type: "h3", text: "L1 regularisation (also called lasso)" },
    { type: "p", text: "L1 regularisation instead adds the penalty `λ·Σ|w|` (lambda times the sum of the *absolute values* of the weights, rather than their squares). Because this penalty isn't smooth at zero (its slope has a sharp corner there, so ordinary calculus doesn't quite apply and you need a generalised version called a **subgradient**), its effective pull toward zero is `λ·sign(w)` — a *constant-size* nudge toward zero regardless of how small `w` already is, unlike L2's pull which weakens as `w` shrinks. Because the pull never weakens, small coefficients get pushed all the way to exactly zero and then stay there. The correct way to apply this update in code is a technique called **soft-thresholding**:" },
    { type: "code", lang: "python", code: "w = soft_threshold(w - lr*grad_mse, lr*lam)\n#  soft(u, t) = sign(u) * max(|u| - t, 0)   -> EXACT zeros" },
    { type: "p", text: "There is also a clean geometric way to see why L1 produces exact zeros and L2 doesn't. Picture the region of allowed weight values as a shape: for L1, that region is a diamond, with sharp corners sitting exactly on the axes (meaning one or more coordinates are exactly zero); for L2, it's a smooth, round ball with no corners at all. When you look for the point where the loss (pictured as a set of nested oval rings) first touches that allowed region, the diamond's sharp corners make it far more likely the touching point lands exactly on a corner — meaning some weights are exactly 0 — while the round ball has no corners to land on, so nothing ever hits exactly zero. In Bayesian terms, L1 corresponds to assuming a **Laplace prior**: a distribution with a sharp peak right at zero, which is what produces the sparsity." },
    { type: "callout", tone: "pitfall", text: "When several input features are strongly correlated with each other, lasso tends to arbitrarily pick just one of them and zero out the rest — which one it picks can change from one random resample of the data to the next, making the selected features unstable and a poor basis for claiming 'these are the important features'. **Elastic net** (`λ₁‖w‖₁ + λ₂‖w‖₂²`, a weighted combination of both L1 and L2 penalties together) keeps correlated groups of features together instead of arbitrarily picking one, which is why it's the standard default for genomics-style data, where features are often highly correlated." },
    { type: "h3", text: "Dropout" },
    { type: "p", text: "Dropout takes a completely different approach: instead of penalising weight size, it injects random noise directly into the network during training. At each training step, every unit in a layer is randomly and independently 'kept' with some probability `p`, and 'dropped' (its output forced to exactly zero) otherwise. The surviving units have their output scaled up by `1/p` — this variant is called **inverted dropout** — specifically so that the *expected* (average) total activation stays the same whether or not dropout is active, which conveniently means no rescaling is needed at all when the model is actually used for predictions later (only during training does any dropping happen). There are three complementary ways to explain why this works, and it's worth having all three ready: (1) it effectively trains an enormous number of different 'thinned' sub-networks (each training step uses a different random subset of units) that all share the same weights, and averages their combined effect together at prediction time; (2) it prevents **co-adaptation**, meaning no single unit can learn to rely on one specific other unit always being present, forcing each unit to become independently useful on its own; (3) for a simple linear model, it can be mathematically shown to behave exactly like an L2 penalty whose strength automatically adapts to each feature's typical squared magnitude." },
    { type: "list", items: [
      "**Where it's applied** — typically right after the activation function in fully-connected layers, with a drop probability `p_drop` between 0.2 and 0.5. It's rarely useful inside convolutional layers, because neighbouring pixels are so strongly correlated that dropping one barely removes any information (a specialised variant called DropBlock, which drops whole spatial regions at once, works better there). Modern transformer models mostly rely on other regularisers instead, though dropout is still sometimes applied on the attention weights or residual paths.",
      "**Training mode vs. evaluation mode** — dropout must be switched off when actually using the trained model to make predictions (in PyTorch, this is what `model.eval()` does). Forgetting to switch it off is a classic bug: it makes validation performance look noisy and unnecessarily worse than training performance, purely because random units are still being dropped during evaluation.",
      "**Interaction with batch normalisation** — batch norm (a normalisation technique mentioned in the activations lesson) behaves differently between training and evaluation in a way that can clash badly with dropout's similar train/eval difference, making the combination unstable. The usual advice is to pick one or the other, or to place dropout only after all the batch-norm layers in the network."
    ]},
    { type: "h3", text: "The rest of the regularisation toolbox" },
    { type: "list", items: [
      "**Early stopping** — simply halting training before the model has had enough steps to start fitting noise. This behaves approximately like an L2 penalty with strength `λ ≈ 1/(η·t)` (learning rate times number of steps taken), and it is essentially free to apply.",
      "**Data augmentation** — creating extra, artificially modified training examples (flipping or cropping images, mixing two examples together, adding synthetic noise to audio, paraphrasing text) is often the single strongest regulariser available, whenever you can define transformations that shouldn't change the true label.",
      "**Label smoothing** — instead of training the model to predict a target of exactly 1 for the correct class, train it toward `1−ε` (a value just slightly below 1, where `ε` is a small constant like 0.1). This stops the model's internal scores from growing unboundedly large trying to reach an unreachable perfect 1, and tends to improve how well its predicted probabilities are calibrated (match real-world frequencies).",
      "**Batch / layer normalisation** — primarily tools that make optimization easier and more stable (covered in the activations lesson), but batch norm's use of noisy, randomly-sampled mini-batch statistics does have a genuine secondary regularising effect too.",
      "**Simply collecting more data** — as noted in the bias-variance lesson, this is the only lever that reduces variance without adding any bias cost at all, unlike every other technique listed here."
    ]},
    { type: "callout", tone: "tip", text: "Two practical details interviewers commonly check for: never apply a regularisation penalty to the bias/intercept term (shrinking it only shifts every prediction by a small constant amount, buying no variance reduction in exchange). And always standardise your features before applying L1 or L2 — the penalty's strength depends directly on the numeric scale of each weight, so a feature with tiny raw values gets an unfairly large-looking coefficient and ends up absorbing an outsized share of the penalty budget compared to features on larger scales." }
  ],

  glossary: [
    { term: "Regularisation", plain: "Any technique that deliberately limits how closely a model fits its training data, trading a small increase in bias for a larger decrease in variance, so it generalises better to new data." },
    { term: "L2 regularisation / ridge / weight decay", plain: "A penalty added to the loss that grows with the sum of the squared weights, shrinking every weight toward (but not exactly to) zero." },
    { term: "L1 regularisation / lasso", plain: "A penalty added to the loss based on the sum of the absolute values of the weights, which pushes unimportant weights all the way to exactly zero, effectively selecting features." },
    { term: "Prior (Bayesian)", plain: "An assumption about what values a model's parameters are likely to take, made before looking at the training data. Regularisation penalties correspond mathematically to specific choices of prior." },
    { term: "Subgradient", plain: "A generalised version of a derivative that still works at points where a function has a sharp corner (like the absolute-value function at zero), where an ordinary derivative isn't defined." },
    { term: "Soft-thresholding", plain: "The mathematically correct way to apply an L1 penalty during training, which shrinks a value toward zero and clips it to exactly zero once it's small enough." },
    { term: "Elastic net", plain: "A regularisation penalty combining both L1 and L2 together, used to get L1's feature-selection benefit while avoiding lasso's instability when features are correlated with each other." },
    { term: "Dropout", plain: "A training technique that randomly zeroes out a fraction of a layer's units on each training step, forcing the network to not over-rely on any single unit." },
    { term: "Inverted dropout", plain: "The standard implementation of dropout, which rescales the surviving units during training so no adjustment is needed when the model is later used to make real predictions." },
    { term: "Co-adaptation", plain: "When two or more units in a network become overly reliant on each other's specific behaviour, rather than each being independently useful — one of the problems dropout prevents." },
    { term: "Early stopping", plain: "Halting training before the model has had enough steps to start fitting noise in the training data, which behaves like a free, automatic form of regularisation." },
    { term: "Label smoothing", plain: "Training a classifier toward a target slightly less than 1 (like 0.9) for the correct class instead of exactly 1, which keeps the model's internal scores from growing unbounded and improves calibration." }
  ],

  complexity: {
    rows: [
      { operation: "Ridge closed form", time: "O(nd² + d³)", space: "O(d²)", note: "(XᵀX + λI)⁻¹Xᵀy — always invertible for λ > 0" },
      { operation: "Lasso (coordinate descent / ISTA)", time: "O(nd) per sweep", space: "O(d)", note: "no closed form; soft-threshold per coordinate" },
      { operation: "Dropout forward", time: "O(d) extra", space: "O(d) mask", note: "free at inference — mask is training-only" },
      { operation: "Full regularisation path", time: "O(k · fit)", space: "O(kd)", note: "warm-started over k values of λ (LARS is exact for lasso)" }
    ]
  },

  interview: {
    whyAsked: "It is a compact test of whether you can connect an optimisation detail (the shape of a penalty's gradient) to a modelling outcome (sparsity), and whether you know the practical gotchas — standardisation, not penalising the bias, train/eval mode.",
    followUps: [
      { q: "Why does L1 produce exact zeros and L2 does not?", a: "The L1 subgradient is `λ·sign(w)` — a constant-magnitude pull toward zero no matter how small w is, so a coefficient with insufficient signal is driven to exactly 0 and the subgradient at 0 spans [−λ, λ], holding it there. L2's gradient is `2λw`, which shrinks proportionally and vanishes as w → 0, so it approaches zero asymptotically but never arrives. Geometrically: the L1 ball has corners on the axes; the L2 ball does not." },
      { q: "What are the Bayesian interpretations?", a: "L2 is the MAP estimate with a Gaussian prior `w ~ N(0, σ²/λ)`; L1 is MAP with a Laplace prior `p(w) ∝ e^{−λ|w|}`, whose sharp peak at zero is what produces sparsity. The loss is the negative log-likelihood, the penalty is the negative log-prior." },
      { q: "How does dropout regularise?", a: "Three complementary answers: it trains an exponential ensemble of thinned subnetworks with shared weights and approximately averages them at test time; it breaks co-adaptation so no unit can depend on a specific other unit being present; and for linear models it is exactly equivalent to an L2 penalty weighted by each feature's second moment. It is noise injection, so it raises training loss and lowers the generalisation gap." },
      { q: "What is inverted dropout and why is it used?", a: "During training, keep with probability p and divide the surviving activations by p. The expected value then matches the no-dropout forward pass, so inference is the plain network with no rescaling — cheaper and less error-prone than the original formulation that scaled weights by p at test time." },
      { q: "Is weight decay the same as L2?", a: "For plain SGD, yes — adding `λ‖w‖²` to the loss produces the multiplicative shrink `(1 − ηλ)w`. For adaptive optimizers, no: an L2 term added to the gradient gets divided by `√v̂`, so parameters with large gradients are decayed less. AdamW applies the decay directly to the weights, decoupled from the adaptive scaling — that is the correct 'weight decay'." },
      { q: "Should you regularise the bias term?", a: "No. The bias sets the output's overall level; shrinking it biases predictions toward zero for no variance reduction — the intercept has one degree of freedom regardless of dimensionality. Standard libraries exclude it (sklearn does; in PyTorch you exclude biases and norm parameters from the weight-decay parameter group)." },
      { q: "Why must features be standardised before L1/L2?", a: "The penalty is on the coefficient magnitude, and a coefficient's magnitude depends on its feature's units. A feature measured in millimetres gets a coefficient 1000× larger than the same feature in metres and therefore absorbs 10⁶ times more L2 penalty. Standardising makes the penalty comparable across features." },
      { q: "When would you pick elastic net over lasso?", a: "When features are correlated (lasso picks one at random and zeroes the group, which is unstable) or when d ≫ n (lasso can select at most n features). Elastic net's L2 component keeps correlated features together and stabilises selection while the L1 component still produces sparsity." }
    ]
  },

  code: [
    { lang: "python", label: "Ridge, lasso (ISTA) and elastic net", code: "import numpy as np\n\ndef soft(u, t):\n    return np.sign(u) * np.maximum(np.abs(u) - t, 0.0)\n\ndef fit(X, y, kind=\"l2\", lam=0.1, lr=0.05, steps=500, l1_ratio=0.5):\n    n, d = X.shape\n    w = np.zeros(d)\n    for _ in range(steps):\n        g = X.T @ (X @ w - y) / n          # gradient of the MSE only\n        if kind == \"l2\":\n            w = w - lr * (g + 2 * lam * w)\n        elif kind == \"l1\":                  # proximal step -> exact zeros\n            w = soft(w - lr * g, lr * lam)\n        elif kind == \"elastic\":\n            w = soft(w - lr * (g + 2 * lam * (1 - l1_ratio) * w),\n                     lr * lam * l1_ratio)\n    return w\n\n# closed form for ridge:\n#   w = np.linalg.solve(X.T @ X + lam * np.eye(d), X.T @ y)" },
    { lang: "python", label: "Inverted dropout", code: "class Dropout:\n    def __init__(self, p_drop=0.5):\n        self.p = 1 - p_drop           # keep probability\n        self.training = True\n        self.mask = None\n\n    def forward(self, a, rng):\n        if not self.training:\n            return a                  # identity at eval -- no rescaling needed\n        self.mask = (rng.random(a.shape) < self.p) / self.p   # scale by 1/p\n        return a * self.mask\n\n    def backward(self, grad):\n        return grad * self.mask       # same mask, same scaling" },
    { lang: "python", label: "Choosing lambda by CV", code: "from sklearn.linear_model import LassoCV, RidgeCV\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\n\n# StandardScaler is not optional: the penalty is scale dependent\nlasso = make_pipeline(StandardScaler(),\n                      LassoCV(cv=5, n_alphas=100)).fit(X, y)\nalpha = lasso[-1].alpha_\nnnz = (lasso[-1].coef_ != 0).sum()\nprint(f\"alpha={alpha:.4g}, kept {nnz}/{X.shape[1]} features\")\n\n# the '1-SE rule': pick the largest alpha within one standard error of the\n# best CV score -- a simpler model that is statistically indistinguishable." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 250 },

    params: [
      { key: "mode", label: "Penalty", type: "enum", options: ["l2", "l1", "elastic", "dropout"], default: "l1" },
      { key: "lam", label: "λ ×0.01", type: "int", min: 0, max: 60, default: 12 },
      { key: "pdrop", label: "Dropout p ×0.01", type: "int", min: 0, max: 80, default: 40 },
      { key: "steps", label: "Steps", type: "int", min: 20, max: 160, default: 90 },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const d = 24, n = 60, T = params.steps;
      const lam = params.lam / 100, pDrop = params.pdrop / 100;
      const mode = params.mode;
      const lr = 0.06;
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };

      const wTrue = new Array(d).fill(0);
      wTrue[2] = 1.8; wTrue[7] = -1.4; wTrue[13] = 1.05; wTrue[19] = -0.75;

      const mk = (m) => {
        const X = [], y = [];
        for (let i = 0; i < m; i++) {
          const row = [];
          for (let j = 0; j < d; j++) row.push(gauss());
          let t = 0;
          for (let j = 0; j < d; j++) t += row[j] * wTrue[j];
          X.push(row); y.push(t + gauss() * 0.6);
        }
        return { X, y };
      };
      const tr = mk(n), te = mk(200);

      const mse = (w, D) => {
        let s = 0;
        for (let i = 0; i < D.X.length; i++) {
          let p = 0;
          for (let j = 0; j < d; j++) p += D.X[i][j] * w[j];
          const e = p - D.y[i];
          s += e * e;
        }
        return s / (2 * D.X.length);
      };

      let w = new Array(d).fill(0);
      let mask = new Array(d).fill(1);
      const hist = [];

      const stat = () => {
        let l1 = 0, l2 = 0, nz = 0;
        for (let j = 0; j < d; j++) {
          l1 += Math.abs(w[j]); l2 += w[j] * w[j];
          if (Math.abs(w[j]) > 1e-9) nz++;
        }
        return { l1, l2: Math.sqrt(l2), nz };
      };

      const snap = (over) => {
        const s = stat();
        return Object.assign({
          d, mode, lam, pDrop, step: hist.length, steps: T,
          w: w.slice(), wTrue: wTrue.slice(), mask: mask.slice(),
          l1: s.l1, l2: s.l2, nz: s.nz,
          trainMse: mse(w, tr), testMse: mse(w, te),
          hist: hist.slice(), justZeroed: []
        }, over || {});
      };

      const modeName = mode === "l2" ? "L2 (ridge)" : mode === "l1" ? "L1 (lasso, proximal)"
        : mode === "elastic" ? "elastic net" : `input dropout p=${pDrop.toFixed(2)}`;

      yield {
        label: `${d} features but only 4 carry signal (indices 2, 7, 13, 19 with true weights 1.80, −1.40, 1.05, −0.75). n = ${n} training rows — few enough that unregularised least squares will happily fit the 20 noise features. Penalty: ${modeName}, λ = ${lam.toFixed(2)}.`,
        phase: "init",
        state: snap()
      };

      for (let t = 1; t <= T; t++) {
        // ---- gradient of the data term (with dropout mask if enabled) ------
        if (mode === "dropout") {
          mask = [];
          for (let j = 0; j < d; j++) mask.push(rng() < pDrop ? 0 : 1);
        }
        const g = new Array(d).fill(0);
        for (let i = 0; i < n; i++) {
          let p = 0;
          for (let j = 0; j < d; j++) {
            const xv = mode === "dropout" ? tr.X[i][j] * mask[j] / Math.max(1e-6, 1 - pDrop) : tr.X[i][j];
            p += xv * w[j];
          }
          const e = p - tr.y[i];
          for (let j = 0; j < d; j++) {
            const xv = mode === "dropout" ? tr.X[i][j] * mask[j] / Math.max(1e-6, 1 - pDrop) : tr.X[i][j];
            g[j] += e * xv;
          }
        }
        for (let j = 0; j < d; j++) g[j] /= n;

        const before = w.slice();
        const justZeroed = [];
        for (let j = 0; j < d; j++) {
          let u = w[j] - lr * g[j];
          if (mode === "l2") {
            u = w[j] - lr * (g[j] + 2 * lam * w[j]);
          } else if (mode === "l1") {
            const th = lr * lam;
            u = Math.sign(u) * Math.max(Math.abs(u) - th, 0);
          } else if (mode === "elastic") {
            u = w[j] - lr * (g[j] + 2 * lam * 0.5 * w[j]);
            const th = lr * lam * 0.5;
            u = Math.sign(u) * Math.max(Math.abs(u) - th, 0);
          }
          if (!isFinite(u)) u = 0;
          if (Math.abs(before[j]) > 1e-9 && Math.abs(u) <= 1e-12) justZeroed.push(j);
          w[j] = u;
        }

        const s = stat();
        hist.push({ nz: s.nz, test: mse(w, te), train: mse(w, tr) });

        let label;
        const trueSet = [2, 7, 13, 19];
        const keptTrue = trueSet.filter((j) => Math.abs(w[j]) > 1e-9).length;
        if (justZeroed.length) {
          label = `Step ${t}: soft-thresholding drove coefficient${justZeroed.length > 1 ? "s" : ""} ${justZeroed.join(", ")} to EXACTLY zero — the L1 sub-gradient is a constant ±λ, so once |w| drops below lr·λ = ${(lr * lam).toFixed(4)} the update overshoots the origin and gets clipped there. ${s.nz} of ${d} coefficients remain nonzero (${keptTrue}/4 true ones kept).`;
        } else if (mode === "l2") {
          label = `Step ${t}: every weight is multiplied by (1 − 2·lr·λ) = ${(1 - 2 * lr * lam).toFixed(4)} and then moved by the data gradient. ‖w‖₂ = ${s.l2.toFixed(3)}, ‖w‖₁ = ${s.l1.toFixed(3)}, and ${s.nz}/${d} coefficients are still nonzero — L2 shrinks proportionally, so nothing ever reaches zero. Test MSE ${hist[hist.length - 1].test.toFixed(4)}.`;
        } else if (mode === "dropout") {
          const off = mask.reduce((a, b) => a + (b ? 0 : 1), 0);
          label = `Step ${t}: ${off}/${d} inputs are dropped this step (survivors scaled by 1/(1−p) = ${(1 / (1 - pDrop)).toFixed(2)} so the expected activation is unchanged). The model cannot rely on any single feature being present, so weight mass spreads out instead of concentrating. Test MSE ${hist[hist.length - 1].test.toFixed(4)}.`;
        } else {
          label = `Step ${t}: ${s.nz}/${d} nonzero, ‖w‖₁ = ${s.l1.toFixed(3)}, ‖w‖₂ = ${s.l2.toFixed(3)}. Train MSE ${hist[hist.length - 1].train.toFixed(4)}, test MSE ${hist[hist.length - 1].test.toFixed(4)} — the gap between them is what the penalty is buying you.`;
        }

        yield {
          label,
          phase: justZeroed.length ? "zeroed" : "step",
          focus: justZeroed.slice(),
          state: snap({ justZeroed: justZeroed.slice() })
        };
      }

      const s = stat();
      const trueSet = [2, 7, 13, 19];
      const keptTrue = trueSet.filter((j) => Math.abs(w[j]) > 1e-9).length;
      const falsePos = s.nz - keptTrue;
      yield {
        label: `Done after ${T} steps. ${s.nz}/${d} nonzero coefficients: ${keptTrue}/4 true signals kept, ${falsePos} noise features surviving. Train MSE ${mse(w, tr).toFixed(4)} vs test MSE ${mse(w, te).toFixed(4)}. ` +
          (mode === "l1" || mode === "elastic"
            ? "L1 did feature selection for free — but with correlated features it would have picked one of each group arbitrarily."
            : mode === "l2"
              ? "L2 kept every coefficient but shrank the noise ones toward zero; you get stability, not sparsity."
              : "Dropout spread the weight mass across features rather than shrinking it — noise injection, not an explicit penalty."),
        phase: "done",
        state: snap()
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const padL = 46, padR = 172, padT = 46, padB = 92;
      const pw = W - padL - padR, ph = H - padT - padB;
      const d = S.d;
      const cw = pw / d;

      let vmax = 0.5;
      for (let j = 0; j < d; j++) {
        vmax = Math.max(vmax, Math.abs(S.w[j]), Math.abs(S.wTrue[j]));
      }
      vmax *= 1.15;
      const zeroY = padT + ph / 2;
      const VY = (v) => zeroY - (Math.max(-vmax, Math.min(vmax, v)) / vmax) * (ph / 2);

      // ---- header ----------------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `13px ${env.font.base}`; ctx.fillStyle = C.text;
      const modeLabel = S.mode === "l2" ? "L2 · w ← (1 − 2ηλ)w − η∇"
        : S.mode === "l1" ? "L1 · w ← soft(w − η∇, ηλ)"
          : S.mode === "elastic" ? "elastic net · L2 shrink then soft-threshold"
            : "dropout · random inputs blanked each step";
      ctx.fillText(modeLabel, padL, 22);
      ctx.font = `12px ${env.font.mono}`; ctx.fillStyle = C.text2; ctx.textAlign = "right";
      ctx.fillText(`step ${S.step}/${S.steps}`, W - 14, 22);

      // ---- grid ------------------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`;
      for (let k = -2; k <= 2; k++) {
        const v = (k / 2) * vmax;
        const Y = VY(v);
        ctx.strokeStyle = k === 0 ? C.axis : C.grid;
        ctx.lineWidth = k === 0 ? 1.4 : 1;
        ctx.beginPath(); ctx.moveTo(padL, Y); ctx.lineTo(padL + pw, Y); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right";
        ctx.fillText(v.toFixed(1), padL - 6, Y + 3);
      }
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.save();
      ctx.translate(14, zeroY); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.fillText("coefficient value", 0, 0);
      ctx.restore();

      // ---- coefficients ----------------------------------------------------
      for (let j = 0; j < d; j++) {
        const cx = padL + (j + 0.5) * cw;
        const informative = Math.abs(S.wTrue[j]) > 1e-9;
        const dropped = S.mode === "dropout" && S.mask[j] === 0;

        // true value ghost
        if (informative) {
          ctx.strokeStyle = C.viz6; ctx.lineWidth = 1.4; ctx.setLineDash([3, 3]);
          ctx.beginPath();
          ctx.moveTo(cx - cw * 0.36, VY(S.wTrue[j]));
          ctx.lineTo(cx + cw * 0.36, VY(S.wTrue[j]));
          ctx.stroke(); ctx.setLineDash([]);
        }

        const v = S.w[j];
        const isZero = Math.abs(v) <= 1e-12;
        const flash = S.justZeroed.indexOf(j) >= 0;

        // lollipop stick
        ctx.strokeStyle = dropped ? C.muted : isZero ? C.border : (informative ? C.viz1 : C.viz4);
        ctx.globalAlpha = dropped ? 0.35 : 1;
        ctx.lineWidth = Math.max(2, cw * 0.3);
        ctx.beginPath(); ctx.moveTo(cx, zeroY); ctx.lineTo(cx, VY(v)); ctx.stroke();

        // head
        ctx.fillStyle = flash ? C.viz6 : isZero ? C.muted : (informative ? C.viz1 : C.viz4);
        ctx.beginPath();
        ctx.arc(cx, VY(v), isZero ? 3 : 4.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (flash) {
          ctx.strokeStyle = C.viz6; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(cx, zeroY, 9, 0, Math.PI * 2); ctx.stroke();
        }
        if (dropped) {
          ctx.strokeStyle = C.danger; ctx.lineWidth = 1.6;
          const yy = padT + ph + 10;
          ctx.beginPath();
          ctx.moveTo(cx - 4, yy - 4); ctx.lineTo(cx + 4, yy + 4);
          ctx.moveTo(cx + 4, yy - 4); ctx.lineTo(cx - 4, yy + 4);
          ctx.stroke();
        }

        // index tick
        if (d <= 30) {
          ctx.fillStyle = informative ? C.text2 : C.muted;
          ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "center";
          ctx.fillText(String(j), cx, padT + ph + 26);
        }
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2; ctx.strokeRect(padL, padT, pw, ph);
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
      ctx.fillText("feature index", padL + pw / 2, padT + ph + 42);

      // ---- legend ----------------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `10px ${env.font.base}`;
      let lx = padL;
      const li = (col, txt, dashed) => {
        if (dashed) {
          ctx.strokeStyle = col; ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(lx, H - 20); ctx.lineTo(lx + 12, H - 20); ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(lx + 5, H - 20, 4.4, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = C.text2;
        ctx.fillText(txt, lx + 17, H - 17);
        lx += 20 + ctx.measureText(txt).width;
      };
      li(C.viz1, "true signal coefficient");
      li(C.viz4, "noise coefficient");
      li(C.viz6, "true value", true);
      if (S.mode === "dropout") li(C.danger, "dropped this step");

      // ---- panel -----------------------------------------------------------
      const px = W - padR + 14;
      let ty = padT + 4;
      const row = (k, v, col) => {
        ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.muted; ctx.textAlign = "left";
        ctx.fillText(k, px, ty);
        ctx.font = `12px ${env.font.mono}`; ctx.fillStyle = col || C.text; ctx.textAlign = "right";
        ctx.fillText(v, W - 14, ty);
        ty += 19;
      };
      row("λ", S.lam.toFixed(2), C.viz4);
      row("nonzero", `${S.nz}/${S.d}`, S.nz <= 6 ? C.ok : C.text);
      row("‖w‖₁", S.l1.toFixed(3));
      row("‖w‖₂", S.l2.toFixed(3));
      ty += 6;
      row("train MSE", S.trainMse.toFixed(4), C.viz3);
      row("test MSE", S.testMse.toFixed(4), C.viz2);
      row("gap", (S.testMse - S.trainMse).toFixed(4), C.muted);

      // sparsity / error history
      const gw = W - 14 - px, gh = 66;
      const gy = padT + ph - gh + 20;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(px, gy, gw, gh);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("nonzero count & test MSE", px, gy - 6);
      if (S.hist.length > 1) {
        const maxTest = Math.max.apply(null, S.hist.map((h) => h.test));
        ctx.strokeStyle = C.viz2; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < S.hist.length; i++) {
          const X = px + (i / Math.max(1, S.steps - 1)) * gw;
          const Y = gy + gh - (S.hist[i].test / Math.max(1e-9, maxTest)) * (gh - 3) - 1.5;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < S.hist.length; i++) {
          const X = px + (i / Math.max(1, S.steps - 1)) * gw;
          const Y = gy + gh - (S.hist[i].nz / S.d) * (gh - 3) - 1.5;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
    }
  },

  drill: {
    cards: [
      { q: "Why does L1 give exact zeros but L2 does not?", a: "L1's subgradient is `λ·sign(w)` — constant magnitude toward zero regardless of |w|, and the subgradient at 0 spans [−λ,λ], so coefficients stick at exactly 0. L2's `2λw` shrinks proportionally and vanishes as w → 0. Geometrically, the L1 ball has corners on the axes.", tags: ["sparsity"] },
      { q: "Give the ridge closed form and its eigen-interpretation.", a: "`w = (XᵀX + λI)⁻¹Xᵀy`. In the eigenbasis of XᵀX, the OLS coefficient along an eigenvalue-s direction is multiplied by `s/(s+λ)`: well-determined directions survive, poorly-determined ones are crushed.", tags: ["ridge"] },
      { q: "What priors correspond to L1 and L2?", a: "L2 = MAP with a Gaussian prior on w; L1 = MAP with a Laplace prior, whose sharp peak at 0 produces sparsity. Loss = negative log-likelihood, penalty = negative log-prior.", tags: ["bayesian"] },
      { q: "State the three interpretations of dropout.", a: "(1) Trains an exponential ensemble of thinned subnetworks with shared weights, approximately averaged at test time; (2) prevents co-adaptation so each unit must be individually useful; (3) for linear models it equals an adaptive L2 penalty scaled by feature second moments.", tags: ["dropout"] },
      { q: "What is inverted dropout?", a: "Keep with probability p during training and scale surviving activations by 1/p, so the expected activation matches eval. Inference is then the plain network with dropout off — no test-time rescaling.", tags: ["dropout"] },
      { q: "Is weight decay identical to L2?", a: "Under plain SGD yes. Under Adam no — an L2 term added to the gradient gets divided by √v̂, making decay gradient-dependent. AdamW applies `−lr·λ·w` directly to the weight, decoupled.", tags: ["adamw"] },
      { q: "Two things you must NOT forget before applying L1/L2.", a: "Standardise features (the penalty is scale-dependent) and exclude the bias/intercept from the penalty (shrinking it adds bias with no variance benefit).", tags: ["practice"] },
      { q: "When is elastic net better than lasso?", a: "With correlated features (lasso arbitrarily selects one of a group, making selection unstable) and when d ≫ n (lasso can pick at most n features). The L2 part keeps correlated groups together.", tags: ["elastic-net"] }
    ],
    sixtySecond: [
      "Explain L1 vs L2 regularisation: the update rules, the geometry, the priors, and when you would use each.",
      "Explain dropout: the training-time procedure, why inverted scaling is used, and three ways to justify why it regularises."
    ]
  }
};
