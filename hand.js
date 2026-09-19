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

  // Pen pace, in px of stroke per second at 1px = 1px; scaled by text size
  // so big text isn't written glacially and small text isn't a blur.
  const SPEED = 520;
  const MIN_STROKE_MS = 55;
  const GAP_STROKE = 40;       // pen lift within a letter
  const GAP_LETTER = 85;       // move to the next letter
  const GAP_WORD = 150;        // move to the next word
  const GAP_PUNCT = 220;       // a hand pauses after a stop

  const el = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function load(url) {
    if (data) return data;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`strokes: ${res.status}`);
    data = await res.json();
    return data;
  }

  /* ---------- layout ---------- */
  // Words wrap as units. Returns lines of [{ch, bold, x}] plus the line
  // width, in font units.
  function layout(chars, maxUnits) {
    const G = data.glyphs;
    const adv = ch => (G[ch] || G["?"] || { adv: 500 }).adv;

    const words = [];
    let cur = [];
    for (const c of chars) {
      if (c.ch === " ") { if (cur.length) words.push(cur); cur = []; }
      else cur.push(c);
    }
    if (cur.length) words.push(cur);

    const lines = [];
    let line = [], x = 0;
    const space = adv(" ");

    for (const w of words) {
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

    const px = parseFloat(getComputedStyle(host).fontSize) || 32;
    const s = px / data.upm;                 // px per font unit
    const lineH = px * 1.45;
    const asc = 780 * s;                     // baseline offset from line top

    host.innerHTML = "";
    const width = host.clientWidth || 600;
    const lines = layout(chars, width / s);
    const height = lines.length * lineH;

    const svg = el("svg", {
      width, height, viewBox: `0 0 ${width} ${height}`,
      class: "hw-svg", "aria-hidden": "true",
    });
    svg.style.display = "block";
    svg.style.overflow = "visible";

    // Screen readers get the plain text, not the strokes
    const sr = document.createElement("span");
    sr.className = "bb-sr";
    sr.textContent = chars.map(c => c.ch).join("");
    host.append(sr, svg);

    // Build every path up front, hidden, so layout is settled before the
    // pen starts and getTotalLength() is trustworthy.
    const queue = [];    // {path, len, pen: (t) => [x, y], gapBefore}
    lines.forEach((line, li) => {
      const baseY = li * lineH + asc;
      line.forEach((c, ci) => {
        const g = G[c.ch] || G["?"];
        if (!g) return;
        const x0 = c.x * s;
        const grp = el("g", { transform: `translate(${x0} ${baseY}) scale(${s} ${-s})` });
        svg.appendChild(grp);

        g.strokes.forEach((st, si) => {
          const d = st.map((p, i) => `${i ? "L" : "M"}${p[0]} ${p[1]}`).join("");
          const path = el("path", {
            d, fill: "none", stroke: "currentColor",
            "stroke-width": data.stroke * (c.bold ? 1.7 : 1),
            "stroke-linecap": "round", "stroke-linejoin": "round",
          });
          grp.appendChild(path);
          const len = path.getTotalLength();
          path.style.strokeDasharray = `${len}`;
          path.style.strokeDashoffset = `${len}`;

          let gapBefore = si ? GAP_STROKE : GAP_LETTER;
          if (si === 0 && ci > 0) {
            const prev = line[ci - 1];
            if (c.x - prev.x > (G[prev.ch] || {}).adv + 1) gapBefore = GAP_WORD;
            if (/[.,;:!?]/.test(prev.ch)) gapBefore += GAP_PUNCT;
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
      });
    });

    if (REDUCED) {
      queue.forEach(q => { q.path.style.strokeDashoffset = "0"; });
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

    for (const q of queue) {
      if (!live()) return;
      moveNib(q.pen(0));
      await sleep(q.gapBefore);
      if (!live()) return;

      // Stroke length in px on screen decides how long the pen takes
      const ms = Math.max(MIN_STROKE_MS, (q.len * s / SPEED) * 1000);
      await new Promise(done => {
        const t0 = performance.now();
        (function frame(now) {
          if (!live()) return done();
          const t = Math.min(1, (now - t0) / ms);
          // ease: a hand accelerates into a stroke and slows out of it
          const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          q.path.style.strokeDashoffset = `${q.len * (1 - e)}`;
          moveNib(q.pen(e));
          if (t < 1) requestAnimationFrame(frame); else done();
        })(t0);
      });
    }

    // Pen lifts once the line is finished
    nib.classList.add("is-done");
    await sleep(500);
    nib.remove();
  }

  window.Handwriting = {
    load,
    write,
    get ready() { return !!data; },
  };
})();
