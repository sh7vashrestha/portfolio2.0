import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import * as M from "./models.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (s, r = document) => r.querySelector(s);
const short = (s) => { s = s.replace(/\s+/g, " ").trim().split(":")[0]; return s.length > 28 ? s.slice(0, 26) + "…" : s; };

const STATIONS = [
  { id: "publications", label: "Publications", section: "publications", cols: 4 },
  { id: "drones", label: "Drones & AI", section: "projects", anchor: "Drones", cols: 3 },
  { id: "hardware", label: "Hardware", section: "projects", anchor: "Embedded", cols: 4 },
  { id: "software", label: "Software", section: "projects", anchor: "Software", cols: 2 },
  { id: "experience", label: "Experience", section: "experience", cols: 4 },
  { id: "news", label: "News", section: "news", cols: 4, gap: 1.45 },
  { id: "contact", label: "Contact", section: "contact" },
];

const PROJECT_MODELS = [
  ["UAV-MAID", M.swarm], ["KESTREL", M.kestrel], ["DamageScout", M.damageScout], ["Thermo-FL", M.thermoChip],
  ["ClinX", M.medCross], ["Edge-LLM", M.raspberryShield], ["Tarakosh", () => M.laptop("Tarakosh", "tarakosh.vercel.app")],
  ["Pana", M.phoneReader], ["Delta Arm", M.deltaArm], ["STM32", M.toyBoard], ["Printer", M.printer], ["LoRa", M.loraBalloon],
  ["Access", M.accessDoor], ["Sajilo", M.ambulance], ["Robotic Arm", M.roboticArm],
];
const BOOK_COLORS = [0x0f766e, 0x1d4ed8, 0x7c2d12, 0x6d28d9, 0x047857, 0x9f1239, 0x334155, 0x0e7490];
const CONTACT_LOOK = { "University email": [M.TEAL, "@"], "Personal email": [0x22d3ee, "@"], CV: [M.AMBER, "CV"], "Google Scholar": [M.BLUE, "S"], GitHub: [0x94a3b8, "</>"], LinkedIn: [0x38bdf8, "in"], Instagram: [0xf472b6, "ig"] };

/* ---------- content ---------- */
const doc = new DOMParser().parseFromString(await (await fetch("../index.html")).text(), "text/html");
let key = 0;
const tag = (el) => (el.dataset.k ??= String(key++));
function fixUrls(root) {
  const rel = (v) => v && !/^(https?:|mailto:|#|data:|\/)/.test(v);
  root.querySelectorAll("[src],[href]").forEach((e) => { for (const a of ["src", "href"]) if (rel(e.getAttribute(a))) e.setAttribute(a, "../" + e.getAttribute(a)); });
  root.querySelectorAll("[srcset]").forEach((e) => { if (rel(e.getAttribute("srcset"))) e.setAttribute("srcset", "../" + e.getAttribute("srcset")); });
  return root;
}

const items = { core: [] };
STATIONS.forEach((s) => (items[s.id] = []));

doc.querySelectorAll("#publications .pub").forEach((el, i) => {
  const venue = el.querySelector(".pub-venue-tag").firstChild.textContent.trim();
  const title = el.querySelector("h3").textContent.trim();
  items.publications.push({ el, label: el.dataset.node || short(title), build: () => M.book({ title, venue, color: BOOK_COLORS[i % BOOK_COLORS.length] }) });
});
doc.querySelectorAll("#projects .project").forEach((el) => {
  const title = el.querySelector("h4").textContent.trim();
  const sub = el.closest("ul").previousElementSibling?.textContent || "";
  const st = STATIONS.find((s) => s.anchor && sub.includes(s.anchor));
  const mk = PROJECT_MODELS.find(([k]) => title.includes(k));
  if (st && mk) items[st.id].push({ el, label: el.dataset.node || short(title), build: mk[1] });
});
const ex = doc.querySelector("#experience");
const EXP = [["KSU", M.university], ["Yarsa", M.circuitDesk], ["Robotics", M.gears]];
ex.querySelectorAll("li[data-node]").forEach((el) => { const m = EXP.find(([k]) => el.dataset.node.includes(k)); if (m) items.experience.push({ el, label: el.dataset.node, build: m[1] }); });
const edu = doc.querySelectorAll("#education + ul > li");
if (edu[0]) items.experience.push({ el: edu[0], label: "PhD, KSU", build: M.gradCap });
if (edu[1]) items.experience.push({ el: edu[1], label: "B.E., Tribhuvan Univ.", build: M.diploma });
const h2 = (t) => [...ex.querySelectorAll("h2")].find((h) => h.textContent.trim() === t);
[["Honors", M.trophy], ["Service", M.reviewStack], ["Writing", M.quill]].forEach(([t, b]) => { const el = h2(t); if (el) items.experience.push({ el, hot: el.nextElementSibling, label: t, build: b }); });
doc.querySelectorAll("#news li").forEach((el) => {
  const [d, ...rest] = el.children;
  items.news.push({ el, label: d.textContent, build: () => M.newsCard(d.textContent, rest.map((r) => r.textContent).join(" ")) });
});
doc.querySelectorAll("#contact .out-node").forEach((el) => {
  const label = el.querySelector(".out-label").textContent.trim();
  const [c, icon] = CONTACT_LOOK[label] || [M.TEAL, "•"];
  items.contact.push({ el, label, href: el.getAttribute("href"), build: () => M.contactOrb(c, icon) });
});
Object.values(items).flat().forEach((it) => { tag(it.el); if (it.hot) tag(it.hot); });
function summarize(it) {
  const root = it.hot || it.el;
  const title = (it.el.querySelector("h3, h4")?.textContent || it.el.querySelector(".out-label, .row-head h3")?.textContent || it.label).trim();
  const ps = [...root.querySelectorAll("p:not(.pub-links):not(.authors)")].map((p) => p.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
  let txt = ps.sort((x, y) => y.length - x.length)[0] || root.textContent.replace(/\s+/g, " ").trim();
  if (txt.startsWith(title)) txt = txt.slice(title.length).trim();
  txt = txt.split(/(?<=\.)\s/)[0];
  if (txt.length > 130) txt = txt.slice(0, 127).replace(/\s\S*$/, "") + "…";
  return { title, txt };
}
Object.values(items).flat().forEach((it) => (it.sum = summarize(it)));

/* ---------- renderer ---------- */
const host = $("#scene");
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
host.appendChild(renderer.domElement);
const pmrem = new THREE.PMREMGenerator(renderer);
const labels = new CSS2DRenderer();
Object.assign(labels.domElement.style, { position: "absolute", inset: "0", pointerEvents: "none" });
host.appendChild(labels.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07090c);
scene.fog = new THREE.FogExp2(0x07090c, 0.011);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 400);
camera.position.set(0, 16, 40);
const controls = new OrbitControls(camera, renderer.domElement);
Object.assign(controls, { enableDamping: true, dampingFactor: 0.07, minDistance: 2.2, maxDistance: 75, enablePan: false, rotateSpeed: 0.6, autoRotateSpeed: 0.35, maxPolarAngle: Math.PI * 0.62 });
controls.autoRotate = !reduce;

scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
scene.add(new THREE.HemisphereLight(0xcfefff, 0x0b0f12, 0.55));
const sun = new THREE.DirectionalLight(0xffffff, 1.4); sun.position.set(8, 14, 10); scene.add(sun);
const rim = new THREE.DirectionalLight(0x5eead4, 0.8); rim.position.set(-10, 4, -12); scene.add(rim);
const coreLight = new THREE.PointLight(0x2dd4bf, 40, 26, 1.6); scene.add(coreLight);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.85, 0.55, 1.0);
composer.addPass(bloom);
composer.addPass(new OutputPass());

function glowTex() {
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)"); g.addColorStop(0.25, "rgba(160,255,240,.55)"); g.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}
const GLOW = glowTex();

/* stars */
{
  const n = 2400, p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = 50 + Math.random() * 120, u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, s = Math.sqrt(1 - u * u); p.set([r * s * Math.cos(a), r * u * 0.7, r * s * Math.sin(a)], i * 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0x9fb7c4, size: 0.35, sizeAttenuation: true, transparent: true, opacity: 0.7, fog: false })));
  const dust = new Float32Array(600 * 3);
  for (let i = 0; i < 600; i++) dust.set([(Math.random() - 0.5) * 40, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 40], i * 3);
  const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dust, 3));
  var dustPts = new THREE.Points(dg, new THREE.PointsMaterial({ color: 0x5eead4, size: 0.06, transparent: true, opacity: 0.5, depthWrite: false }));
  scene.add(dustPts);
}

/* ---------- core ---------- */
const pick = [];
const core = new THREE.Group(); scene.add(core);
const shell = new THREE.Mesh(new THREE.IcosahedronGeometry(1.9, 1), new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.22 }));
core.add(shell);
const inner = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25, 3), new THREE.MeshStandardMaterial({ color: 0x062a26, emissive: 0x0f766e, emissiveIntensity: 0.5, metalness: 0.3, roughness: 0.25, transparent: true, opacity: 0.55 }));
core.add(inner);
const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: 0x2dd4bf, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
halo.scale.setScalar(7); core.add(halo);
const rings = [0, 1, 2].map((i) => { const r = new THREE.Mesh(new THREE.TorusGeometry(2.4 + i * 0.35, 0.012, 6, 120), M.glow(i === 1 ? M.AMBER : M.TEAL, 1.6)); r.rotation.set(Math.PI / 2 + i * 0.5, i * 0.7, 0); core.add(r); return r; });
const photo = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthWrite: false }));
photo.scale.setScalar(1.9); core.add(photo);
new THREE.TextureLoader().load("../images/profile.jpg", (t) => {
  const c = document.createElement("canvas"), S = 512; c.width = c.height = S;
  const x = c.getContext("2d"), img = t.image, k = Math.max(S / img.width, S / img.height);
  x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 10, 0, Math.PI * 2); x.clip();
  x.drawImage(img, (S - img.width * k) / 2, (S - img.height * k) / 2 - S * 0.08, img.width * k, img.height * k);
  x.restore?.(); x.lineWidth = 14; x.strokeStyle = "#2dd4bf"; x.beginPath(); x.arc(S / 2, S / 2, S / 2 - 10, 0, Math.PI * 2); x.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  photo.material.map = tex; photo.material.needsUpdate = true;
});
photo.userData.pick = { kind: "core" };
pick.push(photo, inner);
inner.userData.pick = photo.userData.pick;
{
  const d = document.createElement("button"); d.className = "lbl-core";
  d.innerHTML = "<b>Shiva Shrestha</b><span>PhD student · secure AI, drones &amp; edge systems</span>";
  d.onclick = () => go("core");
  const o = new CSS2DObject(d); o.position.set(0, -2.55, 0); core.add(o);
}

/* ---------- stations ---------- */
const R = 18, all = [], stationObjs = {};
STATIONS.forEach((s, i) => {
  const a = (i / STATIONS.length) * Math.PI * 2 - Math.PI / 2;
  const P = new THREE.Vector3(R * Math.cos(a), (i % 2 ? 1.2 : -0.6), R * Math.sin(a));
  const g = new THREE.Group(); g.position.copy(P); scene.add(g);
  g.lookAt(0, P.y, 0);
  const list = items[s.id], n = list.length;
  let w = 0, h = 0;
  if (s.id === "contact") {
    const d = M.dish(); g.add(d);
    list.forEach((it, j) => {
      const ang = Math.PI * (0.1 + 0.8 * (j / (n - 1 || 1)));
      it.pos = new THREE.Vector3(-2.6 * Math.cos(ang), 0.4 + 1.5 * Math.sin(ang), 0.4);
    });
    w = 5.6; h = 3.6;
  } else {
    const cols = Math.min(s.cols, n), rows = Math.ceil(n / cols), gap = s.gap || 1.75;
    w = cols * gap; h = rows * gap;
    list.forEach((it, j) => {
      const r = Math.floor(j / cols), c = j % cols, inRow = Math.min(cols, n - r * cols);
      it.pos = new THREE.Vector3((c - (inRow - 1) / 2) * gap, ((rows - 1) / 2 - r) * gap, 0);
    });
  }
  list.forEach((it) => {
    const o = it.build(); o.position.copy(it.pos); g.add(o);
    it.obj = o; it.station = s; it.state = { hot: false, near: false };
    o.traverse((m) => (m.userData.pick = it));
    pick.push(o); all.push(it);
    const l = document.createElement("div"); l.className = "lbl-item"; l.textContent = it.label;
    const lo = new CSS2DObject(l); lo.position.set(it.pos.x, it.pos.y - 0.78, it.pos.z + 0.2); g.add(lo);
    it.lbl = l;
  });
  const pad = new THREE.Mesh(new THREE.TorusGeometry(Math.max(w, 3) * 0.45, 0.015, 6, 120), M.glow(M.TEAL, 0.6));
  pad.rotation.x = Math.PI / 2; pad.position.y = -h / 2 - 0.7; pad.scale.z = 0.4; g.add(pad);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(Math.max(w, 3) * 0.45, 64), new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.03, depthWrite: false }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = pad.position.y; disc.scale.y = 0.4; g.add(disc);
  const b = document.createElement("button"); b.className = "lbl-station"; b.textContent = s.label; b.onclick = () => { stopTour(); go(s.id); };
  const bo = new CSS2DObject(b); bo.position.set(0, h / 2 + 0.55, 0); g.add(bo);
  stationObjs[s.id] = { s, g, w, h, pad, btn: b };

  const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(P.x * 0.5, P.y + 4, P.z * 0.5), P.clone().add(new THREE.Vector3(0, -h / 2 - 0.7, 0)));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(60)), new THREE.LineBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.22 }));
  scene.add(line);
  stationObjs[s.id].curve = curve; stationObjs[s.id].line = line;
  stationObjs[s.id].sparks = [0, 1, 2].map((k) => {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: GLOW, color: k ? 0x5eead4 : 0xfbbf24, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    sp.scale.setScalar(0.55); sp.userData.off = Math.random(); scene.add(sp); return sp;
  });
});

/* ---------- nav ---------- */
const nav = $(".stations");
STATIONS.forEach((s) => { const b = document.createElement("button"); b.textContent = s.label; b.dataset.go = s.id; nav.appendChild(b); });
document.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { stopTour(); go(b.dataset.go); }));

/* ---------- panel ---------- */
const panel = $(".panel"), body = $(".panel-body"), crumb = $(".crumb");
let shownSection = null;
function showSection(id) {
  if (shownSection === id) return;
  shownSection = id;
  body.innerHTML = "";
  const src = id === "core" ? doc.querySelector("#top") : doc.querySelector("#" + id);
  const node = fixUrls(src.cloneNode(true));
  if (id === "core") {
    node.className = "intro-body";
    const pic = node.querySelector("picture"); if (pic) node.prepend(pic);
  }
  body.appendChild(node);
  body.scrollTop = 0;
}
function openPanel(title, section, target) {
  showSection(section);
  crumb.textContent = title;
  panel.hidden = false;
  body.querySelectorAll(".is-hot").forEach((e) => e.classList.remove("is-hot"));
  requestAnimationFrame(() => {
    let el = target && body.querySelector(`[data-k="${target.el.dataset.k}"]`);
    if (target?.hot) body.querySelector(`[data-k="${target.hot.dataset.k}"]`)?.classList.add("is-hot");
    else el?.classList.add("is-hot");
    if (!el && current?.anchor) el = [...body.querySelectorAll(".subhead")].find((h) => h.textContent.includes(current.anchor));
    if (el) body.scrollTo({ top: el.offsetTop - 12, behavior: reduce ? "auto" : "smooth" });
    else body.scrollTo({ top: 0 });
  });
}
$(".panel-close").onclick = () => go("overview");
const stepper = $(".panel-step");
function step(d) {
  if (!current) { const i = STATIONS.findIndex((s) => s.id === current?.id); return go(STATIONS[(i + d + STATIONS.length) % STATIONS.length].id); }
  const list = items[current.id], n = list.length;
  const i = focused ? list.indexOf(focused) : d > 0 ? -1 : 0;
  go(current.id, list[(i + d + n) % n]);
}
$(".step-prev").onclick = () => { stopTour(); step(-1); };
$(".step-next").onclick = () => { stopTour(); step(1); };

const tourBtn = $(".tour");
let tourTimer = null;
function stopTour() { if (!tourTimer) return; clearTimeout(tourTimer); tourTimer = null; tourBtn.textContent = "Take the tour"; tourBtn.classList.remove("is-on"); }
function runTour(i = 0) {
  const seq = ["core", ...STATIONS.map((s) => s.id)];
  if (i >= seq.length) { stopTour(); return go("overview"); }
  go(seq[i]);
  tourTimer = setTimeout(() => runTour(i + 1), reduce ? 6000 : 4800);
}
tourBtn.onclick = () => { if (tourTimer) { stopTour(); return; } tourBtn.textContent = "Stop tour"; tourBtn.classList.add("is-on"); runTour(); };

/* ---------- camera ---------- */
let tween = null, current = null, focused = null;
const off = { x: 0, y: 0, tx: 0, ty: 0 };
function flyTo(pos, target, dur = 1.6) {
  if (reduce) { camera.position.copy(pos); controls.target.copy(target); controls.update(); return; }
  tween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos, t1: target, start: performance.now(), dur: dur * 1000 };
}
const ease = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
function panelOffset(open) {
  const wide = innerWidth > 760;
  off.tx = open && wide ? panel.offsetWidth / 2 + 7 : 0;
  off.ty = open && !wide ? panel.offsetHeight / 2 : 0;
}

function setActive(id) {
  nav.querySelectorAll("button").forEach((b) => b.classList.toggle("is-on", b.dataset.go === id));
  stepper.hidden = !id;
  document.body.classList.toggle("in-station", !!id);
  Object.values(stationObjs).forEach((o) => { o.btn.classList.toggle("is-on", o.s.id === id); o.btn.classList.toggle("is-dim", !!id && o.s.id !== id); o.line.material.opacity = id ? 0 : 0.22; o.sparks.forEach((sp) => (sp.visible = !id)); });
  all.forEach((it) => { it.state.near = it.station.id === id; it.lbl.classList.toggle("is-show", it.state.near); });
}
function setFocus(it) {
  if (focused) { focused.state.hot = false; focused.lbl.classList.remove("is-hot"); }
  focused = it;
  if (it) { it.state.hot = true; it.lbl.classList.add("is-hot"); }
}

function go(id, it, push = true) {
  controls.autoRotate = false;
  setFocus(it || null);
  if (id === "overview") {
    current = null; setActive(null); panel.hidden = true; panelOffset(false);
    flyTo(new THREE.Vector3(0, 16, 40), new THREE.Vector3(0, 0, 0));
    controls.autoRotate = !reduce;
    if (push) history.replaceState(null, "", location.pathname);
    return;
  }
  if (id === "core") {
    current = null; setActive(null);
    openPanel("About", "core"); panelOffset(true);
    flyTo(new THREE.Vector3(0, 1.2, 8.5), new THREE.Vector3(0, 0, 0));
    if (push) history.replaceState(null, "", "#about");
    return;
  }
  const o = stationObjs[id]; current = o.s; setActive(id); lastStation = id;
  openPanel(o.s.label, o.s.section, it);
  panelOffset(true);
  const P = o.g.position, out = new THREE.Vector3(P.x, 0, P.z).normalize();
  if (it) {
    const wp = it.obj.getWorldPosition(new THREE.Vector3());
    flyTo(wp.clone().addScaledVector(out, -5).add(new THREE.Vector3(0, 0.9, 0)), wp, 1.1);
  } else {
    const dist = Math.max(6.5, Math.max(o.w, o.h * 1.6) * 1.15 + 2);
    flyTo(P.clone().addScaledVector(out, -dist).add(new THREE.Vector3(0, 1.4, 0)), P.clone().add(new THREE.Vector3(0, 0.1, 0)));
  }
  if (push) history.replaceState(null, "", "#" + id);
}

/* ---------- picking ---------- */
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let hover = null, downAt = null;
function hit(e) {
  const r = renderer.domElement.getBoundingClientRect();
  ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ptr, camera);
  const h = ray.intersectObjects(pick, true)[0];
  return h ? h.object.userData.pick : null;
}
const card = $(".hovercard");
function placeCard(e) {
  const r = card.getBoundingClientRect();
  card.style.left = Math.min(e.clientX + 18, innerWidth - r.width - 12) + "px";
  card.style.top = Math.min(e.clientY + 18, innerHeight - r.height - 12) + "px";
}
const mouse = { x: 0, y: 0 };
renderer.domElement.addEventListener("pointermove", (e) => {
  mouse.x = e.clientX / innerWidth - 0.5; mouse.y = e.clientY / innerHeight - 0.5;
  const p = hit(e);
  if (e.pointerType === "mouse" && p?.sum) { placeCard(e); }
  if (p === hover) return;
  if (e.pointerType === "mouse" && p?.sum) {
    card.querySelector("b").textContent = p.sum.title;
    card.querySelector("span").textContent = p.sum.txt;
    card.querySelector("i").textContent = p.href ? "Click to open" : "Click for details";
    card.hidden = false; placeCard(e);
  } else card.hidden = true;
  if (hover && hover !== focused && hover.state) { hover.state.hot = false; hover.lbl.classList.remove("is-hot"); }
  hover = p;
  if (p && p.state) { p.state.hot = true; p.lbl.classList.add("is-hot"); }
  renderer.domElement.style.cursor = p ? "pointer" : "grab";
});
renderer.domElement.addEventListener("pointerleave", () => (card.hidden = true));
renderer.domElement.addEventListener("pointerdown", (e) => { downAt = [e.clientX, e.clientY]; dragging = true; stopTour(); });
addEventListener("pointerup", () => (dragging = false));
renderer.domElement.addEventListener("wheel", stopTour, { passive: true });
let dragging = false;
renderer.domElement.addEventListener("pointerup", (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  const p = hit(e);
  if (!p) return;
  card.hidden = true;
  if (p.kind === "core") return go("core");
  if (p.href) {
    go(p.station.id, p);
    setTimeout(() => (p.href.startsWith("mailto:") ? (location.href = p.href) : window.open(p.href.startsWith("data/") ? "../" + p.href : p.href, "_blank", "noopener")), 450);
    return;
  }
  go(p.station.id, p);
});
addEventListener("keydown", (e) => {
  if (e.target.closest?.("input, textarea")) return;
  if (e.key === "Escape") { stopTour(); go("overview"); }
  else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
    e.preventDefault(); stopTour();
    const d = e.key === "ArrowRight" ? 1 : -1;
    if (current) step(d);
    else { const i = STATIONS.findIndex((s) => s.id === lastStation); go(STATIONS[(i + d + STATIONS.length) % STATIONS.length].id); }
  }
});
let lastStation = null;

/* ---------- loop ---------- */
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h); composer.setSize(w, h); labels.setSize(w, h);
  bloom.resolution.set(w, h);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  if (!panel.hidden) panelOffset(true);
}
addEventListener("resize", resize); resize();

const clock = new THREE.Clock();
const par = { x: 0, y: 0, px: 0, py: 0 };
let t = 0;
all.forEach((it) => it.obj.userData.tick?.(0, 1, it.state));
function frame() {
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!reduce) t += dt;
  if (tween) {
    const k = Math.min(1, (performance.now() - tween.start) / tween.dur), e = ease(k);
    camera.position.lerpVectors(tween.p0, tween.p1, e);
    camera.position.y += Math.sin(Math.PI * k) * tween.p0.distanceTo(tween.p1) * 0.08;
    controls.target.lerpVectors(tween.t0, tween.t1, e);
    if (k >= 1) tween = null;
  }
  off.x += (off.tx - off.x) * Math.min(1, dt * 5); off.y += (off.ty - off.y) * Math.min(1, dt * 5);
  if (Math.abs(off.x) + Math.abs(off.y) > 0.5) camera.setViewOffset(innerWidth, innerHeight, off.x, off.y, innerWidth, innerHeight);
  else camera.clearViewOffset();
  controls.update();

  if (!reduce) {
    all.forEach((it) => {
      it.obj.userData.tick?.(t, dt, it.state);
      it.lift = (it.lift || 0) + ((it.state.hot ? 0.22 : 0) - (it.lift || 0)) * Math.min(1, dt * 6);
      it.obj.position.y = it.pos.y + it.lift;
    });
    if (!current && panel.hidden && !tween && !dragging) {
      par.x += (mouse.x * 2.4 - par.x) * Math.min(1, dt * 2); par.y += (-mouse.y * 1.6 - par.y) * Math.min(1, dt * 2);
      camera.position.x += par.x - par.px; camera.position.y += par.y - par.py;
    }
    par.px = par.x; par.py = par.y;
    shell.rotation.y += dt * 0.12; shell.rotation.x += dt * 0.05; inner.rotation.y -= dt * 0.2;
    rings.forEach((r, i) => { r.rotation.z += dt * (0.2 + i * 0.12); });
    halo.material.opacity = 0.45 + 0.12 * Math.sin(t * 1.5);
    dustPts.rotation.y += dt * 0.01;
    Object.values(stationObjs).forEach((o) => {
      const on = current && o.s.id === current.id;
      o.sparks.forEach((sp, k) => {
        const u = (t * (on ? 0.35 : 0.12) + sp.userData.off + k / 3) % 1;
        sp.position.copy(o.curve.getPoint(u)); sp.material.opacity = Math.sin(Math.PI * u) * (on ? 1 : 0.6);
      });
      o.pad.material.emissiveIntensity = on ? 0.7 + 0.2 * Math.sin(t * 3) : 0.6;
    });
  }
  composer.render();
  labels.render(scene, camera);
}
renderer.setAnimationLoop(frame);
document.addEventListener("visibilitychange", () => renderer.setAnimationLoop(document.hidden ? null : frame));

$(".loader").classList.add("is-done");
const start = location.hash.slice(1);
if (start === "about") go("core", null, false);
else if (stationObjs[start]) go(start, null, false);
else { camera.position.set(0, 34, 62); flyTo(new THREE.Vector3(0, 16, 40), new THREE.Vector3(), 2.6); controls.autoRotate = !reduce; }
