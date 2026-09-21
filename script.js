/* ============================================================
   Behaviour: preloader, typographic split text, kinetic weight,
   custom cursor, marquee, parallax, magnetic links, reveals.
   ============================================================ */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;

/* ---------- Content you edit ---------- */
const CLIENTS = [
  "Product Design", "User Research", "UX Strategy", "Information Architecture",
  "Wireframing", "Prototyping", "Design Systems", "Usability Testing",
  "Accessibility",
];

const SERVICES = [
  { num: "001", title: "UX Design", lede: "Research-led flows.",
    desc: "Research-led user flows and information architecture that reduce friction and help people complete tasks with confidence." },
  { num: "002", title: "UI Design", lede: "Clarity and hierarchy.",
    desc: "Clear, high-fidelity interfaces with strong hierarchy, practical interaction patterns, and visual polish." },
  { num: "003", title: "Prototyping", lede: "Test ideas early.",
    desc: "Clickable prototypes that help teams test ideas early, communicate behaviour, and make decisions faster." },
  { num: "004", title: "Design Systems", lede: "Consistency that scales.",
    desc: "Reusable components and design foundations that create consistency across product teams and platforms." },
];

const WORK = [
  {
    title: "Insure-Tech",
    tags: "B2B InsurTech, AI Workflow, Enterprise UX",
    tone: "",
    // A 4:3 plate, matching the card's own ratio. The wide 1600x829 artwork is
    // still the source, but cover-fitting it into a 4:3 card cropped a third
    // of the width away — the phone and the laptop's right edge went with it.
    thumb: "media/insure-tech-card.webp",
    // The written case study, on its own page, in the portfolio's own design.
    // It opens with buttons through to the prototype and the design system —
    // the embed used to carry those as tabs, which meant the modal showed a
    // tool before it had said what the tool was for.
    live: "insure-tech-case-study.html",
    blurb: "Redesigning an AI-powered insurance Product Plan Builder \u2014 compressing " +
           "3\u20135 days of manual configuration into hours of intelligent, trustworthy review.",
    // The case study is told here rather than embedded: the source site is a
    // single-page app whose window chrome and tab bar would come with it.
    study: {
      hero: "media/insure-tech-devices.webp",
      outcomes: [
        { before: "3\u20135 days", after: "Hours of review", label: "Time to configure a product" },
        { before: "4 error surfaces", after: "1 unified Auditor", label: "Where validation lives" },
        { before: "37 flat items", after: "8 semantic groups", label: "Coverage navigation" },
        { before: "No source link", after: "Click-to-source", label: "From a value back to the BRD" },
      ],
      principles: [
        { title: "Confidence-Coded Fields",
          body: "Low-confidence values carry amber borders and a 75% badge \u2014 risk is visible inline during editing, not at final review." },
        { title: "Inspect \u2192 Live Source Split",
          body: "Confidence badges open a Document Inspector pinned to canvas, scrolled to the exact BRD passage with the figure highlighted." },
        { title: "One Multi-Tab Workspace",
          body: "Tree, Extraction, Issues and Docs live in a single right-hand panel \u2014 structure, audit, issues and source one click apart." },
        { title: "Staged Navigation with Sub-Steps",
          body: "The left rail maps the five stages; the active stage expands to show its own sub-step progress." },
      ],
      personas: [
        { role: "Product Manager / Head of Product", motive: "Speed-to-market & compliance",
          pain: "Blockers surface only at final pre-publish \u2014 hours of rework." },
        { role: "Senior Actuarial Analyst", motive: "Precision & underwriting safety",
          pain: "Source attribution is passive \u2014 no live link from a field back to its page." },
      ],
      // The audit that set the brief: eight frictions found in the existing
      // builder, each with the change that retired it.
      frictions: [
        { flaw: "Attention Fragmentation",
          impact: "Errors and confidence scores live in 4 places \u2014 panic and skipped steps.",
          fix: "A dedicated Issues tab with one-click Resolve; the stepper carries a live \u2018Needs Attention\u2019 count." },
        { flaw: "Passive Source Attribution",
          impact: "\u2018From: BRD\u2019 is a text tag \u2014 users hunt through 5 PDFs manually.",
          fix: "Every value cites its origin (BRD Pg 2, Sec 4.1); the Document Inspector opens that passage highlighted." },
        { flaw: "Flat Coverage Scroll",
          impact: "37 coverages in one flat list means endless vertical scrolling.",
          fix: "Coverages live under collapsible plan accordions \u2014 Mini, Medi, Max." },
        { flaw: "Post-Hoc Shock",
          impact: "Critical errors surface only at the final pre-publish step.",
          fix: "Field-level amber and red borders surface weak values inline while editing." },
      ],
      designs: [
        { img: "media/insure-tech/06-heor.webp", label: "Unified Workspace",
          title: "The product builder\u2019s home screen.",
          summary: "Every signal needed to start verifying \u2014 extraction health, source documents, plan structure and open issues \u2014 consolidated into one view without hunting across tabs.",
          features: [
            "89% extraction-health donut: 124 High \u00b7 40 Medium \u00b7 15 Low",
            "Field Map heatmap colours all 234 extracted fields by AI confidence",
            "Source pills jump straight to the active document",
            "Right rail unifies Tree \u00b7 Issues \u00b7 Data \u00b7 Document in one panel",
          ] },
        { img: "media/insure-tech/05-tree-drawer.webp", label: "Tree + Parameter Drawer",
          title: "Inspect any card without losing the map.",
          summary: "Clicking a card on the Tree opens the Parameter Drawer on the right edge \u2014 the full canvas stays visible, so dependencies and sibling values remain legible.",
          features: [
            "Extracted value and your value side by side, with a confidence label",
            "Source passage shows the highlighted BRD quote, linked both ways",
            "Dependencies panel lists the upstream rules",
            "\u2190 / \u2192 walks sibling parameters; Esc closes",
          ] },
        { img: "media/insure-tech/03-parameter.webp", label: "Parameter Editor",
          title: "The trust loop, expanded.",
          summary: "A single parameter opens into a focused editor, with the drawer pinning the AI\u2019s source passage right next to the form.",
          features: [
            "Structured form: name, type, description, range, limit, applicability",
            "One click to accept the extracted value or override it",
            "Confidence inline \u2014 high in green, low in amber",
            "AI assist: @-mention a colleague, ask, or leave a comment",
          ] },
        { img: "media/insure-tech/01-workspace.webp", label: "Tree Mode",
          title: "The whole plan as a single canvas.",
          summary: "A full-screen anatomy view \u2014 every parameter a card, grouped by category, connected by dependency edges. Switch tier with one click; the issue count follows you.",
          features: [
            "Mini Plan root branches into four category columns",
            "Each card carries a status: verified, missing, low confidence, blocker",
            "Per-card AI confidence, dependency count and source page",
            "\u2318K jumps to any field; the legend explains the four states",
          ] },
        { img: "media/insure-tech/02-drilldown.webp", label: "Coverage Drill-Down",
          title: "From workspace to category in one click.",
          summary: "Selecting a category morphs the left rail into a categories list with progress per group, while the workspace shows each parameter three-up across Mini, Medi and Max.",
          features: [
            "33 categories with status dots and progress bars",
            "Plan variants stay pinned, so tier context never drops",
            "Values inline across tiers, with a confidence dot for each",
            "A \u2018needs review\u2019 chip flags what to attend to first",
          ] },
      ],
      reflections: [
        { label: "What\u2019s next", body: "Empirical confidence calibration \u2014 wire the amber thresholds to real AI accuracy data from production." },
        { label: "Would change", body: "The eight-section accordion could collapse to a sticky jump-to chip row on long pages." },
        { label: "Open question", body: "How should the system handle a value the user accepts that AI later refines \u2014 versioning or override?" },
      ],
    },
  },
  { title: "Oykot Money", tags: "Personal finance, 50/30/20 budgeting",
    tone: "alt",
    // The written case study, on its own page. It loads in the modal the same
    // way the Insure-Tech one does: the panel is the case study.
    live: "oykot-case-study.html",
    // Same 4:3 treatment as the Insure-Tech card: the poster inset on its own
    // ground, so the wordmark and the hands survive the card's scale-in.
    thumb: "media/oykot-money-card.webp" },
  { title: "Project 03", tags: "Prototyping",       tone: "cool" },
  { title: "Project 04", tags: "Interface systems", tone: "warm" },
];

/* The drawing screen's own shelf: sketchbook pages, lettering, whatever else
   gets made away from a brief. Add `img: "media/doodles/x.webp"` to a card and
   it shows the picture instead of the tinted plate — nothing else to change.
   `ratio` is any of the .frame ratio classes, so the shelf can hold a portrait
   sketchbook page next to a square study without cropping either. */
const DOODLES = [
  { title: "Sketchbook",     note: "Pages from this year",      tone: "warm", ratio: "ratio-34" },
  { title: "Lettering",      note: "The hand this site is set in", tone: "alt",  ratio: "ratio-11" },
  { title: "Character study", note: "Adi, in many moods",       tone: "cool", ratio: "ratio-11" },
  { title: "Daily doodles",  note: "Ten minutes, most mornings", tone: "warm", ratio: "ratio-34" },
];

/* ============================================================
   1. RENDER CONTENT
   ============================================================ */
const marqueeEl = document.getElementById("marquee");
if (marqueeEl) {
  const row = CLIENTS.map(c => `<span class="marquee-item">${c}</span>`).join("");
  marqueeEl.innerHTML = row + row; // duplicated for a seamless -50% loop
}

/* The marks, traced from the reference recording frame by frame: rings
   contracting inward, two cubes turning against each other, modules moving
   between two arrangements, and a form extruding up and settling back. The
   motion lives in the CSS; this is only the drawing. */
const SERVICE_ICONS = {
  // Rings born at the rim, each contracting to the centre and fading, one
  // launched every third of the cycle so three are always in flight.
  "UX Design": `
    <svg class="svc-icon svc-rings" viewBox="0 0 64 64" aria-hidden="true">
      <circle class="r1" cx="32" cy="32" r="21" />
      <circle class="r2" cx="32" cy="32" r="21" />
      <circle class="r3" cx="32" cy="32" r="21" />
    </svg>`,
  // Two cubes on one axis, turning opposite ways, meeting square every few
  // seconds before drifting apart again.
  "UI Design": `
    <svg class="svc-icon svc-cubes" viewBox="0 0 64 64" aria-hidden="true">
      <g class="outer">
        <path d="M32 12 49.3 22 49.3 42 32 52 14.7 42 14.7 22 Z" />
        <path d="M32 32 32 12 M32 32 14.7 42 M32 32 49.3 42" />
      </g>
      <g class="inner">
        <path d="M32 22 41.5 27.5 41.5 38.5 32 44 22.5 38.5 22.5 27.5 Z" />
        <path d="M32 33 32 22 M32 33 22.5 38.5 M32 33 41.5 38.5" />
      </g>
    </svg>`,
  // A form built up and let down again: the top face rises while its walls
  // grow under it, so the solid stays a solid the whole way.
  "Prototyping": `
    <svg class="svc-icon svc-extrude" viewBox="0 0 64 64" aria-hidden="true">
      <path class="base" d="M32 30 58 46.5 49.3 52 32 41 13 52 4.3 46.5 Z" />
      <g class="risers">
        <line x1="32" y1="30" x2="32" y2="16" />
        <line x1="58" y1="46.5" x2="58" y2="32.5" />
        <line x1="49.3" y1="52" x2="49.3" y2="38" />
        <line x1="32" y1="41" x2="32" y2="27" />
        <line x1="13" y1="52" x2="13" y2="38" />
        <line x1="4.3" y1="46.5" x2="4.3" y2="32.5" />
      </g>
      <path class="top" d="M32 30 58 46.5 49.3 52 32 41 13 52 4.3 46.5 Z" />
    </svg>`,
  // Five modules that slide and resize between two arrangements, each on its
  // own beat, so the middle of the move is a scatter rather than a shuffle.
  "Design Systems": `
    <svg class="svc-icon svc-modules" viewBox="0 0 64 64" aria-hidden="true">
      <rect class="m1" x="8"  y="10" width="24" height="12" rx="1.5" />
      <rect class="m2" x="36" y="10" width="20" height="12" rx="1.5" />
      <rect class="m3" x="8"  y="26" width="16" height="12" rx="1.5" />
      <rect class="m4" x="28" y="26" width="28" height="12" rx="1.5" />
      <rect class="m5" x="8"  y="42" width="30" height="12" rx="1.5" />
    </svg>`,
};

const servicesEl = document.getElementById("services");
if (servicesEl) {
  servicesEl.innerHTML = SERVICES.map((s, i) => `
    <article class="service reveal" style="--d:${i * 80}ms">
      <span class="num">${s.num}</span>
      <div class="service-mark">${SERVICE_ICONS[s.title] || ""}</div>
      <div class="service-body">
        <h3>${s.title}</h3>
        <p class="lede">${s.lede}</p>
        <p class="desc">${s.desc}</p>
      </div>
    </article>
  `).join("");
}

// A project card, used both by the featured pair in the hero and by the work
// grid. Cards with a live project carry data-project, which the portal picks
// up; the rest stay inert until they have somewhere to go.
function projectCard(w, i, { ratio = "ratio-107", parallax = 0, index = false } = {}) {
  return `
    <a class="work-card" href="${w.href}" data-cursor="View"
       ${w.thumb ? `data-project="${i}"` : ""}>
      ${index ? `<span class="work-index">Project ${i + 1}</span>` : ""}
      <figure class="frame ${ratio}" data-parallax="${parallax}">
        ${w.thumb
          ? `<img class="work-thumb" src="${w.thumb}" alt="${w.title}" loading="lazy" />`
          : `<div class="ph ${w.tone}">${w.title}</div>`}
      </figure>
      <div class="work-meta reveal" style="--d:${i * 60}ms">
        <span class="work-title">${w.title}</span>
        <span class="work-tags">${w.tags}</span>
      </div>
    </a>`;
}

const heroProjects = document.getElementById("hero-projects");
if (heroProjects) {
  heroProjects.innerHTML = WORK.slice(0, 2)
    .map((w, i) => projectCard(w, i, { ratio: "ratio-43", parallax: i ? 40 : -40, index: true }))
    .join("");
}

const doodleGrid = document.getElementById("doodle-grid");
if (doodleGrid) {
  doodleGrid.innerHTML = DOODLES.map((d, i) => `
    <figure class="doodle reveal" style="--d:${i * 70}ms">
      <div class="frame ${d.ratio || "ratio-11"}">
        ${d.img
          ? `<img class="doodle-img" src="${d.img}" alt="${d.title}" loading="lazy" />`
          : `<div class="ph ${d.tone || ""}">${d.title}</div>`}
      </div>
      <figcaption class="doodle-cap">
        <span class="doodle-title hand">${d.title}</span>
        <span class="doodle-note">${d.note || ""}</span>
      </figcaption>
    </figure>`).join("");
}

const workGrid = document.getElementById("work-grid");
if (workGrid) {
  workGrid.innerHTML = WORK
    .map((w, i) => projectCard(w, i, { parallax: i % 2 ? 22 : -22 }))
    .join("");
}

/* ============================================================
   PROJECT PORTAL
   A project with a live URL opens in a modal rather than
   navigating away: the case study runs in place, in an iframe,
   and the visitor keeps their position on the page.
   ============================================================ */
function initProjectPortal() {
  const portal = document.getElementById("portal");
  if (!portal) return;

  const frameBox = portal.querySelector(".portal-frame");
  const studyBox = portal.querySelector(".portal-study");
  const body = portal.querySelector(".portal-body");
  const titleEl = portal.querySelector(".portal-title");
  const tagsEl = portal.querySelector(".portal-tags");
  const blurbEl = portal.querySelector(".portal-blurb");
  let lastFocus = null;

  // The case study, in this site's own type and spacing.
  function caseStudyHTML(p) {
    const st = p.study;
    const esc = t => String(t).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

    const outcomes = st.outcomes.map(o => `
      <li class="cs-outcome">
        <span class="cs-before">${esc(o.before)}</span>
        <span class="cs-arrow" aria-hidden="true">\u2192</span>
        <span class="cs-after">${esc(o.after)}</span>
        <span class="cs-label">${esc(o.label)}</span>
      </li>`).join("");

    const principles = st.principles.map((x, i) => `
      <li class="cs-card">
        <span class="cs-num">0${i + 1}</span>
        <h4>${esc(x.title)}</h4>
        <p>${esc(x.body)}</p>
      </li>`).join("");

    const personas = st.personas.map(x => `
      <li class="cs-card">
        <h4>${esc(x.role)}</h4>
        <p class="cs-motive">${esc(x.motive)}</p>
        <p>${esc(x.pain)}</p>
      </li>`).join("");

    const frictions = st.frictions.map((f, i) => `
      <li class="cs-friction">
        <span class="cs-num">0${i + 1}</span>
        <div>
          <h4>${esc(f.flaw)}</h4>
          <p class="cs-impact">${esc(f.impact)}</p>
          <p class="cs-fix">${esc(f.fix)}</p>
        </div>
      </li>`).join("");

    // Each screen gets its image at full width, then what it does beside the
    // features it introduced — the reason the screen exists, not just a shot.
    const designs = st.designs.map((d, i) => `
      <figure class="cs-design">
        <img src="${d.img}" alt="${esc(d.title)}" loading="lazy" decoding="async" />
        <figcaption>
          <div>
            <p class="cs-kicker">0${i + 1} \u2014 ${esc(d.label)}</p>
            <h4>${esc(d.title)}</h4>
            <p>${esc(d.summary)}</p>
          </div>
          <ul class="cs-features">
            ${d.features.map(f => `<li>${esc(f)}</li>`).join("")}
          </ul>
        </figcaption>
      </figure>`).join("");

    const reflections = st.reflections.map(r => `
      <li class="cs-card">
        <p class="cs-motive">${esc(r.label)}</p>
        <p>${esc(r.body)}</p>
      </li>`).join("");

    return `
      <article class="cs">
        ${st.hero ? `<img class="cs-hero" src="${st.hero}" alt="${esc(p.title)} across devices" loading="lazy" />` : ""}

        <section class="cs-section">
          <h3 class="cs-h">What changed</h3>
          <ul class="cs-outcomes">${outcomes}</ul>
        </section>

        <section class="cs-section">
          <h3 class="cs-h">Design principles</h3>
          <ul class="cs-grid">${principles}</ul>
        </section>

        <section class="cs-section">
          <h3 class="cs-h">Who it is for</h3>
          <ul class="cs-grid">${personas}</ul>
        </section>

        <section class="cs-section">
          <h3 class="cs-h">What the audit found</h3>
          <ol class="cs-frictions">${frictions}</ol>
        </section>

        <section class="cs-section">
          <h3 class="cs-h">The high-fidelity designs</h3>
          <p class="cs-lede">Five core surfaces across the unified workspace. Each one traces
            back to a specific friction retired by the audit \u2014 extraction trust, source
            attribution, drill-down navigation and dependency visibility.</p>
          ${designs}
        </section>

        <section class="cs-section">
          <h3 class="cs-h">Reflections</h3>
          <ul class="cs-grid cs-grid-3">${reflections}</ul>
        </section>
      </article>`;
  }

  function open(project) {
    lastFocus = document.activeElement;
    titleEl.textContent = project.title;
    tagsEl.textContent = project.tags;
    blurbEl.textContent = project.blurb || "";

    // The product runs here, live. Built on open rather than at page load:
    // it is a whole second application, and nobody should pay to download it
    // until they ask to see it. Closing tears it down again.
    frameBox.innerHTML = project.live
      ? `<iframe class="portal-iframe" src="${project.live}" title="${project.title}"` +
        ` loading="lazy" referrerpolicy="no-referrer"` +
        ` sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>`
      : "";


    // When the product itself runs here, it IS the case study — the written
    // one underneath was the same argument told twice, and it pushed the
    // running app into a letterbox at the top of a long scroll. So the embed
    // takes the whole panel, and the written version is kept for projects
    // that have nothing to run.
    studyBox.innerHTML = !project.live && project.study ? caseStudyHTML(project) : "";
    body.classList.toggle("is-embed", !!project.live);
    body.scrollTop = 0;

    portal.hidden = false;
    requestAnimationFrame(() => portal.classList.add("is-on"));
    document.body.style.overflow = "hidden";
    portal.querySelector(".portal-close").focus();
  }

  function close() {
    portal.classList.remove("is-on");
    document.body.style.overflow = "";
    setTimeout(() => {
      portal.hidden = true;
      frameBox.innerHTML = "";          // stop the embedded product running
      studyBox.innerHTML = "";
    }, 260);
    lastFocus?.focus();
  }

  document.addEventListener("click", e => {
    const card = e.target.closest("[data-project]");
    if (!card) return;
    e.preventDefault();
    open(WORK[+card.dataset.project]);
  });

  portal.addEventListener("click", e => {
    if (e.target.closest(".portal-close") || e.target === portal ||
        e.target.classList.contains("portal-backdrop")) return close();

  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && !portal.hidden) close();
  });
}

/* ============================================================
   2. SPLIT TEXT
   Chars are wrapped per-word so each word acts as its own mask.
   The original text is preserved as an aria-label so screen
   readers still read a normal sentence.
   ============================================================ */
const EM_TAGS = ["strong", "b", "em", "i"];

function splitChars(el) {
  el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
  const words = [];
  // Track whether whitespace preceded each word, in document order, so the
  // text can be reassembled later without inventing spaces (e.g. the comma
  // after "</strong>," must stay flush against the previous word).
  let lastWasSpace = true;

  (function walk(node, emTag) {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        /* ASCII whitespace only, so a non-breaking space in the source binds
           the words either side of it into one unbreakable span — which is
           the only way to control where a headline wraps once every word is
           its own element. */
        const parts = child.textContent.split(/([ \t\n\r\f]+)/).filter(Boolean);
        const frag = document.createDocumentFragment();
        parts.forEach(part => {
          if (/^\s+$/.test(part)) {
            lastWasSpace = true;
            frag.appendChild(document.createTextNode(" "));
            return;
          }
          const word = document.createElement("span");
          word.className = "word";
          word.dataset.sp = lastWasSpace ? "1" : "0";
          if (emTag) word.dataset.em = emTag;
          lastWasSpace = false;
          [...part].forEach(ch => {
            const c = document.createElement("span");
            c.className = "char";
            c.textContent = ch;
            word.appendChild(c);
          });
          words.push(word);
          frag.appendChild(word);
        });
        node.replaceChild(frag, child);
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();
        walk(child, EM_TAGS.includes(tag) ? tag : emTag);
      }
    });
  })(el, null);

  // Stagger across every char in reading order
  let i = 0;
  el.querySelectorAll(".char").forEach(c => {
    c.style.setProperty("--d", `${i * 22}ms`);
    i++;
  });

  el.setAttribute("aria-hidden-children", "true");
  el.querySelectorAll(".word").forEach(w => w.setAttribute("aria-hidden", "true"));
  return words;
}

/* Line-masked reveal for paragraphs: measure wrapped lines, then wrap them. */
const escapeHTML = s => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

function splitLines(el) {
  // Keep the source markup: the split bakes today's line breaks into <span>s,
  // and the only way to re-flow for a different width is to start over from
  // the original.
  if (el.dataset.source === undefined) el.dataset.source = el.innerHTML;
  const label = el.textContent.replace(/\s+/g, " ").trim();
  const words = splitChars(el);
  if (!words.length) return;

  // Group words by their vertical offset = visual line
  const lines = [];
  let currentTop = null, bucket = null;
  words.forEach(w => {
    const top = Math.round(w.offsetTop);
    if (top !== currentTop) { currentTop = top; bucket = []; lines.push(bucket); }
    bucket.push(w);
  });

  // Rebuild as .line > .line-inner containing the plain text of each line
  if (!lines.length) return;

  el.innerHTML = "";
  lines.forEach((lineWords, idx) => {
    // Reassemble using the recorded spacing + emphasis, so punctuation stays
    // attached and <strong>/<em> survive the rebuild.
    const html = lineWords.map((w, i) => {
      const sep = i > 0 && w.dataset.sp === "1" ? " " : "";
      const text = escapeHTML(w.textContent);
      const tag = w.dataset.em;
      return sep + (tag ? `<${tag}>${text}</${tag}>` : text);
    }).join("");

    const line = document.createElement("span");
    line.className = "line";
    const inner = document.createElement("span");
    inner.className = "line-inner";
    inner.style.setProperty("--d", `${idx * 90}ms`);
    inner.innerHTML = html;
    line.appendChild(inner);
    el.appendChild(line);
  });
  el.setAttribute("aria-label", label);
}

/* ============================================================
   2b. TYPEWRITER
   Chars are already laid out (from splitChars) and hidden with
   `visibility`, so revealing them one by one never re-wraps the
   line. The caret is moved after whichever char was just typed.
   ============================================================ */
let typewriteToken = 0;

/* Rewind an element so typewrite() can run on it again. */
function resetTypewriter(el) {
  typewriteToken++;                                   // cancel any live run
  el.classList.remove("is-typing", "is-revealed", "is-in");
  el.querySelectorAll(".char").forEach(c => c.classList.remove("is-typed"));
  el.querySelectorAll(".caret").forEach(c => c.remove());
}

/* onTyped fires the moment the last character lands, which is not the same as
   the promise: that waits out the caret's closing blink as well. Anything that
   should follow the sentence — the paragraph under the headline — wants the
   former, or it sits dark for another second and a half. */
function typewrite(el, { speed = 38, jitter = 26, onTyped } = {}) {
  const chars = [...el.querySelectorAll(".char")];
  if (!chars.length) { onTyped?.(); return Promise.resolve(); }

  if (REDUCED) {
    el.classList.add("is-revealed", "is-in");
    onTyped?.();
    return Promise.resolve();
  }

  // Clear whatever a previous run left behind. A cancelled run returns
  // without tidying up, so without this its caret is orphaned mid-word
  // and its is-typed chars bleed into this run's progression.
  resetTypewriter(el);

  // Every scheduled step checks this token, so toggling away mid-word
  // stops the chain instead of leaving it writing into a hidden element.
  const mine = ++typewriteToken;

  return new Promise(resolve => {
    el.classList.add("is-typing");

    const caret = document.createElement("span");
    caret.className = "caret is-active";
    caret.setAttribute("aria-hidden", "true");
    chars[0].before(caret);

    let i = 0;
    (function next() {
      if (mine !== typewriteToken) return;
      if (i >= chars.length) {
        onTyped?.();
        caret.classList.remove("is-active");   // start blinking
        setTimeout(() => {
          if (mine !== typewriteToken) return;
          caret.remove();
          el.classList.remove("is-typing");
          el.classList.add("is-revealed", "is-in");
          resolve();
        }, 1500);
        return;
      }

      const ch = chars[i];
      const prev = chars[i - 1];
      ch.classList.add("is-typed");
      ch.after(caret);
      i++;

      let delay = speed + Math.random() * jitter;
      if (prev && prev.parentElement !== ch.parentElement) delay += 90;  // word gap
      if (/[.,]/.test(ch.textContent)) delay += 280;                     // punctuation beat

      setTimeout(next, delay);
    })();
  });
}

/* ============================================================
   3. KINETIC WEIGHT — chars thicken near the cursor
   ============================================================ */
function initKinetic(el) {
  if (REDUCED || !FINE_POINTER) return;
  const chars = [...el.querySelectorAll(".char")];
  if (!chars.length) return;

  let raf = null, mx = -9999, my = -9999;
  const RADIUS = 220, MIN_W = 250, MAX_W = 800;

  // Cache each char's centre: measuring 60 boxes on every frame of a pointer
  // move is the expensive part, and they only shift when the text rewraps.
  let centres = [];
  const measure = () => {
    centres = chars.map(c => {
      const r = c.getBoundingClientRect();
      return [r.left + r.width / 2 + scrollX, r.top + r.height / 2 + scrollY];
    });
  };
  measure();
  addEventListener("resize", measure, { passive: true });

  function update() {
    raf = null;
    for (let i = 0; i < chars.length; i++) {
      const [cx, cy] = centres[i];
      const t = Math.max(0, 1 - Math.hypot(mx - cx, my - cy) / RADIUS);
      chars[i].style.setProperty("--w", Math.round(MIN_W + t * t * (MAX_W - MIN_W)));
    }
  }

  // Tracked on the window, not the heading: bound to the element the weight
  // only answers once the pointer is already on a glyph, and snaps back the
  // moment it leaves. Following the pointer everywhere lets the letters
  // thicken as it approaches and thin out as it goes.
  addEventListener("pointermove", e => {
    mx = e.pageX; my = e.pageY;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });

  addEventListener("scroll", () => {
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });
}

/* ============================================================
   4. REVEAL OBSERVERS
   ============================================================ */
const revealIO = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add("is-in", "is-revealed");
    revealIO.unobserve(entry.target);
  });
}, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

const REVEAL_SELECTOR =
  ".reveal, .frame, .eyebrow, [data-split]:not([data-typewriter]), " +
  "[data-split-lines]:not(.hero-sub), .info-grid, .explore-grid";

function observeAll() {
  // [data-typewriter] is driven by typewrite() after the preloader, not by
  // scroll — and nor is .hero-sub, which waits for that typing to finish.
  // Left in the observer it revealed itself the moment it intersected, which
  // is immediately: it is in view at the top of the page.
  document.querySelectorAll(REVEAL_SELECTOR).forEach(el => revealIO.observe(el));
}

// A safety net for the observer.
//
// The project thumbnails in #work-grid never revealed: their .frame starts
// clipped to nothing and only opens on .is-in, so all four cards showed a
// caption over empty space while the images themselves had loaded fine. The
// observer fires for whatever is on screen when it starts — the hero cards —
// and then this page's scrolling, which runs on a scroll container rather
// than the document, does not reliably deliver later entries. Rather than
// depend on that, sweep on scroll: anything in view is revealed, the sweep
// costs one rect per unrevealed element, and it stops running once the page
// is fully revealed.
function revealSweep() {
  const left = [...document.querySelectorAll(REVEAL_SELECTOR)].filter(
    el => !el.classList.contains("is-in")
  );
  left.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < innerHeight * 0.92 && r.bottom > 0) {
      el.classList.add("is-in", "is-revealed");
      revealIO.unobserve(el);
    }
  });
  return left.length;
}

function watchReveals() {
  let raf = null;
  const tick = () => {
    raf = null;
    if (revealSweep() === 0) {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
    }
  };
  const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });
  tick();
}

/* ============================================================
   5. PARALLAX
   ============================================================ */
const parallaxEls = [];
function collectParallax() {
  parallaxEls.length = 0;
  document.querySelectorAll("[data-parallax]").forEach(el => {
    parallaxEls.push({ el, amount: parseFloat(el.dataset.parallax) || 0 });
  });
}
let parallaxRaf = null;
function runParallax() {
  parallaxRaf = null;
  const vh = innerHeight;
  parallaxEls.forEach(({ el, amount }) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -200 || r.top > vh + 200) return;
    const progress = (r.top + r.height / 2 - vh / 2) / vh; // -1 … 1
    const inner = el.firstElementChild;
    if (inner) inner.style.translate = `0 ${(progress * amount).toFixed(2)}px`;
  });
}

/* ============================================================
   6. MARQUEE (scroll-reactive, JS-driven)
   ============================================================ */
function initMarquee() {
  const track = document.getElementById("marquee");
  if (!track || REDUCED) return;
  let offset = 0, last = performance.now(), boost = 0;
  const BASE = 40; // px per second

  const marquee = track.parentElement;
  let paused = false;
  marquee.addEventListener("mouseenter", () => paused = true);
  marquee.addEventListener("mouseleave", () => paused = false);

  addEventListener("wheel", e => {
    boost = Math.min(320, Math.abs(e.deltaY) * 2);
  }, { passive: true });

  (function step(now) {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    boost *= 0.92;
    if (!paused) offset += (BASE + boost) * dt;
    const half = track.scrollWidth / 2;
    if (half > 0 && offset >= half) offset -= half;
    track.style.transform = `translateX(${-offset}px)`;
    requestAnimationFrame(step);
  })(performance.now());
}

/* ============================================================
   6b. PINNED SCROLL SECTION
   The section is taller than the viewport and contains a sticky
   panel. Scroll progress through the section drives the list
   offset and which step/visual is active — the page stays put
   while the text moves.
   ============================================================ */
/* How fast the toolkit clips run against the speed they were recorded at. */
const CLIP_RATE = 0.5;

const SCROLLY_CAPTIONS = [
  "Where the design work happens \u2014 interfaces, components, variants and prototypes, and the file the team actually builds from.",
  "Writing and refactoring code alongside the design, so a prototype can become something real without a handoff gap.",
  "Image work \u2014 retouching, composites and the texture and treatment behind the visuals, before they go back into the design file.",
  "Thinking partner and pair \u2014 auditing flows, pressure-testing copy, and building working prototypes to try an idea before committing to it.",
  "Quick synthesis \u2014 turning research notes and messy input into structure I can design against.",
];

function initScrolly() {
  const section = document.getElementById("scrolly");
  const list = document.getElementById("scrolly-list");
  const caption = document.getElementById("scrolly-caption");
  const bar = document.getElementById("scrolly-bar");
  const visual = document.getElementById("scrolly-visual");
  if (!section || !list) return;

  const items = [...list.querySelectorAll(".scrolly-item")];
  const medias = [...visual.querySelectorAll(".scrolly-media")];
  if (!items.length) return;

  /* The first clip carries autoplay in the markup, so it is already running
     before any row becomes active — and a rate set before metadata arrives is
     forgotten. Set it now and again on load. */
  visual.querySelectorAll("video").forEach(v => {
    v.playbackRate = CLIP_RATE;
    v.addEventListener("loadedmetadata", () => { v.playbackRate = CLIP_RATE; });
  });

  let active = -1;
  let raf = null;

  const setActive = i => {
    if (i === active) return;
    active = i;
    items.forEach((el, n) => el.classList.toggle("is-active", n === i));
    medias.forEach((el, n) => {
      const on = n === i;
      el.classList.toggle("is-active", on);
      // A clip behind a faded-out plate is just work the browser does for
      // nobody: rewind it and stop until its row comes round again.
      const clip = el.querySelector("video");
      if (!clip) return;
      if (on) {
        // Slower than recorded. At full speed five screen recordings cutting
        // one after another read as flicker rather than as a demonstration;
        // at two-thirds there is time to see what each tool is doing.
        clip.playbackRate = CLIP_RATE;
        clip.currentTime = 0;
        clip.play?.().catch(() => {});
      }
      else {
        clip.pause?.();
        // Park it on the finished screen, not frame 0 — the clips open on a
        // near-black brand card, which on a black panel looks like a plate
        // that failed to load.
        if (clip.duration) clip.currentTime = Math.max(0, clip.duration - 0.25);
      }
    });
    if (caption) {
      caption.classList.add("is-swapping");
      setTimeout(() => {
        caption.textContent = SCROLLY_CAPTIONS[i] || "";
        caption.classList.remove("is-swapping");
      }, 180);
    }
  };

  const isPinned = () => matchMedia("(min-width: 900px)").matches;

  // The column eases toward where the scroll says it should be instead of
  // being pinned to it. Two frames of lag is enough to take the step out of a
  // trackpad flick without the list feeling detached from the wheel.
  let shown = null;            // px currently rendered
  let wanted = 0;              // px the scroll position asks for
  let glide = null;            // rAF id for the easing loop

  function ease(now) {
    glide = null;
    const dt = Math.min(64, now - (ease.last || now));   // ms, capped after a tab switch
    ease.last = now;

    // Frame-rate independent: the same fraction of the remaining distance per
    // millisecond, whatever the display is doing. Fast, because this is now a
    // snap between rows rather than a glide along with the scroll — it should
    // land, not drift.
    const k = 1 - Math.pow(0.000004, dt / 1000);
    shown += (wanted - shown) * k;

    if (Math.abs(wanted - shown) < 0.1) shown = wanted;
    list.style.transform = `translateY(${-shown}px)`;

    if (shown !== wanted) glide = requestAnimationFrame(ease);
    else ease.last = 0;
  }

  function update() {
    raf = null;

    if (!isPinned()) {           // mobile: everything visible, no transform
      list.style.transform = "";
      items.forEach(el => el.classList.add("is-active"));
      // Reset so a resize back to desktop re-applies a single active step —
      // otherwise setActive() early-returns and every item stays lit.
      active = -1;
      shown = null;
      return;
    }

    const travel = section.offsetHeight - innerHeight;
    const scrolled = -section.getBoundingClientRect().top;
    const p = Math.min(1, Math.max(0, travel > 0 ? scrolled / travel : 0));

    // Continuous position so the list tracks the scroll 1:1
    const exact = p * (items.length - 1);
    const itemH = items[0].offsetHeight;

    // The list carries an empty row at each end, so step i simply moves the
    // column by i rows and the current name always lands mid-window. The range
    // works out to exactly the scroll available, so there is no stretch of
    // scrolling where the column has nothing left to do.
    //
    // Whole rows, not the exact fraction: the column holds a tool while the
    // scroll crosses its band and then clicks to the next, instead of sliding
    // continuously and leaving every name half-way between two positions.
    const maxShift = Math.max(0, list.offsetHeight - list.parentElement.clientHeight);
    wanted = Math.min(maxShift, Math.max(0, Math.round(exact) * itemH));

    if (shown === null || REDUCED) {        // first paint, or motion turned off
      shown = wanted;
      list.style.transform = `translateY(${-shown}px)`;
    } else if (shown !== wanted && !glide) {
      ease.last = 0;
      glide = requestAnimationFrame(ease);
    }

    setActive(Math.round(exact));
    if (bar) bar.style.width = `${p * 100}%`;
  }

  const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll, { passive: true });

  setActive(0);
  update();
}

/* ============================================================
   6c. HERO VIDEO
   Muted autoplay is the only kind browsers allow. The visible pause
   control was removed by request; prefers-reduced-motion is kept as the
   remaining way for a user to stop playback.
   ============================================================ */

/* ============================================================
   6d. HERO MODE — video <-> original headline
   One h1 serves both modes; in video mode it is visually hidden
   but still present for screen readers and search engines.
   ============================================================ */
function initHeroMode() {
  const hero = document.querySelector(".hero");
  const btn = document.getElementById("hero-mode");
  const label = document.getElementById("hero-mode-label");
  const title = document.querySelector(".hero .display");
  if (!hero || !btn || !title) return;

  const navLinks = [...document.querySelectorAll(".nav a")];

  // The label moves on its own; the link keeps the hit area and the underline
  navLinks.forEach(a => {
    if (a.querySelector(".nav-label")) return;
    const span = document.createElement("span");
    span.className = "nav-label";
    span.textContent = a.textContent.trim();
    a.textContent = "";
    a.appendChild(span);
  });

  // Each link crosses over on its own. Both wordings are on screen at the same
  // time — the old one rolls up and out while the new one rises into its place —
  // so the link never sits empty mid-swap. The box eases between the two widths
  // underneath them, and a small per-index delay runs the row left to right.
  function swapNav(showText, pinned) {
    const ready = document.body.classList.contains("is-ready");

    navLinks.forEach((a, i) => {
      const next = showText ? a.dataset.full : a.dataset.hand;
      const cur = a.querySelector(".nav-label:not(.is-out)");
      if (!next || !cur || cur.textContent === next) return;

      if (REDUCED || !ready) {
        a.querySelectorAll(".nav-label.is-out").forEach(n => n.remove());
        cur.textContent = next;
        a.style.width = "";
        a.style.transition = "";
        return;
      }

      // A second press mid-flight would leave orphans stacked in the link
      a.querySelectorAll(".nav-label.is-out").forEach(n => n.remove());

      // The mode class has already swapped the typeface, so start from the
      // width captured before that — otherwise the link snaps wider first.
      const from = pinned ? pinned[i] : a.getBoundingClientRect().width;

      // Take the outgoing wording out of flow so the incoming one can occupy
      // the same spot; it keeps its rest position until the frame after.
      cur.classList.add("is-out");

      const incoming = document.createElement("span");
      incoming.className = "nav-label is-in";
      incoming.textContent = next;
      a.appendChild(incoming);

      // offsetWidth, not a bounding rect: the incoming label starts scaled up,
      // and the link is a flex item, so "width: auto" on it measures a shrunk
      // box rather than the wording it now holds.
      const to = incoming.offsetWidth;

      // Expo, not a spring: the row gliding to its new width reads as smooth,
      // while an overshoot makes the whole header jiggle.
      a.style.transition = "width .55s cubic-bezier(.16, 1, .3, 1)";
      a.style.width = from + "px";
      void a.offsetWidth;                             // commit the start width

      const delay = i * 55;
      a.style.transitionDelay = delay + "ms";
      cur.style.transitionDelay = delay + "ms";
      incoming.style.transitionDelay = delay + "ms";

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          a.style.width = to + "px";
          cur.classList.add("is-gone");               // rolls up and fades
          incoming.classList.remove("is-in");         // springs up into place
        });
      });

      setTimeout(() => {
        cur.remove();
        incoming.style.transitionDelay = "";
        a.style.width = "";
        a.style.transition = "";
        a.style.transitionDelay = "";
      }, delay + 620);
    });
  }

  // The wordmark carries the same wording in both modes, so only the hand
  // changes — a cut from one typeface to another at a different size reads as
  // a glitch beside a nav that crossfades. Same treatment as a nav link: the
  // old face lifts out while the new one springs up under it, and the box
  // glides between the two widths.
  function swapBrand(brand, was) {
    if (!brand || !was) return;
    const label = brand.querySelector(".brand-label");
    if (!label) return;

    brand.querySelectorAll(".brand-label.is-out").forEach(n => n.remove());

    if (REDUCED || !document.body.classList.contains("is-ready")) {
      brand.style.width = "";
      brand.style.transition = "";
      return;
    }

    const to = label.offsetWidth;
    if (Math.abs(to - was.width) < 1) return;        // same face, nothing to do

    // The outgoing copy keeps the face it was set in; the class has already
    // moved the live one on.
    const out = label.cloneNode(true);
    out.className = "brand-label is-out";
    out.setAttribute("aria-hidden", "true");
    Object.assign(out.style, was.font);
    brand.appendChild(out);

    label.classList.add("is-in");
    brand.style.transition = "width .55s cubic-bezier(.16, 1, .3, 1)";
    brand.style.width = was.width + "px";
    void brand.offsetWidth;                          // commit the start width

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        brand.style.width = to + "px";
        out.classList.add("is-gone");
        label.classList.remove("is-in");
      });
    });

    setTimeout(() => {
      out.remove();
      brand.style.width = "";
      brand.style.transition = "";
    }, 620);
  }

  function setMode(showText) {
    // Widths as they read now, before the mode class changes the nav typeface
    const pinned = navLinks.map(a => a.getBoundingClientRect().width);
    // The wordmark changes hand too, so it needs the same snapshot: its width
    // and the face it is wearing, both read before the class swaps them.
    const brandEl = document.querySelector(".brand");
    const brandWas = brandEl && (() => {
      const cs = getComputedStyle(brandEl);
      return {
        width: brandEl.getBoundingClientRect().width,
        font: {
          fontFamily: cs.fontFamily, fontSize: cs.fontSize,
          fontWeight: cs.fontWeight, letterSpacing: cs.letterSpacing,
        },
      };
    })();

    hero.classList.toggle("hero--text", showText);
    hero.classList.toggle("hero--video", !showText);

    // Page-level mode: "full" shows the whole site, "video" strips it back
    // to just the handwritten nav and the drawing.
    document.body.classList.toggle("mode-full", showText);
    document.body.classList.toggle("mode-video", !showText);

    btn.setAttribute("aria-pressed", String(showText));
    const next = showText ? "Show video" : "Show headline";
    if (label) label.textContent = next;
    btn.title = next;                  // the face alone does not say what it does

    // Nav speaks in Adi's voice alongside the drawing, plain wording otherwise
    swapNav(showText, pinned);
    swapBrand(brandEl, brandWas);

    const sub = document.querySelector(".hero-sub");

    if (showText) {
      resetTypewriter(title);        // rewind, then replay the typing
      sub?.classList.remove("is-revealed", "is-in");   // it follows the headline
      // While the preloader is still up, the curtain callback starts the
      // run instead — two overlapping runs fight over the same chars.
      if (document.body.classList.contains("is-ready")) {
        typewrite(title, {
          onTyped: () => setTimeout(() => sub?.classList.add("is-revealed", "is-in"), 160),
        });
      }
    } else {
      resetTypewriter(title);        // stop typing into the hidden heading
      // The showreel is a typeface now: write the intro instead of playing it
      if (document.body.classList.contains("is-ready")) initBoard.writeIntro?.();
    }

    // Layout changed height, so parallax offsets need recomputing
    collectParallax();
    runParallax();
  }

  setMode(true);                     // start on the headline

  // Crossfade between the two screens instead of cutting. The nav runs its
  // own per-link crossover at the same time, so the header keeps moving
  // while the hero is dark.
  let switching = false;
  let pressTimer = 0;
  btn.addEventListener("click", () => {
    if (switching) return;                       // ignore a double tap mid-fade
    const next = btn.getAttribute("aria-pressed") !== "true";

    if (REDUCED || !document.body.classList.contains("is-ready")) {
      setMode(next);
      return;
    }

    // The face answers the press itself: a squash, then a turn, as the two
    // screens change places behind it. Restarted from zero each time, or a
    // second press inside the run would find the animation already at its end.
    btn.classList.remove("is-pressed");
    void btn.offsetWidth;
    btn.classList.add("is-pressed");
    clearTimeout(pressTimer);
    pressTimer = setTimeout(() => btn.classList.remove("is-pressed"), 760);

    switching = true;

    // The knob answers the press straight away — it is the thing that was
    // clicked — while the hero dissolves behind it. setMode then sets the same
    // aria-pressed value, so the flight is not restarted.
    hero.classList.add("is-switching");
    setTimeout(() => {
      setMode(next);
      requestAnimationFrame(() => hero.classList.remove("is-switching"));
      setTimeout(() => { switching = false; }, 220);
    }, 220);
  });

  // The wordmark is "home", and home is the primary screen at the top of it.
  // It used to be a bare #top anchor, which from the drawing screen scrolled
  // you to the top of the drawing screen — the one place you were already
  // trying to leave.
  const brand = document.querySelector(".brand");
  brand?.addEventListener("click", e => {
    e.preventDefault();                          // never the raw #top jump as
                                                 // well — that fought the
                                                 // smooth scroll below
    const wasVideo = document.body.classList.contains("mode-video");
    if (wasVideo && !switching) btn.click();     // reuse the crossfade

    // Coming off the drawing screen the page height changes under the scroll,
    // so land first and let the crossfade play over it. Already on the
    // headline, glide.
    scrollTo({ top: 0, behavior: REDUCED || wasVideo ? "auto" : "smooth" });
  });

  // Expose so the preloader can start the right mode
  initHeroMode.setMode = setMode;

  /* "View drawings" sends someone to the shelf of drawings, which lives on
     the other screen — hidden here, so a plain anchor would glide to where a
     display:none section claims to be, which is nowhere. Cross first, then
     go: the frame after the swap is when the section has a position. */
  document.querySelector("[data-view-drawings]")?.addEventListener("click", e => {
    e.preventDefault();

    const wasFull = !document.body.classList.contains("mode-video");
    if (wasFull && !switching) btn.click();      // cross over the same way the
                                                 // toggle does, fade and all
    /* Measured after the crossfade, not on the next frame: the screens swap
       whole sections in and out and the shelf has no useful position until
       that has settled. */
    setTimeout(() => {
      const shelf = document.getElementById("doodles");
      if (!shelf) return;
      const y = shelf.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: Math.max(0, y), behavior: REDUCED ? "auto" : "smooth" });
      history.pushState(null, "", "#doodles");
    }, wasFull ? 620 : 40);
  });
}

/* ============================================================
   7. CUSTOM CURSOR
   ============================================================ */
function initCursor() {
  const cursor = document.querySelector(".cursor");
  if (!cursor || !FINE_POINTER) return;
  const label = cursor.querySelector(".cursor-label");

  let cx = 0, cy = 0, tx = 0, ty = 0;
  addEventListener("mousemove", e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function loop() {
    cx += (tx - cx) * 0.18;
    cy += (ty - cy) * 0.18;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
    requestAnimationFrame(loop);
  })();

  document.addEventListener("mouseover", e => {
    const labelled = e.target.closest("[data-cursor]");
    const hoverable = e.target.closest("a, button, .frame, .marquee-item, .service");
    if (labelled) {
      label.textContent = labelled.dataset.cursor;
      cursor.classList.add("has-label");
      cursor.classList.remove("is-hover");
    } else if (hoverable) {
      cursor.classList.add("is-hover");
      cursor.classList.remove("has-label");
    } else {
      cursor.classList.remove("is-hover", "has-label");
      label.textContent = "";
    }
  });
}

/* ============================================================
   8. MAGNETIC LINKS
   ============================================================ */
function initMagnetic() {
  if (REDUCED || !FINE_POINTER) return;
  document.querySelectorAll(".magnetic").forEach(el => {
    const STRENGTH = 0.35;
    el.addEventListener("mousemove", e => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      el.style.transform = `translate(${dx * STRENGTH}px, ${dy * STRENGTH}px)`;
      el.style.transition = "transform .1s linear";
    });
    el.addEventListener("mouseleave", () => {
      el.style.transition = "transform .5s cubic-bezier(0.16,1,0.3,1)";
      el.style.transform = "translate(0,0)";
    });
  });
}

/* ============================================================
   9. HEADER: sticky border, hide on scroll down, scrollspy
   ============================================================ */
function initHeader() {
  const header = document.getElementById("header");
  if (!header) return;
  let lastY = 0;
  addEventListener("scroll", () => {
    const y = scrollY;
    header.classList.toggle("is-stuck", y > 8);
    header.classList.toggle("is-hidden", y > 400 && y > lastY);
    lastY = y;
    if (!parallaxRaf) parallaxRaf = requestAnimationFrame(runParallax);
  }, { passive: true });

  const navLinks = [...document.querySelectorAll(".nav a")];
  const sections = ["top", "about", "work", "contact"]
    .map(id => document.getElementById(id)).filter(Boolean);
  const spy = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      navLinks.forEach(a => a.classList.toggle(
        "is-active", a.getAttribute("href") === `#${entry.target.id}`
      ));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  sections.forEach(s => spy.observe(s));
}

/* ============================================================
   10. CLOCK
   ============================================================ */
function tick() {
  const now = new Date();
  const d = document.getElementById("date");
  const c = document.getElementById("clock");
  if (d) d.textContent = now.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
  if (c) c.textContent = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

/* ============================================================
   11. SMOOTH SCROLL
   Wheel and keyboard input drive a target offset; a rAF loop eases
   the real scroll position toward it. We move the window itself
   rather than transforming a wrapper, so position: sticky, the
   pinned scrolly section and every scrollY reader keep working.
   Touch keeps its native momentum; reduced motion opts out.
   ============================================================ */
function initSmoothScroll() {
  if (REDUCED || !FINE_POINTER) return;

  const EASE = 0.1;          // fraction of the remaining gap eaten per frame
  const KEY_STEP = 120;
  let target = window.scrollY;
  let running = false;

  const maxScroll = () =>
    document.documentElement.scrollHeight - window.innerHeight;

  const clamp = v => Math.max(0, Math.min(v, maxScroll()));

  function loop() {
    const gap = target - window.scrollY;

    if (Math.abs(gap) < 0.5) {
      window.scrollTo({ top: target, behavior: "instant" });
      running = false;
      return;
    }

    window.scrollTo({ top: window.scrollY + gap * EASE, behavior: "instant" });
    requestAnimationFrame(loop);
  }

  /* The scroll the user asks for, measured from where the page actually is.
     While the loop is running the target is ahead of the position and that is
     the point of it; while it is not, the position may have been moved by
     something else — a jump to the top when the screens switch, a browser
     restoring a position, the settle below — and a target left over from the
     last flick would make the next one leap back to it. */
  function glideBy(delta) {
    if (!running) target = window.scrollY;
    glideTo(target + delta);
  }

  function glideTo(y, fromSettle = false) {
    if (!fromSettle) settling = false;       // the user asked for something else
    target = clamp(y);
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  /* ---------- Settling on Info ---------- */
  /* The toolkit releases the page after several pinned screens, and Info
     would otherwise go by in whatever position that release happened to
     leave. When a downward scroll goes quiet just short of Info, the same
     easing loop carries it the rest of the way.

     Driven by the scroll going quiet rather than by the loop above reaching
     its target: with a geometric ease the last fraction of a pixel can take
     longer to land than anyone waits, and a settle hung off that never fires.

     Downward only, and only from above: someone who has scrolled up from
     Info to read what sits over it is going somewhere, and pulling them back
     would be the page arguing with them. */
  const SETTLE_WITHIN = 170;                 // how short of Info still counts
  let settling = false;
  let lastDir = 0;
  let quiet = 0;

  function settlePoint() {
    const about = document.getElementById("about");
    if (!about) return null;
    let y = 0;
    for (let n = about; n; n = n.offsetParent) y += n.offsetTop;
    return clamp(y - 72);                    // clear of the fixed header
  }

  function maybeSettle() {
    if (settling || lastDir <= 0) return;
    const point = settlePoint();
    if (point === null) return;
    const short = point - window.scrollY;     // positive: Info is still below
    if (short > 4 && short < SETTLE_WITHIN) {
      settling = true;
      glideTo(point, true);
    }
  }

  addEventListener("scroll", () => {
    clearTimeout(quiet);
    quiet = setTimeout(maybeSettle, 140);
  }, { passive: true });

  // While a modal is open the page behind it is locked, so hijacking the
  // wheel would swallow the scroll entirely — the modal must keep it.
  const overlayOpen = () => !!document.querySelector(".portal:not([hidden])");

  addEventListener("wheel", e => {
    // Leave trackpad pinch-zoom and opted-out panes alone
    if (e.ctrlKey || e.defaultPrevented) return;
    if (overlayOpen()) return;
    if (e.target.closest?.("[data-native-scroll]")) return;

    e.preventDefault();
    lastDir = Math.sign(e.deltaY) || lastDir;
    glideBy(e.deltaY);
  }, { passive: false });

  addEventListener("keydown", e => {
    // contenteditable is neither INPUT nor TEXTAREA, but typing a space in a
    // sticky note must insert a space, not page down
    const el = document.activeElement;
    const tag = el?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
    if (overlayOpen()) return;              // the modal scrolls, not the page

    const step = {
      ArrowDown: KEY_STEP,
      ArrowUp: -KEY_STEP,
      PageDown: window.innerHeight * 0.9,
      PageUp: -window.innerHeight * 0.9,
      " ": window.innerHeight * 0.9,
    }[e.key];

    if (step !== undefined) {
      e.preventDefault();
      lastDir = Math.sign(step) || lastDir;
      glideBy(step);
    } else if (e.key === "Home") {
      e.preventDefault();
      glideTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      glideTo(maxScroll());
    }
  });

  // In-page links ease through the same loop instead of jumping
  document.querySelectorAll('a[href^="#"]:not([data-view-drawings])').forEach(a => {
    a.addEventListener("click", e => {
      const hash = a.getAttribute("href");
      const el = hash.length > 1 ? document.getElementById(hash.slice(1)) : document.body;
      if (!el) return;

      e.preventDefault();
      glideTo(el.getBoundingClientRect().top + window.scrollY);
      history.pushState(null, "", hash);
    });
  });

  // Anything that moves the page outside this loop — resize, the
  // preloader unlocking, a browser scroll restore — must not get
  // yanked back toward a stale target
  const resync = () => { if (!running) target = window.scrollY; };
  addEventListener("resize", resync, { passive: true });
  addEventListener("scroll", resync, { passive: true });
  initSmoothScroll.sync = () => { target = window.scrollY; };
}

/* ============================================================
   12. PRELOADER
   ============================================================ */
function initPreloader(onDone) {
  const pre = document.getElementById("preloader");
  const countEl = document.getElementById("pre-count");
  const barEl = document.getElementById("pre-bar");

  if (!pre) { onDone(); return; }
  if (REDUCED) {
    pre.classList.add("is-done", "is-gone");
    document.body.classList.remove("is-loading");
    onDone();
    return;
  }

  let progress = 0;
  let loaded = false;
  const start = performance.now();
  const MIN_MS = 1100;

  // NOTE: `load` may already have fired by the time we get here (boot waits on
  // document.fonts.ready), so check readyState before subscribing — otherwise
  // the listener never runs and the counter stalls forever.
  const windowLoaded = document.readyState === "complete"
    ? Promise.resolve()
    : new Promise(res => window.addEventListener("load", res, { once: true }));

  Promise.all([
    windowLoaded,
    document.fonts ? document.fonts.ready : Promise.resolve(),
  ]).then(() => { loaded = true; });

  // Failsafe: never trap the page behind the curtain.
  setTimeout(() => { loaded = true; }, 6000);

  (function step() {
    const elapsed = performance.now() - start;
    // Ease toward 92% while assets load, then run to 100
    const ceiling = loaded && elapsed >= MIN_MS ? 100 : 92;
    progress += (ceiling - progress) * 0.06;
    if (ceiling === 100 && progress > 99.4) progress = 100;

    const shown = Math.floor(progress);
    countEl.textContent = shown;
    barEl.style.width = `${progress}%`;

    if (progress < 100) { requestAnimationFrame(step); return; }

    // Finish: panels slide up, page unlocks, hero plays
    setTimeout(() => {
      pre.classList.add("is-done");
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-ready");
      onDone();
      setTimeout(() => pre.classList.add("is-gone"), 1400);
    }, 220);
  })();
}

/* ============================================================
   BOOT
   ============================================================ */
function boot() {
  // Split headings into chars, paragraphs into lines
  document.querySelectorAll("[data-split]").forEach(el => {
    try { splitChars(el); } catch (e) { console.error("splitChars failed", el, e); }
  });
  const lineEls = [...document.querySelectorAll("[data-split-lines]")];
  lineEls.forEach(el => {
    try { splitLines(el); } catch (e) { console.error("splitLines failed", el, e); }
  });

  // Re-flow those paragraphs when the width changes. Each measured line became
  // its own block, so at a narrower width every one of them wrapped again on
  // its own and the copy broke mid-phrase — "I'm a product designer who turns"
  // then "complex workflows into intuitive user". Only width matters: a phone
  // hiding its address bar changes the height constantly and re-splitting on
  // that would rebuild the paragraph mid-scroll.
  let lastW = innerWidth, resplit = null;
  addEventListener("resize", () => {
    if (innerWidth === lastW) return;
    lastW = innerWidth;
    clearTimeout(resplit);
    resplit = setTimeout(() => {
      lineEls.forEach(el => {
        const shown = el.classList.contains("is-in");
        el.innerHTML = el.dataset.source;
        try { splitLines(el); } catch (e) { console.error("re-split failed", el, e); }
        if (shown) el.classList.add("is-in", "is-revealed");
      });
    }, 180);
  }, { passive: true });
  document.querySelectorAll("[data-kinetic]").forEach(initKinetic);

  collectParallax();
  observeAll();
  watchReveals();
  initCursor();
  initMagnetic();
  initMarquee();
  initScrolly();
  initHeroMode();
  initHeader();
  initSmoothScroll();
  initProjectPortal();
  window.Handwriting?.load("fonts/hand-strokes.json").catch(() => {});
  initBoard();

  tick();
  setInterval(tick, 30000);
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  runParallax();
  addEventListener("resize", () => {
    collectParallax();
    runParallax();
  }, { passive: true });

  initPreloader(() => {
    initSmoothScroll.sync?.();

    // Play the hero once the curtain lifts
    const hero = document.querySelector(".hero .display");
    const sub = document.querySelector(".hero-sub");

    const showSub = () => sub && sub.classList.add("is-revealed", "is-in");

    const inVideoMode = document.querySelector(".hero").classList.contains("hero--video");
    if (hero && hero.hasAttribute("data-typewriter") && !inVideoMode) {
      // The paragraph waits for the sentence above it to finish writing —
      // running both at once had the reader's eye in two places, and the
      // paragraph arriving under a half-typed headline read as a glitch.
      typewrite(hero, { onTyped: () => setTimeout(showSub, 160) });
    } else if (hero && !inVideoMode) {
      hero.classList.add("is-revealed", "is-in");
      setTimeout(showSub, 260);
    } else {
      setTimeout(showSub, 260);
    }

    // Starting in video mode: write the intro once the curtain is up
    if (inVideoMode) setTimeout(() => initBoard.writeIntro?.(), 260);

    document.querySelectorAll(".hero .frame").forEach((f, i) =>
      setTimeout(() => f.classList.add("is-in"), 420 + i * 120));
  });
}

// Fonts must be ready before we measure line wrapping
if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(boot);
} else {
  addEventListener("DOMContentLoaded", boot);
}

/* ============================================================
   14. STICKY NOTE BOARD
   A small working board beside the showreel: notes can be typed
   into, formatted, dragged and added. Formatting uses
   document.execCommand — deprecated, but still the only one-line
   way to apply bold/strike/link/list to a selection inside a
   contenteditable, and it works in every current browser.
   ============================================================ */
// Swatch row, in the reference's order
const NOTE_COLOURS = [
  "#ffffff", "#d9d9d9", "#f7a9a0", "#f8cba6", "#f8dc95",
  "#bfe3c6", "#b9e5e0", "#bcd8f5", "#ded0f7", "#f3c6dd",
];

const NOTE_AUTHOR = "Aditya Joseph";

const NOTE_FONTS = [
  { label: "Sans",      css: "" },
  { label: "Serif",     css: '"Instrument Serif", Georgia, serif' },
  { label: "Handwritten", css: '"Caveat", cursive' },
];

const NOTE_SIZES = [
  { label: "Small", px: 16 },
  { label: "Medium", px: 24 },
  { label: "Large", px: 40 },
  { label: "Extra large", px: 64 },
  { label: "Huge", px: 96 },
];

/* ------------------------------------------------------------
   Replies.

   answerFor() asks a model and falls back to the local matcher
   below if the call fails, times out, or the answer comes back
   empty — the board keeps working offline either way.

   No API key lives in this file, and none should: this is a
   static site, so anything here is readable by anyone viewing
   source. Two routes instead:

     1. AI_ENDPOINT — your own proxy, holding the key server-side.
        api/chat.js in this repo is one, ready for Vercel. Set
        window.ADY_AI_ENDPOINT = "/api/chat" (or just deploy it —
        the path is tried automatically).
     2. The keyless public endpoint, used when no proxy answers.
        It needs no account, but questions typed on the board do
        travel to a third party.
   ------------------------------------------------------------ */
const AI_ENDPOINTS = [
  { url: () => window.ADY_AI_ENDPOINT || "/api/chat", kind: "proxy" },
  { url: () => "https://text.pollinations.ai/openai", kind: "public" },
];

/* What the model knows about him — the board's whole memory. It knows nothing
   beyond this, so anything the site claims and this does not gets denied:
   asked whether he vibe codes, an earlier version had him answering that he
   does not write code, and asked whether he draws, that he does UI. Both are
   on the page. When the site gains a project, a skill or a section, add it
   here in the same breath. */
const AI_SYSTEM = [
  "You are the portfolio of Aditya Joseph, a product designer based out of",
  "Delhi, India. Answer as him, in first person, warm and plain-spoken.",
  "Answer the question actually asked, from the facts below.",

  "POSITION. Curious product designer with strong design fundamentals, vibe",
  "coding his way through the design world. He designs solutions for complex",
  "problems, backed by thorough UX research, and turns complex workflows into",
  "intuitive user flows, thoughtful interfaces and scalable design systems.",

  "PRACTICE. UX design: research-led user flows and information architecture",
  "that reduce friction. UI design: clear, high-fidelity interfaces with strong",
  "hierarchy and visual polish. Prototyping: clickable prototypes that let",
  "teams test ideas early and decide faster. Design systems: reusable",
  "components and foundations that hold consistency across teams and",
  "platforms. Also user research, UX strategy, information architecture,",
  "wireframing, usability testing and accessibility. His process runs",
  "Discover, Define, Design, Systemise, Ship.",

  "DRAWING. Yes, he draws, and it is not a sideline — the whole site is built",
  "on it. He keeps a sketchbook, does lettering, character studies, and daily",
  "doodles of ten minutes most mornings. The handwriting this site is set in",
  "is his own hand, traced into a typeface, and the portrait and the drawing",
  "screen are his drawings too. If someone asks whether he can draw, or about",
  "illustration, sketching or lettering, the answer is yes, with that detail.",

  "AI AND CODE. He vibe codes: he builds working prototypes and interfaces",
  "himself with AI tools rather than handing static screens over, which is how",
  "he bridges the gap between product designer and engineer. Yes, he codes in",
  "that sense — never say he does not. He thinks AI has changed how designers",
  "work entirely: ideas can be tested quickly, so most of the time goes on",
  "research and understanding the problem.",

  "TOOLKIT. Figma, where the design work happens — interfaces, components,",
  "variants, prototypes, and the file a team builds from. Cursor, for writing",
  "and refactoring code alongside the design so a prototype becomes something",
  "real without a handoff gap. Photoshop, for retouching, composites and",
  "texture. Claude, as a thinking partner — auditing flows, pressure-testing",
  "copy, building prototypes to try an idea before committing. ChatGPT, for",
  "turning research notes and messy input into structure to design against.",

  "PROJECT ONE. Eicore OneBuzz, B2B insurtech, enterprise UX. An AI reads",
  "insurance product configurations out of business requirement documents,",
  "rate cards and policy wordings, compressing 3-5 days of manual",
  "configuration into hours of review. The extraction was already fast; the",
  "interface was why nobody could rely on it. An audit found eight behaviours",
  "undermining trust, and the redesign answered each: errors consolidated from",
  "four places into one auditor, 37 flat coverages regrouped into eight",
  "semantic groups, blocking validation moved from final pre-publish to inline",
  "while editing. At its centre is a trust loop — a low-confidence value is",
  "flagged, one click opens the exact passage in the source document, and",
  "accepting it clears the warning — so verification never leaves the canvas.",
  "Five screens and a design system, for actuaries where a misread co-payment",
  "bracket costs millions.",

  "PROJECT TWO. Oykot Money, personal finance. A budget you will actually",
  "keep: it turns a monthly 50/30/20 plan into one clear daily answer, what is",
  "safe to spend today. Most budget tools are retrospective and explain the",
  "month after it has gone wrong; this one makes the next decision clearer",
  "before the money leaves the account. Safe-to-spend, a spending-pace signal,",
  "recurring bills accounted for upfront, and informal lending and borrowing in",
  "the same view. Privacy-first and manual: no bank syncing, the user stays in",
  "control.",

  "AWAY FROM THE DESK. He plays sport: football, badminton and boxing. He is a",
  "motorhead, taken with everything from the design and performance of a ride",
  "to the thrill of being on the road. He explores different drawing mediums",
  "and expresses his ideas through art. When he wants to slow down he reads.",
  "Questions about any of this are welcome — answer them as warmly as the",
  "ones about work.",

  "CONTACT. adijosantony@gmail.com, +91 99991 60879. Open to work that cares",
  "about solving real user problems.",

  "HOW TO ANSWER. At most two short sentences, under 240 characters total.",
  "Wrap two or three key words in **double asterisks**. No lists, no headings,",
  "no other markdown. Never deny something stated above.",

  "Answer whatever is asked, not only questions about him. General questions —",
  "a fact, a definition, advice, something in the news, a joke — get a real",
  "answer in the same voice, short and plainly, and then stop. Do not refuse,",
  "do not say a question is outside what this board covers, and do not steer",
  "the conversation back to design. For anything needing live information he",
  "cannot have — today's weather, a score, a price — say plainly that he",
  "cannot see it from here, and answer whatever part he can.",
].join(" ");

/* A model told to decline briefly often declines at length anyway — an
   apology, then the list of things it would rather talk about. The board has
   one line of room for a no, so a long refusal is replaced with a short one
   rather than written out and clipped. */
const OFF_TOPIC = /outside what this board covers|not something (this board|i) (cover|can)|unrelated to (his|my) work|can(no|')t help with that/i;
function trimRefusal(html) {
  const words = html.replace(/<[^>]*>/g, " ").trim().split(/\s+/).length;
  if (OFF_TOPIC.test(html) && words > 12) {
    return "That's <strong>outside what this board covers</strong>.";
  }
  return html;
}

/* A service can answer 200 OK with its own notice — "out of credits", "sign
   in", a link to top up — and that is not an answer to the question. The
   system prompt forbids links and markdown, so anything link-shaped or
   billing-shaped is the provider talking, not the model. */
function looksLikeServiceNotice(text) {
  return /\]\(https?:|https?:\/\/\S+/i.test(text)
      || /\b(api key|credits?|top.?up|quota|rate.?limit|billing|balance|upgrade your plan|sign in to continue|unauthori[sz]ed)\b/i.test(text);
}

/* The model's words are untrusted text, not markup: escape everything, then
   allow back exactly one thing — **bold** — which is what the handwriting
   renderer understands. */
function aiToSafeHtml(text) {
  const esc = String(text)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
  return esc.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").trim();
}

async function askModel(question) {
  const body = JSON.stringify({
    model: "openai",
    messages: [
      { role: "system", content: AI_SYSTEM },
      { role: "user", content: question },
    ],
  });

  for (const ep of AI_ENDPOINTS) {
    const stop = new AbortController();
    const timer = setTimeout(() => stop.abort(), 12000);
    try {
      const res = await fetch(ep.url(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: stop.signal,
      });
      clearTimeout(timer);
      if (!res.ok) continue;

      const raw = await res.text();
      let text = raw;
      try {                                  // OpenAI-shaped, or plain text
        const j = JSON.parse(raw);
        text = j.choices?.[0]?.message?.content ?? j.reply ?? j.text ?? raw;
      } catch { /* plain text is fine */ }

      text = String(text).trim();
      if (!text || text.length > 1200) continue;
      if (looksLikeServiceNotice(text)) continue;   // the provider, not the model
      return aiToSafeHtml(text);
    } catch {
      clearTimeout(timer);                   // try the next one
    }
  }
  return null;
}

async function answerFor(question) {
  /* Only a pinned answer speaks over the model. Letting the whole bank go
     first meant "tell me about his projects" was caught by the pattern for
     "tell me about" and answered with the introduction — the right words to
     the wrong question. The pinned ones are written to be heard exactly as
     written; the rest are what to say when nothing can be reached. */
  const pinned = ANSWERS.find(a => a.pin && a.match.test(question));
  if (pinned) return pinned.reply;

  const live = await askModel(question);
  return live ? trimRefusal(live) : cannedAnswer(question);
}

const ANSWERS = [
  {
    match: /who|about (you|adi|aditya)|tell me about|yourself/i,
    reply: "I'm <strong>Aditya Joseph</strong>, a product designer based out of Delhi. I design digital experiences that bring clarity to complex information, workflows and decisions.",
  },
  {
    match: /design skill|skills|what can|capab|do you do|services/i,
    reply: "<strong>UX design, UI design, prototyping, design systems and accessibility</strong> — research, information architecture, interaction design and visual systems.",
  },
  {
    match: /process|how do you work|method|approach/i,
    reply: "Five stages: <strong>Discover, Define, Design, Systemise, Ship</strong> — from insight to interface, every project follows a clear path.",
  },
  {
    match: /accessib|inclusive|wcag/i,
    reply: "Inclusive design choices that make digital experiences <strong>easier to understand and use for more people</strong>.",
  },
  {
    match: /system|component|scale|consistent/i,
    reply: "Reusable components and design foundations that create <strong>consistency across product teams and platforms</strong>.",
  },
  {
    match: /where|based|located|delhi|india/i,
    reply: "Based in <strong>Delhi, India</strong>, working with teams that care about solving real user problems.",
  },
  {
    match: /contact|hire|available|work together|email|reach/i,
    reply: "Say hello at <strong>adijosantony@gmail.com</strong> — let's create something clear, useful and memorable.",
  },
  // Asked often enough, and answered honestly. Pinned: this one is the
  // answer, not a stand-in for a model that could not be reached.
  {
    pin: true,
    match: /single|girlfriend|relationship|dating|taken|boyfriend/i,
    reply: "Hmmm, he hasn't talked to his girlfriend in two days, and he misses her a lot, and she's out there partying without him — <strong>full mazeee mere bina..</strong> XDDDD BABEEEEEEEE KISSIE PISSIE",
  },
];

/* Reached only when no model could be: the network is down, or the day's
   quota is spent. Say that, rather than "I don't know" — the board can answer
   this question, just not this minute, and the two read very differently to
   someone who has just typed it. */
function cannedAnswer(question) {
  const hit = ANSWERS.find(a => a.match.test(question));
  if (hit) return hit.reply;
  return `I can't reach my notes this minute — ask again shortly. ` +
         `Meanwhile: the <strong>work</strong>, the <strong>process</strong>, ` +
         `or <strong>getting in touch</strong>.`;
}

/* Three words that say what a turn was about — the rail is too small for
   a sentence. Stopwords out, first three survivors in, capitalised. */
const STOPWORDS = new Set(("a an the is are was were do does did have has had of for to in on at " +
  "by with from about like and or but if then than that this these those it its as can could " +
  "would should will shall you your he she they we i me my our their what which who whom how " +
  "why when where all any some more most other into over under").split(" "));

function threeWordLabel(text) {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  if (!words.length) return "Untitled";

  const cap = w => w[0].toUpperCase() + w.slice(1);

  // Content words carry the meaning, so they are picked first
  const picked = new Set();
  words.forEach((w, i) => {
    if (picked.size < 3 && !STOPWORDS.has(w)) picked.add(i);
  });

  // A short question ("What is your process?") may have only one content
  // word. Pad outwards from what was picked rather than from the start, so
  // the label still reads as a phrase instead of a keyword dump.
  if (picked.size < 3 && words.length > picked.size) {
    const lo = Math.min(...picked, words.length);
    const hi = Math.max(...picked, -1);
    for (let d = 1; picked.size < 3 && d <= words.length; d++) {
      if (lo - d >= 0) picked.add(lo - d);
      if (picked.size < 3 && hi + d < words.length) picked.add(hi + d);
    }
  }

  // Outward expansion can't reach a gap between two picked words
  // ("Tell me about Joseph" leaves "me"/"about" unused), so mop up.
  for (let i = 0; picked.size < 3 && i < words.length; i++) picked.add(i);

  return [...picked].sort((a, b) => a - b).map(i => cap(words[i])).join(" ");
}

function initBoard() {
  const board = document.getElementById("board");
  const canvas = document.getElementById("board-canvas");
  const bar = document.getElementById("board-bar");
  const addBtn = document.getElementById("board-add");
  const sizeLabel = document.getElementById("bb-size-label");
  const pops = {
    color: document.getElementById("pop-color"),
    font: document.getElementById("pop-font"),
    size: document.getElementById("pop-size"),
  };
  if (!board || !canvas || !bar) return;

  const RAIL_GUTTER = 44;  // keeps notes clear of the history rail

  let selected = null;
  let topZ = 1;            // notes stack in pick-up order, not DOM order
  const history = new WeakMap();   // note -> [{ q, a }]
  const log = [];                  // every turn on the board, in order

  const rail = document.createElement("div");
  rail.className = "board-rail";
  rail.setAttribute("role", "list");
  rail.setAttribute("aria-label", "Conversation history");

  const railCard = document.createElement("div");
  railCard.className = "rail-card";

  board.append(rail, railCard);

  const bodyOf = n => n?.querySelector(".note-text");

  const safeState = cmd => {
    try { return document.queryCommandState(cmd); } catch { return false; }
  };

  /* ---------- Popover contents ---------- */
  pops.color.innerHTML = NOTE_COLOURS.map(c =>
    `<button class="bb-chip" type="button" role="menuitem" data-colour="${c}"` +
    ` style="background:${c}" aria-label="Colour ${c}"></button>`).join("");

  pops.font.innerHTML = NOTE_FONTS.map((f, i) =>
    `<button class="bb-item" type="button" role="menuitem" data-font="${i}">` +
    `<span style="font-family:${f.css || "inherit"}">${f.label}</span>` +
    `<span class="bb-tick" aria-hidden="true">✓</span></button>`).join("");

  pops.size.innerHTML =
    NOTE_SIZES.map(sz =>
      `<button class="bb-item" type="button" role="menuitem" data-size="${sz.px}">` +
      `<span>${sz.label}</span><span class="bb-num">${sz.px}</span></button>`).join("") +
    `<input class="bb-custom" id="bb-size-input" type="number" min="8" max="200"` +
    ` value="18" aria-label="Custom text size">`;

  const sizeInput = document.getElementById("bb-size-input");

  // prompt() is blocked in some embedders (and is a poor experience anyway),
  // so the link URL is collected inline instead.
  const linkPop = document.createElement("div");
  linkPop.className = "bb-pop";
  linkPop.hidden = true;
  linkPop.innerHTML =
    '<input class="bb-custom" id="bb-link-input" type="url"' +
    ' placeholder="https://…" aria-label="Link URL">';
  board.appendChild(linkPop);
  pops.link = linkPop;
  const linkInput = linkPop.querySelector("#bb-link-input");

  // Opening the popover moves focus out of the note and collapses the
  // selection, so remember it and put it back before applying the link.
  let savedRange = null;

  /* ---------- Notes ---------- */
  function makeNote({ x, y, text = "", colour = NOTE_COLOURS[4] }) {
    const note = document.createElement("div");
    note.className = "note";
    note.style.left = `${x}px`;
    note.style.top = `${y}px`;
    note.style.background = colour;
    note.dataset.colour = colour;
    note.dataset.size = "18";
    note.dataset.font = "0";

    const body = document.createElement("div");
    body.className = "note-text";
    body.contentEditable = "true";
    body.spellcheck = false;
    body.dataset.placeholder = "Type something…";
    body.style.fontSize = "18px";
    body.innerHTML = text;

    const by = document.createElement("div");
    by.className = "note-by";
    by.textContent = NOTE_AUTHOR;

    note.append(body, by);
    canvas.appendChild(note);

    // Every question typed into this box, newest last
    history.set(note, []);
    return note;
  }

  /* ---------- Live handwritten reply ---------- */
  // The hero shows the intro when nothing is selected, and the selected
  // card's answer when there is one. When a real agent is connected this is
  // already the surface its replies land on — only answerFor() changes.
  const reply = document.getElementById("hero-reply");
  const replyQ = document.getElementById("hero-reply-q");
  const replyA = document.getElementById("hero-reply-a");
  const intro = document.getElementById("hero-intro");
  let writeToken = 0;

  // Flatten the answer's markup into characters that remember their own
  // emphasis. Writing the tags out mid-stream does not work: the parser
  // closes <strong> as soon as it is inserted, so every character after it
  // lands outside and the emphasis is lost.
  function charsOf(html) {
    const box = document.createElement("div");
    box.innerHTML = html;
    const out = [];

    (function walk(node, bold) {
      node.childNodes.forEach(child => {
        if (child.nodeType === Node.TEXT_NODE) {
          for (const ch of child.textContent) out.push({ ch, bold });
        } else {
          const tag = child.tagName.toLowerCase();
          walk(child, bold || tag === "strong" || tag === "b");
        }
      });
    })(box, false);

    return out;
  }

  // One writer, used for the intro and for every reply: real pen strokes once
  // the centreline data has loaded, otherwise a per-glyph wipe, so a slow or
  // failed fetch never blanks the text.
  function writeHand(host, html, token, opts = {}) {
    if (window.Handwriting?.ready) {
      return window.Handwriting.write(host, charsOf(html), { live: token, ...opts })
        .catch(() => { host.innerHTML = html; });
    }

    return new Promise(resolve => {
      host.innerHTML = "";
      if (REDUCED) { host.innerHTML = html; resolve(); return; }

      const chars = charsOf(html);
      const pen = document.createElement("span");
      pen.className = "hw-pen";
      pen.setAttribute("aria-hidden", "true");
      host.appendChild(pen);

      let i = 0;
      let word = null;          // characters are grouped so words never split

      (function stroke() {
        if (!token()) return resolve();

        if (i >= chars.length) {
          setTimeout(() => { pen.remove(); resolve(); }, 700);
          return;
        }

        const { ch, bold } = chars[i++];

        if (ch === " ") {
          word = null;
          host.insertBefore(document.createTextNode(" "), pen);
        } else {
          if (!word) {
            word = document.createElement("span");
            word.className = "hw-word";
            host.insertBefore(word, pen);
          }
          const span = document.createElement("span");
          span.className = "hw-char" + (bold ? " hw-b" : "");
          span.textContent = ch;
          word.appendChild(span);
        }

        let wait = 42 + Math.random() * 30;
        if (ch === " ") wait += 70;
        if (/[.,;:!?]/.test(ch)) wait += 210;
        setTimeout(stroke, wait);
      })();
    });
  }

  function writeReply(q, a) {
    if (!reply) return;
    const mine = ++writeToken;

    reply.classList.add("is-on");
    document.querySelector(".hero")?.classList.add("has-reply");
    replyQ.textContent = q;

    // The reply pane clips: give the writer the room left under the question
    // so a long answer is shrunk to fit rather than written off the bottom.
    // Leave a descender's worth of slack below the last line, or the figure's
    // overflow clips the tails even when the block technically fits.
    const room = reply.clientHeight - replyQ.offsetHeight - 40;
    writeHand(replyA, a, () => mine === writeToken, { maxHeight: Math.max(60, room) });
  }

  // Closing a reply uncovers the intro again — the hero's resting state.
  function closeReply() {
    writeToken++;                      // stop a run still in progress
    reply?.classList.remove("is-on");
    document.querySelector(".hero")?.classList.remove("has-reply");
    if (replyA) replyA.innerHTML = "";
    if (replyQ) replyQ.textContent = "";
  }

  // Back leaves the board altogether and returns to the headline — the reply
  // is the deepest state, so "back" means all the way home.
  function goHome() {
    closeReply();
    select(null);
    initHeroMode.setMode?.(true);
  }
  document.getElementById("hero-back")?.addEventListener("click", goHome);
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && reply?.classList.contains("is-on")) goHome();
  });

  /* ---------- Intro ---------- */
  // The two lines the showreel used to play, written rather than filmed.
  // The second one is then rubbed out and replaced: the claim gives way to
  // the invitation, and the erasing is what tells you the board is writable.
  const INTRO = ["Hi, I'm Adi", "I like to draw"];
  const INTRO_REWRITE = "Ask me anything";

  // Rub a written line out, left to right, the ink going with the eraser's
  // trailing edge. The clip sits on a wrapper rather than the host, or the
  // eraser would be clipped along with the ink it is removing.
  function eraseLine(host, token) {
    return new Promise(resolve => {
      if (REDUCED || !host.textContent.trim()) {
        host.innerHTML = "";
        resolve();
        return;
      }

      const ink = document.createElement("span");
      ink.className = "hw-erasable";
      while (host.firstChild) ink.appendChild(host.firstChild);
      host.appendChild(ink);
      host.style.position = "relative";

      const inkW = ink.getBoundingClientRect().width || host.clientWidth;
      const em = parseFloat(getComputedStyle(host).fontSize) || 32;

      const eraser = document.createElement("span");
      eraser.className = "hw-eraser";
      eraser.setAttribute("aria-hidden", "true");
      host.appendChild(eraser);

      const from = -em * 0.7;
      const to = inkW + em * 0.5;
      const DUR = 1000;
      const t0 = performance.now();

      const done = () => {
        eraser.remove();
        host.innerHTML = "";
        host.style.position = "";
        resolve();
      };

      (function frame(now) {
        if (!token()) return done();
        const t = Math.min(1, (now - t0) / DUR);
        // Ease, then a little vertical scrub so the hand reads as a hand
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const x = from + (to - from) * e;
        const wobble = Math.sin(t * Math.PI * 7) * em * 0.05;

        eraser.style.transform = `translate(${x}px, ${wobble}px) rotate(-7deg)`;
        // The ink is gone everywhere the eraser has already passed
        ink.style.clipPath = `inset(-30% 0 -30% ${Math.max(0, x + em * 0.28)}px)`;

        if (t < 1) return requestAnimationFrame(frame);
        crumbs(host, inkW, em);
        setTimeout(done, 260);
      })(t0);
    });
  }

  // What is left on the paper afterwards: a few rubbings that fall and fade.
  function crumbs(host, width, em) {
    for (let i = 0; i < 5; i++) {
      const c = document.createElement("span");
      c.className = "hw-crumb";
      c.setAttribute("aria-hidden", "true");
      c.style.left = `${width * (0.15 + Math.random() * 0.7)}px`;
      c.style.animationDelay = `${i * 40}ms`;
      c.style.setProperty("--fall", `${em * (0.3 + Math.random() * 0.35)}px`);
      host.appendChild(c);
      setTimeout(() => c.remove(), 900);
    }
  }

  // Runs again every time the drawing screen is shown. Switching away mid-way
  // abandons the run where it stood, and a one-shot guard meant coming back
  // left the line half written for good — so each arrival starts from a clean
  // board rather than resuming a run nobody watched.
  async function writeIntro() {
    const l1 = document.getElementById("hero-intro-1");
    const l2 = document.getElementById("hero-intro-2");
    if (!l1 || !l2) return;

    const mine = ++writeToken;
    const live = () => mine === writeToken;

    // Whatever the abandoned run left behind — half a line, an eraser
    // mid-sweep, the inline position and line-height the writer sets.
    [l1, l2].forEach(el => {
      el.innerHTML = "";
      el.style.position = "";
      el.style.lineHeight = "";
    });

    // Wait for the pen strokes, or the intro is written once in the fallback
    // style and never redrawn
    await window.Handwriting?.whenReady?.();
    if (!live()) return;

    await writeHand(l1, INTRO[0], live);
    if (live()) await writeHand(l2, INTRO[1], live);
    // A beat to read the line before it is taken away
    if (live()) await new Promise(r => setTimeout(r, 900));
    if (live()) await eraseLine(l2, live);
    if (live()) await writeHand(l2, INTRO_REWRITE, live);
  }
  initBoard.writeIntro = writeIntro;

  /* ---------- History rail ---------- */
  function renderRail() {
    rail.innerHTML = "";

    log.forEach((turn, i) => {
      const line = document.createElement("button");
      line.type = "button";
      line.className = "rail-line" + (i === log.length - 1 ? " is-latest" : "");
      line.setAttribute("role", "listitem");
      line.setAttribute("aria-label", turn.label);
      line.dataset.i = String(i);
      rail.appendChild(line);
    });
  }

  function showCard(line) {
    const turn = log[+line.dataset.i];
    if (!turn) return;

    railCard.innerHTML =
      `<div class="rail-kicker">${turn.label}</div>` +
      `<div class="rail-q">${turn.q}</div>` +
      `<div class="rail-a">${turn.a}</div>`;
    railCard.classList.add("is-on");

    // Sit beside its line, nudged up so the card stays inside the board
    const b = board.getBoundingClientRect();
    const l = line.getBoundingClientRect();
    const top = Math.max(8, Math.min(
      l.top - b.top - railCard.offsetHeight / 2,
      b.height - railCard.offsetHeight - 8,
    ));
    railCard.style.top = `${top}px`;
  }

  rail.addEventListener("pointerover", e => {
    const line = e.target.closest(".rail-line");
    if (line) showCard(line);
  });
  rail.addEventListener("focusin", e => {
    const line = e.target.closest(".rail-line");
    if (line) showCard(line);
  });
  const hideCard = () => railCard.classList.remove("is-on");
  rail.addEventListener("pointerleave", hideCard);
  rail.addEventListener("focusout", hideCard);

  // Clicking a line jumps to the note that turn came from
  rail.addEventListener("click", e => {
    const line = e.target.closest(".rail-line");
    const turn = line && log[+line.dataset.i];
    if (!turn?.note?.isConnected) return;

    select(turn.note);
    turn.note.classList.remove("is-flash");
    void turn.note.offsetWidth;          // restart the animation
    turn.note.classList.add("is-flash");
  });

  async function ask(note) {
    const body = bodyOf(note);
    const q = body.innerText.trim();
    const turns = history.get(note) || [];
    if (!q || turns.at(-1)?.q === q) return;   // nothing new to ask

    const dot = document.createElement("span");
    dot.className = "note-thinking";
    note.appendChild(dot);

    const a = await answerFor(q);
    dot.remove();

    turns.push({ q, a });
    history.set(note, turns);
    writeReply(q, a);
    log.push({ q, a, note, label: threeWordLabel(q) });
    renderRail();
  }

  function select(note) {
    if (selected === note) return;
    selected?.classList.remove("is-selected");
    selected = note;

    if (!note) {
      bar.classList.remove("is-on");
      closePop();
      return;
    }

    note.classList.add("is-selected");
    note.style.zIndex = String(++topZ);
    bar.classList.add("is-on");
    syncBar();
  }

  /* ---------- Popover open/close ---------- */
  let openPop = null;

  function closePop() {
    if (!openPop) return;
    pops[openPop].hidden = true;
    bar.querySelector(`[data-menu="${openPop}"]`)?.setAttribute("aria-expanded", "false");
    openPop = null;
  }

  function togglePop(name, btn) {
    if (openPop === name) { closePop(); return; }
    closePop();

    const pop = pops[name];
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    openPop = name;

    const b = btn.getBoundingClientRect();
    const boardBox = board.getBoundingClientRect();
    const barBox = bar.getBoundingClientRect();

    let left = b.left - boardBox.left + b.width / 2 - pop.offsetWidth / 2;
    left = Math.max(8, Math.min(left, boardBox.width - pop.offsetWidth - 8));
    pop.style.left = `${left}px`;

    // Colour sits above the bar as in the reference, but the board clips its
    // overflow — so flip it below when there isn't room.
    const above = barBox.top - boardBox.top - pop.offsetHeight - 8;
    const below = barBox.bottom - boardBox.top + 8;
    pop.style.top = `${name === "color" && above >= 8 ? above : below}px`;
  }

  /* ---------- Reflect the selected note in the toolbar ---------- */
  function syncBar() {
    if (!selected) return;

    const state = {
      bold: safeState("bold"),
      strike: safeState("strikeThrough"),
      list: safeState("insertOrderedList"),
    };
    bar.querySelectorAll("[data-act]").forEach(btn => {
      const on = state[btn.dataset.act];
      if (on === undefined) return;
      btn.classList.toggle("is-active", on);
      if (btn.hasAttribute("aria-pressed")) btn.setAttribute("aria-pressed", String(on));
    });

    const size = +selected.dataset.size;
    const font = NOTE_FONTS[+selected.dataset.font].css;

    bar.querySelector(".bb-dot").style.background = selected.dataset.colour;
    if (sizeLabel) sizeLabel.textContent = String(size);
    if (sizeInput) sizeInput.value = String(size);

    pops.color.querySelectorAll(".bb-chip").forEach(c =>
      c.classList.toggle("is-on", c.dataset.colour === selected.dataset.colour));
    pops.font.querySelectorAll(".bb-item").forEach(i =>
      i.classList.toggle("is-on", NOTE_FONTS[+i.dataset.font].css === font));
    pops.size.querySelectorAll(".bb-item").forEach(i =>
      i.classList.toggle("is-on", +i.dataset.size === size));
  }

  function setSize(px) {
    if (!selected) return;
    const size = Math.max(8, Math.min(200, px));
    selected.dataset.size = String(size);
    bodyOf(selected).style.fontSize = `${size}px`;
    syncBar();
  }

  /* ---------- Toolbar ---------- */
  // Keep the caret: mousedown in the bar would otherwise blur the note and
  // collapse the selection before the command runs.
  const holdCaret = e => {
    if (e.target.closest("input")) return;
    e.preventDefault();
  };
  bar.addEventListener("mousedown", holdCaret);
  Object.values(pops).forEach(p => p.addEventListener("mousedown", holdCaret));

  bar.addEventListener("click", e => {
    const menuBtn = e.target.closest("[data-menu]");
    if (menuBtn) { togglePop(menuBtn.dataset.menu, menuBtn); return; }

    const btn = e.target.closest("[data-act]");
    if (!btn || !selected) return;
    closePop();

    bodyOf(selected).focus();
    const cmd = {
      bold: "bold", strike: "strikeThrough",
      link: "createLink", list: "insertOrderedList",
    }[btn.dataset.act];
    if (!cmd) return;

    if (btn.dataset.act === "link") {
      const sel = getSelection();
      savedRange = sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
      togglePop("link", btn);
      linkInput.value = "";
      linkInput.focus();
      return;
    }

    document.execCommand(cmd, false, null);
    syncBar();
  });

  /* ---------- Popover actions ---------- */
  pops.color.addEventListener("click", e => {
    const chip = e.target.closest(".bb-chip");
    if (!chip || !selected) return;
    selected.dataset.colour = chip.dataset.colour;
    selected.style.background = chip.dataset.colour;
    syncBar();
    closePop();
  });

  pops.font.addEventListener("click", e => {
    const item = e.target.closest(".bb-item");
    if (!item || !selected) return;
    selected.dataset.font = item.dataset.font;
    bodyOf(selected).style.fontFamily = NOTE_FONTS[+item.dataset.font].css;
    syncBar();
    closePop();
  });

  pops.size.addEventListener("click", e => {
    const item = e.target.closest(".bb-item");
    if (!item) return;
    setSize(+item.dataset.size);
    closePop();
  });

  linkInput.addEventListener("keydown", e => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const url = linkInput.value.trim();
    closePop();
    if (!url || !savedRange || !selected) return;

    const body = bodyOf(selected);
    body.focus();
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(savedRange);
    document.execCommand("createLink", false, url);
    syncBar();
  });

  sizeInput?.addEventListener("input", () => {
    const v = parseInt(sizeInput.value, 10);
    if (!isNaN(v)) setSize(v);
  });
  sizeInput?.addEventListener("keydown", e => {
    if (e.key === "Enter") { e.preventDefault(); closePop(); bodyOf(selected)?.focus(); }
  });

  /* ---------- Add ---------- */
  addBtn?.addEventListener("click", () => {
    const n = canvas.querySelectorAll(".note").length;
    const note = makeNote({
      x: RAIL_GUTTER + 6 + (n % 3) * 26,
      y: 74 + (n % 3) * 26,
      colour: NOTE_COLOURS[(n + 4) % NOTE_COLOURS.length],
    });
    select(note);
    bodyOf(note).focus();
  });

  /* ---------- Dragging ---------- */
  // Dragging starts on the note body only; the text area keeps normal caret
  // placement, so a note stays typable while still draggable.
  let drag = null;

  canvas.addEventListener("pointerdown", e => {
    const note = e.target.closest(".note");
    select(note || null);

    // The hero shows the selected card's answer, in handwriting; with nothing
    // selected it falls back to the intro. The board is the index, the hero
    // is where an answer is actually read.
    const turns = note && history.get(note);
    if (turns?.length) {
      const last = turns[turns.length - 1];
      writeReply(last.q, last.a);
    } else if (!note) {
      closeReply();
    }
    if (!note || e.target.closest(".note-text")) return;

    const box = note.getBoundingClientRect();
    drag = {
      note,
      dx: e.clientX - box.left,
      dy: e.clientY - box.top,
      cv: canvas.getBoundingClientRect(),
    };
    note.classList.add("is-dragging");
    // Capture can throw if the pointer is already gone; dragging still works
    // via the canvas listeners without it.
    try { note.setPointerCapture(e.pointerId); } catch {}
  });

  canvas.addEventListener("pointermove", e => {
    if (!drag) return;
    const x = e.clientX - drag.cv.left - drag.dx + canvas.scrollLeft;
    const y = e.clientY - drag.cv.top - drag.dy + canvas.scrollTop;
    drag.note.style.left = `${Math.max(RAIL_GUTTER, x)}px`;
    drag.note.style.top = `${Math.max(0, y)}px`;
  });

  const endDrag = () => {
    if (!drag) return;
    drag.note.classList.remove("is-dragging");
    drag = null;
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  /* ---------- Asking ---------- */
  // Enter sends the question, and only Enter: clicking away used to send too,
  // so moving a note or tidying the wording rewrote the answer on the left
  // without anyone asking for it. Shift+Enter is still a line break, so a note
  // can hold more than one line.
  canvas.addEventListener("keydown", e => {
    if (!e.target.closest(".note-text")) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      ask(e.target.closest(".note"));
    }
  });

  /* ---------- Hover bubble ---------- */
  /* ---------- Dismissal ---------- */
  document.addEventListener("pointerdown", e => {
    if (!e.target.closest(".bb-pop") && !e.target.closest("[data-menu]")) closePop();
    if (!board.contains(e.target)) { select(null); closeReply(); }
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closePop();
  });

  document.addEventListener("selectionchange", () => {
    if (selected && document.activeElement === bodyOf(selected)) syncBar();
  });

  /* ---------- Seed ---------- */
  // Side by side when there is room, stacked when there isn't. Measured off
  // the viewport, not the canvas: the board starts hidden (headline mode),
  // so its own clientWidth is 0 at this point.
  const roomy = window.matchMedia("(min-width: 1024px)").matches;

  // The seeded notes show their local answer at once, so the board is never
  // blank while a first request is in flight.
  const seed = (note, q) => {
    const a = cannedAnswer(q);
    history.set(note, [{ q, a }]);
    log.push({ q, a, note, label: threeWordLabel(q) });
    renderRail();
  };

  seed(makeNote({
    x: 48, y: 74,
    text: "<ol><li>Tell me about Joseph.</li></ol>",
    colour: NOTE_COLOURS[4],
  }), "Tell me about Joseph.");

  seed(makeNote({
    x: roomy ? 248 : 62,
    y: roomy ? 128 : 266,
    text: "What are the design skills he has?",
    colour: NOTE_COLOURS[7],
  }), "What are the design skills he has?");
}
