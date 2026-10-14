export default {
  id: "fundraising-safes",
  track: "startup",
  title: "Fundraising, SAFEs & Dilution",
  difficulty: 2,
  minutes: 18,
  tags: ["fundraising", "safe", "valuation-cap", "dilution", "cap-table", "option-pool"],

  explainer: [
    { type: "p", text: "Raising venture money means **selling a slice of the company in exchange for cash** to spend on growing faster than revenue alone would allow. Every slice you sell makes your own slice smaller; that shrinking is called **dilution**. Dilution isn't bad in itself — 60% of a company worth $100M is far more than 100% of one worth $1M — but founders who don't understand the mechanics routinely give away more than they meant to. This lesson walks through the instruments early startups actually use, and the one spreadsheet that tracks who owns what: the **cap table** (short for capitalization table)." },

    { type: "h3", text: "Raise at all? Bootstrapping vs venture money" },
    { type: "p", text: "**Bootstrapping** means growing on revenue (and the founders' savings) without outside investors. You keep all the ownership and control, but you grow only as fast as customers pay you. **Venture capital** (VC) buys speed: money to hire and build before revenue justifies it. The catch is that VCs need a few of their investments to become enormous to pay for all the ones that fail, so taking VC money signals that you're aiming for a very large outcome and will keep raising and growing fast. For an AI product with real per-use costs, competing against well-funded rivals (Sauna raised a $30M seed), raising is usually the default — but it's a choice, not a law." },

    { type: "h3", text: "The stages, roughly" },
    { type: "list", items: [
      "**Pre-seed** — the first outside money, often $250k–$2M, from angels (individuals investing their own money), accelerators, or small funds. Investors are betting mostly on the **team** and the size of the problem. Often raised on SAFEs.",
      "**Seed** — commonly $1M–$5M (larger for AI companies lately). Investors want early proof: users who keep coming back, first revenue, design partners — real companies using the product for free or cheaply in exchange for feedback. SAFEs or a first priced round.",
      "**Series A** — often $8M–$20M+, a priced round led by a VC firm that takes a board seat. The bar is evidence of a repeatable business: something like $1M–$3M ARR growing fast, with good retention.",
      "**Accelerators** like Y Combinator invest a fixed amount on standard terms (YC's standard deal in recent batches has been $500k: $125k for 7% on a post-money SAFE plus $375k on an uncapped SAFE that takes the best terms of the next round — check the current terms on its site), run a three-month programme, and end with Demo Day, where the batch pitches to investors."
    ]},

    { type: "h3", text: "The SAFE: invest now, price later" },
    { type: "p", text: "Valuing a company with no revenue is guesswork, and negotiating that guess costs time and legal fees. So most pre-seed money uses a **SAFE** (Simple Agreement for Future Equity), a short standard contract created by Y Combinator. The investor gives you money *today*; in return they get the right to shares *later*, when you do a proper **priced round** (a round where investors buy shares at an agreed price per share). Until then, the SAFE isn't shares at all — it's a promise." },
    { type: "p", text: "The key term is the **valuation cap**. With a **post-money SAFE** (the standard since 2018), the investor's ownership is easy to compute: `ownership = investment ÷ post-money cap`. $500k on a $10M cap means the investor will own 5% of the company *as it stands just before the priced round's new money*. Many SAFEs also have a **discount** (say 20% off the next round's price) — the investor gets whichever of cap or discount gives them more shares." },
    { type: "callout", tone: "pitfall", text: "SAFEs don't show up on the cap table until they convert, so founders stacking several of them feel no dilution — and then discover at the priced round that they sold 20–25% of the company. Every SAFE's ownership simply adds up: three $1M SAFEs at a $10M post-money cap is 30% gone. Keep a 'pro forma' cap table (what it will look like after conversion) from the very first SAFE." },

    { type: "h3", text: "The priced round and the option pool shuffle" },
    { type: "p", text: "In a priced round the investor and founders agree a **pre-money valuation** (what the company is worth before the new money) and the investor adds their cash: `post-money = pre-money + raise`, and the new investor owns `raise ÷ post-money`. At that moment, three things happen at once, and the visualizer steps through them:" },
    { type: "list", items: [
      "**The SAFEs convert** into real shares at their capped price, diluting the founders.",
      "**An option pool is created or topped up.** An option pool is a block of shares reserved for future employees' stock options. Investors usually require it to be, say, 10% of the company *after* the round.",
      "**The new money comes in**, diluting everyone who held shares before it."
    ]},
    { type: "p", text: "The subtle part is called the **option pool shuffle**: investors ask for the pool to be created *before* their money comes in, so that the pool dilutes only the existing holders (founders and SAFE holders), never the new investor. The result is that a '$12M pre-money' term sheet with a 10% post-money pool is really worth less to the founders than $12M — the visualizer shows this as the **effective pre-money**. It's a normal, accepted practice; the move is to negotiate the pool size against an actual hiring plan rather than accept a round number." },
    { type: "p", text: "**Pro rata rights** let an investor buy enough of each future round to keep their percentage from shrinking. They're standard for lead investors and often given to SAFE holders through a side letter; they matter because they take up room in your future rounds." },

    { type: "h3", text: "What investors want from a pre-revenue AI startup" },
    { type: "list", items: [
      "**Why this team**: a specific reason you'll win, e.g. you've shipped the hard technical part already.",
      "**Why now**: what changed (models got good enough to run as teammates in 2025–26) that makes this possible today and not three years ago.",
      "**Proof of pull**: a waitlist that converts, design partners who use it weekly, any paying customer at all. In AI, investors are wary of demos; they want usage.",
      "**A defensible angle against funded rivals and the model labs**: what you'll have in two years that a better model alone won't give a competitor.",
      "**Sane unit economics**: what a customer costs to serve in tokens and APIs, and why that improves."
    ]},

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Build the pro forma cap table before the first SAFE**, using the Python below. Every number for Theoma is illustrative until you sign something; the point is to see founder ownership after the next two rounds, not just the next one.",
      "**Aim to keep the founders above ~50–60% combined after seed** — a common rule of thumb, since Series A and later rounds will take another 20–25% each.",
      "**Turn the repo into proof**: the demo workspaces on real companies' sites (Volopay, Ramp) are good for showing the product; investors will weigh *real* weekly usage by design partners far more. A small number of companies running the Marketer every week beats a long waitlist.",
      "**Have a crisp answer to the crowded-market question**: Dock, Pentagon, Praxos and the Slack-agent players exist. Theoma's answer — agents that behave like teammates rather than mention-driven sessions, with Marketing and Sales as the first jobs — needs a usage number behind it.",
      "If applying to YC or similar, know the standard deal terms in advance so the decision is about the programme's value, not the paperwork."
    ]},
    { type: "callout", tone: "warn", text: "This lesson explains mechanics; it isn't legal or tax advice. Have a startup lawyer review any SAFE or term sheet before signing, especially when founders and the company sit in different countries." }
  ],

  glossary: [
    { term: "Dilution", plain: "Your percentage of the company shrinking because new shares were created for someone else." },
    { term: "Cap table (capitalization table)", plain: "The spreadsheet listing who owns how many shares of the company." },
    { term: "Pro forma cap table", plain: "The cap table as it will look after promised shares (like SAFEs) turn into real ones." },
    { term: "Bootstrapping", plain: "Growing a company on its own revenue and the founders' money, without outside investors." },
    { term: "Venture capital (VC)", plain: "Professional investors who fund young, risky companies hoping a few become huge." },
    { term: "Angel investor", plain: "An individual who invests their own money in early startups." },
    { term: "Accelerator", plain: "A programme, like Y Combinator, that invests a standard amount in many startups at once and coaches them for a few months." },
    { term: "Design partner", plain: "An early customer who uses the product, often free or cheap, in exchange for detailed feedback that shapes it." },
    { term: "SAFE", plain: "Simple Agreement for Future Equity: money given now in exchange for shares later, when a priced round happens." },
    { term: "Valuation cap", plain: "The maximum company value at which a SAFE converts into shares, protecting the early investor's percentage." },
    { term: "Post-money SAFE", plain: "A SAFE whose cap includes the SAFE money itself, so the investor's ownership is simply investment divided by cap." },
    { term: "Discount", plain: "A SAFE term giving the investor a lower share price than the next round's investors, e.g. 20% off." },
    { term: "Priced round", plain: "A fundraise where investors buy shares at an agreed price per share, setting an official valuation." },
    { term: "Pre-money / post-money valuation", plain: "The company's agreed value just before the new money comes in, and just after (pre-money plus the money raised)." },
    { term: "Option pool", plain: "Shares set aside to give future employees as stock options." },
    { term: "Option pool shuffle", plain: "Creating the option pool before the new investment so only existing owners are diluted by it." },
    { term: "Effective pre-money", plain: "What the existing owners' shares are really valued at once the pre-money option pool is taken out." },
    { term: "Pro rata rights", plain: "An investor's right to buy into future rounds enough to keep their percentage the same." },
    { term: "Demo Day", plain: "The event at the end of an accelerator where each startup pitches to a room of investors." }
  ],

  complexity: {
    rows: [
      { operation: "Dilution per round (pre-seed, seed, A)", time: "15–25%", space: "10–15%", note: "sum of SAFEs + new money + pool top-up" },
      { operation: "Founders' combined ownership after seed", time: "50–65%", space: "70%+", note: "rule of thumb, not a law" },
      { operation: "Option pool after a priced round", time: "10–15%", space: "sized to a real hiring plan", note: "bigger pool = lower effective pre-money" },
      { operation: "Months of runway a round should buy", time: "18–24", space: "24+", note: "see Burn & Runway" },
      { operation: "Time from first meeting to money in bank", time: "2–4 months", space: "< 6 weeks", note: "with a hot round" }
    ]
  },

  interview: {
    whyAsked: "Theoma will raise, likely starting with SAFEs, in a crowded agent-workspace market where some rivals already have big rounds. Knowing exactly how much of the company each SAFE and each pool request takes lets the founders negotiate from numbers instead of feelings, and keep enough ownership to stay motivated and in control through Series A.",
    followUps: [
      { q: "How much are you raising, and what will it get you?", a: "Give a number tied to milestones and months: 'we're raising $X, which gives us 20 months to reach Y design partners converting to paid and $Z MRR — the proof a Series A needs.' Investors fund milestones, not burn." },
      { q: "What's your cap?", a: "Know the range comparable companies raise at, and anchor on what the milestones justify. A higher cap means less dilution, but a cap far above your progress makes the next priced round hard (a 'down round' risk). Many founders let investor demand set the cap." },
      { q: "Why SAFEs and not a priced round?", a: "They're quick, cheap and standard, and they defer the valuation argument until there's data. The cost is hidden dilution that stacks up; a pro forma cap table fixes that." },
      { q: "We want a 15% option pool, pre-money.", a: "Ask what hiring it's meant to cover. Show a 12–18 month hiring plan with the options each role needs; if it adds to 9%, propose 10%. Every point of pool comes out of the founders' effective pre-money, not the investor's." },
      { q: "Why won't OpenAI or Anthropic just build this?", a: "Answer with what compounds inside your product and not inside a model: workspace context, team-specific workflows, integrations with the tools marketing and sales teams already pay for, and the trust of being in the team chat every day. Being model-agnostic (Claude, Codex, Goose over one protocol) also helps." },
      { q: "Do your SAFE investors get pro rata?", a: "Know which do. Pro rata rights reserve room in later rounds; too many can crowd out a new lead investor, so grant them deliberately, usually to the investors adding the most value." }
    ]
  },

  code: [
    { lang: "python", label: "Pro forma cap table: SAFE + pool + priced round", code: "def priced_round(founder_shares, safes, pre_money, raise_amt, pool_pct_post):\n    \"\"\"safes: list of (amount, post_money_cap). Returns ownership fractions after the round.\n    Pool is created pre-money (the 'shuffle'): it dilutes founders and SAFE holders only.\"\"\"\n    safe_pct = sum(a / cap for a, cap in safes)          # post-money SAFE math\n    safe_shares = founder_shares * safe_pct / (1 - safe_pct)\n    existing = founder_shares + safe_shares\n    post = pre_money + raise_amt\n    new_pct = raise_amt / post\n    total = existing / (1 - new_pct - pool_pct_post)     # solve for post-round share count\n    out = {\n        'founders': founder_shares / total,\n        'safes': safe_shares / total,\n        'pool': pool_pct_post,\n        'new_investor': new_pct,\n    }\n    out['effective_pre_money'] = (founder_shares + safe_shares) / total * post\n    return out\n\n# Illustrative only:\nr = priced_round(10_000_000, safes=[(500_000, 10_000_000)],\n                 pre_money=12_000_000, raise_amt=3_000_000, pool_pct_post=0.10)\nfor k, v in r.items():\n    print(k, f'{v:.1%}' if v < 1 else f'${v:,.0f}')" },
    { lang: "python", label: "Stacking SAFEs: the hidden dilution", code: "safes = [(250_000, 6_000_000), (500_000, 10_000_000), (1_000_000, 15_000_000)]\ntotal = sum(a / cap for a, cap in safes)\nprint(f'SAFEs will own {total:.1%} before the priced round even starts')  # ~16.8%" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 40 },

    params: [
      { key: "cap",   label: "SAFE cap ($M, post)",  type: "int", min: 2,  max: 40, default: 10 },
      { key: "safe",  label: "SAFE amount ($k)",     type: "int", min: 100, max: 3000, default: 500 },
      { key: "pre",   label: "Round pre-money ($M)", type: "int", min: 4,  max: 80, default: 12 },
      { key: "raise", label: "Round raise ($M)",     type: "int", min: 1,  max: 25, default: 3 },
      { key: "pool",  label: "Option pool (% post)", type: "int", min: 0,  max: 25, default: 10 }
    ],

    frames: function* (params) {
      const F = 10000000;
      const pct = x => `${(x * 100).toFixed(1)}%`;
      const capD = params.cap * 1e6, safeD = params.safe * 1e3, preD = params.pre * 1e6, raiseD = params.raise * 1e3 * 1e3;
      const s = Math.min(0.6, safeD / capD);
      const safeSh = F * s / (1 - s);
      const post = preD + raiseD;
      let n = raiseD / post, p = params.pool / 100;
      let clipped = false;
      if (n + p > 0.85) { p = Math.max(0, 0.85 - n); clipped = true; }
      const existing = F + safeSh;
      const total = existing / (1 - n - p);
      const poolSh = p * total, newSh = n * total;
      const effPre = existing / total * post;
      const fmtM = d => `$${(d / 1e6).toFixed(2)}M`;

      const stage = (cols, active, label, phase) => ({ label, phase, focus: [active], state: { cols, active, F, effPre, pre: preD, post } });
      const col = (name, rows) => ({ name, rows }); // rows: [{who, shares}]
      const c0 = col("Founders only", [{ who: "founders", shares: F }]);
      const c1 = col("SAFE signed", [{ who: "founders", shares: F }, { who: "safe-pending", shares: safeSh }]);
      const c2 = col("SAFE converts", [{ who: "founders", shares: F }, { who: "safe", shares: safeSh }]);
      const c3 = col("Pool added", [{ who: "founders", shares: F }, { who: "safe", shares: safeSh }, { who: "pool", shares: poolSh }]);
      const c4 = col("New money in", [{ who: "founders", shares: F }, { who: "safe", shares: safeSh }, { who: "pool", shares: poolSh }, { who: "investor", shares: newSh }]);
      const all = [c0, c1, c2, c3, c4];

      yield stage(all.slice(0, 1), 0, `The founders own 100%: ${F.toLocaleString("en-US")} shares. (Split among themselves however they agreed — see the next lesson.)`, "founders");
      yield stage(all.slice(0, 2), 1, `A $${params.safe}k post-money SAFE at a $${params.cap}M cap is signed. No shares exist yet — it's a promise of ${pct(s)} (= ${params.safe}k ÷ ${params.cap}M). The official cap table still says founders 100%; the dashed slice is the dilution you can't see.`, "safe");
      yield stage(all.slice(0, 3), 2, `Priced round agreed: ${fmtM(preD)} pre-money, ${fmtM(raiseD)} raise. First the SAFE converts into ${Math.round(safeSh).toLocaleString("en-US")} real shares. Founders: ${pct(F / existing)}, SAFE holder: ${pct(s)}.`, "conversion");
      yield stage(all.slice(0, 4), 3, `Option pool shuffle: ${Math.round(poolSh).toLocaleString("en-US")} shares are reserved for future hires before the new money arrives, sized to be ${pct(p)} after the round${clipped ? " (clipped so the round still adds up)" : ""}. Only founders and the SAFE holder are diluted by it.`, "pool");
      yield stage(all, 4, `The new investor puts in ${fmtM(raiseD)} and gets ${pct(n)} (= ${fmtM(raiseD)} ÷ ${fmtM(post)} post-money). Founders end at ${pct(F / total)}.`, "new money");
      yield stage(all, 4, `Effective pre-money: the term sheet said ${fmtM(preD)}, but the shares that existed before the round (founders + SAFE) are worth ${fmtM(effPre)} at the new price — the pool came out of the founders' side. Try a smaller pool, or a higher cap, and watch the founders' slice grow.`, "done");
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const colors = { founders: C.viz1, "safe-pending": C.viz2, safe: C.viz2, pool: C.viz4, investor: C.viz3 };
      const names = { founders: "Founders", "safe-pending": "SAFE (promised)", safe: "SAFE holder", pool: "Option pool", investor: "New investor" };

      const top = 46, bottom = H - 44, slots = 5, padX = 24;
      const slotW = (W - padX * 2) / slots, barW = Math.min(96, slotW * 0.62);

      ctx.textAlign = "left"; ctx.font = `13px ${env.font.base}`; ctx.fillStyle = C.text;
      ctx.fillText("Cap table, stage by stage (each bar = 100% of the company)", padX, 22);

      S.cols.forEach((c, i) => {
        const cx = padX + slotW * (i + 0.5), x = cx - barW / 2;
        const tot = c.rows.reduce((a, r) => a + (r.who === "safe-pending" ? 0 : r.shares), 0);
        const totPro = c.rows.reduce((a, r) => a + r.shares, 0);
        let y = bottom;
        const active = i === S.active;
        ctx.globalAlpha = active ? 1 : 0.55;
        c.rows.forEach(r => {
          const frac = r.shares / totPro;
          const h = frac * (bottom - top);
          y -= h;
          ctx.fillStyle = colors[r.who];
          if (r.who === "safe-pending") {
            ctx.globalAlpha = (active ? 1 : 0.55) * 0.35;
            ctx.fillRect(x, y, barW, h);
            ctx.globalAlpha = active ? 1 : 0.55;
            ctx.strokeStyle = C.viz2; ctx.setLineDash([4, 3]); ctx.lineWidth = 1.5;
            ctx.strokeRect(x + .75, y + .75, barW - 1.5, h - 1.5); ctx.setLineDash([]);
          } else ctx.fillRect(x, y, barW, h);
          if (h > 16) {
            ctx.fillStyle = C.bg; ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "center";
            if (r.who === "safe-pending") ctx.fillStyle = C.text;
            ctx.fillText(`${(frac * 100).toFixed(1)}%`, cx, y + h / 2 + 4);
          }
        });
        ctx.strokeStyle = active ? C.accent : C.border; ctx.lineWidth = active ? 2 : 1;
        ctx.strokeRect(x - .5, top - .5, barW + 1, bottom - top + 1);
        ctx.globalAlpha = 1;
        ctx.fillStyle = active ? C.text : C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
        ctx.fillText(c.name, cx, bottom + 16);
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(`${(totPro / 1e6).toFixed(2)}M sh`, cx, bottom + 30);
        if (tot !== totPro && active) { ctx.fillStyle = C.viz2; ctx.fillText("official: founders 100%", cx, top - 6); }
      });

      // legend
      let lx = padX; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "left";
      ["founders", "safe", "pool", "investor"].forEach(k => {
        ctx.fillStyle = colors[k]; ctx.fillRect(lx, 30, 9, 9);
        ctx.fillStyle = C.text2; ctx.fillText(names[k], lx + 13, 38);
        lx += ctx.measureText(names[k]).width + 30;
      });
      if (frame.phase === "done") {
        env.badge(W - padX, 34, `effective pre-money $${(S.effPre / 1e6).toFixed(2)}M vs headline $${(S.pre / 1e6).toFixed(0)}M`, { color: C.bg, bg: C.warn, align: "right", size: 10 });
      }
    }
  },

  drill: {
    cards: [
      { q: "How do you compute a post-money SAFE investor's ownership?", a: "`investment ÷ post-money cap`, measured just before the priced round's new money. $500k at a $10M cap = 5%.", tags: ["safe"] },
      { q: "Why is SAFE dilution easy to underestimate?", a: "SAFEs aren't shares until a priced round, so the official cap table shows no dilution — and multiple SAFEs' percentages simply add up. Keep a pro forma cap table.", tags: ["safe", "dilution"] },
      { q: "Post-money valuation formula, and the new investor's stake?", a: "`post = pre + raise`; new investor owns `raise ÷ post`. $3M on $12M pre = $15M post → 20%.", tags: ["priced-round"] },
      { q: "What is the option pool shuffle?", a: "Creating (or topping up) the option pool *before* the new money, so the pool dilutes only founders and earlier holders. It lowers the effective pre-money below the headline number.", tags: ["option-pool"] },
      { q: "Valuation cap vs discount on a SAFE?", a: "Cap: maximum valuation the SAFE converts at. Discount: percentage off the next round's price. The investor gets whichever gives more shares.", tags: ["safe"] },
      { q: "What are pro rata rights?", a: "The right to invest in future rounds enough to keep your ownership percentage. They take room in later rounds, so grant deliberately.", tags: ["terms"] },
      { q: "Rule of thumb for founders' combined ownership after seed?", a: "Roughly 50–65%+, since Series A and later rounds each take another 15–25%.", tags: ["benchmarks"] },
      { q: "What do investors want from a pre-revenue AI startup?", a: "Team edge, why now, proof of pull (real weekly usage by design partners beats waitlist size), a defensible angle vs funded rivals and model labs, and sane per-customer serving costs.", tags: ["pitch"] }
    ],
    sixtySecond: [
      "Walk through a $500k SAFE at a $10M cap converting in a $3M round at $12M pre with a 10% post-money pool: who owns what at the end?",
      "Explain the option pool shuffle and how you'd negotiate the pool size."
    ]
  }
};
