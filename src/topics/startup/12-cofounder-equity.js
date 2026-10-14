export default {
  id: "cofounder-equity",
  track: "startup",
  title: "Co-founder Equity & Vesting",
  difficulty: 1,
  minutes: 15,
  tags: ["equity", "vesting", "cliff", "co-founders", "83b", "founder-agreement"],

  explainer: [
    { type: "p", text: "The most common reason early startups fall apart isn't the market or the product — it's the founders falling out. And the moment a falling-out turns from painful into fatal is usually about **equity**: who owns how much, and what happens to it when someone leaves. Getting this right is cheap and boring on day one, and expensive and bitter on day four hundred. This lesson covers how founders split ownership, how **vesting** protects everyone if one of them leaves, and the founder agreement that writes all of it down." },

    { type: "h3", text: "Splitting the equity" },
    { type: "p", text: "**Equity** means ownership of the company, measured in shares. At founding, all of it belongs to the founders, and they have to decide how to divide it. The old instinct is to reward what each person has *already* done — who had the idea, who wrote the first code. But in a company that will take seven to ten years to succeed, the first few months are a tiny fraction of the work. So the modern default, and Y Combinator's standing advice, is that **founders who are committing full-time from now on should split roughly equally**." },
    { type: "list", items: [
      "**Equal or near-equal** (50/50, 34/33/33) says 'we are equal partners in what's ahead'. It avoids a resentment that compounds every year, and investors read a very lopsided split between full-time founders as a warning sign that someone feels like an employee.",
      "**Unequal splits** are reasonable when commitment truly differs: one founder starts full-time a year later, one isn't leaving their job yet, one put in a large amount of money. Make the reason explicit and written down.",
      "**Avoid deadlock planning by equity alone**: an exact 50/50 between two founders can stall decisions. The fix is usually not a 51/49 split but agreeing *who decides what* (see roles below)."
    ]},

    { type: "h3", text: "Vesting: earning your shares over time" },
    { type: "p", text: "Imagine three founders split the company equally and founder C quits after five months. Without any protection, C walks away owning a third of the company forever, while A and B spend the next eight years building its value. That's unfair to A and B, and it also scares away investors, who don't want a third of the company held by someone who's gone (this is called **dead equity**)." },
    { type: "p", text: "**Vesting** solves this. Each founder gets their shares up front, but the company keeps the right to **buy back the unvested part** at the tiny original price if the founder leaves. The standard schedule is **four years with a one-year cliff**:" },
    { type: "list", items: [
      "**The cliff**: nothing vests for the first 12 months. Leave before month 12 and *all* your shares go back. This protects against early departures, the most common kind.",
      "**At month 12**, 25% vests at once (12 of 48 months' worth).",
      "**After that**, 1/48th vests every month until month 48, when everything is vested.",
      "Leaving at month 30 means you keep 30/48 = 62.5% of your shares and the company buys back the rest."
    ]},
    { type: "callout", tone: "tip", text: "Founders sometimes resist vesting their own shares (\"it's my company!\"). Flip the question: vesting protects *you* from your co-founders leaving as much as it protects them from you. And investors will almost always require founder vesting at the first priced round anyway; doing it yourself first means you choose the terms. Founders who've worked together a while often get credit for that time (for example, starting the vesting clock on the day the work began, not the day of incorporation)." },

    { type: "h3", text: "Acceleration" },
    { type: "p", text: "**Acceleration** makes unvested shares vest early when the company is bought. **Single-trigger** acceleration vests shares on the acquisition alone; acquirers dislike it because the founders they want to keep become free to leave. **Double-trigger** — vest early only if the company is bought *and* the founder is then fired or pushed out within a set period — is the common middle ground, and it's what most investors accept." },

    { type: "h3", text: "The 83(b) election and where to incorporate" },
    { type: "p", text: "In the US, shares that vest over time can be taxed as income *as they vest*, at whatever they're worth then — which could be a lot, and cash you don't have. Filing an **83(b) election** with the IRS within **30 days** of receiving the shares tells the tax authority to tax the whole grant now, when it's worth nearly nothing. Missing the deadline can't be fixed afterwards. It's one of the most important pieces of startup paperwork and also one of the easiest to forget." },
    { type: "p", text: "Founders based in India who plan to raise from US investors often set up a **US parent company** (usually a Delaware C-corporation, the legal form US investors and accelerators expect) with an Indian subsidiary doing the work, called a **flip**. That structure has tax, foreign-exchange and compliance consequences in both countries that change over time, so it's a decision to make with a lawyer and accountant who do this regularly. Nothing in this lesson is legal or tax advice." },

    { type: "h3", text: "The founder agreement: write the hard parts down" },
    { type: "list", items: [
      "**Equity and vesting**: the split, the schedule, the cliff, acceleration, and credit for time already worked.",
      "**IP assignment**: every founder assigns everything they've built for the company (code, designs, domain names) to the company. Investors check this, and code written before incorporation is a common gap.",
      "**Roles and decision rights**: who owns which decisions — product, engineering, sales, fundraising, hiring — and how disagreements get resolved. Titles matter less than knowing who has the final call on what.",
      "**Commitment**: full-time from when, and what outside work is allowed.",
      "**What happens if someone leaves**: buyback of unvested shares, and whether they keep a board or advisory role."
    ]},
    { type: "callout", tone: "pitfall", text: "Founders avoid this conversation because it feels like planning a divorce at the wedding. Having it while everyone gets along is the whole point: it takes an hour now, versus months of conflict — or a dead company — later." },

    { type: "h3", text: "Co-founder conflict" },
    { type: "p", text: "Disagreement between co-founders is normal and often healthy; what kills companies is disagreement that goes unspoken until it explodes. Habits that help: a regular founder-only meeting about the relationship and the company (not the sprint), clear decision rights so arguments end with someone deciding, disagreeing openly and then fully committing to the decision, and raising small frustrations while they're still small." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "list", items: [
      "**Check the paperwork exists**: signed founder stock agreements with vesting, an IP assignment from every founder covering work done before incorporation (the repo's history goes back well before any company paperwork may have been filed), and, for any US entity, each founder's 83(b) filed on time.",
      "**Write down decision rights** in one page: who owns product direction, the engineering platform, marketing and sales, and fundraising. Theoma's own docs already settle questions this way (dated decisions with a status); the founders' roles deserve the same treatment.",
      "**Decide the structure before raising**: if US investors or accelerators are the target, the entity question (and a possible flip) is easiest to settle before the first SAFE.",
      "**Book a recurring founders' check-in**, separate from product work. Small teams building fast are exactly where frustrations go unspoken."
    ]}
  ],

  glossary: [
    { term: "Equity", plain: "Ownership of the company, divided into shares." },
    { term: "Vesting", plain: "Earning your shares gradually over time; shares not yet earned can be bought back by the company if you leave." },
    { term: "Cliff", plain: "A starting period (usually 12 months) during which nothing vests; leave before it ends and you keep none of your shares." },
    { term: "Buyback (repurchase right)", plain: "The company's right to buy back a departing founder's unvested shares, usually at the tiny price originally paid." },
    { term: "Dead equity", plain: "A large slice of ownership held by someone no longer working on the company." },
    { term: "Acceleration", plain: "Unvested shares vesting early when a specific event happens, usually the company being bought." },
    { term: "Single-trigger acceleration", plain: "Shares vest early just because the company is acquired." },
    { term: "Double-trigger acceleration", plain: "Shares vest early only if the company is acquired AND the founder is then fired or pushed out." },
    { term: "83(b) election", plain: "A US tax filing, due within 30 days of getting shares, that taxes them now at their tiny value instead of later as they vest." },
    { term: "Delaware C-corp", plain: "The US company type most investors expect startups to use, registered in the state of Delaware." },
    { term: "Flip", plain: "Restructuring so a non-US startup becomes the subsidiary of a new US parent company, usually to raise from US investors." },
    { term: "IP assignment", plain: "A signed agreement that hands ownership of everything a founder built for the startup (code, designs, names) to the company." },
    { term: "Founder agreement", plain: "The written agreement between founders covering equity, vesting, roles, IP and what happens if someone leaves." },
    { term: "Decision rights", plain: "An agreed list of who has the final say on which kinds of decisions." }
  ],

  complexity: {
    rows: [
      { operation: "Founder vesting schedule", time: "4 years, 1-year cliff", space: "same, with credit for time already worked", note: "the market standard" },
      { operation: "Split between full-time founders", time: "near-equal", space: "equal, with written reasons for any gap", note: "lopsided splits worry investors" },
      { operation: "Acceleration on acquisition", time: "double-trigger", space: "double-trigger, 12-month window", note: "single-trigger scares acquirers" },
      { operation: "83(b) election (US)", time: "filed within 30 days", space: "filed within the week, proof kept", note: "cannot be fixed late" },
      { operation: "IP assigned to company", time: "all founders signed", space: "includes pre-incorporation work", note: "checked in every diligence" }
    ]
  },

  interview: {
    whyAsked: "Theoma is built by a small founding team moving fast, with code that predates any formal company paperwork. Investors will check the founder equity, vesting and IP assignment in diligence for the first priced round; more importantly, settling them now protects the founders from each other's worst case and keeps disagreements about direction from turning into disagreements about ownership.",
    followUps: [
      { q: "How is equity split between the founders, and why?", a: "Give the split and the reason in one sentence. 'Equal, because we're all full-time and the work ahead dwarfs the work behind' is the answer investors hope to hear; any gap should have a clear, agreed reason." },
      { q: "Is founder stock vesting?", a: "Yes, four years with a one-year cliff, with credit from when full-time work started. 'No' prompts investors to impose vesting at the round on their terms." },
      { q: "Who decides when you disagree?", a: "Name the domains each founder owns and the tie-break for cross-cutting calls (often the CEO, after real debate). Showing a working decision process matters more than the specific titles." },
      { q: "Has all the IP been assigned to the company?", a: "Confirm every founder signed an IP assignment covering work before incorporation, and that any contractor or friend who contributed code did too. Gaps here can delay or kill a round." },
      { q: "What happens if one of you leaves next year?", a: "Vesting answers it: they keep their vested shares, the company buys back the rest, and the founder agreement covers their role and any board seat. Having the answer ready shows the team planned for the hard case." },
      { q: "Why near-equal instead of rewarding who started it?", a: "The company's value will be built over the next seven to ten years, not the first few months; equity should reflect future commitment. Unequal splits between equally committed founders tend to breed resentment that outgrows the original reason." }
    ]
  },

  code: [
    { lang: "python", label: "Vested shares with a cliff, and a departure", code: "def vested(shares, month, total=48, cliff=12):\n    \"\"\"Shares vested at `month` under monthly vesting with a cliff.\"\"\"\n    if month < cliff:\n        return 0\n    return shares * min(month, total) / total\n\ndef leave(shares, month, **kw):\n    keep = vested(shares, month, **kw)\n    return {'keeps': keep, 'bought_back': shares - keep}\n\n# Hypothetical founders A/B/C splitting 10M shares:\nsplit = {'A': 3_400_000, 'B': 3_300_000, 'C': 3_300_000}\nprint(leave(split['C'], month=9))    # before the cliff: keeps 0\nprint(leave(split['C'], month=30))   # keeps 62.5%" },
    { lang: "python", label: "Ownership after a departure", code: "def ownership_after_leave(split, leaver, month, **kw):\n    \"\"\"Bought-back shares are cancelled, so everyone else's % rises.\"\"\"\n    held = dict(split)\n    held[leaver] = vested(split[leaver], month, **kw)\n    total = sum(held.values())\n    return {k: round(v / total, 3) for k, v in held.items()}\n\nprint(ownership_after_leave(split, 'C', month=9))   # A ~0.507, B ~0.493, C 0.0" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 80 },

    params: [
      { key: "split",  label: "Split A/B/C",        type: "enum", options: ["34/33/33", "40/35/25", "50/30/20"], default: "34/33/33" },
      { key: "leaver", label: "Who leaves",          type: "enum", options: ["C", "B", "A", "nobody"], default: "C" },
      { key: "leave",  label: "Leaves at month",     type: "int", min: 1, max: 47, default: 9 },
      { key: "cliff",  label: "Cliff (months)",      type: "int", min: 0, max: 12, default: 12 }
    ],

    frames: function* (params) {
      const TOTAL = 10000000, M = 48, cliff = params.cliff;
      const pcts = params.split.split("/").map(Number);
      const names = ["A", "B", "C"];
      const shares = pcts.map(p => TOTAL * p / 100);
      const L = params.leaver === "nobody" ? null : names.indexOf(params.leaver);
      const leaveM = params.leave;
      const v = (s, m) => (m < cliff ? 0 : s * Math.min(m, M) / M);
      const fmt = n => `${(n / 1e6).toFixed(2)}M`;

      const snap = (m, label, phase) => {
        const vestedNow = shares.map((s, i) => (i === L && m >= leaveM ? v(s, leaveM) : v(s, m)));
        const returned = shares.map((s, i) => (i === L && m >= leaveM ? s - v(s, leaveM) : 0));
        const held = shares.map((s, i) => s - returned[i]);
        const totalHeld = held.reduce((a, b) => a + b, 0);
        const hist = [];
        for (let k = 0; k <= m; k++) hist.push(shares.map((s, i) => (i === L && k >= leaveM ? v(s, leaveM) : v(s, k))));
        return { label, phase, focus: L === null ? [] : [L],
          state: { m, M, cliff, names, pcts, shares, vested: vestedNow, returned, own: held.map(h => h / totalHeld), hist, L, leaveM } };
      };

      yield snap(0, `Day one: founders A/B/C split ${TOTAL / 1e6}M shares ${params.split}. They own them all on paper, but none are vested — the company can buy back unvested shares if someone leaves. Cliff: ${cliff} months.`, "start");

      for (let m = 1; m <= M; m++) {
        let label, phase = m < cliff ? "before cliff" : "vesting";
        if (L !== null && m === leaveM) {
          const keep = v(shares[L], leaveM);
          label = keep === 0
            ? `Month ${m}: founder ${names[L]} leaves before the ${cliff}-month cliff and keeps nothing; all ${fmt(shares[L])} shares go back to the company. Without vesting, ${names[L]} would own ${pcts[L]}% forever.`
            : `Month ${m}: founder ${names[L]} leaves, keeps ${fmt(keep)} vested shares (${(100 * Math.min(m, M) / M).toFixed(1)}%), and the company buys back ${fmt(shares[L] - keep)} unvested.`;
          phase = "departure";
        } else if (cliff > 0 && m === cliff) label = `Month ${m}: the cliff. ${Math.round(100 * cliff / M)}% of each founder's shares vests at once — ${names.map((n, i) => `${n} ${fmt(v(shares[i], m))}`).join(", ")}.`;
        else if (m < cliff) label = `Month ${m}: still before the cliff — nothing has vested for anyone yet.`;
        else label = `Month ${m}: ${(100 * m / M).toFixed(1)}% of each remaining founder's shares has vested (1/48th more each month).`;
        if (m === M) { label = `Month 48: fully vested. ` + label.replace(/^Month 48: /, ""); phase = "fully vested"; }
        if (m <= 14 || m % 2 === 0 || m === leaveM || m === M) yield snap(m, label, phase);
      }

      const fin = snap(M, "", "done");
      fin.label = L === null
        ? `Everyone stayed four years: all shares vested, ownership stays ${params.split}. Pick a leaver to see what vesting protects against.`
        : `End state: bought-back shares are cancelled, so ownership is now ${names.map((n, i) => `${n} ${(fin.state.own[i] * 100).toFixed(1)}%`).join(", ")}. Without vesting, ${names[L]} would still hold ${pcts[L]}% of a company they left in month ${leaveM}.`;
      yield fin;
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const cols = [C.viz1, C.viz3, C.viz2];
      ctx.font = `10px ${env.font.mono}`;
      const pad = 18, labelW = 42, right = W - pad - 8 - ctx.measureText("00.00M vested · owns 100.0%").width;
      const barTop = 40, barH = 24, gap = 14;
      const maxShares = Math.max.apply(null, S.shares);

      ctx.textAlign = "left"; ctx.font = `13px ${env.font.base}`; ctx.fillStyle = C.text;
      ctx.fillText(`Month ${S.m} of ${S.M}`, pad, 22);
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted;
      ctx.fillText("solid = vested   faint = not yet vested   red = bought back", pad + 110, 22);

      // ---------- bars ---------------------------------------------------------
      S.names.forEach((n, i) => {
        const y = barTop + i * (barH + gap);
        const scale = (right - pad - labelW) / maxShares;
        const x0 = pad + labelW;
        ctx.fillStyle = cols[i]; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(`${n} ${S.pcts[i]}%`, pad, y + 16);
        const vw = S.vested[i] * scale, rw = S.returned[i] * scale, tw = S.shares[i] * scale;
        ctx.globalAlpha = 0.22; ctx.fillRect(x0, y, tw, barH); ctx.globalAlpha = 1;
        ctx.fillRect(x0, y, vw, barH);
        if (rw > 0) {
          ctx.fillStyle = C.danger; ctx.globalAlpha = 0.85;
          ctx.fillRect(x0 + tw - rw, y, rw, barH); ctx.globalAlpha = 1;
          ctx.strokeStyle = C.bg; ctx.lineWidth = 1;
          ctx.save(); ctx.beginPath(); ctx.rect(x0 + tw - rw, y, rw, barH); ctx.clip();
          for (let k = -barH; k < rw; k += 7) { ctx.beginPath(); ctx.moveTo(x0 + tw - rw + k, y + barH); ctx.lineTo(x0 + tw - rw + k + barH, y); ctx.stroke(); }
          ctx.restore();
        }
        ctx.strokeStyle = C.border; ctx.strokeRect(x0 + .5, y + .5, tw - 1, barH - 1);
        ctx.fillStyle = C.text2; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(`${(S.vested[i] / 1e6).toFixed(2)}M vested · owns ${(S.own[i] * 100).toFixed(1)}%`, right + 8, y + 16);
      });

      // ---------- vesting curves -----------------------------------------------
      const g0 = barTop + 3 * (barH + gap) + 18, g1 = H - 24, gx0 = pad + labelW, gx1 = W - pad;
      ctx.fillStyle = C.surface; ctx.beginPath(); ctx.roundRect(gx0 - 6, g0 - 8, gx1 - gx0 + 12, g1 - g0 + 16, 6); ctx.fill();
      const xOf = m => gx0 + (m / S.M) * (gx1 - gx0);
      const yOf = s => g1 - (s / maxShares) * (g1 - g0);
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx0, g1 + .5); ctx.lineTo(gx1, g1 + .5); ctx.stroke();
      ctx.font = `10px ${env.font.mono}`; ctx.fillStyle = C.muted; ctx.textAlign = "center";
      for (let m = 0; m <= S.M; m += 12) ctx.fillText(`m${m}`, xOf(m), g1 + 14);
      ctx.textAlign = "right"; ctx.fillText("vested", gx0 - 8, g0 + 4);

      if (S.cliff > 0) {
        ctx.strokeStyle = C.warn; ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(xOf(S.cliff) + .5, g0); ctx.lineTo(xOf(S.cliff) + .5, g1); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.warn; ctx.textAlign = "left"; ctx.fillText("cliff", xOf(S.cliff) + 4, g0 + 4);
      }
      if (S.L !== null) {
        ctx.strokeStyle = C.danger; ctx.globalAlpha = S.m >= S.leaveM ? 1 : 0.35;
        ctx.beginPath(); ctx.moveTo(xOf(S.leaveM) + .5, g0); ctx.lineTo(xOf(S.leaveM) + .5, g1); ctx.stroke();
        ctx.fillStyle = C.danger; ctx.textAlign = "left"; ctx.fillText(`${S.names[S.L]} leaves`, xOf(S.leaveM) + 4, g0 + 16);
        ctx.globalAlpha = 1;
      }
      S.names.forEach((n, i) => {
        ctx.strokeStyle = cols[i]; ctx.lineWidth = 2; ctx.beginPath();
        // Vesting happens in monthly steps, so draw it as a staircase: the cliff is a jump.
        S.hist.forEach((row, m) => {
          const x = xOf(m), y = yOf(row[i]);
          if (m === 0) ctx.moveTo(x, y); else { ctx.lineTo(x, yOf(S.hist[m - 1][i])); ctx.lineTo(x, y); }
        });
        ctx.stroke();
      });
    }
  },

  drill: {
    cards: [
      { q: "What's the standard founder vesting schedule?", a: "Four years with a one-year cliff: nothing for 12 months, then 25% at once, then 1/48th per month until month 48.", tags: ["vesting"] },
      { q: "A founder leaves at month 30 on a standard schedule. What do they keep?", a: "30/48 = 62.5% of their shares; the company buys back the unvested 37.5% at the original price.", tags: ["vesting"] },
      { q: "What does the cliff protect against?", a: "Early departures: anyone leaving before 12 months keeps nothing, so a short stint can't walk off with a large stake (dead equity).", tags: ["cliff"] },
      { q: "Single vs double-trigger acceleration?", a: "Single: unvested shares vest on acquisition alone. Double: they vest only if the company is acquired AND the founder is then let go. Double-trigger is the common, acquirer-friendly choice.", tags: ["acceleration"] },
      { q: "What is an 83(b) election and its deadline?", a: "A US IRS filing that taxes restricted founder shares at today's (tiny) value instead of as they vest. Due within 30 days of the grant; it can't be fixed late.", tags: ["tax"] },
      { q: "Why do full-time founders usually split near-equally?", a: "The value is built over the next 7–10 years, not the first months; equity should reflect future commitment. Lopsided splits breed resentment and worry investors.", tags: ["split"] },
      { q: "Name four things a founder agreement should cover.", a: "Equity and vesting (with acceleration and time credit), IP assignment including pre-incorporation work, roles and decision rights, and what happens when someone leaves.", tags: ["agreement"] },
      { q: "What happens to ownership when a leaver's unvested shares are bought back?", a: "They're cancelled, so the remaining founders' percentages rise in proportion.", tags: ["vesting"] }
    ],
    sixtySecond: [
      "Explain four-year vesting with a one-year cliff and why it protects every founder, including you.",
      "List what a founder agreement must settle before a startup raises money, and why IP assignment matters."
    ]
  }
};
