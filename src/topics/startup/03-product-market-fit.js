export default {
  id: "product-market-fit",
  track: "startup",
  title: "Product-Market Fit & Retention",
  difficulty: 2,
  minutes: 16,
  tags: ["product-market-fit", "retention", "cohorts", "churn", "sean-ellis-test"],

  explainer: [
    { type: "p", text: "**Product-market fit** (everyone shortens it to **PMF**) is the point where a specific group of customers wants your product badly enough that they keep using it, pay for it, and tell others about it — without you pushing. Marc Andreessen, who popularised the phrase, put it as 'being in a good market with a product that can satisfy that market.' Before PMF, almost everything a startup does is guesswork: marketing spend leaks, sales calls go nowhere, and growth needs constant founder effort. After PMF, the same effort starts compounding. That is why investors ask about it first and why founders obsess over it — but it is also why the phrase gets abused. Saying 'we have PMF' proves nothing. The honest evidence is in the numbers, and the single most trustworthy number is **retention**: do the people who start using the product still use it months later?" },

    { type: "h3", text: "Retention, measured by cohort" },
    { type: "p", text: "A **cohort** is a group of customers who started in the same period — say, every team that signed up in March. You follow each cohort separately over time and ask: of the teams that started in March, what percentage were still active one month later? Two months later? Six? Plotting that percentage against **months since signup** (not calendar months) gives a **retention curve**. Measuring by cohort matters because a total-users chart hides churn: if you sign up 100 new teams a month and lose 90 old ones, the total still rises and looks like growth, while the product is quietly failing everybody who tries it." },
    { type: "p", text: "Every retention curve drops at first — some people sign up out of curiosity and leave in week one, and that is normal. The question is what happens *after* that drop. **If the curve keeps falling toward zero, you do not have product-market fit**, no matter how fast signups grow: every customer you acquire eventually leaves, so you are filling a leaking bucket. **If the curve flattens** — say it drops to 35% by month three and then sits at 33%, 32%, 32% — you have found a group of people for whom the product has become a habit or a necessity. That flat part, sometimes called the **retention floor** or **terminal retention**, is the clearest PMF signal there is. Its height tells you how big the 'core' is; its flatness tells you the value is real." },
    { type: "callout", tone: "tip", text: "Compare cohorts against each other, not just one curve. If the March cohort flattens at 20% and the July cohort flattens at 32%, the product is getting better for new users — that improvement is itself strong evidence you are moving toward fit. Newer cohorts flattening higher is the pattern investors most want to see." },

    { type: "h3", text: "The Sean Ellis test: asking directly" },
    { type: "p", text: "Retention needs months of data. A faster signal is a one-question survey invented by growth marketer Sean Ellis. Ask active users: **'How would you feel if you could no longer use this product?'** with three answers: *very disappointed*, *somewhat disappointed*, *not disappointed*. His benchmark, taken from comparing hundreds of startups: if **40% or more** answer *very disappointed*, the product tends to have fit and growth becomes much easier; well below that, it usually does not. Only survey people who have actually used the product recently (otherwise you measure curiosity), and aim for at least 30–40 responses so one opinion does not swing the result." },
    { type: "p", text: "The survey is also a steering tool. Look at only the *very disappointed* group and ask them what the main benefit is and what kind of person they think would love it. Their answers describe your real customer, often more sharply than your own pitch. Then look at the *somewhat disappointed* group: the ones who share the core benefit but have one blocker are the cheapest people to convert, because fixing their blocker moves them up. Ignore the *not disappointed* group's feature requests — building for people who would not miss you dilutes the product." },

    { type: "h3", text: "Leading indicators before you have months of data" },
    { type: "list", items: [
      "**Activation then repeat use.** Of new teams, what fraction reach the 'aha moment' (the first time the product clearly delivers its value), and of those, what fraction come back the next week? Repeat use within the first two weeks predicts long-term retention far better than signups do.",
      "**Pull, not push.** Customers asking when the next feature ships, chasing you when something breaks, or introducing you to others unprompted. When you stop using the product with a design partner and they complain, that complaint is data.",
      "**Willingness to pay.** A team that pays — even a small amount — is a much stronger signal than one that 'loves it' for free. Payment turns politeness into commitment.",
      "**Organic share of signups.** The fraction of new users who came from word of mouth rather than your outreach. Rising organic share means existing users are doing your marketing.",
      "**Usage depth.** Not just 'logged in', but did the core action happen — for a workspace product, messages sent, tasks completed, output used."
    ]},
    { type: "callout", tone: "pitfall", text: "The most common self-deception: counting **vanity metrics** (numbers that only go up and feel good but do not prove value) — total signups, waitlist size, page views, 'registered users'. A 5,000-person waitlist with 8% week-four retention is worse news than 40 teams with 45% week-four retention. Pick a retention definition that requires the core value to happen, and report only that." },

    { type: "h3", text: "PMF is for a segment, not for everyone" },
    { type: "p", text: "You rarely find fit with 'all startups' or 'all marketing teams'. You find it with a narrow group — for example, seed-stage B2B software companies with no marketing hire — and then widen. When retention looks mediocre overall, **split cohorts by segment** (company size, role, use case, how they found you). Very often one segment retains at 50% while the others sit at 10%, and the average of 18% hides a real business. The right move is then to narrow: focus messaging, onboarding and roadmap on the segment that sticks." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "p", text: "First, define **retained** in a way that can only be true if the product is working. For an agentic workspace, a team that opens the app is not enough. A strong definition is a **weekly active team**: a workspace where, in a given week, at least two people sent messages *and* at least one piece of agent output was **accepted** — a Marketer draft approved, an Outbound campaign launched, a Sales playbook used, a Support answer sent. 'Accepted output' is the right core action because Theoma's promise is that agents are useful teammates; if their work is never used, the team is visiting, not retained." },
    { type: "list", items: [
      "**This month:** instrument the event 'agent output accepted' (an approve, launch, publish or send click) per workspace in PostHog, and build a weekly cohort table of weekly active teams by signup week.",
      "**Run the Sean Ellis survey** on every team active in the last two weeks once you have 30+ of them; read the *very disappointed* answers to learn which agent (Marketer, Sales, Outbound…) people would actually miss.",
      "**Split by primary domain.** Since marketing and sales are the chosen focus, compare retention of teams that mostly use the Marketer vs mostly Sales/Outbound. If one flattens and the other does not, that is the wedge to double down on.",
      "**Watch the waitlist honestly.** Track what fraction of waitlist invites become weekly active teams by week four — that conversion, not the waitlist count, is the number to share with investors."
    ]}
  ],

  glossary: [
    { term: "Product-market fit (PMF)", plain: "The point where a specific group of customers wants your product so much that they keep using it, pay for it and recommend it without being pushed." },
    { term: "Retention", plain: "The share of customers who are still actively using the product some time after they started." },
    { term: "Churn", plain: "The opposite of retention: the share of customers who stop using or paying for the product in a period. Monthly churn of 5% means 5 in 100 customers leave each month." },
    { term: "Cohort", plain: "A group of customers who started in the same period, such as everyone who signed up in March. Tracking cohorts separately stops new signups from hiding old customers leaving." },
    { term: "Retention curve", plain: "A chart of a cohort's retention against months since signup. A curve that flattens means a core group stays; a curve that keeps falling to zero means everyone eventually leaves." },
    { term: "Retention floor", plain: "The level at which a retention curve flattens out — the share of customers who stay for the long run. Also called terminal retention." },
    { term: "Sean Ellis test", plain: "A one-question survey: 'How would you feel if you could no longer use this product?' If 40% or more say 'very disappointed', the product likely has fit." },
    { term: "Activation", plain: "The moment a new user first gets the product's real value (the 'aha moment'), as opposed to just signing up." },
    { term: "Vanity metric", plain: "A number that only goes up and feels good but does not show the product is valuable — total signups or page views, for example." },
    { term: "Weekly active team", plain: "In this lesson's Theoma definition: a workspace where, in one week, at least two people were active and at least one piece of agent work was accepted and used." },
    { term: "Design partner", plain: "An early customer who uses the product before it is finished and gives regular feedback, usually in exchange for a discount or influence on the roadmap." },
    { term: "Segment", plain: "A slice of possible customers who share something — company size, role, industry or use case." }
  ],

  complexity: {
    rows: [
      { operation: "Sean Ellis 'very disappointed' share", time: "25–40%", space: "≥ 40%", note: "survey 30+ recently active users" },
      { operation: "Retention curve shape", time: "flattens by month 3–6", space: "flattens by month 2, newer cohorts higher", note: "a curve still sloping down at month 6 is not fit" },
      { operation: "SMB B2B SaaS monthly logo churn", time: "3–5%", space: "< 2%", note: "logo = a customer account, regardless of its size" },
      { operation: "Month-12 logo retention (SMB B2B)", time: "60–70%", space: "≥ 80%", note: "mid-market and enterprise run higher" },
      { operation: "Week-4 retention of activated teams", time: "30–40%", space: "≥ 50%", note: "early proxy while monthly data is thin" }
    ]
  },

  interview: {
    whyAsked: "Theoma is pre-revenue with a waitlist, which is exactly when founders are most tempted to read signups as traction. Retention by cohort — measured on accepted agent work, not app opens — is the evidence that will decide whether to scale outreach, narrow the segment, or rework the product, and it is the first thing a seed investor will ask to see.",
    followUps: [
      { q: "Do you have product-market fit?", a: "Answer with a curve, not an adjective: 'Our weekly-active-team retention for teams that activated flattens at about X% from week six, and newer cohorts flatten higher; in our last survey Y% said they'd be very disappointed without it.' If you do not have that yet, say what you are measuring and the threshold you will call fit — investors respect a precise 'not yet' far more than a vague 'yes'." },
      { q: "Signups are growing 20% a month — isn't that enough?", a: "Not on its own. Growth in signups with a curve falling to zero means every customer eventually leaves; you are paying to refill a leaking bucket, and growth stops when acquisition does. Show the retention curve for each cohort; if it flattens, signup growth compounds into a real base." },
      { q: "How do you define an active user for Theoma?", a: "A workspace where at least two people were active in the week and at least one piece of agent output was accepted — approved, launched, published or sent. It requires the core value to happen, so it cannot be inflated by people just opening the app." },
      { q: "Your retention is mediocre. What would you do?", a: "Split cohorts by segment and by primary agent used. Usually one slice retains well and the average hides it. Narrow messaging and onboarding to that slice, interview its users about why they stay, and fix the top blocker named by the 'somewhat disappointed' group." },
      { q: "Why survey only active users in the Sean Ellis test?", a: "People who tried the product once and left never formed an opinion about its value — including them measures curiosity and drags the number down meaninglessly. The question is whether the people who actually use it would miss it." },
      { q: "What is the difference between logo churn and revenue churn?", a: "Logo churn counts customers lost; revenue churn counts dollars lost, and can be offset by remaining customers paying more (expansion). Early on, logo retention is the cleaner PMF signal because prices and plans are still moving." }
    ]
  },

  code: [
    { lang: "python", label: "Cohort retention table", code: "from collections import defaultdict\n\n# events: (team_id, signup_month, active_month) — one row per month a team was 'weekly active'\ndef retention_table(events):\n    start = {}\n    active = defaultdict(set)              # (cohort, age) -> set of teams\n    for team, signup, month in events:\n        start[team] = signup\n        active[(signup, month - signup)].add(team)\n    size = defaultdict(int)\n    for team, signup in start.items():\n        size[signup] += 1\n    table = {}\n    for (cohort, age), teams in active.items():\n        table.setdefault(cohort, {})[age] = len(teams) / size[cohort]\n    return table                            # table[cohort][age] = retention 0..1\n\ndef flattens(curve, last=3, tol=0.015):\n    \"\"\"True if the last `last` months each drop by less than tol (1.5 points).\"\"\"\n    tail = [curve[a] for a in sorted(curve)][-last - 1:]\n    return len(tail) > last and all(a - b < tol for a, b in zip(tail, tail[1:]))" },
    { lang: "python", label: "Sean Ellis score", code: "def sean_ellis(answers):\n    \"\"\"answers: list of 'very' | 'somewhat' | 'not' from recently active users.\"\"\"\n    if len(answers) < 30:\n        print(f'warning: only {len(answers)} responses; result is noisy')\n    share = answers.count('very') / len(answers)\n    return share, ('likely fit' if share >= 0.40 else 'not yet')\n\nprint(sean_ellis(['very'] * 17 + ['somewhat'] * 15 + ['not'] * 8))  # (0.425, 'likely fit')" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 200 },

    params: [
      { key: "fit",     label: "Core fit (% of teams)",     type: "int", min: 0, max: 60, default: 30 },
      { key: "churn",   label: "Core monthly churn %",      type: "int", min: 1, max: 15, default: 3 },
      { key: "improve", label: "Product improves per cohort", type: "bool", default: true },
      { key: "cohorts", label: "Cohorts",                   type: "int", min: 3, max: 8, default: 6 },
      { key: "seed",    label: "New teams",                 type: "seed" }
    ],

    frames: function* (params, rng) {
      const K = params.cohorts;
      const M = 12;                       // calendar months simulated
      const baseFit = params.fit / 100;
      const coreChurn = params.churn / 100;
      const tourChurn = 0.45;             // non-fit teams leave fast

      // Each cohort: a set of teams, each either "core" (needs the product) or a "tourist".
      const cohorts = [];
      for (let k = 0; k < K; k++) {
        const size = 40 + Math.floor(rng() * 40);
        const fit = Math.min(0.9, baseFit * (params.improve ? 1 + 0.12 * k : 1));
        const teams = [];
        for (let i = 0; i < size; i++) teams.push({ core: rng() < fit, alive: true });
        cohorts.push({ start: k, size: size, fit: fit, teams: teams, curve: [1] });
      }

      const snap = (t, label, phase) => ({
        label: label, phase: phase,
        state: {
          t: t, M: M, K: K,
          curves: cohorts.map(c => c.curve.slice()),
          sizes: cohorts.map(c => c.size),
          starts: cohorts.map(c => c.start)
        }
      });

      const verdict = (curve) => {
        if (curve.length < 5) return null;
        const n = curve.length;
        const drop = (curve[n - 4] - curve[n - 1]) / 3;
        return { drop: drop, flat: drop < 0.015 && curve[n - 1] > 0.05, level: curve[n - 1] };
      };

      yield snap(0, `Month 0: cohort 1 signs up (${cohorts[0].size} teams). Each month a new cohort joins. We plot each cohort against months SINCE signup, so their curves can be compared.`, "start");

      for (let t = 1; t < M; t++) {
        for (const c of cohorts) {
          const age = t - c.start;
          if (age < 1) continue;
          let alive = 0;
          for (const tm of c.teams) {
            if (!tm.alive) continue;
            if (rng() < (tm.core ? coreChurn : tourChurn)) tm.alive = false;
            else alive++;
          }
          c.curve.push(alive / c.size);
        }
        const oldest = cohorts[0].curve;
        const v = verdict(oldest);
        const joined = t < K ? ` Cohort ${t + 1} joins (${cohorts[t].size} teams).` : "";
        let label;
        if (t <= 2) {
          label = `Month ${t}: every curve drops hard at first — curious 'tourist' teams leave in the first months.${joined} That early drop is normal; watch what happens after.`;
        } else if (!v) {
          label = `Month ${t}: cohort 1 is at ${(oldest[oldest.length - 1] * 100).toFixed(0)}% retained.${joined} Too early to judge the shape.`;
        } else if (v.flat) {
          label = `Month ${t}: cohort 1 has lost only ${(v.drop * 100).toFixed(1)} points/month for 3 months — the curve is FLATTENING at ~${(v.level * 100).toFixed(0)}%. A core group stays: that is the PMF signal.${joined}`;
        } else {
          label = `Month ${t}: cohort 1 still loses ${(v.drop * 100).toFixed(1)} points/month (now ${(v.level * 100).toFixed(0)}%) — NOT flattening yet. If it keeps sloping to zero, every team eventually leaves.${joined}`;
        }
        yield snap(t, label, "run");
      }

      const v = verdict(cohorts[0].curve);
      const first = cohorts[0].curve, last = cohorts[K - 1].curve;
      const cmpAge = Math.min(first.length, last.length) - 1;
      let tail = "";
      if (cmpAge >= 2) {
        const a = first[cmpAge] * 100, b = last[cmpAge] * 100;
        tail = ` At month ${cmpAge}, the newest cohort is at ${b.toFixed(0)}% vs ${a.toFixed(0)}% for the first` +
          (b > a + 3 ? " — newer cohorts retain better: the product is improving." : b < a - 3 ? " — newer cohorts retain WORSE: check what changed (segment? onboarding?)." : " — about the same.");
      }
      yield snap(M - 1,
        (v && v.flat
          ? `Verdict: cohort 1 flattened at ~${(v.level * 100).toFixed(0)}% — evidence of product-market fit for the teams that stay.`
          : `Verdict: cohort 1 is still falling (${(v ? v.drop * 100 : 0).toFixed(1)} pts/month) — no retention floor, so no PMF yet. Raise 'Core fit' or lower 'Core churn' to see the difference.`) + tail,
        "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pal = [C.viz1, C.viz2, C.viz3, C.viz4, C.viz5, C.viz6, C.viz7, C.viz8];
      const pad = 18;
      const leftW = Math.round(W * 0.56);

      // ---------- retention curves -------------------------------------------
      const x0 = pad + 34, x1 = leftW - 8, y0 = 34, y1 = H - 34;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, 8, leftW - pad, H - 16, 8); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("Retention by cohort (months since signup)", pad + 10, 25);

      const xs = (a) => x0 + (a / (S.M - 1)) * (x1 - x0);
      const ys = (r) => y1 - r * (y1 - y0);
      ctx.font = `10px ${env.font.mono}`;
      for (let i = 0; i <= 4; i++) {
        const y = ys(i / 4);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x0, y + .5); ctx.lineTo(x1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right";
        ctx.fillText(`${i * 25}%`, x0 - 5, y + 3);
      }
      ctx.textAlign = "center";
      for (let a = 0; a < S.M; a += 2) ctx.fillText(String(a), xs(a), y1 + 14);
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(x0 + .5, y0); ctx.lineTo(x0 + .5, y1); ctx.lineTo(x1, y1 + .5); ctx.stroke();

      for (let k = S.K - 1; k >= 0; k--) {
        const c = S.curves[k];
        if (c.length < 1 || S.t < S.starts[k]) continue;
        ctx.strokeStyle = pal[k % 8]; ctx.lineWidth = k === 0 ? 2.6 : 1.6;
        ctx.globalAlpha = k === 0 ? 1 : 0.85;
        ctx.beginPath();
        c.forEach((r, a) => { if (a === 0) ctx.moveTo(xs(a), ys(r)); else ctx.lineTo(xs(a), ys(r)); });
        ctx.stroke();
        const la = c.length - 1;
        ctx.fillStyle = pal[k % 8];
        ctx.beginPath(); ctx.arc(xs(la), ys(c[la]), 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // ---------- cohort table (heatmap) -------------------------------------
      const tx0 = leftW + 10, tx1 = W - pad, ty0 = 34;
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("Cohort table", tx0, 25);
      const labW = 54;
      const cols = S.M;
      const cw = (tx1 - tx0 - labW) / cols;
      const rh = Math.min(26, (H - ty0 - 40) / S.K);
      ctx.font = `9px ${env.font.mono}`;
      ctx.fillStyle = C.muted; ctx.textAlign = "center";
      for (let a = 0; a < cols; a += 2) ctx.fillText(`m${a}`, tx0 + labW + cw * (a + 0.5), ty0 + 6);
      for (let k = 0; k < S.K; k++) {
        const y = ty0 + 12 + k * rh;
        ctx.textAlign = "left"; ctx.fillStyle = pal[k % 8];
        ctx.fillText(`C${k + 1} n=${S.sizes[k]}`, tx0, y + rh / 2 + 3);
        const c = S.curves[k];
        for (let a = 0; a < cols; a++) {
          const x = tx0 + labW + a * cw;
          if (a < c.length && S.t >= S.starts[k]) {
            ctx.fillStyle = C.viz1; ctx.globalAlpha = 0.12 + 0.88 * c[a];
            ctx.fillRect(x + 1, y + 1, cw - 2, rh - 2);
            ctx.globalAlpha = 1;
            if (cw > 20) {
              ctx.fillStyle = c[a] > 0.55 ? C.bg : C.text; ctx.textAlign = "center";
              ctx.fillText((c[a] * 100).toFixed(0), x + cw / 2, y + rh / 2 + 3);
            }
          } else {
            ctx.strokeStyle = C.border; ctx.lineWidth = 1;
            ctx.strokeRect(x + 1.5, y + 1.5, cw - 3, rh - 3);
          }
        }
      }
      ctx.textAlign = "left"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
      const yb = ty0 + 12 + S.K * rh + 16;
      ctx.fillText(`calendar month ${S.t} · darker = more retained`, tx0, Math.min(H - 12, yb));
    }
  },

  drill: {
    cards: [
      { q: "What is the single most trustworthy evidence of product-market fit?", a: "A cohort retention curve that **flattens** — after the early drop, a stable share of customers keeps using the product month after month. A curve sloping to zero means no fit, however fast signups grow.", tags: ["retention"] },
      { q: "Why measure retention by cohort instead of total active users?", a: "New signups can hide old customers leaving: 100 joining and 90 leaving still looks like growth. Cohorts follow each signup group separately, so churn is visible.", tags: ["cohorts"] },
      { q: "State the Sean Ellis test and its threshold.", a: "Ask recently active users 'How would you feel if you could no longer use this product?' — very / somewhat / not disappointed. **≥ 40% 'very disappointed'** suggests fit. Survey 30+ active users.", tags: ["sean-ellis-test"] },
      { q: "What should newer cohorts look like if the product is improving?", a: "Their curves flatten **higher** than older cohorts' at the same age.", tags: ["cohorts"] },
      { q: "Name four leading indicators of PMF before months of retention data exist.", a: "Activation followed by repeat use in weeks 1–2; customer pull (asking for features, complaining when it breaks); willingness to pay; rising organic share of signups; depth of core-action usage.", tags: ["leading-indicators"] },
      { q: "A good Theoma definition of a retained (weekly active) team?", a: "A workspace where in a week at least two people were active **and** at least one piece of agent output was accepted — approved, launched, published or sent.", tags: ["theoma"] },
      { q: "Overall retention is mediocre. First analytical move?", a: "Split cohorts by segment (size, role, use case, acquisition channel, main agent used). One slice often retains well and the average hides it; narrow toward it.", tags: ["segments"] },
      { q: "What is a vanity metric? Give two examples.", a: "A number that only rises and feels good but does not prove value — total signups, waitlist size, page views, registered users.", tags: ["metrics"] }
    ],
    sixtySecond: [
      "Explain how you would prove (or disprove) product-market fit for Theoma using cohort retention and the Sean Ellis test.",
      "Explain why a flattening retention curve matters more than signup growth."
    ]
  }
};
