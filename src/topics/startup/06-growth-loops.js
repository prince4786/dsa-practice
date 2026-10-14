export default {
  id: "growth-loops",
  track: "startup",
  title: "Funnels & Growth Loops",
  difficulty: 2,
  minutes: 16,
  tags: ["growth", "aarrr", "activation", "viral-coefficient", "growth-loops", "funnel"],

  explainer: [
    { type: "p", text: "Growth is not one number. It is the result of a chain of steps — someone hears about you, tries the product, gets value, keeps coming back, pays, and (ideally) brings others. If any step leaks, everything after it shrinks. This lesson covers two ways of looking at that chain. A **funnel** is a one-way pipe: you pour people in at the top and some fraction comes out as customers. A **growth loop** is a circle: the output of the process (active users) produces new input (more users) without you paying for it again. Funnels grow in a straight line as fast as you can pour; loops compound like interest. The best early-stage growth work is finding the loop your product naturally has and making it turn faster." },

    { type: "h3", text: "The funnel: AARRR" },
    { type: "p", text: "Investor Dave McClure named the classic funnel stages **AARRR** (said out loud as 'pirate metrics'). Each stage has one number to watch, and you fix the leakiest stage first, because improving a later stage multiplies only the few people who reached it." },
    { type: "list", items: [
      "**Acquisition** — people arrive: visit the site, join the waitlist, sign up. Measured as signups per week and **cost per signup** by channel.",
      "**Activation** — they reach the **aha moment**, the first time the product clearly delivers its promised value. Measured as the share of signups that activate, and how long it takes (**time to value**).",
      "**Retention** — they come back and keep getting value (see the product-market fit lesson). Measured as cohort retention.",
      "**Revenue** — they pay. Measured as conversion to paid and revenue per account.",
      "**Referral** — they bring others. Measured as invites sent and accepted per active user."
    ]},
    { type: "callout", tone: "tip", text: "Activation is usually the highest-leverage stage early on. If 1,000 people sign up and 15% activate, doubling activation to 30% doubles everything downstream — retention, revenue and referrals — for the same acquisition spend. And it is fully in the team's control: onboarding, defaults, templates, and how fast the first useful result appears." },

    { type: "h3", text: "Finding the aha moment" },
    { type: "p", text: "The aha moment is not 'finished signing up'. It is a concrete action that, in your data, separates people who stay from people who leave. Facebook famously found 'seven friends in ten days'; Slack found that teams which had exchanged about 2,000 messages almost never left. Find yours by comparing retained and churned users: which early action did the retained ones almost all take? Then redesign onboarding so every new user reaches that action as fast as possible — fewer steps, good defaults, pre-filled examples." },

    { type: "h3", text: "Loops and the viral coefficient" },
    { type: "p", text: "A loop needs every user to generate, on average, some number of new users. That number is the **viral coefficient**, written `k`: `k = invites sent per user × fraction of invites that become users`. If each activated user sends 4 invites and 10% of invitees sign up, `k = 0.4`. Two things follow:" },
    { type: "list", items: [
      "**If k < 1**, the loop does not grow on its own, but it **amplifies** every user you acquire another way. Each user brings `k` more, who bring `k²` more, and so on, summing to `1 / (1 − k)` total. With `k = 0.4`, every user you pay for becomes about 1.67 users — your acquisition is 67% cheaper.",
      "**If k ≥ 1**, every user brings at least one more, and growth is exponential until you run out of people to reach (the market saturates). This is rare and usually short-lived; do not plan a business on it."
    ]},
    { type: "p", text: "The second number is **cycle time**: how long it takes a new user to activate and bring the next ones. A loop with `k = 0.5` turning every week grows far faster than one with `k = 0.5` turning every two months, because the compounding happens more often. Shortening cycle time — inviting colleagues during onboarding instead of a month later — is often easier than raising `k`." },
    { type: "list", items: [
      "**Viral / collaboration loop** — the product works better with others, so users invite them (Slack, Figma, Notion, Calendly links).",
      "**Content loop** — users or the product create public content that search engines and social feeds show to new people, some of whom sign up (Pinterest, Stack Overflow, Canva templates).",
      "**Paid loop** — revenue from users funds ads that bring more users. Only works when a customer's value comfortably exceeds the cost of acquiring one (see unit economics).",
      "**Sales loop** — happy customers become case studies and references that close the next deals."
    ]},
    { type: "callout", tone: "pitfall", text: "Churn fights every loop. If users leave quickly, they stop inviting and stop counting as active. A loop with high k but poor retention looks like growth for a few weeks and then flattens or collapses. Fix retention before pouring effort into referral mechanics." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "p", text: "Theoma has three natural loops, and the product can make each turn faster:" },
    { type: "list", items: [
      "**Teammate invite loop (collaboration).** A workspace is more useful with the whole team in it, and agents posting useful work in a channel give people a reason to invite colleagues. Measure invites per activated workspace and invite acceptance. Speed it up by asking for teammates during onboarding, right after the first agent output appears — while value is visible.",
      "**Shared-output loop (content).** Agent work leaves the workspace: a published blog post, a launched outbound campaign, a shared report. A tasteful 'made with Theoma' on shareable reports or a public link to a playbook turns each one into a small ad. Measure signups attributed to those links.",
      "**Dogfood content loop.** The Marketer runs Theoma's own marketing — the page plan, articles, AI-visibility checks for theoma.ai. Each published page brings search and AI-answer traffic, and its quality is the demo.",
      "**Define the aha moment from data now:** compare early workspaces that stayed with those that left. A likely candidate is 'first agent output accepted within the first day, with at least two humans in the workspace' — test it, then cut every onboarding step that does not lead there."
    ]}
  ],

  glossary: [
    { term: "Funnel", plain: "A one-way sequence of steps (visit, sign up, activate, pay) where each step loses some people. Output grows only as fast as you pour people in at the top." },
    { term: "Growth loop", plain: "A cycle where the output of the product — active users or the content they make — brings in new users, who produce more output. Loops compound; funnels do not." },
    { term: "AARRR (pirate metrics)", plain: "The five funnel stages: Acquisition, Activation, Retention, Revenue, Referral." },
    { term: "Acquisition", plain: "Getting people to arrive — visit, join the waitlist or sign up." },
    { term: "Activation", plain: "A new user reaching the aha moment — the first time the product delivers its real value." },
    { term: "Aha moment", plain: "The specific early action that, in your data, separates users who stay from users who leave." },
    { term: "Time to value", plain: "How long it takes a new user to get their first real result from the product." },
    { term: "Viral coefficient (k)", plain: "How many new users each user brings in, on average: invites per user times the share of invites that sign up." },
    { term: "Cycle time", plain: "How long one turn of a loop takes — from a user signing up to the users they bring signing up." },
    { term: "Amplification 1/(1−k)", plain: "When k is below 1, each user you acquire directly ends up bringing this many users in total, counting invites of invites." },
    { term: "Saturation", plain: "When growth slows because most of the people you can reach have already been reached." },
    { term: "Churn", plain: "The share of active users who stop using the product in a period." }
  ],

  complexity: {
    rows: [
      { operation: "Signup → activation (B2B SaaS)", time: "20–40%", space: "≥ 60%", note: "depends hugely on the aha-moment definition" },
      { operation: "Viral coefficient k (B2B)", time: "0.2–0.5", space: "> 0.7", note: "k ≥ 1 is rare and temporary" },
      { operation: "Invite acceptance rate", time: "20–30%", space: "≥ 40%", note: "colleague invites beat cold referrals" },
      { operation: "Weekly growth, early startup", time: "5–7% / week", space: "≥ 10% / week", note: "of the core metric (e.g. weekly active teams), YC rule of thumb" },
      { operation: "Time to first value", time: "same day", space: "< 10 minutes", note: "every extra onboarding step loses users" }
    ]
  },

  interview: {
    whyAsked: "Theoma is a team workspace whose agents produce work that leaves the building — so it has natural invite and content loops that most B2B tools lack. Finding the aha moment and making those loops turn fast is the cheapest growth available to a small team; paid acquisition before that is money spent filling a leaky funnel.",
    followUps: [
      { q: "How will Theoma grow beyond founder-led sales?", a: "Through loops it naturally has: teammates invited into a workspace because agents' work is visible in channels, shared agent output (published content, reports, campaigns) that carries Theoma's name, and the Marketer running Theoma's own content. We measure k and cycle time for each and work on the biggest lever." },
      { q: "What is your activation metric?", a: "A specific action tied to retention in our data — currently we hypothesise 'first agent output accepted within the first day, with at least two people in the workspace'. We validate it by comparing retained and churned workspaces, and we track the share of signups reaching it and how long it takes." },
      { q: "Your viral coefficient is 0.3 — is that useless?", a: "No. Below 1 it does not grow on its own, but it amplifies every acquired user by 1/(1−0.3) ≈ 1.43, making paid and sales acquisition about 30% cheaper. And it compounds with shorter cycle time." },
      { q: "Which funnel stage would you fix first?", a: "The leakiest one closest to the top that we control — usually activation. Improvements there multiply everything downstream, and onboarding is entirely in our hands." },
      { q: "Why not just buy ads?", a: "Before retention and activation are solid, ads buy users who leave. Paid acquisition only becomes a loop when customer value comfortably exceeds acquisition cost, which needs proven retention and pricing first." },
      { q: "What kills a growth loop?", a: "Churn and slow cycles. Users who leave stop inviting; a loop that takes months to turn compounds too slowly to matter." }
    ]
  },

  code: [
    { lang: "python", label: "Viral coefficient and amplification", code: "def viral(invites_per_user, accept_rate):\n    k = invites_per_user * accept_rate\n    amp = 1 / (1 - k) if k < 1 else float('inf')\n    return k, amp\n\nk, amp = viral(invites_per_user=4, accept_rate=0.10)\nprint(f'k={k:.2f}, each acquired user becomes {amp:.2f} users')   # k=0.40, 1.67" },
    { lang: "python", label: "Funnel vs loop, week by week", code: "def simulate(weeks=52, base=100, activation=0.4, k=0.5, cycle=2, churn=0.05):\n    activated = [0.0] * weeks\n    active = 0.0\n    history = []\n    for t in range(weeks):\n        invited = k * activated[t - cycle] if t >= cycle else 0.0\n        signups = base + invited\n        activated[t] = signups * activation\n        active = active * (1 - churn) + activated[t]\n        history.append(round(active))\n    return history\n\nprint(simulate(k=0.0)[-1], 'active users, funnel only')\nprint(simulate(k=1.5)[-1], 'active users, with the loop')" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 200 },

    params: [
      { key: "k10",   label: "Viral k (×0.1)",        type: "int", min: 0, max: 30, default: 15 },
      { key: "cycle", label: "Cycle time (weeks)",    type: "int", min: 1, max: 8, default: 2 },
      { key: "act",   label: "Activation %",          type: "int", min: 10, max: 90, default: 40 },
      { key: "churn", label: "Weekly churn %",        type: "int", min: 0, max: 15, default: 4 },
      { key: "seed",  label: "Reroll noise",          type: "seed" }
    ],

    frames: function* (params, rng) {
      const k = params.k10 / 10;          // new signups per activated user
      const cyc = params.cycle;
      const act = params.act / 100;
      const churn = params.churn / 100;
      const W = 52;
      const base = 100;                   // linear channel: outreach, ads, waitlist
      const market = 60000;               // people you could ever reach
      const gain = k * act;               // loop gain per cycle: signups -> signups

      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };
      const noisy = (x) => Math.max(0, Math.round(x + Math.sqrt(Math.max(0, x)) * gauss()));

      const actHist = [];
      let reached = 0, active = 0, activeF = 0;
      let sig = 0, inv = 0, actNow = 0;
      const hA = [], hF = [];

      const snap = (t, label, phase) => ({
        label: label, phase: phase,
        state: { t: t, W: W, k: k, cyc: cyc, act: act, churn: churn, gain: gain,
          base: base, sig: sig, inv: inv, actNow: actNow,
          active: Math.round(active), activeF: Math.round(activeF),
          reached: reached, market: market, hA: hA.slice(), hF: hF.slice() }
      });

      yield snap(0,
        `${base} people/week arrive through a linear channel. ${(act * 100).toFixed(0)}% activate. Each activated user brings k=${k.toFixed(1)} new signups ${cyc} week(s) later, so the loop gain is k × activation = ${gain.toFixed(2)} per cycle` +
        (gain < 1 ? ` — below 1: it amplifies the channel ×${(1 / (1 - gain)).toFixed(2)} rather than growing alone.` : " — at or above 1: it grows on its own until the market saturates."),
        "start");

      for (let t = 1; t <= W; t++) {
        const room = Math.max(0, 1 - reached / market);
        inv = t > cyc ? noisy(k * actHist[t - 1 - cyc] * room) : 0;
        const baseNow = noisy(base * room);
        sig = baseNow + inv;
        reached += sig;
        actNow = Math.round(sig * act);
        actHist.push(actNow);
        active = active * (1 - churn) + actNow;
        activeF = activeF * (1 - churn) + base * act;   // same funnel, no loop (expected values)
        hA.push(Math.round(active)); hF.push(Math.round(activeF));

        const ratio = activeF > 0 ? active / activeF : 1;
        let label = `Week ${t}: ${sig} signups (${baseNow} from the channel + ${inv} from the loop), ${actNow} activated. Active: ${Math.round(active)} vs ${Math.round(activeF)} funnel-only (×${ratio.toFixed(2)}).`;
        if (t <= cyc) label += " The loop hasn't turned yet — invites arrive one cycle after activation.";
        else if (room < 0.5) label += ` ${(100 * reached / market).toFixed(0)}% of the reachable market is used up — growth saturates.`;
        else if (churn > 0 && active > 0 && Math.abs(active * churn - actNow) < actNow * 0.08) label += " Churn now roughly cancels new activations: the curve levels off.";
        else if (gain >= 1) label += " Gain ≥ 1: each cycle's batch is bigger than the last — exponential.";
        yield snap(t, label, "run");
      }

      const ratio = activeF > 0 ? active / activeF : 1;
      yield snap(W,
        `After a year: ${Math.round(active)} active users with the loop vs ${Math.round(activeF)} from the funnel alone (×${ratio.toFixed(2)}). ` +
        (gain < 1 ? `The gap keeps widening toward the steady-state ×${(1 / (1 - gain)).toFixed(2)}. Shorten the cycle or raise activation to make it bigger.`
          : "The loop drove most of the growth — until the reachable market ran out.") +
        (churn >= 0.08 ? " High churn caps both curves: retention first." : ""),
        "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 18;
      const leftW = Math.round(W * 0.42);

      // ---------- loop diagram ------------------------------------------------
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, 8, leftW - pad, H - 16, 8); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText(`The loop · week ${S.t}`, pad + 10, 25);

      const cx = pad + (leftW - pad) / 2 + 10, cy = H / 2 + 14;
      const R = Math.min((leftW - pad) / 2 - 50, H / 2 - 56);
      const nodes = [
        { a: -Math.PI / 2, name: "Signups", v: S.sig, col: C.viz1 },
        { a: Math.PI / 6, name: "Activated", v: S.actNow, col: C.viz2 },
        { a: 5 * Math.PI / 6, name: "Invites", v: S.inv, col: C.viz3 }
      ];
      const P = nodes.map(n => ({ x: cx + R * Math.cos(n.a), y: cy + R * Math.sin(n.a) }));

      // arcs between nodes
      const arrow = (x0, y0, x1, y1, col, w) => {
        const ang = Math.atan2(y1 - y0, x1 - x0);
        ctx.strokeStyle = col; ctx.lineWidth = w; ctx.fillStyle = col;
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x1 - 8 * Math.cos(ang - 0.4), y1 - 8 * Math.sin(ang - 0.4));
        ctx.lineTo(x1 - 8 * Math.cos(ang + 0.4), y1 - 8 * Math.sin(ang + 0.4));
        ctx.closePath(); ctx.fill();
      };
      const nr = 26;
      for (let i = 0; i < 3; i++) {
        const a = P[i], b = P[(i + 1) % 3];
        const d = Math.hypot(b.x - a.x, b.y - a.y);
        const ux = (b.x - a.x) / d, uy = (b.y - a.y) / d;
        arrow(a.x + ux * nr, a.y + uy * nr, b.x - ux * (nr + 2), b.y - uy * (nr + 2), C.axis, 1.6);
      }
      // labels on edges
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = "center";
      const mid = (i) => ({ x: (P[i].x + P[(i + 1) % 3].x) / 2, y: (P[i].y + P[(i + 1) % 3].y) / 2 });
      let m = mid(0); ctx.fillText(`× ${(S.act * 100).toFixed(0)}%`, m.x + 26, m.y);
      m = mid(1); ctx.fillText(`× k=${S.k.toFixed(1)}`, m.x, m.y + 16);
      m = mid(2); ctx.fillText(`${S.cyc} wk later`, m.x - 30, m.y);

      // inbound linear channel and churn
      arrow(P[0].x - 70, P[0].y - 2, P[0].x - nr - 2, P[0].y, C.viz4, 2);
      ctx.fillStyle = C.viz4; ctx.textAlign = "right";
      ctx.fillText(`${S.base}/wk`, P[0].x - 72, P[0].y + 3);
      arrow(P[1].x + nr, P[1].y + 6, P[1].x + nr + 30, P[1].y + 30, C.danger, 1.6);
      ctx.fillStyle = C.danger; ctx.textAlign = "left";
      ctx.fillText(`churn ${(S.churn * 100).toFixed(0)}%/wk`, Math.min(leftW - 80, P[1].x + nr - 10), Math.min(H - 20, P[1].y + 44));

      nodes.forEach((n, i) => {
        ctx.fillStyle = n.col;
        ctx.beginPath(); ctx.arc(P[i].x, P[i].y, nr, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.bg; ctx.font = `12px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(String(n.v), P[i].x, P[i].y + 4);
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
        ctx.fillText(n.name, P[i].x, P[i].y + (i === 0 ? -nr - 6 : nr + 14));
      });

      ctx.fillStyle = S.gain >= 1 ? C.warn : C.text2;
      ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "center";
      ctx.fillText(`gain ${S.gain.toFixed(2)}`, cx, cy + 4);
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText(`market reached ${(100 * S.reached / S.market).toFixed(0)}%`, pad + 10, H - 16);

      // ---------- active users chart ------------------------------------------
      const gx0 = leftW + 56, gx1 = W - pad, gy0 = 40, gy1 = H - 30;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(leftW + 8, 8, W - leftW - 8 - pad, H - 16, 8); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("Active users: loop vs funnel only", leftW + 18, 25);

      const maxY = Math.max(10, ...S.hA, ...S.hF) * 1.08;
      const xs = (w) => gx0 + (w / S.W) * (gx1 - gx0);
      const ys = (v) => gy1 - (v / maxY) * (gy1 - gy0);
      ctx.font = `10px ${env.font.mono}`;
      for (let i = 0; i <= 4; i++) {
        const v = maxY * i / 4, y = ys(v);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx0, y + .5); ctx.lineTo(gx1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right";
        ctx.fillText(v >= 10000 ? (v / 1000).toFixed(0) + "k" : v.toFixed(0), gx0 - 6, y + 3);
      }
      ctx.textAlign = "center";
      for (let w = 0; w <= S.W; w += 13) ctx.fillText(`wk ${w}`, xs(w), gy1 + 14);
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(gx0 + .5, gy0); ctx.lineTo(gx0 + .5, gy1); ctx.lineTo(gx1, gy1 + .5); ctx.stroke();

      const line = (arr, col, dash) => {
        if (arr.length < 1) return;
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.setLineDash(dash || []);
        ctx.beginPath();
        arr.forEach((v, i) => { const x = xs(i + 1), y = ys(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]);
      };
      line(S.hF, C.viz2, [6, 4]);
      line(S.hA, C.viz1);

      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz1; ctx.fillText(`■ with loop  ${S.active}`, gx0 + 8, gy0 + 10);
      ctx.fillStyle = C.viz2; ctx.fillText(`- - funnel only  ${S.activeF}`, gx0 + 8, gy0 + 24);
    }
  },

  drill: {
    cards: [
      { q: "Name the AARRR stages.", a: "Acquisition, Activation, Retention, Revenue, Referral.", tags: ["aarrr"] },
      { q: "Funnel vs growth loop — the key difference?", a: "A funnel is one-way: output grows only as fast as you pour in at the top (linear). A loop feeds its output back as new input, so it compounds.", tags: ["loops"] },
      { q: "Define the viral coefficient k.", a: "`k = invites sent per user × share of invites that become users`. The average number of new users each user brings.", tags: ["viral-coefficient"] },
      { q: "With k < 1, how much does a loop amplify each acquired user?", a: "By `1 / (1 − k)` in total. k = 0.4 → each paid-for user becomes ~1.67 users.", tags: ["viral-coefficient"] },
      { q: "Why does cycle time matter as much as k?", a: "Compounding happens once per cycle. The same k turning weekly grows far faster than turning monthly — and shortening the cycle (invite during onboarding) is often easier than raising k.", tags: ["cycle-time"] },
      { q: "How do you find the aha moment?", a: "Compare retained vs churned users and find the early action nearly all retained ones took; then redesign onboarding so everyone reaches it fast.", tags: ["activation"] },
      { q: "Why is activation usually the highest-leverage early fix?", a: "It multiplies everything downstream (retention, revenue, referral) for the same acquisition spend, and onboarding is fully in the team's control.", tags: ["activation"] },
      { q: "Theoma's three natural growth loops?", a: "Teammate invites into a workspace; agent output shared outside (published content, reports, campaigns) carrying Theoma's name; the Marketer running Theoma's own content and AI visibility.", tags: ["theoma"] }
    ],
    sixtySecond: [
      "Explain the viral coefficient and why a loop with k below 1 is still valuable.",
      "Explain which growth loops Theoma has and how you would make them turn faster."
    ]
  }
};
