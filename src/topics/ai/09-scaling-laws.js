export default {
  id: "scaling-laws",
  track: "ai",
  title: "Scaling Laws & Loss Curves",
  difficulty: 3,
  minutes: 20,
  tags: ["scaling-laws", "compute", "chinchilla", "pretraining"],

  explainer: [
    { type: "p", text: "As you spend more compute training a language model, test loss falls in a way that is embarrassingly *predictable*: it follows a smooth power law in model size, in training tokens, and in compute itself. That regularity — not any one model's benchmark score — is the actual finding of the scaling-law literature, and it is what lets a lab decide how big to train a model **before** spending the compute to do it." },

    { type: "h3", text: "The parametric form" },
    { type: "p", text: "The standard fit (Hoffmann et al., 2022 — \"Chinchilla\") is `L(N, D) = E + A/N^α + B/D^α`, where `N` is parameter count, `D` is training tokens, and `E`, `A`, `B`, `α` are fitted constants." },
    { type: "list", items: [
      "`E` — the **irreducible entropy** of natural text: the loss you'd have even with infinite parameters and infinite data. Loss curves flatten toward `E`, never toward zero.",
      "`A/N^α` — the **capacity term**: a model with too few parameters can't represent the data distribution well, no matter how long you train it.",
      "`B/D^α` — the **data term**: a model trained on too few tokens hasn't seen enough to reach its own capacity — it's *undertrained*, not *too small*.",
      "Every model's curve, plotted against tokens, asymptotes to `E + A/N^α` — a floor set by `N` alone that more data cannot break through."
    ]},
    { type: "callout", tone: "tip", text: "This lesson's viz uses one shared exponent `α` on both the `N` and `D` terms (a simplification of the paper's separately-fitted `α ≈ 0.34`, `β ≈ 0.28`). That's deliberate: equal exponents are exactly the condition that makes the compute-optimal parameter/token split come out as a constant ratio independent of scale — which is the real headline result, reproduced honestly rather than copied as a fact to memorize." },

    { type: "h3", text: "The compute proxy" },
    { type: "p", text: "Training compute is approximated as `C ≈ 6·N·D` FLOPs — 2 FLOPs per parameter per token for the forward pass, 4 for backward (weight and activation gradients). This turns \"how do I spend my compute budget\" into a genuine allocation problem: for a fixed `C`, growing `N` means shrinking `D`, and vice versa." },

    { type: "h3", text: "Chinchilla: solving the allocation problem" },
    { type: "p", text: "Hold `C` fixed and substitute `D = C/(6N)` into the loss, then minimize over `N`. Setting `dL/dN = 0` gives `N* ∝ C^(β/(α+β))`, `D* ∝ C^(α/(α+β))`. When the two exponents are roughly equal — which is what Hoffmann et al. found empirically — both come out close to `C^0.5`, and the ratio `D*/N*` stops depending on `C` at all." },
    { type: "callout", tone: "warn", text: "That ratio works out to roughly **20 tokens of training data per model parameter** at the compute-optimal point — at essentially any compute budget. It is the single number worth memorizing from this whole topic." },
    { type: "p", text: "This overturned the field's working assumption. The earlier scaling-law fits (Kaplan et al., 2020) implied you should grow parameters much faster than data as compute increases — and GPT-3 (175B params, ~300B tokens ≈ 1.7 tokens/param), Gopher (280B params, ~300B tokens), and MT-NLG (530B params) were all trained on that assumption. Chinchilla (70B params, 1.4T tokens ≈ 20 tokens/param) was trained on the *same* compute budget as Gopher and beat it on nearly every benchmark, purely by moving FLOPs from parameters into tokens." },
    { type: "callout", tone: "pitfall", text: "Why did Kaplan et al. get the split wrong? Mainly a confound in their experimental design: they didn't tune each run's learning-rate decay schedule to match its own token budget, using a schedule length suited to longer runs across the board. That systematically makes shorter (lower-`D`) runs look worse than they actually are, which biases the fitted optimum toward spending compute on `N` instead of `D`. Chinchilla's \"IsoFLOP\" sweeps — many `(N, D)` pairs at each of several fixed `C`, each with its own matched schedule — removed that bias." },

    { type: "h3", text: "Training-optimal is not inference-optimal" },
    { type: "p", text: "Chinchilla minimizes training compute for a target loss. It says nothing about **inference** cost, which scales with `N` per token generated and is paid every single query for the model's entire deployed lifetime — often dwarfing the one-time training cost for a widely served model. This is exactly why many production models (Llama 2 7B trained on 2T tokens ≈ 286 tokens/param) are deliberately trained well past the Chinchilla-optimal ratio: spend extra training compute now to ship a smaller, cheaper-to-serve model at the same quality bar." },

    { type: "h3", text: "Reading a log-log scaling plot" },
    { type: "list", items: [
      "Both axes are log scale, so a power law `y = k·x^p` renders as a straight line with slope `p` — that's the whole reason to plot it this way.",
      "Each model size traces its own curve as `D` (and therefore `C`) increases; the curve bends flat once `D` is large enough that the `A/N^α` capacity term dominates the `B/D^α` data term.",
      "The **lower envelope** across every model size's curve — not any single curve — is the compute-optimal frontier: at each `C`, it's whichever `N` currently gets you the lowest loss.",
      "A model that sits above the envelope at its compute budget is mis-sized for that budget: either too big (undertrained) or too small (capacity-capped) for the FLOPs actually spent on it."
    ]}
  ],

  complexity: {
    rows: [
      { operation: "Training compute", time: "C ≈ 6·N·D FLOPs", space: "N params, D tokens", note: "2 FLOPs/param/token forward + 4 backward" },
      { operation: "Compute-optimal N(C)", time: "N* ∝ C^0.5", space: "—", note: "holds when the loss's N- and D-exponents are ~equal (Chinchilla's empirical finding)" },
      { operation: "Compute-optimal D(C)", time: "D* ∝ C^0.5", space: "—", note: "same exponent as N ⇒ a constant optimal tokens-per-parameter ratio (~20)" },
      { operation: "Inference compute", time: "≈2·N FLOPs/token", space: "N params resident", note: "scales with N alone — why intentionally over-training small models is common in production" }
    ]
  },

  interview: {
    whyAsked: "This is the interview's proxy for 'do you understand pretraining as an optimization problem with a budget, or just as a bigger-number-is-better ritual.' The bar is stated precisely: the ~20 tokens/parameter number, why it replaced parameter-heavy scaling, and the training-vs-inference-compute distinction that explains why real models don't all sit exactly on the Chinchilla point.",
    followUps: [
      { q: "What does Chinchilla actually claim?", a: "For compute-optimal pretraining, model size and training tokens should scale with compute at the same rate (both ∝ C^0.5), which empirically works out to roughly 20 tokens per parameter — not the far more parameter-heavy ratios that earlier scaling laws implied and that GPT-3/Gopher/MT-NLG were trained under." },
      { q: "Why did the original (Kaplan et al.) scaling laws get the allocation wrong?", a: "They fit their power laws without matching each run's learning-rate decay schedule to that run's own token budget, using a schedule tuned for longer horizons across the board. That understates how good shorter, lower-D runs could actually be, which biases the fitted optimum toward growing N instead of D. Chinchilla's IsoFLOP sweeps used a schedule matched to each budget and got a materially different, equal-exponent answer." },
      { q: "Derive the compute-optimal N(C) from L(N,D) = E + A/N^α + B/D^α.", a: "Substitute D = C/(6N) and minimize over N: dL/dN = -α·A·N^(-α-1) + α·B·6^α·C^(-α)·N^(α-1) = 0, giving N* ∝ C^0.5 when the exponent on both terms is the same α. D* = C/(6N*) is then also ∝ C^0.5, so the ratio D*/N* is a constant that doesn't depend on C at all." },
      { q: "If 20 tokens/parameter is compute-optimal, why do production models like Llama 2 train on far more (~286 tokens/param for the 7B)?", a: "Chinchilla minimizes training compute for a target loss; it says nothing about inference cost, which scales with N per query and is paid for the model's entire serving lifetime. Overtraining a smaller model on more tokens spends extra, one-time training compute to permanently shrink the deployed model — a better trade when it will be queried billions of times." },
      { q: "What is the irreducible entropy term E, and why does it matter?", a: "It's the loss a model would still have with infinite parameters and infinite data — genuine unpredictability in language itself. It's why loss curves flatten toward E rather than falling to zero, and why extrapolating a fitted power law far beyond your data is risky: the true asymptote is E, not negative infinity." },
      { q: "How would you use a scaling law before committing to one large training run?", a: "Run a grid of small, cheap (N, D) pairs across several fixed compute budgets, fit the parametric loss surface (or trace IsoFLOP curves directly), and extrapolate to the real budget to pick N and D. Treat the extrapolation as an estimate to validate, not a guarantee — scaling laws can and do bend in new regimes: data-quality shifts, running out of unique high-quality tokens, or architecture changes." }
    ]
  },

  code: [
    { lang: "python", label: "The Chinchilla parametric loss surface", code: `import numpy as np

# A simplified, equal-exponent version of the fitted constants: this keeps the
# compute-optimal N/D ratio exactly constant, which is the point being taught.
E, A, B, ALPHA = 1.69, 148.1, 410.7, 0.34

def loss(N, D):
    """Expected pretraining loss for a model of N params trained on D tokens."""
    return E + A / N**ALPHA + B / D**ALPHA

def compute(N, D):
    return 6 * N * D    # the standard training-FLOPs approximation

# A 1B model plateaus near E + A/N^alpha no matter how long you train it:
floor_1b = E + A / 1e9**ALPHA
print(f"1B floor: {floor_1b:.3f}")
print(f"1B @ 10B tokens:  {loss(1e9, 1e10):.3f}")
print(f"1B @ 1T  tokens:  {loss(1e9, 1e12):.3f}")   # barely moves -- data-starved` },
    { lang: "python", label: "Numerically finding the compute-optimal split", code: `import numpy as np

def optimal_split(C, grid=np.logspace(6, 13, 4000)):
    """Brute-force check: for fixed compute C, which N minimizes loss(N, C/(6N))?"""
    N = grid
    D = C / (6 * N)
    L = loss(N, D)
    i = np.argmin(L)
    return N[i], D[i], L[i]

for logC in [18, 20, 22, 24]:
    C = 10.0**logC
    N_opt, D_opt, L_opt = optimal_split(C)
    print(f"C=1e{logC}:  N*={N_opt:.2e}  D*={D_opt:.2e}  "
          f"tokens/param={D_opt/N_opt:.1f}  loss={L_opt:.3f}")

# Output shows tokens/param staying near ~20 across FOUR orders of magnitude
# of compute -- that stability is the actual claim, not any single ratio.` },
    { lang: "python", label: "Compute-optimal vs a parameter-heavy allocation", code: `import numpy as np

# Closed-form optimum when both loss exponents are alpha (equal):
kN = (A / (B * 6**ALPHA)) ** (1 / (2 * ALPHA))
kD = 1 / (6 * kN)
N_opt = lambda C: kN * C**0.5
D_opt = lambda C: kD * C**0.5

# A pre-Chinchilla, parameter-heavy split (Kaplan-style exponents), anchored
# to agree with the optimum at the smallest compute budget, then diverging:
C_anchor = 1e18
kN_old = N_opt(C_anchor) / C_anchor**0.73
kD_old = 1 / (6 * kN_old)
N_old = lambda C: kN_old * C**0.73
D_old = lambda C: kD_old * C**0.27

for logC in [18, 20, 22, 24]:
    C = 10.0**logC
    l_opt = loss(N_opt(C), D_opt(C))
    l_old = loss(N_old(C), D_old(C))
    print(f"C=1e{logC}:  optimal loss={l_opt:.3f}   "
          f"parameter-heavy loss={l_old:.3f}   gap={l_old - l_opt:.3f}")

# The gap is ~0 at the anchor and grows with C: over-investing in N at the
# expense of D gets steadily more wasteful as the budget scales up.` }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.8, maxFrames: 220 },

    params: [
      { key: "logC", label: "Your compute budget (10^x FLOPs)", type: "int", min: 18, max: 24, default: 21 },
      { key: "compare", label: "Show pre-Chinchilla allocation", type: "bool", default: true }
    ],

    frames: function* (params, rng) {
      var logC = Math.max(18, Math.min(24, (params.logC | 0) || 21));
      var compareOn = params.compare !== false;

      // ---- the (simplified, equal-exponent) Chinchilla loss surface ---------
      var E = 1.69, A = 148.1, B = 410.7, ALPHA = 0.34;
      function lossOf(N, D) { return E + A / Math.pow(N, ALPHA) + B / Math.pow(D, ALPHA); }
      var SIX = 6; // C ~= 6*N*D FLOPs

      var kN = Math.pow(A / (B * Math.pow(SIX, ALPHA)), 1 / (2 * ALPHA));
      var kD = 1 / (SIX * kN);
      function Nopt(C) { return kN * Math.sqrt(C); }
      function Dopt(C) { return kD * Math.sqrt(C); }

      var OLD_PN = 0.73, OLD_PD = 0.27; // pre-Chinchilla, parameter-heavy exponents

      var r3 = function (v) { return (Math.round(v * 1000) / 1000) || 0; };
      var fmtCount = function (x) {
        if (x >= 1e12) return (x / 1e12).toFixed(x >= 1e13 ? 0 : 1) + "T";
        if (x >= 1e9) return (x / 1e9).toFixed(x >= 1e10 ? 0 : 1) + "B";
        if (x >= 1e6) return (x / 1e6).toFixed(x >= 1e7 ? 0 : 1) + "M";
        if (x >= 1e3) return (x / 1e3).toFixed(0) + "k";
        return String(Math.round(x));
      };
      var SUP = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
      var fmtSci = function (x) {
        if (!(x > 0)) return "0";
        var e = Math.floor(Math.log10(x));
        var m = x / Math.pow(10, e);
        var sup = String(e).split("").map(function (c) { return SUP[c] || c; }).join("");
        return m.toFixed(2) + "×10" + sup;
      };

      var MODEL_N = [1e8, 3e8, 1e9, 3e9, 1e10, 3e10, 1e11];
      var MODEL_LABEL = ["100M", "300M", "1B", "3B", "10B", "30B", "100B"];
      var MODEL_COLOR = ["viz1", "viz2", "viz3", "viz4", "viz5", "viz6", "viz7"];

      var DMIN = 2e9, DMAX = 4e12, DSTEPS = 9;
      var dRatio = Math.pow(DMAX / DMIN, 1 / (DSTEPS - 1));
      var D_GRID = [];
      for (var gi = 0; gi < DSTEPS; gi++) D_GRID.push(DMIN * Math.pow(dRatio, gi));

      // ---- pass 1: precompute every point so axis bounds fit everything ----
      var cLo = Infinity, cHi = -Infinity, lLo = Infinity, lHi = -Infinity;
      var PTS = [];
      for (var mi = 0; mi < MODEL_N.length; mi++) {
        var row = [];
        for (var di = 0; di < D_GRID.length; di++) {
          var Cc = SIX * MODEL_N[mi] * D_GRID[di];
          var Ll = lossOf(MODEL_N[mi], D_GRID[di]);
          row.push({ c: Cc, l: Ll });
          if (Cc < cLo) cLo = Cc; if (Cc > cHi) cHi = Cc;
          if (Ll < lLo) lLo = Ll; if (Ll > lHi) lHi = Ll;
        }
        PTS.push(row);
      }
      var cMinExp = Math.floor(Math.log10(cLo));
      var cMaxExp = Math.ceil(Math.log10(cHi));
      var Cmin = Math.pow(10, cMinExp), Cmax = Math.pow(10, cMaxExp);

      var kNold = Nopt(Cmin) / Math.pow(Cmin, OLD_PN);
      var kDold = 1 / (SIX * kNold);
      function Nold(C) { return kNold * Math.pow(C, OLD_PN); }
      function Dold(C) { return kDold * Math.pow(C, OLD_PD); }

      var FSTEPS = 13;
      var fRatio = Math.pow(Cmax / Cmin, 1 / (FSTEPS - 1));
      var FRONT_OPT = [], FRONT_OLD = [];
      for (var fi = 0; fi < FSTEPS; fi++) {
        var Cf = Cmin * Math.pow(fRatio, fi);
        var Nf = Nopt(Cf), Df = Dopt(Cf), Lf = lossOf(Nf, Df);
        FRONT_OPT.push({ c: Cf, l: Lf, n: Nf, d: Df });
        if (Lf < lLo) lLo = Lf; if (Lf > lHi) lHi = Lf;

        var Ng = Nold(Cf), Dg = Dold(Cf), Lg = lossOf(Ng, Dg);
        FRONT_OLD.push({ c: Cf, l: Lg, n: Ng, d: Dg });
        if (Lg < lLo) lLo = Lg; if (Lg > lHi) lHi = Lg;
      }

      var axis = { cMinExp: cMinExp, cMaxExp: cMaxExp, lMin: r3(lLo * 0.97), lMax: r3(lHi * 1.03) };

      // ---- pass 2: yield the animated build-up ------------------------------
      var modelsWork = MODEL_N.map(function (N, idx) {
        return { n: N, label: MODEL_LABEL[idx], color: MODEL_COLOR[idx], points: [], done: false };
      });
      var frontOpt = [];
      var frontOld = [];
      var budgetState = null;

      var snap = function (extra) {
        return Object.assign({
          axis: { cMinExp: axis.cMinExp, cMaxExp: axis.cMaxExp, lMin: axis.lMin, lMax: axis.lMax },
          models: modelsWork.map(function (m) {
            return { label: m.label, color: m.color, done: m.done, points: m.points.map(function (p) { return { c: p.c, l: p.l }; }) };
          }),
          frontierOptimal: frontOpt.map(function (p) { return { c: p.c, l: p.l, n: p.n, d: p.d }; }),
          frontierOld: frontOld.map(function (p) { return { c: p.c, l: p.l, n: p.n, d: p.d }; }),
          compareOn: compareOn,
          budget: budgetState
        }, extra || {});
      };

      yield {
        label: `Test loss follows a smooth power law in model size and training tokens: L(N,D) = ${E} + ${A}/N^0.34 + ${B}/D^0.34. Both axes below are log scale — a straight line here IS a power law.`,
        phase: "intro",
        state: snap({})
      };
      yield {
        label: `Training compute is approximated as C ≈ 6·N·D FLOPs (2 for the forward pass, 4 for backward, per parameter per token). Every point below is this formula evaluated directly at a real (N, D) pair — nothing here is simulated.`,
        phase: "intro",
        state: snap({})
      };

      for (var m = 0; m < modelsWork.length; m++) {
        var model = modelsWork[m];
        var floor = E + A / Math.pow(model.n, ALPHA);
        for (var d = 0; d < D_GRID.length; d++) {
          var pt = PTS[m][d];
          model.points.push({ c: pt.c, l: pt.l });
          var gap = r3(pt.l - floor);
          yield {
            label: `${model.label} model, ${fmtCount(D_GRID[d])} tokens → C = ${fmtSci(pt.c)} FLOPs, loss = ${r3(pt.l)}. Only ${gap} above the ${model.label} model's floor of ${r3(floor)} — the loss it would reach with infinite data at this size.`,
            phase: "model",
            focus: [m],
            state: snap({})
          };
        }
        model.done = true;
        yield {
          label: `${model.label} curve complete: it flattens toward ${r3(floor)} no matter how much longer you train it. More data can't fix a model that's simply too small — only more parameters raises that ceiling.`,
          phase: "model-done",
          focus: [m],
          state: snap({})
        };
      }

      yield {
        label: `Every model's curve eventually goes flat — that ceiling is set by N alone. But at any fixed compute budget several curves cross at different points; the lower envelope across ALL of them, not any single curve, is what you actually want to train on.`,
        phase: "envelope-intro",
        state: snap({})
      };

      for (var f = 0; f < FSTEPS; f++) {
        var fo = FRONT_OPT[f];
        frontOpt.push({ c: fo.c, l: fo.l, n: fo.n, d: fo.d });
        var ratio = r3(fo.d / fo.n);
        yield {
          label: `Compute-optimal frontier at C = ${fmtSci(fo.c)}: N* = ${fmtCount(fo.n)} params, D* = ${fmtCount(fo.d)} tokens — ${ratio} tokens per parameter, loss = ${r3(fo.l)}. That ratio barely moves as C grows: it's a CONSTANT, not a function of scale.`,
          phase: "frontier-optimal",
          state: snap({})
        };
      }
      yield {
        label: `Chinchilla's headline result, reproduced here from the formula itself: because the loss's parameter-count and token-count exponents come out nearly equal, the compute-optimal split is roughly ${r3(kD / kN)} tokens per parameter at EVERY compute budget — not a ratio that shifts as you scale up.`,
        phase: "frontier-optimal-done",
        state: snap({})
      };

      if (compareOn) {
        for (var f2 = 0; f2 < FSTEPS; f2++) {
          var fg = FRONT_OLD[f2];
          frontOld.push({ c: fg.c, l: fg.l, n: fg.n, d: fg.d });
          var ratioOld = r3(fg.d / fg.n);
          var optAtSame = FRONT_OPT[f2];
          var extra = r3(fg.l - optAtSame.l);
          yield {
            label: `Pre-Chinchilla (Kaplan-style) allocation at the same C = ${fmtSci(fg.c)}: N = ${fmtCount(fg.n)}, D = ${fmtCount(fg.d)} — only ${ratioOld} tokens/param. ${f2 === 0 ? "Identical to optimal here, at the smallest budget shown — the two allocations are anchored together." : "Loss is now " + extra + " nats/token WORSE than optimal — all those extra parameters are undertrained."}`,
            phase: "frontier-old",
            state: snap({})
          };
        }
        yield {
          label: `The two frontiers start together and split apart: growing N faster than D (exponent 0.73 vs the optimal 0.5) looks fine at small scale and gets steadily more wasteful as compute grows — exactly the gap that let a smaller, more-trained Chinchilla beat larger, under-trained models like Gopher at the SAME training compute.`,
          phase: "frontier-old-done",
          state: snap({})
        };
      }

      // ---- spotlight the user's chosen compute budget -----------------------
      var Cb = Math.pow(10, logC);
      var Nb = Nopt(Cb), Db = Dopt(Cb), Lb = lossOf(Nb, Db);
      var Nb2 = Nold(Cb), Db2 = Dold(Cb), Lb2 = lossOf(Nb2, Db2);
      budgetState = { c: Cb, logC: logC, opt: { n: Nb, d: Db, l: r3(Lb), ratio: r3(Db / Nb) }, old: { n: Nb2, d: Db2, l: r3(Lb2), ratio: r3(Db2 / Nb2) } };

      yield {
        label: `Your compute budget: C = 10^${logC} FLOPs (${fmtSci(Cb)}). Everything above is the map — this is where you'd actually land on it.`,
        phase: "budget",
        state: snap({})
      };
      yield {
        label: `Compute-optimal at this budget: ${fmtCount(Nb)} parameters trained on ${fmtCount(Db)} tokens (${r3(Db / Nb)} tokens/param), reaching loss ${r3(Lb)}.`,
        phase: "budget-optimal",
        state: snap({})
      };
      if (compareOn) {
        yield {
          label: `Pre-Chinchilla allocation at the SAME budget: ${fmtCount(Nb2)} parameters on only ${fmtCount(Db2)} tokens (${r3(Db2 / Nb2)} tokens/param) — loss ${r3(Lb2)}, which is ${r3(Lb2 - Lb)} nats/token worse for identical compute spend.`,
          phase: "budget-old",
          state: snap({})
        };
      }
      yield {
        label: `Same FLOPs, different split, different quality — that's the entire practical content of a scaling law: it tells you where to put the next marginal unit of compute before you spend it.`,
        phase: "done",
        state: snap({})
      };
    },

    draw: function (frame, ctx, env) {
      var s = frame.state;
      var C = env.colors;
      var W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      var axis = s.axis;
      var padL = 56, padR = 16, padT = 40, padB = 40;
      var legendH = 20;
      var plotX = padL, plotY = padT, plotW = W - padL - padR, plotH = H - padT - padB - legendH;

      function xOf(c) {
        var t = (Math.log10(c) - axis.cMinExp) / Math.max(1e-9, axis.cMaxExp - axis.cMinExp);
        t = Math.max(0, Math.min(1, t));
        return plotX + t * plotW;
      }
      function yOf(l) {
        var t = (Math.log(l) - Math.log(axis.lMin)) / Math.max(1e-9, Math.log(axis.lMax) - Math.log(axis.lMin));
        t = Math.max(0, Math.min(1, t));
        return plotY + (1 - t) * plotH;
      }

      // ---- plot background + border -----------------------------------------
      ctx.fillStyle = C.surface;
      ctx.fillRect(plotX, plotY, plotW, plotH);
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.strokeRect(plotX + 0.5, plotY + 0.5, plotW, plotH);

      // ---- x gridlines / ticks (log10 of compute) ----------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      for (var e = axis.cMinExp; e <= axis.cMaxExp; e++) {
        var x = xOf(Math.pow(10, e));
        ctx.strokeStyle = C.grid;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, plotY); ctx.lineTo(x, plotY + plotH);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = "9px " + env.font.mono;
        ctx.fillText("10" + supNum(e), x, plotY + plotH + 4);
      }

      // ---- y gridlines / ticks (loss, log scale) -----------------------------
      var CANDIDATES = [1.6, 1.7, 1.8, 1.9, 2, 2.2, 2.4, 2.6, 2.8, 3, 3.5, 4, 4.5, 5, 6, 7, 8, 10, 12, 15, 20];
      var ticks = [];
      for (var ci = 0; ci < CANDIDATES.length; ci++) {
        if (CANDIDATES[ci] >= axis.lMin * 0.98 && CANDIDATES[ci] <= axis.lMax * 1.02) ticks.push(CANDIDATES[ci]);
      }
      if (ticks.length > 7) {
        var thinned = [];
        for (var ti = 0; ti < ticks.length; ti += Math.ceil(ticks.length / 7)) thinned.push(ticks[ti]);
        ticks = thinned;
      }
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      for (var yi = 0; yi < ticks.length; yi++) {
        var y = yOf(ticks[yi]);
        ctx.strokeStyle = C.grid;
        ctx.beginPath();
        ctx.moveTo(plotX, y); ctx.lineTo(plotX + plotW, y);
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = "9px " + env.font.mono;
        ctx.fillText(ticks[yi].toFixed(ticks[yi] < 10 ? 1 : 0), plotX - 6, y);
      }

      function supNum(n) {
        var map = { "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹", "-": "⁻" };
        return String(n).split("").map(function (c) { return map[c] || c; }).join("");
      }

      // ---- axis titles --------------------------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text2;
      ctx.font = "10px " + env.font.base;
      ctx.fillText("training compute (FLOPs, log scale)", plotX + plotW / 2, H - legendH - 6);
      ctx.save();
      ctx.translate(14, plotY + plotH / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillText("test loss (nats/token, log scale)", 0, 0);
      ctx.restore();

      // ---- model curves ---------------------------------------------------
      for (var mi = 0; mi < s.models.length; mi++) {
        var model = s.models[mi];
        var col = C[model.color] || C.viz1;
        if (model.points.length >= 1) {
          ctx.strokeStyle = col;
          ctx.lineWidth = model.done ? 1.6 : 2.2;
          ctx.globalAlpha = model.done ? 0.55 : 1;
          ctx.beginPath();
          for (var pi = 0; pi < model.points.length; pi++) {
            var px = xOf(model.points[pi].c), py = yOf(model.points[pi].l);
            if (pi === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;

          var last = model.points[model.points.length - 1];
          var lx = xOf(last.c), ly = yOf(last.l);
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(lx, ly, model.done ? 2 : 3.4, 0, Math.PI * 2);
          ctx.fill();
          if (model.done) {
            ctx.fillStyle = C.text2;
            ctx.font = "9px " + env.font.mono;
            ctx.textAlign = "left";
            ctx.textBaseline = "middle";
            ctx.fillText(model.label, Math.min(lx + 6, plotX + plotW - 26), ly);
          }
        }
      }

      // ---- compute-optimal frontier ------------------------------------------
      if (s.frontierOptimal.length >= 2) {
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        for (var oi = 0; oi < s.frontierOptimal.length; oi++) {
          var ox = xOf(s.frontierOptimal[oi].c), oy = yOf(s.frontierOptimal[oi].l);
          if (oi === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
        }
        ctx.stroke();
      }

      // ---- pre-Chinchilla comparison frontier --------------------------------
      if (s.compareOn && s.frontierOld.length >= 2) {
        ctx.strokeStyle = C.viz8;
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (var gi2 = 0; gi2 < s.frontierOld.length; gi2++) {
          var gx = xOf(s.frontierOld[gi2].c), gy = yOf(s.frontierOld[gi2].l);
          if (gi2 === 0) ctx.moveTo(gx, gy); else ctx.lineTo(gx, gy);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // ---- compute-budget spotlight -------------------------------------------
      if (s.budget) {
        var bx = xOf(s.budget.c);
        ctx.strokeStyle = C.text2;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(bx, plotY); ctx.lineTo(bx, plotY + plotH);
        ctx.stroke();
        ctx.setLineDash([]);

        var oy2 = yOf(s.budget.opt.l);
        ctx.fillStyle = C.ok;
        ctx.beginPath();
        ctx.arc(bx, oy2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = C.surface;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        if (s.compareOn) {
          var dy2 = yOf(s.budget.old.l);
          ctx.fillStyle = C.danger;
          ctx.beginPath();
          ctx.arc(bx, dy2, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = C.surface;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }

      // ---- legend row ---------------------------------------------------------
      var ly2 = H - legendH + 2;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = "9px " + env.font.base;
      var lx2 = padL;
      function chip(color, text, dashed) {
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.4;
        if (dashed) ctx.setLineDash([4, 3]);
        ctx.beginPath();
        ctx.moveTo(lx2, ly2 + 5); ctx.lineTo(lx2 + 14, ly2 + 5);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.text2;
        ctx.fillText(text, lx2 + 18, ly2);
        lx2 += 18 + ctx.measureText(text).width + 16;
      }
      chip(C.viz1, "model sizes (100M–100B)", false);
      chip(C.accent, "compute-optimal frontier", false);
      if (s.compareOn) chip(C.viz8, "pre-Chinchilla allocation", true);
      if (s.budget) {
        ctx.fillStyle = C.ok;
        ctx.beginPath(); ctx.arc(lx2 + 5, ly2 + 5, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.text2;
        ctx.fillText("optimal @ budget", lx2 + 14, ly2);
        lx2 += 14 + ctx.measureText("optimal @ budget").width + 16;
        if (s.compareOn) {
          ctx.fillStyle = C.danger;
          ctx.beginPath(); ctx.arc(lx2 + 5, ly2 + 5, 4, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = C.text2;
          ctx.fillText("old @ budget", lx2 + 14, ly2);
        }
      }

      // ---- header --------------------------------------------------------------
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = C.text;
      ctx.font = "12px " + env.font.base;
      ctx.fillText("Test loss vs. training compute", padL, 18);
      ctx.fillStyle = C.muted;
      ctx.font = "10px " + env.font.mono;
      var info = s.budget ? "C = 10^" + s.budget.logC + " FLOPs   opt: " + fmtN(s.budget.opt.n) + " params / " + fmtN(s.budget.opt.d) + " tok (" + s.budget.opt.ratio + " tok/param)" : "log–log axes; each line is one model size trained on more and more tokens";
      ctx.fillText(info, padL, 32);

      function fmtN(x) {
        if (x >= 1e12) return (x / 1e12).toFixed(1) + "T";
        if (x >= 1e9) return (x / 1e9).toFixed(1) + "B";
        if (x >= 1e6) return (x / 1e6).toFixed(1) + "M";
        if (x >= 1e3) return (x / 1e3).toFixed(0) + "k";
        return String(Math.round(x));
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the Chinchilla parametric loss form.", a: "`L(N,D) = E + A/N^α + B/D^β` — irreducible entropy plus a model-capacity term plus a finite-data term.", tags: ["formula"] },
      { q: "What's the standard training-compute approximation?", a: "`C ≈ 6·N·D` FLOPs — 2 for the forward pass, 4 for backward, per parameter per token.", tags: ["compute"] },
      { q: "State Chinchilla's headline compute-optimal ratio.", a: "Roughly 20 tokens of training data per model parameter, with both N and D scaling as C^0.5 — a ratio that stays constant across compute budgets.", tags: ["core"] },
      { q: "Why do N* and D* scale with the same exponent?", a: "Because the loss's fitted exponents on N and D come out roughly equal, so minimizing loss at fixed compute puts the marginal FLOP equally into more parameters and more tokens, independent of the budget size.", tags: ["theory"] },
      { q: "Name one flaw in the original (Kaplan et al.) scaling-law fits.", a: "They didn't match each run's learning-rate decay schedule to its own compute budget, which understated shorter runs' true potential and biased the fitted optimum toward larger models at the expense of training tokens.", tags: ["history"] },
      { q: "GPT-3 has 175B params trained on ~300B tokens — is that compute-optimal by Chinchilla's rule?", a: "No — under 2 tokens/parameter, roughly 10x below the ~20 tokens/parameter Chinchilla found optimal. The model is substantially undertrained for its size.", tags: ["application"] },
      { q: "Why might you deliberately train past the Chinchilla-optimal point?", a: "To shrink the deployed model at a fixed quality target and cut inference cost — Chinchilla only minimizes training compute for a given loss, not lifetime serving cost.", tags: ["practice"] },
      { q: "What causes a loss curve to flatten instead of keep dropping?", a: "Approach to the irreducible entropy floor E (genuine unpredictability in language), or running out of unique high-quality tokens so additional epochs stop helping.", tags: ["core"] }
    ],
    sixtySecond: [
      "Derive, at a high level, why compute-optimal pretraining scales model size and data size at the same rate, and state the resulting tokens-per-parameter ratio.",
      "Explain why the original Kaplan-style scaling laws pointed toward parameter-heavy, undertrained models, and what Chinchilla changed."
    ]
  }
};
