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
function initHeroVideo() {
  const video = document.getElementById("hero-video");
  if (!video) return;

  if (REDUCED) {
    // The visible pause control was removed by request, so this is the only
    // remaining way to stop playback: honour the OS "reduce motion" setting
    // by not autoplaying and exposing the browser's own controls instead.
    video.controls = true;
    return;
  }

  video.play().catch(() => { /* autoplay blocked by the browser */ });

  // Stop decoding frames nobody is looking at
  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else if (!video.paused) video.pause();
    });
  }, { threshold: 0.15 }).observe(video);
}

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
  const video = document.getElementById("hero-video");
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
      if (video) video.pause();
      resetTypewriter(title);        // rewind, then replay the typing
      typewrite(title);
    } else {
      resetTypewriter(title);        // stop typing into the hidden heading
      if (video && !REDUCED) video.play().catch(() => {});
    }

    // Layout changed height, so parallax offsets need recomputing
    collectParallax();
    runParallax();
  }

  setMode(false);                    // start on the drawing

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
   11. PRELOADER
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
  initHeroVideo();
  initHeroMode();
  initHeader();

  tick();
  setInterval(tick, 30000);
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  runParallax();
  addEventListener("resize", () => { collectParallax(); runParallax(); }, { passive: true });

  initPreloader(() => {
    // Play the hero once the curtain lifts
    const hero = document.querySelector(".hero .display");
    const sub = document.querySelector(".hero-sub");

    const inVideoMode = document.querySelector(".hero").classList.contains("hero--video");
    if (hero && hero.hasAttribute("data-typewriter") && !inVideoMode) {
      typewrite(hero);
    } else if (hero && !inVideoMode) {
      hero.classList.add("is-revealed", "is-in");
    }

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
