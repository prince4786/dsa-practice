export default {
  id: "rag-chunking",
  track: "agents",
  title: "RAG I: Chunking & Embeddings",
  difficulty: 2,
  minutes: 16,
  tags: ["rag", "chunking", "embeddings", "vector-search", "retrieval"],

  explainer: [
    { type: "p", text: "Retrieval-augmented generation has exactly two failure surfaces, and chunking is the first one. You cannot retrieve what you never indexed as a coherent unit. Every downstream metric — recall, groundedness, hallucination rate — is bounded above by whether the answer to a question lives inside a single retrievable chunk." },

    { type: "h3", text: "What an embedding actually is" },
    { type: "p", text: "An embedding model maps a span of text to a fixed-length vector (typically 768–3072 dimensions) such that texts with similar *meaning* land near each other under cosine similarity. It is a bag-of-meaning, not a summary: a 2,000-token chunk and a 20-token chunk both collapse to the same vector length, so the long one's specific claims get averaged into mush. That averaging is why chunk size matters more than any other retrieval hyperparameter." },
    { type: "callout", tone: "tip", text: "Cosine similarity on normalized vectors is just a dot product, which is why vector search is fast. `cos(a,b) = a·b / (|a||b|)` — normalize once at index time and the query becomes a single matrix multiply." },

    { type: "h3", text: "The chunk-size trade-off" },
    { type: "list", items: [
      "**Too small** (< ~100 tokens): each vector is precise but the chunk lacks the context to answer anything. You retrieve a sentence that mentions the right term and none of the surrounding qualification. Coreference breaks — *\"it must be returned within that period\"* is useless without the previous sentence.",
      "**Too large** (> ~1,000 tokens): one vector has to represent several topics, so it is near-average and matches everything weakly. You also blow the prompt budget: 5 chunks × 1,500 tokens is 7,500 tokens of context per question.",
      "**Sweet spot** for prose is usually 200–600 tokens with 10–20% overlap; for code, split on function or class boundaries instead of a character count.",
      "**Overlap** exists to stop an answer that straddles a boundary from being lost by both neighbours. It costs storage and duplicate hits at retrieval time — dedupe by document offset before assembling the prompt."
    ]},

    { type: "callout", tone: "pitfall", text: "Naive fixed-size splitting cuts mid-sentence, and the resulting chunk embeds as a blend of two topics — it lands *between* clusters in embedding space, so it is mediocre for every query and top-ranked for none. Split on structure first (headings, paragraphs, sentences), then pack up to the size budget." },

    { type: "h3", text: "Structure beats size" },
    { type: "list", items: [
      "**Recursive splitting** — try paragraph boundaries, then sentences, then words, then characters, taking the first level that fits the budget. This is what most libraries mean by \"recursive character splitter\".",
      "**Contextual chunking** — prepend a one-line description of where the chunk came from (\"From the *Returns* section of the 2026 policy: …\"). It measurably lifts recall because the embedding now carries the document context the chunk lost.",
      "**Store metadata, not just text** — document id, section, character offsets, timestamp. You need offsets to dedupe overlapping hits and to show citations; you need timestamps to filter stale content.",
      "**Keep tables and code blocks whole.** Half a table embeds as noise and reads as noise."
    ]},

    { type: "h3", text: "When not to chunk at all" },
    { type: "p", text: "With a 1M-token context window, a 40-page manual fits. If your corpus is small and stable, putting the whole thing in a cached prefix beats a vector database on accuracy, latency *and* engineering cost — cache reads are ~0.1× input price, so the re-send is cheap. RAG earns its complexity when the corpus is far larger than the window, changes frequently, or needs per-user access control." }
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
