export default {
  id: "pca",
  track: "ml",
  title: "PCA & Embeddings",
  difficulty: 2,
  minutes: 16,
  tags: ["unsupervised", "dimensionality-reduction", "linear-algebra", "embeddings"],

  explainer: [
    { type: "p", text: "**PCA (Principal Component Analysis)** is a technique for taking data that has many features — sometimes thousands — and finding a small number of new, made-up features that capture as much of the original information as possible. This is useful for compressing data, visualising high-dimensional data in 2D or 3D, removing noise, and speeding up other algorithms that struggle with too many input dimensions. Concretely, PCA looks for the **directions** in feature space along which the data spreads out (varies) the most, and treats those directions as the new, more informative axes to describe the data with. There are two different, equally valid ways to define exactly what PCA is doing, and being able to explain that they lead to the same answer is most of what an interviewer is testing for:" },
    { type: "list", items: [
      "**Maximum variance view**: find the direction (a **unit vector** `v`, meaning a vector of length exactly 1, used just to specify a direction without a magnitude of its own) along which, if you projected every data point onto it, the resulting spread of values would be as large as possible — written `Var(Xv) = vᵀΣv`. Here `Σ` (capital sigma) is the **covariance matrix** of the data, a grid of numbers summarising how every pair of features varies together. The answer to this maximisation turns out to be the **top eigenvector** of `Σ` (recall from the gradient-descent lesson: an eigenvector is a special direction along which a matrix only stretches, never rotates, and its paired eigenvalue is the amount of that stretch) — and the corresponding eigenvalue is exactly equal to that maximum variance.",
      "**Minimum reconstruction error view**: instead of maximising spread, look for the `k`-dimensional simplified subspace (a lower-dimensional 'flat slice' through the data, `k` being how many principal components you keep) that, if you squashed every data point onto it and then reconstructed an approximation of the original point, would minimise the total squared error between the originals and their reconstructions. This turns out to select the *exact same* subspace as the maximum-variance view. The two coincide because of a geometric fact related to the Pythagorean theorem: for any point measured from the data's centre, `‖x‖² = ‖projection‖² + ‖residual‖²` — the point's total squared distance from the origin splits exactly into 'how much survives the projection' plus 'how much is lost as reconstruction error'. Since that total is fixed, maximising the surviving (projected) part is mathematically identical to minimising the lost (residual) part."
    ]},
    { type: "h3", text: "The recipe" },
    { type: "code", lang: "python", code: "X = X - X.mean(0)                 # CENTRING IS MANDATORY\nU, S, Vt = np.linalg.svd(X, full_matrices=False)\ncomponents = Vt[:k]              # rows are the principal directions\nZ = X @ Vt[:k].T                 # = U[:, :k] * S[:k]   (the scores)\nexplained = S**2 / (S**2).sum()  # eigenvalues of the covariance, normalised" },
    { type: "p", text: "In practice, PCA is computed using the **SVD (Singular Value Decomposition)** of the centred data matrix, rather than by directly computing the covariance matrix `Σ` and finding its eigenvectors the slow way. SVD is a general technique for breaking any matrix down into three simpler pieces (`U`, `S`, and `Vt` above); its details aren't essential here, but the reason it's preferred is numerical: directly forming `XᵀX` (which is proportional to the covariance matrix) squares the **condition number** of the data (recall from the gradient-descent lesson: a measure of how numerically fragile a computation is), which loses precision, and for data with far more features than examples it is also much more computationally expensive. The relationship between the two approaches is `Σ = XᵀX/(n−1) = V(S²/(n−1))Vᵀ` — meaning the squared 'singular values' produced by SVD are exactly the eigenvalues you would have gotten from the slower, less stable route." },
    { type: "h3", text: "Details that separate a strong answer from a shaky one" },
    { type: "list", items: [
      "**Always centre the data first** — subtract the mean of each feature before doing anything else. Skip this and the first principal component ends up pointing at the location of the mean itself, rather than at the actual direction the data varies along.",
      "**Standardise features first when their units differ** — running PCA directly on the covariance matrix is scale-dependent, so a feature measured in raw dollars will completely dominate a feature measured in years, purely because of its larger numeric range, regardless of which one is actually more informative. Standardising every feature first (giving each one a mean of 0 and a standard deviation of 1) is equivalent to running PCA on the **correlation matrix** instead, and is the usual choice whenever features have different natural units.",
      "**The resulting components are uncorrelated, not fully independent.** Being 'decorrelated' (which is what PCA guarantees, since `Σ` becomes a diagonal matrix — meaning zero everywhere except along the main diagonal — in the new coordinate system) is a weaker property than true statistical independence. Getting truly independent components requires a different technique (Independent Component Analysis, ICA) or an assumption that the data follows a Gaussian distribution, in which case the two properties happen to coincide.",
      "**The exact sign and, when eigenvalues tie, the exact orientation are arbitrary.** Both `v` and `−v` point along the same line and are equally valid eigenvectors, so which sign a library returns is not meaningful; and if two eigenvalues happen to be equal, the specific pair of directions chosen within that shared subspace is likewise arbitrary, even though the subspace itself is well defined.",
      "**PCA is unsupervised** — it only looks at how the input features vary among themselves and has no idea what you're ultimately trying to predict, so it maximises overall variance, not how well the data separates into meaningful classes. The direction that would actually distinguish two classes well can, in principle, be the *lowest*-variance direction in the data, which PCA would discard first. **LDA (Linear Discriminant Analysis)** is the supervised counterpart that optimises for class separation directly instead."
    ]},
    { type: "callout", tone: "pitfall", text: "Fit PCA only on the training split of your data, and then apply (`transform`) that already-fitted PCA to the validation and test splits — never refit it on the full dataset including test data. Fitting on everything is a form of data leakage (see the cross-validation lesson): the resulting principal-component directions would encode information about the covariance structure of the test set, which the model isn't supposed to have access to yet. This is exactly the same rule that applies to fitting a feature scaler." },
    { type: "h3", text: "Why PCA matters for embeddings" },
    { type: "p", text: "PCA is the simplest, linear ancestor of every modern 'embedding' technique (a general term for representing complex objects like words, images, or documents as points in a lower-dimensional numeric space). A typical word or item embedding matrix (a big table where each row is one item's learned numeric representation) tends to be **low-rank** in practice, meaning most of its real information is concentrated in far fewer dimensions than it technically has. Running PCA on such an embedding matrix gives you interpretable global directions to inspect, a cheap way to **whiten** vectors (rescale them so every direction has comparable spread) before computing cosine similarity between them, and a straightforward compression scheme — for instance, keeping only 128 of an embedding's original 1536 dimensions, at the cost of only a small drop in retrieval quality. A well-known practical trick — 'the top principal component of a set of sentence embeddings tends to just encode how common each word is, so subtract it out' (sometimes called the 'all-but-the-top' method) — is PCA being used specifically as a debiasing tool to remove an unwanted, dominant signal." },
    { type: "callout", tone: "tip", text: "PCA versus t-SNE/UMAP, a comparison worth having ready: PCA is linear (a straightforward rescaling and rotation of the original axes), deterministic (running it twice on the same data gives the same answer), invertible (you can reconstruct an approximation of the original data from its compressed form), preserves the overall global shape of the data, and is fast. Use it for compression, denoising, and general preprocessing. **t-SNE** and **UMAP**, by contrast, are non-linear, involve randomness (so results can differ slightly between runs), generally cannot be inverted, are specifically designed to preserve which points are close *neighbours* of each other locally, and deliberately distort the larger-scale, global distances between far-apart groups in the process. Use them purely for visually inspecting data — never as input features to another model — and never read meaning into the sizes of clusters or the distances between clusters in a t-SNE or UMAP plot, since those are not preserved faithfully." }
  ],

  glossary: [
    { term: "PCA (Principal Component Analysis)", plain: "A technique for compressing data with many features down into a smaller number of new, made-up features that capture as much of the original spread (variance) in the data as possible." },
    { term: "Dimensionality reduction", plain: "The general task of representing data using fewer numbers (dimensions) than it originally had, while keeping as much useful information as possible." },
    { term: "Covariance matrix (Σ)", plain: "A grid of numbers summarising how every pair of features in a dataset varies together — whether they tend to increase together, move oppositely, or are unrelated." },
    { term: "Principal component", plain: "One of the new directions found by PCA, ranked by how much of the data's spread it captures. The first principal component captures the most, the second captures the next most (while staying at a right angle to the first), and so on." },
    { term: "Eigenvector / eigenvalue", plain: "For a matrix like the covariance matrix, an eigenvector is a special direction the matrix only stretches (never rotates), and its eigenvalue is the amount of that stretch. PCA's directions are the covariance matrix's eigenvectors." },
    { term: "SVD (Singular Value Decomposition)", plain: "A general mathematical technique for breaking any matrix into three simpler pieces. PCA is usually computed this way rather than by working with the covariance matrix directly, for numerical accuracy reasons." },
    { term: "Explained variance (ratio)", plain: "The fraction of the data's total spread that is captured by a given principal component, or by the first few components combined — used to judge how many components are worth keeping." },
    { term: "Reconstruction error", plain: "How much information is lost when you compress data down to fewer dimensions and then try to reconstruct an approximation of the original." },
    { term: "Orthogonal", plain: "At a right angle to each other. PCA's principal components are always mutually orthogonal by construction." },
    { term: "Uncorrelated vs. independent", plain: "Uncorrelated means two variables show no straight-line relationship on average — a weaker property. Independent means knowing one variable's value tells you absolutely nothing about the other, a stronger property that uncorrelated variables don't automatically have." },
    { term: "Whitening", plain: "Rescaling a set of vectors so that every direction has a comparable amount of spread, often done before comparing vectors by similarity." },
    { term: "Embedding", plain: "A learned numeric representation of a complex object — like a word, image, or document — as a point in a lower-dimensional numeric space, positioned so that similar objects end up near each other." },
    { term: "t-SNE / UMAP", plain: "Non-linear techniques for visualising high-dimensional data in 2D or 3D by preserving which points are close neighbours locally, at the cost of distorting the larger-scale distances between groups." }
  ],

  complexity: {
    rows: [
      { operation: "Covariance + eigendecomposition", time: "O(nd² + d³)", space: "O(d²)", note: "bad when d is large; squares the condition number" },
      { operation: "Full SVD of X", time: "O(n d min(n,d))", space: "O(nd)", note: "the numerically correct route" },
      { operation: "Truncated / randomised SVD (k comps)", time: "O(nd k)", space: "O(nk)", note: "what sklearn uses for large d" },
      { operation: "Power iteration (top component)", time: "O(nd) per iteration", space: "O(d)", note: "converges at rate (λ₂/λ₁)ᵗ" },
      { operation: "Transform / project", time: "O(ndk)", space: "O(nk)", note: "one matmul" }
    ]
  },

  interview: {
    whyAsked: "It is the one place where linear algebra, statistics and practical preprocessing meet, so it exposes shallow knowledge fast. The two-definitions equivalence, the centring requirement, and PCA-vs-t-SNE are the three checkpoints.",
    followUps: [
      { q: "Prove that maximising projected variance also minimises reconstruction error.", a: "For centred `x` and a unit vector `v`, decompose `x = (vᵀx)v + r` with `r ⊥ v`. Then `‖x‖² = (vᵀx)² + ‖r‖²`. Summing over the data, `Σ‖xᵢ‖²` is a constant independent of `v`, so maximising `Σ(vᵀxᵢ)²` (the projected variance, times n) is identical to minimising `Σ‖rᵢ‖²` (the reconstruction error). The same argument extends to a k-dimensional subspace." },
      { q: "Why must you centre the data?", a: "Variance is defined about the mean. If you skip centring you compute `E[(vᵀx)²]` instead of `Var(vᵀx)`, so the first component is pulled toward the direction of the mean vector — for data far from the origin, PC1 just points at the centroid and tells you nothing about the spread." },
      { q: "Covariance or correlation matrix?", a: "Covariance if all features share meaningful units and their relative scales matter (e.g. pixel intensities). Correlation (i.e. standardise first) when units are heterogeneous, otherwise the feature with the largest numeric range monopolises PC1 — swapping metres for millimetres would change your answer, which is a red flag for a method." },
      { q: "Why use SVD instead of eigendecomposing XᵀX?", a: "Numerics and cost. Forming `XᵀX` squares the condition number, so small singular values are lost to rounding; SVD works on `X` directly. And when `d ≫ n`, `XᵀX` is `d×d` while the SVD only needs the `min(n,d)` non-trivial directions. Randomised SVD gives the top-k in O(ndk)." },
      { q: "How many components should you keep?", a: "By cumulative explained variance (e.g. 95%), the scree-plot elbow, parallel analysis / the Marchenko-Pastur threshold for a noise floor, cross-validated reconstruction error, or — best — downstream task performance. Note explained variance is not importance: a low-variance direction can carry all the label information." },
      { q: "PCA vs LDA?", a: "PCA is unsupervised and maximises total variance; LDA is supervised and maximises the ratio of between-class to within-class scatter, giving at most C−1 components. If the classes differ along a low-variance direction, PCA will happily discard exactly the direction you need. Use LDA (or just don't reduce) when the goal is classification." },
      { q: "PCA vs t-SNE/UMAP?", a: "PCA is linear, deterministic, has an inverse, preserves global structure and is O(ndk). t-SNE/UMAP are non-linear and stochastic, optimise a neighbourhood-preservation objective, have no natural out-of-sample transform (t-SNE) and deliberately distort global distances — so cluster sizes and inter-cluster gaps in those plots mean nothing. PCA for features and preprocessing; t-SNE/UMAP for visual inspection only." },
      { q: "How does power iteration find the top component?", a: "Start from a random `v`, repeat `v ← Σv / ‖Σv‖`. Writing `v` in the eigenbasis, each multiplication scales component `i` by `λᵢ`, so the ratio of the top component to the next grows like `(λ₁/λ₂)ᵗ` and `v` converges to the top eigenvector. Deflate (`Σ ← Σ − λ₁v₁v₁ᵀ`) to get the next one. Convergence is slow when the eigenvalues are close, which is why production code uses Lanczos or randomised methods." }
    ]
  },

  code: [
    { lang: "python", label: "PCA via SVD", code: "import numpy as np\n\ndef pca(X, k=2, standardise=False):\n    X = np.asarray(X, dtype=float)\n    mu = X.mean(axis=0)\n    Xc = X - mu                                  # centring is not optional\n    if standardise:\n        sd = Xc.std(axis=0, ddof=1)\n        Xc = Xc / np.where(sd == 0, 1, sd)       # == PCA on the correlation matrix\n    U, S, Vt = np.linalg.svd(Xc, full_matrices=False)\n    comps = Vt[:k]                               # (k, d) rows = directions\n    Z = Xc @ comps.T                             # (n, k) scores\n    evr = (S ** 2) / (S ** 2).sum()              # explained variance ratio\n    return dict(components=comps, scores=Z, mean=mu,\n                explained=evr[:k], cumulative=np.cumsum(evr))\n\ndef inverse_transform(Z, comps, mu):\n    return Z @ comps + mu                        # rank-k reconstruction" },
    { lang: "python", label: "Power iteration + deflation", code: "def top_eigvec(Sigma, iters=200, tol=1e-10, rng=None):\n    rng = rng or np.random.default_rng(0)\n    v = rng.normal(size=Sigma.shape[0])\n    v /= np.linalg.norm(v)\n    lam = 0.0\n    for _ in range(iters):\n        w = Sigma @ v\n        nw = np.linalg.norm(w)\n        if nw < 1e-300:\n            break\n        v_new = w / nw\n        if np.linalg.norm(v_new - v) < tol:      # converges like (l2/l1)^t\n            v = v_new; break\n        v = v_new\n    lam = v @ Sigma @ v\n    return lam, v\n\ndef pca_by_deflation(Sigma, k):\n    out = []\n    S = Sigma.copy()\n    for _ in range(k):\n        lam, v = top_eigvec(S)\n        out.append((lam, v))\n        S = S - lam * np.outer(v, v)             # remove that direction\n    return out" },
    { lang: "python", label: "In a pipeline, without leaking", code: "from sklearn.decomposition import PCA\nfrom sklearn.pipeline import make_pipeline\nfrom sklearn.preprocessing import StandardScaler\n\npipe = make_pipeline(StandardScaler(), PCA(n_components=0.95), clf)\n# n_components as a float = keep enough components for 95% explained variance.\n# Inside a pipeline, PCA is refit on each CV training fold -- fitting it on the\n# full X first would leak the test set's covariance structure into the model." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 250 },

    params: [
      { key: "n", label: "Points", type: "int", min: 40, max: 220, default: 120 },
      { key: "tilt", label: "Data tilt (deg)", type: "int", min: 0, max: 170, default: 35 },
      { key: "aniso", label: "Elongation ×0.1", type: "int", min: 11, max: 60, default: 30 },
      { key: "step", label: "Sweep step (deg)", type: "int", min: 2, max: 15, default: 4 },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = params.n, stepDeg = params.step;
      const tilt = (params.tilt * Math.PI) / 180;
      const ratio = params.aniso / 10;
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };

      // correlated cloud: long axis at `tilt`, aspect `ratio`
      const sLong = 1.0, sShort = sLong / ratio;
      const raw = [];
      for (let i = 0; i < n; i++) {
        const a = gauss() * sLong, b = gauss() * sShort;
        raw.push({
          x: a * Math.cos(tilt) - b * Math.sin(tilt) + 0.6,
          y: a * Math.sin(tilt) + b * Math.cos(tilt) - 0.35
        });
      }
      let mx = 0, my = 0;
      for (const p of raw) { mx += p.x; my += p.y; }
      mx /= n; my /= n;
      const pts = raw.map((p) => ({ x: p.x - mx, y: p.y - my }));

      // covariance
      let Sxx = 0, Sxy = 0, Syy = 0;
      for (const p of pts) { Sxx += p.x * p.x; Sxy += p.x * p.y; Syy += p.y * p.y; }
      Sxx /= (n - 1); Sxy /= (n - 1); Syy /= (n - 1);
      const total = Sxx + Syy;

      // closed form 2x2 eigen
      const tr = Sxx + Syy, det = Sxx * Syy - Sxy * Sxy;
      const disc = Math.sqrt(Math.max(0, tr * tr / 4 - det));
      const l1 = tr / 2 + disc, l2 = Math.max(0, tr / 2 - disc);
      const thStar = 0.5 * Math.atan2(2 * Sxy, Sxx - Syy);

      const varAt = (t) => {
        const c = Math.cos(t), s = Math.sin(t);
        return Sxx * c * c + 2 * Sxy * c * s + Syy * s * s;
      };

      const ptsPub = pts.map((p) => ({ x: +p.x.toFixed(4), y: +p.y.toFixed(4) }));

      const snap = (over) => Object.assign({
        pts: ptsPub, n, Sxx: +Sxx.toFixed(5), Sxy: +Sxy.toFixed(5), Syy: +Syy.toFixed(5),
        theta: 0, curve: [], best: null, thStar: +thStar.toFixed(5),
        l1: +l1.toFixed(5), l2: +l2.toFixed(5), total: +total.toFixed(5),
        collapse: 0, showPC2: false, recon: 0, mode: "sweep"
      }, over || {});

      yield {
        label: `${n} points, already centred (the mean is subtracted — PCA on uncentred data finds the direction of the mean, not the direction of variation). Covariance Σ = [[${Sxx.toFixed(3)}, ${Sxy.toFixed(3)}], [${Sxy.toFixed(3)}, ${Syy.toFixed(3)}]]; total variance tr(Σ) = ${total.toFixed(3)}. Now sweep a candidate unit vector and measure the variance of the projections.`,
        phase: "init",
        state: snap()
      };

      const curve = [];
      let best = { theta: 0, v: -Infinity };
      for (let deg = 0; deg <= 180; deg += stepDeg) {
        const t = (deg * Math.PI) / 180;
        const v = varAt(t);
        curve.push([deg, +v.toFixed(5)]);
        if (v > best.v) best = { theta: t, v };
        const resid = total - v;
        yield {
          label: `θ = ${deg}°: projected variance vᵀΣv = ${v.toFixed(4)} (${(100 * v / total).toFixed(1)}% of the total ${total.toFixed(3)}); the leftover — mean squared distance from the line — is ${resid.toFixed(4)}. The two always sum to tr(Σ), which is why maximising the projection is identical to minimising reconstruction error.`,
          phase: "sweep",
          state: snap({
            theta: +t.toFixed(5), curve: curve.map((c) => c.slice()),
            best: { theta: +best.theta.toFixed(5), v: +best.v.toFixed(5) }
          })
        };
      }

      yield {
        label: `Sweep done. The maximum of vᵀΣv over the grid is at θ = ${((best.theta * 180) / Math.PI).toFixed(1)}° with variance ${best.v.toFixed(4)}. The closed form agrees: for a 2×2 covariance, θ* = ½·atan2(2Σ₁₂, Σ₁₁ − Σ₂₂) = ${((thStar * 180 / Math.PI + 180) % 180).toFixed(2)}°, with eigenvalues λ₁ = ${l1.toFixed(4)} and λ₂ = ${l2.toFixed(4)}. Explained variance ratio: ${(100 * l1 / total).toFixed(1)}% / ${(100 * l2 / total).toFixed(1)}%.`,
        phase: "found",
        state: snap({
          theta: +thStar.toFixed(5), curve: curve.map((c) => c.slice()),
          best: { theta: +best.theta.toFixed(5), v: +best.v.toFixed(5) },
          showPC2: true, mode: "found"
        })
      };

      yield {
        label: `PC2 is the orthogonal direction, θ* + 90°, and it carries the remaining ${(100 * l2 / total).toFixed(1)}%. Eigenvectors of a symmetric matrix are orthogonal, so the components are uncorrelated by construction — in the PC basis, Σ is diagonal. Uncorrelated is not independent, though: that needs ICA or a Gaussian assumption.`,
        phase: "pc2",
        state: snap({
          theta: +thStar.toFixed(5), curve: curve.map((c) => c.slice()),
          best: { theta: +best.theta.toFixed(5), v: +best.v.toFixed(5) },
          showPC2: true, mode: "found"
        })
      };

      const STEPS = 14;
      for (let s = 1; s <= STEPS; s++) {
        const a = s / STEPS;
        // reconstruction error at partial collapse is only meaningful at a = 1
        let err = 0;
        const c = Math.cos(thStar), sn = Math.sin(thStar);
        for (const p of pts) {
          const proj = p.x * c + p.y * sn;
          const rx = p.x - proj * c, ry = p.y - proj * sn;
          err += rx * rx + ry * ry;
        }
        err /= n;
        yield {
          label: s < STEPS
            ? `Projecting onto PC1 (${(a * 100).toFixed(0)}% of the way): each point slides along its perpendicular to the line. The distance it travels is exactly its reconstruction error.`
            : `Fully projected. Every point is now one number — its coordinate along PC1 — so the data is 2D → 1D. Mean squared reconstruction error = λ₂ = ${err.toFixed(4)}, and ${(100 * l1 / total).toFixed(1)}% of the variance survives. Choosing k is choosing how much of tr(Σ) you are willing to throw away.`,
          phase: "collapse",
          state: snap({
            theta: +thStar.toFixed(5), curve: curve.map((c2) => c2.slice()),
            best: { theta: +best.theta.toFixed(5), v: +best.v.toFixed(5) },
            showPC2: true, collapse: +a.toFixed(4), recon: +err.toFixed(5), mode: "collapse"
          })
        };
      }

      yield {
        label: `Summary: PC1 explains ${(100 * l1 / total).toFixed(1)}% of the variance, PC2 the remaining ${(100 * l2 / total).toFixed(1)}%. Keeping k components always costs you exactly the sum of the discarded eigenvalues in mean squared error — that is the Eckart–Young theorem, and it is why explained-variance ratio is the natural way to choose k. Remember: high variance ≠ high usefulness; a low-variance direction can hold all the label information.`,
        phase: "done",
        state: snap({
          theta: +thStar.toFixed(5), curve: curve.map((c) => c.slice()),
          best: { theta: +best.theta.toFixed(5), v: +best.v.toFixed(5) },
          showPC2: true, collapse: 1, recon: +l2.toFixed(5), mode: "done"
        })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const gap = 20;
      const leftW = Math.round(W * 0.54);
      const padT = 30, padB = 42;
      const ph = H - padT - padB;
      const aL = 40, aW = leftW - aL - 8;
      const M = 3.0;
      const sc = Math.min(aW / (2 * M), ph / (2 * M));
      const ox = aL + aW / 2, oy = padT + ph / 2;
      const AX = (x) => ox + x * sc;
      const AY = (y) => oy - y * sc;

      // ---- grid ------------------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -2; t <= 2; t++) {
        const X = AX(t), Y = AY(t);
        if (X > aL && X < aL + aW) {
          ctx.beginPath(); ctx.moveTo(X, padT); ctx.lineTo(X, padT + ph); ctx.stroke();
          ctx.textAlign = "center"; ctx.fillText(String(t), X, padT + ph + 14);
        }
        if (Y > padT && Y < padT + ph) {
          ctx.beginPath(); ctx.moveTo(aL, Y); ctx.lineTo(aL + aW, Y); ctx.stroke();
          ctx.textAlign = "right"; ctx.fillText(String(t), aL - 5, Y + 3);
        }
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2; ctx.strokeRect(aL, padT, aW, ph);

      const c = Math.cos(S.theta), s = Math.sin(S.theta);
      const L = M * 1.35;

      ctx.save();
      ctx.beginPath(); ctx.rect(aL, padT, aW, ph); ctx.clip();

      // ---- candidate axis --------------------------------------------------
      ctx.strokeStyle = C.viz7; ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(AX(-L * c), AY(-L * s)); ctx.lineTo(AX(L * c), AY(L * s));
      ctx.stroke();
      if (S.showPC2) {
        ctx.strokeStyle = C.viz5; ctx.lineWidth = 1.6; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(AX(L * s), AY(-L * c)); ctx.lineTo(AX(-L * s), AY(L * c));
        ctx.stroke(); ctx.setLineDash([]);
      }

      // ---- residual segments + points --------------------------------------
      const a = S.collapse;
      for (const p of S.pts) {
        const proj = p.x * c + p.y * s;
        const px = proj * c, py = proj * s;
        const cx = p.x + (px - p.x) * a, cy = p.y + (py - p.y) * a;

        if (a < 1) {
          ctx.strokeStyle = C.viz2; ctx.globalAlpha = 0.35; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(AX(cx), AY(cy)); ctx.lineTo(AX(px), AY(py)); ctx.stroke();
          ctx.globalAlpha = 1;
        }
        // projection tick on the line
        ctx.fillStyle = C.viz7;
        ctx.beginPath(); ctx.arc(AX(px), AY(py), 2, 0, Math.PI * 2); ctx.fill();
        // the point
        ctx.fillStyle = C.viz1;
        ctx.beginPath(); ctx.arc(AX(cx), AY(cy), 3.3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.restore();

      // origin
      ctx.strokeStyle = C.text2; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(AX(0) - 5, AY(0)); ctx.lineTo(AX(0) + 5, AY(0));
      ctx.moveTo(AX(0), AY(0) - 5); ctx.lineTo(AX(0), AY(0) + 5);
      ctx.stroke();

      ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text2;
      ctx.fillText(`candidate axis θ = ${((S.theta * 180 / Math.PI + 180) % 180).toFixed(1)}°`, aL, 20);

      // legend
      ctx.font = `10px ${env.font.base}`;
      let lx = aL;
      const li = (col, txt, dashed) => {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.setLineDash(dashed ? [4, 3] : []);
        ctx.beginPath(); ctx.moveTo(lx, H - 20); ctx.lineTo(lx + 14, H - 20); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.text2; ctx.fillText(txt, lx + 19, H - 17);
        lx += 24 + ctx.measureText(txt).width;
      };
      li(C.viz7, "candidate / PC1");
      if (S.showPC2) li(C.viz5, "PC2", true);
      li(C.viz2, "residual (reconstruction error)");

      // ================= RIGHT: variance vs angle ==========================
      const bL = leftW + gap, bW = W - bL - 16;
      const bH = Math.round(ph * 0.52);
      ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text;
      ctx.fillText("projected variance  vᵀΣv  vs θ", bL, 20);

      const vmax = Math.max(S.l1, 1e-6) * 1.12;
      const BX = (deg) => bL + (deg / 180) * bW;
      const BY = (v) => padT + bH - (Math.max(0, Math.min(vmax, v)) / vmax) * bH;

      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`;
      for (let d = 0; d <= 180; d += 45) {
        ctx.beginPath(); ctx.moveTo(BX(d), padT); ctx.lineTo(BX(d), padT + bH); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "center";
        ctx.fillText(`${d}°`, BX(d), padT + bH + 14);
      }
      for (let k = 0; k <= 3; k++) {
        const v = (k / 3) * vmax;
        ctx.strokeStyle = C.grid;
        ctx.beginPath(); ctx.moveTo(bL, BY(v)); ctx.lineTo(bL + bW, BY(v)); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right";
        ctx.fillText(v.toFixed(2), bL - 5, BY(v) + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2; ctx.strokeRect(bL, padT, bW, bH);

      // total variance line
      ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      if (S.total <= vmax) {
        ctx.beginPath(); ctx.moveTo(bL, BY(S.total)); ctx.lineTo(bL + bW, BY(S.total)); ctx.stroke();
      }
      ctx.setLineDash([]);

      if (S.curve.length > 1) {
        ctx.strokeStyle = C.viz3; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < S.curve.length; i++) {
          const X = BX(S.curve[i][0]), Y = BY(S.curve[i][1]);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
      }
      // eigenvalue markers
      const dStar = ((S.thStar * 180 / Math.PI) + 180) % 180;
      ctx.strokeStyle = C.viz6; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(BX(dStar), padT); ctx.lineTo(BX(dStar), padT + bH); ctx.stroke();
      ctx.fillStyle = C.viz6; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText(`θ* = ${dStar.toFixed(1)}°`, BX(dStar) + 3, padT + 12);

      const dNow = ((S.theta * 180 / Math.PI) + 180) % 180;
      ctx.strokeStyle = C.viz7; ctx.lineWidth = 1.4; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(BX(dNow), padT); ctx.lineTo(BX(dNow), padT + bH); ctx.stroke();
      ctx.setLineDash([]);

      // ---- numbers panel ---------------------------------------------------
      let ty = padT + bH + 46;
      const row = (k, v, col) => {
        ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.muted; ctx.textAlign = "left";
        ctx.fillText(k, bL, ty);
        ctx.font = `12px ${env.font.mono}`; ctx.fillStyle = col || C.text; ctx.textAlign = "right";
        ctx.fillText(v, bL + bW, ty); ty += 18;
      };
      ctx.font = `11px ${env.font.mono}`; ctx.fillStyle = C.text2; ctx.textAlign = "left";
      ctx.fillText(`Σ = [ ${S.Sxx.toFixed(3)}  ${S.Sxy.toFixed(3)} ]`, bL, ty - 20);
      ctx.fillText(`    [ ${S.Sxy.toFixed(3)}  ${S.Syy.toFixed(3)} ]`, bL, ty - 6);
      ty += 8;
      row("λ₁ (PC1 variance)", S.l1.toFixed(4), C.viz7);
      row("λ₂ (PC2 variance)", S.l2.toFixed(4), C.viz5);
      row("tr(Σ) = λ₁ + λ₂", S.total.toFixed(4));
      row("current vᵀΣv", (function () {
        const cc = Math.cos(S.theta), ss = Math.sin(S.theta);
        return (S.Sxx * cc * cc + 2 * S.Sxy * cc * ss + S.Syy * ss * ss).toFixed(4);
      })(), C.viz3);

      // explained-variance bar
      ty += 6;
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("explained variance ratio", bL, ty); ty += 6;
      const f1 = S.l1 / Math.max(1e-9, S.total);
      ctx.fillStyle = C.viz7; ctx.fillRect(bL, ty, bW * f1, 14);
      ctx.fillStyle = C.viz5; ctx.fillRect(bL + bW * f1, ty, bW * (1 - f1), 14);
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(bL, ty, bW, 14);
      ctx.fillStyle = C.surface; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText(`PC1 ${(f1 * 100).toFixed(1)}%`, bL + 5, ty + 11);
      if (1 - f1 > 0.14) {
        ctx.textAlign = "right";
        ctx.fillText(`PC2 ${((1 - f1) * 100).toFixed(1)}%`, bL + bW - 5, ty + 11);
      }
    }
  },

  drill: {
    cards: [
      { q: "Give the two equivalent definitions of PCA.", a: "Maximise the variance of the projection `vᵀΣv` over unit v; or minimise the squared reconstruction error onto a k-dim subspace. They coincide because ‖x‖² = ‖proj‖² + ‖resid‖² for centred x and the total is fixed.", tags: ["theory"] },
      { q: "Why is centring mandatory?", a: "Variance is defined about the mean. Uncentred, you maximise E[(vᵀx)²], so PC1 is dragged toward the mean vector rather than the direction of spread.", tags: ["practice"] },
      { q: "Covariance or correlation matrix?", a: "Covariance when features share meaningful units; correlation (standardise first) when units differ, otherwise the largest-scale feature monopolises PC1 and changing units changes the answer.", tags: ["practice"] },
      { q: "Why SVD instead of eigendecomposing XᵀX?", a: "Forming XᵀX squares the condition number and destroys small singular values; SVD acts on X directly. It is also cheaper when d ≫ n, and randomised SVD gets the top-k in O(ndk).", tags: ["numerics"] },
      { q: "How does power iteration work and how fast does it converge?", a: "`v ← Σv/‖Σv‖` repeatedly. In the eigenbasis each step scales component i by λᵢ, so the top direction dominates at rate (λ₂/λ₁)ᵗ. Deflate with `Σ − λ₁v₁v₁ᵀ` to get the next component.", tags: ["algorithm"] },
      { q: "Are principal components independent?", a: "No — uncorrelated. Σ becomes diagonal in the PC basis, which is second-order decorrelation only. Independence requires ICA, or a Gaussian assumption under which the two coincide.", tags: ["theory"] },
      { q: "PCA vs LDA?", a: "PCA is unsupervised, maximises total variance, keeps up to d components. LDA is supervised, maximises between-class over within-class scatter, gives at most C−1. PCA can discard exactly the low-variance direction that separates classes.", tags: ["comparison"] },
      { q: "PCA vs t-SNE/UMAP — when do you use which?", a: "PCA: linear, deterministic, invertible, preserves global structure, fast — use for compression/preprocessing/features. t-SNE/UMAP: non-linear, stochastic, neighbourhood-preserving, distort global distances — use for visual inspection only, never as features.", tags: ["comparison"] }
    ],
    sixtySecond: [
      "Explain PCA from both the maximum-variance and minimum-reconstruction-error viewpoints and show why they are the same.",
      "Explain how you would choose the number of components and what explained variance does and does not tell you."
    ]
  }
};
