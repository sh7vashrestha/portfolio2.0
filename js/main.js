document.addEventListener("DOMContentLoaded", () => {
  const links = new Map(
    [...document.querySelectorAll(".nav a")].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const sections = [...links.keys()]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || sections.length === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute("aria-current"));
        links.get(entry.target.id)?.setAttribute("aria-current", "true");
      });
    },
    { rootMargin: "-45% 0px -50% 0px" }
  );

  sections.forEach((section) => observer.observe(section));
});
