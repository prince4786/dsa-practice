export default {
  id: "exploration",
  track: "rl",
  title: "Exploration vs Exploitation",
  difficulty: 2,
  minutes: 14,
  tags: ["exploration", "regret", "optimism", "intrinsic-motivation"],

  explainer: [
    { type: "p", text: "Every RL algorithm faces the same dilemma: the only way to find out whether an action is good is to take it, and every step spent finding out is a step not spent earning. Exploration is not a hack bolted onto learning — without it, the convergence theorems do not apply, because they all require that every state–action pair keeps being visited." },
    { type: "h3", text: "The four regimes of ε" },
    { type: "list", items: [
      "**ε = 0 (pure greedy)** — locks onto whichever arm looked good first. If the true best arm's first sample was unlucky, it is never tried again. Regret is linear and the agent is *confidently* wrong; this failure is silent because the loss curve looks fine.",
      "**ε = 0.01** — finds the best arm eventually, but slowly: with 10 arms it takes ~1000 steps to give each non-greedy arm a single exploratory pull. Best asymptotic reward of the fixed-ε family, worst early learning.",
      "**ε = 0.1** — the usual default. Fast to identify the best arm, then permanently gives up ~9% of its steps (ε·(k−1)/k) to random actions.",
      "**ε = 0.5** — learns the values beautifully and earns terribly. Excellent for *evaluation*, useless as a deployed policy."
    ]},
    { type: "callout", tone: "tip", text: "Fixed ε always has linear regret; the per-step loss never decays. Any method with sublinear regret must make its exploration *self-extinguishing* — decayed ε (`ε_t ∝ 1/t`, giving GLIE), confidence bonuses that shrink as `1/√N`, or a posterior that concentrates. That is the single unifying idea behind UCB, Thompson sampling and count-based bonuses." },
    { type: "h3", text: "Beyond ε: better exploration" },
    { type: "list", items: [
      "**Optimistic initialisation** — set `Q₀ = R_max/(1−γ)`. Untried actions look best, so exploration is systematic and free. But it is a one-shot effect: after the initial sweep there is no drive left, so it fails on non-stationary problems and on deep exploration.",
      "**UCB / count bonuses** — `Q(s,a) + c√(ln t / N(s,a))`, or in deep RL `r + β/√N(s)` with pseudo-counts from a density model. Directed, and provably efficient in the tabular case.",
      "**Thompson sampling / posterior sampling** — sample a plausible world from the posterior and act optimally in it. Naturally handles batched and delayed feedback; the deep analogue is bootstrapped DQN with randomised value functions.",
      "**Entropy regularisation** — add `+ αH(π(·|s))` to the objective (SAC, PPO's entropy bonus). Keeps the policy stochastic, prevents premature collapse, and gives a differentiable exploration knob.",
      "**Intrinsic motivation** — curiosity (prediction error of a learned dynamics model), RND (error against a fixed random network), or count-based novelty. This is what solves sparse-reward exploration problems like Montezuma's Revenge."
    ]},
    { type: "callout", tone: "pitfall", text: "ε-greedy is **undirected**: it explores uniformly at random, so reaching a state that requires 20 specific correct actions in a row has probability ~(ε/|A|)²⁰. That is why 'add more exploration noise' never solves a hard-exploration problem — you need *deep* (directed, temporally extended) exploration, not more dithering." },
    { type: "h3", text: "How you tell exploration failure from learning failure" },
    { type: "p", text: "Log state–action visitation counts, not just returns. A flat learning curve with high visitation means your algorithm or representation is wrong; a flat curve with near-zero visitation of most of the space means you never gathered the data, and no amount of tuning α or the network will help." }
  ],

  complexity: {
    rows: [
      { operation: "Regret, fixed ε", time: "Θ(ε·T)", space: "O(k)", note: "linear — exploration never stops" },
      { operation: "Regret, ε_t ∝ 1/t (GLIE)", time: "O(k log T)", space: "O(k)", note: "requires careful tuning of the constant" },
      { operation: "Regret, UCB1 / Thompson", time: "O(k log T)", space: "O(k)", note: "near the Lai–Robbins lower bound" },
      { operation: "Steps for ε-greedy to try each arm once", time: "≈ k/ε", space: "—", note: "ε=0.01, k=10 ⇒ ~1000 steps" }
    ]
  },

  interview: {
    whyAsked: "Interviewers use it to see whether you can debug a stalled agent. The distinguishing skill is separating 'the learner is broken' from 'the learner never saw the data', and knowing that uniform random noise is not exploration in any hard problem.",
    followUps: [
      { q: "Why does ε = 0 sometimes work and sometimes fail catastrophically?", a: "With deterministic, dense rewards, greedy from optimistic or well-initialised values may cover enough of the space. With noisy rewards it can lock onto an arm whose first sample was lucky and never revisit the truth — regret is linear and, worse, the failure is silent because the agent's own estimates look consistent with its behaviour." },
      { q: "Compare ε-greedy, optimistic initialisation, UCB and Thompson sampling.", a: "ε-greedy: undirected, linear regret at fixed ε, trivially simple. Optimistic init: free systematic exploration once, then nothing — fails under non-stationarity. UCB: directed by uncertainty, deterministic, O(k log T) regret, needs c tuned and counts maintained. Thompson: samples from a posterior, matches UCB's bound, handles batching and delayed feedback more gracefully, needs a tractable posterior." },
      { q: "What is 'deep exploration' and why doesn't ε-greedy provide it?", a: "Deep exploration means committing to a temporally extended plan whose value is uncertain — going somewhere new and staying there long enough to learn. ε-greedy dithers independently at each step, so the probability of executing a specific 20-step novel sequence decays exponentially. Randomised value functions (bootstrapped DQN), posterior sampling and intrinsic-reward bonuses provide directed exploration instead." },
      { q: "How do you explore in a continuous action space?", a: "Add structured noise to a deterministic policy (Ornstein–Uhlenbeck or Gaussian in DDPG/TD3), or learn a stochastic policy whose entropy is explicitly rewarded (SAC's maximum-entropy objective, with an automatically tuned temperature to hold entropy at a target). Parameter-space noise — perturbing weights rather than actions — gives more temporally consistent exploration." },
      { q: "Your agent's return curve is flat. How do you decide whether it's exploration?", a: "Instrument coverage: state-visitation histograms, the fraction of (s,a) pairs ever tried, action-distribution entropy over time, and the novelty/intrinsic-reward signal. Low coverage plus a collapsed action entropy means premature exploitation; broad coverage with a flat curve means the credit assignment, representation, or reward is the problem." },
      { q: "How does exploration appear in RLHF?", a: "Mostly as entropy and KL control rather than explicit exploration bonuses: the sampling temperature sets how diverse the rollouts are, and the KL penalty to the reference policy keeps the policy from collapsing onto a narrow set of reward-hacking outputs. Mode collapse in an RLHF'd model is exactly premature exploitation." }
    ]
  },

  code: [
    { lang: "python", label: "Four exploration strategies, one loop", code: "import numpy as np\n\ndef bandit_run(q_star, T, rule, rng, eps=0.1, c=2.0, q0=0.0, alpha=None):\n    k = len(q_star)\n    Q = np.full(k, float(q0))     # q0 > max reward  ->  optimistic init\n    N = np.zeros(k)\n    best = q_star.argmax()\n    regret, optimal = np.zeros(T), np.zeros(T)\n\n    for t in range(1, T + 1):\n        if rule == \"eps\":\n            a = int(rng.integers(k)) if rng.random() < eps else int(Q.argmax())\n        elif rule == \"decay\":                     # GLIE: eps_t ~ 1/t\n            e = 1.0 / (1.0 + t / 100.0)\n            a = int(rng.integers(k)) if rng.random() < e else int(Q.argmax())\n        elif rule == \"ucb\":\n            if N.min() == 0:\n                a = int(N.argmin())\n            else:\n                a = int(np.argmax(Q + c * np.sqrt(np.log(t) / N)))\n        else:                                      # pure greedy / optimistic\n            a = int(Q.argmax())\n\n        r = q_star[a] + rng.normal()               # Gaussian reward, unit variance\n        N[a] += 1\n        Q[a] += (alpha if alpha else 1.0 / N[a]) * (r - Q[a])\n        regret[t - 1] = q_star[best] - q_star[a]\n        optimal[t - 1] = float(a == best)\n\n    return np.cumsum(regret), optimal.cumsum() / np.arange(1, T + 1), N" },
    { lang: "python", label: "Count-based bonus in a tabular MDP", code: "# Directed exploration: make novelty part of the reward.\nN = np.zeros((nS, nA))\n\ndef step_with_bonus(s, a, r, beta=0.5):\n    N[s, a] += 1\n    return r + beta / np.sqrt(N[s, a])     # bonus decays as 1/sqrt(count)\n\n# Deep-RL version: pseudo-counts from a density model, or RND —\n#   intrinsic_reward = || f_random(s) - f_predictor(s) ||^2\n# which is large for states the predictor has not been trained on." },
    { lang: "python", label: "Entropy-regularised objective (SAC-style)", code: "# Maximise reward AND policy entropy: J = E[ sum_t r_t + alpha * H(pi(.|s_t)) ]\nlogp = dist.log_prob(a)\nactor_loss = (alpha * logp - q_min).mean()          # entropy term keeps pi stochastic\n\n# Auto-tune alpha to hold entropy at a target (e.g. -dim(A)):\nalpha_loss = -(log_alpha * (logp + target_entropy).detach()).mean()" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 250 },

    params: [
      { key: "arms",    label: "Arms (k)",   type: "int", min: 4, max: 10, default: 8 },
      { key: "steps",   label: "Steps (T)",  type: "int", min: 200, max: 2000, default: 1000 },
      { key: "compare", label: "Compare",    type: "enum", options: ["ε = 0 / .01 / .1 / .5", "ε=.1 vs optimistic vs UCB vs decaying ε"], default: "ε = 0 / .01 / .1 / .5" },
      { key: "seed",    label: "New bandit", type: "seed" }
    ],

    frames: function* (params, rng) {
      const k = params.arms, T = params.steps;
      const gauss = () => {
        const u = Math.max(1e-12, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const qStar = [];
      for (let a = 0; a < k; a++) qStar.push(gauss());
      let best = 0;
      for (let a = 1; a < k; a++) if (qStar[a] > qStar[best]) best = a;

      const modeA = params.compare.indexOf("ε = 0") === 0;
      const agents = modeA
        ? [
            { name: "ε = 0", rule: "eps", eps: 0, q0: 0 },
            { name: "ε = 0.01", rule: "eps", eps: 0.01, q0: 0 },
            { name: "ε = 0.1", rule: "eps", eps: 0.1, q0: 0 },
            { name: "ε = 0.5", rule: "eps", eps: 0.5, q0: 0 }
          ]
        : [
            { name: "ε = 0.1", rule: "eps", eps: 0.1, q0: 0 },
            { name: "optimistic Q₀=5, ε=0", rule: "eps", eps: 0, q0: 5 },
            { name: "UCB c=2", rule: "ucb", eps: 0, q0: 0, c: 2 },
            { name: "decaying ε=1/(1+t/100)", rule: "decay", eps: 0, q0: 0 }
          ];
      const M = agents.length;
      for (const ag of agents) {
        ag.Q = new Array(k).fill(ag.q0);
        ag.N = new Array(k).fill(0);
        ag.regret = 0;
        ag.opt = 0;
        ag.lastA = -1;
        ag.lastEps = ag.eps;
      }

      const hT = [];
      const hR = [];
      for (let i = 0; i < M; i++) hR.push([]);

      const snap = (t, label, phase) => ({
        label: label, phase: phase, focus: agents.map(a => a.lastA),
        state: {
          k: k, T: T, t: t, qStar: qStar.slice(), best: best,
          names: agents.map(a => a.name),
          counts: agents.map(a => a.N.slice()),
          Q: agents.map(a => a.Q.slice()),
          regret: agents.map(a => a.regret),
          optPct: agents.map(a => (t > 0 ? a.opt / t : 0)),
          lastA: agents.map(a => a.lastA),
          eps: agents.map(a => a.lastEps),
          hT: hT.slice(), hR: hR.map(x => x.slice()), modeA: modeA
        }
      });

      yield snap(0,
        `A ${k}-armed Gaussian bandit: q*(a) ~ N(0,1), rewards r ~ N(q*(a), 1). Arm ${best + 1} is best at ${qStar[best].toFixed(2)}. Four exploration schedules run on the same bandit — same problem, same reward noise, different appetites for information.`,
        "init");

      const stride = Math.max(1, Math.round(T / 200));
      const yieldEvery = Math.max(1, Math.round((T - 12) / 60));

      for (let t = 1; t <= T; t++) {
        for (let i = 0; i < M; i++) {
          const ag = agents[i];
          let a;
          let epsNow = ag.eps;
          if (ag.rule === "ucb") {
            let un = -1;
            for (let x = 0; x < k; x++) if (ag.N[x] === 0) { un = x; break; }
            if (un >= 0) a = un;
            else {
              let bi = 0, bv = -Infinity;
              for (let x = 0; x < k; x++) {
                const v = ag.Q[x] + ag.c * Math.sqrt(Math.log(t) / ag.N[x]);
                if (v > bv) { bv = v; bi = x; }
              }
              a = bi;
            }
          } else {
            if (ag.rule === "decay") epsNow = 1 / (1 + t / 100);
            if (rng() < epsNow) a = Math.min(k - 1, Math.floor(rng() * k));
            else {
              let bi = 0;
              for (let x = 1; x < k; x++) if (ag.Q[x] > ag.Q[bi]) bi = x;
              a = bi;
            }
          }
          const r = qStar[a] + gauss();
          ag.N[a] += 1;
          ag.Q[a] += (r - ag.Q[a]) / ag.N[a];
          ag.regret += qStar[best] - qStar[a];
          if (a === best) ag.opt += 1;
          ag.lastA = a;
          ag.lastEps = epsNow;
        }

        if (t <= 12 || t % stride === 0 || t === T) {
          hT.push(t);
          for (let i = 0; i < M; i++) hR[i].push(agents[i].regret);
        }

        if (t <= 12 || t % yieldEvery === 0 || t === T) {
          let label;
          if (t <= 12) {
            label = `t=${t}: ` + agents.map(a => `${a.name} pulled arm ${a.lastA + 1}`).join(", ") + `. Nothing is known yet — every schedule is essentially guessing.`;
          } else {
            const lead = agents.map((a, i) => [a.regret, i]).sort((x, y) => x[0] - y[0])[0];
            label = `t=${t}: cumulative regret — ` + agents.map(a => `${a.name}: ${a.regret.toFixed(1)}`).join("   ") +
              `. Lowest regret: ${agents[lead[1]].name}. ` +
              (modeA
                ? (t < T * 0.3
                    ? "ε=0.5 is learning the arm values fastest and paying the most for it; ε=0 may already be stuck on whatever looked good first."
                    : "The curves are now straight lines with slope ε·(k−1)/k·(mean gap) — fixed ε means the exploration tax never stops.")
                : "Optimism and UCB stop exploring on their own as counts grow; fixed ε=0.1 keeps paying the same tax forever, which shows up as a persistently steeper line.");
          }
          yield snap(t, label, t === T ? "done" : "run");
        }
      }

      const pctOpt = agents.map(a => (100 * a.opt / T).toFixed(0));
      yield snap(T,
        `After ${T} steps: % optimal action — ` + agents.map((a, i) => `${a.name}: ${pctOpt[i]}%`).join(", ") +
        `. The pull histograms are the real story: ${modeA ? "ε=0 concentrated everything on one arm (possibly the wrong one), while ε=0.5 spread pulls almost uniformly and never committed." : "UCB and optimism allocate their pulls proportionally to uncertainty and then stop, while fixed ε keeps sprinkling pulls on arms it has already ruled out."}`,
        "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;
      const SER = [C.viz1, C.viz2, C.viz4, C.viz5];

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`t = ${S.t} / ${S.T}`, pad, 15);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`k = ${S.k}   best arm ${S.best + 1} (q* = ${S.qStar[S.best].toFixed(2)})`, pad + 80, 15);

      const bodyY = pad + 24, bodyH = H - bodyY - pad;
      const leftW = (W - pad * 3) * 0.56;

      // ---------- regret curves ----------------------------------------------
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, bodyY, leftW, bodyH, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(pad + .5, bodyY + .5, leftW - 1, bodyH - 1, 8); ctx.stroke();

      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("cumulative regret", pad + 10, bodyY + 14);

      const ax0 = pad + 44, ax1 = pad + leftW - 12;
      const ay0 = bodyY + 22, ay1 = bodyY + bodyH - 58;
      let maxR = 1;
      for (const r of S.regret) maxR = Math.max(maxR, r);
      maxR *= 1.1;

      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = ay1 - (i / 4) * (ay1 - ay0);
        ctx.beginPath(); ctx.moveTo(ax0, y + .5); ctx.lineTo(ax1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(((maxR * i) / 4).toFixed(0), ax0 - 4, y + 3);
      }
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(ax0 + .5, ay0); ctx.lineTo(ax0 + .5, ay1); ctx.stroke();

      for (let i = 0; i < S.hR.length; i++) {
        const ys = S.hR[i];
        if (ys.length < 2) continue;
        ctx.strokeStyle = SER[i % SER.length]; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let j = 0; j < ys.length; j++) {
          const x = ax0 + (S.hT[j] / S.T) * (ax1 - ax0);
          const y = ay1 - (ys[j] / maxR) * (ay1 - ay0);
          if (j === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // legend + % optimal
      ctx.textAlign = "left";
      for (let i = 0; i < S.names.length; i++) {
        const y = ay1 + 18 + Math.floor(i / 2) * 16;
        const x = pad + 12 + (i % 2) * (leftW / 2);
        ctx.fillStyle = SER[i % SER.length];
        ctx.fillRect(x, y - 7, 9, 9);
        ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(`${S.names[i]}  ${(S.optPct[i] * 100).toFixed(0)}% opt`, x + 14, y + 1);
      }

      // ---------- pull-count histograms ---------------------------------------
      const rx = pad * 2 + leftW, rw = W - rx - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(rx, bodyY, rw, bodyH, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(rx + .5, bodyY + .5, rw - 1, bodyH - 1, 8); ctx.stroke();

      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("pulls per arm (★ = truly best arm)", rx + 10, bodyY + 14);

      const rowH = (bodyH - 26) / S.names.length;
      for (let i = 0; i < S.names.length; i++) {
        const y0 = bodyY + 20 + i * rowH;
        ctx.fillStyle = SER[i % SER.length];
        ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
        ctx.fillText(S.names[i], rx + 10, y0 + 11);

        const base = y0 + rowH - 14;
        const hMax = rowH - 30;
        const slot = (rw - 24) / S.k;
        let mx = 1;
        for (const c of S.counts[i]) mx = Math.max(mx, c);
        for (let a = 0; a < S.k; a++) {
          const x = rx + 12 + a * slot;
          const h = Math.max(1, (S.counts[i][a] / mx) * hMax);
          ctx.fillStyle = a === S.best ? C.viz6 : (a === S.lastA[i] ? SER[i % SER.length] : C.grid);
          ctx.fillRect(x + 1, base - h, Math.max(2, slot - 3), h);
          if (slot > 22) {
            ctx.fillStyle = C.muted; ctx.font = `8px ${env.font.mono}`; ctx.textAlign = "center";
            ctx.fillText(String(S.counts[i][a]), x + slot / 2, base + 9);
          }
        }
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(rx + 12, base + .5); ctx.lineTo(rx + rw - 12, base + .5); ctx.stroke();
        // star the best arm
        ctx.fillStyle = C.viz6; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText("★", rx + 12 + S.best * slot + slot / 2, y0 + 11);
      }
    }
  },

  drill: {
    cards: [
      { q: "Why does any fixed ε give linear regret?", a: "It spends an ε fraction of every step on a uniformly random action forever, so the expected per-step loss `ε·(k−1)/k·(mean gap)` never decays and cumulative regret grows like `εT`.", tags: ["regret"] },
      { q: "What must exploration do to achieve sublinear regret?", a: "It must be self-extinguishing: decayed ε (GLIE, `ε_t ∝ 1/t`), confidence bonuses that shrink as `1/√N`, or a posterior that concentrates. Uncertainty must drive it, and uncertainty must decrease with data.", tags: ["theory"] },
      { q: "What is optimistic initialisation and its failure mode?", a: "Initialise `Q₀` above any achievable value (`R_max/(1−γ)`) so untried actions look best. It gives free systematic early exploration but is a one-shot effect — no drive remains afterwards, so it fails under non-stationarity or hard/deep exploration.", tags: ["optimism"] },
      { q: "What is 'deep exploration' and why is ε-greedy bad at it?", a: "Committing to a temporally extended novel plan. ε-greedy dithers independently per step, so executing a specific 20-step novel sequence has probability ~(ε/|A|)²⁰. You need directed methods: posterior/randomised value sampling, intrinsic rewards, options.", tags: ["deep-exploration"] },
      { q: "Name three exploration methods used in deep RL.", a: "Entropy regularisation (SAC/PPO bonus), intrinsic-reward novelty (RND, curiosity, pseudo-counts), and randomised value functions (bootstrapped DQN / NoisyNet). Parameter-space noise is a fourth, giving temporally consistent behaviour.", tags: ["deep-rl"] },
      { q: "How do you diagnose whether a flat learning curve is an exploration failure?", a: "Log coverage, not just return: state–action visitation counts, fraction of pairs ever tried, policy entropy over time, intrinsic-reward magnitude. Low coverage + collapsed entropy = premature exploitation; broad coverage + flat return = a credit-assignment/representation problem.", tags: ["debugging"] },
      { q: "How many steps does ε-greedy need to try every arm at least once?", a: "About `k/ε` in expectation (each step explores with probability ε and picks uniformly among k). With ε=0.01 and k=10 that is ~1000 steps — which is why tiny ε is so slow early on.", tags: ["intuition"] },
      { q: "Where does exploration show up in RLHF?", a: "As sampling temperature and the entropy/KL terms rather than explicit bonuses. The KL leash to the reference policy prevents collapse onto a narrow reward-hacking mode; mode collapse in an RLHF'd model is premature exploitation.", tags: ["llm"] }
    ],
    sixtySecond: [
      "Explain why fixed-ε exploration has linear regret and what any sublinear method must do differently.",
      "Explain deep exploration: why ε-greedy fails at it and what actually works."
    ]
  }
};
