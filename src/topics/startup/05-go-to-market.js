export default {
  id: "go-to-market",
  track: "startup",
  title: "Go-to-Market: Founder-Led to PLG",
  difficulty: 2,
  minutes: 17,
  tags: ["go-to-market", "founder-led-sales", "product-led-growth", "sales-cycle", "acv", "design-partners"],

  explainer: [
    { type: "p", text: "**Go-to-market** (shortened to **GTM**) is the plan for how a product gets from 'it works' to 'customers are paying for it': who you sell to, how they first hear about you, how they try it, who convinces them, and how money changes hands. Engineers often assume a good product sells itself. It almost never does — and the way you sell has to match what you are selling. A $20-a-month tool and a $100,000-a-year platform cannot be sold the same way, because the cost of a salesperson's time has to fit inside what each customer pays. This lesson covers the main **motions** (repeatable ways of winning customers), the single number that decides which one fits, and the path from the first ten customers to a scalable engine." },

    { type: "h3", text: "The number that decides the motion: ACV" },
    { type: "p", text: "**ACV**, annual contract value, is how much one customer pays you per year. It matters because every motion has a **cost to acquire a customer** (CAC — all the sales and marketing spend divided by the number of customers it won), and the motion only works when ACV comfortably covers it. A salesperson costs roughly $150k–250k a year all-in and can close perhaps 20–40 mid-sized deals a year; if each deal is worth $3k, the salesperson costs far more than they bring in. So, roughly:" },
    { type: "list", items: [
      "**Under ~$5k ACV → product-led or self-serve.** People find the product, sign up, get value and pay by card without talking to anyone. Marketing and the product itself do the selling.",
      "**~$5k–$50k ACV → inside sales or a hybrid.** Self-serve sign-up, but a salesperson helps larger teams over calls and video demos. Sales cycles of weeks to a couple of months.",
      "**Over ~$50k ACV → sales-led (enterprise).** Outbound prospecting, multiple meetings, security reviews, procurement, legal, pilots. Cycles of 3–12 months, but each win pays for the effort."
    ]},
    { type: "callout", tone: "tip", text: "There is a dead zone between roughly $1k and $10k ACV: too expensive for people to buy on impulse without help, too cheap to pay for a salesperson. Products stuck there need either a very low-touch sales process or a reason for customers to grow into a bigger plan." },

    { type: "h3", text: "The four motions" },
    { type: "list", items: [
      "**Founder-led sales.** The founders themselves find, pitch and close the first customers. It is the only motion that works before product-market fit, because each conversation is also research: you hear objections first-hand and change the product the same week. Its limit is founder time — maybe 5–15 serious conversations a week alongside building. Nearly every B2B startup should do this until roughly 10–20 paying customers, and before hiring a salesperson the founders should be able to write down the sales process that works.",
      "**Sales-led.** A sales team runs a pipeline: **SDRs** (sales development reps) find and qualify prospects, **AEs** (account executives) run demos and close. Predictable and able to win large contracts, but expensive, slow, and only worth it at high ACV.",
      "**Product-led growth (PLG).** The product is the main way customers are acquired: a free plan or trial, fast time to value, and in-product prompts to upgrade or invite colleagues. Slack, Notion, Figma and Calendly grew this way. Cheap per customer and fast, but conversion from free to paid is usually low (2–5% for freemium), so it needs large top-of-funnel volume and a product that delivers value without hand-holding.",
      "**Community- or content-led.** You build an audience — newsletter, open-source project, social posts, a community — and customers come from trust built in public. Slow to start, very cheap later, and it compounds, but it does not replace a way to convert attention into paid accounts."
    ]},
    { type: "p", text: "Real companies blend them. A common modern path is **PLG with sales on top** (also called product-led sales): many small teams self-serve, and the product flags accounts that look big (lots of seats, a well-known company domain) for a salesperson to call." },

    { type: "h3", text: "The pipeline and its stages" },
    { type: "p", text: "Whatever the motion, sales flows through stages, and you measure two things at each: the **conversion rate** to the next stage and the **time** spent there. A typical B2B pipeline is lead → qualified conversation → demo or trial → proposal → closed won (or lost). Multiply the conversion rates to see how many leads you need for one customer; add up the times to get the **sales cycle** (days from first contact to signed deal). Longer cycles mean cash comes later and each salesperson can handle fewer deals at once — which is why cycle length grows with ACV and why low-ACV products cannot afford long ones." },
    { type: "callout", tone: "pitfall", text: "Hiring a salesperson to 'do sales so the founders can build' before the founders have closed customers themselves almost always fails. A salesperson needs a repeatable playbook — who buys, why, the objections and the answers. Before ~10–20 founder-closed customers, that playbook does not exist yet, and the hire burns money finding it out." },

    { type: "h3", text: "Design partners and the waitlist" },
    { type: "p", text: "A **design partner** is an early customer who agrees to use an unfinished product and give regular, honest feedback — weekly calls, a shared channel — in exchange for influence on the roadmap and usually a discount. Good design partners match your target customer exactly, feel the problem badly, and have one person who will champion the product inside the company. Aim for 3–8. Ask them to pay something, even a small amount, early: payment separates real need from politeness." },
    { type: "p", text: "A **waitlist** is people who asked for access before the product opens. It is a lead source, not traction. Treat it as the top of a funnel: invite people in small batches, onboard each batch carefully (a call or a guided setup), measure how many reach activation, fix what blocked the rest, then invite the next batch. Batches let you learn while the list is still large; inviting everybody at once with a broken onboarding wastes your best leads." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "p", text: "Theoma sits in an interesting spot: a team workspace (which spreads like PLG — one person invites colleagues) whose first agents do marketing and sales (work that a company would otherwise pay an agency or a hire thousands a month for, which supports a higher price than a chat tool). That suggests **founder-led sales to design partners now, then PLG with sales help** once onboarding works without the founders in the room." },
    { type: "list", items: [
      "**Now:** sign 3–8 design partners from the exact segment you want (for example, seed-stage B2B software companies with no marketing hire). The founders run every onboarding personally and note each objection and where the Marketer's output was not used.",
      "**Waitlist:** invite in weekly batches of 10–20 workspaces, measure invite → activated (first agent output accepted) → weekly active by week four, and only grow batch size when that conversion improves.",
      "**Use your own product:** Theoma's Outbound and Sales agents can build Theoma's own prospect lists and playbooks. If they are not good enough to sell Theoma, that is the most important product feedback you will get.",
      "**Decide pricing shape with the motion in mind:** if the price lands under ~$5k a year per workspace, the onboarding must work self-serve; if it lands higher, plan for a sales call in the loop."
    ]}
  ],

  glossary: [
    { term: "Go-to-market (GTM)", plain: "The plan for how a product reaches paying customers: who you target, how they hear about you, how they try it and how they buy." },
    { term: "Motion", plain: "A repeatable way of winning customers — for example founder-led sales, a sales team, or self-serve sign-up through the product." },
    { term: "ACV (annual contract value)", plain: "How much one customer pays you per year, on average." },
    { term: "CAC (customer acquisition cost)", plain: "All sales and marketing spend in a period divided by the number of new customers won in that period." },
    { term: "Founder-led sales", plain: "The founders personally find, pitch and close customers, before any salesperson is hired." },
    { term: "Product-led growth (PLG)", plain: "Using the product itself — a free plan or trial and in-product invites — as the main way to acquire and convert customers." },
    { term: "SDR / AE", plain: "Sales roles. An SDR (sales development representative) finds and qualifies prospects; an AE (account executive) runs demos and closes deals." },
    { term: "Pipeline", plain: "All the potential deals currently in progress, organised by stage from first contact to signed contract." },
    { term: "Sales cycle", plain: "How long it takes from first contact with a prospect to a signed deal." },
    { term: "Lead", plain: "A person or company that might become a customer — not yet qualified or contacted in depth." },
    { term: "Freemium", plain: "A pricing model with a permanently free plan and paid upgrades. Usually only 2–5% of free users ever pay." },
    { term: "Design partner", plain: "An early customer who uses an unfinished product and gives regular feedback in exchange for roadmap influence and usually a discount." },
    { term: "Waitlist", plain: "People who asked for access before the product opened. A source of leads, not proof of demand." },
    { term: "Activation", plain: "The point where a new customer first gets the product's real value — for Theoma, the first agent output a team actually uses." }
  ],

  complexity: {
    rows: [
      { operation: "Founder-closed customers before first sales hire", time: "10–20", space: "20+ with a written playbook", note: "the playbook must exist before the hire" },
      { operation: "Sales cycle at ~$10k–25k ACV", time: "30–60 days", space: "< 30 days", note: "under $5k: days; enterprise: 3–12 months" },
      { operation: "Win rate on qualified opportunities", time: "20–30%", space: "≥ 30%", note: "qualified = real need, budget and a decision-maker" },
      { operation: "Freemium free → paid conversion", time: "2–5%", space: "> 5%", note: "opt-in free trials convert higher: 15–25%" },
      { operation: "Design partners", time: "3–5", space: "5–8, at least some paying", note: "all from the exact target segment" }
    ]
  },

  interview: {
    whyAsked: "Theoma is a team workspace that could spread product-led, selling agent work that replaces costly marketing and sales effort — so both motions are plausible, and picking the wrong one wastes the runway. The founders must close the first design partners themselves, and the waitlist must be run as a measured, batched funnel rather than a vanity number.",
    followUps: [
      { q: "What's your go-to-market?", a: "Name the motion for each stage: 'Founder-led sales to design partners in [segment] now; batched waitlist invites with hands-on onboarding; once activation works without us, self-serve sign-up with in-product invites, plus a sales touch for larger teams.' Then give the numbers you are measuring at each step." },
      { q: "Why not hire a salesperson now so the founders can focus on product?", a: "There is no repeatable playbook yet. Founder conversations are also product research. A sales hire before ~10–20 founder-closed customers usually burns months discovering what the founders should have learned first-hand." },
      { q: "How does ACV determine the motion?", a: "The motion's cost per customer must fit inside what a customer pays. A salesperson costs ~$150k+ a year and closes a few dozen deals; that only pays off when each deal is worth well over ~$5k a year. Below that, self-serve and marketing must do the selling." },
      { q: "You have a big waitlist — why not open the doors to everyone?", a: "Because onboarding is unproven, and each waitlist lead is warm only once. Invite in batches, measure invite → activated → retained, fix the main blocker, then widen. A bad first experience wastes your best leads." },
      { q: "What makes a good design partner?", a: "Exactly your target customer, feels the pain badly, has an internal champion with time for weekly feedback, and is willing to pay something. Avoid friends doing you a favour — their feedback is too polite." },
      { q: "What is product-led sales?", a: "A hybrid: most customers self-serve, and the product's usage data (seats added, company size, heavy use) flags accounts for a salesperson to help convert to a larger plan." }
    ]
  },

  code: [
    { lang: "python", label: "Leads needed from a funnel", code: "def leads_needed(target_customers, stage_rates):\n    \"\"\"stage_rates: conversion rate of each stage, e.g. lead->call, call->demo, demo->won.\"\"\"\n    rate = 1.0\n    for r in stage_rates:\n        rate *= r\n    return target_customers / rate, rate\n\n# founder-led: 60% of leads take a call, 50% get a demo, 40% close\nn, rate = leads_needed(10, [0.60, 0.50, 0.40])\nprint(f'{rate:.0%} end-to-end -> {n:.0f} leads for 10 customers')   # 12% -> 83 leads" },
    { lang: "python", label: "Does a salesperson pay for themselves?", code: "def salesperson_payback(acv, deals_per_year, cost_per_year=180_000, gross_margin=0.75):\n    \"\"\"Gross profit a rep's deals bring in during their first year vs what the rep costs.\"\"\"\n    profit = acv * deals_per_year * gross_margin\n    return profit / cost_per_year       # > 1 means the rep covers their own cost in year one\n\nfor acv in (3_000, 12_000, 40_000):\n    print(acv, round(salesperson_payback(acv, deals_per_year=30), 2))\n# 3000 0.38  -> self-serve territory\n# 12000 1.5\n# 40000 5.0" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 200 },

    params: [
      { key: "motion", label: "Motion", type: "enum", options: ["founder-led", "sales-led", "product-led"], default: "founder-led" },
      { key: "acv",    label: "ACV ($k / year)", type: "int", min: 1, max: 100, default: 12 },
      { key: "weeks",  label: "Weeks", type: "int", min: 12, max: 52, default: 26 },
      { key: "seed",   label: "New market", type: "seed" }
    ],

    frames: function* (params, rng) {
      const motion = params.motion;
      const acv = params.acv;           // $k per year
      const W = params.weeks;

      // Motion model. rates = probability of advancing each stage; dur = mean weeks per stage.
      // Bigger contracts take longer and need a human: self-serve conversion falls with ACV.
      const selfServe = Math.max(0.04, Math.min(1, 1 - acv / 45));
      const M = {
        "founder-led": { leads: 7, cost: 0, rates: [0.6, 0.5, 0.45],
          dur: [1, 1 + acv / 30, 1 + acv / 25], stages: ["Leads", "Calls", "Demos", "Won"] },
        "sales-led": { leads: 22, cost: 6, rates: [0.35, 0.45, 0.32],
          dur: [1.5, 1.5 + acv / 20, 2 + acv / 12], stages: ["Leads", "Qualified", "Proposals", "Won"] },
        "product-led": { leads: 140, cost: 1.5, rates: [0.35, 0.5, 0.11 * selfServe],
          dur: [0.5, 1, 1.5 + acv / 40], stages: ["Signups", "Activated", "Trialing", "Paid"] }
      }[motion];

      const deals = [];      // { stage, wait, started }
      const counts = [0, 0, 0, 0];       // cumulative entries into each stage
      let won = 0, lost = 0, arr = 0, cost = 0, cycleSum = 0;
      const hW = [], hArr = [], hCost = [];

      const sampleWait = (mean) => Math.max(0, Math.round(-Math.log(1 - rng()) * mean * 0.7 + mean * 0.3));

      const snap = (w, label, phase) => {
        const open = [0, 0, 0];
        for (const d of deals) open[d.stage]++;
        return {
          label: label, phase: phase,
          state: {
            w: w, W: W, motion: motion, acv: acv, stages: M.stages,
            counts: counts.slice(), open: open, won: won, lost: lost,
            arr: arr, cost: cost, cycle: won ? cycleSum / won : 0,
            hW: hW.slice(), hArr: hArr.slice(), hCost: hCost.slice()
          }
        };
      };

      yield snap(0, `${motion} motion at $${acv}k ACV. ` +
        (motion === "founder-led" ? "The founders can only run ~7 new conversations a week, but each converts well and teaches them something."
          : motion === "sales-led" ? "A rep team works ~22 outbound leads a week and costs ~$6k a week in salaries."
          : `Lots of self-serve signups (~140/week). At $${acv}k, only ${(selfServe * 100).toFixed(0)}% of would-be buyers will pay by card without talking to a human.`),
        "start");

      for (let w = 1; w <= W; w++) {
        // new leads this week (noisy)
        const n = Math.max(0, Math.round(M.leads * (0.7 + rng() * 0.6)));
        for (let i = 0; i < n; i++) deals.push({ stage: 0, wait: sampleWait(M.dur[0]), started: w });
        counts[0] += n;
        cost += M.cost;

        let wonNow = 0;
        for (let i = deals.length - 1; i >= 0; i--) {
          const d = deals[i];
          if (d.wait > 0) { d.wait--; continue; }
          if (rng() < M.rates[d.stage]) {
            d.stage++;
            counts[d.stage]++;
            if (d.stage === 3) {
              won++; wonNow++; arr += acv; cycleSum += w - d.started;
              deals.splice(i, 1);
            } else d.wait = sampleWait(M.dur[d.stage]);
          } else { lost++; deals.splice(i, 1); }
        }
        hW.push(w); hArr.push(arr); hCost.push(cost * 52 / Math.max(1, w));

        let label = `Week ${w}: ${n} new ${M.stages[0].toLowerCase()}, ${wonNow} won this week. ARR $${arr}k from ${won} customers`;
        if (won > 0) label += `, average cycle ${(cycleSum / won).toFixed(1)} weeks`;
        label += ".";
        if (w === Math.round(W / 3) || w === Math.round(2 * W / 3)) {
          if (motion === "founder-led") label += acv > 40 ? " Big deals take the founders' scarce weeks; few close." : " Few leads but high conversion — and every call is product research.";
          else if (motion === "sales-led") label += acv < 8 ? ` Each deal is only $${acv}k; the reps cost more than they close.` : " Pipeline fills, but cash arrives only after the long cycle.";
          else label += acv > 25 ? " Signups pour in, but at this price almost nobody pays without a salesperson." : " Volume plus short cycles: small deals add up quickly.";
        }
        yield snap(w, label, "run");
      }

      const yearCost = cost * 52 / W;
      const ratio = yearCost > 0 ? arr / yearCost : Infinity;
      yield snap(W,
        `After ${W} weeks: ${won} customers, $${arr}k ARR, cycle ${(won ? cycleSum / won : 0).toFixed(1)} weeks. ` +
        (motion === "founder-led" ? "Cash cost ~0, but capped by founder time — it doesn't scale, which is fine before product-market fit."
          : `New ARR is ${isFinite(ratio) ? ratio.toFixed(1) : "∞"}× the motion's annualised cost — ` + (ratio >= 1 ? "this motion fits this ACV." : "this motion does NOT fit this ACV. Try another motion or price.")),
        "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 18;
      const leftW = Math.round(W * 0.48);
      const stageCol = [C.viz1, C.viz2, C.viz3, C.ok];

      // ---------- funnel -----------------------------------------------------
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, 8, leftW - pad, H - 16, 8); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText(`Funnel · ${S.motion} · $${S.acv}k ACV · week ${S.w}/${S.W}`, pad + 10, 25);

      const maxC = Math.max(1, S.counts[0]);
      const fx0 = pad + 82, fx1 = leftW - 14;
      const rowH = (H - 70) / 4;
      for (let i = 0; i < 4; i++) {
        const y = 40 + i * rowH;
        const frac = S.counts[i] / maxC;
        const bw = Math.max(2, Math.sqrt(frac) * (fx1 - fx0));
        const cx = (fx0 + fx1) / 2;
        ctx.fillStyle = stageCol[i];
        ctx.beginPath(); ctx.roundRect(cx - bw / 2, y, bw, rowH - 12, 5); ctx.fill();
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "right";
        ctx.fillText(S.stages[i], fx0 - 8, y + rowH / 2 - 2);
        ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
        ctx.fillText(i < 3 ? `${S.open[i]} open` : "", fx0 - 8, y + rowH / 2 + 11);
        ctx.textAlign = "center"; ctx.fillStyle = C.text; ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(String(S.counts[i]), cx, y + (rowH - 12) / 2 + 4);
        if (i > 0 && S.counts[i - 1] > 0) {
          ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
          ctx.fillText(`${(100 * S.counts[i] / S.counts[i - 1]).toFixed(0)}%↓`, fx1 - 30, y - 2);
        }
      }
      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText(`bar width ∝ √count · lost ${S.lost}`, pad + 10, H - 16);

      // ---------- ARR vs cost -------------------------------------------------
      const gx0 = leftW + 50, gx1 = W - pad, gy0 = 40, gy1 = H - 64;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(leftW + 8, 8, W - leftW - 8 - pad, H - 16, 8); ctx.fill();
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText("ARR won vs annualised cost of the motion ($k)", leftW + 18, 25);

      const maxY = Math.max(10, S.arr, ...S.hCost, S.acv) * 1.1;
      const xs = (w) => gx0 + (w / S.W) * (gx1 - gx0);
      const ys = (v) => gy1 - (v / maxY) * (gy1 - gy0);
      ctx.font = `10px ${env.font.mono}`;
      for (let i = 0; i <= 4; i++) {
        const v = maxY * i / 4, y = ys(v);
        ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx0, y + .5); ctx.lineTo(gx1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.textAlign = "right"; ctx.fillText(v.toFixed(0), gx0 - 6, y + 3);
      }
      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(gx0 + .5, gy0); ctx.lineTo(gx0 + .5, gy1); ctx.stroke();

      const line = (ys2, col, dash) => {
        if (S.hW.length < 1) return;
        ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash(dash || []);
        ctx.beginPath();
        S.hW.forEach((w, i) => { const x = xs(w), y = ys(ys2[i]); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke(); ctx.setLineDash([]);
      };
      line(S.hArr, C.ok);
      if (S.hCost.some(v => v > 0)) line(S.hCost, C.danger, [5, 4]);

      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.ok; ctx.fillText("■ ARR won", gx0 + 6, gy0 + 10);
      ctx.fillStyle = C.danger; ctx.fillText("- - cost / year", gx0 + 80, gy0 + 10);

      // stat badges
      const stats = [
        ["customers", String(S.won)],
        ["ARR", `$${S.arr}k`],
        ["avg cycle", `${S.cycle.toFixed(1)} wk`]
      ];
      const bw = (gx1 - (leftW + 18)) / 3;
      stats.forEach((s, i) => {
        const x = leftW + 18 + i * bw;
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(s[0], x, H - 40);
        ctx.fillStyle = C.text; ctx.font = `14px ${env.font.mono}`;
        ctx.fillText(s[1], x, H - 22);
      });
    }
  },

  drill: {
    cards: [
      { q: "What single number most decides which go-to-market motion fits?", a: "**ACV** (annual contract value). The motion's cost per customer must fit inside it: under ~$5k → self-serve/PLG; ~$5k–50k → inside sales or hybrid; over ~$50k → sales-led.", tags: ["acv"] },
      { q: "Why must founders do sales before hiring a salesperson?", a: "There is no repeatable playbook yet; founder conversations double as product research. Rule of thumb: ~10–20 founder-closed customers and a written process before the first sales hire.", tags: ["founder-led-sales"] },
      { q: "What is product-led growth?", a: "The product itself acquires and converts customers: free plan or trial, fast time to value, in-product upgrade and invite prompts.", tags: ["plg"] },
      { q: "Typical freemium free → paid conversion?", a: "About **2–5%**. Opt-in free trials convert higher, roughly 15–25%.", tags: ["plg"] },
      { q: "Why does sales cycle length grow with ACV — and why does it matter?", a: "Bigger contracts involve more people, budget approval, security and legal review. Longer cycles delay cash and limit how many deals a rep can carry at once.", tags: ["sales-cycle"] },
      { q: "What makes a good design partner?", a: "Exactly the target customer, feels the pain badly, an internal champion who gives weekly feedback, and willing to pay something.", tags: ["design-partners"] },
      { q: "How should a startup use its waitlist?", a: "As the top of a funnel: invite small batches, onboard hands-on, measure invite → activated → retained, fix the main blocker, then widen.", tags: ["waitlist"] },
      { q: "What is product-led sales?", a: "A hybrid where most customers self-serve and usage data flags larger accounts for a salesperson to help upgrade.", tags: ["plg"] }
    ],
    sixtySecond: [
      "Explain how ACV decides between product-led, inside sales and enterprise sales, with a rough cost argument.",
      "Explain Theoma's go-to-market from today's design partners to a scalable motion."
    ]
  }
};
