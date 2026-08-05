export default {
  id: "linear-logistic",
  track: "ml",
  title: "Linear & Logistic Regression",
  difficulty: 1,
  minutes: 15,
  tags: ["supervised", "regression", "classification", "mle"],

  explainer: [
    { type: "p", text: "These two models are the same machine with a different output head. Both compute a linear score `z = wᵀx + b`. Linear regression returns `z` and is trained on squared error; logistic regression squashes `z` through a sigmoid into a probability and is trained on log loss. Remarkably, **both have the same gradient**: `(ŷ − y)x`. That is not a coincidence — it falls out of the exponential family, and interviewers love making you derive it." },
    { type: "h3", text: "Linear regression" },
    { type: "p", text: "Model `ŷ = wᵀx + b`, loss `L = ½·mean((ŷ − y)²)`. The closed-form solution is the normal equation `w = (XᵀX)⁻¹Xᵀy`, which costs `O(nd² + d³)` — fine for `d` in the hundreds, hopeless for `d` in the millions, and numerically fragile when `XᵀX` is near-singular (collinear features). Ridge `(XᵀX + λI)⁻¹Xᵀy` fixes both the singularity and the variance." },
    { type: "p", text: "The probabilistic story: squared error is the negative log-likelihood of `y = wᵀx + ε` with `ε ~ N(0, σ²)`. So least squares *is* maximum likelihood under Gaussian noise — which also tells you why it is sensitive to outliers (a Gaussian gives an outlier astronomically low likelihood, so the fit contorts to accommodate it). Huber or MAE loss is the robust answer." },
    { type: "h3", text: "Logistic regression" },
    { type: "p", text: "Model `p = σ(z) = 1/(1+e^{−z})`, loss `L = −mean(y·log p + (1−y)·log(1−p))` — the binary cross-entropy, which is the negative log-likelihood of a Bernoulli. The output is a genuine calibrated probability, not a distance." },
    { type: "h3", text: "The derivation interviewers ask for" },
    { type: "p", text: "Show that `∂L/∂z = p − y`. Use `σ′(z) = σ(z)(1−σ(z)) = p(1−p)`. For one example:" },
    { type: "code", lang: "python", code: "L  = -[ y·log p + (1-y)·log(1-p) ]\ndL/dp = -y/p + (1-y)/(1-p) = (p - y) / (p(1-p))\ndp/dz = p(1-p)\ndL/dz = dL/dp · dp/dz = (p - y)            #  the p(1-p) cancels\ndL/dw = dL/dz · dz/dw = (p - y)·x" },
    { type: "p", text: "That cancellation is the whole point of pairing sigmoid with cross-entropy: the `p(1−p)` factor — which is ≈0 for a confidently wrong prediction — is annihilated, so a confidently wrong example still produces a large gradient. Pair sigmoid with **squared** error instead and the gradient becomes `(p−y)·p(1−p)·x`, which vanishes exactly when you are most wrong. That is the real reason MSE is not used for classification." },
    { type: "callout", tone: "pitfall", text: "Never compute `log(sigmoid(z))` naively — it underflows to `-inf` for `z ≈ −40`. Use the log-sum-exp-stable form `max(z,0) − z·y + log(1 + e^{−|z|})`, which is what `binary_cross_entropy_with_logits` does. This is a real production bug, and a great answer to 'anything you'd watch out for?'." },
    { type: "h3", text: "Properties worth naming" },
    { type: "list", items: [
      "**Convexity** — both losses are convex in `w`, so there is one global optimum and no initialisation worry. Almost nothing else in ML has this.",
      "**Separable data breaks MLE** — if the classes are linearly separable, the likelihood is maximised by pushing `‖w‖ → ∞`. Weights diverge; any L2 penalty stops it.",
      "**Interpretability** — `wⱼ` is the change in the **log-odds** per unit of `xⱼ`; `e^{wⱼ}` is the odds ratio. This is why logistic regression survives in medicine and credit scoring.",
      "**Multi-class** — replace sigmoid with softmax; the gradient is still `(p − y)xᵀ` with `y` one-hot.",
      "**The decision boundary is a hyperplane** — `wᵀx + b = 0`. Non-linear boundaries require feature engineering, kernels, or a network."
    ]},
    { type: "callout", tone: "tip", text: "Logistic regression is still the right first model on tabular data: it trains in seconds, gives calibrated probabilities, and its coefficients are a free feature-importance report. Beat it with gradient boosting before you reach for a network." }
  ],

  complexity: {
    rows: [
      { operation: "Linear, normal equation", time: "O(nd² + d³)", space: "O(d²)", note: "exact; fails on collinear X without ridge" },
      { operation: "Linear/logistic, GD epoch", time: "O(nd)", space: "O(d)", note: "the only option for large d" },
      { operation: "Logistic, Newton / IRLS", time: "O(nd² + d³) per step", space: "O(d²)", note: "few iterations; what statsmodels/sklearn-lbfgs approximate" },
      { operation: "Prediction", time: "O(d)", space: "O(d)", note: "one dot product" }
    ]
  },

  interview: {
    whyAsked: "It is the fastest way to find out whether you understand a model as a likelihood rather than as an API call. The derivation of the logistic gradient, the reason cross-entropy beats MSE for classification, and what a coefficient actually means are all one-question filters.",
    followUps: [
      { q: "Derive the gradient of the logistic loss.", a: "With `p = σ(z)`, `z = wᵀx`: `dL/dp = (p−y)/(p(1−p))` and `dp/dz = p(1−p)`, so `dL/dz = p − y` and `dL/dw = (p − y)x`. The sigmoid derivative cancels the denominator of the cross-entropy derivative — that cancellation is why the pairing is used." },
      { q: "Why not use MSE for classification?", a: "Two reasons. (1) Gradient: with MSE the gradient is `(p−y)·p(1−p)·x`, which goes to zero exactly when the model is confidently wrong, so learning stalls on the hardest examples. (2) Loss shape: MSE on a sigmoid output is non-convex in `w`, whereas cross-entropy is convex. Cross-entropy is also the correct negative log-likelihood for a Bernoulli target." },
      { q: "What does a logistic regression coefficient mean?", a: "`wⱼ` is the additive change in the log-odds of the positive class per one-unit increase in `xⱼ`, holding the others fixed; `exp(wⱼ)` is the multiplicative change in the odds. It is *not* a change in probability — the probability change depends on where you sit on the sigmoid." },
      { q: "What happens if the classes are perfectly separable?", a: "The maximum-likelihood solution does not exist: scaling `w` by any factor > 1 strictly increases the likelihood, so the optimiser drives `‖w‖ → ∞` and probabilities saturate at 0/1. sklearn hides this by defaulting to L2 regularisation (`C=1.0`). Any L1/L2 penalty gives a finite optimum." },
      { q: "When is the normal equation the wrong choice?", a: "When `d` is large (the `d³` inverse dominates), when `XᵀX` is singular or ill-conditioned from collinear features (use ridge or the pseudo-inverse via SVD), or when the data does not fit in memory. Gradient methods and QR/SVD-based least squares are the alternatives." },
      { q: "How do you extend logistic regression to K classes?", a: "Softmax regression: scores `zₖ = wₖᵀx`, `pₖ = e^{zₖ}/Σⱼe^{zⱼ}`, loss = categorical cross-entropy. The gradient is again `(p − y)xᵀ` with `y` a one-hot vector. Note the parameters are over-determined by one degree of freedom (adding a constant to every zₖ changes nothing), which is why some formulations fix the last class's weights to zero." },
      { q: "Your logistic model has 99% accuracy on a 1% positive-rate dataset. Reaction?", a: "Predicting all-negative also gets 99%, so accuracy is meaningless here. Ask for precision/recall at the operating threshold, PR-AUC, and the confusion matrix. Also check calibration — with class imbalance and a re-weighted or re-sampled training set, the predicted probabilities are shifted and need Platt scaling or an intercept correction." }
    ]
  },

  code: [
    { lang: "python", label: "Logistic regression with GD (stable)", code: "import numpy as np\n\ndef sigmoid(z):\n    out = np.empty_like(z)\n    pos, neg = z >= 0, z < 0\n    out[pos] = 1 / (1 + np.exp(-z[pos]))\n    ez = np.exp(z[neg])                       # avoid exp(+large)\n    out[neg] = ez / (1 + ez)\n    return out\n\ndef bce_with_logits(z, y):\n    # log(1+e^z) computed stably:  max(z,0) + log1p(exp(-|z|))\n    return np.mean(np.maximum(z, 0) - z * y + np.log1p(np.exp(-np.abs(z))))\n\ndef fit_logistic(X, y, lr=0.1, epochs=300, l2=0.0):\n    n, d = X.shape\n    w, b = np.zeros(d), 0.0\n    for _ in range(epochs):\n        z = X @ w + b\n        p = sigmoid(z)\n        err = p - y                            # <- the whole gradient story\n        gw = X.T @ err / n + l2 * w\n        gb = err.mean()\n        w -= lr * gw\n        b -= lr * gb\n    return w, b" },
    { lang: "python", label: "Linear regression: three ways", code: "def normal_equation(X, y, l2=0.0):\n    d = X.shape[1]\n    return np.linalg.solve(X.T @ X + l2 * np.eye(d), X.T @ y)\n\ndef lstsq(X, y):\n    \"\"\"SVD-based: handles rank-deficient X without blowing up.\"\"\"\n    return np.linalg.lstsq(X, y, rcond=None)[0]\n\ndef gd(X, y, lr=0.05, epochs=500):\n    n, d = X.shape\n    w = np.zeros(d)\n    for _ in range(epochs):\n        w -= lr * (X.T @ (X @ w - y)) / n     # same (yhat - y)x form\n    return w" },
    { lang: "python", label: "Softmax regression (K classes)", code: "def softmax(Z):\n    Z = Z - Z.max(axis=1, keepdims=True)      # stability\n    E = np.exp(Z)\n    return E / E.sum(axis=1, keepdims=True)\n\ndef fit_softmax(X, Y, lr=0.1, epochs=300):    # Y is (n, K) one-hot\n    n, d = X.shape; K = Y.shape[1]\n    W = np.zeros((d, K))\n    for _ in range(epochs):\n        P = softmax(X @ W)\n        W -= lr * X.T @ (P - Y) / n           # gradient is (P - Y) again\n    return W" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.8, maxFrames: 220 },

    params: [
      { key: "mode", label: "Model", type: "enum", options: ["linear", "logistic"], default: "logistic" },
      { key: "n", label: "Points", type: "int", min: 20, max: 160, default: 70 },
      { key: "lr", label: "Learning rate ×0.01", type: "int", min: 1, max: 100, default: 40 },
      { key: "epochs", label: "Epochs", type: "int", min: 10, max: 150, default: 60 },
      { key: "noise", label: "Noise ×0.1", type: "int", min: 0, max: 20, default: 6 },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = params.n, lr = params.lr / 100, E = params.epochs, noise = params.noise / 10;
      const logistic = params.mode === "logistic";
      // Box-Muller from the injected rng
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const sig = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

      const pts = [];
      const TRUE = logistic ? { w1: 1.4, w2: -1.0, b: 0.3 } : { w: 1.35, b: -0.4 };

      if (logistic) {
        for (let i = 0; i < n; i++) {
          const lab = i % 2;
          const cx = lab ? 1.05 : -1.05, cy = lab ? 0.85 : -0.75;
          const x = cx + gauss() * (0.55 + noise * 0.35);
          const y = cy + gauss() * (0.55 + noise * 0.35);
          pts.push({ x, y, label: lab });
        }
      } else {
        for (let i = 0; i < n; i++) {
          const x = (rng() * 2 - 1) * 2.6;
          const y = TRUE.w * x + TRUE.b + gauss() * (0.15 + noise * 0.5);
          pts.push({ x, y, label: 0 });
        }
      }

      let w1 = 0, w2 = 0, b = 0;
      const hist = [];

      const evaluate = () => {
        let loss = 0, correct = 0;
        for (const p of pts) {
          if (logistic) {
            const z = w1 * p.x + w2 * p.y + b;
            const q = sig(z);
            loss += Math.max(z, 0) - z * p.label + Math.log1p(Math.exp(-Math.abs(z)));
            if ((q >= 0.5 ? 1 : 0) === p.label) correct++;
          } else {
            const e = (w1 * p.x + b) - p.y;
            loss += 0.5 * e * e;
          }
        }
        return { loss: loss / n, acc: correct / n };
      };

      const gradient = () => {
        let g1 = 0, g2 = 0, gb = 0;
        for (const p of pts) {
          if (logistic) {
            const err = sig(w1 * p.x + w2 * p.y + b) - p.label;   // (ŷ − y)
            g1 += err * p.x; g2 += err * p.y; gb += err;
          } else {
            const err = (w1 * p.x + b) - p.y;
            g1 += err * p.x; gb += err;
          }
        }
        return [g1 / n, g2 / n, gb / n];
      };

      let ev = evaluate();
      hist.push(ev.loss);

      const snap = () => ({
        mode: params.mode,
        pts: pts.map((p) => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4), label: p.label })),
        w1, w2, b, loss: ev.loss, acc: ev.acc,
        hist: hist.slice(), epoch: hist.length - 1, lr, epochs: E,
        g1: 0, g2: 0, gb: 0
      });

      yield {
        label: logistic
          ? `${n} points, two classes, weights initialised to zero — so every point gets p = σ(0) = 0.5 and the loss is exactly log 2 = ${Math.log(2).toFixed(4)}. Gradient descent on −log-likelihood starts now.`
          : `${n} points around the line y = ${TRUE.w}x ${TRUE.b < 0 ? "−" : "+"} ${Math.abs(TRUE.b)} with noise σ ≈ ${(0.15 + noise * 0.5).toFixed(2)}. Weights start at zero, so the fit is the flat line y = 0 and the loss is just the variance of y.`,
        phase: "init",
        state: snap()
      };

      for (let e = 1; e <= E; e++) {
        const [g1, g2, gb] = gradient();
        const prev = ev.loss;
        w1 -= lr * g1;
        if (logistic) w2 -= lr * g2;
        b -= lr * gb;
        ev = evaluate();
        hist.push(ev.loss);

        const st = snap();
        st.g1 = +g1.toFixed(5); st.g2 = +g2.toFixed(5); st.gb = +gb.toFixed(5);

        let label;
        if (e === 1) {
          label = logistic
            ? `Epoch 1. Every gradient term is (p − y)·x with p = 0.5, so the update is just the mean of ±0.5·x over the two classes: ∇ = (${g1.toFixed(3)}, ${g2.toFixed(3)}, ${gb.toFixed(3)}). Loss ${prev.toFixed(4)} → ${ev.loss.toFixed(4)}.`
            : `Epoch 1. Gradient of ½(ŷ−y)² is (ŷ−y)x — identical in form to the logistic one. ∇w = ${g1.toFixed(3)}, ∇b = ${gb.toFixed(3)}. Loss ${prev.toFixed(4)} → ${ev.loss.toFixed(4)}.`;
        } else if (logistic) {
          label = `Epoch ${e}: log-loss ${prev.toFixed(4)} → ${ev.loss.toFixed(4)}, accuracy ${(ev.acc * 100).toFixed(1)}%. ‖w‖ = ${Math.hypot(w1, w2).toFixed(3)} and growing — a bigger ‖w‖ makes the sigmoid steeper, i.e. more confident. Only misclassified and near-boundary points still contribute much gradient.`;
        } else {
          label = `Epoch ${e}: MSE ${prev.toFixed(4)} → ${ev.loss.toFixed(4)}. Fit is y = ${w1.toFixed(3)}x ${b < 0 ? "−" : "+"} ${Math.abs(b).toFixed(3)}; residual gradient ∇w = ${g1.toFixed(4)} still pulls the slope ${g1 > 0 ? "down" : "up"}.`;
        }

        yield { label, phase: e === E ? "done" : "fit", state: st };
      }

      const st = snap();
      yield {
        label: logistic
          ? `Converged-ish after ${E} epochs: w = (${w1.toFixed(3)}, ${w2.toFixed(3)}), b = ${b.toFixed(3)}, log-loss ${ev.loss.toFixed(4)}, accuracy ${(ev.acc * 100).toFixed(1)}%. The boundary is the line wᵀx + b = 0; a unit step along w multiplies the odds by e^{‖w‖} = ${Math.exp(Math.hypot(w1, w2)).toFixed(1)}.`
          : `Converged-ish after ${E} epochs: ŷ = ${w1.toFixed(3)}x ${b < 0 ? "−" : "+"} ${Math.abs(b).toFixed(3)} against the true ${TRUE.w}x ${TRUE.b < 0 ? "−" : "+"} ${Math.abs(TRUE.b)}. MSE ${ev.loss.toFixed(4)}; the gap to zero is the irreducible noise, not bias.`,
        phase: "done",
        state: st
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      const logistic = S.mode === "logistic";
      ctx.clearRect(0, 0, W, H);

      const padL = 46, padR = 190, padT = 30, padB = 42;
      const pw = W - padL - padR, ph = H - padT - padB;
      const xMin = -3.2, xMax = 3.2;
      const yMin = logistic ? -3.0 : -4.6, yMax = logistic ? 3.0 : 4.6;
      const PX = (x) => padL + ((x - xMin) / (xMax - xMin)) * pw;
      const PY = (y) => padT + ph - ((y - yMin) / (yMax - yMin)) * ph;

      // ---- probability shading (logistic only) ----------------------------
      if (logistic) {
        const cols = 34, rows = 22;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = xMin + ((i + 0.5) / cols) * (xMax - xMin);
            const y = yMin + ((j + 0.5) / rows) * (yMax - yMin);
            const z = S.w1 * x + S.w2 * y + S.b;
            const p = z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z));
            ctx.globalAlpha = Math.abs(p - 0.5) * 0.5;
            ctx.fillStyle = p >= 0.5 ? C.viz1 : C.viz2;
            ctx.fillRect(padL + (i / cols) * pw, padT + (j / rows) * ph,
              pw / cols + 1, ph / rows + 1);
          }
        }
        ctx.globalAlpha = 1;
      }

      // ---- grid & axes -----------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -3; t <= 3; t++) {
        const X = PX(t);
        ctx.beginPath(); ctx.moveTo(X, padT); ctx.lineTo(X, padT + ph); ctx.stroke();
        ctx.textAlign = "center"; ctx.fillText(t.toFixed(0), X, padT + ph + 14);
      }
      const yStep = logistic ? 1 : 2;
      for (let t = Math.ceil(yMin); t <= yMax; t += yStep) {
        const Y = PY(t);
        ctx.beginPath(); ctx.moveTo(padL, Y); ctx.lineTo(padL + pw, Y); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(t.toFixed(0), padL - 6, Y + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.strokeRect(padL, padT, pw, ph);
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.textAlign = "right"; ctx.fillText(logistic ? "x₁" : "x", padL + pw - 4, padT + ph - 6);
      ctx.textAlign = "left"; ctx.fillText(logistic ? "x₂" : "y", padL + 5, padT + 12);

      // ---- fit -------------------------------------------------------------
      ctx.lineWidth = 2.2;
      if (logistic) {
        // boundary  w1·x + w2·y + b = 0
        ctx.save();
        ctx.beginPath(); ctx.rect(padL, padT, pw, ph); ctx.clip();
        ctx.strokeStyle = C.viz7; ctx.lineWidth = 2.2;
        ctx.beginPath();
        if (Math.abs(S.w2) > 1e-6) {
          const ya = -(S.w1 * xMin + S.b) / S.w2, yb = -(S.w1 * xMax + S.b) / S.w2;
          ctx.moveTo(PX(xMin), PY(ya)); ctx.lineTo(PX(xMax), PY(yb));
        } else if (Math.abs(S.w1) > 1e-6) {
          const xa = -S.b / S.w1;
          ctx.moveTo(PX(xa), PY(yMin)); ctx.lineTo(PX(xa), PY(yMax));
        }
        ctx.stroke();
        ctx.restore();
      } else {
        ctx.save();
        ctx.beginPath(); ctx.rect(padL, padT, pw, ph); ctx.clip();
        // residual sticks
        ctx.strokeStyle = C.viz2; ctx.lineWidth = 1; ctx.globalAlpha = 0.5;
        for (const p of S.pts) {
          const yh = S.w1 * p.x + S.b;
          ctx.beginPath(); ctx.moveTo(PX(p.x), PY(p.y)); ctx.lineTo(PX(p.x), PY(yh)); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.strokeStyle = C.viz7; ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(PX(xMin), PY(S.w1 * xMin + S.b));
        ctx.lineTo(PX(xMax), PY(S.w1 * xMax + S.b));
        ctx.stroke();
        ctx.restore();
      }

      // ---- points ----------------------------------------------------------
      for (const p of S.pts) {
        const X = PX(p.x), Y = PY(p.y);
        if (X < padL - 4 || X > padL + pw + 4 || Y < padT - 4 || Y > padT + ph + 4) continue;
        if (logistic) {
          const z = S.w1 * p.x + S.w2 * p.y + S.b;
          const pred = z >= 0 ? 1 : 0;
          const wrong = pred !== p.label;
          ctx.fillStyle = p.label === 1 ? C.viz1 : C.viz2;
          ctx.beginPath();
          if (p.label === 1) ctx.arc(X, Y, 4.2, 0, Math.PI * 2);
          else { ctx.moveTo(X, Y - 4.6); ctx.lineTo(X + 4.6, Y + 3.4); ctx.lineTo(X - 4.6, Y + 3.4); ctx.closePath(); }
          ctx.fill();
          if (wrong) {
            ctx.strokeStyle = C.danger; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.arc(X, Y, 7.5, 0, Math.PI * 2); ctx.stroke();
          }
        } else {
          ctx.fillStyle = C.viz1;
          ctx.beginPath(); ctx.arc(X, Y, 3.4, 0, Math.PI * 2); ctx.fill();
        }
      }

      // ---- panel -----------------------------------------------------------
      const px0 = W - padR + 14;
      let ty = padT + 12;
      ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`;
      ctx.fillText(logistic ? "p = σ(w·x + b)" : "ŷ = w·x + b", px0, ty); ty += 22;
      const row = (k, v, col) => {
        ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.muted; ctx.textAlign = "left";
        ctx.fillText(k, px0, ty);
        ctx.font = `12px ${env.font.mono}`; ctx.fillStyle = col || C.text; ctx.textAlign = "right";
        ctx.fillText(v, W - 14, ty); ty += 19;
      };
      row("epoch", `${S.epoch}/${S.epochs}`);
      row(logistic ? "log-loss" : "MSE", S.loss.toFixed(5), C.viz3);
      if (logistic) row("accuracy", `${(S.acc * 100).toFixed(1)}%`, C.ok);
      ty += 4;
      row("w₁", S.w1.toFixed(4));
      if (logistic) row("w₂", S.w2.toFixed(4));
      row("b", S.b.toFixed(4));
      ty += 4;
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("gradient = mean (ŷ − y)·x", px0, ty); ty += 16;
      row("∇w₁", S.g1.toFixed(4), C.viz2);
      if (logistic) row("∇w₂", S.g2.toFixed(4), C.viz2);
      row("∇b", S.gb.toFixed(4), C.viz2);

      // ---- loss curve ------------------------------------------------------
      const gw = W - 14 - px0, gh = 56, gx0 = px0, gy0 = padT + ph - gh;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(gx0, gy0, gw, gh);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("loss vs epoch", gx0, gy0 - 6);
      const hs = S.hist;
      if (hs.length > 1) {
        const hi = Math.max.apply(null, hs), lo = 0;
        ctx.strokeStyle = C.viz3; ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < hs.length; i++) {
          const X = gx0 + (i / Math.max(1, S.epochs)) * gw;
          const Y = gy0 + gh - ((hs[i] - lo) / Math.max(1e-9, hi - lo)) * (gh - 4) - 2;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(hi.toFixed(2), gx0 + 2, gy0 + 10);
        ctx.fillText("0", gx0 + 2, gy0 + gh - 3);
      }

      // ---- legend ----------------------------------------------------------
      ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      if (logistic) {
        ctx.fillStyle = C.viz1; ctx.beginPath(); ctx.arc(padL + 6, 18, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.text2; ctx.fillText("y = 1", padL + 14, 21);
        ctx.fillStyle = C.viz2;
        ctx.beginPath(); ctx.moveTo(padL + 56, 13); ctx.lineTo(padL + 61, 22); ctx.lineTo(padL + 51, 22); ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.text2; ctx.fillText("y = 0", padL + 66, 21);
        ctx.strokeStyle = C.danger; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.arc(padL + 112, 18, 5, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = C.text2; ctx.fillText("misclassified", padL + 122, 21);
      } else {
        ctx.fillStyle = C.text2; ctx.fillText("orange sticks = residuals ŷ − y (squared error minimises their total)", padL, 20);
      }
    }
  },

  drill: {
    cards: [
      { q: "What is the gradient of the logistic loss w.r.t. w, and why does the sigmoid derivative disappear?", a: "`∇w = (p − y)x`. `dL/dp = (p−y)/(p(1−p))` and `dp/dz = p(1−p)`; the `p(1−p)` cancels. That is why a confidently wrong prediction still yields a large gradient.", tags: ["derivation"] },
      { q: "Why is MSE a bad loss for classification?", a: "Its gradient `(p−y)p(1−p)x` vanishes exactly when the model is most confidently wrong, so learning stalls; and MSE-on-sigmoid is non-convex in w while cross-entropy is convex. Cross-entropy is also the correct Bernoulli NLL.", tags: ["loss"] },
      { q: "What probabilistic assumption makes least squares the MLE?", a: "Gaussian noise: `y = wᵀx + ε`, `ε ~ N(0,σ²)`. Minimising squared error = maximising that likelihood. It is why least squares is outlier-sensitive.", tags: ["theory"] },
      { q: "Interpret a logistic coefficient of 0.7.", a: "A one-unit increase in that feature adds 0.7 to the log-odds of the positive class, i.e. multiplies the odds by e^0.7 ≈ 2.0, holding other features fixed. It is not a fixed change in probability.", tags: ["interpretation"] },
      { q: "What breaks when training data is linearly separable?", a: "MLE has no finite solution — scaling w up always increases the likelihood, so ‖w‖ → ∞ and probabilities saturate. Any L1/L2 penalty restores a finite optimum.", tags: ["pitfall"] },
      { q: "Normal equation: formula and cost?", a: "`w = (XᵀX)⁻¹Xᵀy`, `O(nd² + d³)`. Use ridge `(XᵀX + λI)⁻¹Xᵀy` or SVD/lstsq when X is rank-deficient or collinear.", tags: ["linear"] },
      { q: "How do you compute log-loss numerically stably from logits?", a: "Never `log(sigmoid(z))`. Use `max(z,0) − z·y + log1p(exp(−|z|))` — the with-logits form. Naive versions produce −inf for |z| ≳ 40.", tags: ["numerics"] },
      { q: "Multi-class extension?", a: "Softmax regression: `pₖ = e^{zₖ}/Σ e^{zⱼ}` with categorical cross-entropy; the gradient is still `(p − y)xᵀ` with one-hot y.", tags: ["softmax"] }
    ],
    sixtySecond: [
      "Derive the logistic regression gradient from the cross-entropy loss and explain why the sigmoid derivative cancels.",
      "Compare linear and logistic regression: model, loss, probabilistic assumption, and what the coefficients mean."
    ]
  }
};
