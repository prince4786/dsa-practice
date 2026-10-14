export default {
  id: "customer-discovery",
  track: "startup",
  title: "Customer Discovery",
  difficulty: 1,
  minutes: 14,
  tags: ["customer-discovery", "mom-test", "interviews", "validation"],

  explainer: [
    { type: "p", text: "**Customer discovery** means talking to the people you hope will buy from you, *before* and *while* you build, so you learn what they actually struggle with and what they already do about it. It sounds obvious. Founders still get it wrong, for one reason: **people are polite**. Describe your idea to someone and ask whether they like it, and most will say yes, because saying no to your face is awkward. You walk away feeling great and having learned nothing. Run thirty conversations like that and you can build for a year on a pile of compliments, then launch to silence." },
    { type: "p", text: "The fix is a short book by Rob Fitzpatrick called *The Mom Test*. The name comes from the idea that a good question is one **even your mom can't lie to you about**. Your mom will tell you your business idea is wonderful. She can't make up how she spent last Tuesday. So you stop asking people about your idea, and you ask about **their life**: what they did, what it cost them, what they tried." },

    { type: "h3", text: "The three rules" },
    { type: "list", items: [
      "**Talk about their life, not your idea.** \"Would you use an AI marketer?\" invites a polite yes. \"Walk me through the last time you worked on your company's marketing\" invites a story, and stories have facts in them.",
      "**Ask about specifics in the past, not opinions about the future.** \"Would you pay $50 a month?\" is a guess about a future version of themselves, and people guess generously. \"What did you spend on marketing last quarter: tools, freelancers, your own hours?\" is a fact.",
      "**Talk less, listen more.** If you are talking more than about a quarter of the time, you are pitching, not learning. Pitching comes later, and only if they ask."
    ]},

    { type: "h3", text: "Sorting what people say" },
    { type: "p", text: "Every answer you get falls into one of four buckets. Only two of them are evidence." },
    { type: "list", items: [
      "**Compliments** (\"That's so cool, I'd totally use it\") are noise. They feel good and tell you nothing. When you hear one, steer back: \"Thanks. How do you handle that today?\"",
      "**Hypotheticals** (\"I'd probably pay for that\", \"We'd definitely try it\") are also noise. They describe an imagined future. Notice words like *would*, *might*, *probably*, *usually*, *always*, and dig for a real example.",
      "**Past behaviour** (\"Last month I spent 10 hours on blog posts and paid a freelancer $800\") is evidence. Someone who has already spent time or money on a problem has the problem. Someone who has never tried to solve it probably doesn't care enough.",
      "**Commitments** are the strongest evidence. A commitment is when the person gives up something they value: **time** (a second meeting, a call with their team), **reputation** (an intro to their boss or a peer), or **money** (a pre-order, a paid pilot, a letter of intent). If every conversation ends with \"keep me posted\" and nothing else, that is a polite no."
    ]},
    { type: "callout", tone: "pitfall", text: "The most dangerous interview is the one that *feels* great. A meeting where they loved the idea and promised to try it, but you learned no facts and got no commitment, is a zero. Write down, right after each call, the facts you learned and the commitment you asked for. If both lines are empty, the call didn't count." },

    { type: "h3", text: "A script you can run" },
    { type: "steps", text: "A 30-minute discovery call, step by step. Use the arrows to walk through it.", frames: [
      { text: "**Set the frame (2 min).** Say you're early, you're trying to learn how teams like theirs handle something, and you're not selling anything today. This lowers the pressure to be polite.", slots: ["Intro\n2 min", "Their world\n8 min", "Last painful time\n10 min", "What else\n5 min", "Ask\n5 min"], focus: 0 },
      { text: "**Their world (8 min).** \"Walk me through how marketing happens at your company today. Who does it? What did you ship last month?\" Let them talk. Write down names of tools, people and hours.", slots: ["Intro\n2 min", "Their world\n8 min", "Last painful time\n10 min", "What else\n5 min", "Ask\n5 min"], focus: 1 },
      { text: "**The last painful time (10 min).** \"Tell me about the last time it went badly.\" \"What did it cost you?\" \"What did you try to fix it?\" Dig into anything they've already paid for or hacked together: that is where the money is.", slots: ["Intro\n2 min", "Their world\n8 min", "Last painful time\n10 min", "What else\n5 min", "Ask\n5 min"], focus: 2 },
      { text: "**What else (5 min).** \"Is there anything I should have asked?\" \"Who else should I talk to?\" The second question is a small commitment that also gives you your next interview.", slots: ["Intro\n2 min", "Their world\n8 min", "Last painful time\n10 min", "What else\n5 min", "Ask\n5 min"], focus: 3 },
      { text: "**Ask for a next step (5 min).** Only now, if it fits, describe what you're building in two sentences and ask for something real: a follow-up with their marketer, trying a beta on their own website, or a paid pilot. Note what they say.", slots: ["Intro\n2 min", "Their world\n8 min", "Last painful time\n10 min", "What else\n5 min", "Ask\n5 min"], focus: 4 }
    ]},

    { type: "h3", text: "How many conversations?" },
    { type: "p", text: "There is no magic number, but a useful rule: **keep going until you stop being surprised**. When the last five calls told you nothing new about how people work, what hurts and what they've tried, you've found the pattern for that type of customer. For one well-defined type of customer that is usually 15 to 30 conversations. If you are talking to several types (say, startup founders *and* agencies *and* local businesses), you need that many per type, because each type has its own story. Discovery is never fully over, either: good founders keep doing a few calls a week for years." },

    { type: "h3", text: "What this means for Theoma" },
    { type: "p", text: "Theoma has decided that **Marketing and Sales come first**, and the Marketer turns a URL into a content calendar. The risky assumption isn't \"can our agents write a blog post\"; it's \"who feels marketing pain sharply enough to change how they work, and what do they do about it today?\" That is a discovery question." },
    { type: "list", items: [
      "**Pick two or three customer types to compare**, and talk to 10 to 15 of each: founders of small startups who do their own marketing; the one marketer at a seed or Series A company; small marketing agencies that serve many clients. Each type has a different budget, a different current solution and a different reason to buy.",
      "**Ask about their current stack, not your agents.** \"What did you publish last month? Who wrote it? Which tools do you pay for (an SEO tool, a writing tool, a freelancer)? How many hours did it take you?\" Every dollar and hour they name is a dollar and hour Theoma is competing with.",
      "**Use the waitlist as a source, not a result.** A waitlist signup is a hypothetical (\"I might try this\"). Email the people on it and book calls: a signup who agrees to 30 minutes has made a small commitment; one who won't, hasn't.",
      "**End every call with a concrete ask:** run the Marketer on their real website during the call and book a follow-up to review the output with them. The demos already run the Marketer against real public sites, so this ask is cheap to make. Who says yes, and who comes back, tells you more than any number of \"looks amazing\"s.",
      "**Track two numbers this month:** the share of each call's notes that are facts about the past (aim for over half), and commitments per ten calls. Both are in the table below."
    ]}
  ],

  glossary: [
    { term: "Customer discovery", plain: "Talking to the people you hope will buy, to learn what problems they have and how they deal with them today, before and while you build." },
    { term: "The Mom Test", plain: "A book and method by Rob Fitzpatrick: ask questions about people's real past behaviour, which even someone trying to be nice to you can't fake, instead of asking whether they like your idea." },
    { term: "Compliment", plain: "Praise for your idea, such as \"that's really cool\". Pleasant, but it tells you nothing about whether anyone will pay." },
    { term: "Hypothetical", plain: "An answer about an imagined future, such as \"I would pay for that\". People overestimate what their future selves will do, so these are unreliable." },
    { term: "Past behaviour", plain: "Facts about what someone actually did: the money, time or tools they have already spent on a problem. The best evidence that the problem is real." },
    { term: "Commitment", plain: "Something a person gives up to move forward with you: their time (another meeting), their reputation (an intro to a colleague) or their money (a pre-order or paid pilot)." },
    { term: "Letter of intent (LOI)", plain: "A short written note from a company saying it plans to buy your product on certain terms once it exists. Not legally binding, but a real commitment of reputation." },
    { term: "Paid pilot", plain: "A small, time-limited paid trial of your product with one customer, often at a discount, to prove it works before a bigger deal." },
    { term: "Waitlist", plain: "A list of people who left their email to hear when your product is available. A sign of curiosity, not of willingness to pay." },
    { term: "Leading question", plain: "A question that hints at the answer you want, such as \"Wouldn't it be great if…?\". It invites agreement instead of facts." }
  ],

  complexity: {
    rows: [
      { operation: "Conversations per customer type before deciding", time: "15–20", space: "30+", note: "rule of thumb: stop when calls stop surprising you" },
      { operation: "Share of notes that are past facts", time: "> 50%", space: "> 70%", note: "the rest is compliments and hypotheticals" },
      { operation: "Time you spend talking", time: "< 30%", space: "< 20%", note: "more than that and you are pitching" },
      { operation: "Calls ending in a real commitment", time: "2–3 in 10", space: "4+ in 10", note: "follow-up, intro, pilot or pre-order; rule of thumb, not a study" }
    ]
  },

  interview: {
    whyAsked: "Theoma is an engineering-strong team building fast with AI, which makes it cheap to build the wrong thing very well. Discovery is the cheapest way to find out which customer type (solo founders, startup marketers or agencies) feels marketing pain sharply enough to pay, before months go into features for the wrong one. Investors also ask \"how many customers have you talked to and what did you learn?\" in nearly every early meeting.",
    followUps: [
      { q: "An investor asks: how do you know anyone wants this?", a: "Answer with facts from conversations, not opinions: \"We've talked to 25 seed-stage founders. 18 do their own marketing and spend 5 to 10 hours a week on it; 11 pay a freelancer or an SEO tool. 6 ran our Marketer on their own site and 4 came back for a second session.\" Numbers about past behaviour and commitments beat \"everyone loved it\"." },
      { q: "Isn't a waitlist of a few hundred people proof of demand?", a: "It proves curiosity. A signup costs nothing, so it is a hypothetical. Turn it into evidence by contacting the list: how many will book a call, how many will run the product on their own site, how many will pay. The conversion from signup to each of those steps is the real signal." },
      { q: "A friend says \"I'd definitely pay $100 a month for this\". What do you do?", a: "Treat it as a hypothetical and look for the past behind it: \"What do you pay for marketing today? What did you try last?\" If they already spend $300 a month on a freelancer, $100 is believable. If they spend nothing and have never tried to solve it, the $100 is politeness. Better still, ask for the $100 now as a pre-order or pilot." },
      { q: "How is discovery different from a sales call?", a: "In discovery you are trying to learn whether, and for whom, the problem is real, and you are happy to hear no. In a sales call you have a product and a target and you are trying to close. Mixing them ruins both: pitching early turns people polite, and asking open questions in a sales call wastes the buyer's time. A discovery call ends with a small ask; a sales call ends with a decision." },
      { q: "When should we stop doing discovery and just build?", a: "Never fully stop, but you can commit to building once three things are true for one customer type: the last several calls repeated the same pain, people are already spending time or money on it, and some of them have made commitments (pilots, follow-ups, intros). After that, keep a few calls a week going so you notice when the market changes." },
      { q: "What if people say they have the problem but have never tried to solve it?", a: "That usually means the problem is real but not painful enough to act on: a \"nice to have\". Customers who have hacked together spreadsheets, hired freelancers or bought tools are signalling a \"must have\". Look for the second group; they are the ones who switch to something new." }
    ]
  },

  code: [
    { lang: "python", label: "Score your interview notes", code: "# Tag each note after a call: 'compliment', 'hypothetical', 'past', 'commitment'.\nnotes = {\n    \"founder-a\": [\"compliment\", \"past\", \"past\", \"commitment\"],\n    \"agency-b\":  [\"compliment\", \"hypothetical\", \"hypothetical\"],\n    \"founder-c\": [\"past\", \"past\", \"hypothetical\", \"commitment\"],\n}\n\nEVIDENCE = {\"past\", \"commitment\"}\n\nfor who, tags in notes.items():\n    facts = sum(t in EVIDENCE for t in tags)\n    committed = \"commitment\" in tags\n    print(f\"{who:10} facts {facts}/{len(tags)}  commitment: {committed}\")\n\nall_tags = [t for tags in notes.values() for t in tags]\nshare = sum(t in EVIDENCE for t in all_tags) / len(all_tags)\ncommits = sum(\"commitment\" in tags for tags in notes.values())\nprint(f\"share of notes that are evidence: {share:.0%}\")   # aim for > 50%\nprint(f\"commitments: {commits} of {len(notes)} calls\")" },
    { lang: "pseudo", label: "Rewrite a bad question", code: "BAD   Would you use an AI agent that does your marketing?\nGOOD  Walk me through the last thing you published. Who wrote it?\n\nBAD   How much would you pay for this?\nGOOD  What do you spend on marketing today: tools, freelancers, your hours?\n\nBAD   Do you think SEO is important?\nGOOD  When did you last look at where your traffic comes from? What did you do next?\n\nBAD   Would you try our beta?\nGOOD  Can we run it on your site now and review the output together on Thursday?" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.7, maxFrames: 200 },

    params: [
      { key: "n",     label: "Interviews",     type: "int",  min: 4, max: 16, default: 10 },
      { key: "style", label: "Question style", type: "enum", options: ["leading", "mom-test"], default: "leading" },
      { key: "seed",  label: "New people",     type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = params.n;
      const mom = params.style === "mom-test";
      const CLS = ["compliment", "hypothetical", "past", "commitment"];
      // How likely each kind of answer is, given how you ask.
      const mix = mom ? [0.10, 0.10, 0.55, 0.25] : [0.45, 0.35, 0.15, 0.05];

      const QUOTE = {
        compliment: ["\"That sounds really cool.\"", "\"Love it, I'd totally use that.\"", "\"Wow, AI agents as teammates, nice.\""],
        hypothetical: ["\"I'd probably pay $50 a month.\"", "\"We would definitely try it.\"", "\"I'd use it every week, I think.\""],
        pastYes: ["\"Last month I spent ~10 hours writing posts and paid a freelancer $800.\"", "\"We pay for an SEO tool and still miss our content calendar.\"", "\"I hired an agency in spring; we dropped them, too slow.\""],
        pastNo: ["\"Honestly, we haven't touched marketing since launch.\"", "\"Our customers come from referrals; we don't publish anything.\"", "\"I tried a blog once. Nobody here had time to keep it up.\""],
        commitYes: ["Booked a follow-up with their marketer.", "Ran it on their site during the call; wants a pilot.", "Introduced you to two founder friends."],
        commitNo: ["\"Maybe later, send me something.\" A polite no.", "No time for a follow-up this quarter.", "\"Keep me posted.\" No next step."]
      };
      const pick = (arr) => arr[Math.floor(rng() * arr.length)];

      // Hidden truth: who actually feels the pain sharply enough to buy.
      const people = [];
      for (let i = 0; i < n; i++) people.push({ pain: rng() < 0.35, answers: [] });
      const truePain = people.filter(p => p.pain).length;

      let feels = 0, evidence = 0, posEvidence = 0;

      const snap = (label, phase, cur) => ({
        label, phase, focus: cur >= 0 ? [cur] : [],
        state: {
          n, mom, cur,
          people: people.map(p => ({ pain: p.pain, answers: p.answers.slice() })),
          feels, evidence, posEvidence, truePain,
          reveal: phase === "done"
        }
      });

      yield snap(
        `${n} interviews with ${mom ? "Mom-Test questions about their past" : "leading questions about your idea"}. Hidden: ${truePain} of the ${n} people really feel the pain. Watch which meter moves.`,
        "start", -1);

      for (let i = 0; i < n; i++) {
        const p = people[i];
        const answersPer = 3 + (rng() < 0.4 ? 1 : 0);
        for (let a = 0; a < answersPer; a++) {
          let r = rng(), k = 0;
          while (k < 3 && r >= mix[k]) { r -= mix[k]; k++; }
          const cls = CLS[k];
          let pos, quote;
          if (cls === "compliment") { pos = true; feels += 1; quote = pick(QUOTE.compliment); }
          else if (cls === "hypothetical") { pos = true; feels += 1; quote = pick(QUOTE.hypothetical); }
          else if (cls === "past") {
            pos = p.pain; evidence += 1; if (pos) posEvidence += 1;
            quote = pick(pos ? QUOTE.pastYes : QUOTE.pastNo);
          } else {
            pos = p.pain; evidence += 1; if (pos) posEvidence += 1;
            quote = pick(pos ? QUOTE.commitYes : QUOTE.commitNo);
          }
          p.answers.push({ cls, pos });
          const why = cls === "compliment" ? "a compliment: feels good, zero information"
            : cls === "hypothetical" ? "a hypothetical about the future: people guess generously"
            : cls === "past" ? (pos ? "past behaviour: they already spend time or money on this. Real signal." : "past behaviour: they've never acted on it. An honest no, also real signal.")
            : (pos ? "a commitment of time, reputation or money: the strongest signal" : "they declined the next step: a polite no, and that's useful to know");
          yield snap(`Interview ${i + 1}: ${quote} → ${why}.`, "interview", i);
        }
      }

      const est = evidence ? posEvidence / evidence : 0;
      const truth = truePain / n;
      const feelPct = feels / Math.max(1, feels + evidence);
      yield snap(
        mom
          ? `Done. ${evidence} answers were evidence. They suggest ${(est * 100).toFixed(0)}% of people feel the pain; the hidden truth is ${(truth * 100).toFixed(0)}%. Facts about the past let the no's show up.`
          : `Done. ${(feelPct * 100).toFixed(0)}% of what you heard was compliments and hypotheticals, all positive. Only ${evidence} answers were evidence. The calls felt great; the truth is that only ${(truth * 100).toFixed(0)}% feel the pain.`,
        "done", -1);
    },

    draw: function (frame, ctx, env) {
      const S = frame.state, C = env.colors, W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);
      const pad = 18;
      const COL = { compliment: C.viz4, hypothetical: C.viz3, past: C.viz1, commitment: C.viz2 };
      const SHORT = { compliment: "compliment", hypothetical: "hypothetical", past: "past fact", commitment: "commitment" };

      // ---- legend --------------------------------------------------------
      ctx.font = `11px ${env.font.base}`;
      ctx.textAlign = "left";
      let lx = pad;
      ["compliment", "hypothetical", "past", "commitment"].forEach(k => {
        ctx.fillStyle = COL[k];
        ctx.beginPath(); ctx.roundRect(lx, 9, 12, 12, 3); ctx.fill();
        ctx.fillStyle = C.text2;
        ctx.fillText(SHORT[k], lx + 17, 19);
        lx += ctx.measureText(SHORT[k]).width + 34;
      });
      ctx.fillStyle = C.muted;
      ctx.fillText(S.mom ? "style: Mom Test" : "style: leading", lx + 6, 19);

      // ---- interview grid -------------------------------------------------
      const gridX = pad, gridY = 34;
      const gridW = W * 0.6 - pad;
      const gridH = H - gridY - pad;
      const rowH = Math.min(30, gridH / S.n);
      const chipW = Math.min(46, (gridW - 90) / 4 - 6);

      S.people.forEach((p, i) => {
        const y = gridY + i * rowH;
        if (i === S.cur) {
          ctx.fillStyle = C.surface2;
          ctx.beginPath(); ctx.roundRect(gridX - 4, y, gridW + 4, rowH - 2, 5); ctx.fill();
        }
        ctx.fillStyle = i <= S.cur || S.reveal ? C.text2 : C.muted;
        ctx.font = `11px ${env.font.mono}`;
        ctx.textAlign = "left";
        ctx.fillText(`#${i + 1}`, gridX, y + rowH / 2 + 4);

        if (S.reveal) {
          ctx.fillStyle = p.pain ? C.ok : C.grid;
          ctx.beginPath(); ctx.arc(gridX + 38, y + rowH / 2, 5, 0, Math.PI * 2); ctx.fill();
        }

        p.answers.forEach((a, j) => {
          const x = gridX + 56 + j * (chipW + 6);
          const ch = Math.max(8, rowH - 10);
          ctx.fillStyle = COL[a.cls];
          ctx.globalAlpha = a.cls === "compliment" || a.cls === "hypothetical" ? 0.55 : 1;
          ctx.beginPath(); ctx.roundRect(x, y + (rowH - ch) / 2 - 1, chipW, ch, 4); ctx.fill();
          ctx.globalAlpha = 1;
          if (a.cls === "past" || a.cls === "commitment") {
            ctx.fillStyle = C.bg;
            ctx.font = `bold ${Math.min(12, ch - 2)}px ${env.font.base}`;
            ctx.textAlign = "center";
            ctx.fillText(a.pos ? "+" : "−", x + chipW / 2, y + rowH / 2 + 3);
          }
        });
      });
      if (S.reveal) {
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText("● = really feels the pain (hidden until the end)", gridX, H - 4);
      }

      // ---- meters ---------------------------------------------------------
      const mx = W * 0.62, mw = W - mx - pad;
      const meter = (y, title, frac, col, caption) => {
        ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`; ctx.textAlign = "left";
        ctx.fillText(title, mx, y);
        ctx.fillStyle = C.surface2;
        ctx.beginPath(); ctx.roundRect(mx, y + 8, mw, 16, 8); ctx.fill();
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.roundRect(mx, y + 8, Math.max(2, mw * Math.min(1, frac)), 16, 8); ctx.fill();
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(caption, mx, y + 40);
      };
      const total = S.feels + S.evidence;
      const maxCount = Math.max(12, S.n * 4);
      meter(gridY + 14, "Feels good", S.feels / maxCount, C.viz4, `${S.feels} compliments + hypotheticals`);
      meter(gridY + 78, "Real signal", S.evidence / maxCount, C.viz1, `${S.evidence} past facts + commitments`);

      // estimate vs truth
      const ey = gridY + 150;
      ctx.fillStyle = C.text; ctx.font = `12px ${env.font.base}`;
      ctx.fillText("How many feel the pain?", mx, ey);
      const est = S.evidence ? S.posEvidence / S.evidence : null;
      const feelEst = total ? (S.feels + S.posEvidence) / total : null;
      const row = (y, label, v, col) => {
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
        ctx.fillText(label, mx, y + 12);
        const bx = mx + 92, bw = mw - 130;
        ctx.fillStyle = C.surface2; ctx.beginPath(); ctx.roundRect(bx, y + 2, bw, 12, 6); ctx.fill();
        if (v !== null) {
          ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(bx, y + 2, Math.max(2, bw * v), 12, 6); ctx.fill();
        }
        ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.mono}`; ctx.textAlign = "right";
        ctx.fillText(v === null ? "—" : (v * 100).toFixed(0) + "%", mx + mw, y + 12);
        ctx.textAlign = "left";
      };
      row(ey + 10, "Your gut", feelEst, C.viz4);
      row(ey + 32, "The evidence", est, C.viz1);
      row(ey + 54, "Hidden truth", S.reveal ? S.truePain / S.n : null, C.ok);
      if (!S.reveal) {
        ctx.fillStyle = C.muted; ctx.font = `10px ${env.font.base}`;
        ctx.fillText("truth revealed on the last frame", mx + 92, ey + 82);
      }
    }
  },

  drill: {
    cards: [
      { q: "What is the core idea of the Mom Test?", a: "Ask about the person's real past behaviour, which even someone being nice to you can't fake, instead of asking whether they like your idea.", tags: ["mom-test"] },
      { q: "Name the four kinds of answer you get in a discovery call, and which two are evidence.", a: "Compliments and hypotheticals (noise); past behaviour and commitments (evidence).", tags: ["signal"] },
      { q: "What three things can a commitment cost the customer?", a: "Time (a follow-up meeting), reputation (an intro to a boss or peer), money (pre-order, paid pilot, LOI).", tags: ["commitment"] },
      { q: "Rewrite: \"Would you pay $50 a month for an AI marketer?\"", a: "\"What do you spend on marketing today: tools, freelancers, your own hours?\" Ask about past spending, not future willingness.", tags: ["questions"] },
      { q: "Why is a waitlist signup weak evidence?", a: "It costs nothing, so it's a hypothetical. It becomes evidence only when signups convert into calls, real use, or payment.", tags: ["waitlist"] },
      { q: "Rule of thumb for how many discovery calls you need?", a: "Keep going until calls stop surprising you: usually 15–30 per customer type, and more types means more calls.", tags: ["process"] },
      { q: "What does \"they have the problem but never tried to solve it\" usually mean?", a: "A nice-to-have. People already spending money or hacking workarounds are the must-have customers.", tags: ["signal"] },
      { q: "What two lines should you write after every call?", a: "The facts you learned about their past, and the commitment you asked for and what they said. If both are empty, the call didn't count.", tags: ["process"] }
    ],
    sixtySecond: [
      "Explain why a discovery call that felt great can be worth nothing, and how the Mom Test fixes it.",
      "Explain how you would run discovery for Theoma's Marketer this month: who, what you ask, and what counts as success."
    ]
  }
};
