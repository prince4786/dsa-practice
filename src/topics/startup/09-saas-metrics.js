export default {
  id: "saas-metrics",
  track: "startup",
  title: "SaaS Metrics: MRR, Churn, NRR",
  difficulty: 2,
  minutes: 16,
  tags: ["mrr", "arr", "churn", "nrr", "grr", "expansion", "metrics"],

  explainer: [
    { type: "p", text: "A subscription business is a **bucket**. New customers pour revenue in at the top; cancellations and downgrades leak it out of the bottom; existing customers who upgrade add a little more from the inside. Almost every SaaS metric is a way of measuring one of those three flows. Once you see the bucket, the numbers investors ask about stop being jargon and start being a picture." },

    { type: "h3", text: "MRR and ARR" },
    { type: "p", text: "**MRR (monthly recurring revenue)** is the sum of what every active customer pays per month on a subscription. Annual plans count as one twelfth per month. One-off fees (setup, consulting, a pilot paid in one invoice) do **not** count — the word *recurring* is the whole point. **ARR (annual recurring revenue)** is simply `MRR × 12`. Startups usually talk in ARR once they pass about $1M; below that, MRR is the more honest unit." },
    { type: "p", text: "Each month, MRR moves for exactly four reasons, and good founders track them separately:" },
    { type: "list", items: [
      "**New MRR** — revenue from customers who weren't paying last month.",
      "**Expansion MRR** — existing customers paying more: more seats, a higher tier, more usage or credits.",
      "**Contraction MRR** — existing customers paying less but staying: fewer seats, a lower tier.",
      "**Churned MRR** — revenue from customers who cancelled completely."
    ]},
    { type: "code", lang: "pseudo", code: "MRR_end = MRR_start + new + expansion − contraction − churned" },

    { type: "h3", text: "Two kinds of churn" },
    { type: "p", text: "**Logo churn** counts customers: 3 of 100 cancelled = 3% logo churn. **Revenue churn** counts dollars: if those 3 were your three smallest customers, revenue churn might be only 1%. The two can tell very different stories, so report both. Small-business SaaS often sees 3–5% monthly logo churn; enterprise software sees well under 1%." },
    { type: "callout", tone: "warn", text: "Monthly churn compounds. 5% per month sounds small but means you lose **46% of customers in a year** (`1 − 0.95¹² ≈ 0.46`). At 2% per month you lose 22%. Always convert to annual before deciding whether a churn number is acceptable." },

    { type: "h3", text: "NRR and GRR: the best single test of a SaaS business" },
    { type: "p", text: "Take every customer you had exactly 12 months ago. **NRR (net revenue retention)** is what that same group pays you today, divided by what they paid then — counting expansion, contraction and churn, and ignoring all new customers. `NRR = (start + expansion − contraction − churn) / start`. **GRR (gross revenue retention)** is the same but **without** expansion, so it can never exceed 100%: it measures purely how much you keep." },
    { type: "list", items: [
      "**NRR above 100%** means the customers you already have grow by themselves. Even if you stopped selling entirely, revenue would rise. Snowflake and Datadog famously ran above 130%.",
      "**NRR around 100%** means expansion just covers losses. Growth depends entirely on new sales.",
      "**NRR well below 100%** is the leaky bucket: you need ever more new sales just to stand still."
    ]},
    { type: "p", text: "The leak also caps how big you can get. If you add a fixed amount of new MRR each month and lose a fixed *percentage* to net churn, MRR stops growing at `new MRR per month / net monthly churn rate`. Add $8k a month while losing a net 2% a month, and you plateau at $400k MRR no matter how long you wait. The simulation below shows this ceiling as a dashed line." },

    { type: "h3", text: "What investors look at, by stage" },
    { type: "list", items: [
      "**Pre-seed / seed:** evidence people want it — usage, retention of early users, design partners converting to paid, the first $10k–$100k of MRR and its month-over-month growth (15–20%+ is strong).",
      "**Series A:** roughly $1–3M ARR, growing ~3× year over year, with early proof of NRR and payback.",
      "**Later:** the **T2D3** shape — after hitting a few million ARR, triple, triple, double, double, double over five years — plus NRR, gross margin and efficiency (how much new ARR each dollar of burn buys)."
    ]},
    { type: "callout", tone: "pitfall", text: "Don't count pilots, free trials, or a signed-but-unpaid letter of intent as MRR. Investors check this in diligence, and getting caught inflating MRR costs far more trust than the smaller honest number would have." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Set up the MRR movement table before the first invoice.** One row per month: start, new, expansion, contraction, churned, end. A spreadsheet is enough; Stripe exports the data.",
      "**Theoma's product has natural expansion built in.** A workspace that starts with the Marketer can add Sales and Outbound, more seats, or more agent hours. Each of those is expansion MRR — the route to NRR above 100%. Design plans so growing use inside a workspace raises the bill.",
      "**Watch the design-partner → paid conversion closely.** Before MRR is meaningful, the share of design partners who pay, and stay paying after 3 months, is the earliest retention signal Theoma will have.",
      "**Separate pilot revenue from MRR** if early customers pay a one-off fee to try the agents on their own site (the way the Volopay and Ramp demos were run on public sites). Report it, but as pilots."
    ]}
  ],

  glossary: [
    { term: "MRR (monthly recurring revenue)", plain: "The total that all active customers pay you per month on subscriptions, not counting one-off fees." },
    { term: "ARR (annual recurring revenue)", plain: "MRR multiplied by 12." },
    { term: "New MRR", plain: "Monthly revenue added this month by customers who weren't paying before." },
    { term: "Expansion MRR", plain: "Extra monthly revenue from existing customers who upgraded, added seats or used more." },
    { term: "Contraction MRR", plain: "Monthly revenue lost when existing customers downgrade but don't cancel." },
    { term: "Churn", plain: "Customers or revenue lost to cancellations in a period." },
    { term: "Logo churn", plain: "Churn counted in number of customers, regardless of how much each paid." },
    { term: "Revenue churn", plain: "Churn counted in dollars of MRR lost." },
    { term: "NRR (net revenue retention)", plain: "What last year's customers pay you now as a share of what they paid then, including upgrades, downgrades and cancellations. Over 100% means existing customers grow on their own." },
    { term: "GRR (gross revenue retention)", plain: "Like NRR but ignoring upgrades — just how much revenue you kept. Can never exceed 100%." },
    { term: "Leaky bucket", plain: "The picture of a subscription business where new sales pour in at the top while churn leaks out of the bottom." },
    { term: "T2D3", plain: "A growth path investors use as a benchmark: triple revenue two years in a row, then double it three years in a row." },
    { term: "Letter of intent (LOI)", plain: "A written statement that a company plans to buy, which is not a binding purchase or payment." }
  ],

  complexity: {
    rows: [
      { operation: "MoM MRR growth (early, < $1M ARR)", time: "10–15%", space: "20%+", note: "month over month" },
      { operation: "Net revenue retention (NRR)", time: "100–110%", space: "120%+", note: "SMB tools often 90–100%" },
      { operation: "Gross revenue retention (GRR)", time: "85–90%", space: "95%+", note: "annual" },
      { operation: "Monthly logo churn (SMB)", time: "2–3%", space: "< 1.5%", note: "5%/mo = 46% lost per year" },
      { operation: "Year-over-year growth at $1–10M ARR", time: "2×", space: "3× (T2D3)", note: "" }
    ]
  },

  interview: {
    whyAsked: "Theoma will be judged on these numbers from its first paid workspace, and its product shape — add agents, seats and hours inside one workspace — is exactly what drives NRR above 100%. Tracking the four MRR movements separately from day one shows whether growth comes from new sales or from workspaces growing on their own.",
    followUps: [
      { q: "What's your MRR, and what's in it?", a: "Only recurring subscription revenue from paying workspaces, annual plans spread monthly. Pilots, setup fees and unpaid commitments are reported separately. Then give the movement for the last month: new, expansion, contraction, churn." },
      { q: "What's your NRR, and how do you get it above 100%?", a: "Give the number or, if too early, the share of workspaces that expanded. The lever is product shape: a workspace starts with one agent and adds others (Sales, Outbound), more seats and more agent-hours, and pricing makes each of those raise the bill." },
      { q: "Your logo churn is 6% but revenue churn is 2%. Which matters?", a: "Both, but they say different things: small customers are leaving while large ones stay. That suggests focusing the ideal customer on larger teams, and either serving small ones more cheaply or not chasing them." },
      { q: "Why does your growth look like it's flattening?", a: "Check the bucket ceiling: new MRR per month ÷ net churn rate. If MRR is approaching that ceiling, more sales effort alone yields little; reducing churn or adding expansion raises the ceiling itself." },
      { q: "Are you on track for T2D3?", a: "At seed it's too early; the relevant bar is strong month-over-month growth and retention of early customers. Once past roughly $1–2M ARR, show the year-over-year multiple against T2D3." }
    ]
  },

  code: [
    { lang: "python", label: "MRR movements, NRR and GRR", code:
`start, new, expansion, contraction, churned = 50_000, 8_000, 1_500, 500, 2_000
end = start + new + expansion - contraction - churned
print("MRR end:", end, " ARR:", end * 12)

# monthly retention of the starting book (ignore new)
nrr_m = (start + expansion - contraction - churned) / start
grr_m = (start - contraction - churned) / start
print(f"NRR annualised ~{nrr_m ** 12:.0%}   GRR annualised ~{grr_m ** 12:.0%}")` },
    { lang: "python", label: "The leaky-bucket ceiling", code:
`new_mrr_per_month = 8_000
net_churn = 0.03 - 0.01          # churn+contraction minus expansion, per month

ceiling = new_mrr_per_month / net_churn     # 400,000
mrr = 0
for month in range(1, 61):
    mrr = mrr * (1 - net_churn) + new_mrr_per_month
    if month % 12 == 0:
        print(f"year {month // 12}: MRR \${mrr:,.0f}  ({mrr / ceiling:.0%} of ceiling)")` }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 60 },

    params: [
      { key: "newMrr", label: "New MRR / month ($)", type: "int", min: 1000, max: 30000, default: 8000 },
      { key: "churn", label: "Churn %/mo (×0.5)", type: "int", min: 1, max: 20, default: 6 },
      { key: "expansion", label: "Expansion %/mo (×0.5)", type: "int", min: 0, max: 16, default: 3 },
      { key: "seed", label: "New noise", type: "seed" }
    ],

    frames: function* (params, rng) {
      const M = 24;
      const churnR = params.churn * 0.005;
      const expR = params.expansion * 0.005;
      const contrR = 0.005;
      const netR = churnR + contrR - expR;
      const ceiling = netR > 0 ? params.newMrr / netR : null;
      const jit = () => 0.7 + rng() * 0.6;

      let mrr = 0;
      const hist = [0];
      const months = [];
      const snap = (m, cur, label, phase) => {
        // trailing-12-month NRR of the book (approximated from monthly movement rates of the window)
        const win = months.slice(-12);
        let nrr = null, grr = null;
        if (win.length) {
          let n = 1, g = 1;
          win.forEach(x => {
            if (x.start > 0) {
              n *= (x.start + x.exp - x.contr - x.churn) / x.start;
              g *= (x.start - x.contr - x.churn) / x.start;
            }
          });
          const k = 12 / win.length;
          nrr = Math.pow(n, k); grr = Math.pow(g, k);
        }
        return { label, phase, focus: [m], state: { m, M, hist: hist.slice(), cur, ceiling, nrr, grr, netR } };
      };

      yield snap(0, null, `Month 0: MRR $0. Each month adds ~$${params.newMrr.toLocaleString()} of new MRR; ${(churnR * 100).toFixed(1)}% churns, 0.5% contracts, ${(expR * 100).toFixed(1)}% expands.` + (ceiling ? ` Leaky-bucket ceiling: $${Math.round(ceiling).toLocaleString()}.` : " Net churn is negative — no ceiling."), "start");

      for (let m = 1; m <= M; m++) {
        const start = mrr;
        const nw = Math.round(params.newMrr * jit());
        const exp = Math.round(start * expR * jit());
        const contr = Math.round(start * contrR * jit());
        const churn = Math.round(start * churnR * jit());
        mrr = start + nw + exp - contr - churn;
        months.push({ start, nw, exp, contr, churn });
        hist.push(mrr);
        const lost = churn + contr;
        const share = nw > 0 ? lost / nw : 0;
        let label = `Month ${m}: $${start.toLocaleString()} + new $${nw.toLocaleString()} + expansion $${exp.toLocaleString()} − contraction $${contr.toLocaleString()} − churn $${churn.toLocaleString()} = $${mrr.toLocaleString()}.`;
        if (m > 2) label += share > 0.8 ? ` Leaks now eat ${(share * 100).toFixed(0)}% of new sales — growth is stalling.` : share > 0.4 ? ` Leaks eat ${(share * 100).toFixed(0)}% of new sales.` : "";
        yield snap(m, { start, nw, exp, contr, churn, end: mrr }, label, "month");
      }
      const last = snap(M, months[M - 1] ? Object.assign({ end: mrr }, months[M - 1]) : null, "", "done");
      const nrr = last.state.nrr;
      last.label = `After 2 years: MRR $${mrr.toLocaleString()} (ARR $${(mrr * 12).toLocaleString()}). NRR ≈ ${(nrr * 100).toFixed(0)}% — ` +
        (nrr >= 1 ? "existing customers grow by themselves; the bucket has no ceiling." : (ceiling ? `the bucket leaks, and MRR is heading toward its ceiling of $${Math.round(ceiling).toLocaleString()}. Raise expansion or cut churn to lift it.` : "roughly break-even on the existing book."));
      yield last;
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 18;

      ctx.textAlign = "left"; ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`MRR, month ${S.m} of ${S.M}`, pad, 20);
      const stat = (x, t, v, col) => {
        ctx.textAlign = "right"; ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(t, x, 14);
        ctx.fillStyle = col; ctx.font = `bold 14px ${env.font.mono}`; ctx.fillText(v, x, 32);
      };
      const mrr = S.hist[S.hist.length - 1];
      stat(W - pad, "GRR (ann.)", S.grr == null ? "—" : `${(S.grr * 100).toFixed(0)}%`, S.grr == null ? C.muted : S.grr >= 0.9 ? C.ok : S.grr >= 0.8 ? C.warn : C.danger);
      stat(W - pad - 90, "NRR (ann.)", S.nrr == null ? "—" : `${(S.nrr * 100).toFixed(0)}%`, S.nrr == null ? C.muted : S.nrr >= 1 ? C.ok : S.nrr >= 0.85 ? C.warn : C.danger);
      stat(W - pad - 180, "ARR", `$${Math.round(mrr * 12 / 1000)}k`, C.text2);
      stat(W - pad - 260, "MRR", `$${Math.round(mrr / 1000)}k`, C.viz1);

      const top = 50, bot = H - 30;
      const split = Math.round(W * 0.6);

      // ---- left: MRR history ---------------------------------------------
      const lx0 = pad + 44, lx1 = split - 12;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, top - 8, split - pad - 6, bot - top + 26, 8); ctx.fill();
      const maxH = Math.max(1, ...S.hist, S.ceiling && S.ceiling < Math.max(...S.hist) * 3 ? S.ceiling : 0) * 1.08;
      const X = m => lx0 + (m / S.M) * (lx1 - lx0);
      const Y = v => bot - (v / maxH) * (bot - top);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1; ctx.font = `9px ${env.font.mono}`; ctx.fillStyle = C.muted;
      for (let i = 0; i <= 4; i++) {
        const v = maxH * i / 4;
        ctx.beginPath(); ctx.moveTo(lx0, Y(v) + .5); ctx.lineTo(lx1, Y(v) + .5); ctx.stroke();
        ctx.textAlign = "right"; ctx.fillText(`$${Math.round(v / 1000)}k`, lx0 - 4, Y(v) + 3);
      }
      for (let m = 0; m <= S.M; m += 6) { ctx.textAlign = "center"; ctx.fillText(`${m}`, X(m), bot + 12); }

      if (S.ceiling && S.ceiling <= maxH) {
        ctx.setLineDash([5, 4]); ctx.strokeStyle = C.danger; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lx0, Y(S.ceiling)); ctx.lineTo(lx1, Y(S.ceiling)); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.danger; ctx.textAlign = "left";
        ctx.fillText(`leaky-bucket ceiling $${Math.round(S.ceiling / 1000)}k`, lx0 + 4, Y(S.ceiling) - 4);
      }
      const bw = Math.max(2, (lx1 - lx0) / (S.M + 1) * 0.7);
      for (let m = 1; m < S.hist.length; m++) {
        ctx.fillStyle = m === S.m ? C.accent : C.viz1;
        ctx.globalAlpha = m === S.m ? 1 : 0.75;
        const y = Y(S.hist[m]);
        ctx.fillRect(X(m) - bw / 2, y, bw, bot - y);
      }
      ctx.globalAlpha = 1;

      // ---- right: this month's waterfall ----------------------------------
      const rx0 = split + 6, rx1 = W - pad;
      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(rx0, top - 8, rx1 - rx0, bot - top + 26, 8); ctx.fill();
      ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "left";
      ctx.fillText(S.cur ? `Month ${S.m} waterfall` : "Waterfall appears from month 1", rx0 + 10, top + 6);
      if (S.cur) {
        const c = S.cur;
        const steps = [
          { k: "start", v: c.start, base: 0, col: C.muted },
          { k: "new", v: c.nw, base: c.start, col: C.viz1 },
          { k: "expand", v: c.exp, base: c.start + c.nw, col: C.ok },
          { k: "contract", v: -c.contr, base: c.start + c.nw + c.exp, col: C.warn },
          { k: "churn", v: -c.churn, base: c.start + c.nw + c.exp - c.contr, col: C.danger },
          { k: "end", v: c.end, base: 0, col: C.accent }
        ];
        const peak = Math.max(c.start + c.nw + c.exp, c.end, 1) * 1.1;
        const wt = top + 22, wb = bot - 4;
        const WY = v => wb - (v / peak) * (wb - wt);
        const sw = (rx1 - rx0 - 20) / steps.length;
        steps.forEach((s, i) => {
          const x = rx0 + 10 + sw * i + sw * 0.15;
          const a = s.base, b = s.base + s.v;
          const y0 = WY(Math.max(a, b)), y1 = WY(Math.min(a, b));
          ctx.fillStyle = s.col;
          ctx.fillRect(x, y0, sw * 0.7, Math.max(1, y1 - y0));
          ctx.fillStyle = C.text2; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "center";
          const val = s.k === "start" || s.k === "end" ? `$${Math.round(s.v / 1000)}k` : `${s.v >= 0 ? "+" : "−"}$${Math.abs(s.v) >= 1000 ? (Math.abs(s.v) / 1000).toFixed(1) + "k" : Math.abs(s.v)}`;
          ctx.fillText(val, x + sw * 0.35, y0 - 4);
          ctx.fillStyle = C.muted; ctx.fillText(s.k, x + sw * 0.35, bot + 12);
        });
      }
    }
  },

  drill: {
    cards: [
      { q: "What counts as MRR, and what doesn't?", a: "Recurring subscription revenue from paying customers (annual plans ÷ 12). Not setup fees, pilots, trials, or unpaid LOIs.", tags: ["mrr"] },
      { q: "The four MRR movements?", a: "New, expansion, contraction, churned. `MRR_end = start + new + expansion − contraction − churned`.", tags: ["mrr"] },
      { q: "Logo churn vs revenue churn?", a: "Logo churn counts customers lost; revenue churn counts dollars lost. If small customers leave, logo churn > revenue churn.", tags: ["churn"] },
      { q: "5% monthly churn is how much per year?", a: "`1 − 0.95¹² ≈ 46%` of customers lost per year.", tags: ["churn"] },
      { q: "Define NRR and GRR.", a: "NRR = (start + expansion − contraction − churn) ÷ start for a fixed cohort over 12 months. GRR is the same without expansion, so ≤ 100%.", tags: ["nrr"] },
      { q: "What does NRR > 100% mean?", a: "Existing customers' revenue grows on its own: even with zero new sales, revenue would rise.", tags: ["nrr"] },
      { q: "Formula for the leaky-bucket MRR ceiling?", a: "`new MRR per month ÷ net monthly churn rate` (churn + contraction − expansion). If net churn ≤ 0 there's no ceiling.", tags: ["leaky-bucket"] },
      { q: "What does T2D3 stand for?", a: "Triple, triple, double, double, double — five years of annual revenue growth used as a benchmark for venture-scale SaaS after a few $M ARR.", tags: ["growth"] }
    ],
    sixtySecond: [
      "Explain the leaky bucket: the four MRR movements and why net churn sets a ceiling on MRR.",
      "Explain NRR vs GRR and why NRR above 100% is so valuable."
    ]
  }
};
