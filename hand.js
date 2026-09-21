/* ============================================================
   Handwriting renderer.

   Lays text out from per-glyph pen strokes (fonts/mynerve-strokes.json —
   centrelines derived from the Mynerve outlines) and draws each stroke
   along its own path, so the pen travels the letter the way a hand does,
   rather than a glyph simply appearing.

   Handwriting.load(url)                -> Promise
   Handwriting.ready                    -> boolean
   Handwriting.write(host, chars, opts) -> Promise
     chars: [{ ch, bold }]   opts: { live: () => boolean }
   ============================================================ */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let data = null;
  let loading = null;

  // Pacing is budgeted per run, not fixed per pixel: cursive strokes are long
  // loops, so a fixed pen speed that suits a two-word intro takes a minute
  // over a sentence. The whole run is fitted into a time window and the pen
  // speed follows from that — a short line is written slowly and deliberately,
  // a long reply briskly, and neither drags.
  const MIN_TOTAL_MS = 1500;
  const MAX_TOTAL_MS = 5500;
  const SPEED_MIN = 700;       // px/s: never slower than this
  const MIN_STROKE_MS = 12;
  const GAP_STROKE = 18;       // pen lift within a letter
  const GAP_LETTER = 45;       // move to the next letter (joined letters: 0)
  const GAP_WORD = 110;        // move to the next word
  const GAP_PUNCT = 200;       // a hand pauses after a stop

  // A centreline has uniform width and no shaped terminals, so it reads
  // lighter than the typeface it was traced from even at the same nominal
  // width. Drawing a little heavier makes the settle imperceptible instead
  // of a visible jump in weight.
  const INK_WEIGHT = 1.22;

  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  // A skeleton simplified to a polyline has visible corners where the real
  // letterform curves. Catmull-Rom through the points, emitted as cubic
  // Béziers, restores the curve without inventing shape.
  function smoothPath(pts) {
    if (pts.length < 3) {
      return pts.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("");
    }
    const closed = Math.hypot(pts[0][0] - pts[pts.length - 1][0],
                              pts[0][1] - pts[pts.length - 1][1]) < 1e-6;
    const at = i => pts[closed
      ? (i + pts.length - 1) % (pts.length - 1)
      : Math.max(0, Math.min(pts.length - 1, i))];

    let d = `M${pts[0][0]} ${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }

  function load(url) {
    if (data) return Promise.resolve(data);
    // Cache the in-flight request: callers that arrive mid-load wait on the
    // same fetch rather than starting another.
    loading = loading || fetch(url).then(res => {
      if (!res.ok) throw new Error(`strokes: ${res.status}`);
      return res.json();
    }).then(json => (data = json));
    return loading;
  }

  // Give the strokes a moment to arrive before writing. Without this, text
  // written during load falls back to the plain renderer and — because each
  // line is only ever written once — stays that way for the page's life.
  function whenReady(ms = 2500) {
    if (data) return Promise.resolve(true);
    if (!loading) return Promise.resolve(false);
    return Promise.race([
      loading.then(() => true).catch(() => false),
      sleep(ms).then(() => !!data),
    ]);
  }

  /* ---------- layout ---------- */
  // Words wrap as units. Returns lines of [{ch, bold, x}] plus the line
  // width, in font units.
  function layout(chars, maxUnits) {
    const G = data.glyphs;
    const adv = ch => (G[ch] || G["?"] || { adv: 500 }).adv;

    // A newline is a word of its own: an answer that arrives as a few short
    // points should be written as a few short lines, not reflowed into one
    // paragraph the moment it fits.
    const BREAK = "\n";
    const words = [];
    let cur = [];
    for (const c of chars) {
      if (c.ch === "\n") { if (cur.length) words.push(cur); cur = []; words.push(BREAK); }
      else if (c.ch === " ") { if (cur.length) words.push(cur); cur = []; }
      else cur.push(c);
    }
    if (cur.length) words.push(cur);

    const lines = [];
    let line = [], x = 0;
    const space = adv(" ");

    for (const w of words) {
      if (w === BREAK) { lines.push(line); line = []; x = 0; continue; }
      const wUnits = w.reduce((s, c) => s + adv(c.ch), 0);
      if (line.length && x + space + wUnits > maxUnits) {
        lines.push(line); line = []; x = 0;
      }
      if (line.length) x += space;
      for (const c of w) { line.push({ ...c, x }); x += adv(c.ch); }
    }
    if (line.length) lines.push(line);
    return lines;
  }

  /* ---------- write ---------- */
  async function write(host, chars, opts = {}) {
    if (!data) throw new Error("Handwriting: not loaded");
    const live = opts.live || (() => true);
    const G = data.glyphs;

    let px = parseFloat(getComputedStyle(host).fontSize) || 32;
    const xh = data.xh || data.upm * 0.5;
    const width = host.clientWidth || 600;

    // Everything below is sized from the *body* of the letters, which the
    // x-height normalisation pins to 0.5em regardless of face. A cursive
    // font's hhea metrics are sized for its tallest flourish and would give
    // lines over twice the font size; ascender loops reach ~1.25em above the
    // baseline and descenders ~0.6em below, so 1.85em holds a line.
    // Normalise only a genuinely small body. A cursive face spends its em on
    // loops and needs scaling up to read at the same font-size; a print hand
    // like Mynerve already has a large x-height, and scaling it would render
    // ~18% wider than the same font used as a webfont — so the strokes would
    // no longer match the CSS fallback, or the rest of the page.
    const norm = xh < data.upm * 0.40 ? (0.42 * data.upm) / xh : 1;
    const metrics = fs => {
      const s = (fs / data.upm) * norm;                      // px per font unit
      return { s, lineH: fs * 1.55 * norm, asc: fs * 1.0 * norm };
    };

    // Fit to a height when asked: shrink until the text fits the pane, so a
    // long reply isn't written off the edge of a box that clips it.
    let { s, lineH, asc } = metrics(px);
    let lines = layout(chars, width / s);
    if (opts.maxHeight) {
      while (lines.length * lineH > opts.maxHeight && px > 14) {
        px = Math.round(px * 0.9);
        ({ s, lineH, asc } = metrics(px));
        lines = layout(chars, width / s);
      }
    }

    host.innerHTML = "";
    host.style.lineHeight = `${lineH}px`;    // so the settle below doesn't jump
    const height = lines.length * lineH;

    const svg = el("svg", {
      width, height, viewBox: `0 0 ${width} ${height}`,
      class: "hw-svg", "aria-hidden": "true",
    });
    svg.style.display = "block";
    svg.style.overflow = "visible";

    // All ink goes in one layer so the pencil grain is one filter pass per
    // frame. Filtering each path separately re-ran turbulence for every one
    // of them on every frame, and a long reply dropped to a few fps.
    const ink = el("g", { class: "hw-ink", filter: "url(#hw-pencil)" });
    svg.appendChild(ink);

    // Screen readers get the plain text, not the strokes
    const sr = document.createElement("span");
    sr.className = "bb-sr";
    sr.textContent = chars.map(c => c.ch).join("");
    host.append(sr, svg);

    // Build every path up front, hidden, so layout is settled before the
    // pen starts and getTotalLength() is trustworthy.
    const queue = [];    // {path, len, pen: (t) => [x, y], gapBefore}
    const strokeW = data.stroke;
    const joinable = ch => /[a-z]/.test(ch);   // lowercase letters join; capitals and marks stand alone

    // Where a hand enters and leaves a letter: the endpoints nearest the
    // baseline, not the geometric first and last. Taking the last stroke
    // literally anchors a join to the dot of an "i" or the top of an "l"
    // ascender, and the connector flies over the word.
    const band = (data.xh || data.upm * 0.5) * 0.75;
    const tipCache = new Map();
    const tips = ch => {
      if (tipCache.has(ch)) return tipCache.get(ch);
      const g = G[ch];
      // Every point, not just stroke ends: a closed letter like "o" is one
      // cycle whose ends are an arbitrary point on the ring, so endpoints
      // alone collapse its entry and exit onto the same spot.
      const pts = [];
      (g?.strokes || []).forEach(st => { for (const p of st) pts.push(p); });
      const low = pts.filter(p => p[1] <= band);   // ignore ascenders and dots
      const pool = low.length ? low : pts;
      const t = pool.length
        ? { in: pool.reduce((a, b) => (b[0] < a[0] ? b : a)),
            out: pool.reduce((a, b) => (b[0] > a[0] ? b : a)) }
        : null;
      tipCache.set(ch, t);
      return t;
    };

    lines.forEach((line, li) => {
      const baseY = li * lineH + asc;
      let prevExit = null;                     // [x, y] px where the last letter's pen finished
      line.forEach((c, ci) => {
        const g = G[c.ch] || G["?"];
        if (!g) return;
        const x0 = c.x * s;
        const grp = el("g", { transform: `translate(${x0} ${baseY}) scale(${s} ${-s})` });
        ink.appendChild(grp);

        const prev = ci > 0 ? line[ci - 1] : null;
        const sameWord = prev && (c.x - prev.x) <= ((G[prev.ch] || {}).adv || 0) + 1;
        const first = g.strokes[0];

        // Join: a curve from the previous exit to this entry, sagging toward
        // the baseline the way a joining stroke does when the pencil stays down
        const tip = tips(c.ch);
        const entry = tip ? [x0 + tip.in[0] * s, baseY - tip.in[1] * s] : null;
        const entryGap = prevExit && entry
          ? Math.hypot(entry[0] - prevExit[0], entry[1] - prevExit[1])
          : Infinity;
        // Only bridge a believable gap: if the two tips are far apart the pen
        // would really have lifted, and a long connector looks like a mistake.
        // Measured across ordinary pairs the gap runs ~0.2-0.9em (a tall exit
        // like "l" into a short entry is the wide end), so one em admits every
        // natural pair while still rejecting a reach across a whole letter.
        if (prevExit && sameWord && joinable(c.ch) && joinable(prev.ch) && entry
            && entryGap < px * 1.0) {
          const [ex, ey] = prevExit;
          const [nx, ny] = entry;
          const dx = nx - ex;
          // A light link, not a loop: the curve dips only slightly below the
          // two tips it connects. A deep sag to the baseline reads as full
          // copperplate cursive and costs legibility.
          const dip = Math.min(strokeW * s * 0.5, Math.abs(dx) * 0.16);
          const c1y = ey + dip, c2y = ny + dip;
          const d = `M${ex} ${ey}C${ex + dx * 0.35} ${c1y} ${nx - dx * 0.35} ${c2y} ${nx} ${ny}`;
          const join = el("path", {
            d, fill: "none", stroke: "currentColor", class: "hw-join",
            "stroke-width": strokeW * s * INK_WEIGHT * (c.bold ? 1.55 : 1),
            "stroke-linecap": "round", "stroke-linejoin": "round",
          });
          ink.appendChild(join);
          const len = join.getTotalLength();
          join.style.strokeDasharray = `${len}`;
          join.style.strokeDashoffset = `${len}`;
          join.style.visibility = "hidden";
          queue.push({
            path: join, len, gapBefore: 0, isJoin: true,
            pen: t => { const p = join.getPointAtLength(len * t); return [p.x, p.y]; },
          });
        }

        g.strokes.forEach((st, si) => {
          const d = smoothPath(st);
          const path = el("path", {
            d, fill: "none", stroke: "currentColor",
            "stroke-width": data.stroke * INK_WEIGHT * (c.bold ? 1.55 : 1),
            "stroke-linecap": "round", "stroke-linejoin": "round",
          });
          grp.appendChild(path);
          const len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
          path.style.strokeDashoffset = `${len}`;
          path.style.visibility = "hidden";

          let gapBefore = si ? GAP_STROKE : GAP_LETTER;
          if (si === 0 && prev) {
            if (!sameWord) gapBefore = GAP_WORD;
            if (/[.,;:!?]/.test(prev.ch)) gapBefore += GAP_PUNCT;
            // came in on a join: the pencil is already on the paper
            if (queue.length && queue[queue.length - 1].isJoin) gapBefore = 0;
          }
          if (si === 0 && ci === 0 && li > 0) gapBefore = GAP_WORD;

          queue.push({
            path, len,
            gapBefore,
            pen: t => {
              const p = path.getPointAtLength(len * t);
              return [x0 + p.x * s, baseY - p.y * s];
            },
          });
        });

        // Where this letter's pencil leaves off, for the next join
        prevExit = tip && joinable(c.ch)
          ? [x0 + tip.out[0] * s, baseY - tip.out[1] * s]
          : null;
      });
    });

    // Pencil: a faint graphite grain over the whole line. Kept subtle — a
    // child's pencil is uneven, not shattered.
    const defs = el("defs", {});
    defs.innerHTML =
      '<filter id="hw-pencil" x="-2%" y="-10%" width="104%" height="120%">' +
      '<feTurbulence type="fractalNoise" baseFrequency="1.6" numOctaves="2" seed="7" result="n"/>' +
      '<feDisplacementMap in="SourceGraphic" in2="n" scale="' + Math.max(0.8, px * 0.03) + '" xChannelSelector="R" yChannelSelector="G"/>' +
      "</filter>";
    svg.insertBefore(defs, svg.firstChild);

    if (REDUCED) {
      queue.forEach(q => { q.path.style.strokeDashoffset = "0"; q.path.style.visibility = ""; });
      return;
    }

    // The nib: the crosshair the showreel carries at the point of writing
    const nib = el("g", { class: "hw-nib", "aria-hidden": "true" });
    const r = Math.max(6, px * 0.22);
    nib.append(
      el("line", { x1: -r, y1: 0, x2: r, y2: 0 }),
      el("line", { x1: 0, y1: -r, x2: 0, y2: r }),
    );
    svg.appendChild(nib);
    const moveNib = ([x, y]) => nib.setAttribute("transform", `translate(${x} ${y})`);

    // Fit the run to its time budget: total drawn length (joins are already
    // in px; glyph strokes are in font units) plus the pauses between strokes.
    const totalPx = queue.reduce((sum, q) => sum + (q.isJoin ? q.len : q.len * s), 0);
    const rawGaps = queue.reduce((sum, q) => sum + q.gapBefore, 0);
    const budget = Math.min(MAX_TOTAL_MS, Math.max(MIN_TOTAL_MS, totalPx / SPEED_MIN * 1000 + rawGaps));
    // Pauses may take at most a third of the run; the pen gets the rest
    const gapScale = Math.min(1, (budget * 0.33) / Math.max(1, rawGaps));
    const gapsMs = rawGaps * gapScale;
    const speed = Math.max(SPEED_MIN, totalPx / Math.max(0.2, (budget - gapsMs) / 1000));

    // Lay the whole run out on a clock first: when each stroke starts and how
    // long it takes. The frame loop then just asks "where should the pen be
    // now?" and catches up. That way the writing finishes on time whether
    // the browser gives 60 frames a second or one — a per-stroke wait of two
    // frames each would take minutes on a throttled tab.
    let clock = 0;
    for (const q of queue) {
      const lenPx = q.isJoin ? q.len : q.len * s;
      q.start = clock + q.gapBefore * gapScale;
      q.dur = Math.max(MIN_STROKE_MS, (lenPx / speed) * 1000);
      clock = q.start + q.dur;
    }
    const total = clock;

    const ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    let cursor = 0;                          // first stroke not yet finished

    await new Promise(done => {
      const t0 = performance.now();
      (function frame(now) {
        if (!live()) return done();
        const t = now - t0;

        // Finish everything the clock has passed
        while (cursor < queue.length && t >= queue[cursor].start + queue[cursor].dur) {
          const q = queue[cursor++];
          q.path.style.visibility = "";
          q.path.style.strokeDashoffset = "0";
        }
        if (cursor >= queue.length) { moveNib(queue[queue.length - 1].pen(1)); return done(); }

        // Draw the one in progress; if we're still in its lead-in pause,
        // park the nib where it will begin
        const q = queue[cursor];
        if (t >= q.start) {
          q.path.style.visibility = "";
          const e = ease(Math.min(1, (t - q.start) / q.dur));
          q.path.style.strokeDashoffset = `${q.len * (1 - e)}`;
          moveNib(q.pen(e));
        } else {
          moveNib(q.pen(0));
        }
        requestAnimationFrame(frame);
      })(t0);
    });

    // Pen lifts once the line is finished
    nib.classList.add("is-done");
    await sleep(400);
    nib.remove();

    if (opts.settle === false || !live()) return;

    // The strokes are a centreline tracing: uniform width, no shaped
    // terminals, so they read lighter than the typeface they came from.
    // The writing is the point, not the resting state — so once the pen is
    // done, cross-fade to the real font. Layout matches to within a pixel
    // because the strokes use the same advance widths.
    const settled = document.createElement("span");
    settled.className = "hw-settled";
    settled.textContent = chars.map(c => c.ch).join("");
    settled.style.opacity = "0";

    // The settled text takes the flow and the strokes lift out of it, so the
    // two overlap during the cross-fade. Appending both in flow stacks them
    // and the line renders twice at double height.
    host.style.position = "relative";
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    host.appendChild(settled);

    // Emphasis survives the handover
    if (chars.some(c => c.bold)) {
      settled.textContent = "";
      let run = null, bold = null;
      for (const c of chars) {
        if (c.bold !== bold) {
          run = document.createElement(c.bold ? "strong" : "span");
          settled.appendChild(run);
          bold = c.bold;
        }
        run.append(c.ch);
      }
    }

    await new Promise(r => requestAnimationFrame(r));
    svg.style.transition = "opacity .28s linear";
    settled.style.transition = "opacity .28s linear";
    svg.style.opacity = "0";
    settled.style.opacity = "1";
    await sleep(300);

    // Always tidy up, even if this run was superseded mid-fade — otherwise
    // the strokes are left behind on top of the settled text.
    svg.remove();
    sr.remove();                       // the settled text is readable itself
    host.style.position = "";
  }

  window.Handwriting = {
    load,
    whenReady,
    write,
    get ready() { return !!data; },
  };
})();
