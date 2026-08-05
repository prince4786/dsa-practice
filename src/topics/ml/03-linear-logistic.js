export default {
  id: "linear-logistic",
  track: "ml",
  title: "Linear & Logistic Regression",
  difficulty: 1,
  minutes: 15,
  tags: ["supervised", "regression", "classification", "mle"],

  explainer: [
    { type: "p", text: "Linear regression and logistic regression are the two simplest supervised learning models, and it helps to think of them as the same basic machine with a different final step attached. Both start by combining the input features into a single number called a **score**, written `z = wᵀx + b`: multiply each input feature by its own learned weight, add them all up, and add one more learned number `b` (the **bias** or **intercept**, not related to the statistical 'bias' from the bias-variance lesson). Linear regression just returns that score `z` directly as its prediction, and is trained to make the score close to the true numeric target using **squared error** (how far off, squared). Logistic regression instead squashes that same score through a function called the **sigmoid** to turn it into a probability between 0 and 1, and is trained using something called **log loss**. Remarkably, once you work through the calculus, **both models end up with exactly the same gradient formula**: `(ŷ − y)x`, where `ŷ` is the prediction and `y` is the true value. That is not a coincidence — it comes from a deeper statistical fact about the family of distributions each loss corresponds to — and interviewers love asking candidates to derive it by hand." },
    { type: "h3", text: "Linear regression" },
    { type: "p", text: "The model is `ŷ = wᵀx + b` (predict a weighted sum of the features), and the loss is `L = ½·mean((ŷ − y)²)` (the average squared difference between predictions and true values, halved for a tidier derivative). Unlike most machine learning models, this one has an exact, closed-form solution — no iterative training loop needed — called the **normal equation**: `w = (XᵀX)⁻¹Xᵀy`, where `X` is the matrix of all training features stacked into rows and `⁻¹` means matrix inversion (the matrix equivalent of division). Computing it costs `O(nd² + d³)` operations, which is fine when you have a few hundred features (`d`) but hopeless when you have millions, and it becomes numerically unstable when features are highly correlated with each other (a situation called **collinearity**, which makes `XᵀX` close to non-invertible — nearly 'singular'). **Ridge regression**, `w = (XᵀX + λI)⁻¹Xᵀy`, adds a small correction (`λI`, a scaled identity matrix) that fixes both the numerical instability and reduces how much the fitted weights swing around from one training sample to the next." },
    { type: "p", text: "There's also a probabilistic story behind squared error, and it is worth knowing because it explains a real weakness. If you assume the true relationship is `y = wᵀx + ε`, where `ε` (epsilon) is random noise drawn from a **Gaussian (normal) distribution** with some spread `σ²` (sigma squared, the variance), then it turns out that minimising squared error is mathematically identical to finding the weights that make the observed data most probable under that noise assumption — a procedure statisticians call **maximum likelihood estimation (MLE)**. This also explains why least squares is sensitive to outliers: a Gaussian distribution says an extreme outlier is astronomically unlikely, so the fitting procedure will happily distort the whole line just to make one outlier look a little less improbable. When your data has real outliers, **Huber loss** or **MAE (mean absolute error)** are more robust alternatives that don't punish large errors so severely." },
    { type: "h3", text: "Logistic regression" },
    { type: "p", text: "Logistic regression is for classification (predicting a category, most simply yes/no) instead of predicting a number. The model computes `p = σ(z) = 1/(1+e^{−z})`, where `σ` (sigma) denotes the **sigmoid function** — an S-shaped curve that takes any real number `z` and squashes it into a probability strictly between 0 and 1: very negative `z` gives a probability near 0, very positive `z` gives a probability near 1, and `z = 0` gives exactly 0.5. The loss used to train it is `L = −mean(y·log p + (1−y)·log(1−p))`, called **binary cross-entropy**: it penalises the model heavily when it is confident and wrong, and only lightly when it is uncertain or right. This particular formula is not arbitrary — it is exactly the negative log-likelihood of a **Bernoulli distribution** (the distribution of a single yes/no coin flip with probability `p` of heads), which is why the output `p` is a genuinely calibrated probability rather than just a distance-like score." },
    { type: "h3", text: "The derivation interviewers ask for" },
    { type: "p", text: "A very common interview task is to show that the gradient of the loss with respect to the score, `∂L/∂z`, works out to simply `p − y` — the prediction minus the true label. The key fact you need is the derivative of the sigmoid function itself: `σ′(z) = σ(z)(1−σ(z)) = p(1−p)`. Working through it for one training example:" },
    { type: "code", lang: "python", code: "L  = -[ y·log p + (1-y)·log(1-p) ]\ndL/dp = -y/p + (1-y)/(1-p) = (p - y) / (p(1-p))\ndp/dz = p(1-p)\ndL/dz = dL/dp · dp/dz = (p - y)            #  the p(1-p) cancels\ndL/dw = dL/dz · dz/dw = (p - y)·x" },
    { type: "p", text: "The step worth noticing is the cancellation: the `p(1−p)` term from the sigmoid's own derivative exactly cancels the `p(1−p)` term sitting in the denominator from the cross-entropy loss's derivative. This cancellation is the entire reason sigmoid and cross-entropy are always paired together: without it, a confidently wrong prediction (where `p(1−p)` is close to 0) would produce a tiny, near-useless gradient right when the model most needs a strong correction. Pair sigmoid with plain **squared error** instead, and the gradient becomes `(p−y)·p(1−p)·x`, which shrinks toward zero exactly when the model is most confidently wrong — the opposite of what you want. That mismatch is the real, mechanical reason mean squared error is not used for classification." },
    { type: "callout", tone: "pitfall", text: "Never compute `log(sigmoid(z))` the naive way in code — for very negative `z` (around −40 or below) it silently underflows to `-inf`, a floating-point error. Use the numerically stable rewritten form `max(z,0) − z·y + log(1 + e^{−|z|})` instead, which is exactly what a function like `binary_cross_entropy_with_logits` does under the hood. This is a genuine production bug that shows up in real codebases, and naming it is a great answer to 'is there anything you'd watch out for?'." },
    { type: "h3", text: "Properties worth naming" },
    { type: "list", items: [
      "**Convexity** — a function is **convex** if it has a single bowl shape with exactly one lowest point (no separate local dips to get stuck in). Both losses here are convex in `w`, so there is exactly one global optimum, and it does not matter where training starts. Almost nothing else in machine learning has this nice a guarantee.",
      "**Separable data breaks maximum likelihood** — if the two classes can be perfectly separated by a straight line (called linearly separable data), the likelihood keeps improving forever as you scale the weights `w` up toward infinity, so there is technically no finite best answer — the weights diverge. Adding any L2 penalty (a term discouraging large weights, covered in the regularization lesson) fixes this by giving the optimizer a reason to stop.",
      "**Interpretability** — each weight `wⱼ` tells you the change in the **log-odds** of the positive class (the logarithm of 'probability of yes divided by probability of no') for a one-unit increase in feature `xⱼ`. Exponentiating it, `e^{wⱼ}`, gives the **odds ratio** — how many times more likely the positive outcome becomes. This is exactly why logistic regression is still used heavily in medicine and credit scoring, where a human needs to explain each coefficient's effect.",
      "**Multi-class classification** — swap the sigmoid for its multi-category cousin, **softmax** (which turns a list of scores into a full probability distribution over several classes that adds up to 1); the gradient keeps the same shape, `(p − y)xᵀ`, just with `y` written as a one-hot vector (a list of zeros with a single 1 marking the true class).",
      "**The decision boundary is a hyperplane** — the set of points where `wᵀx + b = 0` is a flat plane (a line in 2D, a flat sheet in 3D, and so on) that separates the two predicted classes. Curved or non-linear boundaries require extra feature engineering, kernel methods, or a full neural network."
    ]},
    { type: "callout", tone: "tip", text: "Logistic regression is still a good first model to try on tabular data: it trains in seconds, gives calibrated probabilities out of the box, and its coefficients double as a free feature-importance report. Only reach for gradient boosting or a neural network once logistic regression's accuracy has been beaten on a fair comparison." }
  ],

  glossary: [
    { term: "Score (z)", plain: "The weighted sum of a data point's features, `z = wᵀx + b`, computed before any final squashing step. Linear regression outputs it directly; logistic regression passes it through a sigmoid." },
    { term: "Bias / intercept (b)", plain: "An extra learned number added to the weighted sum of features, letting the model's output shift up or down independent of the inputs. Unrelated to the statistical 'bias' from the bias-variance lesson." },
    { term: "Sigmoid function (σ)", plain: "An S-shaped curve that squashes any real number into a probability strictly between 0 and 1 — very negative inputs map near 0, very positive inputs map near 1." },
    { term: "Binary cross-entropy / log loss", plain: "The loss function used to train logistic regression. It heavily penalises confident wrong predictions and lightly penalises uncertain or correct ones." },
    { term: "Bernoulli distribution", plain: "The probability distribution of a single yes/no outcome, like one coin flip, described by a single number: the probability of 'yes'." },
    { term: "Maximum likelihood estimation (MLE)", plain: "A method of fitting a model by choosing the parameters that make the observed data as probable as possible under an assumed noise or randomness model." },
    { term: "Normal equation", plain: "The exact formula, `w = (XᵀX)⁻¹Xᵀy`, that solves linear regression in one step without any iterative training loop." },
    { term: "Collinearity", plain: "When two or more input features are strongly correlated with each other, which makes the normal equation numerically unstable and the fitted weights unreliable." },
    { term: "Ridge regression", plain: "Linear regression with a small correction added to stabilise the normal equation and shrink the fitted weights, reducing how much they swing between different training samples." },
    { term: "Convexity", plain: "A property of a function shaped like a single smooth bowl with one lowest point — no separate dips to get trapped in during training." },
    { term: "Log-odds / odds ratio", plain: "Log-odds is the logarithm of (probability of yes ÷ probability of no). The odds ratio is what you get by undoing that logarithm — it tells you how many times more likely the 'yes' outcome becomes per unit increase in a feature." },
    { term: "Softmax", plain: "The multi-class version of the sigmoid function: it turns a list of scores, one per class, into a full probability distribution over all classes that adds up to 1." },
    { term: "Hyperplane", plain: "The flat, straight-line decision boundary a linear or logistic model draws between classes — a line in two dimensions, a flat sheet in three, and so on in higher dimensions." },
    { term: "Numerical underflow", plain: "A computing error where a number so close to zero (or so extreme) that the computer can no longer represent it accurately, producing an incorrect result like negative infinity." }
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
