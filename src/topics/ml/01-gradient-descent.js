export default {
  id: "gradient-descent",
  track: "ml",
  title: "Gradient Descent",
  difficulty: 1,
  minutes: 14,
  tags: ["optimization", "calculus", "training", "learning-rate"],

  explainer: [
    { type: "p", text: "Gradient descent is the whole of model training compressed into one line: `w ← w − η ∇L(w)`. You are standing on a loss surface in weight space, you compute the direction of steepest *increase*, and you step the other way. Everything else — momentum, Adam, schedulers — is a patch on the two weaknesses of that line." },
    { type: "h3", text: "Why the negative gradient is the right direction" },
    { type: "p", text: "For a small step `d`, the first-order Taylor expansion says `L(w + d) ≈ L(w) + ∇L·d`. Among all `d` of a fixed length, the one that minimises `∇L·d` is `d = −∇L/‖∇L‖`. So the negative gradient is the *locally* steepest descent direction — locally is the important word: it is the best direction for an infinitesimal step, not for the step you actually take." },
    { type: "h3", text: "The learning rate is a stability question, not a taste question" },
    { type: "p", text: "On a quadratic loss `L(w) = ½ wᵀHw`, gradient descent along an eigenvector of `H` with eigenvalue `λ` multiplies the error by `(1 − ηλ)` every step. That converges only when `|1 − ηλ| < 1`, i.e. `η < 2/λ`. Since this must hold for *every* eigenvalue, the whole run is capped by the largest one: **η < 2/λ_max**. Meanwhile the slowest direction shrinks at rate `(1 − ηλ_min)`, so the number of steps scales with the condition number `κ = λ_max/λ_min`. An ill-conditioned surface is a ravine, and plain GD zig-zags across it." },
    { type: "callout", tone: "tip", text: "The one-liner answer to 'how do I pick a learning rate': run an LR-range test — increase η exponentially for a few hundred steps, plot loss vs η, and take roughly one order of magnitude below where the loss explodes." },
    { type: "h3", text: "Batch, stochastic, mini-batch" },
    { type: "list", items: [
      "**Batch GD** — gradient over all `n` examples. Exact direction, `O(n)` per step, and the memory bill is the reason nobody does it at scale.",
      "**SGD** — one example per step. Unbiased but high-variance estimate of the gradient; the noise is a feature (it escapes shallow saddles and sharp minima) and a bug (it never fully settles, hence LR decay).",
      "**Mini-batch** — `B` examples. Variance falls like `1/B`, hardware likes it, and `B` is effectively a second learning-rate knob: doubling `B` and doubling `η` (linear scaling rule) leaves the SGD dynamics roughly unchanged, up to a limit."
    ]},
    { type: "callout", tone: "pitfall", text: "Un-normalised features are the most common cause of a hopeless learning rate. A feature with scale 1000 and one with scale 0.001 give `H` a condition number of ~10⁹; no single η works for both. Standardise first, then tune η." },
    { type: "h3", text: "Failure modes to name in an interview" },
    { type: "list", items: [
      "**Divergence** — `η > 2/λ_max`: loss increases geometrically, then NaN. The visualizer shows this directly.",
      "**Crawling** — `η ≪ 2/λ_max`: the loss decreases but you run out of compute before you run out of surface.",
      "**Zig-zag** — high condition number: steps bounce across the ravine walls while barely advancing along the floor. Momentum is the fix.",
      "**Plateaus and saddles** — in high dimensions saddle points, not local minima, are the dominant stationary points; the gradient is tiny in every direction so progress stalls. Noise and adaptive scaling get you off them."
    ]},
    { type: "code", lang: "python", code: "# the entire algorithm\nfor step in range(n_steps):\n    g = grad(loss, w, batch)\n    w -= lr * g" }
  ],

  complexity: {
    rows: [
      { operation: "One batch GD step", time: "O(n · d)", space: "O(d)", note: "n examples, d parameters" },
      { operation: "One mini-batch step", time: "O(B · d)", space: "O(d + B·d)", note: "B = batch size; activations dominate memory in nets" },
      { operation: "Steps to ε-accuracy (strongly convex)", time: "O(κ · log 1/ε)", space: "—", note: "κ = λ_max/λ_min; momentum improves to O(√κ · log 1/ε)" },
      { operation: "Newton's method step", time: "O(n·d² + d³)", space: "O(d²)", note: "why nobody inverts the Hessian for d in the millions" }
    ]
  },

  interview: {
    whyAsked: "It is the single concept that every other training question rests on. The interviewer wants to see whether you understand descent as a *dynamical system* — that the learning rate has a hard stability threshold set by the curvature — rather than as a hyperparameter you tune by vibes.",
    followUps: [
      { q: "How large can the learning rate be before gradient descent diverges?", a: "On a quadratic with Hessian `H`, the error along an eigenvector with eigenvalue `λ` is multiplied by `(1 − ηλ)` each step, so you need `|1 − ηλ| < 1` for all λ, i.e. `η < 2/λ_max`. The optimum for a quadratic is `η = 2/(λ_min + λ_max)`, which gives a convergence rate of `(κ−1)/(κ+1)`. In practice λ_max is unknown and changes during training, which is why warmup and schedulers exist." },
      { q: "Why does gradient descent zig-zag, and what fixes it?", a: "Because the negative gradient points down the steepest *local* slope, not at the minimum. In an elongated valley the steep cross-valley direction dominates the gradient, so the step is mostly sideways and only slightly along the valley floor. Momentum fixes it by averaging successive gradients: the oscillating cross-valley components cancel while the consistent along-valley component accumulates. Preconditioning (feature scaling, batch norm, Adam's per-coordinate scaling) fixes it by reducing the condition number itself." },
      { q: "Batch vs stochastic vs mini-batch — what actually changes?", a: "Only the variance of the gradient estimate and the cost per step. All three have the same expected direction (mini-batch and SGD are unbiased estimators of the full gradient). SGD's variance means it never converges to a point — it converges to a noise ball whose radius is proportional to `η`, which is why you decay the learning rate. Mini-batching cuts the variance by `1/B` and maps onto vectorised hardware, so it is a pure win up to the point where you exhaust parallelism." },
      { q: "If the loss is non-convex, why does this work at all?", a: "Empirically, in over-parameterised networks most local minima are close to each other in loss value, and the dominant stationary points in high dimensions are saddles rather than bad minima (a random critical point needs all d eigenvalues negative to be a local max, which is exponentially unlikely). SGD noise plus adaptive methods escape saddles. We aren't finding the global optimum; we're finding a wide, low-loss basin that generalises." },
      { q: "What does the gradient look like when the loss is not differentiable, e.g. ReLU or L1?", a: "Use a subgradient: any vector `g` with `L(w') ≥ L(w) + g·(w'−w)`. For ReLU at 0 frameworks just pick 0 (or 1); for `|w|` they pick `sign(w)` and 0 at the origin. Subgradient descent converges but at the slower `O(1/√t)` rate and does not exactly hit zero for L1 — proximal methods (soft-thresholding) do, which is why real sparse solvers use them." },
      { q: "Why not use Newton's method, which converges quadratically?", a: "It needs the `d×d` Hessian and its inverse: `O(d²)` memory and `O(d³)` per step. With `d` in the billions that is impossible, and the Hessian is indefinite in non-convex problems so a raw Newton step can move *uphill*. Quasi-Newton (L-BFGS) and diagonal approximations (Adam, Shampoo, K-FAC) are the practical compromises." }
    ]
  },

  code: [
    { lang: "python", label: "Mini-batch gradient descent", code: "import numpy as np\n\ndef sgd(X, y, lr=0.1, epochs=50, batch=32, seed=0):\n    rng = np.random.default_rng(seed)\n    n, d = X.shape\n    w = np.zeros(d)\n    for _ in range(epochs):\n        idx = rng.permutation(n)\n        for s in range(0, n, batch):\n            b = idx[s:s + batch]\n            resid = X[b] @ w - y[b]              # (B,)\n            g = X[b].T @ resid / len(b)          # d/dw of  1/2B * ||Xw - y||^2\n            w -= lr * g\n    return w" },
    { lang: "python", label: "Learning-rate range test", code: "def lr_range_test(step_fn, lo=1e-6, hi=1.0, n=200):\n    \"\"\"Exponentially ramp the LR; the loss curve's elbow is your ceiling.\"\"\"\n    lrs, losses = [], []\n    mult = (hi / lo) ** (1 / n)\n    lr = lo\n    for _ in range(n):\n        loss = step_fn(lr)                       # one training step at this lr\n        lrs.append(lr); losses.append(loss)\n        if loss > 4 * min(losses):               # blown up: stop\n            break\n        lr *= mult\n    best = lrs[int(np.argmin(losses))]\n    return best / 10, lrs, losses               # ~1 order of magnitude below the min" },
    { lang: "python", label: "Gradient check (always do this)", code: "def grad_check(f, w, eps=1e-5):\n    \"\"\"Central differences vs analytic gradient. Relative error < 1e-7 = good.\"\"\"\n    analytic = f.grad(w)\n    numeric = np.zeros_like(w)\n    for i in range(w.size):\n        p = w.copy(); p[i] += eps\n        m = w.copy(); m[i] -= eps\n        numeric[i] = (f(p) - f(m)) / (2 * eps)\n    num = np.linalg.norm(analytic - numeric)\n    den = np.linalg.norm(analytic) + np.linalg.norm(numeric) + 1e-12\n    return num / den" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 260 },

    params: [
      { key: "lr", label: "Learning rate ×0.01", type: "int", min: 1, max: 60, default: 12 },
      { key: "kappa", label: "Condition number κ", type: "int", min: 1, max: 24, default: 8 },
      { key: "mode", label: "Start", type: "enum", options: ["corner", "ridge", "random"], default: "corner" },
      { key: "seed", label: "Reseed", type: "seed" }
    ],

    frames: function* (params, rng) {
      const lr = params.lr / 100;
      const A = 1;                       // curvature along the valley floor
      const B = Math.max(1, params.kappa); // curvature across the valley
      const th = 0.42;                   // rotate the bowl so gradients are not axis-aligned
      const ct = Math.cos(th), st = Math.sin(th);
      const critical = 2 / B;            // divergence threshold

      // loss in world coords, minimum at the origin
      const uv = (x, y) => [ct * x + st * y, -st * x + ct * y];
      const loss = (x, y) => { const [u, v] = uv(x, y); return 0.5 * (A * u * u + B * v * v); };
      const grad = (x, y) => {
        const [u, v] = uv(x, y);
        const gu = A * u, gv = B * v;
        return [gu * ct - gv * st, gu * st + gv * ct];
      };

      let x, y;
      if (params.mode === "corner") { x = -2.35; y = 1.45; }
      else if (params.mode === "ridge") { const s = 1.3; x = -st * s; y = ct * s; } // straight up the steep wall
      else { x = (rng() * 2 - 1) * 2.4; y = (rng() * 2 - 1) * 1.6; }

      const path = [[x, y]];
      const hist = [loss(x, y)];
      let g = grad(x, y);
      let gn = Math.hypot(g[0], g[1]);

      const snap = (extra) => Object.assign({
        x, y, gx: g[0], gy: g[1], gnorm: gn,
        loss: hist[hist.length - 1],
        path: path.map((p) => p.slice()),
        hist: hist.slice(),
        lr, A, B, th, critical, step: path.length - 1,
        status: "running"
      }, extra || {});

      yield {
        label: `Start at w = (${x.toFixed(2)}, ${y.toFixed(2)}), loss = ${hist[0].toFixed(3)}. The bowl is ${B}× steeper across the valley than along it, so κ = ${B} and gradient descent is stable only while η < 2/κ = ${critical.toFixed(3)}. You chose η = ${lr.toFixed(2)}.`,
        phase: "init",
        state: snap()
      };

      const maxSteps = 200;
      let status = "running";

      for (let i = 0; i < maxSteps; i++) {
        const prevLoss = hist[hist.length - 1];
        const [gx, gy] = grad(x, y);
        const nx = x - lr * gx, ny = y - lr * gy;

        if (!isFinite(nx) || !isFinite(ny) || Math.abs(nx) > 1e6 || Math.abs(ny) > 1e6) {
          status = "diverged";
          yield {
            label: `η = ${lr.toFixed(2)} > 2/κ = ${critical.toFixed(3)}: the step overshoots the valley floor and lands further out than it started, so the error is multiplied by |1 − ηκ| = ${Math.abs(1 - lr * B).toFixed(2)} > 1 every step. The iterates have blown past ±10⁶ — this is what a NaN loss looks like one frame before the NaN.`,
            phase: "diverged",
            state: snap({ status: "diverged" })
          };
          return;
        }

        x = nx; y = ny;
        const L = loss(x, y);
        path.push([x, y]);
        hist.push(L);
        g = grad(x, y);
        gn = Math.hypot(g[0], g[1]);

        const drop = prevLoss - L;
        const stepLen = lr * Math.hypot(gx, gy);
        const alongValley = Math.abs(-lr * gx * ct - lr * gy * st);
        const acrossValley = Math.abs(lr * gx * st - lr * gy * ct);

        let label;
        if (L > prevLoss) {
          label = `Step ${i + 1}: loss ${prevLoss.toFixed(3)} → ${L.toFixed(3)} — it went UP. The step of length ${stepLen.toFixed(2)} crossed the valley and climbed the far wall; |1 − ηκ| = ${Math.abs(1 - lr * B).toFixed(2)}.`;
        } else if (acrossValley > 1.6 * alongValley) {
          label = `Step ${i + 1}: loss ${prevLoss.toFixed(3)} → ${L.toFixed(3)} (−${drop.toFixed(3)}). The gradient is dominated by the steep direction, so ${(100 * acrossValley / (acrossValley + alongValley + 1e-12)).toFixed(0)}% of this step goes *across* the valley and only ${(100 * alongValley / (acrossValley + alongValley + 1e-12)).toFixed(0)}% toward the minimum. That is the zig-zag.`;
        } else {
          label = `Step ${i + 1}: loss ${prevLoss.toFixed(3)} → ${L.toFixed(3)} (−${drop.toFixed(3)}); ‖∇L‖ = ${gn.toFixed(3)}. Progress is now mostly along the valley floor, shrinking at rate |1 − η·1| = ${Math.abs(1 - lr * A).toFixed(3)} per step.`;
        }

        if (gn < 1e-3) {
          status = "converged";
          yield {
            label: `Converged after ${i + 1} steps: ‖∇L‖ = ${gn.toFixed(5)} < 1e-3, loss = ${L.toExponential(2)}. The flat direction needed ~${Math.max(1, Math.ceil(Math.log(1e-3) / Math.log(Math.max(1e-9, Math.abs(1 - lr * A)))))} steps to decay on its own — that factor is the condition number showing up as wall-clock time.`,
            phase: "done",
            state: snap({ status: "converged" })
          };
          return;
        }

        yield { label, phase: L > prevLoss ? "overshoot" : "descend", state: snap() };
      }

      yield {
        label: `Stopped after ${maxSteps} steps with ‖∇L‖ = ${gn.toFixed(4)} and loss = ${hist[hist.length - 1].toExponential(2)}. Not diverged, just slow — η = ${lr.toFixed(2)} is far below the stability limit ${critical.toFixed(3)}, so each step barely moves.`,
        phase: "stalled",
        state: snap({ status: "stalled" })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      // ---- layout ----------------------------------------------------------
      const padL = 44, padR = 200, padT = 34, padB = 44;
      const pw = W - padL - padR, ph = H - padT - padB;
      const range = 3.2;                                   // world half-width
      const s = Math.min(pw / (2 * range), ph / (2 * range * 0.72));
      const ox = padL + pw / 2, oy = padT + ph / 2;
      const PX = (x) => ox + x * s;
      const PY = (y) => oy - y * s;

      // ---- grid + axes -----------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -3; t <= 3; t++) {
        const gx = PX(t);
        if (gx > padL && gx < padL + pw) {
          ctx.beginPath(); ctx.moveTo(gx, padT); ctx.lineTo(gx, padT + ph); ctx.stroke();
          ctx.textAlign = "center";
          ctx.fillText(t.toFixed(0), gx, padT + ph + 14);
        }
        const gy = PY(t);
        if (gy > padT && gy < padT + ph) {
          ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(padL + pw, gy); ctx.stroke();
          ctx.textAlign = "right";
          ctx.fillText(t.toFixed(0), padL - 6, gy + 3);
        }
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(padL, PY(0)); ctx.lineTo(padL + pw, PY(0));
      ctx.moveTo(PX(0), padT); ctx.lineTo(PX(0), padT + ph);
      ctx.stroke();
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.textAlign = "right"; ctx.fillText("w₁", padL + pw - 2, PY(0) - 6);
      ctx.textAlign = "left"; ctx.fillText("w₂", PX(0) + 6, padT + 10);

      // ---- contours (exact ellipses of the quadratic) ----------------------
      const levels = [0.05, 0.2, 0.5, 1, 2, 4, 8, 14];
      ctx.lineWidth = 1;
      for (let i = 0; i < levels.length; i++) {
        const c = levels[i];
        const ru = Math.sqrt(2 * c / S.A) * s;
        const rv = Math.sqrt(2 * c / S.B) * s;
        ctx.strokeStyle = C.grid;
        ctx.globalAlpha = 0.5 + 0.5 * (1 - i / levels.length);
        ctx.beginPath();
        ctx.ellipse(PX(0), PY(0), ru, rv, -S.th, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // minimum marker
      ctx.strokeStyle = C.viz6; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(PX(0) - 6, PY(0)); ctx.lineTo(PX(0) + 6, PY(0));
      ctx.moveTo(PX(0), PY(0) - 6); ctx.lineTo(PX(0), PY(0) + 6);
      ctx.stroke();

      // ---- path ------------------------------------------------------------
      const clampX = (v) => Math.max(padL - 40, Math.min(padL + pw + 40, v));
      const clampY = (v) => Math.max(padT - 40, Math.min(padT + ph + 40, v));
      if (S.path.length > 1) {
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 1.6; ctx.globalAlpha = 0.85;
        ctx.beginPath();
        for (let i = 0; i < S.path.length; i++) {
          const px = clampX(PX(S.path[i][0])), py = clampY(PY(S.path[i][1]));
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = C.viz1;
        for (let i = 0; i < S.path.length - 1; i++) {
          ctx.beginPath();
          ctx.arc(clampX(PX(S.path[i][0])), clampY(PY(S.path[i][1])), 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ---- negative-gradient arrow ----------------------------------------
      const bx = clampX(PX(S.x)), by = clampY(PY(S.y));
      if (S.status === "running" && S.gnorm > 1e-6) {
        const L = Math.min(80, S.gnorm * s * 0.35);
        const ux = -S.gx / S.gnorm, uy = -S.gy / S.gnorm;
        const ex = bx + ux * L, ey = by - uy * L;
        ctx.strokeStyle = C.viz2; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
        const a = Math.atan2(-uy, ux);
        ctx.fillStyle = C.viz2;
        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(ex - 7 * Math.cos(a - 0.4), ey - 7 * Math.sin(a - 0.4));
        ctx.lineTo(ex - 7 * Math.cos(a + 0.4), ey - 7 * Math.sin(a + 0.4));
        ctx.closePath(); ctx.fill();
        ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
        ctx.fillText("−∇L", ex + 5, ey - 3);
      }

      // ---- the ball --------------------------------------------------------
      const ballColor = S.status === "diverged" ? C.danger : S.status === "converged" ? C.viz6 : C.viz1;
      ctx.fillStyle = ballColor;
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = C.surface; ctx.lineWidth = 1.5; ctx.stroke();

      // ---- side panel ------------------------------------------------------
      const px0 = W - padR + 16;
      let ty = padT + 8;
      const line = (k, v, col) => {
        ctx.font = `11px ${env.font.base}`; ctx.fillStyle = C.muted; ctx.textAlign = "left";
        ctx.fillText(k, px0, ty);
        ctx.font = `12px ${env.font.mono}`; ctx.fillStyle = col || C.text;
        ctx.textAlign = "right"; ctx.fillText(v, W - 16, ty);
        ty += 19;
      };
      ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text; ctx.textAlign = "left";
      ctx.fillText("L(w) = ½(u² + κv²)", px0, ty); ty += 22;
      line("step", String(S.step));
      line("loss", S.loss < 1e-3 ? S.loss.toExponential(2) : S.loss.toFixed(4));
      line("‖∇L‖", S.gnorm < 1e-3 ? S.gnorm.toExponential(2) : S.gnorm.toFixed(4));
      line("w₁", S.x.toFixed(4));
      line("w₂", S.y.toFixed(4));
      ty += 6;
      line("η", S.lr.toFixed(2), C.viz4);
      line("κ", String(S.B), C.viz4);
      line("2/κ limit", S.critical.toFixed(3), S.lr >= S.critical ? C.danger : C.ok);
      line("|1 − ηκ|", Math.abs(1 - S.lr * S.B).toFixed(3), Math.abs(1 - S.lr * S.B) >= 1 ? C.danger : C.ok);

      // ---- loss sparkline --------------------------------------------------
      const gx0 = px0, gw = W - 16 - px0, gh = 54;
      const gy0 = padT + ph - gh;
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.strokeRect(gx0, gy0, gw, gh);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("log loss vs step", gx0, gy0 - 6);
      const hs = S.hist;
      if (hs.length > 1) {
        const logs = hs.map((v) => Math.log10(Math.max(1e-12, Math.min(1e12, v))));
        let lo = Math.min.apply(null, logs), hi = Math.max.apply(null, logs);
        if (hi - lo < 1e-6) { hi = lo + 1; }
        ctx.strokeStyle = S.status === "diverged" ? C.danger : C.viz3;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i < logs.length; i++) {
          const X = gx0 + (i / Math.max(1, logs.length - 1)) * gw;
          const Y = gy0 + gh - ((logs[i] - lo) / (hi - lo)) * gh;
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
        ctx.textAlign = "left"; ctx.fillText(`1e${hi.toFixed(0)}`, gx0 + 2, gy0 + 10);
        ctx.fillText(`1e${lo.toFixed(0)}`, gx0 + 2, gy0 + gh - 3);
      }

      // ---- status banner ---------------------------------------------------
      if (S.status !== "running") {
        const txt = S.status === "diverged" ? "DIVERGED — η above 2/κ"
          : S.status === "converged" ? "CONVERGED" : "STALLED — η too small";
        const col = S.status === "diverged" ? C.danger : S.status === "converged" ? C.ok : C.warn;
        ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
        const tw = ctx.measureText(txt).width;
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(padL, 8, tw + 16, 20, 5); ctx.fill();
        ctx.fillStyle = col; ctx.fillText(txt, padL + 8, 22);
      } else {
        ctx.font = `12px ${env.font.base}`; ctx.fillStyle = C.text2; ctx.textAlign = "left";
        ctx.fillText("contours of the loss surface — each ring is a fixed loss value", padL, 22);
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the gradient descent update and name every symbol.", a: "`w ← w − η∇L(w)`. `w` = parameters, `η` = learning rate (step size), `∇L(w)` = gradient of the loss w.r.t. the parameters, evaluated at the current `w`.", tags: ["definition"] },
      { q: "What is the exact stability bound on the learning rate for a quadratic loss?", a: "`η < 2/λ_max`, where λ_max is the largest Hessian eigenvalue. Error along an eigendirection is multiplied by `(1 − ηλ)` each step, so |1 − ηλ| must be < 1 for every λ.", tags: ["theory", "learning-rate"] },
      { q: "Why does gradient descent zig-zag in a ravine?", a: "The gradient is dominated by the high-curvature (cross-valley) direction, so most of each step is spent bouncing between the walls rather than moving along the floor. Steps needed scales with the condition number κ = λ_max/λ_min.", tags: ["failure-mode"] },
      { q: "Batch vs mini-batch vs stochastic: what differs?", a: "Only the variance of the gradient estimate and cost per step — all are unbiased for the full gradient. SGD variance ∝ 1/B, so it converges to a noise ball of radius ∝ η rather than a point; hence LR decay.", tags: ["sgd"] },
      { q: "Why is feature scaling a learning-rate issue?", a: "Feature scales set the Hessian eigenvalues. Wildly different scales give a huge condition number, so the η that is stable for the steep direction is uselessly small for the flat one. Standardising features shrinks κ.", tags: ["preprocessing"] },
      { q: "Why don't we use Newton's method in deep learning?", a: "O(d²) memory and O(d³) per step for the Hessian inverse, and in non-convex problems the Hessian is indefinite so the Newton step can move uphill. Diagonal/quasi-Newton approximations (Adam, L-BFGS) are used instead.", tags: ["second-order"] },
      { q: "In high dimensions, what is the dominant kind of critical point?", a: "Saddle points, not local minima — a critical point needs all d Hessian eigenvalues to share a sign to be an extremum, which is exponentially unlikely. Noise and adaptive scaling get you off saddles.", tags: ["non-convex"] },
      { q: "How do you pick a learning rate empirically?", a: "LR-range test: ramp η exponentially over a few hundred steps, plot loss vs η, and pick roughly an order of magnitude below the value where the loss starts exploding. Then add warmup + decay.", tags: ["practice"] }
    ],
    sixtySecond: [
      "Explain gradient descent, the stability condition on the learning rate, and why an ill-conditioned loss surface makes it slow.",
      "Explain the difference between batch, mini-batch, and stochastic gradient descent, and why SGD's noise matters."
    ]
  }
};
