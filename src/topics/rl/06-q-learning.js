export default {
  id: "q-learning",
  track: "rl",
  title: "Q-Learning",
  difficulty: 2,
  minutes: 16,
  tags: ["off-policy", "td-control", "q-learning", "epsilon-greedy"],

  explainer: [
    { type: "p", text: "Lesson 3 showed value iteration, which needs a full rulebook of the environment (the exact transition probabilities `P` and rewards `R`) to compute the best policy on paper. **Q-learning** answers the question 'what if I don't have that rulebook, and can only learn by actually acting in the environment and observing what happens?' It takes the same underlying idea — the Bellman optimality equation — and replaces the exact mathematical expectation over all possible outcomes with a single, real, sampled experience: one transition the agent actually lived through. The entire algorithm is one line of update code:" },
    { type: "code", lang: "python", code: "Q[s, a] += alpha * ( r + gamma * Q[s2].max() - Q[s, a] )" },
    { type: "p", text: "Reading this left to right: `Q[s, a]` is the agent's current estimate of how good it is to take action `a` in state `s`. `r` is the reward it just actually received. `gamma` (γ) is the discount factor from lesson 2. `Q[s2].max()` is the highest Q-value the agent currently believes is achievable from the state `s2` it just landed in — this is a one-sample stand-in for 'the best value achievable from here onward.' The whole bracketed expression, `r + gamma * Q[s2].max() - Q[s, a]`, is the **TD error** introduced in lesson 5: the gap between what the agent expected and what it now believes is true. `alpha` (α) is the step size — a small number that damps how much any single, possibly noisy, sample is allowed to move the estimate, rather than blindly overwriting it." },
    { type: "h3", text: "Why Q-learning is called off-policy, and why that distinction matters" },
    { type: "p", text: "Look closely at the target: it uses `max_{a′} Q(s′, a′)` — the best possible next action according to the agent's current table — not whatever action the agent's actual exploring behavior happens to pick next. This means Q-learning is always learning the value of the perfectly greedy policy, `Q*`, no matter what messy, exploratory, or even random policy actually generated the data it's learning from. That is what the term **off-policy** means: the policy being *learned about* (greedy, optimal behavior) is different from the policy being *followed* to collect data (which might be ε-greedy exploration, a human's demonstrations, an old saved policy, or a stored batch of past experience). This separation is what makes techniques like replay buffers (reusing old experience) and offline reinforcement learning (learning entirely from a fixed, pre-collected dataset, no live interaction at all) possible." },
    { type: "callout", tone: "tip", text: "It's worth being able to state the exact conditions under which Q-learning is mathematically guaranteed to converge to the true optimal values `Q*`: (a) every state-action pair must be visited infinitely often over the course of training, and (b) the step sizes must shrink over time in a specific way (formally, `Σα = ∞` and `Σα² < ∞`, the Robbins-Monro conditions from lesson 5). Condition (a) is exactly why you must never let your exploration rate `ε` shrink all the way to 0 too early — the guarantee fundamentally requires *coverage* of the state-action space, and no amount of clever updating can fix a state-action pair the agent simply never tried." },
    { type: "h3", text: "Maximization bias: why Q-learning tends to be overconfident" },
    { type: "p", text: "There's a subtle statistical trap hiding in `max_{a′} Q(s′,a′)`: it takes a maximum over estimates that are themselves noisy (imperfect, still being learned). A basic fact of probability is that the expected value of a maximum is at least as large as the maximum of the expected values (`E[max X] ≥ max E[X]`) — taking the biggest of several noisy guesses tends to overshoot the true best value, simply because whichever guess happened to be luckily too high gets picked. As a result, Q-learning systematically **over-estimates** action values, and this effect is worst exactly where the noise is largest: early in training, in environments with random/stochastic rewards, and whenever a neural network is being used to approximate Q instead of an exact table. **Double Q-learning** fixes this by keeping two separate value tables and decoupling two jobs that were previously combined in one `max`: use one table to decide *which* action looks best (the selection), and the other table to actually evaluate how good that chosen action is (the evaluation). This exact idea, applied to deep Q-networks, is what turns 'DQN' into 'Double DQN.'" },
    { type: "h3", text: "Choosing an exploration schedule" },
    { type: "list", items: [
      "`ε` (epsilon, the probability of taking a random exploring action instead of the greedy one) typically starts near 1 — meaning the agent knows nothing yet, so it should try everything — and gradually decays down to a small floor value, like 0.01 to 0.1, so that eventually the agent mostly follows and refines its learned greedy policy.",
      "Decay too fast, and the agent locks onto a mediocre route before it ever sampled the alternatives that might have been better. Decay too slowly, and a large fraction of the whole training budget is wasted on pointless random wandering after the agent already knows enough.",
      "There are smarter alternatives to plain epsilon-based exploration: **optimistic initialization** (start every Q-value artificially high, at `Q₀ = R_max/(1−γ)`, so every untried action looks attractive by comparison and gets tried systematically); **count-based bonuses** (add a small reward bonus `+β/√N(s,a)` — β is a tuning constant and `N(s,a)` counts how many times this state-action pair has been tried — so rarely-tried actions get an extra nudge); or a **Boltzmann/softmax policy** over the Q-values, which picks actions with probability proportional to how good they currently look, so a slightly-worse action is still picked reasonably often while a clearly terrible one is almost never picked, unlike ε-greedy which treats all non-greedy actions as equally likely regardless of how bad they are."
    ]},
    { type: "callout", tone: "pitfall", text: "Two extremely common bugs both masquerade as 'reinforcement learning is just fundamentally hard,' when they're really just bugs. First: bootstrapping through a terminal state — when an episode genuinely ends, the update target must be the plain reward `r` by itself, never `r + γ max Q(s′,·)`, because a terminal state has no future to bootstrap from (recall from lesson 2 that terminal states are defined to have value 0). Second: treating a time-limit cutoff (the episode was forcibly stopped because it ran too long, not because it actually ended) as if it were a real terminal state — doing this teaches the agent that reward simply stops existing at some fixed horizon, which quietly corrupts its value estimates near that cutoff. Between the two, these bugs account for an embarrassing share of broken from-scratch tabular RL implementations." },
    { type: "h3", text: "Scaling up: from a table to DQN" },
    { type: "p", text: "Everything above assumes `Q[s,a]` is a literal table with one entry per state-action pair — fine for small problems, impossible once the state space is enormous (like raw pixels from a video game). **DQN** (Deep Q-Network) replaces the table with a neural network `Q_θ(s,a)` (θ, theta, denotes the network's trainable parameters) and trains it by minimizing the squared TD error, `(r + γ max_{a′} Q_{θ⁻}(s′,a′) − Q_θ(s,a))²`, using ordinary gradient descent. Two extra tricks are needed to keep this stable, because plain gradient descent assumes independent, identically-distributed training data, and RL experience is neither: a **replay buffer** stores past transitions and trains on randomly-sampled batches from it, which both breaks the strong correlation between consecutive experiences and lets each transition be reused multiple times; and a **target network**, a separate, slowly-updated copy of the weights (written `θ⁻`, theta-minus) used only to compute the target, which stops the target from shifting on every single gradient step (since chasing a constantly-moving target destabilizes training). Both of these are practical patches for a deeper theoretical problem known as the **deadly triad** — combining function approximation, bootstrapping, and off-policy learning together has no general mathematical guarantee of convergence at all, and can provably diverge in constructed examples." }
  ],

  glossary: [
    { term: "Q-learning", plain: "An algorithm for learning the value of state-action pairs purely from lived experience, with no need for a known model of the environment's rules." },
    { term: "Q(s,a) — action value", plain: "The agent's estimate of how good it is to take action `a` while in state `s`, accounting for all the reward expected afterward." },
    { term: "TD error", plain: "The gap between what an update expected (the reward received plus a discounted next-state estimate) and what the agent previously believed. Recap from lesson 5." },
    { term: "Off-policy learning", plain: "Learning the value of one policy (usually the best possible one) while actually acting according to a different policy (such as one that explores randomly) to collect the data." },
    { term: "On-policy learning", plain: "Learning the value of the exact policy currently being followed to collect data, including its exploratory choices — contrast with off-policy." },
    { term: "Behavior policy", plain: "The policy an agent actually follows while collecting experience, which can differ from the policy it is trying to learn about (the target policy)." },
    { term: "Maximization bias", plain: "The tendency to systematically overestimate values when picking the maximum among several still-uncertain estimates, because the estimate that happened to be luckily too high gets chosen." },
    { term: "Double Q-learning", plain: "A fix for maximization bias that uses one value table to pick the best-looking action and a separate table to judge how good that action actually is, instead of using the same noisy table for both jobs." },
    { term: "Replay buffer", plain: "A stored pool of past experiences (state, action, reward, next state) that an off-policy algorithm can sample from repeatedly, instead of only learning from the most recent step." },
    { term: "Target network", plain: "A slowly-updated, frozen copy of a neural network's weights, used to compute stable training targets so the target doesn't shift every time the main network is updated." },
    { term: "Deadly triad", plain: "The combination of three techniques — using a function approximator instead of a table, bootstrapping off your own estimates, and learning off-policy — that together have no guarantee of converging, and can provably blow up." },
    { term: "Terminal state (recap)", plain: "A state marking the true end of an episode, whose value is defined to be exactly 0 since there is no future reward left to collect from it." }
  ],

  complexity: {
    rows: [
      { operation: "One update", time: "O(|A|)", space: "O(|S|·|A|)", note: "the max over actions dominates" },
      { operation: "One episode", time: "O(H·|A|)", space: "O(1) extra", note: "fully online, no trajectory storage" },
      { operation: "Table memory", time: "—", space: "O(|S|·|A|)", note: "hopeless past ~10⁶ states → function approximation" },
      { operation: "Greedy policy extraction", time: "O(|A|)", space: "O(1)", note: "argmax over the row — needs no model" }
    ]
  },

  interview: {
    whyAsked: "Q-learning is the default 'do you actually know RL' question. The signal is not the update rule — everyone has it memorised — but whether you can say precisely why it is off-policy, what it converges to and under what conditions, and where maximisation bias comes from.",
    followUps: [
      { q: "Why is Q-learning off-policy, in one sentence?", a: "Its target uses max_{a′}Q(s′,a′) — the value of the greedy policy — regardless of which action the behaviour policy actually takes next, so it learns Q* from data generated by any sufficiently exploratory policy. SARSA, by contrast, uses the action actually taken, making it on-policy." },
      { q: "What exactly does Q-learning converge to, and when?", a: "To Q* with probability 1, provided every (s,a) is visited infinitely often and the step sizes satisfy Σα = ∞, Σα² < ∞. Note the guarantee is tabular; with function approximation plus bootstrapping and off-policy data (the deadly triad) there is no such guarantee and divergence is constructible." },
      { q: "What is maximisation bias and how do you fix it?", a: "The max over noisy estimates is biased upward because E[max X] ≥ max E[X], so Q-learning over-estimates values, most severely where the noise is largest. Double Q-learning decouples selection from evaluation — pick a* = argmax Q_A(s′,·) but evaluate with Q_B(s′,a*) — which removes the systematic overestimation. Double DQN is the same trick with the online and target networks." },
      { q: "Why does DQN need a replay buffer and a target network?", a: "Replay breaks the strong temporal correlation between consecutive transitions (SGD assumes roughly i.i.d. samples) and lets each transition be reused many times, improving sample efficiency. The target network freezes θ⁻ for thousands of steps so the regression target stops chasing the parameters being updated, which otherwise creates a feedback loop that oscillates or diverges." },
      { q: "Your agent finds a decent route and stops improving. Diagnose it.", a: "Most likely ε decayed too fast, so the alternative routes were never sampled and their Q values remain at their initialisation — a coverage failure, not a learning failure. Check state–action visitation counts first. Remedies: raise the ε floor, use optimistic initialisation or count-based bonuses, or restart episodes from diverse states." },
      { q: "How do you handle continuous actions?", a: "You cannot: argmax over a continuous action space is itself an optimisation problem. Either discretise (fine for low-dimensional actions, exponential otherwise), or switch to an actor-critic method that learns an explicit policy — DDPG/TD3 train a deterministic actor to approximate the argmax, and SAC uses a stochastic actor with an entropy bonus." },
      { q: "What does the learning rate α do here that it doesn't do in supervised learning?", a: "It also plays the role of averaging over environment stochasticity: the target r + γ max Q(s′,·) is a single sample of an expectation, so α controls how strongly one noisy sample moves the estimate. In a deterministic environment α = 1 is fine and fastest; in a stochastic one it makes Q oscillate between sampled outcomes." }
    ]
  },

  code: [
    { lang: "python", label: "Tabular Q-learning", code: "import numpy as np\n\ndef q_learning(env, episodes=500, alpha=0.5, gamma=0.95,\n               eps_start=1.0, eps_end=0.05, decay=0.99, rng=None):\n    rng = rng or np.random.default_rng(0)\n    Q = np.zeros((env.nS, env.nA))\n    eps = eps_start\n    for ep in range(episodes):\n        s, done = env.reset(), False\n        while not done:\n            # --- behaviour policy: epsilon-greedy over Q ---------------------\n            if rng.random() < eps:\n                a = int(rng.integers(env.nA))\n            else:\n                a = int(np.argmax(Q[s]))\n\n            s2, r, done = env.step(a)\n\n            # --- OFF-POLICY target: greedy, not the action we will take next --\n            target = r if done else r + gamma * Q[s2].max()\n            Q[s, a] += alpha * (target - Q[s, a])\n            s = s2\n        eps = max(eps_end, eps * decay)\n    return Q, Q.argmax(axis=1)" },
    { lang: "python", label: "Double Q-learning (removes maximisation bias)", code: "def double_q(env, episodes, alpha, gamma, eps, rng):\n    QA = np.zeros((env.nS, env.nA))\n    QB = np.zeros((env.nS, env.nA))\n    for _ in range(episodes):\n        s, done = env.reset(), False\n        while not done:\n            a = int(np.argmax(QA[s] + QB[s])) if rng.random() > eps else int(rng.integers(env.nA))\n            s2, r, done = env.step(a)\n            if rng.random() < 0.5:\n                a_star = int(np.argmax(QA[s2]))            # SELECT with A\n                target = r if done else r + gamma * QB[s2, a_star]   # EVALUATE with B\n                QA[s, a] += alpha * (target - QA[s, a])\n            else:\n                b_star = int(np.argmax(QB[s2]))\n                target = r if done else r + gamma * QA[s2, b_star]\n                QB[s, a] += alpha * (target - QB[s, a])\n            s = s2\n    return (QA + QB) / 2" },
    { lang: "python", label: "DQN loss (the same target, fitted)", code: "# theta_minus = frozen target network, synced every C steps\ndef dqn_loss(batch, q_net, target_net, gamma):\n    s, a, r, s2, done = batch\n    q_sa = q_net(s).gather(1, a)                       # Q_theta(s, a)\n    with torch.no_grad():\n        # DQN:        max_a' Q_target(s', a')\n        # Double DQN: Q_target(s', argmax_a' Q_online(s', a'))\n        a_star = q_net(s2).argmax(1, keepdim=True)\n        boot = target_net(s2).gather(1, a_star)\n        y = r + gamma * (1 - done) * boot              # mask the terminal bootstrap!\n    return F.smooth_l1_loss(q_sa, y)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 300 },

    params: [
      { key: "episodes", label: "Episodes",     type: "int", min: 60, max: 600, default: 300 },
      { key: "alphaPct", label: "α (percent)",  type: "int", min: 5, max: 100, default: 50 },
      { key: "gammaPct", label: "γ (percent)",  type: "int", min: 70, max: 99, default: 95 },
      { key: "epsFloor", label: "ε floor (%)",  type: "int", min: 0, max: 40, default: 5 },
      { key: "seed",     label: "Reroll",       type: "seed" }
    ],

    frames: function* (params, rng) {
      const alpha = params.alphaPct / 100;
      const gamma = params.gammaPct / 100;
      const epsEnd = params.epsFloor / 100;
      const N = 6;
      const layout = [
        "S", ".", ".", "#", ".", ".",
        ".", "#", ".", "#", ".", ".",
        ".", "#", ".", ".", ".", "#",
        ".", "#", "#", "#", ".", ".",
        ".", ".", ".", "#", ".", ".",
        "#", ".", ".", ".", ".", "G"
      ];
      const nS = N * N;
      const ACT = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      const ANAME = ["↑", "→", "↓", "←"];
      const start = 0, goal = nS - 1;
      const wall = (s) => layout[s] === "#";
      const step = (s, a) => {
        const r = Math.floor(s / N), c = s % N;
        const nr = r + ACT[a][0], nc = c + ACT[a][1];
        if (nr < 0 || nc < 0 || nr >= N || nc >= N || layout[nr * N + nc] === "#") return [s, -1, false];
        const ns = nr * N + nc;
        if (ns === goal) return [ns, 10, true];
        return [ns, -1, false];
      };

      let Q = new Array(nS * 4).fill(0);
      const maxQ = (s) => Math.max(Q[s * 4], Q[s * 4 + 1], Q[s * 4 + 2], Q[s * 4 + 3]);
      const argQ = (s) => {
        let ba = 0;
        for (let a = 1; a < 4; a++) if (Q[s * 4 + a] > Q[s * 4 + ba]) ba = a;
        return ba;
      };
      const greedyPath = () => {
        const p = [start];
        const seen = {};
        let s = start;
        for (let i = 0; i < 40; i++) {
          if (s === goal || seen[s]) break;
          seen[s] = 1;
          const a = argQ(s);
          const [ns, , done] = step(s, a);
          if (ns === s) break;
          p.push(ns);
          s = ns;
          if (done) break;
        }
        return p;
      };

      const epLen = [], epRet = [], epEps = [];
      const visits = new Array(nS * 4).fill(0);

      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: o.s === undefined ? [] : [o.s],
        state: {
          layout: layout.slice(), N: N, Q: Q.slice(), visits: visits.slice(),
          eps: o.eps, alpha: alpha, gamma: gamma,
          ep: o.ep, t: o.t === undefined ? 0 : o.t,
          agent: o.agent === undefined ? -1 : o.agent,
          path: o.path ? o.path.slice() : [],
          upd: o.upd ? o.upd.slice() : null,
          explored: o.explored === undefined ? null : o.explored,
          epLen: epLen.slice(), epRet: epRet.slice(), epEps: epEps.slice(),
          totalEp: params.episodes, covered: o.covered === undefined ? 0 : o.covered
        }
      });

      yield snap({
        label: `Q-learning on a 6×6 maze. Every cell holds four Q values — one wedge per action. All zero: the agent has no idea the goal exists. Reward −1 per step, +10 at the goal, α=${alpha.toFixed(2)}, γ=${gamma.toFixed(2)}.`,
        phase: "init", ep: 0, eps: 1.0, agent: start, path: []
      });

      const decay = Math.pow(epsEnd > 0 ? epsEnd : 0.01, 1 / Math.max(1, params.episodes * 0.6));
      let eps = 1.0;
      const yieldEvery = Math.max(1, Math.round(params.episodes / 55));

      for (let ep = 1; ep <= params.episodes; ep++) {
        let s = start, done = false, t = 0, ret = 0;
        const verbose = ep === 1;
        while (!done && t < 120) {
          const explore = rng() < eps;
          const a = explore ? Math.min(3, Math.floor(rng() * 4)) : argQ(s);
          const [ns, r, dn] = step(s, a);
          const before = Q[s * 4 + a];
          const boot = dn ? 0 : maxQ(ns);
          const target = r + (dn ? 0 : gamma * boot);
          Q = Q.slice();
          Q[s * 4 + a] = before + alpha * (target - before);
          visits[s * 4 + a] += 1;
          ret += r;
          t += 1;

          if (verbose && t <= 26) {
            const sr = Math.floor(s / N), sc = s % N;
            yield snap({
              label: `Episode 1, step ${t}: from (${sr},${sc}) ${explore ? "ε-explored" : "exploited"} ${ANAME[a]} → r=${r}. ` +
                `Target = ${r} + ${gamma.toFixed(2)}·max_a′Q(s′,a′) = ${r} + ${gamma.toFixed(2)}·${boot.toFixed(2)} = ${target.toFixed(2)}. ` +
                `Q ← ${before.toFixed(2)} + ${alpha.toFixed(2)}(${target.toFixed(2)} − ${before.toFixed(2)}) = ${Q[s * 4 + a].toFixed(2)}` +
                (dn ? " — the goal! Its bootstrap term is 0 because terminal states have no future." : boot === 0 ? " — no signal yet: everything downstream is still zero." : "."),
              phase: "step", ep: ep, t: t, eps: eps, s: s, agent: ns,
              upd: [s, a, r, ns, before, Q[s * 4 + a], target, explore ? 1 : 0],
              explored: explore ? 1 : 0, path: []
            });
          }
          s = ns; done = dn;
        }
        epLen.push(t); epRet.push(ret); epEps.push(eps);
        const prevEps = eps;
        eps = Math.max(epsEnd, eps * decay);

        if (ep % yieldEvery === 0 || ep === params.episodes || ep === 1) {
          let covered = 0;
          for (let i = 0; i < visits.length; i++) if (visits[i] > 0) covered++;
          const path = greedyPath();
          const reaches = path[path.length - 1] === goal;
          yield snap({
            label: `Episode ${ep}: ${t} steps, return ${ret}, ε=${prevEps.toFixed(3)}. ` +
              (reaches
                ? `The greedy path now reaches the goal in ${path.length - 1} steps and Q(start) = ${maxQ(start).toFixed(2)}. Value has propagated backwards from the goal, one cell per successful visit.`
                : `The greedy path still dead-ends — value has not yet reached the start. ${covered}/${nS * 4} state-action pairs have ever been tried; convergence needs all of them visited infinitely often.`),
            phase: ep === params.episodes ? "done" : "episode",
            ep: ep, t: t, eps: prevEps, agent: -1, path: path, covered: covered
          });
        }
      }

      const path = greedyPath();
      let covered = 0;
      for (let i = 0; i < visits.length; i++) if (visits[i] > 0) covered++;
      yield snap({
        label: `Trained. Greedy path: ${path.length - 1} steps, Q*(start) ≈ ${maxQ(start).toFixed(2)} (optimal is ${(10 * Math.pow(gamma, 9) - (1 - Math.pow(gamma, 9)) / (1 - gamma)).toFixed(2)} for a 10-step route). Coverage: ${covered}/${nS * 4} state-action pairs tried. Notice the wedges pointing along the solution glow while wedges into walls stay negative — the table encodes the whole policy, not just the path.`,
        phase: "done", ep: params.episodes, eps: eps, agent: -1, path: path, covered: covered
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16, N = S.N;
      const ANAME = ["↑", "→", "↓", "←"];

      const hex = (h) => {
        const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(h).trim());
        if (!m) return null;
        let s = m[1];
        if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
        return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
      };
      const mix = (a, b, t) => {
        const A = hex(a), B = hex(b);
        if (!A || !B) return b;
        t = Math.max(0, Math.min(1, t));
        return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
      };

      const side = Math.min(H - pad * 2 - 22, (W - pad * 3) * 0.52);
      const cell = side / N;
      const gx = pad, gy = pad + 22;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`Episode ${S.ep} / ${S.totalEp}`, pad, 16);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`ε=${S.eps.toFixed(3)}  α=${S.alpha.toFixed(2)}  γ=${S.gamma.toFixed(2)}`, pad + 120, 16);

      let span = 1e-6;
      for (let i = 0; i < S.Q.length; i++) span = Math.max(span, Math.abs(S.Q[i]));

      for (let s = 0; s < N * N; s++) {
        const r = Math.floor(s / N), c = s % N;
        const x = gx + c * cell, y = gy + r * cell;
        const ch = S.layout[s];
        if (ch === "#") {
          ctx.fillStyle = C.surface2;
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = C.border; ctx.lineWidth = 1;
          ctx.strokeRect(x + .5, y + .5, cell - 1, cell - 1);
          continue;
        }
        const cxm = x + cell / 2, cym = y + cell / 2;
        // four wedges: up, right, down, left
        const corners = [[[0, 0], [1, 0]], [[1, 0], [1, 1]], [[1, 1], [0, 1]], [[0, 1], [0, 0]]];
        let best = 0;
        for (let a = 1; a < 4; a++) if (S.Q[s * 4 + a] > S.Q[s * 4 + best]) best = a;
        for (let a = 0; a < 4; a++) {
          const q = S.Q[s * 4 + a];
          ctx.beginPath();
          ctx.moveTo(cxm, cym);
          ctx.lineTo(x + corners[a][0][0] * cell, y + corners[a][0][1] * cell);
          ctx.lineTo(x + corners[a][1][0] * cell, y + corners[a][1][1] * cell);
          ctx.closePath();
          ctx.fillStyle = q >= 0 ? mix(C.surface, C.viz6, q / span) : mix(C.surface, C.viz8, -q / span);
          ctx.fill();
          ctx.strokeStyle = C.border; ctx.lineWidth = 0.5; ctx.stroke();
        }
        if (ch === "G") {
          ctx.fillStyle = C.viz6;
          ctx.beginPath(); ctx.arc(cxm, cym, cell * 0.26, 0, Math.PI * 2); ctx.fill();
        }
        // best-action arrow + numeric max Q
        ctx.textAlign = "center";
        ctx.fillStyle = C.text;
        ctx.font = `${Math.max(8, Math.round(cell * 0.22))}px ${env.font.mono}`;
        ctx.fillText(S.Q[s * 4 + best].toFixed(1), cxm, cym + 2);
        ctx.fillStyle = C.text2;
        ctx.font = `${Math.max(8, Math.round(cell * 0.22))}px ${env.font.mono}`;
        ctx.fillText(ANAME[best], cxm, cym + cell * 0.28);
        if (ch === "S") {
          ctx.fillStyle = C.muted;
          ctx.font = `9px ${env.font.mono}`;
          ctx.textAlign = "left";
          ctx.fillText("s₀", x + 3, y + 10);
        }
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.strokeRect(x + .5, y + .5, cell - 1, cell - 1);
      }

      // greedy path
      if (S.path.length > 1) {
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 3; ctx.globalAlpha = 0.8;
        ctx.beginPath();
        for (let i = 0; i < S.path.length; i++) {
          const s = S.path[i];
          const x = gx + (s % N) * cell + cell / 2, y = gy + Math.floor(s / N) * cell + cell / 2;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }
      // agent
      if (S.agent >= 0) {
        const x = gx + (S.agent % N) * cell + cell / 2, y = gy + Math.floor(S.agent / N) * cell + cell / 2;
        ctx.fillStyle = S.explored ? C.viz2 : C.viz1;
        ctx.beginPath(); ctx.arc(x, y, cell * 0.2, 0, Math.PI * 2); ctx.fill();
      }

      // ---------- right panel -------------------------------------------------
      const px = gx + side + pad, pw = W - px - pad;
      const topH = Math.round(side * 0.44);
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(px, gy, pw, topH, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(px + .5, gy + .5, pw - 1, topH - 1, 8); ctx.stroke();

      ctx.textAlign = "left";
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText("Q(s,a) ← Q(s,a) + α[ r + γ·max Q(s′,·) − Q(s,a) ]", px + 10, gy + 18);

      if (S.upd) {
        const [s, a, r, ns, before, after, target, expl] = S.upd;
        const sr = Math.floor(s / N), sc = s % N, nr = Math.floor(ns / N), nc = ns % N;
        let y = gy + 40;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillStyle = expl ? C.viz2 : C.viz1;
        ctx.fillText(expl ? "behaviour: ε-random (explore)" : "behaviour: greedy (exploit)", px + 10, y); y += 17;
        ctx.fillStyle = C.text;
        ctx.fillText(`s=(${sr},${sc})  a=${ANAME[a]}  r=${r}  s′=(${nr},${nc})`, px + 10, y); y += 17;
        ctx.fillStyle = C.text2;
        ctx.fillText(`target = ${target.toFixed(3)}`, px + 10, y); y += 17;
        ctx.fillText(`Q: ${before.toFixed(3)} → ${after.toFixed(3)}`, px + 10, y); y += 17;
        ctx.fillStyle = C.muted;
        ctx.fillText("the max makes this OFF-policy:", px + 10, y); y += 14;
        ctx.fillText("it learns the greedy policy's value", px + 10, y);
      } else {
        let y = gy + 40;
        ctx.fillStyle = C.text; ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(`greedy path length: ${Math.max(0, S.path.length - 1)}`, px + 10, y); y += 17;
        ctx.fillText(`Q(s₀) max = ${(Math.max(S.Q[0], S.Q[1], S.Q[2], S.Q[3])).toFixed(2)}`, px + 10, y); y += 17;
        ctx.fillStyle = C.text2;
        ctx.fillText(`(s,a) pairs ever tried: ${S.covered}/${N * N * 4}`, px + 10, y); y += 17;
        ctx.fillStyle = C.muted;
        ctx.fillText("wedge colour = Q(s,a); green good, red bad", px + 10, y);
      }

      // ε + episode length curves
      const cy0 = gy + topH + 12, cy1 = gy + side;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(px, cy0, pw, cy1 - cy0, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(px + .5, cy0 + .5, pw - 1, cy1 - cy0 - 1, 8); ctx.stroke();

      const ax0 = px + 30, ax1 = px + pw - 12, ay0 = cy0 + 22, ay1 = cy1 - 18;
      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz4; ctx.fillText("steps/episode", ax0, cy0 + 14);
      ctx.fillStyle = C.viz5; ctx.fillText("ε", ax0 + 92, cy0 + 14);

      const nEp = S.epLen.length;
      if (nEp > 1) {
        const maxLen = Math.max.apply(null, S.epLen.concat([10]));
        ctx.strokeStyle = C.viz4; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < nEp; i++) {
          const x = ax0 + (i / Math.max(1, S.totalEp - 1)) * (ax1 - ax0);
          const y = ay1 - (S.epLen[i] / maxLen) * (ay1 - ay0);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.strokeStyle = C.viz5; ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let i = 0; i < nEp; i++) {
          const x = ax0 + (i / Math.max(1, S.totalEp - 1)) * (ax1 - ax0);
          const y = ay1 - S.epEps[i] * (ay1 - ay0);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(String(maxLen), ax0 - 4, ay0 + 4);
        ctx.fillText("0", ax0 - 4, ay1 + 3);
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the Q-learning update.", a: "`Q(s,a) ← Q(s,a) + α[ r + γ·max_{a′}Q(s′,a′) − Q(s,a) ]`, with the bootstrap term replaced by 0 at a terminal state.", tags: ["update-rule"] },
      { q: "Why is Q-learning off-policy?", a: "The target uses `max_{a′}Q(s′,a′)` — the greedy policy's value — regardless of what the behaviour policy actually does next. So it learns `Q*` from data generated by any sufficiently exploratory policy (replay, demonstrations, old policies).", tags: ["off-policy"] },
      { q: "Convergence conditions for tabular Q-learning?", a: "Every (s,a) visited infinitely often, and Robbins–Monro step sizes (`Σα = ∞`, `Σα² < ∞`). Then Q → Q* with probability 1. No guarantee once you add function approximation.", tags: ["theory"] },
      { q: "What is maximisation bias?", a: "`E[max_a X_a] ≥ max_a E[X_a]`, so taking a max over noisy Q estimates systematically over-estimates values — worst early in training and under stochastic rewards.", tags: ["bias"] },
      { q: "How does Double Q-learning fix maximisation bias?", a: "Decouple selection from evaluation: `a* = argmax_a Q_A(s′,a)` but bootstrap with `Q_B(s′,a*)`. Each table is an unbiased evaluator of the other's choice. Double DQN uses the online net to select and the target net to evaluate.", tags: ["double-q"] },
      { q: "Why does DQN need a replay buffer and a target network?", a: "Replay decorrelates consecutive transitions (SGD wants ~i.i.d. data) and reuses samples. The target network freezes the bootstrap target for C steps so the regression target stops chasing the parameters being fit.", tags: ["dqn"] },
      { q: "Name the two classic tabular bugs around terminal states.", a: "(1) Bootstrapping through a terminal: the target must be plain `r`, since `V(terminal) = 0`. (2) Treating a time-limit truncation as terminal, which suppresses values near the horizon — you should still bootstrap on truncation.", tags: ["pitfall"] },
      { q: "Why can't Q-learning handle continuous actions?", a: "`max_{a′}Q(s′,a′)` is an inner optimisation over the action space, intractable in continuous or high-dimensional action spaces. Use actor-critic (DDPG/TD3/SAC), which learns an explicit policy that approximates the argmax.", tags: ["limitation"] }
    ],
    sixtySecond: [
      "Explain the Q-learning update, why it is off-policy, and the conditions under which it converges.",
      "Explain maximisation bias and how Double Q-learning removes it."
    ]
  }
};
