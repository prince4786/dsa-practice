export default {
  id: "bias-variance",
  track: "ml",
  title: "Bias-Variance & Overfitting",
  difficulty: 2,
  minutes: 15,
  tags: ["generalization", "model-selection", "overfitting", "theory"],

  explainer: [
    { type: "p", text: "This lesson answers a question every practitioner runs into constantly: my model's test error is too high — is that because the model is too simple, or because it is overreacting to noise in the training data? Bias and variance are the two different, precise reasons a model can be wrong, and being able to tell them apart tells you exactly what to fix. Here is a thought experiment that makes the idea concrete. Pick one type of model (say, 'a straight line' or 'a tree with 5 levels'). Draw a fresh training dataset `D`, fit your model to it, and record its prediction at one fixed input `x`. Now imagine repeating that whole process forever — a new random training set each time, refitting, and recording the prediction at that same `x` again. Because each training set is different, you get a whole spread of different predictions at `x`, even though it's always the 'same' model type. That spread has an exact mathematical decomposition — a formula that splits your total expected error into three separate, additive pieces:" },
    { type: "code", lang: "python", code: "E_D[(y - f_hat_D(x))**2]  =  (E_D[f_hat_D(x)] - f(x))**2   # bias^2\n                           +  Var_D[f_hat_D(x)]            # variance\n                           +  sigma**2                     # irreducible noise" },
    { type: "p", text: "Reading the formula in words: `E_D[...]` means 'average over all those repeated random training sets', and `f̂_D(x)` is the prediction your fitted model makes at point `x` given training set `D`. `f(x)` is the true, underlying value being predicted. The formula says the total expected squared error breaks into three pieces. **Bias** is how wrong the *average* prediction across all those retrainings is, compared to the true value — it captures a systematic, repeatable failure of the model type itself (a straight line literally cannot bend to fit a curve, no matter how much or what data you give it). **Variance** is how much the predictions wobble from one training set to the next — it captures sensitivity to whichever particular random sample of data you happened to get. **Irreducible noise**, written `σ²` (sigma squared), is the part of the true target `y` that no function of the input `x` could ever predict, because it is genuinely random — it is the hard floor beneath your test error that no amount of modelling improvement can get below. If your test mean-squared-error is 0.4 and the noise floor `σ²` is 0.35, there's very little room left to improve, and further tuning is largely wasted effort." },
    { type: "h3", text: "Where model complexity sits" },
    { type: "list", items: [
      "**Too simple (underfitting)**: high bias, low variance. Because the model type is too limited to capture the true pattern, training error and test error end up close together — but *both* are bad. The tell-tale sign: training loss plateaus at a value clearly above the noise floor and refuses to drop further, no matter how long you train.",
      "**Too complex (overfitting)**: low bias, high variance. The model is flexible enough to fit the training data almost perfectly (training error near zero), but that flexibility lets it also fit the random noise specific to that training set, so it performs much worse on new data — a large gap between train and test error. Retrain on a different random sample and you'd get a noticeably different fitted curve each time.",
      "**The sweet spot** is the point that minimises the *sum* of bias² and variance together, not either one individually — pushing one down usually pushes the other up. Plotted against model complexity, test error traces a U-shape: bad on both ends, best somewhere in the middle."
    ]},
    { type: "h3", text: "Reading learning curves, which is the actual interview task" },
    { type: "p", text: "A **learning curve** plots training error and validation error, both measured on the y-axis, against how much training data was used, on the x-axis. Reading one is the practical skill interviewers actually want to see, more than reciting the decomposition formula. If both curves converge to a high error value with only a small gap between them, that is a high-bias problem: adding more data will not help, because the model type simply cannot represent the pattern regardless of how much data it sees — instead add model capacity, add or engineer better features, or train for longer. If, instead, training error stays low while validation error stays far above it, that is a high-variance problem: more data genuinely will help here (it gives the model less room to memorise noise), and so will regularisation (see below), data augmentation, or simply reducing the model's capacity." },
    { type: "callout", tone: "pitfall", text: "The word 'bias' here refers to the statistical bias of an estimator, as defined by the formula above — it has nothing to do with fairness/ethical bias in a model's predictions, and nothing to do with the bias term `b` in a linear model's `wᵀx + b`. Interviewers ask this deliberately, precisely because the word is so overloaded; being explicit about which meaning you mean is itself a good signal." },
    { type: "h3", text: "Every regularisation technique is a bias-variance trade" },
    { type: "list", items: [
      "**L2 regularisation / weight decay** (covered in its own lesson) — shrinks the model's coefficients toward zero. This adds a little bias (the model is now slightly less free to fit the true pattern exactly) in exchange for a cut in variance (smaller coefficients swing around less between different training sets). There is even a classical statistical result (Stein's phenomenon) proving that ridge regression, for *some* choice of its penalty strength `λ` (lambda) greater than zero, always beats plain least-squares regression on average error, even though ridge is technically the 'more biased' of the two.",
      "**Bagging / random forests** — train many separate, low-bias but high-variance models (deep decision trees are the classic example) on different random subsets of the data, then average their predictions together. Averaging `M` predictions that are not perfectly correlated with each other cuts the combined variance by roughly a factor of `1/M`, while leaving the (already low) bias essentially untouched.",
      "**Boosting** — takes the opposite approach: it sequentially trains a series of deliberately weak, high-bias models (each one focused on correcting the previous ones' mistakes), which drives *bias* down over the course of training, while controlling the resulting variance through shrinkage (small update steps) and depth limits on each individual model.",
      "**Early stopping** — simply halting training before the model has had enough iterations to start fitting the noise in the training data acts as an implicit form of L2 regularisation, for free.",
      "**Collecting more data** — the one lever that reduces variance without adding any bias at all, which is exactly why 'get more data' is so often the right first answer when a model overfits."
    ]},
    { type: "callout", tone: "tip", text: "A modern caveat worth mentioning in an interview: the phenomenon of 'double descent'. Past a point called the interpolation threshold — where the number of model parameters roughly equals the number of training examples, so the model can just barely fit the training data exactly — test error can rise sharply and then, surprisingly, *fall again* as the model is made even larger still. The classic U-shaped curve described above is the correct picture for models that are smaller than their training data (under-parameterised); today's very large, over-parameterised neural networks, which have far more parameters than training examples, can break past that U-curve entirely thanks to implicit regularisation effects in how they are trained. Mentioning this signals you have read past the textbook version of this topic." }
  ],

  glossary: [
    { term: "Bias (statistical)", plain: "How wrong a model's average prediction is, across many different training sets, compared to the true value — a systematic limitation of the model type itself, not a one-off mistake." },
    { term: "Variance (of a model)", plain: "How much a model's predictions change when it is retrained on a different random sample of training data. High variance means the model is overly sensitive to which specific data it happened to see." },
    { term: "Irreducible noise (σ², sigma squared)", plain: "The part of the true outcome that no model could ever predict, because it is genuinely random. It sets a hard floor under how low test error can go." },
    { term: "Underfitting", plain: "When a model is too simple to capture the real pattern in the data, so it performs poorly on both training data and new data." },
    { term: "Overfitting", plain: "When a model is flexible enough to fit the random noise in its specific training set, so it performs much better on that training data than on new data." },
    { term: "Learning curve", plain: "A plot of training error and validation error against how much training data was used, used to diagnose whether a model has a bias problem or a variance problem." },
    { term: "Regularisation", plain: "Any technique that deliberately limits a model's flexibility in order to reduce variance, usually at the cost of adding a small amount of bias." },
    { term: "Bagging", plain: "Training many models independently on different random subsets of the data and averaging their predictions, which reduces variance without much affecting bias." },
    { term: "Boosting", plain: "Training a sequence of simple models, each one correcting the mistakes of the ones before it, which mainly reduces bias." },
    { term: "Early stopping", plain: "Halting training before the model has had enough iterations to start memorising noise in the training data, acting as a free form of regularisation." },
    { term: "Double descent", plain: "A phenomenon in very large models where test error rises then unexpectedly falls again as the model grows past the point where it can just barely fit its training data exactly." },
    { term: "Interpolation threshold", plain: "The point where a model has just enough parameters to fit its training data perfectly — roughly where the number of parameters equals the number of training examples." }
  ],

  complexity: {
    rows: [
      { operation: "Polynomial fit, degree p", time: "O(n·p² + p³)", space: "O(p²)", note: "normal equations on the Vandermonde matrix" },
      { operation: "Bias/variance estimate", time: "O(M · fit)", space: "O(M·|grid|)", note: "M resamples; Monte-Carlo estimate of the decomposition" },
      { operation: "Variance of a bagged ensemble", time: "—", space: "—", note: "ρσ² + (1−ρ)σ²/M — decorrelation ρ is what matters" }
    ]
  },

  interview: {
    whyAsked: "It is the diagnostic framework for every 'my model is not working' question. The interviewer wants to see you convert a symptom (train/val gap, plateau) into a specific next action, rather than reciting the definitions.",
    followUps: [
      { q: "State the bias-variance decomposition precisely.", a: "For squared loss at a point x: `E_D[(y − f̂_D(x))²] = (E_D[f̂_D(x)] − f(x))² + Var_D[f̂_D(x)] + σ²`. The expectation is over training sets D and over the label noise. It holds exactly for squared error; for 0-1 loss there is no clean additive analogue — the effects interact." },
      { q: "Training accuracy 99%, validation 72%. What do you do?", a: "That is a variance problem. In order of cost: more/augmented data; stronger regularisation (weight decay, dropout, early stopping); reduce capacity; and check for leakage or a distribution shift between splits first — a 27-point gap is also the signature of a bad split (e.g. grouped data leaking across folds)." },
      { q: "Training accuracy 68%, validation 67%. What do you do?", a: "High bias. Both errors are close and both are bad, so more data will not help. Increase capacity, add or transform features, train longer / raise the LR, weaken the regularisation. Also sanity-check the noise floor: if 67% is near the Bayes rate for the task, the model may be fine and the labels may be the problem." },
      { q: "How does bagging reduce variance, and why doesn't it help bias?", a: "Averaging M predictors with pairwise correlation ρ gives variance `ρσ² + (1−ρ)σ²/M`. Reducing M's effect saturates at `ρσ²`, so the win comes from *decorrelating* the trees — hence random forests' random feature subsets. The expectation of the average equals the average of the expectations, so bias is unchanged: you must start from low-bias (deep, unpruned) trees." },
      { q: "Why does early stopping act like L2 regularisation?", a: "In a linear model with gradient descent from w = 0, after t steps the components along eigendirection λ have been shrunk by roughly `(1 − (1−ηλ)^t)` relative to the OLS solution — the same qualitative shrinkage profile as ridge with `λ_ridge ≈ 1/(ηt)`. Directions with small curvature (which are the noisy ones) are learned last, so stopping early leaves them near zero." },
      { q: "Does the U-shaped test-error curve always hold?", a: "No — that is the classical, under-parameterised regime. In the double-descent picture, error peaks at the interpolation threshold (params ≈ examples) and then descends again as you keep growing the model, because among the infinitely many interpolating solutions SGD finds a low-norm one. This is why 100B-parameter models trained on less data than parameters can still generalise." },
      { q: "How would you actually measure bias and variance for a real model?", a: "Monte Carlo: draw M bootstrap or independent training sets, fit M models, predict on a fixed held-out grid. Variance = per-point sample variance of the predictions; bias² = (mean prediction − true/best-estimate value)², averaged over the grid. Without ground truth you can still measure variance, which is often the actionable half." }
    ]
  },

  code: [
    { lang: "python", label: "Empirical bias-variance decomposition", code: "import numpy as np\n\ndef bias_variance(fit_predict, gen_data, x_test, f_true, sigma, M=200, seed=0):\n    \"\"\"fit_predict(X, y, x_test) -> predictions;  gen_data(rng) -> (X, y)\"\"\"\n    rng = np.random.default_rng(seed)\n    preds = np.stack([fit_predict(*gen_data(rng), x_test) for _ in range(M)])\n    mean_pred = preds.mean(axis=0)\n    bias2 = np.mean((mean_pred - f_true(x_test)) ** 2)\n    var   = np.mean(preds.var(axis=0))\n    return dict(bias2=bias2, variance=var, noise=sigma ** 2,\n                total=bias2 + var + sigma ** 2)" },
    { lang: "python", label: "Polynomial fit + validation curve", code: "from numpy.polynomial import polynomial as P\n\ndef validation_curve(x_tr, y_tr, x_va, y_va, degrees=range(0, 15)):\n    tr, va = [], []\n    for d in degrees:\n        X_tr = np.vander(x_tr, d + 1, increasing=True)\n        X_va = np.vander(x_va, d + 1, increasing=True)\n        # lstsq, not inv: the Vandermonde matrix is horribly conditioned\n        w, *_ = np.linalg.lstsq(X_tr, y_tr, rcond=None)\n        tr.append(np.mean((X_tr @ w - y_tr) ** 2))\n        va.append(np.mean((X_va @ w - y_va) ** 2))\n    best = int(np.argmin(va))\n    return tr, va, list(degrees)[best]" },
    { lang: "python", label: "Learning curve (error vs training size)", code: "def learning_curve(model, X, y, sizes=(50, 100, 200, 400, 800), folds=5):\n    from sklearn.model_selection import cross_validate\n    out = []\n    for n in sizes:\n        r = cross_validate(model, X[:n], y[:n], cv=folds,\n                           scoring=\"neg_mean_squared_error\",\n                           return_train_score=True)\n        out.append((n, -r[\"train_score\"].mean(), -r[\"test_score\"].mean()))\n    # gap stays wide  -> variance -> get more data\n    # both plateau high -> bias    -> more capacity / better features\n    return out" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 220 },

    params: [
      { key: "maxDeg", label: "Max polynomial degree", type: "int", min: 3, max: 12, default: 9 },
      { key: "n", label: "Training points", type: "int", min: 8, max: 40, default: 14 },
      { key: "sigma", label: "Noise σ ×0.01", type: "int", min: 0, max: 60, default: 18 },
      { key: "reps", label: "Resamples per degree", type: "int", min: 2, max: 8, default: 5 },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const D = params.maxDeg, n = params.n, sigma = params.sigma / 100, M = params.reps;
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const f = (x) => Math.sin(3.0 * x) * 0.85 + 0.3 * x;

      const G = 61;
      const grid = [];
      for (let i = 0; i < G; i++) grid.push(-1.05 + (2.1 * i) / (G - 1));
      const truth = grid.map(f);

      // fixed held-out test set
      const test = [];
      for (let i = 0; i < 300; i++) {
        const x = rng() * 2 - 1;
        test.push({ x, y: f(x) + gauss() * sigma });
      }

      // --- least squares on the Vandermonde basis, tiny ridge for conditioning
      const fit = (pts, deg) => {
        const p = deg + 1;
        const A = [], b = [];
        for (let i = 0; i < p; i++) { A.push(new Array(p).fill(0)); b.push(0); }
        for (const pt of pts) {
          const pow = [1];
          for (let k = 1; k < p; k++) pow.push(pow[k - 1] * pt.x);
          for (let i = 0; i < p; i++) {
            b[i] += pow[i] * pt.y;
            for (let j = 0; j < p; j++) A[i][j] += pow[i] * pow[j];
          }
        }
        for (let i = 0; i < p; i++) A[i][i] += 1e-7;
        // Gaussian elimination with partial pivoting
        for (let c = 0; c < p; c++) {
          let piv = c;
          for (let r = c + 1; r < p; r++) if (Math.abs(A[r][c]) > Math.abs(A[piv][c])) piv = r;
          if (Math.abs(A[piv][c]) < 1e-14) continue;
          const tA = A[c]; A[c] = A[piv]; A[piv] = tA;
          const tb = b[c]; b[c] = b[piv]; b[piv] = tb;
          for (let r = 0; r < p; r++) {
            if (r === c) continue;
            const m = A[r][c] / A[c][c];
            if (!isFinite(m) || m === 0) continue;
            for (let k = c; k < p; k++) A[r][k] -= m * A[c][k];
            b[r] -= m * b[c];
          }
        }
        const w = [];
        for (let i = 0; i < p; i++) {
          const v = Math.abs(A[i][i]) < 1e-14 ? 0 : b[i] / A[i][i];
          w.push(isFinite(v) ? v : 0);
        }
        return w;
      };
      const evalPoly = (w, x) => {
        let s = 0, t = 1;
        for (let i = 0; i < w.length; i++) { s += w[i] * t; t *= x; }
        return isFinite(s) ? s : 0;
      };
      const mse = (w, pts) => {
        let s = 0;
        for (const p of pts) { const e = evalPoly(w, p.x) - p.y; s += e * e; }
        return s / Math.max(1, pts.length);
      };

      const curveTrain = [], curveTest = [], curveBias = [], curveVar = [];

      yield {
        label: `True function f(x) = 0.85·sin(3x) + 0.3x with label noise σ = ${sigma.toFixed(2)} (so the irreducible error floor is σ² = ${(sigma * sigma).toFixed(4)}). We will fit polynomials of degree 0…${D}, refitting each on ${M} independent samples of ${n} points, and watch bias fall as variance explodes.`,
        phase: "init",
        state: {
          degree: -1, maxDeg: D, rep: -1, reps: M, sigma, n,
          grid: grid.slice(), truth: truth.slice(),
          pts: [], fits: [], avg: [],
          curveTrain: [], curveTest: [], curveBias: [], curveVar: [],
          trainMse: 0, testMse: 0, bias2: 0, variance: 0
        }
      };

      for (let deg = 0; deg <= D; deg++) {
        const fitsGrid = [];
        let trAcc = 0, teAcc = 0;
        let lastPts = [];

        for (let m = 0; m < M; m++) {
          const pts = [];
          for (let i = 0; i < n; i++) {
            const x = -1 + (2 * (i + 0.5)) / n + (rng() - 0.5) * (1.2 / n);
            pts.push({ x, y: f(x) + gauss() * sigma });
          }
          const w = fit(pts, deg);
          const gy = grid.map((x) => Math.max(-4, Math.min(4, evalPoly(w, x))));
          fitsGrid.push(gy);
          const tr = mse(w, pts), te = mse(w, test);
          trAcc += tr; teAcc += Math.min(1e4, te);
          lastPts = pts;

          const avgNow = grid.map((_, i) => fitsGrid.reduce((a, c) => a + c[i], 0) / fitsGrid.length);

          yield {
            label: `Degree ${deg}, sample ${m + 1}/${M}: train MSE ${tr.toFixed(4)}, test MSE ${Math.min(1e4, te).toFixed(4)}. ` +
              (deg === 0 ? "A constant model — it cannot bend at all, so every resample gives nearly the same flat line: bias is huge, variance is tiny."
                : deg <= 3 ? "Each resample gives a similar curve — low variance — but the average curve still misses the true function in places: that gap is bias."
                : `Notice how different this curve is from the previous samples. ${deg} free coefficients let the fit chase the noise, and the fits now disagree wildly between the data points.`),
            phase: "resample",
            state: {
              degree: deg, maxDeg: D, rep: m, reps: M, sigma, n,
              grid: grid.slice(), truth: truth.slice(),
              pts: pts.map((p) => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4) })),
              fits: fitsGrid.map((c) => c.slice()),
              avg: avgNow,
              curveTrain: curveTrain.slice(), curveTest: curveTest.slice(),
              curveBias: curveBias.slice(), curveVar: curveVar.slice(),
              trainMse: tr, testMse: Math.min(1e4, te),
              bias2: 0, variance: 0
            }
          };
        }

        // Monte-Carlo bias/variance over the grid
        const avg = grid.map((_, i) => fitsGrid.reduce((a, c) => a + c[i], 0) / M);
        let bias2 = 0, variance = 0;
        for (let i = 0; i < G; i++) {
          bias2 += (avg[i] - truth[i]) * (avg[i] - truth[i]);
          let v = 0;
          for (let m = 0; m < M; m++) v += (fitsGrid[m][i] - avg[i]) * (fitsGrid[m][i] - avg[i]);
          variance += v / M;
        }
        bias2 /= G; variance /= G;

        curveTrain.push(trAcc / M);
        curveTest.push(teAcc / M);
        curveBias.push(bias2);
        curveVar.push(variance);

        const bestSoFar = curveTest.indexOf(Math.min.apply(null, curveTest));

        yield {
          label: `Degree ${deg} summary — bias² = ${bias2.toFixed(4)}, variance = ${variance.toFixed(4)}, noise σ² = ${(sigma * sigma).toFixed(4)}; predicted test error ≈ ${(bias2 + variance + sigma * sigma).toFixed(4)}, measured ${(teAcc / M).toFixed(4)}. Train MSE ${(trAcc / M).toFixed(4)}. Best degree so far: ${bestSoFar}.`,
          phase: "summary",
          focus: [deg],
          state: {
            degree: deg, maxDeg: D, rep: M, reps: M, sigma, n,
            grid: grid.slice(), truth: truth.slice(),
            pts: lastPts.map((p) => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4) })),
            fits: fitsGrid.map((c) => c.slice()),
            avg: avg.slice(),
            curveTrain: curveTrain.slice(), curveTest: curveTest.slice(),
            curveBias: curveBias.slice(), curveVar: curveVar.slice(),
            trainMse: trAcc / M, testMse: teAcc / M, bias2, variance
          }
        };
      }

      const best = curveTest.indexOf(Math.min.apply(null, curveTest));
      yield {
        label: `Done. Test error is U-shaped and bottoms out at degree ${best} (test MSE ${curveTest[best].toFixed(4)} vs the σ² = ${(sigma * sigma).toFixed(4)} floor). Train error only ever goes down — that is why you can never select a model on training error.`,
        phase: "done",
        focus: [best],
        state: {
          degree: D, maxDeg: D, rep: M, reps: M, sigma, n,
          grid: grid.slice(), truth: truth.slice(),
          pts: [], fits: [], avg: [],
          curveTrain: curveTrain.slice(), curveTest: curveTest.slice(),
          curveBias: curveBias.slice(), curveVar: curveVar.slice(),
          trainMse: curveTrain[D], testMse: curveTest[D],
          bias2: curveBias[D], variance: curveVar[D]
        }
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const gapX = 26;
      const leftW = Math.round((W - gapX) * 0.55);
      const padT = 30, padB = 44;
      const ph = H - padT - padB;

      // ================= LEFT: the fits ====================================
      const aL = 44, aW = leftW - aL - 12;
      const xMin = -1.15, xMax = 1.15, yMin = -2.0, yMax = 2.0;
      const AX = (x) => aL + ((x - xMin) / (xMax - xMin)) * aW;
      const AY = (y) => padT + ph - ((y - yMin) / (yMax - yMin)) * ph;

      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -1; t <= 1; t += 0.5) {
        const X = AX(t);
        ctx.beginPath(); ctx.moveTo(X, padT); ctx.lineTo(X, padT + ph); ctx.stroke();
        ctx.textAlign = "center"; ctx.fillText(t.toFixed(1), X, padT + ph + 14);
      }
      for (let t = -2; t <= 2; t += 1) {
        const Y = AY(t);
        ctx.beginPath(); ctx.moveTo(aL, Y); ctx.lineTo(aL + aW, Y); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(t.toFixed(0), aL - 6, Y + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.strokeRect(aL, padT, aW, ph);
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.textAlign = "right"; ctx.fillText("x", aL + aW - 4, padT + ph - 6);
      ctx.textAlign = "left"; ctx.fillText("y", aL + 5, padT + 12);

      ctx.save();
      ctx.beginPath(); ctx.rect(aL, padT, aW, ph); ctx.clip();

      // true function
      ctx.strokeStyle = C.viz6; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath();
      for (let i = 0; i < S.grid.length; i++) {
        const X = AX(S.grid[i]), Y = AY(S.truth[i]);
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      }
      ctx.stroke(); ctx.setLineDash([]);

      // individual fits (the variance)
      ctx.lineWidth = 1.2;
      for (let m = 0; m < S.fits.length; m++) {
        ctx.strokeStyle = C.viz1;
        ctx.globalAlpha = 0.42;
        ctx.beginPath();
        for (let i = 0; i < S.grid.length; i++) {
          const X = AX(S.grid[i]), Y = AY(S.fits[m][i]);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // average fit (the bias)
      if (S.avg.length) {
        ctx.strokeStyle = C.viz2; ctx.lineWidth = 2.2;
        ctx.beginPath();
        for (let i = 0; i < S.grid.length; i++) {
          const X = AX(S.grid[i]), Y = AY(S.avg[i]);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }

      // training points of the latest resample
      ctx.fillStyle = C.text2;
      for (const p of S.pts) {
        ctx.beginPath(); ctx.arc(AX(p.x), AY(p.y), 3.2, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // left legend
      ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      const lg = (x, col, dash, txt) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.setLineDash(dash ? [5, 3] : []);
        ctx.beginPath(); ctx.moveTo(x, 18); ctx.lineTo(x + 16, 18); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.text2; ctx.fillText(txt, x + 20, 21);
      };
      lg(aL, C.viz6, true, "truth");
      lg(aL + 68, C.viz1, false, "fits");
      lg(aL + 122, C.viz2, false, "mean fit");

      // ================= RIGHT: error vs degree =============================
      const bL = leftW + gapX + 40, bW = W - bL - 14;
      const bH = Math.round(ph * 0.62);
      const D = S.maxDeg;
      const allErr = S.curveTest.concat(S.curveTrain).concat([0.001]);
      let eMax = Math.max.apply(null, allErr);
      eMax = Math.min(eMax, 3);
      eMax = Math.max(eMax, 0.05) * 1.15;
      const BX = (d) => bL + (D === 0 ? 0.5 : d / D) * bW;
      const BY = (e) => padT + bH - (Math.min(e, eMax) / eMax) * bH;

      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = "center";
      for (let d = 0; d <= D; d++) {
        const X = BX(d);
        ctx.beginPath(); ctx.moveTo(X, padT); ctx.lineTo(X, padT + bH); ctx.stroke();
        if (D <= 12) ctx.fillText(String(d), X, padT + bH + 14);
      }
      for (let k = 0; k <= 4; k++) {
        const Y = padT + bH - (k / 4) * bH;
        ctx.strokeStyle = C.grid;
        ctx.beginPath(); ctx.moveTo(bL, Y); ctx.lineTo(bL + bW, Y); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right";
        ctx.fillText(((k / 4) * eMax).toFixed(2), bL - 6, Y + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3; ctx.strokeRect(bL, padT, bW, bH);
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
      ctx.fillText("polynomial degree (model complexity)", bL + bW / 2, padT + bH + 28);

      // noise floor
      const nf = S.sigma * S.sigma;
      if (nf > 0 && nf < eMax) {
        ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(bL, BY(nf)); ctx.lineTo(bL + bW, BY(nf)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "left";
        ctx.fillText(`σ² = ${nf.toFixed(3)}`, bL + 4, BY(nf) - 4);
      }

      const drawCurve = (arr, col, width) => {
        if (arr.length === 0) return;
        ctx.strokeStyle = col; ctx.lineWidth = width;
        ctx.beginPath();
        for (let i = 0; i < arr.length; i++) {
          const X = BX(i), Y = BY(arr[i]);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.fillStyle = col;
        for (let i = 0; i < arr.length; i++) {
          ctx.beginPath(); ctx.arc(BX(i), BY(arr[i]), 2.6, 0, Math.PI * 2); ctx.fill();
        }
      };
      drawCurve(S.curveTrain, C.viz3, 2);
      drawCurve(S.curveTest, C.viz2, 2.4);

      // current degree marker
      if (S.degree >= 0) {
        ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(BX(S.degree), padT); ctx.lineTo(BX(S.degree), padT + bH); ctx.stroke();
      }

      ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.strokeStyle = C.viz3; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(bL, 18); ctx.lineTo(bL + 16, 18); ctx.stroke();
      ctx.fillStyle = C.text2; ctx.fillText("train MSE", bL + 20, 21);
      ctx.strokeStyle = C.viz2;
      ctx.beginPath(); ctx.moveTo(bL + 86, 18); ctx.lineTo(bL + 102, 18); ctx.stroke();
      ctx.fillStyle = C.text2; ctx.fillText("test MSE", bL + 106, 21);

      // ---- decomposition bars ---------------------------------------------
      const dy = padT + bH + 46;
      const barW = bW;
      const tot = Math.max(1e-6, S.bias2 + S.variance + nf);
      const segs = [
        { k: "bias²", v: S.bias2, c: C.viz2 },
        { k: "variance", v: S.variance, c: C.viz1 },
        { k: "noise σ²", v: nf, c: C.muted }
      ];
      let x0 = bL;
      ctx.font = `10px ${env.font.mono}`;
      for (const s of segs) {
        const w = (s.v / tot) * barW;
        ctx.fillStyle = s.c;
        ctx.fillRect(x0, dy, Math.max(0, w), 16);
        x0 += w;
      }
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(bL, dy, barW, 16);
      let ly = dy + 32;
      ctx.textAlign = "left";
      for (const s of segs) {
        ctx.fillStyle = s.c; ctx.fillRect(bL, ly - 8, 9, 9);
        ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.base}`;
        ctx.fillText(s.k, bL + 14, ly);
        ctx.fillStyle = C.text; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(s.v.toFixed(4), bL + 76, ly);
        ly += 15;
      }
      ctx.fillStyle = C.text; ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "right";
      ctx.fillText(`degree ${S.degree < 0 ? "—" : S.degree} / ${D}`, bL + bW, dy + 32);
      ctx.fillText(`train ${S.trainMse.toFixed(4)}`, bL + bW, dy + 47);
      ctx.fillText(`test  ${S.testMse.toFixed(4)}`, bL + bW, dy + 62);
    }
  },

  drill: {
    cards: [
      { q: "Write the bias-variance decomposition for squared loss.", a: "`E[(y − f̂(x))²] = (E[f̂(x)] − f(x))² + Var[f̂(x)] + σ²` — bias², variance, and irreducible noise. Expectation is over training sets and label noise.", tags: ["theory"] },
      { q: "Train error 0.02, test error 0.31. Diagnosis and fixes?", a: "High variance / overfitting. Fixes: more data, augmentation, stronger regularisation (L2, dropout, early stopping), less capacity, bagging. Check for a leaky or mis-grouped split first.", tags: ["diagnosis"] },
      { q: "Train error 0.30, test error 0.32. Diagnosis and fixes?", a: "High bias / underfitting — more data will not help. Add capacity or features, train longer, reduce regularisation. Also check whether 0.30 is near the noise floor.", tags: ["diagnosis"] },
      { q: "How does bagging reduce variance?", a: "Averaging M predictors with correlation ρ gives variance `ρσ² + (1−ρ)σ²/M`, so the gain saturates at ρσ² — the point of random forests' feature subsampling is to shrink ρ. Bias is unchanged, so start from low-bias deep trees.", tags: ["ensembles"] },
      { q: "Why does early stopping behave like L2?", a: "Gradient descent from w = 0 learns high-curvature directions first; stopping at step t leaves low-curvature (noisy) directions near zero, matching ridge shrinkage with λ ≈ 1/(ηt).", tags: ["regularization"] },
      { q: "What is the irreducible error and why does it matter?", a: "σ², the label noise no function of x can explain. It is the floor on test error — if your test MSE is close to it, further modelling effort is wasted.", tags: ["theory"] },
      { q: "What is double descent?", a: "Test error rises to a peak at the interpolation threshold (params ≈ examples) and then falls again as models grow further, breaking the classical U-curve. Explained by implicit regularisation selecting low-norm interpolating solutions.", tags: ["modern"] },
      { q: "How do you measure bias and variance empirically?", a: "Monte Carlo over M resampled training sets: predict on a fixed grid, take per-point sample variance (= variance) and (mean prediction − truth)² (= bias²).", tags: ["practice"] }
    ],
    sixtySecond: [
      "State the bias-variance decomposition and explain what each term means with a concrete model-complexity example.",
      "Given a learning curve, explain how you tell a bias problem from a variance problem and what you would do about each."
    ]
  }
};
