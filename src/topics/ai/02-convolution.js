export default {
  id: "convolution",
  track: "ai",
  title: "CNNs & Convolution",
  difficulty: 2,
  minutes: 16,
  tags: ["cnn", "convolution", "kernels", "receptive-field"],

  explainer: [
    { type: "p", text: "Imagine looking at a huge photograph through a tiny 3-by-3-pixel peephole, sliding that peephole left to right and top to bottom across the whole image, and at every position writing down one number that summarises what you see through it. That's a **convolution**. The \"peephole\" is a small grid of learned numbers called a **kernel** or **filter**, and the \"summarising\" is a dot product — multiply each number under the peephole by the matching kernel number and add them up. Convolutional Neural Networks (CNNs) build their layers out of this operation instead of the dense, everything-connects-to-everything layers used in a plain neural network, because for images it buys three things a dense layer cannot give you for free: *locality* (each output number only looks at a small neighbourhood of pixels, which matches how real images work — nearby pixels are related, far-apart ones usually aren't), *weight sharing* (the exact same 9 numbers in the kernel get reused at every position across the whole image, so a 3×3 filter over a 224×224 image costs only 9 learned weights, not 50,000), and *translation equivariance* (if you shift the input image over, the output feature map shifts over by exactly the same amount — the filter finds the same pattern wherever it appears)." },

    { type: "h3", text: "The arithmetic, exactly" },
    { type: "p", text: "For a single input channel (think: one greyscale image), the value at output position `[i,j]` is `out[i,j] = Σ_u Σ_v K[u,v] · X[i·s + u − p, j·s + v − p]` — in words, slide the kernel `K` so its corner lands near pixel `[i,j]` of the input `X`, multiply every kernel entry by the pixel underneath it, and add up all those products. Here `s` is the **stride**, how many pixels the kernel jumps between positions, and `p` is the **padding**, how many rows/columns of zeros you add around the border of the image so the kernel can also center on edge pixels. Reading past the edge of the padded image just returns 0. The size of the resulting output grid is `⌊(n + 2p − k)/s⌋ + 1`, where `n` is the input size and `k` is the kernel size (the `⌊⌋` symbols mean \"round down\"). Two special cases are worth memorising: `k=3, p=1, s=1` keeps the output the exact same size as the input (called \"same\" padding), and `s=2` roughly halves each spatial dimension." },
    { type: "callout", tone: "pitfall", text: "What every deep-learning framework calls \"convolution\" is technically **cross-correlation** — a real mathematical convolution flips the kernel 180 degrees before sliding it. This makes no practical difference when the kernel is learned, because the network just learns the already-flipped version of the weights it needs. But if an interviewer hands you a fixed, named kernel and asks for the true mathematical convolution result, you do need to flip it first." },

    { type: "h3", text: "Multiple channels: where the parameter count really lives" },
    { type: "p", text: "Real images aren't one greyscale plane — a colour photo has 3 channels (red, green, blue), and deeper layers of a CNN can have dozens or hundreds of channels. A convolutional layer with `C_in` input channels and `C_out` output filters, each of size `k×k`, has `C_out · C_in · k · k + C_out` learned parameters in total (the `+ C_out` is one bias per filter). Each individual filter is not flat — it's a `C_in × k × k` block that reaches across *all* input channels at once, and produces exactly **one** output channel. So a 3×3 convolution going from 64 input channels to 128 output channels has 73,856 parameters, and running it over a 56×56 feature map costs roughly 2·73,728·56² ≈ 462 million floating-point operations (FLOPs). The output's height and width are controlled by stride and padding; the output's depth (number of channels) is controlled purely by how many filters you use — those two are completely independent settings." },

    { type: "h3", text: "Receptive field and why depth beats width here" },
    { type: "list", items: [
      "The **receptive field** of an output pixel is the region of the original input image that can influence it. Stacking two 3×3 convolutions back to back gives each final output pixel a 5×5 receptive field, using only `2·9 = 18` weights per channel pair instead of the `25` a single 5×5 filter would cost — and it inserts an extra non-linearity (activation function) in between, adding expressive power for free. Three stacked 3×3 filters reach a 7×7 receptive field for 27 weights. This is the argument the VGG architecture made famous, and it comes up constantly in interviews.",
      "The receptive field grows according to `r_{l+1} = r_l + (k−1)·∏(strides so far)` — each new layer adds `(k−1)` times the product of every stride used up to that layer. This means layers that use a stride greater than 1 expand the receptive field much faster than layers that don't.",
      "A **1×1 convolution** is a filter that is just one pixel wide and tall — it mixes information across channels at a single pixel without looking at any neighbouring pixels at all. It behaves like a per-pixel fully-connected layer, and is used to cheaply shrink or grow the number of channels (called a \"bottleneck\", used heavily in ResNet and Inception).",
      "A **depthwise separable convolution** splits an ordinary convolution into two cheaper steps: first a per-channel `k×k` spatial filter (each input channel gets its own small filter, with no mixing across channels), then a `1×1` convolution that mixes the channels together. This cuts the computational cost by roughly `1/C_out + 1/k²` — about 8–9× cheaper for a typical 3×3 filter. It's the entire idea behind the MobileNet family of architectures, designed to run on phones.",
      "**Pooling** (such as max-pooling) shrinks the feature map by keeping only the strongest value in each small region, giving cheap resistance to small shifts in the image. Modern architectures increasingly use strided convolutions instead of pooling, so that the downsampling itself is a learned operation rather than a fixed rule."
    ]},

    { type: "callout", tone: "tip", text: "When asked \"CNN or transformer, and why?\", the honest answer is about **inductive bias** — the built-in assumptions an architecture starts with — versus how much data you have. A convolution *hard-codes* the assumption that nearby pixels matter more than far-apart ones (locality) and that patterns matter regardless of where they appear (translation equivariance), so it performs well even with a modest amount of training data. A Vision Transformer (ViT) has none of that baked in — it has to *learn* those patterns from data — so it only overtakes a CNN once you feed it enough data (or you re-inject some of that bias by cutting the image into patches, using windowed attention, or adding a small convolutional \"stem\" at the start)." },

    { type: "h3", text: "Backprop through a convolution" },
    { type: "p", text: "During training, the network needs to know how to adjust the kernel weights based on the error at the output — this is done via **backpropagation**, the standard algorithm for computing gradients (the direction and size of the nudge each weight should get) layer by layer, working backwards from the output. For a convolution, the gradient with respect to the *input* turns out to be another convolution — this time of the output's gradient with the kernel flipped 180 degrees (using \"full\" padding, meaning extra padding so the whole kernel can slide completely off each edge). The gradient with respect to the *kernel itself* is a convolution of the original input with the output's gradient. Because the same weights are reused at every position (weight sharing, as described above), the gradient contributions from every single position get *added together* into that one small set of numbers — which is exactly why CNNs learn efficiently from relatively little data, and also why one unusual or noisy region of an image can disproportionately dominate a filter's update." }
  ],

  glossary: [
    { term: "Convolution", plain: "An operation that slides a small grid of learned numbers across an image and, at every position, multiplies and sums the numbers underneath it into one output value." },
    { term: "Kernel / filter", plain: "The small grid of learned numbers (for example 3×3) that gets slid across the input during a convolution." },
    { term: "Channel", plain: "One of the separate 'layers' of a feature map or image, such as red, green and blue in a colour photo, or one of many learned feature planes deeper in a network." },
    { term: "Stride", plain: "How many pixels the kernel jumps between one position and the next as it slides across the input; a stride of 2 skips every other position." },
    { term: "Padding", plain: "Extra rows and columns of zeros added around the border of an image so a kernel can also produce output values near the edges." },
    { term: "Weight sharing", plain: "Reusing the exact same small set of kernel numbers at every position across the image, instead of learning a separate weight for every pixel." },
    { term: "Translation equivariance", plain: "The property that shifting the input image over shifts the output feature map by exactly the same amount, rather than producing something unrelated." },
    { term: "Receptive field", plain: "The area of the original input image that can possibly affect one particular output value, after however many layers of convolution have been applied." },
    { term: "1×1 convolution", plain: "A convolution whose kernel is a single pixel wide and tall, so it only mixes information across channels at each position and touches no neighbouring pixels." },
    { term: "Depthwise separable convolution", plain: "A cheaper substitute for a normal convolution that first filters each channel separately and then mixes channels together with a 1×1 convolution." },
    { term: "Pooling", plain: "A downsampling step that shrinks a feature map by summarising each small region with one number, such as its maximum value." },
    { term: "Inductive bias", plain: "The built-in assumptions an architecture starts with before seeing any data, such as a CNN assuming nearby pixels are more related than far-apart ones." },
    { term: "Backpropagation", plain: "The standard algorithm for training a neural network: it computes how much each weight should change by working backwards from the output error through every layer." },
    { term: "FLOPs", plain: "Floating-point operations — the standard unit for counting how much arithmetic a computation requires." }
  ],

  complexity: {
    rows: [
      { operation: "Conv forward (1 layer)", time: "O(C_out·C_in·k²·H_out·W_out)", space: "O(C_out·H_out·W_out)", note: "≈2 FLOPs per multiply-add" },
      { operation: "Parameters", time: "—", space: "C_out·C_in·k² + C_out", note: "independent of image size" },
      { operation: "Output size", time: "—", space: "⌊(n+2p−k)/s⌋+1", note: "per spatial dimension" },
      { operation: "Depthwise separable", time: "≈ (1/C_out + 1/k²) × dense conv", space: "C_in·k² + C_in·C_out", note: "MobileNet's core trick" },
      { operation: "Equivalent dense layer", time: "O((HWC)²)", space: "(H·W·C)²", note: "why convolution exists at all" }
    ]
  },

  interview: {
    whyAsked: "Convolution is the cleanest test of whether you can do shape arithmetic under pressure and articulate an inductive bias. Interviewers want the output-size formula without hesitation, the parameter count including channels, and a crisp story about why weight sharing is the win — not a recital of famous architectures.",
    followUps: [
      { q: "Given a 224×224×3 input and 64 filters of size 7×7, stride 2, padding 3 — what comes out and how many parameters?", a: "Output spatial size is ⌊(224 + 6 − 7)/2⌋ + 1 = 112, so the feature map is 112×112×64. Parameters are 64·3·7·7 + 64 = 9,472. That is ResNet's stem layer." },
      { q: "Why prefer two 3×3 convs over one 5×5?", a: "Same 5×5 receptive field, fewer parameters (2·9=18 vs 25 per channel pair), and an extra non-linearity between them, which increases expressivity. The only cost is an extra activation tensor to store and one more kernel launch." },
      { q: "What does a 1×1 convolution do?", a: "It applies a shared linear map across channels at each spatial position — a per-pixel fully connected layer. It cannot mix spatial information at all; it is used to cheaply change channel depth (bottlenecks) and to add non-linear capacity between spatial convs." },
      { q: "Is convolution translation invariant?", a: "Equivariant, not invariant: shifting the input shifts the feature map by the same amount. Invariance only appears after pooling or a global average, which discards position. Confusing the two is the most common slip in this question." },
      { q: "How do you compute the receptive field of a stack of layers?", a: "Iterate `r ← r + (k−1)·j`, where `j` is the running product of all preceding strides, starting from r=1, j=1, and update `j ← j·s` per layer. Strides multiply the jump, so they grow the receptive field far faster than adding unstrided layers." },
      { q: "Why do CNNs still beat ViTs on small datasets?", a: "Because locality and weight sharing are priors that a transformer has to learn from data. With limited data, that prior is worth more than the flexibility of global attention; with enough data (or heavy augmentation and pretraining), the learned attention pattern surpasses the hand-coded one." }
    ]
  },

  code: [
    { lang: "python", label: "Conv2d forward from scratch (numpy)", code: "import numpy as np\n\ndef conv2d(X, K, stride=1, pad=0):\n    \"\"\"X: (C_in, H, W)   K: (C_out, C_in, k, k)  ->  (C_out, H_out, W_out)\"\"\"\n    C_in, H, W = X.shape\n    C_out, _, k, _ = K.shape\n    Xp = np.pad(X, ((0, 0), (pad, pad), (pad, pad)))          # zero padding\n\n    H_out = (H + 2 * pad - k) // stride + 1\n    W_out = (W + 2 * pad - k) // stride + 1\n    out = np.zeros((C_out, H_out, W_out))\n\n    for oc in range(C_out):\n        for i in range(H_out):\n            for j in range(W_out):\n                patch = Xp[:, i * stride:i * stride + k, j * stride:j * stride + k]\n                out[oc, i, j] = np.sum(patch * K[oc])          # dot product over C_in*k*k\n    return out\n\nX = np.random.default_rng(0).random((3, 8, 8))\nK = np.random.default_rng(1).random((4, 3, 3, 3))\nprint(conv2d(X, K, stride=2, pad=1).shape)                    # (4, 4, 4)" },
    { lang: "python", label: "im2col: how it is really done", code: "import numpy as np\n\ndef im2col(X, k, stride=1, pad=0):\n    \"\"\"Turn every k*k patch into a column so conv becomes ONE matmul.\"\"\"\n    C, H, W = X.shape\n    Xp = np.pad(X, ((0, 0), (pad, pad), (pad, pad)))\n    H_out = (H + 2 * pad - k) // stride + 1\n    W_out = (W + 2 * pad - k) // stride + 1\n    cols = np.empty((C * k * k, H_out * W_out))\n    for i in range(H_out):\n        for j in range(W_out):\n            patch = Xp[:, i*stride:i*stride+k, j*stride:j*stride+k]\n            cols[:, i * W_out + j] = patch.reshape(-1)\n    return cols, H_out, W_out\n\n# out = K.reshape(C_out, -1) @ cols  ->  (C_out, H_out*W_out)\n# Trades memory (k*k duplication) for one huge GEMM. This is why convs are\n# fast on GPUs at all, and why 'conv is just a matmul' is a fair thing to say." },
    { lang: "python", label: "Shape + FLOP calculator you can quote", code: "def conv_stats(H, W, C_in, C_out, k, stride=1, pad=0):\n    H_out = (H + 2*pad - k) // stride + 1\n    W_out = (W + 2*pad - k) // stride + 1\n    params = C_out * C_in * k * k + C_out\n    flops  = 2 * C_out * C_in * k * k * H_out * W_out   # mul + add\n    return (C_out, H_out, W_out), params, flops\n\nprint(conv_stats(224, 224, 3, 64, 7, stride=2, pad=3))\n# ((64, 112, 112), 9472, 236027904)  <- ResNet-50 stem\n\ndef receptive_field(layers):          # layers = [(k, stride), ...]\n    r, jump = 1, 1\n    for k, s in layers:\n        r += (k - 1) * jump\n        jump *= s\n    return r\n\nprint(receptive_field([(3,1), (3,1), (3,2), (3,1)]))   # 15" }
  ],

  viz: {
    kind: "canvas",
    layout: { aspect: 2.0, maxFrames: 500 },

    params: [
      { key: "kernel", label: "Kernel", type: "enum", options: ["sobel-x", "sobel-y", "blur", "sharpen", "identity"], default: "sobel-x" },
      { key: "image", label: "Input", type: "enum", options: ["vertical-edge", "square", "diagonal"], default: "vertical-edge" },
      { key: "stride", label: "Stride", type: "int", min: 1, max: 3, default: 1 },
      { key: "pad", label: "Padding", type: "int", min: 0, max: 2, default: 0 },
      { key: "seed", label: "Re-noise", type: "seed" }
    ],

    frames: function* (params, rng) {
      const n = 8;
      const k = 3;
      const stride = Math.max(1, Math.min(3, params.stride | 0 || 1));
      const pad = Math.max(0, Math.min(2, params.pad | 0));
      const kname = params.kernel || "sobel-x";
      const iname = params.image || "vertical-edge";

      const KERNELS = {
        "sobel-x": { m: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]], div: 1, why: "vertical edges: right neighbours minus left neighbours" },
        "sobel-y": { m: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]], div: 1, why: "horizontal edges: bottom rows minus top rows" },
        "blur": { m: [[1, 1, 1], [1, 1, 1], [1, 1, 1]], div: 9, why: "box blur: the mean of the 3×3 neighbourhood" },
        "sharpen": { m: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]], div: 1, why: "centre boosted, neighbours subtracted — amplifies local contrast" },
        "identity": { m: [[0, 0, 0], [0, 1, 0], [0, 0, 0]], div: 1, why: "copies the centre pixel; a sanity check that indexing is right" }
      };
      const K = KERNELS[kname] || KERNELS["sobel-x"];
      const kernel = K.m.map((r) => r.slice());
      const div = K.div;

      // ---- build an 8×8 "image" of integers 0..9 --------------------------
      const img = [];
      for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
          let v;
          if (iname === "vertical-edge") v = j < 4 ? 1 : 8;
          else if (iname === "square") v = (i >= 2 && i <= 5 && j >= 2 && j <= 5) ? 9 : 1;
          else v = (j - i >= 0) ? 8 : 1;
          v += Math.floor(rng() * 2);             // ±1 of texture, deterministic per seed
          row.push(Math.max(0, Math.min(9, v)));
        }
        img.push(row);
      }

      const outH = Math.floor((n + 2 * pad - k) / stride) + 1;
      const outW = outH;
      const out = [];
      for (let i = 0; i < outH; i++) out.push(new Array(outW).fill(null));

      const at = (i, j) => (i < 0 || j < 0 || i >= n || j >= n) ? 0 : img[i][j];
      const r2 = (v) => (Math.round(v * 100) / 100) || 0;

      const snap = (extra) => Object.assign({
        img: img.map((r) => r.slice()),
        n: n, k: k, stride: stride, pad: pad,
        kernel: kernel.map((r) => r.slice()),
        div: div, kname: kname, iname: iname,
        outH: outH, outW: outW,
        out: out.map((r) => r.slice()),
        cur: null, patch: null, terms: null, acc: null, value: null
      }, extra || {});

      yield {
        label: `Input ${n}×${n}, kernel ${k}×${k} (${kname} — ${K.why}), stride ${stride}, padding ${pad}. Output size = ⌊(${n} + 2·${pad} − ${k})/${stride}⌋ + 1 = ${outH}, so the feature map is ${outH}×${outW}.`,
        phase: "init",
        state: snap({})
      };

      const detailCells = 2;                     // unroll the first 2 cells term-by-term
      let cellIdx = 0;

      for (let oi = 0; oi < outH; oi++) {
        for (let oj = 0; oj < outW; oj++) {
          const i0 = oi * stride - pad;
          const j0 = oj * stride - pad;

          const patch = [];
          for (let u = 0; u < k; u++) {
            const prow = [];
            for (let v = 0; v < k; v++) {
              const ii = i0 + u, jj = j0 + v;
              prow.push({ v: at(ii, jj), oob: (ii < 0 || jj < 0 || ii >= n || jj >= n) });
            }
            patch.push(prow);
          }

          const detail = cellIdx < detailCells;
          let acc = 0;
          const terms = [];

          if (detail) {
            yield {
              label: `out[${oi},${oj}]: the window's top-left lands on input[${i0},${j0}]. ${pad > 0 ? "Cells outside the image read as 0 (zero padding). " : ""}Nine multiply-accumulates follow.`,
              phase: "window",
              focus: [oi, oj],
              state: snap({ cur: { oi: oi, oj: oj, i0: i0, j0: j0 }, patch: patch.map((r) => r.map((c) => ({ v: c.v, oob: c.oob }))), terms: [], acc: 0 })
            };
          }

          for (let u = 0; u < k; u++) {
            for (let v = 0; v < k; v++) {
              const prod = kernel[u][v] * patch[u][v].v;
              acc += prod;
              if (detail) {
                terms.push({ u: u, v: v, kw: kernel[u][v], px: patch[u][v].v, prod: prod });
                yield {
                  label: `K[${u},${v}]·X[${i0 + u},${j0 + v}] = ${kernel[u][v]} × ${patch[u][v].v} = ${prod}${patch[u][v].oob ? " (padded 0)" : ""}  →  running sum ${acc}`,
                  phase: "mac",
                  focus: [oi, oj],
                  state: snap({ cur: { oi: oi, oj: oj, i0: i0, j0: j0 }, patch: patch.map((r) => r.map((c) => ({ v: c.v, oob: c.oob }))), terms: terms.map((t) => ({ u: t.u, v: t.v, kw: t.kw, px: t.px, prod: t.prod })), acc: acc })
                };
              }
            }
          }

          const val = r2(acc / div);
          out[oi][oj] = val;

          let read;
          if (kname === "blur") read = `the local mean — high-frequency texture is gone`;
          else if (kname === "identity") read = `identical to X[${i0 + 1},${j0 + 1}] = ${at(i0 + 1, j0 + 1)}, as it must be`;
          else if (Math.abs(val) < 3) read = `≈0: this window is flat, so the edge detector stays silent`;
          else if (val > 0) read = `strongly positive: brightness increases across the window in the filter's direction — an edge`;
          else read = `strongly negative: brightness decreases across the window — the same edge, opposite polarity`;

          yield {
            label: `out[${oi},${oj}] = Σ K⊙patch${div !== 1 ? ` / ${div}` : ""} = ${val} — ${read}.`,
            phase: "emit",
            focus: [oi, oj],
            state: snap({ cur: { oi: oi, oj: oj, i0: i0, j0: j0 }, patch: patch.map((r) => r.map((c) => ({ v: c.v, oob: c.oob }))), terms: null, acc: acc, value: val })
          };
          cellIdx++;
        }
      }

      const params1ch = k * k + 1;
      yield {
        label: `Done: ${outH * outW} output cells, each a ${k * k}-term dot product, all sharing the SAME ${k * k} weights (+1 bias = ${params1ch} parameters). A dense layer doing this would need ${n * n} × ${outH * outW} = ${n * n * outH * outW} weights.`,
        phase: "done",
        state: snap({ cur: null })
      };
    },

    draw: function (frame, ctx, env) {
      const s = frame.state;
      const C = env.colors;
      const W = env.width, H = env.height;
      ctx.clearRect(0, 0, W, H);

      // -- colour helpers (all inputs come from env.colors) -----------------
      const parse = (hex) => {
        if (typeof hex !== "string" || hex[0] !== "#") return [128, 128, 128];
        let h = hex.slice(1);
        if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
        const n = parseInt(h.slice(0, 6), 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const mix = (a, b, t) => {
        const A = parse(a), B = parse(b);
        t = Math.max(0, Math.min(1, t));
        return `rgb(${Math.round(A[0] + (B[0] - A[0]) * t)},${Math.round(A[1] + (B[1] - A[1]) * t)},${Math.round(A[2] + (B[2] - A[2]) * t)})`;
      };

      const padL = 16, top = 46;
      const bottomH = 104;
      const gridH = H - top - bottomH - 12;
      const cell = Math.min(gridH / s.n, (W * 0.40) / s.n, 34);
      const gx = padL + 10, gy = top;

      const fmH = Math.min(gridH / Math.max(1, s.outH), 34);
      const fx = gx + s.n * cell + 92;
      const fy = top;

      // ---------- input image ---------------------------------------------
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (let i = 0; i < s.n; i++) {
        for (let j = 0; j < s.n; j++) {
          const v = s.img[i][j];
          const x = gx + j * cell, y = gy + i * cell;
          ctx.fillStyle = mix(C.surface2, C.text, v / 9);
          ctx.fillRect(x, y, cell - 1, cell - 1);
          if (cell >= 18) {
            ctx.fillStyle = v / 9 > 0.55 ? C.surface : C.text2;
            ctx.font = `${Math.min(12, cell * 0.42)}px ${env.font.mono}`;
            ctx.fillText(String(v), x + cell / 2, y + cell / 2);
          }
        }
      }

      // padding ring
      if (s.pad > 0) {
        ctx.strokeStyle = C.muted;
        ctx.setLineDash([3, 3]);
        ctx.lineWidth = 1;
        ctx.strokeRect(gx - s.pad * cell, gy - s.pad * cell, (s.n + 2 * s.pad) * cell, (s.n + 2 * s.pad) * cell);
        ctx.setLineDash([]);
      }

      // sliding window
      if (s.cur) {
        const x = gx + s.cur.j0 * cell, y = gy + s.cur.i0 * cell;
        ctx.strokeStyle = C.viz4;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x, y, s.k * cell, s.k * cell);
        // highlight the single active tap
        if (s.terms && s.terms.length) {
          const t = s.terms[s.terms.length - 1];
          ctx.strokeStyle = C.viz2;
          ctx.lineWidth = 2;
          ctx.strokeRect(x + t.v * cell, y + t.u * cell, cell - 1, cell - 1);
        }
      }

      // ---------- feature map ----------------------------------------------
      let maxAbs = 1;
      for (let i = 0; i < s.outH; i++) for (let j = 0; j < s.outW; j++) {
        const v = s.out[i][j];
        if (v !== null) maxAbs = Math.max(maxAbs, Math.abs(v));
      }
      for (let i = 0; i < s.outH; i++) {
        for (let j = 0; j < s.outW; j++) {
          const v = s.out[i][j];
          const x = fx + j * fmH, y = fy + i * fmH;
          if (v === null) {
            ctx.fillStyle = C.surface;
            ctx.fillRect(x, y, fmH - 1, fmH - 1);
            ctx.strokeStyle = C.grid;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, fmH - 2, fmH - 2);
          } else {
            const t = Math.abs(v) / maxAbs;
            ctx.fillStyle = mix(C.surface2, v >= 0 ? C.viz1 : C.viz2, 0.18 + 0.82 * t);
            ctx.fillRect(x, y, fmH - 1, fmH - 1);
            if (fmH >= 17) {
              ctx.fillStyle = t > 0.5 ? C.surface : C.text2;
              ctx.font = `${Math.min(11, fmH * 0.40)}px ${env.font.mono}`;
              ctx.fillText(Math.abs(v) >= 10 || Number.isInteger(v) ? String(v) : v.toFixed(1), x + fmH / 2, y + fmH / 2);
            }
          }
        }
      }
      if (s.cur) {
        ctx.strokeStyle = C.viz4;
        ctx.lineWidth = 2.5;
        ctx.strokeRect(fx + s.cur.oj * fmH, fy + s.cur.oi * fmH, fmH - 1, fmH - 1);
      }

      // arrow between the two grids
      const ay = gy + Math.min(s.n * cell, s.outH * fmH) / 2;
      ctx.strokeStyle = C.axis;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(gx + s.n * cell + 18, ay);
      ctx.lineTo(fx - 18, ay);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(fx - 18, ay); ctx.lineTo(fx - 26, ay - 5); ctx.lineTo(fx - 26, ay + 5);
      ctx.closePath();
      ctx.fillStyle = C.axis;
      ctx.fill();

      // ---------- headers ---------------------------------------------------
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.fillStyle = C.text;
      ctx.font = `12px ${env.font.base}`;
      ctx.fillText(`input  ${s.n}×${s.n}`, gx, top - 22);
      ctx.fillText(`feature map  ${s.outH}×${s.outW}`, fx, top - 22);
      ctx.fillStyle = C.muted;
      ctx.font = `10px ${env.font.mono}`;
      ctx.fillText(`⌊(${s.n}+2·${s.pad}−${s.k})/${s.stride}⌋+1 = ${s.outH}`, fx, top - 8);
      ctx.fillText(`${s.kname}  stride ${s.stride}  pad ${s.pad}`, gx, top - 8);

      // ---------- bottom panel: kernel ⊙ patch ------------------------------
      const py = H - bottomH - 4;
      ctx.fillStyle = C.surface;
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(12, py, W - 24, bottomH, 6);
      ctx.fill();
      ctx.stroke();

      const mini = 24;
      const drawMini = (ox, oy, get, title, colorFn) => {
        ctx.textAlign = "left";
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(title, ox, oy - 5);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        for (let u = 0; u < 3; u++) {
          for (let v = 0; v < 3; v++) {
            const x = ox + v * mini, y = oy + u * mini;
            const val = get(u, v);
            ctx.fillStyle = colorFn(u, v, val);
            ctx.fillRect(x, y, mini - 2, mini - 2);
            ctx.strokeStyle = C.grid;
            ctx.lineWidth = 1;
            ctx.strokeRect(x + 0.5, y + 0.5, mini - 3, mini - 3);
            ctx.fillStyle = C.text;
            ctx.font = `10px ${env.font.mono}`;
            ctx.fillText(val === null ? "·" : String(val), x + (mini - 2) / 2, y + (mini - 2) / 2);
          }
        }
      };

      const kx = 26, ky = py + 22;
      drawMini(kx, ky, (u, v) => s.kernel[u][v], `kernel${s.div !== 1 ? " / " + s.div : ""}`, (u, v, val) => {
        const active = s.terms && s.terms.length && s.terms[s.terms.length - 1].u === u && s.terms[s.terms.length - 1].v === v;
        if (active) return C.viz4;
        return mix(C.surface2, val >= 0 ? C.viz1 : C.viz2, Math.min(1, Math.abs(val) / 5) * 0.7);
      });

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = C.text2;
      ctx.font = `14px ${env.font.mono}`;
      ctx.fillText("⊙", kx + 3 * mini + 12, ky + mini * 1.5);

      const px2 = kx + 3 * mini + 28;
      drawMini(px2, ky, (u, v) => (s.patch ? s.patch[u][v].v : null), "patch", (u, v) => {
        if (!s.patch) return C.surface2;
        const active = s.terms && s.terms.length && s.terms[s.terms.length - 1].u === u && s.terms[s.terms.length - 1].v === v;
        if (active) return C.viz4;
        if (s.patch[u][v].oob) return C.surface2;
        return mix(C.surface2, C.text, s.patch[u][v].v / 9 * 0.55);
      });

      ctx.fillStyle = C.text2;
      ctx.font = `14px ${env.font.mono}`;
      ctx.fillText("=", px2 + 3 * mini + 12, ky + mini * 1.5);

      // running expression
      ctx.textAlign = "left";
      ctx.font = `11px ${env.font.mono}`;
      const ex = px2 + 3 * mini + 28;
      if (s.terms && s.terms.length) {
        let line = "";
        for (let i = 0; i < s.terms.length; i++) {
          const t = s.terms[i];
          line += (i ? " + " : "") + `${t.kw}·${t.px}`;
        }
        ctx.fillStyle = C.text;
        ctx.fillText(line.length > 60 ? line.slice(0, 60) + "…" : line, ex, ky + 14);
        ctx.fillStyle = C.viz4;
        ctx.font = `13px ${env.font.mono}`;
        ctx.fillText(`= ${s.acc}${s.div !== 1 ? ` / ${s.div}` : ""}`, ex, ky + 36);
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(`${s.terms.length} of 9 taps accumulated`, ex, ky + 54);
      } else if (s.value !== null && s.value !== undefined) {
        ctx.fillStyle = C.viz4;
        ctx.font = `15px ${env.font.mono}`;
        ctx.fillText(String(s.value), ex, ky + 22);
        ctx.fillStyle = C.muted;
        ctx.font = `10px ${env.font.base}`;
        ctx.fillText(`written to out[${s.cur ? s.cur.oi : 0},${s.cur ? s.cur.oj : 0}]`, ex, ky + 40);
      } else {
        ctx.fillStyle = C.muted;
        ctx.font = `11px ${env.font.base}`;
        ctx.fillText(`${s.k * s.k} weights are reused at all ${s.outH * s.outW} positions — that is weight sharing.`, ex, ky + 22);
        ctx.fillText(`Blue cells = positive response, orange = negative.`, ex, ky + 40);
      }
    }
  },

  drill: {
    cards: [
      { q: "Output size of a conv layer?", a: "`⌊(n + 2p − k)/s⌋ + 1` per spatial dimension. `k=3, p=1, s=1` preserves size; `s=2` halves it.", tags: ["shapes"] },
      { q: "Parameter count of a conv layer?", a: "`C_out · C_in · k · k + C_out`. It does **not** depend on the image height or width — that is the whole point of weight sharing.", tags: ["shapes"] },
      { q: "Convolution or cross-correlation?", a: "Frameworks implement cross-correlation (no kernel flip). Irrelevant for learned filters, but true convolution flips the kernel 180° first.", tags: ["pitfall"] },
      { q: "Why two 3×3 convs instead of one 5×5?", a: "Identical 5×5 receptive field, 18 vs 25 weights per channel pair, plus an extra non-linearity in between.", tags: ["architecture"] },
      { q: "What does a 1×1 conv do?", a: "A per-pixel linear map across channels — mixes channels, never space. Used for cheap channel expansion/reduction (bottlenecks).", tags: ["architecture"] },
      { q: "Equivariance vs invariance for CNNs?", a: "Convolution is translation **equivariant** (shift in → shift out). Invariance only comes from pooling or global average, which throws position away.", tags: ["theory"] },
      { q: "Receptive field recurrence?", a: "`r ← r + (k−1)·j` with `j ← j·s`, starting r=1, j=1. Strides multiply the jump, so they widen the receptive field fastest.", tags: ["theory"] },
      { q: "Why is depthwise separable convolution cheaper?", a: "It factors a `k×k×C_in×C_out` conv into a per-channel `k×k` spatial conv plus a `1×1` channel mix — roughly `1/C_out + 1/k²` of the cost (~8–9× cheaper for 3×3).", tags: ["efficiency"] }
    ],
    sixtySecond: [
      "Explain what convolution computes, give the output-size and parameter-count formulas, and say why weight sharing matters.",
      "Explain receptive fields: how they grow with depth and stride, and why VGG replaced 5×5 and 7×7 filters with stacks of 3×3."
    ]
  }
};
