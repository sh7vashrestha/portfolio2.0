(() => {
  const canvas = document.querySelector(".net");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const column = document.querySelector("main.wrap");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TEAL = "15, 118, 110";
  const SIZES = [4, 6, 7, 6, 5, 7, 6, 5, 6, 4, 3];

  let w = 0, h = 0, dpr = 1, colL = 0, colR = 0;
  let layers = [], pulses = [], running = false, raf = 0, frame = 0;

  const fade = (x) => (x > colL && x < colR ? 0.35 : 1);

  function rand(seed) {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }

  function layout() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = document.documentElement.clientWidth;
    h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sy = window.scrollY;
    if (column) {
      const r = column.getBoundingClientRect();
      colL = r.left; colR = r.right;
    }
    const anchors = [
      ...document.querySelectorAll(".intro, .sec, .sec .h2-follow, .foot"),
    ];
    const ys = anchors.map((el) => {
      const top = el.getBoundingClientRect().top + sy;
      return el.classList.contains("h2-follow") ? top - 22 : top;
    });
    ys[0] = Math.max(ys[0] - 8, 70);
    const pad = Math.max(24, w * 0.04);
    layers = ys.map((y, i) => {
      const n = SIZES[i % SIZES.length] + (w < 600 ? -1 : 0);
      const section = anchors[i].closest(".sec");
      return {
        y,
        section,
        head: anchors[i].classList.contains("sec"),
        label: i === 0 ? "input" : i === ys.length - 1 ? "output" : `layer ${i}`,
        nodes: Array.from({ length: n }, (_, k) => ({
          x: pad + ((w - 2 * pad) * (k + 0.5)) / n + (rand(i * 31 + k) - 0.5) * 40,
          glow: 0,
        })),
      };
    });
    pulses = [];
    draw();
  }

  function spawn(li, from) {
    const next = layers[li + 1];
    if (!next) return;
    const a = from || layers[li].nodes[Math.floor(Math.random() * layers[li].nodes.length)];
    const b = next.nodes[Math.floor(Math.random() * next.nodes.length)];
    const len = Math.hypot(b.x - a.x, next.y - layers[li].y);
    pulses.push({ li, a, b, t: 0, speed: 4 / Math.max(len, 1) });
  }

  function draw() {
    const sy = window.scrollY;
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let i = 0; i < layers.length - 1; i++) {
      const L = layers[i], N = layers[i + 1];
      if (N.y - sy < -20 || L.y - sy > h + 20) continue;
      for (const a of L.nodes) {
        for (const b of N.nodes) {
          ctx.strokeStyle = `rgba(${TEAL}, ${0.13 * fade((a.x + b.x) / 2)})`;
          ctx.beginPath(); ctx.moveTo(a.x, L.y - sy); ctx.lineTo(b.x, N.y - sy); ctx.stroke();
        }
      }
    }
    for (const p of pulses) {
      const L = layers[p.li], N = layers[p.li + 1];
      const x = p.a.x + (p.b.x - p.a.x) * p.t;
      const y = L.y + (N.y - L.y) * p.t - sy;
      if (y < -10 || y > h + 10) continue;
      const tail = 0.06;
      const x0 = p.a.x + (p.b.x - p.a.x) * Math.max(0, p.t - tail);
      const y0 = L.y + (N.y - L.y) * Math.max(0, p.t - tail) - sy;
      ctx.strokeStyle = `rgba(${TEAL}, ${0.75 * fade(x)})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x, y); ctx.stroke();
      ctx.lineWidth = 1;
    }
    const showLabels = colL > 130;
    ctx.font = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
    ctx.textBaseline = "middle";
    for (const L of layers) {
      const y = L.y - sy;
      if (y < -10 || y > h + 10) continue;
      const active = L.head && L.section.classList.contains("is-active");
      for (const n of L.nodes) {
        const f = fade(n.x);
        if (n.glow > 0) {
          ctx.fillStyle = `rgba(${TEAL}, ${0.18 * n.glow * f})`;
          ctx.beginPath(); ctx.arc(n.x, y, 4 + 8 * n.glow, 0, Math.PI * 2); ctx.fill();
        }
        ctx.fillStyle = active ? `rgba(${TEAL}, ${0.9 * f})` : "#fff";
        ctx.strokeStyle = `rgba(${TEAL}, ${0.55 * f})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(n.x, y, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        ctx.lineWidth = 1;
      }
      if (showLabels) {
        ctx.fillStyle = "rgba(95, 102, 112, 0.7)";
        ctx.fillText(L.label, 16, y - 14);
      }
    }
  }

  function step() {
    frame++;
    const sy = window.scrollY;
    for (const L of layers) for (const n of L.nodes) n.glow = Math.max(0, n.glow - 0.02);
    const done = [];
    pulses = pulses.filter((p) => {
      p.t += p.speed;
      if (p.t >= 1) { done.push(p); return false; }
      return true;
    });
    for (const p of done) {
      p.b.glow = 1;
      if (Math.random() < 0.7) spawn(p.li + 1, p.b);
    }
    if (pulses.length < 14 && frame % 18 === 0) {
      const visible = layers.findIndex((L, i) => layers[i + 1] && layers[i + 1].y - sy > 0);
      if (visible >= 0) spawn(visible);
    }
    draw();
    raf = requestAnimationFrame(step);
  }

  function sync() {
    const should = !document.hidden && !reduceMotion.matches;
    if (should && !running) { running = true; raf = requestAnimationFrame(step); }
    if (!should && running) { running = false; cancelAnimationFrame(raf); pulses = []; draw(); }
  }

  window.addEventListener("scroll", () => { if (!running) draw(); }, { passive: true });
  document.addEventListener("visibilitychange", sync);
  reduceMotion.addEventListener?.("change", sync);

  let resizeTimer = 0;
  const relayout = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layout, 150);
  };
  window.addEventListener("resize", relayout);
  if (window.ResizeObserver) new ResizeObserver(relayout).observe(document.body);
  window.addEventListener("load", layout);

  layout();
  sync();
})();
