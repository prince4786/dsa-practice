export default {
  id: "policy-iteration",
  track: "rl",
  title: "Policy Iteration",
  difficulty: 2,
  minutes: 15,
  tags: ["dynamic-programming", "policy-improvement", "planning", "generalised-policy-iteration"],

  explainer: [
    { type: "p", text: "Policy iteration alternates two operations until they stop disagreeing: **evaluate** the current policy exactly, then **improve** it greedily against the values you just computed. Value iteration is the special case where 'evaluate' means one sweep." },
    { type: "h3", text: "Step 1 — policy evaluation" },
    { type: "p", text: "Solve `V^π(s) = Σ_a π(a|s) Σ_{s′} P(s′|s,a)[r + γV^π(s′)]`. This is linear, so you can invert `(I − γP_π)` directly in `O(|S|³)`, or — as everyone actually does — iterate the expectation backup to convergence, which is again a γ-contraction. Note there is **no max** here: you are measuring the policy you have, not searching for a better one." },
    { type: "h3", text: "Step 2 — policy improvement" },
    { type: "p", text: "Set `π′(s) = argmax_a Q^π(s,a) = argmax_a Σ_{s′} P(s′|s,a)[r + γV^π(s′)]`. The **policy improvement theorem** says: if `Q^π(s, π′(s)) ≥ V^π(s)` for all `s`, then `V^{π′}(s) ≥ V^π(s)` for all `s`. Greedification can never make the policy worse — and if it changes nothing, you have satisfied the Bellman optimality equation and `π` is optimal." },
    { type: "callout", tone: "tip", text: "Policy iteration **terminates exactly**, not asymptotically. There are finitely many deterministic policies (`|A|^|S|`), each iteration strictly improves unless it stops, so it must halt at an optimum — usually in a startlingly small number of iterations (single digits even for large MDPs)." },
    { type: "h3", text: "Generalised policy iteration (GPI)" },
    { type: "p", text: "Almost every RL algorithm is GPI: a value estimate chasing the current policy while the policy greedifies against the current value estimate. The two processes fight — improvement makes the value estimate wrong, evaluation makes the policy no longer greedy — and their joint fixed point is optimality. Q-learning, SARSA, actor-critic and PPO are all GPI with different degrees of partial evaluation and partial improvement." },
    { type: "list", items: [
      "**k = ∞** evaluation sweeps → classical policy iteration.",
      "**k = 1** → value iteration (one expectation backup, then greedify — which composes into the max backup).",
      "**k = 3–10** → *modified policy iteration*: usually the fastest wall-clock choice, because full evaluation of a policy you are about to discard is wasted work.",
      "**Asynchronous / partial improvement** → improve only the states you visit. That is what sample-based control does."
    ]},
    { type: "callout", tone: "pitfall", text: "Ties in the argmax must be broken consistently, or the policy oscillates between equally-good actions forever and your 'policy-stable' check never fires. Compare the *values*, not the action indices: stop when the greedy action set is unchanged, or when `max_s |V_{k+1}−V_k|` is below tolerance." },
    { type: "h3", text: "Why it converges faster than value iteration" },
    { type: "p", text: "Policy iteration is Newton's method on the Bellman optimality equation, which is why its iteration count is so low and its convergence is locally quadratic; value iteration is a fixed-point iteration with linear rate γ. The catch is that each Newton step costs a full policy evaluation." }
  ],

  complexity: {
    rows: [
      { operation: "Evaluation (iterative)", time: "O(k·|S|²·|A|)", space: "O(|S|)", note: "k sweeps to tolerance" },
      { operation: "Evaluation (exact solve)", time: "O(|S|³)", space: "O(|S|²)", note: "(I − γP_π)⁻¹ r_π" },
      { operation: "Improvement", time: "O(|S|²·|A|)", space: "O(|S|)", note: "one argmax pass" },
      { operation: "Outer iterations", time: "≤ |A|^|S| (in practice < 10)", space: "—", note: "strictly monotone, so it terminates exactly" }
    ]
  },

  interview: {
    whyAsked: "This is where candidates reveal whether they see RL as a collection of update rules or as one idea — generalised policy iteration — with different knobs. The strong answer connects policy iteration, value iteration, and modern actor-critic as the same loop with different amounts of evaluation and improvement.",
    followUps: [
      { q: "State and justify the policy improvement theorem.", a: "If π′ satisfies Q^π(s, π′(s)) ≥ V^π(s) for all s, then V^{π′} ≥ V^π pointwise. The proof unrolls the inequality: V^π(s) ≤ Q^π(s,π′(s)) = E[r + γV^π(s′)] ≤ E[r + γQ^π(s′,π′(s′))] ≤ … = V^{π′}(s). If equality holds everywhere, the Bellman optimality equation is satisfied and π is optimal." },
      { q: "Why does policy iteration terminate exactly while value iteration only converges?", a: "The greedy policy comes from a finite set (|A|^|S| deterministic policies) and each iteration strictly improves the value of at least one state unless nothing changes, so no policy can repeat and the loop must halt. Value iteration operates on real-valued V, which approaches V* geometrically but generally never equals it in finite time." },
      { q: "Policy iteration or value iteration in practice?", a: "Neither in pure form — modified policy iteration with k ≈ 3–20 evaluation sweeps. Full evaluation of a policy you are about to throw away is wasted, and a single sweep gives a poor value estimate to greedify against. This is exactly the actor-critic trade-off: how stale may the critic be before the actor updates?" },
      { q: "How does this map onto actor-critic?", a: "The critic performs approximate, sampled policy evaluation (TD instead of exact solves) and the actor performs approximate, gradient-based improvement (a small step toward the greedy/advantage-weighted action instead of a hard argmax). PPO's clipped objective is a trust region limiting how far one 'improvement' may go, precisely because the critic's evaluation is only valid near the current policy." },
      { q: "What happens if you improve using a badly evaluated V?", a: "Greedification against a wrong V can genuinely make the policy worse — the improvement theorem needs V^π, not an arbitrary V. With one sweep this is fine (value iteration is still a contraction), but with sampled, high-variance estimates you get policy churn. That is why practical methods damp the improvement step (small learning rates, trust regions, KL constraints)." },
      { q: "How would you scale policy iteration to a large state space?", a: "Approximate both halves: fit V̂ with least-squares TD or a network on sampled states (approximate policy evaluation) and represent π parametrically with a soft improvement step. This is approximate policy iteration; its error bound degrades as 2γε/(1−γ)², so evaluation error is amplified by the horizon squared — a good motivation for smaller γ or trust regions." }
    ]
  },

  code: [
    { lang: "python", label: "Policy iteration (tabular)", code: "import numpy as np\n\ndef policy_evaluation(P, R, pi, gamma, theta=1e-10, max_sweeps=10_000):\n    nS, nA, _ = P.shape\n    V = np.zeros(nS)\n    for _ in range(max_sweeps):\n        Q = R + gamma * P.dot(V)            # (nS, nA) — NO max here\n        V_new = (pi * Q).sum(axis=1)        # expectation under pi\n        if np.abs(V_new - V).max() < theta:\n            return V_new\n        V = V_new\n    return V\n\ndef policy_iteration(P, R, gamma):\n    nS, nA, _ = P.shape\n    pi = np.zeros((nS, nA)); pi[:, 0] = 1.0     # start: always action 0\n    for it in range(1000):\n        V = policy_evaluation(P, R, pi, gamma)\n        Q = R + gamma * P.dot(V)\n        greedy = Q.argmax(axis=1)\n        new_pi = np.eye(nA)[greedy]\n        if (new_pi == pi).all():                 # policy stable -> optimal\n            return pi, V, it\n        pi = new_pi" },
    { lang: "python", label: "Modified policy iteration (k sweeps)", code: "def modified_policy_iteration(P, R, gamma, k=5, iters=200):\n    \"\"\"k=inf -> policy iteration.  k=1 -> value iteration.\"\"\"\n    nS, nA, _ = P.shape\n    V = np.zeros(nS)\n    greedy = np.zeros(nS, dtype=int)\n    for _ in range(iters):\n        for _ in range(k):                        # partial evaluation\n            V = (R + gamma * P.dot(V))[np.arange(nS), greedy]\n        Q = R + gamma * P.dot(V)\n        new_greedy = Q.argmax(axis=1)             # improvement\n        if (new_greedy == greedy).all():\n            return V, greedy\n        greedy = new_greedy\n    return V, greedy" },
    { lang: "python", label: "Exact evaluation by linear solve", code: "def exact_eval(P, R, pi, gamma):\n    nS = P.shape[0]\n    P_pi = np.einsum('sa,sat->st', pi, P)     # (nS, nS)\n    r_pi = (pi * R).sum(axis=1)               # (nS,)\n    return np.linalg.solve(np.eye(nS) - gamma * P_pi, r_pi)\n# O(|S|^3). Worth it only for small |S|; iterative evaluation is O(k|S|^2|A|)." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 400 },

    params: [
      { key: "gammaPct", label: "γ (percent)",    type: "int", min: 50, max: 99, default: 90 },
      { key: "slipPct",  label: "Slip (percent)", type: "int", min: 0, max: 40, default: 20 },
      { key: "evalK",    label: "Eval sweeps",    type: "enum", options: ["1 (= value iter)", "3", "10", "full"], default: "full" },
      { key: "start",    label: "Initial policy", type: "enum", options: ["all-up", "all-left"], default: "all-up" }
    ],

    frames: function* (params, rng) {
      const gamma = params.gammaPct / 100;
      const slip = params.slipPct / 100;
      const R = 5, Cn = 5;
      const layout = [
        ".", ".", ".", ".", "G",
        ".", "#", "#", ".", ".",
        ".", ".", "#", ".", ".",
        ".", "#", ".", ".", "P",
        "s", ".", ".", ".", "."
      ];
      const nS = R * Cn;
      const at = (s) => layout[s];
      const isWall = (s) => at(s) === "#";
      const isTerm = (s) => at(s) === "G" || at(s) === "P";
      const ACT = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      const ANAME = ["↑", "→", "↓", "←"];
      const blocked = (r, c) => r < 0 || c < 0 || r >= R || c >= Cn || layout[r * Cn + c] === "#";
      const trans = (s, a) => {
        const r = Math.floor(s / Cn), c = s % Cn, out = [];
        const dirs = [[a, 1 - slip], [(a + 1) % 4, slip / 2], [(a + 3) % 4, slip / 2]];
        for (const [d, p] of dirs) {
          if (p <= 1e-9) continue;
          const nr = r + ACT[d][0], nc = c + ACT[d][1];
          out.push([blocked(nr, nc) ? s : nr * Cn + nc, p]);
        }
        return out;
      };
      const rew = (s2) => (at(s2) === "G" ? 10 : at(s2) === "P" ? -10 : -1);
      const qOf = (s, a, V) => {
        let q = 0;
        for (const [ns, p] of trans(s, a)) q += p * (rew(ns) + (isTerm(ns) ? 0 : gamma * V[ns]));
        return q;
      };

      const order = [];
      for (let s = 0; s < nS; s++) if (!isWall(s) && !isTerm(s)) order.push(s);

      const kMap = { "1 (= value iter)": 1, "3": 3, "10": 10, "full": 0 };
      const K = kMap[params.evalK] === undefined ? 0 : kMap[params.evalK];
      const a0 = params.start === "all-up" ? 0 : 3;

      let V = new Array(nS).fill(0);
      let pi = new Array(nS).fill(-1);
      for (const s of order) pi[s] = a0;

      const flipHist = [];
      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: o.focus === undefined ? [] : [o.focus],
        state: {
          layout: layout.slice(), R: R, Cn: Cn, gamma: gamma, slip: slip,
          V: V.slice(), pi: pi.slice(),
          changed: o.changed ? o.changed.slice() : [],
          focus: o.focus === undefined ? -1 : o.focus,
          qs: o.qs ? o.qs.slice() : null,
          oldA: o.oldA === undefined ? -1 : o.oldA,
          newA: o.newA === undefined ? -1 : o.newA,
          mode: o.mode, iter: o.iter, evalSweep: o.evalSweep === undefined ? 0 : o.evalSweep,
          delta: o.delta === undefined ? null : o.delta,
          flipHist: flipHist.slice(), stable: !!o.stable, K: K
        }
      });

      yield snap({
        label: `Policy iteration. Start from a deliberately bad policy: every state says "${ANAME[a0]}". Evaluation will tell us exactly how bad it is; improvement will then greedify against those numbers.`,
        phase: "init", mode: "init", iter: 0
      });

      let iter = 0, stable = false;
      while (iter < 8 && !stable) {
        iter++;

        // ---------------- EVALUATION -------------------------------------
        let sweep = 0, delta = Infinity;
        const cap = K === 0 ? 25 : K;
        while (sweep < cap && (K !== 0 || delta > 1e-3)) {
          sweep++;
          const Vold = V.slice();
          const Vn = V.slice();
          delta = 0;
          for (const s of order) {
            const q = qOf(s, pi[s], Vold);
            Vn[s] = q;
            delta = Math.max(delta, Math.abs(q - Vold[s]));
          }
          V = Vn;
          yield snap({
            label: `Iteration ${iter} · evaluation sweep ${sweep}: V^π(s) ← Σ P(s′|s,π(s))[r + γV^π(s′)] — no max, we are only measuring the current policy. max|ΔV| = ${delta.toFixed(4)}.` +
              (sweep === 1 && iter === 1 ? " Every state is still worth about −1: one step of bad news." : ""),
            phase: "eval", mode: "eval", iter: iter, evalSweep: sweep, delta: delta
          });
        }
        yield snap({
          label: `Iteration ${iter}: evaluation ${K === 0 ? "converged" : `stopped after k=${K} sweeps (modified policy iteration)`} — max|ΔV| = ${delta.toFixed(4)}. These numbers are now (approximately) V^π: the true expected return of the CURRENT policy.`,
          phase: "eval-done", mode: "eval-done", iter: iter, evalSweep: sweep, delta: delta
        });

        // ---------------- IMPROVEMENT -------------------------------------
        const changed = [];
        const newPi = pi.slice();
        for (const s of order) {
          const qs = [0, 1, 2, 3].map(a => qOf(s, a, V));
          let bv = -Infinity, ba = 0;
          for (let a = 0; a < 4; a++) if (qs[a] > bv + 1e-12) { bv = qs[a]; ba = a; }
          if (ba !== pi[s]) {
            changed.push(s);
            newPi[s] = ba;
            if (changed.length <= 6) {
              const r = Math.floor(s / Cn), c = s % Cn;
              yield snap({
                label: `Iteration ${iter} · improve (${r},${c}): Q^π = ${qs.map((q, a) => `${ANAME[a]}${q.toFixed(1)}`).join("  ")}. Current action ${ANAME[pi[s]]} scores ${qs[pi[s]].toFixed(2)}, but ${ANAME[ba]} scores ${bv.toFixed(2)} — flip it. The improvement theorem says this can never lower V.`,
                phase: "improve", mode: "improve", iter: iter, focus: s, qs: qs,
                oldA: pi[s], newA: ba, changed: changed
              });
            }
          }
        }
        flipHist.push(changed.length);
        stable = changed.length === 0;
        pi = newPi;
        yield snap({
          label: stable
            ? `Iteration ${iter}: NO arrow changed. π is greedy w.r.t. its own V^π, so the Bellman optimality equation holds and π = π*. Policy iteration terminates exactly — there are only finitely many deterministic policies and each step strictly improved.`
            : `Iteration ${iter}: ${changed.length} of ${order.length} arrows flipped. The heatmap is now stale — those values belong to the OLD policy — so we go back and evaluate again. Evaluate ⇄ improve is generalised policy iteration.`,
          phase: stable ? "done" : "improve-done", mode: "improve-done", iter: iter,
          changed: changed, stable: stable
        });
      }

      yield snap({
        label: `Converged after ${iter} policy iterations (${flipHist.join(" → ")} arrows flipped per round). Value iteration needed dozens of sweeps for the same answer — policy iteration takes far fewer, larger steps, because each one is effectively a Newton step on the Bellman optimality equation.`,
        phase: "done", mode: "final", iter: iter, stable: true
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;
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

      const side = Math.min(H - pad * 2 - 20, (W - pad * 3) * 0.52);
      const cell = side / S.R;
      const gx = pad, gy = pad + 20;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      const modeLabel = S.mode === "eval" || S.mode === "eval-done" ? "EVALUATION" : S.mode === "improve" || S.mode === "improve-done" ? "IMPROVEMENT" : "policy iteration";
      ctx.fillText(`Iteration ${S.iter} · ${modeLabel}`, pad, 15);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`γ=${S.gamma.toFixed(2)}  slip=${(S.slip * 100).toFixed(0)}%  k=${S.K === 0 ? "full" : S.K}`, pad + 220, 15);

      let span = 1e-6;
      for (let s = 0; s < S.V.length; s++) if (S.layout[s] !== "#") span = Math.max(span, Math.abs(S.V[s]));

      const changedSet = {};
      for (const s of S.changed) changedSet[s] = 1;

      for (let s = 0; s < S.R * S.Cn; s++) {
        const r = Math.floor(s / S.Cn), c = s % S.Cn;
        const x = gx + c * cell, y = gy + r * cell;
        const ch = S.layout[s];
        let fill;
        if (ch === "#") fill = C.surface2;
        else if (ch === "G") fill = C.viz6;
        else if (ch === "P") fill = C.viz8;
        else fill = S.V[s] >= 0 ? mix(C.surface, C.viz6, S.V[s] / span) : mix(C.surface, C.viz8, -S.V[s] / span);
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.strokeRect(x + .5, y + .5, cell - 1, cell - 1);
        if (ch === "#") continue;

        ctx.textAlign = "center";
        ctx.fillStyle = C.text;
        ctx.font = `${Math.round(cell * 0.24)}px ${env.font.mono}`;
        ctx.fillText(ch === "G" ? "+10" : ch === "P" ? "−10" : S.V[s].toFixed(1), x + cell / 2, y + cell * 0.36);

        if (S.pi[s] >= 0) {
          ctx.fillStyle = changedSet[s] ? C.viz2 : C.text2;
          ctx.font = `${Math.round(cell * 0.42)}px ${env.font.mono}`;
          ctx.fillText(ANAME[S.pi[s]], x + cell / 2, y + cell * 0.82);
        }
        if (changedSet[s]) {
          ctx.strokeStyle = C.viz2; ctx.lineWidth = 2;
          ctx.strokeRect(x + 2.5, y + 2.5, cell - 5, cell - 5);
        }
        if (s === S.focus) {
          ctx.strokeStyle = C.viz4; ctx.lineWidth = 3;
          ctx.strokeRect(x + 1.5, y + 1.5, cell - 3, cell - 3);
        }
      }

      // ---------- right panel -------------------------------------------------
      const px = gx + side + pad, pw = W - px - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(px, gy, pw, side, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(px + .5, gy + .5, pw - 1, side - 1, 8); ctx.stroke();

      // GPI loop diagram
      const cxm = px + pw / 2, cym = gy + 46;
      const evalOn = S.mode === "eval" || S.mode === "eval-done";
      const impOn = S.mode === "improve" || S.mode === "improve-done";
      const boxW = Math.min(120, pw / 2 - 18), boxH = 32;
      const drawBox = (bx, label, sub, on) => {
        ctx.fillStyle = on ? C.viz1 : C.surface2;
        ctx.beginPath(); ctx.roundRect(bx, cym - boxH / 2, boxW, boxH, 6); ctx.fill();
        ctx.fillStyle = on ? C.text : C.text2;
        ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
        ctx.fillText(label, bx + boxW / 2, cym - 1);
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = on ? C.text : C.muted;
        ctx.fillText(sub, bx + boxW / 2, cym + 11);
      };
      drawBox(px + 12, "evaluate", "V → V^π", evalOn);
      drawBox(px + pw - 12 - boxW, "improve", "π → greedy(V)", impOn);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(px + 12 + boxW + 2, cym - 6); ctx.lineTo(px + pw - 14 - boxW, cym - 6);
      ctx.moveTo(px + pw - 14 - boxW, cym + 6); ctx.lineTo(px + 12 + boxW + 2, cym + 6);
      ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.mono}`;
      let ty = cym + 44;
      ctx.fillStyle = C.text2;
      ctx.fillText(`evaluation sweeps this round: ${S.evalSweep}`, px + 12, ty); ty += 16;
      if (S.delta !== null) { ctx.fillText(`max|ΔV| = ${S.delta.toFixed(5)}`, px + 12, ty); ty += 16; }
      ctx.fillStyle = S.changed.length ? C.viz2 : C.ok;
      ctx.fillText(`arrows flipped: ${S.changed.length}`, px + 12, ty); ty += 20;

      if (S.qs) {
        const fr = Math.floor(S.focus / S.Cn), fc = S.focus % S.Cn;
        ctx.fillStyle = C.viz4;
        ctx.fillText(`argmax_a Q^π(${fr},${fc}, a)`, px + 12, ty); ty += 6;
        let mx = 1e-6;
        for (const q of S.qs) mx = Math.max(mx, Math.abs(q));
        const barX = px + 40, barW = pw - 64;
        for (let a = 0; a < 4; a++) {
          const y = ty + 14 + a * 18;
          ctx.textAlign = "left";
          ctx.fillStyle = a === S.newA ? C.text : a === S.oldA ? C.viz2 : C.text2;
          ctx.font = `12px ${env.font.mono}`;
          ctx.fillText(ANAME[a], px + 14, y + 4);
          const w = (Math.abs(S.qs[a]) / mx) * (barW / 2);
          const zero = barX + barW / 2;
          ctx.fillStyle = a === S.newA ? C.viz1 : a === S.oldA ? C.viz2 : C.grid;
          ctx.fillRect(S.qs[a] >= 0 ? zero : zero - w, y - 6, Math.max(1, w), 11);
          ctx.textAlign = "right";
          ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
          ctx.fillText(S.qs[a].toFixed(2), px + pw - 10, y + 3);
        }
        ty += 14 + 4 * 18 + 8;
      }

      // flips per round
      if (S.flipHist.length) {
        ctx.textAlign = "left";
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText("arrows flipped per improvement round", px + 12, gy + side - 46);
        const bw = Math.min(22, (pw - 24) / Math.max(1, S.flipHist.length));
        const mxF = Math.max.apply(null, S.flipHist.concat([1]));
        for (let i = 0; i < S.flipHist.length; i++) {
          const h = (S.flipHist[i] / mxF) * 26;
          ctx.fillStyle = S.flipHist[i] === 0 ? C.ok : C.viz2;
          ctx.fillRect(px + 12 + i * bw, gy + side - 14 - h, Math.max(2, bw - 3), Math.max(1, h));
        }
      }
      if (S.stable) {
        ctx.textAlign = "left";
        ctx.fillStyle = C.ok; ctx.font = `12px ${env.font.base}`;
        ctx.fillText("policy stable → optimal", px + 12, gy + side - 60);
      }
    }
  },

  drill: {
    cards: [
      { q: "What are the two alternating steps of policy iteration?", a: "**Evaluation**: solve `V^π(s) = Σ_a π(a|s)Σ_{s′}P(s′|s,a)[r + γV^π(s′)]` (no max). **Improvement**: `π′(s) = argmax_a Q^π(s,a)`. Repeat until π stops changing.", tags: ["algorithm"] },
      { q: "State the policy improvement theorem.", a: "If `Q^π(s, π′(s)) ≥ V^π(s)` for all s, then `V^{π′}(s) ≥ V^π(s)` for all s. Greedification never hurts; if it changes nothing, the Bellman optimality equation is satisfied and π is optimal.", tags: ["theory"] },
      { q: "Why does policy iteration terminate in finite time?", a: "Deterministic policies form a finite set (`|A|^|S|`), each iteration strictly improves the value of at least one state unless it stops, so no policy can repeat. In practice it halts in a handful of iterations.", tags: ["theory"] },
      { q: "How is value iteration a special case of policy iteration?", a: "It is modified policy iteration with `k = 1` evaluation sweep: one expectation backup followed immediately by greedification composes into the single max backup `V ← max_a(R + γPV)`.", tags: ["connection"] },
      { q: "What is generalised policy iteration (GPI)?", a: "Any interleaving of partial policy evaluation and partial policy improvement. Nearly all of RL is GPI — Q-learning, SARSA, actor-critic, PPO — differing only in how approximate and how sampled each half is.", tags: ["framework"] },
      { q: "What is modified policy iteration and why use it?", a: "Run only `k` evaluation sweeps (typically 3–20) before improving. Fully evaluating a policy you are about to replace is wasted computation; a single sweep gives too poor an estimate to greedify against safely.", tags: ["practice"] },
      { q: "Cost of exact policy evaluation?", a: "`O(|S|³)` for the linear solve `V = (I − γP_π)⁻¹ r_π`, versus `O(k|S|²|A|)` for iterative evaluation. Exact solves are worth it only for small state spaces.", tags: ["complexity"] },
      { q: "What is the error bound for *approximate* policy iteration?", a: "If every evaluation has error ≤ ε, the resulting policy is within about `2γε/(1−γ)²` of optimal. The squared horizon factor is why evaluation noise is so damaging at high γ and why trust regions are used.", tags: ["bounds"] }
    ],
    sixtySecond: [
      "Explain policy iteration, the policy improvement theorem, and why the loop terminates exactly.",
      "Explain generalised policy iteration and place value iteration, Q-learning and actor-critic on that spectrum."
    ]
  }
};
