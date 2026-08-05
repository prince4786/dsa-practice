export default {
  id: "mdp",
  track: "rl",
  title: "MDPs: States, Actions, Rewards",
  difficulty: 1,
  minutes: 15,
  tags: ["mdp", "return", "discounting", "markov-property"],

  explainer: [
    { type: "p", text: "Think of any decision problem that unfolds over time: you're in some situation, you take an action, the situation changes (partly because of your action, partly because of chance), you get some payoff, and you repeat. A robot navigating a warehouse, a thermostat adjusting a room's temperature, a game player choosing moves — all of these fit that pattern. An **MDP**, short for **Markov Decision Process**, is just the formal, mathematical way of writing that pattern down so that algorithms can reason about it. It is the single object that every reinforcement-learning algorithm you'll meet in this track is trying to solve — value iteration, Q-learning, policy gradients, all of it is just different machinery for finding good behavior inside an MDP. Once you understand the five pieces that make one up, the rest of the track is really about different ways of computing an answer for that same object." },
    { type: "p", text: "Formally, an MDP is written as the tuple (an ordered list of parts) `(S, A, P, R, γ)`. `S` is the set of all possible **states** — every distinct situation the agent could be in. `A` is the set of **actions** the agent can take. `P` is the **transition function**, `P(s′ | s, a)` — read this as 'the probability of ending up in state `s′` (s-prime, meaning the next state), given that you were in state `s` and took action `a`.' `R` is the **reward function**, `R(s, a, s′)` — the payoff you get for that particular state-action-next-state transition. And `γ` (the Greek letter gamma) is the **discount factor**, a number between 0 and 1 that controls how much less a reward is worth if it arrives later rather than sooner — more on this below." },
    { type: "h3", text: "The Markov property: a promise about your state, not a law of nature" },
    { type: "p", text: "MDPs assume something called the **Markov property**: `P(s_{t+1} | s_t, a_t) = P(s_{t+1} | s_1..s_t, a_1..a_t)`. In words, this says that the probability of the next state depends only on the current state and action — not on the entire history of how you got there. Put differently: your current state must already contain everything from the past that is relevant to predicting the future. This is not automatically true of every problem — it is a **design choice you make about how you represent the state**, and it can be wrong. A single frame of an Atari game, for instance, does not tell you which way the ball is moving, so it is not Markov on its own; stacking four consecutive frames together roughly fixes that, because now velocity is implicit in the difference between frames. If your problem seems to need 'memory' of the past to make good decisions, the fix is not to blame the algorithm — it's to enrich what you're putting into the state." },
    { type: "h3", text: "Return: the thing the agent actually tries to maximize" },
    { type: "p", text: "A common beginner assumption is that the agent is just trying to get the biggest reward on the very next step. It isn't. It is trying to maximize the **return**, written `G_t` (G for 'gain', t for the current time step) — the sum of all future rewards from this point onward, with each one shrunk by the discount factor the further away it is: `G_t = R_{t+1} + γR_{t+2} + γ²R_{t+3} + … = Σ_{k≥0} γ^k R_{t+k+1}`. Read the sum as: 'add up every future reward, multiplying the reward that's `k` steps away by γ raised to the power `k`.' Since γ is less than 1, γ² is smaller than γ, which is smaller than 1 — so rewards further in the future count for less. There is a useful recursive way to write the same thing: `G_t = R_{t+1} + γG_{t+1}`, meaning 'the return from now is the very next reward, plus γ times the return from the next step onward.' This one-line recursion is genuinely important — nearly every equation you'll encounter later in this track, including the Bellman equation, is built directly on top of it." },
    { type: "callout", tone: "tip", text: "γ (gamma), the discount factor, is doing three separate jobs at once, and it helps to name all three. First, it encodes a preference for sooner rewards over later ones — a very ordinary idea (a dollar today beats a dollar next year). Second, in tasks that never naturally end, it keeps the total return from adding up to infinity: mathematically `|G| ≤ R_max/(1−γ)`, a finite number as long as γ < 1. Third, and most practically, it sets an **effective horizon** — roughly how many steps into the future the agent actually 'plans around' — of about `1/(1−γ)` steps. With γ = 0.99, that's about 100 steps of foresight; with γ = 0.9, only about 10. If your real task needs the agent to connect an action now to a payoff 500 steps later, a discount factor of 0.9 is mathematically incapable of that, no matter how long or how well you train." },
    { type: "h3", text: "Policies and value functions: describing and scoring behavior" },
    { type: "list", items: [
      "**Policy**, written `π` (the Greek letter pi) — the agent's rule for choosing what to do. `π(a | s)` means 'the probability of taking action `a`, given that you're in state `s`.' A deterministic policy is the special, simpler case where the same state always produces the same action, written `π(s) = a`.",
      "**State value**, `V^π(s)` (V superscript pi, of s) — the expected return you'd get starting from state `s` if you followed policy `π` from then on: `V^π(s) = E_π[G_t | S_t = s]`. `E` means 'expected value', i.e. the long-run average if you replayed this many times. Because it's an average, any single episode's actual return is just one noisy sample of it — it can be higher or lower than `V^π(s)` by chance.",
      "**Action value**, `Q^π(s, a)` — similar to `V`, but you also commit to a specific first action `a` before following `π` afterward: `Q^π(s, a) = E_π[G_t | S_t = s, A_t = a]`. The practical reason `Q` matters so much is that it lets you act without needing to know `P`, the transition function, at all: picking the best action is just `argmax_a Q(s,a)` — 'the action `a` that makes `Q(s,a)` largest.' Doing the equivalent with `V` alone would require knowing `P` to look one step ahead.",
      "**Advantage**, `A^π(s, a) = Q^π(s, a) − V^π(s)` — how much better (or worse) taking this particular action `a` is compared to the policy's average behavior in that state. This quantity is the backbone of the policy-gradient methods covered in lessons 9 and 10."
    ]},
    { type: "callout", tone: "pitfall", text: "It is tempting to treat the reward function as a hint or nudge toward the behavior you want. It is not a hint — the reward function *is* the definition of the task, in full. If you reward a cleaning robot for 'amount of dirt collected', it may learn to dump dirt back onto the floor just so it can collect it again and rack up more reward. If you want to add extra reward signals to guide learning faster (called reward shaping) without accidentally changing what the optimal behavior actually is, the added signal must take the specific form `F(s,s′) = γΦ(s′) − Φ(s)`, called **potential-based shaping** (`Φ`, phi, is any function you choose that scores how 'promising' a state looks). Only this exact form is mathematically guaranteed not to change which policy is optimal." },
    { type: "h3", text: "Episodic vs. continuing tasks" },
    { type: "p", text: "An **episodic** task is one that eventually ends — it reaches a **terminal state**, like winning or losing a game, and by definition the value of a terminal state is exactly 0, because there is no more future reward to collect from it. Forgetting to set that value to 0 when the episode ends is one of the single most common bugs in hand-written tabular RL code. A **continuing** task, by contrast, never ends — there's no terminal state at all. That's exactly why continuing tasks require γ to be strictly less than 1 (or a different formulation based on average reward per step): without discounting, the return sum in a task that never ends would simply be infinite, and 'maximize infinity' is not something an algorithm can optimize." }
  ],

  glossary: [
    { term: "MDP (Markov Decision Process)", plain: "The formal, five-part description of a decision problem that unfolds over time: states, actions, how actions change the state, what reward you get, and how much future reward is discounted. Every RL algorithm in this track is a way of solving one." },
    { term: "State (S)", plain: "A description of 'where you are' or 'what's going on right now' — everything the agent needs to know to make its next decision." },
    { term: "Action (A)", plain: "One of the choices available to the agent at a given moment." },
    { term: "Transition function P(s′|s,a)", plain: "The probability of ending up in next-state `s′` given that you were in state `s` and took action `a`. Captures the randomness or rules of the environment." },
    { term: "Reward function R", plain: "The rule that says how much payoff (a number) the agent gets for a particular state, action, and resulting next state. This defines what the task actually wants, not just a hint toward it." },
    { term: "γ (gamma) — discount factor", plain: "A number between 0 and 1 that makes rewards arriving later worth less than rewards arriving sooner. It also keeps never-ending tasks from summing to infinite reward." },
    { term: "Markov property", plain: "The assumption that the current state alone is enough to predict what happens next — you don't need to know the full history of how you got there. This is a property of how you designed your state, not a fact about the world." },
    { term: "Return (G_t)", plain: "The total of all future rewards from this point onward, each one shrunk by the discount factor the further away it is. This is what the agent is actually trying to maximize — not just the very next reward." },
    { term: "Policy (π)", plain: "The agent's rule for choosing what to do: given the situation (state) it is in, which action does it take, or what probabilities does it assign to each action." },
    { term: "State value (V^π(s))", plain: "The expected (long-run average) total future reward you'd get starting from state `s`, if you followed policy `π` from then on." },
    { term: "Action value (Q^π(s,a))", plain: "The expected total future reward if you took action `a` right now, then followed policy `π` afterward. Useful because you can pick good actions from it without knowing how the environment works." },
    { term: "Advantage (A^π(s,a))", plain: "How much better or worse a specific action is compared to the policy's average action in that state. Zero means average; positive means better than average." },
    { term: "Reward shaping", plain: "Adding an extra, hand-designed reward signal to help an agent learn faster. Risky unless done in a specific mathematically safe form (potential-based shaping), or it can teach the agent the wrong behavior." },
    { term: "Episodic vs. continuing task", plain: "An episodic task eventually ends at a terminal state (like a game finishing). A continuing task never ends, so it needs discounting to keep the total future reward from being infinite." }
  ],

  complexity: {
    rows: [
      { operation: "One environment step", time: "O(1)", space: "O(1)", note: "sample s′ ~ P(·|s,a)" },
      { operation: "Storing a tabular MDP", time: "—", space: "O(|S|²·|A|)", note: "the reason tabular methods do not scale" },
      { operation: "Rolling out one episode", time: "O(H)", space: "O(H)", note: "H = horizon; store the trajectory for MC returns" },
      { operation: "Effective horizon", time: "≈ 1/(1−γ)", space: "—", note: "γ=0.99 ⇒ ~100 steps of credit assignment" }
    ]
  },

  interview: {
    whyAsked: "It checks whether you can translate a messy real problem into `(S, A, P, R, γ)` — the step where most applied RL projects actually fail. The specific signal is whether you can defend your state representation as Markov and explain what γ buys and costs you.",
    followUps: [
      { q: "What exactly does γ control, and how would you pick it?", a: "γ trades off horizon against variance and stability. The effective horizon is about 1/(1−γ), so pick γ from the timescale over which your actions actually matter: 0.9 for ~10-step credit assignment, 0.99 for ~100. Larger γ increases the magnitude and variance of returns and slows value propagation, so people often anneal γ upward during training." },
      { q: "Your state is not Markov. What are the options?", a: "Enrich the state (frame stacking, adding velocities, appending the last action/reward), or accept a POMDP and carry a belief state — in practice a recurrent policy or a transformer over the observation history, which learns an approximate sufficient statistic. Ignoring it means your value function is fitting an average over hidden contexts and will be biased." },
      { q: "Why learn Q rather than V?", a: "Acting greedily on V requires a model: you need P(s′|s,a) to compute argmax_a Σ P(s′|s,a)[r + γV(s′)]. Q folds the one-step lookahead into the table, so argmax_a Q(s,a) is model-free. The cost is a table of size |S||A| instead of |S|, and more samples to fill it." },
      { q: "What is reward shaping and when is it safe?", a: "Adding an auxiliary reward to densify a sparse signal. It is provably policy-invariant only for potential-based shaping F(s,a,s′) = γΦ(s′) − Φ(s) for any function Φ over states. Anything else can create loops the agent exploits — the classic case is rewarding progress toward a subgoal that the agent then oscillates around." },
      { q: "Episodic vs continuing tasks — what changes in the code?", a: "In episodic tasks, terminal states have V = 0 by definition, so the bootstrap term must be masked at termination: target = r + γ(1−done)V(s′). In continuing tasks there is no terminal, so γ < 1 is mandatory for a finite return, or you switch to the average-reward objective with a differential value function." },
      { q: "Time limits: is hitting a step limit 'done'?", a: "No — that is a bug worth naming. Time-limit truncation is not a real terminal state, so you should still bootstrap V(s′) at the cutoff. Treating it as terminal teaches the agent the world ends at step 1000 and systematically depresses values near the horizon." }
    ]
  },

  code: [
    { lang: "python", label: "Rollout, return, and Monte-Carlo value estimate", code: "import numpy as np\n\ndef rollout(env, policy, gamma, rng, max_steps=100):\n    s = env.reset()\n    traj, G, disc = [], 0.0, 1.0\n    for t in range(max_steps):\n        a = policy(s, rng)\n        s2, r, done = env.step(s, a, rng)\n        traj.append((s, a, r))\n        G += disc * r          # G = sum_k gamma^k r_{k+1}\n        disc *= gamma          # the weight of every future reward shrinks\n        s = s2\n        if done:\n            break\n    return traj, G\n\ndef mc_value(env, policy, gamma, rng, episodes=5000):\n    \"\"\"V^pi(s0) is an EXPECTATION; one episode is a noisy sample of it.\"\"\"\n    returns = [rollout(env, policy, gamma, rng)[1] for _ in range(episodes)]\n    return float(np.mean(returns)), float(np.std(returns) / np.sqrt(episodes))" },
    { lang: "python", label: "Exact policy evaluation (solves for V^pi)", code: "def policy_eval(P, R, pi, gamma, tol=1e-10):\n    \"\"\"P[s,a,s2] transition probs, R[s,a] expected reward, pi[s,a] policy.\"\"\"\n    nS = P.shape[0]\n    V = np.zeros(nS)\n    while True:\n        # V^pi(s) = sum_a pi(a|s) [ R(s,a) + gamma sum_s' P(s'|s,a) V(s') ]\n        Q = R + gamma * P.dot(V)          # (nS, nA)\n        V_new = (pi * Q).sum(axis=1)\n        if np.abs(V_new - V).max() < tol:\n            return V_new\n        V = V_new\n\n# Closed form (small MDPs only): V = (I - gamma P_pi)^-1 r_pi\n#   P_pi[s,s'] = sum_a pi(a|s) P[s,a,s'],  r_pi[s] = sum_a pi(a|s) R[s,a]" },
    { lang: "python", label: "Potential-based reward shaping", code: "# Safe: leaves the optimal policy unchanged for ANY potential Phi.\ndef shaped_reward(r, s, s2, gamma, Phi):\n    return r + gamma * Phi(s2) - Phi(s)\n\n# e.g. Phi(s) = -manhattan_distance(s, goal)\n# Unsafe: r + bonus_for_moving_toward_goal   <- creates exploitable cycles" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 260 },

    params: [
      { key: "gammaPct", label: "γ (percent)",   type: "int", min: 50, max: 99, default: 90 },
      { key: "slipPct",  label: "Slip (percent)", type: "int", min: 0, max: 40, default: 20 },
      { key: "policy",   label: "Policy",        type: "enum", options: ["optimal", "random"], default: "optimal" },
      { key: "seed",     label: "Reroll",        type: "seed" }
    ],

    frames: function* (params, rng) {
      const gamma = params.gammaPct / 100;
      const slip = params.slipPct / 100;
      const R = 5, Cn = 5;
      // # wall, G goal (+10, terminal), P pit (-10, terminal), . step cost -1
      const layout = [
        ".", ".", ".", ".", "G",
        ".", "#", "#", ".", ".",
        ".", ".", "#", ".", ".",
        ".", "#", ".", ".", "P",
        "S", ".", ".", ".", "."
      ];
      const at = (r, c) => layout[r * Cn + c];
      const idx = (r, c) => r * Cn + c;
      const start = idx(4, 0);
      const terminal = (s) => at(Math.floor(s / Cn), s % Cn) === "G" || at(Math.floor(s / Cn), s % Cn) === "P";
      const isWall = (r, c) => r < 0 || c < 0 || r >= R || c >= Cn || at(r, c) === "#";
      const ACT = [[-1, 0], [0, 1], [1, 0], [0, -1]];   // up right down left
      const ANAME = ["↑", "→", "↓", "←"];

      // transition distribution: intended with 1-slip, the two perpendiculars with slip/2
      const trans = (s, a) => {
        const out = [];
        const r = Math.floor(s / Cn), c = s % Cn;
        const dirs = [[a, 1 - slip], [(a + 1) % 4, slip / 2], [(a + 3) % 4, slip / 2]];
        for (const [d, p] of dirs) {
          if (p <= 0) continue;
          const nr = r + ACT[d][0], nc = c + ACT[d][1];
          const ns = isWall(nr, nc) ? s : idx(nr, nc);
          out.push([ns, p, d]);
        }
        return out;
      };
      const rewardOf = (s2) => {
        const ch = at(Math.floor(s2 / Cn), s2 % Cn);
        return ch === "G" ? 10 : ch === "P" ? -10 : -1;
      };

      // ---- solve the MDP internally so the visual can quote the truth -------
      const nS = R * Cn;
      let V = new Array(nS).fill(0);
      for (let it = 0; it < 400; it++) {
        const Vn = V.slice();
        for (let s = 0; s < nS; s++) {
          if (terminal(s) || at(Math.floor(s / Cn), s % Cn) === "#") { Vn[s] = 0; continue; }
          let bv = -Infinity;
          for (let a = 0; a < 4; a++) {
            let q = 0;
            for (const [ns, p] of trans(s, a)) q += p * (rewardOf(ns) + (terminal(ns) ? 0 : gamma * V[ns]));
            if (q > bv) bv = q;
          }
          Vn[s] = bv;
        }
        V = Vn;
      }
      const greedy = new Array(nS).fill(0);
      for (let s = 0; s < nS; s++) {
        if (terminal(s)) continue;
        let bv = -Infinity, ba = 0;
        for (let a = 0; a < 4; a++) {
          let q = 0;
          for (const [ns, p] of trans(s, a)) q += p * (rewardOf(ns) + (terminal(ns) ? 0 : gamma * V[ns]));
          if (q > bv) { bv = q; ba = a; }
        }
        greedy[s] = ba;
      }
      // exact V^pi(start) under the chosen policy
      const useOptimal = params.policy === "optimal";
      let Vpi = new Array(nS).fill(0);
      for (let it = 0; it < 600; it++) {
        const Vn = Vpi.slice();
        for (let s = 0; s < nS; s++) {
          if (terminal(s) || at(Math.floor(s / Cn), s % Cn) === "#") { Vn[s] = 0; continue; }
          let tot = 0;
          const acts = useOptimal ? [greedy[s]] : [0, 1, 2, 3];
          const w = 1 / acts.length;
          for (const a of acts) {
            let q = 0;
            for (const [ns, p] of trans(s, a)) q += p * (rewardOf(ns) + (terminal(ns) ? 0 : gamma * Vpi[ns]));
            tot += w * q;
          }
          Vn[s] = tot;
        }
        Vpi = Vn;
      }
      const trueV0 = Vpi[start];

      const sample = (s, a) => {
        const u = rng();
        let acc = 0;
        const opts = trans(s, a);
        for (const o of opts) { acc += o[1]; if (u < acc) return o; }
        return opts[opts.length - 1];
      };

      const runReturns = [];
      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: [o.s],
        state: {
          layout: layout.slice(), R: R, Cn: Cn, gamma: gamma, slip: slip,
          policy: params.policy, s: o.s, trail: o.trail.slice(),
          rows: o.rows.map(x => x.slice()), G: o.G, t: o.t, ep: o.ep,
          intended: o.intended === undefined ? -1 : o.intended,
          actual: o.actual === undefined ? -1 : o.actual,
          slipped: !!o.slipped, done: !!o.done,
          trueV0: trueV0, meanG: o.meanG === undefined ? null : o.meanG,
          nEp: runReturns.length, seV: o.seV === undefined ? null : o.seV,
          Vstar0: V[start]
        }
      });

      yield snap({
        label: `The MDP: 5×5 gridworld, γ=${gamma.toFixed(2)}, slip=${(slip * 100).toFixed(0)}% (the wind pushes you sideways). Reward: −1 per step, +10 at the goal, −10 in the pit. Return G = Σ γᵗ rₜ₊₁ — reward now is worth more than reward later.`,
        phase: "init", s: start, trail: [start], rows: [], G: 0, t: 0, ep: 1
      });

      const nDetailed = 2;
      for (let ep = 1; ep <= nDetailed; ep++) {
        let s = start, G = 0, disc = 1, t = 0;
        const trail = [start], rows = [];
        while (!terminal(s) && t < 24) {
          const a = useOptimal ? greedy[s] : Math.min(3, Math.floor(rng() * 4));
          const [ns, , d] = sample(s, a);
          const r = rewardOf(ns);
          const contrib = disc * r;
          G += contrib;
          rows.push([t, s, a, r, disc, contrib, G]);
          const slipped = d !== a;
          t++;
          trail.push(ns);
          const sr = Math.floor(ns / Cn), sc = ns % Cn;
          yield snap({
            label: `Episode ${ep}, t=${t}: took ${ANAME[a]} from (${Math.floor(s / Cn)},${s % Cn})` +
              (slipped ? ` but the wind slipped you ${ANAME[d]}` : "") +
              ` → (${sr},${sc}), r=${r}. Discount γᵗ = ${gamma.toFixed(2)}^${t - 1} = ${disc.toFixed(3)}, so it adds ${contrib.toFixed(2)}. G = ${G.toFixed(2)}.`,
            phase: terminal(ns) ? "terminal" : "step",
            s: ns, trail: trail, rows: rows, G: G, t: t, ep: ep,
            intended: a, actual: d, slipped: slipped, done: terminal(ns)
          });
          disc *= gamma;
          s = ns;
        }
        runReturns.push(G);
        const mean = runReturns.reduce((x, y) => x + y, 0) / runReturns.length;
        yield snap({
          label: `Episode ${ep} ended with return G₀ = ${G.toFixed(2)} in ${t} steps. One episode is a single noisy *sample* of V^π(s₀); the true expectation is ${trueV0.toFixed(2)}. Running mean over ${runReturns.length} episode(s): ${mean.toFixed(2)}.`,
          phase: "episode-end", s: s, trail: trail, rows: rows, G: G, t: t, ep: ep, done: true, meanG: mean
        });
      }

      // ---- silent episodes: watch the sample mean converge to V^pi(s0) ------
      let lastTrail = [start], lastRows = [], lastG = 0;
      const total = 240;
      for (let ep = nDetailed + 1; ep <= total; ep++) {
        let s = start, G = 0, disc = 1, t = 0;
        const trail = [start], rows = [];
        while (!terminal(s) && t < 60) {
          const a = useOptimal ? greedy[s] : Math.min(3, Math.floor(rng() * 4));
          const [ns] = sample(s, a);
          const r = rewardOf(ns);
          G += disc * r;
          if (rows.length < 24) rows.push([t, s, a, r, disc, disc * r, G]);
          disc *= gamma; t++; trail.push(ns); s = ns;
        }
        runReturns.push(G);
        lastTrail = trail; lastRows = rows; lastG = G;
        if (ep % 8 !== 0 && ep !== total) continue;
        const n = runReturns.length;
        const mean = runReturns.reduce((x, y) => x + y, 0) / n;
        let vr = 0;
        for (const g of runReturns) vr += (g - mean) * (g - mean);
        const se = Math.sqrt(vr / Math.max(1, n - 1)) / Math.sqrt(n);
        yield snap({
          label: `Episode ${ep}: mean return over ${n} episodes = ${mean.toFixed(2)} ± ${se.toFixed(2)} vs exact V^π(s₀) = ${trueV0.toFixed(2)}. The value function is nothing but this expectation — Monte Carlo estimates it by averaging, at 1/√n precision.`,
          phase: ep === total ? "done" : "sampling",
          s: s, trail: trail, rows: rows, G: G, t: t, ep: ep, done: true, meanG: mean, seV: se
        });
      }

      const n = runReturns.length;
      const mean = runReturns.reduce((x, y) => x + y, 0) / n;
      yield snap({
        label: `Done: ${n} episodes, sample mean ${mean.toFixed(2)}, exact V^π(s₀) = ${trueV0.toFixed(2)}, and V*(s₀) = ${V[start].toFixed(2)} is the best any policy could do. Lessons 3–4 compute these numbers directly from the model instead of sampling them.`,
        phase: "done", s: start, trail: lastTrail, rows: lastRows, G: lastG, t: 0, ep: n, done: true, meanG: mean
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;
      const gridSide = Math.min(H - pad * 2 - 26, (W - pad * 3) * 0.42);
      const cell = gridSide / S.R;
      const gx = pad, gy = pad + 22;
      const ANAME = ["↑", "→", "↓", "←"];

      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`γ = ${S.gamma.toFixed(2)}   slip = ${(S.slip * 100).toFixed(0)}%   policy: ${S.policy}`, pad, 16);

      // ---------- grid -------------------------------------------------------
      for (let r = 0; r < S.R; r++) {
        for (let c = 0; c < S.Cn; c++) {
          const ch = S.layout[r * S.Cn + c];
          const x = gx + c * cell, y = gy + r * cell;
          let fill = C.surface;
          if (ch === "#") fill = C.surface2;
          else if (ch === "G") fill = C.viz6;
          else if (ch === "P") fill = C.viz8;
          ctx.fillStyle = fill;
          ctx.beginPath(); ctx.rect(x, y, cell, cell); ctx.fill();
          ctx.strokeStyle = C.border; ctx.lineWidth = 1;
          ctx.strokeRect(x + .5, y + .5, cell - 1, cell - 1);
          if (ch === "G" || ch === "P") {
            ctx.fillStyle = C.text;
            ctx.font = `11px ${env.font.mono}`;
            ctx.textAlign = "center";
            ctx.fillText(ch === "G" ? "+10" : "−10", x + cell / 2, y + cell / 2 + 4);
          } else if (ch === "S") {
            ctx.fillStyle = C.muted;
            ctx.font = `10px ${env.font.mono}`;
            ctx.textAlign = "center";
            ctx.fillText("s₀", x + cell / 2, y + cell - 6);
          }
        }
      }

      // trail
      if (S.trail.length > 1) {
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 2; ctx.globalAlpha = 0.55;
        ctx.beginPath();
        for (let i = 0; i < S.trail.length; i++) {
          const s = S.trail[i];
          const x = gx + (s % S.Cn) * cell + cell / 2, y = gy + Math.floor(s / S.Cn) * cell + cell / 2;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
      }

      // agent
      const ar = Math.floor(S.s / S.Cn), ac = S.s % S.Cn;
      ctx.fillStyle = S.slipped ? C.viz2 : C.viz1;
      ctx.beginPath();
      ctx.arc(gx + ac * cell + cell / 2, gy + ar * cell + cell / 2, cell * 0.22, 0, Math.PI * 2);
      ctx.fill();
      if (S.intended >= 0) {
        ctx.fillStyle = C.text;
        ctx.font = `${Math.round(cell * 0.3)}px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(ANAME[S.actual >= 0 ? S.actual : S.intended], gx + ac * cell + cell / 2, gy + ar * cell + cell / 2 + cell * 0.11);
      }
      if (S.slipped) {
        ctx.fillStyle = C.viz2;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(`slipped: wanted ${ANAME[S.intended]}, got ${ANAME[S.actual]}`, gx, gy + gridSide + 14);
      }

      // ---------- trajectory table -------------------------------------------
      const tx = gx + gridSide + pad;
      const tw = W - tx - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(tx, gy, tw, gridSide, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(tx + .5, gy + .5, tw - 1, gridSide - 1, 8); ctx.stroke();

      const colX = [tx + 10, tx + 40, tx + 78, tx + 112, tx + 168, tx + 232, tx + tw - 10];
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.muted; ctx.textAlign = "left";
      ctx.fillText("t", colX[0], gy + 16);
      ctx.fillText("s", colX[1], gy + 16);
      ctx.fillText("a", colX[2], gy + 16);
      ctx.fillText("r", colX[3], gy + 16);
      ctx.fillText("γᵗ", colX[4], gy + 16);
      ctx.fillText("γᵗ·r", colX[5], gy + 16);
      ctx.textAlign = "right";
      ctx.fillText("G", colX[6], gy + 16);
      ctx.strokeStyle = C.grid;
      ctx.beginPath(); ctx.moveTo(tx + 8, gy + 21.5); ctx.lineTo(tx + tw - 8, gy + 21.5); ctx.stroke();

      const rowH = 14;
      const maxRows = Math.floor((gridSide - 54) / rowH);
      const rows = S.rows.slice(Math.max(0, S.rows.length - maxRows));
      rows.forEach((rw, i) => {
        const y = gy + 36 + i * rowH;
        const isLast = i === rows.length - 1;
        ctx.textAlign = "left";
        ctx.fillStyle = isLast ? C.text : C.text2;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(String(rw[0]), colX[0], y);
        ctx.fillText(`(${Math.floor(rw[1] / S.Cn)},${rw[1] % S.Cn})`, colX[1], y);
        ctx.fillText(ANAME[rw[2]], colX[2], y);
        ctx.fillStyle = rw[3] > 0 ? C.viz6 : rw[3] < -1 ? C.viz8 : (isLast ? C.text : C.text2);
        ctx.fillText(rw[3] > 0 ? `+${rw[3]}` : String(rw[3]), colX[3], y);
        ctx.fillStyle = C.muted;
        ctx.fillText(rw[4].toFixed(3), colX[4], y);
        // discount weight bar
        ctx.fillStyle = C.viz7; ctx.globalAlpha = 0.5;
        ctx.fillRect(colX[4], y + 2, Math.max(1, rw[4] * 40), 3);
        ctx.globalAlpha = 1;
        ctx.fillStyle = isLast ? C.text : C.text2;
        ctx.fillText(rw[5].toFixed(2), colX[5], y);
        ctx.textAlign = "right";
        ctx.fillText(rw[6].toFixed(2), colX[6], y);
      });

      // ---------- return / value summary --------------------------------------
      const by = gy + gridSide + 8;
      ctx.textAlign = "left";
      ctx.font = `12px ${env.font.mono}`;
      ctx.fillStyle = C.text;
      ctx.fillText(`G = ${S.G.toFixed(2)}`, tx + 10, by + 14);
      if (S.meanG !== null && S.meanG !== undefined) {
        ctx.fillStyle = C.viz4;
        ctx.fillText(`mean over ${S.nEp} eps = ${S.meanG.toFixed(2)}${S.seV !== null && S.seV !== undefined ? " ± " + S.seV.toFixed(2) : ""}`, tx + 110, by + 14);
      }
      ctx.fillStyle = C.viz7;
      ctx.fillText(`V^π(s₀) = ${S.trueV0.toFixed(2)}`, tx + 10, by + 30);
      ctx.fillStyle = C.muted;
      ctx.fillText(`V*(s₀) = ${S.Vstar0.toFixed(2)}`, tx + 130, by + 30);
    }
  },

  drill: {
    cards: [
      { q: "Name the five components of an MDP.", a: "`(S, A, P, R, γ)` — states, actions, transition kernel `P(s′|s,a)`, reward function `R(s,a,s′)`, discount `γ`. Plus an initial-state distribution in practice.", tags: ["definition"] },
      { q: "State the Markov property and what it really constrains.", a: "`P(s_{t+1} | s_t, a_t) = P(s_{t+1} | history)`. It constrains your *state representation*, not the world: the state must be a sufficient statistic of the past for predicting the future.", tags: ["markov"] },
      { q: "Write the return and its recursion.", a: "`G_t = Σ_{k≥0} γ^k R_{t+k+1}`, equivalently `G_t = R_{t+1} + γ·G_{t+1}`. That recursion is the seed of every Bellman equation.", tags: ["return"] },
      { q: "Define V^π and Q^π.", a: "`V^π(s) = E_π[G_t | S_t=s]`; `Q^π(s,a) = E_π[G_t | S_t=s, A_t=a]` (take `a` now, follow `π` after). Both are expectations, so single returns are noisy samples.", tags: ["value"] },
      { q: "Why does γ exist? Give three reasons.", a: "(1) Preference for sooner reward; (2) it keeps returns finite in continuing tasks (`|G| ≤ R_max/(1−γ)`); (3) it sets the effective horizon ≈ `1/(1−γ)`, which bounds how far credit can be assigned.", tags: ["discount"] },
      { q: "Define the advantage function.", a: "`A^π(s,a) = Q^π(s,a) − V^π(s)` — how much better than the policy's average this action is. `E_{a~π}[A^π(s,a)] = 0`. It is the low-variance signal used by policy-gradient and actor-critic methods.", tags: ["advantage"] },
      { q: "What is potential-based reward shaping and why is it safe?", a: "`F(s,s′) = γΦ(s′) − Φ(s)` for any `Φ: S → ℝ`. It telescopes over any trajectory, changing all returns by the constant `−Φ(s₀)` (plus a terminal term), so the argmax policy is unchanged. Non-potential shaping can create reward cycles.", tags: ["shaping"] },
      { q: "Why must you NOT treat a time-limit truncation as terminal?", a: "Terminal means `V(s′) = 0` by definition. A time limit does not zero future value, so you must still bootstrap `γV(s′)` at truncation; otherwise the agent learns that the world ends and undervalues states near the cutoff.", tags: ["pitfall"] }
    ],
    sixtySecond: [
      "Define an MDP and explain what the Markov property demands of your state representation.",
      "Explain return, value, and advantage, and what γ trades off."
    ]
  }
};
