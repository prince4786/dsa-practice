export default {
  id: "kmeans",
  track: "ml",
  title: "k-Means Clustering",
  difficulty: 1,
  minutes: 14,
  tags: ["unsupervised", "clustering", "em", "initialization"],

  explainer: [
    { type: "p", text: "k-means is one of the simplest ways to automatically group similar data points together without being told in advance what the groups should look like — this general kind of task, learning structure from unlabelled data, is called **unsupervised learning** (unlike the earlier lessons, there is no 'correct answer' `y` to train against). The idea: pick a number of groups you want, called `k`, place `k` 'center' points (called **centroids**) somewhere among the data, and then repeat two simple steps — assign every data point to whichever centroid is nearest to it, then move each centroid to the average position of all the points now assigned to it — until nothing changes any more. Formally, k-means is trying to minimise a specific quantity called **inertia**, written `J = Σᵢ ‖xᵢ − μ_{c(i)}‖²`: in words, add up, over every data point `xᵢ`, the squared distance from that point to the centroid `μ` it's currently assigned to (`c(i)` denotes which cluster point `i` belongs to). Smaller `J` means points are, on average, tightly packed around their assigned centroid — a good clustering. The specific two-step procedure for minimising `J` is called **Lloyd's algorithm**, and each of its two steps is the mathematically exact best move for that step, holding the other one fixed:" },
    { type: "code", lang: "python", code: "repeat:\n    assign:  c(i) = argmin_j ||x_i - mu_j||^2      # best labels given centroids\n    update:  mu_j = mean of points with c(i) = j   # best centroids given labels" },
    { type: "p", text: "The assign step is optimal because, given a fixed set of centroids, assigning each point to its *nearest* centroid is obviously the choice that minimises the total distance. The update step is optimal because, given a fixed set of assignments, the single point that minimises the total squared distance to a group of points is exactly their mean (average) — a basic fact from statistics. Because each step can only ever decrease `J`, and never increase it, and because there are only finitely many possible ways to assign points to clusters, this process is guaranteed to **eventually stop changing** — usually within a few dozen repetitions. But there's an important catch: it is only guaranteed to stop at a **local minimum**, not necessarily the best possible clustering overall (the **global minimum**). The underlying problem is what's called **non-convex** (recall from the linear/logistic regression lesson that convex means 'shaped like a single smooth bowl with one lowest point' — this is not that), so where you start genuinely determines where you end up. Finding the provably best possible clustering is computationally intractable (NP-hard) even for just `k = 2` groups." },
    { type: "h3", text: "k-means++ initialisation: choosing better starting centroids" },
    { type: "p", text: "Since the final result depends heavily on where the centroids started, choosing good starting positions matters a lot. **k-means++** is the standard smart way to do this: pick the very first centroid uniformly at random from the data points. Then, for each subsequent centroid, instead of picking uniformly at random, pick a data point with probability proportional to `D(x)²` — the squared distance from that point to whichever already-chosen centroid is nearest to it. In plain terms: points that are already far away from every centroid chosen so far are much more likely to be picked next. This spreads the initial centroids out across the data rather than letting them cluster together by chance, and it comes with a mathematical guarantee (an `O(log k)`-competitive expected result) *before Lloyd's algorithm has even started running*. Every major library uses k-means++ by default, and it's the single highest-value fact to know about k-means going into an interview." },
    { type: "h3", text: "What k-means assumes, and where those assumptions break down" },
    { type: "list", items: [
      "**Clusters are round (spherical), similar in spread, and similar in size** — because k-means uses plain squared straight-line (Euclidean) distance and assigns each point fully to one cluster (a 'hard' assignment), the implied boundary between any two clusters is always a flat plane exactly halfway between their centroids (this kind of boundary is called a Voronoi cell). Elongated, oddly-shaped, or very differently-sized clusters get cut awkwardly in half by these flat boundaries.",
      "**Distance must be measured on a comparable numeric scale across all features** — if one feature ranges from 0 to 1000 and another from 0 to 1, the first feature will completely dominate the distance calculation regardless of which one actually matters more. Always rescale (standardise) your features first — forgetting this is the single most common practical bug when applying k-means.",
      "**You must decide `k` in advance** — using the elbow method (looking for a bend in a plot of inertia versus `k`), the silhouette score (below), the gap statistic (comparing to a random reference distribution), or a downstream task metric. Inertia by itself always keeps decreasing as `k` grows, so simply 'minimise inertia' would just pick `k` equal to the number of data points, which is useless.",
      "**Sensitive to outliers** — because each centroid is the mean of its assigned points, and a mean is easily dragged by extreme values, a single far-off outlier can noticeably shift a centroid. Variants like k-medoids (which uses actual data points as centers instead of computed averages) or k-medians (using absolute rather than squared distance) are more robust alternatives."
    ]},
    { type: "callout", tone: "pitfall", text: "Empty clusters can genuinely happen: a centroid can end up with zero data points assigned to it after an assign step. Standard libraries handle this by re-seeding that empty centroid at whichever data point is currently furthest from its own centroid. If you implement k-means yourself and skip this handling, computing 'the average of zero points' produces a divide-by-zero error and the centroid becomes `NaN` (Not a Number), which then poisons every later step." },
    { type: "h3", text: "Related methods worth knowing" },
    { type: "list", items: [
      "**Gaussian mixture models (GMM), fit with the EM algorithm** — a 'soft' version of k-means: instead of assigning each point fully to one cluster, it computes a probability (called a **responsibility**) that each point belongs to each cluster, and it allows each cluster to have its own elongated, tilted shape (a full covariance matrix) rather than being forced round. k-means is mathematically the special-case limit of a GMM where every cluster is forced to be round with equal spread, and assignments are forced to be all-or-nothing rather than probabilistic.",
      "**DBSCAN** — a density-based alternative that finds clusters of any shape (not just round ones) and explicitly labels sparse, isolated points as noise/outliers rather than forcing them into a cluster. It doesn't need `k` specified in advance, but instead needs two different settings (`eps`, a distance threshold, and `minPts`, a minimum neighbour count), and it struggles when different clusters have very different densities.",
      "**Hierarchical (agglomerative) clustering** — builds a full tree of nested clusters (called a **dendrogram**) by repeatedly merging the two closest clusters together, so you can 'cut' the tree at any level afterward to get any number of clusters you like. It costs `O(n²)` to `O(n³)` in computation, so it's only practical for smaller datasets.",
      "**Mini-batch k-means** — the standard trick for scaling k-means to very large datasets: instead of using every data point at each step, use a small random batch, updating centroids incrementally. This converges to a slightly worse (but usually acceptable) clustering, much faster."
    ]},
    { type: "callout", tone: "tip", text: "For choosing `k`, the **silhouette score** is generally more useful than the elbow method: for a single point `i`, `s(i) = (b − a)/max(a, b)`, where `a` is the average distance from that point to other points in its own cluster, and `b` is the average distance to the points in the *nearest other* cluster. A score near +1 means the point is well-matched to its own cluster and far from others; near 0 means it sits right on a boundary between two clusters; negative means it's probably been assigned to the wrong cluster entirely. Because it's computed per point rather than as a single overall number, you can also see exactly *which* clusters are poorly formed, not just whether the overall clustering is good." }
  ],

  glossary: [
    { term: "Unsupervised learning", plain: "Learning structure or patterns from data that has no correct-answer labels attached, unlike supervised learning where each example comes with a known target to predict." },
    { term: "Centroid", plain: "The center point representing one cluster in k-means, computed as the average position of every data point currently assigned to that cluster." },
    { term: "Inertia (within-cluster sum of squares)", plain: "The total squared distance from every data point to the centroid it's assigned to, added up across all points. k-means tries to make this number as small as possible." },
    { term: "Lloyd's algorithm", plain: "The standard two-step procedure for k-means: repeatedly assign each point to its nearest centroid, then move each centroid to the average of its assigned points, until nothing changes." },
    { term: "Local minimum vs. global minimum", plain: "A local minimum is a solution that can't be improved by any small nearby change, but might not be the best solution overall. A global minimum is the actual best solution possible. k-means only guarantees finding a local minimum." },
    { term: "k-means++", plain: "A smarter way of choosing the starting centroids for k-means, which spreads them out across the data rather than placing them randomly, leading to more reliable final clusterings." },
    { term: "Voronoi cell", plain: "The region of space closer to one particular centroid than to any other — the flat-boundary shape that k-means implicitly divides the data into." },
    { term: "Silhouette score", plain: "A per-point score measuring how well-matched a point is to its own cluster versus the nearest other cluster, used to judge cluster quality and choose the number of clusters." },
    { term: "Elbow method", plain: "A way of picking the number of clusters by plotting inertia against different values of k and looking for the point where the improvement noticeably slows down, forming a bend or 'elbow' in the curve." },
    { term: "Gaussian mixture model (GMM)", plain: "A 'soft' clustering method related to k-means where each point gets a probability of belonging to each cluster, and clusters can be stretched or tilted rather than forced to be perfectly round." },
    { term: "DBSCAN", plain: "A clustering method that groups points based on how densely packed they are, can find oddly-shaped clusters, and explicitly marks sparse points as noise instead of forcing them into a group." },
    { term: "Dendrogram", plain: "A tree diagram produced by hierarchical clustering, showing how individual points were progressively merged into larger and larger clusters." }
  ],

  complexity: {
    rows: [
      { operation: "One Lloyd iteration", time: "O(n · k · d)", space: "O(n + k·d)", note: "distance to every centroid for every point" },
      { operation: "Full run", time: "O(i · n · k · d)", space: "O(n + k·d)", note: "i = iterations, usually 10–50" },
      { operation: "k-means++ seeding", time: "O(n · k · d)", space: "O(n)", note: "k passes of D² sampling" },
      { operation: "Mini-batch k-means", time: "O(i · b · k · d)", space: "O(b + k·d)", note: "b = batch size ≪ n" },
      { operation: "Exact global optimum", time: "NP-hard", space: "—", note: "even for k = 2 in general dimension" }
    ]
  },

  interview: {
    whyAsked: "It is the standard unsupervised-learning question, and it is a compact test of three things: can you state an algorithm precisely, do you know why it converges but not to the right answer, and do you know how practitioners work around that (k-means++, restarts, silhouette).",
    followUps: [
      { q: "Why is k-means guaranteed to converge, and what does it converge to?", a: "Each step exactly minimises `J = Σ‖x − μ_c‖²` in one variable with the other fixed: the assignment step picks the nearest centroid (optimal labels given centroids), the update step takes the mean (optimal centroid given labels — the mean is the minimiser of squared distance). So J is non-increasing, and there are finitely many possible assignments, so it must halt. It halts at a local minimum, not the global one; the objective is non-convex and global optimisation is NP-hard." },
      { q: "Explain k-means++ and why it helps.", a: "Choose the first centre uniformly from the data; choose each subsequent centre with probability ∝ `D(x)²`, the squared distance to the nearest chosen centre. Points far from every existing centre are much more likely to be picked, so the seeds land in different clusters. The resulting solution is `O(log k)`-competitive with the optimum in expectation before Lloyd even runs, and it dramatically reduces the number of restarts needed." },
      { q: "How do you choose k?", a: "Never by minimising inertia — it decreases monotonically to zero at k = n. Options: the elbow of the inertia curve (subjective); silhouette score maximisation; the gap statistic (compare inertia to that of a uniform reference distribution); BIC/AIC if you switch to a Gaussian mixture; or — best when it exists — a downstream task metric. Also plain domain constraints: 'we can staff 5 segments'." },
      { q: "When does k-means fail?", a: "Non-spherical clusters (two crescents, elongated clusters) because the implied boundaries are Voronoi hyperplanes; clusters of very different sizes or densities (the big one gets split, the small one absorbed); unscaled features (one dimension dominates the distance); categorical data (means are meaningless — use k-modes or a different metric); and outliers (the mean is not robust). DBSCAN or a GMM is the usual answer." },
      { q: "What is the relationship between k-means and EM for Gaussian mixtures?", a: "k-means is the hard-assignment limit of EM for a GMM with spherical, equal, and vanishing covariance: the responsibilities become 0/1 as σ → 0, so the E-step becomes 'assign to nearest' and the M-step becomes 'take the mean'. GMM generalises it with soft responsibilities and full covariance matrices, so it can model elliptical, overlapping clusters and gives a likelihood you can use for model selection." },
      { q: "What do you do about empty clusters?", a: "Re-seed: move that centroid onto the data point furthest from its current centroid (or split the cluster with the largest inertia). sklearn does this internally. Without it you divide by zero and get NaN centroids, which then poison every subsequent assignment." },
      { q: "How would you scale k-means to 10⁹ points?", a: "Mini-batch k-means (sample b points per iteration, update centroids with a per-centre learning rate) — orders of magnitude faster for a small quality loss. Also: Elkan's/Hamerly's algorithms use the triangle inequality to skip distance computations; k-means|| parallelises the ++ seeding; and dimensionality reduction (PCA/random projection) first reduces d, which is a linear factor in cost." }
    ]
  },

  code: [
    { lang: "python", label: "Lloyd's algorithm + k-means++", code: "import numpy as np\n\ndef kmeanspp(X, k, rng):\n    C = [X[rng.integers(len(X))]]\n    for _ in range(1, k):\n        d2 = np.min(((X[:, None, :] - np.array(C)[None]) ** 2).sum(-1), axis=1)\n        probs = d2 / d2.sum()                 # sample proportional to D(x)^2\n        C.append(X[rng.choice(len(X), p=probs)])\n    return np.array(C)\n\ndef kmeans(X, k, iters=100, tol=1e-6, seed=0):\n    rng = np.random.default_rng(seed)\n    C = kmeanspp(X, k, rng)\n    for it in range(iters):\n        d2 = ((X[:, None, :] - C[None]) ** 2).sum(-1)   # (n, k)\n        labels = d2.argmin(1)\n        inertia = d2[np.arange(len(X)), labels].sum()\n        newC = np.empty_like(C)\n        for j in range(k):\n            m = labels == j\n            if m.any():\n                newC[j] = X[m].mean(0)\n            else:                                        # empty cluster!\n                newC[j] = X[d2.min(1).argmax()]          # re-seed at the worst point\n        shift = np.linalg.norm(newC - C)\n        C = newC\n        if shift < tol:\n            break\n    return C, labels, inertia" },
    { lang: "python", label: "Restarts and model selection", code: "from sklearn.cluster import KMeans\nfrom sklearn.metrics import silhouette_score\n\nbest = None\nfor k in range(2, 11):\n    km = KMeans(n_clusters=k, n_init=10, init=\"k-means++\").fit(Xs)\n    sil = silhouette_score(Xs, km.labels_)\n    print(f\"k={k}  inertia={km.inertia_:10.1f}  silhouette={sil:.3f}\")\n    if best is None or sil > best[1]:\n        best = (k, sil)\n# n_init=10 runs Lloyd 10x from different seeds and keeps the lowest inertia --\n# that is the standard defence against local minima.\n# NOTE: Xs must be standardised; k-means is a Euclidean-distance method." },
    { lang: "python", label: "Silhouette by hand", code: "def silhouette(X, labels):\n    n = len(X)\n    D = np.sqrt(((X[:, None, :] - X[None]) ** 2).sum(-1))\n    s = np.zeros(n)\n    for i in range(n):\n        own = labels == labels[i]\n        a = D[i, own & (np.arange(n) != i)].mean() if own.sum() > 1 else 0.0\n        b = min(D[i, labels == j].mean()\n                for j in set(labels) if j != labels[i])\n        s[i] = 0.0 if max(a, b) == 0 else (b - a) / max(a, b)\n    return s          # near +1 well clustered, ~0 on a boundary, <0 misassigned" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 250 },

    params: [
      { key: "k", label: "k (clusters)", type: "int", min: 2, max: 6, default: 4 },
      { key: "n", label: "Points", type: "int", min: 60, max: 260, default: 160 },
      { key: "init", label: "Initialisation", type: "enum", options: ["kmeans++", "random", "adversarial"], default: "kmeans++" },
      { key: "restarts", label: "Restarts", type: "int", min: 1, max: 3, default: 2 },
      { key: "seed", label: "Reseed", type: "seed" }
    ],

    frames: function* (params, rng) {
      const k = params.k, n = params.n, R = params.restarts;
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };

      // four true blobs (deliberately not equal to k unless k = 4)
      const blobs = [[-1.35, 1.15], [1.4, 1.25], [-1.45, -1.2], [1.3, -1.1]];
      const spread = [0.42, 0.36, 0.40, 0.34];
      const pts = [];
      for (let i = 0; i < n; i++) {
        const b = i % 4;
        pts.push({ x: blobs[b][0] + gauss() * spread[b], y: blobs[b][1] + gauss() * spread[b] });
      }

      const d2 = (p, c) => (p.x - c[0]) * (p.x - c[0]) + (p.y - c[1]) * (p.y - c[1]);

      const seedCentroids = (kind) => {
        const C = [];
        if (kind === "adversarial") {
          // all seeds crammed into one blob -> a textbook local optimum
          for (let j = 0; j < k; j++) C.push([blobs[0][0] + gauss() * 0.12, blobs[0][1] + gauss() * 0.12]);
          return { C, picks: [] };
        }
        if (kind === "random") {
          const used = {};
          for (let j = 0; j < k; j++) {
            let i = Math.floor(rng() * n);
            let guard = 0;
            while (used[i] && guard++ < 50) i = Math.floor(rng() * n);
            used[i] = true;
            C.push([pts[i].x, pts[i].y]);
          }
          return { C, picks: [] };
        }
        // k-means++
        const picks = [];
        const first = Math.floor(rng() * n);
        C.push([pts[first].x, pts[first].y]);
        picks.push({ chosen: first, probs: null });
        for (let j = 1; j < k; j++) {
          const dd = pts.map((p) => {
            let m = Infinity;
            for (const c of C) m = Math.min(m, d2(p, c));
            return m;
          });
          const tot = dd.reduce((a, b) => a + b, 0);
          let r = rng() * tot, pick = n - 1;
          for (let i = 0; i < n; i++) { r -= dd[i]; if (r <= 0) { pick = i; break; } }
          picks.push({ chosen: pick, probs: dd.map((v) => +(v / Math.max(1e-12, tot)).toFixed(5)) });
          C.push([pts[pick].x, pts[pick].y]);
        }
        return { C, picks };
      };

      const results = [];
      const restartStates = []; // full final state per restart, so the closing summary can show the winner
      const ptsPub = pts.map((p) => ({ x: +p.x.toFixed(3), y: +p.y.toFixed(3) }));

      const snap = (over) => Object.assign({
        k, n, init: params.init, restart: 0, restarts: R,
        pts: ptsPub, centroids: [], labels: new Array(n).fill(-1),
        prev: null, inertia: 0, iter: 0, moved: 0, sizes: [],
        history: [], results: results.slice(), seedProbs: null, phase2: ""
      }, over || {});

      yield {
        label: `${n} points drawn from 4 Gaussian blobs; we will fit k = ${k} centroids with ${params.init} initialisation and ${R} restart${R === 1 ? "" : "s"}. k-means minimises inertia J = Σ‖x − μ_c‖², alternating "assign to nearest" and "move to the mean".`,
        phase: "init",
        state: snap()
      };

      for (let r = 0; r < R; r++) {
        const { C, picks } = seedCentroids(params.init);
        let centroids = C.map((c) => c.slice());
        const history = [];

        if (params.init === "kmeans++") {
          for (let j = 0; j < picks.length; j++) {
            yield {
              label: j === 0
                ? `Restart ${r + 1}: k-means++ picks the first centre uniformly at random (point ${picks[0].chosen}).`
                : `k-means++ centre ${j + 1}: sample from the data with probability ∝ D(x)², the squared distance to the nearest chosen centre. The highlighted point had probability ${(picks[j].probs[picks[j].chosen] * 100).toFixed(2)}% — far-away points are ${(picks[j].probs[picks[j].chosen] * n).toFixed(1)}× more likely than uniform. That is what stops two centres landing in the same blob.`,
              phase: "seed",
              focus: [picks[j].chosen],
              state: snap({
                restart: r,
                centroids: centroids.slice(0, j + 1).map((c) => c.slice()),
                seedProbs: picks[j].probs ? picks[j].probs.slice() : null,
                phase2: "seeding"
              })
            };
          }
        } else {
          yield {
            label: `Restart ${r + 1}: ${params.init === "adversarial" ? `all ${k} centroids seeded inside a single blob — a deliberately terrible start, to show what a local optimum looks like` : `${k} centroids seeded at ${k} random data points`}.`,
            phase: "seed",
            state: snap({ restart: r, centroids: centroids.map((c) => c.slice()), phase2: "seeding" })
          };
        }

        let labels = new Array(n).fill(-1);
        let iter = 0, converged = false;

        while (iter < 25 && !converged) {
          iter++;
          // ---- assign ----
          const newLabels = new Array(n);
          let inertia = 0;
          let changed = 0;
          for (let i = 0; i < n; i++) {
            let bj = 0, bd = Infinity;
            for (let j = 0; j < k; j++) {
              const dd = d2(pts[i], centroids[j]);
              if (dd < bd) { bd = dd; bj = j; }
            }
            newLabels[i] = bj;
            inertia += bd;
            if (labels[i] !== bj) changed++;
          }
          labels = newLabels;
          const sizes = new Array(k).fill(0);
          for (const l of labels) sizes[l]++;
          history.push(inertia);

          yield {
            label: `Restart ${r + 1}, iteration ${iter} — ASSIGN: every point takes its nearest centroid (${changed} point${changed === 1 ? "" : "s"} changed cluster). Inertia J = ${inertia.toFixed(3)}. Cluster sizes [${sizes.join(", ")}]. This step is the exact minimiser of J over labels with the centroids held fixed, so J can only go down.`,
            phase: "assign",
            state: snap({
              restart: r, centroids: centroids.map((c) => c.slice()), labels: labels.slice(),
              inertia, iter, sizes, history: history.slice(), phase2: "assign"
            })
          };

          // ---- update ----
          const prev = centroids.map((c) => c.slice());
          const sums = [];
          for (let j = 0; j < k; j++) sums.push([0, 0, 0]);
          for (let i = 0; i < n; i++) {
            const j = labels[i];
            sums[j][0] += pts[i].x; sums[j][1] += pts[i].y; sums[j][2]++;
          }
          let empties = 0;
          const newC = [];
          for (let j = 0; j < k; j++) {
            if (sums[j][2] === 0) {
              empties++;
              // re-seed at the point furthest from its own centroid
              let worst = 0, wd = -1;
              for (let i = 0; i < n; i++) {
                const dd = d2(pts[i], centroids[labels[i]]);
                if (dd > wd) { wd = dd; worst = i; }
              }
              newC.push([pts[worst].x, pts[worst].y]);
            } else {
              newC.push([sums[j][0] / sums[j][2], sums[j][1] / sums[j][2]]);
            }
          }
          let moved = 0;
          for (let j = 0; j < k; j++) moved += Math.hypot(newC[j][0] - prev[j][0], newC[j][1] - prev[j][1]);
          centroids = newC;

          let post = 0;
          for (let i = 0; i < n; i++) post += d2(pts[i], centroids[labels[i]]);

          converged = moved < 1e-6 || changed === 0;

          yield {
            label: `Restart ${r + 1}, iteration ${iter} — UPDATE: each centroid moves to the mean of its members (total movement ${moved.toFixed(4)}). Inertia ${history[history.length - 1].toFixed(3)} → ${post.toFixed(3)} without touching a single label — the mean is the point that minimises squared distance to a set.` +
              (empties ? ` ${empties} empty cluster re-seeded at the worst-fit point (otherwise: divide by zero → NaN).` : "") +
              (converged ? " No point changed cluster, so the next assignment step would be identical: converged." : ""),
            phase: "update",
            state: snap({
              restart: r, centroids: centroids.map((c) => c.slice()), prev: prev.map((c) => c.slice()),
              labels: labels.slice(), inertia: post, iter, moved,
              sizes: sizes.slice(), history: history.slice(), phase2: "update"
            })
          };
        }

        let finalInertia = 0;
        for (let i = 0; i < n; i++) finalInertia += d2(pts[i], centroids[labels[i]]);
        results.push({ restart: r + 1, inertia: +finalInertia.toFixed(4), iters: iter });
        const finalSizes = (function () { const s = new Array(k).fill(0); for (const l of labels) s[l]++; return s; })();
        restartStates.push({
          restart: r + 1,
          centroids: centroids.map((c) => c.slice()),
          labels: labels.slice(),
          inertia: finalInertia,
          iter,
          history: history.slice(),
          sizes: finalSizes.slice()
        });

        yield {
          label: `Restart ${r + 1} converged after ${iter} iteration${iter === 1 ? "" : "s"} with inertia ${finalInertia.toFixed(3)}. ` +
            (results.length > 1
              ? `Previous restarts: ${results.slice(0, -1).map((x) => x.inertia.toFixed(3)).join(", ")} — same algorithm, same data, different answer. That is the local-minimum problem, and running n_init restarts and keeping the lowest inertia is the standard defence.`
              : "Every step decreased J and there are finitely many assignments, so termination was guaranteed — but only to a local minimum."),
          phase: "converged",
          state: snap({
            restart: r, centroids: centroids.map((c) => c.slice()), labels: labels.slice(),
            inertia: finalInertia, iter, history: history.slice(), phase2: "done",
            sizes: finalSizes.slice()
          })
        };
      }

      const best = results.reduce((a, b) => (a.inertia <= b.inertia ? a : b));
      const worst = results.reduce((a, b) => (a.inertia >= b.inertia ? a : b));
      // Carry the WINNING restart's full state into the closing frame — assignments,
      // centroids, inertia history and cluster sizes — so it reads as a conclusion
      // instead of falling through draw()'s empty-state branches.
      const bestState = restartStates.filter((rs) => rs.restart === best.restart)[0];
      yield {
        label: `All ${R} restart${R === 1 ? "" : "s"} done. Best inertia ${best.inertia.toFixed(3)} (restart ${best.restart}), worst ${worst.inertia.toFixed(3)} — a ${(100 * (worst.inertia - best.inertia) / Math.max(1e-9, best.inertia)).toFixed(1)}% spread from initialisation alone. sklearn's default n_init=10 exists precisely for this; k-means++ shrinks the spread but does not eliminate it.`,
        phase: "done",
        state: snap({
          restart: best.restart - 1, results: results.slice(), phase2: "final",
          centroids: bestState.centroids.map((c) => c.slice()),
          labels: bestState.labels.slice(),
          inertia: bestState.inertia,
          iter: bestState.iter,
          sizes: bestState.sizes.slice(),
          history: bestState.history.slice()
        })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pal = [C.viz1, C.viz2, C.viz3, C.viz4, C.viz5, C.viz7];
      const padL = 40, padR = 180, padT = 30, padB = 38;
      const pw = W - padL - padR, ph = H - padT - padB;
      const M = 2.6;
      const AX = (x) => padL + ((x + M) / (2 * M)) * pw;
      const AY = (y) => padT + ph - ((y + M) / (2 * M)) * ph;

      // ---- grid ------------------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -2; t <= 2; t++) {
        const X = AX(t), Y = AY(t);
        ctx.beginPath(); ctx.moveTo(X, padT); ctx.lineTo(X, padT + ph); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(padL, Y); ctx.lineTo(padL + pw, Y); ctx.stroke();
        ctx.textAlign = "center"; ctx.fillText(String(t), X, padT + ph + 14);
        ctx.textAlign = "right"; ctx.fillText(String(t), padL - 5, Y + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.2; ctx.strokeRect(padL, padT, pw, ph);

      const shape = (X, Y, s, idx) => {
        ctx.beginPath();
        if (idx % 6 === 0) ctx.arc(X, Y, s, 0, Math.PI * 2);
        else if (idx % 6 === 1) { ctx.moveTo(X, Y - s); ctx.lineTo(X + s, Y + s * 0.8); ctx.lineTo(X - s, Y + s * 0.8); ctx.closePath(); }
        else if (idx % 6 === 2) ctx.rect(X - s * 0.85, Y - s * 0.85, s * 1.7, s * 1.7);
        else if (idx % 6 === 3) { ctx.moveTo(X, Y - s); ctx.lineTo(X + s, Y); ctx.lineTo(X, Y + s); ctx.lineTo(X - s, Y); ctx.closePath(); }
        else if (idx % 6 === 4) { ctx.moveTo(X, Y + s); ctx.lineTo(X + s, Y - s * 0.8); ctx.lineTo(X - s, Y - s * 0.8); ctx.closePath(); }
        else { ctx.rect(X - s, Y - s * 0.6, s * 2, s * 1.2); }
        ctx.fill();
      };

      // ---- points ----------------------------------------------------------
      for (let i = 0; i < S.pts.length; i++) {
        const p = S.pts[i];
        const l = S.labels[i];
        const X = AX(p.x), Y = AY(p.y);
        if (l < 0) {
          if (S.seedProbs) {
            const pr = S.seedProbs[i] || 0;
            const mx = Math.max.apply(null, S.seedProbs);
            ctx.globalAlpha = 0.25 + 0.75 * Math.sqrt(pr / Math.max(1e-12, mx));
            ctx.fillStyle = C.viz4;
            ctx.beginPath(); ctx.arc(X, Y, 3.4, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha = 1;
          } else {
            ctx.fillStyle = C.muted;
            ctx.beginPath(); ctx.arc(X, Y, 3, 0, Math.PI * 2); ctx.fill();
          }
        } else {
          ctx.fillStyle = pal[l % pal.length];
          shape(X, Y, 3.6, l);
        }
      }

      // ---- centroid movement arrows ---------------------------------------
      if (S.prev) {
        for (let j = 0; j < S.centroids.length && j < S.prev.length; j++) {
          const x0 = AX(S.prev[j][0]), y0 = AY(S.prev[j][1]);
          const x1 = AX(S.centroids[j][0]), y1 = AY(S.centroids[j][1]);
          ctx.strokeStyle = C.text2; ctx.lineWidth = 1.4;
          ctx.setLineDash([3, 3]);
          ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          ctx.setLineDash([]);
          ctx.strokeStyle = C.muted; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.arc(x0, y0, 4, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // ---- centroids -------------------------------------------------------
      for (let j = 0; j < S.centroids.length; j++) {
        const X = AX(S.centroids[j][0]), Y = AY(S.centroids[j][1]);
        ctx.fillStyle = pal[j % pal.length];
        ctx.beginPath(); ctx.arc(X, Y, 9, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.surface; ctx.lineWidth = 2.4;
        ctx.beginPath(); ctx.arc(X, Y, 9, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = C.text; ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(X - 4, Y); ctx.lineTo(X + 4, Y);
        ctx.moveTo(X, Y - 4); ctx.lineTo(X, Y + 4);
        ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(`μ${j + 1}`, X, Y - 13);
      }

      // ---- header ----------------------------------------------------------
      ctx.textAlign = "left"; ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text2;
      ctx.fillText(`${S.init} init · restart ${S.restart + 1}/${S.restarts} · ${S.phase2 || ""}`, padL, 20);

      // ---- panel -----------------------------------------------------------
      const px = W - padR + 14;
      let ty = padT + 6;
      const row = (a, b, col) => {
        ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.muted; ctx.textAlign = "left";
        ctx.fillText(a, px, ty);
        ctx.font = `12px ${env.font.mono}`; ctx.fillStyle = col || C.text; ctx.textAlign = "right";
        ctx.fillText(b, W - 14, ty); ty += 19;
      };
      row("k", String(S.k), C.viz4);
      row("iteration", String(S.iter));
      row("inertia J", S.inertia ? S.inertia.toFixed(3) : "—", C.viz3);
      row("Σ centroid move", S.moved ? S.moved.toFixed(4) : "—");

      ty += 8;
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("cluster sizes", px, ty); ty += 6;
      const maxSize = Math.max(1, Math.max.apply(null, S.sizes.length ? S.sizes : [1]));
      for (let j = 0; j < S.sizes.length; j++) {
        ctx.fillStyle = pal[j % pal.length];
        ctx.fillRect(px, ty, 9, 9);
        ctx.fillStyle = C.surface2;
        ctx.fillRect(px + 14, ty, W - 46 - px, 9);
        ctx.fillStyle = pal[j % pal.length];
        ctx.fillRect(px + 14, ty, Math.max(1, (W - 46 - px) * (S.sizes[j] / maxSize)), 9);
        ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "right";
        ctx.fillText(String(S.sizes[j]), W - 14, ty + 8);
        ty += 14;
      }

      // inertia curve
      ty += 14;
      const gw = W - 14 - px, gh = 62;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1; ctx.strokeRect(px, ty, gw, gh);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("inertia per iteration", px, ty - 5);
      if (S.history.length > 1) {
        const hi = Math.max.apply(null, S.history), lo = Math.min.apply(null, S.history);
        ctx.strokeStyle = C.viz3; ctx.lineWidth = 1.8;
        ctx.beginPath();
        for (let i = 0; i < S.history.length; i++) {
          const X = px + (i / Math.max(1, S.history.length - 1)) * gw;
          const Y = ty + gh - ((S.history[i] - lo) / Math.max(1e-9, hi - lo)) * (gh - 6) - 3;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(hi.toFixed(1), px + 2, ty + 10);
        ctx.textAlign = "right"; ctx.fillText(lo.toFixed(1), px + gw - 2, ty + gh - 3);
      }
      ty += gh + 20;

      // restart results
      if (S.results.length) {
        ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`;
        ctx.fillText("final inertia per restart", px, ty); ty += 14;
        const bestV = Math.min.apply(null, S.results.map((r) => r.inertia));
        for (const r of S.results) {
          ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
          ctx.fillText(`#${r.restart} (${r.iters} it)`, px, ty);
          ctx.fillStyle = r.inertia === bestV ? C.ok : C.warn; ctx.textAlign = "right";
          ctx.fillText(r.inertia.toFixed(3), W - 14, ty);
          ty += 14;
        }
      }
    }
  },

  drill: {
    cards: [
      { q: "State Lloyd's algorithm and its objective.", a: "Minimise inertia `J = Σ‖xᵢ − μ_{c(i)}‖²` by alternating: assign each point to its nearest centroid; move each centroid to the mean of its members. Repeat until assignments stop changing.", tags: ["algorithm"] },
      { q: "Why does k-means always converge, and to what?", a: "Each step exactly minimises J in one variable given the other, so J is non-increasing; there are finitely many assignments, so it halts. It halts at a local minimum — global optimisation is NP-hard.", tags: ["theory"] },
      { q: "Describe k-means++.", a: "First centre uniform at random; each subsequent centre sampled with probability ∝ D(x)², the squared distance to the nearest chosen centre. Gives an O(log k)-competitive expected solution before Lloyd runs.", tags: ["init"] },
      { q: "How do you choose k?", a: "Not by inertia (monotone decreasing). Use the elbow, silhouette score, gap statistic, BIC via a GMM, or a downstream task metric / domain constraint.", tags: ["model-selection"] },
      { q: "Give three situations where k-means fails.", a: "Non-spherical or elongated clusters (Voronoi boundaries can't express them); very different cluster sizes/densities; unscaled features where one dimension dominates the distance. Also outliers, since the mean is not robust.", tags: ["limits"] },
      { q: "Relationship between k-means and EM for GMMs?", a: "k-means is the hard-assignment limit of EM with spherical, equal, vanishing covariance: responsibilities become 0/1, E-step → nearest centroid, M-step → mean. GMM adds soft assignment and full covariances.", tags: ["gmm"] },
      { q: "What happens if a cluster becomes empty?", a: "The mean is 0/0 → NaN. Standard fix: re-seed that centroid at the point furthest from its current centroid, or split the highest-inertia cluster.", tags: ["implementation"] },
      { q: "Define the silhouette score.", a: "`s(i) = (b − a)/max(a,b)` where a = mean intra-cluster distance and b = mean distance to the nearest other cluster. +1 = well clustered, 0 = on a boundary, negative = probably misassigned.", tags: ["evaluation"] }
    ],
    sixtySecond: [
      "Explain k-means: the objective, the two steps, why it converges, and why it needs k-means++ and restarts.",
      "Explain when k-means is the wrong clustering algorithm and what you would use instead."
    ]
  }
};
