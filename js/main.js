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
    sections.forEach((section) => section.classList.toggle("is-active", section === current));
    links.forEach((a) => {
      if (current && a.getAttribute("href") === `#${current.id}`) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  const main = document.querySelector("main");
  const layoutSpine = () => {
    const heads = sections.map((section) => section.querySelector("h2")).filter(Boolean);
    if (!main || heads.length < 2) return;
    const base = main.getBoundingClientRect().top;
    const mid = (el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2 - base; };
    const top = mid(heads[0]);
    main.style.setProperty("--spine-top", `${top}px`);
    main.style.setProperty("--spine-h", `${mid(heads[heads.length - 1]) - top}px`);
  };

  let ticking = false;
  window.addEventListener("scroll", () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { update(); ticking = false; });
  }, { passive: true });
  window.addEventListener("resize", () => { layoutSpine(); update(); });
  window.addEventListener("load", layoutSpine);
  layoutSpine();
  update();
});
