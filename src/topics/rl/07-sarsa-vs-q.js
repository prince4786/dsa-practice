export default {
  id: "sarsa-vs-q",
  track: "rl",
  title: "SARSA vs Q-Learning",
  difficulty: 2,
  minutes: 15,
  tags: ["on-policy", "off-policy", "sarsa", "cliff-walking", "expected-sarsa"],

  explainer: [
    { type: "p", text: "SARSA and Q-learning differ by one symbol, and that symbol changes what they are learning about." },
    { type: "list", items: [
      "**SARSA** (on-policy): `Q(s,a) ← Q(s,a) + α[ r + γQ(s′,a′) − Q(s,a) ]` where `a′` is the action **actually taken next** by the ε-greedy behaviour policy. The tuple `(s, a, r, s′, a′)` is where the name comes from. It converges to `Q^π` for the policy you are actually running — exploration included.",
      "**Q-learning** (off-policy): `Q(s,a) ← Q(s,a) + α[ r + γ·max_{a′}Q(s′,a′) − Q(s,a) ]`. The target assumes you will act greedily from `s′` onwards, so it converges to `Q*` — the value of a policy that never explores."
    ]},
    { type: "h3", text: "Cliff walking: the canonical demonstration" },
    { type: "p", text: "A 4×12 grid; the bottom row between start and goal is a cliff (`−100` and back to start). Every step costs `−1`. The shortest route hugs the cliff edge. Q-learning learns exactly that route because `max` assumes it will never make a mistake. SARSA's backup averages in the ε-probability of stepping sideways off the edge, so the edge states get a genuinely lower value and SARSA routes one row further up." },
    { type: "callout", tone: "tip", text: "The punchline interviewers want: **Q-learning learns the better policy but collects less reward while learning**. Its greedy policy is optimal; its *online* performance under ε-greedy behaviour is worse, because the policy it optimises is not the policy it executes. If exploration is dangerous — a real robot, a live recommender, a trading system — you want the on-policy answer." },
    { type: "h3", text: "Expected SARSA sits in between" },
    { type: "p", text: "`Q(s,a) ← Q(s,a) + α[ r + γ Σ_{a′} π(a′|s′)Q(s′,a′) − Q(s,a) ]`. It replaces the sampled `a′` with its expectation under `π`, removing the variance from choosing `a′` at the cost of an `O(|A|)` sum. It dominates SARSA at essentially every step size — and if you make the target policy greedy while behaving ε-greedily, Expected SARSA *is* Q-learning. That generalisation makes it the cleanest way to see the on-/off-policy axis as a choice of target policy." },
    { type: "h3", text: "Both converge — to different things" },
    { type: "p", text: "SARSA converges to `Q*` too, but only if the policy becomes greedy in the limit: **GLIE** (Greedy in the Limit with Infinite Exploration), e.g. `ε_t = 1/t`. With a fixed `ε` it converges to the optimal *ε-soft* policy — which is the right answer to a slightly different question. Q-learning converges to `Q*` regardless of the behaviour policy, provided coverage." },
    { type: "callout", tone: "pitfall", text: "SARSA's `a′` must be the action you will actually execute at the next step; sampling a fresh action for the update and then choosing a different one silently turns it into a broken off-policy method. Structure the loop so `a′` is chosen once and carried into the next iteration." },
    { type: "h3", text: "Where this shows up in modern RL" },
    { type: "p", text: "The on-/off-policy axis decides your data pipeline. Off-policy (Q-learning, DQN, SAC, offline RL) can reuse a replay buffer and learn from logged or demonstrated data, at the price of distribution shift and instability. On-policy (SARSA, REINFORCE, A2C, PPO) needs fresh samples from the current policy — expensive, but far better behaved, which is why PPO is the workhorse for RLHF where every sample costs a model rollout." }
  ],

  complexity: {
    rows: [
      { operation: "SARSA update", time: "O(1)", space: "O(|S|·|A|)", note: "no max needed — a′ is already chosen" },
      { operation: "Q-learning update", time: "O(|A|)", space: "O(|S|·|A|)", note: "max over next actions" },
      { operation: "Expected SARSA update", time: "O(|A|)", space: "O(|S|·|A|)", note: "expectation over π(·|s′); lower variance" },
      { operation: "Data reuse", time: "—", space: "—", note: "off-policy: replay buffer OK; on-policy: fresh samples only" }
    ]
  },

  interview: {
    whyAsked: "It is the sharpest test of whether you understand on-policy versus off-policy as a *statement about the target*, not a piece of trivia. The cliff-walking answer — 'Q-learning learns the optimal policy but performs worse online' — is the specific sentence interviewers listen for.",
    followUps: [
      { q: "One-line difference between SARSA and Q-learning?", a: "SARSA bootstraps with Q(s′, a′) for the action the behaviour policy will actually take; Q-learning bootstraps with max_{a′}Q(s′,a′). So SARSA evaluates the policy being executed (including its exploration) and Q-learning evaluates the greedy policy." },
      { q: "In cliff walking, which finds the better path and which earns more reward?", a: "Q-learning learns the optimal path along the cliff edge, but while training with ε-greedy behaviour it repeatedly falls off, so its average online return is worse. SARSA's backup includes the probability of an exploratory step into the cliff, so it values edge states lower and takes a safer route one row up — a slightly longer path with much better online return." },
      { q: "Does SARSA converge to Q*?", a: "Only under GLIE: the policy must become greedy in the limit while still exploring infinitely often, e.g. ε_t = 1/t, plus Robbins–Monro step sizes. With a fixed ε it converges to the optimal ε-soft policy instead — the best policy that is still forced to explore." },
      { q: "What is Expected SARSA and when is it preferable?", a: "It replaces the sampled a′ with Σ_{a′}π(a′|s′)Q(s′,a′). This removes the variance from sampling a′, so it tolerates larger α and usually learns faster, at O(|A|) cost per update. Choosing a greedy target policy while behaving ε-greedily recovers Q-learning exactly, so it generalises both." },
      { q: "When would you deliberately choose the on-policy method?", a: "When exploration itself is costly or dangerous and you must optimise the behaviour you will actually run — physical robots, live traffic, clinical or financial decisions. Also when off-policy distribution shift is destabilising your value function, which is a routine problem once function approximation is involved." },
      { q: "Why can off-policy methods use a replay buffer but on-policy methods can't?", a: "An off-policy target is defined without reference to the data-collecting policy, so stale transitions are still valid samples of the same Bellman backup. An on-policy target is an expectation under the *current* policy; once the policy has moved, old samples estimate the wrong expectation. On-policy methods either discard data or correct it with importance sampling, whose variance explodes over long horizons — which is why PPO instead clips a single-step ratio and reuses data for only a few epochs." }
    ]
  },

  code: [
    { lang: "python", label: "SARSA (on-policy) — note where a′ comes from", code: "import numpy as np\n\ndef sarsa(env, episodes, alpha=0.5, gamma=1.0, eps=0.1, rng=None):\n    rng = rng or np.random.default_rng(0)\n    Q = np.zeros((env.nS, env.nA))\n\n    def eps_greedy(s):\n        return int(rng.integers(env.nA)) if rng.random() < eps else int(np.argmax(Q[s]))\n\n    for _ in range(episodes):\n        s = env.reset()\n        a = eps_greedy(s)                     # choose a BEFORE the loop\n        done = False\n        while not done:\n            s2, r, done = env.step(a)\n            a2 = eps_greedy(s2)               # the action we WILL take\n            target = r if done else r + gamma * Q[s2, a2]   # <- on-policy\n            Q[s, a] += alpha * (target - Q[s, a])\n            s, a = s2, a2                     # carry a2 forward — do not resample\n    return Q" },
    { lang: "python", label: "Q-learning and Expected SARSA, same loop", code: "def td_control(env, episodes, rule=\"q\", alpha=0.5, gamma=1.0, eps=0.1, rng=None):\n    rng = rng or np.random.default_rng(0)\n    Q = np.zeros((env.nS, env.nA))\n    for _ in range(episodes):\n        s, done = env.reset(), False\n        while not done:\n            a = int(rng.integers(env.nA)) if rng.random() < eps else int(np.argmax(Q[s]))\n            s2, r, done = env.step(a)\n\n            if done:\n                boot = 0.0\n            elif rule == \"q\":                       # OFF-policy: greedy target\n                boot = Q[s2].max()\n            else:                                    # Expected SARSA: eps-greedy target\n                pi = np.full(env.nA, eps / env.nA)\n                pi[np.argmax(Q[s2])] += 1 - eps\n                boot = float(pi @ Q[s2])\n\n            Q[s, a] += alpha * (r + gamma * boot - Q[s, a])\n            s = s2\n    return Q\n# Expected SARSA with a GREEDY target policy is exactly Q-learning." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 250 },

    params: [
      { key: "episodes", label: "Episodes",     type: "int", min: 100, max: 900, default: 500 },
      { key: "epsPct",   label: "ε (percent)",  type: "int", min: 1, max: 40, default: 10 },
      { key: "alphaPct", label: "α (percent)",  type: "int", min: 5, max: 100, default: 50 },
      { key: "seed",     label: "Reroll",       type: "seed" }
    ],

    frames: function* (params, rng) {
      const eps = params.epsPct / 100;
      const alpha = params.alphaPct / 100;
      const gamma = 1.0;
      const R = 4, Cn = 12, nS = R * Cn;
      const start = 3 * Cn + 0, goal = 3 * Cn + (Cn - 1);
      const isCliff = (s) => Math.floor(s / Cn) === 3 && s % Cn > 0 && s % Cn < Cn - 1;
      const ACT = [[-1, 0], [0, 1], [1, 0], [0, -1]];
      const ANAME = ["↑", "→", "↓", "←"];

      const step = (s, a) => {
        const r = Math.floor(s / Cn), c = s % Cn;
        let nr = r + ACT[a][0], nc = c + ACT[a][1];
        if (nr < 0 || nc < 0 || nr >= R || nc >= Cn) { nr = r; nc = c; }
        const ns = nr * Cn + nc;
        if (isCliff(ns)) return [start, -100, false];   // fall: big penalty, back to start
        if (ns === goal) return [ns, -1, true];
        return [ns, -1, false];
      };

      let Qs = new Array(nS * 4).fill(0);   // SARSA
      let Qq = new Array(nS * 4).fill(0);   // Q-learning
      const argmaxRow = (Q, s) => {
        let b = 0;
        for (let a = 1; a < 4; a++) if (Q[s * 4 + a] > Q[s * 4 + b]) b = a;
        return b;
      };
      const maxRow = (Q, s) => Math.max(Q[s * 4], Q[s * 4 + 1], Q[s * 4 + 2], Q[s * 4 + 3]);
      const pick = (Q, s) => (rng() < eps ? Math.min(3, Math.floor(rng() * 4)) : argmaxRow(Q, s));

      const greedyPath = (Q) => {
        const p = [start], seen = {};
        let s = start;
        for (let i = 0; i < 60; i++) {
          if (s === goal || seen[s]) break;
          seen[s] = 1;
          const a = argmaxRow(Q, s);
          const [ns, , done] = step(s, a);
          p.push(ns);
          s = ns;
          if (done || ns === start) break;
        }
        return p;
      };

      const retS = [], retQ = [], epx = [];
      const snap = (o) => ({
        label: o.label, phase: o.phase, focus: [],
        state: {
          R: R, Cn: Cn, start: start, goal: goal,
          Qs: Qs.slice(), Qq: Qq.slice(),
          pathS: o.pathS ? o.pathS.slice() : [],
          pathQ: o.pathQ ? o.pathQ.slice() : [],
          ep: o.ep, eps: eps, alpha: alpha,
          epx: epx.slice(), retS: retS.slice(), retQ: retQ.slice(),
          totalEp: params.episodes,
          edge: o.edge ? o.edge.slice() : null,
          fallsS: o.fallsS === undefined ? 0 : o.fallsS,
          fallsQ: o.fallsQ === undefined ? 0 : o.fallsQ
        }
      });

      yield snap({
        label: `Cliff walking. Both agents run on the same 4×12 grid with ε=${eps.toFixed(2)}, α=${alpha.toFixed(2)}, γ=1, −1 per step and −100 for falling in. The only difference between them is one symbol in the target.`,
        phase: "init", ep: 0, pathS: [], pathQ: []
      });

      let fallsS = 0, fallsQ = 0;
      const every = Math.max(1, Math.round(params.episodes / 55));

      for (let ep = 1; ep <= params.episodes; ep++) {
        // ---- SARSA episode -------------------------------------------------
        {
          let s = start, a = pick(Qs, s), done = false, t = 0, ret = 0;
          Qs = Qs.slice();
          while (!done && t < 400) {
            const [s2, r, dn] = step(s, a);
            if (r === -100) fallsS++;
            const a2 = pick(Qs, s2);
            const target = dn ? r : r + gamma * Qs[s2 * 4 + a2];   // ON-policy: the action we will take
            Qs[s * 4 + a] += alpha * (target - Qs[s * 4 + a]);
            ret += r; s = s2; a = a2; done = dn; t++;
          }
          retS.push(ret);
        }
        // ---- Q-learning episode --------------------------------------------
        {
          let s = start, done = false, t = 0, ret = 0;
          Qq = Qq.slice();
          while (!done && t < 400) {
            const a = pick(Qq, s);
            const [s2, r, dn] = step(s, a);
            if (r === -100) fallsQ++;
            const target = dn ? r : r + gamma * maxRow(Qq, s2);     // OFF-policy: greedy
            Qq[s * 4 + a] += alpha * (target - Qq[s * 4 + a]);
            ret += r; s = s2; done = dn; t++;
          }
          retQ.push(ret);
        }
        epx.push(ep);

        if (ep % every === 0 || ep === params.episodes) {
          const pS = greedyPath(Qs), pQ = greedyPath(Qq);
          // the tell-tale cell: row 2, mid-grid — one step above the cliff
          const edgeS = 2 * Cn + 5;
          const below = 3 * Cn + 5;
          const piExp = (() => {           // SARSA's expected bootstrap at that state
            const b = argmaxRow(Qs, edgeS);
            let e = 0;
            for (let a = 0; a < 4; a++) e += ((a === b ? 1 - eps : 0) + eps / 4) * Qs[edgeS * 4 + a];
            return e;
          })();
          const edge = [
            Qs[edgeS * 4 + 2], Qq[edgeS * 4 + 2],       // value of stepping DOWN into the cliff
            Qs[edgeS * 4 + 1], Qq[edgeS * 4 + 1],       // value of stepping RIGHT along the edge
            piExp, maxRow(Qq, edgeS), edgeS, below
          ];
          const wS = retS.slice(-20).reduce((x, y) => x + y, 0) / Math.min(20, retS.length);
          const wQ = retQ.slice(-20).reduce((x, y) => x + y, 0) / Math.min(20, retQ.length);
          yield snap({
            label: `Episode ${ep}: last-20 average return — SARSA ${wS.toFixed(1)}, Q-learning ${wQ.toFixed(1)}. Cliff falls so far: SARSA ${fallsS}, Q-learning ${fallsQ}. ` +
              (ep < params.episodes * 0.25
                ? "Both are still mostly random; the cliff is teaching them where −100 lives."
                : `SARSA's greedy route is ${pS.length - 1} steps and stays ${3 - Math.min.apply(null, pS.map(x => Math.floor(x / Cn)))} row(s) clear of the edge; Q-learning's is ${pQ.length - 1} steps hugging the cliff. Q-learning's *policy* is better, its *online* return is worse — it optimises a greedy policy it never actually executes.`),
            phase: ep === params.episodes ? "done" : "train",
            ep: ep, pathS: pS, pathQ: pQ, edge: edge, fallsS: fallsS, fallsQ: fallsQ
          });
        }
      }

      const pS = greedyPath(Qs), pQ = greedyPath(Qq);
      const wS = retS.slice(-50).reduce((x, y) => x + y, 0) / Math.min(50, retS.length);
      const wQ = retQ.slice(-50).reduce((x, y) => x + y, 0) / Math.min(50, retQ.length);
      yield snap({
        label: `Final: Q-learning's greedy path is ${pQ.length - 1} steps (optimal is 13) versus SARSA's ${pS.length - 1}. But averaged over the last 50 training episodes SARSA earned ${wS.toFixed(1)} against Q-learning's ${wQ.toFixed(1)}, with ${fallsQ} falls to SARSA's ${fallsS}. SARSA's backup contains the ε chance of stepping off; Q-learning's max pretends that never happens.`,
        phase: "done", ep: params.episodes, pathS: pS, pathQ: pQ, fallsS: fallsS, fallsQ: fallsQ
      });
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 16;
      const cell = Math.min((W - pad * 2) / S.Cn, (H * 0.40) / S.R);
      const gw = cell * S.Cn, gh = cell * S.R;
      const gx = pad + ((W - pad * 2) - gw) / 2, gy = pad + 20;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`Episode ${S.ep} / ${S.totalEp}`, pad, 15);
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillStyle = C.viz2; ctx.fillText(`■ SARSA (on-policy)  falls ${S.fallsS}`, pad + 130, 15);
      ctx.fillStyle = C.viz1; ctx.fillText(`■ Q-learning (off-policy)  falls ${S.fallsQ}`, pad + 330, 15);

      for (let r = 0; r < S.R; r++) {
        for (let c = 0; c < S.Cn; c++) {
          const s = r * S.Cn + c;
          const x = gx + c * cell, y = gy + r * cell;
          const cliff = r === S.R - 1 && c > 0 && c < S.Cn - 1;
          ctx.fillStyle = cliff ? C.viz8 : s === S.goal ? C.viz6 : C.surface;
          ctx.fillRect(x, y, cell, cell);
          ctx.strokeStyle = C.border; ctx.lineWidth = 1;
          ctx.strokeRect(x + .5, y + .5, cell - 1, cell - 1);
          ctx.textAlign = "center";
          ctx.font = `9px ${env.font.mono}`;
          if (cliff) { ctx.fillStyle = C.text; ctx.fillText("−100", x + cell / 2, y + cell / 2 + 3); }
          else if (s === S.goal) { ctx.fillStyle = C.text; ctx.fillText("goal", x + cell / 2, y + cell / 2 + 3); }
          else if (s === S.start) { ctx.fillStyle = C.muted; ctx.fillText("s₀", x + cell / 2, y + cell / 2 + 3); }
        }
      }

      const drawPath = (path, col, dy) => {
        if (path.length < 2) return;
        ctx.strokeStyle = col; ctx.lineWidth = 3;
        ctx.beginPath();
        for (let i = 0; i < path.length; i++) {
          const s = path[i];
          const x = gx + (s % S.Cn) * cell + cell / 2;
          const y = gy + Math.floor(s / S.Cn) * cell + cell / 2 + dy;
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        const last = path[path.length - 1];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.arc(gx + (last % S.Cn) * cell + cell / 2, gy + Math.floor(last / S.Cn) * cell + cell / 2 + dy, 4, 0, Math.PI * 2);
        ctx.fill();
      };
      drawPath(S.pathS, C.viz2, -4);
      drawPath(S.pathQ, C.viz1, 4);

      // ---------- lower half: return curves + edge-cell numbers ----------------
      const by = gy + gh + 16;
      const bh = H - by - pad;
      const leftW = (W - pad * 3) * 0.62;

      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, by, leftW, bh, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(pad + .5, by + .5, leftW - 1, bh - 1, 8); ctx.stroke();
      ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
      ctx.fillText("return per episode (smoothed over 20) — clipped at −100", pad + 10, by + 14);

      const ax0 = pad + 40, ax1 = pad + leftW - 12, ay0 = by + 22, ay1 = by + bh - 16;
      const top = 0, bot = -100;
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const v = bot + (i / 4) * (top - bot);
        const y = ay1 - ((v - bot) / (top - bot)) * (ay1 - ay0);
        ctx.beginPath(); ctx.moveTo(ax0, y + .5); ctx.lineTo(ax1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(v.toFixed(0), ax0 - 4, y + 3);
      }
      const smooth = (arr) => {
        const out = [];
        let acc = 0;
        for (let i = 0; i < arr.length; i++) {
          acc += arr[i];
          if (i >= 20) acc -= arr[i - 20];
          out.push(acc / Math.min(20, i + 1));
        }
        return out;
      };
      const curve = (arr, col) => {
        if (arr.length < 2) return;
        const sm = smooth(arr);
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < sm.length; i++) {
          const x = ax0 + (i / Math.max(1, S.totalEp - 1)) * (ax1 - ax0);
          const v = Math.max(bot, Math.min(top, sm[i]));
          const y = ay1 - ((v - bot) / (top - bot)) * (ay1 - ay0);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      };
      curve(S.retS, C.viz2);
      curve(S.retQ, C.viz1);

      // edge-cell comparison
      const rx = pad * 2 + leftW, rw = W - rx - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(rx, by, rw, bh, 8); ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(rx + .5, by + .5, rw - 1, bh - 1, 8); ctx.stroke();

      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      ctx.fillText("the cliff-edge cell (row 2, col 5)", rx + 10, by + 14);
      if (S.edge) {
        const rows = [
          ["Q(edge, ↓ into cliff)", S.edge[0], S.edge[1]],
          ["Q(edge, → along edge)", S.edge[2], S.edge[3]],
          ["bootstrap used at edge", S.edge[4], S.edge[5]]
        ];
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillStyle = C.viz2; ctx.fillText("SARSA", rx + rw - 96, by + 28);
        ctx.fillStyle = C.viz1; ctx.fillText("Q-learn", rx + rw - 46, by + 28);
        rows.forEach((row, i) => {
          const y = by + 44 + i * 18;
          ctx.fillStyle = C.text2; ctx.textAlign = "left"; ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(row[0], rx + 10, y);
          ctx.textAlign = "right"; ctx.font = `10px ${env.font.mono}`;
          ctx.fillStyle = C.viz2; ctx.fillText(row[1].toFixed(1), rx + rw - 60, y);
          ctx.fillStyle = C.viz1; ctx.fillText(row[2].toFixed(1), rx + rw - 8, y);
        });
        ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`;
        ctx.fillText("SARSA averages over ε-random actions,", rx + 10, by + bh - 26);
        ctx.fillText("so being near the cliff is genuinely worse.", rx + 10, by + bh - 14);
      }
    }
  },

  drill: {
    cards: [
      { q: "Write the SARSA update and say where a′ comes from.", a: "`Q(s,a) ← Q(s,a) + α[ r + γQ(s′,a′) − Q(s,a) ]`, where `a′` is the action the ε-greedy behaviour policy will actually execute next. Carry it into the next loop iteration — do not resample.", tags: ["update-rule"] },
      { q: "One-symbol difference between SARSA and Q-learning?", a: "`Q(s′,a′)` (on-policy: the action taken) versus `max_{a′}Q(s′,a′)` (off-policy: the greedy action). SARSA learns `Q^π` for the policy being run; Q-learning learns `Q*`.", tags: ["comparison"] },
      { q: "In cliff walking, why does SARSA take the longer route?", a: "Its backup includes the ε-probability of an exploratory step into the cliff, so states next to the edge acquire genuinely lower values. Q-learning's max assumes it will always act greedily, so the edge looks safe.", tags: ["cliff-walking"] },
      { q: "Which earns more reward during training, and which learns the better policy?", a: "SARSA earns more online reward (fewer falls); Q-learning learns the better final greedy policy (the optimal 13-step path). Optimising a policy you do not execute costs you while you learn.", tags: ["key-insight"] },
      { q: "Under what condition does SARSA converge to Q*?", a: "GLIE — Greedy in the Limit with Infinite Exploration (e.g. `ε_t = 1/t`) — plus Robbins–Monro step sizes. With fixed ε it converges to the optimal ε-soft policy, not to Q*.", tags: ["convergence"] },
      { q: "Write the Expected SARSA target and its relation to both methods.", a: "`r + γ Σ_{a′}π(a′|s′)Q(s′,a′)`. It removes the variance of sampling a′ at `O(|A|)` cost. With a greedy target policy it is exactly Q-learning; with the behaviour policy it is a lower-variance SARSA.", tags: ["expected-sarsa"] },
      { q: "Why can off-policy methods use a replay buffer while on-policy methods can't?", a: "Off-policy targets do not reference the data-collecting policy, so old transitions remain valid samples. On-policy targets are expectations under the *current* policy, so stale data estimates the wrong quantity — you need fresh rollouts, importance weights, or PPO-style clipped ratios.", tags: ["data"] },
      { q: "Name an application where you specifically want the on-policy answer.", a: "Anywhere exploration is expensive or dangerous and the deployed behaviour includes randomness: physical robots, live recommenders, trading, clinical decision support. You want the value of what you will actually run, exploration included.", tags: ["practice"] }
    ],
    sixtySecond: [
      "Explain the SARSA and Q-learning targets and use cliff walking to explain when you would choose each.",
      "Explain Expected SARSA and how it generalises both SARSA and Q-learning."
    ]
  }
};
