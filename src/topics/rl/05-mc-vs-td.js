export default {
  id: "mc-vs-td",
  track: "rl",
  title: "Monte Carlo vs TD Learning",
  difficulty: 2,
  minutes: 16,
  tags: ["monte-carlo", "temporal-difference", "bootstrapping", "bias-variance"],

  explainer: [
    { type: "p", text: "Both Monte Carlo and TD solve the same problem — estimate `V^π(s) = E[G_t | S_t = s]` from experience, with **no model**. They differ in exactly one place: what they use as the *target* of the update." },
    { type: "h3", text: "The same update, two targets" },
    { type: "p", text: "Everything here is `V(S_t) ← V(S_t) + α[ target − V(S_t) ]`." },
    { type: "list", items: [
      "**Monte Carlo**: `target = G_t`, the actual return observed to the end of the episode. Unbiased (it *is* a sample of the expectation) but high variance — it accumulates the randomness of every action, transition and reward until termination.",
      "**TD(0)**: `target = R_{t+1} + γV(S_{t+1})`. Only one random step, then it *bootstraps* off its own current estimate. Low variance, but biased while `V(S_{t+1})` is wrong."
    ]},
    { type: "p", text: "The quantity `δ_t = R_{t+1} + γV(S_{t+1}) − V(S_t)` is the **TD error**. It is the single most reused object in RL: advantage estimates, GAE, actor-critic gradients, and even the dopamine-as-reward-prediction-error story in neuroscience are all this one number." },
    { type: "h3", text: "Why TD usually wins in practice" },
    { type: "list", items: [
      "**Online and incremental** — TD learns from every step; MC must wait for the episode to end, so it cannot be used at all in continuing tasks.",
      "**Lower variance** — one step of noise instead of hundreds. With a long horizon MC's variance grows roughly linearly in episode length.",
      "**Bootstrapping shares structure** — an update to `V(s′)` immediately improves the target for every predecessor of `s′`, so information propagates across states rather than only along the sampled trajectory."
    ]},
    { type: "callout", tone: "tip", text: "The classic distinguishing result: on a batch of finite data, batch MC converges to the estimate that **minimises training-set mean-squared error**, while batch TD(0) converges to the value function of the **maximum-likelihood MDP** implied by the data — the certainty-equivalence estimate. TD exploits the Markov property; MC ignores it. That is precisely why TD is better when the problem *is* Markov and worse when your state is not." },
    { type: "h3", text: "n-step and TD(λ): the dial between them" },
    { type: "p", text: "The n-step return `G_t^{(n)} = R_{t+1} + … + γ^{n−1}R_{t+n} + γ^n V(S_{t+n})` interpolates: `n = 1` is TD(0), `n = ∞` is MC. TD(λ) averages all n-step returns with weights `(1−λ)λ^{n−1}`, implemented online with **eligibility traces**: `e ← γλe + ∇V(S_t)`, then `V ← V + αδ_t e`. Modern practice uses GAE(λ) on advantages — the same geometry applied to the actor-critic gradient." },
    { type: "callout", tone: "pitfall", text: "Constant-α MC and TD both converge only in the stochastic-approximation sense: with a fixed α you converge to a *ball* around V^π, not to V^π. Robbins–Monro requires `Σα = ∞, Σα² < ∞` (e.g. `α_t = 1/t`) for exact convergence — in deep RL nobody does this, which is why learning curves plateau with residual noise." },
    { type: "h3", text: "First-visit vs every-visit MC" },
    { type: "p", text: "First-visit averages only the return following the first occurrence of `s` in each episode and is unbiased with i.i.d. samples; every-visit uses all occurrences, is biased for finite samples, but is consistent and usually has lower variance. Interviewers ask this to see whether you noticed that repeated visits within an episode are correlated." }
  ],

  complexity: {
    rows: [
      { operation: "TD(0) update", time: "O(1)", space: "O(|S|)", note: "per environment step, online" },
      { operation: "MC update", time: "O(H) at episode end", space: "O(H)", note: "must store the trajectory" },
      { operation: "TD(λ) with traces", time: "O(|S|) or O(#active)", space: "O(|S|)", note: "one trace per state/feature" },
      { operation: "Variance of the target", time: "MC: O(H)", space: "TD: O(1)", note: "the whole bias–variance story in one row" }
    ]
  },

  interview: {
    whyAsked: "It is the cleanest bias–variance question in RL, and the answer reveals whether you understand bootstrapping. Anyone can say 'TD is online'; the signal is being able to say what each method converges to on a fixed batch, and why that makes TD fragile when the state is not Markov.",
    followUps: [
      { q: "Bias and variance of the MC and TD targets?", a: "The MC target G_t is an unbiased sample of V^π(s) but has variance accumulated over the whole episode. The TD target r + γV(s′) has only one step of environment noise, so much lower variance, but it is biased whenever V(s′) ≠ V^π(s′) — the bias vanishes as V converges. In practice the variance reduction dominates, so TD learns faster." },
      { q: "On a fixed batch of episodes, what do batch MC and batch TD converge to?", a: "Batch MC converges to the values minimising mean-squared error on the observed returns. Batch TD(0) converges to the value function of the maximum-likelihood MDP fitted to the transitions — the certainty-equivalence solution. TD therefore generalises across states via the Markov structure; MC only fits what it saw." },
      { q: "When would you prefer Monte Carlo?", a: "When the state is not truly Markov (bootstrapping off a wrong-by-construction V compounds the error), when the value function is badly approximated so bootstrapping propagates approximation bias, or when episodes are short and you want an unbiased evaluation — e.g. offline policy evaluation where you care about correctness rather than sample efficiency." },
      { q: "What is the TD error and where else does it appear?", a: "δ_t = r_{t+1} + γV(s_{t+1}) − V(s_t). It is a one-sample estimate of the advantage, so it is the gradient signal in actor-critic; sums of discounted δ's form GAE(λ); it drives eligibility traces in TD(λ); and it is the standard model of the phasic dopamine reward-prediction-error signal." },
      { q: "Explain n-step returns and TD(λ).", a: "G^{(n)} bootstraps after n real rewards, interpolating between TD(0) (n=1) and MC (n=∞); intermediate n is usually best. TD(λ) is the geometrically weighted average of all n-step returns with weights (1−λ)λ^{n−1}, implementable online with eligibility traces so you never need to wait for the episode to end." },
      { q: "First-visit vs every-visit Monte Carlo?", a: "First-visit averages returns following only the first visit to s in each episode — the samples are i.i.d., so it is unbiased. Every-visit reuses correlated within-episode visits, making it biased at finite sample sizes, though it is consistent and often lower variance. Both converge to V^π as visits → ∞." },
      { q: "Does either converge with a constant step size?", a: "Not exactly. Constant α gives convergence to a bounded region around V^π whose radius scales with α and the target variance — good for non-stationary problems, wrong if you need exactness. Robbins–Monro conditions (Σα = ∞, Σα² < ∞) are required for almost-sure convergence." }
    ]
  },

  code: [
    { lang: "python", label: "TD(0) and constant-α Monte Carlo", code: "import numpy as np\n\ndef td0_episode(env, V, policy, alpha, gamma, rng):\n    s = env.reset()\n    while True:\n        a = policy(s, rng)\n        s2, r, done = env.step(a)\n        target = r + gamma * (0.0 if done else V[s2])   # bootstrap; 0 at terminal\n        V[s] += alpha * (target - V[s])                 # delta = target - V[s]\n        s = s2\n        if done:\n            return V\n\ndef mc_episode(env, V, policy, alpha, gamma, rng):\n    traj = []\n    s = env.reset()\n    while True:\n        a = policy(s, rng)\n        s2, r, done = env.step(a)\n        traj.append((s, r))\n        s = s2\n        if done:\n            break\n    G = 0.0\n    for s, r in reversed(traj):        # walk backwards: G_t = r + gamma * G_{t+1}\n        G = r + gamma * G\n        V[s] += alpha * (G - V[s])     # every-visit, constant alpha\n    return V" },
    { lang: "python", label: "n-step TD and TD(λ) with traces", code: "def n_step_td(V, traj, n, alpha, gamma):\n    \"\"\"traj: list of (s, r). G^(n) = r1 + ... + g^{n-1} r_n + g^n V(s_{t+n}).\"\"\"\n    T = len(traj)\n    for t in range(T):\n        G, k = 0.0, 0\n        while k < n and t + k < T:\n            G += (gamma ** k) * traj[t + k][1]\n            k += 1\n        if t + n < T:\n            G += (gamma ** n) * V[traj[t + n][0]]      # bootstrap tail\n        s = traj[t][0]\n        V[s] += alpha * (G - V[s])\n\ndef td_lambda_episode(env, V, policy, alpha, gamma, lam, rng):\n    e = np.zeros_like(V)               # eligibility traces\n    s = env.reset()\n    while True:\n        a = policy(s, rng)\n        s2, r, done = env.step(a)\n        delta = r + gamma * (0.0 if done else V[s2]) - V[s]\n        e *= gamma * lam\n        e[s] += 1.0                    # accumulating trace\n        V += alpha * delta * e         # credit EVERY recently-visited state\n        s = s2\n        if done:\n            return V" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.9, maxFrames: 300 },

    params: [
      { key: "alphaPct", label: "α (percent)", type: "int", min: 2, max: 40, default: 10 },
      { key: "episodes", label: "Episodes",    type: "int", min: 40, max: 400, default: 200 },
      { key: "detail",   label: "Step-by-step episodes", type: "int", min: 1, max: 5, default: 3 },
      { key: "seed",     label: "Reroll walks", type: "seed" }
    ],

    frames: function* (params, rng) {
      const alpha = params.alphaPct / 100;
      const gamma = 1.0;                     // classic 5-state random walk
      const NAMES = ["A", "B", "C", "D", "E"];
      const n = 5;
      const trueV = [1 / 6, 2 / 6, 3 / 6, 4 / 6, 5 / 6];

      let Vmc = new Array(n).fill(0.5);
      let Vtd = new Array(n).fill(0.5);
      const rmsE = [], rmsM = [], rmsT = [];
      const rms = (V) => {
        let s = 0;
        for (let i = 0; i < n; i++) s += (V[i] - trueV[i]) * (V[i] - trueV[i]);
        return Math.sqrt(s / n);
      };

      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: o.pos === undefined ? [] : [o.pos],
        state: {
          names: NAMES.slice(), trueV: trueV.slice(),
          Vmc: Vmc.slice(), Vtd: Vtd.slice(),
          pos: o.pos === undefined ? -1 : o.pos,
          path: o.path ? o.path.slice() : [],
          pending: o.pending ? o.pending.map(x => x.slice()) : [],
          tdInfo: o.tdInfo ? o.tdInfo.slice() : null,
          mcInfo: o.mcInfo ? o.mcInfo.map(x => x.slice()) : null,
          episode: o.episode, step: o.step === undefined ? 0 : o.step,
          alpha: alpha, ep: o.episode,
          rmsE: rmsE.slice(), rmsM: rmsM.slice(), rmsT: rmsT.slice(),
          totalEp: params.episodes, terminalR: o.terminalR === undefined ? null : o.terminalR
        }
      });

      yield snap({
        label: `The 5-state random walk. Start in C, step left/right with probability ½ each; the walk ends with reward 1 off the right edge and 0 off the left. True values are 1/6…5/6. Both learners start at 0.5 everywhere and see the SAME episodes.`,
        phase: "init", episode: 0, pos: 2
      });

      const detail = Math.min(params.detail, params.episodes);

      for (let ep = 1; ep <= params.episodes; ep++) {
        // ---- generate one shared episode ---------------------------------
        let s = 2;
        const traj = [];           // [state, reward, nextState(-1 = terminal-left, -2 = terminal-right)]
        let guard = 0;
        while (guard++ < 500) {
          const right = rng() < 0.5;
          const ns = s + (right ? 1 : -1);
          if (ns < 0) { traj.push([s, 0, -1]); break; }
          if (ns >= n) { traj.push([s, 1, -2]); break; }
          traj.push([s, 0, ns]);
          s = ns;
        }

        const verbose = ep <= detail;
        const path = [];
        const pending = [];

        // ---- TD(0) online along the walk ----------------------------------
        for (let t = 0; t < traj.length; t++) {
          const [st, r, ns] = traj[t];
          path.push(st);
          const bootstrap = ns < 0 ? 0 : Vtd[ns];
          const target = r + gamma * bootstrap;
          const before = Vtd[st];
          const delta = target - before;
          Vtd = Vtd.slice();
          Vtd[st] = before + alpha * delta;
          pending.push([st, r, ns]);
          if (verbose && t < 20) {
            yield snap({
              label: `Episode ${ep}, step ${t + 1}: ${NAMES[st]} → ${ns < 0 ? (ns === -1 ? "terminal-left (r=0)" : "terminal-right (r=1)") : NAMES[ns]}. ` +
                `TD target = r + γV(s′) = ${r} + ${bootstrap.toFixed(3)} = ${target.toFixed(3)}; δ = ${delta.toFixed(3)}; V(${NAMES[st]}) ← ${before.toFixed(3)} + ${alpha.toFixed(2)}·δ = ${Vtd[st].toFixed(3)}. MC has learned nothing yet — it is still waiting for the episode to end.`,
              phase: "td-step", episode: ep, step: t + 1, pos: ns < 0 ? st : ns,
              path: path, pending: pending,
              tdInfo: [st, before, Vtd[st], target, delta, r, ns]
            });
          }
        }

        // ---- MC at the end of the episode ---------------------------------
        const finalR = traj[traj.length - 1][1];
        let G = 0;
        const updates = [];
        for (let t = traj.length - 1; t >= 0; t--) {
          G = traj[t][1] + gamma * G;
          updates.push([traj[t][0], G]);
        }
        updates.reverse();
        const mcInfo = [];
        Vmc = Vmc.slice();
        for (const [st, g] of updates) {
          const before = Vmc[st];
          Vmc[st] = before + alpha * (g - before);
          mcInfo.push([st, before, Vmc[st], g]);
        }

        rmsE.push(ep); rmsM.push(rms(Vmc)); rmsT.push(rms(Vtd));

        if (verbose) {
          yield snap({
            label: `Episode ${ep} ended at the ${finalR === 1 ? "right (G = 1 for every state on the path)" : "left (G = 0 for every state on the path)"}. NOW Monte Carlo fires: all ${updates.length} visited states move toward the same observed return in one batch. One outcome, ${updates.length} correlated updates — that is where MC's variance comes from.`,
            phase: "mc-batch", episode: ep, step: traj.length, pos: -1,
            path: path, pending: pending, mcInfo: mcInfo, terminalR: finalR
          });
          yield snap({
            label: `After episode ${ep}: RMS error MC ${rms(Vmc).toFixed(3)} vs TD ${rms(Vtd).toFixed(3)}. TD's estimates already reflect the *shape* of the chain because each state bootstraps off its neighbour; MC only knows the episodes it happened to see.`,
            phase: "compare", episode: ep, step: traj.length, pos: -1, path: path, terminalR: finalR
          });
        } else {
          const every = Math.max(1, Math.round(params.episodes / 60));
          if (ep % every === 0 || ep === params.episodes) {
            yield snap({
              label: `Episode ${ep}: RMS error — MC ${rms(Vmc).toFixed(3)}, TD ${rms(Vtd).toFixed(3)}. ` +
                (ep < params.episodes * 0.4
                  ? "TD drops faster: one step of noise per update instead of a whole episode's worth."
                  : `Both plateau — with a constant α=${alpha.toFixed(2)} neither converges exactly; they orbit V^π in a ball whose radius grows with α.`),
              phase: ep === params.episodes ? "done" : "run",
              episode: ep, step: 0, pos: -1
            });
          }
        }
      }

      yield snap({
        label: `Final: MC RMS ${rms(Vmc).toFixed(3)}, TD RMS ${rms(Vtd).toFixed(3)}. On a *fixed batch* the difference is sharper still: batch MC minimises training-set error, batch TD(0) returns the value function of the maximum-likelihood MDP — TD uses the Markov property, MC does not.`,
        phase: "done", episode: params.episodes, pos: -1
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;
      const n = S.names.length;

      // ---------- chain strip -------------------------------------------------
      const chainY = pad + 16;
      const chainH = 40;
      const boxes = n + 2;
      const bw = Math.min(64, (W - pad * 2) / boxes);
      const startX = pad + ((W - pad * 2) - bw * boxes) / 2;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`Episode ${S.episode} / ${S.totalEp}`, pad, pad + 2);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`α = ${S.alpha.toFixed(2)}   γ = 1   both learners share the same episodes`, pad + 130, pad + 2);

      const pathSet = {};
      for (const p of S.path) pathSet[p] = 1;

      for (let i = 0; i < boxes; i++) {
        const x = startX + i * bw;
        const isTermL = i === 0, isTermR = i === boxes - 1;
        const si = i - 1;
        ctx.fillStyle = isTermL || isTermR ? C.surface2 : (pathSet[si] ? C.surface2 : C.surface);
        ctx.beginPath(); ctx.roundRect(x + 2, chainY, bw - 4, chainH, 6); ctx.fill();
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.roundRect(x + 2.5, chainY + .5, bw - 5, chainH - 1, 6); ctx.stroke();
        ctx.textAlign = "center";
        ctx.font = `12px ${env.font.mono}`;
        ctx.fillStyle = isTermL || isTermR ? C.muted : C.text;
        ctx.fillText(isTermL ? "0" : isTermR ? "1" : S.names[si], x + bw / 2, chainY + 17);
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = C.muted;
        ctx.fillText(isTermL || isTermR ? "terminal" : `V*=${S.trueV[si].toFixed(2)}`, x + bw / 2, chainY + 31);
        if (si === S.pos && si >= 0) {
          ctx.strokeStyle = C.viz4; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.roundRect(x + 3, chainY + 1, bw - 6, chainH - 2, 6); ctx.stroke();
        }
      }

      // ---------- value bars ---------------------------------------------------
      const bodyY = chainY + chainH + 22;
      const bodyH = H - bodyY - pad - 14;
      const leftW = (W - pad * 3) * 0.5;

      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, bodyY, leftW, bodyH, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(pad + .5, bodyY + .5, leftW - 1, bodyH - 1, 8); ctx.stroke();

      ctx.textAlign = "left"; ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.viz2; ctx.fillText("■ Monte Carlo", pad + 10, bodyY + 15);
      ctx.fillStyle = C.viz1; ctx.fillText("■ TD(0)", pad + 100, bodyY + 15);
      ctx.fillStyle = C.viz7; ctx.fillText("— true V^π", pad + 160, bodyY + 15);

      const baseY = bodyY + bodyH - 26;
      const topY = bodyY + 28;
      const plotH = baseY - topY;
      const slotW = (leftW - 24) / n;

      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(pad + 10, baseY + .5); ctx.lineTo(pad + leftW - 10, baseY + .5); ctx.stroke();

      const mcSet = {}; if (S.mcInfo) for (const u of S.mcInfo) mcSet[u[0]] = u;
      for (let i = 0; i < n; i++) {
        const cx = pad + 12 + slotW * (i + 0.5);
        const bwv = Math.min(20, slotW * 0.34);
        const drawBar = (v, off, col, hot) => {
          const h = Math.max(1, Math.min(1, Math.max(0, v)) * plotH);
          ctx.fillStyle = col;
          ctx.globalAlpha = hot ? 1 : 0.85;
          ctx.fillRect(cx + off - bwv / 2, baseY - h, bwv, h);
          ctx.globalAlpha = 1;
          ctx.fillStyle = hot ? C.text : C.text2;
          ctx.font = `9px ${env.font.mono}`;
          ctx.textAlign = "center";
          ctx.fillText(v.toFixed(2), cx + off, baseY - h - 4);
        };
        drawBar(S.Vmc[i], -bwv * 0.62, C.viz2, !!mcSet[i]);
        drawBar(S.Vtd[i], bwv * 0.62, C.viz1, S.tdInfo && S.tdInfo[0] === i);

        const ty = baseY - S.trueV[i] * plotH;
        ctx.strokeStyle = C.viz7; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(cx - slotW * 0.36, ty); ctx.lineTo(cx + slotW * 0.36, ty); ctx.stroke();

        ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(S.names[i], cx, baseY + 14);
      }

      // the active update, spelled out
      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      if (S.tdInfo) {
        const [st, before, after, target, delta] = S.tdInfo;
        ctx.fillStyle = C.viz1;
        ctx.fillText(`TD: V(${S.names[st]}) ${before.toFixed(3)} → ${after.toFixed(3)}   target ${target.toFixed(3)}   δ ${delta.toFixed(3)}`, pad + 10, bodyY + bodyH - 8);
      } else if (S.mcInfo) {
        ctx.fillStyle = C.viz2;
        const g = S.mcInfo[0] ? S.mcInfo[0][3] : 0;
        ctx.fillText(`MC batch: G = ${g.toFixed(2)} applied to ${S.mcInfo.length} visits at once`, pad + 10, bodyY + bodyH - 8);
      }

      // ---------- RMS curves ---------------------------------------------------
      const rx = pad * 2 + leftW, rw = W - rx - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(rx, bodyY, rw, bodyH, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(rx + .5, bodyY + .5, rw - 1, bodyH - 1, 8); ctx.stroke();

      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("RMS error vs true V^π", rx + 10, bodyY + 15);

      const gx0 = rx + 34, gx1 = rx + rw - 12;
      const gy0 = bodyY + 26, gy1 = bodyY + bodyH - 22;
      const maxY = 0.6;
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 3; i++) {
        const y = gy1 - (i / 3) * (gy1 - gy0);
        ctx.beginPath(); ctx.moveTo(gx0, y + .5); ctx.lineTo(gx1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(((maxY * i) / 3).toFixed(2), gx0 - 4, y + 3);
      }
      const curve = (ys, col) => {
        if (S.rmsE.length < 2) return;
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < S.rmsE.length; i++) {
          const x = gx0 + (S.rmsE[i] / Math.max(1, S.totalEp)) * (gx1 - gx0);
          const y = gy1 - (Math.min(maxY, ys[i]) / maxY) * (gy1 - gy0);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      curve(S.rmsM, C.viz2);
      curve(S.rmsT, C.viz1);
      ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
      ctx.fillText(`${S.totalEp} episodes`, gx1, gy1 + 13);
    }
  },

  drill: {
    cards: [
      { q: "Write the MC and TD(0) value updates side by side.", a: "MC: `V(S_t) ← V(S_t) + α[G_t − V(S_t)]`. TD(0): `V(S_t) ← V(S_t) + α[R_{t+1} + γV(S_{t+1}) − V(S_t)]`. Same form; only the target differs.", tags: ["update-rule"] },
      { q: "Define the TD error and name three places it reappears.", a: "`δ_t = R_{t+1} + γV(S_{t+1}) − V(S_t)`. It is a one-sample advantage estimate (actor-critic), the term summed in GAE(λ), the multiplier on eligibility traces in TD(λ), and the standard model of dopaminergic reward-prediction error.", tags: ["td-error"] },
      { q: "Bias/variance of the two targets?", a: "MC's `G_t` is unbiased but high variance (all the episode's randomness). TD's `r + γV(s′)` is low variance (one step) but biased while V is wrong. TD usually wins because variance reduction beats the vanishing bias.", tags: ["bias-variance"] },
      { q: "On a fixed batch, what does batch TD(0) converge to versus batch MC?", a: "Batch TD(0) → the value function of the maximum-likelihood (certainty-equivalence) MDP fitted to the data; batch MC → the values minimising mean-squared error on the observed returns. TD exploits the Markov property, MC does not.", tags: ["theory"] },
      { q: "Write the n-step return and say what n=1 and n=∞ give.", a: "`G_t^{(n)} = R_{t+1} + γR_{t+2} + … + γ^{n−1}R_{t+n} + γ^n V(S_{t+n})`. n=1 is TD(0); n=∞ (to termination) is Monte Carlo. Intermediate n usually beats both.", tags: ["n-step"] },
      { q: "What does TD(λ) average, and how is it implemented online?", a: "The λ-return `G^λ = (1−λ)Σ_n λ^{n−1}G^{(n)}`. Online via eligibility traces: `e ← γλe`, `e[S_t] += 1`, `V ← V + αδ_t e` — every recently visited state gets credit proportional to its trace.", tags: ["td-lambda"] },
      { q: "First-visit vs every-visit MC?", a: "First-visit averages returns after the first occurrence of s per episode — i.i.d. samples, unbiased. Every-visit uses all occurrences: correlated, biased at finite n, but consistent and often lower variance.", tags: ["monte-carlo"] },
      { q: "What convergence do you get with a constant step size α?", a: "Only convergence to a bounded region around V^π, with radius growing in α and target variance. Exact almost-sure convergence needs Robbins–Monro: `Σα_t = ∞` and `Σα_t² < ∞`.", tags: ["convergence"] },
      { q: "Why can't you use Monte Carlo on a continuing task?", a: "There is no episode end, so `G_t` is never observable. TD only needs one transition, so it works in continuing settings — one of its decisive practical advantages.", tags: ["applicability"] }
    ],
    sixtySecond: [
      "Compare Monte Carlo and TD(0) on bias, variance, when learning happens, and what each converges to on a fixed batch.",
      "Explain the TD error and how n-step returns and TD(λ) interpolate between TD and Monte Carlo."
    ]
  }
};
