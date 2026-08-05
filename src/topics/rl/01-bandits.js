export default {
  id: "bandits",
  track: "rl",
  title: "Multi-Armed Bandits",
  difficulty: 1,
  minutes: 14,
  tags: ["exploration", "regret", "ucb", "epsilon-greedy"],

  explainer: [
    { type: "p", text: "Imagine a row of slot machines in a casino. Each one pays out a random reward, and each one has its own hidden, fixed average payout that never changes while you play. You can only pull one machine at a time, and you want to walk away with as much money as possible. This is the **multi-armed bandit** problem — 'arm' is just casino slang for one of the machines (or, in general, one of the actions you can choose). It is the simplest problem in reinforcement learning because there is no changing situation to react to: no board position, no current room in a maze, nothing. There is just a fixed set of options and random payouts. The one genuinely hard part is that you do not know each machine's true average payout in advance, so you have to spend some pulls figuring that out — this is called **exploring** — while also spending pulls cashing in on the machine you currently believe is best — this is called **exploiting**. Every pull is a trade-off between the two. That trade-off, exploration versus exploitation, is the core idea this whole lesson teaches, and it reappears, in a harder form, in every other reinforcement-learning algorithm later in this track." },
    { type: "h3", text: "How do you measure whether an agent is doing well?" },
    { type: "p", text: "Every arm `a` has a true long-run average payout. We write it `q*(a)` — read it as 'the true value of arm a', the number you would converge to if you pulled that one arm forever. You never get to see `q*(a)` directly; you only see the individual random rewards that come back each time you pull. So as you play, you keep a running average of what each arm has actually paid you so far, and call that your **estimate**, written `Q_t(a)` — your best guess at arm `a`'s value after `t` total pulls." },
    { type: "p", text: "How do you tell whether an agent's strategy is good? Not by its total winnings alone — a lucky run can flatter a bad strategy. Instead, reinforcement learning scores an agent by **regret**: the total reward it gave up compared to an imaginary perfect player who somehow knew the best arm from pull one and always played it. Written out, `L_T = T·q*(a*) − Σ_t q*(A_t)`: that is, `T` (the total number of pulls) times the best arm's true value, minus the sum, over every pull you actually made, of the true value of the arm you picked on that pull. A strategy that keeps wasting pulls on bad arms racks up regret forever; a good strategy's regret grows slower and slower, ideally leveling off almost completely." },
    { type: "callout", tone: "tip", text: "You do not need to store every past reward to keep this running average — there is a cheap incremental formula: `Q ← Q + (R − Q)/N`, meaning 'new estimate equals old estimate, nudged by the gap between the reward you just got and the old estimate, scaled down by how many times you've pulled this arm (N).' This exact shape — *new estimate = old estimate + step-size × (target − old estimate)* — is the update rule you will see again and again throughout reinforcement learning, all the way through Q-learning and beyond. If you swap the shrinking `1/N` for a small constant `α` (alpha), recent rewards count more than old ones, which is exactly what you want when the arms' true payouts can drift over time (a **non-stationary** bandit)." },
    { type: "h3", text: "ε-greedy: the simplest strategy" },
    { type: "p", text: "**ε-greedy** (epsilon-greedy) is the most obvious strategy you could write: most of the time, pull whichever arm currently has the highest estimate (this is called acting **greedily**); but with some small probability `ε` (epsilon — just a number between 0 and 1, like 0.1), ignore your estimates entirely and pull a uniformly random arm instead, purely to keep learning. It is trivially simple to implement and, in practice, surprisingly hard to beat. But it has a real weakness: because `ε` never changes, the agent keeps randomly exploring forever, even after it has figured out which arm is best. That wasted exploration adds up without bound, so its regret grows **linearly** with the number of pulls — roughly `L_T ≈ c·ε·T` for some constant `c`. You can fix this by shrinking `ε` over time (for example `ε_t ∝ 1/t`, meaning epsilon gets smaller the longer you've been playing), which brings regret growth down to logarithmic, but tuning exactly how fast to shrink it is fiddly." },
    { type: "h3", text: "UCB: be optimistic about what you don't know" },
    { type: "p", text: "**UCB** stands for Upper Confidence Bound, and its whole philosophy is 'optimism in the face of uncertainty': if you are not sure how good an arm is, assume it might secretly be great, and try it — the uncertainty itself becomes a reason to explore, so you never need to flip a random coin. The rule, UCB1, picks the arm that maximizes `Q(a) + c·sqrt(ln t / N(a))`. The first term, `Q(a)`, is just your current estimate — how good you think the arm is. The second term is a **confidence bonus** (or confidence radius): it starts large for arms you have barely tried (small `N(a)`, the pull count) and shrinks as `1/sqrt(N(a))` the more you pull that arm. `c` is a constant you tune to control how much weight to give uncertainty, and `ln t` is the natural logarithm of the total pull count, which grows the bonus very slowly over time so that even well-explored arms occasionally get rechecked. Put together: an arm gets pulled either because its estimate looks good, or because you genuinely don't know enough about it yet — and once an arm has clearly proven itself bad, its bonus has shrunk enough that it stops being picked. UCB1's regret grows as `O(k log T)` (with `k` the number of arms), which is provably close to the best any algorithm can do." },
    { type: "list", items: [
      "**Optimistic initialization** — before you've pulled anything, set every arm's starting estimate artificially high (for example `Q_0(a) = 5` when real rewards only ever fall in `[0,1]`). Every actual pull then comes as a disappointment relative to that inflated starting guess, which forces the agent to sweep through every arm early on before settling down. It gives you exploration for free, but only once — after that initial sweep there is nothing left pushing the agent to keep checking arms, so it fails if the problem later changes (is non-stationary).",
      "**Thompson sampling** — instead of a single number estimate per arm, keep a full probability distribution (a **belief**, formally called a **posterior**) over how good each arm might be, and update that belief every time you get new data. On each turn, draw one random guess from each arm's belief distribution, and pull whichever arm's guess came out highest. This matches UCB's regret guarantee, often beats it in practice, and maps naturally onto Bayesian A/B testing, which interviewers sometimes ask about directly.",
      "**Gradient bandit** — instead of estimating each arm's value directly, learn a relative preference score `H(a)` for each arm, turn those scores into pull probabilities with a softmax (a function that converts a list of numbers into probabilities that sum to 1, favoring the largest numbers), and nudge the preferences up or down after each pull using a REINFORCE-style update (a rule that increases the preference for actions that outperformed a baseline expectation, and decreases it for those that underperformed). This is the same family of idea used by full policy-gradient methods in lesson 9, just in miniature."
    ]},
    { type: "callout", tone: "pitfall", text: "UCB1's confidence-bonus term `sqrt(ln t / N(a))` divides by `N(a)`, the number of times arm `a` has been pulled — so it is undefined (division by zero) the very first time an arm hasn't been tried yet. Every correct implementation handles this by pulling each arm exactly once at the start, before ever applying the formula. Skip that step and you either crash on a divide-by-zero or accidentally leave one arm permanently untried." },
    { type: "h3", text: "Why interviewers care about bandits" },
    { type: "p", text: "Bandits are the part of reinforcement learning that looks most like real production systems: choosing which ad to show, which item to put first in a recommendation list, which backend model to route a request to, which hyperparameter setting to try next, or which of two LLM response styles to A/B test — all of these are bandit problems, because the choice you make now doesn't change what 'state' you're in next. Bandits are also where the core RL vocabulary — value, estimate, exploration, exploitation, regret, stationarity — gets introduced in its purest form, before later lessons add the complications of a changing environment (state) and having to give credit to actions for rewards that arrive many steps later." }
  ],

  glossary: [
    { term: "Arm", plain: "One of the options you can choose in a bandit problem — named after the lever on a slot machine. Pulling an arm gives you a random reward." },
    { term: "Reward", plain: "The number you receive back after taking an action. Higher is better; the agent's whole goal is to earn as much of this as possible." },
    { term: "Exploration vs. exploitation", plain: "Exploration means trying an option to learn more about it. Exploitation means picking the option you currently believe is best. Every action is a choice between the two." },
    { term: "q*(a) — true value", plain: "The real, hidden, long-run average payout of arm `a`. This is the number the agent is trying to figure out, but it never gets to see it directly." },
    { term: "Q(a) — estimate", plain: "The agent's running-average guess at arm `a`'s true value, based only on the rewards it has actually seen so far from pulling that arm." },
    { term: "Regret", plain: "How much total reward an agent gave up by not always picking the best possible arm from the very start. Lower regret means a better strategy, even if total reward looks similar." },
    { term: "ε-greedy (epsilon-greedy)", plain: "A strategy that usually picks the best-known arm, but picks a random arm instead some small fraction of the time (that fraction is called ε, epsilon) purely to keep learning." },
    { term: "ε (epsilon)", plain: "A number between 0 and 1 representing the probability of taking a random, exploring action instead of the current best-known one." },
    { term: "UCB (Upper Confidence Bound)", plain: "A strategy that adds an uncertainty bonus to each arm's estimate — arms that have been tried less get a bigger bonus — so being unsure about an arm makes it more attractive to try, without ever needing to pick randomly." },
    { term: "Confidence bonus / radius", plain: "The extra credit UCB adds to an under-explored arm's score. It starts large and shrinks the more that arm gets pulled." },
    { term: "Optimistic initialization", plain: "Starting every arm's value estimate artificially high, so that real (lower) rewards feel like disappointments and the agent is pushed to try every arm early on." },
    { term: "Thompson sampling", plain: "A strategy that keeps a probability distribution (a belief, called a posterior) over how good each arm might be, draws one random guess from each arm's belief, and pulls whichever arm's guess is highest." },
    { term: "Non-stationary", plain: "Describes a problem where the correct answer changes over time — for example, an arm that used to be the best one no longer is. Old data can mislead you here." }
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
