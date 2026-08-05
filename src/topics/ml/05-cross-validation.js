export default {
  id: "cross-validation",
  track: "ml",
  title: "Splits & K-Fold Cross-Validation",
  difficulty: 1,
  minutes: 14,
  tags: ["evaluation", "model-selection", "leakage", "validation"],

  explainer: [
    { type: "p", text: "Before you can trust any number a model reports, you need a fair way to measure it — and 'fair' turns out to be surprisingly easy to get wrong. If you train a model on 80% of your data and test it on the remaining 20%, you get exactly one score, and that score is noisy: get slightly unlucky with which 20% ended up in the test set, and the number can shift by several points purely by chance, with no change to the model at all. **K-fold cross-validation** fixes this by giving you `K` separate scores instead of one. It splits the data into `K` equal-sized chunks called **folds**. It then trains `K` separate models, each time holding out a different one of the `K` folds as the test set and training on the other `K−1` folds. The net effect: every single example gets used for testing exactly once, and for training `K−1` times. You then report the average of the `K` scores, plus the **standard error** of that average — a measure of how much the average itself would likely wobble if you reran the whole thing — which tells you whether a small difference between two models (say, 0.3 percentage points) is a real, trustworthy difference or just noise." },
    { type: "h3", text: "The three-way split, and why it is three" },
    { type: "list", items: [
      "**Train** — the data used to actually fit the model's parameters (its weights).",
      "**Validation** — the data used to make every *decision about* the model: which hyperparameters to use, which architecture, which features, which threshold. Every choice you make by looking at validation performance leaks a small amount of information about that validation set into your final model, even though the model was never directly trained on it.",
      "**Test** — touched exactly *once*, at the very end, purely to estimate how the finished model will perform on genuinely new data. The moment you start making decisions based on the test score, it has effectively become a second validation set, and any number you report from it is now optimistically biased."
    ]},
    { type: "p", text: "When you also need to tune hyperparameters (settings chosen before training, like the learning rate or tree depth) using cross-validation itself, you need what is called **nested cross-validation**: an inner loop of cross-validation selects the best hyperparameters, and a separate outer loop of cross-validation estimates how well that entire selection *process* — not just one particular model — actually performs. Simply reporting the best score found by the inner loop as your final answer is a subtle but extremely common mistake: it silently overfits to the validation data, because trying many hyperparameter combinations and keeping the best score is itself a form of cherry-picking." },
    { type: "h3", text: "Which splitter to use" },
    { type: "list", items: [
      "**Plain K-fold** — the default choice. `K = 5` or `K = 10` are standard. A larger `K` means less bias in the estimate (each model trains on more of the data) at the cost of more compute, and the individual fold scores start overlapping so much that the variance of their average stops improving.",
      "**Stratified K-fold** — a variant that preserves the proportion of each class in every fold. This is mandatory whenever classes are imbalanced: with only 2% positive examples and `K = 10` folds, an ordinary random split can easily produce a fold containing zero positive examples, making that fold's score meaningless.",
      "**Group K-fold** — ensures that all the rows belonging to the same patient, user, or document stay entirely on one side of the split. Without this, the model can end up 'tested' on a person it effectively already saw during training, which measures memorisation rather than genuine generalisation.",
      "**Time-series split** — always trains on data from the past and tests on data from the future, never the reverse. Ordinary random folds would let the model peek at tomorrow's data while being scored on predicting today, which is unrealistic for anything with a time dimension.",
      "**Leave-one-out cross-validation (LOOCV)** — the extreme case where `K` equals the number of examples `n`, so every fold holds out just a single data point. It is nearly unbiased but has high variance and requires training `n` separate models, so it's only practical on very small datasets — though for linear models there is a shortcut formula (via something called the hat matrix) that avoids actually retraining `n` times."
    ]},
    { type: "h3", text: "Data leakage: the failure that makes cross-validation lie" },
    { type: "p", text: "**Data leakage** is any situation where information from the held-out data sneaks into the model or into the process of building it, before that held-out data is used for scoring — and it silently inflates your reported score to look better than the model will actually perform in the real world. The canonical demonstration (from the textbook 'Elements of Statistical Learning', section 7.10) makes the danger vivid: take 50 samples with **completely random labels** (so there is genuinely zero real signal to learn) and 5,000 features that are pure noise. Select the 100 features that happen to correlate most with the label, computing that correlation using *all* the data — including the rows that are about to become test folds. Then run 10-fold cross-validation using only those 100 selected features. The result: roughly 3% error, on data that by construction contains no learnable pattern whatsoever. Do the exact same feature selection step correctly — *inside* each fold, using only that fold's training rows — and the honest result comes back around 50% error, which is what you'd expect from pure chance on random labels." },
    { type: "callout", tone: "pitfall", text: "The leaky steps people actually ship in real projects: fitting a feature scaler, a missing-value imputer, or a PCA transform on the *entire* dataset before splitting; computing a 'target encoding' (replacing a category with the average label value for that category) using all the rows; applying an oversampling technique like SMOTE before the split; removing duplicate rows only after splitting (so a near-duplicate ends up on both sides); and using a feature whose value would not actually be known at prediction time in production (a 'time-travel' feature). The general rule: any transformation step that *learns* something from the data — a mean, a variance, a set of selected features, an encoding — must be refit separately inside every single fold, never computed once on the full dataset beforehand." },
    { type: "callout", tone: "tip", text: "In scikit-learn, doing this correctly is one line, using a **Pipeline** object: `cross_val_score(Pipeline([('sc', StandardScaler()), ('sel', SelectKBest(k=20)), ('clf', LogisticRegression())]), X, y, cv=StratifiedKFold(5))`. The Pipeline is what makes this honest — it automatically refits every single step (the scaler, the feature selector, the classifier) fresh on each fold's own training portion, instead of once on the whole dataset." }
  ],

  glossary: [
    { term: "K-fold cross-validation", plain: "A way of testing a model by splitting the data into K equal chunks, training K times (each time holding out a different chunk to test on), and averaging the K resulting scores." },
    { term: "Fold", plain: "One of the K equal-sized chunks the data is split into for cross-validation." },
    { term: "Standard error", plain: "A measure of how much an average score would likely wobble if you repeated the whole experiment, used to judge whether a difference between two scores is real or just noise." },
    { term: "Hyperparameter", plain: "A setting chosen before training begins, like the learning rate or a tree's maximum depth, as opposed to a weight the model learns automatically during training." },
    { term: "Nested cross-validation", plain: "Cross-validation with two loops: an inner loop picks the best hyperparameters, and an outer loop honestly measures how well that whole selection process performs on new data." },
    { term: "Stratified K-fold", plain: "A version of K-fold splitting that keeps the proportion of each class the same in every fold, which matters when one class is much rarer than another." },
    { term: "Group K-fold", plain: "A version of K-fold splitting that keeps all rows belonging to the same person, user, or document together on one side of the split, to prevent the model being 'tested' on someone it already saw in training." },
    { term: "Data leakage", plain: "Any situation where information from the data meant to be held out for testing accidentally influences the model or its preprocessing beforehand, making the reported score look better than the model will really perform." },
    { term: "Pipeline", plain: "A tool that chains together preprocessing steps and a model so that every step gets refit fresh on each fold's own training data, preventing leakage automatically." },
    { term: "Target encoding", plain: "A preprocessing trick that replaces a category (like a city name) with the average value of the label for rows in that category — risky for leakage if computed using the full dataset instead of per fold." }
  ],

  complexity: {
    rows: [
      { operation: "K-fold CV", time: "K × (train + predict)", space: "O(n)", note: "embarrassingly parallel across folds" },
      { operation: "Nested CV (K outer × M inner × G grid)", time: "K·M·G × train", space: "O(n)", note: "the honest way to report a tuned model" },
      { operation: "LOOCV", time: "n × train", space: "O(n)", note: "O(1) extra for linear models via the hat matrix" },
      { operation: "Standard error of the CV mean", time: "—", space: "—", note: "≈ s/√K, but folds are correlated so this understates it" }
    ]
  },

  interview: {
    whyAsked: "Almost every real ML failure in production traces back to an evaluation mistake, not a modelling one. The interviewer is checking whether you can be trusted with a number — do you know what your validation score is actually measuring, and can you spot the leak?",
    followUps: [
      { q: "Why not just use a single 80/20 split?", a: "The estimate has high variance — with 20% of a small dataset held out, the score can move several points on the luck of the split — and you waste 20% of your data. K-fold uses every point for both roles and gives you K scores, so you get a spread and can tell whether a model difference exceeds the noise. Single splits are fine when n is large (say ≥ 10⁵) and refitting is expensive." },
      { q: "How do you choose K?", a: "Bias/variance/compute trade. Small K means each model trains on much less data, so the estimate is pessimistically biased. Large K reduces that bias but the K training sets overlap heavily, so the scores are highly correlated and the variance of the mean stops improving; and it costs K fits. 5 and 10 are the empirical defaults; use LOOCV only for very small n." },
      { q: "Give a concrete example of data leakage that CV would not catch.", a: "Group leakage: 10 photos per patient, split at random. The model memorises the patient, and every fold has that patient on both sides, so CV reports 0.97 and production reports 0.6. CV cannot detect it because the leak is in the *split definition* — you need GroupKFold on patient_id. Same for time-series: random folds let the model see the future." },
      { q: "You standardised the features before calling cross_val_score. What's wrong?", a: "The scaler's mean and std were computed using the validation rows, so each fold's model has seen a summary of its test set. The effect is usually small for standardisation and huge for target encoding, feature selection or imputation. Fix: wrap every fitted transform in a Pipeline so it refits on each training fold." },
      { q: "What is nested cross-validation and when do you need it?", a: "An inner CV loop selects hyperparameters on each outer training fold; the outer loop scores the resulting model on the untouched outer test fold. You need it whenever you report a number for a *tuned* model. Reporting `max` over a hyperparameter grid of inner CV scores is biased upward — the more grid points you try, the more you are fitting the validation noise." },
      { q: "How do you cross-validate time-series data?", a: "Forward chaining: fold i trains on [0, tᵢ) and tests on [tᵢ, tᵢ₊₁), never the reverse. Add a purge/embargo gap between train and test if features use rolling windows, so windowed features cannot span the boundary. Never shuffle, and evaluate on the most recent period since that is the deployment regime." },
      { q: "Your CV score is 0.91 and production is 0.72. Walk me through the diagnosis.", a: "In order: (1) leakage — check for a feature unavailable at prediction time, group leakage, or a fitted transform outside the pipeline; (2) distribution shift — compare feature distributions and the label base rate between the CV data and production; (3) selection bias in the training data (e.g. only labelled rows from an existing rules engine); (4) threshold/calibration drift; (5) train/serve skew in feature computation. Leakage and skew explain most 20-point gaps." }
    ]
  },

  code: [
    { lang: "python", label: "Honest CV with a Pipeline", code: "from sklearn.pipeline import Pipeline\nfrom sklearn.preprocessing import StandardScaler\nfrom sklearn.feature_selection import SelectKBest, f_classif\nfrom sklearn.linear_model import LogisticRegression\nfrom sklearn.model_selection import StratifiedKFold, cross_val_score\nimport numpy as np\n\npipe = Pipeline([\n    (\"scale\", StandardScaler()),          # refit on each training fold\n    (\"select\", SelectKBest(f_classif, k=20)),\n    (\"clf\", LogisticRegression(max_iter=1000)),\n])\ncv = StratifiedKFold(n_splits=5, shuffle=True, random_state=0)\ns = cross_val_score(pipe, X, y, cv=cv, scoring=\"roc_auc\")\nprint(f\"AUC {s.mean():.3f} +/- {s.std(ddof=1)/np.sqrt(len(s)):.3f} (se)\")" },
    { lang: "python", label: "Nested CV — the number you actually report", code: "from sklearn.model_selection import GridSearchCV\n\ninner = StratifiedKFold(5, shuffle=True, random_state=1)\nouter = StratifiedKFold(5, shuffle=True, random_state=2)\n\nsearch = GridSearchCV(pipe, {\"clf__C\": [0.01, 0.1, 1, 10]},\n                      cv=inner, scoring=\"roc_auc\")\n# each outer fold re-runs the whole search on its own training data\nscores = cross_val_score(search, X, y, cv=outer, scoring=\"roc_auc\")\nprint(\"unbiased estimate of the TUNED model:\", scores.mean())" },
    { lang: "python", label: "The leakage demo (ESL 7.10)", code: "rng = np.random.default_rng(0)\nX = rng.normal(size=(50, 5000))        # pure noise\ny = rng.integers(0, 2, size=50)        # random labels: no signal exists\n\n# WRONG: select features using all the data, then cross-validate\nkeep = np.argsort(-np.abs([np.corrcoef(X[:, j], y)[0, 1] for j in range(5000)]))[:100]\nprint(cross_val_score(LogisticRegression(), X[:, keep], y, cv=10).mean())  # ~0.95 (!)\n\n# RIGHT: selection inside the pipeline, so it refits per fold\npipe = Pipeline([(\"sel\", SelectKBest(f_classif, k=100)),\n                 (\"clf\", LogisticRegression())])\nprint(cross_val_score(pipe, X, y, cv=10).mean())                          # ~0.50" },
    { lang: "python", label: "Time-series split with an embargo", code: "def purged_splits(n, n_splits=5, embargo=10):\n    fold = n // (n_splits + 1)\n    for i in range(1, n_splits + 1):\n        train_end = i * fold\n        test_start = train_end + embargo      # gap kills window leakage\n        test_end = min(n, test_start + fold)\n        if test_start >= test_end:\n            break\n        yield np.arange(0, train_end), np.arange(test_start, test_end)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 250 },

    params: [
      { key: "k", label: "Folds K", type: "int", min: 2, max: 8, default: 5 },
      { key: "n", label: "Samples", type: "int", min: 24, max: 120, default: 60 },
      { key: "mode", label: "Feature selection", type: "enum", options: ["inside-fold (honest)", "before-split (leaky)"], default: "inside-fold (honest)" },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const K = params.k, n = params.n;
      const leaky = params.mode === "before-split (leaky)";
      const D = 40;                      // 2 informative features, 38 pure noise
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const sig = (z) => (z >= 0 ? 1 / (1 + Math.exp(-z)) : Math.exp(z) / (1 + Math.exp(z)));

      // ---- data ----------------------------------------------------------
      const X = [], y = [];
      for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < D; j++) row.push(gauss());
        const z = 1.1 * row[0] - 0.9 * row[1];      // weak real signal
        y.push(rng() < sig(z) ? 1 : 0);
        X.push(row);
      }

      // shuffled fold assignment (stratified-ish: alternate the class streams)
      const idxByClass = [[], []];
      for (let i = 0; i < n; i++) idxByClass[y[i]].push(i);
      for (const arr of idxByClass) {
        for (let i = arr.length - 1; i > 0; i--) {
          const j = Math.floor(rng() * (i + 1));
          const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        }
      }
      const fold = new Array(n).fill(0);
      let c = 0;
      for (const arr of idxByClass) for (const i of arr) fold[i] = (c++) % K;

      // ---- helpers -------------------------------------------------------
      const absCorr = (j, idx) => {
        let mx = 0, my = 0;
        for (const i of idx) { mx += X[i][j]; my += y[i]; }
        mx /= idx.length; my /= idx.length;
        let sxy = 0, sxx = 0, syy = 0;
        for (const i of idx) {
          const a = X[i][j] - mx, b = y[i] - my;
          sxy += a * b; sxx += a * a; syy += b * b;
        }
        const den = Math.sqrt(sxx * syy);
        return den < 1e-12 ? 0 : Math.abs(sxy / den);
      };
      const topFeatures = (idx, p) => {
        const scored = [];
        for (let j = 0; j < D; j++) scored.push([j, absCorr(j, idx)]);
        scored.sort((a, b) => b[1] - a[1]);
        return scored.slice(0, p).map((s) => s[0]);
      };
      const trainLogistic = (idx, feats) => {
        const p = feats.length;
        const w = new Array(p).fill(0);
        let b = 0;
        const lr = 0.5;
        for (let it = 0; it < 220; it++) {
          const g = new Array(p).fill(0);
          let gb = 0;
          for (const i of idx) {
            let z = b;
            for (let f = 0; f < p; f++) z += w[f] * X[i][feats[f]];
            const e = sig(z) - y[i];
            for (let f = 0; f < p; f++) g[f] += e * X[i][feats[f]];
            gb += e;
          }
          for (let f = 0; f < p; f++) w[f] -= lr * (g[f] / idx.length + 0.02 * w[f]);
          b -= lr * gb / idx.length;
        }
        return { w, b };
      };
      const accuracy = (m, idx, feats) => {
        let ok = 0;
        for (const i of idx) {
          let z = m.b;
          for (let f = 0; f < feats.length; f++) z += m.w[f] * X[i][feats[f]];
          if ((z >= 0 ? 1 : 0) === y[i]) ok++;
        }
        return idx.length ? ok / idx.length : 0;
      };

      const allIdx = [];
      for (let i = 0; i < n; i++) allIdx.push(i);
      const leakyFeatCache = {};

      const pGrid = [1, 2, 4, 8, 16];
      const meanByP = [];

      const base = (extra) => Object.assign({
        n, K, leaky, D, pGrid: pGrid.slice(),
        fold: fold.slice(), y: y.slice(),
        testFold: -1, p: 0, feats: [], scores: [], meanByP: meanByP.slice(),
        mean: 0, se: 0, pIdx: -1
      }, extra || {});

      yield {
        label: `${n} samples, ${D} features — but only features 0 and 1 carry any signal; the other ${D - 2} are pure noise. Assign each sample to one of K = ${K} folds, keeping the class balance (stratified). We will select the top-p correlated features and cross-validate for p ∈ {${pGrid.join(", ")}}.`,
        phase: "init",
        state: base()
      };

      for (let pi = 0; pi < pGrid.length; pi++) {
        const p = pGrid[pi];
        const scores = [];

        let leakFeats = null;
        if (leaky) {
          if (!leakyFeatCache[p]) leakyFeatCache[p] = topFeatures(allIdx, p);
          leakFeats = leakyFeatCache[p];
          yield {
            label: `p = ${p}, LEAKY: features [${leakFeats.slice(0, 6).join(", ")}${leakFeats.length > 6 ? " …" : ""}] were chosen by correlating with y over ALL ${n} rows — including the rows that are about to become test folds. Every fold's "held-out" data already helped pick the features.`,
            phase: "leak",
            state: base({ p, pIdx: pi, feats: leakFeats.slice(), scores: [] })
          };
        }

        for (let f = 0; f < K; f++) {
          const tr = [], te = [];
          for (let i = 0; i < n; i++) (fold[i] === f ? te : tr).push(i);

          const feats = leaky ? leakFeats : topFeatures(tr, p);

          yield {
            label: `p = ${p}, fold ${f + 1}/${K}: hold out ${te.length} samples, train on the other ${tr.length}. ` +
              (leaky
                ? `Reusing the globally-chosen features [${feats.slice(0, 5).join(", ")}${feats.length > 5 ? "…" : ""}] — this is the leak.`
                : `Re-running feature selection on THIS fold's ${tr.length} training rows only → [${feats.slice(0, 5).join(", ")}${feats.length > 5 ? "…" : ""}]. Different folds pick different features, which is exactly right.`),
            phase: "split",
            focus: [f],
            state: base({ p, pIdx: pi, testFold: f, feats: feats.slice(), scores: scores.slice() })
          };

          const model = trainLogistic(tr, feats);
          const acc = accuracy(model, te, feats);
          const trAcc = accuracy(model, tr, feats);
          scores.push(acc);

          yield {
            label: `Fold ${f + 1} score: train accuracy ${(trAcc * 100).toFixed(1)}%, held-out accuracy ${(acc * 100).toFixed(1)}%. Running mean over ${scores.length} fold${scores.length === 1 ? "" : "s"}: ${((scores.reduce((a, b) => a + b, 0) / scores.length) * 100).toFixed(1)}%.`,
            phase: "score",
            focus: [f],
            state: base({ p, pIdx: pi, testFold: f, feats: feats.slice(), scores: scores.slice() })
          };
        }

        const mean = scores.reduce((a, b) => a + b, 0) / K;
        let varr = 0;
        for (const s of scores) varr += (s - mean) * (s - mean);
        const sd = K > 1 ? Math.sqrt(varr / (K - 1)) : 0;
        const se = sd / Math.sqrt(K);
        meanByP.push(mean);

        yield {
          label: `p = ${p} → CV accuracy ${(mean * 100).toFixed(1)}% ± ${(se * 100).toFixed(1)} (standard error over ${K} folds; fold spread ${(Math.min.apply(null, scores) * 100).toFixed(0)}–${(Math.max.apply(null, scores) * 100).toFixed(0)}%). ` +
            (leaky ? "Remember: this number is not an estimate of generalisation — the held-out rows already voted on the feature set." : "This is an honest estimate: no held-out row influenced anything about the model that scored it."),
          phase: "aggregate",
          focus: [pi],
          state: base({ p, pIdx: pi, testFold: -1, feats: [], scores: scores.slice(), mean, se })
        };
      }

      const best = meanByP.indexOf(Math.max.apply(null, meanByP));
      yield {
        label: `Sweep done. Best CV accuracy ${(meanByP[best] * 100).toFixed(1)}% at p = ${pGrid[best]}. ` +
          (leaky
            ? `With only 2 informative features out of ${D}, an honest run should peak near p = 2 and near the true signal level; the leaky run is inflated because noise features that happen to correlate on the full sample were handed to every fold. If you report this number, production will disagree with you.`
            : `Also note: you have now used these CV scores to CHOOSE p, so ${(meanByP[best] * 100).toFixed(1)}% is itself slightly optimistic — the honest report needs an outer loop (nested CV) or a truly untouched test set.`),
        phase: "done",
        focus: [best],
        state: base({ p: pGrid[best], pIdx: best, testFold: -1, feats: [], scores: [], mean: meanByP[best], se: 0 })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const padL = 20, padR = 20;
      let ty = 26;

      // ---- header ----------------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `13px ${env.font.base}`;
      ctx.fillStyle = C.text;
      ctx.fillText(`K-fold cross-validation · K = ${S.K} · n = ${S.n} · ${S.D} features`, padL, ty);
      const tag = S.leaky ? "LEAKY: selection before the split" : "HONEST: selection inside each fold";
      ctx.font = `12px ${env.font.base}`;
      const tw = ctx.measureText(tag).width;
      ctx.fillStyle = C.surface2;
      ctx.beginPath(); ctx.roundRect(W - padR - tw - 16, ty - 14, tw + 16, 20, 5); ctx.fill();
      ctx.fillStyle = S.leaky ? C.danger : C.ok;
      ctx.fillText(tag, W - padR - tw - 8, ty);
      ty += 26;

      // ---- the data strip --------------------------------------------------
      const stripW = W - padL - padR;
      const cw = stripW / S.n;
      const stripH = 30;
      ctx.font = `10px ${env.font.mono}`;
      for (let i = 0; i < S.n; i++) {
        const x = padL + i * cw;
        const isTest = S.fold[i] === S.testFold;
        ctx.fillStyle = isTest ? C.viz4 : C.surface2;
        ctx.fillRect(x + 0.5, ty, Math.max(1, cw - 1), stripH);
        // class stripe at the bottom so identity is not colour-alone
        ctx.fillStyle = S.y[i] === 1 ? C.viz1 : C.viz2;
        ctx.fillRect(x + 0.5, ty + stripH - 5, Math.max(1, cw - 1), 5);
        if (cw > 11) {
          ctx.fillStyle = isTest ? C.text : C.muted;
          ctx.textAlign = "center";
          ctx.fillText(String(S.fold[i] + 1), x + cw / 2, ty + 15);
        }
      }
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.strokeRect(padL, ty, stripW, stripH);
      ty += stripH + 6;
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText(S.testFold >= 0
        ? `fold ${S.testFold + 1} is held out (highlighted); the rest is the training set. Bottom stripe = class label.`
        : "each cell is one sample, labelled with its fold; bottom stripe = class label", padL, ty + 10);
      ty += 26;

      // ---- fold rows -------------------------------------------------------
      const rowH = 16, rowGap = 5;
      const labW = 66;
      const barX = padL + labW, barW = stripW - labW - 150;
      ctx.font = `11px ${env.font.mono}`;
      for (let f = 0; f < S.K; f++) {
        const yy = ty + f * (rowH + rowGap);
        ctx.fillStyle = f === S.testFold ? C.text : C.muted;
        ctx.textAlign = "left";
        ctx.fillText(`fold ${f + 1}`, padL, yy + 12);
        // train/test ribbon
        const seg = barW / S.K;
        for (let g = 0; g < S.K; g++) {
          ctx.fillStyle = g === f ? C.viz4 : C.viz3;
          ctx.globalAlpha = f === S.testFold ? 1 : 0.45;
          ctx.fillRect(barX + g * seg + 1, yy, seg - 2, rowH);
          ctx.globalAlpha = 1;
          if (seg > 40) {
            ctx.fillStyle = C.surface;
            ctx.font = `9px ${env.font.base}`; ctx.textAlign = "center";
            ctx.fillText(g === f ? "test" : "train", barX + g * seg + seg / 2, yy + 11);
            ctx.font = `11px ${env.font.mono}`;
          }
        }
        // score chip
        if (f < S.scores.length) {
          const sc = S.scores[f];
          const chipX = barX + barW + 12;
          ctx.fillStyle = C.surface2;
          ctx.beginPath(); ctx.roundRect(chipX, yy, 62, rowH, 5); ctx.fill();
          ctx.strokeStyle = C.border; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(chipX, yy, 62, rowH, 5); ctx.stroke();
          ctx.fillStyle = sc >= 0.5 ? C.viz3 : C.warn;
          ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "center";
          ctx.fillText(`${(sc * 100).toFixed(1)}%`, chipX + 31, yy + 12);
        }
      }
      const rowsBottom = ty + S.K * (rowH + rowGap);

      // aggregate chip
      if (S.scores.length) {
        const m = S.scores.reduce((a, b) => a + b, 0) / S.scores.length;
        const chipX = barX + barW + 12;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(chipX + 31, rowsBottom - rowGap); ctx.lineTo(chipX + 31, rowsBottom + 6);
        ctx.stroke();
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(chipX - 8, rowsBottom + 6, 78, 22, 6); ctx.fill();
        ctx.strokeStyle = S.leaky ? C.danger : C.ok; ctx.lineWidth = 1.4;
        ctx.beginPath(); ctx.roundRect(chipX - 8, rowsBottom + 6, 78, 22, 6); ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = `12px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(`x̄ ${(m * 100).toFixed(1)}%`, chipX + 31, rowsBottom + 21);
      }

      // ---- feature panel ---------------------------------------------------
      let fy = rowsBottom + 42;
      ctx.textAlign = "left"; ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.text2;
      ctx.fillText(`selected features (p = ${S.p})`, padL, fy);
      fy += 10;
      const fw = Math.min(9, (stripW - 4) / S.D);
      for (let j = 0; j < S.D; j++) {
        const chosen = S.feats.indexOf(j) >= 0;
        const informative = j < 2;
        ctx.fillStyle = chosen ? (informative ? C.viz6 : C.viz8) : C.surface2;
        ctx.fillRect(padL + j * (fw + 2), fy, fw, 12);
      }
      fy += 24;
      ctx.font = `10px ${env.font.base}`;
      ctx.fillStyle = C.viz6; ctx.fillRect(padL, fy - 8, 9, 9);
      ctx.fillStyle = C.text2; ctx.fillText("informative feature picked", padL + 14, fy);
      ctx.fillStyle = C.viz8; ctx.fillRect(padL + 170, fy - 8, 9, 9);
      ctx.fillStyle = C.text2; ctx.fillText("noise feature picked", padL + 184, fy);

      // ---- CV score vs p ---------------------------------------------------
      const gw = 150, gh = 92;
      const gx = W - padR - gw, gy = rowsBottom + 42;
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(gx, gy, gw, gh);
      ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("CV accuracy vs p", gx, gy - 6);
      ctx.strokeStyle = C.grid;
      for (let k = 0; k <= 2; k++) {
        const Y = gy + gh - (k / 2) * gh;
        ctx.beginPath(); ctx.moveTo(gx, Y); ctx.lineTo(gx + gw, Y); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "right";
        ctx.fillText((0.4 + 0.3 * k).toFixed(1), gx - 3, Y + 3);
      }
      const PY = (v) => gy + gh - ((Math.max(0.4, Math.min(1, v)) - 0.4) / 0.6) * gh;
      const PXg = (i) => gx + ((i + 0.5) / S.pGrid.length) * gw;
      if (S.meanByP.length) {
        ctx.strokeStyle = S.leaky ? C.danger : C.viz3; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < S.meanByP.length; i++) {
          const X = PXg(i), Y = PY(S.meanByP[i]);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.fillStyle = S.leaky ? C.danger : C.viz3;
        for (let i = 0; i < S.meanByP.length; i++) {
          ctx.beginPath(); ctx.arc(PXg(i), PY(S.meanByP[i]), 3, 0, Math.PI * 2); ctx.fill();
        }
      }
      ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "center";
      for (let i = 0; i < S.pGrid.length; i++) ctx.fillText(String(S.pGrid[i]), PXg(i), gy + gh + 12);
      if (S.pIdx >= 0) {
        ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(PXg(S.pIdx), gy); ctx.lineTo(PXg(S.pIdx), gy + gh); ctx.stroke();
      }
    }
  },

  drill: {
    cards: [
      { q: "What are the three splits and what is each one allowed to touch?", a: "Train fits parameters; validation selects hyperparameters/features/threshold; test is touched once at the end. Any tuning against the test set converts it into a validation set and biases your reported number.", tags: ["basics"] },
      { q: "How do you choose K in K-fold?", a: "Small K → each model trains on less data → pessimistic bias. Large K → training sets overlap heavily → correlated scores, so variance of the mean stops falling, and it costs K fits. 5 or 10 are the defaults; LOOCV only for tiny n.", tags: ["basics"] },
      { q: "When must you use StratifiedKFold?", a: "Classification with imbalanced classes — plain KFold can give folds with zero positives, making the fold score undefined or wildly noisy. Stratification preserves the class ratio in every fold.", tags: ["splitters"] },
      { q: "Name four leaky preprocessing steps.", a: "Scaling/imputation fit on the full dataset; feature selection using all labels; target/mean encoding computed over all rows; SMOTE or resampling before the split. Also: deduplication after splitting, and features unavailable at prediction time.", tags: ["leakage"] },
      { q: "Describe the ESL leakage demo and its punchline.", a: "50 samples, 5000 pure-noise features, random labels. Select the 100 most-correlated features on all data, then 10-fold CV → ~3% error on data with no signal. Do the selection inside the folds → ~50%. Selection must be inside the pipeline.", tags: ["leakage"] },
      { q: "What is nested CV and why do you need it?", a: "Inner loop tunes hyperparameters on each outer training fold; outer loop scores the tuned model on untouched data. Needed whenever you report a number for a tuned model, because max-over-grid of inner CV scores is optimistically biased.", tags: ["evaluation"] },
      { q: "How do you cross-validate a time series?", a: "Forward chaining — always train on the past and test on the future — plus a purge/embargo gap so rolling-window features cannot straddle the boundary. Never shuffle.", tags: ["splitters"] },
      { q: "CV says 0.91, production says 0.72. First three things you check?", a: "(1) leakage — pipeline placement, group leakage, time-travel features; (2) distribution shift between offline data and production traffic; (3) train/serve skew in how features are computed. Then threshold/calibration.", tags: ["debugging"] }
    ],
    sixtySecond: [
      "Explain K-fold cross-validation, how to pick K, and when you need stratified, grouped, or time-series splitting.",
      "Explain data leakage: give three concrete examples and describe how a Pipeline prevents them."
    ]
  }
};
