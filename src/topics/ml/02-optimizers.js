export default {
  id: "optimizers",
  track: "ml",
  title: "Momentum, RMSProp & Adam",
  difficulty: 2,
  minutes: 16,
  tags: ["optimization", "momentum", "adam", "training"],

  explainer: [
    { type: "p", text: "Plain SGD has two structural problems: it is slow in ravines (the gradient points across the valley, not along it) and it uses one global step size for parameters whose gradients differ in magnitude by orders of magnitude. Momentum fixes the first. Per-coordinate scaling fixes the second. Adam is both fixes stapled together." },
    { type: "h3", text: "Momentum — a low-pass filter on the gradient" },
    { type: "code", lang: "python", code: "v = beta * v + g          # classic (PyTorch) form\nw = w - lr * v            # Nesterov evaluates g at w - lr*beta*v instead" },
    { type: "p", text: "`v` is an exponential moving average of past gradients with an effective window of `1/(1−β)` steps — β = 0.9 means roughly the last 10 gradients. In a ravine the cross-valley components alternate sign and cancel in the average; the along-valley component has a consistent sign and accumulates, reaching an asymptotic step of `lr·g/(1−β)`, i.e. **10× larger** at β = 0.9. That is the entire speedup." },
    { type: "p", text: "The theory result worth quoting: for a strongly convex quadratic, GD needs `O(κ log 1/ε)` steps and momentum (with the right β) needs `O(√κ log 1/ε)`. Nesterov's variant looks ahead — it computes the gradient at the position momentum is about to carry you to — which gives it a correction term that damps overshoot near the minimum." },
    { type: "h3", text: "RMSProp — per-coordinate learning rates" },
    { type: "code", lang: "python", code: "s = rho * s + (1 - rho) * g**2\nw = w - lr * g / (sqrt(s) + eps)" },
    { type: "p", text: "`s` tracks the running mean square of each coordinate's gradient, so dividing by `√s` makes the update roughly **unit-scale in every coordinate**: a parameter with tiny gradients gets a proportionally larger step. This is a cheap diagonal preconditioner — an approximation of dividing by the Hessian's diagonal — and it is why RMSProp/Adam are robust to badly scaled features and to the vastly different gradient magnitudes across layers of a deep net." },
    { type: "h3", text: "Adam = momentum + RMSProp + bias correction" },
    { type: "code", lang: "python", code: "m = b1*m + (1-b1)*g            # 1st moment (direction)\nv = b2*v + (1-b2)*g**2         # 2nd moment (scale)\nm_hat = m / (1 - b1**t)        # bias correction\nv_hat = v / (1 - b2**t)\nw -= lr * m_hat / (sqrt(v_hat) + eps)" },
    { type: "p", text: "The bias correction matters more than people think. `m` and `v` start at zero, so early on they are biased toward zero — at `t = 1` with β₂ = 0.999, `v` is a thousand times too small, and without correction the very first steps would be enormous. Dividing by `(1 − βᵗ)` un-biases them, which is exactly why Adam still needs *warmup* in transformers: the variance of `1/√v̂` is huge while `t` is small." },
    { type: "callout", tone: "pitfall", text: "L2 penalty and weight decay are NOT the same under Adam. Adding `λw` to the gradient means it gets divided by `√v̂` too, so parameters with large gradients get *less* decay — the opposite of the intent. AdamW decouples it: `w ← w − lr·m̂/(√v̂+ε) − lr·λ·w`. This is the single most commonly-asked Adam detail." },
    { type: "h3", text: "When each one is the right answer" },
    { type: "list", items: [
      "**SGD + Nesterov momentum + cosine decay** — still the best final accuracy on convnets/vision; the noise acts as a regulariser and it generalises slightly better than Adam.",
      "**AdamW** — the default for transformers, sparse gradients, and anything with wildly heterogeneous parameter scales (embeddings vs layernorms).",
      "**RMSProp** — RNNs historically; mostly superseded by Adam.",
      "**Adafactor / 8-bit Adam** — when Adam's two extra full-size state tensors (2× the model in optimizer memory) don't fit."
    ]},
    { type: "callout", tone: "tip", text: "Memory answer: SGD stores 0 extra tensors, momentum 1, Adam 2. For a 7B model in fp32 that is 28 GB of Adam state on top of 28 GB of weights — which is why optimizer sharding (ZeRO) exists." }
  ],

  complexity: {
    rows: [
      { operation: "SGD step", time: "O(d)", space: "O(0) extra", note: "d parameters" },
      { operation: "Momentum step", time: "O(d)", space: "O(d) extra", note: "one velocity buffer" },
      { operation: "RMSProp step", time: "O(d)", space: "O(d) extra", note: "one second-moment buffer" },
      { operation: "Adam / AdamW step", time: "O(d)", space: "O(2d) extra", note: "m and v; 2× model size in fp32" },
      { operation: "Steps to ε (quadratic)", time: "GD O(κ log 1/ε) → momentum O(√κ log 1/ε)", space: "—", note: "the reason momentum exists" }
    ]
  },

  interview: {
    whyAsked: "Everyone can recite the Adam update; few can say what each term *does* to the trajectory. The signal is whether you can connect the algebra (an EMA of gradients, an EMA of squared gradients) to the geometry (a ravine, a badly scaled coordinate) and to real engineering constraints (optimizer memory, warmup, AdamW).",
    followUps: [
      { q: "Why does momentum help, mechanically?", a: "It replaces the raw gradient with an exponential moving average over ~1/(1−β) steps. Components that oscillate in sign — the cross-valley direction of a ravine — average out; components with consistent sign — the valley floor — accumulate to an effective step of `lr·g/(1−β)`. On a quadratic that improves the convergence rate from O(κ) to O(√κ) steps." },
      { q: "What is the difference between classical and Nesterov momentum?", a: "Classical evaluates the gradient at the current point, then adds it to the velocity. Nesterov first takes the momentum step, evaluates the gradient at that *lookahead* point, and corrects. Because the correction is measured where you are going rather than where you were, it damps overshoot near the minimum and gives a better constant (and the accelerated O(√κ) rate in the convex analysis)." },
      { q: "Why does Adam need bias correction?", a: "m and v are initialised to zero, so the EMAs are biased toward zero for roughly 1/(1−β) steps — with β₂ = 0.999 that's ~1000 steps. Uncorrected, `m/√v` would be badly scaled early: dividing by an under-estimated √v inflates the step. `m̂ = m/(1−β₁ᵗ)`, `v̂ = v/(1−β₂ᵗ)` un-bias both. Even with it, the variance of the update is large for small t, which is why transformers add LR warmup." },
      { q: "Adam vs AdamW — what actually changes?", a: "Where the weight decay is applied. Adam with an L2 term adds `λw` to the gradient, so the decay is then divided by `√v̂` — weights with big gradients get decayed less, which is backwards. AdamW subtracts `lr·λ·w` directly from the parameter, outside the adaptive scaling. It decouples decay from gradient magnitude and consistently generalises better; it is the default in every modern LLM recipe." },
      { q: "Why does SGD sometimes generalise better than Adam?", a: "Two arguments. (1) Adam's per-coordinate rescaling shrinks the effective gradient noise, and that noise is what biases SGD toward flat, wide minima that generalise. (2) Adam's implicit preconditioner can move you into sharp minima that fit the training set precisely. In practice: SGD+momentum wins on vision benchmarks with a tuned schedule; AdamW wins everywhere the loss landscape is heterogeneous or the tuning budget is small." },
      { q: "What is the memory cost of Adam and how do people reduce it?", a: "Two extra tensors the size of the parameters (m and v), so 8 bytes/param in fp32 on top of the weights and gradients — for a 7B model, ~56 GB of weights+state. Mitigations: ZeRO/FSDP sharding of optimizer state across ranks, 8-bit Adam (quantised m/v), Adafactor (factored second moment: O(n+m) instead of O(nm) per matrix), or dropping back to momentum-only." },
      { q: "What does ε in the denominator do?", a: "It prevents division by zero and caps the maximum effective step at roughly `lr/ε` when gradients are tiny. It is not purely numerical: raising ε (1e-8 → 1e-4) makes Adam behave more like SGD with momentum, and is a real knob for stabilising training that blows up." }
    ]
  },

  code: [
    { lang: "python", label: "All four, from scratch", code: "import numpy as np\n\nclass SGD:\n    def __init__(self, d, lr=0.1): self.lr = lr\n    def step(self, w, g): return w - self.lr * g\n\nclass Momentum:\n    def __init__(self, d, lr=0.1, beta=0.9):\n        self.lr, self.beta, self.v = lr, beta, np.zeros(d)\n    def step(self, w, g):\n        self.v = self.beta * self.v + g          # EMA of gradients\n        return w - self.lr * self.v\n\nclass RMSProp:\n    def __init__(self, d, lr=0.1, rho=0.9, eps=1e-8):\n        self.lr, self.rho, self.eps, self.s = lr, rho, eps, np.zeros(d)\n    def step(self, w, g):\n        self.s = self.rho * self.s + (1 - self.rho) * g * g\n        return w - self.lr * g / (np.sqrt(self.s) + self.eps)\n\nclass Adam:\n    def __init__(self, d, lr=0.1, b1=0.9, b2=0.999, eps=1e-8):\n        self.lr, self.b1, self.b2, self.eps = lr, b1, b2, eps\n        self.m, self.v, self.t = np.zeros(d), np.zeros(d), 0\n    def step(self, w, g):\n        self.t += 1\n        self.m = self.b1 * self.m + (1 - self.b1) * g\n        self.v = self.b2 * self.v + (1 - self.b2) * g * g\n        mh = self.m / (1 - self.b1 ** self.t)    # bias correction\n        vh = self.v / (1 - self.b2 ** self.t)\n        return w - self.lr * mh / (np.sqrt(vh) + self.eps)" },
    { lang: "python", label: "AdamW: decoupled weight decay", code: "class AdamW(Adam):\n    def __init__(self, d, lr=1e-3, wd=0.01, **kw):\n        super().__init__(d, lr=lr, **kw)\n        self.wd = wd\n    def step(self, w, g):\n        w = super().step(w, g)\n        return w - self.lr * self.wd * w   # decay OUTSIDE the adaptive scaling\n\n# Wrong (classic Adam + L2):  g = g + wd * w   -> decay gets divided by sqrt(v_hat)" },
    { lang: "python", label: "Warmup + cosine schedule", code: "def lr_at(step, base_lr, warmup=2000, total=100_000, min_frac=0.1):\n    if step < warmup:                               # linear warmup: v_hat is\n        return base_lr * step / warmup              # unreliable while t is small\n    p = (step - warmup) / max(1, total - warmup)\n    cos = 0.5 * (1 + np.cos(np.pi * min(1.0, p)))\n    return base_lr * (min_frac + (1 - min_frac) * cos)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 200 },

    params: [
      { key: "lr", label: "Learning rate ×0.01", type: "int", min: 1, max: 30, default: 8 },
      { key: "kappa", label: "Ravine steepness κ", type: "int", min: 2, max: 30, default: 12 },
      { key: "beta", label: "Momentum β ×0.01", type: "int", min: 0, max: 99, default: 90 },
      { key: "steps", label: "Steps", type: "int", min: 20, max: 160, default: 90 }
    ],

    frames: function* (params, rng) {
      const lr = params.lr / 100;
      const K = params.kappa;             // curvature across the ravine
      const beta = params.beta / 100;
      const N = params.steps;
      const c = 0.15;                     // the ravine floor is the parabola y = c·x²

      // f(x,y) = 0.05x² + ½·K·(y − c·x²)²   — a curved, ill-conditioned valley.
      const loss = (x, y) => { const r = y - c * x * x; return 0.05 * x * x + 0.5 * K * r * r; };
      const grad = (x, y) => {
        const r = y - c * x * x;
        return [0.1 * x - 2 * c * K * x * r, K * r];
      };

      const x0 = -2.3, y0 = 1.55;
      const names = ["SGD", "Momentum", "RMSProp", "Adam"];
      const opt = names.map((name) => ({
        name, x: x0, y: y0, dead: false,
        vx: 0, vy: 0, sx: 0, sy: 0, mx: 0, my: 0, t: 0,
        path: [[x0, y0]], loss: loss(x0, y0), best: loss(x0, y0)
      }));

      const rho = 0.9, b1 = 0.9, b2 = 0.999, eps = 1e-8;

      const snap = () => ({
        K, lr, beta, c, step: opt[0].path.length - 1,
        runners: opt.map((o) => ({
          name: o.name, x: o.x, y: o.y, loss: o.loss, dead: o.dead,
          path: o.path.map((p) => p.slice())
        }))
      });

      yield {
        label: `Four optimizers start at (${x0}, ${y0}) on the same ravine: curvature ${K}× steeper across the valley than along it. Same learning rate η = ${lr.toFixed(2)} for all. Watch which direction each one's first step points.`,
        phase: "init",
        state: snap()
      };

      for (let i = 1; i <= N; i++) {
        const before = opt.map((o) => o.loss);
        for (const o of opt) {
          if (o.dead) { o.path.push([o.x, o.y]); continue; }
          const [gx, gy] = grad(o.x, o.y);
          let dx = 0, dy = 0;
          if (o.name === "SGD") {
            dx = -lr * gx; dy = -lr * gy;
          } else if (o.name === "Momentum") {
            o.vx = beta * o.vx + gx; o.vy = beta * o.vy + gy;
            dx = -lr * o.vx; dy = -lr * o.vy;
          } else if (o.name === "RMSProp") {
            o.sx = rho * o.sx + (1 - rho) * gx * gx;
            o.sy = rho * o.sy + (1 - rho) * gy * gy;
            dx = -lr * gx / (Math.sqrt(o.sx) + eps);
            dy = -lr * gy / (Math.sqrt(o.sy) + eps);
          } else {
            o.t += 1;
            o.mx = b1 * o.mx + (1 - b1) * gx; o.my = b1 * o.my + (1 - b1) * gy;
            o.vx = b2 * o.vx + (1 - b2) * gx * gx; o.vy = b2 * o.vy + (1 - b2) * gy * gy;
            const mhx = o.mx / (1 - Math.pow(b1, o.t)), mhy = o.my / (1 - Math.pow(b1, o.t));
            const vhx = o.vx / (1 - Math.pow(b2, o.t)), vhy = o.vy / (1 - Math.pow(b2, o.t));
            dx = -lr * mhx / (Math.sqrt(vhx) + eps);
            dy = -lr * mhy / (Math.sqrt(vhy) + eps);
          }
          const nx = o.x + dx, ny = o.y + dy;
          if (!isFinite(nx) || !isFinite(ny) || Math.abs(nx) > 50 || Math.abs(ny) > 50) {
            o.dead = true;                          // freeze at the edge, keep it visible
            o.x = Math.max(-6, Math.min(6, o.x));
            o.y = Math.max(-6, Math.min(6, o.y));
            o.loss = 1e6;
          } else {
            o.x = nx; o.y = ny;
            o.loss = loss(o.x, o.y);
            o.best = Math.min(o.best, o.loss);
          }
          o.path.push([o.x, o.y]);
          if (o.path.length > 400) o.path.shift();
        }

        let label;
        if (i === 1) {
          label = `Step 1. Every optimizer sees the same gradient (${grad(x0, y0)[0].toFixed(2)}, ${grad(x0, y0)[1].toFixed(2)}) — dominated by the steep w₂ component. SGD and Momentum take a step proportional to it; RMSProp and Adam divide each coordinate by its own √(g²), so their first step is nearly the unit diagonal instead.`;
        } else if (i === 2) {
          label = `Step 2. Momentum's velocity now holds two gradients; the cross-valley parts partly cancel while the along-valley part adds. Adam's bias correction divides m by (1−0.9²) = 0.19 and v by (1−0.999²) = 0.002 — without it these first steps would be ~20× too small.`;
        } else {
          const parts = opt.map((o) => `${o.name} ${o.dead ? "diverged" : o.loss.toFixed(3)}`);
          const alive = opt.filter((o) => !o.dead);
          const lead = alive.length ? alive.reduce((a, b) => (a.loss < b.loss ? a : b)) : null;
          label = `Step ${i}: ${parts.join("  ·  ")}.` + (lead ? ` ${lead.name} leads; its loss fell ${(before[opt.indexOf(lead)] - lead.loss).toFixed(4)} this step.` : "");
        }

        yield { label, phase: "race", state: snap() };
      }

      const final = opt.slice().sort((a, b) => a.loss - b.loss);
      yield {
        label: `After ${N} steps: ${final.map((o) => `${o.name} ${o.dead ? "diverged" : o.loss.toExponential(2)}`).join(", ")}. The adaptive methods win here because the two coordinates have gradients of wildly different magnitude; on a well-conditioned surface plain SGD is competitive and generalises better.`,
        phase: "done",
        state: snap()
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const series = [C.viz1, C.viz2, C.viz4, C.viz7];
      const glyph = ["●", "▲", "■", "◆"];

      const padL = 44, padR = 210, padT = 30, padB = 40;
      const pw = W - padL - padR, ph = H - padT - padB;
      const xMin = -3.0, xMax = 3.0, yMin = -1.0, yMax = 2.2;
      const PX = (x) => padL + ((x - xMin) / (xMax - xMin)) * pw;
      const PY = (y) => padT + ph - ((y - yMin) / (yMax - yMin)) * ph;
      const cl = (v, a, b) => Math.max(a, Math.min(b, v));

      // ---- grid & axes -----------------------------------------------------
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let t = -3; t <= 3; t++) {
        const X = PX(t);
        ctx.beginPath(); ctx.moveTo(X, padT); ctx.lineTo(X, padT + ph); ctx.stroke();
        ctx.textAlign = "center"; ctx.fillText(t.toFixed(0), X, padT + ph + 14);
      }
      for (let t = -1; t <= 2; t++) {
        const Y = PY(t);
        ctx.beginPath(); ctx.moveTo(padL, Y); ctx.lineTo(padL + pw, Y); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(t.toFixed(0), padL - 6, Y + 3);
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.3;
      ctx.strokeRect(padL, padT, pw, ph);
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.textAlign = "right"; ctx.fillText("w₁", padL + pw - 4, PY(yMin) - 6);
      ctx.textAlign = "left"; ctx.fillText("w₂", padL + 4, padT + 12);

      // ---- contours: y = c·x² ± sqrt(2(L − 0.05x²)/K) ----------------------
      const levels = [0.05, 0.15, 0.4, 0.9, 1.8, 3.2, 5.5];
      for (let li = 0; li < levels.length; li++) {
        const L = levels[li];
        ctx.strokeStyle = C.grid;
        ctx.globalAlpha = 0.9 - 0.07 * li;
        ctx.lineWidth = 1;
        for (const sign of [1, -1]) {
          ctx.beginPath();
          let started = false;
          for (let px = 0; px <= 240; px++) {
            const x = xMin + (px / 240) * (xMax - xMin);
            const inner = 2 * (L - 0.05 * x * x) / S.K;
            if (inner < 0) { started = false; continue; }
            const y = S.c * x * x + sign * Math.sqrt(inner);
            const X = PX(x), Y = PY(y);
            if (Y < padT - 20 || Y > padT + ph + 20) { started = false; continue; }
            if (!started) { ctx.moveTo(X, Y); started = true; } else ctx.lineTo(X, Y);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;

      // valley floor
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1; ctx.setLineDash([3, 4]);
      ctx.beginPath();
      for (let px = 0; px <= 200; px++) {
        const x = xMin + (px / 200) * (xMax - xMin);
        const Y = PY(S.c * x * x);
        if (px === 0) ctx.moveTo(PX(x), Y); else ctx.lineTo(PX(x), Y);
      }
      ctx.stroke(); ctx.setLineDash([]);

      // minimum
      ctx.strokeStyle = C.viz6; ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(PX(0) - 6, PY(0)); ctx.lineTo(PX(0) + 6, PY(0));
      ctx.moveTo(PX(0), PY(0) - 6); ctx.lineTo(PX(0), PY(0) + 6);
      ctx.stroke();

      // ---- trails ----------------------------------------------------------
      for (let k = 0; k < S.runners.length; k++) {
        const r = S.runners[k];
        ctx.strokeStyle = series[k];
        ctx.lineWidth = 1.7;
        ctx.globalAlpha = r.dead ? 0.35 : 0.9;
        ctx.beginPath();
        for (let i = 0; i < r.path.length; i++) {
          const X = cl(PX(r.path[i][0]), padL - 30, padL + pw + 30);
          const Y = cl(PY(r.path[i][1]), padT - 30, padT + ph + 30);
          if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // ---- balls -----------------------------------------------------------
      for (let k = 0; k < S.runners.length; k++) {
        const r = S.runners[k];
        const X = cl(PX(r.x), padL - 20, padL + pw + 20);
        const Y = cl(PY(r.y), padT - 20, padT + ph + 20);
        ctx.fillStyle = r.dead ? C.danger : series[k];
        ctx.beginPath(); ctx.arc(X, Y, 6, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.surface; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = C.text; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(String(k + 1), X, Y + 3);
      }

      // ---- panel: legend + loss bars --------------------------------------
      const px0 = W - padR + 14;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`;
      ctx.fillText(`step ${S.step}   η = ${S.lr.toFixed(2)}   β = ${S.beta.toFixed(2)}`, px0, padT + 10);

      const maxLoss = Math.max.apply(null, S.runners.map((r) => (r.dead ? 0 : r.loss)).concat([1e-6]));
      let ty = padT + 34;
      for (let k = 0; k < S.runners.length; k++) {
        const r = S.runners[k];
        ctx.fillStyle = series[k];
        ctx.beginPath(); ctx.arc(px0 + 5, ty - 4, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.text; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(`${glyph[k]} ${r.name}`, px0 + 16, ty);
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillStyle = r.dead ? C.danger : C.text2; ctx.textAlign = "right";
        ctx.fillText(r.dead ? "diverged" : r.loss.toFixed(4), W - 14, ty);
        // loss bar (log-ish)
        const barW = (W - 14) - (px0 + 16);
        const frac = r.dead ? 1 : Math.min(1, Math.sqrt(r.loss / maxLoss));
        ctx.fillStyle = C.surface2;
        ctx.fillRect(px0 + 16, ty + 4, barW, 5);
        ctx.fillStyle = r.dead ? C.danger : series[k];
        ctx.fillRect(px0 + 16, ty + 4, Math.max(1, barW * frac), 5);
        ty += 30;
      }

      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
      const notes = [
        "1 SGD: step ∝ raw gradient",
        "2 Momentum: EMA of gradients,",
        "   effective step ×1/(1−β)",
        "3 RMSProp: ÷ √EMA[g²] per coord",
        "4 Adam: both, + bias correction"
      ];
      for (let i = 0; i < notes.length; i++) ctx.fillText(notes[i], px0, ty + i * 14);

      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`κ ≈ ${S.K}  ·  SGD limit η < ${(2 / S.K).toFixed(3)}`, px0, padT + ph - 2);
    }
  },

  drill: {
    cards: [
      { q: "Write the momentum update and state its effective step size.", a: "`v ← βv + g;  w ← w − lr·v`. With a constant gradient the velocity converges to `g/(1−β)`, so the asymptotic step is `lr·g/(1−β)` — 10× larger at β = 0.9.", tags: ["momentum"] },
      { q: "Why does momentum help in a ravine?", a: "Cross-valley gradient components alternate sign and cancel in the EMA; along-valley components have consistent sign and accumulate. Convergence goes from O(κ) to O(√κ) steps on a quadratic.", tags: ["momentum", "theory"] },
      { q: "Write the RMSProp update and say what it accomplishes.", a: "`s ← ρs + (1−ρ)g²;  w ← w − lr·g/(√s+ε)`. Each coordinate is divided by its own gradient RMS, giving roughly unit-scale updates everywhere — a cheap diagonal preconditioner.", tags: ["rmsprop"] },
      { q: "Write the full Adam update including bias correction.", a: "`m ← β₁m + (1−β₁)g`, `v ← β₂v + (1−β₂)g²`, `m̂ = m/(1−β₁ᵗ)`, `v̂ = v/(1−β₂ᵗ)`, `w ← w − lr·m̂/(√v̂+ε)`. Defaults β₁=0.9, β₂=0.999, ε=1e-8.", tags: ["adam"] },
      { q: "Why is bias correction necessary in Adam?", a: "m and v start at 0, so the EMAs under-estimate for ~1/(1−β) steps (≈1000 for β₂=0.999). Dividing by (1−βᵗ) removes the bias; without it early steps are badly scaled.", tags: ["adam"] },
      { q: "Adam vs AdamW?", a: "Adam+L2 adds λw to the gradient, so decay is divided by √v̂ and becomes gradient-dependent. AdamW subtracts `lr·λ·w` from the weight directly, decoupled from the adaptive scale. AdamW generalises better and is the LLM default.", tags: ["adamw", "regularization"] },
      { q: "What is Adam's optimizer memory cost?", a: "Two extra parameter-sized tensors (m and v) — 8 bytes/param in fp32, i.e. 2× the model. Mitigations: ZeRO/FSDP sharding, 8-bit Adam, Adafactor's factored second moment.", tags: ["systems"] },
      { q: "Why do transformers need LR warmup with Adam?", a: "Early in training the second-moment estimate v̂ is computed from very few samples, so `1/√v̂` has enormous variance and the updates are erratic. Linear warmup over a few thousand steps lets the moment estimates stabilise before full-size steps are taken.", tags: ["schedules"] }
    ],
    sixtySecond: [
      "Explain momentum, RMSProp and Adam in terms of what problem each one solves, then state Adam's full update rule.",
      "Explain the difference between Adam and AdamW and why it matters for generalisation."
    ]
  }
};
