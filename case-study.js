/* Inside the portfolio's modal, the modal's Close floats over this page's
   top-right corner. Mark the page so its header can leave room for it. */
if (window.self !== window.top) document.documentElement.classList.add("in-portal");

/* The prototype and the design system open in a tab of their own: they want
 * the whole window, and inside the portal modal they were running in a panel
 * a third of that size. The app's own close control still needs somewhere to
 * go back to, and that is the portfolio itself — closing the product should
 * land on the work, not back on the page you had already read. It is stamped
 * at run time from this page's own origin, so it stays correct on localhost
 * as well as on the deployed site.
 */
(function () {
  const home = new URL("/", location.href).toString();
  document.querySelectorAll("a[data-embed]").forEach(a => {
    const url = new URL(a.getAttribute("href"), location.href);
    url.searchParams.set("back", home);
    a.setAttribute("href", url.toString());
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener");
  });
})();

/* Case study motion.
 *
 * The portfolio brings a block in as it enters the viewport — 28px up, over
 * .8s on an expo curve, with a small stagger between siblings. A case study
 * that simply exists on load reads as a different site even when the type and
 * the spacing match, so this reproduces exactly that behaviour and nothing
 * more: no cursor, no preloader, no typewriter, which would be theatre in a
 * document you are reading rather than a home page you are arriving at.
 */
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

/* target="_blank" is a request, not a guarantee — some browsers navigate the
   current tab regardless. Open the window from the click so the case study
   stays put behind it. */
(function () {
  document.addEventListener("click", e => {
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest?.('a[target="_blank"]');
    if (!a || !/^https?:/i.test(a.href)) return;
    e.preventDefault();
    window.open(a.href, "_blank", "noopener");
  });
})();
