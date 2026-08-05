export default {
  id: "gradient-descent",
  track: "ml",
  title: "Gradient Descent",
  difficulty: 1,
  minutes: 14,
  tags: ["optimization", "calculus", "training", "learning-rate"],

  explainer: [
    { type: "p", text: "Gradient descent is the method almost every machine learning model uses to learn from data, so it is worth understanding in plain terms before looking at any formulas. Picture yourself standing somewhere on a hilly landscape in thick fog — you cannot see the whole terrain, only feel the slope of the ground right under your feet. You want to reach the lowest point in the valley. A sensible strategy: feel which direction slopes downward most steeply, take a small step that way, and repeat. Eventually you settle near the bottom. That is gradient descent. In machine learning, the 'landscape' is a function called the **loss function** (people also call it the loss surface) — a formula that scores how wrong the model's current predictions are. The 'position' on that landscape is the model's current settings, called **weights** or **parameters**, usually written `w`. The 'height' at a given position is the loss, `L(w)`: a single number that is large when the model is doing badly and small when it is doing well. Gradient descent repeatedly nudges the weights in whatever direction makes that height drop fastest, until it stops improving. As a formula, one step looks like this: `w ← w − η∇L(w)`. Read it left to right as: take the current weights `w`, subtract a small multiple of a quantity called the **gradient** (`∇L(w)`, explained next), and the result is the new, hopefully-better, `w`. Momentum, Adam, learning-rate schedules — every more advanced training trick covered in later lessons is a refinement bolted onto this one idea, so it is worth being fully comfortable with it first." },
    { type: "h3", text: "What the gradient actually is" },
    { type: "p", text: "The **gradient**, written `∇L(w)`, is simply a list of numbers, one per weight. Each number in that list says two things about its weight: which direction (increase or decrease) would make the loss go *up*, and how strongly — a large number means the loss is very sensitive to that weight right now, a small number means it barely matters. Gradient descent moves each weight in the *opposite* direction to what the gradient says, which is why the update formula has a minus sign in front of it: moving opposite to 'the direction that increases loss fastest' gets you 'the direction that decreases loss fastest'." },
    { type: "h3", text: "Why the negative gradient is the right direction" },
    { type: "p", text: "This is not just intuition — a small piece of calculus called a **Taylor expansion** proves it. A Taylor expansion is a way of approximating a complicated, curvy function with a simple straight-line approximation, valid for a small enough step near your current position. For a small step `d` away from the current weights, it says `L(w + d) ≈ L(w) + ∇L·d` — read this as: the new loss is approximately the old loss, plus a correction term found by combining the gradient with the step you took. (`∇L·d` is a **dot product**: a way of multiplying two lists of numbers together, entry by entry, and adding the results into a single number.) If you ask 'among all possible steps `d` of a fixed length, which one makes that correction term as negative as possible — that is, drops the loss the most?', the answer is: step directly opposite the gradient, `d = −∇L/‖∇L‖` (dividing by `‖∇L‖`, the length of the gradient, just rescales the direction to a fixed step size). So the negative gradient is the *locally* steepest way down. The word 'locally' matters: this is only provably the best direction for a vanishingly small step, not necessarily for the actual, finite-sized step you take in practice. That gap between 'locally best' and 'actually best' is where most of gradient descent's real-world problems come from." },
    { type: "h3", text: "The learning rate is a stability question, not a taste question" },
    { type: "p", text: "The **learning rate**, written `η` (the Greek letter eta), is the 'small multiple' in the update formula — it controls how big a step you take each time. Choosing it is not a matter of taste; there is a hard mathematical limit past which gradient descent stops working at all, and that limit is set by how sharply the loss surface curves." },
    { type: "p", text: "Here is where that limit comes from. Take a simplified case: a loss shaped like a perfect bowl, `L(w) = ½wᵀHw`. `H` here is the **Hessian**, a grid of numbers that records how sharply the loss curves in every direction — for every direction you could face on the landscape, it tells you how steeply the ground curves upward that way. Every such bowl has a set of special directions called **eigenvectors**, each paired with a number called an **eigenvalue** (written `λ`), which says how steep the bowl is specifically along that direction: a big eigenvalue means it is steep and narrow there, a small eigenvalue means it is shallow and wide. Run gradient descent along one of these directions and each step multiplies the remaining error by `(1 − ηλ)`. For the error to shrink over time rather than grow, you need `|1 − ηλ| < 1`, which works out to `η < 2/λ`. Because this has to hold for *every* direction at once, the whole run is limited by the steepest one: **η must be less than 2/λ_max**, where `λ_max` is the largest eigenvalue. Meanwhile the shallowest direction only shrinks at the slower rate `(1 − ηλ_min)`, so the number of steps needed scales with the **condition number**, `κ = λ_max/λ_min` — the ratio of the steepest curvature to the shallowest. When that ratio is large, the loss surface looks like a long, narrow ravine, and plain gradient descent wastes most of its steps bouncing between the ravine's walls instead of moving along its floor." },
    { type: "callout", tone: "tip", text: "The practical, one-line answer to 'how do I pick a learning rate?': run an LR-range test. Increase `η` exponentially over a few hundred training steps, plot the loss against `η`, and pick a value about one order of magnitude (10×) below the point where the loss starts exploding." },
    { type: "h3", text: "Batch, stochastic, and mini-batch gradient descent" },
    { type: "p", text: "So far this assumes you compute the gradient using every training example you have. In practice you rarely do that, because it is expensive. There are three variants, differing only in how many examples are used to *estimate* the gradient at each step:" },
    { type: "list", items: [
      "**Batch gradient descent** — uses all `n` training examples to compute the exact gradient every step. It gives the truest direction, but costs `O(n)` work per step, and for large datasets it simply does not fit in memory — that is the whole reason nobody trains large models this way.",
      "**Stochastic gradient descent (SGD)** — uses just one randomly chosen example per step. Averaged over many steps this points in the right direction (statisticians call this property **unbiased**: correct 'on average', even though any single step's estimate is noisy), but each individual step is a noisy, high-**variance** guess — variance here meaning how much the estimate wobbles from one random sample to the next. That noise is both a feature and a bug: it can help the model escape shallow, unhelpful dips in the loss surface, but it also means the model never perfectly settles down, which is why you gradually shrink the learning rate over training (learning-rate decay).",
      "**Mini-batch gradient descent** — the practical default: use a small batch of `B` examples per step. Averaging over `B` examples cuts the noise by a factor of `1/B` compared to plain SGD, and hardware processes batches far more efficiently than single examples. Batch size `B` acts as a second knob related to the learning rate: a rule of thumb (the 'linear scaling rule') says doubling `B` and doubling `η` together leaves the training dynamics roughly unchanged, up to a point."
    ]},
    { type: "callout", tone: "pitfall", text: "The most common reason a learning rate 'just won't work' is un-normalised features — input values sitting on wildly different numeric scales (say, one feature ranges 0–1000 and another ranges 0–0.001). This gives the Hessian `H` a huge condition number (often around a billion), so no single learning rate is small enough for the steep direction and large enough for the shallow one at the same time. Standardise your features (rescale them to comparable ranges) first, then tune `η`." },
    { type: "h3", text: "Failure modes worth naming out loud in an interview" },
    { type: "list", items: [
      "**Divergence** — happens when `η > 2/λ_max`: the loss increases every step, doubling and doubling again, until the numbers overflow into `NaN` (\"Not a Number\", the symbol computers use when a calculation has broken). The visualizer above shows this directly.",
      "**Crawling** — happens when `η` is far smaller than `2/λ_max`: the loss does shrink, correctly, but so slowly that you run out of time or compute budget long before reaching a good solution.",
      "**Zig-zag** — happens when the condition number `κ` is large: each step bounces back and forth across the walls of the ravine, making very little forward progress along its floor. Momentum (next lesson) is the standard fix.",
      "**Plateaus and saddle points** — in a model with many weights, the flat-looking spots training gets stuck at are usually not the bottom of a valley but **saddle points**: places where the surface curves upward in some directions and downward in others, so the gradient is tiny in every direction even though you have not reached a good solution. Adding noise (as SGD does) or rescaling steps per-direction (as Adam does, next lesson) helps escape them."
    ]},
    { type: "code", lang: "python", code: "# the entire algorithm, in code\nfor step in range(n_steps):\n    g = grad(loss, w, batch)   # g = the gradient, estimated on this batch\n    w -= lr * g                # move w a little in the opposite direction" }
  ],

  glossary: [
    { term: "Gradient (∇L)", plain: "A list of numbers, one per model weight, saying which way each weight should move — and how strongly — to make the error (loss) bigger. Gradient descent moves the opposite way, to make the error smaller." },
    { term: "Loss function / loss surface", plain: "A formula that turns 'how wrong the model currently is' into a single number. Pictured as a landscape, its height at any point is how bad the model is there, and training means walking downhill on it." },
    { term: "Weights / parameters (w)", plain: "The adjustable numbers inside a model — the things training actually changes — such as the slope of a line or the millions of internal numbers in a neural network." },
    { term: "Learning rate (η, eta)", plain: "A single number controlling how big a step gradient descent takes each time it updates the weights. Too big and training blows up; too small and training crawls." },
    { term: "Hessian (H)", plain: "A grid of numbers describing how sharply the loss surface curves in every possible direction — the mathematical description of the shape of the 'bowl' or 'ravine' being descended." },
    { term: "Eigenvalue / eigenvector", plain: "For a curved surface, an eigenvector is one of a special set of directions, and its eigenvalue is a number saying how steeply the surface curves specifically along that direction. A big eigenvalue means steep and narrow there; a small one means shallow and wide." },
    { term: "Condition number (κ, kappa)", plain: "The ratio of the steepest curvature to the shallowest curvature of the loss surface. A large condition number means the surface is a long, narrow ravine, which makes plain gradient descent slow and zig-zaggy." },
    { term: "Convergence / divergence", plain: "Convergence is when repeated steps get closer to a good answer and the loss settles down. Divergence is the opposite: the loss keeps growing every step until the numbers break." },
    { term: "Saddle point", plain: "A point on the loss surface that curves upward in some directions and downward in others, so it looks flat from many angles even though it isn't the bottom of a valley. Training can get stuck near one because the gradient is tiny there." },
    { term: "Variance (of an estimate)", plain: "How much an estimate wobbles or jumps around if you recompute it on a different random sample of data. A noisy gradient estimate, like plain SGD's, has high variance." },
    { term: "Unbiased estimator", plain: "An estimate that is correct 'on average' across many repetitions, even though any single instance of it might be off in either direction." },
    { term: "Batch / mini-batch / epoch", plain: "A batch is the group of training examples used to compute one gradient step; a mini-batch is a small batch; an epoch is one full pass through the entire training dataset." }
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
