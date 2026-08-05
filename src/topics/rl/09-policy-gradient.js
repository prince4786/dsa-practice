export default {
  id: "policy-gradient",
  track: "rl",
  title: "REINFORCE / Policy Gradients",
  difficulty: 3,
  minutes: 18,
  tags: ["policy-gradient", "reinforce", "baseline", "variance-reduction"],

  explainer: [
    { type: "p", text: "Every method so far in this track (value iteration, Q-learning, SARSA) has followed the same basic recipe: learn a value function that scores states or state-action pairs, and then get behavior almost for free by acting greedily on those scores — 'do whatever action has the highest Q-value.' **Policy gradient** methods take a fundamentally different approach: instead of learning values and deriving a policy from them as an afterthought, they directly parameterize the policy itself as a function with tunable numbers (weights) `θ` (theta) — written `π_θ(a|s)`, meaning 'the probability of taking action `a` in state `s`, according to the current settings of θ' — and then adjust those weights, step by step, to make good actions more likely. This is genuinely useful for a few concrete reasons: it works naturally with continuous action spaces (like a steering angle or a motor torque) where there's no way to loop over every action to find a maximum; it allows the truly optimal policy to be randomized/stochastic rather than a single fixed choice, which matters in situations like partially-observed games or negotiations; and mathematically, the objective you're optimizing stays smooth, whereas Q-learning's `argmax` makes the resulting policy jump discontinuously as the parameters change slightly." },
    { type: "h3", text: "The score-function trick: how do you get a gradient through something random?" },
    { type: "p", text: "There's a real mathematical puzzle hiding here: the agent's total reward depends on the environment's behavior, and you have no way to compute a gradient (a derivative telling you which direction to nudge your parameters) through the environment itself — it's not a differentiable function you wrote, it's the world. The trick, called the **score-function estimator** (or log-derivative trick), is that you don't need to differentiate through the environment at all — you only need to differentiate through the *policy's own probability of choosing the actions it took*. Using the calculus identity `∇log p = ∇p / p` (the gradient of a log equals the gradient of the thing divided by the thing itself), the math works out to:" },
    { type: "code", lang: "pseudo", code: "grad J = grad_theta E_tau[R]\n       = E_tau[ R(tau) * grad_theta log p_theta(tau) ]\n       = E_tau[ R(tau) * sum_t grad_theta log pi_theta(a_t | s_t) ]" },
    { type: "p", text: "Here `τ` (tau) denotes one full trajectory (an entire episode's sequence of states, actions, and rewards), and `R(τ)` is its total return. The remarkable thing about the final line is that the environment's own transition probabilities, `P(s′|s,a)`, have completely disappeared from the formula — they cancel out because they don't depend on `θ` at all. That is precisely why this method is **model-free**: you never needed to know or estimate how the environment works, only to be able to sample actions from your policy and compute the (log-)probability of the action you sampled." },
    { type: "h3", text: "REINFORCE: the simplest policy-gradient algorithm" },
    { type: "p", text: "Putting the formula above into an actual update rule gives you **REINFORCE**: `θ ← θ + α Σ_t G_t ∇log π_θ(a_t|s_t)`. In plain words: for every action the agent actually took during an episode, nudge the policy's parameters to increase the probability of having taken that action, and scale how hard you push by `G_t`, the actual return that followed it (recap from lesson 2). Good outcomes get their causing actions reinforced more strongly; bad outcomes get theirs reinforced less (or, if `G_t` is negative, actively discouraged). Two refinements to this basic recipe are close to mandatory in practice, not just nice-to-haves." },
    { type: "list", items: [
      "**Causality, also called reward-to-go** — an action taken at time `t` cannot possibly have caused a reward that already happened *before* time `t`, so including past rewards in the update just adds noise for no benefit. The fix is to only sum future rewards from that point on: `G_t = Σ_{k≥t} γ^{k−t} r_{k+1}`, instead of the total return over the whole episode. This is still a perfectly unbiased estimate of the same gradient, and it strictly reduces its variance (how noisy/jumpy the gradient estimate is).",
      "**Baseline subtraction** — subtract any function `b(s)` from `G_t`, as long as that function doesn't depend on which action was taken, giving `(G_t − b(s_t))∇log π` instead. This sounds like it should change the answer, but it provably doesn't — it stays mathematically unbiased, because `E_a[∇log π(a|s)]` (averaged over actions the policy could take) is exactly zero, so multiplying that zero by any `b(s)` still contributes exactly zero to the expectation, while it can dramatically reduce the variance of the estimate. The standard, most common choice is `b(s) = V(s)` (the state-value function from lesson 2), which turns the multiplier in the update into exactly the advantage function `A(s,a)` from lesson 2 — and using a learned value function as this baseline is precisely what defines actor-critic methods, covered in lesson 10."
    ]},
    { type: "callout", tone: "tip", text: "The clearest way to build intuition for why the baseline matters: imagine every single return in your batch of data happens to be positive (a very common situation — many reward scales are all non-negative by design). Without a baseline, *every* sampled action's probability gets pushed up, regardless of whether that action was actually good or mediocre — the policy only improves at all because good actions get pushed up harder than mediocre ones, and the whole thing relies on the probabilities being renormalized to sum to 1 behind the scenes. Subtracting a baseline (roughly, the average return) makes the sign of the update actually meaningful: better-than-average actions get pushed up, worse-than-average actions get pushed down, directly. As a concrete illustration: if you simply add a constant +1000 to every reward in the environment, un-baselined REINFORCE's behavior changes completely (everything now looks 'even more positive'), while the baselined version is completely unaffected, because the baseline automatically absorbs any constant shift." },
    { type: "h3", text: "Why REINFORCE alone doesn't work well in practice" },
    { type: "list", items: [
      "**High variance** — the gradient estimate's noise grows with how long the episode is and with the scale of the rewards involved, so estimates built from only a handful of sampled episodes can be extremely jumpy and unreliable.",
      "**On-policy and sample-hungry** — every single gradient update requires brand-new rollouts (fresh episodes) collected under the *current* version of the policy (recap of on-policy from lesson 7); you cannot simply reuse a stored replay buffer of old experience the way off-policy methods like Q-learning can, without adding correction terms.",
      "**No built-in safety on step size** — a single overly large update can collapse the policy onto one bad, nearly-deterministic action. Once that happens, the log-probability gradient for every other action shrinks toward zero too (because the policy is no longer sampling them), and the policy can get permanently stuck and never recover."
    ]},
    { type: "h3", text: "How later methods fix these problems" },
    { type: "p", text: "**Actor-critic** methods (lesson 10) replace the noisy, full-episode return `G_t` with a learned, lower-variance advantage estimate — trading a bit of bias (since the learned critic is imperfect) for a large reduction in variance. **GAE(λ)** (Generalized Advantage Estimation) is a specific technique that smoothly interpolates between a low-variance, one-step TD-based advantage estimate and the high-variance, full Monte-Carlo advantage — the same n-step/λ dial from lesson 5's TD(λ), applied here to advantages instead of raw values. **Natural policy gradient** and **TRPO** (Trust Region Policy Optimization) take a more mathematically careful approach: instead of limiting how far the raw parameter numbers `θ` move, they limit how far the resulting *action probability distribution* moves, using a tool from information geometry called the Fisher information matrix — this avoids the problem where an equally-sized step in parameter space can mean a tiny behavioral change in one part of the policy and a catastrophic one in another. **PPO** (Proximal Policy Optimization) achieves a similar, cheaper effect by directly limiting (clipping) the **importance ratio** `r_t(θ) = π_θ(a|s)/π_old(a|s)` — how much more or less likely the new policy is to take an action compared to the old policy that actually collected the data. This clipping also happens to be exactly what makes it safe for PPO to run several passes of optimization over the same batch of collected data, instead of throwing it away after one gradient step like plain REINFORCE." },
    { type: "callout", tone: "pitfall", text: "**Entropy collapse** is the single most characteristic failure mode of policy-gradient training: the policy commits too early to a narrow set of actions before it has adequately explored, and its behavior stops changing meaningfully even though it hasn't actually found a good solution. `H(π)` (entropy of the policy — recap from lesson 8, a measure of how spread-out its action probabilities are) is worth watching as a first-class training metric, not an afterthought; if it crashes to near zero early in training, the policy has locked in before exploring enough. The standard remedies are: adding an explicit entropy bonus to the training objective (rewarding the policy for staying spread-out), reducing the step size, and, specifically in PPO, adding an early-stopping rule that halts an update if the KL divergence (a measure of how different the new policy's action probabilities are from the old policy's) between old and new policy exceeds a target threshold." }
  ],

  glossary: [
    { term: "Policy gradient", plain: "A family of methods that directly adjusts a policy's parameters to make good actions more likely, instead of learning a value function first and deriving behavior from it." },
    { term: "π_θ(a|s) — parameterized policy", plain: "The policy written as a function with tunable numbers, θ (theta): the probability of taking action `a` in state `s`, given the current parameter settings." },
    { term: "θ (theta)", plain: "The tunable numbers (weights) of a parameterized policy or value function, adjusted during training to improve performance." },
    { term: "Gradient ascent", plain: "Repeatedly nudging parameters in the direction that increases some target quantity — here, expected total reward — the mirror image of gradient descent, which minimizes something." },
    { term: "Score-function estimator (log-derivative trick)", plain: "A mathematical technique that lets you compute a gradient of an expected reward through a random sampling process, using only the policy's own probabilities — no need to differentiate through the environment itself." },
    { term: "Trajectory (τ, tau)", plain: "One complete sequence of states, actions, and rewards from the start of an episode to its end." },
    { term: "REINFORCE", plain: "The simplest policy-gradient algorithm: increase the probability of every action taken, scaled by the return that followed it." },
    { term: "Reward-to-go (causality)", plain: "Using only the rewards that happen after an action, not before it, when computing how much credit that action deserves — since an action can't affect what already happened." },
    { term: "Baseline", plain: "A reference value subtracted from the return before using it in an update, which reduces noise in the gradient estimate without changing its expected value, as long as it doesn't depend on the action taken." },
    { term: "Variance (of a gradient estimate)", plain: "How much a repeated random estimate bounces around from sample to sample. High variance means noisy, unreliable training signals." },
    { term: "GAE(λ) — Generalized Advantage Estimation", plain: "A technique for estimating the advantage function that blends short-term, low-noise estimates with long-term, more accurate ones, controlled by a tunable parameter λ (lambda)." },
    { term: "Trust region", plain: "A limit on how much a policy is allowed to change in one update step, used to prevent a single bad update from destroying training progress." },
    { term: "Importance ratio", plain: "How much more or less likely the current policy is to take a given action compared to the policy that originally collected the data — used to safely reuse that data for more than one update." },
    { term: "Entropy collapse", plain: "A failure mode where a policy narrows down to near-deterministic behavior too early, before adequately exploring, and then stops improving." },
    { term: "KL divergence", plain: "A measure of how different two probability distributions are from each other — here, used to measure how much a policy has changed between updates." }
  ],

  complexity: {
    rows: [
      { operation: "REINFORCE update", time: "O(H·|θ|)", space: "O(H)", note: "needs the full episode before updating" },
      { operation: "Gradient variance", time: "grows with H and reward scale", space: "—", note: "reward-to-go + baseline are the cheap fixes" },
      { operation: "Baseline (value head)", time: "O(H·|θ_v|)", space: "O(|θ_v|)", note: "unbiased for any b(s); optimal ≈ V(s)" },
      { operation: "Sample reuse", time: "on-policy only", space: "—", note: "PPO gets ~3–10 epochs per batch via clipped ratios" }
    ]
  },

  interview: {
    whyAsked: "This is the gateway to everything modern — PPO, RLHF, GRPO. Interviewers check that you can derive the score-function estimator, explain precisely why a baseline does not bias it, and name the failure modes (variance, entropy collapse, on-policy cost) rather than just reciting the formula.",
    followUps: [
      { q: "Derive the policy gradient.", a: "∇E_τ[R] = ∇∫p_θ(τ)R(τ)dτ = ∫R(τ)∇p_θ(τ)dτ = ∫p_θ(τ)R(τ)∇log p_θ(τ)dτ = E[R(τ)Σ_t ∇log π_θ(a_t|s_t)], using ∇p = p∇log p. The transition probabilities cancel from ∇log p_θ(τ) because they do not depend on θ, so the estimator is model-free and unbiased." },
      { q: "Why does subtracting a baseline not bias the gradient?", a: "Because E_{a~π}[∇log π(a|s)] = Σ_a π∇log π = Σ_a ∇π = ∇Σ_a π = ∇1 = 0. Any b(s) that does not depend on the action multiplies that zero, so the expectation is unchanged while the variance can drop dramatically. The variance-minimising baseline is a gradient-magnitude-weighted average of returns; V(s) is the standard practical choice." },
      { q: "What is the practical difference between REINFORCE and actor-critic?", a: "REINFORCE uses the Monte-Carlo return G_t — unbiased, high variance, and only available at episode end. Actor-critic replaces it with a bootstrapped advantage such as r + γV(s′) − V(s), which is biased while the critic is wrong but has far lower variance and allows online, per-step updates. GAE(λ) dials continuously between them." },
      { q: "When would you choose a policy-gradient method over DQN?", a: "Continuous or very large action spaces (no tractable argmax), problems where the optimal policy is genuinely stochastic (partial observability, adversarial games), and cases where you need direct control over the policy distribution — an entropy target or a KL constraint to a reference model, as in RLHF." },
      { q: "What is PPO doing and why does it work?", a: "It maximises min(r_t(θ)Â_t, clip(r_t(θ), 1−ε, 1+ε)Â_t) where r_t is the importance ratio to the sampling policy. Clipping removes the incentive to move the policy far from the data-collecting policy, giving a cheap approximate trust region, which both stabilises the update and legitimises several optimisation epochs on the same batch." },
      { q: "Your policy's entropy collapses in the first few thousand steps. What do you do?", a: "Add or raise the entropy bonus, cut the learning rate, clip more aggressively or add a KL early-stop, and check the advantage normalisation — un-normalised advantages with a large reward scale produce huge first steps. Also verify the baseline: without one, a positive reward offset inflates every update and drives premature commitment." },
      { q: "How does this map onto RLHF?", a: "The LLM is π_θ over token sequences, the reward comes from a learned preference model on completions, and PPO is the optimiser with a per-token KL penalty to the frozen reference policy acting as the trust region. GRPO drops the value network entirely and uses the group-normalised reward across several sampled completions as its baseline — REINFORCE with a batch baseline, at scale." }
    ]
  },

  code: [
    { lang: "python", label: "REINFORCE with reward-to-go and a baseline", code: "import numpy as np\n\ndef reinforce_episode(policy, env, alpha, gamma, baseline=None, rng=None):\n    states, actions, rewards = [], [], []\n    s, done = env.reset(), False\n    while not done:\n        p = policy.probs(s)                 # softmax over preferences\n        a = rng.choice(len(p), p=p)\n        s2, r, done = env.step(a)\n        states.append(s); actions.append(a); rewards.append(r)\n        s = s2\n\n    # reward-to-go: an action cannot affect earlier rewards\n    G, returns = 0.0, np.zeros(len(rewards))\n    for t in reversed(range(len(rewards))):\n        G = rewards[t] + gamma * G\n        returns[t] = G\n\n    for t, (s, a) in enumerate(zip(states, actions)):\n        b = baseline(s) if baseline else 0.0\n        adv = returns[t] - b                # unbiased for ANY b(s)\n        p = policy.probs(s)\n        grad = -p.copy()                    # d log pi(a) / d theta_i = 1[i==a] - pi_i\n        grad[a] += 1.0\n        policy.theta[s] += alpha * (gamma ** t) * adv * grad\n    return sum(rewards)" },
    { lang: "python", label: "Why the baseline is unbiased", code: "# E_{a~pi}[ grad log pi(a|s) ] = sum_a pi(a|s) grad log pi(a|s)\n#                              = sum_a grad pi(a|s)\n#                              = grad sum_a pi(a|s) = grad 1 = 0\n#\n# Therefore  E[ b(s) * grad log pi ] = b(s) * 0 = 0  for any b that\n# does not depend on the action, so subtracting it changes the VARIANCE\n# but not the EXPECTATION of the gradient estimate.\n#\n# Optimal baseline (scalar case):\n#   b* = E[ (grad log pi)^2 * G ] / E[ (grad log pi)^2 ]\n# In practice b(s) = V(s), which makes the coefficient the advantage A(s,a)." },
    { lang: "python", label: "PPO clipped surrogate (the modern default)", code: "def ppo_loss(logp_new, logp_old, adv, eps=0.2, ent=None, c_ent=0.01):\n    ratio = torch.exp(logp_new - logp_old)          # pi_theta / pi_old\n    adv = (adv - adv.mean()) / (adv.std() + 1e-8)   # normalise: scale-free steps\n    unclipped = ratio * adv\n    clipped   = torch.clamp(ratio, 1 - eps, 1 + eps) * adv\n    policy_loss = -torch.min(unclipped, clipped).mean()\n    if ent is not None:\n        policy_loss = policy_loss - c_ent * ent.mean()   # keep the policy stochastic\n    return policy_loss" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.8, maxFrames: 260 },

    params: [
      { key: "arms",     label: "Actions (k)",   type: "int", min: 3, max: 6, default: 5 },
      { key: "episodes", label: "Episodes",      type: "int", min: 60, max: 600, default: 300 },
      { key: "alphaPct", label: "α (×0.01)",     type: "int", min: 1, max: 40, default: 10 },
      { key: "offset",   label: "Reward offset", type: "int", min: 0, max: 20, default: 8 },
      { key: "seed",     label: "New task",      type: "seed" }
    ],

    frames: function* (params, rng) {
      const k = params.arms;
      const alpha = params.alphaPct / 100;
      const offset = params.offset;
      const gauss = () => {
        const u = Math.max(1e-12, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };

      const mu = [];
      for (let a = 0; a < k; a++) mu.push(offset + gauss());
      let best = 0;
      for (let a = 1; a < k; a++) if (mu[a] > mu[best]) best = a;

      const softmax = (th) => {
        let m = -Infinity;
        for (const x of th) m = Math.max(m, x);
        const e = th.map(x => Math.exp(x - m));
        let s = 0;
        for (const x of e) s += x;
        return e.map(x => x / s);
      };

      let thA = new Array(k).fill(0);   // no baseline
      let thB = new Array(k).fill(0);   // with baseline
      let bA = 0, bB = 0;               // running mean of returns (baseline for B)
      let sumA = 0, sumB = 0;
      const hEp = [], hRA = [], hRB = [], hGA = [], hGB = [], hHA = [], hHB = [];

      const entropy = (p) => {
        let h = 0;
        for (const x of p) if (x > 1e-12) h -= x * Math.log(x);
        return h;
      };

      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: [o.aA, o.aB],
        state: {
          k: k, mu: mu.slice(), best: best, offset: offset, alpha: alpha,
          pA: softmax(thA), pB: softmax(thB),
          thA: thA.slice(), thB: thB.slice(),
          dA: o.dA ? o.dA.slice() : null, dB: o.dB ? o.dB.slice() : null,
          aA: o.aA === undefined ? -1 : o.aA, aB: o.aB === undefined ? -1 : o.aB,
          gA: o.gA === undefined ? null : o.gA, gB: o.gB === undefined ? null : o.gB,
          baseline: bB, ep: o.ep, totalEp: params.episodes,
          hEp: hEp.slice(), hRA: hRA.slice(), hRB: hRB.slice(),
          hGA: hGA.slice(), hGB: hGB.slice(), hHA: hHA.slice(), hHB: hHB.slice(),
          entA: entropy(softmax(thA)), entB: entropy(softmax(thB))
        }
      });

      yield snap({
        label: `A ${k}-action softmax policy, π(a) = softmax(θ)ₐ, all θ=0 so π is uniform. Rewards are r ~ N(μₐ, 1) with every μ shifted by +${offset} — an innocuous change that wrecks un-baselined REINFORCE. Action ${best + 1} is best (μ=${mu[best].toFixed(2)}).`,
        phase: "init", ep: 0
      });

      const sampleA = (p) => {
        const u = rng();
        let acc = 0;
        for (let a = 0; a < p.length; a++) { acc += p[a]; if (u < acc) return a; }
        return p.length - 1;
      };

      const yieldEvery = Math.max(1, Math.round((params.episodes - 16) / 60));

      for (let ep = 1; ep <= params.episodes; ep++) {
        const pA = softmax(thA), pB = softmax(thB);
        const aA = sampleA(pA), aB = sampleA(pB);
        const noise = gauss();
        const rA = mu[aA] + noise;             // common noise: same draw, fair race
        const rB = mu[aB] + noise;

        // ---- REINFORCE, no baseline: dtheta_i = alpha * G * (1[i=a] - p_i) ----
        const dA = [], dB = [];
        let gnA = 0, gnB = 0;
        for (let i = 0; i < k; i++) {
          const score = (i === aA ? 1 : 0) - pA[i];
          const d = alpha * rA * score;
          dA.push(d); gnA += d * d;
        }
        // ---- REINFORCE with a running-mean baseline --------------------------
        const bPrev = bB;
        const adv = rB - bB;
        for (let i = 0; i < k; i++) {
          const score = (i === aB ? 1 : 0) - pB[i];
          const d = alpha * adv * score;
          dB.push(d); gnB += d * d;
        }
        thA = thA.map((x, i) => x + dA[i]);
        thB = thB.map((x, i) => x + dB[i]);
        bB = bB + 0.05 * (rB - bB);            // baseline learns E[G]
        bA = bA + 0.05 * (rA - bA);            // tracked only for display
        sumA += mu[aA]; sumB += mu[aB];
        gnA = Math.sqrt(gnA); gnB = Math.sqrt(gnB);

        hEp.push(ep); hRA.push(sumA / ep); hRB.push(sumB / ep);
        hGA.push(gnA); hGB.push(gnB);
        hHA.push(entropy(softmax(thA))); hHB.push(entropy(softmax(thB)));

        if (ep <= 16 || ep % yieldEvery === 0 || ep === params.episodes) {
          let label;
          if (ep <= 16) {
            label = `Episode ${ep}: no-baseline sampled a${aA + 1}, got G=${rA.toFixed(2)}; update Δθ = α·G·(1[i=a] − πᵢ) = ${dA.map(x => x.toFixed(3)).join(", ")}. ` +
              `Baselined sampled a${aB + 1}, G=${rB.toFixed(2)}, b=${bPrev.toFixed(2)}, so A = G−b = ${adv.toFixed(2)} and Δθ = ${dB.map(x => x.toFixed(3)).join(", ")}. Same trick, one shifted by the mean.`;
          } else {
            label = `Episode ${ep}: mean true reward — no baseline ${(sumA / ep).toFixed(2)}, baselined ${(sumB / ep).toFixed(2)} (best possible ${mu[best].toFixed(2)}). ` +
              `Gradient norms ${gnA.toFixed(3)} vs ${gnB.toFixed(3)}: the un-baselined update is ~${(gnA / Math.max(1e-6, gnB)).toFixed(1)}× larger and mostly noise, because G ≈ +${offset} pushes EVERY sampled action up. Entropy ${entropy(softmax(thA)).toFixed(2)} vs ${entropy(softmax(thB)).toFixed(2)}.`;
          }
          yield snap({
            label: label, phase: ep === params.episodes ? "done" : "train",
            ep: ep, aA: aA, aB: aB, dA: dA, dB: dB, gA: gnA, gB: gnB
          });
        }
      }

      const pA = softmax(thA), pB = softmax(thB);
      yield snap({
        label: `Done. π(best action): no baseline ${(pA[best] * 100).toFixed(0)}%, with baseline ${(pB[best] * 100).toFixed(0)}%. Average reward ${(sumA / params.episodes).toFixed(2)} vs ${(sumB / params.episodes).toFixed(2)}. Subtracting b(s) does not change the *expected* gradient at all — `+
          `E[b·∇log π] = b·0 = 0 — it only removes the shared offset that was drowning the signal.`,
        phase: "done", ep: params.episodes
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`Episode ${S.ep} / ${S.totalEp}`, pad, 15);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`α=${S.alpha.toFixed(2)}   reward offset +${S.offset}   baseline b=${S.baseline.toFixed(2)}`, pad + 130, 15);

      const topY = pad + 22;
      const topH = Math.round((H - topY - pad) * 0.56);
      const panelW = (W - pad * 3) / 2;

      const panel = (x0, title, p, d, pick, col, sub) => {
        ctx.fillStyle = C.surface;
        ctx.beginPath(); ctx.roundRect(x0, topY, panelW, topH, 8); ctx.fill();
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x0 + .5, topY + .5, panelW - 1, topH - 1, 8); ctx.stroke();

        ctx.textAlign = "left"; ctx.fillStyle = col; ctx.font = `12px ${env.font.base}`;
        ctx.fillText(title, x0 + 10, topY + 16);
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(sub, x0 + 10, topY + 30);

        const baseY = topY + topH - 40;
        const plotTop = topY + 40;
        const plotH = baseY - plotTop;
        const slot = (panelW - 24) / S.k;

        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0 + 10, baseY + .5); ctx.lineTo(x0 + panelW - 10, baseY + .5); ctx.stroke();

        let muMin = Infinity, muMax = -Infinity;
        for (const m of S.mu) { muMin = Math.min(muMin, m); muMax = Math.max(muMax, m); }

        for (let a = 0; a < S.k; a++) {
          const cx = x0 + 12 + slot * (a + 0.5);
          const bw = Math.min(34, slot * 0.5);
          const h = Math.max(1, p[a] * plotH);
          if (a === pick) {
            ctx.fillStyle = C.viz4; ctx.globalAlpha = 0.18;
            ctx.beginPath(); ctx.roundRect(cx - slot / 2 + 2, plotTop - 8, slot - 4, plotH + 30, 6); ctx.fill();
            ctx.globalAlpha = 1;
          }
          ctx.fillStyle = a === S.best ? C.viz6 : col;
          ctx.beginPath(); ctx.roundRect(cx - bw / 2, baseY - h, bw, h, 3); ctx.fill();

          ctx.textAlign = "center"; ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = C.text;
          ctx.fillText((p[a] * 100).toFixed(0) + "%", cx, baseY - h - 5);
          ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(`a${a + 1}`, cx, baseY + 12);
          ctx.fillStyle = a === S.best ? C.viz6 : C.muted;
          ctx.fillText(`μ${S.mu[a].toFixed(1)}`, cx, baseY + 22);

          // signed Δθ tick
          if (d) {
            const scale = 26;
            let mx = 1e-6;
            for (const x of d) mx = Math.max(mx, Math.abs(x));
            const hh = (Math.abs(d[a]) / mx) * scale;
            const zy = baseY + 34;
            ctx.fillStyle = d[a] >= 0 ? C.viz6 : C.viz8;
            ctx.fillRect(cx - 5, d[a] >= 0 ? zy - hh : zy, 10, Math.max(1, hh));
          }
        }
        if (d) {
          ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x0 + 10, baseY + 34.5); ctx.lineTo(x0 + panelW - 10, baseY + 34.5); ctx.stroke();
          ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText("Δθ", x0 + 10, baseY + 32);
        }
      };

      panel(pad, "REINFORCE, no baseline", S.pA, S.dA, S.aA, C.viz2,
        `Δθᵢ = α·G·(1[i=a] − πᵢ)   H(π)=${S.entA.toFixed(2)}`);
      panel(pad * 2 + panelW, "REINFORCE + baseline", S.pB, S.dB, S.aB, C.viz1,
        `Δθᵢ = α·(G−b)·(1[i=a] − πᵢ)   H(π)=${S.entB.toFixed(2)}`);

      // ---------- bottom: gradient-norm jitter + mean reward ------------------
      const by = topY + topH + 14;
      const bh = H - by - pad;
      const halfW = (W - pad * 3) / 2;

      const chart = (x0, title, seriesA, seriesB, maxV, minV) => {
        ctx.fillStyle = C.surface;
        ctx.beginPath(); ctx.roundRect(x0, by, halfW, bh, 8); ctx.fill();
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x0 + .5, by + .5, halfW - 1, bh - 1, 8); ctx.stroke();
        ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(title, x0 + 10, by + 14);

        const gx0 = x0 + 38, gx1 = x0 + halfW - 10;
        const gy0 = by + 20, gy1 = by + bh - 14;
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        for (let i = 0; i <= 2; i++) {
          const y = gy1 - (i / 2) * (gy1 - gy0);
          ctx.beginPath(); ctx.moveTo(gx0, y + .5); ctx.lineTo(gx1, y + .5); ctx.stroke();
          ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText((minV + (maxV - minV) * (i / 2)).toFixed(2), gx0 - 4, y + 3);
        }
        const line = (ys, col) => {
          if (!ys || ys.length < 2) return;
          ctx.strokeStyle = col; ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let i = 0; i < ys.length; i++) {
            const x = gx0 + (S.hEp[i] / Math.max(1, S.totalEp)) * (gx1 - gx0);
            const v = Math.max(minV, Math.min(maxV, ys[i]));
            const y = gy1 - ((v - minV) / (maxV - minV)) * (gy1 - gy0);
            if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
          }
          ctx.stroke();
        };
        line(seriesA, C.viz2);
        line(seriesB, C.viz1);
      };

      let gmax = 0.05;
      for (const g of S.hGA) gmax = Math.max(gmax, g);
      chart(pad, "‖Δθ‖ per episode — the variance story", S.hGA, S.hGB, gmax, 0);

      let rmin = Infinity, rmax = -Infinity;
      for (const m of S.mu) { rmin = Math.min(rmin, m); rmax = Math.max(rmax, m); }
      chart(pad * 2 + halfW, "average true reward per episode", S.hRA, S.hRB, rmax + 0.1, rmin - 0.1);
    }
  },

  drill: {
    cards: [
      { q: "Write the policy-gradient theorem (score-function form).", a: "`∇_θ J(θ) = E_{τ~π_θ}[ Σ_t G_t ∇_θ log π_θ(a_t|s_t) ]`. Derived from `∇p = p∇log p`; the transition probabilities cancel because they do not depend on θ.", tags: ["theory"] },
      { q: "Write the REINFORCE update.", a: "`θ ← θ + α Σ_t γ^t (G_t − b(s_t)) ∇log π_θ(a_t|s_t)` with reward-to-go `G_t = Σ_{k≥t}γ^{k−t}r_{k+1}`. Increase the log-probability of actions in proportion to how much better than baseline the return was.", tags: ["update-rule"] },
      { q: "Why is subtracting a baseline unbiased?", a: "`E_{a~π}[∇log π(a|s)] = Σ_a ∇π(a|s) = ∇1 = 0`, so any `b(s)` independent of the action contributes `b(s)·0 = 0` in expectation. Variance changes; the mean gradient does not.", tags: ["baseline"] },
      { q: "What baseline is standard and what does it turn the coefficient into?", a: "`b(s) = V(s)`, which makes the coefficient `G_t − V(s_t) ≈ A(s_t,a_t)`, the advantage. That is precisely the step from REINFORCE to actor-critic.", tags: ["baseline"] },
      { q: "Why does reward-to-go reduce variance without adding bias?", a: "An action at time t cannot influence rewards received before t, so those terms have zero correlation with `∇log π(a_t|s_t)` and contribute only noise. Dropping them leaves the expectation unchanged.", tags: ["variance"] },
      { q: "Name three failure modes of vanilla REINFORCE.", a: "(1) High gradient variance growing with horizon and reward scale; (2) on-policy sample inefficiency — no replay without importance corrections; (3) entropy collapse from an over-large step, after which the policy cannot recover.", tags: ["pitfalls"] },
      { q: "What does PPO optimise?", a: "`min( r_t(θ)Â_t , clip(r_t(θ), 1−ε, 1+ε)Â_t )` where `r_t(θ) = π_θ(a_t|s_t)/π_old(a_t|s_t)`. Clipping removes the incentive to move far from the sampling policy — a cheap trust region that also permits several epochs of reuse per batch.", tags: ["ppo"] },
      { q: "Policy gradient vs Q-learning: when is each preferred?", a: "Policy gradient for continuous/large action spaces, genuinely stochastic optimal policies, and direct control of the policy distribution (entropy/KL constraints). Q-learning for discrete actions where off-policy replay makes it far more sample efficient.", tags: ["comparison"] }
    ],
    sixtySecond: [
      "Derive the policy-gradient theorem and explain why the environment dynamics drop out.",
      "Explain why a baseline reduces variance without introducing bias, and how that leads to actor-critic."
    ]
  }
};
