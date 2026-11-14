// Chorsu Run: an original 3D lane runner through a bazaar street.
// three.js is loaded on demand the first time the game opens, then kept by sw.js for offline play.
// Controls: swipe left/right = change lane, up = jump, down = roll (umbaloq).

const Game = (() => {
  const LIBS = [
    "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.module.min.js",
    "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.min.js",
    "https://unpkg.com/three@0.160.0/build/three.module.min.js",
  ];
  const LANE = 2, SLOT = 10, SLOTS = 15, LOOP = SLOT * SLOTS, FAR = -LOOP, GONE = 14;
  const CAM_Y = 4.3, CAM_Z = 8.4, GRAV = 26, JUMP = 9.6, ROLL = 0.62, V0 = 15, VMAX = 33;
  const HEARTS = 3, STAKE = 25, SLOT_MS = 30 * 60 * 1000;

  // Each mood lasts 30 minutes of real time, then the next one fades in.
  const MOODS = [
    { name: "Quyoshli kun", icon: "sun", top: "#2E86E8", bot: "#CFE9FF", fog: "#D3E7F8", near: 50, far: 150, hemiSky: "#FFFFFF", hemiGnd: "#BBA57E", hemi: 1.5, sunCol: "#FFF0D2", sun: 2.6, dir: [0.55, 0.8, 0.3], exp: 1, grass: "#7DB55A", road: "#F2EEE8", disc: "#FFF4C2", discDir: [0.2, 0.33, -1], discA: 1, glow: 0.55, stars: 0, lamps: 0, cloud: 1, wet: 0, snow: 0, rain: 0, flakes: 0 },
    { name: "Shom payti", icon: "sunset", top: "#3E4FA8", bot: "#FFA869", fog: "#F3B18A", near: 45, far: 150, hemiSky: "#FFC9A8", hemiGnd: "#8A6E66", hemi: 1.7, sunCol: "#FF9550", sun: 2.6, dir: [-0.5, 0.3, -0.6], exp: 1.05, grass: "#86A35A", road: "#F1D9C6", disc: "#FFD27A", discDir: [-0.12, 0.13, -1], discA: 1, glow: 0.9, stars: 0.15, lamps: 0.5, cloud: 0.9, wet: 0, snow: 0, rain: 0, flakes: 0 },
    { name: "Tun", icon: "moon", top: "#040A22", bot: "#1A2A58", fog: "#131E42", near: 35, far: 140, hemiSky: "#7E95FF", hemiGnd: "#1A1F3A", hemi: 1.0, sunCol: "#A9BEFF", sun: 0.9, dir: [0.35, 0.7, -0.4], exp: 1.15, grass: "#4E6E57", road: "#A9B2CC", disc: "#EAF0FF", discDir: [0.18, 0.36, -1], discA: 1, glow: 0.35, stars: 1, lamps: 1, cloud: 0.18, wet: 0, snow: 0, rain: 0, flakes: 0 },
    { name: "Yomg'irli kun", icon: "rain", top: "#56636F", bot: "#A3AEB8", fog: "#9CA8B2", near: 22, far: 115, hemiSky: "#E3EAF0", hemiGnd: "#6F7377", hemi: 1.8, sunCol: "#DCE4EC", sun: 0.8, dir: [0.3, 0.9, 0.2], exp: 0.95, grass: "#5F9A55", road: "#8E949B", disc: "#FFFFFF", discDir: [0.2, 0.33, -1], discA: 0, glow: 0, stars: 0, lamps: 0.6, cloud: 0, wet: 1, snow: 0, rain: 1, flakes: 0 },
    { name: "Qorli kun", icon: "snow", top: "#9FB6D0", bot: "#EAF1F8", fog: "#E4ECF4", near: 25, far: 125, hemiSky: "#FFFFFF", hemiGnd: "#C9D3DD", hemi: 2.3, sunCol: "#FFFFFF", sun: 1.4, dir: [0.4, 0.8, 0.3], exp: 1, grass: "#F2F6FA", road: "#E8EDF2", disc: "#FFFFFF", discDir: [0.2, 0.33, -1], discA: 0, glow: 0, stars: 0, lamps: 0.25, cloud: 0.5, wet: 0, snow: 1, rain: 0, flakes: 1 },
  ];
  const COL = ["top", "bot", "fog", "hemiSky", "hemiGnd", "sunCol", "grass", "road", "disc"];
  const NUM = ["near", "far", "hemi", "sun", "exp", "discA", "glow", "stars", "lamps", "cloud", "wet", "snow", "rain", "flakes"];
  const SFX = { coin: ["sine", 990, 1480, 0.09, 0.06], jump: ["sine", 320, 640, 0.16, 0.06], roll: ["triangle", 420, 160, 0.2, 0.06], swish: ["sine", 520, 380, 0.07, 0.03], near: ["square", 660, 1320, 0.12, 0.03], bump: ["sawtooth", 200, 90, 0.16, 0.07], crash: ["sawtooth", 170, 38, 0.45, 0.12], ok: ["sine", 660, 1320, 0.25, 0.07], bad: ["square", 220, 110, 0.3, 0.05] };

  let T = null, root = null, el = {}, alive = false;
  let renderer = null, scene = null, camera = null, raf = 0, last = 0, time = 0, W = 0, H = 0, baseFov = 70;
  let S = {}, P = null, cur = null, moodIdx = 0, moodOverride = null;
  let scn = [], objs = [], pools = {};
  let state = "load", speed = V0, dist = 0, coins = 0, hearts = HEARTS, spawnIn = 0, rows = 0;
  let lane = 1, prevLane = 1, px = 0, py = 0, vy = 0, rollT = 0, lowT = 0, jumpBuf = 0, fastFall = false;
  let invuln = 0, stumbleT = 0, crashT = 0, slowmo = 0, shake = 0, camX = 0, kick = 0, bolt = 8;
  let laneAt = -9, jumpAt = -9, rollAt = -9, auto = false;
  let flowTimer = 0, hintTimer = 0, audio = null, muted = false;
  const shown = {}, quality = { n: 0, sum: 0, done: false };

  /* ---------- small helpers ---------- */
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const laneX = (l) => (l - 1) * LANE;
  const best = () => store.get("run_best", 0);
  const slotMood = () => Math.floor(Date.now() / SLOT_MS) % MOODS.length;
  const num = (v) => String(v).replace(".", ",");
  const score = () => Math.floor(dist) + coins * 10;

  function buzz(kind, pattern) {
    try { /error|success|warning/.test(kind) ? tg.HapticFeedback.notificationOccurred(kind) : tg.HapticFeedback.impactOccurred(kind); } catch {}
    if (pattern && navigator.vibrate) { try { navigator.vibrate(pattern); } catch {} }
  }
  function sfx(name) {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      if (audio.state === "suspended") audio.resume();
      const [type, f0, f1, dur, vol] = SFX[name], t0 = audio.currentTime, o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(audio.destination); o.start(t0); o.stop(t0 + dur);
    } catch {}
  }

  /* ---------- DOM shell ---------- */
  const LOADING = `<div class="run-spin"></div><p>Yuklanmoqda…</p>`;
  function mount() {
    root = document.createElement("div");
    root.className = "run";
    root.innerHTML = `
      <canvas class="run-cv"></canvas>
      <div class="run-flash"></div>
      <div class="run-ov"></div>
      <div class="run-fx"></div>
      <div class="run-hint"></div>
      <div class="run-top">
        <div class="run-hud"><span>${ic("flag")}<b data-k="dist">0</b>m</span><span>${ic("coin")}<b data-k="coins">0</b></span></div>
        <div class="run-right"><span class="run-hearts"></span><button class="run-btn" data-k="snd" aria-label="Ovoz"></button><button class="run-btn" data-k="x" aria-label="Yopish">${ic("x")}</button></div>
      </div>`;
    document.body.appendChild(root);
    const q = (s) => root.querySelector(s);
    el = { cv: q(".run-cv"), flash: q(".run-flash"), ov: q(".run-ov"), fx: q(".run-fx"), hint: q(".run-hint"), dist: q('[data-k="dist"]'), coins: q('[data-k="coins"]'), hearts: q(".run-hearts"), snd: q('[data-k="snd"]') };
    q('[data-k="x"]').onclick = exit;
    muted = store.get("run_mute", false);
    el.snd.onclick = () => { muted = !muted; store.set("run_mute", muted); el.snd.innerHTML = ic(muted ? "mute" : "sound"); };
    el.snd.innerHTML = ic(muted ? "mute" : "sound");
    alive = true; state = "load"; moodOverride = null;
    card(LOADING);
    init();
  }
  function unmount() {
    alive = false; cancelAnimationFrame(raf); clearTimeout(flowTimer); clearTimeout(hintTimer);
    window.removeEventListener("resize", resize); window.removeEventListener("keydown", onKey);
    document.removeEventListener("visibilitychange", onHide);
    if (renderer) { renderer.dispose(); try { renderer.forceContextLoss(); } catch {} renderer = null; }
    scene = null; scn = []; objs = []; pools = {}; P = null; S = {};
    if (root) { root.remove(); root = null; }
  }
  function card(html, acts = {}, cls = "") {
    el.ov.className = "run-ov show " + cls;
    el.ov.innerHTML = `<div class="run-card">${html}</div>`;
    el.ov.querySelectorAll("[data-a]").forEach((b) => { b.onclick = () => acts[b.dataset.a] && acts[b.dataset.a](b); });
  }
  function hideCard() { el.ov.className = "run-ov"; el.ov.innerHTML = ""; }
  function pop(text, cls = "") {
    const s = document.createElement("span");
    s.className = "run-pop " + cls; s.textContent = text;
    el.fx.appendChild(s); setTimeout(() => s.remove(), 950);
  }
  function flash(color, a) {
    const f = el.flash;
    f.style.transition = "none"; f.style.background = color; f.style.opacity = a;
    void f.offsetWidth;
    f.style.transition = "opacity .55s ease-out"; f.style.opacity = 0;
  }
  function hud(force) {
    const d = Math.floor(dist);
    if (force || d !== shown.d) el.dist.textContent = shown.d = d;
    if (force || coins !== shown.c) el.coins.textContent = shown.c = coins;
    if (force || hearts !== shown.h) { shown.h = hearts; el.hearts.innerHTML = [0, 1, 2].map((i) => ic("heart", i < hearts ? "on" : "")).join(""); }
  }
  function fail(title, text) {
    if (!alive) return;
    card(`${chip("alert", "lg solid")}<h2>${title}</h2><p>${text}</p><button class="btn-primary" data-a="retry">${ic("refresh")} Qayta urinish</button>`, { retry: () => { card(LOADING); init(); } });
  }

  async function loadLib() {
    for (const url of LIBS) { try { return await import(url); } catch {} }
    throw new Error("three.js could not be loaded");
  }
  async function init() {
    try { T = T || (await loadLib()); }
    catch { return fail("Yuklab bo'lmadi", "Internetga ulanib, qayta urinib ko'ring. Bir marta ochilgandan keyin o'yin internetsiz ham ishlaydi."); }
    if (!alive) return;
    try { renderer = new T.WebGLRenderer({ canvas: el.cv, antialias: true, powerPreference: "high-performance" }); }
    catch { return fail("3D grafika ishlamadi", "Bu qurilma yoki brauzer 3D grafikani qo'llab-quvvatlamaydi."); }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap;
    for (const m of MOODS) if (!m.c) {
      m.c = {}; for (const c of COL) m.c[c] = new T.Color(m[c]);
      m.v = { dir: new T.Vector3(...m.dir).normalize(), discDir: new T.Vector3(...m.discDir).normalize() };
    }
    buildScene();
    moodIdx = slotMood();
    const m = MOODS[moodIdx];
    cur = { dir: m.v.dir.clone(), discDir: m.v.discDir.clone() };
    for (const c of COL) cur[c] = m.c[c].clone();
    for (const n of NUM) cur[n] = m[n];
    quality.done = false;
    resize(); window.addEventListener("resize", resize);
    bindInput(); document.addEventListener("visibilitychange", onHide);
    reset(); showMenu();
    last = performance.now(); raf = requestAnimationFrame(loop);
  }
  function resize() {
    if (!renderer) return;
    W = root.clientWidth; H = root.clientHeight;
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    // widen the view on tall phone screens so all three lanes stay visible
    baseFov = clamp(T.MathUtils.radToDeg(2 * Math.atan((LANE + 0.85) / (CAM_Z * camera.aspect))), 54, 78);
    camera.fov = baseFov; camera.updateProjectionMatrix();
  }
  function lowQuality() {
    renderer.setPixelRatio(1); renderer.shadowMap.enabled = false; S.sun.castShadow = false;
    W = 0; resize();
  }

  /* ---------- scene building ---------- */
  function tex(w, h, draw, rx = 1, ry = 1) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    draw(c.getContext("2d"), w, h);
    const t = new T.CanvasTexture(c);
    t.colorSpace = T.SRGBColorSpace; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 4;
    return t;
  }
  // Bakes many coloured primitives into one geometry, so a whole prop costs a single draw call.
  const NI = new Map();
  function baker() {
    const ps = [], ns = [], cs = [];
    const m = new T.Matrix4(), nm = new T.Matrix3(), v = new T.Vector3(), sc = new T.Vector3(), q = new T.Quaternion(), eu = new T.Euler(), col = new T.Color();
    return {
      add(geo, color, s, p, r) {
        let g = NI.get(geo);
        if (!g) { g = geo.index ? geo.toNonIndexed() : geo; NI.set(geo, g); }
        const pa = g.attributes.position, na = g.attributes.normal;
        eu.set(r ? r[0] : 0, r ? r[1] : 0, r ? r[2] : 0); q.setFromEuler(eu);
        m.compose(v.set(p[0], p[1], p[2]), q, sc.set(s[0], s[1], s[2])); nm.getNormalMatrix(m);
        col.set(color);
        for (let i = 0; i < pa.count; i++) {
          v.fromBufferAttribute(pa, i).applyMatrix4(m); ps.push(v.x, v.y, v.z);
          v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); ns.push(v.x, v.y, v.z);
          cs.push(col.r, col.g, col.b);
        }
        return this;
      },
      geo() {
        const g = new T.BufferGeometry();
        g.setAttribute("position", new T.Float32BufferAttribute(ps, 3));
        g.setAttribute("normal", new T.Float32BufferAttribute(ns, 3));
        g.setAttribute("color", new T.Float32BufferAttribute(cs, 3));
        return g;
      },
    };
  }

  function buildScene() {
    NI.clear();
    scene = new T.Scene();
    camera = new T.PerspectiveCamera(70, 1, 0.1, 1500);
    S = { snow: [], scroll: [], walkers: [], facades: [], snowOn: false, tmpC: new T.Color(), white: new T.Color("#FFFFFF") };
    const box = new T.BoxGeometry(1, 1, 1), sph = new T.SphereGeometry(1, 12, 9), cyl = new T.CylinderGeometry(1, 1, 1, 12);
    const cone = new T.ConeGeometry(1, 1, 7), ico = new T.IcosahedronGeometry(1, 1), taper = new T.CylinderGeometry(0.55, 1, 1, 10), plane = new T.PlaneGeometry(1, 1);
    S.g = { box, sph, cyl, cone, ico, taper, plane };
    S.prop = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0.02 });
    S.snowMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, transparent: true, opacity: 0 });
    scene.fog = new T.Fog(0xffffff, 50, 150);

    // sky dome with a vertical gradient
    S.skyMat = new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new T.Color() }, bot: { value: new T.Color() } },
      vertexShader: "varying vec3 vP;\nvoid main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 bot; varying vec3 vP;\nvoid main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bot, top, smoothstep(-0.02, 0.55, h)), 1.0);\n#include <colorspace_fragment>\n}",
    });
    const sky = new T.Mesh(new T.SphereGeometry(1200, 24, 12), S.skyMat); sky.renderOrder = -10; sky.frustumCulled = false; scene.add(sky);

    // ground: paved road, sidewalks, grass (textures scroll to give the feeling of speed)
    const roadT = tex(512, 512, (g, w, h) => {
      g.fillStyle = "#d6d0c6"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 32) for (let x = -64; x < w; x += 64) {
        const v = 198 + Math.floor(Math.random() * 34);
        g.fillStyle = `rgb(${v + 8},${v + 2},${v - 8})`; g.fillRect(x + ((y / 32) % 2 ? 32 : 0) + 1, y + 1, 62, 30);
      }
      for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(80,70,60,${Math.random() * 0.12})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      g.fillStyle = "rgba(255,255,255,.9)";
      for (const lx of [0.365, 0.635]) for (let y = 0; y < h; y += 256) g.fillRect(lx * w - 4, y, 8, 128);
    }, 1, 440 / 7.4);
    const walkT = tex(256, 256, (g, w, h) => {
      g.fillStyle = "#efebe4"; g.fillRect(0, 0, w, h);
      for (let y = 0; y < h; y += 64) for (let x = 0; x < w; x += 64) { const v = 226 + Math.floor(Math.random() * 20); g.fillStyle = `rgb(${v},${v - 3},${v - 9})`; g.fillRect(x + 1, y + 1, 62, 62); }
    }, 2, 440 / 2.7);
    const grassT = tex(256, 256, (g, w, h) => {
      g.fillStyle = "#f1f1f1"; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 2600; i++) { g.fillStyle = Math.random() < 0.5 ? `rgba(0,0,0,${0.03 + Math.random() * 0.1})` : `rgba(255,255,255,${Math.random() * 0.5})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, 60, 66);
    S.roadMat = new T.MeshStandardMaterial({ map: roadT, roughness: 0.95 });
    S.walkMat = new T.MeshStandardMaterial({ map: walkT, roughness: 0.95 });
    S.grassMat = new T.MeshStandardMaterial({ map: grassT, roughness: 1 });
    S.scroll.push([roadT, 7.4], [walkT, 2.7], [grassT, 440 / 66]);
    const ground = (w, mat, x, y) => { const p = new T.Mesh(new T.PlaneGeometry(w, 440), mat); p.rotation.x = -Math.PI / 2; p.position.set(x, y, -180); p.receiveShadow = true; scene.add(p); };
    ground(7.4, S.roadMat, 0, 0); ground(5.4, S.walkMat, -6.7, 0.07); ground(5.4, S.walkMat, 6.7, 0.07); ground(460, S.grassMat, 0, -0.03);
    const kerbMat = new T.MeshStandardMaterial({ color: 0xbfb9ae, roughness: 0.9 });
    for (const s of [-1, 1]) { const k = new T.Mesh(box, kerbMat); k.scale.set(0.3, 0.2, 440); k.position.set(s * 3.85, 0.05, -180); k.receiveShadow = true; scene.add(k); }

    // lights
    S.hemi = new T.HemisphereLight(0xffffff, 0xbba57e, 2); scene.add(S.hemi);
    S.sun = new T.DirectionalLight(0xffffff, 3); S.sun.castShadow = true;
    const sh = S.sun.shadow; sh.mapSize.set(1024, 1024); sh.bias = -0.0005; sh.normalBias = 0.03;
    Object.assign(sh.camera, { left: -22, right: 22, top: 30, bottom: -30, near: 1, far: 170 });
    S.sun.target.position.set(0, 0, -12); scene.add(S.sun, S.sun.target);
    S.lamp = new T.PointLight(0xffd9a0, 0, 24, 1.5); S.lamp.position.set(0, 3.4, -3); scene.add(S.lamp);

    // far backdrop: sun or moon, stars, clouds, mountains and the blue dome the road leads to
    const dot = (soft) => tex(128, 128, (g) => { const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(soft ? 0.25 : 0.82, soft ? "rgba(255,255,255,.35)" : "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 128, 128); });
    const dotT = dot(false), softT = dot(true);
    S.disc = new T.Sprite(new T.SpriteMaterial({ map: dotT, transparent: true, depthWrite: false, fog: false })); S.disc.scale.set(74, 74, 1);
    S.glow = new T.Sprite(new T.SpriteMaterial({ map: softT, transparent: true, depthWrite: false, fog: false, blending: T.AdditiveBlending })); S.glow.scale.set(460, 460, 1);
    scene.add(S.glow, S.disc);
    const sp = [];
    for (let i = 0; i < 520; i++) { const a = rnd(0, Math.PI * 2), e = rnd(0.06, 1.45); sp.push(Math.cos(a) * Math.cos(e) * 1000, Math.sin(e) * 1000, Math.sin(a) * Math.cos(e) * 1000); }
    const sg = new T.BufferGeometry(); sg.setAttribute("position", new T.Float32BufferAttribute(sp, 3));
    S.stars = new T.Points(sg, new T.PointsMaterial({ color: 0xffffff, size: 2.2, sizeAttenuation: false, transparent: true, opacity: 0, fog: false, depthWrite: false }));
    S.stars.frustumCulled = false; scene.add(S.stars);
    S.cloudMat = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, fog: false, depthWrite: false });
    S.clouds = [];
    for (let i = 0; i < 7; i++) {
      const g = new T.Group(); g.position.set(rnd(-340, 340), rnd(95, 170), rnd(-520, -330));
      for (let j = 0; j < 4; j++) { const c = new T.Mesh(sph, S.cloudMat); c.scale.set(rnd(26, 44), rnd(9, 14), rnd(16, 24)); c.position.set((j - 1.5) * 26, rnd(-3, 5), rnd(-8, 8)); g.add(c); }
      scene.add(g); S.clouds.push(g);
    }
    S.mtBase = new T.Color("#6F84A6"); S.domeBase = new T.Color("#1B86D6"); S.wallBase = new T.Color("#D9C4A0");
    S.mtMat = new T.MeshBasicMaterial({ fog: false }); S.capMat = new T.MeshBasicMaterial({ fog: false });
    for (let i = 0; i < 9; i++) {
      const h = rnd(75, 135), r = rnd(95, 150), x = -440 + i * 110 + rnd(-25, 25), z = -470 - rnd(0, 70);
      const a = new T.Mesh(cone, S.mtMat); a.scale.set(r, h, r); a.position.set(x, h / 2 - 5, z); a.rotation.y = rnd(0, 3);
      const b = new T.Mesh(cone, S.capMat); b.scale.set(r * 0.345, h * 0.34, r * 0.345); b.position.set(x, h * 0.83 - 4.6, z); b.rotation.y = a.rotation.y;
      scene.add(a, b);
    }
    S.domeMat = new T.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1, fog: false });
    S.wallMat = new T.MeshStandardMaterial({ roughness: 0.9, fog: false });
    const arch = new T.MeshStandardMaterial({ color: 0x5d4a37, roughness: 0.9, fog: false });
    const dome = new T.Group(); dome.position.set(0, 0, -255);
    const dm = (g, mat, s, p, ry) => { const me = new T.Mesh(g, mat); me.scale.set(...s); me.position.set(...p); if (ry) me.rotation.y = ry; dome.add(me); };
    dm(new T.CylinderGeometry(1, 1, 1, 28), S.wallMat, [34, 13, 34], [0, 6.5, 0]);
    dm(new T.SphereGeometry(1, 28, 16), S.domeMat, [31, 20, 31], [0, 13, 0]);
    for (const a of [0.75, 2.4, 3.9, 5.5]) { dm(cyl, S.wallMat, [8.5, 8, 8.5], [Math.cos(a) * 43, 4, Math.sin(a) * 43]); dm(sph, S.domeMat, [7.8, 5.6, 7.8], [Math.cos(a) * 43, 8, Math.sin(a) * 43]); }
    for (let i = -2; i <= 2; i++) { const x = i * 9.5; dm(box, arch, [4.6, 8, 1], [x, 4, Math.sqrt(34 * 34 - x * x) + 0.15], Math.atan2(x, 34)); }
    scene.add(dome);

    buildProps(); populate(); buildPlayer(); buildWeather();
  }

  function buildProps() {
    const { box, sph, cyl, ico, taper } = S.g, G = {};
    const cloths = ["#3A6EA5", "#C0392B", "#2E8B57", "#8E44AD", "#D68910", "#34495E", "#F2F2F2", "#1ABC9C"];
    const fruit = ["#F4902C", "#D7372F", "#F2C230", "#7BB342", "#8E3B8C", "#F2E5C4"];
    const person = (k, ox, oz) => {
      const cloth = pick(cloths), skin = pick(["#E8B48C", "#D9A074", "#C68B5E"]);
      if (Math.random() < 0.45) {       // long dress and headscarf
        k.add(taper, cloth, [0.31, 1.42, 0.27], [ox, 0.71, oz]);
        k.add(sph, pick(["#F4D35E", "#E63946", "#FFFFFF", "#2A9D8F"]), [0.185, 0.2, 0.185], [ox, 1.63, oz - 0.04]);
      } else {                           // trousers, shirt and doppi
        for (const x of [-0.1, 0.1]) k.add(box, "#2B2F3A", [0.15, 0.82, 0.17], [ox + x, 0.41, oz]);
        k.add(cyl, cloth, [0.24, 0.62, 0.17], [ox, 1.1, oz]);
        k.add(cyl, "#1D1D22", [0.15, 0.07, 0.15], [ox, 1.79, oz]);
      }
      for (const x of [-0.3, 0.3]) k.add(cyl, cloth, [0.065, 0.56, 0.065], [ox + x, 1.08, oz]);
      k.add(sph, skin, [0.16, 0.18, 0.16], [ox, 1.6, oz]);
    };

    // scenery
    S.stalls = [0, 1, 2, 3].map((i) => {
      const k = baker(), aw = ["#D7263D", "#1B998B", "#F4A300", "#2E6FD8"][i];
      k.add(box, "#9A6B3F", [2.9, 0.9, 1.25], [0, 0.45, 0]).add(box, ["#F7F3E8", "#EBD9B4"][i % 2], [3.0, 0.05, 1.35], [0, 0.93, 0]);
      for (let j = 0; j < 4; j++) k.add(sph, fruit[(i + j) % 6], [0.34, 0.24, 0.42], [-1.08 + j * 0.72, 1.02, 0.02]);
      for (const x of [-0.9, 0.9]) { k.add(box, "#B98A52", [0.8, 0.42, 0.55], [x, 0.21, 1.0]); k.add(sph, fruit[(i + (x > 0 ? 3 : 5)) % 6], [0.34, 0.18, 0.22], [x, 0.46, 1.0]); }
      for (const x of [-1.45, 1.45]) for (const z of [-0.75, 1.0]) k.add(box, "#5E4630", [0.07, 2.55, 0.07], [x, 1.275, z]);
      for (let j = 0; j < 8; j++) k.add(box, j % 2 ? "#FFFFFF" : aw, [0.42, 0.07, 2.4], [-1.47 + j * 0.42, 2.58, 0.15], [0.17, 0, 0]);
      k.add(box, aw, [3.36, 0.3, 0.05], [0, 2.25, 1.33]);
      person(k, rnd(-0.7, 0.7), -1.1);
      return k.geo();
    });
    S.chinor = [0, 1].map(() => {
      const k = baker(); k.add(taper, "#6B4A2E", [0.36, 3.0, 0.36], [0, 1.5, 0]);
      for (const [x, y, z, r] of [[0, 4.1, 0, 2.0], [1.1, 3.5, 0.5, 1.35], [-1.0, 3.7, -0.4, 1.5], [0.2, 5.2, -0.3, 1.3]]) k.add(ico, pick(["#4E9A3C", "#5BAA46", "#3F8A33"]), [r, r * 0.85, r], [x, y, z]);
      return k.geo();
    });
    S.terak = (() => { const k = baker(); k.add(cyl, "#7A5A3A", [0.17, 2.4, 0.17], [0, 1.2, 0]); k.add(sph, "#3F8F3B", [0.95, 3.4, 0.95], [0, 5.2, 0]); k.add(sph, "#4BA046", [0.7, 2.2, 0.7], [0.1, 7.0, 0]); return k.geo(); })();
    S.folk = [...Array(6)].map(() => { const k = baker(); person(k, 0, 0); return k.geo(); });
    S.groups = [...Array(3)].map((_, i) => { const k = baker(); person(k, -0.35, 0); person(k, 0.35, 0.15); if (i) person(k, 0, -0.6); return k.geo(); });
    S.lampGeo = (() => {
      const k = baker(); k.add(cyl, "#2F3542", [0.07, 4.4, 0.07], [0, 2.2, 0]).add(box, "#2F3542", [0.95, 0.07, 0.07], [0.42, 4.36, 0]).add(box, "#2F3542", [0.36, 0.1, 0.22], [0.82, 4.4, 0]);
      k.add(box, "#7A5A3A", [0.7, 0.24, 1.7], [0.15, 0.12, 1.6]);
      for (let i = 0; i < 6; i++) k.add(sph, pick(["#E63946", "#F4D35E", "#FF8FAB", "#FFFFFF"]), [0.13, 0.13, 0.13], [rnd(-0.05, 0.35), 0.34, 0.95 + i * 0.26]);
      for (let i = 0; i < 4; i++) k.add(sph, "#4E9A3C", [0.2, 0.14, 0.24], [rnd(0, 0.3), 0.26, 1.0 + i * 0.4]);
      return k.geo();
    })();
    S.lampMat = new T.MeshStandardMaterial({ color: 0xfff3d0, emissive: 0xffd28a, emissiveIntensity: 0 });
    S.headMat = new T.MeshStandardMaterial({ color: 0xfff6dd, emissive: 0xffe9b0, emissiveIntensity: 0 });
    S.glowMat = new T.SpriteMaterial({ map: tex(64, 64, (g) => { const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, "rgba(255,225,160,1)"); r.addColorStop(1, "rgba(255,225,160,0)"); g.fillStyle = r; g.fillRect(0, 0, 64, 64); }), transparent: true, opacity: 0, depthWrite: false, blending: T.AdditiveBlending });
    S.roofMat = new T.MeshStandardMaterial({ color: 0x8c6a52, roughness: 0.9 });
    for (const wall of ["#E9D9BC", "#F1E7D6", "#D9B99A", "#CFE0EA"]) {
      const lit = [...Array(6)].map(() => Math.random() < 0.7);
      const paint = (night) => (g, w, h) => {
        g.fillStyle = night ? "#000" : wall; g.fillRect(0, 0, w, h);
        if (!night) { g.fillStyle = "rgba(0,0,0,.08)"; g.fillRect(0, h - 24, w, 24); }
        for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) {
          const x = 24 + c * 78, y = 30 + r * 100, door = r === 1 && c === 1;
          if (night) { if (!door && lit[r * 3 + c]) { g.fillStyle = "#FFD98A"; g.fillRect(x, y, 52, 68); } continue; }
          g.fillStyle = "#F7F3EA"; g.fillRect(x - 5, y - 5, 62, door ? 136 : 78);
          g.fillStyle = door ? "#7A4F2E" : "#3D5A7A"; g.fillRect(x, y, 52, door ? 126 : 68);
          if (!door) { g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(x, y, 52, 20); g.fillStyle = "#F7F3EA"; g.fillRect(x + 24, y, 4, 68); }
        }
      };
      const mat = new T.MeshStandardMaterial({ map: tex(256, 256, paint(false)), emissiveMap: tex(256, 256, paint(true)), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.9 });
      S.facades.push({ mat, wall: new T.MeshStandardMaterial({ color: wall, roughness: 0.9 }) });
    }

    // obstacles: low = jump over, high = roll under, full = change lane
    G.barrier = (() => {
      const k = baker();
      for (const x of [-0.82, 0.82]) k.add(box, "#3A3F4B", [0.09, 0.95, 0.09], [x, 0.475, 0]).add(box, "#3A3F4B", [0.5, 0.07, 0.5], [x, 0.035, 0]).add(sph, "#FFB703", [0.09, 0.09, 0.09], [x, 1.02, 0]);
      for (const y of [0.78, 0.38]) for (let i = 0; i < 6; i++) k.add(box, i % 2 ? "#FFFFFF" : "#E5383B", [0.31, 0.24, 0.07], [-0.775 + i * 0.31, y, 0]);
      return k.geo();
    })();
    G.crates = (() => {
      const k = baker();
      for (const x of [-0.47, 0.47]) k.add(box, "#B98A52", [0.86, 0.5, 0.62], [x, 0.25, 0]).add(box, "#8F6436", [0.88, 0.06, 0.64], [x, 0.5, 0]).add(sph, x < 0 ? "#F4902C" : "#D7372F", [0.38, 0.22, 0.27], [x, 0.56, 0]);
      k.add(sph, "#F4902C", [0.11, 0.11, 0.11], [0.05, 0.11, 0.5]).add(sph, "#D7372F", [0.11, 0.11, 0.11], [-0.5, 0.11, 0.48]);
      return k.geo();
    })();
    G.melons = (() => {
      const k = baker();
      for (const [x, y, z, c] of [[-0.48, 0.34, 0, "#2F7D32"], [0.5, 0.34, 0.05, "#3E9142"], [0, 0.34, 0.3, "#256B2A"], [0.02, 0.84, 0.1, "#3E9142"]]) k.add(sph, c, [0.36, 0.34, 0.36], [x, y, z]);
      k.add(sph, "#E5484D", [0.26, 0.05, 0.26], [0.85, 0.06, 0.4]).add(sph, "#256B2A", [0.28, 0.14, 0.28], [0.85, 0.02, 0.4]);
      return k.geo();
    })();
    G.banner = (() => {
      const k = baker(), ik = ["#C81D25", "#F2C14E", "#0B7A75", "#F7F3E3", "#7B2D8E", "#F28C28"];
      for (const x of [-0.92, 0.92]) k.add(cyl, "#6B4A2B", [0.06, 2.85, 0.06], [x, 1.425, 0]);
      k.add(box, "#6B4A2B", [1.95, 0.08, 0.08], [0, 2.8, 0]).add(box, "#E9B949", [1.8, 0.07, 0.04], [0, 1.31, 0]);
      for (let i = 0; i < 9; i++) k.add(box, ik[i % 6], [0.2, 1.42, 0.03], [-0.8 + i * 0.2, 2.05, 0]);
      return k.geo();
    })();
    G.damas = (() => {
      const k = baker(), wh = "#F4F5F7", gl = "#22303F", dk = "#2B2F36";
      k.add(box, wh, [1.6, 0.9, 3.1], [0, 0.8, 0]).add(box, wh, [1.5, 0.62, 2.5], [0, 1.56, -0.15]);
      k.add(box, gl, [1.34, 0.46, 0.05], [0, 1.56, 1.11]).add(box, gl, [1.52, 0.36, 2.0], [0, 1.6, -0.2]).add(box, gl, [1.3, 0.4, 0.05], [0, 1.58, -1.41]);
      k.add(box, "#FFC400", [1.62, 0.1, 3.12], [0, 0.62, 0]).add(box, dk, [1.62, 0.2, 0.12], [0, 0.42, 1.55]).add(box, dk, [1.62, 0.2, 0.12], [0, 0.42, -1.55]).add(box, dk, [0.8, 0.16, 0.05], [0, 0.86, 1.56]);
      for (const x of [-0.8, 0.8]) for (const z of [-1.0, 1.0]) k.add(cyl, "#15171B", [0.3, 0.2, 0.3], [x, 0.3, z], [0, 0, Math.PI / 2]);
      k.add(box, "#FFC400", [0.46, 0.14, 0.2], [0, 1.94, 0.4]);
      return k.geo();
    })();
    G.lights = (() => { const k = baker(); for (const x of [-0.55, 0.55]) k.add(box, "#FFFFFF", [0.3, 0.14, 0.05], [x, 0.86, 1.57]); return k.geo(); })();
    G.cart = (() => {
      const k = baker(), wd = "#A9773F", dk = "#4A3423";
      k.add(box, wd, [1.5, 0.14, 2.2], [0, 0.74, 0]);
      for (const x of [-0.72, 0.72]) k.add(box, wd, [0.08, 0.3, 2.2], [x, 0.95, 0]).add(cyl, dk, [0.52, 0.1, 0.52], [x * 1.17, 0.52, -0.1], [0, 0, Math.PI / 2]).add(box, wd, [0.07, 0.07, 1.1], [x * 0.76, 0.8, 1.55]).add(box, dk, [0.08, 0.62, 0.08], [x * 0.76, 0.31, 1.0]);
      for (const [x, y, z] of [[-0.3, 1.12, 0.5], [0.32, 1.12, -0.4], [-0.2, 1.12, -0.75], [0.05, 1.55, 0]]) k.add(sph, "#D9C7A3", [0.62, 0.34, 0.5], [x, y, z]);
      for (const [x, z] of [[0.45, 0.6], [-0.5, -0.1], [0.1, 0.95]]) k.add(sph, "#2F7D32", [0.27, 0.27, 0.27], [x, 1.1, z]);
      k.add(cyl, "#6B4A2B", [0.04, 1.5, 0.04], [0, 2.1, -0.2]).add(new T.ConeGeometry(1, 1, 8), "#E5383B", [1.25, 0.5, 1.25], [0, 2.95, -0.2]).add(sph, "#FFFFFF", [0.09, 0.09, 0.09], [0, 3.22, -0.2]);
      return k.geo();
    })();
    G.coin = new T.CylinderGeometry(0.3, 0.3, 0.07, 20).rotateX(Math.PI / 2);
    G.non = (() => { const k = baker(); k.add(cyl, "#E2A85C", [0.38, 0.1, 0.38], [0, 0, 0], [Math.PI / 2, 0, 0]).add(cyl, "#B77A35", [0.18, 0.13, 0.18], [0, 0, 0], [Math.PI / 2, 0, 0]); return k.geo(); })();
    G.samsa = (() => { const k = baker(); k.add(new T.ConeGeometry(1, 1, 3), "#D6913C", [0.42, 0.2, 0.42], [0, 0, 0], [Math.PI / 2, 0, 0]).add(sph, "#F3E3B8", [0.07, 0.07, 0.07], [0, 0.02, 0.1]); return k.geo(); })();
    S.coinMat = new T.MeshStandardMaterial({ color: 0xffc233, metalness: 0.3, roughness: 0.35, emissive: 0x7a4a00, emissiveIntensity: 0.55 });
    S.pickMat = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, emissive: 0x5a3300, emissiveIntensity: 0.4 });
    const ob = (geo) => () => { const m = new T.Mesh(geo, S.prop); m.castShadow = true; return m; };
    S.make = {
      barrier: ob(G.barrier), crates: ob(G.crates), melons: ob(G.melons), banner: ob(G.banner), cart: ob(G.cart),
      damas: () => { const m = ob(G.damas)(); m.add(new T.Mesh(G.lights, S.headMat)); return m; },
      coin: () => new T.Mesh(G.coin, S.coinMat), non: () => new T.Mesh(G.non, S.pickMat), samsa: () => new T.Mesh(G.samsa, S.pickMat),
    };
    S.defs = {
      barrier: { kind: "low", hd: 0.3 }, crates: { kind: "low", hd: 0.45 }, melons: { kind: "low", hd: 0.5 },
      banner: { kind: "high", hd: 0.3 }, damas: { kind: "full", hd: 1.6 }, cart: { kind: "full", hd: 1.3 },
      coin: { kind: "pick", hd: 0.3, val: 1 }, non: { kind: "pick", hd: 0.3, val: 5 }, samsa: { kind: "pick", hd: 0.3, val: 10 },
    };
  }

  function populate() {
    const { box, sph, ico, plane } = S.g;
    const add = (o, x, z) => { o.position.x = x; o.position.z = z; scene.add(o); scn.push(o); return o; };
    const prop = (geo) => { const m = new T.Mesh(geo, S.prop); m.castShadow = true; return m; };
    const snowOn = (parent, g, s, p, r) => { const m = new T.Mesh(g, S.snowMat); m.scale.set(...s); m.position.set(...p); if (r) m.rotation.set(...r); m.visible = false; parent.add(m); S.snow.push(m); };
    for (let i = 0; i < SLOTS; i++) for (const side of [-1, 1]) {
      const z = GONE - i * SLOT - (side > 0 ? SLOT * 0.5 : 0), r = Math.random();
      if (r < 0.64) { const m = prop(pick(S.stalls)); m.rotation.y = -side * Math.PI / 2; snowOn(m, box, [3.4, 0.1, 2.44], [0, 2.67, 0.15], [0.17, 0, 0]); add(m, side * 6.75, z); }
      else if (r < 0.86) { const m = prop(pick(S.chinor)); m.rotation.y = rnd(0, 6); snowOn(m, ico, [1.9, 0.55, 1.9], [0, 5.5, 0]); add(m, side * 6.6, z); }
      else { const m = prop(pick(S.groups)); m.rotation.y = -side * rnd(0.6, 2.4); add(m, side * 5.9, z); }
      const t = prop(S.terak); snowOn(t, sph, [0.6, 0.45, 0.6], [0.1, 9.0, 0]); add(t, side * rnd(10.2, 10.8), z - SLOT * 0.5);
      const f = pick(S.facades), w = rnd(8.2, 9.6), h = rnd(4.4, 7.4), hs = new T.Group();
      const body = new T.Mesh(box, f.wall); body.scale.set(6, h, w); body.position.y = h / 2; hs.add(body);
      const fa = new T.Mesh(plane, f.mat); fa.scale.set(w, h, 1); fa.position.set(-side * 3.02, h / 2, 0); fa.rotation.y = -side * Math.PI / 2; hs.add(fa);
      const rf = new T.Mesh(box, S.roofMat); rf.scale.set(6.3, 0.25, w + 0.3); rf.position.y = h + 0.12; hs.add(rf);
      snowOn(hs, box, [6.34, 0.22, w + 0.34], [0, h + 0.33, 0]);
      add(hs, side * 14.3, z);
      if (i % 3 === 0) {
        const l = prop(S.lampGeo); if (side > 0) l.rotation.y = Math.PI;
        const b = new T.Mesh(sph, S.lampMat); b.scale.setScalar(0.16); b.position.set(0.82, 4.3, 0); l.add(b);
        const gl = new T.Sprite(S.glowMat); gl.scale.set(3.4, 3.4, 1); gl.position.set(0.82, 4.25, 0); l.add(gl);
        add(l, side * 4.55, z - 3);
      }
    }
    for (let i = 0; i < 8; i++) {      // people walking along the sidewalks
      const m = prop(pick(S.folk)), side = i % 2 ? 1 : -1, d = Math.random() < 0.5 ? 1 : -1;
      m.position.set(side * rnd(4.4, 5.0), 0.07, GONE - rnd(0, LOOP)); m.rotation.y = d > 0 ? 0 : Math.PI;
      m.userData = { v: d * rnd(1.0, 1.6), ph: rnd(0, 6) }; scene.add(m); S.walkers.push(m);
    }
  }

  function buildPlayer() {
    const { sph, box } = S.g, theme = getComputedStyle(document.body).getPropertyValue("--p1").trim() || "#2748F5";
    const m = (c) => new T.MeshStandardMaterial({ color: c, roughness: 0.7 });
    const hood = m(theme), pants = m("#232B40"), skin = m("#E7B08A"), hair = m("#1F1A17"), shoe = m("#F5F6F8"), bag = m("#FFB020"), dark = m("#14161C");
    const cap = (r, l) => new T.CapsuleGeometry(r, l, 4, 10);
    const part = (g, mat, pos, sc) => { const me = new T.Mesh(g, mat); me.position.set(...pos); if (sc) me.scale.set(...sc); me.castShadow = true; return me; };
    const g = new T.Group(), pivot = new T.Group(), body = new T.Group(), head = new T.Group();
    g.add(pivot); pivot.add(body); pivot.position.y = 0.93;
    body.add(part(cap(0.25, 0.42), hood, [0, 0.44, 0], [1.14, 1, 0.84]));
    body.add(part(box, bag, [0, 0.5, 0.27], [0.42, 0.5, 0.2]), part(box, dark, [0, 0.5, 0.375], [0.26, 0.2, 0.02]));
    head.position.set(0, 1.0, 0); body.add(head);
    head.add(part(sph, skin, [0, 0, 0], [0.2, 0.215, 0.2]));
    const hr = part(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hair, [0, 0.015, 0.012], [0.213, 0.225, 0.213]); hr.rotation.x = 0.42; head.add(hr);
    for (const x of [-0.075, 0.075]) head.add(part(sph, dark, [x, 0.02, -0.185], [0.027, 0.034, 0.02]));
    // a limb = upper segment + lower segment hinged below it, both bending around the X axis
    const limb = (x, y, r1, l1, r2, l2, mat, end) => {
      const a = new T.Group(), b = new T.Group();
      a.position.set(x, y, 0); a.add(part(cap(r1, l1), mat, [0, -(l1 / 2 + r1), 0]));
      b.position.y = -(l1 + r1 * 2) + 0.03; a.add(b);
      b.add(part(cap(r2, l2), mat, [0, -(l2 / 2 + r2), 0]), end(-(l2 + r2 * 2)));
      body.add(a); return [a, b];
    };
    const hand = (y) => part(sph, skin, [0, y + 0.02, 0], [0.075, 0.085, 0.075]);
    const foot = (y) => part(box, shoe, [0, y + 0.03, -0.06], [0.17, 0.12, 0.34]);
    const [sL, eL] = limb(-0.37, 0.78, 0.075, 0.2, 0.068, 0.2, hood, hand), [sR, eR] = limb(0.37, 0.78, 0.075, 0.2, 0.068, 0.2, hood, hand);
    const [hL, kL] = limb(-0.14, 0.02, 0.105, 0.24, 0.088, 0.24, pants, foot), [hR, kR] = limb(0.14, 0.02, 0.105, 0.24, 0.088, 0.24, pants, foot);
    g.scale.setScalar(0.92); scene.add(g);
    P = { g, pivot, body, head, sL, sR, eL, eR, hL, hR, kL, kR, phase: 0 };
    S.blob = new T.Mesh(new T.CircleGeometry(0.5, 20), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
    S.blob.rotation.x = -Math.PI / 2; S.blob.position.y = 0.02; scene.add(S.blob);
    S.dizzy = new T.Group();
    const og = new T.OctahedronGeometry(0.09), ym = new T.MeshBasicMaterial({ color: 0xffd23f });
    for (let i = 0; i < 5; i++) { const s = new T.Mesh(og, ym); s.position.set(Math.cos(i * 1.257) * 0.42, 0, Math.sin(i * 1.257) * 0.42); S.dizzy.add(s); }
    S.dizzy.visible = false; scene.add(S.dizzy);
  }

  function buildWeather() {
    const dotT = tex(32, 32, (g) => { const r = g.createRadialGradient(16, 16, 0, 16, 16, 16); r.addColorStop(0, "rgba(255,255,255,1)"); r.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = r; g.fillRect(0, 0, 32, 32); });
    const rp = new Float32Array(420 * 6), fp = new Float32Array(520 * 3);
    for (let i = 0; i < rp.length; i += 6) { rp[i] = rnd(-13, 13); rp[i + 1] = rnd(0, 18); rp[i + 2] = rnd(-36, 9); }
    for (let i = 0; i < fp.length; i += 3) { fp[i] = rnd(-13, 13); fp[i + 1] = rnd(0, 18); fp[i + 2] = rnd(-36, 9); }
    const rg = new T.BufferGeometry(); rg.setAttribute("position", new T.BufferAttribute(rp, 3));
    S.rain = new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0xd6e6ff, transparent: true, opacity: 0, depthWrite: false }));
    const fg = new T.BufferGeometry(); fg.setAttribute("position", new T.BufferAttribute(fp, 3));
    S.flakes = new T.Points(fg, new T.PointsMaterial({ color: 0xffffff, size: 0.17, map: dotT, transparent: true, opacity: 0, depthWrite: false }));
    // one pooled particle system for sparkles, dust and crash debris
    const n = 180, pos = new Float32Array(n * 3).fill(-99), col = new Float32Array(n * 3);
    const pg = new T.BufferGeometry(); pg.setAttribute("position", new T.BufferAttribute(pos, 3)); pg.setAttribute("color", new T.BufferAttribute(col, 3));
    const pts = new T.Points(pg, new T.PointsMaterial({ size: 0.24, map: dotT, vertexColors: true, transparent: true, depthWrite: false }));
    S.parts = { n, pos, col, vel: new Float32Array(n * 3), life: new Float32Array(n), next: 0, geo: pg };
    for (const o of [S.rain, S.flakes, pts]) { o.frustumCulled = false; scene.add(o); }
  }

  /* ---------- moods ---------- */
  function applyMood(k) {
    const m = MOODS[moodIdx];
    for (const c of COL) cur[c].lerp(m.c[c], k);
    for (const n of NUM) cur[n] += (m[n] - cur[n]) * k;
    cur.dir.lerp(m.v.dir, k); cur.discDir.lerp(m.v.discDir, k);
    S.skyMat.uniforms.top.value.copy(cur.top); S.skyMat.uniforms.bot.value.copy(cur.bot);
    scene.fog.color.copy(cur.fog); scene.fog.near = cur.near; scene.fog.far = cur.far;
    S.hemi.color.copy(cur.hemiSky); S.hemi.groundColor.copy(cur.hemiGnd); S.hemi.intensity = cur.hemi;
    S.sun.color.copy(cur.sunCol); S.sun.intensity = cur.sun;
    S.sun.position.copy(cur.dir).normalize().multiplyScalar(80).add(S.sun.target.position);
    renderer.toneMappingExposure = cur.exp;
    S.grassMat.color.copy(cur.grass); S.roadMat.color.copy(cur.road); S.walkMat.color.copy(cur.road).lerp(S.white, 0.4);
    S.roadMat.roughness = 0.95 - 0.62 * cur.wet; S.roadMat.metalness = 0.3 * cur.wet;
    S.stars.material.opacity = cur.stars; S.stars.visible = cur.stars > 0.02;
    S.lampMat.emissiveIntensity = cur.lamps * 3; S.headMat.emissiveIntensity = cur.lamps * 2.5; S.glowMat.opacity = cur.lamps * 0.85;
    for (const f of S.facades) f.mat.emissiveIntensity = cur.lamps * 1.3;
    S.lamp.intensity = cur.lamps * 45;
    S.cloudMat.opacity = cur.cloud; S.cloudMat.color.copy(S.white).lerp(cur.fog, 0.45);
    S.snowMat.opacity = cur.snow;
    const sv = cur.snow > 0.03; if (sv !== S.snowOn) { S.snowOn = sv; for (const s of S.snow) s.visible = sv; }
    S.rain.visible = cur.rain > 0.03; S.rain.material.opacity = 0.5 * cur.rain;
    S.flakes.visible = cur.flakes > 0.03; S.flakes.material.opacity = 0.95 * cur.flakes;
    S.disc.material.color.copy(cur.disc); S.disc.material.opacity = cur.discA; S.glow.material.color.copy(cur.disc); S.glow.material.opacity = cur.glow;
    S.disc.position.copy(cur.discDir).normalize().multiplyScalar(950); S.glow.position.copy(S.disc.position);
    S.mtMat.color.copy(S.mtBase).lerp(cur.fog, 0.6); S.capMat.color.copy(S.white).lerp(cur.fog, 0.35);
    S.domeMat.color.copy(S.domeBase).lerp(cur.fog, 0.28); S.wallMat.color.copy(S.wallBase).lerp(cur.fog, 0.3);
  }
  function weather(dt, ds) {
    if (S.rain.visible) {
      const a = S.rain.geometry.attributes.position, p = a.array;
      for (let i = 0; i < p.length; i += 6) {
        let x = p[i] - 3.5 * dt, y = p[i + 1] - 30 * dt, z = p[i + 2] + ds * 0.6;
        if (y < 0) { y += 18; x = rnd(-13, 13); }
        if (z > 9) z -= 45;
        p[i] = x; p[i + 1] = y; p[i + 2] = z; p[i + 3] = x + 0.09; p[i + 4] = y + 0.8; p[i + 5] = z;
      }
      a.needsUpdate = true;
      if (cur.rain > 0.8 && (bolt -= dt) <= 0) { bolt = rnd(8, 18); flash("#FFFFFF", 0.4); }
    }
    if (S.flakes.visible) {
      const a = S.flakes.geometry.attributes.position, p = a.array;
      for (let i = 0; i < p.length; i += 3) {
        p[i] += Math.sin(time * 1.3 + i) * 0.5 * dt; p[i + 1] -= (1.6 + (i % 7) * 0.22) * dt; p[i + 2] += ds * 0.5;
        if (p[i + 1] < 0) p[i + 1] += 18;
        if (p[i + 2] > 9) p[i + 2] -= 45;
      }
      a.needsUpdate = true;
    }
  }
  function burst(x, y, z, hex, n, pow = 3) {
    const a = S.parts, c = S.tmpC.set(hex);
    for (let j = 0; j < n; j++) {
      a.next = (a.next + 1) % a.n; const i = a.next * 3;
      a.pos[i] = x; a.pos[i + 1] = y; a.pos[i + 2] = z;
      a.vel[i] = rnd(-1, 1) * pow; a.vel[i + 1] = rnd(0.3, 1.3) * pow; a.vel[i + 2] = rnd(-1, 1) * pow;
      a.col[i] = c.r; a.col[i + 1] = c.g; a.col[i + 2] = c.b; a.life[a.next] = rnd(0.35, 0.7);
    }
    a.geo.attributes.color.needsUpdate = true;
  }
  function particles(dt, ds) {
    const a = S.parts;
    for (let j = 0; j < a.n; j++) {
      if (a.life[j] <= 0) continue;
      const i = j * 3; a.life[j] -= dt;
      if (a.life[j] <= 0) { a.pos[i + 1] = -99; continue; }
      a.vel[i + 1] -= 11 * dt;
      a.pos[i] += a.vel[i] * dt; a.pos[i + 1] += a.vel[i + 1] * dt; a.pos[i + 2] += a.vel[i + 2] * dt + ds;
    }
    a.geo.attributes.position.needsUpdate = true;
  }

  /* ---------- obstacles and pickups ---------- */
  function take(type) {
    const pool = pools[type] || (pools[type] = []);
    let m = pool.pop();
    if (!m) { m = S.make[type](); scene.add(m); }
    m.visible = true; return m;
  }
  function drop(o) { o.m.visible = false; (pools[o.type] || (pools[o.type] = [])).push(o.m); }
  function put(type, l, z, y = 0) {
    const d = S.defs[type], m = take(type);
    m.position.set(laneX(l), y, z);
    objs.push({ type, kind: d.kind, hd: d.hd, val: d.val || 0, lane: l, z, y, m, ph: rnd(0, 6) });
  }
  function trail(l, z, n) {
    for (let i = 0; i < n; i++) put(i === n - 1 && Math.random() < 0.22 ? pick(["non", "samsa"]) : "coin", l, z + (n - 1) * 1.2 - i * 2.4, 0.95);
  }
  function arc(l, z) {     // coins along the path of a jump
    const step = speed * 0.14;
    for (let i = 0; i < 5; i++) put("coin", l, z + (2 - i) * step, 0.95 + 1.5 * (1 - Math.pow((i - 2) / 2.4, 2)));
  }
  function spawnRow() {
    rows++;
    spawnIn = 13 + speed * 0.55 + rnd(0, 5);
    const z = FAR, L = [0, 1, 2].sort(() => Math.random() - 0.5), r = Math.random();
    const low = () => pick(["barrier", "crates", "melons"]), full = () => pick(["damas", "damas", "cart"]);
    if (rows < 4) { put(pick(["barrier", "crates"]), L[0], z); trail(L[1], z, 5); }
    else if (r < 0.24) { put(pick([low(), "banner", full()]), L[0], z); trail(L[1], z, 5); }
    else if (r < 0.44) { put(full(), L[0], z); put(Math.random() < 0.5 ? full() : low(), L[1], z); trail(L[2], z, 6); }
    else if (r < 0.58) { const t = low(); for (const l of L) put(t, l, z); arc(L[0], z); }
    else if (r < 0.72) { for (const l of L) put("banner", l, z); trail(L[0], z, 4); }
    else if (r < 0.88) { put(full(), L[0], z); put(low(), L[1], z); put("banner", L[2], z); arc(L[1], z); }
    else { trail(L[0], z, 4); trail(L[1], z - 11, 4); put(pick(["non", "samsa"]), L[2], z - 5, 0.95); }
  }
  // would this obstacle hit the runner in their current pose?
  const hits = (o) => o.kind === "full" || (o.kind === "low" ? py < 0.5 : !(rollT > 0 || lowT > 0));

  /* ---------- player actions ---------- */
  function doJump() {
    if (py > 0) { jumpBuf = 0.18; return; }       // remembered, fires on landing
    vy = JUMP; py = 0.001; jumpAt = time; jumpBuf = 0;
    if (rollT > 0) { rollT = 0; P.pivot.rotation.x = 0; }
    sfx("jump"); buzz("light");
  }
  function startRoll() { rollT = ROLL; rollAt = time; sfx("roll"); buzz("light"); }
  function doRoll() {
    if (py > 0) { vy = Math.min(vy, -20); fastFall = true; }   // dive, then roll on landing
    else if (rollT < 0.15) startRoll();
  }
  function move(d) {
    const nl = clamp(lane + d, 0, 2);
    if (nl === lane) return;
    const side = invuln <= 0 && objs.some((o) => o.kind !== "pick" && !o.gone && o.lane === nl && o.z + o.hd > -0.9 && o.z - o.hd < 0.9 && hits(o));
    if (side) return graze(d);
    prevLane = lane; lane = nl; laneAt = time;
    sfx("swish"); buzz("light");
  }
  function gesture() { stumbleT = 0.95; }          // looks back over the shoulder and shakes a fist
  function graze(d) {
    px += d * 0.55; speed = Math.max(V0 * 0.8, speed * 0.88); shake = 0.3;
    gesture(); sfx("bump"); buzz("warning", 40); buzz("rigid");
    burst(px + d * 0.5, 1.0, 0, "#FFFFFF", 8, 2.5); pop("Ehtiyot bo'l!", "bad");
  }
  function nearMiss() {
    coins += 3; slowmo = 0.22; gesture();
    sfx("near"); buzz("medium"); burst(px, 1.2, 0, "#FFE08A", 10, 3); pop("Zo'r! +3", "gold");
  }
  function collect(o) {
    o.gone = true; coins += o.val;
    sfx("coin"); burst(laneX(o.lane), o.y, o.z, "#FFD45A", o.val > 1 ? 10 : 4, 2.2);
    if (o.val > 1) { buzz("soft"); pop(`+${o.val}`, "gold"); }
  }
  function act(dir) {
    if (state !== "play") return;
    if (dir === "L") move(-1); else if (dir === "R") move(1); else if (dir === "U") doJump(); else doRoll();
  }
  function onKey(e) {
    const k = { ArrowLeft: "L", a: "L", ArrowRight: "R", d: "R", ArrowUp: "U", w: "U", " ": "U", ArrowDown: "D", s: "D" }[e.key];
    if (k) { e.preventDefault(); act(k); }
  }
  function bindInput() {
    window.addEventListener("keydown", onKey);
    const cv = el.cv; let id = null, sx = 0, sy = 0, lastDir = "";
    cv.addEventListener("pointerdown", (e) => { id = e.pointerId; sx = e.clientX; sy = e.clientY; lastDir = ""; try { cv.setPointerCapture(id); } catch {} });
    // the action fires while the finger is still moving, not when it lifts
    cv.addEventListener("pointermove", (e) => {
      if (e.pointerId !== id) return;
      const dx = e.clientX - sx, dy = e.clientY - sy, ax = Math.abs(dx), ay = Math.abs(dy);
      if (Math.max(ax, ay) < (lastDir ? 30 : 14)) return;
      const dir = ax > ay ? (dx > 0 ? "R" : "L") : dy < 0 ? "U" : "D";
      sx = e.clientX; sy = e.clientY;
      if (dir === lastDir) return;
      lastDir = dir; act(dir);
    });
    const end = (e) => { if (e.pointerId === id) id = null; };
    cv.addEventListener("pointerup", end); cv.addEventListener("pointercancel", end);
    cv.addEventListener("touchmove", (e) => e.preventDefault(), { passive: false });
  }
  function onHide() {
    if (document.hidden && state === "play") {
      state = "pause";
      card(`${chip("clock", "lg solid")}<h2>Pauza</h2><button class="btn-primary" data-a="go">${ic("play")} Davom etish</button>`, { go: () => { hideCard(); state = "play"; last = performance.now(); } });
    }
  }
  // plays the game by itself: used for testing
  function autopilot() {
    const ahead = (l, win) => objs.filter((o) => o.kind !== "pick" && !o.gone && o.lane === l && o.z - o.hd < 0.5 && o.z + o.hd > -win).sort((a, b) => b.z - a.z);
    const win = 3 + speed * 0.5, here = ahead(lane, win)[0];
    if (!here) return;
    if (here.kind === "full") {
      const free = [lane - 1, lane + 1].filter((l) => l >= 0 && l <= 2 && !ahead(l, win).some((o) => o.kind === "full"));
      if (free.length) move(free[0] - lane);
    } else if (-here.z - here.hd < speed * 0.12 + 0.6) {
      if (here.kind === "low") { if (py === 0) doJump(); } else if (rollT <= 0 && py === 0) startRoll();
    }
  }

  /* ---------- frame update ---------- */
  function update(dt) {
    time += dt;
    const playing = state === "play", ds = (playing ? speed : state === "menu" ? 7 : 0) * dt;
    if (playing) {
      speed = Math.min(VMAX, speed + dt * 0.2);
      dist += speed * dt;
      if (py > 0) { vy -= GRAV * dt; py += vy * dt; if (py <= 0) { py = 0; vy = 0; burst(px, 0.1, 0, "#D8C7A8", 6, 1.6); if (fastFall) { fastFall = false; startRoll(); } } }
      if (rollT > 0 && (rollT -= dt) <= 0) { rollT = 0; lowT = 0.1; P.pivot.rotation.x = 0; }
      if (lowT > 0) lowT -= dt;
      if (jumpBuf > 0) { jumpBuf -= dt; if (py === 0) doJump(); }
      if (invuln > 0) invuln -= dt;
      px += (laneX(lane) - px) * (1 - Math.exp(-dt * 16));
      if ((spawnIn -= speed * dt) <= 0) spawnRow();
      if (auto) autopilot();
    } else if (py > 0) py = Math.max(0, py - 12 * dt);
    if (crashT > 0) crashT += dt;
    if (stumbleT > 0) stumbleT -= dt;

    for (const [t, per] of S.scroll) t.offset.y = (t.offset.y + ds / per) % 1;
    for (const o of scn) { o.position.z += ds; if (o.position.z > GONE + 6) o.position.z -= LOOP; }
    for (const w of S.walkers) {
      w.position.z += ds + w.userData.v * dt;
      if (w.position.z > GONE + 6) w.position.z -= LOOP; else if (w.position.z < GONE + 6 - LOOP) w.position.z += LOOP;
      w.position.y = 0.07 + Math.abs(Math.sin(time * 9 + w.userData.ph)) * 0.05;
    }
    for (const c of S.clouds) { c.position.x += dt * 1.5; if (c.position.x > 380) c.position.x = -380; }
    for (let i = objs.length - 1; i >= 0; i--) {
      const o = objs[i]; o.z += ds; o.m.position.z = o.z;
      if (o.kind === "pick") o.m.rotation.y = time * 4 + o.ph;
      if (o.gone || o.z > GONE) { drop(o); objs.splice(i, 1); }
    }
    if (playing) collide();

    const want = moodOverride == null ? slotMood() : moodOverride;
    if (want !== moodIdx) { moodIdx = want; if (playing) pop(MOODS[want].name); }
    applyMood(1 - Math.exp(-dt * 1.4));
    weather(dt, ds); particles(dt, ds); pose(dt); cam(dt);
    if (playing) hud();
  }
  function collide() {
    for (const o of objs) {
      if (o.gone || o.done) continue;
      const dx = Math.abs(laneX(o.lane) - px);
      if (o.kind === "pick") { if (Math.abs(o.z) < 1.1 && dx < 0.95 && Math.abs(o.y - (py + 0.9)) < 1.25) collect(o); continue; }
      const near = o.z + o.hd > -0.4 && o.z - o.hd < 0.4;
      if (near && !o.seen) {
        o.seen = true;       // a last-moment jump, roll or dodge counts as a near miss
        o.nm = (o.lane === lane && ((o.kind === "low" && time - jumpAt < 0.16) || (o.kind === "high" && time - rollAt < 0.14))) || (o.kind === "full" && o.lane === prevLane && o.lane !== lane && time - laneAt < 0.26);
      }
      if (near && dx < 0.85 && invuln <= 0 && hits(o)) return crash();
      if (o.z - o.hd > 0.4) { o.done = true; if (o.nm) nearMiss(); }
    }
  }
  function pose(dt) {
    const A = P, k = 1 - Math.exp(-dt * 22), down = crashT > 0;
    A.phase += dt * (state === "play" ? 6 + speed * 0.4 : state === "menu" ? 10 : 0);
    const s = Math.sin(A.phase), c = Math.cos(A.phase + 0.4);
    // hips, knees, shoulders, forearms; z = arms spread sideways
    let hl = s * 0.95, hr = -s * 0.95, kl = 0.15 + 1.25 * Math.max(0, c), kr = 0.15 + 1.25 * Math.max(0, -c);
    let sl = -s * 0.85, sr = s * 0.85, fl = 1.3, fr = 1.3, zl = -0.1, zr = 0.1;
    let lean = -0.16, pivY = 0.93 + Math.abs(Math.cos(A.phase)) * 0.05, headY = 0, twist = 0, wob = 0, pz = 0;
    if (down) {                               // knocked onto the back, legs in the air
      const e = 1 - Math.pow(1 - clamp(crashT / 0.4, 0, 1), 2);
      A.pivot.rotation.x = 1.4 * e; pivY = 0.93 - 0.62 * e; pz = 1.1 * e; lean = 0;
      hl = 0.9; hr = 0.5; kl = 0.7; kr = 0.4; sl = 2.7; sr = 2.4; zl = -0.5; zr = 0.5; fl = 0.3; fr = 0.5;
    } else if (rollT > 0) {                   // tucked forward somersault
      A.pivot.rotation.x = -Math.PI * 2 * (1 - rollT / ROLL); pivY = 0.5; lean = -0.5;
      hl = hr = 1.9; kl = kr = 2.2; sl = sr = 1.3; fl = fr = 1.9;
    } else {
      A.pivot.rotation.x += (0 - A.pivot.rotation.x) * k;
      if (py > 0.02) {
        pivY = 0.93; lean = -0.06;
        if (vy > 0) { hl = 1.15; kl = 1.35; hr = -0.55; kr = 1.2; sl = -0.9; sr = 1.9; }
        else { hl = 0.5; kl = 0.5; hr = -0.2; kr = 0.6; sl = 0.4; sr = 0.4; zl = -1.0; zr = 1.0; fl = fr = 0.4; }
      }
    }
    if (stumbleT > 0 && !down) {
      const e = Math.sin(Math.PI * clamp(1 - stumbleT / 0.95, 0, 1));
      headY = -2.3 * e; twist = -0.55 * e; wob = Math.sin(time * 26) * 0.1 * e;
      sr += (0.3 - sr) * e; zr = 0.1 + 2.25 * e; fr += (0.7 + 0.5 * Math.sin(time * 34) - fr) * e;
    }
    const dx = laneX(lane) - px, R = (o, a, v) => { o.rotation[a] += (v - o.rotation[a]) * k; };
    R(A.hL, "x", hl); R(A.hR, "x", hr); R(A.kL, "x", -kl); R(A.kR, "x", -kr);
    R(A.sL, "x", sl); R(A.sR, "x", sr); R(A.sL, "z", zl); R(A.sR, "z", zr); R(A.eL, "x", fl); R(A.eR, "x", fr);
    R(A.body, "x", lean); R(A.head, "y", headY); R(A.pivot, "z", -dx * 0.2 + wob); R(A.pivot, "y", -dx * 0.22 + twist);
    A.pivot.position.y += (pivY - A.pivot.position.y) * k;
    A.g.position.set(px, py, A.g.position.z + (pz - A.g.position.z) * k);
    A.g.visible = invuln <= 0 || Math.floor(time * 16) % 2 === 0;
    S.blob.position.set(px, 0.02, A.g.position.z); S.blob.scale.setScalar(Math.max(0.4, 1 - py * 0.3));
    S.dizzy.visible = down && crashT > 0.35;
    if (S.dizzy.visible) { S.dizzy.position.set(px, 0.95, A.g.position.z + 1.05); S.dizzy.rotation.y = time * 5; }
  }
  function cam(dt) {
    const k = 1 - Math.exp(-dt * 9);
    camX += ((state === "menu" ? Math.sin(time * 0.35) * 1.1 : px * 0.62) - camX) * k;
    shake = Math.max(0, shake - dt * 1.7);
    kick += ((state === "play" ? clamp((speed - V0) / (VMAX - V0), 0, 1) * 7 : 0) - kick) * k;
    camera.position.set(camX + (Math.random() - 0.5) * shake * 0.8, CAM_Y + py * 0.2 + (Math.random() - 0.5) * shake * 0.6, CAM_Z);
    camera.lookAt(camX * 1.2, 1.3 + py * 0.12, -10);
    camera.fov = baseFov + kick; camera.updateProjectionMatrix();
  }
  function loop(now) {
    if (!alive) return;
    raf = requestAnimationFrame(loop);
    const raw = Math.min(0.1, (now - last) / 1000); last = now;
    let dt = Math.min(0.05, raw);
    if (root.clientWidth !== W || root.clientHeight !== H) resize();
    if (state === "play" && !quality.done && !document.hidden) {     // slow phone: drop shadows and resolution
      quality.sum += raw;
      if (++quality.n >= 150) { quality.done = true; if (quality.sum / quality.n > 0.027) lowQuality(); }
    }
    if (slowmo > 0) { slowmo -= dt; dt *= 0.4; }
    update(dt);
    renderer.render(scene, camera);
  }

  /* ---------- game flow ---------- */
  function reset() {
    for (const o of objs) drop(o);
    objs = [];
    speed = V0; dist = 0; coins = 0; hearts = HEARTS; spawnIn = 26; rows = 0;
    lane = prevLane = 1; px = py = vy = 0; fastFall = false;
    rollT = lowT = jumpBuf = invuln = stumbleT = crashT = slowmo = shake = 0;
    laneAt = jumpAt = rollAt = -9;
    if (P) { P.pivot.rotation.set(0, 0, 0); P.g.position.set(0, 0, 0); }
    hud(true);
  }
  function showMenu() {
    state = "menu";
    const m = MOODS[moodIdx], mins = Math.ceil((SLOT_MS - (Date.now() % SLOT_MS)) / 60000);
    card(`
      <button class="run-mood" data-a="mood">${ic(m.icon)}<b>${m.name}</b><small>${moodOverride == null ? `${mins} daqiqadan keyin almashadi` : "ko'rib chiqish"}</small>${ic("chev")}</button>
      <h2>Chorsu Run</h2>
      <p>Bozor ko'chasi bo'ylab yugur, to'siqlardan o't va tanga yig'.</p>
      <div class="run-help"><span>${ic("sides")}<small>yo'lak</small></span><span>${ic("up")}<small>sakrash</small></span><span>${ic("down")}<small>umbaloq</small></span></div>
      <div class="run-best">${ic("trophy")} Eng yaxshi natija: <b>${best()}</b></div>
      <button class="btn-primary" data-a="play">${ic("play")} O'ynash</button>`,
      { play, mood: () => { moodOverride = moodIdx = (moodIdx + 1) % MOODS.length; showMenu(); } }, "sheet");
  }
  function play() {
    reset(); state = "play"; hideCard(); sfx("ok"); buzz("medium");
    el.hint.innerHTML = `<span>${ic("sides")}yo'lak</span><span>${ic("up")}sakrash</span><span>${ic("down")}umbaloq</span>`;
    el.hint.className = "run-hint show";
    clearTimeout(hintTimer); hintTimer = setTimeout(() => { if (alive) el.hint.className = "run-hint"; }, 4500);
    last = performance.now();
  }
  function crash() {
    state = "dead"; hearts--; crashT = 0.001; rollT = 0; fastFall = false; shake = 0.7; slowmo = 0.25;
    flash("#FF5A5F", 0.45); sfx("crash"); buzz("error", [90, 50, 180]); buzz("heavy");
    burst(px, 1.1, -0.4, "#FFFFFF", 26, 4.5); burst(px, 0.4, -0.3, "#D8C7A8", 14, 3);
    hud();
    clearTimeout(flowTimer);
    flowTimer = setTimeout(() => { if (alive && state === "dead") hearts > 0 ? showMath() : gameOver(); }, 1050);
  }
  function mathQ() {
    const r = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    let text, ans;
    switch (r(0, 4)) {
      case 0: { const a = r(12, 79), b = r(3, 19); text = `${a} + ${b}`; ans = a + b; break; }
      case 1: { const a = r(20, 90), b = r(3, 19); text = `${a} − ${b}`; ans = a - b; break; }
      case 2: { const a = r(2, 9), b = r(3, 9); text = `${a} × ${b}`; ans = a * b; break; }
      case 3: { const a = r(3, 24); text = `${a} × 0,5`; ans = a / 2; break; }
      default: { const b = r(2, 9), q = r(2, 9); text = `${b * q} ÷ ${b}`; ans = q; }
    }
    const step = Number.isInteger(ans) ? 1 : 0.5, set = new Set([ans]);
    while (set.size < 3) { const v = ans + pick([1, 2, 10, -1, -2, -10]) * step; if (v >= 0) set.add(v); }
    return { text, ans, opts: [...set].sort(() => Math.random() - 0.5) };
  }
  function showMath() {
    state = "math";
    const q = mathQ();
    card(`
      <span class="run-cap">Tez hisob</span>
      <div class="run-math">${q.text} = ?</div>
      <div class="run-timer"><i></i></div>
      <div class="run-opts">${q.opts.map((v) => `<button data-a="o" data-v="${v}">${num(v)}</button>`).join("")}</div>
      <p class="run-rule">To'g'ri javob: +${STAKE} tanga · Xato: −${STAKE} tanga</p>`,
      { o: (b) => answer(q, Number(b.dataset.v), b) });
    clearTimeout(flowTimer);
    flowTimer = setTimeout(() => { if (alive && state === "math") answer(q, null, null); }, 9000);
  }
  function answer(q, v, btn) {
    if (state !== "math") return;
    state = "answered"; clearTimeout(flowTimer);
    const ok = v === q.ans;
    el.ov.querySelectorAll('[data-a="o"]').forEach((b) => { b.disabled = true; if (Number(b.dataset.v) === q.ans) b.classList.add("ok"); });
    if (btn && !ok) btn.classList.add("bad");
    coins = Math.max(0, coins + (ok ? STAKE : -STAKE)); hud();
    pop(ok ? `+${STAKE} tanga` : `−${STAKE} tanga`, ok ? "gold" : "bad"); sfx(ok ? "ok" : "bad"); buzz(ok ? "success" : "warning");
    flowTimer = setTimeout(() => { if (alive) resume(); }, 950);
  }
  function resume() {
    hideCard();
    for (const o of objs) if (o.z > -45) o.gone = true;      // clear the road just ahead
    crashT = 0; py = vy = 0; rollT = lowT = jumpBuf = stumbleT = 0; P.pivot.rotation.x = 0;
    invuln = 2; speed = Math.max(V0, speed * 0.85); spawnIn = Math.max(spawnIn, 16);
    state = "play"; last = performance.now(); pop("Davom et!");
  }
  function gameOver() {
    state = "over";
    const s = score(), b = best(), isBest = s > b;
    if (isBest) store.set("run_best", s);
    const me = [store.get("school", "Sening maktabing"), user.first_name || "Sen", Math.max(s, b)];
    const board = [...SCHOOL_BOARD, me].sort((a, c) => c[2] - a[2]);
    card(`
      ${chip(isBest ? "trophy" : "flag", "lg solid")}
      <h2>${isBest ? "Yangi rekord!" : "O'yin tugadi"}</h2>
      <div class="run-score">${s}</div>
      <p>${Math.floor(dist)} m · ${coins} tanga</p>
      <div class="run-board">
        <b>Haftalik maktablar reytingi</b>
        ${board.slice(0, 7).map((r, i) => `<div class="${r === me ? "me" : ""}"><span>${i + 1}</span><span>${r[1]}<small>${r[0]}</small></span><b>${r[2]}</b></div>`).join("")}
        <small class="run-prize">${ic("gift")} Hafta g'olibi maktabiga: Premium kurslar</small>
      </div>
      <button class="btn-primary" data-a="play">${ic("refresh")} Qayta o'ynash</button>
      <button class="btn-ghost" data-a="share">Do'stlarni chaqirish</button>`,
      { play, share: () => share(s) });
    if (isBest) {
      buzz("success");
      for (let i = 0; i < 28; i++) { const c = document.createElement("i"); c.className = "run-conf"; c.style.cssText = `left:${rnd(2, 98)}%;background:${pick(["#FFC233", "#2748F5", "#12995B", "#E5484D", "#FFFFFF"])};animation-delay:${rnd(0, 0.5)}s`; el.fx.appendChild(c); setTimeout(() => c.remove(), 2600); }
    }
  }
  function share(s) {
    const link = `https://t.me/${BOT}?start=run_${user.id}`;
    const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`Chorsu Run'da ${s} ball to'pladim. Meni yenga olasanmi?`)}`;
    if (tg && tg.openTelegramLink) tg.openTelegramLink(url); else window.open(url, "_blank");
  }
  function exit() { location.hash = "#/"; }

  // test hooks: the hidden preview pane throttles animation frames, so tests step the game by hand
  function _sim(sec, pilot = true) {
    const was = auto; auto = pilot;
    for (let i = 0; i < sec * 60 && state === "play"; i++) update(1 / 60);
    auto = was; renderer.render(scene, camera);
    return { state, dist: Math.floor(dist), coins, hearts, speed: Math.round(speed), objs: objs.length };
  }
  function _mood(i) { moodOverride = moodIdx = i; applyMood(1); renderer.render(scene, camera); return MOODS[i].name; }

  return { mount, unmount, play, exit, _sim, _mood, _act: act, _info: () => ({ state, hearts, coins, calls: renderer && renderer.info.render.calls }) };
})();

const SCHOOL_BOARD = [
  ["Xiva sh. 3-IDUM", "Dilnoza", 4820], ["Toshkent, 110-maktab", "Jasur", 4310], ["Samarqand sh. 12-maktab", "Madina", 3975],
  ["Andijon sh. 5-IDUM", "Sardor", 3540], ["Buxoro sh. 21-maktab", "Kamola", 3120], ["Namangan sh. 34-maktab", "Bekzod", 2760],
];
