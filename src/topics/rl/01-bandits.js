export default {
  id: "bandits",
  track: "rl",
  title: "Multi-Armed Bandits",
  difficulty: 1,
  minutes: 14,
  tags: ["exploration", "regret", "ucb", "epsilon-greedy"],

  explainer: [
    { type: "p", text: "A **k-armed bandit** is the smallest interesting decision problem: `k` actions, each paying a reward drawn from an unknown fixed distribution, and no state at all. There is nothing to plan around — the only difficulty is that you must *estimate* the arms while simultaneously *earning* from them. That tension is exploration vs exploitation in its purest form." },
    { type: "h3", text: "Value, estimate, regret" },
    { type: "p", text: "The true value of arm `a` is `q*(a) = E[R | A = a]`. Your estimate after `t` pulls is the sample mean `Q_t(a)`. Performance is measured not by reward but by **regret**: `L_T = T·q*(a*) − Σ_t q*(A_t)`, the reward you gave up by not always playing the best arm. Regret is what makes 'always pull arm 1' look as bad as it is." },
    { type: "callout", tone: "tip", text: "Keep the sample mean incrementally: `Q ← Q + (R − Q)/N`. That is already the RL update rule in miniature — *new estimate = old estimate + step-size × (target − old estimate)*. Swap `1/N` for a constant `α` and you have exponential recency weighting, which is what you want in a non-stationary bandit." },
    { type: "h3", text: "ε-greedy" },
    { type: "p", text: "With probability `1−ε` pull `argmax_a Q(a)`; with probability `ε` pull a uniformly random arm. It is trivially simple and surprisingly hard to beat, but its regret is **linear**: a fixed `ε` keeps wasting `ε·(k−1)/k` of every step forever, so `L_T ≈ c·ε·T`. Decaying `ε_t ∝ 1/t` recovers logarithmic regret but is fiddly to tune." },
    { type: "h3", text: "UCB — optimism in the face of uncertainty" },
    { type: "p", text: "UCB1 pulls `argmax_a [ Q(a) + c·sqrt(ln t / N(a)) ]`. The second term is a confidence radius: it is large for rarely-pulled arms and shrinks as `1/sqrt(N)`. So an arm is explored either because it looks good or because you are unsure — and each arm's bonus decays once it has been shown to be bad. Its regret is `O(k log T)`, provably near-optimal, with no random coin flips anywhere." },
    { type: "list", items: [
      "**Optimistic initialisation** — set `Q_0(a) = 5` when rewards are in `[0,1]`. Every pull is a disappointment, which forces a systematic sweep of all arms early. Free exploration, but only once, so it fails when the problem is non-stationary.",
      "**Thompson sampling** — keep a posterior per arm (Beta for Bernoulli rewards), sample one value from each, pull the argmax. Matches UCB's regret bound, usually beats it empirically, and drops straight into a Bayesian A/B testing story.",
      "**Gradient bandit** — softmax over learned preferences `H(a)`, updated by a REINFORCE-style rule with a baseline. This is the bridge to policy gradients (lesson 9)."
    ]},
    { type: "callout", tone: "pitfall", text: "The `sqrt(ln t / N(a))` term needs `N(a) > 0`. Every correct UCB implementation pulls each arm once before the formula is used — forgetting that gives a divide-by-zero or an arm that is never tried." },
    { type: "h3", text: "Why interviewers care" },
    { type: "p", text: "Bandits are the production-shaped part of RL: ad selection, recommendation slates, model-routing, hyper-parameter search, and LLM response A/B tests are all bandits. They are also where the RL vocabulary — value, estimate, exploration, regret, stationarity — is introduced without the complication of state or credit assignment." }
  ],

  complexity: {
    rows: [
      { operation: "One ε-greedy step", time: "O(k)", space: "O(k)", note: "argmax over arms; O(1) with a maintained max" },
      { operation: "One UCB1 step", time: "O(k)", space: "O(k)", note: "recompute bonus per arm each step" },
      { operation: "Regret over T steps (fixed ε)", time: "Θ(εT)", space: "—", note: "linear — never stops exploring" },
      { operation: "Regret over T steps (UCB1)", time: "O(k log T)", space: "—", note: "near information-theoretic lower bound" }
    ]
  },

  interview: {
    whyAsked: "It is the cleanest probe of whether you understand that a learning agent's cost is measured in regret, not in accuracy. Candidates who only know supervised learning try to 'estimate all the arms well'; the signal is whether you realise you must deliberately under-explore bad arms and that a fixed ε never stops paying for exploration.",
    followUps: [
      { q: "Why is ε-greedy's regret linear while UCB's is logarithmic?", a: "A fixed ε spends an ε fraction of every step on a uniformly random arm forever, so the per-step expected loss never goes to zero and total regret grows like εT. UCB's exploration is self-limiting: an arm's bonus sqrt(ln t / N(a)) shrinks as it is pulled, so a clearly bad arm stops being selected after O(log T) pulls, giving O(k log T) total." },
      { q: "How do you handle a non-stationary bandit?", a: "Drop the sample mean and use a constant step size: Q ← Q + α(R − Q), which weights recent rewards exponentially and never fully forgets how to adapt. Pair it with a floor on exploration (fixed ε or sliding-window UCB), because in a drifting world you genuinely do need to keep re-checking arms you had written off." },
      { q: "When would you pick Thompson sampling over UCB?", a: "When you have a natural prior or delayed/batched feedback. Thompson sampling only needs a posterior sample, so it handles batched decisions gracefully (each impression in a batch samples independently, giving natural diversity), while UCB is deterministic and will send an entire batch to one arm. Empirically it also matches or beats UCB with less tuning — no c to pick." },
      { q: "What breaks if you A/B test with a bandit?", a: "Adaptive allocation destroys the i.i.d. assumption behind standard t-tests: sample sizes are correlated with observed outcomes, so naive confidence intervals are biased and typically too narrow on the losing arm. If you need a valid inference at the end, use an explore-then-commit design, always-valid sequential p-values, or an inverse-propensity-weighted estimator." },
      { q: "Your bandit has a million arms. Now what?", a: "Tabular bandits scale in k, so you stop treating arms as atomic: give each an embedding and learn a value function over features — that is a contextual/linear bandit (LinUCB) with regret in the feature dimension d rather than k. Alternatively, impose structure and exploit it (a hierarchy of arms, or a monotone/Lipschitz reward over the arm space)." },
      { q: "Contextual bandit vs full RL — where is the line?", a: "A contextual bandit sees a state before acting but its action does not influence the next state, so there is no credit assignment across time and no bootstrapping; a one-step regression on the reward suffices. Full RL is needed exactly when your action changes the distribution of future states — that is when you need discounted returns and a Bellman equation." }
    ]
  },

  code: [
    { lang: "python", label: "ε-greedy and UCB1, tabular", code: "import numpy as np\n\ndef run_bandit(true_means, T, rule=\"ucb\", eps=0.1, c=2.0, rng=None):\n    rng = rng or np.random.default_rng(0)\n    k = len(true_means)\n    Q = np.zeros(k)          # value estimates\n    N = np.zeros(k)          # pull counts\n    best = true_means.max()\n    regret = np.zeros(T)\n\n    for t in range(1, T + 1):\n        if N.min() == 0:                       # pull each arm once first\n            a = int(np.argmin(N))\n        elif rule == \"eps\":\n            a = int(rng.integers(k)) if rng.random() < eps else int(np.argmax(Q))\n        else:                                  # UCB1\n            bonus = c * np.sqrt(np.log(t) / N)\n            a = int(np.argmax(Q + bonus))\n\n        r = float(rng.random() < true_means[a])   # Bernoulli reward\n        N[a] += 1\n        Q[a] += (r - Q[a]) / N[a]                 # incremental sample mean\n        regret[t - 1] = best - true_means[a]      # per-step regret\n\n    return Q, N, np.cumsum(regret)" },
    { lang: "python", label: "Thompson sampling (Bernoulli / Beta)", code: "def thompson(true_means, T, rng):\n    k = len(true_means)\n    alpha = np.ones(k)      # Beta(1,1) = uniform prior\n    beta  = np.ones(k)\n    for _ in range(T):\n        theta = rng.beta(alpha, beta)   # one posterior sample per arm\n        a = int(np.argmax(theta))\n        r = float(rng.random() < true_means[a])\n        alpha[a] += r\n        beta[a]  += 1 - r\n    return alpha / (alpha + beta)" },
    { lang: "python", label: "Non-stationary: constant step size", code: "# Sample mean gives every reward equal weight -> too slow to react to drift.\n# Constant alpha makes Q an exponentially weighted average of recent rewards:\n#   Q_n = (1-a)^n Q_0 + sum_i a (1-a)^(n-i) R_i\nQ[a] += alpha * (r - Q[a])      # alpha in (0, 1], e.g. 0.1" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 300 },

    params: [
      { key: "arms",   label: "Arms (k)",     type: "int", min: 3, max: 7, default: 5 },
      { key: "steps",  label: "Pulls (T)",    type: "int", min: 100, max: 1200, default: 400 },
      { key: "epsPct", label: "ε  (percent)", type: "int", min: 0, max: 50, default: 10 },
      { key: "c",      label: "UCB c (×0.5)", type: "int", min: 1, max: 6, default: 4 },
      { key: "seed",   label: "New bandit",   type: "seed" }
    ],

    frames: function* (params, rng) {
      const k = params.arms;
      const T = params.steps;
      const eps = params.epsPct / 100;
      const c = params.c * 0.5;

      // ---- the bandit ------------------------------------------------------
      const mu = [];
      for (let a = 0; a < k; a++) mu.push(0.12 + rng() * 0.76);
      const best = Math.max.apply(null, mu);
      const bestArm = mu.indexOf(best);

      // Common random numbers: both agents see the SAME reward if they pull the
      // same arm at the same step. That makes the race a fair comparison.
      // Columns 0..k-1 are the per-arm reward draws; column k is ε-greedy's coin
      // flip and column k+1 picks its uniform-random arm.
      const draws = [];
      for (let t = 0; t < T; t++) {
        const row = [];
        for (let a = 0; a < k + 2; a++) row.push(rng());
        draws.push(row);
      }

      const egQ = new Array(k).fill(0), egN = new Array(k).fill(0);
      const ucQ = new Array(k).fill(0), ucN = new Array(k).fill(0);
      let egRegret = 0, ucRegret = 0;
      const hT = [], hE = [], hU = [];

      const snap = (t, egPick, ucPick, note, phase) => ({
        label: note,
        phase: phase,
        focus: [egPick, ucPick],
        state: {
          t: t, k: k, eps: eps, c: c, bestArm: bestArm, best: best, T: T,
          mu: mu.slice(),
          egQ: egQ.slice(), egN: egN.slice(),
          ucQ: ucQ.slice(), ucN: ucN.slice(),
          ucBonus: ucN.map(n => (n > 0 && t > 0 ? c * Math.sqrt(Math.log(t) / n) : 0)),
          egSe: egN.map(n => (n > 0 ? 1 / Math.sqrt(n) * 0.5 : 0)),
          egPick: egPick, ucPick: ucPick,
          egRegret: egRegret, ucRegret: ucRegret,
          hT: hT.slice(), hE: hE.slice(), hU: hU.slice()
        }
      });

      yield snap(0, -1, -1,
        `A ${k}-armed Bernoulli bandit. Arm ${bestArm + 1} pays off ${(best * 100).toFixed(0)}% of the time — but the agents cannot see the true rates (the faint ticks). ε-greedy (ε=${eps.toFixed(2)}) races UCB1 (c=${c}).`,
        "init");

      const yieldEvery = Math.max(1, Math.round((T - 20) / 55));

      for (let t = 1; t <= T; t++) {
        const row = draws[t - 1];

        // ---- ε-greedy pick -------------------------------------------------
        let egA;
        let egWhy;
        if (t <= k) { egA = t - 1; egWhy = "seeding"; }
        else if (row[k] < eps) {
          egA = Math.min(k - 1, Math.floor(row[k + 1] * k));
          egWhy = "explore";
        } else {
          let bi = 0;
          for (let a = 1; a < k; a++) if (egQ[a] > egQ[bi]) bi = a;
          egA = bi; egWhy = "exploit";
        }

        // ---- UCB1 pick -----------------------------------------------------
        let ucA;
        if (t <= k) ucA = t - 1;
        else {
          let bi = 0, bv = -Infinity;
          for (let a = 0; a < k; a++) {
            const v = ucQ[a] + c * Math.sqrt(Math.log(t) / ucN[a]);
            if (v > bv) { bv = v; bi = a; }
          }
          ucA = bi;
        }

        const egR = row[egA] < mu[egA] ? 1 : 0;
        const ucR = row[ucA] < mu[ucA] ? 1 : 0;
        const ucQBefore = ucQ[ucA];
        const ucBonusBefore = ucN[ucA] > 0 ? c * Math.sqrt(Math.log(t) / ucN[ucA]) : 0;

        egN[egA] += 1; egQ[egA] += (egR - egQ[egA]) / egN[egA];
        ucN[ucA] += 1; ucQ[ucA] += (ucR - ucQ[ucA]) / ucN[ucA];
        egRegret += best - mu[egA];
        ucRegret += best - mu[ucA];

        const stride = Math.max(1, Math.round(T / 200));
        if (t <= 20 || t % stride === 0 || t === T) { hT.push(t); hE.push(egRegret); hU.push(ucRegret); }

        const show = t <= 20 || t % yieldEvery === 0 || t === T;
        if (!show) continue;

        let label;
        if (t <= k) {
          label = `t=${t}: both agents must pull every arm once — UCB's bonus sqrt(ln t / N) is undefined at N=0. Arm ${t} paid ${egR}/${ucR}.`;
        } else if (t <= 20) {
          label = `t=${t}: ε-greedy ${egWhy === "explore" ? "flipped an ε coin and explored" : "exploited"} arm ${egA + 1} (Q̂=${egQ[egA].toFixed(2)}). UCB picked arm ${ucA + 1} on Q̂=${ucQBefore.toFixed(2)} + bonus ${ucBonusBefore.toFixed(2)} = ${(ucQBefore + ucBonusBefore).toFixed(2)} — optimism, not certainty.`;
        } else {
          const gap = egRegret - ucRegret;
          label = `t=${t}: regret ε-greedy ${egRegret.toFixed(1)} vs UCB ${ucRegret.toFixed(1)}` +
            (gap > 0.5 ? ` — UCB is ${gap.toFixed(1)} reward ahead; its bonuses have collapsed on the bad arms while ε keeps paying ${(eps * 100).toFixed(0)}% of every step for random pulls.`
                       : gap < -0.5 ? ` — ε-greedy is ahead for now; UCB is still paying to certify the arms it has not ruled out.`
                       : ` — neck and neck; the gap opens up once UCB stops exploring and ε-greedy cannot.`);
        }
        yield snap(t, egA, ucA, label, t === T ? "done" : "run");
      }

      const egPullsBest = egN[bestArm], ucPullsBest = ucN[bestArm];
      yield snap(T, -1, -1,
        `After ${T} pulls: UCB played the best arm ${(100 * ucPullsBest / T).toFixed(0)}% of the time (regret ${ucRegret.toFixed(1)}), ε-greedy ${(100 * egPullsBest / T).toFixed(0)}% (regret ${egRegret.toFixed(1)}). ε-greedy's curve is a straight line — fixed ε means linear regret forever; UCB's is bending toward O(k log T).`,
        "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 20;
      const headH = 34;
      const panelH = Math.round((H - headH - pad) * 0.52);
      const panelY = headH;
      const panelW = (W - pad * 3) / 2;

      // ---------- header ----------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`t = ${S.t} / ${S.T}`, pad, 20);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`k=${S.k}   ε=${S.eps.toFixed(2)}   c=${S.c}   best arm = ${S.bestArm + 1} (μ=${S.best.toFixed(2)})`, pad + 76, 20);

      // ---------- one arm panel ---------------------------------------------
      const panel = (x0, title, Q, N, err, pick, col, errLabel) => {
        ctx.fillStyle = C.surface;
        ctx.beginPath(); ctx.roundRect(x0, panelY, panelW, panelH, 8); ctx.fill();
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x0 + .5, panelY + .5, panelW - 1, panelH - 1, 8); ctx.stroke();

        ctx.textAlign = "left";
        ctx.fillStyle = col;
        ctx.font = `12px ${env.font.base}`;
        ctx.fillText(title, x0 + 10, panelY + 16);

        const baseY = panelY + panelH - 26;
        const topY = panelY + 30;
        const plotH = baseY - topY;
        const slotW = (panelW - 24) / S.k;
        const barW = Math.min(30, slotW * 0.5);

        // baseline
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0 + 10, baseY + .5); ctx.lineTo(x0 + panelW - 10, baseY + .5); ctx.stroke();

        for (let a = 0; a < S.k; a++) {
          const cx = x0 + 12 + slotW * (a + 0.5);
          const q = Math.max(0, Math.min(1, Q[a]));
          const h = q * plotH;

          // selection halo
          if (a === pick) {
            ctx.fillStyle = C.viz4;
            ctx.globalAlpha = 0.18;
            ctx.beginPath(); ctx.roundRect(cx - slotW / 2 + 2, topY - 6, slotW - 4, plotH + 24, 6); ctx.fill();
            ctx.globalAlpha = 1;
          }

          // estimate bar
          ctx.fillStyle = col;
          ctx.globalAlpha = N[a] === 0 ? 0.25 : 1;
          ctx.beginPath(); ctx.roundRect(cx - barW / 2, baseY - h, barW, Math.max(1, h), 3); ctx.fill();
          ctx.globalAlpha = 1;

          // uncertainty whisker
          if (N[a] > 0 && err[a] > 0) {
            const e = Math.min(plotH, err[a] * plotH);
            const yTop = Math.max(topY - 8, baseY - h - e);
            const yBot = Math.min(baseY, baseY - h + e);
            ctx.strokeStyle = C.muted; ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.moveTo(cx, yTop); ctx.lineTo(cx, yBot);
            ctx.moveTo(cx - 5, yTop); ctx.lineTo(cx + 5, yTop);
            ctx.moveTo(cx - 5, yBot); ctx.lineTo(cx + 5, yBot);
            ctx.stroke();
          }

          // true mean tick
          const ty = baseY - Math.max(0, Math.min(1, S.mu[a])) * plotH;
          ctx.strokeStyle = a === S.bestArm ? C.viz7 : C.grid;
          ctx.lineWidth = a === S.bestArm ? 2 : 1.5;
          ctx.beginPath(); ctx.moveTo(cx - barW / 2 - 5, ty); ctx.lineTo(cx + barW / 2 + 5, ty); ctx.stroke();

          // labels
          ctx.textAlign = "center";
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = a === pick ? C.text : C.text2;
          ctx.fillText(N[a] > 0 ? Q[a].toFixed(2) : "—", cx, baseY - h - (N[a] > 0 && err[a] > 0 ? Math.min(plotH, err[a] * plotH) : 0) - 6);
          ctx.fillStyle = C.muted;
          ctx.fillText(`a${a + 1}`, cx, baseY + 12);
          ctx.fillText(`n=${N[a]}`, cx, baseY + 23);
        }

        ctx.textAlign = "right";
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(errLabel, x0 + panelW - 10, panelY + 16);
      };

      panel(pad, `ε-greedy   regret ${S.egRegret.toFixed(1)}`, S.egQ, S.egN, S.egSe, S.egPick, C.viz2, "whisker = ±0.5/√N");
      panel(pad * 2 + panelW, `UCB1   regret ${S.ucRegret.toFixed(1)}`, S.ucQ, S.ucN, S.ucBonus, S.ucPick, C.viz1, "whisker = ±c√(ln t/N)");

      // ---------- regret race ------------------------------------------------
      const gy0 = panelY + panelH + 16;
      const gy1 = H - 26;
      const gx0 = pad + 34, gx1 = W - pad;
      const gh = gy1 - gy0, gw = gx1 - gx0;

      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, gy0 - 8, W - pad * 2, gh + 22, 8); ctx.fill();

      const maxR = Math.max(1, S.egRegret, S.ucRegret) * 1.08;
      const maxT = Math.max(1, S.T);

      // grid + axes
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = gy1 - (gh * i) / 3;
        ctx.beginPath(); ctx.moveTo(gx0, y + .5); ctx.lineTo(gx1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "right";
        ctx.fillText(((maxR * i) / 3).toFixed(0), gx0 - 6, y + 3);
      }
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(gx0 + .5, gy0); ctx.lineTo(gx0 + .5, gy1); ctx.stroke();

      const line = (ys, col) => {
        if (S.hT.length < 2) return;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < S.hT.length; i++) {
          const x = gx0 + (S.hT[i] / maxT) * gw;
          const y = gy1 - (ys[i] / maxR) * gh;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      line(S.hE, C.viz2);
      line(S.hU, C.viz1);

      ctx.textAlign = "left";
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz2; ctx.fillText("■ ε-greedy", gx0 + 8, gy0 + 12);
      ctx.fillStyle = C.viz1; ctx.fillText("■ UCB1", gx0 + 78, gy0 + 12);
      ctx.fillStyle = C.muted; ctx.fillText("cumulative regret", gx0 + 140, gy0 + 12);
      ctx.textAlign = "right";
      ctx.fillText(`T = ${S.T}`, gx1, gy1 + 14);
    }
  },

  drill: {
    cards: [
      { q: "Define regret for a k-armed bandit.", a: "`L_T = T·q*(a*) − Σ_{t=1..T} q*(A_t)` — the expected reward lost relative to always pulling the best arm. Low regret, not accurate estimates, is the objective.", tags: ["definition"] },
      { q: "Write the incremental sample-mean update.", a: "`Q_{n+1} = Q_n + (1/n)(R_n − Q_n)`. General form: *new = old + step × (target − old)*. Replace `1/n` with constant `α` for non-stationary problems.", tags: ["update-rule"] },
      { q: "Write the UCB1 action-selection rule and say what each term does.", a: "`A_t = argmax_a [ Q_t(a) + c·sqrt(ln t / N_t(a)) ]`. First term = exploitation (current estimate); second = a confidence radius that grows slowly with `t` and shrinks as `1/sqrt(N(a))`, so under-sampled arms get explored automatically.", tags: ["ucb"] },
      { q: "Why is fixed-ε ε-greedy's regret linear in T?", a: "It explores uniformly on an ε fraction of steps forever, so per-step expected loss never decays: `L_T ≈ ε·T·(mean gap)`. UCB's exploration is self-extinguishing, giving `O(k log T)`.", tags: ["regret"] },
      { q: "How do you adapt a bandit to non-stationary rewards?", a: "Use a constant step size `α` (exponentially weighted recent average) instead of the sample mean, and keep a floor of exploration — sliding-window UCB, discounted UCB, or fixed ε — because arms you ruled out may become good again.", tags: ["non-stationary"] },
      { q: "One-line description of Thompson sampling.", a: "Keep a posterior over each arm's value (Beta for Bernoulli), draw one sample per arm, pull the argmax of the samples. Probability-matching exploration; matches UCB's regret bound with no tuning constant.", tags: ["thompson"] },
      { q: "What is optimistic initialisation and its failure mode?", a: "Initialise `Q_0` above any achievable reward so every pull disappoints and all arms get tried early. It only exploits once — after the initial sweep there is no exploration left, so it fails under drift.", tags: ["exploration"] },
      { q: "Contextual bandit vs full RL — the distinguishing property?", a: "In a contextual bandit the action does not affect the next state, so there is no long-horizon credit assignment and no bootstrapping — a per-step regression on reward is enough. Full RL is needed only when actions change the future state distribution.", tags: ["taxonomy"] }
    ],
    sixtySecond: [
      "Explain the exploration–exploitation trade-off using regret, and contrast ε-greedy with UCB1's regret behaviour.",
      "Explain UCB1's formula term by term and why it needs no random number generator."
    ]
  }
};
