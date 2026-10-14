export default {
  id: "unit-economics",
  track: "startup",
  title: "Unit Economics: CAC, LTV, Payback",
  difficulty: 2,
  minutes: 16,
  tags: ["unit-economics", "cac", "ltv", "payback", "gross-margin", "churn"],

  explainer: [
    { type: "p", text: "**Unit economics** answers one question: *do we make money on a single customer?* Forget the whole company for a moment — salaries, office, the founders' time. Look at one customer: what did it cost to win them, how much do they pay each month, how much of that is left after serving them, and how long do they stay? If one customer is profitable, growth makes the company stronger. If one customer loses money, growth just digs the hole faster — and no amount of scale fixes it." },

    { type: "h3", text: "The four numbers" },
    { type: "list", items: [
      "**CAC (customer acquisition cost)** — the total sales and marketing spend in a period divided by the new customers won in that period. Spend $24,000 on ads, content, outbound tools and a salesperson's salary in a quarter, win 10 customers: CAC is $2,400. Include salaries, not just ad spend — leaving them out is the most common way founders flatter this number.",
      "**ARPA (average revenue per account)** — what a typical customer pays per month. Say $300/month.",
      "**Gross margin** — the share of that revenue left after the direct cost of serving the customer (model tokens, servers, paid data APIs, support). At 65%, each $300 leaves $195 of **gross profit** per month.",
      "**Churn** — the share of customers who cancel each month. At 3% monthly churn, a customer stays on average `1 / 0.03 ≈ 33` months."
    ]},

    { type: "h3", text: "LTV: what a customer is worth" },
    { type: "p", text: "**LTV (lifetime value)** is the total gross profit you expect from one customer over their whole life: `LTV = ARPA × gross margin / monthly churn`. With the numbers above: `$300 × 0.65 / 0.03 = $6,500`. Note that LTV uses **gross profit, not revenue**. Using revenue overstates it by a third or more, and investors will redo your math if you do." },
    { type: "callout", tone: "tip", text: "**LTV : CAC ≥ 3** is the classic benchmark. Here `$6,500 / $2,400 ≈ 2.7` — close but short. Below 1 you lose money on every customer. Far above 5 usually means you are **under-investing** in growth: you could spend more to win customers and still profit." },

    { type: "h3", text: "Payback: how long until a customer repays their CAC" },
    { type: "p", text: "LTV is a forecast that leans on a churn guess, and churn is the number early startups know least. **CAC payback** is more concrete: `months to payback = CAC / (ARPA × gross margin)`. Here `$2,400 / $195 ≈ 12.3 months`. Until then, every new customer is a loan you've made. A startup with 12-month payback that wins 20 customers this month has lent out $48,000 it will only get back next year. That is why fast-growing startups burn cash even when the unit economics are good — and why payback matters so much for runway." },
    { type: "list", items: [
      "**Self-serve / small-business SaaS:** payback under 12 months is good, under 6 is excellent.",
      "**Mid-market and enterprise:** 12–24 months is accepted, because those customers churn less and expand more.",
      "**Annual upfront billing** pulls the payback forward: the customer pays 12 months on day one, so the cash comes back immediately even though the economics are unchanged."
    ]},

    { type: "h3", text: "Why AI margins change the math" },
    { type: "p", text: "Classic SaaS runs 75–85% gross margin because serving one more customer costs almost nothing. AI products often run 50–70% because each customer's usage triggers paid model calls. That isn't fatal, but it compounds through every formula: the same price and CAC at 55% margin instead of 80% means payback takes **~45% longer** and LTV is **~30% lower**. AI startups make up for it with higher prices (they replace labour, not just software) and with model costs falling every year." },
    { type: "callout", tone: "pitfall", text: "Early on, every one of these numbers is noisy. With 8 customers, one cancellation is 12% churn. Don't put an LTV of $80,000 in a deck based on 2 months of zero churn. Show payback with honest inputs, state your assumptions, and update monthly." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Start tracking CAC from the first design partner.** Founder time spent on demos, waitlist marketing, paid tools and ads are all acquisition cost. Keep a simple sheet: spend per month, customers won per month.",
      "**Know cost to serve per workspace.** Theoma's gross margin depends on agent token spend and paid APIs (DataForSEO, Serper, Perplexity). Log it per workspace so gross margin is measured, not guessed — it feeds every number in this lesson.",
      "**Theoma's own Marketer and Outbound agents can lower CAC.** If Theoma markets itself with its own agents (the theoma.ai demo already exists), that is both a cheaper acquisition channel and a live proof of the product.",
      "**Push annual plans with design partners converting to paid.** Upfront cash shortens payback and extends runway at the same time.",
      "**Illustrative target:** say Theoma charges $300/workspace/month at 65% margin. To keep payback under 12 months, CAC must stay under ~$2,300. That number tells you how much you can afford to spend on any channel."
    ]}
  ],

  glossary: [
    { term: "Unit economics", plain: "The profit or loss from a single customer, ignoring company-wide costs like salaries for engineering." },
    { term: "CAC (customer acquisition cost)", plain: "Everything spent on sales and marketing in a period, divided by the number of new customers won in that period." },
    { term: "ARPA (average revenue per account)", plain: "How much a typical customer pays you per month." },
    { term: "Gross margin", plain: "The share of revenue left after paying the direct costs of serving customers (model tokens, servers, paid APIs, support)." },
    { term: "Gross profit", plain: "Revenue minus the direct cost of serving it — the money actually left over to pay for everything else." },
    { term: "Churn", plain: "The share of customers (or revenue) that cancels in a period, usually given per month." },
    { term: "LTV (lifetime value)", plain: "The total gross profit you expect from one customer before they cancel: monthly gross profit ÷ monthly churn." },
    { term: "LTV : CAC", plain: "How many dollars of lifetime profit a customer brings back for each dollar spent winning them. 3 or more is the usual benchmark." },
    { term: "CAC payback", plain: "How many months of a customer's gross profit it takes to earn back what you spent to win them." },
    { term: "Annual upfront billing", plain: "The customer pays for a whole year at signup instead of month by month." }
  ],

  complexity: {
    rows: [
      { operation: "LTV : CAC", time: "3 : 1", space: "4–5 : 1", note: "> 5 can mean under-investing in growth" },
      { operation: "CAC payback (SMB / self-serve)", time: "< 12 months", space: "< 6 months", note: "mid-market/enterprise: 12–24 accepted" },
      { operation: "Gross margin (AI product)", time: "50–65%", space: "70%+", note: "classic SaaS: 75–85%" },
      { operation: "Monthly logo churn (SMB)", time: "3–5%", space: "< 2%", note: "enterprise: < 1% monthly" }
    ]
  },

  interview: {
    whyAsked: "Every agent turn costs Theoma real model money, so its gross margin will be lower than a classic SaaS company's, and that flows straight into LTV and payback. Knowing these numbers from the first paid customer is how the founders decide which channels are worth paying for and how much runway growth will eat.",
    followUps: [
      { q: "What's your CAC, and what's in it?", a: "Total sales and marketing spend — tools, ads, contractors, and the share of salaries spent on selling — divided by new customers in the same period. Say clearly whether founder time is included; early on it usually dominates, and leaving it out flatters CAC." },
      { q: "Your LTV assumes a churn rate you can't have measured yet. Why trust it?", a: "We don't lean on it. We lead with payback, which only needs price, margin and CAC, and show LTV as a range under a few churn assumptions. As cohorts age we replace the assumption with measured churn." },
      { q: "Your gross margin is 55%. Isn't that a weak business?", a: "Not if price reflects labour replaced rather than software seats, and margin has a path up: model costs fall each year, caching and routing to smaller models cut cost per task, and users on their own Claude subscription cost us almost nothing to serve." },
      { q: "LTV:CAC is 8. Why is that a concern?", a: "It suggests we're under-spending on growth: we could pay more per customer, in more channels, and still be comfortably profitable per customer. Investors would rather see faster growth at 3–4." },
      { q: "How do annual plans change things?", a: "The economics per customer stay the same, but the cash arrives on day one, so payback is effectively immediate and the growth doesn't consume runway. Usually worth a 15–20% discount." }
    ]
  },

  code: [
    { lang: "python", label: "CAC, LTV, payback", code:
`marketing_spend  = 24_000      # quarter: ads, tools, contractors, sales salaries
new_customers    = 10
arpa             = 300         # $/month per customer
gross_margin     = 0.65
monthly_churn    = 0.03

cac      = marketing_spend / new_customers            # 2,400
gp_month = arpa * gross_margin                         # 195
ltv      = gp_month / monthly_churn                    # 6,500
payback  = cac / gp_month                              # ~12.3 months

print(f"CAC \${cac:,.0f}  LTV \${ltv:,.0f}  LTV:CAC {ltv / cac:.1f}  payback {payback:.1f} mo")` },
    { lang: "python", label: "Cumulative cash from one customer (with churn)", code:
`def cash_curve(arpa, gm, churn, cac, months=36):
    cash, alive, out = -cac, 1.0, []
    for m in range(1, months + 1):
        cash += arpa * gm * alive      # expected gross profit this month
        alive *= 1 - churn             # chance they're still a customer
        out.append(cash)
    return out

curve = cash_curve(300, 0.65, 0.03, 2400)
payback = next((m + 1 for m, c in enumerate(curve) if c >= 0), None)
print("break-even month:", payback)` }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 80 },

    params: [
      { key: "price", label: "Price ($/mo)", type: "int", min: 50, max: 2000, default: 300 },
      { key: "cac", label: "CAC ($)", type: "int", min: 200, max: 20000, default: 2400 },
      { key: "churn", label: "Monthly churn %", type: "int", min: 1, max: 15, default: 3 },
      { key: "gm", label: "Gross margin %", type: "int", min: 30, max: 90, default: 65 }
    ],

    frames: function* (params) {
      const M = 36;
      const price = params.price, cac = params.cac, churn = params.churn / 100, gm = params.gm / 100;
      const curve = (g) => {
        const out = [-cac]; let cash = -cac, alive = 1;
        for (let m = 1; m <= M; m++) { cash += price * g * alive; alive *= 1 - churn; out.push(cash); }
        return out;
      };
      const main = curve(gm);
      const saas = curve(0.8);
      const ltv = price * gm / churn;
      const simplePayback = cac / (price * gm);
      let pb = -1;
      for (let m = 0; m <= M; m++) if (main[m] >= 0) { pb = m; break; }
      let pbS = -1;
      for (let m = 0; m <= M; m++) if (saas[m] >= 0) { pbS = m; break; }

      const snap = (m, label, phase) => ({
        label, phase, focus: [m],
        state: { m, M, main, saas, cac, price, gm, churn, ltv, ratio: ltv / cac, pb, pbS, simplePayback, alive: Math.pow(1 - churn, m) }
      });

      yield snap(0, `Month 0: you spend $${cac.toLocaleString()} to win one customer. Cash is −$${cac.toLocaleString()} before they pay a cent.`, "acquire");
      for (let m = 1; m <= M; m++) {
        const gp = price * gm * Math.pow(1 - churn, m - 1);
        let label = `Month ${m}: expected gross profit +$${gp.toFixed(0)} (${(Math.pow(1 - churn, m - 1) * 100).toFixed(0)}% chance they're still here) → cumulative $${Math.round(main[m]).toLocaleString()}.`;
        let phase = main[m] < 0 ? "repaying" : "profit";
        if (m === pb) { label = `Month ${m}: PAYBACK — this customer has finally repaid their acquisition cost. Everything from here is profit.`; phase = "payback"; }
        yield snap(m, label, phase);
      }
      const r = ltv / cac;
      const verdict = r < 1 ? "you lose money on every customer" : r < 3 ? "below the 3:1 benchmark" : r <= 5 ? "healthy" : "very strong — maybe spend more on growth";
      yield snap(M, `LTV = $${price} × ${(gm * 100).toFixed(0)}% ÷ ${(churn * 100).toFixed(0)}% = $${Math.round(ltv).toLocaleString()}; LTV:CAC ${r.toFixed(1)} (${verdict}). Payback ${pb < 0 ? "never within 3 years" : pb + " months"}; at classic-SaaS 80% margin it would be ${pbS < 0 ? "> 36" : pbS} months.`, "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 18;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`One customer's cumulative cash, month ${S.m} of ${S.M}`, pad, 20);

      const stat = (x, t, v, col) => {
        ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(t, x, 14);
        ctx.fillStyle = col; ctx.font = `bold 14px ${env.font.mono}`;
        ctx.fillText(v, x, 32);
      };
      stat(W - pad, "payback", S.pb < 0 ? "> 36 mo" : `${S.pb} mo`, S.pb < 0 ? C.danger : S.pb <= 12 ? C.ok : C.warn);
      stat(W - pad - 90, "LTV : CAC", S.ratio.toFixed(1), S.ratio >= 3 ? C.ok : S.ratio >= 1 ? C.warn : C.danger);
      stat(W - pad - 180, "LTV", `$${Math.round(S.ltv).toLocaleString()}`, C.viz1);
      stat(W - pad - 280, "still a customer", `${(S.alive * 100).toFixed(0)}%`, C.text2);

      const gx0 = pad + 52, gx1 = W - pad - 6, gy0 = 50, gy1 = H - 40;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, gy0 - 8, W - pad * 2, gy1 - gy0 + 34, 8); ctx.fill();

      // Round the axis out to whole steps of 1, 2 or 5 × a power of ten.
      const all = S.main.concat(S.saas, [0]);
      const rawStep = (Math.max(...all, 1) - Math.min(...all)) / 4 || 1;
      const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
      const step = [1, 2, 5, 10].map(f => f * mag).find(st => st >= rawStep);
      const lo = Math.floor(Math.min(...all) / step) * step, hi = Math.ceil(Math.max(...all, 1) / step) * step;
      const span = hi - lo;
      const money = v => (v < 0 ? "−$" : "$") + Math.abs(Math.round(v)).toLocaleString();
      const X = m => gx0 + (m / S.M) * (gx1 - gx0);
      const Y = v => gy1 - ((v - lo) / span) * (gy1 - gy0);

      // grid
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `9px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let v = lo; v <= hi + step / 2; v += step) {
        const y = Y(v);
        ctx.beginPath(); ctx.moveTo(gx0, y + .5); ctx.lineTo(gx1, y + .5); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(money(v), gx0 - 4, y + 3);
      }
      for (let m = 0; m <= S.M; m += 6) {
        ctx.textAlign = "center"; ctx.fillText(`${m}`, X(m), gy1 + 12);
      }
      ctx.textAlign = "left"; ctx.fillText("months", gx1 - 40, gy1 + 22);

      // break-even line
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(gx0, Y(0)); ctx.lineTo(gx1, Y(0)); ctx.stroke();
      ctx.fillStyle = C.text2; ctx.textAlign = "left"; ctx.fillText("break-even", gx0 + 4, Y(0) - 4);

      // LTV - CAC asymptote
      const asym = S.ltv - S.cac;
      if (asym <= hi && asym >= lo) {
        ctx.setLineDash([4, 4]); ctx.strokeStyle = C.viz1; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(gx0, Y(asym)); ctx.lineTo(gx1, Y(asym)); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.viz1; ctx.textAlign = "right";
        ctx.fillText("LTV − CAC (lifetime)", gx1 - 4, Y(asym) - 4);
      }

      // classic SaaS ghost
      ctx.strokeStyle = C.viz3; ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.setLineDash([2, 3]);
      ctx.beginPath();
      S.saas.forEach((v, m) => { if (m === 0) ctx.moveTo(X(m), Y(v)); else ctx.lineTo(X(m), Y(v)); });
      ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;

      // main curve up to m
      ctx.lineWidth = 2.5;
      for (let m = 1; m <= S.m; m++) {
        ctx.strokeStyle = S.main[m] < 0 ? C.danger : C.ok;
        ctx.beginPath(); ctx.moveTo(X(m - 1), Y(S.main[m - 1])); ctx.lineTo(X(m), Y(S.main[m])); ctx.stroke();
      }
      // CAC drop
      ctx.strokeStyle = C.danger; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0)); ctx.lineTo(X(0), Y(S.main[0])); ctx.stroke();
      ctx.fillStyle = C.danger; ctx.textAlign = "left";
      ctx.fillText(`−CAC $${S.cac.toLocaleString()}`, X(0) + 6, Y(S.main[0]) + 12);

      // head dot
      ctx.fillStyle = S.main[S.m] < 0 ? C.danger : C.ok;
      ctx.beginPath(); ctx.arc(X(S.m), Y(S.main[S.m]), 4.5, 0, Math.PI * 2); ctx.fill();

      if (S.pb >= 0 && S.m >= S.pb) {
        const px = X(S.pb), py = Y(0);
        ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.stroke();
        env.badge(px, py - 16, `payback · month ${S.pb}`, { color: C.bg, bg: C.accent, size: 10, align: "center" });
      }

      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.ok; ctx.fillText(`━ this business (${(S.gm * 100).toFixed(0)}% margin)`, pad + 8, H - 6);
      ctx.fillStyle = C.viz3; ctx.fillText("┅ same, at classic-SaaS 80% margin", pad + 230, H - 6);
    }
  },

  drill: {
    cards: [
      { q: "Formula for CAC, and the most common way founders understate it?", a: "Sales + marketing spend in a period ÷ new customers in that period. Understated by leaving out salaries (including founder selling time).", tags: ["cac"] },
      { q: "Formula for LTV?", a: "`LTV = ARPA × gross margin ÷ monthly churn` — gross profit, not revenue.", tags: ["ltv"] },
      { q: "Formula for CAC payback in months?", a: "`CAC ÷ (ARPA × gross margin)`.", tags: ["payback"] },
      { q: "Benchmark for LTV:CAC, and what a very high value suggests?", a: "≥ 3:1 is healthy. Above ~5 usually means under-investing in growth.", tags: ["ltv"] },
      { q: "Why do fast-growing startups burn cash even with good unit economics?", a: "Each new customer costs CAC up front and repays it over the payback period, so more customers this month = more cash lent out before it comes back.", tags: ["payback", "cash"] },
      { q: "Why do AI products usually have lower gross margin than classic SaaS?", a: "Every unit of use triggers paid model and API calls, so cost scales with usage: ~50–70% vs 75–85%.", tags: ["gross-margin"] },
      { q: "How do annual upfront plans help?", a: "The year's cash arrives at signup, so CAC is recovered immediately and growth burns far less runway.", tags: ["cash"] },
      { q: "Why lead with payback rather than LTV in an early pitch?", a: "LTV depends on churn, which you can't measure well with few customers. Payback needs only price, margin and CAC.", tags: ["pitch"] }
    ],
    sixtySecond: [
      "Walk through one customer's cash curve: CAC, monthly gross profit, payback, and LTV.",
      "Explain how a 55% vs 80% gross margin changes payback and LTV for the same price and CAC."
    ]
  }
};
