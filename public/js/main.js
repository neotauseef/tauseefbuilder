// Minimal, no-framework. Everything is progressive enhancement.

(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Scroll-reveal for section headings and case blocks.
  var targets = document.querySelectorAll(".section__mark, .page-hero__eyebrow, .case, .svc, .stat, .engage__step, .person");
  if (!targets.length) return;

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (el) { el.classList.add("reveal", "is-in"); });
    return;
  }

  targets.forEach(function (el) { el.classList.add("reveal"); });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

  targets.forEach(function (el) { io.observe(el); });
})();
