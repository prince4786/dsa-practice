export default {
  id: "ideal-customer",
  track: "startup",
  title: "Ideal Customer & Positioning",
  difficulty: 1,
  minutes: 15,
  tags: ["icp", "beachhead", "positioning", "segmentation"],

  explainer: [
    { type: "p", text: "An **ideal customer profile (ICP)** is a precise description of the kind of company (or person) that gets the most value from your product, buys it fastest and stays longest. Not \"small businesses\". Something like: **\"seed to Series A software startups, 5 to 30 people, where a founder or one marketer does all the marketing, already paying for at least one SEO or writing tool\"**. You should be able to read that sentence, look at a company's website and LinkedIn, and say yes or no in under a minute." },
    { type: "p", text: "Early founders resist this. Narrowing feels like turning money away, and the product *could* help agencies, local shops and big companies too. But the opposite is true at the start. **A narrow target makes everything else easier**: you know where to find these people, what words they use, which features matter, which objections to expect, and every happy customer knows ten more just like them. A broad target means every sale is a fresh puzzle." },

    { type: "h3", text: "The beachhead" },
    { type: "p", text: "A **beachhead market** is the first small market you plan to win completely, before moving to the next. The term comes from military landings: you capture one stretch of beach, then push inland from there. Facebook started with Harvard students only; Stripe started with developers at small startups. A good beachhead has four things: **the pain is sharp** (they are already spending money or hours on it), **they can pay** (budget and authority to buy), **you can reach them** (you know where they gather and can contact them cheaply), and **they talk to each other** (so one win leads to the next by word of mouth)." },
    { type: "callout", tone: "tip", text: "Win the beachhead completely, then expand to the *adjacent* segment that shares the most with it: the same buyer at a bigger company, or a neighbouring buyer at the same kind of company. Expanding sideways keeps most of what you learned useful." },

    { type: "h3", text: "Positioning: the five parts" },
    { type: "p", text: "Once you know *who*, **positioning** decides *how they should think about you*: what you are, what you're better than, and why it matters to them. April Dunford's book *Obviously Awesome* breaks it into five parts, and the order matters, because each one is defined by the one before it:" },
    { type: "list", items: [
      "**Competitive alternatives**: what the customer would do if you didn't exist. Usually not another startup: it is \"do it myself on weekends\", \"hire a freelancer\", \"use ChatGPT and a spreadsheet\" or \"do nothing\". This is the real competition.",
      "**Unique attributes**: what you have that those alternatives don't. Features, but also approach, team or business model.",
      "**Value**: what those attributes do for the customer, in their terms. Not \"agents run server-side\" but \"your marketing keeps moving while you're in customer meetings\".",
      "**Target customers**: who cares most about that value. This is your ICP, seen through positioning.",
      "**Market category**: the existing kind of product you say you are, so buyers know what to compare you to and what to expect. Choosing a category is a trade-off: a known one (\"AI marketing assistant\") is easy to understand but crowded; a new one (\"agentic workspace\") stands out but needs explaining."
    ]},
    { type: "steps", text: "Positioning, built in order", frames: [
      { slots: ["Alternatives", "Unique attributes", "Value", "Target", "Category"], focus: 0, text: "Start with what customers do today without you. For a startup founder: write posts themselves, pay a freelancer, buy an SEO tool, or skip marketing." },
      { slots: ["Alternatives", "Unique attributes", "Value", "Target", "Category"], focus: 1, text: "List what only you have compared with those: agents that research your competitors and keywords, draft the pages, and keep working with your laptop closed." },
      { slots: ["Alternatives", "Unique attributes", "Value", "Target", "Category"], focus: 2, text: "Translate each attribute into value the customer feels: a content calendar that actually ships, without hiring a marketer yet." },
      { slots: ["Alternatives", "Unique attributes", "Value", "Target", "Category"], focus: 3, text: "Ask who cares most about that value: the founder doing marketing alone cares far more than a big company with a marketing team." },
      { slots: ["Alternatives", "Unique attributes", "Value", "Target", "Category"], focus: 4, text: "Pick the frame that makes the value obvious to that target: \"the marketing team you don't have yet\" says more to a founder than a new category name." }
    ]},
    { type: "callout", tone: "pitfall", text: "Two common traps. **Positioning for everyone**: a homepage that tries to speak to founders, agencies and enterprises at once speaks to none of them. **Leading with technology**: \"multi-agent ACP runtime\" is an attribute; nobody buys an attribute. Say the value, then show the attribute as the reason to believe it." },

    { type: "h3", text: "The trade-off the visualizer shows" },
    { type: "p", text: "A narrower ICP has fewer prospects in it. So why narrow? Because two things rise as you narrow toward the people with the sharpest pain and the most ability to pay: **conversion rate** (the share of prospects you talk to who buy) and **word-of-mouth density** (how likely each customer is to know other prospects like them). Early on, you are limited by how many conversations the founders can hold, not by how many prospects exist, so a higher conversion rate wins, and referrals compound it. The visualizer narrows the target step by step and estimates customers won in your first three months with a fixed number of sales conversations." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "p", text: "Theoma's site says \"a workspace arrives staffed\" with nine agents, from Product to Support. That breadth is the product's long-term vision, and it is also a positioning risk now: a buyer can't tell whether it's a Slack replacement, an AI marketer or an app builder. The founders have already decided Marketing and Sales come first, which is a step toward a beachhead. The next step is to say *for whom*." },
    { type: "list", items: [
      "**Write three candidate ICPs as one sentence each** and test them with discovery calls: (a) seed to Series A software startups where a founder does the marketing; (b) the solo marketer at a 10 to 50 person startup; (c) small marketing agencies running content for many clients. Score each on pain, ability to pay, reachability and whether they talk to each other.",
      "**Write the competitive alternatives for the winner.** For (a) it's probably \"the founder on weekends, ChatGPT, maybe a freelancer\"; for (c) it's \"junior staff and Semrush\". Your homepage, demo and pricing should change depending on which.",
      "**Choose a category on purpose.** \"Agents as teammates\" is a strong idea for the long-term category; for the beachhead, a familiar frame like \"your marketing team, before you can hire one\" may convert better. Test both headlines on the waitlist page, since PostHog is already installed there.",
      "**Let the demo match the ICP.** The demos already run on Volopay, Ramp and Audria (startups selling to businesses) and on a salon and a dental practice (local businesses). Lead sales with the demo closest to the chosen ICP."
    ]}
  ],

  glossary: [
    { term: "ICP (ideal customer profile)", plain: "A precise description of the type of customer who gets the most value from your product, buys fastest and stays longest. Precise enough that you can check any company against it in a minute." },
    { term: "Segment", plain: "A group of possible customers who share traits that matter for buying, such as size, industry, role of the buyer or how they solve the problem today." },
    { term: "Beachhead market", plain: "The first small market you aim to win completely before expanding to neighbouring ones." },
    { term: "Positioning", plain: "How you want a specific customer to understand your product: what it is, what it's better than, and why that matters to them." },
    { term: "Competitive alternative", plain: "What a customer would do if your product didn't exist, including doing it by hand, hiring someone or doing nothing." },
    { term: "Unique attribute", plain: "Something your product has or does that the competitive alternatives don't." },
    { term: "Market category", plain: "The familiar type of product you say you are (for example \"CRM\" or \"AI writing tool\"), which tells buyers what to compare you with." },
    { term: "Conversion rate", plain: "The share of people at one step who move to the next, for example the share of prospects you talk to who end up buying." },
    { term: "Word of mouth", plain: "Customers telling other potential customers about you without you paying for it. Strongest when customers know many people like themselves." },
    { term: "Prospect", plain: "A person or company that might become a customer but hasn't bought yet." },
    { term: "Adjacent segment", plain: "A neighbouring group of customers that shares a lot with the one you already serve, so moving into it reuses most of what you've learned." }
  ],

  complexity: {
    rows: [
      { operation: "Time to judge fit against the ICP", time: "< 5 min", space: "< 1 min", note: "if it takes longer, the ICP is too vague" },
      { operation: "Win rate on qualified B2B deals", time: "20–30%", space: "30%+", note: "commonly cited ranges for early B2B SaaS" },
      { operation: "New customers from referrals", time: "~20%", space: "40%+", note: "a sign the segment talks to itself" },
      { operation: "Segments you sell to in year one", time: "1–2", space: "1", note: "one beachhead, won completely" }
    ]
  },

  interview: {
    whyAsked: "Theoma's product is broad (nine agents, chat, Studio, marketing, sales), which makes a sharp ICP more important, not less. Every early decision depends on it: which agent to polish, which demo to show, what price to charge, which homepage headline to use. Investors will ask \"who is your customer?\" and expect one sentence back.",
    followUps: [
      { q: "Isn't narrowing to one segment leaving money on the table?", a: "Early on you're limited by how many sales conversations you can hold and how many features you can polish, not by market size. A narrow segment converts better, refers more and tells you clearly what to build. You expand once you dominate it, into the adjacent segment that reuses most of what you learned." },
      { q: "Who is your ideal customer, in one sentence?", a: "A good answer names company stage, size, the buyer's role, and the trigger or current behaviour, e.g. \"seed to Series A software startups of 5 to 30 people, where a founder runs marketing alone and already pays for an SEO or writing tool\". If you can't check a company against it in a minute, it's too vague." },
      { q: "Who are you really competing with?", a: "Usually the competitive alternative, not another startup: the founder doing it on weekends, a freelancer, ChatGPT plus a spreadsheet, or doing nothing. Positioning against those is clearer than positioning against Dock or Sauna, which most of your buyers haven't heard of." },
      { q: "Should Theoma create a new category, \"agentic workspace\"?", a: "A new category makes you the leader of it, but you have to teach the market what it is, which is slow and expensive. Early on, a familiar frame that makes your value obvious to the beachhead (\"your marketing team before you can hire one\") usually converts better. You can grow into the bigger category story as the market catches up." },
      { q: "How do you know you picked the wrong ICP?", a: "Long sales cycles, lots of \"interesting, maybe later\", heavy custom requests, customers who churn after a month, and no referrals. The right ICP shows short cycles, similar requests from different customers, and new customers saying \"my friend told me about you\"." },
      { q: "What's the difference between ICP and a persona?", a: "An ICP describes the company (stage, size, industry, situation). A persona describes a person inside it (the founder, the marketer, the CFO who approves spend). In B2B you need both: the ICP tells you which companies to approach, the persona tells you who to talk to and what they care about." }
    ]
  },

  code: [
    { lang: "python", label: "Score candidate ICPs", code: "# Score 1-5 on each criterion from your discovery notes. Weights are a judgement call.\nWEIGHTS = {\"pain\": 3, \"can_pay\": 2, \"reachable\": 2, \"talk_to_each_other\": 1}\n\ncandidates = {\n    \"seed startup, founder does marketing\": {\"pain\": 4, \"can_pay\": 3, \"reachable\": 5, \"talk_to_each_other\": 5},\n    \"solo marketer at 10-50 person startup\": {\"pain\": 5, \"can_pay\": 4, \"reachable\": 4, \"talk_to_each_other\": 3},\n    \"small marketing agency\":               {\"pain\": 4, \"can_pay\": 4, \"reachable\": 3, \"talk_to_each_other\": 2},\n    \"local business (salon, dentist)\":      {\"pain\": 2, \"can_pay\": 2, \"reachable\": 2, \"talk_to_each_other\": 2},\n}\n\ndef score(c):\n    return sum(WEIGHTS[k] * v for k, v in c.items()) / (5 * sum(WEIGHTS.values()))\n\nfor name, c in sorted(candidates.items(), key=lambda kv: -score(kv[1])):\n    print(f\"{score(c):.0%}  {name}\")" },
    { lang: "python", label: "Why narrow wins early", code: "# The founders can hold about 40 sales conversations a month.\ncalls_per_month = 40\n\n# Illustrative: broad market vs a tight beachhead.\nbroad  = {\"conversion\": 0.03, \"referrals_per_customer\": 0.1}\nnarrow = {\"conversion\": 0.12, \"referrals_per_customer\": 0.5}\n\ndef customers_after(months, seg):\n    total = 0.0\n    for _ in range(months):\n        won = calls_per_month * seg[\"conversion\"]\n        referred = total * seg[\"referrals_per_customer\"] / 3   # referrals trickle in\n        total += won + referred\n    return total\n\nfor name, seg in [(\"broad\", broad), (\"narrow\", narrow)]:\n    print(name, round(customers_after(3, seg), 1), \"customers in 3 months\")" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.65, maxFrames: 60 },

    params: [
      { key: "width", label: "Final ICP size (% of market)", type: "int", min: 10, max: 100, default: 25 },
      { key: "calls", label: "Sales calls / month", type: "int", min: 10, max: 80, default: 40 },
      { key: "seed",  label: "New market", type: "seed" }
    ],

    frames: function* (params, rng) {
      // Segments: centre on (pain, ability to pay), in [0,1].
      const SEG = [
        { name: "Seed startups, founder markets", x: 0.80, y: 0.58 },
        { name: "Startup's solo marketer",        x: 0.86, y: 0.80 },
        { name: "Small agencies",                 x: 0.62, y: 0.72 },
        { name: "Enterprise marketing teams",     x: 0.30, y: 0.88 },
        { name: "Local businesses",               x: 0.50, y: 0.26 },
        { name: "Solo creators",                  x: 0.32, y: 0.14 }
      ];
      const gauss = () => { let s = 0; for (let i = 0; i < 4; i++) s += rng(); return (s - 2) / 1.15; };
      const clamp = v => Math.max(0.02, Math.min(0.98, v));

      const pts = [];
      SEG.forEach((s, si) => {
        const count = 26 + Math.floor(rng() * 10);
        for (let i = 0; i < count; i++) pts.push({ x: clamp(s.x + gauss() * 0.11), y: clamp(s.y + gauss() * 0.11), seg: si });
      });
      // Conversion chance: sharp pain matters most, then budget.
      const conv = p => 0.01 + 0.28 * Math.pow(p.x, 2.5) * Math.pow(p.y, 1.2);

      // ICP region is a square anchored at the top-right corner (high pain, high pay).
      // Its side shrinks from 1 (everyone) to whatever covers ~width% of the prospects.
      const target = params.width / 100;
      const inside = (p, side) => p.x >= 1 - side && p.y >= 1 - side;
      const shareAt = side => pts.filter(p => inside(p, side)).length / pts.length;
      let lo = 0.05, hi = 1;
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (shareAt(m) >= target) hi = m; else lo = m; }
      const finalSide = Math.max(hi, 0.08);

      const measure = side => {
        const ins = pts.filter(p => inside(p, side));
        if (!ins.length) return { n: 0, conv: 0, wom: 0, months: [0, 0, 0], top: -1 };
        const c = ins.reduce((s, p) => s + conv(p), 0) / ins.length;
        // Word-of-mouth density: chance two random in-ICP customers share a segment.
        const counts = SEG.map((_, si) => ins.filter(p => p.seg === si).length);
        const wom = counts.reduce((s, k) => s + k * k, 0) / (ins.length * ins.length);
        const top = counts.indexOf(Math.max.apply(null, counts));
        // Customers over three months: calls × conversion, plus referrals from the base.
        let total = 0; const months = [];
        for (let m = 0; m < 3; m++) {
          const won = Math.min(ins.length - total, params.calls * c);
          const referred = Math.min(ins.length - total - won, total * wom * 0.6);
          total += Math.max(0, won) + Math.max(0, referred);
          months.push(total);
        }
        return { n: ins.length, conv: c, wom, months, top };
      };

      const steps = 9;
      const history = [];
      const snap = (side, label, phase) => {
        const m = measure(side);
        history.push({ share: m.n / pts.length, cust: m.months[2] });
        return {
          label, phase,
          state: {
            pts, segNames: SEG.map(s => s.name), side,
            n: m.n, total: pts.length, conv: m.conv, wom: m.wom, months: m.months,
            top: m.top, history: history.slice()
          }
        };
      };

      const m0 = measure(1);
      yield snap(1, `Everyone is the target: ${pts.length} prospects across six segments. Conversion ${(m0.conv * 100).toFixed(1)}%, and customers rarely know each other. ${params.calls} calls a month win about ${m0.months[2].toFixed(1)} customers in three months.`, "broad");

      for (let i = 1; i <= steps; i++) {
        const side = 1 - (1 - finalSide) * (i / steps);
        const m = measure(side);
        const prev = history[history.length - 1];
        const label = i < steps
          ? `Narrow to ${m.n} prospects (higher pain and budget). Conversion ${(m.conv * 100).toFixed(1)}%, word-of-mouth density ${(m.wom * 100).toFixed(0)}%. Three-month customers: ${prev.cust.toFixed(1)} → ${m.months[2].toFixed(1)}.`
          : `Beachhead: ${m.n} prospects, mostly "${SEG[m.top].name}". Conversion ${(m.conv * 100).toFixed(1)}% vs ${(m0.conv * 100).toFixed(1)}% for everyone, and ${m.months[2].toFixed(1)} customers in three months vs ${m0.months[2].toFixed(1)}. ${m.n < pts.length ? "Fewer prospects, more wins — until the segment runs out." : "Lower the final ICP size to see narrowing pay off."}`;
        yield snap(side, label, i < steps ? "narrowing" : "done");
      }
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const SEGC = [C.viz1, C.viz2, C.viz3, C.viz4, C.viz5, C.viz6];

      // ---- scatter --------------------------------------------------------
      const pad = 18;
      const px0 = pad + 26, py0 = pad, pw = Math.min(W * 0.56, H - 54) , ph = H - pad - 40;
      const sw = Math.min(pw, ph);
      const X = v => px0 + v * sw, Y = v => py0 + (1 - v) * ph;

      ctx.fillStyle = C.surface;
      ctx.beginPath(); ctx.roundRect(px0, py0, sw, ph, 6); ctx.fill();

      // ICP region
      const rx = X(1 - S.side), ry = Y(1);
      ctx.fillStyle = C.accent; ctx.globalAlpha = 0.12;
      ctx.fillRect(rx, ry, X(1) - rx, Y(1 - S.side) - ry);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = C.accent; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]);
      ctx.strokeRect(rx + 0.5, ry + 0.5, X(1) - rx - 1, Y(1 - S.side) - ry - 1);
      ctx.setLineDash([]);
      ctx.fillStyle = C.accent; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "right";
      ctx.fillText("ICP", X(1) - 6, ry + 14);

      S.pts.forEach(p => {
        const ins = p.x >= 1 - S.side && p.y >= 1 - S.side;
        ctx.fillStyle = SEGC[p.seg];
        ctx.globalAlpha = ins ? 0.95 : 0.22;
        ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), ins ? 3.4 : 2.6, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = C.muted; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "center";
      ctx.fillText("pain: how sharply they feel the problem →", px0 + sw / 2, py0 + ph + 16);
      ctx.save(); ctx.translate(px0 - 12, py0 + ph / 2); ctx.rotate(-Math.PI / 2);
      ctx.fillText("ability to pay →", 0, 0); ctx.restore();

      // ---- legend ---------------------------------------------------------
      const lx = px0 + sw + 22, lw = W - lx - pad;
      ctx.textAlign = "left"; ctx.font = `11px ${env.font.base}`;
      S.segNames.forEach((name, i) => {
        const y = py0 + 6 + i * 17;
        ctx.fillStyle = SEGC[i];
        ctx.beginPath(); ctx.arc(lx + 5, y + 4, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = i === S.top ? C.text : C.text2;
        ctx.fillText(name, lx + 15, y + 8);
      });

      // ---- metrics --------------------------------------------------------
      let y = py0 + 6 + S.segNames.length * 17 + 14;
      const bar = (label, v, max, txt, col) => {
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(label, lx, y);
        ctx.textAlign = "right"; ctx.font = `11px ${env.font.mono}`; ctx.fillStyle = C.text;
        ctx.fillText(txt, lx + lw, y);
        ctx.fillStyle = C.surface2; ctx.beginPath(); ctx.roundRect(lx, y + 5, lw, 8, 4); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(lx, y + 5, Math.max(2, lw * Math.min(1, v / max)), 8, 4); ctx.fill();
        y += 30;
      };
      bar("Prospects in target", S.n, S.total, `${S.n} / ${S.total}`, C.viz5);
      bar("Conversion rate", S.conv, 0.2, `${(S.conv * 100).toFixed(1)}%`, C.viz1);
      bar("Word-of-mouth density", S.wom, 1, `${(S.wom * 100).toFixed(0)}%`, C.viz2);

      // ---- customers in 3 months, history line ----------------------------
      const gy0 = y + 4, gy1 = H - pad - 12;
      if (gy1 - gy0 > 30) {
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(`Customers after 3 months: ${S.months[2].toFixed(1)}`, lx, gy0 + 6);
        const top = gy0 + 14, hgt = gy1 - top;
        const maxC = Math.max(1, ...S.history.map(h => h.cust)) * 1.1;
        ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lx, gy1 + 0.5); ctx.lineTo(lx + lw, gy1 + 0.5); ctx.stroke();
        ctx.strokeStyle = C.viz1; ctx.lineWidth = 2; ctx.beginPath();
        S.history.forEach((h, i) => {
          const xx = lx + (1 - h.share) * lw;
          const yy = gy1 - (h.cust / maxC) * hgt;
          if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
        });
        ctx.stroke();
        const last = S.history[S.history.length - 1];
        ctx.fillStyle = C.viz1;
        ctx.beginPath(); ctx.arc(lx + (1 - last.share) * lw, gy1 - (last.cust / maxC) * hgt, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`;
        ctx.textAlign = "left"; ctx.fillText("everyone", lx, gy1 + 11);
        ctx.textAlign = "right"; ctx.fillText("narrow →", lx + lw, gy1 + 11);
      }
    }
  },

  drill: {
    cards: [
      { q: "What is an ICP, and how precise should it be?", a: "Ideal customer profile: the type of customer who gets the most value, buys fastest and stays longest. Precise enough to check any company against it in about a minute.", tags: ["icp"] },
      { q: "Four traits of a good beachhead market?", a: "Sharp pain, ability to pay, reachable cheaply, and customers who talk to each other.", tags: ["beachhead"] },
      { q: "April Dunford's five parts of positioning, in order?", a: "Competitive alternatives → unique attributes → value → target customers → market category.", tags: ["positioning"] },
      { q: "What is a \"competitive alternative\"? Give Theoma's likely ones.", a: "What the customer would do without you. For a founder doing marketing: do it themselves, ChatGPT plus a spreadsheet, a freelancer, an SEO tool, or nothing.", tags: ["positioning"] },
      { q: "Why does narrowing the target win early even though there are fewer prospects?", a: "Early growth is limited by sales conversations, not market size. A narrow target raises conversion rate and word-of-mouth, so the same number of calls wins more customers.", tags: ["icp"] },
      { q: "Attribute vs value: which goes in the headline?", a: "Value, in the customer's words (\"your marketing keeps shipping while you sell\"). The attribute (\"server-side agents\") is the reason to believe it.", tags: ["positioning"] },
      { q: "ICP vs persona?", a: "ICP describes the company (stage, size, situation). Persona describes the person inside it you sell to (founder, marketer, approver).", tags: ["icp"] },
      { q: "Signs you picked the wrong ICP?", a: "Long sales cycles, \"maybe later\", lots of custom requests, early churn, and no referrals.", tags: ["icp"] }
    ],
    sixtySecond: [
      "Explain why a startup should pick one narrow beachhead market, using conversion rate and word of mouth.",
      "Walk through April Dunford's five positioning components using Theoma's Marketer as the example."
    ]
  }
};
