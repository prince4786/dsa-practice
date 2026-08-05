export default {
  id: "training-pipeline",
  track: "ai",
  title: "Pretrain → SFT → RLHF",
  difficulty: 2,
  minutes: 20,
  tags: ["pretraining", "sft", "rlhf", "dpo", "reward-model"],

  explainer: [
    { type: "p", text: "A modern chat assistant like ChatGPT or Claude is not trained in one single pass — it's built up through several distinct stages, run one after another, and it's worth knowing upfront that **each stage changes a genuinely different thing about the model**. The first stage, pretraining, installs raw knowledge and fluent language ability. The second stage, called SFT, installs **format** — the habit of directly answering a question instead of just continuing to write more text in whatever style it was given. The third stage, preference tuning, installs **taste** — a sense of which of two already-reasonable answers people actually prefer. Mixing these up is the single most common mistake candidates make in this kind of interview: saying \"RLHF teaches the model facts\" is backwards. The preference-tuning stages barely move a model's factual knowledge at all — nearly all of a model's raw capability comes from the very first stage, pretraining." },

    { type: "h3", text: "Stage 1 — pretraining" },
    { type: "list", items: [
      "**Data**: trillions of individual tokens (word-pieces) scraped from web text, source code and books. Most of the real engineering effort here goes into filtering out low-quality text and removing duplicates (**deduplication**) — this quality and dedup work moves the model's final performance more than most changes to the network's architecture do, and removing near-duplicate passages specifically matters because a model that has simply memorised a repeated passage will score artificially well on evaluations that happen to test that exact passage.",
      "**Objective**: the model is trained purely to predict the next token given everything before it, using a loss function called **next-token cross-entropy**, `L = −Σ log P(t_i | t_<i)` — in words, for every position in the text, look at the probability the model assigned to the actual next token that really came next, and penalise the model more the lower that probability was. This is called **self-supervised** learning because the \"correct answers\" are just the existing text itself — no human needs to label anything.",
      "**Cost**: a standard rule of thumb is that training costs roughly `≈6·N·D` floating-point operations (FLOPs, the standard unit of computational work) for a model with `N` parameters trained on `D` tokens — the 6 splits into 2 FLOPs per parameter per token for the forward pass (computing predictions) and 4 for the backward pass (computing how to adjust every weight). A 7-billion-parameter model trained on 2 trillion tokens costs roughly 8.4×10²² FLOPs in total.",
      "**Result**: what comes out of this stage is called a **base model**. It only knows how to continue text in whatever style it's given — ask it a direct question, and it may well respond with more questions of its own, simply because that's a completely plausible way for a random web page containing a question to continue. It isn't broken; it was never taught that questions are supposed to get answers."
    ]},

    { type: "h3", text: "Stage 2 — supervised fine-tuning (instruction tuning)" },
    { type: "p", text: "The second stage, called **SFT** (Supervised Fine-Tuning) or **instruction tuning**, trains the base model further on somewhere between 10,000 and 1,000,000 carefully written `(prompt, ideal response)` pairs — real examples of a question and the kind of answer an assistant should give back. The training objective here is **exactly the same** next-token cross-entropy used in pretraining, with one small but crucial implementation detail: the loss is *masked* (zeroed out) on the prompt tokens, so the model is only ever graded on how well it produces the *response* portion, not on how well it reproduces the question it was given. This stage is comparatively cheap — hours or days, not months — yet it changes the model's behaviour dramatically, because it isn't teaching the model new knowledge, just the *habit* of using knowledge it already has to directly answer a question. Data quality matters far more than quantity at this stage; the widely-cited LIMA result showed that as few as 1,000 carefully hand-written examples can be competitive with SFT datasets orders of magnitude larger." },

    { type: "h3", text: "Stage 3 — preference tuning" },
    { type: "p", text: "SFT can only ever imitate the specific examples it was shown, and for a great many prompts there simply is no single \"ideal\" answer that any one person could sit down and write — but almost anyone can look at two different answers and say which one they prefer. So the third stage collects exactly that kind of comparison data (\"answer A is better than answer B\") and trains the model to optimise for it. There are two common routes to doing this:" },
    { type: "list", items: [
      "**RLHF/PPO** (Reinforcement Learning from Human Feedback, using an algorithm called PPO): first train a separate **reward model**, `r_θ`, whose whole job is to look at a response and output a single number estimating how much a human would like it. It's trained on the human comparisons using something called the Bradley-Terry loss, `−log σ(r(y_w) − r(y_l))` — in words, \"push the reward model's score for the winning response higher than its score for the losing one\". Then a reinforcement-learning algorithm called PPO adjusts the actual chat model (the **policy**) to produce responses that score highly according to that reward model, while also being penalised for straying too far from its behaviour right after SFT (this penalty, explained below, is called a **KL penalty**). This whole setup keeps four separate models resident in memory at once — the policy being trained, a frozen reference copy of the SFT model, the reward model, and an extra helper called a value head — which is a large part of why RLHF is operationally painful to run.",
      "**DPO** (Direct Preference Optimization): a mathematically equivalent shortcut that skips training an explicit reward model altogether. The KL-regularised reinforcement-learning objective used by PPO turns out to have a known, closed-form best answer, `π*(y|x) ∝ π_ref(y|x)·exp(r(x,y)/β)` (\"the best possible policy is proportional to the reference policy, boosted exponentially by how much reward each response gets\"). By algebraically rearranging this formula to express the reward purely in terms of the policy itself, and substituting that back into the Bradley-Terry comparison loss above, you end up with a plain supervised-learning loss computed directly on the preference pairs — reaching the same mathematical target as PPO, but with no separate reward model, no reinforcement-learning loop, and far less operational overhead — at the cost of being unable to explore new responses during training the way PPO's live sampling can."
    ]},

    { type: "callout", tone: "pitfall", text: "The **KL penalty** mentioned above — a term that measures how far the model being trained has drifted from its starting point, using a mathematical measure of distance between two probability distributions called the Kullback-Leibler (KL) divergence — is not an optional regulariser you can safely drop. Without it, the training process will happily walk the model's behaviour off the region of text the reward model was actually trained to judge, and discover bizarre, adversarial-looking text that scores highly on the reward model despite being nonsense — a failure mode called **reward hacking**. In practice you'll see the measured reward keep climbing during training while real human quality ratings fall. The single most common symptom is length: reward models trained on real human comparisons tend to pick up a bias toward longer answers, so training against them without a KL leash tends to make responses get steadily, needlessly longer. You can watch exactly this happen in the visualiser's reward-model stage." },

    { type: "h3", text: "What each stage actually changes" },
    { type: "list", items: [
      "**Pretraining** → knowledge, reasoning ability, fluent language use, and multilingual ability. This stage accounts for essentially all of a model's raw capability.",
      "**SFT** → format and instruction-following behaviour. This is the stage that turns a raw text-completion engine into something that behaves like an assistant.",
      "**Reward model** → an automatic, always-available stand-in for a human judge's opinion. In practice these typically agree with held-out human preference labels only about 65–75% of the time — a genuinely noisy teacher by construction, which is exactly why you can't optimise against it without limit (the KL penalty above is the safeguard).",
      "**PPO/DPO** → tone, helpfulness, how the model handles requests it should refuse, and formatting preferences. This stage sharpens and reshapes a distribution of behaviour the model already has available to it — it does not add new facts or new capabilities.",
      "A well-known consequence of all this: RLHF can make a model *slightly less well-calibrated* (its stated confidence matching its actual accuracy less closely) and marginally worse on some narrow benchmarks — an effect nicknamed the **alignment tax** — even as the resulting model becomes noticeably more useful and pleasant to actually interact with day to day."
    ]},

    { type: "callout", tone: "tip", text: "A few newer variants worth being able to name: **RLAIF / Constitutional AI**, where a separate large language model — rather than a human — generates the preference labels, by judging responses against a written set of principles (a \"constitution\"), substantially cutting the cost of human labelling; **rejection sampling / best-of-n fine-tuning**, a strikingly simple technique where you sample `n` candidate responses, keep only the one the reward model liked best, and run ordinary SFT on that kept response — surprisingly effective given how simple it is; and **RLVR** (Reinforcement Learning from Verifiable Rewards), used for domains like mathematics or code where you can mechanically *check* whether an answer is actually correct, so the \"reward model\" is replaced by a simple verifier program rather than a learned, sometimes-wrong model — which makes reward hacking far less of a concern." }
  ],

  glossary: [
    { term: "Pretraining", plain: "The first, largest training stage, where a model learns language and knowledge by predicting the next token across huge amounts of text." },
    { term: "SFT (supervised fine-tuning)", plain: "A training stage that teaches a pretrained model to answer questions directly, using curated examples of good prompt-and-response pairs." },
    { term: "Base model", plain: "The output of pretraining alone: a model that fluently continues text but has not yet been taught to behave like a helpful assistant." },
    { term: "Cross-entropy loss", plain: "A measure of how wrong a model's predicted probabilities were compared to what actually happened, used to guide training." },
    { term: "FLOPs", plain: "Floating-point operations — the standard unit for counting how much arithmetic a computation requires." },
    { term: "Reward model", plain: "A separate trained model whose job is to look at a response and output a single number estimating how much a human would like it." },
    { term: "Bradley-Terry loss", plain: "A training loss that pushes a reward model's score for a preferred response higher than its score for a rejected one." },
    { term: "PPO (Proximal Policy Optimization)", plain: "A reinforcement-learning algorithm used to adjust a model's behaviour to score well according to a reward model, while staying close to its starting behaviour." },
    { term: "DPO (Direct Preference Optimization)", plain: "A training method that reaches the same goal as PPO-based RLHF directly from preference comparisons, without needing a separate reward model or reinforcement-learning loop." },
    { term: "Policy", plain: "The model currently being trained or used to generate responses, in reinforcement-learning terminology." },
    { term: "KL penalty / KL divergence", plain: "A mathematical measure of how far a model's current behaviour has drifted from a reference version of itself, used to stop training from wandering too far off course." },
    { term: "Reward hacking", plain: "When a model learns to produce output that scores highly on an automatic reward signal without actually being good, exploiting a flaw in how the reward is measured." },
    { term: "Alignment tax", plain: "The observation that preference-tuning a model can slightly reduce its accuracy or calibration on some benchmarks even while making it more useful in practice." },
    { term: "RLHF (Reinforcement Learning from Human Feedback)", plain: "The overall approach of using human preference comparisons, via a reward model and reinforcement learning, to steer a model's behaviour." }
  ],

  complexity: {
    rows: [
      { operation: "Pretraining", time: "≈6·N·D FLOPs", space: "≈16·N bytes (Adam, mixed precision)", note: "months on thousands of GPUs" },
      { operation: "SFT", time: "≈6·N·D_sft, D_sft ~10⁷–10⁹", space: "same as pretraining", note: "hours to days" },
      { operation: "Reward model training", time: "≈6·N_rm·D_pref", space: "1 model", note: "usually initialised from the SFT model" },
      { operation: "PPO", time: "≈4× SFT step cost", space: "4 models resident", note: "policy, reference, reward, value" },
      { operation: "DPO", time: "≈2× SFT step cost", space: "2 models resident", note: "policy + frozen reference" }
    ]
  },

  interview: {
    whyAsked: "It tests whether you understand a modern model as a *pipeline of objectives* rather than a monolith. The discriminating questions are: which stage would you add data to for a given failure, why the KL term exists, and what DPO actually replaces. Answering 'RLHF makes the model smarter' ends the line of questioning badly.",
    followUps: [
      { q: "Your model gets a fact wrong. Which stage do you fix?", a: "Not RLHF — preference tuning reshapes style, not knowledge. Either pretraining/continued pretraining on domain data, or, far more practically, retrieval so the fact is in the context at inference. SFT can teach the model to *say* a fact, but that generalises poorly and is a known driver of hallucination when you fine-tune on facts the base model does not know." },
      { q: "Why is there a KL penalty in the RLHF objective?", a: "The reward model is only valid near the distribution it was trained on. Without a KL leash to the SFT reference, PPO exploits it — reward climbs while human quality falls. β trades reward against staying on-distribution: too large and nothing changes, too small and you get reward hacking and mode collapse." },
      { q: "What exactly does DPO replace?", a: "The reward model and the RL loop. Starting from the closed-form optimum of the KL-regularised objective, `π* ∝ π_ref·exp(r/β)`, you can express the reward as `β log(π/π_ref)` plus a term that cancels inside Bradley-Terry. Substituting gives a supervised loss on `(prompt, chosen, rejected)` triples. Same optimum, two resident models instead of four, no sampling loop — but no online exploration either." },
      { q: "Why mask the prompt tokens in SFT loss?", a: "You want gradient only on the behaviour you are teaching: the response. Training on prompt tokens spends capacity modelling user text, dilutes the signal, and can make the model start imitating user turns. It is a one-line detail that materially changes SFT quality." },
      { q: "How accurate are reward models, and why does that matter?", a: "Typically 65–75% agreement with held-out human preferences. That ceiling is the reason for the KL penalty and for over-optimisation curves: past a certain KL distance, measured reward keeps rising while real human preference declines. It also motivates ensembles and verifiable rewards where the domain allows them." },
      { q: "How would you detect reward hacking in production training?", a: "Track reward and a held-out human/LLM judge separately, plot both against KL from the reference, and watch for divergence. Monitor proxy symptoms — mean response length, n-gram repetition, refusal rate, entropy collapse. If reward is up and length has doubled while win-rate against the SFT model is flat, you are optimising the reward model's length bias." }
    ]
  },

  code: [
    { lang: "python", label: "SFT loss with prompt masking", code: "import torch, torch.nn.functional as F\n\ndef sft_loss(model, input_ids, prompt_len):\n    \"\"\"Standard next-token CE, but graded ONLY on the response tokens.\"\"\"\n    logits = model(input_ids).logits              # (B, L, V)\n    labels = input_ids.clone()\n    labels[:, :prompt_len] = -100                 # ignore_index -> no gradient here\n\n    # shift: token t predicts token t+1\n    return F.cross_entropy(\n        logits[:, :-1].reshape(-1, logits.size(-1)),\n        labels[:, 1:].reshape(-1),\n        ignore_index=-100,\n    )\n\n# Identical objective to pretraining. The ONLY differences are the data\n# (curated instruction/response pairs) and this mask." },
    { lang: "python", label: "Bradley-Terry reward model + PPO objective", code: "import torch, torch.nn.functional as F\n\ndef reward_model_loss(r_chosen, r_rejected):\n    \"\"\"Bradley-Terry: P(y_w > y_l) = sigmoid(r_w - r_l).\"\"\"\n    return -F.logsigmoid(r_chosen - r_rejected).mean()\n    # Only the DIFFERENCE is identified -- the reward has an arbitrary\n    # per-prompt offset, which is exactly why PPO needs a baseline/value head.\n\ndef ppo_reward(r, logp_policy, logp_ref, beta=0.05):\n    \"\"\"Per-token KL leash keeps the policy near the SFT reference.\"\"\"\n    kl = logp_policy - logp_ref                   # sample estimate of KL\n    return r - beta * kl\n\n# The KL-regularised optimum has a closed form:\n#     pi*(y|x)  =  pi_ref(y|x) * exp(r(x,y)/beta) / Z(x)\n# Small beta -> sharp, high-reward, off-distribution (reward hacking).\n# Large beta -> stays put, learns nothing." },
    { lang: "python", label: "DPO: the same optimum without a reward model", code: "import torch, torch.nn.functional as F\n\ndef dpo_loss(policy_logps_chosen, policy_logps_rejected,\n             ref_logps_chosen,    ref_logps_rejected, beta=0.1):\n    \"\"\"Invert pi* ∝ pi_ref·exp(r/beta) to get r = beta·log(pi/pi_ref) + logZ.\n    logZ cancels inside Bradley-Terry, leaving a pure supervised loss.\"\"\"\n    chosen_logratio   = policy_logps_chosen   - ref_logps_chosen\n    rejected_logratio = policy_logps_rejected - ref_logps_rejected\n    logits = beta * (chosen_logratio - rejected_logratio)\n    return -F.logsigmoid(logits).mean()\n\n# Two models in memory (policy + frozen reference) instead of four.\n# No sampling loop, no value head, no reward model -- but also no online\n# exploration: DPO only ever sees the pairs you collected up front." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 260 },

    params: [
      { key: "size", label: "Model size", type: "enum", options: ["1B", "7B", "70B"], default: "7B" },
      { key: "method", label: "Preference method", type: "enum", options: ["PPO (RLHF)", "DPO"], default: "PPO (RLHF)" },
      { key: "beta", label: "KL coefficient β", type: "enum", options: ["0.02", "0.1", "0.5"], default: "0.1" },
      { key: "seed", label: "Reshuffle labels", type: "seed" }
    ],

    frames: function* (params, rng) {
      const SIZES = { "1B": 1.3e9, "7B": 7e9, "70B": 70e9 };
      const TOKENS = { "1B": 3e11, "7B": 2e12, "70B": 1.5e13 };
      const sizeKey = SIZES[params.size] ? params.size : "7B";
      const N = SIZES[sizeKey], D = TOKENS[sizeKey];
      const ppo = params.method !== "DPO";
      const beta = parseFloat(params.beta) || 0.1;

      const r3 = (v) => (Math.round(v * 1000) / 1000) || 0;
      const r4 = (v) => (Math.round(v * 10000) / 10000) || 0;
      const sig = (z) => 1 / (1 + Math.exp(-z));
      const fmtBig = (x) => {
        if (x >= 1e21) return (x / 1e21).toFixed(1) + "×10²¹";
        if (x >= 1e12) return (x / 1e12).toFixed(1) + "T";
        if (x >= 1e9) return (x / 1e9).toFixed(1) + "B";
        if (x >= 1e6) return (x / 1e6).toFixed(1) + "M";
        if (x >= 1e3) return (x / 1e3).toFixed(0) + "k";
        return String(Math.round(x));
      };

      const STAGES = [
        { key: "corpus", name: "Web corpus", short: "corpus" },
        { key: "pretrain", name: "Pretraining", short: "base model" },
        { key: "sft", name: "SFT", short: "instruction pairs" },
        { key: "pref", name: "Preference data", short: "comparisons" },
        { key: "rm", name: "Reward model", short: "r(x,y)" },
        { key: "opt", name: ppo ? "PPO" : "DPO", short: ppo ? "RL loop" : "direct loss" }
      ];

      const snap = (extra) => Object.assign({
        stages: STAGES.map((s) => ({ key: s.key, name: s.name, short: s.short })),
        cur: 0, N: N, D: D, size: sizeKey, ppo: ppo, beta: beta,
        detail: null, chart: null, sample: null
      }, extra || {});

      // =============== stage 0: corpus =====================================
      yield {
        label: `The pipeline in one line: a corpus becomes a base model, a base model becomes an assistant, and an assistant gets its taste tuned. Each arrow changes something different — that distinction is the whole interview.`,
        phase: "intro",
        state: snap({ cur: 0, detail: { title: "Overview", rows: [["stages", "6"], ["model", `${sizeKey} params`], ["method", ppo ? "PPO (RLHF)" : "DPO"]], changes: "Nothing yet — this is the map." } })
      };
      yield {
        label: `Stage 1: raw web text, code and books — ${fmtBig(D)} tokens for a ${sizeKey} model. Most of the engineering here is filtering and near-duplicate removal, which moves final loss more than most architecture changes.`,
        phase: "corpus",
        state: snap({
          cur: 0,
          detail: { title: "Web corpus", rows: [["raw tokens", fmtBig(D * 5)], ["after dedup + filter", fmtBig(D)], ["labels required", "none (self-supervised)"]], changes: "Nothing about the model — but data quality here caps everything downstream." },
          chart: { kind: "scale", bars: [["corpus", D], ["sft", 5e7], ["prefs", 5e7 / 50], ["rlhf prompts", 1e6]] },
          sample: { prompt: "The capital of France is", output: "(this is just text in the corpus — no notion of a question yet)" }
        })
      };
      yield {
        label: `Deduplication matters more than it sounds: memorised duplicates inflate benchmark scores and waste capacity. Typical pipelines drop 60–80% of crawled text before training on it.`,
        phase: "corpus",
        state: snap({
          cur: 0,
          detail: { title: "Filtering", rows: [["quality classifier", "keep ~30%"], ["exact + near dedup", "MinHash / suffix array"], ["decontamination", "remove eval sets"]], changes: "Removes memorisation shortcuts and eval contamination." },
          chart: { kind: "scale", bars: [["crawled", D * 5], ["quality-filtered", D * 1.6], ["deduped", D]] }
        })
      };

      // =============== stage 1: pretraining ================================
      const flops = 6 * N * D;
      const h100 = flops / (9.9e14 * 0.4) / 3600 / 24;      // H100 bf16 @ 40% MFU, in days
      yield {
        label: `Stage 2 — pretraining. Objective: next-token cross-entropy, `.concat(`L = −Σ log P(tᵢ | t_<i). Cost ≈ 6·N·D = 6 × ${fmtBig(N)} × ${fmtBig(D)} = ${fmtBig(flops)} FLOPs (2 forward + 4 backward per parameter per token).`),
        phase: "pretrain",
        state: snap({
          cur: 1,
          detail: { title: "Pretraining", rows: [["objective", "next-token CE"], ["params updated", "all " + fmtBig(N)], ["FLOPs", fmtBig(flops)], ["≈ H100-days @40% MFU", Math.round(h100 * 1).toLocaleString()]], changes: "Installs knowledge, grammar, reasoning — essentially ALL raw capability." },
          chart: { kind: "loss", title: "train loss (nats/token)", pts: [[0, 10.9], [1, 4.1], [2, 3.2], [3, 2.8], [4, 2.55], [5, 2.40], [6, 2.31], [7, 2.25], [8, 2.21], [9, 2.18]], xlab: "tokens seen (% of D)" },
          sample: { prompt: "What is the capital of France?", output: "What is the capital of Germany? What is the capital of Spain? …" }
        })
      };
      yield {
        label: `The loss curve is a power law in compute, not a plateau — every doubling of compute buys a predictable slice of loss. That regularity is what makes scaling laws usable for planning (next lesson).`,
        phase: "pretrain",
        state: snap({
          cur: 1,
          detail: { title: "Pretraining", rows: [["memory", `≈16 bytes/param = ${fmtBig(16 * N)} B`], ["parallelism", "data + tensor + pipeline"], ["duration", "weeks to months"]], changes: "Loss falls as a power law in compute — smooth and predictable." },
          chart: { kind: "loss", title: "train loss (nats/token)", pts: [[0, 10.9], [1, 4.1], [2, 3.2], [3, 2.8], [4, 2.55], [5, 2.40], [6, 2.31], [7, 2.25], [8, 2.21], [9, 2.18]], xlab: "tokens seen (% of D)" }
        })
      };
      yield {
        label: `Output of this stage is a BASE model. It completes documents. Asked a question, it often produces more questions — because that is what a page of questions looks like in the corpus. It is not broken; it was never asked to answer.`,
        phase: "pretrain",
        state: snap({
          cur: 1,
          detail: { title: "Base model", rows: [["can", "complete, few-shot, in-context learn"], ["cannot", "reliably follow an instruction"], ["knows facts", "yes"]], changes: "A completion engine, not an assistant." },
          sample: { prompt: "What is the capital of France?", output: "What is the capital of Germany? What is the capital of Spain? …" }
        })
      };

      // =============== stage 2: SFT ========================================
      const sftEx = 5e4;
      yield {
        label: `Stage 3 — SFT. ${fmtBig(sftEx)} curated (prompt, ideal response) pairs. The objective is EXACTLY the pretraining objective; the only differences are the data and one mask.`,
        phase: "sft",
        state: snap({
          cur: 2,
          detail: { title: "Supervised fine-tuning", rows: [["examples", fmtBig(sftEx)], ["objective", "next-token CE (same!)"], ["tokens", "≈" + fmtBig(sftEx * 500)], ["cost vs pretrain", "~0.001×"]], changes: "Installs FORMAT: answer the question, in the assistant's voice." },
          chart: { kind: "scale", bars: [["pretrain tokens", D], ["sft tokens", sftEx * 500]] },
          sample: { prompt: "What is the capital of France?", output: "The capital of France is Paris." }
        })
      };
      yield {
        label: `The one detail that matters: mask the loss on the prompt tokens (`.concat("labels[:, :prompt_len] = -100`). Grade the model only on the response, or you spend capacity modelling user text and it starts imitating user turns."),
        phase: "sft",
        state: snap({
          cur: 2,
          detail: { title: "Prompt masking", rows: [["prompt tokens", "ignore_index = −100"], ["response tokens", "full CE gradient"], ["data quality", "dominates quantity (LIMA)"]], changes: "Gradient only on the behaviour you want to teach." },
          sample: { prompt: "What is the capital of France?", output: "The capital of France is Paris." }
        })
      };
      yield {
        label: `SFT cannot go further than its demonstrations. For most prompts nobody can write THE ideal answer — but anyone can pick the better of two. That asymmetry is the entire reason preference tuning exists.`,
        phase: "sft",
        state: snap({
          cur: 2,
          detail: { title: "Limit of SFT", rows: [["teaches", "imitation of demonstrations"], ["cannot teach", "relative quality"], ["labeller cost", "writing ≫ comparing"]], changes: "Motivates the next stage." },
          sample: { prompt: "Explain recursion to a 10-year-old.", output: "Recursion is when a function calls itself. (correct, but is it the BEST answer?)" }
        })
      };

      // =============== stage 3: preference data ============================
      // 4 candidate responses described by 2 features: [helpfulness, length]
      const RESP = [
        { name: "A: concise & correct", phi: [0.9, 0.3] },
        { name: "B: long & padded", phi: [0.4, 0.9] },
        { name: "C: thorough & correct", phi: [0.7, 0.7] },
        { name: "D: terse & vague", phi: [0.2, 0.2] }
      ];
      const PAIRS = [
        { w: 0, l: 3, note: "clearly right over clearly vague" },
        { w: 2, l: 1, note: "substance over padding" },
        { w: 0, l: 1, note: "concise correctness over padding" },
        { w: 2, l: 3, note: "thorough over terse" },
        { w: 1, l: 0, note: "a NOISY label — this rater just preferred the longer answer" }
      ];

      yield {
        label: `Stage 4 — preference data. ${PAIRS.length} comparisons over ${RESP.length} candidate responses, each described here by two features: helpfulness and length. Real datasets are 50k–1M comparisons and are 60–80% inter-annotator agreement — noisy by nature.`,
        phase: "pref",
        state: snap({
          cur: 3,
          detail: { title: "Preference pairs", rows: PAIRS.map((p) => [`${RESP[p.w].name.split(":")[0]} ≻ ${RESP[p.l].name.split(":")[0]}`, p.note]), changes: "Collects RELATIVE judgements, which humans give far more reliably than absolute scores." },
          chart: { kind: "resp", resp: RESP.map((r) => ({ name: r.name, phi: r.phi.slice(), r: null })) }
        })
      };

      // =============== stage 4: reward model (real gradient descent) =======
      let w = [0, 0];
      const lr = 0.9;
      const rewardOf = (phi) => w[0] * phi[0] + w[1] * phi[1];

      yield {
        label: `Stage 5 — train the reward model with the Bradley-Terry loss: P(y_w ≻ y_l) = σ(r(y_w) − r(y_l)), so L = −log σ(Δr). Start from w = [0, 0], meaning every response has reward 0 and every comparison is a coin flip (loss = −log 0.5 = 0.693).`,
        phase: "rm",
        state: snap({
          cur: 4,
          detail: { title: "Reward model", rows: [["form", "r(y) = w·φ(y)"], ["w", `[${w[0]}, ${w[1]}]`], ["loss", "−log σ(r_w − r_l)"], ["init from", "the SFT model + scalar head"]], changes: "Turns discrete human comparisons into a differentiable score." },
          chart: { kind: "rm", w: w.slice(), resp: RESP.map((r) => ({ name: r.name, phi: r.phi.slice(), r: r3(rewardOf(r.phi)) })), pairs: PAIRS.map((p) => ({ w: p.w, l: p.l, d: 0, p: 0.5, loss: r3(-Math.log(0.5)) })), hist: [] }
        })
      };

      const hist = [];
      for (let step = 1; step <= 13; step++) {
        const grad = [0, 0];
        let loss = 0, correct = 0;
        const detailPairs = [];
        for (let i = 0; i < PAIRS.length; i++) {
          const dphi = [RESP[PAIRS[i].w].phi[0] - RESP[PAIRS[i].l].phi[0], RESP[PAIRS[i].w].phi[1] - RESP[PAIRS[i].l].phi[1]];
          const dr = w[0] * dphi[0] + w[1] * dphi[1];
          const p = sig(dr);
          loss += -Math.log(Math.max(1e-12, p));
          if (p > 0.5) correct++;
          grad[0] += -(1 - p) * dphi[0];
          grad[1] += -(1 - p) * dphi[1];
          detailPairs.push({ w: PAIRS[i].w, l: PAIRS[i].l, d: r3(dr), p: r3(p), loss: r3(-Math.log(Math.max(1e-12, p))) });
        }
        loss = loss / PAIRS.length;
        grad[0] /= PAIRS.length; grad[1] /= PAIRS.length;
        hist.push([step - 1, r3(loss)]);

        w = [r4(w[0] - lr * grad[0]), r4(w[1] - lr * grad[1])];

        yield {
          label: `RM step ${step}: mean BT loss ${r3(loss)}, agreement ${correct}/${PAIRS.length}. Gradient [${r3(grad[0])}, ${r3(grad[1])}] → w = [${w[0]}, ${w[1]}]. ${w[1] > 0.25 * Math.abs(w[0]) ? "Note w[length] is climbing too — the noisy pro-length label is teaching the reward model that longer is better. This is the length bias every real RLHF pipeline fights." : "Helpfulness weight is growing fastest, as it should."}`,
          phase: "rm",
          focus: [step],
          state: snap({
            cur: 4,
            detail: { title: "Reward model", rows: [["step", `${step}/13`], ["w (helpful, length)", `[${w[0]}, ${w[1]}]`], ["mean loss", String(r3(loss))], ["pairwise accuracy", `${correct}/${PAIRS.length}`]], changes: "Learns a scalar proxy for human preference — accurate ~65–75% of the time in practice." },
            chart: { kind: "rm", w: w.slice(), resp: RESP.map((r) => ({ name: r.name, phi: r.phi.slice(), r: r3(rewardOf(r.phi)) })), pairs: detailPairs, hist: hist.map((h) => h.slice()) }
          })
        };
      }

      const rewards = RESP.map((r) => r3(rewardOf(r.phi)));
      yield {
        label: `Reward model trained: r = ${w[0]}·helpful + ${w[1]}·length. Scores: ${RESP.map((r, i) => `${r.name.split(":")[0]}=${rewards[i]}`).join(", ")}. Only DIFFERENCES are identified — Bradley-Terry cannot pin an absolute scale, which is exactly why PPO needs a baseline.`,
        phase: "rm",
        state: snap({
          cur: 4,
          detail: { title: "Trained reward model", rows: [["w", `[${w[0]}, ${w[1]}]`], ["best", RESP[rewards.indexOf(Math.max.apply(null, rewards))].name], ["identifiability", "only r_w − r_l"], ["human agreement", "~65–75% in practice"]], changes: "An automatic, differentiable — and noisy — stand-in for a human rater." },
          chart: { kind: "rm", w: w.slice(), resp: RESP.map((r, i) => ({ name: r.name, phi: r.phi.slice(), r: rewards[i] })), pairs: [], hist: hist.map((h) => h.slice()) }
        })
      };

      // =============== stage 5: PPO / DPO (real KL-regularised optimisation)
      const piRef = [0.40, 0.30, 0.20, 0.10];         // the SFT policy
      let pi = piRef.slice();
      const eta = 0.6;
      const klOf = (p) => { let s = 0; for (let i = 0; i < p.length; i++) if (p[i] > 0) s += p[i] * Math.log(p[i] / piRef[i]); return s; };
      const erOf = (p) => { let s = 0; for (let i = 0; i < p.length; i++) s += p[i] * rewards[i]; return s; };

      yield {
        label: `Stage 6 — ${ppo ? "PPO" : "DPO"}. Objective: maximise E_π[r] − β·KL(π ‖ π_ref) with β = ${beta}. The SFT model is the reference π_ref = [${piRef.join(", ")}]; E[r] = ${r3(erOf(pi))}, KL = 0 (we start exactly at the reference).`,
        phase: "opt",
        state: snap({
          cur: 5,
          detail: { title: ppo ? "PPO objective" : "DPO objective", rows: [["reward", "from the RM above"], ["β", String(beta)], ["models resident", ppo ? "4 (policy, ref, RM, value)" : "2 (policy, ref)"], ["exploration", ppo ? "online sampling" : "none — fixed pairs"]], changes: ppo ? "Optimises the policy against the reward model, leashed to the SFT model by KL." : "Optimises the SAME objective in closed form, straight from preference pairs." },
          chart: { kind: "policy", pi: pi.slice(), ref: piRef.slice(), r: rewards.slice(), names: RESP.map((x) => x.name), kl: 0, er: r3(erOf(pi)), obj: r3(erOf(pi)) }
        })
      };

      for (let step = 1; step <= 13; step++) {
        const next = [];
        let Z = 0;
        for (let i = 0; i < pi.length; i++) {
          const g = rewards[i] - beta * (Math.log(pi[i]) - Math.log(piRef[i]));
          const v = pi[i] * Math.exp(eta * g);
          next.push(v); Z += v;
        }
        pi = next.map((v) => r4(v / Z));
        const kl = klOf(pi), er = erOf(pi);
        const obj = er - beta * kl;
        let top = 0;
        for (let i = 1; i < pi.length; i++) if (pi[i] > pi[top]) top = i;
        yield {
          label: `${ppo ? "PPO" : "DPO"} step ${step}: π = [${pi.map((p) => p.toFixed(3)).join(", ")}], E[r] = ${r3(er)}, KL = ${r3(kl)}, objective = ${r3(obj)}. Mass is moving onto "${RESP[top].name}"${beta <= 0.05 ? " — and with β this small the KL is exploding: this is what over-optimisation looks like." : beta >= 0.5 ? " — but β is large, so the policy barely leaves the reference." : "."}`,
          phase: "opt",
          focus: [step],
          state: snap({
            cur: 5,
            detail: { title: ppo ? "PPO step" : "DPO step", rows: [["E[r]", String(r3(er))], ["KL(π‖π_ref)", String(r3(kl))], ["objective", String(r3(obj))], ["β", String(beta)]], changes: "Shifts probability mass towards high-reward responses without leaving the reference's neighbourhood." },
            chart: { kind: "policy", pi: pi.slice(), ref: piRef.slice(), r: rewards.slice(), names: RESP.map((x) => x.name), kl: r3(kl), er: r3(er), obj: r3(obj) }
          })
        };
      }

      // closed-form optimum for comparison
      const star = [];
      let Zs = 0;
      for (let i = 0; i < piRef.length; i++) { const v = piRef[i] * Math.exp(rewards[i] / beta); star.push(v); Zs += v; }
      const piStar = star.map((v) => r4(v / Zs));

      yield {
        label: `Closed form: π*(y) ∝ π_ref(y)·exp(r(y)/β) = [${piStar.map((p) => p.toFixed(3)).join(", ")}]. Our iterates are converging to exactly this. DPO's insight is that you can invert this equation to write r = β·log(π/π_ref) + logZ, substitute it into Bradley-Terry, watch logZ cancel — and train the policy directly on the pairs, with no reward model and no RL loop.`,
        phase: "opt",
        state: snap({
          cur: 5,
          detail: { title: "KL-regularised optimum", rows: [["π*", `∝ π_ref·exp(r/β)`], ["β → 0", "argmax: mode collapse"], ["β → ∞", "π* → π_ref: no change"], ["DPO", "same π*, supervised loss"]], changes: "Both PPO and DPO target this same distribution." },
          chart: { kind: "policy", pi: piStar.slice(), ref: piRef.slice(), r: rewards.slice(), names: RESP.map((x) => x.name), kl: r3(klOf(piStar)), er: r3(erOf(piStar)), obj: r3(erOf(piStar) - beta * klOf(piStar)) }
        })
      };

      yield {
        label: `Pipeline complete. Pretraining gave capability (${fmtBig(flops)} FLOPs). SFT gave format (~0.1% of that). Preference tuning gave taste — and moved essentially zero knowledge. When a model gets a FACT wrong, the fix is upstream or retrieval, never more RLHF.`,
        phase: "done",
        state: snap({
          cur: 5,
          detail: { title: "What changed where", rows: [["pretraining", "knowledge, fluency, reasoning"], ["SFT", "instruction-following format"], ["reward model", "a proxy for human taste"], [ppo ? "PPO" : "DPO", "tone, helpfulness, refusals"]], changes: "Capability is upstream; behaviour is downstream." },
          chart: { kind: "policy", pi: piStar.slice(), ref: piRef.slice(), r: rewards.slice(), names: RESP.map((x) => x.name), kl: r3(klOf(piStar)), er: r3(erOf(piStar)), obj: r3(erOf(piStar) - beta * klOf(piStar)) },
          sample: { prompt: "Explain recursion to a 10-year-old.", output: "Imagine two mirrors facing each other… (chosen because raters preferred it, not because it is more probable)" }
        })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const nS = s.stages.length;
      const padX = 14;
      const boxW = (W - padX * 2 - (nS - 1) * 14) / nS;
      const boxH = 44, boxY = 26;

      // ---------------- pipeline -------------------------------------------
      ctx.textBaseline = "middle";
      for (let i = 0; i < nS; i++) {
        const x = padX + i * (boxW + 14);
        const done = i < s.cur, cur = i === s.cur;
        ctx.fillStyle = cur ? C.viz1 : (done ? C.surface2 : C.surface);
        ctx.strokeStyle = cur ? C.viz1 : (done ? C.viz3 : C.border);
        ctx.lineWidth = cur ? 2 : 1;
        ctx.beginPath();
        ctx.roundRect(x, boxY, boxW, boxH, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = cur ? C.surface : (done ? C.text2 : C.muted);
        ctx.font = `11px ${env.font.base}`;
        ctx.textAlign = "center";
        ctx.fillText(s.stages[i].name, x + boxW / 2, boxY + boxH / 2 - 7);
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(s.stages[i].short, x + boxW / 2, boxY + boxH / 2 + 9);

        if (i < nS - 1) {
          const ax = x + boxW + 3, ay = boxY + boxH / 2;
          ctx.strokeStyle = i < s.cur ? C.viz3 : C.axis;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(ax, ay); ctx.lineTo(ax + 8, ay);
          ctx.stroke();
          ctx.fillStyle = i < s.cur ? C.viz3 : C.axis;
          ctx.beginPath();
          ctx.moveTo(ax + 11, ay); ctx.lineTo(ax + 5, ay - 3.5); ctx.lineTo(ax + 5, ay + 3.5);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.textAlign = "left";
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`${s.size} params · ${s.ppo ? "PPO" : "DPO"} · β = ${s.beta}`, padX, 16);

      // ---------------- detail panel (left) --------------------------------
      const topY = boxY + boxH + 16;
      const leftW = Math.min(300, W * 0.34);
      const sampleH = s.sample ? 74 : 0;
      const panelH = H - topY - sampleH - 12;

      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(padX, topY, leftW, panelH, 6);
      ctx.fill();
      ctx.stroke();

      if (s.detail) {
        ctx.fillStyle = C.text;
        ctx.font = `12px ${env.font.base}`;
        ctx.textBaseline = "alphabetic";
        ctx.fillText(s.detail.title, padX + 12, topY + 20);
        let y = topY + 40;
        ctx.font = `10px ${env.font.mono}`;
        for (let i = 0; i < s.detail.rows.length && y < topY + panelH - 52; i++) {
          ctx.fillStyle = C.muted;
          ctx.fillText(String(s.detail.rows[i][0]), padX + 12, y);
          ctx.fillStyle = C.text2;
          const v = String(s.detail.rows[i][1]);
          ctx.fillText(v.length > 26 ? v.slice(0, 26) + "…" : v, padX + 12 + Math.min(130, leftW * 0.44), y);
          y += 16;
        }
        // "what changes here"
        const cy = topY + panelH - 46;
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.moveTo(padX + 10, cy - 12); ctx.lineTo(padX + leftW - 10, cy - 12);
        ctx.stroke();
        ctx.fillStyle = C.viz4;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText("WHAT CHANGES HERE", padX + 12, cy);
        ctx.fillStyle = C.text2;
        ctx.font = `10px ${env.font.base}`;
        const words = String(s.detail.changes).split(" ");
        let line = "", ly = cy + 15;
        for (let i = 0; i < words.length; i++) {
          const test = line ? line + " " + words[i] : words[i];
          if (ctx.measureText(test).width > leftW - 26) { ctx.fillText(line, padX + 12, ly); ly += 13; line = words[i]; if (ly > topY + panelH - 6) break; }
          else line = test;
        }
        if (line && ly <= topY + panelH - 6) ctx.fillText(line, padX + 12, ly);
      }

      // ---------------- chart (right) --------------------------------------
      const cx0 = padX + leftW + 14;
      const cW = W - cx0 - padX;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.beginPath();
      ctx.roundRect(cx0, topY, cW, panelH, 6);
      ctx.fill();
      ctx.stroke();

      const ch = s.chart;
      ctx.textBaseline = "alphabetic";
      if (ch && ch.kind === "scale") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText("dataset scale (log₁₀ tokens/examples)", cx0 + 12, topY + 20);
        const maxL = Math.log10(Math.max.apply(null, ch.bars.map((b) => b[1])));
        for (let i = 0; i < ch.bars.length; i++) {
          const y = topY + 40 + i * 30;
          const lv = Math.log10(Math.max(1, ch.bars[i][1]));
          const bw = (cW - 150) * (lv / maxL);
          ctx.fillStyle = C.viz1;
          ctx.fillRect(cx0 + 100, y, Math.max(2, bw), 15);
          ctx.fillStyle = C.text2;
          ctx.font = `10px ${env.font.base}`;
          ctx.textAlign = "right";
          ctx.fillText(ch.bars[i][0], cx0 + 92, y + 12);
          ctx.textAlign = "left";
          ctx.fillStyle = C.muted;
          ctx.font = `10px ${env.font.mono}`;
          ctx.fillText(ch.bars[i][1] >= 1e9 ? (ch.bars[i][1] / 1e9).toFixed(1) + "B" : ch.bars[i][1] >= 1e6 ? (ch.bars[i][1] / 1e6).toFixed(1) + "M" : String(ch.bars[i][1]), cx0 + 106 + Math.max(2, bw), y + 12);
        }
      } else if (ch && ch.kind === "loss") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(ch.title, cx0 + 12, topY + 20);
        const gx = cx0 + 44, gy = topY + 34, gw = cW - 64, gh = panelH - 66;
        const xs = ch.pts.map((p) => p[0]), ys = ch.pts.map((p) => p[1]);
        const x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
        ctx.strokeStyle = C.axis;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(gx, gy); ctx.lineTo(gx, gy + gh); ctx.lineTo(gx + gw, gy + gh);
        ctx.stroke();
        ctx.strokeStyle = C.viz1;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < ch.pts.length; i++) {
          const px = gx + ((ch.pts[i][0] - x0) / Math.max(1e-9, x1 - x0)) * gw;
          const py = gy + gh - ((ch.pts[i][1] - y0) / Math.max(1e-9, y1 - y0)) * gh;
          if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(y1.toFixed(1), cx0 + 12, gy + 8);
        ctx.fillText(y0.toFixed(2), cx0 + 12, gy + gh);
        ctx.fillText(ch.xlab, gx, gy + gh + 16);
      } else if (ch && ch.kind === "resp") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText("candidate responses, features φ = [helpful, length]", cx0 + 12, topY + 20);
        for (let i = 0; i < ch.resp.length; i++) {
          const y = topY + 44 + i * 30;
          ctx.fillStyle = C.text2;
          ctx.font = `10px ${env.font.base}`;
          ctx.fillText(ch.resp[i].name, cx0 + 12, y);
          for (let k = 0; k < 2; k++) {
            const bx = cx0 + 200 + k * 110;
            ctx.fillStyle = C.surface2;
            ctx.fillRect(bx, y - 10, 90, 12);
            ctx.fillStyle = k === 0 ? C.viz3 : C.viz4;
            ctx.fillRect(bx, y - 10, 90 * ch.resp[i].phi[k], 12);
            ctx.fillStyle = C.text2;
            ctx.font = `9px ${env.font.mono}`;
            ctx.fillText(ch.resp[i].phi[k].toFixed(1), bx + 94, y);
          }
        }
      } else if (ch && ch.kind === "rm") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(`r(y) = ${ch.w[0]}·helpful + ${ch.w[1]}·length`, cx0 + 12, topY + 20);
        for (let i = 0; i < ch.resp.length; i++) {
          const y = topY + 42 + i * 22;
          ctx.fillStyle = C.text2;
          ctx.font = `10px ${env.font.base}`;
          ctx.fillText(ch.resp[i].name.split(":")[0] + ": " + ch.resp[i].name.split(":")[1], cx0 + 12, y);
          const bx = cx0 + 190, bw = cW - 250;
          const mx = Math.max(0.5, Math.max.apply(null, ch.resp.map((r) => Math.abs(r.r))));
          ctx.fillStyle = C.surface2;
          ctx.fillRect(bx, y - 9, bw, 11);
          ctx.fillStyle = ch.resp[i].r >= 0 ? C.viz1 : C.viz2;
          ctx.fillRect(bx, y - 9, Math.max(1, (Math.abs(ch.resp[i].r) / mx) * bw), 11);
          ctx.fillStyle = C.text2;
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(ch.resp[i].r.toFixed(2), bx + bw + 6, y);
        }
        let py2 = topY + 42 + ch.resp.length * 22 + 12;
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        for (let i = 0; i < ch.pairs.length && py2 < topY + panelH - 42; i++) {
          const p = ch.pairs[i];
          ctx.fillStyle = p.p > 0.5 ? C.ok : C.danger;
          ctx.fillText(`Δr=${p.d.toFixed(2)}  σ(Δ)=${p.p.toFixed(3)}  −logσ=${p.loss.toFixed(3)}`, cx0 + 12, py2);
          py2 += 13;
        }
        // loss history sparkline
        if (ch.hist && ch.hist.length > 1) {
          const gx = cx0 + cW - 130, gy = topY + panelH - 60, gw = 110, gh = 44;
          const ys = ch.hist.map((h) => h[1]);
          const y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);
          ctx.strokeStyle = C.axis;
          ctx.lineWidth = 1;
          ctx.strokeRect(gx, gy, gw, gh);
          ctx.strokeStyle = C.viz2;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          for (let i = 0; i < ch.hist.length; i++) {
            const px = gx + (i / Math.max(1, ch.hist.length - 1)) * gw;
            const py3 = gy + gh - ((ch.hist[i][1] - y0) / Math.max(1e-9, y1 - y0)) * gh;
            if (i === 0) ctx.moveTo(px, py3); else ctx.lineTo(px, py3);
          }
          ctx.stroke();
          ctx.fillStyle = C.muted;
          ctx.font = `8px ${env.font.mono}`;
          ctx.fillText("BT loss", gx, gy - 4);
        }
      } else if (ch && ch.kind === "policy") {
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText("policy π (blue) vs reference π_ref (outline), reward r", cx0 + 12, topY + 20);
        for (let i = 0; i < ch.pi.length; i++) {
          const y = topY + 44 + i * 30;
          ctx.fillStyle = C.text2;
          ctx.font = `10px ${env.font.base}`;
          ctx.fillText(ch.names[i].split(":")[0], cx0 + 12, y);
          const bx = cx0 + 44, bw = cW - 170;
          ctx.strokeStyle = C.viz5;
          ctx.lineWidth = 1.4;
          ctx.strokeRect(bx + 0.5, y - 12.5, Math.max(1, bw * ch.ref[i]), 15);
          ctx.fillStyle = C.viz1;
          ctx.fillRect(bx, y - 12, Math.max(1, bw * ch.pi[i]), 15);
          ctx.fillStyle = C.text2;
          ctx.font = `9px ${env.font.mono}`;
          ctx.fillText(`${ch.pi[i].toFixed(3)}  r=${ch.r[i].toFixed(2)}`, bx + bw + 8, y);
        }
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.mono}`;
        ctx.fillText(`E[r] = ${ch.er.toFixed(3)}    KL = ${ch.kl.toFixed(3)}    E[r] − β·KL = ${ch.obj.toFixed(3)}`, cx0 + 12, topY + panelH - 14);
      }

      // ---------------- sample strip ---------------------------------------
      if (s.sample) {
        const y = H - sampleH - 4;
        ctx.fillStyle = C.surface2;
        ctx.strokeStyle = C.border;
        ctx.beginPath();
        ctx.roundRect(padX, y, W - padX * 2, sampleH - 4, 6);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText("PROMPT", padX + 12, y + 18);
        ctx.fillStyle = C.text2;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(s.sample.prompt, padX + 70, y + 18);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText("OUTPUT", padX + 12, y + 42);
        ctx.fillStyle = C.text;
        ctx.font = `11px ${env.font.base}`;
        const maxW = W - padX * 2 - 90;
        let str = s.sample.output;
        while (ctx.measureText(str).width > maxW && str.length > 4) str = str.slice(0, -2);
        ctx.fillText(str + (str !== s.sample.output ? "…" : ""), padX + 70, y + 42);
      }
    }
  },

  drill: {
    cards: [
      { q: "What does each pipeline stage change?", a: "Pretraining → knowledge and fluency. SFT → format/instruction-following. Reward model → a proxy for human taste. PPO/DPO → tone, helpfulness, refusals. Capability is upstream; behaviour is downstream.", tags: ["core"] },
      { q: "How does the SFT objective differ from pretraining?", a: "It doesn't — both are next-token cross-entropy. Only the data (curated instruction/response pairs) and one mask differ: loss on prompt tokens is set to ignore_index so only the response is graded.", tags: ["sft"] },
      { q: "State the Bradley-Terry reward-model loss.", a: "`L = −log σ(r(y_w) − r(y_l))`. Only reward *differences* are identified, so there is an arbitrary per-prompt offset — which is why PPO needs a value baseline.", tags: ["rlhf"] },
      { q: "Why is there a KL penalty in RLHF?", a: "The reward model is only valid near the SFT distribution. Without the leash, PPO finds off-distribution text that scores highly and human quality falls — reward hacking. β trades reward against staying on-distribution.", tags: ["rlhf"] },
      { q: "What does DPO replace and what does it cost?", a: "It removes the reward model and the RL loop by rewriting the KL-regularised optimum's reward as `r = β log(π/π_ref) + logZ` and substituting into Bradley-Terry, where logZ cancels. Two resident models instead of four; the cost is no online exploration — it only ever sees the pairs you collected.", tags: ["dpo"] },
      { q: "Training FLOPs rule of thumb?", a: "≈6·N·D — 2 for forward, 4 for backward, per parameter per token. A 7B model on 2T tokens is ~8.4×10²² FLOPs.", tags: ["compute"] },
      { q: "A model states a fact incorrectly. Which stage do you fix?", a: "Not RLHF. Either upstream data / continued pretraining, or retrieval at inference. Fine-tuning on facts the base model doesn't know is a known driver of hallucination.", tags: ["practice"] },
      { q: "Name three symptoms of reward hacking.", a: "Reward rising while a held-out judge or human win-rate falls; response length inflating; entropy/diversity collapsing. Plot reward and quality both against KL from the reference to see the divergence.", tags: ["diagnosis"] }
    ],
    sixtySecond: [
      "Walk through pretraining → SFT → RLHF, saying precisely what changes at each stage and what each stage cannot fix.",
      "Explain the RLHF objective including the KL term, and how DPO reaches the same optimum without a reward model."
    ]
  }
};
