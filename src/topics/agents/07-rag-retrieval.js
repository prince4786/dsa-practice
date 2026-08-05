export default {
  id: "rag-retrieval",
  track: "agents",
  title: "RAG II: Retrieval & Reranking",
  difficulty: 2,
  minutes: 17,
  tags: ["rag", "retrieval", "reranking", "hybrid-search", "evaluation"],

  explainer: [
    { type: "p", text: "The previous lesson covered how to cut documents into chunks and store them as searchable vectors. This lesson covers what happens next: given a user's question, how do you actually find the right chunks and hand them to the model? The single biggest design mistake people make here is treating \"search my documents\" as one step, when in a well-built RAG system it is really two separate stages with two different jobs — a fast, wide-net first pass, followed by a slower, careful second pass that narrows things down. Confusing those two stages, or skipping the second one, is the most common reason RAG systems retrieve mediocre results." },
    { type: "p", text: "**Stage 1 exists to cast a wide net cheaply.** It uses what is called a bi-encoder: the search query and every document chunk are each converted into an embedding vector completely separately from each other (as covered in the previous lesson), which means every chunk's vector can be calculated once, in advance, and stored. Finding matches at search time then becomes one fast, large batch calculation across potentially millions of stored vectors. **Stage 2 exists to be accurate about a much smaller shortlist.** It uses what is called a cross-encoder — often called a **reranker** — which feeds the query and one candidate chunk into a model *together, at the same time*, so the model can directly consider how the two relate to each other. This makes a cross-encoder considerably more accurate at judging real relevance, but also far too slow to run across an entire large collection of documents — it can only be economically applied to a short list of already-narrowed-down candidates." },
    { type: "callout", tone: "tip", text: "One sentence worth remembering: a bi-encoder has to guess, in advance and without knowing your question yet, roughly what kinds of questions each document chunk might be a good answer to. A cross-encoder, by contrast, gets to actually read your specific question and the specific chunk side by side before deciding how relevant it is. That difference — guessing blind versus reading both at once — is the entire reason cross-encoders are both more accurate and more expensive." },

    { type: "h3", text: "Retrieve widely first, then narrow down carefully" },
    { type: "p", text: "The standard pattern is: pull somewhere between 30 and 100 candidate chunks using the fast stage-1 vector search, run all of them through the more accurate stage-2 reranker, and only keep the top 3 to 8 of those to actually paste into the prompt. A classic beginner mistake is retrieving only 3 candidates directly from stage 1 and skipping reranking — your system's overall accuracy ceiling is now capped by whatever the fast, rougher stage-1 search happened to get right in just its first three guesses, and no amount of clever reranking can recover a good chunk that was never even considered as a candidate in the first place. In technical terms, **the fraction of correct answers that make it into the stage-1 candidate set — called recall — is a hard ceiling on the accuracy of the entire system**, no matter how good stage 2 is." },

    { type: "h3", text: "Embeddings alone will still miss some things" },
    { type: "list", items: [
      "**The mismatch between words used and words meant cuts both ways.** Embeddings are genuinely good at recognizing that two differently-worded phrases mean the same thing (\"send back\" and \"return\" match well), but they are surprisingly bad at exact, specific tokens like part numbers, error codes, internal policy IDs, or unusual proper nouns. A code like `R-14` produces an embedding that carries almost no distinguishing meaning at all — it does not \"mean\" anything to an embedding model the way a phrase does.",
      "**Hybrid search** fixes that blind spot by running a completely different, older-style keyword search algorithm called **BM25** (a lexical, exact-word-matching search, not an embedding-based one) alongside the vector search, and then merging the two ranked lists together. A common way to merge them fairly is Reciprocal Rank Fusion (RRF): each result gets a score based on `1 divided by (60 plus its rank position)` in each list, and those scores are added up across both lists. RRF works well here specifically because it only needs to know each result's *rank* (its position, like 1st, 2nd, 3rd) in each list, not its raw score — which matters a lot, because BM25 scores and cosine similarity scores are on totally different, incomparable numeric scales.",
      "**Apply any metadata filters (like \"only documents from this department\") before running the vector search, not after.** If you filter after already narrowing down to the top handful of results, you might end up with only 2 usable results out of the 10 you originally asked for, because the other 8 got filtered out afterward. Most vector databases support filtering as part of the search itself, before results are narrowed down.",
      "**Remove duplicate results based on where in the original document they came from.** Because chunks deliberately overlap at their edges (from the previous lesson), you can easily retrieve two chunks that both contain nearly the same sentence — pasting both into the prompt wastes space for no benefit. A more advanced technique called MMR (maximal marginal relevance) deliberately trades away a small amount of pure relevance in exchange for more variety among the results it picks, so you get several genuinely different pieces of information instead of near-duplicates."
    ]},

    { type: "h3", text: "A similarity score only means something relative to other scores — never on its own" },
    { type: "callout", tone: "pitfall", text: "A vector search index will **always** return however many results you ask it for (`k` of them), no matter what. If you ask about something that is not actually covered anywhere in your documents at all, you will still get back your `k` \"least bad\" chunks, even if the best one only scores a low 0.31 out of a possible 1.0 on cosine similarity — and if you hand a model weak, barely-related context like that, it will often use it anyway and answer confidently based on it. You need either a minimum similarity score below which you simply discard results (a relevance floor), or a cheap separate relevance check, combined with an explicit instruction in your system prompt telling the model that saying \"the provided documents do not cover this\" is a correct, successful answer — not a failure to be avoided." },

    { type: "h3", text: "How you assemble the final prompt matters, not just what you retrieved" },
    { type: "p", text: "The order you place retrieved chunks in matters. AI models tend to pay the most reliable attention to text near the very beginning and the very end of a long prompt, so it is worth placing your strongest, most relevant chunk right next to the question itself, rather than burying it somewhere in the middle of several other chunks. Wrap each chunk in a clear delimiter (a tag or marker) that includes its source ID, so that if the model cites a source, you can mechanically check whether that citation is actually correct. And, connecting back to the prompt-assembly lesson: if your underlying document collection is stable, place the retrieved chunks *after* your cache breakpoint, so the system prompt and tool definitions above it stay cheaply cached, and only the freshly-retrieved content is billed at full price." },

    { type: "h3", text: "Measure the two stages separately, or you cannot tell what is actually broken" },
    { type: "list", items: [
      "**For retrieval itself:** measure recall@k (what fraction of the time the correct chunk made it into your top-k candidates) and MRR (a score that rewards the correct chunk appearing near the top of the ranking, not just somewhere in it), against a set of real questions where you already know the correct \"gold\" chunk. Thirty to fifty real questions with known right answers will teach you more than any amount of guessing.",
      "**For the model's generated answer:** measure faithfulness (is every claim the model made actually backed up by one of the retrieved chunks?) and answer relevance (does the answer actually address what was asked?) — these are usually scored by having a separate AI model act as an automated judge.",
      "**A useful debugging rule of thumb:** if the correct \"gold\" chunk never made it into your candidate set at all, that is a *retrieval* bug, and no amount of tweaking your prompt wording will fix it. If the correct chunk *was* retrieved but the model still gave a wrong answer, that points instead to a *generation* problem — how the prompt was assembled, the ordering of chunks, or an unclear instruction to the model."
    ]}
  ],

  glossary: [
    { term: "Bi-encoder", plain: "A model that turns a search query and a document into separate lists of numbers (embeddings) independently of each other, so a document's numbers can be calculated once in advance and searched very quickly later." },
    { term: "Cross-encoder / reranker", plain: "A model that reads a search query and one candidate document together, at the same time, to judge how relevant they are to each other. Much more accurate than a bi-encoder, but too slow to use on a whole large collection." },
    { term: "Recall@k", plain: "A measure of how often the correct answer's source chunk actually appears somewhere within the top k results a search returns. It sets a hard ceiling on how good the whole system can be." },
    { term: "MRR (Mean Reciprocal Rank)", plain: "A scoring measure that rewards the correct result appearing near the very top of a ranked list, not just somewhere within it." },
    { term: "BM25", plain: "A classic keyword-based (lexical) search algorithm that matches exact words and phrases, rather than meaning. Good at catching exact identifiers and terms that embeddings tend to miss." },
    { term: "Hybrid search", plain: "Running a keyword search (like BM25) alongside a meaning-based vector search and combining both sets of results, so you catch both paraphrased matches and exact-term matches." },
    { term: "Reciprocal Rank Fusion (RRF)", plain: "A simple way to merge two differently-scored ranked lists of results by using each result's position (rank) in each list rather than its raw score, which avoids needing the two scoring systems to be comparable." },
    { term: "Relevance floor", plain: "A minimum similarity score below which a retrieved result is discarded entirely, rather than being handed to the model as if it were a legitimate answer." },
    { term: "MMR (maximal marginal relevance)", plain: "A technique for picking search results that deliberately favors variety, giving up a little bit of pure relevance in exchange for avoiding near-duplicate results." },
    { term: "Faithfulness (RAG evaluation)", plain: "A measure of whether every claim in a model's generated answer is actually backed up by one of the retrieved document chunks, rather than being made up." },
    { term: "LLM judge", plain: "Using a separate AI model call to automatically score or evaluate the quality of another model's output, instead of a human reviewing every answer by hand." },
    { term: "Cosine similarity", plain: "A way of measuring how similar two pieces of text are in meaning, based on comparing the lists of numbers (embeddings) that represent them — the standard scoring method for meaning-based search." }
  ],

  complexity: {
    rows: [
      { operation: "Bi-encoder search (exact)", time: "O(N·d)", space: "O(N·d)", note: "one matrix multiply; fine to ~100k vectors" },
      { operation: "ANN search (HNSW)", time: "~O(log N · d)", space: "O(N·d) + graph", note: "recall < 100% — measure it, don't assume it" },
      { operation: "Cross-encoder rerank", time: "O(k) model calls", space: "O(k)", note: "~10–50ms per pair; why k stays ≤ 100" },
      { operation: "BM25", time: "O(|q| · postings)", space: "O(vocab)", note: "exact-token recall the embeddings miss" },
      { operation: "RRF fusion", time: "O(k log k)", space: "O(k)", note: "score = Σ 1/(60 + rank); no calibration needed" },
      { operation: "Prompt assembly", time: "O(n)", space: "n × chunk tokens", note: "5 × 500 tokens = 2.5K per question, every question" }
    ]
  },

  interview: {
    whyAsked: "It reveals whether you think of retrieval as a ranked funnel with measurable stages or as 'the vector database'. Strong candidates name the bi-encoder/cross-encoder split, know that stage-1 recall caps the system, and immediately raise the no-relevant-results case that most designs ignore.",
    followUps: [
      { q: "Why retrieve 50 candidates and rerank to 5, rather than retrieving 5?", a: "Because a reranker can only reorder what it is given. Stage-1 recall@k is a hard ceiling: a gold chunk that was never a candidate is unrecoverable. Retrieving wide is cheap — one matrix multiply — while reranking is the expensive step, so you spend breadth where it costs nothing and precision where it counts." },
      { q: "Bi-encoder versus cross-encoder — what is the actual difference?", a: "A bi-encoder embeds query and document independently, so document vectors are precomputed and search is a dot product. A cross-encoder runs both through one model together and can attend across them, which is far more accurate but requires a forward pass per (query, document) pair. That is why one scales to millions and the other to about a hundred." },
      { q: "A user searches for error code `E-4471` and gets nothing useful. Diagnose it.", a: "Classic vocabulary mismatch: embeddings represent meaning and a rare alphanumeric token has almost none. The fix is hybrid search — run BM25 in parallel and fuse the two rankings with RRF, which needs no score calibration since BM25 scores and cosine similarities are on incomparable scales." },
      { q: "The corpus contains nothing relevant to the question. What happens?", a: "The index still returns k results, just with low scores, and the model will often use them anyway. You need an absolute score floor calibrated on your own data, plus a system prompt that makes 'the provided documents do not cover this' an acceptable answer. Without both, this is exactly how a RAG system produces a confident, cited, wrong answer." },
      { q: "Where do you place retrieved chunks in the prompt, and in what order?", a: "After the cached prefix, so the system prompt and tool schemas stay cached, and near the question rather than buried in the middle — attention is most reliable at the start and end of a long context. Order strongest-last so the best chunk is adjacent to the query, wrap each chunk in a delimiter carrying its source id, and instruct the model to cite it." },
      { q: "How do you know whether a wrong answer is a retrieval bug or a generation bug?", a: "Check whether the gold chunk is among the retrieved candidates. If it is not, it is retrieval — changing the prompt cannot fix it. If it is present and the answer is still wrong, look at ordering, chunk truncation, conflicting chunks, or the instruction to ground answers in the provided context." },
      { q: "What is MMR and when do you need it?", a: "Maximal marginal relevance picks each next chunk to maximize relevance minus similarity to what is already selected. You need it when overlapping chunks or near-duplicate documents crowd out coverage — five paraphrases of the same paragraph is a worse prompt than three distinct facts, even though all five score higher individually." }
    ]
  },

  code: [
    { lang: "python", label: "Hybrid retrieve → rerank → assemble", code: "def retrieve(query, k_dense=50, k_lex=50, k_final=5):\n    # --- stage 1a: dense (paraphrase-friendly, exact-token-blind)\n    dense = vector_store.search(embed(query), k=k_dense, filter={\"lang\": \"en\"})\n    # --- stage 1b: lexical (exact ids, part numbers, error codes)\n    lex = bm25.search(query, k=k_lex)\n\n    # --- fuse: reciprocal rank fusion needs no score calibration\n    fused, K = {}, 60\n    for ranking in (dense, lex):\n        for rank, hit in enumerate(ranking):\n            fused[hit.id] = fused.get(hit.id, 0) + 1.0 / (K + rank + 1)\n    cands = sorted(fused, key=fused.get, reverse=True)[:60]\n\n    # --- stage 2: cross-encoder reads query and chunk TOGETHER\n    scored = reranker.score([(query, store[c].text) for c in cands])\n    ranked = sorted(zip(cands, scored), key=lambda p: -p[1])\n\n    # --- absolute floor: an index always returns k results\n    ranked = [(c, s) for c, s in ranked if s >= RELEVANCE_FLOOR]\n    if not ranked:\n        return []                      # let the caller say \"not covered\"\n\n    return mmr(ranked, k=k_final, lambda_=0.7)     # relevance vs diversity" },

    { lang: "python", label: "Assemble the prompt so citations are checkable", code: "def build(query, chunks):\n    # strongest chunk LAST: attention is most reliable next to the question\n    blocks = \"\\n\\n\".join(\n        f'<doc id=\"{c.doc_id}#{c.chunk_index}\" title=\"{c.title}\">\\n{c.text}\\n</doc>'\n        for c in reversed(chunks)\n    )\n    return client.messages.create(\n        model=\"claude-opus-5\",\n        max_tokens=2000,\n        system=[{                       # stable -> cached, retrieved text is not\n            \"type\": \"text\",\n            \"text\": (\n                \"Answer only from the documents in the user turn. Cite the id of \"\n                \"every document you use, e.g. [policy.md#3]. If the documents do \"\n                \"not contain the answer, say so plainly — that is a correct \"\n                \"answer, not a failure.\"\n            ),\n            \"cache_control\": {\"type\": \"ephemeral\"},\n        }],\n        messages=[{\"role\": \"user\", \"content\":\n                   f\"{blocks}\\n\\nQuestion: {query}\"}],\n    )" },

    { lang: "python", label: "Measure recall@k before you tune anything", code: "# 30-50 real questions with known gold chunk ids beats any amount of intuition.\ndef evaluate(questions, k=20):\n    hits = mrr = 0\n    for q in questions:\n        got = [h.id for h in retrieve_stage1(q[\"text\"], k=k)]\n        gold = set(q[\"gold_chunk_ids\"])\n        if gold & set(got):\n            hits += 1\n            first = next(i for i, g in enumerate(got) if g in gold)\n            mrr += 1 / (first + 1)\n    return {\"recall@k\": hits / len(questions), \"mrr\": mrr / len(questions)}\n\n# recall@k at stage 1 is the CEILING on end-to-end quality.\n# If it is 0.7, no reranker and no prompt gets you past 70%." }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.85, maxFrames: 300 },

    params: [
      { key: "k",      label: "Candidates (k)", type: "int", min: 3, max: 12, default: 8 },
      { key: "topn",   label: "Into the prompt", type: "int", min: 1, max: 5, default: 3 },
      { key: "rerank", label: "Cross-encoder rerank", type: "enum", options: ["off", "on"], default: "on" },
      { key: "query",  label: "Query", type: "enum", options: ["paraphrase", "exact-id", "not-in-corpus"], default: "paraphrase" },
      { key: "seed",   label: "Re-embed", type: "seed" }
    ],

    frames: function* (params, rng) {
      const K = params.k, TOPN = params.topn;
      const doRerank = params.rerank === "on";

      const TOPICS = ["returns", "shipping", "warranty"];
      const CENTROIDS = [[0.24, 0.30], [0.76, 0.26], [0.50, 0.78]];

      const DOCS = [
        [0, "policy#1", "Unopened items may be returned within 30 days of delivery."],
        [0, "policy#2", "Refunds are issued to the original payment method only."],
        [0, "policy#3", "Opened items qualify for return only when defective."],
        [0, "policy#4", "Gift returns need the order number, not a receipt."],
        [0, "policy#5", "Return shipping is free for defective goods."],
        [0, "policy#6", "Policy R-14 governs returns of clearance merchandise."],
        [0, "policy#7", "Refund processing takes 5 business days after receipt."],
        [1, "ship#1", "Standard shipping arrives in 3-5 business days."],
        [1, "ship#2", "Express shipping is next business day before noon."],
        [1, "ship#3", "Split shipments occur when an item is on backorder."],
        [1, "ship#4", "Tracking updates once the carrier scans the parcel."],
        [1, "ship#5", "We do not ship to PO boxes in some regions."],
        [1, "ship#6", "Delivery windows exclude weekends and holidays."],
        [2, "warr#1", "The manufacturer warranty covers defects for two years."],
        [2, "warr#2", "Accidental damage is not covered by the warranty."],
        [2, "warr#3", "Warranty claims need the serial number from the base."],
        [2, "warr#4", "Replacements carry the remainder of the original term."],
        [2, "warr#5", "Extended warranty may be purchased within 90 days."],
        [2, "warr#6", "Batteries are consumable and excluded from coverage."]
      ];

      const QUERIES = {
        "paraphrase": {
          text: "how long do I have to send an unopened item back?",
          pos: [0.27, 0.34],
          gold: ["policy#1"],
          distract: ["policy#2", "policy#7"]
        },
        "exact-id": {
          text: "what does policy R-14 actually cover?",
          pos: [0.42, 0.44],
          gold: ["policy#6"],
          distract: ["policy#3", "warr#1"]
        },
        "not-in-corpus": {
          text: "can I finance this purchase over 12 months?",
          pos: [0.52, 0.50],
          gold: [],
          distract: []
        }
      };
      const Q = QUERIES[params.query] || QUERIES["paraphrase"];

      const corpus = DOCS.map((d, i) => {
        const c = CENTROIDS[d[0]];
        return {
          i, id: d[1], topic: d[0], text: d[2],
          x: c[0] + (rng() - 0.5) * 0.20,
          y: c[1] + (rng() - 0.5) * 0.22
        };
      });

      const dist = (a) => Math.hypot(a.x - Q.pos[0], a.y - Q.pos[1]);
      const cosOf = (a) => Math.max(0.05, 1 - dist(a) * 1.15);

      // stage 1 ranking, with a lexical blind spot for the exact-id query
      const scored = corpus.map((c) => {
        let cos = cosOf(c);
        if (params.query === "exact-id" && c.id === "policy#6") cos -= 0.16;  // "R-14" embeds as ~nothing
        if (params.query === "not-in-corpus") cos = Math.min(cos, 0.42);
        return { i: c.i, id: c.id, cos: cos };
      }).sort((a, b) => b.cos - a.cos);

      let cands = [];
      let ring = 0;
      let stage = "corpus";
      let prompt = [];
      let note = "";

      const snap = (extra) => Object.assign({
        corpus: corpus.map((c) => ({ i: c.i, id: c.id, topic: c.topic, text: c.text, x: c.x, y: c.y })),
        centroids: CENTROIDS.map((c) => c.slice()),
        topics: TOPICS.slice(),
        q: { x: Q.pos[0], y: Q.pos[1], text: Q.text },
        cands: cands.map((c) => ({ i: c.i, id: c.id, cos: c.cos, rr: c.rr, kept: c.kept, dup: c.dup, gold: c.gold })),
        prompt: prompt.slice(),
        ring, stage, note, K, TOPN, doRerank,
        floor: 0.55, cur: -1
      }, extra || {});

      yield {
        label: `${corpus.length} indexed chunks, plotted by embedding. Semantically similar text clusters — that is the entire premise, and it is also why exact tokens like part numbers do badly.`,
        phase: "init",
        state: snap()
      };

      yield {
        label: `Query: "${Q.text}". The same bi-encoder embeds it into the same space — independently of every document, which is exactly why the document vectors could be precomputed.`,
        phase: "query",
        state: snap({ stage: "query" })
      };

      // ---- expanding kNN ring -------------------------------------------
      stage = "knn";
      for (let step = 1; step <= K; step++) {
        const picked = scored.slice(0, step);
        ring = 1 - picked[picked.length - 1].cos / 1.15;
        cands = picked.map((p) => ({
          i: p.i, id: p.id, cos: p.cos, rr: null, kept: true, dup: false,
          gold: Q.gold.indexOf(p.id) >= 0
        }));
        const last = picked[picked.length - 1];
        yield {
          label: `kNN ${step}/${K}: \`${last.id}\` at cosine ${last.cos.toFixed(2)}${Q.gold.indexOf(last.id) >= 0 ? " — this is the gold chunk" : ""}. Retrieve WIDE here: whatever the bi-encoder misses now can never be recovered downstream.`,
          phase: "knn",
          focus: [last.i],
          state: snap({ stage: "knn", cur: last.i })
        };
      }

      const goldFound = Q.gold.filter((g) => cands.some((c) => c.id === g));
      if (Q.gold.length) {
        yield {
          label: goldFound.length
            ? `Recall@${K} = 1.0 — the gold chunk made the candidate set. This number is the hard ceiling on the whole system; a reranker cannot recover what was never retrieved.`
            : `Recall@${K} = 0.0 — the gold chunk \`${Q.gold[0]}\` did NOT make the candidate set. This is a retrieval bug. Nothing you do to the prompt can fix it; you need hybrid BM25 or a bigger k.`,
          phase: "recall",
          state: snap({ stage: "knn", note: goldFound.length ? "" : "recall miss" })
        };
      } else {
        yield {
          label: `Every candidate is below cosine ${Math.max.apply(null, cands.map((c) => c.cos)).toFixed(2)} — nothing in the corpus is about financing. Note the index still returned ${K} results: similarity is relative, never absolute.`,
          phase: "recall",
          state: snap({ stage: "knn", note: "no relevant results" })
        };
      }

      // ---- rerank --------------------------------------------------------
      if (doRerank) {
        stage = "rerank";
        for (let j = 0; j < cands.length; j++) {
          const c = cands[j];
          const isGold = Q.gold.indexOf(c.id) >= 0;
          const isDistract = Q.distract.indexOf(c.id) >= 0;
          let rr = c.cos * 0.35;
          if (isGold) rr += 0.62;
          else if (isDistract) rr -= 0.10;
          if (Q.gold.length === 0) rr = Math.min(rr, 0.30);
          rr = Math.max(0.02, Math.min(0.99, rr + (rng() - 0.5) * 0.03));

          cands = cands.map((x, xi) => (xi === j ? { i: x.i, id: x.id, cos: x.cos, rr: rr, kept: x.kept, dup: x.dup, gold: x.gold } : x));
          yield {
            label: isGold
              ? `Cross-encoder scores (query, \`${c.id}\`) together: ${rr.toFixed(2)} — far above its cosine of ${c.cos.toFixed(2)}. Reading both texts at once is what the bi-encoder structurally cannot do.`
              : isDistract
                ? `\`${c.id}\` scored high on cosine (${c.cos.toFixed(2)}) because it shares vocabulary, but the cross-encoder sees it does not answer the question: ${rr.toFixed(2)}.`
                : `Scoring (query, \`${c.id}\`) → ${rr.toFixed(2)}. One forward pass per pair — accurate, and ${K}× more expensive than the vector search.`,
            phase: "rerank",
            focus: [c.i],
            state: snap({ stage: "rerank", cur: c.i })
          };
        }

        cands = cands.slice().sort((a, b) => b.rr - a.rr);
        yield {
          label: `Reordered by cross-encoder score. Stage 1 optimizes recall, stage 2 optimizes precision — running the reranker over the whole corpus would be correct and unshippably slow.`,
          phase: "reorder",
          state: snap({ stage: "reorder" })
        };
      } else {
        cands = cands.slice().sort((a, b) => b.cos - a.cos);
        yield {
          label: `Reranking is off, so the raw cosine order goes straight into the prompt. Whatever the bi-encoder guessed is what the model sees.`,
          phase: "reorder",
          state: snap({ stage: "reorder" })
        };
      }

      // ---- dedupe --------------------------------------------------------
      const seenTopic = {};
      cands = cands.map((c) => {
        const key = c.id.split("#")[0];
        const dup = !!seenTopic[key] && seenTopic[key] >= 2;
        seenTopic[key] = (seenTopic[key] || 0) + 1;
        return { i: c.i, id: c.id, cos: c.cos, rr: c.rr, kept: !dup, dup: dup, gold: c.gold };
      });
      yield {
        label: `Diversity pass (MMR): chunks that overlap heavily with an already-selected chunk are demoted. Five paraphrases of one paragraph make a worse prompt than three distinct facts.`,
        phase: "dedupe",
        state: snap({ stage: "dedupe" })
      };

      // ---- assemble ------------------------------------------------------
      const winners = cands.filter((c) => c.kept).slice(0, TOPN);
      const bestScore = winners.length ? (doRerank ? winners[0].rr : winners[0].cos) : 0;

      if (Q.gold.length === 0 && bestScore < 0.55) {
        yield {
          label: `Best surviving score ${bestScore.toFixed(2)} is under the relevance floor. Return NOTHING and let the model say "the documents do not cover this" — handing it weak context is how a RAG system produces a confident, cited, wrong answer.`,
          phase: "reject",
          state: snap({ stage: "reject", note: "below relevance floor" })
        };
        yield {
          label: `Answer: "I could not find anything about financing in the policy documents." A calibrated score floor plus permission to say "I don't know" is the difference between a useful system and a plausible one.`,
          phase: "done",
          state: snap({ stage: "reject" })
        };
        return;
      }

      for (let j = 0; j < winners.length; j++) {
        prompt = prompt.concat([{ id: winners[j].id, text: corpus[winners[j].i].text, score: doRerank ? winners[j].rr : winners[j].cos }]);
        yield {
          label: j === winners.length - 1
            ? `\`${winners[j].id}\` goes in **last**, closest to the question — models attend most reliably to the beginning and end of a long context, so the strongest chunk should not be buried in the middle.`
            : `\`${winners[j].id}\` wrapped in a delimiter carrying its source id, so any citation the model emits can be checked mechanically.`,
          phase: "assemble",
          focus: [winners[j].i],
          state: snap({ stage: "assemble", cur: winners[j].i })
        };
      }

      const promptTok = winners.length * 42 + 60;
      yield {
        label: `Prompt built: ${winners.length} chunks ≈ ${promptTok} tokens, placed AFTER the cache breakpoint so the system prompt above stays cached. ${goldFound.length ? "The gold chunk is in there." : "The gold chunk is missing — expect a wrong answer no matter how good the prompt is."}`,
        phase: "done",
        state: snap({ stage: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const topicColor = (t) => [C.viz1, C.viz4, C.viz7][t] || C.muted;
      const clip = (s, n) => (s.length > n ? s.slice(0, Math.max(1, n - 1)) + "…" : s);

      // ---------------- header --------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `14px ${env.font.base}`;
      ctx.fillText("Retrieve wide → rerank narrow → assemble", 20, 24);
      ctx.fillStyle = C.text2;
      ctx.font = `12px ${env.font.mono}`;
      ctx.fillText(clip('q: "' + S.q.text + '"', Math.floor((W - 40) / 7)), 20, 44);

      // ---------------- left: scatter --------------------------------------
      const spX = 20, spY = 58;
      const spW = W * 0.50, spH = H - spY - 20;

      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(spX, spY, spW, spH, 8); ctx.fill(); ctx.stroke();

      const pad = 34;
      const px = (u) => spX + pad + u * (spW - pad * 2);
      const py = (v) => spY + pad + v * (spH - pad * 2);
      const scaleX = (spW - pad * 2), scaleY = (spH - pad * 2);

      ctx.strokeStyle = C.grid;
      for (let g = 0; g <= 4; g++) {
        const u = g / 4;
        ctx.beginPath(); ctx.moveTo(px(u), py(0)); ctx.lineTo(px(u), py(1)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(0), py(u)); ctx.lineTo(px(1), py(u)); ctx.stroke();
      }

      for (let t = 0; t < S.centroids.length; t++) {
        const c = S.centroids[t];
        ctx.fillStyle = topicColor(t);
        ctx.globalAlpha = 0.09;
        ctx.beginPath();
        ctx.ellipse(px(c[0]), py(c[1]), scaleX * 0.17, scaleY * 0.19, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = topicColor(t);
        ctx.font = `11px ${env.font.base}`;
        ctx.textAlign = "center";
        ctx.fillText(S.topics[t], px(c[0]), py(c[1]) - scaleY * 0.20);
        ctx.textAlign = "left";
      }

      // kNN ring
      if (S.ring > 0) {
        ctx.strokeStyle = C.viz4;
        ctx.setLineDash([5, 4]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(px(S.q.x), py(S.q.y), S.ring * scaleX, S.ring * scaleY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      const candIdx = {};
      for (let j = 0; j < S.cands.length; j++) candIdx[S.cands[j].i] = j;

      for (const c of S.corpus) {
        const j = candIdx[c.i];
        const isCand = j !== undefined;
        const isCur = c.i === S.cur;
        const inPrompt = S.prompt.some((p) => p.id === c.id);
        const r = inPrompt ? 8 : isCand ? 6.5 : 4.5;

        ctx.fillStyle = inPrompt ? C.viz6 : isCand ? topicColor(c.topic) : C.surface2;
        ctx.globalAlpha = isCand || inPrompt ? 1 : 0.55;
        ctx.beginPath(); ctx.arc(px(c.x), py(c.y), r, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;

        if (isCand && S.cands[j].gold) {
          ctx.strokeStyle = C.ok;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px(c.x), py(c.y), r + 4, 0, Math.PI * 2); ctx.stroke();
        }
        if (isCur) {
          ctx.strokeStyle = C.text;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px(c.x), py(c.y), r + 7, 0, Math.PI * 2); ctx.stroke();
        }
      }

      // query point
      if (S.stage !== "corpus") {
        const qx = px(S.q.x), qy = py(S.q.y);
        ctx.fillStyle = C.viz2;
        ctx.beginPath();
        ctx.moveTo(qx, qy - 9); ctx.lineTo(qx + 8, qy); ctx.lineTo(qx, qy + 9); ctx.lineTo(qx - 8, qy);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = C.viz2;
        ctx.font = `10px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText("query", qx, qy + 22);
        ctx.textAlign = "left";
      }

      if (S.note) {
        ctx.fillStyle = C.danger;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText("⚠ " + S.note, spX + 12, spY + spH - 12);
      }

      // ---------------- right: ranked list ---------------------------------
      const lx = spX + spW + 22;
      const lw = W - lx - 20;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(lx, spY, lw, spH, 8); ctx.fill(); ctx.stroke();

      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.base}`;
      ctx.fillText("candidate", lx + 12, spY + 18);
      ctx.fillText("cos", lx + lw - 128, spY + 18);
      if (S.doRerank) ctx.fillText("rerank", lx + lw - 72, spY + 18);

      const rowH = 22;
      const listTop = spY + 30;
      const maxRows = Math.floor((spH - 130) / rowH);

      for (let j = 0; j < Math.min(S.cands.length, maxRows); j++) {
        const c = S.cands[j];
        const y = listTop + j * rowH + 12;
        const winner = j < S.TOPN && c.kept;

        if (winner && (S.stage === "assemble" || S.stage === "done")) {
          ctx.fillStyle = C.viz6;
          ctx.globalAlpha = 0.13;
          ctx.fillRect(lx + 6, y - 12, lw - 12, rowH - 2);
          ctx.globalAlpha = 1;
        }

        ctx.fillStyle = c.gold ? C.ok : c.dup ? C.muted : C.text2;
        ctx.font = `10px ${env.font.mono}`;
        ctx.fillText(clip((c.dup ? "≡ " : "") + c.id + "  " + S.corpus[c.i].text,
          Math.floor((lw - 150) / 5.5)), lx + 12, y);

        // cos bar
        const bw = 42;
        ctx.fillStyle = C.grid;
        ctx.fillRect(lx + lw - 128, y - 8, bw, 8);
        ctx.fillStyle = C.viz1;
        ctx.fillRect(lx + lw - 128, y - 8, bw * Math.max(0, Math.min(1, c.cos)), 8);
        ctx.fillStyle = C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.fillText(c.cos.toFixed(2), lx + lw - 128 + bw + 3, y);

        if (S.doRerank && c.rr !== null && c.rr !== undefined) {
          ctx.fillStyle = C.grid;
          ctx.fillRect(lx + lw - 62, y - 8, bw, 8);
          ctx.fillStyle = c.gold ? C.ok : C.viz3;
          ctx.fillRect(lx + lw - 62, y - 8, bw * Math.max(0, Math.min(1, c.rr)), 8);
          ctx.fillStyle = C.muted;
          ctx.fillText(c.rr.toFixed(2), lx + lw - 62 + bw + 3, y);
        }

        if (c.i === S.cur) {
          ctx.strokeStyle = C.text;
          ctx.lineWidth = 1;
          ctx.strokeRect(lx + 6, y - 12, lw - 12, rowH - 2);
        }
      }

      // ---------------- assembled prompt -----------------------------------
      const pyTop = spY + spH - 92;
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.moveTo(lx + 8, pyTop - 8); ctx.lineTo(lx + lw - 8, pyTop - 8); ctx.stroke();
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.base}`;
      ctx.fillText(S.stage === "reject" ? "prompt context — deliberately empty" : "prompt context (strongest last)", lx + 12, pyTop + 6);

      for (let j = 0; j < S.prompt.length; j++) {
        const p = S.prompt[j];
        const y = pyTop + 22 + j * 16;
        if (y > spY + spH - 10) break;
        ctx.fillStyle = C.viz6;
        ctx.fillRect(lx + 12, y - 8, 3, 11);
        ctx.fillStyle = C.text2;
        ctx.font = `9.5px ${env.font.mono}`;
        ctx.fillText(clip(`<doc id="${p.id}"> ${S.corpus.find((c) => c.id === p.id).text}`,
          Math.floor((lw - 30) / 5.2)), lx + 20, y);
      }
      if (S.stage === "reject") {
        ctx.fillStyle = C.warn;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText("no candidate cleared the relevance floor", lx + 20, pyTop + 24);
      }
    }
  },

  drill: {
    cards: [
      { q: "Bi-encoder vs cross-encoder?", a: "A bi-encoder embeds query and document independently, so document vectors are precomputed and search is a dot product over millions. A cross-encoder runs both through one model together and attends across them — much more accurate, one forward pass per pair, so it only scales to ~100 candidates.", tags: ["reranking"] },
      { q: "Why retrieve 50 and rerank to 5 instead of retrieving 5?", a: "Stage-1 recall@k is a hard ceiling: a reranker can only reorder what it was given. Wide retrieval is cheap (one matmul); reranking is the expensive step. Spend breadth where it is free.", tags: ["funnel"] },
      { q: "A search for error code `E-4471` returns nothing useful. Why?", a: "Vocabulary mismatch — embeddings encode meaning and a rare alphanumeric token carries almost none. Add BM25 in parallel and fuse with Reciprocal Rank Fusion (`Σ 1/(60+rank)`), which needs no score calibration between the two systems.", tags: ["hybrid"] },
      { q: "What does a vector index return when nothing is relevant?", a: "k results anyway, with low scores. You need an absolute relevance floor calibrated on your data plus a system prompt that makes 'not covered by the documents' an acceptable answer — otherwise the model uses the weak context and cites it.", tags: ["pitfall"] },
      { q: "Where in the prompt do retrieved chunks go?", a: "After the cache breakpoint (so system + tools stay cached) and adjacent to the question, strongest chunk last — attention is most reliable at the start and end of a long context. Wrap each in a delimiter carrying its source id so citations are checkable.", tags: ["assembly"] },
      { q: "How do you tell a retrieval bug from a generation bug?", a: "Check whether the gold chunk is in the candidate set. Absent → retrieval bug, and no prompt change can fix it. Present but the answer is wrong → ordering, truncation, conflicting chunks, or a missing grounding instruction.", tags: ["debugging"] },
      { q: "What is MMR for?", a: "Maximal marginal relevance selects each next chunk to maximize relevance minus similarity to already-selected chunks. It stops overlapping or near-duplicate chunks from crowding out coverage — three distinct facts beat five paraphrases of one.", tags: ["diversity"] },
      { q: "Which two metrics do you track, and at which stage?", a: "Retrieval: recall@k and MRR against questions with known gold chunks. Generation: faithfulness (every claim supported by a retrieved chunk) and answer relevance. Measure them separately or you cannot attribute a regression.", tags: ["evaluation"] }
    ],
    sixtySecond: [
      "Explain the two-stage retrieval funnel: what each stage optimizes, why the order is fixed, and what caps end-to-end quality.",
      "Explain why pure vector search fails on exact identifiers, and how hybrid search plus RRF fixes it."
    ]
  }
};
