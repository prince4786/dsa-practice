export default {
  id: "value-iteration",
  track: "rl",
  title: "Bellman & Value Iteration",
  difficulty: 2,
  minutes: 16,
  tags: ["bellman", "dynamic-programming", "planning", "contraction"],

  explainer: [
    { type: "p", text: "Value iteration is dynamic programming applied to an MDP you *have the model of*. It turns the recursion `G_t = R_{t+1} + γG_{t+1}` into a fixed-point equation over states and then hammers that equation until it stops changing." },
    { type: "h3", text: "The two Bellman equations" },
    { type: "p", text: "**Bellman expectation** (for a given policy π): `V^π(s) = Σ_a π(a|s) Σ_{s′} P(s′|s,a)[ R(s,a,s′) + γV^π(s′) ]`. It is a linear system — |S| equations in |S| unknowns — so it can be solved exactly by matrix inversion." },
    { type: "p", text: "**Bellman optimality**: `V*(s) = max_a Σ_{s′} P(s′|s,a)[ R(s,a,s′) + γV*(s′) ]`. The `max` makes it non-linear, so there is no closed form; you iterate instead. In Q-form: `Q*(s,a) = Σ_{s′} P(s′|s,a)[ r + γ·max_{a′} Q*(s′,a′) ]`." },
    { type: "h3", text: "Why iterating works: the Bellman operator is a contraction" },
    { type: "p", text: "Define the operator `(TV)(s) = max_a Σ_{s′} P(s′|s,a)[r + γV(s′)]`. For any two value functions, `‖TU − TV‖_∞ ≤ γ‖U − V‖_∞`. Because `γ < 1` this is a γ-contraction in the max-norm, so by Banach's fixed-point theorem it has a **unique** fixed point `V*` and repeated application converges to it geometrically from *any* initialisation. That single fact is the entire correctness proof, and it is the answer interviewers are fishing for." },
    { type: "callout", tone: "tip", text: "Error bound worth memorising: if `‖V_{k+1} − V_k‖_∞ < ε`, then `‖V_k − V*‖_∞ < εγ/(1−γ)`, and the greedy policy w.r.t. `V_k` is within `2εγ/(1−γ)` of optimal. That is your stopping criterion, and it explains why γ→1 makes everything slower and looser." },
    { type: "h3", text: "The algorithm" },
    { type: "code", lang: "pseudo", code: "repeat:\n    delta = 0\n    for each s in S:\n        v_old = V[s]\n        V[s] = max_a  sum_s' P(s'|s,a) [ R(s,a,s') + gamma * V[s'] ]\n        delta = max(delta, |v_old - V[s]|)\nuntil delta < theta\npi(s) = argmax_a sum_s' P(s'|s,a) [ R(s,a,s') + gamma * V[s'] ]" },
    { type: "list", items: [
      "**Synchronous** sweeps compute a whole new `V` array from the old one — clean, parallel, and what the theory is stated for.",
      "**In-place (Gauss–Seidel)** overwrites `V[s]` immediately, so later states in the sweep see fresher values. Usually converges in noticeably fewer sweeps, and it is still a contraction.",
      "**Prioritised sweeping** keeps a priority queue of states ordered by Bellman error, so updates propagate backwards from the goal instead of scanning uniformly.",
      "Only the *last* step needs the argmax: the policy is extracted once, at the end. Value iteration is 'policy iteration with exactly one sweep of evaluation'."
    ]},
    { type: "callout", tone: "pitfall", text: "Value propagates one cell per sweep, backwards from reward. With a 100-step corridor and a single terminal reward you need ≥100 sweeps before the start state has any signal at all — this is why sparse-reward problems are hard, and it is the same phenomenon as slow credit assignment in TD learning." },
    { type: "h3", text: "When you cannot use it" },
    { type: "p", text: "Value iteration needs `P` and `R` explicitly, and costs `O(|S|²|A|)` per sweep. Both die at scale: no model for a real robot, and no table for 10¹⁷ Go positions. Everything from lesson 5 onward replaces the expectation `Σ_{s′} P(...)` with *samples*, and the table with a function approximator." }
  ],

  complexity: {
    rows: [
      { operation: "One sweep (dense P)", time: "O(|S|²·|A|)", space: "O(|S|)", note: "O(|S|·|A|·b) with branching factor b" },
      { operation: "Sweeps to ε-accuracy", time: "O(log(1/ε) / log(1/γ))", space: "—", note: "geometric: error × γ per sweep" },
      { operation: "Policy extraction", time: "O(|S|²·|A|)", space: "O(|S|)", note: "one argmax pass at the end" },
      { operation: "Exact policy eval (linear solve)", time: "O(|S|³)", space: "O(|S|²)", note: "(I − γP_π)⁻¹ r_π; only for tiny MDPs" }
    ]
  },

  interview: {
    whyAsked: "It is the one place where RL has a clean proof, so it separates people who memorised update rules from people who know why they converge. Expect to be asked why the max-norm contraction argument works and what breaks when you replace the expectation with samples or the table with a neural net.",
    followUps: [
      { q: "Why does value iteration converge, and to what?", a: "The Bellman optimality operator T is a γ-contraction in the max-norm: ‖TU − TV‖_∞ ≤ γ‖U − V‖_∞. Banach's fixed-point theorem then gives a unique fixed point V* and geometric convergence from any initial V. The error shrinks by a factor of γ each sweep, so you need about log(1/ε)/log(1/γ) sweeps." },
      { q: "Value iteration vs policy iteration — which is faster?", a: "Policy iteration usually needs far fewer outer iterations (often under ten, and it terminates exactly because there are finitely many policies), but each iteration solves a full policy evaluation. Value iteration's iterations are cheap but numerous. Modified policy iteration — k evaluation sweeps then an improvement — interpolates between them and is what people actually use." },
      { q: "What is the stopping criterion and what does it guarantee?", a: "Stop when max_s |V_{k+1}(s) − V_k(s)| < θ. Then ‖V_k − V*‖_∞ < θγ/(1−γ), and the greedy policy from V_k is within 2θγ/(1−γ) of optimal. Note the 1/(1−γ) blow-up: at γ = 0.999 a tight-looking θ is a very loose policy guarantee." },
      { q: "In-place vs synchronous updates — does the theory still hold?", a: "Yes. Asynchronous value iteration converges as long as every state continues to be updated infinitely often; in-place updates are just a particular ordering. In practice in-place (Gauss–Seidel) is strictly better because a sweep ordered toward the goal propagates value across many states at once instead of one cell per sweep." },
      { q: "How does this become Q-learning?", a: "Replace the model expectation Σ_{s′} P(s′|s,a)[·] with a single sampled transition and take a small step toward it instead of overwriting: Q(s,a) ← Q(s,a) + α[r + γ max_{a′} Q(s′,a′) − Q(s,a)]. That is stochastic approximation of the same fixed point — same operator, sampled, damped by α." },
      { q: "What breaks when you add function approximation?", a: "The contraction is in the max-norm, but least-squares fitting projects in a weighted L2-norm, and the composition (projection ∘ Bellman) need not be a contraction. Combined with off-policy sampling and bootstrapping — the 'deadly triad' — value iteration can diverge. Target networks, replay, and gradient-TD methods are all attempts to restore stability." }
    ]
  },

  code: [
    { lang: "python", label: "Value iteration (tabular, vectorised)", code: "import numpy as np\n\ndef value_iteration(P, R, gamma, theta=1e-8):\n    \"\"\"P: (nS, nA, nS) transition probs.  R: (nS, nA) expected reward.\"\"\"\n    nS, nA, _ = P.shape\n    V = np.zeros(nS)\n    sweeps = 0\n    while True:\n        # Q(s,a) = R(s,a) + gamma * sum_s' P(s'|s,a) V(s')\n        Q = R + gamma * P.dot(V)            # (nS, nA)\n        V_new = Q.max(axis=1)               # Bellman OPTIMALITY backup\n        delta = np.abs(V_new - V).max()\n        V, sweeps = V_new, sweeps + 1\n        if delta < theta:\n            break\n    pi = Q.argmax(axis=1)                   # extract policy ONCE, at the end\n    # error bound: ||V - V*||_inf <= delta * gamma / (1 - gamma)\n    return V, pi, sweeps" },
    { lang: "python", label: "In-place (Gauss-Seidel) sweep", code: "def vi_in_place(P, R, gamma, theta=1e-8):\n    nS, nA, _ = P.shape\n    V = np.zeros(nS)\n    while True:\n        delta = 0.0\n        for s in range(nS):                 # later states see FRESH values\n            v_old = V[s]\n            V[s] = max(R[s, a] + gamma * P[s, a] @ V for a in range(nA))\n            delta = max(delta, abs(v_old - V[s]))\n        if delta < theta:\n            return V\n# Converges in fewer sweeps; ordering states backwards from the goal is best." },
    { lang: "python", label: "Q-value iteration + the greedy policy", code: "def q_value_iteration(P, R, gamma, iters=1000):\n    nS, nA, _ = P.shape\n    Q = np.zeros((nS, nA))\n    for _ in range(iters):\n        # Q(s,a) <- R(s,a) + gamma * sum_s' P(s'|s,a) max_a' Q(s',a')\n        Q = R + gamma * P.dot(Q.max(axis=1))\n    return Q\n\n# Acting from Q needs NO model:      a = Q[s].argmax()\n# Acting from V needs the model:     a = argmax_a (R[s,a] + gamma * P[s,a] @ V)" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 400 },

    params: [
      { key: "gammaPct", label: "γ (percent)",    type: "int", min: 50, max: 99, default: 90 },
      { key: "slipPct",  label: "Slip (percent)", type: "int", min: 0, max: 40, default: 20 },
      { key: "detail",   label: "Detail",         type: "enum", options: ["cell-by-cell", "sweep-only"], default: "cell-by-cell" },
      { key: "order",    label: "Update",         type: "enum", options: ["synchronous", "in-place"], default: "synchronous" }
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

      let V = new Array(nS).fill(0);
      const order = [];
      for (let s = 0; s < nS; s++) if (!isWall(s) && !isTerm(s)) order.push(s);

      const greedyOf = (V) => {
        const pi = new Array(nS).fill(-1);
        for (const s of order) {
          let bv = -Infinity, ba = 0;
          for (let a = 0; a < 4; a++) { const q = qOf(s, a, V); if (q > bv) { bv = q; ba = a; } }
          pi[s] = ba;
        }
        return pi;
      };

      const deltas = [];
      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: o.focus === undefined ? [] : [o.focus],
        state: {
          layout: layout.slice(), R: R, Cn: Cn, gamma: gamma, slip: slip,
          V: V.slice(), pi: o.pi ? o.pi.slice() : greedyOf(V),
          focus: o.focus === undefined ? -1 : o.focus,
          qs: o.qs ? o.qs.slice() : null,
          bestA: o.bestA === undefined ? -1 : o.bestA,
          oldV: o.oldV === undefined ? null : o.oldV,
          newV: o.newV === undefined ? null : o.newV,
          sweep: o.sweep, delta: o.delta === undefined ? null : o.delta,
          deltas: deltas.slice(), converged: !!o.converged,
          bound: o.delta === undefined || o.delta === null ? null : o.delta * gamma / (1 - gamma),
          detail: o.detail === undefined ? "" : o.detail
        }
      });

      yield snap({
        label: `Value iteration on a 5×5 gridworld: γ=${gamma.toFixed(2)}, slip ${(slip * 100).toFixed(0)}%, −1 per step, +10 goal, −10 pit. Every V(s) starts at 0 — the contraction guarantees we reach V* from any initialisation.`,
        phase: "init", sweep: 0
      });

      const cellByCell = params.detail === "cell-by-cell";
      const inPlace = params.order === "in-place";
      const detailSweeps = cellByCell ? 3 : 0;
      let sweep = 0, delta = Infinity;

      while (sweep < 80 && delta > 1e-3) {
        sweep++;
        const Vold = V.slice();
        const Vnext = V.slice();
        delta = 0;
        for (const s of order) {
          const src = inPlace ? Vnext : Vold;
          const qs = [0, 1, 2, 3].map(a => qOf(s, a, src));
          let bv = -Infinity, ba = 0;
          for (let a = 0; a < 4; a++) if (qs[a] > bv) { bv = qs[a]; ba = a; }
          const prev = Vnext[s];
          Vnext[s] = bv;
          delta = Math.max(delta, Math.abs(bv - Vold[s]));

          if (sweep <= detailSweeps) {
            const Vsaved = V;
            V = Vnext.slice();                 // show the partially-updated grid
            const r = Math.floor(s / Cn), c = s % Cn;
            const tk = trans(s, ba).map(([ns, p]) =>
              `${p.toFixed(2)}·(${rew(ns)}${isTerm(ns) ? "" : ` + ${gamma.toFixed(2)}·${Vold[ns].toFixed(1)}`})`).join(" + ");
            yield snap({
              label: `Sweep ${sweep} · back up (${r},${c}): Q values ${qs.map((q, a) => `${ANAME[a]}${q.toFixed(1)}`).join("  ")} → max is ${ANAME[ba]}. V(${r},${c}) ← ${tk} = ${bv.toFixed(2)} (was ${prev.toFixed(2)}).`,
              phase: "backup", sweep: sweep, focus: s, qs: qs, bestA: ba,
              oldV: prev, newV: bv, detail: tk
            });
            V = Vsaved;
          }
        }
        V = Vnext;
        deltas.push(delta);
        const conv = delta <= 1e-3;
        yield snap({
          label: `Sweep ${sweep} complete: max|ΔV| = ${delta.toFixed(4)}. ` +
            (sweep === 1 ? "Only cells adjacent to a terminal have learned anything — value propagates exactly one cell per synchronous sweep."
             : conv ? `Converged. Error bound ‖V−V*‖∞ ≤ δγ/(1−γ) = ${(delta * gamma / (1 - gamma)).toExponential(1)}.`
             : `The frontier of non-zero value spread one more ring outward; the residual is shrinking by roughly γ=${gamma.toFixed(2)} per sweep, so ‖V−V*‖∞ ≤ ${(delta * gamma / (1 - gamma)).toFixed(3)}.`),
          phase: conv ? "done" : "sweep", sweep: sweep, delta: delta, converged: conv
        });
      }

      const pi = greedyOf(V);
      yield snap({
        label: `V* found in ${sweep} sweeps. Now extract the policy ONCE: π*(s) = argmax_a Σ P(s′|s,a)[r + γV*(s′)]. Note the arrows near the pit steer wide — with ${(slip * 100).toFixed(0)}% slip the safe route is worth more than the short one.`,
        phase: "done", sweep: sweep, delta: delta, pi: pi, converged: true
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

      const side = Math.min(H - pad * 2 - 20, (W - pad * 3) * 0.5);
      const cell = side / S.R;
      const gx = pad, gy = pad + 20;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`Sweep ${S.sweep}` + (S.delta !== null ? `   max|ΔV| = ${S.delta.toFixed(4)}` : ""), pad, 15);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`γ=${S.gamma.toFixed(2)}  slip=${(S.slip * 100).toFixed(0)}%`, pad + 210, 15);

      // value range for the heatmap
      let lo = 0, hi = 0;
      for (let s = 0; s < S.V.length; s++) {
        if (S.layout[s] === "#") continue;
        lo = Math.min(lo, S.V[s]); hi = Math.max(hi, S.V[s]);
      }
      const span = Math.max(1e-6, Math.max(Math.abs(lo), Math.abs(hi)));

      for (let s = 0; s < S.R * S.Cn; s++) {
        const r = Math.floor(s / S.Cn), c = s % S.Cn;
        const x = gx + c * cell, y = gy + r * cell;
        const ch = S.layout[s];
        let fill;
        if (ch === "#") fill = C.surface2;
        else if (ch === "G") fill = C.viz6;
        else if (ch === "P") fill = C.viz8;
        else {
          const v = S.V[s];
          // diverging ramp between two tokens through the neutral surface colour
          fill = v >= 0 ? mix(C.surface, C.viz6, v / span) : mix(C.surface, C.viz8, -v / span);
        }
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, cell, cell);
        ctx.strokeStyle = C.border; ctx.lineWidth = 1;
        ctx.strokeRect(x + .5, y + .5, cell - 1, cell - 1);

        if (ch === "#") continue;
        ctx.textAlign = "center";
        ctx.fillStyle = C.text;
        ctx.font = `${Math.round(cell * 0.26)}px ${env.font.mono}`;
        const shown = ch === "G" ? "+10" : ch === "P" ? "−10" : S.V[s].toFixed(1);
        ctx.fillText(shown, x + cell / 2, y + cell * 0.5 + 3);
        if (ch !== "G" && ch !== "P" && S.pi[s] >= 0) {
          ctx.fillStyle = C.text2;
          ctx.font = `${Math.round(cell * 0.3)}px ${env.font.mono}`;
          ctx.fillText(ANAME[S.pi[s]], x + cell / 2, y + cell - 6);
        }
        if (s === S.focus) {
          ctx.strokeStyle = C.viz4; ctx.lineWidth = 3;
          ctx.strokeRect(x + 2, y + 2, cell - 4, cell - 4);
        }
      }

      // ---------- right panel: the backup + convergence ----------------------
      const px = gx + side + pad, pw = W - px - pad;
      const backupH = Math.round((H - gy - pad) * 0.56);
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(px, gy, pw, backupH, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(px + .5, gy + .5, pw - 1, backupH - 1, 8); ctx.stroke();

      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.text2;
      ctx.fillText("V(s) ← max_a Σ P(s′|s,a)[ r + γV(s′) ]", px + 10, gy + 18);

      if (S.qs) {
        const fr = Math.floor(S.focus / S.Cn), fc = S.focus % S.Cn;
        ctx.fillStyle = C.viz4;
        ctx.fillText(`focused cell (${fr},${fc})`, px + 10, gy + 36);
        const barX = px + 46, barW = pw - 70;
        let mx = 1e-6;
        for (const q of S.qs) mx = Math.max(mx, Math.abs(q));
        for (let a = 0; a < 4; a++) {
          const y = gy + 54 + a * 20;
          ctx.fillStyle = a === S.bestA ? C.text : C.text2;
          ctx.font = `12px ${env.font.mono}`;
          ctx.textAlign = "left";
          ctx.fillText(ANAME[a], px + 12, y + 4);
          const w = (Math.abs(S.qs[a]) / mx) * (barW / 2);
          const zero = barX + barW / 2;
          ctx.fillStyle = a === S.bestA ? C.viz1 : C.grid;
          ctx.fillRect(S.qs[a] >= 0 ? zero : zero - w, y - 6, Math.max(1, w), 11);
          ctx.fillStyle = a === S.bestA ? C.text : C.muted;
          ctx.font = `10px ${env.font.mono}`;
          ctx.textAlign = "right";
          ctx.fillText(S.qs[a].toFixed(2), px + pw - 10, y + 3);
        }
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(barX + barW / 2 + .5, gy + 46); ctx.lineTo(barX + barW / 2 + .5, gy + 54 + 4 * 20 - 12); ctx.stroke();
        ctx.textAlign = "left";
        ctx.fillStyle = C.text;
        ctx.font = `10px ${env.font.mono}`;
        const txt = `${S.oldV.toFixed(2)}  →  ${S.newV.toFixed(2)}`;
        ctx.fillText(`V(${fr},${fc}):  ${txt}`, px + 12, gy + 54 + 4 * 20 + 6);
        ctx.fillStyle = C.muted;
        const det = S.detail || "";
        ctx.fillText(det.length > 46 ? det.slice(0, 45) + "…" : det, px + 12, gy + 54 + 4 * 20 + 22);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText("Whole-sweep view: every non-terminal state", px + 10, gy + 40);
        ctx.fillText("takes its max-over-actions backup from the", px + 10, gy + 56);
        ctx.fillText("previous sweep's values.", px + 10, gy + 72);
        if (S.bound !== null) {
          ctx.fillStyle = C.text2;
          ctx.fillText(`‖V − V*‖∞ ≤ δ·γ/(1−γ) = ${S.bound.toFixed(4)}`, px + 10, gy + 100);
        }
      }

      // convergence chart
      const cy0 = gy + backupH + 12, cy1 = H - pad - 12;
      const cx0 = px + 34, cx1 = W - pad - 8;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(px, cy0 - 8, pw, (cy1 - cy0) + 22, 8); ctx.fill();
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("max|ΔV| per sweep (log scale)", cx0, cy0 + 6);

      const n = S.deltas.length;
      if (n > 0) {
        const logs = S.deltas.map(d => Math.log10(Math.max(1e-6, d)));
        const top = 1.2, bot = -4.2;
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        for (let e = -4; e <= 1; e++) {
          const y = cy1 - ((e - bot) / (top - bot)) * (cy1 - cy0 - 10);
          ctx.beginPath(); ctx.moveTo(cx0, y + .5); ctx.lineTo(cx1, y + .5); ctx.stroke();
          ctx.fillStyle = C.muted; ctx.textAlign = "right";
          ctx.fillText(`1e${e}`, cx0 - 4, y + 3);
        }
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 2;
        ctx.beginPath();
        const denom = Math.max(1, n - 1, 20);
        for (let i = 0; i < n; i++) {
          const x = cx0 + (i / denom) * (cx1 - cx0);
          const y = cy1 - ((logs[i] - bot) / (top - bot)) * (cy1 - cy0 - 10);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the Bellman **expectation** equation for V^π.", a: "`V^π(s) = Σ_a π(a|s) Σ_{s′} P(s′|s,a)[ R(s,a,s′) + γV^π(s′) ]`. Linear in V — solvable exactly as `V = (I − γP_π)⁻¹ r_π`.", tags: ["bellman"] },
      { q: "Write the Bellman **optimality** equation for V* and Q*.", a: "`V*(s) = max_a Σ_{s′} P(s′|s,a)[r + γV*(s′)]`; `Q*(s,a) = Σ_{s′} P(s′|s,a)[r + γ max_{a′} Q*(s′,a′)]`. The max makes them non-linear — no closed form.", tags: ["bellman"] },
      { q: "Why does value iteration converge?", a: "The Bellman optimality operator T is a γ-contraction in the max-norm: `‖TU − TV‖_∞ ≤ γ‖U − V‖_∞`. Banach's fixed-point theorem gives a unique fixed point V* and geometric convergence from any V₀.", tags: ["theory"] },
      { q: "Stopping rule and its guarantee?", a: "Stop when `max_s|V_{k+1}(s) − V_k(s)| < θ`; then `‖V_k − V*‖_∞ < θγ/(1−γ)` and the greedy policy is `2θγ/(1−γ)`-optimal. The `1/(1−γ)` factor is why γ near 1 is expensive.", tags: ["bounds"] },
      { q: "Cost of one value-iteration sweep?", a: "`O(|S|²|A|)` for a dense model, or `O(|S||A|b)` with branching factor b. Space is `O(|S|)` for V (plus the model itself).", tags: ["complexity"] },
      { q: "How fast does value propagate through the state space?", a: "One state per synchronous sweep, backwards from reward. A 100-step sparse-reward corridor needs ≥100 sweeps before the start state moves at all — the planning version of the credit-assignment problem.", tags: ["intuition"] },
      { q: "Turn value iteration into Q-learning in one line.", a: "Replace the model expectation with one sampled transition and take a step instead of overwriting: `Q(s,a) ← Q(s,a) + α[r + γ max_{a′}Q(s′,a′) − Q(s,a)]`.", tags: ["connection"] },
      { q: "What is the 'deadly triad'?", a: "Function approximation + bootstrapping + off-policy training. Each pair is safe; all three together can diverge, because the max-norm contraction is destroyed by the L2 projection of a fitted approximator.", tags: ["pitfall"] }
    ],
    sixtySecond: [
      "State both Bellman equations and explain why value iteration provably converges.",
      "Explain the stopping criterion for value iteration and why γ close to 1 makes it expensive."
    ]
  }
};
