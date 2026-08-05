export default {
  id: "roc-metrics",
  track: "ml",
  title: "Precision/Recall/ROC",
  difficulty: 2,
  minutes: 16,
  tags: ["classification", "evaluation", "roc", "precision-recall", "imbalance"],

  explainer: [
    { type: "p", text: "A trained classifier doesn't usually output a hard yes/no answer directly — it outputs a **score**, a number (often, but not always, framed as a probability) saying how confident it is that a given example belongs to the positive class. Turning that score into an actual decision requires picking a **threshold**: a cutoff value `t`, above which you predict 'positive' and below which you predict 'negative'. This matters more than it sounds, because every one of the standard evaluation numbers — accuracy, precision, recall, F1, and the ROC curve's TPR and FPR — depends entirely on *which threshold you chose*, not just on the model itself. Change the threshold and every single one of those numbers moves, with zero retraining involved. Once a threshold is fixed, every prediction the model makes falls into exactly one of four buckets, together called the **confusion matrix**: a true positive (`TP`, correctly flagged as positive), a false positive (`FP`, wrongly flagged as positive — a false alarm), a false negative (`FN`, wrongly flagged as negative — a miss), or a true negative (`TN`, correctly flagged as negative)." },
    { type: "code", lang: "pseudo", code: "predicted_positive = score >= threshold\nTP = predicted_positive AND actual_positive\nFP = predicted_positive AND actual_negative   # false alarm\nFN = NOT predicted_positive AND actual_positive  # missed it\nTN = NOT predicted_positive AND actual_negative\n\nprecision = TP / (TP + FP)     # of what I flagged, how much was real?\nrecall    = TP / (TP + FN)     # of what was real, how much did I catch?\nFPR       = FP / (FP + TN)     # of the negatives, how many false alarms?" },
    { type: "h3", text: "The threshold is a dial you turn, not a fixed fact about the model" },
    { type: "list", items: [
      "**Lowering the threshold** means you flag more things as positive overall, so you catch more of the true positives (**recall** goes up) but you also let in more false alarms (**precision** goes down, and **FPR**, the false-positive rate, goes up). Raising the threshold does the exact opposite in both directions.",
      "**The ROC curve** ('Receiver Operating Characteristic', a name inherited from radar engineering) plots **TPR** (the true-positive rate, which is just another name for recall) against **FPR** as the threshold is swept from very high down to very low. It answers the question: 'for a given tolerance for false alarms, how many true positives can I catch?'.",
      "**The Precision-Recall (PR) curve** instead plots precision against recall directly as the threshold sweeps. It answers a different, often more useful, question: 'for a given catch rate, how clean (trustworthy) are my alarms?' — and it is far more informative than the ROC curve when the positive class is rare, as explained below.",
      "**AUC-ROC** ('Area Under the ROC Curve') is exactly what it sounds like — the total area underneath that curve — and it has a precise probabilistic meaning worth memorising: it equals the probability that a randomly chosen positive example gets a higher score than a randomly chosen negative example (this identity is formally known as the Mann-Whitney U statistic, rescaled to sit between 0 and 1). An AUC-ROC of 0.5 means the model is no better than a coin flip at ranking; 1.0 means it perfectly separates every positive from every negative."
    ]},
    { type: "callout", tone: "pitfall", text: "AUC-ROC is well known to look overly optimistic on **imbalanced data** — datasets where one class is much rarer than the other. With only 1% true positives, even a classifier that is genuinely mediocre at telling positives from negatives can still show a high AUC-ROC. The reason is arithmetic: FPR's formula, `FP/(FP+TN)`, has the huge pool of easy true negatives (`TN`) sitting in its denominator, so even a fairly large number of false positives barely moves the FPR at all — hiding a real precision problem from view. The PR-AUC (area under the Precision-Recall curve) does not have this same hidden denominator, and it drops sharply as soon as false positives start piling up relative to the small number of true positives. For any rare-positive problem — fraud detection, disease screening, ad-click prediction — always report PR-AUC alongside (or instead of) ROC-AUC." },
    { type: "h3", text: "Choosing the operating point (the actual threshold to deploy)" },
    { type: "list", items: [
      "**0.5 is not a law of nature.** It is only the mathematically 'right' threshold in the special case where a false positive and a false negative cost exactly the same amount, and the two classes are perfectly balanced — a combination that is almost never actually true in a real business problem.",
      "**Youden's J statistic**, defined as `J = TPR − FPR`, picks whichever point on the ROC curve sits farthest above the diagonal (the diagonal represents random-guessing performance) — in other words, the threshold that best separates the two classes overall, treating a false positive and a false negative as equally bad.",
      "**Maximum F1** picks the threshold that gives the best balance between precision and recall, weighting them equally — like Youden's J, this still assumes both kinds of mistake matter the same amount, which is often not true.",
      "**Cost-based thresholding** — if you know a false negative costs `C_fn` (some dollar amount, or other real cost) and a false positive costs `C_fp`, the actually-correct threshold is whichever one minimises the total expected cost, `C_fn · FN + C_fp · FP`, directly. This is the answer an interviewer is usually fishing for when they pose a concrete business scenario, like 'a missed fraud case costs the company $500, while blocking a legitimate transaction costs $5 in customer-support time — where would you set the threshold?'."
    ]},
    { type: "h3", text: "Discrimination vs. calibration — two different questions" },
    { type: "p", text: "AUC only measures what's called **discrimination**: can the model correctly *rank* positives above negatives, regardless of what the actual numeric scores are? Because of this, AUC is completely unaffected by any transformation of the scores that preserves their ordering (a **monotonic rescaling**) — stretching, squashing, or shifting the scores in a way that keeps the same relative order leaves AUC exactly unchanged. A model can have excellent AUC and still be badly **miscalibrated** — meaning that when it outputs a score of '0.9', the true real-world frequency of that being a genuine positive might be nowhere near 90%. If the actual numeric value of the score matters for your use case — for example, feeding it into a cost calculation, or displaying a probability directly to a user — you need to check calibration *separately*, using tools like a **reliability diagram** (a plot comparing predicted probability against observed frequency) or the **Brier score** (the mean squared difference between predicted probabilities and actual outcomes). AUC will not catch a miscalibrated model at all — it simply isn't measuring that." },
    { type: "callout", tone: "tip", text: "Accuracy is the metric to be most suspicious of on imbalanced data. With 99% negative examples, a classifier that always predicts 'negative', no matter the input, scores a 99% accuracy while catching precisely zero of the actual positives. Always compare an accuracy number against this simple **majority-class baseline** — always predicting whichever class is most common — before trusting that the number reflects anything meaningful." }
  ],

  glossary: [
    { term: "Threshold", plain: "The cutoff score above which a classifier's prediction is treated as 'positive' and below which it's treated as 'negative'. Every evaluation metric depends on which threshold you pick." },
    { term: "Confusion matrix", plain: "A table breaking every prediction into four buckets: true positive, false positive, false negative, and true negative — the raw counts every other classification metric is built from." },
    { term: "Precision", plain: "Of everything the model flagged as positive, what fraction was actually positive: TP / (TP + FP)." },
    { term: "Recall (TPR, true-positive rate)", plain: "Of everything that was actually positive, what fraction did the model correctly catch: TP / (TP + FN)." },
    { term: "False-positive rate (FPR)", plain: "Of everything that was actually negative, what fraction did the model wrongly flag as positive: FP / (FP + TN)." },
    { term: "ROC curve", plain: "A plot of true-positive rate against false-positive rate as the decision threshold is swept, showing the trade-off between catching positives and raising false alarms." },
    { term: "Precision-Recall (PR) curve", plain: "A plot of precision against recall as the threshold is swept, generally more informative than the ROC curve when positive examples are rare." },
    { term: "AUC (Area Under the Curve)", plain: "The total area underneath an ROC or PR curve, used as a single summary number for how good a classifier's ranking is. AUC-ROC equals the probability a random positive scores higher than a random negative." },
    { term: "Class imbalance", plain: "A dataset where one class (often 'positive') is much rarer than the other, which can make some metrics like accuracy and AUC-ROC look misleadingly good." },
    { term: "F1 score", plain: "A single number that combines precision and recall into one balanced score, giving equal weight to both types of mistake. It is high only when both precision and recall are high." },
    { term: "Youden's J statistic", plain: "TPR minus FPR, maximised at the threshold that best separates the two classes overall, treating a false positive and false negative as equally costly." },
    { term: "Discrimination (of a classifier)", plain: "Whether a model correctly ranks positive examples above negative ones, regardless of what the actual predicted numbers are." },
    { term: "Calibration", plain: "Whether a model's predicted probabilities match real-world frequencies — a predicted score of 0.9 should mean about 90% of such cases are truly positive." },
    { term: "Brier score / reliability diagram", plain: "Two tools for checking calibration: the Brier score is the average squared difference between predicted probabilities and actual outcomes; a reliability diagram plots predicted probability against observed frequency." }
  ],

  complexity: {
    rows: [
      { operation: "Confusion matrix at one threshold", time: "O(n)", space: "O(1)", note: "one pass, compare each score to t" },
      { operation: "Full ROC/PR curve (all thresholds)", time: "O(n log n)", space: "O(n)", note: "sort once by score, sweep cumulative TP/FP" },
      { operation: "AUC-ROC / AUC-PR (trapezoidal)", time: "O(n)", space: "O(1)", note: "one pass over the already-sorted curve points" },
      { operation: "Grid search over k thresholds", time: "O(k · n)", space: "O(1)", note: "wasteful — the sorted-sweep algorithm gets every threshold in one O(n log n) pass" },
      { operation: "Mann-Whitney U (= AUC identity)", time: "O(n log n)", space: "O(1)", note: "ranks all scores once; equals AUC-ROC exactly" }
    ]
  },

  interview: {
    whyAsked: "This is the standard test of whether a candidate treats evaluation as an afterthought or as a modeling decision. The signal is knowing that threshold, precision/recall, and AUC are three different layers — and picking PR-AUC over ROC-AUC on imbalanced data without being prompted is a strong positive signal.",
    followUps: [
      { q: "When do you prioritize precision over recall, and vice versa?", a: "Prioritize recall when a missed positive is costly and a false alarm is cheap to review — cancer screening, fraud triage where a human reviews flagged cases. Prioritize precision when a false positive directly harms the user or burns an expensive action — auto-blocking a payment, an automated ban. In general, pick the threshold from the actual cost of each error type, not from 0.5." },
      { q: "What does AUC-ROC actually measure, and why can it be misleading on imbalanced data?", a: "It equals the probability that a randomly drawn positive scores higher than a randomly drawn negative — pure ranking quality, independent of the threshold and of class balance. It is misleading on imbalanced data because FPR's denominator (FP+TN) is dominated by the abundant true negatives, so a real precision problem (many false positives relative to few true positives) barely moves FPR or AUC-ROC. PR-AUC, which uses precision (TP/(TP+FP)) directly, exposes it." },
      { q: "How do you choose an operating threshold in practice?", a: "Attach a real cost to each error type and minimize `C_fn·FN + C_fp·FP` over the sweep — that is the threshold a business decision actually implies. Absent explicit costs, Youden's J (max TPR−FPR) or max F1 are principled defaults, but they both implicitly assume the two error types are equally bad, which is rarely true." },
      { q: "What is the difference between discrimination and calibration?", a: "Discrimination (what AUC measures) is whether positives rank above negatives — invariant to any monotonic transform of the scores. Calibration is whether a predicted probability of 0.9 actually corresponds to a 90% empirical positive rate. A model can have great AUC and be badly calibrated; check calibration separately with a reliability diagram or Brier score, since AUC cannot detect it." },
      { q: "Why is accuracy a bad primary metric here?", a: "With rare positives, always predicting the majority class yields high accuracy while catching zero positives — accuracy doesn't distinguish that from a genuinely useful model. Always compare to the majority-class baseline, and prefer precision/recall/F1 or PR-AUC when positives are rare." },
      { q: "How do you extend ROC/PR to a multi-class problem?", a: "Binarize one-vs-rest per class and compute a curve/AUC per class, then average — macro-average (unweighted mean across classes, sensitive to rare classes) or micro-average (pool all TP/FP/FN globally first, dominated by common classes). Report both, since they can disagree substantially under class imbalance." }
    ]
  },

  code: [
    { lang: "python", label: "Confusion matrix and metrics at a threshold", code: "def confusion(scores, labels, t):\n    tp = fp = tn = fn = 0\n    for s, y in zip(scores, labels):\n        pred = s >= t\n        if pred and y:       tp += 1\n        elif pred and not y: fp += 1\n        elif not pred and y: fn += 1\n        else:                 tn += 1\n    return tp, fp, tn, fn\n\ndef metrics(tp, fp, tn, fn):\n    precision = tp / (tp + fp) if (tp + fp) else 1.0\n    recall    = tp / (tp + fn) if (tp + fn) else 0.0\n    fpr       = fp / (fp + tn) if (fp + tn) else 0.0\n    f1        = 2 * precision * recall / (precision + recall) if (precision + recall) else 0.0\n    return dict(precision=precision, recall=recall, fpr=fpr, f1=f1)" },
    { lang: "python", label: "Full ROC/PR curve in one O(n log n) sweep", code: "def roc_pr_curve(scores, labels):\n    order = sorted(range(len(scores)), key=lambda i: -scores[i])\n    P = sum(labels); N = len(labels) - P\n    tp = fp = 0\n    curve = [(1.0, 0, 0)]                       # (threshold, tp, fp) before any prediction\n    i = 0\n    while i < len(order):\n        j = i\n        s = scores[order[i]]\n        while j < len(order) and scores[order[j]] == s:   # group tied scores\n            if labels[order[j]]: tp += 1\n            else:                fp += 1\n            j += 1\n        curve.append((s, tp, fp))\n        i = j\n    roc = [(fp / N, tp / P) for _, tp, fp in curve]       # (fpr, tpr)\n    pr  = [(tp / P, tp / (tp + fp) if (tp + fp) else 1.0) for _, tp, fp in curve]\n    return roc, pr\n\ndef trapezoid_auc(points):                                 # points sorted by x ascending\n    return sum((x2 - x1) * (y1 + y2) / 2\n               for (x1, y1), (x2, y2) in zip(points, points[1:]))" },
    { lang: "python", label: "sklearn, and why PR beats ROC under imbalance", code: "from sklearn.metrics import roc_auc_score, average_precision_score, roc_curve, precision_recall_curve\n\nroc_auc = roc_auc_score(y_true, scores)\nap = average_precision_score(y_true, scores)         # area under PR curve\n\nfpr, tpr, roc_thr = roc_curve(y_true, scores)\nprec, rec, pr_thr = precision_recall_curve(y_true, scores)\n\n# Cost-based threshold pick, not the default 0.5:\nimport numpy as np\nC_FN, C_FP = 500, 5                                   # missed fraud vs. blocked legit txn\ncost = C_FN * (1 - tpr) * y_true.sum() + C_FP * fpr * (len(y_true) - y_true.sum())\nbest_t = roc_thr[np.argmin(cost)]" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 1.95, maxFrames: 220 },

    params: [
      { key: "n", label: "Samples", type: "int", min: 60, max: 260, default: 150 },
      { key: "posRate", label: "% positive", type: "int", min: 10, max: 70, default: 30 },
      { key: "separation", label: "Class separation", type: "int", min: 0, max: 100, default: 55 },
      { key: "seed", label: "Resample", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = params.n;
      const gauss = () => {
        const u = Math.max(1e-9, rng()), v = rng();
        return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      };

      const nPos = Math.round((n * params.posRate) / 100);
      const nNeg = n - nPos;
      let labels = new Array(nPos).fill(1).concat(new Array(nNeg).fill(0));
      // Fisher-Yates shuffle with the injected rng
      for (let i = labels.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const tmp = labels[i]; labels[i] = labels[j]; labels[j] = tmp;
      }

      const muNeg = 0, muPos = 0.6 + (params.separation / 100) * 2.4, sigma = 1;
      const sigmoid = (x) => 1 / (1 + Math.exp(-x));
      const samples = labels.map((y) => {
        const raw = gauss() * sigma + (y ? muPos : muNeg);
        return { label: y, score: +sigmoid(raw).toFixed(4) };
      });

      const P = nPos, Nn = nNeg;

      // ---- full ROC/PR curve via the exact sorted-sweep algorithm ----
      const sortedDesc = samples.slice().sort((a, b) => b.score - a.score);
      let tp = 0, fp = 0;
      const curve = [{ thr: 1.0, tp: 0, fp: 0 }];
      let i = 0;
      while (i < sortedDesc.length) {
        let j = i;
        const sc = sortedDesc[i].score;
        while (j < sortedDesc.length && sortedDesc[j].score === sc) {
          if (sortedDesc[j].label) tp++; else fp++;
          j++;
        }
        curve.push({ thr: sc, tp, fp });
        i = j;
      }
      const points = curve.map((c) => {
        const tn = Nn - c.fp, fn = P - c.tp;
        const tpr = P ? c.tp / P : 0;
        const fpr = Nn ? c.fp / Nn : 0;
        const precision = (c.tp + c.fp) ? c.tp / (c.tp + c.fp) : 1;
        const recall = tpr;
        const f1 = (precision + recall) ? (2 * precision * recall) / (precision + recall) : 0;
        const accuracy = (c.tp + tn) / (P + Nn);
        const youden = tpr - fpr;
        return { thr: c.thr, tp: c.tp, fp: c.fp, tn, fn, tpr, fpr, precision, recall, f1, accuracy, youden };
      });

      const trapz = (xs, ys) => {
        let a = 0;
        for (let k = 1; k < xs.length; k++) a += (xs[k] - xs[k - 1]) * (ys[k] + ys[k - 1]) / 2;
        return a;
      };
      const aucRoc = trapz(points.map((p) => p.fpr), points.map((p) => p.tpr));
      const aucPr = trapz(points.map((p) => p.recall), points.map((p) => p.precision));

      let bestF1 = 0, bestF1Idx = 0, bestYoud = -Infinity, bestYoudIdx = 0;
      points.forEach((p, idx) => {
        if (p.f1 > bestF1) { bestF1 = p.f1; bestF1Idx = idx; }
        if (p.youden > bestYoud) { bestYoud = p.youden; bestYoudIdx = idx; }
      });

      // ---- score histogram, computed once from the real samples ----
      const nBins = 20, binW = 1 / nBins;
      const histPos = new Array(nBins).fill(0), histNeg = new Array(nBins).fill(0);
      for (const s of samples) {
        const b = Math.min(nBins - 1, Math.floor(s.score / binW));
        if (s.label) histPos[b]++; else histNeg[b]++;
      }

      const rocPath = points.map((p) => [+p.fpr.toFixed(4), +p.tpr.toFixed(4)]);
      const prPath = points.map((p) => [+p.recall.toFixed(4), +p.precision.toFixed(4)]);

      const snap = (over) => Object.assign({
        n, P, Nn, posRate: params.posRate,
        histPos: histPos.slice(), histNeg: histNeg.slice(), nBins, binW,
        aucRoc: +aucRoc.toFixed(4), aucPr: +aucPr.toFixed(4),
        rocPath: rocPath.slice(), prPath: prPath.slice(),
        curveLen: points.length,
        idx: null, thr: null, tp: null, fp: null, tn: null, fn: null,
        precision: null, recall: null, f1: null, tpr: null, fpr: null, accuracy: null,
        marker: null, phase2: "", note: ""
      }, over || {});

      yield {
        label: `${n} samples: ${P} positive, ${Nn} negative. Scores drawn from two overlapping distributions (positives centred higher) and squashed into (0,1) — separation = ${params.separation}/100. This is a real, computed dataset, not an illustration.`,
        phase: "init",
        state: snap({ phase2: "init" })
      };

      yield {
        label: `Sorted every score once and swept cumulative TP/FP through all ${points.length} distinct thresholds — the exact algorithm behind sklearn's roc_curve. Result: AUC-ROC = ${aucRoc.toFixed(4)} (probability a random positive outscores a random negative), AUC-PR = ${aucPr.toFixed(4)} (area under precision vs recall).`,
        phase: "curve",
        state: snap({ phase2: "curve-computed", note: "full curve computed before any animation" })
      };

      // ---- threshold sweep, walking the REAL curve points (subsampled for frame budget) ----
      const stride = Math.max(1, Math.floor(points.length / 42));
      const idxs = [];
      for (let k = 0; k < points.length; k += stride) idxs.push(k);
      if (idxs[idxs.length - 1] !== points.length - 1) idxs.push(points.length - 1);

      for (const idx of idxs) {
        const p = points[idx];
        let marker = null;
        if (idx === bestF1Idx) marker = "f1";
        else if (idx === bestYoudIdx) marker = "youden";
        yield {
          label: `threshold = ${p.thr.toFixed(3)}: TP=${p.tp}, FP=${p.fp}, TN=${p.tn}, FN=${p.fn}. Precision ${p.precision.toFixed(3)}, recall ${p.recall.toFixed(3)}, FPR ${p.fpr.toFixed(3)}, F1 ${p.f1.toFixed(3)}.` +
            (marker === "f1" ? `  ← best F1 on this sweep (${p.f1.toFixed(3)}).` : marker === "youden" ? `  ← best Youden's J = TPR−FPR (${p.youden.toFixed(3)}).` : ""),
          phase: "sweep",
          state: snap({
            idx, thr: p.thr, tp: p.tp, fp: p.fp, tn: p.tn, fn: p.fn,
            precision: p.precision, recall: p.recall, f1: p.f1, tpr: p.tpr, fpr: p.fpr, accuracy: p.accuracy,
            marker, phase2: "sweep",
            note: idx === 0 ? "threshold ≈ 1: predict nothing positive — recall 0" : idx === points.length - 1 ? "threshold ≈ 0: predict everything positive — recall 1, precision = base rate" : ""
          })
        };
      }

      const bp = points[bestF1Idx], by = points[bestYoudIdx];
      yield {
        label: `Best F1 on the full curve: threshold ${bp.thr.toFixed(3)} → F1 ${bp.f1.toFixed(3)} (precision ${bp.precision.toFixed(3)}, recall ${bp.recall.toFixed(3)}). Best Youden's J: threshold ${by.thr.toFixed(3)} → J ${by.youden.toFixed(3)} (TPR ${by.tpr.toFixed(3)}, FPR ${by.fpr.toFixed(3)}). Neither is "correct" without knowing the real cost of a false positive vs a false negative.`,
        phase: "best",
        state: snap({
          idx: bestF1Idx, thr: bp.thr, tp: bp.tp, fp: bp.fp, tn: bp.tn, fn: bp.fn,
          precision: bp.precision, recall: bp.recall, f1: bp.f1, tpr: bp.tpr, fpr: bp.fpr, accuracy: bp.accuracy,
          marker: "f1", phase2: "best-f1", note: "F1-optimal operating point"
        })
      };
      yield {
        label: `At threshold 0.5 specifically (the default nobody should trust blindly): compare its precision/recall to the F1-optimal point above — with ${params.posRate}% positives, 0.5 is rarely where either curve peaks.`,
        phase: "best",
        state: (function () {
          const at05 = points.reduce((best, p) => (Math.abs(p.thr - 0.5) < Math.abs(best.thr - 0.5) ? p : best), points[0]);
          return snap({
            idx: points.indexOf(at05), thr: at05.thr, tp: at05.tp, fp: at05.fp, tn: at05.tn, fn: at05.fn,
            precision: at05.precision, recall: at05.recall, f1: at05.f1, tpr: at05.tpr, fpr: at05.fpr, accuracy: at05.accuracy,
            marker: null, phase2: "at-0.5", note: "the default threshold — not necessarily a good one"
          });
        })()
      };

      yield {
        label: `Summary: AUC-ROC ${aucRoc.toFixed(4)}, AUC-PR ${aucPr.toFixed(4)} on a ${P}:${Nn} class split. ${aucPr < aucRoc - 0.05 ? "Notice AUC-PR sits noticeably below AUC-ROC — the imbalance is making ROC look more optimistic than the precision story actually is." : "AUC-PR and AUC-ROC are close here because the classes are not badly imbalanced — that gap widens as positives get rarer."} Pick the threshold from a real cost trade-off, not from 0.5 or from whichever metric looks best.`,
        phase: "done",
        state: snap({ phase2: "summary" })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      const pad = 14;
      const colW = (W - pad * 4) / 3;
      const col1 = pad, col2 = pad * 2 + colW, col3 = pad * 3 + colW * 2;
      const top = 46, plotH = H - top - 96;

      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `13px ${env.font.base}`;
      ctx.fillText(`n=${s.n}  P=${s.P}  N=${s.Nn}  ·  ${s.phase2}`, pad, 20);
      ctx.fillStyle = C.muted;
      ctx.font = `11px ${env.font.mono}`;
      ctx.fillText(s.note || "", pad, 36);

      // ============ PANEL 1: score histogram + threshold line ============
      ctx.textAlign = "left"; ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.fillText("score distribution", col1, top - 8);
      const hMax = Math.max(1, ...s.histPos, ...s.histNeg);
      const bw = colW / s.nBins;
      for (let b = 0; b < s.nBins; b++) {
        const x = col1 + b * bw;
        const hNeg = (s.histNeg[b] / hMax) * (plotH * 0.48);
        const hPos = (s.histPos[b] / hMax) * (plotH * 0.48);
        ctx.fillStyle = C.viz1; ctx.globalAlpha = 0.8;
        ctx.fillRect(x + 1, top + plotH * 0.5 - hPos, Math.max(1, bw - 2), hPos);
        ctx.fillStyle = C.viz8; ctx.globalAlpha = 0.75;
        ctx.fillRect(x + 1, top + plotH * 0.5, Math.max(1, bw - 2), hNeg);
        ctx.globalAlpha = 1;
      }
      ctx.strokeStyle = C.axis; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(col1, top + plotH * 0.5); ctx.lineTo(col1 + colW, top + plotH * 0.5); ctx.stroke();
      ctx.strokeRect(col1, top, colW, plotH);
      if (s.thr != null) {
        const tx = col1 + s.thr * colW;
        ctx.strokeStyle = C.viz4; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(tx, top); ctx.lineTo(tx, top + plotH); ctx.stroke();
        ctx.fillStyle = C.viz4; ctx.font = `10px ${env.font.mono}`; ctx.textAlign = "center";
        ctx.fillText(`t=${s.thr.toFixed(2)}`, tx, top - 2 < 10 ? 12 : top - 2);
      }
      ctx.textAlign = "left"; ctx.font = `10px ${env.font.base}`;
      ctx.fillStyle = C.viz1; ctx.fillText("● positives (above)", col1, top + plotH + 14);
      ctx.fillStyle = C.viz8; ctx.fillText("● negatives (below)", col1, top + plotH + 28);

      // ============ PANEL 2: ROC curve ============
      ctx.textAlign = "left"; ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.fillText(`ROC  ·  AUC = ${s.aucRoc.toFixed(3)}`, col2, top - 8);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.strokeRect(col2, top, colW, plotH);
      const RX = (x) => col2 + x * colW, RY = (y) => top + plotH - y * plotH;
      ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(RX(0), RY(0)); ctx.lineTo(RX(1), RY(1)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = C.viz3; ctx.lineWidth = 2;
      ctx.beginPath();
      s.rocPath.forEach((pt, k) => { const x = RX(pt[0]), y = RY(pt[1]); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
      if (s.idx != null && s.fpr != null) {
        ctx.fillStyle = s.marker === "youden" ? C.warn : C.viz7;
        ctx.beginPath(); ctx.arc(RX(s.fpr), RY(s.tpr), 4.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("FPR →", col2, top + plotH + 14);
      ctx.save(); ctx.translate(col2 - 4, top + plotH); ctx.rotate(-Math.PI / 2);
      ctx.fillText("TPR →", 0, 0); ctx.restore();

      // ============ PANEL 3: PR curve ============
      ctx.textAlign = "left"; ctx.fillStyle = C.text2; ctx.font = `11px ${env.font.base}`;
      ctx.fillText(`Precision-Recall  ·  AUC = ${s.aucPr.toFixed(3)}`, col3, top - 8);
      ctx.strokeStyle = C.grid; ctx.lineWidth = 1;
      ctx.strokeRect(col3, top, colW, plotH);
      const PX = (x) => col3 + x * colW, PY = (y) => top + plotH - y * plotH;
      const base = s.P / (s.P + s.Nn);
      ctx.strokeStyle = C.muted; ctx.setLineDash([3, 3]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(PX(0), PY(base)); ctx.lineTo(PX(1), PY(base)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = C.viz6; ctx.lineWidth = 2;
      ctx.beginPath();
      s.prPath.forEach((pt, k) => { const x = PX(pt[0]), y = PY(pt[1]); if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
      ctx.stroke();
      if (s.idx != null && s.recall != null) {
        ctx.fillStyle = s.marker === "f1" ? C.warn : C.viz7;
        ctx.beginPath(); ctx.arc(PX(s.recall), PY(s.precision), 4.5, 0, Math.PI * 2); ctx.fill();
      }
      ctx.fillStyle = C.muted; ctx.font = `9px ${env.font.mono}`; ctx.textAlign = "left";
      ctx.fillText("recall →", col3, top + plotH + 14);
      ctx.save(); ctx.translate(col3 - 4, top + plotH); ctx.rotate(-Math.PI / 2);
      ctx.fillText("precision →", 0, 0); ctx.restore();

      // ============ footer: confusion matrix + numbers ============
      const fy = top + plotH + 44;
      if (s.tp != null) {
        const cmX = pad, cw = 46, ch = 30;
        const cell = (x, y, label, val, col) => {
          ctx.fillStyle = col; ctx.globalAlpha = 0.25;
          ctx.fillRect(x, y, cw, ch);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = C.border; ctx.strokeRect(x, y, cw, ch);
          ctx.fillStyle = C.text; ctx.font = `12px ${env.font.mono}`; ctx.textAlign = "center";
          ctx.fillText(String(val), x + cw / 2, y + 14);
          ctx.fillStyle = C.muted; ctx.font = `8px ${env.font.mono}`;
          ctx.fillText(label, x + cw / 2, y + 26);
        };
        cell(cmX, fy, "TP", s.tp, C.viz3);
        cell(cmX + cw, fy, "FP", s.fp, C.viz8);
        cell(cmX, fy + ch, "FN", s.fn, C.viz8);
        cell(cmX + cw, fy + ch, "TN", s.tn, C.viz3);

        const statsX = cmX + cw * 2 + 24;
        ctx.textAlign = "left"; ctx.font = `11px ${env.font.mono}`; ctx.fillStyle = C.text2;
        ctx.fillText(`threshold ${s.thr.toFixed(3)}`, statsX, fy + 10);
        ctx.fillText(`precision ${s.precision.toFixed(3)}   recall ${s.recall.toFixed(3)}   F1 ${s.f1.toFixed(3)}`, statsX, fy + 26);
        ctx.fillText(`FPR ${s.fpr.toFixed(3)}   accuracy ${s.accuracy.toFixed(3)}`, statsX, fy + 42);
      }
    }
  },

  drill: {
    cards: [
      { q: "Define precision and recall in terms of TP/FP/FN.", a: "Precision = TP/(TP+FP): of what you flagged positive, how much was real. Recall = TP/(TP+FN): of what was actually positive, how much did you catch.", tags: ["definitions"] },
      { q: "What does AUC-ROC mean, exactly?", a: "The probability a randomly chosen positive scores higher than a randomly chosen negative — equal to the Mann-Whitney U statistic rescaled to [0,1]. It measures ranking quality only, independent of any specific threshold.", tags: ["auc"] },
      { q: "Why is PR-AUC preferred over ROC-AUC for rare-positive problems?", a: "FPR's denominator (FP+TN) is dominated by the abundant negatives, so ROC hides a real precision problem. Precision (TP/(TP+FP)) has no such denominator and drops visibly when false positives pile up relative to few true positives.", tags: ["imbalance"] },
      { q: "Why is 0.5 usually the wrong default threshold?", a: "0.5 is only optimal when false positives and false negatives cost the same and classes are balanced — rarely true. The right threshold minimizes the actual cost `C_fn·FN + C_fp·FP`.", tags: ["threshold"] },
      { q: "What is Youden's J statistic?", a: "J = TPR − FPR, maximized at the ROC point farthest above the diagonal — the threshold that best separates the classes overall, without regard to asymmetric error costs.", tags: ["threshold"] },
      { q: "Discrimination vs calibration — what's the difference?", a: "Discrimination (AUC) is whether positives rank above negatives, invariant to monotonic score transforms. Calibration is whether a predicted 0.9 really corresponds to ~90% actual positives. A model can have great AUC and be badly miscalibrated; AUC can't detect that.", tags: ["calibration"] },
      { q: "Why is accuracy misleading on imbalanced data?", a: "Predicting the majority class always gives high accuracy while catching zero of the minority class — always compare to that baseline before trusting accuracy.", tags: ["imbalance"] },
      { q: "How do you get the full ROC/PR curve in one pass?", a: "Sort scores once (O(n log n)), then sweep the threshold from high to low, incrementally updating cumulative TP/FP at each distinct score — one sorted sweep produces every threshold's confusion matrix, avoiding an O(k·n) grid search.", tags: ["algorithm"] }
    ],
    sixtySecond: [
      "Explain the confusion matrix, precision, recall, and how ROC and PR curves are built by sweeping the threshold — and why they diverge under class imbalance.",
      "Explain how you would pick an operating threshold for a real business problem with asymmetric costs, rather than defaulting to 0.5 or the max-F1 point."
    ]
  }
};
