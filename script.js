/* ============================================================
   Behaviour: preloader, typographic split text, kinetic weight,
   custom cursor, marquee, parallax, magnetic links, reveals.
   ============================================================ */

const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE_POINTER = window.matchMedia("(pointer: fine)").matches;

/* ---------- Content you edit ---------- */
const CLIENTS = [
  "Acme", "Northwind", "Contoso", "Globex", "Initech",
  "Umbrella", "Soylent", "Hooli", "Stark", "Wayne",
];

const SERVICES = [
  { num: "001", title: "UX Design", lede: "Understand before designing.",
    desc: "I turn user needs into flows that reduce friction and guesswork, so your product just makes sense." },
  { num: "002", title: "UI Design", lede: "Clarity, hierarchy, and detail.",
    desc: "Interfaces that look sharp and drive action, balancing usability with a personality that fits your brand." },
  { num: "003", title: "Design System", lede: "Consistency that scales.",
    desc: "Systems that let your team ship faster and stay aligned as the product grows." },
  { num: "004", title: "Accessibility", lede: "Design for everyone.",
    desc: "Inclusive, WCAG-compliant experiences that widen your reach, so no one gets left out." },
];

const WORK = [
  { title: "Project One",   tags: "Web app",        tone: "",     href: "#" },
  { title: "Project Two",   tags: "App, Web app",   tone: "alt",  href: "#" },
  { title: "Project Three", tags: "Design system",  tone: "cool", href: "#" },
  { title: "Project Four",  tags: "Brand, Web",     tone: "warm", href: "#" },
];

/* ============================================================
   1. RENDER CONTENT
   ============================================================ */
const marqueeEl = document.getElementById("marquee");
if (marqueeEl) {
  const row = CLIENTS.map(c => `<span class="marquee-item">${c}</span>`).join("");
  marqueeEl.innerHTML = row + row; // duplicated for a seamless -50% loop
}

const servicesEl = document.getElementById("services");
if (servicesEl) {
  servicesEl.innerHTML = SERVICES.map((s, i) => `
    <article class="service reveal" style="--d:${i * 80}ms">
      <span class="num">${s.num}</span>
      <h3>${s.title}</h3>
      <div>
        <p class="lede">${s.lede}</p>
        <p class="desc">${s.desc}</p>
      </div>
    </article>
  `).join("");
}

const workGrid = document.getElementById("work-grid");
if (workGrid) {
  workGrid.innerHTML = WORK.map((w, i) => `
    <a class="work-card" href="${w.href}" data-cursor="View">
      <figure class="frame ratio-107" data-parallax="${i % 2 ? 22 : -22}">
        <div class="ph ${w.tone}">${w.title}</div>
      </figure>
      <div class="work-meta reveal" style="--d:${i * 60}ms">
        <span class="work-title">${w.title}</span>
        <span class="work-tags">${w.tags}</span>
      </div>
    </a>
  `).join("");
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
        const parts = child.textContent.split(/(\s+)/).filter(Boolean);
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

function typewrite(el, { speed = 38, jitter = 26 } = {}) {
  const chars = [...el.querySelectorAll(".char")];
  if (!chars.length) return Promise.resolve();

  if (REDUCED) {
    el.classList.add("is-revealed", "is-in");
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
  const RADIUS = 180, MIN_W = 250, MAX_W = 800;

  function update() {
    raf = null;
    chars.forEach(c => {
      const r = c.getBoundingClientRect();
      const dx = mx - (r.left + r.width / 2);
      const dy = my - (r.top + r.height / 2);
      const dist = Math.hypot(dx, dy);
      const t = Math.max(0, 1 - dist / RADIUS);
      const eased = t * t;                         // falloff
      c.style.setProperty("--w", Math.round(MIN_W + eased * (MAX_W - MIN_W)));
    });
  }

  el.addEventListener("mousemove", e => {
    mx = e.clientX; my = e.clientY;
    if (!raf) raf = requestAnimationFrame(update);
  }, { passive: true });

  el.addEventListener("mouseleave", () => {
    mx = my = -9999;
    if (!raf) raf = requestAnimationFrame(update);
  });
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

function observeAll() {
  // [data-typewriter] is driven by typewrite() after the preloader, not by scroll.
  document.querySelectorAll(
    ".reveal, .frame, .eyebrow, [data-split]:not([data-typewriter]), [data-split-lines], .info-grid, .explore-grid"
  ).forEach(el => revealIO.observe(el));
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
const SCROLLY_CAPTIONS = [
  "Research, stakeholder interviews and an audit of what already exists — so decisions are grounded in evidence rather than taste.",
  "Flows, information architecture and scope. We agree what matters most before a single screen gets designed.",
  "Interface design and prototypes, iterated against real content and real edge cases.",
  "Tokens, components and documentation, so the team can build consistently without asking me first.",
  "Handoff, QA and support through build — design is not done until it is live and working.",
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

  let active = -1;
  let raf = null;

  const setActive = i => {
    if (i === active) return;
    active = i;
    items.forEach((el, n) => el.classList.toggle("is-active", n === i));
    medias.forEach((el, n) => el.classList.toggle("is-active", n === i));
    if (caption) {
      caption.classList.add("is-swapping");
      setTimeout(() => {
        caption.textContent = SCROLLY_CAPTIONS[i] || "";
        caption.classList.remove("is-swapping");
      }, 180);
    }
  };

  const isPinned = () => matchMedia("(min-width: 900px)").matches;

  function update() {
    raf = null;

    if (!isPinned()) {           // mobile: everything visible, no transform
      list.style.transform = "";
      items.forEach(el => el.classList.add("is-active"));
      // Reset so a resize back to desktop re-applies a single active step —
      // otherwise setActive() early-returns and every item stays lit.
      active = -1;
      return;
    }

    const travel = section.offsetHeight - innerHeight;
    const scrolled = -section.getBoundingClientRect().top;
    const p = Math.min(1, Math.max(0, travel > 0 ? scrolled / travel : 0));

    // Continuous position so the list tracks the scroll 1:1
    const exact = p * (items.length - 1);
    const itemH = items[0].offsetHeight;
    list.style.transform = `translateY(${-(exact * itemH) + itemH}px)`;  // centre row

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

  function setMode(showText) {
    hero.classList.toggle("hero--text", showText);
    hero.classList.toggle("hero--video", !showText);

    // Page-level mode: "full" shows the whole site, "video" strips it back
    // to just the handwritten nav and the drawing.
    document.body.classList.toggle("mode-full", showText);
    document.body.classList.toggle("mode-video", !showText);

    btn.setAttribute("aria-pressed", String(showText));
    if (label) label.textContent = showText ? "Show video" : "Show headline";

    // Nav speaks in Adi's voice alongside the drawing, plain wording otherwise
    navLinks.forEach(a => {
      const next = showText ? a.dataset.full : a.dataset.hand;
      if (next) a.textContent = next;
    });

    if (showText) {
      resetTypewriter(title);        // rewind, then replay the typing
      // While the preloader is still up, the curtain callback starts the
      // run instead — two overlapping runs fight over the same chars.
      if (document.body.classList.contains("is-ready")) typewrite(title);
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

  btn.addEventListener("click", () =>
    setMode(btn.getAttribute("aria-pressed") !== "true"));

  // Expose so the preloader can start the right mode
  initHeroMode.setMode = setMode;
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

  function glideTo(y) {
    target = clamp(y);
    if (running) return;
    running = true;
    requestAnimationFrame(loop);
  }

  addEventListener("wheel", e => {
    // Leave trackpad pinch-zoom and opted-out panes alone
    if (e.ctrlKey || e.defaultPrevented) return;
    if (e.target.closest?.("[data-native-scroll]")) return;

    e.preventDefault();
    glideTo(target + e.deltaY);
  }, { passive: false });

  addEventListener("keydown", e => {
    // contenteditable is neither INPUT nor TEXTAREA, but typing a space in a
    // sticky note must insert a space, not page down
    const el = document.activeElement;
    const tag = el?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;

    const step = {
      ArrowDown: KEY_STEP,
      ArrowUp: -KEY_STEP,
      PageDown: window.innerHeight * 0.9,
      PageUp: -window.innerHeight * 0.9,
      " ": window.innerHeight * 0.9,
    }[e.key];

    if (step !== undefined) {
      e.preventDefault();
      glideTo(target + step);
    } else if (e.key === "Home") {
      e.preventDefault();
      glideTo(0);
    } else if (e.key === "End") {
      e.preventDefault();
      glideTo(maxScroll());
    }
  });

  // In-page links ease through the same loop instead of jumping
  document.querySelectorAll('a[href^="#"]').forEach(a => {
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
  document.querySelectorAll("[data-split-lines]").forEach(el => {
    try { splitLines(el); } catch (e) { console.error("splitLines failed", el, e); }
  });
  document.querySelectorAll("[data-kinetic]").forEach(initKinetic);

  collectParallax();
  observeAll();
  initCursor();
  initMagnetic();
  initMarquee();
  initScrolly();
  initHeroMode();
  initHeader();
  initSmoothScroll();
  window.Handwriting?.load("fonts/mynerve-strokes.json").catch(() => {});
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

    const inVideoMode = document.querySelector(".hero").classList.contains("hero--video");
    if (hero && hero.hasAttribute("data-typewriter") && !inVideoMode) {
      typewrite(hero);
    } else if (hero && !inVideoMode) {
      hero.classList.add("is-revealed", "is-in");
    }

    // Starting in video mode: write the intro once the curtain is up
    if (inVideoMode) setTimeout(() => initBoard.writeIntro?.(), 260);

    setTimeout(() => sub && sub.classList.add("is-revealed", "is-in"), 260);
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

const NOTE_AUTHOR = "Navanta Design Team";

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
   Canned responder.

   There is no backend here, and a browser-side API key would be
   readable by anyone viewing source — so replies are matched
   locally. To hand this to a real model later, replace the body
   of answerFor() with a fetch to your own endpoint (it may
   return a promise; the caller awaits it).
   ------------------------------------------------------------ */
const ANSWERS = [
  {
    match: /warehouse|wearhouse|outlet|store/i,
    reply: "No. A <strong>Fossil Outlet Store</strong> is a retail store located in an outlet shopping center, not a warehouse.",
  },
  {
    match: /design skill|skills|what can|capab/i,
    reply: "End-to-end product design: <strong>UX research, UI systems, prototyping and motion</strong> — plus enough front-end to ship it.",
  },
  {
    match: /who is|tell me about|about (joseph|adi)/i,
    reply: "A product designer with <strong>10 years</strong> designing digital products end-to-end, working from user needs through to shipped interfaces.",
  },
  {
    match: /process|how do you work|method/i,
    reply: "Five stages: <strong>Discover, Define, Design, Systemise, Ship</strong> — each one grounded in evidence rather than taste.",
  },
  {
    match: /contact|hire|available|work together/i,
    reply: "Say hi at <strong>hello@example.com</strong> — always happy to talk about new work.",
  },
];

function answerFor(question) {
  const hit = ANSWERS.find(a => a.match.test(question));
  if (hit) return hit.reply;
  return `I don't have a note on that yet — try asking about the ` +
         `<strong>process</strong>, <strong>design skills</strong> or <strong>getting in touch</strong>.`;
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

    const tip = document.createElement("div");
    tip.className = "note-tip";
    tip.hidden = true;

    note.append(body, by, tip);
    canvas.appendChild(note);

    // Every question typed into this box, newest last
    history.set(note, []);
    return note;
  }

  /* ---------- Ask / answer ---------- */
  function renderTip(note) {
    const turns = history.get(note) || [];
    const tip = note.querySelector(".note-tip");

    if (!turns.length) { tip.hidden = true; return; }
    tip.hidden = false;
    tip.innerHTML = [...turns].reverse().map(t =>
      `<div class="tip-turn"><div class="tip-q">${t.q}</div>` +
      `<div class="tip-a">${t.a}</div></div>`).join("");
  }

  /* ---------- Live handwritten reply ---------- */
  // Writes the newest answer over the showreel in Adi Hand. When a real
  // agent is connected, this is already the surface its replies land on —
  // only answerFor() changes.
  const reply = document.getElementById("hero-reply");
  const replyQ = document.getElementById("hero-reply-q");
  const replyA = document.getElementById("hero-reply-a");
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

  // One writer, used for the intro and for every reply: it lays characters
  // down one at a time under a crosshair that travels with the pen.
  function writeHand(host, html, token) {
    // Real pen strokes when the centreline data has loaded; otherwise the
    // per-glyph wipe below, so a slow or failed fetch never blanks the text.
    if (window.Handwriting?.ready) {
      return window.Handwriting.write(host, charsOf(html), { live: token })
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

      const movePen = el => {
        const box = el.getBoundingClientRect();
        const base = host.getBoundingClientRect();
        const x = box.right - base.left;
        const y = box.top - base.top + box.height * 0.62;
        pen.style.setProperty("--x", `${x}px`);
        pen.style.setProperty("--y", `${y}px`);
        pen.style.transform = `translate(${x}px, ${y}px)`;
      };

      let i = 0;
      let word = null;          // characters are grouped so words never split

      (function stroke() {
        if (!token()) return resolve();

        if (i >= chars.length) {
          pen.classList.add("is-done");
          setTimeout(() => { pen.remove(); resolve(); }, 700);
          return;
        }

        const { ch, bold } = chars[i++];

        if (ch === " ") {
          word = null;          // a line may break here, but not inside a word
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
          movePen(span);
        }

        // A hand slows at the end of a word and lifts at punctuation
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
    replyQ.textContent = q;
    writeHand(replyA, a, () => mine === writeToken);
  }

  /* ---------- Intro ---------- */
  // The two lines the showreel used to play, written rather than filmed.
  const INTRO = ["Hi, I'm Adi", "I like to draw"];
  let introRun = false;

  async function writeIntro() {
    const l1 = document.getElementById("hero-intro-1");
    const l2 = document.getElementById("hero-intro-2");
    if (!l1 || !l2 || introRun) return;
    introRun = true;

    const mine = ++writeToken;
    const live = () => mine === writeToken;

    await writeHand(l1, INTRO[0], live);
    if (live()) await writeHand(l2, INTRO[1], live);
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

  function placeTip(note) {
    const tip = note.querySelector(".note-tip");
    if (tip.hidden) return;

    // The tip is absolutely positioned inside the note, so its offsets are
    // note-relative — but it has to be clamped against the canvas. Work the
    // position out in canvas space, then subtract the note's own offset.
    const cv = canvas.getBoundingClientRect();
    const noteW = note.offsetWidth;
    const noteH = note.offsetHeight;
    const tipW = tip.offsetWidth;
    const tipH = tip.offsetHeight;

    let x = note.offsetLeft + noteW / 2 - tipW / 2;
    x = Math.max(8, Math.min(x, cv.width - tipW - 8));

    // Prefer above the note; drop below when it would be clipped
    const above = note.offsetTop - tipH - 10;
    const y = above >= canvas.scrollTop ? above : note.offsetTop + noteH + 10;

    tip.style.left = `${x - note.offsetLeft}px`;
    tip.style.top = `${y - note.offsetTop}px`;
  }

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
    renderTip(note);
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
  // Cmd/Ctrl+Enter asks without leaving the note; blurring asks too, so a
  // question is never lost just because the user clicked away.
  canvas.addEventListener("keydown", e => {
    if (!e.target.closest(".note-text")) return;
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      ask(e.target.closest(".note"));
    }
  });

  canvas.addEventListener("focusout", e => {
    const note = e.target.closest(".note");
    if (note && e.target.classList.contains("note-text")) ask(note);
  }, true);

  /* ---------- Hover bubble ---------- */
  canvas.addEventListener("pointerover", e => {
    const note = e.target.closest(".note");
    if (!note || drag) return;
    const tip = note.querySelector(".note-tip");
    if (tip.hidden) return;
    placeTip(note);
    tip.classList.add("is-on");
  });

  canvas.addEventListener("pointerout", e => {
    const note = e.target.closest(".note");
    if (!note || note.contains(e.relatedTarget)) return;
    note.querySelector(".note-tip").classList.remove("is-on");
  });

  /* ---------- Dismissal ---------- */
  document.addEventListener("pointerdown", e => {
    if (!e.target.closest(".bb-pop") && !e.target.closest("[data-menu]")) closePop();
    if (!board.contains(e.target)) select(null);
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

  const seed = (note, q) => {
    const a = answerFor(q);
    history.set(note, [{ q, a }]);
    log.push({ q, a, note, label: threeWordLabel(q) });
    renderTip(note);
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
