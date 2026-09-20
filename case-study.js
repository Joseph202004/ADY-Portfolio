/* Case study motion.
 *
 * The portfolio brings a block in as it enters the viewport — 28px up, over
 * .8s on an expo curve, with a small stagger between siblings. A case study
 * that simply exists on load reads as a different site even when the type and
 * the spacing match, so this reproduces exactly that behaviour and nothing
 * more: no cursor, no preloader, no typewriter, which would be theatre in a
 * document you are reading rather than a home page you are arriving at.
 */
/* The prototype and the design system open in place — in this frame, which is
 * the portal modal when the study is opened from the work grid. The app's own
 * close control needs somewhere to go back to, and that is this page, wherever
 * it happens to be served from, so the link is stamped at run time rather than
 * hard-coded to the production host.
 */
(function () {
  const here = location.href.split("#")[0];
  document.querySelectorAll("a[data-embed]").forEach(a => {
    const url = new URL(a.getAttribute("href"), location.href);
    url.searchParams.set("back", here);
    a.setAttribute("href", url.toString());
    a.removeAttribute("target");
    a.removeAttribute("rel");
  });
})();

(function () {
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Everything that should arrive rather than appear. Sections carry the
  // reveal themselves; the repeated rows inside a grid get a stagger so a
  // list of eight assembles instead of flashing.
  const blocks = document.querySelectorAll(
    ".hero > *, .module .wrap > *, .module > .wrap, .case-figure, .design, " +
    ".stat-row div, .flaws li, .loop li, .pain-grid article, .story-card, " +
    ".feature-card, .metrics-grid div, .flow-steps div, .process-list li, " +
    ".response-row, .audience-list p, .principles span"
  );

  if (REDUCED || !("IntersectionObserver" in window)) {
    blocks.forEach(el => el.classList.add("is-in"));
    return;
  }

  blocks.forEach(el => el.classList.add("reveal"));

  // Stagger only within a row of siblings, capped: a 37-item list should not
  // end on a two-second delay.
  document.querySelectorAll(
    ".stat-row, .flaws, .loop, .pain-grid, .story-grid, .feature-grid, " +
    ".metrics-grid, .flow-steps, .process-list, .response-table, " +
    ".audience-list, .principles"
  ).forEach(group => {
    [...group.children].forEach((child, i) => {
      if (child.classList.contains("reveal")) {
        child.style.setProperty("--d", `${Math.min(i, 6) * 70}ms`);
      }
    });
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  blocks.forEach(el => io.observe(el));
})();
