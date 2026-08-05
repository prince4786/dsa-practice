export default {
  id: "regularization",
  track: "ml",
  title: "L1, L2 & Dropout",
  difficulty: 2,
  minutes: 16,
  tags: ["regularization", "sparsity", "overfitting", "generalization"],

  explainer: [
    { type: "p", text: "Regularisation buys a reduction in variance by paying with bias. Every technique here is the same trade in a different currency: a penalty on the weights, noise injected into the network, or a constraint on how long you train." },
    { type: "h3", text: "L2 (ridge / weight decay)" },
    { type: "code", lang: "python", code: "L = mse + lam * sum(w**2)\ndL/dw = grad_mse + 2*lam*w\nw <- w - lr*grad_mse - 2*lr*lam*w      # 'decay' = multiply by (1 - 2*lr*lam)" },
    { type: "p", text: "Every step shrinks `w` toward zero by a *multiplicative* factor, so the weights get small but essentially never hit exactly zero. On a linear model there is a closed form: `w = (XᵀX + λI)⁻¹Xᵀy`. In the eigenbasis of `XᵀX`, the OLS coefficient along an eigenvector with eigenvalue `s` is multiplied by `s/(s+λ)` — directions with lots of data (large `s`) are barely touched, directions with little data (small `s`) are crushed. That is exactly the right prior. It is also the MAP estimate under a **Gaussian prior** on `w`." },
    { type: "h3", text: "L1 (lasso)" },
    { type: "p", text: "`L = mse + λ·Σ|w|`. The subgradient is `λ·sign(w)`, a *constant-size* pull toward zero regardless of how small `w` is — so coefficients reach zero and stay there. The proper update is proximal (soft-thresholding):" },
    { type: "code", lang: "python", code: "w = soft_threshold(w - lr*grad_mse, lr*lam)\n#  soft(u, t) = sign(u) * max(|u| - t, 0)   -> EXACT zeros" },
    { type: "p", text: "Geometrically: the L1 constraint region is a diamond whose corners lie on the axes, so the elliptical loss contours usually first touch it at a corner — a solution with a coordinate exactly 0. The L2 ball has no corners, hence no sparsity. L1 is the MAP estimate under a **Laplace prior**." },
    { type: "callout", tone: "pitfall", text: "With correlated features, lasso arbitrarily picks one of the group and zeroes the rest — unstable across resamples, and a bad look if you present the selected features as 'the important ones'. Elastic net (`λ₁‖w‖₁ + λ₂‖w‖₂²`) keeps correlated groups together, which is why it is the default for genomics-style data." },
    { type: "h3", text: "Dropout" },
    { type: "p", text: "At training time each unit is kept with probability `p` and its activation scaled by `1/p` (inverted dropout), so the expected activation matches test time and inference needs no change. Interpretations to have ready: (1) it trains an exponentially large **ensemble** of thinned subnetworks with shared weights and averages them at test time; (2) it prevents **co-adaptation** — a unit cannot rely on a specific partner being present, so features must be individually useful; (3) for a linear model it is provably equivalent to an adaptive L2 penalty scaled by the feature's second moment." },
    { type: "list", items: [
      "**Where** — after activations in fully-connected layers, `p_drop` 0.2–0.5. Rarely useful in convolutional layers (spatial correlation defeats it; use DropBlock or just BN + augmentation) and largely replaced by other regularisers in modern transformers, though still used on attention and residual paths.",
      "**Train vs eval** — dropout must be OFF at eval. `model.eval()` in PyTorch; forgetting it is a classic bug that makes validation loss noisy and worse than training loss.",
      "**Interaction with BatchNorm** — the variance shift between train and eval makes the combination unstable; the usual advice is to pick one, or place dropout only after all BN layers."
    ]},
    { type: "h3", text: "The rest of the toolbox" },
    { type: "list", items: [
      "**Early stopping** — approximately L2 with `λ ≈ 1/(ηt)`; free and effective.",
      "**Data augmentation** — the strongest regulariser when you can define the invariances (flips, crops, mixup, SpecAugment, paraphrase).",
      "**Label smoothing** — target `1−ε` instead of 1; prevents the logits from diverging and improves calibration.",
      "**Batch/Layer norm** — mostly optimisation aids, but batch norm's minibatch noise does regularise.",
      "**Just get more data** — reduces variance with no bias cost, unlike everything above."
    ]},
    { type: "callout", tone: "tip", text: "Practical detail interviewers check: never regularise the bias/intercept (it shifts predictions for no variance benefit), and always standardise features before L1/L2 — the penalty is scale-dependent, so an unscaled feature with tiny magnitude gets an unfairly large coefficient and takes the whole penalty budget." }
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
