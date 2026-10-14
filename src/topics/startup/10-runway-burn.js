export default {
  id: "runway-burn",
  track: "startup",
  title: "Burn, Runway & Default Alive",
  difficulty: 1,
  minutes: 14,
  tags: ["burn-rate", "runway", "default-alive", "cash", "gross-margin"],

  explainer: [
    { type: "p", text: "A startup doesn't die when its product is bad or its idea is wrong. It dies on one specific day: **the day the bank account hits zero and payroll can't go out.** Everything in this lesson is about seeing that day coming, months in advance, and moving it. Three numbers do almost all the work: how much cash you have, how much you lose each month, and how fast revenue is growing. Put them together and you can answer the most important question a founder can ask: *if nothing changes, do we make it?*" },

    { type: "h3", text: "Burn: how fast the money leaves" },
    { type: "p", text: "**Burn rate** is how much money the company loses per month. There are two versions, and mixing them up causes real mistakes." },
    { type: "list", items: [
      "**Gross burn** — everything you *spend* in a month: salaries, cloud servers, model tokens, data APIs, software tools, legal fees. It ignores revenue entirely. It answers *how expensive is this company to run?*",
      "**Net burn** — gross burn **minus** the revenue that came in that month. It answers *how much smaller did the bank balance get?* Say you spend $60k and customers pay you $15k: gross burn is $60k, net burn is $45k.",
      "Before you have revenue, the two are the same number. Once revenue arrives, **net burn is the one that sets your runway**, and gross burn is the one that tells you how much you could cut."
    ]},

    { type: "h3", text: "Runway: how many months you have left" },
    { type: "p", text: "**Runway** is cash in the bank divided by net burn: `runway = cash ÷ net burn`. With $900k in the bank and a $45k net burn, you have 20 months. That simple version quietly assumes nothing changes, which is never true: you hire, so burn grows; customers sign up, so revenue grows. So treat the simple number as a quick check and keep a month-by-month model (a row per month: cash at start, spend, revenue, cash at end) as the real answer. The visualizer above is exactly that model." },
    { type: "callout", tone: "warn", text: "Raising money takes far longer than founders expect: commonly **3 to 6 months** from first meeting to money in the bank, and longer in a bad market. And investors can smell desperation. So the rule of thumb is to **start raising with at least 6 to 9 months of runway left**, and to raise enough each time to cover **18 to 24 months** — enough to hit the milestones that justify the next round, plus a cushion for the next raise taking too long." },

    { type: "h3", text: "Default alive or default dead?" },
    { type: "p", text: "In a 2015 essay, Paul Graham (co-founder of Y Combinator, the startup accelerator) gave founders a sharper question than \"how long is our runway\": *assuming expenses stay where they are and revenue keeps growing at the rate it has over the last few months, do we reach profitability before the money runs out?* If yes, the company is **default alive** — it survives unless something goes wrong. If no, it is **default dead** — it dies unless something goes *right*, usually a new fundraise. Being default dead is normal for a young startup; *not knowing* you are is the danger. A default-dead company that assumes the next round will happen is betting the company on investors' mood in a market it doesn't control." },
    { type: "p", text: "The striking thing the visualizer shows is how much **growth rate** matters compared to everything else. A company with tiny revenue growing 15% a month will usually overtake a fixed burn; a company with ten times the revenue growing 2% a month often never does. Revenue that compounds wins the race; revenue that sits still loses it slowly." },

    { type: "h3", text: "The two levers: spend less or grow faster" },
    { type: "list", items: [
      "**Cutting** (lower gross burn) buys time immediately and for certain. But cutting the people or tools that drive growth can slow revenue, which can make you *more* dead, not less.",
      "**Growing** (higher revenue growth) is the only lever that eventually ends the problem, but it's uncertain and slow to show up.",
      "A useful habit: compute the **burn multiple** — net burn divided by the new recurring revenue you added that period. A burn multiple of 2 means you spend $2 to add $1 of annual recurring revenue. It tells you whether burning more money is actually buying growth."
    ]},

    { type: "h3", text: "AI products have a third cost line: per-use costs" },
    { type: "p", text: "In a normal software company, serving one more customer costs almost nothing, so expenses are mostly **fixed** (salaries, rent). An AI product is different: every agent turn spends **model tokens**, every keyword lookup or search costs a few cents of **data-API** fees, and every running workspace uses **cloud** compute. Those costs are **variable** — they grow with usage, and therefore with revenue. That's what the *AI cost %* slider in the visualizer models. If AI costs eat 60% of every dollar of revenue, each new customer only brings in 40 cents toward the fixed costs, and growing revenue closes the gap far more slowly. The share of revenue left after these per-use costs is called **gross margin**; classic software runs at 75–85%, while many AI products today sit at 40–60%." },
    { type: "callout", tone: "pitfall", text: "A free trial or a free tier is not free for an AI company. A thousand waitlist users each running agents for a week can generate a real model bill with zero revenue against it. Put a ceiling on per-user usage before you open the doors, and watch the bill daily during a launch." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Build the monthly model this week**, in a spreadsheet or the Python below: one row per month for 24 months, columns for cash, each cost line, revenue, and ending cash. Every number for Theoma is a guess today; that's fine — the model shows which guesses matter.",
      "**Split costs into fixed and per-use.** Fixed: the founders' pay, the GCP deployment, tools. Per-use: Claude/OpenAI/Gemini/Perplexity tokens, DataForSEO and Serper calls, sandbox compute per workspace. Tag per-use spend by workspace so you can say what one active customer costs per month.",
      "**Theoma has a margin lever most competitors lack:** agents can run on the customer's own Claude subscription from their desktop. Every agent turn that runs there is a token bill Theoma doesn't pay. Track the share of turns that run on the customer's subscription versus Theoma's host; it moves gross margin directly.",
      "**Know your date.** Write down the month cash hits zero at today's burn, and the month you must start raising (six to nine months before that). Revisit both every month."
    ]}
  ],

  glossary: [
    { term: "Burn rate", plain: "How much money the company loses in a month." },
    { term: "Gross burn", plain: "Everything the company spends in a month, ignoring any money coming in." },
    { term: "Net burn", plain: "Monthly spending minus monthly revenue: how much the bank balance actually shrinks each month." },
    { term: "Runway", plain: "How many months until the money runs out, roughly cash in the bank divided by net burn." },
    { term: "Default alive", plain: "A company that, if spending stays flat and revenue keeps growing at its recent pace, becomes profitable before the money runs out." },
    { term: "Default dead", plain: "A company that runs out of money first under those same assumptions, so it needs something to change (usually a new fundraise) to survive." },
    { term: "Break-even / profitable", plain: "The month revenue first covers all spending, so the bank balance stops shrinking." },
    { term: "MRR (monthly recurring revenue)", plain: "The revenue that repeats every month from subscriptions, as opposed to one-off payments." },
    { term: "ARR (annual recurring revenue)", plain: "MRR multiplied by 12: the yearly value of the subscriptions you have right now." },
    { term: "Fixed costs", plain: "Costs that stay the same no matter how many customers you have, like salaries and rent." },
    { term: "Variable (per-use) costs", plain: "Costs that grow as customers use the product more, like AI model fees for every agent reply." },
    { term: "Model tokens", plain: "The units AI model providers charge by: roughly word-pieces of text sent to and received from the model." },
    { term: "Gross margin", plain: "The share of each revenue dollar left after paying the costs of serving that customer. 70% gross margin means 30 cents of every dollar goes to serving costs." },
    { term: "Burn multiple", plain: "Net burn divided by the new recurring revenue added in the same period. It measures how many dollars you spend to add one dollar of yearly revenue; lower is better." }
  ],

  complexity: {
    rows: [
      { operation: "Runway right after a raise", time: "18–24 months", space: "24+ months", note: "covers the milestones plus a slow next raise" },
      { operation: "Runway left when you start raising", time: "6–9 months", space: "9–12 months", note: "raises often take 3–6 months" },
      { operation: "Burn multiple (net burn ÷ net new ARR)", time: "< 2×", space: "< 1×", note: "early-stage numbers swing; look at the trend" },
      { operation: "Gross margin, AI software", time: "50–60%", space: "70%+", note: "classic SaaS runs 75–85%" },
      { operation: "Month-over-month revenue growth, early stage", time: "10–15%", space: "20%+", note: "YC's oft-quoted target is 5–7% weekly during the batch" }
    ]
  },

  interview: {
    whyAsked: "Theoma is pre-revenue, so today it is default dead by definition, like nearly every startup at this stage. The founders' job is to know the date cash runs out, to start the next raise early enough, and to make sure the per-use AI cost of each customer doesn't quietly turn revenue growth into a slower death. Investors will ask for this model in the first meeting about money.",
    followUps: [
      { q: "What's your burn and runway?", a: "Answer with three numbers: gross burn, net burn, and months of runway at the current net burn, plus the month you plan to start raising. Founders who answer instantly and precisely signal they run the company on numbers; hesitation here is a red flag for investors." },
      { q: "Are you default alive?", a: "Pre-revenue, the honest answer is no, and you say so, then explain what has to be true to change it: for example, 'at $X of MRR growing Y% a month by month Z, we break even before cash runs out.' Showing you know the gap, and the plan to close it, is the point." },
      { q: "What does one more customer cost you to serve?", a: "For an AI product this is model tokens plus data-API calls plus compute per workspace per month. Give the number, what drives it (agent turns per day, searches per run), and what brings it down (caching, cheaper models for simple steps, running on the customer's own subscription)." },
      { q: "If the raise takes twice as long as planned, what do you cut?", a: "Name it in advance: which costs go first (paid tools, contractors, the most expensive model on low-value steps), which never go (the people and spend driving revenue), and how many months that buys. A pre-decided cut plan avoids panic decisions later." },
      { q: "Why raise 18–24 months and not 36?", a: "More money means more dilution at today's (lower) valuation. Enough to reach the milestones that justify a higher price next time, plus a cushion, is the usual balance. Raise too little and you're fundraising again before you've made progress." },
      { q: "Isn't cutting burn always the safe move?", a: "Only if what you cut isn't what drives growth. Default-alive status depends on growth rate as much as on burn; cutting the growth engine can push the break-even point beyond the runway, making the company more dead, not less." }
    ]
  },

  code: [
    { lang: "python", label: "Monthly cash model + default-alive check", code: "def simulate(cash, fixed_burn, mrr, growth, ai_cost_pct, months=48):\n    \"\"\"All money in $k. growth and ai_cost_pct are fractions (0.10 = 10%).\n    Returns (month cash hits zero or None, first profitable month or None).\"\"\"\n    zero_month = profit_month = None\n    for m in range(1, months + 1):\n        revenue = mrr * (1 + growth) ** (m - 1)\n        spend = fixed_burn + ai_cost_pct * revenue   # per-use AI cost scales with revenue\n        cash += revenue - spend\n        if profit_month is None and revenue >= spend:\n            profit_month = m\n        if zero_month is None and cash < 0:\n            zero_month = m\n    return zero_month, profit_month\n\ndef default_alive(**kw):\n    zero, profit = simulate(**kw)\n    return profit is not None and (zero is None or profit < zero)\n\n# Illustrative numbers, not Theoma's:\nprint(simulate(cash=1000, fixed_burn=80, mrr=5, growth=0.10, ai_cost_pct=0.30))\nprint(default_alive(cash=1000, fixed_burn=80, mrr=5, growth=0.10, ai_cost_pct=0.30))" },
    { lang: "python", label: "Quick runway and burn multiple", code: "def runway_months(cash, gross_burn, revenue):\n    net_burn = gross_burn - revenue\n    return float('inf') if net_burn <= 0 else cash / net_burn\n\ndef burn_multiple(net_burn_period, arr_start, arr_end):\n    net_new_arr = arr_end - arr_start\n    return float('inf') if net_new_arr <= 0 else net_burn_period / net_new_arr\n\nprint(runway_months(cash=900, gross_burn=60, revenue=15))   # 20.0 months\nprint(burn_multiple(net_burn_period=135, arr_start=120, arr_end=200))  # ~1.7x" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 200 },

    params: [
      { key: "cash",   label: "Starting cash ($k)",   type: "int", min: 100, max: 3000, default: 1000 },
      { key: "burn",   label: "Fixed burn ($k/mo)",   type: "int", min: 10,  max: 300,  default: 80 },
      { key: "mrr",    label: "Starting MRR ($k)",    type: "int", min: 0,   max: 100,  default: 5 },
      { key: "growth", label: "MRR growth (%/mo)",    type: "int", min: 0,   max: 40,   default: 10 },
      { key: "aiPct",  label: "AI cost (% of revenue)", type: "int", min: 0, max: 80,   default: 30 }
    ],

    frames: function* (params) {
      const M = 48;
      const g = params.growth / 100, ai = params.aiPct / 100;
      const money = k => (Math.abs(k) >= 1000 ? `$${(k / 1000).toFixed(2)}M` : `$${Math.round(k)}k`);

      // Run the whole model first so every frame can show the verdict lines.
      const cash = [params.cash], rev = [0], spend = [0];
      let zeroMonth = null, profitMonth = null;
      for (let m = 1; m <= M; m++) {
        const r = params.mrr * Math.pow(1 + g, m - 1);
        const s = params.burn + ai * r;
        rev.push(r); spend.push(s);
        cash.push(cash[m - 1] + r - s);
        if (profitMonth === null && r >= s) profitMonth = m;
        if (zeroMonth === null && cash[m] < 0) zeroMonth = m;
      }
      const alive = profitMonth !== null && (zeroMonth === null || profitMonth < zeroMonth);
      const simpleRunway = params.burn - params.mrr * (1 - ai) > 0 ? params.cash / (params.burn - params.mrr * (1 - ai)) : null;

      const snap = (m, label, phase) => ({
        label, phase,
        state: {
          m, M, cash: cash.slice(0, m + 1), rev: rev.slice(0, m + 1), spend: spend.slice(0, m + 1),
          allCash: cash, allRev: rev, allSpend: spend,
          zeroMonth, profitMonth, alive, simpleRunway, start: params.cash,
          aiPct: params.aiPct
        }
      });

      yield snap(0,
        `Month 0: ${money(params.cash)} in the bank, ${money(params.burn)}/mo fixed costs, ${money(params.mrr)} MRR growing ${params.growth}%/mo, and AI costs taking ${params.aiPct}% of each revenue dollar. Simple runway (cash ÷ today's net burn): ${simpleRunway === null ? "already profitable" : simpleRunway.toFixed(1) + " months"}.`,
        "start");

      for (let m = 1; m <= M; m++) {
        const net = spend[m] - rev[m];
        let label = `Month ${m}: revenue ${money(rev[m])}, spend ${money(spend[m])} (${money(params.burn)} fixed + ${money(spend[m] - params.burn)} AI), ` +
          (net > 0 ? `net burn ${money(net)}` : `profit ${money(-net)}`) + `, cash ${money(cash[m])}.`;
        let phase = "burning";
        if (m === profitMonth) { label = `Month ${m}: break-even! Revenue ${money(rev[m])} now covers all spending (${money(spend[m])}). Cash bottoms out at ${money(cash[m])} and starts climbing.`; phase = "break-even"; }
        else if (m === zeroMonth) { label = `Month ${m}: cash hits zero (${money(cash[m])}). Revenue is ${money(rev[m])} against ${money(spend[m])} of spending — the company cannot make payroll without new money.`; phase = "out of cash"; }
        else if (zeroMonth !== null && m === zeroMonth - 9 && m > 0) { label = `Month ${m}: nine months of cash left. This is the last comfortable moment to start raising — raises often take 3–6 months.`; phase = "start raising"; }
        else if (profitMonth !== null && m > profitMonth) phase = "profitable";
        else if (zeroMonth !== null && m > zeroMonth) phase = "dead";
        yield snap(m, label, phase);
      }

      let verdict;
      if (alive) verdict = `DEFAULT ALIVE: revenue overtakes spending in month ${profitMonth}` + (zeroMonth === null ? `, and cash never runs out (lowest point ${money(Math.min.apply(null, cash))}).` : `.`) + ` Try lowering MRR growth a few points and watch the verdict flip — growth rate matters more than starting revenue.`;
      else if (profitMonth !== null) verdict = `DEFAULT DEAD: revenue would overtake spending in month ${profitMonth}, but the cash runs out first, in month ${zeroMonth}. A raise (or a cut) must happen before month ${Math.max(1, zeroMonth - 9)}.`;
      else verdict = `DEFAULT DEAD: cash runs out in month ${zeroMonth ?? "—"} and revenue never catches spending within ${M} months. Raise the growth rate, lower fixed burn, or lower AI cost % to change the verdict.`;
      yield snap(M, verdict, alive ? "default alive" : "default dead");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const money = k => (Math.abs(k) >= 1000 ? `$${(k / 1000).toFixed(1)}M` : `$${Math.round(k)}k`);

      const pad = 18, left = 58, right = W - pad;
      const topH = Math.round((H - 70) * 0.58);
      const t0 = 36, t1 = t0 + topH;
      const b0 = t1 + 34, b1 = H - 24;
      const xOf = m => left + (m / S.M) * (right - left);

      // header
      ctx.textAlign = "left"; ctx.font = `13px ${env.font.base}`; ctx.fillStyle = C.text;
      ctx.fillText(`Month ${S.m} of ${S.M}`, pad, 20);
      const last = S.cash[S.cash.length - 1];
      ctx.font = `11px ${env.font.mono}`; ctx.fillStyle = last < 0 ? C.danger : C.text2;
      ctx.fillText(`cash ${money(last)}`, pad + 110, 20);
      if (frame.phase === "default alive" || frame.phase === "default dead") {
        env.badge(right, 14, frame.phase.toUpperCase(), { color: C.bg, bg: frame.phase === "default alive" ? C.ok : C.danger, align: "right", size: 11 });
      }

      // ---------- top: cash balance -----------------------------------------
      const minC = Math.min(0, Math.min.apply(null, S.allCash)), maxC = Math.max.apply(null, S.allCash) * 1.05;
      const yC = v => t1 - ((v - minC) / (maxC - minC || 1)) * (t1 - t0);
      ctx.fillStyle = C.surface; ctx.beginPath(); ctx.roundRect(left - 6, t0 - 6, right - left + 12, topH + 12, 6); ctx.fill();
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        const v = minC + (maxC - minC) * i / 4, y = yC(v);
        ctx.beginPath(); ctx.moveTo(left, y + .5); ctx.lineTo(right, y + .5); ctx.stroke();
        ctx.fillText(money(v), left - 8, y + 3);
      }
      // zero line
      ctx.strokeStyle = C.danger; ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(left, yC(0) + .5); ctx.lineTo(right, yC(0) + .5); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = "left"; ctx.fillStyle = C.danger; ctx.fillText("$0 — out of cash", left + 4, yC(0) - 4);

      // future (faint) and past (solid) cash line
      const path = (arr, from, to) => { ctx.beginPath(); for (let m = from; m <= to; m++) { const x = xOf(m), y = yC(arr[m]); if (m === from) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); };
      ctx.strokeStyle = C.viz1; ctx.globalAlpha = 0.25; ctx.lineWidth = 2; path(S.allCash, 0, S.M); ctx.globalAlpha = 1;
      ctx.lineWidth = 2.5; path(S.allCash, 0, S.m);
      ctx.fillStyle = S.allCash[S.m] < 0 ? C.danger : C.viz1;
      ctx.beginPath(); ctx.arc(xOf(S.m), yC(S.allCash[S.m]), 4, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = C.text2; ctx.fillText("cash in the bank", left + 4, t0 + 10);

      const marker = (m, col, txt) => {
        if (m === null) return;
        const x = xOf(m);
        ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.globalAlpha = S.m >= m ? 1 : 0.35;
        ctx.beginPath(); ctx.moveTo(x + .5, t0); ctx.lineTo(x + .5, b1); ctx.stroke();
        ctx.fillStyle = col; ctx.textAlign = x > W * 0.75 ? "right" : "left";
        ctx.fillText(txt, x + (x > W * 0.75 ? -4 : 4), t0 + 24 + (col === C.ok ? 0 : 12));
        ctx.globalAlpha = 1;
      };
      marker(S.profitMonth, C.ok, `break-even m${S.profitMonth}`);
      marker(S.zeroMonth, C.danger, `cash zero m${S.zeroMonth}`);
      if (S.zeroMonth !== null && S.zeroMonth - 9 > 0) marker(S.zeroMonth - 9, C.warn, `start raising m${S.zeroMonth - 9}`);

      // ---------- bottom: revenue vs spend -----------------------------------
      const maxR = Math.max(Math.max.apply(null, S.allSpend), Math.max.apply(null, S.allRev)) * 1.05 || 1;
      const yR = v => b1 - (v / maxR) * (b1 - b0);
      ctx.fillStyle = C.surface; ctx.beginPath(); ctx.roundRect(left - 6, b0 - 6, right - left + 12, b1 - b0 + 12, 6); ctx.fill();
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(left, b1 + .5); ctx.lineTo(right, b1 + .5); ctx.stroke();
      ctx.textAlign = "right"; ctx.fillStyle = C.muted;
      ctx.fillText(money(maxR / 1.05), left - 8, b0 + 4); ctx.fillText("$0", left - 8, b1 + 3);
      const series = (arr, col, from, to, alpha) => { ctx.strokeStyle = col; ctx.globalAlpha = alpha; ctx.lineWidth = 2; ctx.beginPath(); for (let m = Math.max(1, from); m <= to; m++) { const x = xOf(m), y = yR(arr[m]); if (m === Math.max(1, from)) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke(); ctx.globalAlpha = 1; };
      series(S.allSpend, C.viz2, 1, S.M, 0.25); series(S.allRev, C.viz3, 1, S.M, 0.25);
      if (S.m >= 1) { series(S.allSpend, C.viz2, 1, S.m, 1); series(S.allRev, C.viz3, 1, S.m, 1); }
      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz2; ctx.fillText(`■ spend (fixed + ${S.aiPct}% AI cost)`, left + 4, b0 + 8);
      ctx.fillStyle = C.viz3; ctx.fillText("■ revenue (MRR)", left + 200, b0 + 8);
      ctx.fillStyle = C.muted; ctx.textAlign = "center";
      for (let m = 0; m <= S.M; m += 12) ctx.fillText(`m${m}`, xOf(m), b1 + 14);
    }
  },

  drill: {
    cards: [
      { q: "Gross burn vs net burn?", a: "Gross burn = everything you spend in a month. Net burn = spend minus revenue, i.e. how much the bank balance actually drops. Runway uses **net** burn.", tags: ["definition"] },
      { q: "How do you compute runway, and what does the simple formula assume?", a: "`runway = cash ÷ net burn`. It assumes burn and revenue stay flat; a month-by-month model with hiring and revenue growth is the real answer.", tags: ["runway"] },
      { q: "Define default alive vs default dead.", a: "Assuming expenses stay flat and revenue keeps growing at its recent rate: default alive = profitable before cash runs out; default dead = cash runs out first. (Paul Graham, 2015.)", tags: ["default-alive"] },
      { q: "How much runway should a raise buy, and when should you start the next one?", a: "Raise for roughly 18–24 months; start the next raise with 6–9 months of runway left, because raises commonly take 3–6 months.", tags: ["fundraising"] },
      { q: "Why do AI products close the gap to profitability more slowly than classic SaaS?", a: "Model tokens, data APIs and compute are per-use costs that grow with revenue, so gross margin is lower (often 40–60% vs 75–85%). Each new revenue dollar contributes less toward fixed costs.", tags: ["gross-margin", "ai"] },
      { q: "What is the burn multiple?", a: "Net burn ÷ net new ARR in the same period. Under 2× is healthy, under 1× is great. It tells you whether burning money is buying growth.", tags: ["metrics"] },
      { q: "Which lever matters more for default-alive status: starting revenue or growth rate?", a: "Growth rate. Small revenue compounding fast usually overtakes a fixed burn; large revenue growing slowly often never does.", tags: ["growth"] },
      { q: "When can cutting burn make a company *more* dead?", a: "When the cuts slow revenue growth enough that break-even moves further out than the extra runway the cuts bought.", tags: ["levers"] }
    ],
    sixtySecond: [
      "Explain gross burn, net burn and runway, and walk through how you'd tell whether a company is default alive.",
      "Explain why per-use AI costs change the runway math for an AI startup, and name two ways to reduce them."
    ]
  }
};
