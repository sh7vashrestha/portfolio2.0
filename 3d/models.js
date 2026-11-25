import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export const TEAL = 0x2dd4bf, AMBER = 0xfbbf24, RED = 0xf43f5e, BLUE = 0x60a5fa;
const UP = new THREE.Vector3(0, 1, 0);

export const std = (color, o = {}) => {
  const c = new THREE.Color(color), bright = c.r * 0.3 + c.g * 0.59 + c.b * 0.11 > 0.55;
  return new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.2, envMapIntensity: bright ? 0.12 : 0.8, ...o });
};
export const glow = (color, i = 2.2) => new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: i, roughness: 1 });
const box = (w, h, d) => {
  const m = Math.min(w, h, d);
  return m > 0.03 ? new RoundedBoxGeometry(w, h, d, 3, m * 0.22) : new THREE.BoxGeometry(w, h, d);
};
const cyl = (rt, rb, h, s = 20) => new THREE.CylinderGeometry(rt, rb, h, s);
const sph = (r, s = 18) => new THREE.SphereGeometry(r, s, s);

function mesh(geo, mat, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (parent) parent.add(m);
  return m;
}

export function between(m, a, b) {
  const d = new THREE.Vector3().subVectors(b, a);
  m.position.copy(a).addScaledVector(d, 0.5);
  m.scale.set(1, d.length(), 1);
  m.quaternion.setFromUnitVectors(UP, d.normalize());
}

function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function wrap(ctx, text, x, y, maxW, lh, maxLines = 6) {
  const words = text.split(/\s+/);
  let line = "", n = 0;
  for (const w of words) {
    const test = line ? line + " " + w : w;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y); y += lh; line = w;
      if (++n >= maxLines - 1) { ctx.fillText(line + "…", x, y); return y + lh; }
    } else line = test;
  }
  if (line) ctx.fillText(line, x, y);
  return y + lh;
}

function pageTex(kind, venue, title) {
  return canvasTex(400, 560, (ctx, w, h) => {
    const g = ctx.createLinearGradient(kind === "L" ? w : 0, 0, kind === "L" ? 0 : w, 0);
    g.addColorStop(0, "#d9d4c7"); g.addColorStop(0.12, "#f6f2e8"); g.addColorStop(1, "#fbf8f1");
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#8a8578";
    let y = 70;
    if (kind === "R") {
      ctx.fillStyle = "#0f766e"; ctx.font = "600 22px Inter, sans-serif";
      ctx.fillText(venue.toUpperCase(), 40, y); y += 48;
      ctx.fillStyle = "#16181d"; ctx.font = "600 30px 'Source Serif 4', Georgia, serif";
      y = wrap(ctx, title, 40, y, w - 80, 38, 5) + 14;
    } else {
      ctx.fillStyle = "#16181d"; ctx.font = "600 22px Inter, sans-serif";
      ctx.fillText("Abstract", 40, y); y += 34;
    }
    ctx.fillStyle = "#c9c3b4";
    for (; y < h - 50; y += 22) ctx.fillRect(40, y, (w - 80) * (0.55 + 0.45 * ((y * 7919) % 97) / 97), 7);
  });
}

const edgeTex = canvasTex(64, 64, (ctx, w, h) => {
  ctx.fillStyle = "#efe9da"; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#cfc7b4"; for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);
});

function bobber(g) { const h = new THREE.Group(); h.add(g); h.userData.tick = g.userData.tick; return h; }

/* ---------- Publications ---------- */
export function book({ title, venue, color = 0x0f766e }) {
  const g = new THREE.Group(), W = 0.78, H = 1.06;
  const cover = std(color, { roughness: 0.75 });
  const paper = std(0xf3efe4, { roughness: 0.9, metalness: 0 });
  const edges = std(0xffffff, { map: edgeTex, roughness: 0.9, metalness: 0 });
  const halves = [];
  for (const s of [-1, 1]) {
    const h = new THREE.Group();
    mesh(box(W, H, 0.035), cover, s * W / 2, 0, -0.035, h);
    const face = std(0xffffff, { map: pageTex(s < 0 ? "L" : "R", venue, title), roughness: 0.85, metalness: 0, side: THREE.DoubleSide });
    const pw = W * 0.95, ph = H * 0.95;
    mesh(new THREE.BoxGeometry(pw, ph, 0.04), [edges, edges, edges, edges, paper, paper], s * pw / 2, 0, -0.005, h);
    const geo = new THREE.PlaneGeometry(pw, ph, 28, 1), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const u = s > 0 ? (pos.getX(i) + pw / 2) / pw : (pw / 2 - pos.getX(i)) / pw;
      pos.setZ(i, 0.05 * Math.sin(Math.PI * Math.min(1, u * 0.9 + 0.1)) * (1 - 0.35 * u));
    }
    geo.computeVertexNormals();
    mesh(geo, face, s * pw / 2, 0, 0.016, h);
    g.add(h); halves.push(h);
  }
  mesh(cyl(0.03, 0.03, H, 10), cover, 0, 0, -0.04, g);
  const ribbon = mesh(new THREE.BoxGeometry(0.03, 0.32, 0.004), std(AMBER, { roughness: 0.6, emissive: AMBER, emissiveIntensity: 0.25 }), 0.03, -H / 2 - 0.1, 0.03, g);
  ribbon.rotation.z = 0.12;
  const flipPivot = new THREE.Group();
  const flipPage = mesh(new THREE.PlaneGeometry(W * 0.93, H * 0.93), std(0xfbf8f1, { side: THREE.DoubleSide, roughness: 0.9, metalness: 0 }), W * 0.93 / 2, 0, 0.04, flipPivot);
  flipPage.visible = false;
  g.add(flipPivot);
  g.rotation.x = -0.25;
  let open = 0.75, flipT = 1;
  g.userData.tick = (t, dt, s) => {
    const target = s.hot ? 0.16 : s.near ? 0.45 : 0.95;
    open += (target - open) * Math.min(1, dt * 4);
    halves[0].rotation.y = open; halves[1].rotation.y = -open;
    if (s.hot) { flipT += dt * 0.7; if (flipT > 1.6) flipT = 0; } else flipT = Math.min(1.6, flipT + dt);
    const p = Math.min(1, flipT);
    flipPage.visible = p < 1;
    flipPivot.rotation.y = -open - (Math.PI - 2 * open) * (0.5 - 0.5 * Math.cos(Math.PI * p));
  };
  return g;
}

/* ---------- Drones ---------- */
const bladeGeo = (() => {
  const geo = new THREE.CapsuleGeometry(0.028, 0.15, 4, 10);
  geo.rotateZ(Math.PI / 2); geo.scale(1, 0.14, 1); geo.translate(0.1, 0, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.04 * p.getZ(i) * (p.getX(i) / 0.2));
  geo.computeVertexNormals();
  return geo;
})();
const bladeMat = new THREE.MeshStandardMaterial({ color: 0x1b2025, roughness: 0.35, metalness: 0.3, envMapIntensity: 0.8 });

function blades(parent, x, z, mat) {
  const r = new THREE.Group(); r.position.set(x, 0.07, z);
  mesh(cyl(0.025, 0.025, 0.05, 8), mat, 0, 0, 0, r);
  for (const a of [0, Math.PI]) {
    const b = mesh(bladeGeo, bladeMat, 0, 0.03, 0, r); b.rotation.y = a;
  }
  mesh(cyl(0.22, 0.22, 0.004, 28), new THREE.MeshBasicMaterial({ color: 0x9fe8de, transparent: true, opacity: 0.07, depthWrite: false }), 0, 0.03, 0, r);
  parent.add(r); return r;
}

export function drone({ size = 1, cam = TEAL, extra } = {}) {
  const g = new THREE.Group(), d = new THREE.Group(); g.add(d);
  const dark = std(0x23292f, { metalness: 0.5, roughness: 0.4 }), arm = std(0x39424a, { metalness: 0.6 });
  mesh(box(0.42, 0.1, 0.42), dark, 0, 0, 0, d).rotation.y = Math.PI / 4;
  mesh(box(0.2, 0.07, 0.3), std(0x30373e, { metalness: 0.3, roughness: 0.5 }), 0, 0.12, -0.03, d);
  mesh(box(0.205, 0.012, 0.1), glow(cam, 1.2), 0, 0.12, -0.03, d);
  mesh(cyl(0.008, 0.008, 0.14, 6), arm, -0.08, 0.2, -0.14, d);
  mesh(cyl(0.035, 0.035, 0.015, 16), std(0xe5e9ec, { metalness: 0.3 }), -0.08, 0.27, -0.14, d);
  for (const sx of [-1, 1]) { const sk = mesh(cyl(0.012, 0.012, 0.42, 8), arm, sx * 0.2, -0.2, 0, d); sk.rotation.x = Math.PI / 2; }
  mesh(sph(0.16), std(0x2b333a, { metalness: 0.6, roughness: 0.3 }), 0, 0.07, 0, d).scale.set(1, 0.45, 1);
  const rotors = [];
  [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([x, z], i) => {
    const a = mesh(cyl(0.02, 0.02, 1, 8), arm, 0, 0, 0, d);
    between(a, new THREE.Vector3(0, 0, 0), new THREE.Vector3(x * 0.42, 0.03, z * 0.42));
    mesh(cyl(0.045, 0.05, 0.08, 16), std(0x8b949c, { metalness: 0.85, roughness: 0.25 }), x * 0.42, 0.04, z * 0.42, d);
    const guard = mesh(new THREE.TorusGeometry(0.235, 0.008, 6, 40), arm, x * 0.42, 0.1, z * 0.42, d); guard.rotation.x = Math.PI / 2;
    rotors.push(blades(d, x * 0.42, z * 0.42, dark));
    mesh(sph(0.025, 8), glow(z > 0 ? TEAL : RED, 3), x * 0.42, -0.02, z * 0.42, d);
    const leg = mesh(cyl(0.012, 0.012, 1, 6), arm, 0, 0, 0, d);
    between(leg, new THREE.Vector3(x * 0.12, -0.04, z * 0.12), new THREE.Vector3(x * 0.2, -0.2, z * 0.12));
  });
  mesh(sph(0.055), std(0x111418, { metalness: 0.8, roughness: 0.2 }), 0, -0.1, 0.16, d);
  mesh(sph(0.025, 10), glow(cam, 3.5), 0, -0.11, 0.205, d);
  d.scale.setScalar(size);
  const base = Math.random() * 6;
  g.userData.rotors = rotors;
  g.userData.tick = (t, dt, s) => {
    const spin = s.hot ? 40 : 18;
    rotors.forEach((r, i) => (r.rotation.y += (i % 2 ? spin : -spin) * dt));
    d.position.y = 0.12 * Math.sin(t * 1.6 + base) + (s.hot ? 0.25 : 0);
    d.rotation.z = 0.05 * Math.sin(t * 1.1 + base);
    if (extra) extra(t, dt, s);
  };
  return g;
}

function scanCone(color, h = 0.9) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(0.42, h, 28, 1, true),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.position.y = -h / 2 - 0.12;
  return m;
}

export function swarm() {
  const g = new THREE.Group(), kids = [];
  const pos = [[0, 0.15, 0], [-0.5, -0.05, 0.25], [0.5, -0.05, 0.25], [0, -0.1, -0.45]];
  pos.forEach((p, i) => { const d = drone({ size: 0.48, cam: i === 3 ? RED : TEAL }); d.position.set(...p); g.add(d); kids.push(d); });
  const lineMat = new THREE.LineBasicMaterial({ color: TEAL, transparent: true, opacity: 0.45 });
  const geo = new THREE.BufferGeometry().setFromPoints(new Array(12).fill(0).map(() => new THREE.Vector3()));
  g.add(new THREE.LineSegments(geo, lineMat));
  const bad = mesh(new THREE.TorusGeometry(0.28, 0.012, 8, 40), glow(RED, 2.5), 0, 0, 0, g); bad.rotation.x = Math.PI / 2;
  g.userData.tick = (t, dt, s) => {
    kids.forEach((k, i) => { k.userData.tick(t, dt, s); k.position.x = pos[i][0] + 0.06 * Math.sin(t + i * 2); });
    const P = kids.map((k) => k.position.clone().add(new THREE.Vector3(0, k.children[0].position.y, 0)));
    const pairs = [[0, 1], [0, 2], [1, 2], [0, 3], [1, 3], [2, 3]];
    const arr = geo.attributes.position.array;
    pairs.forEach(([a, b], j) => { P[a].toArray(arr, j * 6); P[b].toArray(arr, j * 6 + 3); });
    geo.attributes.position.needsUpdate = true;
    bad.position.copy(P[3]); bad.scale.setScalar(1 + 0.15 * Math.sin(t * 5));
    bad.material.emissiveIntensity = s.hot ? 4 : 2;
  };
  return g;
}

export function kestrel() {
  const cone = scanCone(AMBER, 1);
  const g = drone({ size: 1, cam: AMBER, extra: (t, dt, s) => { cone.material.opacity = (s.hot ? 0.22 : 0.1) + 0.05 * Math.sin(t * 4); cone.position.y = g.children[0].position.y - 0.62; } });
  g.add(cone);
  const person = new THREE.Group(); person.position.y = -1.15;
  mesh(sph(0.06), glow(AMBER, 2), 0, 0.22, 0, person);
  mesh(cyl(0.05, 0.07, 0.25, 10), glow(AMBER, 1.4), 0, 0.06, 0, person);
  g.add(person);
  return g;
}

export function damageScout() {
  const cone = scanCone(TEAL, 0.8);
  const g = drone({ size: 0.85, extra: (t, dt, s) => { cone.material.opacity = s.hot ? 0.2 : 0.1; cone.position.y = g.children[0].position.y - 0.52; } });
  g.add(cone);
  const b = new THREE.Group(); b.position.y = -1.1;
  const wall = std(0x5b6670, { roughness: 0.9 });
  mesh(box(0.5, 0.36, 0.4), wall, -0.12, 0, 0, b);
  const broken = mesh(box(0.28, 0.24, 0.4), wall, 0.3, -0.06, 0, b); broken.rotation.z = -0.25;
  for (let i = 0; i < 3; i++) mesh(box(0.08, 0.08, 0.01), glow(i === 1 ? RED : AMBER, 1.2), -0.27 + i * 0.15, 0.05, 0.205, b);
  const tag = mesh(new THREE.TorusGeometry(0.42, 0.01, 6, 48), glow(RED, 1.8), 0.05, -0.17, 0, b); tag.rotation.x = Math.PI / 2;
  g.add(b);
  return g;
}

/* ---------- Boards and chips ---------- */
function boardTex(color, aspect) {
  const W = 512, H = Math.round(512 / aspect);
  return canvasTex(W, H, (ctx, w, h) => {
    const c = new THREE.Color(color);
    ctx.fillStyle = `#${c.getHexString()}`; ctx.fillRect(0, 0, w, h);
    const lt = c.clone().offsetHSL(0, 0, 0.1).getHexString();
    ctx.strokeStyle = `#${lt}`; ctx.lineWidth = 3; ctx.lineCap = "round";
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 40; i++) {
      let x = r() * w, y = r() * h;
      ctx.beginPath(); ctx.moveTo(x, y);
      for (let k = 0; k < 3; k++) {
        if (k % 2) { const dx = (r() - 0.5) * 220; x += dx; y += Math.abs(dx) * (r() > 0.5 ? 0.4 : 0); } else y += (r() - 0.5) * 140;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.fillStyle = "#d4af37"; ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.55)"; ctx.lineWidth = 2; ctx.strokeRect(14, 14, w - 28, h - 28);
    ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "600 16px Inter, sans-serif"; ctx.fillText("REV 2.1", 26, h - 26);
  });
}

function chipTex(text) {
  return canvasTex(128, 128, (ctx, w, h) => {
    ctx.fillStyle = "#16191d"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#3a4048"; ctx.beginPath(); ctx.arc(18, 18, 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#aeb6bd"; ctx.font = "600 20px Inter, sans-serif"; ctx.textAlign = "center";
    ctx.fillText(text, w / 2, h / 2 + 4);
    ctx.font = "12px Inter, sans-serif"; ctx.fillStyle = "#6b737b"; ctx.fillText("2526 A1", w / 2, h / 2 + 26);
  });
}
export function pcb(w = 1, d = 0.7, color = 0x0b5d3b) {
  const g = new THREE.Group();
  const side = std(color, { roughness: 0.6 });
  const top = std(0xffffff, { map: boardTex(color, w / d), roughness: 0.45, metalness: 0.25 });
  mesh(new THREE.BoxGeometry(w, 0.04, d), [side, side, top, side, side, side], 0, 0, 0, g);
  const hole = std(0xd4af37, { metalness: 0.95, roughness: 0.25 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(0.022, 0.008, 6, 16), hole, sx * (w / 2 - 0.05), 0.022, sz * (d / 2 - 0.05), g); h.rotation.x = Math.PI / 2; }
  const cap = std(0xd6c9a8, { roughness: 0.5 }), res = std(0x1b1f24, { roughness: 0.4 }), tin = std(0xd0d5d9, { metalness: 0.9, roughness: 0.2 });
  let seed = Math.floor(w * 977 + d * 331);
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 14; i++) {
    const x = (rnd() - 0.5) * (w - 0.16), z = (rnd() > 0.5 ? 1 : -1) * (d / 2 - 0.07 - rnd() * 0.06);
    const c = mesh(new THREE.BoxGeometry(0.05, 0.018, 0.024), rnd() > 0.5 ? cap : res, x, 0.029, z, g);
    c.rotation.y = rnd() > 0.5 ? Math.PI / 2 : 0;
    for (const e of [-1, 1]) mesh(new THREE.BoxGeometry(0.01, 0.02, 0.026), tin, e * 0.024, 0, 0, c);
  }
  for (let i = 0; i < 2; i++) mesh(cyl(0.035, 0.035, 0.07, 16), std(0x1d3b6e, { metalness: 0.5, roughness: 0.3 }), -w / 2 + 0.1 + i * 0.09, 0.055, -d / 2 + 0.11, g);
  return g;
}

function chip(parent, x, z, s = 0.24, label, text = "MCU") {
  const body = std(0x15181c, { roughness: 0.35, metalness: 0.4 });
  mesh(new THREE.BoxGeometry(s, 0.05, s), [body, body, std(0xffffff, { map: chipTex(text), roughness: 0.4, metalness: 0.2 }), body, body, body], x, 0.045, z, parent);
  const pin = std(0xbfc6cc, { metalness: 0.9, roughness: 0.2 });
  for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) {
    const o = -s / 2 + 0.03 + i * (s - 0.06) / 4;
    mesh(box(0.012, 0.012, 0.05), pin, x + o, 0.03, z + sd * (s / 2 + 0.02), parent);
    mesh(box(0.05, 0.012, 0.012), pin, x + sd * (s / 2 + 0.02), 0.03, z + o, parent);
  }
  if (label) { const led = mesh(sph(0.018, 8), glow(label, 3), x + s / 2 - 0.04, 0.075, z + s / 2 - 0.04, parent); return led; }
}

export function thermoChip() {
  const g = pcb(1, 0.8, 0x123247);
  chip(g, 0, 0, 0.36, null, "SoC");
  const heat = mesh(new THREE.CircleGeometry(0.5, 40), new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false }), 0, 0.08, 0, g);
  heat.rotation.x = -Math.PI / 2;
  const fins = new THREE.Group(); fins.position.y = 0.1; g.add(fins);
  for (let i = 0; i < 7; i++) mesh(box(0.025, 0.14, 0.32), std(0x9aa5ad, { metalness: 0.9, roughness: 0.25 }), -0.15 + i * 0.05, 0.07, 0, fins);
  const therm = new THREE.Group(); therm.position.set(0.42, 0.05, -0.25); g.add(therm);
  mesh(cyl(0.03, 0.03, 0.5, 10), std(0xe6edf0, { transparent: true, opacity: 0.6 }), 0, 0.28, 0, therm);
  mesh(sph(0.06), glow(RED, 2), 0, 0.03, 0, therm);
  const fill = mesh(cyl(0.017, 0.017, 1, 8), glow(RED, 2), 0, 0, 0, therm);
  g.rotation.x = 0.35;
  g.userData.tick = (t, dt, s) => {
    const k = 0.5 + 0.5 * Math.sin(t * (s.hot ? 3 : 1.2));
    heat.material.opacity = 0.12 + 0.25 * k; heat.scale.setScalar(0.7 + 0.35 * k);
    const h = 0.12 + 0.3 * k; fill.scale.y = h; fill.position.y = 0.06 + h / 2;
  };
  return g;
}

export function medCross() {
  const g = new THREE.Group(), c = new THREE.Group(); g.add(c);
  const m = new THREE.MeshStandardMaterial({ color: 0x0, emissive: TEAL, emissiveIntensity: 0.9, transparent: true, opacity: 0.85 });
  mesh(box(0.7, 0.22, 0.12), m, 0, 0, 0, c); mesh(box(0.22, 0.7, 0.12), m, 0, 0, 0, c);
  const frame = mesh(new THREE.TorusGeometry(0.52, 0.012, 8, 60), glow(TEAL, 2), 0, 0, 0, c);
  const mask = mesh(box(0.86, 0.1, 0.02), std(0x0c0f12), 0, -0.6, 0, c);
  const scan = mesh(box(0.9, 0.012, 0.16), glow(0xa7f3d0, 1.8), 0, 0, 0, c);
  const disc = mesh(cyl(0.45, 0.5, 0.05, 40), std(0x1b2227, { metalness: 0.6 }), 0, -0.85, 0, g);
  g.userData.tick = (t, dt, s) => {
    c.rotation.y += dt * (s.hot ? 1.6 : 0.5); c.position.y = 0.05 * Math.sin(t * 1.4);
    scan.position.y = 0.45 * Math.sin(t * 2); frame.material.emissiveIntensity = s.hot ? 3.5 : 2;
    mask.visible = Math.sin(t * 1.3) > 0;
  };
  return g;
}

export function raspberryShield() {
  const g = pcb(1, 0.66, 0x0d6b43);
  chip(g, -0.12, 0.02, 0.26, TEAL, "BCM2711");
  mesh(box(0.2, 0.13, 0.16), std(0xbfc6cc, { metalness: 0.9, roughness: 0.25 }), 0.36, 0.09, 0.14, g);
  mesh(box(0.2, 0.13, 0.16), std(0xbfc6cc, { metalness: 0.9, roughness: 0.25 }), 0.36, 0.09, -0.12, g);
  for (let i = 0; i < 20; i++) mesh(box(0.02, 0.06, 0.02), std(0xc9a227, { metalness: 0.9 }), -0.42 + i * 0.04, 0.05, -0.28, g);
  const sh = new THREE.Shape(); sh.moveTo(0, 0.3); sh.quadraticCurveTo(0.24, 0.26, 0.24, 0.2); sh.lineTo(0.22, -0.02); sh.quadraticCurveTo(0.16, -0.22, 0, -0.3);
  sh.quadraticCurveTo(-0.16, -0.22, -0.22, -0.02); sh.lineTo(-0.24, 0.2); sh.quadraticCurveTo(-0.24, 0.26, 0, 0.3);
  const shield = mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }), new THREE.MeshStandardMaterial({ color: 0, emissive: TEAL, emissiveIntensity: 1.4, transparent: true, opacity: 0.8 }), 0, 0.6, 0, g);
  g.rotation.x = 0.3;
  g.userData.tick = (t, dt, s) => { shield.rotation.y += dt * (s.hot ? 2 : 0.6); shield.position.y = 0.6 + 0.05 * Math.sin(t * 2); shield.material.emissiveIntensity = s.hot ? 2.6 : 1.4; };
  return g;
}

/* ---------- Robots ---------- */
export function roboticArm() {
  const g = new THREE.Group();
  const metal = std(0xd7dde2, { metalness: 0.55, roughness: 0.35 }), joint = std(0x1f262c, { metalness: 0.6 }), acc = std(0x0f766e, { metalness: 0.4 });
  mesh(cyl(0.3, 0.36, 0.12, 32), joint, 0, -0.5, 0, g);
  const j0 = new THREE.Group(); j0.position.y = -0.42; g.add(j0);
  mesh(cyl(0.16, 0.2, 0.18, 24), acc, 0, 0.09, 0, j0);
  const j1 = new THREE.Group(); j1.position.y = 0.2; j0.add(j1);
  mesh(sph(0.11), joint, 0, 0, 0, j1);
  mesh(box(0.12, 0.6, 0.12), metal, 0, 0.3, 0, j1);
  const j2 = new THREE.Group(); j2.position.y = 0.6; j1.add(j2);
  mesh(sph(0.09), joint, 0, 0, 0, j2);
  mesh(box(0.1, 0.5, 0.1), metal, 0, 0.25, 0, j2);
  const j3 = new THREE.Group(); j3.position.y = 0.5; j2.add(j3);
  mesh(sph(0.07), joint, 0, 0, 0, j3);
  mesh(cyl(0.05, 0.05, 0.16, 12), acc, 0, 0.08, 0, j3);
  const fingers = [];
  for (const s of [-1, 1]) { const f = mesh(box(0.025, 0.14, 0.06), metal, s * 0.05, 0.22, 0, j3); fingers.push(f); }
  mesh(sph(0.02, 8), glow(TEAL, 3), 0, 0.1, 0.05, j3);
  g.scale.setScalar(0.9);
  g.userData.tick = (t, dt, s) => {
    const k = s.hot ? 1.8 : 0.8;
    j0.rotation.y = 0.8 * Math.sin(t * 0.5 * k);
    j1.rotation.z = 0.5 + 0.3 * Math.sin(t * 0.7 * k);
    j2.rotation.z = -1.2 + 0.35 * Math.sin(t * 0.9 * k + 1);
    j3.rotation.z = -0.4 + 0.3 * Math.sin(t * 1.2 * k);
    const o = 0.04 + 0.025 * Math.sin(t * 2 * k);
    fingers[0].position.x = -o; fingers[1].position.x = o;
  };
  return g;
}

export function deltaArm() {
  const g = new THREE.Group();
  const frame = std(0x39424a, { metalness: 0.6 }), metal = std(0xd7dde2, { metalness: 0.6, roughness: 0.3 });
  const tri = new THREE.Shape(); for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3 - Math.PI / 2; tri[i ? "lineTo" : "moveTo"](0.5 * Math.cos(a), 0.5 * Math.sin(a)); }
  const top = mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.05, bevelEnabled: false }), frame, 0, 0.55, 0, g); top.rotation.x = Math.PI / 2;
  for (let i = 0; i < 3; i++) { const a = i * 2 * Math.PI / 3 + Math.PI / 6; const p = mesh(cyl(0.02, 0.02, 1.25, 8), frame, 0.62 * Math.cos(a), -0.05, 0.62 * Math.sin(a), g); }
  const eff = new THREE.Group(); g.add(eff);
  mesh(cyl(0.1, 0.1, 0.04, 20), metal, 0, 0, 0, eff);
  mesh(cyl(0.025, 0.01, 0.12, 10), frame, 0, -0.08, 0, eff);
  const tip = mesh(sph(0.025, 8), glow(TEAL, 3), 0, -0.15, 0, eff);
  const motors = [], elbows = [], rods = [];
  for (let i = 0; i < 3; i++) {
    const a = i * 2 * Math.PI / 3 - Math.PI / 2;
    motors.push(new THREE.Vector3(0.28 * Math.cos(a), 0.52, 0.28 * Math.sin(a)));
    mesh(box(0.1, 0.1, 0.1), std(0x15181c), motors[i].x, 0.5, motors[i].z, g);
    const upper = mesh(cyl(0.025, 0.025, 1, 8), metal, 0, 0, 0, g), lower = mesh(cyl(0.012, 0.012, 1, 6), metal, 0, 0, 0, g);
    rods.push([upper, lower]); elbows.push(a);
  }
  const bins = [RED, TEAL, AMBER, BLUE];
  bins.forEach((c, i) => mesh(box(0.22, 0.12, 0.22), std(c, { roughness: 0.7 }), -0.36 + i * 0.24, -0.62, 0.32, g));
  const item = mesh(box(0.08, 0.06, 0.08), std(0xe8e2d0), 0, -0.6, -0.1, g);
  g.userData.tick = (t, dt, s) => {
    const k = s.hot ? 2 : 1;
    const ex = 0.22 * Math.sin(t * 0.9 * k), ez = 0.15 * Math.cos(t * 0.9 * k) + 0.05, ey = -0.25 + 0.15 * Math.sin(t * 1.8 * k);
    eff.position.set(ex, ey, ez);
    for (let i = 0; i < 3; i++) {
      const a = elbows[i], m = motors[i];
      const e = new THREE.Vector3(m.x + 0.22 * Math.cos(a), 0.52 - 0.18 + 0.12 * Math.sin(t * 1.8 * k + i), m.z + 0.22 * Math.sin(a));
      const j = new THREE.Vector3(ex + 0.09 * Math.cos(a), ey, ez + 0.09 * Math.sin(a));
      between(rods[i][0], m, e); between(rods[i][1], e, j);
    }
    item.position.set(ex, ey - 0.2, ez); item.visible = s.hot;
    tip.material.emissiveIntensity = s.hot ? 5 : 3;
  };
  return g;
}

/* ---------- Gadgets ---------- */
export function toyBoard() {
  const g = pcb(0.95, 0.7, 0x173b75);
  chip(g, -0.2, 0, 0.26, BLUE, "STM32");
  mesh(cyl(0.15, 0.15, 0.08, 28), std(0x111418), 0.25, 0.06, -0.05, g);
  const cone = mesh(cyl(0.1, 0.05, 0.02, 28), std(0x2b333a), 0.25, 0.11, -0.05, g);
  const keys = [RED, AMBER, TEAL].map((c, i) => mesh(cyl(0.045, 0.045, 0.04, 16), glow(c, 1), 0.1 + i * 0.13, 0.04, 0.23, g));
  const notes = [];
  for (let i = 0; i < 3; i++) { const n = mesh(sph(0.03, 8), glow(TEAL, 2.5), 0.25, 0.2, -0.05, g); notes.push(n); }
  g.rotation.x = 0.4;
  g.userData.tick = (t, dt, s) => {
    cone.position.y = 0.11 + 0.008 * Math.sin(t * (s.hot ? 40 : 12));
    keys.forEach((k, i) => (k.material.emissiveIntensity = ((t * 2 + i) % 3 < 1) ? 3 : 0.6));
    notes.forEach((n, i) => { const p = ((t * (s.hot ? 0.9 : 0.4) + i / 3) % 1); n.position.set(0.25 + 0.3 * p * Math.cos(i * 2), 0.15 + p * 0.6, -0.05 + 0.15 * p * Math.sin(i * 2)); n.material.opacity = 1 - p; n.scale.setScalar(1 - p * 0.6); });
  };
  return g;
}

export function printer() {
  const g = new THREE.Group();
  const body = std(0xe5e9ec, { roughness: 0.4 }), dark = std(0x2b333a);
  mesh(box(0.8, 0.32, 0.55), body, 0, 0, 0, g);
  mesh(box(0.8, 0.05, 0.4), dark, 0, 0.18, -0.05, g);
  mesh(box(0.6, 0.02, 0.05), dark, 0, 0.02, 0.28, g);
  mesh(sph(0.02, 8), glow(TEAL, 3), 0.3, 0.1, 0.28, g);
  const paper = mesh(box(0.5, 0.008, 0.6), std(0xfbf8f1, { roughness: 0.9 }), 0, 0.02, 0.3, g);
  const arcs = [];
  for (let i = 0; i < 3; i++) { const a = mesh(new THREE.TorusGeometry(0.1 + i * 0.09, 0.012, 6, 30, Math.PI / 2), glow(TEAL, 2), 0, 0.3, 0, g); a.rotation.z = Math.PI / 4; arcs.push(a); }
  g.userData.tick = (t, dt, s) => {
    const p = (t * (s.hot ? 0.5 : 0.2)) % 1;
    paper.position.z = 0.05 + 0.5 * p; paper.position.y = 0.02 - 0.12 * p * p;
    arcs.forEach((a, i) => (a.material.emissiveIntensity = (Math.floor(t * 3) % 3) >= i ? 2.5 : 0.25));
  };
  return g;
}

export function loraBalloon() {
  const g = pcb(0.8, 0.55, 0x0b5d3b);
  chip(g, -0.15, 0, 0.22, AMBER, "SX1276");
  mesh(cyl(0.012, 0.012, 0.6, 8), std(0x111418), 0.3, 0.32, 0.15, g);
  const tip = mesh(sph(0.03, 10), glow(AMBER, 3), 0.3, 0.63, 0.15, g);
  const balloon = new THREE.Group(); g.add(balloon);
  mesh(sph(0.26, 28), std(0xf1f5f9, { roughness: 0.3, transparent: true, opacity: 0.92 }), 0, 0, 0, balloon).scale.y = 1.15;
  const string = mesh(cyl(0.004, 0.004, 1, 4), std(0x9aa5ad), 0, 0, 0, g);
  const pod = mesh(box(0.1, 0.08, 0.1), std(0x23292f), 0, 0, 0, balloon);
  const waves = [0, 1, 2].map(() => { const w = mesh(new THREE.TorusGeometry(0.1, 0.008, 6, 40), glow(AMBER, 2), 0.3, 0.63, 0.15, g); w.material = w.material.clone(); w.material.transparent = true; return w; });
  g.userData.tick = (t, dt, s) => {
    balloon.position.set(-0.3 + 0.05 * Math.sin(t), 1.15 + 0.08 * Math.sin(t * 0.8), -0.1);
    pod.position.y = -0.45;
    between(string, new THREE.Vector3(-0.3, 0.03, -0.1), balloon.position.clone().add(new THREE.Vector3(0, -0.42, 0)));
    waves.forEach((w, i) => { const p = (t * (s.hot ? 0.9 : 0.45) + i / 3) % 1; w.scale.setScalar(0.5 + 3 * p); w.material.opacity = 1 - p; w.rotation.x = Math.PI / 2; });
    tip.material.emissiveIntensity = 2 + 2 * Math.sin(t * 6);
  };
  return g;
}

export function accessDoor() {
  const g = new THREE.Group();
  const frame = std(0x39424a, { metalness: 0.5 }), door = std(0x6b4f3a, { roughness: 0.8 });
  mesh(box(0.7, 1.15, 0.06), frame, 0, 0, -0.05, g);
  const hinge = new THREE.Group(); hinge.position.set(-0.3, 0, 0); g.add(hinge);
  mesh(box(0.6, 1.05, 0.05), door, 0.3, 0, 0, hinge);
  mesh(sph(0.03, 10), std(0xc9a227, { metalness: 0.9 }), 0.54, 0, 0.04, hinge);
  const pad = new THREE.Group(); pad.position.set(0.5, 0.05, 0.02); g.add(pad);
  mesh(box(0.18, 0.28, 0.03), std(0x15181c), 0, 0, 0, pad);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) mesh(box(0.035, 0.035, 0.01), glow(TEAL, 0.8), -0.045 + c * 0.045, 0.08 - r * 0.045, 0.02, pad);
  const led = mesh(sph(0.02, 8), glow(RED, 3), 0, 0.12, 0.02, pad);
  g.userData.tick = (t, dt, s) => {
    const open = s.hot ? (Math.sin(t * 1.5) > -0.2) : false;
    hinge.rotation.y += ((open ? -1.1 : 0) - hinge.rotation.y) * Math.min(1, dt * 3);
    led.material.emissive.setHex(open ? 0x22c55e : RED);
  };
  return g;
}

export function ambulance() {
  const g = new THREE.Group();
  const white = std(0xf1f5f9, { roughness: 0.4 }), dark = std(0x15181c);
  mesh(box(0.8, 0.42, 0.42), white, -0.1, 0.05, 0, g);
  mesh(box(0.28, 0.3, 0.42), white, 0.43, -0.01, 0, g);
  mesh(box(0.02, 0.18, 0.36), std(0x1e293b, { metalness: 0.7, roughness: 0.1 }), 0.58, 0.04, 0, g);
  mesh(box(0.8, 0.06, 0.425), std(RED), -0.1, -0.06, 0, g);
  for (const z of [-0.215, 0.215]) { mesh(box(0.16, 0.05, 0.005), std(RED), -0.1, 0.12, z, g); mesh(box(0.05, 0.16, 0.005), std(RED), -0.1, 0.12, z, g); }
  const wheels = [];
  for (const x of [-0.32, 0.38]) for (const z of [-0.2, 0.2]) { const w = mesh(cyl(0.09, 0.09, 0.06, 18), dark, x, -0.17, z, g); w.rotation.x = Math.PI / 2; wheels.push(w); }
  const l1 = mesh(box(0.08, 0.05, 0.1), glow(RED, 3), 0.1, 0.29, 0.08, g), l2 = mesh(box(0.08, 0.05, 0.1), glow(BLUE, 3), 0.1, 0.29, -0.08, g);
  const pulse = new THREE.Line(new THREE.BufferGeometry().setFromPoints(new Array(40).fill(0).map((_, i) => new THREE.Vector3(-0.5 + i * 0.025, 0, 0))), new THREE.LineBasicMaterial({ color: RED }));
  pulse.position.set(-0.1, 0.55, 0); g.add(pulse);
  g.userData.tick = (t, dt, s) => {
    const f = Math.floor(t * (s.hot ? 8 : 3)) % 2;
    l1.material.emissiveIntensity = f ? 4 : 0.3; l2.material.emissiveIntensity = f ? 0.3 : 4;
    wheels.forEach((w) => (w.rotation.y += dt * (s.hot ? 8 : 0)));
    const arr = pulse.geometry.attributes.position.array;
    for (let i = 0; i < 40; i++) { const x = (i / 40 + t * 0.5) % 1; arr[i * 3 + 1] = Math.abs(x - 0.5) < 0.04 ? (x - 0.5 < 0 ? 0.15 : -0.08) : 0; }
    pulse.geometry.attributes.position.needsUpdate = true;
  };
  return g;
}

/* ---------- Screens ---------- */
export function laptop(title, sub) {
  const g = new THREE.Group();
  const al = std(0xaab4bc, { metalness: 0.8, roughness: 0.3 });
  const keys = canvasTex(512, 326, (ctx, w, h) => {
    ctx.fillStyle = "#aab4bc"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#1c2126";
    for (let r = 0; r < 5; r++) for (let c = 0; c < 13; c++) ctx.fillRect(40 + c * 33.5, 24 + r * 30, 28, 24);
    ctx.fillStyle = "#9aa4ac"; ctx.fillRect(w / 2 - 90, 190, 180, 112);
  });
  const kb = std(0xffffff, { map: keys, metalness: 0.7, roughness: 0.35 });
  mesh(new THREE.BoxGeometry(1.1, 0.04, 0.7), [al, al, kb, al, al, al], 0, -0.3, 0.1, g);
  const lid = new THREE.Group(); lid.position.set(0, -0.28, -0.24); g.add(lid);
  mesh(box(1.1, 0.7, 0.03), al, 0, 0.35, -0.015, lid);
  const tex = canvasTex(640, 400, (ctx, w, h) => {
    const gr = ctx.createLinearGradient(0, 0, w, h); gr.addColorStop(0, "#0b1026"); gr.addColorStop(1, "#1e1b4b");
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8})`; ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
    ctx.strokeStyle = "rgba(251,191,36,.7)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(w / 2, h / 2 + 10, 110, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(w / 2 + 80 * Math.cos(a), h / 2 + 10 + 80 * Math.sin(a)); ctx.lineTo(w / 2 + 110 * Math.cos(a), h / 2 + 10 + 110 * Math.sin(a)); ctx.stroke(); }
    ctx.fillStyle = "#fde68a"; ctx.font = "600 44px 'Source Serif 4', Georgia, serif"; ctx.textAlign = "center"; ctx.fillText(title, w / 2, h / 2 + 24);
    ctx.fillStyle = "#c7d2fe"; ctx.font = "20px Inter, sans-serif"; ctx.fillText(sub, w / 2, h - 30);
  });
  const screen = mesh(new THREE.PlaneGeometry(1.02, 0.62), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.4 }), 0, 0.35, 0.002, lid);
  g.userData.tick = (t, dt, s) => { lid.rotation.x = -0.12 + (s.hot ? 0 : 0.04 * Math.sin(t)); screen.material.emissiveIntensity = s.hot ? 0.9 : 0.55; g.rotation.y = 0.15 * Math.sin(t * 0.4); };
  return g;
}

export function phoneReader() {
  const g = new THREE.Group();
  mesh(box(0.5, 0.95, 0.05), std(0x1b1f24, { metalness: 0.6, roughness: 0.3 }), 0, 0, 0, g);
  const pages = [0, 1].map((n) => canvasTex(300, 560, (ctx, w, h) => {
    ctx.fillStyle = "#fbf8f1"; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#0f766e"; ctx.font = "600 20px Inter, sans-serif"; ctx.fillText(n ? "Chapter 2" : "Pana Reader", 24, 46);
    ctx.fillStyle = "#c9c3b4"; for (let y = 80; y < h - 30; y += 20) ctx.fillRect(24, y, (w - 48) * (0.6 + 0.4 * ((y * 31) % 13) / 13), 7);
  }));
  const scr = mesh(new THREE.PlaneGeometry(0.45, 0.88), new THREE.MeshStandardMaterial({ map: pages[0], emissiveMap: pages[0], emissive: 0xffffff, emissiveIntensity: 0.22, envMapIntensity: 0 }), 0, 0, 0.027, g);
  const pivot = new THREE.Group(); pivot.position.set(-0.225, 0, 0.03); g.add(pivot);
  const turn = mesh(new THREE.PlaneGeometry(0.45, 0.88), new THREE.MeshStandardMaterial({ map: pages[1], side: THREE.DoubleSide, emissiveMap: pages[1], emissive: 0xffffff, emissiveIntensity: 0.18, envMapIntensity: 0 }), 0.225, 0, 0, pivot);
  g.rotation.set(-0.15, 0.25, 0.08);
  g.userData.tick = (t, dt, s) => {
    const p = s.hot ? (t * 0.6) % 1.4 : 1.4;
    turn.visible = p < 1; pivot.rotation.y = -Math.PI * Math.min(1, p) * 0.98;
    g.position.y = 0.05 * Math.sin(t * 1.2);
  };
  return bobber(g);
}

/* ---------- Experience ---------- */
export function university() {
  const g = new THREE.Group();
  const stone = std(0xe2e8f0, { roughness: 0.7 });
  mesh(box(1.1, 0.08, 0.6), stone, 0, -0.45, 0, g); mesh(box(1, 0.06, 0.55), stone, 0, -0.38, 0, g);
  for (let i = 0; i < 5; i++) mesh(cyl(0.045, 0.05, 0.56, 14), stone, -0.4 + i * 0.2, -0.07, 0.15, g);
  mesh(box(1.05, 0.08, 0.6), stone, 0, 0.25, 0, g);
  const roof = new THREE.Shape(); roof.moveTo(-0.55, 0); roof.lineTo(0.55, 0); roof.lineTo(0, 0.25); roof.lineTo(-0.55, 0);
  mesh(new THREE.ExtrudeGeometry(roof, { depth: 0.55, bevelEnabled: false }), stone, 0, 0.29, -0.275, g);
  const door = mesh(box(0.16, 0.3, 0.02), glow(AMBER, 1.2), 0, -0.2, -0.1, g);
  g.userData.tick = (t, dt, s) => { door.material.emissiveIntensity = s.hot ? 2.4 : 1.1; };
  return g;
}

export function circuitDesk() {
  const g = pcb(0.9, 0.65, 0x0b5d3b);
  chip(g, -0.2, -0.05, 0.22, TEAL); chip(g, 0.18, 0.1, 0.16, AMBER);
  const iron = new THREE.Group(); g.add(iron);
  mesh(cyl(0.03, 0.03, 0.4, 10), std(0x1f262c), 0, 0.2, 0, iron);
  const tip = mesh(cyl(0.012, 0.002, 0.1, 8), glow(AMBER, 3), 0, -0.04, 0, iron);
  g.rotation.x = 0.35;
  g.userData.tick = (t, dt, s) => { iron.position.set(0.18 + 0.08 * Math.sin(t), 0.15 + 0.04 * Math.sin(t * 3), 0.1); iron.rotation.z = 0.5; tip.material.emissiveIntensity = s.hot ? 5 : 2.5; };
  return g;
}

function gearGeo(r = 0.35, teeth = 12) {
  const sh = new THREE.Shape();
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.18;
    if (!i) sh.moveTo(rr * Math.cos(a0), rr * Math.sin(a0)); else sh.lineTo(rr * Math.cos(a0), rr * Math.sin(a0));
    sh.lineTo(rr * Math.cos(a1), rr * Math.sin(a1));
  }
  const hole = new THREE.Path(); hole.absarc(0, 0, r * 0.35, 0, Math.PI * 2, true); sh.holes.push(hole);
  return new THREE.ExtrudeGeometry(sh, { depth: 0.08, bevelEnabled: false });
}

export function gears() {
  const g = new THREE.Group();
  const a = mesh(gearGeo(0.34, 12), std(0xd7dde2, { metalness: 0.7, roughness: 0.3 }), -0.2, 0.05, 0, g);
  const b = mesh(gearGeo(0.2, 8), std(0x0f766e, { metalness: 0.5 }), 0.29, 0.27, 0, g);
  const c = mesh(gearGeo(0.16, 7), std(AMBER, { metalness: 0.5 }), 0.22, -0.3, 0, g);
  g.userData.tick = (t, dt, s) => { const k = s.hot ? 2.5 : 0.8; a.rotation.z += dt * k * 0.5; b.rotation.z -= dt * k * 0.85; c.rotation.z -= dt * k * 1.05; };
  return g;
}

export function gradCap() {
  const g = new THREE.Group();
  const black = std(0x15181c, { roughness: 0.6 });
  mesh(cyl(0.22, 0.25, 0.2, 28), black, 0, -0.1, 0, g);
  const top = mesh(box(0.7, 0.03, 0.7), black, 0, 0.02, 0, g); top.rotation.y = Math.PI / 4;
  mesh(sph(0.03, 10), std(AMBER, { metalness: 0.8 }), 0, 0.05, 0, g);
  const tassel = mesh(cyl(0.01, 0.01, 0.32, 6), std(AMBER, { metalness: 0.6 }), 0.24, -0.12, 0.24, g);
  const tip = mesh(cyl(0.03, 0.05, 0.08, 10), glow(AMBER, 1.6), 0.24, -0.3, 0.24, g);
  g.rotation.x = 0.25;
  g.userData.tick = (t, dt, s) => { g.rotation.y += dt * (s.hot ? 1.5 : 0.4); g.position.y = 0.05 * Math.sin(t * 1.3); tip.material.emissiveIntensity = s.hot ? 3 : 1.6; };
  return bobber(g);
}

export function diploma() {
  const g = new THREE.Group();
  const roll = mesh(cyl(0.11, 0.11, 0.9, 28), std(0xf6f2e8, { roughness: 0.9 }), 0, 0, 0, g); roll.rotation.z = Math.PI / 2.4;
  const rib = mesh(new THREE.TorusGeometry(0.115, 0.022, 8, 30), std(RED, { roughness: 0.5 }), 0, 0, 0, g); rib.rotation.y = Math.PI / 2; rib.rotation.x = Math.PI / 2 - Math.PI / 2.4;
  const seal = mesh(cyl(0.07, 0.07, 0.02, 20), glow(AMBER, 1.4), 0.02, -0.02, 0.12, g); seal.rotation.x = Math.PI / 2;
  g.userData.tick = (t, dt, s) => { g.rotation.y = 0.4 * Math.sin(t * 0.7); g.position.y = 0.04 * Math.sin(t * 1.1); seal.material.emissiveIntensity = s.hot ? 3 : 1.4; };
  return bobber(g);
}

export function trophy() {
  const g = new THREE.Group();
  const gold = std(0xf2c14e, { metalness: 0.95, roughness: 0.2 });
  mesh(box(0.36, 0.1, 0.36), std(0x1f262c), 0, -0.48, 0, g);
  mesh(cyl(0.05, 0.08, 0.28, 16), gold, 0, -0.3, 0, g);
  const pts = []; for (let i = 0; i <= 12; i++) { const y = i / 12; pts.push(new THREE.Vector2(0.08 + 0.22 * Math.sin(y * Math.PI * 0.55), y * 0.45)); }
  mesh(new THREE.LatheGeometry(pts, 32), gold, 0, -0.16, 0, g);
  for (const s of [-1, 1]) { const h = mesh(new THREE.TorusGeometry(0.1, 0.02, 8, 20, Math.PI), gold, s * 0.27, 0.07, 0, g); h.rotation.z = s * -Math.PI / 2; }
  const star = mesh(new THREE.OctahedronGeometry(0.07), glow(AMBER, 3), 0, 0.42, 0, g);
  g.userData.tick = (t, dt, s) => { g.rotation.y += dt * (s.hot ? 1.4 : 0.35); star.rotation.y += dt * 2; star.material.emissiveIntensity = s.hot ? 5 : 2.5; };
  return g;
}

export function reviewStack() {
  const g = new THREE.Group();
  const paper = std(0xf6f2e8, { roughness: 0.9 });
  for (let i = 0; i < 4; i++) { const p = mesh(box(0.6, 0.02, 0.8), paper, 0.02 * Math.sin(i * 3), -0.3 + i * 0.025, 0, g); p.rotation.y = 0.12 * Math.sin(i * 2); }
  const tex = canvasTex(300, 400, (ctx, w, h) => { ctx.fillStyle = "#fbf8f1"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#16181d"; ctx.font = "600 24px Inter"; ctx.fillText("Review", 24, 46); ctx.fillStyle = "#c9c3b4"; for (let y = 80; y < h - 30; y += 22) ctx.fillRect(24, y, (w - 48) * (0.5 + 0.5 * ((y * 17) % 11) / 11), 8); });
  const top = mesh(new THREE.PlaneGeometry(0.6, 0.8), std(0xffffff, { map: tex, roughness: 0.9 }), 0, -0.2, 0, g); top.rotation.x = -Math.PI / 2;
  const chk = new THREE.Shape(); chk.moveTo(-0.15, 0); chk.lineTo(-0.05, -0.1); chk.lineTo(0.18, 0.15); chk.lineTo(0.14, 0.19); chk.lineTo(-0.05, -0.02); chk.lineTo(-0.11, 0.04);
  const check = mesh(new THREE.ExtrudeGeometry(chk, { depth: 0.04, bevelEnabled: false }), glow(TEAL, 2), 0, 0.25, 0, g);
  const pen = mesh(cyl(0.018, 0.018, 0.55, 10), std(0x0f766e, { metalness: 0.5 }), 0.32, -0.15, 0.1, g); pen.rotation.set(Math.PI / 2, 0, 0.6);
  g.rotation.x = 0.3;
  g.userData.tick = (t, dt, s) => { check.position.y = 0.25 + 0.06 * Math.sin(t * 2); check.rotation.y = 0.4 * Math.sin(t); check.material.emissiveIntensity = s.hot ? 4 : 2; };
  return g;
}

export function quill() {
  const g = new THREE.Group();
  const paper = mesh(box(0.55, 0.015, 0.72), std(0xf6f2e8, { roughness: 0.9 }), 0, -0.3, 0, g); paper.rotation.y = 0.2;
  const feather = new THREE.Shape(); feather.moveTo(0, -0.4); feather.quadraticCurveTo(0.16, 0, 0.04, 0.4); feather.quadraticCurveTo(-0.1, 0.05, 0, -0.4);
  const f = mesh(new THREE.ExtrudeGeometry(feather, { depth: 0.01, bevelEnabled: false }), std(0xe2e8f0, { roughness: 0.6, side: THREE.DoubleSide }), 0, 0.05, 0, g);
  const nib = mesh(cyl(0.004, 0.012, 0.08, 6), std(0x111418, { metalness: 0.8 }), 0, -0.38, 0, f);
  const ink = mesh(sph(0.02, 8), glow(TEAL, 3), 0, -0.42, 0, f);
  g.userData.tick = (t, dt, s) => { f.rotation.z = -0.5 + 0.08 * Math.sin(t * (s.hot ? 6 : 2)); f.position.set(0.05 * Math.sin(t * 1.5), 0.15, 0.05 * Math.cos(t * 1.5)); };
  return g;
}

/* ---------- News & contact ---------- */
export function newsCard(date, text) {
  const tex = canvasTex(512, 300, (ctx, w, h) => {
    ctx.fillStyle = "rgba(10,20,22,0.92)"; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#2dd4bf"; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = "#5eead4"; ctx.font = "600 26px Inter, sans-serif"; ctx.fillText(date.toUpperCase(), 30, 52);
    ctx.fillStyle = "#e8edf0"; ctx.font = "500 30px Inter, sans-serif"; wrap(ctx, text, 30, 100, w - 60, 38, 5);
  });
  const g = new THREE.Group();
  const card = mesh(new THREE.PlaneGeometry(1.15, 0.67), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.6, transparent: true, side: THREE.DoubleSide }), 0, 0, 0, g);
  g.userData.tick = (t, dt, s) => { card.material.emissiveIntensity = s.hot ? 1 : 0.6; card.position.y = 0.04 * Math.sin(t + g.id); };
  return g;
}

export function contactOrb(color = TEAL, icon = "@") {
  const g = new THREE.Group();
  const tex = canvasTex(128, 128, (ctx, w, h) => { ctx.fillStyle = "#04110f"; ctx.font = "700 64px Inter, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(icon, w / 2, h / 2 + 4); });
  const orb = mesh(sph(0.26, 28), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: color, emissiveIntensity: 0.7, roughness: 0.3 }), 0, 0, 0, g);
  const face = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  face.scale.setScalar(0.34); g.add(face);
  const ring = mesh(new THREE.TorusGeometry(0.36, 0.008, 6, 48), glow(color, 2), 0, 0, 0, g);
  g.userData.tick = (t, dt, s) => { ring.rotation.x = t * 0.8 + g.id; ring.rotation.y = t * 0.6; orb.material.emissiveIntensity = s.hot ? 1.4 : 0.7; g.scale.setScalar(s.hot ? 1.15 : 1); };
  return g;
}

export function dish() {
  const g = new THREE.Group();
  const metal = std(0xd7dde2, { metalness: 0.7, roughness: 0.3 });
  mesh(cyl(0.05, 0.12, 0.5, 14), metal, 0, -0.35, 0, g);
  const head = new THREE.Group(); head.position.y = -0.05; g.add(head);
  const pts = []; for (let i = 0; i <= 14; i++) { const x = (i / 14) * 0.55; pts.push(new THREE.Vector2(x, x * x * 0.9)); }
  const bowl = mesh(new THREE.LatheGeometry(pts, 40), std(0xe2e8f0, { metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }), 0, 0, 0, head);
  bowl.rotation.x = -Math.PI / 2.6;
  const feed = mesh(sph(0.05, 10), glow(TEAL, 4), 0, 0.12, 0.28, head);
  g.userData.tick = (t, dt) => { head.rotation.y = 0.6 * Math.sin(t * 0.3); feed.material.emissiveIntensity = 1.2 + 0.6 * Math.sin(t * 4); };
  return g;
}
