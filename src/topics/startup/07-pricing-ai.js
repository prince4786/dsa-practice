export default {
  id: "pricing-ai",
  track: "startup",
  title: "Pricing an AI Product",
  difficulty: 2,
  minutes: 18,
  tags: ["pricing", "gross-margin", "usage-based", "per-seat", "value-based"],

  explainer: [
    { type: "p", text: "Pricing is the single biggest lever a young company has, and the one founders touch least. A 10% better price drops straight to profit; a 10% better product often doesn't. Engineers tend to price by asking *what does it cost us, plus a bit?* That is **cost-plus pricing**, and it leaves most of the money on the table. The better question is *what is this worth to the customer, and how much of that can we capture?* That is **value-based pricing**. Cost still matters, but as a **floor** you must never go under, not as the thing that sets the price." },
    { type: "p", text: "AI products add a twist that classic software never had. Ordinary SaaS (software you rent monthly over the internet) costs almost nothing extra to serve one more busy customer: a heavy user and a light user both cost a few cents of server time. An AI product pays real money for **every model call** — tokens to Claude or OpenAI, plus paid data APIs. A customer who uses the product ten times more costs you roughly ten times more. So the pricing model you pick decides whether your best customers are your most profitable ones or your most expensive ones." },

    { type: "h3", text: "Value-based pricing in one example" },
    { type: "p", text: "Suppose an agent writes a week of marketing content that would take a contractor 10 hours at $60/hour. That work is worth about **$600** to the customer. If it costs you $15 in model tokens, cost-plus thinking says charge $30. Value-based thinking says the customer would happily pay $150–$200 and still feel they got a bargain. A common rule of thumb is to **capture 10–30% of the value you create**: enough to be a great business, little enough that the customer clearly wins." },
    { type: "callout", tone: "tip", text: "Find the value number by asking customers what they do today *without* you: who does this work, how many hours, at what cost, and what does a mistake cost? Their current spend on the problem (a contractor, an agency, a tool) is your best **price anchor** — the reference point a buyer compares your price against." },

    { type: "h3", text: "The four pricing models" },
    { type: "list", items: [
      "**Per seat** — a fixed price per person per month (Slack, Notion). Easy to understand, easy to budget, revenue grows as the team grows. The risk for AI: a 3-person team that runs agents all day pays the same as a 3-person team that barely uses them, so heavy users can cost more than they pay.",
      "**Usage-based** — charge per unit consumed: per agent-hour, per task, per 1,000 tokens (OpenAI, AWS). Revenue tracks cost, so margin stays safe. The risk: bills are unpredictable, buyers hesitate to use the product (the 'taxi meter' effect), and finance teams hate surprise invoices.",
      "**Outcome-based** — charge only when the work succeeds: per resolved support ticket, per qualified lead, per published article (Intercom's Fin charges per resolution). Lines up perfectly with value, but you eat the cost of every failed attempt, and you must agree with the customer on what counts as 'done'.",
      "**Hybrid: seat + credits** — a base price per seat that includes a monthly allowance of usage (credits), with extra usage billed on top. Most AI products are converging here (Cursor, Lovable, Replit): predictable for the buyer, protected for you, and heavy users pay their own way."
    ]},

    { type: "h3", text: "Tiers and anchoring" },
    { type: "p", text: "Most products show **three tiers** — say Starter, Team, Business. Buyers rarely pick the cheapest or the most expensive; the middle one feels 'safe', so you design the middle tier as the one you want most people on. The expensive top tier does real work even if few buy it: it makes the middle look reasonable (**anchoring**). Tiers should differ by things that track value — number of agents, usage included, integrations, admin and security features — not by arbitrary limits that just annoy people." },
    { type: "callout", tone: "pitfall", text: "**Pricing too low is the common mistake, not pricing too high.** A low price attracts customers who value you least, gives you no margin to pay for sales, and is very hard to raise later. If nobody ever pushes back on your price, it is too low. A good sign is when roughly 1 in 5 prospects says it's expensive but buys anyway." },

    { type: "h3", text: "Gross margin: the number that pricing protects" },
    { type: "p", text: "**Gross margin** is the share of revenue left after paying the direct cost of serving the customer: `(revenue − cost to serve) / revenue`. Classic SaaS runs 75–85%. AI products often land at 50–70% because of model costs. Investors watch this closely, because a business at 40% gross margin has far less money left over to pay for sales, salaries and growth than one at 80%. Your pricing model is the main tool that keeps this number healthy as usage grows." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Price against the hours the agents replace, not against tokens.** Theoma's Marketer goes from a URL to a brand foundation, competitor list, keyword plan and drafts. Ask design partners what that work costs them today (an agency retainer, a freelance SEO, a marketer's week) and anchor on that number.",
      "**Agents that keep working with the laptop closed are a cost risk under per-seat pricing.** An always-on Outbound or Marketer agent can burn far more tokens per seat than a chat app ever would. A seat + credits hybrid (each seat includes, say, N agent-hours; extra hours billed) keeps the heaviest workspaces profitable.",
      "**'Bring your own Claude subscription' is a margin lever.** When a person's agents run on their own desktop subscription, Theoma's model cost for that work is close to zero. That can justify a lower-priced tier for those users, or let Theoma keep the same price with a much higher margin.",
      "**Measure cost per agent-hour now, before charging anyone.** Log tokens and paid-API calls (DataForSEO, Serper, Perplexity) per workspace per agent. Without that number you cannot set a floor, and pricing becomes guesswork.",
      "**Run the pricing conversation with every design partner.** Show three illustrative tiers and ask which they would pick and why. Their pushback is the data."
    ]}
  ],

  glossary: [
    { term: "Cost-plus pricing", plain: "Setting the price as what it costs you to deliver plus a fixed markup. Simple, but it ignores how much the customer would actually pay." },
    { term: "Value-based pricing", plain: "Setting the price as a share of the money, time or risk your product saves the customer." },
    { term: "SaaS", plain: "Software as a Service: software the customer rents monthly or yearly over the internet instead of buying once." },
    { term: "Token", plain: "A small chunk of text (roughly three-quarters of a word) that AI model providers count and charge for, both for what you send in and what comes back." },
    { term: "Per-seat pricing", plain: "A fixed price for each person on the customer's team, every month." },
    { term: "Usage-based pricing", plain: "The customer pays for how much they use: per task, per hour of agent work, per message, and so on." },
    { term: "Outcome-based pricing", plain: "The customer pays only when a defined result happens, such as a support ticket resolved or a lead booked." },
    { term: "Credits", plain: "Prepaid units of usage bundled into a plan. Use them up and you either wait for next month or pay for more." },
    { term: "Price anchor", plain: "The reference number a buyer compares your price against, such as what they pay a contractor today or the price of your most expensive tier." },
    { term: "Tier", plain: "One of a few fixed packages (for example Starter, Team, Business) at different prices with different features or limits." },
    { term: "Gross margin", plain: "The percentage of revenue left after paying the direct costs of serving customers (model tokens, servers, paid APIs). Calculated as (revenue − cost to serve) ÷ revenue." },
    { term: "Price floor", plain: "The lowest price at which you still make money on a customer. Pricing below it loses money on every sale." },
    { term: "Design partner", plain: "An early customer who uses the product before it is finished, gives detailed feedback, and often gets a discount in return." }
  ],

  complexity: {
    rows: [
      { operation: "Gross margin, AI product", time: "50–65%", space: "70%+", note: "classic SaaS runs 75–85%" },
      { operation: "Share of customer value captured", time: "10–20%", space: "20–30%", note: "more than that and buyers feel squeezed" },
      { operation: "Prospects who say 'too expensive'", time: "~10–20%", space: "~20% and still buy", note: "0% means you are underpriced" },
      { operation: "Unprofitable customers in the book", time: "< 10%", space: "0", note: "watch the heaviest users each month" },
      { operation: "Annual-plan discount", time: "15–20%", space: "~17% (2 months free)", note: "buys cash up front and lower churn" }
    ]
  },

  interview: {
    whyAsked: "Theoma's agents do real work on Theoma's model bill, and the workspaces that love it most will run them hardest. The pricing model chosen now decides whether growth improves or erodes gross margin, and investors will ask for that margin from the first pitch.",
    followUps: [
      { q: "Why not just charge per seat like Slack?", a: "Because Slack's cost per busy user is nearly zero and Theoma's is not. A per-seat price works for light users, but an always-on agent team in a heavy workspace could cost more in tokens than the seat brings in. A seat with included credits keeps per-seat simplicity while making heavy usage pay for itself." },
      { q: "How did you arrive at your price?", a: "Start from the work replaced: what the customer pays today for that marketing or sales output (agency, contractor, staff hours). Price at a 10–30% share of that value, check it stays well above our measured cost per agent-hour, and then test it with design partners, watching how many push back." },
      { q: "What is your gross margin, and how does it improve?", a: "Give the measured number, then the levers: model costs fall every year, caching and smaller models cut cost per task, users who run agents on their own Claude subscription cost us almost nothing, and credit-based plans make heavy users pay for heavy use." },
      { q: "Why not purely usage-based so margin is always safe?", a: "Usage pricing makes buyers ration the product — the taxi-meter effect — which is the opposite of what an agent teammate needs. Unpredictable bills also stall procurement. A predictable base plus overage gives the buyer a budget and us a margin." },
      { q: "Would you ever price on outcomes?", a: "Yes, for narrow, measurable jobs once success is reliable — for example per qualified meeting booked by Outbound. It aligns perfectly with value, but we pay for every failed attempt, so it only works once success rates are high and 'success' is easy to verify." },
      { q: "How will you raise prices later without losing customers?", a: "Grandfather existing customers for a period, add value to the plan when raising it, and raise prices on new customers first. It is far easier to start a little high and discount for design partners than to start low and climb." }
    ]
  },

  code: [
    { lang: "python", label: "Revenue, cost and margin per pricing model", code:
`def revenue(model, seats, agent_hours, price):
    """price = headline price per seat per month."""
    if model == "per-seat":
        return seats * price
    if model == "usage":
        return agent_hours * price / 10           # per agent-hour
    if model == "outcome":
        tasks_done = agent_hours * 0.5 * 0.7      # 2 h per task, 70% succeed
        return tasks_done * price / 3.5           # per successful task
    if model == "seat+credits":
        included = seats * 10                      # 10 agent-hours per seat
        overage = max(0, agent_hours - included)
        return seats * price + overage * price / 10

def cost(agent_hours, seats, cost_per_hour, byo=False):
    model_cost = agent_hours * cost_per_hour * (0.15 if byo else 1.0)
    return model_cost + seats * 3                  # $3/seat hosting

customers = [(3, 12), (5, 80), (2, 200), (10, 40)]   # (seats, agent_hours)
for m in ["per-seat", "usage", "outcome", "seat+credits"]:
    rev = sum(revenue(m, s, h, 60) for s, h in customers)
    cst = sum(cost(h, s, 1.5) for s, h in customers)
    print(f"{m:13} revenue \${rev:7.0f}  margin {(rev - cst) / rev:6.1%}")` },
    { lang: "python", label: "Value-based price from hours replaced", code:
`hours_replaced = 10          # per week, per workspace
hourly_rate    = 60          # what that work costs them today
weekly_value   = hours_replaced * hourly_rate        # $600
monthly_value  = weekly_value * 4.3                  # ~$2,580

for capture in (0.10, 0.20, 0.30):
    print(f"capture {capture:.0%}: ~\${monthly_value * capture:,.0f}/month")` }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 120 },

    params: [
      { key: "model", label: "Pricing model", type: "enum", options: ["per-seat", "usage", "outcome", "seat+credits"], default: "per-seat" },
      { key: "price", label: "Seat price ($/mo)", type: "int", min: 20, max: 200, default: 60 },
      { key: "costCents", label: "Model cost / agent-hour (¢)", type: "int", min: 25, max: 600, default: 150 },
      { key: "byo", label: "Heavy users bring own Claude", type: "bool", default: false },
      { key: "seed", label: "New customers", type: "seed" }
    ],

    frames: function* (params, rng) {
      const N = 24;
      const P = params.price;
      const cph = params.costCents / 100;
      const model = params.model;

      // Usage is heavily skewed: most workspaces are light, a few run agents all day.
      const cust = [];
      for (let i = 0; i < N; i++) {
        const seats = 1 + Math.floor(Math.pow(rng(), 2) * 12);
        const perSeat = 2 + Math.pow(rng(), 3) * 70;           // agent-hours per seat per month
        const hours = Math.round(seats * perSeat);
        cust.push({ seats, hours, byo: false });
      }
      cust.sort((a, b) => a.hours / a.seats - b.hours / b.seats);
      if (params.byo) {
        // the heaviest third tend to be technical teams with their own subscriptions
        for (let i = Math.floor(N * 2 / 3); i < N; i++) if (rng() < 0.7) cust[i].byo = true;
      }

      const rev = c => {
        if (model === "per-seat") return c.seats * P;
        if (model === "usage") return c.hours * P / 10;
        if (model === "outcome") return c.hours * 0.5 * 0.7 * P / 3.5;
        const over = Math.max(0, c.hours - c.seats * 10);
        return c.seats * P + over * P / 10;
      };
      const cost = c => c.hours * cph * (c.byo ? 0.15 : 1) + c.seats * 3;
      cust.forEach(c => { c.rev = Math.round(rev(c)); c.cost = Math.round(cost(c)); });

      const describe = {
        "per-seat": `$${P} per seat, unlimited agent use`,
        "usage": `$${(P / 10).toFixed(2)} per agent-hour, no seat fee`,
        "outcome": `$${(P / 3.5).toFixed(2)} per successful task (70% of tasks succeed)`,
        "seat+credits": `$${P}/seat incl. 10 agent-hours/seat, then $${(P / 10).toFixed(2)}/hour`
      }[model];

      let shown = 0;
      const snap = (label, phase, focus) => {
        const vis = cust.slice(0, shown);
        const R = vis.reduce((s, c) => s + c.rev, 0);
        const K = vis.reduce((s, c) => s + c.cost, 0);
        return {
          label, phase, focus: focus == null ? [] : [focus],
          state: {
            model, describe, cph, byo: params.byo,
            cust: cust.map(c => ({ seats: c.seats, hours: c.hours, rev: c.rev, cost: c.cost, byo: c.byo })),
            shown, R, K,
            margin: R > 0 ? (R - K) / R : 0,
            losers: vis.filter(c => c.rev < c.cost).length
          }
        };
      };

      yield snap(`${N} illustrative workspaces, sorted from lightest to heaviest agent use per seat. Pricing: ${describe}. Model cost ${(cph).toFixed(2)} $/agent-hour plus $3/seat hosting.`, "setup", null);

      for (let i = 0; i < N; i++) {
        shown = i + 1;
        const c = cust[i];
        const m = c.rev > 0 ? (c.rev - c.cost) / c.rev : -1;
        let why;
        if (c.rev < c.cost) why = `LOSES $${c.cost - c.rev}/mo — they pay $${c.rev} but cost $${c.cost}` + (model === "per-seat" ? ": heavy use, flat price." : model === "outcome" ? ": failed tasks still burn tokens." : ".");
        else why = `pays $${c.rev}, costs $${c.cost} → ${(m * 100).toFixed(0)}% margin` + (c.byo ? " (runs on their own Claude subscription, so model cost is tiny)." : ".");
        yield snap(`Workspace ${i + 1}: ${c.seats} seat${c.seats > 1 ? "s" : ""}, ${c.hours} agent-hours/mo — ${why}`, "customers", i);
      }

      const fin = snap("", "done", null);
      const S = fin.state;
      const verdict = S.margin >= 0.7 ? "healthy, near classic SaaS"
        : S.margin >= 0.5 ? "typical for an AI product"
        : S.margin >= 0 ? "too thin to fund growth"
        : "losing money overall";
      fin.label = `Book total: revenue $${S.R.toLocaleString()}, cost $${S.K.toLocaleString()}, gross margin ${(S.margin * 100).toFixed(0)}% (${verdict}). ${S.losers} of ${N} workspaces are unprofitable. Switch the pricing model or toggle 'bring own Claude' and compare.`;
      yield fin;
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 18;
      const N = S.cust.length;

      // ---- header stats -----------------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`Model: ${S.model}`, pad, 20);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(S.describe, pad, 36);

      const stat = (x, title, val, col) => {
        ctx.textAlign = "right";
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(title, x, 16);
        ctx.fillStyle = col; ctx.font = `bold 15px ${env.font.mono}`;
        ctx.fillText(val, x, 34);
      };
      const mcol = S.margin >= 0.7 ? C.ok : S.margin >= 0.5 ? C.warn : C.danger;
      stat(W - pad, "unprofitable", `${S.losers}/${S.shown}`, S.losers ? C.danger : C.ok);
      stat(W - pad - 100, "gross margin", S.shown ? `${(S.margin * 100).toFixed(0)}%` : "—", S.shown ? mcol : C.muted);
      stat(W - pad - 200, "cost", `$${S.K.toLocaleString()}`, C.viz2);
      stat(W - pad - 300, "revenue", `$${S.R.toLocaleString()}`, C.viz1);

      // ---- bars ---------------------------------------------------------------
      const top = 56, base = H - 48;
      const x0 = pad + 34, x1 = W - pad;
      const maxV = Math.max(1, ...S.cust.map(c => Math.max(c.rev, c.cost)));
      const slot = (x1 - x0) / N;
      const bw = Math.max(3, slot * 0.36);

      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(pad, top - 6, W - pad * 2, base - top + 40, 8); ctx.fill();

      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = base - (base - top) * i / 4;
        ctx.beginPath(); ctx.moveTo(x0, y + .5); ctx.lineTo(x1, y + .5); ctx.stroke();
        ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "right";
        ctx.fillText(`$${Math.round(maxV * i / 4)}`, x0 - 4, y + 3);
      }

      for (let i = 0; i < N; i++) {
        const c = S.cust[i];
        const cx = x0 + slot * (i + 0.5);
        const vis = i < S.shown;
        const loser = c.rev < c.cost;
        if (vis && loser) {
          ctx.fillStyle = C.danger; ctx.globalAlpha = 0.14;
          ctx.fillRect(cx - slot / 2 + 1, top, slot - 2, base - top);
          ctx.globalAlpha = 1;
        }
        if (frame.focus && frame.focus[0] === i) {
          ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5;
          ctx.strokeRect(cx - slot / 2 + 1, top - 2, slot - 2, base - top + 4);
        }
        ctx.globalAlpha = vis ? 1 : 0.12;
        const hr = (c.rev / maxV) * (base - top);
        const hc = (c.cost / maxV) * (base - top);
        ctx.fillStyle = C.viz1;
        ctx.fillRect(cx - bw - 1, base - hr, bw, hr);
        ctx.fillStyle = loser && vis ? C.danger : C.viz2;
        ctx.fillRect(cx + 1, base - hc, bw, hc);
        ctx.globalAlpha = 1;
        ctx.fillStyle = vis ? C.text2 : C.muted;
        ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "center";
        if (slot > 18 || i % 2 === 0) ctx.fillText(`${c.hours}h`, cx, base + 12);
        if (c.byo && vis) { ctx.fillStyle = C.viz4; ctx.fillText("byo", cx, base + 23); }
      }

      ctx.strokeStyle = C.axis;
      ctx.beginPath(); ctx.moveTo(x0, base + .5); ctx.lineTo(x1, base + .5); ctx.stroke();

      ctx.textAlign = "left"; ctx.font = `10px ${env.font.mono}`;
      ctx.fillStyle = C.viz1; ctx.fillText("■ revenue / mo", pad + 8, H - 8);
      ctx.fillStyle = C.viz2; ctx.fillText("■ cost to serve", pad + 118, H - 8);
      ctx.fillStyle = C.danger; ctx.fillText("■ unprofitable", pad + 228, H - 8);
      ctx.fillStyle = C.muted; ctx.textAlign = "right";
      ctx.fillText("x-axis: agent-hours per month, lightest → heaviest per seat", W - pad, H - 8);
    }
  },

  drill: {
    cards: [
      { q: "Cost-plus vs value-based pricing — what's the difference?", a: "Cost-plus = your cost plus a markup. Value-based = a share (often 10–30%) of what the product is worth to the customer. Cost sets the **floor**; value sets the price.", tags: ["pricing"] },
      { q: "Why is per-seat pricing riskier for an AI product than for Slack?", a: "Each unit of AI usage costs real money in tokens. Under a flat seat price, a heavy-use workspace can cost more to serve than it pays, so your best users become your least profitable.", tags: ["per-seat"] },
      { q: "Name the four common pricing models.", a: "Per seat, usage-based, outcome-based, and hybrid (seat + included credits with overage).", tags: ["models"] },
      { q: "What is the 'taxi-meter effect'?", a: "Under pure usage pricing, buyers ration their use because every action visibly costs money — bad for a product that needs heavy use to show its value.", tags: ["usage-based"] },
      { q: "Define gross margin and give typical SaaS vs AI ranges.", a: "`(revenue − cost to serve) / revenue`. Classic SaaS 75–85%; AI products often 50–70% because of model and API costs.", tags: ["gross-margin"] },
      { q: "Why show three tiers?", a: "Buyers gravitate to the middle; the top tier anchors the middle as reasonable. Design the middle tier as the one you want most customers on.", tags: ["tiers"] },
      { q: "What sign tells you you're underpriced?", a: "Nobody ever pushes back on price. Roughly 1 in 5 prospects saying 'expensive' but buying anyway is healthy.", tags: ["pricing"] },
      { q: "How does 'bring your own Claude subscription' affect Theoma's economics?", a: "Work run on the user's own subscription costs Theoma almost no model spend, so those users carry a much higher gross margin — room for a cheaper tier or more profit at the same price.", tags: ["theoma"] }
    ],
    sixtySecond: [
      "Explain why an AI product's choice of pricing model affects its gross margin more than a classic SaaS product's does.",
      "Pitch a pricing model for Theoma and defend it against 'why not just per seat?'"
    ]
  }
};
