export default {
  id: "rag-chunking",
  track: "agents",
  title: "RAG I: Chunking & Embeddings",
  difficulty: 2,
  minutes: 16,
  tags: ["rag", "chunking", "embeddings", "vector-search", "retrieval"],

  explainer: [
    { type: "p", text: "Sometimes you want an AI model to answer questions using your own documents — your company's policy manual, your product's documentation, a set of legal contracts — rather than only what it happened to learn during training. The standard approach for this is called **RAG**, short for Retrieval-Augmented Generation: before the model answers, your system first searches your documents for the passages that seem relevant, and pastes those passages into the prompt, so the model answers grounded in your actual data instead of guessing from memory. This lesson is about the very first step of building a RAG system, which is also the step where most RAG systems quietly go wrong: deciding how to cut your documents up into searchable pieces in the first place. Get this step wrong, and no amount of clever searching later can fix it — you simply cannot find a good answer that was never saved as a coherent, findable piece to begin with." },

    { type: "h3", text: "What an embedding actually is" },
    { type: "p", text: "To search text by *meaning* rather than by exact keyword match, RAG systems rely on something called an **embedding**. An embedding model reads a piece of text and converts it into a list of numbers — typically somewhere between 768 and 3,072 numbers — called a vector. The trick is that texts with similar meaning end up producing vectors that are mathematically close to each other, measured using something called cosine similarity (explained below). Think of an embedding as a rough \"bag of meaning\" rather than a summary: whether you feed in a 2,000-word chunk or a 20-word chunk, you get back a vector of the exact same fixed length. That means a long chunk covering many different ideas has all of those ideas squeezed and averaged down into the same amount of numeric space as a short, focused one — its specific details get blurred together. This blurring effect is exactly why the size of the chunks you create matters more than almost any other decision in a RAG system." },
    { type: "callout", tone: "tip", text: "Cosine similarity is a way of measuring how similar two vectors are, based on the angle between them rather than their length. If you first normalize every vector — rescale it to always have the same overall length — comparing two vectors with cosine similarity becomes mathematically identical to a much simpler and faster operation called a dot product. That is why searching millions of stored vectors can be done as one fast batch calculation instead of millions of slow individual comparisons." },

    { type: "h3", text: "The chunk-size trade-off" },
    { type: "list", items: [
      "**Chunks that are too small** (under roughly 100 tokens) produce very precise, focused vectors, but the chunk itself often lacks the surrounding context needed to actually answer anything on its own. You might retrieve a sentence that mentions the right keyword but is missing the qualifying sentence right before it that the meaning depends on — for example, a chunk that just says *\"it must be returned within that period\"* is useless on its own, because \"it\" and \"that period\" refer back to something in a sentence you cut away.",
      "**Chunks that are too large** (over roughly 1,000 tokens) force one single vector to represent several different topics at once, so — because of the averaging effect described above — that vector ends up being a weak, mediocre match for almost every question rather than a strong match for any one of them. Large chunks also eat up your context window fast: retrieving 5 chunks of 1,500 tokens each is 7,500 tokens spent on background material for a single question.",
      "**A reasonable starting point** for ordinary prose is chunks of roughly 200–600 tokens with 10–20% of each chunk overlapping with its neighbor. For source code, it works much better to split along function or class boundaries rather than by a fixed character count, since cutting a function in half destroys its meaning.",
      "**Overlap** — deliberately repeating a little bit of text at the boundary between two chunks — exists to stop an answer that happens to straddle a chunk boundary from being lost by both of its neighboring chunks. The cost is that it uses more storage and can produce duplicate results at search time, so you need to remove duplicates (based on where in the original document each chunk came from) before assembling your final prompt."
    ]},

    { type: "callout", tone: "pitfall", text: "If you split a document into fixed-size chunks by character count with no regard for sentence or paragraph boundaries, you will regularly cut chunks off mid-sentence. A chunk that starts mid-thought and ends mid-thought ends up embedding as an awkward blend of two different topics — its resulting vector lands *between* the two topic clusters in embedding space rather than solidly inside either one, so it becomes a mediocre match for every related query and a strong match for none of them. The fix is to split along real structural boundaries first — section headings, paragraphs, sentences — and only fall back to a raw size limit when a natural chunk is still too big." },

    { type: "h3", text: "Splitting along real structure beats splitting by size alone" },
    { type: "list", items: [
      "**Recursive splitting** is a common strategy: try splitting on paragraph breaks first; if a resulting piece is still too big, try splitting that piece on sentence breaks; if still too big, fall back further, all the way down to raw characters if needed. This is what most chunking libraries mean when they refer to a \"recursive character splitter.\"",
      "**Contextual chunking** means adding a short, one-line description at the top of each chunk explaining where it came from before you embed it — for example, *\"From the Returns section of the 2026 policy: …\"*. This measurably improves search quality, because it puts back some of the surrounding document context that got stripped away the moment the chunk was cut out on its own.",
      "**Store extra information (metadata) alongside the text itself**, not just the raw text — things like a document ID, which section it came from, its exact character position in the original document, and a timestamp. You need the character position to remove duplicate overlapping results and to show users exactly which part of a source a citation came from; you need the timestamp to filter out or down-rank content that may now be outdated.",
      "**Keep tables and code blocks whole rather than slicing through them.** Half of a table, or half of a function, embeds as meaningless noise, and reads as meaningless noise if it ever gets pasted into a prompt."
    ]},

    { type: "h3", text: "Sometimes the right answer is to skip chunking entirely" },
    { type: "p", text: "Current Claude models can hold up to 1 million tokens in their context window — enough to fit an entire 40-page manual with room to spare. If your set of documents is small and does not change very often, simply putting the whole thing into a prompt (using prompt caching, from the tokens-and-context-windows lesson, so re-sending it stays cheap) can beat building a whole separate search system on accuracy, response speed, *and* how much engineering effort it takes to build and maintain. Cached reads cost roughly a tenth of the normal price, which is what makes resending the same large document on every request affordable. Reach for the full complexity of a RAG system specifically once your document collection is far larger than what fits in the context window, changes frequently enough that resending a cached copy stops making sense, or needs different access permissions for different users." }
  ],

  glossary: [
    { term: "RAG (Retrieval-Augmented Generation)", plain: "A technique where, before answering, a system searches your own documents for relevant passages and pastes them into the prompt, so the model answers grounded in your data instead of guessing from memory." },
    { term: "Chunking", plain: "The process of splitting a large document into smaller, individually searchable pieces (chunks) before storing it, since you can only ever retrieve whole chunks, not arbitrary snippets." },
    { term: "Embedding", plain: "A list of numbers (a vector) that a specialized model produces to represent the meaning of a piece of text, such that texts with similar meaning produce numerically similar vectors." },
    { term: "Vector", plain: "A fixed-length list of numbers — the output of an embedding model — used to represent a piece of text so it can be compared mathematically to other pieces of text." },
    { term: "Cosine similarity", plain: "A way of measuring how similar two vectors are, based on the angle between them. Used to find which stored chunks are closest in meaning to a search query." },
    { term: "Dot product", plain: "A simple, fast mathematical operation between two vectors. Once vectors are rescaled to a standard length, comparing them by dot product gives the same result as cosine similarity, much faster." },
    { term: "Normalization (vectors)", plain: "Rescaling a vector so its overall length is always exactly 1, without changing its direction. Done once when storing vectors so that later comparisons can use the faster dot product." },
    { term: "Overlap (chunking)", plain: "Deliberately repeating a small amount of text at the boundary between two neighboring chunks, so an answer that straddles the boundary is not lost by both sides." },
    { term: "Contextual chunking", plain: "Adding a short, generated one-line description of where a chunk came from in its document before embedding it, to restore context the chunk lost when it was cut out on its own." },
    { term: "Metadata (retrieval)", plain: "Extra structured information stored alongside a chunk's text — like its document ID, section, exact position, or timestamp — used for deduplication, citations, and filtering." },
    { term: "Recursive splitter", plain: "A chunking strategy that tries the coarsest reasonable split first (like paragraphs), and only falls back to a finer split (sentences, then words, then raw characters) when a piece is still too big." },
    { term: "Token", plain: "The small chunk of text an AI model actually reads — roughly a word or part of a word. Chunk sizes and context windows are measured in tokens, not characters or words." }
  ],

  complexity: {
    rows: [
      { operation: "Chunk a document", time: "O(n)", space: "O(n·(1+overlap))", note: "20% overlap = 20% more vectors to store and search" },
      { operation: "Embed a chunk", time: "1 model call, ~O(len²) attention", space: "O(d) per vector", note: "d ≈ 768–3072 floats" },
      { operation: "Store", time: "—", space: "O(N·d·4) bytes", note: "1M chunks × 1536 dims × float32 ≈ 6 GB" },
      { operation: "Exact kNN search", time: "O(N·d)", space: "O(N·d)", note: "fine to ~100k vectors" },
      { operation: "ANN search (HNSW/IVF)", time: "O(log N · d) approx.", space: "O(N·d) + graph", note: "trades recall for latency — measure recall@k, not just p99" }
    ]
  },

  interview: {
    whyAsked: "Chunking is where most RAG systems silently fail, so it separates people who have evaluated a retrieval system from people who have wired one up. The signal is whether you reason about chunk boundaries semantically — and whether you know when a long context window makes the whole pipeline unnecessary.",
    followUps: [
      { q: "How do you pick a chunk size?", a: "Empirically, against a question set. Start from the shape of the answers: if answers are single facts, smaller chunks with more overlap; if answers require a paragraph of reasoning, larger. 200–600 tokens with 10–20% overlap is a reasonable prose default, but the real answer is to build 30–50 real questions with known answers and measure recall@k across a few configurations." },
      { q: "What goes wrong when a chunk spans two topics?", a: "Its embedding is roughly the average of both, so it lands between the clusters. It is weakly similar to queries about either topic and strongly similar to neither — mediocre for everything, top-ranked for nothing. Structural splitting avoids creating these; a reranker can partly rescue them at query time." },
      { q: "Why does overlap help, and what does it cost?", a: "It stops an answer that straddles a boundary from being truncated in both neighbours. The cost is storage and index size proportional to the overlap fraction, plus duplicate hits at retrieval time — so you dedupe by document offset before assembling the prompt, or you waste context on the same sentence twice." },
      { q: "What is contextual chunking?", a: "Prepending a short, generated description of the chunk's place in its document before embedding — 'From the Returns section of the 2026 policy: …'. The chunk loses its document context when you cut it out; this puts it back, and it measurably improves recall. It costs one cheap model call per chunk at index time, which is a one-off." },
      { q: "How do you handle tables and code?", a: "Do not character-split them. Keep a table whole with its header row, or serialize each row with the header repeated. For code, split on function or class boundaries and include the file path and enclosing symbol as a prefix. Half a function embeds as noise and reads as noise in the prompt." },
      { q: "When would you skip RAG entirely?", a: "When the corpus fits in the context window and is reasonably stable. A 40-page manual is ~30K tokens; put it in a cached prefix and reads cost ~0.1× input price. That beats a vector store on accuracy, latency and maintenance. RAG earns its complexity when the corpus is much larger than the window, changes often, or needs per-user access control." },
      { q: "Your embeddings are stale after a document edit. What breaks and how do you fix it?", a: "Retrieval returns text that no longer exists, and the model answers confidently from it. You need re-indexing keyed on content hash per chunk, timestamps in the metadata so you can filter or down-weight stale hits, and — since chunk boundaries shift when the document changes — a delete-by-document-id path rather than trying to patch individual vectors." }
    ]
  },

  code: [
    { lang: "python", label: "Recursive structural splitter", code: "SEPARATORS = [\"\\n## \", \"\\n\\n\", \"\\n\", \". \", \" \"]\n\ndef split(text, budget=1800, sep_i=0):\n    \"\"\"Split on the coarsest separator that gets pieces under budget.\"\"\"\n    if len(text) <= budget or sep_i >= len(SEPARATORS):\n        return [text]\n    sep = SEPARATORS[sep_i]\n    parts, out, buf = text.split(sep), [], \"\"\n    for p in parts:\n        cand = (buf + sep + p) if buf else p\n        if len(cand) <= budget:\n            buf = cand\n        else:\n            if buf:\n                out.append(buf)\n            buf = p if len(p) <= budget else \"\"\n            if len(p) > budget:                     # still too big: go finer\n                out.extend(split(p, budget, sep_i + 1))\n    if buf:\n        out.append(buf)\n    return out\n\n\ndef with_overlap(chunks, overlap_chars=200):\n    \"\"\"Carry the tail of each chunk into the next so straddling answers survive.\"\"\"\n    out = []\n    for i, c in enumerate(chunks):\n        prefix = chunks[i - 1][-overlap_chars:] if i else \"\"\n        out.append((prefix + c).strip())\n    return out" },

    { lang: "python", label: "Contextual chunking with a cached prefix", code: "# One cheap call per chunk at INDEX time. The whole document sits in a cached\n# prefix, so chunk 200 costs ~0.1x on the document and full price on 80 tokens.\ndef contextualize(doc, chunk):\n    r = client.messages.create(\n        model=\"claude-haiku-4-5\",\n        max_tokens=100,\n        system=[{\"type\": \"text\", \"text\": doc,\n                 \"cache_control\": {\"type\": \"ephemeral\"}}],   # <- the whole doc\n        messages=[{\"role\": \"user\", \"content\":\n            f\"<chunk>{chunk}</chunk>\\nIn one sentence, situate this chunk in \"\n            f\"the document above. Answer with the sentence only.\"}],\n    )\n    ctx = next(b.text for b in r.content if b.type == \"text\")\n    return f\"{ctx.strip()}\\n\\n{chunk}\"        # embed THIS, store both\n\nrecords = [{\n    \"doc_id\": doc_id,\n    \"chunk_index\": i,\n    \"char_start\": start, \"char_end\": end,     # needed to dedupe overlaps\n    \"content_sha\": sha256(chunk),             # needed for incremental re-index\n    \"text\": chunk,\n    \"embedding\": embed(contextualize(doc, chunk)),\n} for i, (chunk, start, end) in enumerate(spans)]" },

    { lang: "python", label: "Cosine similarity, done once", code: "import numpy as np\n\n# Normalize at index time -> cosine similarity becomes a dot product,\n# and a whole-corpus search becomes one matrix multiply.\nM = np.stack([r[\"embedding\"] for r in records]).astype(\"float32\")\nM /= np.linalg.norm(M, axis=1, keepdims=True)\n\ndef search(query_vec, k=8):\n    q = query_vec / np.linalg.norm(query_vec)\n    scores = M @ q                       # (N,) cosine similarities\n    idx = np.argpartition(-scores, k)[:k]      # O(N), not a full sort\n    idx = idx[np.argsort(-scores[idx])]\n    return [(records[i], float(scores[i])) for i in idx]" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 300 },

    params: [
      { key: "size",     label: "Chunk size (chars)", type: "int", min: 60, max: 400, default: 170 },
      { key: "overlap",  label: "Overlap %",          type: "int", min: 0,  max: 50,  default: 20 },
      { key: "strategy", label: "Split on",           type: "enum", options: ["fixed", "sentence", "section"], default: "fixed" },
      { key: "seed",     label: "Embedding jitter",   type: "seed" }
    ],

    frames: function* (params, rng) {
      const TOPICS = ["returns", "shipping", "warranty"];
      const CENTROIDS = [[0.24, 0.32], [0.76, 0.26], [0.50, 0.78]];

      const SENTS = [
        [0, "Unopened items may be returned within thirty days of delivery. "],
        [0, "Refunds are issued to the original payment method only. "],
        [0, "Opened items qualify only when the product is defective. "],
        [0, "Gift returns require the order number but not a receipt. "],
        [1, "Standard shipping arrives in three to five business days. "],
        [1, "Express shipping is next business day for orders before noon. "],
        [1, "Split shipments occur when one item is on backorder. "],
        [1, "Tracking links update once the carrier scans the parcel. "],
        [2, "The manufacturer warranty covers defects for two years. "],
        [2, "Accidental damage is not covered by the standard warranty. "],
        [2, "Warranty claims need the serial number from the base plate. "],
        [2, "Replacement units carry the remainder of the original term. "]
      ];

      let text = "";
      const sentSpans = [];
      for (const [topic, s] of SENTS) {
        sentSpans.push({ start: text.length, end: text.length + s.length, topic });
        text += s;
      }
      const N = text.length;

      // ---- carve spans according to the strategy ------------------------
      const size = params.size;
      const ov = Math.floor(size * (params.overlap / 100));
      const spans = [];

      if (params.strategy === "fixed") {
        let s = 0;
        while (s < N) {
          const e = Math.min(N, s + size);
          spans.push([s, e]);
          if (e >= N) break;
          s = e - ov;
        }
      } else if (params.strategy === "sentence") {
        let s = 0, cur = 0, guard = 0;
        while (cur < sentSpans.length && guard++ < 200) {
          let e = s;
          while (cur < sentSpans.length && sentSpans[cur].end - s <= size) {
            e = sentSpans[cur].end; cur++;
          }
          if (e === s) { e = sentSpans[cur].end; cur++; }
          spans.push([s, e]);
          if (e >= N) break;
          // back up to a sentence start for the overlap, but never backwards
          const back = e - ov;
          let ns = e;
          for (const sp of sentSpans) {
            if (sp.start >= back && sp.start > s) { ns = sp.start; break; }
          }
          s = ns;
          cur = 0;
          while (cur < sentSpans.length && sentSpans[cur].start < s) cur++;
        }
      } else {
        for (let t = 0; t < 3; t++) {
          const inTopic = sentSpans.filter((x) => x.topic === t);
          spans.push([inTopic[0].start, inTopic[inTopic.length - 1].end]);
        }
      }

      const chunks = [];
      const jitter = [];
      for (let i = 0; i < spans.length; i++) jitter.push([rng() - 0.5, rng() - 0.5]);

      const snap = (extra) => Object.assign({
        text, sentSpans: sentSpans.map((s) => ({ start: s.start, end: s.end, topic: s.topic })),
        chunks: chunks.map((c) => ({
          i: c.i, s: c.s, e: c.e, x: c.x, y: c.y, topic: c.topic,
          purity: c.purity, mid: c.mid, mix: c.mix.slice()
        })),
        centroids: CENTROIDS.map((c) => c.slice()),
        topics: TOPICS.slice(),
        cur: -1, stage: "idle", size, ov, strategy: params.strategy,
        nSpans: spans.length
      }, extra || {});

      yield {
        label: `A ${N}-character policy document covering three topics. Nothing is retrievable yet — retrieval can only ever return the units you decide to index.`,
        phase: "init",
        state: snap()
      };

      for (let i = 0; i < spans.length; i++) {
        const [s, e] = spans[i];

        yield {
          label: `Chunk ${i + 1}: characters ${s}–${e} (${e - s} chars${i > 0 && spans[i - 1][1] > s ? `, ${spans[i - 1][1] - s} of them overlapping chunk ${i}` : ""}).`,
          phase: "carve",
          state: snap({ cur: i, stage: "carve", curSpan: [s, e], prevEnd: i > 0 ? spans[i - 1][1] : -1 })
        };

        // topic mixture by character coverage
        const mix = [0, 0, 0];
        for (const sp of sentSpans) {
          const o = Math.max(0, Math.min(e, sp.end) - Math.max(s, sp.start));
          if (o > 0) mix[sp.topic] += o;
        }
        const tot = mix.reduce((a, b) => a + b, 0) || 1;
        for (let t = 0; t < 3; t++) mix[t] /= tot;
        const purity = Math.max.apply(null, mix);
        const topic = mix.indexOf(purity);

        const endsClean = e >= N || sentSpans.some((sp) => sp.end === e);
        const startsClean = s === 0 || sentSpans.some((sp) => sp.start === s);
        const mid = !(endsClean && startsClean);

        yield {
          label: mid
            ? `This chunk starts or ends mid-sentence. The fragment carries meaning it cannot support — a dangling "it" or "that period" with no antecedent inside the chunk.`
            : `Clean boundaries: this chunk starts and ends on sentence edges, so every clause inside it has its own context.`,
          phase: "boundary",
          state: snap({ cur: i, stage: "boundary", curSpan: [s, e], prevEnd: i > 0 ? spans[i - 1][1] : -1, mid })
        };

        let x = 0, y = 0;
        for (let t = 0; t < 3; t++) { x += mix[t] * CENTROIDS[t][0]; y += mix[t] * CENTROIDS[t][1]; }
        x += jitter[i][0] * 0.045;
        y += jitter[i][1] * 0.045;

        chunks.push({ i, s, e, x, y, topic, purity, mid, mix });

        yield {
          label: purity > 0.92
            ? `Embedded. ${(purity * 100).toFixed(0)}% of this chunk is one topic, so its vector lands squarely inside the "${TOPICS[topic]}" cluster — a sharp match for the right query.`
            : purity > 0.65
              ? `Embedded. ${(purity * 100).toFixed(0)}% "${TOPICS[topic]}" but ${(100 - purity * 100).toFixed(0)}% something else — the vector is pulled off-centre toward the neighbouring cluster.`
              : `Embedded — and it landed **between** clusters. An embedding is a bag of meaning: a chunk covering two topics averages to a vector that is weakly similar to both queries and strongly similar to neither.`,
          phase: "embed",
          focus: [i],
          state: snap({ cur: i, stage: "embed", curSpan: [s, e], prevEnd: i > 0 ? spans[i - 1][1] : -1, mid })
        };
      }

      const impure = chunks.filter((c) => c.purity < 0.7).length;
      const cut = chunks.filter((c) => c.mid).length;
      const dup = spans.reduce((a, sp, i) => a + (i ? Math.max(0, spans[i - 1][1] - sp[0]) : 0), 0);

      yield {
        label: `${chunks.length} chunks · ${cut} cut mid-sentence · ${impure} stranded between clusters · ${dup} duplicated characters from overlap. Switch "Split on" to \`sentence\` or \`section\` and watch the stranded points snap into their clusters.`,
        phase: "done",
        state: snap({ cur: -1, stage: "done" })
      };
    },

    draw: function (frame, ctx, env) {
      const S = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const topicColor = (t) => [C.viz1, C.viz4, C.viz7][t] || C.muted;

      // ---------------- header --------------------------------------------
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `14px ${env.font.base}`;
      ctx.fillText("Chunking → embedding space", 20, 24);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(
        `strategy=${S.strategy}  size=${S.size}  overlap=${S.ov}ch  ·  ${S.chunks.length}/${S.nSpans} chunks embedded`,
        20, 42);

      // ---------------- left: the document ---------------------------------
      const docX = 20, docY = 58;
      const docW = W * 0.46, docH = H - docY - 20;

      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect(docX, docY, docW, docH, 8); ctx.fill(); ctx.stroke();

      const fs = 10;
      ctx.font = `${fs}px ${env.font.mono}`;
      const charW = ctx.measureText("M").width;
      const padX = 12, padY = 20;
      const cols = Math.max(10, Math.floor((docW - padX * 2 - 8) / charW));
      const lineH = 13;

      const lines = [];
      for (let o = 0; o < S.text.length; o += cols) lines.push(o);
      const maxLines = Math.floor((docH - padY - 8) / lineH);

      const topicAt = (i) => {
        for (const sp of S.sentSpans) if (i >= sp.start && i < sp.end) return sp.topic;
        return 0;
      };

      for (let li = 0; li < Math.min(lines.length, maxLines); li++) {
        const ls = lines[li];
        const le = Math.min(S.text.length, ls + cols);
        const y = docY + padY + li * lineH;

        // topic ribbon
        ctx.fillStyle = topicColor(topicAt(ls));
        ctx.globalAlpha = 0.55;
        ctx.fillRect(docX + 4, y - fs + 2, 3, lineH - 2);
        ctx.globalAlpha = 1;

        // overlap band (previous chunk tail)
        if (S.curSpan && S.prevEnd > S.curSpan[0]) {
          const a = Math.max(S.curSpan[0], ls), b = Math.min(S.prevEnd, le);
          if (b > a) {
            ctx.fillStyle = C.viz4;
            ctx.globalAlpha = 0.30;
            ctx.fillRect(docX + padX + (a - ls) * charW, y - fs + 1, (b - a) * charW, lineH - 1);
            ctx.globalAlpha = 1;
          }
        }
        // current chunk band
        if (S.curSpan) {
          const a = Math.max(S.curSpan[0], ls), b = Math.min(S.curSpan[1], le);
          if (b > a) {
            ctx.fillStyle = C.viz1;
            ctx.globalAlpha = 0.20;
            ctx.fillRect(docX + padX + (a - ls) * charW, y - fs + 1, (b - a) * charW, lineH - 1);
            ctx.globalAlpha = 1;
          }
        }

        ctx.fillStyle = C.text2;
        ctx.fillText(S.text.slice(ls, le), docX + padX, y);
      }

      // boundary markers
      if (S.curSpan) {
        for (const [off, col] of [[S.curSpan[0], C.viz1], [S.curSpan[1], C.viz2]]) {
          const li = Math.floor(off / cols);
          if (li >= maxLines) continue;
          const cx = docX + padX + (off - li * cols) * charW;
          const cy = docY + padY + li * lineH;
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - fs); ctx.lineTo(cx, cy + 3);
          ctx.stroke();
        }
        if (S.mid) {
          ctx.fillStyle = C.danger;
          ctx.font = `10px ${env.font.base}`;
          ctx.fillText("✂ split mid-sentence", docX + padX, docY + docH - 8);
        }
      }

      // ---------------- right: embedding scatter ---------------------------
      const spX = docX + docW + 24;
      const spW = W - spX - 20, spH = docH;
      const spY = docY;

      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.beginPath(); ctx.roundRect(spX, spY, spW, spH, 8); ctx.fill(); ctx.stroke();

      const pad = 34;
      const px = (u) => spX + pad + u * (spW - pad * 2);
      const py = (v) => spY + pad + v * (spH - pad * 2);

      ctx.strokeStyle = C.grid;
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const u = g / 4;
        ctx.beginPath(); ctx.moveTo(px(u), py(0)); ctx.lineTo(px(u), py(1)); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(px(0), py(u)); ctx.lineTo(px(1), py(u)); ctx.stroke();
      }
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.base}`;
      ctx.fillText("2-D projection of the embedding space (real vectors are 1536-D)", spX + 12, spY + 16);

      // cluster halos
      for (let t = 0; t < S.centroids.length; t++) {
        const c = S.centroids[t];
        ctx.fillStyle = topicColor(t);
        ctx.globalAlpha = 0.10;
        ctx.beginPath();
        ctx.ellipse(px(c[0]), py(c[1]), (spW - pad * 2) * 0.16, (spH - pad * 2) * 0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.fillStyle = topicColor(t);
        ctx.font = `11px ${env.font.base}`;
        ctx.textAlign = "center";
        ctx.fillText(S.topics[t], px(c[0]), py(c[1]) - (spH - pad * 2) * 0.19);
        ctx.textAlign = "left";
      }

      // points
      for (const c of S.chunks) {
        const isCur = c.i === S.cur;
        const r = 5 + Math.min(7, (c.e - c.s) / 90);
        ctx.fillStyle = c.purity < 0.7 ? C.viz8 : topicColor(c.topic);
        ctx.globalAlpha = isCur ? 1 : 0.78;
        ctx.beginPath();
        ctx.arc(px(c.x), py(c.y), r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (isCur) {
          ctx.strokeStyle = C.text;
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(px(c.x), py(c.y), r + 5, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = isCur ? C.text : C.muted;
        ctx.font = `9px ${env.font.mono}`;
        ctx.textAlign = "center";
        ctx.fillText(String(c.i + 1), px(c.x), py(c.y) - r - 4);
        ctx.textAlign = "left";
      }

      // stranded callout
      const stranded = S.chunks.filter((c) => c.purity < 0.7);
      if (stranded.length) {
        ctx.fillStyle = C.viz8;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(stranded.length + " chunk(s) stranded between clusters — weak match for every query",
          spX + 12, spY + spH - 12);
      }
    }
  },

  drill: {
    cards: [
      { q: "Why is chunk size the most important RAG hyperparameter?", a: "An embedding is one fixed-length vector regardless of input length. Too small and the chunk lacks context to answer; too large and its vector averages several topics and matches everything weakly. 200–600 tokens with 10–20% overlap is a prose default — but tune it against real questions.", tags: ["chunking"] },
      { q: "What happens to a chunk that spans two topics?", a: "Its embedding lands between the two clusters: weakly similar to queries about either, strongly similar to neither. It is top-ranked for nothing. Split on structure first — headings, paragraphs, sentences — then pack to the size budget.", tags: ["chunking"] },
      { q: "Why use overlap, and what does it cost?", a: "So an answer straddling a boundary is not truncated in both neighbours. It costs index size proportional to the overlap fraction plus duplicate hits at query time — dedupe by document offset before assembling the prompt.", tags: ["overlap"] },
      { q: "What is contextual chunking?", a: "Prepending a generated one-liner situating the chunk in its document ('From the Returns section of the 2026 policy: …') before embedding. Restores the document context the cut removed; costs one cheap call per chunk at index time, with the whole doc in a cached prefix.", tags: ["technique"] },
      { q: "Cosine similarity — why normalize at index time?", a: "`cos(a,b) = a·b/(|a||b|)`. Normalizing once makes cosine similarity a plain dot product, so a whole-corpus search is one matrix multiply. Use `argpartition` for top-k instead of a full sort.", tags: ["math"] },
      { q: "How do you chunk code and tables?", a: "Not by character count. Split code on function/class boundaries and prefix the file path and enclosing symbol; keep a table whole with its header, or repeat the header per row. Half a function or table embeds as noise and reads as noise.", tags: ["structure"] },
      { q: "When is RAG the wrong answer?", a: "When the corpus fits in the context window and is stable. A 30K-token manual in a cached prefix reads at ~0.1× input price and beats a vector store on accuracy, latency and maintenance. RAG earns its cost when the corpus dwarfs the window, changes often, or needs per-user access control.", tags: ["design"] },
      { q: "Which metadata must you store alongside the vector?", a: "Document id, section, character offsets (to dedupe overlaps and cite), content hash (for incremental re-indexing) and a timestamp (to filter stale content). Vectors alone give you text with no provenance.", tags: ["engineering"] }
    ],
    sixtySecond: [
      "Explain the chunk-size trade-off and why splitting mid-sentence damages retrieval quality.",
      "Explain what an embedding is, how similarity search works, and what metadata you store next to each vector."
    ]
  }
};
