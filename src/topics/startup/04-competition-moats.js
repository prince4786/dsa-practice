export default {
  id: "competition-moats",
  track: "startup",
  title: "Competition, Wedges & Moats",
  difficulty: 2,
  minutes: 18,
  tags: ["competition", "moats", "wedge", "why-now", "defensibility"],

  explainer: [
    { type: "p", text: "Every good idea attracts competitors. When you start, the question isn't \"does anyone else do this?\" (they do, or will within months). The questions are: **why can this be built now and not five years ago** (your *why now*), **what small, sharp thing gets you your first customers** (your *wedge*), and **what makes customers stay with you even when a copy appears** (your *moat*). These are three different ideas that founders often blur together." },

    { type: "h3", text: "Why now" },
    { type: "p", text: "A **why now** is the change in the world that makes your product possible or necessary today. For Theoma it's clear: in the last two years language models became good enough to use tools, run for many steps, and write marketing copy, research competitors or fix code with little supervision; and protocols such as MCP and ACP (Agent Client Protocol) made it practical to plug different agents into one host. A strong why now explains why the big incumbents haven't done it yet and why you aren't too early. The catch: a why now is visible to everyone. It explains why the market exists, not why *you* win it. That's why the AI agent workspace space is crowded." },

    { type: "h3", text: "The wedge" },
    { type: "p", text: "A **wedge** is the narrow first use case that gets you in the door. It should solve one painful problem so well that customers adopt you even though the rest of your vision isn't built yet. Slack's wedge was team chat for software teams; it grew into the place work happens. A wedge is chosen for *adoption*, not for defensibility; the moat comes later, built on top of the customers the wedge brings in. Theoma's chosen wedge is **Marketing and Sales**: the Marketer goes from a company's URL to a content calendar. The bigger vision, a whole workspace staffed by agents, is what the wedge expands into." },

    { type: "h3", text: "The five common moats" },
    { type: "p", text: "A **moat** is anything that makes it hard for a competitor to take your customers, even if they copy your features. Features themselves are not a moat: with AI writing most of the code, a competent team can copy a feature in weeks. The durable kinds are:" },
    { type: "list", items: [
      "**Switching costs**: leaving you is painful. The customer's history, settings, integrations, trained habits and team workflows live in your product. For a workspace this is natural: months of channels, threads, agent memory and approved brand guidelines are hard to move.",
      "**Network effects**: the product gets more valuable as more people use it. *Direct* network effects: each new member makes it better for the others (a chat app with all your teammates in it). *Cross-company* network effects: your agents can work with another company's agents. These are the strongest moats but the hardest to start, because the product is weak while the network is small.",
      "**Data advantages**: you learn from usage in ways that improve the product. In AI this is often oversold: raw data is rarely a moat by itself. What works is a **feedback loop**: every approved or rejected draft, every edited plan teaches the system what good looks like *for that customer*, so the product gets better the longer they use it.",
      "**Brand**: buyers trust you and think of you first. Slow to build, very durable. Earned through consistent quality, a clear point of view, and being the name people repeat.",
      "**Scale economies**: you get cheaper per customer as you grow, for example bulk pricing on model tokens and data APIs, or spreading fixed engineering costs over more customers. Rarely an early-stage moat."
    ]},
    { type: "callout", tone: "tip", text: "Ask of any moat: **\"if a well-funded team copied every feature tomorrow, why would our customers stay?\"** If the honest answer is \"they wouldn't\", you don't have a moat yet, and that's normal at the start. The job is to choose one and build it on purpose." },

    { type: "h3", text: "\"Isn't it just an AI wrapper?\"" },
    { type: "p", text: "An **AI wrapper** is a product that is a thin interface on top of a model someone else sells, such as Claude or GPT. The fear: the model provider, or anyone with an API key, can build the same thing, and every model upgrade makes your extra work less valuable. The fear is fair for products whose only value is a clever prompt. It's less fair when the product owns things the model doesn't: **the workflow** (where the work happens, who approves what), **the context** (the company's brand, competitors, history, decisions), **integrations** (Search Console, ad platforms, CMSs), and **the team's habits**. A useful test: when a better model comes out, does your product get better (you ride the model) or less needed (the model replaces you)? Theoma's design, swappable harnesses (its own agent, Claude Code, Codex, Goose) inside a workspace that owns the context, is built so that better models make it better." },
    { type: "callout", tone: "pitfall", text: "Don't confuse a head start with a moat. Being first, being faster, or having more features today is an advantage, but it lasts only until someone catches up. Use the head start to build switching costs or network effects before it runs out." },

    { type: "h3", text: "Reading the competition" },
    { type: "p", text: "Theoma's own research (docs/agent-workspaces-yc.md, September 2026) maps the field. **Direct**: Dock (YC S26) runs agent \"crews\" in a shared workspace and markets agent-to-agent handoffs; Pentagon (X26) is a coordination layer where your agents work with your coworkers' agents; Praxos (S24) and Endstack (F24) put agents into channels. YC's own open-source QM gives companies an org agent inside Slack. **Adjacent**: agents that live inside Slack instead of replacing it, such as Tensol, Almanac, OpenTag/Gini, and Sauna (Wordware, with a $30M seed). The Slack-native players have the strongest counter-argument: *\"why switch chat tools at all?\"*. Theoma's answer has to be something those products can't do from inside someone else's chat app, such as agents that decide when to speak, run continuously on the server, and own whole workflows like the marketing chain." },

    { type: "h3", text: "What the visualizer shows" },
    { type: "p", text: "You start with a niche to yourself. Copycats enter on a schedule. Each month new customers choose between you and the rivals, and some existing customers leave for a rival. Change the moat: with **none**, share drains toward an even split; **switching costs** slow the leaks out; **network effects** make your offer stronger as you grow, so a lead tends to stay a lead; a **data** feedback loop makes you better the longer you've been running; **brand** makes you the default choice for new buyers. Copycats entering faster make every moat matter more." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Write down the why now, the wedge and the moat as three separate sentences.** Investors will ask all three. A draft: *why now*: agents can finally do multi-step marketing and sales work; *wedge*: the Marketer, URL to content calendar, for one ICP; *moat*: the workspace that holds each company's context, approvals and team habits, with agents that improve from each approval.",
      "**Build switching costs on purpose in the wedge.** Every approved brand guideline, competitor list, keyword plan and published page should live in Theoma and feed the next run. A customer leaving should feel like leaving a teammate who knows the company.",
      "**Turn approvals into a feedback loop.** When a person approves, edits or rejects a draft, that is training signal for that customer. Make sure it's captured and used, and say so in the product (\"learned from your 14 edits\").",
      "**Don't sell against Dock or Sauna in the beachhead.** Most of your ICP has never heard of them. Sell against the competitive alternative (a founder, ChatGPT, a freelancer). Keep the competitor map for investors and for your own product choices.",
      "**Watch the platforms.** Anthropic, OpenAI, Slack and Notion can all ship agents into their own products. Track their launches monthly and keep asking: does this make Theoma better (a model we can use) or less needed?"
    ]}
  ],

  glossary: [
    { term: "Why now", plain: "The recent change in technology, rules or behaviour that makes your product possible or needed today, and explains why it didn't exist before." },
    { term: "Wedge", plain: "The narrow first use case that gets customers to adopt you, chosen because it's easy to say yes to, before you expand into the bigger product." },
    { term: "Moat", plain: "Anything that keeps customers with you even when a competitor copies your features, named after the water-filled ditch around a castle." },
    { term: "Switching costs", plain: "The time, money, data and effort a customer would lose by moving to a competitor." },
    { term: "Network effect", plain: "When a product becomes more valuable to each user as more people use it, like a phone network or a chat app." },
    { term: "Data feedback loop", plain: "Usage produces data that improves the product, which brings more usage. Only a moat if the improvement is real and hard for others to get." },
    { term: "Brand", plain: "What buyers believe and feel about you, which makes them trust you and think of you first." },
    { term: "Scale economies", plain: "Costs per customer falling as you grow, because fixed costs are shared or you get bulk prices." },
    { term: "AI wrapper", plain: "A product that is mostly a thin interface over someone else's AI model, so it's easy to copy and at risk when the model provider adds the same feature." },
    { term: "Incumbent", plain: "A large, established company already serving the market, such as Slack or Notion here." },
    { term: "Market share", plain: "The fraction of all customers in a market who use you rather than a competitor." },
    { term: "MCP / ACP", plain: "Open protocols that let AI agents connect to tools (Model Context Protocol) and let a host app drive different agents the same way (Agent Client Protocol)." }
  ],

  complexity: {
    rows: [
      { operation: "Time for a competent team to copy a feature", time: "months", space: "years", note: "with AI-written code, often weeks; features alone are not a moat" },
      { operation: "Net revenue retention (sign of switching costs)", time: "100%", space: "120%+", note: "existing customers stay and grow" },
      { operation: "Annual logo retention, SMB SaaS", time: "70–80%", space: "85%+", note: "share of customers still with you after a year" },
      { operation: "Gross margin for AI apps", time: "50–60%", space: "70%+", note: "low margin signals dependence on the model provider" }
    ]
  },

  interview: {
    whyAsked: "Theoma is entering a field where YC alone funded several direct competitors in 2026 and where model providers and Slack can ship agents themselves. \"What stops a well-funded team from copying you?\" is the question every investor will ask, and the honest answer shapes the product: what to store, what to learn from, and which wedge to win first.",
    followUps: [
      { q: "What's your moat?", a: "Be honest about stage: \"Today, speed and a sharp wedge. The moat we're building is switching costs and a feedback loop: each company's brand, competitors, plans and approvals live in Theoma, and every approval makes its agents better for that company. After three months a customer's workspace knows their business; a new tool starts from zero.\"" },
      { q: "Aren't you just a wrapper on Claude?", a: "The model is a component we can swap: Theoma drives its own agent, Claude Code, Codex or Goose. What we own is the workspace: the company's context, the workflow from research to published page, the integrations and the team habits. When a better model ships, our agents get better; nothing we do is replaced by it." },
      { q: "Why won't Slack just add agents?", a: "Slack is adding agents, and Slack-native startups exist. Their constraint is that agents are guests in a chat built for people, mostly triggered by mentions. Theoma is built around agents as members that decide when to speak and run whole workflows server-side. The bet is that this becomes a better way to work for teams that adopt agents heavily, starting with marketing." },
      { q: "Dock does something very similar and is in YC. Why you?", a: "Answer with the wedge and ICP, not features: who you win first and why they pick you. Similar companies in a hot market are normal; most markets support several winners, and early on you compete with the customer's current way of working far more than with each other." },
      { q: "What's the difference between a wedge and a moat?", a: "A wedge is chosen to get adopted quickly: one sharp, easy-to-say-yes-to use case. A moat is what keeps customers once they're in. You win with the wedge first, then build the moat on top of the customers it brings." },
      { q: "Is data a moat for an AI startup?", a: "Rarely by itself: models are trained on public data and competitors can collect similar data. It becomes one when usage creates customer-specific improvement that compounds, like approvals teaching the agent a company's voice, and the customer would lose that by leaving." }
    ]
  },

  code: [
    { lang: "python", label: "A toy share model", code: "# Each month: new customers split by attractiveness; some existing customers leak to rivals.\ndef simulate(months=36, moat=\"none\", rivals_at=(6, 12, 18, 24)):\n    you, rivals = 50.0, []\n    for t in range(months):\n        if t in rivals_at:\n            rivals.append(0.0)\n        new = 20 * 1.05 ** t\n        share = you / (you + sum(rivals))\n        pull = 1.0\n        leak = 0.04 if rivals else 0.0\n        if moat == \"switching\": leak *= 0.3\n        if moat == \"network\":   pull += 4.5 * share; leak *= 1 - 0.8 * share\n        if moat == \"brand\":     pull = 1.6\n        weights = [pull] + [1.0] * len(rivals)\n        total_w = sum(weights)\n        lost = you * leak\n        you += new * pull / total_w - lost\n        rivals = [r + new / total_w + lost / len(rivals) for r in rivals]\n    return you / (you + sum(rivals))\n\nfor m in [\"none\", \"switching\", \"network\", \"brand\"]:\n    print(f\"{m:10} share after 3 years: {simulate(moat=m):.0%}\")" },
    { lang: "pseudo", label: "Why now / wedge / moat, one line each", code: "WHY NOW  Models can finally do multi-step marketing and sales work with tools;\n         MCP/ACP let one host drive many agents.\nWEDGE    The Marketer: URL -> content calendar, for founders doing marketing alone.\nMOAT     The workspace holds each company's context and approvals, and agents\n         improve from every approval. Leaving means starting from zero.\nTEST     If a funded team copied every feature tomorrow, why would customers stay?" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.75, maxFrames: 80 },

    params: [
      { key: "moat",  label: "Moat",  type: "enum", options: ["none", "switching-costs", "network-effects", "data-loop", "brand"], default: "none" },
      { key: "speed", label: "Copycats per year", type: "int", min: 1, max: 6, default: 2 },
      { key: "seed",  label: "New market", type: "seed" }
    ],

    frames: function* (params, rng) {
      const months = 36;
      const moat = params.moat;
      const gap = Math.max(2, Math.round(12 / params.speed));
      const entries = [];
      for (let m = 4; m < months && entries.length < 6; m += gap) entries.push(m + Math.floor(rng() * 2));

      let you = 40;          // customers at month 0: first mover owns the niche
      const rivals = [];     // { start, n, q }
      let cumUse = you;      // customer-months, for the data loop
      const shares = [1];
      const rivalShares = [[]];

      const why = {
        "none": "With no moat, new buyers see near-identical products and leaving is cheap.",
        "switching-costs": "Customers' history and workflows live in your product, so few leave.",
        "network-effects": "Each customer makes you more valuable to the next, so share feeds itself.",
        "data-loop": "Every month of usage improves the product, so you get better the longer you run.",
        "brand": "Buyers think of you first, so you win more of each month's new customers."
      }[moat];

      const snap = (t, label, phase) => ({
        label, phase,
        state: {
          t, months, moat, you,
          rivals: rivals.map(r => r.n),
          entries, shares: shares.slice(),
          rivalShares: rivalShares.map(a => a.slice())
        }
      });

      yield snap(0, `Month 0: you have the niche to yourself with ${you} customers. Moat: ${moat}. ${params.speed} copycat(s) a year will enter. ${why}`, "start");

      for (let t = 1; t <= months; t++) {
        let entered = null;
        if (entries.indexOf(t) !== -1) {
          rivals.push({ start: t, n: 0, q: 0.85 + rng() * 0.3 });
          entered = rivals.length;
        }
        const total = you + rivals.reduce((s, r) => s + r.n, 0);
        const share = you / total;
        const newCust = 14 * Math.pow(1.05, t) * (0.85 + rng() * 0.3);

        // Your pull on new customers, and the fraction of your customers who leak to rivals.
        let pull = 1, leak = rivals.length ? 0.045 : 0;
        if (moat === "switching-costs") leak *= 0.3;
        if (moat === "network-effects") { pull = 1 + 4.5 * share; leak *= 1 - 0.8 * share; }
        if (moat === "data-loop") { pull = 1 + 0.45 * Math.log10(1 + cumUse / 60); leak *= 0.7; }
        if (moat === "brand") { pull = 1.7; leak *= 0.8; }

        const wsum = pull + rivals.reduce((s, r) => s + r.q, 0);
        const lost = you * leak;
        you = you + newCust * pull / wsum - lost;
        rivals.forEach(r => { r.n += newCust * r.q / wsum + (rivals.length ? lost / rivals.length : 0); });
        cumUse += you;

        const tot2 = you + rivals.reduce((s, r) => s + r.n, 0);
        shares.push(you / tot2);
        rivalShares.push(rivals.map(r => r.n / tot2));

        const sh = (100 * you / tot2).toFixed(0);
        let label;
        if (entered) label = `Month ${t}: copycat ${entered} enters with a similar feature set. You hold ${sh}% of customers.`;
        else if (t === months) {
          const even = (100 / (rivals.length + 1)).toFixed(0);
          label = `Month ${t}: ${sh}% share against ${rivals.length} rivals (an even split would be ${even}%). ${moat === "none" ? "A head start fades without a moat." : why}`;
        }
        else label = `Month ${t}: ${Math.round(newCust)} new buyers this month; you win ${Math.round(newCust * pull / wsum)} and lose ${Math.round(lost)} to rivals. Share ${sh}%.`;
        yield snap(t, label, t === months ? "done" : "compete");
      }
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const RC = [C.viz2, C.viz3, C.viz4, C.viz5, C.viz6, C.viz7];
      const pad = 18;

      // ---- stacked share area over time -----------------------------------
      const gx0 = pad + 30, gx1 = W * 0.68, gy0 = pad + 14, gy1 = H - pad - 18;
      const gw = gx1 - gx0, gh = gy1 - gy0;
      const X = t => gx0 + (t / S.months) * gw;
      const Y = v => gy1 - v * gh;

      ctx.fillStyle = C.surface;
      ctx.fillRect(gx0, gy0, gw, gh);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = "right";
      [0, 0.25, 0.5, 0.75, 1].forEach(v => {
        ctx.beginPath(); ctx.moveTo(gx0, Y(v) + 0.5); ctx.lineTo(gx1, Y(v) + 0.5); ctx.stroke();
        ctx.fillText(`${v * 100}%`, gx0 - 5, Y(v) + 3);
      });

      const n = S.shares.length;
      // "You" band at the bottom.
      ctx.fillStyle = C.viz1;
      ctx.beginPath(); ctx.moveTo(X(0), Y(0));
      for (let i = 0; i < n; i++) ctx.lineTo(X(i), Y(S.shares[i]));
      ctx.lineTo(X(n - 1), Y(0)); ctx.closePath(); ctx.fill();

      // Rival bands stacked above.
      const nR = S.rivals.length;
      for (let r = 0; r < nR; r++) {
        const base = i => S.shares[i] + (S.rivalShares[i] || []).slice(0, r).reduce((s, v) => s + v, 0);
        const topv = i => base(i) + ((S.rivalShares[i] || [])[r] || 0);
        ctx.fillStyle = RC[r % RC.length]; ctx.globalAlpha = 0.75;
        ctx.beginPath();
        for (let i = 0; i < n; i++) { const v = topv(i); if (i === 0) ctx.moveTo(X(i), Y(v)); else ctx.lineTo(X(i), Y(v)); }
        for (let i = n - 1; i >= 0; i--) ctx.lineTo(X(i), Y(base(i)));
        ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Entry markers.
      S.entries.forEach((m, i) => {
        if (m > S.t) return;
        ctx.strokeStyle = C.text2; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(X(m) + 0.5, gy0); ctx.lineTo(X(m) + 0.5, gy1); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "center";
        ctx.fillText(`C${i + 1}`, X(m), gy0 - 3);
      });

      ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "center";
      ctx.fillText("months →", gx0 + gw / 2, H - pad + 6);
      ctx.textAlign = "left"; ctx.fillText("0", gx0, gy1 + 12);
      ctx.textAlign = "right"; ctx.fillText(String(S.months), gx1, gy1 + 12);

      // ---- right panel: moat + customer bars -------------------------------
      const lx = gx1 + 22, lw = W - lx - pad;
      ctx.textAlign = "left";
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`;
      ctx.fillText(`Month ${S.t}`, lx, gy0 + 4);
      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(`moat: ${S.moat}`, lx, gy0 + 20);

      const all = [{ name: "You", n: S.you, col: C.viz1 }].concat(S.rivals.map((v, i) => ({ name: `Copycat ${i + 1}`, n: v, col: RC[i % RC.length] })));
      const maxN = Math.max(1, ...all.map(a => a.n));
      const rowH = Math.min(30, (gy1 - gy0 - 40) / Math.max(1, all.length));
      all.forEach((a, i) => {
        const y = gy0 + 38 + i * rowH;
        ctx.fillStyle = i === 0 ? C.text : C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(a.name, lx, y + 10);
        ctx.textAlign = "right"; ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(String(Math.round(a.n)), lx + lw, y + 10);
        ctx.fillStyle = C.surface2; ctx.beginPath(); ctx.roundRect(lx, y + 14, lw, 7, 3.5); ctx.fill();
        ctx.fillStyle = a.col; ctx.beginPath(); ctx.roundRect(lx, y + 14, Math.max(2, lw * a.n / maxN), 7, 3.5); ctx.fill();
      });
    }
  },

  drill: {
    cards: [
      { q: "Why now vs wedge vs moat: one line each.", a: "Why now: the change that makes the product possible today. Wedge: the narrow first use case that gets adoption. Moat: what keeps customers when competitors copy you.", tags: ["concepts"] },
      { q: "Why is a why now not a competitive advantage?", a: "Everyone can see the same change, so it explains why the market exists, not why you win it.", tags: ["why-now"] },
      { q: "Name the five common moats.", a: "Switching costs, network effects, data feedback loops, brand, scale economies.", tags: ["moats"] },
      { q: "Why are features not a moat, especially now?", a: "A competent team, with AI writing much of the code, can copy a feature in weeks.", tags: ["moats"] },
      { q: "When is data a real moat for an AI product?", a: "When usage creates compounding, customer-specific improvement (e.g. approvals teaching the agent a company's voice) that a competitor can't get and the customer would lose by leaving.", tags: ["data"] },
      { q: "The \"AI wrapper\" test?", a: "When a better model ships, does your product get better (you ride it) or less needed (it replaces you)?", tags: ["ai-wrapper"] },
      { q: "Theoma's main moat to build in the wedge?", a: "Switching costs plus a feedback loop: brand, competitors, plans and approvals stored in the workspace, with agents improving from every approval.", tags: ["theoma"] },
      { q: "Head start vs moat?", a: "A head start is temporary: it lasts until someone catches up. A moat keeps working after they do. Use the head start to build the moat.", tags: ["moats"] }
    ],
    sixtySecond: [
      "Explain Theoma's why now, wedge and moat, and how they differ.",
      "Answer \"Aren't you just a wrapper on Claude?\" in under a minute."
    ]
  }
};
