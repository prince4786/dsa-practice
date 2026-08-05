export default {
  id: "actor-critic-rlhf",
  track: "rl",
  title: "Actor-Critic → RLHF",
  difficulty: 3,
  minutes: 20,
  tags: ["actor-critic", "advantage", "ppo", "rlhf", "reward-model", "kl-penalty"],

  explainer: [
    { type: "p", text: "Actor-critic is the marriage of the two halves of this track: a **policy** (actor) updated by policy gradient, and a **value function** (critic) updated by TD. The critic's job is to supply a low-variance baseline so the actor can learn from single steps instead of whole episodes." },
    { type: "h3", text: "The two updates" },
    { type: "code", lang: "pseudo", code: "delta = r + gamma * V(s') * (1 - done) - V(s)      # TD error ~ advantage\ncritic:  w     <- w     + alpha_v * delta * grad_w V(s)\nactor:   theta <- theta + alpha_p * delta * grad_theta log pi(a|s)" },
    { type: "p", text: "That is REINFORCE with `b(s) = V(s)` and the Monte-Carlo return replaced by a one-step bootstrap. The trade is explicit: `δ` is a *biased* advantage estimate while the critic is wrong, but its variance is a fraction of `G_t`'s. **GAE(λ)** makes the trade a dial: `Â_t = Σ_l (γλ)^l δ_{t+l}`, with λ=0 the one-step TD advantage and λ=1 the unbiased Monte-Carlo advantage." },
    { type: "callout", tone: "tip", text: "Read actor-critic as generalised policy iteration under sampling: the critic does approximate policy *evaluation*, the actor does approximate policy *improvement*, and neither runs to completion before the other moves. Everything from A2C to SAC to PPO to RLHF is that same loop with different variance-reduction and step-size machinery." },
    { type: "h3", text: "PPO in one paragraph" },
    { type: "p", text: "Because the critic's advantage estimate is only valid near the policy that generated the data, unconstrained actor steps are dangerous. PPO maximises `min(r_t(θ)Â_t, clip(r_t(θ), 1−ε, 1+ε)Â_t)` with `r_t(θ) = π_θ(a|s)/π_old(a|s)`. Once the ratio leaves the clip range the objective flattens, so there is no gradient pushing further. That approximate trust region is what makes it safe to run several optimisation epochs over one batch of rollouts — the difference between a research toy and something you can afford to run on a large language model." },
    { type: "h3", text: "RLHF: swap the critic's world for a reward model" },
    { type: "p", text: "In RLHF the MDP is degenerate in an interesting way: the state is the prompt plus the tokens generated so far, actions are tokens, and the episode ends when the answer does. There is no environment reward — so you *learn* one." },
    { type: "list", items: [
      "**Step 1 — SFT.** Fine-tune on demonstrations to get `π_ref`, a policy that at least follows instructions. This becomes both the initialisation and the anchor.",
      "**Step 2 — reward model.** Collect pairs `(y_w ≻ y_l)` for the same prompt and fit `r_φ` with the Bradley–Terry loss `−log σ(r_φ(x,y_w) − r_φ(x,y_l))`. Only *differences* are identified, so the scale and offset of `r_φ` are arbitrary — one reason values are usually normalised before PPO.",
      "**Step 3 — RL.** Optimise `E_{y~π_θ}[ r_φ(x,y) − β·log(π_θ(y|x)/π_ref(y|x)) ]`. The second term is a per-token KL penalty to the reference model: the **leash**."
    ]},
    { type: "callout", tone: "warn", text: "The reward model is a *proxy* learned from finite, noisy, biased human labels. Optimising it hard is Goodhart's law with a gradient: the policy finds the region where `r_φ` is wrong — verbosity, sycophancy, confident formatting, list-shaped answers — and true quality falls while measured reward keeps climbing. The KL term is what buys you time; it is not a fix, it is a leash." },
    { type: "h3", text: "Why the KL penalty, specifically" },
    { type: "p", text: "It has three jobs at once: (1) it keeps the policy inside the distribution where the reward model was trained and is therefore approximately valid; (2) it prevents catastrophic forgetting of the fluency and knowledge already in `π_ref`; (3) it acts as the trust region for the policy-gradient step. `β` is the exchange rate between reward and drift, and reported KL is the standard health metric — a run whose KL climbs while eval win-rate stalls is reward hacking, visibly." },
    { type: "h3", text: "The current landscape" },
    { type: "list", items: [
      "**PPO + reward model** — the classic InstructGPT recipe: actor, critic (value head), reward model, and frozen reference. Four model copies in memory, which is the main practical complaint.",
      "**DPO** — algebraically eliminates the reward model: the optimal KL-regularised policy has a closed form, so the preference likelihood can be written directly in terms of `π_θ` and `π_ref`. One model, one supervised-looking loss, no sampling loop — at the cost of learning only from the fixed offline preference set.",
      "**GRPO** — drops the value network: sample a group of `k` completions per prompt and use the group's mean (and std) as the baseline. It is REINFORCE with a batch baseline, and it is popular for verifiable-reward tasks such as maths and code where the reward is a checker rather than a learned model.",
      "**RLAIF / constitutional feedback** — replace or augment human labels with model-generated preferences to scale the data collection."
    ]},
    { type: "callout", tone: "pitfall", text: "Interview trap: 'RLHF makes the model smarter'. It does not add knowledge — it reweights the distribution over outputs the base model can already produce, toward what labellers rewarded. That is why capability benchmarks often move very little while helpfulness and format preference move a lot, and why an over-optimised policy loses diversity (the entropy of the output distribution collapses)." }
  ],

  complexity: {
    rows: [
      { operation: "Actor-critic step", time: "O(|θ| + |w|)", space: "O(1) trajectory", note: "fully online; no episode buffer needed" },
      { operation: "PPO iteration", time: "O(N·E·|θ|)", space: "O(N)", note: "N rollout steps, E epochs of reuse per batch" },
      { operation: "RLHF PPO memory", time: "—", space: "4 model copies", note: "actor, critic, reward model, frozen reference" },
      { operation: "DPO", time: "O(pairs·|θ|)", space: "2 model copies", note: "no sampling loop, no reward model" },
      { operation: "GRPO", time: "O(k rollouts/prompt)", space: "3 copies", note: "group mean replaces the value network" }
    ]
  },

  interview: {
    whyAsked: "For AI-lab roles this is the whole track's payload. The interviewer wants to see that you can explain the actor-critic loop precisely, place PPO's clip and RLHF's KL term as two instances of the same trust-region idea, and reason concretely about reward hacking and how it is measured.",
    followUps: [
      { q: "Why does the critic reduce variance, and what does it cost?", a: "It replaces the Monte-Carlo return G_t with a bootstrapped estimate r + γV(s′), collapsing an episode's worth of sampling noise into one step plus a learned function. The cost is bias: while V is wrong the advantage is wrong, and errors propagate through bootstrapping. GAE(λ) exposes the trade as a single knob between the two extremes." },
      { q: "What exactly does PPO's clipping do?", a: "It flattens the surrogate objective once the importance ratio leaves [1−ε, 1+ε], so there is no gradient encouraging the policy to move further from the sampling policy in that direction. This is a cheap first-order stand-in for TRPO's KL trust region, and it is what makes multiple optimisation epochs on one rollout batch safe." },
      { q: "Walk through the RLHF pipeline and what each stage changes.", a: "Pretrain gives a next-token predictor. SFT on demonstrations makes it follow instructions and gives π_ref. Preference pairs train a reward model with the Bradley–Terry loss. PPO then maximises reward minus β·KL(π_θ‖π_ref). Capabilities barely move; what changes is which of the model's existing behaviours get probability mass." },
      { q: "Why is there a KL penalty, and what does β trade off?", a: "It keeps the policy in the region where the reward model is valid, preserves the fluency of the reference model, and acts as the trust region for the update. Small β means more reward and more drift — eventually reward hacking; large β means a well-behaved but barely-changed policy. In practice β is tuned so the KL sits in a target band, sometimes with an adaptive controller." },
      { q: "What is reward hacking here and how would you detect it?", a: "The policy exploits regions where the learned reward model is inaccurate — verbosity, sycophancy, confident formatting, keyword stuffing. Detect it by plotting proxy reward against a held-out signal: fresh human evaluations or a reward model trained on different data. The signature is proxy reward rising while true win-rate flattens or drops, usually accompanied by rising KL and falling output entropy." },
      { q: "DPO vs PPO — what is actually different?", a: "DPO uses the closed form of the KL-regularised optimum to express the preference likelihood directly in π_θ and π_ref, so it trains on a fixed preference set with a supervised-style loss and no sampling loop or reward model. PPO is online: it samples from the current policy and can chase a reward model into regions the preference dataset never covered — more powerful, more capable of hacking, and more expensive." },
      { q: "Why does GRPO drop the value network?", a: "For prompt-level rewards you can obtain a baseline for free by sampling k completions per prompt and using the group's mean reward; the advantage is the (usually standardised) deviation from that mean. This removes a whole model from memory and avoids fitting a value function to a very sparse, sequence-level signal — a good fit for verifiable rewards like unit tests or maths checkers." },
      { q: "The reward model's absolute scores drift during training. Should you care?", a: "Only relative scores are identified by the Bradley–Terry loss — adding a constant to r_φ changes nothing — so absolute magnitude is not meaningful. What matters is calibration of differences and the reward's variance, which is why advantages are standardised per batch before the policy update." }
    ]
  },

  code: [
    { lang: "python", label: "One-step actor-critic (tabular)", code: "import numpy as np\n\ndef actor_critic(env, episodes, a_pi=0.1, a_v=0.3, gamma=0.98, rng=None):\n    theta = np.zeros((env.nS, env.nA))     # actor: softmax preferences\n    V     = np.zeros(env.nS)               # critic\n\n    def pi(s):\n        z = theta[s] - theta[s].max()\n        e = np.exp(z)\n        return e / e.sum()\n\n    for _ in range(episodes):\n        s, done, I = env.reset(), False, 1.0\n        while not done:\n            p = pi(s)\n            a = rng.choice(env.nA, p=p)\n            s2, r, done = env.step(a)\n\n            delta = r + gamma * (0.0 if done else V[s2]) - V[s]   # advantage estimate\n            V[s] += a_v * delta                                   # CRITIC: TD(0)\n\n            grad = -p.copy(); grad[a] += 1.0                       # d log pi(a)/d theta\n            theta[s] += a_pi * I * delta * grad                    # ACTOR: policy gradient\n            I *= gamma\n            s = s2\n    return theta, V" },
    { lang: "python", label: "GAE(λ) — the bias/variance dial", code: "def gae(rewards, values, dones, gamma=0.99, lam=0.95):\n    \"\"\"A_t = sum_l (gamma*lam)^l delta_{t+l};  lam=0 -> TD(0), lam=1 -> Monte Carlo.\"\"\"\n    T = len(rewards)\n    adv = np.zeros(T, dtype=np.float32)\n    last = 0.0\n    for t in reversed(range(T)):\n        nonterminal = 1.0 - dones[t]\n        delta = rewards[t] + gamma * values[t + 1] * nonterminal - values[t]\n        last = delta + gamma * lam * nonterminal * last\n        adv[t] = last\n    returns = adv + values[:T]          # value targets for the critic\n    return adv, returns" },
    { lang: "python", label: "RLHF: Bradley-Terry reward model + PPO objective", code: "# --- 1. reward model on preference pairs -------------------------------\ndef rm_loss(r_chosen, r_rejected):\n    # P(y_w > y_l) = sigmoid(r_w - r_l)   (Bradley-Terry)\n    return -F.logsigmoid(r_chosen - r_rejected).mean()\n# Only DIFFERENCES are identified: r and r + c fit equally well.\n\n# --- 2. PPO against the reward model, leashed to the reference ----------\ndef rlhf_step(prompts, policy, ref_policy, reward_model, value_head, beta=0.02):\n    seqs, logp = policy.generate(prompts)                 # roll out the actor\n    with torch.no_grad():\n        logp_ref = ref_policy.log_probs(seqs)\n        r_env    = reward_model(prompts, seqs)            # sequence-level score\n\n    # per-token KL leash, applied as a shaped reward\n    kl = logp - logp_ref\n    rewards = -beta * kl\n    rewards[:, -1] += r_env                               # RM score at the final token\n\n    adv, ret = gae(rewards, value_head(seqs))\n    adv = (adv - adv.mean()) / (adv.std() + 1e-8)\n    ratio = torch.exp(policy.log_probs(seqs) - logp.detach())\n    loss  = -torch.min(ratio * adv,\n                       torch.clamp(ratio, 0.8, 1.2) * adv).mean()\n    return loss + 0.5 * F.mse_loss(value_head(seqs), ret)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 300 },

    params: [
      { key: "mode",    label: "Mode",        type: "enum", options: ["actor-critic", "RLHF"], default: "actor-critic" },
      { key: "betaPct", label: "KL β (×0.01)", type: "int", min: 0, max: 60, default: 12 },
      { key: "steps",   label: "RL steps",    type: "int", min: 40, max: 300, default: 120 },
      { key: "seed",    label: "Reroll",      type: "seed" }
    ],

    frames: function* (params, rng) {
      const gauss = () => {
        const u = Math.max(1e-12, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const softmax = (z) => {
        let m = -Infinity;
        for (const x of z) m = Math.max(m, x);
        const e = z.map(x => Math.exp(x - m));
        let s = 0;
        for (const x of e) s += x;
        return e.map(x => x / s);
      };

      // ==================================================================
      //  MODE 1 — tabular actor-critic on a 7-state corridor
      // ==================================================================
      if (params.mode === "actor-critic") {
        const n = 7, startS = 3, gamma = 0.98;
        const aPi = 0.25, aV = 0.4;
        let theta = [];
        for (let i = 0; i < n; i++) theta.push([0, 0]);   // [left, right]
        let V = new Array(n).fill(0);
        const pOf = (s) => softmax(theta[s]);
        const stepEnv = (s, a) => {
          const ns = a === 1 ? s + 1 : s - 1;
          if (ns >= n) return [ns, 1, true];      // right end: +1
          if (ns < 0) return [ns, -1, true];      // left end: −1
          return [ns, -0.02, false];
        };

        const hEp = [], hRet = [], hDelta = [];
        const snap = (o) => ({
          label: o.label, phase: o.phase, focus: [o.s === undefined ? -1 : o.s],
          state: {
            mode: "ac", n: n, gamma: gamma,
            V: V.slice(), pi: theta.map(t => softmax(t)),
            theta: theta.map(t => t.slice()),
            s: o.s === undefined ? -1 : o.s, a: o.a === undefined ? -1 : o.a,
            r: o.r === undefined ? null : o.r, s2: o.s2 === undefined ? -1 : o.s2,
            delta: o.delta === undefined ? null : o.delta,
            vBefore: o.vBefore === undefined ? null : o.vBefore,
            vAfter: o.vAfter === undefined ? null : o.vAfter,
            dTheta: o.dTheta ? o.dTheta.slice() : null,
            stage: o.stage || "", ep: o.ep, t: o.t === undefined ? 0 : o.t,
            hEp: hEp.slice(), hRet: hRet.slice(), hDelta: hDelta.slice(),
            totalEp: 120
          }
        });

        yield snap({
          label: `Actor-critic on a 7-cell corridor. The actor is a softmax policy per cell (currently 50/50 everywhere); the critic is a value table (all zeros). Reaching the right end pays +1, the left end −1, and every step costs 0.02.`,
          phase: "init", ep: 0, stage: "init", s: startS
        });

        const totalEp = 120;
        for (let ep = 1; ep <= totalEp; ep++) {
          let s = startS, done = false, t = 0, ret = 0, I = 1;
          const verbose = ep <= 3;
          let dSum = 0;
          while (!done && t < 60) {
            const p = pOf(s);
            const a = rng() < p[1] ? 1 : 0;
            const [s2, r, dn] = stepEnv(s, a);
            const vS = V[s];
            const vNext = dn ? 0 : V[s2];
            const delta = r + gamma * vNext - vS;
            V = V.slice();
            V[s] = vS + aV * delta;
            const grad = [(a === 0 ? 1 : 0) - p[0], (a === 1 ? 1 : 0) - p[1]];
            const dTh = [aPi * I * delta * grad[0], aPi * I * delta * grad[1]];
            theta = theta.map((row, i) => (i === s ? [row[0] + dTh[0], row[1] + dTh[1]] : row.slice()));
            ret += r; dSum += Math.abs(delta); I *= gamma; t++;

            if (verbose && t <= 14) {
              yield snap({
                label: `Episode ${ep}, step ${t}: ACT — π(right|s${s}) = ${(p[1] * 100).toFixed(0)}%, sampled ${a === 1 ? "right" : "left"}. ` +
                  `CRITIC — δ = r + γV(s′) − V(s) = ${r.toFixed(2)} + ${gamma}·${vNext.toFixed(2)} − ${vS.toFixed(2)} = ${delta.toFixed(3)}; V(s${s}) ← ${vS.toFixed(3)} → ${V[s].toFixed(3)}. ` +
                  `ACTOR — Δθ = α·δ·(1[a]−π) = [${dTh.map(x => x.toFixed(3)).join(", ")}]. δ>0 means "better than the critic expected", so that action's probability goes up.`,
                phase: "step", ep: ep, t: t, s: s, a: a, r: r, s2: s2,
                delta: delta, vBefore: vS, vAfter: V[s], dTheta: dTh,
                stage: delta >= 0 ? "reinforce" : "discourage"
              });
            }
            s = s2; done = dn;
          }
          hEp.push(ep); hRet.push(ret); hDelta.push(dSum / Math.max(1, t));
          if (ep % 3 === 0 || ep === totalEp) {
            yield snap({
              label: `Episode ${ep}: return ${ret.toFixed(2)} in ${t} steps; mean |δ| = ${(dSum / Math.max(1, t)).toFixed(3)}. ` +
                (ep < 20
                  ? "The critic is still mostly wrong, so the actor is being steered by noisy advantages — this is exactly the bias you accept in exchange for not waiting for episode returns."
                  : `π(right) at the start cell is now ${(pOf(startS)[1] * 100).toFixed(0)}% and V(s${startS}) = ${V[startS].toFixed(2)}. As the critic converges, |δ| shrinks — a converged critic means the actor's gradient signal is pure advantage, not prediction error.`),
              phase: ep === totalEp ? "done" : "episode",
              ep: ep, t: t, stage: "loop"
            });
          }
        }
        yield snap({
          label: `Converged: π(right) ≈ ${(pOf(startS)[1] * 100).toFixed(0)}% at the start, V(s${startS}) = ${V[startS].toFixed(2)}. The critic performed approximate policy evaluation and the actor approximate improvement — generalised policy iteration, sampled. Switch the Mode control to RLHF to see the same loop with a *learned* reward in place of the environment's.`,
          phase: "done", ep: totalEp, stage: "loop"
        });
        return;
      }

      // ==================================================================
      //  MODE 2 — RLHF: reward model from preferences, then KL-leashed PPO
      // ==================================================================
      const beta = params.betaPct / 100;
      const K = 5;
      const NAMES = ["A: terse & correct", "B: chatty & correct", "C: long, hedged, wrong", "D: bulleted & correct", "E: short & wrong"];
      // features: [style (formatting/length/confidence), substance (correctness)]
      const feat = [
        [0.1, 1.0],
        [0.6, 0.9],
        [1.0, 0.15],
        [0.8, 0.95],
        [0.15, 0.1]
      ];
      // What we actually want: substance dominates.
      const trueU = feat.map(f => 1.0 * f[1] + 0.15 * f[0]);
      // What the annotators actually do: they over-reward style (length/confidence bias).
      const labU = feat.map(f => 0.75 * f[1] + 0.85 * f[0]);

      let phi = [0, 0];                                  // reward model weights
      const rm = (i) => phi[0] * feat[i][0] + phi[1] * feat[i][1];
      let logits = [0.4, 0.2, -0.3, 0.1, -0.4];          // the SFT policy's logits
      const refLogits = logits.slice();
      const refP = softmax(refLogits);

      const hStep = [], hRM = [], hTrue = [], hKL = [];
      const prefLog = [];

      const snapR = (o) => ({
        label: o.label, phase: o.phase, focus: o.pair ? o.pair.slice() : [],
        state: {
          mode: "rlhf", K: K, names: NAMES.slice(), feat: feat.map(f => f.slice()),
          trueU: trueU.slice(), phi: phi.slice(),
          rm: [0, 1, 2, 3, 4].map(i => rm(i)),
          p: softmax(logits), refP: refP.slice(),
          stage: o.stage, pair: o.pair ? o.pair.slice() : null,
          winner: o.winner === undefined ? -1 : o.winner,
          loss: o.loss === undefined ? null : o.loss,
          sampled: o.sampled === undefined ? -1 : o.sampled,
          beta: beta, kl: o.kl === undefined ? null : o.kl,
          step: o.step, nPref: prefLog.length, totalSteps: params.steps,
          hStep: hStep.slice(), hRM: hRM.slice(), hTrue: hTrue.slice(), hKL: hKL.slice(),
          adv: o.adv === undefined ? null : o.adv,
          rmScore: o.rmScore === undefined ? null : o.rmScore,
          klTerm: o.klTerm === undefined ? null : o.klTerm
        }
      });

      yield snapR({
        label: `RLHF. Five candidate answers to one prompt, each described by two features: style (length, confidence, formatting) and substance (correctness). What we WANT is substance. What annotators actually reward — measurably, in every published preference dataset — puts heavy weight on style. Watch what the reward model learns.`,
        stage: "setup", phase: "init", step: 0
      });

      // ---------- Phase 1: fit the Bradley-Terry reward model --------------
      const nPairs = 60, lrRM = 0.35;
      for (let it = 1; it <= nPairs; it++) {
        let i = Math.min(K - 1, Math.floor(rng() * K));
        let j = Math.min(K - 1, Math.floor(rng() * K));
        if (i === j) j = (j + 1) % K;
        // annotator prefers i with prob sigmoid(labU_i − labU_j) — noisy, and biased toward style
        const pi_ = 1 / (1 + Math.exp(-(labU[i] - labU[j]) * 3));
        const winner = rng() < pi_ ? i : j;
        const loser = winner === i ? j : i;
        // gradient of −log σ(r_w − r_l)
        const d = rm(winner) - rm(loser);
        const sig = 1 / (1 + Math.exp(-d));
        const g = (1 - sig);
        phi = [
          phi[0] + lrRM * g * (feat[winner][0] - feat[loser][0]),
          phi[1] + lrRM * g * (feat[winner][1] - feat[loser][1])
        ];
        prefLog.push([winner, loser]);
        const loss = -Math.log(Math.max(1e-9, sig));
        if (it <= 8 || it % 5 === 0 || it === nPairs) {
          yield snapR({
            label: `Preference ${it}/${nPairs}: annotator compared ${NAMES[i].split(":")[0]} vs ${NAMES[j].split(":")[0]} and chose ${NAMES[winner].split(":")[0]}. ` +
              `Bradley–Terry loss −log σ(r_w − r_l) = ${loss.toFixed(3)}; gradient step gives φ = [style ${phi[0].toFixed(2)}, substance ${phi[1].toFixed(2)}]. ` +
              (it > 12 ? `The reward model is fitting the annotators, not the truth — it now weights style ${(phi[0] / Math.max(1e-6, Math.abs(phi[1]))).toFixed(2)}× as heavily as substance.` : "Only differences of r are identified, so the absolute scale is arbitrary."),
            stage: "reward-model", phase: "rm", step: 0, pair: [i, j], winner: winner, loss: loss
          });
        }
      }

      const rmScores = [0, 1, 2, 3, 4].map(i => rm(i));
      let rmBest = 0, trueBest = 0;
      for (let i = 1; i < K; i++) { if (rmScores[i] > rmScores[rmBest]) rmBest = i; if (trueU[i] > trueU[trueBest]) trueBest = i; }
      yield snapR({
        label: `Reward model trained: φ = [style ${phi[0].toFixed(2)}, substance ${phi[1].toFixed(2)}]. Its favourite answer is "${NAMES[rmBest]}" — but the genuinely best answer is "${NAMES[trueBest]}". The proxy and the truth disagree. Now PPO will optimise the proxy, with a KL leash of β=${beta.toFixed(2)} to the SFT policy.`,
        stage: "rm-done", phase: "rm-done", step: 0
      });

      // ---------- Phase 2: KL-regularised policy optimisation --------------
      const lrPi = 0.25;
      const klOf = (p) => {
        let s = 0;
        for (let i = 0; i < K; i++) if (p[i] > 1e-12) s += p[i] * Math.log(p[i] / Math.max(1e-12, refP[i]));
        return s;
      };
      const evalRM = (p) => { let s = 0; for (let i = 0; i < K; i++) s += p[i] * rmScores[i]; return s; };
      const evalTrue = (p) => { let s = 0; for (let i = 0; i < K; i++) s += p[i] * trueU[i]; return s; };

      for (let st = 1; st <= params.steps; st++) {
        const p = softmax(logits);
        // sample one completion (a rollout), score it, take a KL-penalised PG step
        const u = rng();
        let acc = 0, y = K - 1;
        for (let i = 0; i < K; i++) { acc += p[i]; if (u < acc) { y = i; break; } }
        const klPer = Math.log(Math.max(1e-12, p[y]) / Math.max(1e-12, refP[y]));
        const rTot = rmScores[y] - beta * klPer;
        // baseline = expected penalised reward under p (group/critic baseline)
        let base = 0;
        for (let i = 0; i < K; i++) base += p[i] * (rmScores[i] - beta * Math.log(Math.max(1e-12, p[i]) / Math.max(1e-12, refP[i])));
        const adv = rTot - base;
        const newLogits = logits.slice();
        for (let i = 0; i < K; i++) newLogits[i] += lrPi * adv * ((i === y ? 1 : 0) - p[i]);
        logits = newLogits;

        const pNew = softmax(logits);
        const klNow = klOf(pNew);
        hStep.push(st); hRM.push(evalRM(pNew)); hTrue.push(evalTrue(pNew)); hKL.push(klNow);

        if (st <= 6 || st % Math.max(1, Math.round(params.steps / 45)) === 0 || st === params.steps) {
          yield snapR({
            label: `PPO step ${st}: sampled "${NAMES[y].split(":")[0]}", reward model scored ${rmScores[y].toFixed(2)}, KL term −β·log(π/π_ref) = ${(-beta * klPer).toFixed(2)}, advantage ${adv.toFixed(2)}. ` +
              `Now E[r_φ] = ${evalRM(pNew).toFixed(2)} (up), E[true quality] = ${evalTrue(pNew).toFixed(2)} ` +
              (hTrue.length > 5 && evalTrue(pNew) < hTrue[Math.max(0, hTrue.length - 6)]
                ? "(DOWN — this is reward hacking: the proxy is climbing while real quality falls)"
                : "(still tracking)") +
              `, KL(π‖π_ref) = ${klNow.toFixed(3)}.`,
            stage: "ppo", phase: st === params.steps ? "done" : "ppo",
            step: st, sampled: y, kl: klNow, adv: adv,
            rmScore: rmScores[y], klTerm: -beta * klPer
          });
        }
      }

      const pF = softmax(logits);
      yield snapR({
        label: `Done. π now puts ${(pF[rmBest] * 100).toFixed(0)}% on the reward model's favourite ("${NAMES[rmBest]}") and ${(pF[trueBest] * 100).toFixed(0)}% on the genuinely best answer. E[r_φ] rose from ${hRM[0].toFixed(2)} to ${hRM[hRM.length - 1].toFixed(2)} while true quality went ${hTrue[hTrue.length - 1] >= hTrue[0] ? "from " + hTrue[0].toFixed(2) + " to " + hTrue[hTrue.length - 1].toFixed(2) : "DOWN from " + hTrue[0].toFixed(2) + " to " + hTrue[hTrue.length - 1].toFixed(2)}, at KL = ${klOf(pF).toFixed(3)}. Raise β to shorten the leash; set β=0 to watch it hack freely.`,
        stage: "done", phase: "done", step: params.steps
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;

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
      const box = (x, y, w, h, fill, on) => {
        ctx.fillStyle = fill;
        ctx.beginPath(); ctx.roundRect(x, y, w, h, 7); ctx.fill();
        ctx.strokeStyle = on ? C.viz4 : C.border;
        ctx.lineWidth = on ? 2 : 1;
        ctx.beginPath(); ctx.roundRect(x + .5, y + .5, w - 1, h - 1, 7); ctx.stroke();
      };
      const arrow = (x0, y0, x1, y1, col) => {
        ctx.strokeStyle = col; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        const ang = Math.atan2(y1 - y0, x1 - x0);
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 7 * Math.cos(ang - 0.4), y1 - 7 * Math.sin(ang - 0.4));
        ctx.lineTo(x1 - 7 * Math.cos(ang + 0.4), y1 - 7 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      };

      // ==================== actor-critic ====================================
      if (S.mode === "ac") {
        ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
        ctx.fillText(`Episode ${S.ep} / ${S.totalEp}`, pad, 15);
        ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(`γ = ${S.gamma}`, pad + 120, 15);

        // --- loop diagram -------------------------------------------------
        const dy = pad + 24, dh = 74;
        const bw = Math.min(140, (W - pad * 2 - 60) / 3);
        const y0 = dy;
        const actOn = S.a >= 0;
        const critOn = S.delta !== null;
        box(pad, y0, bw, 34, actOn ? C.viz1 : C.surface, actOn);
        ctx.fillStyle = actOn ? C.text : C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
        ctx.fillText("ACTOR  π(a|s)", pad + bw / 2, y0 + 21);

        const midX = pad + bw + 30;
        box(midX, y0, bw, 34, C.surface, false);
        ctx.fillStyle = C.text2; ctx.textAlign = "center";
        ctx.fillText("ENVIRONMENT", midX + bw / 2, y0 + 21);

        const rX = midX + bw + 30;
        box(rX, y0, bw, 34, critOn ? C.viz3 : C.surface, critOn);
        ctx.fillStyle = critOn ? C.text : C.text2; ctx.textAlign = "center";
        ctx.fillText("CRITIC  V(s)", rX + bw / 2, y0 + 21);

        arrow(pad + bw + 4, y0 + 17, midX - 4, y0 + 17, S.a >= 0 ? C.viz1 : C.grid);
        arrow(midX + bw + 4, y0 + 17, rX - 4, y0 + 17, S.r !== null ? C.viz4 : C.grid);
        // gradient feedback arrow
        arrow(rX + bw / 2, y0 + 38, pad + bw / 2, y0 + 38, S.delta !== null ? (S.delta >= 0 ? C.viz6 : C.viz8) : C.grid);
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(S.delta !== null ? `δ = ${S.delta.toFixed(3)}  →  ∇log π  and  ∇V` : "δ = r + γV(s′) − V(s)", (pad + rX + bw) / 2, y0 + 54);
        ctx.textAlign = "center"; ctx.font = `9px ${env.font.mono}`; ctx.fillStyle = C.muted;
        ctx.fillText(S.a >= 0 ? (S.a === 1 ? "a = right" : "a = left") : "a ~ π", pad + bw + 17, y0 + 11);
        ctx.fillText(S.r !== null ? `r = ${S.r.toFixed(2)}` : "r, s′", midX + bw + 17, y0 + 11);

        // --- corridor ------------------------------------------------------
        const cy = y0 + dh + 14;
        const cellW = Math.min(84, (W - pad * 2) / S.n);
        const gx = pad + ((W - pad * 2) - cellW * S.n) / 2;
        const chH = 66;
        let span = 0.2;
        for (const v of S.V) span = Math.max(span, Math.abs(v));
        for (let i = 0; i < S.n; i++) {
          const x = gx + i * cellW;
          const v = S.V[i];
          box(x + 2, cy, cellW - 4, chH, v >= 0 ? mix(C.surface, C.viz6, v / span) : mix(C.surface, C.viz8, -v / span), i === S.s);
          ctx.textAlign = "center";
          ctx.fillStyle = C.text; ctx.font = `12px ${env.font.mono}`;
          ctx.fillText(v.toFixed(2), x + cellW / 2, cy + 18);
          ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(`s${i}`, x + cellW / 2, cy + 30);
          // policy bar: fraction going right
          const pr = S.pi[i][1];
          const barW = cellW - 18, bx = x + 9, byy = cy + 40;
          ctx.fillStyle = C.grid; ctx.fillRect(bx, byy, barW, 10);
          ctx.fillStyle = C.viz1; ctx.fillRect(bx, byy, barW * pr, 10);
          ctx.fillStyle = C.text2; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(`→ ${(pr * 100).toFixed(0)}%`, x + cellW / 2, byy + 22);
        }
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
        ctx.fillText("V(s) heat + numeric value; blue bar = π(right|s)", gx, cy + chH + 14);

        // --- curves --------------------------------------------------------
        const qy = cy + chH + 22;
        const qh = H - qy - pad;
        const halfW = (W - pad * 3) / 2;
        const chart = (x0, title, ys, col, lo, hi) => {
          ctx.fillStyle = C.surface;
          ctx.beginPath(); ctx.roundRect(x0, qy, halfW, qh, 8); ctx.fill();
          ctx.strokeStyle = C.border; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.roundRect(x0 + .5, qy + .5, halfW - 1, qh - 1, 8); ctx.stroke();
          ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
          ctx.fillText(title, x0 + 10, qy + 14);
          const ax0 = x0 + 34, ax1 = x0 + halfW - 10, ay0 = qy + 20, ay1 = qy + qh - 12;
          ctx.strokeStyle = C.grid;
          for (let i = 0; i <= 2; i++) {
            const y = ay1 - (i / 2) * (ay1 - ay0);
            ctx.beginPath(); ctx.moveTo(ax0, y + .5); ctx.lineTo(ax1, y + .5); ctx.stroke();
            ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
            ctx.fillText((lo + (hi - lo) * i / 2).toFixed(2), ax0 - 4, y + 3);
          }
          if (ys.length > 1) {
            ctx.strokeStyle = col; ctx.lineWidth = 1.8;
            ctx.beginPath();
            for (let i = 0; i < ys.length; i++) {
              const x = ax0 + (S.hEp[i] / Math.max(1, S.totalEp)) * (ax1 - ax0);
              const v = Math.max(lo, Math.min(hi, ys[i]));
              const y = ay1 - ((v - lo) / (hi - lo)) * (ay1 - ay0);
              if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
            }
            ctx.stroke();
          }
        };
        chart(pad, "return per episode", S.hRet, C.viz1, -1.2, 1.2);
        let dmax = 0.2;
        for (const d of S.hDelta) dmax = Math.max(dmax, d);
        chart(pad * 2 + halfW, "mean |TD error| per episode — the critic learning", S.hDelta, C.viz3, 0, dmax);
        return;
      }

      // ==================== RLHF ===========================================
      ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      const stageName = S.stage === "reward-model" ? "STAGE 2 — training the reward model on preference pairs"
        : S.stage === "ppo" ? "STAGE 3 — PPO against the reward model, leashed to π_ref"
        : S.stage === "rm-done" ? "reward model fitted"
        : S.stage === "done" ? "finished" : "STAGE 1 — the candidates";
      ctx.fillText(stageName, pad, 15);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`β = ${S.beta.toFixed(2)}   pairs labelled: ${S.nPref}   PPO step ${S.step}/${S.totalSteps}`, W - pad - 300, 15);

      // ---- pipeline strip ---------------------------------------------------
      const py = pad + 22, ph = 32;
      const stages = ["π_θ (actor)", "sample y", "reward model r_φ", "PPO update"];
      const on = [S.stage === "ppo", S.stage === "ppo", S.stage === "reward-model" || S.stage === "ppo", S.stage === "ppo"];
      const sw = Math.min(150, (W - pad * 2 - 3 * 26) / 4);
      for (let i = 0; i < 4; i++) {
        const x = pad + i * (sw + 26);
        box(x, py, sw, ph, on[i] ? C.viz1 : C.surface, on[i]);
        ctx.textAlign = "center"; ctx.fillStyle = on[i] ? C.text : C.text2; ctx.font = `11px ${env.font.base}`;
        ctx.fillText(stages[i], x + sw / 2, py + 20);
        if (i < 3) arrow(x + sw + 3, py + ph / 2, x + sw + 23, py + ph / 2, on[i + 1] ? C.viz1 : C.grid);
      }
      // KL leash back to the reference
      const leashY = py + ph + 12;
      ctx.strokeStyle = S.kl !== null ? C.viz2 : C.grid;
      ctx.setLineDash([4, 3]); ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(pad + 3 * (sw + 26) + sw / 2, py + ph);
      ctx.lineTo(pad + 3 * (sw + 26) + sw / 2, leashY + 6);
      ctx.lineTo(pad + sw / 2, leashY + 6);
      ctx.lineTo(pad + sw / 2, py + ph);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = S.kl !== null ? C.viz2 : C.muted;
      ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "center";
      ctx.fillText(`KL leash to π_ref:  −β·KL = ${S.kl !== null ? (-S.beta * S.kl).toFixed(3) : "0.000"}`, pad + (3 * (sw + 26) + sw) / 2, leashY + 19);

      // ---- answer table -----------------------------------------------------
      const ty = leashY + 28;
      const th = H - ty - pad;
      const leftW = (W - pad * 3) * 0.56;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, ty, leftW, th, 8); ctx.fill();
      ctx.strokeStyle = C.border; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(pad + .5, ty + .5, leftW - 1, th - 1, 8); ctx.stroke();

      ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("answer", pad + 10, ty + 14);
      ctx.textAlign = "right";
      ctx.fillStyle = C.viz1; ctx.fillText("π(y)", pad + leftW - 150, ty + 14);
      ctx.fillStyle = C.viz4; ctx.fillText("r_φ (proxy)", pad + leftW - 78, ty + 14);
      ctx.fillStyle = C.viz7; ctx.fillText("true", pad + leftW - 10, ty + 14);

      const rowH = Math.min(34, (th - 30) / S.K);
      let rmMin = Infinity, rmMax = -Infinity, tMax = 0;
      for (let i = 0; i < S.K; i++) { rmMin = Math.min(rmMin, S.rm[i]); rmMax = Math.max(rmMax, S.rm[i]); tMax = Math.max(tMax, S.trueU[i]); }
      const rmSpan = Math.max(1e-6, rmMax - rmMin);

      for (let i = 0; i < S.K; i++) {
        const y = ty + 26 + i * rowH;
        const hot = i === S.sampled || (S.pair && (S.pair[0] === i || S.pair[1] === i));
        if (hot) {
          ctx.fillStyle = i === S.winner ? C.viz6 : C.viz4;
          ctx.globalAlpha = 0.14;
          ctx.fillRect(pad + 6, y - 12, leftW - 12, rowH - 2);
          ctx.globalAlpha = 1;
        }
        ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
        ctx.fillStyle = hot ? C.text : C.text2;
        ctx.fillText(S.names[i], pad + 10, y);

        // π bar
        const bx = pad + leftW - 200, bw2 = 46;
        ctx.fillStyle = C.grid; ctx.fillRect(bx, y - 9, bw2, 10);
        ctx.fillStyle = C.viz1; ctx.fillRect(bx, y - 9, bw2 * S.p[i], 10);
        ctx.strokeStyle = C.viz5; ctx.lineWidth = 1.5;           // reference policy tick
        ctx.beginPath(); ctx.moveTo(bx + bw2 * S.refP[i], y - 11); ctx.lineTo(bx + bw2 * S.refP[i], y + 3); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillStyle = C.text2; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText((S.p[i] * 100).toFixed(0) + "%", pad + leftW - 150, y);

        // reward-model bar
        const rx2 = pad + leftW - 140, rw2 = 58;
        ctx.fillStyle = C.grid; ctx.fillRect(rx2, y - 9, rw2, 10);
        ctx.fillStyle = C.viz4; ctx.fillRect(rx2, y - 9, rw2 * ((S.rm[i] - rmMin) / rmSpan), 10);
        ctx.textAlign = "right"; ctx.fillStyle = C.text2;
        ctx.fillText(S.rm[i].toFixed(2), pad + leftW - 78, y);

        // true utility
        const ux = pad + leftW - 70, uw = 42;
        ctx.fillStyle = C.grid; ctx.fillRect(ux, y - 9, uw, 10);
        ctx.fillStyle = C.viz7; ctx.fillRect(ux, y - 9, uw * (S.trueU[i] / Math.max(1e-6, tMax)), 10);
        ctx.textAlign = "right"; ctx.fillStyle = C.text2;
        ctx.fillText(S.trueU[i].toFixed(2), pad + leftW - 10, y);
      }
      ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
      ctx.fillText(`φ = [style ${S.phi[0].toFixed(2)}, substance ${S.phi[1].toFixed(2)}]   |   tick on π bar = π_ref`, pad + 10, ty + th - 8);

      // ---- proxy vs truth chart ----------------------------------------------
      const rx = pad * 2 + leftW, rw = W - rx - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(rx, ty, rw, th, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(rx + .5, ty + .5, rw - 1, th - 1, 8); ctx.stroke();

      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz4; ctx.fillText("E[r_φ] proxy", rx + 10, ty + 14);
      ctx.fillStyle = C.viz7; ctx.fillText("E[true]", rx + 96, ty + 14);
      ctx.fillStyle = C.viz2; ctx.fillText("KL(π‖π_ref)", rx + 152, ty + 14);

      const ax0 = rx + 32, ax1 = rx + rw - 10, ay0 = ty + 22, ay1 = ty + th - 16;
      let lo = Infinity, hi = -Infinity;
      for (const v of S.hRM) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      for (const v of S.hTrue) { lo = Math.min(lo, v); hi = Math.max(hi, v); }
      if (!isFinite(lo)) { lo = 0; hi = 1; }
      if (hi - lo < 0.2) { hi = lo + 0.2; }
      lo -= 0.05 * (hi - lo); hi += 0.05 * (hi - lo);

      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = ay1 - (i / 3) * (ay1 - ay0);
        ctx.beginPath(); ctx.moveTo(ax0, y + .5); ctx.lineTo(ax1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText((lo + (hi - lo) * i / 3).toFixed(2), ax0 - 4, y + 3);
      }
      const line = (ys, col, mapv) => {
        if (!ys || ys.length < 2) return;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < ys.length; i++) {
          const x = ax0 + (S.hStep[i] / Math.max(1, S.totalSteps)) * (ax1 - ax0);
          const v = mapv(ys[i]);
          const y = ay1 - ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * (ay1 - ay0);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      line(S.hRM, C.viz4, (v) => v);
      line(S.hTrue, C.viz7, (v) => v);
      let klMax = 0.1;
      for (const v of S.hKL) klMax = Math.max(klMax, v);
      line(S.hKL, C.viz2, (v) => lo + (v / klMax) * (hi - lo) * 0.9);
      ctx.textAlign = "right"; ctx.fillStyle = C.viz2; ctx.font = `9px ${env.font.mono}`;
      ctx.fillText(`KL axis max ${klMax.toFixed(2)}`, ax1, ay1 + 12);
    }
  },

  drill: {
    cards: [
      { q: "Write the actor and critic updates.", a: "`δ = r + γV(s′)(1−done) − V(s)`; critic `w ← w + α_v·δ·∇_w V(s)`; actor `θ ← θ + α_π·δ·∇_θ log π(a|s)`. It is REINFORCE with `b(s)=V(s)` and a bootstrapped return.", tags: ["actor-critic"] },
      { q: "What does GAE(λ) interpolate between?", a: "`Â_t = Σ_l (γλ)^l δ_{t+l}`: λ=0 gives the one-step TD advantage (low variance, biased), λ=1 gives the Monte-Carlo advantage (unbiased, high variance). λ≈0.95 is the usual default.", tags: ["gae"] },
      { q: "What does PPO's clip actually accomplish?", a: "Once `r_t(θ) = π_θ/π_old` leaves `[1−ε, 1+ε]`, the surrogate flattens, so no gradient pushes the policy further from the sampling distribution. A cheap trust region that permits several epochs of reuse per rollout batch.", tags: ["ppo"] },
      { q: "Write the reward-model training loss for RLHF.", a: "Bradley–Terry: `L = −log σ( r_φ(x,y_w) − r_φ(x,y_l) )` over preference pairs. Only differences are identified, so `r_φ` and `r_φ + c` are equivalent — normalise before use.", tags: ["rlhf"] },
      { q: "Write the RLHF objective and name each term's job.", a: "`max_θ E_{y~π_θ}[ r_φ(x,y) ] − β·KL(π_θ ‖ π_ref)`. First term: maximise learned preference. Second: keep the policy in the reward model's valid region, preserve the SFT model's fluency, and act as the trust region.", tags: ["rlhf"] },
      { q: "What is reward hacking in RLHF and how do you detect it?", a: "The policy exploits regions where the proxy reward model is wrong — verbosity, sycophancy, confident formatting. Detect it by comparing proxy reward against a held-out signal (fresh human evals or an independently trained RM): the signature is proxy up, true win-rate flat or down, with rising KL and falling entropy.", tags: ["safety"] },
      { q: "How does DPO avoid the reward model?", a: "The KL-regularised optimum has the closed form `π*(y|x) ∝ π_ref(y|x)·exp(r(x,y)/β)`, which can be inverted for `r` and substituted into the Bradley–Terry likelihood. The preference loss becomes a function of `π_θ` and `π_ref` alone — supervised-style, offline, no sampling loop.", tags: ["dpo"] },
      { q: "What does GRPO replace and why?", a: "The value network. It samples a group of k completions per prompt and uses the group's mean (often standardised) reward as the baseline. That removes a model from memory and avoids fitting a critic to a sparse sequence-level reward — well suited to verifiable rewards like tests or maths checkers.", tags: ["grpo"] },
      { q: "Does RLHF add capability to a model?", a: "No — it reweights the distribution over outputs the base model can already produce, toward what labellers rewarded. Capability benchmarks move little; helpfulness, format and refusal behaviour move a lot, and output diversity typically drops.", tags: ["conceptual"] }
    ],
    sixtySecond: [
      "Explain actor-critic: what each half does, why the critic reduces variance, and what bias that introduces.",
      "Walk through the RLHF pipeline end to end and explain what the KL penalty is protecting against.",
      "Explain reward hacking in RLHF, how you would detect it, and how PPO, DPO and GRPO differ."
    ]
  }
};
