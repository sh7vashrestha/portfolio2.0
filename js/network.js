(() => {
  const canvas = document.querySelector(".net");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const column = document.querySelector("main.wrap");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TEAL = "15, 118, 110";
  const LINK = 150;

  let w = 0, h = 0, dpr = 1, nodes = [], pulses = [], colL = 0, colR = 0;
  let pointer = null, running = false, raf = 0;

  const fade = (x) => (x > colL && x < colR ? 0.35 : 1);

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = document.documentElement.clientWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (column) {
      const r = column.getBoundingClientRect();
      colL = r.left; colR = r.right;
    }
    const count = Math.max(18, Math.min(90, Math.round((w * h) / 13000)));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: 1.4 + Math.random() * 1.6,
    }));
    pulses = [];
    draw();
  }

  function neighbors() {
    const pairs = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) pairs.push([nodes[i], nodes[j], d]);
      }
    }
    return pairs;
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const pairs = neighbors();
    ctx.lineWidth = 1;
    for (const [a, b, d] of pairs) {
      const alpha = (1 - d / LINK) * 0.28 * fade((a.x + b.x) / 2);
      ctx.strokeStyle = `rgba(${TEAL}, ${alpha})`;
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    if (pointer) {
      for (const n of nodes) {
        const d = Math.hypot(n.x - pointer.x, n.y - pointer.y);
        if (d < 180) {
          ctx.strokeStyle = `rgba(${TEAL}, ${(1 - d / 180) * 0.4})`;
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(pointer.x, pointer.y); ctx.stroke();
        }
      }
    }
    for (const n of nodes) {
      ctx.fillStyle = `rgba(${TEAL}, ${0.5 * fade(n.x)})`;
      ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    }
    for (const p of pulses) {
      const x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
      const alpha = Math.sin(p.t * Math.PI) * 0.85 * fade(x);
      ctx.fillStyle = `rgba(${TEAL}, ${alpha})`;
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, Math.PI * 2); ctx.fill();
    }
    return pairs;
  }

  function step() {
    for (const n of nodes) {
      n.x += n.vx; n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;
    }
    pulses = pulses.filter((p) => (p.t += p.speed) < 1);
    const pairs = draw();
    if (pulses.length < 6 && pairs.length && Math.random() < 0.05) {
      const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
      pulses.push(Math.random() < 0.5 ? { a, b, t: 0, speed: 0.012 } : { a: b, b: a, t: 0, speed: 0.012 });
    }
    raf = requestAnimationFrame(step);
  }

  function sync() {
    const should = !document.hidden && !reduceMotion.matches;
    if (should && !running) { running = true; raf = requestAnimationFrame(step); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); draw(); }
  }

  window.addEventListener("pointermove", (e) => {
    pointer = e.pointerType === "mouse" ? { x: e.clientX, y: e.clientY } : null;
  }, { passive: true });
  document.addEventListener("pointerleave", () => { pointer = null; });
  let lastY = window.scrollY;
  window.addEventListener("scroll", () => {
    const dy = (window.scrollY - lastY) * 0.25;
    lastY = window.scrollY;
    for (const n of nodes) {
      n.y -= dy;
      if (n.y < 0) n.y += h;
      else if (n.y > h) n.y -= h;
    }
    if (!running) draw();
  }, { passive: true });
  document.addEventListener("visibilitychange", sync);
  reduceMotion.addEventListener?.("change", sync);

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 150);
  });

  resize();
  sync();
})();
