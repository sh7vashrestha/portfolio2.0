document.addEventListener("DOMContentLoaded", () => {
  const links = [...document.querySelectorAll(".nav a")];
  const sections = links
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  if (sections.length === 0) return;

  const topbar = document.querySelector(".topbar");

  const update = () => {
    const offset = (topbar ? topbar.offsetHeight : 0) + 24;
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    let current = null;
    if (atBottom) {
      current = sections[sections.length - 1];
    } else {
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= offset) current = section;
      }
    }
    links.forEach((a) => {
      if (current && a.getAttribute("href") === `#${current.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", update);
  update();
});
