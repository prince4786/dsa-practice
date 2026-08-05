export default {
  id: "decision-trees",
  track: "ml",
  title: "Trees & Random Forests",
  difficulty: 2,
  minutes: 17,
  tags: ["trees", "ensembles", "bagging", "boosting"],

  explainer: [
    { type: "p", text: "A decision tree recursively partitions feature space with **axis-aligned** cuts. At each node it asks: over all features and all thresholds, which single split most reduces impurity? Then it recurses on both sides. Prediction is the majority class (or mean) of the leaf you land in." },
    { type: "h3", text: "The split criterion" },
    { type: "code", lang: "python", code: "Gini(S)    = 1 - sum(p_k**2)          # expected error of random guessing by p\nEntropy(S) = -sum(p_k * log2(p_k))\ngain = impurity(parent) - (n_L/n)*impurity(L) - (n_R/n)*impurity(R)" },
    { type: "p", text: "Gini and entropy almost always choose the same split; Gini is the default because it avoids a `log`. For regression the criterion is variance reduction (equivalently, MSE of the mean). The search is greedy — it never reconsiders an earlier split — which is why trees are fast to build and why they are not optimal: finding the globally best tree is NP-hard." },
    { type: "h3", text: "Why a single tree is a bad model" },
    { type: "list", items: [
      "**Extremely high variance** — move a handful of points and the root split changes, which changes everything below it.",
      "**Grown fully, it interpolates** — every leaf pure, zero training error, terrible test error. Depth, `min_samples_leaf` and cost-complexity pruning (`ccp_alpha`) are the controls.",
      "**Axis-aligned only** — a diagonal boundary becomes a staircase needing many splits.",
      "**Impurity-based feature importance is biased** toward high-cardinality and continuous features, because they offer more candidate splits. Use permutation importance or SHAP instead."
    ]},
    { type: "h3", text: "Random forests: bagging + feature subsampling" },
    { type: "p", text: "Train `T` deep trees, each on a bootstrap resample, and at every split consider only a random subset of `mtry` features (√d for classification, d/3 for regression). Vote. The variance of the average of `T` predictors with pairwise correlation `ρ` is `ρσ² + (1−ρ)σ²/T` — the second term vanishes with `T`, so the *only* way to keep improving is to reduce `ρ`. Feature subsampling is exactly a correlation reducer; that is the whole idea, and it is the sentence to say in an interview." },
    { type: "list", items: [
      "**Deep trees on purpose** — bagging removes variance, not bias, so the base learners must be low-bias.",
      "**OOB error is free validation** — each tree omits ~1/e ≈ 37% of the data; scoring each point with the trees that did not see it gives a cross-validation-quality estimate at no extra cost.",
      "**More trees never overfit** — the average converges; T is a compute knob, not a regularisation knob."
    ]},
    { type: "h3", text: "Boosting is the other direction" },
    { type: "p", text: "Gradient boosting fits each new *shallow* tree (depth 3–8) to the gradient of the loss w.r.t. the current predictions — the residual, for squared loss — and adds it with a small learning rate. It reduces **bias** sequentially, so it *can* overfit as you add trees and needs early stopping on a validation set. XGBoost/LightGBM add second-order (Newton) steps, an explicit L2 term on leaf weights, histogram binning of features and clever sparsity handling. On tabular data these still beat neural networks." },
    { type: "callout", tone: "tip", text: "The tidy contrast: **bagging = parallel, deep trees, reduces variance, robust to hyperparameters. Boosting = sequential, shallow trees, reduces bias, sensitive to learning rate and tree count.** If you can only remember one thing about ensembles, remember that." },
    { type: "callout", tone: "pitfall", text: "Trees do not need feature scaling (splits are order-based) and handle mixed types natively — but they cannot extrapolate. A regression tree's prediction is bounded by the range of the training targets, so trending time-series data is a bad fit unless you detrend first." }
  ],

  complexity: {
    rows: [
      { operation: "Train one tree", time: "O(d · n log n)", space: "O(n)", note: "sorted once per feature; ~n log n nodes' worth of scans" },
      { operation: "Predict", time: "O(depth)", space: "O(1)", note: "typically O(log n) for a balanced tree" },
      { operation: "Random forest train", time: "O(T · mtry · n log n)", space: "O(T · nodes)", note: "embarrassingly parallel across trees" },
      { operation: "Gradient boosting train", time: "O(T · d · n log n)", space: "O(T · nodes)", note: "strictly sequential; histogram binning makes it O(T·d·n)" },
      { operation: "OOB error", time: "free", space: "O(n)", note: "each tree omits ~37% of rows" }
    ]
  },

  interview: {
    whyAsked: "Trees are the workhorse of tabular ML, and the bagging-vs-boosting distinction is the cleanest available test of whether a candidate really understands bias-variance rather than just reciting it.",
    followUps: [
      { q: "Gini vs entropy — does the choice matter?", a: "Rarely. Both are concave impurity measures maximised at a uniform class distribution, and they select the same split the large majority of the time. Gini = `1 − Σpₖ²` is cheaper (no log) and is sklearn's default; entropy is slightly more sensitive to changes far from 50/50. Spend your tuning budget on depth, min_samples_leaf and the ensemble instead." },
      { q: "Why does a random forest subsample features at each split?", a: "To decorrelate the trees. Averaging T predictors with pairwise correlation ρ gives variance `ρσ² + (1−ρ)σ²/T`; increasing T only kills the second term, so the floor is ρσ². If one feature is strongly predictive, every bagged tree splits on it first and ρ stays near 1. Restricting each split to a random `mtry` subset forces diversity and lowers ρ." },
      { q: "Bagging vs boosting?", a: "Bagging trains deep, low-bias, high-variance trees independently in parallel on bootstrap samples and averages them — it attacks variance and is very forgiving of hyperparameters. Boosting trains shallow, high-bias trees sequentially, each fitted to the current residual/gradient, with a shrinkage rate — it attacks bias, can overfit with too many trees, and needs early stopping. Forests are the safe default; boosting is the higher ceiling." },
      { q: "What is out-of-bag error?", a: "A bootstrap sample of size n omits each row with probability `(1−1/n)ⁿ → 1/e ≈ 37%`. For each row, average the predictions of only the trees that did not see it. That gives a nearly unbiased generalisation estimate for free — no separate validation split, no refitting." },
      { q: "Why is impurity-based feature importance misleading?", a: "It sums the impurity reduction attributable to each feature, which rewards features with many possible split points: continuous and high-cardinality categorical features look important even when they are noise (they can always find *some* split that helps on the training data). It also splits credit arbitrarily among correlated features. Permutation importance on held-out data, or SHAP values, are the fixes." },
      { q: "How do you stop a single tree from overfitting?", a: "Pre-pruning: max_depth, min_samples_split/leaf, min_impurity_decrease, max_leaf_nodes. Post-pruning: cost-complexity (weakest-link) pruning — minimise `error + α·|leaves|`, sweeping α and choosing by cross-validation (`ccp_alpha` in sklearn). Or just don't use a single tree." },
      { q: "How do trees handle missing values and categoricals?", a: "Missing: surrogate splits (CART), or a learned default direction — XGBoost sends missing rows down whichever branch reduces loss more, LightGBM similarly. Categoricals: one-hot for low cardinality; native handling in LightGBM/CatBoost sorts categories by target statistic and splits on that order (CatBoost uses ordered target statistics to avoid the target-leakage this can cause)." },
      { q: "When would you not use trees?", a: "When you need extrapolation (predictions are bounded by the training target range), when the true boundary is smooth and diagonal (staircase approximation wastes capacity — a linear model or a net is better), for very high-dimensional sparse data like text (linear models win), and when you need a calibrated probability without post-hoc calibration." }
    ]
  },

  code: [
    { lang: "python", label: "CART from scratch (classification)", code: "import numpy as np\n\ndef gini(y):\n    if len(y) == 0: return 0.0\n    p = np.bincount(y, minlength=2) / len(y)\n    return 1.0 - (p ** 2).sum()\n\ndef best_split(X, y, features=None):\n    n, d = X.shape\n    best = (0.0, None, None)              # (gain, feature, threshold)\n    parent = gini(y)\n    for j in (features if features is not None else range(d)):\n        order = np.argsort(X[:, j])\n        xs, ys = X[order, j], y[order]\n        for i in range(1, n):\n            if xs[i] == xs[i - 1]:        # no split between equal values\n                continue\n            gain = parent - (i / n) * gini(ys[:i]) - ((n - i) / n) * gini(ys[i:])\n            if gain > best[0]:\n                best = (gain, j, (xs[i] + xs[i - 1]) / 2)\n    return best\n\ndef build(X, y, depth=0, max_depth=4, min_leaf=5):\n    if depth >= max_depth or len(y) < 2 * min_leaf or gini(y) == 0:\n        return {\"leaf\": int(np.bincount(y, minlength=2).argmax()), \"n\": len(y)}\n    gain, j, thr = best_split(X, y)\n    if j is None or gain <= 1e-12:\n        return {\"leaf\": int(np.bincount(y, minlength=2).argmax()), \"n\": len(y)}\n    m = X[:, j] <= thr\n    return {\"f\": j, \"thr\": thr, \"gain\": gain, \"n\": len(y),\n            \"L\": build(X[m], y[m], depth + 1, max_depth, min_leaf),\n            \"R\": build(X[~m], y[~m], depth + 1, max_depth, min_leaf)}" },
    { lang: "python", label: "Random forest + OOB score", code: "def random_forest(X, y, T=200, mtry=None, max_depth=None, seed=0):\n    rng = np.random.default_rng(seed)\n    n, d = X.shape\n    mtry = mtry or max(1, int(np.sqrt(d)))\n    trees, oob_idx = [], []\n    for _ in range(T):\n        idx = rng.integers(0, n, n)                    # bootstrap WITH replacement\n        oob = np.setdiff1d(np.arange(n), np.unique(idx))  # ~37% of rows\n        trees.append(build_with_feature_subsampling(X[idx], y[idx], mtry, rng))\n        oob_idx.append(oob)\n    # OOB estimate: score each row only with trees that never saw it\n    votes = np.zeros((n, 2))\n    for t, oob in zip(trees, oob_idx):\n        for i in oob:\n            votes[i, predict_one(t, X[i])] += 1\n    seen = votes.sum(1) > 0\n    oob_acc = (votes[seen].argmax(1) == y[seen]).mean()\n    return trees, oob_acc" },
    { lang: "python", label: "Gradient boosting in 12 lines", code: "def gbm(X, y, T=100, lr=0.1, max_depth=3):\n    F = np.full(len(y), y.mean())        # start from the constant that minimises MSE\n    trees = []\n    for _ in range(T):\n        residual = y - F                 # = -dL/dF for squared loss\n        t = fit_regression_tree(X, residual, max_depth)\n        F = F + lr * t.predict(X)        # shrinkage: small steps, many trees\n        trees.append(t)\n    return trees\n\n# lr and T trade off: halving lr roughly doubles the T you need.\n# Always early-stop on a validation set -- boosting DOES overfit." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 250 },

    params: [
      { key: "mode", label: "Model", type: "enum", options: ["single-tree", "forest"], default: "single-tree" },
      { key: "maxDepth", label: "Max depth", type: "int", min: 1, max: 5, default: 3 },
      { key: "n", label: "Points", type: "int", min: 60, max: 220, default: 140 },
      { key: "trees", label: "Trees (forest)", type: "int", min: 3, max: 12, default: 8 },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = params.n, MAXD = params.maxDepth, T = params.trees;
      const forest = params.mode === "forest";
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };

      // XOR-ish clusters: axis-aligned splits must be stacked to solve it
      const P = [];
      for (let i = 0; i < n; i++) {
        const qx = i % 2 ? 1 : -1, qy = (i >> 1) % 2 ? 1 : -1;
        P.push({
          x: qx * 1.0 + gauss() * 0.42,
          y: qy * 1.0 + gauss() * 0.42,
          c: qx * qy > 0 ? 1 : 0
        });
      }

      const X0 = -2.6, X1 = 2.6, Y0 = -2.6, Y1 = 2.6;

      const gini = (idx) => {
        if (!idx.length) return 0;
        let a = 0;
        for (const i of idx) a += P[i].c;
        const p1 = a / idx.length, p0 = 1 - p1;
        return 1 - p0 * p0 - p1 * p1;
      };
      const majority = (idx) => {
        let a = 0;
        for (const i of idx) a += P[i].c;
        return a * 2 >= idx.length ? 1 : 0;
      };
      const counts = (idx) => {
        let a = 0;
        for (const i of idx) a += P[i].c;
        return [idx.length - a, a];
      };

      const candidates = (idx, f) => {
        const vals = idx.map((i) => (f === 0 ? P[i].x : P[i].y)).sort((a, b) => a - b);
        const out = [];
        for (let i = 1; i < vals.length; i++) {
          if (vals[i] - vals[i - 1] > 1e-9) out.push((vals[i] + vals[i - 1]) / 2);
        }
        // thin to at most 30 candidates so the scan animates readably
        if (out.length <= 30) return out;
        const step = out.length / 30, thinned = [];
        for (let k = 0; k < 30; k++) thinned.push(out[Math.floor(k * step)]);
        return thinned;
      };

      const evalSplit = (idx, f, thr) => {
        const L = [], R = [];
        for (const i of idx) ((f === 0 ? P[i].x : P[i].y) <= thr ? L : R).push(i);
        if (!L.length || !R.length) return null;
        const wg = (L.length * gini(L) + R.length * gini(R)) / idx.length;
        return { L, R, weighted: wg, gain: gini(idx) - wg };
      };

      // ---------------- build the display tree -----------------------------
      const nodes = [];
      const newNode = (idx, depth, parent, rect) => {
        const [c0, c1] = counts(idx);
        nodes.push({
          idx: idx.slice(), depth, parent, rect: rect.slice(),
          f: -1, thr: 0, gain: 0, gini: gini(idx), n: idx.length,
          c0, c1, pred: majority(idx), l: -1, r: -1, leaf: true
        });
        return nodes.length - 1;
      };

      const publicNodes = () => nodes.map((nd) => ({
        depth: nd.depth, parent: nd.parent, rect: nd.rect.slice(),
        f: nd.f, thr: +nd.thr.toFixed(4), gain: +nd.gain.toFixed(4),
        gini: +nd.gini.toFixed(4), n: nd.n, c0: nd.c0, c1: nd.c1,
        pred: nd.pred, l: nd.l, r: nd.r, leaf: nd.leaf
      }));

      const pts = P.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3), c: p.c }));

      const snap = (over) => Object.assign({
        mode: params.mode, pts, nodes: publicNodes(), maxDepth: MAXD,
        active: -1, scan: null, grid: null, gridW: 0, gridH: 0,
        treeCount: 0, trees: T, trainAcc: 0, bounds: [X0, X1, Y0, Y1]
      }, over || {});

      const root = newNode(P.map((_, i) => i), 0, -1, [X0, X1, Y0, Y1]);

      yield {
        label: `${n} points in four clusters — an XOR pattern that no single straight line can separate, but axis-aligned splits can, if you stack them. Root impurity: Gini = ${gini(nodes[root].idx).toFixed(4)} (a perfect 50/50 mix scores 0.5).`,
        phase: "init",
        state: snap({ active: root })
      };

      const trainAccuracy = () => {
        let ok = 0;
        for (const nd of nodes) {
          if (!nd.leaf) continue;
          for (const i of nd.idx) if (P[i].c === nd.pred) ok++;
        }
        return ok / n;
      };

      // ---------------- grow the tree (BFS) --------------------------------
      const queue = [root];
      let scansShown = 0;

      while (queue.length) {
        const ni = queue.shift();
        const nd = nodes[ni];
        if (nd.depth >= MAXD || nd.n < 8 || nd.gini < 1e-9) continue;

        let best = null;
        const showScan = scansShown < 2;
        const curves = [[], []];

        for (let f = 0; f < 2; f++) {
          const cands = candidates(nd.idx, f);
          for (let k = 0; k < cands.length; k++) {
            const r = evalSplit(nd.idx, f, cands[k]);
            if (!r) continue;
            curves[f].push([+cands[k].toFixed(4), +r.weighted.toFixed(4)]);
            if (!best || r.gain > best.gain) best = { f, thr: cands[k], gain: r.gain, L: r.L, R: r.R, weighted: r.weighted };

            if (showScan && k % 6 === 0) {
              yield {
                label: `Searching node ${ni} (${nd.n} points, Gini ${nd.gini.toFixed(3)}): try ${f === 0 ? "x" : "y"} ≤ ${cands[k].toFixed(2)} → children Gini ${r.weighted.toFixed(4)}, gain ${r.gain.toFixed(4)}. Best so far: ${best.f === 0 ? "x" : "y"} ≤ ${best.thr.toFixed(2)} with gain ${best.gain.toFixed(4)}.`,
                phase: "scan",
                state: snap({
                  active: ni,
                  scan: {
                    node: ni, f, thr: +cands[k].toFixed(4),
                    curveX: curves[0].map((c) => c.slice()),
                    curveY: curves[1].map((c) => c.slice()),
                    bestF: best.f, bestThr: +best.thr.toFixed(4), bestGain: +best.gain.toFixed(4)
                  }
                })
              };
            }
          }
        }
        if (showScan) scansShown++;

        if (!best || best.gain <= 1e-9) continue;

        nd.f = best.f; nd.thr = best.thr; nd.gain = best.gain; nd.leaf = false;
        const [rx0, rx1, ry0, ry1] = nd.rect;
        const lrect = best.f === 0 ? [rx0, best.thr, ry0, ry1] : [rx0, rx1, ry0, best.thr];
        const rrect = best.f === 0 ? [best.thr, rx1, ry0, ry1] : [rx0, rx1, best.thr, ry1];
        nd.l = newNode(best.L, nd.depth + 1, ni, lrect);
        nd.r = newNode(best.R, nd.depth + 1, ni, rrect);
        queue.push(nd.l, nd.r);

        const lg = nodes[nd.l], rg = nodes[nd.r];
        yield {
          label: `Split node ${ni} on ${best.f === 0 ? "x" : "y"} ≤ ${best.thr.toFixed(3)}: Gini ${nd.gini.toFixed(4)} → weighted ${best.weighted.toFixed(4)} (gain ${best.gain.toFixed(4)}). Left ${lg.n} pts [${lg.c0}/${lg.c1}] Gini ${lg.gini.toFixed(3)}; right ${rg.n} pts [${rg.c0}/${rg.c1}] Gini ${rg.gini.toFixed(3)}. Training accuracy now ${(trainAccuracy() * 100).toFixed(1)}%.`,
          phase: "split",
          focus: [ni],
          state: snap({ active: ni, trainAcc: trainAccuracy() })
        };
      }

      const leaves = nodes.filter((nd) => nd.leaf).length;
      yield {
        label: `Tree complete: ${nodes.length} nodes, ${leaves} leaves, depth ≤ ${MAXD}, training accuracy ${(trainAccuracy() * 100).toFixed(1)}%. Each leaf is an axis-aligned rectangle predicting its majority class. Grow it deeper and every leaf becomes pure — training accuracy 100%, test accuracy far worse. That variance is what bagging is for.`,
        phase: forest ? "tree-done" : "done",
        state: snap({ active: -1, trainAcc: trainAccuracy() })
      };

      if (!forest) return;

      // ---------------- forest ---------------------------------------------
      const GW = 46, GH = 30;
      const votes = [];
      for (let i = 0; i < GW * GH; i++) votes.push(0);
      const gx = (i) => X0 + ((i + 0.5) / GW) * (X1 - X0);
      const gy = (j) => Y0 + ((j + 0.5) / GH) * (Y1 - Y0);

      // a compact tree builder for the ensemble (feature subsampling, mtry = 1)
      const buildTree = (idx, depth, allowed) => {
        if (depth >= MAXD + 1 || idx.length < 6 || gini(idx) < 1e-9) {
          return { leaf: majority(idx) };
        }
        const f = allowed[Math.floor(rng() * allowed.length)];
        const cands = candidates(idx, f);
        let best = null;
        for (const thr of cands) {
          const r = evalSplit(idx, f, thr);
          if (r && (!best || r.gain > best.gain)) best = { thr, gain: r.gain, L: r.L, R: r.R };
        }
        if (!best || best.gain <= 1e-9) return { leaf: majority(idx) };
        return { f, thr: best.thr, L: buildTree(best.L, depth + 1, allowed), R: buildTree(best.R, depth + 1, allowed) };
      };
      const predict = (t, x, y) => {
        while (t.leaf === undefined) t = ((t.f === 0 ? x : y) <= t.thr ? t.L : t.R);
        return t.leaf;
      };

      for (let t = 1; t <= T; t++) {
        const boot = [];
        const seen = new Array(n).fill(false);
        for (let i = 0; i < n; i++) { const k = Math.floor(rng() * n); boot.push(k); seen[k] = true; }
        let oobN = 0;
        for (let i = 0; i < n; i++) if (!seen[i]) oobN++;

        const tree = buildTree(boot, 0, [0, 1]);
        for (let j = 0; j < GH; j++) {
          for (let i = 0; i < GW; i++) {
            votes[j * GW + i] += predict(tree, gx(i), gy(j));
          }
        }
        let ok = 0;
        for (let i = 0; i < n; i++) {
          const ii = Math.min(GW - 1, Math.max(0, Math.floor(((P[i].x - X0) / (X1 - X0)) * GW)));
          const jj = Math.min(GH - 1, Math.max(0, Math.floor(((P[i].y - Y0) / (Y1 - Y0)) * GH)));
          const p = votes[jj * GW + ii] * 2 >= t ? 1 : 0;
          if (p === P[i].c) ok++;
        }

        yield {
          label: `Forest tree ${t}/${T}: trained on a bootstrap resample (${oobN} of ${n} rows were left out — the out-of-bag set, ≈37% as expected) with only 1 randomly chosen feature considered per split. The voted boundary from ${t} tree${t === 1 ? "" : "s"} classifies ${(100 * ok / n).toFixed(1)}% of the training points correctly, and it is visibly smoother than the single tree's staircase.`,
          phase: "forest",
          focus: [t],
          state: snap({
            active: -1, treeCount: t, trainAcc: ok / n,
            grid: votes.slice(), gridW: GW, gridH: GH
          })
        };
      }

      yield {
        label: `${T} trees voted. Averaging decorrelated trees cuts variance from ρσ² + (1−ρ)σ²/T toward ρσ² — feature subsampling is what shrinks ρ, and that is the entire reason a random forest beats plain bagging. Adding more trees can only help; it never overfits.`,
        phase: "done",
        state: snap({ active: -1, treeCount: T, grid: votes.slice(), gridW: GW, gridH: GH })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const gap = 18;
      const leftW = Math.round(W * 0.47);
      const padT = 28, padB = 34;
      const ph = H - padT - padB;
      const aL = 40, aW = leftW - aL - 8;
      const [X0, X1, Y0, Y1] = S.bounds;
      const AX = (x) => aL + ((x - X0) / (X1 - X0)) * aW;
      const AY = (y) => padT + ph - ((y - Y0) / (Y1 - Y0)) * ph;

      // ---- forest vote background ------------------------------------------
      if (S.grid && S.treeCount > 0) {
        const gw = aW / S.gridW, gh = ph / S.gridH;
        for (let j = 0; j < S.gridH; j++) {
          for (let i = 0; i < S.gridW; i++) {
            const frac = S.grid[j * S.gridW + i] / S.treeCount;
            ctx.globalAlpha = Math.abs(frac - 0.5) * 0.55;
            ctx.fillStyle = frac >= 0.5 ? C.viz1 : C.viz2;
            ctx.fillRect(aL + i * gw, padT + ph - (j + 1) * gh, gw + 0.6, gh + 0.6);
          }
        }
        ctx.globalAlpha = 1;
      } else {
        // leaf rectangles of the single tree
        for (const nd of S.nodes) {
          if (!nd.leaf) continue;
          const [x0, x1, y0, y1] = nd.rect;
          const purity = Math.max(nd.c0, nd.c1) / Math.max(1, nd.n);
          ctx.globalAlpha = 0.10 + 0.32 * (purity - 0.5) * 2;
          ctx.fillStyle = nd.pred === 1 ? C.viz1 : C.viz2;
          ctx.fillRect(AX(x0), AY(y1), AX(x1) - AX(x0), AY(y0) - AY(y1));
        }
        ctx.globalAlpha = 1;
      }

      // ---- axes -------------------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -2; t <= 2; t++) {
        const Xp = AX(t);
        ctx.beginPath(); ctx.moveTo(Xp, padT); ctx.lineTo(Xp, padT + ph); ctx.stroke();
        ctx.textAlign = "center"; ctx.fillText(String(t), Xp, padT + ph + 14);
        const Yp = AY(t);
        ctx.beginPath(); ctx.moveTo(aL, Yp); ctx.lineTo(aL + aW, Yp); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(String(t), aL - 5, Yp + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2; ctx.strokeRect(aL, padT, aW, ph);
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.textAlign = "right"; ctx.fillText("x", aL + aW - 4, padT + ph - 6);
      ctx.textAlign = "left"; ctx.fillText("y", aL + 5, padT + 12);

      // ---- split lines ------------------------------------------------------
      ctx.save();
      ctx.beginPath(); ctx.rect(aL, padT, aW, ph); ctx.clip();
      for (let k = 0; k < S.nodes.length; k++) {
        const nd = S.nodes[k];
        if (nd.leaf || nd.f < 0) continue;
        const [x0, x1, y0, y1] = nd.rect;
        ctx.strokeStyle = k === S.active ? C.viz4 : C.viz7;
        ctx.lineWidth = k === S.active ? 3 : Math.max(1.2, 3 - nd.depth * 0.6);
        ctx.beginPath();
        if (nd.f === 0) { ctx.moveTo(AX(nd.thr), AY(y0)); ctx.lineTo(AX(nd.thr), AY(y1)); }
        else { ctx.moveTo(AX(x0), AY(nd.thr)); ctx.lineTo(AX(x1), AY(nd.thr)); }
        ctx.stroke();
      }
      // candidate line being scanned
      if (S.scan) {
        const nd = S.nodes[S.scan.node];
        const [x0, x1, y0, y1] = nd.rect;
        ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.6; ctx.setLineDash([4, 3]);
        ctx.beginPath();
        if (S.scan.f === 0) { ctx.moveTo(AX(S.scan.thr), AY(y0)); ctx.lineTo(AX(S.scan.thr), AY(y1)); }
        else { ctx.moveTo(AX(x0), AY(S.scan.thr)); ctx.lineTo(AX(x1), AY(S.scan.thr)); }
        ctx.stroke(); ctx.setLineDash([]);
      }

      // ---- points -----------------------------------------------------------
      for (const p of S.pts) {
        const Xp = AX(p.x), Yp = AY(p.y);
        ctx.fillStyle = p.c === 1 ? C.viz1 : C.viz2;
        ctx.beginPath();
        if (p.c === 1) ctx.arc(Xp, Yp, 3.6, 0, Math.PI * 2);
        else { ctx.moveTo(Xp, Yp - 4); ctx.lineTo(Xp + 4, Yp + 3); ctx.lineTo(Xp - 4, Yp + 3); ctx.closePath(); }
        ctx.fill();
        ctx.strokeStyle = C.surface; ctx.lineWidth = 0.7; ctx.stroke();
      }
      ctx.restore();

      // ---- header -----------------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text2;
      ctx.fillText(S.treeCount > 0
        ? `random forest — ${S.treeCount}/${S.trees} trees voting`
        : `single CART tree — max depth ${S.maxDepth}`, aL, 18);
      ctx.textAlign = "right"; ctx.font = `11px ${env.font.mono}`; ctx.fillStyle = C.text;
      if (S.trainAcc) ctx.fillText(`train acc ${(S.trainAcc * 100).toFixed(1)}%`, aL + aW, 18);

      // ================= RIGHT: tree diagram OR gini scan ===================
      const bL = leftW + gap, bW = W - bL - 12;

      if (S.scan) {
        // ---- Gini-vs-threshold scan ----------------------------------------
        ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text;
        ctx.fillText("weighted child Gini vs split threshold", bL, 18);

        const half = (ph - 26) / 2;
        const panels = [
          { curve: S.scan.curveX, name: "split on x", y0: padT, f: 0 },
          { curve: S.scan.curveY, name: "split on y", y0: padT + half + 26, f: 1 }
        ];
        for (const pnl of panels) {
          const y0 = pnl.y0, hgt = half;
          ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.strokeRect(bL, y0, bW, hgt);
          ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
          ctx.fillText(pnl.name, bL, y0 - 5);
          const CX = (v) => bL + ((v - X0) / (X1 - X0)) * bW;
          const CY = (g) => y0 + hgt - (Math.min(0.55, g) / 0.55) * hgt;
          ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
          ctx.font = `9px ${env.font.mono}`;
          for (let k = 0; k <= 2; k++) {
            const gv = (k / 2) * 0.5;
            const Y = CY(gv);
            ctx.beginPath(); ctx.moveTo(bL, Y); ctx.lineTo(bL + bW, Y); ctx.stroke();
            ctx.fillStyle = C.muted; ctx.textAlign = "right";
            ctx.fillText(gv.toFixed(2), bL - 4, Y + 3);
          }
          if (pnl.curve.length) {
            ctx.strokeStyle = pnl.f === S.scan.f ? C.viz4 : C.viz3;
            ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i < pnl.curve.length; i++) {
              const Xp = CX(pnl.curve[i][0]), Yp = CY(pnl.curve[i][1]);
              if (i === 0) ctx.moveTo(Xp, Yp); else ctx.lineTo(Xp, Yp);
            }
            ctx.stroke();
          }
          if (S.scan.bestF === pnl.f) {
            const bx = CX(S.scan.bestThr);
            ctx.strokeStyle = C.viz6; ctx.lineWidth = 1.6;
            ctx.beginPath(); ctx.moveTo(bx, y0); ctx.lineTo(bx, y0 + hgt); ctx.stroke();
            ctx.fillStyle = C.viz6; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "left";
            ctx.fillText(`best ${S.scan.bestThr.toFixed(2)}`, bx + 3, y0 + 11);
          }
          if (pnl.f === S.scan.f) {
            const cx2 = CX(S.scan.thr);
            ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
            ctx.beginPath(); ctx.moveTo(cx2, y0); ctx.lineTo(cx2, y0 + hgt); ctx.stroke();
            ctx.setLineDash([]);
          }
        }
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText("lower is better — the greedy split is the global minimum of these two curves", bL, H - 12);
        return;
      }

      // ---- tree diagram ----------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text;
      ctx.fillText(S.treeCount > 0 ? "tree 1 of the forest (structure)" : "the tree", bL, 18);

      const nodes = S.nodes;
      const leafOrder = [];
      const walk = (k) => {
        if (k < 0 || k >= nodes.length) return;
        if (nodes[k].leaf) { leafOrder.push(k); return; }
        walk(nodes[k].l); walk(nodes[k].r);
      };
      walk(0);
      const xpos = new Array(nodes.length).fill(0);
      for (let i = 0; i < leafOrder.length; i++) xpos[leafOrder[i]] = i + 0.5;
      for (let k = nodes.length - 1; k >= 0; k--) {
        if (!nodes[k].leaf) xpos[k] = (xpos[nodes[k].l] + xpos[nodes[k].r]) / 2;
      }
      const nLeaf = Math.max(1, leafOrder.length);
      const maxD = Math.max(1, S.maxDepth);
      const NX = (k) => bL + 22 + (xpos[k] / nLeaf) * (bW - 44);
      const NY = (dep) => padT + 16 + (dep / maxD) * (ph - 64);

      // edges
      ctx.strokeStyle = C.border; ctx.lineWidth = 1.3;
      for (let k = 0; k < nodes.length; k++) {
        if (nodes[k].leaf) continue;
        for (const ch of [nodes[k].l, nodes[k].r]) {
          ctx.beginPath();
          ctx.moveTo(NX(k), NY(nodes[k].depth) + 12);
          ctx.lineTo(NX(ch), NY(nodes[ch].depth) - 12);
          ctx.stroke();
        }
      }
      // nodes
      for (let k = 0; k < nodes.length; k++) {
        const nd = nodes[k];
        const X = NX(k), Y = NY(nd.depth);
        const w = 62, h = 24;
        ctx.fillStyle = nd.leaf ? (nd.pred === 1 ? C.viz1 : C.viz2) : C.surface2;
        ctx.globalAlpha = nd.leaf ? 0.85 : 1;
        ctx.beginPath(); ctx.roundRect(X - w / 2, Y - h / 2, w, h, 5); ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = k === S.active ? C.viz4 : C.border;
        ctx.lineWidth = k === S.active ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(X - w / 2, Y - h / 2, w, h, 5); ctx.stroke();
        ctx.textAlign = "center";
        if (nd.leaf) {
          ctx.fillStyle = C.surface; ctx.font = `10px ${env.font.mono}`;
          ctx.fillText(`ŷ=${nd.pred}  n=${nd.n}`, X, Y + 3);
        } else {
          ctx.fillStyle = C.text; ctx.font = `10px ${env.font.mono}`;
          ctx.fillText(`${nd.f === 0 ? "x" : "y"} ≤ ${nd.thr.toFixed(2)}`, X, Y - 1);
          ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(`gini ${nd.gini.toFixed(2)} n=${nd.n}`, X, Y + 9);
        }
      }
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("left branch = condition true", bL, H - 12);
    }
  },

  drill: {
    cards: [
      { q: "Write the Gini impurity and the split-gain formula.", a: "`Gini(S) = 1 − Σpₖ²`; gain = `impurity(parent) − (n_L/n)·impurity(L) − (n_R/n)·impurity(R)`. Choose the (feature, threshold) maximising gain, greedily, at every node.", tags: ["cart"] },
      { q: "Gini vs entropy?", a: "Nearly always the same split. Gini avoids a log and is the default; entropy is slightly more sensitive far from 50/50. Not a hyperparameter worth tuning.", tags: ["cart"] },
      { q: "Why does a random forest subsample features at each split?", a: "To decorrelate trees. Variance of the average is `ρσ² + (1−ρ)σ²/T`, so more trees only kill the second term — the floor is ρσ². If one feature dominates, all bagged trees look alike; restricting to `mtry` features forces diversity.", tags: ["forest"] },
      { q: "What is out-of-bag error and why is it free?", a: "A bootstrap sample omits each row with probability (1−1/n)ⁿ ≈ 37%. Score each row using only the trees that never saw it → a near-unbiased generalisation estimate with no held-out split.", tags: ["forest"] },
      { q: "Bagging vs boosting in one sentence each.", a: "Bagging: deep independent trees on bootstrap samples, averaged — reduces variance, parallel, hyperparameter-robust. Boosting: shallow trees fit sequentially to the current residual/gradient with shrinkage — reduces bias, sequential, needs early stopping.", tags: ["ensembles"] },
      { q: "Why is impurity-based feature importance biased?", a: "It favours high-cardinality and continuous features because they offer more candidate splits and can always find some training-set improvement; it also splits credit arbitrarily among correlated features. Use permutation importance or SHAP.", tags: ["interpretation"] },
      { q: "How do you regularise a single tree?", a: "Pre-pruning (max_depth, min_samples_leaf/split, min_impurity_decrease, max_leaf_nodes) and post-pruning by cost-complexity: minimise `error + α·|leaves|`, choosing α by CV (`ccp_alpha`).", tags: ["overfitting"] },
      { q: "Name two things trees cannot do well.", a: "Extrapolate (predictions are clamped to the training target range) and represent smooth diagonal boundaries efficiently (they become staircases). Also weak on very high-dimensional sparse text data.", tags: ["limits"] }
    ],
    sixtySecond: [
      "Explain how a decision tree chooses a split, and why a single fully-grown tree overfits.",
      "Explain the difference between random forests and gradient boosting, including which error term each attacks."
    ]
  }
};
